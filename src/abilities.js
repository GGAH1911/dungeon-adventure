// ===== 몬스터 기술(어빌리티) =====
// 몬스터·보스가 쓰는 기술을 "부품"처럼 여기 한곳에 모아요.
// 몬스터 정의(monsters.js)에 abilities: ["slam", "fireBreath"] 처럼 적기만 하면
// 아래 tryAbilities 가 알아서 사거리·쿨다운을 보고 골라 써요.
//
// 공정성 규칙 (꼭 지키기!)
//  - 아픈 기술은 반드시 바닥에 "빨간 예고 장판"을 먼저 보여줘요 (최소 0.45초, 쉬움은 더 길게)
//  - 대처법(counter)을 꼭 적어요. 문서(docs/abilities.md)에 그대로 나와요.
//  - 새 기술을 만들면: node tools/gen-docs.mjs  -> node tools/check.mjs 통과
//
// ----- 기술 정의 문법 -----
// id: {
//   name: "한국어 이름", desc: "아이도 이해할 설명", counter: "대처법", tags: ["melee", "fire", ...],
//   telegraph: { shape: "circle"|"cone"|"line"|"ring"|"self"|"none",
//                radius, length, width, angle(라디안, 부채꼴 전체 각도), inner(고리 안쪽 반지름),
//                time(예고 초), follow(예고 중 주인공을 따라가나), at: "self"|"target"|"front", offset },
//   cooldown: 초, range: [최소, 최대] 거리, damageMul: 몬스터 공격력 배수,
//   effect: { type: "damage"|"knockback"|"pull"|"slow"|"burn"|"summon"|"shield"|"heal"|"zone"
//                   |"charge"|"volley"|"nova"|"teleport"|"buffAllies"|"rain"|"selfDestruct"|"enrage", ...파라미터 },
//   interruptible: true 이면 예고 중에 공격으로 끊을 수 있어요 (interruptAt: 최대 체력의 몇 % 피해면 끊김)
//   anim: 예고 중 자세 "raise"(두 팔 번쩍) | "slam"(내려찍기 준비) | "staff"(지팡이 들기) | "roar"(포효) | "point"(가리키기) | "crouch"(웅크리기)
//   weight: 고를 확률 가중치(기본 1), when: { hpBelow: 0.3, once: true, needInjuredAlly, maxSummons }
// }

