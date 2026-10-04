// ===== 장비: 찾고, 고르고, 키워요 =====
// 장비 칸 4개: 무기, 활, 갑옷, 장신구
// - 상자·정예·열쇠 수호자·보스에서 장비가 떨어져요 (등급: 보통·희귀·영웅·전설·신화)
// - 예전 무기들(나무 칼 ~ 용 도끼)이 그대로 돌아왔어요. 맵 레벨이 오를수록 더 좋은 이름의 무기가 나와요
// - 아끼는 장비는 대장장이에서 +1 ~ +10 강화 (실패 없음). +5, +10 에서 특별 능력이 더 세져요
// - 보스 12마리는 저마다 전설 장비를 하나씩 줘요
// 저장: game.profile.eq = { weapon, bow, armor, charm } (장비 하나 = { u, b, r, l, p, lock, e, f })
//        game.profile.bag = [장비...] (가방 20칸)
//   u 번호, b 종류(ITEM_BASES), r 등급(0~4), l 장비 레벨, p 강화(+0~10), lock 잠금, e 마법(대장장이), f 모양(전설 무기: 직업)

const BAG_MAX = 20, STASH_MAX = 30, PLUS_MAX = 10;
const EQ_SLOTS = [
  { id: "weapon", name: "무기" }, { id: "bow", name: "활" }, { id: "armor", name: "갑옷" }, { id: "charm", name: "장신구" },
];
const RARITIES = [
  { name: "보통", color: "#e6e6e6", mul: 1.0, cur: "emerald" },
  { name: "희귀", color: "#5aa8ff", mul: 1.12, cur: "silver" },
  { name: "영웅", color: "#b47cff", mul: 1.26, cur: "amethyst" },
  { name: "전설", color: "#ffd23f", mul: 1.42, cur: "gold" },
  { name: "신화", color: "#86f3ff", mul: 1.6, cur: "diamond" },
];

