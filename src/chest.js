// ===== 보물상자 =====
// 던전 곳곳에 상자가 있어요. 가까이 가서 "열기"(키보드 E)!
// 황금 상자는 더 좋은 게 나와요. 가끔 새 장비도 들어 있어요.

let chests = [];

function placeChests(rand) {
  chests = [];
  const rooms = world.rooms.slice(1);
  if (!rooms.length) return;
  const n = 3 + (rand() < 0.5 ? 1 : 0);
  for (let tries = 0; tries < 60 && chests.length < n; tries++) {
    const room = rooms[Math.floor(rand() * rooms.length)];
    const spot = randomSpotInRoom(room, rand);
    if (chests.some((c) => Math.hypot(c.x - spot.x, c.y - spot.y) < 3)) continue;
    if (hitsWall(spot.x, spot.y, 0.5)) continue;
    if (typeof nearStair === "function" && nearStair(spot.x, spot.y, 1.2)) continue; // 계단 길은 비워 둬요 (terrain.js)
    if (typeof w2EnvKeepClear === "function" && w2EnvKeepClear(spot.x, spot.y)) continue; // 바다 해면 길·파이프 (ocean_env.js)
    addChest(spot.x, spot.y, rand() < 0.22);
  }
}

function addChest(x, y, gold) {
  const c = { x, y, gold, open: false, openT: 0, r: 0.38 };
  chests.push(c);
  world.solids.push({ x, y, r: 0.38 });
  return c;
}

function chestInteractables() {
  return chests.filter((c) => !c.open).map((c) => ({
    x: c.x, y: c.y, range: 1.5, short: "열기", prompt: c.gold ? "황금 상자 열기" : "상자 열기", action: () => openChest(c),
  }));
}

function openChest(c) { if (c.open) return; const r = openChestBase(c); hookRun("chestOpened", c); return r; } // 강화 물약 (buffpots.js)
function openChestBase(c) {
  if (c.open) return;
  c.open = true;
  c.openT = 0;
  recShared("chest"); // 열린 상자 수 (같이 하기: 친구도, records.js)
  sfx.chest();
  game.shake = Math.max(game.shake, 0.12);
  for (let i = 0; i < (c.gold ? 30 : 16); i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(c.x, c.y, 0.5, { vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, vz: 2 + Math.random() * 2, life: 0.8, size: 0.8, gold: true, gravity: 3 });
  }
  if (c.gold) addRing(c.x, c.y, { speed: 4, life: 0.5, gold: true });
  chestLoot(c);
}

// 상자에서 나오는 것
function chestLoot(c) {
  const L = game.mapLevel || 1;
  const pop = (type, extra = {}) => {
    const a = Math.random() * Math.PI * 2, s = 1.2 + Math.random() * 1.8;
    pickups.push({ type, x: c.x, y: c.y, z: 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 3 + Math.random() * 2, t: 0, ...extra });
  };
  // 에메랄드
  const em = Math.round((c.gold ? 10 + Math.random() * 8 : 4 + Math.random() * 4) * (1 + 0.05 * (L - 1)));
  for (let i = 0; i < em; i++) pop("emerald");
  // 화폐와 장비 (맵 레벨에 맞게: currency.js, loot.js)
  chestGear(c);
  // 덤
  const extras = c.gold ? 2 : 1;
  for (let i = 0; i < extras; i++) {
    const r = Math.random() * 100;
    if (r < 40) pop("arrows");
    else if (r < 62) pop("special", { arrowType: ["fire", "ice", "bomb"][Math.floor(Math.random() * 3)] });
    else if (r < 82) pop("potion");
    else pop("apple");
  }
}

function updateChests(dt) { const r = updateChestsBase(dt); hookRun("dungeonTick", dt); return r; }
function updateChestsBase(dt) {
  for (const c of chests) if (c.open) c.openT += dt;
}

function chestThings(things) {
  for (const c of chests) if (onScreen(c.x, c.y)) things.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => drawChest(c) });
}

function drawChest(c) {
  const body = c.gold ? "#d9a520" : "#8a5a2b";
  const trim = c.gold ? "#fff1a8" : "#d9a520";
  const w = 0.62, d = 0.44;
  const x = c.x - w / 2, y = c.y - d / 2;
  drawBox(x, y, 0, w, d, 0.34, body);
  drawBox(x - 0.01, y + d / 2 - 0.04, 0.02, w + 0.02, 0.08, 0.3, trim);
  if (!c.open) {
    drawBox(x - 0.02, y - 0.02, 0.34, w + 0.04, d + 0.04, 0.16, shade(body, 1.1));
    drawBox(x + w / 2 - 0.05, y + d - 0.01, 0.26, 0.1, 0.04, 0.12, trim); // 자물쇠
    // 반짝반짝 (여기 있어요!)
    if (Math.sin(game.time * 3 + c.x) > 0.7) {
      const s = toScreen(c.x, c.y, 0.6);
      drawStar(s.x, s.y, 8 * ZOOM, "rgba(255,240,170,0.9)");
    }
    return;
  }
  // 뚜껑이 뒤로 열려요
  drawBox(x - 0.02, y - 0.16, 0.36, w + 0.04, 0.14, 0.4, shade(body, 1.1));
  // 상자 안에서 빛이 나와요
  const k = Math.max(0, 1 - c.openT / 1.8);
  if (k > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const b = toScreen(c.x, c.y, 0.35);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.25 + Math.sin(game.time * 3 + i) * 0.05;
      const L = (60 + i * 8) * ZOOM;
      ctx.beginPath();
      ctx.moveTo(b.x - 6, b.y); ctx.lineTo(b.x + Math.cos(a - 0.08) * L, b.y + Math.sin(a - 0.08) * L);
      ctx.lineTo(b.x + Math.cos(a + 0.08) * L, b.y + Math.sin(a + 0.08) * L); ctx.lineTo(b.x + 6, b.y);
      ctx.closePath();
      ctx.fillStyle = c.gold ? `rgba(255,220,100,${0.35 * k})` : `rgba(255,240,200,${0.25 * k})`;
      ctx.fill();
    }
    ctx.restore();
  }
}
