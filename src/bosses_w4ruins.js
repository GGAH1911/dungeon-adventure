// ===== 월드 4 보스 9: 돌수문장 묵묵이 (ruins) (설계서 docs/design/world4-underworld.md 5-9) =====
// 새 아이디어: 묵묵이는 돌 보호막을 둘러요(안 아파요). 가슴에 빛나는 글자 순서대로 바닥 글자 발판(○ △ □ ☆)을 밟으면
//   보호막이 깨져 7초(3단계 6초) 동안 때릴 수 있고 2초 비틀거려요. 틀리면 처음부터(아프지 않아요). 같이 하기: 누가 밟아도 이어져요.
// 공용 도우미 w4f* 는 bosses_w4forge.js 앞쪽에 있어요 (보스 9~12 파일 중 가장 먼저 불려요: index.html·tools/lib.mjs 둘 다).
// 같이 하기: 발판(소품)·보호막·순서는 몬스터 칸(숫자·배열)에 있어서 친구 기기에 그대로 가요. 계산은 방장만(dungeonTick).

// ----- 숫자 -----
const W4R = { homes: [[-8.5, -8.5], [8.5, -8.5], [8.5, 8.5], [-8.5, 8.5]], stand: 0.3, padR: 0.75, open: 7, open3: 6, stun: 2.0, move: 8, moveWarn: 0.8,
  syms: ["○", "△", "□", "☆"], colors: ["#7fd0ff", "#ffd23f", "#ff9ad6", "#7dffb0"] };
function w4rSeqLen() { return { easy: 2, normal: 3, hard: 4, nightmare: 4 }[w4fDiff()] || 3; }

// ----- 부품·전설 (8-3) -----
Object.assign(MATERIALS, { w4_statueEye: { name: "묵묵이 초록 눈돌", color: "#7fe0a0" } });
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") { // 시험 도구(check.mjs)는 loot.js 없이 읽어요
  defBase("L_statue", { slot: "charm", legend: "ruins", name: "돌수문장 방패 반지", minL: 0, icon: "ring", color: "#7fe0a0", perk: { block: 0.12, hearts: 2 }, desc: "공격을 잘 막고 하트 +2" });
  BOSS_LEGENDS.ruins = "L_statue";
}

// ----- 소품: 글자 발판 -----
w4fProp("w4_rune", "글자 발판", "#a8c890");
hookOn("untargetable", (o) => o.type === "w4_rune", 50);

// ----- 기술 -----
const W4R_GUARD = w4fMon("w4_stoneguard", "golem");
Object.assign(ABILITIES, {
  w4_stSlam: { name: "방패 쿵", desc: "돌 방패로 앞을 쾅! 그 뒤 숨을 골라요.", counter: "빨간 원 밖으로! 숨 고를 때 글자 발판",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.2, at: "front", offset: 1.8, time: 1.3 },
    cooldown: 5, range: [0, 4], damageMul: 2.0, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.4 } },
  w4_stBeam: { name: "초록 눈빛", desc: "초록 눈에서 긴 빛줄기를 쭉 쏴요.", counter: "빛줄 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.0, at: "self", time: 1.6 },
    cooldown: 6, range: [0, 12], damageMul: 1.7, anim: "staff", effect: { type: "damage" } },
  w4_stGuards: { name: "석상 병사 깨우기", desc: "쿵! 석상 병사 둘이 깨어나요.", counter: "병사는 느려요. 발판을 먼저!",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: W4R_GUARD, count: 2 } },
});

// ----- 보스 -----
w4fMakeBoss({ mapId: "ruins", type: "w4_statue", name: "묵묵이", title: "돌수문장", color: "#8a8a80", size: 3.2, r: 1.1, hp: 260, damage: 2.4, speed: 0.9, arena: 28,
  material: { id: "w4_statueEye", name: "묵묵이 초록 눈돌", color: "#7fe0a0" },
  theme: { floor: "#8a8270", moss: "#a8c890", wall: "#5a5444", darkness: 0.4, bg: "#0c0c08" },
  build(w) {
    const c = w.W / 2;
    if (typeof b2Pillars === "function") b2Pillars(w, [[-4, 3], [4, -3]]); // 무너진 기둥 2 (숨을 곳)
    for (const [dx, dy, i] of [[-5, -6, 0], [6, 5, 3.5], [0, 7, 7]]) w4AddDrip(w, c + dx, c + dy, 7, i);
  },
  init(m) { m.stShield = true; m.stSeq = []; m.stStep = 0; m.stOpenT = 0; m.stMoveT = W4R.move; },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w4_stSlam", "w4_stBeam", "w4_stSlam"] },
    { until: 0.33, gap: 1.6, pattern: ["w4_stGuards", "w4_stSlam", "groundSpikes", "w4_stBeam", "w4_stSlam"] },
    { until: 0, gap: 1.4, pattern: ["w4_stBeam", "w4_stSlam", "groundSpikes", "w4_stSlam", "w4_stGuards"] },
  ],
  onPhase(m, idx) {
    if (idx === 1) showMessage("석상 병사가 깨어나요! 그래도 글자 발판이 먼저", 2.6, false, "#a8c890");
    if (idx === 2) showMessage("발판이 움직여요! 화살표를 봐요", 3, false, "#a8c890");
  } });

