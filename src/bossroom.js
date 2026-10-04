// ===== 보스방 =====
// 던전의 가장 먼 방에 "보스방 문"이 있어요. 열쇠로 열면 보스방(아레나)으로!
// 보스는 BOSS_DEFS[맵 id] 로 만들어요 (보스 파일들). 없으면 그 맵 몬스터를 크게 만든 대신 보스.
//
// 보스 정의 계약:
//   BOSS_DEFS[mapId] = { id, name, title, size, material:{ id, name, color, enchant? },
//                        arena:{ size, theme, build?(world) }, create(x, y, level) -> 몬스터(boss=true) }
//
// 쓰러졌을 때:
//   보통: 던전에서는 그 자리 근처(열쇠가 있으면 보스방 문 앞, 없으면 시작 방)에서 다시 일어나요.
//         보스방에서는 "다시 도전" 화면 -> 보스방 문 앞에서 다시 (열쇠는 그대로)
//   하드모드(메뉴): 결과창 -> 캠프. 찾은 열쇠도 잃어요.
//
// 이 파일은 main.js 보다 뒤에 불러요 (main.js 의 함수들을 감싸서 이어 붙여요).

function bossDefFor(mapId) {
  return typeof BOSS_DEFS !== "undefined" && BOSS_DEFS[mapId] ? BOSS_DEFS[mapId] : null;
}

// ----- 보스방 문 -----
function placeBossDoor() {
  const kh = game.keyhunt;
  const start = world.rooms[0];
  let far = world.rooms[world.rooms.length - 1], best = -1;
  for (const r of world.rooms.slice(1)) {
    const d = Math.hypot(r.cx - start.cx, r.cy - start.cy);
    if (d > best) { best = d; far = r; }
  }
  kh.doorRoom = far;
  const s = findFreeSpot(far.cx, far.cy, 1.0, 4) || { x: far.cx, y: far.cy };
  kh.door = { x: s.x, y: s.y, open: false, openT: 0 };
  kh.doorSolids = [{ x: s.x - 0.9, y: s.y, r: 0.3 }, { x: s.x + 0.9, y: s.y, r: 0.3 }, { x: s.x, y: s.y, r: 0.55 }];
  world.solids.push(...kh.doorSolids);
}

function doorFront() {
  const d = game.keyhunt.door;
  // 문 가까이(손이 닿는 거리)의 빈 자리
  for (const [ox, oy] of [[0.3, 1.4], [1.4, 0.3], [0.3, -1.4], [-1.4, 0.3], [1.1, 1.1], [-1.1, 1.1], [1.1, -1.1], [-1.1, -1.1]]) {
    if (!hitsWall(d.x + ox, d.y + oy, 0.35)) return { x: d.x + ox, y: d.y + oy };
  }
  return findFreeSpot(d.x, d.y + 1.5, 0.35, 4) || { x: d.x, y: d.y + 1.5 };
}

function bossDoorInteractables() {
  const kh = game.keyhunt;
  if (!kh.door || kh.enterT > 0) return [];
  const d = kh.door;
  if (!kh.hasKey) return [{ x: d.x, y: d.y, range: 2.4, short: "문", prompt: "열쇠가 필요해요", action: () => { sfx.denied(); showMessage(`열쇠가 필요해요 · ${keyHuntStatus() || ""}`, 2.5, false, "#ffb070"); } }];
  if (!d.open) return [{ x: d.x, y: d.y, range: 2.4, short: "열기", prompt: "열쇠로 보스방 열기", action: () => {
    d.open = true; d.openT = 0;
    world.solids = world.solids.filter((s) => s !== kh.doorSolids[2]);
    sfx.anvil(); sfx.boss(); game.shake = 0.35;
    showMessage("문이 열렸어요! 준비되면 들어가요", 2.5, false, "#ffd23f");
  } }];
  return [{ x: d.x, y: d.y, range: 2.4, short: "입장", prompt: "보스방 들어가기", action: () => { kh.enterT = 0.6; game.fade = 0.9; sfx.stairs(); } }];
}

