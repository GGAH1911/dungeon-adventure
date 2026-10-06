// ===== 월드 6 새 보스 1~4 (신기루 보스를 새 모습·새 기술로 바꿔요. 설계서 docs/design/world6-desert.md 5-1) =====
//   1 sunsand     선글라스 도마뱀 쨍쨍이: 선글라스 번쩍! (보스 그림자 = 초록 "그늘" 자리만 안전) · 반사 햇빛 줄 · 3단계 빙글 햇빛
//   2 quicksands  개미귀신 쏙쏙이: 모래 속에 숨어 모래 구멍으로 끌어당겨요 (평평한 돌 위는 안 끌려요) · 쏙! 튀어나와 깨물기 · 2단계 구멍 둘 · 3단계 모래 물결
//   3 cactusvale  선인장 왕 뾰족이: 부채꼴 가시 · 선인장 벽(세 번 치면 부서져요) · 3단계 빙글 가시
//   4 mirageoasis 신기루 낙타 아롱이: 가짜 낙타 2~4마리 (진짜는 발자국이 남아요, 가짜는 한 대에 펑) · 물 뱉기 · 3단계 가짜도 물보라
// 모두 사막 보스 규칙(물 항아리 → 젖은 땅에서 비틀)을 그대로 써요: bossDef.world = 6 (bosses_w6.js).
// 같이 하기: 상태는 보스·소품 몬스터 칸(w6aShadow, w6aPits, w6aPull, w6aHide …)이라 친구 화면에도 가요. 계산(끌기·깨물기)은 방장만.
// 이 파일은 bosses_w6.js 다음에 불러요 (BOSS_DEFS[맵]을 새 보스로 덮어써요, w6New = true 라 신기루 단계 갱신이 건드리지 않아요).

const W6A = {
  telK: () => ({ easy: 1.3, normal: 1, hard: 0.88, nightmare: 0.8 }[(game.profile && game.profile.difficulty) || "normal"] || 1),
  pullV: { easy: 2.0, normal: 2.6, hard: 3.0, nightmare: 3.3 }, // 걷기(4.2)보다 느려요: 돌로 걸어가면 늘 빠져나와요
  pullT: 3.0, biteK: { easy: 0.15, normal: 0.22, hard: 0.28, nightmare: 0.32 }, rockR: 0.95, pitR: 0.8,
  wallHits: 3,
};
function w6aHost() { return !(typeof netGuest === "function" && netGuest()); }
function w6aDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function w6aPts(s) { return String(s || "").split(";").filter(Boolean).map((t) => { const [x, y] = t.split(",").map(Number); return { x, y }; }).filter((q) => Number.isFinite(q.x) && Number.isFinite(q.y)); }
function w6aStr(pts) { return pts.map((q) => q.x.toFixed(2) + "," + q.y.toFixed(2)).join(";"); }

// ----- 기술 -----
Object.assign(ABILITIES, {
  w6_a_glare: { name: "선글라스 번쩍", desc: "쨍쨍이가 선글라스로 햇빛을 번쩍! 둘레가 다 뜨거워요. 쨍쨍이 그림자(초록 그늘 자리)만 시원해요.", counter: "초록 '그늘' 자리로 쏙!",
    tags: ["boss", "safe"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.8 }, cooldown: 12, range: [0, 40], damageMul: 1.6, anim: "roar", effect: { type: "w6_a_glare" } },
  w6_a_beam: { name: "반사 햇빛", desc: "선글라스에 비친 햇빛이 한 줄로 쭉!", counter: "빛 길 옆으로 한 걸음",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 11, width: 1.2, at: "self", time: 1.1, follow: true }, cooldown: 6, range: [0, 11], damageMul: 1.4, anim: "point", effect: { type: "damage" } },
  w6_a_beamSpin: { name: "빙글 햇빛", desc: "햇빛 구슬이 사방으로 빙글빙글 퍼져요.", counter: "구슬 사이 빈틈으로",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.0 }, cooldown: 8, range: [0, 40], damageMul: 0.9, anim: "raise", effect: { type: "nova", count: 10, speed: 4.2, color: "#ffd84a" } },
  w6_a_sink: { name: "모래 구멍", desc: "쏙쏙이가 모래 속으로 숨고 모래 구멍이 열려요. 구멍 쪽으로 쭉쭉 끌려가요! 평평한 돌 위에 서면 안 끌려요.", counter: "평평한 돌 위로 올라가요 (아니면 구멍 반대로 걸어요)",
    tags: ["boss", "pull"], telegraph: { shape: "self", radius: 1.8, at: "self", time: 1.8 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "crouch", effect: { type: "w6_a_sink" } },
  w6_a_pop: { name: "쏙! 깨물기", desc: "모래 밑에서 쏙 튀어나와 앙 깨물어요.", counter: "원 밖으로",
    tags: ["boss"], telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.0 }, cooldown: 6, range: [0, 40], damageMul: 1.5, anim: "slam", effect: { type: "w6_a_pop" } },
  w6_a_needleFan: { name: "부채꼴 가시", desc: "선인장 가시를 부채처럼 쏴요.", counter: "옆으로 돌거나 선인장 벽 뒤로",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 7, angle: 1.0, at: "self", time: 1.0 }, cooldown: 6, range: [0, 12], damageMul: 1.0, anim: "point", effect: { type: "volley", count: 7, spread: 1.1, speed: 6.5, color: "#7adf6a" } },
  w6_a_cactusWall: { name: "선인장 벽", desc: "땅에서 선인장 벽이 쑥쑥 자라 길을 막아요. 세 번 치면 부서져요.", counter: "벽을 세 번 쳐서 부숴요 (가시를 막는 데 써도 돼요)",
    tags: ["boss", "summon"], telegraph: { shape: "circle", radius: 1.8, at: "target", time: 1.2 }, cooldown: 12, range: [0, 40], damageMul: 0.8, anim: "raise", effect: { type: "w6_a_wall" } },
  w6_a_needleSpin: { name: "빙글 가시", desc: "뾰족이가 빙글 돌며 사방으로 가시를 쏴요.", counter: "가시 사이 빈틈이나 선인장 벽 뒤로",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.8, at: "self", time: 1.1 }, cooldown: 9, range: [0, 40], damageMul: 0.9, anim: "roar", effect: { type: "nova", count: 14, speed: 4.6, color: "#9aef7a" } },
  w6_a_copies: { name: "신기루 낙타", desc: "아롱이가 가짜 낙타를 만들어요. 진짜는 발자국이 남아요! 가짜는 한 대 치면 펑.", counter: "발자국이 남는 낙타가 진짜예요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.2 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise", effect: { type: "w6_a_copies" } },
  w6_a_spit: { name: "물 뱉기", desc: "오아시스 물을 한 줄로 퉤!", counter: "물줄기 옆으로",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 9, width: 1.3, at: "self", time: 1.1, follow: true }, cooldown: 6, range: [0, 9], damageMul: 1.3, anim: "point", effect: { type: "slow", duration: 1.2 } },
  w6_a_splash: { name: "물보라", desc: "진짜와 가짜 낙타가 다 같이 물보라를 뿌려요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.3, at: "target", time: 1.2 }, cooldown: 9, range: [0, 40], damageMul: 1.1, anim: "roar", effect: { type: "rain", count: 3, spread: 2.6, stagger: 0.2 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w6_a_glare: { text: "초록 그늘 자리로!", do: true, voice: true }, w6_a_beam: { text: "빛 길 옆으로" }, w6_a_beamSpin: { text: "구슬 사이로" },
  w6_a_sink: { text: "평평한 돌 위로!", do: true, voice: true }, w6_a_pop: { text: "원 밖으로" },
  w6_a_needleFan: { text: "옆으로 돌아요" }, w6_a_cactusWall: { text: "선인장 벽은 세 번 치면 부서져요" }, w6_a_needleSpin: { text: "벽 뒤나 빈틈으로" },
  w6_a_copies: { text: "발자국 남는 게 진짜!", do: true }, w6_a_spit: { text: "물줄기 옆으로" }, w6_a_splash: { text: "원 사이로" },
});

