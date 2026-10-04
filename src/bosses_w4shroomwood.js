// ===== 월드 4 보스 2: 포자왕 뭉실이 (shroomwood, 설계서 docs/design/world4-underworld.md 5-2) =====
// 새 아이디어: 아레나의 버섯 패드 4개. 화살표가 1.5초마다 보스 쪽(금색)과 원래 쪽을 번갈아 가리켜요.
//   금색일 때 밟으면 날아가 뭉실이 갓 위에 쿵! 갓이 납작 → 3.5초 비틀 + 최대 체력 3%. 착지하는 주인공은 0.5초 무적.
//   3단계: 뭉실이가 패드 하나를 깔고 앉아요 (6초 동안 못 써요) → 남은 패드 중 보스를 가리키는 것을 찾아요.
// 도우미(w4d…)는 네 파일 앞에 똑같이 있어요 (먼저 불린 것만 쓰여요).
// 같이 하기: 패드 화살표(spAim)·막힘(spBlock)은 소품 칸이라 친구 기기에 그대로 가요. 날기는 조작 단계(playerInput)라서
//   친구 기기가 자기 주인공을 똑같이 날리고, 착지 판정(비틀·피해)은 방장 기기에서만 해요.
// 환경 약속: 이 보스의 패드는 이 파일의 소품(w4_spPad)이에요. world.w4.shrooms 에는 넣지 않아요(그쪽 버섯은 under_env.js 가 날려요).

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


const SP = { type: "w4_sporeKing", swap: 1.5, hop: 3.5, hopT: 0.6, stag: 3.5, dmgFrac: 0.03, landInv: 0.5, blockT: 6, padR: 0.5 };

Object.assign(MATERIALS, { w4_sporeCap: { name: "포자왕 갓 조각", color: "#ff9ad6" } });
if (typeof defBase === "function") {
  defBase("L_sporeKing", { slot: "armor", legend: "shroomwood", name: "뭉실이 버섯 모자", minL: 0, look: { body: "#c86aa0", legs: "#8a4a70", helmet: "#ff9ad6", boots: "#6a3a58", gloves: "#c86aa0" }, perk: { hearts: 2, roll: 0.15 }, desc: "하트 +2, 구르기를 더 자주 해요" });
  Object.assign(BOSS_LEGENDS, { shroomwood: "L_sporeKing" });
}

MONSTERS.w4_spPad = { name: "버섯 패드", color: "#ff9ad6", shape: "w4_spPad", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 4 };
// 패드는 밟는 물건: 공격·자동 조준이 노리지 않아요 (solids 에 넣지 않으려고 def.untargetable 대신 훅으로)
hookOn("untargetable", (o) => o.type === "w4_spPad", 50);
hookOn("monsterDamage", (h) => !!(h.m && h.m.type === "w4_spPad"), 4);

Object.assign(ABILITIES, {
  w4_spBounce: { name: "제자리 쿵", desc: "뭉실이가 통 뛰어 쿵! 둘레에 포자 고리가 퍼져요. 바로 옆은 안전해요.", counter: "뭉실이 바로 옆 금색 안으로 파고들거나 멀리! 쿵 뒤에 때려요",
    tags: ["boss", "ring", "stagger", "ground"], telegraph: { shape: "ring", radius: 4.0, inner: 1.5, at: "self", time: 1.2 }, cooldown: 5, range: [0, 30],
    damageMul: 1.6, anim: "slam", staggerAfter: 1.8, effect: { type: "knockback", force: 1.2 } },
  w4_spCloud: { name: "포자 구름", desc: "분홍 포자 구름을 뿜어요. 들어가면 느려져요 (아프진 않아요).", counter: "분홍 구름 밖으로 돌아가요",
    tags: ["boss", "zone", "slow"], telegraph: { shape: "circle", radius: 1.8, at: "target", time: 1.0 }, cooldown: 9, range: [0, 12], damageMul: 0, anim: "raise",
    effect: { type: "w4dZones", count: 3, duration: 4, kind: "web", gapW: 2.8 } },
  w4_spRoll: { name: "갓 데굴", desc: "갓으로 데굴데굴! 넓은 빨간 길로 굴러와요.", counter: "넓은 빨간 길 옆으로! 멈춘 뒤에 때려요",
    tags: ["boss", "line", "move", "stagger"], telegraph: { shape: "line", length: 8, width: 2.0, at: "self", time: 1.2 }, cooldown: 7, range: [2, 9],
    damageMul: 1.6, anim: "crouch", staggerAfter: 1.8, effect: { type: "charge", speed: 9, stunOnWall: 2.0 } },
  w4_spCall: { name: "버섯돌이 부르기", desc: "포자를 퐁퐁! 버섯돌이 둘이 자라요.", counter: "버섯돌이부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w4dSummon", monster: "w4_shroomling", fallback: "mushroom", count: 2, max: 3 } },
  w4_spSit: { name: "패드 깔고 앉기", desc: "높이 뛰어 버섯 패드 하나를 깔고 앉아요. 그 패드는 잠깐 못 써요.", counter: "원 밖으로! 남은 패드 중 금색 화살표를 찾아요",
    tags: ["boss", "area", "move", "ground"], telegraph: { shape: "circle", radius: 2.0, at: "target", time: 1.3 }, cooldown: 8, range: [0, 30], damageMul: 1.8, anim: "crouch",
    effect: { type: "w4_spSit" } },
  w4_spRain: { name: "포자 비", desc: "포자 덩어리가 여러 군데 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.3 }, cooldown: 9, range: [0, 14], damageMul: 1.2, anim: "raise",
    effect: { type: "rain", count: 6, spread: 3.4, stagger: 0.16 } },
});

