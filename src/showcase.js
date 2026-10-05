// ===== 보스 연출, 트로피, 도감 =====
// 1) 보스가 쓰러지면 느린 화면으로 휘청이다 옆으로 쓰러지고, 금빛 불꽃놀이로 축하해요
// 2) 보스마다 다른 등장 소리 / 쓰러짐 소리
// 3) 캠프 트로피 선반: 잡은 보스마다 작은 블록 트로피 (가까이 가면 이긴 횟수·최고 기록)
// 4) 도감: 캠프의 "도감 책" -> 몬스터 / 보스 / 정예 속성 카드 (본 것만 그림, 못 본 건 ???)
// 게임 함수를 감싸지 않고 hooks.js 알림 지점에만 붙어요. 이 파일은 bossroom.js 다음에 불러요.

// ---------------- 저장 ----------------
hookOn("profileLoaded", (pr) => {
  pr.codex = pr.codex || {};
  const c = pr.codex;
  c.seen = c.seen || {};       // 몬스터 id -> true
  c.killed = c.killed || {};   // 몬스터 id -> 잡은 수
  c.affix = c.affix || {};     // 정예 속성 id -> true
  c.bossSeen = c.bossSeen || {}; // 맵 id -> true
  pr.trophies = pr.trophies || {}; // 맵 id -> { wins, best(초) }
}, 60);

// ---------------- 보스별 소리 ----------------
const BOSS_VOICE = {
  cave:    { intro: () => { tone(160, 0.5, "triangle", 0.09, 90); tone(240, 0.3, "sine", 0.05, 160, 0.25); }, fall: () => { tone(200, 0.6, "triangle", 0.08, 60); noise(0.5, 0.2, 300, "lowpass", 0.3); } },
  crypt:   { intro: () => { [300, 250, 200].forEach((f, i) => tone(f, 0.08, "square", 0.06, null, i * 0.09)); tone(90, 0.6, "sawtooth", 0.08, 60, 0.3); }, fall: () => { for (let i = 0; i < 6; i++) tone(500 - i * 50, 0.06, "square", 0.05, null, i * 0.08); noise(0.4, 0.3, 400, "lowpass", 0.5); } },
  jungle:  { intro: () => { tone(120, 0.4, "sine", 0.1, 260); tone(260, 0.3, "sine", 0.07, 110, 0.35); }, fall: () => { tone(300, 0.7, "sine", 0.09, 60); noise(0.3, 0.2, 800, "lowpass", 0.2); } },
  desert:  { intro: () => { noise(0.8, 0.15, 1800, "bandpass"); tone(110, 0.7, "sawtooth", 0.07, 80); }, fall: () => { noise(1.0, 0.2, 1200); tone(140, 0.8, "sawtooth", 0.06, 50); } },
  ice:     { intro: () => { [1800, 2400, 2100, 2800].forEach((f, i) => tone(f, 0.15, "sine", 0.05, null, i * 0.08)); tone(200, 0.6, "triangle", 0.06, 120); }, fall: () => { for (let i = 0; i < 8; i++) tone(3000 - i * 250, 0.08, "sine", 0.04, null, i * 0.06); noise(0.3, 0.25, 4000, "highpass", 0.4); } },
  swamp:   { intro: () => { noise(0.5, 0.2, 2500, "highpass"); tone(400, 0.3, "sawtooth", 0.05, 900, 0.2); }, fall: () => { tone(800, 0.5, "sawtooth", 0.05, 120); noise(0.4, 0.2, 600, "lowpass", 0.3); } },
  volcano: { intro: () => { tone(80, 1.0, "sawtooth", 0.12, 50); noise(1.0, 0.3, 300, "lowpass"); tone(160, 0.6, "square", 0.05, 90, 0.3); }, fall: () => { tone(120, 1.0, "sawtooth", 0.1, 40); noise(0.9, 0.4, 250, "lowpass", 0.4); } },
  castle:  { intro: () => { [196, 233, 277].forEach((f, i) => tone(f, 0.5, "triangle", 0.06, null, i * 0.12)); tone(70, 0.8, "sawtooth", 0.08, 50, 0.3); }, fall: () => { [277, 233, 196, 147].forEach((f, i) => tone(f, 0.3, "triangle", 0.06, null, i * 0.15)); } },
  mine:    { intro: () => { tone(1200, 0.3, "triangle", 0.06, 1500); tone(60, 0.8, "square", 0.09, 40, 0.1); }, fall: () => { for (let i = 0; i < 5; i++) tone(1600 + i * 300, 0.1, "triangle", 0.05, null, i * 0.07); noise(0.6, 0.35, 350, "lowpass", 0.4); } },
  sky:     { intro: () => { noise(1.0, 0.18, 900, "bandpass"); tone(400, 0.6, "sine", 0.05, 800); }, fall: () => { noise(0.9, 0.2, 600); tone(700, 0.8, "sine", 0.05, 150); } },
  coral:   { intro: () => { tone(70, 0.9, "sine", 0.12, 45); noise(0.6, 0.2, 500, "lowpass", 0.2); }, fall: () => { noise(0.8, 0.25, 700, "lowpass"); tone(90, 1.0, "sine", 0.1, 35); } },
  void:    { intro: () => { tone(55, 1.2, "sawtooth", 0.1, 40); tone(110, 1.2, "sawtooth", 0.05, 82, 0.1); noise(1.0, 0.15, 200, "lowpass"); }, fall: () => { tone(440, 1.2, "sawtooth", 0.06, 40); noise(1.0, 0.3, 300, "lowpass", 0.5); } },
};
function bossVoice(mapId, which) {
  try { const v = BOSS_VOICE[mapId]; if (v && v[which]) v[which](); else if (which === "intro") sfx.boss(); else sfx.boom(); } catch (e) { /* 소리 실패는 무시 */ }
}

// ---------------- 보스 쓰러짐 연출 ----------------
const SHOW = {
  dying: null,      // { boss, t, dur, side, mapId, impact }
  allowEnd: false,
  celebrate: 0,     // 축하 남은 시간
  mat: null,        // { id, name, color, n }
  bossT: 0,         // 이번 보스전 걸린 시간 (실제 초)
  prevInBoss: false,
  newRecord: false,
  toast: [],        // 도감 알림 [{ name, t }]
  seenT: 0,
};
const DYING_DUR = 1.8; // 실제 시간(초). 이 동안 화면은 0.4배 속도
const SLOW = 0.4;

