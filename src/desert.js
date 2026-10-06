// ===== 월드 6 "색모래 사막": 맵 15개, 월드 정보, 신기루 오아시스 마을 겉모습, 사막 지도 (설계서 docs/design/world6-desert.md) =====
// 레벨: 월드 5 마지막(블랙홀 Lv 152) + 3 = 155 에서 맵마다 2.55 (월드 4·5 와 같은 공식) -> 15번째 Lv 191
// 이야기(docs/design/story.md 월드 6): 틈이 닫히기 전에 본 "별빛도 그림자도 아닌 색"이 사막에 떨어졌어요.
//   그 색이 모래에 스며 "신기루"(예전 보스 모양의 모래 그림자)가 생겼어요. 신기루를 달래면 색모래가 반짝 돌아와요.
//   마지막 15번 "무지개 피라미드"의 새빛 스핑크스 무지냥은 길을 잃은 새 색깔 그 자체예요.
// 맵 몬스터(w6_*)는 mobs_w6.js, 환경(features)은 desert_env.js, 보스는 bosses_w6.js, 탑은 deserttower.js
// 월드 6은 마지막 월드가 아니에요: WORLD_ORDER 에 붙기만 해요 (월드 7 도 같은 방법으로 붙어요)

const W6_START = 155;
const W6_SAND = (floor, moss, wall, dark = 0.26, bg = "#1a1206") => ({ floor, moss, wall, darkness: dark, bg });
const W6_MAPS = [
  { id: "sunsand", name: "햇살 모래 언덕", desc: "따끈한 모래 언덕! 오아시스 물을 마시면 하트가 차요", key: ["guardian"],
    features: { oasis: 3, cactus: 6 }, monsters: { w6_sunWisp: 4, w6_sandBunny: 3, w6_cactusJelly: 3, thief: 1 }, theme: W6_SAND("#d8b878", "#e8d098", "#a8844e") },
  { id: "quicksands", name: "쑥쑥 모래 늪", desc: "모래 늪에 들어가면 쑥쑥 빠지고 느려져요. 빨리 나와요!", key: ["shards", "mimic"],
    features: { quicksand: 5, oasis: 2 }, monsters: { w6_sandBunny: 3, w6_sandMummy: 2, w6_sunWisp: 2, w6_cactusJelly: 2, thief: 1 }, theme: W6_SAND("#c8a868", "#b89858", "#987440") },
  { id: "cactusvale", name: "선인장 골짜기", desc: "선인장은 따끔해요. 살짝 피해서 걸어요", key: ["levers"],
    features: { cactus: 14, oasis: 2 }, monsters: { w6_cactusJelly: 4, w6_sandBat: 3, w6_sunWisp: 2, thief: 1 }, theme: W6_SAND("#d0b070", "#9ac070", "#a08048") },
  { id: "mirageoasis", name: "신기루 오아시스", desc: "반짝이는 오아시스! 진짜 물은 하트를 채워 줘요", key: ["hold", "twins"],
    features: { oasis: 5, quicksand: 2, cactus: 4 }, monsters: { w6_mirageGhost: 3, w6_sandBunny: 2, w6_cactusJelly: 2, w6_sandBat: 2, thief: 1 }, theme: W6_SAND("#d8c088", "#8ad0c8", "#a88a58") },
  { id: "dunecastle", name: "모래성 마을", desc: "커다란 모래성이 줄지어 있는 마을", key: ["plates", "mimic"],
    features: { cactus: 6, quicksand: 3, oasis: 2 }, monsters: { w6_sandMummy: 3, w6_shellTurtle: 2, w6_sunWisp: 2, w6_sandBunny: 2, thief: 1 }, theme: W6_SAND("#e0c48c", "#f0dca8", "#b0905a") },
  { id: "starnight", name: "별빛 사막 밤", desc: "밤 사막! 오아시스 물빛과 별빛을 따라가요", key: ["dark", "mimic"],
    features: { oasis: 4, cactus: 6 }, monsters: { w6_mirageGhost: 3, w6_sandBat: 3, w6_sunWisp: 2, thief: 1 }, theme: W6_SAND("#8a7a6a", "#a8a0d8", "#5a4a3a", 0.58, "#06040e") },
  { id: "scarabhall", name: "쇠똥구리 굴", desc: "데굴데굴 쇠똥구리 굴. 모래 늪을 조심해요", key: ["torches", "guardian"],
    features: { quicksand: 5, cactus: 4 }, monsters: { w6_sandBunny: 3, w6_shellTurtle: 2, w6_sandMummy: 2, w6_cactusJelly: 2, thief: 1 }, theme: W6_SAND("#b89860", "#c8a870", "#8a6a3a", 0.36) },
  { id: "windcanyon", name: "바람 협곡", desc: "모래바람이 부는 협곡. 선인장 사이로 길을 찾아요", key: ["traphall", "twins"],
    features: { cactus: 10, quicksand: 3, oasis: 2 }, monsters: { w6_sandBat: 3, w6_mirageGhost: 2, w6_sandBunny: 2, w6_shellTurtle: 2, thief: 1 }, theme: W6_SAND("#c8a070", "#d8b888", "#946a40") },
  { id: "sunken_temple", name: "모래에 묻힌 신전", desc: "모래에 반쯤 묻힌 옛 신전. 미라가 지켜요", key: ["memory", "plates", "crackwall"],
    features: { quicksand: 4, oasis: 2, cactus: 4 }, monsters: { w6_sandMummy: 4, w6_shellTurtle: 2, w6_mirageGhost: 2, thief: 1 }, theme: W6_SAND("#c0a070", "#d8c090", "#8a6c44", 0.34) },
  { id: "glassdune", name: "유리 모래 언덕", desc: "번개가 떨어진 유리 모래! 반짝반짝", key: ["torches", "hold"],
    features: { cactus: 6, oasis: 3, quicksand: 3 }, monsters: { w6_sunWisp: 3, w6_mirageGhost: 2, w6_cactusJelly: 2, w6_sandBat: 2, thief: 1 }, theme: W6_SAND("#d8d0b8", "#b8e0f0", "#a8a088") },
  { id: "camelroad", name: "낙타 길", desc: "낙타가 다니던 긴 길. 오아시스에서 쉬어 가요", key: ["thief", "mimic", "twins"],
    features: { oasis: 4, cactus: 8, quicksand: 3 }, monsters: { w6_sandBunny: 3, w6_sandMummy: 2, w6_shellTurtle: 2, w6_sunWisp: 2, thief: 1 }, theme: W6_SAND("#d0ac74", "#e0c894", "#a07c48") },
  { id: "rainbowsand", name: "색모래 들판", desc: "새 색깔이 스민 색모래 들판. 모래가 무지개처럼 반짝여요", key: ["levers", "crackwall"],
    features: { quicksand: 4, oasis: 3, cactus: 6 }, monsters: { w6_mirageGhost: 3, w6_cactusJelly: 2, w6_sandBunny: 2, w6_sandBat: 2, thief: 1 }, theme: W6_SAND("#e0b8b0", "#c8a8f0", "#a87a78") },
  { id: "sphinxgate", name: "스핑크스 문", desc: "커다란 스핑크스 문 앞. 수수께끼처럼 길이 꼬여 있어요", key: ["plates", "mimic", "twins"],
    features: { quicksand: 5, cactus: 6, oasis: 2 }, monsters: { w6_shellTurtle: 3, w6_sandMummy: 2, w6_mirageGhost: 2, w6_sandBat: 2, thief: 1 }, theme: W6_SAND("#c8a468", "#e8c888", "#8a6a38", 0.32) },
  { id: "sunthrone", name: "태양 왕좌", desc: "해가 가장 가까운 왕좌. 그늘과 오아시스가 소중해요", key: ["levers", "hold", "twins"],
    features: { oasis: 3, cactus: 8, quicksand: 4 }, monsters: { w6_sandMummy: 3, w6_sunWisp: 2, w6_shellTurtle: 2, w6_mirageGhost: 2, w6_sandBunny: 1, thief: 1 }, theme: W6_SAND("#e8c070", "#ffd890", "#b08840") },
  { id: "prismpyramid", name: "무지개 피라미드", desc: "새 색깔이 떨어진 곳! 새빛 스핑크스 무지냥이 기다려요", key: ["hold", "levers", "twins"],
    features: { oasis: 4, quicksand: 4, cactus: 6 }, monsters: { w6_mirageGhost: 3, w6_shellTurtle: 2, w6_sandMummy: 2, w6_cactusJelly: 2, w6_sunWisp: 2, thief: 1 }, theme: W6_SAND("#d8b8c8", "#b8e8d8", "#9a7890", 0.34, "#140a14") },
];
W6_MAPS.forEach((m, i) => {
  m.world = 6; m.minLevel = W6_START + Math.round(i * 2.55); m.unlockAfter = i ? W6_MAPS[i - 1].id : "starmaw";
  m.size = 64 + Math.min(8, Math.floor(i / 2)); m.rooms = 13 + Math.min(3, Math.floor(i / 4)); m.count = 36 + Math.min(8, Math.floor(i / 2)); m.reward = 610 + i * 12;
  MAPS.push(m);
});

