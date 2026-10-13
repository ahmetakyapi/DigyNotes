/**
 * Transactional e-mail through Resend's HTTP API (plain fetch, no SDK).
 * Env: RESEND_API_KEY, EMAIL_FROM (e.g. `DigyNotes <noreply@digynotes.com>`).
 * Without RESEND_API_KEY, development logs the message's link to the server console so
 * the flow can be tested locally; production logs an error (never the link) and fails.
 */

import { getSiteUrl } from "@/lib/metadata";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "DigyNotes <onboarding@resend.dev>";

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(message: EmailMessage, devLogLine: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email] RESEND_API_KEY yok, e-posta gönderilmedi. ${devLogLine}`);
      return true;
    }
    console.error("[email] RESEND_API_KEY is not set; e-mail was not sent:", message.subject);
    return false;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[email] Resend responded with status", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Resend request failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

export function buildPasswordResetUrl(token: string) {
  return new URL(`/reset-password?token=${encodeURIComponent(token)}`, getSiteUrl()).toString();
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  token: string;
}): Promise<boolean> {
  const resetUrl = buildPasswordResetUrl(input.token);
  const name = input.name.trim() || "merhaba";
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);

  const text = [
    `Merhaba ${name},`,
    "",
    "DigyNotes hesabın için bir şifre sıfırlama isteği aldık. Yeni şifreni belirlemek için bu bağlantıyı aç:",
    resetUrl,
    "",
    "Bağlantı 60 dakika geçerli ve yalnızca bir kez kullanılabilir.",
    "Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.",
    "",
    "DigyNotes",
  ].join("\n");

  const html = `<!doctype html>
<html lang="tr">
  <body style="margin:0;padding:0;background:#f1ede4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#14130f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1ede4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#faf8f3;border:1px solid #d8d1c3;border-radius:20px;padding:36px 32px;">
            <tr>
              <td>
                <p style="margin:0 0 28px;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Digy<span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;">Notes</span></p>
                <h1 style="margin:0 0 12px;font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-0.03em;">Şifreni Sıfırla</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3d3a33;">Merhaba ${safeName},</p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3a33;">DigyNotes hesabın için bir şifre sıfırlama isteği aldık. Yeni şifreni belirlemek için aşağıdaki butona dokun.</p>
                <p style="margin:0 0 28px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#5b42d6;color:#faf8f3;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:999px;">Yeni Şifre Belirle</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b665c;">Bağlantı 60 dakika geçerli ve yalnızca bir kez kullanılabilir. Buton çalışmazsa bu adresi tarayıcına yapıştır:</p>
                <p style="margin:0 0 28px;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${safeUrl}" style="color:#5b42d6;">${safeUrl}</a></p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6b665c;">Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendEmail(
    { to: input.to, subject: "DigyNotes şifre sıfırlama bağlantın", html, text },
    `Şifre sıfırlama bağlantısı (${input.to}): ${resetUrl}`
  );
}
