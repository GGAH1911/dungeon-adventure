// ===== 월드 2 보스 6 (마지막): 바다 용왕 출렁이 (심해 궁전, 설계서 docs/design/world2-ocean.md 5-6) =====
// 새 아이디어 = 앞 보스 다섯을 섞고, 마지막에 비틀기 하나.
//   비늘: 받는 피해 ×0.5. 진주 핵이 열리면 ×2.0. 단계마다 핵을 여는 방법이 달라요.
//   1단계 "물살 + 핵"   (소라왕 + 대왕조개): 물살 길에 휩쓸려 기둥에 쿵 / 입을 두 번 맞히면 켁! 핵 열림
//   2단계 "어둠 + 미끼 + 짐꾼" (등불 아귀 + 선장): 불이 꺼지고 등불 4개. 곁에서 켜면 눈부셔 + 핵 열림. 짐꾼은 보호막
//   3단계 "소용돌이" (새): 궁전이 빙글빙글. 복어를 때리면 빵빵해져 소용돌이를 타고 용왕에게 가서 펑! -> 비틀 + 핵 열림
// 다른 보스 것을 그대로 다시 써요 (다시 만들지 않기):
//   bosses_c.js  w2_currentLanes · w2LaneRects · 물살 떠내려가기/쿵(보스 칸 m.flowable, m.w2Flow) · w2_pearlVolley · W2_MOUTH_HITS/W2_CORE_OPEN
//   bosses_w2trench.js  trLampsAround · trDarkAlpha · trDrawBright · 등불(w2_lamp) · m.w2Dark/m.w2LampGlare/m.w2GlareCore · 미끼/불 끄기 기술
//   bosses_w2vents.js   w2_spout (다시 정의하지 않아요)
//   ocean_env.js        w2AddVent (거품 기둥)
// 같이 하기: 싸움 상태는 모두 보스·부하 몬스터 칸 (abDark 어둠, abWhirl 소용돌이, abAnchor, coreOpenT, abPuffed …)

Object.assign(MATERIALS, { w2_dragonPearl: { name: "용왕의 진주", color: "#fffaf0" } });

const AB = {
  hp: 240, size: 3.4, r: 1.15,
  pillars: [[-6, -6], [6, 6], [-6, 6], [6, -6]],
  vents: [[-4, 8], [4, -8]],
  lamps: [[9, 0], [-9, 0], [0, 9], [0, -9]],
  darkBase: 0.45, darkDeep: 0.78, darkRate: 0.33 / 2,   // 2초에 걸쳐 어두워져요
  glareCore: 2.5,
  popStagger: 3.0, popDmg: 0.02, popReach: 2.2,
  puffDrift: 1.1, puffMax: 4,
  porterMax: 4,
};
function abDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function abStagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[abDiff()] || 1; }
function abDragon() { return monsters.find((o) => o.type === "w2_seaDragon" && o.hp > 0) || null; }

