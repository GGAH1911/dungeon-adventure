// ===== 월드 4 보스 1: 두더지 왕 뒤적이 (glowcave, 설계서 docs/design/world4-underworld.md 5-1) =====
// 새 아이디어: 땅속으로 들어가면 흙더미만 움직여요. 흙더미가 켜진 빛 수정 3.2칸 안으로 오면 "눈부셔!" 튀어나와 3초 비틀.
//   수정은 칼·화살로 치면 9초 동안 켜져요 (다시 켜야 해요). 3단계: 숨을 때 가까운 켜진 수정 2개를 흙으로 덮어 3초 못 켜요.
// 월드 4 보스 1~4 파일(bosses_w4glowcave/shroomwood/cartmine/dripcave.js)이 같이 쓰는 도우미(w4d…)가 네 파일 앞에 똑같이 있어요.
//   먼저 불린 파일 것만 쓰여서 불리는 순서와 상관없어요 (검사 도구는 이름 순서로 읽어요).
// 같이 하기: 숨기·흙더미 자리는 보스 칸(mkDig, mkMX, mkMY), 수정 켜짐은 소품 칸(mkLit, mkBury) → 친구 기기에 그대로 가요.
//   계산은 방장 기기의 dungeonTick·resolveCast·monsterDamage 에서만. 친구 기기는 그림 단계(lights)에서 소품 값을 world.w4.crystals 에 옮겨 적어요.
// 환경 약속(w4_common.js): 아레나는 w4AddCrystal 로 자리만 놓고, 그 자리마다 이 보스 소품(w4_mkCrystal)을 세워요.
//   소품을 세운 수정 칸에는 e.bossProp = true 를 적어요 → under_env.js 는 그 칸에 자기 수정 소품을 또 세우지 않아요.

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

// ---------------- 두더지 왕 뒤적이 ----------------
const MK = { type: "w4_moleKing", litT: 9, buryT: 3, glare: 3.0, digSpeed: 2.0, digMax: 6, catchR: 0.7, popR: 1.6 };

Object.assign(MATERIALS, { w4_moleClaw: { name: "두더지 왕 발톱", color: "#c8a080" } });
if (typeof defBase === "function") { // (검사 도구는 loot.js 를 안 읽어요)
  defBase("L_moleKing", { slot: "charm", legend: "glowcave", name: "뒤적이의 광부 램프", minL: 0, icon: "amulet", color: "#ffe27a", perk: { luck: 0.15, roll: 0.1 }, desc: "행운이 오르고 구르기를 더 자주 해요 (어두운 곳을 밝혀 주는 램프)" });
  Object.assign(BOSS_LEGENDS, { glowcave: "L_moleKing" });
}

MONSTERS.w4_mkCrystal = { name: "빛 수정", color: "#9ff0ff", shape: "w4_mkCrystal", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 4 };

