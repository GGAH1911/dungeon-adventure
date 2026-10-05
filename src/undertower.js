// ===== 지하세계: 지하 탑 (65층) (설계서 docs/design/world4-underworld.md 7장) =====
// 달빛 탑(moontower.js)과 같은 틀: 둥근 아레나 웨이브 → 계단. 5층마다 지하 보스(탑 버전: 정예 속성 하나), 60층 부글대왕, 65층 "용암왕 이글이".
// 보스가 아닌 층에는 지하 환경이 하나씩 (under_env.js 가 world.w4 를 보고 움직여요): 1 빛 수정+어둠, 2 버섯 패드, 3 종유석, 4 용암 띠+다리
//   (층 번호로 정해져서 같이 하기에서도 같아요). 지하 보스들은 w4BossNow() 로 보스방·탑 보스 층을 똑같이 찾아서 탑에서도 기믹이 그대로 돌아요.
// 튼튼하게: 지하 보스·몬스터·기술이 아직 없으면 비슷한 달·바다 것으로 바꿔 끼워 탑이 깨지지 않아요.

const UNDER_TOWER_POOLS = [
  { upTo: 4, monsters: ["w4_glowbug", "w4_mole", "w4_batling", "spider"] },
  { upTo: 9, monsters: ["w4_mole", "w4_shroomling", "w4_batling", "w4_rockcrab"] },
  { upTo: 14, monsters: ["w4_goblinMiner", "w4_rockcrab", "w4_crystalbug", "w4_shroomling"] },
  { upTo: 19, monsters: ["w4_batling", "w4_crystalbug", "w4_imp", "w4_rockcrab", "w4_glowbug"] },
  { upTo: 24, monsters: ["w4_imp", "w4_lavaslug", "w4_crystalbug", "w4_goblinMiner", "w4_mole"] },
  { upTo: 29, monsters: ["w4_lavaslug", "w4_stoneguard", "w4_imp", "w4_batling", "w4_rockcrab"] },
  { upTo: 39, monsters: ["w4_stoneguard", "w4_dokkaebiKid", "w4_lavaslug", "w4_crystalbug", "w4_imp", "w4_goblinMiner"] },
  { upTo: 49, monsters: ["w4_dokkaebiKid", "w4_stoneguard", "w4_imp", "w4_lavaslug", "w4_crystalbug", "w4_batling", "w4_shroomling"] },
  { upTo: 65, monsters: ["w4_dokkaebiKid", "w4_stoneguard", "w4_lavaslug", "w4_imp", "w4_crystalbug", "w4_goblinMiner", "w4_rockcrab", "w4_mole"] },
];
const UNDER_TOWER_POOL_FALLBACK = ["w3_robot", "w3_rockling", "w3_alien", "w2_turtle", "w2_urchin", "crab", "golem"];
const UNDER_TOWER_BOSSES = {
  5: ["glowcave", "shroomwood"], 10: ["cartmine", "dripcave"], 15: ["undriver", "crystalhall"],
  20: ["lavaflow", "crumble"], 25: ["ruins", "forge"], 30: ["goblintown"],
  35: ["glowcave", "shroomwood", "cartmine"], 40: ["dripcave", "undriver", "crystalhall"],
  45: ["lavaflow", "crumble", "ruins"], 50: ["forge", "goblintown"], 55: ["crystalhall", "forge", "goblintown"],
  60: ["underthrone"], 65: ["undertower"],
};
const UNDER_TOWER_BOSS_FALLBACK = ["moonbase", "dustsea", "craterfield", "rabbitvale", "crystalcave", "meteorhill", "ufowreck", "darkside", "cheesevale", "starmine", "lunarlab", "eclipse", "earthview", "mooncastle", "shallows", "abyss"];

function underTowerPools() {
  return UNDER_TOWER_POOLS.map((p) => {
    const ok = p.monsters.filter((id) => MONSTERS[id] && !MONSTERS[id].w4Placeholder);
    return { upTo: p.upTo, monsters: ok.length ? ok : UNDER_TOWER_POOL_FALLBACK.filter((id) => MONSTERS[id]) };
  });
}
function underTowerBossPools() {
  const out = {};
  const back = UNDER_TOWER_BOSS_FALLBACK.filter((id) => BOSS_DEFS[id]);
  for (const [f, pool] of Object.entries(UNDER_TOWER_BOSSES)) {
    const ok = pool.filter((id) => TOWER_MASTERS[id] || BOSS_DEFS[id]);
    if (ok.length) out[f] = ok;
    else if (back.length) out[f] = [back[Math.min(back.length - 1, Math.floor((Number(f) / 65) * back.length))]];
  }
  return out;
}

