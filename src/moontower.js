// ===== 달: 달빛 탑 (60층) (설계서 docs/design/world3-moon.md 7장) =====
// 심해 탑(seatower.js)과 같은 틀: 둥근 아레나 웨이브 → 계단. 5층마다 달 보스(탑 버전: 정예 속성 하나), 55층 달의 여왕, 60층엔 "은하 용 미르".
// 보스가 아닌 층에는 달 환경이 하나씩 (moon_env.js 가 world.w3 를 보고 움직여요): 1 낮은 중력, 2 달먼지, 3 크레이터, 4 별똥별
//   (층 번호로 정해져서 같이 하기에서도 같아요). 달 보스들은 w3BossNow() 로 보스방·탑 보스 층을 똑같이 찾아서 탑에서도 기믹이 그대로 돌아요.
// 튼튼하게: 달 보스·달 몬스터·달 기술이 아직 없으면(다른 파일이 늦게 오거나 빠져도) 비슷한 바다 것으로 바꿔 끼워 탑이 깨지지 않아요.

// 층마다 나오는 몬스터 (없는 몬스터는 빼고, 다 없으면 바다 몬스터로)
const MOON_TOWER_POOLS = [
  { upTo: 4, monsters: ["w3_robot", "w3_dustBall", "w3_rockling", "w3_moonBunny"] },
  { upTo: 9, monsters: ["w3_robot", "w3_dustBall", "w3_rockling", "w3_moonBunny", "w3_alien"] },
  { upTo: 14, monsters: ["w3_crystalBug", "w3_starWisp", "w3_rockling", "w3_alien", "w3_moonBunny"] },
  { upTo: 19, monsters: ["w3_crystalBug", "w3_starWisp", "w3_gearSpider", "w3_ufo", "w3_robot"] },
  { upTo: 24, monsters: ["w3_alien", "w3_ufo", "w3_gearSpider", "w3_shadowWolf", "w3_rockling"] },
  { upTo: 29, monsters: ["w3_shadowWolf", "w3_moonRat", "w3_dustBall", "w3_ufo", "w3_crystalBug"] },
  { upTo: 39, monsters: ["w3_moonRat", "w3_robot", "w3_gearSpider", "w3_shadowWolf", "w3_starWisp", "w3_alien"] },
  { upTo: 49, monsters: ["w3_shadowWolf", "w3_ufo", "w3_gearSpider", "w3_moonRat", "w3_crystalBug", "w3_robot", "w3_moonBunny"] },
  { upTo: 60, monsters: ["w3_shadowWolf", "w3_ufo", "w3_gearSpider", "w3_moonRat", "w3_crystalBug", "w3_robot", "w3_alien", "w3_starWisp"] },
];
const MOON_TOWER_POOL_FALLBACK = ["w2_turtle", "w2_urchin", "w2_seahorse", "w2_octo", "w2_sharkling", "crab"];
// 보스 층 (들어갈 때마다 하나 골라요). 40~50층은 앞 보스 중에서 다시, 55층 달의 여왕, 60층 미르
const MOON_TOWER_BOSSES = {
  5: ["moonbase", "dustsea"], 10: ["craterfield", "rabbitvale"], 15: ["crystalcave", "meteorhill"],
  20: ["ufowreck", "darkside"], 25: ["cheesevale", "starmine"], 30: ["lunarlab", "eclipse"], 35: ["earthview"],
  40: ["moonbase", "dustsea", "craterfield", "rabbitvale"], 45: ["crystalcave", "meteorhill", "ufowreck", "darkside"],
  50: ["cheesevale", "starmine", "lunarlab", "eclipse", "earthview"], 55: ["mooncastle"], 60: ["moontower"],
};
// 달 보스가 아직 없을 때 대신 나올 바다 보스 (층이 높을수록 센 보스)
const MOON_TOWER_BOSS_FALLBACK = ["shallows", "kelp", "wreck", "icefloe", "songreef", "trench", "sharkreef", "vents", "sunken", "abyss"];

