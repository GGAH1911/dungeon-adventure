// ===== 높낮이: 높은 단·2층 방·계단 (모든 랜덤 던전) =====
// world.hgt[칸] = 바닥 높이 (0 아래층, 1 위층, 0.5 계단), world.sdir[칸] = 계단이 올라가는 쪽 (1:+x 2:-x 3:+y 4:-y)
// 규칙 하나: 지금 서 있는 칸보다 0.5 넘게 높은 칸은 벽처럼 막혀요 (hitsWall).
//   -> 올라갈 땐 계단으로만, 내려갈 땐 단 끝에서 뛰어내릴 수 있어요. 몬스터 길찾기도 같은 규칙 (world.js)
// 그리기: 높은 바닥·절벽·계단은 바닥 그릴 때(예고 원보다 먼저) 그려요. 절벽 뒤에 선 캐릭터가 있을 때만
//   그 절벽 칸을 깊이 순서대로 한 번 더 그려서 가려요 (주인공이 가려지면 반투명).
// 같은 씨앗이면 같은 높낮이 (같이 하기 친구 기기도 똑같이 만들어요)

const LEVEL_Z = 1;                 // 위층 높이 (블록 1개)
const STAIR_DIRS = [null, [1, 0], [-1, 0], [0, 1], [0, -1]];
const TERRAIN = { roomChance: 0.55, wholeShare: 0.45, plateauMin: 3, highBonus: 1.2 };

function tileH(tx, ty) {
  const h = world.hgt;
  if (!h || tx < 0 || ty < 0 || tx >= world.W || ty >= world.H) return 0;
  return h[ty * world.W + tx];
}
function isStair(tx, ty) { return !!(world.sdir && tx >= 0 && ty >= 0 && tx < world.W && ty < world.H && world.sdir[ty * world.W + tx]); }
// 그림에 쓰는 땅 높이 (계단은 올라가는 쪽으로 점점 높아져요)
function groundZ(x, y) {
  if (!world.hgt) return 0;
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= world.W || ty >= world.H) return 0;
  const i = ty * world.W + tx, d = world.sdir[i];
  if (!d) return world.hgt[i] * LEVEL_Z;
  const fx = x - tx, fy = y - ty;
  const k = d === 1 ? fx : d === 2 ? 1 - fx : d === 3 ? fy : 1 - fy;
  return Math.max(0, Math.min(1, k)) * LEVEL_Z;
}
// 벽 받침 높이: 옆 바닥 중 가장 높은 것 (위층 방의 벽은 위층 높이부터)
function wallBase(tx, ty) {
  if (!world.hgt) return 0;
  let b = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = tx + dx, y = ty + dy;
    if (x < 0 || y < 0 || x >= world.W || y >= world.H || world.tiles[y][x] !== 0) continue;
    b = Math.max(b, Math.ceil(world.hgt[y * world.W + x]));
  }
  return b * LEVEL_Z;
}
// (x, y) 가까이 계단이 있나 (상자·큰 계단이 계단 길을 막지 않게)
function nearStair(x, y, d = 1.5) {
  if (!world.sdir) return false;
  for (let ty = Math.floor(y - d); ty <= Math.floor(y + d); ty++) for (let tx = Math.floor(x - d); tx <= Math.floor(x + d); tx++) if (isStair(tx, ty)) return true;
  return false;
}
// 같은 층인가 (계단은 위아래 둘 다): 칼·물기 같은 근접 공격은 같은 층끼리만 닿아요. 화살·마법은 위아래 다 닿아요
function sameLevel(a, b) {
  if (!world.hgt || !a || !b) return true;
  return Math.abs(tileH(Math.floor(a.x), Math.floor(a.y)) - tileH(Math.floor(b.x), Math.floor(b.y))) <= 0.51;
}
// 동그라미가 지금 닿아 있는 바닥 중 가장 높은 것 (움직일 때 기준 높이)
//   뛰어내리는 중엔 아직 높은 칸에 걸쳐 있어서 막히지 않고, 완전히 내려오면 다시 못 올라가요
function touchMaxH(x, y, r) {
  let m = 0;
  for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) {
    if (isWall(tx, ty)) continue;
    const nx = Math.max(tx, Math.min(x, tx + 1)), ny = Math.max(ty, Math.min(y, ty + 1));
    if ((x - nx) ** 2 + (y - ny) ** 2 >= r * r && !(tx === Math.floor(x) && ty === Math.floor(y))) continue;
    m = Math.max(m, tileH(tx, ty));
  }
  return m;
}
// a 칸에서 b 칸으로 걸어갈 수 있나 (올라가기는 0.5 까지)
function canStep(ax, ay, bx, by) { return tileH(bx, by) - tileH(ax, ay) <= 0.51; }

