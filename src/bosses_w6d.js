// ===== 월드 6 새 보스 12~14 (신기루 대신 새로 만든 보스: 새 모습·새 기술) =====
// 12 rainbowsand 색모래 뱀 알록이   : 바닥이 4가지 색(모양 ●▲■★ 도 같이)으로 바뀌고, 알록이가 부른 색만 안전해요.
//                                    색 기둥을 치면 알록이가 그 색으로 물들어 더 아파요. 3단계는 부르기가 빨라져요.
// 13 sphinxgate  돌 수문장 끄덕이   : 머리 위에 모양 하나 → 같은 모양 발판을 밟으면 이마 보석이 열려요 (틀린 발판은 찌릿).
//                                    3단계는 돌 주먹이 쿵 (예고 원).
// 14 sunthrone   태양 왕 이글이     : "햇볕 쨍쨍" 때 빙글 도는 양산 그늘로 숨어요. 햇볕 줄기(빛 길), 3단계는 작은 해 셋이 빙글빙글.
//                                    햇볕·작은 해는 하트 1 밑으로는 절대 안 내려요 (아이 규칙).
// 사막 보스 규칙(물 항아리)은 bosses_w6.js 가 그대로 해요 (bossDef.world === 6).
// 같이 하기: 상태는 모두 보스·소품 몬스터 칸(dcCall·drSym·dsBlaze·sym·c ...)이라 친구 화면에도 가요. 판정은 방장만.

function w6dHost() { return !(typeof netGuest === "function" && netGuest()); }
function w6dBoss(type) { return typeof monsters !== "undefined" ? monsters.find((m) => m.type === type && m.hp > 0) || null : null; }
function w6dCenter() { return { x: world.W / 2, y: world.H / 2 }; }
function w6dProp(type, x, y, owner, r = 0.45) { const s = spawnProp(type, x, y, owner); s.r = r; s.appearTimer = 0; return s; }
function w6dCastTime(m, id, fb) { const c = casts.find((q) => q.m === m && q.id === id); return c ? c.time : fb; }
// 하트 1 밑으로는 안 내려가게 아프기 (햇볕·작은 해)
function w6dHeat(p, dmg, from, text) {
  if (!p || p.hp <= 0 || p.rollTimer > 0) return false;
  const d = Math.min(dmg, p.hp - 1);
  if (d <= 0) { addFloatText(p.x, p.y, "앗 뜨거! (하트 1은 지켜요)", "#ffb070", 14); return false; }
  const h0 = p.hp; hurtPlayer(p, d, from); if (p.hp < 1) p.hp = 1;
  if (text && p.hp < h0) addFloatText(p.x, p.y, text, "#ffb070", 16);
  return p.hp < h0;
}
function w6dLegend(mapId, L) { if (typeof w6RegisterLegend === "function") w6RegisterLegend(mapId, L); }

// ---------------- 색 4가지 (색이 헷갈려도 모양으로 알 수 있게) ----------------
const W6D_COLORS = [
  { name: "빨강", c: "#ff6b6b", sym: "●" }, { name: "파랑", c: "#5aa8ff", sym: "▲" },
  { name: "노랑", c: "#ffd23f", sym: "■" }, { name: "초록", c: "#6adf7a", sym: "★" },
];
// 바닥 색: 2x2 칸 덩어리마다 하나. 4x4 칸 안에 4가지 색이 다 있어서 늘 가까이에 안전한 색이 있어요
function w6dColorAt(tx, ty, shift) { return (((Math.floor(tx / 2) + 2 * Math.floor(ty / 2) + (shift || 0)) % 4) + 4) % 4; }