// ----- 부하 -----
Object.assign(MONSTERS, {
  // 용왕을 위해 진주 조개를 나르는 짐꾼 (선장 짐꾼과 같은 모습·규칙, 용왕에게 가요)
  w2_abPorter: { name: "용궁 짐꾼", shape: "human", behavior: "ab_porter", world: 2,
    hp: 2.4, speed: 1.1, damage: 0, xp: 3, emerald: 0.3, armsForward: true,
    look: { skin: "#ffc8a0", hair: "#3a2a5a", shirt: "#e0c060", pants: "#2a3550", eyes: "#1a1a1a", helmet: "#3fb0a0" } },
  // 빵빵 복어: 맞기 전엔 꼬마 복어처럼 펑, 처음 맞으면 빵빵해져 둥실 -> 용왕에게
  w2_pufferBall: { name: "빵빵 복어", shape: "w2_abPuffer", behavior: "ab_pufferBall", floaty: true, world: 2,
    hp: 2, speed: 1.9, damage: 2.5, xp: 4, emerald: 0.3, fuse: 1.1, blastRadius: 1.8, color: "#ffd84a", eyes: "#1a1a1a" },
});
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push("w2_abPorter", "w2_pufferBall"); // (tools/lib.mjs 는 mobs_extra 보다 먼저 읽어요)
if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add("w2_abPorter");
Object.assign(BEHAVIOR_DOCS, {
  ab_porter: { name: "용궁 짐 나르기", desc: "용왕에게 걸어가 닿으면 용왕에게 보호막을 줘요.", counter: "노란 ! 짐꾼을 용왕에게 닿기 전에 잡기" },
  ab_pufferBall: { name: "빵빵 배달", desc: "다가와 부풀다 펑! 하지만 먼저 때리면 빵빵해져서 소용돌이를 타고 용왕에게 가 펑 터져요.", counter: "복어를 먼저 때려서 용왕에게 보내기" },
});
EXTRA_BEHAVIORS.ab_porter = (m, p, dist, dt) => {
  const boss = abDragon();
  if (!boss) { m.moving = false; return; }
  const d = Math.hypot(boss.x - m.x, boss.y - m.y) || 1;
  if (d < boss.r + 0.6) {
    const K = typeof WK !== "undefined" ? WK : { shieldK: { normal: 0.08 }, shieldT: 12 };
    const add = boss.maxHp * (K.shieldK[abDiff()] || 0.08);
    boss.shieldHp = (boss.shieldHp || 0) + add; boss.shieldMax = boss.shieldHp; boss.shieldT = K.shieldT || 12;
    addFloatText(boss.x, boss.y, "+보호막", "#8fe0ff", 22);
    showMessage("보호막! 세게 몰아쳐요", 2, false, "#8fe0ff");
    spawnBurst(m.x, m.y, ["#bfeaff", "#ffffff"], 10);
    m.hp = 0; m.silent = true;
    return;
  }
  const sp = (typeof WK !== "undefined" && WK.porterSpeed[abDiff()]) || 1.1;
  moveWithSeparation(m, (boss.x - m.x) / d, (boss.y - m.y) / d, dt, sp);
  m.moving = true;
  faceToward(m, boss);
};
EXTRA_BEHAVIORS.ab_pufferBall = (m, p, dist, dt) => {
  if (!m.abPuffed) { updateExploder(m, p, dist, dt); return; }
  m.moving = false; m.state = "chase";
  const boss = abDragon();
  m.abPuffT = (m.abPuffT || 0) + dt;
  if (!boss) { if (m.abPuffT > 6) { m.hp = 0; m.silent = true; spawnBurst(m.x, m.y, ["#ffd84a", "#ffffff"], 8); } return; }
  const dx = boss.x - m.x, dy = boss.y - m.y, d = Math.hypot(dx, dy) || 1;
  if (d < AB.popReach + (boss.r || 1) * 0.5) { abPufferPop(m, boss); return; }
  // 소용돌이가 있으면 빙글 타고, 늘 가운데(용왕) 쪽으로 끌려가요. 둥실 떠서 벽·기둥 위로 지나가요
  let vx = dx / d * AB.puffDrift, vy = dy / d * AB.puffDrift;
  const W = boss.abWhirl;
  if (W) {
    const cx = world.W / 2, cy = world.H / 2, rx = m.x - cx, ry = m.y - cy, r = Math.hypot(rx, ry) || 1;
    if (r > W.r0 && r < W.r1) { vx += -ry / r * W.spin; vy += rx / r * W.spin; }
    else if (r <= W.r0) { vx = dx / d * 1.6; vy = dy / d * 1.6; }
  } else { vx = dx / d * 1.6; vy = dy / d * 1.6; }
  if (m.abPuffT > 14) { vx = dx / d * 3; vy = dy / d * 3; } // 너무 오래 돌면 곧장
  m.x += vx * dt; m.y += vy * dt;
  m.faceX = vx / (Math.hypot(vx, vy) || 1); m.faceY = vy / (Math.hypot(vx, vy) || 1);
};
function abPufferPop(ball, boss) {
  ball.hp = 0; ball.silent = true;
  addRing(ball.x, ball.y, { speed: 8, life: 0.4, hue: 50 }); spawnBurst(ball.x, ball.y, ["#ffd84a", "#fff6c0", "#ffffff"], 20);
  game.shake = Math.max(game.shake, 0.45);
  if (typeof sfx !== "undefined" && sfx.boom) sfx.boom();
  if (boss.invuln > 0) return;
  damageMonster(boss, boss.maxHp * AB.popDmg, ball.x, ball.y, false, 0, { abPop: true });
  casts = casts.filter((c) => c.m !== boss); boss.charge = null; boss.state = "chase"; boss.queue = [];
  boss.stagger = AB.popStagger * abStagK(); boss.coreOpenT = AB.popStagger * abStagK();
  addFloatText(boss.x, boss.y, "펑! 진주가 보여요!", "#fffaf0", 28);
}
// 복어: 처음 맞으면 퓨즈 대신 빵빵! (피해 없음), 빵빵한 동안은 안 맞아요
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (m.type !== "w2_pufferBall") return false;
  if (m.abPuffed) return true;
  if (h.opts.dot) return true;
  m.abPuffed = true; m.state = "chase"; m.stateTimer = 0; m.abPuffT = 0; m.aggro = true;
  addFloatText(m.x, m.y, "빵빵!", "#ffd84a", 24); addRing(m.x, m.y, { speed: 4, life: 0.3, hue: 50 });
  if (typeof sfx !== "undefined" && sfx.potion) sfx.potion();
  return true;
}, 11);
hookOn("untargetable", (o) => o.type === "w2_pufferBall" && !!o.abPuffed, 50);