const ABILITIES = {
  slam: {
    name: "땅 내려찍기", desc: "무기나 주먹을 높이 들었다가 바로 앞 땅을 쾅 내려쳐요.",
    counter: "빨간 원이 차오르면 원 밖으로 피하거나 구르기!", tags: ["melee", "area"],
    telegraph: { shape: "circle", radius: 1.4, at: "front", offset: 0.9, time: 0.7 },
    cooldown: 4, range: [0, 2], damageMul: 1.6, anim: "slam",
    effect: { type: "knockback", force: 1.2 },
  },
  fireBreath: {
    name: "불꽃 숨결", desc: "앞으로 넓게 불을 뿜어요. 맞으면 잠깐 불이 붙어요.",
    counter: "부채꼴 옆으로 돌아가거나 뒤로 물러나기", tags: ["cone", "fire"],
    telegraph: { shape: "cone", length: 4.2, angle: 1.0, at: "self", time: 0.9 },
    cooldown: 7, range: [0, 4], damageMul: 1.4, anim: "roar",
    effect: { type: "burn", duration: 3, tick: 0.8, tickMul: 0.25 },
  },
  frostBreath: {
    name: "얼음 숨결", desc: "차가운 입김을 부채꼴로 뿜어요. 맞으면 느려져요.",
    counter: "부채꼴 밖으로! 느려지면 구르기로 거리 벌리기", tags: ["cone", "ice"],
    telegraph: { shape: "cone", length: 4, angle: 1.1, at: "self", time: 0.85 },
    cooldown: 7, range: [0, 4], damageMul: 1.0, anim: "roar",
    effect: { type: "slow", duration: 2.5 },
  },
  charge: {
    name: "돌진", desc: "한 줄로 길게 예고한 뒤 그 길을 따라 무섭게 달려와요.",
    counter: "빨간 길 옆으로 비켜서기. 벽에 부딪히면 잠깐 멍해져요", tags: ["line", "move"],
    telegraph: { shape: "line", length: 7, width: 1.0, at: "self", time: 0.8 },
    cooldown: 8, range: [2.5, 7], damageMul: 1.5, anim: "crouch",
    effect: { type: "charge", speed: 11, stunOnWall: 1.2 },
  },
  beam: {
    name: "빛줄기", desc: "가늘고 긴 빛줄기를 똑바로 쏴요.",
    counter: "가는 선이라 옆으로 한 걸음만 비켜도 돼요", tags: ["line", "magic"],
    telegraph: { shape: "line", length: 9, width: 0.7, at: "self", time: 0.75, follow: true },
    cooldown: 6, range: [1.5, 9], damageMul: 1.6, anim: "staff", interruptible: true, interruptAt: 0.12,
    effect: { type: "damage" },
  },
  shockRing: {
    name: "충격파 고리", desc: "몸 주변으로 고리 모양 충격파가 퍼져요. 가운데는 안전해요.",
    counter: "몬스터 바로 옆(고리 안쪽)으로 파고들거나 멀리 떨어지기", tags: ["ring", "area"],
    telegraph: { shape: "ring", radius: 4, inner: 1.4, at: "self", time: 1.0 },
    cooldown: 9, range: [1.4, 4], damageMul: 1.5, anim: "raise",
    effect: { type: "knockback", force: 1.0 },
  },
  meteorRain: {
    name: "돌 비", desc: "하늘에서 돌덩이가 여러 군데 떨어져요.",
    counter: "빨간 원들 사이 빈 곳을 찾아 움직이기", tags: ["area", "multi"],
    telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.0 },
    cooldown: 10, range: [0, 9], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 6, spread: 3.2, stagger: 0.18 },
  },
  trackingStrike: {
    name: "따라오는 낙인", desc: "주인공 발밑에 표시가 생겨서 따라다니다가 멈춘 곳이 터져요.",
    counter: "계속 움직이다가 표시가 멈추면(테두리가 굵어지면) 빠져나가기", tags: ["area", "track"],
    telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.4, follow: true },
    cooldown: 8, range: [0, 8], damageMul: 1.6, anim: "point", interruptible: true, interruptAt: 0.1,
    effect: { type: "damage" },
  },
  summonMinions: {
    name: "부하 부르기", desc: "주변에 부하 몬스터를 불러내요.",
    counter: "부르는 중에 때리면 끊을 수 있어요. 부하는 빨리 정리하기", tags: ["summon"],
    telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.2 },
    cooldown: 14, range: [0, 10], anim: "raise", interruptible: true, interruptAt: 0.08,
    effect: { type: "summon", monster: "zombie", count: 2 }, when: { maxSummons: 4 },
  },
  shield: {
    name: "보호막", desc: "몸에 보호막을 둘러서 한동안 공격을 흡수해요.",
    counter: "보호막이 깨질 때까지 세게 몰아치기 (불·폭탄도 좋아요)", tags: ["defense"],
    telegraph: { shape: "self", radius: 1.0, at: "self", time: 0.6 },
    cooldown: 15, range: [0, 10], anim: "raise",
    effect: { type: "shield", amount: 0.25, duration: 8 },
  },
  healAllies: {
    name: "치유의 빛", desc: "주변 다친 동료 몬스터를 치료해요.",
    counter: "치유하는 몬스터를 먼저 잡거나, 화살로 시전을 끊기", tags: ["support"],
    telegraph: { shape: "self", radius: 4, at: "self", time: 1.0 },
    cooldown: 9, range: [0, 12], anim: "staff", interruptible: true, interruptAt: 0.1,
    effect: { type: "heal", amount: 0.3, radius: 4 }, when: { needInjuredAlly: true },
  },
  rallyCry: {
    name: "함성", desc: "크게 소리쳐서 주변 동료를 빠르고 세게 만들어요.",
    counter: "함성 지르는 몬스터부터 처치하기. 강해진 몹(빨간 기운)은 피해서 싸우기", tags: ["support"],
    telegraph: { shape: "self", radius: 4.5, at: "self", time: 0.8 },
    cooldown: 14, range: [0, 10], anim: "roar",
    effect: { type: "buffAllies", radius: 4.5, speed: 1.4, damage: 1.3, duration: 6 },
  },
  pull: {
    name: "끌어당기기", desc: "넓은 원 안에 있으면 몬스터 쪽으로 끌려가요.",
    counter: "보라색 원이 차기 전에 원 밖으로 나가기", tags: ["control"],
    telegraph: { shape: "circle", radius: 5, at: "self", time: 0.9 },
    cooldown: 10, range: [2, 5], anim: "raise",
    effect: { type: "pull", force: 2.6 },
  },
  repelBlast: {
    name: "밀어내기 폭발", desc: "몸 주변이 펑 터지면서 가까이 있는 걸 멀리 날려요.",
    counter: "몬스터가 웅크리면 뒤로 빠지기", tags: ["area", "melee"],
    telegraph: { shape: "circle", radius: 2.2, at: "self", time: 0.65 },
    cooldown: 8, range: [0, 2], damageMul: 1.0, anim: "crouch",
    effect: { type: "knockback", force: 2.2 },
  },
  blink: {
    name: "순간이동 습격", desc: "주인공 근처 보라 원으로 순간이동한 뒤 그 자리를 쳐요.",
    counter: "보라 원이 보이면 그 자리에서 떨어지기", tags: ["move", "magic"],
    telegraph: { shape: "circle", radius: 1.1, at: "target", time: 0.8 },
    cooldown: 9, range: [3, 9], damageMul: 1.3, anim: "crouch",
    effect: { type: "teleport" },
  },
  nova: {
    name: "사방 탄막", desc: "온 사방으로 구슬을 한꺼번에 쏴요.",
    counter: "구슬 사이 빈틈으로 빠져나가거나 구르기로 통과", tags: ["projectile"],
    telegraph: { shape: "self", radius: 1.5, at: "self", time: 0.7 },
    cooldown: 8, range: [0, 7], damageMul: 0.8, anim: "raise",
    effect: { type: "nova", count: 12, speed: 5, color: "#ff7ad9" },
  },
  volley: {
    name: "부채꼴 탄막", desc: "앞쪽으로 여러 발을 부채처럼 퍼뜨려 쏴요.",
    counter: "몬스터 옆으로 돌거나 멀리서 탄 사이를 피하기", tags: ["projectile"],
    telegraph: { shape: "cone", length: 6, angle: 0.9, at: "self", time: 0.6, harmlessPreview: true },
    cooldown: 6, range: [2, 8], damageMul: 0.8, anim: "point",
    effect: { type: "volley", count: 5, spread: 0.9, speed: 7, color: "#ffb03b" },
  },
  poisonPool: {
    name: "독 웅덩이", desc: "주인공 발밑에 독 웅덩이를 만들어요. 한동안 남아 있어요.",
    counter: "초록 웅덩이 위에 서 있지 않기", tags: ["zone", "poison"],
    telegraph: { shape: "circle", radius: 1.5, at: "target", time: 0.8 },
    cooldown: 9, range: [0, 8], damageMul: 0.4, anim: "point",
    effect: { type: "zone", duration: 6, tick: 0.7, kind: "poison" },
  },
  webTrap: {
    name: "거미줄 덫", desc: "끈적한 거미줄을 뿌려요. 밟으면 느려져요.",
    counter: "거미줄을 돌아가거나 구르기로 넘어가기", tags: ["zone", "control"],
    telegraph: { shape: "circle", radius: 1.8, at: "target", time: 0.6 },
    cooldown: 10, range: [0, 7], anim: "point",
    effect: { type: "zone", duration: 7, tick: 0.3, kind: "web" },
  },
  selfDestruct: {
    name: "자폭", desc: "몸이 부풀다가 크게 터져요. 터지면 그 몬스터도 사라져요.",
    counter: "부풀기 시작하면 멀리 도망! (화살로 먼저 잡으면 안 터져요)", tags: ["area", "explode"],
    telegraph: { shape: "circle", radius: 2.4, at: "self", time: 1.1 },
    cooldown: 99, range: [0, 1.6], damageMul: 2.5, anim: "crouch", interruptible: true, interruptAt: 0.5,
    effect: { type: "selfDestruct", force: 1.5 },
  },
  enrage: {
    name: "광폭화", desc: "체력이 적어지면 화가 나서 빨라지고 세져요.",
    counter: "광폭화하면 무리하지 말고 피하면서 화살로 마무리", tags: ["buff", "passive"],
    telegraph: { shape: "self", radius: 1.4, at: "self", time: 0.8 },
    cooldown: 999, range: [0, 99], anim: "roar", when: { hpBelow: 0.35, once: true }, weight: 50,
    effect: { type: "enrage", speed: 1.45, damage: 1.35 },
  },
  groundSpikes: {
    name: "땅가시 줄", desc: "땅에서 가시가 한 줄로 솟아올라요.",
    counter: "가시 줄과 나란히 서지 말고 옆으로 비키기", tags: ["line", "area"],
    telegraph: { shape: "line", length: 6.5, width: 1.3, at: "self", time: 0.8 },
    cooldown: 7, range: [1, 6.5], damageMul: 1.4, anim: "slam",
    effect: { type: "damage", spikes: true },
  },
};

