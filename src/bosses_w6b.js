// ===== 월드 6 새 보스 5~8 (신기루 모습 대신 새로 만든 사막 보스) =====
//   5 dunecastle  모래성 기사 와르르: 모래탑을 쌓아요. 탑을 치면 친 쪽으로 쓰러져요 → 보스 위로 넘어뜨리면 비틀! P3 성벽이 다가와요(가운데로)
//   6 starnight   사막 올빼미 반짝눈: 깜깜한 밤. 평소엔 흐릿해서 덜 아파요. 등불을 치면 켜지고, 올빼미가 불빛에 들어오면 깜짝 비틀! P3 별똥별 비 (켜진 등불 곁은 안전)
//   7 scarabhall  쇠똥구리 대장 데굴데굴: 커다란 모래 공을 굴려요(벽에 튕겨요, 앞길이 보여요). 공을 치면 친 쪽으로 굴러가요 → 보스에 맞히면 비틀! P2 공 둘, P3 공 타고 돌진
//   8 windcanyon  회오리 독수리 휘잉이: 바람이 한쪽으로 휙(예고 화살표). 바위 뒤에 서면 안 밀려요. 움직이는 회오리. P3 줄무늬 바람(밀리는 줄이 번갈아)
// 사막 보스 규칙(물 항아리)은 bosses_w6.js 가 그대로 해요 (bossDef.world === 6).
// 같이 하기: 탑·등불·공·회오리는 소품 몬스터, 바람은 보스 칸(w6Gust...)이라 친구 화면에도 가요. 계산(넘어짐·굴러감·밀기)은 방장만. 밀기는 moveEntity → 친구는 방장이 보낸 밀림으로 똑같이 움직여요.

const W6N = {
  towerMax: 5, fallWarn: 0.9, fallLen: 4.2, fallW: 1.3, fallHurt: 1.6, stun: 3.0, frac: 0.04,
  lampLit: 11, lampR: 3.4, owlStunCd: 6, owlHiddenDmg: 0.5,
  ballSpeed: 5.0, ballLife: 6.5, ballHurt: 1.5, ballR: 0.6,
  gustWarn: { easy: 2.2, normal: 1.7, hard: 1.5, nightmare: 1.35 }, gustBlow: 2.6, gustSpeed: 4.2, tornadoLife: 8, tornadoSpeed: 1.3,
};
const W6N_MAPS = ["dunecastle", "starnight", "scarabhall", "windcanyon"];
function w6nGuest() { return typeof netGuest === "function" && netGuest(); }
function w6nBoss(kind) { const b = typeof w6bBoss === "function" ? w6bBoss() : null; return b && b.w6n === kind ? b : null; }
function w6nStun(b, text) {
  if (typeof w5bStun === "function") w5bStun(b, W6N.stun, W6N.frac, text, "#ffe27a");
  else { b.stagger = Math.max(b.stagger || 0, W6N.stun); damageMonster(b, b.maxHp * W6N.frac, b.x, b.y, false, 0, { w6Prop: true }); addFloatText(b.x, b.y, text, "#ffe27a", 24); }
}
function w6nSegDist(px, py, ax, ay, bx, by) { const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1; const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2)); return Math.hypot(px - (ax + vx * t), py - (ay + vy * t)); }
function w6nNearestPlayer(x, y) { let best = null, bd = 1e9; for (const p of allPlayers()) if (p && p.hp > 0) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } } return best; }
function w6nDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
// 바닥에 그리는 띠 (예고 길)
function w6nDrawLane(ax, ay, bx, by, w, col, a = 0.3) {
  const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
  const P = [toScreen(ax + nx, ay + ny, 0.02), toScreen(bx + nx, by + ny, 0.02), toScreen(bx - nx, by - ny, 0.02), toScreen(ax - nx, ay - ny, 0.02)];
  ctx.save(); ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y); for (const q of P.slice(1)) ctx.lineTo(q.x, q.y); ctx.closePath();
  ctx.fillStyle = col; ctx.globalAlpha = a; ctx.fill(); ctx.globalAlpha = 0.9; ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke(); ctx.restore();
}

