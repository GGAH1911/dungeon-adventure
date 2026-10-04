// ===== 월드 3 보스 12~14: 해님 달님 · 별자리 곰 큰곰이 · 달의 여왕 은하 (설계서 docs/design/world3-moon.md 5-12~5-14) =====
// 12 해님 달님 (eclipse): 보스 2마리가 체력 하나를 나눠 써요. 해님(본체 w3_sunMoon) + 달님(w3_moonTwin, m.twinOf = 해님)
//    달님이 받는 피해는 모두 해님 체력에서 빠져요 (체력 막대 하나, 해님이 쓰러지면 달님도 같이).
//    새 아이디어: 일식. 20초마다(3단계 16초) 3초 예고 뒤 6초 깜깜 → 둘이 가운데로 와서 겹쳐요 = 받는 피해 ×2 → 일식 끝에 둘 다 비틀.
//    밝을 때는 해님·달님이 한 박자씩 엇갈려 기술을 써요 (해님 기술이 끝나야 달님, 달님이 쓰는 동안 해님은 기다려요).
// 13 별자리 곰 큰곰이 (earthview): w3_constellation = 바닥 별 5개(쉬움 3)에 번호 → 1부터 순서대로 밟으면 별자리 사슬로 묶여 비틀
// 14 달의 여왕 은하 (mooncastle): 앞 보스 섞기. 단계 = 달 모양
//    1 초승달: 광선·되받아치는 빛 구슬·별비 / 2 반달: 아레나 낮은 중력 + 달 손 + 별자리(별 3개) / 3 보름달: 하늘로 떠서 칼이 안 닿아요 → 별자리를 완성하면 끌려 내려와 비틀
// 같이 하기: 싸움 상태는 모두 보스·소품 몬스터 칸 (smEcl·smDarkV·smOverlap / sbStars·sbOrder·sbBound / qFly·qFlyZ·qDown, 빛 구슬은 몬스터)
// 다른 에이전트 파일이 만든 기술(w3_botLaser·w3_starfall)이 있으면 여왕이 그걸 써요. 없으면 이 파일의 비슷한 기술(w3_qLaser·w3_qStarfall)
// w3_constellation 은 별이 없으면 아레나 가운데 둘레에 별을 스스로 놓아요 (탑 주인 미르도 그냥 불러 쓰면 돼요)

const W3D = {
  sunMoon: { mapId: "eclipse", type: "w3_sunMoon", twin: "w3_moonTwin", hp: 310, damage: 2.4, speed: 1.1, size: 2.6, r: 0.95 },
  starBear: { mapId: "earthview", type: "w3_starBear", hp: 315, damage: 2.4, speed: 1.1, size: 3.3, r: 1.1 },
  moonQueen: { mapId: "mooncastle", type: "w3_moonQueen", hp: 340, damage: 2.5, speed: 1.1, size: 3.2, r: 1.05 },
  // 일식 (해님 달님)
  ecl: { period: 20, period3: 16, warn: 3, dark: 6, slot: 0.75, glide: 4.2, darkV: 0.74, brightV: 0.38, endStagger: 2.0, overlapMul: 2 },
  // 별자리
  star: { ring: 6.5, step: 0.75, time: { easy: 7.5, normal: 6, hard: 6, nightmare: 5.5 }, stagger: 3.6, meteors: 4, meteorEvery: 1.3, safeR: 1.6 },
  // 여왕
  queen: { flyZ: 1.7, downStagger: 4.0, orbSpeed: 2.6, orbBack: 7.5, orbLife: 7, orbStagger: 2.6, orbDmgFrac: 0.03, orbMul: 1.5 },
};
function w3dDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function w3dStagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[w3dDiff()] || 1; }
function w3dFind(type) { return monsters.find((o) => o.type === type && o.hp > 0) || null; }

Object.assign(MATERIALS, {
  w3_sunMoonPearl: { name: "해달 구슬", color: "#fff6c0" },
  w3_starPelt: { name: "별자리 털", color: "#2a3a7a" },
  w3_moonTear: { name: "달의 눈물", color: "#e0d8ff" },
});

// ----- 보스 전설 (8-3) -----
if (typeof defBase === "function") { // (도구 tools/lib.mjs 는 loot.js 없이 읽어요)
  defBase("L_eclipse", { slot: "weapon", legend: "eclipse", name: "해님 달님 지팡이", minL: 0, color: "#ffd23f", mul: 1.16, effect: "burn",
    forms: LEGEND_FORMS({ w: "해님 달님 검", m: "해님 달님 지팡이", d: "해님 달님 지팡이", h: "해님 달님 단검" }, "sword"), desc: "해와 달의 힘: 맞으면 불이 붙어요 (공격력 +16%)" });
  defBase("L_earthview", { slot: "armor", legend: "earthview", name: "큰곰자리 갑옷", minL: 0, look: { body: "#2a3a7a", legs: "#1e2a5a", helmet: "#ffe27a", boots: "#141c40", gloves: "#2a3a7a" }, perk: { hearts: 3, block: 0.12 }, desc: "하트 +3, 더 잘 막아요" });
  defBase("L_mooncastle", { slot: "weapon", legend: "mooncastle", name: "달의 여왕 홀", minL: 0, color: "#e0d8ff", mul: 1.2, effect: "chain",
    forms: LEGEND_FORMS({ w: "달의 여왕 검", m: "달의 여왕 홀", d: "달의 여왕 홀", h: "달의 여왕 단검" }, "sword"), desc: "월드 3 마지막 전설: 옆 몬스터에게 번개가 튀어요 (공격력 +20%)" });
  Object.assign(BOSS_LEGENDS, { eclipse: "L_eclipse", earthview: "L_earthview", mooncastle: "L_mooncastle" });
}

