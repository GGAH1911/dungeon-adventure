// ===== 무기, 활, 화살, 갑옷 =====
// 새 장비를 만들고 싶으면 한 줄을 복사해서 이름과 숫자를 바꿔보세요!
// (id 는 영어로, 다른 것과 겹치지 않게)
//
// ----- 근접 무기 -----
//   type     무기 종류 -> 연속기(3단 콤보) 동작이 달라요
//            sword 칼: 베기 -> 반대로 베기 -> 내려찍기
//            dagger 단검: 찌르기 -> 찌르기 -> 회오리
//            spear 창: 찌르기 -> 찌르기 -> 크게 휘두르기
//            axe 도끼: 내려찍기 -> 베기 -> 회오리
//            hammer 망치: 내려찍기 -> 내려찍기 -> 땅 울리기(충격파)
//            scythe 낫: 넓게 베기 -> 반대로 넓게 베기 -> 회오리
//   price    가격 (에메랄드). 팔 때는 절반 값
//   damage   공격력 (레벨과 강화로 더 세져요)
//   range    닿는 거리 (칸)
//   cooldown 다시 휘두를 때까지 (초, 작을수록 빨라요)
//   arc      휘두르는 넓이 (1.2 = 앞쪽 부채꼴)
//   length   칼 길이 (그림)
//   effect   특수 효과: burn 불붙이기, slow 느리게, chain 번개 튀기기, heal 쓰러뜨리면 회복, emerald 에메랄드 더

const WEAPONS = [
  { id: "wood", name: "나무 칼", type: "sword", price: 0, damage: 1, range: 1.4, cooldown: 0.35, arc: 1.2, length: 0.7, color: "#a0784a" },
  { id: "stone", name: "돌 칼", type: "sword", price: 5, damage: 1.5, range: 1.45, cooldown: 0.35, arc: 1.2, length: 0.75, color: "#9a9a9a" },
  { id: "dagger", name: "쌍단검", type: "dagger", price: 9, damage: 1.2, range: 1.25, cooldown: 0.2, arc: 0.9, length: 0.45, color: "#cfd6de" },
  { id: "iron", name: "철 칼", type: "sword", price: 12, damage: 2, range: 1.5, cooldown: 0.32, arc: 1.25, length: 0.8, color: "#e3e8ee" },
  { id: "spear", name: "기사의 창", type: "spear", price: 15, damage: 2.3, range: 2.2, cooldown: 0.36, arc: 0.45, length: 1.3, color: "#c9ced6" },
  { id: "axe", name: "큰 도끼", type: "axe", price: 18, damage: 4, range: 1.7, cooldown: 0.7, arc: 1.6, length: 0.85, color: "#8d949c" },
  { id: "gold", name: "황금 칼", type: "sword", price: 22, damage: 2.6, range: 1.55, cooldown: 0.3, arc: 1.25, length: 0.85, color: "#ffd23f", effect: "emerald" },
  { id: "diamond", name: "다이아몬드 칼", type: "sword", price: 26, damage: 3, range: 1.65, cooldown: 0.3, arc: 1.3, length: 0.9, color: "#5ff0e6" },
  { id: "katana", name: "바람의 카타나", type: "sword", price: 32, damage: 3.3, range: 1.75, cooldown: 0.24, arc: 1.3, length: 1.0, color: "#e8f4ff" },
  { id: "hammer", name: "대지의 망치", type: "hammer", price: 36, damage: 5.5, range: 1.6, cooldown: 0.85, arc: 1.2, length: 0.9, color: "#7a6a5a" },
  { id: "scythe", name: "영혼의 낫", type: "scythe", price: 40, damage: 3.6, range: 2.0, cooldown: 0.42, arc: 1.9, length: 1.15, color: "#8a7cff", effect: "heal" },
  { id: "frost", name: "얼음 검", type: "sword", price: 42, damage: 4, range: 1.7, cooldown: 0.33, arc: 1.3, length: 0.95, color: "#9fe6ff", effect: "slow" },
  { id: "flame", name: "불꽃 대검", type: "sword", price: 45, damage: 5, range: 1.8, cooldown: 0.42, arc: 1.5, length: 1.0, color: "#ff7a2f", effect: "burn" },
  { id: "thunder", name: "번개 검", type: "sword", price: 60, damage: 5.5, range: 1.8, cooldown: 0.36, arc: 1.4, length: 1.0, color: "#ffe94d", effect: "chain" },
  { id: "dragon", name: "용의 이빨", type: "axe", price: 80, damage: 8, range: 1.9, cooldown: 0.6, arc: 1.6, length: 1.05, color: "#d23c3c", effect: "burn" },

  // ↓ 치트로만 얻을 수 있는 전설의 무기 (secret: true 면 가게에 안 나와요)
  { id: "legend", name: "무지개 별빛 대검", type: "sword", secret: true, legendary: true, price: 0,
    damage: 10, range: 2.6, cooldown: 0.24, arc: 2.2, length: 1.35, color: "#ffffff",
    chain: 5, chainRange: 6 }, // chain: 번개가 튀는 몬스터 수
];

