// ===== 시련의 탑 =====
// 둥근 아레나에서 웨이브를 다 물리치면 계단이 열려요. 계단으로 올라가면 다음 층!
// 30층까지! 5층마다 보스가 나와요: 5~25층은 보스방 보스들(탑 버전: 정예 속성 하나), 30층은 탑의 주인 (towerboss.js)
// 층이 올라갈수록 몬스터가 세지고, 8층부터는 정예도 섞여요.

const TOWER = {
  id: "tower", type: "tower", name: "시련의 탑", desc: "웨이브를 깨고 계단으로 올라가요! 5층마다 보스, 30층엔 탑의 주인",
  minLevel: 2, floors: 30, reward: 90, unlockAfter: "cave",
  size: 22, count: 0, monsters: {},
  theme: { floor: "#7a6f62", moss: "#8c7b5e", wall: "#9a8a72", darkness: 0.35, bg: "#120f0c" },
  // 층마다 나오는 몬스터
  pools: [
    { upTo: 2, monsters: ["zombie", "spider"] },
    { upTo: 4, monsters: ["zombie", "spider", "skeleton", "bat"] },
    { upTo: 7, monsters: ["zombie", "skeleton", "slime", "boomer", "bat", "mummy"] },
    { upTo: 10, monsters: ["skeleton", "boomer", "mummy", "mage", "knight", "bat"] },
    { upTo: 14, monsters: ["knight", "mage", "golem", "charger", "sniper", "whirler", "bat"] },
    { upTo: 19, monsters: ["miner", "wisp", "crab", "shieldbearer", "healer", "knight", "boomer"] },
    { upTo: 24, monsters: ["shadow", "golem", "mage", "drummer", "lurker", "summoner", "crab"] },
    { upTo: 30, monsters: ["shadow", "knight", "golem", "wisp", "sniper", "healer", "charger", "whirler"] },
  ],
  // 보스 층: 그 층에 나올 수 있는 보스방 보스 (탑에 들어갈 때마다 하나를 골라요). "tower" = 탑의 주인
  bossPools: { 5: ["cave", "crypt", "jungle"], 10: ["desert", "ice", "swamp"], 15: ["volcano", "mine", "coral"], 20: ["castle", "sky"], 25: ["void"], 30: ["tower"] },
  bossAffixes: ["fireTrail", "fast", "vampiric", "lightning", "deathNova"], // 탑 보스에 붙는 정예 속성 (기술이 안 늘어나는 것만)
  levelStep: 0.35, // 층마다 몬스터 레벨이 오르는 정도
  maxWave: 22, // 한 층 몬스터 최대 (태블릿이 힘들지 않게)
  floorThemes: [
    { floor: "#7a6f62", moss: "#8c7b5e", wall: "#9a8a72", darkness: 0.35, bg: "#120f0c" },
    { floor: "#5e6a78", moss: "#6f7f92", wall: "#7a8696", darkness: 0.4, bg: "#0c1016" },
    { floor: "#6a4f4f", moss: "#7f5a52", wall: "#7e6262", darkness: 0.45, bg: "#140a0a" },
    { floor: "#4e4a5e", moss: "#6b4f8a", wall: "#5e5a72", darkness: 0.5, bg: "#0b0912" },
  ],
};
MAPS.push(TOWER);

let stairs = null;

function startTower(level) {
  resetEffects();
  game.scene = "dungeon";
  game.mode = "tower";
  game.overlay = null;
  game.mapDef = TOWER;
  game.mapLevel = level;
  game.tower = { floor: 1, cleared: false, waveDelay: 1.2, bossMaps: towerPickBosses() };
  buildArenaFloor(1);
  placePlayer();
  game.run = { kills: 0, emeralds: 0, xp: 0, levels: 0 };
  sfx.wave();
  showMessage(`시련의 탑 1층`, 2.5);
}

// 층의 몬스터 레벨: 들어간 레벨 + 층마다 0.35 (30층이면 +10)
function towerLevel(f) { return game.mapLevel + Math.floor((f - 1) * TOWER.levelStep); }
// 이번 탑에서 층마다 나올 보스 (들어갈 때마다 바뀌어요)
function towerPickBosses() {
  const out = {};
  for (const [f, pool] of Object.entries(TOWER.bossPools)) out[f] = pool[Math.floor(Math.random() * pool.length)];
  return out;
}
// 이 층의 보스 (없으면 null): { mapId, def }
function towerBossAt(f) {
  const T = game.tower; if (!T) return null;
  const mapId = (T.bossMaps || {})[f]; if (!mapId) return null;
  const def = mapId === "tower" ? (typeof TOWER_MASTER_DEF !== "undefined" ? TOWER_MASTER_DEF : null) : BOSS_DEFS[mapId];
  return def ? { mapId, def } : null;
}

