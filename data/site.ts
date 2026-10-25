// Cấu hình dịch vụ bên ngoài của trang.

// Form liên hệ gửi tới Worker trong thư mục workers/contact (xem workers/contact/README.md)
export const contactEndpoint = "https://portfolio-contact.lehieunghia.workers.dev";

// Cloudflare Turnstile: khóa công khai (site key) — được phép đặt trong mã nguồn phía trình duyệt
export const turnstileSiteKey = "0x4AAAAAAFkwL2AEKjMr6Gfw";

// Clerk (đăng nhập trang /admin): khóa công khai (publishable key), an toàn để đặt phía trình duyệt.
// Khóa bí mật CLERK_SECRET_KEY chỉ nằm ở Worker (wrangler secret).
export const clerkPublishableKey = "pk_test_dGVuZGVyLWFuZW1vbmUtNDg3OC5jbGVyay5hY2NvdW50cy5kZXYk";