// ----- 기술 -----
Object.assign(ABILITIES, {
  // 1단계
  w2_dragonBite: { name: "용왕 깨물기", desc: "머리를 들었다가 앞을 콱 깨물어요.", counter: "빨간 원 밖으로! 그다음 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.0, at: "front", offset: 1.8, time: 1.2 },
    cooldown: 5, range: [0, 3.8], damageMul: 2.1, anim: "slam", staggerAfter: 1.8, effect: { type: "knockback", force: 1.5 } },
  w2_dragonInhale: { ...ABILITIES.w2_clamInhale, name: "용왕 들이마시기", desc: "입을 크게 벌리고 물을 빨아들여요. 주변이 용왕 쪽으로 끌려가요.",
    counter: "입을 두 번 맞히면 켁! 진주 핵이 보여요. 끌려가면 바로 굴러요", followUp: "w2_dragonChomp" },
  w2_dragonChomp: { ...ABILITIES.w2_clamChomp, name: "용왕 앙!", desc: "끌어온 다음 입을 앙! 다물어요." },
  // 2단계 (짐꾼 둘만)
  w2_abCrewCall: { name: "용궁 짐꾼 부르기", desc: "궁전 가장자리에서 진주를 든 짐꾼 둘이 와요. 용왕에게 닿으면 보호막.", counter: "노란 ! 짐꾼부터 잡아요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "point",
    effect: { type: "w2_abCrew", count: 2 } },
  // 3단계
  w2_whirlpool: { name: "소용돌이", desc: "궁전 전체가 빙글빙글 도는 소용돌이가 돼요. 아프지 않아요.", counter: "복어를 때리면 소용돌이가 용왕에게 데려가요!",
    tags: ["boss", "current"], telegraph: { shape: "self", radius: 2, at: "self", time: 1.4 }, cooldown: 999, range: [0, 30], damageMul: 0, anim: "roar",
    when: { once: true }, weight: 50, effect: { type: "w2_whirl", r0: 3.5, r1: 11, spin: 2.0, inward: 0.4 } },
  w2_pufferCall: { name: "복어 부르기", desc: "궁전 가장자리에 꼬마 복어 둘을 불러요.", counter: "복어를 때려서 빵빵하게!",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 9, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w2_abPuffers", monster: "w2_pufferBall", count: 2 }, when: { maxSummons: 4 } },
  w2_dragonBreath: { name: "물살 숨결", desc: "궁전을 가로지르는 넓은 물살을 뿜어요.", counter: "넓은 빨간 길 밖 양옆으로!",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 14, width: 4, at: "self", time: 2.4 }, // 3단계엔 가운데에 있어서 벽까지 14칸이면 돼요
    cooldown: 10, range: [0, 30], damageMul: 2.4, anim: "roar", staggerAfter: 2.2, effect: { type: "knockback", force: 1.4 } },
  w2_bubbleNova: { name: "거품 탄막", desc: "사방으로 거품 구슬을 쏴요.", counter: "구슬 사이로 빠지거나 구르기",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 0.8 },
    cooldown: 8, range: [0, 30], damageMul: 0.8, anim: "raise", effect: { type: "nova", count: 10, speed: 4, color: "#bff6ff" } },
});

