// ===== 월드 7 픽셀 사이버 세계 장비 이름 (설계서 docs/design/world7-cyber.md 6장) =====
// 강도는 기존 규칙 그대로(장비 레벨로 정해져요), 이름과 모습만 사이버 느낌 (픽셀·네온·회로·데이터).
// 사이버 맵 레벨 195~222 -> 떨어지는 장비 레벨 round(0.85 x (L-1)) +-1 = 164~188. 그래서 minL 162~188 (사막 장비 마지막 157 다음).
// gearSetAll 이 고르는 효과 없는 칼(픽셀 검·네온 대검)·긴 활(회로 긴 활)·무난한 갑옷도 들어 있어요.
defBase("w_pixelSword",  { slot: "weapon", cls: WAR, name: "픽셀 검", type: "sword", minL: 162, color: "#5ad8ff" });
defBase("w_circuitAxe",  { slot: "weapon", cls: WAR, name: "회로 도끼", type: "axe", minL: 166, color: "#3ae0a0" });
defBase("w_laserSpear",  { slot: "weapon", cls: WAR, name: "레이저 창", type: "spear", minL: 170, color: "#ff5ad8", effect: "burn" });
defBase("w_bitDagger",   { slot: "weapon", cls: WAR, name: "비트 쌍단검", type: "dagger", minL: 174, color: "#9aff4a", effect: "chain" });
defBase("w_serverHammer",{ slot: "weapon", cls: WAR, name: "서버 망치", type: "hammer", minL: 178, color: "#4a5490", mul: 1.04 });
defBase("w_glitchScythe",{ slot: "weapon", cls: WAR, name: "글리치 낫", type: "scythe", minL: 182, color: "#c07aff", effect: "slow" });
defBase("w_neonBlade",   { slot: "weapon", cls: WAR, name: "네온 대검", type: "sword", minL: 186, color: "#ff5ad8", mul: 1.06 });
defBase("s_pixel",       { slot: "weapon", cls: ["mage"], name: "픽셀 지팡이", type: "sword", minL: 162, color: "#5ad8ff" });
defBase("s_router",      { slot: "weapon", cls: ["mage"], name: "공유기 지팡이", type: "sword", minL: 170, color: "#3ae0a0", effect: "chain" });
defBase("s_neon",        { slot: "weapon", cls: ["mage"], name: "네온 지팡이", type: "sword", minL: 178, color: "#ff5ad8", effect: "burn" });
defBase("s_kernel",      { slot: "weapon", cls: ["mage"], name: "커널 지팡이", type: "sword", minL: 186, color: "#4a8aff", mul: 1.06 });
defBase("d_cable",       { slot: "weapon", cls: ["druid"], name: "케이블 덩굴 지팡이", type: "sword", minL: 162, color: "#3a4878", effect: "slow" });
defBase("d_bitLeaf",     { slot: "weapon", cls: ["druid"], name: "비트 잎 지팡이", type: "sword", minL: 171, color: "#9aff4a", effect: "heal" });
defBase("d_cloud",       { slot: "weapon", cls: ["druid"], name: "구름 저장소 지팡이", type: "sword", minL: 179, color: "#d8e8ff", effect: "chain" });
defBase("d_codeRoot",    { slot: "weapon", cls: ["druid"], name: "코드 뿌리 지팡이", type: "sword", minL: 186, color: "#3ae0c8", mul: 1.06 });
defBase("h_usb",         { slot: "weapon", cls: ["hunter"], name: "USB 단검", type: "sword", minL: 162, color: "#c8c8d8" });
defBase("h_cursorKnife", { slot: "weapon", cls: ["hunter"], name: "커서 단검", type: "sword", minL: 171, color: "#ffffff", effect: "slow" });
defBase("h_neonKnife",   { slot: "weapon", cls: ["hunter"], name: "네온 단검", type: "sword", minL: 179, color: "#ff5ad8", effect: "chain" });
defBase("h_kernelKnife", { slot: "weapon", cls: ["hunter"], name: "커널 단검", type: "sword", minL: 186, color: "#4a8aff", mul: 1.06 });
defBase("b_pixelRapid",  { slot: "bow", name: "픽셀 연사 활", type: "rapid", minL: 162, color: "#5ad8ff" });
defBase("b_circuitLong", { slot: "bow", name: "회로 긴 활", type: "long", minL: 166, color: "#3ae0a0", mul: 1.1 });
defBase("b_laserCross",  { slot: "bow", name: "레이저 석궁", type: "crossbow", minL: 172, color: "#ff5ad8" });
defBase("b_triBit",      { slot: "bow", name: "비트 세 갈래 활", type: "triple", minL: 178, color: "#9aff4a", mul: 1.06 });
defBase("b_dataStorm",   { slot: "bow", name: "데이터 폭풍 활", type: "storm", minL: 185, color: "#4a8aff", mul: 1.06 });
defBase("a_pixelSuit",   { slot: "armor", name: "픽셀 옷", minL: 162, look: { body: "#4a5490", legs: "#2a3458", helmet: "#5ad8ff", boots: "#1a2040", gloves: "#4a5490" }, perk: { hearts: 1, speed: 0.06 } });
defBase("a_firewall",    { slot: "armor", name: "방화벽 갑옷", minL: 168, look: { body: "#c8503a", legs: "#6a3448", helmet: "#ff9a5a", boots: "#3a2234", gloves: "#c8503a" }, perk: { block: 0.12, hearts: 1 } });
defBase("a_neonJacket",  { slot: "armor", name: "네온 점퍼", minL: 175, look: { body: "#ff5ad8", legs: "#4a1e5e", helmet: "#5ad8ff", boots: "#200e2e", gloves: "#ff5ad8" }, perk: { regen: 8, hearts: 1 } });
defBase("a_server",      { slot: "armor", name: "서버 갑옷", minL: 181, look: { body: "#3a5a6a", legs: "#2e4a5a", helmet: "#7affb0", boots: "#1e2e3a", gloves: "#3a5a6a" }, perk: { hearts: 2, block: 0.08 } });
defBase("a_kernel",      { slot: "armor", name: "커널 코어 갑옷", minL: 187, look: { body: "#2a5ad8", legs: "#1a2a5a", helmet: "#c8d8ff", boots: "#0a1430", gloves: "#4a8aff" }, perk: { hearts: 2, dmg: 0.06 } });
