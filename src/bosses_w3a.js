// ===== 월드 3 보스 1~4 (설계서 docs/design/world3-moon.md 5-1 ~ 5-4) =====
//   1 moonbase    경비 로봇 삐뽀      : 금색으로 빛나는 전원 기둥(플러그)을 두 번 치면 로봇이 멈춰요
//   2 dustsea     먼지 두더지 왕 푸석이: 땅속으로 숨으면 발자국 끝 금색 원(흙더미)을 먼저 치면 "들켰다!"
//   3 craterfield 쇠똥구리 데굴이      : 굴린 돌공이 크레이터를 지나면 휘어 보스에게 돌아가 쿵
//   4 rabbitvale  떡방아 장군 콩콩이   : 쿵·쿵·쿵·쉼! 박자를 세다가 쉼 박자에 때려요
// 틀은 월드 2 보스와 같아요 (bossAI, m.bossA, staggerAfter, 단계마다 pattern·gap). 지금 싸우는 보스: w3BossNow() (보스방·탑 둘 다)
// 같이 하기: 소품(플러그·흙더미·돌공) 상태는 소품 몬스터 칸에, 숨기·박자 상태는 보스 몬스터 칸(숫자)에 있어요 → 친구 기기에 그대로 가요.
//   계산(맞히기·굴리기·박자)은 방장 기기의 dungeonTick·resolveCast 에서만 해요.
// 환경(먼지 느려짐·점프대·크레이터 끌림·낮은 중력)은 moon_env.js 가 world.w3 를 보고 해요. 아레나는 w3Add* 로 자리만 놓아요.
// 탑 주인(moontower.js)도 쓰는 기술: w3_botLaser(그냥 줄 광선), w3_ballRoll(돌공: 아무 보스나 굴려요), w3_mochiBeat(박자: 아무 보스나)

function w3aK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[(game.profile && game.profile.difficulty) || "normal"] || 1; }
function w3aDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function w3aGuest() { return typeof netGuest === "function" && netGuest(); }
// 부하: 몬스터 파일(mobs_w3.js)이 아직 없으면 비슷한 몬스터로 (moon.js 의 임시 몬스터도 진짜가 아니에요)
function w3aMonster(id, fallback) { const d = MONSTERS[id]; return d && !d.w3Placeholder ? id : fallback; }
function w3aCalm(b) { casts = casts.filter((c) => c.m !== b); b.charge = null; if (b.state === "cast") b.state = "chase"; b.queue = []; }
function w3aStagger(b, sec, text) {
  w3aCalm(b);
  b.stagger = Math.max(b.stagger || 0, sec * w3aK());
  if (text) addFloatText(b.x, b.y, text, "#ffe27a", 28);
  game.shake = Math.max(game.shake, 0.4);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
}

// ----- 부품 · 전설 (설계서 8-2, 8-3) -----
Object.assign(MATERIALS, {
  w3_botCore: { name: "로봇 심장", color: "#7fd0ff" },
  w3_moleClaw: { name: "두더지 삽발톱", color: "#8a7a6a" },
  w3_beetleShell: { name: "반짝 등딱지", color: "#3a4a8a" },
  w3_mochi: { name: "달토끼 떡", color: "#fff0f4", enchant: "heal" },
});
if (typeof defBase === "function" && typeof LEGEND_FORMS === "function") { // (검사 도구는 loot.js 를 안 읽어요)
defBase("L_moonbase", { slot: "charm", legend: "moonbase", name: "삐뽀의 경광등", minL: 0, icon: "amulet", color: "#7fd0ff", perk: { speed: 0.1, roll: 0.15 }, desc: "빨라지고 구르기를 더 자주 해요" });
defBase("L_dustsea", { slot: "weapon", legend: "dustsea", name: "두더지 왕 삽", minL: 0, color: "#8a7a6a", mul: 1.12, effect: "slow",
  forms: LEGEND_FORMS({ w: "두더지 왕 삽 망치", m: "두더지 왕 지팡이", d: "두더지 왕 지팡이", h: "두더지 왕 단검" }, "hammer"), desc: "맞으면 느려져요 (공격력 +12%)" });
defBase("L_craterfield", { slot: "armor", legend: "craterfield", name: "데굴이 등딱지 갑옷", minL: 0, look: { body: "#3a4a8a", legs: "#2e3a70", helmet: "#ffd23f", boots: "#24305c", gloves: "#3a4a8a" }, perk: { block: 0.16, hearts: 2 }, desc: "잘 막고, 하트 +2" });
defBase("L_rabbitvale", { slot: "weapon", legend: "rabbitvale", name: "콩콩이 떡메", minL: 0, color: "#f4e6c8", mul: 1.13, effect: "heal",
  forms: LEGEND_FORMS({ w: "콩콩이 떡메", m: "떡메 지팡이", d: "떡메 지팡이", h: "떡메 단검" }, "hammer"), desc: "쓰러뜨리면 하트가 차요 (공격력 +13%)" });
Object.assign(BOSS_LEGENDS, { moonbase: "L_moonbase", dustsea: "L_dustsea", craterfield: "L_craterfield", rabbitvale: "L_rabbitvale" });
}

// ----- 소품 -----
MONSTERS.w3_plug = { name: "전원 기둥", color: "#8fb0d8", shape: "w3_plug", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 3 };
MONSTERS.w3_digMound = { name: "흙더미", color: "#8a7a6a", shape: "w3_digMound", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 3 };
MONSTERS.w3_moonBall = { name: "달돌 공", color: "#b8b8c4", shape: "w3_moonBall", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 3 };