// 이미 있던 몬스터 행동(behavior)의 설명 — 문서에 나와요. 새 behavior 를 만들면 여기에도 꼭 적어요.
const BEHAVIOR_DOCS = {
  melee: { name: "근접", desc: "다가와서 팔(무기)을 들어 올렸다가 내려쳐요.", counter: "팔을 드는 순간 구르거나 물러나기" },
  pounce: { name: "덮치기", desc: "웅크렸다가 점프해서 덮쳐요.", counter: "웅크리는 걸 보면 옆으로 구르기" },
  archer: { name: "활 쏘기", desc: "멀리서 시위를 당겨 화살을 쏘고, 가까이 가면 도망가요.", counter: "시위를 당기는 동안 옆으로 움직이기" },
  caster: { name: "마법 구슬", desc: "따라오는 마법 구슬을 던져요.", counter: "구르기로 구슬을 통과하기" },
  flyer: { name: "날며 물기", desc: "지그재그로 날아와 물고 도망가요.", counter: "다가올 때 칼을 미리 휘두르기" },
  exploder: { name: "펑 터지기", desc: "가까이 와서 부풀다가 터져요.", counter: "심지가 반짝이면 멀리 떨어지기" },
  miner: { name: "곡괭이 던지기", desc: "근접 공격, 멀면 곡괭이를 머리 위로 들었다가 던져요.", counter: "곡괭이를 들면 옆으로 비키기" },
  wisp: { name: "바람 구슬", desc: "거리를 두고 지그재그로 날며 따라오는 바람 구슬을 쏴요.", counter: "구르기로 통과, 활로 맞추기" },
  crab: { name: "옆걸음 집게", desc: "옆걸음으로 다가와 집게로 꽉 집어요. 단단해요.", counter: "집게를 피해 뒤로 돌아 공격" },
  shadow: { name: "그림자 순간이동", desc: "예고 원을 보인 뒤 등 뒤로 순간이동해 내려쳐요.", counter: "보라 원이 생기면 구르기" },
};

// ----- 난이도별 조절 (game.profile.difficulty) -----
// 피해 배수는 몬스터 공격력(diff().dmg)에 이미 들어 있어서 여기서는 1로 둬요 (두 번 곱하지 않기)
const ABILITY_TUNING = {
  easy: { telegraph: 1.5, damage: 1.0, size: 0.85, cooldown: 1.35 },
  normal: { telegraph: 1.0, damage: 1.0, size: 1.0, cooldown: 1.0 },
  hard: { telegraph: 0.88, damage: 1.0, size: 1.1, cooldown: 0.85 },
  nightmare: { telegraph: 0.8, damage: 1.0, size: 1.2, cooldown: 0.7 },
};
const MIN_TELEGRAPH = 0.45; // 아픈 기술 예고는 어떤 난이도에서도 이보다 짧지 않아요

function abilityTuning() {
  const d = (typeof game !== "undefined" && game.profile && game.profile.difficulty) || "normal";
  return ABILITY_TUNING[d] || ABILITY_TUNING.normal;
}

function abilityHurts(ab) {
  const t = ab.effect.type;
  return ab.damageMul > 0 || ["damage", "knockback", "burn", "slow", "rain", "charge", "zone", "selfDestruct", "pull"].includes(t);
}

// ===== 실행 =====
let casts = [];   // 예고 중인 기술
let zones = [];   // 남아 있는 장판 (독, 거미줄)

function clearAbilities() { casts = []; zones = []; }

// 몬스터 AI 훅: 쓸 기술이 있으면 쓰고 true 를 돌려줘요 (그동안 원래 행동은 쉬어요)
function tryAbilities(m, p, dist, dt) {
  if (m.charge) { m.moving = false; return true; }
  if (m.state === "cast") { m.moving = false; return true; }
  const list = currentAbilityList(m);
  if (!list || !list.length) return false;
  m.abCd = m.abCd || {};
  for (const id in m.abCd) m.abCd[id] -= dt;
  m.abGlobal = (m.abGlobal === undefined ? 0.8 + Math.random() : m.abGlobal) - dt;
  if (m.abGlobal > 0) return false;
  const frac = m.hp / m.maxHp;
  const cands = [];
  for (const id of list) {
    const ab = ABILITIES[id];
    if (!ab || (m.abCd[id] || 0) > 0) continue;
    const w = ab.when || {};
    if (w.hpBelow && frac > w.hpBelow) continue;
    if (w.once && m.abUsed && m.abUsed[id]) continue;
    if (dist < ab.range[0] || dist > ab.range[1]) continue;
    if (w.needInjuredAlly && !monsters.some((o) => o !== m && o.hp > 0 && o.hp < o.maxHp * 0.8 && Math.hypot(o.x - m.x, o.y - m.y) < (ab.effect.radius || 4))) continue;
    if (w.maxSummons && (m.summons || []).filter((s) => s.hp > 0).length >= w.maxSummons) continue;
    if (ab.telegraph.at === "target" && !lineOfSight(m.x, m.y, p.x, p.y) && dist > 2) continue;
    if (ab.effect.type === "shield" && m.shieldHp > 0) continue;
    cands.push({ id, w: ab.weight || 1 });
  }
  if (!cands.length) return false;
  let roll = Math.random() * cands.reduce((s, c) => s + c.w, 0);
  let pick = cands[0].id;
  for (const c of cands) { roll -= c.w; if (roll <= 0) { pick = c.id; break; } }
  castAbility(m, pick, p);
  return true;
}

