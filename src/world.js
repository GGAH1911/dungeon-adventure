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
  world.floorAt = null; world.wallAt = null; // 칸마다 다른 바닥·벽 색 (집 안: house.js). 없으면 테마 색
  world.hgt = null; world.sdir = null; world.raised = 0; // 높낮이 (terrain.js): 랜덤 던전만
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
// seed 를 주면 같은 바닥·벽·방이 나와요 (같이 하기: 방장이 씨앗을 보내요). 없으면 지금처럼 시간으로.
function generateDungeon(def, seed) {
  const s = seed === undefined || seed === null ? Date.now() % 1000000 + 7 : seed;
  const rand = makeRandom(s);
  const W = def.size, H = def.size;
  resetWorld(W, H, -1, def.theme);
  world.seed = s;

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

  world.rooms = rooms;
  world.start = { x: rooms[0].cx, y: rooms[0].cy };
  // 높은 단·2층 방·계단 (terrain.js). 같은 씨앗이면 같은 모양
  if (typeof generateHeights === "function") generateHeights(rand, rooms, def);
  finishWalls(rand);
  initExplore();
  return rand;
}

// ----- 로비 만들기 -----
function buildLobbyWorld() {
  // 캠프(LOBBY.width x height) 오른쪽 멀리 빈 곳(VOID)에 집 안 방이 있어요 (house.js: LOBBY.extraW 만큼 넓혀요)
  //   집 방이 많아지면 아래쪽(LOBBY.extraH)으로도 넓혀요
  const CW = LOBBY.width, CH = LOBBY.height, W = CW + (LOBBY.extraW || 0), H = CH + (LOBBY.extraH || 0);
  resetWorld(W, H, 0, LOBBY.theme);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (x >= CW || y >= CH) world.tiles[y][x] = VOID;
      else if (x === CW - 1 || y === CH - 1) world.tiles[y][x] = LOW_WALL;
      else if (x === 0 || y === 0) world.tiles[y][x] = 1;
  world.path = world.tiles.map((row) => row.map(() => false));
  hookRun("lobbyWorldBuilt"); // 집 방 만들기 (house.js)
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
// refH: 지금 서 있는 바닥 높이 (없으면 (x, y) 칸). 그보다 0.5 넘게 높은 칸은 벽처럼 막혀요 (높은 단은 계단으로만)
function hitsWall(x, y, r, refH) {
  const hg = world.hgt;
  if (hg && refH === undefined) refH = tileH(Math.floor(x), Math.floor(y));
  for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) {
    for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) {
      if (!isWall(tx, ty) && !(hg && hg[ty * world.W + tx] - refH > 0.51)) continue;
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
  // 혹시 벽 안에 끼어 있으면 그냥 움직이게 해서 빠져나오게 해요 (갇힘 방지). 높이는 지금 닿은 가장 높은 칸 기준
  if (hitsWall(e.x, e.y, e.r, world.hgt ? touchMaxH(e.x, e.y, e.r) : undefined)) {
    const free = findFreeSpot(e.x, e.y, e.r, 1.5);
    if (free) { e.x = free.x; e.y = free.y; }
    else { e.x += dx; e.y += dy; }
    return;
  }
  // 너무 빠르면 나눠서 움직여요 (벽 뚫기 방지). 높이는 "지금 닿아 있는 가장 높은 칸" 기준 (뛰어내리기는 돼요)
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.2));
  // 높낮이 맵: 발(중심)이 다른 칸으로 넘어갈 때 0.5 넘게 올라가면 못 가요 (계단으로만).
  //   (예전엔 "닿아 있는 가장 높은 칸" 기준만 봐서, 계단 귀퉁이를 스치며 대각선으로 가면 계단 옆 높은 단(벽처럼 보이는 첫 칸)에 바로 올라갔어요)
  const stepOk = (nx, ny) => {
    if (!world.hgt) return true;
    const ax = Math.floor(e.x), ay = Math.floor(e.y), bx = Math.floor(nx), by = Math.floor(ny);
    return (ax === bx && ay === by) || canStep(ax, ay, bx, by);
  };
  for (let i = 0; i < steps; i++) {
    let h = world.hgt ? touchMaxH(e.x, e.y, e.r) : undefined;
    if (!hitsWall(e.x + dx / steps, e.y, e.r, h) && stepOk(e.x + dx / steps, e.y)) e.x += dx / steps;
    if (world.hgt) h = touchMaxH(e.x, e.y, e.r);
    if (!hitsWall(e.x, e.y + dy / steps, e.r, h) && stepOk(e.x, e.y + dy / steps)) e.y += dy / steps;
  }
}

