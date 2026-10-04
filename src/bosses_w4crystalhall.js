// ===== 월드 4 보스 6: 수정 골렘 반짝돌이 (crystalhall) — 설계서 docs/design/world4-underworld.md 5-6 =====
// 새 아이디어: 반짝돌이의 레이저가 나를 따라오다 멈춰요. 아레나의 수정 거울 4개 뒤 금색 칸에 서 있으면
//   레이저가 거울에 맞아 반짝돌이에게 튕겨 4초 비틀 + 4%! 거울은 두 번 튕기면 금이 가서 10초 쉬어요 (쉬는 거울은 레이저를 못 막아요).
//   레이저는 거울에서 끊겨요: 거울 뒤는 안전해요. 3단계엔 레이저가 두 줄(V자), 지나간 자리에 반짝 줄이 1초 남아요.
// 같이 하기: 거울은 소품 몬스터(맞은 수·쉬는 시간 칸)라 친구 화면에 그대로 가요. 튕김 그림은 보스 칸(cgRef*). 계산은 방장만.

// ----- 월드 4 보스 5~8 공용 도우미 (네 파일이 같은 것을 가져요. 먼저 읽힌 파일 것을 써요: 읽는 순서가 바뀌어도 괜찮게) -----
var W4E = (typeof W4E === "object" && W4E) || {};
if (!W4E.make) Object.assign(W4E, {
  stagK: () => (typeof W4 !== "undefined" ? W4.stagK() : 1),
  // 부르는 몬스터: 월드 4 몬스터가 아직 없거나 임시(under.js)면 비슷한 것으로
  mon: (id, fb) => (MONSTERS[id] && !MONSTERS[id].w4Placeholder ? id : fb),
  // 계산: 방장의 지금 보스 (보스방 + 탑 보스 층) / 그림: 친구 기기도 몬스터 목록에서
  boss(type) { const b = typeof w4BossNow === "function" ? w4BossNow() : null; return b && b.type === type && b.hp > 0 ? b : null; },
  seen: (type) => monsters.find((o) => o.type === type && o.hp > 0) || null,
  props: (type) => monsters.filter((o) => o.type === type && o.hp > 0),
  guest: () => typeof netGuest === "function" && netGuest(),
  calm(b, gap = 1.0) { casts = casts.filter((c) => c.m !== b); b.charge = null; b.state = "chase"; b.queue = []; b.gap = Math.max(b.gap || 0, gap); },
  stun(b, t, frac, text, color = "#ffe27a") {
    W4E.calm(b, 0.5);
    if (frac) damageMonster(b, b.maxHp * frac, b.x, b.y, false, 0, { w4Prop: true });
    b.stagger = Math.max(b.stagger || 0, t * W4E.stagK());
    addFloatText(b.x, b.y, text, color, 26);
    game.shake = Math.max(game.shake, 0.45);
    if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
  },
  ring(x, y, r, color, w = 2.5, z = 0.03) {
    const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push(toScreen(x + Math.cos(t) * r, y + Math.sin(t) * r, z)); }
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
  },
  disc(x, y, r, fill, z = 0.02) {
    const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push(toScreen(x + Math.cos(t) * r, y + Math.sin(t) * r, z)); }
    ctx.save(); ctx.fillStyle = fill; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fill(); ctx.restore();
  },
  // 기술 하나를 복사해 이름만 바꿔요 (없으면 대신 정의)
  copy(id, over, fallback) { const a = ABILITIES[id] || fallback; return { ...a, ...over, telegraph: { ...a.telegraph, ...(over.telegraph || {}) }, effect: { ...a.effect, ...(over.effect || {}) } }; },
  make(o) {
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
        m.onPhase = (idx) => o.onPhase && o.onPhase(m, idx);
        return m;
      },
    };
  },
});

const CG = { type: "w4_crystalGolem", mirror: "w4_mirror", mirrorR: 0.6, spots: [[-6, -5], [6, -5], [-6, 5], [6, 5]], gold: 1.1, goldR: 1.2,
  stun: 4, frac: 0.04, hitsToRest: 2, rest: 10, twin: 0.5 };

// ----- 부품·전설 (8-3) -----
Object.assign(MATERIALS, { w4_crystalCore: { name: "반짝돌이 수정 핵", color: "#c8a8ff" } });
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") {
  defBase("L_crystalGolem", { slot: "armor", legend: "crystalhall", name: "수정 거울 방패", minL: 0, look: { body: "#8a7ad0", legs: "#6a5ab0", helmet: "#c8a8ff", boots: "#4a3a8a", gloves: "#9fe8ff" }, perk: { block: 0.15, hearts: 2 }, desc: "잘 막고, 하트 +2" });
  BOSS_LEGENDS.crystalhall = "L_crystalGolem";
}