// 보스 층: 그 보스의 보스방처럼 둥근 방 (숨을 기둥도 그대로) + 뒤쪽 계단
function buildBossFloor(f, def) {
  const N = (def.arena && def.arena.size) || 24;
  resetWorld(N, N, -1, (def.arena && def.arena.theme) || TOWER.theme);
  const c = N / 2, R = N / 2 - 2;
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) if (Math.hypot(x + 0.5 - c, y + 0.5 - c) < R) world.tiles[y][x] = 0;
  finishWalls(makeRandom(f * 131 + 9));
  world.rooms = [{ x: 2, y: 2, w: N - 4, h: N - 4, cx: c, cy: c }];
  if (def.arena && def.arena.build) def.arena.build(world);
  world.start = findFreeSpot(c + R * 0.6, c + R * 0.2, 0.5, 3) || { x: c, y: c };
  world.explored = null; world.mini = null;
  stairs = { x: c - R * 0.55, y: c - R * 0.55, open: false, glow: 0 };
  const sp = findFreeSpot(stairs.x, stairs.y, 0.8, 3); if (sp) { stairs.x = sp.x; stairs.y = sp.y; }
  chests = [];
}

// 아레나 만들기 (팔각형 방 + 층마다 다른 기둥)
function buildArenaFloor(f) {
  const tb = towerBossAt(f);
  if (tb) return buildBossFloor(f, tb.def);
  const th = TOWER.floorThemes[Math.floor((f - 1) / 3) % TOWER.floorThemes.length];
  const N = TOWER.size;
  resetWorld(N, N, -1, th);
  const c = N / 2;
  for (let y = 2; y < N - 2; y++)
    for (let x = 2; x < N - 2; x++)
      if (Math.abs(x + 0.5 - c) + Math.abs(y + 0.5 - c) < 12.5) world.tiles[y][x] = 0;
  const pillar = (x, y, h = 2) => { world.tiles[y][x] = h; };
  const pattern = f % 4;
  if (pattern === 1) { pillar(7, 7); pillar(14, 7); pillar(7, 14); pillar(14, 14); }
  if (pattern === 2) { pillar(10, 5, 1); pillar(11, 5, 1); pillar(5, 10, 1); pillar(5, 11, 1); pillar(16, 10, 1); pillar(16, 11, 1); pillar(10, 16, 1); pillar(11, 16, 1); }
  if (pattern === 3) { pillar(8, 8); pillar(13, 13); pillar(8, 13, 1); pillar(13, 8, 1); }
  finishWalls(makeRandom(f * 97 + 3));
  world.rooms = [{ x: 3, y: 3, w: N - 6, h: N - 6, cx: c, cy: c }];
  // 시작 자리는 기둥과 겹치지 않는 곳으로 (앞쪽 가운데)
  world.start = findFreeSpot(c + 2.5, c + 2.5, 1.0) || findFreeSpot(c + 2.5, c + 2.5, 0.35) || { x: c, y: c };
  world.explored = null;
  world.mini = null;
  // 계단은 뒤쪽 벽 앞에 (처음엔 닫혀 있어요)
  stairs = { x: c - 6, y: c - 6, open: false, glow: 0 };
  chests = [];
}

function towerMonsterPool(f) {
  return TOWER.pools.find((p) => f <= p.upTo).monsters;
}

