// ===== 깊은 바다: 심해 탑 (50층) =====
// 시련의 탑(tower.js)과 같은 틀: 둥근 아레나 웨이브 → 계단. 5층마다 바다 보스(탑 버전: 정예 속성 하나), 50층엔 "심해 탑의 주인 해일왕".
// 보스가 아닌 층에는 바다 환경이 하나씩 (ocean_env.js): 1 거품 기둥, 2 얼음판, 3 물살, 4 물기둥 분출구 (층 번호로 정해져서 같이 하기에서도 같아요).
// 바다 보스들은 w2BossNow() 로 보스방·탑 보스 층을 똑같이 찾아서, 탑에서도 기믹(등불·소라·조개·파이프·밀물...)이 그대로 돌아요.

const SEA_TOWER = {
  id: "seatower", type: "tower", world: 2, name: "심해 탑", desc: "바다 밑으로 이어진 50층 탑! 5층마다 바다 보스, 50층엔 해일왕",
  minLevel: 33, floors: 50, reward: 140, unlockAfter: "shallows",
  size: 22, count: 0, monsters: {},
  theme: { floor: "#4a7a8a", moss: "#5fb0c0", wall: "#2f5a6a", darkness: 0.4, bg: "#04141c" },
  pools: [
    { upTo: 4, monsters: ["w2_puffer", "w2_shrimp", "w2_jelly", "crab"] },
    { upTo: 9, monsters: ["w2_puffer", "w2_shrimp", "w2_jelly", "w2_turtle", "w2_eel"] },
    { upTo: 14, monsters: ["w2_turtle", "w2_urchin", "w2_seahorse", "w2_puffer", "w2_shrimp", "w2_jelly"] },
    { upTo: 19, monsters: ["w2_penguin", "w2_urchin", "w2_turtle", "w2_starfish", "w2_seahorse", "w2_shrimp"] },
    { upTo: 24, monsters: ["w2_starfish", "w2_angler", "w2_eel", "w2_jelly", "w2_shrimp", "w2_seahorse"] },
    { upTo: 29, monsters: ["w2_sharkling", "w2_angler", "w2_urchin", "w2_turtle", "w2_penguin", "w2_seahorse"] },
    { upTo: 39, monsters: ["w2_octo", "w2_sharkling", "w2_eel", "w2_seahorse", "w2_starfish", "w2_turtle", "w2_angler"] },
    { upTo: 50, monsters: ["w2_octo", "w2_sharkling", "w2_penguin", "w2_urchin", "w2_angler", "w2_seahorse", "w2_turtle", "w2_starfish"] },
  ],
  // 보스 층: 바다 보스 (들어갈 때마다 하나 골라요). 35~45층은 더 센 보스 중에서, 50층은 해일왕
  bossPools: {
    5: ["shallows", "kelp"], 10: ["wreck", "icefloe"], 15: ["songreef", "trench"], 20: ["sharkreef", "vents"], 25: ["sunken"],
    30: ["shallows", "kelp", "wreck"], 35: ["icefloe", "songreef", "trench"], 40: ["sharkreef", "vents", "sunken"], 45: ["abyss"], 50: ["seatower"],
  },
  bossAffixes: ["fireTrail", "fast", "vampiric", "lightning", "deathNova"],
  levelStep: 0.35, // 50층이면 +17
  maxWave: 22,
  floorThemes: [
    { floor: "#c8b88a", moss: "#ff8f7a", wall: "#3f8f9a", darkness: 0.25, bg: "#0a3a4a" }, // 산호 모래
    { floor: "#6f8f6a", moss: "#3f8a4a", wall: "#3a5a52", darkness: 0.38, bg: "#06201a" }, // 다시마
    { floor: "#7a6a52", moss: "#5fa8a0", wall: "#4a3e34", darkness: 0.42, bg: "#081a20" }, // 배 무덤
    { floor: "#8fa8b8", moss: "#a8c8d8", wall: "#4f7a98", darkness: 0.3, bg: "#0a2a40" },  // 얼음
    { floor: "#3a4a6a", moss: "#e0c060", wall: "#2a3550", darkness: 0.5, bg: "#03060f" },  // 심해 궁전
  ],
};
MAPS.push(SEA_TOWER);
WORLD_PLACES.seatower = { x: 470, y: 800 };

