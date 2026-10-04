// ===== 월드 2 보스 7: 상어 대장 샤키 (상어 암초) =====
// 새 아이디어 하나: 덫 조개를 사이에 두기
//   샤키가 물속으로 숨으면(등지느러미만 보여요) 아레나를 빙글 돌다가, 주인공 쪽으로 긴 빨간 줄을 그리고 쭉 달려와요.
//   그 줄 위에 "열린 덫 조개"가 있으면 샤키가 조개에 꽉! 물려서 오래 비틀거려요 (때릴 시간). 조개는 한동안 닫혀 있어요.
//   -> 조개를 샤키와 나 사이에 두고 서요. 줄 위에 걸린 조개는 금색으로 빛나요 (안내).
// 1단계 가르치기: 지느러미 돌진 + 콱 깨물기 / 2단계 시험: + 꼬마 상어, 조개가 늦게 열려요 / 3단계 비틀기: 돌진 두 번 연달아
// 틀은 bosses_c.js 와 같아요 (bossAI + m.bossA). 싸움 상태는 모두 보스·조개 몬스터 칸에 (같이 하기에서 친구 화면에도 보여요)

Object.assign(MATERIALS, { w2_sharkTooth: { name: "둥근 상어 이빨", color: "#f4f8fb" } });

const SK = {
  clamR: 0.75,          // 조개 크기 (걸리는 거리 = 이것 + 0.55)
  ring: 4.6,            // 조개가 놓이는 원 (아레나 가운데에서)
  finR: 8.6,            // 지느러미가 도는 원
  finSpeed: 4.2,
  finTime: { easy: 3.4, normal: 2.6, hard: 2.3, nightmare: 2.0 }, // 돌다가 줄을 그릴 때까지
  dashSpeed: 13,
  caught: 3.0,          // 조개에 물리면 비틀 (난이도 배수 곱함)
  reopen: [10, 14, 14], // 조개가 다시 열리는 시간 (단계마다)
  wallDaze: 0.5,
  pupMax: 3,
};
function skDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function skStagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[skDiff()] || 1; }

// ----- 소품: 커다란 덫 조개 (밟고 지나갈 수 있어요, 맞지 않아요) -----
Object.assign(MONSTERS, {
  w2_bigClamTrap: { name: "덫 조개", color: "#8a7aa8", shape: "w2_skClam", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true, world: 2 },
});

// ----- 기술 -----
Object.assign(ABILITIES, {
  w2_finDive: { name: "물속으로 쏙", desc: "물속으로 쏙 들어가 등지느러미만 보이며 빙글빙글 돌아요. 물속에선 맞지 않아요.",
    counter: "덫 조개를 샤키와 나 사이에 두고 서요", tags: ["boss", "hide"],
    telegraph: { shape: "self", radius: 1.3, at: "self", time: 0.6 }, cooldown: 99, range: [0, 30], damageMul: 0, anim: "crouch",
    effect: { type: "w2_skDive" } },
  w2_finDash: { name: "지느러미 돌진", desc: "주인공 쪽으로 긴 빨간 줄을 그리고 벽까지 쭉 달려와요. 줄 위에 열린 덫 조개가 있으면 꽉 물려요!",
    counter: "줄 옆으로 비켜요. 조개를 사이에 두면 샤키가 꽉!", tags: ["boss", "line", "move"],
    telegraph: { shape: "line", length: 20, width: 1.4, at: "self", time: 1.6, follow: true }, cooldown: 1, range: [0, 30], damageMul: 1.8, anim: "crouch",
    effect: { type: "w2_skDash" } },
  w2_chomp: { name: "콱 깨물기", desc: "입을 크게 벌렸다가 앞을 콱! 깨물어요. 그다음 잠깐 숨을 골라요.",
    counter: "빨간 원 밖으로! 그다음 공격", tags: ["boss", "area", "stagger"],
    telegraph: { shape: "circle", radius: 2.0, at: "front", offset: 1.7, time: 1.2 },
    cooldown: 5, range: [0, 3.8], damageMul: 2.0, anim: "slam", staggerAfter: 1.8, effect: { type: "knockback", force: 1.5 } },
  w2_tailWhip: { name: "꼬리 철썩", desc: "꼬리를 휘둘러 뒤쪽 부채꼴을 철썩!", counter: "샤키 꼬리 쪽에 서지 마요",
    tags: ["boss", "cone"], telegraph: { shape: "cone", length: 4.5, angle: 1.4, at: "self", time: 1.1, back: true },
    cooldown: 5, range: [0, 4.5], damageMul: 1.5, anim: "crouch", effect: { type: "knockback", force: 1.8 } },
  w2_bubbleVolley: { name: "거품 탄막", desc: "거품 다섯 알을 부채처럼 뿜어요.", counter: "부채꼴 옆으로 돌거나 거품 사이로",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 6, angle: 0.9, at: "self", time: 0.8, harmlessPreview: true },
    cooldown: 6, range: [0, 10], damageMul: 0.8, anim: "point", effect: { type: "volley", count: 5, spread: 0.9, speed: 6, color: "#bff6ff" } },
  w2_pupCall: { name: "꼬마 상어 부르기", desc: "휘파람을 불어 꼬마 상어를 불러요.", counter: "꼬마 상어도 조개로 데려가요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w2_skPups", count: 2 } },
});

