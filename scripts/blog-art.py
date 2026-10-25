#!/usr/bin/env python3
"""Sinh ảnh bìa và sơ đồ SVG cho blog vào public/blog/<slug>/.

Chạy: python3 scripts/blog-art.py
Mỗi sơ đồ có bản tiếng Việt và tiếng Anh (<tên>-vi.svg, <tên>-en.svg); ảnh bìa không có chữ nên chỉ có một bản.
Ảnh có nền tối riêng nên hiển thị đẹp ở cả giao diện sáng và tối của trang.
"""
import math
import os
import random
from html import escape

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "blog")

# Bảng màu chung
BG = "#0b0e1a"
PANEL = "#141829"
PANEL_2 = "#1b2036"
LINE = "#2b3150"
TEXT = "#e8eaf4"
MUTED = "#9aa1bb"
FAINT = "#6b7290"
VIOLET = "#8b6dff"
CYAN = "#22d3ee"
GREEN = "#34d399"
RED = "#f87171"
AMBER = "#fbbf24"
PINK = "#f472b6"
FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"


def t(x, y, s, size=15, color=TEXT, weight=500, anchor="start", mono=False, opacity=1.0):
    fam = MONO if mono else FONT
    return (f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" font-weight="{weight}" '
            f'fill="{color}" text-anchor="{anchor}" opacity="{opacity}">{escape(s)}</text>')


def rect(x, y, w, h, fill=PANEL, stroke=LINE, r=14, sw=1.5, dash=None, opacity=1.0):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{sw}"{d} opacity="{opacity}"/>')


def box(x, y, w, h, title, sub=None, color=VIOLET, fill=PANEL, tag=None):
    """Hộp có dải màu bên trái, tiêu đề và dòng phụ."""
    out = [rect(x, y, w, h, fill=fill, stroke=color + "66"),
           f'<rect x="{x}" y="{y + 12}" width="4" height="{h - 24}" rx="2" fill="{color}"/>']
    cy = y + h / 2 + (0 if sub else 5)
    out.append(t(x + 18, cy - (4 if sub else 0), title, 15, TEXT, 650))
    if sub:
        out.append(t(x + 18, cy + 16, sub, 12.5, MUTED, 450))
    if tag:
        out.append(t(x + w - 12, y + 20, tag, 11, color, 700, "end", mono=True))
    return "".join(out)


def arrow(x1, y1, x2, y2, color=MUTED, label=None, dash=None, lx=None, ly=None, size=12.5, sw=2, curve=0):
    mid = "m" + color.lstrip("#")
    d = f' stroke-dasharray="{dash}"' if dash else ""
    if curve:
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2 + curve
        path = f"M{x1},{y1} Q{cx},{cy} {x2},{y2}"
    else:
        path = f"M{x1},{y1} L{x2},{y2}"
    out = [f'<path d="{path}" fill="none" stroke="{color}" stroke-width="{sw}"{d} marker-end="url(#{mid})"/>']
    if label:
        lx = lx if lx is not None else (x1 + x2) / 2
        ly = ly if ly is not None else (y1 + y2) / 2 - 8
        out.append(t(lx, ly, label, size, color, 600, "middle"))
    return "".join(out), (mid, color)


def svg(w, h, parts, markers, title):
    defs = "".join(
        f'<marker id="{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
        for mid, c in dict(markers).items()
    )
    grid = (f'<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">'
            f'<path d="M32 0H0V32" fill="none" stroke="#ffffff" stroke-opacity=".035"/></pattern>')
    glow = (f'<radialGradient id="glow" cx="85%" cy="0%" r="70%"><stop offset="0" stop-color="{VIOLET}" stop-opacity=".22"/>'
            f'<stop offset="1" stop-color="{VIOLET}" stop-opacity="0"/></radialGradient>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{escape(title)}">'
            f'<title>{escape(title)}</title><defs>{defs}{grid}{glow}</defs>'
            f'<rect width="{w}" height="{h}" rx="20" fill="{BG}"/>'
            f'<rect width="{w}" height="{h}" rx="20" fill="url(#grid)"/>'
            f'<rect width="{w}" height="{h}" rx="20" fill="url(#glow)"/>'
            + "".join(parts) + "</svg>")


class Canvas:
    def __init__(self):
        self.parts, self.markers = [], []

    def add(self, *items):
        for it in items:
            if isinstance(it, tuple):
                self.parts.append(it[0])
                self.markers.append(it[1])
            else:
                self.parts.append(it)

    def render(self, w, h, title):
        return svg(w, h, self.parts, self.markers, title)


def save(slug, name, content):
    d = os.path.join(ROOT, slug)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, name), "w") as f:
        f.write(content)


# ---------------------------------------------------------------- Saga + Outbox

def saga_flow(L):
    c = Canvas()
    W, H = 960, 470
    zones = [(20, 470, L["compensatable"], GREEN), (480, 150, L["pivot"], AMBER), (640, 300, L["retriable"], CYAN)]
    for x, w, label, col in zones:
        c.add(rect(x, 24, w, 300, fill=col + "0d", stroke=col + "40", r=16, dash="5 6"),
              t(x + 16, 50, label.upper(), 12, col, 800))
    steps = [
        (32, L["s1"], L["s1b"], VIOLET), (182, L["s2"], L["s2b"], VIOLET), (332, L["s3"], L["s3b"], VIOLET),
        (490, L["s4"], L["s4b"], AMBER), (650, L["s5"], L["s5b"], CYAN), (800, L["s6"], L["s6b"], CYAN),
    ]
    bw, by, bh = 132, 120, 84
    for i, (x, a, b, col) in enumerate(steps):
        c.add(box(x, by, bw, bh, a, b, col, tag=f"0{i + 1}"))
        if i < len(steps) - 1:
            nx = steps[i + 1][0]
            c.add(arrow(x + bw + 2, by + bh / 2, nx - 4, by + bh / 2, GREEN))
    # bù trừ
    c.add(arrow(332 + 40, by + bh + 6, 182 + 92, by + bh + 6, RED, L["undo"], dash="5 5", curve=46, ly=by + bh + 52))
    c.add(arrow(182 + 40, by + bh + 6, 32 + 92, by + bh + 6, RED, L["undo"], dash="5 5", curve=46, ly=by + bh + 52))
    c.add(t(181, 300, L["comp_note"], 12.5, RED, 600, "middle"))
    # pivot: không xác định
    c.add(rect(492, 236, 128, 74, fill=AMBER + "14", stroke=AMBER + "55", r=12),
          t(556, 262, L["timeout"], 12.5, AMBER, 700, "middle"),
          t(556, 282, "→ UNKNOWN", 12.5, AMBER, 700, "middle", mono=True),
          t(556, 300, L["inquiry"], 11.5, MUTED, 500, "middle"))
    # retry loop
    for x in (650, 800):
        cx = x + bw / 2
        c.add(f'<path d="M{cx - 22},{by + bh + 30} a22,16 0 1,0 44,0" fill="none" stroke="{CYAN}" stroke-width="2" stroke-dasharray="4 4"/>',
              t(cx, by + bh + 70, L["retry"], 12, CYAN, 600, "middle"))
    # chú giải
    ly = 372
    c.add(rect(20, ly, 920, 76, fill=PANEL, stroke=LINE, r=14))
    items = [(GREEN, L["leg_fwd"]), (RED, L["leg_comp"]), (AMBER, L["leg_pivot"]), (CYAN, L["leg_retry"])]
    for i, (col, s) in enumerate(items):
        x = 44 + i * 228
        c.add(f'<circle cx="{x}" cy="{ly + 38}" r="6" fill="{col}"/>', t(x + 14, ly + 43, s, 13, MUTED, 500))
    return c.render(W, H, L["title"])


