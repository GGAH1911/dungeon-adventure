// ===== 저장 =====
// 레벨, 에메랄드, 장비, 깬 맵을 브라우저에 저장해요. 껐다 켜도 그대로!

const SAVE_KEY = "dungeon-adventure-save-v1";

function newProfile() {
  return {
    level: 1, xp: 0, emeralds: 0, potions: 1, arrows: 10,
    weapons: ["wood"], armors: ["cloth"], bows: ["bow"],
    weapon: "wood", armor: "cloth", bow: "bow",
    cleared: [],   // 깬 맵
    best: {},      // 맵마다 깬 가장 높은 레벨
  };
}

function loadProfile() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data && data.level) return { ...newProfile(), ...data };
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
