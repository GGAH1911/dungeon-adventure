// ===== 월드 4 보스 3: 광차 대장 덜컹이 (cartmine, 설계서 docs/design/world4-underworld.md 5-3) =====
// 새 아이디어: 아레나에 네모 레일 고리 + 갈림길 2곳(레버). 레버를 치면 갈림길이 막다른 길(나무 범퍼) 쪽으로 바뀌어요.
//   덜컹이가 광차 돌진(w4_ctRide)할 때 갈림길이 범퍼 쪽이면 쾅! 광차에서 굴러떨어져 4초 비틀.
//   3단계: 레버가 8초마다 저절로 원래대로 돌아가요(휘파람) → 돌진 직전에 다시 맞춰요.
// 도우미(w4d…)는 네 파일 앞에 똑같이 있어요 (먼저 불린 것만 쓰여요).
// 같이 하기: 레버 방향(ctSpur)은 소품 칸, 광차 타기(ctRide·ctDX·ctDY)는 보스 칸이라 친구 기기에 그대로 가요. 움직이기·맞히기는 방장 기기에서만.
// 환경 약속: 레일 자리는 w4AddRail(carts: 0) 로 world.w4.rails 에도 적어요(빈 광차는 없어요).
//   레일 그림은 under_env.js 가 그려요. 그 파일이 없을 때(이 파일만 있을 때)는 여기서 그려요: typeof w4DrawRail === "function" 이면 안 그려요.