Object.assign(ABILITIES, {
  w6_d_colorCall: { name: "색 부르기", desc: "알록이가 색 하나를 불러요. 그 색(그 모양) 바닥만 안전해요.", counter: "불린 색·모양 바닥 위로 가요",
    tags: ["boss", "special"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 3.0 }, cooldown: 9, range: [0, 40], damageMul: 1.4, anim: "roar",
    effect: { type: "w6_d_color" } },
  w6_d_colorCallFast: { name: "빠른 색 부르기", desc: "알록이가 빠르게 색을 불러요. 그 색(그 모양) 바닥만 안전해요.", counter: "불린 색·모양 바닥 위로 재빨리!",
    tags: ["boss", "special"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 2.0 }, cooldown: 6, range: [0, 40], damageMul: 1.3, anim: "roar",
    effect: { type: "w6_d_color" } },
  w6_d_coil: { name: "똬리 휘감기", desc: "알록이가 몸을 휘감아 둘레를 쳐요. 가까이 붙으면 맞아요.", counter: "몸에서 조금 떨어져요",
    tags: ["boss", "circle"], telegraph: { shape: "circle", radius: 2.6, at: "self", time: 1.2 }, cooldown: 7, range: [0, 3], damageMul: 1.4, anim: "slam",
    effect: { type: "knockback", force: 1.0 } },
  w6_d_riddle: { name: "수수께끼", desc: "끄덕이 머리 위에 모양이 떠요. 같은 모양 발판을 밟으면 이마 보석이 열려요. 틀린 발판은 찌릿!", counter: "머리 위 모양과 같은 발판 위로!",
    tags: ["boss", "special"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 3.4 }, cooldown: 10, range: [0, 40], damageMul: 0.6, anim: "raise",
    effect: { type: "w6_d_riddle" } },
  w6_d_stoneStomp: { name: "돌 발 쿵", desc: "끄덕이가 발을 쿵! 둘레가 흔들려요.", counter: "원 밖으로 물러나요",
    tags: ["boss", "circle"], telegraph: { shape: "circle", radius: 2.8, at: "self", time: 1.2 }, cooldown: 8, range: [0, 3.2], damageMul: 1.4, anim: "slam",
    effect: { type: "knockback", force: 1.0 } },
  w6_d_stoneFist: { name: "돌 주먹", desc: "커다란 돌 주먹이 여러 군데 쿵 떨어져요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 1.3 }, cooldown: 8, range: [0, 14], damageMul: 1.4, anim: "raise",
    effect: { type: "rain", count: 3, spread: 2.6, stagger: 0.25 } },
  w6_d_blaze: { name: "햇볕 쨍쨍", desc: "이글이가 햇볕을 쨍쨍 내리쬐어요. 빙글 도는 양산 그늘 안에 있으면 괜찮아요.", counter: "초록 그늘(양산 밑)로 숨어요",
    tags: ["boss", "special"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 3.0 }, cooldown: 10, range: [0, 40], damageMul: 1.5, anim: "raise",
    effect: { type: "w6_d_blaze" } },
  w6_d_flare: { name: "햇볕 줄기", desc: "이글이가 햇볕을 한 줄로 쭉 쏘아요.", counter: "빛 길 옆으로 한 걸음!",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.4, at: "self", time: 1.3 }, cooldown: 7, range: [0, 12], damageMul: 1.5, anim: "point",
    effect: { type: "damage" } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w6_d_colorCall: { text: "불린 색·모양 바닥으로!", do: true }, w6_d_colorCallFast: { text: "불린 색·모양 바닥으로 빨리!", do: true }, w6_d_coil: { text: "몸에서 떨어져요" },
  w6_d_riddle: { text: "같은 모양 발판을 밟아요!", do: true }, w6_d_stoneStomp: { text: "원 밖으로" }, w6_d_stoneFist: { text: "원 사이 빈 곳으로" },
  w6_d_blaze: { text: "양산 그늘로 숨어요!", do: true }, w6_d_flare: { text: "빛 길 옆으로" },
});

// ---------------- 소품 ----------------
MONSTERS.w6_d_cpillar = { name: "색 기둥", color: "#ffffff", shape: "w6_d_cpillar", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true };
MONSTERS.w6_d_plate = { name: "수수께끼 발판", color: "#c8b088", shape: "w6_d_plate", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true, flatProp: true };
MONSTERS.w6_d_umbrella = { name: "양산", color: "#7adf8a", shape: "w6_d_umbrella", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true };
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w6_d_cpillar", "w6_d_plate", "w6_d_umbrella");
if (typeof CODEX_SKIP !== "undefined") for (const t of ["w6_d_cpillar", "w6_d_plate", "w6_d_umbrella"]) CODEX_SKIP.add(t);

