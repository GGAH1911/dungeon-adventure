// ===== 월드 5 "공허": 맵 15개, 월드 정보, 고요 섬 겉모습, 공허 지도 (설계서 docs/design/world5-void.md 0·3장) =====
// 레벨: 월드 4 마지막(지하 왕궁 Lv 113) + 3 = 116 에서 맵마다 2.55 (월드 4 와 같은 공식) -> 15번째 블랙홀 Lv 152
// 순서: 메아리 섬 11개 → 잊힌 성 · 깊은 꿈 바다(메아리 13개) → 14 틈새(틈새 거인) → 15 별을 삼키는 곳(블랙홀 꿀꺽이, bosses_w5hole.js)
// 맵 몬스터(w5_*)는 mobs_w5.js, 환경(features)은 void_env.js, 보스는 bosses_w5echo.js · bosses_w5rift.js, 탑은 voidtower.js
// 월드 5는 마지막 월드가 아니에요: WORLD_ORDER 에 붙기만 해요 (월드 6 도 같은 방법으로 붙어요)

const W5_START = 116;
const W5_MAPS = [
  { id: "graybloom", name: "회색 꽃 섬", desc: "색이 빠진 꽃 섬! 색 수정을 때리면 색이 돌아와요", key: ["guardian"],
    size: 64, rooms: 13, count: 36, reward: 420, features: { crystals: 14 },
    monsters: { w5_wisp: 4, w5_dustBunny: 3, w5_grayJelly: 2, w5_echoBat: 2, thief: 1 },
    theme: { floor: "#8a8a96", moss: "#c8b8e8", wall: "#4e4e5c", darkness: 0.42, bg: "#0a0a12" } },
  { id: "mistshore", name: "안개 바닷가", desc: "안개 낀 바닷가. 깜깜한 공허 구멍은 다리로 건너요", key: ["shards", "mimic"],
    size: 64, rooms: 13, count: 36, reward: 430, features: { crystals: 6, holes: 4 },
    monsters: { w5_wisp: 2, w5_dustBunny: 2, w5_hushTurtle: 2, w5_grayJelly: 2, w5_echoBat: 2, thief: 1 },
    theme: { floor: "#8a929a", moss: "#a8d0d8", wall: "#4a525c", darkness: 0.44, bg: "#08101a" } },
  { id: "hushcrater", name: "쉿 분화구", desc: "깜빡이는 다리! 깜빡깜빡하면 곧 사라져요", key: ["levers"],
    size: 66, rooms: 14, count: 36, reward: 440, features: { holes: 6, blink: true, crystals: 4 },
    monsters: { w5_dustBunny: 3, w5_hushTurtle: 2, w5_lampGhost: 2, w5_wisp: 2, w5_echoBat: 2, thief: 1 },
    theme: { floor: "#9090a0", moss: "#d0c8b0", wall: "#525060", darkness: 0.4, bg: "#0c0a10" } },
  { id: "echowood", name: "메아리 숲", desc: "흐릿한 그림자 꼬마가 숨어 있어요. 종을 치면 딩~ 들켜요", key: ["hold", "twins"],
    size: 66, rooms: 14, count: 38, reward: 450, features: { bells: 7, crystals: 4 },
    monsters: { w5_shadeKid: 4, w5_wisp: 2, w5_echoBat: 2, w5_grayJelly: 2, w5_dustBunny: 1, thief: 1 },
    theme: { floor: "#7e8a80", moss: "#b8d8b0", wall: "#465248", darkness: 0.5, bg: "#060c08" } },
  { id: "stonegarden", name: "조용한 돌 정원", desc: "그림자 웅덩이를 지나면 내 그림자 분신이 따라와요!", key: ["plates", "mimic"],
    size: 66, rooms: 14, count: 38, reward: 460, features: { puddles: 8, crystals: 4 },
    monsters: { w5_hushTurtle: 3, w5_lampGhost: 2, w5_grayJelly: 2, w5_wisp: 2, w5_dustBunny: 2, thief: 1 },
    theme: { floor: "#9a968c", moss: "#c8c0a8", wall: "#5a564c", darkness: 0.42, bg: "#0c0c0a" } },
  { id: "moonless", name: "달 없는 들판", desc: "달이 없는 깜깜한 들판. 수정과 종으로 그림자를 찾아요", key: ["dark", "mimic"],
    size: 66, rooms: 14, count: 36, reward: 470, features: { crystals: 16, bells: 4 },
    monsters: { w5_shadeKid: 3, w5_shadeKnight: 1, w5_wisp: 3, w5_echoBat: 2, w5_lampGhost: 1, thief: 1 },
    theme: { floor: "#6a6a7e", moss: "#9a9ac8", wall: "#3a3a4e", darkness: 0.66, bg: "#04040a" } },
  { id: "sandglass", name: "모래시계 언덕", desc: "색 수정을 켜면 구멍 위에 무지개 다리가 생겨요", key: ["torches", "guardian"],
    size: 68, rooms: 14, count: 38, reward: 480, features: { holes: 6, blink: true, colorBridges: true, crystals: 8 },
    monsters: { w5_dustBunny: 3, w5_lampGhost: 2, w5_hushTurtle: 2, w5_grayJelly: 2, w5_wisp: 2, thief: 1 },
    theme: { floor: "#a49a88", moss: "#d8c898", wall: "#5e5648", darkness: 0.4, bg: "#0e0c08" } },
  { id: "driftship", name: "떠도는 별배", desc: "공허를 떠도는 별배! 그림자 분신과 그림자 기사를 조심", key: ["traphall", "twins"],
    size: 68, rooms: 15, count: 38, reward: 490, features: { puddles: 8, crystals: 8, bells: 2 },
    monsters: { w5_shadeKnight: 2, w5_shadeKid: 2, w5_lampGhost: 2, w5_echoBat: 2, w5_hushTurtle: 1, thief: 1 },
    theme: { floor: "#848aa0", moss: "#a8b8e8", wall: "#46485e", darkness: 0.48, bg: "#060812" } },
  { id: "ashforge", name: "잿빛 대장간", desc: "불이 꺼진 대장간. 구멍 사이 다리와 종이 있어요", key: ["memory", "plates", "crackwall"],
    size: 68, rooms: 15, count: 40, reward: 505, features: { holes: 5, blink: true, bells: 4, crystals: 4 },
    monsters: { w5_hushTurtle: 2, w5_shadeKnight: 2, w5_grayJelly: 2, w5_lampGhost: 2, w5_dustBunny: 2, thief: 1 },
    theme: { floor: "#8a8482", moss: "#c8a890", wall: "#4e4644", darkness: 0.44, bg: "#0e0a08" } },
  { id: "frostdream", name: "꽁꽁 꿈 호수", desc: "꽁꽁 언 꿈 호수. 종·수정·그림자가 다 있어요", key: ["torches", "hold"],
    size: 70, rooms: 15, count: 40, reward: 520, features: { bells: 4, crystals: 8, puddles: 5 },
    monsters: { w5_shadeKid: 3, w5_shadeKnight: 1, w5_wisp: 2, w5_echoBat: 2, w5_hushTurtle: 2, thief: 1 },
    theme: { floor: "#9aa4b0", moss: "#c8e0f0", wall: "#56606c", darkness: 0.42, bg: "#060a10" } },
  { id: "emberwing", name: "잿불 하늘길", desc: "하늘에 뜬 길! 구멍·다리·분신을 조심해요", key: ["thief", "mimic", "twins"],
    size: 70, rooms: 15, count: 40, reward: 535, features: { holes: 4, blink: true, crystals: 6, bells: 3, puddles: 4 },
    monsters: { w5_lampGhost: 3, w5_shadeKnight: 2, w5_dustBunny: 2, w5_echoBat: 2, w5_shadeKid: 2, thief: 1 },
    theme: { floor: "#968a8a", moss: "#e0b0a0", wall: "#544a4a", darkness: 0.46, bg: "#100808" } },
  { id: "forgotkeep", name: "잊힌 성", desc: "아무도 기억하지 못하는 회색 성. 종을 치면 숨은 그림자 기사가 들켜요", key: ["levers", "crackwall"],
    size: 70, rooms: 15, count: 40, reward: 545, features: { bells: 5, crystals: 6, holes: 3, blink: true },
    monsters: { w5_shadeKnight: 3, w5_shadeKid: 2, w5_hushTurtle: 2, w5_lampGhost: 2, w5_echoBat: 1, thief: 1 },
    theme: { floor: "#8a8496", moss: "#b8b0d8", wall: "#4a4458", darkness: 0.5, bg: "#08060e" } },
  { id: "dreamdeep", name: "깊은 꿈 바다", desc: "꿈이 가라앉은 바다. 그림자 웅덩이와 사라지는 다리를 조심", key: ["plates", "mimic", "twins"],
    size: 72, rooms: 16, count: 42, reward: 552, features: { holes: 4, blink: true, colorBridges: true, crystals: 8, puddles: 5 },
    monsters: { w5_grayJelly: 3, w5_wisp: 2, w5_shadeKid: 2, w5_lampGhost: 2, w5_hushTurtle: 2, thief: 1 },
    theme: { floor: "#7a8496", moss: "#a0c0e8", wall: "#404a5c", darkness: 0.52, bg: "#04080e" } },
  { id: "rift", name: "틈새", desc: "공허의 틈새. 틈새 거인이 기다려요", key: ["levers", "hold", "twins"],
    size: 72, rooms: 16, count: 42, reward: 560, features: { holes: 3, blink: true, colorBridges: true, crystals: 8, bells: 3, puddles: 4 },
    monsters: { w5_shadeKnight: 2, w5_shadeKid: 2, w5_lampGhost: 2, w5_hushTurtle: 2, w5_grayJelly: 1, w5_dustBunny: 1, w5_echoBat: 1, thief: 1 },
    theme: { floor: "#7a7488", moss: "#d8c0ff", wall: "#403a50", darkness: 0.55, bg: "#06040c" } },
  { id: "starmaw", name: "별을 삼키는 곳", desc: "틈새 너머! 블랙홀이 별과 색을 빨아들여요. 빨아들일 땐 초록 별 자리로 숨어요", key: ["hold", "levers", "twins"],
    size: 72, rooms: 16, count: 44, reward: 600, features: { holes: 3, blink: true, crystals: 10, bells: 3, puddles: 4 },
    monsters: { w5_shadeKnight: 3, w5_shadeKid: 2, w5_lampGhost: 2, w5_grayJelly: 2, w5_wisp: 2, w5_echoBat: 1, thief: 1 },
    theme: { floor: "#6a6478", moss: "#c8a8ff", wall: "#2e283e", darkness: 0.6, bg: "#030208" } },
];
W5_MAPS.forEach((m, i) => { m.world = 5; m.minLevel = W5_START + Math.round(i * 2.55); m.unlockAfter = i ? W5_MAPS[i - 1].id : "underthrone"; MAPS.push(m); });

