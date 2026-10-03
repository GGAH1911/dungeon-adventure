// ===== 몬스터 도감 =====
// 숫자를 바꾸거나, 한 마리를 복사해서 새 몬스터를 만들어보세요!
//
// behavior (행동)
//   melee    달려와서 때려요
//   pounce   가까이 오면 점프해서 덮쳐요
//   archer   멀리서 활을 쏘고, 가까이 가면 도망가요
//   exploder 가까이 와서 부풀다가 펑! 터져요 (구르기로 피하세요)
//   caster   멀리서 따라오는 마법 구슬을 던져요
//   flyer    날아다니며 휙 덮쳤다가 도망가요
// shape (모양): human 사람 모양, spider 거미, boomer 펑펑이, slime 슬라임, bat 박쥐
// armor: 받는 공격을 줄여요 (0.4 = 40% 덜 아파요)
// arrowDrop: 화살 떨어뜨릴 확률 (없으면 기본값)
// 체력·공격력은 맵 레벨에 따라 자동으로 세져요 (config.js 의 difficulty)
// hp 체력, speed 속도, damage 공격력(하트), xp 경험치, emerald 에메랄드 떨어뜨릴 확률

const MONSTERS = {
  zombie: {
    name: "좀비", shape: "human", behavior: "melee",
    hp: 3, speed: 1.7, damage: 1, xp: 3, emerald: 0.6,
    attackRange: 0.75, attackCooldown: 1.0, armsForward: true, windup: 0.3,
    look: { skin: "#6fae5a", hair: "#3f6e34", shirt: "#7a5a3a", pants: "#4b4f63", eyes: "#1a1a1a", forearm: "#6fae5a" }, // 찢어진 소매: 아래팔은 초록 피부
  },
  spider: {
    name: "거미", shape: "spider", behavior: "pounce",
    hp: 2, speed: 2.6, damage: 1, xp: 3, emerald: 0.5,
    attackRange: 0.7, attackCooldown: 1.4, pounceRange: 3.2,
    color: "#3b2f2f", eyes: "#ff3b3b",
  },
  skeleton: {
    name: "해골 궁수", shape: "human", behavior: "archer",
    hp: 2.5, speed: 1.6, damage: 1, xp: 4, emerald: 0.6,
    shootRange: 6.5, shootCooldown: 2.2, arrowSpeed: 7, arrowDrop: 0.5,
    weapon: { type: "bow", color: "#7a5230" },
    look: { skin: "#e8e4d8", hair: "#d6d1c2", shirt: "#d9d4c5", pants: "#c9c3b2", eyes: "#222222" },
  },
  boomer: {
    name: "펑펑이", shape: "boomer", behavior: "exploder",
    hp: 2, speed: 2.0, damage: 3, xp: 5, emerald: 0.7,
    fuse: 1.1, blastRadius: 2.0,
    color: "#e0a030", // 주황색 폭탄 몬스터
  },
  slime: {
    name: "슬라임", shape: "slime", behavior: "melee",
    hp: 4, speed: 1.4, damage: 1, xp: 4, emerald: 0.5,
    attackRange: 0.8, attackCooldown: 1.1, size: 1,
    color: "#62d26f", splits: "slimeSmall", splitCount: 2, // 쓰러지면 꼬마 슬라임 2마리로!
  },
  slimeSmall: {
    name: "꼬마 슬라임", shape: "slime", behavior: "melee",
    hp: 1.5, speed: 2.1, damage: 1, xp: 1, emerald: 0.2,
    attackRange: 0.6, attackCooldown: 1.0, size: 0.55,
    color: "#62d26f",
  },
  golem: {
    name: "돌 골렘", shape: "human", behavior: "melee",
    hp: 14, speed: 1.0, damage: 3, xp: 12, emerald: 1, emeraldCount: 3,
    attackRange: 1.2, attackCooldown: 1.8, size: 1.5, heavy: true, windup: 0.55,
    look: { skin: "#8d8f93", hair: "#5f7d4a", shirt: "#7c7e82", pants: "#66686c", eyes: "#ff9a3b" },
  },
  bat: {
    name: "박쥐", shape: "bat", behavior: "flyer",
    hp: 1.5, speed: 3.4, damage: 0.5, xp: 2, emerald: 0.3,
    attackCooldown: 1.3, color: "#3a2f45", eyes: "#ffdd33",
  },
  mummy: {
    name: "미라", shape: "human", behavior: "melee",
    hp: 5, speed: 1.3, damage: 1.5, xp: 5, emerald: 0.7,
    attackRange: 0.8, attackCooldown: 1.2, armsForward: true, windup: 0.34,
    look: { skin: "#d8cba6", hair: "#c4b68f", shirt: "#e0d5b5", pants: "#c9bc98", eyes: "#3fd0ff" },
  },
  mage: {
    name: "얼음 마법사", shape: "human", behavior: "caster",
    hp: 3, speed: 1.4, damage: 1.5, xp: 6, emerald: 0.8,
    shootRange: 7, shootCooldown: 2.6, arrowSpeed: 4.5, projectile: "orb",
    weapon: { type: "staff", color: "#5a3a22", orb: "rgba(120,200,255,0.75)" },
    look: { skin: "#9fb7c9", hair: "#2b3a8a", shirt: "#3b56b0", pants: "#2b3f86", eyes: "#bff4ff", helmet: "#2b3a8a" },
  },
  knight: {
    name: "해골 기사", shape: "human", behavior: "melee",
    hp: 8, speed: 1.5, damage: 2, xp: 8, emerald: 0.9,
    attackRange: 0.85, attackCooldown: 1.3, armor: 0.35, windup: 0.32,
    weapon: { type: "sword", color: "#b8c0cc", length: 0.85, shield: "#5d6574" },
    look: { skin: "#e8e4d8", hair: "#d6d1c2", shirt: "#7b8494", pants: "#5d6574", eyes: "#ff4040", helmet: "#8d96a6" },
  },
  // ----- 새 몬스터 (행동과 모양은 src/newmonsters.js) -----
  miner: {
    weapon: { type: "pick", color: "#cfd6dd", length: 0.55 },
    name: "광부 좀비", shape: "human", behavior: "miner",
    hp: 6, speed: 1.5, damage: 1.5, xp: 7, emerald: 0.9, emeraldCount: 2,
    attackRange: 0.8, attackCooldown: 1.2, armsForward: true,
    throwRange: 7, throwCooldown: 3.5, throwSpeed: 6.5, // 곡괭이 던지기
    look: { skin: "#7fae6a", hair: "#3f6e34", shirt: "#8a6a2a", pants: "#4b3f33", eyes: "#1a1a1a", helmet: "#e0b43a" },
  },
  wisp: {
    name: "바람 정령", shape: "wisp", behavior: "wisp",
    hp: 3.5, speed: 2.8, damage: 1.5, xp: 7, emerald: 0.7,
    keepDistance: 4.5, shootRange: 7.5, shootCooldown: 2.2, arrowSpeed: 5.5,
    color: "#bff6ff",
  },
  crab: {
    name: "집게 게", shape: "crab", behavior: "crab",
    hp: 7, speed: 1.7, damage: 2, xp: 8, emerald: 0.8,
    attackRange: 0.9, attackCooldown: 1.3, armor: 0.3,
    color: "#e2553e", eyes: "#111111",
  },
  shadow: {
    weapon: { type: "sword", color: "#9a6ae0", length: 0.9 },
    name: "그림자 기사", shape: "human", behavior: "shadow",
    hp: 9, speed: 1.7, damage: 2.2, xp: 10, emerald: 1,
    attackRange: 0.9, attackCooldown: 1.3, armor: 0.2,
    blinkCooldown: 5, blinkWarn: 0.75, // 순간이동 전에 이만큼 예고해요 (구르기로 피하기)
    look: { skin: "#3a2a4a", hair: "#1a1024", shirt: "#2c1f3d", pants: "#1f1630", eyes: "#d07bff", helmet: "#3d2a58" },
  },
};
