// ===== 월드 4 "지하세계": 맵 12개, 월드 정보 (설계서 docs/design/world4-underworld.md 2장) =====
// 이 파일의 뼈대(맵 목록·WORLDS[4])는 부모가 먼저 만들었어요. 지도 자리·그림·마을 겉모습은 작업자 A 가 채워요.
// 레벨: 월드 3 마지막(달의 궁전 Lv 82) + 3 = 85 에서 맵마다 2.55 (설계서 2-1 공식)
// 맵 몬스터(w4_*)는 mobs_w4.js, 환경(features)은 under_env.js, 보스는 bosses_w4*.js

const W4_MAPS = [
  { world: 4, unlockAfter: "mooncastle", key: ["guardian"], // 설계 열쇠 ["crystalLight", "guardian"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "glowcave", name: "반딧불 동굴", desc: "어두운 동굴! 수정을 때리면 반짝 불이 켜져요",
    minLevel: 85, size: 64, rooms: 13, count: 36, reward: 260, features: { crystals: 22 },
    monsters: { w4_glowbug: 3, w4_mole: 3, w4_batling: 2, w4_rockcrab: 1, spider: 2, thief: 1 },
    theme: { floor: "#4a4036", moss: "#7fe0c0", wall: "#2e2620", darkness: 0.62, bg: "#08060a" } },
  { world: 4, unlockAfter: "glowcave", key: ["shards", "mimic"], // 설계 열쇠 ["shards", "mimic"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "shroomwood", name: "통통 버섯 숲", desc: "커다란 버섯을 밟으면 통! 하고 날아올라요",
    minLevel: 88, size: 64, rooms: 13, count: 36, reward: 270, features: { shrooms: 10, crystals: 4 },
    monsters: { w4_shroomling: 4, w4_glowbug: 2, w4_mole: 2, w4_batling: 2, mushroom: 2, thief: 1 },
    theme: { floor: "#5a4a5a", moss: "#ff9ad6", wall: "#3a2e3e", darkness: 0.4, bg: "#140a16" } },
  { world: 4, unlockAfter: "shroomwood", key: ["levers"], // 설계 열쇠 ["cartRide", "levers"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "cartmine", name: "덜컹 광차 갱도", desc: "광차를 타면 쭉! 레일 위 광차를 조심해요",
    minLevel: 90, size: 66, rooms: 14, count: 36, reward: 280, features: { rails: 3 },
    monsters: { w4_goblinMiner: 4, w4_rockcrab: 2, w4_mole: 2, w4_crystalbug: 2, miner: 1, thief: 1 },
    theme: { floor: "#6a5a48", moss: "#c8a060", wall: "#3e3226", darkness: 0.45, bg: "#100c08" } },
  { world: 4, unlockAfter: "cartmine", key: ["hold", "twins"], // 설계 열쇠 ["hold", "twins"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "dripcave", name: "뚝뚝 종유석 굴", desc: "천장에서 종유석이 뚝! 바닥 그림자를 보고 피해요",
    minLevel: 93, size: 66, rooms: 14, count: 38, reward: 290, features: { drips: 14, crystals: 4 },
    monsters: { w4_batling: 4, w4_rockcrab: 2, w4_glowbug: 2, w4_crystalbug: 2, w4_mole: 1, thief: 1 },
    theme: { floor: "#5e6068", moss: "#9fb8d0", wall: "#3a3c46", darkness: 0.5, bg: "#08090e" } },
  { world: 4, unlockAfter: "dripcave", key: ["plates", "mimic"], // 설계 열쇠 ["plates", "mimic"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "undriver", name: "지하 강", desc: "동굴 속 강물이 흘러요! 물살을 타고 건너요",
    minLevel: 95, size: 66, rooms: 14, count: 38, reward: 300, features: { currents: 6, shrooms: 3 },
    monsters: { w4_rockcrab: 3, w4_shroomling: 2, w4_batling: 2, w4_imp: 2, w4_glowbug: 2, crab: 1, thief: 1 },
    theme: { floor: "#4a5a5e", moss: "#5fb8c8", wall: "#2e3a3e", darkness: 0.48, bg: "#04100e" } },
  { world: 4, unlockAfter: "undriver", key: ["dark", "mimic"], // 설계 열쇠 ["crystalLight", "dark", "mimic"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "crystalhall", name: "수정 궁전", desc: "깜깜한 궁전, 수정에 불을 켜며 나아가요",
    minLevel: 98, size: 66, rooms: 14, count: 36, reward: 310, features: { crystals: 30 },
    monsters: { w4_crystalbug: 4, w4_glowbug: 3, w4_batling: 2, w4_stoneguard: 1, w4_imp: 1, thief: 1 },
    theme: { floor: "#3a3458", moss: "#b08aff", wall: "#241e3a", darkness: 0.72, bg: "#06040e" } },
  { world: 4, unlockAfter: "crystalhall", key: ["torches", "guardian"], // 설계 열쇠 ["torches", "guardian"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "lavaflow", name: "부글 용암 강", desc: "부글부글 용암 강! 금색 다리로만 건너요",
    minLevel: 100, size: 68, rooms: 14, count: 38, reward: 320, features: { lava: 5, drips: 4 },
    monsters: { w4_lavaslug: 4, w4_imp: 3, w4_rockcrab: 2, w4_goblinMiner: 1, boomer: 1, thief: 1 },
    theme: { floor: "#4a3a34", moss: "#ffb04a", wall: "#2e2220", darkness: 0.42, bg: "#140604", lava: true } },
  { world: 4, unlockAfter: "lavaflow", key: ["traphall", "twins"], // 설계 열쇠 ["traphall", "twins"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "crumble", name: "와르르 다리", desc: "금 간 바닥은 흔들흔들, 곧 와르르! 얼른 지나가요",
    minLevel: 103, size: 68, rooms: 15, count: 38, reward: 330, features: { cracks: 26, lava: 2 },
    monsters: { w4_mole: 3, w4_goblinMiner: 2, w4_lavaslug: 2, w4_batling: 2, w4_stoneguard: 1, charger: 1, thief: 1 },
    theme: { floor: "#6a5848", moss: "#d8b878", wall: "#3e3024", darkness: 0.4, bg: "#0e0a06" } },
  { world: 4, unlockAfter: "crumble", key: ["memory", "plates", "crackwall"], // 설계 열쇠 ["memory", "plates", "crackwall"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "ruins", name: "잠든 옛 유적", desc: "오래된 돌 유적! 석상 병사가 길을 지켜요",
    minLevel: 105, size: 68, rooms: 15, count: 40, reward: 345, features: { drips: 8, cracks: 12, crystals: 6 },
    monsters: { w4_stoneguard: 3, w4_batling: 2, w4_crystalbug: 2, w4_dokkaebiKid: 1, w4_mole: 2, sniper: 1, thief: 1 },
    theme: { floor: "#8a8270", moss: "#a8c890", wall: "#5a5444", darkness: 0.45, bg: "#0c0c08" } },
  { world: 4, unlockAfter: "ruins", key: ["torches", "hold"], // 설계 열쇠 ["cartRide", "torches", "hold"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "forge", name: "땅속 대장간", desc: "땅땅! 거인의 대장간. 용암 사이로 광차가 달려요",
    minLevel: 108, size: 70, rooms: 15, count: 40, reward: 360, features: { lava: 3, rails: 2 },
    monsters: { w4_goblinMiner: 3, w4_imp: 2, w4_lavaslug: 2, w4_stoneguard: 2, w4_rockcrab: 1, golem: 1, thief: 1 },
    theme: { floor: "#5a4a44", moss: "#ff9a4a", wall: "#3a2c28", darkness: 0.4, bg: "#120806", lava: true } },
  { world: 4, unlockAfter: "forge", key: ["thief", "mimic", "twins"], // 설계 열쇠 ["thief", "mimic", "twins"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "goblintown", name: "도깨비 장터", desc: "도깨비 장터에 놀러 왔어요! 장난꾸러기 도깨비를 조심",
    minLevel: 111, size: 70, rooms: 15, count: 40, reward: 375, features: { shrooms: 6, crystals: 10 },
    monsters: { w4_dokkaebiKid: 4, w4_goblinMiner: 2, w4_imp: 2, w4_shroomling: 2, w4_glowbug: 2, thief: 2 },
    theme: { floor: "#6a5a3a", moss: "#ffd060", wall: "#4a3424", darkness: 0.38, bg: "#120c04" } },
  { world: 4, unlockAfter: "goblintown", key: ["levers", "hold", "twins"], // 설계 열쇠 ["levers", "hold", "twins"] (crystalLight·cartRide 가 생기면 바꿔요: under_env.js)
    id: "underthrone", name: "지하 왕궁", desc: "지하세계 맨 아래, 부글대왕의 왕궁",
    minLevel: 113, size: 72, rooms: 16, count: 42, reward: 400, features: { lava: 2, drips: 6, cracks: 8, rails: 1, crystals: 8, shrooms: 2 },
    monsters: { w4_stoneguard: 2, w4_imp: 2, w4_lavaslug: 2, w4_crystalbug: 2, w4_dokkaebiKid: 2, w4_goblinMiner: 1, w4_batling: 1, w4_rockcrab: 1, thief: 1 },
    theme: { floor: "#4a3a4a", moss: "#ffc040", wall: "#2e2230", darkness: 0.55, bg: "#0a0408", lava: true } },
];
for (const m of W4_MAPS) MAPS.push(m);

