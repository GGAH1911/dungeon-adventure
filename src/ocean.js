// ===== 월드 2 깊은 바다: 맵, 바다 환경, 바다 지도 (설계서 docs/design/world2-ocean.md 2장) =====
// 1단계: 맵 1 햇살 산호초(해류 띠), 맵 2 다시마 숲(다시마 덤불)
// 환경은 맵의 features 숫자대로 씨앗 난수(rand)로 놓아요 (같이 하기에서 방장·친구가 같은 자리)
//   world.w2 = { currents: [], kelp: [] }
// 공정성 규칙: 월드 2 에서는 모든 예고 장판 자리에 빛을 더해요 (어둠이 위험을 숨기지 않게)

const W2_MAPS = [
  { world: 2, unlockAfter: "void", key: ["guardian"],
    id: "shallows", name: "햇살 산호초", desc: "물살이 휙휙! 물살을 타고 산호 사이를 달려요",
    minLevel: 33, size: 60, rooms: 12, count: 32, reward: 110, features: { currents: 6 },
    monsters: { w2_puffer: 3, w2_shrimp: 2, w2_jelly: 3, w2_turtle: 1, crab: 2, thief: 1 },
    theme: { floor: "#d8c89a", moss: "#ff8f7a", wall: "#3f8f9a", darkness: 0.18, bg: "#0a3a4a" } },
  { world: 2, unlockAfter: "shallows", key: ["shards", "mimic"],
    id: "kelp", name: "다시마 숲", desc: "키 큰 다시마 속에 몬스터가 숨어 있어요",
    minLevel: 35, size: 62, rooms: 13, count: 34, reward: 125, features: { kelp: 14, currents: 2 },
    monsters: { w2_eel: 2, w2_jelly: 2, w2_puffer: 2, w2_shrimp: 2, w2_seahorse: 1, w2_turtle: 1, crab: 1, thief: 1 },
    theme: { floor: "#6f8f6a", moss: "#3f8a4a", wall: "#3a5a52", darkness: 0.4, bg: "#06201a" } },
  { world: 2, unlockAfter: "kelp", key: ["crackwall", "hold", "twins"],
    id: "wreck", name: "가라앉은 배 무덤", desc: "부서진 배 사이, 거품 기둥이 하트를 채워줘요",
    minLevel: 37, size: 64, rooms: 13, count: 36, reward: 140, features: { vents: 6, currents: 2 },
    monsters: { w2_turtle: 2, w2_puffer: 2, w2_shrimp: 2, w2_urchin: 2, w2_seahorse: 1, crab: 1, jellyCube: 1, thief: 1 },
    theme: { floor: "#7a6a52", moss: "#5fa8a0", wall: "#4a3e34", darkness: 0.45, bg: "#081a20" } },
  { world: 2, unlockAfter: "wreck", key: ["plates", "guardian"],
    id: "icefloe", name: "꽁꽁 얼음 바다", desc: "미끄러운 얼음판! 쭉 미끄러지며 펭귄을 피해요",
    minLevel: 39, size: 64, rooms: 13, count: 36, reward: 150, features: { ice: 9, vents: 2 },
    monsters: { w2_penguin: 3, w2_puffer: 2, w2_turtle: 2, w2_shrimp: 2, w2_jelly: 1, w2_seahorse: 1, thief: 1 },
    theme: { floor: "#8fa8b8", moss: "#a8c8d8", wall: "#4f7a98", darkness: 0.22, bg: "#0a2a40" } },
  { world: 2, unlockAfter: "icefloe", key: ["memory", "shards"],
    id: "songreef", name: "노래하는 산호밭", desc: "통통 해면을 밟으면 붕 날아올라요",
    minLevel: 41, size: 64, rooms: 14, count: 36, reward: 160, features: { sponges: 9, currents: 2 },
    monsters: { w2_starfish: 3, w2_jelly: 2, w2_seahorse: 2, w2_shrimp: 2, w2_puffer: 1, w2_urchin: 1, thief: 1 },
    theme: { floor: "#d8bcd0", moss: "#f2a0c8", wall: "#8a5aa0", darkness: 0.25, bg: "#200a30" } },
  { world: 2, unlockAfter: "songreef", key: ["dark", "levers", "mimic"],
    id: "trench", name: "깜깜 해구", desc: "빛나는 산호만 반짝이는 깊고 깜깜한 골짜기",
    minLevel: 43, size: 64, rooms: 14, count: 34, reward: 170, features: { glow: 34 },
    monsters: { w2_angler: 3, w2_jelly: 3, w2_eel: 2, w2_seahorse: 1, w2_shrimp: 1, thief: 1 },
    theme: { floor: "#2f3a5a", moss: "#5ff0d0", wall: "#1e2640", darkness: 0.72, bg: "#02040c" } },
  { world: 2, unlockAfter: "trench", key: ["thief", "twins"],
    id: "sharkreef", name: "상어 암초", desc: "커다란 덫 조개! 몬스터를 조개 위로 데려가요",
    minLevel: 45, size: 66, rooms: 14, count: 38, reward: 180, features: { clams: 12, kelp: 4 },
    monsters: { w2_sharkling: 3, w2_eel: 2, w2_urchin: 2, w2_shrimp: 2, w2_turtle: 1, w2_seahorse: 1, thief: 1 },
    theme: { floor: "#b8a888", moss: "#5fb0c0", wall: "#4a6070", darkness: 0.35, bg: "#062030" } },
  { world: 2, unlockAfter: "sharkreef", key: ["traphall", "guardian"],
    id: "vents", name: "뜨거운 열수구", desc: "바닥에서 뜨거운 물기둥이 솟아요! 예고를 보고 피해요",
    minLevel: 47, size: 66, rooms: 14, count: 38, reward: 190, features: { geysers: 12, currents: 2 },
    monsters: { w2_urchin: 3, w2_turtle: 2, w2_puffer: 2, w2_shrimp: 2, w2_seahorse: 1, w2_penguin: 1, crab: 1, thief: 1 },
    theme: { floor: "#4a4048", moss: "#ff8a4a", wall: "#3a3036", darkness: 0.5, bg: "#140808", lava: true } },
  { world: 2, unlockAfter: "vents", key: ["torches", "crackwall", "twins"],
    id: "sunken", name: "잠긴 도시", desc: "옛 도시의 물 파이프! 들어가면 슝 다른 방으로",
    minLevel: 49, size: 68, rooms: 15, count: 40, reward: 205, features: { pipes: 4, glow: 10 },
    monsters: { w2_octo: 3, w2_turtle: 2, w2_angler: 2, w2_urchin: 2, w2_seahorse: 1, w2_sharkling: 1, thief: 1 },
    theme: { floor: "#9a9a8a", moss: "#7fd0b0", wall: "#5a6a6a", darkness: 0.5, bg: "#04121a" } },
  { world: 2, unlockAfter: "sunken", key: ["levers", "hold", "twins"],
    id: "abyss", name: "심해 궁전", desc: "깊은 바다 맨 아래, 바다 용왕의 궁전",
    minLevel: 52, size: 70, rooms: 15, count: 40, reward: 225, features: { currents: 3, vents: 3, glow: 12 },
    monsters: { w2_turtle: 2, w2_eel: 2, w2_angler: 2, w2_seahorse: 2, w2_urchin: 2, w2_octo: 1, w2_starfish: 1, w2_sharkling: 1, w2_jelly: 1, thief: 1 },
    theme: { floor: "#3a4a6a", moss: "#e0c060", wall: "#2a3550", darkness: 0.55, bg: "#03060f" } },
];
for (const m of W2_MAPS) MAPS.push(m);

