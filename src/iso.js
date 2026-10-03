// ===== 비스듬한 시점(아이소메트릭)으로 그리는 도구 =====
// 게임 세상은 바둑판(x, y)이고, z는 높이예요.
// 그걸 화면에 비스듬히 내려다보는 것처럼 바꿔서 그려요.

let ZOOM = 1.6;       // 화면 크기에 맞춰 자동으로 바뀌어요
let TILE_W = 64 * ZOOM;   // 바닥 한 칸의 화면 가로 크기
let TILE_H = 32 * ZOOM;   // 바닥 한 칸의 화면 세로 크기
let BLOCK_H = 36 * ZOOM;  // 높이 1의 화면 크기

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const camera = { x: 0, y: 0 };
const view = { w: 0, h: 0 }; // 화면 크기

// 화면 크기가 바뀌면 다시 맞추기 (태블릿 돌릴 때도)
function resizeCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  canvas.width = Math.round(view.w * dpr);
  canvas.height = Math.round(view.h * dpr);
  canvas.style.width = view.w + "px";
  canvas.style.height = view.h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 작은 화면은 조금 작게, 큰 화면은 크게
  ZOOM = Math.max(1.0, Math.min(1.8, Math.min(view.w / 1100, view.h / 700) * 1.6));
  TILE_W = 64 * ZOOM;
  TILE_H = 32 * ZOOM;
  BLOCK_H = 36 * ZOOM;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 200));
resizeCanvas();

// 세상 좌표(x, y, z) -> 화면 좌표
function toScreen(x, y, z = 0) {
  const dx = x - camera.x;
  const dy = y - camera.y;
  return {
    x: (dx - dy) * TILE_W / 2 + view.w / 2,
    y: (dx + dy) * TILE_H / 2 - z * BLOCK_H + view.h / 2 + 40,
  };
}

// 화면 안에 보이는지 (안 보이는 건 안 그려서 빠르게)
function onScreen(x, y, margin = 2) {
  const s = toScreen(x, y);
  return s.x > -TILE_W * margin && s.x < view.w + TILE_W * margin && s.y > -TILE_H * margin * 2 && s.y < view.h + TILE_H * margin * 2;
}

// 색을 어둡게/밝게 (f < 1 이면 어둡게)
const shadeCache = {};
function shade(hex, f) {
  const key = hex + f;
  if (shadeCache[key]) return shadeCache[key];
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return (shadeCache[key] = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""));
}

// 두 색을 섞기 (t = 0 이면 a, 1 이면 b)
function mixHex(a, b, t) {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16);
  const ch = (n, sh) => (n >> sh) & 255;
  const m = (sh) => Math.round(ch(na, sh) * (1 - t) + ch(nb, sh) * t).toString(16).padStart(2, "0");
  return "#" + m(16) + m(8) + m(0);
}

function fillPoly(points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// 상자(블록) 하나 그리기. (x, y, z)는 상자의 구석, w/d/h는 크기
function drawBox(x, y, z, w, d, h, color) {
  const P = toScreen;
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)];
  const right = [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)];
  fillPoly(left, shade(color, 0.78));
  fillPoly(right, shade(color, 0.6));
  fillPoly(top, color);

  // 테두리 (블록 느낌 나게)
  const o = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z), P(x, y + d, z + h)];
  ctx.beginPath();
  ctx.moveTo(o[0].x, o[0].y);
  for (let i = 1; i < o.length; i++) ctx.lineTo(o[i].x, o[i].y);
  ctx.closePath();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// 상자의 앞면에 작은 네모 그리기 (눈 같은 것)
// side: "x" 면 오른쪽 앞면, "y" 면 왼쪽 앞면. u는 면의 가로 위치(0~1), v는 높이
function drawOnFace(side, bx, by, bz, w, d, u1, u2, v1, v2, color) {
  let pts;
  if (side === "x") {
    const X = bx + w;
    pts = [[X, by + d * u1, bz + v2], [X, by + d * u2, bz + v2], [X, by + d * u2, bz + v1], [X, by + d * u1, bz + v1]];
  } else {
    const Y = by + d;
    pts = [[bx + w * u1, Y, bz + v2], [bx + w * u2, Y, bz + v2], [bx + w * u2, Y, bz + v1], [bx + w * u1, Y, bz + v1]];
  }
  fillPoly(pts.map((p) => toScreen(p[0], p[1], p[2])), color);
}

// 보고 있는 방향에 따라 눈을 그릴 면 고르기
function faceSide(fx, fy) {
  if (fx >= fy && fx > 0.2) return "x";
  if (fy > 0.2) return "y";
  return null;
}

// 바닥 그림자
function drawShadow(x, y, r) {
  const p = toScreen(x, y, 0);
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, r * TILE_W * 0.75, r * TILE_H * 0.75, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();
}

