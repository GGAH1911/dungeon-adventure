// ===== 아이콘 (블록풍 픽셀 그림) =====
// 글자 대신 쓰는 작은 그림이에요. 20x20 칸에 선·원·네모로 그리고, 둘레에 진한 테두리를 자동으로 둘러요.
//   drawIcon(id, cx, cy, size, { alpha, gray })   가운데 (cx, cy) 에 size 픽셀 크기로
//   hasIcon(id)
// 새 아이콘: ICON_DEFS 에 (g) => { ... } 를 더해요. g 의 도구: px, line, disc, rect, arc, tri

const ICON_N = 20;
const ICON_PAL = {
  w: "#f4f7fb", g: "#c3ccd6", s: "#8d99a6", d: "#5a6470",
  y: "#e8b84a", Y: "#ffe066", b: "#9a6234", B: "#5e3b1c",
  r: "#e8483a", o: "#ff9a2e", c: "#8fe6ff", C: "#3a8ee0",
  p: "#c08aff", P: "#7a3fd0", G: "#6ad35f", D: "#2f8f3a",
  m: "#ff6fc8", n: "#c88a5a", N: "#7a4f30", k: "#1b2230",
};
const ICON_OUTLINE = "#1b2230";

function iconPainter() {
  const grid = Array.from({ length: ICON_N }, () => Array(ICON_N).fill(null));
  const px = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < ICON_N && y < ICON_N) grid[y][x] = c; };
  const disc = (cx, cy, r, c) => { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.3) px(x, y, c); };
  const line = (x0, y0, x1, y1, c, w = 1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if (w <= 1) px(x, y, c); else disc(x, y, (w - 1) / 2, c); }
  };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(x, y, c); };
  // 각도는 도(°), 0 = 오른쪽, 90 = 아래
  const arc = (cx, cy, r, a0, a1, c, w = 1) => {
    const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 4));
    for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (w <= 1) px(x, y, c); else disc(x, y, (w - 1) / 2, c); }
  };
  const tri = (ax, ay, bx, by, cx, cy, c) => {
    const minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx));
    const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
    const s = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const d1 = s(x, y, ax, ay, bx, by), d2 = s(x, y, bx, by, cx, cy), d3 = s(x, y, cx, cy, ax, ay);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) px(x, y, c);
    }
  };
  return { grid, px, disc, line, rect, arc, tri };
}

// 화살 하나 (머리 색 바꿔 쓰기)
function iconArrow(g, x0, y0, x1, y1, head = "g", shaft = "b", fletch = "w") {
  g.line(x0, y0, x1, y1, shaft, 1.6);
  const a = Math.atan2(y1 - y0, x1 - x0), L = 3.2;
  const hx = x1 + Math.cos(a) * 1.5, hy = y1 + Math.sin(a) * 1.5;
  g.tri(hx, hy, x1 - Math.cos(a - 0.6) * L, y1 - Math.sin(a - 0.6) * L, x1 - Math.cos(a + 0.6) * L, y1 - Math.sin(a + 0.6) * L, head);
  g.line(x0, y0, x0 - Math.cos(a - 0.7) * 2.5, y0 - Math.sin(a - 0.7) * 2.5, fletch);
  g.line(x0, y0, x0 - Math.cos(a + 0.7) * 2.5, y0 - Math.sin(a + 0.7) * 2.5, fletch);
}
function iconFlame(g, cx, cy, s = 1) {
  g.tri(cx - 3.5 * s, cy + 2 * s, cx + 3.5 * s, cy + 2 * s, cx + 0.5 * s, cy - 6 * s, "o");
  g.disc(cx, cy + 1.5 * s, 3.5 * s, "o");
  g.tri(cx - 1.8 * s, cy + 2 * s, cx + 1.8 * s, cy + 2 * s, cx + 0.3 * s, cy - 2.5 * s, "Y");
  g.disc(cx, cy + 2 * s, 1.8 * s, "Y");
}