// 월드 4 정보 (월드 3 마지막 보스 달의 여왕을 잡으면 포탈로 가요)
WORLDS[4] = {
  id: 4, name: "지하세계", camp: "버섯 등불 마을", mapTitle: "지하세계 지도", unlockAfter: "mooncastle",
  lobbyTheme: { floor: "#5a4a40", moss: "#ff9ad6", wall: "#3a2c26", path: "#8a7058", darkness: 0.42, bg: "#0c0806" },
};
if (!WORLD_ORDER.includes(4)) WORLD_ORDER.push(4);


function inUnderDungeon() { return typeof inWorld4 === "function" && inWorld4(); } // 지하 맵·보스방·지하 탑 (설계서 3-5)

// 모험 지도 자리 (지하 지도 2400×1600: 위 반짝 동굴에서 갈지자로 내려가 맨 아래 왕궁)
Object.assign(WORLD_PLACES, {
  glowcave: { x: 380, y: 260 }, shroomwood: { x: 760, y: 360 }, cartmine: { x: 1160, y: 250 },
  dripcave: { x: 1560, y: 330 }, undriver: { x: 1960, y: 470 }, crystalhall: { x: 1640, y: 700 },
  lavaflow: { x: 1220, y: 760 }, crumble: { x: 800, y: 840 }, ruins: { x: 430, y: 1060 },
  forge: { x: 860, y: 1260 }, goblintown: { x: 1360, y: 1180 }, underthrone: { x: 1880, y: 1300 },
  undertower: { x: 2140, y: 900 },
});