// ----- 몬스터 (보스·달님·빛 구슬) -----
Object.assign(MONSTERS, {
  [W3D.sunMoon.type]: { name: "해님", shape: "w3_sunMoon", behavior: "w3_sunAI", color: "#ffd23f", hp: W3D.sunMoon.hp, speed: W3D.sunMoon.speed, damage: W3D.sunMoon.damage,
    xp: 60, emerald: 1, emeraldCount: 14, heavy: true, isBoss: true, size: W3D.sunMoon.size, world: 3 },
  // 달님: 체력은 해님과 같이 써요 (맞으면 해님 체력에서 빠져요). 혼자서는 쓰러지지 않아요
  [W3D.sunMoon.twin]: { name: "달님", shape: "w3_moonTwin", behavior: "w3_twinMoon", color: "#d8d8f0", hp: 1e9, speed: 1.1, damage: W3D.sunMoon.damage,
    xp: 0, emerald: 0, heavy: true, size: W3D.sunMoon.size, world: 3, codexSkip: true },
  [W3D.starBear.type]: { name: "큰곰이", shape: "w3_starBear", behavior: "bossAI", color: "#2a3a7a", hp: W3D.starBear.hp, speed: W3D.starBear.speed, damage: W3D.starBear.damage,
    xp: 62, emerald: 1, emeraldCount: 14, heavy: true, isBoss: true, size: W3D.starBear.size, world: 3 },
  [W3D.moonQueen.type]: { name: "은하", shape: "w3_moonQueen", behavior: "bossAI", color: "#d8d8f0", hp: W3D.moonQueen.hp, speed: W3D.moonQueen.speed, damage: W3D.moonQueen.damage,
    xp: 70, emerald: 1, emeraldCount: 16, heavy: true, isBoss: true, size: W3D.moonQueen.size, world: 3 },
  // 여왕의 빛 구슬: 천천히 따라와요. 칼·화살·마법으로 치면 여왕에게 되돌아가 펑!
  w3_qOrbBall: { name: "빛 구슬", shape: "w3_qOrbBall", behavior: "w3_qOrbBall", color: "#fff6c0", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, floaty: true, world: 3, codexSkip: true },
});
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push(W3D.sunMoon.twin, "w3_qOrbBall");
if (typeof CODEX_SKIP !== "undefined") { CODEX_SKIP.add(W3D.sunMoon.twin); CODEX_SKIP.add("w3_qOrbBall"); }
Object.assign(BEHAVIOR_DOCS, {
  w3_sunAI: { name: "해님 (일식)", desc: "밝을 때는 불 기술, 일식이 오면 달님과 가운데에서 겹쳐요.", counter: "일식 때 겹친 둘을 한꺼번에 때려요 (피해 ×2)" },
  w3_twinMoon: { name: "달님 (해님과 체력 하나)", desc: "해님 반대쪽에서 얼음 기술을 써요. 해님과 번갈아요. 맞으면 해님 체력이 줄어요.", counter: "달님을 때려도 해님이 아파요" },
  w3_qOrbBall: { name: "빛 구슬", desc: "천천히 따라오는 빛 구슬. 닿으면 아파요.", counter: "칼로 쳐서 여왕에게 되돌려 보내요" },
});

// ----- 기술 -----
Object.assign(ABILITIES, {
  // 해님 달님
  w3_smStarDrop: { name: "달님 별똥별", desc: "달님이 별똥별 셋을 불러요. 바닥 그림자가 진해지면 쿵!", counter: "그림자 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi", "sky"], telegraph: { shape: "circle", radius: 1.4, at: "target", time: 1.6 },
    cooldown: 8, range: [0, 14], damageMul: 1.1, anim: "raise", effect: { type: "rain", count: 3, spread: 3.0, stagger: 0.25 } },
  w3_smEclipseRing: { name: "일식 고리", desc: "겹친 해님 달님 둘레로 빛 고리가 퍼져요. 둘 바로 옆은 안전해요.", counter: "겹친 둘 옆 금색 안으로 파고들어요",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 5, inner: 2.2, at: "self", time: 1.3 },
    cooldown: 6, range: [0, 30], damageMul: 1.4, anim: "raise", effect: { type: "knockback", force: 1.0 } },
  // 큰곰이
  w3_bearPaw: { name: "곰 앞발", desc: "앞발을 번쩍 들었다가 앞을 쾅! 그 뒤 숨을 골라요.", counter: "빨간 원 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.0, at: "front", offset: 1.8, time: 1.25 },
    cooldown: 5, range: [0, 3.6], damageMul: 2.1, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.4 } },
  // 별자리: 바닥 별에 번호가 떠요 (아프지 않아요)
  w3_constellation: { name: "별자리", desc: "별자리를 그리면 바닥 별에 번호가 떠요. 1부터 순서대로 밟으면 별자리 사슬이 보스를 묶어요!", counter: "숫자 별을 1부터 순서대로 밟아요 (친구와 나눠 밟아도 돼요)",
    tags: ["boss", "puzzle"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 1.0 },
    cooldown: 14, range: [0, 30], damageMul: 0, anim: "raise", effect: { type: "w3_starOrder" } },
  // 은하
  w3_qOrb: { name: "빛 구슬", desc: "지팡이 끝에 빛을 모아 느린 빛 구슬을 보내요. 닿으면 아파요.", counter: "구슬을 칼로 쳐서 여왕에게 되돌려요 (피해도 돼요)",
    tags: ["boss", "orb", "stagger"], telegraph: { shape: "circle", radius: 0.9, at: "front", offset: 1.4, time: 1.0 },
    cooldown: 7, range: [0, 12], damageMul: 0, anim: "staff", effect: { type: "w3_qOrbShoot" } },
  w3_moonGrab: { name: "달 손", desc: "달빛 손이 발밑을 따라오다가 멈춘 곳을 꽉 쥐어요.", counter: "계속 움직이다가 테두리가 굵어지면 빠져나가요",
    tags: ["boss", "area", "track", "stagger"], telegraph: { shape: "circle", radius: 1.2, at: "target", time: 2.6, follow: true },
    cooldown: 8, range: [0, 12], damageMul: 1.8, anim: "point", staggerAfter: 1.4, effect: { type: "slow", duration: 1.5 } },
  w3_qLaser: { name: "달빛 광선", desc: "지팡이로 넓은 달빛 광선을 쭉 쏴요.", counter: "넓은 빨간 줄 옆으로 비켜요",
    tags: ["boss", "line", "stagger"], telegraph: { shape: "line", length: 11, width: 1.4, at: "self", time: 1.2 },
    cooldown: 7, range: [0, 11], damageMul: 1.8, anim: "staff", staggerAfter: 1.4, effect: { type: "damage" } },
  w3_qStarfall: { name: "별비", desc: "별 넷이 차례로 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi", "sky"], telegraph: { shape: "circle", radius: 1.4, at: "target", time: 1.4 },
    cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 4, spread: 3.2, stagger: 0.2 } },
});
// 다른 보스 파일의 기술이 있으면 그걸 써요 (같은 이름은 다시 정의하지 않아요)
const W3D_LASER = ABILITIES.w3_botLaser ? "w3_botLaser" : "w3_qLaser";
const W3D_STARFALL = ABILITIES.w3_starfall ? "w3_starfall" : "w3_qStarfall";

