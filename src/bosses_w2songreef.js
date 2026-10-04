// ===== 월드 2 보스: 해마 여왕 랄라 (노래하는 산호밭 songreef) =====
// 새 아이디어 하나: 노래 따라 하기 (사이먼 게임)
//   아레나 네 쪽에 큰 소라 4개 (빨강·파랑·노랑·초록, 소리가 다 달라요).
//   여왕이 "노래"를 부르면 소라가 하나씩 빛나요 (1단계 2개, 2단계 3개, 3단계 4개).
//   같은 순서로 소라를 때리면 (칼·화살·마법 아무거나) "노래 성공!" -> 여왕 비틀 + 껍데기가 열려 피해 ×2.
//   틀리면 "삐-" 하고 한 번 더 들려줘요 (아프지 않아요). 또 틀리거나 시간이 다 되면 다음 노래에 다시.
//   노래를 안 해도 이길 수 있어요 (껍데기가 닫혀 있으면 피해 ×0.5).
//   3단계 비틀기: 노래가 끝나면 소라 둘이 빙글 자리를 바꿔요 (색은 그대로라 색을 기억하면 돼요).
// 같이 하기: 노래 상태는 모두 여왕 몬스터 칸(sgMode·sgT·sgSeq·sgIn...)과 소라 칸(sgIdx·sgFlashT)에 있어요 (친구 화면에도 보여요).
//   소리는 그림 그릴 때 상태가 바뀌는 것을 보고 각 기기에서 내요.

Object.assign(MATERIALS, { w2_songShell: { name: "노래 소라", color: "#ff9ad6" } });

const SG_CONCH = [
  { name: "빨강", c: "#ff5a5a", lit: "#ffc0c0", dk: "#c03a3a", hz: 523, hue: 0 },
  { name: "파랑", c: "#4a8aff", lit: "#c0dcff", dk: "#2a5ac0", hz: 659, hue: 220 },
  { name: "노랑", c: "#ffd23f", lit: "#fff8b0", dk: "#c89a1a", hz: 784, hue: 50 },
  { name: "초록", c: "#4ad06a", lit: "#c0ffcc", dk: "#2a9a4a", hz: 1047, hue: 130 },
];
const SG_SPOTS = [[8, 0], [0, 8], [-8, 0], [0, -8]]; // 아레나 가운데에서 (축 위 8칸)
const SG_LIGHT = { easy: [0.95, 0.35], normal: [0.75, 0.3], hard: [0.6, 0.25], nightmare: [0.5, 0.22] }; // [빛나는 시간, 사이]
const SG_INPUT = { easy: 16, normal: 12, hard: 11, nightmare: 10 };
const SG_OPEN = 3.0;      // 노래 성공 뒤 비틀·껍데기 열림 (× 난이도 배수 w2StagK)
const SG_INTRO = 0.8;     // 노래 시작 전 숨 고르기
const SG_SWAP = { easy: 2.0, normal: 1.5, hard: 1.3, nightmare: 1.2 };

function sgDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function sgLight() { return SG_LIGHT[sgDiff()] || SG_LIGHT.normal; }
function sgQueen() { return monsters.find((o) => o.type === "w2_seaQueen" && o.hp > 0) || null; }
function sgConches() { return monsters.filter((o) => o.type === "w2_conch" && o.hp > 0); }
function sgConch(i) { return monsters.find((o) => o.type === "w2_conch" && o.sgIdx === i) || null; }
function sgShowLen(n) { const [on, gap] = sgLight(); return SG_INTRO + n * (on + gap) + 0.2; }
// 노래 보여주는 중 지금 빛나는 소라 (없으면 -1)
function sgLitNow(m) {
  if (m.sgMode !== "show" || !m.sgSeq) return -1;
  const [on, gap] = sgLight(), t = m.sgT - SG_INTRO;
  if (t < 0) return -1;
  const i = Math.floor(t / (on + gap));
  if (i >= m.sgSeq.length || t - i * (on + gap) > on) return -1;
  return m.sgSeq[i];
}

