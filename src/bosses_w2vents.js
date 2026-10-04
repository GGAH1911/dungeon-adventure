// ===== 월드 2 보스 5: 물기둥 고래 둥둥이 (뜨거운 열수구 `vents`, 설계서 docs/design/world2-ocean.md 5-5) =====
// 새 아이디어 하나: 물이 차고 빠져요 (밀물·썰물 + 움직이는 거북 섬)
//   밀물(high): 섬 밖 물은 느려지고 1초마다 조금 아파요. 고래는 헤엄 = 칼이 안 닿아요 (화살·마법은 맞아요)
//   물 빠짐(drain): 고래가 가운데로 헤엄쳐 와요 (기술 쉼)
//   썰물(low): 철퍼덕! 고래가 누워 비틀거려요 = 칼로 몰아칠 시간
//   물 참(rise): 섬이 금색 + "거북 섬으로!" (기술 쉼)
// 거북 섬 4개는 가운데에서 5.5칸, 2단계부터 천천히 돌아요 (섬 위 주인공은 같이 움직여요).
// 3단계: 점프 덮치기 -> 내린 자리의 섬이 5초 가라앉아요.
// 같이 하기: 물 상태·섬 각도·가라앉은 섬은 모두 보스 칸(m.w2State, m.w2TideT, m.w2TideMax, m.w2IslandA, m.w2Sunk)이라
//   친구 기기도 같은 자리에 섬을 그려요 (vtIslands).

Object.assign(MATERIALS, { w2_whaleBarnacle: { name: "고래 따개비", color: "#f0e6c8" } });

const VT_TYPE = "w2_spoutWhale";
const VT_TIDE = {
  easy: { high: 10, drain: 2.5, low: 10, rise: 3.5 },
  normal: { high: 12, drain: 2, low: 8, rise: 2.5 },
  hard: { high: 13, drain: 2, low: 7, rise: 2.2 },
  nightmare: { high: 14, drain: 2, low: 6, rise: 2 },
};
const VT_ISLAND = { R: 5.5, r: 2.2, pad: 0.2, n: 4 };
const VT_SPIN = [0, 0.10, 0.14];   // 단계별 섬이 도는 빠르기 (rad/초)
const VT_SWIM_R = 9.6;             // 밀물 때 고래가 도는 원
const VT_FLOP = 4.0;               // 썰물 철퍼덕 비틀 (× 난이도 배수)
const VT_WATER = { slow: 0.3, every: 1.0, dmgMul: 0.25 };

function vtDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function vtTide() { return VT_TIDE[vtDiff()] || VT_TIDE.normal; }
function vtStagK() { return { easy: 1.3, normal: 1, hard: 0.85, nightmare: 0.7 }[vtDiff()] || 1; }
function vtBoss() { return (typeof monsters !== "undefined" ? monsters : []).find((o) => o.type === VT_TYPE && o.hp > 0) || null; }
function vtCenter() { return { x: world.W / 2, y: world.H / 2 }; }
// 섬 자리: 보스 칸(각도·가라앉음)만으로 계산해요 (친구 기기도 같아요)
function vtIslands(m) {
  const c = vtCenter(), A = (m && m.w2IslandA) || 0, sunk = (m && m.w2Sunk) || [];
  const out = [];
  for (let i = 0; i < VT_ISLAND.n; i++) {
    const a = A + i * Math.PI / 2;
    out.push({ i, x: c.x + Math.cos(a) * VT_ISLAND.R, y: c.y + Math.sin(a) * VT_ISLAND.R, a, r: VT_ISLAND.r, sunk: (sunk[i] || 0) > 0 });
  }
  return out;
}
function vtIslandAt(m, x, y) {
  for (const s of vtIslands(m)) if (!s.sunk && Math.hypot(x - s.x, y - s.y) < s.r + VT_ISLAND.pad) return s;
  return null;
}