function startBossDying(kh) {
  const b = kh.boss;
  const def = typeof bossDefFor === "function" ? bossDefFor(kh.mapId) : null;
  // 주인공 반대쪽으로 쓰러져요 (주인공을 덮지 않게)
  const p0 = game.player, sb = toScreen(b.x, b.y), sp = p0 ? toScreen(p0.x, p0.y) : sb;
  SHOW.dying = { boss: b, t: 0, dur: DYING_DUR, side: sp.x >= sb.x ? -1 : 1, mapId: kh.mapId, impact: false, color: (def && def.material && def.material.color) || "#ffd23f" };
  b.flash = 0; b.state = "idle"; b.moving = false;
  casts = []; zones = [];
  game.shake = Math.max(game.shake, 0.4);
  bossVoice(kh.mapId, "fall");
  for (let i = 0; i < 3; i++) addRing(b.x, b.y, { speed: 5, life: 0.7, gold: true, delay: i * 0.2 });
  // 트로피 기록
  const pr = game.profile;
  // 트로피 횟수·가장 빠른 시간은 보스를 쓰러뜨릴 때 이미 남겼어요 (bossroom.js -> records.js "bossWin")
  const t = (pr.trophies && pr.trophies[kh.mapId]) || { wins: 0, best: 0 };
  const sec = Math.round(SHOW.bossT * 10) / 10;
  SHOW.newRecord = !!t.best && t.best === sec;
  // 받을 보스 부품 (bossroom.js 가 이미 넣었어요)
  const mats = game.run && game.run.mats;
  if (def && def.material) SHOW.mat = { ...def.material, n: (mats && mats[def.material.id]) || 1 };
  else SHOW.mat = null;
}

hookOn("endRun", (win) => {
  const kh = game.keyhunt;
  if (!win || SHOW.allowEnd || game.mode !== "dungeon" || !kh || !kh.inBoss || !kh.bossWon || !kh.boss) return false;
  if (!SHOW.dying) startBossDying(kh);
  return true; // 연출이 끝나면 다시 불러요
}, 40);

hookOn("timeScale", (dt) => {
  const d = SHOW.dying;
  // 보스전 시간 재기 (실제 시간)
  const kh = game.keyhunt;
  const inBoss = !!(kh && kh.inBoss && game.scene === "dungeon");
  if (inBoss && !SHOW.prevInBoss) { SHOW.bossT = 0; bossVoice(kh.mapId, "intro"); if (game.profile.codex) game.profile.codex.bossSeen[kh.mapId] = true; }
  SHOW.prevInBoss = inBoss;
  if (inBoss && !kh.bossDone && !game.overlay) SHOW.bossT += dt;
  if (SHOW.celebrate > 0) SHOW.celebrate -= dt;
  for (const t of SHOW.toast) t.t -= dt;
  SHOW.toast = SHOW.toast.filter((t) => t.t > 0);
  if (!d) return dt;
  if (game.scene !== "dungeon" || !kh) { SHOW.dying = null; return dt; }
  if (game.overlay) return dt;
  d.t += dt;
  // 연출 중엔 안 다쳐요 (무적 시간을 조금 걸어 둬요. 이 값이면 깜빡이지 않아요: player.js 의 깜빡임 계산). 같이 하는 친구도
  for (const p of allPlayers()) p.hurtTimer = Math.max(p.hurtTimer || 0, 1.5 / 14);
  arrows = []; // 몬스터 화살·탄 (주인공 화살은 shots)
  if (typeof hazards !== "undefined") hazards = [];
  const k = d.t / d.dur;
  // 블록이 떨어져요
  if (Math.random() < dt * 14) spawnBurst(d.boss.x + (Math.random() - 0.5), d.boss.y + (Math.random() - 0.5), [d.color, "#ffffff", "#444444"], 2);
  if (!d.impact && k > 0.55) {
    d.impact = true;
    game.shake = Math.max(game.shake, 0.55);
    if (typeof sfx !== "undefined") sfx.slam();
    for (let i = 0; i < 2; i++) addRing(d.boss.x + d.side * 1.2, d.boss.y, { speed: 8, life: 0.6, gold: true, delay: i * 0.12 });
    spawnBurst(d.boss.x + d.side, d.boss.y, [d.color, "#ffe27a", "#888888"], 26);
  }
  if (d.t >= d.dur) {
    SHOW.dying = null;
    SHOW.fallen = { boss: d.boss, side: d.side, t: 0 };
    SHOW.allowEnd = true;
    endRun(true);
    SHOW.allowEnd = false;
    game.messageTimer = 0; // "던전 클리어!" 대신 큰 축하 글자
    startCelebration();
    return dt;
  }
  return dt * SLOW;
}, 5);

function startCelebration() {
  SHOW.celebrate = 3;
  if (typeof sfx !== "undefined") sfx.levelUp();
  const p = game.player;
  for (let n = 0; n < 5; n++) {
    const cx = p.x + (Math.random() - 0.5) * 6, cy = p.y + (Math.random() - 0.5) * 6, z = 3 + Math.random() * 2, hue = Math.random() * 360;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, s = 2.5 + Math.random();
      addSparkle(cx, cy, z, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: (Math.random() - 0.3) * 2, gravity: 3, life: 1.1 + Math.random() * 0.4, size: 0.7, hue: n % 2 ? hue : undefined, gold: n % 2 === 0 });
    }
  }
}

