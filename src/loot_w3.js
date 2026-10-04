// ===== 월드 3 달 장비 이름 (설계서 docs/design/world3-moon.md 8-1) =====
// 강도는 기존 규칙 그대로(장비 레벨로 정해져요), 이름과 모습만 달 느낌. 달 맵 레벨(55~82)의 장비 레벨 46~70 에 맞췄어요.
// gearSetAll 이 고르는 효과 없는 칼(월석 검·은하 대검)·긴 활(초승달 긴 활)·무난한 갑옷(우주복·별철 갑옷)도 들어 있어요.
// 전사 무기 (무기 종류별)
defBase("w_moonstone", { slot: "weapon", cls: WAR, name: "월석 검", type: "sword", minL: 46, color: "#c8c8dc" });
defBase("w_starSpear", { slot: "weapon", cls: WAR, name: "별빛 창", type: "spear", minL: 48, color: "#ffe27a", effect: "slow" });
defBase("w_cometDagger", { slot: "weapon", cls: WAR, name: "혜성 쌍단검", type: "dagger", minL: 51, color: "#9fe8ff" });
defBase("w_craterAxe", { slot: "weapon", cls: WAR, name: "크레이터 도끼", type: "axe", minL: 54, color: "#8a8aa0" });
defBase("w_mallet", { slot: "weapon", cls: WAR, name: "달토끼 떡메", type: "hammer", minL: 58, color: "#f4f0ec", mul: 1.04 });
defBase("w_eclipseScythe", { slot: "weapon", cls: WAR, name: "일식 낫", type: "scythe", minL: 62, color: "#4a3028", effect: "heal" });
defBase("w_nebula", { slot: "weapon", cls: WAR, name: "성운 검", type: "sword", minL: 66, color: "#b08aff", effect: "chain" });
defBase("w_galaxy", { slot: "weapon", cls: WAR, name: "은하 대검", type: "sword", minL: 70, color: "#e0d8ff", mul: 1.06 });
// 마법사 지팡이
defBase("s_moon", { slot: "weapon", cls: ["mage"], name: "초승달 지팡이", type: "sword", minL: 46, color: "#ffe27a" });
defBase("s_comet", { slot: "weapon", cls: ["mage"], name: "혜성 지팡이", type: "sword", minL: 53, color: "#9fe8ff", effect: "slow" });
defBase("s_nebula", { slot: "weapon", cls: ["mage"], name: "성운 지팡이", type: "sword", minL: 60, color: "#b08aff", effect: "chain" });
defBase("s_fullmoon", { slot: "weapon", cls: ["mage"], name: "보름달 지팡이", type: "sword", minL: 68, color: "#fffaf0", mul: 1.06 });
// 드루이드 지팡이
defBase("d_crystal", { slot: "weapon", cls: ["druid"], name: "수정 나무 지팡이", type: "sword", minL: 46, color: "#9a7ae0", effect: "slow" });
defBase("d_moonvine", { slot: "weapon", cls: ["druid"], name: "달빛 덩굴 지팡이", type: "sword", minL: 54, color: "#d0d4e4", effect: "heal" });
defBase("d_starRoot", { slot: "weapon", cls: ["druid"], name: "별뿌리 지팡이", type: "sword", minL: 61, color: "#ffe27a", effect: "chain" });
defBase("d_worldTree", { slot: "weapon", cls: ["druid"], name: "지구빛 고목 지팡이", type: "sword", minL: 69, color: "#3a7ae0", mul: 1.06 });
// 사냥꾼 단검
defBase("h_meteor", { slot: "weapon", cls: ["hunter"], name: "운석 단검", type: "sword", minL: 47, color: "#7a5a4a" });
defBase("h_wolf", { slot: "weapon", cls: ["hunter"], name: "그림자 송곳니 단검", type: "sword", minL: 55, color: "#3a3a6a", effect: "slow" });
defBase("h_prism", { slot: "weapon", cls: ["hunter"], name: "프리즘 단검", type: "sword", minL: 62, color: "#9fe8ff", effect: "chain" });
defBase("h_galaxy", { slot: "weapon", cls: ["hunter"], name: "은하 단검", type: "sword", minL: 70, color: "#e0d8ff", mul: 1.06 });
// 활 (모든 직업)
defBase("b_moonRapid", { slot: "bow", name: "달빛 활", type: "rapid", minL: 47, color: "#d0d4e4" });
defBase("b_moonLong", { slot: "bow", name: "초승달 긴 활", type: "long", minL: 48, color: "#ffe27a", mul: 1.1 });
defBase("b_ufoCross", { slot: "bow", name: "UFO 석궁", type: "crossbow", minL: 52, color: "#7dffb0" });
defBase("b_triStar", { slot: "bow", name: "삼별 활", type: "triple", minL: 60, color: "#fff6c0", mul: 1.06 });
defBase("b_meteorStorm", { slot: "bow", name: "유성우 활", type: "storm", minL: 67, color: "#ffb87a", mul: 1.06 });
// 갑옷 (모든 직업)
defBase("a_moonsuit", { slot: "armor", name: "우주복", minL: 46, look: { body: "#e8ecf4", legs: "#c8ccd8", helmet: "#9fe8ff", boots: "#8a90a0", gloves: "#e8ecf4" }, perk: { hearts: 1, block: 0.06 } });
defBase("a_bunny", { slot: "armor", name: "달토끼 옷", minL: 49, look: { body: "#f4f0ec", legs: "#e0d8d0", helmet: "#ffc0d0", boots: "#c8b8b0", gloves: "#f4f0ec" }, perk: { speed: 0.08, roll: 0.1 } });
defBase("a_crystal", { slot: "armor", name: "수정 갑옷", minL: 53, look: { body: "#9a7ae0", legs: "#7a5ac0", helmet: "#9fe8ff", boots: "#5a3aa0", gloves: "#9a7ae0" }, perk: { block: 0.12, hearts: 1 } });
defBase("a_starplate", { slot: "armor", name: "별철 갑옷", minL: 58, look: { body: "#6a6a84", legs: "#4a4a64", helmet: "#ffe27a", boots: "#3a3a50", gloves: "#6a6a84" }, perk: { hearts: 2, block: 0.08 } });
defBase("a_eclipse", { slot: "armor", name: "일식 갑옷", minL: 63, look: { body: "#4a3028", legs: "#2a1a14", helmet: "#ffd23f", boots: "#1a100c", gloves: "#4a3028" }, perk: { hearts: 2, regen: 9 } });
defBase("a_galaxy", { slot: "armor", name: "은하 갑옷", minL: 68, look: { body: "#2a2a5a", legs: "#1a1a40", helmet: "#e0d8ff", boots: "#10102a", gloves: "#3a3a7a" }, perk: { hearts: 3, block: 0.08 } });
// 장신구 (모든 직업)
defBase("c_moonstone", { slot: "charm", name: "월석 목걸이", minL: 47, icon: "amulet", color: "#c8c8dc", perk: { luck: 0.2 } });
defBase("c_starBand", { slot: "charm", name: "별빛 팔찌", minL: 51, icon: "bracelet", color: "#ffe27a", perk: { dmg: 0.08 } });
defBase("c_cometRing", { slot: "charm", name: "혜성 반지", minL: 55, icon: "ring", color: "#9fe8ff", perk: { hearts: 2 } });
defBase("c_ufoQuiver", { slot: "charm", name: "UFO 화살 주머니", minL: 59, icon: "quiver", color: "#7dffb0", perk: { bow: 0.15 } });
defBase("c_featherLight", { slot: "charm", name: "저중력 깃털", minL: 63, icon: "feather", color: "#e8ecf4", perk: { speed: 0.08, roll: 0.12 } });
defBase("c_rabbitClover", { slot: "charm", name: "달토끼 클로버", minL: 67, icon: "clover", color: "#ffc0d0", perk: { luck: 0.3 } });
