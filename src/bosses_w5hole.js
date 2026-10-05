// ===== 월드 5 보스 15: 블랙홀 꿀꺽이 (starmaw, 별을 삼키는 곳) (설계서 docs/design/world5-void.md 5-15) =====
// 틈새 너머에서 공허가 뭉쳐 생긴 블랙홀. 별과 색을 꿀꺽꿀꺽 삼켜요. 무섭지 않게: 까만 동그라미에 큰 눈, 둘레엔 빙글 도는 별빛 고리.
// 아레나 가운데에 가만히 떠 있어요 (움직이지 않아요). 곁에 가서 때려요.
//
// 빨아들이기 (이 보스의 핵심): 예고(화면 가장자리 소용돌이 + 큰 글자 + 소리, 보통 3초 · 쉬움 4.5초) 동안 "안전한 자리"가 초록으로 빛나요.
//   그 뒤 몇 초 동안 안전한 자리 밖의 주인공은 모두 블랙홀 쪽으로 세게 끌려가요. 가운데에 닿으면 "꿀꺽!" 하트를 잃고 퉤 뱉어져요.
//   안전한 자리 (단계마다 달라요):
//     1단계: 닻 돌(기둥) 6개. 블랙홀 반대쪽 "기둥 그림자"가 안전해요.
//     2단계: 빨아들일 때마다 기둥 몇 개에 금이 가요 (금 간 기둥 그림자는 안전하지 않아요). 남은 기둥 그림자로!
//     3단계: 기둥이 모두 부서져요. 켜진 색 수정 둘레 "빛 방울"(크고) + 작은 별 닻(사람마다 하나)이 안전해요.
//   공정성: 빨아들이기를 시작할 때 사람마다 예고 시간 안에 걸어서 닿는 안전한 자리가 꼭 하나는 있어요 (없으면 별 닻을 그 사람 곁에 놓아요: w5hEnsureSafe).
//   켜진 색 수정 빛 방울도 언제나 안전해요. 빨아들인 뒤 켜진 수정이 2개 넘으면 빛을 삼켜 배탈! 크게 비틀 + 5%.
// 다른 기술: 삼킨 별 뱉기(별비) · 중력 고리 · 회색 물결 · 공허 별비 · 그림자 꼬마 부르기
// 같이 하기: 계산은 방장만 (끌기는 방장 기기에서 친구 주인공을 움직이면 netplay.js 가 밀림(ext)으로 친구 기기에 보내요).
//   예고·빨아들이기 남은 초(bhWarn·bhSuck), 안전 자리(소품 w5_hSafe 의 on·sr), 기둥 금(crack)은 모두 몬스터 칸이라 친구 화면에도 가요.

const W5H = {
  warnTime: 3.0,                                                    // 예고 (ABILITY_TUNING 배수: 쉬움 ×1.5 · 어려움 ×0.88 · 악몽 ×0.8)
  pullT: { easy: 2.6, normal: 3.0, hard: 3.2, nightmare: 3.4 },      // 빨아들이는 시간
  pullV: { easy: 5.2, normal: 6.0, hard: 6.4, nightmare: 6.8 },      // 끌리는 빠르기 (걷기 4.2 보다 빨라요: 버티려면 안전한 자리로)
  swallow: { easy: 0.3, normal: 0.4, hard: 0.5, nightmare: 0.6 },    // 꿀꺽! 최대 하트의 몇만큼 (가득 찬 하트에서 한 번에 쓰러지지 않아요)
  coreR: 1.6,          // 가운데 이만큼 안에 닿으면 꿀꺽
  spitV: 11, spitT: 0.45, // 퉤! (뱉어지는 빠르기·시간 → 5칸쯤)
  pillarD: 5.5, pillarR: 0.6, shadowD: 1.35, shadowR: 0.95,         // 닻 돌 거리·크기, 그림자 자리 (기둥 뒤 1.35칸, 반지름 0.95)
  bubbleR: 1.9,        // 켜진 색 수정 빛 방울
  anchorR: { 0: 0.9, 1: 0.85, 2: 0.75 }, // 별 닻 크기 (3단계가 더 작아요)
  reachK: 0.6,         // 안전 자리 보장: 걷기 빠르기 × 예고 시간 × 이만큼 안에 (돌아가는 길·늦은 반응 여유)
  walk: 4.2,           // 걷기 빠르기 (레벨이 낮을 때 가장 느린 값)
  bellyStun: 4.0, bellyFrac: 0.05, tiredStun: 1.6,
};
function w5hDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function w5hWarnTime(diff = w5hDiff()) { const t = (ABILITY_TUNING[diff] || ABILITY_TUNING.normal).telegraph; return W5H.warnTime * t; }
function w5hBoss() { return typeof monsters !== "undefined" ? monsters.find((m) => m.type === "w5_blackHole" && m.hp > 0) || null : null; }
function w5hHost() { return !(typeof netGuest === "function" && netGuest()); }