// ----- 새 기술 -----
//   "w6_b" 기술 중 trigger: true 는 예고만 보여 주고, 끝나면 이 파일이 할 일을 해요 (resolveCast 훅)
Object.assign(ABILITIES, {
  w6_bbuild: { name: "모래탑 쌓기", desc: "와르르가 모래탑을 쌓아요. 탑을 치면 친 쪽으로 쓰러져요!", counter: "탑 뒤로 가서 와르르 쪽으로 쳐서 넘어뜨려요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 1.2 }, cooldown: 9, range: [0, 40], damageMul: 0, anim: "raise", trigger: true, effect: { type: "damage" } },
  w6_btopple: { name: "모래탑 와르르", desc: "와르르가 탑들을 주인공 쪽으로 밀어 넘어뜨려요. 바닥에 넘어질 길이 보여요.", counter: "주황 길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.3 }, cooldown: 10, range: [0, 40], damageMul: 0, anim: "slam", trigger: true, effect: { type: "damage" } },
  w6_bwalls: { name: "성벽 다가오기", desc: "모래 성벽이 둘레에서 다가와요. 가운데 둥근 자리는 안전해요.", counter: "가운데(와르르 곁)로 모여요",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 13, inner: 5.5, at: "self", time: 1.8 }, cooldown: 13, range: [0, 40], damageMul: 1.3, anim: "roar", effect: { type: "pull", force: 2.0 } },
  w6_bswoop: { name: "올빼미 휙", desc: "반짝눈이 길을 따라 휙 날아와요.", counter: "길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.5, at: "self", time: 1.3 }, cooldown: 6, range: [0, 30], damageMul: 1.4, anim: "point", trigger: true, effect: { type: "damage" } },
  w6_bhoot: { name: "부엉 바람", desc: "날개를 퍼덕여 둘레를 밀어내요.", counter: "멀리 떨어져 있어요",
    tags: ["boss", "circle"], telegraph: { shape: "circle", radius: 3.2, at: "self", time: 1.2 }, cooldown: 9, range: [0, 3.5], damageMul: 1.1, anim: "roar", effect: { type: "knockback", force: 2.2 } },
  w6_bstarfall: { name: "별똥별 비", desc: "별똥별이 여기저기 떨어져요. 켜진 등불 곁은 안전해요!", counter: "등불을 켜고 그 불빛 안으로!",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.4 }, cooldown: 11, range: [0, 40], damageMul: 1.4, anim: "raise",
    effect: { type: "rain", count: 8, spread: 4.2, stagger: 0.16 } },
  w6_broll: { name: "모래 공 굴리기", desc: "커다란 모래 공을 굴려요. 벽에 튕기며 앞길이 보여요.", counter: "공 길 옆으로! 공을 치면 친 쪽으로 굴러가요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 9, width: 1.4, at: "self", time: 1.3 }, cooldown: 7, range: [0, 40], damageMul: 0, anim: "crouch", trigger: true, effect: { type: "damage" } },
  w6_bride: { name: "공 타고 데굴데굴", desc: "데굴데굴이 공에 올라타 길을 따라 굴러와요.", counter: "길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 13, width: 1.9, at: "self", time: 1.5 }, cooldown: 9, range: [0, 30], damageMul: 1.5, anim: "crouch", trigger: true, effect: { type: "damage" } },
  w6_bgust: { name: "협곡 바람", desc: "바람이 한쪽으로 휙 불어요. 바위 뒤에 서면 안 밀려요.", counter: "바람이 오는 쪽 바위 뒤에 숨어요",
    tags: ["boss", "zone"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.2 }, cooldown: 11, range: [0, 40], damageMul: 0, anim: "raise", trigger: true, effect: { type: "damage" } },
  w6_btornado: { name: "작은 회오리", desc: "작은 회오리가 천천히 따라와요. 닿으면 따끔해요.", counter: "회오리를 피해 빙 돌아요",
    tags: ["boss", "summon"], telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.3 }, cooldown: 12, range: [0, 40], damageMul: 0, anim: "roar", trigger: true, effect: { type: "damage" } },
  w6_bfeather: { name: "깃털 날리기", desc: "깃털을 부채꼴로 날려요.", counter: "옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 9, width: 1.3, at: "self", time: 1.2 }, cooldown: 6, range: [0, 9], damageMul: 1.3, anim: "point", effect: { type: "damage" } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w6_bbuild: { text: "탑을 쳐서 와르르 쪽으로 넘어뜨려요", do: true }, w6_btopple: { text: "주황 길 옆으로" }, w6_bwalls: { text: "가운데로 모여요!", do: true },
  w6_bswoop: { text: "길 옆으로 비켜요" }, w6_bhoot: { text: "멀리 떨어져요" }, w6_bstarfall: { text: "켜진 등불 곁으로!", do: true },
  w6_broll: { text: "공 길 옆으로! 공을 쳐서 보스에게", do: true }, w6_bride: { text: "길 옆으로 비켜요" },
  w6_bgust: { text: "바위 뒤에 숨어요!", do: true }, w6_btornado: { text: "회오리를 피해요" }, w6_bfeather: { text: "옆으로 비켜요" },
});
const W6N_TRIGGERS = new Set(["w6_bbuild", "w6_btopple", "w6_broll", "w6_bgust", "w6_btornado", "w6_bswoop", "w6_bride"]);

// ----- 소품 -----
for (const [id, name, color] of [["w6_btower", "모래탑", "#e8c888"], ["w6_blamp", "사막 등불", "#ffd070"], ["w6_bball", "모래 공", "#c8a060"], ["w6_btornado", "작은 회오리", "#e0d4b8"]]) {
  MONSTERS[id] = { name, color, shape: id, behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 6, codexSkip: true };
  if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add(id);
  if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push(id);
}

// ----- 보스 정의 -----
const W6N_LIST = [
  { mapId: "dunecastle", kind: "castle", type: "w6_bcastleKnight", name: "모래성 기사 와르르", title: "모래성 마을", size: 3.0, hp: 400, speed: 1.15,
    theme: { floor: "#e0c490", moss: "#ecd6a8", wall: "#b08c5a", darkness: 0.28, bg: "#1a1206" },
    phases: [
      { until: 0.66, abilities: ["w6_bbuild", "w6_btopple", "w6_sandWave"] },
      { until: 0.33, abilities: ["w6_bbuild", "w6_btopple", "w6_sandRain", "w6_sandWave"] },
      { abilities: ["w6_bwalls", "w6_bbuild", "w6_btopple", "w6_sandRain"] },
    ],
    material: { id: "w6_bcastleBrick", name: "반짝 모래 벽돌", color: "#f0d8a0" },
    legend: { id: "L_w6_bdunecastle", slot: "charm", name: "모래성 깃발", icon: "amulet", color: "#f0d8a0", perk: { hearts: 3, block: 0.1 }, desc: "와르르의 깃발: 하트 +3, 막기 +10%" },
    line: "원래는 아이들이 쌓은 모래성을 지키던 꼬마 기사였어요",
    msgs: ["탑을 쳐서 와르르 쪽으로 넘어뜨려요!", "와르르가 더 빨리 쌓아요! 넘어질 길을 잘 봐요", "성벽이 다가와요! 가운데로 모여요"] },
  { mapId: "starnight", kind: "owl", type: "w6_bnightOwl", name: "사막 올빼미 반짝눈", title: "별빛 사막 밤", size: 2.8, hp: 405, speed: 1.6,
    theme: { floor: "#58507a", moss: "#6a6290", wall: "#3a3456", darkness: 0.78, bg: "#06040e" },
    phases: [
      { until: 0.66, abilities: ["w6_bswoop", "w6_bhoot"] },
      { until: 0.33, abilities: ["w6_bswoop", "w6_bhoot", "w6_mirageCall"] },
      { abilities: ["w6_bstarfall", "w6_bswoop", "w6_bhoot"] },
    ],
    material: { id: "w6_bnightFeather", name: "별빛 깃털", color: "#a8a0e8" },
    legend: { id: "L_w6_bstarnight", slot: "charm", name: "반짝눈 안경", icon: "ring", color: "#a8a0e8", perk: { luck: 0.3, speed: 0.06 }, desc: "반짝눈의 동그란 안경: 행운 +30%, 빠르기" },
    line: "원래는 밤길 잃은 낙타를 등불로 안내하던 올빼미였어요",
    msgs: ["등불을 쳐서 켜요! 반짝눈이 불빛에 들어오면 깜짝!", "꼬마 신기루가 와요! 등불을 꺼지지 않게", "별똥별 비! 켜진 등불 곁으로!"] },
  { mapId: "scarabhall", kind: "scarab", type: "w6_bscarabChief", name: "쇠똥구리 대장 데굴데굴", title: "쇠똥구리 굴", size: 2.8, hp: 410, speed: 1.3,
    theme: { floor: "#b89868", moss: "#c8aa78", wall: "#7a5a38", darkness: 0.4, bg: "#120a04" },
    phases: [
      { until: 0.66, abilities: ["w6_broll", "w6_sandWave"] },
      { until: 0.33, abilities: ["w6_broll", "w6_sunSpot", "w6_sandWave"] },
      { abilities: ["w6_bride", "w6_broll", "w6_sandRain"] },
    ],
    material: { id: "w6_bscarabShell", name: "반짝 등껍질", color: "#7ad0a0" },
    legend: { id: "L_w6_bscarabhall", slot: "charm", name: "데굴데굴 구슬", icon: "bracelet", color: "#7ad0a0", perk: { regen: 10, hearts: 2 }, desc: "데굴데굴이 아끼던 구슬: 다시 차는 하트, 하트 +2" },
    line: "원래는 사막 길을 동글동글 다져 주던 일꾼 대장이었어요",
    msgs: ["모래 공을 쳐서 데굴데굴에게 맞혀요!", "공이 둘이에요! 길을 잘 봐요", "공에 올라탔어요! 길 옆으로 비켜요"] },
  { mapId: "windcanyon", kind: "eagle", type: "w6_bwindEagle", name: "회오리 독수리 휘잉이", title: "바람 협곡", size: 3.0, hp: 415, speed: 1.5,
    theme: { floor: "#d8b888", moss: "#e4c89c", wall: "#a07850", darkness: 0.3, bg: "#140c04" },
    rocks: [[-5, -4], [5, -4], [-5, 4], [5, 4], [0, -7], [0, 7], [-8, 0], [8, 0]],
    phases: [
      { until: 0.66, abilities: ["w6_bgust", "w6_bfeather"] },
      { until: 0.33, abilities: ["w6_bgust", "w6_btornado", "w6_bfeather"] },
      { abilities: ["w6_bgust", "w6_btornado", "w6_bfeather", "w6_sandRain"] },
    ],
    material: { id: "w6_bwindFeather", name: "바람 깃털", color: "#e8f0ff" },
    legend: { id: "L_w6_bwindcanyon", slot: "charm", name: "휘잉이 바람 깃", icon: "clover", color: "#e8f0ff", perk: { speed: 0.1, hearts: 2 }, desc: "휘잉이의 바람 깃: 빠르기 +10%, 하트 +2" },
    line: "원래는 협곡 바람으로 모래 언덕을 예쁘게 빚던 독수리였어요",
    msgs: ["바람이 불어요! 바위 뒤에 숨어요", "회오리가 따라와요! 빙 돌아 피해요", "줄무늬 바람! 밀리는 줄을 잘 봐요"] },
];
for (const E of W6N_LIST) {
  MONSTERS[E.type] = { color: E.material.color, name: E.name, shape: E.type, behavior: "b2_boss", hp: E.hp, speed: E.speed, damage: 2.7, xp: 90, emerald: 1, emeraldCount: 20,
    attackRange: 2.2, attackCooldown: 1.8, world: 6, isBoss: true, heavy: true, size: E.size, phases: E.phases };
  MATERIALS[E.material.id] = { name: E.material.name, color: E.material.color };
  BOSS_DEFS[E.mapId] = {
    id: E.type, name: E.name, title: E.title, size: E.size, world: 6, w6New: true, material: E.material,
    arena: { size: 26, theme: E.theme, build: E.rocks ? (w) => { if (typeof b2Pillars === "function") b2Pillars(w, E.rocks); } : undefined },
    phases: E.phases,
    create(x, y, level) {
      const m = b2MakeBoss(E.type, x, y, level, E.size);
      m.bossDef = BOSS_DEFS[E.mapId]; m.name = `${E.title}, ${E.name}`; m.w6n = E.kind;
      const base = m.onPhase;
      m.onPhase = (idx) => { if (base) base(idx); const t = E.msgs[idx]; if (t) showMessage(t, 3, false, "#ffe27a"); };
      return m;
    },
  };
  if (typeof w6RegisterLegend === "function") w6RegisterLegend(E.mapId, E.legend);
  if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE[E.mapId] = { 0: E.msgs[0], 1: E.msgs[1], 2: E.msgs[2] };
}
if (typeof storyBossLines === "function") storyBossLines(Object.fromEntries(W6N_LIST.map((E) => [E.mapId, E.line])));
if (typeof BOSS_VOICE !== "undefined") Object.assign(BOSS_VOICE, {
  dunecastle: { intro: () => { [392, 494, 587].forEach((f, i) => tone(f, 0.18, "square", 0.05, null, i * 0.12)); noise(0.5, 0.15, 500, "lowpass", 0.4); }, fall: () => { noise(0.9, 0.25, 400, "lowpass"); tone(200, 0.6, "triangle", 0.06, 80); } },
  starnight: { intro: () => { tone(520, 0.3, "sine", 0.06, 390); tone(520, 0.3, "sine", 0.06, 390, 0.45); }, fall: () => { [880, 1046, 1318].forEach((f, i) => tone(f, 0.2, "sine", 0.05, null, i * 0.1)); } },
  scarabhall: { intro: () => { for (let i = 0; i < 5; i++) tone(140 + i * 20, 0.08, "square", 0.05, null, i * 0.09); }, fall: () => { tone(300, 0.5, "triangle", 0.06, 90); noise(0.5, 0.2, 600, "lowpass", 0.2); } },
  windcanyon: { intro: () => { noise(1.0, 0.18, 1400, "bandpass"); tone(700, 0.5, "sine", 0.05, 1100, 0.3); }, fall: () => { noise(0.8, 0.15, 900, "bandpass"); tone(900, 0.6, "sine", 0.05, 300); } },
});

// ----- 기술이 끝날 때 (방장만) -----
hookOn("resolveCast", (c, p) => {
  if (!c || !c.id) return false;
  // 별똥별: 켜진 등불 불빛 안은 안전
  if (c.id === "w6_bstarfall" && p && w6nLitAt(p.x, p.y)) { if (!c.sub || c.ownerLock) addFloatText(p.x, p.y, "등불이 지켜 줬어요!", "#ffe27a", 15); addRing(c.x, c.y, { speed: 4, life: 0.3, hue: 50 }); return true; }
  if (!W6N_TRIGGERS.has(c.id)) return false;
  if (w6nGuest()) return true;
  const b = c.m; if (!b || b.hp <= 0) return true;
  if (c.id === "w6_bbuild") w6nBuild(b);
  else if (c.id === "w6_btopple") w6nToppleAll(b);
  else if (c.id === "w6_broll") w6nRoll(b, c);
  else if (c.id === "w6_bgust") w6nGustStart(b);
  else if (c.id === "w6_btornado") w6nTornado(b, c);
  else if (c.id === "w6_bswoop" || c.id === "w6_bride") w6nDashStart(b, c);
  return true;
}, 40);

// ===== 5 모래성 기사 와르르 =====
function w6nTowers() { return monsters.filter((o) => o.type === "w6_btower" && o.hp > 0); }
function w6nBuild(b) {
  const have = w6nTowers().length, want = Math.min(W6N.towerMax - have, b.phaseIdx >= 1 || b.phaseIndex >= 1 ? 3 : 2);
  const p = w6nNearestPlayer(b.x, b.y) || b;
  for (let i = 0; i < want; i++) {
    const a = Math.random() * Math.PI * 2, d = 2.4 + Math.random() * 1.6;
    const t = spawnProp("w6_btower", p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, b);
    t.r = 0.4; t.appearTimer = 0.3; t.fallT = 0; t.fdx = 0; t.fdy = 0; t.byPlayer = 0;
  }
  if (want > 0) { addFloatText(b.x, b.y, "영차영차! 모래탑", "#f0d8a0", 18); spawnDust(b.x, b.y); }
}
function w6nFall(t, dx, dy, byPlayer) {
  if (t.fallT > 0) return;
  const l = Math.hypot(dx, dy) || 1;
  t.fdx = dx / l; t.fdy = dy / l; t.fallT = byPlayer ? W6N.fallWarn * 0.6 : W6N.fallWarn; t.byPlayer = byPlayer ? 1 : 0;
}
function w6nToppleAll(b) {
  for (const t of w6nTowers()) { const p = w6nNearestPlayer(t.x, t.y); if (p) w6nFall(t, p.x - t.x, p.y - t.y, false); }
  addFloatText(b.x, b.y, "와르르 밀기!", "#ffb070", 20);
}
hookOn("monsterDamage", (h) => {
  const t = h && h.m; if (!t || t.type !== "w6_btower") return false;
  if (!h.opts.dot && !(t.fallT > 0) && !w6nGuest()) { w6nFall(t, t.x - h.fromX, t.y - h.fromY, true); addFloatText(t.x, t.y, "기우뚱!", "#ffe27a", 16); }
  return true;
}, 4);

// ===== 6 사막 올빼미 반짝눈 =====
function w6nLamps() { return monsters.filter((o) => o.type === "w6_blamp"); }
function w6nLitAt(x, y) { return w6nLamps().some((l) => l.lit > 0 && Math.hypot(l.x - x, l.y - y) < W6N.lampR); }
function w6nOwlShown(m) { return !!(m && (m.state === "cast" || m.stagger > 0 || m.hitT > 0 || w6nLitAt(m.x, m.y) || m.trophy)); }
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m) return false;
  if (m.type === "w6_blamp") {
    if (!h.opts.dot && !w6nGuest()) { if (!(m.lit > 0)) { addFloatText(m.x, m.y, "반짝! 등불이 켜졌어요", "#ffe27a", 17); if (typeof sfx !== "undefined" && sfx.sparkle) sfx.sparkle(); } m.lit = W6N.lampLit; }
    return true;
  }
  if (m.w6n === "owl" && !w6nOwlShown(m) && h.dmg > 0) { h.dmg *= W6N.owlHiddenDmg; if (!(m._w6nTip > game.time)) { m._w6nTip = game.time + 3; addFloatText(m.x, m.y, "깜깜해서 덜 아파요! 등불을 켜요", "#c8c0ff", 14); } }
  return false;
}, 5);
hookOn("monsterAlpha", (a, m) => (m && m.w6n === "owl" && m.hp > 0 && !w6nOwlShown(m) ? Math.min(a, 0.3) : a), 50);
hookOn("lights", (lights) => { for (const l of monsters) if (l.type === "w6_blamp") lights.push({ x: l.x, y: l.y, radius: l.lit > 0 ? W6N.lampR : 0.9, power: l.lit > 0 ? 0.95 : 0.4 }); }, 50);