Object.assign(ABILITIES, {
  w4_mkSwipe: { name: "두더지 손 휘두르기", desc: "커다란 앞발로 앞을 부채꼴로 쓸어요.", counter: "부채꼴 옆이나 뒤로! 휘두른 뒤에 때려요",
    tags: ["boss", "cone", "stagger"], telegraph: { shape: "cone", length: 3, angle: 1.2, at: "self", time: 1.1 }, cooldown: 5, range: [0, 3.6],
    damageMul: 1.8, anim: "slam", staggerAfter: 1.6, effect: { type: "knockback", force: 1.3 } },
  w4_mkDig: { name: "땅속 숨기", desc: "땅속으로 쏙! 흙더미만 따라와요. 흙더미를 켜진 빛 수정 곁으로 데려가면 눈부셔서 튀어나와요.", counter: "수정을 켜고 흙더미를 수정 곁으로 데려가요",
    tags: ["boss", "move"], telegraph: { shape: "self", radius: 1.3, at: "self", time: 0.7 }, cooldown: 7, range: [0, 30], damageMul: 0, anim: "crouch",
    effect: { type: "w4_mkDig" } },
  w4_mkPop: { name: "덮치기", desc: "흙더미에서 쑥 튀어나와 덮쳐요.", counter: "흙더미 원 밖으로 걸어가요",
    tags: ["boss", "area", "ground"], telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.2 }, cooldown: 99, range: [0, 99], damageMul: 1.8, anim: "slam",
    effect: { type: "w4_mkPop" } },
  w4_mkRain: { name: "흙덩이 비", desc: "천장에서 흙덩이가 여러 군데 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.3 }, cooldown: 9, range: [0, 14], damageMul: 1.2, anim: "raise",
    effect: { type: "rain", count: 5, spread: 3.2, stagger: 0.18 } },
  w4_mkCall: { name: "꼬마 두더지 부르기", desc: "삽을 탕탕! 꼬마 두더지 둘이 나와요.", counter: "꼬마 두더지부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "w4dSummon", monster: "w4_mole", fallback: "zombie", count: 2, max: 3 } },
  w4_mkRing: { name: "흙 고리", desc: "튀어나오며 둘레에 흙 고리를 퍼뜨려요. 바로 옆은 안전해요.", counter: "뒤적이 바로 옆 금색 안으로 파고들거나 멀리",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 4.5, inner: 1.8, at: "self", time: 1.2 }, cooldown: 99, range: [0, 30], damageMul: 1.4, anim: "slam",
    effect: { type: "knockback", force: 1.0 } },
});

const W4D_MK = {
  type: MK.type, name: "뒤적이", title: "두더지 왕", color: "#8a6a4a", size: 2.8, r: 1.0, hp: 200, damage: 2.1, speed: 1.15, arena: 26,
  material: { id: "w4_moleClaw", name: "두더지 왕 발톱", color: "#c8a080" },
  theme: { floor: "#4a4036", moss: "#7fe0c0", wall: "#2e2620", darkness: 0.55, bg: "#08060a" },
  msgs: ["", "꼬마 두더지가 와요! 나올 때 흙 고리를 조심해요", "수정을 흙으로 덮어요! 남은 수정으로 데려가요"],
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_mkSwipe", "w4_mkDig", "w4_mkSwipe", "w4_mkRain"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_mkCall", "w4_mkSwipe", "w4_mkDig", "w4_mkRain", "w4_mkSwipe", "w4_mkDig"] },
    { until: 0, gap: 1.4, pattern: ["w4_mkDig", "w4_mkSwipe", "w4_mkRain", "w4_mkDig", "w4_mkCall", "w4_mkSwipe"] },
  ],
};
w4dDefine("glowcave", W4D_MK, (w) => {
  const c = w.W / 2;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; w4AddCrystal(w, c + Math.cos(a) * 8.6, c + Math.sin(a) * 8.6, true); }
}, (m) => { if (m.mkDig) mkEnd(m, false); });

