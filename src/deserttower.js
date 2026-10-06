// ===== 색모래 사막: 사막 탑 (60층) (설계서 docs/design/world6-desert.md 6장) =====
// 공허 탑(voidtower.js)과 같은 틀: 둥근 아레나 웨이브 → 계단. 5층마다 사막 신기루 보스, 55층 새빛 스핑크스 무지냥, 60층 "황금 낙타 왕 쿵짝".
// 보스가 아닌 층의 사막 환경 (층 번호 % 3, 같이 하기에서도 같아요): 1 오아시스, 2 모래 늪, 0 선인장
// 튼튼하게: 사막 몬스터·보스가 없으면 비슷한 공허 것으로 바꿔 끼워 탑이 깨지지 않아요.

const DESERT_TOWER_POOLS = [
  { upTo: 14, monsters: ["w6_sunWisp", "w6_sandBunny", "w6_cactusJelly", "w6_sandBat"] },
  { upTo: 29, monsters: ["w6_sandBunny", "w6_sandMummy", "w6_mirageGhost", "w6_cactusJelly"] },
  { upTo: 44, monsters: ["w6_shellTurtle", "w6_sandMummy", "w6_mirageGhost", "w6_sandBat", "w6_sunWisp"] },
  { upTo: 60, monsters: ["w6_shellTurtle", "w6_sandMummy", "w6_mirageGhost", "w6_sandBunny", "w6_cactusJelly", "w6_sandBat"] },
];
const DESERT_TOWER_POOL_FALLBACK = ["w5_wisp", "w5_dustBunny", "w5_grayJelly", "w5_lampGhost"];
const DESERT_TOWER_BOSSES = {
  5: ["sunsand", "quicksands"], 10: ["cactusvale", "mirageoasis"], 15: ["dunecastle", "starnight"], 20: ["scarabhall", "windcanyon"],
  25: ["sunken_temple", "glassdune"], 30: ["camelroad"], 35: ["sunsand", "cactusvale", "rainbowsand"], 40: ["quicksands", "dunecastle", "sphinxgate"],
  45: ["starnight", "glassdune", "sunthrone"], 50: ["sunthrone", "rainbowsand"], 55: ["prismpyramid"], 60: ["deserttower"],
};
const DESERT_TOWER_BOSS_FALLBACK = ["graybloom", "mistshore", "echowood", "moonless", "frostdream", "rift"];
function desertTowerPools() {
  return DESERT_TOWER_POOLS.map((p) => { const ok = p.monsters.filter((id) => MONSTERS[id]); return { upTo: p.upTo, monsters: ok.length ? ok : DESERT_TOWER_POOL_FALLBACK.filter((id) => MONSTERS[id]) }; });
}
function desertTowerBossPools() {
  const out = {}, back = DESERT_TOWER_BOSS_FALLBACK.filter((id) => BOSS_DEFS[id]);
  for (const [f, pool] of Object.entries(DESERT_TOWER_BOSSES)) {
    const ok = pool.filter((id) => TOWER_MASTERS[id] || BOSS_DEFS[id]);
    if (ok.length) out[f] = ok;
    else if (back.length) out[f] = [back[Math.min(back.length - 1, Math.floor((Number(f) / 60) * back.length))]];
  }
  return out;
}
const DESERT_TOWER = {
  id: "deserttower", type: "tower", world: 6, name: "사막 탑", desc: "모래 위로 솟은 60층 탑! 5층마다 사막 보스, 60층엔 황금 낙타 왕",
  minLevel: 155, floors: 60, reward: 210, unlockAfter: "sunsand",
  size: 22, count: 0, monsters: {},
  theme: { floor: "#d8b878", moss: "#e8d098", wall: "#a8844e", darkness: 0.3, bg: "#1a1206" },
  get pools() { return desertTowerPools(); },
  get bossPools() { return desertTowerBossPools(); },
  bossAffixes: ["fast", "vampiric", "lightning", "deathNova", "shielding", "frost"],
  levelStep: 0.35, maxWave: 22,
  floorThemes: [
    { floor: "#d8b878", moss: "#e8d098", wall: "#a8844e", darkness: 0.28, bg: "#1a1206" },
    { floor: "#c8a868", moss: "#b89858", wall: "#987440", darkness: 0.3, bg: "#1a1206" },
    { floor: "#d0b070", moss: "#9ac070", wall: "#a08048", darkness: 0.28, bg: "#1a1206" },
    { floor: "#8a7a6a", moss: "#a8a0d8", wall: "#5a4a3a", darkness: 0.5, bg: "#06040e" },
  ],
};
if (typeof ELITE_AFFIXES !== "undefined") DESERT_TOWER.bossAffixes = DESERT_TOWER.bossAffixes.filter((id) => ELITE_AFFIXES[id]);
MAPS.push(DESERT_TOWER);
if (typeof WORLD_PLACES !== "undefined" && !WORLD_PLACES.deserttower) WORLD_PLACES.deserttower = { x: 2180, y: 760 };

