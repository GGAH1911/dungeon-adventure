// ===== 월드 8 "뜨끈 지옥": 맵 8개, 월드 정보, 뿔뿔 온천 마을 겉모습, 지옥 지도 (설계서 docs/design/world8-hell.md) =====
// 레벨: 226 에서 맵마다 3.5 (월드 7 보다 가파르게) -> 8번째 Lv 251. 어려운 월드예요 (몬스터·보스 수치 1.5배, 정예 무리).
// 이야기: 월드 7 사이버 세계 맨 아래 커널 코어(kernelcore)를 고치자 뜨끈한 틈이 열려요. 그 아래 꼬마 도깨비들의 "뜨끈 지옥".
//   큰 불씨 종에 금이 가서 불씨들이 심술이 났어요. 마지막 불씨 왕좌의 불씨 임금 화르릉은 종이 깨져서 속상했던 것뿐.
// 아이용: 피·뼈·무서운 종교 그림 없이, 도깨비 방망이·온천·불꽃 염소·도깨비불 시장처럼 귀엽게.
// 맵 몬스터(w8_*)는 mobs_w8.js, 환경(features)은 hell_env.js, 보스는 bosses_w8.js·bosses_w8b.js
// 월드 7 은 다른 갈래에서 만들어요: WORLDS[7] 이 없어도 오류 없이 돌아가요 (WORLD_ORDER 는 번호 순서대로 끼워요).

const W8_START = 226;
const W8_FIRE = (floor, moss, wall, dark = 0.4, bg = "#1a0606") => ({ floor, moss, wall, darkness: dark, bg });
const W8_MAPS = [
  { id: "hellgate", name: "뜨끈 지옥 문", desc: "뜨끈뜨끈 지하 나라의 문! 불기둥 박자를 보고 지나가요", key: ["guardian", "mimic"],
    features: { vent: 6, spring: 2, gust: 1 }, monsters: { w8_imp: 4, w8_emberBat: 3, w8_lavaSlime: 3, thief: 1 }, theme: W8_FIRE("#6a3a30", "#c8502a", "#4a2622") },
  { id: "emberfall", name: "불똥 폭포", desc: "불똥이 폭포처럼 쏟아지는 곳. 뜨끈 바람길에 밀리지 않게!", key: ["shards", "twins"],
    features: { gust: 3, vent: 4, spring: 2 }, monsters: { w8_emberBat: 4, w8_lavaSlime: 3, w8_steamFrog: 2, thief: 1 }, theme: W8_FIRE("#704030", "#ff8a3a", "#4e2a20") },
  { id: "chainbridge", name: "사슬 다리", desc: "커다란 사슬 다리. 바람길이 사람을 휙휙 밀어요", key: ["levers", "mimic"],
    features: { gust: 4, vent: 4, spring: 2 }, monsters: { w8_imp: 3, w8_hornGoat: 3, w8_wispCat: 2, thief: 1 }, theme: W8_FIRE("#5a4440", "#a87a60", "#3a2a28", 0.46) },
  { id: "coalmine", name: "숯 광산", desc: "까만 숯이 반짝이는 광산. 숯덩이 골렘은 단단해요", key: ["torches", "guardian"],
    features: { vent: 8, spring: 2, gust: 1 }, monsters: { w8_coalGolem: 3, w8_imp: 3, w8_emberBat: 2, w8_lavaSlime: 2, thief: 1 }, theme: W8_FIRE("#3e3434", "#e0702a", "#2a2222", 0.52, "#0c0606") },
  { id: "sulfurspa", name: "유황 온천", desc: "노란 김이 모락모락 온천! 시원 샘에서 쉬어 가요", key: ["hold", "plates"],
    features: { spring: 3, vent: 5, gust: 2 }, monsters: { w8_steamFrog: 4, w8_lavaSlime: 3, w8_wispCat: 2, thief: 1 }, theme: W8_FIRE("#7a6a3a", "#e8d060", "#5a4a2a", 0.4) },
  { id: "wispmarket", name: "도깨비불 시장", desc: "파란 도깨비불 등불이 줄지어 선 시장. 도깨비불 고양이를 조심해요", key: ["dark", "thief", "twins"],
    features: { vent: 5, gust: 2, spring: 2 }, monsters: { w8_wispCat: 4, w8_imp: 3, w8_emberBat: 2, thief: 1 }, theme: W8_FIRE("#3a3450", "#6ab0ff", "#28223a", 0.58, "#06060e") },
  { id: "goatpeak", name: "불꽃 염소 봉우리", desc: "뿔 염소가 뛰노는 뜨거운 봉우리. 들이받기를 옆으로 피해요", key: ["traphall", "crackwall"],
    features: { gust: 3, vent: 7, spring: 2 }, monsters: { w8_hornGoat: 4, w8_coalGolem: 2, w8_steamFrog: 2, w8_imp: 2, thief: 1 }, theme: W8_FIRE("#6a4a3a", "#ff6a4a", "#4a3028", 0.44) },
  { id: "firethrone", name: "불씨 왕좌", desc: "큰 불씨 종이 있는 왕좌! 불씨 임금 화르릉이 기다려요", key: ["hold", "levers", "twins"],
    features: { vent: 8, gust: 3, spring: 3 }, monsters: { w8_imp: 3, w8_coalGolem: 2, w8_wispCat: 2, w8_hornGoat: 2, w8_lavaSlime: 2, thief: 1 }, theme: W8_FIRE("#7a3030", "#ffb030", "#501c1c", 0.46, "#140404") },
];
W8_MAPS.forEach((m, i) => {
  m.world = 8; m.minLevel = W8_START + Math.round(i * 3.5); m.unlockAfter = i ? W8_MAPS[i - 1].id : "kernelcore";
  m.size = 68 + Math.min(6, i); m.rooms = 14 + Math.min(3, Math.floor(i / 2)); m.count = 42 + Math.min(10, i * 2); m.reward = 760 + i * 18;
  MAPS.push(m);
});

