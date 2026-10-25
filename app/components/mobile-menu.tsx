"use client";

import Link from "next/link";
import { useRef } from "react";
import s from "./mobile-menu.module.css";

type Item = { href: string; label: string };

// Menu cho màn hình hẹp: nút ☰ mở <dialog> toàn màn hình (lớp trên cùng, tự có phím Esc và giữ focus bên trong)
export function MobileMenu({ items, cta, labels }: { items: Item[]; cta: Item; labels: { open: string; close: string } }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button type="button" className={s.burger} onClick={() => ref.current?.showModal()} aria-label={labels.open} aria-haspopup="dialog">
        <span /><span /><span />
      </button>
      <dialog
        ref={ref}
        className={s.sheet}
        aria-label={labels.open}
        // Bấm ra vùng nền (chính phần tử dialog) thì đóng
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <button type="button" className={s.close} onClick={close} aria-label={labels.close}>×</button>
        <nav>
          <ul className={s.list}>
            {items.map((n, i) => (
              <li key={n.href} style={{ "--i": i } as React.CSSProperties}>
                <Link href={n.href} onClick={close}>
                  <span className={s.num}>0{i + 1}</span>{n.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={cta.href} onClick={close} className={s.cta} style={{ "--i": items.length } as React.CSSProperties}>
            {cta.label} <span aria-hidden>→</span>
          </Link>
        </nav>
      </dialog>
    </>
  );
}
