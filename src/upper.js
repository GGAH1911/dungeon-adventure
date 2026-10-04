// ===== 위층 (보너스 층): 던전마다 큰 계단 하나 -> 위층으로 올라갔다가 다시 내려와요 =====
// 위층: 방 3~4개의 작은 층. 몬스터는 조금(레벨 +1), 정예 하나, 황금 상자 하나. 조금 더 밝아요.
// 내려오면 아래층이 그대로 (몬스터·상자·지도), 다시 올라가도 위층이 그대로.
// 열쇠 찾기·보스 문은 아래층 것이라 위층에선 쉬어요 (game.upper).
// 같이 하기: 방장이 올라가면 다 같이 (장면 열쇠에 "up"). 친구 기기는 같은 씨앗으로 같은 위층을 만들어요.

const UPPER = { size: 30, rooms: 4, countK: 0.5, levelUp: 1, darkK: 0.6 };

function upperSeed() { return ((world.seed || 1) * 7 + 13) % 2147483647; }
// 아래층에 큰 계단 자리 정하기 (시작 방·보스 문에서 멀리)
hookOn("dungeonStarted", (def) => {
  game.upper = false; game.upperSnap = null; game.mainSnap = null; game.upStairs = null; game.downStairs = null;
  if (game.mode !== "dungeon" || !def || def.type === "tower" || def.noUpper || !world.rooms || world.rooms.length < 3) return;
  const rand = makeRandom((world.seed || 1) * 13 + 5);
  const kh = game.keyhunt, door = kh && kh.door;
  const rooms = world.rooms.slice(1).filter((r) => r.w >= 6 && r.h >= 6);
  for (let t = 0; t < 30 && rooms.length; t++) {
    const r = rooms[Math.floor(rand() * rooms.length)];
    const x = Math.floor(r.x + 1 + rand() * (r.w - 2)) + 0.5, y = Math.floor(r.y + 1 + rand() * (r.h - 2)) + 0.5;
    if (isWall(Math.floor(x), Math.floor(y)) || nearStair(x, y, 2) || hitsWall(x, y, 0.9)) continue;
    if (door && Math.hypot(door.x - x, door.y - y) < 4) continue;
    if (Math.hypot(world.start.x - x, world.start.y - y) < 6) continue;
    if (chests.some((c) => Math.hypot(c.x - x, c.y - y) < 2)) continue;
    if (interactables().some((n) => Math.hypot(n.x - x, n.y - y) < 3.5)) continue; // E 가 다른 물건(레버·문)을 잡지 않게
    if (world.solids.some((o) => Math.hypot(o.x - x, o.y - y) < 1.6)) continue;
    game.upStairs = { x, y };
    world.solids.push({ x, y, r: 0.55, upStairs: true });
    return;
  }
}, 70);

// 아래층·위층 저장 / 되돌리기
function upperSnapshot() {
  return { W: world.W, H: world.H, tiles: world.tiles, pattern: world.pattern, theme: world.theme, solids: world.solids, rooms: world.rooms, start: world.start,
    explored: world.explored, mini: world.mini, miniCtx: world.miniCtx, path: world.path, hgt: world.hgt, sdir: world.sdir, raised: world.raised, seed: world.seed,
    monsters, chests, pickups };
}
function upperRestore(S) {
  Object.assign(world, { W: S.W, H: S.H, tiles: S.tiles, pattern: S.pattern, theme: S.theme, solids: S.solids, rooms: S.rooms, start: S.start, explored: S.explored,
    mini: S.mini, miniCtx: S.miniCtx, path: S.path, hgt: S.hgt, sdir: S.sdir, raised: S.raised, seed: S.seed });
  monsters = S.monsters.filter((m) => m.hp > 0); chests = S.chests; pickups = S.pickups || [];
}
function upperClearEffects() {
  const kh = game.keyhunt;
  if (kh) kh.keepOnReset = true;
  resetEffects();
  if (kh) kh.keepOnReset = false;
}
// 모두 (x, y) 근처로 (같이 하기·둘이 하기 친구도)
function upperPlaceAll(x, y) {
  const list = allPlayers();
  list.forEach((q, i) => {
    const s = findFreeSpot(x + (i % 2 ? 0.8 : -0.8) * Math.min(1, i), y + 0.9, q.r || 0.35, 4) || findFreeSpot(x, y, q.r || 0.35, 6) || { x, y };
    q.x = s.x; q.y = s.y; q.rollTimer = 0; q.move = null;
  });
  camera.x = game.player.x; camera.y = game.player.y; camera.z = groundZ(game.player.x, game.player.y);
  game.fade = 0.5;
  hookRun("playersTeleported"); // 같이 하기: 친구 기기도 이 자리로 (netplay.js)
}

