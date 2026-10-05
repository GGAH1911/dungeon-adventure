// ===== 월드 5 "공허" 메아리 보스 13명 + 공허 보스 규칙 (설계서 docs/design/world5-void.md 5장) =====
// 메아리 보스 = 예전 보스(BOSS_DEFS[원래 맵])의 모습과 기술을 빌린 회색 그림자예요 (이야기: 공허 조각이 만든 메아리, docs/design/story.md).
//   - 기술: 아레나 소품 없이 돌아가는 것만 빌려요 (W5_ECHO_OK). 단계마다 공허 기술을 더해요.
//   - 모습: 원래 모습 함수를 그대로 부르되 iso.js boxTint 로 회색과 섞어 칠해요. 회색 정도 = 0.25 + 0.65 × 남은 체력 → 때릴수록 색이 돌아와요.
//     색 수정에 비틀하면 잠깐 원래 색, 트로피(m.trophy)는 원래 색이에요.
// 공허 보스 규칙 (모든 공허 보스, 틈새 거인도): 아레나 귀퉁이 색 수정 4개(w5_bcrystal). 때리면 8초 켜짐.
//   보스가 켜진 수정 3.2칸 안에 들어오면 "색이 돌아왔어요!" 비틀 3초 + 3% + 그 수정은 꺼져요 (보스마다 쿨 4초).
// 숨기 (trick "hide"): w5_hide 예고 1초 → 7초(쉬움 6초) 흐릿·무적·공격 안 함. 종(w5_bbell)을 치면 "딩! 찾았다" 비틀 2.5초. 다 되면 w5_popOut 원 예고 뒤 나와요.
// 같이 하기: 상태는 모두 보스·소품 몬스터 칸(w5Hide·hidden·w5ColorT·lit·ring)이라 친구 화면에도 가요. 계산은 방장만 (dungeonTick).
// 이 파일 앞쪽의 w5b* 도우미는 bosses_w5rift.js · voidtower.js 도 써요 (이름 순·index.html 둘 다 이 파일이 먼저).

const W5B = { crystalR: 3.2, crystalSec: 8, stun: 3.0, frac: 0.03, ruleCd: 4, hideT: { easy: 6, normal: 7, hard: 7, nightmare: 7 }, bellStun: 2.5, bellR: 7 };
// ----- 공용 도우미 -----
function w5bDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function w5bStagK() { return ({ easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 })[w5bDiff()] || 1; }
// 지금 계산 중인 공허 보스 (보스방 + 탑 보스 층)
function w5bBoss() { const b = typeof w2BossNow === "function" ? w2BossNow() : null; return b && b.hp > 0 && b.bossDef && b.bossDef.world === 5 ? b : null; }
function w5bProps(type) { return monsters.filter((o) => o.type === type); }
function w5bCalm(b, gap = 1.0) { casts = casts.filter((c) => c.m !== b); b.charge = null; b.state = "chase"; b.queue = []; b.gap = Math.max(b.gap || 0, gap); }
function w5bStun(b, t, frac, text, color = "#ffe27a") {
  w5bCalm(b, 0.5);
  if (frac) damageMonster(b, b.maxHp * frac, b.x, b.y, false, 0, { w5Prop: true });
  b.stagger = Math.max(b.stagger || 0, t * w5bStagK());
  addFloatText(b.x, b.y, text, color, 26);
  game.shake = Math.max(game.shake || 0, 0.4);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
}
function w5bProp(type, x, y, owner, r = 0.45) { const s = spawnProp(type, x, y, owner); s.r = r; s.appearTimer = 0; return s; }

// ----- 아레나 소품: 색 수정·종 (때릴 수 있지만 다치지 않아요) -----
Object.assign(MONSTERS, {
  w5_bcrystal: { name: "색 수정", color: "#ffdf5a", shape: "w5_bcrystal", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 5, codexSkip: true },
  w5_bbell: { name: "메아리 종", color: "#e8d8ff", shape: "w5_bbell", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 5, codexSkip: true },
});
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w5_bcrystal", "w5_bbell");
if (typeof CODEX_SKIP !== "undefined") { CODEX_SKIP.add("w5_bcrystal"); CODEX_SKIP.add("w5_bbell"); }
// 보스 소품 수정·종도 그림자를 들켜요 (w5_common.js w5Revealed)
function w5BossReveal(x, y) {
  for (const o of monsters) {
    if (o.type === "w5_bcrystal" && o.lit > 0 && Math.hypot(o.x - x, o.y - y) < W5B.crystalR) return true;
    if (o.type === "w5_bbell" && o.ring > 0 && Math.hypot(o.x - x, o.y - y) < W5B.bellR) return true;
  }
  return false;
}