// 보스는 체력 단계(phases)마다 쓰는 기술이 바뀌어요
function currentAbilityList(m) {
  const phases = m.phases || m.def.phases;
  if (phases && phases.length) {
    const frac = m.hp / m.maxHp;
    let idx = phases.findIndex((ph) => frac > (ph.until === undefined ? 0 : ph.until));
    if (idx < 0) idx = phases.length - 1;
    if (m.phaseIndex !== undefined && idx !== m.phaseIndex) onPhaseChange(m, idx);
    m.phaseIndex = idx;
    return phases[idx].abilities;
  }
  return m.abilities || m.def.abilities;
}

function onPhaseChange(m, idx) {
  m.abGlobal = 1.2;
  addFloatText(m.x, m.y, `${idx + 1}단계!`, "#ff9090", 26);
  addRing(m.x, m.y, { speed: 6, life: 0.5, hue: 0 });
  game.shake = Math.max(game.shake, 0.3);
  if (typeof sfx !== "undefined" && sfx.boss) sfx.boss();
  if (typeof m.onPhase === "function") m.onPhase(idx);
}

// 기술 시작 -> 예고 장판
function castAbility(m, id, target) { hookRun("castStart", m, id); const r = castAbilityBase(m, id, target); hookRun("castStarted", m, id); return r; }
function castAbilityBase(m, id, target) {
  const ab = ABILITIES[id];
  const tune = abilityTuning();
  const tg = ab.telegraph;
  let time = tg.time * tune.telegraph;
  if (abilityHurts(ab)) time = Math.max(MIN_TELEGRAPH, time);
  const dx = target.x - m.x, dy = target.y - m.y, d = Math.hypot(dx, dy) || 1;
  m.faceX = dx / d; m.faceY = dy / d;
  m.state = "cast";
  m.castAnim = ab.anim || "raise";
  m.castTime = time;
  m.castT = 0;
  m.moving = false;
  m.abCd = m.abCd || {};
  m.abCd[id] = ab.cooldown * tune.cooldown;
  m.abGlobal = 1.0 + Math.random() * 0.8;
  m.abUsed = m.abUsed || {};
  m.abUsed[id] = true;

  if (ab.effect.type === "rain") {
    // 여러 개의 작은 원이 차례로
    const e = ab.effect;
    for (let i = 0; i < e.count; i++) {
      const a = Math.random() * Math.PI * 2, r = i === 0 ? 0 : Math.sqrt(Math.random()) * e.spread;
      const c = makeCast(m, ab, id, { x: target.x + Math.cos(a) * r, y: target.y + Math.sin(a) * r }, time + i * e.stagger, tune);
      c.sub = true;
      c.ownerLock = i === e.count - 1;
      casts.push(c);
    }
    return;
  }
  const c = makeCast(m, ab, id, target, time, tune);
  c.ownerLock = true;
  if (ab.effect.type === "teleport") {
    // 주인공 둘레 빈자리 (등 뒤쪽 우선)
    const px = target.x - (target.faceX || 0) * 1.6, py = target.y - (target.faceY || 0) * 1.6;
    const spot = findFreeSpot(px, py, m.r, 2.5) || { x: target.x + 1, y: target.y };
    c.x = spot.x; c.y = spot.y; c.follow = false;
  }
  casts.push(c);
  if (typeof sfx !== "undefined") { if (ab.interruptible) sfx.fuse(); else sfx.bigSwing(); }
}

function makeCast(m, ab, id, target, time, tune) {
  const tg = ab.telegraph;
  const c = {
    id, ab, m, t: 0, time, tune,
    x: m.x, y: m.y, dirX: m.faceX, dirY: m.faceY,
    follow: !!tg.follow, dmgTaken: 0,
    radius: (tg.radius || 0) * tune.size, inner: (tg.inner || 0) * tune.size,
    length: (tg.length || 0) * tune.size, width: (tg.width || 0) * tune.size, angle: (tg.angle || 0) * Math.min(1.25, tune.size),
  };
  c.target = target && target.maxHp && !target.def ? target : null; // 노리는 주인공 (둘이 하기)
  if (tg.at === "target") { c.x = target.x; c.y = target.y; }
  if (tg.at === "front") { c.x = m.x + m.faceX * (tg.offset || 0.8); c.y = m.y + m.faceY * (tg.offset || 0.8); }
  return c;
}

