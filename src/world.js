// ===== 세상: 바닥, 벽, 던전 만들기, 길찾기, 미니맵 =====
// tiles[y][x]:  0 = 바닥,  1~2 = 벽(높이),  3 = 낮은 벽(앞쪽),  9 = 꽉 찬 바위(안 그려요)

const VOID = 9;
const LOW_WALL = 3;
const world = {
  W: 0, H: 0,
  tiles: [], pattern: [],
  theme: null,
  solids: [],     // 동그란 장애물 (모닥불, 탁자 등)
  rooms: [],
  start: { x: 0, y: 0 },
  explored: null, mini: null, miniCtx: null,
};

// 같은 seed 를 넣으면 항상 같은 순서로 나오는 "주사위"
function makeRandom(seed) {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function resetWorld(W, H, fill, theme) {
  world.W = W; world.H = H; world.theme = theme; world.path = null;
  world.tiles = []; world.pattern = []; world.solids = []; world.rooms = [];
  for (let y = 0; y < H; y++) {
    world.tiles.push(new Array(W).fill(fill));
    world.pattern.push(Array.from({ length: W }, () => Math.random()));
  }
}

// 바위 중에서 바닥 옆에 붙은 것만 "벽"으로 보여줘요
function finishWalls(rand) {
  const { W, H, tiles } = world;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (tiles[y][x] !== -1) continue;
      let nearFloor = false;
      for (let dy = -1; dy <= 1 && !nearFloor; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = tiles[y + dy] && tiles[y + dy][x + dx];
          if (t === 0) { nearFloor = true; break; }
        }
      if (!nearFloor) { tiles[y][x] = VOID; continue; }
      // 바닥보다 화면 앞쪽에 있는 벽은 낮게 (주인공을 가리지 않게)
      const floorBehind = [[-1, 0], [0, -1], [-1, -1]].some(([dx, dy]) => tiles[y + dy] && tiles[y + dy][x + dx] === 0);
      tiles[y][x] = floorBehind ? LOW_WALL : rand() < 0.3 ? 2 : 1;
    }
  }
}

// ----- 던전 만들기: 방 여러 개를 복도로 이어요 -----
function generateDungeon(def) {
  const rand = makeRandom(Date.now() % 1000000 + 7);
  const W = def.size, H = def.size;
  resetWorld(W, H, -1, def.theme);

  const rooms = [];
  for (let tries = 0; tries < 600 && rooms.length < def.rooms; tries++) {
    const w = 6 + Math.floor(rand() * 7), h = 6 + Math.floor(rand() * 7);
    const x = 2 + Math.floor(rand() * (W - w - 4)), y = 2 + Math.floor(rand() * (H - h - 4));
    const overlaps = rooms.some((r) => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y);
    if (overlaps) continue;
    rooms.push({ x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
  }
  for (const r of rooms)
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) world.tiles[y][x] = 0;

  // 복도: 각 방을 이미 연결된 방 중 가장 가까운 방과 이어요
  const carve = (x, y) => {
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++)
        if (y + dy > 0 && y + dy < H - 1 && x + dx > 0 && x + dx < W - 1) world.tiles[y + dy][x + dx] = 0;
  };
  for (let i = 1; i < rooms.length; i++) {
    let best = rooms[0], bestD = Infinity;
    for (let j = 0; j < i; j++) {
      const d = Math.hypot(rooms[i].cx - rooms[j].cx, rooms[i].cy - rooms[j].cy);
      if (d < bestD) { bestD = d; best = rooms[j]; }
    }
    let x = Math.floor(rooms[i].cx), y = Math.floor(rooms[i].cy);
    const tx = Math.floor(best.cx), ty = Math.floor(best.cy);
    const horizontalFirst = rand() < 0.5;
    if (horizontalFirst) {
      while (x !== tx) { carve(x, y); x += Math.sign(tx - x); }
      while (y !== ty) { carve(x, y); y += Math.sign(ty - y); }
    } else {
      while (y !== ty) { carve(x, y); y += Math.sign(ty - y); }
      while (x !== tx) { carve(x, y); x += Math.sign(tx - x); }
    }
    carve(x, y);
  }

  // 큰 방에는 기둥
  for (const r of rooms) {
    if (r.w < 9 || r.h < 9) continue;
    const n = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const px = r.x + 2 + Math.floor(rand() * (r.w - 4));
      const py = r.y + 2 + Math.floor(rand() * (r.h - 4));
      if (Math.abs(px + 0.5 - r.cx) < 1.5 && Math.abs(py + 0.5 - r.cy) < 1.5) continue;
      world.tiles[py][px] = rand() < 0.5 ? 2 : 1;
    }
  }

  finishWalls(rand);
  world.rooms = rooms;
  world.start = { x: rooms[0].cx, y: rooms[0].cy };
  initExplore();
  return rand;
}

