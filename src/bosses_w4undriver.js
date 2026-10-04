// ===== 월드 4 보스 5: 도롱뇽 첨벙이 (undriver) — 설계서 docs/design/world4-underworld.md 5-5 =====
// 새 아이디어: 첨벙이가 물방울 공을 뱉어요. 공에 닿으면 아프지만 칼로 치면(가까이서 공격하면) 되돌아가 첨벙이가 3초 비틀!
//   활·마법을 멀리서 쏘면 공이 터지기만 해요 ("칼로 쳐요!"). 직업 상관없이: 공 1.8칸 안에서 친 공격은 되받기예요.
// 아레나: 가운데 동그란 연못 + 둘레 물살 띠 4개 (시계 방향, 3단계엔 거꾸로). 물살은 이 파일이 밀어요 (보스방 안에서만)
// 같이 하기: 공은 소품 몬스터(위치·되돌아감 칸)라 친구 화면에 그대로 가요. 계산은 방장만.

// ----- 월드 4 보스 5~8 공용 도우미 (네 파일이 같은 것을 가져요. 먼저 읽힌 파일 것을 써요: 읽는 순서가 바뀌어도 괜찮게) -----
var W4E = (typeof W4E === "object" && W4E) || {};
if (!W4E.make) Object.assign(W4E, {
  stagK: () => (typeof W4 !== "undefined" ? W4.stagK() : 1),
  // 부르는 몬스터: 월드 4 몬스터가 아직 없거나 임시(under.js)면 비슷한 것으로
  mon: (id, fb) => (MONSTERS[id] && !MONSTERS[id].w4Placeholder ? id : fb),
  // 계산: 방장의 지금 보스 (보스방 + 탑 보스 층) / 그림: 친구 기기도 몬스터 목록에서
  boss(type) { const b = typeof w4BossNow === "function" ? w4BossNow() : null; return b && b.type === type && b.hp > 0 ? b : null; },
  seen: (type) => monsters.find((o) => o.type === type && o.hp > 0) || null,
  props: (type) => monsters.filter((o) => o.type === type && o.hp > 0),
  guest: () => typeof netGuest === "function" && netGuest(),
  calm(b, gap = 1.0) { casts = casts.filter((c) => c.m !== b); b.charge = null; b.state = "chase"; b.queue = []; b.gap = Math.max(b.gap || 0, gap); },
  stun(b, t, frac, text, color = "#ffe27a") {
    W4E.calm(b, 0.5);
    if (frac) damageMonster(b, b.maxHp * frac, b.x, b.y, false, 0, { w4Prop: true });
    b.stagger = Math.max(b.stagger || 0, t * W4E.stagK());
    addFloatText(b.x, b.y, text, color, 26);
    game.shake = Math.max(game.shake, 0.45);
    if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
  },
  ring(x, y, r, color, w = 2.5, z = 0.03) {
    const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push(toScreen(x + Math.cos(t) * r, y + Math.sin(t) * r, z)); }
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
  },
  disc(x, y, r, fill, z = 0.02) {
    const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push(toScreen(x + Math.cos(t) * r, y + Math.sin(t) * r, z)); }
    ctx.save(); ctx.fillStyle = fill; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fill(); ctx.restore();
  },
  // 기술 하나를 복사해 이름만 바꿔요 (없으면 대신 정의)
  copy(id, over, fallback) { const a = ABILITIES[id] || fallback; return { ...a, ...over, telegraph: { ...a.telegraph, ...(over.telegraph || {}) }, effect: { ...a.effect, ...(over.effect || {}) } }; },
  make(o) {
    MONSTERS[o.type] = { name: o.name, shape: o.type, behavior: "bossAI", color: o.color, hp: o.hp, speed: o.speed, damage: o.damage,
      xp: 70, emerald: 1, emeraldCount: 16, heavy: true, isBoss: true, size: o.size, world: 4 };
    const phases = o.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
    BOSS_DEFS[o.mapId] = {
      id: o.type, name: o.name, title: o.title, size: o.size, world: 4, material: o.material,
      arena: { size: o.arena, theme: o.theme, build: o.build }, phases,
      create(x, y, level) {
        const m = createMonster(o.type, x, y, level);
        m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[o.mapId];
        m.name = `${o.title} ${o.name}`;
        m.r = o.r; m.level = level; m.aggro = true; m.appearTimer = 1;
        m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
        m.onPhase = (idx) => o.onPhase && o.onPhase(m, idx);
        return m;
      },
    };
  },
});

