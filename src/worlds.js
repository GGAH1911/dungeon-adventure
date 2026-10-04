// ===== 여러 월드: 캠프 포탈로 오가요 =====
// 월드 1 햇빛 땅 (캠프) · 월드 2 깊은 바다 (바닷속 마을). 월드 1의 마지막 보스(그림자 마왕)를 잡으면 포탈이 열려요.
// - 맵마다 world 필드 (없으면 1). 모험 지도는 지금 월드의 맵만 보여줘요 (mapselect.js)
// - 마을(캠프)은 자리(상인·대장장이·지도 탁자...)는 같고 겉모습만 월드마다 달라요 (lobby.js 의 그리기에서 worldLook() 을 봐요)
// - 캐릭터마다 지금 있는 월드를 저장해요: game.profile.world

const WORLDS = {
  1: { id: 1, name: "햇빛 땅", camp: "캠프", mapTitle: "모험 지도" },
  2: {
    id: 2, name: "깊은 바다", camp: "바닷속 마을", mapTitle: "깊은 바다 지도", unlockAfter: "void",
    lobbyTheme: { floor: "#c8b886", moss: "#8fc0a8", wall: "#4a7a86", path: "#e2d4a4", darkness: 0.36, bg: "#03121c" },
  },
};
const WORLD_ORDER = [1, 2];
const LOBBY_THEME_1 = { ...LOBBY.theme };

function mapWorld(m) { return (m && m.world) || 1; }
function curWorld() { const w = game.profile && game.profile.world; return WORLDS[w] ? w : 1; }
function worldLook() { return curWorld(); }
function worldUnlocked(w) {
  const W = WORLDS[w]; if (!W) return false;
  if (!W.unlockAfter) return true;
  return !!(game.profile && game.profile.cleared && game.profile.cleared.includes(W.unlockAfter));
}
function worldMaps(w = curWorld()) { return MAPS.filter((m) => mapWorld(m) === w); }

hookOn("profileLoaded", (pr) => { if (!WORLDS[pr.world]) pr.world = 1; }, 30);

// 캠프를 만들기 전에: 월드에 맞는 바닥 색 (lobby.js buildLobby 가 불러요)
function applyWorldLobby() {
  const W = WORLDS[curWorld()];
  LOBBY.theme = W.lobbyTheme ? { ...W.lobbyTheme } : { ...LOBBY_THEME_1 };
}

// ----- 월드 옮기기 -----
function travelToWorld(w) {
  if (!WORLDS[w] || !worldUnlocked(w)) return false;
  const pr = game.profile;
  pr.world = w;
  saveProfile();
  if (typeof mapSel !== "undefined") mapSel.terrain = null; // 지도 다시 그리기
  enterLobby(`${WORLDS[w].name} · ${WORLDS[w].camp}`);
  game.fade = 0.9;
  sfx.stairs();
  const p = game.player;
  if (p) for (let i = 0; i < 24; i++) { const a = Math.random() * Math.PI * 2; addSparkle(p.x, p.y, 0.6, { vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, vz: 2, gravity: 3, life: 0.8, size: 0.7, hue: w === 2 ? 190 : 45 }); }
  return true;
}

