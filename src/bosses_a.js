// ===== 보스 6종 (앞쪽 맵): 이끼 동굴 ~ 버섯 늪 =====
// 같은 문법(스킬 dungeon-creature): BOSS_DEFS[mapId] = { id, name, title, size, material, arena, phases, create }
// - 모양: 블록(복셀)을 쌓아 만든 "거대하지만 귀여운" 몸 (큰 눈, 통통한 몸, 짧은 팔다리)
// - 행동: bossAI = 단계(phases)마다 정해진 순서(pattern)로 기술을 써요. 큰 공격 뒤엔 비틀거림(약점 시간)!
// - 단계가 바뀔 때 2초 동안 무적 + "N단계!" 연출
// - 모든 아픈 공격은 바닥 예고(abilities.js) 0.45초 이상

var BOSS_DEFS = (typeof window !== "undefined" && window.BOSS_DEFS) || (typeof BOSS_DEFS !== "undefined" ? BOSS_DEFS : {});
if (typeof window !== "undefined") window.BOSS_DEFS = BOSS_DEFS;

// ----- 보스 부품 (대장장이에서 강화에 쓰고, enchant 가 있으면 마법이 열려요) -----
Object.assign(MATERIALS, {
  shroomCap: { name: "버섯 왕관 조각", color: "#e04a4a" },
  giantBone: { name: "거인의 뼈", color: "#efe6cf" },
  royalJelly: { name: "왕 젤리", color: "#7be86a" },
  pharaohGold: { name: "파라오의 황금", color: "#ffcc33", enchant: "emerald" },
  frostHeart: { name: "서리 심장", color: "#9fe6ff", enchant: "slow" },
  queenSilk: { name: "여왕의 비단실", color: "#d8c8ff" },
});

// ----- 보스방 소품·쫄 정의 -----
Object.assign(MONSTERS, {
  bossEgg: { name: "거미 알", color: "#e8e0c8", shape: "egg", behavior: "prop", hp: 5, speed: 0, damage: 0, xp: 1, emerald: 0.2, heavy: true },
  sarcophagus: { name: "석관", color: "#c9a050", shape: "sarcophagus", behavior: "prop", hp: 10, speed: 0, damage: 0, xp: 3, emerald: 0.5, heavy: true },
  bossRock: { name: "떨어진 바위", color: "#8a8178", shape: "rock", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true },
  icePillar: { name: "얼음 기둥", color: "#bfe6fa", shape: "pillar", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true },
  feederSlime: { name: "먹보 슬라임", shape: "slime", behavior: "feeder", hp: 4, speed: 1.0, damage: 0.5, xp: 2, emerald: 0.3, color: "#a8f07a", size: 0.8 },
});

Object.assign(BEHAVIOR_DOCS, {
  bossAI: { name: "보스", desc: "단계마다 정해진 순서로 큰 기술을 써요. 큰 공격 뒤엔 비틀거려요.", counter: "예고를 피하고, 비틀거릴 때(별이 돌 때) 마구 때리기" },
  prop: { name: "보스방 물건", desc: "알·석관·바위·얼음 기둥처럼 움직이지 않아요. 알은 부화하고, 석관은 미라를 불러요.", counter: "알과 석관은 빨리 부수기, 바위·기둥은 숨는 데 쓰기" },
  feeder: { name: "먹보", desc: "보스에게 걸어가서 닿으면 보스 체력을 채워줘요.", counter: "보스에게 닿기 전에 잡거나 얼음 화살로 느리게" },
});

