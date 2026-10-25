import {
  siCloudflare, siDocker, siGit, siGithubactions, siHtml5, siNextdotjs, siNodedotjs,
  siOpenapiinitiative, siPostgresql, siReact, siTypescript, type SimpleIcon,
} from "simple-icons";
import s from "./tech-marquee.module.css";

// Logo cho từng kỹ năng trong data/profile.ts (khớp theo tên). Kỹ năng chưa có logo hiện chấm tròn.
// Thêm kỹ năng mới: import icon từ "simple-icons" (tra tên tại simpleicons.org) và thêm vào đây.
const ICONS: Record<string, SimpleIcon> = {
  "TypeScript": siTypescript,
  "React": siReact,
  "Next.js": siNextdotjs,
  "HTML/CSS": siHtml5,
  "Node.js": siNodedotjs,
  "REST API": siOpenapiinitiative,
  "PostgreSQL": siPostgresql,
  "Cloudflare": siCloudflare,
  "Docker": siDocker,
  "Git": siGit,
  "CI/CD": siGithubactions,
};

// Màu thương hiệu quá tối (ví dụ Next.js màu đen) sẽ không thấy trên nền tối -> dùng màu chữ
function brandColor(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.15 ? "var(--text)" : `#${hex}`;
}

function Item({ name }: { name: string }) {
  const icon = ICONS[name];
  return (
    <li className={s.item} style={{ "--brand": icon ? brandColor(icon.hex) : "var(--accent)" } as React.CSSProperties}>
      {icon ? (
        <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} /></svg>
      ) : (
        <span className={s.dot} aria-hidden="true" />
      )}
      {name}
    </li>
  );
}

// Hai hàng logo công nghệ chạy ngược chiều nhau; mỗi hàng lặp danh sách 2 lần để chạy liền mạch
export function TechMarquee({ items, label }: { items: string[]; label: string }) {
  const rows = [items, [...items].reverse()];
  return (
    <section className={s.marquee} aria-label={label}>
      {rows.map((row, r) => (
        <div key={r} className={`${s.row} ${r === 1 ? s.reverse : ""}`}>
          <div className={s.track}>
            {[0, 1].map((copy) => (
              <ul key={copy} className={s.list} aria-hidden={r === 1 || copy === 1 ? true : undefined}>
                {row.map((name) => <Item key={name} name={name} />)}
              </ul>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