function w3dPhases(list) { return list.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap })); }
const SM_PHASES = w3dPhases([
  { until: 0.66, gap: 1.7, pattern: ["fireBreath", "meteorRain", "fireBreath"] },
  { until: 0.33, gap: 1.5, pattern: ["fireBreath", "meteorRain", "fireBreath", "meteorRain"] },
  { until: 0, gap: 1.3, pattern: ["fireBreath", "meteorRain", "fireBreath"] },
]);
const SM_TWIN_PATTERN = ["frostBreath", "w3_smStarDrop"];
const SB_PHASES = w3dPhases([
  { until: 0.66, gap: 1.7, pattern: ["w3_bearPaw", "w3_constellation", "charge", "w3_bearPaw"] },
  { until: 0.33, gap: 1.5, pattern: ["w3_bearPaw", "b2_spinBeams", "w3_constellation", "charge"] },
  { until: 0, gap: 1.3, pattern: ["w3_constellation", "w3_bearPaw", "b2_spinBeams", "charge"] },
]);
const MQ_PHASES = w3dPhases([
  { until: 0.66, gap: 1.6, pattern: [W3D_LASER, "w3_qOrb", W3D_STARFALL, "w3_qOrb"] },
  { until: 0.33, gap: 1.4, pattern: ["w3_moonGrab", W3D_LASER, "w3_constellation", "w3_qOrb"] },
  { until: 0, gap: 1.3, pattern: ["w3_constellation", W3D_STARFALL, "b2_spinBeams", W3D_STARFALL] },
]);

// ----- 아레나 -----
function smBuildArena(w) {
  const c = w.W / 2;
  b2Pillars(w, [[-6, -6], [6, 6], [-6, 6], [6, -6]], 1);
  for (const [dx, dy] of [[-8, 0], [8, 0], [0, -8], [0, 8]]) w3AddLight(c + dx, c + dy, w); // 지구빛 수정 4
  // 일식은 보스 칸(smEcl)으로 돌려요 (맵 일식 장치 world.w3.eclipse 는 쓰지 않아요: 겹침 시간과 어긋나지 않게)
}
function sbBuildArena(w) {
  const c = w.W / 2;
  w3AddCrater(c, c, 2.4, w);
  w3AddPad(c - 9, c - 2, 1, 0.3, w); w3AddPad(c + 9, c + 2, -1, -0.3, w);
  w3AddPad(c - 2, c + 9, 0.3, -1, w); w3AddPad(c + 2, c - 9, -0.3, 1, w);
}
function mqBuildArena(w) {
  const c = w.W / 2;
  w3AddCrater(c, c, 2.2, w);
  for (const [dx, dy] of [[-9, -9], [9, 9], [-9, 9], [9, -9]]) w3AddDust(c + dx, c + dy, 2.0, w); // 가장자리 먼지
  w3AddPad(c - 10, c, 1, 0, w); w3AddPad(c + 10, c, -1, 0, w); w3AddPad(c, c - 10, 0, 1, w); w3AddPad(c, c + 10, 0, -1, w);
  w3AddTower(c - 6, c + 6, w); w3AddTower(c + 6, c - 6, w);
}
function w3dMakeBoss(info, mapId, title, x, y, level, extra) {
  const m = createMonster(info.type, x, y, level);
  m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[mapId];
  m.name = `${title} ${MONSTERS[info.type].name}`;
  m.r = info.r; m.level = level; m.aggro = true; m.appearTimer = 1;
  m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
  if (extra) extra(m);
  return m;
}
BOSS_DEFS[W3D.sunMoon.mapId] = {
  id: W3D.sunMoon.type, name: "해님 달님", title: "일식 신전의 쌍둥이", size: W3D.sunMoon.size, world: 3,
  material: { id: "w3_sunMoonPearl", name: "해달 구슬", color: "#fff6c0" },
  arena: { size: 28, theme: { floor: "#8a6a5a", moss: "#ffd23f", wall: "#4a3028", darkness: W3D.ecl.brightV, bg: "#0a0402" }, build: smBuildArena },
  phases: SM_PHASES,
  create: (x, y, level) => w3dMakeBoss(W3D.sunMoon, W3D.sunMoon.mapId, "일식 신전의", x, y, level, (m) => {
    m.name = "해님 달님"; m.smT = 0; m.smEcl = "bright"; m.smDarkV = W3D.ecl.brightV;
    m.onPhase = (idx) => {
      if (idx === 1) showMessage("달님도 같이 싸워요! 둘이 번갈아 기술을 써요", 2.8, false, "#d8d8f0");
      if (idx === 2) showMessage("일식이 더 자주 와요!", 2.6, false, "#ffd23f");
    };
  }),
};
BOSS_DEFS[W3D.starBear.mapId] = {
  id: W3D.starBear.type, name: "큰곰이", title: "별자리 곰", size: W3D.starBear.size, world: 3,
  material: { id: "w3_starPelt", name: "별자리 털", color: "#2a3a7a" },
  arena: { size: 28, theme: { floor: "#a8b0c0", moss: "#7fb8ff", wall: "#5a6278", darkness: 0.3, bg: "#020814" }, build: sbBuildArena },
  phases: SB_PHASES,
  create: (x, y, level) => w3dMakeBoss(W3D.starBear, W3D.starBear.mapId, "별자리 곰", x, y, level, (m) => {
    m.onPhase = (idx) => {
      if (idx === 1) showMessage("별빛 광선이 빙글! 광선을 따라 같이 돌아요", 2.8, false, "#ffe27a");
      if (idx === 2) showMessage("별을 밟는 동안 별똥별이 떨어져요! 별 위는 안전해요", 3, false, "#ffe27a");
    };
  }),
};
BOSS_DEFS[W3D.moonQueen.mapId] = {
  id: W3D.moonQueen.type, name: "은하", title: "달의 여왕", size: W3D.moonQueen.size, world: 3,
  material: { id: "w3_moonTear", name: "달의 눈물", color: "#e0d8ff" },
  arena: { size: 28, theme: { floor: "#c8c8dc", moss: "#e0d8ff", wall: "#6a6890", darkness: 0.42, bg: "#04030c" }, build: mqBuildArena },
  phases: MQ_PHASES,
  create: (x, y, level) => w3dMakeBoss(W3D.moonQueen, W3D.moonQueen.mapId, "달의 여왕", x, y, level, (m) => {
    m.qFly = false; m.qFlyZ = 0; m.qDown = 0;
    m.onPhase = (idx) => mqPhase(m, idx);
  }),
};
function mqPhase(m, idx) {
  casts = casts.filter((c) => c.m !== m);
  if (idx === 1) { showMessage("반달! 몸이 가벼워요. 구르면 멀리 가요", 3, false, "#e0d8ff"); m.w3StarCount = 3; }
  if (idx === 2) { showMessage("보름달! 여왕이 하늘로 떴어요. 별자리를 완성해서 끌어내려요!", 3.2, true, "#fff6c0"); m.qFly = true; m.w3StarCount = 0; }
}