// ----- 기술 -----
Object.assign(ABILITIES, {
  w2_spout: { name: "물기둥", desc: "숨구멍에서 뿜은 물이 바닥에서 솟아올라요.", counter: "빨간 원 밖으로",
    tags: ["boss", "area"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 1.2 },
    cooldown: 4, range: [0, 30], damageMul: 1.5, anim: "raise", effect: { type: "knockback", force: 1.2 } },
  w2_spoutTrack: { name: "따라오는 물기둥", desc: "물기둥 자리가 따라오다 멈춘 곳에서 솟아요.", counter: "계속 움직이다 테두리가 굵어지면 빠져요",
    tags: ["boss", "track"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 2.7, follow: true },
    cooldown: 7, range: [0, 30], damageMul: 1.6, anim: "raise", effect: { type: "knockback", force: 1.2 } },
  w2_tailSplash: { name: "꼬리 철썩", desc: "꼬리를 휘둘러 뒤쪽 부채꼴을 철썩!", counter: "고래 꼬리 쪽에 서지 마요",
    tags: ["boss", "cone"], telegraph: { shape: "cone", length: 5, angle: 1.4, at: "self", time: 1.2, back: true },
    cooldown: 5, range: [0, 6], damageMul: 1.6, anim: "crouch", effect: { type: "knockback", force: 2.0 } },
  w2_flopRing: { name: "철퍼덕 고리", desc: "몸을 들썩여 둘레에 물결 고리를 보내요. 고래 바로 옆은 안전해요.", counter: "고래 옆 금색 안으로!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 5, inner: 2.0, at: "self", time: 1.2 },
    cooldown: 6, range: [0, 8], damageMul: 1.4, anim: "slam", effect: { type: "knockback", force: 1.2 } },
  w2_breach: { name: "점프 덮치기", desc: "물 위로 점프해 그림자가 따라오다 멈춘 곳에 쿵! 그 섬은 잠깐 가라앉아요.", counter: "그림자가 멈추면 빠져나가 다른 섬으로!",
    tags: ["boss", "track", "stagger"], telegraph: { shape: "circle", radius: 2.4, at: "target", time: 3.2, follow: true },
    cooldown: 10, range: [0, 30], damageMul: 2.2, anim: "raise", staggerAfter: 2.5, effect: { type: "w2_breach", sink: 5 } },
  w2_jellyCall: { name: "해파리 부르기", desc: "물속에 둥실 해파리 둘을 불러요.", counter: "해파리 고리를 피하고 섬 위에서 화살로",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w2_jelly", count: 2 }, when: { maxSummons: 3 } },
});

// ----- 보스 정의 -----
const VT_PHASES = [
  { until: 0.66, gap: 1.8, patterns: { high: ["w2_spout", "w2_spout", "w2_spoutTrack"], low: ["w2_tailSplash", "w2_flopRing"] } },
  { until: 0.33, gap: 1.6, patterns: { high: ["w2_spoutTrack", "w2_jellyCall", "w2_spout"], low: ["w2_flopRing", "w2_tailSplash", "w2_flopRing"] } },
  { until: 0, gap: 1.4, patterns: { high: ["w2_breach", "w2_spout", "w2_spoutTrack", "w2_breach"], low: ["w2_tailSplash", "w2_flopRing", "w2_tailSplash"] } },
];
MONSTERS[VT_TYPE] = { name: "둥둥이", shape: VT_TYPE, behavior: "vt_whale", color: "#4a7ac8", hp: 200, speed: 1.0, damage: 1.9,
  xp: 45, emerald: 1, emeraldCount: 12, heavy: true, isBoss: true, size: 3.4, world: 2 };
BEHAVIOR_DOCS.vt_whale = { name: "밀물 썰물 고래", desc: "물이 차면 헤엄치며 물기둥을 뿜고, 물이 빠지면 철퍼덕 쓰러져요.", counter: "물이 차면 거북 섬 위에서 화살, 빠지면 쓰러진 고래를 칼로!" };
BOSS_DEFS.vents = {
  id: VT_TYPE, name: "둥둥이", title: "물기둥 고래", size: 3.4, world: 2,
  material: { id: "w2_whaleBarnacle", name: "고래 따개비", color: "#f0e6c8" },
  arena: { size: 28, theme: { floor: "#4a4048", moss: "#ff8a4a", wall: "#3a3036", darkness: 0.4, bg: "#140808", lava: true } },
  phases: VT_PHASES.map((ph) => ({ until: ph.until, gap: ph.gap, patterns: ph.patterns, pattern: ph.patterns.high, abilities: [...new Set([...ph.patterns.high, ...ph.patterns.low])] })),
  create(x, y, level) {
    const m = createMonster(VT_TYPE, x, y, level);
    m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS.vents;
    m.name = "물기둥 고래 둥둥이";
    m.r = 1.2; m.level = level; m.aggro = true; m.appearTimer = 1;
    m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = [];
    m.w2State = "rise"; m.w2TideT = 0; m.w2TideMax = 1; m.w2IslandA = 0; m.w2Sunk = [0, 0, 0, 0];
    m.onPhase = (idx) => vtPhase(m, idx);
    return m;
  },
};
function vtPhase(m, idx) {
  if (idx === 1) showMessage("거북 섬이 돌기 시작해요! 섬 위에 있으면 같이 움직여요", 3, false, "#ffe27a");
  if (idx === 2) showMessage("고래가 점프해요! 그림자가 멈추면 다른 섬으로!", 3, false, "#ffe27a");
}

// ----- 행동: 단계 + 물 상태별 순서로 기술 (움직임은 아래 dungeonTick 이 해요) -----
EXTRA_BEHAVIORS.vt_whale = (m, p, dist, dt) => {
  const def = m.bossDef;
  const frac = m.hp / m.maxHp;
  let idx = def.phases.findIndex((ph) => frac > ph.until);
  if (idx < 0) idx = def.phases.length - 1;
  if (idx !== m.phaseIdx && m.state !== "cast" && !m.charge) {
    m.phaseIdx = idx; m.patIdx = 0; m.queue = [];
    m.invuln = 2.2; if (m.w2State !== "low") m.stagger = 0;
    onPhaseChange(m, idx);
    return;
  }
  if (m.invuln > 0) { m.invuln -= dt; return; }
  if (m.stagger > 0) { m.stagger -= dt; return; }
  if (m.charge || m.state === "cast") return;
  const st = m.w2State;
  if (st !== "high" && st !== "low") return; // 물이 차고 빠지는 동안은 쉬어요 (경고만)
  if (st === "low") faceToward(m, p);
  const ph = def.phases[m.phaseIdx], pat = ph.patterns[st];
  m.gap -= dt;
  if (m.gap > 0) return;
  const next = m.queue.length ? m.queue[0] : pat[(m.patIdx || 0) % pat.length];
  const ab = ABILITIES[next];
  const full = ab.when && ab.when.maxSummons && (m.summons || []).filter((s) => s.hp > 0).length >= ab.when.maxSummons;
  if (!m.queue.length && (full || dist < ab.range[0] || dist > ab.range[1])) {
    m.waitT = (m.waitT || 0) + dt;
    if (full || m.waitT > 1.5) { m.waitT = 0; m.patIdx = (m.patIdx || 0) + 1; }
    return;
  }
  if (m.queue.length) m.queue.shift(); else m.patIdx = (m.patIdx || 0) + 1;
  startBossAbility(m, next, p);
  m.gap = ph.gap * bossTune().cooldown;
};

// ----- 물 주기 (방장 기기) -----
function vtSetTide(m, st) {
  const T = vtTide();
  m.w2State = st; m.w2TideT = T[st]; m.w2TideMax = T[st];
  m.patIdx = 0; m.waitT = 0;
  if (st === "rise") {
    m.stagger = 0;
    showMessage("물이 차요! 거북 섬 위로!", 2.4, false, "#ffd23f");
    if (typeof sfx !== "undefined" && sfx.boss) sfx.boss();
  } else if (st === "high") {
    m.gap = 1.2;
    if (!m.vtTaughtHigh) { m.vtTaughtHigh = true; showMessage("고래는 헤엄칠 때 화살로!", 2.6, false, "#9fe6ff"); }
  } else if (st === "drain") {
    m.stagger = 0; m.queue = [];
    showMessage("물이 빠져요! 고래가 쓰러져요, 공격 준비", 2.2, false, "#9fe6ff");
  } else if (st === "low") {
    const c = vtCenter();
    const s = findFreeSpot(c.x, c.y, m.r, 3) || c;
    m.x = s.x; m.y = s.y; m.charge = null; m.state = "chase"; m.queue = [];
    casts = casts.filter((q) => q.m !== m);
    m.stagger = VT_FLOP * vtStagK(); m.gap = 0.6;
    addFloatText(m.x, m.y, "철퍼덕!", "#ffe27a", 30); game.shake = Math.max(game.shake, 0.5);
    for (let i = 0; i < 4; i++) spawnDust(m.x + (Math.random() - 0.5) * 2, m.y + (Math.random() - 0.5) * 2);
    addRing(m.x, m.y, { speed: 6, life: 0.5, hue: 200 });
    if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
    showMessage("철퍼덕! 지금 마구 때려요!", 2, false, "#ffe27a");
  }
}
const VT_NEXT = { rise: "high", high: "drain", drain: "low", low: "rise" };
hookOn("dungeonTick", (dt) => {
  const kh = game.keyhunt;
  if (!kh || !kh.inBoss) return;
  const m = vtBoss();
  if (!m) return;
  const c = vtCenter();
  if (!m.w2Init) {
    m.w2Init = true;
    vtSetTide(m, "rise");
    m.w2TideT = m.w2TideMax = vtTide().rise + 1.5; // 처음엔 섬으로 갈 시간을 조금 더
  }
  // 물 주기
  m.w2TideT -= dt;
  if (m.w2TideT <= 0) vtSetTide(m, VT_NEXT[m.w2State] || "rise");
  // 가라앉은 섬
  for (let i = 0; i < m.w2Sunk.length; i++) if (m.w2Sunk[i] > 0) m.w2Sunk[i] = Math.max(0, m.w2Sunk[i] - dt);
  // 섬이 돌아요 (섬 위 주인공도 같이)
  const sp = VT_SPIN[m.phaseIdx || 0] || 0;
  if (sp > 0) {
    const dA = sp * dt;
    for (const p of allPlayers()) {
      if (p.hp <= 0 || !vtIslandAt(m, p.x, p.y)) continue;
      const rx = p.x - c.x, ry = p.y - c.y, co = Math.cos(dA), si = Math.sin(dA);
      moveEntity(p, c.x + rx * co - ry * si - p.x, c.y + rx * si + ry * co - p.y);
    }
    m.w2IslandA += dA;
  }
  // 헤엄 = 칼이 안 닿아요 (m.flying: 봇·안내가 "화살로" 를 알아요)
  m.swimming = m.flying = m.w2State !== "low" && !(m.stagger > 0);
  // 고래 움직임
  if (m.state !== "cast" && !m.charge && !(m.invuln > 0 && m.w2State === "low")) {
    let tx = null, ty = null, k = 0;
    if (m.w2State === "drain") { tx = c.x; ty = c.y; k = 2.2; }
    else if (m.w2State === "high" && !(m.stagger > 0)) {
      const a = Math.atan2(m.y - c.y, m.x - c.x) + 0.45;
      tx = c.x + Math.cos(a) * VT_SWIM_R; ty = c.y + Math.sin(a) * VT_SWIM_R;
    } else if (m.w2State === "rise") {
      const a = Math.atan2(m.y - c.y, m.x - c.x) || 0;
      tx = c.x + Math.cos(a) * VT_SWIM_R; ty = c.y + Math.sin(a) * VT_SWIM_R;
    }
    if (tx !== null) {
      const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
      if (d > 0.05) {
        const step = k ? d * Math.min(1, dt * k) + 1.5 * dt : (m.w2State === "rise" ? 1.6 : 2.6) * dt;
        moveEntity(m, dx / d * Math.min(d, step), dy / d * Math.min(d, step));
        m.faceX = dx / d; m.faceY = dy / d; m.moving = true;
        if (Math.random() < dt * 3) addRing(m.x, m.y, { speed: 2.5, life: 0.4, hue: 200 });
      } else m.moving = false;
    } else m.moving = false;
  }
  // 밀물: 섬 밖 물은 느려지고 1초마다 조금 아파요
  if (m.w2State === "high") {
    for (const p of allPlayers()) {
      if (p.hp <= 0) continue;
      if (vtIslandAt(m, p.x, p.y)) { p._vtWet = 0; continue; }
      p.abSlow = Math.max(p.abSlow || 0, VT_WATER.slow);
      p._vtWet = (p._vtWet || 0) + dt;
      if (p._vtWet >= VT_WATER.every) {
        p._vtWet = 0;
        hurtPlayer(p, m.damage * VT_WATER.dmgMul * bossTune().damage, { x: p.x, y: p.y - 1 });
        if (Math.random() < 0.4) addFloatText(p.x, p.y + 0.3, "물이 차요! 섬으로", "#9fe6ff", 15);
      }
    }
  }
}, 40);

// ----- 칼은 헤엄치는 고래에 안 닿아요 -----
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (!m || m.type !== VT_TYPE || !m.swimming || (h.opts && h.opts.dot)) return false;
  const fromPlayer = allPlayers().some((p) => Math.hypot(h.fromX - p.x, h.fromY - p.y) < 0.6);
  if (fromPlayer) {
    if (game.time - (m.vtNoTextT || -9) > 0.5) { m.vtNoTextT = game.time; addFloatText(m.x, m.y, "닿지 않아요! 화살로!", "#ffb070", 15); }
    return true;
  }
  return false;
}, 24);

