// Tạo file CV PDF (tiếng Việt và tiếng Anh) từ trang /cv và /en/cv sau khi build.
// Dùng Chrome đã cài trên máy qua puppeteer-core. Chạy tự động trong `npm run build`.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import puppeteer from "puppeteer-core";

const OUT = join(process.cwd(), "out");
const PDFS = [
  { page: "/cv", file: "Le-Hieu-Nghia-CV-en.pdf" },
  { page: "/vi/cv", file: "Le-Hieu-Nghia-CV-vi.pdf" },
];
const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

const chrome = CHROME_PATHS.find((p) => existsSync(p));
if (!chrome) {
  // Trên CI bắt buộc phải có PDF, nếu không trang deploy sẽ có liên kết "Tải CV" bị hỏng
  if (process.env.CI) {
    console.error("✗ Không tìm thấy Chrome trên CI — không thể tạo CV PDF.");
    process.exit(1);
  }
  console.warn("⚠ Không tìm thấy Chrome — bỏ qua bước tạo CV PDF (đặt biến CHROME_PATH để chỉ định).");
  process.exit(0);
}

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain" };

// Máy chủ tĩnh tối giản phục vụ thư mục out/ (đường dẫn /cv -> cv.html như Cloudflare Pages)
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  for (const candidate of [path, `${path}.html`, join(path, "index.html")]) {
    const file = join(OUT, candidate);
    if (!file.startsWith(OUT)) break;
    try {
      if ((await stat(file)).isFile()) {
        res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
        return res.end(await readFile(file));
      }
    } catch {}
  }
  res.writeHead(404).end();
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

// Runner Linux của CI chặn sandbox của Chrome, nên tắt sandbox khi chạy trên CI
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: process.env.CI ? ["--no-sandbox"] : [] });
try {
  const page = await browser.newPage();
  // Luôn xuất bản sáng, không phụ thuộc giao diện của máy
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  for (const { page: path, file } of PDFS) {
    await page.goto(base + path, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: join(OUT, file), format: "A4", printBackground: true, preferCSSPageSize: true });
    console.log(`✓ ${file}`);
  }
} finally {
  await browser.close();
  server.close();
}