w4dDefine("shroomwood", {
  type: SP.type, name: "뭉실이", title: "포자왕", color: "#ff9ad6", size: 3.0, r: 1.1, hp: 210, damage: 2.1, speed: 1.0, arena: 26,
  material: { id: "w4_sporeCap", name: "포자왕 갓 조각", color: "#ff9ad6" },
  theme: { floor: "#5a4a5a", moss: "#ff9ad6", wall: "#3a2e3e", darkness: 0.36, bg: "#140a16" },
  msgs: ["", "버섯돌이가 와요! 갓 데굴을 조심해요", "패드를 깔고 앉아요! 남은 패드에서 금색 화살표를 찾아요"],
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_spBounce", "w4_spCloud", "w4_spBounce"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_spCall", "w4_spBounce", "w4_spRoll", "w4_spCloud", "w4_spBounce"] },
    { until: 0, gap: 1.4, pattern: ["w4_spSit", "w4_spBounce", "w4_spRain", "w4_spRoll", "w4_spSit", "w4_spCall"] },
  ],
}, () => {}, null);

// 패드 자리: 둘레 대각선 4곳, 원래 화살표는 시계 방향(옆으로 붕)
const SP_PADS = [0.785, 2.356, 3.927, 5.498];
function spPads(b) { return w4dProps("w4_spPad", b).sort((p, q) => p.spI - q.spI); }
function spBossOf(pad) { const b = pad && pad.owner; return b && b.hp > 0 ? b : monsters.find((o) => o.type === SP.type && o.hp > 0) || null; }
hookOn("dungeonTick", (dt) => {
  const b = w4dBoss(SP.type);
  if (!b) return;
  const c = world.W / 2;
  if (!b.spInit) {
    b.spInit = true; b.spT = 0;
    SP_PADS.forEach((a, i) => { const s = w4dProp("w4_spPad", c + Math.cos(a) * 8, c + Math.sin(a) * 8, b, SP.padR); s.spI = i; s.spDX = -Math.sin(a); s.spDY = Math.cos(a); s.spAim = 0; s.spBlock = 0; });
  }
  b.spT += dt;
  for (const s of spPads(b)) {
    if (s.spBlock > 0) { s.spBlock = Math.max(0, s.spBlock - dt); s.spAim = 0; continue; }
    // 1.5초마다 번갈아: 금색(보스 쪽) ↔ 원래 쪽. 패드마다 엇갈려요
    s.spAim = Math.floor((b.spT + s.spI * 0.75) / SP.swap) % 2 === 0 ? 1 : 0;
  }
}, 40);
// 밟으면 붕 (각 기기가 자기 주인공을, 방장 기기는 친구 주인공도)
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || game.scene !== "dungeon" || p.hp <= 0) return inp;
  const t = game.time;
  if (p.w4SpFly) {
    if (t < p.w4SpFly.until) return inp;
    const F = p.w4SpFly; p.w4SpFly = null;
    if (F.boss) {
      p.hurtTimer = Math.max(p.hurtTimer || 0, SP.landInv); // 착지하며 맞지 않게
      if (!w4dGuest()) spLand(p, F);
    }
    return inp;
  }
  if (p.rollTimer > 0 || (p._w4SpUntil || 0) > t) return inp;
  for (const s of monsters) {
    if (s.type !== "w4_spPad" || s.hp <= 0 || s.spBlock > 0 || Math.hypot(p.x - s.x, p.y - s.y) > 0.45) continue;
    const b = spBossOf(s);
    let tx, ty, D, toBoss = !!(s.spAim && b);
    if (toBoss) { D = Math.hypot(b.x - s.x, b.y - s.y); tx = (b.x - s.x) / (D || 1); ty = (b.y - s.y) / (D || 1); }
    else {
      tx = s.spDX; ty = s.spDY; D = 0;
      for (let k = 0.25; k <= SP.hop + 1e-6; k += 0.25) { if (hitsWall(s.x + tx * k, s.y + ty * k, (p.r || 0.35) * 0.9)) break; D = k; }
    }
    if (D < 1) continue;
    const T = SP.hopT * Math.max(1, D / SP.hop), rs = CONFIG.player.rollSpeed;
    p.x = s.x; p.y = s.y;
    p.rollTimer = T; p.rollX = tx * D / (rs * T); p.rollY = ty * D / (rs * T);
    p.w4SpFly = { until: t + T, boss: toBoss, pad: s.spI }; p._w4SpUntil = t + T + 0.5;
    addFloatText(p.x, p.y, toBoss ? "통! 갓 위로!" : "통!", toBoss ? "#ffe27a" : "#ff9ad6", 20);
    addRing(s.x, s.y, { speed: 3, life: 0.35, hue: toBoss ? 45 : 320 });
    if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
    break;
  }
  return inp;
}, 85);
function spLand(p, F) {
  const b = monsters.find((o) => o.type === SP.type && o.hp > 0);
  if (!b || Math.hypot(p.x - b.x, p.y - b.y) > (b.r || 1) + 1.0) return;
  if (b.invuln > 0 || b.hidden) return;
  spawnBurst(b.x, b.y, ["#ff9ad6", "#ffffff", "#ffe27a"], 20);
  addRing(b.x, b.y, { speed: 5, life: 0.4, gold: true });
  damageMonster(b, b.maxHp * SP.dmgFrac, p.x, p.y, false, 0, { w4SpCap: true });
  w4dStagger(b, SP.stag, "쿵! 갓이 납작! 비틀!");
}
// 3단계: 앉을 패드 고르기 (방장 기기: 예고를 그 패드 자리로)
hookOn("castStarted", (m, id) => {
  if (!m || id !== "w4_spSit" || w4dGuest() || (typeof netplay !== "undefined" && netplay.replaying)) return;
  const c = casts.find((q) => q.m === m && q.id === "w4_spSit" && q.spPad === undefined);
  if (!c) return;
  const free = spPads(m).filter((s) => !(s.spBlock > 0));
  if (!free.length) return;
  const tgt = c.target || game.player;
  const pick = free.slice().sort((a, b2) => Math.hypot(a.x - tgt.x, a.y - tgt.y) - Math.hypot(b2.x - tgt.x, b2.y - tgt.y))[0];
  c.x = pick.x; c.y = pick.y; c.spPad = pick.spI;
}, 50);
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w4_spSit") return false;
  const m = c.m;
  const s = findFreeSpot(c.x, c.y, m.r || 1, 2) || { x: c.x, y: c.y };
  m.x = s.x; m.y = s.y;
  const pad = spPads(m).find((q) => q.spI === c.spPad);
  if (pad) { pad.spBlock = SP.blockT; pad.spAim = 0; addFloatText(pad.x, pad.y, "깔고 앉았다!", "#ff9ad6", 18); }
  spawnBurst(c.x, c.y, ["#ff9ad6", "#c86aa0", "#ffffff"], 20); spawnDust(c.x, c.y);
  game.shake = Math.max(game.shake, 0.35);
  w4dHurtIn(c, c.x, c.y, c.radius, 1.4);
  return true;
}, 15);