Object.assign(MATERIALS, { w5_holeDust: { name: "블랙홀 별가루", color: "#c8a8ff", enchant: "chain" } });
Object.assign(ABILITIES, {
  w5_hSuck: { name: "빨아들이기", desc: "블랙홀이 모든 걸 빨아들여요! 초록으로 빛나는 안전한 자리 밖에 있으면 끌려가 꿀꺽!", counter: "초록 별 자리(기둥 그림자·빛 방울·별 닻)로 숨어요",
    tags: ["boss", "pull"], telegraph: { shape: "self", radius: 2.2, at: "self", time: W5H.warnTime },
    cooldown: 14, range: [0, 40], damageMul: 0, anim: "roar", effect: { type: "w5_suck" } },
  w5_hSpit: { name: "삼킨 별 뱉기", desc: "삼켰던 별을 퉤퉤 여러 군데에 뱉어요.", counter: "원 사이로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.2 },
    cooldown: 8, range: [0, 40], damageMul: 1.3, anim: "roar", effect: { type: "rain", count: 7, spread: 3.8, stagger: 0.16 } },
  w5_hRing: { name: "중력 고리", desc: "블랙홀 둘레로 무거운 고리가 퍼져요. 아주 가깝거나 아주 멀면 괜찮아요.", counter: "고리 안쪽(블랙홀 곁)이나 바깥으로",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 7, inner: 2.8, at: "self", time: 1.4 },
    cooldown: 9, range: [0, 40], damageMul: 1.5, anim: "slam", effect: { type: "knockback", force: 1.2 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w5_hSuck: { text: "초록 별 자리로 숨어요!", do: true, voice: true },
  w5_hSpit: { text: "원 사이로" },
  w5_hRing: { text: "블랙홀 곁이나 멀리" },
});
if (typeof BEHAVIOR_DOCS !== "undefined") BEHAVIOR_DOCS.w5_holeAI = { name: "블랙홀", desc: "가운데에 떠서 정해진 순서로 기술을 써요. 가끔 모든 걸 빨아들여요.", counter: "빨아들일 땐 초록 안전 자리로! 끝나면 헥헥할 때 때려요" };
MONSTERS.w5_blackHole = { name: "블랙홀 꿀꺽이", shape: "w5_blackHole", behavior: "w5_holeAI", color: "#1a1028", hp: 420, speed: 0, damage: 2.9,
  xp: 120, emerald: 1, emeraldCount: 30, heavy: true, isBoss: true, size: 3.6, world: 5 };
// 소품: 닻 돌(길을 막아요) · 안전 자리(밟아도 돼요). 둘 다 때릴 수 없고 다치지 않아요 (w5Prop: void_env.js)
Object.assign(MONSTERS, {
  w5_hPillar: { name: "닻 돌", color: "#8a84a0", shape: "w5_hPillar", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true, world: 5, codexSkip: true, w5Prop: true },
  w5_hSafe: { name: "안전한 자리", color: "#7dffb0", shape: "w5_hSafe", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true, world: 5, codexSkip: true, w5Prop: true },
});
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w5_hPillar", "w5_hSafe");
if (typeof CODEX_SKIP !== "undefined") { CODEX_SKIP.add("w5_hPillar"); CODEX_SKIP.add("w5_hSafe"); }

BOSS_DEFS.starmaw = {
  id: "w5_blackHole", name: "블랙홀 꿀꺽이", title: "별을 삼키는 곳", size: 3.6, world: 5,
  material: { id: "w5_holeDust", name: "블랙홀 별가루", color: "#c8a8ff", enchant: "chain" },
  arena: { size: 28, theme: { floor: "#5e586e", moss: "#c8a8ff", wall: "#2a2438", darkness: 0.52, bg: "#020106" } },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w5_hSuck", "w5_hSpit", "w5_hRing", "w5_grayWave"] },
    { until: 0.33, gap: 1.6, pattern: ["w5_hSuck", "w5_hSpit", "w5_shadeCall", "w5_hRing", "w5_voidRain"] },
    { until: 0, gap: 1.5, pattern: ["w5_hSuck", "w5_hRing", "w5_hSpit", "w5_voidRain", "w5_grayWave"] },
  ].map((ph) => ({ ...ph, abilities: [...new Set(ph.pattern)] })),
  create(x, y, level) {
    const m = createMonster("w5_blackHole", x, y, level);
    m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS.starmaw;
    m.name = "별을 삼키는 곳, 블랙홀 꿀꺽이";
    m.r = 1.3; m.level = level; m.aggro = true; m.appearTimer = 1; m.immovable = true;
    m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.4; m.queue = []; m.bhWarn = 0; m.bhSuck = 0;
    m.onPhase = (idx) => w5hPhase(m, idx);
    return m;
  },
};
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") {
  defBase("L_w5Hole", { slot: "charm", legend: "starmaw", name: "작은 별 주머니", minL: 0, icon: "amulet", color: "#c8a8ff", perk: { hearts: 3, dmg: 0.12, luck: 0.2, speed: 0.05 }, desc: "블랙홀이 돌려준 별: 하트·공격력·행운·빠르기가 올라요" });
  BOSS_LEGENDS.starmaw = "L_w5Hole";
}
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.starmaw = { 0: "빨아들이면 기둥 뒤 초록 자리로!", 1: "금 간 기둥은 안 돼요! 멀쩡한 기둥 뒤로", 2: "색 수정을 켜고 빛 방울 안으로!" };

// ----- 행동: 가운데에 가만히, 빨아들이는 동안은 다른 기술을 안 써요 -----
if (typeof EXTRA_BEHAVIORS !== "undefined") EXTRA_BEHAVIORS.w5_holeAI = (m, p, dist, dt) => {
  m.moving = false;
  if (m.bhSuck > 0 || m.bhWarn > 0 && m.state !== "cast") return;
  if (EXTRA_BEHAVIORS.bossAI) EXTRA_BEHAVIORS.bossAI(m, p, dist, dt);
};
function w5hPhase(m, idx) {
  if (idx === 1) showMessage("빨아들일 때 기둥에 금이 가요! 멀쩡한 기둥 그림자로 숨어요", 3.2, false, "#d8c8ff");
  if (idx === 2) {
    showMessage("기둥이 다 부서졌어요! 색 수정을 켜면 빛 방울이 지켜줘요", 3.5, false, "#ffe27a");
    if (w5hHost()) w5hCrumble(m);
  }
}