// ----- 기술 -----
Object.assign(ABILITIES, {
  // 1 삐뽀
  w3_botCharge: { name: "충전", desc: "로봇이 기둥에서 힘을 받아요. 금색 기둥을 치면 멈춰요!", counter: "금색으로 빛나는 기둥을 두 번 쳐요",
    tags: ["boss"], telegraph: { shape: "none", at: "self", time: 0.6 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w3_plugGlow", plugs: 1, window: 6 } },
  w3_botLaser: { name: "눈 광선", desc: "눈에서 굵은 광선을 한 줄로 쏴요.", counter: "빨간 줄 옆으로",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 10, width: 1.4, at: "self", time: 1.2 }, cooldown: 6, range: [0, 10], damageMul: 1.6,
    anim: "staff", effect: { type: "damage" } },
  w3_botStomp: { name: "바퀴 쿵", desc: "앞으로 쿵! 바닥이 흔들려요.", counter: "원 밖으로! 쿵 뒤에 때려요",
    tags: ["boss", "area", "stagger", "ground"], telegraph: { shape: "circle", radius: 2.2, at: "front", offset: 1.7, time: 1.25 }, cooldown: 6, range: [0, 3.6],
    damageMul: 2.0, anim: "slam", staggerAfter: 2.2, effect: { type: "knockback", force: 1.5 } },
  w3_botCall: { name: "청소 로봇 부르기", desc: "삐삐! 청소 로봇 둘을 불러요.", counter: "작은 로봇부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w3_summon", monster: "w3_robot", fallback: "skeleton", count: 2, max: 4 } },
  // 2 푸석이
  w3_burrow: { name: "땅속 숨기", desc: "먼지 속으로 쏙! 발자국 끝 금색 원에서 튀어나와요. 나오기 전에 흙더미를 치면 들켜요.", counter: "발자국 끝 흙더미를 먼저 쳐요",
    tags: ["boss", "move"], telegraph: { shape: "self", radius: 1.3, at: "self", time: 0.7 }, cooldown: 7, range: [0, 30], damageMul: 0, anim: "crouch",
    effect: { type: "w3_burrow" } },
  w3_burrowPop: { name: "튀어나오기", desc: "금색 원에서 쑥 튀어나와요.", counter: "금색 원 밖으로! 아니면 흙더미를 먼저 쳐요",
    tags: ["boss", "area", "ground"], telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.5 }, cooldown: 99, range: [0, 99], damageMul: 1.8, anim: "slam",
    effect: { type: "knockback", force: 1.4 } },
  w3_digSpray: { name: "흙 뿌리기", desc: "앞발 삽으로 흙을 부채꼴로 뿌려요. 맞으면 느려져요.", counter: "부채꼴 옆으로",
    tags: ["boss", "cone", "slow"], telegraph: { shape: "cone", length: 5, angle: 1.22, at: "self", time: 1.25 }, cooldown: 6, range: [0, 5], damageMul: 1.3, anim: "point",
    effect: { type: "slow", duration: 1.5 } },
  w3_dirtRain: { name: "흙덩이 비", desc: "흙덩이가 여러 군데 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.25 }, cooldown: 9, range: [0, 14], damageMul: 1.2, anim: "raise",
    effect: { type: "rain", count: 5, spread: 3.2, stagger: 0.18 } },
  // 3 데굴이
  w3_ballRoll: { name: "돌공 굴리기", desc: "커다란 달돌 공을 빨간 줄로 굴려요. 크레이터를 지나면 휘어서 되돌아가요.", counter: "빨간 줄 옆으로! 크레이터 너머에 서면 공이 보스에게 돌아가요",
    tags: ["boss", "line", "move"], telegraph: { shape: "line", length: 12, width: 1.4, at: "self", time: 1.3 }, cooldown: 5, range: [0, 14], damageMul: 1.4, anim: "point",
    effect: { type: "w3_ballRoll", speed: 7, force: 1.4 } },
  w3_beetleCharge: { name: "뿔 돌진", desc: "뿔을 내밀고 빨간 길로 돌진해요. 벽에 부딪히면 어지러워요.", counter: "빨간 길 옆으로! 부딪히면 때려요",
    tags: ["boss", "line", "move", "stagger"], telegraph: { shape: "line", length: 8, width: 1.6, at: "self", time: 1.2 }, cooldown: 7, range: [2, 9], damageMul: 1.6,
    anim: "crouch", staggerAfter: 1.3, effect: { type: "charge", speed: 9, stunOnWall: 1.6 } },
  w3_wingRing: { name: "날개 퍼덕", desc: "등딱지를 열고 날개를 퍼덕여 둘레에 고리를 퍼뜨려요. 바로 옆은 안전해요.", counter: "데굴이 옆 금색 안으로 파고들어요",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 4.5, inner: 1.7, at: "self", time: 1.2 }, cooldown: 8, range: [0, 6], damageMul: 1.4, anim: "raise",
    effect: { type: "knockback", force: 1.0 } },
  w3_dustRain: { name: "돌가루 비", desc: "날개로 돌가루를 흩뿌려요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.25 }, cooldown: 9, range: [0, 14], damageMul: 1.2, anim: "raise",
    effect: { type: "rain", count: 5, spread: 3.2, stagger: 0.18 } },
  // 4 콩콩이
  w3_mochiBeat: { name: "떡방아 박자", desc: "쿵·쿵·쿵·쉼! 박자마다 떡메를 내려찍고, 쉼 박자엔 숨을 골라요.", counter: "박자를 세다가 쉼 박자에 때려요",
    tags: ["boss"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 0.6 }, cooldown: 4, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w3_beat" } },
  w3_malletSlam: { name: "떡메 쿵", desc: "박자에 맞춰 떡메를 내려찍어요. 따라오지 않아요.", counter: "원 밖으로 한 걸음! 점프대로 날면 안 맞아요",
    tags: ["boss", "area", "ground"], telegraph: { shape: "circle", radius: 1.8, at: "target", time: 1.15 }, cooldown: 99, range: [0, 99], damageMul: 1.7, anim: "slam",
    effect: { type: "knockback", force: 1.2 } },
  w3_mochiRain: { name: "떡 비", desc: "말랑한 떡이 쏟아져요. 맞으면 끈적해서 느려져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi", "slow"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.25 }, cooldown: 9, range: [0, 14], damageMul: 0.8, anim: "raise",
    effect: { type: "rain", count: 5, spread: 3.2, stagger: 0.18 } },
  w3_bunnyHop: { name: "토끼 뛰기", desc: "폴짝! 높이 뛰어 원 자리에 내려앉아요.", counter: "원 밖으로 굴러요",
    tags: ["boss", "move", "area"], telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.2 }, cooldown: 7, range: [2, 10], damageMul: 1.4, anim: "crouch",
    effect: { type: "teleport" } },
  w3_bunnyCall: { name: "토끼 병사 부르기", desc: "북을 둥! 토끼 병사 둘이 와요.", counter: "토끼 병사부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w3_summon", monster: "w3_moonBunny", fallback: "zombie", count: 2, max: 4 } },
});