// 쓰러지는 보스 그림 (보스가 몬스터 목록에서 빠진 뒤에도 그려요)
function drawFallingBoss(b, k, side, fadeOut) {
  const s = toScreen(b.x, b.y, 0);
  let ang = 0;
  if (k < 0.3) ang = Math.sin(k * 60) * 0.06 * (k / 0.3);               // 휘청휘청
  else { const q = Math.min(1, (k - 0.3) / 0.25); ang = q * q * 1.05; if (q >= 1) ang = 1.05 - Math.sin(Math.min(1, (k - 0.55) / 0.15) * Math.PI) * 0.1; } // 쿵! 하고 살짝 튀어요
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(ang * side);
  ctx.translate(-s.x, -s.y + (k > 0.55 ? (k - 0.55) * 18 * ZOOM : 0));
  ctx.globalAlpha *= fadeOut;
  b.flash = 0;
  try { drawMonster(b); } catch (e) { /* 그림 실패는 무시 */ }
  ctx.restore();
}
hookOn("worldThings", (things) => {
  const d = SHOW.dying;
  if (d && game.scene === "dungeon") { const k = Math.min(1, d.t / d.dur); things.push({ depth: d.boss.x + d.boss.y, x: d.boss.x, y: d.boss.y, draw: () => drawFallingBoss(d.boss, k, d.side, k > 0.7 ? 1 - (k - 0.7) / 0.3 * 0.5 : 1) }); }
  const f = SHOW.fallen;
  if (f && game.scene === "dungeon" && game.result) {
    things.push({ depth: f.boss.x + f.boss.y, x: f.boss.x, y: f.boss.y, draw: () => drawFallingBoss(f.boss, 1, f.side, Math.max(0, 0.5 - (3 - SHOW.celebrate) / 0.8)) });
  } else if (f && game.scene !== "dungeon") SHOW.fallen = null;
}, 60);
hookOn("reset", () => { SHOW.dying = null; SHOW.fallen = null; }, 60);

// 축하 글자, 부품 아이콘, 도감 알림
hookOn("hudDraw", () => {
  if (SHOW.dying) {
    const k = SHOW.dying.t / SHOW.dying.dur;
    ctx.fillStyle = `rgba(0,0,0,${0.18 * Math.sin(Math.min(1, k) * Math.PI)})`;
    ctx.fillRect(0, 0, view.w, view.h);
  }
  if (SHOW.celebrate > 0 && game.overlay !== "result") {
    const t = 3 - SHOW.celebrate;
    const a = Math.min(1, t * 3, SHOW.celebrate * 2);
    const sc = 1 + Math.max(0, 0.4 - t) * 1.5;
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    text("보스를 물리쳤어요!", view.w / 2, view.h * 0.3, 44 * sc, rainbow(game.time * 160, 70), "center");
    const tr = game.keyhunt && game.profile.trophies[game.keyhunt.mapId];
    if (tr) text(`걸린 시간 ${fmtTime(SHOW.bossT)}${SHOW.newRecord ? " · 최고 기록!" : ""}`, view.w / 2, view.h * 0.3 + 38, 18, SHOW.newRecord ? "#ffe27a" : "#ddd", "center");
    if (SHOW.mat) {
      // 부품 아이콘이 튀어나와요
      const up = Math.min(1, t / 0.5);
      const y = view.h * 0.3 + 90 - Math.sin(up * Math.PI) * 30 - up * 10;
      const s = 34 + Math.sin(game.time * 6) * 2;
      const x = view.w / 2;
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(x - s / 2 + 4, y - s / 2 + 4, s, s);
      ctx.fillStyle = SHOW.mat.color; ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(x - s / 2 + 4, y - s / 2 + 4, s * 0.35, s * 0.2);
      ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2; ctx.strokeRect(x - s / 2, y - s / 2, s, s);
      text(`${SHOW.mat.name} x${SHOW.mat.n}`, x, y + s / 2 + 24, 18, "#fff", "center");
    }
    ctx.restore();
  }
  // 도감 알림
  // 오른쪽 버튼들과 겹치면 위로 올려요 (hud.js hudAvoidY)
  // 오른쪽에 자리가 없으면(휴대폰) 왼쪽 가운데, 그다음 위쪽 가운데
  const tn = SHOW.toast.length, tw0 = 230, th0 = tn * 40 - 6;
  const tp = tn ? (typeof hudPlace === "function" ? hudPlace(tw0, th0, [
    { x: view.w - tw0 - 16, y: view.h * 0.62 - (tn - 1) * 40, minY: 84 },
    { x: 16, y: view.h * 0.62 - (tn - 1) * 40, minY: 190 },
    { x: view.w / 2 - tw0 / 2, y: view.h * 0.5 - th0 / 2, minY: 150 },
  ]) : { x: view.w - tw0 - 16, y: view.h * 0.62 - (tn - 1) * 40 }) : { x: 0, y: 0 };
  const tx0 = tp.x, tTop = tp.y;
  SHOW.toast.forEach((t, i) => {
    const a = Math.min(1, t.t * 2, (2.6 - t.t) * 4);
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    const w = tw0, h = 34, x = tx0, y = tTop + (tn - 1 - i) * 40;
    if (i === 0) SHOW.lastToastRect = { x, y: tTop, w, h: tn * 40 - 6 };
    roundRectPath(x, y, w, h, 8); ctx.fillStyle = "rgba(30,24,10,0.85)"; ctx.fill();
    ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 2; ctx.stroke();
    text(`도감에 추가! ${t.name}`, x + 12, y + 23, 15, "#ffe27a");
    ctx.restore();
  });
}, 60);

function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// ---------------- 도감 기록 ----------------
const CODEX_SKIP = new Set(["bossEgg", "sarcophagus", "bossRock", "icePillar", "fireBrazier", "b2_crystal", "crackBlock", "slimeSmall"]);
function bossMonsterIds() {
  const s = new Set();
  if (typeof BOSS_DEFS !== "undefined") for (const d of Object.values(BOSS_DEFS)) s.add(d.id);
  return s;
}
function codexMonsterIds() {
  const bosses = bossMonsterIds();
  return Object.keys(MONSTERS).filter((id) => !id.startsWith("__") && !CODEX_SKIP.has(id) && !bosses.has(id) && !MONSTERS[id].untargetable && MONSTERS[id].behavior !== "prop" && !MONSTERS[id].codexSkip);
}
function codexSkipMonster(m) {
  return !m || !m.def || m.clone || m.b2Decoy || m.boss || m.def.untargetable || m.def.behavior === "prop" || m.def.codexSkip || CODEX_SKIP.has(m.type) || bossMonsterIds().has(m.type); // 소품(소라·조개·파이프·눈덩이)은 도감에 안 넣어요
}