// 모험 지도 자리 (바다 지도: 왼쪽 위 해안 -> 오른쪽 아래 심해, 10곳이 길처럼 이어져요)
Object.assign(WORLD_PLACES, {
  shallows: { x: 360, y: 300 }, kelp: { x: 700, y: 470 }, wreck: { x: 1080, y: 330 },
  icefloe: { x: 1480, y: 230 }, songreef: { x: 1900, y: 380 }, trench: { x: 1700, y: 720 },
  sharkreef: { x: 1260, y: 820 }, vents: { x: 820, y: 1000 }, sunken: { x: 1240, y: 1260 }, abyss: { x: 1860, y: 1290 },
});

function inWorld2Dungeon() { return game.scene === "dungeon" && game.mapDef && mapWorld(game.mapDef) === 2; }

// ===== 환경 놓기 =====
hookOn("reset", () => { if (world) world.w2 = null; }, 50);
hookOn("monstersSpawned", (def, level, rand) => {
  if (!def || mapWorld(def) !== 2 || !def.features) return;
  const f = def.features;
  world.w2 = { currents: [], kelp: [] };
  const rooms = (world.rooms || []).slice(1); // 시작 방 빼고
  const floorAt = (x, y) => world.tiles[Math.floor(y)] && world.tiles[Math.floor(y)][Math.floor(x)] === 0;
  // ① 해류 띠: 방을 가로지르는 띠 (끝은 방 안쪽, 막힌 구석으로 몰지 않아요)
  for (let i = 0; i < (f.currents || 0) && rooms.length; i++) {
    const r = rooms[Math.floor(rand() * rooms.length)];
    const horiz = rand() < 0.5, dir = rand() < 0.5 ? 1 : -1;
    const len = Math.min(9, (horiz ? r.w : r.h) - 2), wid = 1.8;
    if (len < 4) continue;
    const x0 = horiz ? r.cx - len / 2 : r.cx - wid / 2, y0 = horiz ? r.cy - wid / 2 : r.cy - len / 2;
    const x1 = horiz ? x0 + len : x0 + wid, y1 = horiz ? y0 + wid : y0 + len;
    let ok = true;
    for (let y = y0; y < y1 && ok; y += 0.5) for (let x = x0; x < x1; x += 0.5) if (!floorAt(x, y)) { ok = false; break; }
    if (!ok) continue;
    world.w2.currents.push({ x0, y0, x1, y1, dx: horiz ? dir : 0, dy: horiz ? 0 : dir, push: 1.6 });
  }
  // ② 다시마 덤불
  for (let i = 0; i < (f.kelp || 0) && rooms.length; i++) {
    const r = rooms[Math.floor(rand() * rooms.length)];
    const x = r.x + 1.5 + rand() * Math.max(0.1, r.w - 3), y = r.y + 1.5 + rand() * Math.max(0.1, r.h - 3);
    if (!floorAt(x, y)) continue;
    const rr = 1.5 + rand() * 1.0, stalks = [];
    for (let k = 0; k < 9; k++) { const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * rr * 0.9; if (floorAt(x + Math.cos(a) * d, y + Math.sin(a) * d)) stalks.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, h: 1.2 + rand() * 0.8, ph: rand() * 6 }); }
    world.w2.kelp.push({ x, y, r: rr, stalks });
  }
}, 60);

