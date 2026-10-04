// ===== 월드 3 보스 5~8 (설계서 docs/design/world3-moon.md 5-5 ~ 5-8) =====
//   5 수정 거미 반짝다리 (crystalcave): 빛 구슬을 칼(또는 화살 2발)로 쳐서 되돌리면 비틀
//   6 운석 거인 쿵쾅이 (meteorhill): 별똥별 자리에 뜨거운 구덩이. 쿵쾅이가 밟으면 "앗 뜨거!" 비틀 + 피해 x1.5
//   7 외계인 선장 뾰롱 (ufowreck): 2·3단계엔 UFO 를 타요(칼 안 닿음). 안테나 3개를 끄면 UFO 가 쿵 떨어져요
//   8 그림자 늑대 아우 (darkside): 지구빛 탑 빛 밖에선 그림자(피해 x0.3). 빛 안에 3초 있으면 눈부셔 비틀
// 같이 하기: 구슬·안테나·탑 스위치는 소품 몬스터(prop)라 상태가 친구 기기에 그대로 가요. 구덩이는 zones(같이 보내는 배열).
// 탑(moontower.js)이 쓰는 기술: w3_lightOrb · w3_starfall · w3_ufoBeam · w3_wolfPounce (보스가 누구든 돌아가게 일반으로 만들었어요)

function w3bStagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[(game.profile && game.profile.difficulty) || "normal"] || 1; }
function w3bMon(id, fb) { return MONSTERS[id] && !MONSTERS[id].w3Placeholder ? id : MONSTERS[id] ? id : fb; } // 부하 몬스터 (mobs_w3.js 가 없으면 대신)
function w3bFromPlayer(h) { return allPlayers().some((p) => Math.hypot(h.fromX - p.x, h.fromY - p.y) < 0.6); } // 칼처럼 주인공 자리에서 친 것
function w3bCalm(b) { casts = casts.filter((c) => c.m !== b); b.charge = null; b.state = "chase"; b.queue = []; }
function w3bStagger(b, base, text, color = "#ffe27a") {
  if (!b || b.hp <= 0) return;
  w3bCalm(b);
  b.stagger = Math.max(b.stagger || 0, base * w3bStagK());
  addFloatText(b.x, b.y, text, color, 26);
  game.shake = Math.max(game.shake, 0.4);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
}

// ----- 보스 부품·전설 (8-2, 8-3) -----
Object.assign(MATERIALS, {
  w3_prismShard: { name: "프리즘 조각", color: "#9fe8ff", enchant: "chain" },
  w3_meteorCore: { name: "별똥별 심", color: "#ff9a4a", enchant: "burn" },
  w3_ufoChip: { name: "UFO 회로", color: "#7dffb0" },
  w3_wolfFang: { name: "그림자 송곳니", color: "#3a3a6a", enchant: "slow" },
});
if (typeof BOSS_LEGENDS !== "undefined" && typeof defBase === "function") {
  Object.assign(BOSS_LEGENDS, { crystalcave: "L_crystalcave", meteorhill: "L_meteorhill", ufowreck: "L_ufowreck", darkside: "L_darkside" });
  defBase("L_crystalcave", { slot: "bow", legend: "crystalcave", name: "프리즘 활", type: "triple", minL: 0, color: "#9fe8ff", mul: 1.14, perk: { pierce: 1 }, desc: "화살 3발이 하나씩 더 뚫어요 (공격력 +14%)" });
  defBase("L_meteorhill", { slot: "armor", legend: "meteorhill", name: "별똥별 갑옷", minL: 0, look: { body: "#7a5a4a", legs: "#5e4436", helmet: "#ff9a4a", boots: "#4a3428", gloves: "#ff9a4a" }, perk: { hearts: 3, regen: 8 }, desc: "하트 +3, 천천히 하트가 차요" });
  defBase("L_ufowreck", { slot: "bow", legend: "ufowreck", name: "뾰롱의 광선 석궁", type: "crossbow", minL: 0, color: "#7dffb0", mul: 1.14, effect: "chain", desc: "옆 몬스터에게 번개가 튀어요 (공격력 +14%)" });
  defBase("L_darkside", { slot: "armor", legend: "darkside", name: "그림자 늑대 망토", minL: 0, look: { body: "#3a3a6a", legs: "#2a2a50", helmet: "#c8c8e0", boots: "#1e1e3a", gloves: "#c8c8e0" }, perk: { hearts: 2, speed: 0.1 }, desc: "하트 +2, 빨라져요" });
}

// ----- 소품 -----
MONSTERS.w3_lightOrbBall = { name: "빛 구슬", color: "#e8fbff", shape: "w3_lightOrbBall", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, world: 3, codexSkip: true };
MONSTERS.w3_antenna = { name: "안테나", color: "#7fd0ff", shape: "w3_antenna", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 3, codexSkip: true };
MONSTERS.w3_towerSwitch = { name: "지구빛 탑 스위치", color: "#9fe8ff", shape: "w3_towerSwitch", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 3, codexSkip: true };

