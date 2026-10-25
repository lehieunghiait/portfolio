// Toàn bộ nội dung CV nằm ở file này — chỉ cần sửa ở đây, giao diện tự cập nhật.
// Thông tin chung ở `shared`; phần chữ cần dịch nằm ở `content.vi` và `content.en`.

export type Lang = "vi" | "en";
// Ngôn ngữ đầu tiên là mặc định (đặt ở đường dẫn gốc)
export const langs: Lang[] = ["en", "vi"];

export type Experience = {
  role: string;
  company: string;
  period: string;
  location?: string;
  highlights: string[];
};

export type Project = {
  // Đường dẫn trang chi tiết: /projects/<slug> và /en/projects/<slug>
  slug: string;
  name: string;
  description: string;
  tech: string[];
  year: string;
  role: string;
  // Ảnh chụp màn hình trong public/ (tùy chọn)
  image?: string;
  link?: string;
  // Nội dung trang chi tiết
  context: string;
  solution: string[];
  results: string[];
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
  // Mảng chuyên môn ở mục "About & expertise": cách bạn làm việc, kèm công cụ chính
  expertise: { icon: "frontend" | "backend" | "ops"; title: string; description: string; tools: string[] }[];
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
      {
        group: "Frontend",
        items: ["TypeScript", "React", "Next.js", "HTML/CSS"],
      },
      { group: "Backend", items: ["Node.js", "REST API", "PostgreSQL"] },
      {
        group: "Hạ tầng & DevOps",
        items: ["Cloudflare", "Docker", "Git", "CI/CD"],
      },
    ],
    expertise: [
      {
        icon: "frontend",
        title: "Phát triển giao diện",
        description: "Xây dựng giao diện web nhanh, dễ dùng và hiển thị tốt trên mọi thiết bị với React và Next.js.",
        tools: ["TypeScript", "React", "Next.js"],
      },
      {
        icon: "backend",
        title: "API & backend",
        description: "Thiết kế và phát triển REST API, dịch vụ backend với Node.js và PostgreSQL, có kiểm thử tự động.",
        tools: ["Node.js", "REST API", "PostgreSQL"],
      },
      {
        icon: "ops",
        title: "Triển khai & vận hành",
        description: "Đưa ứng dụng lên môi trường thật với Docker, CI/CD và Cloudflare, đảm bảo hệ thống chạy ổn định.",
        tools: ["Docker", "CI/CD", "Cloudflare"],
      },
    ],
    experience: [
      {
        role: "Chuyên viên phát triển ứng dụng",
        company: "Ngân hàng TMCP Việt Nam Thương Tín",
        period: "2024 — Hiện tại",
        location: "TP. Hồ Chí Minh",
        highlights: [
          "Phát triển và bảo trì các ứng dụng web phục vụ khách hàng, đảm bảo tính ổn định khi vận hành.",
        ],
      },
      {
        role: "Nhân viên lập trình",
        company: "Công ty Cổ phần Phân phối Quốc tế",
        period: "2025 — 2026",
        location: "TP. Hồ Chí Minh",
        highlights: [
          "Xây dựng hệ thống giao diện quản trị nội bộ bằng React.",
          "Thiết kế và phát triển API, viết kiểm thử tự động cho các dịch vụ backend.",
        ],
      },
    ],
    projects: [
      {
        slug: "portfolio-cv",
        name: "Portfolio & CV",
        description:
          "Trang hồ sơ cá nhân song ngữ Việt – Anh, hỗ trợ giao diện sáng/tối và xuất CV ra PDF.",
        tech: ["Next.js", "TypeScript", "CSS", "Cloudflare Pages"],
        year: "2026",
        role: "Thiết kế & phát triển",
        image: "/projects/portfolio-cv.jpg",
        link: "https://hieunghiagroup.online",
        context:
          "Cần một trang hồ sơ cá nhân chuyên nghiệp để giới thiệu kinh nghiệm và dự án tới nhà tuyển dụng, đọc được bằng cả tiếng Việt lẫn tiếng Anh, đồng thời có bản CV in được.",
        solution: [
          "Xây dựng bằng Next.js (App Router) ở chế độ xuất file tĩnh, lưu trữ trên Cloudflare Pages với tên miền riêng.",
          "Song ngữ bằng hai nhóm route có root layout riêng, khai báo hreflang và sitemap để công cụ tìm kiếm hiểu đúng hai bản dịch.",
          "Giao diện sáng/tối có lưu lựa chọn, không nháy màu khi tải trang; chuyển chủ đề bằng View Transitions API.",
          "Hiệu ứng chuyển động bằng CSS scroll-driven animations, tự tắt khi người dùng bật chế độ giảm chuyển động.",
          "Ảnh xem trước khi chia sẻ link được tạo tự động lúc build; CV xuất ra PDF khổ A4.",
        ],
        results: [
          "Toàn bộ nội dung nằm trong một file dữ liệu — cập nhật CV không cần sửa giao diện.",
          "Trang tĩnh hoàn toàn, tải nhanh và không tốn chi phí máy chủ.",
        ],
      },
      {
        slug: "hieu-nghia-group",
        name: "Hieu Nghia Group",
        description: "Website giới thiệu doanh nghiệp một trang, triển khai trên Cloudflare Pages.",
        tech: ["HTML", "CSS", "Cloudflare Pages"],
        year: "2026",
        role: "Phát triển & triển khai",
        image: "/projects/hieu-nghia-group.jpg",
        context:
          "Tên miền hieunghiagroup.online đã trỏ về Cloudflare nhưng không hiển thị được trang nào. Cần tìm nguyên nhân và đưa một website giới thiệu doanh nghiệp lên mạng.",
        solution: [
          "Chẩn đoán sự cố: project Cloudflare Pages chưa từng được deploy (lỗi 522) và tên miền thiếu bản ghi DNS.",
          "Xây dựng website một trang bằng HTML/CSS thuần, hỗ trợ giao diện sáng/tối và hiển thị tốt trên điện thoại.",
          "Deploy bằng Wrangler, gắn tên miền riêng và cấu hình bản ghi CNAME cho tên miền gốc và www.",
        ],
        results: [
          "Tên miền hoạt động trở lại với HTTPS; về sau được dùng để đặt trang portfolio này.",
        ],
      },
    ],
    education: [
      {
        school: "Trường Đại học Công Nghệ TP. Hồ Chí Minh",
        degree: "Cử nhân Công nghệ Thông tin",
        period: "2020 — 2025",
      },
    ],
    languages: [
      { name: "Tiếng Việt", level: "Bản ngữ" },
      { name: "Tiếng Anh", level: "Thành thạo trong công việc" },
    ],
  },

  en: {
    title: "Software Engineer",
    tagline: "I build web products that are",
    taglineWords: [
      "fast & scalable.",
      "user-focused.",
      "production-ready.",
      "built to last.",
    ],
    summary:
      "Full-stack software engineer specializing in TypeScript, React/Next.js and Node.js. I work across the entire product lifecycle — from requirements and solution design to deployment and operations — with a focus on clean code, reliable performance and consistent user experiences.",
    location: "Vietnam",
    stats: [
      { value: "3+", label: "Years of experience" },
      { value: "10+", label: "Projects shipped" },
      { value: "5+", label: "Core technologies" },
    ],
    skills: [
      {
        group: "Frontend",
        items: ["TypeScript", "React", "Next.js", "HTML/CSS"],
      },
      { group: "Backend", items: ["Node.js", "REST API", "PostgreSQL"] },
      {
        group: "Infrastructure & DevOps",
        items: ["Cloudflare", "Docker", "Git", "CI/CD"],
      },
    ],
    expertise: [
      {
        icon: "frontend",
        title: "Frontend engineering",
        description: "Building fast, accessible and responsive web interfaces with React and Next.js.",
        tools: ["TypeScript", "React", "Next.js"],
      },
      {
        icon: "backend",
        title: "APIs & backend",
        description: "Designing and developing REST APIs and backend services with Node.js and PostgreSQL, backed by automated tests.",
        tools: ["Node.js", "REST API", "PostgreSQL"],
      },
      {
        icon: "ops",
        title: "Deployment & operations",
        description: "Shipping applications to production with Docker, CI/CD and Cloudflare, and keeping them stable.",
        tools: ["Docker", "CI/CD", "Cloudflare"],
      },
    ],
    experience: [
      {
        role: "Application Development Specialist",
        company: "Vietbank",
        period: "2024 — Present",
        location: "Ho Chi Minh City",
        highlights: [
          "Develop and maintain customer-facing web applications with a focus on production stability.",
        ],
      },
      {
        role: "Programmer",
        company: "International Distribution Joint Stock Company",
        period: "2025 — 2026",
        location: "Ho Chi Minh City",
        highlights: [
          "Built internal administration interfaces with React.",
          "Designed and developed APIs, and wrote automated tests for backend services.",
        ],
      },
    ],
    projects: [
      {
        slug: "portfolio-cv",
        name: "Portfolio & CV",
        description:
          "Bilingual (Vietnamese – English) personal portfolio with light/dark themes and PDF CV export.",
        tech: ["Next.js", "TypeScript", "CSS", "Cloudflare Pages"],
        year: "2026",
        role: "Design & development",
        image: "/projects/portfolio-cv.jpg",
        link: "https://hieunghiagroup.online",
        context:
          "A professional personal site was needed to present experience and projects to recruiters, readable in both Vietnamese and English, with a printable CV.",
        solution: [
          "Built with Next.js (App Router) as a static export, hosted on Cloudflare Pages with a custom domain.",
          "Bilingual via two route groups with their own root layouts, plus hreflang tags and a sitemap so search engines understand both translations.",
          "Persisted light/dark theme with no flash on load; theme switching animated with the View Transitions API.",
          "Motion built with CSS scroll-driven animations, automatically disabled for users who prefer reduced motion.",
          "Social preview images generated at build time; the CV exports to an A4 PDF.",
        ],
        results: [
          "All content lives in a single data file — updating the CV never requires touching the UI.",
          "Fully static, fast to load and free to host.",
        ],
      },
      {
        slug: "hieu-nghia-group",
        name: "Hieu Nghia Group",
        description: "One-page company website deployed on Cloudflare Pages.",
        tech: ["HTML", "CSS", "Cloudflare Pages"],
        year: "2026",
        role: "Development & deployment",
        image: "/projects/hieu-nghia-group.jpg",
        context:
          "The hieunghiagroup.online domain pointed to Cloudflare but showed no page at all. The cause had to be found and a company website put online.",
        solution: [
          "Diagnosed the issue: the Cloudflare Pages project had never been deployed (error 522) and the domain had no DNS records.",
          "Built a one-page site in plain HTML/CSS with light/dark support and a responsive layout.",
          "Deployed with Wrangler, attached the custom domain and configured CNAME records for the apex and www.",
        ],
        results: [
          "The domain came back online over HTTPS and later became the home of this portfolio.",
        ],
      },
    ],
    education: [
      {
        school: "Ho Chi Minh City University of Technology (HUTECH)",
        degree: "Bachelor of Information Technology",
        period: "2020 — 2025",
      },
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