// ----- 만들기 -----
// 방마다: 통째로 위층(복도 입구에 계단) 또는 가운데 높은 단(가장자리에 계단 1~2개)
function generateHeights(rand, rooms, def) {
  const { W, H } = world;
  world.hgt = new Float32Array(W * H);
  world.sdir = new Int8Array(W * H);
  if (def && def.flat) return;
  const fl = (x, y) => x >= 0 && y >= 0 && x < W && y < H && world.tiles[y][x] === 0;
  const inRoom = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  const anyRoom = (x, y) => rooms.some((r) => inRoom(r, x, y));
  const set = (x, y, h, d = 0) => { const i = y * W + x; world.hgt[i] = h; world.sdir[i] = d; };
  const raised = [];
  for (let ri = 0; ri < rooms.length; ri++) {
    const r = rooms[ri];
    if (rand() > TERRAIN.roomChance) continue;
    const cells = [], stairs = [];
    if (ri > 0 && rand() < TERRAIN.wholeShare) {
      // 2층 방: 방 전체를 올리고, 방에 닿는 복도 칸을 계단으로
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (fl(x, y)) cells.push([x, y]);
      for (const [x, y] of cells) for (let d = 1; d <= 4; d++) {
        const [dx, dy] = STAIR_DIRS[d], ox = x + dx, oy = y + dy;
        if (!fl(ox, oy) || anyRoom(ox, oy)) continue;
        if (!fl(ox + dx, oy + dy)) continue; // 계단 아래쪽도 바닥이어야 해요
        stairs.push([ox, oy, d === 1 ? 2 : d === 2 ? 1 : d === 3 ? 4 : 3]); // 방 쪽으로 올라가요
      }
    } else if (r.w >= 8 && r.h >= 8) {
      // 높은 단: 가장자리 2칸은 아래층으로 남겨요
      const pw = TERRAIN.plateauMin + Math.floor(rand() * (r.w - 4 - TERRAIN.plateauMin + 1));
      const ph = TERRAIN.plateauMin + Math.floor(rand() * (r.h - 4 - TERRAIN.plateauMin + 1));
      const px = r.x + 2 + Math.floor(rand() * (r.w - 4 - pw + 1)), py = r.y + 2 + Math.floor(rand() * (r.h - 4 - ph + 1));
      for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) if (fl(x, y)) cells.push([x, y]);
      // 계단: 단 가장자리 칸 하나를 계단으로 (바깥은 아래층 바닥, 안쪽은 단)
      const sides = [[px - 1, null, 1], [px + pw, null, 2], [null, py - 1, 3], [null, py + ph, 4]];
      const n = 1 + (rand() < 0.5 ? 1 : 0);
      for (let k = 0; k < 6 && stairs.length < n; k++) {
        // 화면 앞쪽(+x, +y) 가장자리를 더 자주: 계단이 뒤로 올라가서 칸칸이 잘 보여요
        const [sx, sy, d] = sides[rand() < 0.8 ? (rand() < 0.5 ? 1 : 3) : (rand() < 0.5 ? 0 : 2)];
        const [dx, dy] = STAIR_DIRS[d];
        const along = sx === null ? px + Math.floor(rand() * pw) : py + Math.floor(rand() * ph);
        const ox = sx === null ? along : sx, oy = sy === null ? along : sy; // 단 바로 바깥
        const tx = ox + dx, ty = oy + dy;                                    // 계단이 될 단 가장자리 칸
        if (!fl(ox, oy) || !fl(tx, ty) || !fl(tx + dx, ty + dy)) continue;
        if (stairs.some((s) => Math.abs(s[0] - tx) + Math.abs(s[1] - ty) < 2)) continue;
        stairs.push([tx, ty, d]);
      }
    }
    if (cells.length < 6 || !stairs.length) continue;
    for (const [x, y] of cells) set(x, y, 1);
    for (const [x, y, d] of stairs) set(x, y, 0.5, d);
    raised.push({ room: r, cells, stairs });
  }
  // 모든 바닥에 갈 수 있고, 어디서든 시작 자리로 돌아올 수 있어야 해요. 안 되는 방은 다시 평평하게
  for (let pass = 0; pass < 6 && raised.length; pass++) {
    const bad = terrainUnreachable(Math.floor(world.start ? world.start.x : rooms[0].cx), Math.floor(world.start ? world.start.y : rooms[0].cy));
    if (!bad.size) break;
    for (let j = raised.length - 1; j >= 0; j--) {
      const R = raised[j];
      const touches = R.cells.some(([x, y]) => bad.has(y * W + x)) || R.stairs.some(([x, y]) => bad.has(y * W + x)) || inRoom(R.room, ...[...bad].map((i) => [i % W, Math.floor(i / W)]).find(([x, y]) => inRoom(R.room, x, y)) || [-1, -1]);
      if (!touches && pass < 5) continue;
      for (const [x, y] of R.cells) set(x, y, 0);
      for (const [x, y] of R.stairs) set(x, y, 0);
      raised.splice(j, 1);
      if (pass < 5) break;
    }
  }
  world.raised = raised.length;
}
// 시작 칸에서 못 가는 바닥 + 시작 칸으로 못 돌아오는 바닥 (칸 번호 모음)
function terrainUnreachable(sx, sy) {
  const { W, H } = world, N = W * H;
  const walk = (forward) => {
    const seen = new Uint8Array(N);
    const solid = (x, y) => x < 0 || y < 0 || x >= W || y >= H || world.tiles[y][x] !== 0; // 아직 벽 마무리 전이라 0 만 바닥
    if (solid(sx, sy)) return seen;
    const q = [sy * W + sx]; seen[q[0]] = 1;
    for (let k = 0; k < q.length; k++) {
      const i = q[k], x = i % W, y = Math.floor(i / W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, j = ny * W + nx;
        if (solid(nx, ny) || seen[j]) continue;
        if (forward ? !canStep(x, y, nx, ny) : !canStep(nx, ny, x, y)) continue;
        seen[j] = 1; q.push(j);
      }
    }
    return seen;
  };
  const a = walk(true), b = walk(false), bad = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (world.tiles[y][x] === 0 && (!a[y * W + x] || !b[y * W + x])) bad.add(y * W + x);
  return bad;
}

