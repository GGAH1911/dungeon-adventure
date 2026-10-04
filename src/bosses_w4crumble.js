// ===== 월드 4 보스 8: 개미 장군 영차 (crumble) — 설계서 docs/design/world4-underworld.md 5-8 =====
// 새 아이디어: 아레나 바닥에 금 간 판 10칸. 영차가 돌진하다 금 간 판을 지나면 판이 와르르! 영차가 쏙 빠져
//   5초 동안 머리만 내밀고 버둥 (비틀: 받는 피해 x1.5). 아이는 "금 간 판 너머에 서서 돌진을 유도" 해요.
//   쿵 발구르기는 둘레 금 간 판을 흔들어요(곧 무너져요). 3단계엔 영차가 무너진 판을 고치고(2개), 돌진을 두 번 연달아 해요.
// 금 간 판은 world.w4.cracks (w4_common.js 약속). 주인공이 밟아 무너지기·8초 뒤 복구·떨어지기는 환경(under_env.js) 몫이고,
//   환경 파일이 없을 때(W4_ENV 없음)만 이 파일이 판을 그리고 8초 뒤 고쳐요.
// 같이 하기: 판 상태는 환경 파일이 친구 기기로 보내요. 빠진 영차(akStuck)·비틀은 보스 칸이라 친구 화면에 그대로 가요.

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

const AK = { type: "w4_antKing", rows: [-3, 3], cols: [-6, -3, 0, 3, 6], stuck: 5, wobbleR: 3.5, restore: 8, wobbleT: 1.0, fix: 2 };

// ----- 부품·전설 (8-3) -----
Object.assign(MATERIALS, { w4_antHelm: { name: "영차 장군 투구", color: "#a87848" } });
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined" && typeof LEGEND_FORMS === "function") {
  defBase("L_antKing", { slot: "weapon", legend: "crumble", name: "영차 장군 깃발 창", minL: 0, color: "#a87848", mul: 1.06, effect: "slow",
    forms: LEGEND_FORMS({ w: "영차 장군 깃발 창", m: "영차 깃발 지팡이", d: "영차 깃발 지팡이", h: "영차 깃발 단검" }, "spear"), desc: "맞으면 느려져요 (공격력 +6%)" });
  BOSS_LEGENDS.crumble = "L_antKing";
}

// ----- 기술 -----
const AK_ANT = W4E.mon("w4_antSoldier", "charger");
Object.assign(ABILITIES, {
  w4_akCharge: { name: "영차 돌진", desc: "빨간 길로 쭉 돌진! 금 간 판을 지나면 와르르 빠져요. 벽에 부딪혀도 어지러워요.", counter: "금 간 판 너머에 서서 돌진을 불러요! 빨간 길 옆으로",
    tags: ["boss", "line", "move"], telegraph: { shape: "line", length: 9, width: 1.8, at: "self", time: 1.3 }, cooldown: 6, range: [2, 10], damageMul: 1.7, anim: "crouch",
    effect: { type: "charge", speed: 9, stunOnWall: 2.0 } },
  w4_akStomp: { name: "쿵 발구르기", desc: "발을 쿵! 둘레 금 간 판이 흔들흔들, 곧 무너져요.", counter: "빨간 원 밖으로! 흔들리는 판에서 내려와요",
    tags: ["boss", "area"], telegraph: { shape: "circle", radius: 2.0, at: "self", time: 1.2 }, cooldown: 6, range: [0, 3], damageMul: 1.7, anim: "slam",
    effect: { type: "knockback", force: 1.2 } },
  w4_akSand: W4E.copy("w2_iceRain", { name: "모래 던지기", desc: "개미 병정들이 모래 덩이를 여러 군데 던져요.", counter: "원 사이 빈 곳으로 걸어가요", effect: { count: 5 } },
    { tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.25 }, cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 5, spread: 3.6, stagger: 0.18 } }),
  w4_akAnts: { name: "개미 병정 부르기", desc: "영차! 꼬마 개미 병정 셋을 불러요.", counter: "꼬마 개미부터 잡아요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: AK_ANT, count: 3, max: 4 } },
  w4_akFix: { name: "판 고치기", desc: "영차영차! 무너진 판 두 개를 뚝딱 고쳐요.", counter: "고치는 동안 공격!",
    tags: ["boss"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 10, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "w4_akFix" } },
});

