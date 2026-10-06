// ===== 월드 6 "색모래 사막" 보스 15명 (설계서 docs/design/world6-desert.md 5장) =====
// 1~14: 신기루 보스 = 새 색깔이 모래에 스며 생긴 "예전 보스 모양의 모래 그림자" (이야기: docs/design/story.md 월드 6).
//   - 모습: 원래 보스 모습을 모래색으로 칠해요 (iso.js boxTint). 모래 정도 = 0.2 + 0.6 × 남은 체력 → 때릴수록 색모래가 반짝 돌아와요.
//   - 기술: 원래 보스 기술 중 아레나 소품 없이 되는 것(w5EchoAbOk) + 단계마다 사막 기술.
// 15: 새빛 스핑크스 무지냥 (새 모습) = 길을 잃은 "별빛도 그림자도 아닌 색" 그 자체.
// 사막 보스 규칙 (모든 사막 보스): 아레나 귀퉁이 물 항아리 4개(w6_bjar). 때리면 물이 쏟아져 6초 동안 젖은 땅(반지름 3).
//   보스가 젖은 땅에 들어오면 "모래가 촉촉!" 비틀 3초 + 3% (보스마다 쿨 4초). 항아리는 다시 차요 (같은 항아리 10초).
// 같이 하기: 상태는 보스·소품 몬스터 칸(wet)이라 친구 화면에도 가요. 계산은 방장만 (dungeonTick).

