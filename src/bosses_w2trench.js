// ===== 월드 2 보스 4: 등불 아귀 초롱이 (깜깜 해구, 설계서 docs/design/world2-ocean.md 5-4) =====
// 새 아이디어: 빛과 어둠. 보스는 어둠에 숨어요(눈·등불 구슬은 늘 보여요).
//   산호 등불(w2_lamp)을 공격(칼·화살·마법)이나 E 로 켜면 보스가 보여요.
//   보스가 등불 4칸 안에 있을 때 켜면 "눈부셔!" -> 비틀거려요 (때릴 시간).
//   작은 불빛(미끼)은 함정: 미끼가 다가온 자리로 아귀가 덥석! 3단계엔 미끼 셋 중 줄로 이어진 것만 진짜.
//   후~ 불 끄기는 때려서 끊을 수 있어요.
//
// ----- 다른 보스가 다시 쓸 수 있는 것 (마지막 보스 바다 용왕) -----
//   기술 id: w2_lureDance, w2_lureSwarm, w2_lureBite, w2_darkBite, w2_glowSpores, w2_lampSnuff (+ w2_anglerCall)
//   소품: MONSTERS.w2_lamp  (lamp.lit 켜짐 / lamp.trLitT 남은 시간 / lamp.trCdT 다시 켜기 대기, 모두 몬스터 칸이라 친구 화면에도 보여요)
//   trLampsAround(m, cx, cy, spots, litCount)  -> 등불 배열. spots = [[dx, dy], ...] (cx, cy 기준), 앞의 litCount 개는 켜진 채
//   trLightLamp(lamp)                           등불 켜기 (눈부셔 판정 포함)
//   trSnuffLamps(m)                             m 의 등불 모두 끄기
//   보스 칸:  m.w2LampGlare = true   켜지는 등불 4칸 안이면 눈부셔 -> m.stagger (+ m.w2GlareCore 초가 있으면 m.coreOpenT 도)
//             m.w2Dark = true        어둠에 숨기 (trDarkAlpha(m) 로 몸 알파를 구해 그려요. 눈 자리에 작은 빛)
//   효과:     "w2_lure" (count, drift, speed, bite) / "w2_snuff" / rain 의 glowAfter(초): 떨어진 자리가 잠깐 밝아요

Object.assign(MATERIALS, { w2_lampOrb: { name: "등불 구슬", color: "#ffe27a" } });

const TR = {
  lampOn: { easy: 16, normal: 12, hard: 10, nightmare: 9 },
  lampCd: 4,            // 꺼진 뒤 다시 못 켜는 시간 (깜빡이 남용 방지)
  glareR: 4,            // 켜지는 등불에서 이 칸 안이면 눈부셔
  glare: 2.5,           // 눈부셔 비틀 (난이도 배수 곱함)
  glareImm: 3,          // 눈부셔가 끝난 뒤 이만큼은 다시 눈부셔 안 돼요 (계속 묶이지 않게)
  lightR: 4,            // 켜진 등불 빛 반지름
  darkAlpha: 0.18,
  nearSee: 2.5,         // 주인공이 이만큼 가까우면 보여요
  lureSide: 2.5,
};
function trDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function trStagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[trDiff()] || 1; }

// ----- 소품: 산호 등불 -----
MONSTERS.w2_lamp = { name: "산호 등불", color: "#ffe27a", shape: "w2_lamp", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 2 };
if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add("w2_lamp"); // 도감엔 안 넣어요 (소품)