def outbox(L):
    c = Canvas()
    W, H = 960, 440
    c.add(box(24, 150, 170, 84, L["svc"], L["svc_b"], VIOLET))
    # database
    c.add(rect(240, 40, 260, 300, fill=PANEL, stroke=CYAN + "66", r=18),
          t(370, 70, "PostgreSQL", 15, CYAN, 700, "middle"))
    c.add(rect(262, 98, 216, 84, fill=PANEL_2, stroke=LINE, r=10),
          t(280, 126, "account_holds", 14, TEXT, 650, mono=True),
          t(280, 150, "UPDATE status = 'ACTIVE'", 12, MUTED, 500, mono=True),
          t(280, 168, L["business"], 11.5, FAINT, 500))
    c.add(rect(262, 196, 216, 84, fill=PANEL_2, stroke=GREEN + "88", r=10),
          t(280, 224, "outbox", 14, GREEN, 700, mono=True),
          t(280, 248, "INSERT 'FundsHeld'", 12, MUTED, 500, mono=True),
          t(280, 266, L["same_tx"], 11.5, FAINT, 500))
    c.add(f'<path d="M490,102 h10 v174 h-10" fill="none" stroke="{GREEN}" stroke-width="2"/>',
          t(370, 318, L["one_commit"], 13, GREEN, 700, "middle"))
    c.add(arrow(196, 192, 236, 192, VIOLET))
    # relay
    c.add(box(530, 196, 150, 84, L["relay"], "Poller / Debezium", AMBER))
    c.add(arrow(480, 238, 526, 238, AMBER, L["reads"], ly=228))
    # kafka
    c.add(rect(708, 40, 228, 140, fill=PANEL, stroke=PINK + "66", r=16),
          t(724, 66, "Kafka · key = account_id", 13.5, PINK, 700))
    for i in range(3):
        y = 84 + i * 30
        c.add(rect(724, y, 196, 22, fill=PANEL_2, stroke=LINE, r=6), t(734, y + 15, f"partition {i}", 11, FAINT, 500, mono=True))
        for j in range(5 - i):
            c.add(f'<rect x="{812 + j * 20}" y="{y + 5}" width="14" height="12" rx="3" fill="{PINK}" opacity="{0.35 + j * 0.13}"/>')
    c.add(arrow(605, 192, 704, 120, AMBER, L["publish"], lx=640, ly=146))
    # consumers
    c.add(box(708, 214, 228, 64, L["ledger"], L["inbox"], GREEN))
    c.add(box(708, 292, 228, 56, L["notify"], None, CYAN))
    c.add(arrow(822, 182, 822, 210, PINK))
    c.add(rect(24, 372, 912, 46, fill=PANEL, stroke=LINE, r=12),
          t(44, 401, L["footer"], 13, MUTED, 500))
    return c.render(W, H, L["title"])


# ---------------------------------------------------------------- Idempotency

def idem_sequence(L):
    c = Canvas()
    W, H = 960, 650
    cols = [(110, L["client"], VIOLET), (370, "API", CYAN), (620, L["store"], GREEN), (850, L["core"], AMBER)]
    for x, name, col in cols:
        c.add(rect(x - 80, 24, 160, 46, fill=PANEL, stroke=col + "88", r=12), t(x, 53, name, 14, col, 700, "middle"),
              f'<line x1="{x}" y1="74" x2="{x}" y2="560" stroke="{LINE}" stroke-width="2" stroke-dasharray="3 6"/>')
    y = 108
    rows = [
        (110, 370, VIOLET, "POST /transfers · Key: K1", None),
        (370, 620, GREEN, "INSERT K1 → IN_PROGRESS ✓", None),
        (370, 850, AMBER, L["debit"], None),
        (850, 370, AMBER, "200 OK", "dash"),
        (370, 620, GREEN, "K1 → COMPLETED + response", None),
        (370, 110, RED, L["lost"], "lost"),
        (110, 370, VIOLET, L["retry"], None),
        (370, 620, GREEN, L["exists"], None),
        (370, 110, GREEN, L["replay"], "ok"),
    ]
    for x1, x2, col, label, kind in rows:
        if kind == "lost":
            c.add(arrow(x1, y, (x1 + x2) / 2 + 30, y, RED, None, dash="6 5"))
            mx = (x1 + x2) / 2 + 12
            c.add(f'<path d="M{mx - 9},{y - 9} l18,18 M{mx + 9},{y - 9} l-18,18" stroke="{RED}" stroke-width="3" stroke-linecap="round"/>',
                  t((x1 + x2) / 2, y - 14, label, 13, RED, 650, "middle"))
        else:
            c.add(arrow(x1, y, x2 + (-6 if x2 > x1 else 6), y, col, label, dash="6 5" if kind == "dash" else None, ly=y - 10, size=13))
        y += 50
        if kind == "lost":
            c.add(rect(30, y - 28, 900, 32, fill=AMBER + "10", stroke=AMBER + "40", r=8, dash="4 5"),
                  t(480, y - 7, L["timeout_band"], 12.5, AMBER, 600, "middle"))
            y += 44
    c.add(rect(560, y - 8, 380, 42, fill=GREEN + "14", stroke=GREEN + "66", r=10),
          t(750, y + 18, L["result"], 13.5, GREEN, 700, "middle"))
    return c.render(W, H, L["title"])


def timeout_budget(L):
    c = Canvas()
    W, H = 960, 330
    layers = [("Mobile app", 15, VIOLET), ("API Gateway", 12, CYAN), ("Payment service", 10, GREEN), ("Core / Switch", 8, AMBER)]
    x0, scale = 210, 44
    for i, (name, sec, col) in enumerate(layers):
        y = 40 + i * 58
        c.add(t(x0 - 18, y + 27, name, 14, TEXT, 600, "end"))
        c.add(f'<rect x="{x0}" y="{y + 6}" width="{sec * scale}" height="32" rx="8" fill="{col}" opacity=".85"/>',
              t(x0 + sec * scale - 12, y + 28, f"{sec}s", 13, "#0b0e1a", 800, "end"))
    for s in range(0, 16, 5):
        x = x0 + s * scale
        c.add(f'<line x1="{x}" y1="36" x2="{x}" y2="276" stroke="#ffffff" stroke-opacity=".06"/>', t(x, 296, f"{s}s", 11.5, FAINT, 500, "middle"))
    c.add(f'<line x1="{x0 + 8 * scale}" y1="30" x2="{x0 + 8 * scale}" y2="280" stroke="{RED}" stroke-width="2" stroke-dasharray="5 5"/>',
          t(x0 + 8 * scale + 8, 30, L["deadline"], 12.5, RED, 650))
    c.add(t(480, 320, L["caption"], 12.5, MUTED, 500, "middle"))
    return c.render(W, H, L["title"])


