// ===== 월드 6 새 보스 (트랙 C): 9 모래에 묻힌 신전 · 10 유리 모래 언덕 · 11 낙타 길 =====
// 예전엔 옛 보스 모양을 모래색으로 칠한 "신기루"였어요. 이제 사막에서 새로 태어난 보스예요 (BOSS_DEFS[맵].w6New = true).
//   9  미라 고양이 둘둘이: 붕대 밧줄(맞으면 느려져요), 관 뚜껑을 열어 붕대 꼬마 미라를 불러요, 3단계 붕대 그물(빈틈으로 쏙)
//   10 유리 전갈 반들이: 아레나에 유리 거울 3개. 거울을 치면 방향이 돌아가요(빛 길이 바닥에 보여요). 빛이 반들이에게 닿으면 눈부셔 비틀!
//      꼬리 침(원), 유리 빛줄기(줄), 3단계는 빛줄기를 두 번
//   11 대상단 낙타 쿵덕이: 길 따라 돌진(빨간 길), 짐 상자를 떨어뜨려요(길을 막아요, 치면 부서져요), 3단계 꼬마 낙타 우르르(원 사이 빈틈)
// 사막 보스 규칙(물 항아리)은 bosses_w6.js 가 world 6 보스면 누구에게나 걸어 줘요. 이 파일은 bosses_w6.js 바로 뒤에 불러요.
// 같이 하기: 거울 방향(w6cDir)·빛 맞힘(w6cHit)은 소품 몬스터 칸이라 친구 화면에도 가요. 계산(거울 돌리기·비틀)은 방장만.

// ----- 기술 -----
Object.assign(ABILITIES, {
  w6_bandageRope: { name: "붕대 밧줄", desc: "둘둘이가 붕대를 쭉 던져요. 맞으면 잠깐 느려져요.", counter: "빨간 길 옆으로 비켜요. 맞으면 구르기로 빠져나와요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 9, width: 1.2, at: "self", time: 1.2 }, cooldown: 7, range: [0, 9], damageMul: 1.1, anim: "point",
    effect: { type: "slow", duration: 2.0 } },
  w6_coffinOpen: { name: "관 뚜껑 열기", desc: "관 뚜껑이 덜컹! 붕대 꼬마 미라 둘이 나와요.", counter: "꼬마 미라를 먼저 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.1 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w6_mummyKid", count: 2 }, when: { maxSummons: 4 } },
  w6_bandageWeb: { name: "붕대 그물", desc: "붕대 그물이 여기저기 떨어져요. 그물 사이 빈틈은 안전해요.", counter: "원과 원 사이 빈틈으로 쏙!",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 0.95, at: "target", time: 1.4 }, cooldown: 10, range: [0, 14], damageMul: 1.2, anim: "raise",
    effect: { type: "rain", count: 8, spread: 3.8, stagger: 0.14 } },
  w6_glassSting: { name: "유리 꼬리 침", desc: "반들이가 유리 꼬리로 콕! 바닥 원 안이 아파요.", counter: "원 밖으로 한 걸음",
    tags: ["boss", "aoe"], telegraph: { shape: "circle", radius: 1.4, at: "target", time: 1.1 }, cooldown: 5, range: [0, 7], damageMul: 1.5, anim: "slam",
    effect: { type: "damage" } },
  w6_glassBeam: { name: "유리 빛줄기", desc: "반들이 집게 사이에서 반짝 빛줄기가 쭉 나가요.", counter: "빛 길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 11, width: 1.3, at: "self", time: 1.3, follow: true }, cooldown: 8, range: [0, 11], damageMul: 1.5, anim: "point",
    effect: { type: "damage" } },
  w6_camelCharge: { name: "낙타 돌진", desc: "쿵덕이가 길 따라 쿵쿵 달려와요. 벽에 부딪히면 어질어질.", counter: "빨간 길 옆으로 비켜요. 벽 앞에 서 있으면 쿵덕이가 부딪혀요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.8, at: "self", time: 1.2 }, cooldown: 8, range: [2, 12], damageMul: 1.6, anim: "crouch",
    effect: { type: "charge", speed: 10, stunOnWall: 1.5 } },
  w6_cargoDrop: { name: "짐 상자 떨어뜨리기", desc: "등에 실은 짐 상자를 쿵 떨어뜨려요. 길을 막지만 치면 부서져요.", counter: "상자를 부수거나 돌아서 가요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.3, at: "self", time: 1.0 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w6_cargoBox", count: 3 }, when: { maxSummons: 6 } },
  w6_camelStampede: { name: "꼬마 낙타 우르르", desc: "꼬마 낙타들이 우르르 지나가요. 발자국 원 사이 빈틈은 안전해요.", counter: "원과 원 사이 빈틈에 서요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 0.9, at: "target", time: 1.4 }, cooldown: 11, range: [0, 14], damageMul: 1.3, anim: "roar",
    effect: { type: "rain", count: 9, spread: 4.6, stagger: 0.12 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w6_bandageRope: { text: "붕대 길 옆으로!" }, w6_coffinOpen: { text: "꼬마 미라부터 정리해요" }, w6_bandageWeb: { text: "그물 사이 빈틈으로" },
  w6_glassSting: { text: "원 밖으로 한 걸음" }, w6_glassBeam: { text: "빛 길 옆으로!" },
  w6_camelCharge: { text: "돌진 길 옆으로!" }, w6_cargoDrop: { text: "상자는 부수면 돼요" }, w6_camelStampede: { text: "발자국 사이 빈틈에!" },
});

