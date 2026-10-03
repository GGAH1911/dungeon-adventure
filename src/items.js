// ===== 무기와 갑옷 =====
// 새 무기를 만들고 싶으면 한 줄을 복사해서 이름과 숫자를 바꿔보세요!
// (id 는 영어로, 다른 것과 겹치지 않게)
//
// 무기 숫자 뜻
//   price    가격 (에메랄드). 팔 때는 절반 값을 받아요
//   damage   공격력 (레벨이 오르면 더 세져요)
//   range    칼이 닿는 거리 (칸)
//   cooldown 다시 휘두를 때까지 (초, 작을수록 빨라요)
//   arc      휘두르는 넓이 (1.2 = 앞쪽 부채꼴, 3.14 = 한 바퀴 전체)
//   length   칼 길이 (그림)
//   color    칼 색깔

const WEAPONS = [
  { id: "wood", name: "나무 칼", price: 0, damage: 1, range: 1.4, cooldown: 0.35, arc: 1.2, length: 0.7, color: "#a0784a" },
  { id: "stone", name: "돌 칼", price: 5, damage: 1.5, range: 1.45, cooldown: 0.35, arc: 1.2, length: 0.75, color: "#9a9a9a" },
  { id: "iron", name: "철 칼", price: 12, damage: 2, range: 1.5, cooldown: 0.32, arc: 1.25, length: 0.8, color: "#e3e8ee" },
  { id: "axe", name: "큰 도끼", price: 18, damage: 4, range: 1.7, cooldown: 0.7, arc: 1.6, length: 0.85, color: "#8d949c", swingTime: 0.22 },
  { id: "diamond", name: "다이아몬드 칼", price: 25, damage: 3, range: 1.65, cooldown: 0.3, arc: 1.3, length: 0.9, color: "#5ff0e6" },
  { id: "flame", name: "불꽃 대검", price: 45, damage: 5, range: 1.8, cooldown: 0.42, arc: 1.5, length: 1.0, color: "#ff7a2f", swingTime: 0.2 },

  // ↓ 치트로만 얻을 수 있는 전설의 무기 (secret: true 면 가게에 안 나와요)
  { id: "legend", name: "무지개 별빛 대검", secret: true, legendary: true, price: 0,
    damage: 10, range: 2.6, cooldown: 0.28, arc: Math.PI, length: 1.35, color: "#ffffff", swingTime: 0.24,
    chain: 5, chainRange: 6 }, // chain: 번개가 튀는 몬스터 수
];

// 갑옷 숫자 뜻
//   block  공격을 막을 확률 (0.5 = 절반은 막아요, 1 = 전부 막아요)
//   body/legs/helmet  색깔

const ARMORS = [
  { id: "cloth", name: "천 옷", price: 0, block: 0 },
  { id: "leather", name: "가죽 갑옷", price: 6, block: 0.2, body: "#8b5a2b", legs: "#6e4521", helmet: "#7a4e25" },
  { id: "iron", name: "철 갑옷", price: 15, block: 0.35, body: "#c9ced6", legs: "#a9aeb6", helmet: "#d5dae1" },
  { id: "diamond", name: "다이아몬드 갑옷", price: 30, block: 0.5, body: "#4fe0d6", legs: "#3bbdb4", helmet: "#62ebe2" },
  { id: "netherite", name: "흑요석 갑옷", price: 55, block: 0.62, body: "#4a3f55", legs: "#3a3145", helmet: "#5b4e68" },

  // ↓ 치트로만 얻을 수 있는 전설의 갑옷
  { id: "legend", name: "태양의 황금 갑옷", secret: true, legendary: true, price: 0,
    block: 1, regen: 2, // regen: 몇 초마다 하트 1개 회복
    body: "#ffcf33", legs: "#f0b400", helmet: "#ffe066" },
];

// 물약: 가게에서 사서 던전에서 마셔요 (키보드 Q, 터치 "물약" 버튼)
const POTION = { id: "potion", name: "체력 물약", price: 4, heal: 4 };

function weaponById(id) { return WEAPONS.find((w) => w.id === id) || WEAPONS[0]; }
function armorById(id) { return ARMORS.find((a) => a.id === id) || ARMORS[0]; }
function sellPrice(item) { return Math.max(1, Math.floor(item.price / 2)); }
