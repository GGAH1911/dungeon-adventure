// ===== 월드 5 공허 장비 이름 (설계서 docs/design/world5-void.md 7장) =====
// 강도는 기존 규칙 그대로(장비 레벨로 정해져요), 이름과 모습만 공허 느낌 (별빛·회색·메아리·고요).
// 공허 맵 레벨 116~152 -> 떨어지는 장비 레벨 round(0.85 x (L-1)) +-1 = 97~129. 그래서 minL 97~126 (지하 장비 마지막 95 다음).
// 123~126 은 잊힌 성·깊은 꿈 바다·틈새·별을 삼키는 곳(블랙홀) 몫이에요.
// gearSetAll 이 고르는 효과 없는 칼(별빛 검·틈새 대검)·긴 활(고요 긴 활)·무난한 갑옷(별 망토·고요 갑옷)도 들어 있어요.
// 전사 무기
defBase("w_starlight", { slot: "weapon", cls: WAR, name: "별빛 검", type: "sword", minL: 97, color: "#fff6d8" });
defBase("w_grayAxe",   { slot: "weapon", cls: WAR, name: "회색 돌도끼", type: "axe", minL: 99, color: "#8a86a0" });
defBase("w_echoSpear", { slot: "weapon", cls: WAR, name: "메아리 창", type: "spear", minL: 102, color: "#b8a8d8", effect: "slow" });
defBase("w_shadeDagger",{ slot: "weapon", cls: WAR, name: "그림자 쌍단검", type: "dagger", minL: 105, color: "#4a4060", effect: "chain" });
defBase("w_hushHammer",{ slot: "weapon", cls: WAR, name: "쉿 망치", type: "hammer", minL: 109, color: "#9a96aa", mul: 1.04 });
defBase("w_dreamScythe",{ slot: "weapon", cls: WAR, name: "꿈결 낫", type: "scythe", minL: 113, color: "#d8c8ff", effect: "heal" });
defBase("w_rainbowBlade",{ slot: "weapon", cls: WAR, name: "무지개 대검", type: "sword", minL: 116, color: "#ffb0d8", effect: "burn" });
defBase("w_riftBlade", { slot: "weapon", cls: WAR, name: "틈새 대검", type: "sword", minL: 120, color: "#fff0c0", mul: 1.06 });
// 마법사 지팡이
defBase("s_starlight", { slot: "weapon", cls: ["mage"], name: "별빛 지팡이", type: "sword", minL: 97, color: "#fff6d8" });
defBase("s_echo",      { slot: "weapon", cls: ["mage"], name: "메아리 지팡이", type: "sword", minL: 104, color: "#b8a8d8", effect: "slow" });
defBase("s_prism",     { slot: "weapon", cls: ["mage"], name: "무지개 수정 지팡이", type: "sword", minL: 111, color: "#ffdf5a", effect: "chain" });
defBase("s_rift",      { slot: "weapon", cls: ["mage"], name: "틈새 지팡이", type: "sword", minL: 119, color: "#fff0c0", mul: 1.06 });
// 드루이드 지팡이
defBase("d_dandelion", { slot: "weapon", cls: ["druid"], name: "민들레 지팡이", type: "sword", minL: 97, color: "#e8d8ff", effect: "slow" });
defBase("d_quietRoot", { slot: "weapon", cls: ["druid"], name: "고요 뿌리 지팡이", type: "sword", minL: 105, color: "#9aa088", effect: "heal" });
defBase("d_dream",     { slot: "weapon", cls: ["druid"], name: "꿈결 지팡이", type: "sword", minL: 112, color: "#d8c8ff", effect: "chain" });
defBase("d_starTree",  { slot: "weapon", cls: ["druid"], name: "별나무 지팡이", type: "sword", minL: 119, color: "#c8e0a8", mul: 1.06 });
// 사냥꾼 단검
defBase("h_grayFlint", { slot: "weapon", cls: ["hunter"], name: "회색 부싯돌 단검", type: "sword", minL: 97, color: "#8a86a0" });
defBase("h_shade",     { slot: "weapon", cls: ["hunter"], name: "그림자 단검", type: "sword", minL: 105, color: "#4a4060", effect: "slow" });
defBase("h_w5prism",   { slot: "weapon", cls: ["hunter"], name: "무지개 단검", type: "sword", minL: 112, color: "#ffb0d8", effect: "chain" });
defBase("h_rift",      { slot: "weapon", cls: ["hunter"], name: "틈새 단검", type: "sword", minL: 120, color: "#fff0c0", mul: 1.06 });
// 활
defBase("b_wisp",      { slot: "bow", name: "반딧별 활", type: "rapid", minL: 97, color: "#fff6d8" });
defBase("b_hushLong",  { slot: "bow", name: "고요 긴 활", type: "long", minL: 99, color: "#9a96aa", mul: 1.1 });
defBase("b_echoCross", { slot: "bow", name: "메아리 석궁", type: "crossbow", minL: 103, color: "#b8a8d8" });
defBase("b_prism",     { slot: "bow", name: "무지개 세 갈래 활", type: "triple", minL: 110, color: "#ffdf5a", mul: 1.06 });
defBase("b_starStorm", { slot: "bow", name: "별비 폭풍 활", type: "storm", minL: 117, color: "#fff0c0", mul: 1.06 });
// 갑옷
defBase("a_starCloak", { slot: "armor", name: "별 망토", minL: 97, look: { body: "#6a6888", legs: "#4a4866", helmet: "#fff6d8", boots: "#2e2c40", gloves: "#8a86a8" }, perk: { hearts: 1, speed: 0.06 } });
defBase("a_grayStone", { slot: "armor", name: "회색 돌 갑옷", minL: 100, look: { body: "#8a8a96", legs: "#6a6a76", helmet: "#9a9aa8", boots: "#4a4a56", gloves: "#8a8a96" }, perk: { block: 0.12, hearts: 1 } });
defBase("a_dandelion", { slot: "armor", name: "민들레 솜 옷", minL: 104, look: { body: "#e8e4f0", legs: "#c8c4d8", helmet: "#fff6d8", boots: "#8a86a0", gloves: "#e8e4f0" }, perk: { regen: 8, hearts: 1 } });
defBase("a_hush",      { slot: "armor", name: "고요 갑옷", minL: 109, look: { body: "#9a96b8", legs: "#6a6688", helmet: "#d8c8ff", boots: "#3a3850", gloves: "#b8b0d8" }, perk: { hearts: 2, block: 0.08 } });
defBase("a_shade",     { slot: "armor", name: "그림자 갑옷", minL: 114, look: { body: "#2e2846", legs: "#221c34", helmet: "#4a4466", boots: "#14101e", gloves: "#3a3254" }, perk: { block: 0.12, knock: 0.3, hearts: 1 } });
defBase("a_rainbow",   { slot: "armor", name: "무지개 갑옷", minL: 119, look: { body: "#ff9ad6", legs: "#9fe8ff", helmet: "#ffdf5a", boots: "#c8ff7a", gloves: "#d8a8ff" }, perk: { hearts: 2, block: 0.1 } });
// 장신구
defBase("c_wispBell",  { slot: "charm", name: "반딧별 방울", minL: 97, icon: "amulet", color: "#fff6d8", perk: { luck: 0.2 } });
defBase("c_echoBand",  { slot: "charm", name: "메아리 팔찌", minL: 101, icon: "bracelet", color: "#b8a8d8", perk: { dmg: 0.08 } });
defBase("c_hushRing",  { slot: "charm", name: "고요 반지", minL: 105, icon: "ring", color: "#9a96aa", perk: { hearts: 2 } });
defBase("c_starQuiver",{ slot: "charm", name: "별빛 화살 주머니", minL: 109, icon: "quiver", color: "#d8c8ff", perk: { bow: 0.15 } });
defBase("c_dandelion", { slot: "charm", name: "민들레 깃털", minL: 113, icon: "feather", color: "#e8e4f0", perk: { speed: 0.08, roll: 0.1 } });
defBase("c_rainbowClover",{ slot: "charm", name: "무지개 클로버", minL: 117, icon: "clover", color: "#c8ff7a", perk: { luck: 0.3 } });
// 늦은 공허 (잊힌 성 ~ 별을 삼키는 곳)
defBase("w_starmaw",   { slot: "weapon", cls: WAR, name: "별삼킴 대검", type: "sword", minL: 124, color: "#c8a8ff", mul: 1.08 });
defBase("s_starmaw",   { slot: "weapon", cls: ["mage"], name: "블랙홀 지팡이", type: "sword", minL: 124, color: "#c8a8ff", mul: 1.08 });
defBase("d_starmaw",   { slot: "weapon", cls: ["druid"], name: "별 우물 지팡이", type: "sword", minL: 124, color: "#b8e0ff", mul: 1.08 });
defBase("h_starmaw",   { slot: "weapon", cls: ["hunter"], name: "별삼킴 단검", type: "sword", minL: 124, color: "#c8a8ff", mul: 1.08 });
defBase("b_starmaw",   { slot: "bow", name: "소용돌이 활", type: "storm", minL: 123, color: "#c8a8ff", mul: 1.08 });
defBase("a_starmaw",   { slot: "armor", name: "별 고리 갑옷", minL: 125, look: { body: "#2a1a40", legs: "#1a1028", helmet: "#ffb070", boots: "#120a1c", gloves: "#c8a8ff" }, perk: { hearts: 3, block: 0.12 } });
defBase("c_starmaw",   { slot: "charm", name: "별 고리 반지", minL: 126, icon: "ring", color: "#ffb070", perk: { dmg: 0.1, luck: 0.2 } });