// 월드 5 정보 (월드 4 마지막 보스 부글대왕을 물리치면 포탈로 가요)
WORLDS[5] = {
  id: 5, name: "공허", camp: "고요 섬", mapTitle: "공허 지도", unlockAfter: "underthrone",
  lobbyTheme: { floor: "#7a7a86", moss: "#b8a8d8", wall: "#4a4a58", path: "#9a96a8", darkness: 0.4, bg: "#05040a" },
};
if (!WORLD_ORDER.includes(5)) WORLD_ORDER.push(5);
if (typeof WORLD_HUE !== "undefined") WORLD_HUE[5] = 270;
if (typeof PORTAL_STONE !== "undefined") PORTAL_STONE[5] = ["#8a8a96", "#5a5a68"];
if (typeof PORTAL_SWIRL !== "undefined") PORTAL_SWIRL[5] = ["#ffffff", "#b8a8d8", "#3a2a5a"];

function inVoidDungeon() { return typeof inWorld5 === "function" && inWorld5(); }

// 모험 지도 자리 (공허 지도 2400×1600: 떠 있는 섬들을 별빛 다리로 이어요, 왼쪽 위 → 오른쪽 아래 틈새)
if (typeof WORLD_PLACES !== "undefined") Object.assign(WORLD_PLACES, {
  graybloom: { x: 360, y: 300 }, mistshore: { x: 760, y: 220 }, hushcrater: { x: 1160, y: 320 },
  echowood: { x: 1580, y: 240 }, stonegarden: { x: 1980, y: 380 }, moonless: { x: 1700, y: 660 },
  sandglass: { x: 1260, y: 700 }, driftship: { x: 820, y: 780 }, ashforge: { x: 420, y: 1020 },
  frostdream: { x: 860, y: 1240 }, emberwing: { x: 1300, y: 1140 }, forgotkeep: { x: 1640, y: 1000 },
  dreamdeep: { x: 1580, y: 1380 }, rift: { x: 1960, y: 1240 }, starmaw: { x: 2200, y: 1420 },
  voidtower: { x: 2180, y: 760 },
});

