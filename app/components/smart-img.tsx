"use client";

import { useEffect, useRef, useState } from "react";

// Ảnh có hiệu ứng tải: nền ánh sáng lướt (placeholder) và / hoặc mờ dần hiện ra (fade).
// HTML tĩnh hiển thị ảnh bình thường; hiệu ứng chỉ bật sau khi chạy JS nếu ảnh chưa tải xong,
// nên không gây lệch hydration và không làm chậm ảnh đã có trong cache.
type Props = React.ImgHTMLAttributes<HTMLImageElement> & { placeholder?: boolean; fade?: boolean };

export function SmartImg({ placeholder = false, fade = false, className, ...img }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.complete) return;
    setLoading(true);
    const done = () => setLoading(false);
    el.addEventListener("load", done);
    el.addEventListener("error", done);
    return () => {
      el.removeEventListener("load", done);
      el.removeEventListener("error", done);
    };
  }, []);

  const cls = [className, fade && "img-fade", loading && "img-loading", loading && placeholder && "img-ph"].filter(Boolean).join(" ");
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img ref={ref} className={cls || undefined} {...img} />;
}