// ----- 기술 -----
Object.assign(ABILITIES, {
  // 5 반짝다리
  w3_lightOrb: { name: "빛 구슬", desc: "입에 빛을 모았다가 크고 느린 빛 구슬을 쏴요. 흰 테두리 구슬은 쳐서 되돌릴 수 있어요!", counter: "칼로 치거나 화살 2발로 되돌려요 (느려서 피해도 돼요)",
    tags: ["boss", "projectile", "do"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 6, range: [0, 30], damageMul: 1.4, anim: "roar",
    effect: { type: "w3_reflectOrb", speed: 3 } },
  w3_crystalWeb: { name: "수정 거미줄", desc: "끈적한 거미줄을 뿌려요. 밟으면 느려져요 (아프진 않아요).", counter: "거미줄을 돌아가거나 구르기로 넘어가요",
    tags: ["boss", "zone", "control"], telegraph: { shape: "circle", radius: 1.8, at: "target", time: 0.8 }, cooldown: 8, range: [0, 12], anim: "point",
    effect: { type: "zone", duration: 6, tick: 0.3, kind: "web" } },
  w3_crystalBeam: { name: "수정 광선", desc: "다리 끝 수정에서 곧은 빛줄기를 쏴요.", counter: "가는 선이라 옆으로 한 걸음!",
    tags: ["boss", "line", "magic"], telegraph: { shape: "line", length: 11, width: 0.8, at: "self", time: 1.1, follow: true }, cooldown: 6, range: [1, 12], damageMul: 1.5, anim: "staff",
    effect: { type: "damage" } },
  w3_crystalBlink: { name: "수정 순간이동", desc: "수정 뒤로 사라졌다가 보라 원 자리에 나타나 콕!", counter: "보라 원에서 떨어져요",
    tags: ["boss", "move", "magic"], telegraph: { shape: "circle", radius: 1.3, at: "target", time: 1.0 }, cooldown: 8, range: [2, 14], damageMul: 1.3, anim: "crouch",
    effect: { type: "teleport" } },
  // 6 쿵쾅이
  w3_golemSlam: { name: "바위 주먹 쿵", desc: "두 주먹을 높이 들었다가 앞을 쿵! 그 뒤 숨을 골라요.", counter: "원 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger", "ground"], telegraph: { shape: "circle", radius: 2.2, at: "front", offset: 1.8, time: 1.25 }, cooldown: 5, range: [0, 3.8], damageMul: 2.1, anim: "slam",
    staggerAfter: 2.0, effect: { type: "knockback", force: 1.5 } },
  w3_starfall: { name: "별똥별 부르기", desc: "하늘에서 별똥별이 여러 개 떨어지고, 떨어진 자리에 뜨거운 구덩이가 남아요.", counter: "그림자 밖으로! 구덩이 건너편에 서면 보스가 밟아요",
    tags: ["boss", "multi", "sky"], telegraph: { shape: "circle", radius: 1.4, at: "target", time: 1.4 }, cooldown: 8, range: [0, 30], damageMul: 1.2, anim: "raise",
    effect: { type: "rain", count: 4, spread: 4, stagger: 0.22 } },
  w3_starfallBig: { name: "큰 별똥별 비", desc: "별똥별이 여섯 개! 구덩이는 금방 식어요.", counter: "그림자 사이로! 구덩이는 4초 뒤 식어요",
    tags: ["boss", "multi", "sky"], telegraph: { shape: "circle", radius: 1.4, at: "target", time: 1.4 }, cooldown: 9, range: [0, 30], damageMul: 1.2, anim: "raise",
    effect: { type: "rain", count: 6, spread: 4.6, stagger: 0.2 } },
  w3_golemRepel: { name: "바위 밀쳐내기", desc: "웅크렸다가 몸 둘레를 펑! 가까이 있으면 날아가요.", counter: "웅크리면 뒤로 빠져요",
    tags: ["boss", "area", "ground"], telegraph: { shape: "circle", radius: 2.6, at: "self", time: 1.0 }, cooldown: 7, range: [0, 2.6], damageMul: 1.1, anim: "crouch",
    effect: { type: "knockback", force: 2.4 } },
  w3_golemFist: { name: "따라오는 큰 주먹", desc: "발밑 그림자가 따라오다 멈추면 큰 주먹이 쿵!", counter: "계속 움직이다 테두리가 굵어지면 빠져요",
    tags: ["boss", "track"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 2.7, follow: true }, cooldown: 8, range: [0, 30], damageMul: 1.7, anim: "point",
    effect: { type: "knockback", force: 1.2 } },
  // 7 뾰롱
  w3_ufoVolley: { name: "광선 구슬", desc: "초록 광선 구슬 다섯 발을 부채처럼 쏴요.", counter: "구슬 사이로! 옆으로 돌아요",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 7, angle: 0.9, at: "self", time: 0.9, harmlessPreview: true }, cooldown: 6, range: [1, 12], damageMul: 0.9, anim: "point",
    effect: { type: "volley", count: 5, spread: 0.9, speed: 6.5, color: "#7dffb0" } },
  w3_bossTractor: { name: "끌어당김 광선", desc: "UFO 빛으로 넓은 원 안을 쭉 끌어당겨요 (아프진 않아요).", counter: "보라 원이 차기 전에 밖으로",
    tags: ["boss", "control"], telegraph: { shape: "circle", radius: 5, at: "self", time: 1.1 }, cooldown: 9, range: [2, 6], anim: "raise",
    effect: { type: "pull", force: 2.2 } },
  w3_alienCall: { name: "외계인 부르기", desc: "삐리리! 초록 외계인 둘을 불러요.", counter: "부르는 동안 때리면 끊겨요. 외계인부터 정리!",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.1 }, cooldown: 12, range: [0, 30], anim: "raise", interruptible: true, interruptAt: 0.08,
    effect: { type: "summon", monster: w3bMon("w3_alien", "zombie"), count: 2 }, when: { maxSummons: 4 } },
  w3_ufoBeam: { name: "따라오는 UFO 광선", desc: "UFO 빛 동그라미가 따라오다 멈추면 광선이 쾅!", counter: "계속 움직이다 테두리가 굵어지면 빠져요",
    tags: ["boss", "track", "sky"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 2.7, follow: true }, cooldown: 7, range: [0, 30], damageMul: 1.6, anim: "raise",
    effect: { type: "knockback", force: 1.1 } },
  // 8 아우
  w3_wolfPounce: { name: "덮치기", desc: "웅크렸다가 크게 뛰어 원 자리로 덮쳐요. 그 뒤 숨을 골라요.", counter: "원 밖으로! 착지 뒤 공격",
    tags: ["boss", "area", "move", "stagger"], telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.1 }, cooldown: 5, range: [1.5, 14], damageMul: 1.8, anim: "crouch",
    staggerAfter: 1.6, effect: { type: "teleport" } },
  w3_wolfPounceTwo: { name: "두 번 덮치기", desc: "한 번 덮치고 바로 또 덮쳐요.", counter: "원 밖으로 두 번! 두 번째 뒤에 공격",
    tags: ["boss", "area", "move"], telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.1 }, cooldown: 7, range: [1.5, 14], damageMul: 1.8, anim: "crouch",
    followUp: "w3_wolfPounce", effect: { type: "teleport" } },
  w3_wolfRing: { name: "울부짖음 고리", desc: "아우우~ 울음이 고리처럼 퍼져요. 늑대 바로 옆은 안전해요.", counter: "늑대 옆 금색 안으로 파고들어요",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 5, inner: 1.7, at: "self", time: 1.2 }, cooldown: 8, range: [0, 6], damageMul: 1.4, anim: "roar",
    effect: { type: "knockback", force: 1.0 } },
  w3_howl: { name: "그림자 부르기", desc: "길게 울어 그림자 늑대 둘을 불러요. 잠깐 더 어두워져요.", counter: "탑 빛 안에서 부하를 잡아요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 1.1 }, cooldown: 12, range: [0, 30], anim: "roar",
    effect: { type: "summon", monster: w3bMon("w3_shadowWolf", "zombie"), count: 2 }, when: { maxSummons: 4 } },
});

