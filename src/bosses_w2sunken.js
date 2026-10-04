// ===== 월드 2 보스: 잠긴 도시 (sunken) — 문어 박사 먹물이 =====
// 새 아이디어 하나: 두더지 잡기 (파이프)
//   아레나에 커다란 돌 파이프 5개. 문어 박사는 파이프 속에 숨어 있다가(안 보이고 안 맞아요),
//   나올 파이프가 1.2초 먼저 덜컹덜컹 + 거품 + 금색 고리 (단서) -> 쏙 나와서 5초 동안 기술 -> 먹물 펑! 하고 다른 파이프로.
//   나온 지 1.5초 안에 때리면 "깜짝!" 2초 비틀 (나올 파이프를 보고 미리 가 있으면 보상).
//   1단계: 파이프 하나만 덜컹 / 2단계: 나와 있는 동안 다른 파이프에서 다리가 쭉 (빨간 줄) /
//   3단계 비틀기: 파이프 둘이 덜컹, 진짜는 박사 모자가 빼꼼 (가짜는 먹물만 펑, 아프지 않아요)
// 상태는 모두 보스·파이프 몬스터 칸에 둬요 (같이 하기에서 친구 화면에도 보이게)
//   보스: snState("hidden"|"bubble"|"out"), w2InPipe, snBubble, snDecoy, snT, snSurpriseT, snSpots
//   파이프: snIdx (w2_cityPipe 소품)

Object.assign(MATERIALS, { w2_snLens: { name: "박사의 둥근 안경알", color: "#c8e8ff" } });

const SN_TUNE = {
  out: { easy: 6, normal: 5, hard: 4.5, nightmare: 4 },        // 나와 있는 시간
  surprise: { easy: 2.0, normal: 1.5, hard: 1.3, nightmare: 1.1 }, // 깜짝! 창
  surpriseStagger: 2.0,                                          // × 난이도 배수 (w2StagK)
  hide: 0.6,                                                     // 숨은 뒤 다음 파이프가 덜컹이기까지
  bubble: 1.2,                                                   // × 예고 배수 (쉬움 1.8초)
  tentEvery: { easy: 3.6, normal: 2.6, hard: 2.3, nightmare: 2.0 },
};
const SN_PIPES = [[0, 0], [-5, -5], [5, 5], [-5, 5], [5, -5]]; // 가운데 + 대각선 넷 (가운데에서 약 7칸)

function snDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function snTele() { return typeof abilityTuning === "function" ? abilityTuning().telegraph : 1; }
function snBoss() { return monsters.find((o) => o.type === "w2_snOcto" && o.hp > 0) || null; }
function snPipeAt(m, i) { return m.snSpots && m.snSpots[i]; }

// ----- 소품: 돌 파이프 -----
Object.assign(MONSTERS, {
  w2_cityPipe: { name: "옛 도시 파이프", color: "#8a9a9a", shape: "w2_cityPipe", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true, world: 2 },
});

