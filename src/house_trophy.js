// ===== 집: 월드별 트로피 룸 =====
// WORLD_ORDER 의 월드마다 트로피 룸이 하나씩 저절로 생겨요 (월드 5·6 ... 이 생겨도 이 파일은 그대로).
//   방 크기는 그 월드 보스 수에 맞춰요: 받침대를 방 둘레에 ㄷ 모양(왼쪽 줄 · 뒤 줄 · 오른쪽 줄)으로 1.3칸마다.
//   방 가운데: 그 월드 탑 트로피 자리. 탑 파일이 hookOn("houseCrowns", list => list.push({ world, id, name, has })) 로 알려줘요.
//   방 색: 그 월드 캠프 색(WORLDS[w].lobbyTheme). 장식은 hookOn("houseRoomDecor", (w, room, things) => ...) 로 더해요 (월드 1~4 는 아래에).
//   보스를 다 모으면 방이 금빛이 되고 "완전 정복" 현판이 나와요.
// 이 파일은 house.js 바로 뒤에 불러요. 트로피 그림·기록 글은 showcase.js (drawTrophy · trophyInfo).

const HT = { s: 1.3 }; // 받침대 사이
function houseCrowns() { return hookFilter("houseCrowns", []).filter((c) => c && Number.isFinite(c.world) && typeof c.has === "function"); }
// (뒤에 불리는 파일용) 탑 트로피 등록하기
function houseRegisterCrown(c) { hookOn("houseCrowns", (l) => { l.push(c); return l; }); }