const AX = { type: "w4_axolotl", ball: "w4_bubbleBall", speed: 3, back: 7, r: 0.6, life: 7, reach: 1.8, stun: 3, frac: 0.03,
  pondR: 3.2, band: 4.6, bandW: 1.3, push: 1.6, second: 0.8 };

// ----- 부품·전설 (8-3) -----
Object.assign(MATERIALS, { w4_axGill: { name: "첨벙이 아가미 깃", color: "#ff9ab0" } });
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") { // 시험 도구(tools/lib.mjs)는 loot.js 없이 읽어요
  defBase("L_axolotl", { slot: "bow", legend: "undriver", name: "첨벙 물방울 활", type: "triple", minL: 0, color: "#ff9ab0", mul: 1.06, desc: "물방울 화살 3발 (공격력 +6%)" });
  BOSS_LEGENDS.undriver = "L_axolotl";
}

// ----- 소품: 물방울 공 -----
MONSTERS[AX.ball] = { name: "물방울 공", color: "#9fe6ff", shape: AX.ball, behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, floaty: true, world: 4, codexSkip: true };
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push(AX.ball);
if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add(AX.ball);

// ----- 기술 -----
Object.assign(ABILITIES, {
  w4_axBall: { name: "물방울 공", desc: "입에 물방울을 부풀렸다가 퉤! 느린 공이 굴러와요. 칼로 치면 첨벙이에게 되돌아가요.", counter: "공을 칼로 쳐서 되돌려요! 멀리서 쏘면 터지기만 해요",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.0, at: "self", time: 1.2 }, cooldown: 6, range: [0, 14], damageMul: 0, anim: "raise",
    effect: { type: "w4_axSpit", count: 1 } },
  w4_axBall2: { name: "물방울 공 둘", desc: "물방울 공을 두 개 연달아 뱉어요.", counter: "하나씩 칼로 되돌려요",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.0, at: "self", time: 1.2 }, cooldown: 7, range: [0, 14], damageMul: 0, anim: "raise",
    effect: { type: "w4_axSpit", count: 2 } },
  w4_axSplash: { name: "꼬리 철썩", desc: "꼬리로 앞을 철썩! 그 뒤 숨을 골라요.", counter: "빨간 부채꼴 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "cone", length: 3.5, angle: 1.4, at: "self", time: 1.1 }, cooldown: 5, range: [0, 3.5], damageMul: 1.8, anim: "slam",
    staggerAfter: 1.6, effect: { type: "knockback", force: 1.2 } },
  w4_axRing: W4E.copy("w2_bubbleRing", { name: "물방울 고리", desc: "첨벙이 둘레로 물방울 고리가 퍼져요. 바로 옆은 안전해요.", counter: "첨벙이 바로 옆으로 파고들거나 멀리!" },
    { tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 5, inner: 1.8, at: "self", time: 1.1 }, cooldown: 8, range: [0, 6], damageMul: 1.4, anim: "slam", effect: { type: "knockback", force: 1.0 } }),
});

W4E.make({ mapId: "undriver", type: AX.type, name: "첨벙이", title: "도롱뇽", color: "#ff9ab0", size: 3.0, r: 1.0, hp: 230, damage: 2.4, speed: 1.1, arena: 26,
  material: { id: "w4_axGill", name: "첨벙이 아가미 깃", color: "#ff9ab0" },
  theme: { floor: "#4a5a5e", moss: "#5fb8c8", wall: "#2e3a3e", darkness: 0.4, bg: "#04100e" },
  build(w) { w4Env(w); },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_axBall", "w4_axSplash", "w4_axBall"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_axBall2", "w4_axSplash", "w4_axRing", "w4_axBall"] },
    { until: 0, gap: 1.4, pattern: ["w4_axBall2", "w4_axRing", "w4_axSplash", "w4_axBall2"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) showMessage("물방울 공이 두 개! 하나씩 칼로 되돌려요", 2.6, false, "#9fe6ff");
    if (idx === 2) showMessage("물살이 거꾸로! 공이 물살을 타고 휘어요", 3, false, "#9fe6ff");
  } });