// ----- 소품: 큰 소라 -----
Object.assign(MONSTERS, {
  w2_conch: { name: "노래 소라", color: "#ff9ad6", shape: "w2_conch", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 2 },
});
// 따라 할 차례가 아니면 자동 조준에서 빼요
hookOn("untargetable", (o) => { if (o.type !== "w2_conch") return false; const q = sgQueen(); return !(q && q.sgMode === "input"); }, 50);

// ----- 기술 -----
Object.assign(ABILITIES, {
  w2_sgSong: { name: "노래 따라 하기", desc: "여왕이 노래를 불러요. 소라가 하나씩 빛나며 소리를 내요.",
    counter: "빛난 순서대로 소라를 때려요! 성공하면 여왕이 비틀비틀", tags: ["boss", "song"],
    telegraph: { shape: "none", at: "self", time: 0.8 }, cooldown: 99, range: [0, 30], damageMul: 0, anim: "raise", effect: { type: "w2_sgSong" } },
  w2_noteBurst: { name: "음표 팡팡", desc: "사방으로 음표 구슬을 쏴요.", counter: "음표 사이로 빠지거나 구르기",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 0.9 },
    cooldown: 6, range: [0, 30], damageMul: 0.8, anim: "raise", effect: { type: "nova", count: 10, speed: 4, color: "#ff9ad6" } },
  w2_tailSweep: { name: "꼬리 휘휘", desc: "돌돌 만 꼬리를 펴서 앞을 휘둘러요. 그다음 잠깐 숨을 골라요.", counter: "부채꼴 밖으로! 그다음 공격",
    tags: ["boss", "cone", "stagger"], telegraph: { shape: "cone", length: 4.5, angle: 1.3, at: "self", time: 1.1 },
    cooldown: 5, range: [0, 4.5], damageMul: 1.6, anim: "slam", staggerAfter: 1.6, effect: { type: "knockback", force: 1.6 } },
  w2_bubbleSong: { name: "거품 노래", desc: "노랫소리에 거품이 여러 군데 떨어져요.", counter: "원 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.2 },
    cooldown: 9, range: [0, 14], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 3.4, stagger: 0.18 } },
  w2_starCall: { name: "불가사리 합창단", desc: "빙글 불가사리 둘을 불러요.", counter: "웅크리면 물러나요. 돌고 난 뒤 때리기",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 30], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w2_starfish", count: 2 }, when: { maxSummons: 3 } },
});

// ----- 보스 -----
const SG_BOSS = { mapId: "songreef", type: "w2_seaQueen", name: "랄라", title: "해마 여왕", shape: "w2_seaQueen", color: "#ffb04a",
  size: 2.9, r: 1.0, hp: 200, damage: 1.8, speed: 1.0,
  material: { id: "w2_songShell", name: "노래 소라", color: "#ff9ad6" },
  arena: { size: 26, theme: { floor: "#d8bcd0", moss: "#ffd36a", wall: "#8a5aa0", darkness: 0.25, bg: "#200a30" } },
  phases: [
    { until: 0.66, gap: 1.8, pattern: ["w2_sgSong", "w2_noteBurst", "w2_tailSweep", "w2_bubbleSong"] },
    { until: 0.33, gap: 1.6, pattern: ["w2_sgSong", "w2_bubbleSong", "w2_starCall", "w2_noteBurst", "w2_tailSweep"] },
    { until: 0, gap: 1.4, pattern: ["w2_sgSong", "w2_noteBurst", "w2_tailSweep", "w2_starCall", "w2_bubbleSong", "w2_noteBurst"] },
  ] };
{
  const B = SG_BOSS;
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
      m.sgMode = ""; m.sgT = 0; m.sgIn = 0; m.sgReplays = 0; m.sgOpenT = 0;
      m.onPhase = (idx) => sgPhase(m, idx);
      return m;
    },
  };
}
function sgPhase(m, idx) {
  sgEndSong(m); m.sgOpenT = 0;
  if (idx === 1) showMessage("노래가 길어졌어요! 소라 세 개를 기억해요", 3, false, "#ffd36a");
  if (idx === 2) showMessage("이제 노래가 끝나면 소라가 자리를 바꿔요! 색을 기억해요", 3.2, false, "#ffd36a");
}
function sgEndSong(m) { m.sgMode = ""; m.sgT = 0; m.sgIn = 0; m.sgReplays = 0; m.sgSwap = null; }