// 사람 모양 캐릭터 그리기 (주인공, 좀비, 해골, 골렘, 상인)
// look: 색깔들 { skin, hair, shirt, pants, eyes, helmet }
// opts: { arms: "side" | "forward", squash: 높이 비율, shimmer: 시간(반짝이는 갑옷), scale: 크기 }
function drawCharacter(e, look, opts = {}) {
  const fx = e.faceX, fy = e.faceY;
  const px = -fy, py = fx; // 옆 방향
  const s = opts.scale || 1;
  const squash = (opts.squash || 1) * s;
  const walk = e.moving ? Math.sin(e.walkTime * 11) : 0;
  const bob = e.moving ? Math.abs(walk) * 0.04 : 0;
  const white = e.flash > 0;

  // 반짝이는 갑옷: 빛의 띠가 몸을 타고 지나가요
  const shine = (color, cx, cy, z) => {
    if (opts.shimmer === undefined) return color;
    const wave = Math.sin(opts.shimmer * 4 - (cx + cy) * 5 - z * 7);
    const band = Math.round(Math.pow(Math.max(0, wave), 6) * 12) / 12;
    return mixHex(color, "#ffffff", band * 0.85);
  };

  const parts = [];
  // ox, oy: 몸 가운데에서 얼마나 떨어졌나 (크기에 맞춰 늘어나요)
  const add = (ox, oy, z, w, d, h, color, isArmor) => {
    const cx = e.x + ox * s, cy = e.y + oy * s;
    parts.push({
      cx, cy, z: z * squash, w: w * s, d: d * s, h: h * squash,
      color: white ? "#ffffff" : isArmor ? shine(color, cx, cy, z) : color,
    });
  };

  // 다리 두 개 (걸을 때 앞뒤로 움직여요)
  const legSwing = walk * 0.12;
  add(px * 0.09 + fx * legSwing, py * 0.09 + fy * legSwing, 0, 0.15, 0.15, 0.36, look.pants, true);
  add(-px * 0.09 - fx * legSwing, -py * 0.09 - fy * legSwing, 0, 0.15, 0.15, 0.36, look.pants, true);
  // 몸통
  add(0, 0, 0.36 + bob, 0.38, 0.38, 0.38, look.shirt, true);
  // 팔 두 개
  if (opts.arms === "forward") {
    add(px * 0.25 + fx * 0.22, py * 0.25 + fy * 0.22, 0.6 + bob, 0.13, 0.13, 0.13, look.skin);
    add(-px * 0.25 + fx * 0.22, -py * 0.25 + fy * 0.22, 0.6 + bob, 0.13, 0.13, 0.13, look.skin);
  } else {
    add(px * 0.26 - fx * walk * 0.08, py * 0.26 - fy * walk * 0.08, 0.4 + bob, 0.13, 0.13, 0.34, look.shirt, true);
    add(-px * 0.26 + fx * walk * 0.08, -py * 0.26 + fy * walk * 0.08, 0.4 + bob, 0.13, 0.13, 0.34, look.shirt, true);
  }
  // 머리
  add(0, 0, 0.74 + bob, 0.36, 0.36, 0.36, look.skin);
  const head = parts[parts.length - 1];
  head.isHead = true;
  if (!white) head.color = look.skin;

  // 뒤에 있는 것부터 그리기
  parts.sort((a, b) => (a.cx + a.cy) - (b.cx + b.cy) || a.z - b.z);
  for (const p of parts) {
    const bx = p.cx - p.w / 2, by = p.cy - p.d / 2;
    drawBox(bx, by, p.z, p.w, p.d, p.h, white ? "#ffffff" : p.color);
    if (!p.isHead || white) continue;

    if (look.helmet) {
      const hz = p.z + p.h * 0.62;
      drawBox(bx - 0.03 * s, by - 0.03 * s, hz, p.w + 0.06 * s, p.d + 0.06 * s, p.h * 0.45, shine(look.helmet, p.cx, p.cy, 1.1));
    } else {
      drawBox(bx - 0.01 * s, by - 0.01 * s, p.z + p.h - 0.06 * squash, p.w + 0.02 * s, p.d + 0.02 * s, 0.08 * squash, look.hair);
    }
    const side = faceSide(fx, fy);
    if (side) {
      const v1 = 0.13 * squash, v2 = 0.2 * squash;
      drawOnFace(side, bx, by, p.z, p.w, p.d, 0.15, 0.35, v1, v2, look.eyes);
      drawOnFace(side, bx, by, p.z, p.w, p.d, 0.65, 0.85, v1, v2, look.eyes);
    }
  }
}

// 4개 꼭짓점 반짝이 별 (화면 좌표)
function drawStar(x, y, size, color) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.25;
    ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// 세상 위의 동그라미가 비스듬히 보이는 타원 크기
function floorEllipse(r) {
  return { rx: r * TILE_W / 2 * Math.SQRT2, ry: r * TILE_H / 2 * Math.SQRT2 };
}
