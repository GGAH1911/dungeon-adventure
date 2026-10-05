// ===== 월드 5 "공허" 몬스터 8종 (설계서 docs/design/world5-void.md 4장) =====
// 새 행동은 없어요: 있는 행동(melee·charger·flyer·kite·shieldbearer)을 다시 써요.
// 그림자 몬스터(w5Shade): 늘 흐릿하게(알파 0.3) 보이고 받는 피해 0.4배. 색 수정 빛·종소리에 들키면(w5Revealed) 또렷 + 1초 깜짝, 피해 그대로.
//   (공격 준비·예고 중에는 늘 또렷해요: 예고는 숨기지 않아요)
// 수치는 맵 레벨 1 기준 (좀비 = 체력 3, 속도 1.7, 공격 1). 모양은 블록, 큰 눈, 무섭지 않게.

Object.assign(ABILITIES, {
  w5_hop: { name: "먼지 깡충 돌진", desc: "먼지 토끼가 웅크렸다가 쭉 뛰어와요. 다 뛰면 어지러워해요.", counter: "빨간 길 옆으로! 어지러울 때 때려요",
    tags: ["line", "move"], telegraph: { shape: "line", length: 5, width: 1.1, at: "self", time: 1.1 }, cooldown: 6, range: [2, 5], damageMul: 1.4,
    anim: "crouch", effect: { type: "charge", speed: 7.5, stunOnWall: 2.5 } },
  w5_grayShot: { name: "회색 등불 쏘기", desc: "등불 유령이 회색 빛을 한 줄로 쏴요. 조준선이 따라오다 멈춰요. 맞으면 잠깐 느려요.", counter: "조준선이 멈추면 옆으로 한 걸음!",
    tags: ["line", "ranged"], telegraph: { shape: "line", length: 7, width: 0.6, at: "self", time: 2.0, follow: true }, cooldown: 5, range: [3, 7], damageMul: 1.2,
    anim: "point", effect: { type: "slow", duration: 1.5 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w5_hop: { text: "먼지 돌진! 길 옆으로" },
  w5_grayShot: { text: "조준선이 멈추면 옆으로" },
});

// 같은 행동을 쓰는 몬스터에서 행동에 필요한 값만 빌려 와요 (기술·모습·무기는 빌리지 않아요)
const W5_MON = (base, o) => {
  const d = { ...(MONSTERS[base] || MONSTERS.zombie || {}) };
  for (const k of ["abilities", "look", "weapon", "w3Placeholder", "w4Placeholder", "codexSkip", "world", "floaty", "heavy", "frontShield", "dizzyAfterCharge", "light", "size", "armsForward", "emeraldCount", "w3Shadow", "w4Dig", "w4Glow", "lavaWalk"]) delete d[k];
  return { ...d, ...o, world: 5 };
};
Object.assign(MONSTERS, {
  w5_wisp: W5_MON("bat", { name: "회색 반딧별", shape: "w5_wisp", behavior: "melee", floaty: true, light: 0.35,
    hp: 2.2, speed: 1.4, damage: 0.8, xp: 6, emerald: 0.7, attackRange: 0.7, attackCooldown: 1.5, windup: 0.42, color: "#c8c4d8", eyes: "#2a2240" }),
  w5_dustBunny: W5_MON("w2_urchin", { name: "먼지 토끼", shape: "w5_dustBunny", behavior: "charger", dizzyAfterCharge: 2.0,
    hp: 3.4, speed: 1.9, damage: 1.2, xp: 8, emerald: 0.8, attackRange: 0.75, attackCooldown: 1.3, windup: 0.36, abilities: ["w5_hop"], color: "#b0aab8", eyes: "#1a1626" }),
  w5_echoBat: W5_MON("bat", { name: "메아리 박쥐", shape: "bat", behavior: "flyer",
    hp: 2.2, speed: 2.4, damage: 0.9, xp: 6, emerald: 0.6, color: "#6a6488", eyes: "#d8c8ff" }),
  w5_grayJelly: W5_MON("zombie", { name: "회색 젤리", shape: "w5_grayJelly", behavior: "melee",
    hp: 5.5, speed: 1.2, damage: 1.2, xp: 9, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.5, windup: 0.42, color: "#9a96aa", eyes: "#1a1626" }),
  w5_lampGhost: W5_MON("w2_shrimp", { name: "등불 유령", shape: "w5_lampGhost", behavior: "kite", floaty: true, light: 0.4,
    hp: 2.8, speed: 1.9, damage: 1.0, xp: 8, emerald: 0.8, abilities: ["w5_grayShot"], color: "#d8d4e8", eyes: "#2a2240" }),
  w5_hushTurtle: W5_MON("w2_turtle", { name: "고요 거북", shape: "w5_hushTurtle", behavior: "shieldbearer", frontShield: true, heavy: true,
    hp: 7.0, speed: 1.1, damage: 1.3, xp: 10, emerald: 1, armor: 0.18, attackRange: 0.85, attackCooldown: 1.4, windup: 0.4, color: "#8a8a9a", eyes: "#1a1626" }),
  w5_shadeKid: W5_MON("zombie", { name: "그림자 꼬마", shape: "w5_shadeKid", behavior: "melee", w5Shade: true,
    hp: 3.6, speed: 1.9, damage: 1.0, xp: 9, emerald: 1, attackRange: 0.7, attackCooldown: 1.3, windup: 0.38, color: "#2e2846", eyes: "#9fe8ff" }),
  w5_shadeKnight: W5_MON("w2_turtle", { name: "그림자 기사", shape: "human", behavior: "shieldbearer", w5Shade: true, frontShield: true, heavy: true,
    hp: 8.0, speed: 1.0, damage: 1.5, xp: 11, emerald: 1, armor: 0.2, attackRange: 0.95, attackCooldown: 1.5, windup: 0.44, abilities: ["slam"],
    weapon: { type: "sword", color: "#8a84a8", length: 1.0, shield: "#4a4466" },
    look: { skin: "#3a3254", hair: "#241e38", shirt: "#2e2846", pants: "#221c34", eyes: "#9fe8ff", helmet: "#4a4466" } }),
});
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w5_shadeKid", "w5_shadeKnight"); // 그림자에 순간이동·분신 정예는 헷갈려요

// ----- 그림자 규칙 -----
function w5ShadeShown(m) { return !!(m && m.w5Shown); }
// 방장: 들켰나 매 화면 (친구 기기는 m.w5Shown 칸을 받아요)
hookOn("dungeonTick", () => {
  if (typeof netGuest === "function" && netGuest()) return;
  for (const m of monsters) {
    if (m.hp <= 0 || !m.def || !m.def.w5Shade) continue;
    const now = typeof w5Revealed === "function" && w5Revealed(m.x, m.y);
    if (now && !m.w5Shown) { m.stunTimer = Math.max(m.stunTimer || 0, 1.0); addFloatText(m.x, m.y, "깜짝! 들켰다", "#e8d8ff", 16); }
    m.w5Shown = !!now;
  }
}, 56);
hookOn("monsterAlpha", (a, m) => {
  if (!m.def || !m.def.w5Shade || m.hp <= 0) return a;
  if (m.w5Shown || m.state === "cast" || m.state === "windup" || m.hitT > 0) return a;
  return Math.min(a, 0.3);
}, 50);
hookOn("monsterDamage", (h) => {
  const m = h && h.m;
  if (m && m.def && m.def.w5Shade && !m.w5Shown) { h.dmg *= 0.4; if (!h.opts.dot && !(m._w5TipT > game.time)) { m._w5TipT = game.time + 3; addFloatText(m.x, m.y, "흐릿해서 덜 아파요", "#b8a8d8", 13); } }
  return false;
}, 30);

// ----- 모양 -----
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  // 회색 반딧별: 둥근 별 몸 + 꼬리 빛
  w5_wisp(m) {
    const { add, eyes, flush } = w3Parts(m), bob = 0.45 + Math.sin(game.time * 3.5 + m.x) * 0.07, c = m.def.color;
    add(0.04, 0, bob, 0.28, 0.28, 0.26, c);
    for (const [f, s, z] of [[0.18, 0, 0.1], [-0.18, 0, 0.1], [0, 0.18, 0.1], [0, -0.18, 0.1], [0, 0, 0.3]]) add(f * 0.9, s * 0.9, bob + z, 0.09, 0.09, 0.09, "#fff6d8");
    add(-0.24, 0, bob + 0.02, 0.16, 0.08, 0.08, "#e8e0f8");
    eyes(0.19, 0.07, bob + 0.08, 0.07, m.def.eyes);
    flush();
  },
  // 먼지 토끼: 회색 솜 몸 + 긴 귀
  w5_dustBunny(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, hop = m.moving ? Math.abs(Math.sin(m.walkTime * 9)) * 0.1 : 0, sq = m.state === "cast" ? 0.85 : 1;
    add(0, 0, 0.02 + hop, 0.42, 0.36, 0.3 * sq, c);
    add(0.14, 0, 0.3 * sq + hop, 0.26, 0.26, 0.22, c);
    for (const sd of [1, -1]) add(0.08, sd * 0.08, 0.5 * sq + hop, 0.06, 0.07, 0.24, "#d8d0e0");
    add(-0.24, 0, 0.14 + hop, 0.12, 0.12, 0.12, "#e8e4f0");
    eyes(0.28, 0.06, 0.38 * sq + hop, 0.06, m.def.eyes);
    flush();
  },
  // 회색 젤리: 큰 네모 젤리 + 반짝 점
  w5_grayJelly(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, sq = m.moving ? 1 + Math.sin(m.walkTime * 7) * 0.08 : 1;
    add(0, 0, 0, 0.52 / sq, 0.5 / sq, 0.42 * sq, c);
    add(0.02, 0.1, 0.42 * sq, 0.14, 0.14, 0.04, "#d8d4e8");
    eyes(0.27 / sq, 0.09, 0.22 * sq, 0.08, m.def.eyes);
    flush();
  },
  // 등불 유령: 하얀 천 유령 + 손에 회색 등불 (빛나요)
  w5_lampGhost(m) {
    const { add, eyes, flush } = w3Parts(m), bob = 0.25 + Math.sin(game.time * 3 + m.x) * 0.06, c = m.def.color;
    add(0, 0, bob, 0.34, 0.34, 0.42, c);
    add(0, 0, bob + 0.42, 0.28, 0.28, 0.1, c);
    for (const sd of [1, -1, 0]) add(-0.02, sd * 0.11, bob - 0.06, 0.1, 0.1, 0.08, c);
    add(0.2, 0.22, bob + 0.1, 0.12, 0.12, 0.16, "#fff6d8"); add(0.2, 0.22, bob + 0.26, 0.14, 0.14, 0.03, "#6a6478");
    eyes(0.18, 0.07, bob + 0.28, 0.07, m.def.eyes);
    flush();
  },
  // 고요 거북: 회색 등딱지 + 별 무늬 + 앞 방패 같은 머리판
  w5_hushTurtle(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 10) * 0.03 : 0;
    for (const [f, s] of [[0.14, 0.18], [0.14, -0.18], [-0.14, 0.18], [-0.14, -0.18]]) add(f, s, 0.0 + (s > 0 ? w : -w), 0.12, 0.12, 0.1, "#9aa088");
    add(0, 0, 0.08, 0.5, 0.46, 0.24, c);
    add(0, 0, 0.32, 0.38, 0.34, 0.1, "#a8a8b8");
    add(0, 0, 0.42, 0.1, 0.1, 0.03, "#fff6d8");
    add(0.3, 0, 0.12, 0.16, 0.2, 0.18, "#9aa088");
    eyes(0.38, 0.06, 0.2, 0.05, m.def.eyes);
    flush();
  },
  // 그림자 꼬마: 짙은 남보라 동글이 + 하늘색 눈 (흐릿함은 monsterAlpha 가)
  w5_shadeKid(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 12) * 0.03 : 0;
    add(0.02, 0.07, w, 0.08, 0.08, 0.12, "#221c34"); add(0.02, -0.07, -w, 0.08, 0.08, 0.12, "#221c34");
    add(0, 0, 0.12, 0.3, 0.3, 0.3, c);
    add(0, 0, 0.42, 0.22, 0.22, 0.08, c);
    eyes(0.16, 0.07, 0.28, 0.07, m.def.eyes);
    flush();
  },
});