// ===== 7 쇠똥구리 대장 데굴데굴 =====
function w6nBalls() { return monsters.filter((o) => o.type === "w6_bball" && o.hp > 0); }
function w6nBallMake(b, dx, dy) {
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const s = spawnProp("w6_bball", b.x + ux * (b.r + 0.9), b.y + uy * (b.r + 0.9), b);
  s.r = W6N.ballR; s.appearTimer = 0; s.vx = ux * W6N.ballSpeed; s.vy = uy * W6N.ballSpeed; s.life = W6N.ballLife; s.kicked = 0; s.spin = 0;
  return s;
}
function w6nRoll(b, c) {
  const p = w6nNearestPlayer(b.x, b.y) || { x: b.x + 1, y: b.y };
  const dx = p.x - b.x, dy = p.y - b.y, two = (b.phaseIdx || b.phaseIndex || 0) >= 1;
  if (two) { const a = Math.atan2(dy, dx); for (const o of [-0.35, 0.35]) w6nBallMake(b, Math.cos(a + o), Math.sin(a + o)); }
  else w6nBallMake(b, dx, dy);
  addFloatText(b.x, b.y, two ? "데굴데굴 두 개!" : "데굴데굴!", "#f0d8a0", 18);
}
hookOn("monsterDamage", (h) => {
  const s = h && h.m; if (!s || s.type !== "w6_bball") return false;
  if (!h.opts.dot && !w6nGuest()) {
    const dx = s.x - h.fromX, dy = s.y - h.fromY, l = Math.hypot(dx, dy) || 1;
    s.vx = dx / l * W6N.ballSpeed * 1.15; s.vy = dy / l * W6N.ballSpeed * 1.15; s.kicked = 1; s.life = Math.max(s.life || 0, 3);
    addFloatText(s.x, s.y, "뻥!", "#ffe27a", 18);
  }
  return true;
}, 4);
function w6nRideOn(m) { return m && m.w6n === "scarab" && ((m.state === "cast" && m.castId === "w6_bride") || m.w6Ride > 0); }
hookOn("castStarted", (m, id) => { if (m && m.w6n === "scarab") m.castId = id; }, 50);

