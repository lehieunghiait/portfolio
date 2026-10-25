// Bài viết blog. Mỗi bài có bản tiếng Việt và tiếng Anh.
// Nội dung là danh sách khối: đoạn văn (p), tiêu đề phụ (h2), danh sách (ul), khối code (code), ghi chú (note).
// Mỗi bài nằm trong một file ở data/blog/. Muốn thêm bài mới: tạo file mới rồi thêm vào mảng `posts` (bài mới nhất đặt lên đầu).
import type { Lang } from "./profile";
import { post as awsBankingArchitecture } from "./blog/aws-banking-microservices-architecture";
import { post as idempotentPaymentApi } from "./blog/idempotent-payment-api";
import { post as bankingSagaOutbox } from "./blog/banking-saga-outbox";
import { post as nextjsCloudflare } from "./blog/nextjs-static-cloudflare-pages";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "code"; lang?: string; code: string }
  | { type: "note"; text: string };

export type Post = {
  slug: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  content: Record<Lang, { title: string; excerpt: string; body: Block[] }>;
};

export const posts: Post[] = [awsBankingArchitecture, idempotentPaymentApi, bankingSagaOutbox, nextjsCloudflare];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