const UNDER_TOWER = {
  id: "undertower", type: "tower", world: 4, name: "지하 탑", desc: "땅속 깊이 이어진 65층 탑! 5층마다 지하 보스, 65층엔 용암왕",
  minLevel: 85, floors: 65, reward: 180, unlockAfter: "glowcave",
  size: 22, count: 0, monsters: {},
  theme: { floor: "#5a4a40", moss: "#ffb04a", wall: "#3a2c26", darkness: 0.45, bg: "#0c0604" },
  get pools() { return underTowerPools(); },
  get bossPools() { return underTowerBossPools(); },
  bossAffixes: ["fireTrail", "fast", "vampiric", "lightning", "deathNova", "shielding"],
  levelStep: 0.35, // 65층이면 +22
  maxWave: 22,
  floorThemes: [
    { floor: "#4a4036", moss: "#7fe0c0", wall: "#2e2620", darkness: 0.5, bg: "#08060a" },  // 반딧불 동굴
    { floor: "#5a4a5a", moss: "#ff9ad6", wall: "#3a2e3e", darkness: 0.38, bg: "#140a16" }, // 버섯 숲
    { floor: "#3a3458", moss: "#b08aff", wall: "#241e3a", darkness: 0.55, bg: "#06040e" }, // 수정 궁전
    { floor: "#4a3a34", moss: "#ffb04a", wall: "#2e2220", darkness: 0.42, bg: "#140604" }, // 용암 강
    { floor: "#8a8270", moss: "#a8c890", wall: "#5a5444", darkness: 0.45, bg: "#0c0c08" }, // 옛 유적
  ],
};
// 정예 속성 이름이 없는 것은 빼요 (튼튼하게)
if (typeof ELITE_AFFIXES !== "undefined") UNDER_TOWER.bossAffixes = UNDER_TOWER.bossAffixes.filter((id) => ELITE_AFFIXES[id]);
MAPS.push(UNDER_TOWER);
if (typeof WORLD_PLACES !== "undefined") WORLD_PLACES.undertower = { x: 2140, y: 900 };

// ----- 보스가 아닌 층의 지하 환경 (w4_common.js 의 w4Add*, 7-1) -----
hookOn("towerFloorBuilt", (f, def) => {
  if (def !== UNDER_TOWER || towerBossAt(f)) return;
  world.w4 = null; w4Env(world); // 같은 층을 다시 만들면(친구 기기가 층 소식을 두 번 받는 등) 두 번 놓이지 않게 새로
  const c = world.W / 2;
  const free = (x, y, r = 0.7) => !hitsWall(x, y, r) && Math.hypot(x - (c - 6), y - (c - 6)) > 2.2 && Math.hypot(x - (c + 2.5), y - (c + 2.5)) > 1.6; // 계단·시작 자리 비우기
  const at = (pts, r) => pts.filter(([dx, dy]) => free(c + dx, c + dy, r)).map(([dx, dy]) => ({ x: c + dx, y: c + dy }));
  const kind = f % 5; // 1 빛 수정+어둠, 2 버섯 패드, 3 종유석, 4 용암 띠+다리 (0 은 보스 층)
  // 자리가 막히면(층마다 바뀌는 기둥) 다음 후보로 (층 번호로 정해진 아레나라 두 기기 같아요)
  const more = [[5, 4], [-4, 5], [4, -5], [-5, -3], [0, 6], [6, 0], [-6, 1], [1, -6]];
  if (kind === 1) { for (const s of at([[-5, 2], [5, -2], [2, 5], [-2, -5], ...more], 0.6).slice(0, 4)) w4AddCrystal(world, s.x, s.y); world.theme = { ...world.theme, darkness: Math.max(world.theme.darkness || 0, 0.6) }; }
  if (kind === 2) for (const s of at([[-4, 0], [4, 0], [0, 4], ...more], 0.7).slice(0, 3)) { const dx = c - s.x, dy = c - s.y; w4AddShroom(world, s.x, s.y, dx, dy); }
  if (kind === 3) at([[-4, 3], [4, -3], [3, 4], [-3, -4], ...more], 0.7).slice(0, 4).forEach((s, i) => w4AddDrip(world, s.x, s.y, 7, (i * 7) / 4));
  if (kind === 4) {
    const vert = Math.floor(f / 5) % 2 === 1; // 층 묶음마다 세로/가로
    if (vert) w4AddLava(world, { x0: c - 1, y0: c - 7, x1: c + 1, y1: c + 7 }, [{ x0: c - 1, y0: c - 1, x1: c + 1, y1: c + 1 }]);
    else w4AddLava(world, { x0: c - 7, y0: c - 1, x1: c + 7, y1: c + 1 }, [{ x0: c - 1, y0: c - 1, x1: c + 1, y1: c + 1 }]);
  }
}, 50);