function trLampsAround(m, cx, cy, spots, litCount = 0) {
  const list = [];
  spots.forEach(([dx, dy], i) => {
    const s = spawnProp("w2_lamp", cx + dx, cy + dy, m);
    s.r = 0.45; s.lit = false; s.trLitT = 0; s.trCdT = 0;
    world.solids.push({ x: s.x, y: s.y, r: 0.4, prop: s });
    if (i < litCount) { s.lit = true; s.trLitT = TR.lampOn[trDiff()] || 12; }
    list.push(s);
  });
  return list;
}
function trLamps(owner) { return monsters.filter((o) => o.type === "w2_lamp" && o.hp > 0 && (!owner || o.owner === owner)); }
function trLightLamp(lamp) {
  if (!lamp || lamp.lit || lamp.trCdT > 0) return false;
  lamp.lit = true; lamp.trLitT = TR.lampOn[trDiff()] || 12;
  addRing(lamp.x, lamp.y, { speed: 6, life: 0.45, hue: 50 });
  for (let i = 0; i < 10; i++) addSparkle(lamp.x, lamp.y, 0.8, { vz: 1.4, life: 0.6, size: 0.5, hue: 50 });
  if (typeof sfx !== "undefined" && sfx.potion) sfx.potion();
  // 눈부셔! 켜지는 순간 곁에 있는 어둠 보스
  for (const m of monsters) {
    if (!m.w2LampGlare || m.hp <= 0 || m.invuln > 0) continue;
    if (Math.hypot(m.x - lamp.x, m.y - lamp.y) > TR.glareR + (m.r || 0)) continue;
    if ((m.trGlareImm || 0) > 0) { addFloatText(m.x, m.y, "찡긋!", "#bbbbbb", 16); continue; }
    casts = casts.filter((c) => c.m !== m); m.charge = null; m.state = "chase"; m.queue = []; m.trLure = null;
    m.stagger = TR.glare * trStagK();
    if (m.w2GlareCore) m.coreOpenT = m.w2GlareCore * trStagK();
    m.trGlareImm = m.stagger + TR.glareImm; m.trGlareFx = 0.18;
    addFloatText(m.x, m.y, "눈부셔!", "#fff6a0", 30);
    game.shake = Math.max(game.shake, 0.3);
    if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
  }
  return true;
}
function trSnuffLamps(m) {
  let n = 0;
  for (const l of trLamps(m)) if (l.lit) { l.lit = false; l.trLitT = 0; l.trCdT = TR.lampCd; n++; addRing(l.x, l.y, { speed: 3, life: 0.3, hue: 230 }); }
  return n;
}
// 공격이 맞으면 켜져요 (피해는 없어요)
hookOn("monsterDamage", (h) => {
  if (h.m.type !== "w2_lamp") return false;
  if (!h.opts.dot) trLightLamp(h.m);
  return true;
}, 12);
// 켜져 있거나 쉬는 등불은 자동 조준·맞기에서 빠져요 (꺼진 등불만 노려요)
hookOn("untargetable", (o) => o.type === "w2_lamp" && (o.lit || o.trCdT > 0), 50);
// 가까이서 E 로도 켜요
hookOn("dungeonInteractables", (list) => {
  if (!w2BossNow()) return list;
  for (const l of trLamps()) if (!l.lit && !(l.trCdT > 0)) list.push({ x: l.x, y: l.y, range: 1.8, short: "켜기", prompt: "등불 켜기", action: () => trLightLamp(l) });
  return list;
}, 50);
// 등불·눈부셔·미끼·빛 플랑크톤 시간 (방장)
hookOn("dungeonTick", (dt) => {
  for (const m of monsters) {
    if (m.type === "w2_lamp") {
      if (m.lit) { m.trLitT -= dt; if (m.trLitT <= 0) { m.lit = false; m.trLitT = 0; m.trCdT = TR.lampCd; } }
      else if (m.trCdT > 0) m.trCdT = Math.max(0, m.trCdT - dt);
      continue;
    }
    if (m.trGlareImm > 0) m.trGlareImm -= dt;
    if (m.trGlareFx > 0) m.trGlareFx -= dt;
    if (m.trGlows && m.trGlows.length) { for (const g of m.trGlows) g.t -= dt; m.trGlows = m.trGlows.filter((g) => g.t > 0); }
    if (m.trLure) trUpdateLure(m, dt);
  }
}, 43);

