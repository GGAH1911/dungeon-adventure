// ===== 월드 3 보스 9~11 (설계서 docs/design/world3-moon.md 5-9 ~ 5-11) =====
//  9  치즈 쥐 대왕 찍찍이 (cheesevale): 치즈를 먹으면 커지고 회복 -> 치즈 앞을 막거나(비틀), 먼저 쳐서 부숴요(내 하트 +1)
//  10 광산 수레 골렘 덜컹이 (starmine): 레일 위를 달리는 수레 -> 레버로 갈림길을 돌려 막힌 길(돌무더기)로 보내면 쿵! 비틀
//  11 크레인 집게 박사 집게손 (lunarlab): 천장 집게가 나를 따라와요 -> 폭탄 상자 옆에서 집게를 내려오게 하면 폭탄이 박사 머리 위로 펑!
// 공통: 행동은 bossAI(bosses_a.js), 지금 보스는 w3BossNow() (보스방 + 탑 보스 층).
// 같이 하기: 소품(치즈·레버·폭탄 상자)과 보스 상태는 몬스터 칸(숫자·참거짓)에 있어서 친구 기기에 그대로 가요. 계산은 방장만.

const W3C = {
  cheese: { homes: [[-6.5, -5.5], [6.5, -5.5], [6.5, 5.5], [-6.5, 5.5]], hits: 3, respawn: 14, heal: 0.06, grow: 1.1, growMax: 2,
    runT: 3, runSpeed: 2.6, block: 2.4, ratHeal: 0.03 },
  cart: { R: 7, spur: 2.6, run: 28, speed: 8, speed3: 9, crash: 3.2, crashDmg: 0.03, leverBack: 6 },
  claw: { crates: [[-5.5, -4.5], [5.5, -4.5], [0, 6]], respawn: 10, stagger: 3.0, dmgFrac: 0.04, throwDist: 8 },
};
function w3cStagK() { return typeof W3 !== "undefined" ? W3.stagK() : 1; }
// 부르는 몬스터: 월드 3 몬스터가 아직 없거나 임시면 비슷한 것으로
function w3cMon(id, fb) { return MONSTERS[id] && !MONSTERS[id].w3Placeholder ? id : fb; }
// 보스 찾기 (계산: 방장의 지금 보스 / 그림: 친구 기기도 몬스터 목록에서)
function w3cBoss(type) { const b = typeof w3BossNow === "function" ? w3BossNow() : null; return b && b.type === type && b.hp > 0 ? b : null; }
function w3cSeen(type) { return monsters.find((o) => o.type === type && o.hp > 0) || null; }
function w3cProps(type) { return monsters.filter((o) => o.type === type); }
function w3cCalm(b, gap = 1.0) { casts = casts.filter((c) => c.m !== b); b.charge = null; b.state = "chase"; b.queue = []; b.gap = Math.max(b.gap || 0, gap); }
function w3cStun(b, t, frac, text) {
  w3cCalm(b, 0.5);
  if (frac) damageMonster(b, b.maxHp * frac, b.x, b.y, false, 0, { w3Prop: true });
  b.stagger = Math.max(b.stagger || 0, t * w3cStagK());
  addFloatText(b.x, b.y, text, "#ffe27a", 26);
  game.shake = Math.max(game.shake, 0.45);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
}
function w3cDash(ctx2, x0, y0, x1, y1, color, w = 3) {
  const a = toScreen(x0, y0, 0.03), b = toScreen(x1, y1, 0.03);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * ZOOM; ctx.setLineDash([7 * ZOOM, 7 * ZOOM]); ctx.lineDashOffset = -game.time * 30 * ZOOM;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
}
function w3cRing(x, y, r, color, w = 2.5) {
  const pts = []; for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; pts.push(toScreen(x + Math.cos(t) * r, y + Math.sin(t) * r, 0.03)); }
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
}

// ----- 부품·전설 (8-2, 8-3) -----
Object.assign(MATERIALS, {
  w3_bigCheese: { name: "황금 치즈", color: "#ffd23f", enchant: "emerald" },
  w3_stardust: { name: "별가루 한 줌", color: "#ffe27a" },
  w3_labBolt: { name: "황금 나사", color: "#e0c060", enchant: "chain" },
});
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") { // 시험 도구(tools/lib.mjs)는 loot.js 없이 읽어요
defBase("L_cheesevale", { slot: "charm", legend: "cheesevale", name: "황금 치즈 반지", minL: 0, icon: "ring", color: "#ffd23f", perk: { luck: 0.35, hearts: 1 }, desc: "에메랄드와 화폐가 잘 나오고 하트 +1" });
defBase("L_starmine", { slot: "weapon", legend: "starmine", name: "덜컹이 곡괭이", minL: 0, color: "#ffe27a", mul: 1.15, effect: "emerald",
  forms: LEGEND_FORMS({ w: "덜컹이 곡괭이", m: "별가루 지팡이", d: "별가루 지팡이", h: "별가루 단검" }, "axe"), desc: "별가루 무기: 에메랄드가 잘 나와요 (공격력 +15%)" });
defBase("L_lunarlab", { slot: "charm", legend: "lunarlab", name: "집게손 장갑", minL: 0, icon: "ring", color: "#e0c060", perk: { dmg: 0.12, bow: 0.1 }, desc: "공격력과 활 힘이 올라요" });
Object.assign(BOSS_LEGENDS, { cheesevale: "L_cheesevale", starmine: "L_starmine", lunarlab: "L_lunarlab" });
}

// ----- 소품 (때릴 수 있지만 다치지 않아요) -----
Object.assign(MONSTERS, {
  w3_cheese: { name: "치즈 바위", color: "#ffd23f", shape: "w3_cheese", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 3, codexSkip: true },
  w3_cartLever: { name: "레일 레버", color: "#7dffb0", shape: "w3_cartLever", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 3, codexSkip: true },
  w3_bombCrate: { name: "폭탄 상자", color: "#ff9a3a", shape: "w3_bombCrate", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 3, codexSkip: true },
});
hookOn("untargetable", (o) => !!(o.chGone || o.bcGone), 50);