def retry_jitter(L):
    c = Canvas()
    W, H = 960, 380
    rnd = random.Random(7)
    panels = [(30, L["no_jitter"], RED, False), (500, L["jitter"], GREEN, True)]
    for px, title, col, jitter in panels:
        c.add(rect(px, 24, 430, 300, fill=PANEL, stroke=col + "55", r=16), t(px + 20, 54, title, 15, col, 700))
        base = 290
        c.add(f'<line x1="{px + 20}" y1="{base}" x2="{px + 410}" y2="{base}" stroke="{LINE}" stroke-width="2"/>')
        buckets = [0] * 39
        for attempt, delay in enumerate((0.2, 0.4, 0.8)):
            for _ in range(60 - attempt * 12):
                d = delay * (0.5 + rnd.random()) if jitter else delay
                total = sum((0.2, 0.4, 0.8)[:attempt]) + d
                idx = min(38, int(total / 1.6 * 38))
                buckets[idx] += 1
        peak = max(buckets)
        for i, v in enumerate(buckets):
            if not v:
                continue
            h = v / peak * 190
            c.add(f'<rect x="{px + 26 + i * 10}" y="{base - h}" width="7" height="{h}" rx="2" fill="{col}" opacity=".85"/>')
        c.add(t(px + 20, 312, "0s", 11, FAINT, 500), t(px + 410, 312, "1.6s", 11, FAINT, 500, "end"))
        if not jitter:
            c.add(f'<line x1="{px + 20}" y1="96" x2="{px + 410}" y2="96" stroke="{RED}" stroke-dasharray="4 5" stroke-opacity=".6"/>',
                  t(px + 410, 88, L["overload"], 12, RED, 600, "end"))
    c.add(t(480, 356, L["caption"], 12.5, MUTED, 500, "middle"))
    return c.render(W, H, L["title"])


# ---------------------------------------------------------------- AWS

def aws_arch(L):
    c = Canvas()
    W, H = 960, 680
    # edge
    c.add(box(24, 24, 150, 60, L["users"], "Mobile · Web", VIOLET))
    c.add(box(214, 24, 250, 60, "CloudFront + WAF", "Shield · TLS · rate limit", PINK))
    c.add(box(504, 24, 200, 60, "API Gateway", "JWT · mTLS · quota", CYAN))
    c.add(arrow(176, 54, 210, 54, MUTED), arrow(466, 54, 500, 54, MUTED))
    c.add(box(744, 24, 192, 60, L["partners"], "mTLS", AMBER))
    c.add(arrow(742, 54, 708, 54, AMBER))
    # VPC
    c.add(rect(24, 120, 690, 420, fill="#0f1324", stroke=CYAN + "55", r=18, dash="6 6"),
          t(44, 146, L["vpc"], 13.5, CYAN, 700))
    c.add(arrow(604, 86, 604, 168, CYAN, "VPC Link", lx=650, ly=134))
    for i in range(3):
        x = 44 + i * 222
        c.add(rect(x, 160, 208, 360, fill="#ffffff05", stroke="#ffffff10", r=12), t(x + 104, 512, f"AZ {chr(97 + i)}", 11.5, FAINT, 600, "middle"))
    # compute
    c.add(rect(56, 176, 626, 112, fill=PANEL, stroke=VIOLET + "66", r=14), t(74, 200, "EKS / ECS Fargate", 13.5, VIOLET, 700))
    svcs = ["auth", "account", "payment", "ledger", "notify"]
    for i, s in enumerate(svcs):
        x = 74 + i * 120
        c.add(rect(x, 216, 106, 52, fill=PANEL_2, stroke=LINE, r=10), t(x + 53, 247, s, 13.5, TEXT, 600, "middle", mono=True))
    # data
    data = [("Aurora PostgreSQL", "Multi-AZ · KMS", CYAN), ("Amazon MSK", "Kafka · outbox events", PINK), ("ElastiCache", "Redis · rate limit", GREEN)]
    for i, (a, b, col) in enumerate(data):
        x = 56 + i * 214
        c.add(box(x, 330, 198, 70, a, b, col))
        c.add(arrow(x + 99, 292, x + 99, 326, col))
    c.add(rect(56, 430, 626, 56, fill=PANEL, stroke=LINE, r=12),
          t(74, 463, "VPC Endpoints →  S3 · KMS · Secrets Manager · ECR · CloudWatch", 13, MUTED, 600))
    # cột phải
    c.add(rect(740, 120, 196, 196, fill=PANEL, stroke=GREEN + "55", r=16), t(756, 146, L["security"], 13.5, GREEN, 700))
    for i, s in enumerate(["KMS (CMK)", "Secrets Manager", L["iam"], L["token"]]):
        c.add(t(760, 178 + i * 32, "• " + s, 12.5, TEXT, 500))
    c.add(rect(740, 330, 196, 210, fill=PANEL, stroke=AMBER + "55", r=16), t(756, 356, L["observe"], 13.5, AMBER, 700))
    for i, s in enumerate(["CloudWatch", "X-Ray / OpenTelemetry", "CloudTrail", "S3 Object Lock", L["masked"]]):
        c.add(t(760, 388 + i * 30, "• " + s, 12.5, TEXT, 500))
    # on-prem
    c.add(rect(24, 572, 912, 84, fill=PANEL, stroke=FAINT + "66", r=16),
          t(44, 600, L["onprem"], 13.5, MUTED, 700),
          t(44, 630, L["onprem_b"], 13, TEXT, 500))
    c.add(arrow(370, 542, 370, 568, MUTED, "Direct Connect / VPN", lx=470, ly=560))
    return c.render(W, H, L["title"])


def aws_dr(L):
    c = Canvas()
    W, H = 960, 400
    for i, (name, role, col) in enumerate([(L["primary"], "ap-southeast-1", GREEN), (L["standby"], L["other_region"], AMBER)]):
        x = 24 + i * 480
        c.add(rect(x, 24, 432, 290, fill=PANEL, stroke=col + "66", r=18),
              t(x + 20, 54, name, 15, col, 700), t(x + 412, 54, role, 12, FAINT, 600, "end", mono=True))
        for a in range(3 if i == 0 else 2):
            ax = x + 20 + a * 136
            c.add(rect(ax, 74, 124, 112, fill="#ffffff05", stroke="#ffffff12", r=10),
                  t(ax + 62, 96, f"AZ {chr(97 + a)}", 11.5, FAINT, 600, "middle"))
            c.add(rect(ax + 14, 108, 96, 30, fill=PANEL_2, stroke=LINE, r=8),
                  t(ax + 62, 128, "services" if i == 0 else L["scaled"], 12, TEXT, 500, "middle", mono=True))
            c.add(rect(ax + 14, 146, 96, 30, fill=PANEL_2, stroke=CYAN + "55", r=8),
                  t(ax + 62, 166, "Aurora", 12, CYAN, 600, "middle", mono=True))
        c.add(rect(x + 20, 204, 392, 92, fill=col + "10", stroke=col + "44", r=12),
              t(x + 40, 232, L["writer"] if i == 0 else L["reader"], 13, col, 700),
              t(x + 40, 258, L["writer_b"] if i == 0 else L["reader_b"], 12.5, MUTED, 500),
              t(x + 40, 280, L["writer_c"] if i == 0 else L["reader_c"], 12.5, MUTED, 500))
    c.add(arrow(458, 160, 500, 160, CYAN, None, sw=3))
    c.add(t(480, 146, "Global DB", 11.5, CYAN, 700, "middle"))
    c.add(rect(24, 334, 912, 48, fill=PANEL, stroke=LINE, r=12),
          t(44, 364, L["footer"], 13, MUTED, 500))
    return c.render(W, H, L["title"])


# ---------------------------------------------------------------- Next.js lên Cloudflare Pages

