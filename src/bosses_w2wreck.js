// ===== 월드 2 보스 3: 뽀글 선장 (가라앉은 배 무덤 `wreck`) — 설계서 docs/design/world2-ocean.md 5-3 =====
// 새 아이디어 하나: 부하에게 순서가 있어요
//   1 조개 짐꾼 (노란 ! + 선장까지 점선): 선장에게 닿으면 거품 보호막 -> 먼저 잡아요
//   2 나팔 새우 (주황 테두리): 함성으로 선원을 세게 -> 그다음
//   3 꼬마 복어: 잡지 말고 피하기
// 닻 쿵! = 바닥 전체가 울려요. 금색 거품 기둥 위에 서면 둥실(w2Floating) 떠서 안 아파요 (ocean_env.js)
// 돛대 2개: 데굴데굴 복어가 부딪히면 오래 어지러워요
// 틀은 bosses_c.js 와 같아요 (bossAI, m.bossA, staggerAfter)

Object.assign(MATERIALS, { w2_anchorBadge: { name: "금 닻 배지", color: "#ffd23f" } });

const WK = {
  hp: 190, size: 2.7, r: 1.0,
  shieldK: { easy: 0.05, normal: 0.08, hard: 0.09, nightmare: 0.1 },
  shieldT: 12,
  porterSpeed: { easy: 0.9, normal: 1.1, hard: 1.15, nightmare: 1.2 },
  mastStagger: 2.2,
  masts: [[-4, -4], [3, 3]],          // 타일 칸 (가운데 기준): 칸 가운데가 c-3.5, c+3.5
  vents: [[6.5, 0], [-6.5, 0], [0, 6.5], [0, -6.5]],
};
function wkDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function wkStagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[wkDiff()] || 1; }
// 널빤지 3곳 (서·북·남): 선원이 올라오는 곳. 들어오는 문(동)은 비워요
function wkPlanks(w = world) { const c = w.W / 2, R = w.W / 2 - 3; return [{ x: c - R, y: c, dx: -1, dy: 0 }, { x: c, y: c - R, dx: 0, dy: -1 }, { x: c, y: c + R, dx: 0, dy: 1 }]; }
function wkBoss() { const kh = game.keyhunt; const b = kh && kh.inBoss && kh.boss; return b && b.type === "w2_captain" ? b : null; }

// ----- 부하 -----
Object.assign(MONSTERS, {
  w2_porter: { name: "조개 짐꾼", shape: "human", behavior: "wk_porter", world: 2,
    hp: 2.4, speed: 1.1, damage: 0, xp: 3, emerald: 0.3, armsForward: true,
    look: { skin: "#ffc8a0", hair: "#5a3a22", shirt: "#e8eef8", pants: "#2f5fb0", eyes: "#1a1a1a", helmet: "#2f5fb0" } },
  w2_trumpet: { name: "나팔 새우", shape: "w2_shrimp", behavior: "support", world: 2,
    hp: 3, speed: 1.4, damage: 0.8, xp: 4, emerald: 0.4, abilities: ["rallyCry"], color: "#ffa04a", eyes: "#1a1a1a" },
});
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push("w2_porter"); // (tools/lib.mjs 는 이 파일을 mobs_extra 보다 먼저 읽어요)
BEHAVIOR_DOCS.wk_porter = { name: "짐 나르기", desc: "보스에게 걸어가 닿으면 보스에게 보호막을 줘요.", counter: "노란 ! 짐꾼을 보스에게 닿기 전에 잡기" };
EXTRA_BEHAVIORS.wk_porter = (m, p, dist, dt) => {
  const boss = monsters.find((o) => o.type === "w2_captain" && o.hp > 0);
  if (!boss) { m.moving = false; return; }
  const d = Math.hypot(boss.x - m.x, boss.y - m.y) || 1;
  if (d < boss.r + 0.6) {
    const add = boss.maxHp * (WK.shieldK[wkDiff()] || 0.08);
    boss.shieldHp = (boss.shieldHp || 0) + add; boss.shieldMax = boss.shieldHp; boss.shieldT = WK.shieldT;
    addFloatText(boss.x, boss.y, "+보호막", "#8fe0ff", 22);
    showMessage("보호막! 세게 몰아쳐요", 2, false, "#8fe0ff");
    spawnBurst(m.x, m.y, ["#bfeaff", "#ffffff"], 10);
    m.hp = 0; m.silent = true;
    return;
  }
  moveWithSeparation(m, (boss.x - m.x) / d, (boss.y - m.y) / d, dt, WK.porterSpeed[wkDiff()] || 1.1);
  m.moving = true;
  faceToward(m, boss);
};

