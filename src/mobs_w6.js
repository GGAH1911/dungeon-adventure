// ===== 월드 6 "색모래 사막" 몬스터 8종 + 꼬마 선인장 젤리 (설계서 docs/design/world6-desert.md 4장) =====
// 모두 사막 몬스터로 새로 그렸어요 (블록, 큰 눈, 무섭지 않게). id 는 맵·탑·퀘스트가 부르는 이름이라 그대로 두고 모습·이름·행동을 바꿨어요.
//   w6_sunWisp     퐁당 도마뱀   새 행동 w6_diver   : 모래 속으로 퐁당 숨어(안 맞아요) 볼록한 모래 언덕으로 다가와 퐁! 튀어나와요. 튀어나온 뒤 어지러워요
//   w6_sandBunny   데굴 덤불     새 행동 w6_roller  : 바람 따라 옆으로 굴러다니다 빨간 줄을 따라 데굴데굴 굴러와요. 벽에 쿵 하면 멍
//   w6_sandBat     빙글 독수리   새 행동 w6_circler : 하늘을 빙글빙글 돌다가 바닥에 빨간 원을 그리고 슝 내려앉아요. 내려앉은 뒤 헥헥
//   w6_cactusJelly 선인장 젤리   새 행동 w6_splitter: 가시를 사방으로 쏘고, 쓰러지면 꼬마 선인장 젤리 둘로 나뉘어요
//   w6_mirageGhost 꼬리콕 전갈   꼬리를 들었다가 앞으로 콕! (짧은 빨간 줄)
//   w6_shellTurtle 모래성 골렘   머리 위로 모래 공을 들어 던져요 (빨간 원)
//   w6_sandMummy   붕대 고양이   붕대를 쭉 던져 감아요 (맞으면 잠깐 느려요)
//   w6_mirageKid   신기루 꼬마   새 행동 w6_skitter : 지그재그로 깡총깡총 다가오고 아른아른 비쳐 보여요 (보스가 불러요)
// 수치는 맵 레벨 1 기준 (좀비 = 체력 3, 속도 1.7, 공격 1). 같이 하기: 행동은 방장 기기에서, 모습에 쓰는 칸(w2Hidden·dvState 등)은 저절로 친구에게 가요.

