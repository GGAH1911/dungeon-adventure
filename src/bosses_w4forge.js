// ===== 월드 4 보스 10: 쇠망치 거인 땅땅이 (forge) (설계서 5-10) =====
// 새 아이디어: 레일 2줄이 모루 쪽으로 이어져요. 레일 끝 정류장의 불 광차를 칼(화살·마법도)로 치면 레일을 따라 굴러가(6칸/초)
//   모루 앞에서 망치질하던 땅땅이에게 쾅! 4.5초 비틀 + 5%. 땅땅이가 모루 앞에 없으면 모루에 쾅 하고 정류장으로 돌아와요(헛걸음).
//   땅땅이는 모루 망치질(w4_fgHammer)을 하러 모루 앞으로 자주 돌아와요 → "망치질할 때 광차를 보내요".
// 레일·광차는 이 보스 몫이라 world.w4.rails 에 넣지 않아요 (under_env.js 의 광차와 섞이지 않게). 레일 그림도 이 파일이 그려요.
// 같이 하기: 광차는 소품 몬스터(fcRoll·fcT·fcRail 칸), 계산은 방장만.

// 이 파일 앞쪽에 월드 4 보스 9~12(작업자 F) 공용 도우미 w4f* 가 있어요 (ruins·goblintown·underthrone·undertower 파일이 써요).
//   이 파일이 먼저 불려야 해요: index.html 에서 forge 를 맨 앞에, tools/lib.mjs 는 이름 순(forge < goblintown < ruins < underthrone).

// ----- 공용 도우미 (보스 9~12) -----
function w4fStagK() { return typeof W4 !== "undefined" ? W4.stagK() : 1; }
function w4fDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
// 부르는 몬스터: 월드 4 몬스터가 아직 없거나 임시(under.js)면 비슷한 것으로
function w4fMon(id, fb) { return MONSTERS[id] && !MONSTERS[id].w4Placeholder ? id : fb; }
// 지금 계산 중인 보스 (방장: 보스방 + 탑 보스 층)
function w4fBoss(type) { const b = typeof w4BossNow === "function" ? w4BossNow() : null; return b && b.type === type && b.hp > 0 ? b : null; }
function w4fSeen(type) { return monsters.find((o) => o.type === type && o.hp > 0) || null; }
function w4fProps(type) { return monsters.filter((o) => o.type === type); }
function w4fCalm(b, gap = 1.0) { casts = casts.filter((c) => c.m !== b); b.charge = null; b.state = "chase"; b.queue = []; b.gap = Math.max(b.gap || 0, gap); }
function w4fStun(b, t, frac, text) {
  w4fCalm(b, 0.5);
  if (frac) damageMonster(b, b.maxHp * frac, b.x, b.y, false, 0, { w4Prop: true });
  b.stagger = Math.max(b.stagger || 0, t * w4fStagK());
  addFloatText(b.x, b.y, text, "#ffe27a", 26);
  game.shake = Math.max(game.shake, 0.45);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
}
function w4fRing(x, y, r, color, w = 2.5, dash) {
  const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push(toScreen(x + Math.cos(t) * r, y + Math.sin(t) * r, 0.03)); }
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * ZOOM; if (dash) { ctx.setLineDash([6 * ZOOM, 6 * ZOOM]); ctx.lineDashOffset = -game.time * 30 * ZOOM; }
  ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
}
function w4fDisc(x, y, r, fill) {
  const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push(toScreen(x + Math.cos(t) * r, y + Math.sin(t) * r, 0.02)); }
  ctx.save(); ctx.fillStyle = fill; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fill(); ctx.restore();
}
function w4fLine(x0, y0, x1, y1, color, w = 3, dash) {
  const a = toScreen(x0, y0, 0.03), b = toScreen(x1, y1, 0.03);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * ZOOM; if (dash) { ctx.setLineDash([7 * ZOOM, 7 * ZOOM]); ctx.lineDashOffset = -game.time * 30 * ZOOM; }
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
}
// 보스 정의 (월드 3 bosses_w3c.js 와 같은 틀: bossAI + pattern)
function w4fMakeBoss(o) {
  MONSTERS[o.type] = { name: o.name, shape: o.type, behavior: "bossAI", color: o.color, hp: o.hp, speed: o.speed, damage: o.damage,
    xp: 70, emerald: 1, emeraldCount: 16, heavy: true, isBoss: true, size: o.size, world: 4 };
  const phases = o.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS[o.mapId] = {
    id: o.type, name: o.name, title: o.title, size: o.size, world: 4, material: o.material,
    arena: { size: o.arena, theme: o.theme, build: o.build }, phases,
    create(x, y, level) {
      const m = createMonster(o.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[o.mapId];
      m.name = `${o.title} ${o.name}`;
      m.r = o.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      if (o.init) o.init(m);
      m.onPhase = (idx) => o.onPhase && o.onPhase(m, idx);
      return m;
    },
  };
}
// 보스가 아닌 소품 (때릴 수 있지만 다치지 않아요)
function w4fProp(id, name, color, extra = {}) { MONSTERS[id] = { name, color, shape: id, behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 4, codexSkip: true, ...extra }; }

const W4G_FORGE = { anvil: [0, -8.2], front: [0, -5.6], stations: [[-8.5, 7], [8.5, 7]], ends: [[-1.3, -5.4], [1.3, -5.4]], speed: 6, hitR: 2.4, stun: 4.5, frac: 0.05 };
function w4fgPts(i, c = world.W / 2) { const s = W4G_FORGE.stations[i], e = W4G_FORGE.ends[i]; return { sx: c + s[0], sy: c + s[1], ex: c + e[0], ey: c + e[1] }; }

Object.assign(MATERIALS, { w4_forgeEmber: { name: "땅땅이 화로 불씨", color: "#ffb04a", enchant: "burn" } });
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") {
  defBase("L_forgeGiant", { slot: "weapon", legend: "forge", name: "땅땅 거인 망치", minL: 0, color: "#ffb04a", mul: 1.08, effect: "burn",
    forms: LEGEND_FORMS({ w: "땅땅 거인 망치", m: "화로 불씨 지팡이", d: "화로 불씨 지팡이", h: "불씨 단검" }, "hammer"), desc: "거인 대장장이의 망치 (공격력 +8%, 불붙이기)" });
  BOSS_LEGENDS.forge = "L_forgeGiant";
}
w4fProp("w4_fireCart", "불 광차", "#ffb04a");

