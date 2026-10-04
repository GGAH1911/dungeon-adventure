// ===== 장비 바탕: 무기 종류, 활 종류, 화살, 물약 =====
// 장비 하나하나(이름·등급·강화)와 떨어뜨리기는 loot.js, 화폐는 currency.js 예요.
// TIERS 는 갑옷 색깔 묶음으로 써요.

const GEAR_MAX = 30;

// 단계 (5레벨마다). mat = 이 단계로 강화할 때 쓰는 부품
const TIERS = [
  { name: "나무", armorName: "가죽", mat: "scrap", color: "#a0784a",
    armor: { body: "#8b5a2b", legs: "#6e4521", helmet: "#7a4e25", boots: "#5a3a1a", gloves: "#7a4e25" } },
  { name: "철", armorName: "철", mat: "iron", color: "#e3e8ee",
    armor: { body: "#c9ced6", legs: "#a9aeb6", helmet: "#d5dae1", boots: "#7c828a", gloves: "#b9bec6" } },
  { name: "다이아", armorName: "다이아", mat: "diamond", color: "#5ff0e6",
    armor: { body: "#4fe0d6", legs: "#3bbdb4", helmet: "#62ebe2", boots: "#2f9f98", gloves: "#55d8cf" } },
  { name: "흑요석", armorName: "흑요석", mat: "obsidian", color: "#8a6ac0",
    armor: { body: "#4a3f55", legs: "#3a3145", helmet: "#5b4e68", boots: "#2a2333", gloves: "#55486a" } },
  { name: "용비늘", armorName: "용비늘", mat: "dragon", color: "#e04a3a",
    armor: { body: "#b8322e", legs: "#8e2622", helmet: "#d24a3a", boots: "#6e1c1a", gloves: "#c23a32" } },
  { name: "별빛", armorName: "별빛", mat: "star", color: "#ffd84a", shimmer: true,
    armor: { body: "#ffe9a8", legs: "#e8c860", helmet: "#fff2c0", boots: "#c9a440", gloves: "#ffe48a" } },
];
function tierIndex(L) { return Math.min(TIERS.length - 1, Math.floor(L / 5)); }

// 부품 (보스 부품은 보스 파일에서 더해요: enchant 를 가지면 마법 부여가 열려요)
const MATERIALS = {
  scrap: { name: "낡은 조각", color: "#b09a78" },
  iron: { name: "철 조각", color: "#d5dae1" },
  diamond: { name: "다이아 조각", color: "#5ff0e6" },
  obsidian: { name: "흑요석 조각", color: "#8a6ac0" },
  dragon: { name: "용비늘", color: "#e04a3a" },
  star: { name: "별가루", color: "#ffd84a" },
};
const MATERIAL_ORDER = ["scrap", "iron", "diamond", "obsidian", "dragon", "star"];

// 무기에 붙이는 마법 (보스 부품으로 열어요)
const ENCHANTS = {
  burn: { name: "불꽃", desc: "맞은 몬스터에 불이 붙어요", color: "#ff8a2a" },
  slow: { name: "서리", desc: "맞은 몬스터가 느려져요", color: "#8fe0ff" },
  chain: { name: "번개", desc: "옆 몬스터에게 번개가 튀어요", color: "#ffe94d" },
  heal: { name: "영혼 흡수", desc: "쓰러뜨리면 하트가 조금 차요", color: "#c08aff" },
  emerald: { name: "행운", desc: "에메랄드가 더 잘 나와요", color: "#29d67a" },
};

// 장비 부위
const GEAR_SLOTS = [
  { id: "weapon", name: "무기", stat: "공격력" },
  { id: "bow", name: "활", stat: "화살 공격력" },
  { id: "head", name: "머리", stat: "4레벨마다 하트 +1" },
  { id: "chest", name: "가슴", stat: "공격 막기 확률" },
  { id: "legs", name: "바지", stat: "6레벨마다 하트 +1, 덜 밀려나요" },
  { id: "arms", name: "팔", stat: "공격력 +1.5%, 공격 속도" },
  { id: "boots", name: "신발", stat: "이동 속도, 구르기 자주" },
];
const ARMOR_SLOTS = ["head", "chest", "legs", "arms", "boots"];

// ----- 무기 종류 (연속기 동작이 달라요). price: 가게에서 여는 값 -----
//   mul 공격력 배수, range 거리, cooldown 다시 휘두르기(초), arc 넓이, length 길이
const WEAPON_TYPES = {
  sword: { name: "칼", price: 0, mul: 1, range: 1.55, cooldown: 0.32, arc: 1.25, length: 0.85 },
  dagger: { name: "쌍단검", price: 12, mul: 0.62, range: 1.25, cooldown: 0.2, arc: 0.9, length: 0.45 },
  spear: { name: "창", price: 16, mul: 1.1, range: 2.2, cooldown: 0.36, arc: 0.45, length: 1.3 },
  axe: { name: "도끼", price: 20, mul: 1.9, range: 1.7, cooldown: 0.7, arc: 1.6, length: 0.85 },
  hammer: { name: "망치", price: 28, mul: 2.4, range: 1.6, cooldown: 0.85, arc: 1.2, length: 0.9 },
  scythe: { name: "낫", price: 34, mul: 1.25, range: 2.0, cooldown: 0.42, arc: 1.9, length: 1.15 },
};
const WEAPON_TYPE_ORDER = ["sword", "dagger", "spear", "axe", "hammer", "scythe"];