W4E.make({ mapId: "crumble", type: AK.type, name: "영차", title: "개미 장군", color: "#a87848", size: 2.8, r: 0.95, hp: 250, damage: 2.5, speed: 1.15, arena: 26,
  material: { id: "w4_antHelm", name: "영차 장군 투구", color: "#a87848" },
  theme: { floor: "#6a5848", moss: "#d8b878", wall: "#3e3024", darkness: 0.38, bg: "#0e0a06" },
  build(w) {
    const c = w.W / 2;
    AK.rows.forEach((oy, r) => AK.cols.forEach((ox, i) => w4AddCrack(w, c + ox + (r ? 1 : 0), c + oy + ((i % 2) ? 0.6 : -0.6))));
  },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_akCharge", "w4_akStomp", "w4_akCharge"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_akAnts", "w4_akCharge", "w4_akSand", "w4_akStomp", "w4_akCharge"] },
    { until: 0, gap: 1.4, pattern: ["w4_akFix", "w4_akCharge", "w4_akCharge", "w4_akStomp", "w4_akSand", "w4_akCharge"] },
  ],
  onPhase(m, idx) {
    if (idx === 0) showMessage("금 간 판 너머에 서서 돌진을 불러요!", 3, false, "#d8b878");
    if (idx === 1) showMessage("개미 병정이 와요! 돌진은 금 간 판 쪽으로", 2.6, false, "#d8b878");
    if (idx === 2) showMessage("영차가 판을 고쳐요! 돌진이 두 번", 3, false, "#d8b878");
  } });

// ----- 금 간 판 -----
function akCracks() { const E = world.w4; return (E && E.cracks) || []; }
function akEnvOn() { return typeof W4_ENV !== "undefined"; } // 환경 파일(under_env.js)이 있으면 판 그림·복구는 그쪽이 해요
hookOn("dungeonTick", (dt) => {
  const b = W4E.boss(AK.type);
  if (!b) return;
  // 빠져 있는 동안: 머리만 (비틀이 끝나면 쏙 나와요)
  if (b.akStuck > 0) { b.akStuck -= dt; if (!(b.stagger > 0)) b.akStuck = 0; }
  // 돌진 중 금 간 판을 지나면 와르르!
  if (b.charge && b.hp > 0 && !(b.invuln > 0)) {
    const cr = akCracks().find((q) => q.state !== 2 && Math.hypot(q.x - b.x, q.y - b.y) < 0.75);
    if (cr) {
      cr.state = 2; cr.t = 0;
      b.charge = null;
      spawnBurst(cr.x, cr.y, ["#a87848", "#d8b878", "#5a4030"], 18);
      W4E.stun(b, AK.stuck, 0, "와르르! 쏙 빠졌다!", "#d8b878");
      b.x = cr.x; b.y = cr.y; b.akStuck = b.stagger;
    }
  }
  // 환경 파일이 없을 때만: 흔들 → 1초 뒤 구멍, 구멍 → 8초 뒤 복구
  if (!akEnvOn()) for (const q of akCracks()) {
    if (q.state === 1) { q.t = (q.t || 0) + dt; if (q.t >= AK.wobbleT) { q.state = 2; q.t = 0; } }
    else if (q.state === 2) { q.t = (q.t || 0) + dt; if (q.t >= AK.restore && Math.hypot(q.x - b.x, q.y - b.y) > 1.2) { q.state = 0; q.t = 0; } }
  }
}, 40);
// 쿵: 둘레 금 간 판이 흔들려요 (기본 효과 뒤에)
hookOn("castResolved", (c) => {
  if (c.id !== "w4_akStomp" || !c.m || W4E.guest()) return;
  for (const q of akCracks()) if (q.state === 0 && Math.hypot(q.x - c.m.x, q.y - c.m.y) < AK.wobbleR) { q.state = 1; q.t = 0; }
}, 50);
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w4_akFix") return false;
  const b = c.m; if (!b || b.hp <= 0) return true;
  const holes = akCracks().filter((q) => q.state === 2).slice(0, AK.fix);
  for (const q of holes) { q.state = 0; q.t = 0; addRing(q.x, q.y, { speed: 3, life: 0.4, hue: 35 }); }
  addFloatText(b.x, b.y, holes.length ? `영차영차! 판 ${holes.length}개 고쳤어요` : "고칠 판이 없네!", "#d8b878", 20);
  return true;
}, 15);

