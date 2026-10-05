// ===== 월드 5 "공허" 공용 약속 (설계서 docs/design/world5-void.md 2장) =====
// 월드 5 파일들(void.js · void_env.js · mobs_w5.js · bosses_w5*.js · voidtower.js)이 같이 쓰는 함수만 여기에.
// world.w5 의 목록이 "진짜 상태"예요. 실제 동작(수정 빛·구멍 빠짐·다리 깜빡·종·분신)은 void_env.js 가 이 목록을 보고 해요.
// 같이 하기: 바뀌는 상태(수정 남은 초·종 남은 초·다리 시계)는 void_env.js 가 숨은 소품 몬스터 "w5_env" 칸으로 보내고,
//   친구 기기는 받은 값을 이 목록에 다시 적어요. 그래서 아래 질문 함수(w5Lit·w5Rung·w5OnHole)는 두 기기에서 같은 답을 줘요.

const W5 = {
  litR: 3.2, bellR: 7, litSec: 9, bellSec: 8,
  // 깜빡 다리: 켜짐 → 깜빡(예고) → 꺼짐 (초)
  blink: { easy: [4.5, 1.4, 2.0], normal: [3.5, 1.0, 2.0], hard: [3.2, 1.0, 2.2], nightmare: [3.0, 0.9, 2.4] },
  fallHurt: { easy: 0.5, normal: 1, hard: 1, nightmare: 1 },
  floorHp: 0.5, // 환경은 하트 0.5 밑으로 안 내려요 (절대 쓰러뜨리지 않아요)
};
const W5_ENV_KEYS = ["crystals", "holes", "bells", "puddles"];

function w5Diff() { return (game.profile && game.profile.difficulty) || "normal"; }
function inWorld5() { return game.scene === "dungeon" && !!game.mapDef && typeof mapWorld === "function" && mapWorld(game.mapDef) === 5; }
function w5Env(w = world) {
  if (!w.w5) w.w5 = { clock: 0 };
  for (const k of W5_ENV_KEYS) if (!w.w5[k]) w.w5[k] = [];
  return w.w5;
}
// 색 수정 { x, y, litT, ever }: litT > 0 이면 둘레 W5.litR 칸이 밝아요 (색이 돌아오고 그림자 몬스터가 들켜요)
function w5AddCrystal(w, x, y) { const c = { x, y, litT: 0, ever: false }; w5Env(w).crystals.push(c); return c; }
function w5Lit(x, y) { const E = world.w5; return !!(E && E.crystals.some((c) => c.litT > 0 && Math.hypot(c.x - x, c.y - y) < W5.litR)); }
// 메아리 종 { x, y, ringT }: 울리는 동안 W5.bellR 칸 안 그림자가 들켜요
function w5AddBell(w, x, y) { const b = { x, y, ringT: 0 }; w5Env(w).bells.push(b); return b; }
function w5Rung(x, y) { const E = world.w5; return !!(E && E.bells.some((b) => b.ringT > 0 && Math.hypot(b.x - x, b.y - y) < W5.bellR)); }
// 그림자가 들켰나 (색 수정 빛 또는 종소리. 보스 소품 수정·종도 같이: w5BossReveal 은 bosses_w5echo.js)
function w5Revealed(x, y) { return w5Lit(x, y) || w5Rung(x, y) || (typeof w5BossReveal === "function" && w5BossReveal(x, y)); }
// 그림자 웅덩이 { x, y, cd }: 가까이 오면 분신이 솟아요
function w5AddPuddle(w, x, y) { const p = { x, y, cd: 0 }; w5Env(w).puddles.push(p); return p; }
// 공허 구멍 rect { x0, y0, x1, y1 } + 다리 [{ x0, y0, x1, y1, kind: "stone" | "blink" | "color", ph }]
function w5AddHole(w, rect, bridges = []) { const h = { ...rect, bridges: bridges.map((b) => ({ kind: "stone", ph: 0, ...b })) }; w5Env(w).holes.push(h); return h; }
// 깜빡 다리 상태: 0 꺼짐, 1 깜빡(곧 꺼져요), 2 켜짐
function w5BlinkState(b, clock) {
  const [on, warn, off] = W5.blink[w5Diff()] || W5.blink.normal, T = on + warn + off;
  const t = (((clock + (b.ph || 0)) % T) + T) % T;
  return t < on ? 2 : t < on + warn ? 1 : 0;
}
// 색 다리: 가장 가까운 색 수정이 켜져 있어야 있어요
function w5ColorBridgeOn(b) {
  const E = world.w5; if (!E || !E.crystals.length) return false;
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  let best = null, bd = 1e9;
  for (const c of E.crystals) { const d = Math.hypot(c.x - cx, c.y - cy); if (d < bd) { bd = d; best = c; } }
  return !!(best && best.litT > 0);
}
function w5BridgeOn(b) {
  if (b.kind === "blink") return w5BlinkState(b, (world.w5 && world.w5.clock) || 0) > 0;
  if (b.kind === "color") return w5ColorBridgeOn(b);
  return true;
}
// 구멍 위인가 (켜진 다리 위는 아니에요)
function w5OnHole(x, y) {
  const E = world.w5; if (!E) return false;
  for (const h of E.holes) {
    if (x < h.x0 || x > h.x1 || y < h.y0 || y > h.y1) continue;
    if (h.bridges.some((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && w5BridgeOn(b))) continue;
    return true;
  }
  return false;
}
// 서 있어도 되는 자리 (벽·구멍이 아니에요)
function w5SafeLand(x, y, r = 0.35) { return !hitsWall(x, y, r) && ![[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => w5OnHole(x + dx, y + dy)); }

// ----- 회색 칠하기 (메아리 보스·캠프 꽃): 색을 회색(살짝 보라)과 섞어요. k = 0 원래 색, 1 다 회색 -----
const W5_GRAY_CACHE = {};
function w5Gray(hex, k) {
  if (typeof hex !== "string" || hex[0] !== "#" || hex.length !== 7) return hex;
  const kk = Math.round(Math.max(0, Math.min(1, k)) * 20) / 20, key = hex + kk;
  const hit = W5_GRAY_CACHE[key]; if (hit) return hit;
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const l = 0.3 * r + 0.59 * g + 0.11 * b, gr = l * 0.92 + 10, gg = l * 0.92 + 8, gb = l * 0.92 + 22; // 회색에 보라 한 방울
  const mix = (a, c) => Math.max(0, Math.min(255, Math.round(a + (c - a) * kk)));
  const out = "#" + [mix(r, gr), mix(g, gg), mix(b, gb)].map((v) => v.toString(16).padStart(2, "0")).join("");
  W5_GRAY_CACHE[key] = out;
  return out;
}
// 회색으로 그리기: fn 안에서 칠하는 모든 상자를 회색과 섞어요 (iso.js boxTint)
function w5DrawGray(k, fn) {
  if (typeof boxTint === "undefined" || k <= 0.01) return fn();
  const prev = boxTint;
  boxTint = (c) => w5Gray(prev ? prev(c) : c, k);
  try { return fn(); } finally { boxTint = prev; }
}
// 장면이 바뀌면 지난 맵의 공허 환경을 지워요 (보스방·다시 도전은 새로 만들어요)
hookOn("reset", () => { if (typeof world !== "undefined" && world) world.w5 = null; }, 50);
