// ===== 월드 4 보스 11: 방망이 도깨비 뚝딱이 (goblintown) (설계서 5-11) =====
// 새 아이디어: "뚝딱!" 하면 분신 3개(맞으면 펑 사라져요, 아프지 않아요). 장터 등불(6개) 하나를 쳐서 켜면 그 빛 안에서
//   진짜 뚝딱이에게만 진한 그림자가 생겨요. 진짜를 때리면 분신이 모두 사라지고 3초 비틀. 등불을 안 켜도 분신은 시간이 지나면 사라져요(쉬움 10초).
// 등불은 이 보스 몫 소품(w4_lantern)이라 world.w4.crystals 에 넣지 않아요 (under_env.js 의 수정 소품과 섞이지 않게).
// 같이 하기: 등불 켜짐(lnT)·분신 표시(dkFake)는 몬스터 칸, 계산은 방장만.

const W4K = { lanterns: [[-9, -4], [9, -4], [-9, 5], [9, 5], [-3, -10], [3, 10]], litT: 12, litR: 3.2, cloneT: { easy: 10, normal: 16, hard: 16, nightmare: 16 }, stun: 3.0, clones: 3 };

Object.assign(MATERIALS, { w4_dokkaebiHorn: { name: "뚝딱이 노란 뿔", color: "#ffd040", enchant: "chain" } });
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") {
  defBase("L_dokkaebi", { slot: "weapon", legend: "goblintown", name: "도깨비 금 방망이", minL: 0, color: "#ffd040", mul: 1.06, effect: "chain",
    forms: LEGEND_FORMS({ w: "도깨비 금 방망이", m: "도깨비 금 지팡이", d: "도깨비 금 지팡이", h: "도깨비 금 단검" }, "staff"), desc: "뚝딱! 번개가 옆 몬스터로 튀어요 (공격력 +6%)" });
  BOSS_LEGENDS.goblintown = "L_dokkaebi";
}
w4fProp("w4_lantern", "장터 등불", "#ffd060");
// 분신 (2단계: 공격 안 함 / 3단계: 방망이 쾅 예고를 같이 해요, 피해 x0.5)
MONSTERS.w4_dkFake = { name: "뚝딱이", shape: "w4_dokkaebi", behavior: "melee", color: "#5a8ad8", hp: 1, speed: 1.3, damage: 0.6, xp: 0, emerald: 0, size: 3.0, world: 4, codexSkip: true };
MONSTERS.w4_dkFake3 = { ...MONSTERS.w4_dkFake, abilities: ["w4_dkFakeClub"] };
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w4_dkFake", "w4_dkFake3");
if (typeof CODEX_SKIP !== "undefined") { CODEX_SKIP.add("w4_dkFake"); CODEX_SKIP.add("w4_dkFake3"); }

const W4K_KID = w4fMon("w4_dokkaebiKid", "goblin" in MONSTERS ? "goblin" : "zombie");
Object.assign(ABILITIES, {
  w4_dkClub: { name: "방망이 쾅", desc: "금 방망이로 앞을 쾅! 그 뒤 숨을 골라요.", counter: "빨간 원 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.0, at: "front", offset: 1.6, time: 1.2 },
    cooldown: 5, range: [0, 3.6], damageMul: 2.0, anim: "slam", staggerAfter: 1.8, effect: { type: "knockback", force: 1.3 } },
  w4_dkCoins: { name: "금 나와라 뚝딱", desc: "동전 비가 여러 군데 떨어져요. 끝나면 진짜 에메랄드가 3개 떨어져요!", counter: "원 사이로! 끝나면 에메랄드 줍기",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.3 },
    cooldown: 8, range: [0, 14], damageMul: 1.2, anim: "raise", effect: { type: "rain", count: 6, spread: 3.4, stagger: 0.15 } },
  w4_dkClones: { name: "뚝딱 분신", desc: "뚝딱! 똑같이 생긴 분신 셋이 나와요. 분신은 맞으면 펑!", counter: "등불을 켜면 진짜만 그림자가 생겨요. 진짜를 때려요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "w4_dkClones" } },
  w4_dkCall: { name: "꼬마 도깨비 부르기", desc: "꼬마 도깨비 둘을 불러요.", counter: "꼬마부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: W4K_KID, count: 2 } },
  w4_dkFakeClub: { name: "분신 방망이 쾅", desc: "분신도 방망이를 쾅! 가짜도 아파요(조금).", counter: "빨간 원 밖으로",
    tags: ["area"], telegraph: { shape: "circle", radius: 2.0, at: "front", offset: 1.4, time: 1.2 },
    cooldown: 6, range: [0, 3.2], damageMul: 0.5, anim: "slam", effect: { type: "damage" } },
});

w4fMakeBoss({ mapId: "goblintown", type: "w4_dokkaebi", name: "뚝딱이", title: "방망이 도깨비", color: "#5a8ad8", size: 3.0, r: 1.05, hp: 280, damage: 2.5, speed: 1.15, arena: 28,
  material: { id: "w4_dokkaebiHorn", name: "뚝딱이 노란 뿔", color: "#ffd040", enchant: "chain" },
  theme: { floor: "#6a5a3a", moss: "#ffd060", wall: "#4a3424", darkness: 0.45, bg: "#120c04" },
  build(w) { const c = w.W / 2; w4AddShroom(w, c - 6, c + 9, 0, -1); w4AddShroom(w, c + 6, c - 9, 0, 1); },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_dkClub", "w4_dkCoins", "w4_dkClub"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_dkClones", "w4_dkClub", "w4_dkCall", "w4_dkCoins", "w4_dkClub"] },
    { until: 0, gap: 1.4, pattern: ["w4_dkClones", "w4_dkClub", "blink", "w4_dkCoins", "w4_dkClub", "w4_dkCall"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) showMessage("분신이 나와요! 등불을 쳐서 켜면 진짜만 그림자가 생겨요", 3, false, "#ffd060");
    if (idx === 2) showMessage("분신도 방망이를 휘둘러요! 빨간 원은 다 피해요", 3, false, "#ffd060");
  } });