const W4G_MINER = w4fMon("w4_goblinMiner", "miner");
Object.assign(ABILITIES, {
  w4_fgHammer: { name: "모루 망치질", desc: "모루 앞으로 가서 땅땅! 땅에 원이 차례로 떨어져요.", counter: "원 사이로! 망치질할 때 불 광차를 보내요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.2 },
    cooldown: 6, range: [0, 40], damageMul: 1.4, anim: "slam", effect: { type: "rain", count: 4, spread: 2.6, stagger: 0.4 } },
  w4_fgSwing: { name: "망치 휘두르기", desc: "큰 망치를 부채꼴로 휙! 그 뒤 숨을 골라요.", counter: "부채꼴 밖으로! 숨 고를 때 공격",
    tags: ["boss", "cone", "stagger"], telegraph: { shape: "cone", length: 4, angle: 1.6, at: "self", time: 1.3 },
    cooldown: 5, range: [0, 4], damageMul: 1.9, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.3 } },
  w4_fgSpark: { name: "불꽃 튀기기", desc: "모루에서 불꽃 탄이 부채꼴로 튀어요. 느려요.", counter: "탄 사이로 옆걸음!",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 8, angle: 1.0, at: "self", time: 1.1 },
    cooldown: 6, range: [0, 10], damageMul: 1.1, anim: "raise", effect: { type: "volley", count: 6, spread: 1.0, speed: 5, color: "#ffb04a" } },
  w4_fgCall: { name: "꼬마 광부 부르기", desc: "어이! 꼬마 광부 도깨비 둘을 불러요.", counter: "꼬마부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: W4G_MINER, count: 2 } },
  w4_fgThrow: { name: "빈 광차 던지기", desc: "빈 광차를 번쩍 들어 쭉 던져요.", counter: "빨간 줄 옆으로!",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.4, at: "self", time: 1.5 },
    cooldown: 7, range: [0, 12], damageMul: 1.6, anim: "raise", effect: { type: "damage" } },
});