// ----- 소품: 평평한 돌(밟아도 돼요) · 선인장 벽 · 가짜 낙타 -----
Object.assign(MONSTERS, {
  w6_a_rock: { name: "평평한 돌", color: "#a89a86", shape: "w6_a_rock", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true, w6aNoHit: true },
  w6_a_cWall: { name: "선인장 벽", color: "#5aa848", shape: "w6_a_cWall", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true },
  w6_a_camelCopy: { name: "가짜 낙타", color: "#e0c080", shape: "w6_a_camelCopy", behavior: "w6_a_copyAI", hp: 9999, speed: 1.6, damage: 0, xp: 0, emerald: 0, world: 6, codexSkip: true },
});
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w6_a_rock", "w6_a_cWall", "w6_a_camelCopy");
if (typeof CODEX_SKIP !== "undefined") for (const k of ["w6_a_rock", "w6_a_cWall", "w6_a_camelCopy"]) CODEX_SKIP.add(k);
if (typeof BEHAVIOR_DOCS !== "undefined") BEHAVIOR_DOCS.w6_a_copyAI = { name: "가짜 낙타", desc: "진짜 낙타 흉내를 내며 둘레를 맴돌아요. 발자국이 안 남아요.", counter: "한 대 치면 펑!" };
if (typeof EXTRA_BEHAVIORS !== "undefined") EXTRA_BEHAVIORS.w6_a_copyAI = (m, p, dist, dt) => {
  m.w6aAng = (m.w6aAng || Math.random() * 6) + dt * 0.6;
  const tx = p.x + Math.cos(m.w6aAng) * 3.2, ty = p.y + Math.sin(m.w6aAng) * 3.2;
  const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
  if (d > 0.3) { moveEntity(m, dx / d * m.def.speed * dt, dy / d * m.def.speed * dt); m.moving = true; m.walkTime = (m.walkTime || 0) + dt; } else m.moving = false;
  faceToward(m, p);
};
hookOn("untargetable", (o) => !!(o && o.def && o.def.w6aNoHit), 50);
// 소품이 맞을 때: 돌은 안 다쳐요 · 벽은 세 번 · 가짜 낙타는 한 번에 펑
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m || !m.def) return false;
  if (m.def.w6aNoHit) return true;
  if (m.type === "w6_a_cWall") {
    if (h.opts.dot || game.time - (m.w6aHitT || -9) < 0.25) return true;
    m.w6aHitT = game.time; m.flash = 0.08; m.w6aHits = (m.w6aHits || 0) + 1;
    if (m.w6aHits >= W6A.wallHits) { m.hp = 0; w6aDropWall(m); spawnBurst(m.x, m.y, ["#5aa848", "#9aef7a", "#e8d098"], 12); addFloatText(m.x, m.y, "와작! 부서졌어요", "#9aef7a", 16); }
    else addFloatText(m.x, m.y, `${W6A.wallHits - m.w6aHits}번 더!`, "#9aef7a", 14);
    return true;
  }
  if (m.type === "w6_a_camelCopy") {
    if (h.opts.dot) return true;
    m.hp = 0; spawnBurst(m.x, m.y, ["#7ad8ff", "#e0c080", "#ffffff"], 14);
    addFloatText(m.x, m.y, "펑! 가짜였어요", "#7ad8ff", 18);
    if (typeof sfx !== "undefined" && sfx.splash) sfx.splash();
    return true;
  }
  return false;
}, 5);
function w6aDropWall(m) { world.solids = world.solids.filter((o) => o.prop !== m); m.netSolid = 0; }
// 보스가 쓰러지면 소품·가짜도 정리
hookOn("monsterKilled", (m) => {
  if (!m || !m.w6aBoss) return;
  for (const o of monsters) if (o.w6aOwned && o.hp > 0) { if (o.type === "w6_a_cWall") w6aDropWall(o); o.hp = 0; }
  const E = W6A_LIST.find((q) => q.mapId === m.w6aBoss);
  if (E) showMessage(`${E.name}: "${E.calm}"`, 4, true);
}, 40);