// ----- 그리기 (환경 파일이 없을 때만 판) + 빠진 구멍 -----
hookOn("drawFloor", () => {
  const b = W4E.seen(AK.type);
  if (!b || game.scene !== "dungeon") return;
  if (!akEnvOn()) for (const q of akCracks()) {
    const pts = [toScreen(q.x - 0.5, q.y - 0.5, 0.012), toScreen(q.x + 0.5, q.y - 0.5, 0.012), toScreen(q.x + 0.5, q.y + 0.5, 0.012), toScreen(q.x - 0.5, q.y + 0.5, 0.012)];
    if (q.state === 2) { fillPoly(pts, "rgba(10,6,4,0.92)"); continue; }
    const wob = q.state === 1 ? Math.sin(game.time * 30) * 0.03 : 0;
    fillPoly(pts.map((p) => ({ x: p.x + wob * TILE_W, y: p.y })), q.state === 1 ? "rgba(216,184,120,0.55)" : "rgba(168,120,72,0.35)");
    const a = toScreen(q.x - 0.35, q.y - 0.2, 0.02), m = toScreen(q.x, q.y + 0.1, 0.02), z = toScreen(q.x + 0.3, q.y - 0.3, 0.02);
    ctx.save(); ctx.strokeStyle = "rgba(40,24,12,0.8)"; ctx.lineWidth = 2 * ZOOM; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.lineTo(z.x, z.y); ctx.stroke(); ctx.restore();
  }
  if (b.akStuck > 0) W4E.disc(b.x, b.y, b.r * 0.9, "rgba(10,6,4,0.9)", 0.015);
}, 50);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 개미 장군 영차: 갈색 개미 몸 3마디, 다리 6개, 장군 투구 + 작은 깃발. 빠지면 머리만 쏙
  w4_antKing(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.9 : 1, up = a.raise * 0.08, br = "#8a5a34", dk = "#5a3a20", stuck = m.akStuck > 0;
    const zz = stuck ? -0.22 : 0;
    if (!stuck) {
      for (const f of [0.14, 0, -0.14]) for (const sd of [1, -1]) P.push([f + a.walk * sd * 0.04, sd * 0.24, 0, 0.04, 0.16, 0.04, dk]);
      P.push([-0.24, 0, 0.06, 0.3, 0.26, 0.22 * sq, br]); // 배
      P.push([0.02, 0, 0.08, 0.2, 0.18, 0.16 * sq, br]); // 가슴
    }
    P.push([0.22, 0, 0.14 + up + zz, 0.22, 0.24, 0.2 * sq, br]); // 머리
    eyes(P, 0.335, 0.07, 0.24 + up + zz, 0.05, "#1a1020", a.stag || stuck);
    for (const sd of [1, -1]) P.push([0.3, sd * 0.06, 0.36 + up + zz, 0.03, 0.03, 0.12, dk]); // 더듬이
    P.push([0.2, 0, 0.34 + up + zz, 0.24, 0.26, 0.06, "#c8a040"], [0.2, 0, 0.4 + up + zz, 0.06, 0.06, 0.08, "#ff6a5a"]); // 투구
    if (!stuck) { P.push([-0.02, 0.1, 0.24, 0.02, 0.02, 0.3, "#5a4a3a"]); P.push([-0.02, 0.15, 0.46, 0.02, 0.1, 0.08, "#ff6a5a"]); } // 깃발
    drawVoxelParts(m, P, { top: 0.6 });
    if (stuck && Math.random() < 0.2) addSparkle(m.x + (Math.random() - 0.5), m.y + (Math.random() - 0.5), 0.1, { vz: 1, life: 0.4, size: 0.5, hue: 35 });
  },
});

// ----- 안내 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_akCharge: { text: "금 간 판 너머에 서요! 길 옆으로", do: true, voice: true },
  w4_akStomp: { text: "원 밖으로! 흔들리는 판에서 내려와요" },
  w4_akSand: { text: "원 사이로 걸어가요" },
  w4_akAnts: { text: "꼬마 개미부터 잡아요" },
  w4_akFix: { text: "고치는 동안 공격!" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.crumble = { 0: "금 간 판 너머에 서서 돌진을 불러요!", 1: "꼬마 개미를 먼저 잡아요", 2: "돌진이 두 번! 판을 또 써요" };
