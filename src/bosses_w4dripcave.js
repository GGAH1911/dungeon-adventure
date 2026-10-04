// ===== 월드 4 보스 4: 거꾸로 박쥐 대롱이 (dripcave, 설계서 docs/design/world4-underworld.md 5-4) =====
// 새 아이디어: 대롱이는 천장 종유석 아래에 거꾸로 매달려 쉬어요 (칼은 안 닿고, 화살·마법은 절반).
//   바닥 금색 점선 원(종유석 그림자) 위의 종유석을 화살로 맞히면 1초 흔들리다 뚝! 대롱이가 그 아래 매달려 있으면
//   맞고 바닥으로 떨어져 4초 비틀(칼로 마구!). 종유석은 7초 뒤 다시 자라요.
//   3단계: 날개로 동굴 천장을 흔들어 다른 자리에 종유석 6개가 떨어지고(예고 원), 매달릴 종유석이 2개로 줄어요.
// 도우미(w4d…)는 네 파일 앞에 똑같이 있어요 (먼저 불린 것만 쓰여요).
// 같이 하기: 종유석 상태(stS·stT)는 소품 칸, 매달림(bkHang·bkStal)은 보스 칸이라 친구 기기에 그대로 가요.
//   화살은 친구 기기에서도 날아가지만 맞히기 판정은 방장 기기(기존 규칙).
// 환경 약속: 보스 종유석은 이 파일의 소품(w4_bkStalac)이에요. world.w4.drips 에는 넣지 않아요(그쪽은 under_env.js 의 환경 종유석).

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


const BK = { type: "w4_batKing", hang: [4, 4, 3.5], shakeT: 1.0, regrow: 7, fall: 4.0, hangZ: 0.55, near: 1.3, homes: 5, homeR: 6.2 };

Object.assign(MATERIALS, { w4_batWing: { name: "대롱이 날개막", color: "#7a4ac8" } });
if (typeof defBase === "function") {
  defBase("L_batKing", { slot: "armor", legend: "dripcave", name: "거꾸로 날개 망토", minL: 0, look: { body: "#5a3a8a", legs: "#3e2a62", helmet: "#7a4ac8", boots: "#2e1e4a", gloves: "#5a3a8a" }, perk: { speed: 0.1, roll: 0.15, hearts: 1 }, desc: "빨라지고, 구르기를 더 자주, 하트 +1" });
  Object.assign(BOSS_LEGENDS, { dripcave: "L_batKing" });
}

MONSTERS.w4_bkStalac = { name: "천장 종유석", color: "#9fb8d0", shape: "w4_bkStalac", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 4 };

Object.assign(ABILITIES, {
  w4_bkHang: { name: "거꾸로 매달리기", desc: "천장 종유석 아래로 날아가 거꾸로 매달려요. 칼은 안 닿아요! 그 종유석을 화살로 맞히면 떨어져요.", counter: "대롱이 위 종유석을 화살로 맞혀요",
    tags: ["boss", "move"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 0.6 }, cooldown: 6, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w4_bkHang" } },
  w4_bkSwoop: { name: "날개 돌진", desc: "낮게 날아 빨간 길로 휙 돌진해요.", counter: "빨간 길 옆으로! 멈춘 뒤에 때려요",
    tags: ["boss", "line", "move", "stagger"], telegraph: { shape: "line", length: 8, width: 1.6, at: "self", time: 1.2 }, cooldown: 6, range: [2, 9],
    damageMul: 1.6, anim: "crouch", staggerAfter: 1.8, effect: { type: "charge", speed: 9, stunOnWall: 1.6 } },
  w4_bkScreech: { name: "초음파", desc: "끼익! 둘레에 초음파 고리가 퍼져요. 바로 옆은 안전해요.", counter: "대롱이 바로 옆 금색 안으로 파고들거나 멀리",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 4.5, inner: 1.6, at: "self", time: 1.2 }, cooldown: 7, range: [0, 6], damageMul: 1.4, anim: "roar",
    effect: { type: "knockback", force: 1.0 } },
  w4_bkCall: { name: "동굴 박쥐 부르기", desc: "끽끽! 동굴 박쥐 셋이 날아와요.", counter: "박쥐부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w4dSummon", monster: "w4_batling", fallback: "bat", count: 3, max: 4 } },
  w4_bkVolley: { name: "박쥐 탄", desc: "매달린 채 느린 박쥐 탄 다섯 개를 부채처럼 쏴요.", counter: "탄 사이로 피하거나 옆으로 돌아요",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 6, angle: 0.9, at: "self", time: 0.8, harmlessPreview: true }, cooldown: 6, range: [0, 14],
    damageMul: 0.8, anim: "point", effect: { type: "volley", count: 5, spread: 0.9, speed: 5, color: "#b08aff" } },
  w4_bkShake: { name: "천장 흔들기", desc: "날개로 천장을 흔들어 종유석이 여러 군데 뚝뚝 떨어져요.", counter: "빨간 원 밖으로! 원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi", "sky"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.3 }, cooldown: 10, range: [0, 30], damageMul: 1.2, anim: "raise",
    effect: { type: "rain", count: 6, spread: 4.5, stagger: 0.08 } },
});

