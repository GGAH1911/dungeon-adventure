// ===== 월드 2 깊은 바다 장비 이름 (설계서 docs/design/world2-ocean.md 7-2) =====
// 강도는 기존 규칙 그대로(장비 레벨로 정해져요), 이름과 모습만 바다 느낌. 바다 맵 레벨(33~52)에 맞춰 설계서 minL 에서 3을 뺐어요.
// 전사 무기 (무기 종류별)
defBase("w_coral", { slot: "weapon", cls: WAR, name: "산호 검", type: "sword", minL: 32, color: "#ff8f7a" });
defBase("w_trident", { slot: "weapon", cls: WAR, name: "삼지창", type: "spear", head: "trident", minL: 34, color: "#7fe0d0", effect: "slow" }); // head: 날이 세 갈래 (rig.js)
defBase("w_pearlDagger", { slot: "weapon", cls: WAR, name: "진주 쌍단검", type: "dagger", minL: 36, color: "#fffaf0" });
defBase("w_shellAxe", { slot: "weapon", cls: WAR, name: "소라 도끼", type: "axe", minL: 39, color: "#ffd0b0" });
defBase("w_anchor", { slot: "weapon", cls: WAR, name: "닻 망치", type: "hammer", minL: 43, color: "#8d99a6", mul: 1.04 });
defBase("w_tideScythe", { slot: "weapon", cls: WAR, name: "물결 낫", type: "scythe", minL: 47, color: "#6fc8e8", effect: "heal" });
defBase("w_abyssBlade", { slot: "weapon", cls: WAR, name: "심해 검", type: "sword", minL: 51, color: "#4a5aa8", effect: "chain" });
defBase("w_seaKing", { slot: "weapon", cls: WAR, name: "바다왕 대검", type: "sword", minL: 55, color: "#e0c060", mul: 1.06 });
// 마법사 지팡이
defBase("s_coral", { slot: "weapon", cls: ["mage"], name: "산호 지팡이", type: "sword", minL: 32, color: "#ff8f7a" });
defBase("s_pearl", { slot: "weapon", cls: ["mage"], name: "진주 지팡이", type: "sword", minL: 38, color: "#fffaf0", effect: "slow" });
defBase("s_tide", { slot: "weapon", cls: ["mage"], name: "물결 지팡이", type: "sword", minL: 45, color: "#6fc8e8", effect: "chain" });
defBase("s_abyss", { slot: "weapon", cls: ["mage"], name: "심해 등불 지팡이", type: "sword", minL: 53, color: "#ffe27a", mul: 1.06 });
// 드루이드 지팡이
defBase("d_kelp", { slot: "weapon", cls: ["druid"], name: "다시마 지팡이", type: "sword", minL: 32, color: "#3f8a4a", effect: "slow" });
defBase("d_coralRoot", { slot: "weapon", cls: ["druid"], name: "산호 뿌리 지팡이", type: "sword", minL: 39, color: "#ff8f7a", effect: "heal" });
defBase("d_waveVine", { slot: "weapon", cls: ["druid"], name: "파도 덩굴 지팡이", type: "sword", minL: 46, color: "#6fc8e8", effect: "chain" });
defBase("d_deepRoot", { slot: "weapon", cls: ["druid"], name: "심해 고목 지팡이", type: "sword", minL: 54, color: "#5a7a6a", mul: 1.06 });
// 사냥꾼 단검
defBase("h_fin", { slot: "weapon", cls: ["hunter"], name: "지느러미 단검", type: "sword", minL: 33, color: "#7fe0d0" });
defBase("h_narwhal", { slot: "weapon", cls: ["hunter"], name: "외뿔 단검", type: "sword", minL: 41, color: "#e8f6ff", effect: "slow" });
defBase("h_urchin", { slot: "weapon", cls: ["hunter"], name: "성게 단검", type: "sword", minL: 49, color: "#7a4ac8", effect: "chain" });
defBase("h_abyss", { slot: "weapon", cls: ["hunter"], name: "심해 단검", type: "sword", minL: 57, color: "#4a5aa8", mul: 1.06 });
// 활 (모든 직업)
defBase("b_coral", { slot: "bow", name: "산호 활", type: "rapid", minL: 33, color: "#ff8f7a" });
defBase("b_harpoon", { slot: "bow", name: "작살 석궁", type: "crossbow", minL: 37, color: "#7c828a" });
defBase("b_tideLong", { slot: "bow", name: "물결 긴 활", type: "long", minL: 35, color: "#6fc8e8", mul: 1.1 });
defBase("b_bubble", { slot: "bow", name: "거품 세 갈래 활", type: "triple", minL: 47, color: "#bff6ff", mul: 1.06 });
defBase("b_seaStorm", { slot: "bow", name: "해일 활", type: "storm", minL: 53, color: "#3fb0a0", mul: 1.06 });
// 갑옷 (모든 직업)
defBase("a_coral", { slot: "armor", name: "산호 갑옷", minL: 32, look: { body: "#ff8f7a", legs: "#e06a5a", helmet: "#ffb0a0", boots: "#a04a3a", gloves: "#ff8f7a" }, perk: { hearts: 1, block: 0.06 } });
defBase("a_kelp", { slot: "armor", name: "다시마 옷", minL: 35, look: { body: "#3f8a4a", legs: "#2f6a3a", helmet: "#5fae5a", boots: "#24502c", gloves: "#3f8a4a" }, perk: { speed: 0.08, roll: 0.1 } });
defBase("a_shell", { slot: "armor", name: "소라 갑옷", minL: 39, look: { body: "#ffd0b0", legs: "#e0a888", helmet: "#ff9a8a", boots: "#a87858", gloves: "#ffd0b0" }, perk: { block: 0.12, hearts: 1 } });
defBase("a_pearl", { slot: "armor", name: "진주 갑옷", minL: 44, look: { body: "#fffaf0", legs: "#d8d0e8", helmet: "#c8a8ff", boots: "#a888d8", gloves: "#fffaf0" }, perk: { hearts: 2, regen: 9 } });
defBase("a_seaTurtle", { slot: "armor", name: "바다거북 갑옷", minL: 49, look: { body: "#4f9a6a", legs: "#3d7a5a", helmet: "#6fc08a", boots: "#2f5a44", gloves: "#4f9a6a" }, perk: { block: 0.1, knock: 0.3, hearts: 1 } });
defBase("a_abyss", { slot: "armor", name: "심해 갑옷", minL: 54, look: { body: "#2a3a6a", legs: "#1e2a50", helmet: "#e0c060", boots: "#141c38", gloves: "#3a4a8a" }, perk: { hearts: 2, block: 0.08 } });
// 장신구 (모든 직업)
defBase("c_pearl", { slot: "charm", name: "진주 목걸이", minL: 33, icon: "amulet", color: "#fffaf0", perk: { luck: 0.2 } });
defBase("c_coralBand", { slot: "charm", name: "산호 팔찌", minL: 37, icon: "bracelet", color: "#ff8f7a", perk: { dmg: 0.08 } });
defBase("c_starfish", { slot: "charm", name: "불가사리 반지", minL: 41, icon: "ring", color: "#ffb84a", perk: { hearts: 2 } });
defBase("c_seaGlass", { slot: "charm", name: "바다유리 화살 주머니", minL: 45, icon: "quiver", color: "#7fe0d0", perk: { bow: 0.15 } });
defBase("c_bubbleFeather", { slot: "charm", name: "물방울 깃털", minL: 49, icon: "feather", color: "#bff6ff", perk: { speed: 0.08, roll: 0.1 } });
defBase("c_luckyPearl", { slot: "charm", name: "행운 진주 클로버", minL: 53, icon: "clover", color: "#c8f0d8", perk: { luck: 0.3 } });
