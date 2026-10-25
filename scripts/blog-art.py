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


# ---------------------------------------------------------------- Ảnh bìa (không có chữ)

def cover(kind):
    W, H = 1200, 600
    rnd = random.Random(kind)
    palettes = {
        "saga": (VIOLET, CYAN, "#1a1240"),
        "idem": (GREEN, CYAN, "#0c2a2a"),
        "aws": (AMBER, PINK, "#2a1a10"),
        "next": (CYAN, VIOLET, "#0e1a33"),
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
    ]
    for slug, name, fn, labels in jobs:
        for lang, L in labels.items():
            save(slug, f"{name}-{lang}.svg", fn(L))
    for slug, kind in [("banking-microservices-saga-outbox", "saga"), ("idempotent-payment-api", "idem"),
                       ("aws-banking-microservices-architecture", "aws"), ("nextjs-static-cloudflare-pages", "next")]:
        save(slug, "cover.svg", cover(kind))
    print("ok")


if __name__ == "__main__":
    main()