// ----- 보스가 아닌 층의 바다 환경 -----
hookOn("towerFloorBuilt", (f, def) => {
  if (def !== SEA_TOWER || towerBossAt(f)) return;
  const E = w2EnsureEnv(world), c = world.W / 2;
  const free = (x, y, r = 0.7) => !hitsWall(x, y, r) && Math.hypot(x - (c - 6), y - (c - 6)) > 2.2 && Math.hypot(x - (c + 2.5), y - (c + 2.5)) > 1.6; // 계단·시작 자리 비우기
  const at = (pts, r) => pts.filter(([dx, dy]) => free(c + dx, c + dy, r)).map(([dx, dy]) => ({ x: c + dx, y: c + dy }));
  const kind = f % 5; // 1 거품 기둥, 2 얼음판, 3 물살, 4 물기둥 (0 은 보스 층)
  if (kind === 1) for (const s of at([[-5, 2], [5, -2], [2, 5], [-2, -5], [0, 4], [4, 0], [-4, 0], [0, -4], [3, -5], [-5, 3]], 0.9).slice(0, 2)) w2AddVent(s.x, s.y, world);
  if (kind === 2) E.ice.push({ x0: Math.floor(c - 3), y0: Math.floor(c - 3), x1: Math.floor(c + 3), y1: Math.floor(c + 3) });
  if (kind === 3) {
    const dir = Math.floor(f / 5) % 2 ? 1 : -1;
    E.currents.push({ x0: c - 7, y0: c - 0.9, x1: c + 7, y1: c + 0.9, dx: dir, dy: 0, push: 1.6 });
  }
  if (kind === 4) at([[-4, 3], [4, -3], [3, 4], [-3, -4], [0, 4], [4, 0], [-4, 0], [0, -4], [2, -5], [-5, 2], [5, 2]], 0.8).slice(0, 3).forEach((s, i) => E.geysers.push({ x: s.x, y: s.y, period: W2_ENV.geyserPeriod, offset: i * W2_ENV.geyserPeriod / 3 }));
}, 50);