hookOn("dungeonTick", (dt) => {
  SHOW.seenT -= dt;
  if (SHOW.seenT > 0) return;
  SHOW.seenT = 0.3;
  // 주인공 누구든(같이 하기: 친구 포함) 가까이서 본 몬스터는 모두의 도감에 (records.js "seen")
  const ps = allPlayers().filter((q) => q && q.hp > 0), c = game.profile.codex;
  if (!ps.length || !c) return;
  if (!SHOW.runSeen || SHOW.runSeenN !== allPlayers().length) { SHOW.runSeen = new Set(); SHOW.runSeenN = allPlayers().length; } // 친구가 새로 오면 다시 알려줘요
  const runSeen = SHOW.runSeen;
  for (const m of monsters) {
    if (m.hp <= 0 || (m.appearTimer || 0) > 0 || m.hidden) continue;
    if (!ps.some((p) => Math.hypot(m.x - p.x, m.y - p.y) <= 6.5)) continue;
    if (m.elite && m.affixes) for (const id of m.affixes) if (!runSeen.has("a:" + id)) { runSeen.add("a:" + id); recShared("affix", { id }); }
    if (codexSkipMonster(m) || runSeen.has(m.type)) continue;
    runSeen.add(m.type);
    recShared("seen", { type: m.type });
  }
}, 60);
hookOn("dungeonStarted", () => { SHOW.runSeen = new Set(); }, 60);
// 도감에 처음 들어온 몬스터·정예 속성 알림 (내 도감에 처음일 때만, records.js)
function codexSeenToast(name) {
  SHOW.toast.push({ name, t: 2.6 });
  if (SHOW.toast.length > 3) SHOW.toast.shift();
  if (typeof sfx !== "undefined") sfx.sparkle();
}
// 도감 잡은 수는 몬스터를 잡을 때 records.js "kill" 이 남겨요 (같이 하기: 친구 도감에도)

// ---------------- 집: 트로피 홀, 도감 책 (house.js 의 집 안) ----------------
// 트로피 전시대: 월드마다 하나씩 2 x 2 로 (전시대마다 2줄 x 7칸, 칸 사이 1.2칸). 뒷줄은 계단 위(높이 0.42)라 앞줄에 안 가려요
const TROPHY_GALLERIES = [1, 2, 3, 4].map((w, i) => {
  const row = Math.floor(i / 2), G = { world: w, x0: HOUSE.x0 + 1.0 + (i % 2) * 9.6, dx: 1.2, backY: HOUSE.y0 + 1.0 + row * 4.4, frontY: HOUSE.y0 + 2.4 + row * 4.4, step: 0.42, cols: 7, spots: [] };
  for (let k = 0; k < G.cols * 2; k++) { const back = k < G.cols; G.spots.push({ x: G.x0 + (k % G.cols) * G.dx, y: back ? G.backY : G.frontY, z: back ? G.step : 0 }); }
  return G;
});
const TROPHY_GALLERY = TROPHY_GALLERIES[0]; // 월드 1 전시대
const TROPHY_SPOTS = TROPHY_GALLERY.spots;
const CODEX_STAND = HOUSE_SPOTS.codex;

// 그 월드 보스들 (집에는 모든 월드 트로피가 있어요)
function trophyMapsOf(w) {
  return (typeof MAPS !== "undefined" ? MAPS : []).filter((m) => m.type !== "tower" && typeof BOSS_DEFS !== "undefined" && BOSS_DEFS[m.id] && (typeof mapWorld !== "function" ? w === 1 : mapWorld(m) === w));
}
// 지금 월드의 보스 (도감의 보스 칸)
function trophyMaps() { return trophyMapsOf(typeof curWorld === "function" ? curWorld() : 1); }

function drawTrophy(spot, mapId, won) {
  const x = spot.x, y = spot.y, z0 = spot.z || 0;
  // 받침대
  drawBox(x - 0.32, y - 0.32, z0, 0.64, 0.64, 0.3, won ? "#8a6a42" : "#5a5048");
  drawBox(x - 0.36, y - 0.36, z0 + 0.3, 0.72, 0.72, 0.06, won ? "#c9a24a" : "#6a6058");
  if (!won) return;
  // 보스 미니어처: 그 보스의 진짜 모습을 작게 줄여 받침대 위에 세워요 (도감 그림과 같은 그리기)
  if (!drawTrophyMini(mapId, x, y, z0 + 0.36)) {
    // 그리기에 실패하면 예전 블록 머리 (보스 부품 색)
    const def = BOSS_DEFS[mapId], col = (def.material && def.material.color) || "#ffd23f", bob = Math.sin(game.time * 2 + x) * 0.02;
    drawBox(x - 0.18, y - 0.18, z0 + 0.36 + bob, 0.36, 0.36, 0.22, shadeHex(col, -0.25));
    drawBox(x - 0.22, y - 0.22, z0 + 0.58 + bob, 0.44, 0.44, 0.36, col);
  }
  // 금빛 반짝
  if (Math.sin(game.time * 3 + x * 2) > 0.97) { const s = toScreen(x, y, z0 + 1.1); drawStar(s.x, s.y, 7 * ZOOM, "#ffe27a"); }
  // 가까이(2칸 안) 오면 이름표
  if (trophyGalleryNear() && BOSS_DEFS[mapId] && Math.hypot(game.player.x - x, game.player.y - y) < 2.0) { const c = toScreen(x, y, z0 + 1.5); text(BOSS_DEFS[mapId].name, c.x, c.y, Math.round(7 * ZOOM), "#ffe27a", "center"); }
}
// 뒷줄 계단 (돌 계단 + 금색 테두리)
function drawTrophyStep(x, y, w, d, h) {
  const look = typeof worldLook === "function" ? worldLook() : 1;
  const stone = look === 3 ? "#7a7c92" : look === 2 ? "#6a7f96" : "#8c8378", top = look === 3 ? "#c8cadc" : look === 2 ? "#8fa6bd" : "#a89e90"; // 월드 3 달: 은빛 돌
  drawBox(x, y, 0, w, d, h - 0.04, stone);
  drawBox(x, y, h - 0.04, w, d, 0.04, top);
  drawBox(x, y + d - 0.06, h - 0.02, w, 0.06, 0.03, "#c9a24a");
}
// 집 안에서 가까이 가면 깬 보스 이름을 트로피 위에 보여줘요
function trophyGalleryNear() {
  const p = game.player;
  return !!p && game.scene === "lobby" && houseInside(p);
}