def deploy_flow(L):
    c = Canvas()
    W, H = 960, 300
    steps = [("next build", L["b1"], VIOLET), ("out/", L["b2"], CYAN), ("wrangler", L["b3"], AMBER),
             ("Pages", L["b4"], PINK), (L["dom"], L["b5"], GREEN)]
    for i, (a, b, col) in enumerate(steps):
        x = 24 + i * 186
        c.add(box(x, 60, 164, 84, a, b, col, tag=f"0{i + 1}"))
        if i < len(steps) - 1:
            c.add(arrow(x + 166, 102, x + 184, 102, MUTED))
    pits = [(L["p1"], 24), (L["p2"], 24 + 3 * 186), (L["p3"], 24 + 4 * 186)]
    for s, x in pits:
        c.add(rect(x, 176, 164, 92, fill=RED + "10", stroke=RED + "44", r=12, dash="4 5"))
        for j, line in enumerate(s.split("|")):
            c.add(t(x + 14, 202 + j * 20, line, 12, RED if j == 0 else MUTED, 650 if j == 0 else 500))
    return c.render(W, H, L["title"])


DEPLOY = {
    "vi": dict(title="Quy trình đưa Next.js tĩnh lên Cloudflare Pages", b1="build tĩnh", b2="HTML/CSS/JS", b3="tải lên",
               b4="CDN toàn cầu", dom="Tên miền", b5="DNS + HTTPS",
               p1="Lỗi thường gặp|PPR không dùng|được khi export", p2="Lỗi 522|chưa có bản|deploy nào", p3="Không phân giải|thiếu bản ghi|CNAME / proxy"),
    "en": dict(title="Shipping a static Next.js site to Cloudflare Pages", b1="static build", b2="HTML/CSS/JS", b3="upload",
               b4="global CDN", dom="Domain", b5="DNS + HTTPS",
               p1="Common pitfall|PPR is not|allowed in export", p2="Error 522|no deployment|exists yet", p3="Not resolving|missing CNAME|or proxy record"),
}


# ---------------------------------------------------------------- View Transitions

def vt_lifecycle(L):
    c = Canvas()
    W, H = 960, 330
    steps = [(L["s1"], L["s1b"], VIOLET), (L["s2"], L["s2b"], CYAN), (L["s3"], L["s3b"], VIOLET),
             (L["s4"], L["s4b"], PINK), (L["s5"], L["s5b"], GREEN)]
    for i, (a, b, col) in enumerate(steps):
        x = 24 + i * 186
        c.add(box(x, 40, 164, 92, a, b, col, tag=f"0{i + 1}"))
        if i < len(steps) - 1:
            c.add(arrow(x + 166, 86, x + 184, 86, MUTED))
    # dải thời gian: người dùng thấy gì
    c.add(rect(24, 168, 912, 120, fill=PANEL, stroke=LINE, r=14), t(44, 196, L["sees"], 13, MUTED, 700))
    # bước 1–3: trang cũ đứng yên · bước 4: ảnh chụp chuyển cảnh · bước 5: trang mới thật
    bands = [(44, 3 * 186 - 42, L["old_live"], FAINT), (24 + 3 * 186, 164, L["snapshots"], PINK),
             (24 + 4 * 186, 164, L["new_live"], GREEN)]
    for x, w, label, col in bands:
        c.add(f'<rect x="{x}" y="214" width="{w}" height="34" rx="8" fill="{col}" fill-opacity=".18" stroke="{col}" stroke-opacity=".6"/>',
              t(x + w / 2, 236, label, 12, TEXT, 600, "middle"))
    c.add(t(44, 274, L["note"], 12, FAINT, 500))
    return c.render(W, H, L["title"])


def vt_tree(L):
    c = Canvas()
    W, H = 960, 400
    mono = lambda x, y, s, col=TEXT, size=14: t(x, y, s, size, col, 600, mono=True)
    c.add(rect(24, 24, 560, 352, fill=PANEL, stroke=LINE, r=16))
    rows = [
        (0, "::view-transition", MUTED, None),
        (1, "::view-transition-group(root)", VIOLET, L["g_root"]),
        (2, "::view-transition-image-pair(root)", VIOLET, None),
        (3, "::view-transition-old(root)", FAINT, L["old"]),
        (3, "::view-transition-new(root)", GREEN, L["new"]),
        (1, "::view-transition-group(shot-x)", PINK, L["g_named"]),
        (2, "::view-transition-image-pair(shot-x)", PINK, None),
        (3, "::view-transition-old(shot-x)", FAINT, None),
        (3, "::view-transition-new(shot-x)", GREEN, None),
    ]
    for i, (lvl, s, col, _) in enumerate(rows):
        y = 64 + i * 36
        x = 48 + lvl * 26
        if lvl:
            c.add(f'<path d="M{x - 16},{y - 22} V{y - 5} H{x - 4}" fill="none" stroke="{LINE}" stroke-width="2"/>')
        c.add(mono(x, y, s, col, 13.5))
    # chú thích bên phải
    notes = [(VIOLET, L["n1"], L["n1b"]), (PINK, L["n2"], L["n2b"]), (GREEN, L["n3"], L["n3b"])]
    for i, (col, a, b) in enumerate(notes):
        c.add(box(608, 24 + i * 120, 328, 104, a, b, col))
    return c.render(W, H, L["title"])


