#!/usr/bin/env python3
"""把 GitHub Traffic API 的每日访问量累积成历史，并渲染成可在 README 嵌入的 SVG 折线图。

只用 Python 标准库，无 pip 依赖。GitHub 官方 Traffic API 只保留最近 14 天，
所以必须每天跑一次把数据落到仓库里，否则历史永久丢失。

输入（环境变量）:
    GITHUB_TOKEN  具备本仓库 push 权限的 token（workflow 里用 secrets.GITHUB_TOKEN 即可）
    REPOSITORY    owner/repo 形式，如 hzhgino/dsh-caonima
输出（写入当前目录）:
    traffic/history.json  按天累积的 {date: {views, uniques}}
    traffic/views.svg     最近 30 天的 views / uniques 折线图
    traffic/badge.json    shields.io endpoint 格式的总访问量徽章
"""

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone

HISTORY_FILE = "traffic/history.json"
SVG_FILE = "traffic/views.svg"
BADGE_FILE = "traffic/badge.json"
WINDOW_DAYS = 30          # 图中展示的天数
KEEP_DAYS = 365           # 历史文件保留天数
API_VERSION = "2022-11-28"


def fail(msg):
    """打印清晰的错误信息并以非零码退出，便于在 Actions 日志里定位。"""
    print(f"[traffic] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def fetch_traffic(repo, token):
    """调用 Traffic API 拉取 views（含 uniques）。失败时抛出带上下文的异常。"""
    url = f"https://api.github.com/repos/{repo}/traffic/views"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "traffic-graph-action",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        fail(f"Traffic API 返回 {e.code}（{url}）。确认 token 对该仓库有 push 权限。")
    except urllib.error.URLError as e:
        fail(f"无法连接 GitHub API: {e.reason}")


def load_history():
    """读取已累积的历史；文件不存在或损坏时返回空 dict，不中断流程。"""
    if not os.path.exists(HISTORY_FILE):
        return {}
    try:
        with open(HISTORY_FILE, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError) as e:
        print(f"[traffic] WARN: 历史文件读取失败，将从零重建: {e}", file=sys.stderr)
        return {}


def merge_history(history, api_data, today):
    """把 API 返回的近 14 天数据并入历史，同日直接覆盖，并裁剪到 KEEP_DAYS 窗口。"""
    for item in api_data.get("views", []):
        # timestamp 形如 2026-09-21T00:00:00Z，取日期部分作为 key
        day = str(item.get("timestamp", ""))[:10]
        if not day:
            continue
        history[day] = {
            "views": int(item.get("count", 0)),
            "uniques": int(item.get("uniques", 0)),
        }
    cutoff = (today - timedelta(days=KEEP_DAYS)).isoformat()
    return {d: v for d, v in sorted(history.items()) if d >= cutoff}


def build_series(history, today):
    """补齐最近 WINDOW_DAYS 天的空洞（缺数据填 0），返回等长序列。"""
    days = [(today - timedelta(days=i)).isoformat() for i in range(WINDOW_DAYS - 1, -1, -1)]
    views = [history.get(d, {}).get("views", 0) for d in days]
    uniques = [history.get(d, {}).get("uniques", 0) for d in days]
    return days, views, uniques


def nice_ceiling(value):
    """把 y 轴上界取整到好看的刻度值（1/2/5 × 10^n），避免出现 37 这种刻度。"""
    if value <= 5:
        return 5
    import math
    magnitude = 10 ** (len(str(int(value))) - 1)
    for step in (1, 2, 5, 10):
        if value <= step * magnitude:
            return step * magnitude
    return 10 * magnitude


def render_svg(days, views, uniques):
    """渲染折线图。颜色走 prefers-color-scheme，浅色/深色主题下都可读。"""
    W, H = 800, 260
    PAD_L, PAD_R, PAD_T, PAD_B = 58, 18, 30, 40
    plot_w = W - PAD_L - PAD_R
    plot_h = H - PAD_T - PAD_B

    peak = max(views + uniques) or 1
    y_max = nice_ceiling(peak)
    n = len(days)
    step_x = plot_w / (n - 1) if n > 1 else plot_w

    def px(i):
        return PAD_L + i * step_x

    def py(v):
        return PAD_T + plot_h - (v / y_max) * plot_h

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
        'role="img" aria-label="Repository traffic">',
        "<style>"
        ".bg{fill:#fff}.grid{stroke:#eaeef2}.lbl{fill:#57606a}"
        ".v{fill:none;stroke:#f78166;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}"
        ".u{fill:none;stroke:#0969da;stroke-width:2.2;stroke-dasharray:5 4;stroke-linejoin:round}"
        "@media(prefers-color-scheme:dark){"
        ".bg{fill:#0d1117}.grid{stroke:#21262d}.lbl{fill:#8b949e}"
        ".v{stroke:#ff7b72}.u{stroke:#58a6ff}}"
        "</style>",
        f'<rect class="bg" x="0" y="0" width="{W}" height="{H}" rx="8"/>',
    ]

    # 横向网格 + y 轴刻度
    for i in range(5):
        val = y_max * i / 4
        y = py(val)
        parts.append(f'<line class="grid" x1="{PAD_L}" y1="{y:.1f}" x2="{W - PAD_R}" y2="{y:.1f}"/>')
        parts.append(
            f'<text class="lbl" x="{PAD_L - 10}" y="{y + 4:.1f}" font-size="11" '
            f'font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif" text-anchor="end">'
            f'{int(round(val))}</text>'
        )

    # x 轴日期标签（每 5 天一个，避免拥挤）
    for i in range(0, n, 5):
        parts.append(
            f'<text class="lbl" x="{px(i):.1f}" y="{H - 14}" font-size="10" '
            f'font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif" text-anchor="middle">'
            f'{days[i][5:]}</text>'
        )

    # 两条折线：views 实线，uniques 虚线
    v_pts = " ".join(f"{px(i):.1f},{py(v):.1f}" for i, v in enumerate(views))
    u_pts = " ".join(f"{px(i):.1f},{py(v):.1f}" for i, v in enumerate(uniques))
    parts.append(f'<polyline class="v" points="{v_pts}"/>')
    parts.append(f'<polyline class="u" points="{u_pts}"/>')

    # 图例
    ly = 20
    parts.append(f'<line class="v" x1="{PAD_L}" y1="{ly}" x2="{PAD_L + 24}" y2="{ly}"/>')
    parts.append(
        f'<text class="lbl" x="{PAD_L + 30}" y="{ly + 4}" font-size="11" '
        f'font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif">Views</text>'
    )
    parts.append(f'<line class="u" x1="{PAD_L + 84}" y1="{ly}" x2="{PAD_L + 108}" y2="{ly}"/>')
    parts.append(
        f'<text class="lbl" x="{PAD_L + 114}" y="{ly + 4}" font-size="11" '
        f'font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif">Unique visitors</text>'
    )
    parts.append("</svg>")
    return "\n".join(parts)


def write_badge(total_views, total_uniques):
    """输出 shields.io endpoint 兼容的 JSON，供 README 用动态徽章展示累计访问量。"""
    payload = {
        "schemaVersion": 1,
        "label": "views",
        "message": f"{total_views:,}",
        "color": "orange",
        "cacheSeconds": 3600,
    }
    with open(BADGE_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)


def main():
    repo = os.environ.get("REPOSITORY")
    token = os.environ.get("GITHUB_TOKEN")
    if not repo or not token:
        fail("缺少环境变量 REPOSITORY 或 GITHUB_TOKEN")

    today = datetime.now(timezone.utc).date()
    api_data = fetch_traffic(repo, token)
    history = merge_history(load_history(), api_data, today)
    days, views, uniques = build_series(history, today)

    os.makedirs("traffic", exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2, sort_keys=True)
    with open(SVG_FILE, "w", encoding="utf-8") as f:
        f.write(render_svg(days, views, uniques))
    write_badge(sum(views), sum(uniques))

    print(f"[traffic] 已更新 {len(history)} 天历史；近 {WINDOW_DAYS} 天 views={sum(views)} uniques={sum(uniques)}")


if __name__ == "__main__":
    main()