// ----- 기술 -----
Object.assign(ABILITIES, {
  w2_snInkCloud: { name: "먹물 구름", desc: "먹물을 퍽! 떨어진 자리에 끈적한 먹물 웅덩이가 남아요.", counter: "검은 원 밖으로! 웅덩이는 피해서 걸어요",
    tags: ["boss", "area", "slow"], telegraph: { shape: "circle", radius: 1.8, at: "target", time: 1.3 },
    cooldown: 6, range: [0, 30], damageMul: 1.1, anim: "raise", effect: { type: "w2_snInk", life: 5 } },
  w2_snInkShot: { name: "먹물 총알", desc: "먹물 방울 다섯 개를 부채처럼 쏴요.", counter: "부채꼴 옆으로 돌거나 방울 사이로",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 6, angle: 0.9, at: "self", time: 0.9, harmlessPreview: true },
    cooldown: 5, range: [0, 30], damageMul: 0.8, anim: "point", effect: { type: "volley", count: 5, spread: 0.9, speed: 6, color: "#3a2a4a" } },
  w2_snSlam: { name: "다리 철썩", desc: "굵은 다리를 들었다가 앞을 철썩! 내려쳐요. 그 뒤 다리가 아파서 비틀.", counter: "빨간 원 밖으로! 비틀거릴 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.0, at: "front", offset: 1.8, time: 1.2 },
    cooldown: 5, range: [0, 4.5], damageMul: 2.0, anim: "slam", staggerAfter: 1.8, effect: { type: "knockback", force: 1.5 } },
  w2_snOctoCall: { name: "조수 부르기", desc: "먹물 문어 조수 둘을 불러요.", counter: "조수 먹물 원을 피하고 화살로",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w2_octo", count: 2 }, when: { maxSummons: 3 } },
  w2_snPipeTentacle: { name: "파이프 다리", desc: "다른 파이프에서 다리가 쭉 뻗어 나와요.", counter: "파이프에서 나온 빨간 줄 옆으로",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 6.5, width: 1.2, at: "pipe", time: 1.3 }, // at "pipe": 자리는 snTentacle 이 파이프 입구로 정해요 (self 면 매 화면 보스 자리로 돌아가요)
    cooldown: 99, range: [0, 30], damageMul: 1.4, anim: "slam", effect: { type: "knockback", force: 1.2 } },
});

// ----- 보스 -----
const SN_BOSS = { mapId: "sunken", type: "w2_snOcto", name: "먹물이", title: "문어 박사", shape: "w2_snOcto", color: "#c86ab0",
  size: 3.0, r: 1.0, hp: 215, damage: 1.9, speed: 0.6 };
MONSTERS[SN_BOSS.type] = { name: SN_BOSS.name, shape: SN_BOSS.shape, behavior: "w2_snOctoAI", color: SN_BOSS.color, hp: SN_BOSS.hp, speed: SN_BOSS.speed,
  damage: SN_BOSS.damage, xp: 45, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: SN_BOSS.size, world: 2 };
const SN_PHASES = [
  { until: 0.66, gap: 1.7, pattern: ["w2_snInkShot", "w2_snSlam", "w2_snInkCloud"] },
  { until: 0.33, gap: 1.6, pattern: ["w2_snInkCloud", "w2_snOctoCall", "w2_snInkShot", "w2_snSlam"] },
  { until: 0, gap: 1.5, pattern: ["w2_snInkShot", "w2_snInkCloud", "w2_snSlam", "w2_snOctoCall"] },
].map((ph) => ({ ...ph, abilities: [...new Set(ph.pattern)] }));
BOSS_DEFS.sunken = {
  id: SN_BOSS.type, name: SN_BOSS.name, title: SN_BOSS.title, size: SN_BOSS.size, world: 2,
  material: { id: "w2_snLens", name: "박사의 둥근 안경알", color: "#c8e8ff" },
  arena: { size: 28, theme: { floor: "#9a9a8a", moss: "#7fd0b0", wall: "#5a6a6a", darkness: 0.4, bg: "#04121a" },
    build: (w) => b2Pillars(w, [[-3, -7], [3, 7], [-7, 3], [7, -3]], 2) }, // 부서진 돌기둥 4개 (숨을 곳)
  phases: SN_PHASES,
  create(x, y, level) {
    const m = createMonster(SN_BOSS.type, x, y, level);
    m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS.sunken;
    m.name = `${SN_BOSS.title} ${SN_BOSS.name}`;
    m.r = SN_BOSS.r; m.level = level; m.aggro = true; m.appearTimer = 1;
    m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
    m.onPhase = (idx) => snPhase(m, idx);
    return m;
  },
};
BEHAVIOR_DOCS.w2_snOctoAI = { name: "파이프 두더지", desc: "파이프 속에 숨어 있다가 덜컹이는 파이프에서 쏙 나와 기술을 써요. 잠깐 뒤 먹물을 뿜고 다른 파이프로 숨어요.",
  counter: "덜컹이는 파이프 앞에서 기다렸다가, 나오자마자 때리면 깜짝 비틀!" };