function spawnWave() {
  const T = game.tower;
  const f = T.floor;
  const L = towerLevel(f);
  const pool = towerMonsterPool(f);
  const tb = towerBossAt(f);
  const count = tb ? Math.min(6, 1 + Math.floor(f / 6)) : Math.min(TOWER.maxWave, Math.round(5 + f * 1.5));
  const elites = tb ? 0 : f >= 18 ? 2 : f >= 8 ? 1 : 0;
  const p = game.player;
  monsters = [];
  for (let i = 0; i < count; i++) {
    const type = pool[Math.floor(Math.random() * pool.length)];
    let spot;
    for (let t = 0; t < 40; t++) {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 6;
      spot = { x: world.W / 2 + Math.cos(a) * r, y: world.H / 2 + Math.sin(a) * r };
      if (!hitsWall(spot.x, spot.y, 0.4) && Math.hypot(spot.x - p.x, spot.y - p.y) > 4) break;
    }
    const m = createMonster(type, spot.x, spot.y, L);
    m.aggro = true; m.appearTimer = 0.6;
    if (i < elites && typeof makeElite === "function" && !(ELITE_RULES.notElite || []).includes(type)) makeElite(m, pickAffixes(1, game.profile.difficulty));
    monsters.push(m);
    addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 280 });
  }
  if (tb) {
    const c = world.W / 2;
    const m = tb.def.create(c - 1, c - 1, L + 1);
    m.boss = true; m.towerBoss = tb.mapId; if (m.aggro === undefined || m.aggro === false) m.aggro = true;
    // 탑 버전: 정예 속성 하나 (30층 탑의 주인은 그대로)
    if (tb.mapId !== "tower") {
      const id = TOWER.bossAffixes[Math.floor(Math.random() * TOWER.bossAffixes.length)], a = ELITE_AFFIXES[id];
      m.elite = true; m.affixes = [id]; if (a && a.apply) a.apply(m);
      m.name = `${tb.def.name || m.name} (${a ? a.name : id})`;
    }
    const free = findFreeSpot(m.x, m.y, m.r, 4);
    if (free) { m.x = free.x; m.y = free.y; }
    monsters.push(m);
    T.boss = m;
    sfx.boss();
    game.shake = 0.5;
    showMessage(tb.mapId === "tower" ? "마지막 층! 탑의 주인이 나타났어요!" : `보스 등장! ${m.name}`, 3, tb.mapId === "tower", "#ff7070");
  }
}

function makeBoss(m) {
  m.boss = true;
  m.name = "보스 " + m.def.name;
  m.maxHp *= 10; m.hp = m.maxHp;
  m.damage *= 1.5;
  m.scaleMul = 1.7;
  m.r *= 1.6;
  m.aggro = true;
  m.appearTimer = 1;
  addRing(m.x, m.y, { speed: 6, life: 0.6, hue: 0 });
  addRing(m.x, m.y, { speed: 4, life: 0.7, hue: 40, delay: 0.15 });
}

function updateTower(p, dt) {
  const T = game.tower;
  if (T.waveDelay > 0) {
    T.waveDelay -= dt;
    if (T.waveDelay <= 0) spawnWave();
    return;
  }
  // 보스가 쓰러지면 남은 부하·분신과 아직 안 끝난 기술(부르기 등)도 함께 사라져요 (보스방과 같아요)
  if (T.boss && T.boss.hp <= 0 && !T.bossDown) {
    T.bossDown = true;
    for (const m of monsters) if (m !== T.boss && m.hp > 0) { m.hp = 0; spawnBurst(m.x, m.y, ["#888888"], 6); }
    monsters = monsters.filter((m) => m.hp > 0);
    if (typeof casts !== "undefined") casts = casts.filter((c) => !c.m || c.m === game.player || c.m.hp > 0);
  }
  if (!T.cleared && monsters.length === 0) floorCleared();
  if (stairs.open) stairs.glow += dt;
  // 보스 층은 방이 넓어서 조금 멀리 봐요 (보스방처럼)
  if (typeof setBossZoom === "function") setBossZoom(!!(towerBossAt(T.floor) && !T.cleared));
}

function floorCleared() {
  const T = game.tower;
  const p = game.player;
  T.cleared = true;
  const pr = game.profile;
  pr.towerBest = Math.max(pr.towerBest || 0, T.floor);
  if (T.floor >= TOWER.floors) {
    const last = towerBossAt(T.floor);
    if (last && typeof towerBossReward === "function") towerBossReward(last.mapId, towerLevel(T.floor));
    endRun(true);
    return;
  }
  // 층 보상
  const bonus = 3 + T.floor;
  pr.emeralds += bonus;
  game.run.emeralds += bonus;
  // 층마다 화폐 조금 (탑 층이 높을수록 좋은 화폐)
  const tl = towerLevel(T.floor);
  const ct = mapCoinTier(tl);
  if (ct >= 1) curAdd(coinIdOfTier(ct), Math.max(1, coinCount(1 + T.floor * 0.15)));
  else curAdd("emerald", 3);
  const tb = towerBossAt(T.floor);
  if (tb && typeof towerBossReward === "function") towerBossReward(tb.mapId, tl);
  p.hp = Math.min(p.maxHp, p.hp + 3);
  stairs.open = true;
  sfx.clear();
  showMessage(`${T.floor}층 클리어! 에메랄드 +${bonus} · 계단이 열렸어요`, 3, false, "#7dffb0");
  if (tb) {
    addChest(world.W / 2, world.H / 2, true);
    showMessage(`보스 처치! 황금 상자가 나왔어요`, 3, true);
  }
  saveProfile();
}