// ----- 장비 종류 -----
// minL: 이 장비 레벨부터 나와요. cls: 이 직업만 써요 (무기). perk: 특별 능력
const ITEM_BASES = {};
function defBase(id, d) { ITEM_BASES[id] = { id, ...d }; }
const WAR = ["warrior"];
// 전사 무기 (예전 무기 그대로)
defBase("w_wood", { slot: "weapon", cls: WAR, name: "나무 칼", type: "sword", minL: 0, color: "#a0784a" });
defBase("w_stone", { slot: "weapon", cls: WAR, name: "돌 칼", type: "sword", minL: 3, color: "#9a9a9a" });
defBase("w_dagger", { slot: "weapon", cls: WAR, name: "쌍단검", type: "dagger", minL: 5, color: "#cfd6de" });
defBase("w_iron", { slot: "weapon", cls: WAR, name: "철 칼", type: "sword", minL: 7, color: "#e3e8ee" });
defBase("w_spear", { slot: "weapon", cls: WAR, name: "창", type: "spear", minL: 9, color: "#c9ced6" });
defBase("w_axe", { slot: "weapon", cls: WAR, name: "도끼", type: "axe", minL: 11, color: "#b9bec6" });
defBase("w_gold", { slot: "weapon", cls: WAR, name: "황금 칼", type: "sword", minL: 13, color: "#ffd23f", effect: "emerald" });
defBase("w_diamond", { slot: "weapon", cls: WAR, name: "다이아 칼", type: "sword", minL: 16, color: "#5ff0e6" });
defBase("w_katana", { slot: "weapon", cls: WAR, name: "카타나", type: "sword", minL: 19, color: "#f0f4f8", mul: 1.05 });
defBase("w_hammer", { slot: "weapon", cls: WAR, name: "망치", type: "hammer", minL: 21, color: "#8d99a6" });
defBase("w_scythe", { slot: "weapon", cls: WAR, name: "낫", type: "scythe", minL: 23, color: "#c08aff", effect: "heal" });
defBase("w_frost", { slot: "weapon", cls: WAR, name: "서리 검", type: "sword", minL: 25, color: "#8fe0ff", effect: "slow" });
defBase("w_flame", { slot: "weapon", cls: WAR, name: "불꽃 검", type: "sword", minL: 27, color: "#ff8a2a", effect: "burn" });
defBase("w_thunder", { slot: "weapon", cls: WAR, name: "천둥 검", type: "sword", minL: 30, color: "#ffe94d", effect: "chain" });
defBase("w_dragon", { slot: "weapon", cls: WAR, name: "용 도끼", type: "axe", minL: 34, color: "#e04a3a", effect: "burn" });
// 마법사 지팡이
defBase("s_wood", { slot: "weapon", cls: ["mage"], name: "나무 지팡이", type: "sword", minL: 0, color: "#9fd0ff" });
defBase("s_crystal", { slot: "weapon", cls: ["mage"], name: "수정 지팡이", type: "sword", minL: 8, color: "#bfe6ff" });
defBase("s_flame", { slot: "weapon", cls: ["mage"], name: "불꽃 지팡이", type: "sword", minL: 16, color: "#ff8a2a", effect: "burn" });
defBase("s_frost", { slot: "weapon", cls: ["mage"], name: "서리 지팡이", type: "sword", minL: 22, color: "#8fe0ff", effect: "slow" });
defBase("s_storm", { slot: "weapon", cls: ["mage"], name: "번개 지팡이", type: "sword", minL: 28, color: "#ffe94d", effect: "chain" });
defBase("s_star", { slot: "weapon", cls: ["mage"], name: "별빛 지팡이", type: "sword", minL: 34, color: "#ffd84a", mul: 1.06 });
// 드루이드 지팡이
defBase("d_vine", { slot: "weapon", cls: ["druid"], name: "덩굴 지팡이", type: "sword", minL: 0, color: "#9be86a" });
defBase("d_moss", { slot: "weapon", cls: ["druid"], name: "이끼 지팡이", type: "sword", minL: 8, color: "#7a9a5a" });
defBase("d_thorn", { slot: "weapon", cls: ["druid"], name: "가시 지팡이", type: "sword", minL: 16, color: "#c8e070", effect: "slow" });
defBase("d_spirit", { slot: "weapon", cls: ["druid"], name: "영혼 지팡이", type: "sword", minL: 24, color: "#c08aff", effect: "heal" });
defBase("d_ancient", { slot: "weapon", cls: ["druid"], name: "고목 지팡이", type: "sword", minL: 32, color: "#c9a36a", effect: "chain" });
// 사냥꾼 단검 (사냥꾼은 활이 주무기예요)
defBase("h_knife", { slot: "weapon", cls: ["hunter"], name: "사냥 칼", type: "sword", minL: 0, color: "#cfd6de" });
defBase("h_bone", { slot: "weapon", cls: ["hunter"], name: "뼈 단검", type: "sword", minL: 10, color: "#efe6cf" });
defBase("h_fang", { slot: "weapon", cls: ["hunter"], name: "독니 단검", type: "sword", minL: 20, color: "#9bd05a", effect: "slow" });
defBase("h_shadow", { slot: "weapon", cls: ["hunter"], name: "그림자 단검", type: "sword", minL: 30, color: "#8a6ac0", effect: "chain" });
// 활 (모든 직업)
defBase("b_basic", { slot: "bow", name: "활", type: "basic", minL: 0, color: "#a0703a" });
defBase("b_rapid", { slot: "bow", name: "연발 활", type: "rapid", minL: 5, color: "#c9a36a" });
defBase("b_long", { slot: "bow", name: "긴 활", type: "long", minL: 9, color: "#8b5a2b" });
defBase("b_triple", { slot: "bow", name: "세 갈래 활", type: "triple", minL: 14, color: "#d5dae1" });
defBase("b_hunter", { slot: "bow", name: "사냥꾼 활", type: "long", minL: 18, color: "#6fae3f", mul: 1.08 });
defBase("b_cross", { slot: "bow", name: "석궁", type: "crossbow", minL: 22, color: "#7c828a" });
defBase("b_storm", { slot: "bow", name: "폭풍 활", type: "storm", minL: 28, color: "#9fe6ff" });
// 갑옷 (모든 직업) look: 몸 색깔들
const ARMOR_LOOK = (t) => ({ ...TIERS[t].armor });
defBase("a_cloth", { slot: "armor", name: "천 옷", minL: 0, look: null, perk: {} });
defBase("a_leather", { slot: "armor", name: "가죽 갑옷", minL: 2, look: ARMOR_LOOK(0), perk: {} });
defBase("a_chain", { slot: "armor", name: "사슬 갑옷", minL: 5, look: { body: "#9aa0a8", legs: "#7c828a", helmet: "#aab0b8", boots: "#5a6068", gloves: "#8a9098" }, perk: { block: 0.04 } });
defBase("a_ninja", { slot: "armor", name: "닌자 옷", minL: 6, look: { body: "#2a2a38", legs: "#22222e", helmet: "#2a2a38", boots: "#18181f", gloves: "#3a3a4a" }, perk: { speed: 0.06, roll: 0.08 } });
defBase("a_iron", { slot: "armor", name: "철 갑옷", minL: 9, look: ARMOR_LOOK(1), perk: { hearts: 1 } });
defBase("a_turtle", { slot: "armor", name: "거북 갑옷", minL: 12, look: { body: "#4f9a4a", legs: "#3d7a3a", helmet: "#5fb35a", boots: "#2f5a2c", gloves: "#4f9a4a" }, perk: { block: 0.1 } });
defBase("a_thorn", { slot: "armor", name: "가시 갑옷", minL: 15, look: { body: "#6a8a3a", legs: "#55702e", helmet: "#7aa040", boots: "#3a4f20", gloves: "#c8e070" }, perk: { thorns: 1 } });
defBase("a_diamond", { slot: "armor", name: "다이아 갑옷", minL: 18, look: ARMOR_LOOK(2), perk: { hearts: 2 } });
defBase("a_frost", { slot: "armor", name: "서리 갑옷", minL: 22, look: { body: "#bfe6fa", legs: "#9fd0ea", helmet: "#dff4ff", boots: "#7fb0ca", gloves: "#cfeeff" }, perk: { frost: 1, hearts: 1 } });
defBase("a_obsidian", { slot: "armor", name: "흑요석 갑옷", minL: 26, look: ARMOR_LOOK(3), perk: { hearts: 1, block: 0.06 } });
defBase("a_dragon", { slot: "armor", name: "용 갑옷", minL: 32, look: ARMOR_LOOK(4), perk: { regen: 8, hearts: 1 } });
// 장신구 (모든 직업)
defBase("c_power", { slot: "charm", name: "힘 반지", minL: 0, icon: "ring", color: "#ff8a5a", perk: { dmg: 0.06 } });
defBase("c_life", { slot: "charm", name: "생명 목걸이", minL: 3, icon: "amulet", color: "#ff6b8a", perk: { hearts: 1 } });
defBase("c_wind", { slot: "charm", name: "바람 깃털", minL: 6, icon: "feather", color: "#bdf6ff", perk: { speed: 0.06, roll: 0.08 } });
defBase("c_luck", { slot: "charm", name: "행운 클로버", minL: 9, icon: "clover", color: "#6ad35f", perk: { luck: 0.15 } });
defBase("c_quiver", { slot: "charm", name: "화살 주머니", minL: 12, icon: "quiver", color: "#c9a36a", perk: { bow: 0.12 } });
defBase("c_thorn", { slot: "charm", name: "가시 팔찌", minL: 15, icon: "bracelet", color: "#c8e070", perk: { thorns: 1 } });

// ----- 보스 전설 장비 (보스방 보스가 줘요. 처음 잡으면 꼭!) -----
// forms: 무기는 받는 직업에 맞는 모양으로 나와요
const LEGEND_FORMS = (name, warriorType, extra = {}) => ({
  warrior: { name: name.w, type: warriorType }, mage: { name: name.m, type: "sword" }, druid: { name: name.d, type: "sword" }, hunter: { name: name.h, type: "sword" }, ...extra,
});
const BOSS_LEGENDS = {
  cave: "L_cave", crypt: "L_crypt", jungle: "L_jungle", desert: "L_desert", ice: "L_ice", swamp: "L_swamp",
  volcano: "L_volcano", castle: "L_castle", mine: "L_mine", sky: "L_sky", coral: "L_coral", void: "L_void",
};
defBase("L_cave", { slot: "charm", legend: "cave", name: "버섯 왕관", minL: 0, icon: "crown", color: "#e04a4a", perk: { hearts: 2, regen: 7 }, desc: "하트 +2, 천천히 하트가 차요" });
defBase("L_crypt", { slot: "weapon", legend: "crypt", name: "거인 뼈", minL: 0, color: "#efe6cf", mul: 1.12,
  forms: LEGEND_FORMS({ w: "거인 뼈 망치", m: "거인 뼈 지팡이", d: "거인 뼈 지팡이", h: "거인 뼈 단검" }, "hammer"), desc: "아주 단단한 뼈로 만든 무기 (공격력 +12%)" });