// ===== 8 회오리 독수리 휘잉이 =====
function w6nGustStart(b) {
  const p = w6nNearestPlayer(b.x, b.y) || b, a = Math.floor(Math.random() * 4) * Math.PI / 2 + Math.PI / 4; // 화면 기준 위·아래·왼·오른쪽 중 하나
  b.w6GustX = Math.round(Math.cos(a) * 100) / 100; b.w6GustY = Math.round(Math.sin(a) * 100) / 100;
  b.w6GustWarn = W6N.gustWarn[w6nDiff()] || 1.7; b.w6GustT = 0;
  b.w6GustLanes = (b.phaseIdx || b.phaseIndex || 0) >= 2 ? 1 : 0; b.w6GustLane = Math.random() < 0.5 ? 0 : 1;
  addFloatText(b.x, b.y, "휘이잉… 바람이 와요!", "#e8f0ff", 20);
  void p;
}
// 바람을 막아 주는 자리: 바람이 오는 쪽 2칸 안에 바위(벽)가 있으면 안 밀려요
function w6nSheltered(b, x, y) {
  for (const k of [0.6, 1.0, 1.4, 1.9]) { const tx = Math.floor(x - b.w6GustX * k), ty = Math.floor(y - b.w6GustY * k); if (isWall(tx, ty)) return true; }
  return false;
}
function w6nInLane(b, x, y) {
  if (!b.w6GustLanes) return true;
  const s = x * -b.w6GustY + y * b.w6GustX;
  return (((Math.floor(s / 3) % 2) + 2) % 2) === b.w6GustLane;
}
function w6nTornado(b, c) {
  const t = spawnProp("w6_btornado", c.x, c.y, b);
  t.r = 0.5; t.appearTimer = 0.2; t.life = W6N.tornadoLife; t.immovable = true;
}

