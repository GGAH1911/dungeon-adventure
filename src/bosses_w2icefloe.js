// ===== 월드 2 보스: 바다코끼리 쿵쿵이 (꽁꽁 얼음 바다, icefloe) =====
// 새 아이디어 하나: 눈덩이 굴리기
//   아레나에 눈덩이 4개. 눈덩이는 아프지 않지만, 칼·화살·마법에 맞으면 맞은 반대쪽으로 데굴데굴 굴러가요 (구르며 조금 커지고, 벽에 2번까지 튕겨요).
//   굴러간 눈덩이가 쿵쿵이에게 닿으면 "펑!" -> 오래 비틀거려요 + 최대 체력 3% 피해. 눈덩이는 6초 뒤 제자리에 다시 생겨요.
//   쿵쿵이가 가까우면 눈덩이에서 쿵쿵이 쪽으로 금색 점선 + "여기서 쳐요" 동그라미가 보여요.
// 단계: 1 가르치기(엄니 쿵·배 미끄럼·고드름 비) / 2 시험(+얼음 고리·펭귄 썰매병) / 3 비틀기(찬 숨결: 눈덩이가 꽁꽁 얼어서 두 번 쳐야 굴러가요)
// 아레나: 가운데 큰 얼음판(미끄러워요, ocean_env.js 얼음판) + 낮은 얼음 기둥 4개
// 같이 하기: 눈덩이 상태는 눈덩이 몬스터 칸(icRoll·icGone·icShell·r)에 있어요 (친구에게 그대로 가요)

const IC = {
  mapId: "icefloe",
  rollSpeed: 6, rollMax: 16, bounces: 2,
  rMin: 0.45, rMax: 0.72, grow: 0.03,      // 1칸 구를 때마다 커지는 양
  stagger: 2.6, dmgFrac: 0.03, respawn: 6,
  shellT: 8, shellHits: 2,
  guideDist: 10,
  homes: [[-7.5, 0], [0, -7.5], [0, 7.5], [6.2, 4.2]],
};
function icStagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[(game.profile && game.profile.difficulty) || "normal"] || 1; }

Object.assign(MATERIALS, { w2_walrusTusk: { name: "바다코끼리 엄니", color: "#f4ead0" } });

// ----- 눈덩이 (때릴 수 있지만 다치지 않는 소품) -----
MONSTERS.w2_icSnowball = { name: "눈덩이", color: "#f4fbff", shape: "w2_icSnowball", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 2 };

// ----- 기술 -----
Object.assign(ABILITIES, {
  w2_tuskStomp: { name: "엄니 쿵", desc: "몸을 번쩍 들었다가 앞을 엄니로 쿵! 그 뒤 숨을 골라요.", counter: "빨간 원 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.1, at: "front", offset: 1.7, time: 1.25 },
    cooldown: 5, range: [0, 3.6], damageMul: 2.1, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.5 } },
  w2_bellySlide: { name: "배 미끄럼", desc: "배를 깔고 넓은 빨간 길로 쭉 미끄러져요. 벽이나 기둥에 부딪히면 어지러워요.", counter: "넓은 빨간 길 옆으로! 부딪히면 때려요",
    tags: ["boss", "line", "move", "stagger"], telegraph: { shape: "line", length: 8, width: 2.0, at: "self", time: 1.2 },
    cooldown: 7, range: [2, 9], damageMul: 1.6, anim: "crouch", staggerAfter: 1.8, effect: { type: "charge", speed: 9, stunOnWall: 2.0 } },
  w2_iceRain: { name: "고드름 비", desc: "고드름이 여러 군데 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.25 },
    cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 3.6, stagger: 0.18 } },
  w2_iceRing: { name: "얼음 고리", desc: "배를 쿵 굴러 둘레에 얼음 고리를 퍼뜨려요. 쿵쿵이 바로 옆은 안전해요.", counter: "쿵쿵이 옆 금색 안으로 파고들어요",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 5, inner: 1.9, at: "self", time: 1.2 },
    cooldown: 8, range: [0, 6], damageMul: 1.4, anim: "slam", effect: { type: "knockback", force: 1.0 } },
  w2_penguinCall: { name: "펭귄 부르기", desc: "휘파람을 불면 펭귄 썰매병 둘이 가장자리에서 와요.", counter: "펭귄 썰매 길 옆으로! 눈덩이로 맞혀도 돼요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w2_icPenguins", monster: "w2_penguin", count: 2, max: 3 } },
  w2_frostBreath: { name: "찬 숨결", desc: "후~ 차가운 숨을 불어 앞을 얼리고, 눈덩이를 모두 꽁꽁 얼려요.", counter: "부채꼴 옆으로! 얼은 눈덩이는 두 번 쳐서 깨요",
    tags: ["boss", "cone", "slow"], telegraph: { shape: "cone", length: 7, angle: 1.1, at: "self", time: 1.3 },
    cooldown: 12, range: [0, 30], damageMul: 1.2, anim: "roar", effect: { type: "w2_icBreath", slow: 1.5 } },
});