// ---------------- 월드 4 보스 1~4 공용 도우미 (네 파일에 똑같이 들어 있어요: 먼저 불린 것만 쓰여요, 불리는 순서와 상관없게) ----------------
var w4dDiff = typeof w4dDiff === "function" ? w4dDiff : function () { return (game.profile && game.profile.difficulty) || "normal"; }
var w4dK = typeof w4dK === "function" ? w4dK : function () { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[w4dDiff()] || 1; }
var w4dGuest = typeof w4dGuest === "function" ? w4dGuest : function () { return typeof netGuest === "function" && netGuest(); }
// 부하: 몬스터 파일(mobs_w4.js)이 아직 없으면(under.js 의 임시 몬스터) 비슷한 몬스터로
var w4dMon = typeof w4dMon === "function" ? w4dMon : function (id, fallback) { const d = MONSTERS[id]; return d && !d.w4Placeholder ? id : fallback; }
var w4dCalm = typeof w4dCalm === "function" ? w4dCalm : function (b) { casts = casts.filter((c) => c.m !== b); b.charge = null; if (b.state === "cast") b.state = "chase"; b.queue = []; }
var w4dStagger = typeof w4dStagger === "function" ? w4dStagger : function (b, sec, text, color = "#ffe27a") {
  if (!b || b.hp <= 0) return;
  w4dCalm(b);
  b.stagger = Math.max(b.stagger || 0, sec * w4dK());
  if (text) addFloatText(b.x, b.y, text, color, 28);
  game.shake = Math.max(game.shake, 0.4);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
}
var w4dBoss = typeof w4dBoss === "function" ? w4dBoss : function (type) { const b = typeof w4BossNow === "function" ? w4BossNow() : null; return b && b.type === type && b.hp > 0 ? b : null; }
var w4dProps = typeof w4dProps === "function" ? w4dProps : function (type, owner) { return monsters.filter((o) => o.type === type && o.hp > 0 && (!owner || o.owner === owner)); }
var w4dFromPlayer = typeof w4dFromPlayer === "function" ? w4dFromPlayer : function (h) { return allPlayers().some((p) => Math.hypot(h.fromX - p.x, h.fromY - p.y) < 0.6); } // 칼처럼 주인공 자리에서 친 것
// 소품 하나 (세운 자리를 그대로 돌려줘요)
var w4dProp = typeof w4dProp === "function" ? w4dProp : function (type, x, y, owner, r = 0.45) { const s = spawnProp(type, x, y, owner); s.r = r; s.appearTimer = 0; return s; }
// 예고 하나를 (x, y) 에 직접
var w4dCastAt = typeof w4dCastAt === "function" ? w4dCastAt : function (m, id, x, y, time) {
  const ab = ABILITIES[id], tune = abilityTuning();
  const c = makeCast(m, ab, id, { x, y }, Math.max(MIN_TELEGRAPH, (time || ab.telegraph.time) * tune.telegraph), tune);
  c.x = x; c.y = y; casts.push(c);
  return c;
}
// 원 안 주인공을 아프게 (구르면 회피)
var w4dHurtIn = typeof w4dHurtIn === "function" ? w4dHurtIn : function (c, x, y, r, push = 1.2) {
  for (const q of allPlayers()) {
    if (q.hp <= 0 || Math.hypot(q.x - x, q.y - y) > r + (q.r || 0.35) * 0.6) continue;
    if (q.rollTimer > 0) { addFloatText(q.x, q.y, "회피!", "#9be8ff", 18); continue; }
    const hp0 = q.hp; hurtPlayer(q, abilityDamage(c), c.m);
    if (q.hp < hp0 && push) { const dx = q.x - x, dy = q.y - y, d = Math.hypot(dx, dy) || 1; moveEntity(q, dx / d * push, dy / d * push); }
  }
}
// 보스 하나 등록 (월드 3 보스와 같은 틀)
var w4dDefine = typeof w4dDefine === "function" ? w4dDefine : function (mapId, B, build, onPhase) {
  MONSTERS[B.type] = { name: B.name, shape: B.type, behavior: "bossAI", color: B.color, hp: B.hp, speed: B.speed, damage: B.damage,
    xp: 55, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: B.size, world: 4 };
  const phases = B.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS[mapId] = {
    id: B.type, name: B.name, title: B.title, size: B.size, world: 4, material: B.material,
    arena: { size: B.arena, theme: B.theme, build },
    phases,
    create(x, y, level) {
      const m = createMonster(B.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[mapId];
      m.name = `${B.title} ${B.name}`;
      m.r = B.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.onPhase = (idx) => { if (B.msgs && B.msgs[idx]) showMessage(B.msgs[idx], 3, false, "#ffe27a"); if (onPhase) onPhase(m, idx); };
      return m;
    },
  };
}
// 공용 효과: 부하 부르기 ("w4dSummon"), 느려지는 장판 여러 개 ("w4dZones") — 네 파일 중 먼저 불린 파일이 한 번만 걸어요
if (typeof W4D_HOOKED === "undefined") var W4D_HOOKED = true, W4D_DO_HOOK = true; else var W4D_DO_HOOK = false;
if (W4D_DO_HOOK) hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect, m = c.m;
  if (e.type === "w4dSummon") {
    const type = w4dMon(e.monster, e.fallback || "zombie");
    m.summons = (m.summons || []).filter((s) => s.hp > 0);
    const n = Math.min(e.count, Math.max(0, (e.max || 3) - m.summons.length));
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(m.y - world.H / 2, m.x - world.W / 2) + Math.PI + (i - (n - 1) / 2) * 0.9, r = Math.max(3, world.W / 2 - 3.5);
      const spot = findFreeSpot(world.W / 2 + Math.cos(a) * r, world.H / 2 + Math.sin(a) * r, 0.35, 3) || { x: m.x + 1, y: m.y };
      const s = createMonster(type, spot.x, spot.y, m.level || game.mapLevel || 1);
      s.aggro = true; s.appearTimer = 0.6; s.summoned = true; monsters.push(s); m.summons.push(s);
      addRing(spot.x, spot.y, { speed: 3, life: 0.4, hue: 30 });
    }
    return true;
  }
  if (e.type === "w4dZones") {
    // 예고 자리 + 양옆 (아프지 않고 느려지기만 해요)
    const dx = c.x - m.x, dy = c.y - m.y, d = Math.hypot(dx, dy) || 1, px = -dy / d, py = dx / d;
    for (let i = 0; i < (e.count || 1); i++) {
      const off = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (e.gapW || 2.6);
      const x = c.x + px * off, y = c.y + py * off;
      if (isWall(Math.floor(x), Math.floor(y))) continue;
      zones.push({ x, y, radius: c.radius, life: e.duration, max: e.duration, tick: 0.7, tickT: 0.2, damage: 0, kind: e.kind || "web" });
    }
    return true;
  }
  return false;
}, 16);


const CT = { type: "w4_cartBoss", L: 7.5, spur: 3.4, speed: 5.5, crash: 4.0, lead: 4, autoFlip: 8, hitR: 0.75, lane: 1.1 }; // hitR: 광차 반폭(주인공 몸 0.35 를 더해 맞아요), lane: 빨간 줄 반폭 (hitR + 0.35 와 같아요)
// 레일 고리 꼭짓점 (시계 방향). 1, 4 번이 갈림길
function ctLoop(c) { const L = CT.L; return [[c - L, c - L], [c, c - L], [c + L, c - L], [c + L, c + L], [c, c + L], [c - L, c + L]]; }
function ctSpurEnd(c, j) { return j === 1 ? [c, c - CT.L + CT.spur] : [c, c + CT.L - CT.spur]; }
const CT_J = [1, 4];