// ---------------- 보스 정의 ----------------
const W6D_SNAKE_PHASES = [
  { until: 0.66, abilities: ["w6_d_colorCall", "w6_d_coil", "w6_sandWave"] },
  { until: 0.33, abilities: ["w6_d_colorCall", "w6_d_coil", "w6_sandRain", "w6_sandWave"] },
  { abilities: ["w6_d_colorCallFast", "w6_d_coil", "w6_sandRain", "w6_duneRing"] },
];
const W6D_GATE_PHASES = [
  { until: 0.66, abilities: ["w6_d_riddle", "w6_d_stoneStomp", "w6_sandWave"] },
  { until: 0.33, abilities: ["w6_d_riddle", "w6_d_stoneStomp", "w6_sandRain", "w6_mirageCall"] },
  { abilities: ["w6_d_riddle", "w6_d_stoneFist", "w6_d_stoneStomp", "w6_sandRain"] },
];
const W6D_SUN_PHASES = [
  { until: 0.66, abilities: ["w6_d_blaze", "w6_d_flare", "w6_sunSpot"] },
  { until: 0.33, abilities: ["w6_d_blaze", "w6_d_flare", "w6_sandRain", "w6_sunSpot"] },
  { abilities: ["w6_d_blaze", "w6_d_flare", "w6_duneRing", "w6_sunSpot"] },
];
const W6D_LIST = [
  { mapId: "rainbowsand", type: "w6_d_snake", name: "색모래 뱀 알록이", title: "색모래 들판", hp: 449, size: 3.0, phases: W6D_SNAKE_PHASES,
    mat: { id: "w6_d_rainbowScale", name: "알록 비늘", color: "#e8a0e8" },
    legend: { id: "L_w6_d_rainbowsand", slot: "charm", name: "알록 비늘 목걸이", icon: "amulet", color: "#e8a0e8", perk: { hearts: 3, luck: 0.25 }, desc: "알록이가 준 무지개 비늘: 하트 +3, 행운" },
    phaseMsg: ["색 기둥을 치면 알록이가 물들어 더 아파요!", "알록이가 빨리 불러요! 색과 모양을 잘 봐요!"] },
  { mapId: "sphinxgate", type: "w6_d_gate", name: "돌 수문장 끄덕이", title: "스핑크스 문", hp: 456, size: 3.2, phases: W6D_GATE_PHASES,
    mat: { id: "w6_d_riddleGem", name: "수수께끼 보석", color: "#7ad8ff" },
    legend: { id: "L_w6_d_sphinxgate", slot: "weapon", name: "끄덕이 돌 망치", effect: "slow", mul: 1.08, color: "#c8b088", forms: { w: "끄덕이 돌 망치", m: "끄덕이 돌 지팡이", d: "끄덕이 돌 지팡이", h: "끄덕이 돌 단검" }, desc: "정답을 맞히면 열리는 돌 망치: 맞은 적이 느려져요" },
    phaseMsg: ["수수께끼가 더 어려워져요? 아니요, 머리 위 모양만 보면 돼요!", "돌 주먹이 떨어져요! 원 사이로!"] },
  { mapId: "sunthrone", type: "w6_d_sunking", name: "태양 왕 이글이", title: "태양 왕좌", hp: 463, size: 3.2, phases: W6D_SUN_PHASES,
    mat: { id: "w6_d_sunCrown", name: "태양 왕관 조각", color: "#ffb84a" },
    legend: { id: "L_w6_d_sunthrone", slot: "charm", name: "이글이 해님 반지", icon: "ring", color: "#ffb84a", perk: { regen: 12, hearts: 3 }, desc: "따뜻한 햇살 반지: 하트 +3, 하트가 빨리 차요" },
    phaseMsg: ["양산이 더 빨리 돌아요! 그늘을 따라가요!", "작은 해 셋이 빙글빙글! 부딪히지 않게 조심!"] },
];
for (const E of W6D_LIST) {
  const map = typeof MAPS !== "undefined" ? MAPS.find((m) => m.id === E.mapId) : null;
  MONSTERS[E.type] = { color: E.mat.color, name: E.name, shape: E.type, behavior: "b2_boss", hp: E.hp, speed: 1.25, damage: 2.7, xp: 85, emerald: 1, emeraldCount: 18,
    attackRange: 2.2, attackCooldown: 1.8, world: 6, isBoss: true, heavy: true, size: E.size, phases: E.phases };
  MATERIALS[E.mat.id] = { name: E.mat.name, color: E.mat.color };
  BOSS_DEFS[E.mapId] = {
    id: E.type, name: E.name, title: E.title, size: E.size, world: 6, w6New: true, material: E.mat,
    arena: { size: 26, theme: (map && map.theme) || (typeof W6_BOSS_THEME !== "undefined" ? W6_BOSS_THEME : undefined) },
    phases: E.phases,
    create(x, y, level) {
      const m = b2MakeBoss(E.type, x, y, level, E.size);
      m.bossDef = BOSS_DEFS[E.mapId]; m.name = `${E.title}, ${E.name}`; m.w6dKind = E.type;
      const base = m.onPhase;
      m.onPhase = (idx) => { if (base) base(idx); if (idx >= 1 && E.phaseMsg[idx - 1]) showMessage(E.phaseMsg[idx - 1], 3, false, "#ffe27a"); if (E.type === "w6_d_sunking" && idx === 2) m.dsSuns = 3; };
      return m;
    },
  };
  w6dLegend(E.mapId, E.legend);
}
// 보스 목소리
if (typeof BOSS_VOICE !== "undefined") Object.assign(BOSS_VOICE, {
  rainbowsand: { intro: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.06, null, i * 0.1)); noise(0.4, 0.12, 2500, "highpass", 0.4); },
    fall: () => { [1047, 784, 659, 523, 392].forEach((f, i) => tone(f, 0.15, "triangle", 0.06, null, i * 0.12)); } },
  sphinxgate: { intro: () => { tone(90, 0.6, "square", 0.08, 70); tone(180, 0.3, "triangle", 0.05, null, 0.5); tone(180, 0.3, "triangle", 0.05, null, 0.8); },
    fall: () => { noise(0.8, 0.25, 400, "lowpass"); tone(120, 0.8, "square", 0.07, 50); } },
  sunthrone: { intro: () => { tone(220, 0.8, "sawtooth", 0.06, 440); tone(330, 0.6, "sine", 0.06, 660, 0.3); },
    fall: () => { tone(660, 1.0, "sine", 0.07, 110); noise(0.6, 0.15, 1200, "bandpass", 0.2); } },
});