// ----- 보스 목록 -----
const W6A_LIST = [
  { mapId: "sunsand", type: "w6_a_lizard", name: "선글라스 도마뱀 쨍쨍이", title: "햇살 모래 언덕", hp: 372, size: 2.4, speed: 1.4, color: "#f0b848",
    calm: "선글라스 벗으니 눈부셔… 그래도 이제 사막이 예쁜 색으로 보여!",
    material: { id: "w6_a_sunScale", name: "햇살 비늘", color: "#ffd060" },
    legend: { id: "L_w6_a_sunsand", slot: "charm", name: "쨍쨍 선글라스", icon: "amulet", color: "#ffd060", perk: { hearts: 3, crit: 0.06 }, desc: "쨍쨍이의 선글라스: 하트 +3, 치명타 +6%" },
    phases: [["w6_a_beam", "w6_a_glare", "w6_sunSpot", "w6_a_beam"], ["w6_a_glare", "w6_a_beam", "w6_sandRain", "w6_a_beam"], ["w6_a_glare", "w6_a_beamSpin", "w6_a_beam", "w6_sunSpot", "w6_a_beamSpin"]],
    voice: () => { tone(880, 0.12, "triangle", 0.06, 1320); tone(660, 0.3, "sine", 0.05, null, 0.12); }, fall: () => { tone(990, 0.5, "triangle", 0.06, 220); } },
  { mapId: "quicksands", type: "w6_a_antlion", name: "개미귀신 쏙쏙이", title: "쑥쑥 모래 늪", hp: 379, size: 2.6, speed: 1.2, color: "#a07848",
    calm: "끌어당겨서 미안해! 친구가 갖고 싶었어…",
    material: { id: "w6_a_pitSand", name: "개미귀신 모래", color: "#c8a068" },
    legend: { id: "L_w6_a_quicksands", slot: "weapon", name: "쏙쏙 집게 검", effect: "slow", mul: 1.08, color: "#c8a068", forms: { w: "쏙쏙 집게 검", m: "쏙쏙 모래 지팡이", d: "쏙쏙 모래 지팡이", h: "쏙쏙 집게 단검" }, desc: "개미귀신 집게: 맞은 적이 모래에 빠진 듯 느려져요" },
    phases: [["w6_a_sink", "w6_a_pop", "w6_sandRain", "w6_a_pop"], ["w6_a_sink", "w6_a_pop", "w6_sandWave", "w6_a_pop"], ["w6_a_sink", "w6_sandWave", "w6_a_pop", "w6_sandWave", "w6_a_pop"]],
    voice: () => { noise(0.6, 0.18, 500, "lowpass"); tone(140, 0.4, "square", 0.05, 90, 0.2); }, fall: () => { noise(0.8, 0.2, 400, "lowpass"); tone(220, 0.6, "triangle", 0.05, 80); } },
  { mapId: "cactusvale", type: "w6_a_cactusKing", name: "선인장 왕 뾰족이", title: "선인장 골짜기", hp: 386, size: 2.8, speed: 1.0, color: "#5aa848",
    calm: "가시를 세웠던 건 무서워서였어. 이제 꽃을 피울게!",
    material: { id: "w6_a_cactusFlower", name: "선인장 꽃", color: "#ff8ab0" },
    legend: { id: "L_w6_a_cactusvale", slot: "charm", name: "선인장 꽃 반지", icon: "ring", color: "#ff8ab0", perk: { regen: 10, hearts: 2, block: 0.06 }, desc: "선인장 꽃 반지: 하트 회복 +10%, 하트 +2, 막기 +6%" },
    phases: [["w6_a_needleFan", "w6_a_cactusWall", "w6_a_needleFan", "w6_sandRain"], ["w6_a_needleFan", "w6_a_cactusWall", "w6_a_needleFan", "w6_sandWave"], ["w6_a_needleSpin", "w6_a_needleFan", "w6_a_cactusWall", "w6_a_needleSpin"]],
    voice: () => { [500, 700, 900].forEach((f, i) => tone(f, 0.07, "square", 0.05, null, i * 0.06)); }, fall: () => { tone(400, 0.6, "triangle", 0.06, 1200); } },
  { mapId: "mirageoasis", type: "w6_a_camel", name: "신기루 낙타 아롱이", title: "신기루 오아시스", hp: 393, size: 2.8, speed: 1.3, color: "#e0c080",
    calm: "숨바꼭질 재밌었다! 진짜 나를 찾아 줘서 고마워.",
    material: { id: "w6_a_oasisDrop", name: "오아시스 물방울", color: "#7ad8ff" },
    legend: { id: "L_w6_a_mirageoasis", slot: "weapon", name: "아롱 물방울 검", effect: "heal", mul: 1.08, color: "#7ad8ff", forms: { w: "아롱 물방울 검", m: "아롱 물방울 지팡이", d: "아롱 물방울 지팡이", h: "아롱 물방울 단검" }, desc: "오아시스 물이 담긴 칼: 때리면 하트가 조금 차요" },
    phases: [["w6_a_copies", "w6_a_spit", "w6_sandRain", "w6_a_spit"], ["w6_a_copies", "w6_a_spit", "w6_duneRing", "w6_a_spit"], ["w6_a_copies", "w6_a_splash", "w6_a_spit", "w6_duneRing", "w6_a_splash"]],
    voice: () => { tone(300, 0.3, "sine", 0.06, 450); tone(450, 0.3, "sine", 0.05, 300, 0.3); }, fall: () => { tone(500, 0.7, "sine", 0.06, 150); } },
];
const W6A_BOSS_THEME = { floor: "#d8b878", moss: "#e8d098", wall: "#a8844e", darkness: 0.3, bg: "#1a1206" };
for (const E of W6A_LIST) {
  MONSTERS[E.type] = { name: E.name, shape: E.type, behavior: "w6_a_bossAI", color: E.color, hp: E.hp, speed: E.speed, damage: 2.7,
    xp: 85, emerald: 1, emeraldCount: 18, heavy: true, isBoss: true, size: E.size, world: 6 };
  MATERIALS[E.material.id] = { name: E.material.name, color: E.material.color };
  const map = typeof MAPS !== "undefined" ? MAPS.find((m) => m.id === E.mapId) : null;
  const phases = E.phases.map((pat, i) => ({ until: [0.66, 0.33, 0][i], gap: [1.9, 1.7, 1.5][i], pattern: pat, abilities: [...new Set(pat)] }));
  BOSS_DEFS[E.mapId] = {
    id: E.type, name: E.name, title: E.title, size: E.size, world: 6, material: E.material, w6New: true,
    arena: { size: 26, theme: (map && map.theme) || W6A_BOSS_THEME },
    phases,
    create(x, y, level) {
      const m = createMonster(E.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[E.mapId];
      m.name = `${E.title}, ${E.name}`;
      m.r = Math.min(1.3, 0.45 + E.size * 0.25); m.b2Scale = E.size / 2.6; m.seed = Math.random() * 10;
      m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = []; m.w6aBoss = E.mapId;
      m.onPhase = (idx) => w6aOnPhase(m, E, idx);
      return m;
    },
  };
  if (typeof w6RegisterLegend === "function") w6RegisterLegend(E.mapId, E.legend);
  if (typeof BOSS_VOICE !== "undefined") BOSS_VOICE[E.mapId] = { intro: E.voice, fall: E.fall };
  if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE[E.mapId] = {
    sunsand: { 0: "번쩍 예고가 나오면 초록 그늘로!", 1: "물 항아리를 깨고 쨍쨍이를 젖은 땅으로", 2: "빙글 햇빛은 구슬 사이로!" },
    quicksands: { 0: "모래 구멍이 열리면 평평한 돌 위로!", 1: "구멍이 두 개! 돌 위로", 2: "모래 물결도 와요, 옆으로!" },
    cactusvale: { 0: "가시는 옆으로, 선인장 벽은 세 번 치면 부서져요", 1: "선인장 벽 뒤에 숨어도 돼요", 2: "빙글 가시! 벽 뒤나 빈틈으로" },
    mirageoasis: { 0: "발자국이 남는 낙타가 진짜예요!", 1: "가짜는 한 대 치면 펑!", 2: "가짜도 물을 뿌려요, 원 사이로" },
  }[E.mapId];
}
function w6aOnPhase(m, E, idx) {
  const msg = {
    sunsand: ["", "쨍쨍이가 더 자주 번쩍여요! 초록 그늘을 잘 봐요", "빙글 햇빛! 구슬 사이로 피해요"],
    quicksands: ["", "모래 구멍이 두 개! 평평한 돌 위로", "모래 물결까지! 조금만 더!"],
    cactusvale: ["", "선인장 벽이 더 자라요! 세 번 치면 부서져요", "빙글 가시! 벽 뒤에 숨어요"],
    mirageoasis: ["", "가짜 낙타가 셋! 발자국을 봐요", "가짜 낙타도 물보라를 뿌려요!"],
  }[E.mapId];
  if (msg && msg[idx]) showMessage(msg[idx], 3, false, "#ffe27a");
}
// 행동: 보스 기본 순서(bossAI) + 숨은 동안은 가만히
if (typeof EXTRA_BEHAVIORS !== "undefined") EXTRA_BEHAVIORS.w6_a_bossAI = (m, p, dist, dt) => {
  if (m.w6aHide > 0) { m.moving = false; return; }
  if (EXTRA_BEHAVIORS.bossAI) EXTRA_BEHAVIORS.bossAI(m, p, dist, dt);
};
if (typeof BEHAVIOR_DOCS !== "undefined") BEHAVIOR_DOCS.w6_a_bossAI = { name: "사막 보스", desc: "단계마다 정해진 순서로 사막 기술을 써요.", counter: "물 항아리를 깨서 젖은 땅으로 데려오면 비틀해요" };
hookOn("monsterAlpha", (a, m) => (m && m.w6aHide > 0 ? Math.min(a, 0.18) : a), 50);
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m || !(m.w6aHide > 0)) return false;
  if (!h.opts.dot && !(m._w6aTip > game.time)) { m._w6aTip = game.time + 1.5; addFloatText(m.x, m.y, "모래 속이에요!", "#e8d098", 15); }
  return true;
}, 6);
function w6aBossOf(id) { return monsters.find((o) => o.w6aBoss === id && o.hp > 0) || null; }