const W6B = { wetR: 3, wetSec: 6, refill: 10, stun: 3.0, frac: 0.03, ruleCd: 4 };
function w6bBoss() { const b = typeof w2BossNow === "function" ? w2BossNow() : null; return b && b.hp > 0 && b.bossDef && b.bossDef.world === 6 ? b : null; }
function w6Sand(hex, k) {
  if (typeof hex !== "string" || hex[0] !== "#" || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, kk = Math.max(0, Math.min(1, k));
  const l = 0.3 * r + 0.59 * g + 0.11 * b, sr = l * 0.7 + 90, sg = l * 0.6 + 70, sb = l * 0.4 + 30;
  const mix = (a, c) => Math.max(0, Math.min(255, Math.round(a + (c - a) * kk)));
  return "#" + [mix(r, sr), mix(g, sg), mix(b, sb)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function w6DrawSand(k, fn) {
  if (typeof boxTint === "undefined" || k <= 0.01) return fn();
  const prev = boxTint;
  boxTint = (c) => w6Sand(prev ? prev(c) : c, k);
  try { return fn(); } finally { boxTint = prev; }
}

// ----- 사막 기술 -----
Object.assign(ABILITIES, {
  w6_sandRain: { name: "모래비", desc: "모래 덩이가 여러 군데 떨어져요.", counter: "원들 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.2 }, cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 6, spread: 3.4, stagger: 0.18 } },
  w6_duneRing: { name: "모래 회오리", desc: "보스 둘레로 모래 고리가 퍼져요. 보스 바로 곁(가운데)은 안전해요.", counter: "고리 안쪽(보스 곁)으로 들어가요",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 6, inner: 2.2, at: "self", time: 1.3 }, cooldown: 10, range: [0, 6], damageMul: 1.4, anim: "roar",
    effect: { type: "knockback", force: 1.0 } },
  w6_sandWave: { name: "모래 물결", desc: "앞으로 쭉 모래 물결을 보내요. 맞으면 잠깐 느려요.", counter: "빨간 길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 10, width: 1.6, at: "self", time: 1.2 }, cooldown: 7, range: [0, 10], damageMul: 1.5, anim: "point",
    effect: { type: "slow", duration: 1.6 } },
  w6_mirageCall: { name: "신기루 꼬마 부르기", desc: "신기루 꼬마 둘을 불러요.", counter: "꼬마를 먼저 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w6_mirageKid", count: 2 } },
  w6_sunSpot: { name: "뜨거운 햇볕", desc: "발밑에 뜨거운 햇볕 자리가 남아요. 안에 있으면 조금씩 아파요.", counter: "햇볕 자리 밖에서 싸워요",
    tags: ["boss", "zone"], telegraph: { shape: "circle", radius: 1.7, at: "target", time: 1.0 }, cooldown: 9, range: [0, 10], damageMul: 0.4, anim: "roar",
    effect: { type: "zone", duration: 6, tick: 0.8, kind: "fire" } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w6_sandRain: { text: "원 사이 빈 곳으로" }, w6_duneRing: { text: "고리 안쪽, 보스 곁으로!", do: true }, w6_sandWave: { text: "길 옆으로 비켜요" },
  w6_mirageCall: { text: "신기루 꼬마부터 정리해요" }, w6_sunSpot: { text: "햇볕 자리 밖으로" },
});
if (typeof BEHAVIOR_DOCS !== "undefined") BEHAVIOR_DOCS.w6_mirageAI = { name: "신기루 보스", desc: "예전 보스 모양의 모래 그림자. 정해진 순서로 기술을 써요.", counter: "물 항아리를 깨서 젖은 땅으로 데려오면 비틀해요" };
if (typeof EXTRA_BEHAVIORS !== "undefined") EXTRA_BEHAVIORS.w6_mirageAI = (m, p, dist, dt) => { if (EXTRA_BEHAVIORS.bossAI) EXTRA_BEHAVIORS.bossAI(m, p, dist, dt); };

// ----- 아레나 소품: 물 항아리 -----
MONSTERS.w6_bjar = { name: "물 항아리", color: "#6ac8e0", shape: "w6_bjar", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true };
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w6_bjar", "w6_mirageKid");
if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add("w6_bjar");

// ----- 신기루 보스 목록 -----
//   src: 모양·기술을 빌려 오는 예전 보스 맵 · desert: [2단계, 3단계] 사막 기술 · origin: 원래 모습 (이기면 알려줘요)
const W6_MIRAGE_LIST = [
  ["sunsand", "jungle", "신기루 말랑대왕", "햇살 모래 언덕의 신기루", ["w6_sandRain", "w6_sunSpot"], "정글 슬라임 임금님 모양의 모래", "#f0d070", "sunGel", "햇살 젤리"],
  ["quicksands", "dustsea", "신기루 푸석이", "쑥쑥 모래 늪의 신기루", ["w6_sandWave", "w6_sandRain"], "먼지 두더지 왕 모양의 모래", "#c8a868", "sinkSand", "늪 모래"],
  ["cactusvale", "swamp", "신기루 실타래", "선인장 골짜기의 신기루", ["w6_mirageCall", "w6_sandWave"], "버섯 늪 거미 여왕 모양의 모래", "#7ac070", "cactusSilk", "선인장 실"],
  ["mirageoasis", "coral", "신기루 크라켄", "신기루 오아시스의 신기루", ["w6_duneRing", "w6_sandRain"], "산호 동굴 문어 대왕 모양의 모래", "#7ad8d0", "oasisInk", "오아시스 먹물"],
  ["dunecastle", "castle", "신기루 해골 왕", "모래성 마을의 신기루", ["w6_mirageCall", "w6_duneRing"], "해골 임금님 모양의 모래", "#f0dca8", "castleSand", "모래성 벽돌"],
  ["starnight", "darkside", "신기루 아우", "별빛 사막 밤의 신기루", ["w6_sandRain", "w6_mirageCall"], "달 뒷면 늑대 모양의 모래", "#a8a0d8", "nightSand", "밤 모래"],
  ["scarabhall", "cartmine", "신기루 덜컹이", "쇠똥구리 굴의 신기루", ["w6_sandWave", "w6_sunSpot"], "광차 갱도 대장 모양의 모래", "#b89060", "scarabShell", "쇠똥구리 껍데기"],
  ["windcanyon", "sky", "신기루 바람 정령 군주", "바람 협곡의 신기루", ["w6_duneRing", "w6_sandWave"], "구름 섬 바람 정령 모양의 모래", "#e0d0b0", "windSand", "바람 모래"],
  ["sunken_temple", "desert", "신기루 투탕카뭉", "모래에 묻힌 신전의 신기루", ["w6_mirageCall", "w6_sandRain"], "꼬마 파라오 모양의 모래", "#ffd060", "templeGold", "신전 금박"],
  ["glassdune", "crystalhall", "신기루 반짝돌이", "유리 모래 언덕의 신기루", ["w6_sunSpot", "w6_duneRing"], "수정 궁전 돌 거인 모양의 모래", "#b8e0f0", "glassSand", "유리 모래"],
  ["camelroad", "icefloe", "신기루 쿵쿵이", "낙타 길의 신기루", ["w6_sandWave", "w6_mirageCall"], "얼음 바다 바다코끼리 모양의 모래", "#d8b880", "camelBell", "낙타 방울"],
  ["rainbowsand", "eclipse", "신기루 해님 달님", "색모래 들판의 신기루", ["w6_sandRain", "w6_duneRing"], "일식 신전 해님 달님 모양의 모래", "#e8b8f0", "rainbowGrain", "무지개 모래알"],
  ["sphinxgate", "ruins", "신기루 묵묵이", "스핑크스 문의 신기루", ["w6_duneRing", "w6_mirageCall"], "옛 유적 돌 문지기 모양의 모래", "#e8c888", "riddleStone", "수수께끼 돌"],
  ["sunthrone", "volcano", "신기루 화염 용", "태양 왕좌의 신기루", ["w6_sunSpot", "w6_sandRain"], "용암 요새 불의 용 모양의 모래", "#ffb070", "sunScale", "태양 비늘"],
].map(([mapId, src, name, title, desert, origin, color, mat, matName], i) => ({ mapId, src, name, title, desert, origin, hp: 372 + i * 7,
  material: { id: "w6_" + mat, name: matName, color },
  legend: i % 2 === 0
    ? { id: "L_w6_" + mapId, slot: "charm", name: `${matName} 부적`, icon: ["amulet", "ring", "bracelet", "clover"][i % 4], color, perk: [{ hearts: 3 }, { regen: 10, hearts: 2 }, { luck: 0.3, speed: 0.06 }, { block: 0.12, hearts: 2 }][(i / 2) % 4], desc: "사막 신기루가 준 선물" }
    : { id: "L_w6_" + mapId, slot: "weapon", name: `${matName} 검`, effect: ["slow", "burn", "chain", "heal"][i % 4], mul: 1.07, color, forms: { w: `${matName} 검`, m: `${matName} 지팡이`, d: `${matName} 지팡이`, h: `${matName} 단검` }, desc: "사막 신기루가 준 무기" } }));
const W6_BY_MAP = {};
const W6_BOSS_THEME = { floor: "#d8b878", moss: "#e8d098", wall: "#a8844e", darkness: 0.3, bg: "#1a1206" };

function w6SrcPhase(src, i) {
  const S = BOSS_DEFS[src], ph = S && S.phases && (S.phases[i] || S.phases[S.phases.length - 1]);
  const list = ph ? (ph.pattern || ph.abilities || []) : [];
  return list.filter((id) => typeof w5EchoAbOk === "function" ? w5EchoAbOk(id) : !!ABILITIES[id]);
}
function w6Phases(E) {
  const p1 = w6SrcPhase(E.src, 0), p2 = w6SrcPhase(E.src, 1), p3 = w6SrcPhase(E.src, 2);
  const base = p1.length ? p1 : ["bossSlam", "slam"].filter((a) => ABILITIES[a]).slice(0, 1);
  const pat = [
    { until: 0.66, gap: 1.8, pattern: [...base.slice(0, 3), E.desert[0]] },
    { until: 0.33, gap: 1.6, pattern: [...(p2.length ? p2 : base).slice(0, 3), E.desert[0], E.desert[1]] },
    { until: 0, gap: 1.4, pattern: [...(p3.length ? p3 : p2.length ? p2 : base).slice(0, 3), E.desert[0], E.desert[1], "w6_sandRain"] },
  ];
  return pat.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
}
function w6RegisterLegend(mapId, L) {
  if (typeof defBase !== "function" || typeof BOSS_LEGENDS === "undefined" || !L) return;
  if (L.slot === "weapon" && typeof LEGEND_FORMS === "function") defBase(L.id, { slot: "weapon", legend: mapId, name: L.name, minL: 0, color: L.color, mul: L.mul, effect: L.effect, forms: LEGEND_FORMS(L.forms, "staff"), desc: L.desc });
  else if (L.slot !== "weapon") defBase(L.id, { slot: L.slot, legend: mapId, name: L.name, minL: 0, icon: L.icon, color: L.color, perk: L.perk, desc: L.desc });
  if (typeof ITEM_BASES === "undefined" || ITEM_BASES[L.id]) BOSS_LEGENDS[mapId] = L.id;
}
for (const E of W6_MIRAGE_LIST) {
  const type = "w6_mirage_" + E.mapId, map = typeof MAPS !== "undefined" ? MAPS.find((m) => m.id === E.mapId) : null; // check.mjs 는 desert.js 없이 이 파일을 읽어요
  W6_BY_MAP[E.mapId] = E;
  const S = BOSS_DEFS[E.src], srcMon = S && MONSTERS[S.id], size = (S && S.size) || 2.6;
  MONSTERS[type] = { name: E.name, shape: "w6m_" + E.mapId, behavior: "w6_mirageAI", color: (srcMon && srcMon.color) || "#d8b878", hp: E.hp, speed: (srcMon && srcMon.speed) || 1.2, damage: 2.7,
    xp: 85, emerald: 1, emeraldCount: 18, heavy: true, isBoss: true, size, world: 6 };
  MATERIALS[E.material.id] = { name: E.material.name, color: E.material.color };
  BOSS_DEFS[E.mapId] = {
    id: type, name: E.name, title: E.title, size, world: 6, material: E.material,
    arena: { size: 26, theme: (map && map.theme) || W6_BOSS_THEME },
    phases: w6Phases(E),
    create(x, y, level) {
      const m = createMonster(type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[E.mapId];
      m.name = `${E.title} ${E.name}`;
      m.r = (S && S.size ? Math.min(1.3, 0.45 + S.size * 0.25) : 1.1); m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = []; m.w6Mirage = E.mapId;
      m.onPhase = (idx) => { if (idx === 1) showMessage("물 항아리를 깨서 신기루를 젖은 땅으로 데려와요!", 3, false, "#7ad8ff"); if (idx === 2) showMessage("신기루에 색이 돌아오고 있어요! 조금만 더!", 3, false, "#ffe27a"); };
      return m;
    },
  };
  if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES["w6m_" + E.mapId] = (m) => w6DrawMirage(m, E);
  w6RegisterLegend(E.mapId, E.legend);
}
function w6RefreshPhases() { for (const E of W6_MIRAGE_LIST) if (BOSS_DEFS[E.mapId]) BOSS_DEFS[E.mapId].phases = w6Phases(E); }
hookOn("dungeonStarted", () => w6RefreshPhases(), 10);
function w6SandK(m) { if (m.trophy || (m.w6WetT || 0) > 0) return 0; const f = m.maxHp ? Math.max(0, Math.min(1, m.hp / m.maxHp)) : 1; return 0.2 + 0.6 * f; }
function w6DrawMirage(m, E) {
  const S = BOSS_DEFS[E.src], srcDef = S && MONSTERS[S.id];
  if (!srcDef) { drawBox(m.x - 0.5, m.y - 0.5, 0, 1, 1, 1.4, "#d8b878"); return; }
  const proxy = Object.create(m); proxy.def = srcDef; proxy.type = S.id; proxy.hidden = false;
  w6DrawSand(w6SandK(m), () => drawMonsterBase(proxy));
}
hookOn("monsterKilled", (m) => {
  if (!m || !m.w6Mirage) return;
  const E = W6_BY_MAP[m.w6Mirage]; if (!E) return;
  showMessage(`${E.name}의 모래가 반짝 색모래로 돌아왔어요! (${E.origin})`, 4, true);
});

// ===== 15: 새빛 스핑크스 무지냥 =====
//   P1 모래 기술 · P2 "수수께끼 빛": 무지개 빛기둥 (line) + 신기루 꼬마 · P3 무지개 회오리 + 모래비 + 햇볕
//   쓰러지면 무지개가 터지고 무지냥은 작은 무지개 고양이가 되어 "집에 가는 길을 잃었어" 하고 말해요 (새 떡밥)
ABILITIES.w6_prismBeam = { name: "무지개 빛기둥", desc: "무지냥 눈에서 무지개 빛이 한 줄로 쭉 나가요.", counter: "빛 길 옆으로 한 걸음!",
  tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.4, at: "self", time: 1.3, follow: true }, cooldown: 8, range: [0, 12], damageMul: 1.6, anim: "point",
  effect: { type: "damage" } };
ABILITIES.w6_prismRing = { name: "무지개 회오리", desc: "무지냥 둘레로 무지개 고리가 퍼져요. 무지냥 바로 곁은 안전해요.", counter: "고리 안쪽, 무지냥 곁으로!",
  tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 7, inner: 2.4, at: "self", time: 1.4 }, cooldown: 11, range: [0, 7], damageMul: 1.5, anim: "roar",
  effect: { type: "knockback", force: 1.1 } };
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, { w6_prismBeam: { text: "빛 길 옆으로!" }, w6_prismRing: { text: "고리 안쪽, 무지냥 곁으로!", do: true } });
const W6_SPHINX_PHASES = [
  { until: 0.66, abilities: ["w6_sandWave", "w6_sandRain", "w6_duneRing"] },
  { until: 0.33, abilities: ["w6_prismBeam", "w6_mirageCall", "w6_sandRain", "w6_sunSpot"] },
  { abilities: ["w6_prismRing", "w6_prismBeam", "w6_sandRain", "w6_sunSpot", "w6_mirageCall"] },
];
MONSTERS.w6_sphinx = { color: "#e8c0e0", name: "새빛 스핑크스 무지냥", shape: "w6_sphinx", behavior: "b2_boss", hp: 480, speed: 1.3, damage: 2.8, xp: 160, emerald: 1, emeraldCount: 30,
  attackRange: 2.4, attackCooldown: 1.8, world: 6, isBoss: true, heavy: true, size: 3.4, phases: W6_SPHINX_PHASES };
MATERIALS.w6_newColor = { name: "새빛 모래", color: "#f0c8f0", enchant: "chain" };
BOSS_DEFS.prismpyramid = {
  id: "w6_sphinx", name: "새빛 스핑크스 무지냥", title: "무지개 피라미드", size: 3.4, world: 6, material: { id: "w6_newColor", name: "새빛 모래", color: "#f0c8f0" },
  arena: { size: 28, theme: { floor: "#d8b8c8", moss: "#b8e8d8", wall: "#9a7890", darkness: 0.34, bg: "#140a14" }, build: (w) => { if (typeof b2Pillars === "function") b2Pillars(w, [[-6, -6], [6, 6], [-6, 6], [6, -6]]); } },
  phases: W6_SPHINX_PHASES,
  create(x, y, level) {
    const m = b2MakeBoss("w6_sphinx", x, y, level, 3.4);
    m.bossDef = BOSS_DEFS.prismpyramid; m.name = "무지개 피라미드, 새빛 스핑크스 무지냥"; m.w6Sphinx = true;
    const base = m.onPhase;
    m.onPhase = (idx) => { if (base) base(idx); if (idx === 1) showMessage("무지냥 눈이 무지개로 빛나요! 빛 길 옆으로!", 3, false, "#ffb0f0"); if (idx === 2) showMessage("무지개 회오리! 무지냥 곁으로 쏙!", 3, false, "#b8f0e0"); };
    return m;
  },
};
w6RegisterLegend("prismpyramid", { id: "L_w6_prism", slot: "charm", name: "새빛 고양이 방울", icon: "amulet", color: "#f0c8f0", perk: { hearts: 4, dmg: 0.1, speed: 0.06 }, desc: "길 잃은 새 색깔이 준 방울: 하트 +4, 공격력 +10%, 빠르기" });
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.w6_sphinx = (m) => {
  const P = b2Pose(m), t = game.time, hue = (k) => ["#ff8ab0", "#ffd060", "#7adf8a", "#7ac8ff", "#c08aff"][Math.floor(t * 2 + k) % 5];
  const body = m.trophy ? "#e8c0e0" : "#e8c8a0", face = "#f4dcb8";
  const parts = [
    { f: -0.1, s: 0, z: 0.0 + P.breath, w: 1.5, d: 0.9, h: 0.55, c: body },               // 엎드린 몸
    { f: 0.75, s: 0.28, z: 0.0, w: 0.5, d: 0.22, h: 0.18, c: body }, { f: 0.75, s: -0.28, z: 0.0, w: 0.5, d: 0.22, h: 0.18, c: body }, // 앞발
    { f: -0.95, s: 0, z: 0.15 + Math.sin(t * 3) * 0.08, w: 0.5, d: 0.12, h: 0.12, c: hue(0) }, // 무지개 꼬리
    { f: 0.45, s: 0, z: 0.55 + P.breath, w: 0.65, d: 0.75, h: 0.6, c: face, face: true, eye: "#ffffff", pupil: "#4a1a6a" }, // 머리
    { f: 0.4, s: 0.26, z: 1.15 + P.breath, w: 0.18, d: 0.16, h: 0.2, c: body }, { f: 0.4, s: -0.26, z: 1.15 + P.breath, w: 0.18, d: 0.16, h: 0.2, c: body }, // 귀
    { f: 0.3, s: 0, z: 1.15 + P.breath, w: 0.5, d: 0.85, h: 0.08, c: hue(1) }, // 무지개 머리띠
    { f: 0.2, s: 0.5, z: 0.55, w: 0.5, d: 0.08, h: 0.5, c: hue(2) }, { f: 0.2, s: -0.5, z: 0.55, w: 0.5, d: 0.08, h: 0.5, c: hue(3) }, // 두건 줄무늬
  ];
  b2DrawBody(m, parts, { top: 1.6 });
};
hookOn("monsterKilled", (m) => {
  if (!m || !m.w6Sphinx) return;
  for (let i = 0; i < 30; i++) addSparkle(m.x, m.y, 1.4, { vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vz: 3, gravity: 3, life: 1.2, size: 0.7, hue: Math.random() * 360 });
  const next = WORLD_ORDER.indexOf(6) >= 0 ? WORLD_ORDER[WORLD_ORDER.indexOf(6) + 1] : null;
  showMessage(next && WORLDS[next] ? `무지냥: "고마워! 나는 ${WORLDS[next].name}에서 왔어. 집에 가는 길을 찾았어!"` : "무지냥: \"고마워! 그런데… 나는 어디서 왔더라? 집에 가는 길을 잃었어.\"", 5, true);
  hookRun("w6SphinxCalm", m);
});

// ===== 사막 보스 규칙: 물 항아리 =====
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m || m.type !== "w6_bjar") return false;
  if (h.opts.dot || game.time - (m.w6HitT || -9) < 0.3) return true;
  m.w6HitT = game.time;
  if ((m.w6Empty || 0) > 0) { addFloatText(m.x, m.y, "아직 물이 차는 중", "#9ab8c8", 14); return true; }
  m.wet = W6B.wetSec; m.w6Empty = W6B.refill;
  addFloatText(m.x, m.y, "촤악! 물이 쏟아졌어요", "#7ad8ff", 18); addRing(m.x, m.y, { speed: 5, life: 0.6, hue: 190 });
  if (typeof sfx !== "undefined" && sfx.splash) sfx.splash();
  return true;
}, 4);
hookOn("dungeonTick", (dt) => {
  for (const o of monsters) if (o.type === "w6_bjar") { if (o.wet > 0) o.wet = Math.max(0, o.wet - dt); if (o.w6Empty > 0) o.w6Empty = Math.max(0, o.w6Empty - dt); }
  const b = w6bBoss(); if (!b) return;
  if (!b.w6Init) {
    b.w6Init = true;
    const c = world.W / 2, d = Math.max(4, world.W / 2 - 4);
    for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const s = spawnProp("w6_bjar", c + ox * d * 0.78, c + oy * d * 0.78, b); s.r = 0.42; s.appearTimer = 0; s.wet = 0; s.w6Empty = 0; }
  }
  if (b.w6WetT > 0) b.w6WetT = Math.max(0, b.w6WetT - dt);
  b.w6RuleCd = Math.max(0, (b.w6RuleCd || 0) - dt);
  if (b.w6RuleCd > 0 || b.invuln > 0) return;
  const j = monsters.find((o) => o.type === "w6_bjar" && o.wet > 0 && Math.hypot(o.x - b.x, o.y - b.y) < W6B.wetR + (b.r || 1) * 0.5);
  if (!j) return;
  j.wet = 0; b.w6RuleCd = W6B.ruleCd; b.w6WetT = 3;
  if (typeof w5bStun === "function") w5bStun(b, W6B.stun, W6B.frac, "모래가 촉촉! 비틀비틀", "#7ad8ff");
  else { b.stagger = Math.max(b.stagger || 0, W6B.stun); damageMonster(b, b.maxHp * W6B.frac, b.x, b.y, false, 0, { w6Prop: true }); }
  hookRun("w6WetStun", b);
}, 41);
hookOn("lights", (lights) => { for (const o of monsters) if (o.type === "w6_bjar") lights.push({ x: o.x, y: o.y, radius: o.wet > 0 ? W6B.wetR : 1.0, power: o.wet > 0 ? 0.7 : 0.3 }); }, 50);
hookOn("drawMonsterUnder", (m) => {
  if (m.type !== "w6_bjar" || !(m.wet > 0)) return;
  const c = toScreen(m.x, m.y, 0.01);
  ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, W6B.wetR * TILE_W / 2 * 1.41, W6B.wetR * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(90,180,220,0.22)"; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(160,230,255,0.85)"; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.restore();
}, 50);
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.w6_bjar = (m) => {
  const empty = (m.w6Empty || 0) > 0;
  drawBox(m.x - 0.26, m.y - 0.26, 0, 0.52, 0.52, 0.55, "#c87a4a");
  drawBox(m.x - 0.2, m.y - 0.2, 0.55, 0.4, 0.4, 0.16, "#b86a3a");
  drawBox(m.x - 0.16, m.y - 0.16, 0.66, 0.32, 0.32, 0.03, empty ? "#6a4a2a" : "#6ac8e0");
};
if (typeof GUIDE_PHASE_VOICE !== "undefined") for (const id of [...W6_MIRAGE_LIST.map((E) => E.mapId), "prismpyramid"]) GUIDE_PHASE_VOICE[id] = { 0: "물 항아리를 깨고 보스를 젖은 땅으로 데려와요", 1: "물 항아리가 다시 차면 또 깨요", 2: "조금만 더! 색모래가 돌아와요" };
