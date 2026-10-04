// ===== 월드 2 깊은 바다 몬스터 (설계서 docs/design/world2-ocean.md 4장) =====
// 1단계: 꼬마 복어, 딱총새우, 둥실 해파리, 등딱지 거북 병사, 해마 주술사
// 문법은 docs/skill-dungeon-creature.md 와 같아요. 수치는 맵 레벨 1 기준 (좀비 = 체력 3, 공격 1)

// ----- 기술 -----
Object.assign(ABILITIES, {
  w2_snapShot: {
    name: "딱! 물방울 총", desc: "큰 집게를 딱! 튕겨 물방울 총알을 일직선으로 쏴요. 조준선이 따라오다 멈춰요.",
    counter: "조준선이 멈추면(하얗게 번쩍) 옆으로 한 걸음! 가까이 가면 못 쏴요", tags: ["line", "ranged"],
    telegraph: { shape: "line", length: 8, width: 0.6, at: "self", time: 2.0, follow: true },
    cooldown: 5, range: [3, 8], damageMul: 1.4, anim: "point", effect: { type: "damage" },
  },
  w2_jellyPulse: {
    name: "찌릿 고리", desc: "몸이 하늘색으로 밝아지다가 찌릿! 주변을 느리게 해요.",
    counter: "하늘색 원이 차면 물러나요. 터진 뒤가 때릴 시간", tags: ["area", "slow"],
    telegraph: { shape: "circle", radius: 1.4, at: "self", time: 1.1 },
    cooldown: 4, range: [0, 1.6], damageMul: 0.8, anim: "raise", effect: { type: "slow", duration: 1.5 },
  },
  w2_shellSpin: {
    name: "등딱지 미끄럼", desc: "등딱지에 쏙 들어가 앞으로 쭉 미끄러져요. 멈추면 어지러워해요.",
    counter: "빨간 길 옆으로! 멈춰서 어지러울 때 등 뒤를 때려요", tags: ["line", "move"],
    telegraph: { shape: "line", length: 4.5, width: 1.2, at: "self", time: 0.9 },
    cooldown: 7, range: [1.5, 4.5], damageMul: 1.3, anim: "crouch", effect: { type: "charge", speed: 8, stunOnWall: 1.2 },
  },
  w2_bubbleTrap: {
    name: "거품 덫", desc: "발밑에 큰 거품을 만들어요. 다 차면 거품에 갇혀 느려져요.",
    counter: "파란 원이 차기 전에 밖으로", tags: ["control", "slow"],
    telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.1 },
    cooldown: 9, range: [0, 7], damageMul: 0.3, anim: "staff", effect: { type: "slow", duration: 1.8 },
  },
});

// ----- 행동: 둥실 떠다니기 -----
BEHAVIOR_DOCS.drifter = { name: "둥실 떠다니기", desc: "흔들흔들 떠다니며 다가오고, 가까우면 몸에서 찌릿 고리를 퍼뜨려요. 물살에 밀려요.", counter: "고리가 차면 물러났다가, 터진 뒤에 때리기" };
EXTRA_BEHAVIORS.drifter = (m, p, dist, dt) => {
  m.dT = (m.dT || Math.random() * 10) + dt;
  const d = dist || 1, ux = (p.x - m.x) / d, uy = (p.y - m.y) / d, w = Math.sin(m.dT * 0.8) * 0.5;
  const k = dist < 1.2 ? -0.6 : 0.6;
  moveWithSeparation(m, ux * k - uy * w, uy * k + ux * w, dt, m.speed);
  m.moving = true;
  faceToward(m, p);
};