// ----- 소품: 수정 거울 (못 때려요, 길을 막아요) -----
MONSTERS[CG.mirror] = { name: "수정 거울", color: "#c8e8ff", shape: CG.mirror, behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true, world: 4, codexSkip: true };
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push(CG.mirror);
if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add(CG.mirror);

// ----- 기술 -----
const CG_BUG = W4E.mon("w4_crystalbug", "spider");
const CG_BEAM = { tags: ["boss", "line", "follow"], telegraph: { shape: "line", length: 14, width: 1.2, at: "self", time: 2.2, follow: true }, cooldown: 7, range: [0, 16], damageMul: 2.0, anim: "staff" };
Object.assign(ABILITIES, {
  w4_cgBeam: { ...CG_BEAM, name: "수정 레이저", desc: "가슴 핵에서 굵은 레이저! 나를 따라오다 멈춰요. 거울에 맞으면 거기서 끊기고, 거울 뒤 금색 칸에 서 있으면 튕겨 돌아가요.", counter: "거울 뒤 금색 칸으로! 멈추면 옆으로",
    effect: { type: "w4_cgLaser" } },
  w4_cgBeam2: { ...CG_BEAM, name: "수정 레이저 두 줄", desc: "레이저가 V자로 두 줄! 거울 뒤로 숨어요.", counter: "거울 뒤 금색 칸으로",
    effect: { type: "w4_cgLaser", trail: true } },
  w4_cgSmash: { name: "수정 주먹 쾅", desc: "수정 주먹으로 앞을 쾅! 그 뒤 숨을 골라요.", counter: "빨간 원 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.2, at: "front", offset: 1.8, time: 1.25 },
    cooldown: 5, range: [0, 3.8], damageMul: 2.1, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.4 } },
  w4_cgShards: { name: "수정 조각 비", desc: "천장에서 수정 조각이 여러 군데 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.25 },
    cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 3.6, stagger: 0.18 } },
  w4_cgSpikes: W4E.copy("groundSpikes", { name: "수정 가시 줄", desc: "땅에서 수정 가시가 한 줄로 솟아요.", counter: "가시 줄 옆으로 비켜요",
    tags: ["boss", "line", "area"], telegraph: { time: 1.0, length: 8 }, cooldown: 7, range: [1, 8] }, ABILITIES.groundSpikes),
  w4_cgBugs: { name: "수정 딱정벌레 부르기", desc: "반짝! 수정 딱정벌레 둘을 불러요.", counter: "딱정벌레를 먼저 잡아요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: CG_BUG, count: 2 } },
});

W4E.make({ mapId: "crystalhall", type: CG.type, name: "반짝돌이", title: "수정 골렘", color: "#b08aff", size: 3.2, r: 1.1, hp: 240, damage: 2.5, speed: 0.95, arena: 28,
  material: { id: "w4_crystalCore", name: "반짝돌이 수정 핵", color: "#c8a8ff" },
  theme: { floor: "#3a3458", moss: "#b08aff", wall: "#241e3a", darkness: 0.6, bg: "#06040e" },
  build(w) { const c = w.W / 2; for (const [ox, oy] of CG.spots) w4AddCrystal(w, c + ox * 1.25, c + oy * 0.6, true); },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_cgBeam", "w4_cgSmash", "w4_cgShards", "w4_cgBeam"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_cgBugs", "w4_cgBeam", "w4_cgSpikes", "w4_cgSmash", "w4_cgBeam"] },
    { until: 0, gap: 1.4, pattern: ["w4_cgBeam2", "w4_cgSmash", "w4_cgSpikes", "w4_cgBeam2", "w4_cgShards"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) showMessage("수정 딱정벌레! 레이저는 거울 뒤 금색 칸으로", 2.6, false, "#c8a8ff");
    if (idx === 2) showMessage("레이저가 두 줄! 거울 뒤로 숨어요", 3, false, "#c8a8ff");
  } });

// ----- 거울 -----
function cgMirrors() { return W4E.props(CG.mirror); }
function cgReady(o) { return !(o.cgRest > 0); }
// 거울 뒤 금색 칸 (보스 반대쪽)
function cgGoldSpot(o, b) { const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy) || 1; return { x: o.x + dx / d * CG.gold, y: o.y + dy / d * CG.gold }; }
hookOn("dungeonTick", (dt) => {
  const b = W4E.boss(CG.type);
  if (!b) return;
  if (!b.cgInit) {
    b.cgInit = true;
    const c = world.W / 2;
    for (const [ox, oy] of CG.spots) {
      const s = spawnProp(CG.mirror, c + ox, c + oy, b);
      s.r = CG.mirrorR; s.cgHits = 0; s.cgRest = 0;
      const so = world.solids.find((q) => q.prop === s); if (so) so.r = CG.mirrorR;
    }
  }
  for (const o of cgMirrors()) if (o.cgRest > 0) { o.cgRest -= dt; if (o.cgRest <= 0) { o.cgRest = 0; o.cgHits = 0; addRing(o.x, o.y, { speed: 3, life: 0.4, hue: 270 }); addFloatText(o.x, o.y, "반짝! 다시 쨍", "#c8e8ff", 16); } }
  if (b.cgRefT > 0) b.cgRefT -= dt;
}, 40);

