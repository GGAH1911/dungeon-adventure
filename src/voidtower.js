// ===== 공허: 공허 탑 (60층) (설계서 docs/design/world5-void.md 6장) =====
// 지하 탑(undertower.js)과 같은 틀: 둥근 아레나 웨이브 → 계단. 5층마다 공허 보스(탑 버전: 정예 속성 하나), 50층 틈새 거인, 55층 블랙홀 꿀꺽이, 60층 "꿈고래 둥실".
// 보스가 아닌 층의 공허 환경 (층 번호 % 4, 같이 하기에서도 같아요): 1 색 수정 + 어둠, 2 메아리 종, 3 구멍 띠 + 돌 다리, 0 그림자 웅덩이
// 튼튼하게: 공허 몬스터·보스가 없으면 비슷한 지하 것으로 바꿔 끼워 탑이 깨지지 않아요.

const VOID_TOWER_POOLS = [
  { upTo: 9, monsters: ["w5_wisp", "w5_dustBunny", "w5_echoBat", "w5_grayJelly"] },
  { upTo: 19, monsters: ["w5_dustBunny", "w5_hushTurtle", "w5_lampGhost", "w5_wisp"] },
  { upTo: 29, monsters: ["w5_shadeKid", "w5_lampGhost", "w5_hushTurtle", "w5_echoBat", "w5_grayJelly"] },
  { upTo: 39, monsters: ["w5_shadeKid", "w5_shadeKnight", "w5_lampGhost", "w5_dustBunny", "w5_echoBat"] },
  { upTo: 49, monsters: ["w5_shadeKnight", "w5_shadeKid", "w5_hushTurtle", "w5_lampGhost", "w5_grayJelly", "w5_wisp"] },
  { upTo: 60, monsters: ["w5_shadeKnight", "w5_shadeKid", "w5_lampGhost", "w5_hushTurtle", "w5_dustBunny", "w5_echoBat", "w5_grayJelly"] },
];
const VOID_TOWER_POOL_FALLBACK = ["w4_stoneguard", "w4_imp", "w4_crystalbug", "w4_rockcrab", "golem"];
const VOID_TOWER_BOSSES = {
  5: ["graybloom", "mistshore"], 10: ["hushcrater", "echowood"], 15: ["stonegarden", "moonless"],
  20: ["sandglass", "driftship"], 25: ["ashforge", "frostdream"], 30: ["emberwing"],
  35: ["graybloom", "hushcrater", "stonegarden", "dreamdeep"], 40: ["mistshore", "echowood", "moonless", "frostdream", "emberwing"],
  45: ["sandglass", "ashforge", "driftship", "forgotkeep"], 50: ["rift"], 55: ["starmaw"], 60: ["voidtower"],
};
const VOID_TOWER_BOSS_FALLBACK = ["glowcave", "shroomwood", "cartmine", "dripcave", "crystalhall", "forge", "goblintown", "underthrone"];
function voidTowerPools() {
  return VOID_TOWER_POOLS.map((p) => {
    const ok = p.monsters.filter((id) => MONSTERS[id]);
    return { upTo: p.upTo, monsters: ok.length ? ok : VOID_TOWER_POOL_FALLBACK.filter((id) => MONSTERS[id]) };
  });
}
function voidTowerBossPools() {
  const out = {}, back = VOID_TOWER_BOSS_FALLBACK.filter((id) => BOSS_DEFS[id]);
  for (const [f, pool] of Object.entries(VOID_TOWER_BOSSES)) {
    const ok = pool.filter((id) => TOWER_MASTERS[id] || BOSS_DEFS[id]);
    if (ok.length) out[f] = ok;
    else if (back.length) out[f] = [back[Math.min(back.length - 1, Math.floor((Number(f) / 60) * back.length))]];
  }
  return out;
}
const VOID_TOWER = {
  id: "voidtower", type: "tower", world: 5, name: "공허 탑", desc: "공허 위로 솟은 60층 탑! 5층마다 공허 보스, 60층엔 꿈고래",
  minLevel: 116, floors: 60, reward: 200, unlockAfter: "graybloom",
  size: 22, count: 0, monsters: {},
  theme: { floor: "#7a7a86", moss: "#b8a8d8", wall: "#4a4a58", darkness: 0.44, bg: "#05040a" },
  get pools() { return voidTowerPools(); },
  get bossPools() { return voidTowerBossPools(); },
  bossAffixes: ["fast", "vampiric", "lightning", "deathNova", "shielding", "frost"],
  levelStep: 0.35,
  maxWave: 22,
  floorThemes: [
    { floor: "#8a8a96", moss: "#c8b8e8", wall: "#4e4e5c", darkness: 0.42, bg: "#0a0a12" },
    { floor: "#7e8a80", moss: "#b8d8b0", wall: "#465248", darkness: 0.46, bg: "#060c08" },
    { floor: "#9090a0", moss: "#d0c8b0", wall: "#525060", darkness: 0.4, bg: "#0c0a10" },
    { floor: "#6a6a7e", moss: "#9a9ac8", wall: "#3a3a4e", darkness: 0.6, bg: "#04040a" },
    { floor: "#9aa4b0", moss: "#c8e0f0", wall: "#56606c", darkness: 0.42, bg: "#060a10" },
  ],
};
if (typeof ELITE_AFFIXES !== "undefined") VOID_TOWER.bossAffixes = VOID_TOWER.bossAffixes.filter((id) => ELITE_AFFIXES[id]);
MAPS.push(VOID_TOWER);