// ---------------- 12 알록이: 색 부르기 ----------------
hookOn("castStarted", (m, id) => {
  if (!m || !w6dHost()) return;
  if (m.type === "w6_d_snake" && (id === "w6_d_colorCall" || id === "w6_d_colorCallFast")) {
    m.dcShift = Math.floor(Math.random() * 4); m.dcCall = Math.floor(Math.random() * 4);
    m.dcWarn = m.dcWarnMax = w6dCastTime(m, id, 3);
    const col = W6D_COLORS[m.dcCall];
    addFloatText(m.x, m.y, `${col.sym} ${col.name}!`, col.c, 28);
  }
  if (m.type === "w6_d_gate" && id === "w6_d_riddle") {
    m.drSym = Math.floor(Math.random() * 3); m.drWarn = m.drWarnMax = w6dCastTime(m, id, 3.4);
    w6dPlacePlates(m);
  }
  if (m.type === "w6_d_sunking" && id === "w6_d_blaze") { m.dsBlaze = m.dsBlazeMax = w6dCastTime(m, id, 3); }
}, 50);
hookOn("resolveCast", (c) => {
  const t = c && c.ab && c.ab.effect && c.ab.effect.type;
  if (t !== "w6_d_color" && t !== "w6_d_riddle" && t !== "w6_d_blaze") return false;
  if (c._w6dDone || !w6dHost()) return true;
  c._w6dDone = true;
  const b = c.m; if (!b || b.hp <= 0) return true;
  const dmg = abilityDamage(c);
  if (t === "w6_d_color") {
    const call = b.dcCall;
    for (const p of allPlayers()) {
      if (!p || p.hp <= 0) continue;
      const here = w6dColorAt(Math.floor(p.x), Math.floor(p.y), b.dcShift);
      if (here === call) { addFloatText(p.x, p.y, "안전!", "#7dffb0", 16); continue; }
      if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 16); continue; }
      hurtPlayer(p, dmg, b); addFloatText(p.x, p.y, "앗, 다른 색!", "#ff9090", 16);
    }
    addRing(b.x, b.y, { speed: 9, life: 0.5, hue: 300 }); game.shake = Math.max(game.shake || 0, 0.3);
    b.dcCall = -1; b.dcWarn = 0;
  } else if (t === "w6_d_riddle") {
    let right = false;
    for (const p of allPlayers()) {
      if (!p || p.hp <= 0) continue;
      const pl = monsters.find((o) => o.type === "w6_d_plate" && o.hp > 0 && Math.hypot(o.x - p.x, o.y - p.y) < 0.95);
      if (!pl) continue;
      if (pl.sym === b.drSym) right = true;
      else if (p.rollTimer <= 0) { hurtPlayer(p, dmg, b); addFloatText(p.x, p.y, "찌릿! 다른 모양", "#ffd060", 16); }
    }
    if (right) {
      b.drOpen = 6; b.staggerT = Math.max(b.staggerT || 0, 1.5); b.stagger = Math.max(b.stagger || 0, 1.5);
      addFloatText(b.x, b.y, "끄덕! 정답! 이마 보석이 열렸어요", "#7ad8ff", 24);
      if (typeof sfx !== "undefined" && sfx.levelUp) sfx.levelUp();
    } else addFloatText(b.x, b.y, "땡! 다음엔 맞혀 봐요", "#e8d8b0", 20);
    b.drSym = -1; b.drWarn = 0;
  } else {
    for (const p of allPlayers()) {
      if (!p || p.hp <= 0) continue;
      if (w6dInShade(p)) { addFloatText(p.x, p.y, "그늘이라 시원해요", "#7dffb0", 15); continue; }
      w6dHeat(p, dmg, b, "앗 뜨거!");
    }
    game.shake = Math.max(game.shake || 0, 0.3);
    b.dsBlaze = 0;
  }
  return true;
}, 15);
// 색 기둥을 치면 알록이가 그 색으로 물들어요
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m) return false;
  if (m.type === "w6_d_cpillar") {
    if (h.opts.dot || game.time - (m.w6dHitT || -9) < 0.4) return true;
    m.w6dHitT = game.time;
    const b = w6dBoss("w6_d_snake");
    if (b) { b.dcPaint = 6; b.dcPaintC = m.c; const col = W6D_COLORS[m.c] || W6D_COLORS[0]; addFloatText(b.x, b.y, `알록이가 ${col.name}으로 물들었어요! 지금 때려요`, col.c, 22); addRing(m.x, m.y, { speed: 6, life: 0.5, hue: 300 }); }
    return true;
  }
  if (m.type === "w6_d_plate" || m.type === "w6_d_umbrella") return true;
  // 물들지 않은 알록이·보석이 닫힌 끄덕이는 덜 아파요 (그래도 기본 공격만으로 이길 수 있어요)
  if (m.type === "w6_d_snake" && !h.opts.w6Prop && !h.opts.w5Prop) h.dmg *= m.dcPaint > 0 ? 1.3 : 0.6;
  if (m.type === "w6_d_gate" && !h.opts.w6Prop && !h.opts.w5Prop) h.dmg *= m.drOpen > 0 ? 1.5 : 0.6;
  return false;
}, 5);

