"use client";

import { useEffect } from "react";

// Theo dõi con trỏ chuột để CSS vẽ các hiệu ứng:
// - [data-spotlight]: vầng sáng trong thẻ (--mx, --my)
// - [data-tilt]: nghiêng 3D theo vị trí chuột (--rx, --ry)
// - vầng sáng lớn đi theo con trỏ trên toàn trang (--cx, --cy trên <html>)
export function Spotlight() {
  useEffect(() => {
    const root = document.documentElement;
    let tilted: HTMLElement | null = null;
    let frame = 0;
    let cx = innerWidth / 2, cy = innerHeight / 3, tx = cx, ty = cy;

    // Vầng sáng toàn trang trôi theo chuột một cách mềm mại (nội suy dần)
    const follow = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      root.style.setProperty("--cx", `${cx}px`);
      root.style.setProperty("--cy", `${cy}px`);
      frame = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(follow) : 0;
    };

    const resetTilt = () => {
      tilted?.style.setProperty("--rx", "0deg");
      tilted?.style.setProperty("--ry", "0deg");
      tilted = null;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!frame) frame = requestAnimationFrame(follow);

      const target = e.target as Element | null;
      const spot = target?.closest<HTMLElement>("[data-spotlight]");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }

      const tilt = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (tilt !== tilted) resetTilt();
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty("--rx", `${px * 14}deg`);
        tilt.style.setProperty("--ry", `${-py * 14}deg`);
        tilted = tilt;
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", resetTilt);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", resetTilt);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
