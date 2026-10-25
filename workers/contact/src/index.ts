// Nhận form liên hệ (JSON), kiểm tra chống spam bằng Turnstile rồi gửi email tới chủ trang.

interface Env {
  EMAIL: {
    send(message: {
      to: string;
      from: string | { email: string; name: string };
      replyTo?: string | { email: string; name: string };
      subject: string;
      text?: string;
      html?: string;
    }): Promise<{ messageId: string }>;
  };
  TO_EMAIL: string;
  FROM_EMAIL: string;
  ALLOWED_ORIGINS: string;
  TURNSTILE_SECRET?: string;
}

type Payload = { name?: string; email?: string; message?: string; website?: string; token?: string; lang?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  return origin && allowed.includes(origin)
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
}

const json = (status: number, body: unknown, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

async function verifyTurnstile(token: string, secret: string, ip: string | null) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const headers = cors(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json(405, { error: "method_not_allowed" }, headers);
    if (!headers["Access-Control-Allow-Origin"]) return json(403, { error: "origin_not_allowed" }, headers);

    let body: Payload;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "invalid_json" }, headers);
    }

    // Ô bẫy bot bị điền -> giả vờ thành công, không gửi gì
    if (body.website) return json(200, { ok: true }, headers);

    const name = (body.name ?? "").trim().slice(0, 100);
    const email = (body.email ?? "").trim().slice(0, 200);
    const message = (body.message ?? "").trim().slice(0, 5000);
    if (!name || !EMAIL_RE.test(email) || message.length < 10) {
      return json(400, { error: "invalid_fields" }, headers);
    }

    if (env.TURNSTILE_SECRET) {
      const ok = body.token && (await verifyTurnstile(body.token, env.TURNSTILE_SECRET, request.headers.get("CF-Connecting-IP")));
      if (!ok) return json(403, { error: "captcha_failed" }, headers);
    }

    const lang = body.lang === "en" ? "EN" : "VI";
    const text = `Tên: ${name}\nEmail: ${email}\nNgôn ngữ trang: ${lang}\n\n${message}`;
    const html = `<p><strong>Tên:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Ngôn ngữ trang:</strong> ${lang}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

    try {
      await env.EMAIL.send({
        to: env.TO_EMAIL,
        from: { email: env.FROM_EMAIL, name: "Portfolio – Liên hệ" },
        replyTo: { email, name },
        subject: `[Portfolio] Tin nhắn mới từ ${name}`,
        text,
        html,
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      console.error("send failed", err.code, err.message);
      return json(502, { error: "send_failed" }, headers);
    }

    return json(200, { ok: true }, headers);
  },
};