// 3단계 두 줄: 예고가 시작되면 짝 예고를 하나 더 (방장만), 그리면서 V자로 벌려요
hookOn("castStarted", (m, id) => {
  if (id !== "w4_cgBeam2" || !m || m.type !== CG.type || W4E.guest() || (typeof netplay !== "undefined" && netplay.replaying)) return;
  const c = casts.find((q) => q.m === m && q.id === id && !q.cgTwin); if (!c) return;
  const t = makeCast(m, c.ab, id, c.target || nearestPlayer(m.x, m.y), c.time, c.tune);
  t.cgTwin = true; t.lockAt = c.lockAt; casts.push(t);
}, 50);
hookOn("abilitiesUpdated", () => {
  for (const c of casts) {
    if (c.id !== "w4_cgBeam2" || !c.m || c.m.type !== CG.type) continue; // 반짝돌이만 V자 (다른 몬스터가 쓰면 한 줄)
    // 따라오는 동안은 바로 위 updateAbilities 가 dir 을 주인공 쪽으로 다시 맞춰요: 그 값을 바탕(cgB)으로 삼고, 멈춘 뒤엔 바탕을 그대로 둬요
    if (c.t < (c.lockAt ?? c.time * 0.6) || c.cgBX === undefined) { c.cgBX = c.dirX; c.cgBY = c.dirY; }
    const a = Math.atan2(c.cgBY, c.cgBX) + (c.cgTwin ? -CG.twin : CG.twin);
    c.dirX = Math.cos(a); c.dirY = Math.sin(a);
  }
}, 50);

// 레이저: 거울에서 끊기고, 금색 칸에 주인공이 있으면 튕겨요
function cgBeamHit(c) {
  const b = c.m, half = c.width / 2;
  let stop = c.length, hitMirror = null;
  for (const o of cgMirrors()) {
    if (!cgReady(o)) continue;
    const dx = o.x - c.x, dy = o.y - c.y, along = dx * c.dirX + dy * c.dirY, perp = Math.abs(-dx * c.dirY + dy * c.dirX);
    if (along > 0 && along < stop && perp <= o.r + half) { stop = along - o.r * 0.5; hitMirror = o; }
  }
  return { stop: Math.max(0.5, stop), mirror: hitMirror, half, b };
}
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w4_cgLaser") return false;
  const b = c.m; if (!b || b.hp <= 0) return true;
  const { stop, mirror, half } = cgBeamHit(c);
  const dmg = abilityDamage(c);
  // 레이저 그림 (끊긴 길이만큼)
  const L0 = c.length; c.length = stop; lineBurst(c, "#e0c8ff"); c.length = L0;
  game.shake = Math.max(game.shake, 0.25);
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    const dx = p.x - c.x, dy = p.y - c.y, along = dx * c.dirX + dy * c.dirY, perp = Math.abs(-dx * c.dirY + dy * c.dirX);
    if (along < -0.3 || along > stop || perp > half + (p.r || 0.35) * 0.6) continue;
    if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); continue; }
    hurtPlayer(p, dmg, b);
  }
  // 3단계: 지나간 자리에 반짝 줄 1초
  if (c.ab.effect.trail) for (let d = 1; d < stop; d += 1.6) zones.push({ x: c.x + c.dirX * d, y: c.y + c.dirY * d, radius: 0.55, life: 1, max: 1, tick: 0.5, tickT: 0.3, damage: dmg * 0.2, kind: "fire" });
  if (!mirror) return true;
  spawnBurst(mirror.x, mirror.y, ["#e0c8ff", "#ffffff"], 10);
  const g = cgGoldSpot(mirror, b);
  const keeper = allPlayers().find((p) => p && p.hp > 0 && Math.hypot(p.x - g.x, p.y - g.y) < CG.goldR);
  if (!keeper) { addFloatText(mirror.x, mirror.y, "쨍! 막았어요", "#c8e8ff", 16); return true; }
  // 튕김!
  b.cgRefX = mirror.x; b.cgRefY = mirror.y; b.cgRefT = 0.4;
  mirror.cgHits = (mirror.cgHits || 0) + 1;
  if (mirror.cgHits >= CG.hitsToRest) { mirror.cgRest = CG.rest; addFloatText(mirror.x, mirror.y, "쩍! 금이 갔어요", "#c8e8ff", 18); }
  if (b.invuln > 0) return true;
  W4E.stun(b, CG.stun, CG.frac, "번쩍! 눈부셔!", "#e0c8ff");
  return true;
}, 15);