// ----- 보스 기술 -----
Object.assign(ABILITIES, {
  bossSlam: {
    name: "거대 내려찍기", desc: "몸을 크게 들었다가 앞 땅을 쾅! 내려친 뒤 잠깐 비틀거려요.",
    counter: "빨간 원 밖으로 피하고, 비틀거릴 때 공격!", tags: ["boss", "area", "stagger"],
    telegraph: { shape: "circle", radius: 2.2, at: "front", offset: 1.7, time: 1.1 },
    cooldown: 6, range: [0, 3.6], damageMul: 2.2, anim: "slam", staggerAfter: 2.2,
    effect: { type: "knockback", force: 1.6 },
  },
  sporeCloud: {
    name: "포자 구름", desc: "발밑에 초록 포자 구름이 피어나 한동안 남아요.",
    counter: "초록 장판 밖에서 싸우기", tags: ["boss", "zone", "poison"],
    telegraph: { shape: "circle", radius: 1.6, at: "target", time: 0.9 },
    cooldown: 8, range: [0, 9], damageMul: 0.6, anim: "roar",
    effect: { type: "zone", duration: 6, tick: 0.8, kind: "poison" },
  },
  sporeRain: {
    name: "포자 비", desc: "포자 덩어리가 여러 군데 떨어져요.",
    counter: "원들 사이 빈 곳으로 걸어가기", tags: ["boss", "multi"],
    telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.1 },
    cooldown: 10, range: [0, 10], damageMul: 1.4, anim: "roar",
    effect: { type: "rain", count: 7, spread: 3.6, stagger: 0.2 },
  },
  mushroomCall: {
    name: "꼬마 부르기", desc: "꼬마 슬라임들을 불러요. 부르는 동안 때리면 끊겨요.",
    counter: "부를 때 화살이나 칼로 끊기", tags: ["boss", "summon"],
    telegraph: { shape: "circle", radius: 1.2, at: "self", time: 1.0 },
    cooldown: 12, range: [0, 12], damageMul: 0, anim: "raise", interruptible: true, interruptAt: 0.06,
    effect: { type: "summon", monster: "slimeSmall", count: 3 },
  },
  boneSlam: {
    name: "뼈 주먹 박기", desc: "커다란 주먹을 땅에 박아요. 주먹이 박혀 있는 동안 약점이 드러나요.",
    counter: "원 밖으로 피한 뒤, 박힌 동안 3단 연속기!", tags: ["boss", "area", "stagger"],
    telegraph: { shape: "circle", radius: 2.4, at: "front", offset: 1.8, time: 1.15 },
    cooldown: 6, range: [0, 3.8], damageMul: 2.4, anim: "slam", staggerAfter: 2.6,
    effect: { type: "knockback", force: 1.8 },
  },
  boulderToss: {
    name: "바위 던지기", desc: "바위를 여러 개 던져요. 떨어진 바위는 그대로 남아요.",
    counter: "원을 피하고, 남은 바위를 기억해두기 (숨을 곳!)", tags: ["boss", "multi", "cover"],
    telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.2 },
    cooldown: 14, range: [0, 12], damageMul: 1.6, anim: "raise",
    effect: { type: "rain", count: 3, spread: 4.2, stagger: 0.35, leaveRock: true },
  },
  giantRoar: {
    name: "거인의 포효", desc: "아주 오래 숨을 들이쉬었다가 방 전체에 충격파를 내뿜어요.",
    counter: "바위(또는 기둥) 뒤에 숨기! 보스와 나 사이에 바위가 있으면 안전", tags: ["boss", "cover"],
    telegraph: { shape: "circle", radius: 16, at: "self", time: 2.8 },
    cooldown: 20, range: [0, 20], damageMul: 1.9, anim: "roar", staggerAfter: 2.4,
    effect: { type: "losBlast", cover: "bossRock" },
  },
  stompRing: {
    name: "발구르기 고리", desc: "발을 쾅 굴러 몸 둘레에 고리 충격파를 보내요. 바로 옆은 안전해요.",
    counter: "보스 발밑으로 파고들거나 아주 멀리", tags: ["boss", "ring"],
    telegraph: { shape: "ring", radius: 5, inner: 1.7, at: "self", time: 1.0 },
    cooldown: 8, range: [0, 6], damageMul: 1.8, anim: "slam",
    effect: { type: "knockback", force: 1.4 },
  },
  slimeJump: {
    name: "왕 슬라임 점프", desc: "높이 뛰어올라 주인공을 따라오다가 멈춘 곳에 쿵! 끈적한 자국이 남아요.",
    counter: "그림자가 멈추면(테두리가 굵어지면) 빠져나가기. 착지 후 출렁일 때 공격!", tags: ["boss", "track", "stagger"],
    telegraph: { shape: "circle", radius: 2.0, at: "target", time: 1.5, follow: true },
    cooldown: 7, range: [0, 12], damageMul: 2.1, anim: "jump", staggerAfter: 1.4,
    effect: { type: "jumpLand", slowZone: 2.0 },
  },
  slimeCall: {
    name: "먹보 부르기", desc: "방 가장자리에 먹보 슬라임 2마리를 불러요. 먹보가 보스에게 닿으면 보스가 회복해요.",
    counter: "먹보를 보스에게 닿기 전에 잡기", tags: ["boss", "summon", "heal"],
    telegraph: { shape: "circle", radius: 1.4, at: "self", time: 0.9 },
    cooldown: 14, range: [0, 20], damageMul: 0, anim: "raise",
    effect: { type: "summonEdge", monster: "feederSlime", count: 2 },
  },
  checkerRain: {
    name: "젤리 비", desc: "젤리 덩어리가 바둑판처럼 우수수 떨어져요.",
    counter: "원들이 없는 칸으로 재빨리", tags: ["boss", "multi"],
    telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.3 },
    cooldown: 9, range: [0, 12], damageMul: 1.3, anim: "jump",
    effect: { type: "rain", count: 11, spread: 5, stagger: 0.07 },
  },
  bandagePull: {
    name: "붕대 사슬", desc: "붕대를 휘감아 주인공을 끌어당긴 뒤 바로 지팡이로 내려쳐요.",
    counter: "보라 원 밖으로! 끌려가면 바로 구르기", tags: ["boss", "pull"],
    telegraph: { shape: "circle", radius: 6, at: "self", time: 1.0 },
    cooldown: 10, range: [0, 6], damageMul: 0.4, anim: "point", followUp: "pharaohSmash",
    effect: { type: "pull", force: 3 },
  },
  pharaohSmash: {
    name: "파라오의 지팡이", desc: "황금 지팡이로 앞을 쾅 내려쳐요. 그 뒤 잠깐 숨을 골라요.",
    counter: "원 밖으로 구르기, 숨 고를 때 공격", tags: ["boss", "area", "stagger"],
    telegraph: { shape: "circle", radius: 1.9, at: "front", offset: 1.3, time: 0.75 },
    cooldown: 5, range: [0, 3.2], damageMul: 2.0, anim: "slam", staggerAfter: 1.8,
    effect: { type: "knockback", force: 1.4 },
  },
  sandRain: {
    name: "모래 기둥", desc: "모래가 여러 군데서 솟구쳐요.",
    counter: "원들 사이로 움직이기", tags: ["boss", "multi"],
    telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.0 },
    cooldown: 9, range: [0, 12], damageMul: 1.4, anim: "raise",
    effect: { type: "rain", count: 6, spread: 3.6, stagger: 0.16 },
  },
  sandstorm: {
    name: "모래 폭풍", desc: "몸 둘레로 모래바람을 일으켜 밀어내요.",
    counter: "미리 떨어지거나 구르기", tags: ["boss", "push"],
    telegraph: { shape: "circle", radius: 4.2, at: "self", time: 1.0 },
    cooldown: 10, range: [0, 4.2], damageMul: 1.2, anim: "roar",
    effect: { type: "knockback", force: 2.6 },
  },
  arrowTraps: {
    name: "벽 화살 함정", desc: "벽에서 화살이 줄지어 날아와요. 빨간 줄이 차례로 켜져요.",
    counter: "빨간 줄 사이 빈 줄에 서 있기", tags: ["boss", "line", "trap"],
    telegraph: { shape: "line", length: 26, width: 1.4, at: "fixed", time: 1.3 },
    cooldown: 12, range: [0, 20], damageMul: 1.5, anim: "point",
    effect: { type: "lineVolley", lines: 5, spacing: 3.2 },
  },
  iceLance: {
    name: "얼음 창", desc: "주인공을 겨누다가 길쭉한 얼음 창을 쏴요.",
    counter: "가는 줄이라 옆으로 한 걸음 비키기", tags: ["boss", "line", "ice"],
    telegraph: { shape: "line", length: 10, width: 0.9, at: "self", time: 0.85, follow: true },
    cooldown: 4, range: [0, 10], damageMul: 1.8, anim: "point",
    effect: { type: "slow", duration: 1.5 },
  },
  frostNova: {
    name: "서리 폭발", desc: "얼음 기둥을 세운 뒤 방 전체를 얼려요.",
    counter: "얼음 기둥 뒤로 숨기! 보스와 나 사이에 기둥이 있어야 안전", tags: ["boss", "cover", "ice"],
    telegraph: { shape: "circle", radius: 16, at: "self", time: 2.8 },
    cooldown: 18, range: [0, 20], damageMul: 1.8, anim: "roar", staggerAfter: 2.4,
    effect: { type: "losBlast", cover: "icePillar", slow: 2 },
  },
  iceShield: {
    name: "얼음 갑옷", desc: "얼음 보호막을 둘러요. 불화살에 아주 약해요.",
    counter: "불화살을 쏘면 보호막이 3배로 빨리 깨져요", tags: ["boss", "shield"],
    telegraph: { shape: "self", radius: 1.5, at: "self", time: 0.8 },
    cooldown: 16, range: [0, 20], damageMul: 0, anim: "raise",
    effect: { type: "shield", amount: 0.12, duration: 10 },
  },
  blizzard: {
    name: "따라오는 눈보라", desc: "눈보라가 주인공을 따라오다가 멈춘 곳에 한동안 남아요.",
    counter: "계속 움직이다가 멈추면 빠져나가기", tags: ["boss", "track", "zone"],
    telegraph: { shape: "circle", radius: 1.7, at: "target", time: 1.6, follow: true },
    cooldown: 8, range: [0, 12], damageMul: 0.8, anim: "staff",
    effect: { type: "zone", duration: 4, tick: 0.6, kind: "frost" },
  },
  layEggs: {
    name: "알 낳기", desc: "거미 알을 낳아요. 시간 안에 깨지 않으면 새끼 거미가 나와요.",
    counter: "알부터 빨리 부수기 (알이 흔들리면 곧 부화)", tags: ["boss", "summon"],
    telegraph: { shape: "circle", radius: 1.3, at: "self", time: 0.9 },
    cooldown: 15, range: [0, 20], damageMul: 0, anim: "crouch",
    effect: { type: "eggs", count: 2 },
  },
  ceilingDrop: {
    name: "천장 낙하", desc: "천장으로 숨었다가 그림자를 따라와서 쿵 떨어져요. 떨어진 뒤 뒤집혀 버둥거려요.",
    counter: "그림자가 멈추면 빠져나가기, 버둥거릴 때 공격!", tags: ["boss", "track", "stagger"],
    telegraph: { shape: "circle", radius: 2.0, at: "target", time: 2.4, follow: true },
    cooldown: 12, range: [0, 20], damageMul: 2.6, anim: "climb", staggerAfter: 2.2,
    effect: { type: "climbLand" },
  },
});