// ----- 몬스터 -----
Object.assign(MONSTERS, {
  w2_puffer: { name: "꼬마 복어", shape: "w2_puffer", behavior: "exploder", floaty: true, world: 2,
    hp: 2, speed: 1.9, damage: 2.5, xp: 5, emerald: 0.6, fuse: 1.1, blastRadius: 1.8, color: "#ffd84a", eyes: "#1a1a1a" },
  w2_shrimp: { name: "딱총새우", shape: "w2_shrimp", behavior: "kite", world: 2,
    hp: 2.5, speed: 1.6, damage: 1.2, xp: 6, emerald: 0.8, abilities: ["w2_snapShot"], color: "#ff8a9a", eyes: "#1a1a1a" },
  w2_jelly: { name: "둥실 해파리", shape: "w2_jelly", behavior: "drifter", floaty: true, world: 2,
    hp: 3, speed: 1.0, damage: 1.0, xp: 6, emerald: 0.7, attackRange: -1, abilities: ["w2_jellyPulse"], color: "#ffb8e0", eyes: "#3a2a4a" },
  w2_turtle: { name: "등딱지 거북 병사", shape: "human", behavior: "shieldbearer", world: 2,
    hp: 5, speed: 1.2, damage: 1.3, xp: 7, emerald: 0.8, armor: 0.2,
    attackRange: 0.85, attackCooldown: 1.3, windup: 0.35, frontShield: true, abilities: ["w2_shellSpin"], dizzyAfterCharge: 1.2,
    weapon: { type: "sword", color: "#ff8f7a", length: 0.8, shield: "#6a8a3a" },
    look: { skin: "#8fd08a", hair: "#5fae5a", shirt: "#3f7a3a", pants: "#2f5a2c", eyes: "#1a1a1a", helmet: "#5fae5a" } },
  w2_seahorse: { name: "해마 주술사", shape: "human", behavior: "support", world: 2,
    hp: 3.5, speed: 1.4, damage: 0.6, xp: 7, emerald: 0.8, attackRange: 0.7, attackCooldown: 1.4, windup: 0.3,
    abilities: ["healAllies", "w2_bubbleTrap"],
    weapon: { type: "staff", color: "#f2d6b0", orb: "rgba(120,255,220,0.7)" },
    look: { skin: "#ffb06a", hair: "#ff8a3a", shirt: "#3fa0a8", pants: "#2f7a80", eyes: "#1a1a1a", helmet: "#ff8a3a" } },
});

// 거북 병사: 미끄럼이 끝나면 (벽에 안 부딪혀도) 어지러워요 = 등 뒤를 때릴 시간
hookOn("abilitiesUpdated", () => {
  for (const m of monsters) {
    if (!m.def || !m.def.dizzyAfterCharge) continue;
    if (m.charge) m._wasCharging = true;
    else if (m._wasCharging) { m._wasCharging = false; if (!(m.stunTimer > 0)) { m.stunTimer = m.def.dizzyAfterCharge; addFloatText(m.x, m.y, "어질어질", "#ffe27a", 16); } }
  }
}, 50);