def vt_morph(L):
    c = Canvas()
    W, H = 960, 400
    # trang danh sách
    c.add(rect(24, 24, 380, 352, fill=PANEL, stroke=LINE, r=16), t(44, 54, L["list"], 13.5, MUTED, 700))
    for i in range(4):
        x, y = 44 + (i % 2) * 176, 74 + (i // 2) * 146
        hl = i == 1
        c.add(rect(x, y, 160, 130, fill=PANEL_2, stroke=PINK if hl else LINE, r=12, sw=2 if hl else 1.5))
        c.add(f'<rect x="{x + 10}" y="{y + 10}" width="140" height="64" rx="8" fill="{PINK if hl else LINE}" fill-opacity="{.55 if hl else .6}"/>')
        c.add(f'<rect x="{x + 10}" y="{y + 86}" width="{110 if hl else 96}" height="10" rx="5" fill="{CYAN if hl else LINE}"/>',
              f'<rect x="{x + 10}" y="{y + 104}" width="70" height="8" rx="4" fill="{LINE}"/>')
    # trang chi tiết
    c.add(rect(556, 24, 380, 352, fill=PANEL, stroke=LINE, r=16), t(576, 54, L["detail"], 13.5, MUTED, 700))
    c.add(f'<rect x="576" y="74" width="230" height="16" rx="8" fill="{CYAN}"/>')
    c.add(f'<rect x="576" y="108" width="340" height="170" rx="12" fill="{PINK}" fill-opacity=".55" stroke="{PINK}" stroke-width="2"/>')
    for i in range(3):
        c.add(f'<rect x="576" y="{296 + i * 22}" width="{320 - i * 60}" height="9" rx="4.5" fill="{LINE}"/>')
    c.add(arrow(370, 120, 572, 180, PINK, "shot-x", lx=490, ly=170, curve=-40, sw=2.5))
    c.add(arrow(338, 165, 572, 82, CYAN, "title-x", lx=505, ly=80, curve=-20, sw=2, dash="6 5"))
    c.add(rect(424, 300, 112, 60, fill=BG, stroke=LINE, r=10), t(480, 324, L["same"], 12, TEXT, 700, "middle"),
          t(480, 344, "view-transition-name", 10.5, MUTED, 500, "middle", mono=True))
    return c.render(W, H, L["title"])


VT_LIFE = {
    "vi": dict(title="Vòng đời một view transition", s1="Chụp cũ", s1b="ảnh trạng thái cũ", s2="Callback", s2b="cập nhật DOM",
               s3="Chụp mới", s3b="ảnh trạng thái mới", s4="Animation", s4b="cây pseudo-element", s5="Hoàn tất", s5b="gỡ lớp phủ",
               sees="NGƯỜI DÙNG NHÌN THẤY", old_live="Trang cũ (bị đóng băng)", snapshots="Ảnh chụp chuyển cảnh", new_live="Trang mới thật",
               note="startViewTransition(update) → .updateCallbackDone → .ready → .finished"),
    "en": dict(title="Lifecycle of a view transition", s1="Capture old", s1b="old state snapshot", s2="Callback", s2b="update the DOM",
               s3="Capture new", s3b="new state snapshot", s4="Animate", s4b="pseudo-element tree", s5="Finish", s5b="remove overlay",
               sees="WHAT THE USER SEES", old_live="Old page (frozen)", snapshots="Animated snapshots", new_live="Live new page",
               note="startViewTransition(update) → .updateCallbackDone → .ready → .finished"),
}
VT_TREE = {
    "vi": dict(title="Cây pseudo-element của View Transitions", g_root="", old="", new="", g_named="",
               n1="group(root)", n1b="Cả trang; mặc định mờ chéo", n2="group(tên riêng)", n2b="Phần tử có view-transition-name",
               n3="old / new", n3b="Ảnh cũ và mới: nơi viết animation"),
    "en": dict(title="The View Transitions pseudo-element tree", g_root="", old="", new="", g_named="",
               n1="group(root)", n1b="The whole page; cross-fades by default", n2="group(custom name)", n2b="Elements with a view-transition-name",
               n3="old / new", n3b="Old and new snapshots: animate these"),
}
VT_MORPH = {
    "vi": dict(title="Phần tử dùng chung bay từ danh sách sang trang chi tiết", list="Trang danh sách", detail="Trang chi tiết", same="Cùng tên"),
    "en": dict(title="A shared element flying from list to detail page", list="List page", detail="Detail page", same="Same name"),
}


# ---------------------------------------------------------------- Clerk + Worker

def auth_flow(L):
    c = Canvas()
    W, H = 960, 560
    cols = [(110, L["browser"], VIOLET), (350, "Clerk", PINK), (600, "Worker", CYAN), (850, "D1", GREEN)]
    for x, name, col in cols:
        c.add(rect(x - 90, 24, 180, 46, fill=PANEL, stroke=col + "88", r=12), t(x, 53, name, 14, col, 700, "middle"),
              f'<line x1="{x}" y1="74" x2="{x}" y2="480" stroke="{LINE}" stroke-width="2" stroke-dasharray="3 6"/>')
    rows = [
        (110, 350, VIOLET, L["r1"]),
        (350, 110, PINK, L["r2"]),
        (110, 600, VIOLET, "GET /admin/messages · Bearer JWT"),
        (600, 600, CYAN, L["r4"]),
        (600, 350, CYAN, L["r5"]),
        (350, 600, PINK, "publicMetadata.role = admin"),
        (600, 850, GREEN, "SELECT … FROM messages"),
        (600, 110, GREEN, L["r8"]),
    ]
    y = 110
    for x1, x2, col, label in rows:
        if x1 == x2:
            c.add(f'<path d="M{x1},{y - 8} h44 v26 h-38" fill="none" stroke="{col}" stroke-width="2" marker-end="url(#m{col.lstrip("#")})"/>',
                  t(x1 + 56, y + 9, label, 13, col, 650))
            c.markers.append(("m" + col.lstrip("#"), col))
            y += 56
            continue
        c.add(arrow(x1, y, x2 + (-6 if x2 > x1 else 6), y, col, label, ly=y - 10, size=13))
        y += 46
    c.add(rect(24, 496, 912, 44, fill=AMBER + "10", stroke=AMBER + "44", r=10),
          t(480, 523, L["footer"], 13, AMBER, 600, "middle"))
    return c.render(W, H, L["title"])


def auth_defense(L):
    c = Canvas()
    W, H = 960, 360
    layers = [("CORS", L["l1"], PINK), (L["l2a"], L["l2"], VIOLET), ("azp", L["l3"], CYAN), (L["l4a"], L["l4"], AMBER)]
    c.add(box(24, 130, 130, 84, "Request", "Bearer JWT", MUTED))
    for i, (a, b, col) in enumerate(layers):
        x = 190 + i * 164
        c.add(rect(x, 40, 140, 264, fill=col + "0f", stroke=col + "66", r=14))
        c.add(t(x + 70, 72, a, 15, col, 700, "middle"))
        for j, line in enumerate(b.split("|")):
            c.add(t(x + 70, 104 + j * 20, line, 12, MUTED, 500, "middle"))
        c.add(rect(x + 20, 234, 100, 30, fill=RED + "14", stroke=RED + "55", r=8),
              t(x + 70, 254, ["CORS ✗", "401", "401", "403"][i], 12.5, RED, 700, "middle", mono=True))
        c.add(arrow(x - 22 if i else 156, 172, x - 4, 172, GREEN))
    c.add(arrow(848, 172, 866, 172, GREEN))
    c.add(box(870, 130, 66, 84, "D1", None, GREEN))
    c.add(t(480, 336, L["footer"], 12.5, MUTED, 500, "middle"))
    return c.render(W, H, L["title"])


AUTH_FLOW = {
    "vi": dict(title="Luồng đăng nhập và gọi API quản trị", browser="Trình duyệt /admin", r1="đăng nhập (SignIn, routing=hash)",
               r2="phiên + session token (JWT ngắn hạn)", r4="verifyToken: chữ ký, hạn, azp", r5="users.getUser(sub)",
               r8="200 · danh sách tin nhắn", footer="Secret key chỉ nằm ở Worker · Trang tĩnh không giữ bí mật nào"),
    "en": dict(title="Signing in and calling the admin API", browser="Browser /admin", r1="sign in (SignIn, routing=hash)",
               r2="session + short-lived JWT", r4="verifyToken: signature, expiry, azp", r5="users.getUser(sub)",
               r8="200 · messages", footer="The secret key lives only in the Worker · The static page holds no secrets"),
}
AUTH_DEF = {
    "vi": dict(title="Các lớp kiểm tra của Worker", l1="chỉ origin|của site", l2a="Chữ ký", l2="đúng khóa,|còn hạn",
               l3="token phát cho|đúng website", l4a="Vai trò", l4="publicMetadata|.role = admin",
               footer="Kiểm tra ở giao diện chỉ để hiển thị; quyết định thật nằm ở đây, cho mọi request"),
    "en": dict(title="The Worker's layers of checks", l1="site origin|only", l2a="Signature", l2="right key,|not expired",
               l3="issued for|this website", l4a="Role", l4="publicMetadata|.role = admin",
               footer="UI checks are cosmetic; the real decision happens here, on every request"),
}


# ---------------------------------------------------------------- AI coding agents

def agent_loop(L):
    c = Canvas()
    W, H = 960, 440
    cx, cy, R = 320, 222, 168
    c.add(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="{LINE}" stroke-width="2" stroke-dasharray="4 7"/>')
    nodes = [(L["plan"], L["plan_b"], VIOLET, -90), (L["act"], L["act_b"], CYAN, 0), (L["observe"], L["observe_b"], AMBER, 90), (L["verify"], L["verify_b"], GREEN, 180)]
    pts = []
    for a, b, col, ang in nodes:
        x = cx + R * math.cos(math.radians(ang))
        y = cy + R * math.sin(math.radians(ang))
        pts.append((x, y))
        c.add(box(x - 82, y - 36, 164, 72, a, b, col))
    for i in range(4):
        a0 = -90 + i * 90 + 30
        a1 = a0 + 30
        x0, y0 = cx + R * math.cos(math.radians(a0)), cy + R * math.sin(math.radians(a0))
        x1, y1 = cx + R * math.cos(math.radians(a1)), cy + R * math.sin(math.radians(a1))
        c.add(arrow(x0, y0, x1, y1, MUTED, sw=2.5))
    c.add(t(cx, cy - 4, L["center"], 14, TEXT, 700, "middle"), t(cx, cy + 18, L["center_b"], 12, MUTED, 500, "middle"))
    # công cụ
    c.add(rect(600, 40, 336, 236, fill=PANEL, stroke=CYAN + "55", r=16), t(620, 68, L["tools"], 13.5, CYAN, 700))
    for i, s in enumerate(L["tool_list"]):
        c.add(t(624, 100 + i * 30, "› " + s, 13, TEXT, 500, mono=True))
    c.add(rect(600, 296, 336, 104, fill=GREEN + "10", stroke=GREEN + "55", r=16), t(620, 324, L["done"], 13.5, GREEN, 700))
    for i, s in enumerate(L["done_b"].split("|")):
        c.add(t(620, 350 + i * 22, s, 12.5, MUTED, 500))
    return c.render(W, H, L["title"])


def agent_workflow(L):
    c = Canvas()
    W, H = 960, 330
    steps = L["steps"]
    for i, (a, b, human) in enumerate(steps):
        x = 24 + i * 156
        col = AMBER if human else VIOLET
        c.add(box(x, 60, 136, 92, a, b, col, tag=f"0{i + 1}"))
        if human:
            c.add(rect(x + 18, 166, 100, 28, fill=AMBER + "18", stroke=AMBER + "66", r=14),
                  t(x + 68, 185, L["human"], 12, AMBER, 700, "middle"))
        if i < len(steps) - 1:
            c.add(arrow(x + 138, 106, x + 154, 106, MUTED))
    c.add(f'<path d="M{24 + 3 * 156 + 68},{154} C{24 + 3 * 156 + 68},{260} {24 + 2 * 156 + 68},{260} {24 + 2 * 156 + 68},{158}" fill="none" stroke="{RED}" stroke-width="2" stroke-dasharray="5 5" marker-end="url(#m{RED.lstrip("#")})"/>',
          t(24 + 2.5 * 156 + 68, 252, L["fail"], 12, RED, 600, "middle"))
    c.markers.append(("m" + RED.lstrip("#"), RED))
    c.add(rect(24, 274, 912, 40, fill=PANEL, stroke=LINE, r=10), t(480, 299, L["footer"], 12.5, MUTED, 500, "middle"))
    return c.render(W, H, L["title"])


AGENT_LOOP = {
    "vi": dict(title="Vòng lặp làm việc của một coding agent", plan="Lên kế hoạch", plan_b="chia nhỏ việc", act="Hành động", act_b="gọi công cụ",
               observe="Quan sát", observe_b="đọc output, lỗi", verify="Kiểm chứng", verify_b="test, build, ảnh",
               center="Lặp lại", center_b="đến khi đạt tiêu chí", tools="CÔNG CỤ",
               tool_list=["read / search files", "edit files", "run: npm test", "run: npm run build", "browser screenshot", "MCP: issues, logs, docs"],
               done="TIÊU CHÍ HOÀN THÀNH", done_b="Do bạn đặt ra khi giao việc|và agent kiểm chứng được"),
    "en": dict(title="The working loop of a coding agent", plan="Plan", plan_b="break the task down", act="Act", act_b="call tools",
               observe="Observe", observe_b="read output, errors", verify="Verify", verify_b="tests, build, UI",
               center="Repeat", center_b="until criteria are met", tools="TOOLS",
               tool_list=["read / search files", "edit files", "run: npm test", "run: npm run build", "browser screenshot", "MCP: issues, logs, docs"],
               done="ACCEPTANCE CRITERIA", done_b="Set by you when handing over the task|and checkable by the agent"),
}
AGENT_FLOW = {
    "vi": dict(title="Quy trình giao việc cho AI agent", human="Người quyết",
               steps=[("Yêu cầu", "mục tiêu, tiêu chí", True), ("Kế hoạch", "agent đề xuất", True), ("Thực hiện", "nhánh riêng", False),
                      ("Kiểm chứng", "test · build · CI", False), ("Pull request", "review diff", True), ("Deploy", "merge, phát hành", True)],
               fail="lỗi → agent sửa tiếp",
               footer="Agent làm phần lớn việc · Con người giữ các điểm quyết định · Không push thẳng lên main"),
    "en": dict(title="Handing work to an AI agent", human="Human call",
               steps=[("Request", "goal, criteria", True), ("Plan", "agent proposes", True), ("Implement", "own branch", False),
                      ("Verify", "tests · build · CI", False), ("Pull request", "review the diff", True), ("Deploy", "merge, release", True)],
               fail="failure → agent fixes it",
               footer="The agent does most of the work · Humans keep the decision points · Never push straight to main"),
}


# ---------------------------------------------------------------- Ảnh bìa (không có chữ)

def cover(kind):
    W, H = 1200, 600
    rnd = random.Random(kind)
    palettes = {
        "saga": (VIOLET, CYAN, "#1a1240"),
        "idem": (GREEN, CYAN, "#0c2a2a"),
        "aws": (AMBER, PINK, "#2a1a10"),
        "next": (CYAN, VIOLET, "#0e1a33"),
        "vt": (PINK, CYAN, "#2a1030"),
        "auth": (VIOLET, GREEN, "#121a38"),
        "ai": (PINK, VIOLET, "#24103a"),
    }
    a, b, deep = palettes[kind]
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" aria-hidden="true">',
         f'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{deep}"/><stop offset="1" stop-color="{BG}"/></linearGradient>',
         f'<radialGradient id="ga" cx="20%" cy="10%" r="60%"><stop offset="0" stop-color="{a}" stop-opacity=".45"/><stop offset="1" stop-color="{a}" stop-opacity="0"/></radialGradient>',
         f'<radialGradient id="gb" cx="90%" cy="100%" r="60%"><stop offset="0" stop-color="{b}" stop-opacity=".35"/><stop offset="1" stop-color="{b}" stop-opacity="0"/></radialGradient>',
         f'<linearGradient id="ln" x1="0" x2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>',
         '<pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#fff" fill-opacity=".07"/></pattern></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#bg)"/><rect width="{W}" height="{H}" fill="url(#dots)"/>',
         f'<rect width="{W}" height="{H}" fill="url(#ga)"/><rect width="{W}" height="{H}" fill="url(#gb)"/>']

    def node(x, y, r, col, fill_op=.18):
        return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}" fill-opacity="{fill_op}" stroke="{col}" stroke-width="3"/>'
                f'<circle cx="{x}" cy="{y}" r="{r * .32}" fill="{col}"/>')

    if kind == "saga":
        pts = [(170, 360), (350, 250), (540, 330), (720, 220), (900, 300), (1060, 190)]
        p.append('<path d="M' + " L".join(f"{x},{y}" for x, y in pts) + '" fill="none" stroke="url(#ln)" stroke-width="6" stroke-linecap="round"/>')
        back = pts[:3][::-1]
        p.append('<path d="M' + " L".join(f"{x},{y + 70}" for x, y in back) + f'" fill="none" stroke="{RED}" stroke-width="3" stroke-dasharray="10 10" opacity=".7"/>')
        for i, (x, y) in enumerate(pts):
            p.append(node(x, y, 30 if i != 3 else 40, AMBER if i == 3 else (a if i < 3 else b)))
    elif kind == "idem":
        # nhiều mũi tên hội tụ thành một
        for i in range(7):
            y = 120 + i * 60
            p.append(f'<path d="M120,{y} C420,{y} 420,300 640,300" fill="none" stroke="url(#ln)" stroke-width="4" opacity="{.25 + i * .08}"/>')
        p.append(f'<path d="M640,300 L1000,300" stroke="{GREEN}" stroke-width="10" stroke-linecap="round"/>')
        p.append(f'<path d="M985,270 L1045,300 L985,330 z" fill="{GREEN}"/>')
        # chìa khóa
        p.append(f'<g transform="translate(640 300)"><circle r="62" fill="{BG}" stroke="{CYAN}" stroke-width="6"/>'
                 f'<circle cx="-14" r="18" fill="none" stroke="{CYAN}" stroke-width="7"/>'
                 f'<path d="M4,0 h34 M26,0 v14 M36,0 v10" stroke="{CYAN}" stroke-width="7" stroke-linecap="round"/></g>')
    elif kind == "aws":
        # các lớp phòng thủ đồng tâm và đám mây
        for i, r in enumerate((250, 195, 140, 85)):
            col = [PINK, CYAN, VIOLET, AMBER][i]
            p.append(f'<rect x="{600 - r * 1.6}" y="{310 - r}" width="{r * 3.2}" height="{r * 2}" rx="{40 + i * 6}" fill="{col}" fill-opacity=".05" stroke="{col}" stroke-width="3" stroke-opacity=".7" stroke-dasharray="{"" if i % 2 else "14 10"}"/>')
        p.append(f'<path d="M520,345 a48,48 0 0,1 12,-94 a66,66 0 0,1 124,-14 a52,52 0 0,1 42,108 z" fill="{AMBER}" fill-opacity=".9"/>')
        for i in range(5):
            x = 230 + i * 185
            p.append(f'<rect x="{x}" y="520" width="140" height="18" rx="9" fill="url(#ln)" opacity=".5"/>')
    elif kind == "vt":
        # thẻ nhỏ bay thành khung lớn, kèm các vệt chuyển động
        p.append(f'<rect x="150" y="330" width="220" height="150" rx="18" fill="{PANEL}" stroke="{LINE}" stroke-width="3"/>'
                 f'<rect x="166" y="346" width="188" height="86" rx="10" fill="{a}" fill-opacity=".6"/>')
        for i in range(3):
            o = .18 + i * .2
            x, y, w, h = 250 + i * 150, 290 - i * 70, 300 + i * 90, 200 + i * 40
            p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="{a}" fill-opacity="{o * .5}" stroke="url(#ln)" stroke-width="3" stroke-opacity="{o + .2}"/>')
        p.append(f'<path d="M370,400 C520,380 600,250 700,190" fill="none" stroke="url(#ln)" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/>')
    elif kind == "auth":
        # ổ khóa và token
        p.append(f'<path d="M520,270 v-60 a80,80 0 0,1 160,0 v60" fill="none" stroke="url(#ln)" stroke-width="22" stroke-linecap="round"/>'
                 f'<rect x="460" y="260" width="280" height="220" rx="36" fill="{PANEL}" stroke="url(#ln)" stroke-width="5"/>'
                 f'<circle cx="600" cy="350" r="26" fill="{b}"/><rect x="590" y="360" width="20" height="60" rx="10" fill="{b}"/>')
        for i in range(3):
            x = 150 + i * 30
            p.append(f'<rect x="{x}" y="{200 + i * 70}" width="210" height="44" rx="22" fill="{a}" fill-opacity="{.2 + i * .15}" stroke="{a}" stroke-opacity=".7" stroke-width="2"/>')
        for i in range(4):
            p.append(f'<circle cx="{850 + i * 60}" cy="{240 + (i % 2) * 120}" r="{14 + i * 3}" fill="{b}" fill-opacity="{.25 + i * .15}"/>')
    elif kind == "ai":
        # vòng lặp agent: các nút trên quỹ đạo quanh một lõi
        cx, cy = 600, 300
        for r, op in ((230, .25), (165, .4)):
            p.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="url(#ln)" stroke-width="3" stroke-opacity="{op}" stroke-dasharray="6 12"/>')
        p.append(f'<circle cx="{cx}" cy="{cy}" r="78" fill="{PANEL}" stroke="url(#ln)" stroke-width="5"/>'
                 f'<path d="M{cx - 30},{cy - 10} l20,20 l-20,20 M{cx + 4},{cy + 30} h32" fill="none" stroke="{a}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>')
        for i, ang in enumerate((-90, -10, 70, 160, 230)):
            r = 230 if i % 2 else 165
            x = cx + r * math.cos(math.radians(ang)); y = cy + r * math.sin(math.radians(ang))
            p.append(node(x, y, 22 + (i % 3) * 5, (a, b, CYAN, GREEN, AMBER)[i]))
    else:
        # cửa sổ trình duyệt và đám mây
        p.append(f'<rect x="250" y="120" width="700" height="380" rx="26" fill="{PANEL}" stroke="url(#ln)" stroke-width="4"/>'
                 f'<path d="M250,182 h700" stroke="{LINE}" stroke-width="3"/>')
        for i, col in enumerate(("#ff5f57", "#febc2e", "#28c840")):
            p.append(f'<circle cx="{290 + i * 30}" cy="151" r="9" fill="{col}"/>')
        for i in range(4):
            w = rnd.randint(260, 560)
            p.append(f'<rect x="300" y="{230 + i * 56}" width="{w}" height="22" rx="11" fill="url(#ln)" opacity="{.75 - i * .15}"/>')
        p.append(f'<path d="M800,470 a44,44 0 0,1 10,-86 a60,60 0 0,1 112,-12 a46,46 0 0,1 38,98 z" fill="{CYAN}" fill-opacity=".9"/>')
    p.append("</svg>")
    return "".join(p)


