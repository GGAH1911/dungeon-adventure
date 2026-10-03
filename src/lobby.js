// ===== 로비 (캠프) =====
// 상인한테 물건을 사고팔고, 모험 지도에서 맵을 골라 포털로 출발해요.

const lobby = {
  merchant: { x: 4.5, y: 6, r: 0.3, faceX: Math.SQRT1_2, faceY: Math.SQRT1_2, moving: false, walkTime: 0, flash: 0 },
  table: { x: 13.5, y: 6 },
  portal: { x: 9, y: 2.6 },
  fire: { x: 9, y: 8 },
  crates: [{ x: 3.2, y: 4.6 }, { x: 3.2, y: 5.6 }],
};
let npcs = []; // 말 걸 수 있는 것들 (E 키 / 터치 버튼)

function buildLobby() {
  buildLobbyWorld();
  const L = lobby;
  world.solids = [
    { x: L.table.x, y: L.table.y, r: 0.65 },
    { x: L.fire.x, y: L.fire.y, r: 0.5 },
    { x: L.merchant.x, y: L.merchant.y, r: 0.35 },
    { x: L.portal.x - 1, y: L.portal.y, r: 0.3 },
    { x: L.portal.x + 1, y: L.portal.y, r: 0.3 },
    ...L.crates.map((c) => ({ x: c.x, y: c.y, r: 0.4 })),
  ];
  npcs = [
    { x: L.merchant.x, y: L.merchant.y, range: 1.8, label: "상인", short: "가게", prompt: "가게 열기", action: openShop },
    { x: L.table.x, y: L.table.y, range: 1.9, label: "모험 지도", short: "지도", prompt: "맵 고르기", action: openMapSelect },
    { x: L.portal.x, y: L.portal.y + 0.6, range: 1.6, label: "포털", short: "출발", prompt: "맵 고르기", action: openMapSelect },
  ];
}

function nearestNpc(p) {
  let best = null, bestD = Infinity;
  for (const n of npcs) {
    const d = Math.hypot(p.x - n.x, p.y - n.y);
    if (d < n.range && d < bestD) { best = n; bestD = d; }
  }
  return best;
}

function updateLobby(p, dt) {
  const m = lobby.merchant;
  const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
  m.faceX = dx / d; m.faceY = dy / d;
  // 모닥불 불티
  if (Math.random() < dt * 12) {
    addSparkle(lobby.fire.x + (Math.random() - 0.5) * 0.4, lobby.fire.y + (Math.random() - 0.5) * 0.4, 0.4, {
      vz: 1 + Math.random(), vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, life: 0.9, size: 0.45, gold: true,
    });
  }
  // 포털 반짝이
  if (Math.random() < dt * 10) {
    addSparkle(lobby.portal.x + (Math.random() - 0.5) * 1.4, lobby.portal.y + 0.1, Math.random() * 2, {
      vz: 0.3, life: 0.8, size: 0.6, hue: 270 + Math.random() * 40,
    });
  }
}

function lobbyThings(things) {
  const L = lobby;
  things.push({ depth: L.merchant.x + L.merchant.y, draw: () => drawCharacter(L.merchant, CONFIG.colors.merchant) });
  for (const c of L.crates) things.push({ depth: c.x + c.y, draw: () => drawCrate(c) });
  things.push({ depth: L.table.x + L.table.y, draw: drawMapTable });
  things.push({ depth: L.fire.x + L.fire.y, draw: drawCampfire });
  things.push({ depth: L.portal.x + L.portal.y, draw: drawPortal });
}

function lobbyLights() {
  const flicker = 0.9 + 0.1 * Math.sin(game.time * 13) * Math.sin(game.time * 7);
  return [
    { x: lobby.fire.x, y: lobby.fire.y, radius: 6 * flicker },
    { x: lobby.portal.x, y: lobby.portal.y, radius: 3.5, power: 0.8 },
    { x: lobby.merchant.x, y: lobby.merchant.y, radius: 2.5, power: 0.7 },
  ];
}

function drawCrate(c) {
  drawBox(c.x - 0.38, c.y - 0.38, 0, 0.76, 0.76, 0.7, "#9a6b3a");
  drawBox(c.x - 0.39, c.y - 0.05, 0.3, 0.78, 0.1, 0.1, "#6e4a24");
}

