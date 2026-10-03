// ===== 게임 설정 =====
// 여기 숫자를 바꾸면 게임이 바뀌어요!
// 바꾼 다음 저장하고, 브라우저에서 새로고침(맥: Cmd+R) 해보세요.
//   무기·갑옷: src/items.js     몬스터: src/monsters.js     맵: src/maps.js

const CONFIG = {
  player: {
    speed: 4.2,           // 걷는 속도 (1초에 몇 칸)
    baseHp: 10,           // 레벨 1일 때 하트 개수
    rollSpeed: 11,        // 구르기 속도
    rollTime: 0.22,       // 구르는 시간 (초) - 구르는 동안은 안 맞아요!
    rollCooldown: 0.9,    // 다시 구를 수 있을 때까지 (초)
    hurtInvincible: 0.7,  // 맞은 뒤 잠깐 무적인 시간 (초)
    maxPotions: 5,        // 물약 최대 개수
    maxArrows: 99,        // 화살 최대 개수
    autoAimRange: 10,     // 활이 저절로 겨냥하는 거리 (칸)
  },

  level: {
    max: 50,              // 최고 레벨
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

  // ===== 맵 레벨(난이도) =====
  // 맵을 고를 때 레벨을 정해요. 레벨이 높을수록 몬스터가 세지고 보상도 커져요.
  // "그 레벨쯤의 주인공 + 그 레벨쯤 살 수 있는 장비"로 좀비를 3~4번 때리면 잡히도록 맞췄어요.
  difficulty: {
    hpPerLevel: 0.08,     // 몬스터 체력: 주인공 공격력이 크는 만큼 (레벨당 +8%)
    gearPerLevel: 0.25,   // 몬스터 체력: 좋은 장비를 살 거라고 보고 더 늘어나는 정도
    gearMax: 4,           //   (장비 몫은 4배까지만)
    extraPerLevel: 0.01,  // 몬스터 체력: 조금씩 더 어려워지는 정도
    damagePerLevel: 0.12, // 몬스터 공격력: 레벨당 +12%
    rewardPerLevel: 0.05, // 경험치: 레벨당 +5%
    bonusPerLevel: 0.1,   // 클리어 보너스 에메랄드: 레벨당 +10%
    pickAbove: 3,         // 내 레벨보다 몇 레벨 높은 것까지 고를 수 있나
  },

  light: {
    playerLight: 4.5,     // 주인공 주변 밝은 범위 (칸)
    legendLight: 10,      // 황금 갑옷 입었을 때 밝은 범위
  },

  // ===== 치트 코드 =====
  // "코드": "효과" 로 적어요. 코드는 마음대로 바꿔도 돼요!
  // 키보드: / 또는 T     터치: 메뉴(≡) 버튼 안의 "치트" 버튼
  // 한글 코드는 영문 자판 상태로 쳐도 알아들어요. (예: 최강전사 = chlrkdwjstk)
  cheats: {
    "최강전사": "legend",     // 전설의 무기 + 전설의 활 + 전설의 갑옷
    "치트끄기": "uncheat",    // 전설의 장비 없애기
    "에메랄드비": "emeralds", // 에메랄드 100개
  },

  colors: {
    player: { skin: "#f2c39b", hair: "#2b1d14", shirt: "#d94f45", pants: "#3b3f58", eyes: "#3b2a1a" }, // 주인공 색깔 (아들이 정해보세요!)
    merchant: { skin: "#c99a73", hair: "#5b3b22", shirt: "#6a4c9c", pants: "#57407f", eyes: "#2d6b2d" },
    emerald: "#29d67a",
  },
};