// ----- 보스 -----
const SK_BOSS = { mapId: "sharkreef", type: "w2_sharky", name: "샤키", title: "상어 대장", shape: "w2_sharky", color: "#7f95a8",
  size: 2.8, r: 1.0, hp: 215, damage: 1.9, speed: 1.1 };
MONSTERS[SK_BOSS.type] = { name: SK_BOSS.name, shape: SK_BOSS.shape, behavior: "w2_skShark", color: SK_BOSS.color, hp: SK_BOSS.hp, speed: SK_BOSS.speed, damage: SK_BOSS.damage,
  xp: 45, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: SK_BOSS.size, world: 2 };
{
  const P = [
    { until: 0.66, gap: 1.8, pattern: ["w2_finDive", "w2_chomp", "w2_bubbleVolley", "w2_chomp"] },
    { until: 0.33, gap: 1.6, pattern: ["w2_finDive", "w2_pupCall", "w2_chomp", "w2_tailWhip", "w2_finDive", "w2_bubbleVolley"] },
    { until: 0, gap: 1.4, pattern: ["w2_finDive", "w2_chomp", "w2_tailWhip", "w2_pupCall", "w2_finDive", "w2_bubbleVolley", "w2_chomp"] },
  ];
  BOSS_DEFS.sharkreef = {
    id: SK_BOSS.type, name: SK_BOSS.name, title: SK_BOSS.title, size: SK_BOSS.size, world: 2,
    material: { id: "w2_sharkTooth", name: "둥근 상어 이빨", color: "#f4f8fb" },
    arena: { size: 26, theme: { floor: "#b8a888", moss: "#5fb0c0", wall: "#4a6070", darkness: 0.3, bg: "#062030" } },
    phases: P.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap })),
    create(x, y, level) {
      const m = createMonster(SK_BOSS.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS.sharkreef;
      m.name = `${SK_BOSS.title} ${SK_BOSS.name}`;
      m.r = SK_BOSS.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.onPhase = (idx) => skPhase(m, idx);
      return m;
    },
  };
}
BEHAVIOR_DOCS.w2_skShark = { name: "지느러미 상어", desc: "물속에 숨어 지느러미만 보이며 돌다가 긴 줄로 돌진해요. 줄 위의 열린 덫 조개에 물려요.", counter: "덫 조개를 샤키와 나 사이에 두고, 꽉 물렸을 때 마구 때리기" };

function skPhase(m, idx) {
  if (idx === 1) showMessage("꼬마 상어가 와요! 조개는 천천히 다시 열려요", 2.6, false, "#9fe6ff");
  if (idx === 2) showMessage("화난 샤키! 돌진이 두 번 와요", 2.6, false, "#ffb070");
}
function skClams() { return monsters.filter((o) => o.type === "w2_bigClamTrap" && o.hp > 0); }
function skArenaC() { return { x: world.W / 2, y: world.H / 2 }; }