function moonTowerPools() {
  return MOON_TOWER_POOLS.map((p) => {
    const ok = p.monsters.filter((id) => MONSTERS[id]);
    return { upTo: p.upTo, monsters: ok.length ? ok : MOON_TOWER_POOL_FALLBACK.filter((id) => MONSTERS[id]) };
  });
}
function moonTowerBossPools() {
  const out = {};
  const back = MOON_TOWER_BOSS_FALLBACK.filter((id) => BOSS_DEFS[id]);
  for (const [f, pool] of Object.entries(MOON_TOWER_BOSSES)) {
    const ok = pool.filter((id) => TOWER_MASTERS[id] || BOSS_DEFS[id]);
    if (ok.length) out[f] = ok;
    else if (back.length) out[f] = [back[Math.min(back.length - 1, Math.floor((Number(f) / 60) * back.length))]];
  }
  return out;
}

const MOON_TOWER = {
  id: "moontower", type: "tower", world: 3, name: "달빛 탑", desc: "달 위로 솟은 60층 탑! 5층마다 달 보스, 60층엔 은하 용 미르",
  minLevel: 55, floors: 60, reward: 160, unlockAfter: "moonbase",
  size: 22, count: 0, monsters: {},
  theme: { floor: "#a8a8bc", moss: "#d0d0e8", wall: "#5a5a74", darkness: 0.4, bg: "#04040c" },
  // 몬스터·보스 목록은 읽을 때 지금 있는 것만 골라요 (tower.js 가 pools·bossPools 를 읽어요)
  get pools() { return moonTowerPools(); },
  get bossPools() { return moonTowerBossPools(); },
  bossAffixes: ["fireTrail", "fast", "vampiric", "lightning", "deathNova"],
  levelStep: 0.35, // 60층이면 +20
  maxWave: 22,
  floorThemes: [
    { floor: "#b8b8c4", moss: "#d0d4e4", wall: "#6a6a80", darkness: 0.3, bg: "#05060f" },  // 기지
    { floor: "#a8a49a", moss: "#c8c0ae", wall: "#5e5a52", darkness: 0.32, bg: "#06060a" }, // 먼지
    { floor: "#3a3a5a", moss: "#9fe8ff", wall: "#24243e", darkness: 0.6, bg: "#020208" },  // 수정
    { floor: "#8a7a88", moss: "#ffb87a", wall: "#4e4250", darkness: 0.38, bg: "#0c0610" }, // 별똥별
    { floor: "#c8c8dc", moss: "#e0d8ff", wall: "#6a6890", darkness: 0.45, bg: "#04030c" }, // 궁전
  ],
};
MAPS.push(MOON_TOWER);
if (typeof WORLD_PLACES !== "undefined") WORLD_PLACES.moontower = { x: 380, y: 820 };

// ----- 보스가 아닌 층의 달 환경 (w3_common.js 의 w3Add*) -----
hookOn("towerFloorBuilt", (f, def) => {
  if (def !== MOON_TOWER || towerBossAt(f)) return;
  w3EnsureEnv(world);
  const c = world.W / 2, N = world.W;
  const free = (x, y, r = 0.7) => !hitsWall(x, y, r) && Math.hypot(x - (c - 6), y - (c - 6)) > 2.2 && Math.hypot(x - (c + 2.5), y - (c + 2.5)) > 1.6; // 계단·시작 자리 비우기
  const at = (pts, r) => pts.filter(([dx, dy]) => free(c + dx, c + dy, r)).map(([dx, dy]) => ({ x: c + dx, y: c + dy }));
  const kind = f % 5; // 1 낮은 중력, 2 달먼지, 3 크레이터, 4 별똥별 (0 은 보스 층)
  if (kind === 1) w3AddLowGrav(2, 2, N - 2, N - 2, world); // 아레나 전체
  if (kind === 2) for (const s of at([[-6, 2], [6, -2], [2, 6], [-2, -6], [5, 4], [-4, 5], [4, -5]], 0.9).slice(0, 4)) w3AddDust(s.x, s.y, 2.0, world); // 가장자리 4곳
  if (kind === 3) w3AddCrater(c, c, 3.0, world); // 가운데 하나
  if (kind === 4) at([[-4, 3], [4, -3], [3, 4], [-3, -4], [0, 4], [4, 0], [-4, 0], [0, -4], [2, -5], [-5, 2], [5, 2]], 0.8).slice(0, 3).forEach((s, i) => w3AddMeteor(s.x, s.y, 6.5, (i * 6.5) / 3, world));
}, 50);