const ICON_DEFS = {
  // ----- 공격 -----
  sword: (g) => {
    g.line(8, 12, 16.5, 3.5, "w", 2.2);
    g.line(15, 5, 16.5, 3.5, "g");
    g.line(4.5, 10.5, 9.5, 15.5, "y", 2);
    g.line(3, 17, 7, 13, "b", 2);
    g.disc(2.6, 17.4, 1.2, "y");
  },
  bow: (g) => {
    g.arc(13, 10, 8.5, 112, 248, "b", 2.2);
    g.line(9.8, 2.3, 9.8, 17.7, "g");
    iconArrow(g, 4.5, 10, 16, 10, "g", "w", "r");
  },
  orb: (g) => {
    g.disc(10, 10.5, 6.5, "C");
    g.disc(9.2, 9.6, 4, "c");
    g.disc(8, 8, 1.6, "w");
    g.px(16, 3, "Y"); g.px(17, 4, "Y"); g.px(15, 4, "Y"); g.px(16, 5, "Y"); g.px(16, 4, "w");
  },
  staff: (g) => {
    g.line(4, 18, 13, 5, "b", 2);
    g.disc(14, 4, 2.4, "G"); g.disc(16.5, 6.5, 1.8, "D"); g.disc(11.6, 2.8, 1.6, "G"); g.disc(15.5, 2, 1.3, "D");
  },
  // ----- 공통 버튼 -----
  roll: (g) => {
    g.arc(10, 10.5, 6.2, -40, 230, "w", 2.2);
    const a = -40 * Math.PI / 180, ex = 10 + Math.cos(a) * 6.2, ey = 10.5 + Math.sin(a) * 6.2;
    g.tri(ex + 3.5, ey + 0.5, ex - 2.5, ey - 1.5, ex + 0.5, ey + 4, "w");
    g.disc(10, 10.5, 1.6, "c");
  },
  potion: (g) => {
    g.rect(8, 2, 11, 3, "b");
    g.rect(8, 4, 11, 7, "g");
    g.disc(9.5, 12.5, 5.6, "m");
    g.rect(5, 12, 14, 13, "m");
    g.disc(7.6, 10.8, 1.3, "w"); g.px(7, 13, "w");
  },
  pot_speed: (g) => { // 신속 물약: 파란 물약 + 번개
    g.rect(8, 2, 11, 3, "b"); g.rect(8, 4, 11, 7, "g");
    g.disc(9.5, 12.5, 5.6, "C"); g.rect(5, 12, 14, 13, "C");
    g.line(11, 8.5, 8, 12.5, "Y", 1.6); g.line(8, 12.5, 11.5, 12.5, "Y", 1.6); g.line(11.5, 12.5, 8.5, 16.5, "Y", 1.6);
  },
  pot_atk: (g) => { // 공격력 물약: 빨간 물약 + 칼
    g.rect(8, 2, 11, 3, "b"); g.rect(8, 4, 11, 7, "g");
    g.disc(9.5, 12.5, 5.6, "r"); g.rect(5, 12, 14, 13, "r");
    g.line(12.5, 9, 7, 15.5, "w", 1.6); g.line(7.5, 12.5, 10, 15, "Y", 1.4);
  },
  use: (g) => { // 말 걸기·열기: 말풍선 + 느낌표
    g.disc(10, 9, 7, "w");
    g.rect(4, 7, 16, 11, "w");
    g.tri(6, 13, 10, 14, 5, 18.5, "w");
    g.rect(9, 4, 10, 10, "C"); g.rect(9, 12, 10, 13, "C");
  },
  arrow_normal: (g) => iconArrow(g, 4, 16, 15, 5, "g", "b", "w"),
  arrow_fire: (g) => { iconArrow(g, 4, 16, 13, 7, "o", "b", "w"); iconFlame(g, 15, 6, 0.55); },
  arrow_ice: (g) => { iconArrow(g, 4, 16, 15, 5, "c", "b", "w"); g.px(17, 2, "c"); g.px(18, 4, "c"); g.px(13, 2, "w"); },
  arrow_poison: (g) => { iconArrow(g, 4, 16, 14, 6, "G", "b", "w"); g.disc(15.5, 4.5, 1.6, "D"); g.disc(17.5, 7, 1.1, "G"); g.px(13, 2, "G"); },
  arrow_bomb: (g) => { iconArrow(g, 3, 17, 11, 9, "g", "b", "w"); g.disc(14, 6, 3.6, "d"); g.disc(13, 5, 1, "g"); g.line(16, 3, 18, 1, "y"); g.px(18, 1, "o"); },
  lock: (g) => { g.arc(10, 8, 4, 180, 360, "g", 2); g.rect(4, 8, 15, 17, "y"); g.rect(9, 11, 10, 14, "B"); },
  menu: (g) => { g.rect(3, 4, 16, 5, "w"); g.rect(3, 9, 16, 10, "w"); g.rect(3, 14, 16, 15, "w"); },
  joystick: (g) => { g.disc(10, 10, 7.5, "s"); g.disc(10, 10, 4, "w"); g.tri(10, 1, 8, 4, 12, 4, "w"); g.tri(10, 19, 8, 16, 12, 16, "w"); g.tri(1, 10, 4, 8, 4, 12, "w"); g.tri(19, 10, 16, 8, 16, 12, "w"); },
  // ----- 전사 -----
  whirl: (g) => {
    g.arc(10, 10, 7, -20, 120, "w", 2.2); g.arc(10, 10, 7, 160, 300, "w", 2.2);
    g.arc(10, 10, 3.6, 60, 200, "c"); g.arc(10, 10, 3.6, 240, 380, "c");
    g.disc(10, 10, 1.4, "s");
  },
  leap: (g) => {
    for (let i = 0; i <= 12; i++) { const t = i / 12, x = 3 + t * 11, y = 14 - Math.sin(t * Math.PI) * 10; g.disc(x, y, 0.7, "w"); }
    g.tri(14, 16, 11.5, 12, 16.5, 12, "w");
    g.rect(2, 18, 18, 18, "b");
    g.line(15, 17, 18, 14, "Y"); g.line(13, 17, 11, 14, "Y"); g.px(14, 13, "Y");
  },
  shout: (g) => {
    g.disc(6, 10, 4.5, "r"); g.rect(5, 9, 8, 12, "B"); g.disc(4.5, 7.5, 1, "w");
    g.arc(7, 10, 7, -45, 45, "Y", 1.6); g.arc(7, 10, 10.5, -40, 40, "Y", 1.6); g.arc(7, 10, 13.5, -32, 32, "Y");
  },
  // ----- 사냥꾼 -----
  multi: (g) => {
    iconArrow(g, 3, 17, 10, 3.5, "g", "b", "w");
    iconArrow(g, 3, 17, 16, 9, "g", "b", "w");
    iconArrow(g, 3, 17, 17, 16, "g", "b", "w");
  },
  vault: (g) => {
    g.arc(11, 9, 6, 200, 470, "w", 2);
    const a = 470 * Math.PI / 180, ex = 11 + Math.cos(a) * 6, ey = 9 + Math.sin(a) * 6;
    g.tri(ex - 3.5, ey - 0.5, ex + 1, ey - 3, ex + 0.5, ey + 2.5, "w");
    g.rect(3, 18, 17, 18, "d"); for (const x of [4, 8, 12, 16]) g.tri(x - 1.5, 18, x + 1.5, 18, x, 14.5, "g");
  },
  rain: (g) => {
    g.disc(6, 4, 3, "g"); g.disc(10, 3, 3.6, "w"); g.disc(14, 4.5, 3, "g"); g.rect(5, 4, 15, 6, "w");
    iconArrow(g, 5, 9, 5, 16, "g", "b", "w"); iconArrow(g, 10, 10, 10, 18, "g", "b", "w"); iconArrow(g, 15, 9, 15, 16, "g", "b", "w");
  },
  // ----- 마법사 -----
  fireball: (g) => {
    g.line(3, 17, 9, 11, "o", 2.5); g.line(5, 17, 9, 13, "Y", 1.2); g.line(3, 14, 8, 10, "o", 1.5);
    g.disc(12.5, 7.5, 5, "o"); g.disc(12, 8, 3.2, "Y"); g.disc(11, 7, 1.2, "w");
  },
  blink: (g) => {
    g.arc(10, 10, 7, 0, 300, "p", 2); g.arc(10, 10, 3.8, 90, 360, "P", 1.6); g.disc(10, 10, 1.2, "w");
    for (const [x, y] of [[17, 3], [3, 3], [16, 17]]) { g.px(x, y, "w"); g.px(x - 1, y, "c"); g.px(x + 1, y, "c"); g.px(x, y - 1, "c"); g.px(x, y + 1, "c"); }
  },
  meteor: (g) => {
    g.line(17, 2, 10, 9, "o", 3); g.line(18, 4, 12, 10, "Y", 1.2); g.line(15, 1, 9, 7, "Y", 1.2);
    g.disc(7.5, 12.5, 5, "d"); g.disc(6.5, 11.5, 2.5, "s"); g.px(9, 14, "B"); g.px(5, 14, "B");
  },
  // ----- 드루이드 -----
  wolf: (g) => {
    g.tri(3, 2, 8, 6, 3, 9, "s"); g.tri(17, 2, 12, 6, 17, 9, "s");
    g.disc(10, 10.5, 6.2, "g"); g.rect(7, 12, 13, 17, "w"); g.disc(10, 16, 2.5, "w");
    g.rect(6, 8, 7, 9, "k"); g.rect(13, 8, 14, 9, "k"); g.rect(9, 13, 11, 14, "k");
    g.px(4, 5, "m"); g.px(16, 5, "m");
  },
  tornado: (g) => {
    g.line(2, 3, 17, 3, "c", 2); g.line(4, 7, 16, 7, "w", 2); g.line(6, 11, 14, 11, "c", 2);
    g.line(8, 14.5, 12, 14.5, "w", 2); g.line(9, 17.5, 11, 17.5, "c", 1.6);
    g.px(18, 5, "G"); g.px(1, 9, "D");
  },
  bear: (g) => {
    g.disc(4.5, 5, 2.8, "N"); g.disc(15.5, 5, 2.8, "N"); g.disc(4.5, 5, 1.2, "n"); g.disc(15.5, 5, 1.2, "n");
    g.disc(10, 11, 7, "n"); g.disc(10, 14, 3.6, "y"); g.rect(9, 12, 11, 13, "k");
    g.rect(6, 8, 7, 9, "k"); g.rect(13, 8, 14, 9, "k"); g.px(10, 15, "B");
  },
};