// ----- 65층: 지하 탑의 주인 용암왕 이글이 (7-2) -----
// 새 기술: 용암 차오름. 아레나 가장자리부터 고리 모양 예고 3번이 안쪽으로 차올라요 (각 1.5초). 가운데(r4)는 안전.
ABILITIES.w4_utMagmaRise = { name: "용암 차오름", desc: "아레나 가장자리부터 용암 고리가 세 번 안쪽으로 차올라요. 가운데는 안전해요.", counter: "주황 고리를 보고 가운데로 걸어가요",
  tags: ["boss", "ring", "area"], telegraph: { shape: "ring", radius: 13, inner: 10, at: "fixed", time: 1.5 }, // at "fixed": 만든 자리 그대로 (castStarted 가 아레나 가운데로 옮겨요)
  cooldown: 16, range: [0, 40], damageMul: 1.2, anim: "roar", effect: { type: "damage" } };
// 예고 고리는 아레나 가운데 (용암왕 자리가 아니라)
hookOn("castStarted", (m, id) => {
  if (id !== "w4_utMagmaRise" || !m) return;
  const c = casts.find((q) => q.m === m && q.id === id && !q.utDone); if (!c) return;
  c.x = world.W / 2; c.y = world.H / 2; c.utRing = 0; c.utDone = true;
}, 50);
// 한 고리가 끝나면 한 칸 안쪽 다음 고리 (쉬움은 2번)
hookOn("castResolved", (c) => {
  if (!c || c.id !== "w4_utMagmaRise" || c.utNexted) return;
  c.utNexted = true;
  const n = (c.utRing || 0) + 1, max = w4fDiff() === "easy" ? 2 : 3;
  if (n >= max || !c.m || c.m.hp <= 0) return;
  const ab = ABILITIES.w4_utMagmaRise, tune = typeof abilityTuning === "function" ? abilityTuning() : { telegraph: 1, damage: 1 };
  const nc = makeCast(c.m, { ...ab, telegraph: { ...ab.telegraph, radius: 13 - n * 3, inner: 10 - n * 3 } }, "w4_utMagmaRise", { x: c.x, y: c.y }, ab.telegraph.time * tune.telegraph, tune);
  if (!nc) return;
  nc.x = c.x; nc.y = c.y; nc.utRing = n; nc.utDone = true;
  casts.push(nc);
}, 50);

