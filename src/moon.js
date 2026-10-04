// ===== 월드 3 "달": 맵 14개, 월드 정보 (설계서 docs/design/world3-moon.md 2장) =====
// 맵 몬스터(w3_*)는 mobs_w3.js, 환경(features)은 moon_env.js, 보스는 bosses_w3a~d.js

const W3_MAPS = [
  { world: 3, unlockAfter: "abyss", key: ["guardian"],
    id: "moonbase", name: "달 기지 앞마당", desc: "몸이 가벼워요! 구르면 쭉 멀리 가요",
    minLevel: 55, size: 64, rooms: 13, count: 34, reward: 235, features: { lowgrav: 5, domes: 2 },
    monsters: { w3_robot: 3, w3_dustBall: 3, w3_rockling: 2, w3_moonBunny: 2, w3_alien: 1, thief: 1 },
    theme: { floor: "#b8b8c4", moss: "#d0d4e4", wall: "#6a6a80", darkness: 0.3, bg: "#05060f" } },
  { world: 3, unlockAfter: "moonbase", key: ["shards", "mimic"],
    id: "dustsea", name: "고요한 먼지 바다", desc: "푹신한 달먼지! 밟으면 느려지고 발자국이 남아요",
    minLevel: 57, size: 64, rooms: 13, count: 34, reward: 245, features: { dust: 10, domes: 2 },
    monsters: { w3_dustBall: 3, w3_crystalBug: 2, w3_rockling: 2, w3_moonBunny: 2, w3_robot: 1, thief: 1 },
    theme: { floor: "#a8a49a", moss: "#c8c0ae", wall: "#5e5a52", darkness: 0.32, bg: "#06060a" } },
  { world: 3, unlockAfter: "dustsea", key: ["plates", "guardian"],
    id: "craterfield", name: "크레이터 들판", desc: "움푹한 크레이터! 들어가면 가운데로 미끄러져요",
    minLevel: 59, size: 66, rooms: 13, count: 36, reward: 255, features: { craters: 12, lowgrav: 2 },
    monsters: { w3_rockling: 3, w3_dustBall: 2, w3_robot: 2, w3_crystalBug: 2, w3_alien: 1, thief: 1 },
    theme: { floor: "#9a9aa8", moss: "#b8b8c8", wall: "#585868", darkness: 0.34, bg: "#05050c" } },
  { world: 3, unlockAfter: "craterfield", key: ["padHop", "twins"],
    id: "rabbitvale", name: "달토끼 떡방아 마을", desc: "통통 점프대를 밟으면 붕! 떡방아 소리가 쿵쿵",
    minLevel: 61, size: 66, rooms: 14, count: 36, reward: 265, features: { pads: 9, lowgrav: 2 },
    monsters: { w3_moonBunny: 4, w3_dustBall: 2, w3_starWisp: 2, w3_robot: 1, w3_alien: 1, thief: 1 },
    theme: { floor: "#d8d4c8", moss: "#f2c8d8", wall: "#7a6a7a", darkness: 0.25, bg: "#0a0812" } },
  { world: 3, unlockAfter: "rabbitvale", key: ["dark", "levers"],
    id: "crystalcave", name: "반짝 수정 동굴", desc: "깜깜한 동굴, 지구빛 수정만 반짝여요",
    minLevel: 63, size: 66, rooms: 14, count: 36, reward: 275, features: { earthlight: 30 },
    monsters: { w3_crystalBug: 3, w3_starWisp: 3, w3_gearSpider: 2, w3_rockling: 1, w3_alien: 1, thief: 1 },
    theme: { floor: "#3a3a5a", moss: "#9fe8ff", wall: "#24243e", darkness: 0.7, bg: "#020208" } },
  { world: 3, unlockAfter: "crystalcave", key: ["starCatch", "crackwall"],
    id: "meteorhill", name: "별똥별 언덕", desc: "하늘에서 별똥별이 쿵! 그림자를 보고 피해요",
    minLevel: 65, size: 68, rooms: 14, count: 38, reward: 285, features: { meteors: 12, domes: 2 },
    monsters: { w3_rockling: 3, w3_starWisp: 2, w3_robot: 2, w3_moonBunny: 2, w3_ufo: 1, thief: 1 },
    theme: { floor: "#8a7a88", moss: "#ffb87a", wall: "#4e4250", darkness: 0.38, bg: "#0c0610" } },
  { world: 3, unlockAfter: "meteorhill", key: ["traphall", "levers", "mimic"],
    id: "ufowreck", name: "부서진 우주선", desc: "떨어진 우주선 안! 점프대로 붕붕 건너요",
    minLevel: 67, size: 68, rooms: 14, count: 38, reward: 295, features: { lowgrav: 4, pads: 6 },
    monsters: { w3_alien: 3, w3_ufo: 2, w3_robot: 2, w3_gearSpider: 2, w3_dustBall: 1, thief: 1 },
    theme: { floor: "#8a96a0", moss: "#7dffb0", wall: "#4a5662", darkness: 0.4, bg: "#04080a" } },
  { world: 3, unlockAfter: "ufowreck", key: ["dark", "torches"],
    id: "darkside", name: "달의 뒷면", desc: "해가 안 드는 깜깜한 쪽! 지구빛 탑 곁에 있어요",
    minLevel: 69, size: 68, rooms: 14, count: 36, reward: 305, features: { earthlight: 24, towers: 5 },
    monsters: { w3_shadowWolf: 3, w3_starWisp: 2, w3_crystalBug: 2, w3_gearSpider: 2, w3_alien: 1, thief: 1 },
    theme: { floor: "#2e2e3e", moss: "#6f8fff", wall: "#1a1a28", darkness: 0.78, bg: "#010104" } },
  { world: 3, unlockAfter: "darkside", key: ["thief", "shards"],
    id: "cheesevale", name: "치즈 바위 골짜기", desc: "노란 구멍 바위 사이로 쥐들이 쪼르르",
    minLevel: 71, size: 70, rooms: 15, count: 40, reward: 315, features: { craters: 8, dust: 6 },
    monsters: { w3_moonRat: 4, w3_rockling: 2, w3_dustBall: 2, w3_moonBunny: 1, w3_ufo: 1, thief: 1 },
    theme: { floor: "#d8c070", moss: "#f2d88a", wall: "#9a7a3a", darkness: 0.3, bg: "#0e0a02" } },
  { world: 3, unlockAfter: "cheesevale", key: ["crackwall", "hold", "twins"],
    id: "starmine", name: "별가루 광산", desc: "반짝이는 별가루를 캐는 광산, 수레 레일이 쭉",
    minLevel: 73, size: 70, rooms: 15, count: 40, reward: 325, features: { dust: 6, earthlight: 12 },
    monsters: { w3_robot: 3, w3_crystalBug: 2, w3_gearSpider: 2, w3_rockling: 2, w3_moonRat: 1, thief: 1 },
    theme: { floor: "#5a5268", moss: "#ffe27a", wall: "#3a3448", darkness: 0.55, bg: "#06040a" } },
  { world: 3, unlockAfter: "starmine", key: ["levers", "memory"],
    id: "lunarlab", name: "달 연구소", desc: "삐삐 실험실! 별똥별이 지붕을 뚫고 떨어져요",
    minLevel: 75, size: 70, rooms: 15, count: 40, reward: 335, features: { lowgrav: 4, meteors: 8 },
    monsters: { w3_robot: 3, w3_ufo: 2, w3_alien: 2, w3_gearSpider: 2, w3_starWisp: 1, thief: 1 },
    theme: { floor: "#c8ccd8", moss: "#7fd0ff", wall: "#7a8090", darkness: 0.3, bg: "#06080e" } },
  { world: 3, unlockAfter: "lunarlab", key: ["torches", "twins"],
    id: "eclipse", name: "일식 신전", desc: "해가 가려지면 깜깜! 다시 밝아질 때까지 등불 곁에",
    minLevel: 77, size: 72, rooms: 15, count: 40, reward: 345, features: { earthlight: 16, eclipse: 1 },
    monsters: { w3_shadowWolf: 2, w3_starWisp: 2, w3_moonBunny: 2, w3_ufo: 2, w3_gearSpider: 1, w3_alien: 1, thief: 1 },
    theme: { floor: "#8a6a5a", moss: "#ffd23f", wall: "#4a3028", darkness: 0.4, bg: "#0a0402" } },
  { world: 3, unlockAfter: "eclipse", key: ["padHop", "starCatch"],
    id: "earthview", name: "지구가 보이는 언덕", desc: "푸른 지구가 둥실! 점프대·크레이터·별똥별이 다 있어요",
    minLevel: 79, size: 72, rooms: 16, count: 42, reward: 355, features: { pads: 5, craters: 5, meteors: 6 },
    monsters: { w3_moonBunny: 2, w3_rockling: 2, w3_shadowWolf: 2, w3_ufo: 2, w3_crystalBug: 2, w3_alien: 1, thief: 1 },
    theme: { floor: "#a8b0c0", moss: "#7fb8ff", wall: "#5a6278", darkness: 0.28, bg: "#020814" } },
  { world: 3, unlockAfter: "earthview", key: ["levers", "hold", "twins"],
    id: "mooncastle", name: "달의 궁전", desc: "은빛 궁전 맨 꼭대기, 달의 여왕이 기다려요",
    minLevel: 82, size: 74, rooms: 16, count: 44, reward: 380, features: { lowgrav: 3, dust: 3, craters: 3, pads: 3, earthlight: 10, meteors: 4 },
    monsters: { w3_shadowWolf: 2, w3_ufo: 2, w3_gearSpider: 2, w3_robot: 2, w3_moonRat: 1, w3_crystalBug: 1, w3_alien: 1, w3_moonBunny: 1, w3_starWisp: 1, thief: 1 },
    theme: { floor: "#c8c8dc", moss: "#e0d8ff", wall: "#6a6890", darkness: 0.45, bg: "#04030c" } },
];
for (const m of W3_MAPS) MAPS.push(m);