function drawGate(x, y, open, k = 1) {
  const stone = "#6e6a66", dark = "#4b4744";
  drawBox(x - 1.15, y - 0.25, 0, 0.45, 0.5, 2.5, stone);
  drawBox(x + 0.7, y - 0.25, 0, 0.45, 0.5, 2.5, stone);
  if (open) {
    const pts = [toScreen(x - 0.7, y, 0), toScreen(x + 0.7, y, 0), toScreen(x + 0.7, y, 2.3), toScreen(x - 0.7, y, 2.3)];
    const g = ctx.createLinearGradient(pts[0].x, pts[3].y, pts[0].x, pts[0].y);
    g.addColorStop(0, `rgba(60,10,40,${0.9})`); g.addColorStop(1, `rgba(150,40,80,${0.6 + 0.2 * Math.sin(game.time * 4)})`);
    fillPoly(pts, g);
  } else {
    drawBox(x - 0.7, y - 0.12, 0, 1.4, 0.24, 2.3, "#5b3a1e");
    for (const z of [0.5, 1.6]) drawBox(x - 0.72, y - 0.14, z, 1.44, 0.28, 0.12, "#3f3f46");
    drawBox(x - 0.1, y + 0.1, 1.0, 0.2, 0.06, 0.25, "#ffd23f"); // 열쇠 구멍 판
  }
  drawBox(x - 1.25, y - 0.3, 2.5, 2.5, 0.6, 0.45, dark);
  // 해골 장식
  drawBox(x - 0.22, y + 0.28, 2.5, 0.44, 0.1, 0.4, "#e8e4d8");
  drawOnFace("y", x - 0.22, y + 0.28, 2.5, 0.44, 0.1, 0.15, 0.4, 0.18, 0.3, "#1a1a1a");
  drawOnFace("y", x - 0.22, y + 0.28, 2.5, 0.44, 0.1, 0.6, 0.85, 0.18, 0.3, "#1a1a1a");
  // 양쪽 불꽃
  for (const fx of [-0.93, 0.93]) {
    const t = game.time * 11 + fx;
    drawBox(x + fx - 0.1, y + 0.1, 2.1, 0.2, 0.2, 0.25 + 0.06 * Math.sin(t), open ? "#c040ff" : "#ff7a1a");
  }
}

function bossDoorThings(list) {
  const kh = game.keyhunt;
  if (!kh.door) return;
  const d = kh.door;
  list.push({ depth: d.x + d.y, x: d.x, y: d.y, draw: () => {
    drawGate(d.x, d.y, d.open);
    if (kh.hasKey && !d.open) { const c = toScreen(d.x, d.y, 3.4 + Math.sin(game.time * 4) * 0.1); drawStar(c.x, c.y, 12 * ZOOM, "#ffd23f"); }
  } });
}

// ----- 보스방 들어가기 -----
function enterBossRoom() {
  const kh = game.keyhunt;
  const p = game.player;
  const mapDef = game.mapDef;
  kh.snap = {
    W: world.W, H: world.H, tiles: world.tiles, pattern: world.pattern, theme: world.theme, solids: world.solids,
    rooms: world.rooms, start: world.start, explored: world.explored, mini: world.mini, miniCtx: world.miniCtx, path: world.path,
    hgt: world.hgt, sdir: world.sdir, raised: world.raised, // 높낮이 (terrain.js)
    monsters, chests,
  };
  kh.keepOnReset = true;
  resetEffects();
  kh.keepOnReset = false;
  const def = bossDefFor(mapDef.id);
  const N = (def && def.arena && def.arena.size) || 22;
  const theme = (def && def.arena && def.arena.theme) || mapDef.theme;
  resetWorld(N, N, -1, theme);
  const c = N / 2, R = N / 2 - 2;
  for (let y = 1; y < N - 1; y++)
    for (let x = 1; x < N - 1; x++)
      if (Math.hypot(x + 0.5 - c, y + 0.5 - c) < R) world.tiles[y][x] = 0;
  finishWalls(makeRandom(N * 31 + 7));
  world.rooms = [{ x: 2, y: 2, w: N - 4, h: N - 4, cx: c, cy: c }];
  world.explored = null; world.mini = null;
  if (def && def.arena && def.arena.build) def.arena.build(world);
  world.start = findFreeSpot(c + R * 0.6, c - 0.5, 0.5, 3) || { x: c, y: c };
  p.x = world.start.x; p.y = world.start.y; p.faceX = -1; p.faceY = 0;
  p.rollTimer = 0; p.move = null; p.swingTimer = 0;
  camera.x = p.x; camera.y = p.y;
  kh.gate = { x: c + R * 0.88, y: c - 0.5 }; // 들어온 문 (뒤에서 닫혀요)
  // 보스!
  let boss;
  if (def && def.create) {
    boss = def.create(c - 1, c - 1, game.mapLevel);
    boss.boss = true;
    if (boss.aggro === undefined || boss.aggro === false) boss.aggro = true;
  } else {
    const types = Object.keys(mapDef.monsters || { zombie: 1 }).filter((t) => MONSTERS[t]);
    types.sort((a, b) => MONSTERS[b].hp * (MONSTERS[b].size || 1) - MONSTERS[a].hp * (MONSTERS[a].size || 1));
    boss = createMonster(types[0] || "zombie", c - 1, c - 1, game.mapLevel + 2);
    makeBoss(boss);
  }
  const free = findFreeSpot(boss.x, boss.y, boss.r, 4);
  if (free) { boss.x = free.x; boss.y = free.y; }
  monsters.push(boss);
  kh.inBoss = true; kh.boss = boss; kh.bossDone = false; kh.bossWon = false;
  kh.intro = 3;
  kh.introName = (def && def.name) || boss.name || "보스";
  kh.introTitle = (def && def.title) || `${mapDef.name}의 주인`;
  pathFrom = { x: -1, y: -1 };
  game.fade = 0.8; game.shake = 0.5;
  sfx.boss();
}

