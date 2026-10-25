// Worker của portfolio:
//   POST /                      form liên hệ công khai: chống spam (Turnstile) -> lưu D1 -> gửi email
//   GET /admin/messages         danh sách tin nhắn             } chỉ người dùng Clerk có
//   PATCH /admin/messages/:id   đánh dấu đã đọc / chưa đọc     } public_metadata.role = "admin"
//   DELETE /admin/messages/:id  xóa tin nhắn                   }
import { createClerkClient, verifyToken } from "@clerk/backend";

interface Env {
  DB: D1Database;
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
  CLERK_SECRET_KEY?: string;
}

type Payload = { name?: string; email?: string; message?: string; website?: string; token?: string; lang?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const allowedOrigins = (env: Env) => env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());

function cors(origin: string | null, env: Env): Record<string, string> {
  return origin && allowedOrigins(env).includes(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        Vary: "Origin",
      }
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

// ---------- Form liên hệ công khai ----------

async function handleContact(request: Request, env: Env, headers: Record<string, string>) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid_json" }, headers);
  }

  // Ô bẫy bot bị điền -> giả vờ thành công, không lưu, không gửi
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

  const lang = body.lang === "vi" ? "vi" : "en";
  await env.DB.prepare("INSERT INTO messages (name, email, message, lang) VALUES (?, ?, ?, ?)")
    .bind(name, email, message, lang)
    .run();

  const text = `Tên: ${name}\nEmail: ${email}\nNgôn ngữ trang: ${lang.toUpperCase()}\n\n${message}`;
  const html = `<p><strong>Tên:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Ngôn ngữ trang:</strong> ${lang.toUpperCase()}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

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
    // Tin nhắn đã lưu trong D1, vẫn xem được ở /admin dù email lỗi
    const err = e as { code?: string; message?: string };
    console.error("send failed", err.code, err.message);
  }

  return json(200, { ok: true }, headers);
}

// ---------- Trang quản trị ----------

// Xác thực token phiên Clerk (Authorization: Bearer ...) và kiểm tra vai trò admin.
// Trả về userId nếu hợp lệ, hoặc Response lỗi 401/403.
async function requireAdmin(request: Request, env: Env, headers: Record<string, string>): Promise<string | Response> {
  if (!env.CLERK_SECRET_KEY) return json(503, { error: "auth_not_configured" }, headers);
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "unauthenticated" }, headers);

  let userId: string;
  try {
    // verifyToken trả về nội dung token; token sai / hết hạn / khác nguồn (azp) thì ném TokenVerificationError
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: allowedOrigins(env),
    });
    userId = payload.sub;
  } catch (e) {
    const err = e as { reason?: string; message?: string };
    console.error("verifyToken failed", err.reason, err.message);
    return json(401, { error: "invalid_token", reason: err.reason ?? "malformed" }, headers);
  }

  // Vai trò lấy từ public_metadata của người dùng (chỉ đặt được từ phía máy chủ / dashboard Clerk)
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const user = await clerk.users.getUser(userId);
  if ((user.publicMetadata as { role?: string } | undefined)?.role !== "admin") {
    return json(403, { error: "forbidden" }, headers);
  }
  return userId;
}

async function handleAdmin(request: Request, env: Env, headers: Record<string, string>, path: string) {
  const auth = await requireAdmin(request, env, headers);
  if (auth instanceof Response) return auth;

  if (path === "/admin/messages" && request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, name, email, message, lang, created_at, read_at FROM messages ORDER BY created_at DESC LIMIT 500",
    ).all();
    return json(200, { messages: results }, headers);
  }

  const match = path.match(/^\/admin\/messages\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    if (request.method === "PATCH") {
      const { read } = (await request.json().catch(() => ({}))) as { read?: boolean };
      await env.DB.prepare("UPDATE messages SET read_at = ? WHERE id = ?")
        .bind(read === false ? null : new Date().toISOString(), id)
        .run();
      return json(200, { ok: true }, headers);
    }
    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(id).run();
      return json(200, { ok: true }, headers);
    }
  }
  return json(404, { error: "not_found" }, headers);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const headers = cors(origin, env);
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (!headers["Access-Control-Allow-Origin"]) return json(403, { error: "origin_not_allowed" }, headers);

    if (path === "/" && request.method === "POST") return handleContact(request, env, headers);
    if (path.startsWith("/admin/")) return handleAdmin(request, env, headers, path);
    return json(404, { error: "not_found" }, headers);
  },
};