// ===== 1 쨍쨍이: 그늘 자리 =====
// 번쩍 예고가 시작되면 해가 있는 쪽(네 대각선 중 하나)을 정하고, 그 반대쪽(보스 그림자)에 초록 "그늘" 자리가 생겨요.
function w6aShadeSpot(m) { const d = 2.0 + (m.r || 1); return { x: m.x - (m.w6aSunX || 0.7) * d, y: m.y - (m.w6aSunY || 0.7) * d, r: 1.7 }; }
hookOn("castStarted", (m, id) => {
  if (!m || !m.w6aBoss || !w6aHost()) return;
  if (id === "w6_a_glare") {
    const k = [[1, 1], [-1, 1], [1, -1], [-1, -1]][Math.floor(Math.random() * 4)];
    m.w6aSunX = k[0] * Math.SQRT1_2; m.w6aSunY = k[1] * Math.SQRT1_2;
    const s = w6aShadeSpot(m);
    if (hitsWall(s.x, s.y, 0.3)) { m.w6aSunX = -m.w6aSunX; m.w6aSunY = -m.w6aSunY; }
    m.w6aShade = 1;
  }
  if (id === "w6_a_sink") w6aOpenPits(m);
  if (id === "w6_a_splash") for (const o of monsters) if (o.type === "w6_a_camelCopy" && o.hp > 0 && o.w6aOwned) { const p = game.player; castAbility(o, "w6_a_splash", p || { x: o.x, y: o.y }); }
}, 50);
hookOn("resolveCast", (c) => {
  const t = c && c.ab && c.ab.effect && c.ab.effect.type;
  if (!t || !String(t).startsWith("w6_a_")) return false;
  if (c._w6aDone) return true;
  c._w6aDone = true;
  const m = c.m; if (!m || m.hp <= 0) return true;
  if (!w6aHost()) { if (t === "w6_a_glare") m.w6aShade = 0; return true; }
  if (t === "w6_a_glare") {
    const s = w6aShadeSpot(m), dmg = abilityDamage(c);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; addSparkle(m.x + Math.cos(a) * 3, m.y + Math.sin(a) * 3, 0.6, { vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, life: 0.5, size: 0.6, gold: true }); }
    addRing(m.x, m.y, { speed: 14, life: 0.5, gold: true });
    for (const p of alivePlayers()) {
      if (Math.hypot(p.x - s.x, p.y - s.y) < s.r) { addFloatText(p.x, p.y, "시원해!", "#7dffb0", 16); continue; }
      if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); continue; }
      hurtPlayer(p, dmg, m); addFloatText(p.x, p.y, "앗 뜨거!", "#ffb050", 18);
    }
    m.w6aShade = 0; game.shake = Math.max(game.shake || 0, 0.35);
  } else if (t === "w6_a_sink") {
    m.w6aPull = W6A.pullT; for (const p of allPlayers()) p._w6aImm = false;
    if (typeof sfx !== "undefined" && sfx.boom) sfx.boom();
  } else if (t === "w6_a_pop") {
    m.w6aHide = 0; m.w6aPits = ""; m.x = c.x; m.y = c.y;
    const free = findFreeSpot(m.x, m.y, m.r, 3); if (free) { m.x = free.x; m.y = free.y; }
    spawnDust(m.x, m.y); spawnDust(m.x, m.y); addFloatText(m.x, m.y, "쏙!", "#e8d098", 22);
    const dmg = abilityDamage(c);
    for (const p of alivePlayers()) if (Math.hypot(p.x - c.x, p.y - c.y) < (c.radius || 1.6) + p.r * 0.6) { if (p.rollTimer > 0) addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); else hurtPlayer(p, dmg, m); }
    m.stagger = Math.max(m.stagger || 0, 1.2); // 튀어나온 뒤 헥헥 (때릴 시간)
  } else if (t === "w6_a_wall") {
    w6aGrowWalls(m, c);
  } else if (t === "w6_a_copies") {
    w6aMakeCopies(m);
  }
  return true;
}, 15);