// ----- 부하·소품 -----
MONSTERS.w6_mummyKid = { ...MONSTERS.w6_mirageKid, name: "붕대 꼬마 미라", shape: "w6_mummyKid", color: "#efe6cc", world: 6 };
MONSTERS.w6_cargoBox = { name: "짐 상자", color: "#b8844e", shape: "w6_cargoBox", behavior: "prop", hp: 6, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true };
MONSTERS.w6_glassMirror = { name: "유리 거울", color: "#bfeaff", shape: "w6_glassMirror", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true };
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w6_mummyKid", "w6_cargoBox", "w6_glassMirror");
if (typeof CODEX_SKIP !== "undefined") { CODEX_SKIP.add("w6_cargoBox"); CODEX_SKIP.add("w6_glassMirror"); }
if (typeof EXTRA_SHAPES !== "undefined") {
  EXTRA_SHAPES.w6_mummyKid = (m) => {
    const x = m.x, y = m.y, bob = Math.abs(Math.sin((m.walkTime || 0) * 6)) * 0.05;
    drawBox(x - 0.18, y - 0.14, 0, 0.36, 0.28, 0.42 + bob, "#e8dcc0");
    drawBox(x - 0.2, y - 0.17, 0.42 + bob, 0.4, 0.34, 0.3, "#f4ecd6");
    drawBox(x - 0.21, y - 0.05, 0.52 + bob, 0.42, 0.1, 0.05, "#c8b890"); // 붕대 줄
    drawBox(x + 0.12, y - 0.1, 0.58 + bob, 0.06, 0.06, 0.06, "#6ad0ff"); drawBox(x + 0.12, y + 0.04, 0.58 + bob, 0.06, 0.06, 0.06, "#6ad0ff"); // 눈
  };
  EXTRA_SHAPES.w6_cargoBox = (m) => {
    drawBox(m.x - 0.32, m.y - 0.32, 0, 0.64, 0.64, 0.5, m.hp < (m.maxHp || 6) * 0.5 ? "#8a6236" : "#b8844e");
    drawBox(m.x - 0.33, m.y - 0.05, 0.1, 0.66, 0.1, 0.32, "#6a4a2a"); drawBox(m.x - 0.05, m.y - 0.33, 0.1, 0.1, 0.66, 0.32, "#6a4a2a");
  };
  EXTRA_SHAPES.w6_glassMirror = (m) => {
    const a = w6cMirrorAng(m), cx = Math.cos(a), cy = Math.sin(a);
    drawBox(m.x - 0.22, m.y - 0.22, 0, 0.44, 0.44, 0.25, "#a88a5a"); // 받침
    // 거울판: 빛 나가는 쪽을 보는 얇은 판 (빛 방향과 직각으로 놓여요)
    const px = -cy * 0.32, py = cx * 0.32;
    drawBox(m.x + px * 0.5 - 0.08, m.y + py * 0.5 - 0.08, 0.25, 0.16, 0.16, 0.7, m.w6cHit > 0 ? "#ffffff" : "#bfeaff");
    drawBox(m.x - px * 0.5 - 0.08, m.y - py * 0.5 - 0.08, 0.25, 0.16, 0.16, 0.7, m.w6cHit > 0 ? "#ffffff" : "#9ad8f0");
    drawBox(m.x + cx * 0.22 - 0.06, m.y + cy * 0.22 - 0.06, 0.55, 0.12, 0.12, 0.12, "#ffe27a"); // 빛 나가는 구멍
  };
}