// 첫 프레임: 덫 조개 5개 (아레나 가운데 둘레, 걸어서 지나갈 수 있어요: 벽(solids)이 아니에요)
hookOn("dungeonTick", (dt) => {
  const m = w2BossNow();
  if (!m || m.type !== SK_BOSS.type) return;
  if (!m.skInit) {
    m.skInit = true;
    const c = skArenaC();
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const s = createMonster("w2_bigClamTrap", c.x + Math.cos(a) * SK.ring, c.y + Math.sin(a) * SK.ring, m.level || game.mapLevel);
      s.aggro = true; s.appearTimer = 0.4; s.owner = m; s.immovable = true; s.r = 0.3; s.shutT = 0; s.skIdx = i;
      monsters.push(s);
      addRing(s.x, s.y, { speed: 3, life: 0.4, hue: 280 });
    }
  }
  for (const s of skClams()) {
    if (s.shutT > 0 && !(s.skHold && m.stagger > 0)) s.shutT = Math.max(0, s.shutT - dt);
    if (s.skHold && !(m.stagger > 0)) s.skHold = false;
  }
  // 금색 안내: 지금 그려진 돌진 줄 위의 첫 열린 조개
  const dash = casts.find((c) => c.m === m && c.id === "w2_finDash");
  const hint = dash ? skFirstClamOnLine(dash.x, dash.y, dash.dirX, dash.dirY, dash.length) : null;
  for (const s of skClams()) s.skHint = s === hint;
}, 40);

// 줄 위의 첫 열린 조개 (가장 가까운 것)
function skFirstClamOnLine(x, y, dx, dy, len) {
  let best = null, bt = 1e9;
  for (const s of skClams()) {
    if (s.shutT > 0) continue;
    const ox = s.x - x, oy = s.y - y, t = ox * dx + oy * dy, perp = Math.abs(-ox * dy + oy * dx);
    if (t < 0.3 || t > len + 0.3 || perp > SK.clamR + 0.55) continue;
    if (t < bt) { bt = t; best = s; }
  }
  return best;
}
// 벽까지 거리 (보스 몸이 닿는 곳)
function skWallDist(x, y, dx, dy) {
  let t = 0;
  while (t < 30 && !hitsWall(x + dx * (t + 0.25), y + dy * (t + 0.25), 0.7)) t += 0.25;
  return Math.max(1, t);
}
// 돌진 줄은 늘 벽까지 (따라오는 동안 길이도 다시 재요)
hookOn("abilitiesUpdated", () => {
  for (const c of casts) if (c.id === "w2_finDash" && c.m && c.m.type === SK_BOSS.type) c.length = skWallDist(c.x, c.y, c.dirX, c.dirY);
}, 50);

// ----- 행동: 물속(지느러미) -> 돌진, 아니면 보통 보스 -----
EXTRA_BEHAVIORS.w2_skShark = (m, p, dist, dt) => {
  if (m.skDash) { skDashStep(m, dt); return; }
  if (m.skFin) {
    m.hidden = true;
    if (m.state === "cast") { m.moving = false; return; }
    const F = m.skFin, c = skArenaC();
    F.t += dt;
    // 아레나 둘레를 빙글 (시계 방향)
    const a = Math.atan2(m.y - c.y, m.x - c.x) + (SK.finSpeed / SK.finR) * dt;
    const tx = c.x + Math.cos(a) * SK.finR, ty = c.y + Math.sin(a) * SK.finR;
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1, step = Math.min(d, SK.finSpeed * 1.4 * dt);
    moveEntity(m, dx / d * step, dy / d * step);
    m.faceX = -Math.sin(a); m.faceY = Math.cos(a); m.moving = true;
    if (Math.random() < dt * 10) addSparkle(m.x, m.y, 0.05, { vz: 0.8, gravity: -0.2, life: 0.5, size: 0.4, hue: 190 });
    if (F.t >= F.T && p && p.hp > 0) castAbility(m, "w2_finDash", p);
    return;
  }
  EXTRA_BEHAVIORS.bossAI(m, p, dist, dt);
};

function skSurface(m, msg) {
  m.skFin = null; m.hidden = false; m.state = "chase"; m.moving = false;
  addRing(m.x, m.y, { speed: 4, life: 0.4, hue: 190 }); spawnDust(m.x, m.y);
  if (msg) addFloatText(m.x, m.y, msg, "#9fe6ff", 20);
}