function stairsInteractables() {
  if (!stairs || !stairs.open) return [];
  return [{ x: stairs.x, y: stairs.y, range: 1.6, short: "올라가기", prompt: "다음 층으로", action: nextFloor }];
}

function nextFloor() {
  const T = game.tower;
  const p = game.player;
  T.floor++;
  T.cleared = false;
  T.waveDelay = 1.5;
  T.boss = null; T.bossDown = false;
  const hp = p.hp;
  resetEffects();
  buildArenaFloor(T.floor);
  placePlayer();
  game.player.hp = hp;
  game.fade = 0.6;
  sfx.stairs();
  const nb = towerBossAt(T.floor);
  showMessage(nb ? (T.floor === TOWER.floors ? `${T.floor}층 · 마지막 층!` : `${T.floor}층 · 보스 층!`) : T.floor % 5 === 4 ? `${T.floor}층 · 다음은 보스 층!` : `${T.floor}층`, 2.5, false, nb ? "#ff8080" : "#ffe27a");
}

function stairsThings(things) { const r = stairsThingsBase(things); hookRun("worldThings", things); return r; }
function stairsThingsBase(things) {
  if (!stairs) return;
  things.push({ depth: stairs.x + stairs.y, draw: drawStairs });
}

function drawStairs() {
  const s = stairs;
  // 뒤로 올라가는 돌계단 4칸
  for (let i = 0; i < 4; i++) {
    const off = i * 0.35;
    drawBox(s.x - 0.7 - off, s.y - 0.7 - off, 0, 1.4, 1.4, 0.25 * (i + 1), shade(world.theme.wall, s.open ? 1.15 - i * 0.05 : 0.7));
  }
  if (!s.open) {
    // 닫혀 있을 땐 쇠창살
    const a = toScreen(s.x - 1.2, s.y - 1.2, 0), b = toScreen(s.x - 1.2, s.y - 1.2, 1.4);
    ctx.strokeStyle = "rgba(60,60,70,0.9)"; ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      const o = toScreen(s.x - 1.2 + i * 0.25, s.y - 1.2 - i * 0.25, 0), t = toScreen(s.x - 1.2 + i * 0.25, s.y - 1.2 - i * 0.25, 1.3);
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(t.x, t.y); ctx.stroke();
    }
    return;
  }
  // 열리면 반짝반짝 빛기둥
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const c = toScreen(s.x, s.y, 0.5);
  const k = 0.5 + 0.3 * Math.sin(s.glow * 4);
  const g = ctx.createLinearGradient(c.x, c.y - 140 * ZOOM, c.x, c.y + 20);
  g.addColorStop(0, "rgba(255,230,140,0)");
  g.addColorStop(1, `rgba(255,230,140,${0.45 * k})`);
  ctx.fillStyle = g;
  ctx.fillRect(c.x - 34 * ZOOM, c.y - 140 * ZOOM, 68 * ZOOM, 160 * ZOOM);
  ctx.restore();
  if (Math.random() < 0.3) addSparkle(s.x + (Math.random() - 0.5), s.y + (Math.random() - 0.5), Math.random() * 1.5, { vz: 1, life: 0.8, size: 0.6, gold: true });
}

// 보스 체력 막대 (화면 위)
function drawBossBar() {
  const boss = monsters.find((m) => m.boss && m.hp > 0);
  if (!boss) return;
  const w = Math.min(520, view.w * 0.5), x = (view.w - w) / 2, y = 64;
  text(boss.name, view.w / 2, y - 8, 20, "#ff9090", "center");
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(x - 3, y - 3, w + 6, 20);
  ctx.fillStyle = "#3a1010"; ctx.fillRect(x, y, w, 14);
  ctx.fillStyle = "#e23b3b"; ctx.fillRect(x, y, w * (boss.hp / boss.maxHp), 14);
}