// ===== 지하 지도 (모험 지도의 배경, 한 번만 그려요) =====
// 어두운 바위 바탕, 위쪽 초록 이끼 띠, 아래로 갈수록 주황 용암 줄기, 수정·버섯 점 (빨강 안 써요: 빨강은 예고 전용)
function buildUnderTerrain() {
  const c = document.createElement("canvas");
  c.width = WORLD_W; c.height = WORLD_H;
  const g = c.getContext("2d");
  const rand = makeRandom(20261006);
  g.fillStyle = "#2a1e18"; g.fillRect(0, 0, WORLD_W, WORLD_H);
  // 바위 얼룩
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${60 + rand() * 30},${44 + rand() * 20},${34 + rand() * 16},0.5)`; g.beginPath(); g.arc(rand() * WORLD_W, rand() * WORLD_H, 30 + rand() * 90, 0, Math.PI * 2); g.fill(); }
  // 위쪽 이끼 띠
  const moss = g.createLinearGradient(0, 0, 0, 420); moss.addColorStop(0, "rgba(90,150,90,0.55)"); moss.addColorStop(1, "rgba(90,150,90,0)");
  g.fillStyle = moss; g.fillRect(0, 0, WORLD_W, 420);
  // 용암 줄기 3개 (아래로 갈수록)
  for (const [y0, w] of [[900, 18], [1180, 24], [1420, 30]]) {
    g.strokeStyle = "rgba(255,150,50,0.75)"; g.lineWidth = w; g.lineCap = "round"; g.beginPath();
    let x = -20, y = y0; g.moveTo(x, y);
    while (x < WORLD_W + 40) { x += 120 + rand() * 80; y += (rand() - 0.5) * 120; g.lineTo(x, y); }
    g.stroke();
    g.strokeStyle = "rgba(255,226,122,0.6)"; g.lineWidth = w * 0.35; g.stroke();
  }
  // 수정 점 (하늘색·보라), 버섯 점 (분홍)
  for (let i = 0; i < 40; i++) { const x = rand() * WORLD_W, y = rand() * WORLD_H, s = 6 + rand() * 10; g.fillStyle = rand() < 0.5 ? "#7fe0ff" : "#b08aff"; g.beginPath(); g.moveTo(x, y - s * 1.6); g.lineTo(x + s * 0.6, y); g.lineTo(x - s * 0.6, y); g.closePath(); g.fill(); }
  for (let i = 0; i < 20; i++) { const x = rand() * WORLD_W, y = 300 + rand() * 1100; g.fillStyle = "#e8d8c0"; g.fillRect(x - 3, y - 8, 6, 10); g.fillStyle = "#ff9ad6"; g.beginPath(); g.ellipse(x, y - 8, 12, 7, 0, Math.PI, 0); g.fill(); }
  return c;
}
if (typeof buildTerrain === "function") {
  const buildTerrainPrev = buildTerrain;
  buildTerrain = function () { return typeof curWorld === "function" && curWorld() === 4 ? buildUnderTerrain() : buildTerrainPrev(); };
}

// 지하 맵 그림 (지도 위 장소)
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (mapWorld(m) !== 4) return false;
  const g = ctx, C = (c) => greyish(c, locked);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(20,10,5,0.75)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(20,10,5,0.6)"; g.lineWidth = 1.2; g.stroke(); };
  const cap = (cx, cy, r, col) => { g.beginPath(); g.ellipse(x + cx * s, y + cy * s, r * s, r * 0.6 * s, 0, Math.PI, 0); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(20,10,5,0.6)"; g.lineWidth = 1.2; g.stroke(); };
  g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  switch (m.id) {
    case "glowcave": circ(0, -10, 16, C("#4a4036")); circ(-6, -14, 3, C("#c8ff7a")); circ(6, -8, 3, C("#c8ff7a")); circ(2, -20, 2.5, C("#7fe0c0")); break;
    case "shroomwood": rect(-3, -16, 6, 16, C("#e8d8c0")); cap(0, -16, 16, C("#ff9ad6")); break;
    case "cartmine": rect(-20, -6, 40, 3, C("#8a6a4a")); rect(-12, -18, 24, 12, C("#8a8a92")); circ(-7, -5, 4, C("#3a3030")); circ(7, -5, 4, C("#3a3030")); break;
    case "dripcave": rect(-20, -30, 40, 6, C("#5e6068")); for (const ox of [-12, 0, 12]) { g.fillStyle = C("#9fb8d0"); g.beginPath(); g.moveTo(x + (ox - 4) * s, y - 24 * s); g.lineTo(x + (ox + 4) * s, y - 24 * s); g.lineTo(x + ox * s, y - 8 * s); g.closePath(); g.fill(); } break;
    case "undriver": rect(-22, -12, 44, 10, C("#5fb8c8")); rect(-14, -10, 8, 3, C("#e6fbff")); rect(4, -7, 10, 3, C("#e6fbff")); break;
    case "crystalhall": for (const [ox, h, c] of [[-12, 22, "#7fe0ff"], [0, 34, "#b08aff"], [12, 24, "#c8a8ff"]]) rect(ox - 4, -h, 8, h, C(c)); break;
    case "lavaflow": rect(-22, -10, 44, 8, C("#ffb04a")); rect(-4, -14, 8, 14, C("#ffd23f")); break;
    case "crumble": rect(-20, -10, 12, 6, C("#a88a68")); rect(-4, -8, 10, 6, C("#a88a68")); rect(10, -12, 10, 6, C("#a88a68")); break;
    case "ruins": rect(-18, -26, 8, 26, C("#a8a090")); rect(10, -26, 8, 26, C("#a8a090")); rect(-20, -30, 40, 5, C("#8a8270")); circ(0, -14, 4, C("#7fe0a0")); break;
    case "forge": rect(-16, -20, 32, 20, C("#5a4a44")); rect(-8, -12, 16, 8, C("#ff9a4a")); rect(-3, -32, 6, 12, C("#3a2c28")); break;
    case "goblintown": rect(-18, -16, 16, 16, C("#a87848")); rect(2, -20, 16, 20, C("#c89858")); circ(-10, -20, 4, C("#ffd060")); circ(10, -24, 4, C("#ffd060")); break;
    case "underthrone": rect(-18, -24, 36, 24, C("#5a4a5a")); rect(-6, -36, 12, 12, C("#ffc040")); for (const ox of [-6, 0, 6]) rect(ox - 1.5, -40, 3, 5, C("#ffc040")); break;
    default: circ(0, -14, 14, C("#8a7a6a"));
  }
  return true;
}, 50);

// ===== 버섯 등불 마을 겉모습 (lobby.js 가 worldLook() === 4 이면 불러요: 자리는 그대로, 겉모습만) =====
const UNDER_LOOK = {
  merchant: { skin: "#8a6a5a", hair: "#5a4436", shirt: "#d8a050", pants: "#5a4a3a", eyes: "#1a100a" }, // 두더지 상인 아줌마 (광부 앞치마)
  smith: { skin: "#d9a07a", hair: "#e8e0d0", shirt: "#7a4a2a", pants: "#3f3428", eyes: "#2a1a10" },   // 땅속 대장장이 "망치 할아버지"
};
// 큰 빛버섯 등불 (모닥불 자리)
function drawShroomLamp(f) {
  drawBox(f.x - 0.14, f.y - 0.14, 0, 0.28, 0.28, 0.9, "#e8d8c0");
  const bob = Math.sin(game.time * 1.6) * 0.02;
  drawBox(f.x - 0.8, f.y - 0.8, 0.9 + bob, 1.6, 1.6, 0.32, "#ff9ad6");
  drawBox(f.x - 0.55, f.y - 0.55, 1.22 + bob, 1.1, 1.1, 0.18, "#ffb8e4");
  for (const [ox, oy] of [[-0.4, 0.1], [0.3, -0.3], [0.1, 0.45]]) drawBox(f.x + ox - 0.07, f.y + oy - 0.07, 1.4 + bob, 0.14, 0.14, 0.05, "#fff0f8");
  if (typeof glowAt === "function") glowAt(f.x, f.y, 0.8, 70, "255,220,120", 0.45);
}
// 소원 수정 샘 (우물 자리)
function drawCrystalSpring(w) {
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; drawBox(w.x + Math.cos(a) * 0.75 - 0.15, w.y + Math.sin(a) * 0.75 - 0.15, 0, 0.3, 0.3, 0.22, i % 2 ? "#5a4a40" : "#6e5c4e"); }
  drawBox(w.x - 0.55, w.y - 0.55, 0, 1.1, 1.1, 0.06, "#4fb8d8");
  drawBox(w.x - 0.12, w.y - 0.12, 0.06, 0.24, 0.24, 0.5 + 0.05 * Math.sin(game.time * 2), "#9fe8ff");
  if (typeof glowAt === "function") glowAt(w.x, w.y, 0.4, 40, "120,220,255", 0.35);
}
// 키 큰 버섯 (나무 자리): 갈색 줄기 + 분홍·주황·보라 갓 (자리마다 같은 색)
function drawBigShroom(t) {
  const caps = ["#ff9ad6", "#ffb04a", "#b08aff"], col = caps[Math.abs(Math.floor(t.x * 7 + t.y * 3)) % caps.length];
  drawBox(t.x - 0.2, t.y - 0.2, 0, 0.4, 0.4, 1.5, "#a07a58");
  drawBox(t.x - 0.85, t.y - 0.85, 1.5, 1.7, 1.7, 0.45, col);
  drawBox(t.x - 0.5, t.y - 0.5, 1.95, 1.0, 1.0, 0.2, col);
  drawBox(t.x - 0.5, t.y + 0.2, 1.62, 0.16, 0.16, 0.06, "#fff0f8");
  drawBox(t.x + 0.25, t.y - 0.4, 1.62, 0.16, 0.16, 0.06, "#fff0f8");
}
const UNDER_FLOWERS = ["#7fe0ff", "#b08aff", "#ff9ad6", "#c8ff7a"]; // 작은 수정·작은 버섯·반딧불 점
// 반딧불 (월드 2 물방울 자리, 노랑·연두)
hookOn("playersUpdated", (dt) => {
  if (game.scene !== "lobby" || curWorld() !== 4) return;
  if (Math.random() < (dt || 1 / 60) * 6) {
    const x = 1.5 + Math.random() * (LOBBY.width - 3), y = 1.5 + Math.random() * (LOBBY.height - 3);
    addSparkle(x, y, 0.4 + Math.random() * 1.2, { vz: 0.3, gravity: -0.05, life: 2.4, size: 0.4, hue: 70 + Math.random() * 40 });
  }
}, 70);

// ===== 공정성: 어둠은 위험을 숨기지 않아요 (설계서 1-2-1, 월드 2 2-3-⑦ 과 같은 규칙) =====
hookOn("lights", (lights) => {
  if (!inUnderDungeon() || typeof casts === "undefined") return;
  const per = {};
  for (const c of casts) {
    if (!c || !c.ab || (c.m && (c.m.pid || c.m === game.player || c.m.ally))) continue; // 주인공들(친구 포함)·동료 기술은 빼요
    per[c.id] = (per[c.id] || 0) + 1; if (per[c.id] > 3) continue;
    const sh = c.ab.telegraph.shape;
    if (sh === "line") for (const t of [0, 0.5, 1]) lights.push({ x: c.x + c.dirX * c.length * t, y: c.y + c.dirY * c.length * t, radius: c.width / 2 + 1.0, power: 0.75 });
    else if (sh === "cone") lights.push({ x: c.x + c.dirX * c.length * 0.5, y: c.y + c.dirY * c.length * 0.5, radius: c.length * 0.6, power: 0.75 });
    else lights.push({ x: c.x, y: c.y, radius: (c.radius || 1.5) + 0.6, power: 0.8 });
  }
}, 60);