// ----- 어둠 속 보스 -----
function trDarkAlpha(m) {
  if (!m.w2Dark || m.hp <= 0) return 1;
  if (m.stagger > 0 || m.trGlareFx > 0) return 1;
  for (const p of allPlayers()) if (p.hp > 0 && Math.hypot(p.x - m.x, p.y - m.y) < TR.nearSee + (m.r || 0)) return 1;
  for (const l of trLamps()) if (l.lit && Math.hypot(l.x - m.x, l.y - m.y) < TR.lightR + (m.r || 0)) return 1;
  for (const g of m.trGlows || []) if (Math.hypot(g.x - m.x, g.y - m.y) < 2 + (m.r || 0)) return 1;
  return TR.darkAlpha;
}

// ----- 미끼 (w2_lure): 작은 불빛이 다가오다 그 자리로 덥석 -----
function trUpdateLure(m, dt) {
  const L = m.trLure;
  if (m.hp <= 0 || m.stagger > 0 || m.invuln > 0) { m.trLure = null; return; }
  L.t += dt;
  const p = nearestPlayer(m.x, m.y);
  for (const q of L.lures) {
    if (p && L.t < L.T) {
      const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy) || 1;
      if (d > 0.6) { q.x += dx / d * L.speed * dt + Math.cos(L.t * 3 + q.ph) * 0.4 * dt; q.y += dy / d * L.speed * dt + Math.sin(L.t * 3 + q.ph) * 0.4 * dt; }
    }
  }
  m.gap = Math.max(m.gap || 0, 0.4); // 미끼가 끝날 때까지 다른 큰 기술은 쉬어요
  if (L.t < L.T) return;
  if (m.state === "cast" || m.charge) return; // 하던 기술이 끝나면
  // 가짜는 반짝 흩어지고, 진짜 자리에만 덥석 예고
  for (const q of L.lures) if (!q.real) spawnBurst(q.x, q.y, ["#ffe27a", "#fff6c0"], 10);
  const real = L.lures.find((q) => q.real) || L.lures[0];
  m.trLure = null;
  const spot = findFreeSpot(real.x, real.y, m.r || 0.8, 2) || { x: real.x, y: real.y };
  castAbility(m, L.bite, { x: spot.x, y: spot.y });
  const c = casts.find((k) => k.m === m && k.id === L.bite);
  if (c) { c.x = spot.x; c.y = spot.y; c.follow = false; } // 기본 순간이동은 주인공 등 뒤를 골라요 -> 미끼 자리로 되돌려요
}

// ----- 기술 -----
Object.assign(ABILITIES, {
  w2_darkBite: { name: "어둠 돌진", desc: "어둠 속에서 빛나는 빨간 길을 그리고 휙 달려들어요.", counter: "빛나는 길 옆으로! 기둥에 부딪히면 때려요",
    tags: ["boss", "line", "move", "stagger"], telegraph: { shape: "line", length: 7, width: 1.4, at: "self", time: 1.1 },
    cooldown: 6, range: [2, 7], damageMul: 1.6, anim: "crouch", staggerAfter: 1.8, effect: { type: "charge", speed: 11, stunOnWall: 1.6 } },
  w2_glowSpores: { name: "빛 플랑크톤 비", desc: "빛나는 플랑크톤이 여러 군데 떨어져요. 떨어진 자리는 잠깐 밝아요.", counter: "원 사이로! 밝아진 곳에서 보스를 찾아요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.2 },
    cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 3.5, stagger: 0.18, glowAfter: 3 } },
  w2_lureDance: { name: "미끼 춤", desc: "등불 구슬이 떨어져 나와 살랑살랑 다가와요. 그 자리로 아귀가 덥석!", counter: "작은 불빛은 함정! 멀어져요",
    tags: ["boss", "lure"], telegraph: { shape: "none", at: "self", time: 0.6 }, cooldown: 10, range: [0, 14], damageMul: 0, anim: "point",
    effect: { type: "w2_lure", count: 1, drift: 2.4, speed: 0.6, bite: "w2_lureBite" } },
  w2_lureSwarm: { name: "미끼 셋", desc: "미끼 셋이 다가와요. 보스와 빛 줄로 이어진 것만 진짜예요.", counter: "줄로 이어진 불빛에서 멀어져요",
    tags: ["boss", "lure"], telegraph: { shape: "none", at: "self", time: 0.6 }, cooldown: 10, range: [0, 14], damageMul: 0, anim: "point",
    effect: { type: "w2_lure", count: 3, drift: 2.4, speed: 0.6, bite: "w2_lureBite" } },
  w2_lureBite: { name: "덥석!", desc: "미끼가 있던 자리로 순간이동해 덥석 깨물어요. 그 뒤 잠깐 멍해요.", counter: "빨간 원 밖으로! 멍할 때 때려요",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.2 },
    cooldown: 1, range: [0, 30], damageMul: 1.8, anim: "crouch", staggerAfter: 2.2, effect: { type: "teleport" } },
  w2_lampSnuff: { name: "후~ 불 끄기", desc: "크게 숨을 불어 켜진 등불을 모두 꺼요.", counter: "후~ 할 때 때리면 끊겨요!",
    tags: ["boss", "dark"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.4 }, interruptible: true, interruptAt: 0.04,
    cooldown: 14, range: [0, 30], damageMul: 0, anim: "roar", effect: { type: "w2_snuff" } },
  w2_anglerCall: { name: "꼬마 아귀 부르기", desc: "꼬마 초롱아귀 둘을 불러요.", counter: "작은 불빛 둘을 화살로",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w2_angler", count: 2 }, when: { maxSummons: 2 } },
});