Object.assign(MATERIALS, { w4_cartWheel: { name: "덜컹이 광차 바퀴", color: "#8a8a92" } });
if (typeof defBase === "function" && typeof LEGEND_FORMS === "function") {
  defBase("L_cartBoss", { slot: "weapon", legend: "cartmine", name: "덜컹 광부 곡괭이", minL: 0, color: "#8a8a92", mul: 1.12, effect: "chain",
    forms: LEGEND_FORMS({ w: "덜컹 광부 곡괭이", m: "광부 램프 지팡이", d: "광부 램프 지팡이", h: "광부 곡괭이 단검" }, "axe"), desc: "맞으면 번개가 옆으로 튀어요 (공격력 +12%)" });
  Object.assign(BOSS_LEGENDS, { cartmine: "L_cartBoss" });
}

MONSTERS.w4_ctSwitch = { name: "갈림길 레버", color: "#c8a060", shape: "w4_ctSwitch", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 4 };

Object.assign(ABILITIES, {
  w4_ctRide: { name: "광차 돌진", desc: "광차를 타고 레일을 따라 달려요. 앞 4칸 빨간 줄을 보고 레일에서 비켜요. 갈림길이 범퍼 쪽이면 쾅!", counter: "레일에서 비켜요! 레버를 쳐서 갈림길을 범퍼 쪽으로",
    tags: ["boss", "line", "move"], telegraph: { shape: "line", length: 4, width: 2.2, at: "self", time: 0.8 }, cooldown: 6, range: [0, 30],
    damageMul: 1.6, anim: "crouch", effect: { type: "w4_ctRide" } },
  w4_ctPick: { name: "곡괭이 쾅", desc: "광차에서 내려 곡괭이로 앞을 쾅!", counter: "원 밖으로! 쾅 뒤에 때려요",
    tags: ["boss", "area", "stagger", "ground"], telegraph: { shape: "circle", radius: 2.0, at: "front", offset: 1.6, time: 1.2 }, cooldown: 6, range: [0, 3.8],
    damageMul: 2.0, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.5 } },
  w4_ctOre: { name: "광석 던지기", desc: "광석을 여러 군데 던져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.25 }, cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 5, spread: 3.4, stagger: 0.18 } },
  w4_ctCall: { name: "꼬마 광부 부르기", desc: "호루라기 삑! 꼬마 광부 도깨비 둘이 와요.", counter: "꼬마 광부부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w4dSummon", monster: "w4_goblinMiner", fallback: "miner", count: 2, max: 3 } },
});

w4dDefine("cartmine", {
  type: CT.type, name: "덜컹이", title: "광차 대장", color: "#8a8a92", size: 3.0, r: 1.1, hp: 220, damage: 2.2, speed: 1.0, arena: 28,
  material: { id: "w4_cartWheel", name: "덜컹이 광차 바퀴", color: "#8a8a92" },
  theme: { floor: "#6a5a48", moss: "#c8a060", wall: "#3e3226", darkness: 0.42, bg: "#100c08" },
  msgs: ["", "꼬마 광부가 와요! 광석도 던져요", "휘파람! 레버가 저절로 돌아가요. 돌진 직전에 다시 맞춰요"],
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_ctRide", "w4_ctPick", "w4_ctRide"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_ctCall", "w4_ctRide", "w4_ctOre", "w4_ctPick", "w4_ctRide"] },
    { until: 0, gap: 1.4, pattern: ["w4_ctRide", "w4_ctOre", "w4_ctRide", "w4_ctPick", "w4_ctCall"] },
  ],
}, (w) => {
  const c = w.W / 2, V = ctLoop(c);
  w4AddRail(w, V.map(([x, y]) => ({ x, y })), { carts: 0, loop: true, speed: 0 });
  for (const j of CT_J) { const e = ctSpurEnd(c, j); w4AddRail(w, [{ x: V[j][0], y: V[j][1] }, { x: e[0], y: e[1] }], { carts: 0, speed: 0 }); }
}, (m) => { if (m.ctRide) ctEnd(m); });

