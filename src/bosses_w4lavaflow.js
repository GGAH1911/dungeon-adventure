// ===== 월드 4 보스 7: 용암 도마뱀 화르륵이 (lavaflow) — 설계서 docs/design/world4-underworld.md 5-7 =====
// 새 아이디어: 화르륵이는 처음엔 뜨거운 껍질(받는 피해 x0.3, 주황 빛). 아레나 가운데 파란 "물방울 자리" 3곳에 4초마다 물방울이 똑!
//   화르륵이가 물방울에 맞으면 칙~ 껍질이 식어 8초 동안 피해 x1.5 (회색 비늘). 아이는 물방울 자리 옆에 서서 화르륵이를 데려와요.
//   식은 동안 용암에 들어가면 바로 다시 뜨거워져요. 3단계엔 용암에 잠수했다가 다른 곳에서 튀어나와요 (튀어나온 뒤 고리 예고).
// 아레나: 위·아래 가장자리 용암 띠 2 (가운데 금색 다리). 용암 위에 서면 아픈 것(밀기)은 환경(under_env.js) 몫이에요.
// 같이 하기: 물방울 박자(slDropT)·식음(slCool)·잠수(slDiveT)는 보스 칸이라 친구 화면에 그대로 가요. 계산은 방장만.

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

const SL = { type: "w4_salamander", period: 4, drops: [[0, -3.8], [-3.4, 2.4], [3.4, 2.4]], dropR: 1.4, cool: 8, hotMul: 0.3, coolMul: 1.5, dive: 2 };

// ----- 부품·전설 (8-3) -----
Object.assign(MATERIALS, { w4_lavaScale: { name: "화르륵이 용암 비늘", color: "#ff9a3a" } });
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined" && typeof LEGEND_FORMS === "function") {
  defBase("L_salamander", { slot: "weapon", legend: "lavaflow", name: "화르륵 불꽃 검", minL: 0, color: "#ff9a3a", mul: 1.06, effect: "burn",
    forms: LEGEND_FORMS({ w: "화르륵 불꽃 검", m: "화르륵 불꽃 지팡이", d: "화르륵 불꽃 지팡이", h: "화르륵 불꽃 단검" }, "sword"), desc: "맞으면 불이 붙어요 (공격력 +6%)" });
  BOSS_LEGENDS.lavaflow = "L_salamander";
}

