// ===== 월드 2 깊은 바다 보스 (설계서 docs/design/world2-ocean.md 5장) =====
// 보스 1 소라왕 뿌뿌 (햇살 산호초): 물살 길 - 피하다가, 마지막엔 보스를 물살에 태워 산호 바위에 쿵!
// 보스 2 대왕조개 반짝이 (다시마 숲): 꿀꺽 들이마실 때 입을 두 번 맞히면 진주 핵이 드러나요. 3단계엔 진주가 굴러다녀요
// 틀은 bosses_a.js 와 같아요 (bossAI: 단계마다 정해진 순서, 큰 공격 뒤 비틀거림, staggerAfter·followUp)

Object.assign(MATERIALS, {
  w2_shellPiece: { name: "소라 껍데기 조각", color: "#ffd0b0" },
  w2_bigPearl: { name: "큰 진주", color: "#fffaf0" },
});

// ----- 보스방 소품 -----
Object.assign(MONSTERS, {
  w2_coralRock: { name: "산호 바위", color: "#ff8f7a", shape: "rock", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true },
  w2_kelpArm: { color: "#3f8a4a", name: "다시마 손", shape: "w2_kelpArm", behavior: "b2_tentacle", hp: 6, speed: 0, damage: 1.3, xp: 3, emerald: 0.2, abilities: ["slam"], world: 2 },
  w2_pearlCore: { name: "진주 핵", color: "#fffaf0", shape: "w2_pearl", behavior: "w2_pearlRoll", hp: 9999, speed: 2.2, damage: 0, xp: 0, emerald: 0, heavy: true, world: 2 },
});
Object.assign(BEHAVIOR_DOCS, {
  w2_pearlRoll: { name: "굴러다니는 진주", desc: "조개에서 튀어나와 벽에 튕기며 굴러다녀요. 때리면 그 두 배가 조개에게 가요.", counter: "진주를 쫓아가 때리기" },
});
EXTRA_BEHAVIORS.w2_pearlRoll = (m, p, dist, dt) => {
  m.rollT = (m.rollT || 0) - dt;
  const own = m.owner;
  if (m.rollT <= 0 && own) {
    // 조개에게 돌아가요
    const dx = own.x - m.x, dy = own.y - m.y, d = Math.hypot(dx, dy) || 1;
    moveEntity(m, dx / d * 3 * dt, dy / d * 3 * dt);
    if (d < own.r + 0.3) { m.hp = 0; m.silent = true; own.pearlOut = false; own.stagger = 0; addFloatText(own.x, own.y, "진주가 돌아갔어요", "#fffaf0", 16); }
    return;
  }
  if (m.vx === undefined) { const a = Math.random() * Math.PI * 2; m.vx = Math.cos(a); m.vy = Math.sin(a); }
  const sp = m.def.speed, x0 = m.x, y0 = m.y;
  moveEntity(m, m.vx * sp * dt, 0); if (Math.abs(m.x - x0) < Math.abs(m.vx * sp * dt) * 0.3) m.vx = -m.vx;
  moveEntity(m, 0, m.vy * sp * dt); if (Math.abs(m.y - y0) < Math.abs(m.vy * sp * dt) * 0.3) m.vy = -m.vy;
  m.moving = true;
};