// ----- 50층: 심해 탑의 주인 해일왕 -----
Object.assign(MONSTERS, {
  seaTowerMaster: { color: "#3f8f9a", name: "해일왕", shape: "seaTowerKing", behavior: "b2_boss", hp: 290, speed: 1.5, damage: 1.2, xp: 110, emerald: 1, emeraldCount: 24, attackRange: 2.1, attackCooldown: 1.8, world: 2,
    phases: [
      { until: 0.66, abilities: ["w2_clawSlam", "w2_pearlVolley", "w2_shellCharge", "shockRing"] },
      { until: 0.33, abilities: ["w2_spoutTrack", "w2_cannonRain", "b2_spinBeams", "w2_flopRing", "blink"] },
      { abilities: ["b2_doomBlast", "w2_dragonBreath", "w2_bubbleNova", "trackingStrike", "b2_clones", "enrage"] },
    ] },
});
// 모양: 바다색 돌 몸 + 산호·진주 왕관 + 파란 물결 망토 + 빛나는 눈 + 삼지창
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.seaTowerKing = (m) => {
  const P = b2Pose(m), stone = "#3f8f9a", dark = "#2a5a66", gold = "#ffd23f", cape = "#2f5fb0", coral = "#ff8f7a", pearl = "#fffaf0";
  const raise = P.cast, fist = P.strike;
  const parts = [
    { f: 0, s: 0.3, z: 0, w: 0.35, d: 0.35, h: 0.45, c: dark }, { f: 0, s: -0.3, z: 0, w: 0.35, d: 0.35, h: 0.45, c: dark },
    { f: -0.32, s: 0, z: 0.35, w: 0.18, d: 1.1, h: 1.0, c: cape }, { f: -0.36, s: 0, z: 0.3, w: 0.1, d: 1.2, h: 0.12, c: "#bff6ff" },
    { f: 0, s: 0, z: 0.4 + P.breath, w: 0.95, d: 0.95, h: 0.85, c: stone },
    { f: 0.48, s: 0.22, z: 0.75, w: 0.08, d: 0.14, h: 0.14, c: pearl }, { f: 0.48, s: -0.22, z: 0.75, w: 0.08, d: 0.14, h: 0.14, c: pearl },
    { f: 0.25 + fist * 0.4, s: 0.66, z: 0.4 + raise * 1.0 - fist * 0.3, w: 0.42, d: 0.42, h: 0.42, c: dark },
    { f: 0.25 + fist * 0.4, s: -0.66, z: 0.4 + raise * 1.0 - fist * 0.3, w: 0.42, d: 0.42, h: 0.42, c: dark },
    // 삼지창 (오른손)
    { f: 0.3 + fist * 0.4, s: 0.66, z: 0.2 + raise, w: 0.08, d: 0.08, h: 1.6, c: gold },
    { f: 0.3 + fist * 0.4, s: 0.66, z: 1.8 + raise, w: 0.08, d: 0.36, h: 0.08, c: gold },
    { f: 0.3 + fist * 0.4, s: 0.5, z: 1.88 + raise, w: 0.07, d: 0.07, h: 0.22, c: gold }, { f: 0.3 + fist * 0.4, s: 0.82, z: 1.88 + raise, w: 0.07, d: 0.07, h: 0.22, c: gold },
    { f: 0.18, s: 0, z: 1.25 + P.breath, w: 0.62, d: 0.62, h: 0.52, c: stone, face: true, eye: "#ffffff", pupil: "#3fd0ff" },
    { f: 0.18, s: 0, z: 1.77 + P.breath, w: 0.66, d: 0.66, h: 0.12, c: gold },
    { f: 0.4, s: 0, z: 1.89 + P.breath, w: 0.12, d: 0.12, h: 0.24, c: coral }, { f: 0.18, s: 0.26, z: 1.89 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: coral }, { f: 0.18, s: -0.26, z: 1.89 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: coral },
    { f: 0.4, s: 0, z: 2.12 + P.breath, w: 0.1, d: 0.1, h: 0.1, c: pearl },
  ];
  b2DrawBody(m, parts, { top: 2.4 });
};
const SEA_TOWER_MASTER_DEF = {
  id: "seaTowerMaster", name: "해일왕", title: "심해 탑 꼭대기", size: 3.4,
  arena: { size: 28, theme: { floor: "#3a4a6a", moss: "#5fb0c0", wall: "#2a3550", darkness: 0.42, bg: "#03060f" },
    build: (w) => { b2Pillars(w, [[-4, -4], [4, 4], [-4, 4], [4, -4], [0, -7], [0, 7]]); const c = w.W / 2; w2AddVent(c - 8, c, w); w2AddVent(c + 8, c, w); } },
  create: (x, y, level) => b2MakeBoss("seaTowerMaster", x, y, level, 3.4),
  reward: seaTowerReward,
};
SEA_TOWER_MASTER_DEF.phases = MONSTERS.seaTowerMaster.phases;
TOWER_MASTERS.seatower = SEA_TOWER_MASTER_DEF;