// 휙 날기 · 공 타고 돌진: 예고한 길(보스 → 길 끝)을 따라 빠르게 이동, 닿은 주인공은 아파요
function w6nDashStart(b, c) {
  const len = c.length || c.ab.telegraph.length || 12, dx = (c.dirX !== undefined ? c.dirX : (c.tx || c.x) - b.x), dy = (c.dirY !== undefined ? c.dirY : (c.ty || c.y) - b.y);
  let ux = dx, uy = dy, l = Math.hypot(ux, uy);
  if (l < 0.01) { const p = w6nNearestPlayer(b.x, b.y) || { x: b.x + 1, y: b.y }; ux = p.x - b.x; uy = p.y - b.y; l = Math.hypot(ux, uy) || 1; }
  b.w6Dash = { vx: ux / l * 11, vy: uy / l * 11, t: len / 11, ride: c.id === "w6_bride" ? 1 : 0, dmg: (b.damage || 2.7) * (c.ab.damageMul || 1) * 0.6 };
  b.faceX = ux / l; b.faceY = uy / l;
}
// ===== 매 화면 (방장만): 탑 넘어짐 · 등불 · 공 · 바람 · 회오리 =====
hookOn("dungeonTick", (dt) => {
  if (w6nGuest()) return;
  const b = typeof w6bBoss === "function" ? w6bBoss() : null;
  const dead = !b;
  // 휙·돌진
  if (b && b.w6Dash) {
    const D = b.w6Dash; D.t -= dt;
    const bx = b.x, by = b.y; moveEntity(b, D.vx * dt, D.vy * dt);
    for (const p of allPlayers()) if (p && p.hp > 0 && Math.hypot(p.x - b.x, p.y - b.y) < (b.r || 1) + (p.r || 0.3) && !((p._w6nDash || 0) > game.time)) {
      p._w6nDash = game.time + 0.8;
      if (p.rollTimer > 0) addFloatText(p.x, p.y, "회피!", "#9be8ff", 16); else { hurtPlayer(p, D.dmg, b); const dx = p.x - b.x, dy = p.y - b.y, l = Math.hypot(dx, dy) || 1; moveEntity(p, dx / l * 1.0, dy / l * 1.0); }
    }
    if (Math.random() < 0.6) spawnDust(b.x, b.y);
    if (D.t <= 0 || Math.hypot(b.x - bx, b.y - by) < 0.01) { b.w6Dash = null; b.w6Ride = 0; }
    else b.w6Ride = D.ride;
  }
  // 모래탑
  for (const t of monsters) {
    if (t.type !== "w6_btower" || t.hp <= 0) continue;
    if (dead) { t.hp = 0; continue; }
    if (!(t.fallT > 0)) continue;
    t.fallT -= dt;
    if (t.fallT > 0) continue;
    const ex = t.x + t.fdx * W6N.fallLen, ey = t.y + t.fdy * W6N.fallLen;
    for (const p of allPlayers()) if (p && p.hp > 0 && w6nSegDist(p.x, p.y, t.x, t.y, ex, ey) < W6N.fallW / 2 + (p.r || 0.3) * 0.6) { if (p.rollTimer > 0) addFloatText(p.x, p.y, "회피!", "#9be8ff", 16); else hurtPlayer(p, W6N.fallHurt, t); }
    if (b && w6nSegDist(b.x, b.y, t.x, t.y, ex, ey) < W6N.fallW / 2 + (b.r || 1) * 0.7) w6nStun(b, t.byPlayer ? "와르르 쿵! 탑에 깔렸어요" : "제 탑에 쿵! 비틀");
    for (let i = 0; i < 5; i++) spawnDust(t.x + t.fdx * i, t.y + t.fdy * i);
    game.shake = Math.max(game.shake || 0, 0.25);
    t.hp = 0; t.dead = true;
  }
  monsters = monsters.filter((o) => !(o.type === "w6_btower" && o.hp <= 0));
  // 등불 (반짝눈 방에 4개)
  if (b && b.w6n === "owl" && !b.w6nLamps) {
    b.w6nLamps = true;
    const c = world.W / 2, d = Math.max(4, world.W / 2 - 6);
    for (const [ox, oy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const s = spawnProp("w6_blamp", c + ox * d * 0.7, c + oy * d * 0.7, b); s.r = 0.35; s.appearTimer = 0; s.lit = 0; }
  }
  for (const l of monsters) if (l.type === "w6_blamp" && l.lit > 0) l.lit = Math.max(0, l.lit - dt);
  if (b && b.w6n === "owl") {
    b.w6nOwlCd = Math.max(0, (b.w6nOwlCd || 0) - dt);
    if (!(b.w6nOwlCd > 0) && b.state !== "cast" && !(b.invulnT > 0) && w6nLitAt(b.x, b.y)) { b.w6nOwlCd = W6N.owlStunCd; w6nStun(b, "깜짝! 불빛에 들켰다"); }
  }
  // 모래 공
  for (const s of monsters) {
    if (s.type !== "w6_bball" || s.hp <= 0) continue;
    s.life -= dt;
    if (dead || s.life <= 0) { s.hp = 0; spawnDust(s.x, s.y); continue; }
    s.spin = (s.spin || 0) + dt * Math.hypot(s.vx, s.vy) * 2;
    const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
    if (hitsWall(nx, s.y, s.r * 0.8)) s.vx = -s.vx; else s.x = nx;
    if (hitsWall(s.x, ny, s.r * 0.8)) s.vy = -s.vy; else s.y = ny;
    for (const p of allPlayers()) {
      if (!p || p.hp <= 0 || Math.hypot(p.x - s.x, p.y - s.y) > s.r + (p.r || 0.3)) continue;
      if ((p._w6nBall || 0) > game.time) continue;
      p._w6nBall = game.time + 1.0;
      if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 16); continue; }
      hurtPlayer(p, W6N.ballHurt, s);
      const dx = p.x - s.x, dy = p.y - s.y, l = Math.hypot(dx, dy) || 1; moveEntity(p, dx / l * 0.8, dy / l * 0.8);
    }
    if (b && s.kicked && !(b.invulnT > 0) && Math.hypot(b.x - s.x, b.y - s.y) < s.r + (b.r || 1)) { w6nStun(b, "데굴 쿵! 제 공에 맞았어요"); s.hp = 0; spawnDust(s.x, s.y); }
  }
  monsters = monsters.filter((o) => !(o.type === "w6_bball" && o.hp <= 0));
  // 바람
  if (b && b.w6n === "eagle" && (b.w6GustWarn > 0 || b.w6GustT > 0)) {
    if (b.w6GustWarn > 0) { b.w6GustWarn -= dt; if (b.w6GustWarn <= 0) { b.w6GustWarn = 0; b.w6GustT = W6N.gustBlow; if (typeof sfx !== "undefined" && sfx.zap) sfx.zap(); } }
    else {
      b.w6GustT = Math.max(0, b.w6GustT - dt);
      for (const p of allPlayers()) {
        if (!p || p.hp <= 0 || !w6nInLane(b, p.x, p.y) || w6nSheltered(b, p.x, p.y)) continue;
        moveEntity(p, b.w6GustX * W6N.gustSpeed * dt, b.w6GustY * W6N.gustSpeed * dt);
      }
      if (b.w6GustT <= 0) b.w6GustLane = 1 - (b.w6GustLane || 0);
    }
  }
  // 회오리
  for (const t of monsters) {
    if (t.type !== "w6_btornado" || t.hp <= 0) continue;
    t.life -= dt;
    if (dead || t.life <= 0) { t.hp = 0; continue; }
    const p = w6nNearestPlayer(t.x, t.y);
    if (p) { const dx = p.x - t.x, dy = p.y - t.y, l = Math.hypot(dx, dy) || 1; moveEntity(t, dx / l * W6N.tornadoSpeed * dt, dy / l * W6N.tornadoSpeed * dt);
      if (l < t.r + (p.r || 0.3) && !((p._w6nTor || 0) > game.time)) { p._w6nTor = game.time + 1.2; if (p.rollTimer > 0) addFloatText(p.x, p.y, "회피!", "#9be8ff", 16); else { hurtPlayer(p, 1.0, t); moveEntity(p, dx / l * 0.9, dy / l * 0.9); } } }
  }
  monsters = monsters.filter((o) => !(o.type === "w6_btornado" && o.hp <= 0));
}, 42);

