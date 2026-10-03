// ===== 저장 =====
// 레벨, 에메랄드, 장비, 깬 맵을 브라우저에 저장해요. 껐다 켜도 그대로!

const SAVE_KEY = "dungeon-adventure-save-v1";
const SAVE_VERSION = 2;

function newProfile() {
  return {
    version: SAVE_VERSION,
    level: 1, xp: 0, emeralds: 0, potions: 1,
    arrows: 10,                               // 보통 화살
    special: { fire: 0, ice: 0, bomb: 0 },    // 특수 화살
    arrowType: "normal",
    gear: { weapon: 0, bow: 0, head: 0, chest: 0, legs: 0, arms: 0, boots: 0 }, // 부위별 강화 레벨
    weaponTypes: ["sword"], weaponType: "sword",
    bowTypes: ["basic"], bowType: "basic",
    materials: {},  // 부품 개수
    enchants: [],   // 열린 마법
    enchant: null,  // 무기에 붙인 마법
    legend: false,  // 치트: 전설 장비
    difficulty: "normal", // easy / normal / hard / nightmare
    hardMode: false,      // 켜면 쓰러졌을 때 처음부터
    look: {},
    cleared: [], best: {}, towerBest: 0,
    firstClears: {},      // 맵+난이도 처음 깬 기록 (처음엔 부품 더 줘요)
    keys: {},             // 맵에서 찾은 열쇠 (보스방 재도전용)
    stats: { kills: 0, chests: 0, runs: 0, clears: 0, deaths: 0, pets: 0, bosses: 0 },
  };
}

// ----- 예전 저장(장비 하나하나 사던 방식) -> 새 방식으로 옮기기 -----
const OLD_WEAPONS = {
  wood: ["sword", 0], stone: ["sword", 5], dagger: ["dagger", 9], iron: ["sword", 12], spear: ["spear", 15], axe: ["axe", 18],
  gold: ["sword", 22, "emerald"], diamond: ["sword", 26], katana: ["sword", 32], hammer: ["hammer", 36], scythe: ["scythe", 40, "heal"],
  frost: ["sword", 42, "slow"], flame: ["sword", 45, "burn"], thunder: ["sword", 60, "chain"], dragon: ["axe", 80, "burn"],
};
const OLD_BOWS = { bow: ["basic", 0], rapid: ["rapid", 14], longbow: ["long", 16], triple: ["triple", 28], hunter: ["long", 34], crossbow: ["crossbow", 40], storm: ["storm", 58] };
const OLD_ARMORS = { cloth: 0, leather: 3, chain: 5, ninja: 5, iron: 7, turtle: 9, thorn: 10, diamond: 12, frost: 14, netherite: 16, dragon: 20 };

function migrateProfile(d) {
  const p = newProfile();
  const keep = ["level", "xp", "emeralds", "potions", "arrows", "arrowType", "look", "cleared", "best", "towerBest"];
  for (const k of keep) if (d[k] !== undefined) p[k] = d[k];
  p.special = { ...p.special, ...(d.special || {}) };
  p.stats = { ...p.stats, ...(d.stats || {}) };
  const up = d.upgrades || {};
  const lv = (price) => Math.min(GEAR_MAX, Math.round(price / 2.6));
  // 무기: 가진 것들의 종류는 열어두고, 쓰던 무기 값만큼 레벨
  const weapons = d.weapons || ["wood"];
  const types = new Set(["sword"]);
  const enchants = new Set();
  let bestW = 0;
  for (const id of weapons) {
    if (id === "legend") { p.legend = true; continue; }
    const w = OLD_WEAPONS[id]; if (!w) continue;
    types.add(w[0]); if (w[2]) enchants.add(w[2]);
    bestW = Math.max(bestW, lv(w[1]) + (up["weapon:" + id] || 0));
  }
  p.weaponTypes = [...types];
  const eq = OLD_WEAPONS[d.weapon];
  p.weaponType = eq ? eq[0] : "sword";
  p.enchants = [...enchants];
  p.enchant = eq && eq[2] ? eq[2] : null;
  p.gear.weapon = bestW;
  // 활
  const bows = d.bows || ["bow"];
  const bt = new Set(["basic"]);
  let bestB = 0;
  for (const id of bows) {
    if (id === "legend") { p.legend = true; continue; }
    const b = OLD_BOWS[id]; if (!b) continue;
    bt.add(b[0]);
    bestB = Math.max(bestB, lv(b[1]) + (up["bow:" + id] || 0));
  }
  p.bowTypes = [...bt];
  p.bowType = OLD_BOWS[d.bow] ? OLD_BOWS[d.bow][0] : "basic";
  p.gear.bow = bestB;
  // 갑옷: 가장 좋은 갑옷 단계를 다섯 부위에 똑같이
  let bestA = 0;
  for (const id of d.armors || []) {
    if (id === "legend") { p.legend = true; continue; }
    if (OLD_ARMORS[id] !== undefined) bestA = Math.max(bestA, OLD_ARMORS[id] + (up["armor:" + id] || 0));
  }
  for (const s of ARMOR_SLOTS) p.gear[s] = Math.min(GEAR_MAX, bestA);
  if (d.weapon === "legend" || d.armor === "legend" || d.bow === "legend") p.legend = true;
  return p;
}

function loadProfile() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data && data.level) {
      if (!data.version || data.version < SAVE_VERSION) {
        const migrated = migrateProfile(data);
        try { localStorage.setItem(SAVE_KEY + "-backup-v1", JSON.stringify(data)); } catch (e) { /* 백업 실패는 무시 */ }
        return migrated;
      }
      const base = newProfile();
      return {
        ...base, ...data,
        gear: { ...base.gear, ...(data.gear || {}) },
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

function arrowCount(type) {
  const pr = game.profile;
  return type === "normal" ? pr.arrows : pr.special[type] || 0;
}

function addMaterial(id, n) {
  const m = game.profile.materials;
  m[id] = (m[id] || 0) + n;
  // 보스 부품이면 마법이 열려요
  const def = MATERIALS[id];
  if (def && def.enchant && !game.profile.enchants.includes(def.enchant)) {
    game.profile.enchants.push(def.enchant);
    showMessage(`새 마법이 열렸어요! ${ENCHANTS[def.enchant].name} (대장장이)`, 3, true);
  }
}