// ----- 활 -----
//   damage 화살 공격력   cooldown 다시 쏠 때까지   speed 화살 속도
//   pierce 몇 마리 뚫나   multishot 한 번에 몇 발 (화살은 1개만 써요)
const BOWS = [
  { id: "bow", name: "나무 활", price: 0, damage: 1.5, cooldown: 0.5, speed: 13, color: "#a0703a" },
  { id: "rapid", name: "연발 활", price: 14, damage: 1.2, cooldown: 0.22, speed: 14, color: "#c08a3a" },
  { id: "longbow", name: "긴 활", price: 16, damage: 2.5, cooldown: 0.55, speed: 16, pierce: 1, color: "#7a4f28" },
  { id: "triple", name: "세 갈래 활", price: 28, damage: 2, cooldown: 0.6, speed: 14, multishot: 3, color: "#2f8a64" },
  { id: "hunter", name: "사냥꾼 활", price: 34, damage: 3.5, cooldown: 0.5, speed: 18, pierce: 1, color: "#5a7a2a" },
  { id: "crossbow", name: "석궁", price: 40, damage: 4.5, cooldown: 0.8, speed: 19, pierce: 2, color: "#5a5a66" },
  { id: "storm", name: "폭풍 활", price: 58, damage: 2.6, cooldown: 0.65, speed: 17, multishot: 5, pierce: 1, color: "#4a8aff" },

  // ↓ 치트로만 얻을 수 있는 전설의 활 (화살이 줄지 않아요)
  { id: "legend", name: "무지개 별똥별 활", secret: true, legendary: true, price: 0,
    damage: 8, cooldown: 0.22, speed: 24, multishot: 5, pierce: 99, infinite: true, color: "#ffffff" },
];

// ----- 화살 종류 -----
// 터치 "화살" 작은 버튼(키보드 Tab)으로 쏠 화살을 바꿔요. 특수 화살이 다 떨어지면 보통 화살로.
const ARROW_TYPES = [
  { id: "normal", name: "보통 화살", pack: 10, price: 3, color: "#dfe6ee", desc: "기본 화살" },
  { id: "fire", name: "불화살", pack: 5, price: 5, color: "#ff8a2a", desc: "맞으면 불이 붙어요" },
  { id: "ice", name: "얼음 화살", pack: 5, price: 5, color: "#8fe0ff", desc: "맞으면 느려져요" },
  { id: "bomb", name: "폭탄 화살", pack: 3, price: 7, color: "#ff4a4a", desc: "맞으면 펑! 주변도 아파요" },
];