function updateAbilities(dt) { const r = updateAbilitiesBase(dt); hookRun("abilitiesUpdated", dt); return r; }
function updateAbilitiesBase(dt) {
  const p0 = game.player;
  // 예고 진행
  for (const c of casts) {
    const m = c.m;
    const p = c.target && c.target.hp > 0 ? c.target : (c.target = nearestPlayer(m.x, m.y)); // 노리는 주인공 (둘이 하기)
    if (m.hp <= 0 && c.ab.effect.type !== "rain") { c.dead = true; if (c.ownerLock) endCastState(m); continue; }
    c.t += dt;
    const tg = c.ab.telegraph;
    // 따라오는 예고: 마지막 30%는 멈춰요 (피할 시간)
    if (c.follow && c.t < c.time * 0.7 && p) {
      if (tg.at === "target") { c.x += (p.x - c.x) * Math.min(1, dt * 6); c.y += (p.y - c.y) * Math.min(1, dt * 6); }
      else { const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1; c.dirX = dx / d; c.dirY = dy / d; m.faceX = c.dirX; m.faceY = c.dirY; }
    }
    if (tg.at === "self") { c.x = m.x; c.y = m.y; }
    if (c.ownerLock) m.castT = Math.min(1, c.t / c.time);
    if (c.t >= c.time) { c.dead = true; resolveCast(c, p); if (c.ownerLock) endCastState(m); }
  }
  casts = casts.filter((c) => !c.dead);

  // 남아 있는 장판
  for (const z of zones) {
    z.life -= dt;
    z.tickT -= dt;
    let tick = false;
    for (const p of allPlayers()) {
      if (p.hp <= 0) continue;
      const inside = Math.hypot(p.x - z.x, p.y - z.y) < z.radius;
      if (z.kind === "web") { if (inside) p.abSlow = Math.max(p.abSlow || 0, 0.35); continue; }
      if (inside && z.tickT <= 0) { tick = true; hurtPlayer(p, z.damage, { x: p.x, y: p.y }); }
    }
    if (tick) z.tickT = z.tick;
  }
  zones = zones.filter((z) => z.life > 0);

  // 돌진 중인 몬스터
  for (const m of monsters) {
    if (m.charge) updateCharge(m, nearestPlayer(m.x, m.y), dt);
    if (m.buffT > 0) { m.buffT -= dt; if (m.buffT <= 0) clearBuff(m); else if (Math.random() < dt * 8) addSparkle(m.x, m.y, Math.random(), { vz: 1, life: 0.4, size: 0.5, hue: 0 }); }
    if (m.shieldT > 0) { m.shieldT -= dt; if (m.shieldT <= 0) m.shieldHp = 0; }
  }

  // 주인공 상태 (불붙음, 느려짐)
  for (const p of allPlayers()) if (p.hp > 0) {
    if (p.abSlow > 0) p.abSlow -= dt;
    if (p.abBurn > 0) {
      p.abBurn -= dt; p.abBurnTick -= dt;
      if (Math.random() < dt * 12) addSparkle(p.x + (Math.random() - 0.5) * 0.4, p.y + (Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.6, { vz: 1.2, life: 0.4, size: 0.5, gold: true });
      if (p.abBurnTick <= 0) { p.abBurnTick = p.abBurnEvery || 0.8; if (p.rollTimer <= 0) hurtPlayer(p, p.abBurnDmg || 0.5, { x: p.x, y: p.y }); }
    }
  }
}

function endCastState(m) {
  if (m.state === "cast") { m.state = "chase"; m.strikeT = 0.22; }
}

// 이 점이 예고 모양 안에 있나
function insideShape(c, x, y, extra = 0) {
  const shape = c.ab.telegraph.shape;
  const dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy);
  if (shape === "circle" || shape === "self") return d <= c.radius + extra;
  if (shape === "ring") return d <= c.radius + extra && d >= c.inner - extra;
  if (shape === "cone") {
    if (d > c.length + extra) return false;
    if (d < 0.4) return true;
    const dot = (dx * c.dirX + dy * c.dirY) / d;
    return Math.acos(Math.max(-1, Math.min(1, dot))) <= c.angle / 2 + 0.05;
  }
  if (shape === "line") {
    const along = dx * c.dirX + dy * c.dirY;
    const perp = Math.abs(-dx * c.dirY + dy * c.dirX);
    return along >= -0.3 && along <= c.length + extra && perp <= c.width / 2 + extra;
  }
  return false;
}

function abilityDamage(c) {
  return c.m.damage * (c.ab.damageMul || 1) * c.tune.damage;
}