function w4dkLanterns() { return w4fProps("w4_lantern"); }
function w4dkFakes() { return monsters.filter((o) => o.dkFake && o.hp > 0); }
// 진짜 그림자가 보이나 (켜진 등불 빛 안)
function w4dkShadow(b) { return w4dkLanterns().some((l) => (l.lnT || 0) > 0 && Math.hypot(l.x - b.x, l.y - b.y) < W4K.litR); }
function w4dkClearFakes(burst = true) { for (const o of w4dkFakes()) { if (burst) spawnBurst(o.x, o.y, ["#5a8ad8", "#ffd040"], 8); o.hp = 0; } }
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w4_dkClones") return false;
  if (c._dkDone) return true;
  c._dkDone = true;
  const m = c.m; if (!m || m.hp <= 0) return true;
  w4dkClearFakes(false);
  const third = (m.phaseIdx || 0) >= 2;
  for (let i = 0; i < W4K.clones; i++) {
    const a = (i / W4K.clones) * Math.PI * 2 + Math.random();
    const spot = findFreeSpot(m.x + Math.cos(a) * 3, m.y + Math.sin(a) * 3, m.r, 3) || { x: m.x, y: m.y };
    const d = createMonster(third ? "w4_dkFake3" : "w4_dkFake", spot.x, spot.y, m.level || 1);
    d.hp = d.maxHp = 1; d.dkFake = true; d.r = m.r; d.aggro = true; d.name = m.name; d.dkLife = W4K.cloneT[w4fDiff()] || 16;
    d.damage = (m.damage || 2) * 0.3;
    monsters.push(d);
    spawnBurst(spot.x, spot.y, ["#5a8ad8", "#ffd040"], 8);
  }
  { const s = findFreeSpot(m.x + (Math.random() - 0.5) * 5, m.y + (Math.random() - 0.5) * 5, m.r, 3); if (s) { m.x = s.x; m.y = s.y; } }
  addFloatText(m.x, m.y, "뚝딱!", "#ffd040", 26);
  return true;
}, 15);
hookOn("monsterDamage", (h) => {
  const m = h.m; if (!m) return false;
  if (m.dkFake) { if (!h.opts.dot) { spawnBurst(m.x, m.y, ["#5a8ad8", "#ffd040"], 10); addFloatText(m.x, m.y, "펑! 가짜", "#ffd040", 18); m.hp = 0; } return true; }
  if (m.type === "w4_lantern") {
    if (h.opts.dot || game.time - (m.lnHitT || -9) < 0.3) return true;
    m.lnHitT = game.time; m.lnT = W4K.litT;
    addFloatText(m.x, m.y, "반짝! 불이 켜졌어요", "#ffe27a", 18);
    return true;
  }
  if (m.type === "w4_dokkaebi" && !h.opts.dot && !h.opts.w4Prop && w4dkFakes().length) {
    w4dkClearFakes();
    w4fStun(m, W4K.stun, 0, "들켰다! 진짜 뚝딱이");
  }
  return false;
}, 4);
// 등불·분신 시간 + 동전 (방장)
hookOn("dungeonTick", (dt) => {
  for (const o of monsters) {
    if (o.dkCoinT > 0) { o.dkCoinT -= dt; if (o.dkCoinT <= 0) { for (let i = 0; i < 3; i++) dropPickup("emerald", o.dkCoinX + (Math.random() - 0.5) * 3, o.dkCoinY + (Math.random() - 0.5) * 3); } }
    if (o.dkFake && o.hp > 0) { o.dkLife -= dt; if (o.dkLife <= 0) { spawnBurst(o.x, o.y, ["#5a8ad8"], 6); o.hp = 0; } }
  }
  const b = w4fBoss("w4_dokkaebi");
  if (!b) return;
  if (!b.dkInit) { b.dkInit = true; const c = world.W / 2; for (const [ox, oy] of W4K.lanterns) { const l = spawnProp("w4_lantern", c + ox, c + oy, b); l.r = 0.45; l.lnT = 0; } }
  for (const l of w4dkLanterns()) if (l.lnT > 0) l.lnT = Math.max(0, l.lnT - dt);
  b.dkShadow = w4dkShadow(b) ? 1 : 0; // 친구 화면도 이 칸으로 그림자를 그려요
}, 40);
hookOn("castStarted", (m, id) => {
  if (id !== "w4_dkCoins" || !m) return;
  const c = casts.find((q) => q.m === m && q.id === id), p = typeof nearestPlayer === "function" ? nearestPlayer(m.x, m.y) : game.player;
  m.dkCoinT = (c && c.time ? c.time : 1.3) + 0.6; m.dkCoinX = p ? p.x : m.x; m.dkCoinY = p ? p.y : m.y;
}, 50);
hookOn("lights", (lights) => {
  for (const l of w4dkLanterns()) if ((l.lnT || 0) > 0) lights.push({ x: l.x, y: l.y, radius: W4K.litR, power: 0.9 });
}, 50);
// 진짜 뚝딱이 그림자: 켜진 등불 빛 안에서만 (분신은 없어요)
hookOn("drawMonsterUnder", (m) => {
  if (m.type !== "w4_dokkaebi" || !m.dkShadow) return;
  w4fDisc(m.x, m.y, (m.r || 1) * 1.15, "rgba(0,0,0,0.55)");
  w4fRing(m.x, m.y, (m.r || 1) * 1.25, "rgba(255,226,122,0.9)", 3);
}, 50);

