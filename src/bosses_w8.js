// ===== 월드 8 "뜨끈 지옥" 보스 공통 규칙 + 보스 1~4 (설계서 docs/design/world8-hell.md 5장) =====
// 보스 8명은 전부 새 모습·새 기술이에요 (예전 보스 정의·모양을 빌리지 않아요). 5~8 은 bosses_w8b.js.
// 지옥 보스 규칙 (모든 지옥 보스): 보스방에 불기둥 구멍 4개 (환경 hell_env.js 와 같은 3.6초 박자).
//   보스가 "터지는 불기둥" 위에 서면 "앗 뜨거!" 비틀 2.5초 + 체력 3% (보스마다 쿨 6초). 주인공도 불기둥은 피해요 (하트 1 밑으로는 안 내려가요).
//   → 주황 고리가 차오를 때 보스를 구멍 쪽으로 데려가면 좋아요.
// 어렵게: 보스 체력 560~690 (사막 372~480 의 1.5배), 공격 3.6~4.0. 모든 아픈 기술 예고 0.7초 이상.
// 같이 하기: 보스 상태는 보스 몬스터 칸(w8VentCd·w8VentT)이라 친구 화면에도 가요. 판정은 방장(dungeonTick)만.

const W8B = { stun: 2.5, frac: 0.03, cd: 6 };
function w8bHost() { return !(typeof netGuest === "function" && netGuest()); }
function w8bBoss() { const b = typeof w2BossNow === "function" ? w2BossNow() : (typeof monsters !== "undefined" ? monsters.find((m) => m.boss && m.hp > 0) : null); return b && b.hp > 0 && b.bossDef && b.bossDef.world === 8 ? b : null; }
const W8_BOSS_LIST = [];
// 보스 하나 등록: MONSTERS(behavior b2_boss) + BOSS_DEFS + 재료 + 전설 + 모양
function w8DefineBoss(E) {
  const map = typeof MAPS !== "undefined" ? MAPS.find((m) => m.id === E.mapId) : null; // check.mjs 는 hell.js 없이 이 파일을 읽어요
  MONSTERS[E.type] = { color: E.mat.color, name: E.name, shape: E.type, behavior: "b2_boss", hp: E.hp, speed: E.speed || 1.3, damage: E.damage || 3.7, xp: 120, emerald: 1, emeraldCount: 22,
    attackRange: E.attackRange || 2.3, attackCooldown: 1.6, world: 8, isBoss: true, heavy: true, size: E.size, phases: E.phases, floaty: !!E.floaty };
  MATERIALS[E.mat.id] = { name: E.mat.name, color: E.mat.color };
  BOSS_DEFS[E.mapId] = {
    id: E.type, name: E.name, title: E.title, size: E.size, world: 8, w8New: true, material: E.mat,
    arena: { size: E.arena || 26, theme: (map && map.theme) || { floor: "#6a3a30", moss: "#c8502a", wall: "#4a2622", darkness: 0.42, bg: "#1a0606" } },
    phases: E.phases,
    create(x, y, level) {
      const m = b2MakeBoss(E.type, x, y, level, E.size);
      m.bossDef = BOSS_DEFS[E.mapId]; m.name = `${E.title}, ${E.name}`; m.w8Kind = E.type;
      const base = m.onPhase;
      m.onPhase = (idx) => { if (base) base(idx); if (idx >= 1 && E.phaseMsg[idx - 1]) showMessage(E.phaseMsg[idx - 1], 3, false, "#ffc070"); if (E.onPhase) E.onPhase(m, idx); };
      return m;
    },
  };
  if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES[E.type] = E.draw;
  if (typeof w6RegisterLegend === "function") w6RegisterLegend(E.mapId, E.legend); // 같은 등록 규칙 (무기 이름이 모양을 정해요: 방망이·낫·단검·창·검)
  W8_BOSS_LIST.push(E);
}