# ---------------------------------------------------------------- Nhãn theo ngôn ngữ

SAGA = {
    "vi": dict(title="Luồng Saga chuyển tiền liên ngân hàng", compensatable="Có thể bù trừ", pivot="Không quay lại", retriable="Chỉ thử lại",
               s1="Payment", s1b="tạo lệnh PENDING", s2="Limit", s2b="giữ hạn mức", s3="Account", s3b="phong tỏa tiền",
               s4="Gateway", s4b="gửi liên ngân hàng", s5="Ledger", s5b="hạch toán", s6="Notify", s6b="báo khách hàng",
               undo="bù trừ", comp_note="Lỗi ở bước sau → hoàn tác ngược lại", timeout="Hết thời gian chờ", inquiry="tra cứu, chưa bù trừ",
               retry="thử lại đến khi xong", leg_fwd="Bước tiếp theo", leg_comp="Hành động bù trừ", leg_pivot="Không thể hoàn tác", leg_retry="Thử lại, không thất bại"),
    "en": dict(title="Saga flow for an interbank transfer", compensatable="Compensatable", pivot="Pivot", retriable="Retriable",
               s1="Payment", s1b="order PENDING", s2="Limit", s2b="reserve limit", s3="Account", s3b="hold funds",
               s4="Gateway", s4b="send to switch", s5="Ledger", s5b="post entries", s6="Notify", s6b="tell customer",
               undo="compensate", comp_note="A later step fails → undo in reverse", timeout="Timed out", inquiry="inquire, don't undo yet",
               retry="retry until done", leg_fwd="Next step", leg_comp="Compensation", leg_pivot="Cannot be undone", leg_retry="Retry, never fail"),
}
OUTBOX = {
    "vi": dict(title="Transactional Outbox và consumer idempotent", svc="Payment service", svc_b="một transaction", business="dữ liệu nghiệp vụ",
               same_tx="sự kiện, cùng transaction", one_commit="1 lần COMMIT cho cả hai", relay="Relay", reads="đọc", publish="publish",
               ledger="Ledger service", inbox="inbox: message_id duy nhất", notify="Notification service",
               footer="Ghi DB và ghi sự kiện không thể lệch nhau · Kafka giao ít nhất một lần → consumer bỏ qua message trùng"),
    "en": dict(title="Transactional Outbox and idempotent consumers", svc="Payment service", svc_b="one transaction", business="business data",
               same_tx="event, same transaction", one_commit="one COMMIT for both", relay="Relay", reads="reads", publish="publish",
               ledger="Ledger service", inbox="inbox: unique message_id", notify="Notification service",
               footer="Data and events can never drift apart · Kafka delivers at least once → consumers drop duplicates"),
}
IDEM = {
    "vi": dict(title="Idempotency-Key chặn trừ tiền hai lần", client="Ứng dụng", store="Kho khóa", core="Core banking",
               debit="trừ tiền 5.000.000đ", lost="phản hồi bị mất", timeout_band="Ứng dụng hết thời gian chờ → gửi lại với CÙNG khóa",
               retry="gửi lại · Key: K1", exists="K1 đã COMPLETED", replay="trả lại kết quả đã lưu",
               result="Chỉ trừ tiền 1 lần ✓"),
    "en": dict(title="Idempotency-Key prevents double charges", client="App", store="Key store", core="Core banking",
               debit="debit 5,000,000 VND", lost="response lost", timeout_band="App times out → retries with the SAME key",
               retry="retry · Key: K1", exists="K1 already COMPLETED", replay="replay stored response",
               result="Charged exactly once ✓"),
}
TIMEOUT = {
    "vi": dict(title="Ngân sách timeout giảm dần từ ngoài vào trong", deadline="tầng trong cùng dừng trước",
               caption="Mỗi tầng chờ ngắn hơn tầng bên ngoài, nên không có request nào vẫn chạy sau khi client đã bỏ cuộc"),
    "en": dict(title="Timeout budget shrinking from the outside in", deadline="innermost layer stops first",
               caption="Each layer waits less than the one outside it, so nothing keeps running after the client gives up"),
}
JITTER = {
    "vi": dict(title="Retry có và không có jitter", no_jitter="Không jitter: dồn cùng lúc", jitter="Có jitter: trải đều",
               overload="quá tải", caption="Số request thử lại theo thời gian sau một sự cố (backoff 0.2s → 0.4s → 0.8s)"),
    "en": dict(title="Retries with and without jitter", no_jitter="No jitter: synchronized spikes", jitter="With jitter: spread out",
               overload="overload", caption="Retried requests over time after an incident (backoff 0.2s → 0.4s → 0.8s)"),
}
AWS = {
    "vi": dict(title="Kiến trúc tham chiếu microservices ngân hàng trên AWS", users="Người dùng", partners="Đối tác / Fintech",
               vpc="VPC · private subnets · 3 Availability Zones", security="Bảo mật", iam="IAM role mỗi service", token="Token hóa dữ liệu thẻ",
               observe="Giám sát & kiểm toán", masked="Log che dữ liệu", onprem="Hệ thống tại chỗ",
               onprem_b="Core banking hiện hữu · Hệ thống thanh toán liên ngân hàng · Kho dữ liệu"),
    "en": dict(title="Reference architecture for banking microservices on AWS", users="Users", partners="Partners / Fintechs",
               vpc="VPC · private subnets · 3 Availability Zones", security="Security", iam="IAM role per service", token="Card data tokenisation",
               observe="Observability & audit", masked="Masked logs", onprem="On-premises",
               onprem_b="Existing core banking · Interbank payment network · Data warehouse"),
}
DR = {
    "vi": dict(title="Khôi phục thảm họa đa region", primary="Region chính", standby="Region dự phòng", other_region="region khác",
               scaled="thu nhỏ", writer="Aurora writer", writer_b="Nhận toàn bộ ghi/đọc", writer_c="Multi-AZ: chịu được mất 1 AZ",
               reader="Aurora Global DB (reader)", reader_b="Sao chép, độ trễ thường dưới 1 giây", reader_c="Nâng thành writer khi chuyển đổi",
               footer="Xác định RTO/RPO trước · Hạ tầng dựng lại bằng IaC · Diễn tập chuyển đổi định kỳ"),
    "en": dict(title="Multi-region disaster recovery", primary="Primary region", standby="Standby region", other_region="another region",
               scaled="scaled-down", writer="Aurora writer", writer_b="Serves all reads and writes", writer_c="Multi-AZ: survives losing one AZ",
               reader="Aurora Global DB (reader)", reader_b="Replicated, typically under a second behind", reader_c="Promoted to writer on failover",
               footer="Agree RTO/RPO first · Rebuild infrastructure with IaC · Rehearse failover regularly"),
}