// ----- 로비 만들기 -----
function buildLobbyWorld() {
  const W = LOBBY.width, H = LOBBY.height;
  resetWorld(W, H, 0, LOBBY.theme);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (x === W - 1 || y === H - 1) world.tiles[y][x] = LOW_WALL;
      else if (x === 0 || y === 0) world.tiles[y][x] = 1;
  world.path = world.tiles.map((row) => row.map(() => false));
  world.start = { x: 15, y: 15.5 };
  world.explored = null;
  world.mini = null;
}

// 흙길 그리기 (로비)
function carvePath(ax, ay, bx, by) {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
  for (let i = 0; i <= n; i++) {
    const x = ax + ((bx - ax) * i) / n, y = ay + ((by - ay) * i) / n;
    for (const [ox, oy] of [[0, 0], [0.6, 0], [0, 0.6]]) {
      const tx = Math.floor(x + ox), ty = Math.floor(y + oy);
      if (world.path[ty] && world.tiles[ty][tx] === 0) world.path[ty][tx] = true;
    }
  }
}

function isWall(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= world.W || ty >= world.H) return true;
  return world.tiles[ty][tx] > 0;
}

// 동그라미(x, y, 반지름 r)가 벽이나 장애물에 닿는지
function hitsWall(x, y, r) {
  for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) {
    for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) {
      if (!isWall(tx, ty)) continue;
      const nx = Math.max(tx, Math.min(x, tx + 1));
      const ny = Math.max(ty, Math.min(y, ty + 1));
      if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
    }
  }
  for (const s of world.solids) {
    if ((x - s.x) ** 2 + (y - s.y) ** 2 < (r + s.r) ** 2) return true;
  }
  return false;
}

// 벽에 막히면 미끄러지듯 움직이기
function moveEntity(e, dx, dy) {
  // 너무 빠르면 나눠서 움직여요 (벽 뚫기 방지)
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.2));
  for (let i = 0; i < steps; i++) {
    if (!hitsWall(e.x + dx / steps, e.y, e.r)) e.x += dx / steps;
    if (!hitsWall(e.x, e.y + dy / steps, e.r)) e.y += dy / steps;
  }
}

// 두 점 사이에 벽이 없나 (활 쏘기, 알아채기)
function lineOfSight(ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay);
  const n = Math.ceil(d / 0.25);
  for (let i = 1; i < n; i++) {
    const x = ax + ((bx - ax) * i) / n, y = ay + ((by - ay) * i) / n;
    if (isWall(Math.floor(x), Math.floor(y))) return false;
  }
  return true;
}

function randomSpotInRoom(room, rand) {
  for (let t = 0; t < 40; t++) {
    const x = room.x + 1 + rand() * (room.w - 2), y = room.y + 1 + rand() * (room.h - 2);
    if (!hitsWall(x, y, 0.45)) return { x, y };
  }
  return { x: room.cx, y: room.cy };
}

// ===== 길찾기 =====
// 주인공이 있는 칸에서부터 물결처럼 퍼져나가며 "몇 걸음 거리인지" 적어둬요.
// 몬스터는 숫자가 더 작은 옆 칸으로 가면 벽을 돌아서 주인공한테 올 수 있어요.
let pathDist = [];
let pathFrom = { x: -1, y: -1 };

function updatePaths(px, py) {
  const sx = Math.floor(px), sy = Math.floor(py);
  if (sx === pathFrom.x && sy === pathFrom.y) return;
  pathFrom = { x: sx, y: sy };
  pathDist = world.tiles.map((row) => row.map(() => Infinity));
  if (isWall(sx, sy)) return;
  pathDist[sy][sx] = 0;
  const queue = [[sx, sy]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (pathDist[y][x] > 40) continue; // 너무 먼 곳은 계산 안 해요
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (isWall(nx, ny) || pathDist[ny][nx] !== Infinity) continue;
      pathDist[ny][nx] = pathDist[y][x] + 1;
      queue.push([nx, ny]);
    }
  }
}

function nextStepToward(x, y) {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (!pathDist[ty] || pathDist[ty][tx] === undefined) return null;
  let best = null, bestD = pathDist[ty][tx];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const nx = tx + dx, ny = ty + dy;
    if (isWall(nx, ny)) continue;
    if (dx !== 0 && dy !== 0 && (isWall(tx + dx, ty) || isWall(tx, ty + dy))) continue;
    const d = pathDist[ny][nx] + (dx !== 0 && dy !== 0 ? 0.4 : 0);
    if (d < bestD) { bestD = d; best = { x: nx + 0.5, y: ny + 0.5 }; }
  }
  return best;
}