// ----- 새 효과: 점프 덮치기 -----
hookOn("resolveCast", (c, p) => {
  const e = c.ab.effect;
  if (e.type !== "w2_breach") return false;
  const m = c.m;
  const before = vtIslands(m);
  const spot = findFreeSpot(c.x, c.y, m.r, 3) || { x: c.x, y: c.y };
  m.x = spot.x; m.y = spot.y;
  for (const q of allPlayers()) {
    if (q.hp <= 0 || !insideShape(c, q.x, q.y, q.r * 0.6)) continue;
    if (q.rollTimer > 0) { addFloatText(q.x, q.y, "회피!", "#9be8ff", 18); continue; }
    hurtPlayer(q, abilityDamage(c), m);
    const dx = q.x - c.x, dy = q.y - c.y, d = Math.hypot(dx, dy) || 1;
    moveEntity(q, dx / d * 1.4, dy / d * 1.4);
  }
  for (const s of before) if (!s.sunk && Math.hypot(c.x - s.x, c.y - s.y) < s.r + 0.8) {
    m.w2Sunk[s.i] = e.sink;
    addFloatText(s.x, s.y, "섬이 가라앉아요!", "#9fe6ff", 22);
    showMessage("섬이 가라앉았어요! 다른 섬으로!", 2.2, false, "#9fe6ff");
  }
  addRing(c.x, c.y, { speed: 8, life: 0.45, hue: 200 }); spawnDust(c.x, c.y); spawnDust(c.x, c.y);
  for (let i = 0; i < 14; i++) addSparkle(c.x + (Math.random() - 0.5) * 2, c.y + (Math.random() - 0.5) * 2, 0.2, { vz: 3, life: 0.8, size: 0.6, hue: 195 });
  game.shake = Math.max(game.shake, 0.5);
  if (typeof sfx !== "undefined" && sfx.slam) sfx.slam();
  return true;
}, 15);