// 예고가 끝나면 효과!
function resolveCast(c, p) { const z0 = zones.length; if (!hookAny("resolveCast", c, p)) resolveCastBase(c, p); hookRun("castResolved", c, p, z0); }
function resolveCastBase(c, p) {
  const ab = c.ab, e = ab.effect, m = c.m;
  const hitPlayer = p && p.hp > 0 && insideShape(c, p.x, p.y, p.r * 0.6);
  const dmg = abilityDamage(c);
  const hurt = () => { if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); return false; } const hp0 = p.hp; hurtPlayer(p, dmg, m); return p.hp < hp0; };
  const push = (force, toward) => {
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
    const k = toward ? -1 : 1;
    moveEntity(p, (dx / d) * force * k, (dy / d) * force * k);
  };
  const boom = (hue) => { addRing(c.x, c.y, { speed: Math.max(3, (c.radius || c.length || 2) * 4), life: 0.3, hue }); spawnDust(c.x, c.y); game.shake = Math.max(game.shake, 0.2); };

  switch (e.type) {
    case "damage":
      if (ab.telegraph.shape === "line") lineBurst(c, e.spikes ? "#b8a07a" : "#fff2a8"); else boom(10);
      if (hitPlayer) hurt();
      break;
    case "knockback":
      boom(25);
      if (typeof sfx !== "undefined") sfx.slam();
      if (hitPlayer && hurt()) push(e.force || 1);
      break;
    case "burn":
    case "slow":
      coneBurst(c, e.type === "burn" ? ["#ff7a1a", "#ffd23f"] : ["#bfeaff", "#ffffff"]);
      if (hitPlayer && hurt()) {
        if (e.type === "burn") { p.abBurn = e.duration; p.abBurnTick = e.tick; p.abBurnEvery = e.tick; p.abBurnDmg = dmg * (e.tickMul || 0.25); }
        else p.abSlow = Math.max(p.abSlow || 0, e.duration);
      }
      break;
    case "rain":
      boom(30);
      if (hitPlayer) hurt();
      break;
    case "pull":
      // 바깥에서 안으로 빨려드는 반짝이
      for (let i = 0; i < 20; i++) { const a = Math.random() * Math.PI * 2, r = c.radius * (0.6 + Math.random() * 0.4); addSparkle(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 0.3, { vx: -Math.cos(a) * r * 2, vy: -Math.sin(a) * r * 2, life: 0.45, size: 0.7, hue: 280 }); }
      if (hitPlayer && p.rollTimer <= 0) push(Math.min(e.force, Math.hypot(p.x - c.x, p.y - c.y) - 0.8), true);
      break;
    case "charge":
      m.charge = { dx: c.dirX, dy: c.dirY, left: c.length, speed: e.speed, hit: false, dmg, stun: e.stunOnWall || 1 };
      break;
    case "summon": {
      m.summons = m.summons || [];
      const lvl = m.level || (game.mapLevel || 1);
      for (let i = 0; i < e.count; i++) {
        const a = (i / e.count) * Math.PI * 2 + Math.random();
        const spot = findFreeSpot(m.x + Math.cos(a) * 1.4, m.y + Math.sin(a) * 1.4, 0.35, 2) || { x: m.x, y: m.y };
        const s = createMonster(e.monster, spot.x, spot.y, lvl);
        s.aggro = true; s.appearTimer = 0.6; s.summoned = true;
        monsters.push(s); m.summons.push(s);
        addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 280 });
      }
      break;
    }
    case "shield":
      m.shieldHp = m.maxHp * e.amount; m.shieldMax = m.shieldHp; m.shieldT = e.duration;
      addFloatText(m.x, m.y, "보호막!", "#8fe0ff", 20);
      break;
    case "heal":
      for (const o of monsters) {
        if (o.hp <= 0 || Math.hypot(o.x - m.x, o.y - m.y) > e.radius) continue;
        const h = o.maxHp * e.amount;
        o.hp = Math.min(o.maxHp, o.hp + h);
        addFloatText(o.x, o.y, `+${Math.round(h)}`, "#7dffb0", 17);
      }
      addRing(m.x, m.y, { speed: 6, life: 0.4, hue: 130 });
      break;
    case "buffAllies":
      for (const o of monsters) if (o.hp > 0 && Math.hypot(o.x - m.x, o.y - m.y) <= e.radius) applyBuff(o, e.speed, e.damage, e.duration);
      addRing(m.x, m.y, { speed: 7, life: 0.4, hue: 0 });
      break;
    case "teleport":
      spawnBurst(m.x, m.y, ["#2a1838", "#7a3fd0"], 12);
      m.x = c.x; m.y = c.y;
      spawnBurst(m.x, m.y, ["#2a1838", "#7a3fd0"], 12);
      boom(280);
      if (hitPlayer) hurt();
      break;
    case "nova":
    case "volley": {
      const n = e.count;
      const base = Math.atan2(c.dirY, c.dirX);
      for (let i = 0; i < n; i++) {
        const a = e.type === "nova" ? (i / n) * Math.PI * 2 : base + (i - (n - 1) / 2) * (e.spread / Math.max(1, n - 1));
        arrows.push({ x: m.x + Math.cos(a) * 0.4, y: m.y + Math.sin(a) * 0.4, vx: Math.cos(a) * e.speed, vy: Math.sin(a) * e.speed, life: 2.5, damage: dmg, bolt: true, color: e.color || "#ff7ad9" });
      }
      if (typeof sfx !== "undefined") sfx.orb();
      break;
    }
    case "zone":
      zones.push({ x: c.x, y: c.y, radius: c.radius, life: e.duration, max: e.duration, tick: e.tick, tickT: 0.2, damage: dmg, kind: e.kind });
      if (hitPlayer && e.kind !== "web" && dmg > 0) hurt();
      break;
    case "selfDestruct":
      boom(20); boom(40);
      spawnBurst(m.x, m.y, ["#ff9a3b", "#ffd23f", "#555555"], 26);
      flashScreen(0.12);
      if (typeof sfx !== "undefined") sfx.boom();
      if (hitPlayer && hurt() && p.rollTimer <= 0) push(e.force || 1.5);
      m.shieldHp = 0;
      damageMonster(m, m.hp + 1, m.x, m.y, false, 0, { dot: true });
      break;
    case "enrage":
      applyBuff(m, e.speed, e.damage, 9999);
      m.enraged = true;
      addFloatText(m.x, m.y, "광폭화!", "#ff5050", 26);
      if (typeof sfx !== "undefined") sfx.boss();
      break;
  }
}

function applyBuff(o, speed, damage, duration) {
  if (!o._buff) { o._buff = { speed: o.speed, damage: o.damage }; o.speed *= speed; o.damage *= damage; }
  o.buffT = Math.max(o.buffT || 0, duration);
}
function clearBuff(o) {
  if (o._buff) { o.speed = o._buff.speed; o.damage = o._buff.damage; o._buff = null; }
}

function updateCharge(m, p, dt) {
  const ch = m.charge;
  const step = Math.min(ch.left, ch.speed * dt);
  const x0 = m.x, y0 = m.y;
  moveEntity(m, ch.dx * step, ch.dy * step);
  const moved = Math.hypot(m.x - x0, m.y - y0);
  ch.left -= step;
  m.moving = true; m.walkTime += dt * 2; m.faceX = ch.dx; m.faceY = ch.dy;
  if (Math.random() < dt * 30) spawnDust(m.x - ch.dx * 0.3, m.y - ch.dy * 0.3);
  if (!ch.hit && p && p.hp > 0 && Math.hypot(p.x - m.x, p.y - m.y) < m.r + p.r + 0.15) {
    ch.hit = true;
    if (p.rollTimer > 0) addFloatText(p.x, p.y, "회피!", "#9be8ff", 18);
    else { hurtPlayer(p, ch.dmg, m); moveEntity(p, ch.dx * 1.2, ch.dy * 1.2); }
  }
  if (moved < step * 0.3 && step > 0.01) {
    // 벽에 쿵!
    m.charge = null; m.moving = false;
    m.stunTimer = ch.stun; m.knockX = -ch.dx * 2; m.knockY = -ch.dy * 2;
    addFloatText(m.x, m.y, "쿵!", "#ffe27a", 20);
    game.shake = Math.max(game.shake, 0.3);
    if (typeof sfx !== "undefined") sfx.slam();
    return;
  }
  if (ch.left <= 0.001) { m.charge = null; m.moving = false; }
}

function lineBurst(c, color) {
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    const x = c.x + c.dirX * c.length * k, y = c.y + c.dirY * c.length * k;
    addSparkle(x, y, 0.3, { vz: 2, life: 0.4, size: 0.7, gold: color === "#fff2a8" });
    if (color !== "#fff2a8" && i % 2 === 0) spawnBurst(x, y, [color, "#8a7a5a"], 2);
  }
  game.shake = Math.max(game.shake, 0.15);
}