function drawMapTable() {
  const t = lobby.table;
  // 다리
  for (const [ox, oy] of [[-0.5, -0.32], [0.42, -0.32], [-0.5, 0.24], [0.42, 0.24]]) drawBox(t.x + ox, t.y + oy, 0, 0.08, 0.08, 0.5, "#5b3c1e");
  drawBox(t.x - 0.6, t.y - 0.4, 0.5, 1.2, 0.8, 0.1, "#8a5a2e");
  // 지도 종이와 빨간 X
  const paper = [toScreen(t.x - 0.45, t.y - 0.28, 0.61), toScreen(t.x + 0.45, t.y - 0.28, 0.61), toScreen(t.x + 0.45, t.y + 0.28, 0.61), toScreen(t.x - 0.45, t.y + 0.28, 0.61)];
  fillPoly(paper, "#ead9a7");
  const c = toScreen(t.x + 0.1, t.y, 0.61);
  ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(c.x - 6, c.y - 3); ctx.lineTo(c.x + 6, c.y + 3); ctx.moveTo(c.x + 6, c.y - 3); ctx.lineTo(c.x - 6, c.y + 3); ctx.stroke();
  ctx.strokeStyle = "rgba(90,60,30,0.7)"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  const a = toScreen(t.x - 0.35, t.y + 0.15, 0.61);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(a.x + 10, a.y - 20, c.x, c.y); ctx.stroke();
  ctx.setLineDash([]);
}

function drawCampfire() {
  const f = lobby.fire;
  drawBox(f.x - 0.4, f.y - 0.08, 0, 0.8, 0.16, 0.14, "#4a2e16");
  drawBox(f.x - 0.08, f.y - 0.4, 0.02, 0.16, 0.8, 0.14, "#5b3a1e");
  const t = game.time;
  const flames = [
    [0, 0, 0.55 + 0.1 * Math.sin(t * 11), "#ff7a1a"],
    [0.1, -0.08, 0.35 + 0.08 * Math.sin(t * 13 + 1), "#ffb321"],
    [-0.1, 0.06, 0.4 + 0.08 * Math.sin(t * 9 + 2), "#ff9a1f"],
    [0, 0.02, 0.25 + 0.06 * Math.sin(t * 15), "#fff2a8"],
  ];
  for (const [ox, oy, h, c] of flames) drawBox(f.x + ox - 0.1, f.y + oy - 0.1, 0.14, 0.2, 0.2, h, c);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const s = toScreen(f.x, f.y, 0.4);
  const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 60 * ZOOM);
  g.addColorStop(0, "rgba(255,160,60,0.4)");
  g.addColorStop(1, "rgba(255,120,30,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(s.x, s.y, 60 * ZOOM, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPortal() {
  const p = lobby.portal;
  const t = game.time;
  drawBox(p.x - 1.2, p.y - 0.2, 0, 0.4, 0.4, 2.3, "#3b2e4f");
  // 가운데 소용돌이
  ctx.save();
  const pts = [toScreen(p.x - 0.8, p.y, 0.05), toScreen(p.x + 0.8, p.y, 0.05), toScreen(p.x + 0.8, p.y, 2.2), toScreen(p.x - 0.8, p.y, 2.2)];
  const g = ctx.createLinearGradient(pts[0].x, pts[3].y, pts[1].x, pts[0].y);
  g.addColorStop(0, `hsla(${270 + 20 * Math.sin(t * 2)}, 90%, 45%, 0.85)`);
  g.addColorStop(0.5, `hsla(${300 + 20 * Math.sin(t * 3)}, 100%, 65%, 0.9)`);
  g.addColorStop(1, `hsla(${250 + 20 * Math.sin(t * 2.5)}, 90%, 45%, 0.85)`);
  fillPoly(pts, g);
  ctx.globalCompositeOperation = "lighter";
  const c = toScreen(p.x, p.y, 1.1);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(230,190,255,${0.35 - i * 0.08})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, (18 + i * 12) * ZOOM * (0.8 + 0.2 * Math.sin(t * 3 + i)), (28 + i * 16) * ZOOM * 0.8, t * (i % 2 ? 1 : -1), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  drawBox(p.x + 0.8, p.y - 0.2, 0, 0.4, 0.4, 2.3, "#3b2e4f");
  drawBox(p.x - 1.25, p.y - 0.25, 2.3, 2.5, 0.5, 0.35, "#4b3b63");
}

// 말 걸 수 있는 것 머리 위 이름과 안내
function drawNpcLabels() {
  for (const n of npcs) {
    const s = toScreen(n.x, n.y, n.label === "포털" ? 2.9 : 1.55);
    text(n.label, s.x, s.y, 15 * ZOOM * 0.8, "#ffe27a", "center");
  }
  const n = game.nearNpc;
  if (n && !game.overlay) {
    const s = toScreen(n.x, n.y, n.label === "포털" ? 2.9 : 1.55);
    const bob = Math.sin(game.time * 5) * 3;
    const how = touch.show ? `"${n.short}" 버튼` : "E 키";
    text(`${how}: ${n.prompt}`, s.x, s.y - 24 + bob, 18 * ZOOM * 0.8, "#7dffb0", "center");
  }
}