// ===== 그림 =====
// 바닥: 넘어질 탑 길, 공 앞길, 줄무늬 바람
hookOn("drawMonsterUnder", (m) => {
  if (m.type === "w6_btower" && m.fallT > 0) w6nDrawLane(m.x, m.y, m.x + m.fdx * W6N.fallLen, m.y + m.fdy * W6N.fallLen, W6N.fallW, m.byPlayer ? "#7dffb0" : "#ff9a40", 0.35);
  if (m.type === "w6_bball" && m.hp > 0) {
    const sp = Math.hypot(m.vx || 0, m.vy || 0) || 1;
    w6nDrawLane(m.x, m.y, m.x + m.vx / sp * 3, m.y + m.vy / sp * 3, m.r * 2, m.kicked ? "#7dffb0" : "#ffb070", 0.22);
  }
  if (m.type === "w6_blamp" && m.lit > 0) {
    const c = toScreen(m.x, m.y, 0.01);
    ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, W6N.lampR * TILE_W / 2 * 1.41, W6N.lampR * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,220,120,0.14)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,230,140,0.8)"; ctx.setLineDash([7, 6]); ctx.stroke(); ctx.restore();
  }
  if (m.w6n === "eagle" && m.w6GustLanes && (m.w6GustWarn > 0 || m.w6GustT > 0)) {
    // 밀리는 줄 표시 (예고 중에도)
    const c = world.W / 2, L = world.W * 0.45;
    for (let k = -6; k <= 6; k++) {
      if ((((k % 2) + 2) % 2) !== m.w6GustLane) continue;
      const off = k * 3 + 1.5, px = -m.w6GustY * off, py = m.w6GustX * off;
      // 줄 가운데 자리를 원점 기준으로 맞춰요 (s = x*-gy + y*gx)
      // 아레나 가운데를 지나는 줄만 (가운데에서 바람 방향으로 앞뒤 L 칸)
      const t0 = c * m.w6GustX + c * m.w6GustY, ox = px + m.w6GustX * t0, oy = py + m.w6GustY * t0;
      w6nDrawLane(ox - m.w6GustX * L, oy - m.w6GustY * L, ox + m.w6GustX * L, oy + m.w6GustY * L, 3, "#e8f0ff", m.w6GustT > 0 ? 0.42 : 0.3);
    }
    void c;
  }
}, 50);
// 바람 화살표 (화면 위)
hookOn("hudDraw", () => {
  const b = w6nBoss("eagle"); if (!b || !(b.w6GustWarn > 0 || b.w6GustT > 0) || game.overlay) return;
  const a = toScreen(0, 0, 0), c = toScreen(b.w6GustX, b.w6GustY, 0), sx = c.x - a.x, sy = c.y - a.y, sl = Math.hypot(sx, sy) || 1, ux = sx / sl, uy = sy / sl;
  const W = view.w, H = view.h, warn = b.w6GustWarn > 0;
  ctx.save(); ctx.strokeStyle = warn ? "rgba(255,226,122,0.9)" : "rgba(235,245,255,0.75)"; ctx.lineWidth = warn ? 5 : 3;
  const n = warn ? 6 : 14, t = game.time;
  for (let i = 0; i < n; i++) {
    const k = warn ? 0 : ((t * 1.6 + i * 0.37) % 1) * 200;
    const x = (W * ((i * 0.618) % 1)) + ux * k, y = (H * ((i * 0.382 + 0.1) % 1)) + uy * k, len = warn ? 70 : 50;
    ctx.beginPath(); ctx.moveTo(x - ux * len, y - uy * len); ctx.lineTo(x, y); ctx.stroke();
    if (warn) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * 18 - uy * 12, y - uy * 18 + ux * 12); ctx.moveTo(x, y); ctx.lineTo(x - ux * 18 + uy * 12, y - uy * 18 - ux * 12); ctx.stroke(); }
  }
  ctx.restore();
  text(warn ? `화살표 쪽으로 바람이 불어요! 바위 뒤에 숨어요 ${Math.ceil(b.w6GustWarn)}` : (b.w6GustLanes ? "줄무늬 바람! 밝은 줄을 피해요" : "휘이잉! 바위 뒤에선 안 밀려요"), W / 2, H * 0.78, 20, warn ? "#ffe27a" : "#e8f0ff", "center"); // 위쪽 안내 말풍선과 안 겹치게 아래쪽에
}, 45);

