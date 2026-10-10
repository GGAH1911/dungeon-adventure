// ===== 월드 7 "픽셀 사이버 세계" 몬스터 8종 + 가짜 젤리 (설계서 docs/design/world7-cyber.md 4장) =====
// 모두 새로 그린 사이버 몬스터 (블록, 큰 눈, 무섭지 않게). 월드 6 보다 단단하고 아파요 (기본값 약 1.3배).
//   w7_bitBug       비트 벌레     깜빡 순간이동(빨간 원 0.8초) -> 내려온 뒤 어질 0.6초 -> 근접
//   w7_popup        팝업 상자     근접 + 광고창 던지기(3발 부채꼴)
//   w7_cursor       커서 새       날아다녀요 + 딸깍!(빨간 원)
//   w7_cable        케이블 뱀     근접 + 찌릿 물기(줄, 맞으면 느려요)
//   w7_firebot      방화벽 로봇   무겁고 단단 + 불벽 장판
//   w7_glitchJelly  글리치 젤리   새 행동 w7_copier : 가끔 가짜 복사본을 만들어요(한 대에 펑, 안 아파요)
//   w7_drone        데이터 드론   새 행동 w7_orbiter: 4칸 거리에서 빙글 + 데이터 퐁퐁(6발)
//   w7_spam         스팸 편지     새 행동 w7_flutter: 팔랑팔랑 지그재그로 다가와요 (보스가 불러요)
// 같이 하기: 행동은 방장 기기에서, 모습 칸은 저절로 친구에게 가요.

Object.assign(ABILITIES, {
  w7_blink: { name: "깜빡 순간이동", desc: "비트 벌레가 깜빡이더니 주인공 자리로 순간이동해요. 내려올 자리가 빨갛게 보여요.", counter: "빨간 원 밖으로! 내려온 뒤 어질어질할 때 때려요",
    tags: ["area", "move"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 0.85 }, cooldown: 4, range: [2.2, 7], damageMul: 1.2, anim: "crouch", effect: { type: "teleport" } },
  w7_adThrow: { name: "광고창 던지기", desc: "팝업 상자가 광고창 세 장을 부채꼴로 던져요.", counter: "옆으로 돌아요",
    tags: ["projectile"], telegraph: { shape: "cone", length: 5, angle: 0.8, at: "self", time: 0.9 }, cooldown: 4.5, range: [1.5, 6], damageMul: 0.9, anim: "point", effect: { type: "volley", count: 3, spread: 0.7, speed: 6, color: "#ffd23f" } },
  w7_click: { name: "딸깍!", desc: "커서 새가 바닥을 딸깍 눌러요. 빨간 원이 차오르면 쾅.", counter: "빨간 원 밖으로",
    tags: ["area"], telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.0 }, cooldown: 4, range: [1, 6], damageMul: 1.3, anim: "raise", effect: { type: "damage" } },
  w7_zapBite: { name: "찌릿 물기", desc: "케이블 뱀이 앞으로 쭉 늘어나 찌릿 물어요. 맞으면 잠깐 느려요.", counter: "짧은 빨간 줄 옆으로",
    tags: ["line", "melee"], telegraph: { shape: "line", length: 3.2, width: 0.8, at: "self", time: 0.8 }, cooldown: 3, range: [0, 3], damageMul: 1.2, anim: "point", effect: { type: "slow", duration: 1.5 } },
  w7_fireFloor: { name: "불벽 장판", desc: "방화벽 로봇이 발밑에 불 장판을 깔아요. 안에 있으면 조금씩 아파요.", counter: "장판 밖에서 싸워요",
    tags: ["zone"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 1.0 }, cooldown: 7, range: [0, 5], damageMul: 0.4, anim: "slam", effect: { type: "zone", duration: 5, tick: 0.8, kind: "fire" } },
  w7_dataPop: { name: "데이터 퐁퐁", desc: "드론이 반짝 데이터 구슬 여섯 개를 사방으로 쏴요.", counter: "구슬 사이 빈틈으로",
    tags: ["projectile"], telegraph: { shape: "self", radius: 1.0, at: "self", time: 0.9 }, cooldown: 5, range: [0, 7], damageMul: 0.8, anim: "raise", effect: { type: "nova", count: 6, speed: 4.4, color: "#5ad8ff" } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w7_blink: { text: "빨간 원 밖으로" }, w7_adThrow: { text: "광고창! 옆으로" }, w7_click: { text: "딸깍! 원 밖으로" },
  w7_zapBite: { text: "줄 옆으로" }, w7_fireFloor: { text: "불 장판 밖으로" }, w7_dataPop: { text: "구슬 사이로" },
});
if (typeof BEHAVIOR_DOCS !== "undefined") Object.assign(BEHAVIOR_DOCS, {
  w7_copier: { name: "가짜 복사", desc: "가까이 와서 때리고, 가끔 똑같이 생긴 가짜를 만들어요. 가짜는 안 아프고 한 대에 펑.", counter: "가짜는 지지직 줄무늬가 있어요. 진짜부터 때려요" },
  w7_orbiter: { name: "빙글 드론", desc: "4칸 거리에서 주인공 둘레를 빙글빙글 돌며 데이터 구슬을 쏴요.", counter: "구슬 사이로 다가가서 때려요" },
  w7_flutter: { name: "팔랑팔랑", desc: "편지처럼 팔랑팔랑 지그재그로 다가와요.", counter: "다가오면 그 자리에서 때려요" },
  w7_decoy: { name: "가짜 복사본", desc: "진짜 흉내를 내며 따라와요. 아프게 하지 않아요.", counter: "한 대 치면 펑!" },
});