const UNDER_MASTER_WANT = [
  { until: 0.66, abilities: ["w4_cgSmash", "w4_slFire", "w4_akCharge", "shockRing"] },
  { until: 0.33, abilities: ["w4_ukDrips", "w4_fgHammer", "w4_cgBeam", "w4_dkCoins", "blink"] },
  { abilities: ["b2_doomBlast", "w4_utMagmaRise", "w4_bkScreech", "trackingStrike", "b2_clones", "enrage"] },
];
const UNDER_MASTER_SUB = { w4_cgSmash: "slam", w4_slFire: "fireBreath", w4_akCharge: "charge", w4_ukDrips: "meteorRain", w4_fgHammer: "meteorRain", w4_cgBeam: "beam", w4_dkCoins: "meteorRain", w4_bkScreech: "repelBlast" };
function underMasterPhases() {
  return UNDER_MASTER_WANT.map((ph) => {
    const list = [];
    for (const id of ph.abilities) {
      let use = ABILITIES[id] ? id : UNDER_MASTER_SUB[id];
      if (!use || !ABILITIES[use]) use = ["shockRing", "nova", "slam"].find((x) => ABILITIES[x]);
      if (use && !list.includes(use)) list.push(use);
    }
    return ph.until !== undefined ? { until: ph.until, abilities: list } : { abilities: list };
  });
}
Object.assign(MONSTERS, {
  underTowerMaster: { color: "#8a5a3a", name: "용암왕 이글이", shape: "underTowerKing", behavior: "b2_boss", hp: 340, speed: 1.5, damage: 1.3, xp: 140, emerald: 1, emeraldCount: 30, attackRange: 2.2, attackCooldown: 1.8, world: 4,
    phases: underMasterPhases() },
});
// 모양: 용암 돌 거인(갈색 돌 몸 + 주황 금 틈), 수정 왕관, 불 갈기, 큰 눈, 돌 홀
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.underTowerKing = (m) => {
  const P = b2Pose(m), stone = "#6a4a3a", dark = "#4a3228", crack = "#ff9a3a", crown = "#b08aff", ice = "#9fe8ff";
  const raise = P.cast, fist = P.strike, fl = Math.sin(game.time * 8 + (m.seed || 0)) * 0.06;
  const parts = [
    { f: 0.05, s: 0.26, z: 0, w: 0.34, d: 0.32, h: 0.5, c: dark }, { f: 0.05, s: -0.26, z: 0, w: 0.34, d: 0.32, h: 0.5, c: dark },
    { f: 0, s: 0, z: 0.48 + P.breath, w: 0.9, d: 0.95, h: 0.85, c: stone },
    { f: 0.46, s: 0.1, z: 0.6 + P.breath, w: 0.02, d: 0.08, h: 0.5, c: crack }, { f: 0.46, s: -0.2, z: 0.7 + P.breath, w: 0.02, d: 0.06, h: 0.3, c: crack },
    { f: 0.05, s: 0.6, z: 0.8 + raise * 0.6 - fist * 0.2, w: 0.34, d: 0.3, h: 0.5, c: stone }, { f: 0.1 + fist * 0.35, s: -0.6, z: 0.8 + raise * 0.6 - fist * 0.2, w: 0.34, d: 0.3, h: 0.5, c: stone },
    { f: 0.2 + fist * 0.35, s: -0.66, z: 1.2 + raise * 0.6, w: 0.08, d: 0.08, h: 0.7, c: dark }, { f: 0.2 + fist * 0.35, s: -0.66, z: 1.9 + raise * 0.6, w: 0.16, d: 0.16, h: 0.16, c: crack },
    { f: -0.25, s: 0, z: 1.4 + fl, w: 0.2, d: 0.7, h: 0.3, c: "#ffb04a" }, { f: -0.32, s: 0, z: 1.66 + fl, w: 0.14, d: 0.5, h: 0.2, c: "#ffe27a" },
    { f: 0.1, s: 0, z: 1.33 + P.breath, w: 0.62, d: 0.62, h: 0.5, c: stone, face: true, eye: "#ffffff", pupil: "#ffd23f" },
    { f: 0.1, s: 0, z: 1.84 + P.breath, w: 0.5, d: 0.5, h: 0.08, c: crown },
    { f: 0.1, s: 0.18, z: 1.92 + P.breath, w: 0.08, d: 0.08, h: 0.16, c: ice }, { f: 0.1, s: -0.18, z: 1.92 + P.breath, w: 0.08, d: 0.08, h: 0.16, c: ice }, { f: 0.1, s: 0, z: 1.92 + P.breath, w: 0.1, d: 0.1, h: 0.22, c: crown },
  ];
  b2DrawBody(m, parts, { top: 2.2 });
};
const UNDER_TOWER_MASTER_DEF = {
  id: "underTowerMaster", name: "용암왕 이글이", title: "지하 탑 꼭대기", size: 3.6,
  arena: { size: 28, theme: { floor: "#4a3a34", moss: "#ffb04a", wall: "#2e2220", darkness: 0.45, bg: "#100402" },
    build: (w) => {
      const c = w.W / 2;
      b2Pillars(w, [[-5, -5], [5, 5], [-5, 5], [5, -5]]);
      w4AddLava(w, { x0: c - 12, y0: c - 1, x1: c - 9, y1: c + 1 }); w4AddLava(w, { x0: c + 9, y0: c - 1, x1: c + 12, y1: c + 1 });
      w4AddCrystal(w, c, c - 8); w4AddCrystal(w, c, c + 8);
    } },
  create: (x, y, level) => {
    MONSTERS.underTowerMaster.phases = underMasterPhases(); // 늦게 온 지하 기술도 쓰게 (없으면 대신 기술)
    UNDER_TOWER_MASTER_DEF.phases = MONSTERS.underTowerMaster.phases;
    return b2MakeBoss("underTowerMaster", x, y, level, 3.6);
  },
  reward: underTowerReward,
};
UNDER_TOWER_MASTER_DEF.phases = MONSTERS.underTowerMaster.phases;
TOWER_MASTERS.undertower = UNDER_TOWER_MASTER_DEF;

