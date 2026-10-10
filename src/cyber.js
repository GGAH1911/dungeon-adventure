// ===== 월드 7 "픽셀 사이버 세계": 맵 10개, 월드 정보, 픽셀 광장 마을 겉모습, 사이버 지도 (설계서 docs/design/world7-cyber.md) =====
// 레벨: 195 + round(i × 3) -> 10번째 Lv 222. 월드 6 보다 어려워요 (몬스터·보스 기본값 약 1.3배, 몬스터 수 46~55).
// 이야기: "별빛도 그림자도 아닌 색" = 화면 빛. 무지냥은 이 세계에서 떨어진 색 조각이었어요. 버그(지지직 오류)가 퍼져 친구들이 고장 났어요.
// 맵 몬스터(w7_*)는 mobs_w7.js, 환경(features)은 cyber_env.js, 보스는 bosses_w7.js
// 월드 7은 마지막 월드가 아니에요: WORLD_ORDER 에 붙기만 해요 (월드 8 도 같은 방법으로 붙어요)

const W7_START = 195;
const W7_NEON = (floor, moss, wall, dark = 0.4, bg = "#04060f") => ({ floor, moss, wall, darkness: dark, bg });
const W7_MAPS = [
  { id: "pixeltown", name: "픽셀 마을", desc: "네모네모 픽셀 마을! 충전 패드를 밟으면 하트가 차요", key: ["guardian", "mimic"],
    features: { charge: 3, glitch: 3, tele: 1 }, monsters: { w7_bitBug: 4, w7_popup: 3, w7_cable: 2, thief: 1 }, theme: W7_NEON("#2a3458", "#5ad8ff", "#4a5490", 0.32) },
  { id: "datariver", name: "데이터 강", desc: "0 과 1 이 흐르는 강. 순간이동 패드로 건너요", key: ["shards", "twins"],
    features: { tele: 3, glitch: 3, charge: 2 }, monsters: { w7_cable: 3, w7_drone: 2, w7_bitBug: 3, thief: 1 }, theme: W7_NEON("#1c2c4c", "#3ae0c8", "#2a4a7a", 0.38) },
  { id: "firewallgate", name: "방화벽 성문", desc: "불꽃 벽이 지키는 성문. 지지직 글리치 칸을 조심해요", key: ["levers", "plates"],
    features: { glitch: 6, charge: 2, tele: 1 }, monsters: { w7_firebot: 3, w7_popup: 2, w7_bitBug: 3, w7_cable: 1, thief: 1 }, theme: W7_NEON("#3a2234", "#ff7a4a", "#6a3448", 0.36) },
  { id: "glitchmaze", name: "글리치 미로", desc: "길이 지지직 꼬인 미로. 가짜 젤리에 속지 마요", key: ["dark", "mimic", "twins"],
    features: { glitch: 7, tele: 3, charge: 2 }, monsters: { w7_glitchJelly: 4, w7_bitBug: 3, w7_cursor: 2, thief: 1 }, theme: W7_NEON("#241c3c", "#c07aff", "#3e2a6a", 0.55, "#06020e") },
  { id: "serverfarm", name: "서버 농장", desc: "윙윙 서버가 줄지어 선 농장. 찬 바람이 불어요", key: ["torches", "guardian", "plates"],
    features: { glitch: 4, charge: 3, tele: 2 }, monsters: { w7_firebot: 2, w7_drone: 3, w7_cable: 2, w7_popup: 2, thief: 1 }, theme: W7_NEON("#1e2e3a", "#7affb0", "#2e4a5a", 0.42) },
  { id: "cloudvault", name: "구름 저장소", desc: "사진과 그림이 둥실둥실 저장된 구름 창고", key: ["hold", "memory"],
    features: { tele: 3, charge: 3, glitch: 4 }, monsters: { w7_drone: 3, w7_cursor: 3, w7_glitchJelly: 2, w7_bitBug: 2, thief: 1 }, theme: W7_NEON("#34405e", "#d8e8ff", "#5a6a90", 0.3) },
  { id: "spamcastle", name: "스팸 편지 성", desc: "편지가 산더미! 팝업 상자가 광고창을 던져요", key: ["traphall", "mimic", "crackwall"],
    features: { glitch: 5, charge: 2, tele: 2 }, monsters: { w7_popup: 4, w7_spam: 3, w7_firebot: 2, w7_cursor: 2, thief: 1 }, theme: W7_NEON("#3a2a40", "#ffd23f", "#6a4a6a", 0.38) },
  { id: "neonarcade", name: "네온 오락실", desc: "반짝반짝 네온 오락실! 동전이 쏟아져요", key: ["levers", "hold", "twins"],
    features: { glitch: 5, tele: 3, charge: 3 }, monsters: { w7_cursor: 3, w7_glitchJelly: 2, w7_popup: 2, w7_drone: 2, w7_bitBug: 2, thief: 1 }, theme: W7_NEON("#200e2e", "#ff5ad8", "#4a1e5e", 0.5, "#08020c") },
  { id: "bugnest", name: "버그 둥지", desc: "버그가 생겨나는 둥지. 지지직 칸이 가득해요", key: ["memory", "plates", "crackwall"],
    features: { glitch: 8, charge: 3, tele: 2 }, monsters: { w7_bitBug: 4, w7_glitchJelly: 3, w7_cable: 2, w7_firebot: 2, thief: 1 }, theme: W7_NEON("#1e2a1a", "#9aff4a", "#34482a", 0.48, "#040a02") },
  { id: "kernelcore", name: "커널 코어", desc: "사이버 세계의 심장! 오류왕 블루스크린이 기다려요", key: ["hold", "levers", "twins"],
    features: { glitch: 7, tele: 3, charge: 3 }, monsters: { w7_firebot: 2, w7_drone: 2, w7_glitchJelly: 2, w7_bitBug: 3, w7_cursor: 2, thief: 1 }, theme: W7_NEON("#122048", "#4a8aff", "#1e3a7a", 0.44, "#020414") },
];
W7_MAPS.forEach((m, i) => {
  m.world = 7; m.minLevel = W7_START + Math.round(i * 3); m.unlockAfter = i ? W7_MAPS[i - 1].id : "prismpyramid";
  m.size = 66 + Math.min(8, Math.floor(i / 2)); m.rooms = 14 + Math.min(3, Math.floor(i / 3)); m.count = 46 + i; m.reward = 760 + i * 15;
  MAPS.push(m);
});