// ===== 보스 정의 =====
const BOSS_A_LIST = [
  {
    mapId: "cave", color: "#d8423a", type: "bossShroom", name: "뭉게뭉게", title: "이끼버섯 거인", shape: "bossShroom",
    size: 2.8, r: 1.0, hp: 190, damage: 1.6, speed: 0.9,
    material: { id: "shroomCap", name: "버섯 왕관 조각", color: "#e04a4a" },
    arena: { size: 22, theme: { floor: "#5e6b52", moss: "#7a9a5a", wall: "#7a6e5e", darkness: 0.36, bg: "#10160c" } },
    phases: [
      { until: 0.66, gap: 1.8, pattern: ["bossSlam", "sporeCloud", "bossSlam"] },
      { until: 0.33, gap: 1.6, pattern: ["mushroomCall", "bossSlam", "sporeCloud", "sporeRain"] },
      { until: 0, gap: 1.3, pattern: ["sporeRain", "bossSlam", "mushroomCall", "sporeCloud", "bossSlam"] },
    ],
  },
  {
    mapId: "crypt", color: "#efe6cf", type: "bossBone", name: "덜그럭", title: "뼈다귀 거인", shape: "bossBone",
    size: 3.1, r: 1.1, hp: 170, damage: 1.8, speed: 0.85,
    material: { id: "giantBone", name: "거인의 뼈", color: "#efe6cf" },
    arena: { size: 24, theme: { floor: "#5b5763", moss: "#6d5a7d", wall: "#77707f", darkness: 0.44, bg: "#141218" } },
    phases: [
      { until: 0.66, gap: 1.6, pattern: ["boneSlam", "groundSpikes", "boneSlam"] },
      { until: 0.33, gap: 1.5, pattern: ["boulderToss", "giantRoar", "boneSlam", "groundSpikes"] },
      { until: 0, gap: 1.2, pattern: ["stompRing", "boneSlam", "boulderToss", "giantRoar", "stompRing"] },
    ],
  },
  {
    mapId: "jungle", color: "#6fdc5a", type: "bossSlime", name: "말랑대왕", title: "거대 슬라임 왕", shape: "bossSlime",
    size: 2.7, r: 1.15, hp: 145, damage: 1.7, speed: 1.0,
    material: { id: "royalJelly", name: "왕 젤리", color: "#7be86a" },
    arena: { size: 24, theme: { floor: "#56703f", moss: "#46622f", wall: "#6e5b3b", darkness: 0.32, bg: "#10160c" } },
    phases: [
      { until: 0.66, gap: 1.5, pattern: ["slimeJump", "slimeJump", "checkerRain"] },
      { until: 0.33, gap: 1.4, pattern: ["slimeCall", "slimeJump", "checkerRain", "slimeJump"] },
      { until: 0, gap: 1.1, pattern: ["checkerRain", "slimeJump", "slimeCall", "slimeJump", "checkerRain"] },
    ],
  },
  {
    mapId: "desert", color: "#ffcc33", type: "bossPharaoh", name: "투탕카뭉", title: "미라 파라오", shape: "bossPharaoh",
    size: 2.9, r: 1.0, hp: 160, damage: 1.9, speed: 0.95,
    material: { id: "pharaohGold", name: "파라오의 황금", color: "#ffcc33", enchant: "emerald" },
    arena: { size: 24, theme: { floor: "#c9a86a", moss: "#b08a4e", wall: "#a8875a", darkness: 0.26, bg: "#1e170c" } },
    phases: [
      { until: 0.66, gap: 1.6, pattern: ["bandagePull", "sandRain", "pharaohSmash"] },
      { until: 0.33, gap: 1.5, pattern: ["sandRain", "bandagePull", "pharaohSmash", "sandstorm"] },
      { until: 0, gap: 1.2, pattern: ["arrowTraps", "bandagePull", "sandstorm", "arrowTraps", "sandRain"] },
    ],
  },
  {
    mapId: "ice", color: "#bfe6fa", type: "bossFrost", name: "눈송이", title: "서리 여왕", shape: "bossFrost",
    size: 2.8, r: 0.95, hp: 170, damage: 2.0, speed: 0.9,
    material: { id: "frostHeart", name: "서리 심장", color: "#9fe6ff", enchant: "slow" },
    arena: { size: 24, theme: { floor: "#a9c4d8", moss: "#d8ecf7", wall: "#7f9fb8", darkness: 0.3, bg: "#0c1420" } },
    phases: [
      { until: 0.66, gap: 1.4, pattern: ["iceLance", "frostBreath", "iceLance", "blizzard"] },
      { until: 0.33, gap: 1.4, pattern: ["frostNova", "iceShield", "iceLance", "blizzard", "frostBreath"] },
      { until: 0, gap: 1.1, pattern: ["blizzard", "iceLance", "frostNova", "iceLance", "frostBreath", "iceShield"] },
    ],
  },
  {
    mapId: "swamp", color: "#5a3a6e", type: "bossSpider", name: "실타래", title: "늪 거미 여왕", shape: "bossSpider",
    size: 2.6, r: 1.2, hp: 150, damage: 2.0, speed: 1.2,
    material: { id: "queenSilk", name: "여왕의 비단실", color: "#d8c8ff" },
    arena: { size: 24, theme: { floor: "#4d5a3f", moss: "#7a4d8a", wall: "#5a4a3f", darkness: 0.44, bg: "#0f0c14" } },
    phases: [
      { until: 0.66, gap: 1.5, pattern: ["webTrap", "layEggs", "volley", "webTrap"] },
      { until: 0.33, gap: 1.5, pattern: ["ceilingDrop", "poisonPool", "layEggs", "volley"] },
      { until: 0, gap: 1.2, pattern: ["charge", "ceilingDrop", "webTrap", "poisonPool", "layEggs", "charge"] },
    ],
  },
];