// 방 크기 정하기: 뒤 줄 a 개, 양옆 줄 b 개씩 (a + 2b >= 보스 수)
function houseTrophyPlan(w) {
  const maps = typeof trophyMapsOf === "function" ? trophyMapsOf(w) : [];
  const n = maps.length, s = HT.s;
  const a = Math.max(5, Math.ceil(n * 0.45)), b = Math.max(1, Math.ceil((n - a) / 2));
  return { n, a, b, w: Math.ceil(2 + s * (a + 1)), d: Math.ceil(1 + s * b + 4.5), maps: maps.map((m) => m.id) };
}
// 받침대 자리 (방 자리가 정해진 뒤 houseLayout 이 불러요)
function houseTrophyPlace(r) {
  const P = r.plan, s = HT.s, slots = [];
  if (P.n <= P.a) { for (let i = 0; i < P.n; i++) slots.push({ x: r.x0 + 1 + s * (i + 1 + (P.a - P.n) / 2), y: r.y0 + 1, side: "back" }); }
  else {
    for (let j = P.b - 1; j >= 0; j--) slots.push({ x: r.x0 + 1, y: r.y0 + 1 + s * (j + 1), side: "left" });
    for (let i = 0; i < P.a; i++) slots.push({ x: r.x0 + 1 + s * (i + 1), y: r.y0 + 1, side: "back" });
    for (let j = 0; j < P.b; j++) slots.push({ x: r.x0 + 1 + s * (P.a + 1), y: r.y0 + 1 + s * (j + 1), side: "right" });
  }
  r.spots = P.maps.map((id, i) => ({ ...slots[i], z: 0, mapId: id }));
  const crowns = houseCrowns().filter((c) => c.world === r.world);
  const cy = r.y0 + 1 + s * (P.b + 1) / 2 + 0.6;
  r.centers = crowns.map((c, i) => ({ x: r.x0 + r.w / 2 + (i - (crowns.length - 1) / 2) * 1.6, y: cy, crown: c }));
}
function houseTrophyRooms() { return houseRooms().filter((r) => r.world !== undefined); }
function houseTrophyRoom(w) { return houseRoom("trophy" + w); }
// 탑 트로피 자리 (탑 파일이 불러요)
function houseCrownSpot(id) {
  for (const r of houseTrophyRooms()) for (const c of r.centers || []) if (c.crown.id === id) return c;
  return null;
}
function houseTrophyWon(id) { const t = game.profile && game.profile.trophies && game.profile.trophies[id]; return !!(t && t.wins); }
function houseTrophyDone(r) { return r.spots.length > 0 && r.spots.every((s) => houseTrophyWon(s.mapId)); }
function houseTrophyTheme(w) { return (typeof WORLDS !== "undefined" && WORLDS[w] && WORLDS[w].lobbyTheme) || (w === 1 && typeof LOBBY_THEME_1 !== "undefined" ? LOBBY_THEME_1 : { floor: "#8a7a6a", path: "#a89880", wall: "#6a6058" }); }
function houseTrophyFloor(r, x, y, v) {
  if (houseTrophyDone(r)) return shade((x + y) % 2 ? "#e8c860" : "#d4b048", 0.95 + Math.round(v * 3) / 3 * 0.08);
  const th = houseTrophyTheme(r.world), c = th.path || th.floor;
  return shade(c, ((x + y) % 2 ? 0.92 : 0.82) + Math.round(v * 3) / 3 * 0.06);
}
function houseTrophyWall(r) { return houseTrophyDone(r) ? "#c9a24a" : houseTrophyTheme(r.world).wall; }
function houseTrophySolids() {
  for (const r of houseTrophyRooms()) {
    for (const s of r.spots) world.solids.push({ x: s.x, y: s.y, r: 0.32 });
    for (const c of r.centers) world.solids.push({ x: c.x, y: c.y, r: 0.34 });
  }
}
// 받침대 앞 자리 (E 누르는 곳: 방 안쪽으로 한 칸)
function houseTrophyFront(s) { return s.side === "left" ? { x: s.x + 0.85, y: s.y } : s.side === "right" ? { x: s.x - 0.85, y: s.y } : { x: s.x, y: s.y + 0.85 }; }
const houseHop = new Map(); // 트로피 깡충 (맵 id -> 남은 시간)
function houseTrophyThings(things, vis) {
  for (const r of houseTrophyRooms()) {
    if (!vis.has(r.id)) continue;
    for (const s of r.spots) {
      const won = houseTrophyWon(s.mapId);
      things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
        const h = houseHop.get(s.mapId) || 0, hop = h > 0 ? Math.sin((0.5 - h) / 0.5 * Math.PI) * 0.35 : 0;
        if (hop > 0) { drawBox(s.x - 0.32, s.y - 0.32, 0, 0.64, 0.64, 0.3, "#8a6a42"); drawBox(s.x - 0.36, s.y - 0.36, 0.3, 0.72, 0.72, 0.06, "#c9a24a"); if (won) drawTrophyMini(s.mapId, s.x, s.y, 0.36 + hop); }
        else drawTrophy(s, s.mapId, won);
      } });
    }
    for (const c of r.centers) things.push({ depth: c.x + c.y - 0.2, x: c.x, y: c.y, draw: () => {
      drawBox(c.x - 0.7, c.y - 0.7, 0, 1.4, 1.4, 0.03, "#c9a24a"); drawBox(c.x - 0.6, c.y - 0.6, 0.03, 1.2, 1.2, 0.01, "#7a3a5a");
      if (!c.crown.has()) { drawBox(c.x - 0.32, c.y - 0.32, 0.04, 0.64, 0.64, 0.18, "#4a4458"); const t = toScreen(c.x, c.y, 0.7); text("?", t.x, t.y, Math.round(10 * ZOOM), "#8a84a0", "center"); }
    } });
    // 현판 (뒤 벽 가운데)
    const px = r.x0 + r.w / 2;
    things.push({ depth: px + 1.15 + r.y0, x: px, y: r.y0, draw: () => { const done = houseTrophyDone(r); drawBox(px - 1.1, r.y0 - 0.03, 1.55, 2.2, 0.04, 0.4, done ? "#ffd23f" : "#6b4a2a"); drawBox(px - 1.0, r.y0 - 0.02, 1.6, 2.0, 0.04, 0.3, done ? "#fff0a0" : "#8a6038"); } });
    hookRun("houseRoomDecor", r.world, r, things);
  }
}
// 현판 글·트로피 이름 (house.js 이름표 그리기에서)
function drawTrophyRoomLabels(r) {
  const won = r.spots.filter((s) => houseTrophyWon(s.mapId)).length, done = houseTrophyDone(r), t = toScreen(r.x0 + r.w / 2, r.y0, 1.75);
  text(done ? `${houseWorldName(r.world)} 완전 정복!` : `${houseWorldName(r.world)} 트로피 ${won}/${r.spots.length}`, t.x, t.y, Math.round(8 * ZOOM), done ? "#fff6c0" : "#f2e6c8", "center");
}
function houseTrophyLook(s) {
  const m = MAPS.find((x) => x.id === s.mapId); if (!m) return;
  const inf = trophyInfo(m), line = typeof storyBossLine === "function" ? storyBossLine(s.mapId) : "";
  showMessage(inf.text + (inf.won && line ? ` · ${line}` : ""), 3.5, inf.won);
  if (inf.won) { houseHop.set(s.mapId, 0.5); if (typeof bossVoice === "function") bossVoice(s.mapId, "intro"); }
}
hookOn("netTick", (dt) => { for (const [k, v] of houseHop) { if (v - dt <= 0) houseHop.delete(k); else houseHop.set(k, v - dt); } }, 71);
hookOn("lobbyInteractables", (list) => {
  for (const r of houseTrophyRooms()) {
    for (const s of r.spots) {
      const f = houseTrophyFront(s), m = MAPS.find((x) => x.id === s.mapId), inf = m ? trophyInfo(m) : { sum: "빈 받침대", name: "빈 받침대" };
      list.push({ x: f.x, y: f.y, range: 0.85, label: inf.name, short: "보기", prompt: inf.sum, action: () => houseTrophyLook(s), local: true });
    }
    for (const c of r.centers) if (!c.crown.has()) list.push({ x: c.x, y: c.y + 0.9, range: 1.0, label: "빈 받침대", short: "보기", prompt: `${c.crown.name} 트로피 자리`, local: true,
      action: () => { const nm = c.crown.name; showMessage(`빈 받침대: ${josa(nm, "을/를")} 끝까지 오르면 트로피가 와요`, 2.6); } });
  }
  return list;
}, 61);