// ----- 기술 -----
Object.assign(ABILITIES, {
  // 보스 1
  w2_currentLanes: { name: "물살 길", desc: "바닥 물길이 반짝이다가 세찬 물살이 흘러요. 물살은 아프지 않지만 밀려요.",
    counter: "반짝이는 물길에서 나와요. 화난 소라왕은 물길로 데려가면 쿵!", tags: ["boss", "current"],
    telegraph: { shape: "none", at: "self", time: 0.8 }, cooldown: 10, range: [0, 30], damageMul: 0, anim: "roar",
    effect: { type: "w2_flow", lanes: 1, warn: 1.4, on: 5, push: 2.4 } },
  w2_clawSlam: { name: "집게 쾅", desc: "큰 집게를 들었다가 앞을 쾅! 친 뒤 집게가 땅에 박혀요.", counter: "빨간 원 밖으로, 집게가 박혔을 때 공격!",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.2, at: "front", offset: 1.7, time: 1.25 },
    cooldown: 6, range: [0, 3.6], damageMul: 2.2, anim: "slam", staggerAfter: 2.2, effect: { type: "knockback", force: 1.6 } },
  w2_shellRain: { name: "조개 비", desc: "조개껍데기가 여러 군데 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.2 },
    cooldown: 9, range: [0, 12], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 3.4, stagger: 0.18 } },
  w2_shellCharge: { name: "소라 굴러가기", desc: "껍데기에 쏙 들어가 빨간 길로 굴러와요. 바위에 부딪히면 어지러워요.",
    counter: "빨간 길 옆으로! 멈추면 때려요", tags: ["boss", "line", "move", "stagger"],
    telegraph: { shape: "line", length: 7, width: 1.2, at: "self", time: 1.0 },
    cooldown: 7, range: [2, 7], damageMul: 1.6, anim: "crouch", staggerAfter: 2.0, effect: { type: "charge", speed: 10, stunOnWall: 1.6 } },
  // 보스 2
  w2_clamInhale: { name: "꿀꺽 들이마시기", desc: "입을 크게 벌리고 물을 빨아들여요. 주변이 조개 쪽으로 끌려가요.",
    counter: "입을 두 번 맞히면 켁! 진주가 보여요. 끌려가면 바로 굴러요", tags: ["boss", "pull", "core"],
    telegraph: { shape: "circle", radius: 5.5, at: "self", time: 1.6, harmlessPreview: true }, cooldown: 8, range: [0, 12], damageMul: 0, anim: "roar",
    followUp: "w2_clamChomp", effect: { type: "pull", force: 3 } },
  w2_clamChomp: { name: "조개 앙!", desc: "끌어온 다음 껍데기를 앙! 닫아요.", counter: "원에 끌려왔으면 원 밖으로 굴러요",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 1.8, at: "front", offset: 1.2, time: 1.2 },
    cooldown: 4, range: [0, 4], damageMul: 2.0, anim: "slam", staggerAfter: 1.6, effect: { type: "knockback", force: 1.4 } },
  w2_pearlVolley: { name: "진주 탄막", desc: "진주 다섯 알을 부채처럼 쏴요.", counter: "부채꼴 옆으로 돌거나 진주 사이로",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 6, angle: 0.9, at: "self", time: 0.8, harmlessPreview: true },
    cooldown: 6, range: [2, 9], damageMul: 0.8, anim: "point", effect: { type: "volley", count: 5, spread: 0.9, speed: 6, color: "#fffaf0" } },
  w2_kelpSprouts: { name: "다시마 손", desc: "바닥에서 다시마 손이 솟아 내려쳐요.", counter: "다시마 손을 먼저 끊어요",
    tags: ["boss", "summon"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.1 },
    cooldown: 13, range: [0, 30], damageMul: 0, anim: "raise", effect: { type: "summon", monster: "w2_kelpArm", count: 2 } },
  w2_bubbleRing: { name: "거품 고리", desc: "조개 둘레로 거품 고리가 퍼져요. 조개 바로 옆은 안전해요.", counter: "조개 옆 금색 안으로 파고들어요",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 5, inner: 1.8, at: "self", time: 1.1 },
    cooldown: 8, range: [0, 6], damageMul: 1.4, anim: "slam", effect: { type: "knockback", force: 1.0 } },
});