// ----- 보스 4명 -----
const W3A = {
  moonbase: { type: "w3_guardBot", name: "삐뽀", title: "경비 로봇", shape: "w3_guardBot", color: "#c8ccd8", size: 2.8, r: 1.0, hp: 245, damage: 2.0, speed: 0.9, arena: 24,
    material: { id: "w3_botCore", name: "로봇 심장", color: "#7fd0ff" },
    theme: { floor: "#b8b8c4", moss: "#d0d4e4", wall: "#6a6a80", darkness: 0.3, bg: "#05060f" },
    phases: [
      { until: 0.66, gap: 1.8, pattern: ["w3_botStomp", "w3_botCharge", "w3_botLaser", "w3_botStomp"] },
      { until: 0.33, gap: 1.6, pattern: ["w3_botCall", "w3_botStomp", "w3_botCharge", "volley", "w3_botLaser"] },
      { until: 0, gap: 1.4, pattern: ["w3_botCharge", "w3_botLaser", "w3_botStomp", "volley", "w3_botCall", "w3_botLaser"] },
    ] },
  dustsea: { type: "w3_dustMole", name: "푸석이", title: "먼지 두더지 왕", shape: "w3_dustMole", color: "#8a7a6a", size: 2.7, r: 1.0, hp: 250, damage: 2.0, speed: 1.2, arena: 26,
    material: { id: "w3_moleClaw", name: "두더지 삽발톱", color: "#8a7a6a" },
    theme: { floor: "#a8a49a", moss: "#c8c0ae", wall: "#5e5a52", darkness: 0.32, bg: "#06060a" },
    phases: [
      { until: 0.66, gap: 1.8, pattern: ["w3_digSpray", "w3_burrow", "w3_dirtRain"] },
      { until: 0.33, gap: 1.6, pattern: ["w3_digSpray", "w3_burrow", "w3_burrow", "groundSpikes", "w3_dirtRain"] },
      { until: 0, gap: 1.4, pattern: ["w3_burrow", "w3_digSpray", "groundSpikes", "w3_burrow", "w3_dirtRain"] },
    ] },
  craterfield: { type: "w3_rollBeetle", name: "데굴이", title: "쇠똥구리", shape: "w3_rollBeetle", color: "#3a4a8a", size: 2.8, r: 1.05, hp: 255, damage: 2.1, speed: 1.0, arena: 26,
    material: { id: "w3_beetleShell", name: "반짝 등딱지", color: "#3a4a8a" },
    theme: { floor: "#9a9aa8", moss: "#b8b8c8", wall: "#585868", darkness: 0.34, bg: "#05050c" },
    phases: [
      { until: 0.66, gap: 1.8, pattern: ["w3_ballRoll", "w3_beetleCharge", "w3_ballRoll", "w3_dustRain"] },
      { until: 0.33, gap: 1.6, pattern: ["w3_ballRoll", "w3_wingRing", "w3_beetleCharge", "w3_ballRoll", "w3_dustRain"] },
      { until: 0, gap: 1.4, pattern: ["w3_ballRoll", "w3_beetleCharge", "w3_wingRing", "w3_ballRoll", "w3_dustRain"] },
    ] },
  rabbitvale: { type: "w3_mochiRabbit", name: "콩콩이", title: "떡방아 장군", shape: "w3_mochiRabbit", color: "#f4f0ec", size: 2.9, r: 1.05, hp: 260, damage: 2.1, speed: 1.0, arena: 24,
    material: { id: "w3_mochi", name: "달토끼 떡", color: "#fff0f4", enchant: "heal" },
    theme: { floor: "#d8d4c8", moss: "#f2c8d8", wall: "#7a6a7a", darkness: 0.25, bg: "#0a0812" },
    phases: [ // 박자 고정 (박자 묶음이 끝나면 쉼 박자 비틀 2초)
      { until: 0.66, gap: 1.6, pattern: ["w3_mochiBeat", "w3_mochiBeat", "w3_mochiRain", "w3_mochiBeat"] },
      { until: 0.33, gap: 1.5, pattern: ["w3_bunnyCall", "w3_mochiBeat", "w3_bunnyHop", "w3_mochiBeat", "w3_mochiRain"] },
      { until: 0, gap: 1.4, pattern: ["w3_mochiBeat", "w3_bunnyHop", "w3_mochiBeat", "w3_bunnyCall", "w3_mochiRain"] },
    ] },
};