const W7_MON = (base, o) => {
  const d = { ...(MONSTERS[base] || MONSTERS.zombie || {}) };
  for (const k of ["abilities", "look", "weapon", "w3Placeholder", "w4Placeholder", "codexSkip", "world", "floaty", "heavy", "frontShield", "dizzyAfterCharge", "light", "size", "armsForward", "emeraldCount", "w3Shadow", "w4Dig", "w4Glow", "w5Shade"]) delete d[k];
  return { ...d, ...o, world: 7 };
};
Object.assign(MONSTERS, {
  w7_bitBug: W7_MON("zombie", { name: "비트 벌레", shape: "w7_bitBug", behavior: "melee", abilities: ["w7_blink"],
    hp: 4.0, speed: 1.9, damage: 1.3, xp: 9, emerald: 0.9, attackRange: 0.75, attackCooldown: 1.2, windup: 0.38, color: "#9aff4a", eyes: "#14300e" }),
  w7_popup: W7_MON("zombie", { name: "팝업 상자", shape: "w7_popup", behavior: "melee", abilities: ["w7_adThrow"],
    hp: 5.5, speed: 1.4, damage: 1.3, xp: 10, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.4, windup: 0.42, color: "#e8ecf8", eyes: "#1a2040" }),
  w7_cursor: W7_MON("bat", { name: "커서 새", shape: "w7_cursor", behavior: "melee", floaty: true, abilities: ["w7_click"],
    hp: 3.6, speed: 2.4, damage: 1.3, xp: 9, emerald: 0.8, attackRange: 0.7, attackCooldown: 1.4, windup: 0.4, color: "#ffffff", eyes: "#1a1020" }),
  w7_cable: W7_MON("zombie", { name: "케이블 뱀", shape: "w7_cable", behavior: "melee", abilities: ["w7_zapBite"],
    hp: 4.6, speed: 1.9, damage: 1.3, xp: 9, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.3, windup: 0.4, color: "#3a4878", eyes: "#ffd23f" }),
  w7_firebot: W7_MON("zombie", { name: "방화벽 로봇", shape: "w7_firebot", behavior: "melee", heavy: true, size: 1.25, abilities: ["w7_fireFloor"],
    hp: 10, speed: 1.0, damage: 1.8, xp: 14, emerald: 1.1, armor: 0.18, attackRange: 0.95, attackCooldown: 1.6, windup: 0.5, color: "#c8503a", eyes: "#ffe27a" }),
  w7_glitchJelly: W7_MON("zombie", { name: "글리치 젤리", shape: "w7_glitchJelly", behavior: "w7_copier",
    hp: 6.5, speed: 1.4, damage: 1.4, xp: 11, emerald: 1, attackRange: 0.8, attackCooldown: 1.4, windup: 0.42, color: "#c07aff", eyes: "#20103a" }),
  w7_jellyCopy: W7_MON("zombie", { name: "가짜 젤리", shape: "w7_glitchJelly", behavior: "w7_decoy", codexSkip: true,
    hp: 9999, speed: 1.5, damage: 0, xp: 0, emerald: 0, attackRange: 0.8, attackCooldown: 9, windup: 0.4, color: "#c07aff", eyes: "#20103a", w7Fake: true }),
  w7_drone: W7_MON("bat", { name: "데이터 드론", shape: "w7_drone", behavior: "w7_orbiter", floaty: true, abilities: ["w7_dataPop"],
    hp: 4.0, speed: 2.2, damage: 1.2, xp: 10, emerald: 0.9, attackRange: 0.7, attackCooldown: 1.5, windup: 0.4, color: "#5ad8ff", eyes: "#0a1830" }),
  w7_spam: W7_MON("zombie", { name: "스팸 편지", shape: "w7_spam", behavior: "w7_flutter",
    hp: 3.4, speed: 2.1, damage: 1.1, xp: 7, emerald: 0.7, attackRange: 0.7, attackCooldown: 1.3, windup: 0.36, color: "#fff4d8", eyes: "#3a1a10" }),
});
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w7_jellyCopy", "w7_spam");
if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add("w7_jellyCopy");