// ----- 보스 목록 -----
const BOSS_C_LIST = [
  { mapId: "shallows", type: "w2_soraKing", name: "뿌뿌", title: "소라왕", shape: "w2_soraKing", color: "#ffd0b0",
    size: 2.8, r: 1.0, hp: 200, damage: 1.6, speed: 0.9,
    material: { id: "w2_shellPiece", name: "소라 껍데기 조각", color: "#ffd0b0" },
    arena: { size: 24, theme: { floor: "#d8c89a", moss: "#ff8f7a", wall: "#3f8f9a", darkness: 0.2, bg: "#0a3a4a" }, build: (w) => { w.w2Lanes = w2LaneRects(w); } },
    phases: [
      { until: 0.66, gap: 1.8, pattern: ["w2_clawSlam", "w2_currentLanes", "w2_shellRain", "w2_clawSlam"] },
      { until: 0.33, gap: 1.5, pattern: ["w2_currentLanes", "w2_shellCharge", "w2_clawSlam", "nova", "w2_shellCharge"] },
      { until: 0, gap: 1.4, pattern: ["w2_currentLanes", "w2_clawSlam", "w2_shellRain", "w2_currentLanes", "w2_shellCharge"] },
    ] },
  { mapId: "kelp", type: "w2_bigClam", name: "반짝이", title: "대왕조개", shape: "w2_bigClam", color: "#c8a8ff",
    size: 3.0, r: 1.1, hp: 205, damage: 1.7, speed: 0.5,
    material: { id: "w2_bigPearl", name: "큰 진주", color: "#fffaf0" },
    arena: { size: 24, theme: { floor: "#6f8f6a", moss: "#3f8a4a", wall: "#3a5a52", darkness: 0.35, bg: "#06201a" } },
    phases: [
      { until: 0.66, gap: 1.8, pattern: ["w2_pearlVolley", "w2_clamInhale", "w2_pearlVolley", "w2_clamInhale"] },
      { until: 0.33, gap: 1.6, pattern: ["w2_kelpSprouts", "w2_clamInhale", "w2_bubbleRing", "w2_pearlVolley"] },
      { until: 0, gap: 1.4, pattern: ["w2_clamInhale", "w2_bubbleRing", "w2_kelpSprouts", "w2_clamInhale", "w2_pearlVolley"] },
    ] },
];
for (const B of BOSS_C_LIST) {
  MONSTERS[B.type] = { name: B.name, shape: B.shape, behavior: "bossAI", color: B.color, hp: B.hp, speed: B.speed, damage: B.damage,
    xp: 45, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: B.size, world: 2 };
  const phases = B.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS[B.mapId] = {
    id: B.type, name: B.name, title: B.title, size: B.size, material: B.material, arena: B.arena, phases, world: 2,
    create(x, y, level) {
      const m = createMonster(B.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[B.mapId];
      m.name = `${B.title} ${B.name}`;
      m.r = B.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.onPhase = (idx) => w2BossPhase(m, B.mapId, idx);
      return m;
    },
  };
}
function w2Diff() { return (game.profile && game.profile.difficulty) || "normal"; }
function w2StagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[w2Diff()] || 1; }

function w2BossPhase(m, mapId, idx) {
  if (mapId === "shallows" && idx === 2) { m.flowable = true; showMessage("소라왕이 가벼워졌어요! 빛나는 물길로 데려가요", 3, false, "#ffe27a"); }
  if (mapId === "kelp" && idx === 2) showMessage("이제 입을 맞히면 진주가 튀어나와요! 진주를 쫓아요", 3, false, "#fffaf0");
}