// 소품 그림
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  w6_btower(m) {
    const tilt = m.fallT > 0 ? (1 - m.fallT / W6N.fallWarn) * 0.35 : 0, ox = m.fdx * tilt, oy = m.fdy * tilt;
    drawBox(m.x - 0.36, m.y - 0.36, 0, 0.72, 0.72, 0.5, "#d8b878");
    drawBox(m.x - 0.3 + ox * 0.5, m.y - 0.3 + oy * 0.5, 0.5, 0.6, 0.6, 0.45, "#e8c888");
    drawBox(m.x - 0.24 + ox, m.y - 0.24 + oy, 0.95, 0.48, 0.48, 0.4, "#f0d8a0");
    for (const [a, b2] of [[-0.24, -0.24], [0.12, -0.24], [-0.24, 0.12], [0.12, 0.12]]) drawBox(m.x + a + ox, m.y + b2 + oy, 1.35, 0.12, 0.12, 0.12, "#f0d8a0");
    drawBox(m.x - 0.02 + ox, m.y - 0.02 + oy, 1.35, 0.04, 0.04, 0.45, "#7a5a38"); drawBox(m.x + 0.02 + ox, m.y - 0.02 + oy, 1.62, 0.22, 0.03, 0.14, "#e04a4a"); // 깃발
  },
  w6_blamp(m) {
    const lit = m.lit > 0;
    drawBox(m.x - 0.2, m.y - 0.2, 0, 0.4, 0.4, 0.12, "#5a4a3a");
    drawBox(m.x - 0.05, m.y - 0.05, 0.12, 0.1, 0.1, 0.7, "#6a5a48");
    drawBox(m.x - 0.18, m.y - 0.18, 0.82, 0.36, 0.36, 0.34, lit ? "#ffe088" : "#6a6488");
    drawBox(m.x - 0.2, m.y - 0.2, 1.16, 0.4, 0.4, 0.06, "#4a3a2a");
    if (!lit && Math.sin(game.time * 4 + m.x) > 0.6) { const s = toScreen(m.x, m.y, 1.5); drawStar(s.x, s.y, 6 * ZOOM, "#ffe27a"); }
  },
  w6_bball(m) {
    const z = 0.0, r = m.r || 0.6, sp = m.spin || 0, cols = ["#c8a060", "#b89050", "#d8b070"];
    drawBox(m.x - r * 0.8, m.y - r * 0.8, z + r * 0.15, r * 1.6, r * 1.6, r * 1.5, cols[0]);
    drawBox(m.x - r * 0.95, m.y - r * 0.55, z + r * 0.45, r * 1.9, r * 1.1, r * 0.9, cols[1]);
    drawBox(m.x - r * 0.55, m.y - r * 0.95, z + r * 0.45, r * 1.1, r * 1.9, r * 0.9, cols[2]);
    const k = Math.floor(sp) % 4; drawBox(m.x - 0.08 + [0.3, 0, -0.3, 0][k] * r, m.y - 0.08 + [0, 0.3, 0, -0.3][k] * r, z + r * 1.55, 0.16, 0.16, 0.08, "#8a6a40"); // 굴러가는 무늬
  },
  w6_btornado(m) {
    const t = game.time * 6 + (m.seed || m.x);
    for (let i = 0; i < 5; i++) { const w = 0.25 + i * 0.13, a = t + i * 0.9; drawBox(m.x - w / 2 + Math.cos(a) * 0.08, m.y - w / 2 + Math.sin(a) * 0.08, i * 0.3, w, w, 0.26, i % 2 ? "#e0d4b8" : "#c8b898"); }
  },
});