function enterUpperFloor() {
  if (game.upper || !game.upStairs || game.mode !== "dungeon") return;
  const def = game.mapDef, level = game.mapLevel;
  game.mainSnap = upperSnapshot();
  upperClearEffects();
  if (game.upperSnap) upperRestore(game.upperSnap);
  else {
    const upDef = { ...def, size: UPPER.size, rooms: UPPER.rooms, count: Math.max(4, Math.round((def.count || 12) * UPPER.countK)), theme: { ...def.theme, darkness: Math.max(0.08, (def.theme.darkness || 0.3) * UPPER.darkK) } };
    const rand = generateDungeon(upDef, upperSeed());
    spawnMonsters(upDef, level + UPPER.levelUp, rand);
    // 정예는 몬스터를 세울 때 저절로 (mobs_extra.js assignElites)
    chests = []; pickups = [];
    // 황금 상자: 가장 먼 방 가운데
    const room = world.rooms.slice(1).sort((a, b) => Math.hypot(b.cx - world.start.x, b.cy - world.start.y) - Math.hypot(a.cx - world.start.x, a.cy - world.start.y))[0] || world.rooms[0];
    const c = findFreeSpot(room.cx, room.cy, 0.5, 4) || { x: room.cx, y: room.cy };
    addChest(c.x, c.y, true);
    const s2 = findFreeSpot(world.start.x + 1.5, world.start.y, 0.5, 4);
    if (s2) addChest(s2.x, s2.y, false);
    game.downStairs = { x: world.start.x, y: world.start.y - 0.6 };
    world.solids.push({ x: game.downStairs.x, y: game.downStairs.y, r: 0.5, downStairs: true });
    game.upperFresh = true;
  }
  game.upper = true;
  const d = game.downStairs;
  upperPlaceAll(d.x, d.y + 0.6);
  if (typeof sfx !== "undefined" && sfx.stairs) sfx.stairs();
  showMessage(game.upperFresh ? "위층! 황금 상자를 찾아요 · 계단으로 다시 내려갈 수 있어요" : "다시 위층!", 3, false, "#ffe27a");
  game.upperFresh = false;
  hookRun("upperChanged", true);
}
function leaveUpperFloor() {
  if (!game.upper || !game.mainSnap) return;
  game.upperSnap = upperSnapshot();
  upperClearEffects();
  upperRestore(game.mainSnap);
  game.mainSnap = null;
  game.upper = false;
  const u = game.upStairs;
  upperPlaceAll(u.x, u.y + 0.6);
  if (typeof sfx !== "undefined" && sfx.stairs) sfx.stairs();
  showMessage("아래층으로 내려왔어요", 2, false, "#ffe27a");
  hookRun("upperChanged", false);
}