// ===== 2 쏙쏙이: 모래 구멍 · 평평한 돌 =====
function w6aRocks() { return monsters.filter((o) => o.type === "w6_a_rock" && o.hp > 0); }
function w6aOpenPits(m) {
  const n = (m.phaseIdx || 0) >= 1 ? 2 : 1, pts = [{ x: m.x, y: m.y }];
  if (n > 1) { const p = game.player || m, a = Math.random() * Math.PI * 2, s = findFreeSpot(p.x + Math.cos(a) * 3.5, p.y + Math.sin(a) * 3.5, 0.6, 3); if (s) pts.push({ x: s.x, y: s.y }); }
  m.w6aPits = w6aStr(pts); m.w6aHide = 99; m.w6aPull = 0;
  spawnDust(m.x, m.y); addFloatText(m.x, m.y, "쏙쏙… 모래 속으로!", "#e8d098", 18);
}
function w6aOnRock(p) { return w6aRocks().some((r) => Math.hypot(r.x - p.x, r.y - p.y) < W6A.rockR); }
hookOn("dungeonTick", (dt) => {
  if (!w6aHost()) return;
  // 쏙쏙이: 처음 한 번 평평한 돌 6개 (아레나 둘레, 어디서든 몇 걸음 안에 하나)
  const ant = w6aBossOf("quicksands");
  if (ant && !ant.w6aInit) {
    ant.w6aInit = true;
    const c = world.W / 2, R = Math.max(4, world.W / 2 - 5);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + 0.3, s = findFreeSpot(c + Math.cos(a) * R * 0.62, c + Math.sin(a) * R * 0.62, 0.5, 3); if (!s) continue;
      const r = createMonster("w6_a_rock", s.x, s.y, ant.level); r.aggro = true; r.appearTimer = 0; r.immovable = true; r.r = 0.3; r.w6aOwned = true; monsters.push(r);
    }
  }
  if (ant && ant.w6aPull > 0) {
    ant.w6aPull = Math.max(0, ant.w6aPull - dt);
    const pits = w6aPts(ant.w6aPits), V = W6A.pullV[w6aDiff()] || 2.6;
    for (const p of alivePlayers()) {
      if (p._w6aImm || w6aOnRock(p) || !pits.length) continue;
      let best = null, bd = 1e9; for (const q of pits) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } }
      if (bd > 9) continue;
      if (bd < W6A.pitR) { w6aBite(ant, p, best); continue; }
      const step = Math.min(V * dt, bd - W6A.pitR * 0.5);
      moveEntity(p, (best.x - p.x) / bd * step, (best.y - p.y) / bd * step);
      if (Math.random() < 0.25) addSparkle(p.x, p.y, 0.2, { vx: (best.x - p.x) / bd * 2, vy: (best.y - p.y) / bd * 2, life: 0.4, size: 0.35, hue: 40 });
    }
    if (ant.w6aPull <= 0) { // 끝나면 바로 쏙! 튀어나와 깨물어요 (가까운 주인공 자리)
      const t = alivePlayers().sort((a, b) => Math.hypot(a.x - ant.x, a.y - ant.y) - Math.hypot(b.x - ant.x, b.y - ant.y))[0];
      if (t) castAbility(ant, "w6_a_pop", t); else ant.w6aHide = 0;
    }
  }
  // 숨은 채로 멈추면 안 돼요: 구멍도 끌기도 깨물기 예고도 없이 6초가 지나면 나와요
  if (ant && ant.w6aHide > 0) {
    const busy = ant.w6aPull > 0 || casts.some((c) => c.m === ant);
    ant._w6aHideT = busy ? 0 : (ant._w6aHideT || 0) + dt;
    if (ant._w6aHideT > 6) { ant.w6aHide = 0; ant.w6aPits = ""; ant._w6aHideT = 0; }
  }
  // 아롱이: 진짜 발자국 (보스 자리 기록은 각 기기에서: 친구 화면에도)
}, 44);
function w6aBite(b, p, pit) {
  p._w6aImm = true; p.hurtTimer = 0; p.rollTimer = 0;
  addFloatText(p.x, p.y, "앙! 깨물었다", "#ffb050", 22);
  hurtPlayer(p, p.maxHp * (W6A.biteK[w6aDiff()] || 0.22), b);
  let dx = p.x - pit.x, dy = p.y - pit.y, d = Math.hypot(dx, dy); if (d < 0.05) { dx = 1; dy = 0; d = 1; }
  moveEntity(p, dx / d * 3, dy / d * 3);
}
// 발자국 (아롱이 진짜만): 각 기기에서 보스 자리를 기록해요 (_ 칸은 같이 하기로 안 보내요)
hookOn("dungeonTick", () => {
  for (const o of monsters) {
    if (o.w6aBoss !== "mirageoasis" || o.hp <= 0) continue;
    const t = (o._w6aSteps = o._w6aSteps || []), last = t[t.length - 1];
    if (!last || Math.hypot(last.x - o.x, last.y - o.y) > 0.7) { t.push({ x: o.x, y: o.y, t: game.time }); if (t.length > 14) t.shift(); }
  }
}, 45);
if (typeof netGuest === "function") hookOn("netTick", () => { if (netGuest() && game.scene === "dungeon") for (const o of monsters) if (o.w6aBoss === "mirageoasis" && o.hp > 0) { const t = (o._w6aSteps = o._w6aSteps || []), last = t[t.length - 1]; if (!last || Math.hypot(last.x - o.x, last.y - o.y) > 0.7) { t.push({ x: o.x, y: o.y, t: game.time }); if (t.length > 14) t.shift(); } } }, 80);