function w3aArena(mapId) {
  return (w) => {
    const c = w.W / 2, N = w.W;
    if (mapId === "moonbase") w3AddLowGrav(1, 1, N - 1, N - 1, w); // 아레나 전체가 몸이 가벼워요
    if (mapId === "dustsea") { // 가장자리 띠에 달먼지, 가운데는 맨땅
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + 0.26; w3AddDust(c + Math.cos(a) * 9.2, c + Math.sin(a) * 9.2, 2.2, w); }
    }
    if (mapId === "craterfield") { w3AddCrater(c - 0.5, c - 6.5, 3.0, w); w3AddCrater(c - 0.5, c + 6.5, 3.0, w); } // 크레이터 둘 (위·아래 대칭)
    if (mapId === "rabbitvale") { // 가장자리에서 가운데 쪽으로 점프대 4개
      for (const a of [0.8, 2.35, 3.93, 5.5]) w3AddPad(c + Math.cos(a) * 7.5, c + Math.sin(a) * 7.5, -Math.cos(a), -Math.sin(a), w);
    }
  };
}
for (const [mapId, B] of Object.entries(W3A)) {
  MONSTERS[B.type] = { name: B.name, shape: B.shape, behavior: "bossAI", color: B.color, hp: B.hp, speed: B.speed, damage: B.damage,
    xp: 50, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: B.size, world: 3 };
  const phases = B.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS[mapId] = {
    id: B.type, name: B.name, title: B.title, size: B.size, world: 3, material: B.material,
    arena: { size: B.arena, theme: B.theme, build: w3aArena(mapId) },
    phases,
    create(x, y, level) {
      const m = createMonster(B.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[mapId];
      m.name = `${B.title} ${B.name}`;
      m.r = B.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.onPhase = (idx) => w3aPhase(m, mapId, idx);
      return m;
    },
  };
}
function w3aPhase(m, mapId, idx) {
  m.hidden = false; m.digT = 0; m.dig = false; m.beat = false; // 단계가 바뀌면 숨기·박자는 끝
  const msg = {
    moonbase: ["", "청소 로봇이 와요! 금색 기둥은 계속 쳐요", "기둥 두 개가 같이 빛나요! 둘 다 뽑아요"],
    dustsea: ["", "두 번 연달아 숨어요! 발자국을 잘 봐요", "가짜 발자국! 금색 동그라미만 진짜예요"],
    craterfield: ["", "날개 퍼덕! 데굴이 옆으로 파고들어요", "돌공이 두 개! 둘 다 돌려보내요"],
    rabbitvale: ["", "다섯 박자예요! 쉼이 늦게 와요", "떡메가 두 개! 박자를 잘 세요"],
  }[mapId];
  if (idx === 2) m.w3Double = true; // 3단계: 광선 2줄 · 돌공 2개 · 떡메 2개 · 기둥 2개
  if (mapId === "rabbitvale" && idx >= 1) m.beatN = 5;
  if (mapId === "rabbitvale" && idx === 2) m.beatN = 4;
  if (msg && msg[idx]) showMessage(msg[idx], 3, false, "#ffe27a");
}
function w3aBoss(type) { const b = w3BossNow(); return b && b.type === type ? b : null; }
function w3aProps(type, owner) { return monsters.filter((o) => o.type === type && (!owner || o.owner === owner)); }

// ===== 1. 삐뽀: 전원 기둥 =====
const W3A_PLUG = { homes: [[-7, 0], [3.5, 6.1], [3.5, -6.1]], window: 6, outT: 5 };
function w3aPlugNeed() { return w3aDiff() === "easy" ? 1 : 2; }
hookOn("dungeonTick", (dt) => {
  const b = w3aBoss("w3_guardBot");
  if (!b) return;
  const c = world.W / 2;
  if (!b.plugInit) {
    b.plugInit = true;
    for (const [ox, oy] of W3A_PLUG.homes) { const s = spawnProp("w3_plug", c + ox, c + oy, b); s.r = 0.5; s.plugGold = 0; s.plugOut = 0; s.appearTimer = 0; }
  }
  const plugs = w3aProps("w3_plug", b);
  let gold = 0, expired = false;
  for (const s of plugs) {
    if (s.plugOut > 0) s.plugOut = Math.max(0, s.plugOut - dt);
    if (s.plugGold > 0) { s.plugGold -= dt; if (s.plugGold <= 0) { s.plugGold = 0; expired = true; } else gold++; }
  }
  // 금색 기둥을 다 못 뽑았어요: 충전 완료 (잠깐 빨라지고 세져요)
  if (expired && !gold && b.plugCharging) {
    b.plugCharging = false;
    applyBuff(b, 1.15, 1.2, 6);
    addFloatText(b.x, b.y, "충전 완료!", "#7fd0ff", 24);
    showMessage("충전 완료! 다음엔 금색 기둥을 빨리 쳐요", 2.4, false, "#7fd0ff");
  }
}, 40);
function w3aPlugHit(s) {
  if (game.time - (s.plugHitT ?? -9) < 0.15 && game.time >= (s.plugHitT ?? -9)) return; // 한 번 휘두름에 여러 번 맞아도 한 번
  s.plugHitT = game.time;
  if (!(s.plugGold > 0)) { addFloatText(s.x, s.y, "파란 기둥은 아직!", "#9fd8ff", 14); return; }
  s.plugHits = (s.plugHits || 0) + 1;
  spawnBurst(s.x, s.y, ["#ffe27a", "#ffffff"], 6);
  if (s.plugHits < w3aPlugNeed()) { addFloatText(s.x, s.y, "한 번 더!", "#ffe27a", 18); return; }
  s.plugGold = 0; s.plugHits = 0; s.plugOut = W3A_PLUG.outT;
  addFloatText(s.x, s.y, "뽁!", "#ffffff", 22);
  addRing(s.x, s.y, { speed: 4, life: 0.4, gold: true });
  const b = s.owner;
  if (!b || b.hp <= 0) return;
  if (w3aProps("w3_plug", b).some((o) => o.plugGold > 0)) { showMessage("하나 더! 금색 기둥을 쳐요", 1.8, false, "#ffe27a"); return; }
  b.plugCharging = false;
  w3aStagger(b, 3.0, "전원 꺼짐! 비틀!");
}

// ===== 2. 푸석이: 땅속 숨기 =====
// 보스 칸: dig(숨는 중) · digT(숨은 뒤 지난 초) · digSX/SY → digEX/EY(발자국 줄) · digFX/FY(가짜 발자국 끝, 3단계)
const W3A_DIG = { tracks: 2.0, popStag: 1.8, spotStag: 3.2 };
function w3aDigStart(m, p) {
  const tx = p ? p.x : m.x, ty = p ? p.y : m.y;
  const a = Math.random() * Math.PI * 2, r = Math.random() * 0.8;
  const e = findFreeSpot(tx + Math.cos(a) * r, ty + Math.sin(a) * r, m.r || 1, 3) || { x: tx, y: ty };
  w3aCalm(m);
  m.dig = true; m.digT = 0; m.hidden = true; m.invuln = 99;
  m.digSX = m.x; m.digSY = m.y; m.digEX = e.x; m.digEY = e.y;
  m.digFX = null; m.digFY = null;
  if (m.phaseIdx === 2 || m.w3Double) { // 가짜 발자국: 다른 쪽으로 (흐리게, 끝 동그라미 없음)
    const fa = Math.atan2(e.y - m.y, e.x - m.x) + (Math.random() < 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.6), fd = Math.hypot(e.x - m.x, e.y - m.y) || 4;
    const f = findFreeSpot(m.x + Math.cos(fa) * fd, m.y + Math.sin(fa) * fd, 0.5, 3);
    if (f) { m.digFX = f.x; m.digFY = f.y; }
  }
  spawnDust(m.x, m.y); spawnBurst(m.x, m.y, ["#8a7a6a", "#c8c0ae"], 14);
  addFloatText(m.x, m.y, "쏙!", "#c8c0ae", 22);
}
function w3aDigEnd(m, spotted) {
  const mound = w3aProps("w3_digMound", m)[0];
  if (mound) { mound.hp = 0; mound.silent = true; }
  casts = casts.filter((c) => !(c.m === m && c.id === "w3_burrowPop"));
  const s = findFreeSpot(m.digEX, m.digEY, m.r || 1, 3) || { x: m.digEX, y: m.digEY };
  m.x = s.x; m.y = s.y;
  m.dig = false; m.hidden = false; m.invuln = 0; m.digT = 0;
  spawnBurst(m.x, m.y, ["#8a7a6a", "#c8c0ae", "#ffffff"], 18); spawnDust(m.x, m.y);
  w3aStagger(m, spotted ? W3A_DIG.spotStag : W3A_DIG.popStag, spotted ? "들켰다! 비틀!" : "뿅!");
}
hookOn("dungeonTick", (dt) => {
  for (const m of monsters) {
    if (!m.dig || m.hp <= 0) continue;
    if (!m.hidden) { m.dig = false; continue; } // 단계가 바뀌어 나왔어요
    m.digT += dt;
    m.invuln = 99; m.moving = false;
    if (m.digT >= W3A_DIG.tracks && !w3aProps("w3_digMound", m).length && !casts.some((c) => c.m === m && c.id === "w3_burrowPop")) {
      // 발자국 끝: 흙더미(치면 들켜요) + 튀어나오는 원 (금색 → 빨강)
      const k = createMonster("w3_digMound", m.digEX, m.digEY, m.level || game.mapLevel || 1);
      k.aggro = true; k.appearTimer = 0; k.owner = m; k.immovable = true; k.r = 0.5; monsters.push(k);
      const tune = abilityTuning(), ab = ABILITIES.w3_burrowPop;
      const c = makeCast(m, ab, "w3_burrowPop", { x: m.digEX, y: m.digEY }, Math.max(MIN_TELEGRAPH, ab.telegraph.time * tune.telegraph), tune);
      c.x = m.digEX; c.y = m.digEY;
      casts.push(c);
      if (typeof sfx !== "undefined" && sfx.fuse) sfx.fuse();
    }
    if (m.digT > W3A_DIG.tracks + 6) w3aDigEnd(m, false); // 혹시 예고가 사라졌으면
  }
}, 41);

// ===== 3. 데굴이: 돌공 =====
// 돌공 칸: bgRoll { vx, vy, dist, back(크레이터를 지나 돌아가는 중), t } · bgHits(이번에 맞은 주인공) · owner
const W3A_BALL = { speed: 7, max: 18, turnIn: 1.6, home: 4.2, backMax: 4, r: 0.55, stag: 2.8, both: 4.0, dmgFrac: 0.03 };
function w3aBallFor(m, n) {
  const balls = w3aProps("w3_moonBall", m);
  let s = balls.find((o) => !o.bgRoll);
  if (!s && balls.length < n) { s = createMonster("w3_moonBall", m.x, m.y, m.level || game.mapLevel || 1); s.aggro = true; s.owner = m; s.immovable = true; s.r = W3A_BALL.r; s.appearTimer = 0; monsters.push(s); }
  return s;
}
function w3aRollBall(m, c) {
  const s = w3aBallFor(m, m.w3Double ? 2 : 1);
  if (!s) return;
  const dx = c.dirX, dy = c.dirY;
  const st = findFreeSpot(m.x + dx * ((m.r || 1) + 0.7), m.y + dy * ((m.r || 1) + 0.7), s.r, 2) || { x: m.x, y: m.y };
  s.x = st.x; s.y = st.y;
  s.bgRoll = { vx: dx, vy: dy, dist: 0, back: false, t: 0, dmg: abilityDamage(c), force: c.ab.effect.force || 1.4, speed: c.ab.effect.speed || W3A_BALL.speed };
  s.bgHits = [];
  if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
}
function w3aTurn(R, tx, ty, rate) { // 방향을 (tx,ty) 쪽으로 rate(rad) 만큼 돌려요
  const want = Math.atan2(ty, tx), cur = Math.atan2(R.vy, R.vx);
  let d = want - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
  const a = cur + Math.max(-rate, Math.min(rate, d));
  R.vx = Math.cos(a); R.vy = Math.sin(a);
}
hookOn("dungeonTick", (dt) => {
  for (const s of monsters) {
    if (s.type !== "w3_moonBall" || !s.bgRoll) continue;
    const R = s.bgRoll, b = s.owner;
    R.t += dt;
    const E = world.w3, cr = E ? w3InZone(E.craters, s.x, s.y) : null;
    // 크레이터에 들어가면: 가운데로 굴러 내려가다가(휘어요), 가운데를 지나면 비탈을 타고 보스 쪽으로 되돌아가요
    if (cr) {
      R.back = true;
      const dx = cr.x - s.x, dy = cr.y - s.y;
      if (dx * R.vx + dy * R.vy > 0 && Math.hypot(dx, dy) > 0.4) w3aTurn(R, dx, dy, W3A_BALL.turnIn * dt);
      else if (b && b.hp > 0) w3aTurn(R, b.x - s.x, b.y - s.y, W3A_BALL.home * dt);
    } else if (R.back && b && b.hp > 0) w3aTurn(R, b.x - s.x, b.y - s.y, W3A_BALL.home * dt);
    const step = R.speed * dt, x0 = s.x, y0 = s.y;
    moveEntity(s, R.vx * step, R.vy * step);
    const moved = Math.hypot(s.x - x0, s.y - y0);
    R.dist += moved;
    if (Math.random() < 0.35) spawnDust(s.x, s.y);
    // 주인공을 치면 아파요 (한 번 굴릴 때 한 번)
    for (const p of allPlayers()) {
      if (p.hp <= 0 || s.bgHits.includes(p.pid || 1) || Math.hypot(p.x - s.x, p.y - s.y) > s.r + (p.r || 0.35)) continue;
      s.bgHits.push(p.pid || 1);
      if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); continue; }
      const hp0 = p.hp; hurtPlayer(p, R.dmg, b || s);
      if (p.hp < hp0) moveEntity(p, R.vx * R.force, R.vy * R.force);
    }
    // 크레이터를 지나 돌아온 공이 보스에 닿으면 쿵!
    if (R.back && b && b.hp > 0 && Math.hypot(b.x - s.x, b.y - s.y) < (b.r || 1) + s.r + 0.1) { w3aBallHitsBoss(s, b); continue; }
    if (moved < step * 0.3 || R.dist > W3A_BALL.max + (R.back ? 10 : 0) || (R.back && R.t > W3A_BALL.backMax + 3)) { s.bgRoll = null; spawnDust(s.x, s.y); }
  }
}, 42);
function w3aBallHitsBoss(s, b) {
  s.bgRoll = null;
  spawnBurst(s.x, s.y, ["#b8b8c4", "#ffffff", "#8a8a9a"], 18);
  addRing(s.x, s.y, { speed: 6, life: 0.4, gold: true });
  s.x = b.x + (s.x - b.x) * 1.4; s.y = b.y + (s.y - b.y) * 1.4;
  damageMonster(b, b.maxHp * W3A_BALL.dmgFrac, s.x, s.y, false, 0, { w3Ball: true });
  const both = b.ballHitT !== undefined && game.time - b.ballHitT < 3 && game.time >= b.ballHitT;
  b.ballHitT = game.time;
  w3aStagger(b, both ? W3A_BALL.both : W3A_BALL.stag, both ? "공 두 개! 쿵쿵! 비틀!" : "쿵! 비틀!");
}