// 미니어처 보스 (맵마다 한 번 만들어 두고 다시 써요)
//   크기: 보스마다 덩치가 달라서, 처음 그릴 때 한 번 실제로 그려 보고(화면 한쪽을 잠깐 빌렸다가 그대로 되돌려요) 키·폭을 재서 줄여요
const TROPHY_MINI = new Map();
const TROPHY_MINI_H = 40, TROPHY_MINI_W = 36; // 미니어처 키·폭 (ZOOM 1 화면 픽셀). 받침대 윗면 폭이 약 46 픽셀이에요
function trophyMini(mapId) {
  if (TROPHY_MINI.has(mapId)) return TROPHY_MINI.get(mapId);
  let out = null;
  try {
    const m = BOSS_DEFS[mapId].create(0, 0, 10);
    m.faceX = Math.SQRT1_2; m.faceY = Math.SQRT1_2; m.appearTimer = 0; m.moving = false; m.flash = 0; m.hidden = false; m.aggro = false; m.hitT = 0;
    m.trophy = true;
    m.w2Dark = false; // 어둠 속에 숨는 보스(심해)도 트로피는 또렷하게
    out = { m, k: null };
  } catch (e) { out = null; }
  TROPHY_MINI.set(mapId, out);
  return out;
}
// 한 번 그려 보고 크기 재기 (k = 미니어처 배율)
function trophyMiniMeasure(t) {
  const k0 = 0.3, dpr = canvas.width / view.w;
  const R = Math.round(Math.min(view.w, view.h, 420)), cx = R / 2, cy = R * 0.8;
  const m = t.m, px = Math.round(R * dpr);
  let saved = null;
  try {
    saved = ctx.getImageData(0, 0, px, px);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, R, R);
    ctx.beginPath(); ctx.rect(0, 0, R, R); ctx.clip();
    m.x = camera.x; m.y = camera.y;
    const base = toScreen(m.x, m.y, 0);
    ctx.translate(cx, cy); ctx.scale(k0, k0); ctx.translate(-base.x, -base.y);
    drawMonster(m);
    ctx.restore();
    const d = ctx.getImageData(0, 0, px, px).data;
    let x0 = px, x1 = -1, y0 = px, y1 = -1;
    for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) if (d[(y * px + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    ctx.putImageData(saved, 0, 0);
    if (x1 < 0) { t.k = 0.2; return; }
    const h1 = (y1 - y0 + 1) / dpr / k0 / ZOOM, w1 = (x1 - x0 + 1) / dpr / k0 / ZOOM; // 배율 1·ZOOM 1 일 때 크기
    t.k = Math.min(TROPHY_MINI_H / h1, TROPHY_MINI_W / w1, 0.6);
  } catch (e) { if (saved) try { ctx.putImageData(saved, 0, 0); } catch (e2) { /* 그대로 */ } t.k = 0.2; }
}
function drawTrophyMini(mapId, x, y, z) {
  const t = trophyMini(mapId);
  if (!t) return false;
  if (t.k === null) trophyMiniMeasure(t);
  const m = t.m;
  m.x = x; m.y = y;
  const base = toScreen(x, y, 0), top = toScreen(x, y, z + Math.sin(game.time * 2 + x) * 0.015);
  ctx.save();
  try {
    ctx.translate(top.x, top.y); ctx.scale(t.k, t.k); ctx.translate(-base.x, -base.y);
    drawMonster(m);
  } catch (e) { ctx.restore(); TROPHY_MINI.set(mapId, null); return false; }
  ctx.restore();
  return true;
}
function shadeHex(hex, k) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  if (isNaN(n)) return hex;
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return "#" + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join(""); // drawBox 는 #rrggbb 색으로 면 밝기를 만들어요
}

function drawCodexStand() {
  const { x, y } = CODEX_STAND;
  drawBox(x - 0.12, y - 0.12, 0, 0.24, 0.24, 0.6, "#6b4a2a");
  drawBox(x - 0.4, y - 0.32, 0.6, 0.8, 0.64, 0.08, "#8a5a32");
  // 펼친 책
  drawBox(x - 0.34, y - 0.27, 0.68, 0.32, 0.54, 0.05, "#f2e6c8");
  drawBox(x + 0.02, y - 0.27, 0.68, 0.32, 0.54, 0.05, "#e8dab8");
  drawBox(x - 0.02, y - 0.27, 0.66, 0.04, 0.54, 0.08, "#a0302a");
  const c = game.profile.codex;
  const total = codexMonsterIds().length;
  const seen = c ? codexMonsterIds().filter((id) => c.seen[id]).length : 0;
  if (seen < total && Math.sin(game.time * 4) > 0.6) { const s = toScreen(x, y, 1.15); drawStar(s.x, s.y, 6 * ZOOM, "#9fe6ff"); }
}

hookOn("lobbyThings", (things) => {
  // 부딪히는 자리 (캠프를 새로 만들 때마다 한 번)
  if (world.solids && !world.solids.__show) {
    world.solids.__show = true;
    world.solids.push({ x: CODEX_STAND.x, y: CODEX_STAND.y, r: 0.4 });
    for (const G of TROPHY_GALLERIES) {
      const nT = trophyMapsOf(G.world).length;
      // 받침대가 있는 칸만 막아요 (빈 앞줄 칸은 걸어 들어가서 뒷줄 트로피를 볼 수 있게)
      G.spots.forEach((s, i) => { if (i < nT) world.solids.push({ x: s.x, y: s.y, r: 0.32 }); });
      // 뒷줄 계단 (들어가지 못해요)
      for (let c = 0; c < Math.min(G.cols, nT); c++) world.solids.push({ x: G.x0 + c * G.dx, y: G.backY, r: 0.58 });
    }
  }
  if (!onScreen((HOUSE.x0 + HOUSE.x1) / 2, (HOUSE.y0 + HOUSE.y1) / 2, 16)) return; // 집 안이 화면에 없으면
  const tr = game.profile.trophies || {};
  for (const G of TROPHY_GALLERIES) {
    const maps = trophyMapsOf(G.world), n = maps.length;
    if (!n) continue;
    // 뒷줄 계단: 트로피보다 먼저 (뒤에) 그려요 + 월드 이름 팻말
    const cols = Math.min(G.cols, n), w = (cols - 1) * G.dx + 1.0;
    things.push({ depth: G.x0 + G.backY - 1.2, x: G.x0, y: G.backY, draw: () => drawTrophyStep(G.x0 - 0.5, G.backY - 0.5, w, 1.0, G.step) });
    maps.forEach((m, i) => {
      const s = G.spots[i];
      if (!s) return;
      things.push({ depth: s.x + s.y + (s.z ? 0.05 : 0), x: s.x, y: s.y, draw: () => drawTrophy(s, m.id, !!(tr[m.id] && tr[m.id].wins)) });
    });
  }
  things.push({ depth: CODEX_STAND.x + CODEX_STAND.y, x: CODEX_STAND.x, y: CODEX_STAND.y, draw: drawCodexStand });
}, 60);