// ----- 보스 -----
const IC_BOSS = { type: "w2_walrus", name: "쿵쿵이", title: "바다코끼리", shape: "w2_walrus", color: "#8a5a3a",
  size: 3.0, r: 1.05, hp: 210, damage: 1.8, speed: 0.95 };
MONSTERS[IC_BOSS.type] = { name: IC_BOSS.name, shape: IC_BOSS.shape, behavior: "bossAI", color: IC_BOSS.color, hp: IC_BOSS.hp, speed: IC_BOSS.speed, damage: IC_BOSS.damage,
  xp: 45, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: IC_BOSS.size, world: 2 };
const IC_PHASES = [
  { until: 0.66, gap: 1.8, pattern: ["w2_tuskStomp", "w2_bellySlide", "w2_iceRain", "w2_tuskStomp"] },
  { until: 0.33, gap: 1.6, pattern: ["w2_penguinCall", "w2_tuskStomp", "w2_iceRing", "w2_bellySlide", "w2_iceRain"] },
  { until: 0, gap: 1.4, pattern: ["w2_frostBreath", "w2_bellySlide", "w2_iceRing", "w2_penguinCall", "w2_tuskStomp", "w2_iceRain"] },
].map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));

function icBuildArena(w) {
  const c = w.W / 2;
  b2Pillars(w, [[-5, -5], [5, 5], [-5, 5], [5, -5]], 1); // 낮은 얼음 기둥
  w2EnsureEnv(w).ice.push({ x0: c - 4, y0: c - 4, x1: c + 4, y1: c + 4 }); // 가운데 큰 얼음판 (미끄러워요)
}
BOSS_DEFS[IC.mapId] = {
  id: IC_BOSS.type, name: IC_BOSS.name, title: IC_BOSS.title, size: IC_BOSS.size, world: 2,
  material: { id: "w2_walrusTusk", name: "바다코끼리 엄니", color: "#f4ead0" },
  arena: { size: 26, theme: { floor: "#cfe2ea", moss: "#9fd8ff", wall: "#6f9ab8", darkness: 0.2, bg: "#0a2a40" }, build: icBuildArena },
  phases: IC_PHASES,
  create(x, y, level) {
    const m = createMonster(IC_BOSS.type, x, y, level);
    m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[IC.mapId];
    m.name = `${IC_BOSS.title} ${IC_BOSS.name}`;
    m.r = IC_BOSS.r; m.level = level; m.aggro = true; m.appearTimer = 1;
    m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
    m.onPhase = (idx) => icPhase(m, idx);
    return m;
  },
};
function icPhase(m, idx) {
  if (idx === 1) showMessage("펭귄 썰매병이 와요! 눈덩이로 맞혀도 돼요", 2.6, false, "#9fe6ff");
  if (idx === 2) showMessage("찬 숨결이 눈덩이를 얼려요! 얼은 눈덩이는 두 번 쳐요", 3, false, "#bff0ff");
}
function icBoss() { const b = w2BossNow(); return b && b.type === IC_BOSS.type ? b : null; }
function icBalls() { return monsters.filter((o) => o.type === "w2_icSnowball"); }