// ----- 기술 -----
const W3C_RAT = w3cMon("w3_moonRat", "crab"), W3C_BOT = w3cMon("w3_robot", "miner");
Object.assign(ABILITIES, {
  // 찍찍이
  w3_ratDash: { name: "꼬리 돌진", desc: "꼬리를 휘두르며 빨간 길로 쭉 달려와요. 부딪히면 어지러워요.", counter: "빨간 길 옆으로! 멈추면 때려요",
    tags: ["boss", "line", "move", "stagger"], telegraph: { shape: "line", length: 8, width: 1.8, at: "self", time: 1.2 },
    cooldown: 6, range: [2, 9], damageMul: 1.6, anim: "crouch", staggerAfter: 1.3, effect: { type: "charge", speed: 9, stunOnWall: 1.6 } },
  w3_snackRun: { name: "냠냠 가기", desc: "가장 가까운 치즈로 노란 점선을 따라 걸어가요. 치즈를 먹으면 커지고 회복해요.", counter: "치즈 앞을 막거나, 먼저 쳐서 부숴요",
    tags: ["boss", "move"], telegraph: { shape: "self", radius: 1.0, at: "self", time: 0.9 },
    cooldown: 9, range: [0, 40], damageMul: 0, anim: "roar", effect: { type: "w3_toCheese" } },
  w3_crumbRain: { name: "치즈 부스러기 비", desc: "딱딱한 치즈 부스러기가 여러 군데 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.25 },
    cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 3.6, stagger: 0.18 } },
  w3_ratCall: { name: "치즈 쥐 부르기", desc: "찍찍! 치즈 쥐 셋을 불러요. 쥐가 치즈를 대왕에게 나르면 대왕이 회복해요.", counter: "노란 ! 쥐를 먼저 잡아요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: W3C_RAT, count: 3 } },
  // 덜컹이
  w3_cartSlam: { name: "골렘 내려찍기", desc: "두 팔을 번쩍 들었다가 앞을 쾅! 그 뒤 숨을 골라요.", counter: "빨간 원 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.2, at: "front", offset: 1.8, time: 1.3 },
    cooldown: 5, range: [0, 3.8], damageMul: 2.1, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.5 } },
  w3_stoneRain: { name: "별가루 돌 비", desc: "천장에서 별가루 돌이 우수수 떨어져요.", counter: "원 사이로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.3 },
    cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 3.8, stagger: 0.2 } },
  w3_rockVolley: { name: "돌 조각 던지기", desc: "돌 조각을 부채꼴로 휙휙 던져요.", counter: "조각 사이로 옆걸음!",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 7, angle: 0.9, at: "self", time: 1.1 },
    cooldown: 6, range: [0, 10], damageMul: 1.1, anim: "raise", effect: { type: "volley", count: 5, spread: 0.9, speed: 6, color: "#ffe27a" } },
  w3_cartRun: { name: "수레 달리기", desc: "수레를 타고 레일 위를 쌩쌩 달려요. 레일 위는 위험해요! 레버로 막힌 길에 보내면 쿵!", counter: "레일 밖으로! 레버를 쳐서 돌무더기로 보내요",
    tags: ["boss", "line", "move"], telegraph: { shape: "line", length: 7, width: 1.6, at: "self", time: 1.2 },
    cooldown: 6, range: [0, 40], damageMul: 1.6, anim: "crouch", effect: { type: "w3_rail" } },
  // 집게손
  w3_clawGrab: { name: "크레인 집게", desc: "천장 집게가 나를 따라오다 멈추고 내려와요. 잡히면 반대쪽으로 던져져요. 폭탄 상자 옆이면 집게가 폭탄을 집어요!", counter: "폭탄 상자 옆으로 데려가요, 멈추면 비켜요",
    tags: ["boss", "area", "follow"], telegraph: { shape: "circle", radius: 1.2, at: "target", time: 2.6, follow: true },
    cooldown: 7, range: [0, 40], damageMul: 0.5, anim: "staff", effect: { type: "w3_grab" } },
  w3_labRay: { name: "박사 광선", desc: "조종기에서 넓은 광선을 쭉 쏴요.", counter: "광선 줄 옆으로!",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.4, at: "self", time: 1.35 },
    cooldown: 6, range: [0, 12], damageMul: 1.7, anim: "staff", effect: { type: "damage" } },
  w3_flaskSplash: { name: "실험 플라스크", desc: "보글보글 플라스크를 던져요. 떨어진 자리에 초록 웅덩이가 3초 남아요.", counter: "초록 웅덩이 밖으로",
    tags: ["boss", "area", "zone"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 1.2 },
    cooldown: 7, range: [0, 12], damageMul: 0.5, anim: "raise", effect: { type: "zone", duration: 3, tick: 0.6, kind: "poison" } },
  w3_labBotCall: { name: "청소 로봇 부르기", desc: "삐빅! 청소 로봇 둘을 불러요.", counter: "로봇을 먼저 잡아요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: W3C_BOT, count: 2 } },
});

