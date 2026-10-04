// ===== 월드 3 "달" 공용 약속 (설계서 docs/design/world3-moon.md 9-3) =====
// 월드 3 파일들(moon.js · moon_env.js · mobs_w3.js · bosses_w3a~d.js · moontower.js)이 같이 쓰는 함수만 여기에.
// 실제 동작(먼지 느려짐·점프대 날기·크레이터 끌림·탑 빛)은 moon_env.js 가 world.w3 를 보고 해요.
// 보스 아레나 build(w) 에서 w3Add* 로 놓기만 하면 보스방·탑에서도 환경이 돌아요 (월드 2 w2AddVent 와 같은 원리).

const W3 = { stagK: () => ({ easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[(game.profile && game.profile.difficulty) || "normal"] || 1) };
const W3_ENV_KEYS = ["lowgrav", "dust", "craters", "pads", "lights", "towers", "meteors"];

function inWorld3() { return game.scene === "dungeon" && !!game.mapDef && typeof mapWorld === "function" && mapWorld(game.mapDef) === 3; }
function w3EnsureEnv(w = world) {
  if (!w.w3) w.w3 = { eclipse: null };
  for (const k of W3_ENV_KEYS) if (!w.w3[k]) w.w3[k] = [];
  return w.w3;
}
// 지금 싸우는 달 보스 (보스방 또는 탑의 보스 층)
function w3BossNow() { return typeof w2BossNow === "function" ? w2BossNow() : null; }
// 사각형({x0,y0,x1,y1}) 또는 원({x,y,r}) 목록에서 (x, y) 가 들어간 첫 항목
function w3InZone(list, x, y) {
  if (!list) return null;
  for (const z of list) {
    if (z.x0 !== undefined) { if (x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) return z; }
    else if (Math.hypot(x - z.x, y - z.y) < (z.r || 0)) return z;
  }
  return null;
}
function w3OnDust(p) { const E = world.w3; return !!(E && p && w3InZone(E.dust, p.x, p.y)); }
function w3InLowGrav(p) { const E = world.w3; return !!(E && p && w3InZone(E.lowgrav, p.x, p.y)); }
function w3Air(p) { return !!p && (p.w3Air || 0) > 0; } // 점프대로 나는 중 (땅 공격 "ground" 를 안 맞아요)
function w3AddTower(x, y, w = world) { const t = { x, y, r: 3.2, on: true }; w3EnsureEnv(w).towers.push(t); return t; }
function w3InTowerLight(x, y) { const E = world.w3; return !!(E && E.towers.some((t) => t.on && Math.hypot(x - t.x, y - t.y) < t.r)); }
// 점프대 하나: (dx, dy) 쪽으로 dist 칸 (보통 4.5)
function w3AddPad(x, y, dx, dy, w = world, dist = 4.5) { const d = Math.hypot(dx, dy) || 1; const p = { x, y, dx: dx / d, dy: dy / d, dist }; w3EnsureEnv(w).pads.push(p); return p; }
function w3AddCrater(x, y, r = 2.4, w = world) { const c = { x, y, r }; w3EnsureEnv(w).craters.push(c); return c; }
function w3AddDust(x, y, r = 2, w = world) { const d = { x, y, r }; w3EnsureEnv(w).dust.push(d); return d; }
function w3AddLowGrav(x0, y0, x1, y1, w = world) { const z = { x0, y0, x1, y1 }; w3EnsureEnv(w).lowgrav.push(z); return z; }
function w3AddLight(x, y, w = world) { const l = { x, y, c: "#9fe8ff" }; w3EnsureEnv(w).lights.push(l); return l; }
function w3AddMeteor(x, y, period = 6.5, offset = 0, w = world) { const m = { x, y, period, offset, t: offset }; w3EnsureEnv(w).meteors.push(m); return m; }
hookOn("reset", () => { if (typeof world !== "undefined" && world) world.w3 = null; }, 50);

// 별똥별: 맵·보스·탑·열쇠가 같이 써요 (그림자가 먼저, 1-3)
ABILITIES.w3_meteor = { name: "별똥별", desc: "하늘에서 별똥별이 떨어져요. 바닥 그림자가 진해지면 쿵!",
  counter: "그림자 밖으로 걸어가요", tags: ["area", "trap", "sky"],
  telegraph: { shape: "circle", radius: 1.4, at: "self", time: 1.6 }, cooldown: 99, range: [0, 99], damageMul: 1.1,
  anim: "raise", effect: { type: "knockback", force: 1.0 } };
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, { w3_meteor: { text: "별똥별 그림자! 그림자 밖으로" } });