// ----- 월드 1~4 장식 (새 월드는 자기 파일에서 houseRoomDecor 로 더해요) -----
function htCorner(r) { return [{ x: r.x1 - 0.6, y: r.y1 - 0.6 }, { x: r.x0 + 2.6, y: r.y1 - 0.6 }]; }
hookOn("houseRoomDecor", (w, r, things) => {
  const C = htCorner(r);
  if (w === 1) { // 햇빛 땅: 해 창문 + 나무 화분
    const x = r.x1 - 2.2;
    things.push({ depth: x + 0.6 + r.y0 + 0.05, x, y: r.y0, draw: () => { drawBox(x - 0.6, r.y0 - 0.03, 0.9, 1.2, 0.04, 0.9, "#6b4a2a"); drawBox(x - 0.5, r.y0 - 0.02, 0.98, 1.0, 0.04, 0.74, "#9fd8ff"); drawBox(x - 0.15, r.y0 - 0.01, 1.3, 0.3, 0.04, 0.3, "#ffd23f"); } });
    for (const c of C) things.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => { drawBox(c.x - 0.22, c.y - 0.22, 0, 0.44, 0.44, 0.35, "#b8643a"); drawBox(c.x - 0.3, c.y - 0.3, 0.35, 0.6, 0.6, 0.5, "#5aa548"); drawBox(c.x - 0.2, c.y - 0.2, 0.85, 0.4, 0.4, 0.3, "#6cbf55"); } });
  } else if (w === 2) { // 깊은 바다: 수족관 유리벽 + 해초
    const y = r.y0 - 0.02;
    for (let tx = r.x0; tx < r.x1; tx++) things.push({ depth: tx + r.y0 + 0.05, x: tx, y: r.y0, draw: () => { // 벽 칸마다 (벽보다 나중, 받침대보다 먼저)
      ctx.save(); ctx.globalAlpha = 0.5; drawBox(tx, y, 1.3, 1, 0.04, 0.6, "#3a9ad8"); ctx.restore();
      for (let i = 0; i < 4; i++) { const fx = r.x0 + 1 + ((game.time * (0.6 + i * 0.2) + i * 3) % (r.w - 2)); if (fx >= tx && fx < tx + 1) drawBox(fx, y + 0.01, 1.45 + (i % 3) * 0.13, 0.22, 0.03, 0.1, ["#ff8a3a", "#ffd23f", "#ff6aa0", "#9ff0ff"][i]); }
    } });
    for (const c of C) things.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => { for (let k = 0; k < 3; k++) { const sw = Math.sin(game.time * 2 + k) * 0.05; drawBox(c.x - 0.25 + k * 0.2 + sw, c.y - 0.05, 0, 0.08, 0.08, 0.6 + k * 0.2, "#3a9a6a"); } } });
  } else if (w === 3) { // 달: 별 천장 + 은빛 달 공
    things.push({ depth: r.x1 + r.y1 + 5, x: r.x1, y: r.y1, draw: () => {
      for (let i = 0; i < 14; i++) { const sx = r.x0 + ((i * 7.3) % r.w), sy = r.y0 + ((i * 4.1) % r.d); if (Math.sin(game.time * 2 + i * 1.7) > 0.2) { const t = toScreen(sx, sy, 2.6); drawStar(t.x, t.y, 5 * ZOOM, "#fff6c0"); } }
    } });
    const c = C[0]; things.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => { drawBox(c.x - 0.1, c.y - 0.1, 0, 0.2, 0.2, 0.5, "#6a6a84"); drawBox(c.x - 0.3, c.y - 0.3, 0.5, 0.6, 0.6, 0.55, "#dcdce8"); drawBox(c.x - 0.12, c.y + 0.28, 0.75, 0.15, 0.03, 0.15, "#b8b8c8"); } });
  } else if (w === 4) { // 지하세계: 수정 + 버섯 등불
    const c0 = C[0], c1 = C[1];
    things.push({ depth: c0.x + c0.y, x: c0.x, y: c0.y, draw: () => { drawBox(c0.x - 0.2, c0.y - 0.15, 0, 0.3, 0.3, 0.9, "#9ff0ff"); drawBox(c0.x + 0.05, c0.y - 0.3, 0, 0.22, 0.22, 0.6, "#7fd8f0"); drawBox(c0.x - 0.3, c0.y + 0.05, 0, 0.2, 0.2, 0.45, "#bff6ff"); } });
    things.push({ depth: c1.x + c1.y, x: c1.x, y: c1.y, draw: () => { drawBox(c1.x - 0.06, c1.y - 0.06, 0, 0.12, 0.12, 0.7, "#e8dcc0"); drawBox(c1.x - 0.32, c1.y - 0.32, 0.7, 0.64, 0.64, 0.22, "#ff7ac8"); drawBox(c1.x - 0.12, c1.y + 0.3, 0.8, 0.08, 0.03, 0.08, "#fff0f8"); } });
  }
}, 50);
// 월드 5 공허: 천천히 떠다니는 회색 별 + 떠 있는 회색 섬 조각 + 색 수정 (방을 다 모으면 무지개빛으로 빛나요)
//   장식은 모서리 두 곳(htCorner)과 천장 높이에만 있어서 보스가 몇 명이든(방이 커져도) 받침대와 안 겹쳐요
const HT_RAINBOW = ["#ff6a6a", "#ffd23f", "#6adf7a", "#5ab8ff", "#c07aff"];
hookOn("houseRoomDecor", (w, r, things) => {
  if (w !== 5) return;
  const C = htCorner(r), done = houseTrophyDone(r);
  things.push({ depth: r.x1 + r.y1 + 5, x: r.x1, y: r.y1, draw: () => { // 천장 높이 별: 옆으로 천천히 흘러요
    for (let i = 0; i < 16; i++) {
      const sx = r.x0 + ((i * 5.7 + game.time * (0.15 + (i % 3) * 0.05)) % r.w), sy = r.y0 + ((i * 3.3) % r.d);
      const t = toScreen(sx, sy, 2.4 + (i % 4) * 0.15), tw = 0.55 + 0.45 * Math.sin(game.time * 1.5 + i);
      drawStar(t.x, t.y, (3 + (i % 3)) * ZOOM * tw, done ? HT_RAINBOW[i % HT_RAINBOW.length] : "#c8c8d8");
    }
  } });
  const c1 = C[1]; // 떠 있는 회색 섬 조각 (둥실둥실)
  things.push({ depth: c1.x + c1.y, x: c1.x, y: c1.y, draw: () => {
    const b = Math.sin(game.time * 1.3) * 0.08;
    drawBox(c1.x - 0.3, c1.y - 0.25, 0.55 + b, 0.6, 0.5, 0.16, "#8a8a96"); drawBox(c1.x - 0.18, c1.y - 0.15, 0.4 + b, 0.36, 0.3, 0.15, "#6a6a78");
    drawBox(c1.x - 0.24, c1.y - 0.2, 0.71 + b, 0.48, 0.4, 0.04, done ? "#7ac85a" : "#a8a8b4"); // 다 모으면 풀이 돋아요
  } });
  const c0 = C[0]; // 색 수정
  things.push({ depth: c0.x + c0.y, x: c0.x, y: c0.y, draw: () => {
    drawBox(c0.x - 0.25, c0.y - 0.25, 0, 0.5, 0.5, 0.15, "#4a4a58");
    const col = done ? HT_RAINBOW[Math.floor(game.time * 2) % HT_RAINBOW.length] : "#b8b8c8";
    drawBox(c0.x - 0.12, c0.y - 0.12, 0.15, 0.24, 0.24, 0.6, col); drawBox(c0.x - 0.07, c0.y - 0.07, 0.75, 0.14, 0.14, 0.18, shade(col, 1.15));
    if (done && Math.sin(game.time * 4) > 0.3) { const t = toScreen(c0.x, c0.y, 1.1); drawStar(t.x, t.y, 6 * ZOOM, "#ffffff"); }
  } });
}, 50);
hookOn("lights", (lights) => {
  if (game.scene !== "lobby") return;
  for (const r of houseTrophyRooms()) {
    if (!houseRoomVisible(r)) continue;
    if (r.world === 4) { const c = htCorner(r)[1]; lights.push({ x: c.x, y: c.y, radius: 3, power: 0.9 }); }
    if (r.world === 5 && houseTrophyDone(r)) { const c = htCorner(r)[0]; lights.push({ x: c.x, y: c.y, radius: 3, power: 0.9 }); }
    if (houseTrophyDone(r)) lights.push({ x: r.x0 + r.w / 2, y: r.y0 + 1, radius: 5, power: 1 });
  }
});