// (x, y) 근처에서 벽에 안 닿는 가장 가까운 자리 찾기
function findFreeSpot(x, y, r, maxDist = 6) {
  if (!hitsWall(x, y, r)) return { x, y };
  for (let d = 0.25; d <= maxDist; d += 0.25) {
    const n = Math.max(8, Math.round(d * 12));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const nx = x + Math.cos(a) * d, ny = y + Math.sin(a) * d;
      if (!hitsWall(nx, ny, r)) return { x: nx, y: ny };
    }
  }
  return null;
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

function computePathDist(sx, sy) {
  const dist = world.tiles.map((row) => row.map(() => Infinity));
  if (isWall(sx, sy)) return dist;
  dist[sy][sx] = 0;
  const queue = [[sx, sy]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (dist[y][x] > 40) continue; // 너무 먼 곳은 계산 안 해요
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (isWall(nx, ny) || dist[ny][nx] !== Infinity) continue;
      if (world.hgt && !canStep(nx, ny, x, y)) continue; // 몬스터는 (nx,ny)에서 (x,y)로 와요: 올라가기는 계단으로만
      dist[ny][nx] = dist[y][x] + 1;
      queue.push([nx, ny]);
    }
  }
  return dist;
}

function updatePaths(px, py) {
  const sx = Math.floor(px), sy = Math.floor(py);
  if (sx === pathFrom.x && sy === pathFrom.y) return;
  pathFrom = { x: sx, y: sy };
  pathDist = computePathDist(sx, sy);
}

// 쫓는 대상마다 따로 길 지도 (같이 하기: 친구를 쫓는 몬스터는 친구 쪽 길로, 늑대를 쫓으면 늑대 쪽으로)
function pathFieldFor(t) {
  if (!t || t === game.player) return pathDist;
  const sx = Math.floor(t.x), sy = Math.floor(t.y);
  const f = t._pathField;
  if (f && f.x === sx && f.y === sy && f.tiles === world.tiles) return f.dist;
  t._pathField = { x: sx, y: sy, tiles: world.tiles, dist: computePathDist(sx, sy) };
  return t._pathField.dist;
}

function nextStepToward(x, y, target) {
  const pathDist = pathFieldFor(target);
  const tx = Math.floor(x), ty = Math.floor(y);
  if (!pathDist[ty] || pathDist[ty][tx] === undefined) return null;
  let best = null, bestD = pathDist[ty][tx];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const nx = tx + dx, ny = ty + dy;
    if (isWall(nx, ny)) continue;
    if (dx !== 0 && dy !== 0 && (isWall(tx + dx, ty) || isWall(tx, ty + dy))) continue;
    if (world.hgt && (!canStep(tx, ty, nx, ny) || (dx !== 0 && dy !== 0 && (!canStep(tx, ty, tx + dx, ty) || !canStep(tx, ty, tx, ty + dy))))) continue;
    const d = pathDist[ny][nx] + (dx !== 0 && dy !== 0 ? 0.4 : 0);
    if (d < bestD) { bestD = d; best = { x: nx + 0.5, y: ny + 0.5 }; }
  }
  return best;
}