const iconCache = {};
function iconCanvas(id) {
  if (iconCache[id] !== undefined) return iconCache[id];
  const def = ICON_DEFS[id];
  if (!def || typeof document === "undefined") return (iconCache[id] = null);
  const g = iconPainter();
  def(g);
  // 진한 테두리: 비어 있는 칸 중 옆(8방향)에 그림이 있으면 테두리
  const N = ICON_N, src = g.grid, out = src.map((r) => r.slice());
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (src[y][x]) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && xx >= 0 && yy < N && xx < N && src[yy][xx]) { near = true; break; } }
    if (near) out[y][x] = "__";
  }
  const cv = document.createElement("canvas");
  cv.width = N; cv.height = N;
  const c2 = cv.getContext("2d");
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = out[y][x]; if (!v) continue;
    c2.fillStyle = v === "__" ? ICON_OUTLINE : ICON_PAL[v] || v;
    c2.fillRect(x, y, 1, 1);
  }
  return (iconCache[id] = cv);
}

function hasIcon(id) { return !!ICON_DEFS[id]; }

function drawIcon(id, cx, cy, size, opts = {}) {
  const cv = iconCanvas(id);
  if (!cv) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  if (opts.gray) ctx.filter = "grayscale(1) brightness(0.8)";
  const s = Math.round(size);
  ctx.drawImage(cv, Math.round(cx - s / 2), Math.round(cy - s / 2), s, s);
  ctx.restore();
  return true;
}
