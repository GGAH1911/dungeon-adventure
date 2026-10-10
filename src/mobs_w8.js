// ===== 월드 8 "뜨끈 지옥" 몬스터 7종 + 보스가 부르는 불씨 꼬마 (설계서 docs/design/world8-hell.md 4장) =====
// 모두 새로 그린 지옥 몬스터 (블록, 큰 눈, 귀엽게: 도깨비·불똥·숯·온천). 어려운 월드라 사막(월드 6) 몬스터 수치의 약 1.5배.
//   w8_imp        꼬마 도깨비     근접 + 방망이 뚝딱 (앞 원)
//   w8_emberBat   불똥 박쥐       날아다니며 불똥 떨구기 (빨간 원)
//   w8_coalGolem  숯덩이 골렘     느리고 단단 + 숯 굴리기 (돌진 줄, 벽에 쿵 하면 멍)
//   w8_lavaSlime  용암 젤리       근접. 쓰러지면 작은 뜨끈 웅덩이 (3초 불 장판)
//   w8_wispCat    도깨비불 고양이 멀리서 도깨비불 3발 (부채꼴)
//   w8_hornGoat   뿔 염소         들이받기 (줄 예고, 벽에 쿵 하면 멍)
//   w8_steamFrog  김 개구리       김 뿜기 (둘레 원, 맞으면 느려요)
//   w8_minion     불씨 꼬마       보스가 불러요 (약해요)
// 정예 무리: 지옥 맵의 정예 곁으로 가까운 보통 몬스터 2마리가 모여요 (체력 +20%).
// 수치는 맵 레벨 1 기준 (좀비 = 체력 3, 속도 1.7, 공격 1). 행동은 기본 행동(melee·flyer·archer)만 써요.