// ----- 보상: 50층을 처음 깨면 "심해 탑의 진주 왕관" + 금·다이아, 그 뒤에는 25% 왕관 -----
defBase("L_seaTower", { slot: "charm", legend: "seatower", name: "심해 탑의 진주 왕관", minL: 0, icon: "crown", color: "#bff6ff", perk: { hearts: 3, dmg: 0.1, speed: 0.05 }, desc: "해일왕을 물리친 증표: 하트·공격력·빠르기가 모두 올라요" });
BOSS_LEGENDS.seatower = "L_seaTower";
function seaTowerReward(L) {
  const pr = game.profile, got = [];
  const first = !pr.seaTowerCrown;
  pr.seaTowerCrown = (pr.seaTowerCrown || 0) + 1;
  curAdd("gold", 4 + coinCount(2));
  curAdd("diamond", first ? 3 : Math.random() < 0.5 ? 1 : 0);
  if (first || Math.random() < 0.25) { const it = makeLegend("seatower", L); if (it) { giveItem(it); got.push(it); } }
  showMessage(first ? "심해 탑 정복! 진주 왕관을 받았어요!" : "해일왕을 또 물리쳤어요!", 4, true);
  return got;
}

// ----- 바닷속 마을: 50층을 깨면 진주 탑 트로피 -----
const SEA_TOWER_TROPHY = { x: 4.2, y: 11.4, placed: false };
function seaTowerTrophySpot() {
  if (!SEA_TOWER_TROPHY.placed && game.scene === "lobby" && typeof findFreeSpot === "function") { const s = findFreeSpot(4.2, 11.4, 0.45, 3); if (s) { SEA_TOWER_TROPHY.x = s.x; SEA_TOWER_TROPHY.y = s.y; } SEA_TOWER_TROPHY.placed = true; }
  return SEA_TOWER_TROPHY;
}
hookOn("lobbyThings", (things) => {
  const pr = game.profile;
  if (!pr.seaTowerCrown || curWorld() !== 2) return;
  const s = seaTowerTrophySpot();
  things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
    drawBox(s.x - 0.32, s.y - 0.32, 0, 0.64, 0.64, 0.18, "#2a3550");
    for (let i = 0; i < 4; i++) { const w = 0.42 - i * 0.08; drawBox(s.x - w / 2, s.y - w / 2, 0.18 + i * 0.28, w, w, 0.28, i % 2 ? "#7fd0ff" : "#3fb0c8"); }
    drawBox(s.x - 0.08, s.y - 0.08, 1.3, 0.16, 0.16, 0.16, "#fffaf0");
    if (Math.sin(game.time * 3 + 1) > 0.7) { const c = toScreen(s.x, s.y, 1.6); drawStar(c.x, c.y, 8 * ZOOM, "#e6fbff"); }
  } });
}, 65);
hookOn("lobbyInteractables", (list) => {
  const pr = game.profile;
  if (!pr.seaTowerCrown || curWorld() !== 2) return list;
  const s = seaTowerTrophySpot();
  list.push({ x: s.x, y: s.y, range: 1.4, label: "심해 탑 트로피", short: "보기", prompt: "심해 탑 정복 트로피", action: () => showMessage(`심해 탑 정복 ${pr.seaTowerCrown}번! 최고 ${towerBestOf(SEA_TOWER)}층`, 3, true) });
  return list;
}, 65);

// ----- 바다 지도 그림: 물속에 잠긴 진주 탑 -----
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (m.id !== "seatower") return false;
  const g = ctx, C = (c) => greyish(c, locked);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(10,20,30,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(10,20,30,0.6)"; g.lineWidth = 1.2; g.stroke(); };
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  rect(-10, -50, 20, 54, C("#3f8f9a")); rect(-13, -54, 26, 6, C("#ffd23f"));
  rect(-3, -40, 6, 8, "#0a1418"); rect(-3, -22, 6, 8, "#0a1418");
  circ(0, -60, 5, C("#fffaf0"));
  circ(16, -30, 3, C("#e6fbff")); circ(19, -42, 2, C("#e6fbff"));
  return true;
}, 40);