// ----- 60층: 달빛 탑의 주인 은하 용 미르 -----
// 바라는 기술 (달 보스 파일들이 만들어요). 없으면 같은 자리의 대신 기술로 (탑이 깨지지 않게)
const MOON_MASTER_WANT = [
  { until: 0.66, abilities: ["w3_botLaser", "w3_starfall", "w3_ballRoll", "shockRing"] },
  { until: 0.33, abilities: ["w3_ufoBeam", "w3_lightOrb", "b2_spinBeams", "w3_mochiBeat", "blink"] },
  { abilities: ["b2_doomBlast", "w3_constellation", "w3_meteor", "trackingStrike", "b2_clones", "enrage"] },
];
const MOON_MASTER_SUB = { w3_botLaser: "b2_spinBeams", w3_starfall: "meteorRain", w3_ballRoll: "charge", w3_ufoBeam: "trackingStrike", w3_lightOrb: "b2_soulOrbs", w3_mochiBeat: "slam", w3_constellation: "nova", w3_meteor: "meteorRain" };
// 별자리(w3_constellation)는 아레나 별이 있어야 해요: 별을 놓는 함수(w3PlaceStarPads, 큰곰이 파일)가 없으면 대신 기술로
function moonMasterAbilityOk(id) {
  if (!ABILITIES[id]) return false;
  if (id === "w3_constellation" && typeof w3PlaceStarPads !== "function") return false;
  return true;
}
function moonMasterPhases() {
  return MOON_MASTER_WANT.map((ph) => {
    const list = [];
    for (const id of ph.abilities) {
      let use = moonMasterAbilityOk(id) ? id : MOON_MASTER_SUB[id];
      if (!use || !ABILITIES[use]) use = ["shockRing", "nova", "slam"].find((x) => ABILITIES[x]);
      if (use && !list.includes(use)) list.push(use);
    }
    return ph.until !== undefined ? { until: ph.until, abilities: list } : { abilities: list };
  });
}
Object.assign(MONSTERS, {
  moonTowerMaster: { color: "#c8c8dc", name: "은하 용 미르", shape: "moonDragon", behavior: "b2_boss", hp: 320, speed: 1.5, damage: 1.25, xp: 125, emerald: 1, emeraldCount: 26, attackRange: 2.2, attackCooldown: 1.8, world: 3,
    phases: moonMasterPhases() },
});
// 모양: 은빛 용 몸 + 보라 갈기 + 별 점 꼬리 + 금빛 뿔
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.moonDragon = (m) => {
  const P = b2Pose(m), silver = "#c8c8dc", dark = "#8a8aa8", mane = "#8a6ad8", gold = "#ffe27a", star = "#fff6c0", belly = "#e8e8f4";
  const raise = P.cast, fist = P.strike, sway = Math.sin(game.time * 2 + (m.seed || 0)) * 0.08;
  const parts = [
    // 다리
    { f: 0.2, s: 0.34, z: 0, w: 0.3, d: 0.3, h: 0.42, c: dark }, { f: 0.2, s: -0.34, z: 0, w: 0.3, d: 0.3, h: 0.42, c: dark },
    { f: -0.3, s: 0.34, z: 0, w: 0.3, d: 0.3, h: 0.42, c: dark }, { f: -0.3, s: -0.34, z: 0, w: 0.3, d: 0.3, h: 0.42, c: dark },
    // 몸·배
    { f: 0, s: 0, z: 0.4 + P.breath, w: 1.1, d: 0.85, h: 0.7, c: silver },
    { f: 0.05, s: 0, z: 0.36 + P.breath, w: 0.9, d: 0.6, h: 0.12, c: belly },
    // 꼬리 (별 점)
    { f: -0.7, s: sway, z: 0.55, w: 0.4, d: 0.34, h: 0.3, c: silver }, { f: -1.0, s: sway * 1.6, z: 0.6, w: 0.32, d: 0.26, h: 0.24, c: dark },
    { f: -1.25, s: sway * 2.2, z: 0.66, w: 0.22, d: 0.2, h: 0.2, c: silver },
    { f: -0.72, s: sway, z: 0.86, w: 0.08, d: 0.08, h: 0.08, c: star }, { f: -1.02, s: sway * 1.6, z: 0.85, w: 0.08, d: 0.08, h: 0.08, c: star }, { f: -1.27, s: sway * 2.2, z: 0.87, w: 0.08, d: 0.08, h: 0.08, c: star },
    // 날개 (기술 쓸 때 들어요)
    { f: -0.1, s: 0.6, z: 0.9 + raise * 0.5, w: 0.5, d: 0.5, h: 0.08, c: mane }, { f: -0.1, s: -0.6, z: 0.9 + raise * 0.5, w: 0.5, d: 0.5, h: 0.08, c: mane },
    // 앞발 (내려찍기)
    { f: 0.5 + fist * 0.35, s: 0.4, z: 0.3 + raise * 0.6 - fist * 0.2, w: 0.28, d: 0.28, h: 0.28, c: dark }, { f: 0.5 + fist * 0.35, s: -0.4, z: 0.3 + raise * 0.6 - fist * 0.2, w: 0.28, d: 0.28, h: 0.28, c: dark },
    // 목·머리·갈기
    { f: 0.5, s: 0, z: 0.85 + P.breath, w: 0.34, d: 0.34, h: 0.4, c: silver },
    { f: -0.0, s: 0, z: 1.1 + P.breath, w: 0.7, d: 0.3, h: 0.16, c: mane }, { f: 0.36, s: 0, z: 1.16 + P.breath, w: 0.26, d: 0.36, h: 0.22, c: mane },
    { f: 0.66, s: 0, z: 1.18 + P.breath, w: 0.56, d: 0.5, h: 0.44, c: silver, face: true, eye: "#ffffff", pupil: "#8a6ad8" },
    { f: 0.98, s: 0, z: 1.2 + P.breath, w: 0.18, d: 0.32, h: 0.2, c: belly }, // 주둥이
    { f: 0.6, s: 0.16, z: 1.62 + P.breath, w: 0.08, d: 0.08, h: 0.26, c: gold }, { f: 0.6, s: -0.16, z: 1.62 + P.breath, w: 0.08, d: 0.08, h: 0.26, c: gold },
    { f: 0.6, s: 0, z: 1.66 + P.breath, w: 0.1, d: 0.1, h: 0.1, c: star },
  ];
  b2DrawBody(m, parts, { top: 2.0 });
};
const MOON_TOWER_MASTER_DEF = {
  id: "moonTowerMaster", name: "은하 용 미르", title: "달빛 탑 꼭대기", size: 3.4,
  arena: { size: 28, theme: { floor: "#c8c8dc", moss: "#e0d8ff", wall: "#6a6890", darkness: 0.42, bg: "#04030c" },
    build: (w) => {
      b2Pillars(w, [[-4, -4], [4, 4], [-4, 4], [4, -4], [0, -7], [0, 7]]);
      const c = w.W / 2;
      w3AddPad(c - 9, c + 2, 1, 0, w); w3AddPad(c + 9, c - 2, -1, 0, w); // 가장자리 점프대 2
      if (typeof w3PlaceStarPads === "function") w3PlaceStarPads(w, 5); // 별자리 별 5 (큰곰이 파일)
    } },
  create: (x, y, level) => {
    MONSTERS.moonTowerMaster.phases = moonMasterPhases(); // 늦게 온 달 기술도 쓰게 (없으면 대신 기술)
    MOON_TOWER_MASTER_DEF.phases = MONSTERS.moonTowerMaster.phases;
    return b2MakeBoss("moonTowerMaster", x, y, level, 3.4);
  },
  reward: moonTowerReward,
};
MOON_TOWER_MASTER_DEF.phases = MONSTERS.moonTowerMaster.phases;
TOWER_MASTERS.moontower = MOON_TOWER_MASTER_DEF;