// ----- 그리기: 물과 거북 섬 (친구 기기도 보스 칸으로 그려요) -----
function vtWaterLevel(m) {
  const k = m.w2TideMax > 0 ? Math.max(0, Math.min(1, m.w2TideT / m.w2TideMax)) : 0;
  if (m.w2State === "high") return 1;
  if (m.w2State === "rise") return 1 - k;
  if (m.w2State === "drain") return k;
  return 0;
}
function vtPoly(x, y, r, n = 22, z = 0.014) { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push(toScreen(x + Math.cos(a) * r, y + Math.sin(a) * r, z)); } return pts; }
function vtStroke(pts, color, lw) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore(); }
function vtDrawIsland(m, s) {
  const shell = s.sunk ? "#2f5a4a" : "#4f9a4a", hex = s.sunk ? "rgba(20,40,30,0.6)" : "rgba(40,90,40,0.9)";
  fillPoly(vtPoly(s.x, s.y, s.r), shell);
  fillPoly(vtPoly(s.x, s.y, s.r * 0.55, 6), s.sunk ? "#3a6a5a" : "#6ab85a");
  vtStroke(vtPoly(s.x, s.y, s.r * 0.55, 6), hex, 2);
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3, p1 = toScreen(s.x + Math.cos(a) * s.r * 0.55, s.y + Math.sin(a) * s.r * 0.55, 0.014), p2 = toScreen(s.x + Math.cos(a) * s.r * 0.95, s.y + Math.sin(a) * s.r * 0.95, 0.014);
    ctx.save(); ctx.strokeStyle = hex; ctx.lineWidth = 2 * ZOOM; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.restore();
  }
  if (!s.sunk) {
    const warn = m.w2State === "rise" || m.w2State === "high";
    const blink = m.w2State === "rise" ? 0.55 + 0.45 * Math.sin(game.time * 10) : 1;
    vtStroke(vtPoly(s.x, s.y, s.r), warn ? `rgba(255,210,63,${0.9 * blink})` : "rgba(30,60,30,0.8)", warn ? 4 : 2);
  }
}
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon") return;
  const m = vtBoss();
  if (!m || !m.w2Sunk) return;
  const c = vtCenter(), isl = vtIslands(m), lvl = vtWaterLevel(m);
  // 가운데 웅덩이 무늬 (썰물 때 고래가 눕는 곳)
  vtStroke(vtPoly(c.x, c.y, 2.4, 20, 0.012), "rgba(255,138,74,0.35)", 2);
  for (const s of isl) if (s.sunk) vtDrawIsland(m, s);
  if (lvl > 0.01) {
    fillPoly(vtPoly(c.x, c.y, world.W / 2 - 1.6, 32, 0.013), `rgba(70,150,230,${0.32 * lvl})`);
    ctx.save(); ctx.strokeStyle = `rgba(220,245,255,${0.35 * lvl})`; ctx.lineWidth = 2 * ZOOM;
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39 + game.time * 0.15, r = 3 + (i * 1.7) % 8.5, x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
      if (vtIslandAt(m, x, y)) continue;
      const q1 = toScreen(x - 0.4, y, 0.015), q2 = toScreen(x, y - 0.15 + Math.sin(game.time * 3 + i) * 0.08, 0.015), q3 = toScreen(x + 0.4, y, 0.015);
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.quadraticCurveTo(q2.x, q2.y, q3.x, q3.y); ctx.stroke();
    }
    ctx.restore();
  }
  for (const s of isl) if (!s.sunk) vtDrawIsland(m, s);
}, 55);
// 거북 머리 (친절한 바다거북 할아버지들, 눈을 깜빡)
hookOn("worldThings", (things) => {
  if (game.scene !== "dungeon") return;
  const m = vtBoss();
  if (!m || !m.w2Sunk) return;
  for (const s of vtIslands(m)) {
    const hx = s.x + Math.cos(s.a) * (s.r + 0.15), hy = s.y + Math.sin(s.a) * (s.r + 0.15);
    things.push({ depth: hx + hy, x: hx, y: hy, draw: () => {
      if (s.sunk) { if (Math.random() < 0.1) addSparkle(s.x, s.y, 0.1, { vz: 1.2, gravity: -0.2, life: 0.7, size: 0.5, hue: 190 }); return; }
      const blink = Math.sin(game.time * 1.3 + s.i * 2) > 0.96;
      drawBox(hx - 0.3, hy - 0.3, 0, 0.6, 0.6, 0.45, "#7fc06a");
      const ex = Math.cos(s.a) * 0.2, ey = Math.sin(s.a) * 0.2, px = -Math.sin(s.a) * 0.15, py = Math.cos(s.a) * 0.15;
      for (const sd of [1, -1]) {
        drawBox(hx + ex + px * sd - 0.06, hy + ey + py * sd - 0.06, 0.28, 0.12, 0.12, blink ? 0.03 : 0.12, "#ffffff");
        if (!blink) drawBox(hx + ex * 1.2 + px * sd - 0.03, hy + ey * 1.2 + py * sd - 0.03, 0.31, 0.06, 0.06, 0.07, "#1a2a1a");
      }
      for (const sd of [1, -1]) { const fx = s.x + Math.cos(s.a + sd * 0.9) * (s.r + 0.05), fy = s.y + Math.sin(s.a + sd * 0.9) * (s.r + 0.05); drawBox(fx - 0.2, fy - 0.2, 0, 0.4, 0.4, 0.08, "#6ab05a"); }
    } });
  }
}, 50);