// 돌진 한 화면씩 (방장 기기)
function skDashStep(m, dt) {
  const D = m.skDash;
  D.t += dt;
  const k = Math.min(1, D.t / D.T);
  const x0 = m.x, y0 = m.y;
  m.x = D.sx + (D.ex - D.sx) * k; m.y = D.sy + (D.ey - D.sy) * k;
  m.moving = true; m.hidden = true;
  if (Math.random() < 0.6) addSparkle(m.x, m.y, 0.1, { vz: 1.2, gravity: -0.3, life: 0.5, size: 0.5, hue: 190 });
  // 부딪힌 주인공 (한 번만, 구르면 피해요)
  for (const p of allPlayers()) {
    if (p.hp <= 0 || D.hit.includes(p.pid || 0)) continue;
    if (Math.hypot(p.x - m.x, p.y - m.y) > 0.95) continue;
    D.hit.push(p.pid || 0);
    if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); continue; }
    hurtPlayer(p, D.dmg, { x: x0, y: y0 });
    const px = -D.dy, py = D.dx, side = (p.x - m.x) * px + (p.y - m.y) * py >= 0 ? 1 : -1;
    moveEntity(p, px * side * 1.4, py * side * 1.4);
  }
  if (k < 1) return;
  m.skDash = null;
  const clam = D.clam >= 0 ? skClams().find((s) => s.skIdx === D.clam) : null;
  if (clam && clam.shutT <= 0) {
    // 꽉! 조개에 물렸어요
    clam.shutT = SK.reopen[Math.min(2, m.phaseIdx || 0)]; clam.skHold = true;
    m.x = clam.x; m.y = clam.y;
    skSurface(m, null);
    m.stagger = SK.caught * skStagK(); m.queue = []; m.gap = 0.6;
    m.skCaughtN = (m.skCaughtN || 0) + 1;
    addFloatText(m.x, m.y + 0.3, "꽉! 비틀!", "#ff9ad6", 28);
    addRing(clam.x, clam.y, { speed: 5, life: 0.45, hue: 320 });
    game.shake = Math.max(game.shake, 0.5);
    if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
    showMessage("샤키가 조개에 물렸어요! 지금 마구 때려요", 2, false, "#ff9ad6");
    return;
  }
  // 벽에 쿵 (3단계면 한 번 더)
  game.shake = Math.max(game.shake, 0.3); spawnDust(m.x, m.y);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
  if (m.skFin && m.skFin.dashes > 1) {
    m.skFin.dashes--;
    const p = nearestPlayer(m.x, m.y);
    if (p && p.hp > 0) { addFloatText(m.x, m.y, "한 번 더!", "#ffb070", 20); castAbility(m, "w2_finDash", p); return; }
  }
  skSurface(m, "풍덩!");
  m.stagger = SK.wallDaze * skStagK(); m.gap = Math.max(m.gap || 0, 1.0);
}

// ----- 새 효과 -----
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect, m = c.m;
  if (!e.type.startsWith("w2_sk")) return false;
  if (e.type === "w2_skDive") {
    const ph = m.phaseIdx || 0;
    m.skFin = { t: 0, T: SK.finTime[skDiff()] || 2.6, dashes: ph >= 2 ? 2 : 1 };
    m.hidden = true;
    addRing(m.x, m.y, { speed: 4, life: 0.4, hue: 190 }); spawnDust(m.x, m.y);
    addFloatText(m.x, m.y, "쏙!", "#9fe6ff", 22);
    return true;
  }
  if (e.type === "w2_skDash") {
    const len = skWallDist(c.x, c.y, c.dirX, c.dirY);
    const clam = skFirstClamOnLine(c.x, c.y, c.dirX, c.dirY, len);
    let ex = c.x + c.dirX * len, ey = c.y + c.dirY * len;
    if (clam) { ex = clam.x; ey = clam.y; }
    const dist = Math.hypot(ex - c.x, ey - c.y);
    m.skDash = { sx: m.x, sy: m.y, ex, ey, dx: c.dirX, dy: c.dirY, t: 0, T: Math.max(0.15, dist / SK.dashSpeed), clam: clam ? clam.skIdx : -1, hit: [], dmg: abilityDamage(c) };
    return true;
  }
  if (e.type === "w2_skPups") {
    const alive = monsters.filter((o) => o.skPup && o.hp > 0).length, n = Math.min(e.count, SK.pupMax - alive);
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(m.y - world.H / 2, m.x - world.W / 2) + Math.PI + (i - (n - 1) / 2) * 0.9, r = world.W / 2 - 3.2;
      const spot = findFreeSpot(world.W / 2 + Math.cos(a) * r, world.H / 2 + Math.sin(a) * r, 0.35, 3) || { x: world.W / 2, y: world.H / 2 };
      const s = createMonster("w2_sharkling", spot.x, spot.y, m.level || game.mapLevel);
      s.aggro = true; s.appearTimer = 0.6; s.summoned = true; s.skPup = true; monsters.push(s);
      addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 200 });
    }
    if (n > 0) showMessage("꼬마 상어가 왔어요!", 1.6, false, "#9fe6ff");
    return true;
  }
  return false;
}, 15);