// 보스방 카메라: 주인공과 보스 사이 30% 지점 (너무 멀면 주인공 쪽)
function bossCameraBias(p) {
  const kh = game.keyhunt;
  if (!kh || !kh.inBoss || !kh.boss || kh.boss.hp <= 0) return null;
  const b = kh.boss, d = Math.hypot(b.x - p.x, b.y - p.y);
  const k = d > 12 ? 0.15 : 0.3;
  return { x: p.x + (b.x - p.x) * k, y: p.y + (b.y - p.y) * k };
}
function setBossZoom(on) {
  const want = on ? 0.78 : 1;
  if (zoomMul !== want) { zoomMul = want; resizeCanvas(); }
}

function updateBossRoom(p, dt) {
  const kh = game.keyhunt;
  setBossZoom(true);
  kh.intro = Math.max(0, kh.intro - dt);
  if (!kh.bossDone && kh.boss && kh.boss.hp <= 0) {
    kh.bossDone = true;
    for (const m of monsters) if (m !== kh.boss) { m.hp = 0; spawnBurst(m.x, m.y, ["#888888"], 6); }
    monsters = [];
    const pr = game.profile;
    const def = bossDefFor(kh.mapId);
    if (def && def.material && MATERIALS[def.material.id]) {
      const n = 1 + (Math.random() < 0.5 ? 1 : 0);
      addMaterial(def.material.id, n);
      if (game.run) { game.run.mats = game.run.mats || {}; game.run.mats[def.material.id] = (game.run.mats[def.material.id] || 0) + n; }
    }
    if (typeof bossRoomLoot === "function") bossRoomLoot(kh.mapId); // 장비·전설·화폐 (loot.js)
    // 보스 통계·열쇠 씀·트로피·도감·모험 기록 (같이 하기: 친구 저장에도 똑같이, records.js)
    recShared("bossWin", { map: kh.mapId, sec: typeof SHOW !== "undefined" ? Math.round(SHOW.bossT * 10) / 10 : 0 });
    kh.bossWon = true;
    endRun(true);
  }
}

function bossRoomThings(list) {
  const kh = game.keyhunt;
  if (kh.gate) list.push({ depth: kh.gate.x + kh.gate.y, x: kh.gate.x, y: kh.gate.y, draw: () => {
    // 주인공보다 앞에 있으면 반투명 (가리지 않게)
    const p = game.player;
    ctx.save();
    if (kh.gate.x + kh.gate.y > p.x + p.y) ctx.globalAlpha = 0.35;
    drawGate(kh.gate.x, kh.gate.y, false);
    ctx.restore();
  } });
}

// ----- 쓰러졌을 때 -----
// true 를 돌려주면 결과창(처음부터) 대신 다시 도전
function handlePlayerDown() {
  const pr = game.profile, kh = game.keyhunt;
  if (!kh) return false;
  if (pr.hardMode) { recShared("keyLost", { map: kh.mapId }); return false; } // 하드모드: 열쇠도 잃어요 (같이 하기: 모두)
  recShared("lose"); // 다 같이 쓰러짐 (같이 하기: 친구 기록에도, records.js)
  if (kh.inBoss) {
    const r = game.run || {};
    game.result = { retry: true, win: false, mapName: `${game.mapDef.name} 보스방`, kills: r.kills || 0, emeralds: r.emeralds || 0, xp: r.xp || 0, levels: r.levels || 0, bonus: 0, mats: null };
    game.endTimer = 1.4;
    saveProfile();
    return true;
  }
  respawnInDungeon(kh.hasKey ? doorFront() : world.start);
  return true;
}