// ---------------- 13 끄덕이: 발판 놓기 ----------------
function w6dPlacePlates(b) {
  let plates = monsters.filter((o) => o.type === "w6_d_plate" && o.hp > 0);
  const c = w6dCenter(), R = 4.6, a0 = Math.random() * Math.PI * 2, order = [0, 1, 2].sort(() => Math.random() - 0.5);
  while (plates.length < 3) plates.push(w6dProp("w6_d_plate", c.x, c.y, b, 0.1));
  plates.slice(0, 3).forEach((pl, i) => {
    const a = a0 + i * Math.PI * 2 / 3, s = findFreeSpot(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R, 0.4, 2) || { x: c.x + Math.cos(a) * R, y: c.y + Math.sin(a) * R };
    pl.x = s.x; pl.y = s.y; pl.sym = order[i];
  });
}
const W6D_SYMS = [{ s: "●", name: "동그라미", c: "#ff8a8a" }, { s: "▲", name: "세모", c: "#7ac8ff" }, { s: "■", name: "네모", c: "#ffd060" }];

// ---------------- 14 이글이: 양산 그늘 ----------------
const W6D_SHADE_R = 1.7;
function w6dInShade(p) { return monsters.some((o) => o.type === "w6_d_umbrella" && o.hp > 0 && Math.hypot(o.x - p.x, o.y - p.y) < W6D_SHADE_R); }
function w6dSunPos(b, i) { const a = (b.dsAng || 0) + i * Math.PI * 2 / 3; return { x: b.x + Math.cos(a) * 3.4, y: b.y + Math.sin(a) * 3.4 }; }

// ---------------- 방장: 매 화면 ----------------
hookOn("dungeonTick", (dt) => {
  const host = w6dHost();
  const snake = w6dBoss("w6_d_snake"), gate = w6dBoss("w6_d_gate"), sun = w6dBoss("w6_d_sunking");
  if (snake) {
    if (host && !snake.w6dInit) {
      snake.w6dInit = true; snake.dcCall = -1; snake.dcShift = 0; snake.dcPaint = 0;
      const c = w6dCenter(), d = Math.max(4, world.W / 2 - 5) * 0.62;
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([ox, oy], i) => { const s = w6dProp("w6_d_cpillar", c.x + ox * d, c.y + oy * d, snake, 0.42); s.c = i; });
    }
    if (snake.dcWarn > 0) { snake.dcWarn = Math.max(0, snake.dcWarn - dt); if (host && !casts.some((q) => q.m === snake && q.ab && q.ab.effect && q.ab.effect.type === "w6_d_color")) { snake.dcWarn = 0; snake.dcCall = -1; } }
    if (snake.dcPaint > 0) snake.dcPaint = Math.max(0, snake.dcPaint - dt);
  }
  if (gate) {
    if (host && !gate.w6dInit) { gate.w6dInit = true; gate.drSym = -1; gate.drOpen = 0; w6dPlacePlates(gate); }
    if (gate.drWarn > 0) { gate.drWarn = Math.max(0, gate.drWarn - dt); if (host && !casts.some((q) => q.m === gate && q.id === "w6_d_riddle")) { gate.drWarn = 0; gate.drSym = -1; } }
    if (gate.drOpen > 0) gate.drOpen = Math.max(0, gate.drOpen - dt);
  }
  if (sun) {
    if (host && !sun.w6dInit) {
      sun.w6dInit = true; sun.dsBlaze = 0; sun.dsAng = 0; sun.dsSuns = 0; sun.dsUmb = 0;
      for (let i = 0; i < 3; i++) w6dProp("w6_d_umbrella", world.W / 2, world.H / 2, sun, 0.12);
    }
    if (host) {
      // 양산이 아레나 가운데를 빙글 돌아요 (2단계부터 더 빨리)
      const c = w6dCenter(), sp = (sun.phaseIdx || sun.phaseIndex || 0) >= 1 ? 0.42 : 0.24;
      sun.dsUmb = ((sun.dsUmb || 0) + dt * sp) % (Math.PI * 2);
      monsters.filter((o) => o.type === "w6_d_umbrella" && o.hp > 0).forEach((u, i) => {
        const a = sun.dsUmb + i * Math.PI * 2 / 3, tx = c.x + Math.cos(a) * 5, ty = c.y + Math.sin(a) * 5;
        if (!isWall(Math.floor(tx), Math.floor(ty))) { u.x = tx; u.y = ty; }
      });
      if (sun.dsBlaze > 0) { sun.dsBlaze = Math.max(0, sun.dsBlaze - dt); if (!casts.some((q) => q.m === sun && q.id === "w6_d_blaze")) sun.dsBlaze = 0; }
      if (sun.dsSuns > 0) {
        sun.dsAng = ((sun.dsAng || 0) + dt * 1.3) % (Math.PI * 2);
        for (let i = 0; i < sun.dsSuns; i++) {
          const s = w6dSunPos(sun, i);
          for (const p of allPlayers()) {
            if (!p || p.hp <= 0 || (p._w6dSunCd || 0) > game.time) continue;
            if (Math.hypot(p.x - s.x, p.y - s.y) < 0.75) { p._w6dSunCd = game.time + 1.2; w6dHeat(p, sun.damage * 0.5, sun, "앗 작은 해!"); }
          }
        }
      }
    }
  }
}, 44);