// ----- 보스가 아닌 층의 공허 환경 -----
hookOn("towerFloorBuilt", (f, def) => {
  if (def !== VOID_TOWER || towerBossAt(f)) return;
  world.w5 = null; w5Env(world); // 같은 층을 다시 만들어도 두 번 놓이지 않게 새로
  const c = world.W / 2;
  const free = (x, y, r = 0.7) => !hitsWall(x, y, r) && Math.hypot(x - (c - 6), y - (c - 6)) > 2.2 && Math.hypot(x - (c + 2.5), y - (c + 2.5)) > 1.6; // 계단·시작 자리 비우기
  const at = (pts, r) => pts.filter(([dx, dy]) => free(c + dx, c + dy, r)).map(([dx, dy]) => ({ x: c + dx, y: c + dy }));
  const more = [[5, 4], [-4, 5], [4, -5], [-5, -3], [0, 6], [6, 0], [-6, 1], [1, -6]];
  const kind = f % 4;
  if (kind === 1) { for (const s of at([[-5, 2], [5, -2], [2, 5], [-2, -5], ...more], 0.6).slice(0, 4)) w5AddCrystal(world, s.x, s.y); world.theme = { ...world.theme, darkness: Math.max(world.theme.darkness || 0, 0.58) }; }
  if (kind === 2) for (const s of at([[-5, 0], [5, 0], ...more], 0.7).slice(0, 2)) w5AddBell(world, s.x, s.y);
  if (kind === 3) {
    const vert = Math.floor(f / 4) % 2 === 1;
    if (vert) w5AddHole(world, { x0: c + 3, y0: c - 7, x1: c + 5, y1: c + 7 }, [{ x0: c + 3, y0: c - 1, x1: c + 5, y1: c + 1, kind: "stone" }, { x0: c + 3, y0: c + 4, x1: c + 5, y1: c + 6, kind: "blink" }]);
    else w5AddHole(world, { x0: c - 7, y0: c + 3, x1: c + 7, y1: c + 5 }, [{ x0: c - 1, y0: c + 3, x1: c + 1, y1: c + 5, kind: "stone" }, { x0: c + 4, y0: c + 3, x1: c + 6, y1: c + 5, kind: "blink" }]);
  }
  if (kind === 0) for (const s of at([[-4, 4], [4, -4], ...more], 0.7).slice(0, 2)) w5AddPuddle(world, s.x, s.y);
  for (const o of [...world.w5.crystals, ...world.w5.bells]) world.solids.push({ x: o.x, y: o.y, r: 0.38, w5: true });
}, 50);

// ----- 60층: 공허 탑의 주인 꿈고래 둥실 -----
// 새 기술: 꿈 물결. 고래 둘레로 고리 세 개가 바깥으로 퍼져요 (고리 사이는 안전). 쉬움은 두 개.
ABILITIES.w5_dreamWave = { name: "꿈 물결", desc: "꿈고래가 노래하면 고리가 차례로 바깥으로 퍼져요. 고리 사이는 안전해요.", counter: "고리가 지나간 안쪽으로 들어가요",
  tags: ["boss", "ring", "area"], telegraph: { shape: "ring", radius: 4, inner: 1.5, at: "self", time: 1.3 },
  cooldown: 14, range: [0, 40], damageMul: 1.2, anim: "roar", effect: { type: "damage" } };