// ===== 4. 콩콩이: 떡방아 박자 =====
// 보스 칸: beat(박자 중) · beatI(지금 박, 0부터) · beatN(박 수: 마지막이 쉼) · beatT · beatLen
function w3aBeatLen() { return { easy: 1.5, normal: 1.15, hard: 1.05, nightmare: 0.9 }[w3aDiff()] || 1.15; }
function w3aBeatStart(m) {
  m.beat = true; m.beatI = -1; m.beatT = 0; m.beatLen = w3aBeatLen();
  m.beatN = Math.max(3, Math.min(6, m.beatN || 4));
  if (m.beatN === 5) showMessage("다섯! 쿵·쿵·쿵·쿵·쉼", 1.6, false, "#ffe27a");
}
function w3aMallet(m, x, y) {
  const tune = abilityTuning(), ab = ABILITIES.w3_malletSlam;
  const c = makeCast(m, ab, "w3_malletSlam", { x, y }, Math.max(MIN_TELEGRAPH, m.beatLen), tune);
  c.x = x; c.y = y;
  casts.push(c);
}
hookOn("dungeonTick", (dt) => {
  for (const m of monsters) {
    if (!m.beat || m.hp <= 0) continue;
    if (m.stagger > 0 || m.invuln > 0) { m.beat = false; continue; } // 다른 일로 비틀·단계 바뀜
    m.beatT += dt;
    const i = Math.floor(m.beatT / m.beatLen);
    m.state = "cast"; m.castAnim = "slam"; m.castT = (m.beatT % m.beatLen) / m.beatLen; m.castTime = m.beatLen; m.moving = false;
    if (i === m.beatI) continue;
    m.beatI = i;
    if (i < m.beatN - 1) {
      // 쿵: 그 박자 시작 때 주인공 자리에 떡메 (따라오지 않아요)
      const ps = alivePlayers();
      const t0 = ps.length ? ps[(i + (m.beatSeed || 0)) % ps.length] : null;
      if (t0) {
        faceToward(m, t0);
        w3aMallet(m, t0.x, t0.y);
        if (m.w3Double && (i === 0 || i === 2)) { // 3단계: 박 1·3 에 떡메 둘 (친구가 있으면 친구, 혼자면 엉뚱한 곳)
          const other = ps.find((q) => q !== t0);
          if (other) w3aMallet(m, other.x, other.y);
          else { const a = Math.random() * Math.PI * 2, s = findFreeSpot(t0.x + Math.cos(a) * 3, t0.y + Math.sin(a) * 3, 0.5, 2); if (s) w3aMallet(m, s.x, s.y); }
        }
      }
      if (typeof sfx !== "undefined" && sfx.click) sfx.click();
      addFloatText(m.x, m.y, `${i + 1}!`, "#ffffff", 20);
    } else {
      // 쉼 박자: 떡메를 절구에 넣고 숨 고르기
      m.beat = false; m.state = "chase"; m.beatSeed = (m.beatSeed || 0) + 1;
      w3aStagger(m, 2.0, "쉼! 지금 공격!");
    }
  }
}, 43);

// ----- 소품 맞히기 (다치지 않아요) -----
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s) return false;
  if (s.type === "w3_plug") { if (!h.opts.dot) w3aPlugHit(s); return true; }
  if (s.type === "w3_digMound") {
    if (h.opts.dot) return true;
    const b = s.owner;
    if (b && b.dig && b.hp > 0) w3aDigEnd(b, true);
    return true;
  }
  if (s.type === "w3_moonBall") return true;
  return false;
}, 4);

