import type { Post } from "../posts";

export const post: Post = {
  slug: "banking-microservices-saga-outbox",
    topic: "banking",
  date: "2026-10-25",
  cover: "/blog/banking-microservices-saga-outbox/cover.svg",
  tags: ["Microservices", "Banking", "Kafka", "PostgreSQL"],
  content: {
    vi: {
      title: "Giao dịch phân tán trong microservices ngân hàng: Saga, Outbox và Idempotency",
      excerpt:
        "Khi tách core banking thành nhiều service, một lệnh chuyển tiền không còn nằm gọn trong một transaction. Bài viết phân tích cách giữ tiền không bị mất, không bị trừ hai lần bằng Saga, Transactional Outbox và consumer idempotent.",
      body: [
        {
          type: "p",
          text: "Trong một hệ thống nguyên khối, chuyển tiền giữa hai tài khoản chỉ là một transaction cơ sở dữ liệu: trừ bên A, cộng bên B, COMMIT. Khi tách thành microservices — Account, Ledger, Payment, Limit, Notification — mỗi service sở hữu cơ sở dữ liệu riêng và câu chuyện thay đổi hoàn toàn. Không còn một nút COMMIT duy nhất cho cả nghiệp vụ, trong khi yêu cầu của ngân hàng không hề giảm: không được mất tiền, không được trừ hai lần, và mọi bước phải truy vết được.",
        },
        { type: "h2", text: "Vì sao không dùng two-phase commit (2PC)?" },
        {
          type: "p",
          text: "2PC đảm bảo tính nguyên tử trên nhiều cơ sở dữ liệu, nhưng nó khóa tài nguyên trong suốt quá trình bỏ phiếu, phụ thuộc vào một bộ điều phối có thể trở thành điểm lỗi, và phần lớn message broker hiện đại (Kafka, SQS) không tham gia được. Ở lưu lượng giao dịch lớn, cái giá về độ trễ và khả năng sẵn sàng là quá cao. Hướng đi phổ biến là chấp nhận nhất quán cuối cùng (eventual consistency) nhưng thiết kế sao cho mọi trạng thái trung gian đều hợp lệ, có thể giải thích và có thể đảo ngược.",
        },
        { type: "h2", text: "Nền móng: sổ cái kép, chỉ ghi thêm" },
        {
          type: "p",
          text: "Trước khi nói về Saga, cần một mô hình dữ liệu đúng. Sổ cái (ledger) nên theo nguyên tắc bút toán kép: mỗi giao dịch gồm các dòng Nợ/Có có tổng bằng 0, và chỉ được ghi thêm, không sửa hay xóa. Sai thì ghi bút toán đảo, không UPDATE số dư. Số dư là giá trị suy ra (hoặc được cache) từ sổ cái. Nhờ vậy mọi bước bù trừ trong Saga đều để lại dấu vết kiểm toán đầy đủ.",
        },
        {
          type: "code",
          lang: "sql",
          code: `CREATE TABLE ledger_entries (
  id            BIGSERIAL PRIMARY KEY,
  journal_id    UUID        NOT NULL,          -- một giao dịch = một journal
  account_id    UUID        NOT NULL,
  amount        NUMERIC(19,4) NOT NULL,        -- dương = Có, âm = Nợ
  currency      CHAR(3)     NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Ràng buộc nghiệp vụ: tổng amount của mỗi journal_id phải bằng 0
-- (kiểm tra trong cùng transaction khi ghi journal).`,
        },
        { type: "h2", text: "Saga: chia nghiệp vụ thành các bước có bù trừ" },
        {
          type: "p",
          text: "Saga là chuỗi transaction cục bộ, mỗi bước có một hành động bù trừ (compensation) nếu các bước sau thất bại. Với lệnh chuyển tiền ra ngoài ngân hàng, một Saga điển hình:",
        },
        {
          type: "ul",
          items: [
            "1. Payment: tạo lệnh ở trạng thái PENDING.",
            "2. Limit: kiểm tra và giữ hạn mức ngày — bù trừ: hoàn hạn mức.",
            "3. Account: phong tỏa (hold) số tiền trên tài khoản nguồn — bù trừ: giải tỏa.",
            "4. Gateway: gửi lệnh sang hệ thống liên ngân hàng — bước then chốt, không thể “gỡ”.",
            "5. Ledger: hạch toán chính thức, chuyển hold thành bút toán Nợ.",
            "6. Notification: gửi thông báo — không cần bù trừ, chỉ cần thử lại.",
          ],
        },
        {
          type: "p",
          text: "Chú ý thứ tự: các bước có thể đảo ngược (giữ hạn mức, phong tỏa tiền) đặt trước, bước không thể đảo ngược (gửi lệnh ra ngoài) đặt sau cùng có thể, và các bước sau đó chỉ được phép thử lại cho đến khi thành công chứ không được thất bại. Đây là phân loại kinh điển: compensatable → pivot → retriable.",
        },
        {
          type: "figure",
          src: "/blog/banking-microservices-saga-outbox/saga-flow-vi.svg",
          alt: "Sơ đồ 6 bước của Saga chuyển tiền: 3 bước có thể bù trừ, bước gửi liên ngân hàng không thể hoàn tác, 2 bước chỉ thử lại",
          caption: "Saga chuyển tiền liên ngân hàng: hoàn tác ngược khi lỗi ở các bước đầu, không bao giờ hoàn tác sau điểm không quay lại.",
        },
        { type: "h2", text: "Orchestration hay Choreography?" },
        {
          type: "p",
          text: "Choreography để các service tự lắng nghe sự kiện của nhau — gọn khi ít bước, nhưng luồng nghiệp vụ bị rải khắp hệ thống và khó trả lời câu hỏi “lệnh này đang ở đâu?”. Với nghiệp vụ tiền tệ, tôi nghiêng về orchestration: một Saga orchestrator lưu trạng thái của từng lệnh, ra lệnh cho từng service và quyết định bù trừ. Trạng thái nằm ở một chỗ, dễ kiểm toán, dễ vận hành khi cần xử lý tay.",
        },
        {
          type: "code",
          lang: "ts",
          code: `// Định nghĩa Saga dạng khai báo: mỗi bước có action và (tuỳ chọn) compensate
const transferSaga = defineSaga<TransferCtx>("outbound-transfer", [
  { name: "reserveLimit", action: limit.reserve,    compensate: limit.release },
  { name: "holdFunds",    action: account.hold,     compensate: account.releaseHold },
  { name: "sendToSwitch", action: gateway.submit,   pivot: true },   // không thể bù trừ
  { name: "postLedger",   action: ledger.post,      retry: "forever" },
  { name: "notify",       action: notifier.send,    retry: "forever" },
]);

// Orchestrator lưu trạng thái sau mỗi bước (saga_instances), nên khi pod bị khởi động lại
// nó tiếp tục đúng từ bước dang dở thay vì chạy lại từ đầu.`,
        },
        { type: "h2", text: "Transactional Outbox: không bao giờ “ghi DB xong mà quên gửi event”" },
        {
          type: "p",
          text: "Lỗi kinh điển: service ghi DB thành công rồi publish lên Kafka, nhưng tiến trình chết giữa hai việc — DB đã đổi mà không ai biết. Hoặc ngược lại, event đã gửi nhưng transaction DB bị rollback. Outbox giải quyết bằng cách ghi event vào một bảng outbox trong CÙNG transaction với dữ liệu nghiệp vụ; một tiến trình riêng (poller hoặc CDC như Debezium đọc WAL) đẩy event ra broker.",
        },
        {
          type: "code",
          lang: "sql",
          code: `BEGIN;
  UPDATE account_holds SET status = 'ACTIVE' WHERE id = $1;
  INSERT INTO outbox (id, aggregate_id, type, payload)
  VALUES (gen_random_uuid(), $2, 'FundsHeld', $3::jsonb);
COMMIT;
-- Relay đọc outbox theo thứ tự, publish lên Kafka với key = account_id
-- (giữ thứ tự sự kiện của cùng một tài khoản trong một partition), rồi đánh dấu đã gửi.`,
        },
        {
          type: "figure",
          src: "/blog/banking-microservices-saga-outbox/outbox-vi.svg",
          alt: "Sơ đồ Transactional Outbox: service ghi dữ liệu và sự kiện trong cùng một transaction, relay đẩy sự kiện lên Kafka, consumer dùng bảng inbox",
          caption: "Outbox: dữ liệu và sự kiện cùng một COMMIT; relay đẩy lên Kafka theo khóa account_id.",
        },
        { type: "h2", text: "Consumer idempotent: chấp nhận “ít nhất một lần”" },
        {
          type: "p",
          text: "Outbox và Kafka cho đảm bảo giao ít nhất một lần (at-least-once): cùng một event có thể đến hai lần khi relay thử lại hoặc consumer rebalance. Vì vậy mọi consumer phải idempotent. Cách đơn giản và chắc chắn nhất là bảng inbox với khóa duy nhất trên message_id, ghi trong cùng transaction với tác động nghiệp vụ:",
        },
        {
          type: "code",
          lang: "sql",
          code: `BEGIN;
  INSERT INTO inbox (message_id) VALUES ($1)
  ON CONFLICT (message_id) DO NOTHING;
  -- Nếu không có dòng nào được chèn => đã xử lý trước đó, bỏ qua và COMMIT.
  -- Ngược lại mới ghi bút toán vào ledger.
COMMIT;`,
        },
        { type: "h2", text: "Trạng thái “không xác định” là bình thường" },
        {
          type: "p",
          text: "Bước gửi lệnh sang hệ thống bên ngoài có thể hết thời gian chờ mà không rõ kết quả. Đừng vội bù trừ — có thể lệnh đã thành công phía bên kia. Đưa lệnh vào trạng thái UNKNOWN, truy vấn trạng thái (inquiry) theo lịch, và chỉ bù trừ khi có xác nhận thất bại. Đây là chỗ nhiều hệ thống trừ tiền khách hàng nhưng lại báo lỗi.",
        },
        {
          type: "note",
          text: "Lưới an toàn cuối cùng luôn là đối soát (reconciliation): định kỳ so khớp sổ cái nội bộ với sao kê của đối tác và hệ thống thanh toán. Saga và Outbox giảm sai lệch xuống rất thấp, nhưng đối soát mới là thứ phát hiện được những gì thiết kế chưa lường trước.",
        },
        { type: "h2", text: "Tóm tắt" },
        {
          type: "ul",
          items: [
            "Sổ cái bút toán kép, chỉ ghi thêm; sửa sai bằng bút toán đảo.",
            "Saga với thứ tự compensatable → pivot → retriable; ưu tiên orchestration cho nghiệp vụ tiền tệ.",
            "Transactional Outbox để thay đổi dữ liệu và sự kiện luôn đi cùng nhau.",
            "Mọi consumer idempotent (bảng inbox, khóa duy nhất).",
            "Xử lý trạng thái UNKNOWN bằng truy vấn, không bù trừ vội; đối soát hằng ngày.",
          ],
        },
      ],
    },
    en: {
      title: "Distributed transactions in banking microservices: Saga, Outbox and idempotency",
      excerpt:
        "Once core banking is split into services, a money transfer no longer fits in one database transaction. How to make sure money is never lost or debited twice, using Sagas, the Transactional Outbox and idempotent consumers.",
      body: [
        {
          type: "p",
          text: "In a monolith, moving money between two accounts is one database transaction: debit A, credit B, COMMIT. Split the system into microservices — Account, Ledger, Payment, Limit, Notification — each owning its own database, and the story changes completely. There is no single COMMIT for the business operation anymore, yet the bank's requirements stay exactly the same: never lose money, never debit twice, and keep every step traceable.",
        },
        { type: "h2", text: "Why not two-phase commit (2PC)?" },
        {
          type: "p",
          text: "2PC gives atomicity across databases, but it holds locks for the whole voting phase, depends on a coordinator that can become a single point of failure, and most modern brokers (Kafka, SQS) cannot take part in it. At high transaction volumes the cost in latency and availability is too high. The common approach is to accept eventual consistency while designing every intermediate state to be valid, explainable and reversible.",
        },
        { type: "h2", text: "Foundation: an append-only, double-entry ledger" },
        {
          type: "p",
          text: "Before Sagas, you need the right data model. The ledger should follow double-entry bookkeeping: each transaction is a set of debit/credit lines that sum to zero, and lines are only ever appended — never updated or deleted. Mistakes are fixed with reversing entries, not by UPDATE-ing a balance. Balances are derived (or cached) from the ledger, so every compensation in a Saga leaves a complete audit trail.",
        },
        {
          type: "code",
          lang: "sql",
          code: `CREATE TABLE ledger_entries (
  id            BIGSERIAL PRIMARY KEY,
  journal_id    UUID        NOT NULL,          -- one transaction = one journal
  account_id    UUID        NOT NULL,
  amount        NUMERIC(19,4) NOT NULL,        -- positive = credit, negative = debit
  currency      CHAR(3)     NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Business rule: amounts of each journal_id must sum to zero
-- (checked in the same transaction that writes the journal).`,
        },
        { type: "h2", text: "Saga: split the operation into compensatable steps" },
        {
          type: "p",
          text: "A Saga is a sequence of local transactions where each step has a compensating action in case a later step fails. A typical Saga for an outbound interbank transfer:",
        },
        {
          type: "ul",
          items: [
            "1. Payment: create the order in PENDING state.",
            "2. Limit: check and reserve the daily limit — compensation: release it.",
            "3. Account: place a hold on the source account — compensation: release the hold.",
            "4. Gateway: submit to the interbank switch — the pivot, which cannot be undone.",
            "5. Ledger: post the final entries, turning the hold into a debit.",
            "6. Notification: notify the customer — no compensation, just retries.",
          ],
        },
        {
          type: "p",
          text: "Order matters: reversible steps (reserving limits, holding funds) come first, the irreversible step (sending money out) comes as late as possible, and every step after it is only allowed to retry until it succeeds — never to fail. This is the classic compensatable → pivot → retriable classification.",
        },
        {
          type: "figure",
          src: "/blog/banking-microservices-saga-outbox/saga-flow-en.svg",
          alt: "Diagram of a six-step transfer Saga: three compensatable steps, an irreversible interbank submission, and two retriable steps",
          caption: "Interbank transfer Saga: undo in reverse when early steps fail; never undo past the pivot.",
        },
        { type: "h2", text: "Orchestration or choreography?" },
        {
          type: "p",
          text: "Choreography lets services react to each other's events — neat with few steps, but the business flow ends up scattered across the system and “where is this payment right now?” becomes hard to answer. For money movement I lean towards orchestration: a Saga orchestrator persists the state of each order, commands each service and decides when to compensate. State lives in one place, which makes auditing and manual intervention much easier.",
        },
        {
          type: "code",
          lang: "ts",
          code: `// Declarative Saga: every step has an action and (optionally) a compensation
const transferSaga = defineSaga<TransferCtx>("outbound-transfer", [
  { name: "reserveLimit", action: limit.reserve,    compensate: limit.release },
  { name: "holdFunds",    action: account.hold,     compensate: account.releaseHold },
  { name: "sendToSwitch", action: gateway.submit,   pivot: true },   // cannot be compensated
  { name: "postLedger",   action: ledger.post,      retry: "forever" },
  { name: "notify",       action: notifier.send,    retry: "forever" },
]);

// The orchestrator persists state after each step (saga_instances), so a restarted pod
// resumes from the unfinished step instead of starting over.`,
        },
        { type: "h2", text: "Transactional Outbox: never “commit the DB and forget the event”" },
        {
          type: "p",
          text: "The classic bug: a service commits to its database and then publishes to Kafka, but the process dies in between — the data changed and nobody knows. Or the other way round: the event went out but the transaction rolled back. The Outbox pattern writes the event into an outbox table in the SAME transaction as the business data; a separate relay (a poller, or CDC such as Debezium reading the WAL) pushes events to the broker.",
        },
        {
          type: "code",
          lang: "sql",
          code: `BEGIN;
  UPDATE account_holds SET status = 'ACTIVE' WHERE id = $1;
  INSERT INTO outbox (id, aggregate_id, type, payload)
  VALUES (gen_random_uuid(), $2, 'FundsHeld', $3::jsonb);
COMMIT;
-- The relay reads the outbox in order, publishes to Kafka with key = account_id
-- (keeping one account's events ordered within a partition), then marks rows as sent.`,
        },
        {
          type: "figure",
          src: "/blog/banking-microservices-saga-outbox/outbox-en.svg",
          alt: "Transactional Outbox diagram: the service writes data and the event in one transaction, a relay publishes to Kafka, consumers use an inbox table",
          caption: "Outbox: data and event share one COMMIT; the relay publishes to Kafka keyed by account_id.",
        },
        { type: "h2", text: "Idempotent consumers: embrace at-least-once" },
        {
          type: "p",
          text: "Outbox plus Kafka gives at-least-once delivery: the same event can arrive twice when the relay retries or a consumer group rebalances. Every consumer must therefore be idempotent. The simplest reliable technique is an inbox table with a unique key on message_id, written in the same transaction as the business effect:",
        },
        {
          type: "code",
          lang: "sql",
          code: `BEGIN;
  INSERT INTO inbox (message_id) VALUES ($1)
  ON CONFLICT (message_id) DO NOTHING;
  -- No row inserted => already processed: skip and COMMIT.
  -- Otherwise write the ledger entries.
COMMIT;`,
        },
        { type: "h2", text: "“Unknown” is a normal state" },
        {
          type: "p",
          text: "Submitting to an external system can time out with no clear result. Do not compensate straight away — the payment may well have succeeded on the other side. Move the order to UNKNOWN, run scheduled status inquiries, and compensate only on a confirmed failure. This is exactly where many systems debit the customer and still show an error.",
        },
        {
          type: "note",
          text: "The final safety net is always reconciliation: regularly matching the internal ledger against partner and payment-network statements. Sagas and outboxes make discrepancies rare, but reconciliation is what catches the cases the design did not anticipate.",
        },
        { type: "h2", text: "Takeaways" },
        {
          type: "ul",
          items: [
            "Append-only, double-entry ledger; fix mistakes with reversing entries.",
            "Sagas ordered compensatable → pivot → retriable; prefer orchestration for money movement.",
            "Transactional Outbox so data changes and events always travel together.",
            "Idempotent consumers everywhere (inbox table, unique key).",
            "Resolve UNKNOWN states by inquiry, not hasty compensation; reconcile daily.",
          ],
        },
      ],
    },
  },
};
