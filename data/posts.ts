// Bài viết blog. Mỗi bài có bản tiếng Việt và tiếng Anh.
// Nội dung là danh sách khối: đoạn văn (p), tiêu đề phụ (h2), danh sách (ul), khối code (code), ghi chú (note), hình (figure).
// Mỗi bài nằm trong một file ở data/blog/ và thuộc một chủ đề (`topics`). Muốn thêm bài mới: tạo file mới rồi thêm vào mảng `posts` (bài mới nhất đặt lên đầu).
import type { Lang } from "./profile";
import { post as awsBankingArchitecture } from "./blog/aws-banking-microservices-architecture";
import { post as idempotentPaymentApi } from "./blog/idempotent-payment-api";
import { post as bankingSagaOutbox } from "./blog/banking-saga-outbox";
import { post as nextjsCloudflare } from "./blog/nextjs-static-cloudflare-pages";
import { post as viewTransitions } from "./blog/view-transitions-api";
import { post as clerkStaticAuth } from "./blog/clerk-auth-static-site";
import { post as aiCodingAgents } from "./blog/ai-coding-agents-workflow";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "code"; lang?: string; code: string }
  | { type: "note"; text: string }
  // Hình minh họa trong public/, thường là sơ đồ SVG theo từng ngôn ngữ (scripts/blog-art.py)
  | { type: "figure"; src: string; alt: string; caption?: string };

// Chủ đề blog: trang danh sách nhóm bài theo thứ tự khai báo ở đây
export const topics = {
  ai: {
    color: "#f472b6",
    vi: { name: "AI cho lập trình viên", description: "Làm việc cùng AI agent: quy trình, công cụ và cách giữ chất lượng." },
    en: { name: "AI for developers", description: "Working with AI agents: workflow, tooling and keeping quality high." },
  },
  web: {
    color: "#22d3ee",
    vi: { name: "Web hiện đại", description: "Giao diện, hiệu ứng và bảo mật cho ứng dụng web, kèm code từ chính trang này." },
    en: { name: "Modern web", description: "UI, motion and security for web apps, with code from this very site." },
  },
  banking: {
    color: "#8b6dff",
    vi: { name: "Hệ thống ngân hàng", description: "Thiết kế giao dịch tài chính: nhất quán dữ liệu, chịu lỗi, không trừ tiền hai lần." },
    en: { name: "Banking systems", description: "Designing financial transactions: consistency, fault tolerance, no double charges." },
  },
  cloud: {
    color: "#fbbf24",
    vi: { name: "Cloud & hạ tầng", description: "Kiến trúc trên AWS, Cloudflare và cách đưa ứng dụng lên môi trường thật." },
    en: { name: "Cloud & infrastructure", description: "Architecture on AWS and Cloudflare, and shipping apps to production." },
  },
} satisfies Record<string, { color: string } & Record<Lang, { name: string; description: string }>>;

export type TopicId = keyof typeof topics;
export const topicIds = Object.keys(topics) as TopicId[];

export type Post = {
  slug: string;
  topic: TopicId;
  date: string; // YYYY-MM-DD
  tags: string[];
  cover?: string; // ảnh bìa (không chữ) hiện ở danh sách blog và đầu bài
  content: Record<Lang, { title: string; excerpt: string; body: Block[] }>;
};

export const posts: Post[] = [
  aiCodingAgents,
  viewTransitions,
  clerkStaticAuth,
  awsBankingArchitecture,
  idempotentPaymentApi,
  bankingSagaOutbox,
  nextjsCloudflare,
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
export const postsByTopic = (topic: TopicId) => posts.filter((p) => p.topic === topic);