// 월드 7 정보 (월드 6 무지냥을 달래면 포탈로 가요)
WORLDS[7] = {
  id: 7, name: "픽셀 사이버 세계", camp: "픽셀 광장", mapTitle: "사이버 지도", unlockAfter: "prismpyramid",
  lobbyTheme: { floor: "#2a3458", moss: "#5ad8ff", wall: "#4a5490", path: "#3a4878", darkness: 0.26, bg: "#04060f" },
};
if (!WORLD_ORDER.includes(7)) { const at = WORLD_ORDER.findIndex((w) => w > 7); if (at < 0) WORLD_ORDER.push(7); else WORLD_ORDER.splice(at, 0, 7); } // 번호 순서대로
if (typeof WORLD_HUE !== "undefined") WORLD_HUE[7] = 200;
if (typeof PORTAL_STONE !== "undefined") PORTAL_STONE[7] = ["#4a5490", "#2a3458"];
if (typeof PORTAL_SWIRL !== "undefined") PORTAL_SWIRL[7] = ["#e8fbff", "#5ad8ff", "#ff5ad8"];

function inCyberDungeon() { return game.scene === "dungeon" && !!game.mapDef && typeof mapWorld === "function" && mapWorld(game.mapDef) === 7; }

// 모험 지도 자리 (2400×1600: 회로 기판 길, 오른쪽 아래 커널 코어)
if (typeof WORLD_PLACES !== "undefined") Object.assign(WORLD_PLACES, {
  pixeltown: { x: 360, y: 320 }, datariver: { x: 820, y: 260 }, firewallgate: { x: 1300, y: 340 }, glitchmaze: { x: 1800, y: 300 },
  serverfarm: { x: 2060, y: 680 }, cloudvault: { x: 1580, y: 760 }, spamcastle: { x: 1060, y: 820 }, neonarcade: { x: 560, y: 1000 },
  bugnest: { x: 1100, y: 1280 }, kernelcore: { x: 1900, y: 1300 },
});

