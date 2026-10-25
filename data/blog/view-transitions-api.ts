import type { Post } from "../posts";

export const post: Post = {
  slug: "view-transitions-api",
  topic: "web",
  date: "2026-10-25",
  cover: "/blog/view-transitions-api/cover.svg",
  tags: ["View Transitions", "CSS", "React", "Next.js"],
  content: {
    vi: {
      title: "View Transitions API: chuyển trang mượt như ứng dụng native",
      excerpt:
        "Cách trình duyệt chụp ảnh trạng thái cũ và mới rồi tự tạo hiệu ứng: chuyển cảnh trong trang, giữa hai trang, phần tử dùng chung bay từ danh sách sang trang chi tiết, và cách dùng với React/Next.js, lấy ví dụ từ chính website này.",
      body: [
        {
          type: "p",
          text: "Khi bấm vào một dự án trên trang chủ của website này, ảnh chụp màn hình và tiêu đề bay từ thẻ nhỏ sang vị trí lớn ở trang chi tiết. Khi đổi giao diện sáng/tối, màu mới lan ra thành vòng tròn từ nút bấm. Cả hai đều không dùng thư viện animation nào: đó là View Transitions API của trình duyệt.",
        },
        {
          type: "p",
          text: "Trước đây, muốn có hiệu ứng như vậy phải tự đo vị trí phần tử trước và sau, giữ cả hai phiên bản trong DOM, rồi tính toán animation. Với View Transitions, bạn chỉ cần nói \"hãy đổi DOM\" và \"phần tử này ở trang cũ và trang mới là một\"; phần còn lại trình duyệt lo.",
        },
        { type: "h2", text: "1. Cơ chế: chụp, đổi, chụp, diễn" },
        {
          type: "figure",
          src: "/blog/view-transitions-api/lifecycle-vi.svg",
          alt: "Sơ đồ 5 bước của một view transition: chụp trạng thái cũ, chạy callback cập nhật DOM, chụp trạng thái mới, tạo cây pseudo-element và chạy animation, gỡ lớp phủ",
          caption: "Trong lúc animation chạy, người dùng nhìn thấy ảnh chụp, còn DOM thật đã ở trạng thái mới.",
        },
        {
          type: "p",
          text: "Gọi document.startViewTransition(callback) thì trình duyệt chụp lại màn hình hiện tại, chạy callback để bạn cập nhật DOM, chụp trạng thái mới, rồi đặt một lớp phủ gồm ảnh cũ và ảnh mới lên trên trang và chạy animation giữa hai ảnh. Mặc định là hiệu ứng mờ chéo (cross-fade).",
        },
        {
          type: "code",
          lang: "ts",
          code: `function changeView(update: () => void) {
  // Trình duyệt chưa hỗ trợ: cập nhật ngay, không hiệu ứng
  if (!document.startViewTransition) return update();

  const transition = document.startViewTransition(update);
  transition.ready.then(() => {/* cây pseudo-element đã sẵn sàng */});
  transition.finished.then(() => {/* animation đã chạy xong */});
}`,
        },
        {
          type: "note",
          text: "Đối tượng trả về có ba promise hữu ích: updateCallbackDone (DOM đã cập nhật), ready (sắp chạy animation, lúc này có thể dùng Web Animations API lên pseudo-element), finished (đã xong, lớp phủ được gỡ).",
        },
        { type: "h2", text: "2. Cây pseudo-element: chỗ để viết CSS" },
        {
          type: "figure",
          src: "/blog/view-transitions-api/pseudo-tree-vi.svg",
          alt: "Cây pseudo-element: ::view-transition chứa các ::view-transition-group cho root và cho từng phần tử có tên, mỗi group chứa image-pair gồm old và new",
          caption: "Mỗi phần tử có view-transition-name sinh ra một group riêng, tách khỏi root.",
        },
        {
          type: "p",
          text: "Toàn bộ hiệu ứng nằm trong một cây pseudo-element mà bạn tạo kiểu bằng CSS thông thường. ::view-transition-old(root) là ảnh trang cũ, ::view-transition-new(root) là ảnh trang mới. Muốn trang cũ mờ đi nhanh và trang mới trồi lên nhẹ, chỉ cần vài dòng:",
        },
        {
          type: "code",
          lang: "css",
          code: `::view-transition-old(root) { animation: vt-out .25s ease both; }
::view-transition-new(root) { animation: vt-in .4s cubic-bezier(.2, .7, .2, 1) both; }
@keyframes vt-out { to { opacity: 0; } }
@keyframes vt-in { from { opacity: 0; transform: translateY(12px); } }`,
        },
        { type: "h2", text: "3. Phần tử dùng chung: ảnh bay từ thẻ sang trang chi tiết" },
        {
          type: "figure",
          src: "/blog/view-transitions-api/morph-vi.svg",
          alt: "Bên trái là trang danh sách với ảnh nhỏ trong thẻ, bên phải là trang chi tiết với ảnh lớn; mũi tên cho thấy group cùng tên chuyển vị trí và kích thước",
          caption: "Cùng một view-transition-name ở hai trạng thái: trình duyệt tự nội suy vị trí và kích thước.",
        },
        {
          type: "p",
          text: "Đặt cùng một view-transition-name cho ảnh trong thẻ ở trang danh sách và ảnh lớn ở trang chi tiết. Trình duyệt nhận ra đây là một phần tử, tách nó khỏi root và animate vị trí lẫn kích thước từ chỗ cũ sang chỗ mới. Người xem thấy một vật đang di chuyển chứ không phải hai thứ thay nhau xuất hiện, nên không phải dò lại xem mình vừa bấm vào cái gì.",
        },
        {
          type: "code",
          lang: "css",
          code: `/* Tên phải duy nhất trên trang tại thời điểm chụp */
.card-shot { view-transition-name: shot-hieu-nghia-group; }   /* trang danh sách */
.detail-shot { view-transition-name: shot-hieu-nghia-group; } /* trang chi tiết */`,
        },
        {
          type: "note",
          text: "Hai phần tử trùng tên trên cùng một trang sẽ làm trình duyệt bỏ qua cả hiệu ứng. Với danh sách, hãy ghép tên với id/slug của từng mục.",
        },
        { type: "h2", text: "4. Dùng với React và Next.js" },
        {
          type: "p",
          text: "React 19.3 có sẵn component <ViewTransition>, và App Router của Next.js 16 coi mỗi lần chuyển trang là một transition, nên hiệu ứng chạy khi bấm next/link mà không cần cấu hình gì thêm. Chỉ cần bọc phần tử ở cả hai trang bằng cùng một name:",
        },
        {
          type: "code",
          lang: "tsx",
          code: `import { ViewTransition } from "react";
import Link from "next/link";

// Trang danh sách
<Link href={\`/projects/\${p.slug}\`}>
  <ViewTransition name={\`shot-\${p.slug}\`} share="morph" default="none">
    <img src={p.image} alt="" />
  </ViewTransition>
</Link>

// Trang chi tiết: cùng name
<ViewTransition name={\`shot-\${p.slug}\`} share="morph" default="none">
  <img src={p.image} alt={p.name} />
</ViewTransition>`,
        },
        {
          type: "ul",
          items: [
            "share=\"morph\": gắn class morph cho cặp phần tử, để tùy chỉnh bằng ::view-transition-group(.morph).",
            "default=\"none\": không để phần tử có tên tự cross-fade trong mọi transition không liên quan. Khi dùng default=\"none\" thì phải giữ share, nếu không cặp phần tử sẽ lặng lẽ không morph nữa.",
            "Hiệu ứng chỉ chạy với cập nhật nằm trong transition (chuyển trang, startTransition, Suspense); setState thường thì không.",
          ],
        },
        { type: "h2", text: "5. Chuyển cảnh giữa hai trang HTML (không cần JavaScript)" },
        {
          type: "p",
          text: "Với website nhiều trang truyền thống, hoặc khi người dùng tải lại toàn trang, chỉ cần một dòng CSS ở cả trang đi và trang đến (cùng origin). Những view-transition-name trùng nhau giữa hai trang vẫn morph như trên:",
        },
        { type: "code", lang: "css", code: "@view-transition { navigation: auto; }" },
        { type: "h2", text: "6. Đổi giao diện sáng/tối với vòng tròn lan ra" },
        {
          type: "p",
          text: "Vì ready cho biết lúc lớp phủ sẵn sàng, ta có thể tự chạy animation lên ảnh mới bằng Web Animations API: cắt ảnh mới bằng một hình tròn bắt đầu từ vị trí con trỏ và phóng to đến góc xa nhất.",
        },
        {
          type: "code",
          lang: "ts",
          code: `const x = e.clientX, y = e.clientY;
const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

const vt = document.startViewTransition(() => applyTheme(next));
vt.ready.then(() => {
  document.documentElement.animate(
    { clipPath: [\`circle(0px at \${x}px \${y}px)\`, \`circle(\${r}px at \${x}px \${y}px)\`] },
    { duration: 650, easing: "cubic-bezier(.4, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" },
  );
});`,
        },
        { type: "h2", text: "7. Những cái bẫy tôi đã gặp" },
        {
          type: "ul",
          items: [
            "Hai loại hiệu ứng giẫm chân nhau: CSS tắt animation mặc định của root cho hiệu ứng đổi giao diện cũng vô tình tắt luôn hiệu ứng chuyển trang. Cách xử lý: thêm một class (ví dụ theme-vt) vào <html> chỉ trong lúc đổi giao diện và viết CSS dưới class đó.",
            "Khi đổi giao diện, các phần tử đang có view-transition-name bị chụp riêng nên không nằm trong vòng tròn. Dưới class theme-vt, đặt view-transition-name: none cho mọi phần tử để cả trang là một ảnh.",
            "Chuyển giữa hai root layout khác nhau trong Next.js là tải lại toàn trang, nên React không thể morph. Gộp về một root layout (ví dụ các ngôn ngữ dùng chung layout) thì chuyển trang mới là client-side.",
            "Trang có scroll-behavior: smooth: Next.js 16 không còn tự tắt cuộn mượt khi chuyển trang, nên cú cuộn về đầu trang có thể dừng giữa chừng. Thêm data-scroll-behavior=\"smooth\" vào thẻ <html>.",
            "Tôn trọng prefers-reduced-motion: tắt @view-transition và bỏ qua startViewTransition khi người dùng muốn giảm chuyển động.",
          ],
        },
        {
          type: "code",
          lang: "css",
          code: `@media (prefers-reduced-motion: reduce) {
  @view-transition { navigation: none; }
}`,
        },
        { type: "h2", text: "8. Hỗ trợ trình duyệt" },
        {
          type: "p",
          text: "Chuyển cảnh trong cùng trang đã có ở Chrome, Edge, Safari và Firefox bản mới. Chuyển cảnh giữa hai trang và một số tính năng mới (view-transition-class, transition types mà React dùng) có ở Chromium và Safari bản gần đây; hãy kiểm tra caniuse trước khi dựa vào chúng. Điểm hay là API này tăng tiến: trình duyệt không hỗ trợ vẫn chuyển trang bình thường, chỉ không có hiệu ứng.",
        },
        { type: "h2", text: "Kết luận" },
        {
          type: "p",
          text: "View Transitions biến hiệu ứng chuyển cảnh từ việc của thư viện animation thành vài dòng CSS và một cái tên. Bắt đầu với cross-fade mặc định, thêm morph cho một phần tử quan trọng nhất (ảnh hoặc tiêu đề), giữ thời lượng dưới nửa giây, và luôn có lối thoát cho người dùng muốn giảm chuyển động.",
        },
      ],
    },
    en: {
      title: "The View Transitions API: app-like page transitions on the web",
      excerpt:
        "How the browser snapshots the old and new state and animates between them: same-document and cross-document transitions, shared elements that fly from a list into a detail page, and how to use it with React/Next.js, using this website as the example.",
      body: [
        {
          type: "p",
          text: "Click a project on this site's home page and its screenshot and title fly from the small card into place on the detail page. Toggle light/dark mode and the new theme spreads out as a circle from the button. Neither uses an animation library: both are the browser's View Transitions API.",
        },
        {
          type: "p",
          text: "Effects like these used to mean measuring elements before and after, keeping both versions in the DOM, and computing the animation yourself. With View Transitions you say \"update the DOM\" and \"this element on the old and new page is the same thing\". The browser does the rest.",
        },
        { type: "h2", text: "1. How it works: snapshot, update, snapshot, animate" },
        {
          type: "figure",
          src: "/blog/view-transitions-api/lifecycle-en.svg",
          alt: "Five steps of a view transition: capture the old state, run the DOM update callback, capture the new state, build the pseudo-element tree and animate, remove the overlay",
          caption: "While the animation runs the user sees snapshots; the real DOM is already in its new state.",
        },
        {
          type: "p",
          text: "Call document.startViewTransition(callback) and the browser captures the current screen, runs your callback to update the DOM, captures the new state, then places an overlay with both snapshots on top of the page and animates between them. The default is a cross-fade.",
        },
        {
          type: "code",
          lang: "ts",
          code: `function changeView(update: () => void) {
  // No support: update immediately, no animation
  if (!document.startViewTransition) return update();

  const transition = document.startViewTransition(update);
  transition.ready.then(() => {/* pseudo-element tree is ready */});
  transition.finished.then(() => {/* animation is done */});
}`,
        },
        {
          type: "note",
          text: "The returned object exposes three useful promises: updateCallbackDone (the DOM is updated), ready (about to animate, so you can drive the pseudo-elements with the Web Animations API) and finished (done, overlay removed).",
        },
        { type: "h2", text: "2. The pseudo-element tree: where your CSS goes" },
        {
          type: "figure",
          src: "/blog/view-transitions-api/pseudo-tree-en.svg",
          alt: "Pseudo-element tree: ::view-transition contains ::view-transition-group for root and for each named element; each group holds an image-pair with old and new",
          caption: "Every element with a view-transition-name gets its own group, separate from root.",
        },
        {
          type: "p",
          text: "The whole effect lives in a pseudo-element tree that you style with ordinary CSS. ::view-transition-old(root) is the old page snapshot and ::view-transition-new(root) the new one. To fade the old page out quickly and lift the new one in gently takes a few lines:",
        },
        {
          type: "code",
          lang: "css",
          code: `::view-transition-old(root) { animation: vt-out .25s ease both; }
::view-transition-new(root) { animation: vt-in .4s cubic-bezier(.2, .7, .2, 1) both; }
@keyframes vt-out { to { opacity: 0; } }
@keyframes vt-in { from { opacity: 0; transform: translateY(12px); } }`,
        },
        { type: "h2", text: "3. Shared elements: from card to detail page" },
        {
          type: "figure",
          src: "/blog/view-transitions-api/morph-en.svg",
          alt: "Left: a list page with a small image in a card; right: a detail page with a large image; an arrow shows the same-named group moving and resizing",
          caption: "Same view-transition-name in both states: the browser interpolates position and size.",
        },
        {
          type: "p",
          text: "Give the card image on the list page and the large image on the detail page the same view-transition-name. The browser treats them as one element, lifts it out of root and animates its position and size from the old spot to the new one. The viewer sees one object moving rather than two swapping, so they never have to re-scan the page to confirm what they clicked.",
        },
        {
          type: "code",
          lang: "css",
          code: `/* Names must be unique on the page when it's captured */
.card-shot { view-transition-name: shot-hieu-nghia-group; }   /* list page */
.detail-shot { view-transition-name: shot-hieu-nghia-group; } /* detail page */`,
        },
        {
          type: "note",
          text: "Two elements with the same name on one page make the browser skip the whole transition. In lists, build the name from each item's id or slug.",
        },
        { type: "h2", text: "4. With React and Next.js" },
        {
          type: "p",
          text: "React 19.3 ships a <ViewTransition> component, and the Next.js 16 App Router treats every navigation as a transition, so the effect runs on next/link clicks with no extra setup. Wrap the element on both pages with the same name:",
        },
        {
          type: "code",
          lang: "tsx",
          code: `import { ViewTransition } from "react";
import Link from "next/link";

// List page
<Link href={\`/projects/\${p.slug}\`}>
  <ViewTransition name={\`shot-\${p.slug}\`} share="morph" default="none">
    <img src={p.image} alt="" />
  </ViewTransition>
</Link>

// Detail page: same name
<ViewTransition name={\`shot-\${p.slug}\`} share="morph" default="none">
  <img src={p.image} alt={p.name} />
</ViewTransition>`,
        },
        {
          type: "ul",
          items: [
            "share=\"morph\" adds a morph class to the pair so you can style it with ::view-transition-group(.morph).",
            "default=\"none\" stops named elements from cross-fading on every unrelated transition. With default=\"none\" you must keep share, or the pair silently stops morphing.",
            "Animations only run for updates inside a transition (navigation, startTransition, Suspense), not for plain setState calls.",
          ],
        },
        { type: "h2", text: "5. Cross-document transitions (no JavaScript)" },
        {
          type: "p",
          text: "For classic multi-page sites, or when a full page load happens, one line of CSS on both the old and new page (same origin) is enough. Matching view-transition-names across the two pages still morph:",
        },
        { type: "code", lang: "css", code: "@view-transition { navigation: auto; }" },
        { type: "h2", text: "6. A circular reveal for the theme toggle" },
        {
          type: "p",
          text: "Because ready tells you when the overlay exists, you can animate the new snapshot yourself with the Web Animations API: clip it with a circle that starts at the pointer and grows to the farthest corner.",
        },
        {
          type: "code",
          lang: "ts",
          code: `const x = e.clientX, y = e.clientY;
const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

const vt = document.startViewTransition(() => applyTheme(next));
vt.ready.then(() => {
  document.documentElement.animate(
    { clipPath: [\`circle(0px at \${x}px \${y}px)\`, \`circle(\${r}px at \${x}px \${y}px)\`] },
    { duration: 650, easing: "cubic-bezier(.4, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" },
  );
});`,
        },
        { type: "h2", text: "7. Traps I fell into" },
        {
          type: "ul",
          items: [
            "Two effects stepping on each other: CSS that disabled root's default animation for the theme toggle also killed page transitions. Fix: add a class (e.g. theme-vt) to <html> only while the theme changes, and scope that CSS under it.",
            "During a theme change, elements with a view-transition-name are captured separately and sit outside the circle. Under theme-vt, set view-transition-name: none on everything so the page is a single snapshot.",
            "Navigating between two different root layouts in Next.js is a full page load, so React can't morph. Merging into one root layout (e.g. languages sharing a layout) keeps navigation client-side.",
            "Pages with scroll-behavior: smooth: Next.js 16 no longer turns smooth scrolling off during navigation, so the scroll back to the top can stop halfway. Add data-scroll-behavior=\"smooth\" to <html>.",
            "Respect prefers-reduced-motion: disable @view-transition and skip startViewTransition for users who ask for less motion.",
          ],
        },
        {
          type: "code",
          lang: "css",
          code: `@media (prefers-reduced-motion: reduce) {
  @view-transition { navigation: none; }
}`,
        },
        { type: "h2", text: "8. Browser support" },
        {
          type: "p",
          text: "Same-document transitions work in current Chrome, Edge, Safari and Firefox. Cross-document transitions and newer features (view-transition-class, the transition types React uses) are in Chromium and recent Safari; check caniuse before relying on them. The API is progressive: browsers without support still navigate normally, just without the animation.",
        },
        { type: "h2", text: "Takeaway" },
        {
          type: "p",
          text: "View Transitions turn page animation from an animation-library problem into a few lines of CSS and a name. Start with the default cross-fade, add a morph for the single most important element (an image or a title), keep durations under half a second, and always give reduced-motion users a way out.",
        },
      ],
    },
  },
};