// 물속에선 맞지 않아요 (bossA 의 "무적!" 대신 알기 쉬운 말)
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (!m || m.type !== SK_BOSS.type || !(m.skFin || m.skDash)) return false;
  if (!h.opts.dot && game.time - (m.skTxtT || -9) > 0.7) { m.skTxtT = game.time; addFloatText(m.x, m.y, "물속이에요! 조개로!", "#9fe6ff", 16); }
  return true;
}, 19);
// 꼬마 상어도 지나가다 열린 조개에 닿으면 꽉
hookOn("dungeonTick", () => {
  const b = w2BossNow();
  if (!b || b.type !== SK_BOSS.type) return;
  for (const s of skClams()) {
    if (s.shutT > 0) continue;
    const q = monsters.find((o) => o.skPup && o.hp > 0 && !(o.stunTimer > 0) && Math.hypot(o.x - s.x, o.y - s.y) < 0.6);
    if (!q) continue;
    s.shutT = 4; q.x = s.x; q.y = s.y; q.stunTimer = 2.5;
    damageMonster(q, q.maxHp * 0.5, s.x, s.y - 1, false, 0, { dot: true });
    addFloatText(s.x, s.y, "꽉!", "#ff9ad6", 20);
  }
}, 43);

// 지느러미·조개 빛 (어둑한 암초에서도 잘 보여요)
hookOn("lights", (lights) => {
  if (!w2BossNow()) return;
  for (const o of monsters) {
    if (o.hp <= 0) continue;
    if (o.type === SK_BOSS.type && (o.skFin || o.skDash)) lights.push({ x: o.x, y: o.y, radius: 1.8, power: 0.6 });
    if (o.type === "w2_bigClamTrap") lights.push({ x: o.x, y: o.y, radius: o.skHint ? 2.0 : 1.2, power: o.skHint ? 0.8 : 0.35 });
  }
}, 60);