w4dDefine("dripcave", {
  type: BK.type, name: "대롱이", title: "거꾸로 박쥐", color: "#7a4ac8", size: 2.8, r: 1.0, hp: 220, damage: 2.1, speed: 1.3, arena: 26,
  material: { id: "w4_batWing", name: "대롱이 날개막", color: "#7a4ac8" },
  theme: { floor: "#5e6068", moss: "#9fb8d0", wall: "#3a3c46", darkness: 0.45, bg: "#08090e" },
  msgs: ["", "동굴 박쥐가 와요! 매달려서 탄도 쏴요", "천장을 흔들어요! 매달릴 종유석이 둘뿐이에요"],
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_bkHang", "w4_bkSwoop", "w4_bkScreech"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_bkHang", "w4_bkCall", "w4_bkSwoop", "w4_bkScreech"] },
    { until: 0, gap: 1.4, pattern: ["w4_bkHang", "w4_bkShake", "w4_bkSwoop", "w4_bkScreech", "w4_bkCall"] },
  ],
}, () => {}, (m) => { if (m.bkHang > 0) bkDrop(m); });

function bkStalacs(b) { return w4dProps("w4_bkStalac", b).sort((p, q) => p.stI - q.stI); }
function bkDrop(m) { m.bkHang = 0; m.flying = false; m.bkStal = -1; }
// 매달릴 수 있는 종유석 (3단계: 처음 둘만)
function bkHangable(b) { return bkStalacs(b).filter((s) => s.stS === 0 && (b.phaseIdx !== 2 || s.stI < 2)); }
hookOn("dungeonTick", (dt) => {
  const b = w4dBoss(BK.type);
  if (!b) return;
  const c = world.W / 2;
  if (!b.bkInit) {
    b.bkInit = true; b.bkStal = -1;
    for (let i = 0; i < BK.homes; i++) { const a = i / BK.homes * Math.PI * 2 - Math.PI / 2; const s = w4dProp("w4_bkStalac", c + Math.cos(a) * BK.homeR, c + Math.sin(a) * BK.homeR, b, 0.4); s.stI = i; s.stS = 0; s.stT = 0; }
  }
  for (const s of bkStalacs(b)) {
    if (s.stS === 1) { // 흔들흔들 → 뚝!
      s.stT -= dt;
      if (s.stT <= 0) {
        s.stS = 2; s.stT = BK.regrow;
        spawnBurst(s.x, s.y, ["#9fb8d0", "#cfd6e0", "#ffffff"], 14); spawnDust(s.x, s.y);
        if (b.bkHang > 0 && (b.bkStal === s.stI || Math.hypot(b.x - s.x, b.y - s.y) < BK.near)) {
          bkDrop(b);
          w4dStagger(b, BK.fall, "뚝! 쿵! 떨어졌다! 칼로 마구!");
          showMessage("대롱이가 떨어졌어요! 칼로 공격!", 2.2, false, "#ffe27a");
        }
      }
    } else if (s.stS === 2) { s.stT -= dt; if (s.stT <= 0) { s.stS = 0; addRing(s.x, s.y, { speed: 3, life: 0.4, hue: 210 }); } }
  }
  if (!(b.bkHang > 0)) return;
  if (b.stagger > 0 || b.invuln > 0) { bkDrop(b); return; }
  const st = bkStalacs(b).find((s) => s.stI === b.bkStal);
  if (!st || st.stS === 2) { bkDrop(b); return; }
  b.x = st.x; b.y = st.y; b.moving = false; b.flying = true;
  b.bkHang -= dt; b.bkHangT = (b.bkHangT || 0) + dt;
  // 2단계부터: 매달린 채 박쥐 탄 한 번
  if (b.phaseIdx >= 1 && !b.bkVolley && b.bkHangT > 1.5 && b.state !== "cast") { b.bkVolley = true; b.queue = ["w4_bkVolley"]; b.gap = 0; }
  else if (b.state !== "cast" && !b.queue.length) b.gap = Math.max(b.gap, 0.4);
  if (b.bkHang <= 0) { bkDrop(b); addFloatText(b.x, b.y, "푸드덕!", "#b08aff", 20); }
}, 40);
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w4_bkHang") return false;
  const m = c.m, list = bkHangable(m);
  if (!list.length) return true;
  const s = list.slice().sort((a, b2) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b2.x - m.x, b2.y - m.y))[0];
  spawnBurst(m.x, m.y, ["#7a4ac8", "#b08aff"], 12);
  m.x = s.x; m.y = s.y; m.bkStal = s.stI; m.bkHang = BK.hang[m.phaseIdx || 0]; m.bkHangT = 0; m.bkVolley = false; m.flying = true;
  addFloatText(m.x, m.y, "거꾸로 매달렸다!", "#b08aff", 20);
  return true;
}, 15);
// 3단계 천장 흔들기: 떨어지는 자리를 서로 1.6칸 넘게, 보스 종유석·주인공 바로 위는 피해서 (방장 기기)
hookOn("castStarted", (m, id) => {
  if (!m || id !== "w4_bkShake" || w4dGuest() || (typeof netplay !== "undefined" && netplay.replaying)) return;
  const subs = casts.filter((q) => q.m === m && q.id === "w4_bkShake" && !q.bkPlaced);
  const c = world.W / 2, used = [], stal = bkStalacs(m);
  for (const q of subs) {
    q.bkPlaced = true;
    for (let t = 0; t < 40; t++) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 8.5, x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      if (hitsWall(x, y, 0.5) || used.some((u) => Math.hypot(u.x - x, u.y - y) < 1.6 + 1.0 * 2) || stal.some((s) => Math.hypot(s.x - x, s.y - y) < 1.6)) continue;
      q.x = x; q.y = y; used.push({ x, y }); break;
    }
  }
}, 50);
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s) return false;
  if (s.type === "w4_bkStalac") {
    if (h.opts.dot) return true;
    if (w4dFromPlayer(h)) { if (game.time - (s.bkTxtT || -9) > 0.6) { s.bkTxtT = game.time; addFloatText(s.x, s.y, "천장이라 안 닿아요! 화살로!", "#ffb070", 14); } return true; }
    if (s.stS === 0) { s.stS = 1; s.stT = BK.shakeT; addFloatText(s.x, s.y, "흔들흔들!", "#cfd6e0", 18); if (typeof sfx !== "undefined" && sfx.click) sfx.click(); }
    return true;
  }
  if (s.type === BK.type && s.bkHang > 0 && !h.opts.dot) {
    if (w4dFromPlayer(h)) { if (game.time - (s.bkTxtT || -9) > 0.6) { s.bkTxtT = game.time; addFloatText(s.x, s.y, "닿지 않아요! 종유석을 화살로!", "#ffb070", 15); } return true; }
    h.dmg *= 0.5;
  }
  return false;
}, 4);

