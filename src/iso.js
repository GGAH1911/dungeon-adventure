// ===== 비스듬한 시점(아이소메트릭)으로 그리는 도구 =====
// 게임 세상은 바둑판(x, y)이고, z는 높이예요.
// 그걸 화면에 비스듬히 내려다보는 것처럼 바꿔서 그려요.

let zoomMul = 1;     // 보스방에서는 0.78
let ZOOM = 1.6;       // 화면 크기에 맞춰 자동으로 바뀌어요
let TILE_W = 64 * ZOOM;   // 바닥 한 칸의 화면 가로 크기
let TILE_H = 32 * ZOOM;   // 바닥 한 칸의 화면 세로 크기
let BLOCK_H = 36 * ZOOM;  // 높이 1의 화면 크기

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const camera = { x: 0, y: 0 };
const view = { w: 0, h: 0 }; // 화면 크기

// 그리는 해상도 (화면이 버벅이면 자동으로 낮춰요: 2 -> 1.5 -> 1.25 -> 1)
const QUALITY_STEPS = [2, 1.5, 1.25, 1];
let qualityStep = 0;
function renderScale() {
  return Math.min(QUALITY_STEPS[qualityStep], window.devicePixelRatio || 1);
}
function lowerQuality() {
  if (qualityStep >= QUALITY_STEPS.length - 1 || renderScale() <= 1) return false;
  qualityStep++;
  resizeCanvas();
  return true;
}

// 화면 크기가 바뀌면 다시 맞추기 (태블릿 돌릴 때도)
function resizeCanvas() {
  const dpr = renderScale();
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  canvas.width = Math.round(view.w * dpr);
  canvas.height = Math.round(view.h * dpr);
  canvas.style.width = view.w + "px";
  canvas.style.height = view.h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 작은 화면은 조금 작게, 큰 화면은 크게
  // zoomMul: 보스방처럼 넓게 봐야 할 때 조금 멀리서 봐요 (bossroom.js)
  const zm = (typeof zoomMul === "number" ? zoomMul : 1) * (typeof coopZoomMul === "number" ? coopZoomMul : 1); // coopZoomMul: 둘이 멀어지면 (coop.js)
  ZOOM = Math.max(1.0 * Math.min(1, zm), Math.min(1.8, Math.min(view.w / 1100, view.h / 700) * 1.6 * zm));
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

// 사람 모양 캐릭터 그리기 (주인공, 몬스터, 상인 모두)
// 실제 그리기는 rig.js(뼈대)가 해요. 여기선 간단한 자세만 만들어 넘겨요.
// opts: arms "forward"(좀비처럼), scale 크기, squash, shimmer, pose(자세 직접 주기), roll/curl/hop
function drawCharacter(e, look, opts = {}) {
  const pose = { ...(opts.pose || {}) };
  if (opts.arms === "forward" && !pose.rh) { pose.rh = V(0.4, -0.13, 0.63); pose.lh = V(0.4, 0.13, 0.63); }
  if (!pose.walk) pose.walk = { phase: e.walkTime * 11, amp: e.moving ? 1 : 0 };
  if (pose.bob === undefined) pose.bob = e.moving ? Math.abs(Math.sin(e.walkTime * 11)) * 0.045 : Math.sin(((typeof game !== "undefined" && game.time) || 0) * 2.6 + e.x * 3) * 0.012;
  return drawRig(e, look, pose, opts);
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
