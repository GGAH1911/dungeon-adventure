// ===== 저장 =====
// 레벨, 에메랄드, 장비, 깬 맵을 브라우저에 저장해요. 껐다 켜도 그대로!

const SAVE_KEY = "dungeon-adventure-save-v1";

function newProfile() {
  return {
    level: 1, xp: 0, emeralds: 0, potions: 1,
    arrows: 10,                          // 보통 화살
    special: { fire: 0, ice: 0, bomb: 0 }, // 특수 화살
    arrowType: "normal",
    weapons: ["wood"], armors: ["cloth"], bows: ["bow"],
    weapon: "wood", armor: "cloth", bow: "bow",
    upgrades: {},  // 강화 단계
    look: {},      // 옷장에서 고른 색깔
    cleared: [],   // 깬 맵
    best: {},      // 맵마다 깬 가장 높은 레벨
    towerBest: 0,  // 시련의 탑 최고 층
    stats: { kills: 0, chests: 0, runs: 0, clears: 0, deaths: 0, pets: 0 },
  };
}

function loadProfile() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data && data.level) {
      const base = newProfile();
      return {
        ...base, ...data,
        special: { ...base.special, ...(data.special || {}) },
        stats: { ...base.stats, ...(data.stats || {}) },
      };
    }
  } catch (e) { /* 저장된 게 없으면 새로 시작 */ }
  return newProfile();
}

function saveProfile() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.profile)); } catch (e) { /* 저장 못 해도 게임은 계속 */ }
}

function resetProfile() {
  game.profile = newProfile();
  saveProfile();
}

function ownedList(kind) {
  const pr = game.profile;
  return kind === "weapon" ? pr.weapons : kind === "bow" ? pr.bows : pr.armors;
}

function owns(kind, id) {
  return ownedList(kind).includes(id);
}

function arrowCount(type) {
  const pr = game.profile;
  return type === "normal" ? pr.arrows : pr.special[type] || 0;
}