// ----- 안전한 자리 -----
// 지금 켜진 안전 자리 목록 (방장·친구 둘 다 같은 답: 몬스터 칸만 봐요)
function w5hSafeZones() {
  const out = [];
  if (!w5hBoss()) return out;
  for (const o of monsters) {
    if (o.hp <= 0) continue;
    if (o.type === "w5_hSafe" && o.on > 0) out.push({ x: o.x, y: o.y, r: o.sr || 0.9, kind: o.kind || "shadow", o });
    else if (o.type === "w5_bcrystal" && o.lit > 0) out.push({ x: o.x, y: o.y, r: W5H.bubbleR, kind: "bubble", o });
  }
  return out;
}
function w5hIsSafe(p, zones = w5hSafeZones()) { return zones.some((z) => Math.hypot(p.x - z.x, p.y - z.y) < z.r); }

// 걸어서 가는 길 거리 (0.5칸 격자, 벽·기둥은 못 지나가요)
//   w5hDistField(from, maxD): from 에서 모든 칸까지 걸음 거리 (한 번 구해서 여러 자리를 비교해요)
//   지나갈 수 있는 칸 표는 땅·막힘이 바뀔 때만 다시 만들어요
const W5H_GRID = { tiles: null, n: -1, r: -1, W: 0, H: 0, free: null };
function w5hFreeGrid(r) {
  const S = 0.5, W = Math.ceil(world.W / S), H = Math.ceil(world.H / S), G = W5H_GRID;
  if (G.tiles !== world.tiles || G.n !== world.solids.length || G.r !== r || G.W !== W || G.H !== H) {
    G.tiles = world.tiles; G.n = world.solids.length; G.r = r; G.W = W; G.H = H;
    G.free = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) G.free[y * W + x] = hitsWall((x + 0.5) * S, (y + 0.5) * S, r) ? 0 : 1;
  }
  return G;
}
function w5hDistField(from, maxD = 40, r = 0.3) {
  // 네 방향 걸음 수 (비스듬히 가는 것보다 조금 길게 재요: 그래서 "닿는다"고 하면 진짜로 닿아요)
  const S = 0.5, G = w5hFreeGrid(r), W = G.W, H = G.H, free = G.free;
  const dist = new Float32Array(W * H).fill(Infinity);
  const sx = Math.floor(from.x / S), sy = Math.floor(from.y / S);
  if (sx < 0 || sy < 0 || sx >= W || sy >= H) return { dist, W, H, S };
  const q = new Int32Array(W * H), lim = maxD / S;
  let qh = 0, qt = 0;
  dist[sy * W + sx] = 0; q[qt++] = sy * W + sx;
  while (qh < qt) {
    const k = q[qh++], d0 = dist[k];
    if (d0 >= lim) continue;
    const x = k % W;
    if (x + 1 < W && free[k + 1] && dist[k + 1] === Infinity) { dist[k + 1] = d0 + 1; q[qt++] = k + 1; }
    if (x > 0 && free[k - 1] && dist[k - 1] === Infinity) { dist[k - 1] = d0 + 1; q[qt++] = k - 1; }
    if (k + W < W * H && free[k + W] && dist[k + W] === Infinity) { dist[k + W] = d0 + 1; q[qt++] = k + W; }
    if (k - W >= 0 && free[k - W] && dist[k - W] === Infinity) { dist[k - W] = d0 + 1; q[qt++] = k - W; }
  }
  return { dist, W, H, S };
}
// 거리표에서 자리(동그라미 안 한 칸이라도)까지 가장 짧은 걸음
function w5hFieldTo(F, x, y, r) {
  const { dist, W, H, S } = F; let best = Infinity;
  const x0 = Math.max(0, Math.floor((x - r) / S)), x1 = Math.min(W - 1, Math.floor((x + r) / S)), y0 = Math.max(0, Math.floor((y - r) / S)), y1 = Math.min(H - 1, Math.floor((y + r) / S));
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (Math.hypot((cx + 0.5) * S - x, (cy + 0.5) * S - y) < r && dist[cy * W + cx] < best) best = dist[cy * W + cx];
  return best * S;
}
function w5hPathDist(from, to, maxD = 40, r = 0.3) { return w5hFieldTo(w5hDistField(from, maxD, r), to.x, to.y, Math.max(0.36, to.r || 0.5)); }
// 걸어서 닿을 수 있는 거리 (예고 시간 동안)
function w5hReach(diff = w5hDiff()) { return W5H.walk * w5hWarnTime(diff) * W5H.reachK; }
// 이 주인공이 가장 빨리 닿는 안전 자리 { z, d } (없으면 null)
function w5hBestSafe(p, zones = w5hSafeZones(), maxD = 40) {
  let best = null, F = null;
  for (const z of zones) {
    if (Math.hypot(p.x - z.x, p.y - z.y) - z.r > maxD) continue;
    let d = 0;
    if (Math.hypot(p.x - z.x, p.y - z.y) >= z.r) { F = F || w5hDistField(p, maxD, p.r || 0.3); d = w5hFieldTo(F, z.x, z.y, Math.max(0.36, z.r * 0.7)); }
    if (d < Infinity && (!best || d < best.d)) best = { z, d };
  }
  return best;
}
// 빨아들이기를 시작할 때: 사람마다 걸어서 닿는 자리가 없으면 별 닻을 곁에 놓아요 (블랙홀에서 먼 쪽으로)
function w5hEnsureSafe(b) {
  const reach = w5hReach(), ph = Math.min(2, b.phaseIdx || 0), home = b.bhHome || b;
  let zones = w5hSafeZones();
  for (const p of alivePlayers()) {
    const best = w5hBestSafe(p, zones, reach + 2), okReach = !!(best && best.d <= reach);
    if (okReach && (ph < 2 || best.z.kind === "anchor")) continue; // 3단계는 사람마다 작은 별 닻이 하나씩 (빛 방울이 없어도 버틸 수 있게)
    const spot = w5hAnchorSpot(p, home, reach, ph);
    const a = w5hAddSafe(spot.x, spot.y, W5H.anchorR[ph], "anchor", b);
    a.on = 1; a.forPid = p.pid || 1;
    zones = w5hSafeZones();
  }
}
function w5hAnchorSpot(p, home, reach, ph) {
  const away = Math.atan2(p.y - home.y, p.x - home.x);
  const want = ph === 2 ? Math.min(reach * 0.75, 4.2) : Math.min(reach * 0.5, 2.5); // 3단계는 조금 달려야 해요
  for (const dd of [want, want * 0.7, want * 0.45, 1.2]) {
    for (const da of [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.4, -2.4, Math.PI]) {
      const x = p.x + Math.cos(away + da) * dd, y = p.y + Math.sin(away + da) * dd;
      if (Math.hypot(x - home.x, y - home.y) < W5H.coreR + 1.5) continue;
      if (hitsWall(x, y, 0.45)) continue;
      if (w5hPathDist(p, { x, y, r: 0.5 }, reach + 1, p.r || 0.3) <= reach) return { x, y };
    }
  }
  return { x: p.x, y: p.y }; // 그 자리 그대로 (언제나 닿아요)
}
function w5hAddSafe(x, y, r, kind, b) {
  const s = createMonster("w5_hSafe", x, y, (b && b.level) || game.mapLevel || 1);
  s.appearTimer = 0; s.aggro = false; s.immovable = true; s.r = 0.05; s.sr = r; s.kind = kind; s.on = 0;
  monsters.push(s);
  return s;
}
// 닻 돌 + 그림자 자리 놓기 (아레나: 블랙홀 둘레 6개)
function w5hBuildPillars(b) {
  const home = b.bhHome, a0 = Math.random() * Math.PI * 2, room = Math.min(world.W, world.H) / 2 - 2;
  const D = Math.min(W5H.pillarD, Math.max(3.5, room * 0.55));
  for (let i = 0; i < 6; i++) {
    const a = a0 + i / 6 * Math.PI * 2, px = home.x + Math.cos(a) * D, py = home.y + Math.sin(a) * D;
    const sx = home.x + Math.cos(a) * (D + W5H.shadowD), sy = home.y + Math.sin(a) * (D + W5H.shadowD);
    if (hitsWall(px, py, W5H.pillarR) || hitsWall(sx, sy, 0.4)) continue;
    const pl = spawnProp("w5_hPillar", px, py, b);
    pl.x = px; pl.y = py; pl.r = W5H.pillarR; pl.appearTimer = 0; pl.crack = 0; pl.pi = i;
    for (const o of world.solids) if (o.prop === pl) { o.x = px; o.y = py; o.r = W5H.pillarR; }
    const sh = w5hAddSafe(sx, sy, W5H.shadowR, "shadow", b);
    sh.pi = i; sh._pillar = pl;
  }
}
function w5hPillars() { return monsters.filter((o) => o.type === "w5_hPillar" && o.hp > 0); }
function w5hRemove(o) {
  o.hp = 0; o.silent = true; o.on = 0;
  world.solids = world.solids.filter((s) => s.prop !== o);
}
// 3단계: 기둥이 와르르 (그림자 자리도 사라져요)
function w5hCrumble(b) {
  for (const pl of w5hPillars()) { spawnBurst(pl.x, pl.y, ["#8a84a0", "#4a4458", "#c8a8ff"], 14); w5hRemove(pl); }
  for (const s of monsters.filter((o) => o.type === "w5_hSafe" && o.kind === "shadow")) w5hRemove(s);
  game.shake = Math.max(game.shake || 0, 0.6);
  if (typeof sfx !== "undefined" && sfx.boom) sfx.boom();
}