// 전시대마다 월드 이름 팻말 + 모은 수 (집 안에서, house.js 가 맨 위에 그려요)
function drawTrophyHallLabels() {
  const tr = game.profile.trophies || {};
  for (const G of TROPHY_GALLERIES) {
    const maps = trophyMapsOf(G.world), n = maps.length;
    if (!n) continue;
    const wd = typeof WORLDS !== "undefined" && WORLDS[G.world], won = maps.filter((m) => tr[m.id] && tr[m.id].wins).length;
    const c = toScreen(G.x0 + (Math.min(G.cols, n) - 1) * G.dx / 2, G.backY - 0.3, 1.75);
    text(`${wd ? wd.name : "월드 " + G.world} 트로피 ${won}/${n}`, c.x, c.y, Math.round(8 * ZOOM), won === n ? "#ffe27a" : "#f2e6c8", "center");
  }
}
// 트로피 보기: 줄마다(세로 한 칸) 하나. 앞줄 받침대 앞에 서서 E: 앞줄 트로피, 한 번 더 누르면 뒷줄(계단 위) 트로피
//   (예전엔 트로피마다 0.75칸 안에서만 됐는데, 뒷줄은 계단·앞줄에 막혀 그만큼 가까이 갈 수 없어서 못 봤어요)
const TROPHY_LOOK = { col: "", t: 0 }; // 방금 본 줄 (두 번째 누름 = 뒷줄)
function trophyInfo(m) {
  const tr = game.profile.trophies || {}, t = tr[m.id], def = BOSS_DEFS[m.id], won = !!(t && t.wins);
  return { won, name: won ? `${def.name} 트로피` : "빈 받침대", sum: won ? `${def.name} 트로피 ${t.wins}번 이김` : "빈 받침대", text: won ? `${def.name} 트로피: ${t.wins}번 이김, 최고 기록 ${fmtTime(t.best)}` : `빈 받침대: ${m.name} 보스를 물리치면 트로피가 생겨요` };
}
hookOn("lobbyInteractables", (list) => {
  for (const G of TROPHY_GALLERIES) {
    const maps = trophyMapsOf(G.world);
    for (let c = 0; c < G.cols; c++) {
      const back = maps[c], front = maps[c + G.cols];
      if (!back) continue;
      const bi = trophyInfo(back), fi = front ? trophyInfo(front) : null, x = G.x0 + c * G.dx, key = G.world + ":" + c;
      const show = (row) => { const inf = row === "front" ? fi : bi; showMessage(`${row === "front" ? "앞줄" : "뒷줄"} ${inf.text}`, 3, inf.won); };
      list.push({
        x, y: G.frontY, range: 1.15, label: fi ? `${fi.name} · 뒷줄 ${bi.name}` : `뒷줄 ${bi.name}`, short: "보기",
        prompt: fi ? `앞줄 ${fi.sum} (E 한 번 더: 뒷줄 ${bi.sum})` : `뒷줄 ${bi.sum}`,
        action: () => {
          if (!fi) { show("back"); return; }
          const again = TROPHY_LOOK.col === key && game.time - TROPHY_LOOK.t < 4 && game.time >= TROPHY_LOOK.t;
          TROPHY_LOOK.col = again ? "" : key; TROPHY_LOOK.t = game.time;
          show(again ? "back" : "front");
        },
      });
    }
  }
  list.push({ x: CODEX_STAND.x, y: CODEX_STAND.y, range: 1.6, label: "도감", short: "도감", prompt: "몬스터 도감 보기", action: openCodex });
  return list;
}, 60);

// ---------------- 도감 창 ----------------
const codex = { tab: 0, scroll: 0, sel: null, drag: null, dragMoved: false, thumbs: new Map(), maxScroll: 0 };
const CODEX_TABS = ["몬스터", "보스", "정예 속성"];

function openCodex() { game.overlay = "codex"; codex.scroll = 0; codex.sel = null; if (typeof sfx !== "undefined") sfx.equip(); }

function codexEntries() {
  const c = game.profile.codex;
  if (codex.tab === 0) return codexMonsterIds().map((id) => ({ kind: "monster", id, seen: !!c.seen[id], killed: c.killed[id] || 0, def: MONSTERS[id] }));
  if (codex.tab === 1) return trophyMaps().map((m) => { const t = game.profile.trophies[m.id]; return { kind: "boss", id: m.id, map: m, def: BOSS_DEFS[m.id], seen: !!(c.bossSeen[m.id] || (t && t.wins)), killed: (t && t.wins) || 0, best: t && t.best }; });
  return Object.keys(ELITE_AFFIXES).map((id) => ({ kind: "affix", id, seen: !!c.affix[id], def: ELITE_AFFIXES[id] }));
}