// ----- 반들이 거울: 치면 방향이 돌아가고, 빛 길이 보스에게 닿으면 눈부셔 비틀 -----
const W6C = { mirrorLen: 10, mirrorCd: 5, stun: 2.5, frac: 0.03 };
function w6cMirrorAng(m) { return ((m.w6cDir || 0) % 8) * Math.PI / 4; }
// 빛 길(점에서 방향으로 len 칸)과 점 사이 거리
function w6cBeamDist(m, x, y) {
  const a = w6cMirrorAng(m), ux = Math.cos(a), uy = Math.sin(a), dx = x - m.x, dy = y - m.y;
  const t = Math.max(0, Math.min(W6C.mirrorLen, dx * ux + dy * uy));
  return Math.hypot(dx - ux * t, dy - uy * t);
}
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m) return false;
  if (m.type === "w6_glassMirror") {
    if (h.opts.dot || game.time - (m.w6cTapT || -9) < 0.35) return true;
    m.w6cTapT = game.time; m.w6cDir = ((m.w6cDir || 0) + 1) % 8;
    addFloatText(m.x, m.y, "거울이 빙글!", "#bfeaff", 16);
    if (typeof sfx !== "undefined" && sfx.click) sfx.click();
    return true;
  }
  return false;
}, 4);
hookOn("dungeonTick", (dt) => {
  for (const o of monsters) if (o.type === "w6_glassMirror") { if (o.w6cHit > 0) o.w6cHit = Math.max(0, o.w6cHit - dt); if (o.w6cCd > 0) o.w6cCd = Math.max(0, o.w6cCd - dt); }
  const b = typeof w6bBoss === "function" ? w6bBoss() : null;
  if (!b || !b.w6cScorpion) return;
  if (!b.w6cInit) {
    b.w6cInit = true;
    const c = world.W / 2, d = Math.max(4, world.W / 2 - 4) * 0.55;
    [[0, -1, 2], [-1, 0.6, 7], [1, 0.6, 5]].forEach(([ox, oy, dir]) => { const s = spawnProp("w6_glassMirror", c + ox * d, c + oy * d, b); s.r = 0.38; s.appearTimer = 0; s.w6cDir = dir; s.w6cHit = 0; s.w6cCd = 0; });
  }
  if (b.invuln > 0 || b.invulnT > 0) return;
  for (const o of monsters) {
    if (o.type !== "w6_glassMirror" || o.w6cCd > 0) continue;
    if (w6cBeamDist(o, b.x, b.y) > (b.r || 1) + 0.35) continue;
    o.w6cCd = W6C.mirrorCd; o.w6cHit = 1.2;
    if (typeof w5bStun === "function") w5bStun(b, W6C.stun, W6C.frac, "앗 눈부셔! 반짝반짝", "#bfeaff");
    else { b.stagger = Math.max(b.stagger || 0, W6C.stun); damageMonster(b, b.maxHp * W6C.frac, b.x, b.y, false, 0, { w6Prop: true }); }
    hookRun("w6cMirrorHit", b, o);
    break;
  }
}, 42);
// 빛 길 그리기 (바닥에 노란 길, 보스에게 닿으면 하얗게)
hookOn("drawMonsterUnder", (m) => {
  if (m.type !== "w6_glassMirror") return;
  const a = w6cMirrorAng(m), ex = m.x + Math.cos(a) * W6C.mirrorLen, ey = m.y + Math.sin(a) * W6C.mirrorLen;
  const s0 = toScreen(m.x, m.y, 0.4), s1 = toScreen(ex, ey, 0.4);
  ctx.save();
  // 바깥 빛 번짐 + 안쪽 밝은 줄 (아이 눈에 잘 보이게)
  ctx.globalAlpha = m.w6cCd > 0 && !(m.w6cHit > 0) ? 0.18 : 0.35; ctx.strokeStyle = "#fff6c0"; ctx.lineWidth = 14 * ZOOM;
  ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
  ctx.globalAlpha = m.w6cHit > 0 ? 1 : (m.w6cCd > 0 ? 0.35 : 0.9);
  ctx.strokeStyle = m.w6cHit > 0 ? "#ffffff" : "#ffd23f"; ctx.lineWidth = (m.w6cHit > 0 ? 8 : 5) * ZOOM;
  ctx.setLineDash(m.w6cCd > 0 && !(m.w6cHit > 0) ? [6, 8] : []);
  ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
  ctx.restore();
}, 50);
hookOn("lights", (lights) => { for (const o of monsters) if (o.type === "w6_glassMirror") lights.push({ x: o.x, y: o.y, radius: o.w6cHit > 0 ? 3 : 1.4, power: 0.5 }); }, 50);
// 짐 상자: 부서질 때 나무 조각
hookOn("monsterKilled", (m) => { if (m && m.type === "w6_cargoBox") spawnBurst(m.x, m.y, ["#b8844e", "#6a4a2a", "#ffe27a"], 10); });