function respawnInDungeon(spot) {
  const p = game.player;
  const s = findFreeSpot(spot.x, spot.y, 0.35, 4) || spot;
  p.x = s.x; p.y = s.y;
  p.hp = p.maxHp; p.hurtTimer = 2.5; p.rollTimer = 0; p.move = null; p.swingTimer = 0;
  camera.x = p.x; camera.y = p.y;
  arrows = [];
  for (const m of monsters) {
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < 4 && !m.home) { m.stunTimer = 1; m.knockX = (m.x - p.x) / (d || 1) * 6; m.knockY = (m.y - p.y) / (d || 1) * 6; }
  }
  game.fade = 0.6;
  sfx.levelUp();
  showMessage(game.keyhunt && game.keyhunt.hasKey ? "다시 일어났어요! 보스방 문 앞이에요" : "다시 일어났어요! 열쇠 찾기는 그대로예요", 2.8, false, "#7dd3ff");
}

// 보스방에서 쓰러진 뒤 "다시 도전": 던전으로 돌아가 문 앞에서
// 같이 하기: 누가 눌러도 다 같이 (친구 기기는 방장에게 부탁: netplay.js "retryBoss"/"giveUpToCamp" 훅)
function retryBoss() { if (hookAny("retryBoss")) return; return retryBossBase(); }
function retryBossBase() {
  const kh = game.keyhunt;
  const S = kh.snap;
  kh.keepOnReset = true;
  resetEffects();
  kh.keepOnReset = false;
  Object.assign(world, { W: S.W, H: S.H, tiles: S.tiles, pattern: S.pattern, theme: S.theme, solids: S.solids, rooms: S.rooms, start: S.start, explored: S.explored, mini: S.mini, miniCtx: S.miniCtx, path: S.path, hgt: S.hgt || null, sdir: S.sdir || null, raised: S.raised || 0 });
  monsters = S.monsters.filter((m) => m.hp > 0);
  chests = S.chests;
  kh.inBoss = false; kh.boss = null; kh.gate = null; kh.snap = null;
  setBossZoom(false);
  game.result = null; game.overlay = null;
  pathFrom = { x: -1, y: -1 };
  respawnInDungeon(doorFront());
  showMessage("보스방 문 앞이에요. 열쇠는 그대로! 다시 도전해요", 3, false, "#ffd23f");
}

function giveUpToCamp() { if (hookAny("giveUpToCamp")) return; return giveUpToCampBase(); }
function giveUpToCampBase() {
  game.result = null;
  closeOverlay();
  enterLobby("열쇠는 그대로 있어요. 다음에 다시 도전해요!");
}

// ===== 다른 함수들과 연결 (hooks.js 알림 지점) =====
hookOn("dungeonStarted", (def) => { if (game.mode === "dungeon") setupKeyHunt(def); }, 50);

hookOn("reset", () => {
  const kh = game.keyhunt;
  if (kh && kh.dark && kh.ch && kh.ch.theme) world.theme = kh.ch.theme;
  setBossZoom(false);
  if (!kh || !kh.keepOnReset) game.keyhunt = null;
}, 90);

hookOn("endRun", (win) => {
  const kh = game.keyhunt;
  if (game.mode === "dungeon" && kh) {
    if (win && !kh.bossWon) return true; // 몬스터를 다 잡아도 클리어가 아니에요. 보스를 물리쳐야 해요!
    if (!win && !game.result && handlePlayerDown()) return true;
  }
  return false;
}, 50);

// 매 프레임 (던전에서만 불리는 updateChests 뒤에)
hookOn("dungeonTick", (dt) => {
  const kh = game.keyhunt;
  if (game.mode !== "dungeon" || !kh || game.result) return;
  if (kh.enterT > 0) { kh.enterT -= dt; if (kh.enterT <= 0) enterBossRoom(); return; }
  if (kh.inBoss) updateBossRoom(game.player, dt);
  else if (!game.upper) updateKeyHunt(game.player, dt); // 위층에선 열쇠 찾기가 쉬어요 (upper.js)
}, 50);

// 그리기: 바닥 표시, 물건, 빛
hookOn("drawFloor", () => keyHuntFloor(), 50);
hookOn("worldThings", (things) => keyHuntThings(things), 50);
hookOn("lights", (lights) => keyHuntLights(lights), 50);

