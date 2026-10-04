// ===== 월드 4 보스 12 (마지막): 지하 대왕 부글대왕 (underthrone) (설계서 5-12) =====
// 앞 보스 기믹 섞기: 1단계 홀 쾅·종유석 비·배 돌진, 2단계 + 어둠(빛 수정 곁) + 불꼬마 + 불 숨결,
// 3단계 비틀기 "왕궁아 끓어라!": 6초 예고 뒤 왕궁 바닥이 12초 동안 용암(즉사 없음, 0.5초마다 하트 0.5, 하트 1에서 멈춤, 안전한 곳으로 밀려요).
//   안전한 곳 = 가운데 왕좌 단 + 네 귀퉁이 금색 발판 + 왕좌로 이어지는 금색 다리 둘. 대왕은 왕좌 단에 앉아 활·탄을 쏘고,
//   아이는 다리로 왕좌 단까지 뛰어가 칼로 쳐요. 용암이 빠지면 대왕이 6초 비틀(피해 x1.5).
//   (설계서 12-4 의 "광차에서 내려 왕좌 단으로 뛰어가 칼" 안을 골랐어요: 광차 레일·탑승은 under_env.js 의 레일과 같이 하기 탑승 규칙이
//    필요해서, 이 파일만으로 두 기기에서 똑같이 도는 쪽으로 줄였어요. 용암 18초 -> 12초, 다리 2개.)
// 같이 하기: 용암 상태(ukBoilWarn·ukBoilOn)·어둠(ukDarkOn)은 보스 칸, 용암 하트·밀기는 방장이 모든 주인공에게.

const W4U = { warn: 6, lava: 12, stun: 6, tick: 0.5, dmg: 0.5, push: 3, dais: 3.4, corners: [[-9, -9], [9, -9], [9, 9], [-9, 9]], cornerR: 1.6, bridgeHalf: 0.9, dark: 0.7 };

Object.assign(MATERIALS, { w4_kingHorn: { name: "부글대왕 뿔", color: "#b08aff" } });
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") {
  defBase("L_underKing", { slot: "charm", legend: "underthrone", name: "지하 대왕의 왕관", minL: 0, icon: "crown", color: "#b08aff", perk: { hearts: 3, dmg: 0.1 }, desc: "지하 대왕을 물리친 증표: 하트 +3, 공격력 +10%" });
  BOSS_LEGENDS.underthrone = "L_underKing";
}
const W4U_IMP = w4fMon("w4_imp", "boomer");
Object.assign(ABILITIES, {
  w4_ukScepter: { name: "홀 쾅", desc: "금 홀로 앞을 쾅! 그 뒤 숨을 골라요.", counter: "빨간 원 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.2, at: "front", offset: 1.8, time: 1.3 },
    cooldown: 5, range: [0, 4], damageMul: 2.1, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.5 } },
  w4_ukDrips: { name: "종유석 비", desc: "천장에서 종유석이 여러 군데 뚝뚝 떨어져요.", counter: "그림자 사이로 걸어가요",
    tags: ["boss", "multi", "sky"], telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.3 },
    cooldown: 8, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 4, stagger: 0.1 } },
  w4_ukDash: { ...ABILITIES.w2_bellySlide, name: "배 돌진", desc: "통통한 배로 빨간 길을 쭉 미끄러져 와요.", counter: "빨간 길 옆으로! 멈추면 때려요" },
  w4_ukFire: { name: "불 숨결", desc: "부채꼴로 뜨거운 숨을 후!", counter: "부채꼴 밖으로",
    tags: ["boss", "cone"], telegraph: { shape: "cone", length: 6, angle: 1.0, at: "self", time: 1.3 },
    cooldown: 6, range: [0, 6], damageMul: 1.8, anim: "roar", effect: { type: "damage" } },
  w4_ukCall: { name: "불꼬마 부르기", desc: "불꼬마 둘을 불러요.", counter: "불꼬마부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: W4U_IMP, count: 2 } },
  w4_ukBoil: { name: "왕궁아 끓어라!", desc: "6초 뒤 왕궁 바닥이 용암으로 끓어요! 금색 발판·다리·왕좌 단은 안전해요.", counter: "금색 다리로 왕좌 단까지 뛰어가 칼로 쳐요",
    tags: ["boss", "room"], telegraph: { shape: "self", radius: 1.5, at: "self", time: 1.2 }, cooldown: 30, range: [0, 40], damageMul: 0, anim: "roar",
    effect: { type: "w4_ukBoil" } },
});
// 용암 중 대왕이 쏘는 것 (왕좌 단에서)
ABILITIES.w4_ukVolley = { ...ABILITIES.volley, name: "불덩이 던지기", desc: "왕좌에서 불덩이를 부채꼴로 던져요.", counter: "탄 사이로 옆걸음!" };
ABILITIES.w4_ukTrack = { ...ABILITIES.trackingStrike, name: "왕의 눈길", desc: "따라오는 원이 멈추면 쾅!", counter: "원이 멈추면 비켜요" };