// ----- 보스 공통 만들기 -----
function w3bDef(cfg) {
  MONSTERS[cfg.type] = { name: cfg.name, shape: cfg.type, behavior: "bossAI", color: cfg.color, hp: cfg.hp, speed: cfg.speed, damage: cfg.damage,
    xp: 50, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: cfg.size, world: 3 };
  const phases = cfg.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS[cfg.mapId] = {
    id: cfg.type, name: cfg.name, title: cfg.title, size: cfg.size, world: 3,
    material: { id: cfg.mat, ...MATERIALS[cfg.mat] },
    arena: { size: cfg.arena, theme: cfg.theme, build: cfg.build },
    phases,
    create(x, y, level) {
      const m = createMonster(cfg.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[cfg.mapId];
      m.name = `${cfg.title} ${cfg.name}`;
      m.r = cfg.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.onPhase = (idx) => { const t = cfg.phaseText && cfg.phaseText[idx]; if (t) showMessage(t, 2.8, false, cfg.textColor || "#9fe8ff"); if (cfg.onPhase) cfg.onPhase(m, idx); };
      return m;
    },
  };
}
function w3bBoss(type) { const b = w3BossNow(); return b && b.type === type ? b : null; }

// ===== 5. 수정 거미 반짝다리 (crystalcave) =====
const CS_TYPE = "w3_crystalSpider";
const CS = { orbSpeed: 3, backSpeed: 7, orbR: 0.45, life: 9, stagger: 2.6, extra: 0.8, dmgFrac: 0.04, gapOrb: 0.7 };
w3bDef({ type: CS_TYPE, mapId: "crystalcave", name: "반짝다리", title: "수정 거미", color: "#9a7ae0", hp: 265, damage: 2.1, speed: 1.2, size: 2.9, r: 1.05, arena: 26,
  mat: "w3_prismShard", textColor: "#9fe8ff",
  theme: { floor: "#3a3a5a", moss: "#9fe8ff", wall: "#24243e", darkness: 0.7, bg: "#020208" },
  build(w) { const c = w.W / 2; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; w3AddLight(c + Math.cos(a) * 8, c + Math.sin(a) * 8, w); } },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w3_lightOrb", "w3_crystalWeb", "w3_crystalBeam"] },
    { until: 0.33, gap: 1.6, pattern: ["w3_lightOrb", "w3_crystalBlink", "w3_crystalWeb", "w3_crystalBeam"] },
    { until: 0, gap: 1.4, pattern: ["w3_lightOrb", "w3_crystalBeam", "w3_crystalBeam", "w3_crystalBlink", "w3_crystalWeb"] },
  ],
  phaseText: { 1: "빛 구슬이 두 개! 하나씩 쳐서 되돌려요", 2: "빛 구슬이 세 개! 많이 되돌릴수록 오래 비틀거려요" },
});
// 구슬 몇 개 (반짝다리는 단계마다 1 · 2 · 3, 다른 보스·탑은 1)
function csOrbCount(m) { return m.type === CS_TYPE ? Math.min(3, (m.phaseIdx || 0) + 1) : 1; }
function csOrbs() { return monsters.filter((o) => o.type === "w3_lightOrbBall" && o.hp > 0); }
function csSpawnOrb(m, dmg) {
  const p = nearestPlayer(m.x, m.y) || game.player;
  const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
  const s = createMonster("w3_lightOrbBall", m.x + dx / d * (m.r + 0.4), m.y + dy / d * (m.r + 0.4), m.level || game.mapLevel || 1);
  s.r = CS.orbR; s.aggro = true; s.appearTimer = 0; s.immovable = true;
  s.w3Owner = m; s.w3Dmg = dmg; s.w3Hits = 0; s.w3Back = false; s.w3Life = CS.life; s.vx = dx / d; s.vy = dy / d;
  monsters.push(s);
  addRing(s.x, s.y, { speed: 3, life: 0.35, hue: 190 });
  return s;
}
// 구슬 맞히기: 칼(주인공 자리에서 친 것)은 한 번에, 화살·마법은 2번
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w3_lightOrbBall") return false;
  if (h.opts.dot || s.w3Back) return true;
  if (game.time - (s.w3HitT || -9) < 0.12) return true;
  s.w3HitT = game.time;
  s.w3Hits += w3bFromPlayer(h) ? 2 : 1;
  if (s.w3Hits < 2) { addFloatText(s.x, s.y, "한 번 더!", "#e8fbff", 16); return true; }
  s.w3Back = true;
  addFloatText(s.x, s.y, "되받아치기!", "#9fe8ff", 22);
  spawnBurst(s.x, s.y, ["#ffffff", "#9fe8ff"], 10);
  if (typeof sfx !== "undefined" && sfx.block) sfx.block();
  return true;
}, 4);
// 구슬 움직이기 (방장)
hookOn("dungeonTick", (dt) => {
  for (const s of csOrbs()) {
    const owner = s.w3Owner && s.w3Owner.hp > 0 ? s.w3Owner : null;
    s.w3Life -= dt;
    if (!owner || s.w3Life <= 0) { s.hp = 0; s.silent = true; continue; }
    if (s.w3Back) {
      const dx = owner.x - s.x, dy = owner.y - s.y, d = Math.hypot(dx, dy) || 1;
      s.x += dx / d * CS.backSpeed * dt; s.y += dy / d * CS.backSpeed * dt;
      if (d < owner.r + s.r) {
        s.hp = 0; s.silent = true;
        owner.w3BackN = (owner.w3BackN || 0) + 1;
        damageMonster(owner, owner.maxHp * CS.dmgFrac, s.x, s.y, false, 0, { w3Orb: true });
        spawnBurst(owner.x, owner.y, ["#ffffff", "#9fe8ff", "#c8b8ff"], 18);
        w3bStagger(owner, CS.stagger + CS.extra * (owner.w3BackN - 1), owner.w3BackN > 1 ? `번쩍! x${owner.w3BackN}` : "번쩍! 비틀!", "#9fe8ff");
      }
      continue;
    }
    // 가장 가까운 주인공을 천천히 따라가요 (방향을 조금씩만 바꿔요: 피할 수 있게)
    const p = nearestPlayer(s.x, s.y);
    if (p) {
      const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dt * 1.2);
      s.vx += (dx / d - s.vx) * k; s.vy += (dy / d - s.vy) * k;
      const n = Math.hypot(s.vx, s.vy) || 1; s.vx /= n; s.vy /= n;
    }
    const nx = s.x + s.vx * CS.orbSpeed * dt, ny = s.y + s.vy * CS.orbSpeed * dt;
    if (isWall(Math.floor(nx), Math.floor(ny))) { s.hp = 0; s.silent = true; spawnBurst(s.x, s.y, ["#e8fbff"], 6); continue; }
    s.x = nx; s.y = ny;
    for (const q of allPlayers()) {
      if (q.hp <= 0 || Math.hypot(q.x - s.x, q.y - s.y) > s.r + (q.r || 0.35)) continue;
      s.hp = 0; s.silent = true;
      if (q.rollTimer > 0) addFloatText(q.x, q.y, "회피!", "#9be8ff", 18);
      else hurtPlayer(q, s.w3Dmg, owner);
      spawnBurst(s.x, s.y, ["#e8fbff", "#9fe8ff"], 10);
      break;
    }
  }
  // 차례로 쏘는 구슬 (3단계: 3개)
  for (const b of monsters) {
    if (!b.w3OrbQ || b.hp <= 0) continue;
    b.w3OrbT -= dt;
    if (b.w3OrbT <= 0) { csSpawnOrb(b, b.w3OrbDmg); b.w3OrbQ--; b.w3OrbT = CS.gapOrb; }
  }
}, 40);
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w3_reflectOrb") return false;
  const m = c.m;
  m.w3BackN = 0; m.w3OrbDmg = abilityDamage(c);
  csSpawnOrb(m, m.w3OrbDmg);
  m.w3OrbQ = csOrbCount(m) - 1; m.w3OrbT = CS.gapOrb;
  return true;
}, 15);

