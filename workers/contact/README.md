# portfolio-contact

Worker nhận form liên hệ của portfolio và gửi email tới chủ trang qua Cloudflare Email Service.

- Chống spam: Cloudflare Turnstile (bí mật `TURNSTILE_SECRET`) + ô bẫy bot.
- Chỉ gửi được tới địa chỉ trong `destination_address` (đã xác minh, miễn phí).
- Email Sending dùng tên miền phụ `cf-bounce.hieunghiagroup.online`; bản ghi MX gốc (Microsoft 365) không bị thay đổi.

```bash
cd workers/contact
npx wrangler deploy
npx wrangler secret put TURNSTILE_SECRET   # dán secret key của widget Turnstile
npx wrangler tail                          # xem log khi thử gửi form
```