// ===== 보스 1: 물살 길 =====
// 세로 띠 3줄 (가운데·왼쪽·오른쪽, 너비 3칸). 물살은 아래(남쪽) 벽 쪽으로 흘러요. 그 끝 벽 앞에 산호 바위
function w2LaneRects(w) {
  const c = w.W / 2, R = w.W / 2 - 2;
  return [[c - 1.5, c + 1.5], [c - 7, c - 4], [c + 4, c + 7]].map(([x0, x1]) => ({ x0, x1, y0: c - R, y1: c + R, dy: 1 }));
}
function w2InLane(l, x, y) { return x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1; }
hookOn("dungeonTick", (dt) => {
  const m = w2BossNow();
  if (!m) return;
  // 첫 프레임: 산호 바위 (물살 끝 벽 앞)
  if (m.type === "w2_soraKing" && !m.w2Init) {
    m.w2Init = true;
    for (const l of world.w2Lanes || []) {
      const x = (l.x0 + l.x1) / 2;
      let y = world.H / 2 + 6; for (let k = 0; k < 8 && !hitsWall(x, y + 1.2, 0.5); k++) y += 0.5;
      spawnProp("w2_coralRock", x, y, m);
    }
  }
  const F = m.w2Flow;
  if (!F) return;
  F.t += dt;
  if (F.t < F.warn) return;
  if (F.t > F.warn + F.on) { m.w2Flow = null; return; }
  for (const p of allPlayers()) {
    if (p.hp <= 0) continue;
    for (const l of F.lanes) if (w2InLane(l, p.x, p.y)) moveEntity(p, 0, l.dy * F.push * (p.rollTimer > 0 ? 0.3 : 1) * dt);
  }
  // 화난 소라왕은 물살에 떠내려가요 -> 막히면 쿵! 비틀
  const lane = m.flowable && m.hp > 0 && !F.bonked ? F.lanes.find((l) => w2InLane(l, m.x, m.y)) : null;
  if (lane) {
    // 물길에 들어간 소라왕은 물살에 붙잡혀 걸어 나오지 못하고 떠내려가요 (주인공이 옆으로 빠지면 보스만 쿵!)
    m.x = Math.max(lane.x0 + 0.4, Math.min(lane.x1 - 0.4, m.x));
    m.stunTimer = Math.max(m.stunTimer || 0, 0.12); m.moving = false; // 걸어서 거슬러 오지 못해요
    if (!F.carryMsg) { F.carryMsg = true; addFloatText(m.x, m.y, "으악 떠내려가!", "#9fe6ff", 20); }
    const y0 = m.y, want = F.push * 1.6 * dt;
    moveEntity(m, 0, want);
    F.stuck = Math.abs(m.y - y0) < want * 0.3 ? (F.stuck || 0) + dt : 0;
    F.carried = (F.carried || 0) + Math.abs(m.y - y0);
    if (F.stuck > 0.25 && F.carried > 1) {
      F.bonked = true;
      casts = casts.filter((c) => c.m !== m); m.charge = null; m.state = "chase"; m.queue = [];
      m.stagger = 2.8 * w2StagK();
      addFloatText(m.x, m.y, "쿵! 비틀!", "#ffe27a", 26); game.shake = 0.5; if (typeof sfx !== "undefined") sfx.slam();
    }
  }
}, 40);