// 새 효과: 미끼 놓기 · 불 끄기
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect, m = c.m;
  if (e.type === "w2_lure") {
    if (!p || p.hp <= 0) return true;
    const k = abilityTuning().telegraph;
    // 주인공 옆 (주인공과 보스 사이가 아닌 옆, 셋이면 뒤쪽도)
    const bx = p.x - m.x, by = p.y - m.y, bd = Math.hypot(bx, by) || 1, ux = bx / bd, uy = by / bd;
    const dirs = [[-uy, ux], [uy, -ux], [ux, uy]];
    const realIdx = Math.floor(Math.random() * e.count);
    const lures = [];
    for (let i = 0; i < e.count; i++) {
      const [dx, dy] = dirs[i % 3];
      const s = findFreeSpot(p.x + dx * TR.lureSide, p.y + dy * TR.lureSide, 0.3, 2) || { x: p.x + dx, y: p.y + dy };
      lures.push({ x: s.x, y: s.y, real: e.count === 1 || i === realIdx, ph: i * 2.1 });
    }
    m.trLure = { lures, t: 0, T: e.drift * k, speed: e.speed, bite: e.bite || "w2_lureBite" };
    if (typeof sfx !== "undefined" && sfx.fuse) sfx.fuse();
    return true;
  }
  if (e.type === "w2_snuff") {
    const n = trSnuffLamps(m) || trSnuffLamps(null);
    addRing(m.x, m.y, { speed: 9, life: 0.5, hue: 230 });
    addFloatText(m.x, m.y, n ? "후~! 불이 꺼졌어요" : "후~", "#9fb8ff", 22);
    return true;
  }
  return false;
}, 15);
// 빛 플랑크톤: 떨어진 자리가 잠깐 밝아요
hookOn("castResolved", (c) => {
  const g = c.ab.effect.glowAfter;
  if (!g || !c.m || c.m.hp <= 0) return;
  c.m.trGlows = c.m.trGlows || [];
  if (c.m.trGlows.length < 8) c.m.trGlows.push({ x: c.x, y: c.y, t: g });
}, 30);

// ----- 보스 -----
const TR_BOSS = { mapId: "trench", type: "w2_lanternAngler", name: "초롱이", title: "등불 아귀", shape: "w2_lanternAngler", color: "#24345e",
  size: 2.9, r: 1.05, hp: 185, damage: 1.9, speed: 1.1,
  material: { id: "w2_lampOrb", name: "등불 구슬", color: "#ffe27a" },
  arena: { size: 26, theme: { floor: "#2f3a5a", moss: "#5ff0d0", wall: "#1e2640", darkness: 0.82, bg: "#02040c" },
    build: (w) => b2Pillars(w, [[-5, -5], [5, 5], [-5, 5], [5, -5]]) },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w2_darkBite", "w2_glowSpores", "w2_lureDance", "w2_darkBite"] },
    { until: 0.33, gap: 1.6, pattern: ["w2_lureDance", "w2_lampSnuff", "w2_darkBite", "w2_glowSpores", "w2_darkBite"] },
    { until: 0, gap: 1.4, pattern: ["w2_lureSwarm", "w2_darkBite", "w2_anglerCall", "w2_glowSpores", "w2_lureSwarm", "w2_lampSnuff"] },
  ] };