// ----- 방장: 예고 시작 (기술을 쓰는 순간) -----
hookOn("castStarted", (m, id) => {
  if (id !== "w5_hSuck" || !m || m.type !== "w5_blackHole" || !w5hHost()) return; // 친구 기기도 새 예고를 보면 castStarted 를 불러요: 계산은 방장만
  const c = casts.find((q) => q.m === m && q.id === "w5_hSuck");
  m.bhWarn = m.bhWarnMax = c ? c.time : w5hWarnTime();
  m.bhSuck = 0;
  const ph = m.phaseIdx || 0, pls = w5hPillars();
  // 2단계: 기둥 반쯤 금 가요 (빨아들일 때마다 다른 기둥)
  for (const pl of pls) pl.crack = 0;
  if (ph === 1 && pls.length > 1) {
    const order = pls.slice().sort(() => Math.random() - 0.5), keep = Math.ceil(pls.length / 2);
    order.slice(keep).forEach((pl) => { pl.crack = 1; addFloatText(pl.x, pl.y, "쩌적! 금이 갔어요", "#ff9090", 16); });
  }
  w5hUpdateSafeOn(m);
  w5hEnsureSafe(m);
  // 안내 글자는 hudDraw 가 (친구 화면에도 같은 글자)
}, 50);
// 그림자 자리는 예고·빨아들이는 동안만, 금 가지 않은 기둥의 것만 켜져요
function w5hUpdateSafeOn(b) {
  if (!w5hHost()) return;
  const active = b.bhWarn > 0 || b.bhSuck > 0;
  for (const s of monsters) {
    if (s.type !== "w5_hSafe" || s.hp <= 0) continue;
    if (s.kind === "anchor") { s.on = active ? 1 : 0; continue; }
    const pl = s._pillar, ok = pl && pl.hp > 0 && !pl.crack;
    const on = active && ok ? 1 : 0;
    if (s.on !== on) s.on = on;
  }
}
// 예고가 끝나면: 빨아들이기 시작
hookOn("resolveCast", (c) => {
  if (!c || !c.ab || !c.ab.effect || c.ab.effect.type !== "w5_suck") return false;
  if (c._w5Done || !w5hHost()) return true;
  c._w5Done = true;
  const b = c.m; if (!b || b.hp <= 0) return true;
  b.bhWarn = 0; b.bhSuck = b.bhSuckMax = W5H.pullT[w5hDiff()] || 3;
  // 금 간 기둥은 붕 떠서 흔들려요: 막아 주지 못해요 (끝나면 제자리)
  for (const pl of w5hPillars()) if (pl.crack) { pl.loose = 1; world.solids = world.solids.filter((o) => o.prop !== pl); }
  for (const p of allPlayers()) { p._bhSpit = null; p._bhImmune = false; }
  game.shake = Math.max(game.shake || 0, 0.5);
  return true;
}, 15);