// ----- 고래 모양: 둥근 파란 몸, 연한 배, 큰 눈 + 볼터치, 등의 숨구멍, V자 꼬리, 따개비 -----
EXTRA_SHAPES[VT_TYPE] = (m) => {
  const a = bossMotion(m), P = [];
  const swim = !!m.swimming, flop = m.w2State === "low" && m.stagger > 0;
  const bob = swim ? Math.sin(game.time * 2 + m.x) * 0.012 : 0;
  const z0 = 0.01 + bob, sq = flop ? 0.85 : 1;
  const blue = "#4a7ac8", belly = "#cfe6f5", wag = Math.sin(game.time * (swim ? 5 : 2)) * 0.03;
  P.push([0, 0, z0 + 0.02, 0.48, 0.3, 0.24 * sq, blue]);
  P.push([0.02, 0, z0, 0.42, 0.26, 0.04, belly]);
  P.push([0.2, 0, z0 + 0.02, 0.1, 0.24, 0.07 * sq, belly]);
  P.push([-0.02, 0, z0 + 0.26 * sq, 0.36, 0.22, 0.04, blue]);
  P.push([-0.28, 0, z0 + 0.08, 0.12, 0.12, 0.08, blue]);
  P.push([-0.36, 0.07 + wag, z0 + 0.13, 0.07, 0.1, 0.03, blue], [-0.36, -0.07 + wag, z0 + 0.13, 0.07, 0.1, 0.03, blue]);
  P.push([0.08, 0.18, z0 + 0.04 + (flop ? 0 : wag), 0.1, 0.07, 0.025, blue], [0.08, -0.18, z0 + 0.04 - (flop ? 0 : wag), 0.1, 0.07, 0.025, blue]);
  eyes(P, 0.255, 0.08, z0 + 0.13 * sq, 0.05, "#1a2a3a", a.stag);
  P.push([0.255, 0.125, z0 + 0.08, 0.02, 0.04, 0.025, "#ff9ab0", true], [0.255, -0.125, z0 + 0.08, 0.02, 0.04, 0.025, "#ff9ab0", true]);
  if (m.w2State !== "low" && m.hp < m.maxHp * 0.33) P.push([0.255, 0.08, z0 + 0.2, 0.02, 0.06, 0.012, "#1a2a3a", true], [0.255, -0.08, z0 + 0.2, 0.02, 0.06, 0.012, "#1a2a3a", true]); // 화난 눈썹
  P.push([-0.06, 0, z0 + 0.3 * sq, 0.06, 0.06, 0.008, "#1a2a4a"]);
  for (const [f, s, z] of [[-0.12, 0.12, 0.18], [0.04, -0.13, 0.2], [-0.16, -0.08, 0.24]]) P.push([f, s, z0 + z * sq, 0.03, 0.03, 0.03, "#f0e6c8"]);
  // 물을 뿜어요 (기술을 쓸 때 숨구멍에서 물기둥)
  if (m.state === "cast" && m.castAnim === "raise") for (let i = 0; i < 4; i++) P.push([-0.06 + Math.sin(game.time * 12 + i) * 0.01, 0, z0 + 0.31 + i * 0.07 * a.k, 0.05 - i * 0.006, 0.05 - i * 0.006, 0.07, i % 2 ? "#bff6ff" : "#ffffff", true]);
  drawVoxelParts(m, P, { top: 0.6, alpha: swim ? 0.9 : 1 });
};

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_spout: { text: "원 밖으로!" },
  w2_spoutTrack: { text: "움직이다 멈추면 빠져요" },
  w2_tailSplash: { text: "꼬리 쪽은 위험!" },
  w2_flopRing: { text: "고래 옆 금색 안으로!", do: true },
  w2_breach: { text: "다른 섬으로!", do: true, voice: true },
  w2_jellyCall: { text: "섬 위에서 화살로!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.vents = { 1: "거북 섬이 돌아요. 섬 위에 있으면 같이 움직여요!", 2: "고래가 점프해요. 그림자가 멈추면 다른 섬으로!" };