// ----- 보스 정의 -----
function w3cMakeBoss(o) {
  MONSTERS[o.type] = { name: o.name, shape: o.type, behavior: "bossAI", color: o.color, hp: o.hp, speed: o.speed, damage: o.damage,
    xp: 60, emerald: 1, emeraldCount: 14, heavy: true, isBoss: true, size: o.size, world: 3 };
  const phases = o.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS[o.mapId] = {
    id: o.type, name: o.name, title: o.title, size: o.size, world: 3, material: o.material,
    arena: { size: o.arena, theme: o.theme, build: o.build }, phases,
    create(x, y, level) {
      const m = createMonster(o.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[o.mapId];
      m.name = `${o.title} ${o.name}`;
      m.r = o.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.onPhase = (idx) => o.onPhase && o.onPhase(m, idx);
      return m;
    },
  };
}

w3cMakeBoss({ mapId: "cheesevale", type: "w3_cheeseRat", name: "찍찍이", title: "치즈 쥐 대왕", color: "#9a9aa8", size: 3.0, r: 1.05, hp: 285, damage: 2.3, speed: 1.2, arena: 26,
  material: { id: "w3_bigCheese", name: "황금 치즈", color: "#ffd23f", enchant: "emerald" },
  theme: { floor: "#d8c070", moss: "#f2d88a", wall: "#9a7a3a", darkness: 0.3, bg: "#0e0a02" },
  build(w) { const c = w.W / 2; w3AddCrater(c, c, 2.4, w); for (const dx of [-4.5, 4.5]) w3AddDust(c + dx, c, 1.8, w); },
  phases: [
    { until: 0.66, gap: 1.7, pattern: ["w3_ratDash", "w3_snackRun", "w3_crumbRain", "w3_ratDash"] },
    { until: 0.33, gap: 1.5, pattern: ["w3_ratCall", "w3_snackRun", "w3_ratDash", "w3_crumbRain", "w3_ratDash"] },
    { until: 0, gap: 1.3, pattern: ["w3_snackRun", "w3_ratDash", "w3_ratCall", "w3_crumbRain", "w3_snackRun", "w3_ratDash"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) showMessage("치즈 쥐가 와요! 노란 ! 쥐가 치즈를 날라요", 2.6, false, "#ffd23f");
    if (idx === 2) showMessage("대왕이 치즈 두 개를 노려요! 먼저 부숴요", 3, false, "#ffd23f");
  } });
w3cMakeBoss({ mapId: "starmine", type: "w3_mineCart", name: "덜컹이", title: "광산 수레 골렘", color: "#8a6a4a", size: 3.2, r: 1.1, hp: 295, damage: 2.3, speed: 1.0, arena: 28,
  material: { id: "w3_stardust", name: "별가루 한 줌", color: "#ffe27a" },
  theme: { floor: "#5a5268", moss: "#ffe27a", wall: "#3a3448", darkness: 0.4, bg: "#06040a" },
  build(w) { const c = w.W / 2; w3AddLight(c - 4, c - 4, w); w3AddLight(c + 4, c + 4, w); w3AddDust(c, c - 4, 1.6, w); },
  phases: [
    { until: 0.66, gap: 1.7, pattern: ["w3_cartSlam", "w3_stoneRain", "w3_rockVolley", "w3_cartSlam"] },
    { until: 0.33, gap: 1.5, pattern: ["w3_cartRun", "w3_cartSlam", "w3_cartRun", "w3_rockVolley"] },
    { until: 0, gap: 1.3, pattern: ["w3_cartRun", "w3_stoneRain", "w3_cartRun", "w3_cartSlam", "w3_rockVolley"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) showMessage("수레를 타요! 레버를 쳐서 막힌 길로 보내요", 3, false, "#ffe27a");
    if (idx === 2) showMessage("더 빨라요! 레버가 6초 뒤 저절로 돌아가요", 3, false, "#ffe27a");
  } });
w3cMakeBoss({ mapId: "lunarlab", type: "w3_labClaw", name: "집게손", title: "크레인 집게 박사", color: "#e8ecf4", size: 3.0, r: 1.0, hp: 295, damage: 2.3, speed: 1.0, arena: 28,
  material: { id: "w3_labBolt", name: "황금 나사", color: "#e0c060", enchant: "chain" },
  theme: { floor: "#c8ccd8", moss: "#7fd0ff", wall: "#7a8090", darkness: 0.25, bg: "#06080e" },
  build(w) { const c = w.W / 2; w3AddLowGrav(c - 12, c - 12, c + 12, c + 12, w); },
  phases: [
    { until: 0.66, gap: 1.7, pattern: ["w3_clawGrab", "w3_labRay", "w3_flaskSplash", "w3_clawGrab"] },
    { until: 0.33, gap: 1.5, pattern: ["w3_labBotCall", "w3_clawGrab", "w3_labRay", "w3_flaskSplash", "w3_clawGrab"] },
    { until: 0, gap: 1.3, pattern: ["w3_clawGrab", "w3_labRay", "w3_labBotCall", "w3_clawGrab", "w3_flaskSplash"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) showMessage("청소 로봇이 와요! 집게는 폭탄 상자로 데려가요", 2.6, false, "#7fd0ff");
    if (idx === 2) showMessage("집게가 두 개! 폭탄 상자 옆으로", 3, false, "#7fd0ff");
  } });

// =========================================================================
// 9. 찍찍이: 치즈
// =========================================================================
const W3C_RATBOSS = "w3_cheeseRat";
function chCheeses() { return w3cProps("w3_cheese"); }
function chLive() { return chCheeses().filter((s) => !s.chGone && s.hp > 0); }
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w3_cheese") return false;
  if (h.opts.dot || s.chGone) return true;
  if (game.time - (s.chHitT || -9) < 0.15) return true; // 한 번 휘두름에 한 번
  s.chHitT = game.time;
  s.chHits = (s.chHits || 0) + 1;
  spawnBurst(s.x, s.y, ["#ffd23f", "#fff0a0"], 6);
  if (s.chHits < W3C.cheese.hits) { addFloatText(s.x, s.y, "쩍!", "#ffd23f", 18); return true; }
  chBreak(s);
  const p = (h.opts.by && h.opts.by.maxHp) ? h.opts.by : nearestPlayer(s.x, s.y);
  if (p && p.hp > 0) { p.hp = Math.min(p.maxHp, p.hp + 1); addFloatText(p.x, p.y, "+1 냠!", "#ffd23f", 20); }
  return true;
}, 4);
function chBreak(s) {
  s.chGone = true; s.chGoneT = W3C.cheese.respawn; s.chHits = 0;
  spawnBurst(s.x, s.y, ["#ffd23f", "#e0a830", "#fff6c0"], 16);
  addRing(s.x, s.y, { speed: 4, life: 0.4, gold: true });
}
// 냠냠 가기 시작 (가까운 치즈, 3단계는 가까운 것 + 먼 것)
function chStartRun(b) {
  const live = chLive().sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y));
  if (!live.length) { addFloatText(b.x, b.y, "치즈가 없어!", "#ffd23f", 20); return; }
  b._chQ = b.phaseIdx >= 2 && live.length > 1 ? [live[0], live[live.length - 1]] : [live[0]];
  b.chRunT = W3C.cheese.runT;
  chAim(b);
  addFloatText(b.x, b.y, "냠냠!", "#ffd23f", 22);
}
hookOn("resolveCast", (c) => { if (c.ab.effect.type !== "w3_toCheese") return false; if (c.m && c.m.hp > 0) chStartRun(c.m); return true; }, 15);
function chAim(b) { const s = b._chQ && b._chQ[0]; if (s) { b.chTX = s.x; b.chTY = s.y; b.chTX2 = b._chQ[1] ? b._chQ[1].x : 0; b.chTY2 = b._chQ[1] ? b._chQ[1].y : 0; } }
function chEndRun(b) { b.chRunT = 0; b._chQ = null; b.chTX = b.chTY = b.chTX2 = b.chTY2 = 0; }
hookOn("dungeonTick", (dt) => {
  const b = w3cBoss(W3C_RATBOSS);
  if (!b) return;
  const c = world.W / 2, C = W3C.cheese;
  if (!b.chInit) {
    b.chInit = true;
    for (const [ox, oy] of C.homes) { const s = spawnProp("w3_cheese", c + ox, c + oy, b); s.r = 0.55; s.chHomeX = s.x; s.chHomeY = s.y; }
  }
  for (const s of chCheeses()) if (s.chGone) {
    s.chGoneT -= dt;
    if (s.chGoneT <= 0) { s.chGone = false; s.x = s.chHomeX; s.y = s.chHomeY; s.appearTimer = 0.6; addRing(s.x, s.y, { speed: 3, life: 0.4, gold: true }); }
  }
  // 치즈 나르는 쥐
  for (const o of monsters) {
    if (o.type !== W3C_RAT || !o.summoned || o.hp <= 0) continue;
    if (!o.chCarry) {
      const s = chLive().find((q) => Math.hypot(q.x - o.x, q.y - o.y) < 1.1);
      if (s) { o.chCarry = true; addFloatText(o.x, o.y, "!", "#ffd23f", 22); }
    } else {
      const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy) || 1;
      if (d < b.r + 0.7) { o.chCarry = false; b.hp = Math.min(b.maxHp, b.hp + b.maxHp * C.ratHeal); addFloatText(b.x, b.y, "+냠", "#7dffb0", 20); }
      else moveEntity(o, dx / d * 2.2 * dt, dy / d * 2.2 * dt);
    }
  }
  // 냠냠 가기
  if (!(b.chRunT > 0)) return;
  if (b.stagger > 0 || b.hp <= 0) { chEndRun(b); return; }
  b.chRunT -= dt;
  let s = b._chQ && b._chQ[0];
  while (s && (s.chGone || s.hp <= 0)) { b._chQ.shift(); s = b._chQ[0]; chAim(b); }
  if (!s || b.chRunT <= 0) { chEndRun(b); return; }
  b.gap = Math.max(b.gap, 0.5); b.queue = []; b.state = "chase";
  const dx = s.x - b.x, dy = s.y - b.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  b.faceX = ux; b.faceY = uy;
  // 막기: 주인공이 대왕 바로 앞(치즈 쪽)에 서 있으면 "윽!"
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    const px = p.x - b.x, py = p.y - b.y, pd = Math.hypot(px, py);
    if (pd < b.r + 1.0 && (px * ux + py * uy) / (pd || 1) > 0.3 && pd < d) {
      chEndRun(b);
      w3cStun(b, C.block, 0, "윽! 막혔다!");
      return;
    }
  }
  if (d < b.r + (s.r || 0.55) + 0.15) {
    chBreak(s);
    b.hp = Math.min(b.maxHp, b.hp + b.maxHp * C.heal);
    if ((b.chEat || 0) < C.growMax) { b.chEat = (b.chEat || 0) + 1; b.r *= C.grow; }
    addFloatText(b.x, b.y, "냠냠! 커졌어요", "#ffd23f", 24);
    b._chQ.shift(); chAim(b);
    if (!b._chQ.length) chEndRun(b);
    return;
  }
  b.moving = true;
  moveEntity(b, ux * C.runSpeed * dt, uy * C.runSpeed * dt);
}, 40);