// 노래 시작 (여왕 기술 w2_sgSong 이 끝나면)
function sgStartSong(m) {
  if (m.sgMode) return false; // 이미 노래 중
  const n = Math.min(4, 2 + (m.phaseIdx || 0));
  const seq = [];
  for (let i = 0; i < n; i++) { let k; do { k = Math.floor(Math.random() * 4); } while (seq.length && k === seq[seq.length - 1]); seq.push(k); }
  m.sgSeq = seq; m.sgMode = "show"; m.sgT = 0; m.sgIn = 0; m.sgReplays = 0; m.sgSwap = null;
  addFloatText(m.x, m.y + 0.5, "♪ 라라라~", "#ff9ad6", 24);
  return true;
}
hookOn("resolveCast", (c) => {
  if (c.ab.effect.type !== "w2_sgSong") return false;
  if (sgStartSong(c.m) && !c.m.sgTaught) { c.m.sgTaught = true; showMessage("소라가 빛나는 순서를 잘 봐요!", 2.4, false, "#ff9ad6"); }
  return true;
}, 15);

// 소라 놓기 (보스 첫 프레임) + 노래 진행 (방장)
hookOn("dungeonTick", (dt) => {
  const kh = game.keyhunt;
  if (!kh || !kh.inBoss || !kh.boss || kh.boss.type !== "w2_seaQueen") return;
  const m = kh.boss;
  if (!m.sgInit) {
    m.sgInit = true;
    const c = world.W / 2;
    SG_SPOTS.forEach(([ox, oy], i) => { const s = spawnProp("w2_conch", c + ox, c + oy, m); s.sgIdx = i; s.r = 0.55; s.sgFlashT = 0; s.sgWrongT = 0; });
  }
  for (const s of sgConches()) { if (s.sgFlashT > 0) s.sgFlashT = Math.max(0, s.sgFlashT - dt); if (s.sgWrongT > 0) s.sgWrongT = Math.max(0, s.sgWrongT - dt); }
  if (m.sgOpenT > 0) m.sgOpenT = Math.max(0, m.sgOpenT - dt);
  if (m.hp <= 0 || !m.sgMode) return;
  m.sgT += dt;
  if (m.sgMode === "show" || m.sgMode === "swap") m.gap = Math.max(m.gap || 0, 0.6); // 노래하는 동안은 공격하지 않아요
  if (m.sgMode === "show" && m.sgT >= sgShowLen(m.sgSeq.length)) {
    if ((m.phaseIdx || 0) >= 2 && !m.sgSwap) {
      // 3단계 비틀기: 소라 둘이 자리를 바꿔요
      const a = Math.floor(Math.random() * 4), b = (a + 1 + Math.floor(Math.random() * 3)) % 4;
      const A = sgConch(a), Bc = sgConch(b);
      if (A && Bc) { m.sgSwap = { a, b, ax: A.x, ay: A.y, bx: Bc.x, by: Bc.y }; m.sgMode = "swap"; m.sgT = 0; addFloatText(m.x, m.y + 0.5, "섞어요~!", "#ffd36a", 24); return; }
    }
    sgBeginInput(m);
  } else if (m.sgMode === "swap") {
    const S = m.sgSwap, T = SG_SWAP[sgDiff()] || 1.5, k = Math.min(1, m.sgT / T), e = k * k * (3 - 2 * k);
    const A = sgConch(S.a), Bc = sgConch(S.b);
    // 두 소라가 서로를 빙 돌아 자리를 바꿔요 (가운데에서 옆으로 휘어서 잘 보이게)
    const bend = Math.sin(e * Math.PI) * 2.5;
    const nx = -(S.by - S.ay), ny = S.bx - S.ax, nl = Math.hypot(nx, ny) || 1;
    if (A) { A.x = S.ax + (S.bx - S.ax) * e + nx / nl * bend; A.y = S.ay + (S.by - S.ay) * e + ny / nl * bend; }
    if (Bc) { Bc.x = S.bx + (S.ax - S.bx) * e - nx / nl * bend; Bc.y = S.by + (S.ay - S.by) * e - ny / nl * bend; }
    if (k >= 1) { if (A) { A.x = S.bx; A.y = S.by; } if (Bc) { Bc.x = S.ax; Bc.y = S.ay; } sgBeginInput(m); }
  } else if (m.sgMode === "input" && m.sgT >= (SG_INPUT[sgDiff()] || 12)) {
    addFloatText(m.x, m.y + 0.5, "시간 끝!", "#bbbbbb", 20);
    showMessage("아쉬워요! 다음 노래에 다시 해 봐요", 2, false, "#ff9ad6");
    sgEndSong(m);
  }
}, 40);
function sgBeginInput(m) {
  m.sgMode = "input"; m.sgT = 0; m.sgIn = 0;
  showMessage("따라 해요! 같은 순서로 소라를 때려요", 2.2, false, "#ffd36a");
}