// ----- 기술 -----
Object.assign(ABILITIES, {
  w2_crewCall: { name: "선원 집합!", desc: "망원경을 들고 외치면 널빤지에서 선원들이 올라와요.", counter: "노란 ! 짐꾼부터 잡아요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "point",
    effect: { type: "w2_crew", crew: [{ w2_porter: 2 }, { w2_porter: 1, w2_trumpet: 1, w2_puffer: 1 }, { w2_porter: 2, w2_trumpet: 1, w2_puffer: 2 }], maxAlive: 6 } },
  w2_puffUp: { name: "빵빵 부풀기", desc: "몸을 빵빵하게 부풀려 가까이 있는 걸 튕겨내요. 그 뒤 피슝~ 바람이 빠져요.", counter: "웅크리면 뒤로! 바람 빠질 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.2, at: "self", time: 1.25 },
    cooldown: 6, range: [0, 2.6], damageMul: 1.4, anim: "crouch", staggerAfter: 1.8, effect: { type: "knockback", force: 2.2 } },
  w2_anchorDrop: { name: "닻 쿵!", desc: "커다란 닻을 갑판에 떨어뜨려 바닥 전체가 울려요.", counter: "금색 거품 기둥 위로! 둥실 떠서 안 아파요",
    tags: ["boss", "ground", "room"], telegraph: { shape: "circle", radius: 16, at: "self", time: 2.8 },
    cooldown: 18, range: [0, 30], damageMul: 1.9, anim: "raise", staggerAfter: 2.4, effect: { type: "w2_groundShock" } },
  w2_cannonRain: { name: "물풍선 대포", desc: "물풍선이 여러 군데 떨어져요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.3 },
    cooldown: 10, range: [0, 14], damageMul: 1.3, anim: "point", effect: { type: "rain", count: 7, spread: 4, stagger: 0.15 } },
  w2_rollingPuff: { name: "데굴데굴 복어", desc: "몸을 말아 넓은 빨간 길로 굴러와요. 돛대에 부딪히면 오래 어지러워요.", counter: "넓은 빨간 길 밖으로!",
    tags: ["boss", "line", "move"], telegraph: { shape: "line", length: 9, width: 2.0, at: "self", time: 1.2 },
    cooldown: 9, range: [2, 9], damageMul: 1.6, anim: "crouch", staggerAfter: 1.9, effect: { type: "charge", speed: 9, stunOnWall: 2.2 } },
});