// ===== 지옥 보스 규칙: 보스방 불기둥 구멍 4개 =====
// 보스방에 들어가면(reset 이 keepOnReset 으로 불려요) 던전 환경을 비워요. 첫 화면에 보스방 구멍을 놓아요.
// 보스방에서 나오면(다시 도전 → 문 앞) 던전 환경을 되돌려요.
hookOn("reset", () => { const kh = game.keyhunt; if (kh && kh.keepOnReset) { if (world.w8 && !world.w8.boss) kh.w8Snap = world.w8; world.w8 = null; } }, 61);
function w8bArenaVents() {
  world.w8 = null; const E = w8Env();
  const c = world.W / 2, d = Math.max(4, world.W / 2 - 4) * 0.62;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([ox, oy], i) => {
    const s = (typeof findFreeSpot === "function" && findFreeSpot(c + ox * d, c + oy * d, 0.5, 2)) || { x: c + ox * d, y: c + oy * d };
    w8AddVent(world, s.x, s.y, i * 0.9);
  });
  E.boss = true;
}
// 구멍 놓기는 두 기기 모두 (같이 하기 친구도 같은 보스방 모양에서 같은 자리를 찾아요). 시계는 놓은 때부터.
function w8bArenaCheck() {
  const kh = game.keyhunt;
  if (world.w8 && world.w8.boss && !(kh && kh.inBoss)) { world.w8 = (kh && kh.w8Snap) || null; return; }
  if (world.w8 || game.scene !== "dungeon" || !kh || !kh.inBoss || !game.mapDef || mapWorld(game.mapDef) !== 8 || typeof w8Env !== "function") return;
  w8bArenaVents();
}
hookOn("playerSkills", (p) => { if (p === game.player) w8bArenaCheck(); }, 60); // 친구 기기에서도 불려요
hookOn("dungeonTick", () => w8bArenaCheck(), 40);
hookOn("dungeonTick", (dt) => {
  const b = w8bBoss(); if (!b) return;
  b.w8VentCd = Math.max(0, (b.w8VentCd || 0) - dt);
  if (b.w8VentCd > 0 || b.invulnT > 0 || typeof w8FireAt !== "function") return;
  if (!w8FireAt(b.x, b.y, (b.r || 1) * 0.6)) return;
  b.w8VentCd = W8B.cd;
  if (typeof w5bStun === "function") w5bStun(b, W8B.stun, W8B.frac, "앗 뜨거! 불기둥에 비틀", "#ffb070");
  else { b.staggerT = Math.max(b.staggerT || 0, W8B.stun); damageMonster(b, b.maxHp * W8B.frac, b.x, b.y, false, 0, { w8Vent: true }); }
  hookRun("w8VentStun", b);
}, 42);

// 숨 돌릴 틈: 지옥 보스는 기술마다 아프지만, 기술 사이 쉼을 0.6초 더 줘요 (때릴 틈이 있게 = 공정하게 어렵게)
hookOn("castStarted", (m) => { if (m && m.boss && m.w8Kind) m.abGlobal = (m.abGlobal || 0) + 0.6; }, 50);