// 월드 8 정보 (월드 7 커널 코어를 고치면 포탈로 가요)
WORLDS[8] = {
  id: 8, name: "뜨끈 지옥", camp: "뿔뿔 온천 마을", mapTitle: "지옥 지도", unlockAfter: "kernelcore",
  lobbyTheme: { floor: "#6a3a30", moss: "#c8502a", wall: "#4a2622", path: "#8a4a34", darkness: 0.3, bg: "#1a0606" },
};
// 번호 순서대로 끼워요 (월드 7 이 먼저 붙었든 나중에 붙든 WORLD_ORDER 는 늘 1,2,...,7,8)
if (!WORLD_ORDER.includes(8)) { const at = WORLD_ORDER.findIndex((w) => w > 8); if (at < 0) WORLD_ORDER.push(8); else WORLD_ORDER.splice(at, 0, 8); }
if (typeof WORLD_HUE !== "undefined") WORLD_HUE[8] = 12;
if (typeof PORTAL_STONE !== "undefined") PORTAL_STONE[8] = ["#6a3a30", "#3a1a16"];
if (typeof PORTAL_SWIRL !== "undefined") PORTAL_SWIRL[8] = ["#fff0c0", "#ff8a2a", "#ff3a3a"];

function inHellDungeon() { return game.scene === "dungeon" && !!game.mapDef && typeof mapWorld === "function" && mapWorld(game.mapDef) === 8; }

// 모험 지도 자리 (지옥 지도 2400×1600: 위에서 아래로 내려가는 지그재그, 아래 가운데 불씨 왕좌)
if (typeof WORLD_PLACES !== "undefined") Object.assign(WORLD_PLACES, {
  hellgate: { x: 420, y: 280 }, emberfall: { x: 1020, y: 300 }, chainbridge: { x: 1640, y: 340 }, coalmine: { x: 2020, y: 700 },
  sulfurspa: { x: 1500, y: 860 }, wispmarket: { x: 860, y: 900 }, goatpeak: { x: 520, y: 1240 }, firethrone: { x: 1300, y: 1360 },
});