const TR_LAMP_SPOTS = [[8, 0], [-8, 0], [0, 8], [0, -8]];
{
  const B = TR_BOSS;
  MONSTERS[B.type] = { name: B.name, shape: B.shape, behavior: "bossAI", color: B.color, hp: B.hp, speed: B.speed, damage: B.damage,
    xp: 45, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: B.size, world: 2 };
  const phases = B.phases.map((ph) => ({ until: ph.until, abilities: [...new Set(ph.pattern)], pattern: ph.pattern, gap: ph.gap }));
  BOSS_DEFS[B.mapId] = {
    id: B.type, name: B.name, title: B.title, size: B.size, material: B.material, arena: B.arena, phases, world: 2,
    create(x, y, level) {
      const m = createMonster(B.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[B.mapId];
      m.name = `${B.title} ${B.name}`;
      m.r = B.r; m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
      m.w2Dark = true; m.w2LampGlare = true;
      m.onPhase = (idx) => trBossPhase(m, idx);
      return m;
    },
  };
}
function trBossPhase(m, idx) {
  if (idx === 1) showMessage("후~ 불을 끄려고 하면 때려서 끊어요!", 3, false, "#ffe27a");
  if (idx === 2) showMessage("미끼 셋! 줄로 이어진 불빛을 피해요", 3, false, "#ffe27a");
}
// 첫 프레임: 등불 4개 (2개는 켜진 채)
hookOn("dungeonTick", () => {
  const m = w2BossNow();
  if (!m || m.type !== TR_BOSS.type || m.trInit) return;
  m.trInit = true;
  trLampsAround(m, world.W / 2, world.H / 2, TR_LAMP_SPOTS, 2);
  showMessage("등불을 켜서 보스를 비춰요! 곁에 있을 때 켜면 눈부셔!", 3.2, false, "#ffe27a");
}, 44);

// ----- 빛 -----
hookOn("lights", (lights) => {
  if (game.scene !== "dungeon") return;
  for (const m of monsters) {
    if (m.hp <= 0) continue;
    if (m.type === "w2_lamp") { lights.push(m.lit ? { x: m.x, y: m.y, radius: TR.lightR, power: 1 } : { x: m.x, y: m.y, radius: 0.9, power: m.trCdT > 0 ? 0.25 : 0.45 }); continue; }
    if (m.w2Dark) {
      const S = m.def.size || 1;
      lights.push({ x: m.x + m.faceX * 0.3 * S, y: m.y + m.faceY * 0.3 * S, radius: 0.9, power: 0.8 }); // 눈·등불 구슬 자리 (어디쯤 있는지는 늘 알 수 있게)
    }
    for (const g of m.trGlows || []) lights.push({ x: g.x, y: g.y, radius: 2, power: 0.7 * Math.min(1, g.t) });
    if (m.trLure) {
      for (const q of m.trLure.lures) lights.push({ x: q.x, y: q.y, radius: 1.5, power: 1 });
      // 진짜 미끼의 빛 줄 (보스와 이어진 줄도 보이게 작은 빛을 줄 위에)
      const r = m.trLure.lures.find((q) => q.real);
      if (r && m.trLure.lures.length > 1) { const d = Math.hypot(r.x - m.x, r.y - m.y), n = Math.min(8, Math.ceil(d / 1.8)); for (let i = 1; i < n; i++) lights.push({ x: m.x + (r.x - m.x) * i / n, y: m.y + (r.y - m.y) * i / n, radius: 0.7, power: 0.5 }); }
    }
  }
}, 56);

// ----- 그리기 -----
// 미끼와 빛 줄
hookOn("drawTelegraphsAfter", () => {
  for (const m of monsters) {
    if (!m.trLure || m.hp <= 0) continue;
    const L = m.trLure, S = m.def.size || 1;
    const real = L.lures.find((q) => q.real);
    if (real) {
      const a = toScreen(m.x + m.faceX * 0.33 * S, m.y + m.faceY * 0.33 * S, 0.45 * S), b = toScreen(real.x, real.y, 0.5);
      ctx.save(); ctx.strokeStyle = "rgba(255,240,150,0.85)"; ctx.lineWidth = 3 * ZOOM; ctx.setLineDash([8 * ZOOM, 6 * ZOOM]); ctx.lineDashOffset = -game.time * 30;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 30 * ZOOM, b.x, b.y); ctx.stroke(); ctx.restore();
    }
  }
}, 50);
hookOn("worldThings", (things) => {
  for (const m of monsters) {
    if (!m.trLure || m.hp <= 0) continue;
    for (const q of m.trLure.lures) things.push({ depth: q.x + q.y, x: q.x, y: q.y, draw: () => {
      const z = 0.5 + Math.sin(game.time * 4 + q.ph) * 0.12, s = 0.22 + 0.03 * Math.sin(game.time * 9 + q.ph);
      drawBox(q.x - s / 2, q.y - s / 2, z, s, s, s, "#ffe27a");
      drawBox(q.x - 0.06, q.y - 0.06, z + 0.05, 0.12, 0.12, 0.12, "#fffbe0");
    } });
  }
}, 50);