// ----- 기술 -----
const SL_IMP = W4E.mon("w4_imp", "boomer");
Object.assign(ABILITIES, {
  w4_slFire: { name: "불 숨결", desc: "입에서 넓은 불 숨결! 맞으면 2초 동안 불이 붙어요.", counter: "빨간 부채꼴 밖으로",
    tags: ["boss", "cone", "fire"], telegraph: { shape: "cone", length: 6, angle: 1.0, at: "self", time: 1.3 }, cooldown: 6, range: [0, 6], damageMul: 1.5, anim: "roar",
    effect: { type: "burn", duration: 2, tick: 0.5, tickMul: 0.25 } },
  w4_slTail: { name: "꼬리 휘두르기", desc: "꼬리를 빙글 휘둘러 고리 모양으로 쳐요. 바로 옆은 안전! 그 뒤 숨을 골라요.", counter: "화르륵이 바로 옆으로 파고들거나 멀리!",
    tags: ["boss", "ring", "stagger"], telegraph: { shape: "ring", radius: 3.5, inner: 1.4, at: "self", time: 1.1 }, cooldown: 6, range: [0, 3.5], damageMul: 1.7, anim: "slam",
    staggerAfter: 1.6, effect: { type: "knockback", force: 1.2 } },
  w4_slDash: W4E.copy("w2_bellySlide", { name: "용암 미끄럼", desc: "배를 깔고 넓은 빨간 길로 쭉 미끄러져요. 벽에 부딪히면 어지러워요.", counter: "넓은 빨간 길 옆으로! 부딪히면 때려요" },
    { tags: ["boss", "line", "move", "stagger"], telegraph: { shape: "line", length: 8, width: 2.0, at: "self", time: 1.2 }, cooldown: 7, range: [2, 9], damageMul: 1.6, anim: "crouch", staggerAfter: 1.8, effect: { type: "charge", speed: 9, stunOnWall: 2.0 } }),
  w4_slPool: { name: "용암 웅덩이", desc: "발밑에 부글부글 용암 웅덩이를 만들어요. 5초 남아요.", counter: "주황 웅덩이 밖으로",
    tags: ["boss", "zone"], telegraph: { shape: "circle", radius: 1.4, at: "target", time: 1.1 }, cooldown: 8, range: [0, 10], damageMul: 0.4, anim: "point",
    effect: { type: "zone", duration: 5, tick: 0.7, kind: "fire" } },
  w4_slImps: { name: "불꼬마 부르기", desc: "부글! 불꼬마 둘을 불러요.", counter: "불꼬마를 먼저 잡아요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: SL_IMP, count: 2 } },
  w4_slDive: { name: "용암 잠수", desc: "용암 속으로 쏙! 2초 뒤 다른 곳에서 튀어나와요. (다시 뜨거워져요)", counter: "튀어나온 자리 고리를 보고 피해요",
    tags: ["boss", "move"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "crouch",
    effect: { type: "w4_slDive" } },
  w4_slPop: { name: "튀어나오기", desc: "용암에서 튀어나오며 고리 모양으로 펑!", counter: "고리 밖이나 바로 옆으로",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 3.5, inner: 1.2, at: "self", time: 1.2 }, cooldown: 1, range: [0, 40], damageMul: 1.6, anim: "slam",
    effect: { type: "knockback", force: 1.2 } },
});

W4E.make({ mapId: "lavaflow", type: SL.type, name: "화르륵이", title: "용암 도마뱀", color: "#ff9a3a", size: 3.0, r: 1.0, hp: 250, damage: 2.5, speed: 1.15, arena: 26,
  material: { id: "w4_lavaScale", name: "화르륵이 용암 비늘", color: "#ff9a3a" },
  theme: { floor: "#4a3a34", moss: "#ffb04a", wall: "#2e2220", darkness: 0.4, bg: "#140604", lava: true },
  build(w) {
    const c = w.W / 2;
    w4AddLava(w, { x0: c - 11, y0: c - 11, x1: c + 11, y1: c - 9 }, [{ x0: c - 1, y0: c - 11, x1: c + 1, y1: c - 9 }]);
    w4AddLava(w, { x0: c - 11, y0: c + 9, x1: c + 11, y1: c + 11 }, [{ x0: c - 1, y0: c + 9, x1: c + 1, y1: c + 11 }]);
  },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_slFire", "w4_slTail", "w4_slDash"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_slImps", "w4_slFire", "w4_slPool", "w4_slTail", "w4_slDash"] },
    { until: 0, gap: 1.4, pattern: ["w4_slDive", "w4_slFire", "w4_slTail", "w4_slPool", "w4_slDash"] },
  ],
  onPhase(m, idx) {
    if (idx === 0) showMessage("뜨거운 껍질! 파란 물방울 자리로 데려가 식혀요", 3, false, "#9fd8ff");
    if (idx === 1) showMessage("불꼬마와 용암 웅덩이! 물방울로 식히는 건 그대로", 2.6, false, "#ffb04a");
    if (idx === 2) showMessage("용암에 잠수해요! 용암에서 멀리 데려가요", 3, false, "#ffb04a");
  } });