// ===== 사이버 지도 (모험 지도 배경, 한 번만): 남색 회로 기판 + 빛나는 회로 길 =====
function buildCyberTerrain() {
  const c = document.createElement("canvas");
  c.width = WORLD_W; c.height = WORLD_H;
  const g = c.getContext("2d"), rand = makeRandom(20261010);
  const sky = g.createLinearGradient(0, 0, 0, WORLD_H); sky.addColorStop(0, "#0e1838"); sky.addColorStop(1, "#060a1e");
  g.fillStyle = sky; g.fillRect(0, 0, WORLD_W, WORLD_H);
  g.strokeStyle = "rgba(90,216,255,0.12)"; g.lineWidth = 2;
  for (let x = 0; x < WORLD_W; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, WORLD_H); g.stroke(); }
  for (let y = 0; y < WORLD_H; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(WORLD_W, y); g.stroke(); }
  for (let i = 0; i < 60; i++) { g.fillStyle = ["rgba(90,216,255,0.35)", "rgba(255,90,216,0.3)", "rgba(154,255,74,0.3)"][i % 3]; g.fillRect(Math.floor(rand() * 30) * 80 + 30, Math.floor(rand() * 20) * 80 + 30, 20, 20); }
  g.strokeStyle = "rgba(90,216,255,0.75)"; g.lineWidth = 6; g.beginPath();
  W7_MAPS.forEach((m, i) => { const p = WORLD_PLACES[m.id]; if (!p) return; if (!i) g.moveTo(p.x, p.y); else { const q = WORLD_PLACES[W7_MAPS[i - 1].id]; g.lineTo(p.x, q.y); g.lineTo(p.x, p.y); } });
  g.stroke();
  const h = WORLD_PLACES.kernelcore || { x: 1900, y: 1300 };
  const glow = g.createRadialGradient(h.x, h.y, 10, h.x, h.y, 260);
  glow.addColorStop(0, "rgba(74,138,255,0.6)"); glow.addColorStop(0.5, "rgba(255,90,216,0.25)"); glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow; g.fillRect(h.x - 260, h.y - 260, 520, 520);
  return c;
}
if (typeof buildTerrain === "function") {
  const buildTerrainPrevW7 = buildTerrain;
  buildTerrain = function () { return typeof curWorld === "function" && curWorld() === 7 ? buildCyberTerrain() : buildTerrainPrevW7(); };
}
// 사이버 맵 그림 (지도 위 장소): 네모 받침 + 모니터
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (mapWorld(m) !== 7 || m.type === "tower") return false;
  const g = ctx, C = (c) => (typeof greyish === "function" ? greyish(c, locked) : c);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(10,20,40,0.8)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const theme = m.theme || {};
  rect(-22, -6, 44, 10, C("#2a3458"));
  if (m.id === "kernelcore") { rect(-14, -32, 28, 26, C("#1e3a7a")); rect(-9, -27, 18, 14, C("#4a8aff")); rect(-3, -22, 6, 4, C("#ffffff")); }
  else { rect(-12, -26, 24, 18, C(theme.wall || "#4a5490")); rect(-9, -23, 18, 12, C(theme.moss || "#5ad8ff")); rect(-3, -8, 6, 4, C("#8a94b8")); }
  return true;
}, 50);

// ===== 픽셀 광장 마을 겉모습 (lobby.js WORLD_LOOK 등록부: 자리는 그대로, 겉모습만) =====
function w7CampProgress() { const pr = game.profile; return pr && Array.isArray(pr.cleared) ? W7_MAPS.filter((m) => pr.cleared.includes(m.id)).length / W7_MAPS.length : 0; }
// 꽃 자리 4가지 색: 깬 만큼 회색 픽셀 꽃이 네온 꽃으로
function w7FlowerColors() { const all = ["#5ad8ff", "#ff5ad8", "#9aff4a", "#ffd23f"], n = 1 + Math.round(w7CampProgress() * 3); return all.map((c, i) => (i < n ? c : "#6a7088")); }
function drawPixelTree(t) {
  drawBox(t.x - 0.12, t.y - 0.12, 0, 0.24, 0.24, 1.2, "#5a4a7a");
  const cols = ["#3ae0a0", "#5ad8ff", "#3ab890"];
  for (let i = 0; i < 3; i++) drawBox(t.x - 0.6 + i * 0.1, t.y - 0.6 + i * 0.1, 1.1 + i * 0.45, 1.2 - i * 0.2, 1.2 - i * 0.2, 0.45, cols[i]);
  if (Math.sin(game.time * 3 + t.x) > 0.6) drawBox(t.x + 0.3, t.y - 0.2, 1.7, 0.12, 0.12, 0.12, "#ffffff");
}
function drawWishServer(w) {
  drawBox(w.x - 0.6, w.y - 0.4, 0, 1.2, 0.8, 0.4, "#2a3458");
  drawBox(w.x - 0.5, w.y - 0.1, 0.4, 1.0, 0.2, 0.8, "#1a2040");
  const k = Math.sin(game.time * 2) * 0.5 + 0.5;
  drawBox(w.x - 0.42, w.y + 0.1, 0.48, 0.84, 0.03, 0.64, `rgb(${60 + k * 60},${180 + k * 40},255)`);
  if (typeof glowAt === "function") glowAt(w.x, w.y, 0.8, 50, "90,216,255", 0.3);
}
if (typeof WORLD_LOOK !== "undefined") WORLD_LOOK[7] = {
  flowers: w7FlowerColors,
  merchant: { skin: "#f0c8a0", hair: "#5ad8ff", shirt: "#3a4878", pants: "#1a2040", eyes: "#1a1020" },   // 픽셀 상인
  smith: { skin: "#c89a78", hair: "#ff5ad8", shirt: "#4a5490", pants: "#2a3458", eyes: "#1a1020" },      // 코드 대장장이
  tree: drawPixelTree, well: drawWishServer, wellLabel: "소원 서버",
};
// 픽셀 반짝이 (네모 빛이 떠올라요)
hookOn("playersUpdated", (dt) => {
  if (game.scene !== "lobby" || curWorld() !== 7) return;
  if (Math.random() < (dt || 1 / 60) * 4) {
    const x = 1.5 + Math.random() * (LOBBY.width - 3), y = 1.5 + Math.random() * (LOBBY.height - 3);
    addSparkle(x, y, 0.2, { vz: 0.6, gravity: 0, life: 1.6, size: 0.3, hue: [190, 310, 90][Math.floor(Math.random() * 3)] });
  }
}, 70);