function mkCrystals(b) { return w4dProps("w4_mkCrystal", b); }
// 소품 → world.w4.crystals (두 기기 모두: 방장은 dungeonTick, 친구는 lights)
function mkMirror() {
  const E = world.w4; if (!E) return;
  for (const s of monsters) {
    if (s.type !== "w4_mkCrystal" || s.hp <= 0) continue;
    const e = E.crystals[s.mkI];
    if (e) {
      e.on = s.mkLit > 0 && !(s.mkBury > 0);
      if (!e.bossProp && world.solids) world.solids = world.solids.filter((o) => !(o.w4 && Math.hypot(o.x - e.x, o.y - e.y) < 0.05)); // 친구 기기도 같게
      e.bossProp = true;
    }
  }
}
function mkStart(m, p) {
  w4dCalm(m);
  m.mkDig = true; m.mkDigT = 0; m.mkPopping = false; m.hidden = true; m.invuln = 99;
  m.mkMX = m.x; m.mkMY = m.y;
  spawnDust(m.x, m.y); spawnBurst(m.x, m.y, ["#8a6a4a", "#c8a080"], 14);
  addFloatText(m.x, m.y, "쏙!", "#c8a080", 22);
  if (m.phaseIdx === 2) { // 3단계: 가까운 켜진 수정 2개를 흙으로 덮어요
    const lit = mkCrystals(m).filter((s) => s.mkLit > 0 && !(s.mkBury > 0)).sort((a, b2) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b2.x - m.x, b2.y - m.y));
    for (const s of lit.slice(0, 2)) { s.mkLit = 0; s.mkBury = MK.buryT; spawnBurst(s.x, s.y, ["#8a6a4a", "#5a4a3a"], 10); addFloatText(s.x, s.y, "흙으로 덮었다!", "#c8a080", 15); }
    mkMirror();
  }
}
function mkEnd(m, glare) {
  casts = casts.filter((c) => !(c.m === m && c.id === "w4_mkPop"));
  const s = findFreeSpot(m.mkMX, m.mkMY, m.r || 1, 3) || { x: m.mkMX, y: m.mkMY };
  m.x = s.x; m.y = s.y;
  m.mkDig = false; m.mkPopping = false; m.hidden = false; m.invuln = 0; m.mkDigT = 0;
  spawnBurst(m.x, m.y, ["#8a6a4a", "#c8a080", "#ffffff"], 18); spawnDust(m.x, m.y);
  if (glare) { w4dStagger(m, MK.glare, "눈부셔! 비틀!"); showMessage("눈부셔서 튀어나왔어요! 지금 공격!", 2, false, "#9ff0ff"); }
  else if (m.phaseIdx >= 1) { m.queue = ["w4_mkRing"]; m.gap = 0; } // 2단계부터: 나오며 흙 고리
}
hookOn("dungeonTick", (dt) => {
  const b = w4dBoss(MK.type);
  if (!b) return;
  const E = w4Env(world);
  if (!b.mkInit) { // 수정 소품 세우기 (아레나가 놓은 자리마다)
    b.mkInit = true;
    E.crystals.forEach((e, i) => {
      if (e.prop) return;
      // 환경 파일(under_env.js)이 수정 자리에 세운 막힘은 지워요: 보스 수정은 소품 몬스터라 따로 부딪히고, 땅속 흙더미는 수정에 안 막혀야 해요
      if (world.solids) world.solids = world.solids.filter((o) => !(o.w4 && Math.hypot(o.x - e.x, o.y - e.y) < 0.05));
      const s = w4dProp("w4_mkCrystal", e.x, e.y, b, 0.45);
      s.mkI = i; s.mkLit = e.on ? MK.litT : 0; s.mkBury = 0;
      e.x = s.x; e.y = s.y; e.prop = true; e.bossProp = true;
    });
  }
  for (const s of mkCrystals(b)) {
    if (s.mkLit > 0) s.mkLit = Math.max(0, s.mkLit - dt);
    if (s.mkBury > 0) s.mkBury = Math.max(0, s.mkBury - dt);
  }
  mkMirror();
  if (!b.mkDig) return;
  if (!b.hidden) { mkEnd(b, false); return; } // 단계가 바뀌어 나왔어요
  b.mkDigT += dt; b.invuln = 99; b.moving = false;
  // 흙더미가 켜진 수정 곁이면: 눈부셔!
  if (w4Lit(b.mkMX, b.mkMY)) { mkEnd(b, true); return; }
  if (!b.mkPopping) {
    const ps = alivePlayers(); let t = null, best = 1e9;
    for (const q of ps) { const d = Math.hypot(q.x - b.mkMX, q.y - b.mkMY); if (d < best) { best = d; t = q; } }
    if (t && best > 0.05) {
      const mv = { x: b.mkMX, y: b.mkMY, r: 0.5 }, k = Math.min(best, MK.digSpeed * dt);
      // 땅속 흙더미는 벽에만 막혀요 (수정·소품·장식 돌 밑으로는 지나가요)
      const sol = world.solids; world.solids = [];
      try { moveEntity(mv, (t.x - mv.x) / best * k, (t.y - mv.y) / best * k); } finally { world.solids = sol; }
      b.mkMX = mv.x; b.mkMY = mv.y;
    }
    if (Math.random() < dt * 10) spawnDust(b.mkMX, b.mkMY);
    if ((t && best < MK.catchR) || b.mkDigT >= MK.digMax) { b.mkPopping = true; w4dCastAt(b, "w4_mkPop", b.mkMX, b.mkMY); if (typeof sfx !== "undefined" && sfx.fuse) sfx.fuse(); }
  } else if (!casts.some((c) => c.m === b && c.id === "w4_mkPop")) mkEnd(b, false); // 예고가 사라졌어요
  if (b.mkDigT > MK.digMax + 6) mkEnd(b, false);
}, 40);
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w4_mkCrystal") return false;
  if (h.opts.dot) return true;
  if (s.mkBury > 0) { addFloatText(s.x, s.y, "흙에 덮였어요!", "#c8a080", 14); return true; }
  if (!(s.mkLit > 0)) { addFloatText(s.x, s.y, "반짝!", "#9ff0ff", 20); addRing(s.x, s.y, { speed: 4, life: 0.4, hue: 185 }); if (typeof sfx !== "undefined" && sfx.zap) sfx.zap(); }
  s.mkLit = MK.litT;
  mkMirror();
  return true;
}, 4);
hookOn("resolveCast", (c) => {
  const e = c.ab.effect, m = c.m;
  if (e.type === "w4_mkDig") { mkStart(m, c.target); return true; }
  if (e.type === "w4_mkPop") {
    addRing(c.x, c.y, { speed: 6, life: 0.35, hue: 30 }); spawnDust(c.x, c.y);
    w4dHurtIn(c, c.x, c.y, c.radius, 1.4);
    if (m.mkDig) { m.mkMX = c.x; m.mkMY = c.y; mkEnd(m, false); }
    return true;
  }
  return false;
}, 15);