// ----- 그림 -----
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon") return;
  for (const s of monsters) {
    if (s.type !== "w4_bkStalac" || s.hp <= 0 || s.stS === 2) continue;
    // 종유석 그림자 = 금색 점선 원 (화살로 맞힐 곳), 흔들리면 빨간 테두리가 진해져요 (위에서 떨어지는 것은 그림자 먼저)
    const k = s.stS === 1 ? 1 - Math.max(0, s.stT) / BK.shakeT : 0;
    w2FloorCircle(s.x, s.y, 0.75, `rgba(255,210,63,${0.1 + 0.1 * k})`, s.stS === 1 ? `rgba(255,70,50,${0.35 + 0.5 * k})` : "rgba(255,210,63,0.75)", 2.5);
  }
}, 55);
Object.assign(EXTRA_SHAPES, {
  // 거꾸로 박쥐 대롱이: 보라 박쥐, 망토 같은 날개, 큰 귀, 노란 눈. 매달리면 위로 올라가 날개로 몸을 감싸요
  w4_batKing(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, hang = m.bkHang > 0, z0 = hang ? BK.hangZ : 0, up = a.raise * 0.06;
    const body = "#5a3a8a", wing = "#7a4ac8";
    if (hang) {
      P.push([0, 0, z0 + 0.1, 0.32, 0.34, 0.4, wing]); // 날개로 감싼 몸
      P.push([0, 0, z0 + 0.5, 0.12, 0.2, 0.08, "#3e2a62"]); // 발 (위)
      P.push([0.06, 0, z0, 0.22, 0.24, 0.14, body]); // 머리 (아래)
      eyes(P, 0.175, 0.06, z0 + 0.04, 0.035, "#ffd23f", a.stag);
      for (const sd of [1, -1]) P.push([0.02, sd * 0.1, z0 - 0.06, 0.06, 0.05, 0.08, body]); // 귀 (아래)
    } else {
      const flap = Math.sin(game.time * (m.moving ? 14 : 5)) * 0.06;
      for (const sd of [1, -1]) {
        P.push([-0.02, sd * 0.36, 0.3 + up + flap * sd, 0.3, 0.38, 0.04, wing]); // 날개
        P.push([-0.02, sd * 0.56, 0.26 + up - flap, 0.2, 0.12, 0.04, "#5a3a8a"]);
        P.push([0.12, sd * 0.09, 0.62 * sq, 0.06, 0.06, 0.14, body]); // 귀
      }
      P.push([0, 0, 0.08, 0.32, 0.32, 0.38 * sq, body]);
      P.push([0.08, 0, 0.16, 0.2, 0.22, 0.2, "#7a5aa8"]);
      P.push([0.1, 0, 0.42 * sq, 0.22, 0.24, 0.18, body]);
      eyes(P, 0.215, 0.06, 0.5 * sq, 0.04, "#ffd23f", a.stag);
      P.push([0.22, 0, 0.44 * sq, 0.02, 0.08, 0.03, "#ffffff", true]); // 이빨
    }
    drawVoxelParts(m, P, { top: hang ? 1.0 : 0.85 });
  },
  // 천장 종유석: 위에 매달린 회청색 뾰족 돌. 흔들리면 좌우로, 떨어지면 바닥에 부서진 조각
  w4_bkStalac(m) {
    const x = m.x, y = m.y;
    if (m.stS === 2) { drawBox(x - 0.3, y - 0.22, 0, 0.3, 0.24, 0.12, "#7a8a9a"); drawBox(x + 0.05, y - 0.05, 0, 0.22, 0.2, 0.1, "#8a9aaa"); drawBox(x - 0.1, y - 0.1, 2.9, 0.2, 0.2, 0.12, "#7a8a9a"); return; }
    const w = m.stS === 1 ? Math.sin(game.time * 40) * 0.05 : 0;
    const layers = [[0.5, 2.85, 0.2], [0.38, 2.55, 0.3], [0.26, 2.2, 0.35], [0.14, 1.85, 0.35]];
    for (const [k, z, h] of layers) drawBox(x - k / 2 + w, y - k / 2, z, k, k, h, m.stS === 1 ? "#cfd6e0" : "#9fb8d0");
  },
});

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_bkHang: { text: "위 종유석을 화살로 맞혀요!", do: true, voice: true },
  w4_bkSwoop: { text: "빨간 길 옆으로!" },
  w4_bkScreech: { text: "바로 옆 금색 안으로!", do: true },
  w4_bkCall: { text: "박쥐부터!" },
  w4_bkVolley: { text: "탄 사이로 피해요" },
  w4_bkShake: { text: "빨간 원 밖으로!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") Object.assign(GUIDE_PHASE_VOICE, {
  dripcave: { 0: "매달린 대롱이 위 종유석을 화살로 맞혀요!", 1: "동굴 박쥐가 와요! 매달려서 탄도 쏴요", 2: "천장을 흔들어요! 매달릴 종유석이 둘뿐이에요" },
});