function w4rRunes() { return w4fProps("w4_rune"); }
function w4rNewSeq(b) {
  const n = w4rSeqLen(), pool = [0, 1, 2, 3], seq = [];
  while (seq.length < n) { const s = pool[Math.floor(Math.random() * pool.length)]; if (seq[seq.length - 1] !== s) seq.push(s); }
  b.stSeq = seq; b.stStep = 0;
}
// 막기: 보호막이 있으면 안 아파요 (팅!)
hookOn("monsterDamage", (h) => {
  const b = h.m;
  if (!b || b.type !== "w4_statue" || !b.stShield) return false;
  if (!h.opts.dot && game.time - (b.stTingT || -9) > 0.5) { b.stTingT = game.time; addFloatText(b.x, b.y, "팅! 돌 보호막", "#c8c8b8", 18); }
  return true;
}, 4);
hookOn("dungeonTick", (dt) => {
  const b = w4fBoss("w4_statue");
  if (!b) return;
  const c = world.W / 2;
  if (!b.stInit) {
    b.stInit = true;
    W4R.homes.forEach(([ox, oy], i) => { const s = spawnProp("w4_rune", c + ox, c + oy, b); s.r = 0.5; s.rnSym = i; s.rnLit = 0; s.rnOnT = 0; });
    w4rNewSeq(b);
  }
  // 보호막이 깨진 동안
  if (!b.stShield) {
    b.stOpenT -= dt;
    if (b.stOpenT <= 0) { b.stShield = true; w4rNewSeq(b); addFloatText(b.x, b.y, "다시 돌 보호막!", "#c8c8b8", 22); for (const r of w4rRunes()) r.rnLit = 0; }
    return;
  }
  // 3단계: 8초마다 발판 둘이 자리를 바꿔요 (0.8초 화살표 예고)
  const runes = w4rRunes();
  if (b.phaseIdx >= 2 && runes.length === 4) {
    if (b.stSwap) {
      const s = b.stSwap; s.t += dt;
      const A = runes.find((r) => r.rnSym === s.a), B = runes.find((r) => r.rnSym === s.b);
      if (A && B && s.t >= W4R.moveWarn) {
        const k = Math.min(1, (s.t - W4R.moveWarn) / 0.5);
        A.x = s.ax + (s.bx - s.ax) * k; A.y = s.ay + (s.by - s.ay) * k; B.x = s.bx + (s.ax - s.bx) * k; B.y = s.by + (s.ay - s.by) * k;
        if (k >= 1) b.stSwap = null;
      }
    } else {
      b.stMoveT -= dt;
      if (b.stMoveT <= 0) {
        b.stMoveT = W4R.move;
        const i = Math.floor(Math.random() * 4), j = (i + 1 + Math.floor(Math.random() * 3)) % 4, A = runes.find((r) => r.rnSym === i), B = runes.find((r) => r.rnSym === j);
        if (A && B) b.stSwap = { a: i, b: j, ax: A.x, ay: A.y, bx: B.x, by: B.y, t: 0 };
      }
    }
  }
  if (b.stSwap) return;
  // 밟기: 누가 밟아도 순서가 이어져요
  for (const r of runes) {
    const on = allPlayers().some((p) => p && p.hp > 0 && Math.hypot(p.x - r.x, p.y - r.y) < W4R.padR);
    if (!on) { r.rnOnT = 0; continue; }
    r.rnOnT += dt;
    if (r.rnOnT < W4R.stand || r.rnStepped) continue;
    r.rnStepped = true;
    if (b.stSeq[b.stStep] === r.rnSym) {
      b.stStep++; r.rnLit = 1;
      addFloatText(r.x, r.y, `${W4R.syms[r.rnSym]} 딩!`, W4R.colors[r.rnSym], 22);
      if (typeof sfx !== "undefined" && sfx.click) sfx.click();
      if (b.stStep >= b.stSeq.length) {
        b.stShield = false; b.stOpenT = (b.phaseIdx >= 2 ? W4R.open3 : W4R.open);
        spawnBurst(b.x, b.y, ["#c8c8b8", "#7fe0a0", "#ffffff"], 24);
        w4fStun(b, W4R.stun, 0, "쩍! 보호막이 깨졌어요!");
      }
    } else {
      b.stStep = 0; for (const q of runes) q.rnLit = 0;
      addFloatText(r.x, r.y, "처음부터!", "#c8c8b8", 18);
    }
  }
  for (const r of runes) if (r.rnOnT === 0) r.rnStepped = false;
}, 40);