// ----- 뜨거운 껍질 / 식음 -----
function slHot(b) { return !(b.slCool > 0); }
hookOn("monsterDamage", (h) => {
  const b = h.m;
  if (!b || b.type !== SL.type || h.opts.w4Prop) return false;
  if (slHot(b)) {
    h.dmg *= SL.hotMul;
    if (!h.opts.dot && game.time - (b.slHotMsgT || -9) > 1.2) { b.slHotMsgT = game.time; addFloatText(b.x, b.y, "앗 뜨거! 물방울로 식혀요", "#ffb04a", 16); }
  } else if (!(b.stagger > 0)) h.dmg *= SL.coolMul; // 비틀 때 x1.5 와 겹치지 않게
  return false;
}, 20);
function slDropSpots() { const c = world.W / 2; return SL.drops.map(([ox, oy]) => ({ x: c + ox, y: c + oy })); }
function slCoolDown(b) {
  b.slCool = SL.cool;
  addFloatText(b.x, b.y, "칙~ 식었어요! 지금 때려요", "#9fd8ff", 24);
  for (let i = 0; i < 16; i++) addSparkle(b.x + (Math.random() - 0.5) * 1.6, b.y + (Math.random() - 0.5) * 1.6, 0.6 + Math.random(), { vz: 1.5, life: 0.9, size: 0.8, hue: 200 });
  if (typeof sfx !== "undefined" && sfx.zap) sfx.zap();
}
// 잠수 끝: 주인공 가까운 용암 띠 안쪽 가장자리로 튀어나와 고리
function slEmerge(b) {
  const c = world.W / 2, p = nearestPlayer(b.x, b.y) || { x: c, y: c }, E = world.w4;
  let best = null, bd = 1e9;
  for (const l of (E && E.lava) || []) {
    const inner = l.y0 < c ? l.y1 + 1.4 : l.y0 - 1.4;
    for (const x of [c - 6, c - 3, c + 3, c + 6]) { const d = Math.hypot(x - p.x, inner - p.y); if (d > 2.5 && d < bd) { bd = d; best = { x, y: inner }; } }
  }
  if (!best) best = { x: c, y: c };
  const s = findFreeSpot(best.x, best.y, b.r, 3) || best;
  b.x = s.x; b.y = s.y; b.hidden = false; b.invuln = 0; b.slDiveT = 0;
  spawnBurst(b.x, b.y, ["#ff9a3a", "#ffd23f"], 18);
  b.queue = ["w4_slPop"]; b.gap = 0; b.state = "chase";
}
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w4_slDive") return false;
  const b = c.m; if (!b || b.hp <= 0) return true;
  b.hidden = true; b.invuln = 99; b.slDiveT = SL.dive; b.slCool = 0; b.charge = null;
  spawnBurst(b.x, b.y, ["#ff9a3a", "#ffd23f"], 14);
  addFloatText(b.x, b.y, "꼬르륵! 잠수", "#ffb04a", 20);
  return true;
}, 15);
hookOn("dungeonTick", (dt) => {
  const b = W4E.boss(SL.type);
  if (!b) return;
  // 잠수
  if (b.slDiveT > 0) {
    if (!b.hidden) b.slDiveT = 0; // 단계가 바뀌어 나왔어요
    else { b.slDiveT -= dt; b.moving = false; if (b.slDiveT <= 0) slEmerge(b); }
  }
  // 식은 시간
  if (b.slCool > 0) {
    b.slCool -= dt;
    if (typeof w4OnLava === "function" && w4OnLava(b.x, b.y)) { b.slCool = 0; addFloatText(b.x, b.y, "용암에 들어가서 다시 뜨거워!", "#ff9a3a", 20); }
  }
  // 물방울 박자: 자리마다 4초에 한 번, 엇갈려서
  const t0 = b.slDropT || 0, t1 = t0 + dt; b.slDropT = t1 % SL.period;
  slDropSpots().forEach((s, i) => {
    const at = (i / SL.drops.length) * SL.period;
    const crossed = t1 >= SL.period ? (t0 < at || at < t1 - SL.period) : (t0 < at && t1 >= at);
    if (!crossed) return;
    spawnBurst(s.x, s.y, ["#9fd8ff", "#ffffff"], 8);
    if (!b.hidden && Math.hypot(b.x - s.x, b.y - s.y) < SL.dropR + b.r * 0.6 && slHot(b)) slCoolDown(b);
  });
}, 40);
hookOn("untargetable", (o) => !!(o.type === SL.type && o.slDiveT > 0), 50);