for (const B of BOSS_A_LIST) {
  MONSTERS[B.type] = {
    name: B.name, shape: B.shape, behavior: "bossAI", color: B.color, hp: B.hp, speed: B.speed, damage: B.damage,
    xp: 40, emerald: 1, emeraldCount: 10, heavy: true, isBoss: true, size: B.size,
  };
  const phases = B.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS[B.mapId] = {
    id: B.type, name: B.name, title: B.title, size: B.size,
    material: B.material, arena: B.arena, phases,
    create(x, y, level) {
      const m = createMonster(B.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[B.mapId];
      m.name = `${B.title} ${B.name}`;
      m.r = B.r; m.level = level;
      m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2;
      m.queue = [];
      m.onPhase = (idx) => bossPhaseEvent(m, B.mapId, idx);
      return m;
    },
  };
}

function bossTune() {
  return typeof abilityTuning === "function" ? abilityTuning() : { telegraph: 1, damage: 1, size: 1, cooldown: 1 };
}

// ----- 단계 전환 이벤트 (아레나 변화) -----
function bossPhaseEvent(m, mapId, idx) {
  if (mapId === "desert" && idx === 1) {
    // 석관 4개: 미라를 불러요. 석관이 남아 있으면 보스가 덜 아파요
    const c = { x: world.W / 2, y: world.H / 2 };
    for (const [ox, oy] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) spawnProp("sarcophagus", c.x + ox, c.y + oy, m);
    showMessage("석관이 열린다! 석관을 부숴야 파라오가 아파해요", 3, false, "#ffcc66");
  }
  if (mapId === "ice" && idx === 1) {
    const c = { x: world.W / 2, y: world.H / 2 };
    for (const [ox, oy] of [[-4, 2], [3, -4], [4, 4], [-3, -3]]) spawnProp("icePillar", c.x + ox, c.y + oy, m);
    showMessage("얼음 기둥이 솟았어요! 서리 폭발 때 숨어요", 3, false, "#bfeaff");
  }
  if (mapId === "jungle" && idx === 2) {
    // 마지막 단계: 꼬마 슬라임 4마리
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const s = createMonster("slimeSmall", m.x + Math.cos(a) * 2, m.y + Math.sin(a) * 2, m.level || game.mapLevel);
      s.aggro = true; s.appearTimer = 0.5; monsters.push(s);
    }
  }
}

function spawnProp(type, x, y, owner) {
  const spot = findFreeSpot(x, y, 0.6, 3) || { x, y };
  const s = createMonster(type, spot.x, spot.y, (owner && owner.level) || game.mapLevel || 1);
  s.aggro = true; s.appearTimer = 0.4; s.owner = owner; s.immovable = true;
  s.r = type === "bossRock" || type === "icePillar" ? 0.55 : 0.45;
  if (MONSTERS[type].untargetable) world.solids.push({ x: s.x, y: s.y, r: s.r, prop: s });
  monsters.push(s);
  addRing(s.x, s.y, { speed: 3, life: 0.4, hue: 40 });
  return s;
}

// ===== 보스 행동 =====
const EXTRA_BEHAVIORS_A = {
  bossAI(m, p, dist, dt) {
    const def = m.bossDef;
    const frac = m.hp / m.maxHp;
    let idx = def.phases.findIndex((ph) => frac > ph.until);
    if (idx < 0) idx = def.phases.length - 1;
    if (idx !== m.phaseIdx && m.state !== "cast" && !m.charge) {
      m.phaseIdx = idx; m.patIdx = 0; m.queue = [];
      m.invuln = 2.2; m.stagger = 0; m.hidden = false;
      onPhaseChange(m, idx);
      return;
    }
    if (m.invuln > 0) { m.invuln -= dt; m.moving = false; return; }
    if (m.stagger > 0) { m.stagger -= dt; m.moving = false; return; }
    if (m.charge || m.state === "cast") { m.moving = false; return; }
    const ph = def.phases[m.phaseIdx];
    m.gap -= dt;
    let next = m.queue.length ? m.queue[0] : ph.pattern[m.patIdx % ph.pattern.length];
    const ab = ABILITIES[next];
    if (m.gap <= 0) {
      if (m.queue.length || (dist >= ab.range[0] && dist <= ab.range[1])) {
        if (m.queue.length) m.queue.shift(); else m.patIdx++;
        startBossAbility(m, next, p);
        m.gap = ph.gap * bossTune().cooldown;
        return;
      }
      // 사거리가 안 맞으면 다가가요 (너무 오래 못 쓰면 다음 기술로)
      m.waitT = (m.waitT || 0) + dt;
      if (m.waitT > 3) { m.waitT = 0; m.patIdx++; }
    }
    if (dist > 2.2) chaseMove(m, p, dist, dt);
    else { m.moving = false; faceToward(m, p); }
  },

  prop(m, p, dist, dt) {
    m.moving = false;
    const type = m.type;
    if (type === "bossEgg") {
      m.hatchT = (m.hatchT === undefined ? m.hatchMax : m.hatchT) - dt;
      if (m.hatchT <= 0) {
        for (let i = 0; i < 3; i++) {
          const s = createMonster("spider", m.x + (Math.random() - 0.5), m.y + (Math.random() - 0.5), m.level || game.mapLevel);
          s.aggro = true; s.appearTimer = 0.3; monsters.push(s);
        }
        spawnBurst(m.x, m.y, ["#e8e0c8", "#7a6a50"], 12);
        m.hp = 0; m.silent = true;
      }
    }
    if (type === "sarcophagus") {
      m.summonT = (m.summonT === undefined ? 3 : m.summonT) - dt;
      if (m.summonT <= 0) {
        m.summonT = 8 * bossTune().cooldown;
        const alive = monsters.filter((o) => o.fromSarc === m && o.hp > 0).length;
        if (alive < 2) {
          const s = createMonster("mummy", m.x + 0.8, m.y + 0.8, m.level || game.mapLevel);
          s.aggro = true; s.appearTimer = 0.6; s.fromSarc = m; monsters.push(s);
          addRing(m.x, m.y, { speed: 3, life: 0.4, hue: 45 });
        }
      }
    }
  },

  feeder(m, p, dist, dt) {
    const boss = monsters.find((o) => o.bossA && o.hp > 0);
    if (!boss) { m.moving = false; return; }
    const d = Math.hypot(boss.x - m.x, boss.y - m.y);
    if (d < boss.r + 0.5) {
      const h = boss.maxHp * 0.06;
      boss.hp = Math.min(boss.maxHp, boss.hp + h);
      addFloatText(boss.x, boss.y, `+${Math.round(h)} 냠!`, "#7dffb0", 22);
      spawnBurst(m.x, m.y, ["#a8f07a", "#ffffff"], 10);
      m.hp = 0; m.silent = true;
      return;
    }
    moveWithSeparation(m, (boss.x - m.x) / d, (boss.y - m.y) / d, dt, m.speed);
  },
};
Object.assign(EXTRA_BEHAVIORS, EXTRA_BEHAVIORS_A);