// ----- 연못 물살 띠 (아레나 가운데 c 기준, 시계 방향 고리. 3단계엔 거꾸로) -----
function axBands(b) {
  const c = world.W / 2, R = AX.band, W = AX.bandW, k = b && b.phaseIdx >= 2 ? -1 : 1;
  return [
    { x0: c - R, y0: c - R, x1: c + R, y1: c - R + W, dx: k, dy: 0 },
    { x0: c + R - W, y0: c - R, x1: c + R, y1: c + R, dx: 0, dy: k },
    { x0: c - R, y0: c + R - W, x1: c + R, y1: c + R, dx: -k, dy: 0 },
    { x0: c - R, y0: c - R, x1: c - R + W, y1: c + R, dx: 0, dy: -k },
  ];
}
function axInBand(q, x, y) { return x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1; }
hookOn("playersUpdated", (dt) => {
  const b = W4E.boss(AX.type);
  if (!b) return;
  dt = dt || 1 / 60;
  const bands = axBands(b);
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    const q = bands.find((s) => axInBand(s, p.x, p.y));
    if (!q) continue;
    const k = p.rollTimer > 0 ? 0.3 : 1;
    moveEntity(p, q.dx * AX.push * k * dt, q.dy * AX.push * k * dt);
  }
}, 96); // 같이 하기: netplay 가 친구 자리를 적어 둔 뒤(95)에 밀어야 친구 기기도 밀려요