// ===== 3 뾰족이: 선인장 벽 =====
function w6aGrowWalls(m, c) {
  const ax = c.x - m.x, ay = c.y - m.y, d = Math.hypot(ax, ay) || 1, nx = -ay / d, ny = ax / d;
  const mx = m.x + ax / d * Math.min(d, 3), my = m.y + ay / d * Math.min(d, 3);
  const old = monsters.filter((o) => o.type === "w6_a_cWall" && o.hp > 0);
  for (const o of old.slice(0, Math.max(0, old.length - 6))) { o.hp = 0; w6aDropWall(o); } // 너무 많으면 오래된 것부터
  const n = (m.phaseIdx || 0) >= 1 ? 4 : 3;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 0.9, x = mx + nx * off, y = my + ny * off;
    if (hitsWall(x, y, 0.35) || alivePlayers().some((p) => Math.hypot(p.x - x, p.y - y) < 0.8)) continue; // 주인공 자리엔 안 자라요 (갇히지 않게)
    const w = createMonster("w6_a_cWall", x, y, m.level); w.aggro = true; w.appearTimer = 0.3; w.immovable = true; w.r = 0.4; w.w6aOwned = true; w.w6aHits = 0; w.netSolid = 0.4;
    monsters.push(w); world.solids.push({ x, y, r: 0.4, prop: w });
  }
  spawnDust(mx, my); addFloatText(mx, my, "쑥쑥! 선인장 벽", "#9aef7a", 16);
  const dmg = abilityDamage(c);
  for (const p of alivePlayers()) if (Math.hypot(p.x - c.x, p.y - c.y) < (c.radius || 1.8) + p.r * 0.6 && p.rollTimer <= 0) hurtPlayer(p, dmg, m);
}

// ===== 4 아롱이: 가짜 낙타 =====
function w6aMakeCopies(m) {
  for (const o of monsters) if (o.type === "w6_a_camelCopy" && o.hp > 0) o.hp = 0;
  const n = [2, 3, 4][Math.min(2, m.phaseIdx || 0)], made = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + Math.random(), s = findFreeSpot(m.x + Math.cos(a) * 2.6, m.y + Math.sin(a) * 2.6, 0.6, 3) || { x: m.x, y: m.y };
    const o = createMonster("w6_a_camelCopy", s.x, s.y, m.level); o.aggro = true; o.appearTimer = 0.4; o.w6aOwned = true; o.damage = m.damage * 0.5; o.b2Scale = m.b2Scale; o.r = 0.6; o.summoned = true;
    monsters.push(o); made.push(o); addRing(s.x, s.y, { speed: 3, life: 0.4, hue: 45 });
  }
  // 진짜와 가짜 하나가 자리를 바꿔요 (헷갈리게!) · 진짜는 발자국이 남아요
  if (made.length) { const o = made[Math.floor(Math.random() * made.length)], x = m.x, y = m.y; m.x = o.x; m.y = o.y; o.x = x; o.y = y; m._w6aSteps = []; }
  addFloatText(m.x, m.y, "아롱아롱~ 누가 진짜게?", "#ffe27a", 18);
}

