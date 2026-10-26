export class ClientApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
    this.payload = payload;
  }
}

const SESSION_EXPIRED_MESSAGE = "Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.";
const NETWORK_ERROR_MESSAGE = "Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.";

function isStatusMatch(status: number, expected: number | number[]) {
  return Array.isArray(expected) ? expected.includes(status) : status === expected;
}

function normalizeApiMessage(message: string, status: number, fallbackMessage: string) {
  const trimmed = message.trim();
  if (!trimmed) return fallbackMessage;

  if (trimmed === "Unauthorized" || trimmed === "Giriş yapmanız gerekiyor") {
    return SESSION_EXPIRED_MESSAGE;
  }

  if (trimmed === "Forbidden") {
    return "Bu işlem için yetkiniz yok.";
  }

  if (trimmed === "Missing required fields") {
    return "Lütfen zorunlu alanları doldurun.";
  }

  if (
    trimmed === "Not found" ||
    trimmed === "Post not found" ||
    trimmed === "Profile not found" ||
    trimmed === "User not found" ||
    trimmed === "Internal server error"
  ) {
    return status === 404 ? "İlgili kayıt bulunamadı." : fallbackMessage;
  }

  return trimmed;
}

async function readResponsePayload(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getPayloadMessage(payload: unknown) {
  if (!payload) return null;

  if (typeof payload === "string") return payload;

  if (typeof payload === "object") {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string") return error;

    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  return null;
}

/* Without a session the proxy answers a protected API call with a 307 to /login;
   fetch follows it and gets the login page (200 HTML) instead of JSON (ERR-RT-002). */
function isLoginRedirect(response: Response) {
  if (!response.redirected || !response.url) return false;
  try {
    return new URL(response.url).pathname === "/login";
  } catch {
    return false;
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage = "Bir hata oluştu."
): Promise<T> {
  const response = await fetch(input, init);
  if (isLoginRedirect(response)) {
    throw new ClientApiError(SESSION_EXPIRED_MESSAGE, 401, null);
  }

  const isJson = (response.headers.get("content-type") ?? "").includes("application/json");
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    // Only our JSON errors are meant for people; an HTML or text body (a 504 page) is not.
    const message = normalizeApiMessage(
      (isJson ? getPayloadMessage(payload) : null) ?? "",
      response.status,
      fallbackMessage
    );

    throw new ClientApiError(message, response.status, payload);
  }

  if (payload !== null && !isJson) {
    throw new ClientApiError(fallbackMessage, response.status, payload);
  }

  return payload as T;
}

export function isClientApiError(
  error: unknown,
  expectedStatus?: number | number[]
): error is ClientApiError {
  if (!(error instanceof ClientApiError)) {
    return false;
  }

  return expectedStatus === undefined ? true : isStatusMatch(error.status, expectedStatus);
}

export function isAuthenticationError(error: unknown) {
  return isClientApiError(error, 401);
}

export function getClientErrorMessage(error: unknown, fallbackMessage = "Bir hata oluştu.") {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  // fetch rejects with a TypeError on a network failure ("Failed to fetch", "Load failed").
  // Any other error text is English or internal, so it never reaches the screen.
  if (error instanceof TypeError) {
    return NETWORK_ERROR_MESSAGE;
  }

  return fallbackMessage;
}