function coneBurst(c, colors) {
  const base = Math.atan2(c.dirY, c.dirX);
  for (let i = 0; i < 26; i++) {
    const a = base + (Math.random() - 0.5) * c.angle, r = Math.random() * c.length;
    spawnBurst(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, colors, 1);
  }
}

// ===== 그리기: 바닥 예고 장판 =====
function shapePoints(c, k = 1) {
  const shape = c.ab.telegraph.shape;
  const pts = [];
  if (shape === "circle" || shape === "self") {
    const r = c.radius * k;
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; pts.push(toScreen(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 0.03)); }
  } else if (shape === "cone") {
    const base = Math.atan2(c.dirY, c.dirX), L = c.length * k;
    pts.push(toScreen(c.x, c.y, 0.03));
    for (let i = 0; i <= 16; i++) { const a = base - c.angle / 2 + (i / 16) * c.angle; pts.push(toScreen(c.x + Math.cos(a) * L, c.y + Math.sin(a) * L, 0.03)); }
  } else if (shape === "line") {
    const L = c.length * k, hw = c.width / 2, px = -c.dirY, py = c.dirX;
    const P = (al, pr) => toScreen(c.x + c.dirX * al + px * pr, c.y + c.dirY * al + py * pr, 0.03);
    pts.push(P(0, hw), P(L, hw), P(L, -hw), P(0, -hw));
  }
  return pts;
}

function pathPoly(pts) {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

// ----- 안내 색 규칙 (게임 전체 공통, docs/guide.md) -----
//   빨강 = 아파요(피해)   보라 = 끌려가요·묶여요·순간이동   파랑 = 느려져요·얼음
//   초록 = 독(남는 장판)  금색+흰 테두리 = 안전한 곳·해야 할 일 (guide.js)
//   몬스터 쪽 효과(보호막·치유·강화·부하)는 흐린 흰색/주황이라 위험 색과 헷갈리지 않아요
const GUIDE_COLORS = {
  danger: [255, 50, 40], control: [190, 110, 255], slow: [90, 170, 255], poison: [80, 210, 70],
  safe: [255, 214, 70], monster: [255, 150, 70], ally: [235, 235, 245],
};
const CONTROL_ABILITIES = ["jail", "b2_fearRune"]; // 묶거나 겁먹게 하는 기술 (보라)
function zoneColorKind(kind) {
  if (kind === "web" || kind === "frost" || kind === "ink" || kind === "slow") return "slow";
  if (kind === "lava" || kind === "fire") return "danger";
  return "poison";
}
function telegraphColor(c) {
  const e = c.ab.effect, t = e.type;
  if (["shield", "heal"].includes(t)) return GUIDE_COLORS.ally;
  if (["buffAllies", "enrage", "summon"].includes(t)) return GUIDE_COLORS.monster;
  if (t === "teleport" || t === "pull") return GUIDE_COLORS.control;
  if (t === "zone") return GUIDE_COLORS[zoneColorKind(e.kind)];
  if (t === "slow") return GUIDE_COLORS[CONTROL_ABILITIES.includes(c.id) || (c.ab.tags && c.ab.tags.includes("control")) ? "control" : "slow"];
  return GUIDE_COLORS.danger;
}

function drawTelegraphs() { const r = drawTelegraphsBase(); hookRun("drawTelegraphsAfter"); return r; }
function drawTelegraphsBase() {
  ctx.save();
  // 남아 있는 장판
  for (const z of zones) {
    const k = Math.min(1, z.life / 0.5);
    const web = z.kind === "web";
    const pts = [];
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; const wob = web ? 1 : 1 + 0.05 * Math.sin(a * 5 + game.time * 3); pts.push(toScreen(z.x + Math.cos(a) * z.radius * wob, z.y + Math.sin(a) * z.radius * wob, 0.02)); }
    ctx.beginPath(); pathPoly(pts);
    const [zr, zg, zb] = GUIDE_COLORS[zoneColorKind(z.kind)];
    ctx.fillStyle = `rgba(${zr},${zg},${zb},${(web ? 0.28 : 0.32 + 0.08 * Math.sin(game.time * 4)) * k})`;
    ctx.fill();
    ctx.strokeStyle = web ? `rgba(200,225,255,${0.8 * k})` : `rgba(${Math.min(255, zr + 70)},${Math.min(255, zg + 50)},${Math.min(255, zb + 50)},${0.7 * k})`;
    ctx.lineWidth = 2; ctx.stroke();
    if (web) {
      const c = toScreen(z.x, z.y, 0.02);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const p2 = pts[i * 4 % pts.length]; ctx.moveTo(c.x, c.y); ctx.lineTo(p2.x, p2.y); }
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * k})`; ctx.lineWidth = 1; ctx.stroke();
    } else if (Math.random() < 0.3) {
      addSparkle(z.x + (Math.random() - 0.5) * z.radius, z.y + (Math.random() - 0.5) * z.radius, 0.05, { vz: 0.6, life: 0.6, size: 0.5, hue: { poison: 110, slow: 210, danger: 15 }[zoneColorKind(z.kind)] });
    }
  }
  // 예고 중인 기술
  for (const c of casts) {
    const shape = c.ab.telegraph.shape;
    if (shape === "none") continue;
    const k = Math.min(1, c.t / c.time);
    const [r, g, b] = telegraphColor(c);
    const locked = c.follow && c.t >= c.time * 0.7;
    const soft = c.ab.telegraph.harmlessPreview;
    if (shape === "ring") {
      const outer = [], inner = [];
      for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; outer.push(toScreen(c.x + Math.cos(a) * c.radius, c.y + Math.sin(a) * c.radius, 0.03)); inner.push(toScreen(c.x + Math.cos(a) * c.inner, c.y + Math.sin(a) * c.inner, 0.03)); }
      ctx.beginPath(); pathPoly(outer); pathPoly(inner.reverse());
      ctx.fillStyle = `rgba(${r},${g},${b},${0.14 + 0.3 * k})`; ctx.fill("evenodd");
      ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`; ctx.lineWidth = 2.5; ctx.stroke();
      // 안전한 가운데는 하얀 테두리
      ctx.beginPath(); pathPoly(inner); ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2; ctx.stroke();
      continue;
    }
    const full = shapePoints(c, 1);
    if (full.length < 3) continue;
    ctx.beginPath(); pathPoly(full);
    ctx.fillStyle = `rgba(${r},${g},${b},${soft ? 0.08 : 0.16})`; ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},${soft ? 0.45 : 0.9})`; ctx.lineWidth = locked ? 4 : 2.5; ctx.stroke();
    // 차오르는 진행 표시
    const prog = shapePoints(c, Math.max(0.02, k));
    if (prog.length >= 3) { ctx.beginPath(); pathPoly(prog); ctx.fillStyle = `rgba(${r},${g},${b},${soft ? 0.12 : 0.32})`; ctx.fill(); }
  }
  // 보호막·광폭화 표시 (몬스터 발밑)
  for (const m of monsters) {
    if (m.shieldHp > 0) {
      const pts = []; const R = m.r + 0.35;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + game.time; pts.push(toScreen(m.x + Math.cos(a) * R, m.y + Math.sin(a) * R, 0.05)); }
      ctx.beginPath(); pathPoly(pts);
      ctx.strokeStyle = `rgba(140,220,255,${0.6 + 0.3 * Math.sin(game.time * 6)})`; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = `rgba(140,220,255,${0.15 * (m.shieldHp / (m.shieldMax || 1))})`; ctx.fill();
    }
    if (m.buffT > 0 || m.enraged) {
      const c = toScreen(m.x, m.y, 0.02), e = floorEllipse(m.r + 0.25);
      ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,60,40,${0.2 + 0.1 * Math.sin(game.time * 8)})`; ctx.fill();
    }
  }
  ctx.restore();
}

