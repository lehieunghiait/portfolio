import type { Post } from "../posts";

export const post: Post = {
  slug: "clerk-auth-static-site-cloudflare-worker",
  topic: "web",
  date: "2026-10-25",
  cover: "/blog/clerk-auth-static-site-cloudflare-worker/cover.svg",
  tags: ["Auth", "Clerk", "Cloudflare Workers", "Security"],
  content: {
    vi: {
      title: "Đăng nhập và phân quyền cho website tĩnh với Clerk + Cloudflare Worker",
      excerpt:
        "Website xuất file tĩnh không có máy chủ, vậy kiểm tra đăng nhập ở đâu? Cách tôi làm trang quản trị hộp thư cho portfolio này: Clerk lo đăng nhập ở trình duyệt, Worker xác minh token và vai trò ở mỗi request.",
      body: [
        {
          type: "p",
          text: "Website này là Next.js xuất file tĩnh trên Cloudflare Pages: không có máy chủ, không có middleware. Tin nhắn từ form liên hệ được một Cloudflare Worker lưu vào cơ sở dữ liệu D1. Tôi cần một trang /admin để đọc các tin nhắn đó, và chỉ mình tôi được đọc.",
        },
        {
          type: "p",
          text: "Câu hỏi đầu tiên: trang tĩnh thì ai cũng tải được HTML và JavaScript, vậy chặn ở đâu? Câu trả lời là không chặn ở trang, mà chặn ở dữ liệu. Trang /admin chỉ là một cái vỏ; dữ liệu nằm sau API của Worker, và Worker kiểm tra quyền ở mỗi request.",
        },
        { type: "h2", text: "1. Bức tranh tổng thể" },
        {
          type: "figure",
          src: "/blog/clerk-auth-static-site-cloudflare-worker/auth-flow-vi.svg",
          alt: "Luồng đăng nhập: trình duyệt đăng nhập với Clerk, lấy session token, gọi Worker kèm Bearer token; Worker xác minh token, tra vai trò qua Clerk Backend API rồi mới đọc D1",
          caption: "Trình duyệt chỉ mang token; mọi quyết định cho phép hay không nằm ở Worker.",
        },
        {
          type: "ul",
          items: [
            "Clerk: lo giao diện đăng nhập, phiên làm việc, xác thực hai lớp. Ở trình duyệt dùng @clerk/react.",
            "Trang /admin (tĩnh): hiện form đăng nhập, sau khi đăng nhập thì gọi API kèm session token.",
            "Cloudflare Worker: xác minh token bằng secret key, kiểm tra vai trò admin, rồi mới truy vấn D1.",
          ],
        },
        { type: "h2", text: "2. Phía trình duyệt: không có máy chủ thì định tuyến bằng hash" },
        {
          type: "p",
          text: "Component <SignIn> của Clerk mặc định dùng định tuyến theo đường dẫn (/admin/sign-in/...), thứ cần máy chủ trả về đúng trang cho mọi đường dẫn con. Với site tĩnh, dùng routing=\"hash\" để các bước đăng nhập nằm sau dấu #:",
        },
        {
          type: "code",
          lang: "tsx",
          code: `import { ClerkProvider, Show, SignIn } from "@clerk/react";

export function AdminApp() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/admin">
      <Show when="signed-out"><SignIn routing="hash" /></Show>
      <Show when="signed-in"><Inbox /></Show>
    </ClerkProvider>
  );
}`,
        },
        {
          type: "p",
          text: "Khi gọi API, lấy session token bằng getToken() và gửi trong header Authorization. Token này là JWT ngắn hạn, được Clerk tự làm mới:",
        },
        {
          type: "code",
          lang: "tsx",
          code: `const { getToken } = useAuth();

async function api(path: string, init: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(\`\${endpoint}\${path}\`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\`, ...init.headers },
  });
  if (!res.ok) throw new Error(\`\${res.status}\`);
  return res.json();
}`,
        },
        {
          type: "note",
          text: "Ở trình duyệt, tôi vẫn ẩn hộp thư nếu tài khoản không phải admin, nhưng đó chỉ là để hiển thị cho đẹp. Ai cũng sửa được JavaScript ở trình duyệt; kiểm tra thật phải ở Worker.",
        },
        { type: "h2", text: "3. Phía Worker: ba lớp kiểm tra" },
        {
          type: "figure",
          src: "/blog/clerk-auth-static-site-cloudflare-worker/defense-vi.svg",
          alt: "Các lớp kiểm tra của Worker: CORS chỉ cho origin của site, chữ ký và hạn token, nguồn phát hành token (azp), vai trò admin, cuối cùng mới tới D1",
          caption: "Request phải qua hết các lớp mới chạm được tới dữ liệu.",
        },
        {
          type: "p",
          text: "Worker dùng @clerk/backend. verifyToken kiểm tra chữ ký, thời hạn, và authorizedParties: token phải được phát cho đúng website của bạn (claim azp), để token lấy từ một site khác dùng chung instance Clerk không xài được ở đây.",
        },
        {
          type: "code",
          lang: "ts",
          code: `import { createClerkClient, verifyToken } from "@clerk/backend";

async function requireAdmin(request: Request, env: Env): Promise<string | Response> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\\s+/i, "");
  if (!token) return json(401, { error: "unauthenticated" });

  let userId: string;
  try {
    // Trả về nội dung token; token sai, hết hạn hoặc khác nguồn thì ném lỗi
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: ["https://hieunghiagroup.online"],
    });
    userId = payload.sub;
  } catch (e) {
    return json(401, { error: "invalid_token", reason: (e as { reason?: string }).reason });
  }

  // Vai trò nằm trong publicMetadata: chỉ đặt được từ dashboard hoặc API phía máy chủ
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const user = await clerk.users.getUser(userId);
  if ((user.publicMetadata as { role?: string }).role !== "admin") return json(403, { error: "forbidden" });
  return userId;
}`,
        },
        {
          type: "ul",
          items: [
            "401 (chưa xác thực): không có token, token sai hoặc hết hạn.",
            "403 (không có quyền): token hợp lệ nhưng không phải admin.",
            "Vai trò để ở publicMetadata, không để ở unsafeMetadata: người dùng tự sửa được unsafeMetadata từ trình duyệt.",
            "Secret key là secret của Worker (wrangler secret put CLERK_SECRET_KEY), không bao giờ nằm trong mã nguồn hay ở trình duyệt.",
          ],
        },
        { type: "h2", text: "4. CORS: chỉ site của mình được gọi" },
        {
          type: "p",
          text: "Trang và Worker ở hai origin khác nhau, nên Worker phải trả header CORS. Chỉ trả cho origin nằm trong danh sách cho phép, và dùng luôn danh sách đó làm authorizedParties để hai chỗ không lệch nhau:",
        },
        {
          type: "code",
          lang: "ts",
          code: `function cors(origin: string | null, env: Env) {
  return origin && allowedOrigins(env).includes(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        Vary: "Origin",
      }
    : {};
}`,
        },
        {
          type: "note",
          text: "CORS chỉ ngăn trình duyệt của người khác đọc phản hồi; nó không phải lớp xác thực. curl vẫn gọi được Worker, nên việc kiểm tra token ở trên mới là thứ bảo vệ dữ liệu.",
        },
        { type: "h2", text: "5. Lỗi tôi đã gặp: invalid_token với mọi request" },
        {
          type: "p",
          text: "Ban đầu mọi request đều bị 401 dù đã đăng nhập đúng. Nguyên nhân: tôi viết code theo dạng const { data, errors } = await verifyToken(...), trong khi hàm verifyToken được export từ @clerk/backend trả thẳng về nội dung token và ném lỗi khi token không hợp lệ. data luôn là undefined nên code coi như token sai.",
        },
        {
          type: "ul",
          items: [
            "Đọc kỹ kiểu trả về của đúng hàm bạn import; cùng tên hàm có thể có nhiều dạng ở các gói khác nhau.",
            "Trả về reason của TokenVerificationError (ví dụ token-expired, token-invalid-authorized-parties) trong phản hồi lỗi. Nhờ vậy tìm ra lỗi trong vài phút thay vì đoán mò.",
            "Bọc verifyToken trong try/catch: token méo mó mà không bắt lỗi sẽ làm Worker sập (lỗi 1101) thay vì trả 401.",
          ],
        },
        { type: "h2", text: "6. Vài việc nên làm thêm" },
        {
          type: "ul",
          items: [
            "Trong Clerk, chuyển chế độ đăng ký sang Restricted để người lạ không tạo được tài khoản.",
            "Đặt trang /admin là noindex và chặn trong robots.txt; không đưa vào sitemap.",
            "Dùng instance production của Clerk (khóa pk_live_/sk_live_) khi chạy thật; khóa test có giới hạn và hiện nhãn Development.",
            "Nếu lỡ để lộ secret key (dán vào chat, commit nhầm), tạo khóa mới ngay rồi cập nhật lại secret của Worker.",
          ],
        },
        { type: "h2", text: "Kết luận" },
        {
          type: "p",
          text: "Website tĩnh vẫn có thể có khu vực riêng tư an toàn: trang chỉ là giao diện, còn dữ liệu nằm sau một API kiểm tra token, nguồn phát hành và vai trò ở mỗi request. Clerk lo phần khó (đăng nhập, phiên, 2FA), Worker giữ phần quan trọng (quyết định ai được đọc gì), và không cần dựng máy chủ nào.",
        },
      ],
    },
    en: {
      title: "Authentication and authorization for a static site with Clerk + a Cloudflare Worker",
      excerpt:
        "A statically exported site has no server, so where do you check who's signed in? How I built the admin inbox for this portfolio: Clerk handles sign-in in the browser, and a Worker verifies the token and role on every request.",
      body: [
        {
          type: "p",
          text: "This site is a static Next.js export on Cloudflare Pages: no server, no middleware. Contact-form messages are stored in a D1 database by a Cloudflare Worker. I wanted an /admin page to read those messages, and only I should be able to read them.",
        },
        {
          type: "p",
          text: "The first question: anyone can download a static page's HTML and JavaScript, so where do you block access? The answer is not at the page but at the data. /admin is just a shell; the data sits behind the Worker's API, and the Worker checks permissions on every request.",
        },
        { type: "h2", text: "1. The big picture" },
        {
          type: "figure",
          src: "/blog/clerk-auth-static-site-cloudflare-worker/auth-flow-en.svg",
          alt: "Sign-in flow: the browser signs in with Clerk, gets a session token and calls the Worker with a Bearer token; the Worker verifies it, looks up the role via the Clerk Backend API, then reads D1",
          caption: "The browser only carries the token; every allow-or-deny decision happens in the Worker.",
        },
        {
          type: "ul",
          items: [
            "Clerk handles the sign-in UI, sessions and two-factor auth. The browser uses @clerk/react.",
            "The /admin page (static) shows the sign-in form and, once signed in, calls the API with the session token.",
            "The Cloudflare Worker verifies the token with the secret key, checks the admin role, and only then queries D1.",
          ],
        },
        { type: "h2", text: "2. In the browser: no server, so use hash routing" },
        {
          type: "p",
          text: "Clerk's <SignIn> uses path routing by default (/admin/sign-in/...), which needs a server to serve every sub-path. On a static site, use routing=\"hash\" so the sign-in steps live after the #:",
        },
        {
          type: "code",
          lang: "tsx",
          code: `import { ClerkProvider, Show, SignIn } from "@clerk/react";

export function AdminApp() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/admin">
      <Show when="signed-out"><SignIn routing="hash" /></Show>
      <Show when="signed-in"><Inbox /></Show>
    </ClerkProvider>
  );
}`,
        },
        {
          type: "p",
          text: "To call the API, get a session token with getToken() and send it in the Authorization header. It's a short-lived JWT that Clerk refreshes for you:",
        },
        {
          type: "code",
          lang: "tsx",
          code: `const { getToken } = useAuth();

async function api(path: string, init: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(\`\${endpoint}\${path}\`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\`, ...init.headers },
  });
  if (!res.ok) throw new Error(\`\${res.status}\`);
  return res.json();
}`,
        },
        {
          type: "note",
          text: "The browser still hides the inbox for non-admin accounts, but that's cosmetic. Anyone can change JavaScript in their browser; the real check belongs in the Worker.",
        },
        { type: "h2", text: "3. In the Worker: three layers of checks" },
        {
          type: "figure",
          src: "/blog/clerk-auth-static-site-cloudflare-worker/defense-en.svg",
          alt: "The Worker's layers: CORS for the site's origin only, token signature and expiry, the token's issuing party (azp), the admin role, and only then D1",
          caption: "A request has to pass every layer before it touches the data.",
        },
        {
          type: "p",
          text: "The Worker uses @clerk/backend. verifyToken checks the signature, the expiry and authorizedParties: the token must have been issued for your site (the azp claim), so a token from another site on the same Clerk instance doesn't work here.",
        },
        {
          type: "code",
          lang: "ts",
          code: `import { createClerkClient, verifyToken } from "@clerk/backend";

async function requireAdmin(request: Request, env: Env): Promise<string | Response> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\\s+/i, "");
  if (!token) return json(401, { error: "unauthenticated" });

  let userId: string;
  try {
    // Returns the token payload; throws if the token is bad, expired or from another origin
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: ["https://hieunghiagroup.online"],
    });
    userId = payload.sub;
  } catch (e) {
    return json(401, { error: "invalid_token", reason: (e as { reason?: string }).reason });
  }

  // The role lives in publicMetadata, which only the dashboard or a server-side API can set
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const user = await clerk.users.getUser(userId);
  if ((user.publicMetadata as { role?: string }).role !== "admin") return json(403, { error: "forbidden" });
  return userId;
}`,
        },
        {
          type: "ul",
          items: [
            "401 (unauthenticated): no token, or a bad or expired one.",
            "403 (forbidden): a valid token, but not an admin.",
            "Keep the role in publicMetadata, not unsafeMetadata: users can edit unsafeMetadata from the browser.",
            "The secret key is a Worker secret (wrangler secret put CLERK_SECRET_KEY), never in source code or the browser.",
          ],
        },
        { type: "h2", text: "4. CORS: only my site may call it" },
        {
          type: "p",
          text: "The page and the Worker are on different origins, so the Worker must send CORS headers. Send them only for allow-listed origins, and reuse the same list as authorizedParties so the two never drift apart:",
        },
        {
          type: "code",
          lang: "ts",
          code: `function cors(origin: string | null, env: Env) {
  return origin && allowedOrigins(env).includes(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        Vary: "Origin",
      }
    : {};
}`,
        },
        {
          type: "note",
          text: "CORS only stops other people's browsers from reading the response; it isn't authentication. curl can still call the Worker, which is why the token checks above are what actually protect the data.",
        },
        { type: "h2", text: "5. The bug I hit: invalid_token on every request" },
        {
          type: "p",
          text: "At first every request got a 401, even when signed in correctly. The cause: I wrote const { data, errors } = await verifyToken(...), but the verifyToken exported from @clerk/backend returns the token payload directly and throws when the token is invalid. data was always undefined, so the code treated every token as bad.",
        },
        {
          type: "ul",
          items: [
            "Read the return type of the exact function you import; the same name can have different shapes in different packages.",
            "Return the TokenVerificationError reason (e.g. token-expired, token-invalid-authorized-parties) in the error response. That turns hours of guessing into minutes.",
            "Wrap verifyToken in try/catch: an uncaught malformed token crashes the Worker (error 1101) instead of returning 401.",
          ],
        },
        { type: "h2", text: "6. A few more things worth doing" },
        {
          type: "ul",
          items: [
            "In Clerk, set sign-ups to Restricted so strangers can't create accounts.",
            "Mark /admin noindex, disallow it in robots.txt and keep it out of the sitemap.",
            "Use a production Clerk instance (pk_live_/sk_live_ keys) for real use; test keys have limits and show a Development badge.",
            "If a secret key leaks (pasted into a chat, committed by mistake), rotate it immediately and update the Worker secret.",
          ],
        },
        { type: "h2", text: "Takeaway" },
        {
          type: "p",
          text: "A static site can still have a secure private area: the page is only UI, and the data sits behind an API that checks the token, the issuing party and the role on every request. Clerk handles the hard parts (sign-in, sessions, 2FA), the Worker keeps the important part (deciding who can read what), and there's no server to run.",
        },
      ],
    },
  },
};