// ----- 보상: 60층을 처음 깨면 "달빛 탑의 은하 왕관" + 금·다이아, 그 뒤에는 25% 왕관 -----
defBase("L_moonTower", { slot: "charm", legend: "moontower", name: "달빛 탑의 은하 왕관", minL: 0, icon: "crown", color: "#e0d8ff", perk: { hearts: 3, dmg: 0.12, speed: 0.06 }, desc: "은하 용 미르를 물리친 증표: 하트·공격력·빠르기가 모두 올라요" });
BOSS_LEGENDS.moontower = "L_moonTower";
function moonTowerReward(L) {
  const got = [];
  const first = !towerCrownCount("moontower");
  recShared("crown", { id: "moontower" }); // 정복 기록 (같이 하기: 친구도, records.js)
  curAdd("gold", 5 + coinCount(2));
  curAdd("diamond", first ? 3 : Math.random() < 0.5 ? 1 : 0);
  if (first || Math.random() < 0.25) { const it = makeLegend("moontower", L); if (it) { giveItem(it); got.push(it); } }
  showMessage(first ? "달빛 탑 정복! 은하 왕관을 받았어요!" : "은하 용 미르를 또 물리쳤어요!", 4, true);
  return got;
}

// ----- 달 마을: 60층을 깨면 은빛 탑 트로피 (꼭대기 노란 초승달) -----
const MOON_TOWER_TROPHY = { x: 4.2, y: 11.4, placed: false };
// 집: 월드 3 트로피 룸 가운데 받침대 (house_trophy.js 가 자리를 정해요. 없으면 빈 받침대로 "어떻게 받는지" 보여줘요)
hookOn("houseCrowns", (list) => { list.push({ world: 3, id: "moontower", name: "달빛 탑", has: () => typeof towerCrownCount === "function" && towerCrownCount("moontower") > 0 }); return list; });
function moonTowerTrophySpot() { return (typeof houseCrownSpot === "function" && houseCrownSpot("moontower")) || MOON_TOWER_TROPHY; }
hookOn("lobbyThings", (things) => {
  if (!towerCrownCount("moontower")) return;
  const s = moonTowerTrophySpot();
  things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
    drawBox(s.x - 0.32, s.y - 0.32, 0, 0.64, 0.64, 0.18, "#4a4a64");
    for (let i = 0; i < 4; i++) { const w = 0.42 - i * 0.08; drawBox(s.x - w / 2, s.y - w / 2, 0.18 + i * 0.28, w, w, 0.28, i % 2 ? "#e8ecf4" : "#b8bccc"); }
    // 초승달: 노란 블록 두 개를 비껴 놓아요
    drawBox(s.x - 0.12, s.y - 0.04, 1.3, 0.08, 0.08, 0.26, "#ffe27a");
    drawBox(s.x - 0.06, s.y + 0.04, 1.3, 0.12, 0.08, 0.08, "#ffe27a");
    drawBox(s.x - 0.06, s.y + 0.04, 1.48, 0.12, 0.08, 0.08, "#ffe27a");
    if (Math.sin(game.time * 3 + 1) > 0.7) { const c = toScreen(s.x, s.y, 1.75); drawStar(c.x, c.y, 8 * ZOOM, "#fff6c0"); }
  } });
}, 65);
hookOn("lobbyInteractables", (list) => {
  if (!towerCrownCount("moontower")) return list;
  const s = moonTowerTrophySpot();
  list.push({ x: s.x, y: s.y, range: 1.4, label: "달빛 탑 트로피", short: "보기", prompt: "달빛 탑 정복 트로피", action: () => showMessage(`달빛 탑 정복 ${towerCrownCount("moontower")}번! 최고 ${towerBestOf(MOON_TOWER)}층`, 3, true) });
  return list;
}, 65);

// ----- 달 지도 그림: 은빛 탑 + 초승달 -----
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (m.id !== "moontower") return false;
  const g = ctx, C = (c) => greyish(c, locked);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(10,10,30,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  rect(-10, -52, 20, 56, C("#c8c8dc")); rect(-13, -56, 26, 6, C("#8a6ad8"));
  rect(-3, -42, 6, 8, "#0a0a18"); rect(-3, -24, 6, 8, "#0a0a18");
  // 초승달
  g.beginPath(); g.arc(x, y - 66 * s, 7 * s, 0, Math.PI * 2); g.fillStyle = C("#ffe27a"); g.fill();
  g.beginPath(); g.arc(x + 3.5 * s, y - 68 * s, 6 * s, 0, Math.PI * 2); g.fillStyle = "#04040c"; g.fill();
  return true;
}, 40);