// ----- 그리기: 금색 칸, 튕김 줄 -----
hookOn("drawFloor", () => {
  const b = W4E.seen(CG.type);
  if (!b || game.scene !== "dungeon") return;
  for (const o of monsters) {
    if (o.type !== CG.mirror || o.hp <= 0 || !cgReady(o)) continue;
    const g = cgGoldSpot(o, b);
    W4E.disc(g.x, g.y, CG.goldR * 0.85, "rgba(255,210,63,0.18)");
    W4E.ring(g.x, g.y, CG.goldR * 0.85, `rgba(255,226,122,${0.6 + 0.3 * Math.sin(game.time * 5)})`, 2.5);
  }
}, 50);
hookOn("worldThings", (things) => {
  const b = W4E.seen(CG.type);
  if (!b || !(b.cgRefT > 0)) return;
  things.push({ depth: b.x + b.y + 2, x: b.x, y: b.y, draw: () => {
    const a = toScreen(b.cgRefX, b.cgRefY, 0.9), z = toScreen(b.x, b.y, 1.2);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,226,122,0.95)"; ctx.lineWidth = 8 * ZOOM; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(z.x, z.y); ctx.stroke(); ctx.restore();
  } });
}, 50);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 수정 골렘 반짝돌이: 보라·하늘 수정 덩어리 몸, 어깨 수정 뿔, 가슴에 빛나는 핵
  w4_crystalGolem(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.9 : 1, up = a.raise * 0.1, v = "#8a6ad0", sky = "#9fe8ff", dk = "#5a4a9a";
    for (const sd of [1, -1]) P.push([0.02 + a.walk * sd * 0.05, sd * 0.13, 0, 0.14, 0.12, 0.18, dk]);
    P.push([0, 0, 0.18, 0.4, 0.44, 0.34 * sq, v]);
    P.push([0.21, 0, 0.32 * sq, 0.03, 0.14, 0.14, "#ffffff", true], [0.22, 0, 0.34 * sq, 0.02, 0.08, 0.08, "#e0c8ff", true]); // 핵
    P.push([0.02, 0, 0.52 * sq, 0.28, 0.28, 0.2, sky]);
    eyes(P, 0.165, 0.07, 0.6 * sq, 0.045, "#3a2a7a", a.stag);
    for (const sd of [1, -1]) {
      P.push([0.0, sd * 0.28, 0.42 + up, 0.16, 0.14, 0.16, sky]);
      P.push([0.06 + up * 0.3, sd * 0.32, 0.24 + up * 2, 0.16, 0.14, 0.18, v]);
      P.push([-0.04, sd * 0.24, 0.56 * sq, 0.06, 0.06, 0.18, "#c8a8ff"]); // 어깨 수정 뿔
    }
    P.push([-0.06, 0, 0.72 * sq, 0.06, 0.06, 0.16, "#e0c8ff"]);
    drawVoxelParts(m, P, { top: 0.88 });
  },
  w4_mirror(m) {
    const x = m.x, y = m.y, rest = m.cgRest > 0;
    drawBox(x - 0.35, y - 0.35, 0, 0.7, 0.7, 0.16, "#4a3a6a");
    drawBox(x - 0.28, y - 0.06, 0.16, 0.56, 0.12, 1.2, rest ? "#6a6a8a" : "#c8e8ff");
    drawBox(x - 0.2, y - 0.07, 0.3, 0.4, 0.02, 0.9, rest ? "#8a8aa8" : "#ffffff");
    if (rest) drawBox(x - 0.02, y - 0.08, 0.3, 0.04, 0.02, 0.9, "#2a2a3a");
    else if (Math.sin(game.time * 4 + x) > 0.8) { const s = toScreen(x, y, 1.3); drawStar(s.x, s.y, 5 * ZOOM, "#ffffff"); }
  },
});

// ----- 안내 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_cgBeam: { text: "거울 뒤 금색 칸으로! 레이저가 튕겨요", do: true, voice: true },
  w4_cgBeam2: { text: "두 줄! 거울 뒤로", do: true },
  w4_cgSmash: { text: "원 밖으로! 숨 고를 때 공격" },
  w4_cgShards: { text: "원 사이로 걸어가요" },
  w4_cgSpikes: { text: "가시 줄 옆으로" },
  w4_cgBugs: { text: "딱정벌레부터 잡아요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.crystalhall = { 0: "레이저가 오면 거울 뒤 금색 칸에 서요!", 1: "딱정벌레를 먼저 잡아요", 2: "레이저 두 줄! 거울 뒤로" };