defBase("L_jungle", { slot: "armor", legend: "jungle", name: "말랑 젤리 갑옷", minL: 0, look: { body: "#7be86a", legs: "#5fc84f", helmet: "#9bf08a", boots: "#3fa83a", gloves: "#7be86a" }, perk: { block: 0.14, knock: 0.3, hearts: 1 }, desc: "통통 튕겨내요: 잘 막고 덜 밀려나요" });
defBase("L_desert", { slot: "charm", legend: "desert", name: "파라오의 황금 반지", minL: 0, icon: "ring", color: "#ffcc33", perk: { luck: 0.3, dmg: 0.05 }, desc: "에메랄드와 화폐가 훨씬 잘 나와요" });
defBase("L_ice", { slot: "bow", legend: "ice", name: "서리 여왕의 활", type: "long", minL: 0, color: "#9fe6ff", mul: 1.12, perk: { pierce: 1 }, desc: "화살이 몬스터를 하나 더 뚫어요" });
defBase("L_swamp", { slot: "armor", legend: "swamp", name: "거미줄 망토", minL: 0, look: { body: "#5a3a6e", legs: "#4a2e5c", helmet: "#d8c8ff", boots: "#3a2448", gloves: "#d8c8ff" }, perk: { speed: 0.1, roll: 0.15 }, desc: "빨라지고 구르기를 자주 해요" });
defBase("L_volcano", { slot: "weapon", legend: "volcano", name: "용의 숨결", minL: 0, color: "#ff6a2a", mul: 1.1, effect: "burn",
  forms: LEGEND_FORMS({ w: "용의 숨결 검", m: "용의 숨결 지팡이", d: "용의 숨결 지팡이", h: "용의 숨결 단검" }, "sword"), desc: "맞으면 불이 붙어요 (공격력 +10%)" });
defBase("L_castle", { slot: "weapon", legend: "castle", name: "왕의 영혼", minL: 0, color: "#e8e0c8", mul: 1.1, effect: "heal",
  forms: LEGEND_FORMS({ w: "왕의 영혼 낫", m: "왕의 영혼 지팡이", d: "왕의 영혼 지팡이", h: "왕의 영혼 단검" }, "scythe"), desc: "쓰러뜨리면 하트가 차요 (공격력 +10%)" });
defBase("L_mine", { slot: "armor", legend: "mine", name: "수정 심장 갑옷", minL: 0, look: { body: "#9ff0ff", legs: "#7fd0e0", helmet: "#bff8ff", boots: "#5fb0c0", gloves: "#9ff0ff" }, perk: { hearts: 4 }, desc: "하트 +4" });
defBase("L_sky", { slot: "bow", legend: "sky", name: "폭풍 군주의 활", type: "storm", minL: 0, color: "#bdf6ff", mul: 1.1, desc: "화살 5발! (공격력 +10%)" });
defBase("L_coral", { slot: "charm", legend: "coral", name: "먹물 진주 목걸이", minL: 0, icon: "amulet", color: "#5a4a7a", perk: { thorns: 2, block: 0.06 }, desc: "때린 몬스터도 아프고, 더 잘 막아요" });
defBase("L_void", { slot: "weapon", legend: "void", name: "공허의 칼날", minL: 0, color: "#a060ff", mul: 1.15, effect: "chain",
  forms: LEGEND_FORMS({ w: "공허의 칼날", m: "공허의 지팡이", d: "공허의 지팡이", h: "공허의 단검" }, "sword"), desc: "옆 몬스터에게 번개가 튀어요 (공격력 +15%)" });

const STARTER = { warrior: "w_wood", mage: "s_wood", druid: "d_vine", hunter: "h_knife" };