// ----- 그림 -----
// 패드 화살표: 금색이면 보스 쪽 (좋은 것은 금색), 아니면 분홍 원래 쪽
function spArrow(x, y, dx, dy, color, len = 0.9) {
  const a = toScreen(x, y, 0.32), b = toScreen(x + dx * len, y + dy * len, 0.32);
  const l1 = toScreen(x + dx * (len - 0.3) - dy * 0.25, y + dy * (len - 0.3) + dx * 0.25, 0.32), l2 = toScreen(x + dx * (len - 0.3) + dy * 0.25, y + dy * (len - 0.3) - dx * 0.25, 0.32);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4 * ZOOM; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.moveTo(l1.x, l1.y); ctx.lineTo(b.x, b.y); ctx.lineTo(l2.x, l2.y); ctx.stroke(); ctx.restore();
}
Object.assign(EXTRA_SHAPES, {
  // 포자왕 뭉실이: 커다란 분홍 버섯 갓(흰 점), 짧은 다리, 졸린 눈, 작은 왕관. 비틀거리면 갓이 납작해요
  w4_sporeKing(m) {
    const a = bossMotion(m), P = [], flat = a.stag ? 0.6 : 1, up = a.raise * 0.08;
    for (const sd of [1, -1]) P.push([0.02 + a.walk * sd * 0.03, sd * 0.13, 0, 0.12, 0.1, 0.1, "#e8dcc8"]);
    P.push([0, 0, 0.08, 0.3, 0.3, 0.24, "#f4ecdc"]); // 줄기 몸
    eyes(P, 0.155, 0.07, 0.22, 0.045, "#3a1030", true); // 졸린 눈
    P.push([0, 0, 0.32 + up, 0.66, 0.66, 0.16 * flat, "#ff9ad6"]); // 갓
    P.push([0, 0, 0.32 + 0.16 * flat + up, 0.5, 0.5, 0.08 * flat, "#ffb4e2"]);
    for (const [f, s] of [[0.18, 0.12], [-0.14, 0.18], [0.06, -0.2], [-0.2, -0.06], [0.22, -0.12]]) P.push([f, s, 0.32 + 0.24 * flat + up, 0.07, 0.07, 0.02, "#ffffff"]);
    P.push([0, 0, 0.32 + 0.26 * flat + up, 0.14, 0.14, 0.06, "#ffd23f"]); // 작은 왕관
    drawVoxelParts(m, P, { top: 0.7 });
  },
  // 버섯 패드: 납작한 버섯 + 화살표. 깔렸으면 납작
  w4_spPad(m) {
    const x = m.x, y = m.y, block = m.spBlock > 0, gold = m.spAim > 0 && !block;
    drawBox(x - 0.12, y - 0.12, 0, 0.24, 0.24, 0.16, "#e8dcc8");
    drawBox(x - 0.42, y - 0.42, 0.16, 0.84, 0.84, block ? 0.05 : 0.12, block ? "#8a5a78" : gold ? "#ffd23f" : "#ff9ad6");
    if (block) return;
    let dx = m.spDX, dy = m.spDY;
    if (gold) { const b = spBossOf(m); if (b) { const d = Math.hypot(b.x - x, b.y - y) || 1; dx = (b.x - x) / d; dy = (b.y - y) / d; } }
    spArrow(x, y, dx, dy, gold ? "#fff2a8" : "#ffd6f0");
  },
});
hookOn("drawTelegraphsAfter", () => {
  if (game.scene !== "dungeon") return;
  for (const s of monsters) if (s.type === "w4_spPad" && s.hp > 0 && s.spAim > 0 && !(s.spBlock > 0)) w2FloorCircle(s.x, s.y, 0.7, "rgba(255,210,63,0.15)", `rgba(255,255,255,${0.6 + 0.3 * Math.sin(game.time * 8)})`, 2.5);
}, 50);

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_spBounce: { text: "바로 옆 금색 안으로! 쿵 뒤에 공격" },
  w4_spCloud: { text: "분홍 구름 밖으로" },
  w4_spRoll: { text: "넓은 빨간 길 옆으로!" },
  w4_spCall: { text: "버섯돌이부터!" },
  w4_spSit: { text: "원 밖! 남은 패드에서 금색 화살표!", do: true, voice: true },
  w4_spRain: { text: "원 사이로 걸어가요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") Object.assign(GUIDE_PHASE_VOICE, {
  shroomwood: { 0: "버섯 패드 화살표가 금색일 때 밟으면 갓 위로 쿵!", 1: "버섯돌이가 와요! 갓 데굴을 조심해요", 2: "패드를 깔고 앉아요! 남은 패드에서 금색 화살표를 찾아요" },
});
