// ===== 맵 목록 =====
// 앞의 맵을 깨면 다음 맵이 열려요.
//   level    추천 레벨
//   size     맵 크기 (칸)       rooms 방 개수       count 몬스터 수
//   monsters 어떤 몬스터가 얼마나 자주 나오나 (숫자가 클수록 많이)
//   hpMul    몬스터 체력 배수   damageMul 몬스터 공격력 배수
//   reward   클리어 보너스 에메랄드

const MAPS = [
  {
    id: "cave", name: "이끼 동굴", desc: "좀비와 거미가 사는 축축한 동굴",
    level: 1, size: 46, rooms: 9, count: 20, reward: 10,
    monsters: { zombie: 6, spider: 3 }, hpMul: 1, damageMul: 1,
    theme: { floor: "#6b6f76", moss: "#5f7b4c", wall: "#8a8178", darkness: 0.42, bg: "#15171c" },
  },
  {
    id: "crypt", name: "해골 무덤", desc: "멀리서 활을 쏘는 해골을 조심!",
    level: 4, size: 52, rooms: 11, count: 26, reward: 20,
    monsters: { zombie: 4, skeleton: 4, spider: 2 }, hpMul: 1.5, damageMul: 1,
    theme: { floor: "#5b5763", moss: "#6d5a7d", wall: "#77707f", darkness: 0.5, bg: "#141218" },
  },
  {
    id: "jungle", name: "슬라임 정글", desc: "통통 튀는 슬라임과 펑 터지는 펑펑이",
    level: 7, size: 58, rooms: 12, count: 30, reward: 35,
    monsters: { slime: 4, spider: 3, boomer: 2, zombie: 2 }, hpMul: 2, damageMul: 1.5,
    theme: { floor: "#56703f", moss: "#46622f", wall: "#6e5b3b", darkness: 0.38, bg: "#10160c" },
  },
  {
    id: "volcano", name: "용암 요새", desc: "거대한 돌 골렘이 지키는 뜨거운 요새",
    level: 10, size: 62, rooms: 13, count: 34, reward: 60,
    monsters: { golem: 2, boomer: 3, skeleton: 3, zombie: 3, spider: 1 }, hpMul: 2.8, damageMul: 2,
    theme: { floor: "#4a3d39", moss: "#c4541c", wall: "#4b403e", darkness: 0.5, bg: "#1a0d0a", lava: true },
  },
];

// 로비(캠프) 모양
const LOBBY = {
  width: 18, height: 15,
  theme: { floor: "#6e8f4e", moss: "#7fa35a", wall: "#8a6a42", darkness: 0.3, bg: "#0f1a12" },
};

function mapUnlocked(index) {
  return index === 0 || game.profile.cleared.includes(MAPS[index - 1].id);
}