function snPhase(m, idx) {
  if (idx === 1) showMessage("다른 파이프에서도 다리가 나와요! 빨간 줄 옆으로", 3, false, "#ffb0e0");
  if (idx === 2) showMessage("파이프 두 개가 덜컹! 모자가 보이는 쪽이 진짜예요", 3, false, "#ffe27a");
}

// 첫 프레임: 파이프 5개 놓기 + 가운데 파이프에 숨기 (create 뒤에 몬스터 목록이 다시 만들어질 수 있어서 여기서)
hookOn("dungeonTick", () => {
  const m = w2BossNow();
  if (!m || m.type !== SN_BOSS.type || m.snInit) return;
  m.snInit = true;
  const c = world.W / 2;
  m.snSpots = SN_PIPES.map(([dx, dy]) => ({ x: c + dx, y: c + dy }));
  m.snSpots.forEach((s, i) => {
    const pp = createMonster("w2_cityPipe", s.x, s.y, m.level || game.mapLevel || 1);
    pp.aggro = true; pp.appearTimer = 0.4; pp.owner = m; pp.immovable = true; pp.r = 0.75; pp.snIdx = i;
    world.solids.push({ x: s.x, y: s.y, r: pp.r, prop: pp });
    monsters.push(pp);
  });
  snHide(m, 0, true);
}, 40);

// 숨기: 그 파이프 속으로 (먹물 펑, 아프지 않아요)
function snHide(m, idx, silent) {
  const s = snPipeAt(m, idx);
  if (!silent) { spawnBurst(m.x, m.y, ["#2a1a3a", "#5a3a6a", "#1a1020"], 16); addFloatText(m.x, m.y, "쏙!", "#d8b0ff", 20); }
  m.x = s.x; m.y = s.y;
  m.hidden = true; m.w2InPipe = idx; m.snState = "hidden"; m.snT = SN_TUNE.hide;
  m.r = 0.05; // 숨었을 땐 그림자도 없어요 (main.js 가 m.r 크기로 그림자를 그려요)
  m.snBubble = -1; m.snDecoy = -1; m.snSurpriseT = 0;
  m.state = "chase"; m.moving = false; m.queue = [];
}
// 다음 파이프 고르기 (지금 파이프 말고, 주인공이 너무 멀지 않은 곳을 더 자주)
function snPickPipe(m, not) {
  const p = nearestPlayer(m.x, m.y) || game.player;
  const cands = m.snSpots.map((s, i) => i).filter((i) => !not.includes(i));
  const w = cands.map((i) => { const s = m.snSpots[i], d = Math.hypot(s.x - p.x, s.y - p.y); return d < 1.8 ? 0.3 : d < 11 ? 2 : 1; });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let k = 0; k < cands.length; k++) { r -= w[k]; if (r <= 0) return cands[k]; }
  return cands[cands.length - 1];
}
// 쏙 나오기: 파이프 앞(주인공 쪽)에 서요
function snPop(m) {
  const idx = m.snBubble, s = snPipeAt(m, idx), p = nearestPlayer(s.x, s.y) || game.player;
  let dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy);
  if (d < 0.1) { dx = world.W / 2 - s.x; dy = world.H / 2 - s.y; d = Math.hypot(dx, dy) || 1; if (d < 0.1) { dx = 1; dy = 0; d = 1; } }
  const spot = findFreeSpot(s.x + dx / d * 1.9, s.y + dy / d * 1.9, 0.6, 2) || { x: s.x + dx / d * 1.9, y: s.y + dy / d * 1.9 };
  // 가짜 파이프: 먹물만 펑 (아프지 않아요)
  if (m.snDecoy >= 0) { const q = snPipeAt(m, m.snDecoy); spawnBurst(q.x, q.y, ["#2a1a3a", "#5a3a6a"], 14); addRing(q.x, q.y, { speed: 3, life: 0.4, hue: 280 }); addFloatText(q.x, q.y, "펑! 가짜", "#d8b0ff", 18); }
  m.x = spot.x; m.y = spot.y; m.faceX = dx / d; m.faceY = dy / d;
  m.hidden = false; m.w2InPipe = idx; m.snState = "out"; m.r = SN_BOSS.r;
  m.snT = SN_TUNE.out[snDiff()] || 5;
  m.snSurpriseT = SN_TUNE.surprise[snDiff()] || 1.5;
  m.snTentT = 1.2; m.gap = Math.max(m.gap || 0, 0.7);
  m.snBubble = -1; m.snDecoy = -1;
  spawnBurst(s.x, s.y, ["#bff6ff", "#e6fbff", "#c86ab0"], 16); addRing(s.x, s.y, { speed: 4, life: 0.4, hue: 190 });
  addFloatText(m.x, m.y, "뿅!", "#ffb0e0", 24);
  if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
}

