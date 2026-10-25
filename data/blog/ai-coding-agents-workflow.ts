import type { Post } from "../posts";

export const post: Post = {
  slug: "ai-coding-agents-workflow",
  topic: "ai",
  date: "2026-10-25",
  cover: "/blog/ai-coding-agents-workflow/cover.svg",
  tags: ["AI Agent", "MCP", "Workflow", "Code review"],
  content: {
    vi: {
      title: "Làm việc với AI coding agent: từ giao việc đến mở pull request",
      excerpt:
        "AI không còn chỉ gợi ý từng dòng code: agent tự lên kế hoạch, sửa nhiều file, chạy test và mở pull request. Quy trình tôi dùng để giao việc rõ ràng, cho agent cách tự kiểm tra, và giữ quyền quyết định ở con người.",
      body: [
        {
          type: "p",
          text: "Vài năm trước, AI trong lập trình nghĩa là gợi ý hoàn thành dòng code. Bây giờ, một coding agent có thể đọc cả repository, lên kế hoạch, sửa nhiều file, chạy lệnh build và test, đọc lỗi rồi tự sửa tiếp, cuối cùng mở pull request. Developer không còn coi AI là một tab trong IDE mà là một đồng nghiệp làm việc song song.",
        },
        {
          type: "p",
          text: "Nhưng đồng nghiệp này rất nhanh, rất tự tin và không chịu trách nhiệm thay bạn. Kết quả tốt hay tệ phụ thuộc phần lớn vào cách bạn giao việc và kiểm soát. Bài này là quy trình tôi dùng, kể cả khi xây chính website này.",
        },
        { type: "h2", text: "1. Agent làm việc theo vòng lặp" },
        {
          type: "figure",
          src: "/blog/ai-coding-agents-workflow/agent-loop-vi.svg",
          alt: "Vòng lặp của agent: lên kế hoạch, hành động bằng công cụ (đọc file, sửa code, chạy lệnh), quan sát kết quả, kiểm chứng; lặp lại cho đến khi đạt tiêu chí hoàn thành",
          caption: "Chất lượng của agent phụ thuộc nhiều vào bước kiểm chứng: không có nó, agent chỉ đoán.",
        },
        {
          type: "p",
          text: "Khác biệt giữa agent và chatbot nằm ở công cụ. Agent được phép đọc file, tìm kiếm code, sửa file, chạy lệnh terminal, mở trình duyệt. Mỗi vòng, nó quyết định dùng công cụ nào, xem kết quả, rồi quyết định bước tiếp theo. Một lỗi build hay một test đỏ là thông tin để agent sửa tiếp, không phải điểm dừng.",
        },
        { type: "h2", text: "2. Quy trình từ yêu cầu đến production" },
        {
          type: "figure",
          src: "/blog/ai-coding-agents-workflow/workflow-vi.svg",
          alt: "Quy trình 6 bước: yêu cầu rõ ràng, kế hoạch (người duyệt), agent làm trên nhánh riêng, CI chạy test, pull request (người review), merge và deploy",
          caption: "Agent làm phần lớn công việc; con người giữ các điểm quyết định.",
        },
        {
          type: "ul",
          items: [
            "Yêu cầu: viết rõ cần gì, vì sao, và thế nào là xong.",
            "Kế hoạch: với việc lớn, bảo agent đề xuất kế hoạch trước và duyệt nó. Sửa hướng đi lúc này rẻ hơn nhiều so với sửa 20 file đã viết.",
            "Thực hiện: agent làm trên nhánh hoặc worktree riêng, không đụng vào main.",
            "Kiểm chứng: type-check, test, build, chụp màn hình giao diện. Agent tự chạy, CI chạy lại.",
            "Pull request: bạn review diff như review PR của một đồng nghiệp mới: đọc từng dòng quan trọng.",
            "Merge và deploy: quyết định của con người.",
          ],
        },
        { type: "h2", text: "3. Giao việc: ngữ cảnh, tiêu chí, ràng buộc" },
        {
          type: "p",
          text: "Agent không biết những gì bạn không nói. \"Sửa lỗi blog\" sẽ cho ra một kết quả đoán mò; một yêu cầu có ngữ cảnh và tiêu chí kiểm tra cho ra kết quả kiểm chứng được:",
        },
        {
          type: "code",
          lang: "md",
          code: `Lỗi: bấm vào một bài ở trang /blog thì trang bài viết mở ra
nhưng bị cuộn xuống gần cuối, thay vì ở đầu trang.

Tái hiện: cuộn /blog xuống thẻ cuối, bấm vào, đo window.scrollY.
Mong muốn: scrollY ≈ 0 sau khi chuyển trang, cả desktop và mobile.
Ràng buộc: giữ hiệu ứng chuyển trang và nút đổi ngôn ngữ
(nút này cố ý giữ vị trí cuộn).
Kiểm tra: chạy lại bước tái hiện bằng trình duyệt headless.`,
        },
        {
          type: "note",
          text: "Ví dụ trên là một lỗi có thật của website này. Agent tái hiện được bằng trình duyệt headless, tìm ra nguyên nhân: Next.js 16 không còn tự tắt scroll-behavior: smooth khi chuyển trang. Sau đó sửa bằng một thuộc tính trên thẻ <html> và đo lại để xác nhận.",
        },
        { type: "h2", text: "4. File hướng dẫn cho repository" },
        {
          type: "p",
          text: "Mỗi lần mở phiên mới, agent bắt đầu từ con số không. Một file hướng dẫn ở gốc repository (CLAUDE.md, AGENTS.md hoặc tương tự) giúp nó nắm nhanh: lệnh build và test, kiến trúc tổng quan, và những quy tắc không hiển nhiên từ code.",
        },
        {
          type: "code",
          lang: "md",
          code: `## Commands
npm run build   # type-check + static export + CV PDFs

## Architecture
- Content lives in data/; components rarely change.
- One root layout for both languages. Don't reintroduce
  per-language root layouts: crossing them forces a full reload.

## Rules
- This Next.js version is newer than your training data:
  read node_modules/next/dist/docs/ before writing Next code.`,
        },
        {
          type: "p",
          text: "Quy tắc tốt nhất là những bài học đã trả giá: mỗi lần agent (hoặc người) mắc một lỗi đáng nhớ, ghi lại một dòng kèm lý do. Đừng nhồi những thứ agent tự đọc được từ code.",
        },
        { type: "h2", text: "5. Cho agent cách tự kiểm chứng" },
        {
          type: "p",
          text: "Đây là điều quan trọng nhất. Agent có test, type-check, build và có thể mở trình duyệt để nhìn kết quả thì tự phát hiện và sửa phần lớn lỗi của chính nó. Agent không có vòng phản hồi thì chỉ có thể nói \"chắc là xong rồi\".",
        },
        {
          type: "ul",
          items: [
            "Repository có lệnh kiểm tra chạy nhanh (dưới vài phút) và cho kết quả rõ ràng.",
            "Với giao diện: cho agent chụp màn hình ở nhiều kích thước và giao diện sáng/tối, rồi tự xem.",
            "Yêu cầu agent báo cáo cái gì đã kiểm chứng và cái gì chưa, không chỉ \"đã xong\".",
          ],
        },
        { type: "h2", text: "6. Kết nối công cụ bằng MCP" },
        {
          type: "p",
          text: "Model Context Protocol (MCP) là chuẩn mở để nối agent với hệ thống bên ngoài: issue tracker, cơ sở dữ liệu, tài liệu nội bộ, trình duyệt, dashboard giám sát. Thay vì mỗi công cụ AI viết một kiểu tích hợp riêng, một MCP server dùng được cho nhiều agent.",
        },
        {
          type: "ul",
          items: [
            "Bắt đầu với quyền chỉ đọc. Cho agent đọc log và issue trước, cho ghi sau khi đã tin quy trình.",
            "Mỗi MCP server là thêm một cánh cửa: chỉ cài server từ nguồn tin cậy, xem nó được phép làm gì.",
            "Dữ liệu agent đọc từ bên ngoài (trang web, issue, email) có thể chứa chỉ dẫn độc hại (prompt injection). Coi đó là dữ liệu, không phải mệnh lệnh.",
          ],
        },
        { type: "h2", text: "7. Rào chắn an toàn" },
        {
          type: "ul",
          items: [
            "Thao tác khó đảo ngược (xóa dữ liệu, force push, deploy production, đổi DNS) phải hỏi người trước.",
            "Không dán secret vào prompt. Để agent đọc secret từ file hoặc biến môi trường có giới hạn quyền; nếu lỡ dán, tạo khóa mới.",
            "Không cho agent push thẳng lên main; mọi thay đổi đi qua pull request và review.",
            "Với hệ thống tài chính hoặc dữ liệu cá nhân: agent chỉ làm trên môi trường dev/test với dữ liệu giả.",
          ],
        },
        { type: "h2", text: "8. Agent giỏi gì, yếu gì" },
        {
          type: "p",
          text: "Agent làm rất tốt những việc có tiêu chí rõ và kiểm chứng được: viết test, migrate API cũ sang mới, refactor có test bảo vệ, tìm lỗi từ log và stack trace, viết code lặp lại, cập nhật tài liệu. Agent làm kém khi yêu cầu mơ hồ, khi quyết định kiến trúc cần hiểu bối cảnh kinh doanh, hoặc khi quy tắc nghiệp vụ (ví dụ quy định ngân hàng) không có trong code. Những chỗ đó vẫn cần con người dẫn dắt.",
        },
        { type: "h2", text: "Kết luận" },
        {
          type: "p",
          text: "Làm việc tốt với AI agent giống làm việc tốt với một đồng nghiệp rất nhanh nhưng mới vào: giao việc rõ, cho họ công cụ để tự kiểm tra, ghi lại bài học vào tài liệu chung, và review kỹ trước khi merge. Phần việc của developer chuyển dần từ gõ code sang định nghĩa vấn đề, thiết kế cách kiểm chứng và chịu trách nhiệm về kết quả.",
        },
      ],
    },
    en: {
      title: "Working with AI coding agents: from task to pull request",
      excerpt:
        "AI no longer just completes lines: agents plan, edit many files, run tests and open pull requests. The workflow I use to give clear tasks, let the agent verify its own work, and keep the decisions with humans.",
      body: [
        {
          type: "p",
          text: "A few years ago, AI in programming meant line completion. Today a coding agent can read a whole repository, make a plan, edit many files, run the build and tests, read the errors and fix them, and finally open a pull request. Developers no longer treat AI as a tab in the IDE but as a collaborator working in parallel.",
        },
        {
          type: "p",
          text: "But this collaborator is fast, confident, and not accountable for you. Whether the result is good or bad depends mostly on how you hand over work and keep control. This post is the workflow I use, including for building this very website.",
        },
        { type: "h2", text: "1. Agents work in a loop" },
        {
          type: "figure",
          src: "/blog/ai-coding-agents-workflow/agent-loop-en.svg",
          alt: "The agent loop: plan, act with tools (read files, edit code, run commands), observe the result, verify; repeat until the acceptance criteria are met",
          caption: "An agent is only as good as its verification step: without it, it's guessing.",
        },
        {
          type: "p",
          text: "What separates an agent from a chatbot is tools. An agent may read files, search code, edit files, run terminal commands and open a browser. Each round it picks a tool, looks at the result and decides the next step. A build error or a red test is information to keep going, not a dead end.",
        },
        { type: "h2", text: "2. From request to production" },
        {
          type: "figure",
          src: "/blog/ai-coding-agents-workflow/workflow-en.svg",
          alt: "Six steps: clear request, plan (human approves), agent works on its own branch, CI runs tests, pull request (human reviews), merge and deploy",
          caption: "The agent does most of the work; humans keep the decision points.",
        },
        {
          type: "ul",
          items: [
            "Request: say what you need, why, and what done looks like.",
            "Plan: for bigger work, have the agent propose a plan first and approve it. Changing direction now is far cheaper than after 20 files are written.",
            "Implement: the agent works on its own branch or worktree, never on main.",
            "Verify: type-check, tests, build, UI screenshots. The agent runs them; CI runs them again.",
            "Pull request: review the diff like a new teammate's PR: read every line that matters.",
            "Merge and deploy: a human decision.",
          ],
        },
        { type: "h2", text: "3. Handing over a task: context, criteria, constraints" },
        {
          type: "p",
          text: "An agent doesn't know what you don't tell it. \"Fix the blog bug\" gets you a guess; a request with context and a way to check gets you something verifiable:",
        },
        {
          type: "code",
          lang: "md",
          code: `Bug: clicking a post on /blog opens the post page
scrolled near the bottom instead of at the top.

Repro: scroll /blog to the last card, click it, read window.scrollY.
Expected: scrollY ≈ 0 after navigation, desktop and mobile.
Constraints: keep page transitions and the language switch
(which deliberately keeps the scroll position).
Check: rerun the repro in a headless browser.`,
        },
        {
          type: "note",
          text: "That example is a real bug on this site. The agent reproduced it in a headless browser and found the cause: Next.js 16 no longer disables scroll-behavior: smooth during navigation. It fixed it with one attribute on <html>, then measured again to confirm.",
        },
        { type: "h2", text: "4. An instructions file for the repository" },
        {
          type: "p",
          text: "Every new session starts from zero. An instructions file at the repo root (CLAUDE.md, AGENTS.md or similar) gets the agent up to speed: build and test commands, the architecture at a glance, and rules that aren't obvious from the code.",
        },
        {
          type: "code",
          lang: "md",
          code: `## Commands
npm run build   # type-check + static export + CV PDFs

## Architecture
- Content lives in data/; components rarely change.
- One root layout for both languages. Don't reintroduce
  per-language root layouts: crossing them forces a full reload.

## Rules
- This Next.js version is newer than your training data:
  read node_modules/next/dist/docs/ before writing Next code.`,
        },
        {
          type: "p",
          text: "The best rules are lessons you paid for: whenever an agent (or a person) makes a memorable mistake, add one line and the reason. Don't stuff in things the agent can read from the code itself.",
        },
        { type: "h2", text: "5. Give the agent a way to check its work" },
        {
          type: "p",
          text: "This matters more than anything else. An agent with tests, type-checking, a build and a browser to look at the result catches and fixes most of its own mistakes. An agent without a feedback loop can only say \"that should do it\".",
        },
        {
          type: "ul",
          items: [
            "Keep checks fast (a few minutes at most) with clear pass/fail output.",
            "For UI work, have the agent take screenshots at several widths and in light/dark mode, then look at them.",
            "Ask the agent to report what it verified and what it didn't, not just \"done\".",
          ],
        },
        { type: "h2", text: "6. Connecting tools with MCP" },
        {
          type: "p",
          text: "The Model Context Protocol (MCP) is an open standard for connecting agents to outside systems: issue trackers, databases, internal docs, browsers, monitoring dashboards. Instead of every AI tool building its own integration, one MCP server works with many agents.",
        },
        {
          type: "ul",
          items: [
            "Start read-only. Let the agent read logs and issues first; grant write access once you trust the workflow.",
            "Every MCP server is another door: install only from trusted sources and check what it's allowed to do.",
            "Content the agent reads from outside (web pages, issues, emails) can carry malicious instructions (prompt injection). Treat it as data, not commands.",
          ],
        },
        { type: "h2", text: "7. Guardrails" },
        {
          type: "ul",
          items: [
            "Hard-to-reverse actions (deleting data, force-pushing, deploying to production, changing DNS) need a human's OK first.",
            "Never paste secrets into a prompt. Let the agent read them from a file or a scoped environment variable; if one leaks, rotate it.",
            "Don't let the agent push straight to main; every change goes through a pull request and review.",
            "For financial systems or personal data, agents work only in dev/test environments with fake data.",
          ],
        },
        { type: "h2", text: "8. What agents are good and bad at" },
        {
          type: "p",
          text: "Agents excel at work with clear, checkable criteria: writing tests, migrating from an old API to a new one, refactoring under test coverage, tracking bugs down from logs and stack traces, repetitive code, and keeping docs up to date. They struggle with vague requests, architecture decisions that need business context, and domain rules (banking regulations, say) that aren't written down in the code. Those still need a human in the lead.",
        },
        { type: "h2", text: "Takeaway" },
        {
          type: "p",
          text: "Working well with an AI agent is like working well with a very fast new teammate: give clear tasks, give them tools to check their own work, write lessons into shared docs, and review carefully before merging. The developer's job shifts from typing code toward defining problems, designing how to verify, and owning the result.",
        },
      ],
    },
  },
};