function ctSwitches(b) { return w4dProps("w4_ctSwitch", b); }
function ctSwitchAt(b, j) { return ctSwitches(b).find((s) => s.ctJ === j) || null; }
function ctEnd(m) { m.ctRide = false; m.ctSpurRide = false; m.moving = false; }
function ctFace(m, tx, ty) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1; m.ctDX = dx / d; m.ctDY = dy / d; m.faceX = m.ctDX; m.faceY = m.ctDY; }
hookOn("dungeonTick", (dt) => {
  const b = w4dBoss(CT.type);
  if (!b) return;
  const c = world.W / 2;
  if (!b.ctInit) {
    b.ctInit = true;
    for (const j of CT_J) { const V = ctLoop(c)[j], e = ctSpurEnd(c, j), sx = (j === 1 ? 1.4 : -1.4); const s = w4dProp("w4_ctSwitch", V[0] + sx, (V[1] + e[1]) / 2, b, 0.42); s.ctJ = j; s.ctSpur = 0; s.ctAuto = CT.autoFlip; }
  }
  // 3단계: 레버가 저절로 원래대로
  if (b.phaseIdx === 2) for (const s of ctSwitches(b)) {
    if (!s.ctSpur) { s.ctAuto = CT.autoFlip; continue; }
    s.ctAuto -= dt;
    if (s.ctAuto <= 0) { s.ctSpur = 0; s.ctAuto = CT.autoFlip; addFloatText(s.x, s.y, "휘익! 돌아갔다", "#ffb070", 16); }
  }
  if (!b.ctRide) return;
  if (b.stagger > 0 || b.invuln > 0) { ctEnd(b); return; }
  // 보스 AI 가 움직인 것은 되돌리고 레일을 따라가요
  if (typeof b.ctPX === "number") { b.x = b.ctPX; b.y = b.ctPY; }
  b.gap = Math.max(b.gap, 0.4); b.state = "chase";
  const V = ctLoop(c);
  const tgt = b.ctSpurRide ? ctSpurEnd(c, b.ctSpurJ) : V[b.ctNext];
  ctFace(b, tgt[0], tgt[1]);
  const d = Math.hypot(tgt[0] - b.x, tgt[1] - b.y), step = CT.speed * dt;
  if (d <= step) {
    b.x = tgt[0]; b.y = tgt[1];
    if (b.ctSpurRide) { // 막다른 길 범퍼에 쾅!
      ctEnd(b); spawnBurst(b.x, b.y, ["#c8a060", "#8a8a92", "#ffffff"], 24); spawnDust(b.x, b.y);
      w4dStagger(b, CT.crash, "쾅! 범퍼! 굴러떨어졌다!");
      showMessage("광차에서 떨어졌어요! 지금 공격!", 2.2, false, "#ffe27a");
    } else {
      const j = CT_J.includes(b.ctNext) ? b.ctNext : 0, sw = j && ctSwitchAt(b, j);
      if (sw && sw.ctSpur) { b.ctSpurRide = true; b.ctSpurJ = j; }
      else {
        if (j) b.ctJPassed = (b.ctJPassed || 0) + 1;
        if ((b.ctJPassed || 0) >= 2 && !j) ctEnd(b); // 갈림길 둘을 지나면 다음 꼭짓점에서 내려요
        else b.ctNext = (b.ctNext + 1) % V.length;
      }
    }
  } else { b.x += (tgt[0] - b.x) / d * step; b.y += (tgt[1] - b.y) / d * step; b.moving = true; b.walkTime = (b.walkTime || 0) + dt; }
  b.ctPX = b.x; b.ctPY = b.y;
  if (Math.random() < 0.4) spawnDust(b.x - (b.ctDX || 0) * 0.8, b.y - (b.ctDY || 0) * 0.8);
  // 레일 위 주인공을 치면 아파요 (한 번 달릴 때 한 번, 구르면 회피)
  if (b.ctRide) for (const p of allPlayers()) {
    if (p.hp <= 0 || (b.ctHit || []).includes(p.pid || 1) || Math.hypot(p.x - b.x, p.y - b.y) > CT.hitR + (p.r || 0.35)) continue;
    b.ctHit.push(p.pid || 1);
    if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); continue; }
    const hp0 = p.hp; hurtPlayer(p, b.ctDmg || b.damage, b);
    if (p.hp < hp0) moveEntity(p, -(b.ctDY || 0) * 1.4, (b.ctDX || 0) * 1.4); // 옆으로 튕겨요
  }
}, 40);
// 돌진 예고: 가까운 레일 꼭짓점으로 올라타고 다음 꼭짓점 쪽으로 (방장 기기)
hookOn("castStarted", (m, id) => {
  if (!m || id !== "w4_ctRide" || w4dGuest() || (typeof netplay !== "undefined" && netplay.replaying)) return;
  const c = casts.find((q) => q.m === m && q.id === "w4_ctRide");
  if (!c) return;
  const V = ctLoop(world.W / 2);
  let vi = 0, best = 1e9;
  V.forEach(([x, y], i) => { const d = Math.hypot(x - m.x, y - m.y); if (d < best) { best = d; vi = i; } });
  m.x = V[vi][0]; m.y = V[vi][1]; m.ctPX = m.x; m.ctPY = m.y;
  spawnDust(m.x, m.y);
  m.ctNext = (vi + 1) % V.length;
  ctFace(m, V[m.ctNext][0], V[m.ctNext][1]);
  c.x = m.x; c.y = m.y; c.dirX = m.ctDX; c.dirY = m.ctDY;
}, 50);
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w4_ctRide") return false;
  const m = c.m;
  m.ctRide = true; m.ctSpurRide = false; m.ctJPassed = 0; m.ctHit = []; m.ctDmg = abilityDamage(c);
  m.ctPX = m.x; m.ctPY = m.y;
  if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
  addFloatText(m.x, m.y, "덜컹덜컹!", "#c8a060", 22);
  return true;
}, 15);
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w4_ctSwitch") return false;
  if (h.opts.dot) return true;
  if (game.time - (s.ctHitT ?? -9) < 0.25 && game.time >= (s.ctHitT ?? -9)) return true; // 한 번 휘두름에 한 번
  s.ctHitT = game.time;
  s.ctSpur = s.ctSpur ? 0 : 1; s.ctAuto = CT.autoFlip;
  addFloatText(s.x, s.y, s.ctSpur ? "철컥! 범퍼 쪽" : "철컥! 고리 쪽", s.ctSpur ? "#ffe27a" : "#cfd6e0", 16);
  if (typeof sfx !== "undefined" && sfx.click) sfx.click();
  return true;
}, 4);