// 눈·등불 구슬처럼 늘 밝게 그릴 부품 (별·보호막 없이)
function trDrawBright(m, parts) {
  const S = m.def.size || 1, X = rigTransform(m, { scale: 1 });
  const list = parts.map((q) => ({ w: X.world(V(q[0] * S, q[1] * S, (q[2] + q[5] / 2) * S)), bw: q[3] * S, bd: q[4] * S, bh: q[5] * S, color: q[6] }));
  list.sort((a, b) => (a.w.x + a.w.y) - (b.w.x + b.w.y) || a.w.z - b.w.z);
  for (const L of list) drawBox(L.w.x - L.bw / 2, L.w.y - L.bd / 2, Math.max(0, L.w.z - L.bh / 2), L.bw, L.bd, L.bh, L.color);
}
Object.assign(EXTRA_SHAPES, {
  // 등불 아귀: 동그란 남색 몸, 밝은 배, 아주 큰 눈(노란 눈동자), 둥근 흰 이빨 3개, 이마 줄기 끝 등불 구슬. "멍한 웃음"
  w2_lanternAngler(m) {
    const a = bossMotion(m), P = [], B = [];
    const bob = 0.05 + Math.sin(a.t * 2) * 0.03, sq = a.stag ? 0.9 : 1;
    const open = m.state === "cast" && (m.castAnim === "crouch" || m.castAnim === "roar") ? 0.05 * a.k + 0.02 : 0.015;
    P.push([0, 0, bob + 0.06, 0.6, 0.56, 0.44 * sq, "#24345e"]);
    P.push([0.04, 0, bob + 0.04, 0.52, 0.48, 0.1, "#3a5a8a"]);
    P.push([0.22, 0, bob + 0.02, 0.18, 0.46, 0.08, "#2c3e6a"]); // 나온 아래턱
    P.push([-0.06, 0.31, bob + 0.2, 0.16, 0.06, 0.12, "#3a5a8a"], [-0.06, -0.31, bob + 0.2, 0.16, 0.06, 0.12, "#3a5a8a"]); // 지느러미
    const tw = Math.sin(a.t * 3) * 0.04;
    P.push([-0.34, tw, bob + 0.18, 0.1, 0.1, 0.12, "#24345e"], [-0.42, tw * 1.5, bob + 0.16, 0.06, 0.3, 0.2, "#2c3e6a"]); // 꼬리
    P.push([-0.02, 0, bob + 0.5 * sq, 0.24, 0.06, 0.08, "#2c3e6a"]); // 등 지느러미
    // 줄기
    P.push([0.12, 0, bob + 0.5 * sq, 0.04, 0.04, 0.14, "#2c3e6a"], [0.22, 0, bob + 0.62 * sq, 0.18, 0.04, 0.04, "#2c3e6a"], [0.31, 0, bob + 0.52 * sq, 0.04, 0.04, 0.1, "#2c3e6a"]);
    // 늘 밝은 것: 이빨·눈·등불 구슬 (얼굴이 뒤를 보면 몸에 가려요)
    const front = m.faceX + m.faceY > -0.5;
    for (const s of [-0.11, 0, 0.11]) B.push([0.31, s, bob + 0.1 + open, 0.05, 0.06, 0.06, "#ffffff"]);
    const sleepy = a.stag && !(m.trGlareFx > 0);
    for (const sd of [1, -1]) {
      B.push([0.3, sd * 0.13, bob + 0.26, 0.03, 0.16, sleepy ? 0.05 : 0.16, "#ffffff"]);
      B.push([0.315, sd * 0.13, bob + 0.28, 0.03, 0.08, sleepy ? 0.03 : 0.09, "#ffe27a"]);
    }
    const orb = m.trLure ? "#6a6a4a" : "#ffe27a";
    B.push([0.32, 0, bob + 0.42 * sq, 0.12, 0.12, 0.12, orb], [0.32, 0, bob + 0.44 * sq, 0.06, 0.06, 0.08, m.trLure ? "#8a8a6a" : "#fffbe0"]);
    drawVoxelParts(m, P, { alpha: trDarkAlpha(m), top: 0.85 });
    trDrawBright(m, front ? B : B.slice(-2));
    if (m.trGlareFx > 0) { // 눈부셔: 하얀 테두리 한 번 (깜빡임 아님)
      const S = m.def.size || 1, c = toScreen(m.x, m.y, 0.4 * S);
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 5 * ZOOM;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, 0.5 * TILE_W * S, 0.55 * TILE_H * 1.6 * S, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  },
  // 산호 등불: 꺼지면 어두운 산호 덩이, 켜지면 노란 빛 구슬
  w2_lamp(m) {
    const x = m.x, y = m.y, lit = m.lit, rest = m.trCdT > 0;
    drawBox(x - 0.32, y - 0.32, 0, 0.64, 0.64, 0.22, "#3a4a6a");
    drawBox(x - 0.22, y - 0.2, 0.22, 0.16, 0.16, 0.36, "#4a5a8a"); drawBox(x + 0.06, y - 0.06, 0.22, 0.14, 0.14, 0.28, "#5a6a9a"); drawBox(x - 0.08, y + 0.1, 0.22, 0.12, 0.12, 0.42, "#4a5a8a");
    const pulse = lit ? 0.04 * Math.sin(game.time * 5) : 0;
    const col = lit ? "#ffe27a" : rest ? "#3a3f55" : "#7a86a8";
    drawBox(x - 0.17 - pulse, y - 0.17 - pulse, 0.6, 0.34 + pulse * 2, 0.34 + pulse * 2, 0.32 + pulse * 2, col);
    if (lit) drawBox(x - 0.08, y - 0.08, 0.7, 0.16, 0.16, 0.16, "#fffbe0");
    else if (!rest) { const s = toScreen(x, y, 1.3); text("!", s.x, s.y, 16 * ZOOM, "rgba(255,226,122,0.8)", "center"); } // 켤 수 있어요
    if (lit && m.trLitT < 2.5 && Math.floor(game.time * 6) % 2) drawBox(x - 0.19, y - 0.19, 0.58, 0.38, 0.38, 0.04, "#ff9a4a"); // 곧 꺼져요
  },
});

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_lureDance: { text: "작은 불빛은 함정! 멀리", voice: true },
  w2_lureSwarm: { text: "줄로 이어진 불빛을 피해요", voice: true },
  w2_lureBite: { text: "원 밖으로!" },
  w2_darkBite: { text: "빛나는 길 옆으로!" },
  w2_glowSpores: { text: "원 사이로!" },
  w2_lampSnuff: { text: "후~ 할 때 때려요!", do: true },
  w2_anglerCall: { text: "작은 불빛 둘을 화살로" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.trench = { 1: "불 끄기를 때려서 끊어요!", 2: "줄로 이어진 불빛을 피해요" };