// ===== 보스 2: 입 맞히기 · 껍데기 · 진주 =====
const W2_MOUTH_HITS = { easy: 1, normal: 2, hard: 3, nightmare: 3 };
const W2_CORE_OPEN = { easy: 4.5, normal: 3.5, hard: 3, nightmare: 2.5 };
const W2_PEARL_T = { easy: 8, normal: 6, hard: 5, nightmare: 4.5 };
hookOn("monsterDamage", (h) => {
  const m = h.m;
  // 진주 핵: 맞은 만큼 두 배가 조개에게
  if (m.type === "w2_pearlCore") {
    if (m.owner && m.owner.hp > 0 && !h.opts.w2Pass) damageMonster(m.owner, h.dmg * 2, h.fromX, h.fromY, h.legendary, 0, { ...h.opts, w2Pass: true });
    if (!h.opts.dot) addFloatText(m.x, m.y, "진주! x2", "#fffaf0", 18);
    return true;
  }
  if (m.type !== "w2_bigClam") return false;
  if (h.opts.w2Pass) return false; // 진주로 온 피해는 그대로
  const inhale = casts.find((c) => c.m === m && c.id === "w2_clamInhale");
  if (inhale && !h.opts.dot) {
    // 0.15초 안의 여러 타는 한 번으로 (연타를 요구하지 않아요)
    if (game.time - (m.mouthLastT || -9) > 0.15) {
      m.mouthLastT = game.time;
      m.mouthHit = (m.mouthHit || 0) + 1;
      const need = W2_MOUTH_HITS[w2Diff()] || 2;
      addFloatText(m.x, m.y + 0.3, `입! ${Math.min(need, m.mouthHit)}/${need}`, "#ffe27a", 22);
      if (m.mouthHit >= need) w2ClamCough(m);
    }
  }
  if (m.coreOpenT > 0) { h.dmg *= 2; if (!h.opts.dot && Math.random() < 0.3) addFloatText(m.x, m.y + 0.4, "진주! x2", "#fffaf0", 18); }
  else {
    h.dmg *= 0.3;
    if (!h.opts.dot && game.time - (m.hardTextT || -9) > 0.6) { m.hardTextT = game.time; addFloatText(m.x, m.y + 0.3, "딱딱!", "#bbbbbb", 16); }
  }
  return false;
}, 25);
function w2ClamCough(m) {
  m.mouthHit = 0;
  casts = casts.filter((c) => c.m !== m); m.queue = []; m.state = "chase";
  addFloatText(m.x, m.y, "켁!", "#ffffff", 30); game.shake = 0.35; if (typeof sfx !== "undefined") sfx.slam();
  if (m.phaseIdx >= 2) {
    // 3단계: 진주가 튀어나와 굴러다녀요 (조개는 그동안 꼼짝 못 해요)
    const t = W2_PEARL_T[w2Diff()] || 6;
    const pr = spawnProp("w2_pearlCore", m.x + m.faceX * 1.8, m.y + m.faceY * 1.8, m);
    pr.r = 0.4; pr.rollT = t; pr.immovable = true; pr.aggro = true;
    m.pearlOut = true; m.stagger = t + 2; m.coreOpenT = 0;
    showMessage("진주가 튀어나왔어요! 진주를 쫓아 때려요", 2.5, false, "#fffaf0");
  } else {
    m.coreOpenT = m.stagger = W2_CORE_OPEN[w2Diff()] || 3.5;
    showMessage("켁! 진주가 보여요! 지금 마구 때려요", 2.2, false, "#fffaf0");
  }
}
hookOn("dungeonTick", (dt) => {
  for (const m of monsters) {
    if (m.type !== "w2_bigClam") continue;
    if (m.coreOpenT > 0) m.coreOpenT -= dt;
    if (!casts.some((c) => c.m === m && c.id === "w2_clamInhale")) m.mouthHit = 0;
  }
}, 41);
// 조개 앙! 뒤에는 끌려간 아이에게도 작은 기회 (핵이 잠깐 보여요)
hookOn("castResolved", (c) => { if (c.id === "w2_clamChomp" && c.m.hp > 0) c.m.coreOpenT = 1.6 * w2StagK(); }, 30);

// ===== 새 효과: w2_flow (물살 길 켜기) =====
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect;
  if (e.type !== "w2_flow") return false;
  const m = c.m, lanes = world.w2Lanes || [];
  if (!lanes.length) return true;
  const d = w2Diff();
  let n = m.phaseIdx >= 1 && d !== "easy" ? 2 : 1;
  let pick;
  if (m.phaseIdx >= 2) {
    // 화난 보스: 주인공이 있거나 가장 가까운 길 (보스도 따라 들어와요)
    const near = lanes.slice().sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - p.x) - Math.abs((b.x0 + b.x1) / 2 - p.x));
    pick = near.slice(0, n);
    // 보스를 그 길로 데려가요
    const l = pick[0]; m.w2LaneGoal = (l.x0 + l.x1) / 2;
  } else {
    // 보스가 서 있지 않은 길
    pick = lanes.filter((l) => !w2InLane(l, m.x, m.y)).sort(() => Math.random() - 0.5).slice(0, n);
  }
  const k = { easy: 1.5, normal: 1, hard: 0.9, nightmare: 0.8 }[d] || 1;
  m.w2Flow = { lanes: pick, t: 0, warn: e.warn * k, on: e.on, push: e.push };
  if (typeof sfx !== "undefined") sfx.splash && sfx.splash();
  return true;
}, 15);
// 화난 소라왕은 물길 경고 동안 그 물길 쪽으로 걸어가요 (주인공이 옆으로 빠지면 보스만 떠내려가요)
hookOn("dungeonTick", (dt) => {
  const m = w2BossNow();
  if (!m || m.type !== "w2_soraKing" || !m.flowable || !m.w2Flow || m.stagger > 0 || m.hp <= 0) return;
  if (m.w2LaneGoal !== undefined && m.w2Flow.t < m.w2Flow.warn + 0.5) {
    const dx = m.w2LaneGoal - m.x;
    if (Math.abs(dx) > 0.3) { moveEntity(m, Math.sign(dx) * 3 * dt, 0); m.moving = true; }
  }
}, 42);