// ----- 보스가 아닌 층의 사막 환경 -----
hookOn("towerFloorBuilt", (f, def) => {
  if (def !== DESERT_TOWER || towerBossAt(f)) return;
  world.w6 = null; w6Env(world);
  const c = world.W / 2;
  const free = (x, y, r = 0.9) => !hitsWall(x, y, r) && Math.hypot(x - (c - 6), y - (c - 6)) > 2.4 && Math.hypot(x - (c + 2.5), y - (c + 2.5)) > 2.0;
  const pts = [[5, 4], [-4, 5], [4, -5], [-5, -3], [0, 6], [6, 0], [-6, 1], [1, -6]].filter(([dx, dy]) => free(c + dx, c + dy));
  const kind = f % 3;
  if (kind === 1) for (const [dx, dy] of pts.slice(0, 2)) w6AddOasis(world, c + dx, c + dy);
  if (kind === 2) for (const [dx, dy] of pts.slice(0, 3)) w6AddQuicksand(world, c + dx, c + dy, 1.4);
  if (kind === 0) for (const [dx, dy] of pts.slice(0, 5)) w6AddCactus(world, c + dx, c + dy);
}, 50);

// ----- 60층: 황금 낙타 왕 쿵짝 -----
const DESERT_MASTER_WANT = [
  { until: 0.66, abilities: ["w6_sandWave", "w6_sandRain", "shockRing"] },
  { until: 0.33, abilities: ["w6_duneRing", "w6_mirageCall", "w6_sunSpot", "w6_sandRain"] },
  { abilities: ["w6_prismRing", "w6_duneRing", "w6_sandRain", "w6_sunSpot", "enrage"] },
];
function desertMasterPhases() {
  return DESERT_MASTER_WANT.map((ph) => {
    const list = [];
    for (const id of ph.abilities) { let use = ABILITIES[id] ? id : null; if (!use) use = ["shockRing", "slam"].find((x) => ABILITIES[x]); if (use && !list.includes(use)) list.push(use); }
    return ph.until !== undefined ? { until: ph.until, abilities: list } : { abilities: list };
  });
}
MONSTERS.desertTowerMaster = { color: "#e8b860", name: "황금 낙타 왕 쿵짝", shape: "desertTowerCamel", behavior: "b2_boss", hp: 380, speed: 1.4, damage: 1.35, xp: 160, emerald: 1, emeraldCount: 34, attackRange: 2.4, attackCooldown: 1.8, world: 6,
  phases: desertMasterPhases() };
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.desertTowerCamel = (m) => {
  const P = b2Pose(m), body = "#e8b860", dark = "#b8883a", w = P.walk * 0.06;
  const parts = [
    { f: 0, s: 0, z: 0.55 + P.breath, w: 1.3, d: 0.7, h: 0.5, c: body },
    { f: -0.25, s: 0, z: 1.05 + P.breath, w: 0.4, d: 0.5, h: 0.3, c: body }, { f: 0.25, s: 0, z: 1.05 + P.breath, w: 0.4, d: 0.5, h: 0.3, c: body }, // 혹 두 개
    { f: 0.5, s: 0.22, z: 0, w: 0.14, d: 0.14, h: 0.55 + w, c: dark }, { f: 0.5, s: -0.22, z: 0, w: 0.14, d: 0.14, h: 0.55 - w, c: dark },
    { f: -0.5, s: 0.22, z: 0, w: 0.14, d: 0.14, h: 0.55 - w, c: dark }, { f: -0.5, s: -0.22, z: 0, w: 0.14, d: 0.14, h: 0.55 + w, c: dark },
    { f: 0.75, s: 0, z: 0.9 + P.breath, w: 0.18, d: 0.2, h: 0.55, c: body },
    { f: 0.9, s: 0, z: 1.35 + P.breath, w: 0.45, d: 0.35, h: 0.3, c: body, face: true, eye: "#ffffff", pupil: "#3a2410" },
    { f: 0.88, s: 0, z: 1.65 + P.breath, w: 0.3, d: 0.36, h: 0.1, c: "#ffd23f" }, // 금 왕관
  ];
  b2DrawBody(m, parts, { top: 1.9 });
};
const DESERT_TOWER_MASTER_DEF = {
  id: "desertTowerMaster", name: "황금 낙타 왕 쿵짝", title: "사막 탑 꼭대기", size: 3.6,
  arena: { size: 28, theme: { floor: "#e0c080", moss: "#ffd890", wall: "#a8844e", darkness: 0.26, bg: "#1a1206" },
    build: (w) => { const c = w.W / 2; if (typeof b2Pillars === "function") b2Pillars(w, [[-6, -6], [6, 6], [-6, 6], [6, -6]]); w6AddOasis(w, c, c - 8); w6AddOasis(w, c, c + 8); } },
  create: (x, y, level) => { MONSTERS.desertTowerMaster.phases = desertMasterPhases(); DESERT_TOWER_MASTER_DEF.phases = MONSTERS.desertTowerMaster.phases; return b2MakeBoss("desertTowerMaster", x, y, level, 3.6); },
  reward: desertTowerReward,
};
DESERT_TOWER_MASTER_DEF.phases = MONSTERS.desertTowerMaster.phases;
if (typeof TOWER_MASTERS !== "undefined") TOWER_MASTERS.deserttower = DESERT_TOWER_MASTER_DEF;

