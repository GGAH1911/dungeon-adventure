// ===== 맵 목록 =====
// 앞의 맵을 깨면(어떤 레벨이든) 다음 맵이 열려요.
// 맵을 고를 때 레벨(난이도)도 골라요. 레벨에 따라 몬스터가 세지는 정도는 config.js 의 difficulty.
//   minLevel 고를 수 있는 가장 낮은 레벨
//   size     맵 크기 (칸)       rooms 방 개수       count 몬스터 수
//   monsters 어떤 몬스터가 얼마나 자주 나오나 (숫자가 클수록 많이)
//   reward   클리어 보너스 에메랄드 (레벨이 높으면 더 많이)

const MAPS = [
  {
    key: ["guardian"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "cave", name: "이끼 동굴", desc: "좀비와 거미가 사는 축축한 동굴",
    minLevel: 1, size: 44, rooms: 9, count: 20, reward: 10,
    monsters: { zombie: 6, spider: 3, mushroom: 2, thief: 1 },
    theme: { floor: "#6b6f76", moss: "#5f7b4c", wall: "#8a8178", darkness: 0.42, bg: "#15171c" },
  },
  {
    key: ["shards"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "crypt", name: "해골 무덤", desc: "멀리서 활을 쏘는 해골과 박쥐 떼",
    minLevel: 3, size: 50, rooms: 10, count: 24, reward: 14,
    monsters: { zombie: 4, skeleton: 3, spider: 2, bat: 2, shieldbearer: 2, summoner: 1, thief: 1 },
    theme: { floor: "#5b5763", moss: "#6d5a7d", wall: "#77707f", darkness: 0.5, bg: "#141218" },
  },
  {
    key: ["crackwall"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "jungle", name: "슬라임 정글", desc: "통통 튀는 슬라임과 펑 터지는 펑펑이",
    minLevel: 5, size: 54, rooms: 11, count: 26, reward: 18,
    monsters: { slime: 3, spider: 2, boomer: 2, zombie: 2, jellyCube: 2, mushroom: 2, lurker: 1, trapper: 1 },
    theme: { floor: "#56703f", moss: "#46622f", wall: "#6e5b3b", darkness: 0.38, bg: "#10160c" },
  },
  {
    key: ["plates", "mimic"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "desert", name: "사막 신전", desc: "모래 속에서 깨어난 미라들",
    minLevel: 8, size: 56, rooms: 12, count: 28, reward: 22,
    monsters: { mummy: 4, skeleton: 2, boomer: 2, spider: 1, charger: 2, sniper: 1, shieldbearer: 1, thief: 1 },
    theme: { floor: "#c9a86a", moss: "#b08a4e", wall: "#a8875a", darkness: 0.3, bg: "#1e170c" },
  },
  {
    key: ["torches", "shards"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "ice", name: "얼음 성채", desc: "따라오는 얼음 구슬을 던지는 마법사",
    minLevel: 11, size: 58, rooms: 12, count: 30, reward: 28,
    monsters: { mage: 3, skeleton: 2, knight: 2, bat: 2, healer: 1, sniper: 2, whirler: 1 },
    theme: { floor: "#a9c4d8", moss: "#d8ecf7", wall: "#7f9fb8", darkness: 0.35, bg: "#0c1420" },
  },
  {
    key: ["memory", "mimic"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "swamp", name: "버섯 늪", desc: "보라색 버섯 사이에 숨은 슬라임과 박쥐",
    minLevel: 14, size: 60, rooms: 13, count: 32, reward: 34,
    monsters: { slime: 3, boomer: 2, bat: 2, spider: 1, mummy: 2, mushroom: 3, lurker: 2, trapper: 1, healer: 1 },
    theme: { floor: "#4d5a3f", moss: "#7a4d8a", wall: "#5a4a3f", darkness: 0.5, bg: "#0f0c14" },
  },
  {
    key: ["levers", "traphall"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "volcano", name: "용암 요새", desc: "거대한 돌 골렘이 지키는 뜨거운 요새",
    minLevel: 17, size: 62, rooms: 13, count: 34, reward: 42,
    monsters: { golem: 2, boomer: 2, skeleton: 2, knight: 2, zombie: 1, charger: 2, drummer: 1, whirler: 2 },
    theme: { floor: "#4a3d39", moss: "#c4541c", wall: "#4b403e", darkness: 0.5, bg: "#1a0d0a", lava: true },
  },
  {
    key: ["twins", "levers"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "castle", name: "어둠의 성", desc: "모든 몬스터가 모인 마지막 성",
    minLevel: 20, size: 66, rooms: 14, count: 40, reward: 55,
    monsters: { knight: 3, mage: 2, golem: 2, bat: 2, boomer: 1, skeleton: 2, drummer: 1, healer: 1, shieldbearer: 2, summoner: 1, sniper: 1 },
    theme: { floor: "#3e3a46", moss: "#5a2030", wall: "#4a4552", darkness: 0.58, bg: "#09070d" },
  },
  // ----- 어둠의 성 다음 맵들 (마지막 방에 보스가 있어요: boss) -----
  {
    key: ["crackwall", "hold", "thief"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "mine", name: "버려진 광산", desc: "곡괭이를 던지는 광부 좀비가 사는 금광",
    minLevel: 23, size: 64, rooms: 14, count: 36, reward: 65, boss: "miner",
    monsters: { miner: 4, spider: 2, golem: 1, boomer: 2, whirler: 1, charger: 1, trapper: 2, thief: 1 },
    theme: { floor: "#6b5236", moss: "#e0b43a", wall: "#5a4330", darkness: 0.52, bg: "#140d07" },
  },
  {
    key: ["torches", "memory", "guardian"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "sky", name: "구름 섬", desc: "하늘에 뜬 섬. 바람 정령이 휙휙 날아다녀요",
    minLevel: 26, size: 66, rooms: 14, count: 38, reward: 75, boss: "wisp",
    monsters: { wisp: 4, bat: 2, mage: 2, skeleton: 1, sniper: 2, healer: 1, drummer: 1 },
    theme: { floor: "#dfeefa", moss: "#ffffff", wall: "#b8d4ea", darkness: 0.12, bg: "#7fc3ee" },
  },
  {
    key: ["plates", "thief", "twins"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "coral", name: "산호 바다 동굴", desc: "단단한 집게 게가 옆걸음으로 다가와요",
    minLevel: 29, size: 68, rooms: 15, count: 40, reward: 85, boss: "crab",
    monsters: { crab: 4, slime: 2, wisp: 2, mummy: 1, jellyCube: 2, shieldbearer: 2, lurker: 2 },
    theme: { floor: "#2f7f86", moss: "#ff7f6a", wall: "#2a5f6e", darkness: 0.4, bg: "#061a22" },
  },
  {
    key: ["dark", "levers", "hold"], // 열쇠 찾기 도전 (keyhunt.js)
    id: "void", name: "공허의 끝", desc: "그림자 기사가 뒤로 순간이동해요! 예고를 보면 구르기",
    minLevel: 32, size: 70, rooms: 15, count: 44, reward: 100, boss: "shadow",
    monsters: { shadow: 3, knight: 2, mage: 2, boomer: 1, crab: 2, summoner: 1, drummer: 1, healer: 1, sniper: 1, lurker: 1 },
    theme: { floor: "#2a2236", moss: "#7a3fd0", wall: "#1c1626", darkness: 0.66, bg: "#030206" },
  },
];

// 로비(캠프) 모양
const LOBBY = {
  width: 30, height: 23,
  theme: { floor: "#6e8f4e", moss: "#7fa35a", wall: "#8a6a42", path: "#a08a62", darkness: 0.28, bg: "#0f1a12" },
};

// 이 맵을 열려면 깨야 하는 맵
function unlockSource(index) {
  const m = MAPS[index];
  if (m.unlockAfter) return MAPS.find((x) => x.id === m.unlockAfter);
  return index === 0 ? null : MAPS[index - 1];
}
function mapUnlocked(index) {
  const src = unlockSource(index);
  return !src || game.profile.cleared.includes(src.id);
}

// ----- 맵 레벨(난이도) 계산 -----
// 그 레벨쯤의 주인공이 강화했을 장비 공격력 (items.js 의 강화 곡선과 같은 식)
function expectedGearMul(L) {
  const g = Math.min(GEAR_MAX, 0.85 * (L - 1));
  return (1 + 0.2 * g) * (1 + 0.015 * g) * (1 + 0.04 * Math.floor(g / 5));
}
function monsterHpMul(L) {
  const d = CONFIG.difficulty;
  return (1 + d.hpPerLevel * (L - 1)) * (1 + (expectedGearMul(L) - 1) * d.gearFollow) * (1 + d.extraPerLevel * (L - 1));
}
function monsterDamageMul(L) { return 1 + CONFIG.difficulty.damagePerLevel * (L - 1); }
function rewardMul(L) { return 1 + CONFIG.difficulty.rewardPerLevel * (L - 1); }
function clearBonus(map, L) { return Math.round(map.reward * (1 + CONFIG.difficulty.bonusPerLevel * (L - 1))); }

// 이 맵에서 고를 수 있는 레벨 범위
function levelRange(map) {
  const min = map.minLevel;
  const max = Math.min(CONFIG.level.max, Math.max(min, game.profile.level + CONFIG.difficulty.pickAbove));
  return { min, max };
}

// 내 레벨과 비교해서 어려운 정도
function difficultyLabel(L) {
  const d = L - game.profile.level;
  if (d <= -4) return { text: "아주 쉬움", color: "#9be8ff" };
  if (d <= -2) return { text: "쉬움", color: "#7dffb0" };
  if (d <= 1) return { text: "알맞음", color: "#ffe27a" };
  if (d <= 2) return { text: "어려움", color: "#ffb070" };
  return { text: "아주 어려움", color: "#ff7070" };
}