// ----- 그림 -----
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon") return;
  for (const m of monsters) {
    if (m.type !== MK.type || !m.mkDig || !m.hidden || m.hp <= 0 || typeof m.mkMX !== "number") continue;
    // 흙더미 (흔들흔들) + 켜진 수정 곁이면 금색 테두리 쪽으로 데려가라는 안내
    const x = m.mkMX, y = m.mkMY, w = Math.sin(game.time * 14) * 0.04;
    drawBox(x - 0.55, y - 0.55, 0, 1.1, 1.1, 0.16, "#6a5040");
    drawBox(x - 0.36 + w, y - 0.36, 0.16, 0.72, 0.72, 0.18, "#8a6a4a");
    drawBox(x - 0.18, y - 0.18, 0.34, 0.36, 0.36, 0.12, "#a8886a");
  }
}, 55);
hookOn("lights", (lights) => {
  mkMirror(); // 친구 기기도 소품 값으로 수정 켜짐을 맞춰요
  for (const s of monsters) if (s.type === "w4_mkCrystal" && s.hp > 0 && s.mkLit > 0 && !(s.mkBury > 0)) lights.push({ x: s.x, y: s.y, radius: W4.litR, power: 0.75, color: "#9ff0ff" });
}, 61);
hookOn("drawTelegraphsAfter", () => {
  if (game.scene !== "dungeon") return;
  for (const s of monsters) {
    if (s.type !== "w4_mkCrystal" || s.hp <= 0 || !(s.mkLit > 0) || s.mkBury > 0) continue;
    const k = Math.min(1, s.mkLit / 3);
    w2FloorCircle(s.x, s.y, W4.litR, `rgba(255,226,122,${0.05 * k})`, `rgba(255,226,122,${0.25 + 0.3 * k})`, 2); // 좋은 자리는 금색
  }
}, 50);