const W7M = { blinkDaze: 0.6, copyEvery: [7, 9], copyLife: 10, orbitR: 4.0 };
const w7mHost = () => !(typeof netGuest === "function" && netGuest());

Object.assign(EXTRA_BEHAVIORS, {
  // 글리치 젤리: 근접 + 가끔 가짜 복사본 하나 (살아 있는 가짜는 하나만)
  w7_copier(m, p, dist, dt) {
    m.cpT = (m.cpT === undefined ? W7M.copyEvery[0] * 0.5 : m.cpT) - dt;
    if (m.cpT <= 0 && dist < 7 && w7mHost()) {
      m.cpT = W7M.copyEvery[0] + Math.random() * (W7M.copyEvery[1] - W7M.copyEvery[0]);
      if (!monsters.some((o) => o.w7CopyOf === m && o.hp > 0)) {
        const a = Math.random() * 6.28, s = findFreeSpot(m.x + Math.cos(a) * 1.2, m.y + Math.sin(a) * 1.2, 0.3, 2) || { x: m.x, y: m.y };
        const k = createMonster("w7_jellyCopy", s.x, s.y, m.level || game.mapLevel || 1);
        k.aggro = true; k.appearTimer = 0.3; k.summoned = true; k.w7CopyOf = m; k.w7Life = W7M.copyLife;
        monsters.push(k); addFloatText(m.x, m.y, "지지직! 복사", "#d8a8ff", 15);
      }
    }
    updateMelee(m, p, dist, dt);
  },
  w7_decoy(m, p, dist, dt) {
    m.w7Life = (m.w7Life || W7M.copyLife) - dt;
    if (m.w7Life <= 0 && w7mHost()) { m.hp = 0; m.silent = true; return; }
    if (dist > 0.9) chaseMove(m, p, dist, dt); else { m.moving = false; faceToward(m, p); }
  },
  // 데이터 드론: 4칸 둘레를 빙글 (구슬은 기술)
  w7_orbiter(m, p, dist, dt) {
    if (dist > 9 || !lineOfSight(m.x, m.y, p.x, p.y)) { chaseMove(m, p, dist, dt); return; }
    if (m.oA === undefined) { m.oA = Math.atan2(m.y - p.y, m.x - p.x); m.oDir = Math.random() < 0.5 ? 1 : -1; }
    m.oA += dt * 0.7 * m.oDir;
    const tx = p.x + Math.cos(m.oA) * W7M.orbitR, ty = p.y + Math.sin(m.oA) * W7M.orbitR, dx = tx - m.x, dy = ty - m.y, l = Math.hypot(dx, dy);
    if (l > 0.15) { const x0 = m.x, y0 = m.y; moveWithSeparation(m, dx / l, dy / l, dt, m.speed); if (Math.hypot(m.x - x0, m.y - y0) < m.speed * dt * 0.2) m.oDir = -m.oDir; }
    else m.moving = false;
    faceToward(m, p);
  },
  // 스팸 편지: 팔랑팔랑 지그재그
  w7_flutter(m, p, dist, dt) {
    if (dist < m.def.attackRange * 1.4 || m.state === "windup") { updateMelee(m, p, dist, dt); return; }
    const d = dist || 1, ux = (p.x - m.x) / d, uy = (p.y - m.y) / d;
    m.flT = (m.flT || Math.random() * 10) + dt;
    const w = Math.sin(m.flT * 3.2) * 1.2;
    if (dist > 7 || !lineOfSight(m.x, m.y, p.x, p.y)) chaseMove(m, p, dist, dt);
    else moveWithSeparation(m, ux - uy * w, uy + ux * w, dt, m.speed);
    faceToward(m, p);
  },
});
// 가짜 젤리: 한 대 치면 펑 (안 다쳐요)
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m || !m.def || !m.def.w7Fake) return false;
  if (h.opts.dot) return true;
  m.hp = 0; spawnBurst(m.x, m.y, ["#c07aff", "#5ad8ff", "#ffffff"], 12);
  addFloatText(m.x, m.y, "펑! 가짜였어요", "#d8a8ff", 17);
  return true;
}, 5);
// 진짜 젤리가 쓰러지면 가짜도 사라져요
hookOn("monsterKilled", (m) => {
  if (!m || m.type !== "w7_glitchJelly") return;
  for (const o of monsters) if (o.w7CopyOf === m && o.hp > 0) { o.hp = 0; o.silent = true; spawnBurst(o.x, o.y, ["#c07aff", "#ffffff"], 8); }
}, 40);
// 비트 벌레가 순간이동으로 내려오면 어질어질
hookOn("castResolved", (c) => {
  if (!c || c.id !== "w7_blink" || !c.m || c.m.hp <= 0 || !w7mHost()) return;
  c.m.stunTimer = Math.max(c.m.stunTimer || 0, W7M.blinkDaze);
  addFloatText(c.m.x, c.m.y, "어질~", "#ffe27a", 14);
}, 50);
// 가짜 젤리는 살짝 비쳐요 (지지직 줄무늬는 모양에서)
hookOn("monsterAlpha", (a, m) => (m && m.def && m.def.w7Fake && m.hp > 0 ? Math.min(a, 0.8) : a), 50);

