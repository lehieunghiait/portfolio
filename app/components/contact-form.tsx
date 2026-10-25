"use client";

import { useEffect, useRef, useState } from "react";

type Labels = {
  name: string;
  email: string;
  message: string;
  messagePlaceholder: string;
  send: string;
  sending: string;
  success: string;
  error: string;
  captcha: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Form liên hệ: gửi tới Worker (contactEndpoint), chống spam bằng Cloudflare Turnstile.
export function ContactForm({
  endpoint, siteKey, lang, labels,
}: { endpoint: string; siteKey: string; lang: string; labels: Labels }) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error" | "captcha">("idle");
  const [token, setToken] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  // Tải và hiển thị ô xác minh Turnstile (chỉ khi đã cấu hình site key)
  useEffect(() => {
    if (!siteKey || !widgetRef.current) return;
    const theme = document.documentElement.dataset.theme ?? "auto";
    const render = () => {
      if (!window.turnstile || !widgetRef.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        language: lang,
        theme,
        callback: (t: string) => setToken(t),
        "expired-callback": () => setToken(""),
      });
    };
    if (window.turnstile) return render();
    let script = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = TURNSTILE_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => script?.removeEventListener("load", render);
  }, [siteKey, lang]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (siteKey && !token) return setStatus("captcha");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setStatus("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setToken("");
      window.turnstile?.reset(widgetId.current);
    }
  };

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="cf-row">
        <label>
          <span>{labels.name}</span>
          <input name="name" required maxLength={100} autoComplete="name" />
        </label>
        <label>
          <span>{labels.email}</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" />
        </label>
      </div>
      <label>
        <span>{labels.message}</span>
        <textarea name="message" required minLength={10} maxLength={5000} rows={5} placeholder={labels.messagePlaceholder} />
      </label>
      {/* Bẫy bot: ô ẩn, người dùng thật không điền */}
      <input name="website" tabIndex={-1} autoComplete="off" className="cf-hp" aria-hidden="true" />
      {siteKey && <div ref={widgetRef} className="cf-turnstile" />}
      <button type="submit" className="cf-submit" disabled={status === "sending"}>
        {status === "sending" ? labels.sending : labels.send}
      </button>
      <p className={`cf-status cf-${status}`} role="status" aria-live="polite">
        {status === "success" && labels.success}
        {status === "error" && labels.error}
        {status === "captcha" && labels.captcha}
      </p>
    </form>
  );
}