// ----- 그리기 -----
Object.assign(EXTRA_SHAPES, {
  // 돌수문장: 큰 회색 돌 석상, 이끼, 빛나는 초록 눈, 돌 방패
  w4_statue(m) {
    const a = bossMotion(m), P = [], sq = a.stag ? 0.92 : 1, up = a.raise * 0.06;
    const g = "#8a8a80", dk = "#6a6a62", moss = "#7fa860";
    for (const sd of [1, -1]) P.push([0, sd * 0.14, 0, 0.18, 0.14, 0.16, dk]);
    P.push([0, 0, 0.16, 0.36, 0.4, 0.36 * sq, g]);
    P.push([-0.05, 0.12, 0.42 * sq, 0.2, 0.12, 0.06, moss], [0.1, -0.15, 0.2, 0.1, 0.1, 0.05, moss]);
    P.push([0.02, 0, 0.52 * sq, 0.28, 0.3, 0.24, g]);
    P.push([0.02, 0, 0.76 * sq, 0.3, 0.32, 0.04, dk], [-0.02, 0.1, 0.78 * sq, 0.1, 0.1, 0.04, moss]);
    eyes(P, 0.165, 0.07, 0.64 * sq, 0.06, "#7fe0a0", a.stag);
    P.push([0.17, 0.07, 0.65 * sq, 0.02, 0.05, 0.05, "#a0ffc0", true], [0.17, -0.07, 0.65 * sq, 0.02, 0.05, 0.05, "#a0ffc0", true]);
    // 방패 (왼팔)
    P.push([0.2 + up, 0.24, 0.18, 0.06, 0.26, 0.36, "#9a9a8e"], [0.235 + up, 0.24, 0.3, 0.02, 0.1, 0.1, "#7fe0a0", true]);
    P.push([0.06, -0.24, 0.28 + up * 2, 0.12, 0.12, 0.26, dk]);
    drawVoxelParts(m, P, { top: 0.85 });
    // 보호막 + 가슴 글자 순서
    if (m.stShield) { const c = toScreen(m.x, m.y, 1.2); ctx.save(); ctx.globalAlpha = 0.25 + 0.1 * Math.sin(game.time * 4); ctx.strokeStyle = "#e8e8d8"; ctx.lineWidth = 4 * ZOOM; ctx.beginPath(); ctx.ellipse(c.x, c.y, 1.25 * TILE_W * 0.5 * (m.r / 1.1) * 1.6, 1.25 * TILE_H * 2.2, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (m.stShield && Array.isArray(m.stSeq) && m.stSeq.length) {
      const t = toScreen(m.x, m.y, 3.4), seq = m.stSeq, gap = 22 * ZOOM * 0.7;
      seq.forEach((s, i) => text(W4R.syms[s] || "?", t.x + (i - (seq.length - 1) / 2) * gap, t.y, Math.round(18 * ZOOM * 0.7), i < (m.stStep || 0) ? "#7dffb0" : (W4R.colors[s] || "#fff"), "center"));
    } else if (!m.stShield) { const t = toScreen(m.x, m.y, 3.4); text(`지금 때려요! ${Math.ceil(m.stOpenT || 0)}초`, t.x, t.y, Math.round(14 * ZOOM * 0.7), "#ffe27a", "center"); }
  },
  w4_rune(m) {
    const x = m.x, y = m.y, s = m.rnSym || 0, col = W4R.colors[s] || "#fff";
    drawBox(x - 0.48, y - 0.48, 0, 0.96, 0.96, 0.08, m.rnLit ? col : "#6a6458");
    drawBox(x - 0.36, y - 0.36, 0.08, 0.72, 0.72, 0.03, m.rnLit ? "#ffffff" : "#8a8270");
    const t = toScreen(x, y, 0.2); text(W4R.syms[s] || "?", t.x, t.y + 6 * ZOOM * 0.7, Math.round(20 * ZOOM * 0.7), col, "center");
  },
});
// 3단계 자리 바꾸기 화살표 (예고)
hookOn("drawFloor", () => {
  const b = w4fSeen("w4_statue"); if (!b || !b.stSwap) return;
  const s = b.stSwap; if (s.t > W4R.moveWarn) return;
  w4fLine(s.ax, s.ay, s.bx, s.by, "rgba(255,226,122,0.85)", 4, true);
}, 50);

if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w4_stSlam: { text: "원 밖으로! 그다음 글자 발판" },
  w4_stBeam: { text: "빛줄 옆으로!" },
  w4_stGuards: { text: "발판 순서가 먼저예요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.ruins = { 0: "가슴 글자 순서대로 바닥 발판을 밟아요!", 1: "석상 병사보다 발판이 먼저!", 2: "발판이 움직여요. 화살표를 봐요!" };
