import type { Post } from "../posts";

export const post: Post = {
  slug: "aws-banking-microservices-architecture",
  date: "2026-10-25",
  cover: "/blog/aws-banking-microservices-architecture/cover.svg",
  tags: ["AWS", "Architecture", "Security", "Banking"],
  content: {
    vi: {
      title: "Kiến trúc microservices ngân hàng trên AWS: bảo mật nhiều lớp, sẵn sàng cao và dễ kiểm toán",
      excerpt:
        "Một kiến trúc tham chiếu cho hệ thống ngân hàng số trên AWS — từ mạng, cổng API, nền tảng chạy service, dữ liệu, sự kiện đến giám sát và khôi phục thảm họa — kèm lý do đằng sau từng lựa chọn.",
      body: [
        {
          type: "p",
          text: "Đưa hệ thống ngân hàng lên cloud không chỉ là chuyển máy chủ sang EC2. Yêu cầu của ngành — bảo mật nhiều lớp, dữ liệu mã hóa, mọi thao tác truy vết được, hệ thống chạy liên tục kể cả khi một trung tâm dữ liệu gặp sự cố — phải được thiết kế từ đầu. Dưới đây là một kiến trúc tham chiếu tôi thấy hợp lý cho một nền tảng ngân hàng số dạng microservices, cùng các đánh đổi chính.",
        },
        {
          type: "figure",
          src: "/blog/aws-banking-microservices-architecture/architecture-vi.svg",
          alt: "Sơ đồ kiến trúc: người dùng qua CloudFront và WAF tới API Gateway, vào VPC 3 AZ chứa các service trên EKS/ECS, Aurora, MSK, ElastiCache; cột bảo mật và giám sát; kết nối Direct Connect về hệ thống tại chỗ",
          caption: "Kiến trúc tham chiếu: mọi thứ nằm trong private subnet trải trên 3 Availability Zone.",
        },
        { type: "h2", text: "1. Mạng: mặc định là riêng tư" },
        {
          type: "ul",
          items: [
            "VPC trải trên 3 Availability Zone; service và cơ sở dữ liệu chỉ nằm trong private subnet, không có địa chỉ IP công khai.",
            "Truy cập dịch vụ AWS (S3, KMS, Secrets Manager, ECR) qua VPC Endpoint để lưu lượng không đi ra Internet.",
            "Security Group theo từng service, chỉ mở đúng cổng cho đúng nguồn — ledger chỉ nhận kết nối từ payment, không phải từ mọi nơi.",
            "Kết nối tới hệ thống on-premise (core banking cũ, hệ thống thanh toán) qua Direct Connect hoặc Site-to-Site VPN, không qua Internet công cộng.",
          ],
        },
        { type: "h2", text: "2. Cổng vào: chặn càng sớm càng tốt" },
        {
          type: "p",
          text: "CloudFront đứng trước để hấp thụ lưu lượng và kết thúc TLS gần người dùng; AWS WAF lọc các mẫu tấn công phổ biến (SQL injection, bot, giới hạn tần suất theo IP); Shield bảo vệ trước DDoS. API Gateway xác thực JWT của người dùng, áp quota theo client, và với API cho đối tác (fintech, ví điện tử) có thể bật mutual TLS để đối tác phải trình chứng chỉ của mình. Xác thực lớp ngoài không thay thế phân quyền bên trong: mỗi service vẫn tự kiểm tra quyền trên từng tài nguyên.",
        },
        { type: "h2", text: "3. Nền tảng chạy service: EKS hay ECS Fargate?" },
        {
          type: "p",
          text: "EKS (Kubernetes) phù hợp khi đội ngũ đã quen Kubernetes, cần hệ sinh thái phong phú (service mesh, operator, GitOps với Argo CD) hoặc muốn khả năng di chuyển giữa các môi trường. ECS trên Fargate đơn giản hơn nhiều: không quản lý node, không nâng cấp control plane, phù hợp với đội nhỏ. Cả hai đều cho phép gán IAM role riêng cho từng service (EKS Pod Identity / IRSA, ECS task role) — đây là điều bắt buộc: service payment không được có quyền đọc secret của service khác.",
        },
        { type: "h2", text: "4. Dữ liệu: mã hóa, tách biệt và không mất" },
        {
          type: "ul",
          items: [
            "Aurora PostgreSQL Multi-AZ cho dữ liệu giao dịch: ACID, failover tự động sang AZ khác, sao lưu liên tục cho phép khôi phục về một thời điểm (point-in-time).",
            "Mỗi service một database (hoặc ít nhất một schema và user riêng) — không service nào đọc thẳng bảng của service khác.",
            "Mã hóa khi lưu trữ bằng KMS với khóa do ngân hàng quản lý (customer managed key), tách khóa theo mức độ nhạy cảm của dữ liệu.",
            "Thông tin nhạy cảm như số thẻ nên được token hóa; chỉ một vùng nhỏ được phép giữ dữ liệu gốc để thu hẹp phạm vi tuân thủ (ví dụ PCI DSS).",
            "Secrets Manager quản lý mật khẩu cơ sở dữ liệu và tự động xoay vòng; không có secret nào nằm trong mã nguồn hay biến môi trường cố định.",
          ],
        },
        { type: "h2", text: "5. Sự kiện: Kafka giữ thứ tự theo tài khoản" },
        {
          type: "p",
          text: "Amazon MSK (Kafka được quản lý) là xương sống cho sự kiện nghiệp vụ: ghi nhận giao dịch, cập nhật số dư, chống gian lận theo thời gian thực, đẩy dữ liệu sang kho phân tích. Dùng account_id làm khóa partition để các sự kiện của cùng một tài khoản luôn theo đúng thứ tự. Với luồng đơn giản hơn, SQS FIFO với MessageGroupId là account_id cũng cho đảm bảo thứ tự tương tự mà không phải vận hành Kafka. Kết hợp với Transactional Outbox để sự kiện không bao giờ lệch với dữ liệu.",
        },
        {
          type: "code",
          lang: "ts",
          code: `// Gửi sự kiện với khóa là account_id: cùng tài khoản -> cùng partition -> đúng thứ tự
await producer.send({
  topic: "ledger.entries.v1",
  messages: [{
    key: entry.accountId,
    value: JSON.stringify(entry),
    headers: { "trace-id": ctx.traceId, "schema-version": "1" },
  }],
});`,
        },
        { type: "h2", text: "6. Giám sát và kiểm toán: trả lời được “ai, làm gì, khi nào”" },
        {
          type: "ul",
          items: [
            "Truy vết phân tán bằng OpenTelemetry (AWS Distro for OpenTelemetry) gửi sang X-Ray hoặc công cụ tương thích; mỗi request mang một trace-id xuyên suốt các service và cả sự kiện Kafka.",
            "Log có cấu trúc (JSON), che dữ liệu nhạy cảm ngay tại nơi ghi log — số tài khoản, số thẻ không bao giờ xuất hiện nguyên văn.",
            "CloudTrail ghi lại mọi thao tác trên hạ tầng AWS; log kiểm toán lưu vào S3 bật Object Lock (chế độ WORM) để không ai, kể cả quản trị viên, sửa hay xóa được trong thời gian lưu giữ.",
            "Cảnh báo theo chỉ số nghiệp vụ, không chỉ CPU: tỉ lệ giao dịch thất bại, số lệnh ở trạng thái UNKNOWN, độ trễ hạch toán.",
          ],
        },
        { type: "h2", text: "7. Sẵn sàng cao và khôi phục thảm họa" },
        {
          type: "p",
          text: "Bắt đầu bằng việc thống nhất với nghiệp vụ hai con số: RTO (bao lâu phải khôi phục) và RPO (được phép mất dữ liệu trong bao lâu). Multi-AZ trong một region đã xử lý được sự cố một trung tâm dữ liệu. Để chống sự cố cả region, có thể dùng Aurora Global Database (sao chép sang region khác với độ trễ thường dưới một giây), sao chép image container và cấu hình hạ tầng bằng Infrastructure as Code (Terraform/CDK) để dựng lại môi trường nhanh chóng. Quan trọng nhất: diễn tập chuyển đổi định kỳ — một kế hoạch DR chưa từng chạy thử thì chưa phải là kế hoạch.",
        },
        {
          type: "note",
          text: "Trước khi đưa dữ liệu khách hàng lên cloud, cần đánh giá các yêu cầu pháp lý hiện hành về an toàn hệ thống thông tin trong ngành ngân hàng và về nơi lưu trữ dữ liệu cá nhân. Kiến trúc kỹ thuật tốt không thay thế cho bước đánh giá tuân thủ cùng bộ phận pháp chế và an ninh thông tin.",
        },
        {
          type: "figure",
          src: "/blog/aws-banking-microservices-architecture/disaster-recovery-vi.svg",
          alt: "Sơ đồ khôi phục thảm họa: region chính với Aurora writer trên 3 AZ, region dự phòng thu nhỏ với Aurora Global Database reader",
          caption: "Khôi phục thảm họa đa region với Aurora Global Database.",
        },
        { type: "h2", text: "8. Đừng quên chi phí" },
        {
          type: "p",
          text: "Những khoản dễ bị bỏ qua: NAT Gateway tính phí theo lượng dữ liệu (VPC Endpoint giúp giảm đáng kể), lưu lượng giữa các AZ, log lưu quá lâu trên CloudWatch (chuyển log cũ sang S3), và cụm MSK/Aurora chạy cỡ lớn cho cả môi trường test. Gắn tag chi phí theo service và môi trường ngay từ đầu để biết tiền đang đi đâu.",
        },
        { type: "h2", text: "Tóm tắt" },
        {
          type: "ul",
          items: [
            "Mạng riêng tư mặc định, VPC Endpoint, Security Group theo service.",
            "Chặn sớm ở biên: CloudFront, WAF, Shield, API Gateway với JWT/mTLS.",
            "IAM role riêng cho từng service; secret do Secrets Manager quản lý và xoay vòng.",
            "Aurora Multi-AZ + KMS, mỗi service một database, token hóa dữ liệu nhạy cảm.",
            "Kafka/SQS FIFO với khóa theo tài khoản, kết hợp Outbox.",
            "Trace xuyên suốt, log có che dữ liệu, audit log bất biến.",
            "RTO/RPO rõ ràng, IaC và diễn tập DR định kỳ.",
          ],
        },
      ],
    },
    en: {
      title: "Banking microservices on AWS: defence in depth, high availability and auditability",
      excerpt:
        "A reference architecture for a digital banking platform on AWS — network, API edge, compute, data, events, observability and disaster recovery — with the reasoning behind each choice.",
      body: [
        {
          type: "p",
          text: "Moving a banking system to the cloud is not just moving servers to EC2. The industry's requirements — layered security, encrypted data, every action traceable, and continuous operation even when a data centre fails — have to be designed in from day one. Below is a reference architecture I find sensible for a microservices-based digital banking platform, along with the main trade-offs.",
        },
        {
          type: "figure",
          src: "/blog/aws-banking-microservices-architecture/architecture-en.svg",
          alt: "Architecture diagram: users through CloudFront and WAF to API Gateway, into a 3-AZ VPC with services on EKS/ECS, Aurora, MSK and ElastiCache; security and observability columns; Direct Connect to on-premises systems",
          caption: "Reference architecture: everything lives in private subnets across three Availability Zones.",
        },
        { type: "h2", text: "1. Network: private by default" },
        {
          type: "ul",
          items: [
            "A VPC across 3 Availability Zones; services and databases live only in private subnets with no public IPs.",
            "AWS services (S3, KMS, Secrets Manager, ECR) are reached through VPC endpoints so traffic never leaves for the Internet.",
            "Per-service security groups that open only the right port to the right source — the ledger accepts connections from payment, not from everywhere.",
            "Connections to on-premises systems (legacy core banking, payment networks) go over Direct Connect or Site-to-Site VPN, not the public Internet.",
          ],
        },
        { type: "h2", text: "2. The edge: stop bad traffic as early as possible" },
        {
          type: "p",
          text: "CloudFront sits in front to absorb traffic and terminate TLS close to users; AWS WAF filters common attack patterns (SQL injection, bots, per-IP rate limits); Shield protects against DDoS. API Gateway validates user JWTs and enforces per-client quotas, and partner APIs (fintechs, e-wallets) can require mutual TLS so partners must present their own certificate. Authentication at the edge does not replace authorisation inside: every service still checks permissions on every resource.",
        },
        { type: "h2", text: "3. Compute: EKS or ECS on Fargate?" },
        {
          type: "p",
          text: "EKS (Kubernetes) fits teams that already know Kubernetes, need its ecosystem (service mesh, operators, GitOps with Argo CD) or want portability across environments. ECS on Fargate is far simpler: no nodes to manage, no control-plane upgrades — a good fit for smaller teams. Both let you give each service its own IAM role (EKS Pod Identity / IRSA, ECS task roles), and that is non-negotiable: the payment service must not be able to read another service's secrets.",
        },
        { type: "h2", text: "4. Data: encrypted, isolated and never lost" },
        {
          type: "ul",
          items: [
            "Aurora PostgreSQL Multi-AZ for transactional data: ACID, automatic failover to another AZ, and continuous backups for point-in-time recovery.",
            "Database per service (or at least a dedicated schema and user) — no service reads another service's tables directly.",
            "Encryption at rest with KMS customer-managed keys, separating keys by data sensitivity.",
            "Tokenise sensitive data such as card numbers so only a small zone ever holds the originals, shrinking compliance scope (e.g. PCI DSS).",
            "Secrets Manager stores and automatically rotates database credentials; no secret lives in source code or static environment variables.",
          ],
        },
        { type: "h2", text: "5. Events: Kafka keeps per-account ordering" },
        {
          type: "p",
          text: "Amazon MSK (managed Kafka) is the backbone for business events: recorded transactions, balance updates, real-time fraud detection, feeding the analytics platform. Use account_id as the partition key so events for the same account always stay in order. For simpler flows, SQS FIFO with MessageGroupId set to the account id gives similar ordering guarantees without running Kafka. Pair either with the Transactional Outbox so events never drift from the data.",
        },
        {
          type: "code",
          lang: "ts",
          code: `// Key by account_id: same account -> same partition -> correct order
await producer.send({
  topic: "ledger.entries.v1",
  messages: [{
    key: entry.accountId,
    value: JSON.stringify(entry),
    headers: { "trace-id": ctx.traceId, "schema-version": "1" },
  }],
});`,
        },
        { type: "h2", text: "6. Observability and audit: answer “who did what, when”" },
        {
          type: "ul",
          items: [
            "Distributed tracing with OpenTelemetry (AWS Distro for OpenTelemetry) exported to X-Ray or a compatible backend; every request carries a trace id across services and Kafka events.",
            "Structured JSON logs with sensitive data masked at the point of logging — account and card numbers never appear in clear text.",
            "CloudTrail records every action on the AWS infrastructure; audit logs land in S3 with Object Lock (WORM mode) so nobody, not even administrators, can alter or delete them during retention.",
            "Alert on business metrics, not just CPU: failed-transaction rate, number of orders in UNKNOWN state, posting latency.",
          ],
        },
        { type: "h2", text: "7. High availability and disaster recovery" },
        {
          type: "p",
          text: "Start by agreeing two numbers with the business: RTO (how quickly you must recover) and RPO (how much data you may lose). Multi-AZ within one region already handles the loss of a data centre. For a full regional outage, consider Aurora Global Database (replication to another region, typically with sub-second lag), replicated container images, and infrastructure as code (Terraform/CDK) to rebuild environments quickly. Most importantly, rehearse failover regularly — a DR plan that has never been run is not a plan.",
        },
        {
          type: "note",
          text: "Before moving customer data to the cloud, assess the current regulations on information-system security in banking and on where personal data may be stored. Good technical architecture does not replace a compliance review with your legal and information-security teams.",
        },
        {
          type: "figure",
          src: "/blog/aws-banking-microservices-architecture/disaster-recovery-en.svg",
          alt: "Disaster recovery diagram: primary region with an Aurora writer across 3 AZs, scaled-down standby region with an Aurora Global Database reader",
          caption: "Multi-region disaster recovery with Aurora Global Database.",
        },
        { type: "h2", text: "8. Don't forget cost" },
        {
          type: "p",
          text: "Easy-to-miss items: NAT Gateway data-processing charges (VPC endpoints cut these significantly), cross-AZ traffic, logs kept too long in CloudWatch (move older logs to S3), and oversized MSK/Aurora clusters in test environments. Tag costs by service and environment from day one so you know where the money goes.",
        },
        { type: "h2", text: "Takeaways" },
        {
          type: "ul",
          items: [
            "Private-by-default networking, VPC endpoints, per-service security groups.",
            "Stop threats at the edge: CloudFront, WAF, Shield, API Gateway with JWT/mTLS.",
            "One IAM role per service; secrets managed and rotated by Secrets Manager.",
            "Aurora Multi-AZ + KMS, database per service, tokenised sensitive data.",
            "Kafka / SQS FIFO keyed by account, combined with the Outbox pattern.",
            "End-to-end tracing, masked logs, immutable audit logs.",
            "Clear RTO/RPO, infrastructure as code and regular DR drills.",
          ],
        },
      ],
    },
  },
};