// ===== 6. 운석 거인 쿵쾅이 (meteorhill) =====
const MG_TYPE = "w3_meteorGolem";
const MG = { pit: 6, pitHard: 4, pitR: 1.25, stagger: 2.6, dmgMul: 1.5, hurtMul: 0.25, guideDist: 9 };
w3bDef({ type: MG_TYPE, mapId: "meteorhill", name: "쿵쾅이", title: "운석 거인", color: "#7a5a4a", hp: 275, damage: 2.2, speed: 0.9, size: 3.2, r: 1.2, arena: 28,
  mat: "w3_meteorCore", textColor: "#ffb87a",
  theme: { floor: "#8a7a88", moss: "#ffb87a", wall: "#4e4250", darkness: 0.38, bg: "#0c0610" },
  build(w) { b2Pillars(w, [[-6, -6], [6, 6], [-6, 6], [6, -6]], 2); },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w3_golemSlam", "w3_starfall", "w3_golemSlam", "w3_golemRepel"] },
    { until: 0.33, gap: 1.6, pattern: ["w3_starfall", "w3_golemSlam", "w3_golemFist", "w3_golemRepel", "w3_golemSlam"] },
    { until: 0, gap: 1.4, pattern: ["w3_starfallBig", "w3_golemFist", "w3_golemSlam", "w3_golemRepel", "w3_starfallBig", "w3_golemSlam"] },
  ],
  phaseText: { 1: "큰 주먹 그림자가 따라와요! 움직이다 빠져요", 2: "별똥별 여섯 개! 구덩이가 금방 식어요" },
});
// 별똥별이 떨어진 자리 = 뜨거운 구덩이 (주인공은 조금 아프고, 보스가 밟으면 비틀)
hookOn("castResolved", (c) => {
  if (!c || !c.m || (c.id !== "w3_starfall" && c.id !== "w3_starfallBig")) return;
  const life = c.id === "w3_starfallBig" ? MG.pitHard : MG.pit;
  if (isWall(Math.floor(c.x), Math.floor(c.y))) return;
  zones.push({ x: c.x, y: c.y, radius: MG.pitR, life, max: life, tick: 0.8, tickT: 0.6, damage: Math.max(0.25, abilityDamage(c) * MG.hurtMul), kind: "lava", w3Pit: true, w3Owner: c.m });
}, 30);
function mgPits() { return zones.filter((z) => z.w3Pit && z.life > 0); }
hookOn("dungeonTick", (dt) => {
  for (const z of mgPits()) {
    const b = z.w3Owner;
    if (!b || b.hp <= 0 || z.w3Used || b.invuln > 0) continue;
    if (Math.hypot(b.x - z.x, b.y - z.y) > z.radius + b.r * 0.4) continue;
    z.w3Used = true; z.life = Math.min(z.life, 0.6);
    b.w3HotT = MG.stagger * w3bStagK();
    spawnBurst(b.x, b.y, ["#ff9a4a", "#ffd23f", "#ff5a2a"], 20);
    w3bStagger(b, MG.stagger, "앗 뜨거! 비틀!", "#ffb070");
  }
  for (const b of monsters) if (b.w3HotT > 0) b.w3HotT -= dt;
}, 41);
// 구덩이를 밟아 비틀거리는 동안 피해 x1.5 는 공통 비틀거림 규칙(x1.5)이 해 줘요 (두 번 곱하지 않아요)

