import { createHighlighter, type Highlighter } from "shiki";

// Tô màu code lúc build (chỉ chạy phía server khi xuất trang tĩnh): HTML đã có sẵn màu, trình duyệt không tải thêm JS.
// Khối code luôn nền tối nên chỉ cần một theme tối.
const theme = "tokyo-night";
const langs = ["ts", "tsx", "js", "css", "bash", "sql", "http", "json", "yaml", "markdown"] as const;
const aliases: Record<string, string> = { md: "markdown", sh: "bash", shell: "bash" };

let highlighter: Promise<Highlighter> | undefined;

// Trả về HTML các dòng code đã tô màu (các <span> lồng trong <code>); ngôn ngữ không hỗ trợ thì trả null
export async function highlight(code: string, lang?: string): Promise<string | null> {
  const id = lang ? (aliases[lang] ?? lang) : undefined;
  if (!id || !(langs as readonly string[]).includes(id)) return null;
  highlighter ??= createHighlighter({ themes: [theme], langs: [...langs] });
  return (await highlighter).codeToHtml(code, { lang: id, theme, structure: "inline" });
}