def main():
    jobs = [
        ("banking-microservices-saga-outbox", "saga-flow", saga_flow, SAGA),
        ("banking-microservices-saga-outbox", "outbox", outbox, OUTBOX),
        ("idempotent-payment-api", "sequence", idem_sequence, IDEM),
        ("idempotent-payment-api", "timeout-budget", timeout_budget, TIMEOUT),
        ("idempotent-payment-api", "retry-jitter", retry_jitter, JITTER),
        ("aws-banking-microservices-architecture", "architecture", aws_arch, AWS),
        ("aws-banking-microservices-architecture", "disaster-recovery", aws_dr, DR),
        ("nextjs-static-cloudflare-pages", "deploy-flow", deploy_flow, DEPLOY),
        ("view-transitions-api", "lifecycle", vt_lifecycle, VT_LIFE),
        ("view-transitions-api", "pseudo-tree", vt_tree, VT_TREE),
        ("view-transitions-api", "morph", vt_morph, VT_MORPH),
        ("clerk-auth-static-site-cloudflare-worker", "auth-flow", auth_flow, AUTH_FLOW),
        ("clerk-auth-static-site-cloudflare-worker", "defense", auth_defense, AUTH_DEF),
        ("ai-coding-agents-workflow", "agent-loop", agent_loop, AGENT_LOOP),
        ("ai-coding-agents-workflow", "workflow", agent_workflow, AGENT_FLOW),
    ]
    for slug, name, fn, labels in jobs:
        for lang, L in labels.items():
            save(slug, f"{name}-{lang}.svg", fn(L))
    for slug, kind in [("banking-microservices-saga-outbox", "saga"), ("idempotent-payment-api", "idem"),
                       ("aws-banking-microservices-architecture", "aws"), ("nextjs-static-cloudflare-pages", "next"),
                       ("view-transitions-api", "vt"), ("clerk-auth-static-site-cloudflare-worker", "auth"),
                       ("ai-coding-agents-workflow", "ai")]:
        save(slug, "cover.svg", cover(kind))
    print("ok")


if __name__ == "__main__":
    main()