// ===== 7. 외계인 선장 뾰롱 (ufowreck) =====
const AC_TYPE = "w3_alienCaptain";
const AC = { relight: [20, 20, 14], crash: 3.4, homes: [[9, 0], [0, -9], [-6.4, 6.4]], zUp: 1.4 };
w3bDef({ type: AC_TYPE, mapId: "ufowreck", name: "뾰롱", title: "외계인 선장", color: "#7dffb0", hp: 270, damage: 2.2, speed: 1.1, size: 2.8, r: 1.0, arena: 28,
  mat: "w3_ufoChip", textColor: "#7dffb0",
  theme: { floor: "#8a96a0", moss: "#7dffb0", wall: "#4a5662", darkness: 0.4, bg: "#04080a" },
  build(w) {
    const c = w.W / 2;
    w3AddLowGrav(2, 2, w.W - 2, w.H - 2, w);
    w3AddPad(c - 4, c - 4, -1, -1, w); w3AddPad(c + 4, c + 4, 1, 1, w); w3AddPad(c + 4, c - 4, 1, -1, w); w3AddPad(c - 4, c + 4, -1, 1, w);
  },
  phases: [
    { until: 0.66, gap: 1.7, pattern: ["w3_ufoVolley", "w3_bossTractor", "w3_alienCall", "w3_ufoVolley"] },
    { until: 0.33, gap: 1.5, pattern: ["w3_ufoBeam", "w3_ufoVolley", "w3_ufoBeam", "w3_bossTractor"] },
    { until: 0, gap: 1.3, pattern: ["w3_ufoBeam", "w3_ufoBeam", "w3_ufoVolley", "w3_alienCall", "w3_ufoBeam", "w3_bossTractor"] },
  ],
  phaseText: { 1: "UFO 를 탔어요! 칼은 안 닿아요. 안테나 3개를 쳐서 꺼요!", 2: "안테나가 빨리 켜져요! 서둘러 꺼요" },
});
function acAntennas() { return monsters.filter((o) => o.type === "w3_antenna" && o.hp > 0); }
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (!m) return false;
  if (m.type === "w3_antenna") {
    if (h.opts.dot) return true;
    if (m.w3On) {
      m.w3On = false; const b = w3bBoss(AC_TYPE); m.w3OffT = AC.relight[(b && b.phaseIdx) || 0] || 20;
      addFloatText(m.x, m.y, "꺼졌다!", "#cfd6e0", 20); spawnBurst(m.x, m.y, ["#7fd0ff", "#cfd6e0"], 8);
      if (typeof sfx !== "undefined" && sfx.zap) sfx.zap();
    }
    return true;
  }
  if (m.type === AC_TYPE && m.w3Ufo && !h.opts.dot) {
    if (w3bFromPlayer(h)) { if (game.time - (m.w3NoTxtT || -9) > 0.5) { m.w3NoTxtT = game.time; addFloatText(m.x, m.y, "닿지 않아요! 안테나를 꺼요", "#ffb070", 15); } return true; }
    h.dmg *= 0.5;
  }
  return false;
}, 5);
hookOn("dungeonTick", (dt) => {
  const b = w3bBoss(AC_TYPE);
  if (!b) return;
  const c = world.W / 2;
  if (!b.w3Init) {
    b.w3Init = true;
    for (const [ox, oy] of AC.homes) { const s = spawnProp("w3_antenna", c + ox, c + oy, b); s.w3On = true; s.w3OffT = 0; s.r = 0.45; }
  }
  for (const a of acAntennas()) if (!a.w3On) { a.w3OffT -= dt; if (a.w3OffT <= 0) { a.w3On = true; addRing(a.x, a.y, { speed: 3, life: 0.4, hue: 200 }); } }
  const anyOn = acAntennas().some((a) => a.w3On);
  const want = (b.phaseIdx || 0) >= 1 && anyOn && !(b.stagger > 0);
  if (b.w3Ufo && !anyOn && b.hp > 0) { // 안테나를 다 껐어요: 쿵!
    b.w3Ufo = false; b.flying = false;
    spawnDust(b.x, b.y); spawnBurst(b.x, b.y, ["#c8ccd8", "#7dffb0", "#ffe27a"], 22);
    w3bStagger(b, AC.crash, "쿵! UFO 가 떨어졌어요!", "#7dffb0");
    showMessage("UFO 가 떨어졌어요! 지금 공격!", 2.4, false, "#7dffb0");
  } else if (want && !b.w3Ufo) { b.w3Ufo = true; b.flying = true; if ((b.phaseIdx || 0) >= 1) addFloatText(b.x, b.y, "슈웅~", "#7dffb0", 20); }
  else if (!want && b.w3Ufo) { b.w3Ufo = false; b.flying = false; }
  b.w3FlyZ = (b.w3FlyZ || 0) + ((b.w3Ufo ? AC.zUp : 0) - (b.w3FlyZ || 0)) * Math.min(1, dt * 3);
}, 42);
hookOn("lights", (lights) => {
  if (game.scene !== "dungeon") return;
  for (const a of monsters) if (a.type === "w3_antenna" && a.hp > 0 && a.w3On) lights.push({ x: a.x, y: a.y, radius: 1.3, power: 0.55, color: "#7fd0ff" });
}, 61);