// =========================================================
// 12. 해님 달님
// =========================================================
function smSun() { return w3dFind(W3D.sunMoon.type); }
function smTwin(sun) { return monsters.find((o) => o.type === W3D.sunMoon.twin && o.hp > 0 && (!sun || o.twinOf === sun)) || null; }
// 해님: 밝을 땐 bossAI, 일식(예고·깜깜) 땐 가운데로 와서 겹쳐요
EXTRA_BEHAVIORS.w3_sunAI = (m, p, dist, dt) => {
  if (m.smEcl && m.smEcl !== "bright") { m.moving = !!m.smGliding; if (p && !m.smGliding && m.state !== "cast") faceToward(m, p); return; }
  EXTRA_BEHAVIORS.bossAI(m, p, dist, dt);
};
// 달님: 해님 반대쪽에서, 해님 기술이 끝난 뒤 한 박자 엇갈려 기술
EXTRA_BEHAVIORS.w3_twinMoon = (m, p, dist, dt) => {
  const sun = m.twinOf;
  if (!sun || sun.hp <= 0) { m.hp = 0; m.silent = true; return; }
  if (sun.smEcl && sun.smEcl !== "bright") { m.moving = !!m.smGliding; return; }
  if (m.stagger > 0) { m.stagger -= dt; m.moving = false; return; }
  if (m.state === "cast") { m.moving = false; sun.gap = Math.max(sun.gap || 0, 0.45); return; } // 달님이 쓰는 동안 해님은 기다려요
  // 집: 아레나 가운데를 사이에 두고 해님 반대쪽
  const c = world.W / 2, hx = c - (sun.x - c), hy = c - (sun.y - c);
  const dx = hx - m.x, dy = hy - m.y, d = Math.hypot(dx, dy);
  if (d > 1.2) { moveWithSeparation(m, dx / d, dy / d, dt, m.speed); m.moving = true; } else m.moving = false;
  if (p) faceToward(m, p);
  // 해님 기술이 끝나고 해님이 쉬는 동안 한 번 (1단계는 구경)
  if (!p || sun.phaseIdx < 1 || sun.invuln > 0 || sun.stagger > 0) return;
  const ph = sun.bossDef.phases[sun.phaseIdx], G = ph.gap * bossTune().cooldown;
  if (m.twLastPat === sun.patIdx || sun.state === "cast" || sun.charge || !(sun.gap > G * 0.25)) return;
  m.twLastPat = sun.patIdx;
  const id = SM_TWIN_PATTERN[(m.twIdx = (m.twIdx || 0) + 1) % SM_TWIN_PATTERN.length];
  const ab = ABILITIES[id], pd = Math.hypot(p.x - m.x, p.y - m.y);
  if (pd < ab.range[0] || pd > ab.range[1]) { m.twLastPat = -1; return; } // 너무 멀면 다음 박자에
  castAbility(m, id, p);
};
// 해님이 생기면 달님을 놓아요 (첫 프레임). 해님이 쓰러지면 달님도
hookOn("dungeonTick", (dt) => {
  const sun = smSun();
  for (const t of monsters) if (t.type === W3D.sunMoon.twin && t.hp > 0 && (!t.twinOf || t.twinOf.hp <= 0)) { t.hp = 0; t.silent = true; }
  if (!sun) return;
  if (!sun.smInit) {
    sun.smInit = true;
    const c = world.W / 2;
    const spot = findFreeSpot(c - (sun.x - c), c - (sun.y - c), 0.9, 4) || { x: c, y: c + 4 };
    const t = createMonster(W3D.sunMoon.twin, spot.x, spot.y, sun.level || game.mapLevel || 1);
    t.twinOf = sun; t.aggro = true; t.appearTimer = 1; t.r = W3D.sunMoon.r; t.immovable = true; t.name = "달님";
    monsters.push(t);
    addRing(spot.x, spot.y, { speed: 4, life: 0.5, hue: 230 });
  }
  const tw = smTwin(sun);
  if (tw && tw.state === "cast" && sun.smEcl === "bright") sun.gap = Math.max(sun.gap || 0, 0.45); // 달님이 쓰는 동안 해님은 기다려요 (한 박자 엇갈림)
  smEclipseTick(sun, dt);
}, 40);
function smEclipseTick(sun, dt) {
  const E = W3D.ecl, twin = smTwin(sun);
  if (sun.appearTimer > 0) return;
  const per = sun.phaseIdx >= 2 ? E.period3 : E.period;
  sun.smT = (sun.smT || 0) + dt;
  const ph = sun.smT % per, darkAt = per - E.dark, warnAt = darkAt - E.warn;
  const want = ph < warnAt ? "bright" : ph < darkAt ? "warn" : "dark";
  if (want !== sun.smEcl) {
    const was = sun.smEcl;
    sun.smEcl = want;
    if (want === "warn") { showMessage("해가 가려져요! 곧 깜깜해져요", 2.6, false, "#ffb070"); sun.queue = []; }
    if (want === "dark") { showMessage("일식! 겹친 해님 달님을 같이 때려요 (×2)", 2.6, true, "#fff6c0"); sun.smRingDone = false; sun.smDarkT = 0; }
    if (want === "bright" && was === "dark") {
      const k = E.endStagger * w3dStagK();
      for (const o of [sun, twin]) { if (!o) continue; casts = casts.filter((q) => q.m !== o); o.charge = null; if (o.state === "cast") o.state = "chase"; o.stagger = Math.max(o.stagger || 0, k); }
      sun.queue = []; sun.gap = Math.max(sun.gap || 0, 0.6);
      addFloatText(sun.x, sun.y, "비틀!", "#ffe27a", 28); game.shake = Math.max(game.shake, 0.35);
      showMessage("해가 다시 떠요! 지금 마구 때려요", 2.2, false, "#ffe27a");
    }
  }
  // 어둠 (보스 칸 = 친구 기기도 같은 어둠)
  const goal = sun.smEcl === "dark" ? E.darkV : E.brightV;
  sun.smDarkV = sun.smDarkV === undefined ? goal : sun.smDarkV + Math.sign(goal - sun.smDarkV) * Math.min(Math.abs(goal - sun.smDarkV), dt * 0.6);
  // 예고·깜깜: 둘이 가운데로 (기술 쓰는 중이면 끝나고)
  sun.smOverlap = false;
  if (sun.smEcl === "bright") { sun.smGliding = false; if (twin) twin.smGliding = false; return; }
  if (sun.invuln > 0) { sun.invuln -= dt; } // 단계 바뀜 무적은 일식 중에도 흘러요
  const c = world.W / 2;
  let both = true;
  for (const [o, sx] of [[sun, -E.slot], [twin, E.slot]]) {
    if (!o) continue;
    if (o.state === "cast" || o.charge) { o.smGliding = false; both = false; continue; }
    const dx = c + sx - o.x, dy = c - o.y, d = Math.hypot(dx, dy);
    if (d > 0.08) { const s = Math.min(d, E.glide * dt); o.x += dx / d * s; o.y += dy / d * s; o.smGliding = true; o.moving = true; both = false; }
    else { o.smGliding = false; o.moving = false; }
  }
  if (sun.smEcl === "dark" && both && twin) {
    sun.smOverlap = true;
    sun.smDarkT = (sun.smDarkT || 0) + dt;
    if (!sun.smRingDone && sun.smDarkT > 1.4) { // 겹쳐서 함께 일식 고리 (둘 옆 금색 안이 안전)
      const p = nearestPlayer(sun.x, sun.y);
      if (p) { sun.smRingDone = true; castAbility(sun, "w3_smEclipseRing", p); }
    }
  }
}
// 피해: 달님 → 해님 체력, 겹친 동안 ×2
hookOn("monsterDamage", (h) => {
  const t = h.m;
  if (!t || t.type !== W3D.sunMoon.twin) return false;
  const sun = t.twinOf;
  if (!sun || sun.hp <= 0) return true;
  if (!h.opts.dot) { t.flash = 0.1; t.hitT = 0.15; }
  damageMonster(sun, h.dmg, h.fromX, h.fromY, h.legendary, 0, { ...h.opts, smTwin: true, effect: null });
  return true;
}, 3);
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (!m || m.type !== W3D.sunMoon.type || !m.smOverlap) return false;
  h.dmg *= W3D.ecl.overlapMul;
  if (!h.opts.dot && Math.random() < 0.3) addFloatText(m.x, m.y + 0.5, "일식! ×2", "#fff6c0", 18);
  return false;
}, 19);
hookOn("lights", (lights) => {
  if (game.scene !== "dungeon" || !world.theme) return;
  const sun = smSun();
  if (!sun) return;
  if (typeof sun.smDarkV === "number") world.theme.darkness = sun.smDarkV;
  lights.push({ x: sun.x, y: sun.y, radius: sun.smEcl === "dark" ? 2.8 : 2.2, power: 0.85, color: "#ffe9a0" }); // 해님은 늘 빛나요 (깜깜해도 둘이 보여요)
}, 5);
// 일식 예고: 화면 가장자리 주황 → 검정 테두리
hookOn("hudDraw", () => {
  const sun = smSun();
  if (!sun || sun.smEcl !== "warn" || game.scene !== "dungeon") return;
  const a = 0.25 + 0.2 * Math.sin(game.time * 8);
  ctx.save(); ctx.strokeStyle = `rgba(255,150,60,${a})`; ctx.lineWidth = 18; ctx.strokeRect(9, 9, view.w - 18, view.h - 18); ctx.restore();
  text("해가 가려져요!", view.w / 2, 120, 18, "#ffb070", "center");
}, 40);