// ----- 보스 -----
MONSTERS.w2_captain = { name: "뽀글 선장", shape: "w2_captain", behavior: "bossAI", color: "#ffd84a", hp: WK.hp, speed: 1.0, damage: 1.8,
  xp: 45, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: WK.size, world: 2 };
{
  const pats = [
    { until: 0.66, gap: 1.7, pattern: ["w2_crewCall", "w2_puffUp", "volley", "w2_puffUp"] },
    { until: 0.33, gap: 1.5, pattern: ["w2_crewCall", "w2_anchorDrop", "volley", "w2_puffUp"] },
    { until: 0, gap: 1.3, pattern: ["w2_crewCall", "w2_rollingPuff", "w2_cannonRain", "w2_anchorDrop", "w2_puffUp", "w2_rollingPuff"] },
  ];
  const phases = pats.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS.wreck = {
    id: "w2_captain", name: "뽀글", title: "선장", size: WK.size, world: 2, phases,
    material: { id: "w2_anchorBadge", name: "금 닻 배지", color: "#ffd23f" },
    arena: { size: 26, theme: { floor: "#8a6a42", moss: "#5fa8a0", wall: "#4a3e34", darkness: 0.3, bg: "#081a20" },
      build: (w) => {
        b2Pillars(w, WK.masts, 3); // 돛대
        const c = w.W / 2;
        if (typeof w2EnsureEnv === "function") for (const [dx, dy] of WK.vents) w2AddVent(c + dx, c + dy, w); // 거품 기둥 4개 (축 위 6.5칸)
      } },
    create(x, y, level) {
      const m = createMonster("w2_captain", x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS.wreck;
      m.name = "선장 뽀글"; m.r = WK.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.onPhase = (idx) => wkPhase(m, idx);
      return m;
    },
  };
}
function wkPhase(m, idx) {
  if (idx === 1) { m.wkBlink = 1.4; showMessage("거품 기둥 위에선 닻 쿵이 안 아파요!", 3, false, "#ffe27a"); }
  if (idx === 2) showMessage("짐꾼이 양쪽에서 와요! 가까운 짐꾼부터", 3, false, "#ffe27a");
}

// ----- 새 효과: 선원 집합 / 닻 쿵 -----
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect, m = c.m;
  if (e.type === "w2_crew") {
    const tab = e.crew[Math.min(e.crew.length - 1, m.phaseIdx || 0)];
    const easy = wkDiff() === "easy";
    const list = [];
    for (const t of ["w2_porter", "w2_trumpet", "w2_puffer"]) {
      let n = tab[t] || 0;
      if (easy && n > 0) n = Math.max(t === "w2_porter" ? 1 : 0, n - 1);
      for (let i = 0; i < n; i++) list.push(t);
    }
    const alive = monsters.filter((o) => o.wkCrew && o.hp > 0).length;
    list.length = Math.max(0, Math.min(list.length, e.maxAlive - alive));
    // 보스에게서 먼 널빤지부터 (짐꾼이 닿기까지 오래 걸리게)
    const planks = wkPlanks().sort((a, b) => Math.hypot(b.x - m.x, b.y - m.y) - Math.hypot(a.x - m.x, a.y - m.y));
    let porterN = 0, otherN = 0;
    for (const t of list) {
      // 짐꾼이 둘이면 양쪽(먼 널빤지 둘)에서 하나씩, 나머지는 가장 먼 널빤지에서
      const pl = t === "w2_porter" ? planks[Math.min(porterN, planks.length - 1)] : planks[0];
      const k = t === "w2_porter" ? (porterN++, 0) : ++otherN;
      const side = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.9;
      const spot = findFreeSpot(pl.x - pl.dy * side, pl.y + pl.dx * side, 0.35, 2) || { x: pl.x, y: pl.y };
      const s = createMonster(t, spot.x, spot.y, m.level || game.mapLevel);
      s.aggro = true; s.appearTimer = 0.6; s.summoned = true; s.wkCrew = true;
      monsters.push(s);
      addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 45 });
    }
    if (list.length) showMessage(list.includes("w2_porter") ? "선원 집합! 노란 ! 짐꾼부터 잡아요" : "선원 집합!", 2.2, false, "#ffe27a");
    return true;
  }
  if (e.type === "w2_groundShock") {
    addRing(c.x, c.y, { speed: 14, life: 0.5, hue: 40 }); addRing(c.x, c.y, { speed: 9, life: 0.6, hue: 30, delay: 0.1 });
    flashScreen(0.12); game.shake = Math.max(game.shake, 0.5);
    if (typeof sfx !== "undefined" && sfx.boom) sfx.boom();
    const dmg = abilityDamage(c);
    for (const q of allPlayers()) {
      if (q.hp <= 0) continue;
      if (typeof w2Floating === "function" && w2Floating(q)) { addFloatText(q.x, q.y, "둥실! 안전", "#bff6ff", 20); continue; }
      if (q.rollTimer > 0) { addFloatText(q.x, q.y, "회피!", "#9be8ff", 18); continue; }
      hurtPlayer(q, dmg, m);
    }
    return true;
  }
  return false;
}, 15);
// 닻 쿵은 아레나 가운데에서 바닥 전체 (보스가 어디 있어도 같은 원)
hookOn("castStarted", (m, id) => {
  if (id !== "w2_anchorDrop") return;
  for (const c of casts) if (c.m === m && c.id === id) { c.x = world.W / 2; c.y = world.H / 2; c.radius = Math.max(c.radius, world.W / 2); }
}, 50);

