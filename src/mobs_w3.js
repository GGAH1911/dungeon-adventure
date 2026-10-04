// ===== 월드 3 "달" 몬스터 11종 (설계서 docs/design/world3-moon.md 4장) =====
// 새 행동은 없어요: 있는 행동(pounce·drifter·charger·shieldbearer·kite·support·burrower·wisp·lurker·shadow)을 다시 써요.
// 수치는 맵 레벨 1 기준 (좀비 = 체력 3, 공격 1). 모양은 블록, 큰 눈.

// ----- 기술 -----
Object.assign(ABILITIES, {
  w3_dustPuff: { name: "먼지 펑", desc: "몸을 부풀렸다가 먼지를 펑 뿜어요. 먼지 속은 느려요.", counter: "원 밖으로, 먼지는 구르면 빨리 나가요",
    tags: ["area"], telegraph: { shape: "circle", radius: 1.6, at: "self", time: 1.1 }, cooldown: 6, range: [0, 1.8], damageMul: 0.8,
    anim: "crouch", effect: { type: "slow", duration: 1.5 } },
  w3_mopSpin: { name: "걸레 빙글", desc: "걸레를 들고 빙글 돌아요.", counter: "한 걸음 물러났다가 멈추면 때려요",
    tags: ["area", "stagger"], telegraph: { shape: "circle", radius: 1.5, at: "self", time: 1.1 }, cooldown: 5, range: [0, 1.6], damageMul: 1.1,
    anim: "spin", staggerAfter: 1.2, effect: { type: "knockback", force: 1.0 } },
  w3_rayShot: { name: "광선 총", desc: "초록 광선을 한 줄로 쏴요.", counter: "빨간 줄 옆으로",
    tags: ["line"], telegraph: { shape: "line", length: 7, width: 0.8, at: "self", time: 0.9 }, cooldown: 4, range: [2, 7], damageMul: 1.0,
    anim: "staff", effect: { type: "damage" } },
  w3_tractor: { name: "끌어당기는 빛", desc: "UFO 가 동그란 빛으로 끌어당겨요. 아프지 않아요.", counter: "빛 밖으로 걸어 나가요",
    tags: ["area"], telegraph: { shape: "circle", radius: 2.2, at: "target", time: 1.2 }, cooldown: 8, range: [0, 6], damageMul: 0,
    anim: "raise", effect: { type: "pull", force: 2.0 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w3_dustPuff: { text: "먼지 펑! 원 밖으로" },
  w3_mopSpin: { text: "빙글! 물러났다 때려요" },
  w3_rayShot: { text: "초록 광선! 줄 옆으로" },
  w3_tractor: { text: "끌어당기는 빛 밖으로" },
});

// ----- 몬스터 -----
// 같은 행동을 쓰는 몬스터에서 행동에 필요한 값만 빌려 와요 (기술·모습·무기는 빌리지 않아요)
const W3_MON = (base, o) => {
  const d = { ...(MONSTERS[base] || {}) };
  for (const k of ["abilities", "look", "weapon", "w3Placeholder", "codexSkip", "world", "floaty", "heavy", "frontShield", "dizzyAfterCharge", "light", "size"]) delete d[k];
  return { ...d, ...o, world: 3 };
};
Object.assign(MONSTERS, {
  w3_moonBunny: W3_MON("spider", { name: "달토끼 병사", shape: "w3_moonBunny", behavior: "pounce",
    hp: 3, speed: 2.0, damage: 1.2, xp: 7, emerald: 0.8, attackRange: 0.75, attackCooldown: 1.3, pounceRange: 3.2, color: "#f4f0ea", eyes: "#d0305a" }),
  w3_dustBall: W3_MON("w2_jelly", { name: "먼지 공", shape: "w3_dustBall", behavior: "drifter", floaty: true,
    hp: 2.5, speed: 1.1, damage: 1.0, xp: 6, emerald: 0.7, attackRange: -1, abilities: ["w3_dustPuff"], color: "#b8b2a6", eyes: "#2a2a2a" }),
  w3_rockling: W3_MON("w2_urchin", { name: "운석 꼬마", shape: "w3_rockling", behavior: "charger", heavy: true,
    hp: 4, speed: 1.5, damage: 1.6, xp: 8, emerald: 0.9, armor: 0.25, attackRange: 0.8, attackCooldown: 1.4, windup: 0.32, abilities: ["charge"], color: "#6a6070", eyes: "#ffb040" }),
  w3_robot: W3_MON("w2_turtle", { name: "청소 로봇", shape: "human", behavior: "shieldbearer",
    hp: 5, speed: 1.2, damage: 1.3, xp: 8, emerald: 0.9, armor: 0.2, attackRange: 0.85, attackCooldown: 1.3, windup: 0.35, frontShield: true, abilities: ["w3_mopSpin"],
    weapon: { type: "sword", color: "#9ad0ff", length: 0.8, shield: "#7a8a9a" },
    look: { skin: "#c8ccd8", hair: "#8a90a0", shirt: "#5a7aa0", pants: "#3a4a60", eyes: "#7dffb0", helmet: "#a8b0c0" } }),
  w3_alien: W3_MON("w2_shrimp", { name: "초록 외계인", shape: "w3_alien", behavior: "kite",
    hp: 2.5, speed: 1.6, damage: 1.2, xp: 7, emerald: 0.8, abilities: ["w3_rayShot"], color: "#7ddc6a", eyes: "#1a1a1a" }),
  w3_ufo: W3_MON("w2_seahorse", { name: "꼬마 UFO", shape: "w3_ufoMini", behavior: "support", floaty: true,
    hp: 3.5, speed: 1.4, damage: 0.6, xp: 8, emerald: 0.9, attackRange: 0.7, attackCooldown: 1.4, windup: 0.3, abilities: ["healAllies", "w3_tractor"], color: "#a8b0c8", eyes: "#7dffb0" }),
  w3_crystalBug: W3_MON("w2_eel", { name: "수정 벌레", shape: "w3_crystalBug", behavior: "burrower",
    hp: 4, speed: 2.2, damage: 1.4, xp: 8, emerald: 0.9, color: "#9fe8ff", eyes: "#1a1a2a" }),
  w3_starWisp: W3_MON("wisp", { name: "별 도깨비불", shape: "w3_starWisp", behavior: "wisp", floaty: true,
    hp: 3, speed: 1.8, damage: 1.1, xp: 7, emerald: 0.8, color: "#ffe27a", eyes: "#3a2a10", light: 0.4 }),
  w3_gearSpider: W3_MON("w2_shrimp", { name: "태엽 거미", shape: "w3_gearSpider", behavior: "kite",
    hp: 3.5, speed: 1.7, damage: 1.0, xp: 8, emerald: 0.9, abilities: ["webTrap"], color: "#a87a4a", eyes: "#ff5a3a" }),
  w3_moonRat: W3_MON("w2_angler", { name: "치즈 쥐", shape: "w3_moonRat", behavior: "lurker",
    hp: 3, speed: 2.4, damage: 1.2, xp: 7, emerald: 0.8, attackRange: 0.8, attackCooldown: 1.2, windup: 0.35, color: "#a8a0b0", eyes: "#1a1a1a" }),
  w3_shadowWolf: W3_MON("shadow", { name: "그림자 늑대", shape: "w3_shadowWolf", behavior: "shadow", w3Shadow: true,
    hp: 4, speed: 2.2, damage: 1.5, xp: 9, emerald: 1, armor: 0, attackRange: 0.85, attackCooldown: 1.3, color: "#2a2a44", eyes: "#9fb8ff" }),
});
// 그림자 늑대는 지구빛 탑 빛 밖에서 흐릿해요 (공격 준비 중이면 또렷하게: 예고는 숨기지 않아요)
hookOn("monsterAlpha", (a, m) => {
  if (!m.def || !m.def.w3Shadow || m.hp <= 0) return a;
  if (m.state === "cast" || m.state === "windup" || m.state === "teleport" || m.hitT > 0) return a;
  return typeof w3InTowerLight === "function" && w3InTowerLight(m.x, m.y) ? a : Math.min(a, 0.35);
}, 50);
hookOn("lights", (lights) => {
  if (game.scene !== "dungeon") return;
  for (const m of monsters) if (m.def && m.def.light && m.hp > 0 && onScreen(m.x, m.y, 3)) lights.push({ x: m.x, y: m.y, radius: 1.6, power: m.def.light });
}, 56);

// ----- 모양 -----
function w3Parts(m) {
  const S = (m.def.size || 1) * (m.scaleMul || 1), fx = m.faceX || 1, fy = m.faceY || 0, px = -fy, py = fx;
  const parts = [], white = m.flash > 0;
  const add = (f, s, z, w, d, h, c) => parts.push({ x: m.x + (fx * f + px * s) * S, y: m.y + (fy * f + py * s) * S, z: z * S, w: w * S, d: d * S, h: h * S, c: white ? "#ffffff" : c });
  const eyes = (f, s, z, sz, c) => { add(f, s, z, sz, sz, sz, "#ffffff"); add(f, -s, z, sz, sz, sz, "#ffffff"); add(f + 0.03, s, z + 0.01, sz * 0.5, sz * 0.5, sz * 0.6, c); add(f + 0.03, -s, z + 0.01, sz * 0.5, sz * 0.5, sz * 0.6, c); };
  const flush = () => { parts.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z); for (const q of parts) drawBox(q.x - q.w / 2, q.y - q.d / 2, q.z, q.w, q.d, q.h, q.c); };
  return { add, eyes, flush, white };
}
Object.assign(EXTRA_SHAPES, {
  // 달토끼 병사: 하얀 몸 + 긴 귀 + 떡메(나무망치)
  w3_moonBunny(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, crouch = m.state === "windup" ? -0.06 : 0;
    const hop = m.moving ? Math.abs(Math.sin(m.walkTime * 10)) * 0.08 : 0;
    add(0, 0, 0.08 + hop, 0.36, 0.32, 0.3 + crouch, c);
    add(0.06, 0, 0.36 + hop + crouch, 0.3, 0.28, 0.24, c);
    const ear = Math.sin(game.time * 4 + m.x) * 0.04;
    add(0.02, 0.08, 0.6 + hop + crouch, 0.07, 0.07, 0.3 + ear, c); add(0.02, -0.08, 0.6 + hop + crouch, 0.07, 0.07, 0.3 - ear, c);
    add(0.04, 0.08, 0.66 + hop + crouch, 0.03, 0.04, 0.2, "#ffc0d0"); add(0.04, -0.08, 0.66 + hop + crouch, 0.03, 0.04, 0.2, "#ffc0d0");
    eyes(0.2, 0.07, 0.46 + hop + crouch, 0.07, m.def.eyes);
    add(0.12, 0.22, 0.2 + hop, 0.05, 0.05, 0.36, "#8a5a32"); add(0.12, 0.22, 0.56 + hop, 0.18, 0.12, 0.12, "#b07a4a");
    flush();
  },
  // 먼지 공: 회색 털뭉치. 먼지 펑 예고 때 부풀어요
  w3_dustBall(m) {
    const { add, eyes, flush } = w3Parts(m), bob = 0.2 + Math.sin(game.time * 2.5 + m.x) * 0.06;
    const k = m.state === "cast" ? 1.25 : 1, s = 0.42 * k;
    add(0, 0, bob, s, s, s * 0.9, m.def.color);
    for (const [f, sd, z] of [[0.18, 0.18, 0.1], [-0.18, 0.18, 0.25], [0.18, -0.18, 0.3], [-0.18, -0.18, 0.12]]) add(f * k, sd * k, bob + z * k, 0.14, 0.14, 0.14, "#d0cabe");
    eyes(s * 0.5, 0.09, bob + s * 0.45, 0.09, m.def.eyes);
    flush();
  },
  // 운석 꼬마: 울퉁불퉁 돌 + 주황 금
  w3_rockling(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 12) * 0.03 : 0;
    add(0, 0, 0.05, 0.46, 0.44, 0.36, c); add(-0.04, 0.06, 0.4, 0.32, 0.3, 0.14, "#7a7080"); add(0.06, -0.12, 0.3, 0.16, 0.12, 0.12, "#5a5060");
    add(0.18, 0, 0.18, 0.04, 0.3, 0.04, "#ff9a3a"); add(-0.1, 0.2, 0.22, 0.2, 0.04, 0.04, "#ff9a3a");
    add(0.1, 0.16, w, 0.12, 0.1, 0.08, "#4a4050"); add(0.1, -0.16, -w, 0.12, 0.1, 0.08, "#4a4050");
    eyes(0.24, 0.1, 0.3, 0.08, m.def.eyes);
    flush();
  },
  // 초록 외계인: 큰 머리 + 눈 3개 + 더듬이
  w3_alien(m) {
    const { add, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 12) * 0.04 : 0;
    add(0, 0.07, w, 0.1, 0.08, 0.2, "#5aa84a"); add(0, -0.07, -w, 0.1, 0.08, 0.2, "#5aa84a");
    add(0, 0, 0.2, 0.22, 0.24, 0.24, "#8a6ad0");
    add(0.02, 0, 0.44, 0.36, 0.38, 0.3, c);
    for (const sd of [0.12, 0, -0.12]) { add(0.2, sd, 0.56, 0.06, 0.08, 0.08, "#ffffff"); add(0.22, sd, 0.57, 0.03, 0.04, 0.05, "#1a1a1a"); }
    add(0, 0.08, 0.74, 0.03, 0.03, 0.14, "#5aa84a"); add(0, 0.08, 0.88, 0.07, 0.07, 0.07, "#ffe27a");
    add(0.14, 0.18, 0.28, 0.24, 0.06, 0.06, "#c8ccd8");
    flush();
  },
  // 꼬마 UFO: 접시 + 유리 돔 + 초록 불빛
  w3_ufoMini(m) {
    const { add, eyes, flush } = w3Parts(m), bob = 0.45 + Math.sin(game.time * 3 + m.x) * 0.06;
    add(0, 0, bob, 0.62, 0.62, 0.1, m.def.color); add(0, 0, bob - 0.06, 0.38, 0.38, 0.06, "#6a7090");
    add(0, 0, bob + 0.1, 0.3, 0.3, 0.18, "#bfefff");
    eyes(0.1, 0.06, bob + 0.16, 0.06, "#1a1a1a");
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + game.time * 2; add(Math.cos(a) * 0.28, Math.sin(a) * 0.28, bob + 0.02, 0.06, 0.06, 0.06, i % 2 ? "#7dffb0" : "#ffe27a"); }
    flush();
  },
  // 수정 벌레: 마디 몸 + 등에 수정 가시. 숨으면 가시만 보여요 (burrower 가 m.w2Hidden 으로 숨겨요)
  w3_crystalBug(m) {
    const { add, eyes, flush } = w3Parts(m), hid = m.w2Hidden || m.hidden || m.state === "burrow";
    if (!hid) { for (let i = 0; i < 3; i++) add(0.2 - i * 0.2, 0, 0.06, 0.2, 0.24, 0.16, "#5a6a8a"); eyes(0.3, 0.07, 0.16, 0.07, m.def.eyes); }
    for (let i = 0; i < 3; i++) add(0.2 - i * 0.2, 0, hid ? 0 : 0.2, 0.08, 0.08, 0.22 - i * 0.04, i % 2 ? "#c8a8ff" : m.def.color);
    flush();
  },
  // 별 도깨비불: 노란 별 블록 + 빛 꼬리
  w3_starWisp(m) {
    const { add, eyes, flush } = w3Parts(m), bob = 0.55 + Math.sin(game.time * 4 + m.x) * 0.08, c = m.def.color;
    add(0, 0, bob, 0.28, 0.28, 0.28, c);
    for (const [f, s, z] of [[0.2, 0, 0.09], [-0.2, 0, 0.09], [0, 0.2, 0.09], [0, -0.2, 0.09], [0, 0, 0.3], [0, 0, -0.14]]) add(f, s, bob + z, 0.12, 0.12, 0.12, c);
    eyes(0.15, 0.06, bob + 0.12, 0.06, m.def.eyes);
    add(-0.34, 0, bob - 0.05, 0.12, 0.06, 0.06, "#fff6c0");
    flush();
  },
  // 태엽 거미: 둥근 몸 + 다리 6개 + 등의 태엽 열쇠 (빙글빙글)
  w3_gearSpider(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 16) * 0.04 : 0;
    add(0, 0, 0.14, 0.4, 0.36, 0.22, c); add(0.2, 0, 0.16, 0.18, 0.22, 0.16, "#8a5a32");
    for (const f of [0.12, 0, -0.12]) for (const sd of [1, -1]) add(f, sd * 0.28, 0.06 + (sd > 0 ? w : -w), 0.06, 0.2, 0.06, "#5a4030");
    const a = game.time * 3; add(-0.05, 0, 0.42, 0.04, 0.04, 0.1, "#c8a040"); add(-0.05 + Math.cos(a) * 0.05, Math.sin(a) * 0.12, 0.5, 0.06, 0.18, 0.05, "#e8c060");
    eyes(0.3, 0.06, 0.2, 0.06, m.def.eyes);
    flush();
  },
  // 치즈 쥐: 회색 쥐 + 큰 귀 + 노란 치즈 조각
  w3_moonRat(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 18) * 0.03 : 0;
    add(0, 0, 0.06 + Math.abs(w), 0.42, 0.26, 0.22, c); add(0.24, 0, 0.12, 0.18, 0.2, 0.16, c);
    add(0.2, 0.12, 0.3, 0.06, 0.12, 0.12, "#ffc0d0"); add(0.2, -0.12, 0.3, 0.06, 0.12, 0.12, "#ffc0d0");
    add(-0.3, 0, 0.1, 0.24, 0.04, 0.04, "#d0a0b0");
    eyes(0.33, 0.06, 0.2, 0.05, m.def.eyes);
    add(0.36, 0.14, 0.04, 0.16, 0.14, 0.1, "#ffd84a");
    flush();
  },
  // 그림자 늑대: 남색 늑대 + 하늘색 눈 (흐릿함은 monsterAlpha 가)
  w3_shadowWolf(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 14) * 0.05 : 0;
    add(0, 0, 0.18, 0.56, 0.26, 0.24, c);
    add(0.34, 0, 0.26, 0.24, 0.24, 0.22, c); add(0.48, 0, 0.26, 0.1, 0.14, 0.1, "#3a3a5a");
    add(0.3, 0.08, 0.5, 0.06, 0.06, 0.1, c); add(0.3, -0.08, 0.5, 0.06, 0.06, 0.1, c);
    for (const [f, sd] of [[0.18, 1], [0.18, -1], [-0.18, 1], [-0.18, -1]]) add(f, sd * 0.09, 0, 0.08, 0.08, 0.18 + (f > 0 ? w : -w) * sd, "#1e1e34");
    add(-0.34, 0, 0.32, 0.22, 0.08, 0.08, "#3a3a5a");
    eyes(0.45, 0.07, 0.34, 0.06, m.def.eyes);
    flush();
  },
});