// ===== 장비 하나 =====
function itemBase(it) { return (it && ITEM_BASES[it.b]) || null; }
function newUid() { return "i" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
function makeItem(baseId, r, l, extra = {}) {
  const b = ITEM_BASES[baseId];
  const it = { u: newUid(), b: baseId, r: Math.max(0, Math.min(4, r | 0)), l: Math.max(0, Math.round(l)), p: 0, ...extra };
  if (b && b.legend) it.r = Math.max(3, it.r);
  return it;
}
// 장비 이름 (전설 무기는 받은 직업 모양)
function itemForm(it) { const b = itemBase(it); return b && b.forms ? b.forms[it.f] || b.forms.warrior : null; }
function itemName(it) { const b = itemBase(it); if (!b) return "???"; const f = itemForm(it); return f ? f.name : b.name; }
function itemLabel(it) { return `${itemName(it)}${it.p ? ` +${it.p}` : ""}`; }
function itemType(it) { const b = itemBase(it); const f = itemForm(it); return (f && f.type) || (b && b.type); }
function itemRarity(it) { return RARITIES[(it && it.r) || 0]; }
function itemColor(it) { const b = itemBase(it); return (b && b.color) || (b && b.look && b.look.body) || "#bbb"; }
// 강화·등급이 곱해지는 정도
function itemMul(it) { const b = itemBase(it) || {}; return itemRarity(it).mul * (1 + 0.06 * (it.p || 0)) * (b.mul || 1); }
// 특별 능력 세기: +5 에서 한 단계, +10 에서 또 한 단계
function perkK(it) { return 1 + ((it.p || 0) >= 5 ? 0.25 : 0) + ((it.p || 0) >= 10 ? 0.25 : 0); }
function canUseItem(it, cls) { const b = itemBase(it); return !!b && (!b.cls || b.cls.includes(cls || (game.profile && game.profile.cls) || "warrior")); }
// 같은 칸끼리 비교하는 "힘" 점수
function itemScore(it) {
  if (!it) return 0;
  const b = itemBase(it) || {}, pk = perkK(it), pr = b.perk || {};
  let s = (10 + 2 * it.l) * itemMul(it);
  if (b.slot === "armor" || b.slot === "charm") s += 8 * pk * ((pr.hearts || 0) + 10 * (pr.block || 0) + 10 * (pr.speed || 0) + 5 * (pr.roll || 0) + 6 * (pr.dmg || 0) * 5 + 3 * (pr.luck || 0) * 3 + (pr.thorns || 0) + (pr.regen ? 2 : 0) + (pr.frost ? 1 : 0) + 4 * (pr.bow || 0) * 5);
  if (b.effect) s += 4;
  return Math.round(s);
}

// ----- 장비 하나가 주는 힘 -----
function weaponFromItem(it, cls) {
  const t = WEAPON_TYPES[itemType(it)] || WEAPON_TYPES.sword;
  const b = itemBase(it) || {};
  return {
    id: it.b, type: itemType(it) || "sword", level: it.l, plus: it.p || 0, rarity: it.r,
    name: itemLabel(it),
    damage: weaponBaseDamage(it.l) * t.mul * itemMul(it),
    range: t.range, cooldown: t.cooldown, arc: t.arc, length: t.length,
    color: b.color || "#a0784a", effect: it.e || b.effect || null,
    glow: it.r >= 3 ? RARITIES[it.r].color : null,
  };
}
function bowFromItem(it) {
  const t = BOW_TYPES[itemType(it)] || BOW_TYPES.basic;
  const b = itemBase(it) || {};
  return {
    id: it.b, level: it.l, plus: it.p || 0, rarity: it.r, name: itemLabel(it),
    damage: bowBaseDamage(it.l) * t.mul * itemMul(it),
    cooldown: t.cooldown, speed: t.speed, pierce: (t.pierce || 0) + Math.round(((b.perk && b.perk.pierce) || 0)), multishot: t.multishot || 1,
    color: b.color || "#a0703a",
  };
}
// 갑옷 + 장신구 -> 주인공 갑옷 값 (하트, 막기, 빠르기, 가시, 회복...)
function armorFromItems(arm, charm) {
  const out = { id: "gear", name: arm ? itemLabel(arm) : "맨몸", hearts: 0, block: 0, speed: 0, roll: 0, knockResist: 0, regen: 0, thorns: 0, frost: 0, luck: 0, dmgMul: 1, bowMul: 1 };
  if (arm) {
    const b = itemBase(arm) || {}, rm = itemRarity(arm).mul * (1 + 0.06 * (arm.p || 0)), pk = perkK(arm), pr = b.perk || {};
    out.hearts += Math.floor(arm.l * 0.4 * rm) + Math.round((pr.hearts || 0) * pk);
    out.block += 0.6 * (1 - Math.exp(-arm.l * rm / 12)) + (pr.block || 0) * pk;
    out.speed += (pr.speed || 0) * pk; out.roll += (pr.roll || 0) * pk;
    out.knockResist += Math.min(0.5, arm.l / 50) + (pr.knock || 0) * pk;
    if (pr.thorns) out.thorns += pr.thorns * pk * (1 + arm.l * 0.08);
    if (pr.frost) out.frost = 1;
    if (pr.regen) out.regen = pr.regen / pk;
    if (b.look) Object.assign(out, b.look);
    if (arm.r >= 4) out.shimmerSet = true;
  }
  if (charm) {
    const b = itemBase(charm) || {}, pk = perkK(charm) * itemRarity(charm).mul * (1 + 0.04 * (charm.p || 0)), pr = b.perk || {}, l = charm.l;
    if (pr.hearts) out.hearts += Math.round(pr.hearts * pk) + Math.floor(l / 6);
    if (pr.dmg) out.dmgMul *= 1 + (pr.dmg + 0.004 * l) * pk;
    if (pr.bow) out.bowMul *= 1 + (pr.bow + 0.005 * l) * pk;
    if (pr.speed) out.speed += Math.min(0.2, (pr.speed + 0.001 * l) * pk);
    if (pr.roll) out.roll += pr.roll * pk;
    if (pr.luck) out.luck += pr.luck * pk;
    if (pr.block) out.block += pr.block * pk;
    if (pr.thorns) out.thorns += pr.thorns * pk * (1 + l * 0.08);
    if (pr.regen) out.regen = out.regen ? Math.min(out.regen, pr.regen / pk) : pr.regen / pk;
  }
  out.block = Math.min(0.75, out.block); out.roll = Math.min(0.35, out.roll); out.knockResist = Math.min(0.8, out.knockResist);
  return out;
}

// ===== 저장 칸 =====
function lootFields(pr) {
  if (!Array.isArray(pr.bag)) pr.bag = [];
  pr.bag = pr.bag.filter((it) => it && ITEM_BASES[it.b]);
  if (!pr.eq || typeof pr.eq !== "object") { migrateGear(pr); }
  for (const s of EQ_SLOTS) if (pr.eq[s.id] && !ITEM_BASES[pr.eq[s.id].b]) pr.eq[s.id] = null;
  const cls = pr.cls || "warrior";
  if (!pr.eq.weapon) pr.eq.weapon = makeItem(STARTER[cls] || "w_wood", 0, 0);
  if (!pr.eq.bow) pr.eq.bow = makeItem("b_basic", 0, 0);
  if (!pr.eq.armor) pr.eq.armor = makeItem("a_cloth", 0, 0);
  if (pr.eq.charm === undefined) pr.eq.charm = null;
  pr.shopStock = Array.isArray(pr.shopStock) ? pr.shopStock.filter((it) => it && ITEM_BASES[it.b]) : [];
  // 가게 찜: 다음 판에 물건이 바뀌어도 남겨 둘 장비 (가게에 있는 것만, SHOP_HOLD_MAX 개까지)
  pr.shopHold = Array.isArray(pr.shopHold) ? [...new Set(pr.shopHold.filter((u) => pr.shopStock.some((it) => it.u === u)))].slice(0, SHOP_HOLD_MAX) : [];
  pr.legends = pr.legends || {}; // 받은 보스 전설 (맵 id)
}

// 장비 레벨 L 에서 고를 종류: 그 레벨까지 나온 것 중 새 것일수록 잘 나와요
function pickBase(slot, L, cls) {
  let list = Object.values(ITEM_BASES).filter((b) => b.slot === slot && !b.legend && b.minL <= L);
  if (slot === "weapon") {
    const own = list.filter((b) => !b.cls || b.cls.includes(cls));
    const other = list.filter((b) => b.cls && !b.cls.includes(cls));
    list = Math.random() < 0.8 || !other.length ? own : other; // 가끔 다른 직업 무기 (보관함으로 다른 캐릭터에게)
  }
  if (!list.length) return null;
  list.sort((a, b) => a.minL - b.minL);
  const w = list.map((_, i) => Math.pow(i + 1, 1.6));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i].id; }
  return list[list.length - 1].id;
}
// 어디서 떨어졌나에 따라 등급 (보통·희귀·영웅·전설·신화)
const DROP_RARITY = {
  mob: [80, 18, 2, 0, 0],
  chest: [68, 27, 5, 0, 0],
  elite: [48, 38, 12, 2, 0],
  goldChest: [30, 45, 20, 5, 0],
  guard: [0, 60, 33, 7, 0],
  boss: [0, 35, 45, 17, 3],
};
function rollRarity(source, L) {
  const w = (DROP_RARITY[source] || DROP_RARITY.mob).slice();
  const shift = Math.min(25, L * 0.4); // 맵 레벨이 높을수록 좋은 등급이 조금 더
  const take = Math.min(w[0], shift); w[0] -= take; w[1] += take * 0.6; w[2] += take * 0.32; w[3] += take * 0.08;
  if (game.profile && game.profile.difficulty === "nightmare") { w[4] += source === "boss" ? 4 : source === "guard" || source === "goldChest" ? 0.6 : 0; w[3] *= 1.4; }
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}
function dropIlvl(L, bonus = 0) { return Math.max(0, Math.round(0.85 * (L - 1)) + Math.floor(Math.random() * 3) - 1 + bonus); }
const SLOT_WEIGHTS = { weapon: 32, bow: 24, armor: 26, charm: 18 };
function rollItem(source, L, cls) {
  cls = cls || (game.profile && game.profile.cls) || "warrior";
  let r = Math.random() * 100, slot = "weapon";
  for (const [s, w] of Object.entries(SLOT_WEIGHTS)) { r -= w; if (r <= 0) { slot = s; break; } }
  const l = dropIlvl(L, source === "boss" ? 1 : 0);
  const base = pickBase(slot, l, cls) || pickBase("weapon", l, cls);
  return makeItem(base, rollRarity(source, L), l);
}
// 보스 전설 장비
function makeLegend(mapId, L, cls) {
  const id = BOSS_LEGENDS[mapId]; if (!id) return null;
  const it = makeItem(id, game.profile.difficulty === "nightmare" && Math.random() < 0.08 ? 4 : 3, dropIlvl(L, 1));
  if (ITEM_BASES[id].forms) it.f = cls || game.profile.cls || "warrior";
  return it;
}