// ----- 방장: 매 화면 -----
hookOn("dungeonTick", (dt) => {
  if (!w5hHost()) return;
  const b = w5hBoss(); if (!b) return;
  if (!b.bhInit) {
    b.bhInit = true;
    const kh = game.keyhunt;
    b.bhHome = kh && kh.inBoss ? { x: world.W / 2, y: world.H / 2 } : { x: b.x, y: b.y };
    b.x = b.bhHome.x; b.y = b.bhHome.y;
    w5hBuildPillars(b);
  }
  // 가운데에 가만히 (밀리지 않아요)
  b.x = b.bhHome.x; b.y = b.bhHome.y; b.knockX = 0; b.knockY = 0; b.charge = null;
  if (b.bhWarn > 0) {
    b.bhWarn = Math.max(0, b.bhWarn - dt);
    // 기술이 취소됐으면 (비틀 등) 예고도 끝
    if (!casts.some((q) => q.m === b && q.id === "w5_hSuck") && !(b.bhSuck > 0)) w5hEnd(b, true);
  }
  if (b.bhSuck > 0) {
    w5hPull(b, dt);
    b.bhSuck = Math.max(0, b.bhSuck - dt);
    if (b.bhSuck <= 0) w5hEnd(b, false);
  }
  w5hUpdateSafeOn(b);
  // 퉤! 뱉어지는 중
  for (const p of allPlayers()) {
    const s = p._bhSpit; if (!s) continue;
    moveEntity(p, s.vx * dt, s.vy * dt); s.t -= dt;
    if (s.t <= 0) p._bhSpit = null;
  }
}, 43);
function w5hArenaR(b) { return Math.max(6, Math.min(world.W, world.H) / 2 - 2); }
function w5hPull(b, dt) {
  const home = b.bhHome, zones = w5hSafeZones(), R = w5hArenaR(b), V = W5H.pullV[w5hDiff()] || 6;
  for (const p of alivePlayers()) {
    if (p._bhImmune || p._bhSpit || w5hIsSafe(p, zones)) continue;
    const dx = home.x - p.x, dy = home.y - p.y, d = Math.hypot(dx, dy) || 0.001;
    if (d < W5H.coreR) { w5hSwallow(b, p); continue; }
    const v = V * (0.85 + 0.4 * Math.max(0, 1 - d / R)), step = Math.min(v * dt, Math.max(0.01, d - W5H.coreR * 0.6));
    moveEntity(p, dx / d * step, dy / d * step);
    if (Math.random() < 0.3) addSparkle(p.x, p.y, 0.5, { vx: dx / d * 3, vy: dy / d * 3, life: 0.4, size: 0.4, hue: 270 });
  }
  // 작은 몬스터도 끌려가요 (보기만: 꿀꺽하지는 않아요)
  for (const o of monsters) {
    if (o === b || o.hp <= 0 || o.boss || (o.def && (o.def.behavior === "prop" || o.def.isBoss))) continue;
    const dx = home.x - o.x, dy = home.y - o.y, d = Math.hypot(dx, dy) || 1;
    if (d > W5H.coreR + 0.8) moveEntity(o, dx / d * V * 0.6 * dt, dy / d * V * 0.6 * dt);
  }
}
function w5hSwallow(b, p) {
  const home = b.bhHome;
  p.hurtTimer = 0; p.rollTimer = 0;
  const cap = W5H.swallow[w5hDiff()] || 0.4;
  addFloatText(p.x, p.y, "꿀꺽!", "#d8a8ff", 26);
  const bl = p.armor ? p.armor.block : 0; // 꿀꺽은 방패로 막을 수 없어요
  if (p.armor) p.armor.block = 0;
  try { hurtPlayer(p, p.maxHp * cap, b); } finally { if (p.armor) p.armor.block = bl; }
  // 퉤! (블랙홀에서 바깥으로)
  let dx = p.x - home.x, dy = p.y - home.y, d = Math.hypot(dx, dy);
  if (d < 0.05) { const a = Math.random() * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a); d = 1; }
  p._bhSpit = { vx: dx / d * W5H.spitV, vy: dy / d * W5H.spitV, t: W5H.spitT };
  p._bhImmune = true; // 이번 빨아들이기 동안은 다시 안 끌려요
  b.bhAte = (b.bhAte || 0) + 1;
  spawnBurst(p.x, p.y, ["#c8a8ff", "#fff6d8", "#1a1028"], 14);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
}
// 빨아들이기 끝 (cancel: 예고 중에 취소)
function w5hEnd(b, cancel) {
  b.bhWarn = 0; b.bhSuck = 0;
  for (const s of monsters.filter((o) => o.type === "w5_hSafe" && o.kind === "anchor")) w5hRemove(s);
  for (const pl of w5hPillars()) {
    if (pl.loose) { pl.loose = 0; if (!world.solids.some((o) => o.prop === pl)) world.solids.push({ x: pl.x, y: pl.y, r: pl.r, prop: pl }); }
    pl.crack = 0;
  }
  for (const p of allPlayers()) p._bhImmune = false;
  w5hUpdateSafeOn(b);
  if (cancel) return;
  // 켜진 색 수정 빛을 2개 넘게 삼키면 배탈! 크게 비틀
  const lit = monsters.filter((o) => o.type === "w5_bcrystal" && o.lit > 0);
  if (lit.length >= 2 && typeof w5bStun === "function") {
    for (const o of lit) o.lit = 0;
    w5bStun(b, W5H.bellyStun, W5H.bellyFrac, "으앗, 빛을 삼켜서 배탈! 지금이에요!", "#ffe27a");
    for (let i = 0; i < 24; i++) addSparkle(b.x, b.y, 1.4, { vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vz: 3, gravity: 3, life: 1.0, size: 0.7, hue: Math.random() * 360 });
    hookRun("w5ColorStun", b);
  } else {
    b.stagger = Math.max(b.stagger || 0, W5H.tiredStun * (typeof w5bStagK === "function" ? w5bStagK() : 1)); // 헥헥: 때릴 틈
    addFloatText(b.x, b.y, "헥헥… 배불러", "#d8c8ff", 20);
  }
}