// ----- 활 종류 -----
const BOW_TYPES = {
  basic: { name: "활", price: 0, mul: 1, cooldown: 0.5, speed: 13 },
  rapid: { name: "연발 활", price: 14, mul: 0.78, cooldown: 0.22, speed: 14 },
  long: { name: "긴 활", price: 16, mul: 1.6, cooldown: 0.55, speed: 16, pierce: 1 },
  triple: { name: "세 갈래 활", price: 26, mul: 1.3, cooldown: 0.6, speed: 14, multishot: 3 },
  crossbow: { name: "석궁", price: 34, mul: 2.9, cooldown: 0.8, speed: 19, pierce: 2 },
  storm: { name: "폭풍 활", price: 48, mul: 1.7, cooldown: 0.65, speed: 17, multishot: 5, pierce: 1 },
};
const BOW_TYPE_ORDER = ["basic", "rapid", "long", "triple", "crossbow", "storm"];

// ----- 화살 종류 -----
const ARROW_TYPES = [
  { id: "normal", name: "보통 화살", pack: 10, price: 3, color: "#dfe6ee", desc: "기본 화살" },
  { id: "fire", name: "불화살", pack: 5, price: 5, color: "#ff8a2a", desc: "맞으면 불이 붙어요" },
  { id: "ice", name: "얼음 화살", pack: 5, price: 5, color: "#8fe0ff", desc: "맞으면 느려져요" },
  { id: "bomb", name: "폭탄 화살", pack: 3, price: 7, color: "#ff4a4a", desc: "맞으면 펑! 주변도 아파요" },
];

const POTION = { id: "potion", name: "체력 물약", price: 4, heal: 4 };

// ----- 예전 치트 전용 전설 장비 (치트는 없앴어요: 저장에 남은 pr.legend 는 읽을 때 꺼요, save.js) -----
const LEGEND = {
  weapon: { id: "legend", name: "무지개 별빛 대검", type: "sword", legendary: true, range: 2.6, cooldown: 0.24, arc: 2.2, length: 1.35, color: "#ffffff", chain: 5, chainRange: 6 },
  bow: { id: "legend", name: "무지개 별똥별 활", legendary: true, cooldown: 0.22, speed: 24, multishot: 5, pierce: 99, infinite: true, color: "#ffffff" },
  armor: { id: "legend", name: "태양의 황금 갑옷", legendary: true, block: 1, regen: 2, speed: 0.1, body: "#ffcf33", legs: "#f0b400", helmet: "#ffe066", boots: "#c99a20", gloves: "#ffd84a" },
};

// ===== 계산 =====
// 장비 레벨 L 의 기본 공격력 (장비 하나하나는 loot.js: 등급·강화가 곱해져요)
function weaponBaseDamage(L) { return 1 + 0.2 * L; }
function bowBaseDamage(L) { return 1.5 + 0.22 * L; }
function chestBlock(L) { return 0.65 * (1 - Math.exp(-L / 12)); }
// 예전 코드용: 칸의 장비 레벨 (갑옷 부위는 갑옷 하나로)
function gearLevel(slot) {
  const e = (game.profile && game.profile.eq) || {};
  const it = slot === "weapon" ? e.weapon : slot === "bow" ? e.bow : slot === "charm" ? e.charm : e.armor;
  return it ? it.l : 0;
}

// 지금 쓰는 무기 (끼고 있는 장비 + 장신구 힘)
function currentWeapon() {
  const pr = game.profile;
  if (pr.legend) return { ...LEGEND.weapon, damage: weaponBaseDamage(GEAR_MAX) * 2 * 1.2 };
  const w = (typeof eqWeapon === "function" && eqWeapon()) || { id: "sword", type: "sword", level: 0, name: "나무 칼", damage: 1, ...WEAPON_TYPES.sword, color: "#a0784a", effect: null };
  const a = typeof eqArmor === "function" ? eqArmor() : { dmgMul: 1 };
  return { ...w, damage: w.damage * (a.dmgMul || 1) };
}

function currentBow() {
  const pr = game.profile;
  if (pr.legend) return { ...LEGEND.bow, damage: bowBaseDamage(GEAR_MAX) * 1.6 };
  const b = (typeof eqBow === "function" && eqBow()) || { id: "basic", level: 0, name: "활", damage: 1.5, ...BOW_TYPES.basic, pierce: 0, multishot: 1, color: "#a0703a" };
  const a = typeof eqArmor === "function" ? eqArmor() : { dmgMul: 1, bowMul: 1 };
  return { ...b, damage: b.damage * (a.dmgMul || 1) * (a.bowMul || 1) };
}

function currentArmor() {
  const pr = game.profile;
  if (pr.legend) return { ...LEGEND.armor, hearts: 0 };
  return typeof eqArmor === "function" ? eqArmor() : { id: "gear", name: "맨몸", hearts: 0, block: 0, speed: 0, roll: 0, knockResist: 0, regen: 0 };
}

function arrowTypeById(id) { return ARROW_TYPES.find((a) => a.id === id) || ARROW_TYPES[0]; }

// ----- 맵 보상 부품 -----
// 맵 레벨 S 에서 나오는 주 부품 단계 (그 레벨쯤 강화할 단계)
function rewardTier(S) {
  const expected = Math.min(GEAR_MAX, Math.round(0.85 * (S - 1)) + 1);
  return tierIndex(expected);
}