// ----- 새 효과 -----
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect, m = c.m;
  if (e.type === "w3_plugGlow") {
    const plugs = w3aProps("w3_plug", m).filter((s) => !(s.plugGold > 0));
    const n = Math.min(plugs.length, m.w3Double ? 2 : (e.plugs || 1));
    const pick = plugs.slice().sort(() => Math.random() - 0.5).slice(0, n);
    for (const s of pick) { s.plugGold = (e.window || W3A_PLUG.window) * w3aK(); s.plugHits = 0; addRing(s.x, s.y, { speed: 3, life: 0.5, gold: true }); }
    if (pick.length) { m.plugCharging = true; showMessage(pick.length > 1 ? "기둥 두 개가 금색! 둘 다 두 번씩!" : "금색 기둥을 두 번 쳐요!", 2.2, false, "#ffe27a"); }
    return true;
  }
  if (e.type === "w3_summon") {
    const type = w3aMonster(e.monster, e.fallback || "zombie");
    m.summons = (m.summons || []).filter((s) => s.hp > 0);
    const n = Math.min(e.count, Math.max(0, (e.max || 4) - m.summons.length));
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(m.y - world.H / 2, m.x - world.W / 2) + Math.PI + (i - (n - 1) / 2) * 0.9, r = Math.max(3, world.W / 2 - 3.5);
      const spot = findFreeSpot(world.W / 2 + Math.cos(a) * r, world.H / 2 + Math.sin(a) * r, 0.35, 3) || { x: m.x + 1, y: m.y };
      const s = createMonster(type, spot.x, spot.y, m.level || game.mapLevel || 1);
      s.aggro = true; s.appearTimer = 0.6; s.summoned = true; monsters.push(s); m.summons.push(s);
      addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 200 });
    }
    return true;
  }
  if (e.type === "w3_burrow") { w3aDigStart(m, p); return true; }
  if (c.id === "w3_burrowPop") {
    // 튀어나오며 원 안 주인공을 밀어요 (예고와 같은 자리)
    addRing(c.x, c.y, { speed: 6, life: 0.35, hue: 30 }); spawnDust(c.x, c.y);
    for (const q of allPlayers()) {
      if (q.hp <= 0 || !insideShape(c, q.x, q.y, (q.r || 0.35) * 0.6)) continue;
      if (q.rollTimer > 0) { addFloatText(q.x, q.y, "회피!", "#9be8ff", 18); continue; }
      const hp0 = q.hp; hurtPlayer(q, abilityDamage(c), m);
      if (q.hp < hp0) { const dx = q.x - c.x, dy = q.y - c.y, d = Math.hypot(dx, dy) || 1; moveEntity(q, dx / d * 1.4, dy / d * 1.4); }
    }
    if (m.dig) w3aDigEnd(m, false);
    return true;
  }
  if (e.type === "w3_ballRoll") { w3aRollBall(m, c); return true; }
  if (e.type === "w3_beat") { w3aBeatStart(m); return true; }
  if (c.id === "w3_mochiRain") {
    addRing(c.x, c.y, { speed: 4, life: 0.3, hue: 340 });
    if (p && p.hp > 0 && insideShape(c, p.x, p.y, p.r * 0.6)) {
      if (p.rollTimer > 0) addFloatText(p.x, p.y, "회피!", "#9be8ff", 18);
      else { hurtPlayer(p, abilityDamage(c), m); p.abSlow = Math.max(p.abSlow || 0, 1.5); addFloatText(p.x, p.y, "끈적!", "#fff0f4", 16); }
    }
    return true;
  }
  return false;
}, 15);

// 3단계: 광선 2줄(0.6초 엇갈림), 돌공 2개(다른 크레이터 쪽). 방장 기기에서만 (친구 기기는 방장 예고를 받아요)
hookOn("castStarted", (m, id) => {
  if (!m || !m.w3Double || w3aGuest() || (typeof netplay !== "undefined" && netplay.replaying)) return;
  if (id !== "w3_botLaser" && id !== "w3_ballRoll") return;
  const first = casts.find((c) => c.m === m && c.id === id && !c.w3Second);
  if (!first) return;
  const tune = abilityTuning(), ab = ABILITIES[id];
  const c = makeCast(m, ab, id, first.target || game.player, first.time + 0.6, tune);
  c.w3Second = true; c.ownerLock = false;
  let a = Math.atan2(first.dirY, first.dirX) + (Math.random() < 0.5 ? 0.45 : -0.45);
  if (id === "w3_ballRoll") { // 다른 크레이터 쪽으로
    const E = world.w3, list = (E && E.craters) || [];
    const far = list.slice().sort((p, q) => Math.abs(Math.atan2(q.y - m.y, q.x - m.x) - Math.atan2(first.dirY, first.dirX)) - Math.abs(Math.atan2(p.y - m.y, p.x - m.x) - Math.atan2(first.dirY, first.dirX)))[0];
    if (far) a = Math.atan2(far.y - m.y, far.x - m.x);
  }
  c.dirX = Math.cos(a); c.dirY = Math.sin(a);
  casts.push(c);
}, 50);