Object.assign(ABILITIES, {
  w6_popUp: { name: "퐁! 튀어나오기", desc: "모래 속 도마뱀이 발밑에서 퐁 튀어나와요. 둘레가 빨갛게 차올라요.", counter: "볼록한 모래가 다가오면 비켜요. 튀어나온 뒤 어지러울 때 때려요",
    tags: ["melee", "area"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 0.85 }, cooldown: 2, range: [0, 1.6], damageMul: 1.2,
    anim: "crouch", effect: { type: "damage" } },
  w6_tumble: { name: "데굴데굴 굴러오기", desc: "덤불이 빨간 줄을 따라 데굴데굴 굴러와요. 벽에 부딪히면 멍해요.", counter: "빨간 줄 옆으로 비켜요. 벽에 쿵 하면 그때 때려요",
    tags: ["line", "move"], telegraph: { shape: "line", length: 6, width: 1.0, at: "self", time: 1.0 }, cooldown: 4.5, range: [1.5, 6], damageMul: 1.2,
    anim: "crouch", effect: { type: "charge", speed: 7, stunOnWall: 1.8 } },
  w6_dive: { name: "슝 내려앉기", desc: "하늘을 돌던 독수리가 바닥에 빨간 원을 그리고 슝 내려앉아요.", counter: "빨간 원 밖으로! 내려앉은 뒤 헥헥댈 때 때려요",
    tags: ["area", "move"], telegraph: { shape: "circle", radius: 1.2, at: "target", time: 1.1 }, cooldown: 5, range: [1.5, 6], damageMul: 1.3,
    anim: "raise", effect: { type: "damage" } },
  w6_needles: { name: "가시 퐁퐁", desc: "선인장 젤리가 부풀었다가 사방으로 초록 가시를 쏴요.", counter: "가시 사이 빈틈으로 빠지거나 구르기로 통과",
    tags: ["projectile"], telegraph: { shape: "self", radius: 1.3, at: "self", time: 0.9 }, cooldown: 6, range: [0, 5], damageMul: 0.7,
    anim: "raise", effect: { type: "nova", count: 8, speed: 4.5, color: "#7ad870" } },
  w6_tailPoke: { name: "꼬리 콕", desc: "전갈이 꼬리를 높이 들었다가 앞으로 콕 찔러요.", counter: "짧은 빨간 줄 옆으로 한 걸음!",
    tags: ["line", "melee"], telegraph: { shape: "line", length: 2.4, width: 0.8, at: "self", time: 0.75 }, cooldown: 2.2, range: [0, 2.2], damageMul: 1.3,
    anim: "point", effect: { type: "damage" } },
  w6_sandBall: { name: "모래 공 던지기", desc: "골렘이 머리 위로 모래 공을 들었다가 던져요. 떨어질 자리가 빨갛게 보여요.", counter: "빨간 원 밖으로 걸어가요",
    tags: ["area", "ranged"], telegraph: { shape: "circle", radius: 1.25, at: "target", time: 1.1 }, cooldown: 4, range: [2, 7], damageMul: 1.3,
    anim: "raise", effect: { type: "damage" } },
  w6_wrap: { name: "붕대 휘감기", desc: "붕대 고양이가 붕대를 쭉 던져요. 맞으면 잠깐 느려져요.", counter: "조준선이 멈추면 옆으로 비켜요",
    tags: ["line", "ranged"], telegraph: { shape: "line", length: 4.5, width: 0.8, at: "self", time: 1.0, follow: true }, cooldown: 5, range: [1.5, 4.5], damageMul: 0.8,
    anim: "point", effect: { type: "slow", duration: 2 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w6_popUp: { text: "볼록 모래를 피해요" }, w6_tumble: { text: "굴러와요! 줄 옆으로" }, w6_dive: { text: "빨간 원 밖으로" },
  w6_needles: { text: "가시 사이로 빠져요" }, w6_tailPoke: { text: "꼬리 콕! 옆으로" }, w6_sandBall: { text: "모래 공! 원 밖으로" }, w6_wrap: { text: "붕대! 옆으로 비켜요" },
});

if (typeof BEHAVIOR_DOCS !== "undefined") Object.assign(BEHAVIOR_DOCS, {
  w6_diver: { name: "모래 속 퐁당", desc: "모래 속으로 숨어(그동안 안 맞아요) 볼록한 모래 언덕으로 다가와 발밑에서 퐁 튀어나와요. 튀어나온 뒤 잠깐 어지러워요.", counter: "볼록 모래가 다가오면 비켜요. 어지러울 때 때려요" },
  w6_roller: { name: "데굴데굴", desc: "바람 따라 옆으로 굴러다니다가 빨간 줄을 따라 빠르게 굴러와요. 벽에 부딪히면 멍해요.", counter: "빨간 줄 옆으로 비키고 멍할 때 때려요" },
  w6_circler: { name: "빙글빙글 하늘", desc: "주인공 둘레 하늘을 빙글빙글 돌다가 빨간 원을 그리고 슝 내려앉아요. 내려앉으면 헥헥대요.", counter: "빨간 원 밖으로! 헥헥댈 때 때려요" },
  w6_splitter: { name: "둘로 나뉘기", desc: "가까이 와서 때리고, 가끔 사방으로 가시를 쏴요. 쓰러지면 꼬마 젤리 둘로 나뉘어요.", counter: "꼬마 젤리는 약해요. 한 번에 정리해요" },
  w6_skitter: { name: "지그재그 깡총", desc: "지그재그로 깡총깡총 다가와요. 아른아른 비쳐 보여요.", counter: "다가오면 그 자리에서 때려요" },
});

const W6_MON = (base, o) => {
  const d = { ...(MONSTERS[base] || MONSTERS.zombie || {}) };
  for (const k of ["abilities", "look", "weapon", "w3Placeholder", "w4Placeholder", "codexSkip", "world", "floaty", "heavy", "frontShield", "dizzyAfterCharge", "light", "size", "armsForward", "emeraldCount", "w3Shadow", "w4Dig", "w4Glow", "w5Shade"]) delete d[k];
  return { ...d, ...o, world: 6 };
};
Object.assign(MONSTERS, {
  w6_sunWisp: W6_MON("zombie", { name: "퐁당 도마뱀", shape: "w6_lizard", behavior: "w6_diver",
    hp: 3.0, speed: 1.7, damage: 1.0, xp: 7, emerald: 0.8, attackRange: 0.75, attackCooldown: 1.3, windup: 0.38, color: "#3ab8a0", eyes: "#14302a" }),
  w6_sandBunny: W6_MON("zombie", { name: "데굴 덤불", shape: "w6_tumble", behavior: "w6_roller", abilities: ["w6_tumble"],
    hp: 3.2, speed: 1.6, damage: 1.1, xp: 8, emerald: 0.8, attackRange: 0.75, attackCooldown: 1.4, windup: 0.4, color: "#b0844a", eyes: "#2a1608" }),
  w6_sandBat: W6_MON("bat", { name: "빙글 독수리", shape: "w6_vulture", behavior: "w6_circler", floaty: true, abilities: ["w6_dive"],
    hp: 2.6, speed: 2.4, damage: 1.0, xp: 7, emerald: 0.7, attackRange: 0.7, attackCooldown: 1.5, windup: 0.4, color: "#8a5a34", eyes: "#2a1608" }),
  w6_cactusJelly: W6_MON("zombie", { name: "선인장 젤리", shape: "w6_cactusJelly", behavior: "w6_splitter", abilities: ["w6_needles"],
    hp: 5.0, speed: 1.2, damage: 1.1, xp: 9, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.5, windup: 0.42, color: "#5ab45c", eyes: "#14300e" }),
  w6_cactusMini: W6_MON("zombie", { name: "꼬마 선인장 젤리", shape: "w6_cactusJelly", behavior: "melee", size: 0.6, mini: true,
    hp: 1.4, speed: 1.6, damage: 0.6, xp: 3, emerald: 0.3, attackRange: 0.6, attackCooldown: 1.3, windup: 0.36, color: "#7ad870", eyes: "#14300e" }),
  w6_mirageGhost: W6_MON("zombie", { name: "꼬리콕 전갈", shape: "w6_scorpion", behavior: "melee", abilities: ["w6_tailPoke"],
    hp: 3.4, speed: 1.8, damage: 1.0, xp: 8, emerald: 0.8, attackRange: 0.75, attackCooldown: 1.4, windup: 0.4, color: "#d87a3a", eyes: "#2a1608" }),
  w6_shellTurtle: W6_MON("zombie", { name: "모래성 골렘", shape: "w6_golem", behavior: "melee", heavy: true, size: 1.25, abilities: ["w6_sandBall"],
    hp: 7.5, speed: 1.0, damage: 1.4, xp: 11, emerald: 1, armor: 0.15, attackRange: 0.95, attackCooldown: 1.6, windup: 0.5, color: "#e0bc78", eyes: "#3a2410" }),
  w6_sandMummy: W6_MON("zombie", { name: "붕대 고양이", shape: "w6_mummyCat", behavior: "melee", size: 1.15, abilities: ["w6_wrap"],
    hp: 5.0, speed: 1.5, damage: 1.2, xp: 9, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.3, windup: 0.38, color: "#f6ead0", eyes: "#2ab080" }),
  w6_mirageKid: W6_MON("zombie", { name: "신기루 꼬마", shape: "w6_mirageKid", behavior: "w6_skitter",
    hp: 3.0, speed: 2.0, damage: 0.9, xp: 7, emerald: 0.8, attackRange: 0.7, attackCooldown: 1.3, windup: 0.38, color: "#f0cfa0", eyes: "#5a2a5a" }),
});
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w6_sunWisp", "w6_cactusMini"); // 숨는 도마뱀·꼬마 젤리에 정예는 헷갈려요

const W6M = { diveSpeed: 1.25, upTime: [3.2, 5.0], popDaze: 0.9, maxUnder: 7, circleR: 3.2, landRest: 1.2 };
const w6mHost = () => !(typeof netGuest === "function" && netGuest());

// ----- 행동 -----
Object.assign(EXTRA_BEHAVIORS, {
  // 퐁당 도마뱀: under(모래 속, 안 맞아요) -> pop(퐁! 예고) -> up(땅 위에서 싸우기) -> 다시 under
  w6_diver(m, p, dist, dt) {
    if (!m.dvState) { m.dvState = "up"; m.dvT = 1 + Math.random(); }
    if (m.dvState === "under") {
      m.w2Hidden = true;
      m.dvT -= dt;
      if (dist < 1.3 || m.dvT <= 0) {
        m.w2Hidden = false; m.dvState = "pop"; m.moving = false; faceToward(m, p);
        spawnDust(m.x, m.y); spawnDust(m.x, m.y);
        castAbility(m, "w6_popUp", p);
        return;
      }
      chaseMove(m, p, dist, dt, W6M.diveSpeed);
      m.dustT = (m.dustT || 0) - dt;
      if (m.moving && m.dustT <= 0) { m.dustT = 0.22; spawnDust(m.x, m.y); }
      return;
    }
    if (m.dvState === "pop") {
      if (m.state === "cast") { m.moving = false; return; }
      m.dvState = "up"; m.dvT = W6M.upTime[0] + Math.random() * (W6M.upTime[1] - W6M.upTime[0]);
      m.stunTimer = Math.max(m.stunTimer || 0, W6M.popDaze);
      addFloatText(m.x, m.y, "어질어질~", "#ffe27a", 16);
      return;
    }
    // up: 보통 근접 싸움, 시간이 지나고 조금 떨어지면 다시 퐁당
    m.w2Hidden = false;
    m.dvT -= dt;
    if (m.dvT <= 0 && dist > 2 && m.state !== "windup") {
      m.dvState = "under"; m.dvT = W6M.maxUnder; m.w2Hidden = true;
      spawnDust(m.x, m.y); addFloatText(m.x, m.y, "퐁당!", "#ffe0a0", 15);
      return;
    }
    updateMelee(m, p, dist, dt);
  },
  // 데굴 덤불: 굴러오기(기술 w6_tumble) 사이엔 바람 따라 옆으로 데굴데굴
  w6_roller(m, p, dist, dt) {
    const d = dist || 1;
    if (dist > 6.5 || !lineOfSight(m.x, m.y, p.x, p.y)) { chaseMove(m, p, dist, dt); return; }
    if (dist < 1.0) { updateMelee(m, p, dist, dt); return; }
    m.windT = (m.windT || Math.random() * 10) + dt;
    const side = Math.sin(m.windT * 0.8) >= 0 ? 1 : -1, ux = (p.x - m.x) / d, uy = (p.y - m.y) / d;
    const close = dist < 3 ? -0.4 : dist > 4.5 ? 0.4 : 0; // 3~4.5칸 거리 (굴러오기 좋은 거리)
    moveWithSeparation(m, -uy * side + ux * close, ux * side + uy * close, dt, m.speed * 0.7);
    faceToward(m, p);
  },
  // 빙글 독수리: 주인공 둘레를 빙글빙글 (내려앉기는 기술 w6_dive, 내려앉은 자리는 castResolved 에서)
  w6_circler(m, p, dist, dt) {
    if (dist > 8 || !lineOfSight(m.x, m.y, p.x, p.y)) { chaseMove(m, p, dist, dt); return; }
    if (m.cA === undefined) m.cA = Math.atan2(m.y - p.y, m.x - p.x);
    m.cA += dt * 0.9 * (m.cDir || (m.cDir = Math.random() < 0.5 ? 1 : -1));
    const tx = p.x + Math.cos(m.cA) * W6M.circleR, ty = p.y + Math.sin(m.cA) * W6M.circleR;
    const dx = tx - m.x, dy = ty - m.y, l = Math.hypot(dx, dy);
    if (l > 0.15) { const x0 = m.x, y0 = m.y; moveWithSeparation(m, dx / l, dy / l, dt, m.speed); if (Math.hypot(m.x - x0, m.y - y0) < m.speed * dt * 0.2) m.cDir = -m.cDir; } // 벽에 막히면 반대로 돌아요
    else m.moving = false;
    faceToward(m, p);
  },
  // 선인장 젤리: 근접 + 가시 퐁퐁(기술), 나뉘기는 monsterKilled 에서
  w6_splitter(m, p, dist, dt) { updateMelee(m, p, dist, dt); },
  // 신기루 꼬마: 지그재그로 다가가기
  w6_skitter(m, p, dist, dt) {
    if (dist < m.def.attackRange * 1.4 || m.state === "windup") { updateMelee(m, p, dist, dt); return; }
    const d = dist || 1, ux = (p.x - m.x) / d, uy = (p.y - m.y) / d;
    m.zigT = (m.zigT || Math.random() * 10) + dt;
    const w = Math.sin(m.zigT * 5) * 0.9;
    if (dist > 7 || !lineOfSight(m.x, m.y, p.x, p.y)) chaseMove(m, p, dist, dt);
    else moveWithSeparation(m, ux - uy * w, uy + ux * w, dt, m.speed);
    faceToward(m, p);
  },
});

// 독수리가 내려앉아요: 예고 원 자리로 슝 + 헥헥 (방장 기기. 친구는 자리를 받아요)
hookOn("castResolved", (c) => {
  if (!c || c.id !== "w6_dive" || !c.m || c.m.hp <= 0 || !w6mHost()) return;
  const m = c.m, x0 = m.x, y0 = m.y, s = findFreeSpot(c.x, c.y, m.r, 1.5);
  if (!s) return;
  for (let i = 1; i <= 6; i++) addSparkle(x0 + (s.x - x0) * i / 6, y0 + (s.y - y0) * i / 6, 0.5, { vz: 0.4, life: 0.5, size: 0.5, gold: true });
  m.x = s.x; m.y = s.y; m.landT = W6M.landRest;
  m.stunTimer = Math.max(m.stunTimer || 0, W6M.landRest); m.knockX = 0; m.knockY = 0;
  spawnDust(m.x, m.y); spawnDust(m.x, m.y);
  addFloatText(m.x, m.y, "헥헥", "#ffe0a0", 15);
}, 50);
// 골렘 모래 공이 떨어진 자리에 모래 펑
hookOn("castResolved", (c) => {
  if (!c || c.id !== "w6_sandBall") return;
  spawnBurst(c.x, c.y, ["#e0bc78", "#c8a060", "#fff0c8"], 14);
}, 50);
// 선인장 젤리가 쓰러지면 꼬마 젤리 둘 (방장 기기만: 친구는 몬스터 목록을 받아요)
hookOn("monsterKilled", (m) => {
  if (!m || m.type !== "w6_cactusJelly" || m.escaped || !w6mHost()) return;
  const lvl = m.level || game.mapLevel || 1;
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * Math.PI * 2 + i * Math.PI;
    const s = findFreeSpot(m.x + Math.cos(a) * 0.6, m.y + Math.sin(a) * 0.6, 0.25, 1.5) || { x: m.x, y: m.y };
    const k = createMonster("w6_cactusMini", s.x, s.y, lvl);
    k.aggro = true; k.appearTimer = 0.35; k.summoned = true;
    monsters.push(k);
  }
  addFloatText(m.x, m.y, "뿅뿅! 둘로 나뉘었어요", "#9fe890", 16);
}, 40);
// 신기루 꼬마: 아른아른 (공격 준비 때는 또렷하게)
hookOn("monsterAlpha", (a, m) => {
  if (!m.def || m.def.shape !== "w6_mirageKid" || m.hp <= 0 || m.state === "windup" || m.state === "cast" || m.hitT > 0) return a;
  return Math.min(a, 0.72 + 0.2 * Math.sin(game.time * 4 + m.x * 2)); // 0.52~0.92: 흐릿하지만 잘 보여요
}, 50);

// ----- 모양 -----
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  // 퐁당 도마뱀: 낮고 긴 주황 몸 + 등 볏 + 꼬리 + 큰 눈. 모래 속이면 볼록 모래 언덕 + 빼꼼 눈
  w6_lizard(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color;
    if (m.w2Hidden) {
      const bob = Math.abs(Math.sin(game.time * 6 + m.x)) * 0.03;
      add(0, 0, 0, 0.62, 0.5, 0.08 + bob, "#d8b878"); add(0.04, 0, 0.08 + bob, 0.36, 0.3, 0.06, "#e8cc90");
      add(0.12, 0.07, 0.12 + bob, 0.06, 0.06, 0.06, "#ffffff"); add(0.12, -0.07, 0.12 + bob, 0.06, 0.06, 0.06, "#ffffff");
      flush();
      return;
    }
    const w = m.moving ? Math.sin(m.walkTime * 12) * 0.05 : 0, crouch = m.state === "cast" ? -0.04 : 0;
    for (const [f, s, k] of [[0.16, 0.14, 1], [0.16, -0.14, -1], [-0.12, 0.14, -1], [-0.12, -0.14, 1]]) add(f + w * k, s * 1.05, 0, 0.08, 0.08, 0.08, shade(c, 0.8));
    add(0, 0, 0.06 + crouch, 0.46, 0.26, 0.14, c);                       // 몸
    add(0.3, 0, 0.08 + crouch, 0.2, 0.22, 0.16, c);                      // 머리
    add(-0.32, 0, 0.08, 0.2, 0.1, 0.07, c); add(-0.48, 0.02 + w, 0.08, 0.14, 0.07, 0.05, shade(c, 0.9)); // 꼬리
    for (const f of [-0.12, 0.02, 0.16]) add(f, 0, 0.2 + crouch, 0.07, 0.04, 0.09, "#ff8a3a"); // 등 볏 (주황)
    add(0.12, 0, 0.2 + crouch, 0.18, 0.18, 0.02, "#bff0d8");             // 등 무늬
    eyes(0.38, 0.07, 0.16 + crouch, 0.06, m.def.eyes);
    flush();
  },
  // 데굴 덤불: 갈색 잔가지 뭉치 공 (굴러가면 가지가 빙글빙글 돌아요) + 큰 눈
  w6_tumble(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, sq = m.state === "cast" ? 0.86 : 1;
    const rot = (m.walkTime || 0) * 3, z0 = 0.28 * sq;
    add(0, 0, 0.04, 0.44, 0.44, 0.44 * sq, shade(c, 0.85));
    for (let i = 0; i < 8; i++) {
      const a = rot + i * Math.PI / 4, f = Math.cos(a) * 0.24, z = z0 + Math.sin(a) * 0.24;
      add(f, (i % 2 ? 0.16 : -0.16), Math.max(0, z), 0.09, 0.09, 0.09, i % 3 ? c : "#d8b070");
    }
    add(0, 0, 0.48 * sq, 0.12, 0.12, 0.06, "#8a6234");
    eyes(0.24, 0.07, 0.22 * sq, 0.07, m.def.eyes);
    flush();
  },
  // 빙글 독수리: 갈색 몸 + 하얀 깃 목도리 + 분홍 머리 + 노란 부리, 날개 퍼덕. 하늘에선 높이, 내려앉으면 낮게
  w6_vulture(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color;
    const low = (m.stunTimer || 0) > 0 || m.state === "cast" ? 0.15 : 0;
    const bob = 0.75 - low * 3 + Math.sin(game.time * 3 + m.x) * 0.06, flap = Math.sin(game.time * (m.moving ? 14 : 6) + m.x) * 0.12;
    add(0, 0, bob, 0.34, 0.26, 0.24, c);                                   // 몸
    add(0.12, 0, bob + 0.2, 0.18, 0.24, 0.07, "#f4ecdc");                  // 깃 목도리
    add(0.22, 0, bob + 0.24, 0.18, 0.16, 0.16, "#f0a8a0");                 // 머리
    add(0.34, 0, bob + 0.27, 0.1, 0.06, 0.06, "#ffc840");                  // 부리
    for (const sd of [1, -1]) { add(-0.02, sd * 0.28, bob + 0.12 + flap * sd, 0.24, 0.24, 0.05, shade(c, 0.9)); add(-0.06, sd * 0.46, bob + 0.12 + flap * sd * 2, 0.18, 0.14, 0.04, shade(c, 0.75)); }
    add(-0.24, 0, bob + 0.06, 0.12, 0.16, 0.05, shade(c, 0.8));            // 꼬리
    eyes(0.3, 0.06, bob + 0.3, 0.05, m.def.eyes);
    if (bob > 0.4) { const g = toScreen(m.x, m.y, 0); ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.ellipse(g.x, g.y, 12 * ZOOM * 0.6, 6 * ZOOM * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } // 땅 그림자 (동그랗게)
    flush();
  },
  // 선인장 젤리: 초록 젤리 + 가시 점 + 머리에 분홍 꽃 (꼬마는 작게). 가시 퐁퐁 예고 때 부풀어요
  w6_cactusJelly(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, puff = m.state === "cast" ? 1.15 : 1;
    const sq = (m.moving ? 1 + Math.sin(m.walkTime * 7) * 0.07 : 1) * puff;
    add(0, 0, 0, 0.5 * puff / sq * puff, 0.48 * puff, 0.44 * sq, c);
    for (const [f, s, z] of [[0.26, 0.18, 0.12], [0.26, -0.18, 0.3], [0, 0.26, 0.22], [0, -0.26, 0.1], [-0.26, 0.12, 0.28], [-0.26, -0.14, 0.14]]) add(f * puff, s * puff, z * sq, 0.04, 0.04, 0.05, "#fff6c8");
    add(0, 0, 0.44 * sq, 0.12, 0.12, 0.06, "#ff8ab8"); add(0, 0, 0.5 * sq, 0.06, 0.06, 0.04, "#ffe27a"); // 꽃
    eyes(0.26 * puff, 0.09, 0.22 * sq, 0.08, m.def.eyes);
    flush();
  },
  // 꼬리콕 전갈: 납작한 주황 몸 + 집게 둘 + 위로 말린 마디 꼬리(콕 할 때는 앞으로 쭉)
  w6_scorpion(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color;
    const poke = m.state === "cast", w = m.moving ? Math.sin(m.walkTime * 14) * 0.03 : 0;
    for (const [f, s] of [[0.12, 0.2], [-0.02, 0.22], [-0.16, 0.2], [0.12, -0.2], [-0.02, -0.22], [-0.16, -0.2]]) add(f + (s > 0 ? w : -w), s, 0, 0.05, 0.08, 0.06, shade(c, 0.7));
    add(0, 0, 0.05, 0.4, 0.3, 0.12, c);
    add(0.24, 0, 0.06, 0.14, 0.22, 0.12, c);
    for (const sd of [1, -1]) { add(0.34, sd * 0.2, 0.06, 0.16, 0.08, 0.08, c); add(0.46, sd * 0.22, 0.06, 0.1, 0.12, 0.1, shade(c, 1.1)); } // 집게
    const seg = poke ? [[-0.2, 0.18], [-0.08, 0.32], [0.1, 0.4], [0.3, 0.4], [0.46, 0.34]] : [[-0.24, 0.16], [-0.32, 0.3], [-0.28, 0.46], [-0.16, 0.56], [-0.02, 0.56]];
    seg.forEach(([f, z], i) => add(f, 0, z, 0.1, 0.1, 0.1, i === seg.length - 1 ? "#ffd27a" : c));
    eyes(0.3, 0.06, 0.16, 0.05, m.def.eyes);
    flush();
  },
  // 모래성 골렘: 모래성 몸(꼭대기 톱니 담) + 문 모양 입 + 짧은 팔. 모래 공을 던질 땐 머리 위에 공
  w6_golem(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 7) * 0.03 : 0;
    add(0.02, 0.1, 0, 0.14, 0.14, 0.14, shade(c, 0.8)); add(0.02, -0.1, 0, 0.14, 0.14, 0.14, shade(c, 0.8));
    add(0, 0, 0.14, 0.42, 0.42, 0.42, c);
    for (const [f, s] of [[0.15, 0.15], [0.15, -0.15], [-0.15, 0.15], [-0.15, -0.15]]) add(f, s, 0.56, 0.11, 0.11, 0.1, shade(c, 1.08)); // 톱니 담
    add(0.21, 0, 0.18, 0.02, 0.12, 0.14, "#7a5430");                      // 문 입
    add(0.21, 0, 0.32, 0.02, 0.06, 0.02, "#7a5430");
    const up = m.state === "cast";
    for (const sd of [1, -1]) add(0.04, sd * 0.27, up ? 0.5 : 0.24 + w * sd, 0.1, 0.1, up ? 0.22 : 0.16, shade(c, 0.9));
    if (up) add(0.04, 0, 0.78, 0.22, 0.22, 0.2, "#c8a060");                // 모래 공
    add(0.1, 0.12, 0.62, 0.03, 0.03, 0.14, "#8a6234"); add(0.12, 0.12, 0.72, 0.08, 0.02, 0.06, "#ff8a8a"); // 작은 깃발
    eyes(0.22, 0.09, 0.4, 0.07, m.def.eyes);
    flush();
  },
  // 붕대 고양이: 크림색 붕대 줄무늬 고양이 + 세모 귀 + 꼬리 + 초록 눈. 붕대 끝 하나가 팔랑
  w6_mummyCat(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.sin(m.walkTime * 11) * 0.04 : 0;
    for (const [f, s, k] of [[0.1, 0.1, 1], [0.1, -0.1, -1], [-0.1, 0.1, -1], [-0.1, -0.1, 1]]) add(f + w * k, s, 0, 0.08, 0.08, 0.12, c);
    add(0, 0, 0.12, 0.34, 0.24, 0.2, c);
    for (const z of [0.15, 0.23]) add(0, 0, z, 0.35, 0.25, 0.025, "#b8966a");   // 붕대 줄
    add(0.18, 0, 0.26, 0.24, 0.24, 0.22, c);                                 // 머리
    add(0.18, 0, 0.36, 0.25, 0.25, 0.025, "#b8966a"); add(0.31, 0.1, 0.4, 0.03, 0.05, 0.05, "#ff9ab8"); add(0.31, -0.1, 0.4, 0.03, 0.05, 0.05, "#ff9ab8"); // 분홍 볼
    for (const sd of [1, -1]) add(0.16, sd * 0.08, 0.48, 0.06, 0.06, 0.08, c); // 귀
    const tail = Math.sin(game.time * 3 + m.x) * 0.06;
    add(-0.22, 0, 0.22, 0.08, 0.06, 0.06, c); add(-0.3, tail, 0.3, 0.06, 0.06, 0.14, c);
    add(-0.06, 0.14, 0.2 + Math.sin(game.time * 5) * 0.03, 0.12, 0.03, 0.04, "#efe0bc"); // 팔랑 붕대
    if (m.state === "cast") add(0.42, 0, 0.24, 0.24, 0.05, 0.04, "#efe0bc"); // 붕대를 던지려고 쭉
    eyes(0.31, 0.06, 0.3, 0.06, m.def.eyes);
    flush();
  },
  // 신기루 꼬마: 모래 솜뭉치 + 머리에 무지개 깃털 + 작은 발 (아른아른 비쳐요)
  w6_mirageKid(m) {
    const { add, eyes, flush } = w3Parts(m), c = m.def.color, w = m.moving ? Math.abs(Math.sin(m.walkTime * 12)) * 0.06 : 0;
    add(0.02, 0.07, 0, 0.07, 0.07, 0.08, shade(c, 0.8)); add(0.02, -0.07, 0, 0.07, 0.07, 0.08, shade(c, 0.8));
    add(0, 0, 0.08 + w, 0.3, 0.3, 0.28, c);
    add(0, 0, 0.36 + w, 0.22, 0.22, 0.06, shade(c, 1.08));
    ["#ff7a7a", "#ffd23f", "#7ad870", "#7ab8ff"].forEach((col, i) => add(-0.02, (i - 1.5) * 0.05, 0.42 + w + i % 2 * 0.03, 0.05, 0.04, 0.12, col));
    eyes(0.16, 0.07, 0.24 + w, 0.07, m.def.eyes);
    flush();
  },
});