// 소라 맞기: 따라 할 차례에만 세요 (소라는 부서지지 않아요). 늑대가 문 것은 빼요
hookOn("monsterDamage", (h) => {
  const s = h.m;
  if (!s || s.type !== "w2_conch") return false;
  const q = sgQueen();
  if (!q || q.sgMode !== "input" || (h.opts && h.opts.dot)) return true;
  if (typeof allies !== "undefined" && allies.some((w) => Math.abs(w.x - h.fromX) < 0.01 && Math.abs(w.y - h.fromY) < 0.01)) return true;
  if (game.time - (s.sgLastHit || -9) < 0.3) return true; // 한 번 휘두름에 여러 번 맞아도 한 번으로
  s.sgLastHit = game.time;
  if (s.sgIdx === q.sgSeq[q.sgIn]) {
    q.sgIn++; s.sgFlashT = 0.45;
    addFloatText(s.x, s.y + 0.4, `♪ ${q.sgIn}/${q.sgSeq.length}`, SG_CONCH[s.sgIdx].lit, 22);
    if (q.sgIn >= q.sgSeq.length) sgSuccess(q);
  } else {
    s.sgWrongT = 0.6;
    addFloatText(s.x, s.y + 0.4, "삐-", "#bbbbbb", 20);
    if (q.sgReplays < 1) {
      q.sgReplays++; q.sgMode = "show"; q.sgT = 0; q.sgIn = 0;
      showMessage("틀렸어요! 한 번 더 들려줄게요", 2, false, "#ff9ad6");
    } else {
      showMessage("아쉬워요! 다음 노래에 다시 해 봐요", 2, false, "#ff9ad6");
      sgEndSong(q);
    }
  }
  return true;
}, 4);
function sgSuccess(m) {
  sgEndSong(m);
  casts = casts.filter((c) => c.m !== m); m.charge = null; m.state = "chase"; m.queue = [];
  m.sgOpenT = m.stagger = SG_OPEN * w2StagK();
  addFloatText(m.x, m.y, "노래 성공!", "#ffd36a", 30);
  showMessage("노래 성공! 껍데기가 열렸어요, 지금 마구 때려요", 2.4, false, "#ffd36a");
  game.shake = Math.max(game.shake, 0.35);
  for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2; addSparkle(m.x + Math.cos(a) * 0.6, m.y + Math.sin(a) * 0.6, 1 + Math.random(), { vz: 2, life: 0.9, size: 0.8, hue: 45 }); }
}
// 여왕 피해: 껍데기가 닫혀 있으면 ×0.5, 노래 성공 뒤엔 ×2
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (!m || m.type !== "w2_seaQueen") return false;
  const dot = h.opts && h.opts.dot;
  if (m.sgOpenT > 0) { h.dmg *= 2; if (!dot && Math.random() < 0.3) addFloatText(m.x, m.y + 0.4, "노래! x2", "#ffd36a", 18); }
  else {
    h.dmg *= 0.5;
    if (!dot && game.time - (m.sgHardT || -9) > 0.7) { m.sgHardT = game.time; addFloatText(m.x, m.y + 0.3, "단단!", "#bbbbbb", 16); }
  }
  return false;
}, 25);