if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") {
  defBase("L_desertTower", { slot: "charm", legend: "deserttower", name: "사막 탑의 황금 왕관", minL: 0, icon: "crown", color: "#ffd23f", perk: { hearts: 4, dmg: 0.12, speed: 0.06 }, desc: "황금 낙타 왕을 이긴 증표: 하트 +4, 공격력 +12%, 빠르기" });
  BOSS_LEGENDS.deserttower = "L_desertTower";
}
function desertTowerCrowns() { return typeof towerCrownCount === "function" ? towerCrownCount("deserttower") : (((game.profile && game.profile.crowns) || {}).deserttower || 0); }
function desertTowerReward(L) {
  const got = [], first = !desertTowerCrowns();
  recShared("crown", { id: "deserttower" });
  curAdd("gold", 5 + coinCount(2), "tower");
  curAdd("diamond", first ? 4 : Math.random() < 0.6 ? 1 : 0, "tower");
  if (first || Math.random() < 0.25) { const it = makeLegend("deserttower", L); if (it) { giveItem(it); got.push(it); } }
  showMessage(first ? "사막 탑 정복! 황금 왕관을 받았어요!" : "황금 낙타 왕을 또 물리쳤어요!", 4, true);
  return got;
}
// 집 트로피 룸(월드 6) 가운데 받침대 (house_trophy.js)
hookOn("houseCrowns", (list) => { list.push({ world: 6, id: "deserttower", name: "사막 탑", has: () => desertTowerCrowns() > 0 }); return list; });
{
  const DESERT_TOWER_TROPHY = { x: 4.2, y: 11.4 };
  const spot = () => (typeof houseCrownSpot === "function" && houseCrownSpot("deserttower")) || DESERT_TOWER_TROPHY;
  hookOn("lobbyThings", (things) => {
    if (!desertTowerCrowns()) return;
    const s = spot();
    things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
      drawBox(s.x - 0.32, s.y - 0.32, 0, 0.64, 0.64, 0.18, "#8a6a3a");
      for (let i = 0; i < 4; i++) { const w = 0.42 - i * 0.08; drawBox(s.x - w / 2, s.y - w / 2, 0.18 + i * 0.28, w, w, 0.28, i % 2 ? "#ffd23f" : "#e8b860"); }
    } });
  }, 65);
  hookOn("lobbyInteractables", (list) => {
    if (!desertTowerCrowns()) return list;
    const s = spot();
    list.push({ x: s.x, y: s.y, range: 1.4, label: "사막 탑 트로피", short: "보기", prompt: "사막 탑 정복 트로피", action: () => showMessage(`사막 탑 정복 ${desertTowerCrowns()}번!`, 2.5) });
    return list;
  }, 65);
}
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (m.id !== "deserttower") return false;
  const g = ctx, C = (c) => (typeof greyish === "function" ? greyish(c, locked) : c);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(60,40,20,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  rect(-11, -50, 22, 54, C("#c8a060")); rect(-14, -55, 28, 6, C("#e8b860")); rect(-3, -40, 6, 8, C("#6ac8e0")); rect(-4, -64, 8, 9, C("#ffd23f"));
  return true;
}, 40);