// ----- 그리기: 바닥 표시 -----
function w6aFloorCircle(x, y, r, fill, stroke, dash) {
  const c = toScreen(x, y, 0.02);
  ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, r * TILE_W / 2 * 1.41, r * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = 3; ctx.strokeStyle = stroke; if (dash) ctx.setLineDash(dash); ctx.stroke(); } ctx.restore();
}
hookOn("drawMonsterUnder", (m) => {
  if (m.w6aBoss === "sunsand" && m.w6aShade > 0 && m.hp > 0) {
    const s = w6aShadeSpot(m), pulse = 0.5 + 0.5 * Math.sin(game.time * 8);
    w6aFloorCircle(s.x, s.y, s.r, `rgba(40,60,50,${0.35 + pulse * 0.15})`, `rgba(125,255,176,${0.7 + pulse * 0.3})`, [10, 6]);
    const t = toScreen(s.x, s.y, 0.6); text("그늘", t.x, t.y, Math.round(12 * ZOOM), "#7dffb0", "center");
  }
  if (m.w6aBoss === "quicksands" && m.hp > 0) for (const q of w6aPts(m.w6aPits)) {
    const pull = m.w6aPull > 0, sp = game.time * (pull ? 4 : 1.5);
    w6aFloorCircle(q.x, q.y, pull ? 1.4 : 1.0, "rgba(90,60,30,0.55)", "rgba(255,180,90,0.9)", [8, 6]);
    for (let i = 0; i < 3; i++) { const r = ((sp + i / 3) % 1) * (pull ? 4 : 2) + 0.4; w6aFloorCircle(q.x, q.y, r, "rgba(0,0,0,0)", `rgba(232,208,152,${0.5 * (1 - r / 4.4)})`); }
  }
  if (m.w6aBoss === "mirageoasis" && m.hp > 0) for (const st of m._w6aSteps || []) {
    const age = game.time - st.t; if (age > 6) continue;
    const c = toScreen(st.x, st.y, 0.02); ctx.save(); ctx.globalAlpha = Math.max(0, 0.8 - age / 8); ctx.fillStyle = "#7a5a30";
    ctx.beginPath(); ctx.ellipse(c.x - 4 * ZOOM, c.y, 3 * ZOOM, 2 * ZOOM, 0, 0, Math.PI * 2); ctx.ellipse(c.x + 4 * ZOOM, c.y + 2 * ZOOM, 3 * ZOOM, 2 * ZOOM, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  if (m.type === "w6_a_rock" && m.hp > 0) {
    const ant = w6aBossOf("quicksands"), warn = ant && (ant.w6aHide > 0 || ant.w6aPull > 0), pulse = 0.5 + 0.5 * Math.sin(game.time * 8);
    w6aFloorCircle(m.x, m.y, W6A.rockR, warn ? `rgba(125,255,176,${0.18 + pulse * 0.15})` : "rgba(0,0,0,0)", warn ? "rgba(125,255,176,0.95)" : null, [8, 5]);
  }
}, 50);
// 안내 글자 (예고 동안): 화면 위쪽
hookOn("hudDraw", () => {
  if (game.scene !== "dungeon") return;
  const sun = w6aBossOf("sunsand"), ant = w6aBossOf("quicksands");
  const line = sun && sun.w6aShade > 0 ? "번쩍! 초록 '그늘' 자리로 숨어요!" : ant && ant.w6aHide > 0 && !(ant.w6aPull > 0) ? "모래 구멍이 열려요! 초록 동그라미 돌 위로!" : ant && ant.w6aPull > 0 ? "쭉쭉 끌려가요! 돌 위에 서거나 반대로 걸어요" : "";
  if (line) text(line, view.w / 2, 132, Math.round(Math.min(24, view.w / 32)), "#7dffb0", "center");
}, 45);

// ----- 그리기: 보스 모습 -----
function w6aStars(m, top) { if (!(m.stagger > 0) || m.trophy) return; const s = toScreen(m.x, m.y, top * (m.b2Scale || 1)); for (let i = 0; i < 3; i++) { const a = game.time * 5 + i * 2.1; drawStar(s.x + Math.cos(a) * 16 * ZOOM, s.y + Math.sin(a) * 6 * ZOOM, 6 * ZOOM, "#ffe27a"); } }
function w6aWet(m, c) { return (m.w6WetT || 0) > 0 && !m.trophy ? shade(c, 0.75) : c; }
const W6A_SHAPES = {
  // 선글라스 도마뱀: 납작한 몸, 긴 꼬리, 까만 선글라스, 주황 볏
  w6_a_lizard(m) {
    const P = b2Pose(m), body = w6aWet(m, "#f0b848"), belly = w6aWet(m, "#ffe0a0"), dark = "#3a2a1a", tail = Math.sin(game.time * 3) * 0.12, up = P.cast * 0.15 + P.breath;
    b2DrawBody(m, [
      { f: -0.1, s: 0, z: 0.15, w: 1.2, d: 0.75, h: 0.45, c: body },
      { f: -0.05, s: 0, z: 0.1, w: 0.9, d: 0.55, h: 0.1, c: belly },
      { f: -0.95, s: tail, z: 0.2, w: 0.7, d: 0.25, h: 0.2, c: body }, { f: -1.45, s: tail * 1.8, z: 0.22, w: 0.45, d: 0.16, h: 0.14, c: body },
      { f: 0.4, s: 0.42, z: 0, w: 0.22, d: 0.2, h: 0.25, c: body }, { f: 0.4, s: -0.42, z: 0, w: 0.22, d: 0.2, h: 0.25, c: body },
      { f: -0.5, s: 0.42, z: 0, w: 0.22, d: 0.2, h: 0.25, c: body }, { f: -0.5, s: -0.42, z: 0, w: 0.22, d: 0.2, h: 0.25, c: body },
      { f: 0.7, s: 0, z: 0.3 + up, w: 0.6, d: 0.62, h: 0.45, c: body, face: true, eye: dark, pupil: "#5a5a6a" }, // 선글라스 눈
      { f: 0.78, s: 0, z: 0.58 + up, w: 0.44, d: 0.66, h: 0.06, c: dark }, // 선글라스 테
      { f: 0.55, s: 0, z: 0.75 + up, w: 0.4, d: 0.1, h: 0.18, c: "#ff7a3a" }, { f: 0.3, s: 0, z: 0.6, w: 0.35, d: 0.08, h: 0.16, c: "#ff7a3a" }, // 볏
    ], { top: 1.4 });
    if (!m.trophy && Math.sin(game.time * 4) > 0.8) { const s = toScreen(m.x + m.faceX * 0.8 * (m.b2Scale || 1), m.y + m.faceY * 0.8 * (m.b2Scale || 1), 0.9 * (m.b2Scale || 1)); drawStar(s.x, s.y, 6 * ZOOM, "#ffffff"); }
    w6aStars(m, 1.4);
  },
  // 개미귀신: 동글 갈색 몸, 큰 집게 두 개, 작은 눈 (숨으면 집게 끝만)
  w6_a_antlion(m) {
    const P = b2Pose(m), body = w6aWet(m, "#a07848"), dark = w6aWet(m, "#6a4a28"), pinch = Math.abs(Math.sin(game.time * (P.cast ? 10 : 3))) * 0.18;
    if (m.w6aHide > 0 && !m.trophy) { b2DrawBody(m, [{ f: 0.7, s: 0.3 + pinch, z: 0, w: 0.4, d: 0.12, h: 0.18, c: dark }, { f: 0.7, s: -0.3 - pinch, z: 0, w: 0.4, d: 0.12, h: 0.18, c: dark }]); return; }
    b2DrawBody(m, [
      { f: -0.3, s: 0, z: 0.1 + P.breath, w: 1.1, d: 1.0, h: 0.6, c: body },
      { f: -0.3, s: 0, z: 0.7 + P.breath, w: 0.8, d: 0.7, h: 0.08, c: dark }, // 등 줄무늬
      { f: 0.35, s: 0, z: 0.15, w: 0.55, d: 0.6, h: 0.45, c: body, face: true, eye: "#fff6d8", pupil: "#2a1a0a", blush: "#ff9aa0" },
      { f: 0.85, s: 0.3 + pinch, z: 0.2, w: 0.6, d: 0.14, h: 0.16, c: dark }, { f: 0.85, s: -0.3 - pinch, z: 0.2, w: 0.6, d: 0.14, h: 0.16, c: dark },
      { f: 1.1, s: 0.18 + pinch, z: 0.2, w: 0.14, d: 0.14, h: 0.16, c: dark }, { f: 1.1, s: -0.18 - pinch, z: 0.2, w: 0.14, d: 0.14, h: 0.16, c: dark },
      ...[-0.5, -0.1, 0.25].flatMap((f) => [{ f, s: 0.58, z: 0, w: 0.12, d: 0.3, h: 0.14, c: dark }, { f, s: -0.58, z: 0, w: 0.12, d: 0.3, h: 0.14, c: dark }]),
    ], { top: 1.3 });
    w6aStars(m, 1.3);
  },
  // 선인장 왕: 키 큰 초록 기둥 + 팔 두 개 + 왕관 + 분홍 꽃, 하얀 가시 점
  w6_a_cactusKing(m) {
    const P = b2Pose(m), g = w6aWet(m, "#5aa848"), g2 = w6aWet(m, "#4a9038"), spin = P.cast ? Math.sin(game.time * 12) * 0.06 : 0, arm = P.cast * 0.25;
    b2DrawBody(m, [
      { f: 0, s: 0, z: 0, w: 0.75, d: 0.75, h: 1.7 + P.breath, c: g, face: true, eye: "#ffffff", pupil: "#1a3a10", blush: "#ff9ab0" },
      { f: 0, s: 0.62 + spin, z: 0.6, w: 0.3, d: 0.4, h: 0.28, c: g2 }, { f: 0, s: 0.8 + spin, z: 0.85 + arm, w: 0.3, d: 0.3, h: 0.55, c: g },
      { f: 0, s: -0.62 - spin, z: 0.5, w: 0.3, d: 0.4, h: 0.28, c: g2 }, { f: 0, s: -0.8 - spin, z: 0.75 + arm, w: 0.3, d: 0.3, h: 0.5, c: g },
      { f: 0, s: 0, z: 1.72 + P.breath, w: 0.6, d: 0.6, h: 0.12, c: "#ffd23f" }, { f: 0.2, s: 0.2, z: 1.84 + P.breath, w: 0.12, d: 0.12, h: 0.14, c: "#ffd23f" }, { f: -0.2, s: -0.2, z: 1.84 + P.breath, w: 0.12, d: 0.12, h: 0.14, c: "#ffd23f" },
      { f: 0, s: 0.8 + spin, z: 1.42 + arm, w: 0.2, d: 0.2, h: 0.12, c: "#ff8ab0" },
      { f: 0, s: 0, z: -0.02, w: 1.1, d: 1.1, h: 0.18, c: "#c87a4a" }, // 화분
    ], { top: 2.3 });
    w6aStars(m, 2.3);
  },
  // 신기루 낙타: 혹 두 개, 긴 목, 졸린 눈, 파란 안장 (가짜는 살짝 투명)
  w6_a_camel(m) {
    const P = b2Pose(m), c = w6aWet(m, "#e0c080"), d = w6aWet(m, "#c8a060"), step = P.walk * 0.12, nod = P.cast * 0.2 + P.breath;
    b2DrawBody(m, [
      { f: -0.1, s: 0, z: 0.55, w: 1.2, d: 0.7, h: 0.5, c },
      { f: -0.35, s: 0, z: 1.05, w: 0.4, d: 0.5, h: 0.3, c: d }, { f: 0.15, s: 0, z: 1.05, w: 0.4, d: 0.5, h: 0.26, c: d }, // 혹
      { f: -0.1, s: 0, z: 1.02, w: 0.2, d: 0.72, h: 0.08, c: "#4a8ad0" }, // 안장
      ...[[0.35, 0.22, step], [0.35, -0.22, -step], [-0.45, 0.22, -step], [-0.45, -0.22, step]].map(([f, s, k]) => ({ f: f + k, s, z: 0, w: 0.16, d: 0.16, h: 0.58, c: d })),
      { f: 0.6, s: 0, z: 0.85 + nod, w: 0.2, d: 0.22, h: 0.55, c }, // 목
      { f: 0.8, s: 0, z: 1.3 + nod, w: 0.5, d: 0.36, h: 0.32, c, face: true, eye: "#fff6d8", pupil: "#3a2a10" },
      { f: -0.75, s: 0, z: 0.85, w: 0.12, d: 0.08, h: 0.3, c: d }, // 꼬리
    ], { top: 2.0 });
    w6aStars(m, 2.0);
  },
  w6_a_camelCopy(m) { ctx.save(); ctx.globalAlpha *= 0.85 + 0.1 * Math.sin(game.time * 6 + (m.w6aAng || 0)); W6A_SHAPES.w6_a_camel(m); ctx.restore(); },
  w6_a_rock(m) { drawBox(m.x - 0.42, m.y - 0.42, 0, 0.84, 0.84, 0.1, "#a89a86"); drawBox(m.x - 0.32, m.y - 0.32, 0.1, 0.64, 0.64, 0.03, "#c8baa6"); },
  w6_a_cWall(m) {
    const hit = m.w6aHits || 0, c = hit >= 2 ? "#7a9a48" : hit === 1 ? "#5a9a40" : "#5aa848";
    drawBox(m.x - 0.3, m.y - 0.3, 0, 0.6, 0.6, 1.1, m.flash > 0 ? "#ffffff" : c);
    drawBox(m.x - 0.38, m.y - 0.12, 0.45, 0.16, 0.24, 0.35, c); drawBox(m.x + 0.22, m.y - 0.12, 0.6, 0.16, 0.24, 0.3, c);
    for (let i = 0; i < 4; i++) drawBox(m.x - 0.32 + (i % 2) * 0.62, m.y - 0.05, 0.25 + i * 0.22, 0.04, 0.04, 0.04, "#f4f4e8");
  },
};
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, W6A_SHAPES);
