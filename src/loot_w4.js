// ===== 월드 4 지하세계 장비 이름 (설계서 docs/design/world4-underworld.md 8-2) =====
// 강도는 기존 규칙 그대로(장비 레벨로 정해져요), 이름과 모습만 지하 느낌.
// 지하 맵 레벨 85~113 -> 떨어지는 장비 레벨 round(0.85 x (L-1)) +-1 = 70~96. 그래서 minL 71~95 (달 장비 마지막 70 다음).
// gearSetAll 이 고르는 효과 없는 칼(석영 검·용암왕 대검)·긴 활(수정 긴 활)·무난한 갑옷(광부 옷·수정 갑옷)도 들어 있어요.
// 전사 무기
defBase("w_quartz",    { slot: "weapon", cls: WAR, name: "석영 검", type: "sword", minL: 71, color: "#e8e0ff" });
defBase("w_pickaxe",   { slot: "weapon", cls: WAR, name: "광부 곡괭이 도끼", type: "axe", minL: 73, color: "#8a8a92" });
defBase("w_stalSpear", { slot: "weapon", cls: WAR, name: "종유석 창", type: "spear", minL: 76, color: "#9fb8d0", effect: "slow" });
defBase("w_emberDagger",{ slot: "weapon", cls: WAR, name: "불씨 쌍단검", type: "dagger", minL: 79, color: "#ffb04a", effect: "burn" });
defBase("w_forgeHammer",{ slot: "weapon", cls: WAR, name: "대장간 망치", type: "hammer", minL: 83, color: "#5a5a62", mul: 1.04 });
defBase("w_shroomScythe",{ slot: "weapon", cls: WAR, name: "버섯 낫", type: "scythe", minL: 87, color: "#ff9ad6", effect: "heal" });
defBase("w_amethyst",  { slot: "weapon", cls: WAR, name: "자수정 대검", type: "sword", minL: 91, color: "#b08aff", effect: "chain" });
defBase("w_magmaKing", { slot: "weapon", cls: WAR, name: "용암왕 대검", type: "sword", minL: 95, color: "#ff9a3a", mul: 1.06 });
// 마법사 지팡이
defBase("s_glow",      { slot: "weapon", cls: ["mage"], name: "반딧불 지팡이", type: "sword", minL: 71, color: "#c8ff7a" });
defBase("s_uCrystal",   { slot: "weapon", cls: ["mage"], name: "수정 지팡이", type: "sword", minL: 77, color: "#7fe0ff", effect: "slow" });
defBase("s_ember",     { slot: "weapon", cls: ["mage"], name: "불씨 지팡이", type: "sword", minL: 85, color: "#ffb04a", effect: "chain" });
defBase("s_runestone", { slot: "weapon", cls: ["mage"], name: "옛 글자 지팡이", type: "sword", minL: 93, color: "#7fe0a0", mul: 1.06 });
// 드루이드 지팡이
defBase("d_shroom",    { slot: "weapon", cls: ["druid"], name: "버섯 지팡이", type: "sword", minL: 71, color: "#ff9ad6", effect: "slow" });
defBase("d_root",      { slot: "weapon", cls: ["druid"], name: "땅속 뿌리 지팡이", type: "sword", minL: 78, color: "#8a6a4a", effect: "heal" });
defBase("d_mossCrystal",{ slot: "weapon", cls: ["druid"], name: "이끼 수정 지팡이", type: "sword", minL: 86, color: "#7fe0c0", effect: "chain" });
defBase("d_uAncient",   { slot: "weapon", cls: ["druid"], name: "옛 고목 지팡이", type: "sword", minL: 94, color: "#a8c890", mul: 1.06 });
// 사냥꾼 단검
defBase("h_flint",     { slot: "weapon", cls: ["hunter"], name: "부싯돌 단검", type: "sword", minL: 71, color: "#7a6a5a" });
defBase("h_batFang",   { slot: "weapon", cls: ["hunter"], name: "박쥐 송곳니 단검", type: "sword", minL: 79, color: "#c8a8ff", effect: "slow" });
defBase("h_obsidian",  { slot: "weapon", cls: ["hunter"], name: "흑요석 단검", type: "sword", minL: 87, color: "#2a2230", effect: "chain" });
defBase("h_magma",     { slot: "weapon", cls: ["hunter"], name: "용암 단검", type: "sword", minL: 95, color: "#ff9a3a", mul: 1.06 });
// 활
defBase("b_stalac",    { slot: "bow", name: "종유석 활", type: "rapid", minL: 71, color: "#9fb8d0" });
defBase("b_miner",     { slot: "bow", name: "광부 석궁", type: "crossbow", minL: 75, color: "#8a8a92" });
defBase("b_crystalLong",{ slot: "bow", name: "수정 긴 활", type: "long", minL: 73, color: "#7fe0ff", mul: 1.1 });
defBase("b_spore",     { slot: "bow", name: "포자 세 갈래 활", type: "triple", minL: 85, color: "#ff9ad6", mul: 1.06 });
defBase("b_lavaStorm", { slot: "bow", name: "용암 폭풍 활", type: "storm", minL: 92, color: "#ffb04a", mul: 1.06 });
// 갑옷
defBase("a_miner",     { slot: "armor", name: "광부 옷", minL: 71, look: { body: "#d8a050", legs: "#5a4a3a", helmet: "#ffd040", boots: "#3a2c20", gloves: "#a87848" }, perk: { hearts: 1, speed: 0.06 } });
defBase("a_rock",      { slot: "armor", name: "바위 갑옷", minL: 74, look: { body: "#7a7068", legs: "#5a524a", helmet: "#8a8278", boots: "#3a342e", gloves: "#7a7068" }, perk: { block: 0.12, hearts: 1 } });
defBase("a_shroom",    { slot: "armor", name: "버섯 옷", minL: 78, look: { body: "#ff9ad6", legs: "#c86aa8", helmet: "#ffd0ee", boots: "#7a3a6a", gloves: "#ff9ad6" }, perk: { regen: 8, hearts: 1 } });
defBase("a_uCrystal",  { slot: "armor", name: "지하 수정 갑옷", minL: 83, look: { body: "#b08aff", legs: "#7a5ac8", helmet: "#7fe0ff", boots: "#4a3a8a", gloves: "#c8a8ff" }, perk: { hearts: 2, block: 0.08 } });
defBase("a_uObsidian",  { slot: "armor", name: "흑요석 갑옷", minL: 88, look: { body: "#2a2230", legs: "#1e1824", helmet: "#4a3a5a", boots: "#120e16", gloves: "#3a2e44" }, perk: { block: 0.12, knock: 0.3, hearts: 1 } });
defBase("a_magma",     { slot: "armor", name: "용암 갑옷", minL: 93, look: { body: "#8a4a2a", legs: "#6a3a22", helmet: "#ffb04a", boots: "#3a2014", gloves: "#a85a30" }, perk: { hearts: 2, block: 0.1 } });
// 장신구
defBase("c_glowstone", { slot: "charm", name: "빛돌 목걸이", minL: 71, icon: "amulet", color: "#c8ff7a", perk: { luck: 0.2 } });
defBase("c_quartzBand",{ slot: "charm", name: "석영 팔찌", minL: 75, icon: "bracelet", color: "#e8e0ff", perk: { dmg: 0.08 } });
defBase("c_amethyst",  { slot: "charm", name: "자수정 반지", minL: 79, icon: "ring", color: "#b08aff", perk: { hearts: 2 } });
defBase("c_batQuiver", { slot: "charm", name: "박쥐 날개 화살 주머니", minL: 83, icon: "quiver", color: "#7a4ac8", perk: { bow: 0.15 } });
defBase("c_ember",     { slot: "charm", name: "불씨 깃털", minL: 87, icon: "feather", color: "#ffb04a", perk: { speed: 0.08, roll: 0.1 } });
defBase("c_goblinCoin",{ slot: "charm", name: "도깨비 금화 클로버", minL: 91, icon: "clover", color: "#ffd040", perk: { luck: 0.3 } });