Object.assign(ABILITIES, {
  w8_bonk: { name: "방망이 뚝딱", desc: "꼬마 도깨비가 방망이를 번쩍 들었다가 앞을 뚝딱 내려쳐요.", counter: "앞 원 밖으로 한 걸음!",
    tags: ["melee", "area"], telegraph: { shape: "circle", radius: 1.1, at: "front", offset: 0.85, time: 0.75 }, cooldown: 3, range: [0, 1.8], damageMul: 1.3,
    anim: "slam", effect: { type: "damage" } },
  w8_emberDrop: { name: "불똥 떨구기", desc: "불똥 박쥐가 머리 위에서 불똥을 떨궈요. 떨어질 자리가 빨개요.", counter: "빨간 원 밖으로 걸어가요",
    tags: ["area", "ranged"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.0 }, cooldown: 4, range: [1, 6], damageMul: 1.2,
    anim: "raise", effect: { type: "damage" } },
  w8_coalRoll: { name: "숯 굴리기", desc: "숯덩이 골렘이 몸을 동그랗게 말아 빨간 줄을 따라 굴러와요. 벽에 부딪히면 멍해요.", counter: "빨간 줄 옆으로! 멍할 때 때려요",
    tags: ["line", "move"], telegraph: { shape: "line", length: 6, width: 1.2, at: "self", time: 1.1 }, cooldown: 6, range: [2, 6], damageMul: 1.4,
    anim: "crouch", effect: { type: "charge", speed: 6.5, stunOnWall: 2.0 } },
  w8_wispFan: { name: "도깨비불 3발", desc: "도깨비불 고양이가 꼬리를 흔들어 파란 불 셋을 부채처럼 쏴요.", counter: "옆으로 돌거나 불 사이로 빠져요",
    tags: ["projectile"], telegraph: { shape: "cone", length: 6, angle: 0.7, at: "self", time: 0.8, harmlessPreview: true }, cooldown: 3.5, range: [2, 8], damageMul: 0.9,
    anim: "point", effect: { type: "volley", count: 3, spread: 0.6, speed: 6.5, color: "#6ab0ff" } },
  w8_headbutt: { name: "뿔 들이받기", desc: "뿔 염소가 발을 구르다가 빨간 줄을 따라 들이받아요. 벽에 부딪히면 멍해요.", counter: "빨간 줄 옆으로 비켜요",
    tags: ["line", "move"], telegraph: { shape: "line", length: 7, width: 1.0, at: "self", time: 0.95 }, cooldown: 4.5, range: [1.5, 7], damageMul: 1.4,
    anim: "crouch", effect: { type: "charge", speed: 8, stunOnWall: 1.8 } },
  w8_steamPuff: { name: "김 뿜기", desc: "김 개구리가 볼을 부풀렸다가 둘레로 뜨거운 김을 뿜어요. 맞으면 잠깐 느려요.", counter: "둘레 원 밖으로 물러나요",
    tags: ["area"], telegraph: { shape: "self", radius: 1.8, at: "self", time: 0.9 }, cooldown: 4.5, range: [0, 1.8], damageMul: 1.1,
    anim: "crouch", effect: { type: "slow", duration: 1.8 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w8_bonk: { text: "방망이! 앞 원 밖으로" }, w8_emberDrop: { text: "불똥! 원 밖으로" }, w8_coalRoll: { text: "굴러와요! 줄 옆으로" },
  w8_wispFan: { text: "도깨비불 사이로" }, w8_headbutt: { text: "들이받기! 줄 옆으로" }, w8_steamPuff: { text: "김! 원 밖으로" },
});

const W8_MON = (base, o) => {
  const d = { ...(MONSTERS[base] || MONSTERS.zombie || {}) };
  for (const k of ["abilities", "look", "weapon", "w3Placeholder", "w4Placeholder", "codexSkip", "world", "floaty", "heavy", "frontShield", "dizzyAfterCharge", "light", "size", "armsForward", "emeraldCount", "w3Shadow", "w4Dig", "w4Glow", "w5Shade", "mini"]) delete d[k];
  return { ...d, ...o, world: 8 };
};
Object.assign(MONSTERS, {
  w8_imp: W8_MON("zombie", { name: "꼬마 도깨비", shape: "w8_imp", behavior: "melee", abilities: ["w8_bonk"],
    hp: 5.0, speed: 1.9, damage: 1.55, xp: 11, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.2, windup: 0.4, color: "#e8503a", eyes: "#2a0a0a" }),
  w8_emberBat: W8_MON("bat", { name: "불똥 박쥐", shape: "w8_emberBat", behavior: "flyer", floaty: true, abilities: ["w8_emberDrop"],
    hp: 4.3, speed: 2.8, damage: 1.5, xp: 10, emerald: 0.8, attackRange: 0.7, attackCooldown: 1.4, windup: 0.4, color: "#ff8a2a", eyes: "#2a0a0a" }),
  w8_coalGolem: W8_MON("zombie", { name: "숯덩이 골렘", shape: "w8_coalGolem", behavior: "melee", heavy: true, size: 1.3, abilities: ["w8_coalRoll"],
    hp: 11.5, speed: 1.05, damage: 2.0, xp: 16, emerald: 1.1, armor: 0.2, attackRange: 1.0, attackCooldown: 1.6, windup: 0.5, color: "#2e2a2a", eyes: "#ffb030" }),
  w8_lavaSlime: W8_MON("zombie", { name: "용암 젤리", shape: "w8_lavaSlime", behavior: "melee",
    hp: 5.6, speed: 1.4, damage: 1.55, xp: 12, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.4, windup: 0.42, color: "#ff7a2a", eyes: "#3a0a00" }),
  w8_wispCat: W8_MON("zombie", { name: "도깨비불 고양이", shape: "w8_wispCat", behavior: "melee", size: 1.05, abilities: ["w8_wispFan"],
    hp: 4.8, speed: 1.8, damage: 1.5, xp: 12, emerald: 0.9, attackRange: 0.75, attackCooldown: 1.3, windup: 0.4, color: "#3a3a5a", eyes: "#7ad8ff" }),
  w8_hornGoat: W8_MON("zombie", { name: "뿔 염소", shape: "w8_hornGoat", behavior: "melee", size: 1.15, abilities: ["w8_headbutt"],
    hp: 6.8, speed: 1.7, damage: 1.6, xp: 13, emerald: 1, attackRange: 0.85, attackCooldown: 1.4, windup: 0.45, color: "#a8a0a0", eyes: "#2a1a10" }),
  w8_steamFrog: W8_MON("zombie", { name: "김 개구리", shape: "w8_steamFrog", behavior: "melee", abilities: ["w8_steamPuff"],
    hp: 5.8, speed: 1.6, damage: 1.5, xp: 12, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.3, windup: 0.4, color: "#5ab45c", eyes: "#14300e" }),
  w8_minion: W8_MON("zombie", { name: "불씨 꼬마", shape: "w8_minion", behavior: "melee", size: 0.7,
    hp: 3.0, speed: 2.1, damage: 1.0, xp: 4, emerald: 0.3, attackRange: 0.6, attackCooldown: 1.2, windup: 0.36, color: "#ffb030", eyes: "#3a1000" }),
});
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w8_minion");

const W8_PACKS = 6;
const w8mHost = () => !(typeof netGuest === "function" && netGuest());

// ----- 용암 젤리: 쓰러지면 작은 뜨끈 웅덩이 (방장) -----
hookOn("monsterKilled", (m) => {
  if (!m || m.type !== "w8_lavaSlime" || !w8mHost() || typeof zones === "undefined") return;
  zones.push({ x: m.x, y: m.y, radius: 0.9, life: 3, max: 3, tick: 0.8, tickT: 0.6, damage: (m.damage || 1) * 0.4, kind: "fire" });
  addFloatText(m.x, m.y, "뜨끈 웅덩이!", "#ffb070", 15);
});

// ----- 정예 무리 (방장, 정예 정하기(순서 30) 다음) -----
hookOn("monstersSpawned", (def) => {
  if (!def || mapWorld(def) !== 8 || def.type === "tower") return;
  const used = new Set();
  for (const e of monsters.filter((m) => m.elite && !m.boss).slice(0, W8_PACKS)) { // 무리는 맵마다 6개까지 (너무 많으면 다 무리가 돼요)
    const near = monsters.filter((o) => o !== e && !o.elite && !o.boss && !used.has(o) && o.type !== "thief" && o.def && o.def.behavior !== "prop")
      .sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y)).slice(0, 2);
    for (const o of near) {
      used.add(o);
      const s = typeof findFreeSpot === "function" ? findFreeSpot(e.x + (Math.random() - 0.5) * 2, e.y + (Math.random() - 0.5) * 2, o.r || 0.3, 3) : null;
      if (s) { o.x = s.x; o.y = s.y; }
      o.maxHp *= 1.2; o.hp = o.maxHp; o.w8Pack = e;
    }
    e.w8PackSize = near.length;
  }
}, 31);
// 무리: 정예가 주인공을 보면 무리도 같이 와요
hookOn("dungeonTick", () => {
  if (!inHellDungeonSafe()) return;
  for (const o of monsters) if (o.w8Pack && !o.aggro && o.w8Pack.aggro && o.hp > 0) o.aggro = true;
}, 64);
function inHellDungeonSafe() { return typeof inHellDungeon === "function" && inHellDungeon(); }