// ----- 보스 -----
MONSTERS.w2_seaDragon = { name: "출렁이", shape: "w2_seaDragon", behavior: "bossAI", color: "#3fb0a0", hp: AB.hp, speed: 1.0, damage: 2.0,
  xp: 60, emerald: 1, emeraldCount: 16, heavy: true, isBoss: true, size: AB.size, world: 2 };
{
  const pats = [
    { until: 0.66, gap: 1.7, pattern: ["w2_currentLanes", "w2_dragonBite", "w2_dragonInhale", "w2_pearlVolley", "w2_currentLanes", "w2_dragonBite"] },
    { until: 0.33, gap: 1.5, pattern: ["w2_lureDance", "w2_abCrewCall", "w2_darkBite", "w2_glowSpores", "w2_lampSnuff"] },
    { until: 0, gap: 1.3, pattern: ["w2_pufferCall", "w2_dragonBreath", "w2_spout", "w2_bubbleNova", "w2_pufferCall", "w2_dragonBreath"] },
  ];
  const phases = pats.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS.abyss = {
    id: "w2_seaDragon", name: "출렁이", title: "바다 용왕", size: AB.size, world: 2, phases,
    material: { id: "w2_dragonPearl", name: "용왕의 진주", color: "#fffaf0" },
    arena: { size: 28, theme: { floor: "#3a4a6a", moss: "#e0c060", wall: "#2a3550", darkness: AB.darkBase, bg: "#03060f" },
      build: (w) => {
        w.theme = { ...w.theme }; // 2단계 어둠을 바꿔도 원래 정의는 그대로
        b2Pillars(w, AB.pillars, 3);
        w.w2Lanes = w2LaneRects(w); // 소라왕과 같은 물살 길 3줄
        const c = w.W / 2;
        if (typeof w2AddVent === "function") for (const [dx, dy] of AB.vents) w2AddVent(c + dx, c + dy, w);
      } },
    create(x, y, level) {
      const m = createMonster("w2_seaDragon", x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS.abyss;
      m.name = "바다 용왕 출렁이"; m.r = AB.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.flowable = true; // 소라왕의 비틀기가 처음부터: 물살 길에 휩쓸리면 기둥에 쿵
      m.abDark = AB.darkBase; m.abDarkGoal = AB.darkBase;
      m.onPhase = (idx) => abPhase(m, idx);
      return m;
    },
  };
}
function abPhase(m, idx) {
  m.w2Flow = null;
  if (idx === 1) {
    m.flowable = false; m.abDarkGoal = AB.darkDeep;
    m.w2Dark = true; m.w2LampGlare = true; m.w2GlareCore = AB.glareCore;
    if (typeof trLampsAround === "function" && !monsters.some((o) => o.type === "w2_lamp" && o.hp > 0 && o.owner === m)) trLampsAround(m, world.W / 2, world.H / 2, AB.lamps, 2);
    showMessage("불이 꺼졌어요! 등불로 용왕을 비춰요", 3, false, "#ffe27a");
  }
  if (idx === 2) {
    m.flowable = false; m.abDarkGoal = AB.darkBase;
    m.w2Dark = false; m.w2LampGlare = false; m.w2GlareCore = 0; m.trLure = null;
    for (const o of monsters) if ((o.type === "w2_lamp" && o.owner === m) || o.type === "w2_abPorter") { o.hp = 0; o.silent = true; spawnBurst(o.x, o.y, ["#ffe27a", "#ffffff"], 6); }
    world.solids = world.solids.filter((s) => !(s.prop && s.prop.type === "w2_lamp"));
    m.abAnchor = true; m.speed = 0;
    m.queue.unshift("w2_whirlpool"); // 무적 2.2초 뒤 첫 기술
    showMessage("소용돌이예요! 복어를 때려서 용왕에게 보내요", 3.2, false, "#ffe27a");
  }
}

// ----- 비늘 ×0.5 / 진주 핵 ×2 / 입 두 번 -----
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (m.type !== "w2_seaDragon" || h.opts.abPop) return false;
  const inhale = casts.find((c) => c.m === m && c.id === "w2_dragonInhale");
  if (inhale && !h.opts.dot && game.time - (m.mouthLastT || -9) > 0.15) {
    m.mouthLastT = game.time;
    m.mouthHit = (m.mouthHit || 0) + 1;
    const need = W2_MOUTH_HITS[abDiff()] || 2;
    addFloatText(m.x, m.y + 0.3, `입! ${Math.min(need, m.mouthHit)}/${need}`, "#ffe27a", 22);
    if (m.mouthHit >= need) {
      m.mouthHit = 0;
      casts = casts.filter((c) => c.m !== m); m.queue = []; m.state = "chase";
      m.coreOpenT = m.stagger = W2_CORE_OPEN[abDiff()] || 3.5;
      addFloatText(m.x, m.y, "켁!", "#ffffff", 30); game.shake = 0.35; if (typeof sfx !== "undefined") sfx.slam();
      showMessage("켁! 진주 핵이 보여요! 지금 마구 때려요", 2.2, false, "#fffaf0");
    }
  }
  if (m.coreOpenT > 0) { h.dmg *= 2; if (!h.opts.dot && Math.random() < 0.3) addFloatText(m.x, m.y + 0.4, "진주! x2", "#fffaf0", 18); }
  else {
    h.dmg *= 0.5;
    if (!h.opts.dot && game.time - (m.hardTextT || -9) > 0.7) { m.hardTextT = game.time; addFloatText(m.x, m.y + 0.3, "비늘!", "#9fd8d0", 16); }
  }
  return false;
}, 25);
hookOn("castResolved", (c) => { if (c.id === "w2_dragonChomp" && c.m.hp > 0) c.m.coreOpenT = 1.6 * abStagK(); }, 30);