function w4dkBody(m, P, a) {
  const sq = a.stag ? 0.9 : 1, up = a.raise * 0.12, blue = "#5a8ad8", dk = "#3e6ab8";
  for (const sd of [1, -1]) P.push([0.02 + a.walk * sd * 0.04, sd * 0.12, 0, 0.16, 0.13, 0.18, "#e0a030"]);
  P.push([0, 0, 0.12, 0.3, 0.34, 0.12, "#e0a030"], [0, 0, 0.13, 0.31, 0.35, 0.03, "#2a1a10"]); // 호랑이 무늬 바지
  P.push([0, 0, 0.24, 0.34, 0.38, 0.28 * sq, blue]);
  P.push([0.03, 0, 0.52 * sq, 0.3, 0.32, 0.26, blue]);
  eyes(P, 0.185, 0.07, 0.66 * sq, 0.06, "#2a1a10", a.stag);
  P.push([0.19, 0, 0.56 * sq, 0.02, 0.14, 0.03, "#ffffff"]); // 장난스러운 웃음
  for (const sd of [1, -1]) P.push([0.04, sd * 0.1, 0.78 * sq, 0.06, 0.06, 0.14, "#ffd040"]); // 노란 뿔
  P.push([0.02, 0, 0.78 * sq, 0.28, 0.3, 0.04, dk]);
  P.push([0.1 + up, 0.26, 0.4 + up * 2, 0.06, 0.06, 0.3, "#c8902a"], [0.1 + up, 0.26, 0.7 + up * 2, 0.16, 0.16, 0.18, "#ffd040"]); // 금 방망이
  P.push([0.04, -0.24, 0.32, 0.12, 0.11, 0.2, blue]);
}
Object.assign(EXTRA_SHAPES, {
  w4_dokkaebi(m) { const a = bossMotion(m), P = []; w4dkBody(m, P, a); drawVoxelParts(m, P, { top: 0.88, scale: (m.r || 1.05) / 1.05 }); },
  w4_lantern(m) {
    const x = m.x, y = m.y, on = (m.lnT || 0) > 0;
    drawBox(x - 0.06, y - 0.06, 0, 0.12, 0.12, 0.9, "#6a4e34");
    drawBox(x - 0.24, y - 0.24, 0.9, 0.48, 0.48, 0.5, on ? "#ffe27a" : "#a07040");
    drawBox(x - 0.27, y - 0.27, 1.38, 0.54, 0.54, 0.06, "#4a3424");
    if (on && Math.random() < 0.2) addSparkle(x, y, 1.1, { vz: 0.6, life: 0.5, size: 0.5, gold: true });
  },
});

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_dkClub: { text: "원 밖으로! 그다음 공격" },
  w4_dkCoins: { text: "원 사이로! 끝나면 에메랄드 줍기" },
  w4_dkClones: { text: "등불을 켜요! 그림자 있는 게 진짜", do: true, voice: true },
  w4_dkCall: { text: "꼬마부터 정리해요" },
  w4_dkFakeClub: { text: "가짜 원도 피해요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.goblintown = { 0: "방망이 쾅 뒤에 공격해요", 1: "등불을 켜면 진짜만 그림자가 생겨요!", 2: "분신 원도 아파요. 다 피해요!" };