// 보스 그림 (새 모습)
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  // 모래성 기사: 모래 갑옷 + 모래성 투구(뾰족 탑 셋) + 삽 창 + 조개 방패
  w6_bcastleKnight(m) {
    const P = b2Pose(m), sand = "#e8c888", dark = "#c8a468", red = "#e04a4a";
    b2DrawBody(m, [
      { f: 0.12, s: 0.2, z: 0, w: 0.28, d: 0.26, h: 0.5 + P.walk * 0.04, c: dark }, { f: -0.12, s: -0.2, z: 0, w: 0.28, d: 0.26, h: 0.5 - P.walk * 0.04, c: dark },
      { f: 0, s: 0, z: 0.5 + P.breath, w: 0.7, d: 0.8, h: 0.62, c: sand },
      { f: 0.36, s: 0, z: 0.6 + P.breath, w: 0.06, d: 0.5, h: 0.42, c: red }, // 가슴 띠
      { f: 0.05, s: 0, z: 1.12 + P.breath, w: 0.6, d: 0.6, h: 0.48, c: "#f4dcb0", face: true, eye: "#ffffff", pupil: "#3a2a1a" },
      { f: 0.05, s: 0, z: 1.6 + P.breath, w: 0.66, d: 0.66, h: 0.14, c: dark }, // 성벽 테두리
      { f: 0.05, s: 0.22, z: 1.74 + P.breath, w: 0.16, d: 0.16, h: 0.26, c: sand }, { f: 0.05, s: -0.22, z: 1.74 + P.breath, w: 0.16, d: 0.16, h: 0.26, c: sand },
      { f: 0.05, s: 0, z: 1.74 + P.breath, w: 0.2, d: 0.2, h: 0.42, c: sand }, { f: 0.05, s: 0.02, z: 2.16 + P.breath, w: 0.03, d: 0.18, h: 0.12, c: red }, // 가운데 탑 + 깃발
      { f: 0.25, s: -0.52, z: 0.55, w: 0.12, d: 0.12, h: 1.3 + P.cast * 0.3, c: "#8a6a40" }, { f: 0.25, s: -0.52, z: 1.85 + P.cast * 0.3, w: 0.26, d: 0.08, h: 0.3, c: "#c8ced6" }, // 삽 창
      { f: 0.3, s: 0.48, z: 0.6, w: 0.1, d: 0.5, h: 0.55, c: "#f0a0b0" }, // 조개 방패
    ], { top: 2.4 });
  },
  // 사막 올빼미: 동글 몸, 커다란 노란 눈, 별 무늬 날개, 귀깃
  w6_bnightOwl(m) {
    const P = b2Pose(m), flap = Math.sin(game.time * (m.state === "cast" ? 14 : 4)) * 0.18, body = "#7a6aa8", belly = "#c8bce8";
    b2DrawBody(m, [
      { f: 0.1, s: 0.16, z: 0, w: 0.16, d: 0.12, h: 0.18, c: "#e8b040" }, { f: 0.1, s: -0.16, z: 0, w: 0.16, d: 0.12, h: 0.18, c: "#e8b040" },
      { f: 0, s: 0, z: 0.18 + P.breath, w: 0.8, d: 0.85, h: 0.85, c: body },
      { f: 0.36, s: 0, z: 0.28 + P.breath, w: 0.1, d: 0.55, h: 0.55, c: belly },
      { f: 0.05, s: 0, z: 1.02 + P.breath, w: 0.72, d: 0.8, h: 0.55, c: body, face: true, eye: "#ffe060", pupil: "#1a1030" },
      { f: 0.42, s: 0, z: 1.12 + P.breath, w: 0.1, d: 0.12, h: 0.12, c: "#e8b040" }, // 부리
      { f: 0, s: 0.28, z: 1.56 + P.breath, w: 0.14, d: 0.12, h: 0.24, c: body }, { f: 0, s: -0.28, z: 1.56 + P.breath, w: 0.14, d: 0.12, h: 0.24, c: body }, // 귀깃
      { f: -0.05, s: 0.52, z: 0.4 + flap, w: 0.55, d: 0.12, h: 0.6, c: "#5a4a88" }, { f: -0.05, s: -0.52, z: 0.4 - flap, w: 0.55, d: 0.12, h: 0.6, c: "#5a4a88" }, // 날개
      { f: 0.0, s: 0.59, z: 0.65 + flap, w: 0.12, d: 0.02, h: 0.12, c: "#ffe27a" }, { f: 0.0, s: -0.59, z: 0.65 - flap, w: 0.12, d: 0.02, h: 0.12, c: "#ffe27a" }, // 별 무늬
    ], { top: 2.0 });
  },
  // 쇠똥구리 대장: 반짝 초록 등껍질, 뿔, 다리 여섯, (공 타기 중엔 아래에 모래 공)
  w6_bscarabChief(m) {
    const P = b2Pose(m), ride = w6nRideOn(m), lift = ride ? 1.0 : 0, shell = "#3aa070", shine = "#7ad0a0";
    if (ride) { const r = 0.9; drawBox(m.x - r, m.y - r, 0, r * 2, r * 2, r * 1.6, "#c8a060"); drawBox(m.x - r * 1.1, m.y - r * 0.6, r * 0.3, r * 2.2, r * 1.2, r, "#b89050"); }
    const L = [];
    for (const f of [0.3, 0, -0.3]) for (const sd of [1, -1]) L.push({ f, s: sd * 0.5, z: lift + 0.05 + (sd > 0 ? P.walk : -P.walk) * 0.04, w: 0.1, d: 0.3, h: 0.1, c: "#2a3a2a" });
    b2DrawBody(m, [
      ...L,
      { f: -0.05, s: 0, z: lift + 0.12 + P.breath, w: 1.0, d: 0.8, h: 0.45, c: shell },
      { f: -0.05, s: 0, z: lift + 0.57 + P.breath, w: 0.8, d: 0.62, h: 0.12, c: shine },
      { f: -0.05, s: 0, z: lift + 0.57 + P.breath, w: 0.9, d: 0.04, h: 0.14, c: "#1a5a3a" }, // 등 가운데 줄
      { f: 0.55, s: 0, z: lift + 0.15 + P.breath, w: 0.36, d: 0.5, h: 0.35, c: "#2a6a4a", face: true, eye: "#ffffff", pupil: "#102010" },
      { f: 0.78, s: 0, z: lift + 0.45 + P.breath, w: 0.14, d: 0.12, h: 0.32, c: "#e8c060" }, // 뿔
      { f: 0.4, s: 0, z: lift + 0.6 + P.breath, w: 0.12, d: 0.36, h: 0.1, c: "#e04a4a" }, // 대장 띠
    ], { top: lift + 1.2 });
  },
  // 회오리 독수리: 흰 머리, 갈색 몸, 넓은 날개(바람 줄무늬), 노란 부리
  w6_bwindEagle(m) {
    const P = b2Pose(m), flap = Math.sin(game.time * (m.w6GustT > 0 || m.state === "cast" ? 12 : 3)) * 0.25, body = "#8a5a38";
    b2DrawBody(m, [
      { f: 0.1, s: 0.18, z: 0, w: 0.14, d: 0.12, h: 0.3, c: "#e8b040" }, { f: 0.1, s: -0.18, z: 0, w: 0.14, d: 0.12, h: 0.3, c: "#e8b040" },
      { f: -0.05, s: 0, z: 0.3 + P.breath, w: 0.9, d: 0.7, h: 0.75, c: body },
      { f: -0.6, s: 0, z: 0.45, w: 0.4, d: 0.5, h: 0.12, c: "#f0ece4" }, // 꼬리
      { f: 0.25, s: 0, z: 1.02 + P.breath, w: 0.55, d: 0.55, h: 0.5, c: "#f4f0ea", face: true, eye: "#ffffff", pupil: "#3a2a0a" },
      { f: 0.58, s: 0, z: 1.05 + P.breath, w: 0.22, d: 0.16, h: 0.14, c: "#ffc040" }, // 부리
      { f: -0.05, s: 0.75, z: 0.75 + flap, w: 0.6, d: 0.7, h: 0.1, c: "#7a4a2a" }, { f: -0.05, s: -0.75, z: 0.75 - flap, w: 0.6, d: 0.7, h: 0.1, c: "#7a4a2a" }, // 날개
      { f: -0.05, s: 0.85, z: 0.86 + flap, w: 0.5, d: 0.08, h: 0.04, c: "#e8f0ff" }, { f: -0.05, s: -0.85, z: 0.86 - flap, w: 0.5, d: 0.08, h: 0.04, c: "#e8f0ff" }, // 바람 줄무늬
    ], { top: 1.8 });
  },
});