// 기술 시작 (특별한 기술은 여기서)
function startBossAbility(m, id, p) {
  const ab = ABILITIES[id];
  if (ab.effect.type === "lineVolley") {
    // 아레나를 가로지르는 줄 여러 개 (빈 줄이 안전)
    const tune = bossTune();
    const e = ab.effect;
    const horiz = Math.random() < 0.5;
    const cx = world.W / 2, cy = world.H / 2;
    const safe = Math.floor(Math.random() * e.lines);
    m.state = "cast"; m.castAnim = ab.anim; m.castT = 0; m.castTime = ab.telegraph.time * tune.telegraph; m.moving = false;
    let last = null;
    for (let i = 0; i < e.lines; i++) {
      if (i === safe) continue;
      const off = (i - (e.lines - 1) / 2) * e.spacing;
      const time = Math.max(MIN_TELEGRAPH, ab.telegraph.time * tune.telegraph) + i * 0.12;
      const c = makeCast(m, ab, id, p, time, tune);
      if (horiz) { c.x = cx - ab.telegraph.length / 2; c.y = cy + off; c.dirX = 1; c.dirY = 0; }
      else { c.x = cx + off; c.y = cy - ab.telegraph.length / 2; c.dirX = 0; c.dirY = 1; }
      c.trap = true;
      casts.push(c);
      last = c;
    }
    if (last) last.ownerLock = true;
    if (typeof sfx !== "undefined") sfx.fuse();
    return;
  }
  castAbility(m, id, p);
  if (ab.effect.type === "climbLand") { m.hidden = true; spawnDust(m.x, m.y); }
}

// 보스와 나 사이에 숨을 물건이 있나
function coverBetween(ax, ay, bx, by, type) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
  for (const o of monsters) {
    if (o.type !== type || o.hp <= 0) continue;
    const t = Math.max(0, Math.min(1, ((o.x - ax) * dx + (o.y - ay) * dy) / L2));
    const px = ax + dx * t, py = ay + dy * t;
    if (t > 0.05 && t < 0.98 && Math.hypot(o.x - px, o.y - py) < o.r + 0.25) return true;
  }
  return false;
}

// ----- 예고 끝 -> 효과 (기본 효과 뒤에, hooks.js "castResolved") -----
hookOn("castResolved", (c, p) => {
  const ab = c.ab, e = ab.effect, m = c.m;
  const inside = p && p.hp > 0 && insideShape(c, p.x, p.y, p.r * 0.6);
  const dmg = abilityDamage(c);
  const hit = () => {
    if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); return false; }
    const h0 = p.hp; hurtPlayer(p, dmg, m); return p.hp < h0;
  };
  if (e.type === "damage" && c.trap) { /* 기본 처리로 충분 */ }
  if (e.type === "losBlast") {
    addRing(m.x, m.y, { speed: 14, life: 0.5, hue: e.cover === "icePillar" ? 195 : 30 });
    addRing(m.x, m.y, { speed: 9, life: 0.6, hue: e.cover === "icePillar" ? 200 : 20, delay: 0.1 });
    flashScreen(0.15); game.shake = Math.max(game.shake, 0.45);
    if (typeof sfx !== "undefined") sfx.boom();
    if (p && p.hp > 0) {
      if (coverBetween(m.x, m.y, p.x, p.y, e.cover)) addFloatText(p.x, p.y, "숨었다!", "#9be8ff", 20);
      else if (hit() && e.slow) p.abSlow = Math.max(p.abSlow || 0, e.slow);
    }
  }
  if (e.type === "jumpLand") {
    const spot = findFreeSpot(c.x, c.y, m.r, 3) || { x: c.x, y: c.y };
    m.x = spot.x; m.y = spot.y;
    addRing(c.x, c.y, { speed: 7, life: 0.4, hue: 100 }); spawnDust(c.x, c.y); spawnDust(c.x, c.y);
    game.shake = Math.max(game.shake, 0.35);
    if (typeof sfx !== "undefined") sfx.slam();
    if (inside) hit();
    zones.push({ x: c.x, y: c.y, radius: e.slowZone * c.tune.size, life: 4, max: 4, tick: 1, tickT: 1, damage: 0, kind: "web" });
  }
  if (e.type === "climbLand") {
    m.hidden = false;
    const spot = findFreeSpot(c.x, c.y, m.r, 3) || { x: c.x, y: c.y };
    m.x = spot.x; m.y = spot.y;
    addRing(c.x, c.y, { speed: 7, life: 0.4, hue: 280 }); spawnDust(c.x, c.y); spawnDust(c.x, c.y);
    game.shake = Math.max(game.shake, 0.4);
    if (typeof sfx !== "undefined") sfx.slam();
    if (inside) hit();
  }
  if (e.type === "summonEdge") {
    // 보스에서 먼 방 가장자리에 불러요 (잡을 시간!)
    for (let i = 0; i < e.count; i++) {
      const a = Math.atan2(m.y - world.H / 2, m.x - world.W / 2) + Math.PI + (i - (e.count - 1) / 2) * 0.9;
      const r = world.W / 2 - 3.2;
      const spot = findFreeSpot(world.W / 2 + Math.cos(a) * r, world.H / 2 + Math.sin(a) * r, 0.35, 3) || { x: world.W / 2, y: world.H / 2 };
      const s = createMonster(e.monster, spot.x, spot.y, m.level || game.mapLevel);
      s.aggro = true; s.appearTimer = 0.6; s.summoned = true; monsters.push(s);
      addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 100 });
    }
    showMessage("먹보가 나타났어요! 보스에게 가기 전에 잡아요", 2, false, "#a8f07a");
  }
  if (e.type === "eggs") {
    const t = typeof game !== "undefined" && game.profile ? game.profile.difficulty : "normal";
    const hatch = { easy: 11, normal: 8, hard: 7, nightmare: 6 }[t] || 8;
    for (let i = 0; i < e.count; i++) {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 3;
      const egg = spawnProp("bossEgg", world.W / 2 + Math.cos(a) * r, world.H / 2 + Math.sin(a) * r, m);
      egg.hatchMax = hatch;
    }
    showMessage("알을 낳았어요! 부화하기 전에 깨요", 2, false, "#e8e0c8");
  }
  if (e.leaveRock && c.sub) {
    if (!p || Math.hypot(p.x - c.x, p.y - c.y) > 1.1) spawnProp("bossRock", c.x, c.y, m);
  }
  if (ab.staggerAfter && m.hp > 0) {
    const t = typeof game !== "undefined" && game.profile ? game.profile.difficulty : "normal";
    const k = { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[t] || 1;
    m.stagger = ab.staggerAfter * k;
    m.state = "chase";
  }
  if (ab.followUp && m.queue) { m.queue.unshift(ab.followUp); m.gap = 0.15; }
}, 20);