// ----- 소리 (각 기기에서: 상태가 바뀐 것을 보고) -----
function sgTone(hz, dur = 0.35, type = "triangle", vol = 0.12) { if (typeof tone === "function") try { tone(hz, dur, type, vol); } catch (e) { /* 소리 없음 */ } }
function sgSounds(m) {
  const lit = sgLitNow(m), [on, gap] = sgLight();
  const key = lit >= 0 ? `s${m.sgReplays}:${Math.floor((m.sgT - SG_INTRO) / (on + gap))}` : "";
  if (key && key !== m._sgKey) {
    sgTone(SG_CONCH[lit].hz, Math.min(0.6, on));
    const s = sgConch(lit); if (s) { addRing(s.x, s.y, { speed: 4, life: 0.5, hue: SG_CONCH[lit].hue }); addRing(s.x, s.y, { speed: 2.5, life: 0.6, hue: SG_CONCH[lit].hue }); }
  }
  m._sgKey = key;
  for (const s of sgConches()) {
    if (s.sgFlashT > 0 && !s._sgF) sgTone(SG_CONCH[s.sgIdx].hz, 0.3);
    if (s.sgWrongT > 0 && !s._sgW) sgTone(180, 0.4, "square", 0.08);
    s._sgF = s.sgFlashT > 0; s._sgW = s.sgWrongT > 0;
  }
  if (m.sgOpenT > 0 && !m._sgOpen) SG_CONCH.forEach((c, i) => sgToneLater(c.hz, i * 0.09));
  m._sgOpen = m.sgOpenT > 0;
}
function sgToneLater(hz, delay) { if (typeof tone === "function") try { tone(hz, 0.25, "triangle", 0.1, null, delay); } catch (e) { /* 소리 없음 */ } }

// ----- 그림: 노래 표시 (빛나는 소라 위 음표, 따라 하기 남은 시간·진행) -----
hookOn("drawTelegraphsAfter", () => {
  const m = sgQueen();
  if (!m || game.scene !== "dungeon") return;
  sgSounds(m);
  if (!m.sgMode) return;
  const lit = sgLitNow(m);
  if (lit >= 0) { const s = sgConch(lit); if (s) { const p = toScreen(s.x, s.y, 2.2 + Math.sin(game.time * 8) * 0.1); text("♪", p.x, p.y, 48 * ZOOM, "#ffffff", "center"); } }
  const top = toScreen(m.x, m.y, 3.4);
  if (m.sgMode === "show") text(m.sgReplays ? "♪ 한 번 더~" : "♪ 잘 들어요", top.x, top.y, 20 * ZOOM, "#ff9ad6", "center");
  if (m.sgMode === "swap" && m.sgSwap) {
    text("섞어요~", top.x, top.y, 20 * ZOOM, "#ffd36a", "center");
    for (const i of [m.sgSwap.a, m.sgSwap.b]) { const s = sgConch(i); if (s) { const p = toScreen(s.x, s.y, 1.9); text("↻", p.x, p.y, 30 * ZOOM, "#ffd36a", "center"); } }
  }
  if (m.sgMode === "input" && m.sgSeq) {
    const left = Math.max(0, Math.ceil((SG_INPUT[sgDiff()] || 12) - m.sgT));
    text(`따라 해요! ${left}`, top.x, top.y, 20 * ZOOM, "#ffd36a", "center");
    // 진행 동그라미 (맞힌 것만 색이 보여요)
    const n = m.sgSeq.length, w = 16 * ZOOM;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = top.x + (i - (n - 1) / 2) * w * 1.4, y = top.y + 18 * ZOOM;
      ctx.beginPath(); ctx.arc(x, y, w / 2, 0, Math.PI * 2);
      ctx.fillStyle = i < m.sgIn ? SG_CONCH[m.sgSeq[i]].c : "rgba(255,255,255,0.25)"; ctx.fill();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    // 쉬움: 다음 소라에 작은 화살표 힌트
    if (sgDiff() === "easy") { const s = sgConch(m.sgSeq[m.sgIn]); if (s) { const p = toScreen(s.x, s.y, 2.0 + Math.sin(game.time * 6) * 0.15); text("▼", p.x, p.y, 22 * ZOOM, "#ffffff", "center"); } }
  }
}, 50);
// 빛나는 소라·열린 여왕은 빛나요 (어두운 기기에서도 잘 보이게)
hookOn("lights", (lights) => {
  const m = sgQueen();
  if (!m) return;
  const lit = sgLitNow(m);
  for (const s of sgConches()) {
    const on = s.sgIdx === lit || s.sgFlashT > 0;
    lights.push({ x: s.x, y: s.y, radius: on ? 3.2 : 1.6, power: on ? 1 : 0.45 });
  }
  if (m.sgOpenT > 0) lights.push({ x: m.x, y: m.y, radius: 2.6, power: 0.8 });
}, 61);