// ---------------- 그리기: 바닥 ----------------
function w6dTile(tx, ty, fill, z = 0.01) {
  const a = toScreen(tx, ty, z), b = toScreen(tx + 1, ty, z), c = toScreen(tx + 1, ty + 1, z), d = toScreen(tx, ty + 1, z);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function w6dRgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
function w6dEllipse(x, y, r, fill, stroke, lw = 2.5) {
  const c = toScreen(x, y, 0.02);
  ctx.beginPath(); ctx.ellipse(c.x, c.y, r * TILE_W / 2 * 1.41, r * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
hookOn("drawFloor", () => {
  const snake = w6dBoss("w6_d_snake");
  if (snake) {
    const warn = snake.dcWarn > 0 && snake.dcCall >= 0, pulse = 0.5 + 0.5 * Math.sin(game.time * 7);
    ctx.save();
    for (let ty = 0; ty < world.H; ty++) for (let tx = 0; tx < world.W; tx++) {
      if (world.tiles[ty][tx] !== 0 || !onScreen(tx + 0.5, ty + 0.5)) continue;
      const k = w6dColorAt(tx, ty, snake.dcShift), col = W6D_COLORS[k];
      const safe = warn && k === snake.dcCall;
      w6dTile(tx, ty, warn ? (safe ? w6dRgba(col.c, 0.5 + 0.2 * pulse) : "rgba(20,10,20,0.35)") : w6dRgba(col.c, 0.2)); // 부를 때: 안전한 색만 밝고 나머지는 어둡게
    }
    // 2x2 덩어리 가운데에 모양 (색이 헷갈려도 모양으로)
    for (let ty = 0; ty < world.H; ty += 2) for (let tx = 0; tx < world.W; tx += 2) {
      if (!world.tiles[ty] || world.tiles[ty][tx] !== 0 || !world.tiles[ty + 1] || world.tiles[ty + 1][tx + 1] !== 0 || !onScreen(tx + 1, ty + 1)) continue;
      const k = w6dColorAt(tx, ty, snake.dcShift), col = W6D_COLORS[k], safe = warn && k === snake.dcCall;
      if (warn && !safe) continue;
      const s = toScreen(tx + 1, ty + 1, 0.03);
      if (col.sym === "★") drawStar(s.x, s.y, (safe ? 11 : 7) * ZOOM, safe ? "#ffffff" : w6dRgba(col.c, 0.8));
      else text(col.sym, s.x, s.y + 6 * ZOOM, Math.round((safe ? 18 : 12) * ZOOM), safe ? "#ffffff" : w6dRgba(col.c, 0.8), "center");
    }
    ctx.restore();
  }
  const gate = w6dBoss("w6_d_gate");
  if (gate) for (const o of monsters) if (o.type === "w6_d_plate" && o.hp > 0) {
    const want = gate.drWarn > 0 && gate.drSym === o.sym;
    w6dEllipse(o.x, o.y, 0.95, want ? `rgba(125,255,176,${0.25 + 0.2 * Math.sin(game.time * 8)})` : "rgba(80,60,40,0.25)", want ? "#7dffb0" : "#e8d8b0", want ? 4 : 2);
  }
  const sun = w6dBoss("w6_d_sunking");
  if (sun) {
    const blaze = sun.dsBlaze > 0;
    for (const o of monsters) if (o.type === "w6_d_umbrella" && o.hp > 0) w6dEllipse(o.x, o.y, W6D_SHADE_R, blaze ? `rgba(60,120,80,${0.35 + 0.15 * Math.sin(game.time * 8)})` : "rgba(40,60,50,0.25)", blaze ? "#7dffb0" : "rgba(160,220,180,0.6)", blaze ? 4 : 2);
  }
}, 56);
hookOn("lights", (lights) => {
  const sun = w6dBoss("w6_d_sunking");
  if (sun) { lights.push({ x: sun.x, y: sun.y, radius: 6, power: 1 }); for (let i = 0; i < (sun.dsSuns || 0); i++) { const s = w6dSunPos(sun, i); lights.push({ x: s.x, y: s.y, radius: 2, power: 0.8 }); } }
  for (const o of monsters) if (o.type === "w6_d_cpillar" && o.hp > 0) lights.push({ x: o.x, y: o.y, radius: 1.6, power: 0.5 });
}, 50);

// ---------------- 그리기: 화면 안내 (친구 화면도 같은 칸을 봐요) ----------------
hookOn("hudDraw", () => {
  if (game.scene !== "dungeon" || game.overlay) return;
  const W = view.w, y = 150;
  const snake = w6dBoss("w6_d_snake");
  if (snake && snake.dcWarn > 0 && snake.dcCall >= 0) {
    const col = W6D_COLORS[snake.dcCall];
    text(`${col.sym} ${col.name} ${col.sym} 바닥으로! ${Math.ceil(snake.dcWarn)}`, W / 2, y, 30, col.c, "center");
  }
  const gate = w6dBoss("w6_d_gate");
  if (gate && gate.drWarn > 0 && gate.drSym >= 0) {
    const s = W6D_SYMS[gate.drSym];
    text(`${s.s} ${s.name} 발판을 밟아요! ${Math.ceil(gate.drWarn)}`, W / 2, y, 30, s.c, "center");
  }
  if (gate && gate.drOpen > 0) text(`이마 보석이 열렸어요! 지금 때려요 ${Math.ceil(gate.drOpen)}`, W / 2, y + 34, 20, "#7ad8ff", "center");
  if (snake && snake.dcPaint > 0) { const col = W6D_COLORS[snake.dcPaintC] || W6D_COLORS[0]; text(`알록이가 ${col.name}으로 물들었어요! 지금 때려요 ${Math.ceil(snake.dcPaint)}`, W / 2, y + 34, 20, col.c, "center"); }
  const sun = w6dBoss("w6_d_sunking");
  if (sun && sun.dsBlaze > 0) text(`햇볕 쨍쨍! 초록 양산 그늘로! ${Math.ceil(sun.dsBlaze)}`, W / 2, y, 30, "#ffb84a", "center");
}, 45);

// ---------------- 그리기: 모습 ----------------
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  // 색모래 뱀 알록이: 마디마다 색이 다른 통통한 뱀, 큰 눈, 혀 날름
  w6_d_snake(m) {
    const P = b2Pose(m), t = game.time, painted = m.dcPaint > 0 ? (W6D_COLORS[m.dcPaintC] || W6D_COLORS[0]).c : null;
    const seg = (i) => painted || W6D_COLORS[(i + Math.floor(t * 1.5)) % 4].c;
    const parts = [];
    for (let i = 5; i >= 1; i--) {
      const f = -i * 0.32, s = Math.sin(t * 3 + i * 0.9) * 0.22 * (m.moving ? 1.3 : 0.6), w = 0.48 - i * 0.03;
      parts.push({ f, s, z: 0, w, d: w, h: w * 0.9, c: seg(i) });
    }
    const up = 0.35 + P.cast * 0.35 + P.breath;
    parts.push({ f: 0.1, s: 0, z: 0, w: 0.42, d: 0.42, h: 0.3 + up * 0.6, c: seg(0) }); // 목
    parts.push({ f: 0.26, s: 0, z: 0.3 + up * 0.6, w: 0.5, d: 0.52, h: 0.4, c: painted || "#ff9ad8", face: true, eye: "#ffffff", pupil: "#3a1a4a", blush: "#ffd23f" }); // 머리 (분홍)
    parts.push({ f: 0.26, s: 0, z: 0.7 + up * 0.6, w: 0.3, d: 0.2, h: 0.1, c: "#ffd23f" }); // 작은 볏
    if (Math.sin(t * 4) > 0.3) parts.push({ f: 0.72, s: 0, z: 0.55 + up, w: 0.22, d: 0.07, h: 0.05, c: "#ff4a6a" }); // 혀
    b2DrawBody(m, parts, { top: 1.7 });
  },
  // 돌 수문장 끄덕이: 네모난 돌 몸, 큰 돌 머리, 이마 보석(정답이면 반짝 열려요), 정답일 때 끄덕끄덕
  w6_d_gate(m) {
    const P = b2Pose(m), open = m.drOpen > 0, nod = open ? Math.abs(Math.sin(game.time * 8)) * 0.1 : 0;
    const stone = "#c8b088", dark = "#9a8460";
    const parts = [
      { f: -0.05, s: 0, z: 0, w: 0.9, d: 1.0, h: 0.75 + P.breath, c: stone },                  // 몸
      { f: 0.3, s: 0.42, z: 0, w: 0.42, d: 0.3, h: 0.4, c: dark }, { f: 0.3, s: -0.42, z: 0, w: 0.42, d: 0.3, h: 0.4, c: dark }, // 앞발
      { f: 0.22, s: 0, z: 0.75 + P.breath - nod, w: 0.8, d: 0.9, h: 0.72, c: "#d8c098", face: true, eye: "#fff6d8", pupil: "#3a2a1a" }, // 머리
      { f: 0.18, s: 0.48, z: 0.9 - nod, w: 0.5, d: 0.12, h: 0.75, c: "#7ab8d8" }, { f: 0.18, s: -0.48, z: 0.9 - nod, w: 0.5, d: 0.12, h: 0.75, c: "#7ab8d8" }, // 두건
      { f: 0.2, s: 0, z: 1.47 - nod, w: 0.6, d: 0.8, h: 0.1, c: "#7ab8d8" },
      { f: 0.63, s: 0, z: 1.2 - nod, w: 0.06, d: 0.22, h: 0.18, c: open ? "#7affff" : "#5a6a7a" }, // 이마 보석
    ];
    b2DrawBody(m, parts, { top: 1.9 });
    if (m.drWarn > 0 && m.drSym >= 0 && !m.trophy) { const s = W6D_SYMS[m.drSym], c = toScreen(m.x, m.y, 2.3 * (m.b2Scale || 1)); text(s.s, c.x, c.y, Math.round(40 * ZOOM * 0.8), s.c, "center"); }
    if (open && !m.trophy) { const c = toScreen(m.x, m.y, 1.6 * (m.b2Scale || 1)); drawStar(c.x, c.y, 10 * ZOOM, "#7affff"); }
  },
  // 태양 왕 이글이: 동그란 해 얼굴, 빙글 도는 햇살, 작은 왕관 (3단계: 작은 해 셋)
  w6_d_sunking(m) {
    const P = b2Pose(m), t = game.time, glow = m.dsBlaze > 0 ? "#fff0a0" : "#ffd060";
    const parts = [
      { f: 0, s: 0, z: 0.1 + P.breath, w: 1.0, d: 1.0, h: 0.95, c: "#ffb84a", face: true, eye: "#ffffff", pupil: "#6a2a0a", blush: "#ff7a5a" }, // 해 얼굴
      { f: 0, s: 0, z: 1.05 + P.breath, w: 0.6, d: 0.6, h: 0.12, c: "#ffe27a" },               // 왕관 받침
      { f: 0.2, s: 0.2, z: 1.17 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: "#ffe27a" }, { f: -0.2, s: -0.2, z: 1.17 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: "#ffe27a" },
      { f: 0.2, s: -0.2, z: 1.17 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: "#ffe27a" }, { f: -0.2, s: 0.2, z: 1.17 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: "#ffe27a" },
    ];
    for (let i = 0; i < 8; i++) { const a = t * (m.dsBlaze > 0 ? 2.5 : 0.8) + i * Math.PI / 4; parts.push({ f: Math.cos(a) * 0.66, s: Math.sin(a) * 0.66, z: 0.5 + P.breath, w: 0.11, d: 0.11, h: 0.11, c: glow }); }
    b2DrawBody(m, parts, { top: 1.8 });
    if (!m.trophy) for (let i = 0; i < (m.dsSuns || 0); i++) {
      const s = w6dSunPos(m, i);
      drawBox(s.x - 0.22, s.y - 0.22, 0.4, 0.44, 0.44, 0.44, "#ffd060");
      const c = toScreen(s.x, s.y, 1.05); drawStar(c.x, c.y, 6 * ZOOM, "#fff6c0");
    }
  },
  w6_d_cpillar(m) {
    const col = W6D_COLORS[m.c] || W6D_COLORS[0];
    drawBox(m.x - 0.3, m.y - 0.3, 0, 0.6, 0.6, 1.3, col.c);
    drawBox(m.x - 0.34, m.y - 0.34, 1.3, 0.68, 0.68, 0.12, "#f4ecdc");
    const s = toScreen(m.x, m.y, 1.75);
    if (col.sym === "★") drawStar(s.x, s.y, 9 * ZOOM, "#ffffff"); else text(col.sym, s.x, s.y + 6 * ZOOM, Math.round(16 * ZOOM), "#ffffff", "center");
  },
  w6_d_plate(m) {
    drawBox(m.x - 0.55, m.y - 0.55, 0, 1.1, 1.1, 0.08, "#b8a078");
    const s = W6D_SYMS[m.sym] || W6D_SYMS[0], c = toScreen(m.x, m.y, 0.12);
    text(s.s, c.x, c.y + 7 * ZOOM, Math.round(22 * ZOOM), s.c, "center");
  },
  w6_d_umbrella(m) {
    drawBox(m.x - 0.04, m.y - 0.04, 0, 0.08, 0.08, 1.4, "#8a6a4a");
    for (let i = 0; i < 4; i++) { const w = 1.3 - i * 0.3; drawBox(m.x - w / 2, m.y - w / 2, 1.4 + i * 0.12, w, w, 0.12, i % 2 ? "#ffffff" : "#5ac87a"); }
  },
});

hookOn("monsterKilled", (m) => {
  if (!m || !m.w6dKind) return;
  const msg = { w6_d_snake: "알록이가 말해요: \"색이 너무 좋아서 장난쳤어. 새 색깔은 스핑크스 문 너머로 갔어!\"",
    w6_d_gate: "끄덕이가 끄덕끄덕: \"수수께끼를 다 맞혔구나! 태양 왕좌로 가는 문을 열어 줄게.\"",
    w6_d_sunking: "이글이가 웃어요: \"햇볕을 너무 세게 비췄네. 무지개 피라미드에 새 색깔이 숨어 있어!\"" }[m.w6dKind];
  if (msg) showMessage(msg, 4.5, true);
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") Object.assign(GUIDE_PHASE_VOICE, {
  rainbowsand: { 0: "알록이가 부른 색과 모양 바닥으로 가요", 1: "색 기둥을 치면 알록이가 물들어요", 2: "색 부르기가 빨라져요" },
  sphinxgate: { 0: "머리 위 모양과 같은 발판을 밟아요", 1: "정답이면 이마 보석이 열려요", 2: "돌 주먹 원 사이로 피해요" },
  sunthrone: { 0: "햇볕 쨍쨍 때 양산 그늘로 숨어요", 1: "양산이 더 빨리 돌아요", 2: "작은 해를 피해요" },
});