// 물살 길 그림 (예고 장판 위에)
hookOn("drawTelegraphsAfter", () => {
  const m = w2BossNow();
  if (!m || !m.w2Flow) return;
  const F = m.w2Flow, warn = F.t < F.warn;
  const blink = warn ? Math.floor(F.t / 0.25) % 2 === 0 : true;
  for (const l of F.lanes) {
    fillPoly([toScreen(l.x0, l.y0, 0.02), toScreen(l.x1, l.y0, 0.02), toScreen(l.x1, l.y1, 0.02), toScreen(l.x0, l.y1, 0.02)], warn ? (blink ? "rgba(255,240,150,0.32)" : "rgba(160,230,255,0.25)") : "rgba(140,220,255,0.28)");
    const x = (l.x0 + l.x1) / 2, len = l.y1 - l.y0, n = 7;
    ctx.save(); ctx.strokeStyle = warn ? (blink ? "#fff6a0" : "#ffffff") : "rgba(230,250,255,0.85)"; ctx.lineWidth = 4 * ZOOM; ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const t = ((i / n + (warn ? 0 : game.time * 0.5)) % 1), y = l.y0 + t * len;
      const tip = toScreen(x, y + 0.4, 0.03), a = toScreen(x - 0.8, y - 0.2, 0.03), b = toScreen(x + 0.8, y - 0.2, 0.03);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
    if (!warn && Math.random() < 0.4) addSparkle(l.x0 + Math.random() * (l.x1 - l.x0), l.y0 + Math.random() * len, 0.1, { vy: 2.4, vz: 0.3, life: 0.6, size: 0.45, hue: 190 });
  }
  // 3단계: 보스가 들어간 길 위에 금색 화살표 (좋은 일이 일어날 곳)
  if (m.flowable && warn) { const s = toScreen(m.x, m.y, 2.4); text("↓", s.x, s.y, 30 * ZOOM, "#ffd23f", "center"); }
}, 50);