// ===== 그리기 =====
// 바닥: 같은 색 칸끼리 묶어서 한 번에 칠해요 (빠르게!)
function drawFloor() {
  const th = world.theme;
  const groups = {};
  const lavaPulse = th.lava ? 0.85 + 0.15 * Math.sin(game.time * 2.5) : 1;
  for (let y = 0; y < world.H; y++) {
    for (let x = 0; x < world.W; x++) {
      if (world.tiles[y][x] !== 0) continue;
      if (!onScreen(x + 0.5, y + 0.5)) continue;
      const v = world.pattern[y][x];
      const isMoss = v < 0.15;
      let color = shade(isMoss ? th.moss : th.floor, 0.85 + (Math.round(v * 6) / 6) * 0.25);
      if (world.path && world.path[y][x]) color = shade(th.path, 0.9 + (Math.round(v * 4) / 4) * 0.15);
      if (isMoss && th.lava) color = shade(th.moss, Math.round(lavaPulse * 10) / 10);
      (groups[color] = groups[color] || []).push(x, y);
    }
  }
  for (const color in groups) {
    const list = groups[color];
    ctx.beginPath();
    for (let i = 0; i < list.length; i += 2) {
      const x = list[i], y = list[i + 1];
      const a = toScreen(x, y), b = toScreen(x + 1, y), c = toScreen(x + 1, y + 1), d = toScreen(x, y + 1);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
    }
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// 화면에 보이는 벽을 그리기 목록에 넣어요
function collectWalls(things, p) {
  for (let ty = 0; ty < world.H; ty++) {
    for (let tx = 0; tx < world.W; tx++) {
      const h = world.tiles[ty][tx];
      if (h === 0 || h === VOID) continue;
      if (!onScreen(tx + 0.5, ty + 0.5)) continue;
      things.push({ depth: tx + ty + 1, draw: () => drawWall(tx, ty, h, p) });
    }
  }
}

function drawWall(tx, ty, h, p) {
  // 주인공을 가리는 벽은 반투명하게
  const inFront = tx + ty + 1 > p.x + p.y && Math.abs((tx + 0.5 - p.x) - (ty + 0.5 - p.y)) < 2.5 && tx + ty + 1 - (p.x + p.y) < 3;
  ctx.save();
  if (h === LOW_WALL) {
    drawBox(tx, ty, 0, 1, 1, 0.4, shade(world.theme.wall, 0.85));
  } else {
    if (inFront) ctx.globalAlpha = 0.35;
    for (let level = 0; level < h; level++) {
      drawBox(tx, ty, level, 1, 1, 1, shade(world.theme.wall, 0.9 + level * 0.1));
    }
  }
  ctx.restore();
}

// ===== 미니맵 =====
// 가본 곳만 지도에 그려져요.
function initExplore() {
  world.explored = new Uint8Array(world.W * world.H);
  world.mini = document.createElement("canvas");
  world.mini.width = world.W;
  world.mini.height = world.H;
  world.miniCtx = world.mini.getContext("2d");
}

function revealAround(x, y, r = 7) {
  if (!world.explored) return;
  const cx = Math.floor(x), cy = Math.floor(y);
  const mc = world.miniCtx;
  for (let ty = cy - r; ty <= cy + r; ty++) {
    for (let tx = cx - r; tx <= cx + r; tx++) {
      if (tx < 0 || ty < 0 || tx >= world.W || ty >= world.H) continue;
      const i = ty * world.W + tx;
      if (world.explored[i]) continue;
      if ((tx - cx) ** 2 + (ty - cy) ** 2 > r * r) continue;
      world.explored[i] = 1;
      const t = world.tiles[ty][tx];
      if (t === VOID) continue;
      mc.fillStyle = t === 0 ? "#cfc6b0" : "#5a5248";
      mc.fillRect(tx, ty, 1, 1);
    }
  }
}

// 미니맵도 화면처럼 비스듬하게 그려요
function drawMinimap(p, list) {
  if (!world.mini) return;
  const size = Math.min(260, view.w * 0.24);
  const k = size / (world.W + world.H);
  const ox = view.w - 16 - world.W * k, oy = 96;
  // 세상 (x, y) -> 미니맵 화면
  const M = (x, y) => ({ x: ox + (x - y) * k, y: oy + (x + y) * k / 2 });
  const left = M(0, world.H), right = M(world.W, 0), bottom = M(world.W, world.H);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  const top = M(0, 0);
  ctx.moveTo(top.x, top.y - 4); ctx.lineTo(right.x + 6, right.y); ctx.lineTo(bottom.x, bottom.y + 4); ctx.lineTo(left.x - 6, left.y);
  ctx.closePath(); ctx.fill();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.9;
  const dpr = ctx.getTransform().a;
  ctx.setTransform(k * dpr, (k / 2) * dpr, -k * dpr, (k / 2) * dpr, ox * dpr, oy * dpr);
  ctx.drawImage(world.mini, 0, 0);
  ctx.restore();

  // 몬스터 (가본 곳에 있거나, 몇 마리 안 남았으면 다 보여줘요)
  const few = list.length <= 3;
  for (const m of list) {
    const i = Math.floor(m.y) * world.W + Math.floor(m.x);
    if (!few && !world.explored[i]) continue;
    const s = M(m.x, m.y);
    const blink = few ? 0.5 + 0.5 * Math.sin(game.time * 8) : 1;
    ctx.fillStyle = `rgba(255,70,70,${blink})`;
    ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
  }
  const ps = M(p.x, p.y);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(ps.x, ps.y, 3.5, 0, Math.PI * 2); ctx.fill();
  return bottom.y;
}
