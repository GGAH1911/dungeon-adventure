// ===== 월드 8 뜨끈 지옥 장비 이름 (설계서 docs/design/world8-hell.md 6장) =====
// 강도는 기존 규칙 그대로(장비 레벨로 정해져요), 이름과 모습만 지옥 느낌 (도깨비·불씨·숯·온천·불꽃 염소).
// 지옥 맵 레벨 226~251 -> 떨어지는 장비 레벨 round(0.85 x (L-1)) +-1 = 190~213. 그래서 minL 191~211 (월드 7 장비 다음 칸).
// gearSetAll 이 고르는 효과 없는 칼(도깨비 검·불씨 대검)·긴 활(숯 긴 활)·무난한 갑옷(도깨비 조끼·불씨 갑옷)도 들어 있어요.
defBase("w_dokkaebiSword", { slot: "weapon", cls: WAR, name: "도깨비 검", type: "sword", minL: 191, color: "#e8503a" });
defBase("w_coalAxe",       { slot: "weapon", cls: WAR, name: "숯 도끼", type: "axe", minL: 194, color: "#3a3434" });
defBase("w_hornSpear",     { slot: "weapon", cls: WAR, name: "뿔 창", type: "spear", minL: 197, color: "#ffd23f", effect: "burn" });
defBase("w_wispDagger",    { slot: "weapon", cls: WAR, name: "도깨비불 쌍단검", type: "dagger", minL: 200, color: "#6ab0ff", effect: "chain" });
defBase("w_clubHammer",    { slot: "weapon", cls: WAR, name: "도깨비 방망이", type: "hammer", minL: 203, color: "#a86a32", mul: 1.04 });
defBase("w_emberScythe",   { slot: "weapon", cls: WAR, name: "불똥 낫", type: "scythe", minL: 206, color: "#ff8a2a", effect: "slow" });
defBase("w_spaSword",      { slot: "weapon", cls: WAR, name: "온천 김 대검", type: "sword", minL: 208, color: "#e8d060", effect: "heal" });
defBase("w_emberBlade",    { slot: "weapon", cls: WAR, name: "불씨 대검", type: "sword", minL: 211, color: "#ffb030", mul: 1.06 });
defBase("s_hellEmber",         { slot: "weapon", cls: ["mage"], name: "불씨 지팡이", type: "sword", minL: 191, color: "#ff8a2a" });
defBase("s_wisp",          { slot: "weapon", cls: ["mage"], name: "도깨비불 지팡이", type: "sword", minL: 198, color: "#6ab0ff", effect: "chain" });
defBase("s_spa",           { slot: "weapon", cls: ["mage"], name: "온천 김 지팡이", type: "sword", minL: 204, color: "#e8d060", effect: "slow" });
defBase("s_bell",          { slot: "weapon", cls: ["mage"], name: "불씨 종 지팡이", type: "sword", minL: 210, color: "#ffd23f", mul: 1.06 });
defBase("d_ashRoot",       { slot: "weapon", cls: ["druid"], name: "잿빛 뿌리 지팡이", type: "sword", minL: 191, color: "#8a7a6a", effect: "slow" });
defBase("d_spaReed",       { slot: "weapon", cls: ["druid"], name: "온천 갈대 지팡이", type: "sword", minL: 199, color: "#7ac870", effect: "heal" });
defBase("d_emberVine",     { slot: "weapon", cls: ["druid"], name: "불씨 덩굴 지팡이", type: "sword", minL: 205, color: "#ff8a2a", effect: "chain" });
defBase("d_bellTree",      { slot: "weapon", cls: ["druid"], name: "종 나무 지팡이", type: "sword", minL: 210, color: "#c8a060", mul: 1.06 });
defBase("h_hornKnife",     { slot: "weapon", cls: ["hunter"], name: "뿔 단검", type: "sword", minL: 191, color: "#ffd23f" });
defBase("h_coalKnife",     { slot: "weapon", cls: ["hunter"], name: "숯 단검", type: "sword", minL: 199, color: "#3a3434", effect: "slow" });
defBase("h_wispKnife",     { slot: "weapon", cls: ["hunter"], name: "도깨비불 단검", type: "sword", minL: 205, color: "#6ab0ff", effect: "chain" });
defBase("h_emberKnife",    { slot: "weapon", cls: ["hunter"], name: "불씨 단검", type: "sword", minL: 210, color: "#ffb030", mul: 1.06 });
defBase("b_emberRapid",    { slot: "bow", name: "불똥 활", type: "rapid", minL: 191, color: "#ff8a2a" });
defBase("b_coalLong",      { slot: "bow", name: "숯 긴 활", type: "long", minL: 194, color: "#3a3434", mul: 1.1 });
defBase("b_hornCross",     { slot: "bow", name: "뿔 석궁", type: "crossbow", minL: 199, color: "#ffd23f" });
defBase("b_wispTriple",    { slot: "bow", name: "도깨비불 세 갈래 활", type: "triple", minL: 204, color: "#6ab0ff", mul: 1.06 });
defBase("b_fireStorm",     { slot: "bow", name: "불꽃 폭풍 활", type: "storm", minL: 210, color: "#ffb030", mul: 1.06 });
defBase("a_dokkaebiVest",  { slot: "armor", name: "도깨비 조끼", minL: 191, look: { body: "#e8503a", legs: "#ffd23f", helmet: "#ffe060", boots: "#2a2018", gloves: "#e8503a" }, perk: { hearts: 1, speed: 0.06 } });
defBase("a_coal",          { slot: "armor", name: "숯 갑옷", minL: 196, look: { body: "#3a3434", legs: "#2a2424", helmet: "#4a4444", boots: "#1a1414", gloves: "#ff8a2a" }, perk: { block: 0.12, hearts: 1 } });
defBase("a_spaRobe",       { slot: "armor", name: "온천 수건 옷", minL: 202, look: { body: "#f4f4f4", legs: "#a888b8", helmet: "#f4f4f4", boots: "#6a4a7a", gloves: "#e8d060" }, perk: { regen: 8, hearts: 1 } });
defBase("a_ember",         { slot: "armor", name: "불씨 갑옷", minL: 207, look: { body: "#ff8a2a", legs: "#c8501a", helmet: "#ffd23f", boots: "#5a1a1a", gloves: "#ff8a2a" }, perk: { hearts: 2, block: 0.08 } });
defBase("a_bellKing",      { slot: "armor", name: "불씨 종 왕 옷", minL: 211, look: { body: "#c83a2a", legs: "#8a1a2a", helmet: "#ffd23f", boots: "#5a1a1a", gloves: "#ffb080" }, perk: { hearts: 2, dmg: 0.06 } });