// ===== 모양 =====
Object.assign(EXTRA_SHAPES, {
  // 소라왕: 등에 커다란 소라 껍데기 + 주황 얼굴 + 큰 집게
  w2_soraKing(m) {
    const a = bossMotion(m), P = [];
    const lift = m.flowable ? 0.04 : 0, sq = a.stag ? 0.88 : 1;
    for (const [f, s] of [[0.1, 0.16], [0.1, -0.16], [-0.08, 0.18], [-0.08, -0.18]]) P.push([f + a.walk * 0.04, s, 0, 0.07, 0.07, 0.08, "#e0603a"]);
    P.push([0.1, 0, 0.06, 0.24, 0.3, 0.16 * sq, "#ff6a4a"]);
    // 소라 껍데기 3단 (위로 갈수록 작게)
    P.push([-0.08, 0, 0.12 + lift, 0.4, 0.38, 0.18, "#ffd0b0"], [-0.1, 0.02, 0.3 + lift, 0.32, 0.3, 0.14, "#ffc0a0"], [-0.12, 0.03, 0.44 + lift, 0.22, 0.2, 0.12, "#ffd0b0"], [-0.13, 0.04, 0.56 + lift, 0.12, 0.12, 0.08, "#ffc0a0"]);
    P.push([-0.08, 0.19, 0.2 + lift, 0.3, 0.02, 0.04, "#ff9a8a"], [-0.1, 0.16, 0.36 + lift, 0.22, 0.02, 0.04, "#ff9a8a"]);
    // 눈자루 + 큰 눈
    P.push([0.2, 0.07, 0.22, 0.03, 0.03, 0.08, "#e0603a"], [0.2, -0.07, 0.22, 0.03, 0.03, 0.08, "#e0603a"]);
    eyes(P, 0.215, 0.07, 0.3, 0.07, "#2a1a10", a.stag);
    // 집게 (오른쪽 큰 것, 박히면 땅에)
    const up = a.raise * 0.25, down = a.stag ? -0.06 : 0;
    P.push([0.3, 0.2, 0.1 + up + down, 0.2, 0.16, 0.16, "#ff6a4a"], [0.42, 0.22, 0.12 + up + down, 0.12, 0.1, 0.1, "#e04a2a"]);
    P.push([0.28, -0.18, 0.1, 0.12, 0.1, 0.1, "#ff6a4a"]);
    drawVoxelParts(m, P, { top: 0.75 });
  },
  // 대왕조개: 위·아래 껍데기 + 틈 사이 큰 눈 + 진주 핵
  w2_bigClam(m) {
    const a = bossMotion(m), P = [];
    const inhale = m.state === "cast" && m.castAnim === "roar";
    const open = m.coreOpenT > 0 ? 0.16 : inhale ? 0.09 * a.k : m.pearlOut ? 0.01 : 0.025;
    P.push([0, 0, 0, 0.52, 0.56, 0.12, "#ffb8d8"]);
    for (let i = -2; i <= 2; i++) P.push([0.25, i * 0.11, 0.1, 0.04, 0.09, 0.03 + (i % 2 ? 0.02 : 0), "#ffb8d8"]);
    if (!m.pearlOut && open > 0.03) P.push([0.05, 0, 0.12, 0.18, 0.18, open * 0.9, m.coreOpenT > 0 ? "#ffffff" : "#fffaf0"]); // 열릴 때만 진주가 보여요
    P.push([0, 0, 0.12 + open, 0.52, 0.56, 0.12, "#c8a8ff"]);
    for (let i = -2; i <= 2; i++) P.push([0.25, i * 0.11, 0.2 + open, 0.04, 0.09, 0.03 + (i % 2 ? 0.02 : 0), "#c8a8ff"]);
    eyes(P, 0.27, 0.1, 0.13 + open * 0.4, 0.06, "#2a1a3a", a.stag && !m.coreOpenT);
    P.push([-0.15, 0.1, 0.24 + open, 0.03, 0.03, 0.22, "#3f8a4a"], [-0.1, -0.12, 0.24 + open, 0.03, 0.03, 0.17, "#4fa05a"]);
    drawVoxelParts(m, P, { top: 0.5 });
    if (m.coreOpenT > 0) { const s = toScreen(m.x, m.y, 0.6); ctx.save(); ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 40 * ZOOM); g.addColorStop(0, "rgba(255,250,240,0.6)"); g.addColorStop(1, "rgba(255,250,240,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, 40 * ZOOM, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  },
  w2_kelpArm(m) {
    const P = b2Pose(m), up = 0.3 + P.cast * 0.6 - P.strike * 0.4, parts = [];
    for (let i = 0; i < 5; i++) parts.push({ f: Math.sin(game.time * 2 + i) * 0.06 * i + P.strike * i * 0.1, s: 0, z: i * 0.3 * (0.6 + up), w: 0.24 - i * 0.03, d: 0.24 - i * 0.03, h: 0.32, c: i % 2 ? "#4fa05a" : "#3f8a4a" });
    b2DrawBody(m, parts);
  },
  w2_pearl(m) {
    const s = toScreen(m.x, m.y, 0.35), r = 14 * ZOOM;
    ctx.save();
    const g = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.3, 2, s.x, s.y, r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.7, "#fff2e0"); g.addColorStop(1, "#d8c8b8");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  },
});
// 진주는 빛나요
hookOn("lights", (lights) => { for (const m of monsters) if ((m.type === "w2_pearlCore" || (m.type === "w2_bigClam" && m.coreOpenT > 0)) && m.hp > 0) lights.push({ x: m.x, y: m.y, radius: 2.2, power: 0.8 }); }, 61);