// 금색 안내 고리 (줄 위의 조개) — 예고 장판 위에
hookOn("drawTelegraphsAfter", () => {
  for (const o of monsters) {
    if (o.type !== "w2_bigClamTrap" || o.hp <= 0 || !o.skHint) continue;
    const pts = [], r = SK.clamR + 0.25 + 0.06 * Math.sin(game.time * 8);
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push(toScreen(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r, 0.03)); }
    ctx.save(); ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 4 * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
}, 55);
hookOn("drawMonsterOver", (o) => {
  if (o.type !== "w2_bigClamTrap" || !o.skHint) return;
  const s = toScreen(o.x, o.y, 1.6 + Math.sin(game.time * 6) * 0.1); text("꽉!", s.x, s.y, 18 * ZOOM, "#ffd23f", "center");
}, 50);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 상어 대장 샤키: 회청색 몸, 흰 배, 빨간 두건, 큰 눈, 둥근 흰 이빨. 물속이면 등지느러미 + 물결만
  w2_sharky(m) {
    const a = bossMotion(m), P = [];
    if (m.skFin || m.skDash) {
      const sw = Math.sin(game.time * 6) * 0.02;
      P.push([0, 0, 0, 0.5, 0.36, 0.02, "#cfeef6"]);
      P.push([-0.02, sw, 0.0, 0.2, 0.06, 0.16, "#5f7588"], [-0.05, sw, 0.14, 0.12, 0.05, 0.1, "#5f7588"], [-0.08, sw, 0.22, 0.06, 0.04, 0.06, "#6f8598"]);
      P.push([-0.08, sw, 0.27, 0.07, 0.045, 0.03, "#e04a4a"]); // 지느러미 끝 빨간 리본 (샤키라는 단서)
      drawVoxelParts(m, P, { top: 0.4 });
      return;
    }
    const sq = a.stag ? 0.9 : 1, open = a.anim === "slam" ? a.k * 0.08 : 0, tail = Math.sin(game.time * 5) * 0.05 + (a.anim === "crouch" ? a.k * 0.12 : 0);
    const body = "#7f95a8", belly = "#eef4f8";
    P.push([0.02, 0, 0.08, 0.62, 0.36, 0.28 * sq, body]);
    P.push([0.04, 0, 0.06, 0.52, 0.3, 0.06, belly]);
    P.push([0.32, 0, 0.1 + open, 0.2, 0.32, 0.2 * sq, body]);           // 머리 (위턱)
    P.push([0.34, 0, 0.06, 0.18, 0.28, 0.05, belly]);                   // 아래턱
    for (const s of [-0.09, 0, 0.09]) P.push([0.43, s, 0.1, 0.035, 0.05, 0.045, "#ffffff"]); // 둥근 이빨 (뾰족하지 않게)
    P.push([-0.04, 0, 0.36 * sq, 0.16, 0.05, 0.16, body]);              // 등지느러미
    P.push([-0.36, tail, 0.12, 0.14, 0.08, 0.16, body], [-0.46, tail * 1.4, 0.06, 0.07, 0.2, 0.28, body]); // 꼬리
    P.push([0.06, 0.2, 0.08, 0.14, 0.1, 0.04, body], [0.06, -0.2, 0.08, 0.14, 0.1, 0.04, body]);         // 가슴지느러미
    eyes(P, 0.42, 0.1, 0.22 + open, 0.08, "#1a2a3a", a.stag);
    // 빨간 두건 + 매듭
    P.push([0.3, 0, 0.3 * sq + open, 0.22, 0.34, 0.06, "#e04a4a"], [0.18, 0, 0.32 * sq + open, 0.06, 0.06, 0.06, "#e04a4a"], [0.14, 0.04, 0.3 * sq + open, 0.06, 0.08, 0.04, "#c03a3a"]);
    for (const s of [-0.1, 0.1]) P.push([0.31, s, 0.36 * sq + open, 0.04, 0.04, 0.02, "#ffffff"]); // 두건 흰 점
    drawVoxelParts(m, P, { top: 0.75 });
  },
  // 덫 조개: 열리면 분홍 속살 + 진주, 닫히면 꽉 다문 껍데기
  w2_skClam(m) {
    const shut = m.shutT > 0, R = SK.clamR;
    const base = m.skHint ? "#c8a040" : "#8a7aa8", top = m.skHint ? "#ffd23f" : "#a898c8";
    drawBox(m.x - R, m.y - R * 0.8, 0, R * 2, R * 1.6, 0.18, base);
    if (shut) {
      const wob = m.skHold ? Math.sin(game.time * 22) * 0.03 : 0;
      drawBox(m.x - R, m.y - R * 0.8, 0.18, R * 2, R * 1.6, 0.24 + wob, top);
      for (let i = -2; i <= 2; i++) drawBox(m.x + i * R * 0.35 - 0.04, m.y + R * 0.8 - 0.02, 0.2, 0.08, 0.04, 0.2, base);
    } else {
      drawBox(m.x - R * 0.85, m.y - R * 0.65, 0.18, R * 1.7, R * 1.3, 0.03, "#ffb0c8");
      drawBox(m.x - 0.12, m.y - 0.12, 0.21, 0.24, 0.24, 0.2, "#fffaf0");
      drawBox(m.x - R, m.y - R * 0.95, 0.18, R * 2, 0.14, 1.0, top); // 뒤 껍데기 (열려서 서 있어요)
      for (let i = -2; i <= 2; i++) drawBox(m.x + i * R * 0.35 - 0.04, m.y - R * 0.8, 1.15, 0.08, 0.06, 0.06, base);
    }
  },
});

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_finDive: { text: "조개를 사이에 두고 서요!", do: true, voice: true },
  w2_finDash: { text: "줄 옆으로! 금색 조개가 막아줘요", do: true },
  w2_chomp: { text: "원 밖으로! 그다음 공격" },
  w2_tailWhip: { text: "꼬리 쪽은 위험!" },
  w2_bubbleVolley: { text: "옆으로 돌아요!" },
  w2_pupCall: { text: "꼬마 상어도 조개로!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.sharkreef = { 1: "꼬마 상어가 와요! 조개는 천천히 열려요", 2: "돌진이 두 번 와요! 조개를 두 번 써요" };
