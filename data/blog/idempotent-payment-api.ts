import type { Post } from "../posts";

export const post: Post = {
  slug: "idempotent-payment-api",
    topic: "banking",
  date: "2026-10-25",
  cover: "/blog/idempotent-payment-api/cover.svg",
  tags: ["API Design", "Banking", "Node.js", "Resilience"],
  content: {
    vi: {
      title: "Thiết kế API thanh toán không trừ tiền hai lần: Idempotency key, retry và timeout",
      excerpt:
        "Mạng chập chờn, client bấm lại, gateway tự thử lại — mỗi tình huống đều có thể biến một lệnh chuyển tiền thành hai. Cách thiết kế Idempotency-Key, chính sách retry và ngân sách timeout cho API thanh toán.",
      body: [
        {
          type: "p",
          text: "Hãy hình dung: ứng dụng di động gửi lệnh chuyển 5 triệu đồng, máy chủ xử lý xong nhưng phản hồi bị mất vì người dùng đi vào thang máy. Ứng dụng thấy lỗi hết thời gian chờ và gửi lại. Nếu API không được thiết kế cẩn thận, khách hàng vừa bị trừ 10 triệu. Trong thanh toán, “gửi lại” là chuyện xảy ra hằng ngày — từ client, từ load balancer, từ service mesh — nên API phải an toàn khi bị gọi lặp.",
        },
        { type: "h2", text: "Idempotency-Key: để client tự đặt tên cho ý định" },
        {
          type: "p",
          text: "Ý tưởng: client sinh một khóa duy nhất (thường là UUID) cho mỗi ý định thanh toán và gửi kèm trong header Idempotency-Key. Mọi lần gửi lại của cùng ý định dùng lại đúng khóa đó. Máy chủ ghi nhớ khóa cùng kết quả, và lần gọi sau chỉ trả lại kết quả cũ thay vì thực hiện lại. Nhiều cổng thanh toán lớn như Stripe dùng chính cơ chế này.",
        },
        {
          type: "code",
          lang: "http",
          code: `POST /v1/transfers
Idempotency-Key: 7f3c2a9e-1b4d-4c8e-9a51-2f0d6b7e8c13
Content-Type: application/json

{ "from": "0123456789", "to": "9876543210", "amount": 5000000, "currency": "VND" }`,
        },
        {
          type: "figure",
          src: "/blog/idempotent-payment-api/sequence-vi.svg",
          alt: "Sơ đồ tuần tự: phản hồi bị mất, ứng dụng gửi lại với cùng Idempotency-Key và nhận lại kết quả cũ, tiền chỉ bị trừ một lần",
          caption: "Phản hồi bị mất không còn nguy hiểm: lần gửi lại với cùng khóa chỉ nhận lại kết quả đã lưu.",
        },
        { type: "h2", text: "Lưu khóa thế nào cho đúng" },
        {
          type: "p",
          text: "Bảng lưu khóa cần ba thứ: khóa duy nhất theo từng khách hàng (để hai khách hàng trùng khóa không ảnh hưởng nhau), dấu vân tay của request (hash nội dung) để phát hiện cùng khóa nhưng khác nội dung, và trạng thái xử lý để chặn hai request chạy song song.",
        },
        {
          type: "code",
          lang: "sql",
          code: `CREATE TABLE idempotency_keys (
  client_id     UUID        NOT NULL,
  key           TEXT        NOT NULL,
  request_hash  TEXT        NOT NULL,
  status        TEXT        NOT NULL,     -- IN_PROGRESS | COMPLETED
  response_code INT,
  response_body JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, key)
);`,
        },
        {
          type: "code",
          lang: "ts",
          code: `async function withIdempotency(req: Req, handler: () => Promise<Res>): Promise<Res> {
  const key = req.header("Idempotency-Key");
  if (!key) return { status: 400, body: { error: "idempotency_key_required" } };
  const hash = sha256(canonicalJson(req.body));

  // Chiếm khóa: chỉ một request thắng nhờ PRIMARY KEY
  const claimed = await db.query(
    \`INSERT INTO idempotency_keys (client_id, key, request_hash, status)
     VALUES ($1, $2, $3, 'IN_PROGRESS') ON CONFLICT DO NOTHING RETURNING 1\`,
    [req.clientId, key, hash],
  );

  if (claimed.rowCount === 0) {
    const row = await db.one("SELECT * FROM idempotency_keys WHERE client_id = $1 AND key = $2", [req.clientId, key]);
    if (row.request_hash !== hash) return { status: 422, body: { error: "key_reused_with_different_payload" } };
    if (row.status === "IN_PROGRESS") return { status: 409, body: { error: "request_in_progress" } };
    return { status: row.response_code, body: row.response_body }; // phát lại kết quả cũ
  }

  const res = await handler();
  await db.query(
    "UPDATE idempotency_keys SET status = 'COMPLETED', response_code = $3, response_body = $4 WHERE client_id = $1 AND key = $2",
    [req.clientId, key, res.status, res.body],
  );
  return res;
}`,
        },
        {
          type: "note",
          text: "Chỉ lưu kết quả “cuối cùng” (thành công hoặc lỗi nghiệp vụ như không đủ số dư). Với lỗi tạm thời (503, hết thời gian chờ ở hệ thống phía sau), nên xóa khóa hoặc cho phép thử lại — nếu không, client sẽ bị “khóa” vào một lỗi tạm thời mãi mãi.",
        },
        { type: "h2", text: "Retry đúng cách: backoff, jitter và chỉ thử lại khi an toàn" },
        {
          type: "ul",
          items: [
            "Chỉ tự động thử lại các thao tác idempotent: GET, hoặc POST có Idempotency-Key.",
            "Exponential backoff có jitter (ví dụ 200ms, 400ms, 800ms ± ngẫu nhiên) để hàng nghìn client không thử lại cùng một lúc sau sự cố.",
            "Giới hạn số lần thử và tổng thời gian; tôn trọng header Retry-After nếu máy chủ trả về.",
            "Không thử lại lỗi 4xx nghiệp vụ (sai dữ liệu, không đủ số dư) — thử lại không làm chúng đúng lên.",
            "Thử lại chỉ ở một tầng. Nếu client, gateway và service đều thử lại 3 lần, một sự cố có thể nhân lên 27 lần lưu lượng.",
          ],
        },
        {
          type: "figure",
          src: "/blog/idempotent-payment-api/retry-jitter-vi.svg",
          alt: "Biểu đồ so sánh số request thử lại theo thời gian khi không có jitter (dồn thành các đỉnh) và có jitter (trải đều)",
          caption: "Không có jitter, mọi client thử lại cùng lúc và tạo đỉnh tải; jitter trải đều lưu lượng.",
        },
        { type: "h2", text: "Ngân sách timeout: tầng trong phải ngắn hơn tầng ngoài" },
        {
          type: "p",
          text: "Nếu client chờ 10 giây nhưng service gọi xuống core banking với timeout 30 giây, client đã bỏ cuộc và gửi lại trong khi request cũ vẫn đang chạy — hai request song song cho cùng một ý định. Đặt timeout giảm dần từ ngoài vào trong, truyền deadline xuống các tầng dưới (ví dụ header chứa thời điểm hết hạn), và để mỗi tầng tự dừng khi deadline đã qua.",
        },
        {
          type: "code",
          lang: "text",
          code: `Mobile app      timeout 15s ──┐
  API Gateway   timeout 12s   │ mỗi tầng ngắn hơn tầng ngoài
    Payment svc timeout 10s   │ và nhận deadline từ tầng trên
      Core/Switch timeout 8s ─┘`,
        },
        {
          type: "figure",
          src: "/blog/idempotent-payment-api/timeout-budget-vi.svg",
          alt: "Biểu đồ timeout giảm dần: ứng dụng 15 giây, API Gateway 12 giây, Payment service 10 giây, Core 8 giây",
          caption: "Timeout giảm dần từ ngoài vào trong.",
        },
        { type: "h2", text: "Khi kết quả không rõ: trả về “đang xử lý”, không trả về “thất bại”" },
        {
          type: "p",
          text: "Nếu hệ thống phía sau hết thời gian chờ, API không biết tiền đã đi hay chưa. Trả về lỗi lúc này là nói dối khách hàng. Cách trung thực là trả 202 Accepted với trạng thái PROCESSING kèm mã lệnh, cung cấp endpoint tra cứu trạng thái (hoặc webhook/thông báo đẩy), còn phía máy chủ tự truy vấn lại hệ thống đối tác cho đến khi có kết quả cuối cùng.",
        },
        {
          type: "code",
          lang: "http",
          code: `HTTP/1.1 202 Accepted
Location: /v1/transfers/trf_01J9Z3K8WQ

{ "id": "trf_01J9Z3K8WQ", "status": "PROCESSING" }`,
        },
        { type: "h2", text: "Danh sách kiểm tra" },
        {
          type: "ul",
          items: [
            "Mọi API tạo giao dịch bắt buộc có Idempotency-Key, lưu theo từng khách hàng, có thời hạn (ví dụ 24–72 giờ).",
            "So sánh hash nội dung để phát hiện dùng lại khóa sai cách.",
            "Chặn request song song cùng khóa (409) thay vì xử lý hai lần.",
            "Retry có backoff và jitter, chỉ ở một tầng, chỉ cho thao tác idempotent.",
            "Timeout giảm dần từ ngoài vào trong và truyền deadline.",
            "Trạng thái PROCESSING + tra cứu cho kết quả không xác định.",
          ],
        },
      ],
    },
    en: {
      title: "Designing payment APIs that never charge twice: idempotency keys, retries and timeouts",
      excerpt:
        "Flaky networks, users tapping twice, gateways retrying on their own — each can turn one transfer into two. How to design Idempotency-Key handling, retry policies and timeout budgets for payment APIs.",
      body: [
        {
          type: "p",
          text: "Picture this: a mobile app sends a 5,000,000 VND transfer, the server processes it, but the response is lost because the user walks into an elevator. The app sees a timeout and sends the request again. Unless the API is designed carefully, the customer has just paid twice. In payments, “send it again” happens every day — from clients, load balancers and service meshes — so APIs must be safe to call repeatedly.",
        },
        { type: "h2", text: "Idempotency-Key: let the client name its intent" },
        {
          type: "p",
          text: "The idea: the client generates a unique key (usually a UUID) for each payment intent and sends it in an Idempotency-Key header. Every retry of the same intent reuses that key. The server remembers the key together with the result, and later calls simply replay the stored result instead of executing again. Large payment providers such as Stripe use exactly this mechanism.",
        },
        {
          type: "code",
          lang: "http",
          code: `POST /v1/transfers
Idempotency-Key: 7f3c2a9e-1b4d-4c8e-9a51-2f0d6b7e8c13
Content-Type: application/json

{ "from": "0123456789", "to": "9876543210", "amount": 5000000, "currency": "VND" }`,
        },
        {
          type: "figure",
          src: "/blog/idempotent-payment-api/sequence-en.svg",
          alt: "Sequence diagram: the response is lost, the app retries with the same Idempotency-Key and gets the stored result, so the customer is charged once",
          caption: "A lost response is no longer dangerous: retrying with the same key just replays the stored result.",
        },
        { type: "h2", text: "Storing keys correctly" },
        {
          type: "p",
          text: "The key store needs three things: uniqueness per client (so two clients choosing the same key don't collide), a fingerprint of the request (a hash of the body) to detect the same key reused with a different payload, and a processing state to stop two requests from running concurrently.",
        },
        {
          type: "code",
          lang: "sql",
          code: `CREATE TABLE idempotency_keys (
  client_id     UUID        NOT NULL,
  key           TEXT        NOT NULL,
  request_hash  TEXT        NOT NULL,
  status        TEXT        NOT NULL,     -- IN_PROGRESS | COMPLETED
  response_code INT,
  response_body JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, key)
);`,
        },
        {
          type: "code",
          lang: "ts",
          code: `async function withIdempotency(req: Req, handler: () => Promise<Res>): Promise<Res> {
  const key = req.header("Idempotency-Key");
  if (!key) return { status: 400, body: { error: "idempotency_key_required" } };
  const hash = sha256(canonicalJson(req.body));

  // Claim the key: the PRIMARY KEY guarantees only one request wins
  const claimed = await db.query(
    \`INSERT INTO idempotency_keys (client_id, key, request_hash, status)
     VALUES ($1, $2, $3, 'IN_PROGRESS') ON CONFLICT DO NOTHING RETURNING 1\`,
    [req.clientId, key, hash],
  );

  if (claimed.rowCount === 0) {
    const row = await db.one("SELECT * FROM idempotency_keys WHERE client_id = $1 AND key = $2", [req.clientId, key]);
    if (row.request_hash !== hash) return { status: 422, body: { error: "key_reused_with_different_payload" } };
    if (row.status === "IN_PROGRESS") return { status: 409, body: { error: "request_in_progress" } };
    return { status: row.response_code, body: row.response_body }; // replay the stored result
  }

  const res = await handler();
  await db.query(
    "UPDATE idempotency_keys SET status = 'COMPLETED', response_code = $3, response_body = $4 WHERE client_id = $1 AND key = $2",
    [req.clientId, key, res.status, res.body],
  );
  return res;
}`,
        },
        {
          type: "note",
          text: "Only store “final” outcomes (success, or business errors such as insufficient funds). For transient failures (503, downstream timeouts) delete the key or allow a retry — otherwise the client is locked into a temporary error forever.",
        },
        { type: "h2", text: "Retrying properly: backoff, jitter, and only when safe" },
        {
          type: "ul",
          items: [
            "Only retry idempotent operations automatically: GETs, or POSTs carrying an Idempotency-Key.",
            "Exponential backoff with jitter (e.g. 200ms, 400ms, 800ms ± random) so thousands of clients don't retry in lockstep after an incident.",
            "Cap attempts and total time; honour Retry-After when the server sends it.",
            "Never retry business 4xx errors (invalid data, insufficient funds) — retrying won't make them succeed.",
            "Retry at one layer only. If client, gateway and service all retry 3 times, one incident can multiply traffic 27-fold.",
          ],
        },
        {
          type: "figure",
          src: "/blog/idempotent-payment-api/retry-jitter-en.svg",
          alt: "Chart comparing retried requests over time without jitter (synchronized spikes) and with jitter (spread out)",
          caption: "Without jitter every client retries at once and creates load spikes; jitter spreads the traffic.",
        },
        { type: "h2", text: "Timeout budgets: inner layers must be shorter than outer ones" },
        {
          type: "p",
          text: "If the client waits 10 seconds but the service calls core banking with a 30-second timeout, the client gives up and retries while the original request is still running — two concurrent requests for one intent. Make timeouts shrink from the outside in, propagate a deadline downstream (for example a header carrying the expiry time), and let every layer stop on its own once the deadline has passed.",
        },
        {
          type: "code",
          lang: "text",
          code: `Mobile app      timeout 15s ──┐
  API Gateway   timeout 12s   │ each layer shorter than the one outside it,
    Payment svc timeout 10s   │ receiving the deadline from above
      Core/Switch timeout 8s ─┘`,
        },
        {
          type: "figure",
          src: "/blog/idempotent-payment-api/timeout-budget-en.svg",
          alt: "Timeout budget chart: app 15s, API Gateway 12s, payment service 10s, core 8s",
          caption: "Timeouts shrinking from the outside in.",
        },
        { type: "h2", text: "When the outcome is unknown, say “processing”, not “failed”" },
        {
          type: "p",
          text: "When a downstream system times out, the API does not know whether the money moved. Returning an error at that point misleads the customer. The honest answer is 202 Accepted with a PROCESSING status and the order id, a status endpoint (or webhook / push notification), and a server-side job that keeps querying the partner until there is a final result.",
        },
        {
          type: "code",
          lang: "http",
          code: `HTTP/1.1 202 Accepted
Location: /v1/transfers/trf_01J9Z3K8WQ

{ "id": "trf_01J9Z3K8WQ", "status": "PROCESSING" }`,
        },
        { type: "h2", text: "Checklist" },
        {
          type: "ul",
          items: [
            "Every transaction-creating API requires an Idempotency-Key, scoped per client, with an expiry (e.g. 24–72 hours).",
            "Compare body hashes to catch misused keys.",
            "Reject concurrent requests with the same key (409) instead of processing twice.",
            "Retries with backoff and jitter, at one layer, for idempotent operations only.",
            "Timeouts that shrink from the outside in, with propagated deadlines.",
            "A PROCESSING state plus status lookup for unknown outcomes.",
          ],
        },
      ],
    },
  },
};