// 작은 그림을 한 번 그려서 기억해요 (몬스터는 실제 게임 그림, 못 본 건 검은 실루엣)
function codexThumb(e) {
  const key = e.kind + ":" + e.id;
  if (codex.thumbs.has(key)) return codex.thumbs.get(key);
  if (codex.madeThisFrame >= 2) return null; // 한 번에 조금씩 (버벅이지 않게)
  codex.madeThisFrame++;
  const out = { img: null, dark: null };
  try {
    const vw = view.w, vh = view.h;
    if (typeof uiSaved !== "undefined" && uiSaved) { view.w = uiSaved.w; view.h = uiSaved.h; }
    const dpr = canvas.width / view.w;
    let m;
    if (e.kind === "boss") m = BOSS_DEFS[e.id].create(1.5, 1.5, 10);
    else m = createMonster(e.id, 1.5, 1.5, 5);
    m.x = 1.5; m.y = 1.5; m.faceX = 0.7071; m.faceY = 0.7071; m.appearTimer = 0; m.moving = false; m.flash = 0; m.hidden = false; m.aggro = false;
    const big = e.kind === "boss" ? Math.max(2.6, (m.b2Scale || 0) * 1.3, (m.def.size || 0) * 1.05) : Math.max(1, (m.def.size || 1) * 1.1);
    const src = (e.kind === "boss" ? 100 : 80) * big * ZOOM;
    const cx = camera.x, cy = camera.y;
    camera.x = m.x; camera.y = m.y;
    const s = toScreen(m.x, m.y, 0.55 * big);
    const k = Math.min(1, (Math.min(view.w, view.h) * 0.95) / src); // 화면보다 크면 줄여서 그려요
    const cxs = s.x, cys = s.y - 5 * big;
    const ss = src * k, sx = view.w / 2 - ss / 2, sy = view.h / 2 - ss / 2;
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(sx, sy, ss, ss);
    ctx.beginPath(); ctx.rect(sx, sy, ss, ss); ctx.clip();
    ctx.translate(view.w / 2, view.h / 2); ctx.scale(k, k); ctx.translate(-cxs, -cys);
    drawMonster(m);
    ctx.restore();
    camera.x = cx; camera.y = cy;
    const img = document.createElement("canvas"); img.width = img.height = 128;
    img.getContext("2d").drawImage(canvas, sx * dpr, sy * dpr, ss * dpr, ss * dpr, 0, 0, 128, 128);
    const dark = document.createElement("canvas"); dark.width = dark.height = 128;
    const g = dark.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#3a4252"; g.fillRect(0, 0, 128, 128);
    out.img = img; out.dark = dark;
    view.w = vw; view.h = vh;
  } catch (err) { out.err = String(err && err.message); }
  codex.thumbs.set(key, out);
  return out;
}

function codexLines(e) {
  const d = e.def;
  if (e.kind === "affix") return [d.desc || "", d.counter ? "대처: " + d.counter : ""];
  if (e.kind === "boss") {
    const mon = MONSTERS[d.id];
    const abil = new Set();
    for (const ph of (mon && mon.phases) || d.phases || []) for (const id of ph.abilities || []) abil.add(id);
    const out = [`${d.title || ""}`.trim(), e.killed ? `${e.killed}번 이김 · 최고 기록 ${fmtTime(e.best)}` : "아직 못 이겼어요"];
    for (const id of [...abil].slice(0, 6)) { const ab = ABILITIES[id]; if (ab) out.push(`${ab.name}: ${ab.counter || ""}`); }
    return out;
  }
  const out = [];
  const bd = typeof BEHAVIOR_DOCS !== "undefined" && BEHAVIOR_DOCS[d.behavior];
  if (bd) out.push(bd.desc + (bd.counter ? " → " + bd.counter : ""));
  for (const id of d.abilities || []) { const ab = ABILITIES[id]; if (ab) out.push(`${ab.name}: ${ab.counter || ab.desc || ""}`); }
  out.push(`잡은 수 ${e.killed}`);
  return out;
}

function codexLayout() {
  const W = view.w, H = view.h;
  const pw = Math.min(1000, W - 16), ph = Math.min(620, H - 16);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  const gx = x0 + 16, gy = y0 + 104, gw = pw - 32, gh = ph - 120;
  const cols = Math.max(2, Math.floor(gw / 150));
  const cw = (gw - (cols - 1) * 10) / cols, ch = Math.min(cw * 1.2, 190);
  return { W, H, pw, ph, x0, y0, gx, gy, gw, gh, cols, cw, ch };
}

function updateCodex() {
  if (wasPressed("Escape", "KeyE")) { if (codex.sel) codex.sel = null; else closeOverlay(); return; }
  if (wasPressed("Tab")) { codex.tab = (codex.tab + 1) % 3; codex.scroll = 0; codex.sel = null; }
  for (let i = 0; i < 3; i++) if (wasPressed("Digit" + (i + 1))) { codex.tab = i; codex.scroll = 0; codex.sel = null; }
  if (isDown("ArrowDown", "KeyS")) codex.scroll += 12;
  if (isDown("ArrowUp", "KeyW")) codex.scroll -= 12;
  codex.scroll = Math.max(0, Math.min(codex.maxScroll, codex.scroll));
}