// ----- 눈덩이: 맞으면 굴러가요 (다치지 않아요) -----
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w2_icSnowball") return false;
  if (h.opts.dot || s.icGone || s.icRoll) return true;
  if (s.icShell > 0) {
    if (game.time - (s.icHitT || -9) < 0.15) return true; // 한 번 휘두름에 여러 번 맞아도 한 번
    s.icHitT = game.time;
    s.icShell--;
    addFloatText(s.x, s.y, s.icShell > 0 ? "쩍!" : "깨졌다!", "#bff0ff", 20);
    spawnBurst(s.x, s.y, ["#bff0ff", "#ffffff"], 6);
    if (s.icShell > 0) return true;
  }
  icRollBall(s, h.fromX, h.fromY);
  return true;
}, 4);
function icRollBall(s, fx, fy) {
  let dx = s.x - fx, dy = s.y - fy, d = Math.hypot(dx, dy);
  if (!(d > 0.2)) { const p = nearestPlayer(s.x, s.y); if (p) { dx = s.x - p.x; dy = s.y - p.y; d = Math.hypot(dx, dy); } }
  if (!(d > 0.05)) { const b = icBoss(); if (b) { dx = b.x - s.x; dy = b.y - s.y; d = Math.hypot(dx, dy); } }
  if (!(d > 0.05)) { dx = 1; dy = 0; d = 1; }
  s.icRoll = { vx: dx / d, vy: dy / d, b: 0, dist: 0 };
  s.icShell = 0; s.icShellT = 0;
  addFloatText(s.x, s.y, "데굴!", "#ffffff", 18);
  if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
}
hookOn("untargetable", (o) => !!o.icGone, 50);