w4fMakeBoss({ mapId: "underthrone", type: "w4_underKing", name: "부글대왕", title: "지하 대왕", color: "#8a5ab8", size: 3.6, r: 1.2, hp: 300, damage: 2.6, speed: 1.0, arena: 30,
  material: { id: "w4_kingHorn", name: "부글대왕 뿔", color: "#b08aff" },
  theme: { floor: "#4a3a4a", moss: "#ffc040", wall: "#2e2230", darkness: 0.4, bg: "#0a0408", lava: true },
  build(w) {
    const c = w.W / 2;
    for (const [dx, dy] of [[-6, -6], [6, -6], [6, 6], [-6, 6]]) w4AddCrystal(w, c + dx, c + dy);
    [[-4, 7], [4, -7], [7, 4], [-7, -4]].forEach(([dx, dy], i) => w4AddDrip(w, c + dx, c + dy, 8, i * 2));
  },
  init(m) { m.ukBoilWarn = 0; m.ukBoilOn = 0; m.ukDarkOn = 0; },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_ukScepter", "w4_ukDrips", "w4_ukDash", "w4_ukScepter"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_ukCall", "w4_ukScepter", "w4_ukFire", "w4_ukDrips", "w4_ukDash"] },
    { until: 0, gap: 1.4, pattern: ["w4_ukBoil", "w4_ukVolley", "w4_ukTrack", "w4_ukVolley", "w4_ukTrack", "w4_ukVolley", "w4_ukScepter", "w4_ukFire", "w4_ukDash", "w4_ukDrips"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) { m.ukDarkOn = 1; showMessage("왕궁이 어두워져요! 빛 수정 곁에서 싸워요", 3, false, "#b08aff"); }
    if (idx === 2) showMessage("대왕이 화났어요! 왕궁이 끓으면 금색 다리로", 3, true, "#ffc040");
  } });

// 안전한 곳인가 (왕좌 단·귀퉁이 발판·다리)
function w4ukSafe(x, y, c = world.W / 2) {
  if (Math.hypot(x - c, y - c) < W4U.dais) return true;
  if (W4U.corners.some(([dx, dy]) => Math.hypot(x - c - dx, y - c - dy) < W4U.cornerR)) return true;
  if (Math.abs(y - c) < W4U.bridgeHalf && Math.abs(x - c) < c) return true; // 가로 다리 (양쪽 벽에서 왕좌까지)
  return false;
}
// 가장 가까운 안전한 점
function w4ukSafePoint(x, y, c = world.W / 2) {
  const cand = [];
  { const d = Math.hypot(x - c, y - c) || 1; cand.push({ x: c + (x - c) / d * (W4U.dais - 0.4), y: c + (y - c) / d * (W4U.dais - 0.4) }); }
  for (const [dx, dy] of W4U.corners) cand.push({ x: c + dx, y: c + dy });
  cand.push({ x, y: c });
  return cand.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
}
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w4_ukBoil") return false;
  const m = c.m;
  if (m && m.hp > 0 && !(m.ukBoilWarn > 0) && !(m.ukBoilOn > 0)) { m.ukBoilWarn = W4U.warn; showMessage("왕궁아 끓어라! 금색 다리·발판으로!", 3, true, "#ffc040"); if (typeof guideSpeak === "function") guideSpeak("금색 다리로 왕좌 단까지 가요!", "ukBoil", 2); }
  return true;
}, 15);
hookOn("dungeonTick", (dt) => {
  const b = w4fBoss("w4_underKing");
  if (!b) return;
  const c = world.W / 2;
  if (b.ukBoilWarn > 0) { b.ukBoilWarn -= dt; if (b.ukBoilWarn <= 0) { b.ukBoilWarn = 0; b.ukBoilOn = W4U.lava; } }
  if (!(b.ukBoilOn > 0)) return;
  // 대왕은 왕좌 단에 앉아요
  b.x = c; b.y = c; b.moving = false;
  b.ukBoilOn -= dt;
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    if (w4ukSafe(p.x, p.y, c)) { p.ukLavaT = 0; continue; }
    p.ukLavaT = (p.ukLavaT || 0) + dt; p.stillT = 0; // 용암 위에선 쉬어도 하트가 안 차요 (survival.js)
    if (p.ukLavaT >= W4U.tick) { p.ukLavaT -= W4U.tick; if (p.hp > 1) { p.hp = Math.max(1, p.hp - W4U.dmg); addFloatText(p.x, p.y, "앗 뜨거!", "#ff9a3a", 16); } }
    const s = w4ukSafePoint(p.x, p.y, c), dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy) || 1;
    moveEntity(p, dx / d * Math.min(d, W4U.push * dt), dy / d * Math.min(d, W4U.push * dt));
  }
  if (b.ukBoilOn <= 0) { b.ukBoilOn = 0; w4fStun(b, W4U.stun, 0, "부글… 지쳤다!"); showMessage("용암이 빠졌어요! 지금 공격!", 2.4, false, "#7dffb0"); }
}, 40);
// 어둠 (2단계부터): 두 기기 모두 보스 칸을 보고 테마 어둠을 바꿔요
hookOn("drawFloor", () => {
  const b = w4fSeen("w4_underKing");
  if (!b) return;
  if (world.ukBaseDark === undefined) world.ukBaseDark = world.theme.darkness;
  const want = b.ukDarkOn ? Math.max(world.ukBaseDark, W4U.dark) : world.ukBaseDark;
  world.theme.darkness += (want - world.theme.darkness) * 0.02;
  // 용암 예고 / 용암
  if (b.ukBoilWarn > 0 || b.ukBoilOn > 0) {
    const c = world.W / 2, R = c - 1.5, on = b.ukBoilOn > 0;
    if (on) w4fDisc(c, c, R, `rgba(255,${110 + Math.floor(30 * Math.sin(game.time * 4))},40,0.55)`);
    else for (let r = 4; r < R; r += 2.2) w4fRing(c, c, r, "rgba(255,160,60,0.7)", 2.5, true);
    w4fDisc(c, c, W4U.dais, on ? "rgba(255,210,90,0.55)" : "rgba(255,210,90,0.25)");
    for (const [dx, dy] of W4U.corners) w4fDisc(c + dx, c + dy, W4U.cornerR, "rgba(255,210,90,0.6)");
    const h = W4U.bridgeHalf, q = [toScreen(c - R, c - h, 0.025), toScreen(c + R, c - h, 0.025), toScreen(c + R, c + h, 0.025), toScreen(c - R, c + h, 0.025)];
    ctx.save(); ctx.fillStyle = "rgba(255,210,90,0.6)"; ctx.beginPath(); q.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath(); ctx.fill(); ctx.restore();
    w4fRing(c, c, W4U.dais, "#ffd23f", 3);
  }
}, 40);
hookOn("hudDraw", () => {
  const b = w4fSeen("w4_underKing"); if (!b) return;
  if (b.ukBoilWarn > 0) text(`왕궁이 끓어요! ${Math.ceil(b.ukBoilWarn)}초 · 금색 다리로 왕좌 단까지`, view.w / 2, 120, 18, "#ffc040", "center");
  else if (b.ukBoilOn > 0) text(`용암 ${Math.ceil(b.ukBoilOn)}초 · 금색 곳에 있어요`, view.w / 2, 120, 16, "#ff9a3a", "center");
}, 60);