// ----- 그림 -----
function ctLine(x0, y0, x1, y1, color, w) { const a = toScreen(x0, y0, 0.02), b = toScreen(x1, y1, 0.02); ctx.strokeStyle = color; ctx.lineWidth = w * ZOOM; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
function ctDrawTrack(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / (d || 1), uy = (y1 - y0) / (d || 1), px = -uy * 0.32, py = ux * 0.32;
  for (let t = 0.3; t < d; t += 0.7) { const x = x0 + ux * t, y = y0 + uy * t; ctLine(x - px * 1.3, y - py * 1.3, x + px * 1.3, y + py * 1.3, "#6a4a2a", 4); } // 침목
  ctLine(x0 - px, y0 - py, x1 - px, y1 - py, "#9a9aa2", 2.5); ctLine(x0 + px, y0 + py, x1 + px, y1 + py, "#9a9aa2", 2.5);
}
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon") return;
  const b = monsters.find((o) => o.type === CT.type && o.hp > 0);
  if (!b) return;
  const c = world.W / 2, V = ctLoop(c);
  ctx.save(); ctx.lineCap = "round";
  if (typeof w4DrawRail !== "function") {
    for (let i = 0; i < V.length; i++) { const a = V[i], q = V[(i + 1) % V.length]; ctDrawTrack(a[0], a[1], q[0], q[1]); }
    for (const j of CT_J) { const e = ctSpurEnd(c, j); ctDrawTrack(V[j][0], V[j][1], e[0], e[1]); }
  }
  // 갈림길 금색 화살표: 다음에 갈 쪽 (범퍼 쪽이면 금색)
  for (const s of monsters) {
    if (s.type !== "w4_ctSwitch" || s.hp <= 0) continue;
    const J = V[s.ctJ], e = ctSpurEnd(c, s.ctJ), nx = V[(s.ctJ + 1) % V.length];
    const to = s.ctSpur ? e : nx, dx = to[0] - J[0], dy = to[1] - J[1], d = Math.hypot(dx, dy) || 1;
    if (typeof spArrow === "function") spArrow(J[0], J[1], dx / d, dy / d, s.ctSpur ? "#ffd23f" : "#cfd6e0", 1.2);
  }
  ctx.restore();
  // 막다른 길 끝 나무 범퍼
  for (const j of CT_J) { const e = ctSpurEnd(c, j); drawBox(e[0] - 0.45, e[1] - 0.2, 0, 0.9, 0.4, 0.5, "#a8784a"); drawBox(e[0] - 0.45, e[1] - 0.2, 0.5, 0.9, 0.4, 0.08, "#ffd23f"); }
}, 54);
hookOn("drawTelegraphsAfter", () => {
  // 광차를 타는 동안 앞 4칸 빨간 줄 (두 기기 모두 보스 칸으로 그려요)
  for (const b of monsters) {
    if (b.type !== CT.type || !b.ctRide || b.hp <= 0) continue;
    const L = CT.lead, w = CT.lane, dx = b.ctDX || 0, dy = b.ctDY || 0, px = -dy * w, py = dx * w;
    fillPoly([toScreen(b.x + px, b.y + py, 0.03), toScreen(b.x + dx * L + px, b.y + dy * L + py, 0.03), toScreen(b.x + dx * L - px, b.y + dy * L - py, 0.03), toScreen(b.x - px, b.y - py, 0.03)], "rgba(255,60,40,0.32)");
  }
}, 50);

