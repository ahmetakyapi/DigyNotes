import assert from "node:assert/strict";
import test from "node:test";

import { getSiteUrl, toAbsoluteUrl } from "../src/lib/metadata.ts";

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "NEXTAUTH_URL",
  "VERCEL",
];

function withEnv(values, fn) {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  try {
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, values);
    fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

test("getSiteUrl drops trailing slashes and whitespace", () => {
  withEnv({ NEXT_PUBLIC_SITE_URL: " https://digynotes.example/ " }, () => {
    assert.equal(getSiteUrl(), "https://digynotes.example");
    assert.equal(`${getSiteUrl()}/posts/p_1`, "https://digynotes.example/posts/p_1");
    assert.equal(toAbsoluteUrl("/discover"), "https://digynotes.example/discover");
  });
  withEnv({ NEXTAUTH_URL: "http://localhost:4300//" }, () => {
    assert.equal(getSiteUrl(), "http://localhost:4300");
  });
});

test("getSiteUrl skips empty values and localhost leftovers on Vercel", () => {
  withEnv(
    {
      NEXT_PUBLIC_SITE_URL: "/",
      VERCEL: "1",
      VERCEL_PROJECT_PRODUCTION_URL: "digynotes.example",
      NEXTAUTH_URL: "http://localhost:4300",
    },
    () => {
      assert.equal(getSiteUrl(), "https://digynotes.example");
    }
  );
  withEnv({}, () => {
    assert.equal(getSiteUrl(), "http://localhost:3000");
  });
});