// ----- 모양 -----
function w2Parts(m) {
  const S = (m.def.size || 1) * (m.scaleMul || 1), fx = m.faceX, fy = m.faceY, px = -fy, py = fx;
  const parts = [];
  const add = (f, s, z, w, d, h, c) => parts.push({ x: m.x + (fx * f + px * s) * S, y: m.y + (fy * f + py * s) * S, z: z * S, w: w * S, d: d * S, h: h * S, c });
  const flush = () => { parts.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z); for (const q of parts) drawBox(q.x - q.w / 2, q.y - q.d / 2, q.z, q.w, q.d, q.h, q.c); };
  return { add, flush, S, white: m.flash > 0 };
}
Object.assign(EXTRA_SHAPES, {
  // 꼬마 복어: 노란 몸 + 흰 배 + 주황 지느러미. 퓨즈 동안 부풀고 돌기가 나와요
  w2_puffer(m) {
    const { add, flush, white } = w2Parts(m);
    const fuse = m.state === "fuse" ? 1 - Math.max(0, m.stateTimer) / (m.def.fuse || 1.1) : 0;
    const k = 1 + 0.5 * fuse, bob = 0.18 + Math.sin(game.time * 3 + m.x) * 0.05;
    const body = white ? "#ffffff" : fuse > 0 && Math.sin(game.time * 30) > 0 ? "#fff0a0" : m.def.color;
    const s = 0.5 * k;
    add(0, 0, bob, s, s, s * 0.9, body);
    add(0, 0, bob - 0.01, s * 0.9, s * 0.9, 0.06, white ? "#ffffff" : "#fff6e0");
    add(-s * 0.55, 0, bob + s * 0.3, 0.12, 0.2, 0.18, "#ff9a3a");
    add(0, s * 0.55, bob + s * 0.35, 0.16, 0.08, 0.14, "#ff9a3a"); add(0, -s * 0.55, bob + s * 0.35, 0.16, 0.08, 0.14, "#ff9a3a");
    if (fuse > 0) for (const [f, sd, z] of [[0.3, 0.3, 0.3], [0.3, -0.3, 0.3], [-0.3, 0.3, 0.6], [-0.3, -0.3, 0.6], [0, 0.35, 0.8], [0, -0.35, 0.8]]) add(f * k, sd * k, bob + z * s, 0.07, 0.07, 0.07, "#fff0c0");
    add(s * 0.5, 0.12, bob + s * 0.55, 0.1, 0.1, 0.1, "#ffffff"); add(s * 0.5, -0.12, bob + s * 0.55, 0.1, 0.1, 0.1, "#ffffff");
    add(s * 0.55, 0.12, bob + s * 0.57, 0.05, 0.05, 0.06, m.def.eyes); add(s * 0.55, -0.12, bob + s * 0.57, 0.05, 0.05, 0.06, m.def.eyes);
    flush();
  },
  // 딱총새우: 굽은 마디 몸 + 한쪽 큰 집게 + 눈자루 + 더듬이
  w2_shrimp(m) {
    const { add, flush, white } = w2Parts(m);
    const c = white ? "#ffffff" : m.def.color, dk = white ? "#ffffff" : "#e0506a";
    const walk = m.moving ? Math.sin(m.walkTime * 14) * 0.03 : 0;
    add(-0.28, 0, 0.12 + walk, 0.18, 0.18, 0.14, c); add(-0.1, 0, 0.16, 0.2, 0.22, 0.18, c); add(0.1, 0, 0.18, 0.22, 0.24, 0.2, c);
    add(-0.42, 0, 0.1, 0.12, 0.26, 0.06, dk);
    const snap = m.state === "cast" ? 0.08 : 0;
    add(0.3 + snap, 0.22, 0.2, 0.24, 0.18, 0.18, dk); add(0.44 + snap, 0.24, 0.24, 0.12, 0.12, 0.1, dk);
    add(0.26, -0.14, 0.2, 0.1, 0.08, 0.08, c);
    add(0.2, 0.07, 0.38, 0.04, 0.04, 0.1, dk); add(0.2, -0.07, 0.38, 0.04, 0.04, 0.1, dk);
    add(0.2, 0.07, 0.48, 0.06, 0.06, 0.06, "#1a1a1a"); add(0.2, -0.07, 0.48, 0.06, 0.06, 0.06, "#1a1a1a");
    add(0.42, 0.06, 0.42, 0.3, 0.02, 0.02, dk); add(0.42, -0.06, 0.44, 0.3, 0.02, 0.02, dk);
    for (let i = 0; i < 3; i++) add(-0.05 + i * 0.12, 0, 0.04, 0.03, 0.3, 0.08, dk);
    flush();
  },
  // 둥실 해파리: 반투명 돔 + 리본 촉수. 찌릿 고리 예고 때 하늘색으로 밝아져요
  w2_jelly(m) {
    const { add, flush, white } = w2Parts(m);
    const lit = m.state === "cast";
    const bob = 0.45 + Math.sin(game.time * 2 + m.x) * 0.08;
    ctx.save(); ctx.globalAlpha *= 0.88;
    add(0, 0, bob, 0.56, 0.56, 0.32, white ? "#ffffff" : lit ? "#bff0ff" : m.def.color);
    add(0, 0, bob + 0.3, 0.38, 0.38, 0.1, white ? "#ffffff" : lit ? "#e6fbff" : "#ffd6f0");
    for (const [f, s] of [[0.15, 0.15], [0.15, -0.15], [-0.15, 0.15], [-0.15, -0.15]]) for (let i = 0; i < 3; i++) {
      const sw = Math.sin(game.time * 3 + i + f * 10) * 0.04;
      add(f + sw, s, bob - 0.12 - i * 0.12, 0.06, 0.06, 0.1, white ? "#ffffff" : "#c8a8ff");
    }
    add(0.27, 0.1, bob + 0.12, 0.05, 0.08, 0.06, m.def.eyes); add(0.27, -0.1, bob + 0.12, 0.05, 0.08, 0.06, m.def.eyes);
    flush();
    ctx.restore();
  },
});