// ----- 그리기: 물방울 자리 + 떨어지는 물방울 -----
hookOn("drawFloor", () => {
  const b = W4E.seen(SL.type) || monsters.find((o) => o.type === SL.type && o.slDiveT > 0);
  if (!b || game.scene !== "dungeon") return;
  const t = b.slDropT || 0;
  slDropSpots().forEach((s, i) => {
    const at = (i / SL.drops.length) * SL.period, until = ((at - t) % SL.period + SL.period) % SL.period, k = 1 - Math.min(1, until / 1.2);
    W4E.disc(s.x, s.y, SL.dropR, `rgba(90,170,255,${0.12 + 0.3 * k})`);
    W4E.ring(s.x, s.y, SL.dropR, "rgba(150,210,255,0.9)", 2.5);
  });
}, 50);
hookOn("worldThings", (things) => {
  const b = monsters.find((o) => o.type === SL.type);
  if (!b || game.scene !== "dungeon") return;
  const t = b.slDropT || 0;
  slDropSpots().forEach((s, i) => {
    const at = (i / SL.drops.length) * SL.period, until = ((at - t) % SL.period + SL.period) % SL.period;
    if (until > 1.0) return;
    const z = 0.2 + until * 3.2;
    things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => drawBox(s.x - 0.1, s.y - 0.1, z, 0.2, 0.2, 0.28, "#7fc8ff") });
  });
}, 50);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 용암 도마뱀 화르륵이: 주황·노랑 몸, 등에 용암 돌 비늘, 큰 눈 웃는 얼굴. 식으면 회색 비늘
  w4_salamander(m) {
    if (m.slDiveT > 0) { if (Math.random() < 0.3) addSparkle(m.x + (Math.random() - 0.5), m.y + (Math.random() - 0.5), 0.1, { vz: 1.5, life: 0.5, size: 0.6, gold: true }); return; }
    const a = bossMotion(m), P = [], sq = a.stag ? 0.88 : 1, up = a.raise * 0.08, cool = m.slCool > 0;
    const body = cool ? "#9a8a80" : "#ff8a3a", belly = cool ? "#c8bcb0" : "#ffd060", scale = cool ? "#6a625c" : "#c84a1a", glow = cool ? "#8a8a8a" : "#ffe27a";
    for (const sd of [1, -1]) { P.push([0.16 + a.walk * sd * 0.05, sd * 0.22, 0, 0.1, 0.1, 0.08, scale]); P.push([-0.16 - a.walk * sd * 0.05, sd * 0.22, 0, 0.1, 0.1, 0.08, scale]); }
    P.push([0, 0, 0.06, 0.56, 0.36, 0.2 * sq, body]);
    P.push([0.04, 0, 0.06, 0.44, 0.26, 0.04, belly]);
    for (let i = 0; i < 4; i++) P.push([0.16 - i * 0.12, 0, 0.26 * sq, 0.08, 0.12, 0.06, i % 2 ? scale : glow, !cool]); // 등 비늘
    const tw = Math.sin(a.t * 4) * 0.07;
    P.push([-0.34, tw, 0.08, 0.14, 0.12, 0.1, body], [-0.48, tw * 2, 0.08, 0.14, 0.08, 0.08, scale]);
    P.push([0.32, 0, 0.14 + up, 0.24, 0.3, 0.2 * sq, body]);
    eyes(P, 0.445, 0.09, 0.28 + up, 0.06, "#1a1020", a.stag);
    P.push([0.45, 0, 0.18 + up, 0.02, 0.18, 0.025, "#7a2a1a"]); // 웃는 입
    drawVoxelParts(m, P, { top: 0.55 });
    if (!cool && Math.random() < 0.15) addSparkle(m.x + (Math.random() - 0.5) * 1.2, m.y + (Math.random() - 0.5) * 1.2, 0.5, { vz: 1.2, life: 0.4, size: 0.5, gold: true });
  },
});

// ----- 안내 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_slFire: { text: "불 숨결! 부채꼴 밖으로" },
  w4_slTail: { text: "바로 옆으로 파고들어요" },
  w4_slDash: { text: "넓은 길 옆으로!" },
  w4_slPool: { text: "주황 웅덩이 밖으로" },
  w4_slImps: { text: "불꼬마부터 잡아요" },
  w4_slDive: { text: "잠수! 튀어나온 자리 고리를 봐요", do: true },
  w4_slPop: { text: "고리 밖이나 바로 옆으로" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.lavaflow = { 0: "파란 물방울 자리로 데려가서 식혀요!", 1: "불꼬마를 먼저 잡아요", 2: "용암에서 멀리 데려가요!" };
