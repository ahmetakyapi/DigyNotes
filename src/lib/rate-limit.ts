import { NextRequest, NextResponse } from "next/server";

type RateLimitStoreEntry = {
  count: number;
  resetAt: number;
};

type GlobalRateLimitState = {
  entries: Map<string, RateLimitStoreEntry>;
  lastCleanupAt: number;
};

type RateLimitInput = {
  action: string;
  req: NextRequest;
  userId?: string | null;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

declare global {
  var __digyNotesRateLimitState: GlobalRateLimitState | undefined;
}

type UpstashRedisConfig = {
  url: string;
  token: string;
};

const UPSTASH_RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[2])
end

local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
  ttl = tonumber(ARGV[2])
  redis.call("PEXPIRE", KEYS[1], ARGV[2])
end

if current > tonumber(ARGV[1]) then
  return {0, current, ttl}
end

return {1, current, ttl}
`;

function getState() {
  if (!globalThis.__digyNotesRateLimitState) {
    globalThis.__digyNotesRateLimitState = {
      entries: new Map(),
      lastCleanupAt: 0,
    };
  }

  return globalThis.__digyNotesRateLimitState;
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("x-real-ip") ?? "unknown";
}

function buildRateLimitKey(action: string, req: NextRequest, userId?: string | null) {
  const actor = userId ? `user:${userId}` : `ip:${getClientIp(req)}`;
  return `ratelimit:${action}:${actor}`;
}

function cleanupExpiredEntries(now: number) {
  const state = getState();
  if (now - state.lastCleanupAt < 60_000 && state.entries.size < 500) return;

  state.entries.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      state.entries.delete(key);
    }
  });

  state.lastCleanupAt = now;
}

function toRateLimitResult(
  limit: number,
  now: number,
  success: boolean,
  count: number,
  ttlMs: number
) {
  const safeTtlMs = Math.max(0, ttlMs);
  const resetAt = now + safeTtlMs;

  return {
    success,
    limit,
    remaining: success ? Math.max(0, limit - count) : 0,
    resetAt,
    retryAfter: success ? 0 : Math.max(1, Math.ceil(safeTtlMs / 1000)),
  };
}

function consumeMemoryRateLimit({
  action,
  req,
  userId,
  limit,
  windowMs,
}: RateLimitInput): RateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const state = getState();
  const key = buildRateLimitKey(action, req, userId);
  const existing = state.entries.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + windowMs,
    };

    state.entries.set(key, nextEntry);

    return toRateLimitResult(limit, now, true, nextEntry.count, windowMs);
  }

  if (existing.count >= limit) {
    return toRateLimitResult(limit, now, false, existing.count, existing.resetAt - now);
  }

  existing.count += 1;
  state.entries.set(key, existing);

  return toRateLimitResult(limit, now, true, existing.count, existing.resetAt - now);
}

function getUpstashConfig(): UpstashRedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

async function sendUpstashCommand(config: UpstashRedisConfig, command: unknown[]) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ result?: unknown; error?: string }>;
}

async function consumeRedisRateLimit(input: RateLimitInput): Promise<RateLimitResult | null> {
  const config = getUpstashConfig();
  if (!config) {
    return null;
  }

  const now = Date.now();
  const key = buildRateLimitKey(input.action, input.req, input.userId);

  try {
    const data = await sendUpstashCommand(config, [
      "EVAL",
      UPSTASH_RATE_LIMIT_SCRIPT,
      "1",
      key,
      String(input.limit),
      String(input.windowMs),
    ]);

    if (data.error || !Array.isArray(data.result)) {
      return null;
    }

    const [successRaw, countRaw, ttlRaw] = data.result;
    const success = String(successRaw) === "1";
    const count = Number.parseInt(String(countRaw), 10);
    const ttlMs = Number.parseInt(String(ttlRaw), 10);

    if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
      return null;
    }

    return toRateLimitResult(input.limit, now, success, count, ttlMs);
  } catch {
    return null;
  }
}

export async function consumeRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const redisResult = await consumeRedisRateLimit(input);
  if (redisResult) {
    return redisResult;
  }

  return consumeMemoryRateLimit(input);
}

export function applyRateLimitHeaders(response: NextResponse, result: RateLimitResult) {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

  if (!result.success) {
    response.headers.set("Retry-After", String(result.retryAfter));
  }

  return response;
}

export function createRateLimitErrorResponse(result: RateLimitResult, message: string) {
  return applyRateLimitHeaders(
    NextResponse.json(
      {
        error: message,
        retryAfter: result.retryAfter,
      },
      { status: 429 }
    ),
    result
  );
}