// ----- 이기면: 별과 색이 터져 나와요 (이야기 끝맺음, 열린 결말) -----
function w5VoidEnding() {
  const i = WORLD_ORDER.indexOf(5), next = i >= 0 ? WORLD_ORDER[i + 1] : undefined;
  return next && WORLDS[next]
    ? `삼켰던 별과 색이 펑! 틈이 닫혀요… 그 너머로 별빛도 그림자도 아닌 색이 보였어요. ${josa(WORLDS[next].name, "으로/로")} 가는 길일까요?`
    : "삼켰던 별과 색이 펑! 틈이 닫혀요… 그 너머로 별빛도 그림자도 아닌 색이 잠깐 보였어요. 그 색이 뭔지는 아직 아무도 몰라요";
}
hookOn("monsterKilled", (m) => {
  if (!m || m.type !== "w5_blackHole" || m.trophy) return;
  for (const o of monsters.filter((q) => q.type === "w5_hPillar" || q.type === "w5_hSafe")) w5hRemove(o);
  for (const p of allPlayers()) { p._bhSpit = null; p._bhImmune = false; }
  if (typeof flashScreen === "function") flashScreen(0.4, true);
  for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 6; addSparkle(m.x, m.y, 1.2, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 2 + Math.random() * 3, gravity: 2, life: 1.6, size: 0.8, hue: Math.random() * 360 }); }
  showMessage(w5VoidEnding(), 6, true);
  hookRun("w5HoleClosed");
});