Object.assign(EXTRA_SHAPES, {
  // 광차 대장 덜컹이: 큰 회색 광차 안의 두더지 광부 (노란 헬멧 램프). 광차를 타지 않을 땐 옆에 곡괭이
  w4_cartBoss(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, up = a.raise * 0.06, ride = !!m.ctRide;
    // 광차
    P.push([0, 0, 0.05, 0.62, 0.5, 0.22, "#6a6a72"]);
    P.push([0, 0, 0.27, 0.66, 0.54, 0.04, "#8a8a92"]);
    for (const sd of [1, -1]) for (const f of [0.2, -0.2]) P.push([f, sd * 0.26, 0, 0.12, 0.04, 0.12, "#2a2a30"]);
    // 두더지 광부
    P.push([0.02, 0, 0.27, 0.36, 0.34, 0.26 * sq, "#8a6a4a"]);
    P.push([0.16, 0, 0.36 + up, 0.12, 0.2, 0.12, "#a8886a"]);
    P.push([0.23, 0, 0.4 + up, 0.04, 0.06, 0.05, "#ff9ab8"]);
    eyes(P, 0.22, 0.06, 0.46 + up, 0.035, "#1a1010", a.stag);
    P.push([0.04, 0, 0.53 * sq, 0.26, 0.28, 0.08, "#ffd23f"]); // 헬멧
    P.push([0.17, 0, 0.55 * sq, 0.04, 0.08, 0.06, "#fff6c0", true]); // 램프
    if (!ride) { P.push([0.24, 0.3, 0.3 + up, 0.04, 0.04, 0.4, "#a87a4a"], [0.24, 0.3, 0.68 + up, 0.24, 0.05, 0.06, "#cfd6e0"]); } // 곡괭이
    drawVoxelParts(m, P, { top: 0.75 });
  },
  // 갈림길 레버: 나무 받침 + 막대. 범퍼 쪽이면 금색으로 넘어가 있어요
  w4_ctSwitch(m) {
    const x = m.x, y = m.y, on = !!m.ctSpur;
    drawBox(x - 0.3, y - 0.3, 0, 0.6, 0.6, 0.18, "#6a4a2a");
    const lx = on ? 0.18 : -0.18;
    drawBox(x - 0.05 + lx * 0.5, y - 0.05, 0.18, 0.1, 0.1, 0.5, "#8a8a92");
    drawBox(x - 0.1 + lx, y - 0.1, 0.62, 0.2, 0.2, 0.16, on ? "#ffd23f" : "#cfd6e0");
  },
});

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_ctRide: { text: "레일에서 비켜요! 레버로 범퍼 쪽!", do: true, voice: true },
  w4_ctPick: { text: "원 밖으로! 쾅 뒤에 공격" },
  w4_ctOre: { text: "원 사이로 걸어가요" },
  w4_ctCall: { text: "꼬마 광부부터!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") Object.assign(GUIDE_PHASE_VOICE, {
  cartmine: { 0: "레버를 쳐서 갈림길을 범퍼 쪽으로! 광차가 쾅 부딪혀요", 1: "꼬마 광부가 와요! 광석도 던져요", 2: "휘파람! 레버가 저절로 돌아가요. 돌진 직전에 다시 맞춰요" },
});