// 파이프 다리 (2단계부터, 나와 있는 동안): 주인공과 가까운 다른 파이프에서 주인공 쪽으로 빨간 줄
function snTentacle(m) {
  const p = nearestPlayer(m.x, m.y);
  if (!p || p.hp <= 0) return;
  let best = -1, bd = 1e9;
  m.snSpots.forEach((s, i) => { if (i === m.w2InPipe) return; const d = Math.hypot(s.x - p.x, s.y - p.y); if (d > 1.2 && d < bd) { bd = d; best = i; } });
  if (best < 0 || bd > 9) return;
  const s = m.snSpots[best], ab = ABILITIES.w2_snPipeTentacle, tune = abilityTuning();
  const c = makeCast(m, ab, "w2_snPipeTentacle", p, Math.max(0.9, ab.telegraph.time * tune.telegraph), tune);
  const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
  c.x = s.x + dx / d * 0.6; c.y = s.y + dy / d * 0.6; c.dirX = dx / d; c.dirY = dy / d; c.snPipe = best;
  casts.push(c);
}

EXTRA_BEHAVIORS.w2_snOctoAI = (m, p, dist, dt) => {
  if (!m.snSpots) { m.moving = false; return; }
  const def = m.bossDef;
  // 숨어 있는 동안에도 단계는 넘어가요 (체력은 나와 있을 때만 줄지만, 시험·치트로 바뀔 수 있어요)
  if (m.hidden) {
    const frac = m.hp / m.maxHp;
    let idx = def.phases.findIndex((ph) => frac > ph.until); if (idx < 0) idx = def.phases.length - 1;
    if (idx !== m.phaseIdx) { m.phaseIdx = idx; m.patIdx = 0; m.queue = []; onPhaseChange(m, idx); }
    m.moving = false;
    m.snT -= dt;
    if (m.snState === "hidden" && m.snT <= 0) {
      m.snState = "bubble";
      m.snBubble = snPickPipe(m, [m.w2InPipe]);
      m.snDecoy = m.phaseIdx >= 2 ? snPickPipe(m, [m.w2InPipe, m.snBubble]) : -1;
      m.snT = m.snBubbleMax = SN_TUNE.bubble * snTele();
    } else if (m.snState === "bubble" && m.snT <= 0) snPop(m);
    return;
  }
  // 나와 있어요: 보스 기술(bossAI)을 쓰되 자리에서 움직이지 않아요 (파이프 앞)
  if (m.snSurpriseT > 0) m.snSurpriseT -= dt;
  const ax = m.x, ay = m.y;
  if (!(m.state === "cast" || m.charge)) faceToward(m, p);
  EXTRA_BEHAVIORS.bossAI(m, p, dist, dt);
  m.x = ax; m.y = ay; m.moving = false;
  const busy = m.state === "cast" || m.charge || m.stagger > 0 || m.invuln > 0;
  if (!(m.stagger > 0) && !(m.invuln > 0)) m.snT -= dt;
  if (m.phaseIdx >= 1 && !(m.stagger > 0)) { m.snTentT -= dt; if (m.snTentT <= 0) { m.snTentT = (SN_TUNE.tentEvery[snDiff()] || 2.6) * (m.phaseIdx >= 2 ? 1.25 : 1); snTentacle(m); } }
  if (m.snT <= 0 && !busy) snHide(m, m.w2InPipe);
};