// ----- 공허 기술 (기본 효과만 + 숨기) -----
Object.assign(ABILITIES, {
  w5_voidRain: { name: "공허 별비", desc: "회색 별이 여러 군데 떨어져요.", counter: "원들 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.2 }, cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 6, spread: 3.4, stagger: 0.18 } },
  w5_hushRing: { name: "쉿! 고요한 파동", desc: "보스 둘레로 회색 고리가 퍼져요. 보스 바로 곁(가운데)은 안전해요.", counter: "고리 안쪽(보스 곁)으로 들어가요",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 6, inner: 2.2, at: "self", time: 1.3 }, cooldown: 10, range: [0, 6], damageMul: 1.4, anim: "roar",
    effect: { type: "knockback", force: 1.0 } },
  w5_grayWave: { name: "회색 물결", desc: "앞으로 쭉 회색 물결을 보내요. 맞으면 잠깐 느려요.", counter: "빨간 길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 10, width: 1.6, at: "self", time: 1.2 }, cooldown: 7, range: [0, 10], damageMul: 1.5, anim: "point",
    effect: { type: "slow", duration: 1.6 } },
  w5_shadeCall: { name: "그림자 꼬마 부르기", desc: "그림자 꼬마 둘을 불러요. 흐릿한 꼬마는 종이나 색 수정으로 들켜요.", counter: "색 수정·종으로 들키게 하고 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w5_shadeKid", count: 2 } },
  w5_dimFog: { name: "회색 안개", desc: "발밑에 회색 안개가 남아요. 안에 있으면 조금씩 아파요.", counter: "회색 장판 밖에서 싸워요",
    tags: ["boss", "zone"], telegraph: { shape: "circle", radius: 1.7, at: "target", time: 1.0 }, cooldown: 9, range: [0, 10], damageMul: 0.4, anim: "roar",
    effect: { type: "zone", duration: 6, tick: 0.8, kind: "frost" } },
  w5_hide: { name: "스르르 숨기", desc: "회색으로 스르르 숨어요. 숨은 동안은 공격하지 않아요.", counter: "메아리 종을 쳐서 찾아요! (아니면 곧 나와요)",
    tags: ["boss", "self"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 16, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "w5_hide" } },
  w5_popOut: { name: "짠! 나타나기", desc: "숨었던 보스가 짠 하고 튀어나와요.", counter: "흐릿한 보스 둘레 원 밖으로",
    tags: ["boss", "area"], telegraph: { shape: "circle", radius: 2.2, at: "self", time: 1.1 }, cooldown: 99, range: [0, 40], damageMul: 1.5, anim: "slam",
    effect: { type: "knockback", force: 1.2 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w5_voidRain: { text: "원 사이 빈 곳으로" },
  w5_hushRing: { text: "고리 안쪽, 보스 곁으로!", do: true },
  w5_grayWave: { text: "길 옆으로 비켜요" },
  w5_shadeCall: { text: "종·색 수정으로 그림자를 들키게" },
  w5_dimFog: { text: "회색 안개 밖으로" },
  w5_hide: { text: "종을 쳐서 찾아요!", do: true, voice: true },
  w5_popOut: { text: "흐릿한 보스 둘레 원 밖으로" },
});
if (typeof BEHAVIOR_DOCS !== "undefined") BEHAVIOR_DOCS.w5_echoAI = { name: "메아리 보스", desc: "예전 보스의 메아리. 정해진 순서로 기술을 쓰고, 가끔 스르르 숨어요.", counter: "색 수정 빛으로 데려오면 비틀! 숨으면 메아리 종을 쳐요" };

// ----- 빌릴 수 있는 기술 -----
const W5_ECHO_OK = new Set(["damage", "knockback", "pull", "slow", "burn", "summon", "shield", "heal", "zone", "charge", "volley", "nova", "teleport", "buffAllies", "rain", "enrage", "jumpLand", "lineVolley"]);
function w5EchoAbOk(id) { const ab = ABILITIES[id]; return !!(ab && ab.effect && W5_ECHO_OK.has(ab.effect.type) && ab.telegraph); }

// ----- 메아리 보스 목록 -----
//   src: 빌려 오는 예전 보스 맵 · trick: 이 보스의 새 아이디어 · arena: 아레나 환경 (구멍·다리·웅덩이) · void: [2단계, 3단계] 공허 기술
const W5_ECHO_LIST = [
  { mapId: "graybloom", src: "cave", name: "메아리 뭉게뭉게", title: "회색 꽃 섬의 그림자", hp: 290, void: ["w5_voidRain", "w5_dimFog"],
    origin: "동굴 버섯을 돌보던 정원사 버섯", material: { id: "w5_grayCap", name: "회색 버섯 갓", color: "#c8b8e8" },
    legend: { id: "L_w5Bloom", slot: "charm", name: "다시 핀 꽃 목걸이", icon: "amulet", color: "#ffb0d8", perk: { regen: 10, hearts: 2 }, desc: "색이 돌아온 꽃: 하트가 천천히 차요 (하트 +2)" },
    theme: { floor: "#8a8a96", moss: "#c8b8e8", wall: "#4e4e5c", darkness: 0.4, bg: "#0a0a12" } },
  { mapId: "mistshore", src: "kelp", name: "메아리 반짝이", title: "안개 바닷가의 그림자", hp: 296, void: ["w5_grayWave", "w5_voidRain"], arena: { holes: 1 },
    origin: "바닷가 진주를 지키던 큰 조개", material: { id: "w5_mistPearl", name: "안개 진주", color: "#e0e8ee", enchant: "slow" },
    legend: { id: "L_w5Mist", slot: "weapon", name: "안개 진주 창", effect: "slow", mul: 1.06, color: "#d8e8f0", forms: { w: "안개 진주 창", m: "안개 진주 지팡이", d: "안개 진주 지팡이", h: "안개 진주 단검" }, desc: "맞은 몬스터가 안개에 느려져요 (공격력 +6%)" },
    theme: { floor: "#8a929a", moss: "#a8d0d8", wall: "#4a525c", darkness: 0.42, bg: "#08101a" } },
  { mapId: "hushcrater", src: "meteorhill", name: "메아리 쿵쾅이", title: "쉿 분화구의 그림자", hp: 302, void: ["w5_hushRing", "w5_voidRain"], arena: { holes: 2, blink: true },
    origin: "별똥별을 받아 주던 돌 골렘", material: { id: "w5_hushStone", name: "쉿 돌", color: "#9090a0" },
    legend: { id: "L_w5Hush", slot: "charm", name: "쉿 돌 팔찌", icon: "bracelet", color: "#b8b0d0", perk: { block: 0.12, hearts: 2 }, desc: "조용히 막아요: 막기 +12%, 하트 +2" },
    theme: { floor: "#9090a0", moss: "#d0c8b0", wall: "#525060", darkness: 0.38, bg: "#0c0a10" } },
  { mapId: "echowood", src: "jungle", name: "메아리 말랑대왕", title: "메아리 숲의 그림자", hp: 308, void: ["w5_shadeCall", "w5_voidRain"], trick: "hide",
    origin: "정글 슬라임들의 다정한 임금님", material: { id: "w5_echoJelly", name: "메아리 젤리", color: "#a8c8a0", enchant: "emerald" },
    legend: { id: "L_w5Echo", slot: "weapon", name: "메아리 젤리 망치", effect: "heal", mul: 1.06, color: "#b8e0b0", forms: { w: "메아리 젤리 망치", m: "메아리 젤리 지팡이", d: "메아리 젤리 지팡이", h: "메아리 젤리 단검" }, desc: "때리면 하트가 조금 차요 (공격력 +6%)" },
    theme: { floor: "#7e8a80", moss: "#b8d8b0", wall: "#465248", darkness: 0.48, bg: "#060c08" } },
  { mapId: "stonegarden", src: "ruins", name: "메아리 묵묵이", title: "조용한 돌 정원의 그림자", hp: 314, void: ["w5_hushRing", "w5_grayWave"], arena: { puddles: 2 },
    origin: "옛 유적의 성실한 돌 문지기", material: { id: "w5_quietRune", name: "고요 글자돌", color: "#c8c0a8" },
    legend: { id: "L_w5Stone", slot: "charm", name: "돌 정원 반지", icon: "ring", color: "#d8d0b8", perk: { hearts: 3 }, desc: "돌처럼 튼튼: 하트 +3" },
    theme: { floor: "#9a968c", moss: "#c8c0a8", wall: "#5a564c", darkness: 0.4, bg: "#0c0c0a" } },
  { mapId: "moonless", src: "darkside", name: "메아리 아우", title: "달 없는 들판의 그림자", hp: 320, void: ["w5_shadeCall", "w5_dimFog"], trick: "hide",
    origin: "달의 뒷면을 지키던 늑대", material: { id: "w5_noMoonFur", name: "달 없는 털", color: "#9a9ac8", enchant: "chain" },
    legend: { id: "L_w5Moonless", slot: "weapon", name: "그믐 이빨 검", effect: "chain", mul: 1.06, color: "#a8a8e0", forms: { w: "그믐 이빨 검", m: "그믐 이빨 지팡이", d: "그믐 이빨 지팡이", h: "그믐 이빨 단검" }, desc: "번개가 옆 몬스터로 튀어요 (공격력 +6%)" },
    theme: { floor: "#6a6a7e", moss: "#9a9ac8", wall: "#3a3a4e", darkness: 0.6, bg: "#04040a" } },
  { mapId: "sandglass", src: "desert", name: "메아리 투탕카뭉", title: "모래시계 언덕의 그림자", hp: 326, void: ["w5_voidRain", "w5_grayWave"], arena: { holes: 2, blink: true },
    origin: "사막 신전의 보물을 지키던 꼬마 파라오", material: { id: "w5_timeSand", name: "멈춘 모래", color: "#d8c898", enchant: "emerald" },
    legend: { id: "L_w5Sand", slot: "charm", name: "모래시계 펜던트", icon: "amulet", color: "#e8d8a0", perk: { luck: 0.3, speed: 0.06 }, desc: "행운과 빠르기가 올라요" },
    theme: { floor: "#a49a88", moss: "#d8c898", wall: "#5e5648", darkness: 0.38, bg: "#0e0c08" } },
  { mapId: "driftship", src: "ufowreck", name: "메아리 뾰롱", title: "떠도는 별배의 그림자", hp: 332, void: ["w5_shadeCall", "w5_hushRing"], trick: "hide", arena: { puddles: 2 },
    origin: "길 잃은 우주선의 꼬마 선장", material: { id: "w5_driftStar", name: "떠도는 별 조각", color: "#a8b8e8", enchant: "slow" },
    legend: { id: "L_w5Drift", slot: "weapon", name: "별배 노 지팡이", effect: "slow", mul: 1.06, color: "#b8c8f0", forms: { w: "별배 노", m: "별배 노 지팡이", d: "별배 노 지팡이", h: "별배 단검" }, desc: "맞은 몬스터가 느려져요 (공격력 +6%)" },
    theme: { floor: "#848aa0", moss: "#a8b8e8", wall: "#46485e", darkness: 0.46, bg: "#060812" } },
  { mapId: "ashforge", src: "forge", name: "메아리 땅땅이", title: "잿빛 대장간의 그림자", hp: 338, void: ["w5_grayWave", "w5_dimFog"], arena: { holes: 2, blink: true },
    origin: "땅속 대장간의 대장장이 거인", material: { id: "w5_ashIngot", name: "잿빛 쇳덩이", color: "#c8a890", enchant: "chain" },
    legend: { id: "L_w5Ash", slot: "charm", name: "잿빛 망치 배지", icon: "clover", color: "#d8b8a0", perk: { dmg: 0.1, hearts: 1 }, desc: "공격력 +10%, 하트 +1" },
    theme: { floor: "#8a8482", moss: "#c8a890", wall: "#4e4644", darkness: 0.42, bg: "#0e0a08" } },
  { mapId: "frostdream", src: "ice", name: "메아리 눈송이", title: "꽁꽁 꿈 호수의 그림자", hp: 344, void: ["w5_voidRain", "w5_shadeCall"], trick: "hide", arena: { puddles: 2 },
    origin: "얼음 성채의 다정한 눈송이 여왕", material: { id: "w5_dreamFrost", name: "꿈 서리", color: "#c8e0f0", enchant: "slow" },
    legend: { id: "L_w5Frost", slot: "weapon", name: "꿈 서리 지팡이", effect: "slow", mul: 1.07, color: "#d8f0ff", forms: { w: "꿈 서리 검", m: "꿈 서리 지팡이", d: "꿈 서리 지팡이", h: "꿈 서리 단검" }, desc: "맞은 몬스터가 꽁꽁 느려져요 (공격력 +7%)" },
    theme: { floor: "#9aa4b0", moss: "#c8e0f0", wall: "#56606c", darkness: 0.4, bg: "#060a10" } },
  { mapId: "emberwing", src: "volcano", name: "메아리 화염 용", title: "잿불 하늘길의 그림자", hp: 352, void: ["w5_hushRing", "w5_voidRain"], trick: "hide", arena: { holes: 1, blink: true },
    origin: "용암 요새를 지키던 불의 용", material: { id: "w5_emberScale", name: "잿불 비늘", color: "#e0b0a0" },
    legend: { id: "L_w5Ember", slot: "weapon", name: "잿불 날개 활검", effect: "burn", mul: 1.07, color: "#f0c0a0", forms: { w: "잿불 날개 검", m: "잿불 날개 지팡이", d: "잿불 날개 지팡이", h: "잿불 날개 단검" }, desc: "맞은 몬스터에 불이 붙어요 (공격력 +7%)" },
    theme: { floor: "#968a8a", moss: "#e0b0a0", wall: "#544a4a", darkness: 0.44, bg: "#100808" } },
  { mapId: "forgotkeep", src: "castle", name: "메아리 해골 왕", title: "잊힌 성의 그림자", hp: 360, void: ["w5_shadeCall", "w5_hushRing"], trick: "hide", arena: { holes: 2, blink: true },
    origin: "어둠의 성에서 뼈 기사들을 아끼던 해골 임금님", material: { id: "w5_forgotBone", name: "잊힌 왕관 뼈", color: "#d8d0e8", enchant: "chain" },
    legend: { id: "L_w5Keep", slot: "charm", name: "잊힌 성 열쇠", icon: "amulet", color: "#d8d0e8", perk: { hearts: 2, block: 0.1, luck: 0.1 }, desc: "기억을 여는 열쇠: 하트 +2, 막기·행운이 올라요" },
    theme: { floor: "#8a8496", moss: "#b8b0d8", wall: "#4a4458", darkness: 0.48, bg: "#08060e" } },
  { mapId: "dreamdeep", src: "coral", name: "메아리 크라켄", title: "깊은 꿈 바다의 그림자", hp: 368, void: ["w5_grayWave", "w5_voidRain"], arena: { puddles: 2 },
    origin: "산호 동굴의 장난꾸러기 문어 대왕", material: { id: "w5_dreamInk", name: "꿈 먹물", color: "#a0c0e8", enchant: "slow" },
    legend: { id: "L_w5Deep", slot: "weapon", name: "꿈 바다 삼지창", effect: "slow", mul: 1.07, color: "#a8c8f0", forms: { w: "꿈 바다 삼지창", m: "꿈 바다 지팡이", d: "꿈 바다 지팡이", h: "꿈 바다 단검" }, desc: "맞은 적이 꿈결처럼 느려져요" },
    theme: { floor: "#7a8496", moss: "#a0c0e8", wall: "#404a5c", darkness: 0.5, bg: "#04080e" } },
];

// 원래 보스의 단계 기술 (빌릴 수 있는 것만)
function w5EchoSrcPhase(src, i) {
  const S = BOSS_DEFS[src], ph = S && S.phases && (S.phases[i] || S.phases[S.phases.length - 1]);
  const list = ph ? (ph.pattern || ph.abilities || []) : [];
  return list.filter(w5EchoAbOk);
}
function w5EchoPhases(E) {
  const p1 = w5EchoSrcPhase(E.src, 0), p2 = w5EchoSrcPhase(E.src, 1), p3 = w5EchoSrcPhase(E.src, 2);
  const base = p1.length ? p1 : ["bossSlam"].filter((a) => ABILITIES[a]);
  const hide = E.trick === "hide" ? ["w5_hide"] : [];
  const pat = [
    { until: 0.66, gap: 1.8, pattern: base.slice(0, 4) },
    { until: 0.33, gap: 1.6, pattern: [...hide, ...(p2.length ? p2 : base).slice(0, 4), E.void[0]] },
    { until: 0, gap: 1.4, pattern: [...hide, ...(p3.length ? p3 : p2.length ? p2 : base).slice(0, 4), E.void[0], E.void[1]] },
  ];
  return pat.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
}
// 아레나: 기둥 대신 환경 (구멍 띠 + 다리, 그림자 웅덩이). 색 수정·종은 소품이라 dungeonTick 에서 놓아요
function w5EchoBuild(E) {
  return (w) => {
    const A = E.arena || {}, c = w.W / 2;
    if (A.holes) {
      const vertical = A.holes >= 1, bw = 2;
      // 가운데에서 5칸 떨어진 띠 (아레나 가운데·시작 자리는 비워요)
      const strips = A.holes >= 2 ? [-6.5, 5] : [5];
      for (const off of strips) {
        const x0 = c + off, rect = vertical ? { x0, y0: c - 9, x1: x0 + 1.5, y1: c + 9 } : { x0: c - 9, y0: x0, x1: c + 9, y1: x0 + 1.5 };
        const br = vertical
          ? [{ x0: rect.x0, y0: c - 6, x1: rect.x1, y1: c - 6 + bw, kind: "stone" }, { x0: rect.x0, y0: c + 3, x1: rect.x1, y1: c + 3 + bw, kind: A.blink ? "blink" : "stone", ph: off }]
          : [{ x0: c - 6, y0: rect.y0, x1: c - 6 + bw, y1: rect.y1, kind: "stone" }, { x0: c + 3, y0: rect.y0, x1: c + 3 + bw, y1: rect.y1, kind: A.blink ? "blink" : "stone", ph: off }];
        w5AddHole(w, rect, br);
      }
    }
    for (let i = 0; i < (A.puddles || 0); i++) w5AddPuddle(w, c + (i ? 6 : -6), c + (i ? -5 : 6));
  };
}
const W5_ECHO_BY_MAP = {};
for (const E of W5_ECHO_LIST) {
  const type = "w5_echo_" + E.mapId;
  W5_ECHO_BY_MAP[E.mapId] = E;
  const S = BOSS_DEFS[E.src], srcMon = S && MONSTERS[S.id];
  const size = (S && S.size) || 2.6;
  MONSTERS[type] = { name: E.name, shape: "w5e_" + E.mapId, behavior: "w5_echoAI", color: (srcMon && srcMon.color) || "#8a86a0", hp: E.hp, speed: (srcMon && srcMon.speed) || 1.2, damage: 2.6,
    xp: 80, emerald: 1, emeraldCount: 18, heavy: true, isBoss: true, size, world: 5 };
  if (E.material) MATERIALS[E.material.id] = { name: E.material.name, color: E.material.color, ...(E.material.enchant ? { enchant: E.material.enchant } : {}) };
  BOSS_DEFS[E.mapId] = {
    id: type, name: E.name, title: E.title, size, world: 5, material: E.material,
    arena: { size: 26, theme: E.theme, build: w5EchoBuild(E) },
    phases: w5EchoPhases(E),
    create(x, y, level) {
      const m = createMonster(type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[E.mapId];
      m.name = `${E.title} ${E.name}`;
      m.r = (S && S.size ? Math.min(1.3, 0.45 + S.size * 0.25) : 1.1); m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = []; m.w5Echo = E.mapId;
      m.onPhase = (idx) => w5EchoPhaseMsg(m, E, idx);
      return m;
    },
  };
  // 모습: 원래 보스 모습을 회색으로 (원래 모양 함수를 원래 몬스터 정의로 불러요)
  if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES["w5e_" + E.mapId] = (m) => w5DrawEcho(m, E);
  // 전설
  if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined" && E.legend) {
    const L = E.legend;
    if (L.slot === "weapon" && typeof LEGEND_FORMS === "function") defBase(L.id, { slot: "weapon", legend: E.mapId, name: L.name, minL: 0, color: L.color, mul: L.mul, effect: L.effect, forms: LEGEND_FORMS(L.forms, "staff"), desc: L.desc });
    else if (L.slot !== "weapon") defBase(L.id, { slot: L.slot, legend: E.mapId, name: L.name, minL: 0, icon: L.icon, color: L.color, perk: L.perk, desc: L.desc });
    if (typeof ITEM_BASES === "undefined" || ITEM_BASES[L.id]) BOSS_LEGENDS[E.mapId] = L.id;
  }
}
// 늦게 불린 원래 보스 기술이 있을 수 있어서 (index.html 순서) 한 번 더 단계를 만들어요
function w5EchoRefreshPhases() { for (const E of W5_ECHO_LIST) if (BOSS_DEFS[E.mapId]) BOSS_DEFS[E.mapId].phases = w5EchoPhases(E); }
hookOn("dungeonStarted", () => w5EchoRefreshPhases(), 10);

function w5EchoPhaseMsg(m, E, idx) {
  if (idx === 1) showMessage(E.trick === "hide" ? "메아리가 스르르 숨기 시작해요! 숨으면 종을 쳐요" : "색 수정을 켜고 보스를 그 빛으로 데려와요!", 3, false, "#d8c8ff");
  if (idx === 2) showMessage("메아리에 색이 돌아오고 있어요! 조금만 더!", 3, false, "#ffe27a");
}
// 회색 정도: 남은 체력만큼 회색 (색 수정에 비틀하는 동안·트로피는 원래 색)
function w5EchoGrayK(m) {
  if (m.trophy || (m.w5ColorT || 0) > 0) return 0;
  const f = m.maxHp ? Math.max(0, Math.min(1, m.hp / m.maxHp)) : 1;
  return 0.25 + 0.65 * f;
}
function w5DrawEcho(m, E) {
  const S = BOSS_DEFS[E.src], srcDef = S && MONSTERS[S.id];
  if (!srcDef) { drawBox(m.x - 0.5, m.y - 0.5, 0, 1, 1, 1.4, "#8a86a0"); return; }
  const proxy = Object.create(m);
  proxy.def = srcDef; proxy.type = S.id; proxy.hidden = false;
  w5DrawGray(w5EchoGrayK(m), () => drawMonsterBase(proxy));
}
// 숨은 메아리: 흐릿하게 (완전히 안 보이지 않아요: 공정성 규칙 3)
hookOn("monsterAlpha", (a, m) => (m && m.w5Hide > 0 ? Math.min(a, 0.22) : a), 50);

// ----- 행동: bossAI + 숨기 -----
if (typeof EXTRA_BEHAVIORS !== "undefined") EXTRA_BEHAVIORS.w5_echoAI = (m, p, dist, dt) => {
  if (m.w5Hide > 0) {
    m.hidden = true; m.moving = false;
    if (m.state === "cast") return;
    m.w5Hide -= dt;
    if (p && dist > 2.5) { const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1; moveEntity(m, dx / d * 1.1 * dt, dy / d * 1.1 * dt); m.moving = true; m.faceX = dx / d; m.faceY = dy / d; }
    if (Math.random() < dt * 6) addSparkle(m.x + (Math.random() - 0.5), m.y + (Math.random() - 0.5), 0.3, { vz: 0.6, gravity: -0.1, life: 0.6, size: 0.4, hue: 270 });
    if (m.w5Hide <= 0) { m.w5Hide = 0; m.hidden = false; addFloatText(m.x, m.y, "짠!", "#e8d8ff", 22); castAbility(m, "w5_popOut", p || m); }
    return;
  }
  if (EXTRA_BEHAVIORS.bossAI) EXTRA_BEHAVIORS.bossAI(m, p, dist, dt);
};
hookOn("resolveCast", (c) => {
  if (!c || !c.ab || !c.ab.effect || c.ab.effect.type !== "w5_hide") return false;
  if (c._w5Done) return true;
  c._w5Done = true;
  const m = c.m; if (!m || m.hp <= 0) return true;
  m.w5Hide = W5B.hideT[w5bDiff()] || 7; m.hidden = true; m.queue = [];
  addFloatText(m.x, m.y, "스르르… 숨었어요! 종을 쳐요", "#d8c8ff", 20);
  spawnBurst(m.x, m.y, ["#4a4060", "#b8a8d8"], 14);
  return true;
}, 15);
// 소품 맞기: 수정은 켜지고, 종은 울려요 (안 아파요)
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m) return false;
  if (m.type === "w5_bcrystal") {
    if (h.opts.dot || game.time - (m.w5HitT || -9) < 0.3) return true;
    m.w5HitT = game.time;
    if (!(m.lit > 0)) { addFloatText(m.x, m.y, "반짝! 색이 돌아와요", "#ffe27a", 18); addRing(m.x, m.y, { speed: 3, life: 0.4, hue: 50 }); if (typeof sfx !== "undefined" && sfx.sparkle) sfx.sparkle(); }
    m.lit = W5B.crystalSec;
    return true;
  }
  if (m.type === "w5_bbell") {
    if (h.opts.dot || game.time - (m.w5HitT || -9) < 0.3) return true;
    m.w5HitT = game.time; m.ring = 8;
    addFloatText(m.x, m.y, "딩~", "#e8d8ff", 22); addRing(m.x, m.y, { speed: 6, life: 0.8, hue: 270 });
    if (typeof tone === "function") { tone(880, 0.5, "sine", 0.06); tone(1320, 0.6, "sine", 0.04, null, 0.15); }
    const b = w5bBoss();
    if (b && b.w5Hide > 0) { b.w5Hide = 0; b.hidden = false; w5bStun(b, W5B.bellStun, 0, "딩! 찾았다!", "#e8d8ff"); }
    return true;
  }
  return false;
}, 4);