Object.assign(EXTRA_SHAPES, {
  // 두더지 왕 뒤적이: 통통한 갈색 몸, 분홍 코, 큰 손(삽 발톱), 금 왕관 + 이마 광부 램프 (숨으면 안 그려요)
  w4_moleKing(m) {
    if (m.hidden) return;
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, up = a.raise * 0.06;
    const body = "#8a6a4a", lt = "#a8886a";
    for (const sd of [1, -1]) {
      P.push([0.05, sd * 0.2, 0, 0.14, 0.12, 0.08, "#5a4030"]);
      P.push([0.24, sd * 0.28, 0.12 + up + a.walk * sd * 0.02, 0.16, 0.18, 0.08, "#c8a080"]); // 큰 손
      for (const f of [-0.05, 0, 0.05]) P.push([0.33, sd * 0.28 + f, 0.12 + up, 0.04, 0.03, 0.03, "#fff6e0"]); // 발톱
    }
    P.push([-0.04, 0, 0.04, 0.52, 0.48, 0.38 * sq, body]);
    P.push([0.08, 0, 0.06, 0.36, 0.38, 0.2, lt]);
    P.push([0.22, 0, 0.22 + up, 0.22, 0.3, 0.2 * sq, lt]);
    P.push([0.34, 0, 0.28 + up, 0.06, 0.1, 0.08, "#ff9ab8"]); // 분홍 코
    eyes(P, 0.33, 0.08, 0.36 + up, 0.04, "#1a1010", a.stag);
    P.push([0.02, 0, 0.44 * sq, 0.22, 0.24, 0.06, "#ffd23f"]); // 왕관
    for (const s of [-0.08, 0, 0.08]) P.push([0.02, s, 0.5 * sq, 0.03, 0.03, 0.06, "#ffd23f"]);
    P.push([0.15, 0, 0.42 * sq, 0.06, 0.08, 0.06, "#fff6c0", true]); // 광부 램프
    drawVoxelParts(m, P, { top: 0.68 });
  },
  // 빛 수정: 받침 바위 + 수정 세 개. 켜지면 밝은 하늘색, 꺼지면 어두운 회청색, 흙에 덮이면 흙 더미
  w4_mkCrystal(m) {
    const x = m.x, y = m.y, on = m.mkLit > 0 && !(m.mkBury > 0);
    drawBox(x - 0.32, y - 0.32, 0, 0.64, 0.64, 0.14, "#4a4036");
    const col = on ? "#9ff0ff" : "#4a6a7a", tip = on ? "#e6fbff" : "#6a8a9a";
    drawBox(x - 0.12, y - 0.12, 0.14, 0.24, 0.24, 0.62, col);
    drawBox(x - 0.07, y - 0.07, 0.76, 0.14, 0.14, 0.14, tip);
    drawBox(x + 0.1, y - 0.2, 0.14, 0.14, 0.14, 0.34, col);
    drawBox(x - 0.24, y + 0.06, 0.14, 0.14, 0.14, 0.28, col);
    if (m.mkBury > 0) { drawBox(x - 0.36, y - 0.36, 0.14, 0.72, 0.72, 0.42, "#6a5040"); drawBox(x - 0.24, y - 0.24, 0.56, 0.48, 0.48, 0.2, "#8a6a4a"); }
    if (on && Math.random() < 0.15) addSparkle(x, y, 0.5 + Math.random() * 0.4, { vz: 0.8, life: 0.5, size: 0.45, hue: 185 });
  },
});

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_mkSwipe: { text: "부채꼴 옆으로! 뒤에 공격" },
  w4_mkDig: { text: "흙더미를 켜진 수정 곁으로!", do: true, voice: true },
  w4_mkPop: { text: "흙더미 원 밖으로!" },
  w4_mkRain: { text: "원 사이로 걸어가요" },
  w4_mkCall: { text: "꼬마 두더지부터!" },
  w4_mkRing: { text: "바로 옆 금색 안으로!", do: true },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") Object.assign(GUIDE_PHASE_VOICE, {
  glowcave: { 0: "수정을 치면 반짝! 흙더미를 켜진 수정 곁으로 데려가요", 1: "꼬마 두더지가 와요! 나올 때 흙 고리를 조심해요", 2: "수정을 흙으로 덮어요! 남은 수정으로 데려가요" },
});