// ----- 그리기 -----
// 블랙홀: 바닥 그림자 → 뒤쪽 별빛 고리 → 까만 동그라미(눈) → 앞쪽 고리. 빨아들이는 동안은 고리가 빨리 돌고 입이 "오"
function w5hEll(c, rx, ry, a0, a1, style, lw) { ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, a0, a1); ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.stroke(); }
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.w5_blackHole = (m) => {
  const t = game.time, suck = m.bhSuck > 0, warn = m.bhWarn > 0, spin = suck ? 4 : warn ? 2.4 : 1;
  const k = TILE_W * 0.707, base = toScreen(m.x, m.y, 0), c = toScreen(m.x, m.y, 1.3 + Math.sin(t * 1.5) * 0.05);
  const ring = 2.4 * k * (suck ? 1.08 : 1), rc = 1.05 * k * (m.stagger > 0 ? 0.94 + 0.04 * Math.sin(t * 20) : 1);
  ctx.save();
  // 바닥 그림자
  ctx.fillStyle = "rgba(10,0,20,0.45)"; ctx.beginPath(); ctx.ellipse(base.x, base.y, ring * 0.85, ring * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  // 바깥 빛 (보라 → 투명)
  const g = ctx.createRadialGradient(c.x, c.y, rc * 0.9, c.x, c.y, ring * 1.25);
  g.addColorStop(0, "rgba(200,140,255,0.55)"); g.addColorStop(0.5, "rgba(255,150,90,0.18)"); g.addColorStop(1, "rgba(120,60,200,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y, ring * 1.25, ring * 0.8, 0, 0, Math.PI * 2); ctx.fill();
  // 뒤쪽 고리 (위 반쪽)
  const cols = ["#ffb070", "#ff7ab8", "#c8a8ff"];
  cols.forEach((col, i) => w5hEll(c, ring * (1 - i * 0.12), ring * 0.38 * (1 - i * 0.12), Math.PI, Math.PI * 2, col, (5 - i) * ZOOM));
  const dots = (front) => {
    for (let i = 0; i < 16; i++) {
      const a = t * spin * (0.8 + (i % 3) * 0.15) + i / 16 * Math.PI * 2, s = Math.sin(a);
      if ((s > 0) !== front) continue;
      const rr = ring * (0.82 + (i % 4) * 0.06);
      ctx.fillStyle = ["#fff6d8", "#ffdf5a", "#9fe8ff", "#ff9ad6"][i % 4];
      ctx.fillRect(c.x + Math.cos(a) * rr - 2 * ZOOM, c.y + s * rr * 0.38 - 2 * ZOOM, 4 * ZOOM, 4 * ZOOM);
    }
  };
  dots(false);
  // 까만 동그라미 + 테두리 빛
  const rim = ctx.createRadialGradient(c.x, c.y, rc * 0.7, c.x, c.y, rc * 1.15);
  rim.addColorStop(0, "#05020a"); rim.addColorStop(0.8, "#120a20"); rim.addColorStop(1, "rgba(216,168,255,0.9)");
  ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(c.x, c.y, rc * 1.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#05020a"; ctx.beginPath(); ctx.arc(c.x, c.y, rc, 0, Math.PI * 2); ctx.fill();
  // 큰 눈 (주인공 쪽을 봐요), 비틀면 빙글 눈
  const p = typeof nearestPlayer === "function" ? nearestPlayer(m.x, m.y) : game.player;
  const look = p ? toScreen(p.x, p.y, 1) : c, lx = Math.max(-1, Math.min(1, (look.x - c.x) / 200)), ly = Math.max(-1, Math.min(1, (look.y - c.y) / 200));
  for (const sd of [-1, 1]) {
    const ex = c.x + sd * rc * 0.38, ey = c.y - rc * 0.12, er = rc * 0.24;
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(ex, ey, er, er * (warn ? 0.55 : 1.15), 0, 0, Math.PI * 2); ctx.fill();
    if (m.stagger > 0) { ctx.strokeStyle = "#5a3a8a"; ctx.lineWidth = 2 * ZOOM; ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i * 0.9 + t * 8, rr = er * (0.15 + i * 0.05); ctx.lineTo(ex + Math.cos(a) * rr, ey + Math.sin(a) * rr); } ctx.stroke(); }
    else { ctx.fillStyle = "#1a1028"; ctx.beginPath(); ctx.arc(ex + lx * er * 0.4, ey + ly * er * 0.4, er * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(ex + lx * er * 0.4 - er * 0.18, ey + ly * er * 0.4 - er * 0.2, er * 0.16, 0, Math.PI * 2); ctx.fill(); }
  }
  // 입: 빨아들일 땐 "오", 평소엔 작은 웃음
  ctx.fillStyle = "#3a1a5a"; ctx.strokeStyle = "#c8a8ff"; ctx.lineWidth = 2 * ZOOM;
  if (suck || warn) { ctx.beginPath(); ctx.ellipse(c.x, c.y + rc * 0.42, rc * (suck ? 0.22 : 0.14), rc * (suck ? 0.26 : 0.16), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(c.x, c.y + rc * 0.3, rc * 0.16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  // 앞쪽 고리 (아래 반쪽)
  cols.forEach((col, i) => w5hEll(c, ring * (1 - i * 0.12), ring * 0.38 * (1 - i * 0.12), 0, Math.PI, col, (5 - i) * ZOOM));
  dots(true);
  ctx.restore();
  // 빨려 들어가는 별가루 (트로피는 조용히)
  if (!m.trophy && Math.random() < (suck ? 1 : 0.35)) {
    for (let i = 0; i < (suck ? 3 : 1); i++) {
      const a = Math.random() * Math.PI * 2, r = suck ? 6 + Math.random() * 5 : 3 + Math.random() * 2, v = suck ? 9 : 3;
      addSparkle(m.x + Math.cos(a) * r, m.y + Math.sin(a) * r, 0.6 + Math.random(), { vx: -Math.cos(a) * v + Math.sin(a) * v * 0.4, vy: -Math.sin(a) * v - Math.cos(a) * v * 0.4, life: r / v, size: 0.4, hue: 260 + Math.random() * 60 });
    }
  }
};
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  // 닻 돌: 보라 돌기둥 + 별 글자. 금 가면 빨간 금 + 살짝 기울어요
  w5_hPillar(m) {
    const cr = m.crack > 0, sh = cr ? Math.sin(game.time * 30) * (m.loose ? 0.08 : 0.03) : 0, lit = !cr && w5hBoss() && (w5hBoss().bhWarn > 0 || w5hBoss().bhSuck > 0);
    drawBox(m.x - 0.55, m.y - 0.55, 0, 1.1, 1.1, 0.18, "#4a4458");
    if (m.loose) { ctx.save(); ctx.globalAlpha = 0.55; drawBox(m.x - 0.42 + sh, m.y - 0.42, 0.6 + Math.sin(game.time * 6) * 0.1, 0.84, 0.84, 1.5, "#7a5a6a"); ctx.restore(); return; } // 붕 떠서 흔들 (막지 못해요)
    drawBox(m.x - 0.42 + sh, m.y - 0.42, 0.18, 0.84, 0.84, 1.7, cr ? "#7a5a6a" : "#8a84a0");
    drawBox(m.x - 0.5 + sh, m.y - 0.5, 1.88, 1.0, 1.0, 0.16, cr ? "#6a4a5a" : "#a8a0c0");
    drawBox(m.x + 0.42 + sh, m.y - 0.12, 0.7, 0.02, 0.24, 0.5, lit ? "#7dffb0" : "#c8a8ff");
    drawBox(m.x - 0.12 + sh, m.y + 0.42, 0.7, 0.24, 0.02, 0.5, lit ? "#7dffb0" : "#c8a8ff");
    if (cr) { drawBox(m.x + 0.43 + sh, m.y - 0.3, 0.3, 0.02, 0.06, 1.2, "#ff5050"); drawBox(m.x - 0.3 + sh, m.y + 0.43, 0.5, 0.06, 0.02, 1.0, "#ff5050"); }
  },
  w5_hSafe() {}, // 바닥 그림은 drawFloor 에서 (주인공보다 먼저)
});
// 바닥: 안전한 자리 (초록 별 동그라미) + 내 주인공에서 가장 가까운 자리로 화살표 + 블랙홀 둘레 빨려드는 소용돌이 선
hookOn("drawFloor", () => {
  const b = w5hBoss(); if (!b) return;
  const t = game.time, active = b.bhWarn > 0 || b.bhSuck > 0, me = game.player;
  if (active && typeof w5Circle === "function") {
    for (let i = 0; i < 4; i++) { const r = ((1 - ((t * (b.bhSuck > 0 ? 1.4 : 0.7) + i / 4) % 1)) * 11) + W5H.coreR; w5Circle(b.x, b.y, r, null, `rgba(200,140,255,${0.15 + 0.3 * (1 - r / 12)})`, 3, true); }
  }
  for (const o of monsters) {
    if (o.type !== "w5_hSafe" || o.hp <= 0) continue;
    if (!active) { if (o.kind === "shadow" && typeof w5Circle === "function") w5Circle(o.x, o.y, o.sr, null, "rgba(125,255,176,0.22)", 1.5, true); continue; }
    if (!(o.on > 0)) continue;
    w5hDrawSafe(o.x, o.y, o.sr, o.kind);
  }
  if (active) for (const o of monsters) if (o.type === "w5_bcrystal" && o.lit > 0 && o.hp > 0) w5hDrawSafe(o.x, o.y, W5H.bubbleR, "bubble");
  // 화살표: 아직 안전하지 않으면 가장 가까운 안전 자리로
  if (active && me && me.hp > 0) {
    const zones = w5hSafeZones();
    if (zones.length && !w5hIsSafe(me, zones)) {
      let z = zones[0]; for (const q of zones) if (Math.hypot(q.x - me.x, q.y - me.y) < Math.hypot(z.x - me.x, z.y - me.y)) z = q;
      const dx = z.x - me.x, dy = z.y - me.y, d = Math.hypot(dx, dy) || 1, n = Math.min(5, Math.floor(d / 0.7));
      for (let i = 1; i <= n; i++) {
        const k = ((i + t * 3) % (n + 1)) / (n + 1), x = me.x + dx * k, y = me.y + dy * k;
        const a = toScreen(x, y, 0.02), f = toScreen(x + dx / d * 0.35, y + dy / d * 0.35, 0.02), sx = toScreen(x - dy / d * 0.22, y + dx / d * 0.22, 0.02), sy = toScreen(x + dy / d * 0.22, y - dx / d * 0.22, 0.02);
        ctx.fillStyle = "rgba(125,255,176,0.9)"; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(sx.x, sx.y); ctx.lineTo(a.x, a.y); ctx.lineTo(sy.x, sy.y); ctx.closePath(); ctx.fill();
      }
    }
  }
}, 55);
function w5hDrawSafe(x, y, r, kind) {
  const t = game.time, pulse = 0.5 + 0.5 * Math.sin(t * 6);
  if (typeof w5Circle === "function") {
    w5Circle(x, y, r, `rgba(80,255,150,${0.22 + 0.16 * pulse})`, kind === "bubble" ? "#ffe27a" : "#7dffb0", 3.5, true);
    w5Circle(x, y, r * 0.6, `rgba(180,255,210,${0.15 + 0.1 * pulse})`, null);
  }
  const s = toScreen(x, y, 0.5 + 0.15 * pulse);
  drawStar(s.x, s.y, (kind === "anchor" ? 8 : 10) * ZOOM, kind === "bubble" ? "#ffe27a" : "#b8ffd8");
}
// 화면: 예고 중 가장자리 소용돌이 + 큰 글자 + 남은 초, 빨아들이는 중 "버텨요!" (친구 화면도 같은 칸을 봐요) + 소리
const W5H_FX = { warnSeen: false, suckSeen: false };
hookOn("hudDraw", () => {
  const b = game.scene === "dungeon" ? w5hBoss() : null;
  const warn = !!(b && b.bhWarn > 0), suck = !!(b && b.bhSuck > 0);
  if (warn && !W5H_FX.warnSeen && typeof tone === "function") { tone(620, 1.2, "sawtooth", 0.05, 110); tone(90, 1.4, "sine", 0.08, 50, 0.2); }
  if (suck && !W5H_FX.suckSeen && typeof noise === "function") { noise(1.6, 0.22, 400, "lowpass"); tone(160, 1.5, "sine", 0.06, 60); }
  W5H_FX.warnSeen = warn; W5H_FX.suckSeen = suck;
  if (!warn && !suck) return;
  const W = view.w, H = view.h, t = game.time;
  ctx.save();
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, "rgba(40,0,70,0)"); g.addColorStop(1, `rgba(60,10,100,${suck ? 0.6 : 0.4 + 0.15 * Math.sin(t * 8)})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 가장자리 소용돌이 줄
  ctx.strokeStyle = "rgba(216,168,255,0.5)"; ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = t * (suck ? 2.2 : 1.2) + i / 8 * Math.PI * 2, r0 = Math.max(W, H) * 0.62;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, r0, a, a + 0.35); ctx.stroke();
  }
  const me = game.player, safe = me && w5hIsSafe(me);
  const msg = suck ? (safe ? "안전해요! 그대로 버텨요!" : "꿀꺽꿀꺽! 초록 자리로!") : `블랙홀이 빨아들여요! 초록 별 자리로 숨어요! ${Math.ceil(b.bhWarn)}`;
  text(msg, W / 2, Math.min(170, H * 0.3), Math.max(18, Math.min(28, W / 30)), safe ? "#7dffb0" : "#ffe27a", "center");
  const ph = Math.min(2, b.phaseIdx || 0);
  const hint = safe ? "안전한 자리예요! 여기 있어요" : ["기둥 뒤 초록 자리로 가요", "금 간 기둥 뒤는 안 돼요! 멀쩡한 기둥 뒤로", "빛 방울이나 작은 별 닻 안으로 가요"][ph];
  if (warn) text(hint, W / 2, Math.min(170, H * 0.3) + 30, 16, safe ? "#7dffb0" : "#ffffff", "center");
  ctx.restore();
}, 45);