// ===== 8. 그림자 늑대 아우 (darkside) =====
const MW_TYPE = "w3_moonWolfBoss";
const MW = { shadowMul: 0.3, alpha: 0.45, lightT: 3, stagger: 2.2, cd: 6, hits: 2, towers: [[0, -7.5], [6.5, 3.75], [-6.5, 3.75]] };
w3bDef({ type: MW_TYPE, mapId: "darkside", name: "아우", title: "그림자 늑대", color: "#3a3a6a", hp: 280, damage: 2.2, speed: 1.4, size: 3.0, r: 1.05, arena: 28,
  mat: "w3_wolfFang", textColor: "#9fb8ff",
  theme: { floor: "#2e2e3e", moss: "#6f8fff", wall: "#1a1a28", darkness: 0.78, bg: "#010104" },
  build(w) { const c = w.W / 2; for (const [ox, oy] of MW.towers) w3AddTower(c + ox, c + oy, w); },
  phases: [
    { until: 0.66, gap: 1.7, pattern: ["w3_wolfPounce", "w3_wolfRing", "w3_wolfPounce"] },
    { until: 0.33, gap: 1.5, pattern: ["w3_wolfPounce", "w3_howl", "w3_wolfRing", "w3_wolfPounce"] },
    { until: 0, gap: 1.3, pattern: ["w3_wolfPounceTwo", "w3_wolfRing", "w3_howl", "w3_wolfPounceTwo"] },
  ],
  phaseText: { 1: "그림자 늑대를 불러요! 탑 빛 안에서 싸워요", 2: "탑 하나가 꺼졌어요! 탑 아래 수정을 두 번 쳐서 켜요" },
  onPhase(m, idx) { if (idx === 2) { const s = mwSwitches()[0]; if (s) { s.w3On = false; s.w3Hits = 0; } } },
});
function mwSwitches() { return monsters.filter((o) => o.type === "w3_towerSwitch" && o.hp > 0).sort((a, b) => a.w3Idx - b.w3Idx); }
function mwInLight(m) { return typeof w3InTowerLight === "function" && w3InTowerLight(m.x, m.y); }
// 탑 켜짐/꺼짐은 스위치(소품) 칸에 있어요: 두 기기 모두 그걸 보고 world.w3 탑에 옮겨요
function mwSyncTowers() {
  const E = world.w3; if (!E || !E.towers) return;
  for (const s of mwSwitches()) { const t = E.towers[s.w3Idx]; if (t) t.on = s.w3On !== false; }
}
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (!m) return false;
  if (m.type === "w3_towerSwitch") {
    if (h.opts.dot || m.w3On !== false) return true;
    if (game.time - (m.w3HitT || -9) < 0.15) return true;
    m.w3HitT = game.time; m.w3Hits = (m.w3Hits || 0) + 1;
    if (m.w3Hits >= MW.hits) { m.w3On = true; addFloatText(m.x, m.y, "탑이 켜졌어요!", "#9fe8ff", 22); addRing(m.x, m.y, { speed: 5, life: 0.5, hue: 195 }); mwSyncTowers(); }
    else addFloatText(m.x, m.y, "한 번 더!", "#9fe8ff", 16);
    return true;
  }
  if (m.type === MW_TYPE && !mwInLight(m) && !h.opts.dot) h.dmg *= MW.shadowMul; // 그림자일 땐 거의 안 아파요
  return false;
}, 6);
hookOn("dungeonTick", (dt) => {
  const b = w3bBoss(MW_TYPE);
  if (!b) return;
  const E = world.w3;
  if (!b.w3Init && E && E.towers.length) {
    b.w3Init = true;
    E.towers.forEach((t, i) => { const s = spawnProp("w3_towerSwitch", t.x, t.y + 0.9, b); s.w3Idx = i; s.w3On = true; s.r = 0.4; });
  }
  mwSyncTowers();
  const lit = mwInLight(b);
  b.w3Lit = lit;
  if (b.w3FlashCd > 0) b.w3FlashCd -= dt;
  if (lit && b.hp > 0) {
    if (!b.w3LightT) addFloatText(b.x, b.y, "몸이 생겼어요!", "#c8c8e0", 20);
    b.w3LightT = (b.w3LightT || 0) + dt;
    if (b.w3LightT >= MW.lightT && !(b.w3FlashCd > 0) && !(b.stagger > 0) && !(b.invuln > 0) && b.state !== "cast" && !b.charge) {
      b.w3FlashCd = MW.cd;
      w3bStagger(b, MW.stagger, "눈부셔! 비틀!", "#e8eeff");
    }
  } else b.w3LightT = 0;
}, 43);
hookOn("monsterAlpha", (a, m) => (m.type === MW_TYPE && m.hp > 0 && !mwInLight(m) && m.state !== "cast" ? Math.min(a, MW.alpha) : a), 55);
// 탑 빛 (달 환경 파일이 아직 탑 빛을 안 넣었으면 여기서 넣어요: 같은 자리 빛은 두 번 넣지 않아요)
hookOn("lights", (lights) => {
  if (game.scene !== "dungeon" || !world.w3) return;
  mwSyncTowers();
  for (const t of world.w3.towers || []) {
    if (!t.on || lights.some((l) => Math.hypot(l.x - t.x, l.y - t.y) < 0.4)) continue;
    lights.push({ x: t.x, y: t.y, radius: t.r, power: 0.9, color: "#9fe8ff" });
  }
}, 99);