function inCurrent(c, x, y) { return x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1; }
function inKelp(x, y) { const w = world.w2; if (!w) return null; for (const k of w.kelp) if (Math.hypot(x - k.x, y - k.y) < k.r) return k; return null; }

// 물살: 주인공은 밀려요 (구르는 중은 조금만). 둥실 몬스터(복어·해파리)도 밀려요
hookOn("playersUpdated", (dt) => {
  if (!inWorld2Dungeon() || !world.w2) return;
  dt = dt || 1 / 60;
  for (const p of allPlayers()) {
    if (p.hp <= 0) continue;
    for (const c of world.w2.currents) if (inCurrent(c, p.x, p.y)) {
      const k = p.rollTimer > 0 ? 0.3 : 1;
      moveEntity(p, c.dx * c.push * k * dt, c.dy * c.push * k * dt);
      if (!world.w2.taught && typeof showMessage === "function") { world.w2.taught = true; showMessage("물살! 거스르면 느려요, 타면 빨라요", 2.5, false, "#9fe6ff"); }
    }
  }
}, 96); // 같이 하기: netplay 가 친구 자리를 적어 둔 뒤(95)에 밀어야 친구 기기도 밀려요
hookOn("dungeonTick", (dt) => {
  if (!inWorld2Dungeon() || !world.w2) return;
  for (const m of monsters) {
    if (!m.def || !m.def.floaty || m.hp <= 0) continue;
    for (const c of world.w2.currents) if (inCurrent(c, m.x, m.y)) moveEntity(m, c.dx * c.push * 0.6 * dt, c.dy * c.push * 0.6 * dt);
  }
}, 60);

// 다시마 덤불 속 몬스터는 흐릿하게 (공격 준비 중이면 꼭 또렷하게: 예고는 숨기지 않아요)
hookOn("monsterAlpha", (a, m) => {
  if (!inWorld2Dungeon() || !world.w2 || m.boss || m.elite) return a;
  if (m.state === "cast" || m.state === "windup" || m.state === "fuse") return a;
  if (!inKelp(m.x, m.y)) return a;
  const p = nearestPlayer(m.x, m.y);
  return p && Math.hypot(p.x - m.x, p.y - m.y) > 2.5 ? Math.min(a, 0.3) : a;
}, 50);