Object.assign(EXTRA_SHAPES, {
  // 부글대왕: 통통한 보라 왕, 뿔 2, 금 왕관, 주황 망토, 큰 눈, 화나면 볼이 빨개져요
  w4_underKing(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.9 : 1, up = a.raise * 0.1, pur = "#8a5ab8", dk = "#6a3e98";
    for (const sd of [1, -1]) P.push([0.02 + a.walk * sd * 0.04, sd * 0.14, 0, 0.16, 0.14, 0.14, dk]);
    P.push([-0.12, 0, 0.12, 0.12, 0.5, 0.5 * sq, "#ff9a3a"]); // 주황 망토
    P.push([0.02, 0, 0.14, 0.44, 0.46, 0.36 * sq, pur]);
    P.push([0.2, 0, 0.18, 0.04, 0.3, 0.24 * sq, "#b08ad8"]);
    P.push([0.04, 0, 0.5 * sq, 0.32, 0.34, 0.26, pur]);
    eyes(P, 0.205, 0.08, 0.64 * sq, 0.07, "#2a1a10", a.stag);
    if (m.phaseIdx >= 2) for (const sd of [1, -1]) P.push([0.205, sd * 0.13, 0.56 * sq, 0.02, 0.05, 0.03, "#ff6a6a"]); // 빨간 볼
    for (const sd of [1, -1]) P.push([0.02, sd * 0.17, 0.78 * sq, 0.06, 0.06, 0.16, "#e8d8c8"]); // 뿔
    P.push([0.04, 0, 0.76 * sq, 0.24, 0.26, 0.06, "#ffc040"]);
    for (const sd of [-1, 0, 1]) P.push([0.04, sd * 0.09, 0.82 * sq, 0.04, 0.04, 0.06, "#ffe27a"]);
    P.push([0.14 + up, 0.28, 0.3 + up * 2, 0.04, 0.04, 0.46, "#c8902a"], [0.14 + up, 0.28, 0.76 + up * 2, 0.1, 0.1, 0.1, "#b08aff", true]); // 홀
    drawVoxelParts(m, P, { top: 0.92 });
  },
});

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_ukScepter: { text: "원 밖으로! 그다음 공격" },
  w4_ukDrips: { text: "그림자 사이로 걸어가요" },
  w4_ukDash: { text: "빨간 길 옆으로!" },
  w4_ukFire: { text: "부채꼴 밖으로" },
  w4_ukCall: { text: "불꼬마부터 정리해요" },
  w4_ukBoil: { text: "금색 다리로 왕좌 단까지!", do: true, voice: true },
  w4_ukVolley: { text: "탄 사이로 옆걸음!" },
  w4_ukTrack: { text: "원이 멈추면 비켜요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.underthrone = { 0: "홀 쾅 뒤에 공격해요", 1: "어두워져요! 빛 수정 곁에서", 2: "왕궁이 끓으면 금색 다리로 왕좌 단까지!" };