// ----- 피해 받기: 무적·비틀거림 약점·석관·불 vs 얼음 보호막 (hooks.js) -----
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (m.def && m.def.untargetable) return true;
  if (m.bossA) {
    if (m.invuln > 0 || m.hidden) { if (!h.opts.dot) addFloatText(m.x, m.y, "무적!", "#bbbbbb", 16); return true; }
    if (m.stagger > 0) { h.dmg *= 1.5; if (!h.opts.dot && Math.random() < 0.3) addFloatText(m.x, m.y + 0.3, "약점!", "#ffe27a", 18); }
    if (monsters.some((o) => o.type === "sarcophagus" && o.hp > 0 && o.owner === m)) h.dmg *= 0.5;
    if (m.shieldHp > 0 && h.opts.effect === "burn") h.dmg *= 3;
  }
  return false;
}, 20);
hookOn("monsterDamaged", (h) => { const m = h.m; if (m.bossA || m.immovable) { m.stunTimer = 0; m.knockX = 0; m.knockY = 0; } }, 20);
// 손대지 못하는 물건은 자동 조준에서 빼요
hookOn("untargetable", (o) => !!((o.def && o.def.untargetable) || o.hidden));


// ===== 그리기: 블록을 쌓은 귀여운 거대 몸 =====
// 부품: [앞(f), 옆(s), 바닥높이(z), 가로, 세로, 높이, 색]  (단위: 크기 1 기준)
function drawVoxelParts(m, parts, opts = {}) {
  const S = (m.def.size || 1) * (opts.scale || 1);
  const X = rigTransform(m, { scale: 1 });
  const white = m.flash > 0;
  const list = parts.map((q) => {
    const w = X.world(V(q[0] * S, q[1] * S, (q[2] + q[5] / 2) * S));
    return { w, bw: q[3] * S, bd: q[4] * S, bh: q[5] * S, color: q[6], glow: q[7] };
  });
  list.sort((a, b) => (a.w.x + a.w.y) - (b.w.x + b.w.y) || a.w.z - b.w.z);
  ctx.save();
  // 주인공이 보스 뒤에 있으면 보스를 살짝 투명하게
  const p = game.player;
  if (p && p.x + p.y < m.x + m.y - 0.3 && Math.abs((p.x - m.x) - (p.y - m.y)) < 2.6 && Math.hypot(p.x - m.x, p.y - m.y) < 4) ctx.globalAlpha *= 0.5;
  if (opts.alpha) ctx.globalAlpha *= opts.alpha;
  for (const L of list) {
    drawBox(L.w.x - L.bw / 2, L.w.y - L.bd / 2, Math.max(0, L.w.z - L.bh / 2), L.bw, L.bd, L.bh, white && !L.glow ? "#ffffff" : L.color);
  }
  ctx.restore();
  // 비틀거릴 때 머리 위에 별이 빙글빙글
  if (m.stagger > 0) {
    const top = toScreen(m.x, m.y, (opts.top || 1.1) * S);
    for (let i = 0; i < 3; i++) {
      const a = game.time * 5 + (i * Math.PI * 2) / 3;
      drawStar(top.x + Math.cos(a) * 26 * ZOOM, top.y + Math.sin(a) * 9 * ZOOM, 8 * ZOOM, "#ffe27a");
    }
  }
  if (m.shieldHp > 0) {
    const c = toScreen(m.x, m.y, 0.5 * S);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(150,225,255,${0.5 + 0.2 * Math.sin(game.time * 6)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 0.75 * S * TILE_W * 0.7, 0.75 * S * TILE_H * 1.6, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

// 공통 움직임 값
function bossMotion(m) {
  const t = game.time + (m.x || 0);
  const k = m.state === "cast" ? Math.min(1, m.castT || 0) : 0;
  const anim = m.state === "cast" ? m.castAnim : null;
  const breath = Math.sin(t * 2.4) * 0.015;
  const walk = m.moving ? Math.sin(m.walkTime * 7) : 0;
  const stag = m.stagger > 0 ? 1 : 0;
  return { t, k, anim, breath, walk, stag, raise: anim === "slam" || anim === "raise" || anim === "staff" ? k : 0, roar: anim === "roar" ? k : 0 };
}

// 큰 눈 두 개 (흰자 + 눈동자). f = 얼굴 앞면, z = 눈 높이
function eyes(parts, f, s, z, size, pupil, sleepy) {
  for (const sd of [1, -1]) {
    parts.push([f, sd * s, z, 0.02, size, sleepy ? size * 0.35 : size, "#ffffff", true]);
    parts.push([f + 0.012, sd * s, z + (sleepy ? 0 : size * 0.1), 0.02, size * 0.5, sleepy ? size * 0.2 : size * 0.55, pupil, true]);
  }
}

const EXTRA_SHAPES_A = {
  // 이끼버섯 거인: 빨간 버섯 갓 + 크림색 몸
  bossShroom(m) {
    const a = bossMotion(m);
    const P = [];
    const sq = a.stag ? 0.85 : 1;
    P.push([0.1 + a.walk * 0.06, 0.11, 0, 0.13, 0.13, 0.09, "#7a5230"], [0.1 - a.walk * 0.06, -0.11, 0, 0.13, 0.13, 0.09, "#7a5230"]);
    P.push([0, 0, 0.08, 0.36, 0.36, 0.34 * sq + a.breath, "#f2e6c8"]);
    const arm = 0.18 + 0.28 * a.raise;
    P.push([0.04, 0.23, arm, 0.1, 0.1, 0.15, "#efe0bc"], [0.04, -0.23, arm, 0.1, 0.1, 0.15, "#efe0bc"]);
    eyes(P, 0.181, 0.08, 0.24 * sq, 0.09, "#3a2a1a", a.stag);
    P.push([0.181, 0, 0.16 * sq, 0.02, 0.08, a.roar > 0 ? 0.06 : 0.025, "#7a3a2a", true]);
    const capZ = 0.4 * sq + a.breath + a.raise * 0.05;
    P.push([0, 0, capZ, 0.76, 0.76, 0.2, "#d8423a"], [0, 0, capZ + 0.2, 0.54, 0.54, 0.09, "#e04a4a"]);
    for (const [f, s] of [[0.2, 0.18], [-0.15, 0.24], [0.05, -0.22], [-0.22, -0.1], [0.24, -0.05]]) P.push([f, s, capZ + 0.2, 0.09, 0.09, 0.03, "#ffffff"]);
    P.push([0.15, 0.1, capZ + 0.29, 0.08, 0.08, 0.03, "#ffffff"], [-0.1, -0.1, capZ + 0.29, 0.08, 0.08, 0.03, "#ffffff"]);
    P.push([-0.25, 0.3, capZ - 0.02, 0.12, 0.08, 0.04, "#6aa04a"]); // 이끼
    drawVoxelParts(m, P, { top: 0.95 });
  },

  // 뼈다귀 거인: 큰 해골 머리 + 갈비뼈 + 커다란 주먹
  bossBone(m) {
    const a = bossMotion(m);
    const P = [];
    const bone = "#efe6cf", dark = "#5a5068";
    P.push([a.walk * 0.06, 0.1, 0, 0.11, 0.11, 0.22, bone], [-a.walk * 0.06, -0.1, 0, 0.11, 0.11, 0.22, bone]);
    P.push([0, 0, 0.2, 0.26, 0.22, 0.08, bone]);
    for (let i = 0; i < 3; i++) P.push([0, 0, 0.29 + i * 0.07 + a.breath, 0.34 - i * 0.02, 0.3, 0.045, bone]);
    P.push([-0.02, 0, 0.28, 0.06, 0.06, 0.22, bone]);
    // 팔과 주먹 (박힌 주먹 = 비틀거림)
    for (const sd of [1, -1]) {
      let f = 0.12, z = 0.32, s = sd * 0.27;
      if (a.raise > 0) { z = 0.32 + 0.4 * a.raise; f = 0.05; }
      if (a.stag) { f = 0.5; z = 0.0; s = sd * 0.2; }
      P.push([f * 0.5, sd * 0.24, (z + 0.45) / 2, 0.08, 0.08, 0.16, bone]);
      P.push([f, s, z, 0.17, 0.17, 0.15, a.stag ? "#ffe9a0" : bone, a.stag]);
    }
    const hz = 0.52 + a.breath - a.roar * 0.03;
    P.push([0.02, 0, hz, 0.36, 0.36, 0.3, bone]);
    P.push([0.02, 0, hz - 0.05, 0.26, 0.26, 0.06, bone]); // 턱
    eyes(P, 0.201, 0.08, hz + 0.12, 0.1, "#3fa8ff", a.stag);
    P.push([0.201, 0, hz + 0.02, 0.02, 0.12, a.roar > 0 ? 0.08 : 0.03, dark, true]);
    P.push([-0.1, 0.12, hz + 0.3, 0.06, 0.06, 0.06, dark]); // 금 간 자국
    drawVoxelParts(m, P, { top: 0.95 });
  },

  // 거대 슬라임 왕: 말랑한 젤리 + 왕관
  bossSlime(m) {
    const a = bossMotion(m);
    const P = [];
    const jump = a.anim === "jump" ? Math.sin(a.k * Math.PI) : 0;
    const wob = Math.sin(a.t * 5) * 0.03;
    const hop = jump * 0.6 + (m.moving ? Math.abs(Math.sin(m.walkTime * 5)) * 0.06 : 0);
    const h = (0.46 + wob) * (a.stag ? 0.75 : 1) * (1 - jump * 0.15), w = 0.66 - wob + (a.stag ? 0.08 : 0);
    P.push([0, 0, hop + h * 0.22, w * 0.45, w * 0.45, h * 0.45, "#3f9a3a"]);
    P.push([0, 0, hop, w, w, h, "#6fdc5a"]);
    eyes(P, w / 2 + 0.001, 0.12, hop + h * 0.5, 0.11, "#1a3a1a", a.stag);
    P.push([w / 2 + 0.001, 0, hop + h * 0.3, 0.02, 0.1, 0.03, "#1a3a1a", true]);
    const cz = hop + h;
    P.push([0, 0, cz, 0.3, 0.3, 0.07, "#ffd23f"]);
    for (const [f, s] of [[0.11, 0.11], [0.11, -0.11], [-0.11, 0.11], [-0.11, -0.11]]) P.push([f, s, cz + 0.07, 0.07, 0.07, 0.09, "#ffd23f"]);
    P.push([0.15, 0, cz + 0.03, 0.02, 0.06, 0.04, "#e23b3b", true]);
    drawVoxelParts(m, P, { top: 1.0, alpha: 0.95 });
  },

  // 미라 파라오: 붕대 몸 + 황금·파랑 머리장식 + 지팡이
  bossPharaoh(m) {
    const a = bossMotion(m);
    const P = [];
    const band = "#e6dcc0", gold = "#ffcc33", blue = "#2f5fb0";
    P.push([a.walk * 0.06, 0.08, 0, 0.11, 0.11, 0.26, band], [-a.walk * 0.06, -0.08, 0, 0.11, 0.11, 0.26, band]);
    P.push([0, 0, 0.24, 0.3, 0.26, 0.28 + a.breath, band]);
    P.push([0.001, 0, 0.27, 0.31, 0.27, 0.05, gold]);
    P.push([0.13, 0, 0.36, 0.06, 0.2, 0.1, gold]); // 목걸이
    // 오른손 지팡이
    const sz = 0.3 + 0.35 * a.raise;
    P.push([0.14, -0.22, sz, 0.09, 0.09, 0.12, band]);
    P.push([0.18, -0.22, sz - 0.25, 0.04, 0.04, 0.6, gold], [0.18, -0.22, sz + 0.36, 0.1, 0.1, 0.08, blue, true]);
    // 왼손 (끌어당길 때 앞으로)
    const lf = a.anim === "point" ? 0.18 + 0.15 * a.k : 0.06;
    P.push([lf, 0.21, 0.32 + (a.anim === "point" ? 0.1 * a.k : 0), 0.09, 0.09, 0.12, band]);
    const hz = 0.52 + a.breath;
    P.push([0.02, 0, hz, 0.28, 0.28, 0.26, "#c9b890"]);
    eyes(P, 0.161, 0.07, hz + 0.1, 0.08, "#2fe0ff", a.stag);
    // 머리장식 (줄무늬)
    P.push([-0.02, 0, hz + 0.2, 0.34, 0.34, 0.1, gold], [-0.02, 0, hz + 0.24, 0.3, 0.3, 0.04, blue]);
    for (const sd of [1, -1]) { P.push([-0.02, sd * 0.17, hz - 0.12, 0.2, 0.05, 0.32, gold]); P.push([-0.02, sd * 0.175, hz - 0.02, 0.2, 0.05, 0.05, blue]); }
    P.push([0.16, 0, hz + 0.28, 0.04, 0.05, 0.07, gold]); // 이마 장식
    drawVoxelParts(m, P, { top: 1.0 });
  },

  // 서리 여왕: 겹겹 드레스 + 얼음 왕관 + 지팡이
  bossFrost(m) {
    const a = bossMotion(m);
    const P = [];
    const sway = Math.sin(a.t * 2) * 0.02;
    P.push([0, 0, 0, 0.5 + sway, 0.5, 0.12, "#7fc0e8"], [0, 0, 0.12, 0.4, 0.4, 0.12, "#9fd6f2"], [0, 0, 0.24, 0.3, 0.3, 0.14, "#bfe6fa"]);
    P.push([0, 0, 0.38, 0.24, 0.22, 0.14 + a.breath, "#e8f6ff"]);
    const hz = 0.52 + a.breath;
    P.push([0.01, 0, hz, 0.26, 0.26, 0.24, "#cfe6f5"]);
    P.push([-0.03, 0, hz + 0.16, 0.29, 0.29, 0.1, "#f2fbff"]); // 머리카락
    P.push([-0.08, 0, hz - 0.1, 0.12, 0.27, 0.22, "#f2fbff"]);
    eyes(P, 0.141, 0.065, hz + 0.08, 0.075, "#2a6ac0", a.stag);
    for (let i = -2; i <= 2; i++) P.push([0.02, i * 0.06, hz + 0.26, 0.05, 0.05, 0.08 + (2 - Math.abs(i)) * 0.06, "#9fe6ff", true]);
    const sz = 0.36 + 0.3 * (a.raise + (a.anim === "point" ? a.k * 0.6 : 0));
    P.push([0.12, -0.2, sz, 0.08, 0.08, 0.1, "#cfe6f5"]);
    P.push([0.15, -0.2, sz - 0.2, 0.035, 0.035, 0.55, "#e8f6ff"], [0.15, -0.2, sz + 0.36, 0.1, 0.1, 0.1, "#9fe6ff", true]);
    P.push([0.06, 0.2, 0.4 + 0.15 * a.roar, 0.08, 0.08, 0.1, "#cfe6f5"]);
    drawVoxelParts(m, P, { top: 1.05 });
    if (Math.random() < 0.15) addSparkle(m.x + (Math.random() - 0.5) * 1.5, m.y + (Math.random() - 0.5) * 1.5, Math.random() * 2, { vz: 0.2, life: 0.6, size: 0.5, hue: 195 });
  },

  // 늪 거미 여왕: 통통한 배 + 큰 눈 + 왕관 + 다리 8개
  bossSpider(m) {
    if (m.hidden) return; // 천장에 숨었어요 (그림자만 보여요)
    const a = bossMotion(m);
    const P = [];
    const body = "#5a3a6e", stripe = "#ffd84a";
    const flip = a.stag;
    const bz = flip ? 0.02 : 0.14;
    P.push([-0.28, 0, bz + 0.04 + a.breath, 0.48, 0.48, 0.34, body]);
    P.push([-0.28, 0, bz + 0.38 + a.breath, 0.3, 0.3, 0.03, stripe]);
    P.push([0.02, 0, bz + 0.08, 0.28, 0.28, 0.22, "#6e4a84"]);
    const hz = bz + 0.12 - (a.anim === "crouch" ? 0.05 * a.k : 0);
    P.push([0.22, 0, hz, 0.24, 0.26, 0.2, "#7a5296"]);
    eyes(P, 0.341, 0.065, hz + 0.08, 0.075, "#c0203a", flip);
    P.push([0.341, 0.03, hz + 0.16, 0.02, 0.03, 0.03, "#c0203a", true], [0.341, -0.03, hz + 0.16, 0.02, 0.03, 0.03, "#c0203a", true]);
    P.push([0.18, 0, hz + 0.2, 0.18, 0.18, 0.05, "#ffd23f"], [0.18, 0.06, hz + 0.25, 0.04, 0.04, 0.06, "#ffd23f"], [0.18, -0.06, hz + 0.25, 0.04, 0.04, 0.06, "#ffd23f"]);
    for (const sd of [1, -1]) {
      for (let i = 0; i < 4; i++) {
        const f = 0.18 - i * 0.14;
        const sw = m.moving ? Math.sin(m.walkTime * 12 + i * 1.6 + (sd > 0 ? 0 : Math.PI)) * 0.05 : 0;
        const kick = flip ? Math.sin(a.t * 18 + i) * 0.06 : 0;
        P.push([f + sw, sd * 0.24, bz + 0.18 + kick, 0.07, 0.16, 0.06, "#3a2448"]);
        P.push([f + sw, sd * 0.38, flip ? bz + 0.2 + kick : 0, 0.06, 0.06, flip ? 0.1 : 0.22, "#3a2448"]);
      }
    }
    drawVoxelParts(m, P, { top: 0.8 });
  },

  // ----- 소품 -----
  egg(m) {
    const shake = m.hatchT !== undefined && m.hatchT < 2.5 ? Math.sin(game.time * 30) * 0.03 : 0;
    drawBox(m.x - 0.18 + shake, m.y - 0.18, 0, 0.36, 0.36, 0.42, m.flash > 0 ? "#ffffff" : "#e8e0c8");
    drawBox(m.x - 0.13 + shake, m.y - 0.13, 0.42, 0.26, 0.26, 0.1, "#efe8d6");
    drawOnFace("y", m.x - 0.18 + shake, m.y - 0.18, 0, 0.36, 0.36, 0.2, 0.5, 0.18, 0.24, "#8a7a5a");
    if (m.hatchT !== undefined) {
      const s = toScreen(m.x, m.y, 0.75);
      text(`${Math.ceil(Math.max(0, m.hatchT))}`, s.x, s.y, 16 * ZOOM * 0.8, m.hatchT < 3 ? "#ff8080" : "#fff", "center");
    }
  },
  sarcophagus(m) {
    const c = m.flash > 0 ? "#ffffff" : "#c9a050";
    drawBox(m.x - 0.3, m.y - 0.2, 0, 0.6, 0.4, 1.1, c);
    drawBox(m.x - 0.32, m.y - 0.22, 1.1, 0.64, 0.44, 0.08, "#2f5fb0");
    drawOnFace("y", m.x - 0.3, m.y - 0.2, 0, 0.6, 0.4, 0.25, 0.75, 0.7, 0.95, "#e6dcc0");
    drawOnFace("y", m.x - 0.3, m.y - 0.2, 0, 0.6, 0.4, 0.33, 0.43, 0.82, 0.88, "#2fe0ff");
    drawOnFace("y", m.x - 0.3, m.y - 0.2, 0, 0.6, 0.4, 0.57, 0.67, 0.82, 0.88, "#2fe0ff");
  },
  rock(m) {
    drawBox(m.x - 0.5, m.y - 0.5, 0, 1.0, 1.0, 0.7, "#8a8178");
    drawBox(m.x - 0.36, m.y - 0.36, 0.7, 0.72, 0.72, 0.3, "#9a9188");
  },
  pillar(m) {
    drawBox(m.x - 0.45, m.y - 0.45, 0, 0.9, 0.9, 1.8, "#bfe6fa");
    drawBox(m.x - 0.3, m.y - 0.3, 1.8, 0.6, 0.6, 0.4, "#e8f6ff");
  },
};
Object.assign(EXTRA_SHAPES, EXTRA_SHAPES_A);