// ----- 그림 -----
// 발자국 줄 (2초 동안 자라요), 가짜 발자국(흐리게), "여기 서요" 자리(크레이터 너머)
function w3aSteps(x0, y0, x1, y1, k, alpha) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.floor(d / 0.55)), m = Math.ceil(n * Math.min(1, k));
  const ux = (x1 - x0) / (d || 1), uy = (y1 - y0) / (d || 1);
  ctx.save(); ctx.fillStyle = `rgba(90,74,58,${alpha})`;
  for (let i = 1; i <= m; i++) {
    const t = i / n, sd = i % 2 ? 0.16 : -0.16;
    const s = toScreen(x0 + (x1 - x0) * t - uy * sd, y0 + (y1 - y0) * t + ux * sd, 0.02);
    ctx.beginPath(); ctx.ellipse(s.x, s.y, 5 * ZOOM, 2.6 * ZOOM, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon") return;
  for (const m of monsters) {
    if (!m.dig || !m.hidden || m.hp <= 0 || typeof m.digSX !== "number") continue;
    const k = (m.digT || 0) / W3A_DIG.tracks;
    w3aSteps(m.digSX, m.digSY, m.digEX, m.digEY, k, 0.85);
    if (typeof m.digFX === "number") w3aSteps(m.digSX, m.digSY, m.digFX, m.digFY, k, 0.35);
  }
  const b = monsters.find((o) => o.type === "w3_rollBeetle" && o.hp > 0);
  const E = world.w3;
  if (b && E && E.craters && E.craters.length) {
    for (const cr of E.craters) {
      const dx = cr.x - b.x, dy = cr.y - b.y, d = Math.hypot(dx, dy) || 1;
      const hx = cr.x + dx / d * (cr.r + 1.3), hy = cr.y + dy / d * (cr.r + 1.3);
      if (isWall(Math.floor(hx), Math.floor(hy))) continue;
      w2FloorCircle(hx, hy, 0.5, null, `rgba(255,210,63,${0.5 + 0.3 * Math.sin(game.time * 5)})`, 2.5);
    }
  }
}, 55);
hookOn("drawTelegraphsAfter", () => {
  // 흙더미 둘레 금색 (치면 들켜요)
  for (const k of monsters) {
    if (k.type !== "w3_digMound" || k.hp <= 0) continue;
    w2FloorCircle(k.x, k.y, 0.9, "rgba(255,210,63,0.18)", `rgba(255,210,63,${0.7 + 0.3 * Math.sin(game.time * 8)})`, 3);
  }
}, 50);
// 박자 점 (화면 아래 가운데, 마지막 점은 금색) — 소리와 같이 (접근성)
hookOn("hudDraw", () => {
  if (game.scene !== "dungeon") return;
  const m = monsters.find((o) => o.beat && o.hp > 0 && typeof o.beatN === "number");
  if (!m) return;
  const n = m.beatN, W = view.w, y = view.h - 110, gap = 34;
  for (let i = 0; i < n; i++) {
    const x = W / 2 + (i - (n - 1) / 2) * gap, last = i === n - 1, on = i === m.beatI;
    ctx.fillStyle = on ? (last ? "#ffd23f" : "#ffffff") : last ? "rgba(255,210,63,0.4)" : "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.arc(x, y, on ? 12 : 9, 0, Math.PI * 2); ctx.fill();
  }
  text(m.beatI === n - 1 ? "쉼!" : "쿵!", W / 2, y - 22, 16, "#ffe27a", "center");
}, 50);
hookOn("lights", (lights) => {
  for (const s of monsters) if (s.type === "w3_plug" && s.plugGold > 0) lights.push({ x: s.x, y: s.y, radius: 1.8, power: 0.6, color: "#ffd23f" });
}, 61);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 경비 로봇 삐뽀: 네모난 회색 몸, 큰 노란 눈 하나, 바퀴 다리 둘, 집게 팔, 머리 위 경광등 (색이 천천히 바뀌어요)
  w3_guardBot(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.9 : 1, up = a.raise * 0.06;
    const body = "#c8ccd8", dk = "#8a90a4";
    for (const sd of [1, -1]) {
      P.push([0, sd * 0.22, 0, 0.22, 0.1, 0.22, "#3a3e4a"]); // 바퀴
      P.push([0, sd * 0.27, 0.07, 0.1, 0.02, 0.08, "#8a90a4"]);
      P.push([0.12, sd * 0.33, 0.2 + up + a.walk * sd * 0.02, 0.08, 0.08, 0.2, dk]); // 팔
      P.push([0.2, sd * 0.36, 0.18 + up, 0.12, 0.05, 0.05, "#5a6070"], [0.2, sd * 0.3, 0.18 + up, 0.12, 0.05, 0.05, "#5a6070"]); // 집게
    }
    P.push([0, 0, 0.16, 0.44, 0.48, 0.42 * sq, body]);
    P.push([-0.02, 0, 0.58 * sq, 0.38, 0.42, 0.04, dk]);
    P.push([0.225, 0, 0.36, 0.02, 0.24, 0.2, "#2a2e3a", true]); // 눈 테
    P.push([0.235, 0, 0.38, 0.02, a.stag ? 0.18 : 0.18, a.stag ? 0.05 : 0.16, "#ffe27a", true]); // 큰 노란 눈
    P.push([0.245, 0.03, 0.42, 0.01, 0.05, 0.05, "#ffffff", true]);
    const k = (Math.sin(game.time * 1.6) + 1) / 2, beacon = k > 0.5 ? "#4fb0ff" : "#ff9a3a";
    P.push([-0.02, 0, 0.62 * sq, 0.12, 0.12, 0.1, beacon, true]); // 경광등
    P.push([-0.22, 0, 0.36, 0.04, 0.06, 0.06, "#ffd23f"]); // 등 플러그 구멍
    drawVoxelParts(m, P, { top: 0.82 });
  },
  // 전원 기둥: 받침 + 기둥 + 위에 플러그. 금색이면 반짝, 뽑히면 플러그가 옆에 떨어져 있어요
  w3_plug(m) {
    const x = m.x, y = m.y, gold = m.plugGold > 0, out = m.plugOut > 0;
    drawBox(x - 0.32, y - 0.32, 0, 0.64, 0.64, 0.14, "#5a6070");
    drawBox(x - 0.18, y - 0.18, 0.14, 0.36, 0.36, 1.0, gold ? "#ffd23f" : "#6f8fb8");
    drawBox(x - 0.14, y - 0.14, 0.4, 0.28, 0.28, 0.05, gold ? "#fff2a8" : "#9fd8ff");
    drawBox(x - 0.14, y - 0.14, 0.8, 0.28, 0.28, 0.05, gold ? "#fff2a8" : "#9fd8ff");
    if (out) {
      drawBox(x + 0.25, y - 0.1, 0, 0.3, 0.2, 0.14, "#3a3e4a");
      if (Math.random() < 0.3) addSparkle(x, y, 1.15, { vz: 1.5, life: 0.4, size: 0.5, gold: true });
    } else drawBox(x - 0.12, y - 0.12, 1.14, 0.24, 0.24, 0.2, gold ? "#ffe27a" : "#3a3e4a");
    if (gold && m.plugHits) { const s = toScreen(x, y, 1.6); text("한 번 더!", s.x, s.y, 12 * ZOOM, "#ffe27a", "center"); }
  },
  // 먼지 두더지 왕 푸석이: 통통한 회갈색 두더지, 분홍 코, 큰 앞발 삽, 작은 왕관 (숨으면 안 그려요)
  w3_dustMole(m) {
    if (m.hidden) return;
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, up = a.raise * 0.06;
    const body = "#8a7a6a", lt = "#a8988a";
    for (const sd of [1, -1]) {
      P.push([0.05, sd * 0.2, 0, 0.14, 0.12, 0.08, "#6a5a4a"]);
      P.push([0.26, sd * 0.24, 0.08 + up + a.walk * sd * 0.02, 0.12, 0.16, 0.05, "#e8dcc8"]); // 삽 앞발
      P.push([0.33, sd * 0.24, 0.08 + up, 0.04, 0.16, 0.02, "#ffffff"]);
    }
    P.push([-0.04, 0, 0.04, 0.5, 0.46, 0.36 * sq, body]);
    P.push([0.06, 0, 0.04, 0.36, 0.38, 0.06, lt]);
    P.push([0.22, 0, 0.18 + up, 0.22, 0.3, 0.2 * sq, lt]);
    P.push([0.34, 0, 0.24 + up, 0.06, 0.1, 0.08, "#ff9ab8"]); // 분홍 코
    eyes(P, 0.33, 0.08, 0.32 + up, 0.04, "#1a1010", a.stag);
    P.push([0.04, 0, 0.42 * sq, 0.16, 0.18, 0.06, "#ffd23f"]); // 왕관
    for (const s of [-0.06, 0, 0.06]) P.push([0.04, s, 0.48 * sq, 0.03, 0.03, 0.06, "#ffd23f"]);
    drawVoxelParts(m, P, { top: 0.66 });
  },
  w3_digMound(m) {
    const x = m.x, y = m.y, w = 0.25 * Math.sin(game.time * 14) * 0.08;
    drawBox(x - 0.42, y - 0.42, 0, 0.84, 0.84, 0.16, "#7a6a5a");
    drawBox(x - 0.28 + w, y - 0.28, 0.16, 0.56, 0.56, 0.16, "#8a7a6a");
    drawBox(x - 0.14, y - 0.14, 0.32, 0.28, 0.28, 0.1, "#a8988a");
    if (Math.random() < 0.2) spawnDust(x, y);
  },
  // 쇠똥구리 데굴이: 반짝이는 남색 등딱지(금색 점), 작은 머리 + 더듬이, 다리 6개
  w3_rollBeetle(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.9 : 1, up = a.raise * 0.06, open = a.raise > 0 && m.castAnim === "raise";
    for (const sd of [1, -1]) for (const f of [0.14, 0, -0.14]) P.push([f + a.walk * sd * 0.02, sd * 0.28, 0, 0.04, 0.12, 0.08, "#1a2040"]);
    P.push([-0.04, 0, 0.06, 0.5, 0.48, 0.3 * sq, "#3a4a8a"]);
    P.push([-0.04, 0, 0.36 * sq, 0.42, 0.4, 0.06, "#4a5ca0"]);
    P.push([-0.04, 0, 0.38 * sq, 0.42, 0.02, 0.05, "#1a2040"]); // 등 가운데 줄
    for (const [f, s] of [[0.08, 0.1], [-0.1, -0.12], [-0.12, 0.13], [0.06, -0.1]]) P.push([f, s, 0.41 * sq, 0.05, 0.05, 0.02, "#ffd23f", true]);
    if (open) for (const sd of [1, -1]) P.push([-0.1, sd * 0.36, 0.34, 0.3, 0.16, 0.02, "#cfe6ff"]); // 날개
    P.push([0.24, 0, 0.12 + up, 0.14, 0.24, 0.14, "#2a3468"]);
    eyes(P, 0.31, 0.07, 0.2 + up, 0.04, "#1a1010", a.stag);
    for (const sd of [1, -1]) P.push([0.3, sd * 0.06, 0.26 + up, 0.02, 0.02, 0.12, "#1a2040"], [0.32, sd * 0.09, 0.38 + up, 0.04, 0.04, 0.04, "#ffd23f"]);
    drawVoxelParts(m, P, { top: 0.62 });
  },
  // 달돌 공: 층층이 쌓은 회색 공 (굴러가면 무늬가 빙글)
  w3_moonBall(m) {
    const r = m.r || W3A_BALL.r, d = r * 1.9, x = m.x, y = m.y;
    const layers = [[0.6, 0, 0.16], [0.9, 0.14, 0.2], [1.0, 0.32, 0.26], [0.9, 0.56, 0.2], [0.6, 0.74, 0.14]];
    for (const [k, z, h] of layers) drawBox(x - d * k / 2, y - d * k / 2, d * z, d * k, d * k, d * h, k === 1 ? "#b8b8c4" : "#a4a4b2");
    const rot = m.bgRoll ? game.time * 12 : 0.6;
    drawBox(x + Math.cos(rot) * d * 0.25 - 0.06, y + Math.sin(rot) * d * 0.25 - 0.06, d * 0.88, 0.12, 0.12, 0.03, "#7a7a8a");
    drawBox(x - Math.cos(rot) * d * 0.2 - 0.05, y - Math.sin(rot) * d * 0.2 - 0.05, d * 0.9, 0.1, 0.1, 0.03, "#8a8a9a");
  },
  // 떡방아 장군 콩콩이: 큰 흰 토끼, 붉은 볼, 긴 귀, 남색 투구(금 테), 커다란 떡메, 옆에 절구
  w3_mochiRabbit(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1;
    const swing = m.beat ? Math.sin(Math.min(1, m.castT || 0) * Math.PI) : a.raise; // 박자마다 떡메를 들었다 내려요
    const body = "#f4f0ec";
    for (const sd of [1, -1]) P.push([0.08 + a.walk * sd * 0.03, sd * 0.16, 0, 0.16, 0.1, 0.06, "#e8e0d8"]);
    P.push([-0.04, 0, 0.04, 0.4, 0.4, 0.34 * sq, body]);
    P.push([0.04, 0, 0.06, 0.28, 0.3, 0.2, "#fffaf6"]);
    P.push([0.12, 0, 0.36 * sq, 0.26, 0.3, 0.22 * sq, body]); // 머리
    for (const sd of [1, -1]) {
      P.push([0.06, sd * 0.08, 0.6 * sq, 0.06, 0.07, 0.3, body], [0.065, sd * 0.08, 0.64 * sq, 0.02, 0.04, 0.22, "#ffc8d8"]); // 긴 귀
      P.push([0.255, sd * 0.11, 0.42 * sq, 0.01, 0.06, 0.04, "#ff9ab0", true]); // 붉은 볼
    }
    eyes(P, 0.255, 0.07, 0.48 * sq, 0.045, "#3a1010", a.stag);
    P.push([0.12, 0, 0.58 * sq, 0.28, 0.32, 0.06, "#3a4a8a"], [0.12, 0, 0.575 * sq, 0.3, 0.34, 0.015, "#ffd23f"]); // 투구
    // 떡메: 위로 들었다가(swing 1) 내려요
    const hz = 0.3 + swing * 0.45, hf = 0.32 - swing * 0.16;
    P.push([hf, 0.26, hz - 0.2, 0.04, 0.04, 0.42, "#a87a4a"]); // 자루
    P.push([hf + 0.04, 0.26, hz + 0.18, 0.18, 0.16, 0.14, "#c89a62"]); // 망치 머리
    // 절구 (옆)
    P.push([0.18, -0.46, 0, 0.2, 0.2, 0.16, "#8a6a4a"], [0.18, -0.46, 0.16, 0.16, 0.16, 0.02, "#fff6f0"]);
    drawVoxelParts(m, P, { top: 0.95 });
  },
});