w4fMakeBoss({ mapId: "forge", type: "w4_forgeGiant", name: "땅땅이", title: "쇠망치 거인", color: "#e8a070", size: 3.4, r: 1.15, hp: 270, damage: 2.5, speed: 0.95, arena: 28,
  material: { id: "w4_forgeEmber", name: "땅땅이 화로 불씨", color: "#ffb04a", enchant: "burn" },
  theme: { floor: "#5a4a44", moss: "#ff9a4a", wall: "#3a2c28", darkness: 0.35, bg: "#120806", lava: true },
  build(w) {
    const c = w.W / 2;
    // 용암 띠 2 (가장자리, 가운데 다리)
    w4AddLava(w, { x0: c - 12, y0: c - 1, x1: c - 10, y1: c + 1 }, []);
    w4AddLava(w, { x0: c + 10, y0: c - 1, x1: c + 12, y1: c + 1 }, []);
  },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_fgHammer", "w4_fgSwing", "w4_fgHammer"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_fgHammer", "w4_fgSpark", "w4_fgCall", "w4_fgSwing", "w4_fgHammer"] },
    { until: 0, gap: 1.4, pattern: ["w4_fgThrow", "w4_fgHammer", "w4_fgSpark", "w4_fgSwing", "w4_fgThrow", "w4_fgHammer"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) showMessage("불꽃이 튀어요! 꼬마 광부도 와요", 2.6, false, "#ffb04a");
    if (idx === 2) showMessage("땅땅이가 빈 광차를 던져요! 빨간 줄 옆으로", 3, false, "#ffb04a");
  } });

// 망치질은 모루 앞에서: 예고가 시작되면 땅땅이가 모루 앞으로 털썩 (땅땅이일 때만)
hookOn("castStarted", (m, id) => {
  if (id !== "w4_fgHammer" || !m || m.type !== "w4_forgeGiant") return;
  const c = world.W / 2, f = W4G_FORGE.front;
  spawnBurst(m.x, m.y, ["#e8a070", "#ffb04a"], 10);
  m.x = c + f[0]; m.y = c + f[1]; m.faceX = 0; m.faceY = -1; m.fgAtAnvil = 1;
  addFloatText(m.x, m.y, "땅땅!", "#ffb04a", 22);
}, 50);
function w4fgCarts() { return w4fProps("w4_fireCart"); }
// 광차 치기 -> 굴러가요
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w4_fireCart") return false;
  if (h.opts.dot || s.fcRoll) return true;
  if (game.time - (s.fcHitT || -9) < 0.3) return true;
  s.fcHitT = game.time; s.fcRoll = 1; s.fcT = 0;
  addFloatText(s.x, s.y, "덜컹! 간다!", "#ffd23f", 20);
  if (typeof sfx !== "undefined" && sfx.click) sfx.click();
  return true;
}, 4);
hookOn("dungeonTick", (dt) => {
  const b = w4fBoss("w4_forgeGiant");
  if (!b) return;
  if (!b.fgInit) { b.fgInit = true; for (const i of [0, 1]) { const P = w4fgPts(i); const s = spawnProp("w4_fireCart", P.sx, P.sy, b); s.x = P.sx; s.y = P.sy; s.r = 0.55; s.fcRail = i; s.fcRoll = 0; s.fcT = 0; } }
  // 모루 앞에서 멀어지면 "모루 앞" 표시 끔
  if (b.fgAtAnvil) { const c = world.W / 2, f = W4G_FORGE.front; if (Math.hypot(b.x - (c + f[0]), b.y - (c + f[1])) > W4G_FORGE.hitR) b.fgAtAnvil = 0; }
  for (const s of w4fgCarts()) {
    if (!s.fcRoll) continue;
    const P = w4fgPts(s.fcRail || 0), L = Math.hypot(P.ex - P.sx, P.ey - P.sy);
    s.fcT += W4G_FORGE.speed * dt / L;
    const k = Math.min(1, s.fcT);
    s.x = P.sx + (P.ex - P.sx) * k; s.y = P.sy + (P.ey - P.sy) * k;
    if (Math.random() < 0.5) addSparkle(s.x, s.y, 0.3, { vz: 1, life: 0.4, size: 0.5, gold: true });
    if (k < 1) continue;
    // 끝: 땅땅이가 레일 끝(모루 앞)에 있으면 쾅!
    if (Math.hypot(b.x - P.ex, b.y - P.ey) < W4G_FORGE.hitR + (b.r || 1)) w4fStun(b, W4G_FORGE.stun, W4G_FORGE.frac, "쾅! 앗 뜨거!");
    else { addFloatText(P.ex, P.ey, "쾅! (헛걸음)", "#c8a080", 18); game.shake = Math.max(game.shake, 0.2); }
    spawnBurst(P.ex, P.ey, ["#ffb04a", "#ffd23f", "#5a4a44"], 14);
    s.fcRoll = 0; s.fcT = 0; s.x = P.sx; s.y = P.sy; s.appearTimer = 0.5;
  }
}, 40);