// ===== 가방 =====
function codexGear(it) {
  const pr = game.profile; if (!pr.codex) return;
  const g = (pr.codex.gear = pr.codex.gear || {});
  g[it.b] = Math.max(g[it.b] === undefined ? -1 : g[it.b], it.r);
}
// 장비 받기 (가방이 꽉 차면 가장 약한 것을 팔아요. 전설·신화는 꼭 넣어요)
function giveItem(it, opts = {}) {
  const pr = game.profile;
  it.n = true;
  codexGear(it);
  if (game.run && game.scene === "dungeon") { game.run.items = game.run.items || []; game.run.items.push(it.u); }
  // 팔기는 캠프 상점에서만: 가방이 꽉 차도 넣어 두고(넘쳐도 돼요) 캠프에서 팔거나 보관함에 넣어요.
  // 너무 넘치면(가방 2배) 공용 보관함으로, 거기도 꽉 차면 가장 약한 장비를 두고 와요 (팔지 않아요)
  let sold = null;
  if (pr.bag.length >= BAG_MAX && !(pr.bagFullT > game.time)) { pr.bagFullT = game.time + 20; showMessage("가방이 넘쳐요! 캠프 상점에서 팔거나 보관함에 넣어요", 2.5, false, "#ffb070"); }
  if (pr.bag.length >= BAG_MAX * 2) {
    const st = typeof sharedStash === "function" ? sharedStash() : null;
    if (st && st.length < STASH_MAX) { st.push(it); if (typeof saveShared === "function") saveShared(); sold = it; showMessage(`가방이 너무 넘쳐서 ${josa(itemName(it), "을/를")} 공용 보관함에 넣었어요`, 2.5, false, "#ffb070"); }
    else {
      const cand = pr.bag.filter((x) => !x.lock && x.r < 3).sort((a, b) => itemScore(a) - itemScore(b))[0];
      if (cand && itemScore(cand) < itemScore(it)) { pr.bag = pr.bag.filter((x) => x !== cand); showMessage(`가방·보관함이 꽉 차서 ${josa(itemName(cand), "을/를")} 두고 왔어요`, 2.5, false, "#ffb070"); }
      else { sold = it; showMessage(`가방·보관함이 꽉 차서 ${josa(itemName(it), "을/를")} 못 가져왔어요`, 2.5, false, "#ffb070"); }
    }
  }
  if (sold !== it) pr.bag.push(it);
  if (sold !== it && !opts.quiet) {
    const p = game.player;
    if (p) addFloatText(p.x, p.y, `${itemRarity(it).name} ${itemName(it)}!`, itemRarity(it).color, it.r >= 3 ? 22 : 17);
    // 지금 것보다 좋으면 "바로 장착?" (hud)
    const slot = itemBase(it).slot, cur = pr.eq[slot];
    if (canUseItem(it) && itemScore(it) > itemScore(cur)) game.betterItem = { u: it.u, t: game.time };
    if (it.r >= 3 && typeof sfx !== "undefined") sfx.levelUp();
  }
  return sold !== it;
}
function findItem(u) {
  const pr = game.profile;
  for (const s of EQ_SLOTS) if (pr.eq[s.id] && pr.eq[s.id].u === u) return { it: pr.eq[s.id], where: "eq", slot: s.id };
  const i = pr.bag.findIndex((x) => x.u === u); if (i >= 0) return { it: pr.bag[i], where: "bag", i };
  const st = typeof sharedStash === "function" ? sharedStash() : [];
  const j = st.findIndex((x) => x.u === u); if (j >= 0) return { it: st[j], where: "stash", i: j };
  return null;
}
// 장착: 가방(또는 보관함)에서 꺼내 끼고, 끼던 건 가방으로
function equipItem(u) {
  const pr = game.profile, f = findItem(u);
  if (!f || f.where === "eq") return false;
  const it = f.it, slot = itemBase(it).slot;
  if (!canUseItem(it)) { showMessage(`${CLASS_DEFS && CLASS_DEFS[(itemBase(it).cls || [])[0]] ? CLASS_DEFS[itemBase(it).cls[0]].name : "다른 직업"}만 쓸 수 있어요`, 2, false, "#ffb070"); return false; }
  if (f.where === "bag") pr.bag.splice(f.i, 1); else { sharedStash().splice(f.i, 1); saveShared(); }
  const old = pr.eq[slot];
  pr.eq[slot] = it; it.n = false;
  if (old) pr.bag.push(old);
  if (game.betterItem && game.betterItem.u === u) game.betterItem = null;
  refreshGear();
  if (typeof sfx !== "undefined") sfx.equip();
  return true;
}
function unequipCharm() {
  const pr = game.profile;
  if (!pr.eq.charm || pr.bag.length >= BAG_MAX) return false;
  pr.bag.push(pr.eq.charm); pr.eq.charm = null; refreshGear(); return true;
}

