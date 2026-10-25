"use client";

// Trang quản trị /admin: đăng nhập bằng Clerk, xem / đánh dấu / xóa tin nhắn từ form liên hệ (lưu ở D1).
// Giao diện chỉ ẩn/hiện theo vai trò cho tiện; quyền thật sự được Worker kiểm tra ở mỗi request.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClerkLoaded, ClerkLoading, ClerkProvider, Show, SignIn, useAuth, useUser } from "@clerk/react";
import { clerkPublishableKey, contactEndpoint } from "@/data/site";
import { ThemeToggle } from "../components/theme-toggle";
import { UserChip, clerkAppearance, clerkLocalization } from "../components/clerk";
import s from "./admin.module.css";

type Message = {
  id: number;
  name: string;
  email: string;
  message: string;
  lang: string;
  created_at: string;
  read_at: string | null;
};

const formatDate = (d: string) =>
  // D1 lưu "YYYY-MM-DD HH:MM:SS" theo giờ UTC
  new Date(d.includes("T") ? d : `${d.replace(" ", "T")}Z`).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export function AdminApp() {
  if (!clerkPublishableKey) {
    return (
      <Shell>
        <p className={s.center}>Chưa cấu hình Clerk: điền <code>clerkPublishableKey</code> trong <code>data/site.ts</code>.</p>
      </Shell>
    );
  }
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={clerkAppearance} localization={clerkLocalization.vi} afterSignOutUrl="/admin">
      <Shell account={<Show when="signed-in"><UserChip adminLabel="Quản trị" /></Show>}>
        <ClerkLoading><SignInSkeleton /></ClerkLoading>
        <ClerkLoaded>
          <Show when="signed-out">
            <div className={s.signIn}><SignIn routing="hash" /></div>
          </Show>
          <Show when="signed-in"><Gate /></Show>
        </ClerkLoaded>
      </Shell>
    </ClerkProvider>
  );
}

function Shell({ account, children }: { account?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className={s.page}>
      <header className={s.top}>
        <a href="/" className={s.brand}>← Portfolio</a>
        <div className={s.topActions}>
          <ThemeToggle labels={{ toLight: "Giao diện sáng", toDark: "Giao diện tối" }} />
          {account}
        </div>
      </header>
      {children}
    </main>
  );
}

// Chỉ tài khoản có public_metadata.role = "admin" mới thấy hộp thư
function Gate() {
  const { user } = useUser();
  if (!user) return null;
  if ((user.publicMetadata as { role?: string }).role !== "admin") {
    return (
      <div className={s.center}>
        <h1 className={s.title}>Không có quyền truy cập</h1>
        <p>Tài khoản <strong>{user.primaryEmailAddress?.emailAddress}</strong> chưa được cấp vai trò quản trị.</p>
        <p className={s.faint}>User ID: <code>{user.id}</code></p>
      </div>
    );
  }
  return <Inbox />;
}