// ----- 방장: 소품 놓기 + 공허 보스 규칙 -----
function w5bArenaProps(b) {
  const c = world.W / 2, d = Math.max(4, world.W / 2 - 4);
  for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const s = w5bProp("w5_bcrystal", c + ox * d * 0.78, c + oy * d * 0.78, b, 0.42);
    s.lit = 0;
  }
  if (b.w5Bells) for (const [ox, oy] of [[0, -1], [0, 1]]) { const s = w5bProp("w5_bbell", c + ox * d * 0.8, c + oy * d * 0.8, b, 0.45); s.ring = 0; }
}
hookOn("dungeonTick", (dt) => {
  for (const o of monsters) {
    if (o.type === "w5_bcrystal" && o.lit > 0) o.lit = Math.max(0, o.lit - dt);
    if (o.type === "w5_bbell" && o.ring > 0) o.ring = Math.max(0, o.ring - dt);
  }
  const b = w5bBoss(); if (!b) return;
  if (!b.w5Init) {
    b.w5Init = true;
    const E = W5_ECHO_BY_MAP[b.w5Echo];
    b.w5Bells = !!((E && E.trick === "hide") || b.w5WantBells);
    w5bArenaProps(b);
  }
  if (b.w5ColorT > 0) b.w5ColorT = Math.max(0, b.w5ColorT - dt);
  b.w5RuleCd = Math.max(0, (b.w5RuleCd || 0) - dt);
  if (b.w5Hide > 0 || b.w5RuleCd > 0 || b.invuln > 0) return;
  const k = w5bProps("w5_bcrystal").find((o) => o.lit > 0 && Math.hypot(o.x - b.x, o.y - b.y) < W5B.crystalR + (b.r || 1) * 0.5);
  if (!k) return;
  k.lit = 0; b.w5RuleCd = W5B.ruleCd; b.w5ColorT = 3;
  w5bStun(b, W5B.stun, W5B.frac, "색이 돌아왔어요!", "#ffe27a");
  for (let i = 0; i < 14; i++) addSparkle(b.x, b.y, 1.2, { vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, vz: 2, gravity: 3, life: 0.8, size: 0.6, hue: Math.random() * 360 });
  hookRun("w5ColorStun", b);
}, 41);
hookOn("lights", (lights) => {
  for (const o of monsters) {
    if (o.type === "w5_bcrystal") lights.push({ x: o.x, y: o.y, radius: o.lit > 0 ? W5B.crystalR : 1.0, power: o.lit > 0 ? 0.85 : 0.3 });
    if (o.type === "w5_bbell" && o.ring > 0) lights.push({ x: o.x, y: o.y, radius: 2.4, power: 0.5 });
  }
}, 50);
// 켜진 수정 둘레 금색 원 (보스를 여기로 데려와요) + 숨은 보스 자리 점선
hookOn("drawMonsterUnder", (m) => {
  if (m.type === "w5_bcrystal" && m.lit > 0 && typeof w5Circle === "function") w5Circle(m.x, m.y, W5B.crystalR, "rgba(255,226,122,0.1)", "rgba(255,226,122,0.75)", 2.5, true);
  if (m.w5Hide > 0 && typeof w5Circle === "function") w5Circle(m.x, m.y, (m.r || 1) * 1.1, null, "rgba(216,200,255,0.6)", 2, true);
}, 50);
// 이기면: 색이 돌아왔어요
hookOn("monsterKilled", (m) => {
  if (!m || !m.w5Echo) return;
  const E = W5_ECHO_BY_MAP[m.w5Echo];
  if (E) { const was = josa(E.origin, "이었/였"); showMessage(`${E.name}에게 색이 돌아왔어요! 원래는 ${was}대요`, 4, true); }
});
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  w5_bcrystal(m) {
    const on = m.lit > 0, cols = ["#ffdf5a", "#ff9ad6", "#9fe8ff", "#c8ff7a"], col = on ? cols[Math.abs(Math.round(m.x * 3 + m.y)) % 4] : "#7a7888";
    drawBox(m.x - 0.32, m.y - 0.32, 0, 0.64, 0.64, 0.14, "#5a5868");
    drawBox(m.x - 0.12, m.y - 0.12, 0.14, 0.24, 0.24, 1.1, col);
    drawBox(m.x + 0.08, m.y - 0.22, 0.14, 0.2, 0.2, 0.7, col);
    drawBox(m.x - 0.26, m.y + 0.06, 0.14, 0.18, 0.18, 0.62, col);
    if (on && Math.random() < 0.2) addSparkle(m.x, m.y, 0.6 + Math.random() * 0.6, { vz: 0.6, life: 0.5, size: 0.45, hue: Math.random() * 360 });
  },
  w5_bbell(m) {
    const sw = m.ring > 0 ? Math.sin(game.time * 14) * 0.06 : 0;
    drawBox(m.x - 0.36, m.y - 0.06, 0, 0.08, 0.12, 1.4, "#6a5a4a"); drawBox(m.x + 0.28, m.y - 0.06, 0, 0.08, 0.12, 1.4, "#6a5a4a");
    drawBox(m.x - 0.4, m.y - 0.1, 1.4, 0.8, 0.2, 0.1, "#7a6a5a");
    drawBox(m.x - 0.22 + sw, m.y - 0.22, 0.8, 0.44, 0.44, 0.55, m.ring > 0 ? "#e8d8ff" : "#a8a0c0");
    drawBox(m.x - 0.27 + sw, m.y - 0.27, 0.75, 0.54, 0.54, 0.08, m.ring > 0 ? "#fff6d8" : "#8a84a0");
  },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") for (const E of W5_ECHO_LIST) GUIDE_PHASE_VOICE[E.mapId] = { 0: "색 수정을 켜고 보스를 그 빛으로 데려와요", 1: E.trick === "hide" ? "숨으면 메아리 종을 쳐요!" : "켜진 수정 곁에서 싸워요!", 2: "색이 돌아오고 있어요! 조금만 더!" };