// ----- 보스 세 명 -----
const W6C_LIST = [
  { mapId: "sunken_temple", type: "w6_mummyCat", name: "미라 고양이 둘둘이", title: "모래에 묻힌 신전", size: 2.8, hp: 440, speed: 1.2,
    material: { id: "w6_templeBandage", name: "황금 붕대", color: "#f4e0a0" },
    legend: { id: "L_w6_sunken_temple", slot: "charm", name: "둘둘이 황금 붕대 팔찌", icon: "bracelet", color: "#f4e0a0", perk: { regen: 12, hearts: 2 }, desc: "둘둘이가 감아 준 팔찌: 하트 +2, 회복 +12%" },
    phases: [
      { until: 0.66, abilities: ["w6_bandageRope", "w6_sandWave"] },
      { until: 0.33, abilities: ["w6_bandageRope", "w6_coffinOpen", "w6_sunSpot"] },
      { abilities: ["w6_bandageWeb", "w6_bandageRope", "w6_coffinOpen", "w6_sandRain"] },
    ],
    msg: ["관 뚜껑이 덜컹! 꼬마 미라를 먼저 정리해요", "붕대 그물이 떨어져요! 빈틈으로 쏙!"],
    calm: "둘둘이의 붕대가 스르르 풀렸어요! 낮잠 자던 신전 고양이였대요",
    voice: { intro: () => { tone(330, 0.3, "triangle", 0.07, 220); tone(440, 0.25, "sine", 0.05, 660, 0.3); }, fall: () => { tone(500, 0.6, "sine", 0.06, 200); noise(0.4, 0.15, 900, "lowpass", 0.2); } } },
  { mapId: "glassdune", type: "w6_glassScorpion", name: "유리 전갈 반들이", title: "유리 모래 언덕", size: 2.9, hp: 455, speed: 1.4, scorpion: true,
    material: { id: "w6_glassShard", name: "반짝 유리 조각", color: "#bfeaff" },
    legend: { id: "L_w6_glassdune", slot: "weapon", name: "반들이 유리 검", effect: "chain", mul: 1.08, color: "#bfeaff", forms: { w: "반들이 유리 검", m: "반들이 유리 지팡이", d: "반들이 유리 지팡이", h: "반들이 유리 단검" }, desc: "반짝 유리로 만든 무기: 번쩍 옮겨 붙는 빛" },
    phases: [
      { until: 0.66, abilities: ["w6_glassSting", "w6_sandWave"] },
      { until: 0.33, abilities: ["w6_glassSting", "w6_glassBeam", "w6_sunSpot"] },
      { abilities: ["w6_glassBeam", "w6_glassSting", "w6_glassBeam", "w6_duneRing"] },
    ],
    msg: ["거울을 쳐서 빛 길을 반들이에게 돌려요!", "빛줄기가 두 번! 빛 길 옆으로!"],
    calm: "반들이가 눈을 깜빡! 햇빛을 모으던 유리 전갈이었대요",
    voice: { intro: () => { [1600, 2000, 2400].forEach((f, i) => tone(f, 0.08, "sine", 0.05, null, i * 0.07)); tone(180, 0.5, "sawtooth", 0.05, 120, 0.2); }, fall: () => { for (let i = 0; i < 6; i++) tone(2400 - i * 250, 0.08, "triangle", 0.05, null, i * 0.06); } } },
  { mapId: "camelroad", type: "w6_caravanCamel", name: "대상단 낙타 쿵덕이", title: "낙타 길", size: 3.1, hp: 470, speed: 1.3,
    material: { id: "w6_camelBell", name: "낙타 방울", color: "#e8c070" },
    legend: { id: "L_w6_camelroad", slot: "charm", name: "쿵덕이 낙타 방울", icon: "amulet", color: "#e8c070", perk: { speed: 0.08, hearts: 2 }, desc: "딸랑딸랑 낙타 방울: 하트 +2, 빠르기 +8%" },
    phases: [
      { until: 0.66, abilities: ["w6_camelCharge", "w6_sandWave"] },
      { until: 0.33, abilities: ["w6_camelCharge", "w6_cargoDrop", "w6_sandRain"] },
      { abilities: ["w6_camelStampede", "w6_camelCharge", "w6_cargoDrop", "w6_duneRing"] },
    ],
    msg: ["짐 상자가 쿵! 부수거나 돌아서 가요", "꼬마 낙타가 우르르! 발자국 사이 빈틈에!"],
    calm: "쿵덕이가 무릎을 꿇고 쉬어요. 길 잃은 대상단의 대장 낙타였대요",
    voice: { intro: () => { tone(120, 0.5, "square", 0.07, 90); tone(260, 0.3, "triangle", 0.05, 200, 0.4); }, fall: () => { tone(160, 0.8, "triangle", 0.07, 60); noise(0.5, 0.2, 400, "lowpass", 0.2); } } },
];
const W6C_DRAW = {
  // 미라 고양이: 붕대 감은 둥근 몸, 뾰족 귀, 파란 눈, 붕대 꼬리
  w6_mummyCat(m) {
    const P = b2Pose(m), t = game.time, wrap = "#efe6cc", line = "#c8b890";
    b2DrawBody(m, [
      { f: -0.05, s: 0, z: 0.0 + P.breath, w: 1.1, d: 0.95, h: 0.75, c: wrap },
      { f: -0.05, s: 0, z: 0.35 + P.breath, w: 1.12, d: 0.97, h: 0.07, c: line },
      { f: 0.55, s: 0.3, z: 0.0, w: 0.3, d: 0.22, h: 0.22, c: wrap }, { f: 0.55, s: -0.3, z: 0.0, w: 0.3, d: 0.22, h: 0.22, c: wrap },
      { f: -0.8, s: 0, z: 0.25 + Math.sin(t * 3) * 0.1, w: 0.55, d: 0.13, h: 0.13, c: line },
      { f: 0.25, s: 0, z: 0.75 + P.breath, w: 0.7, d: 0.75, h: 0.6, c: wrap, face: true, eye: "#6ad0ff", pupil: "#1a3a6a" },
      { f: 0.25, s: 0, z: 1.0 + P.breath, w: 0.72, d: 0.77, h: 0.06, c: line },
      { f: 0.2, s: 0.25, z: 1.35 + P.breath, w: 0.16, d: 0.16, h: 0.22, c: wrap }, { f: 0.2, s: -0.25, z: 1.35 + P.breath, w: 0.16, d: 0.16, h: 0.22, c: wrap },
      { f: 0.2, s: 0, z: 1.35 + P.breath, w: 0.3, d: 0.3, h: 0.08, c: "#ffd060" }, // 작은 금관
    ], { top: 1.7 });
  },
  // 유리 전갈: 투명한 하늘색 몸, 집게 둘, 위로 굽은 꼬리, 끝은 반짝 침
  w6_glassScorpion(m) {
    const P = b2Pose(m), t = game.time, glass = "#bfeaff", deep = "#7ac8e8", tip = Math.sin(t * 5) > 0 ? "#ffffff" : "#ffe27a";
    b2DrawBody(m, [
      { f: 0, s: 0, z: 0.1 + P.breath, w: 1.2, d: 0.85, h: 0.4, c: glass },
      { f: 0.05, s: 0, z: 0.5 + P.breath, w: 0.9, d: 0.6, h: 0.12, c: deep },
      { f: 0.75, s: 0.45, z: 0.15, w: 0.55, d: 0.25, h: 0.25, c: glass }, { f: 0.75, s: -0.45, z: 0.15, w: 0.55, d: 0.25, h: 0.25, c: glass },
      { f: 1.05, s: 0.55, z: 0.2, w: 0.28, d: 0.32, h: 0.2, c: deep }, { f: 1.05, s: -0.55, z: 0.2, w: 0.28, d: 0.32, h: 0.2, c: deep },
      { f: 0.55, s: 0, z: 0.4 + P.breath, w: 0.4, d: 0.5, h: 0.3, c: glass, face: true, eye: "#ffffff", pupil: "#2a4a7a" },
      { f: -0.7, s: 0, z: 0.3, w: 0.35, d: 0.3, h: 0.35, c: glass }, { f: -0.85, s: 0, z: 0.65, w: 0.28, d: 0.26, h: 0.4, c: glass },
      { f: -0.7, s: 0, z: 1.05, w: 0.26, d: 0.24, h: 0.3, c: deep }, { f: -0.45, s: 0, z: 1.3, w: 0.22, d: 0.2, h: 0.2, c: tip },
      { f: 0, s: 0.5, z: 0.0, w: 0.9, d: 0.12, h: 0.12, c: deep }, { f: 0, s: -0.5, z: 0.0, w: 0.9, d: 0.12, h: 0.12, c: deep }, // 다리
    ], { top: 1.6 });
  },
  // 대상단 낙타: 혹 둘, 긴 목, 등에 줄무늬 짐 보따리, 목에 방울
  w6_caravanCamel(m) {
    const P = b2Pose(m), t = game.time, fur = "#d8a860", dark = "#b8884a", step = Math.sin((m.walkTime || 0) * 8) * 0.06;
    b2DrawBody(m, [
      { f: 0.35, s: 0.25, z: 0, w: 0.16, d: 0.16, h: 0.55 + step, c: dark }, { f: 0.35, s: -0.25, z: 0, w: 0.16, d: 0.16, h: 0.55 - step, c: dark },
      { f: -0.45, s: 0.25, z: 0, w: 0.16, d: 0.16, h: 0.55 - step, c: dark }, { f: -0.45, s: -0.25, z: 0, w: 0.16, d: 0.16, h: 0.55 + step, c: dark },
      { f: -0.05, s: 0, z: 0.55 + P.breath, w: 1.3, d: 0.75, h: 0.45, c: fur },
      { f: 0.2, s: 0, z: 1.0 + P.breath, w: 0.35, d: 0.45, h: 0.28, c: fur }, { f: -0.35, s: 0, z: 1.0 + P.breath, w: 0.35, d: 0.45, h: 0.28, c: fur }, // 혹
      { f: -0.08, s: 0.45, z: 0.75, w: 0.6, d: 0.2, h: 0.35, c: "#c0504a" }, { f: -0.08, s: -0.45, z: 0.75, w: 0.6, d: 0.2, h: 0.35, c: "#4a8ad0" }, // 짐 보따리
      { f: -0.08, s: 0.45, z: 0.88, w: 0.6, d: 0.21, h: 0.06, c: "#ffd060" }, { f: -0.08, s: -0.45, z: 0.88, w: 0.6, d: 0.21, h: 0.06, c: "#ffd060" },
      { f: 0.7, s: 0, z: 0.85 + P.breath, w: 0.25, d: 0.25, h: 0.55, c: fur }, // 목
      { f: 0.85, s: 0, z: 1.35 + P.breath, w: 0.5, d: 0.38, h: 0.32, c: fur, face: true, eye: "#ffffff", pupil: "#3a2a1a" },
      { f: 0.75, s: 0, z: 0.95, w: 0.12, d: 0.12, h: 0.12, c: Math.sin(t * 6) > 0 ? "#ffe27a" : "#e8c070" }, // 방울
    ], { top: 1.9 });
  },
};
for (const E of W6C_LIST) {
  MONSTERS[E.type] = { color: E.material.color, name: E.name, shape: E.type, behavior: "b2_boss", hp: E.hp, speed: E.speed, damage: 2.7, xp: 90, emerald: 1, emeraldCount: 20,
    attackRange: 2.2, attackCooldown: 1.8, world: 6, isBoss: true, heavy: true, size: E.size, phases: E.phases };
  MATERIALS[E.material.id] = { name: E.material.name, color: E.material.color };
  const map = typeof MAPS !== "undefined" ? MAPS.find((m) => m.id === E.mapId) : null;
  BOSS_DEFS[E.mapId] = {
    id: E.type, name: E.name, title: E.title, size: E.size, world: 6, w6New: true, material: E.material,
    arena: { size: 26, theme: (map && map.theme) || (typeof W6_BOSS_THEME !== "undefined" ? W6_BOSS_THEME : undefined) },
    phases: E.phases,
    create(x, y, level) {
      const m = b2MakeBoss(E.type, x, y, level, E.size);
      m.bossDef = BOSS_DEFS[E.mapId]; m.name = `${E.title}, ${E.name}`; m.w6cBoss = E.mapId;
      if (E.scorpion) m.w6cScorpion = true;
      const base = m.onPhase;
      m.onPhase = (idx) => { if (base) base(idx); const t = E.msg[idx - 1]; if (t) showMessage(t, 3, false, "#ffe27a"); };
      return m;
    },
  };
  if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES[E.type] = W6C_DRAW[E.type];
  if (typeof w6RegisterLegend === "function") w6RegisterLegend(E.mapId, E.legend);
  if (typeof BOSS_VOICE !== "undefined") BOSS_VOICE[E.mapId] = E.voice;
  if (typeof W6_BY_MAP !== "undefined") delete W6_BY_MAP[E.mapId];
}
hookOn("monsterKilled", (m) => {
  if (!m || !m.w6cBoss) return;
  const E = W6C_LIST.find((x) => x.mapId === m.w6cBoss); if (!E) return;
  for (let i = 0; i < 20; i++) addSparkle(m.x, m.y, 1.2, { vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, vz: 2.5, gravity: 3, life: 1, size: 0.6, hue: Math.random() * 360 });
  showMessage(E.calm, 4, true);
});