// ----- 그림: 구덩이 -> 쿵쾅이 금색 화살표 -----
hookOn("drawTelegraphsAfter", () => {
  const b = w3bBoss(MG_TYPE);
  if (!b || b.hp <= 0) return;
  for (const z of mgPits()) {
    if (z.w3Owner !== b || z.w3Used) continue;
    const dx = b.x - z.x, dy = b.y - z.y, d = Math.hypot(dx, dy);
    if (d > MG.guideDist || d < z.radius + 0.5) continue;
    const ux = dx / d, uy = dy / d;
    const a = toScreen(z.x + ux * (z.radius + 0.1), z.y + uy * (z.radius + 0.1), 0.03), e = toScreen(z.x + ux * (z.radius + 1.0), z.y + uy * (z.radius + 1.0), 0.03);
    ctx.save(); ctx.strokeStyle = `rgba(255,210,63,${0.6 + 0.3 * Math.sin(game.time * 6)})`; ctx.lineWidth = 3 * ZOOM;
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(a.x, a.y); ctx.stroke();
    const ang = Math.atan2(a.y - e.y, a.x - e.x), hs = 8 * ZOOM;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - Math.cos(ang - 0.5) * hs, a.y - Math.sin(ang - 0.5) * hs); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - Math.cos(ang + 0.5) * hs, a.y - Math.sin(ang + 0.5) * hs); ctx.stroke();
    ctx.restore();
  }
}, 50);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 수정 거미: 보라 수정 몸 + 하늘빛 수정 다리 8개 + 하얀 눈 6개
  w3_crystalSpider(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.85 : 1, up = a.roar * 0.06;
    const body = "#9a7ae0", dk = "#7a5ac0", lt = "#9fe8ff";
    for (let i = 0; i < 4; i++) for (const sd of [1, -1]) {
      const f = 0.2 - i * 0.13, wob = a.walk * ((i % 2) ? 1 : -1) * sd * 0.03;
      P.push([f + wob, sd * 0.3, 0.08, 0.05, 0.18, 0.05, dk]);
      P.push([f + wob, sd * 0.42, 0, 0.04, 0.04, 0.1, lt, true]);
    }
    P.push([-0.14, 0, 0.08, 0.36, 0.34, 0.24 * sq, body]);       // 배
    P.push([-0.2, 0, 0.3 * sq, 0.1, 0.1, 0.12, lt, true]);          // 등 수정
    P.push([-0.08, 0.1, 0.28 * sq, 0.07, 0.07, 0.09, lt, true]);
    P.push([0.14, 0, 0.1 + up, 0.24, 0.26, 0.18 * sq, dk]);        // 머리
    for (const [s, z] of [[0.05, 0.22], [-0.05, 0.22], [0.1, 0.18], [-0.1, 0.18], [0.03, 0.15], [-0.03, 0.15]]) P.push([0.265, s, z + up, 0.015, 0.035, 0.035, "#ffffff", true]);
    if (m.state === "cast" && m.lastCastId === "w3_lightOrb") P.push([0.3, 0, 0.12, 0.08 + a.k * 0.06, 0.08 + a.k * 0.06, 0.08 + a.k * 0.06, "#e8fbff", true]);
    drawVoxelParts(m, P, { top: 0.55 });
  },
  // 운석 거인: 울퉁불퉁 갈색 바위 몸, 틈 사이 주황 빛, 작은 머리·노란 눈
  w3_meteorGolem(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, up = a.raise * 0.1;
    const rock = "#7a5a4a", dk = "#5e4436", glow = "#ff9a4a";
    for (const sd of [1, -1]) {
      P.push([0.02 + a.walk * sd * 0.04, sd * 0.13, 0, 0.14, 0.14, 0.16, dk]);           // 다리
      P.push([0.06, sd * 0.3, 0.2 + up * sd * 0 + up, 0.16, 0.14, 0.26, rock]);            // 팔
      P.push([0.1, sd * 0.31, 0.12 + up, 0.18, 0.17, 0.12, dk]);                           // 주먹
    }
    P.push([-0.02, 0, 0.16, 0.4, 0.42, 0.34 * sq, rock]);
    P.push([-0.1, 0.12, 0.42 * sq, 0.16, 0.14, 0.1, dk]); P.push([0.04, -0.1, 0.44 * sq, 0.14, 0.14, 0.08, dk]);
    P.push([0.19, 0.06, 0.26, 0.015, 0.03, 0.14, glow, true]); P.push([0.19, -0.09, 0.22, 0.015, 0.12, 0.025, glow, true]);
    P.push([0.12, 0, 0.5 * sq, 0.16, 0.18, 0.12, rock]);                                    // 작은 머리
    eyes(P, 0.205, 0.045, 0.53 * sq, 0.035, "#ffd23f", a.stag);
    drawVoxelParts(m, P, { top: 0.72 });
  },
  // 외계인 선장: 큰 초록 머리 + 눈 3개 + 선장 모자, UFO 를 타면 은색 원반 위
  w3_alienCaptain(m) {
    const a = bossMotion(m), P = [], z0 = (m.w3FlyZ || 0) / (m.def.size || 1), sq = a.stag ? 0.88 : 1;
    const skin = "#7dffb0", dk = "#4fc07a";
    if (z0 > 0.02) {
      P.push([0, 0, z0 - 0.06, 0.62, 0.62, 0.06, "#c8ccd8"]); P.push([0, 0, z0 - 0.1, 0.4, 0.4, 0.05, "#9aa0b0"]);
      P.push([0, 0, z0 - 0.13, 0.18, 0.18, 0.03, "#ffe27a", true]);
      for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI * 2 + game.time * 2; P.push([Math.cos(t) * 0.27, Math.sin(t) * 0.27, z0 - 0.04, 0.04, 0.04, 0.03, i % 2 ? "#ffe27a" : "#7fd0ff", true]); }
    }
    for (const sd of [1, -1]) P.push([a.walk * sd * 0.03, sd * 0.07, z0, 0.07, 0.07, 0.12, dk]);
    P.push([0, 0, z0 + 0.12, 0.18, 0.22, 0.16 * sq, "#3a4a8a"]);                          // 선장 옷
    P.push([0.03, 0, z0 + 0.13, 0.1, 0.06, 0.1, "#ffd23f"]);
    P.push([0.04, 0, z0 + 0.28 * sq, 0.3, 0.32, 0.24 * sq, skin]);                         // 큰 머리
    P.push([0.04, 0, z0 + 0.52 * sq, 0.24, 0.3, 0.05, "#2a3a6a"]); P.push([0.14, 0, z0 + 0.52 * sq, 0.06, 0.32, 0.03, "#ffd23f"]); // 모자
    for (const s of [-0.09, 0, 0.09]) { P.push([0.195, s, z0 + 0.4 * sq, 0.02, 0.06, a.stag ? 0.02 : 0.06, "#ffffff", true]); P.push([0.205, s, z0 + 0.41 * sq, 0.02, 0.03, a.stag ? 0.01 : 0.035, "#1a2a1a", true]); }
    for (const sd of [1, -1]) P.push([0, sd * 0.14, z0 + 0.6 * sq, 0.02, 0.02, 0.1, dk], [0, sd * 0.14, z0 + 0.7 * sq, 0.04, 0.04, 0.04, "#ff7ad9", true]); // 더듬이
    drawVoxelParts(m, P, { top: 0.82 + z0 });
  },
  // 그림자 늑대: 남보라 몸 + 하늘빛 테두리 + 노란 눈. 탑 빛 안에서는 은빛 털
  w3_moonWolfBoss(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, lit = mwInLight(m), crouch = a.anim === "crouch" ? a.k * 0.06 : 0;
    const fur = lit ? "#c8c8e0" : "#3a3a6a", dk = lit ? "#9a9ab8" : "#2a2a50", rim = "#9fd8ff";
    for (const [f, sd] of [[0.18, 1], [0.18, -1], [-0.2, 1], [-0.2, -1]]) P.push([f + a.walk * sd * 0.04, sd * 0.12, 0, 0.07, 0.07, 0.16, dk]);
    P.push([-0.02, 0, 0.14 - crouch, 0.5, 0.26, 0.2 * sq, fur]);
    P.push([-0.02, 0, 0.34 * sq - crouch, 0.46, 0.2, 0.02, rim, true]);
    P.push([-0.32, 0, 0.24 - crouch, 0.18, 0.08, 0.08, fur]);                                 // 꼬리
    P.push([0.28, 0, 0.24 - crouch, 0.2, 0.2, 0.18 * sq, fur]);                              // 머리
    P.push([0.4, 0, 0.24 - crouch, 0.1, 0.12, 0.08, dk]);                                    // 주둥이
    for (const sd of [1, -1]) P.push([0.24, sd * 0.07, 0.42 * sq - crouch, 0.06, 0.05, 0.08, fur]); // 귀
    for (const sd of [1, -1]) P.push([0.385, sd * 0.06, 0.34 - crouch, 0.02, 0.04, a.stag ? 0.015 : 0.035, "#ffe27a", true]);
    drawVoxelParts(m, P, { top: 0.6 });
  },
  // 빛 구슬: 하얀 공 + 흰 테두리 (되돌리면 하늘색)
  w3_lightOrbBall(m) {
    const c = toScreen(m.x, m.y, 0.55), r = (m.r || CS.orbR) * TILE_W * 0.5;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, r * 1.6);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.5, m.w3Back ? "rgba(120,220,255,0.8)" : "rgba(230,250,255,0.75)"); g.addColorStop(1, "rgba(160,230,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = m.w3Back ? "#7fd0ff" : "#ffffff"; ctx.lineWidth = 3 * ZOOM; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const s = toScreen(m.x, m.y, 0); ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(s.x, s.y, r * 0.8, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  },
  // 안테나: 회색 대 + 꼭대기 불 (켜짐 파랑, 꺼짐 회색)
  w3_antenna(m) {
    const x = m.x, y = m.y, on = m.w3On;
    drawBox(x - 0.25, y - 0.25, 0, 0.5, 0.5, 0.18, "#5a6272");
    drawBox(x - 0.06, y - 0.06, 0.18, 0.12, 0.12, 1.1, "#9aa0b0");
    drawBox(x - 0.3, y - 0.03, 1.0, 0.6, 0.06, 0.05, "#9aa0b0");
    drawBox(x - 0.1, y - 0.1, 1.28, 0.2, 0.2, 0.2, on ? "#7fd0ff" : "#5a6070");
    if (on && Math.sin(game.time * 6 + x) > 0) { const c = toScreen(x, y, 1.45); drawStar(c.x, c.y, 5 * ZOOM, "#e6fbff"); }
  },
  // 탑 스위치: 탑 밑 수정 (켜짐 하늘빛, 꺼짐 어두운 보라 + 금색 테두리 = "쳐요")
  w3_towerSwitch(m) {
    const x = m.x, y = m.y, on = m.w3On !== false;
    drawBox(x - 0.2, y - 0.2, 0, 0.4, 0.4, 0.12, "#3a3a5a");
    drawBox(x - 0.1, y - 0.1, 0.12, 0.2, 0.2, 0.34, on ? "#9fe8ff" : "#4a3a6a");
    if (!on) { const c = toScreen(x, y, 0.3); ctx.save(); ctx.strokeStyle = `rgba(255,210,63,${0.6 + 0.3 * Math.sin(game.time * 6)})`; ctx.lineWidth = 2.5 * ZOOM; ctx.beginPath(); ctx.ellipse(c.x, c.y, 0.45 * TILE_W * 0.5, 0.45 * TILE_H, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  },
});

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w3_lightOrb: { text: "구슬을 쳐서 되돌려요!", do: true, voice: true },
  w3_crystalWeb: { text: "거미줄을 돌아가요" },
  w3_crystalBeam: { text: "옆으로 한 걸음!" },
  w3_crystalBlink: { text: "보라 원에서 떨어져요" },
  w3_golemSlam: { text: "원 밖으로! 그다음 공격" },
  w3_starfall: { text: "그림자 밖! 구덩이 건너편에 서요", do: true, voice: true },
  w3_starfallBig: { text: "그림자 사이로! 구덩이 건너편에", do: true },
  w3_golemRepel: { text: "웅크리면 뒤로!" },
  w3_golemFist: { text: "움직이다 멈추면 빠져요" },
  w3_ufoVolley: { text: "구슬 사이로!" },
  w3_bossTractor: { text: "보라 원 밖으로!" },
  w3_alienCall: { text: "외계인부터 정리!" },
  w3_ufoBeam: { text: "움직이다 멈추면 빠져요" },
  w3_wolfPounce: { text: "원 밖으로! 착지 뒤 공격" },
  w3_wolfPounceTwo: { text: "두 번 덮쳐요! 두 번 피해요" },
  w3_wolfRing: { text: "늑대 옆 금색 안으로!", do: true },
  w3_howl: { text: "탑 빛 안에서 싸워요", do: true, voice: true },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") Object.assign(GUIDE_PHASE_VOICE, {
  crystalcave: { 0: "빛 구슬을 칼로 쳐서 되돌려요!", 1: "구슬이 두 개! 하나씩 되돌려요", 2: "구슬 세 개! 많이 되돌리면 오래 비틀거려요" },
  meteorhill: { 0: "뜨거운 구덩이 건너편에 서면 쿵쾅이가 밟아요!", 1: "큰 주먹 그림자! 움직이다 빠져요", 2: "구덩이가 금방 식어요! 서둘러요" },
  ufowreck: { 0: "외계인부터 정리해요!", 1: "UFO 를 탔어요! 안테나 셋을 꺼요", 2: "안테나가 빨리 켜져요! 서둘러요" },
  darkside: { 0: "탑 빛 안으로 데려와요! 빛 안에서만 몸이 생겨요", 1: "그림자 늑대가 와요! 빛 안에서 싸워요", 2: "꺼진 탑 수정을 두 번 쳐서 켜요!" },
});