// ===== 그리기 =====
hookOn("drawFloor", () => {
  if (!inWorld2Dungeon() || !world.w2) return;
  for (const c of world.w2.currents) {
    if (!onScreen((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, 6)) continue;
    fillPoly([toScreen(c.x0, c.y0, 0.01), toScreen(c.x1, c.y0, 0.01), toScreen(c.x1, c.y1, 0.01), toScreen(c.x0, c.y1, 0.01)], "rgba(150,230,255,0.18)");
    // 흐르는 V자 화살표
    const len = c.dx ? c.x1 - c.x0 : c.y1 - c.y0, n = Math.max(3, Math.round(len / 2));
    ctx.save(); ctx.strokeStyle = "rgba(220,250,255,0.75)"; ctx.lineWidth = 3 * ZOOM; ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const t = ((i / n + game.time * 0.35) % 1);
      const cx = c.dx ? (c.dx > 0 ? c.x0 + t * len : c.x1 - t * len) : (c.x0 + c.x1) / 2;
      const cy = c.dy ? (c.dy > 0 ? c.y0 + t * len : c.y1 - t * len) : (c.y0 + c.y1) / 2;
      const px = -c.dy, py = c.dx;
      const tip = toScreen(cx + c.dx * 0.3, cy + c.dy * 0.3, 0.02), a = toScreen(cx - c.dx * 0.1 + px * 0.45, cy - c.dy * 0.1 + py * 0.45, 0.02), b = toScreen(cx - c.dx * 0.1 - px * 0.45, cy - c.dy * 0.1 - py * 0.45, 0.02);
      ctx.globalAlpha = Math.sin(t * Math.PI);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }
}, 50);
hookOn("worldThings", (things) => {
  if (!inWorld2Dungeon() || !world.w2) return;
  for (const k of world.w2.kelp) {
    if (!onScreen(k.x, k.y, 4)) continue;
    const busy = monsters.some((m) => m.hp > 0 && !m.boss && Math.hypot(m.x - k.x, m.y - k.y) < k.r); // 몬스터가 숨어 있으면 빨리 흔들려요 (단서)
    for (const s of k.stalks) things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
      const sp = busy ? 6 : 2, sw = Math.sin(game.time * sp + s.ph) * (busy ? 0.1 : 0.05);
      for (let i = 0; i < 4; i++) drawBox(s.x - 0.06 + sw * i, s.y - 0.06, i * s.h / 4, 0.12, 0.12, s.h / 4, i % 2 ? "#3f8a4a" : "#4fa05a");
      if (busy && Math.random() < 0.05) addSparkle(s.x, s.y, s.h, { vz: 1, gravity: -0.2, life: 0.8, size: 0.4, hue: 190 });
    } });
  }
}, 50);

// 월드 2: 예고 장판 자리에 빛 (어둠 속에서도 위험이 보여요)
hookOn("lights", (lights) => {
  if (game.scene !== "dungeon" || !game.mapDef || mapWorld(game.mapDef) !== 2) return;
  const per = {};
  for (const c of casts) {
    if (c.m === game.player || (c.m && c.m.ally)) continue;
    per[c.id] = (per[c.id] || 0) + 1; if (per[c.id] > 3) continue;
    const sh = c.ab.telegraph.shape;
    if (sh === "line") for (const t of [0, 0.5, 1]) lights.push({ x: c.x + c.dirX * c.length * t, y: c.y + c.dirY * c.length * t, radius: c.width / 2 + 1.0, power: 0.75 });
    else if (sh === "cone") lights.push({ x: c.x + c.dirX * c.length * 0.5, y: c.y + c.dirY * c.length * 0.5, radius: c.length * 0.6, power: 0.75 });
    else lights.push({ x: c.x, y: c.y, radius: (c.radius || 1.5) + 0.6, power: 0.8 });
  }
}, 60);