// ----- 모양 (b2DrawBody 로 블록 조각) -----
function w8Parts(m, parts, top = 1.2) {
  const k = ((m.def && m.def.size) || 1) * (m.scaleMul || 1);
  b2DrawBody(m, parts.map((q) => ({ ...q, f: q.f * k, s: q.s * k, z: q.z * k, w: q.w * k, d: q.d * k, h: q.h * k })), { top: top * k });
}
function w8Bob(m, a = 0.03) { return m.moving ? Math.abs(Math.sin((m.walkTime || 0) * 9)) * a : Math.sin(game.time * 2.4 + (m.x || 0)) * a * 0.5; }
Object.assign(EXTRA_SHAPES, {
  w8_imp(m) {
    const b = w8Bob(m), c = m.def.color, raise = m.state === "windup" || m.state === "cast" ? 0.3 : 0;
    w8Parts(m, [
      { f: 0, s: 0.12, z: 0, w: 0.16, d: 0.14, h: 0.22, c: "#ffd23f" }, { f: 0, s: -0.12, z: 0, w: 0.16, d: 0.14, h: 0.22, c: "#2a2018" },  // 호랑이 바지 다리
      { f: 0, s: 0, z: 0.2 + b, w: 0.36, d: 0.4, h: 0.3, c: c },
      { f: 0.02, s: 0, z: 0.48 + b, w: 0.42, d: 0.44, h: 0.38, c: c, face: true, eye: "#ffffff", pupil: m.def.eyes, blush: "#ff9a8a" },
      { f: 0, s: 0, z: 0.86 + b, w: 0.1, d: 0.1, h: 0.18, c: "#ffd23f" },                                 // 뿔 하나
      { f: 0.2, s: -0.28, z: 0.36 + b + raise, w: 0.12, d: 0.12, h: 0.4, c: "#8a5a2a" },                   // 방망이
      { f: 0.2, s: -0.28, z: 0.72 + b + raise, w: 0.2, d: 0.2, h: 0.2, c: "#a86a32" },
    ], 1.1);
  },
  w8_emberBat(m) {
    const fl = Math.sin(game.time * 12 + (m.seed || 0)) * 0.12, z0 = 0.6 + Math.sin(game.time * 3) * 0.08;
    w8Parts(m, [
      { f: 0, s: 0, z: z0, w: 0.38, d: 0.36, h: 0.34, c: m.def.color, face: true, eye: "#ffffff", pupil: m.def.eyes },
      { f: -0.02, s: 0.34, z: z0 + 0.1 + fl, w: 0.28, d: 0.3, h: 0.06, c: "#c8401a" }, { f: -0.02, s: -0.34, z: z0 + 0.1 + fl, w: 0.28, d: 0.3, h: 0.06, c: "#c8401a" },
      { f: 0, s: 0.1, z: z0 + 0.34, w: 0.08, d: 0.08, h: 0.12, c: "#ffd060" }, { f: 0, s: -0.1, z: z0 + 0.34, w: 0.08, d: 0.08, h: 0.12, c: "#ffd060" },
    ], 1.2);
  },
  w8_coalGolem(m) {
    const b = w8Bob(m, 0.02), roll = m.charge ? 0.15 : 0;
    w8Parts(m, [
      { f: 0, s: 0.18, z: 0, w: 0.22, d: 0.2, h: 0.24, c: "#1e1a1a" }, { f: 0, s: -0.18, z: 0, w: 0.22, d: 0.2, h: 0.24, c: "#1e1a1a" },
      { f: 0, s: 0, z: 0.22 + b - roll, w: 0.6, d: 0.66, h: 0.5, c: m.def.color },
      { f: 0.31, s: 0.12, z: 0.3 + b, w: 0.02, d: 0.06, h: 0.28, c: "#ff8a2a" }, { f: 0.31, s: -0.16, z: 0.36 + b, w: 0.02, d: 0.05, h: 0.2, c: "#ff8a2a" }, // 주황 금
      { f: 0.05, s: 0, z: 0.7 + b - roll, w: 0.44, d: 0.46, h: 0.34, c: "#3a3434", face: true, eye: "#ffd060", pupil: "#3a1000" },
      { f: 0, s: 0.42, z: 0.36 + b, w: 0.2, d: 0.18, h: 0.34, c: "#2e2a2a" }, { f: 0, s: -0.42, z: 0.36 + b, w: 0.2, d: 0.18, h: 0.34, c: "#2e2a2a" },
    ], 1.2);
  },
  w8_lavaSlime(m) {
    const sq = 1 + Math.sin(game.time * 4 + (m.x || 0)) * 0.06;
    w8Parts(m, [
      { f: 0, s: 0, z: 0, w: 0.62, d: 0.62, h: 0.42 * sq, c: m.def.color, face: true, eye: "#ffffff", pupil: m.def.eyes },
      { f: -0.05, s: 0.12, z: 0.4 * sq, w: 0.12, d: 0.12, h: 0.1, c: "#ffe060" }, { f: 0.1, s: -0.14, z: 0.38 * sq, w: 0.09, d: 0.09, h: 0.08, c: "#ffe060" },
    ], 0.8);
  },
  w8_wispCat(m) {
    const b = w8Bob(m), t = game.time, flick = Math.sin(t * 10) * 0.05;
    w8Parts(m, [
      { f: 0.12, s: 0.12, z: 0, w: 0.12, d: 0.1, h: 0.2, c: m.def.color }, { f: 0.12, s: -0.12, z: 0, w: 0.12, d: 0.1, h: 0.2, c: m.def.color },
      { f: -0.12, s: 0.12, z: 0, w: 0.12, d: 0.1, h: 0.2, c: m.def.color }, { f: -0.12, s: -0.12, z: 0, w: 0.12, d: 0.1, h: 0.2, c: m.def.color },
      { f: 0, s: 0, z: 0.18 + b, w: 0.5, d: 0.34, h: 0.26, c: m.def.color },
      { f: 0.3, s: 0, z: 0.34 + b, w: 0.34, d: 0.36, h: 0.3, c: "#4a4a6e", face: true, eye: "#7ad8ff", pupil: "#0a2a4a" },
      { f: 0.3, s: 0.12, z: 0.64 + b, w: 0.08, d: 0.08, h: 0.1, c: "#4a4a6e" }, { f: 0.3, s: -0.12, z: 0.64 + b, w: 0.08, d: 0.08, h: 0.1, c: "#4a4a6e" },
      { f: -0.3, s: 0, z: 0.38 + b, w: 0.1, d: 0.1, h: 0.24, c: "#4a4a6e" },
      { f: -0.32, s: flick, z: 0.62 + b, w: 0.16, d: 0.16, h: 0.18, c: "#6ab0ff" }, { f: -0.32, s: flick, z: 0.8 + b, w: 0.08, d: 0.08, h: 0.1, c: "#d8f0ff" }, // 도깨비불 꼬리
    ], 1.0);
  },
  w8_hornGoat(m) {
    const b = w8Bob(m), dip = m.state === "cast" ? 0.12 : 0;
    w8Parts(m, [
      { f: 0.16, s: 0.13, z: 0, w: 0.1, d: 0.1, h: 0.26, c: "#5a4a40" }, { f: 0.16, s: -0.13, z: 0, w: 0.1, d: 0.1, h: 0.26, c: "#5a4a40" },
      { f: -0.16, s: 0.13, z: 0, w: 0.1, d: 0.1, h: 0.26, c: "#5a4a40" }, { f: -0.16, s: -0.13, z: 0, w: 0.1, d: 0.1, h: 0.26, c: "#5a4a40" },
      { f: 0, s: 0, z: 0.24 + b, w: 0.58, d: 0.38, h: 0.3, c: m.def.color },
      { f: 0.36, s: 0, z: 0.42 + b - dip, w: 0.3, d: 0.3, h: 0.3, c: "#c8c0c0", face: true, eye: "#ffffff", pupil: m.def.eyes },
      { f: 0.32, s: 0.13, z: 0.72 + b - dip, w: 0.1, d: 0.08, h: 0.16, c: "#e83a2a" }, { f: 0.32, s: -0.13, z: 0.72 + b - dip, w: 0.1, d: 0.08, h: 0.16, c: "#e83a2a" }, // 빨간 뿔
      { f: 0.5, s: 0, z: 0.36 + b - dip, w: 0.06, d: 0.08, h: 0.1, c: "#f0f0f0" },                                      // 수염
    ], 1.0);
  },
  w8_steamFrog(m) {
    const b = w8Bob(m, 0.05), puff = m.state === "cast" ? 0.12 : 0, k = (game.time * 0.8 + (m.x || 0)) % 1;
    w8Parts(m, [
      { f: 0, s: 0, z: 0, w: 0.56 + puff, d: 0.56 + puff, h: 0.34 + puff, c: m.def.color },
      { f: 0.1, s: 0.14, z: 0.32 + b + puff, w: 0.16, d: 0.16, h: 0.16, c: "#7ad870", face: true, eye: "#ffffff", pupil: m.def.eyes },
      { f: 0.1, s: -0.14, z: 0.32 + b + puff, w: 0.16, d: 0.16, h: 0.16, c: "#7ad870", face: true, eye: "#ffffff", pupil: m.def.eyes },
      { f: 0.26, s: 0, z: 0.12, w: 0.06, d: 0.3, h: 0.06, c: "#ffd0c0" },                     // 입
      { f: 0, s: 0, z: 0.6 + k * 0.5, w: 0.14, d: 0.14, h: 0.12, c: "#f0f0f0" },              // 머리 위 김
    ], 0.9);
  },
  w8_minion(m) {
    const b = w8Bob(m, 0.06), fl = Math.sin(game.time * 9 + (m.seed || 0)) * 0.04;
    w8Parts(m, [
      { f: 0, s: 0, z: 0.05 + b, w: 0.42, d: 0.42, h: 0.36, c: m.def.color, face: true, eye: "#ffffff", pupil: m.def.eyes },
      { f: 0, s: fl, z: 0.41 + b, w: 0.22, d: 0.22, h: 0.18, c: "#ff7a2a" }, { f: 0, s: -fl, z: 0.59 + b, w: 0.1, d: 0.1, h: 0.12, c: "#fff0a0" },
    ], 0.9);
  },
});