// 월드 6 정보 (월드 5 블랙홀 꿀꺽이를 물리치면 포탈로 가요)
WORLDS[6] = {
  id: 6, name: "색모래 사막", camp: "신기루 오아시스 마을", mapTitle: "사막 지도", unlockAfter: "starmaw",
  lobbyTheme: { floor: "#d8b878", moss: "#e8d098", wall: "#a8844e", path: "#c8a060", darkness: 0.22, bg: "#1a1206" },
};
if (!WORLD_ORDER.includes(6)) WORLD_ORDER.push(6);
if (typeof WORLD_HUE !== "undefined") WORLD_HUE[6] = 40;
if (typeof PORTAL_STONE !== "undefined") PORTAL_STONE[6] = ["#d8b878", "#a8844e"];
if (typeof PORTAL_SWIRL !== "undefined") PORTAL_SWIRL[6] = ["#fff6d8", "#ffd060", "#e070c0"];

function inDesertDungeon() { return game.scene === "dungeon" && !!game.mapDef && typeof mapWorld === "function" && mapWorld(game.mapDef) === 6; }

// 모험 지도 자리 (사막 지도 2400×1600: 낙타 길처럼 구불구불, 오른쪽 아래 무지개 피라미드)
if (typeof WORLD_PLACES !== "undefined") Object.assign(WORLD_PLACES, {
  sunsand: { x: 340, y: 300 }, quicksands: { x: 740, y: 240 }, cactusvale: { x: 1140, y: 320 }, mirageoasis: { x: 1560, y: 260 },
  dunecastle: { x: 1980, y: 380 }, starnight: { x: 1720, y: 660 }, scarabhall: { x: 1280, y: 700 }, windcanyon: { x: 840, y: 760 },
  sunken_temple: { x: 420, y: 1000 }, glassdune: { x: 860, y: 1220 }, camelroad: { x: 1300, y: 1140 }, rainbowsand: { x: 1660, y: 1000 },
  sphinxgate: { x: 1600, y: 1380 }, sunthrone: { x: 1980, y: 1240 }, prismpyramid: { x: 2200, y: 1420 }, deserttower: { x: 2180, y: 760 },
});

