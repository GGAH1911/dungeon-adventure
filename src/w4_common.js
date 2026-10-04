// ===== 월드 4 "지하세계" 공용 약속 (설계서 docs/design/world4-underworld.md 10-6) =====
// 월드 4 파일들(under.js · under_env.js · mobs_w4.js · bosses_w4*.js · undertower.js)이 같이 쓰는 함수만 여기에.
// world.w4 의 목록이 "진짜 상태"예요. 실제 동작(수정 빛·버섯 날기·광차·종유석·용암 밀기·바닥 무너짐)은 under_env.js 가
// 이 목록을 보고 해요. 보스 아레나 build(w) 에서 w4Add* 로 놓기만 하면 보스방·탑에서도 환경이 돌아요.
// 같이 하기: 바뀌는 상태(수정 켜짐·바닥 무너짐·광차 자리)는 under_env.js 가 소품 몬스터(prop)로 보내고, 받은 값을 이 목록에 다시 적어요.
//   그래서 아래 질문 함수(w4Lit·w4OnLava·w4CrackAt·w4SafeLand)는 두 기기에서 같은 답을 줘요. (이 함수들은 다른 파일에서 다시 만들지 마세요: check.mjs 가 같은 이름을 막아요)

const W4 = { stagK: () => ({ easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[(game.profile && game.profile.difficulty) || "normal"] || 1), litR: 3.2 };
const W4_ENV_KEYS = ["crystals", "shrooms", "rails", "drips", "lava", "cracks"];

function inWorld4() { return game.scene === "dungeon" && !!game.mapDef && typeof mapWorld === "function" && mapWorld(game.mapDef) === 4; }
function w4Env(w = world) {
  if (!w.w4) w.w4 = {};
  for (const k of W4_ENV_KEYS) if (!w.w4[k]) w.w4[k] = [];
  return w.w4;
}
// 지금 싸우는 지하 보스 (보스방 또는 탑의 보스 층)
function w4BossNow() { return typeof w2BossNow === "function" ? w2BossNow() : null; }
// 빛 수정 { x, y, on }: on 이면 둘레 W4.litR 칸이 밝아요 (두더지가 못 숨고 그림자 몬스터가 보여요)
function w4AddCrystal(w, x, y, on = false) { const c = { x, y, on: !!on }; w4Env(w).crystals.push(c); return c; }
function w4Lit(x, y) { const E = world.w4; return !!(E && E.crystals.some((c) => c.on && Math.hypot(c.x - x, c.y - y) < W4.litR)); }
// 용암 띠 rect { x0, y0, x1, y1 } + 다리 [{ x0, y0, x1, y1 }] (다리 위는 안전)
function w4AddLava(w, rect, bridges = []) { const l = { ...rect, bridges: bridges.map((b) => ({ ...b })) }; w4Env(w).lava.push(l); return l; }
function w4OnLava(x, y) {
  const E = world.w4; if (!E) return false;
  for (const l of E.lava) {
    if (x < l.x0 || x > l.x1 || y < l.y0 || y > l.y1) continue;
    if (l.bridges.some((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1)) continue;
    return true;
  }
  return false;
}
// 레일 + 광차: pts [{x,y}...] 꺾은선, opts { carts: 1, stops: [], speed: 3.2, loop: false }
function w4AddRail(w, pts, opts = {}) { const r = { pts: pts.map((p) => ({ x: p.x, y: p.y })), carts: opts.carts ?? 1, stops: opts.stops || [], speed: opts.speed ?? 3.2, loop: !!opts.loop }; w4Env(w).rails.push(r); return r; }
// 무너지는 바닥 한 칸 { x, y, state: 0 멀쩡 / 1 흔들 / 2 구멍, t }
function w4AddCrack(w, x, y) { const c = { x: Math.floor(x) + 0.5, y: Math.floor(y) + 0.5, state: 0, t: 0 }; w4Env(w).cracks.push(c); return c; }
function w4CrackAt(x, y) { const E = world.w4; if (!E) return null; const fx = Math.floor(x) + 0.5, fy = Math.floor(y) + 0.5; return E.cracks.find((c) => c.x === fx && c.y === fy) || null; }
// 종유석 자리: period 초마다, offset 만큼 엇갈려 떨어져요 (방장이 예고 casts 를 만들어요)
function w4AddDrip(w, x, y, period = 7, offset = 0) { const d = { x, y, period, offset, t: offset }; w4Env(w).drips.push(d); return d; }
// 버섯 통통 패드: (dx, dy) 쪽으로 dist 칸 (월드 2 해면 규칙)
function w4AddShroom(w, x, y, dx, dy, dist = 3.5) { const n = Math.hypot(dx, dy) || 1; const s = { x, y, dx: dx / n, dy: dy / n, dist }; w4Env(w).shrooms.push(s); return s; }
// 착지 자리가 안전한가 (벽·용암·구멍 아님)
function w4SafeLand(x, y) {
  if (typeof hitsWall === "function" && hitsWall(x, y, 0.35)) return false;
  if (w4OnLava(x, y)) return false;
  const c = w4CrackAt(x, y); if (c && c.state === 2) return false;
  return true;
}
hookOn("reset", () => { if (typeof world !== "undefined" && world) world.w4 = null; }, 50);