// ----- 모양 -----
Object.assign(EXTRA_SHAPES, {
  // 큰 소라: 바닥 받침 + 빙글 감긴 3단 껍데기 + 나팔 입구. 빛날 때 밝은 색 + 살짝 커져요
  w2_conch(m) {
    const q = sgQueen(), C = SG_CONCH[m.sgIdx || 0] || SG_CONCH[0];
    const on = (q && sgLitNow(q) === m.sgIdx) || m.sgFlashT > 0;
    const wrong = m.sgWrongT > 0, ready = q && q.sgMode === "input";
    const k = on ? 1.18 : 1, col = wrong ? "#9a9a9a" : on ? C.lit : C.c, dk = wrong ? "#6a6a6a" : C.dk;
    const x = m.x, y = m.y, bob = on ? 0.08 : ready ? Math.sin(game.time * 4 + (m.sgIdx || 0)) * 0.03 : 0;
    drawBox(x - 0.6, y - 0.6, 0, 1.2, 1.2, 0.12, "#a07ab0");
    drawBox(x - 0.45 * k, y - 0.4 * k, 0.12 + bob, 0.9 * k, 0.8 * k, 0.45 * k, col);
    drawBox(x + 0.38 * k, y - 0.28 * k, 0.16 + bob, 0.2 * k, 0.56 * k, 0.4 * k, "#fff0e8"); // 나팔 입구
    drawBox(x - 0.36 * k, y - 0.32 * k, 0.12 + 0.45 * k + bob, 0.66 * k, 0.6 * k, 0.32 * k, dk);
    drawBox(x - 0.26 * k, y - 0.22 * k, 0.12 + 0.77 * k + bob, 0.46 * k, 0.42 * k, 0.26 * k, col);
    drawBox(x - 0.14 * k, y - 0.12 * k, 0.12 + 1.03 * k + bob, 0.24 * k, 0.22 * k, 0.2 * k, dk);
    if (on && Math.random() < 0.3) addSparkle(x, y, 1.2, { vz: 1.5, life: 0.6, size: 0.6, hue: 45 });
  },
  // 해마 여왕: 금빛 주황 몸, 돌돌 만 꼬리, 산호 왕관, 소라 마이크 지팡이
  w2_seaQueen(m) {
    const a = bossMotion(m), P = [];
    const c = "#ffb04a", c2 = "#e0862a", cream = "#fff0c8";
    const bob = Math.sin(game.time * 2.2 + m.x) * 0.02, sq = a.stag ? 0.9 : 1, sing = m.sgMode === "show" ? Math.sin(game.time * 12) * 0.01 : 0;
    // 돌돌 꼬리
    P.push([-0.1, 0, 0, 0.16, 0.14, 0.08, c2], [-0.2, 0, 0.05, 0.1, 0.12, 0.1, c2], [-0.15, 0, 0.14, 0.08, 0.1, 0.07, c], [-0.07, 0, 0.1, 0.06, 0.08, 0.05, c2]);
    // 몸 (아래 -> 위), 배는 크림색 줄
    P.push([-0.02, 0, 0.08 + bob, 0.2, 0.22, 0.16 * sq, c], [0.08, 0, 0.1 + bob, 0.06, 0.18, 0.14 * sq, cream]);
    P.push([0, 0, 0.24 + bob, 0.22, 0.24, 0.18 * sq, c], [0.1, 0, 0.26 + bob, 0.06, 0.2, 0.15 * sq, cream]);
    for (let i = 0; i < 3; i++) P.push([0.135, 0, 0.13 + i * 0.09 + bob, 0.01, 0.2, 0.012, c2]);
    // 등지느러미 (살랑)
    P.push([-0.14, 0, 0.24 + bob, 0.04, 0.02 + Math.abs(Math.sin(game.time * 6)) * 0.05, 0.16, "#ffb0e0"]);
    // 머리 + 긴 주둥이 (노래할 땐 살짝 떨려요)
    P.push([0.02, 0, 0.42 + bob + sing, 0.22, 0.22, 0.16, c], [0.18, 0, 0.46 + bob + sing, 0.16, 0.09, 0.08, c], [0.27, 0, 0.46 + bob + sing, 0.04, 0.11, 0.09, c2]);
    P.push([-0.1, 0, 0.5 + bob, 0.06, 0.04, 0.08, c2]);
    eyes(P, 0.135, 0.07, 0.48 + bob, 0.06, "#2a1a10", a.stag);
    P.push([0.135, 0.105, 0.455 + bob, 0.01, 0.04, 0.02, "#ff9a9a", true], [0.135, -0.105, 0.455 + bob, 0.01, 0.04, 0.02, "#ff9a9a", true]); // 볼터치
    // 산호 왕관
    P.push([0, 0, 0.58 + bob, 0.18, 0.18, 0.04, "#ff8f7a"], [0.05, 0.06, 0.62 + bob, 0.04, 0.04, 0.08, "#ff8f7a"], [-0.05, -0.05, 0.62 + bob, 0.04, 0.04, 0.07, "#ff6aa0"], [0.05, -0.06, 0.62 + bob, 0.04, 0.04, 0.06, "#ff6aa0"], [0, 0, 0.62 + bob, 0.04, 0.04, 0.11, "#ffd36a"]);
    // 소라 마이크 지팡이 (기술 쓸 때 번쩍 들어요)
    const up = a.raise * 0.12;
    P.push([0.12, 0.18, 0.1 + up, 0.03, 0.03, 0.3, "#f2d6b0"], [0.12, 0.18, 0.4 + up, 0.09, 0.09, 0.09, "#ff9ad6"], [0.12, 0.18, 0.49 + up, 0.05, 0.05, 0.04, "#fff0e8"]);
    // 열린 껍데기: 가슴의 금빛 조개가 반짝
    if (m.sgOpenT > 0) P.push([0.14, 0, 0.3 + bob, 0.03, 0.12, 0.1, "#fffaf0", true]);
    drawVoxelParts(m, P, { top: 0.78 });
  },
});

// ----- 안내 문구 -----
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_sgSong: { text: "빛나는 순서를 기억해요!", do: true },
  w2_noteBurst: { text: "음표 사이로!" },
  w2_tailSweep: { text: "부채꼴 밖으로! 그다음 공격" },
  w2_bubbleSong: { text: "원 사이로 걸어가요" },
  w2_starCall: { text: "불가사리가 돌면 물러나요" },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.songreef = { 1: "노래가 길어졌어요! 세 개를 기억해요", 2: "소라가 자리를 바꿔요! 색을 기억해요" };