// 월드 3 정보 (월드 2 마지막 보스 바다 용왕을 잡으면 포탈로 가요)
WORLDS[3] = {
  id: 3, name: "달", camp: "달 마을", mapTitle: "달 지도", unlockAfter: "abyss",
  lobbyTheme: { floor: "#b8b8c8", moss: "#d8d8e8", wall: "#6a6a84", path: "#dcdce8", darkness: 0.42, bg: "#03040c" },
};
if (!WORLD_ORDER.includes(3)) WORLD_ORDER.push(3);

// 모험 지도 자리 (달 지도 2400×1600: 왼쪽 아래 착륙장에서 달을 한 바퀴 돌아 가운데 궁전으로)
Object.assign(WORLD_PLACES, {
  moonbase: { x: 300, y: 1280 }, dustsea: { x: 640, y: 1100 }, craterfield: { x: 980, y: 1300 },
  rabbitvale: { x: 1340, y: 1180 }, crystalcave: { x: 1700, y: 1320 }, meteorhill: { x: 2050, y: 1080 },
  ufowreck: { x: 1960, y: 700 }, darkside: { x: 2100, y: 330 }, cheesevale: { x: 1700, y: 220 },
  starmine: { x: 1300, y: 330 }, lunarlab: { x: 900, y: 220 }, eclipse: { x: 520, y: 380 },
  earthview: { x: 760, y: 700 }, mooncastle: { x: 1260, y: 760 }, moontower: { x: 380, y: 820 },
});