// ----- 새 효과 -----
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect, m = c.m;
  // 물살 길: 용왕은 처음부터 떠내려가요 -> 주인공 가까운 길로 걸어 들어가요 (주인공이 옆으로 빠지면 용왕만 쿵)
  if (c.id === "w2_currentLanes" && m.type === "w2_seaDragon") {
    const lanes = world.w2Lanes || [];
    if (!lanes.length || !p) return true;
    const n = abDiff() !== "easy" && Math.random() < 0.5 ? 2 : 1;
    const pick = lanes.slice().sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - p.x) - Math.abs((b.x0 + b.x1) / 2 - p.x)).slice(0, n);
    m.w2LaneGoal = (pick[0].x0 + pick[0].x1) / 2;
    const k = { easy: 1.5, normal: 1, hard: 0.9, nightmare: 0.8 }[abDiff()] || 1;
    m.w2Flow = { lanes: pick, t: 0, warn: e.warn * k, on: e.on, push: e.push };
    return true;
  }
  if (e.type === "w2_abCrew") {
    const alive = monsters.filter((o) => o.type === "w2_abPorter" && o.hp > 0).length;
    let n = Math.min(abDiff() === "easy" ? 1 : e.count, AB.porterMax - alive);
    const base = Math.atan2(m.y - world.H / 2, m.x - world.W / 2) + Math.PI;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 1.1, r = world.W / 2 - 3.2;
      const spot = findFreeSpot(world.W / 2 + Math.cos(a) * r, world.H / 2 + Math.sin(a) * r, 0.35, 3) || { x: world.W / 2, y: world.H / 2 };
      const s = createMonster("w2_abPorter", spot.x, spot.y, m.level || game.mapLevel);
      s.aggro = true; s.appearTimer = 0.6; s.summoned = true; monsters.push(s);
      addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 45 });
    }
    if (n > 0) showMessage("짐꾼이 와요! 노란 ! 짐꾼부터 잡아요", 2.2, false, "#ffe27a");
    return true;
  }
  if (e.type === "w2_whirl") {
    m.abWhirl = { r0: e.r0, r1: e.r1, spin: e.spin, inward: e.inward };
    addRing(world.W / 2, world.H / 2, { speed: 10, life: 0.6, hue: 190 });
    game.shake = Math.max(game.shake, 0.3);
    return true;
  }
  if (e.type === "w2_abPuffers") {
    const alive = monsters.filter((o) => o.type === e.monster && o.hp > 0).length;
    const n = Math.min(e.count, AB.puffMax - alive);
    const base = Math.atan2((p ? p.y : m.y) - world.H / 2, (p ? p.x : m.x) - world.W / 2); // 주인공 쪽 가장자리 (복어가 금방 와요)
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.9, r = world.W / 2 - 3.2;
      const spot = findFreeSpot(world.W / 2 + Math.cos(a) * r, world.H / 2 + Math.sin(a) * r, 0.35, 3) || { x: world.W / 2 + 4, y: world.H / 2 };
      const s = createMonster(e.monster, spot.x, spot.y, m.level || game.mapLevel);
      s.aggro = true; s.appearTimer = 0.6; s.summoned = true; monsters.push(s);
      m.summons = (m.summons || []).filter((q) => q.hp > 0); m.summons.push(s);
      addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 50 });
    }
    if (n > 0) showMessage("복어를 때려서 빵빵하게! 용왕에게 보내요", 2.2, false, "#ffd84a");
    return true;
  }
  return false;
}, 14);