// ----- 보상 (7-3) -----
defBase("L_underTower", { slot: "charm", legend: "undertower", name: "지하 탑의 용암 왕관", minL: 0, icon: "crown", color: "#ffb04a", perk: { hearts: 4, dmg: 0.12, speed: 0.05 }, desc: "용암왕을 물리친 증표: 하트·공격력·빠르기가 모두 올라요" });
BOSS_LEGENDS.undertower = "L_underTower";
function underTowerCrowns() { return typeof towerCrownCount === "function" ? towerCrownCount("undertower") : ((game.profile.crowns || {}).undertower || 0); }
function underTowerReward(L) {
  const got = [];
  const first = !underTowerCrowns();
  recShared("crown", { id: "undertower" }); // 정복 기록 (같이 하기: 친구도, records.js pr.crowns)
  curAdd("gold", 5 + coinCount(2));
  curAdd("diamond", first ? 4 : Math.random() < 0.6 ? 1 : 0);
  if (first || Math.random() < 0.25) { const it = makeLegend("undertower", L); if (it) { giveItem(it); got.push(it); } }
  showMessage(first ? "지하 탑 정복! 용암 왕관을 받았어요!" : "용암왕을 또 물리쳤어요!", 4, true);
  return got;
}

// ----- 버섯 등불 마을: 65층을 깨면 용암 왕관 탑 트로피 -----
const UNDER_TOWER_TROPHY = { x: 4.2, y: 11.4, placed: false };
function underTowerTrophySpot() { return typeof houseSpot === "function" ? houseSpot("crown4") : UNDER_TOWER_TROPHY; } // 집 안 탑 트로피 자리 (house.js)
hookOn("lobbyThings", (things) => {
  if (!underTowerCrowns()) return;
  const s = underTowerTrophySpot();
  things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
    drawBox(s.x - 0.32, s.y - 0.32, 0, 0.64, 0.64, 0.18, "#4a3a30");
    for (let i = 0; i < 4; i++) { const w = 0.42 - i * 0.08; drawBox(s.x - w / 2, s.y - w / 2, 0.18 + i * 0.28, w, w, 0.28, i % 2 ? "#ffb04a" : "#8a5ab8"); }
    drawBox(s.x - 0.08, s.y - 0.08, 1.3, 0.16, 0.16, 0.2, "#9fe8ff");
    if (Math.sin(game.time * 3 + 1) > 0.7) { const c = toScreen(s.x, s.y, 1.7); drawStar(c.x, c.y, 8 * ZOOM, "#ffe27a"); }
  } });
}, 65);
hookOn("lobbyInteractables", (list) => {
  if (!underTowerCrowns()) return list;
  const s = underTowerTrophySpot();
  list.push({ x: s.x, y: s.y, range: 1.4, label: "지하 탑 트로피", short: "보기", prompt: "지하 탑 정복 트로피", action: () => showMessage(`지하 탑 정복 ${underTowerCrowns()}번! 최고 ${towerBestOf(UNDER_TOWER)}층`, 3, true) });
  return list;
}, 65);

// ----- 지하 지도 그림: 용암 탑 -----
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (m.id !== "undertower") return false;
  const g = ctx, C = (c) => (typeof greyish === "function" ? greyish(c, locked) : c);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(20,8,4,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  rect(-11, -50, 22, 54, C("#6a4a3a")); rect(-14, -55, 28, 6, C("#8a5ab8"));
  rect(-3, -40, 6, 8, C("#ff9a3a")); rect(-3, -22, 6, 8, C("#ff9a3a"));
  rect(-4, -64, 8, 9, C("#9fe8ff"));
  return true;
}, 40);

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, { w4_utMagmaRise: { text: "주황 고리! 가운데로 걸어가요" } });