// 깜짝! 나온 지 얼마 안 돼서 맞으면 비틀
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (m.type !== SN_BOSS.type || m.hidden || h.opts.dot) return false;
  if (m.snState === "out" && m.snSurpriseT > 0 && !(m.stagger > 0) && !(m.invuln > 0)) {
    m.snSurpriseT = 0;
    casts = casts.filter((c) => c.m !== m || c.id === "w2_snPipeTentacle");
    m.state = "chase"; m.charge = null; m.queue = [];
    m.stagger = SN_TUNE.surpriseStagger * (typeof w2StagK === "function" ? w2StagK() : 1);
    addFloatText(m.x, m.y + 0.4, "깜짝! 비틀!", "#ffe27a", 26); game.shake = Math.max(game.shake, 0.3);
    if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
  }
  return false;
}, 25);

// 먹물 구름: 끈적한 웅덩이 (느려짐, 아프지 않아요)
hookOn("resolveCast", (c, p) => {
  if (c.ab.effect.type !== "w2_snInk") return false;
  const e = c.ab.effect;
  if (p && p.hp > 0 && insideShape(c, p.x, p.y, p.r * 0.6)) {
    if (p.rollTimer > 0) addFloatText(p.x, p.y, "회피!", "#9be8ff", 18);
    else { hurtPlayer(p, abilityDamage(c), c.m); p.abSlow = Math.max(p.abSlow || 0, 1.2); }
  }
  zones.push({ x: c.x, y: c.y, radius: c.radius, life: e.life, max: e.life, tick: 99, tickT: 99, damage: 0, kind: "ink", snInk: true });
  spawnBurst(c.x, c.y, ["#2a1a3a", "#5a3a6a", "#1a1020"], 14);
  addRing(c.x, c.y, { speed: 4, life: 0.35, hue: 280 });
  return true;
}, 15);
hookOn("dungeonTick", () => {
  if (typeof zones === "undefined") return;
  for (const z of zones) if (z.snInk) for (const p of allPlayers()) if (p.hp > 0 && Math.hypot(p.x - z.x, p.y - z.y) < z.radius) p.abSlow = Math.max(p.abSlow || 0, 0.35);
}, 43);

// ----- 그림 -----
// 먹물 웅덩이 (예고 장판 위)
hookOn("drawTelegraphsAfter", () => {
  if (typeof zones === "undefined") return;
  for (const z of zones) {
    if (!z.snInk || !onScreen(z.x, z.y, 4)) continue;
    const a = Math.min(1, z.life / 1.0) * 0.55, pts = [];
    for (let i = 0; i < 18; i++) { const t = i / 18 * Math.PI * 2, r = z.radius * (0.92 + 0.08 * Math.sin(i * 2.3 + z.x)); pts.push(toScreen(z.x + Math.cos(t) * r, z.y + Math.sin(t) * r, 0.02)); }
    fillPoly(pts, `rgba(26,16,36,${a})`);
  }
}, 52);

