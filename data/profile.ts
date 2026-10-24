// Toàn bộ nội dung CV nằm ở file này — chỉ cần sửa ở đây, giao diện tự cập nhật.
// Thông tin chung ở `shared`; phần chữ cần dịch nằm ở `content.vi` và `content.en`.
// LƯU Ý: đây là dữ liệu MẪU, hãy thay bằng thông tin thật.

export type Lang = "vi" | "en";
export const langs: Lang[] = ["vi", "en"];

export type Experience = {
  role: string;
  company: string;
  period: string;
  location?: string;
  highlights: string[];
};

export type Project = {
  name: string;
  description: string;
  tech: string[];
  link?: string;
};

export type Education = {
  school: string;
  degree: string;
  period: string;
  note?: string;
};

type Content = {
  title: string;
  // Tiêu đề lớn ở trang chủ: phần cố định + các cụm từ tự gõ luân phiên
  tagline: string;
  taglineWords: string[];
  summary: string;
  location: string;
  stats: { value: string; label: string }[];
  skills: { group: string; items: string[] }[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  languages: { name: string; level: string }[];
};

const shared = {
  name: "Lê Hiếu Nghĩa",
  // Ảnh trong thư mục public/: ảnh dọc 4:5 cho đầu trang, ảnh vuông khuôn mặt cho ảnh tròn nhỏ
  photo: "/avatar.jpg",
  photoFace: "/avatar-face.jpg",
  // Hiện huy hiệu "Đang tìm kiếm cơ hội mới" ở đầu trang (đặt false để ẩn)
  available: true,
  email: "lehieunghia2402@gmail.com",
  // Để trống ("") thì số điện thoại sẽ không hiển thị
  phone: "",
  website: "https://hieunghiagroup.online",
  // Thêm link thật của bạn, ví dụ:
  // { label: "GitHub", url: "https://github.com/ten-cua-ban" },
  // { label: "LinkedIn", url: "https://www.linkedin.com/in/ten-cua-ban" },
  links: [] as { label: string; url: string }[],
};

const content: Record<Lang, Content> = {
  vi: {
    title: "Software Engineer",
    tagline: "Tôi xây dựng sản phẩm web",
    taglineWords: ["hiệu năng cao.", "dễ mở rộng.", "tinh gọn.", "bền vững."],
    summary:
      "Kỹ sư phần mềm full-stack, chuyên về TypeScript, React/Next.js và Node.js. Tôi tham gia trọn vòng đời sản phẩm — từ phân tích yêu cầu, thiết kế giải pháp đến triển khai và vận hành — với ưu tiên là mã nguồn rõ ràng, hiệu năng ổn định và trải nghiệm người dùng nhất quán.",
    location: "Việt Nam",
    stats: [
      { value: "3+", label: "Năm kinh nghiệm" },
      { value: "10+", label: "Dự án đã triển khai" },
      { value: "5+", label: "Công nghệ cốt lõi" },
    ],
    skills: [
      { group: "Frontend", items: ["TypeScript", "React", "Next.js", "HTML/CSS"] },
      { group: "Backend", items: ["Node.js", "REST API", "PostgreSQL"] },
      { group: "Hạ tầng & DevOps", items: ["Cloudflare", "Docker", "Git", "CI/CD"] },
    ],
    experience: [
      {
        role: "Software Engineer",
        company: "Tên công ty A",
        period: "2024 — Hiện tại",
        location: "Hà Nội",
        highlights: [
          "Phát triển và bảo trì các ứng dụng web phục vụ khách hàng, đảm bảo tính ổn định khi vận hành.",
          "Tối ưu hiệu năng tải trang, cải thiện rõ rệt tốc độ phản hồi và trải nghiệm người dùng.",
          "Phối hợp chặt chẽ với đội Thiết kế và Sản phẩm, từ khâu định hình yêu cầu đến khi phát hành tính năng.",
        ],
      },
      {
        role: "Junior Developer",
        company: "Tên công ty B",
        period: "2022 — 2024",
        location: "TP. Hồ Chí Minh",
        highlights: [
          "Xây dựng hệ thống giao diện quản trị nội bộ bằng React.",
          "Thiết kế và phát triển API, viết kiểm thử tự động cho các dịch vụ backend.",
        ],
      },
    ],
    projects: [
      {
        name: "Hieu Nghia Group",
        description: "Website doanh nghiệp, triển khai trên hạ tầng Cloudflare Pages với tên miền riêng và HTTPS.",
        tech: ["HTML", "CSS", "Cloudflare Pages"],
        link: "https://hieunghiagroup.online",
      },
      {
        name: "Portfolio & CV",
        description: "Trang hồ sơ cá nhân song ngữ Việt – Anh, hỗ trợ giao diện sáng/tối và xuất CV ra PDF.",
        tech: ["Next.js", "TypeScript", "Cloudflare Pages"],
      },
    ],
    education: [
      { school: "Tên trường đại học", degree: "Cử nhân Công nghệ Thông tin", period: "2018 — 2022" },
    ],
    languages: [
      { name: "Tiếng Việt", level: "Bản ngữ" },
      { name: "Tiếng Anh", level: "Thành thạo trong công việc" },
    ],
  },

  en: {
    title: "Software Engineer",
    tagline: "I build web products that are",
    taglineWords: ["fast & scalable.", "user-focused.", "production-ready.", "built to last."],
    summary:
      "Full-stack software engineer specializing in TypeScript, React/Next.js and Node.js. I work across the entire product lifecycle — from requirements and solution design to deployment and operations — with a focus on clean code, reliable performance and consistent user experiences.",
    location: "Vietnam",
    stats: [
      { value: "3+", label: "Years of experience" },
      { value: "10+", label: "Projects shipped" },
      { value: "5+", label: "Core technologies" },
    ],
    skills: [
      { group: "Frontend", items: ["TypeScript", "React", "Next.js", "HTML/CSS"] },
      { group: "Backend", items: ["Node.js", "REST API", "PostgreSQL"] },
      { group: "Infrastructure & DevOps", items: ["Cloudflare", "Docker", "Git", "CI/CD"] },
    ],
    experience: [
      {
        role: "Software Engineer",
        company: "Company A",
        period: "2024 — Present",
        location: "Hanoi",
        highlights: [
          "Develop and maintain customer-facing web applications with a focus on production stability.",
          "Optimize page-load performance, noticeably improving responsiveness and user experience.",
          "Partner closely with Design and Product teams from requirements definition through feature release.",
        ],
      },
      {
        role: "Junior Developer",
        company: "Company B",
        period: "2022 — 2024",
        location: "Ho Chi Minh City",
        highlights: [
          "Built internal administration interfaces with React.",
          "Designed and developed APIs, and wrote automated tests for backend services.",
        ],
      },
    ],
    projects: [
      {
        name: "Hieu Nghia Group",
        description: "Corporate website deployed on Cloudflare Pages with a custom domain and HTTPS.",
        tech: ["HTML", "CSS", "Cloudflare Pages"],
        link: "https://hieunghiagroup.online",
      },
      {
        name: "Portfolio & CV",
        description: "Bilingual (Vietnamese – English) personal portfolio with light/dark themes and PDF CV export.",
        tech: ["Next.js", "TypeScript", "Cloudflare Pages"],
      },
    ],
    education: [
      { school: "University name", degree: "Bachelor of Information Technology", period: "2018 — 2022" },
    ],
    languages: [
      { name: "Vietnamese", level: "Native" },
      { name: "English", level: "Professional working proficiency" },
    ],
  },
};

export function getProfile(lang: Lang) {
  return { ...shared, ...content[lang] };
}