hookOn("castResolved", (c) => {
  if (!c || c.id !== "w5_dreamWave" || c.w5Next) return;
  c.w5Next = true;
  const n = (c.w5Ring || 0) + 1, max = (typeof w5bDiff === "function" ? w5bDiff() : "normal") === "easy" ? 2 : 3;
  if (n >= max || !c.m || c.m.hp <= 0) return;
  const ab = ABILITIES.w5_dreamWave, tune = typeof abilityTuning === "function" ? abilityTuning() : { telegraph: 1, damage: 1 };
  const nc = makeCast(c.m, { ...ab, telegraph: { ...ab.telegraph, radius: 4 + n * 3.5, inner: 1.5 + n * 3.5 } }, "w5_dreamWave", { x: c.x, y: c.y }, ab.telegraph.time * tune.telegraph, tune);
  if (!nc) return;
  nc.x = c.x; nc.y = c.y; nc.w5Ring = n; nc.w5Next = false;
  casts.push(nc);
}, 50);
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, { w5_dreamWave: { text: "고리가 지나간 안쪽으로" } });

const VOID_MASTER_WANT = [
  { until: 0.66, abilities: ["w5_rgSlam", "w5_voidRain", "w5_grayWave", "shockRing"] },
  { until: 0.33, abilities: ["w5_dreamWave", "w5_rgShards", "w5_hushRing", "w5_shadeCall", "blink"] },
  { abilities: ["w5_dreamWave", "w5_rgPull", "w5_rgCore", "w5_voidRain", "trackingStrike", "enrage"] },
];
function voidMasterPhases() {
  return VOID_MASTER_WANT.map((ph) => {
    const list = [];
    for (const id of ph.abilities) { let use = ABILITIES[id] ? id : null; if (!use) use = ["shockRing", "slam"].find((x) => ABILITIES[x]); if (use && !list.includes(use)) list.push(use); }
    return ph.until !== undefined ? { until: ph.until, abilities: list } : { abilities: list };
  });
}
MONSTERS.voidTowerMaster = { color: "#8a86a8", name: "꿈고래 둥실", shape: "voidTowerWhale", behavior: "b2_boss", hp: 360, speed: 1.4, damage: 1.3, xp: 150, emerald: 1, emeraldCount: 32, attackRange: 2.4, attackCooldown: 1.8, world: 5,
  phases: voidMasterPhases() };
// 모습: 하늘을 헤엄치는 회색 별고래 (등에 별 무늬, 큰 눈, 꼬리 지느러미가 살랑)
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.voidTowerWhale = (m) => {
  const P = b2Pose(m), body = "#8a86a8", belly = "#d8d4e8", star = "#fff6d8", fin = Math.sin(game.time * 3 + (m.seed || 0)) * 0.12, up = 0.35 + Math.sin(game.time * 1.5) * 0.06;
  const parts = [
    { f: 0, s: 0, z: up + P.breath, w: 1.4, d: 0.9, h: 0.7, c: body },
    { f: 0.1, s: 0, z: up - 0.1, w: 1.1, d: 0.7, h: 0.12, c: belly },
    { f: -0.85, s: 0, z: up + 0.2 + fin, w: 0.35, d: 0.6, h: 0.14, c: body },
    { f: -1.05, s: 0, z: up + 0.25 + fin * 1.4, w: 0.18, d: 0.9, h: 0.1, c: body },
    { f: 0.1, s: 0.5, z: up + 0.1 - fin, w: 0.4, d: 0.16, h: 0.08, c: body }, { f: 0.1, s: -0.5, z: up + 0.1 + fin, w: 0.4, d: 0.16, h: 0.08, c: body },
    { f: -0.2, s: 0.18, z: up + 0.7 + P.breath, w: 0.1, d: 0.1, h: 0.04, c: star }, { f: 0.15, s: -0.2, z: up + 0.7 + P.breath, w: 0.1, d: 0.1, h: 0.04, c: star }, { f: -0.45, s: -0.05, z: up + 0.7 + P.breath, w: 0.1, d: 0.1, h: 0.04, c: star },
    { f: 0.45, s: 0, z: up + 0.15 + P.breath, w: 0.5, d: 0.8, h: 0.45, c: body, face: true, eye: "#ffffff", pupil: "#2a2240" },
  ];
  b2DrawBody(m, parts, { top: 1.6 });
};
const VOID_TOWER_MASTER_DEF = {
  id: "voidTowerMaster", name: "꿈고래 둥실", title: "공허 탑 꼭대기", size: 3.6,
  arena: { size: 28, theme: { floor: "#7a7a86", moss: "#d8c8ff", wall: "#403a50", darkness: 0.42, bg: "#05040a" },
    build: (w) => { const c = w.W / 2; if (typeof b2Pillars === "function") b2Pillars(w, [[-6, -6], [6, 6], [-6, 6], [6, -6]]); w5AddCrystal(w, c, c - 8); w5AddCrystal(w, c, c + 8); } },
  create: (x, y, level) => {
    MONSTERS.voidTowerMaster.phases = voidMasterPhases();
    VOID_TOWER_MASTER_DEF.phases = MONSTERS.voidTowerMaster.phases;
    return b2MakeBoss("voidTowerMaster", x, y, level, 3.6);
  },
  reward: voidTowerReward,
};
VOID_TOWER_MASTER_DEF.phases = MONSTERS.voidTowerMaster.phases;
if (typeof TOWER_MASTERS !== "undefined") TOWER_MASTERS.voidtower = VOID_TOWER_MASTER_DEF;

