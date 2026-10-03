// ===== 저장 =====
// 레벨, 에메랄드, 장비, 깬 맵을 브라우저에 저장해요. 껐다 켜도 그대로!

const SAVE_KEY = "dungeon-adventure-save-v1";

function newProfile() {
  return {
    level: 1, xp: 0, emeralds: 0, potions: 1,
    weapons: ["wood"], armors: ["cloth"],
    weapon: "wood", armor: "cloth",
    cleared: [],
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

function owns(kind, id) {
  return (kind === "weapon" ? game.profile.weapons : game.profile.armors).includes(id);
}