// ----- 값 -----
// 가게에서 사는 값: 그 등급의 화폐로만
function buyPrice(it) {
  const r = it.r, l = it.l;
  if (r === 0) return { cur: "emerald", n: 25 + 4 * l };
  if (r === 1) return { cur: "silver", n: 3 + Math.floor(l / 6) };
  if (r === 2) return { cur: "amethyst", n: 3 + Math.floor(l / 8) };
  if (r === 3) return { cur: "gold", n: 3 + Math.floor(l / 10) };
  return { cur: "diamond", n: 2 + Math.floor(l / 15) };
}
// ----- 파는 값: 장비가 얼마나 좋은지 따져요 (가게에서만 팔아요) -----
// 값(에메랄드로 쳐서) = 가게에서 사는 값(등급·레벨)의 40% × 강화(+1마다 25%) × 마법 부여(1.3) × 보스 전설(2)
// 그 값을 "2개 이상 나오는 가장 높은 화폐"로 줘요 (그 장비 등급 화폐까지). 전에는 희귀 이상이 거의 다 화폐 1개였어요
const SELL_RATE = 0.4;
function itemWorth(it) {
  const bp = buyPrice(it), b = itemBase(it) || {};
  let v = bp.n * CUR[bp.cur].value * SELL_RATE;
  v *= 1 + 0.25 * (it.p || 0);
  if (it.e) v *= 1.3;
  if (b.legend) v *= 2;
  return v;
}
function sellValue(it) {
  const v = itemWorth(it), top = CUR[RARITIES[it.r].cur].tier;
  for (let t = top; t > 0; t--) { const n = v / CURRENCIES[t].value; if (n >= 2) return { cur: CURRENCIES[t].id, n: Math.round(n) }; }
  return { cur: "emerald", n: Math.max(1, Math.round(v)) };
}
function sellItemU(u) {
  const pr = game.profile, f = findItem(u);
  if (!(game.scene === "lobby" && game.overlay === "shop")) return { ok: false, why: "팔기는 캠프 상점에서만 해요" }; // 던전·캐릭터 창에선 못 팔아요
  if (!f || f.where === "eq") return { ok: false, why: "끼고 있는 건 못 팔아요" };
  if (f.it.lock) return { ok: false, why: "잠근 장비는 못 팔아요 (잠금을 풀어요)" };
  const v = sellValue(f.it);
  if (f.where === "bag") pr.bag.splice(f.i, 1); else { sharedStash().splice(f.i, 1); saveShared(); }
  curAdd(v.cur, v.n);
  saveProfile();
  hookRun("itemSold", { kind: "item", id: f.it.b, name: itemName(f.it) }, 1, v.n);
  return { ok: true, price: v };
}

// ----- 강화 (+1 ~ +10, 실패 없음) -----
// +1~+3: 장비 등급 화폐, +4부터: 한 단계 위 화폐
function plusCost(it) {
  const p = it.p || 0, r = it.r, l = it.l;
  if (p >= PLUS_MAX) return null;
  const c = Math.min(4, r + (p >= 3 ? 1 : 0));
  if (c === 0) return { cur: "emerald", n: Math.round((8 + 4 * p) * (1 + 0.06 * l)) };
  if (c === 4) return { cur: "diamond", n: 1 + Math.floor(p / 3) };
  return { cur: CUR_ORDER[c], n: 1 + Math.floor(p / 2) + Math.floor(l / 20) };
}
function plusItem(u) {
  const f = findItem(u); if (!f) return { ok: false, why: "장비가 없어요" };
  const it = f.it, cost = plusCost(it);
  if (!cost) return { ok: false, why: "최고 강화예요! (+10)" };
  if (!pay(cost)) return { ok: false, why: lackText(cost) };
  it.p = (it.p || 0) + 1;
  refreshGear();
  return { ok: true, cost, big: it.p === 5 || it.p === 10 };
}

// ===== 지금 끼고 있는 장비 -> 주인공 =====
function eqWeapon() { const it = game.profile.eq && game.profile.eq.weapon; return it ? weaponFromItem(it) : null; }
function eqBow() { const it = game.profile.eq && game.profile.eq.bow; return it ? bowFromItem(it) : null; }
function eqArmor() { const e = game.profile.eq || {}; return armorFromItems(e.armor, e.charm); }
// 끼고 있는 장비를 "기대 장비(희귀 +2 = x1.25)" 레벨로 바꾼 값 (추천 맵 레벨·몬스터 세기 비교용)
function itemEqLevel(x) { if (!x) return 0; return Math.max(0, ((1 + 0.2 * x.l) * itemRarity(x).mul * (1 + 0.06 * (x.p || 0)) / 1.25 - 1) / 0.2); }
function eqAvgLevel() {
  const e = game.profile.eq || {};
  const main = (game.profile.cls === "hunter" ? e.bow : e.weapon) || e.weapon;
  return (2 * itemEqLevel(main) + itemEqLevel(e.armor)) / 3;
}