// ===== 지옥 지도 (모험 지도 배경, 한 번만): 붉은 바위 + 용암 금 + 사슬 길 =====
function buildHellTerrain() {
  const c = document.createElement("canvas");
  c.width = WORLD_W; c.height = WORLD_H;
  const g = c.getContext("2d"), rand = makeRandom(20261010);
  const sky = g.createLinearGradient(0, 0, 0, WORLD_H); sky.addColorStop(0, "#4a2018"); sky.addColorStop(1, "#200808");
  g.fillStyle = sky; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(${90 + rand() * 40},${30 + rand() * 20},${20 + rand() * 20},0.45)`; g.beginPath(); g.ellipse(rand() * WORLD_W, rand() * WORLD_H, 60 + rand() * 140, 30 + rand() * 50, rand() * 3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(255,140,40,0.5)"; g.lineWidth = 4;
  for (let i = 0; i < 14; i++) { let x = rand() * WORLD_W, y = rand() * WORLD_H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rand() - 0.5) * 160; y += 40 + rand() * 60; g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = "rgba(200,180,160,0.6)"; g.lineWidth = 6; g.setLineDash([14, 10]); g.beginPath();
  W8_MAPS.forEach((m, i) => { const p = WORLD_PLACES[m.id]; if (p) (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); });
  g.stroke(); g.setLineDash([]);
  const h = WORLD_PLACES.firethrone || { x: 1300, y: 1360 };
  const glow = g.createRadialGradient(h.x, h.y, 10, h.x, h.y, 260);
  glow.addColorStop(0, "rgba(255,200,80,0.6)"); glow.addColorStop(0.5, "rgba(255,90,40,0.3)"); glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow; g.fillRect(h.x - 260, h.y - 260, 520, 520);
  return c;
}
if (typeof buildTerrain === "function") {
  const buildTerrainPrevW8 = buildTerrain;
  buildTerrain = function () { return typeof curWorld === "function" && curWorld() === 8 ? buildHellTerrain() : buildTerrainPrevW8(); };
}
// 지옥 맵 그림 (지도 위 장소): 붉은 바위 받침 + 작은 표시
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (mapWorld(m) !== 8 || m.type === "tower") return false;
  const g = ctx, C = (c) => (typeof greyish === "function" ? greyish(c, locked) : c);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(30,10,10,0.75)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); };
  g.fillStyle = C("#5a2a22"); g.beginPath(); g.ellipse(x, y, 24 * s, 9 * s, 0, 0, Math.PI * 2); g.fill();
  const theme = m.theme || {};
  if (m.id === "firethrone") { rect(-14, -20, 28, 16, C("#a83030")); rect(-6, -32, 12, 12, C("#ffb030")); circ(0, -36, 5, C("#fff0a0")); }
  else if ((m.features || {}).spring >= 3) { circ(0, -8, 9, C("#7ad8e8")); circ(-4, -20, 4, C("#ffffff")); circ(4, -26, 3, C("#ffffff")); }
  else if ((m.features || {}).gust >= 3) { rect(-16, -14, 32, 6, C("#c8b8a8")); rect(-14, -22, 4, 8, C("#8a7a6a")); rect(10, -22, 4, 8, C("#8a7a6a")); }
  else { rect(-10, -22, 20, 18, C(theme.wall || "#4a2622")); rect(-3, -30, 6, 8, C(theme.moss || "#c8502a")); }
  return true;
}, 50);

// ===== 뿔뿔 온천 마을 겉모습 (lobby.js WORLD_LOOK 등록부: 자리는 그대로, 겉모습만) =====
// 뿔 돌탑 (나무 자리) · 온천 (우물 자리) · 꽃 자리엔 불꽃 꽃 (지옥 맵을 깰수록 색이 늘어요)
function w8CampProgress() { const pr = game.profile; return pr && Array.isArray(pr.cleared) ? W8_MAPS.filter((m) => pr.cleared.includes(m.id)).length / W8_MAPS.length : 0; }
function w8FlowerColors() { const all = ["#ff5a3a", "#ffb030", "#ffe060", "#7ad8ff"], n = 1 + Math.round(w8CampProgress() * 3); return all.map((c, i) => (i < n ? c : "#6a4a40")); }
function drawHornRock(t) {
  drawBox(t.x - 0.4, t.y - 0.4, 0, 0.8, 0.8, 0.7, "#5a3a32");
  drawBox(t.x - 0.3, t.y - 0.3, 0.7, 0.6, 0.6, 0.6, "#6a4238");
  drawBox(t.x - 0.22, t.y - 0.1, 1.3, 0.14, 0.14, 0.5, "#ffd060"); drawBox(t.x + 0.08, t.y - 0.1, 1.3, 0.14, 0.14, 0.5, "#ffd060"); // 뿔 둘
  if (typeof glowAt === "function") glowAt(t.x, t.y, 1.0, 30, "255,140,60", 0.18);
}
function drawHotSpring(w) {
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; drawBox(w.x + Math.cos(a) * 0.8 - 0.15, w.y + Math.sin(a) * 0.8 - 0.15, 0, 0.3, 0.3, 0.18, i % 2 ? "#5a3a32" : "#6a4a40"); }
  drawBox(w.x - 0.62, w.y - 0.62, 0, 1.24, 1.24, 0.06, "#ff9a5a");
  const k = (game.time * 0.8) % 1; drawBox(w.x - 0.08, w.y - 0.08, 0.2 + k * 0.8, 0.16, 0.16, 0.16, `rgba(255,255,255,${0.6 * (1 - k)})`);
  if (typeof glowAt === "function") glowAt(w.x, w.y, 0.3, 40, "255,150,80", 0.25);
}
if (typeof WORLD_LOOK !== "undefined") WORLD_LOOK[8] = {
  flowers: w8FlowerColors,
  merchant: { skin: "#e86a5a", hair: "#2a1010", shirt: "#ffd060", pants: "#4a2a20", eyes: "#2a1010" },   // 도깨비 상인
  smith: { skin: "#c8503a", hair: "#ffe0a0", shirt: "#3a2a28", pants: "#2a1a18", eyes: "#2a1010" },      // 도깨비 대장장이
  tree: drawHornRock, well: drawHotSpring, wellLabel: "소원 온천",
};
// 불씨 반짝이 (위로 둥실)
hookOn("playersUpdated", (dt) => {
  if (game.scene !== "lobby" || curWorld() !== 8) return;
  if (Math.random() < (dt || 1 / 60) * 5) {
    const x = 1.5 + Math.random() * (LOBBY.width - 3), y = 1.5 + Math.random() * (LOBBY.height - 3);
    addSparkle(x, y, 0.2, { vz: 1.0, gravity: -0.2, life: 1.6, size: 0.3, hue: 15 + Math.random() * 30 });
  }
}, 70);
