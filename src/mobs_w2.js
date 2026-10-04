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