// 굴리기·펑·다시 생기기 (방장)
hookOn("dungeonTick", (dt) => {
  const boss = icBoss();
  if (!boss) return;
  const c = world.W / 2;
  if (!boss.icInit) {
    boss.icInit = true;
    for (const [ox, oy] of IC.homes) { const s = spawnProp("w2_icSnowball", c + ox, c + oy, boss); s.r = IC.rMin; s.icHomeX = s.x; s.icHomeY = s.y; s.aggro = true; }
  }
  for (const s of icBalls()) {
    if (s.icGone) {
      s.icGoneT -= dt;
      if (s.icGoneT <= 0) {
        const spot = findFreeSpot(s.icHomeX, s.icHomeY, IC.rMin, 2) || { x: s.icHomeX, y: s.icHomeY };
        s.x = spot.x; s.y = spot.y; s.r = IC.rMin; s.icGone = false; s.appearTimer = 0.6; s.icShell = 0;
        addRing(s.x, s.y, { speed: 3, life: 0.4, hue: 195 });
      }
      continue;
    }
    if (s.icShell > 0) { s.icShellT -= dt; if (s.icShellT <= 0) { s.icShell = 0; addFloatText(s.x, s.y, "녹았다", "#bff0ff", 14); } }
    const R = s.icRoll;
    if (!R) continue;
    const step = IC.rollSpeed * dt;
    const x0 = s.x, y0 = s.y;
    moveEntity(s, R.vx * step, 0); if (Math.abs(s.x - x0 - R.vx * step) > 1e-3) { R.vx = -R.vx; R.b++; }
    moveEntity(s, 0, R.vy * step); if (Math.abs(s.y - y0 - R.vy * step) > 1e-3) { R.vy = -R.vy; R.b++; }
    R.dist += step;
    s.r = Math.min(IC.rMax, s.r + IC.grow * step);
    if (Math.random() < 0.3) spawnDust(s.x, s.y);
    // 쿵쿵이에게 닿으면 펑!
    if (boss.hp > 0 && Math.hypot(boss.x - s.x, boss.y - s.y) < boss.r + s.r + 0.1) { icBallHitsBoss(s, boss); continue; }
    // 가는 길의 몬스터(펭귄)는 데굴 맞아요
    for (const o of monsters) {
      if (o === s || o === boss || o.hp <= 0 || o.boss || !o.def || o.def.behavior === "prop" || o.icHitBy === s.icRollN) continue;
      if (Math.hypot(o.x - s.x, o.y - s.y) > (o.r || 0.35) + s.r) continue;
      o.icHitBy = s.icRollN;
      damageMonster(o, o.maxHp * 0.6, s.x - R.vx, s.y - R.vy, false, 1.5, { w2Snow: true });
    }
    if (R.b > IC.bounces || R.dist > IC.rollMax) { s.icRoll = null; s.icRollN = (s.icRollN || 0) + 1; }
  }
}, 40);
function icBallHitsBoss(s, boss) {
  s.icRoll = null; s.icRollN = (s.icRollN || 0) + 1;
  s.icGone = true; s.icGoneT = IC.respawn;
  spawnBurst(s.x, s.y, ["#ffffff", "#bff0ff", "#e6f4fa"], 18);
  addRing(s.x, s.y, { speed: 6, life: 0.4, hue: 195 });
  damageMonster(boss, boss.maxHp * IC.dmgFrac, s.x, s.y, false, 0, { w2Snow: true });
  casts = casts.filter((c) => c.m !== boss); boss.charge = null; boss.state = "chase"; boss.queue = [];
  boss.stagger = Math.max(boss.stagger || 0, IC.stagger * icStagK());
  addFloatText(boss.x, boss.y, "펑! 비틀!", "#ffe27a", 28); game.shake = Math.max(game.shake, 0.45);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
}

// ----- 새 효과 -----
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect, m = c.m;
  if (e.type === "w2_icPenguins") {
    const alive = monsters.filter((o) => o.type === e.monster && o.hp > 0 && o.icSummoned).length;
    const n = Math.min(e.count, Math.max(0, e.max - alive));
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(m.y - world.H / 2, m.x - world.W / 2) + Math.PI + (i - (n - 1) / 2) * 0.9, r = world.W / 2 - 3.2;
      const spot = findFreeSpot(world.W / 2 + Math.cos(a) * r, world.H / 2 + Math.sin(a) * r, 0.35, 3) || { x: world.W / 2, y: world.H / 2 };
      const s = createMonster(e.monster, spot.x, spot.y, m.level || game.mapLevel);
      s.aggro = true; s.appearTimer = 0.6; s.summoned = true; s.icSummoned = true; monsters.push(s);
      addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 200 });
    }
    if (n) showMessage("펭귄 썰매병이 왔어요!", 2, false, "#9fe6ff");
    return true;
  }
  if (e.type === "w2_icBreath") {
    if (p && p.hp > 0 && insideShape(c, p.x, p.y, p.r * 0.6)) {
      if (p.rollTimer > 0) addFloatText(p.x, p.y, "회피!", "#9be8ff", 18);
      else { hurtPlayer(p, abilityDamage(c), m); p.abSlow = Math.max(p.abSlow || 0, e.slow); }
    }
    const k = { easy: 0.75, normal: 1, hard: 1.1, nightmare: 1.2 }[(game.profile && game.profile.difficulty) || "normal"] || 1;
    for (const s of icBalls()) {
      if (s.icGone || s.icRoll) continue;
      s.icShell = IC.shellHits; s.icShellT = IC.shellT * k;
      addRing(s.x, s.y, { speed: 3, life: 0.35, hue: 190 });
    }
    flashScreen(0.08);
    showMessage("눈덩이가 꽁꽁! 두 번 쳐서 깨요", 2.2, false, "#bff0ff");
    return true;
  }
  return false;
}, 15);

