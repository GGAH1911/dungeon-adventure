// ===== 월드 4 "지하세계" 몬스터 11종 (설계서 docs/design/world4-underworld.md 4장) =====
// 새 행동은 없어요: 있는 행동(melee·burrower·flyer·shieldbearer·charger·miner·kite·support)을 다시 써요.
//   꼬마 두더지만 burrower 를 조금 바꿔 써요 (구멍 대신 땅속으로 다가와 흙 원 예고 뒤 튀어나와요. 켜진 빛 수정 안에선 못 숨어요: w4Lit)
// 수치는 맵 레벨 1 기준 (좀비 = 체력 3, 속도 1.7, 공격 1). 모양은 블록, 큰 눈, 무섭지 않게 (해골 없음).
// under.js 의 임시 몬스터(w4Placeholder)를 이 파일이 진짜 정의로 덮어써요.

// ----- 기술 (기존 효과만: knockback·slow·charge·burn) -----
Object.assign(ABILITIES, {
  w4_dirtPop: { name: "흙 펑", desc: "땅속 두더지가 흙을 들썩이다가 펑 튀어나와요.", counter: "흙 원이 차기 전에 밖으로, 튀어나와 멍할 때 때려요",
    tags: ["area", "ground"], telegraph: { shape: "circle", radius: 1.0, at: "self", time: 0.95 }, cooldown: 99, range: [0, 99], damageMul: 1.0,
    anim: "crouch", effect: { type: "knockback", force: 0.6 } },
  w4_sporePuff: { name: "포자 펑", desc: "버섯돌이가 부풀다가 분홍 포자를 펑! 포자 속은 느려요. 터지면 버섯돌이도 사라져요.",
    counter: "분홍 원 밖으로! 먼저 때려 잡으면 안 터져요", tags: ["area", "explode"],
    telegraph: { shape: "circle", radius: 1.6, at: "self", time: 1.1 }, cooldown: 99, range: [0, 1.5], damageMul: 0.4,
    anim: "crouch", interruptible: true, interruptAt: 0.5, effect: { type: "slow", duration: 1.5 } },
  w4_horn: { name: "수정 뿔 돌진", desc: "등의 수정이 반짝이면 뿔을 앞세워 쭉 달려와요. 다 달리면 어지러워해요.",
    counter: "빨간 길 옆으로! 멈춰서 어지러울 때 때려요 (벽에 박히면 더 오래)", tags: ["line", "move"],
    telegraph: { shape: "line", length: 6, width: 1.2, at: "self", time: 1.2 }, cooldown: 7, range: [2.2, 6], damageMul: 1.6,
    anim: "crouch", effect: { type: "charge", speed: 8, stunOnWall: 3.0 } },
  w4_emberShot: { name: "불씨 쏘기", desc: "불꼬마가 불씨를 한 줄로 쏴요. 조준선이 따라오다 멈춰요. 맞으면 잠깐 뜨거워요.",
    counter: "조준선이 멈추면(하얗게 번쩍) 옆으로 한 걸음!", tags: ["line", "ranged"],
    telegraph: { shape: "line", length: 7, width: 0.6, at: "self", time: 2.0, follow: true }, cooldown: 5, range: [3, 7], damageMul: 1.3,
    anim: "point", effect: { type: "burn", duration: 2, tick: 0.5, tickMul: 0.2 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_dirtPop: { text: "흙이 들썩! 원 밖으로" },
  w4_sporePuff: { text: "분홍 포자! 원 밖으로" },
  w4_horn: { text: "수정 뿔 돌진! 길 옆으로" },
  w4_emberShot: { text: "불씨 조준! 멈추면 옆으로" },
});

// ----- 몬스터 -----
// 같은 행동을 쓰는 몬스터에서 행동에 필요한 값만 빌려 와요 (기술·모습·무기는 빌리지 않아요)
const W4_MON = (base, o) => {
  const d = { ...(MONSTERS[base] || {}) };
  for (const k of ["abilities", "look", "weapon", "w3Placeholder", "w4Placeholder", "codexSkip", "world", "floaty", "heavy", "frontShield", "dizzyAfterCharge", "light", "size", "armsForward", "emeraldCount"]) delete d[k];
  return { ...d, ...o, world: 4 };
};
Object.assign(MONSTERS, {
  w4_glowbug: W4_MON("bat", { name: "반딧불 벌레", shape: "w4_glowbug", behavior: "melee", floaty: true, w4Glow: 0.5,
    hp: 2.0, speed: 1.3, damage: 0.8, xp: 6, emerald: 0.7, attackRange: 0.7, attackCooldown: 1.5, windup: 0.4, color: "#4a5a3a", eyes: "#1a1a1a" }),
  w4_mole: W4_MON("w2_eel", { name: "꼬마 두더지", shape: "w4_mole", behavior: "burrower", w4Dig: true,
    hp: 3.2, speed: 1.8, damage: 1.0, xp: 7, emerald: 0.8, attackRange: 0.75, attackCooldown: 1.3, windup: 0.35, color: "#8a5a3a", eyes: "#1a1a1a" }),
  w4_shroomling: W4_MON("zombie", { name: "포자 버섯돌이", shape: "w4_shroomling", behavior: "melee",
    hp: 2.4, speed: 1.6, damage: 0.4, xp: 6, emerald: 0.7, attackRange: 0.6, attackCooldown: 1.6, windup: 0.4, abilities: ["w4_sporePuff"], color: "#ff8ac8", eyes: "#2a1a2a" }),
  w4_batling: W4_MON("bat", { name: "동굴 박쥐", shape: "bat", behavior: "flyer",
    hp: 2.0, speed: 2.4, damage: 0.8, xp: 5, emerald: 0.6, color: "#6a3a9a", eyes: "#ffe27a" }),
  w4_rockcrab: W4_MON("w2_turtle", { name: "바위 게", shape: "w4_rockcrab", behavior: "shieldbearer", frontShield: true, heavy: true,
    hp: 6.0, speed: 1.2, damage: 1.2, xp: 9, emerald: 0.9, armor: 0.15, attackRange: 0.85, attackCooldown: 1.4, windup: 0.38, color: "#d8643a", eyes: "#1a1a1a" }),
  w4_lavaslug: W4_MON("zombie", { name: "용암 민달팽이", shape: "w4_lavaslug", behavior: "melee", lavaWalk: true, w4Trail: true,
    hp: 4.0, speed: 1.0, damage: 1.2, xp: 8, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.5, windup: 0.42, color: "#ff8a2a", eyes: "#2a1a10" }),
  w4_crystalbug: W4_MON("w2_urchin", { name: "수정 딱정벌레", shape: "w4_crystalbug", behavior: "charger", heavy: true, dizzyAfterCharge: 2.0,
    hp: 4.5, speed: 1.6, damage: 1.6, xp: 9, emerald: 0.9, armor: 0.2, attackRange: 0.8, attackCooldown: 1.4, windup: 0.34, abilities: ["w4_horn"], color: "#4a3a6a", eyes: "#ffe27a" }),
  w4_goblinMiner: W4_MON("miner", { name: "꼬마 광부 도깨비", shape: "human", behavior: "miner", w4Horn: "#ffe0a0", emeraldCount: 2,
    hp: 4.0, speed: 1.7, damage: 1.2, xp: 8, emerald: 0.9,
    weapon: { type: "pick", color: "#cfd6dd", length: 0.55 },
    look: { skin: "#7fc0e0", hair: "#3a5a8a", shirt: "#c8843a", pants: "#5a4030", eyes: "#1a1a1a", helmet: "#e0b43a" } }),
  w4_imp: W4_MON("w2_shrimp", { name: "불꼬마", shape: "w4_imp", behavior: "kite", lavaWalk: true, floaty: true, w4Glow: 0.4,
    hp: 2.6, speed: 2.0, damage: 1.0, xp: 7, emerald: 0.8, abilities: ["w4_emberShot"], color: "#ff7a2a", eyes: "#2a1a10" }),
  w4_stoneguard: W4_MON("w2_turtle", { name: "석상 병사", shape: "human", behavior: "shieldbearer", frontShield: true, heavy: true,
    hp: 8.0, speed: 1.0, damage: 1.5, xp: 10, emerald: 1, armor: 0.25, attackRange: 0.95, attackCooldown: 1.5, windup: 0.42, abilities: ["slam"],
    weapon: { type: "sword", color: "#a8a49a", length: 1.0, shield: "#8a867c" },
    look: { skin: "#b0aca2", hair: "#8a867c", shirt: "#9a968c", pants: "#7a766c", eyes: "#7fe0c0", helmet: "#8a867c" } }),
  w4_dokkaebiKid: W4_MON("w2_seahorse", { name: "꼬마 도깨비", shape: "human", behavior: "support", w4Horn: "#fff2c0",
    hp: 3.5, speed: 1.9, damage: 0.8, xp: 8, emerald: 0.9, attackRange: 0.7, attackCooldown: 1.4, windup: 0.3, abilities: ["healAllies"],
    weapon: { type: "sword", color: "#a8703a", length: 0.6 },
    look: { skin: "#6ac8a0", hair: "#2a6a8a", shirt: "#f2c040", pants: "#3a5aa0", eyes: "#1a1a1a" } }),
});
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push("w4_mole"); // 땅속 두더지는 순간이동·분신 정예 속성이 어울리지 않아요

// ----- 꼬마 두더지: 땅속으로 다가와 흙 펑 (burrower 의 두더지판) -----
//   under: 숨어서(맞지 않아요) 흙더미가 주인공 쪽으로 다가와요. 가까우면 pop: 흙 원 예고(w4_dirtPop) 뒤 튀어나와 멍해요.
//   켜진 빛 수정 안(w4Lit)에선 숨을 수 없어요: 숨어 있다 빛에 들어오면 "들켰다!" 하고 튀어나와 멍해요. 빛 안에선 다시 못 숨어요.
const W4_MOLE_DAZE = { easy: 2.2, normal: 1.6, hard: 1.35, nightmare: 1.1 };
function w4MoleDaze() { return W4_MOLE_DAZE[(game.profile && game.profile.difficulty) || "normal"] || 1.6; }
function w4MoleLit(m) { return typeof w4Lit === "function" && w4Lit(m.x, m.y); }
// 빛에 들켰어요: 튀어나와 멍해요
function w4MoleCaught(m) {
  m.w2Hidden = false; m.digState = "dazed"; m.stunTimer = w4MoleDaze() * 1.2; m.moving = false;
  addFloatText(m.x, m.y, "들켰다!", "#ffe27a", 18);
}
// 숨은 두더지가 맞아서 멍한 채 밀려 빛에 들어오면 행동 차례가 없어도 바로 들켜요 (방장 기기)
hookOn("dungeonTick", () => {
  if (typeof netGuest === "function" && netGuest()) return;
  for (const m of monsters) if (m.hp > 0 && m.w2Hidden && m.def && m.def.w4Dig && w4MoleLit(m)) w4MoleCaught(m);
}, 54);
const W4_BURROWER_BASE = EXTRA_BEHAVIORS.burrower;
EXTRA_BEHAVIORS.burrower = (m, p, dist, dt) => {
  if (!m.def || !m.def.w4Dig) return W4_BURROWER_BASE(m, p, dist, dt);
  if (!m.digState) { m.digState = "under"; m.w2Hidden = !w4MoleLit(m); m.digCd = 1 + Math.random(); if (!m.w2Hidden) m.digState = "walk"; }
  m.digCd = (m.digCd || 0) - dt;
  if (m.digState === "under") {
    const caught = () => w4MoleCaught(m);
    if (w4MoleLit(m)) { caught(); return; }
    m.w2Hidden = true;
    if (dist < 1.1 && m.digCd <= 0) {
      m.w2Hidden = false; m.digState = "pop"; m.moving = false; faceToward(m, p);
      castAbility(m, "w4_dirtPop", p);
      return;
    }
    chaseMove(m, p, dist, dt, 1.1);
    if (w4MoleLit(m)) { caught(); return; } // 움직여서 빛 안에 들어왔으면 바로 (숨은 채 빛 안에 있는 순간이 없게)
    m.dirtT = (m.dirtT || 0) - dt;
    if (m.moving && m.dirtT <= 0) { m.dirtT = 0.3; spawnDust(m.x, m.y); }
    return;
  }
  if (m.digState === "pop") {
    if (m.state === "cast") { m.moving = false; return; }
    m.digState = "dazed"; m.stunTimer = w4MoleDaze();
    addFloatText(m.x, m.y, "멍~", "#ffe27a", 16);
    return;
  }
  if (m.digState === "dazed") { m.digState = "walk"; m.walkT = 2.5; return; } // 멍함(stunTimer)이 끝났어요
  // walk: 땅 위에서 잠깐 싸우다가 다시 땅속으로 (빛 안이면 못 들어가요)
  m.w2Hidden = false;
  m.walkT = (m.walkT || 0) - dt;
  updateMelee(m, p, dist, dt);
  if (m.walkT <= 0 && m.state !== "windup") {
    if (w4MoleLit(m)) { m.walkT = 1.2; if (!(m.litMsgT > game.time)) { m.litMsgT = game.time + 4; addFloatText(m.x, m.y, "눈부셔서 못 숨어!", "#ffe27a", 14); } }
    else { m.digState = "under"; m.w2Hidden = true; m.digCd = 2.5; spawnDust(m.x, m.y); }
  }
};

// ----- 포자 버섯돌이: 포자 펑이 터지면 버섯돌이도 사라져요 -----
hookOn("castResolved", (c) => {
  if (!c || c.id !== "w4_sporePuff" || !c.m || c.m.hp <= 0) return;
  const m = c.m;
  spawnBurst(m.x, m.y, ["#ff9ad6", "#ffd6ee", "#ffffff"], 22);
  m.shieldHp = 0;
  damageMonster(m, m.hp + 1, m.x, m.y, false, 0, { dot: true });
}, 50);

// ----- 수정 딱정벌레: charger 행동은 "charge" 쿨다운을 보고 물러서요. 뿔 돌진 쿨다운을 같은 칸에 비춰 줘요 -----
hookOn("abilitiesUpdated", () => {
  for (const m of monsters) if (m.type === "w4_crystalbug" && m.abCd) m.abCd.charge = m.abCd.w4_horn || 0;
}, 40);

// ----- 용암 민달팽이: 지나간 자리에 작은 불길 2초 (정예 속성 불꽃 발자국과 같은 불) -----
hookOn("dungeonTick", (dt) => {
  for (const m of monsters) {
    if (!m.def || !m.def.w4Trail || m.hp <= 0) continue;
    m.trailT = (m.trailT || 0) - dt;
    if (m.moving && m.trailT <= 0) { m.trailT = 0.4; addHazard({ kind: "fire", x: m.x, y: m.y, radius: 0.42, life: 2.0, tick: 0.7, owner: m, dmgMul: 0.3 }); }
  }
}, 55);

// ----- 빛: 반딧불 벌레·불꼬마는 스스로 작은 빛 (어두운 맵의 길잡이) -----
hookOn("lights", (lights) => {
  if (game.scene !== "dungeon") return;
  for (const m of monsters) if (m.def && m.def.w4Glow && m.hp > 0 && onScreen(m.x, m.y, 3)) lights.push({ x: m.x, y: m.y, radius: 1.2, power: m.def.w4Glow, color: m.type === "w4_imp" ? "#ffb04a" : "#d8ff7a" });
}, 56);

// ----- 도깨비 뿔 (사람 모양 몬스터 머리 위에 뿔 하나) -----
hookOn("drawMonsterOver", (m) => {
  if (!m.def || !m.def.w4Horn || m.hp <= 0) return;
  const S = (m.def.size || 1) * (m.scaleMul || 1), bob = m.moving ? Math.abs(Math.sin(m.walkTime * 11)) * 0.045 : 0;
  drawBox(m.x - 0.05 * S, m.y - 0.05 * S, (1.12 + bob) * S, 0.1 * S, 0.1 * S, 0.12 * S, m.def.w4Horn);
  drawBox(m.x - 0.03 * S, m.y - 0.03 * S, (1.24 + bob) * S, 0.06 * S, 0.06 * S, 0.06 * S, m.def.w4Horn);
}, 50);

// ----- 모양 -----
const w4Parts = (m) => w3Parts(m); // 블록 몸 그리기 도우미 (mobs_w3.js 와 같은 것)
Object.assign(EXTRA_SHAPES, {
  // 반딧불 벌레: 둥근 몸 + 날개 + 빛나는 엉덩이
  w4_glowbug(m) {
    const { add, eyes, flush } = w4Parts(m), bob = 0.4 + Math.sin(game.time * 4 + m.x) * 0.06, c = m.def.color, flap = Math.sin(game.time * 22) * 0.06;
    add(0.06, 0, bob, 0.26, 0.26, 0.22, c);
    add(-0.18, 0, bob - 0.02, 0.22, 0.24, 0.2, "#e8ff7a"); add(-0.18, 0, bob + 0.18, 0.12, 0.12, 0.04, "#ffffff");
    add(0, 0.16, bob + 0.18 + flap, 0.18, 0.12, 0.03, "#cfe8ff"); add(0, -0.16, bob + 0.18 - flap, 0.18, 0.12, 0.03, "#cfe8ff");
    add(0.18, 0.05, bob + 0.24, 0.02, 0.02, 0.1, "#2a2a1a"); add(0.18, -0.05, bob + 0.24, 0.02, 0.02, 0.1, "#2a2a1a");
    eyes(0.2, 0.07, bob + 0.08, 0.07, m.def.eyes);
    flush();
  },
  // 꼬마 두더지: 갈색 통통 + 분홍 코 + 큰 손. 땅속이면 흙더미만 (흔들흔들)
  w4_mole(m) {
    const { add, eyes, flush } = w4Parts(m);
    if (m.w2Hidden) {
      const wob = Math.sin(game.time * 9 + m.x) * 0.02;
      add(0, 0, 0, 0.46, 0.42, 0.12 + wob, "#7a5a3a"); add(0.04, 0.02, 0.1, 0.26, 0.24, 0.08 + wob, "#9a7450"); add(-0.12, -0.1, 0.02, 0.12, 0.12, 0.08, "#5a4028");
      flush(); return;
    }
    const c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 12) * 0.03 : 0;
    add(0, 0, 0.04, 0.42, 0.4, 0.36, c);
    add(0.06, 0, 0.12, 0.3, 0.3, 0.2, "#c89a70"); // 배
    add(0.22, 0, 0.26, 0.08, 0.1, 0.08, "#ff9ab0"); // 코
    add(0.18, 0.2, 0.12 + w, 0.16, 0.14, 0.06, "#ffc8b0"); add(0.18, -0.2, 0.12 - w, 0.16, 0.14, 0.06, "#ffc8b0"); // 큰 손
    eyes(0.2, 0.08, 0.32, 0.06, m.def.eyes);
    flush();
  },
  // 포자 버섯돌이: 분홍 갓 + 흰 점 + 크림 줄기 + 짧은 다리. 포자 펑 준비 땐 갓이 부풀어요
  w4_shroomling(m) {
    const { add, eyes, flush } = w4Parts(m), w = m.moving ? Math.sin(m.walkTime * 14) * 0.03 : 0;
    const puff = m.state === "cast" ? 1 + 0.25 * Math.abs(Math.sin(game.time * 14)) : 1, c = m.def.color;
    add(0.04, 0.07, w, 0.08, 0.08, 0.12, "#e8d8b8"); add(0.04, -0.07, -w, 0.08, 0.08, 0.12, "#e8d8b8");
    add(0, 0, 0.1, 0.24, 0.24, 0.24, "#fff0d8");
    add(0, 0, 0.32, 0.46 * puff, 0.46 * puff, 0.18 * puff, c);
    for (const [f, s] of [[0.12, 0.1], [-0.08, -0.14], [-0.1, 0.12], [0.14, -0.08]]) add(f * puff, s * puff, 0.32 + 0.18 * puff, 0.08, 0.08, 0.03, "#ffffff");
    eyes(0.12, 0.06, 0.18, 0.06, m.def.eyes);
    flush();
  },
  // 바위 게: 주황 몸 + 등에 회색 바위 + 큰 집게(앞 방패)
  w4_rockcrab(m) {
    const { add, eyes, flush } = w4Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 16) * 0.04 : 0;
    for (const f of [0.12, -0.04, -0.18]) for (const sd of [1, -1]) add(f, sd * 0.26, 0.02 + (sd > 0 ? w : -w), 0.06, 0.16, 0.06, "#b04a2a");
    add(0, 0, 0.08, 0.46, 0.44, 0.18, c);
    add(-0.06, 0, 0.26, 0.36, 0.34, 0.2, "#8a8680"); add(-0.02, 0.06, 0.44, 0.2, 0.18, 0.1, "#a8a49e"); add(-0.14, -0.1, 0.4, 0.12, 0.12, 0.08, "#6a6660");
    add(0.3, 0.16, 0.12, 0.18, 0.16, 0.18, "#e8743a"); add(0.3, -0.16, 0.12, 0.18, 0.16, 0.18, "#e8743a"); // 큰 집게
    add(0.22, 0.06, 0.28, 0.03, 0.03, 0.1, "#b04a2a"); add(0.22, -0.06, 0.28, 0.03, 0.03, 0.1, "#b04a2a");
    eyes(0.24, 0.06, 0.36, 0.06, m.def.eyes);
    flush();
  },
  // 용암 민달팽이: 길쭉한 주황 젤리 몸 + 노란 무늬 + 눈 더듬이
  w4_lavaslug(m) {
    const { add, eyes, flush } = w4Parts(m), c = m.def.color, sq = m.moving ? 1 + Math.sin(m.walkTime * 6) * 0.06 : 1;
    add(-0.04, 0, 0.02, 0.6 * sq, 0.32, 0.18, c);
    add(0.12, 0, 0.12, 0.26, 0.28, 0.16, "#ffa84a");
    add(-0.1, 0.06, 0.2, 0.1, 0.08, 0.02, "#ffe27a"); add(-0.22, -0.06, 0.18, 0.08, 0.08, 0.02, "#ffe27a");
    add(0.22, 0.07, 0.28, 0.03, 0.03, 0.14, "#ff8a2a"); add(0.22, -0.07, 0.28, 0.03, 0.03, 0.14, "#ff8a2a");
    eyes(0.22, 0.07, 0.42, 0.06, m.def.eyes);
    flush();
  },
  // 수정 딱정벌레: 보라 등딱지 + 등에 하늘색 수정 + 앞 뿔. 돌진 준비 땐 수정이 하얗게
  w4_crystalbug(m) {
    const { add, eyes, flush } = w4Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 16) * 0.04 : 0;
    const shine = m.state === "cast" ? "#ffffff" : "#9fe8ff";
    for (const f of [0.1, -0.06, -0.2]) for (const sd of [1, -1]) add(f, sd * 0.24, 0.02 + (sd > 0 ? w : -w), 0.06, 0.12, 0.08, "#2a2040");
    add(0, 0, 0.08, 0.5, 0.4, 0.2, c);
    add(0.28, 0, 0.12, 0.16, 0.24, 0.14, "#3a2e58");
    add(0.42, 0, 0.18, 0.16, 0.06, 0.06, "#e8e0ff"); // 뿔
    add(-0.08, 0.08, 0.28, 0.1, 0.1, 0.22, shine); add(0.06, -0.06, 0.28, 0.08, 0.08, 0.16, "#c8a8ff"); add(-0.18, -0.06, 0.28, 0.08, 0.08, 0.14, shine);
    eyes(0.34, 0.07, 0.2, 0.06, m.def.eyes);
    flush();
  },
  // 불꼬마: 동그란 불덩이 + 흔들리는 불꽃 머리 + 작은 뿔 둘 + 큰 눈
  w4_imp(m) {
    const { add, eyes, flush } = w4Parts(m), bob = 0.3 + Math.sin(game.time * 5 + m.x) * 0.06, c = m.def.color, fl = Math.sin(game.time * 12 + m.y) * 0.04;
    add(0, 0, bob, 0.34, 0.34, 0.3, c);
    add(0.04, 0, bob + 0.06, 0.24, 0.26, 0.18, "#ffb04a");
    add(-0.04, 0, bob + 0.3, 0.2, 0.2, 0.12 + fl, "#ffd84a"); add(-0.08, 0, bob + 0.42 + fl, 0.1, 0.1, 0.1, "#fff2a0");
    add(0.04, 0.12, bob + 0.3, 0.05, 0.05, 0.08, "#c84a1a"); add(0.04, -0.12, bob + 0.3, 0.05, 0.05, 0.08, "#c84a1a");
    eyes(0.16, 0.08, bob + 0.14, 0.08, m.def.eyes);
    flush();
  },
});