// ===== 공허 지도 (모험 지도 배경, 한 번만 그려요): 짙은 남보라 하늘 + 별 + 회색 섬 그림자 =====
function buildVoidTerrain() {
  const c = document.createElement("canvas");
  c.width = WORLD_W; c.height = WORLD_H;
  const g = c.getContext("2d");
  const rand = makeRandom(20261005);
  const sky = g.createLinearGradient(0, 0, 0, WORLD_H); sky.addColorStop(0, "#1a1630"); sky.addColorStop(1, "#0a0814");
  g.fillStyle = sky; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 260; i++) { const a = 0.3 + rand() * 0.6; g.fillStyle = `rgba(230,224,255,${a})`; const s = 1 + rand() * 2.5; g.fillRect(rand() * WORLD_W, rand() * WORLD_H, s, s); }
  // 떠 있는 회색 섬 그림자
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${110 + rand() * 30},${108 + rand() * 30},${130 + rand() * 30},0.35)`; g.beginPath(); g.ellipse(rand() * WORLD_W, rand() * WORLD_H, 60 + rand() * 120, 24 + rand() * 40, 0, 0, Math.PI * 2); g.fill(); }
  // 별빛 다리 (섬 순서대로 점선)
  g.strokeStyle = "rgba(220,210,255,0.55)"; g.lineWidth = 6; g.setLineDash([14, 12]); g.beginPath();
  W5_MAPS.forEach((m, i) => { const p = WORLD_PLACES[m.id]; if (p) (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); });
  g.stroke(); g.setLineDash([]);
  // 틈새 (오른쪽 아래, 별빛이 새어 나와요) + 그 너머 블랙홀 (어두운 소용돌이)
  const h = WORLD_PLACES.starmaw || { x: 2200, y: 1420 };
  const dark = g.createRadialGradient(h.x, h.y, 10, h.x, h.y, 200); dark.addColorStop(0, "rgba(0,0,0,0.85)"); dark.addColorStop(0.5, "rgba(80,40,120,0.4)"); dark.addColorStop(1, "rgba(80,40,120,0)");
  g.fillStyle = dark; g.fillRect(h.x - 200, h.y - 200, 400, 400);
  const r = WORLD_PLACES.rift || { x: 1960, y: 1240 };
  const glow = g.createRadialGradient(r.x, r.y, 10, r.x, r.y, 260); glow.addColorStop(0, "rgba(255,250,220,0.5)"); glow.addColorStop(1, "rgba(255,250,220,0)");
  g.fillStyle = glow; g.fillRect(r.x - 260, r.y - 260, 520, 520);
  return c;
}
if (typeof buildTerrain === "function") {
  const buildTerrainPrevW5 = buildTerrain;
  buildTerrain = function () { return typeof curWorld === "function" && curWorld() === 5 ? buildVoidTerrain() : buildTerrainPrevW5(); };
}

// 공허 맵 그림 (지도 위 장소): 회색 섬 받침 + 맵마다 작은 표시
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (mapWorld(m) !== 5 || m.type === "tower") return false;
  const g = ctx, C = (c) => (typeof greyish === "function" ? greyish(c, locked) : c);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(10,8,20,0.75)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(10,8,20,0.6)"; g.lineWidth = 1.2; g.stroke(); };
  // 떠 있는 섬 (아래가 뾰족)
  g.fillStyle = C("#6a6a7a"); g.beginPath(); g.moveTo(x - 22 * s, y - 4 * s); g.lineTo(x + 22 * s, y - 4 * s); g.lineTo(x + 6 * s, y + 12 * s); g.lineTo(x - 4 * s, y + 14 * s); g.closePath(); g.fill();
  rect(-22, -8, 44, 5, C("#9a9aa8"));
  switch (m.id) {
    case "graybloom": for (const ox of [-10, 0, 10]) { rect(ox - 1, -18, 2, 10, C("#7a8a70")); circ(ox, -20, 4, C("#c8b8e8")); } break;
    case "mistshore": rect(-16, -14, 32, 6, C("#a8d0d8")); circ(-6, -18, 5, C("#e0e8ee")); circ(6, -20, 6, C("#e0e8ee")); break;
    case "hushcrater": circ(0, -12, 10, C("#9090a0")); circ(0, -12, 5, C("#1a1626")); break;
    case "echowood": for (const ox of [-10, 8]) { rect(ox - 2, -22, 4, 14, C("#6a5a4a")); circ(ox, -24, 7, C("#9ab090")); } rect(-1, -18, 4, 6, C("#ffd060")); break;
    case "stonegarden": rect(-14, -20, 8, 12, C("#a8a090")); rect(4, -16, 10, 8, C("#a8a090")); circ(0, -10, 4, C("#2a2436")); break;
    case "moonless": circ(0, -18, 8, C("#2a2a40")); circ(3, -20, 7, C("#6a6a7e")); break;
    case "sandglass": rect(-6, -26, 12, 3, C("#c8b890")); rect(-6, -10, 12, 3, C("#c8b890")); g.fillStyle = C("#e0d0a0"); g.beginPath(); g.moveTo(x - 5 * s, y - 23 * s); g.lineTo(x + 5 * s, y - 23 * s); g.lineTo(x, y - 17 * s); g.lineTo(x + 5 * s, y - 11 * s); g.lineTo(x - 5 * s, y - 11 * s); g.lineTo(x, y - 17 * s); g.closePath(); g.fill(); break;
    case "driftship": rect(-16, -14, 32, 6, C("#8a7a6a")); rect(-1, -30, 2, 16, C("#6a5a4a")); g.fillStyle = C("#d8d0f0"); g.beginPath(); g.moveTo(x + 1 * s, y - 30 * s); g.lineTo(x + 12 * s, y - 18 * s); g.lineTo(x + 1 * s, y - 18 * s); g.closePath(); g.fill(); break;
    case "ashforge": rect(-12, -20, 24, 12, C("#6a6264")); rect(-4, -30, 6, 10, C("#4e4644")); rect(-6, -16, 12, 5, C("#c8a890")); break;
    case "frostdream": rect(-16, -12, 32, 4, C("#c8e0f0")); for (const ox of [-8, 0, 8]) rect(ox - 2, -22, 4, 10, C("#e8f4ff")); break;
    case "emberwing": circ(-8, -16, 6, C("#e0b0a0")); circ(8, -18, 7, C("#f0c8a8")); rect(-2, -14, 4, 6, C("#ffb070")); break;
    case "forgotkeep": rect(-14, -22, 28, 14, C("#7a7488")); for (const ox of [-14, -2, 10]) rect(ox, -28, 4, 6, C("#8a84a0")); rect(-3, -16, 6, 8, C("#2a2436")); break;
    case "dreamdeep": rect(-18, -12, 36, 4, C("#6a90c0")); circ(-6, -18, 4, C("#c8d8ff")); circ(7, -20, 3, C("#c8d8ff")); circ(0, -24, 2, C("#fff6d8")); break;
    case "rift": rect(-14, -30, 28, 22, C("#403a50")); rect(-2, -28, 4, 18, C("#fff6d8")); break;
    case "starmaw": circ(0, -18, 13, C("#ffb070")); circ(0, -18, 10, C("#8a50c0")); circ(0, -18, 7, C("#000000")); circ(-2.5, -19, 1.6, C("#ffffff")); circ(2.5, -19, 1.6, C("#ffffff")); break;
    default: circ(0, -14, 10, C("#9a9aa8"));
  }
  return true;
}, 50);

// ===== 고요 섬 겉모습 (lobby.js WORLD_LOOK 등록부: 자리는 그대로, 겉모습만) =====
// 회색 민들레: 공허 맵을 깰수록 색이 돌아와요 (깬 맵 수 / 15 만큼)
const W5_FLOWER_COLORS = ["#ffdf5a", "#ff9ad6", "#9fe8ff", "#c8ff7a"];
function w5CampProgress() {
  const pr = game.profile;
  return pr && Array.isArray(pr.cleared) ? W5_MAPS.filter((m) => pr.cleared.includes(m.id)).length / W5_MAPS.length : 0;
}
function w5FlowerColors() { const k = 1 - w5CampProgress(); return W5_FLOWER_COLORS.map((c) => w5Gray(c, 0.15 + 0.8 * k)); }
// 별빛 등불 (모닥불 자리): 둥실 떠 있는 별 + 돌 받침
function drawStarLamp(f) {
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; drawBox(f.x + Math.cos(a) * 0.55 - 0.13, f.y + Math.sin(a) * 0.55 - 0.13, 0, 0.26, 0.26, 0.16, i % 2 ? "#6a6a78" : "#7a7a88"); }
  const bob = Math.sin(game.time * 1.8) * 0.08;
  drawBox(f.x - 0.22, f.y - 0.22, 0.9 + bob, 0.44, 0.44, 0.44, "#fff6d8");
  for (const [dx, dy, dz] of [[0.3, 0, 0.1], [-0.3, 0, 0.1], [0, 0.3, 0.1], [0, -0.3, 0.1], [0, 0, 0.42], [0, 0, -0.22]]) drawBox(f.x + dx - 0.08, f.y + dy - 0.08, 1.02 + dz + bob, 0.16, 0.16, 0.16, "#ffe9a8");
  if (typeof glowAt === "function") glowAt(f.x, f.y, 1.1, 80, "255,240,200", 0.45);
}
// 고요 웅덩이 (우물 자리): 별이 비치는 잔잔한 웅덩이
function drawStillPool(w) {
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; drawBox(w.x + Math.cos(a) * 0.78 - 0.15, w.y + Math.sin(a) * 0.78 - 0.15, 0, 0.3, 0.3, 0.2, i % 2 ? "#6a6a78" : "#7e7e8c"); }
  drawBox(w.x - 0.6, w.y - 0.6, 0, 1.2, 1.2, 0.05, "#2a2448");
  for (const [dx, dy] of [[-0.2, 0.1], [0.25, -0.2], [0.05, 0.3]]) if (Math.sin(game.time * 2 + dx * 9) > 0) drawBox(w.x + dx - 0.04, w.y + dy - 0.04, 0.05, 0.08, 0.08, 0.02, "#fff6d8");
  if (typeof glowAt === "function") glowAt(w.x, w.y, 0.3, 40, "190,170,255", 0.3);
}
// 회색 민들레 나무 (나무 자리): 하얀 솜털 공 (깬 만큼 연보라가 돌아와요)
function drawGrayDandelion(t) {
  const col = w5Gray("#e8d8ff", 0.2 + 0.8 * (1 - w5CampProgress()));
  drawBox(t.x - 0.08, t.y - 0.08, 0, 0.16, 0.16, 1.6, "#7a8a70");
  drawBox(t.x - 0.65, t.y - 0.65, 1.5, 1.3, 1.3, 1.2, col);
  drawBox(t.x - 0.45, t.y - 0.45, 2.7, 0.9, 0.9, 0.2, col);
  if (Math.random() < 0.01) addSparkle(t.x, t.y, 2.2, { vx: 0.6, vz: 0.2, gravity: -0.05, life: 3, size: 0.35, hue: 270 });
}
if (typeof WORLD_LOOK !== "undefined") WORLD_LOOK[5] = {
  flowers: w5FlowerColors,
  merchant: { skin: "#e0c8b8", hair: "#a8a0c0", shirt: "#8a86a0", pants: "#4a4858", eyes: "#2a2240" },   // 별 망토 상인
  smith: { skin: "#d9b8a0", hair: "#d8d8e0", shirt: "#6a6878", pants: "#3a3846", eyes: "#2a2240" },      // 회색 대장장이 할아버지
  tree: drawGrayDandelion, fire: drawStarLamp, well: drawStillPool, wellLabel: "소원 고요 웅덩이",
};
// 별빛 반짝이 (고요 섬 하늘)
hookOn("playersUpdated", (dt) => {
  if (game.scene !== "lobby" || curWorld() !== 5) return;
  if (Math.random() < (dt || 1 / 60) * 5) {
    const x = 1.5 + Math.random() * (LOBBY.width - 3), y = 1.5 + Math.random() * (LOBBY.height - 3);
    addSparkle(x, y, 1 + Math.random() * 1.5, { vz: 0.1, gravity: 0, life: 2.2, size: 0.35, hue: 260 + Math.random() * 40 });
  }
}, 70);

// ===== 공정성: 어둠은 위험을 숨기지 않아요 (공허 맵·보스방·공허 탑: 예고 자리에 빛) =====
hookOn("lights", (lights) => {
  if (!inVoidDungeon() || typeof casts === "undefined") return;
  const per = {};
  for (const c of casts) {
    if (!c || !c.ab || (c.m && (c.m.pid || c.m === game.player || c.m.ally))) continue;
    per[c.id] = (per[c.id] || 0) + 1; if (per[c.id] > 3) continue;
    const sh = c.ab.telegraph.shape;
    if (sh === "line") for (const t of [0, 0.5, 1]) lights.push({ x: c.x + c.dirX * c.length * t, y: c.y + c.dirY * c.length * t, radius: c.width / 2 + 1.0, power: 0.75 });
    else if (sh === "cone") lights.push({ x: c.x + c.dirX * c.length * 0.5, y: c.y + c.dirY * c.length * 0.5, radius: c.length * 0.6, power: 0.75 });
    else lights.push({ x: c.x, y: c.y, radius: (c.radius || 1.5) + 0.6, power: 0.8 });
  }
}, 60);
