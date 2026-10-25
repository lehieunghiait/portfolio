import type { Post } from "../posts";

export const post: Post = {
    slug: "nextjs-static-cloudflare-pages",
    date: "2026-10-25",
    tags: ["Next.js", "Cloudflare", "DevOps"],
    content: {
      vi: {
        title: "Đưa website Next.js tĩnh lên Cloudflare Pages: những lỗi thường gặp",
        excerpt:
          "Ghi chú thực tế khi triển khai một trang Next.js xuất file tĩnh lên Cloudflare Pages với tên miền riêng — từ lỗi 522, thiếu bản ghi DNS đến ảnh xem trước không hiển thị.",
        body: [
          {
            type: "p",
            text: "Cloudflare Pages là lựa chọn rất hợp cho một website tĩnh: miễn phí, có CDN toàn cầu và HTTPS tự động. Tuy vậy, có vài điểm dễ vướng khi lần đầu gắn tên miền riêng. Dưới đây là những lỗi tôi đã gặp khi triển khai chính trang portfolio này và cách xử lý.",
          },
          { type: "h2", text: "1. Bật chế độ xuất file tĩnh" },
          {
            type: "p",
            text: "Với trang không cần máy chủ, cấu hình Next.js xuất toàn bộ thành HTML/CSS/JS trong thư mục out/. Lưu ý một số tính năng như Partial Prerendering không dùng được ở chế độ này và sẽ làm lệnh build báo lỗi.",
          },
          {
            type: "code",
            lang: "ts",
            code: `// next.config.ts
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};`,
          },
          {
            type: "code",
            lang: "bash",
            code: "npm run build\nnpx wrangler pages deploy out --project-name ten-project --branch main",
          },
          { type: "h2", text: "2. Lỗi 522 trên địa chỉ pages.dev" },
          {
            type: "p",
            text: "Nếu ngay cả địa chỉ ten-project.pages.dev cũng báo lỗi 522, nhiều khả năng project chưa từng có bản deploy nào. Tạo project trên dashboard chưa đủ — phải tải mã nguồn lên ít nhất một lần.",
          },
          { type: "h2", text: "3. Tên miền riêng không phân giải" },
          {
            type: "p",
            text: "Tên miền đã dùng nameserver của Cloudflare nhưng trình duyệt vẫn báo không tìm thấy máy chủ? Hãy kiểm tra trực tiếp trên nameserver xem có bản ghi nào không:",
          },
          { type: "code", lang: "bash", code: "dig +short ten-mien.com @ten.ns.cloudflare.com" },
          {
            type: "p",
            text: "Nếu không có kết quả, cần gắn tên miền vào project trong mục Custom domains và tạo bản ghi CNAME trỏ về ten-project.pages.dev cho cả tên miền gốc (@) lẫn www.",
          },
          { type: "h2", text: "4. Ảnh xem trước khi chia sẻ link không hiện" },
          {
            type: "p",
            text: "Next.js tạo ảnh Open Graph với đường dẫn không có đuôi file (ví dụ /opengraph-image-abc123). Khi lưu trữ tĩnh, máy chủ có thể không biết đó là ảnh PNG. Cách khắc phục trên Cloudflare Pages là khai báo Content-Type trong file _headers:",
          },
          {
            type: "code",
            lang: "text",
            code: "/opengraph-image-*\n  Content-Type: image/png",
          },
          {
            type: "note",
            text: "Nếu tên miền bật chế độ chống bot (Bot Fight Mode hoặc I'm Under Attack), trình thu thập của Facebook, Zalo và Google cũng bị chặn — ảnh xem trước và sitemap sẽ không hoạt động dù cấu hình đúng.",
          },
          { type: "h2", text: "Tóm lại" },
          {
            type: "ul",
            items: [
              "Luôn kiểm tra địa chỉ pages.dev trước khi nghi ngờ tên miền.",
              "Dùng dig trên chính nameserver của Cloudflare để xem bản ghi DNS thật.",
              "Khai báo Content-Type cho các file không có đuôi.",
              "Rà lại các cài đặt bảo mật của tên miền khi bot hợp lệ không truy cập được.",
            ],
          },
        ],
      },
      en: {
        title: "Deploying a static Next.js site to Cloudflare Pages: common pitfalls",
        excerpt:
          "Practical notes from deploying a statically exported Next.js site to Cloudflare Pages with a custom domain — from 522 errors and missing DNS records to broken link previews.",
        body: [
          {
            type: "p",
            text: "Cloudflare Pages is a great fit for a static website: free, globally cached and HTTPS out of the box. Still, a few things are easy to trip over the first time you attach a custom domain. Here are the issues I ran into while deploying this very portfolio, and how I fixed them.",
          },
          { type: "h2", text: "1. Enable static export" },
          {
            type: "p",
            text: "For a site that needs no server, configure Next.js to export everything as HTML/CSS/JS into the out/ folder. Note that some features, such as Partial Prerendering, are not supported in this mode and will make the build fail.",
          },
          {
            type: "code",
            lang: "ts",
            code: `// next.config.ts
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};`,
          },
          {
            type: "code",
            lang: "bash",
            code: "npm run build\nnpx wrangler pages deploy out --project-name my-project --branch main",
          },
          { type: "h2", text: "2. Error 522 on the pages.dev address" },
          {
            type: "p",
            text: "If even my-project.pages.dev returns a 522 error, the project has most likely never been deployed. Creating the project in the dashboard is not enough — you have to upload the site at least once.",
          },
          { type: "h2", text: "3. The custom domain does not resolve" },
          {
            type: "p",
            text: "The domain already uses Cloudflare nameservers, yet the browser cannot find the server? Query the nameserver directly to see whether any record exists:",
          },
          { type: "code", lang: "bash", code: "dig +short example.com @name.ns.cloudflare.com" },
          {
            type: "p",
            text: "If nothing comes back, attach the domain under Custom domains and create CNAME records pointing to my-project.pages.dev for both the apex (@) and www.",
          },
          { type: "h2", text: "4. Link previews do not show an image" },
          {
            type: "p",
            text: "Next.js generates Open Graph images at paths without a file extension (for example /opengraph-image-abc123). With static hosting, the server may not know the file is a PNG. On Cloudflare Pages, declare the Content-Type in a _headers file:",
          },
          {
            type: "code",
            lang: "text",
            code: "/opengraph-image-*\n  Content-Type: image/png",
          },
          {
            type: "note",
            text: "If the domain has bot protection enabled (Bot Fight Mode or I'm Under Attack), crawlers from Facebook, Zalo and Google are blocked too — link previews and the sitemap will not work even when configured correctly.",
          },
          { type: "h2", text: "Takeaways" },
          {
            type: "ul",
            items: [
              "Always check the pages.dev address before suspecting the domain.",
              "Use dig against Cloudflare's own nameserver to see the real DNS records.",
              "Declare a Content-Type for files without an extension.",
              "Review the domain's security settings when legitimate bots cannot get through.",
            ],
          },
        ],
      },
    },
  };