// ===== 2단계: 번쩍 장어, 꼬마 초롱아귀, 굴렁 성게 + 새 맵 몬스터 (펭귄·문어·불가사리·꼬마 상어) =====
Object.assign(ABILITIES, {
  w2_eelLunge: { name: "번쩍 튀어나오기", desc: "구멍에서 빨간 줄을 따라 번쩍 튀어나와요. 다 나오면 멍해요.",
    counter: "빨간 줄 옆으로 한 걸음! 멍할 때(별) 때려요", tags: ["line", "move"],
    telegraph: { shape: "line", length: 5, width: 0.9, at: "self", time: 0.9 },
    cooldown: 5, range: [1.5, 5.5], damageMul: 1.4, anim: "crouch", effect: { type: "charge", speed: 12, stunOnWall: 1.6 } },
  w2_inkSquirt: { name: "먹물 찍", desc: "먹물 덩어리를 쏴서 떨어진 자리를 끈적하게 해요.", counter: "검은 원이 차기 전에 밖으로", tags: ["control", "slow"],
    telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.1 }, cooldown: 6, range: [2, 7], damageMul: 0.6, anim: "point", effect: { type: "slow", duration: 1.6 } },
  w2_starSpin: { name: "별 팽이", desc: "몸을 웅크렸다가 팽이처럼 빙글빙글 돌아요.", counter: "웅크리면 한 걸음 뒤로. 다 돌면 때려요", tags: ["melee", "area"],
    telegraph: { shape: "circle", radius: 1.6, at: "self", time: 0.75 }, cooldown: 5, range: [0, 1.6], damageMul: 1.2, anim: "crouch", effect: { type: "knockback", force: 1.1 } },
});
ELITE_RULES.notElite.push("w2_eel"); // 구멍에 숨는 장어는 순간이동·분신 같은 정예 속성이 어울리지 않아요

// ----- 행동: 구멍 숨기 (번쩍 장어) -----
BEHAVIOR_DOCS.burrower = { name: "구멍 숨기", desc: "모래 구멍에 숨어 있다가 빨간 줄을 그리고 튀어나와요. 튀어나온 뒤 잠깐 멍해요.", counter: "거품 나는 구멍을 보면 옆으로 비켜서, 멍할 때 때리기" };
const W2_EEL_DAZE = { easy: 2.2, normal: 1.6, hard: 1.35, nightmare: 1.1 };
EXTRA_BEHAVIORS.burrower = (m, p, dist, dt) => {
  if (!m.holes) {
    m.holes = [{ x: m.x, y: m.y }];
    for (let k = 0; k < 8 && m.holes.length < 3; k++) {
      const a = Math.random() * Math.PI * 2, d = 2.5 + Math.random() * 2;
      const s = findFreeSpot(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d, 0.4, 1);
      if (!s || (typeof nearStair === "function" && nearStair(s.x, s.y, 1)) || (typeof tileH === "function" && tileH(Math.floor(s.x), Math.floor(s.y)) !== tileH(Math.floor(m.x), Math.floor(m.y)))) continue;
      if (m.holes.some((h) => Math.hypot(h.x - s.x, h.y - s.y) < 1.5)) continue;
      m.holes.push({ x: s.x, y: s.y });
    }
    m.bState = "hole"; m.w2Hidden = true; m.lungeCd = 1 + Math.random();
  }
  m.lungeCd = (m.lungeCd || 0) - dt;
  m.w2Near = dist < 7;
  if (m.bState === "hole") {
    m.moving = false; m.w2Hidden = true;
    if (dist < 5.5 && dist > 1.2 && m.lungeCd <= 0 && lineOfSight(m.x, m.y, p.x, p.y)) {
      m.w2Hidden = false; faceToward(m, p); m.bState = "lunge"; m.lungeCd = 5;
      castAbility(m, "w2_eelLunge", p);
    }
    return;
  }
  if (m.bState === "lunge") {
    if (m.state === "cast" || m.charge) { m.moving = false; return; }
    m.bState = "out"; m.stunTimer = W2_EEL_DAZE[(game.profile && game.profile.difficulty) || "normal"] || 1.6;
    addFloatText(m.x, m.y, "멍~", "#ffe27a", 16);
    return;
  }
  if (m.bState === "out") { m.bState = "back"; return; } // 멍함(stunTimer)이 끝났어요 -> 구멍으로
  // back: 가장 가까운 구멍으로 헤엄쳐요 (이때는 맞아요)
  let h = m.holes[0], hd = 1e9;
  for (const q of m.holes) { const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < hd) { hd = d; h = q; } }
  if (hd < 0.35) { m.x = h.x; m.y = h.y; m.bState = "hole"; m.w2Hidden = true; m.moving = false; return; }
  moveWithSeparation(m, (h.x - m.x) / hd, (h.y - m.y) / hd, dt, 2.4);
  m.moving = true;
  m.backT = (m.backT || 0) + dt;
  if (m.backT > 4) { m.backT = 0; m.holes.push({ x: m.x, y: m.y }); } // 막혀서 못 가면 그 자리에 새 구멍
};
hookOn("untargetable", (o) => !!o.w2Hidden, 50);
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (m.w2Hidden) return true;
  if (m.bState === "out" && m.stunTimer > 0) h.dmg *= 1.25;
  return false;
}, 30);

