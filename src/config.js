// ===== 게임 설정 =====
// 여기 숫자를 바꾸면 게임이 바뀌어요!
// 바꾼 다음 저장하고, 브라우저에서 새로고침(맥: Cmd+R) 해보세요.
//   무기·갑옷: src/items.js     몬스터: src/monsters.js     맵: src/maps.js

const CONFIG = {
  player: {
    speed: 4.2,           // 걷는 속도 (1초에 몇 칸)
    baseHp: 10,           // 레벨 1일 때 하트 개수
    rollSpeed: 8.5,       // 구르기 속도
    rollTime: 0.32,       // 구르는 시간 (초) - 구르는 동안은 안 맞아요!
    rollCooldown: 0.9,    // 다시 구를 수 있을 때까지 (초)
    hurtInvincible: 0.7,  // 맞은 뒤 잠깐 무적인 시간 (초)
    maxPotions: Infinity, // 물약 최대 개수: 없어요 (아빠 요청, 2026-10-04)
    maxArrows: Infinity,  // 화살 최대 개수: 없어요 (특수 화살도)
    autoAimRange: 10,     // 활이 저절로 겨냥하는 거리 (칸)
    comboWindow: 0.5,     // 연속기: 휘두른 뒤 이 시간 안에 또 누르면 다음 동작 (초)
    critChance: 0.1,      // 치명타 확률 (0.1 = 10%)
    critDamage: 1.8,      // 치명타 공격력 배수
  },

  level: {
    hardFrom: 30,         // 이 레벨부터 레벨 올리기가 점점 어려워요 (최고 레벨은 없어요)
    hardGrow: 0.04,       // 그 뒤로 레벨마다 필요한 경험치 +4%씩 더
    speedUntil: 50,       // 걷는 속도는 이 레벨까지만 빨라져요
    xpFirst: 12,          // 레벨 2가 되는 데 필요한 경험치
    xpGrow: 8,            // 레벨이 오를 때마다 더 필요한 경험치
    heartEvery: 2,        // 몇 레벨마다 하트가 1개 늘어나나
    damagePerLevel: 0.08, // 레벨마다 공격력 +8%
    speedPerLevel: 0.01,  // 레벨마다 걷는 속도 +1%
  },

  monster: {
    aggroRange: 8,        // 몬스터가 주인공을 알아채는 거리 (칸)
    appleChance: 0.08,    // 사과(하트 2개 회복) 떨어뜨릴 확률
    arrowChance: 0.15,    // 화살 묶음 떨어뜨릴 확률 (해골은 monsters.js 에서 따로)
  },

  // ===== 난이도 (메뉴에서 바꿔요) =====
  // hp/dmg: 몬스터 체력·공격력 배수, reward: 부품·에메랄드 배수, tele: 예고 시간 배수
  difficulties: {
    easy: { name: "쉬움", hp: 0.65, dmg: 0.5, reward: 0.75, tele: 1.4 },
    normal: { name: "보통", hp: 1, dmg: 1, reward: 1, tele: 1 },
    hard: { name: "어려움", hp: 1.4, dmg: 1.35, reward: 1.3, tele: 0.9 },
    nightmare: { name: "악몽", hp: 2, dmg: 1.9, reward: 1.7, tele: 0.8 },
  },
  hardModeReward: 1.25, // 하드모드(쓰러지면 처음부터) 보상 배수

  // ===== 맵 레벨 =====
  // 맵을 고를 때 레벨을 정해요. 레벨이 높을수록 몬스터가 세지고 보상도 커져요.
  // "그 레벨쯤의 주인공 + 그 레벨쯤 살 수 있는 장비"로 좀비를 3~4번 때리면 잡히도록 맞췄어요.
  difficulty: {
    hpPerLevel: 0.08,     // 몬스터 체력: 주인공 공격력이 크는 만큼 (레벨당 +8%)
    gearFollow: 0.85,     // 몬스터 체력: 그 레벨쯤 강화했을 장비를 몇 % 따라가나
    extraPerLevel: 0.01,  // 몬스터 체력: 조금씩 더 어려워지는 정도
    damagePerLevel: 0.15, // 몬스터 공격력: 레벨당 +15%
    rewardPerLevel: 0.05, // 경험치: 레벨당 +5%
    bonusPerLevel: 0.1,   // 클리어 보너스 에메랄드: 레벨당 +10%
    pickAbove: 3,         // 내 레벨보다 몇 레벨 높은 것까지 고를 수 있나
  },

  light: {
    playerLight: 4.5,     // 주인공 주변 밝은 범위 (칸)
    legendLight: 10,      // 황금 갑옷 입었을 때 밝은 범위
  },

  // 효과 개수 상한 (태블릿이 버벅이지 않게, 넘치면 오래된 것부터 지워요: qol.js)
  limits: { particles: 400, floatTexts: 40, projectiles: 150, sparkles: 300, zones: 60, impacts: 60 },

  colors: {
    player: { skin: "#f2c39b", hair: "#2b1d14", shirt: "#d94f45", pants: "#3b3f58", eyes: "#3b2a1a" }, // 주인공 색깔 (아들이 정해보세요!)
    merchant: { skin: "#c99a73", hair: "#5b3b22", shirt: "#6a4c9c", pants: "#57407f", eyes: "#2d6b2d" },
    emerald: "#29d67a",
  },
};

// 난이도 표 (짧게 부르기)
const DIFFICULTY = CONFIG.difficulties;
function diff() { return DIFFICULTY[(typeof game !== "undefined" && game.profile && game.profile.difficulty) || "normal"] || DIFFICULTY.normal; }