// ----- 그리기 -----
function terrainTopColor(x, y) { return shade(floorColorAt(x, y, world.theme.lava ? 0.85 + 0.15 * Math.sin(game.time * 2.5) : 1), 1.12); } // 위층은 조금 밝게
// 칸 하나: 절벽 면(바닥 색을 어둡게: 벽과 달라 보여요) + 윗면 + 가장자리 밝은 테두리. 계단은 밝은 돌 3단
function drawTerrainTile(tx, ty) {
  const i = ty * world.W + tx, d = world.sdir[i], h = world.hgt[i] * LEVEL_Z;
  const P = toScreen, base = floorColorAt(tx, ty);
  if (d) return drawStairTile(tx, ty, d, base);
  if (h > groundZ(tx + 1.5, ty + 0.5) + 0.01 && !isWall(tx + 1, ty)) fillPoly([P(tx + 1, ty, h), P(tx + 1, ty + 1, h), P(tx + 1, ty + 1, 0), P(tx + 1, ty, 0)], shade(base, 0.5));
  if (h > groundZ(tx + 0.5, ty + 1.5) + 0.01 && !isWall(tx, ty + 1)) fillPoly([P(tx, ty + 1, h), P(tx + 1, ty + 1, h), P(tx + 1, ty + 1, 0), P(tx, ty + 1, 0)], shade(base, 0.64));
  const a = P(tx, ty, h), b = P(tx + 1, ty, h), c = P(tx + 1, ty + 1, h), e = P(tx, ty + 1, h);
  fillPoly([a, b, c, e], terrainTopColor(tx, ty));
  // 가장자리 테두리: 옆 칸이 낮으면 밝은 선 (단 끝이 잘 보여요)
  ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = Math.max(1.5, 1.6 * ZOOM);
  ctx.beginPath();
  const low = (x, y) => !isWall(x, y) && tileH(x, y) < world.hgt[i] - 0.01;
  if (low(tx + 1, ty)) { ctx.moveTo(b.x, b.y); ctx.lineTo(c.x, c.y); }
  if (low(tx, ty + 1)) { ctx.moveTo(e.x, e.y); ctx.lineTo(c.x, c.y); }
  if (low(tx - 1, ty)) { ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); }
  if (low(tx, ty - 1)) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
  ctx.stroke();
}
// 계단: 올라가는 쪽으로 3단 (뒤에서 앞으로 그려요)
function drawStairTile(tx, ty, d, base) {
  const col = mixHex(shade(base, 1.25), "#d8b878", 0.45), L = LEVEL_Z, n = 3; // 따뜻한 돌색 (바닥·벽과 달라 보여요)
  const alongX = d <= 2, up = d === 1 || d === 3;
  for (let k = 0; k < n; k++) { // k: 뒤(작은 x/y)에서 앞으로
    const hgtK = up ? (k + 1) / n : (n - k) / n;
    const x0 = alongX ? tx + k / n : tx, y0 = alongX ? ty : ty + k / n;
    drawBox(x0, y0, 0, alongX ? 1 / n : 1, alongX ? 1 : 1 / n, hgtK * L, col);
  }
}
// 바닥 그릴 때: 화면에 보이는 높은 칸·계단을 뒤에서부터 (목록은 맵마다 한 번만 만들어 깊이 순서로 둬요)
function terrainList() {
  if (world._terr && world._terr.hgt === world.hgt && world._terr.tiles === world.tiles) return world._terr.list;
  const list = [];
  for (let y = 0; y < world.H; y++) for (let x = 0; x < world.W; x++) if (world.tiles[y][x] === 0 && world.hgt[y * world.W + x]) list.push(x, y);
  const idx = []; for (let k = 0; k < list.length; k += 2) idx.push(k);
  idx.sort((a, b) => list[a] + list[a + 1] - (list[b] + list[b + 1]));
  const sorted = new Int16Array(list.length);
  idx.forEach((k, j) => { sorted[j * 2] = list[k]; sorted[j * 2 + 1] = list[k + 1]; });
  world._terr = { hgt: world.hgt, tiles: world.tiles, list: sorted };
  return sorted;
}
function drawTerrain() {
  if (!world.hgt) return;
  const L = terrainList();
  for (let k = 0; k < L.length; k += 2) {
    const x = L[k], y = L[k + 1];
    if (world.tiles[y][x] !== 0 || !onScreen(x + 0.5, y + 0.5, 3)) continue;
    drawTerrainTile(x, y);
  }
}
// 절벽 뒤에 선 것 가리기: 그 앞의 높은 칸을 깊이 순서로 한 번 더 (주인공이면 반투명)
function terrainOccluders(things, ents) {
  if (!world.hgt) return;
  const pick = new Map(); // 칸 번호 -> 반투명?
  for (const e of ents) {
    if (!e || !onScreen(e.x, e.y)) continue;
    const ez = groundZ(e.x, e.y), ex = Math.floor(e.x), ey = Math.floor(e.y), soft = !!(e.pid || e === game.player);
    for (let dy = 0; dy <= 2; dy++) for (let dx = 0; dx <= 2; dx++) {
      if (!dx && !dy) continue;
      const tx = ex + dx, ty = ey + dy;
      if (tx >= world.W || ty >= world.H || world.tiles[ty][tx] !== 0) continue;
      const th = world.hgt[ty * world.W + tx] * LEVEL_Z;
      if (th <= ez + 0.3 || tx + ty + 0.5 <= e.x + e.y) continue;
      const i = ty * world.W + tx;
      pick.set(i, (pick.get(i) || false) || soft);
    }
  }
  for (const [i, soft] of pick) {
    const tx = i % world.W, ty = Math.floor(i / world.W);
    things.push({ depth: tx + ty + 0.5, lift: 0, draw: () => { ctx.save(); if (soft) ctx.globalAlpha = 0.45; drawTerrainTile(tx, ty); ctx.restore(); } });
  }
}
// 캐릭터 그림 높이: 뛰어내리면 부드럽게 떨어져요
function entityLift(e) {
  const g = groundZ(e.x, e.y);
  e._lz = e._lz === undefined || Math.abs(e._lz - g) > 3 ? g : e._lz + (g - e._lz) * 0.3;
  return e._lz;
}

// ----- 높은 곳에서 아래로 때리면 조금 더 아파요 -----
hookOn("monsterDamage", (h) => {
  if (!world.hgt || !h.m || h.fromX === undefined || h.fromY === undefined || (h.opts && h.opts.dot)) return false;
  if (tileH(Math.floor(h.fromX), Math.floor(h.fromY)) - tileH(Math.floor(h.m.x), Math.floor(h.m.y)) >= 0.99) {
    h.dmg *= TERRAIN.highBonus;
    if (Math.random() < 0.25) addFloatText(h.m.x, h.m.y + 0.3, "높은 곳!", "#ffe27a", 15);
  }
  return false;
}, 30);