// 데굴데굴: 돛대(벽)에 부딪히면 오래 어지러워요 / 금색 깜빡 줄이기
hookOn("dungeonTick", (dt) => {
  const m = wkBoss();
  if (!m) return;
  if (m.wkBlink > 0) m.wkBlink -= dt;
  if (m.charge && m.lastCastId === "w2_rollingPuff") m.wkRoll = true;
  else if (m.wkRoll && !m.charge) {
    m.wkRoll = false;
    if (m.stunTimer > 0 && m.hp > 0) {
      m.stagger = Math.max(m.stagger || 0, WK.mastStagger * wkStagK());
      addFloatText(m.x, m.y, "쿵! 어질어질", "#ffe27a", 24);
    }
  }
}, 43);

// ----- 그리기: 널빤지, 돛, 짐꾼 점선·!, 나팔 새우 테두리, 닻 쿵 때 금색 기둥 -----
hookOn("drawFloor", () => {
  if (!wkBoss()) return;
  for (const pl of wkPlanks()) {
    const px = -pl.dy, py = pl.dx;
    for (let i = -1; i <= 1; i++) {
      const ox = px * i * 0.55, oy = py * i * 0.55;
      const a = { x: pl.x + ox - px * 0.24, y: pl.y + oy - py * 0.24 }, b = { x: pl.x + ox + px * 0.24, y: pl.y + oy + py * 0.24 };
      fillPoly([toScreen(a.x, a.y, 0.015), toScreen(b.x, b.y, 0.015), toScreen(b.x + pl.dx * 2.2, b.y + pl.dy * 2.2, 0.015), toScreen(a.x + pl.dx * 2.2, a.y + pl.dy * 2.2, 0.015)], i ? "#a07a4a" : "#b08a5a");
    }
  }
}, 51);
hookOn("worldThings", (things) => {
  const m = wkBoss();
  if (!m) return;
  const c = Math.floor(world.W / 2);
  for (const [dx, dy] of WK.masts) {
    const x = c + dx + 0.5, y = c + dy + 0.5;
    things.push({ depth: x + y + 0.6, x, y, draw: () => {
      drawBox(x - 0.13, y - 0.13, 0.4, 0.26, 0.26, 2.9, "#7a5532"); // 돛대 기둥
      drawBox(x - 0.9, y - 0.06, 2.9, 1.8, 0.12, 0.12, "#6a4a2a");
      const sw = Math.sin(game.time * 1.5 + x) * 0.04;
      drawBox(x - 0.8, y + 0.14 + sw, 1.45, 1.6, 0.06, 1.4, "#efe6cc");
      drawBox(x - 0.15, y + 0.2 + sw, 2.0, 0.3, 0.04, 0.3, "#2f5fb0");
      drawBox(x - 0.06, y - 0.06, 3.3, 0.12, 0.12, 0.12, "#ffd23f");
    } });
  }
}, 50);
hookOn("drawTelegraphsAfter", () => {
  const m = wkBoss();
  if (!m) return;
  // 짐꾼 -> 선장 점선
  ctx.save(); ctx.setLineDash([7 * ZOOM, 7 * ZOOM]); ctx.lineWidth = 3 * ZOOM; ctx.strokeStyle = "rgba(255,226,90,0.75)";
  for (const o of monsters) {
    if (o.type !== "w2_porter" || o.hp <= 0) continue;
    const a = toScreen(o.x, o.y, 0.05), b = toScreen(m.x, m.y, 0.05);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.restore();
  // 닻 쿵 예고 중이거나 2단계 안내 깜빡: 거품 기둥을 금색으로
  const anchor = casts.some((c) => c.m === m && c.id === "w2_anchorDrop");
  const blink = m.wkBlink > 0 && Math.floor(m.wkBlink / 0.35) % 2 === 0;
  if ((anchor || blink) && world.w2 && world.w2.vents) for (const v of world.w2.vents) {
    const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push(toScreen(v.x + Math.cos(a) * v.r, v.y + Math.sin(a) * v.r, 0.03)); }
    fillPoly(pts, `rgba(255,215,80,${0.35 + 0.2 * Math.sin(game.time * 8)})`);
    ctx.save(); ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 4 * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
    if (anchor) { const s = toScreen(v.x, v.y, 1.6 + Math.sin(game.time * 6) * 0.15); text("↓", s.x, s.y, 26 * ZOOM, "#ffd23f", "center"); }
  }
}, 52);
hookOn("lights", (lights) => {
  if (!wkBoss() || !casts.some((c) => c.id === "w2_anchorDrop")) return;
  for (const v of (world.w2 && world.w2.vents) || []) lights.push({ x: v.x, y: v.y, radius: 1.8, power: 0.9 });
}, 62);
hookOn("drawMonsterUnder", (m) => {
  if (m.type !== "w2_trumpet" || m.hp <= 0) return;
  const c = toScreen(m.x, m.y, 0.02);
  ctx.save(); ctx.strokeStyle = "rgba(255,150,40,0.9)"; ctx.lineWidth = 3 * ZOOM;
  ctx.beginPath(); ctx.ellipse(c.x, c.y, 0.55 * TILE_W * 0.5, 0.55 * TILE_H * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}, 50);
hookOn("drawMonsterOver", (m) => {
  if (m.hp <= 0) return;
  if (m.type === "w2_porter") {
    // 머리 위 진주 조개 + 노란 !
    drawBox(m.x - 0.22, m.y - 0.18, 1.12, 0.44, 0.36, 0.1, "#c8a8ff");
    drawBox(m.x - 0.08, m.y - 0.06, 1.22, 0.16, 0.12, 0.1, "#fffaf0");
    drawBox(m.x - 0.22, m.y - 0.18, 1.3, 0.44, 0.36, 0.08, "#b090f0");
    const s = toScreen(m.x, m.y, 1.9 + Math.sin(game.time * 6) * 0.08);
    text("!", s.x, s.y, 30 * ZOOM, "#ffe23a", "center");
  }
  if (m.type === "w2_trumpet") {
    const f = m.faceX, g = m.faceY;
    drawBox(m.x + f * 0.3 - 0.05, m.y + g * 0.3 - 0.05, 0.36, 0.1, 0.1, 0.1, "#ffd23f");
    drawBox(m.x + f * 0.42 - 0.09, m.y + g * 0.42 - 0.09, 0.34, 0.18, 0.18, 0.14, "#ffd23f");
  }
}, 50);

// ----- 모양: 노란 복어 + 흰 배 + 파란 선장 모자(흰 띠, 금 닻 배지) + 망원경 -----
EXTRA_SHAPES.w2_captain = (m) => {
  const a = bossMotion(m), P = [];
  const id = m.lastCastId;
  const puffing = m.state === "cast" && id === "w2_puffUp";
  const deflate = m.stagger > 0 && id === "w2_puffUp";
  const scale = puffing ? 1 + 0.35 * Math.min(1, a.k * 1.4) : deflate ? 0.9 + 0.04 * Math.sin(game.time * 20) : 1;
  const Y = "#ffd84a", W = "#fff6e0", O = "#ff9a3a", CR = "#fff0c0";
  if (m.charge && id === "w2_rollingPuff") {
    // 동글동글 굴러가요: 줄무늬가 빙글
    const r = game.time * 12;
    P.push([0, 0, 0.06, 0.52, 0.52, 0.5, Y]);
    for (let i = 0; i < 4; i++) { const t = r + i * Math.PI / 2; P.push([Math.cos(t) * 0.27, 0, 0.3 + Math.sin(t) * 0.24, 0.04, 0.5, 0.08, i % 2 ? W : CR]); }
    P.push([0, 0, 0.56, 0.3, 0.3, 0.08, "#2f5fb0"]);
    drawVoxelParts(m, P, { top: 0.7 });
    return;
  }
  const bob = Math.sin(game.time * 2.5) * 0.02 + 0.06;
  P.push([0, 0, bob, 0.5, 0.5, 0.46, Y]);
  P.push([0.255, 0, bob + 0.06, 0.02, 0.38, 0.24, W]);
  P.push([0, 0.27, bob + 0.18, 0.12, 0.04, 0.1, O], [0, -0.27, bob + 0.18, 0.12, 0.04, 0.1, O]);
  P.push([-0.29, 0, bob + 0.16, 0.08, 0.2, 0.16, O]);
  // 크림색 둥근 돌기 (부풀면 길게)
  const sp = puffing ? 0.1 : 0.05;
  for (const [f, s, z] of [[0.1, 0.26, 0.3], [-0.12, 0.26, 0.26], [0.1, -0.26, 0.3], [-0.12, -0.26, 0.26], [-0.26, 0.12, 0.34], [-0.26, -0.12, 0.34]]) P.push([f, s, bob + z, sp, sp, sp, CR]);
  eyes(P, 0.255, 0.11, bob + 0.28, 0.09, "#1a1a1a", a.stag);
  P.push([0.26, 0, bob + 0.12, 0.02, 0.08, 0.04, "#e06a4a"]); // 입
  // 선장 모자
  P.push([0, 0, bob + 0.46, 0.44, 0.44, 0.04, "#2f5fb0"], [-0.02, 0, bob + 0.5, 0.32, 0.32, 0.13, "#2f5fb0"], [-0.02, 0, bob + 0.53, 0.33, 0.33, 0.03, "#ffffff"]);
  P.push([0.15, 0, bob + 0.55, 0.02, 0.07, 0.08, "#ffd23f", true]);
  // 망원경 (선원 부를 때 번쩍 들어요)
  const up = a.anim === "point" ? a.k * 0.18 : 0;
  P.push([0.2, 0.3, bob + 0.24 + up, 0.24, 0.07, 0.07, "#8a5a30"], [0.33, 0.3, bob + 0.24 + up, 0.04, 0.09, 0.09, "#ffd23f"]);
  drawVoxelParts(m, P, { top: 0.8, scale });
};

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_crewCall: { text: "노란 ! 짐꾼부터!", do: true, voice: true },
  w2_puffUp: { text: "뒤로! 바람 빠지면 공격" },
  w2_anchorDrop: { text: "금색 거품 기둥 위로!", do: true, voice: true },
  w2_cannonRain: { text: "원 사이로!" },
  w2_rollingPuff: { text: "넓은 길 밖으로!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.wreck = { 1: "거품 기둥 위에선 닻 쿵이 안 아파요!", 2: "짐꾼이 양쪽에서 와요. 가까운 짐꾼부터!" };