// ----- 매 화면 (방장) -----
hookOn("dungeonTick", (dt) => {
  const m = abDragon();
  if (!m) return;
  if (!m.abInit) { m.abInit = true; showMessage("바다 용왕! 물길로 데려가 기둥에 쿵, 입을 두 번 맞혀요", 3.2, false, "#ffe27a"); }
  if (m.coreOpenT > 0) m.coreOpenT = Math.max(0, m.coreOpenT - dt);
  if (!casts.some((c) => c.m === m && c.id === "w2_dragonInhale")) m.mouthHit = 0;
  // 어둠: 목표까지 천천히
  const g = m.abDarkGoal === undefined ? AB.darkBase : m.abDarkGoal;
  if (m.abDark !== g) m.abDark = m.abDark < g ? Math.min(g, m.abDark + AB.darkRate * dt) : Math.max(g, m.abDark - AB.darkRate * dt);
  // 1단계 물살 경고 동안 그 물길로 걸어가요
  if (m.flowable && m.w2Flow && !(m.stagger > 0) && m.w2LaneGoal !== undefined && m.w2Flow.t < m.w2Flow.warn + 0.5 && !m.charge && m.state !== "cast") {
    const dx = m.w2LaneGoal - m.x;
    if (Math.abs(dx) > 0.3) { moveEntity(m, Math.sign(dx) * 3 * dt, 0); m.moving = true; }
  }
  // 3단계: 가운데에 머물러요 (소용돌이의 눈)
  if (m.abAnchor && !m.charge) {
    const cx = world.W / 2, cy = world.H / 2, dx = cx - m.x, dy = cy - m.y, d = Math.hypot(dx, dy);
    if (d > 0.3) { const st = Math.min(d, 3 * dt); moveEntity(m, dx / d * st, dy / d * st); }
    const p = nearestPlayer(m.x, m.y); if (p && m.state !== "cast") faceToward(m, p);
  }
  // 소용돌이: 고리 안의 주인공을 빙글 (아프지 않아요, 걷기보다 약해요)
  const W = m.abWhirl;
  if (W) {
    const cx = world.W / 2, cy = world.H / 2;
    for (const p of allPlayers()) {
      if (p.hp <= 0) continue;
      const rx = p.x - cx, ry = p.y - cy, r = Math.hypot(rx, ry) || 1;
      if (r < W.r0 || r > W.r1) continue;
      const k = p.rollTimer > 0 ? 0.5 : 1;
      moveEntity(p, (-ry / r * W.spin - rx / r * W.inward) * k * dt, (rx / r * W.spin - ry / r * W.inward) * k * dt);
    }
  }
}, 45);

// 어둠은 보스 칸(abDark)으로 정해요 (친구 기기도 같은 어둠). lights 는 어둠 그리기 바로 앞에 불려요
hookOn("lights", (lights) => {
  const m = abDragon();
  if (!m || !world.theme || game.scene !== "dungeon") return;
  if (typeof m.abDark === "number") world.theme.darkness = m.abDark;
  if (m.coreOpenT > 0) lights.push({ x: m.x + m.faceX * 0.3 * AB.size, y: m.y + m.faceY * 0.3 * AB.size, radius: 2.4, power: 0.85 });
  for (const o of monsters) if (o.type === "w2_pufferBall" && o.abPuffed && o.hp > 0) lights.push({ x: o.x, y: o.y, radius: 1.4, power: 0.6 });
}, 5);

// ----- 그리기 -----
// 소용돌이: 도는 화살표 (바닥)
hookOn("drawFloor", () => {
  const m = abDragon();
  if (!m || !m.abWhirl) return;
  const W = m.abWhirl, cx = world.W / 2, cy = world.H / 2;
  ctx.save(); ctx.lineCap = "round";
  for (const [r, n] of [[5, 6], [8, 9], [10.4, 12]]) {
    ctx.strokeStyle = "rgba(170,235,255,0.22)"; ctx.lineWidth = 2 * ZOOM; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, s = toScreen(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.01); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(230,250,255,0.75)"; ctx.lineWidth = 3 * ZOOM;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + game.time * W.spin / r;
      const tx = -Math.sin(a), ty = Math.cos(a), px = Math.cos(a), py = Math.sin(a);
      const bx = cx + px * r, by = cy + py * r;
      const tip = toScreen(bx + tx * 0.35, by + ty * 0.35, 0.02), q1 = toScreen(bx - tx * 0.15 + px * 0.4, by - ty * 0.15 + py * 0.4, 0.02), q2 = toScreen(bx - tx * 0.15 - px * 0.4, by - ty * 0.15 - py * 0.4, 0.02);
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
    }
  }
  ctx.restore();
  if (Math.random() < 0.3) { const a = Math.random() * Math.PI * 2, r = W.r0 + Math.random() * (W.r1 - W.r0); addSparkle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.1, { vx: -Math.sin(a) * 1.5, vy: Math.cos(a) * 1.5, vz: 0.4, life: 0.7, size: 0.45, hue: 190 }); }
}, 55);
// 짐꾼 -> 용왕 점선, 빵빵 복어 -> 용왕 금색 점선 (좋은 일이 일어날 길)
hookOn("drawTelegraphsAfter", () => {
  const m = abDragon();
  if (!m) return;
  ctx.save(); ctx.lineWidth = 3 * ZOOM;
  for (const o of monsters) {
    if (o.hp <= 0) continue;
    if (o.type === "w2_abPorter") {
      ctx.setLineDash([7 * ZOOM, 7 * ZOOM]); ctx.strokeStyle = "rgba(255,226,90,0.75)";
      const a = toScreen(o.x, o.y, 0.05), b = toScreen(m.x, m.y, 0.05);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    if (o.type === "w2_pufferBall" && o.abPuffed) {
      ctx.setLineDash([5 * ZOOM, 6 * ZOOM]); ctx.lineDashOffset = -game.time * 30; ctx.strokeStyle = "rgba(255,215,80,0.85)";
      const a = toScreen(o.x, o.y, 0.05), b = toScreen(m.x, m.y, 0.05);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2 + (b.y - a.y) * 0.3, (a.y + b.y) / 2 - (b.x - a.x) * 0.3, b.x, b.y); ctx.stroke();
    }
  }
  ctx.restore();
}, 53);
hookOn("drawMonsterOver", (o) => {
  if (o.type !== "w2_abPorter" || o.hp <= 0) return;
  drawBox(o.x - 0.22, o.y - 0.18, 1.12, 0.44, 0.36, 0.1, "#c8a8ff");
  drawBox(o.x - 0.08, o.y - 0.06, 1.22, 0.16, 0.12, 0.1, "#fffaf0");
  drawBox(o.x - 0.22, o.y - 0.18, 1.3, 0.44, 0.36, 0.08, "#b090f0");
  const s = toScreen(o.x, o.y, 1.9 + Math.sin(game.time * 6) * 0.08);
  text("!", s.x, s.y, 30 * ZOOM, "#ffe23a", "center");
}, 50);