// 말 걸기 (E): 올라가기 / 내려가기
hookOn("dungeonInteractables", (list) => {
  if (game.mode !== "dungeon") return list;
  if (!game.upper && game.upStairs && !(game.keyhunt && game.keyhunt.inBoss)) list.push({ x: game.upStairs.x, y: game.upStairs.y, range: 1.7, short: "위층", prompt: "위층으로 올라가요", action: enterUpperFloor });
  if (game.upper && game.downStairs) list.push({ x: game.downStairs.x, y: game.downStairs.y, range: 1.7, short: "아래층", prompt: "아래층으로 내려가요", action: leaveUpperFloor });
  return list;
}, 50);

// 그리기: 올라가는 큰 계단 (위로 이어지는 돌계단 + 어두운 입구), 내려가는 계단 (바닥 구멍 + 계단)
function drawUpStairs(s) {
  const c = "#c9b48a", x = s.x - 0.6, y = s.y - 0.6;
  for (let k = 0; k < 4; k++) drawBox(x, y + k * 0.3, 0, 1.2, 1.2 - k * 0.3, 0.35 * (4 - k), shade(c, 0.85 + k * 0.05));
  drawBox(x + 0.2, y - 0.05, 1.4, 0.8, 0.12, 0.9, "#2a2230"); // 위층 입구
  const t = toScreen(s.x, s.y, 2.7 + 0.1 * Math.sin(game.time * 4));
  text("▲", t.x, t.y, 18 * ZOOM * 0.8, "#ffe27a", "center");
}
function drawDownStairs(s) {
  const P = toScreen, x = s.x - 0.6, y = s.y - 0.6;
  fillPoly([P(x, y, 0.01), P(x + 1.2, y, 0.01), P(x + 1.2, y + 1.2, 0.01), P(x, y + 1.2, 0.01)], "#1a1620");
  for (let k = 0; k < 3; k++) fillPoly([P(x + 0.1, y + 0.15 + k * 0.32, 0.02), P(x + 1.1, y + 0.15 + k * 0.32, 0.02), P(x + 1.1, y + 0.33 + k * 0.32, 0.02), P(x + 0.1, y + 0.33 + k * 0.32, 0.02)], shade("#c9b48a", 0.55 + k * 0.15));
  const t = toScreen(s.x, s.y, 1.2 + 0.1 * Math.sin(game.time * 4));
  text("▼", t.x, t.y, 18 * ZOOM * 0.8, "#ffe27a", "center");
}
hookOn("worldThings", (things) => {
  if (game.mode !== "dungeon") return;
  if (!game.upper && game.upStairs && onScreen(game.upStairs.x, game.upStairs.y, 3)) { const s = game.upStairs; things.push({ depth: s.x + s.y + 0.6, x: s.x, y: s.y, draw: () => drawUpStairs(s) }); }
  if (game.upper && game.downStairs && onScreen(game.downStairs.x, game.downStairs.y, 3)) { const s = game.downStairs; things.push({ depth: s.x + s.y - 0.6, x: s.x, y: s.y, draw: () => drawDownStairs(s) }); }
}, 55);
hookOn("lights", (lights) => {
  if (!game.upper && game.upStairs) lights.push({ x: game.upStairs.x, y: game.upStairs.y, radius: 2.4, power: 0.7 });
  if (game.upper && game.downStairs) lights.push({ x: game.downStairs.x, y: game.downStairs.y, radius: 2.4, power: 0.7 });
}, 55);
// 미니맵: 계단 표시 (가 본 곳이면)
hookOn("minimapDraw", () => {
  const s = game.upper ? game.downStairs : game.upStairs;
  if (!s || !world.mini || game.mode !== "dungeon" || !world.explored || !world.explored[Math.floor(s.y) * world.W + Math.floor(s.x)]) return;
  const size = Math.min(260, view.w * 0.24, view.h * 0.42), k = size / (world.W + world.H), ox = view.w - 16 - world.W * k, oy = 96;
  const m = { x: ox + (s.x - s.y) * k, y: oy + (s.x + s.y) * k / 2 };
  text(game.upper ? "▼" : "▲", m.x, m.y + 4, 12, "#ffe27a", "center");
}, 60);