// 꼬마 초롱아귀: 숨어 있어도 빛 구슬은 늘 보여요 (작은 불빛이 다가오면 초롱아귀)
hookOn("drawMonsterOver", (m) => {
  if (m.type !== "w2_angler" || m.hp <= 0) return;
  const S = (m.def.size || 1), fx = m.faceX, fy = m.faceY, bob = Math.sin(game.time * 3 + m.x) * 0.05;
  const x = m.x + fx * 0.45 * S, y = m.y + fy * 0.45 * S;
  drawBox(x - 0.09, y - 0.09, 0.78 * S + bob, 0.18, 0.18, 0.18, "#ffe27a");
  drawBox(x - 0.05, y - 0.05, 0.82 * S + bob, 0.1, 0.1, 0.1, "#fffbe0");
}, 50);
hookOn("lights", (lights) => {
  if (game.scene !== "dungeon") return;
  for (const m of monsters) if (m.type === "w2_angler" && m.hp > 0 && onScreen(m.x, m.y, 4)) lights.push({ x: m.x + m.faceX * 0.45, y: m.y + m.faceY * 0.45, radius: 1.0, power: 0.7 });
}, 50);

Object.assign(MONSTERS, {
  w2_eel: { name: "번쩍 장어", shape: "w2_eel", behavior: "burrower", world: 2,
    hp: 3.5, speed: 2.4, damage: 1.3, xp: 7, emerald: 0.8, color: "#c8e05a", eyes: "#1a1a1a" },
  w2_angler: { name: "꼬마 초롱아귀", shape: "w2_angler", behavior: "lurker", world: 2,
    hp: 3.5, speed: 1.9, damage: 1.3, xp: 7, emerald: 0.8, attackRange: 0.8, attackCooldown: 1.2, windup: 0.35, color: "#2a3a6a", eyes: "#ffe27a" },
  w2_urchin: { name: "굴렁 성게", shape: "w2_urchin", behavior: "charger", world: 2,
    hp: 4.5, speed: 1.5, damage: 1.4, xp: 7, emerald: 0.8, attackRange: 0.8, attackCooldown: 1.4, windup: 0.32, abilities: ["charge"], color: "#7a4ac8", eyes: "#1a1a1a" },
  w2_penguin: { name: "펭귄 썰매병", shape: "w2_penguin", behavior: "charger", world: 2,
    hp: 4, speed: 1.7, damage: 1.3, xp: 7, emerald: 0.8, attackRange: 0.8, attackCooldown: 1.3, windup: 0.3, abilities: ["charge"], color: "#2a2f3a", eyes: "#1a1a1a" },
  w2_octo: { name: "먹물 문어", shape: "w2_octo", behavior: "kite", world: 2,
    hp: 3.5, speed: 1.5, damage: 1.1, xp: 7, emerald: 0.8, attackRange: 0.8, attackCooldown: 1.4, windup: 0.3, abilities: ["w2_inkSquirt"], color: "#c86a9a", eyes: "#1a1a1a" },
  w2_starfish: { name: "빙글 불가사리", shape: "w2_starfish", behavior: "melee", world: 2,
    hp: 4.5, speed: 1.4, damage: 1.2, xp: 7, emerald: 0.8, attackRange: 0.8, attackCooldown: 1.3, windup: 0.32, abilities: ["w2_starSpin"], color: "#ff9a5a", eyes: "#1a1a1a" },
  w2_sharkling: { name: "꼬마 상어", shape: "w2_sharkling", behavior: "pounce", world: 2,
    hp: 3.5, speed: 2.5, damage: 1.4, xp: 7, emerald: 0.8, attackRange: 0.75, attackCooldown: 1.3, pounceRange: 3.4, color: "#7f95a8", eyes: "#1a1a1a" },
});