Object.assign(EXTRA_SHAPES, {
  // 바다 용왕: 동그란 청록 머리, 금 수염, 산호 왕관, 이마의 진주 핵, 뒤로 똬리 튼 몸 마디 5개, 짧은 앞발
  w2_seaDragon(m) {
    const a = bossMotion(m), P = [], B = [];
    const sq = a.stag ? 0.9 : 1, bob = 0.04 + Math.sin(a.t * 1.6) * 0.02;
    const jaw = (a.roar || (m.state === "cast" && m.castAnim === "slam" ? a.k : 0)) * 0.08 + (m.coreOpenT > 0 ? 0.04 : 0);
    // 몸 마디 (뒤로 똬리)
    for (let i = 0; i < 5; i++) {
      const f = -0.16 - i * 0.12, s = Math.sin(i * 1.3 + a.t * 1.5) * 0.13, w = 0.3 - i * 0.04;
      P.push([f, s, 0.02 + (i % 2) * 0.03, w, w, w * 0.9, i % 2 ? "#36a090" : "#3fb0a0"]);
      P.push([f + 0.02, s, 0.0, w * 0.8, w * 0.7, 0.05, "#f0e6c8"]);
      P.push([f, s, 0.02 + w * 0.9 + (i % 2) * 0.03, 0.06, 0.04, 0.07, "#e0c060"]); // 등지느러미
    }
    // 앞발
    for (const sd of [1, -1]) P.push([0.22 + a.walk * 0.03 * sd, sd * 0.2, 0, 0.09, 0.09, 0.12, "#36a090"]);
    // 머리
    P.push([0.12, 0, bob + 0.14, 0.42, 0.46, 0.36 * sq, "#3fb0a0"]);
    P.push([0.15, 0, bob + 0.12, 0.34, 0.38, 0.06, "#f0e6c8"]); // 턱 밑
    P.push([0.36, 0, bob + 0.2 + jaw, 0.14, 0.32, 0.14, "#4fc8b4"]); // 주둥이
    P.push([0.34, 0, bob + 0.1 - jaw * 0.4, 0.14, 0.3, 0.08, "#2f9080"]); // 아래턱
    for (const sd of [1, -1]) P.push([0.43, sd * 0.08, bob + 0.3 + jaw, 0.02, 0.04, 0.03, "#1f6a5a"]); // 콧구멍
    // 금 수염 (살랑)
    for (const sd of [1, -1]) {
      const sw = Math.sin(a.t * 2.2 + sd) * 0.04;
      P.push([0.48, sd * (0.15 + sw), bob + 0.24, 0.16, 0.025, 0.025, "#ffd23f", true]);
      P.push([0.6, sd * (0.2 + sw * 1.6), bob + 0.2, 0.12, 0.025, 0.025, "#ffd23f", true]);
    }
    // 산호 왕관
    P.push([0.06, 0, bob + 0.48 * sq, 0.22, 0.34, 0.05, "#e0c060"]);
    P.push([0.08, 0, bob + 0.53 * sq, 0.06, 0.06, 0.2, "#ffb04a"]);
    for (const sd of [1, -1]) { P.push([0.08, sd * 0.12, bob + 0.53 * sq, 0.06, 0.06, 0.14, "#ff8f7a"]); P.push([0.02, sd * 0.18, bob + 0.53 * sq, 0.05, 0.05, 0.1, "#ff9ad6"]); }
    // 늘 밝게: 눈 + 진주 핵 (어둠 속에서도 어디 있는지 보여요)
    const sleepy = a.stag && !(m.coreOpenT > 0) && !(m.trGlareFx > 0);
    for (const sd of [1, -1]) {
      B.push([0.335, sd * 0.13, bob + 0.3, 0.02, 0.1, sleepy ? 0.035 : 0.1, "#ffffff"]);
      B.push([0.347, sd * 0.13, bob + 0.31, 0.02, 0.05, sleepy ? 0.02 : 0.06, "#1a2a3a"]);
    }
    const open = m.coreOpenT > 0;
    B.push([0.3, 0, bob + 0.42, 0.04, 0.15, 0.15, "#ffd23f"]);
    B.push([0.325, 0, bob + 0.44, 0.04, open ? 0.13 : 0.1, open ? 0.13 : 0.1, open ? "#ffffff" : "#fffaf0"]);
    const alpha = typeof trDarkAlpha === "function" ? trDarkAlpha(m) : 1;
    drawVoxelParts(m, P, { alpha, top: 0.9 });
    const front = m.faceX + m.faceY > -0.5;
    if (typeof trDrawBright === "function" && (front || alpha < 1)) trDrawBright(m, B);
    if (open) { const s = toScreen(m.x + m.faceX * 0.33 * AB.size, m.y + m.faceY * 0.33 * AB.size, 0.5 * AB.size); ctx.save(); ctx.globalCompositeOperation = "lighter"; const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 36 * ZOOM); gr.addColorStop(0, "rgba(255,250,240,0.65)"); gr.addColorStop(1, "rgba(255,250,240,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, 36 * ZOOM, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  },
  // 빵빵 복어: 맞기 전엔 꼬마 복어 모습, 빵빵하면 크고 둥실 (돌기 + 웃는 눈)
  w2_abPuffer(m) {
    if (!m.abPuffed) { EXTRA_SHAPES.w2_puffer(m); return; }
    const { add, flush, white } = w2Parts(m);
    const bob = 0.55 + Math.sin(game.time * 4 + m.x) * 0.08, s = 0.8;
    add(0, 0, bob, s, s, s * 0.9, white ? "#ffffff" : "#ffe46a");
    add(0, 0, bob - 0.01, s * 0.9, s * 0.9, 0.06, "#fff6e0");
    for (const [f, sd, z] of [[0.42, 0, 0.4], [-0.42, 0, 0.4], [0, 0.42, 0.4], [0, -0.42, 0.4], [0.3, 0.3, 0.75], [-0.3, -0.3, 0.75], [0.3, -0.3, 0.75], [-0.3, 0.3, 0.75], [0, 0, 0.92]]) add(f, sd, bob + z * s * 0.9, 0.1, 0.1, 0.1, "#fff0c0");
    add(s * 0.5, 0.15, bob + s * 0.55, 0.12, 0.12, 0.05, "#1a1a1a"); add(s * 0.5, -0.15, bob + s * 0.55, 0.12, 0.12, 0.05, "#1a1a1a"); // 웃는 눈 (가는 선)
    add(s * 0.5, 0, bob + s * 0.3, 0.06, 0.16, 0.05, "#ff8a6a");
    flush();
  },
});

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_dragonInhale: { text: "입을 두 번 맞혀요!", do: true },
  w2_dragonChomp: { text: "원 밖으로 굴러요!" },
  w2_dragonBite: { text: "원 밖으로! 그다음 공격" },
  w2_abCrewCall: { text: "노란 ! 짐꾼부터!", do: true },
  w2_whirlpool: { text: "복어를 때려 용왕에게 보내요!", do: true, voice: true },
  w2_pufferCall: { text: "복어를 때려요!", do: true },
  w2_dragonBreath: { text: "넓은 길 양옆으로!", voice: true },
  w2_bubbleNova: { text: "구슬 사이로" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.abyss = { 1: "불이 꺼졌어요! 등불로 용왕을 비춰요", 2: "소용돌이예요! 복어를 때려서 용왕에게 보내요" };
