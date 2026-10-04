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
    monsters: { lurker: 2, w2_jelly: 2, w2_puffer: 2, w2_shrimp: 2, w2_seahorse: 1, w2_turtle: 1, crab: 1, thief: 1 },
    theme: { floor: "#6f8f6a", moss: "#3f8a4a", wall: "#3a5a52", darkness: 0.4, bg: "#06201a" } },
];
for (const m of W2_MAPS) MAPS.push(m);

// 모험 지도 자리 (바다 지도: 왼쪽 위 해안 -> 오른쪽 아래 심해)
Object.assign(WORLD_PLACES, {
  shallows: { x: 520, y: 380 }, kelp: { x: 900, y: 640 }, wreck: { x: 1320, y: 520 },
  trench: { x: 1480, y: 960 }, vents: { x: 1960, y: 760 }, abyss: { x: 1920, y: 1320 },
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
}, 60);
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
    for (const s of k.stalks) things.push({ depth: s.x + s.y, draw: () => {
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
  // 지역: 산호초 · 다시마 숲 · 배 무덤 · 해구 · 열수구 · 궁전
  const region = (cx, cy, rx, ry, color, bump = 0.3) => { noisyBlob(g, cx, cy, { x: rx, y: ry }, rand, bump); g.fillStyle = color; g.fill(); };
  region(520, 380, 280, 200, "rgba(232,214,160,0.85)");  // 모래 산호초
  region(900, 650, 240, 180, "rgba(70,140,90,0.75)");     // 다시마 숲
  region(1320, 520, 240, 170, "rgba(120,100,80,0.7)");    // 배 무덤
  region(1480, 980, 260, 220, "rgba(10,14,40,0.8)");      // 해구
  region(1960, 760, 220, 180, "rgba(120,60,50,0.7)");     // 열수구
  region(1920, 1330, 260, 200, "rgba(60,70,120,0.8)");    // 심해 궁전
  // 산호·다시마 점
  for (let i = 0; i < 220; i++) { const x = 300 + rand() * 900, y = 220 + rand() * 600; g.fillStyle = ["#ff8f7a", "#ffb04a", "#c87aff", "#4fa05a"][Math.floor(rand() * 4)]; g.globalAlpha = 0.55; g.fillRect(x, y, 6 + rand() * 6, 6 + rand() * 10); }
  g.globalAlpha = 1;
  // 거품
  for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(230,250,255,${0.15 + rand() * 0.25})`; g.lineWidth = 2; g.beginPath(); g.arc(rand() * WORLD_W, rand() * WORLD_H, 3 + rand() * 8, 0, Math.PI * 2); g.stroke(); }
  // 해구의 갈라진 틈
  g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 10; g.beginPath(); g.moveTo(1300, 900); g.quadraticCurveTo(1480, 1000, 1660, 1060); g.stroke();
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