// ===== 달 지도 (모험 지도의 배경, 한 번만 그려요) =====
// mapselect.js 는 월드 2 면 바다 그림, 아니면 buildTerrain() 을 불러요: 월드 3 이면 달 그림을 돌려줘요
function buildMoonTerrain() {
  const c = document.createElement("canvas");
  c.width = WORLD_W; c.height = WORLD_H;
  const g = c.getContext("2d");
  const rand = makeRandom(20261005);
  g.fillStyle = "#05060f"; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.6})`; const r = rand() * 2 + 0.5; g.fillRect(rand() * WORLD_W, rand() * WORLD_H, r, r); }
  // 달 표면 (큰 둥근 땅) + 어두운 뒷면(오른쪽 위)
  noisyBlob(g, WORLD_W / 2, WORLD_H / 2, { x: 1120, y: 760 }, rand, 0.08); g.fillStyle = "#a8aab8"; g.fill();
  noisyBlob(g, 1950, 330, { x: 520, y: 380 }, rand, 0.2); g.fillStyle = "rgba(30,30,50,0.75)"; g.fill();
  noisyBlob(g, 1700, 230, { x: 260, y: 140 }, rand, 0.3); g.fillStyle = "rgba(230,200,110,0.55)"; g.fill(); // 치즈 골짜기
  // 크레이터
  for (let i = 0; i < 70; i++) {
    const x = 200 + rand() * 2000, y = 140 + rand() * 1320, r = 10 + rand() * 50;
    g.fillStyle = "rgba(70,70,90,0.35)"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(230,230,245,0.35)"; g.lineWidth = 3; g.beginPath(); g.arc(x - 2, y - 2, r, Math.PI * 0.9, Math.PI * 1.8); g.stroke();
  }
  // 하늘의 지구 (왼쪽 위)
  g.fillStyle = "#3a7ae0"; g.beginPath(); g.arc(150, 150, 90, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#4fae5a"; for (const [x, y, w, h] of [[110, 110, 50, 30], [160, 170, 40, 40], [130, 200, 30, 16]]) g.fillRect(x, y, w, h);
  g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 8; g.beginPath(); g.arc(150, 150, 70, -0.5, 0.8); g.stroke();
  return c;
}
if (typeof buildTerrain === "function") {
  const buildTerrainW1 = buildTerrain;
  buildTerrain = function () { return typeof curWorld === "function" && curWorld() === 3 ? buildMoonTerrain() : buildTerrainW1(); };
}

// 달 맵 그림 (지도 위 장소)
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (mapWorld(m) !== 3) return false;
  const g = ctx, C = (c) => greyish(c, locked);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(10,10,30,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(10,10,30,0.6)"; g.lineWidth = 1.2; g.stroke(); };
  g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  switch (m.id) {
    case "moonbase": rect(-20, -16, 40, 18, C("#c8ccd8")); circ(0, -18, 12, C("#bfefff")); rect(-2, -38, 4, 12, C("#8a90a0")); break;
    case "dustsea": circ(-8, -6, 14, C("#d8d2c4")); circ(10, -8, 10, C("#c8c0ae")); break;
    case "craterfield": circ(0, -8, 18, C("#8a8a9a")); circ(0, -8, 10, C("#5a5a6a")); break;
    case "rabbitvale": rect(-14, -20, 28, 20, C("#f4f0ea")); rect(-10, -36, 5, 16, C("#f4f0ea")); rect(5, -36, 5, 16, C("#f4f0ea")); break;
    case "crystalcave": for (const [ox, h, c] of [[-12, 24, "#9fe8ff"], [0, 34, "#c8a8ff"], [12, 22, "#7fb8ff"]]) rect(ox - 4, -h, 8, h, C(c)); break;
    case "meteorhill": circ(0, -10, 14, C("#6a6070")); circ(12, -30, 6, C("#ffb87a")); rect(5, -28, 4, 4, C("#fff6c0")); break;
    case "ufowreck": rect(-22, -12, 44, 8, C("#a8b0c8")); circ(0, -16, 10, C("#bfefff")); break;
    case "darkside": circ(0, -12, 16, C("#2e2e44")); rect(-2, -34, 4, 22, C("#8a90a8")); circ(0, -36, 5, C("#7fb8ff")); break;
    case "cheesevale": rect(-18, -18, 36, 18, C("#f2d070")); circ(-6, -10, 3, C("#c8a040")); circ(8, -12, 4, C("#c8a040")); break;
    case "starmine": rect(-18, -16, 36, 16, C("#5a5268")); rect(-10, -26, 20, 10, C("#ffe27a")); break;
    case "lunarlab": rect(-18, -24, 36, 24, C("#c8ccd8")); rect(-6, -16, 12, 8, C("#7fd0ff")); break;
    case "eclipse": circ(0, -14, 14, C("#ffd23f")); circ(5, -16, 12, C("#2a2030")); break;
    case "earthview": circ(0, -16, 15, C("#3a7ae0")); rect(-6, -22, 8, 6, C("#4fae5a")); break;
    case "mooncastle": rect(-18, -24, 36, 24, C("#d8d8ec")); rect(-22, -34, 8, 34, C("#c8c8dc")); rect(14, -34, 8, 34, C("#c8c8dc")); circ(0, -32, 7, C("#fff6c0")); break;
    default: circ(0, -14, 14, C("#c8c8dc"));
  }
  return true;
}, 50);

// ===== 달 마을 겉모습 (lobby.js 가 worldLook() === 3 이면 불러요: 자리는 그대로, 겉모습만) =====
const MOON_LOOK = {
  merchant: { skin: "#f4ece8", hair: "#ffffff", shirt: "#c8a8ff", pants: "#8a78c8", eyes: "#2a1a2a" },
  smith: { skin: "#a8b0c0", hair: "#5a6278", shirt: "#5a6278", pants: "#3a4258", eyes: "#7dffb0" },
};
// 달빛 램프 (모닥불 자리)
function drawMoonLamp(f) {
  drawBox(f.x - 0.3, f.y - 0.3, 0, 0.6, 0.6, 0.15, "#8a8ea0");
  drawBox(f.x - 0.06, f.y - 0.06, 0.15, 0.12, 0.12, 0.7, "#c8ccd8");
  const bob = Math.sin(game.time * 2) * 0.05;
  drawBox(f.x - 0.22, f.y - 0.1, 1.0 + bob, 0.18, 0.2, 0.4, "#ffe27a");
  drawBox(f.x - 0.04, f.y - 0.1, 1.08 + bob, 0.12, 0.2, 0.12, "#fff6c0");
}
// 소원 분화구 (우물 자리)
function drawWishCrater(w) {
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; drawBox(w.x + Math.cos(a) * 0.75 - 0.15, w.y + Math.sin(a) * 0.75 - 0.15, 0, 0.3, 0.3, 0.18, i % 2 ? "#8a8ca0" : "#a0a2b4"); }
  drawBox(w.x - 0.5, w.y - 0.5, 0, 1.0, 1.0, 0.03, "#3a3c50");
  const tw = 0.6 + 0.4 * Math.sin(game.time * 3), c = toScreen(w.x, w.y, 0.4);
  if (typeof drawStar === "function") drawStar(c.x, c.y, 7 * ZOOM * tw, "#fff6c0");
}
// 수정 나무 (나무 자리)
function drawCrystalTree(t) {
  drawBox(t.x - 0.4, t.y - 0.4, 0, 0.8, 0.8, 0.12, "#7a7c90");
  drawBox(t.x - 0.18, t.y - 0.18, 0.12, 0.3, 0.3, 1.6, "#c8a8ff");
  drawBox(t.x + 0.08, t.y - 0.3, 0.12, 0.22, 0.22, 1.1, "#9fe8ff");
  drawBox(t.x - 0.32, t.y + 0.08, 0.12, 0.2, 0.2, 0.8, "#7fb8ff");
}
const MOON_FLOWERS = ["#ffe27a", "#ffb0d0", "#9fe8ff", "#ffffff"];
// 별가루 (월드 2 물방울 자리)
hookOn("playersUpdated", (dt) => {
  if (game.scene !== "lobby" || curWorld() !== 3) return;
  if (Math.random() < (dt || 1 / 60) * 8) {
    const x = 1.5 + Math.random() * (LOBBY.width - 3), y = 1.5 + Math.random() * (LOBBY.height - 3);
    addSparkle(x, y, 0.1, { vz: 0.9 + Math.random() * 0.5, gravity: -0.2, life: 1.6, size: 0.45, hue: 260 });
  }
}, 70);