// ----- 포탈 (캠프·마을 오른쪽 위) -----
const PORTAL = { x: 26.2, y: 6.6, placed: false };
function portalSpot() {
  if (!PORTAL.placed && game.scene === "lobby" && typeof findFreeSpot === "function") { const s = findFreeSpot(26.2, 6.6, 0.7, 3); if (s) { PORTAL.x = s.x; PORTAL.y = s.y; } PORTAL.placed = true; }
  return PORTAL;
}
// 지금 월드에서 포탈이 데려갈 월드
function portalTarget() { const i = WORLD_ORDER.indexOf(curWorld()); return WORLD_ORDER[(i + 1) % WORLD_ORDER.length]; }
hookOn("lobbyThings", (things) => {
  const s = portalSpot();
  things.push({ depth: s.x + s.y, draw: () => drawPortal(s) });
}, 70);
hookOn("lobbyInteractables", (list) => {
  const s = portalSpot(), to = portalTarget(), open = worldUnlocked(to);
  list.push({ x: s.x, y: s.y, range: 1.7, label: "포탈", short: open ? "포탈" : "포탈", prompt: open ? `${WORLDS[to].name}(으)로 가기` : "포탈 (잠겨 있어요)",
    action: () => {
      if (!open) { sfx.denied(); showMessage(`그림자 마왕(공허의 끝)을 물리치면 ${WORLDS[to].name} 포탈이 열려요`, 3, false, "#9fd8ff"); return; }
      travelToWorld(to);
    } });
  return list;
}, 70);
function drawPortal(s) {
  const to = portalTarget(), open = worldUnlocked(to);
  const stone = curWorld() === 2 ? "#5a7a86" : "#8a8478", dark = curWorld() === 2 ? "#3a5560" : "#5e5a52";
  // 돌 문틀
  drawBox(s.x - 0.75, s.y - 0.2, 0, 0.3, 0.4, 1.9, stone);
  drawBox(s.x + 0.45, s.y - 0.2, 0, 0.3, 0.4, 1.9, stone);
  drawBox(s.x - 0.85, s.y - 0.25, 1.9, 1.7, 0.5, 0.3, dark);
  // 소용돌이
  const c = toScreen(s.x, s.y, 1.0);
  const rx = 0.55 * TILE_W / 2, ry = 0.85 * BLOCK_H;
  ctx.save();
  if (open) {
    const g = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, Math.max(rx, ry));
    const col = to === 2 ? ["#e6fbff", "#4fc3e8", "#0a4a7a"] : ["#fff6d0", "#ffd23f", "#a06a10"];
    g.addColorStop(0, col[0]); g.addColorStop(0.5, col[1]); g.addColorStop(1, col[2]);
    ctx.fillStyle = g; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.6; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2 * ZOOM;
    for (let i = 0; i < 3; i++) { const a0 = game.time * 2 + i * 2.1; ctx.beginPath(); ctx.ellipse(c.x, c.y, rx * (0.35 + i * 0.2), ry * (0.35 + i * 0.2), 0, a0, a0 + 2.2); ctx.stroke(); }
    if (Math.random() < 0.25) addSparkle(s.x + (Math.random() - 0.5) * 0.8, s.y, 0.3 + Math.random() * 1.4, { vz: 0.8, life: 0.7, size: 0.5, hue: to === 2 ? 190 : 45 });
  } else {
    ctx.fillStyle = "rgba(20,24,34,0.85)";
    ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(160,170,190,0.6)"; ctx.lineWidth = 3 * ZOOM;
    ctx.beginPath(); ctx.moveTo(c.x - rx, c.y - ry * 0.6); ctx.lineTo(c.x + rx, c.y + ry * 0.6); ctx.moveTo(c.x + rx, c.y - ry * 0.6); ctx.lineTo(c.x - rx, c.y + ry * 0.6); ctx.stroke();
  }
  ctx.restore();
  if (open && Math.sin(game.time * 3) > 0.85) { const t = toScreen(s.x, s.y, 2.4); drawStar(t.x, t.y, 7 * ZOOM, "#ffffff"); }
}

// ----- 바닷속 마을: 물방울, 빛 -----
hookOn("playersUpdated", (dt) => {
  if (game.scene !== "lobby" || curWorld() !== 2) return;
  if (Math.random() < (dt || 1 / 60) * 10) {
    const x = 1.5 + Math.random() * (LOBBY.width - 3), y = 1.5 + Math.random() * (LOBBY.height - 3);
    addSparkle(x, y, 0.1, { vz: 1.1 + Math.random() * 0.6, gravity: -0.3, life: 1.6, size: 0.45, hue: 190 });
  }
}, 70);