// =========================================================================
// 10. 덜컹이: 레일·레버
// =========================================================================
const W3C_CARTBOSS = "w3_mineCart";
// 레일 지도 (아레나 가운데 c 기준): 사각 고리 A→B→JR→C→D→JL→A (돌아가는 방향 하나), 갈림길 JR/JL 에서 막힌 길 SR/SL
function cartRails(c = world.W / 2) {
  const R = W3C.cart.R, S = W3C.cart.spur;
  const loop = [[c - R, c - R], [c + R, c - R], [c + R, c], [c + R, c + R], [c - R, c + R], [c - R, c]];
  return { loop, junction: { 2: [c + S, c], 5: [c - S, c] }, levers: { 2: [c + R - 1.7, c - 1.6], 5: [c - R + 1.7, c + 1.6] } };
}
function cartLevers() { return w3cProps("w3_cartLever"); }
function cartLeverAt(j) { return cartLevers().find((l) => l.lvJ === j) || null; }
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w3_cartLever") return false;
  if (h.opts.dot || game.time - (s.lvHitT || -9) < 0.4) return true;
  s.lvHitT = game.time;
  s.lvSpur = !s.lvSpur; s.lvT = 0;
  addFloatText(s.x, s.y, s.lvSpur ? "철컥! 막힌 길" : "철컥! 고리 길", s.lvSpur ? "#ffd23f" : "#9fe6ff", 18);
  if (typeof sfx !== "undefined" && sfx.click) sfx.click();
  return true;
}, 4);
// 레일 위 가장 가까운 고리 점 -> 다음 점
function cartStartNode(b) {
  const L = cartRails().loop; let bi = 0, bd = 1e9;
  L.forEach((q, i) => { const d = Math.hypot(q[0] - b.x, q[1] - b.y); if (d < bd) { bd = d; bi = i; } });
  return bi;
}
// 수레 달리기 예고: 시작 점으로 옮기고 예고 줄을 첫 레일 위로
hookOn("castStarted", (m, id) => {
  if (id !== "w3_cartRun" || !m || m.type !== W3C_CARTBOSS) return;
  const c = casts.find((q) => q.m === m && q.id === id); if (!c) return;
  const L = cartRails().loop, i = cartStartNode(m), a = L[i], n = L[(i + 1) % L.length];
  spawnBurst(m.x, m.y, ["#8a6a4a", "#ffe27a"], 10);
  m.x = a[0]; m.y = a[1];
  const dx = n[0] - a[0], dy = n[1] - a[1], d = Math.hypot(dx, dy) || 1;
  c.x = a[0]; c.y = a[1]; c.dirX = dx / d; c.dirY = dy / d; c.length = Math.min(d, 8);
  m.faceX = c.dirX; m.faceY = c.dirY; m.crNode = i;
  addFloatText(m.x, m.y, "덜컹!", "#ffe27a", 22);
}, 50);
hookOn("resolveCast", (c, p) => {
  if (c.ab.effect.type !== "w3_rail") return false;
  const m = c.m;
  m.crOn = true; m.crLeft = W3C.cart.run; m.crTo = ((m.crNode || 0) + 1) % 6; m.crSpur = false; m.crDmg = abilityDamage(c);
  m._crHit = new Set();
  return true;
}, 15);
function cartStop(b) { b.crOn = false; b.crSpur = false; b.crLeft = 0; b.gap = Math.max(b.gap, 1.0); b.state = "chase"; }
hookOn("dungeonTick", (dt) => {
  const b = w3cBoss(W3C_CARTBOSS);
  if (!b) return;
  const rails = cartRails();
  if (!b.crInit) {
    b.crInit = true;
    for (const j of [2, 5]) { const [x, y] = rails.levers[j]; const l = spawnProp("w3_cartLever", x, y, b); l.lvJ = j; l.lvSpur = false; l.lvT = 0; }
  }
  // 3단계: 레버가 6초 뒤 저절로 돌아가요
  if (b.phaseIdx >= 2) for (const l of cartLevers()) if (l.lvSpur) { l.lvT = (l.lvT || 0) + dt; if (l.lvT >= W3C.cart.leverBack) { l.lvSpur = false; l.lvT = 0; addFloatText(l.x, l.y, "철컥!", "#9fe6ff", 16); } }
  if (!b.crOn) return;
  if (b.hp <= 0) { cartStop(b); return; }
  b.gap = Math.max(b.gap, 0.6); b.queue = []; b.charge = null; b.state = "chase"; b.stagger = 0;
  const speed = b.phaseIdx >= 2 ? W3C.cart.speed3 : W3C.cart.speed;
  let move = speed * dt;
  while (move > 0 && b.crOn) {
    const t = b.crSpur ? rails.junction[b.crSpurJ] : rails.loop[b.crTo];
    const dx = t[0] - b.x, dy = t[1] - b.y, d = Math.hypot(dx, dy);
    if (d > 1e-4) { b.faceX = dx / d; b.faceY = dy / d; }
    if (d > move) { b.x += dx / d * move; b.y += dy / d * move; b.crLeft -= move; move = 0; break; }
    b.x = t[0]; b.y = t[1]; move -= d; b.crLeft -= d;
    if (b.crSpur) { cartCrash(b); return; }
    const j = b.crTo, lv = cartLeverAt(j);
    if (rails.junction[j] && lv && lv.lvSpur) { b.crSpur = true; b.crSpurJ = j; addFloatText(b.x, b.y, "끼익!", "#ffd23f", 20); continue; }
    b.crTo = (b.crTo + 1) % rails.loop.length;
    if (b.crLeft <= 0) { cartStop(b); return; }
  }
  b.moving = true;
  if (Math.random() < 0.5) addSparkle(b.x - b.faceX * 0.8, b.y - b.faceY * 0.8, 0.1, { vz: 1.2, life: 0.3, size: 0.5, gold: true });
  // 레일 위 주인공은 부딪혀요 (구르면 피해요), 한 번 달릴 때 한 번
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0 || b._crHit && b._crHit.has(p)) continue;
    if (Math.hypot(p.x - b.x, p.y - b.y) > b.r + 0.35) continue;
    if (b._crHit) b._crHit.add(p);
    if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); continue; }
    hurtPlayer(p, b.crDmg || b.damage, b);
  }
}, 40);
function cartCrash(b) {
  cartStop(b);
  spawnBurst(b.x, b.y, ["#8a7a6a", "#5a4a3a", "#ffe27a"], 22);
  addRing(b.x, b.y, { speed: 6, life: 0.4, gold: true });
  w3cStun(b, W3C.cart.crash, W3C.cart.crashDmg, "쿵! 돌무더기! 비틀!");
}