// ----- 그림: 금색 안내 점선 (눈덩이 -> 쿵쿵이) -----
hookOn("drawTelegraphsAfter", () => {
  const boss = icBoss();
  if (!boss || boss.hp <= 0) return;
  for (const s of icBalls()) {
    if (s.icGone || s.icRoll || s.appearTimer > 0) continue;
    const dx = boss.x - s.x, dy = boss.y - s.y, d = Math.hypot(dx, dy);
    if (d > IC.guideDist || d < 1.5) continue;
    const ux = dx / d, uy = dy / d;
    ctx.save(); ctx.strokeStyle = "rgba(255,210,63,0.75)"; ctx.lineWidth = 3 * ZOOM; ctx.setLineDash([7 * ZOOM, 7 * ZOOM]); ctx.lineDashOffset = -game.time * 30 * ZOOM;
    const a = toScreen(s.x + ux * (s.r + 0.2), s.y + uy * (s.r + 0.2), 0.03), b = toScreen(boss.x - ux * boss.r, boss.y - uy * boss.r, 0.03);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
    // "여기서 쳐요" 자리 (눈덩이 뒤쪽)
    const hx = s.x - ux * (s.r + 0.7), hy = s.y - uy * (s.r + 0.7), pts = [];
    for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; pts.push(toScreen(hx + Math.cos(t) * 0.35, hy + Math.sin(t) * 0.35, 0.03)); }
    ctx.save(); ctx.strokeStyle = `rgba(255,210,63,${0.55 + 0.3 * Math.sin(game.time * 5)})`; ctx.lineWidth = 2.5 * ZOOM; ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
}, 50);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 바다코끼리 쿵쿵이: 통통한 갈색 몸, 크림색 뭉툭한 엄니 둘, 하얀 수염, 작은 파란 목도리
  w2_walrus(m) {
    const a = bossMotion(m), P = [];
    const slide = !!m.charge, sq = a.stag ? 0.88 : 1, up = a.raise * 0.08 - (slide ? 0.05 : 0);
    const body = "#8a5a3a", dk = "#7a4a2e", lt = "#a87454";
    // 지느러미
    for (const sd of [1, -1]) {
      P.push([0.16 + a.walk * sd * 0.03, sd * 0.25, 0, 0.14, 0.08, 0.05, dk]);
      P.push([-0.33, sd * 0.1, 0, 0.1, 0.12, 0.04, dk]);
    }
    // 몸 (통통) + 배
    P.push([-0.06, 0, 0.02, 0.5, 0.44, 0.3 * sq, body]);
    P.push([0.02, 0, 0.0, 0.4, 0.38, 0.04, lt]);
    P.push([-0.2, 0, 0.3 * sq, 0.2, 0.32, 0.06, body]);
    // 머리
    P.push([0.22, 0, 0.18 + up, 0.26, 0.32, 0.22 * sq, lt]);
    // 목도리
    P.push([0.11, 0, 0.17 + up * 0.5, 0.07, 0.46, 0.07, "#4a8ae0"]);
    P.push([0.05, 0.22, 0.06 + up * 0.5, 0.05, 0.05, 0.12, "#4a8ae0"], [0.05, 0.22, 0.04 + up * 0.5, 0.06, 0.06, 0.03, "#ffffff"]);
    // 주둥이 + 코
    P.push([0.355, 0, 0.19 + up, 0.06, 0.24, 0.1, "#d8b090"]);
    P.push([0.39, 0, 0.27 + up, 0.03, 0.08, 0.04, "#3a2418"]);
    // 엄니 (뭉툭한 크림색 블록) + 수염
    for (const sd of [1, -1]) {
      P.push([0.37, sd * 0.065, 0.05 + up, 0.05, 0.05, 0.15, "#f4ead0"]);
      P.push([0.37, sd * 0.065, 0.035 + up, 0.045, 0.045, 0.02, "#e8dcc0"]);
      P.push([0.388, sd * 0.06, 0.22 + up, 0.012, 0.016, 0.016, "#5a3a28", true]);
      P.push([0.39, sd * 0.16, 0.22 + up, 0.01, 0.1, 0.01, "#ffffff", true]);
      P.push([0.39, sd * 0.155, 0.2 + up, 0.01, 0.09, 0.01, "#ffffff", true]);
    }
    eyes(P, 0.352, 0.085, 0.32 + up, 0.06, "#2a1a10", a.stag);
    drawVoxelParts(m, P, { top: 0.62 });
  },
  // 눈덩이: 하얀 공 (굴러가면 빙글), 얼면 하늘색 얼음 껍질 (금 간 표시)
  w2_icSnowball(m) {
    if (m.icGone) return;
    const r = m.r || IC.rMin, d = r * 1.8, x = m.x, y = m.y;
    const wob = m.icRoll ? Math.sin(game.time * 24) * 0.03 : 0;
    // 층층이 쌓아 동그랗게 (아래·위는 좁게, 가운데는 넓게)
    const layers = [[0.62, 0, 0.16], [0.9, 0.14, 0.2], [1.0, 0.32, 0.26], [0.9, 0.56, 0.2], [0.62, 0.74, 0.14]];
    for (const [k, z, h] of layers) drawBox(x - d * k / 2 + wob, y - d * k / 2, d * z, d * k, d * k, d * h, k === 1 ? "#ffffff" : "#eef7fc");
    // 굴러가면 눈 조각이 빙글 (멈춰 있으면 반짝 한 점)
    const rot = m.icRoll ? game.time * 12 : 0.6;
    drawBox(x + Math.cos(rot) * d * 0.25 - 0.05, y + Math.sin(rot) * d * 0.25 - 0.05, d * 0.88, 0.1, 0.1, 0.03, "#cfe6f2");
    if (m.icShell > 0) {
      ctx.save(); ctx.globalAlpha *= 0.5;
      drawBox(x - d * 0.6, y - d * 0.6, 0, d * 1.2, d * 1.2, d * 1.05, "#9fd8ff");
      ctx.restore();
      drawBox(x - d * 0.6, y - d * 0.6, d * 1.05, d * 1.2, d * 1.2, 0.03, "#dff4ff");
      if (m.icShell === 1) { drawBox(x - d * 0.6, y - 0.02, d * 0.5, d * 1.2, 0.04, 0.04, "#ffffff"); drawBox(x - 0.02, y - d * 0.6, d * 0.7, 0.04, d * 1.2, 0.04, "#ffffff"); }
    }
  },
});
hookOn("lights", (lights) => { const b = icBoss(); if (!b) return; for (const s of icBalls()) if (s.icShell > 0 && !s.icGone) lights.push({ x: s.x, y: s.y, radius: 1.4, power: 0.5 }); }, 61);

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_tuskStomp: { text: "원 밖으로! 그다음 공격" },
  w2_bellySlide: { text: "넓은 빨간 길 옆으로!" },
  w2_iceRain: { text: "원 사이로 걸어가요" },
  w2_iceRing: { text: "쿵쿵이 옆 금색 안으로!", do: true },
  w2_penguinCall: { text: "펭귄 썰매 길 옆으로!" },
  w2_frostBreath: { text: "얼은 눈덩이는 두 번 쳐요!", do: true, voice: true },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.icefloe = {
  0: "눈덩이를 쳐서 쿵쿵이에게 굴려요!",
  1: "펭귄이 와요! 눈덩이로 맞혀도 돼요",
  2: "얼은 눈덩이는 두 번 쳐서 깨요!",
};