// ----- 갑옷 -----
//   block  공격을 막을 확률 (0.5 = 절반은 막아요)
//   speed  걷는 속도 보너스 (0.15 = 15% 빨라요, -0.1 = 느려져요)
//   roll   구르기 다시 쓰는 시간 줄이기 (0.4 = 40% 빨리)
//   thorns 나를 때린 몬스터도 아파요 (숫자 = 아픈 정도)
//   frost  나를 때린 몬스터가 느려져요
//   regen  몇 초마다 하트 1개 회복
//   hearts 하트 추가
//   body/legs/helmet 색깔
const ARMORS = [
  { id: "cloth", name: "천 옷", price: 0, block: 0 },
  { id: "leather", name: "가죽 갑옷", price: 6, block: 0.2, body: "#8b5a2b", legs: "#6e4521", helmet: "#7a4e25" },
  { id: "chain", name: "사슬 갑옷", price: 10, block: 0.28, body: "#9aa0a8", legs: "#7c828a", helmet: "#a9afb7" },
  { id: "ninja", name: "닌자 옷", price: 14, block: 0.2, speed: 0.18, roll: 0.45, body: "#2b2b3a", legs: "#22222e", helmet: "#1c1c26" },
  { id: "iron", name: "철 갑옷", price: 16, block: 0.35, body: "#c9ced6", legs: "#a9aeb6", helmet: "#d5dae1" },
  { id: "turtle", name: "거북 등껍질", price: 22, block: 0.45, speed: -0.1, hearts: 3, body: "#4f8a3a", legs: "#3e6e2e", helmet: "#5fa047" },
  { id: "thorn", name: "가시 갑옷", price: 26, block: 0.38, thorns: 2, body: "#6a7a3a", legs: "#55622e", helmet: "#7c8c48" },
  { id: "diamond", name: "다이아몬드 갑옷", price: 30, block: 0.5, body: "#4fe0d6", legs: "#3bbdb4", helmet: "#62ebe2" },
  { id: "frost", name: "서리 갑옷", price: 42, block: 0.52, frost: true, body: "#bfe8ff", legs: "#9fd0ee", helmet: "#d8f2ff" },
  { id: "netherite", name: "흑요석 갑옷", price: 55, block: 0.62, body: "#4a3f55", legs: "#3a3145", helmet: "#5b4e68" },
  { id: "dragon", name: "용비늘 갑옷", price: 78, block: 0.66, regen: 6, hearts: 2, body: "#b8322e", legs: "#8e2622", helmet: "#d24a3a" },

  // ↓ 치트로만 얻을 수 있는 전설의 갑옷
  { id: "legend", name: "태양의 황금 갑옷", secret: true, legendary: true, price: 0,
    block: 1, regen: 2, speed: 0.1, body: "#ffcf33", legs: "#f0b400", helmet: "#ffe066" },
];

// 물약: 가게에서 사서 던전에서 마셔요
const POTION = { id: "potion", name: "체력 물약", price: 4, heal: 4 };

function weaponById(id) { return WEAPONS.find((w) => w.id === id) || WEAPONS[0]; }
function armorById(id) { return ARMORS.find((a) => a.id === id) || ARMORS[0]; }
function bowById(id) { return BOWS.find((b) => b.id === id) || BOWS[0]; }
function arrowTypeById(id) { return ARROW_TYPES.find((a) => a.id === id) || ARROW_TYPES[0]; }
function sellPrice(item) { return Math.max(1, Math.floor(item.price / 2)); }

// ----- 강화 (대장장이) -----
// 무기·활: 강화 1번마다 공격력 +15%   갑옷: 강화 1번마다 하트 +1   최대 +5
const UPGRADE = { max: 5, weaponBonus: 0.15, armorHearts: 1 };
function upgradeLevel(kind, id) { return (game.profile.upgrades || {})[kind + ":" + id] || 0; }
function upgradeCost(kind, item) {
  const n = upgradeLevel(kind, item.id);
  return Math.round(Math.max(4, item.price * 0.4) * (n + 1));
}
function itemLabel(kind, item) {
  const n = upgradeLevel(kind, item.id);
  return n > 0 ? `${item.name} +${n}` : item.name;
}