// ----- 물방울 공 -----
function axBalls() { return W4E.props(AX.ball); }
function axSpit(b, p) {
  const t = p || nearestPlayer(b.x, b.y);
  const dx = (t ? t.x : b.x + b.faceX) - b.x, dy = (t ? t.y : b.y + b.faceY) - b.y, d = Math.hypot(dx, dy) || 1;
  const s = createMonster(AX.ball, b.x + dx / d * (b.r + 0.4), b.y + dy / d * (b.r + 0.4), b.level || game.mapLevel || 1);
  s.aggro = true; s.appearTimer = 0; s.owner = b; s.immovable = true; s.r = AX.r;
  s.axVX = dx / d * AX.speed; s.axVY = dy / d * AX.speed; s.axLife = AX.life; s.axBack = false;
  s.axDmg = b.damage * 1.3 * (typeof abilityTuning === "function" ? abilityTuning().damage : 1);
  monsters.push(s);
  addFloatText(b.x, b.y, "퉤!", "#9fe6ff", 20);
  if (typeof sfx !== "undefined" && sfx.bowShot) sfx.bowShot();
}
function axPop(s, text) {
  s.hp = 0;
  spawnBurst(s.x, s.y, ["#9fe6ff", "#ffffff"], 10);
  if (text) addFloatText(s.x, s.y, text, "#9fe6ff", 18);
}
hookOn("resolveCast", (c, p) => {
  if (c.ab.effect.type !== "w4_axSpit") return false;
  const b = c.m; if (!b || b.hp <= 0) return true;
  axSpit(b, p);
  if (c.ab.effect.count > 1) b.axNextT = AX.second; // 두 번째 공은 0.8초 뒤
  return true;
}, 15);
// 공을 치면: 가까이서 친 거면 되돌아가요, 멀리서 맞히면 퐁 터져요
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== AX.ball) return false;
  if (h.opts.dot || s.axBack || s.hp <= 0) return true;
  const by = h.opts.by && h.opts.by.maxHp ? h.opts.by : nearestPlayer(s.x, s.y);
  if (!by || Math.hypot(by.x - s.x, by.y - s.y) > AX.reach + (s.r || 0)) { axPop(s, "칼로 쳐요!"); return true; }
  const b = W4E.seen(AX.type);
  s.axBack = true; s.axLife = AX.life;
  const tx = b ? b.x : s.x + (s.x - by.x), ty = b ? b.y : s.y + (s.y - by.y), dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1;
  s.axVX = dx / d * AX.back; s.axVY = dy / d * AX.back;
  addFloatText(s.x, s.y, "퐁! 되돌아가요", "#ffe27a", 20);
  addRing(s.x, s.y, { speed: 4, life: 0.3, gold: true });
  return true;
}, 4);
hookOn("dungeonTick", (dt) => {
  const b = W4E.boss(AX.type);
  // 두 번째 공
  if (b && b.axNextT > 0) { b.axNextT -= dt; if (b.axNextT <= 0) { b.axNextT = 0; if (!(b.stagger > 0)) axSpit(b, null); } }
  const bands = b && b.phaseIdx >= 2 ? axBands(b) : null;
  for (const s of axBalls()) {
    s.axLife -= dt;
    if (s.axLife <= 0 || !b) { axPop(s); continue; }
    if (s.axBack) { // 첨벙이 쪽으로 휘어요
      const dx = b.x - s.x, dy = b.y - s.y, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(s.axVX, s.axVY) || AX.back;
      s.axVX += (dx / d * sp - s.axVX) * Math.min(1, dt * 6); s.axVY += (dy / d * sp - s.axVY) * Math.min(1, dt * 6);
    }
    let vx = s.axVX, vy = s.axVY;
    if (bands) { const q = bands.find((z) => axInBand(z, s.x, s.y)); if (q) { vx += q.dx * AX.push; vy += q.dy * AX.push; } } // 3단계: 물살에 실려 휘어요
    const nx = s.x + vx * dt, ny = s.y + vy * dt;
    if (hitsWall(nx, ny, 0.3)) { axPop(s); continue; }
    s.x = nx; s.y = ny;
    if (s.axBack) {
      if (Math.hypot(b.x - s.x, b.y - s.y) < b.r + s.r) {
        axPop(s);
        if (b.invuln > 0) continue;
        W4E.stun(b, AX.stun, AX.frac, "첨벙! 비틀비틀", "#9fe6ff");
      }
      continue;
    }
    for (const p of allPlayers()) {
      if (!p || p.hp <= 0 || Math.hypot(p.x - s.x, p.y - s.y) > s.r + (p.r || 0.35) * 0.8) continue;
      if (p.rollTimer > 0) continue;
      hurtPlayer(p, s.axDmg || 1, s);
      axPop(s, "첨벙!");
      break;
    }
  }
}, 40);
// 단계가 바뀌면 남은 공은 터져요
hookOn("dungeonTick", () => { const b = W4E.boss(AX.type); if (b && b.invuln > 2) for (const s of axBalls()) axPop(s); }, 41);

