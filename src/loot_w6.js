// ===== 월드 6 색모래 사막 장비 이름 (설계서 docs/design/world6-desert.md 7장) =====
// 강도는 기존 규칙 그대로(장비 레벨로 정해져요), 이름과 모습만 사막 느낌 (모래·선인장·오아시스·태양·색모래).
// 사막 맵 레벨 155~191 -> 떨어지는 장비 레벨 round(0.85 x (L-1)) +-1 = 130~161. 그래서 minL 130~158 (공허 장비 마지막 126 다음).
// gearSetAll 이 고르는 효과 없는 칼(모래 검·태양 대검)·긴 활(낙타 긴 활)·무난한 갑옷(모래 망토·태양 갑옷)도 들어 있어요.
defBase("w_sandSword",  { slot: "weapon", cls: WAR, name: "모래 검", type: "sword", minL: 130, color: "#e8c890" });
defBase("w_cactusAxe",  { slot: "weapon", cls: WAR, name: "선인장 도끼", type: "axe", minL: 133, color: "#6ab868" });
defBase("w_oasisSpear", { slot: "weapon", cls: WAR, name: "오아시스 창", type: "spear", minL: 137, color: "#6ac8e0", effect: "slow" });
defBase("w_scarabDagger",{ slot: "weapon", cls: WAR, name: "쇠똥구리 쌍단검", type: "dagger", minL: 141, color: "#4a8a6a", effect: "chain" });
defBase("w_dunehammer", { slot: "weapon", cls: WAR, name: "모래성 망치", type: "hammer", minL: 145, color: "#d8b070", mul: 1.04 });
defBase("w_sunScythe",  { slot: "weapon", cls: WAR, name: "태양 낫", type: "scythe", minL: 149, color: "#ffb040", effect: "burn" });
defBase("w_prismSand",  { slot: "weapon", cls: WAR, name: "색모래 대검", type: "sword", minL: 153, color: "#f0b8e8", effect: "heal" });
defBase("w_sunBlade",   { slot: "weapon", cls: WAR, name: "태양 대검", type: "sword", minL: 157, color: "#ffd23f", mul: 1.06 });
defBase("s_sand",       { slot: "weapon", cls: ["mage"], name: "모래 지팡이", type: "sword", minL: 130, color: "#e8c890" });
defBase("s_oasis",      { slot: "weapon", cls: ["mage"], name: "오아시스 지팡이", type: "sword", minL: 138, color: "#6ac8e0", effect: "slow" });
defBase("s_sun",        { slot: "weapon", cls: ["mage"], name: "태양 지팡이", type: "sword", minL: 146, color: "#ffb040", effect: "chain" });
defBase("s_newColor",   { slot: "weapon", cls: ["mage"], name: "새빛 지팡이", type: "sword", minL: 155, color: "#f0c8f0", mul: 1.06 });
defBase("d_cactus",     { slot: "weapon", cls: ["druid"], name: "선인장 지팡이", type: "sword", minL: 130, color: "#6ab868", effect: "slow" });
defBase("d_palm",       { slot: "weapon", cls: ["druid"], name: "야자수 지팡이", type: "sword", minL: 139, color: "#5aa848", effect: "heal" });
defBase("d_mirage",     { slot: "weapon", cls: ["druid"], name: "신기루 지팡이", type: "sword", minL: 147, color: "#f0d8f0", effect: "chain" });
defBase("d_prismRoot",  { slot: "weapon", cls: ["druid"], name: "색모래 뿌리 지팡이", type: "sword", minL: 155, color: "#d8b8f0", mul: 1.06 });
defBase("h_sandFlint",  { slot: "weapon", cls: ["hunter"], name: "모래 부싯돌 단검", type: "sword", minL: 130, color: "#d8b070" });
defBase("h_scorpion",   { slot: "weapon", cls: ["hunter"], name: "전갈 꼬리 단검", type: "sword", minL: 139, color: "#b86a3a", effect: "slow" });
defBase("h_w6prism",    { slot: "weapon", cls: ["hunter"], name: "색모래 단검", type: "sword", minL: 147, color: "#f0b8e8", effect: "chain" });
defBase("h_sun",        { slot: "weapon", cls: ["hunter"], name: "태양 단검", type: "sword", minL: 155, color: "#ffd23f", mul: 1.06 });
defBase("b_sunRapid",   { slot: "bow", name: "햇살 활", type: "rapid", minL: 130, color: "#ffe08a" });
defBase("b_camelLong",  { slot: "bow", name: "낙타 긴 활", type: "long", minL: 133, color: "#c89a58", mul: 1.1 });
defBase("b_cactusCross",{ slot: "bow", name: "선인장 석궁", type: "crossbow", minL: 138, color: "#6ab868" });
defBase("b_prismSand",  { slot: "bow", name: "색모래 세 갈래 활", type: "triple", minL: 145, color: "#f0b8e8", mul: 1.06 });
defBase("b_sandStorm",  { slot: "bow", name: "모래 폭풍 활", type: "storm", minL: 152, color: "#e8c890", mul: 1.06 });
defBase("a_sandCloak",  { slot: "armor", name: "모래 망토", minL: 130, look: { body: "#e0c08a", legs: "#c8a068", helmet: "#f0dcb0", boots: "#8a6a3a", gloves: "#e0c08a" }, perk: { hearts: 1, speed: 0.06 } });
defBase("a_shell",      { slot: "armor", name: "모래 거북 갑옷", minL: 136, look: { body: "#c89a58", legs: "#a87a40", helmet: "#d8b070", boots: "#6a4a2a", gloves: "#c89a58" }, perk: { block: 0.12, hearts: 1 } });
defBase("a_oasis",      { slot: "armor", name: "오아시스 옷", minL: 143, look: { body: "#6ac8e0", legs: "#4a98b0", helmet: "#e8fbff", boots: "#2a5a6a", gloves: "#6ac8e0" }, perk: { regen: 8, hearts: 1 } });
defBase("a_sun",        { slot: "armor", name: "태양 갑옷", minL: 150, look: { body: "#ffc850", legs: "#d89a30", helmet: "#ffe8a0", boots: "#8a5a20", gloves: "#ffc850" }, perk: { hearts: 2, block: 0.08 } });
defBase("a_newColor",   { slot: "armor", name: "새빛 비단 옷", minL: 156, look: { body: "#f0c8f0", legs: "#c8a8e8", helmet: "#b8f0e0", boots: "#6a4a8a", gloves: "#ffd8b0" }, perk: { hearts: 2, dmg: 0.06 } });