// ===== 예전 저장(부위 7개 레벨) -> 장비 =====
// 지금 힘과 같은 장비를 만들어 줘요 (손해 없게)
function bestBaseFor(slot, L, filter) {
  const list = Object.values(ITEM_BASES).filter((b) => b.slot === slot && !b.legend && b.minL <= L && (!filter || filter(b))).sort((a, b) => b.minL - a.minL);
  return list[0] ? list[0].id : null;
}
function migrateGear(pr) {
  pr.eq = { weapon: null, bow: null, armor: null, charm: null };
  const g = pr.gear;
  const cls = pr.cls || "warrior";
  if (!g || !Object.values(g).some((v) => v > 0) && (!pr.weaponTypes || pr.weaponTypes.length <= 1) && (!pr.bowTypes || pr.bowTypes.length <= 1)) { delete pr.gear; return; }
  const lv = (s) => Math.max(0, Math.floor(g[s] || 0));
  const armorMin = Math.min(...["head", "chest", "legs", "arms", "boots"].map(lv));
  const extra = (1 + 0.015 * lv("arms")) * (1 + 0.04 * Math.floor(armorMin / 5)); // 예전 팔·세트 보너스도 장비에 담아요
  const rarOf = (L) => (L >= 20 ? 2 : L >= 10 ? 1 : 0);
  const solve = (base0, per, L) => { const r = rarOf(L); const want = (base0 + per * L) * extra; return { r, l: Math.max(L, Math.ceil((want / RARITIES[r].mul - base0) / per)) }; };
  // 무기: 가진 무기 종류마다 하나씩 (같은 힘)
  const w = solve(1, 0.2, lv("weapon"));
  const typeBase = { sword: (b) => b.type === "sword" && !b.effect && b.cls && b.cls.includes("warrior"), dagger: (b) => b.id === "w_dagger", spear: (b) => b.id === "w_spear", axe: (b) => b.id === "w_axe", hammer: (b) => b.id === "w_hammer", scythe: (b) => b.id === "w_scythe" };
  const made = [];
  for (const t of pr.weaponTypes || ["sword"]) {
    const filt = typeBase[t]; if (!filt) continue;
    const id = bestBaseFor("weapon", w.l, filt) || bestBaseFor("weapon", 99, filt); if (!id) continue;
    const it = makeItem(id, w.r, w.l);
    if (t === pr.weaponType && pr.enchant) it.e = pr.enchant;
    made.push([t, it]);
  }
  const mine = made.find(([t]) => t === pr.weaponType) || made[0];
  if (cls === "warrior" && mine) pr.eq.weapon = mine[1];
  else { const id = bestBaseFor("weapon", w.l, (b) => b.cls && b.cls.includes(cls) && !b.effect) || STARTER[cls]; pr.eq.weapon = makeItem(id, w.r, w.l, pr.enchant ? { e: pr.enchant } : {}); }
  for (const [, it] of made) if (it !== pr.eq.weapon) pr.bag.push(it);
  // 활
  const bw = solve(1.5, 0.22, lv("bow"));
  const bowBase = { basic: "b_basic", rapid: "b_rapid", long: "b_long", triple: "b_triple", crossbow: "b_cross", storm: "b_storm" };
  for (const t of pr.bowTypes || ["basic"]) {
    if (!bowBase[t]) continue;
    const it = makeItem(bowBase[t], bw.r, bw.l);
    if (t === pr.bowType && !pr.eq.bow) pr.eq.bow = it; else pr.bag.push(it);
  }
  // 갑옷: 다섯 부위 평균 레벨, 하트가 예전보다 적지 않게
  const avgA = Math.round(["head", "chest", "legs", "arms", "boots"].reduce((a, s) => a + lv(s), 0) / 5);
  const oldHearts = Math.floor(lv("head") / 4) + Math.floor(lv("legs") / 6) + Math.floor(armorMin / 5);
  const ar = rarOf(avgA);
  const aid = bestBaseFor("armor", avgA, (b) => !(b.perk && (b.perk.speed || b.perk.thorns || b.perk.frost))) || "a_cloth";
  let arm = makeItem(aid, ar, avgA);
  for (let k = 0; k < 40 && armorFromItems(arm, null).hearts < oldHearts; k++) arm.l++;
  pr.eq.armor = arm;
  // 장신구: 신발·팔 강화는 바람 깃털로
  const boots = lv("boots");
  if (boots > 0) pr.eq.charm = makeItem("c_wind", rarOf(boots), boots);
  // 아주 예전 저장(무기 하나하나 사던 때)이 백업에 있으면, 그 이름 그대로 돌려줘요 (나무 칼, 불꽃 검, 용 도끼...)
  const v1 = typeof lsGet === "function" ? lsGet(SAVE_KEY + "-backup-v1") : null;
  if (v1 && typeof v1 === "object") {
    const have = new Set([pr.eq.weapon, pr.eq.bow, pr.eq.armor, ...pr.bag].filter(Boolean).map((x) => x.b));
    const add = (id, r, l, eq) => {
      if (!ITEM_BASES[id]) return;
      if (have.has(id)) { if (eq) { const x = [...pr.bag].find((y) => y.b === id); const slot = ITEM_BASES[id].slot; if (x && (slot !== "weapon" || cls === "warrior")) { pr.bag.splice(pr.bag.indexOf(x), 1); if (pr.eq[slot]) pr.bag.push(pr.eq[slot]); pr.eq[slot] = x; } } return; }
      have.add(id);
      const it = makeItem(id, r, l);
      const slot = ITEM_BASES[id].slot;
      if (eq && (slot !== "weapon" || cls === "warrior")) { if (pr.eq[slot]) pr.bag.push(pr.eq[slot]); if (slot === "weapon" && pr.enchant) it.e = pr.enchant; pr.eq[slot] = it; } else pr.bag.push(it);
    };
    for (const id of Array.isArray(v1.weapons) ? v1.weapons : []) add("w_" + id, w.r, w.l, id === v1.weapon);
    const OB = { bow: "b_basic", rapid: "b_rapid", longbow: "b_long", triple: "b_triple", hunter: "b_hunter", crossbow: "b_cross", storm: "b_storm" };
    for (const id of Array.isArray(v1.bows) ? v1.bows : []) add(OB[id], bw.r, bw.l, id === v1.bow);
    const OA = { cloth: "a_cloth", leather: "a_leather", chain: "a_chain", ninja: "a_ninja", iron: "a_iron", turtle: "a_turtle", thorn: "a_thorn", diamond: "a_diamond", frost: "a_frost", netherite: "a_obsidian", dragon: "a_dragon" };
    for (const id of Array.isArray(v1.armors) ? v1.armors : []) if (id !== "cloth") add(OA[id], ar, pr.eq.armor.l, id === v1.armor);
  }
  // 가방에 다 안 들어가면 공용 보관함으로
  while (pr.bag.length > BAG_MAX && typeof sharedStash === "function") { sharedStash().push(pr.bag.pop()); if (typeof saveShared === "function") saveShared(); }
  pr.oldGear = { gear: { ...g }, weaponTypes: pr.weaponTypes, bowTypes: pr.bowTypes, weaponType: pr.weaponType, bowType: pr.bowType, enchant: pr.enchant };
  delete pr.gear;
  pr.gearNote = "장비가 새 방식으로 바뀌었어요! 가방(캐릭터 창)을 열어 보세요";
}

hookOn("profileLoaded", (pr) => { lootFields(pr); }, 45);

// ===== 떨어뜨리기 =====
function dropItemPickup(it, x, y) {
  const a = Math.random() * Math.PI * 2, s = 0.8 + Math.random() * 1.2;
  pickups.push({ type: "item", item: it, x, y, z: 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 3, t: 0 });
}
function inBossRoom() { return !!(game.keyhunt && game.keyhunt.inBoss); }
hookOn("monsterKilled", (m) => {
  if (game.scene !== "dungeon" || !m || m.ally || m.dummy || !m.def) return;
  const L = game.mapLevel || 1;
  coinsForKill(m, L);
  let src = null;
  if (m.boss) { if (!inBossRoom()) src = "boss"; }
  else if (m.keyGuard) src = "guard";
  else if (m.def.treasure) src = "goldChest";
  else if (m.elite) src = Math.random() < 0.22 ? "elite" : null;
  else src = Math.random() < 0.012 ? "mob" : null;
  if (src) dropItemPickup(rollItem(src, L), m.x, m.y);
}, 35);