// ===== 예고 중 자세 (anim.js monsterPose 가 불러요) =====
function castPose(m, pose) {
  const k = Math.min(1, m.castT || 0);
  const wpn = m.def.weapon;
  const up = (v) => V(v.f, v.s, v.z);
  switch (m.castAnim) {
    case "slam":
      pose.rh = up(V(0.1 - 0.05 * k, -0.18, 0.55 + 0.5 * k)); pose.lh = up(V(0.1 - 0.05 * k, 0.18, 0.55 + 0.5 * k));
      pose.lean = -0.1 * k; break;
    case "roar":
      pose.rh = handAt(-1.2, 0.3, 0.6 + 0.2 * k); pose.lh = handAt(1.2, 0.3, 0.6 + 0.2 * k);
      pose.lean = -0.14 * k; pose.headYaw = 0; break;
    case "point":
      pose.rh = handAt(0.2, 0.3 + 0.15 * k, 0.65 + 0.05 * k); pose.lean = 0.04 * k; pose.twist = 0.2 * k; break;
    case "crouch":
      pose.crouch = 0.4 * k; pose.lean = 0.15 * k;
      pose.rh = V(0.2, -0.22, 0.4); pose.lh = V(0.2, 0.22, 0.4); break;
    case "staff":
    case "raise":
    default:
      pose.rh = handAt(0.6, 0.18, 0.7 + 0.4 * k); pose.lh = handAt(-0.6, 0.18, 0.7 + 0.4 * k);
      pose.lean = -0.06 * k; break;
  }
  if (wpn) {
    if (wpn.type === "staff") pose.weapon = { style: "staff", color: wpn.color || "#6b4a2a", len: 0.62, dir: dirAt(0.1, 1.45), butt: 0.42, orb: wpn.orb, power: 0.3 + 0.9 * k };
    else if (wpn.type === "bow") { pose.bow = { draw: 0, aim: dirAt(0, 0.3), color: wpn.color || "#7a5230" }; }
    else pose.weapon = { style: wpn.type === "pick" ? "pick" : "blade", color: wpn.color || "#9aa3ad", len: wpn.length || 0.8, dir: dirAt(0.1, m.castAnim === "slam" || m.castAnim === "raise" ? 1.4 * k + 0.1 : 0.2), butt: 0.3 };
  }
  return pose;
}

// ===== 다른 함수들과 연결 (hooks.js 알림 지점) =====
// 장면 바뀔 때 예고·장판 지우기
hookOn("reset", () => clearAbilities(), 10);
// 보호막 흡수 + 예고 끊기 (맞기 전)
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (m.hp > 0 && m.shieldHp > 0 && h.dmg > 0) {
    const take = Math.min(m.shieldHp, h.dmg);
    m.shieldHp -= take; h.dmg -= take;
    if (m.shieldHp <= 0) { m.shieldHp = 0; spawnBurst(m.x, m.y, ["#bfeaff", "#ffffff"], 14); addFloatText(m.x, m.y, "보호막 깨짐!", "#8fe0ff", 20); }
    if (h.dmg <= 0) { m.flash = 0.06; addFloatText(m.x, m.y, "막힘", "#8fe0ff", 15); return true; }
  }
  if (m.hp > 0 && m.state === "cast") {
    const mine = casts.filter((c) => c.m === m && c.ab.interruptible);
    if (mine.length) {
      const ab = mine[0].ab;
      const need = Math.max(1.5, m.maxHp * (ab.interruptAt || 0.06));
      m.castDmg = (m.castDmg || 0) + h.dmg;
      if (m.castDmg >= need) {
        casts = casts.filter((c) => c.m !== m);
        m.castDmg = 0;
        m.state = "chase"; m.stunTimer = 0.7; m.knockX = 0; m.knockY = 0;
        addFloatText(m.x, m.y, "끊김!", "#ffe27a", 24);
        if (typeof sfx !== "undefined") sfx.block();
      }
    }
  }
  if (m.state !== "cast") m.castDmg = 0;
  return false;
}, 40);
// 기술 탄막 그림
hookOn("drawArrow", (a) => {
  if (!a.bolt) return false;
  const c = toScreen(a.x, a.y, 0.6);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 11 * ZOOM);
  g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.45, a.color); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 11 * ZOOM, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return true;
}, 40);