// ===== 그리기 =====
// 바닥 한 칸 색 (높은 단 윗면도 같은 색: terrain.js)
function floorColorAt(x, y, lavaPulse = 1) {
  const th = world.theme, v = world.pattern[y][x];
  if (world.floorAt) { const c = world.floorAt(x, y, v); if (c) return c; }
  const isMoss = v < 0.15;
  let color = shade(isMoss ? th.moss : th.floor, 0.85 + (Math.round(v * 6) / 6) * 0.25);
  if (world.path && world.path[y][x]) color = shade(th.path, 0.9 + (Math.round(v * 4) / 4) * 0.15);
  if (isMoss && th.lava) color = shade(th.moss, Math.round(lavaPulse * 10) / 10);
  return color;
}
// 바닥: 같은 색 칸끼리 묶어서 한 번에 칠해요 (빠르게!). 높은 칸·계단은 drawTerrain 이 그 위에
function drawFloor() {
  const th = world.theme;
  const groups = {};
  const lavaPulse = th.lava ? 0.85 + 0.15 * Math.sin(game.time * 2.5) : 1;
  const hg = world.hgt;
  for (let y = 0; y < world.H; y++) {
    for (let x = 0; x < world.W; x++) {
      if (world.tiles[y][x] !== 0) continue;
      if (hg && hg[y * world.W + x]) continue;
      if (!onScreen(x + 0.5, y + 0.5)) continue;
      const color = floorColorAt(x, y, lavaPulse);
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
  if (hg && typeof drawTerrain === "function") { drawStairApproaches("low"); drawTerrain(); drawStairApproaches("high"); } // 계단 앞뒤 화살표 (terrain.js)
}

// 벽 칸이 이 자리보다 "앞"(화면 아래쪽, 보는 눈과 주인공 사이)에 있나: 두 축 모두 주인공보다 뒤로 넘지 않아야 앞이에요
//   (예전엔 깊이 숫자 tx+ty+1 만 봐서, 주인공 뒤 위쪽 벽 옆 칸도 "앞"으로 보고 반투명하게 그리거나 주인공 위에 덮어 그렸어요:
//    위쪽 벽에 붙으면 벽 속으로 들어가는 것처럼 보였어요)
function wallInFront(tx, ty, e) { return tx + 1 > e.x && ty + 1 > e.y; }
// 화면에 보이는 벽을 그리기 목록에 넣어요
function collectWalls(things, p) {
  const ps = allPlayers().filter((q) => q && q.hp > 0);
  for (let ty = 0; ty < world.H; ty++) {
    for (let tx = 0; tx < world.W; tx++) {
      const h = world.tiles[ty][tx];
      if (h === 0 || h === VOID) continue;
      if (!onScreen(tx + 0.5, ty + 0.5)) continue;
      // 주인공 바로 뒤(위쪽)에 붙은 벽은 깊이 숫자가 커도 주인공보다 먼저 그려요 (주인공을 덮지 않게)
      let depth = tx + ty + 1;
      for (const q of ps) if (Math.abs(tx + 0.5 - q.x) < 1.8 && Math.abs(ty + 0.5 - q.y) < 1.8 && !wallInFront(tx, ty, q)) depth = Math.min(depth, q.x + q.y - 0.02);
      things.push({ depth, tx, ty, draw: () => drawWall(tx, ty, h, p) });
    }
  }
}

function drawWall(tx, ty, h, p) {
  // 주인공을 가리는 벽(진짜 앞에 있는 벽)만 반투명하게
  const inFront = wallInFront(tx, ty, p) && tx + ty + 1 > p.x + p.y && Math.abs((tx + 0.5 - p.x) - (ty + 0.5 - p.y)) < 2.5 && tx + ty + 1 - (p.x + p.y) < 3;
  const base = world.hgt ? wallBase(tx, ty) : 0; // 위층 방의 벽은 위층 바닥부터 (terrain.js)
  const wc = (world.wallAt && world.wallAt(tx, ty)) || world.theme.wall;
  ctx.save();
  if (h === LOW_WALL) {
    drawBox(tx, ty, 0, 1, 1, base + 0.4, shade(wc, 0.85));
  } else {
    if (inFront) ctx.globalAlpha = 0.35;
    if (base > 0) drawBox(tx, ty, 0, 1, 1, base, shade(wc, 0.82));
    for (let level = 0; level < h; level++) {
      drawBox(tx, ty, base + level, 1, 1, 1, shade(wc, 0.9 + level * 0.1));
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
      markExplored(tx, ty, mc);
    }
  }
}
// 한 칸을 "가 봤어요"로 + 미니맵에 칠하기 (같이 하기: 친구가 본 곳도 여기로 칠해요, netplay.js)
function markExplored(tx, ty, mc = world.miniCtx) {
  if (!world.explored || tx < 0 || ty < 0 || tx >= world.W || ty >= world.H) return;
  const i = ty * world.W + tx;
  if (world.explored[i]) return;
  world.explored[i] = 1;
  const t = world.tiles[ty][tx];
  if (t === VOID || !mc) return;
  const hh = world.hgt ? world.hgt[i] : 0; // 위층은 밝게, 계단은 노랗게
  mc.fillStyle = t !== 0 ? "#5a5248" : hh === 0.5 ? "#e8c860" : hh > 0 ? "#f2ecdc" : "#cfc6b0";
  mc.fillRect(tx, ty, 1, 1);
}

// 미니맵도 화면처럼 비스듬하게 그려요
function drawMinimap(p, list) { const r = drawMinimapBase(p, list); hookRun("minimapDraw", p, list); return r; }
function drawMinimapBase(p, list) {
  if (!world.mini) return;
  const size = Math.min(260, view.w * 0.24, view.h * 0.42);
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
  // 같이 하는 친구 (자기 색 점 + 번호, 쓰러지면 속이 빈 동그라미)
  for (const q of typeof allPlayers === "function" ? allPlayers() : []) {
    if (!q || q === p) continue;
    const s = M(q.x, q.y), c = typeof coopColorOf === "function" ? coopColorOf(q.pid || 1).label : "#7dd3ff";
    ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    if (q.hp > 0) { ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.stroke(); }
    else { ctx.lineWidth = 2; ctx.strokeStyle = c; ctx.stroke(); }
    text(typeof playerLabel === "function" ? playerLabel(q).slice(0, 4) : String(q.pid || 1), s.x + 6, s.y - 2, 11, c);
  }
  const ps = M(p.x, p.y);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(ps.x, ps.y, 3.5, 0, Math.PI * 2); ctx.fill();
  return bottom.y;
}