// ===== 바다 지도 (모험 지도의 배경, 한 번만 그려요) =====
function buildSeaTerrain() {
  const c = document.createElement("canvas");
  c.width = WORLD_W; c.height = WORLD_H;
  const g = c.getContext("2d");
  const rand = makeRandom(20261004);
  // 위(얕은 바다)는 밝게, 아래(심해)는 어둡게
  const grad = g.createLinearGradient(0, 0, WORLD_W * 0.6, WORLD_H);
  grad.addColorStop(0, "#5fb8c8"); grad.addColorStop(0.45, "#2a7a9a"); grad.addColorStop(1, "#0a1a3a");
  g.fillStyle = grad; g.fillRect(0, 0, WORLD_W, WORLD_H);
  // 물결 무늬
  g.strokeStyle = "rgba(220,250,255,0.18)"; g.lineWidth = 3;
  for (let i = 0; i < 180; i++) { const x = rand() * WORLD_W, y = rand() * WORLD_H * 0.7; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 8, x + 28, y); g.quadraticCurveTo(x + 42, y + 8, x + 56, y); g.stroke(); }
  // 지역 10곳 (WORLD_PLACES 자리): 산호초 · 다시마 숲 · 배 무덤 · 얼음 바다 · 노래 산호밭 · 해구 · 상어 암초 · 열수구 · 잠긴 도시 · 심해 궁전
  const region = (cx, cy, rx, ry, color, bump = 0.3) => { noisyBlob(g, cx, cy, { x: rx, y: ry }, rand, bump); g.fillStyle = color; g.fill(); };
  const P = WORLD_PLACES;
  region(P.shallows.x, P.shallows.y, 240, 170, "rgba(232,214,160,0.85)");
  region(P.kelp.x, P.kelp.y + 10, 200, 150, "rgba(70,140,90,0.75)");
  region(P.wreck.x, P.wreck.y, 200, 150, "rgba(120,100,80,0.7)");
  region(P.icefloe.x, P.icefloe.y, 220, 150, "rgba(235,248,255,0.8)");
  region(P.songreef.x, P.songreef.y, 210, 160, "rgba(220,170,220,0.7)");
  region(P.trench.x, P.trench.y + 20, 230, 190, "rgba(10,14,40,0.8)");
  region(P.sharkreef.x, P.sharkreef.y, 210, 150, "rgba(150,160,150,0.6)");
  region(P.vents.x, P.vents.y, 210, 160, "rgba(120,60,50,0.7)");
  region(P.sunken.x, P.sunken.y, 220, 160, "rgba(110,120,110,0.65)");
  region(P.abyss.x, P.abyss.y, 240, 190, "rgba(60,70,120,0.8)");
  // 산호·다시마 점
  for (let i = 0; i < 220; i++) { const x = 300 + rand() * 900, y = 220 + rand() * 600; g.fillStyle = ["#ff8f7a", "#ffb04a", "#c87aff", "#4fa05a"][Math.floor(rand() * 4)]; g.globalAlpha = 0.55; g.fillRect(x, y, 6 + rand() * 6, 6 + rand() * 10); }
  g.globalAlpha = 1;
  // 거품
  for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(230,250,255,${0.15 + rand() * 0.25})`; g.lineWidth = 2; g.beginPath(); g.arc(rand() * WORLD_W, rand() * WORLD_H, 3 + rand() * 8, 0, Math.PI * 2); g.stroke(); }
  // 해구의 갈라진 틈
  g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 10; g.beginPath(); g.moveTo(P.trench.x - 180, P.trench.y - 60); g.quadraticCurveTo(P.trench.x, P.trench.y + 40, P.trench.x + 180, P.trench.y + 100); g.stroke();
  return c;
}

// 바다 맵 그림 (지도 위 장소)
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (mapWorld(m) !== 2) return false;
  const g = ctx, C = (c) => greyish(c, locked);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(10,20,30,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(10,20,30,0.6)"; g.lineWidth = 1.2; g.stroke(); };
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  switch (m.id) {
    case "shallows":
      rect(-22, -6, 44, 10, C("#e8d6a0"));
      rect(-16, -26, 8, 22, C("#ff8f7a")); rect(-6, -34, 8, 30, C("#ffb04a")); rect(6, -22, 8, 18, C("#c87aff")); rect(14, -14, 6, 10, C("#ff8f7a"));
      break;
    case "kelp":
      for (const [ox, h] of [[-14, 34], [-4, 44], [6, 38], [16, 28]]) { rect(ox - 2, -h, 4, h + 2, C("#3f8a4a")); circ(ox + 3, -h + 6, 3, C("#4fa05a")); }
      break;
    default:
      circ(0, -14, 14, C("#3a6a9a")); circ(-4, -18, 4, "#e6fbff");
  }
  return true;
}, 50);

// ===== 안내 문구 (guide.js 가 먼저 읽혀요) =====
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_snapShot: { text: "조준선이 멈추면 옆으로!" },
  w2_jellyPulse: { text: "찌릿! 뒤로 갔다 때려요" },
  w2_shellSpin: { text: "옆으로 피하고 등 뒤를!" },
  w2_bubbleTrap: { text: "파란 원 밖으로!" },
  w2_currentLanes: { text: "반짝이는 물길에서 나와요" },
  w2_clawSlam: { text: "원 밖으로! 박히면 공격!", do: true },
  w2_shellRain: { text: "원 사이로 걸어가요" },
  w2_shellCharge: { text: "빨간 길 옆으로!" },
  w2_clamInhale: { text: "입을 두 번 맞혀요!", do: true },
  w2_clamChomp: { text: "원 밖으로 굴러요!" },
  w2_pearlVolley: { text: "옆으로 돌아요!" },
  w2_kelpSprouts: { text: "다시마 손을 끊어요", do: true },
  w2_bubbleRing: { text: "조개 옆 금색 안으로!", do: true },
});