// =========================================================================
// 11. 집게손: 크레인 집게 + 폭탄 상자
// =========================================================================
const W3C_CLAWBOSS = "w3_labClaw";
function clawCrates() { return w3cProps("w3_bombCrate"); }
hookOn("monsterDamage", (h) => { const s = h.m; if (!s || s.type !== "w3_bombCrate") return false; if (!h.opts.dot && game.time - (s.bcHitT || -9) > 0.5) { s.bcHitT = game.time; addFloatText(s.x, s.y, "집게로 집게 해요!", "#ff9a3a", 15); } return true; }, 4);
// 3단계: 집게가 두 개 (두 번째는 조금 늦게, 친구가 있으면 친구를 따라가요)
hookOn("castStarted", (m, id) => {
  if (id !== "w3_clawGrab" || !m || m.type !== W3C_CLAWBOSS || m.phaseIdx < 2 || m._clawSecond) return;
  const c = casts.find((q) => q.m === m && q.id === id); if (!c) return;
  const others = allPlayers().filter((q) => q && q.hp > 0 && q !== c.target);
  const target = others[0] || c.target || nearestPlayer(m.x, m.y);
  if (!target) return;
  const ab = ABILITIES.w3_clawGrab, tune = c.tune;
  const c2 = makeCast(m, ab, id, target, c.time + 0.9, tune);
  c2.extra = true;
  casts.push(c2);
}, 50);
hookOn("resolveCast", (c, p) => {
  if (c.ab.effect.type !== "w3_grab") return false;
  const m = c.m, C = W3C.claw;
  // 폭탄 상자를 집었어요 -> 박사 머리 위로 펑!
  const crate = clawCrates().find((s) => !s.bcGone && s.hp > 0 && Math.hypot(s.x - c.x, s.y - c.y) < c.radius + (s.r || 0.45) + 0.2);
  if (crate) {
    crate.bcGone = true; crate.bcGoneT = C.respawn;
    spawnBurst(crate.x, crate.y, ["#ff9a3a", "#2a2a2a"], 10);
    if (m.hp > 0) {
      spawnBurst(m.x, m.y, ["#ff9a3a", "#ffe27a", "#ffffff", "#2a2a2a"], 26);
      addRing(m.x, m.y, { speed: 7, life: 0.45, hue: 30 });
      flashScreen(0.1);
      w3cStun(m, C.stagger, C.dmgFrac, "펑!! 비틀!");
    }
    return true;
  }
  if (p && p.hp > 0 && insideShape(c, p.x, p.y, p.r * 0.6)) {
    if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); return true; }
    hurtPlayer(p, abilityDamage(c), m);
    // 반대쪽으로 휙 던지기 (아프진 않게, 아레나 안 빈 자리)
    const cx = world.W / 2, cy = world.H / 2;
    let dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
    if (d < 0.5) { dx = 1; dy = 0; d = 1; }
    const tx = cx - dx / d * Math.min(C.throwDist, world.W / 2 - 3), ty = cy - dy / d * Math.min(C.throwDist, world.H / 2 - 3);
    const s = findFreeSpot(tx, ty, p.r || 0.35, 4) || { x: cx, y: cy };
    spawnBurst(p.x, p.y, ["#ffd23f", "#ffffff"], 10);
    p.x = s.x; p.y = s.y; p.move = null; p.rollTimer = 0;
    if (p === game.player) { camera.x = p.x; camera.y = p.y; }
    addFloatText(p.x, p.y, "휘익~", "#ffd23f", 20);
  } else {
    spawnDust(c.x, c.y); addRing(c.x, c.y, { speed: 3, life: 0.3, hue: 50 });
  }
  return true;
}, 15);
hookOn("dungeonTick", (dt) => {
  const b = w3cBoss(W3C_CLAWBOSS);
  if (!b) return;
  const c = world.W / 2;
  if (!b.bcInit) { b.bcInit = true; for (const [ox, oy] of W3C.claw.crates) { const s = spawnProp("w3_bombCrate", c + ox, c + oy, b); s.r = 0.5; s.bcHomeX = s.x; s.bcHomeY = s.y; } }
  for (const s of clawCrates()) if (s.bcGone) { s.bcGoneT -= dt; if (s.bcGoneT <= 0) { s.bcGone = false; s.x = s.bcHomeX; s.y = s.bcHomeY; s.appearTimer = 0.6; addRing(s.x, s.y, { speed: 3, life: 0.4, hue: 30 }); } }
}, 40);