// 금색 고리: 덜컹이는 파이프 (나올 곳)
hookOn("drawFloor", () => {
  const m = snBoss();
  if (!m || !m.snSpots || m.snState !== "bubble") return;
  for (const i of [m.snBubble, m.snDecoy]) {
    const s = snPipeAt(m, i); if (!s) continue;
    const k = 1 - Math.max(0, m.snT) / (m.snBubbleMax || 1.2), r = 1.3 + 0.9 * (1 - k), pts = [];
    for (let j = 0; j < 24; j++) { const t = j / 24 * Math.PI * 2; pts.push(toScreen(s.x + Math.cos(t) * r, s.y + Math.sin(t) * r, 0.02)); }
    ctx.save(); ctx.strokeStyle = `rgba(255,214,90,${0.5 + 0.5 * k})`; ctx.lineWidth = 4 * ZOOM;
    ctx.beginPath(); pts.forEach((q, j) => (j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
}, 55);

// 파이프에서 뻗는 다리 (예고 동안 파이프 입구에서 솟아요)
hookOn("worldThings", (things) => {
  if (typeof casts === "undefined") return;
  for (const c of casts) {
    if (c.id !== "w2_snPipeTentacle") continue;
    const k = Math.min(1, c.t / (c.time || 1));
    things.push({ depth: c.x + c.y + 0.5, x: c.x, y: c.y, draw: () => {
      for (let i = 0; i < 6; i++) {
        const f = i / 6, sw = Math.sin(game.time * 6 + i) * 0.08;
        const x = c.x + c.dirX * f * 0.8 * k - c.dirY * sw, y = c.y + c.dirY * f * 0.8 * k + c.dirX * sw, s = 0.36 - i * 0.04;
        drawBox(x - s / 2, y - s / 2, 0.5 + i * 0.28 * k, s, s, 0.3, i % 2 ? "#e08ac8" : "#c86ab0");
      }
    } });
  }
}, 50);

function snCityPipeDraw(m) {
  const own = snBoss();
  const i = m.snIdx;
  const bubbling = own && own.snState === "bubble" && (own.snBubble === i || own.snDecoy === i);
  const real = own && own.snState === "bubble" && own.snBubble === i;
  const shake = bubbling ? Math.sin(game.time * 40 + i) * 0.05 : 0;
  const x = m.x + shake, y = m.y;
  // 돌 파이프: 굵은 몸 + 이끼 테두리 + 금 간 자국 + 까만 입구
  drawBox(x - 0.75, y - 0.75, 0, 1.5, 1.5, 0.95, "#8a9a9a");
  drawBox(x - 0.8, y - 0.8, 0.95, 1.6, 1.6, 0.18, "#a8b4b0");
  drawBox(x - 0.8, y - 0.8, 1.13, 1.6, 0.16, 0.06, "#7fd0b0"); drawBox(x - 0.8, y + 0.64, 1.13, 1.6, 0.16, 0.06, "#6fc0a0");
  drawBox(x - 0.55, y - 0.55, 1.13, 1.1, 1.1, 0.02, "#0a1418");
  drawBox(x + 0.74, y - 0.3, 0.3, 0.03, 0.08, 0.4, "#5a6a6a"); drawBox(x - 0.2, y + 0.74, 0.2, 0.3, 0.03, 0.05, "#5a6a6a");
  if (bubbling) {
    for (let k = 0; k < 4; k++) { const t = (game.time * 1.4 + k / 4) % 1; drawBox(x - 0.07 + Math.sin(k * 2 + game.time * 3) * 0.3, y - 0.07 + Math.cos(k * 3) * 0.25, 1.15 + t * 1.4, 0.14, 0.14, 0.14, "#e6fbff"); }
    // 단서: 진짜 파이프엔 박사 모자가 빼꼼 (3단계 가짜 파이프엔 모자가 없어요. 1·2단계에도 같은 규칙)
    if (real) {
      const up = 0.15 + 0.12 * Math.abs(Math.sin(game.time * 6));
      drawBox(x - 0.22, y - 0.22, 1.1 + up, 0.44, 0.44, 0.14, "#2a2440");
      drawBox(x - 0.38, y - 0.38, 1.24 + up, 0.76, 0.76, 0.05, "#1a1626");
      drawBox(x + 0.3, y - 0.03, 1.29 + up - 0.18, 0.05, 0.05, 0.2, "#ffd23f");
    }
  }
}

Object.assign(EXTRA_SHAPES, {
  w2_cityPipe(m) { snCityPipeDraw(m); },
  // 문어 박사: 동그란 보라분홍 머리 + 둥근 안경 + 작은 박사 모자 + 구불구불 다리 8개
  w2_snOcto(m) {
    if (m.hidden) return;
    const a = bossMotion(m), P = [];
    const c1 = "#c86ab0", c2 = "#e08ac8", dk = "#9a4a88";
    const sq = a.stag ? 0.9 : 1, up = a.raise * 0.08, br = a.breath;
    // 다리 8개 (바깥으로 구불구불, 철썩 때는 앞 다리 하나를 번쩍)
    for (let i = 0; i < 8; i++) {
      const ang = i * Math.PI / 4 + Math.PI / 8;
      for (let k = 0; k < 3; k++) {
        const r = 0.16 + k * 0.1, wav = Math.sin(game.time * 4 + i + k) * 0.03;
        const lift = i === 0 && a.anim === "slam" ? a.k * (0.1 + k * 0.12) : 0;
        P.push([Math.cos(ang) * r + wav, Math.sin(ang) * r - wav, 0.02 + lift + (k === 2 ? 0.01 : 0), 0.1 - k * 0.018, 0.1 - k * 0.018, 0.08, k % 2 ? c2 : c1]);
      }
    }
    // 머리 (둥글게 3단)
    P.push([0, 0, 0.08, 0.42, 0.42, 0.12 * sq, c1]);
    P.push([0, 0, 0.2 * sq + br, 0.48, 0.48, 0.2 * sq, c1]);
    P.push([-0.01, 0, 0.4 * sq + br, 0.42, 0.42, 0.12 * sq, c2]);
    P.push([-0.02, 0, 0.52 * sq + br, 0.3, 0.3, 0.06, c2]);
    // 점무늬
    P.push([-0.18, 0.14, 0.36 * sq + br, 0.05, 0.05, 0.05, dk], [-0.2, -0.1, 0.46 * sq + br, 0.05, 0.05, 0.05, dk], [-0.1, 0.22, 0.5 * sq + br, 0.04, 0.04, 0.04, dk]);
    // 눈 + 둥근 안경 (테두리)
    const ez = 0.3 * sq + br;
    eyes(P, 0.245, 0.1, ez, 0.075, "#2a1a3a", a.stag);
    for (const sd of [1, -1]) {
      P.push([0.262, sd * 0.1, ez + 0.085, 0.02, 0.12, 0.02, "#3a3040", true], [0.262, sd * 0.1, ez - 0.015, 0.02, 0.12, 0.02, "#3a3040", true]);
      P.push([0.262, sd * 0.1 + 0.06, ez + 0.035, 0.02, 0.02, 0.1, "#3a3040", true], [0.262, sd * 0.1 - 0.06, ez + 0.035, 0.02, 0.02, 0.1, "#3a3040", true]);
    }
    P.push([0.262, 0, ez + 0.05, 0.02, 0.04, 0.02, "#3a3040", true]);
    // 웃는 입
    P.push([0.25, 0, 0.2 * sq + br, 0.02, 0.1, 0.025, "#7a2a6a", true]);
    // 박사 모자 (네모 판 + 금 술)
    const hz = 0.58 * sq + br + up;
    P.push([-0.02, 0, hz, 0.18, 0.18, 0.07, "#2a2440"], [-0.02, 0, hz + 0.07, 0.3, 0.3, 0.025, "#1a1626"], [0.1, 0.12, hz + 0.0, 0.02, 0.02, 0.09, "#ffd23f"]);
    drawVoxelParts(m, P, { top: 0.8 });
    // 깜짝! 창: 머리 위 노란 "!"
    if (m.snSurpriseT > 0 && m.snState === "out" && !(m.stagger > 0)) { const s = toScreen(m.x, m.y, 3.0); text("!", s.x, s.y, 34 * ZOOM, "#ffe27a", "center"); }
  },
});
hookOn("lights", (lights) => {
  const m = snBoss();
  if (!m || !m.snSpots) return;
  if (m.snState === "bubble") for (const i of [m.snBubble, m.snDecoy]) { const s = snPipeAt(m, i); if (s) lights.push({ x: s.x, y: s.y, radius: 2.4, power: 0.8 }); }
  if (!m.hidden) lights.push({ x: m.x, y: m.y, radius: 2.2, power: 0.5 });
}, 60);

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_snInkCloud: { text: "검은 원 밖으로!" },
  w2_snInkShot: { text: "부채꼴 옆으로!" },
  w2_snSlam: { text: "원 밖으로! 비틀 때 공격", do: true },
  w2_snOctoCall: { text: "조수는 화살로!" },
  w2_snPipeTentacle: { text: "파이프 빨간 줄 옆으로!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.sunken = { 1: "다른 파이프에서도 다리가 나와요!", 2: "모자가 보이는 파이프가 진짜예요!" };