Object.assign(EXTRA_SHAPES, {
  // 번쩍 장어: 연두 긴 몸 5마디 + 파란 줄무늬. 구멍 속이면 구멍 + 눈 두 개 (+ 거품)
  w2_eel(m) {
    const { add, flush, white } = w2Parts(m);
    if (m.w2Hidden) {
      add(0, 0, 0, 0.7, 0.7, 0.02, "#2a2418"); add(0, 0, 0.01, 0.5, 0.5, 0.02, "#100c08");
      const peek = 0.04 + Math.max(0, Math.sin(game.time * 2 + m.x)) * 0.06;
      add(0.05, 0.08, peek, 0.08, 0.08, 0.08, "#ffffff"); add(0.05, -0.08, peek, 0.08, 0.08, 0.08, "#ffffff");
      flush();
      if (m.w2Near && Math.random() < 0.08) addSparkle(m.x, m.y, 0.1, { vz: 1.2, gravity: -0.2, life: 0.7, size: 0.4, hue: 190 });
      return;
    }
    const c = white ? "#ffffff" : m.def.color, st = white ? "#ffffff" : "#3a8ac8";
    const wig = (i) => Math.sin(game.time * 10 - i) * (m.moving || m.charge ? 0.12 : 0.04);
    for (let i = 4; i >= 0; i--) { const s = 0.36 - i * 0.05; add(0.3 - i * 0.3, wig(i), 0.12, s, s, s * 0.8, i % 2 ? st : c); }
    add(0.42, 0, 0.14, 0.3, 0.3, 0.26, c);
    add(0.5, 0.1, 0.32, 0.1, 0.1, 0.1, "#ffffff"); add(0.5, -0.1, 0.32, 0.1, 0.1, 0.1, "#ffffff");
    add(0.55, 0.1, 0.34, 0.05, 0.05, 0.06, m.def.eyes); add(0.55, -0.1, 0.34, 0.05, 0.05, 0.06, m.def.eyes);
    add(0.05, 0, 0.36, 0.3, 0.04, 0.08, st);
    flush();
  },
  // 꼬마 초롱아귀: 남색 둥근 몸, 큰 노란 눈, 둥근 흰 이빨 2개 (빛 구슬은 drawMonsterOver)
  w2_angler(m) {
    const { add, flush, white } = w2Parts(m);
    const c = white ? "#ffffff" : m.def.color, bob = 0.12 + Math.sin(game.time * 3 + m.x) * 0.05;
    add(0, 0, bob, 0.56, 0.5, 0.46, c); add(0.05, 0, bob - 0.02, 0.46, 0.42, 0.08, white ? "#ffffff" : "#3a5a8a");
    add(0.26, 0.13, bob + 0.28, 0.14, 0.14, 0.14, "#ffffff"); add(0.26, -0.13, bob + 0.28, 0.14, 0.14, 0.14, "#ffffff");
    add(0.32, 0.13, bob + 0.3, 0.06, 0.07, 0.08, m.def.eyes); add(0.32, -0.13, bob + 0.3, 0.06, 0.07, 0.08, m.def.eyes);
    add(0.3, 0.07, bob + 0.06, 0.06, 0.06, 0.06, "#ffffff"); add(0.3, -0.07, bob + 0.06, 0.06, 0.06, 0.06, "#ffffff");
    add(0.12, 0, bob + 0.46, 0.04, 0.04, 0.18, c); add(0.26, 0, bob + 0.6, 0.2, 0.04, 0.04, c);
    add(-0.32, 0, bob + 0.18, 0.12, 0.3, 0.14, c);
    flush();
  },
  // 굴렁 성게: 보라 공 + 뭉툭한 뿔 젤리 8개 (굴러올 땐 빙글)
  w2_urchin(m) {
    const { add, flush, white } = w2Parts(m);
    const c = white ? "#ffffff" : m.def.color, sp = white ? "#ffffff" : "#b08aff";
    const rot = m.charge ? game.time * 14 : Math.sin(game.time * 2) * 0.2;
    add(0, 0, 0.12, 0.55, 0.55, 0.5, c);
    for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4; add(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.28 + (i % 2) * 0.12, 0.14, 0.14, 0.14, sp); }
    add(0, 0, 0.62, 0.14, 0.14, 0.12, sp);
    add(0.28, 0.11, 0.38, 0.1, 0.1, 0.1, "#ffffff"); add(0.28, -0.11, 0.38, 0.1, 0.1, 0.1, "#ffffff");
    add(0.32, 0.11, 0.4, 0.05, 0.05, 0.06, m.def.eyes); add(0.32, -0.11, 0.4, 0.05, 0.05, 0.06, m.def.eyes);
    flush();
  },
  // 펭귄 썰매병: 검은 등, 흰 배, 주황 부리·발, 작은 털모자. 돌진하면 배를 깔고 쭉
  w2_penguin(m) {
    const { add, flush, white } = w2Parts(m);
    const c = white ? "#ffffff" : m.def.color, belly = "#f4f8fb", or = white ? "#ffffff" : "#ffa63a";
    if (m.charge) {
      add(0, 0, 0.05, 0.75, 0.42, 0.3, c); add(0.02, 0, 0.02, 0.6, 0.34, 0.05, belly);
      add(0.42, 0, 0.12, 0.14, 0.12, 0.08, or); add(0.3, 0.1, 0.24, 0.08, 0.08, 0.08, "#ffffff"); add(0.3, -0.1, 0.24, 0.08, 0.08, 0.08, "#ffffff");
      add(0.1, 0, 0.36, 0.2, 0.2, 0.1, "#e04a4a");
      flush(); return;
    }
    const w = m.moving ? Math.sin(m.walkTime * 14) * 0.04 : 0;
    add(0.1, 0.1, 0, 0.16, 0.12, 0.06, or); add(0.1, -0.1, 0, 0.16, 0.12, 0.06, or);
    add(0, 0, 0.06, 0.44, 0.42, 0.62, c); add(0.18, 0, 0.1, 0.1, 0.32, 0.5, belly);
    add(0, 0.26, 0.24 + w, 0.18, 0.06, 0.32, c); add(0, -0.26, 0.24 - w, 0.18, 0.06, 0.32, c);
    add(0.24, 0, 0.5, 0.14, 0.1, 0.07, or);
    add(0.2, 0.1, 0.58, 0.07, 0.07, 0.07, "#ffffff"); add(0.2, -0.1, 0.58, 0.07, 0.07, 0.07, "#ffffff");
    add(0.23, 0.1, 0.59, 0.03, 0.04, 0.05, m.def.eyes); add(0.23, -0.1, 0.59, 0.03, 0.04, 0.05, m.def.eyes);
    add(0, 0, 0.68, 0.36, 0.36, 0.1, "#e04a4a"); add(0, 0, 0.78, 0.12, 0.12, 0.1, "#ffffff");
    flush();
  },
  // 먹물 문어: 분홍 둥근 머리 + 다리 6개 살랑
  w2_octo(m) {
    const { add, flush, white } = w2Parts(m);
    const c = white ? "#ffffff" : m.def.color, dk = white ? "#ffffff" : "#a04a7a";
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, sw = Math.sin(game.time * 4 + i) * 0.05; add(Math.cos(a) * 0.3 + sw, Math.sin(a) * 0.3, 0.02, 0.12, 0.12, 0.16, dk); add(Math.cos(a) * 0.42, Math.sin(a) * 0.42 + sw, 0, 0.09, 0.09, 0.08, dk); }
    add(0, 0, 0.16, 0.5, 0.5, 0.48, c); add(-0.06, 0, 0.62, 0.36, 0.36, 0.1, c);
    add(0.25, 0.12, 0.36, 0.1, 0.12, 0.12, "#ffffff"); add(0.25, -0.12, 0.36, 0.1, 0.12, 0.12, "#ffffff");
    add(0.3, 0.12, 0.38, 0.05, 0.06, 0.07, m.def.eyes); add(0.3, -0.12, 0.38, 0.05, 0.06, 0.07, m.def.eyes);
    add(0.27, 0, 0.24, 0.06, 0.1, 0.06, dk);
    flush();
  },
  // 빙글 불가사리: 주황 별 다섯 팔 (돌 때 빙글)
  w2_starfish(m) {
    const { add, flush, white } = w2Parts(m);
    const c = white ? "#ffffff" : m.def.color, dots = white ? "#ffffff" : "#ffd0a0";
    const spin = m.state === "cast" ? game.time * 16 : Math.sin(game.time * 1.5 + m.x) * 0.15;
    add(0, 0, 0.1, 0.34, 0.34, 0.2, c);
    for (let i = 0; i < 5; i++) { const a = spin + i * Math.PI * 2 / 5; add(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0.1, 0.2, 0.2, 0.16, c); add(Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0.1, 0.13, 0.13, 0.12, c); add(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.26, 0.05, 0.05, 0.04, dots); }
    add(0.1, 0.08, 0.3, 0.08, 0.08, 0.08, "#ffffff"); add(0.1, -0.08, 0.3, 0.08, 0.08, 0.08, "#ffffff");
    add(0.13, 0.08, 0.32, 0.04, 0.04, 0.05, m.def.eyes); add(0.13, -0.08, 0.32, 0.04, 0.04, 0.05, m.def.eyes);
    flush();
  },
  // 꼬마 상어: 회색 몸, 흰 배, 등지느러미, 둥근 웃는 입 (이빨은 둥근 흰 블록)
  w2_sharkling(m) {
    const { add, flush, white } = w2Parts(m);
    const c = white ? "#ffffff" : m.def.color, z = m.state === "leap" ? 0.35 : 0.14, wig = Math.sin(game.time * 9) * (m.moving ? 0.08 : 0.03);
    add(0, 0, z, 0.7, 0.36, 0.34, c); add(0.04, 0, z - 0.02, 0.6, 0.3, 0.08, "#f0f4f8");
    add(0.38, 0, z + 0.02, 0.18, 0.3, 0.28, c);
    add(-0.42, wig, z + 0.06, 0.16, 0.08, 0.22, c); add(-0.52, wig * 1.4, z + 0.04, 0.08, 0.2, 0.3, c);
    add(-0.02, 0, z + 0.34, 0.2, 0.06, 0.2, c);
    add(0, 0.2, z + 0.06, 0.16, 0.12, 0.05, c); add(0, -0.2, z + 0.06, 0.16, 0.12, 0.05, c);
    add(0.38, 0.12, z + 0.22, 0.08, 0.08, 0.08, "#ffffff"); add(0.38, -0.12, z + 0.22, 0.08, 0.08, 0.08, "#ffffff");
    add(0.42, 0.12, z + 0.23, 0.04, 0.04, 0.05, m.def.eyes); add(0.42, -0.12, z + 0.23, 0.04, 0.04, 0.05, m.def.eyes);
    add(0.47, 0.05, z + 0.08, 0.05, 0.05, 0.05, "#ffffff"); add(0.47, -0.05, z + 0.08, 0.05, 0.05, 0.05, "#ffffff");
    flush();
  },
});