// 상자: 금 상자는 꼭, 보통 상자는 가끔
function chestGear(c) {
  const L = game.mapLevel || 1;
  coinsForChest(c, L);
  if (c.gold || Math.random() < 0.28) {
    const it = rollItem(c.gold ? "goldChest" : "chest", L);
    const a = Math.random() * Math.PI * 2;
    pickups.push({ type: "item", item: it, x: c.x, y: c.y, z: 0.5, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, vz: 4, t: 0 });
  }
}

// 보스방 보스: 장비 1개 + 전설(처음이면 꼭, 아니면 가끔) + 화폐. 바로 가방으로 (결과창이 바로 떠요)
function bossRoomLoot(mapId) {
  const pr = game.profile, L = game.mapLevel || 1;
  const key = `${mapId}:${pr.difficulty}`;
  const first = !(pr.bossFirst || (pr.bossFirst = {}))[key];
  const coins = bossCoins(L, first);
  for (const [id, n] of Object.entries(coins)) curAdd(id, n);
  const got = [rollItem("boss", L)];
  const legendChance = { easy: 0.15, normal: 0.22, hard: 0.3, nightmare: 0.4 }[pr.difficulty] || 0.22;
  let gotLegend = false;
  if (!pr.legends[mapId] || Math.random() < legendChance) { const lg = makeLegend(mapId, L); if (lg) { got.push(lg); gotLegend = true; } }
  recShared("bossLoot", { map: mapId, legend: gotLegend }); // 보스 첫 보상·전설 받은 수 (같이 하기: 친구도, records.js)
  for (const it of got) giveItem(it, { quiet: true });
  if (game.run) { game.run.bossLoot = got.map((x) => x.u); }
  return { coins, items: got };
}

// 던전이 끝나면 바닥에 남은 장비·화폐는 저절로 가방으로 (못 주워도 괜찮아요)
hookOn("endRun", () => {
  if (game.result) return false;
  for (const e of pickups) if (!e.taken && (e.type === "item" || e.type === "coin" || e.type === "buffpot")) { e.taken = true; onPickup(e); }
  pickups = pickups.filter((e) => !e.taken);
  return false;
}, 10);

// ===== 가게 물건 (던전을 다녀올 때마다 바뀌어요) =====
const SHOP_HOLD_MAX = 2;
function shopRestock(force) {
  const pr = game.profile;
  // 판 수가 그대로면 바꾸지 않아요 (전에는 "물건이 0개"도 새로 채울 이유로 봐서, 다 사면 가게를 다시 열 때마다 또 생겼어요)
  if (!force && pr.shopRuns === pr.stats.runs) return;
  pr.shopRuns = pr.stats.runs;
  const held = (pr.shopHold || []).map((u) => pr.shopStock.find((it) => it.u === u)).filter(Boolean);
  const L = Math.max(0, Math.round(0.85 * (pr.level - 1)));
  const rars = [0, 0, 1, 1, 2, 3];
  if (pr.level >= 25) rars.push(4);
  const cls = pr.cls || "warrior";
  pr.shopStock = rars.map((r, i) => {
    const slot = ["weapon", "armor", "bow", "charm", "weapon", "armor", "weapon"][i];
    const l = Math.max(0, L + Math.floor(Math.random() * 3) - 1);
    let base = pickBase(slot, l, cls);
    if (slot === "weapon" && !canUseItem({ b: base }, cls)) base = pickBase(slot, l, cls) || base;
    if (slot === "weapon" && !canUseItem({ b: base }, cls)) base = bestBaseFor("weapon", l, (b) => b.cls && b.cls.includes(cls)) || STARTER[cls];
    return makeItem(base, r, l);
  });
  // 찜한 장비는 그대로 두고, 같은 칸(무기·갑옷...)의 새 물건 하나를 빼서 개수를 맞춰요
  for (const h of held) {
    const slot = itemBase(h).slot;
    let j = pr.shopStock.findIndex((it) => itemBase(it).slot === slot);
    if (j < 0) j = 0;
    pr.shopStock.splice(j, 1);
  }
  pr.shopStock = [...held, ...pr.shopStock];
  pr.shopHold = held.map((it) => it.u);
}
// 찜하기 / 풀기
function toggleShopHold(u) {
  const pr = game.profile;
  if (!pr.shopStock.some((it) => it.u === u)) return { ok: false, why: "없어요" };
  pr.shopHold = pr.shopHold || [];
  const i = pr.shopHold.indexOf(u);
  if (i >= 0) { pr.shopHold.splice(i, 1); saveProfile(); return { ok: true, held: false }; }
  if (pr.shopHold.length >= SHOP_HOLD_MAX) return { ok: false, why: `찜은 ${SHOP_HOLD_MAX}개까지예요. 다른 찜을 먼저 풀어요` };
  pr.shopHold.push(u); saveProfile();
  return { ok: true, held: true };
}
function isShopHeld(u) { return (game.profile.shopHold || []).includes(u); }
function buyShopItem(u) {
  const pr = game.profile;
  const i = pr.shopStock.findIndex((x) => x.u === u); if (i < 0) return { ok: false, why: "없어요" };
  const it = pr.shopStock[i], price = buyPrice(it);
  if (pr.bag.length >= BAG_MAX) return { ok: false, why: "가방이 꽉 찼어요 (팔거나 보관함에 넣어요)" };
  if (!pay(price)) return { ok: false, why: lackText(price) };
  pr.shopStock.splice(i, 1);
  pr.shopHold = (pr.shopHold || []).filter((x) => x !== u);
  giveItem(it, { quiet: true });
  saveProfile();
  return { ok: true, price };
}

// ===== 치트·시험용: 모든 칸을 레벨 L 장비로 =====
// rar 기본 희귀 +2 = 몬스터 세기가 기대하는 장비
function gearSetAll(L, rar = 1, plus = 2) {
  const pr = game.profile, cls = pr.cls || "warrior";
  const w = bestBaseFor("weapon", L, (b) => b.cls && b.cls.includes(cls) && !b.effect) || STARTER[cls];
  pr.eq = {
    weapon: makeItem(w, rar, L, { p: plus }),
    bow: makeItem(bestBaseFor("bow", L, (b) => b.type === "long" || b.type === "basic") || "b_basic", rar, L, { p: plus }),
    armor: makeItem(bestBaseFor("armor", L, (b) => !(b.perk && (b.perk.speed || b.perk.thorns))) || "a_cloth", rar, L, { p: plus }),
    charm: makeItem("c_power", rar, L, { p: plus }),
  };
  pr.legend = false;
  if (typeof refreshGear === "function" && game.player) refreshGear();
}