// ----- 보상 -----
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") {
  defBase("L_voidTower", { slot: "charm", legend: "voidtower", name: "공허 탑의 꿈 왕관", minL: 0, icon: "crown", color: "#d8c8ff", perk: { hearts: 4, dmg: 0.12, speed: 0.06 }, desc: "꿈고래를 물리친 증표: 하트·공격력·빠르기가 모두 올라요" });
  BOSS_LEGENDS.voidtower = "L_voidTower";
}
function voidTowerCrowns() { return typeof towerCrownCount === "function" ? towerCrownCount("voidtower") : (((game.profile && game.profile.crowns) || {}).voidtower || 0); }
function voidTowerReward(L) {
  const got = [], first = !voidTowerCrowns();
  recShared("crown", { id: "voidtower" });
  curAdd("gold", 5 + coinCount(2));
  curAdd("diamond", first ? 4 : Math.random() < 0.6 ? 1 : 0);
  if (first || Math.random() < 0.25) { const it = makeLegend("voidtower", L); if (it) { giveItem(it); got.push(it); } }
  showMessage(first ? "공허 탑 정복! 꿈 왕관을 받았어요!" : "꿈고래를 또 물리쳤어요!", 4, true);
  return got;
}

// ----- 집 트로피: houseRegisterCrown 이 있으면 등록 (house.js), 없으면 다른 탑처럼 집 자리·캠프 자리 -----
// 집 트로피 룸(월드 5) 가운데 받침대에 놓여요. 받침대 자리는 house_trophy.js 가 정하고, 트로피 그림·E 는 여기서
hookOn("houseCrowns", (list) => { list.push({ world: 5, id: "voidtower", name: "공허 탑", has: () => voidTowerCrowns() > 0 }); return list; });
{
  const VOID_TOWER_TROPHY = { x: 4.2, y: 11.4 };
  const voidTowerTrophySpot = () => (typeof houseCrownSpot === "function" && houseCrownSpot("voidtower")) || VOID_TOWER_TROPHY;
  hookOn("lobbyThings", (things) => {
    if (!voidTowerCrowns()) return;
    const s = voidTowerTrophySpot();
    things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
      drawBox(s.x - 0.32, s.y - 0.32, 0, 0.64, 0.64, 0.18, "#4a4a58");
      for (let i = 0; i < 4; i++) { const w = 0.42 - i * 0.08; drawBox(s.x - w / 2, s.y - w / 2, 0.18 + i * 0.28, w, w, 0.28, i % 2 ? "#d8c8ff" : "#8a86a8"); }
      drawBox(s.x - 0.08, s.y - 0.08, 1.3, 0.16, 0.16, 0.2, "#fff6d8");
    } });
  }, 65);
  hookOn("lobbyInteractables", (list) => {
    if (!voidTowerCrowns()) return list;
    const s = voidTowerTrophySpot();
    list.push({ x: s.x, y: s.y, range: 1.4, label: "공허 탑 트로피", short: "보기", prompt: "공허 탑 정복 트로피", action: () => showMessage(`공허 탑 정복 ${voidTowerCrowns()}번! 최고 ${towerBestOf(VOID_TOWER)}층`, 3, true) });
    return list;
  }, 65);
}

// ----- 공허 지도 그림: 별빛 탑 -----
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (m.id !== "voidtower") return false;
  const g = ctx, C = (c) => (typeof greyish === "function" ? greyish(c, locked) : c);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(10,8,20,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  rect(-11, -50, 22, 54, C("#6a6878")); rect(-14, -55, 28, 6, C("#8a86a8"));
  rect(-3, -40, 6, 8, C("#d8c8ff")); rect(-3, -22, 6, 8, C("#d8c8ff"));
  rect(-4, -64, 8, 9, C("#fff6d8"));
  return true;
}, 40);