// ----- 안내 문구 · 단계 목소리 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w3_botCharge: { text: "금색 기둥을 두 번!", do: true, voice: true },
  w3_botLaser: { text: "빨간 줄 옆으로" },
  w3_botStomp: { text: "원 밖! 쿵 뒤에 공격" },
  w3_botCall: { text: "작은 로봇부터!" },
  w3_burrow: { text: "발자국 끝 흙더미를 쳐요!", do: true, voice: true },
  w3_burrowPop: { text: "금색 원 밖으로! 흙더미를 쳐도 돼요", do: true },
  w3_digSpray: { text: "부채꼴 옆으로" },
  w3_dirtRain: { text: "원 사이로 걸어가요" },
  w3_ballRoll: { text: "크레이터 너머 금색 원에 서요!", do: true, voice: true },
  w3_beetleCharge: { text: "빨간 길 옆으로!" },
  w3_wingRing: { text: "데굴이 옆 금색 안으로!", do: true },
  w3_dustRain: { text: "원 사이로 걸어가요" },
  w3_mochiBeat: { text: "쿵·쿵·쿵·쉼! 쉼에 공격!", do: true, voice: true },
  w3_malletSlam: { text: "원 밖으로 한 걸음!", noBanner: true },
  w3_mochiRain: { text: "원 사이로! 맞으면 끈적해요" },
  w3_bunnyHop: { text: "원 밖으로 굴러요" },
  w3_bunnyCall: { text: "토끼 병사부터!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") Object.assign(GUIDE_PHASE_VOICE, {
  moonbase: { 0: "금색 기둥을 두 번 쳐서 플러그를 뽑아요!", 1: "청소 로봇이 와요! 금색 기둥은 계속 쳐요", 2: "기둥 두 개가 같이 빛나요! 둘 다 뽑아요" },
  dustsea: { 0: "발자국 끝 흙더미를 먼저 쳐요!", 1: "두 번 연달아 숨어요!", 2: "가짜 발자국! 금색 동그라미만 진짜예요" },
  craterfield: { 0: "크레이터 너머에 서면 돌공이 돌아가요!", 1: "날개 퍼덕! 바로 옆이 안전해요", 2: "돌공이 두 개! 둘 다 돌려보내요" },
  rabbitvale: { 0: "쿵 쿵 쿵 쉼! 쉼에 공격해요", 1: "다섯 박자예요! 쉼이 늦게 와요", 2: "떡메가 두 개! 박자를 잘 세요" },
});