function Inbox() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [open, setOpen] = useState<number | null>(null);

  // Gọi API quản trị của Worker kèm token phiên Clerk
  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = await getToken();
      const res = await fetch(`${contactEndpoint}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; reason?: string };
        throw new Error([body.error ?? res.status, body.reason].filter(Boolean).join(": "));
      }
      return res.json();
    },
    [getToken],
  );

  const load = useCallback(async () => {
    setError("");
    try {
      const data = (await api("/admin/messages")) as { messages: Message[] };
      setMessages(data.messages);
    } catch (e) {
      setError(`Không tải được tin nhắn (${(e as Error).message}).`);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const setRead = async (m: Message, read: boolean) => {
    const prev = messages;
    setMessages((list) => list?.map((x) => (x.id === m.id ? { ...x, read_at: read ? new Date().toISOString() : null } : x)) ?? null);
    try {
      await api(`/admin/messages/${m.id}`, { method: "PATCH", body: JSON.stringify({ read }) });
    } catch {
      setMessages(prev);
      setError("Không cập nhật được trạng thái.");
    }
  };

  const remove = async (m: Message) => {
    if (!confirm(`Xóa tin nhắn của ${m.name}? Không thể hoàn tác.`)) return;
    try {
      await api(`/admin/messages/${m.id}`, { method: "DELETE" });
      setMessages((list) => list?.filter((x) => x.id !== m.id) ?? null);
    } catch {
      setError("Không xóa được tin nhắn.");
    }
  };

  const toggleOpen = (m: Message) => {
    setOpen((id) => (id === m.id ? null : m.id));
    if (!m.read_at) setRead(m, true);
  };

  const unread = messages?.filter((m) => !m.read_at).length ?? 0;
  const shown = useMemo(
    () => (filter === "unread" ? messages?.filter((m) => !m.read_at) : messages) ?? [],
    [messages, filter],
  );

  return (
    <section className={s.inbox}>
      <div className={s.head}>
        <h1 className={s.title}>Hộp thư liên hệ</h1>
        <div className={s.tools}>
          <div className={s.tabs} role="tablist">
            <button role="tab" aria-selected={filter === "all"} onClick={() => setFilter("all")}>
              Tất cả <span>{messages?.length ?? 0}</span>
            </button>
            <button role="tab" aria-selected={filter === "unread"} onClick={() => setFilter("unread")}>
              Chưa đọc <span>{unread}</span>
            </button>
          </div>
          <button className={s.ghost} onClick={load}>Làm mới</button>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}
      {!messages && !error && <ListSkeleton />}
      {messages && shown.length === 0 && <p className={s.center}>Không có tin nhắn nào.</p>}

      <ul className={s.list}>
        {shown.map((m) => (
          <li key={m.id} className={`${s.item} ${m.read_at ? "" : s.unread}`}>
            <button className={s.summary} onClick={() => toggleOpen(m)} aria-expanded={open === m.id}>
              <span className={s.dot} aria-hidden="true" />
              <span className={s.who}>
                <strong>{m.name}</strong>
                <span>{m.email}</span>
              </span>
              <span className={s.preview}>{m.message}</span>
              <span className={s.meta}>
                <span className={s.lang}>{m.lang.toUpperCase()}</span>
                <time>{formatDate(m.created_at)}</time>
              </span>
            </button>
            {open === m.id && (
              <div className={s.body}>
                <p>{m.message}</p>
                <div className={s.actions}>
                  <a className={s.primary} href={`mailto:${m.email}?subject=${encodeURIComponent("Re: Liên hệ từ portfolio")}`}>
                    Trả lời
                  </a>
                  <button className={s.ghost} onClick={() => setRead(m, !m.read_at)}>
                    {m.read_at ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  </button>
                  <button className={s.danger} onClick={() => remove(m)}>Xóa</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Khung giả lập thẻ đăng nhập Clerk khi thư viện đang tải (giữ bố cục không bị nhảy)
function SignInSkeleton() {
  return (
    <div className={s.signIn} aria-busy="true" aria-label="Đang tải">
      <div className={s.skCard}>
        <span className={`${s.sk} ${s.skTitle}`} />
        <span className={`${s.sk} ${s.skText}`} />
        <div className={s.skSocial}>
          <span className={s.sk} /><span className={s.sk} /><span className={s.sk} />
        </div>
        <span className={`${s.sk} ${s.skLabel}`} />
        <span className={`${s.sk} ${s.skInput}`} />
        <span className={`${s.sk} ${s.skButton}`} />
      </div>
    </div>
  );
}

// Các dòng giả lập danh sách tin nhắn khi đang gọi API
function ListSkeleton() {
  return (
    <ul className={s.list} aria-busy="true" aria-label="Đang tải">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className={`${s.item} ${s.skRow}`} style={{ animationDelay: `${i * 80}ms` }}>
          <span className={`${s.sk} ${s.skDot}`} />
          <span className={s.skWho}>
            <span className={`${s.sk} ${s.skName}`} />
            <span className={`${s.sk} ${s.skMail}`} />
          </span>
          <span className={`${s.sk} ${s.skPreview}`} style={{ width: `${90 - i * 9}%` }} />
          <span className={`${s.sk} ${s.skMeta}`} />
        </li>
      ))}
    </ul>
  );
}