// =========================================================================
// 그림: 바닥 (레일·화살표), 안내 점선, 집게
// =========================================================================
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon") return;
  const b = w3cSeen(W3C_CARTBOSS);
  if (!b) return;
  const R = cartRails(), seg = (a, z, col, w) => { const p0 = toScreen(a[0], a[1], 0.015), p1 = toScreen(z[0], z[1], 0.015); ctx.strokeStyle = col; ctx.lineWidth = w * ZOOM; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); };
  ctx.save(); ctx.lineCap = "round";
  const L = R.loop;
  for (let i = 0; i < L.length; i++) { seg(L[i], L[(i + 1) % L.length], "#3a2e26", 9); seg(L[i], L[(i + 1) % L.length], "#9a8a7a", 3); }
  for (const j of [2, 5]) { seg(L[j], R.junction[j], "#3a2e26", 9); seg(L[j], R.junction[j], "#9a8a7a", 3); }
  // 갈림길 금색 화살표: 지금 가는 길
  for (const j of [2, 5]) {
    const lv = cartLevers().find((l) => l.lvJ === j), spur = !!(lv && lv.lvSpur);
    const a = L[j], z = spur ? R.junction[j] : L[(j + 1) % L.length];
    const dx = z[0] - a[0], dy = z[1] - a[1], d = Math.hypot(dx, dy) || 1, tx = a[0] + dx / d * 1.4, ty = a[1] + dy / d * 1.4;
    seg(a, [tx, ty], spur ? "#ffd23f" : "#9fe6ff", 5);
    const h = toScreen(tx, ty, 0.02); ctx.fillStyle = spur ? "#ffd23f" : "#9fe6ff"; ctx.beginPath(); ctx.arc(h.x, h.y, 6 * ZOOM, 0, Math.PI * 2); ctx.fill();
  }
  // 달리는 중: 앞길을 빨갛게 (레일 위는 위험)
  if (b.crOn) {
    let x = b.x, y = b.y, left = 6, to = b.crTo, spur = b.crSpur, sj = b.crSpurJ;
    for (let k = 0; k < 4 && left > 0; k++) {
      const t = spur ? R.junction[sj] : L[to]; const dx = t[0] - x, dy = t[1] - y, d = Math.hypot(dx, dy);
      const step = Math.min(d, left), ex = x + (d ? dx / d * step : 0), ey = y + (d ? dy / d * step : 0);
      seg([x, y], [ex, ey], "rgba(255,70,60,0.55)", 16);
      left -= step; x = ex; y = ey; if (spur) break;
      const lv = cartLevers().find((l) => l.lvJ === to);
      if (R.junction[to] && lv && lv.lvSpur) { spur = true; sj = to; } else to = (to + 1) % L.length;
    }
  }
  ctx.restore();
}, 55);
hookOn("worldThings", (things) => {
  if (game.scene !== "dungeon" || !w3cSeen(W3C_CARTBOSS)) return;
  const R = cartRails();
  for (const j of [2, 5]) { const [x, y] = R.junction[j]; things.push({ depth: x + y, x, y, draw: () => { // 돌무더기 (막힌 길 끝)
    const dx = j === 2 ? 0.55 : -0.55;
    drawBox(x + dx - 0.35, y - 0.6, 0, 0.5, 1.2, 0.55, "#7a6a5a"); drawBox(x + dx - 0.25, y - 0.35, 0.55, 0.4, 0.7, 0.3, "#8a7a6a"); drawBox(x + dx - 0.15, y + 0.1, 0.85, 0.25, 0.3, 0.18, "#9a8a7a");
  } }); }
}, 55);
hookOn("drawTelegraphsAfter", () => {
  if (game.scene !== "dungeon") return;
  // 찍찍이: 노란 점선 (대왕 -> 노리는 치즈)
  const r = w3cSeen(W3C_RATBOSS);
  if (r && r.chRunT > 0 && (r.chTX || r.chTY)) {
    w3cDash(ctx, r.x, r.y, r.chTX, r.chTY, "rgba(255,210,63,0.85)", 3.5);
    if (r.chTX2 || r.chTY2) w3cDash(ctx, r.chTX, r.chTY, r.chTX2, r.chTY2, "rgba(255,210,63,0.5)", 2.5);
    w3cRing(r.chTX, r.chTY, 0.9, `rgba(255,210,63,${0.55 + 0.3 * Math.sin(game.time * 6)})`);
  }
  // 집게손: 집게가 오면 폭탄 상자 둘레 금색 원 ("여기로 데려와요") + 내려오는 집게
  const k = w3cSeen(W3C_CLAWBOSS);
  if (k) {
    const grabs = casts.filter((c) => c.m === k && c.id === "w3_clawGrab");
    if (grabs.length) for (const s of w3cProps("w3_bombCrate")) if (!s.bcGone) w3cRing(s.x, s.y, (s.r || 0.5) + 0.75, `rgba(255,210,63,${0.5 + 0.35 * Math.sin(game.time * 5)})`, 3);
    for (const c of grabs) {
      const f = Math.min(1, c.t / Math.max(0.1, c.time)), z = 3.2 - 2.6 * f * f;
      drawBox(c.x - 0.06, c.y - 0.06, z + 0.5, 0.12, 0.12, 3.5 - z, "#c8a040");
      drawBox(c.x - 0.35, c.y - 0.35, z + 0.3, 0.7, 0.7, 0.22, "#ffd23f");
      for (const [ox, oy] of [[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3]]) drawBox(c.x + ox - 0.06, c.y + oy - 0.06, z, 0.12, 0.12, 0.32, "#8a6a20");
    }
  }
}, 50);
// 치즈 나르는 쥐 머리 위 노란 "!"
hookOn("drawMonsterOver", (m) => {
  if (!m.chCarry || m.hp <= 0) return;
  const s = toScreen(m.x, m.y, 1.1); text("!", s.x, s.y, 22 * ZOOM, "#ffd23f", "center");
  drawBox(m.x - 0.12, m.y - 0.12, 0.55, 0.24, 0.24, 0.16, "#ffd23f");
}, 50);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 치즈 쥐 대왕: 통통한 회색 몸, 분홍 큰 귀·꼬리, 금 왕관, 배에 치즈 부스러기
  w3_cheeseRat(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, up = a.raise * 0.08;
    const g = "#9a9aa8", dk = "#7a7a88", pink = "#f2a0b8";
    for (const sd of [1, -1]) { P.push([0.12 + a.walk * sd * 0.04, sd * 0.17, 0, 0.12, 0.1, 0.08, dk]); P.push([-0.18 - a.walk * sd * 0.04, sd * 0.17, 0, 0.12, 0.1, 0.08, dk]); }
    P.push([-0.04, 0, 0.06, 0.5, 0.42, 0.32 * sq, g]);
    P.push([0.05, 0, 0.07, 0.36, 0.3, 0.06, "#d8d8e2"]);
    P.push([0.06, 0.06, 0.16, 0.06, 0.06, 0.04, "#ffd23f"], [0.0, -0.08, 0.2, 0.05, 0.05, 0.04, "#ffd23f"]); // 치즈 부스러기
    // 꼬리
    const tw = Math.sin(a.t * 4) * 0.05;
    P.push([-0.32, tw, 0.12, 0.1, 0.05, 0.05, pink], [-0.42, tw * 2, 0.17, 0.1, 0.05, 0.05, pink], [-0.5, tw * 3, 0.24, 0.08, 0.05, 0.05, pink]);
    // 머리
    P.push([0.25, 0, 0.26 + up, 0.24, 0.3, 0.22 * sq, g]);
    P.push([0.38, 0, 0.28 + up, 0.06, 0.12, 0.08, "#c8c8d4"]);
    P.push([0.42, 0, 0.32 + up, 0.03, 0.05, 0.04, pink, true]);
    for (const sd of [1, -1]) { P.push([0.22, sd * 0.16, 0.48 + up, 0.04, 0.14, 0.14, g]); P.push([0.24, sd * 0.16, 0.49 + up, 0.02, 0.1, 0.1, pink]); }
    eyes(P, 0.375, 0.07, 0.36 + up, 0.05, "#1a1020", a.stag);
    // 왕관
    P.push([0.22, 0, 0.5 + up, 0.16, 0.18, 0.05, "#ffd23f"]);
    for (const sd of [-1, 0, 1]) P.push([0.22, sd * 0.07, 0.55 + up, 0.04, 0.04, 0.05, "#ffe27a"]);
    drawVoxelParts(m, P, { top: 0.72, scale: m.r / 1.05 });
  },
  // 광산 수레 골렘: 녹슨 수레 + 바퀴 4 + 돌 상반신, 노란 별가루 눈
  w3_mineCart(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.9 : 1, up = a.raise * 0.1, run = m.crOn ? Math.sin(a.t * 30) * 0.01 : 0;
    for (const f of [0.2, -0.2]) for (const sd of [1, -1]) P.push([f, sd * 0.22, 0, 0.12, 0.05, 0.12, "#2e2a2a"]);
    P.push([0, 0, 0.06 + run, 0.6, 0.44, 0.2, "#8a6a4a"]);
    P.push([0, 0, 0.26 + run, 0.62, 0.46, 0.03, "#6a4e34"]);
    P.push([0.31, 0, 0.12 + run, 0.02, 0.4, 0.04, "#a08060"], [-0.31, 0, 0.12 + run, 0.02, 0.4, 0.04, "#a08060"]);
    // 돌 골렘 상반신
    P.push([0, 0, 0.29 + run, 0.36, 0.34, 0.26 * sq, "#6a6a7a"]);
    P.push([0.04, 0, 0.55 + run + up * 0.4, 0.26, 0.26, 0.18 * sq, "#7a7a8a"]);
    for (const sd of [1, -1]) {
      P.push([0.06, sd * 0.24, 0.42 + run + up, 0.14, 0.12, 0.12, "#5a5a6a"]);
      P.push([0.12 + up * 0.3, sd * 0.28, 0.3 + run + up * 2, 0.14, 0.12, 0.14, "#5a5a6a"]);
    }
    eyes(P, 0.175, 0.06, 0.62 + run + up * 0.4, 0.05, "#ffe27a", a.stag);
    P.push([0.04, 0.08, 0.72 + run, 0.05, 0.05, 0.04, "#ffe27a", true], [0.0, -0.06, 0.73 + run, 0.04, 0.04, 0.03, "#fff0a0", true]); // 별가루
    drawVoxelParts(m, P, { top: 0.85 });
  },
  // 크레인 집게 박사: 하얀 연구복 작은 로봇, 하늘색 안경, 큰 조종기
  w3_labClaw(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, up = a.raise * 0.08;
    for (const sd of [1, -1]) P.push([0.02 + a.walk * sd * 0.04, sd * 0.09, 0, 0.08, 0.07, 0.14, "#8a909c"]);
    P.push([0, 0, 0.14, 0.26, 0.28, 0.24 * sq, "#e8ecf4"]);
    P.push([0.13, 0, 0.15, 0.02, 0.06, 0.2 * sq, "#c8ccd8"]); // 연구복 단추 줄
    P.push([0.02, 0, 0.38 * sq, 0.22, 0.22, 0.18, "#d8dce8"]);
    P.push([0.02, 0, 0.56 * sq, 0.02, 0.02, 0.08, "#8a909c"], [0.02, 0, 0.64 * sq, 0.04, 0.04, 0.04, "#ff6a5a", true]); // 안테나
    // 안경 + 눈
    for (const sd of [1, -1]) P.push([0.135, sd * 0.055, 0.46 * sq, 0.02, 0.08, 0.06, "#7fd0ff", true]);
    P.push([0.14, 0, 0.47 * sq, 0.02, 0.03, 0.015, "#3a4a5a"]);
    // 조종기 (팔에 들고)
    P.push([0.18, 0.12, 0.24 + up, 0.12, 0.16, 0.08, "#4a5262"]);
    P.push([0.22, 0.09, 0.32 + up, 0.03, 0.03, 0.06, "#ffd23f"], [0.22, 0.15, 0.32 + up, 0.03, 0.03, 0.03, "#ff6a5a", true]);
    for (const sd of [1, -1]) P.push([0.08, sd * 0.17, 0.26, 0.08, 0.06, 0.06, "#e8ecf4"]);
    drawVoxelParts(m, P, { top: 0.78 });
  },
  w3_cheese(m) {
    if (m.chGone) return;
    const x = m.x, y = m.y, h = m.chHits || 0;
    drawBox(x - 0.42, y - 0.42, 0, 0.84, 0.84, 0.55, "#f2c840");
    drawBox(x - 0.36, y - 0.36, 0.55, 0.62, 0.62, 0.22, "#ffd23f");
    for (const [ox, oy, oz] of [[0.43, -0.1, 0.18], [0.43, 0.2, 0.35], [-0.1, 0.43, 0.25], [0.15, 0.43, 0.08]]) drawBox(x + ox - 0.04, y + oy - 0.07, oz, 0.06, 0.14, 0.12, "#c89a20");
    if (h > 0) drawBox(x - 0.42, y - 0.02, 0.2, 0.86, 0.04, 0.5, "#fff6c0");
    if (h > 1) drawBox(x - 0.02, y - 0.42, 0.1, 0.04, 0.86, 0.6, "#fff6c0");
  },
  w3_cartLever(m) {
    const x = m.x, y = m.y, spur = !!m.lvSpur;
    drawBox(x - 0.25, y - 0.25, 0, 0.5, 0.5, 0.2, "#5a4a3a");
    const tilt = spur ? 0.18 : -0.18;
    drawBox(x + tilt - 0.05, y - 0.05, 0.2, 0.1, 0.1, 0.6, "#8a8a9a");
    drawBox(x + tilt * 1.6 - 0.11, y - 0.11, 0.8, 0.22, 0.22, 0.18, spur ? "#ffd23f" : "#9fe6ff");
  },
  w3_bombCrate(m) {
    if (m.bcGone) return;
    const x = m.x, y = m.y;
    drawBox(x - 0.42, y - 0.42, 0, 0.84, 0.84, 0.62, "#ff9a3a");
    for (const z of [0.1, 0.32, 0.5]) drawBox(x - 0.43, y - 0.43, z, 0.86, 0.86, 0.06, "#2a2a2a");
    drawBox(x - 0.08, y - 0.08, 0.62, 0.16, 0.16, 0.12, "#2a2a2a");
    if (Math.sin(game.time * 8 + x) > 0.6) drawBox(x - 0.04, y - 0.04, 0.76, 0.08, 0.08, 0.06, "#ffe27a");
  },
});

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w3_ratDash: { text: "빨간 길 옆으로!" },
  w3_snackRun: { text: "치즈 앞을 막아요! 먼저 쳐도 돼요", do: true, voice: true },
  w3_crumbRain: { text: "원 사이로 걸어가요" },
  w3_ratCall: { text: "노란 ! 쥐를 먼저 잡아요" },
  w3_cartSlam: { text: "원 밖으로! 그다음 공격" },
  w3_stoneRain: { text: "원 사이로 걸어가요" },
  w3_rockVolley: { text: "조각 사이로 옆걸음!" },
  w3_cartRun: { text: "레일 밖으로! 레버로 막힌 길에", do: true, voice: true },
  w3_clawGrab: { text: "폭탄 상자 옆으로 데려가요!", do: true, voice: true },
  w3_labRay: { text: "광선 줄 옆으로!" },
  w3_flaskSplash: { text: "초록 웅덩이 밖으로" },
  w3_labBotCall: { text: "로봇을 먼저 잡아요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") {
  GUIDE_PHASE_VOICE.cheesevale = { 0: "치즈를 지켜요! 대왕 앞을 막거나 먼저 부숴요", 1: "노란 ! 쥐가 치즈를 날라요. 먼저 잡아요", 2: "치즈 두 개를 노려요!" };
  GUIDE_PHASE_VOICE.starmine = { 0: "내려찍기 뒤에 공격해요", 1: "레버를 쳐서 수레를 막힌 길로!", 2: "레버가 저절로 돌아가요. 빨리!" };
  GUIDE_PHASE_VOICE.lunarlab = { 0: "집게를 폭탄 상자 옆으로 데려가요!", 1: "청소 로봇을 먼저 잡아요", 2: "집게가 두 개예요!" };
}