// ----- 모양 -----
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  // 비트 벌레: 초록 네모 몸 마디 셋 + 안테나 + 큰 눈. 깜빡 예고 때 몸이 깜빡깜빡
  w7_bitBug(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 14) * 0.03 : 0;
    const blink = m.state === "cast" && Math.floor(game.time * 12) % 2 ? "#ffffff" : c;
    for (const [f, s] of [[0.1, 0.16], [-0.06, 0.18], [-0.2, 0.16], [0.1, -0.16], [-0.06, -0.18], [-0.2, -0.16]]) add(f + (s > 0 ? w : -w), s, 0, 0.05, 0.06, 0.06, shade(c, 0.6));
    add(-0.2, 0, 0.06, 0.18, 0.24, 0.16, blink); add(0, 0, 0.06, 0.2, 0.28, 0.2, blink); add(0.2, 0, 0.08, 0.2, 0.24, 0.2, blink);
    add(0, 0, 0.26, 0.08, 0.08, 0.02, "#1a3a10"); add(-0.2, 0, 0.22, 0.06, 0.06, 0.02, "#1a3a10");
    for (const sd of [1, -1]) { add(0.26, sd * 0.06, 0.28, 0.03, 0.03, 0.14, "#1a3a10"); add(0.28, sd * 0.08, 0.42, 0.06, 0.06, 0.06, "#ff5ad8"); }
    eyes(0.3, 0.07, 0.16, 0.07, m.def.eyes);
    flush();
  },
  // 팝업 상자: 하얀 창(파란 제목줄, 빨간 X 단추) + 짧은 다리. 던질 때 창이 반짝
  w7_popup(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 10) * 0.04 : 0;
    add(0, 0.12, 0, 0.1, 0.08, 0.14 + w, "#3a4878"); add(0, -0.12, 0, 0.1, 0.08, 0.14 - w, "#3a4878");
    add(0, 0, 0.14, 0.24, 0.56, 0.48, c);
    add(0, 0, 0.62, 0.24, 0.56, 0.1, "#4a8aff");
    add(0.02, -0.22, 0.64, 0.2, 0.08, 0.06, "#ff5a5a");
    if (m.state === "cast") add(0.14, 0, 0.3, 0.02, 0.4, 0.24, "#ffd23f");
    eyes(0.13, 0.1, 0.36, 0.08, m.def.eyes);
    add(0.13, 0, 0.2, 0.02, 0.16, 0.03, "#1a2040");
    flush();
  },
  // 커서 새: 하얀 화살표 커서 모양 날개 + 작은 몸. 하늘을 떠다녀요
  w7_cursor(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color;
    const bob = 0.7 + Math.sin(game.time * 3 + m.x) * 0.06 - (m.state === "cast" ? 0.2 : 0), flap = Math.sin(game.time * 12 + m.x) * 0.1;
    add(0, 0, bob, 0.3, 0.22, 0.22, "#5ad8ff");
    for (const sd of [1, -1]) { add(-0.04, sd * 0.24, bob + 0.1 + flap * sd, 0.3, 0.14, 0.04, c); add(-0.12, sd * 0.36, bob + 0.1 + flap * sd * 1.6, 0.16, 0.1, 0.04, c); }
    add(0.24, 0, bob + 0.06, 0.18, 0.1, 0.06, c); add(0.36, 0, bob + 0.06, 0.08, 0.06, 0.06, "#1a1020"); // 화살표 끝 (부리)
    add(-0.22, 0, bob + 0.06, 0.12, 0.06, 0.18, c);
    eyes(0.12, 0.07, bob + 0.16, 0.06, m.def.eyes);
    const g = toScreen(m.x, m.y, 0); ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.ellipse(g.x, g.y, 7 * ZOOM, 3.5 * ZOOM, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    flush();
  },
  // 케이블 뱀: 남색 케이블 마디 + 머리는 노란 플러그(두 갈래 이빨)
  w7_cable(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, t = (m.walkTime || 0) * 8, poke = m.state === "cast" ? 0.18 : 0;
    for (let i = 0; i < 5; i++) add(-0.12 - i * 0.12 + poke * 0.3, Math.sin(t + i) * 0.08, 0.02, 0.14, 0.14, 0.12, i % 2 ? c : shade(c, 1.2));
    add(0.1 + poke, 0, 0.04, 0.24, 0.22, 0.2, "#ffd23f");
    for (const sd of [1, -1]) add(0.26 + poke, sd * 0.06, 0.08, 0.1, 0.03, 0.03, "#c8c8d8");
    eyes(0.16 + poke, 0.07, 0.16, 0.06, "#1a1020");
    flush();
  },
  // 방화벽 로봇: 벽돌 몸통(빨강·주황 줄) + 불꽃 머리 + 굵은 팔
  w7_firebot(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 7) * 0.03 : 0;
    add(0, 0.12, 0, 0.16, 0.14, 0.16, "#3a2a3a"); add(0, -0.12, 0, 0.16, 0.14, 0.16, "#3a2a3a");
    add(0, 0, 0.16, 0.38, 0.46, 0.4, c);
    for (const z of [0.26, 0.4]) add(0.0, 0, z, 0.39, 0.47, 0.025, "#ff9a5a");
    for (const sd of [1, -1]) add(0.04, sd * 0.3, m.state === "cast" ? 0.44 : 0.22 + w * sd, 0.14, 0.12, 0.2, shade(c, 0.85));
    const fl = Math.sin(game.time * 10 + m.x) * 0.04;
    add(0, 0, 0.56, 0.26, 0.3, 0.14 + fl, "#ff7a3a"); add(0, 0, 0.68 + fl, 0.14, 0.16, 0.12, "#ffd23f");
    eyes(0.2, 0.1, 0.4, 0.07, m.def.eyes);
    flush();
  },
  // 글리치 젤리: 보라 젤리 + 옆으로 어긋난 줄 (가짜는 지지직 줄무늬)
  w7_glitchJelly(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, sq = m.moving ? 1 + Math.sin(m.walkTime * 7) * 0.07 : 1;
    const jit = Math.floor(game.time * 8 + m.x) % 5 === 0 ? 0.05 : 0;
    add(0, 0, 0, 0.48, 0.48, 0.24 * sq, c); add(0, jit, 0.24 * sq, 0.48, 0.48, 0.2 * sq, shade(c, 1.1));
    if (m.def.w7Fake) for (const z of [0.08, 0.2, 0.32]) add(0.01, 0, z * sq, 0.5, 0.5, 0.025, "#5ad8ff");
    add(0, -jit, 0.44 * sq, 0.12, 0.12, 0.06, "#ff5ad8");
    eyes(0.24, 0.09, 0.24 * sq, 0.08, m.def.eyes);
    flush();
  },
  // 데이터 드론: 동그란 렌즈 몸 + 프로펠러 4개 + 파란 불빛
  w7_drone(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, bob = 0.75 + Math.sin(game.time * 3 + m.x) * 0.06, spin = game.time * 30;
    add(0, 0, bob, 0.3, 0.3, 0.16, "#2a3458"); add(0, 0, bob + 0.16, 0.2, 0.2, 0.06, c);
    for (const [f, s] of [[0.22, 0.22], [0.22, -0.22], [-0.22, 0.22], [-0.22, -0.22]]) { add(f * 0.7, s * 0.7, bob + 0.06, 0.16, 0.04, 0.03, "#8a94b8"); add(f, s, bob + 0.14, Math.abs(Math.cos(spin)) * 0.22 + 0.04, Math.abs(Math.sin(spin)) * 0.22 + 0.04, 0.02, "#c8d8ff"); }
    eyes(0.15, 0.06, bob + 0.04, 0.07, m.def.eyes);
    const g = toScreen(m.x, m.y, 0); ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.ellipse(g.x, g.y, 7 * ZOOM, 3.5 * ZOOM, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    flush();
  },
  // 스팸 편지: 팔랑이는 하얀 봉투 + 빨간 하트 도장
  w7_spam(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, flap = Math.sin(game.time * 8 + m.x) * 0.08, z = 0.25 + Math.abs(Math.sin(game.time * 4 + m.x)) * 0.12;
    add(0, 0, z, 0.08, 0.5, 0.34, c);
    add(0.02, 0, z + 0.2 + flap, 0.06, 0.48, 0.12, shade(c, 0.9));
    add(0.05, 0, z + 0.1, 0.02, 0.1, 0.1, "#ff5a7a");
    eyes(0.06, 0.13, z + 0.16, 0.06, m.def.eyes);
    flush();
  },
});