// =========================================================
// 13·14. 별자리 (큰곰이·은하, 탑 주인도)
// =========================================================
// 별: 시전한 보스 칸 m.sbStars = [{x, y, n, lit}], 진행 m.sbOrder = { next, n, t }, 묶임 m.sbBound(초)
function sbMakeStars(m, n) {
  const c = world.W / 2, out = [], R = W3D.star.ring;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i / n * Math.PI * 2;
    const s = findFreeSpot(c + Math.cos(a) * R, c + Math.sin(a) * R, 0.4, 3) || { x: c + Math.cos(a) * R, y: c + Math.sin(a) * R };
    out.push({ x: Math.round(s.x * 100) / 100, y: Math.round(s.y * 100) / 100, n: 0, lit: false });
  }
  return out;
}
function sbStarCount(m) { if (m.w3StarCount) return m.w3StarCount; return w3dDiff() === "easy" ? 3 : 5; }
function sbStartOrder(m) {
  if (m.sbOrder) return; // 지금 별자리가 진행 중이면 그대로 (다시 시작하지 않아요)
  const n = sbStarCount(m);
  if (!m.sbStars || m.sbStars.length !== n) m.sbStars = sbMakeStars(m, n);
  const nums = [...Array(n).keys()].map((i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
  m.sbStars.forEach((s, i) => { s.n = nums[i]; s.lit = false; });
  m.sbOrder = { next: 1, n, t: W3D.star.time[w3dDiff()] || 6, meteors: 0, mT: 0.6 };
  showMessage(`별자리! 숫자 별을 1부터 ${n}까지 순서대로 밟아요`, 2.8, true, "#ffe27a");
}
function sbBind(m) {
  const k = w3dStagK();
  m.sbOrder = null; m.sbBound = 1.2;
  casts = casts.filter((q) => q.m !== m); m.charge = null; if (m.state === "cast") m.state = "chase"; m.queue = [];
  if (m.type === W3D.moonQueen.type) { m.qDown = W3D.queen.downStagger * k; m.stagger = Math.max(m.stagger || 0, m.qDown); showMessage("보름달 빛이 여왕을 끌어내려요! 지금이에요", 2.6, true, "#fff6c0"); }
  else { const s = (m.w3StarStagger || W3D.star.stagger) * k; m.stagger = Math.max(m.stagger || 0, s); m.staggerT = Math.max(m.staggerT || 0, s); showMessage("별자리 사슬! 꽁꽁 묶였어요", 2.4, true, "#ffe27a"); }
  addFloatText(m.x, m.y, "별자리 사슬!", "#ffe27a", 28); game.shake = Math.max(game.shake, 0.4);
  if (typeof sfx !== "undefined" && sfx.levelUp) sfx.levelUp();
}
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect, m = c.m;
  if (e.type === "w3_starOrder") { sbStartOrder(m); return true; }
  if (e.type === "w3_qOrbShoot") { mqShootOrb(m, p); return true; }
  return false;
}, 15);
// 별 밟기 (방장): 주인공 누구든 (친구와 나눠 밟아도 돼요)
hookOn("dungeonTick", (dt) => {
  for (const m of monsters) {
    if (m.sbBound > 0) m.sbBound = Math.max(0, m.sbBound - dt);
    const O = m.sbOrder;
    if (!O || !m.sbStars) continue;
    if (m.hp <= 0) { m.sbOrder = null; continue; }
    O.t -= dt;
    if (O.t <= 0) { m.sbOrder = null; for (const s of m.sbStars) s.lit = false; showMessage("별자리가 사라졌어요. 다음에 다시!", 2, false, "#9fb8ff"); continue; }
    for (const p of allPlayers()) {
      if (!p || p.hp <= 0) continue;
      for (const s of m.sbStars) {
        if (s.lit || Math.hypot(p.x - s.x, p.y - s.y) > W3D.star.step) continue;
        if (s.n === O.next) { s.lit = true; O.next++; addRing(s.x, s.y, { speed: 4, life: 0.4, gold: true }); addFloatText(s.x, s.y, `${s.n}`, "#ffe27a", 22); if (typeof sfx !== "undefined" && sfx.click) sfx.click(); }
        else if (game.time - (s.wrongT || -9) > 1) { s.wrongT = game.time; addFloatText(s.x, s.y, `${O.next}번 먼저!`, "#ff9a7a", 16); }
      }
    }
    if (O.next > O.n) { sbBind(m); continue; }
    // 3단계: 별을 밟는 동안 별똥별 (별 둘레 1.6칸 안엔 안 떨어져요)
    const late = (m.type === W3D.starBear.type || m.type === W3D.moonQueen.type) && m.phaseIdx >= 2;
    if (late && O.meteors < W3D.star.meteors) {
      O.mT -= dt;
      if (O.mT <= 0) { O.mT = W3D.star.meteorEvery; O.meteors++; sbDropMeteor(m); }
    }
  }
}, 45);
function sbDropMeteor(m) {
  const ps = allPlayers().filter((p) => p && p.hp > 0);
  if (!ps.length) return;
  const p = ps[Math.floor(Math.random() * ps.length)];
  for (let tries = 0; tries < 12; tries++) {
    const x = p.x + (Math.random() - 0.5) * 6, y = p.y + (Math.random() - 0.5) * 6;
    if (isWall(Math.floor(x), Math.floor(y))) continue;
    if (m.sbStars.some((s) => Math.hypot(s.x - x, s.y - y) < W3D.star.safeR + 1.4)) continue;
    const owner = { x, y, hp: 1, maxHp: 1, damage: m.damage, faceX: 1, faceY: 0, def: {}, state: "", w3Meteor: true };
    const tune = abilityTuning(), ab = ABILITIES.w3_meteor;
    casts.push(makeCast(owner, ab, "w3_meteor", owner, Math.max(MIN_TELEGRAPH, ab.telegraph.time * tune.telegraph), tune));
    return;
  }
}
// 별자리를 그리는 동안(1~2단계) 보스는 기술을 쉬어요: 아이가 별 밟기에 집중
hookOn("dungeonTick", () => {
  for (const m of monsters) if (m.sbOrder && m.bossA && m.phaseIdx < 2 && m.gap !== undefined) m.gap = Math.max(m.gap, 0.4);
}, 46);
// 그림: 바닥 별 + 번호 + 사슬 (두 기기 모두 보스 칸으로)
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon") return;
  for (const m of monsters) {
    if (!m.sbStars || m.hp <= 0) continue;
    const O = m.sbOrder;
    for (const s of m.sbStars) {
      const c = toScreen(s.x, s.y, 0.02), on = O && !s.lit;
      const r = (s.lit ? 15 : on ? 13 + 2 * Math.sin(game.time * 6) : 10) * ZOOM;
      drawStar(c.x, c.y, r, s.lit ? "#ffe27a" : on ? "#fff6c0" : "rgba(160,170,210,0.55)");
      if (O && s.n) text(`${s.n}`, c.x, c.y - 16 * ZOOM, Math.round(13 * ZOOM), s.lit ? "#ffe27a" : s.n === O.next ? "#7dffb0" : "#ffffff", "center");
    }
    // 이어진 별 선
    const lit = m.sbStars.filter((s) => s.lit && s.n).sort((a, b) => a.n - b.n);
    if (lit.length > 1 || m.sbBound > 0) {
      ctx.save(); ctx.strokeStyle = `rgba(255,226,122,${0.7 + 0.2 * Math.sin(game.time * 8)})`; ctx.lineWidth = 3 * ZOOM;
      ctx.beginPath(); lit.forEach((s, i) => { const q = toScreen(s.x, s.y, 0.05); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.stroke();
      if (m.sbBound > 0 || m.qDown > 0) for (const s of m.sbStars) { const a = toScreen(s.x, s.y, 0.05), b = toScreen(m.x, m.y, 0.5); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      ctx.restore();
    }
  }
}, 55);
hookOn("hudDraw", () => {
  if (game.scene !== "dungeon") return;
  const m = monsters.find((o) => o.sbOrder && o.hp > 0);
  if (!m) return;
  const O = m.sbOrder;
  text(`별자리 ${Math.min(O.next - 1, O.n)}/${O.n} · ${Math.ceil(O.t)}초 · 다음: ${Math.min(O.next, O.n)}번 별`, view.w / 2, 140, 17, "#ffe27a", "center");
}, 41);

// =========================================================
// 14. 달의 여왕 은하
// =========================================================
function mqQueen() { return w3dFind(W3D.moonQueen.type); }
hookOn("dungeonTick", (dt) => {
  const m = mqQueen();
  if (!m) return;
  if (m.qDown > 0) m.qDown = Math.max(0, m.qDown - dt);
  const up = m.qFly && !(m.qDown > 0);
  const goal = up ? W3D.queen.flyZ : 0;
  m.qFlyZ = (m.qFlyZ || 0) + Math.sign(goal - (m.qFlyZ || 0)) * Math.min(Math.abs(goal - (m.qFlyZ || 0)), dt * 2.4);
}, 44);
function mqFlying(m) { return !!(m && m.type === W3D.moonQueen.type && m.qFly && !(m.qDown > 0)); }
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (!mqFlying(m)) return false;
  if (!h.opts.dot && game.time - (m.qMissT || -9) > 0.6) { m.qMissT = game.time; addFloatText(m.x, m.y, "하늘이라 안 닿아요! 별자리!", "#d8d8f0", 16); }
  return true;
}, 18);
hookOn("untargetable", (o) => mqFlying(o), 50);
// 반달(2단계)부터: 아레나 전체 낮은 중력 (두 기기 모두 보스 단계로 맞춰요: lights 는 두 기기에서 불려요)
hookOn("lights", () => {
  if (game.scene !== "dungeon" || !world.w3) return;
  const m = mqQueen();
  const E = world.w3, has = E.lowgrav.findIndex((z) => z.mq);
  const want = !!(m && m.phaseIdx >= 1);
  if (want && has < 0) { E.lowgrav.push({ x0: 1, y0: 1, x1: world.W - 1, y1: world.H - 1, mq: true }); for (const c of E.craters) c.pullMul = 1.5; }
  if (!want && has >= 0) { E.lowgrav.splice(has, 1); for (const c of E.craters) c.pullMul = 1; }
}, 6);
// 빛 구슬
function mqShootOrb(m, p) {
  if (!p) return;
  const s = createMonster("w3_qOrbBall", m.x + m.faceX * 1.2, m.y + m.faceY * 1.2, m.level || game.mapLevel || 1);
  s.owner = m; s.qTarget = p; s.aggro = true; s.appearTimer = 0; s.r = 0.4; s.immovable = true; s.qLife = 0;
  s.qDmg = (m.damage || 1) * W3D.queen.orbMul * abilityTuning().damage;
  monsters.push(s);
  addRing(s.x, s.y, { speed: 3, life: 0.35, gold: true });
}
EXTRA_BEHAVIORS.w3_qOrbBall = (m, p, dist, dt) => {
  const Q = W3D.queen, q = m.owner;
  m.moving = false;
  m.qLife = (m.qLife || 0) + dt;
  const pop = () => { m.hp = 0; m.silent = true; spawnBurst(m.x, m.y, ["#fff6c0", "#ffffff"], 10); };
  if (m.qLife > Q.orbLife || !q || q.hp <= 0) { pop(); return; }
  if (m.qBack) {
    const dx = q.x - m.x, dy = q.y - m.y, d = Math.hypot(dx, dy) || 1;
    if (d < (q.r || 1) + 0.4) { mqOrbHitsQueen(m, q); return; }
    const s = Math.min(d, Q.orbBack * dt); m.x += dx / d * s; m.y += dy / d * s; // 되돌아갈 땐 벽 위로 둥실
    return;
  }
  const t = m.qTarget && m.qTarget.hp > 0 ? m.qTarget : p;
  if (!t) return;
  const dx = t.x - m.x, dy = t.y - m.y, d = Math.hypot(dx, dy) || 1;
  if (d < (t.r || 0.35) + 0.35) {
    if (t.rollTimer > 0) addFloatText(t.x, t.y, "회피!", "#9be8ff", 18);
    else hurtPlayer(t, m.qDmg || 2, m);
    pop(); return;
  }
  moveEntity(m, dx / d * Q.orbSpeed * dt, dy / d * Q.orbSpeed * dt);
};
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w3_qOrbBall") return false;
  if (!h.opts.dot && !s.qBack) { s.qBack = true; s.qLife = 0; addFloatText(s.x, s.y, "되받아쳤다!", "#ffe27a", 20); if (typeof sfx !== "undefined" && sfx.hit) sfx.hit(); }
  return true;
}, 4);
function mqOrbHitsQueen(s, q) {
  s.hp = 0; s.silent = true;
  spawnBurst(s.x, s.y, ["#fff6c0", "#ffe27a", "#ffffff"], 16);
  addRing(q.x, q.y, { speed: 6, life: 0.4, gold: true });
  if (mqFlying(q)) { addFloatText(q.x, q.y, "펑!", "#fff6c0", 20); return; } // 하늘에선 별자리로만
  q.qOrbHit = true;
  damageMonster(q, q.maxHp * W3D.queen.orbDmgFrac, s.x, s.y, false, 0, { w3Orb: true });
  q.qOrbHit = false;
  casts = casts.filter((c) => c.m !== q); q.charge = null; if (q.state === "cast") q.state = "chase"; q.queue = [];
  q.stagger = Math.max(q.stagger || 0, W3D.queen.orbStagger * w3dStagK());
  addFloatText(q.x, q.y, "펑! 비틀!", "#ffe27a", 28); game.shake = Math.max(game.shake, 0.4);
}

