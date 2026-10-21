import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  ClientApiError,
  getClientErrorMessage,
  isAuthenticationError,
  requestJson,
} from "../src/lib/client-api.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Just the parts of a fetch Response that requestJson reads. */
function mockFetch({
  status = 200,
  body = "",
  contentType = "application/json",
  redirected = false,
  url = "http://localhost:4300/api/posts/1",
}) {
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: "Not Found",
    redirected,
    url,
    headers: new Headers(contentType ? { "content-type": contentType } : {}),
    text: async () => body,
  });
}

async function rejection(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  assert.fail("expected the request to fail");
}

test("requestJson returns the JSON payload", async () => {
  mockFetch({ body: JSON.stringify({ count: 2, liked: true }) });
  assert.deepEqual(await requestJson("/api/posts/1/likes"), { count: 2, liked: true });
});

test("requestJson treats the middleware's login redirect as an expired session", async () => {
  mockFetch({
    body: "<!DOCTYPE html><html></html>",
    contentType: "text/html; charset=utf-8",
    redirected: true,
    url: "http://localhost:4300/login?callbackUrl=%2Fapi%2Fposts%2F1",
  });
  const error = await rejection(
    requestJson("/api/posts/1", { method: "DELETE" }, "Not silinemedi.")
  );
  assert.ok(error instanceof ClientApiError);
  assert.equal(error.status, 401);
  assert.ok(isAuthenticationError(error));
  assert.equal(error.message, "Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.");
});

test("requestJson never resolves with an HTML or text body", async () => {
  mockFetch({ body: "<!DOCTYPE html><html></html>", contentType: "text/html" });
  const error = await rejection(
    requestJson("/api/posts", { method: "POST" }, "Not kaydedilemedi.")
  );
  assert.ok(error instanceof ClientApiError);
  assert.equal(error.message, "Not kaydedilemedi.");
});

test("requestJson shows the Turkish fallback, not a raw error page", async () => {
  mockFetch({
    status: 504,
    body: "An error occurred with your deployment FUNCTION_INVOCATION_TIMEOUT",
    contentType: "text/plain",
  });
  const error = await rejection(
    requestJson("/api/auth/register", undefined, "Hesap oluşturulamadı.")
  );
  assert.equal(error.status, 504);
  assert.equal(error.message, "Hesap oluşturulamadı.");
});

test("requestJson keeps JSON error messages and maps the English ones", async () => {
  mockFetch({ status: 429, body: JSON.stringify({ error: "Çok fazla deneme yaptın." }) });
  assert.equal((await rejection(requestJson("/api/x"))).message, "Çok fazla deneme yaptın.");

  mockFetch({ status: 404, body: JSON.stringify({ error: "Not found" }) });
  assert.equal((await rejection(requestJson("/api/x"))).message, "İlgili kayıt bulunamadı.");

  mockFetch({ status: 401, body: JSON.stringify({ error: "Unauthorized" }) });
  const unauthorized = await rejection(requestJson("/api/x"));
  assert.ok(isAuthenticationError(unauthorized));
  assert.equal(unauthorized.message, "Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.");

  mockFetch({ status: 404, body: "", contentType: null });
  assert.equal(
    (await rejection(requestJson("/api/x", undefined, "Yüklenemedi."))).message,
    "Yüklenemedi."
  );
});

test("getClientErrorMessage never shows browser or internal error text", () => {
  assert.equal(
    getClientErrorMessage(new TypeError("Failed to fetch"), "Hesap oluşturulamadı."),
    "Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene."
  );
  assert.equal(
    getClientErrorMessage(new Error("Feed fetch failed"), "Yüklenemedi."),
    "Yüklenemedi."
  );
  assert.equal(getClientErrorMessage(null, "Yüklenemedi."), "Yüklenemedi.");
  assert.equal(
    getClientErrorMessage(new ClientApiError("Bu işlem için yetkiniz yok.", 403, null)),
    "Bu işlem için yetkiniz yok."
  );
});