// ===== 기술 (보스 1~4) =====
Object.assign(ABILITIES, {
  // 1 뿔뚝이
  w8b_clubSlam: { name: "방망이 쿵", desc: "뿔뚝이가 커다란 도깨비 방망이를 앞에 쿵 내려쳐요.", counter: "앞 원 밖으로 물러나요",
    tags: ["boss", "circle"], telegraph: { shape: "circle", radius: 2.4, at: "front", offset: 1.7, time: 1.0 }, cooldown: 7, range: [0, 4], damageMul: 1.35, anim: "slam",
    effect: { type: "damage" } },
  w8b_clubWave: { name: "뚝딱 물결", desc: "방망이로 땅을 긁어 앞으로 쭉 뚝딱 물결을 보내요.", counter: "빨간 길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 10, width: 1.6, at: "self", time: 1.1 }, cooldown: 7, range: [2.8, 10], damageMul: 1.5, anim: "point",
    effect: { type: "damage" } },
  w8b_impCall: { name: "꼬마 도깨비 부르기", desc: "뿔뚝이가 휘파람을 불어 불씨 꼬마 둘을 불러요.", counter: "꼬마부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w8_minion", count: 2 }, when: { maxSummons: 4 } },
  w8b_clubRain: { name: "도깨비 방망이 비", desc: "작은 방망이들이 여러 군데 뚝딱뚝딱 떨어져요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.2 }, cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 5, spread: 3.2, stagger: 0.2 } },
  // 2 퐁퐁이
  w8b_emberNova: { name: "불똥 사방", desc: "퐁퐁이가 부풀었다가 사방으로 불똥을 퐁퐁 쏴요.", counter: "불똥 사이 빈틈으로 빠지거나 구르기",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.0 }, cooldown: 7, range: [0, 8], damageMul: 0.9, anim: "raise",
    effect: { type: "nova", count: 10, speed: 4.5, color: "#ff9a3a" } },
  w8b_tentaclePull: { name: "촉수 당기기", desc: "퐁퐁이가 촉수를 휘저어 둘레를 끌어당겨요. 바로 다음 기술을 조심!", counter: "원 밖으로 미리 걸어 나가요",
    tags: ["boss", "pull"], telegraph: { shape: "circle", radius: 5, at: "self", time: 1.1 }, cooldown: 11, range: [0, 5], damageMul: 0, anim: "roar",
    effect: { type: "pull", force: 2.4 } },
  w8b_emberRain: { name: "불똥 비", desc: "불똥이 비처럼 여러 군데 떨어져요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.2 }, cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 6, spread: 3.6, stagger: 0.18 } },
  w8b_hotRing: { name: "뜨끈 고리", desc: "퐁퐁이 둘레로 뜨거운 고리가 퍼져요. 퐁퐁이 바로 곁은 안전해요.", counter: "고리 안쪽, 퐁퐁이 곁으로!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 6.5, inner: 2.3, at: "self", time: 1.3 }, cooldown: 11, range: [0, 7], damageMul: 1.5, anim: "roar",
    effect: { type: "knockback", force: 1.0 } },
  // 3 철컹이
  w8b_chainThrow: { name: "사슬 던지기", desc: "철컹이가 사슬을 쭉 던져요. 맞으면 잠깐 느려요.", counter: "조준선이 멈추면 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 9, width: 1.2, at: "self", time: 1.1, follow: true }, cooldown: 6, range: [2.8, 9], damageMul: 1.4, anim: "point",
    effect: { type: "slow", duration: 1.8 } },
  w8b_webZone: { name: "끈끈 거미줄", desc: "발밑에 끈끈한 거미줄을 쳐요. 밟으면 느려요.", counter: "거미줄 밖에서 싸워요",
    tags: ["boss", "zone"], telegraph: { shape: "circle", radius: 1.8, at: "target", time: 0.9 }, cooldown: 9, range: [0, 10], damageMul: 0, anim: "raise",
    effect: { type: "zone", duration: 5, tick: 1, kind: "web" } },
  w8b_chainDash: { name: "철컹 돌진", desc: "철컹이가 다리를 모았다가 빨간 줄을 따라 철컹철컹 달려와요. 벽에 부딪히면 멍해요.", counter: "빨간 줄 옆으로! 멍할 때 때려요",
    tags: ["boss", "line", "move"], telegraph: { shape: "line", length: 9, width: 1.6, at: "self", time: 1.0 }, cooldown: 8, range: [2, 9], damageMul: 1.5, anim: "crouch",
    effect: { type: "charge", speed: 9, stunOnWall: 2.0 } },
  w8b_chainRain: { name: "사슬 비", desc: "사슬 고리가 여러 군데 철컹 떨어져요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.2 }, cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 5, spread: 3.4, stagger: 0.2 } },
  // 4 꺼멍이
  w8b_coalToss: { name: "숯 던지기", desc: "꺼멍이가 숯덩이 셋을 휙휙 던져요.", counter: "빨간 원 밖으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.4, at: "target", time: 1.0 }, cooldown: 6, range: [0, 10], damageMul: 1.4, anim: "raise",
    effect: { type: "rain", count: 3, spread: 2.2, stagger: 0.22 } },
  w8b_burrow: { name: "땅 파고 쑥", desc: "꺼멍이가 땅속으로 쏙 들어가 빨간 원 자리에서 쑥 튀어나와요.", counter: "빨간 원 밖으로! 튀어나온 뒤 때려요",
    tags: ["boss", "move"], telegraph: { shape: "circle", radius: 1.7, at: "target", time: 1.2 }, cooldown: 9, range: [3, 12], damageMul: 1.5, anim: "crouch",
    effect: { type: "teleport" } },
  w8b_coalRain: { name: "숯 비", desc: "천장에서 숯이 여러 군데 우수수 떨어져요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.2 }, cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "roar",
    effect: { type: "rain", count: 6, spread: 3.6, stagger: 0.18 } },
  w8b_dustRing: { name: "숯먼지 고리", desc: "꺼멍이 둘레로 숯먼지 고리가 퍼져요. 꺼멍이 곁은 안전해요.", counter: "고리 안쪽, 꺼멍이 곁으로!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 6, inner: 2.2, at: "self", time: 1.3 }, cooldown: 11, range: [0, 6], damageMul: 1.5, anim: "roar",
    effect: { type: "knockback", force: 1.0 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w8b_clubSlam: { text: "앞 원 밖으로" }, w8b_clubWave: { text: "길 옆으로 비켜요" }, w8b_impCall: { text: "꼬마부터 정리해요" }, w8b_clubRain: { text: "원 사이 빈 곳으로" },
  w8b_emberNova: { text: "불똥 사이로!" }, w8b_tentaclePull: { text: "원 밖으로 미리!" }, w8b_emberRain: { text: "원 사이 빈 곳으로" }, w8b_hotRing: { text: "고리 안쪽, 곁으로!", do: true },
  w8b_chainThrow: { text: "사슬! 옆으로" }, w8b_webZone: { text: "거미줄 밖으로" }, w8b_chainDash: { text: "돌진! 줄 옆으로" }, w8b_chainRain: { text: "원 사이 빈 곳으로" },
  w8b_coalToss: { text: "숯! 원 밖으로" }, w8b_burrow: { text: "원 밖으로! 튀어나와요" }, w8b_coalRain: { text: "원 사이 빈 곳으로" }, w8b_dustRing: { text: "고리 안쪽, 곁으로!", do: true },
});

// ===== 보스 1~4 =====
w8DefineBoss({
  mapId: "hellgate", type: "w8_gateBoss", name: "문지기 도깨비 뿔뚝이", title: "뜨끈 지옥 문", hp: 500, damage: 3.6, size: 3.0, speed: 1.35,
  phases: [
    { until: 0.66, abilities: ["w8b_clubSlam", "w8b_clubWave"] },
    { until: 0.33, abilities: ["w8b_clubSlam", "w8b_clubWave", "w8b_impCall"] },
    { abilities: ["w8b_clubSlam", "w8b_clubWave", "w8b_impCall", "w8b_clubRain"] },
  ],
  mat: { id: "w8_hornChip", name: "도깨비 뿔 조각", color: "#ffd23f" },
  legend: { id: "L_w8_hellgate", slot: "weapon", name: "뿔뚝이 도깨비 방망이", effect: "chain", mul: 1.09, color: "#c8803a", forms: { w: "뿔뚝이 도깨비 방망이", m: "뿔뚝이 도깨비 지팡이", d: "뿔뚝이 도깨비 지팡이", h: "뿔뚝이 도깨비 단검" }, desc: "뚝딱! 맞으면 옆 몬스터에게 번개가 튀어요 (공격력 +9%)" },
  phaseMsg: ["불씨 꼬마를 불러요! 꼬마부터!", "방망이가 비처럼 떨어져요! 원 사이로!"],
  draw(m) {
    const P = b2Pose(m), up = P.cast * 0.5 - P.strike * 0.3, red = "#e8503a";
    b2DrawBody(m, [
      { f: 0, s: 0.24, z: 0, w: 0.3, d: 0.28, h: 0.36, c: "#ffd23f" }, { f: 0, s: -0.24, z: 0, w: 0.3, d: 0.28, h: 0.36, c: "#2a2018" },  // 호랑이 바지
      { f: -0.02, s: 0, z: 0.34, w: 0.75, d: 0.85, h: 0.55 + P.breath, c: red },
      { f: 0.05, s: 0, z: 0.86 + P.breath, w: 0.8, d: 0.85, h: 0.7, c: "#f06a50", face: true, eye: "#ffffff", pupil: "#2a0a0a", blush: "#ffb0a0" },
      { f: 0.05, s: 0.22, z: 1.56 + P.breath, w: 0.14, d: 0.14, h: 0.28, c: "#ffe060" }, { f: 0.05, s: -0.22, z: 1.56 + P.breath, w: 0.14, d: 0.14, h: 0.28, c: "#ffe060" }, // 뿔 둘
      { f: 0.42, s: 0.13, z: 1.08 + P.breath, w: 0.04, d: 0.08, h: 0.12, c: "#ffffff" }, { f: 0.42, s: -0.13, z: 1.08 + P.breath, w: 0.04, d: 0.08, h: 0.12, c: "#ffffff" }, // 송곳니
      { f: 0.1, s: -0.58, z: 0.5 + up, w: 0.2, d: 0.2, h: 0.75, c: "#8a5a2a" }, { f: 0.1, s: -0.58, z: 1.2 + up, w: 0.42, d: 0.42, h: 0.42, c: "#a86a32" }, // 방망이
      { f: 0.12, s: -0.58, z: 1.45 + up, w: 0.08, d: 0.46, h: 0.08, c: "#ffd060" },
      { f: 0.05, s: 0.52, z: 0.55, w: 0.22, d: 0.2, h: 0.4, c: red },
    ], { top: 2.0 });
  },
});
w8DefineBoss({
  mapId: "emberfall", type: "w8_jellyBoss", name: "불똥 해파리 퐁퐁이", title: "불똥 폭포", hp: 575, damage: 3.6, size: 3.0, speed: 1.2, floaty: true,
  phases: [
    { until: 0.66, abilities: ["w8b_emberNova", "w8b_tentaclePull"] },
    { until: 0.33, abilities: ["w8b_emberNova", "w8b_tentaclePull", "w8b_emberRain"] },
    { abilities: ["w8b_emberNova", "w8b_emberRain", "w8b_hotRing", "w8b_tentaclePull"] },
  ],
  mat: { id: "w8_emberGel", name: "불똥 젤리", color: "#ff9a3a" },
  legend: { id: "L_w8_emberfall", slot: "charm", name: "퐁퐁 불똥 목걸이", icon: "amulet", color: "#ff9a3a", perk: { hearts: 3, regen: 10 }, desc: "따끈한 불똥 목걸이: 하트 +3, 하트가 천천히 차요" },
  phaseMsg: ["불똥이 비처럼 떨어져요!", "뜨끈 고리! 퐁퐁이 곁으로 쏙!"],
  draw(m) {
    const P = b2Pose(m), t = game.time, z0 = 0.5 + Math.sin(t * 2) * 0.12, pulse = P.cast * 0.15;
    const parts = [
      { f: 0, s: 0, z: z0 + 0.4, w: 1.0 + pulse, d: 1.0 + pulse, h: 0.7 + pulse, c: "#ff8a3a", face: true, eye: "#ffffff", pupil: "#3a0a00", blush: "#ffd0a0" }, // 우산 몸
      { f: 0, s: 0, z: z0 + 1.1 + pulse, w: 0.6, d: 0.6, h: 0.2, c: "#ffd060" },
    ];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, wig = Math.sin(t * 4 + i) * 0.1; parts.push({ f: Math.cos(a) * 0.35, s: Math.sin(a) * 0.35, z: z0 - 0.1 + wig, w: 0.1, d: 0.1, h: 0.5, c: i % 2 ? "#ffb060" : "#ff6a2a" }); }
    b2DrawBody(m, parts, { top: 1.9 });
  },
});
w8DefineBoss({
  mapId: "chainbridge", type: "w8_spiderBoss", name: "사슬 거미 철컹이", title: "사슬 다리", hp: 590, damage: 3.7, size: 3.0, speed: 1.4,
  phases: [
    { until: 0.66, abilities: ["w8b_chainThrow", "w8b_webZone"] },
    { until: 0.33, abilities: ["w8b_chainThrow", "w8b_webZone", "w8b_chainDash"] },
    { abilities: ["w8b_chainThrow", "w8b_chainDash", "w8b_chainRain", "w8b_webZone"] },
  ],
  mat: { id: "w8_chainLink", name: "철컹 고리", color: "#b8b0a8" },
  legend: { id: "L_w8_chainbridge", slot: "weapon", name: "철컹 사슬 낫", effect: "slow", mul: 1.09, color: "#b8b0a8", forms: { w: "철컹 사슬 낫", m: "철컹 사슬 지팡이", d: "철컹 사슬 지팡이", h: "철컹 사슬 단검" }, desc: "사슬이 휘감아요: 맞은 적이 느려져요 (공격력 +9%)" },
  phaseMsg: ["철컹이가 달려와요! 빨간 줄 옆으로!", "사슬 비! 원 사이로!"],
  draw(m) {
    const P = b2Pose(m), t = game.time, step = m.moving ? Math.sin(t * 10) * 0.08 : 0;
    const parts = [
      { f: -0.25, s: 0, z: 0.35, w: 0.9, d: 0.8, h: 0.6 + P.breath, c: "#6a6a72" },                     // 배
      { f: 0.35, s: 0, z: 0.4 + P.breath, w: 0.6, d: 0.7, h: 0.55, c: "#8a8a94", face: true, eye: "#ffe060", pupil: "#2a1a00", blush: "#ff9a8a" }, // 머리
      { f: -0.25, s: 0, z: 0.95 + P.breath, w: 0.5, d: 0.08, h: 0.08, c: "#d8d0c8" }, { f: -0.25, s: 0, z: 0.95 + P.breath, w: 0.08, d: 0.5, h: 0.08, c: "#d8d0c8" }, // 등의 사슬 무늬
    ];
    for (let i = 0; i < 4; i++) for (const sd of [1, -1]) { const f = 0.3 - i * 0.25; parts.push({ f, s: sd * 0.62, z: 0.0 + (i % 2 ? step : -step), w: 0.12, d: 0.4, h: 0.12, c: "#4a4a52" }, { f, s: sd * 0.82, z: 0, w: 0.1, d: 0.1, h: 0.4, c: "#4a4a52" }); }
    b2DrawBody(m, parts, { top: 1.4 });
  },
});
w8DefineBoss({
  mapId: "coalmine", type: "w8_moleBoss", name: "숯검댕 두더지 꺼멍이", title: "숯 광산", hp: 605, damage: 3.7, size: 3.0, speed: 1.3,
  phases: [
    { until: 0.66, abilities: ["w8b_coalToss", "w8b_burrow"] },
    { until: 0.33, abilities: ["w8b_coalToss", "w8b_burrow", "w8b_coalRain"] },
    { abilities: ["w8b_coalToss", "w8b_burrow", "w8b_coalRain", "w8b_dustRing"] },
  ],
  mat: { id: "w8_shinyCoal", name: "반짝 숯", color: "#ff8a2a" },
  legend: { id: "L_w8_coalmine", slot: "charm", name: "꺼멍 숯 반지", icon: "ring", color: "#3a3434", perk: { block: 0.14, hearts: 2 }, desc: "단단한 숯 반지: 막기 +14%, 하트 +2" },
  phaseMsg: ["숯 비가 와요! 원 사이로!", "숯먼지 고리! 꺼멍이 곁으로!"],
  draw(m) {
    const P = b2Pose(m), dig = P.cast * 0.3;
    b2DrawBody(m, [
      { f: -0.1, s: 0, z: 0, w: 1.1, d: 1.0, h: 0.85 + P.breath - dig, c: "#2e2a2a" },
      { f: 0.48, s: 0, z: 0.3 - dig, w: 0.4, d: 0.6, h: 0.45, c: "#3a3434", face: true, eye: "#ffffff", pupil: "#1a1010" },
      { f: 0.72, s: 0, z: 0.42 - dig, w: 0.16, d: 0.2, h: 0.16, c: "#ff9ab0" },                                             // 분홍 코
      { f: 0.42, s: 0.5, z: 0.0, w: 0.34, d: 0.3, h: 0.16, c: "#f0c8a8" }, { f: 0.42, s: -0.5, z: 0.0, w: 0.34, d: 0.3, h: 0.16, c: "#f0c8a8" }, // 큰 손
      { f: -0.1, s: 0, z: 0.88 + P.breath - dig, w: 0.6, d: 0.66, h: 0.1, c: "#ffd060" },                                    // 광부 모자
      { f: 0.22, s: 0, z: 0.95 + P.breath - dig, w: 0.14, d: 0.14, h: 0.14, c: "#fff6c0" },                                  // 모자 등불
      { f: -0.3, s: 0.2, z: 0.6, w: 0.05, d: 0.2, h: 0.05, c: "#ff8a2a" },
    ], { top: 1.5 });
  },
});