function drawCodex() {
  codex.madeThisFrame = 0;
  const L = codexLayout(), pr = game.profile;
  // 보이는 카드의 작은 그림을 창을 그리기 전에 만들어요 (창 위에 그리면 지우기가 창까지 지워요)
  {
    const ent0 = codexEntries();
    ent0.forEach((e, i) => {
      if (e.kind === "affix") return;
      const cy = L.gy + Math.floor(i / L.cols) * (L.ch + 10) - codex.scroll;
      if (cy > L.gy + L.gh + L.ch || cy + L.ch < L.gy - L.ch) return;
      codexThumb(e);
    });
    if (codex.sel && codex.sel.kind !== "affix") codexThumb(codex.sel);
  }
  blockUI();
  drawPanel(L.x0, L.y0, L.pw, L.ph);
  text("몬스터 도감", L.x0 + 20, L.y0 + 40, 26, "#ffe27a");
  const ent = codexEntries();
  const seen = ent.filter((e) => e.seen).length;
  text(`${seen} / ${ent.length}`, L.x0 + 190, L.y0 + 40, 18, "#ddd");
  drawButton(L.x0 + L.pw - 58, L.y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  const tw = Math.min(150, (L.pw - 40) / 3 - 8);
  CODEX_TABS.forEach((n, i) => drawButton(L.x0 + 20 + i * (tw + 8), L.y0 + 54, tw, 38, n, () => { codex.tab = i; codex.scroll = 0; codex.sel = null; }, { selected: codex.tab === i, size: 16 }));

  const rows = Math.ceil(ent.length / L.cols);
  codex.maxScroll = Math.max(0, rows * (L.ch + 10) - 10 - L.gh);
  codex.scroll = Math.max(0, Math.min(codex.maxScroll, codex.scroll));
  ctx.save();
  ctx.beginPath(); ctx.rect(L.gx, L.gy, L.gw, L.gh); ctx.clip();
  ent.forEach((e, i) => {
    const cx = L.gx + (i % L.cols) * (L.cw + 10), cy = L.gy + Math.floor(i / L.cols) * (L.ch + 10) - codex.scroll;
    if (cy > L.gy + L.gh || cy + L.ch < L.gy) return;
    roundRectPath(cx, cy, L.cw, L.ch, 10);
    ctx.fillStyle = e.seen ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.3)"; ctx.fill();
    ctx.strokeStyle = e.seen && e.killed ? "rgba(255,226,122,0.6)" : "rgba(255,255,255,0.15)"; ctx.lineWidth = 2; ctx.stroke();
    const visTop = Math.max(cy, L.gy), visBot = Math.min(cy + L.ch, L.gy + L.gh);
    if (visBot - visTop > 10) addUI(cx, visTop, L.cw, visBot - visTop, () => { if (!codex.dragMoved) codex.sel = e; });
    const imgS = Math.min(L.cw - 16, L.ch - 54);
    const ix = cx + (L.cw - imgS) / 2, iy = cy + 8;
    if (e.kind === "affix") {
      const s = imgS * 0.55;
      ctx.fillStyle = e.seen ? e.def.color : "#222630"; ctx.fillRect(cx + L.cw / 2 - s / 2, iy + imgS / 2 - s / 2, s, s);
      ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 2; ctx.strokeRect(cx + L.cw / 2 - s / 2, iy + imgS / 2 - s / 2, s, s);
      text(e.seen ? e.def.short : "?", cx + L.cw / 2, iy + imgS / 2 + s * 0.25, s * 0.6, e.seen ? "#1a1a1a" : "#666", "center");
    } else {
      const th = codexThumb(e);
      if (th && th.img) ctx.drawImage(e.seen ? th.img : th.dark, ix, iy, imgS, imgS);
      else if (!th) text("...", cx + L.cw / 2, iy + imgS / 2, 16, "#888", "center");
    }
    const name = e.seen ? (e.kind === "boss" ? e.def.name : e.def.name) : "???";
    text(name, cx + L.cw / 2, cy + L.ch - 26, Math.min(16, L.cw / 8), e.seen ? "#fff" : "#777", "center");
    const sub = e.kind === "affix" ? (e.seen ? "만난 적 있어요" : "") : e.kind === "boss" ? (e.killed ? `${e.killed}번 이김` : e.seen ? "만났어요" : e.map.name) : e.seen ? `잡은 수 ${e.killed}` : "";
    if (sub) text(sub, cx + L.cw / 2, cy + L.ch - 8, 12, e.killed ? "#7dffb0" : "#aaa", "center");
  });
  ctx.restore();
  // 스크롤 막대
  if (codex.maxScroll > 0) {
    const bh = L.gh * L.gh / (L.gh + codex.maxScroll), by = L.gy + (L.gh - bh) * (codex.scroll / codex.maxScroll);
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(L.gx + L.gw + 4, by, 5, bh);
  }
  // 자세히 보기
  if (codex.sel) drawCodexDetail(L, codex.sel);
}

function drawCodexDetail(L, e) {
  const w = Math.min(560, L.pw - 40), h = Math.min(330, L.ph - 60);
  const x = (L.W - w) / 2, y = (L.H - h) / 2;
  blockUI();
  addUI(0, 0, L.W, L.H, () => { codex.sel = null; });
  roundRectPath(x, y, w, h, 12); ctx.fillStyle = "rgba(20,22,30,0.97)"; ctx.fill();
  ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke();
  addUI(x, y, w, h, () => { codex.sel = null; });
  const pic = Math.min(130, h - 60);
  if (e.kind === "affix") {
    ctx.fillStyle = e.seen ? e.def.color : "#222630"; ctx.fillRect(x + 20, y + 20, pic * 0.7, pic * 0.7);
    text(e.seen ? e.def.short : "?", x + 20 + pic * 0.35, y + 20 + pic * 0.5, pic * 0.4, "#1a1a1a", "center");
  } else {
    const th = codexThumb(e);
    if (th && th.img) ctx.drawImage(e.seen ? th.img : th.dark, x + 12, y + 12, pic, pic);
  }
  const tx = x + pic + 30;
  text(e.seen ? e.def.name : "???", tx, y + 40, 22, "#fff");
  if (!e.seen) { text("아직 만나지 못했어요", tx, y + 70, 15, "#aaa"); return; }
  let yy = y + 68;
  for (const line of codexLines(e)) {
    if (!line) continue;
    for (const part of wrapText(line, Math.floor((x + w - tx - 14) / 13))) {
      if (yy > y + h - 14) return;
      text(part, tx, yy, 13, "#ccd", "left");
      yy += 19;
    }
  }
}
function wrapText(s, n) {
  const out = [];
  while (s.length > n) { let cut = s.lastIndexOf(" ", n); if (cut < n * 0.5) cut = n; out.push(s.slice(0, cut)); s = s.slice(cut).trimStart(); }
  if (s) out.push(s);
  return out;
}

hookOn("overlayUpdate", (name) => { if (name !== "codex") return false; updateCodex(); return true; }, 60);
hookOn("overlayDraw", (name) => { if (name !== "codex") return false; drawCodex(); return true; }, 60);

// 끌어서 스크롤 (휴대폰), 마우스 휠
if (typeof canvas !== "undefined" && canvas.addEventListener) {
  canvas.addEventListener("pointerdown", (e) => { if (game.overlay === "codex") { codex.drag = { y: e.clientY, s: codex.scroll }; codex.dragMoved = false; } });
  canvas.addEventListener("pointermove", (e) => {
    if (game.overlay !== "codex" || !codex.drag) return;
    const k = Math.min(1, view.w / 1000, view.h / 620);
    const dy = (e.clientY - codex.drag.y) / k;
    if (Math.abs(dy) > 8) codex.dragMoved = true;
    codex.scroll = Math.max(0, Math.min(codex.maxScroll, codex.drag.s - dy));
  });
  const end = () => { codex.drag = null; setTimeout(() => { codex.dragMoved = false; }, 0); };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("wheel", (e) => { if (game.overlay === "codex") { codex.scroll = Math.max(0, Math.min(codex.maxScroll, codex.scroll + e.deltaY)); } }, { passive: true });
}