// 다시 도전 화면 (결과창 자리를 빌려 써요)
hookOn("resultUpdate", () => {
  if (!(game.result && game.result.retry)) return false;
  if (wasPressed("Enter", "Space", "KeyR")) retryBoss();
  else if (wasPressed("Escape")) giveUpToCamp();
  return true;
}, 50);
hookOn("resultDraw", () => {
  const r = game.result;
  if (!r || !r.retry) return false;
  drawRetryScreen(r);
  return true;
}, 50);
function drawRetryScreen(r) {
  const pw = Math.min(560, view.w - 24), ph = 300;
  const x0 = (view.w - pw) / 2, y0 = (view.h - ph) / 2, cx = view.w / 2;
  drawPanel(x0, y0, pw, ph);
  text("쓰러졌어요...", cx, y0 + 58, 38, "#ff8080", "center");
  text(r.mapName, cx, y0 + 94, 18, "#ddd", "center");
  text("열쇠는 그대로! 보스방 문 앞에서 다시 도전할 수 있어요", cx, y0 + 134, 16, "#ffd23f", "center");
  text("(메뉴의 하드모드를 켜면 쓰러질 때 처음부터 해요)", cx, y0 + 160, 13, "#aaa", "center");
  if (typeof drawDeathCause === "function") drawDeathCause(cx, y0 + 194, pw); // 쓰러진 이유 (guide.js)
  drawButton(cx - 210, y0 + ph - 82, 200, 52, "다시 도전!", retryBoss, { color: "rgba(80,200,120,0.45)", size: 20 });
  drawButton(cx + 10, y0 + ph - 82, 200, 52, "캠프로 돌아가기", giveUpToCamp, { size: 17 });
}

// HUD: 열쇠 아이콘, 보스 등장 글씨, 힌트
hookOn("hudDraw", () => {
  const kh = game.keyhunt;
  if (!kh || game.mode !== "dungeon") return;
  if (kh.hasKey && !kh.inBoss) {
    ctx.save();
    // 하트 줄 아래, 에메랄드·물약·화살 줄의 오른쪽 (hud.js 와 같은 계산)
    const shown = Math.min(game.player.maxHp, 40);
    const x = 235, y = 14 + Math.ceil(shown / 10) * 24 + 6 + 26 + 10;
    ctx.strokeStyle = "#5a3a00"; ctx.lineWidth = 7; ctx.lineCap = "round";
    const key = () => { ctx.beginPath(); ctx.arc(x - 9, y, 6, 0, Math.PI * 2); ctx.moveTo(x - 3, y); ctx.lineTo(x + 13, y); ctx.moveTo(x + 9, y); ctx.lineTo(x + 9, y + 6); ctx.stroke(); };
    key(); ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 4; key();
    ctx.restore();
  }
  if (kh.inBoss && kh.intro > 0) {
    const a = Math.min(1, kh.intro, (3 - kh.intro) * 3);
    ctx.globalAlpha = Math.max(0, a);
    text(kh.introName, view.w / 2, view.h * 0.4, 52, "#ff9090", "center");
    text(kh.introTitle, view.w / 2, view.h * 0.4 + 40, 22, "#ffe27a", "center");
    ctx.globalAlpha = 1;
  }
  if (keyHuntHintOn() && Math.sin(game.time * 5) > -0.2) {
    text("힌트: 미니맵의 반짝이는 별을 따라가요", view.w / 2, view.h - 44, 16, "#ffe27a", "center");
  }
}, 50);

// 미니맵: 보스방 문, 힌트 별
hookOn("minimapDraw", (p, list) => {
  const kh = game.keyhunt;
  if (!world.mini || !kh || game.mode !== "dungeon") return;
  const size = Math.min(260, view.w * 0.24, view.h * 0.42);
  const k = size / (world.W + world.H);
  const ox = view.w - 16 - world.W * k, oy = 96;
  const M = (x, y) => ({ x: ox + (x - y) * k, y: oy + (x + y) * k / 2 });
  if (kh.door && world.explored && world.explored[Math.floor(kh.door.y) * world.W + Math.floor(kh.door.x)]) {
    const s = M(kh.door.x, kh.door.y);
    ctx.fillStyle = kh.hasKey ? "#ffd23f" : "#c040ff";
    ctx.fillRect(s.x - 4, s.y - 4, 8, 8);
  }
  const t = keyHuntHintOn() || kh.keyItem ? keyHuntTarget() : null;
  if (t && Math.sin(game.time * 8) > -0.3) { const s = M(t.x, t.y); drawStar(s.x, s.y, 7, "#ffe27a"); }
  return;
}, 50);