// ----- 그리기: 연못·물살·징검다리 -----
hookOn("drawFloor", () => {
  const b = W4E.seen(AX.type);
  if (!b || game.scene !== "dungeon") return;
  const c = world.W / 2;
  W4E.disc(c, c, AX.pondR, "rgba(60,150,190,0.55)");
  W4E.ring(c, c, AX.pondR, "rgba(180,240,255,0.7)", 2);
  for (const [ox, oy] of [[-1.6, 0.4], [0.2, -1.4], [1.5, 0.8], [-0.2, 1.7]]) W4E.disc(c + ox, c + oy, 0.45, "rgba(150,140,128,0.9)", 0.04);
  ctx.save(); ctx.strokeStyle = "rgba(220,250,255,0.75)"; ctx.lineWidth = 3 * ZOOM; ctx.lineCap = "round";
  for (const q of axBands(b)) {
    fillPoly([toScreen(q.x0, q.y0, 0.01), toScreen(q.x1, q.y0, 0.01), toScreen(q.x1, q.y1, 0.01), toScreen(q.x0, q.y1, 0.01)], "rgba(150,230,255,0.16)");
    const len = q.dx ? q.x1 - q.x0 : q.y1 - q.y0, n = Math.max(3, Math.round(len / 2));
    for (let i = 0; i < n; i++) {
      const t = (i / n + game.time * 0.35) % 1;
      const x = q.dx ? (q.dx > 0 ? q.x0 + t * len : q.x1 - t * len) : (q.x0 + q.x1) / 2;
      const y = q.dy ? (q.dy > 0 ? q.y0 + t * len : q.y1 - t * len) : (q.y0 + q.y1) / 2;
      const tip = toScreen(x + q.dx * 0.3, y + q.dy * 0.3, 0.02), l = toScreen(x - q.dx * 0.1 - q.dy * 0.3, y - q.dy * 0.1 + q.dx * 0.3, 0.02), r = toScreen(x - q.dx * 0.1 + q.dy * 0.3, y - q.dy * 0.1 - q.dx * 0.3, 0.02);
      ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(r.x, r.y); ctx.stroke();
    }
  }
  ctx.restore();
}, 50);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 도롱뇽 첨벙이: 분홍 몸, 머리 양옆 깃털 아가미 3개씩, 웃는 입. 공을 뱉기 전엔 볼이 부풀어요
  w4_axolotl(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, up = a.raise * 0.08, pink = "#ff9ab0", dk = "#e07890", gill = "#ff5a8a";
    const puff = m.state === "cast" && casts.some((c) => c.m === m && String(c.id).startsWith("w4_axBall")) ? 0.05 : 0;
    for (const sd of [1, -1]) { P.push([0.14 + a.walk * sd * 0.04, sd * 0.2, 0, 0.1, 0.09, 0.08, dk]); P.push([-0.16 - a.walk * sd * 0.04, sd * 0.2, 0, 0.1, 0.09, 0.08, dk]); }
    P.push([-0.02, 0, 0.06, 0.5, 0.36, 0.24 * sq, pink]);
    P.push([0.04, 0, 0.06, 0.4, 0.28, 0.04, "#ffd0dc"]);
    const tw = Math.sin(a.t * 4) * 0.06;
    P.push([-0.32, tw, 0.1, 0.14, 0.06, 0.12, dk], [-0.44, tw * 2, 0.12, 0.12, 0.04, 0.14, pink]);
    P.push([0.26, 0, 0.18 + up, 0.28, 0.36 + puff * 2, 0.24 * sq, pink]);
    for (const sd of [1, -1]) for (let i = 0; i < 3; i++) P.push([0.2 - i * 0.06, sd * (0.2 + puff), 0.3 + up + i * 0.06, 0.05, 0.12, 0.04, gill]);
    eyes(P, 0.405, 0.1, 0.32 + up, 0.05, "#1a1020", a.stag);
    P.push([0.41, 0, 0.23 + up, 0.02, 0.16, 0.025, "#7a2a4a"]); // 웃는 입
    drawVoxelParts(m, P, { top: 0.6 });
  },
  w4_bubbleBall(m) {
    const s = toScreen(m.x, m.y, 0.45 + Math.sin(game.time * 6 + m.x) * 0.04), r = (m.r || AX.r) * TILE_W * 0.42;
    ctx.save();
    ctx.fillStyle = m.axBack ? "rgba(255,226,122,0.55)" : "rgba(150,225,255,0.55)"; ctx.strokeStyle = m.axBack ? "#ffe27a" : "#e6fbff"; ctx.lineWidth = 2 * ZOOM;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.arc(s.x - r * 0.35, s.y - r * 0.35, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
});

// ----- 안내 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_axBall: { text: "물방울 공! 칼로 쳐서 되돌려요", do: true, voice: true },
  w4_axBall2: { text: "공 둘! 하나씩 칼로", do: true },
  w4_axSplash: { text: "부채꼴 밖으로! 숨 고를 때 공격" },
  w4_axRing: { text: "바로 옆으로 파고들어요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.undriver = { 0: "물방울 공을 칼로 쳐서 되돌려요!", 1: "공이 두 개! 하나씩", 2: "물살이 거꾸로! 공이 휘어요" };
if (typeof BEHAVIOR_DOCS !== "undefined" && !BEHAVIOR_DOCS.prop) BEHAVIOR_DOCS.prop = "움직이지 않는 소품";