// ===== 사막 지도 (모험 지도 배경, 한 번만): 모래 언덕 + 낙타 발자국 길 =====
function buildDesertTerrain() {
  const c = document.createElement("canvas");
  c.width = WORLD_W; c.height = WORLD_H;
  const g = c.getContext("2d"), rand = makeRandom(20261006);
  const sky = g.createLinearGradient(0, 0, 0, WORLD_H); sky.addColorStop(0, "#f0d49a"); sky.addColorStop(1, "#d8a868");
  g.fillStyle = sky; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${180 + rand() * 40},${130 + rand() * 30},${70 + rand() * 30},0.35)`; g.beginPath(); g.ellipse(rand() * WORLD_W, rand() * WORLD_H, 80 + rand() * 160, 24 + rand() * 40, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(120,80,40,0.55)"; g.lineWidth = 6; g.setLineDash([10, 16]); g.beginPath();
  W6_MAPS.forEach((m, i) => { const p = WORLD_PLACES[m.id]; if (p) (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); });
  g.stroke(); g.setLineDash([]);
  const h = WORLD_PLACES.prismpyramid || { x: 2200, y: 1420 };
  const glow = g.createRadialGradient(h.x, h.y, 10, h.x, h.y, 240);
  glow.addColorStop(0, "rgba(255,180,240,0.55)"); glow.addColorStop(0.5, "rgba(160,240,220,0.3)"); glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow; g.fillRect(h.x - 240, h.y - 240, 480, 480);
  return c;
}
if (typeof buildTerrain === "function") {
  const buildTerrainPrevW6 = buildTerrain;
  buildTerrain = function () { return typeof curWorld === "function" && curWorld() === 6 ? buildDesertTerrain() : buildTerrainPrevW6(); };
}
// 사막 맵 그림 (지도 위 장소): 모래 언덕 받침 + 작은 표시
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (mapWorld(m) !== 6 || m.type === "tower") return false;
  const g = ctx, C = (c) => (typeof greyish === "function" ? greyish(c, locked) : c);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(60,40,20,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); };
  g.fillStyle = C("#c8a060"); g.beginPath(); g.ellipse(x, y, 24 * s, 9 * s, 0, 0, Math.PI * 2); g.fill();
  const theme = m.theme || {};
  if (m.id === "prismpyramid") { g.fillStyle = C("#e8b8d8"); g.beginPath(); g.moveTo(x - 18 * s, y - 2 * s); g.lineTo(x, y - 30 * s); g.lineTo(x + 18 * s, y - 2 * s); g.closePath(); g.fill(); circ(0, -16, 4, C("#b8f0e0")); }
  else if ((m.features || {}).oasis >= 4) { circ(0, -8, 9, C("#6ac8d8")); rect(-2, -26, 3, 16, C("#8a6a3a")); circ(0, -26, 7, C("#6ab060")); }
  else if ((m.features || {}).cactus >= 8) { rect(-3, -26, 6, 22, C("#6ab060")); rect(-10, -18, 4, 8, C("#6ab060")); rect(6, -20, 4, 8, C("#6ab060")); }
  else { rect(-12, -18, 24, 14, C(theme.wall || "#a8844e")); rect(-4, -26, 8, 8, C(theme.moss || "#e8d098")); }
  return true;
}, 50);

// ===== 신기루 오아시스 마을 겉모습 (lobby.js WORLD_LOOK 등록부: 자리는 그대로, 겉모습만) =====
// 야자나무 (나무 자리) · 오아시스 샘 (우물 자리) · 모닥불은 그대로 · 꽃 자리엔 색모래 꽃 (사막 맵을 깰수록 색이 늘어요)
function w6CampProgress() { const pr = game.profile; return pr && Array.isArray(pr.cleared) ? W6_MAPS.filter((m) => pr.cleared.includes(m.id)).length / W6_MAPS.length : 0; }
// 꽃 자리는 4가지 색을 받아요 (lobby.js 가 4개 중에서 골라요): 깬 만큼 모래색 꽃이 색모래 꽃으로 바뀌어요
function w6FlowerColors() { const all = ["#ff7aa8", "#ffd23f", "#7ad8ff", "#b48aff"], n = 1 + Math.round(w6CampProgress() * 3); return all.map((c, i) => (i < n ? c : "#e8d4a8")); }
function drawPalmTree(t) {
  for (let i = 0; i < 5; i++) drawBox(t.x - 0.1 + i * 0.03, t.y - 0.1, i * 0.4, 0.2, 0.2, 0.42, i % 2 ? "#8a6a3a" : "#9a7a46");
  for (const [dx, dy] of [[0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]]) drawBox(t.x + dx * 0.5 - 0.35, t.y + dy * 0.5 - 0.35, 2.0 - Math.abs(dx + dy) * 0.1, 0.7 + Math.abs(dx) * 0.5, 0.7 + Math.abs(dy) * 0.5, 0.12, "#5aa848");
  drawBox(t.x - 0.18, t.y - 0.18, 2.05, 0.36, 0.36, 0.2, "#4a9a3a");
  drawBox(t.x + 0.1, t.y + 0.05, 1.82, 0.14, 0.14, 0.14, "#8a5a2a");
}
function drawOasisSpring(w) {
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; drawBox(w.x + Math.cos(a) * 0.8 - 0.15, w.y + Math.sin(a) * 0.8 - 0.15, 0, 0.3, 0.3, 0.18, i % 2 ? "#c8a068" : "#d8b078"); }
  drawBox(w.x - 0.62, w.y - 0.62, 0, 1.24, 1.24, 0.06, "#4ab8d0");
  if (Math.sin(game.time * 2) > 0.3) drawBox(w.x - 0.1, w.y - 0.1, 0.06, 0.2, 0.2, 0.02, "#e8fbff");
  if (typeof glowAt === "function") glowAt(w.x, w.y, 0.3, 40, "120,220,240", 0.25);
}
if (typeof WORLD_LOOK !== "undefined") WORLD_LOOK[6] = {
  flowers: w6FlowerColors,
  merchant: { skin: "#c88a5a", hair: "#2a1a10", shirt: "#e8c060", pants: "#8a5a2a", eyes: "#2a1a10" },   // 낙타 상인
  smith: { skin: "#b87a4a", hair: "#e8e0d0", shirt: "#c86a3a", pants: "#5a3a22", eyes: "#2a1a10" },      // 모래 대장장이
  tree: drawPalmTree, well: drawOasisSpring, wellLabel: "소원 오아시스",
};
// 모래 반짝이 (색모래가 바람에 날려요)
hookOn("playersUpdated", (dt) => {
  if (game.scene !== "lobby" || curWorld() !== 6) return;
  if (Math.random() < (dt || 1 / 60) * 4) {
    const x = 1.5 + Math.random() * (LOBBY.width - 3), y = 1.5 + Math.random() * (LOBBY.height - 3);
    addSparkle(x, y, 0.3 + Math.random() * 0.6, { vx: 0.8, vz: 0.2, gravity: 0, life: 1.8, size: 0.3, hue: Math.random() * 360 });
  }
}, 70);