// =========================================================
// 모양
// =========================================================
function w3dLift(m, z, draw) { // 여왕처럼 떠 있는 몸: 화면에서 위로 올려 그려요
  if (!z) { draw(); return; }
  const a = toScreen(m.x, m.y, 0), b = toScreen(m.x, m.y, z);
  ctx.save(); ctx.translate(0, b.y - a.y); draw(); ctx.restore();
}
Object.assign(EXTRA_SHAPES, {
  // 해님: 노란 둥근 얼굴 + 주황 햇살 블록 8개 + 작은 몸·망토
  w3_sunMoon(m) {
    const a = bossMotion(m), P = [], b = 0.04 + Math.sin(a.t * 2) * 0.02;
    P.push([0, 0, 0, 0.26, 0.26, 0.22, "#c84a2a"]); // 망토
    P.push([0.02, 0, 0.02, 0.18, 0.2, 0.2, "#ff9a3a"]);
    P.push([0, 0, 0.24 + b, 0.34, 0.34, 0.34, "#ffd23f"]);
    for (let i = 0; i < 8; i++) {
      const ang = i / 8 * Math.PI * 2 + a.t * 0.8, rr = 0.25;
      P.push([Math.cos(ang) * rr * 0.4, Math.sin(ang) * rr, 0.41 + b + Math.cos(ang) * rr * 0.6, 0.06, 0.08, 0.08, "#ff9a2e", true]);
    }
    P.push([0.17, 0.09, 0.33 + b, 0.02, 0.06, 0.03, "#ff7a5a", true], [0.17, -0.09, 0.33 + b, 0.02, 0.06, 0.03, "#ff7a5a", true]); // 볼
    eyes(P, 0.172, 0.07, 0.4 + b, 0.06, "#4a2a10", a.stag);
    drawVoxelParts(m, P, { top: 0.85 });
  },
  // 달님: 은빛 초승달 얼굴 + 별 셋 + 남색 망토
  w3_moonTwin(m) {
    const a = bossMotion(m), P = [], b = 0.04 + Math.cos(a.t * 2) * 0.02;
    P.push([0, 0, 0, 0.26, 0.26, 0.22, "#3a3a7a"]);
    P.push([0.02, 0, 0.02, 0.18, 0.2, 0.2, "#5a5aa0"]);
    P.push([-0.02, 0, 0.24 + b, 0.3, 0.3, 0.32, "#d8d8f0"]);
    P.push([-0.08, -0.08, 0.26 + b, 0.26, 0.2, 0.3, "#b8b8d8"]); // 초승달 그늘
    for (let i = 0; i < 3; i++) { const ang = a.t * 1.2 + i * 2.1; P.push([Math.cos(ang) * 0.12, Math.sin(ang) * 0.3, 0.62 + b + Math.sin(ang * 2) * 0.03, 0.05, 0.05, 0.05, "#ffe27a", true]); }
    eyes(P, 0.142, 0.07, 0.38 + b, 0.055, "#2a2a5a", a.stag || (m.twinOf && m.twinOf.stagger > 0));
    drawVoxelParts(m, P, { top: 0.85 });
  },
  // 큰곰이: 남색 곰 + 등에 노란 별 7개(국자 모양) + 하얀 별 눈
  w3_starBear(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.9 : 1, up = a.raise * 0.1;
    const body = "#2a3a7a", dk = "#1e2a5a", lt = "#3e52a0";
    for (const sd of [1, -1]) { P.push([0.16 + a.walk * sd * 0.03, sd * 0.17, 0, 0.12, 0.12, 0.14, dk]); P.push([-0.18 - a.walk * sd * 0.03, sd * 0.17, 0, 0.12, 0.12, 0.14, dk]); }
    P.push([-0.02, 0, 0.12, 0.5, 0.42, 0.3 * sq, body]);
    P.push([0.08, 0, 0.14, 0.3, 0.32, 0.12, lt]);
    // 앞발 (들면 위로)
    for (const sd of [1, -1]) P.push([0.24, sd * 0.2, 0.16 + up * (sd > 0 ? 2 : 0.5), 0.1, 0.1, 0.14, dk]);
    P.push([0.26, 0, 0.32 * sq + up * 0.3, 0.24, 0.28, 0.22, body]); // 머리
    P.push([0.385, 0, 0.36 * sq + up * 0.3, 0.06, 0.12, 0.08, lt]); // 주둥이
    P.push([0.415, 0, 0.4 * sq + up * 0.3, 0.02, 0.05, 0.03, "#141c40"]);
    for (const sd of [1, -1]) P.push([0.22, sd * 0.11, 0.55 * sq + up * 0.3, 0.06, 0.06, 0.06, dk]); // 귀
    const dip = [[-0.24, -0.12], [-0.16, -0.05], [-0.08, 0.0], [0.0, 0.04], [0.02, 0.14], [-0.1, 0.17], [-0.12, 0.08]]; // 국자
    for (const [f, s] of dip) P.push([f, s, 0.42 * sq, 0.04, 0.04, 0.03, "#ffe27a", true]);
    eyes(P, 0.382, 0.075, 0.44 * sq + up * 0.3, 0.05, "#ffffff", a.stag);
    drawVoxelParts(m, P, { top: 0.75 });
  },
  // 은하: 은빛 드레스 + 보라 망토 + 머리 위 달(초승 → 반달 → 보름) + 지팡이 끝 별
  w3_moonQueen(m) {
    w3dLift(m, m.qFlyZ || 0, () => {
      const a = bossMotion(m), P = [], b = Math.sin(a.t * 2) * 0.015;
      P.push([0, 0, 0, 0.32, 0.32, 0.2, "#c8c8e0"]); // 드레스 아래
      P.push([0, 0, 0.18, 0.24, 0.24, 0.16, "#d8d8f0"]);
      P.push([-0.1, 0, 0.06, 0.12, 0.36, 0.32, "#6a5ab0"]); // 망토
      P.push([0.02, 0, 0.34 + b, 0.16, 0.16, 0.16, "#ffe0cc"]); // 얼굴
      P.push([0, 0, 0.48 + b, 0.18, 0.18, 0.05, "#e0d8ff"]); // 머리칼
      P.push([0.03, 0, 0.53 + b, 0.06, 0.12, 0.05, "#ffe27a", true]); // 작은 왕관
      eyes(P, 0.102, 0.04, 0.4 + b, 0.035, "#4a3a8a", a.stag);
      // 지팡이 + 별
      const st = a.raise * 0.12;
      P.push([0.12, 0.18, 0.08 + st, 0.03, 0.03, 0.5, "#e0c060"]);
      P.push([0.12, 0.18, 0.6 + st, 0.07, 0.07, 0.07, "#fff6c0", true]);
      // 달 모양: 단계 0 초승, 1 반달, 2 보름
      const ph = m.phaseIdx || 0, mz = 0.7 + b * 2;
      if (ph >= 2) P.push([0, 0, mz, 0.16, 0.16, 0.16, "#fff6c0", true]);
      else if (ph === 1) P.push([0, 0.04, mz, 0.16, 0.08, 0.16, "#fff6c0", true]);
      else { P.push([0, 0.06, mz, 0.14, 0.04, 0.16, "#fff6c0", true]); P.push([0, 0.03, mz + 0.12, 0.1, 0.03, 0.04, "#fff6c0", true]); P.push([0, 0.03, mz - 0.02, 0.1, 0.03, 0.04, "#fff6c0", true]); }
      drawVoxelParts(m, P, { top: 1.0 });
    });
    if ((m.qFlyZ || 0) > 0.2) { // 떠 있으면 바닥 그림자
      const c = toScreen(m.x, m.y, 0.01);
      ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(c.x, c.y, 26 * ZOOM, 12 * ZOOM, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  },
  // 빛 구슬 (되돌아가면 금색)
  w3_qOrbBall(m) {
    const z = 0.55 + Math.sin(game.time * 6 + m.x) * 0.05, c = toScreen(m.x, m.y, z);
    const r = 11 * ZOOM;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, r * 1.8);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.4, m.qBack ? "#ffd23f" : "#fff6c0"); g.addColorStop(1, "rgba(255,230,150,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  },
});
hookOn("lights", (lights) => { for (const o of monsters) if (o.type === "w3_qOrbBall" && o.hp > 0) lights.push({ x: o.x, y: o.y, radius: 1.4, power: 0.7 }); }, 62);

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w3_smStarDrop: { text: "그림자 사이로 걸어가요" },
  w3_smEclipseRing: { text: "겹친 둘 옆 금색 안으로!", do: true, voice: true },
  w3_bearPaw: { text: "원 밖으로! 그다음 공격" },
  w3_constellation: { text: "숫자 별을 1부터 순서대로 밟아요!", do: true, voice: true },
  w3_qOrb: { text: "빛 구슬을 쳐서 되돌려요!", do: true, voice: true },
  w3_moonGrab: { text: "계속 움직이다 빠져나가요" },
  w3_qLaser: { text: "넓은 빨간 줄 옆으로!" },
  w3_qStarfall: { text: "원 사이로 걸어가요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") Object.assign(GUIDE_PHASE_VOICE, {
  eclipse: { 0: "일식 때 겹친 해님 달님을 같이 때려요!", 1: "달님도 싸워요! 둘 다 때려도 체력은 하나예요", 2: "일식이 더 자주 와요!" },
  earthview: { 0: "숫자 별을 1부터 순서대로 밟아요!", 1: "광선을 따라 같이 돌아요", 2: "별 위는 안전해요! 별자리를 완성해요" },
  mooncastle: { 0: "빛 구슬을 쳐서 되돌려요!", 1: "몸이 가벼워요! 구르면 멀리 가요", 2: "별자리를 완성해서 여왕을 끌어내려요!" },
});