// 레일 그림 (이 보스 몫)
hookOn("drawFloor", () => {
  const b = w4fSeen("w4_forgeGiant"); if (!b) return;
  for (const i of [0, 1]) {
    const P = w4fgPts(i), dx = P.ex - P.sx, dy = P.ey - P.sy, L = Math.hypot(dx, dy), nx = -dy / L * 0.3, ny = dx / L * 0.3;
    for (let t = 0; t <= L; t += 0.7) { const x = P.sx + dx * t / L, y = P.sy + dy * t / L; w4fLine(x - nx * 1.5, y - ny * 1.5, x + nx * 1.5, y + ny * 1.5, "#6a4e34", 5); }
    w4fLine(P.sx + nx, P.sy + ny, P.ex + nx, P.ey + ny, "#a8a8b0", 3); w4fLine(P.sx - nx, P.sy - ny, P.ex - nx, P.ey - ny, "#a8a8b0", 3);
  }
  const c = world.W / 2, f = W4G_FORGE.front;
  w4fRing(c + f[0], c + f[1], 1.4, b.fgAtAnvil ? "rgba(255,226,122,0.9)" : "rgba(255,176,74,0.35)", 3, !b.fgAtAnvil);
}, 50);

Object.assign(EXTRA_SHAPES, {
  // 쇠망치 거인: 큰 주황 피부, 웃는 얼굴, 콧수염, 가죽 앞치마, 큰 망치
  w4_forgeGiant(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.9 : 1, up = a.raise * 0.12;
    const skin = "#e8a070", ap = "#7a4e30", hair = "#5a3a20";
    for (const sd of [1, -1]) P.push([0.02 + a.walk * sd * 0.04, sd * 0.13, 0, 0.16, 0.14, 0.18, "#4a3a30"]);
    P.push([0, 0, 0.18, 0.38, 0.42, 0.34 * sq, skin]);
    P.push([0.17, 0, 0.18, 0.06, 0.34, 0.3 * sq, ap]); // 앞치마
    P.push([0.03, 0, 0.52 * sq, 0.28, 0.3, 0.24, skin]);
    eyes(P, 0.175, 0.07, 0.64 * sq, 0.05, "#2a1a10", a.stag);
    P.push([0.18, 0, 0.57 * sq, 0.03, 0.18, 0.04, hair]); // 콧수염
    P.push([0.18, 0, 0.53 * sq, 0.02, 0.08, 0.02, "#ffffff"]); // 웃는 이
    P.push([0.02, 0, 0.76 * sq, 0.3, 0.32, 0.06, hair]);
    for (const sd of [1, -1]) P.push([0.04, sd * 0.25, 0.32 + (sd > 0 ? up * 2 : 0), 0.14, 0.12, 0.22, skin]);
    // 망치 (오른손)
    P.push([0.12 + up, 0.28, 0.5 + up * 2, 0.04, 0.04, 0.36, "#6a4e34"], [0.12 + up, 0.28, 0.86 + up * 2, 0.22, 0.14, 0.14, "#8a8a96"]);
    drawVoxelParts(m, P, { top: 0.9 });
  },
  w4_fireCart(m) {
    const x = m.x, y = m.y;
    for (const [ox, oy] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]]) drawBox(x + ox - 0.06, y + oy - 0.06, 0, 0.12, 0.12, 0.14, "#2e2a2a");
    drawBox(x - 0.42, y - 0.36, 0.12, 0.84, 0.72, 0.36, "#6a5a4a");
    drawBox(x - 0.44, y - 0.38, 0.46, 0.88, 0.76, 0.05, m.fcRoll ? "#ffd23f" : "#e0b040"); // 금색 테두리
    drawBox(x - 0.3, y - 0.24, 0.48, 0.6, 0.48, 0.12, "#ff7a2a");
    if (Math.sin(game.time * 9 + x) > 0.3) drawBox(x - 0.08, y - 0.08, 0.6, 0.16, 0.16, 0.12, "#ffe27a");
  },
});

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_fgHammer: { text: "망치질할 때 불 광차를 쳐서 보내요!", do: true, voice: true },
  w4_fgSwing: { text: "부채꼴 밖으로! 그다음 공격" },
  w4_fgSpark: { text: "탄 사이로 옆걸음!" },
  w4_fgCall: { text: "꼬마부터 정리해요" },
  w4_fgThrow: { text: "빨간 줄 옆으로!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.forge = { 0: "망치질할 때 불 광차를 쳐서 보내요!", 1: "불꽃 사이로 옆걸음!", 2: "빈 광차를 던져요! 빨간 줄 옆으로" };
