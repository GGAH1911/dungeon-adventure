// ===== 일반 몹 확장 + 정예 속성 =====
// 참고: docs/research/mechanics.md 2절(역할형 몹, 정예 속성). 이름·외형은 이 게임 오리지널이에요.
// 문법은 스킬(.agents/skills/dungeon-creature)과 같아요:
//   몬스터 정의 -> MONSTERS (아래 Object.assign)
//   새 행동     -> EXTRA_BEHAVIORS + BEHAVIOR_DOCS (설명·대처법 필수)
//   새 모양     -> EXTRA_SHAPES
//   새 기술     -> ABILITIES (name/desc/counter/telegraph/effect, 아픈 기술 예고 ≥ 0.45초)
//   정예 속성   -> ELITE_AFFIXES (문서: docs/elites.md 자동 생성)

// ===================== 1) 새 기술 =====================
Object.assign(ABILITIES, {
  snipe: {
    name: "저격", desc: "길고 가는 빨간 조준선을 오래 겨눈 뒤 아주 센 한 발을 쏴요. 조준선은 따라오다가 마지막에 멈춰요.",
    counter: "조준선이 멈추면 옆으로 한 걸음! 가까이 가면 저격을 못 해요", tags: ["line", "ranged"],
    telegraph: { shape: "line", length: 11, width: 0.45, at: "self", time: 1.4, follow: true },
    cooldown: 6, range: [3.5, 11], damageMul: 2.2, anim: "point",
    effect: { type: "damage" },
  },
  summonBones: {
    name: "뼈 피리", desc: "피리를 불어 꼬마 해골 2마리를 불러내요. 한 번에 4마리까지만.",
    counter: "피리 부는 동안 때리면 끊겨요. 소환사를 먼저 잡으면 더 안 나와요", tags: ["summon"],
    telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.3 },
    cooldown: 11, range: [0, 12], anim: "raise", interruptible: true, interruptAt: 0.12,
    effect: { type: "summon", monster: "boneling", count: 2 }, when: { maxSummons: 4 },
  },
  spinAttack: {
    name: "회오리 베기", desc: "웅크렸다가 제자리에서 빙글 돌며 주변을 모두 베어요.",
    counter: "웅크리면 한 걸음 물러나기. 돌고 난 뒤가 반격 기회", tags: ["melee", "area"],
    telegraph: { shape: "circle", radius: 1.7, at: "self", time: 0.6 },
    cooldown: 4.5, range: [0, 1.7], damageMul: 1.2, anim: "crouch",
    effect: { type: "knockback", force: 1.0 },
  },
  frostOrb: {
    name: "빙결 수정", desc: "주인공 발밑에 얼음 수정이 생겨 잠시 뒤 터져요. 맞으면 느려져요.",
    counter: "하늘색 원이 생기면 바로 밖으로 나가기", tags: ["ice", "elite"],
    telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.2 },
    cooldown: 8, range: [0, 8], damageMul: 0.8, anim: "point",
    effect: { type: "slow", duration: 2.2 },
  },
  jail: {
    name: "감옥", desc: "보라색 원이 차오른 뒤 안에 있으면 발이 묶여요(아주 느려져요).",
    counter: "보라 원이 다 차기 전에 원 밖으로", tags: ["control", "elite"],
    telegraph: { shape: "circle", radius: 1.25, at: "target", time: 1.0 },
    cooldown: 11, range: [0, 7], damageMul: 0.3, anim: "point",
    effect: { type: "slow", duration: 2.0 },
  },
  stickyGoo: {
    name: "끈적이 뿌리기", desc: "끈적한 젤리를 뿌려 밟으면 느려지는 웅덩이를 만들어요.",
    counter: "젤리 웅덩이를 돌아가기", tags: ["zone", "control"],
    telegraph: { shape: "circle", radius: 1.5, at: "target", time: 0.7 },
    cooldown: 11, range: [0, 6], anim: "crouch",
    effect: { type: "zone", duration: 6, tick: 0.3, kind: "web" },
  },
});

// ===================== 2) 새 행동 =====================
Object.assign(BEHAVIOR_DOCS, {
  support: { name: "뒤에서 돕기", desc: "앞에 나서지 않고 동료 뒤에서 거리를 두며 기술(치유·함성·소환·덫)을 써요.", counter: "앞의 몹을 지나쳐 뒤의 돕는 몹부터 화살로 잡기" },
  kite: { name: "거리 두고 저격", desc: "멀찍이 떨어져서 조준해요. 가까이 오면 뒷걸음질쳐요.", counter: "구르기로 파고들어 가까이에서 공격" },
  thief: { name: "보물 들고 도망", desc: "공격하지 않고 도망다녀요. 시간이 지나면 연기와 함께 사라져요. 잡으면 보물을 떨어뜨려요.", counter: "얼음 화살로 느리게 한 뒤 쫓아가기" },
  lurker: { name: "숨어 다가오기", desc: "거의 투명하게 숨어서 다가와요. 발밑 먼지가 단서예요. 가까이 오거나 맞으면 모습을 드러내요.", counter: "먼지가 피어오르는 곳에 화살 쏘기" },
  charger: { name: "물러섰다 돌진", desc: "돌진할 준비가 되면 뒤로 물러서 거리를 벌린 뒤 빨간 길을 그리고 달려와요. 돌진 사이에는 칼로 싸워요.", counter: "뒤로 물러서면 곧 돌진! 빨간 길 옆으로 비켜서기" },
  shieldbearer: { name: "방패 막기", desc: "앞에서 오는 공격을 방패로 막아요. 몸을 천천히 돌려요.", counter: "구르기로 등 뒤로 돌아가거나 불·폭탄 화살 쓰기" },
});

Object.assign(EXTRA_BEHAVIORS, {
  // 뒤에서 돕기: 주인공과 4~6칸 거리 유지, 기술은 abilities 훅이 써요
  support(m, p, dist, dt) {
    const want = 5;
    const d = dist || 1;
    const ux = (p.x - m.x) / d, uy = (p.y - m.y) / d;
    m.supT = (m.supT || Math.random() * 10) + dt;
    const side = Math.sin(m.supT * 0.9) * 0.6;
    if (dist > want + 2.5 || !lineOfSight(m.x, m.y, p.x, p.y)) chaseMove(m, p, dist, dt, 0.8);
    else if (dist < want - 1) moveWithSeparation(m, -ux - uy * side, -uy + ux * side, dt, m.speed);
    else moveWithSeparation(m, -uy * side, ux * side, dt, m.speed * 0.4);
    faceToward(m, p);
  },
  // 거리 두고 저격
  kite(m, p, dist, dt) {
    const d = dist || 1;
    if (dist > 9 || !lineOfSight(m.x, m.y, p.x, p.y)) chaseMove(m, p, dist, dt);
    else if (dist < 3.5) moveWithSeparation(m, -(p.x - m.x) / d, -(p.y - m.y) / d, dt, m.speed);
    else m.moving = false;
    faceToward(m, p);
  },
  // 보물 고블린
  thief(m, p, dist, dt) {
    const d = dist || 1;
    if (!m.fleeing && dist < 7) { m.fleeing = true; m.fleeLeft = THIEF_TIME[(game.profile && game.profile.difficulty) || "normal"] || 14; addFloatText(m.x, m.y, "히익!", "#ffe27a", 20); }
    if (!m.fleeing) { m.moving = false; return; }
    m.fleeLeft -= dt;
    if (Math.random() < dt * 6) addSparkle(m.x, m.y, 0.9, { vz: 0.8, life: 0.5, size: 0.6, gold: true });
    if (m.fleeLeft <= 0) {
      spawnBurst(m.x, m.y, ["#7a3fd0", "#ffd84a", "#2a1838"], 20);
      addRing(m.x, m.y, { speed: 4, life: 0.4, hue: 280 });
      showMessage("보물 고블린이 도망쳤어요!", 2, false, "#ffb070");
      m.escaped = true; m.hp = 0;
      return;
    }
    // 반대로 뛰되 막히면 옆으로
    m.zig = (m.zig || Math.random() * 10) + dt;
    const sx = -(p.x - m.x) / d, sy = -(p.y - m.y) / d, w = Math.sin(m.zig * 2.5) * 0.7;
    moveWithSeparation(m, sx - sy * w, sy + sx * w, dt, m.speed);
  },
  // 숨어 다가오기
  lurker(m, p, dist, dt) {
    if (m.hidden === undefined) m.hidden = true;
    if (m.hidden && (dist < 1.6 || m.hp < m.maxHp)) { m.hidden = false; m.revealT = 0; addFloatText(m.x, m.y, "!", "#ff8080", 24); }
    if (!m.hidden) {
      m.revealT = (m.revealT || 0) + dt;
      if (dist > 7 && m.revealT > 4 && m.hp >= m.maxHp) m.hidden = true;
      updateMelee(m, p, dist, dt);
      return;
    }
    chaseMove(m, p, dist, dt, 1.15);
    m.dustT = (m.dustT || 0) - dt;
    if (m.moving && m.dustT <= 0) { m.dustT = 0.25; spawnDust(m.x, m.y); }
  },
  // 돌진 기사: 돌진이 준비되면 4~5칸 물러섰다가 돌진 (돌진은 abilities 훅이 써요)
  charger(m, p, dist, dt) {
    const ready = !m.abCd || !(m.abCd.charge > 0);
    if (ready && dist < 3.2 && m.state !== "windup") {
      const d = dist || 1;
      moveWithSeparation(m, -(p.x - m.x) / d, -(p.y - m.y) / d, dt, m.speed * 0.9);
      faceToward(m, p);
      return;
    }
    updateMelee(m, p, dist, dt);
  },
  // 방패병: 몸을 천천히 돌려요 (돌아서는 동안 등이 빈틈)
  shieldbearer(m, p, dist, dt) {
    const fx = m.faceX, fy = m.faceY;
    updateMelee(m, p, dist, dt);
    const want = Math.atan2(m.faceY, m.faceX), cur = Math.atan2(fy, fx);
    let diff = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const maxTurn = (SHIELD_TURN[(game.profile && game.profile.difficulty) || "normal"] || 2) * dt;
    diff = Math.max(-maxTurn, Math.min(maxTurn, diff));
    m.faceX = Math.cos(cur + diff); m.faceY = Math.sin(cur + diff);
  },
});

const THIEF_TIME = { easy: 18, normal: 14, hard: 11, nightmare: 9 };
const SHIELD_TURN = { easy: 1.4, normal: 2.0, hard: 2.6, nightmare: 3.2 }; // 초당 도는 각도(라디안)

// ===================== 3) 새 모양 =====================
Object.assign(EXTRA_SHAPES, {
  // 독버섯 꼬마: 짧은 기둥 + 큰 버섯 갓 + 큰 눈
  shroom(m) {
    const def = m.def;
    const S = (def.size || 1) * (m.scaleMul || 1);
    const white = m.flash > 0;
    const hop = m.moving ? Math.abs(Math.sin(m.walkTime * 9)) * 0.08 : 0;
    const squash = m.state === "windup" || m.state === "cast" ? 0.78 : m.hitT > 0 ? 0.88 : 1;
    const stemH = 0.26 * S * squash;
    drawBox(m.x - 0.12 * S, m.y - 0.12 * S, hop, 0.24 * S, 0.24 * S, stemH, white ? "#ffffff" : "#f2e6c8");
    // 큰 버섯 갓 (앞면에 큰 눈)
    const capW = 0.56 * S, capH = 0.34 * S * squash, cz = hop + stemH, cx = m.x - capW / 2, cy = m.y - capW / 2;
    drawBox(cx, cy, cz, capW, capW, capH, white ? "#ffffff" : def.color);
    if (!white) {
      const side = faceSide(m.faceX, m.faceY);
      if (side) {
        drawOnFace(side, cx, cy, cz, capW, capW, 0.14, 0.42, capH * 0.25, capH * 0.75, "#ffffff");
        drawOnFace(side, cx, cy, cz, capW, capW, 0.58, 0.86, capH * 0.25, capH * 0.75, "#ffffff");
        drawOnFace(side, cx, cy, cz, capW, capW, 0.26, 0.4, capH * 0.3, capH * 0.6, "#222222");
        drawOnFace(side, cx, cy, cz, capW, capW, 0.7, 0.84, capH * 0.3, capH * 0.6, "#222222");
      }
      drawBox(m.x - capW * 0.3, m.y - capW * 0.3, cz + capH, capW * 0.6, capW * 0.6, 0.08 * S, shade(def.color, 1.12));
      for (const [ox, oy] of [[-0.14, -0.04], [0.1, 0.12], [0.04, -0.16]]) drawBox(m.x + ox * S - 0.045 * S, m.y + oy * S - 0.045 * S, cz + capH + 0.08 * S, 0.09 * S, 0.09 * S, 0.03 * S, def.spots || "#ffffff");
    }
  },
});

// ===================== 4) 새 몬스터 =====================
Object.assign(MONSTERS, {
  drummer: {
    name: "북치기 고블린", shape: "human", behavior: "support",
    hp: 3, speed: 1.6, damage: 0.5, xp: 5, emerald: 0.8,
    attackRange: 0.7, attackCooldown: 1.4, windup: 0.3,
    abilities: ["rallyCry"],
    weapon: { type: "staff", color: "#8a5a2e", orb: "rgba(255,120,80,0.6)" },
    look: { skin: "#7cc46a", hair: "#3f6e34", shirt: "#d9662b", pants: "#6e4521", eyes: "#222222", helmet: "#c9a040" },
  },
  healer: {
    name: "초록 수도사", shape: "human", behavior: "support",
    hp: 3.5, speed: 1.4, damage: 0.5, xp: 6, emerald: 0.8,
    attackRange: 0.7, attackCooldown: 1.4, windup: 0.3,
    abilities: ["healAllies"],
    weapon: { type: "staff", color: "#d9c27a", orb: "rgba(120,255,160,0.7)" },
    look: { skin: "#f2c39b", hair: "#2f6e3a", shirt: "#3fae5a", pants: "#2f6e3a", eyes: "#1a3a1a", helmet: "#3fae5a" },
  },
  shieldbearer: {
    name: "방패 해골", shape: "human", behavior: "shieldbearer",
    hp: 5, speed: 1.3, damage: 1, xp: 6, emerald: 0.7,
    attackRange: 0.85, attackCooldown: 1.3, windup: 0.35, frontShield: true,
    weapon: { type: "sword", color: "#c9ced6", length: 0.7, shield: "#8a6a3a" },
    look: { skin: "#ece8dc", hair: "#d6d1c2", shirt: "#b8b2a2", pants: "#9e9888", eyes: "#3a8aff" },
  },
  summoner: {
    name: "뼈 피리꾼", shape: "human", behavior: "support",
    hp: 4, speed: 1.3, damage: 0.8, xp: 7, emerald: 0.9,
    attackRange: 0.7, attackCooldown: 1.4, windup: 0.3,
    abilities: ["summonBones"],
    weapon: { type: "staff", color: "#e8e4d8", orb: "rgba(200,140,255,0.7)" },
    look: { skin: "#d8d4c8", hair: "#5a3a7a", shirt: "#5a3a7a", pants: "#3d2a58", eyes: "#c08aff", helmet: "#5a3a7a" },
  },
  boneling: {
    name: "꼬마 해골", shape: "human", behavior: "melee",
    hp: 1.2, speed: 2.2, damage: 0.5, xp: 1, emerald: 0.1, size: 0.7,
    attackRange: 0.6, attackCooldown: 1.0, windup: 0.28, armsForward: true,
    look: { skin: "#ece8dc", hair: "#d6d1c2", shirt: "#d9d4c5", pants: "#c9c3b2", eyes: "#222222" },
  },
  charger: {
    name: "돌진 멧돼지 기사", shape: "human", behavior: "charger",
    hp: 6, speed: 1.6, damage: 1.5, xp: 7, emerald: 0.8, size: 1.15,
    attackRange: 0.85, attackCooldown: 1.4, windup: 0.32,
    abilities: ["charge"],
    weapon: { type: "sword", color: "#9aa3ad", length: 0.75 },
    look: { skin: "#c98a6a", hair: "#5a3a22", shirt: "#7a4e25", pants: "#5a3a22", eyes: "#2a1a10", helmet: "#8d949c" },
  },
  trapper: {
    name: "덫 고블린", shape: "human", behavior: "support",
    hp: 3, speed: 1.8, damage: 0.5, xp: 5, emerald: 0.8, size: 0.85,
    attackRange: 0.7, attackCooldown: 1.2, windup: 0.3,
    abilities: ["webTrap", "groundSpikes"],
    weapon: { type: "pick", color: "#9aa3ad", length: 0.45 },
    look: { skin: "#8ac46a", hair: "#4a6e34", shirt: "#8a6a3a", pants: "#5a4a2a", eyes: "#222222" },
  },
  mushroom: {
    name: "독버섯 꼬마", shape: "shroom", behavior: "melee",
    hp: 2.5, speed: 1.4, damage: 0.8, xp: 3, emerald: 0.5,
    attackRange: 0.65, attackCooldown: 1.3, windup: 0.32, deathPool: true,
    abilities: ["poisonPool"],
    color: "#c0392b", spots: "#ffffff",
  },
  sniper: {
    name: "저격 해골", shape: "human", behavior: "kite",
    hp: 2.5, speed: 1.5, damage: 1.2, xp: 6, emerald: 0.8, arrowDrop: 0.6,
    abilities: ["snipe"],
    weapon: { type: "bow", color: "#3a2a1a" },
    look: { skin: "#e8e4d8", hair: "#a03030", shirt: "#7a2a2a", pants: "#4a1a1a", eyes: "#ff4040", helmet: "#a03030" },
  },
  thief: {
    name: "보물 고블린", shape: "human", behavior: "thief",
    hp: 6, speed: 3.0, damage: 0, xp: 8, emerald: 1, emeraldCount: 10, size: 0.85, treasure: true,
    look: { skin: "#7cc46a", hair: "#3f6e34", shirt: "#ffd23f", pants: "#8a5a2e", eyes: "#222222", helmet: "#c9a040" },
  },
  jellyCube: {
    name: "젤리 큐브", shape: "slime", behavior: "melee",
    hp: 6, speed: 1.2, damage: 1, xp: 5, emerald: 0.6, size: 1.4,
    attackRange: 0.95, attackCooldown: 1.3, windup: 0.3,
    abilities: ["stickyGoo"],
    color: "#a96ad9", splits: "jellyMid", splitCount: 2,
  },
  jellyMid: {
    name: "중간 젤리", shape: "slime", behavior: "melee",
    hp: 2.5, speed: 1.7, damage: 0.8, xp: 2, emerald: 0.3, size: 0.85,
    attackRange: 0.75, attackCooldown: 1.1, windup: 0.28,
    color: "#a96ad9", splits: "jellyMini", splitCount: 2,
  },
  jellyMini: {
    name: "꼬마 젤리", shape: "slime", behavior: "melee",
    hp: 1, speed: 2.2, damage: 0.5, xp: 1, emerald: 0.15, size: 0.5,
    attackRange: 0.6, attackCooldown: 1.0, windup: 0.25,
    color: "#a96ad9",
  },
  lurker: {
    name: "카멜레온 도마뱀", shape: "human", behavior: "lurker",
    hp: 4, speed: 2.0, damage: 1.3, xp: 6, emerald: 0.7,
    attackRange: 0.8, attackCooldown: 1.2, windup: 0.3, armsForward: true,
    look: { skin: "#5fb07a", hair: "#3a8a5a", shirt: "#4a9a6a", pants: "#3a7a52", eyes: "#ffd23f" },
  },
  whirler: {
    name: "회오리 전사", shape: "human", behavior: "melee",
    hp: 6, speed: 1.6, damage: 1.2, xp: 7, emerald: 0.8,
    attackRange: 0.85, attackCooldown: 1.4, windup: 0.32,
    abilities: ["spinAttack"],
    weapon: { type: "sword", color: "#d0d6de", length: 0.9 },
    look: { skin: "#e0a878", hair: "#2b1d14", shirt: "#3a5a9a", pants: "#2a3a6a", eyes: "#222222", helmet: "#7a8aa8" },
  },
});

// 기존 몬스터에 기술 조금 (너무 어렵지 않게)
if (MONSTERS.golem) MONSTERS.golem.abilities = ["slam"];
if (MONSTERS.mage) MONSTERS.mage.abilities = ["blink"];
if (MONSTERS.spider) MONSTERS.spider.abilities = ["webTrap"];
if (MONSTERS.knight) MONSTERS.knight.abilities = ["charge"];
if (MONSTERS.mummy) MONSTERS.mummy.abilities = ["pull"];
if (MONSTERS.slime) MONSTERS.slime.abilities = ["stickyGoo"];

// ===================== 5) 정예 속성 =====================
// 정예 몹: 빛나는 테두리 + "정예" 이름표 + 속성 아이콘. 체력·공격력이 세지고, 잡으면 부품을 더 줘요.
//   abilities: 정예에게 더해지는 기술      update/onHit/onDeath/onHurtPlayer: 특별 규칙
const ELITE_AFFIXES = {
  fireTrail: {
    name: "불꽃 발자국", short: "불", color: "#ff7a1a",
    desc: "지나간 자리에 작은 불이 3초 동안 남아요.", counter: "정예 뒤를 쫓지 말고 옆에서 공격하기",
    update(m, dt) {
      m.trailT = (m.trailT || 0) - dt;
      if (m.moving && m.trailT <= 0) { m.trailT = 0.35; addHazard({ kind: "fire", x: m.x, y: m.y, radius: 0.45, life: 3.2, tick: 0.7, owner: m, dmgMul: 0.35 }); }
    },
  },
  frozen: {
    name: "빙결 수정", short: "빙", color: "#8fe0ff",
    desc: "주인공 발밑에 얼음 수정을 만들어 잠시 뒤 터뜨려요(느려짐).", counter: "하늘색 원이 생기면 바로 밖으로",
    abilities: ["frostOrb"],
  },
  arcane: {
    name: "회전 광선", short: "광", color: "#c070ff",
    desc: "가끔 제자리에 빛 기둥을 세워 광선 2줄을 천천히 돌려요. 1초 전에 도는 방향을 보여줘요.", counter: "광선과 같은 방향으로 함께 돌며 피하기, 구르면 통과",
    update(m, dt) {
      m.beamT = (m.beamT === undefined ? 3 + Math.random() * 3 : m.beamT) - dt;
      if (m.beamT <= 0 && game.player && Math.hypot(nearestPlayer(m.x, m.y).x - m.x, nearestPlayer(m.x, m.y).y - m.y) < 7) {
        m.beamT = 10;
        const t = abilityTuning();
        addHazard({ kind: "spinBeam", x: m.x, y: m.y, angle: Math.random() * Math.PI * 2, dir: Math.random() < 0.5 ? 1 : -1, speed: 0.65 / Math.max(0.7, t.telegraph), len: 4.2 * t.size, warn: Math.max(0.8, 1.0 * t.telegraph), life: 5.5, tick: 0.5, owner: m, dmgMul: 0.8 });
      }
    },
  },
  teleport: {
    name: "순간이동", short: "순", color: "#a070ff",
    desc: "보라 원을 보인 뒤 주인공 근처로 순간이동해 내려쳐요.", counter: "보라 원 자리에서 떨어지기, 원거리로 마무리",
    abilities: ["blink"],
  },
  shielding: {
    name: "보호막", short: "막", color: "#8fd8ff",
    desc: "가끔 보호막을 둘러 공격을 흡수해요.", counter: "보호막이 있는 동안은 다른 몹부터, 불·폭탄 화살로 깨기",
    abilities: ["shield"],
  },
  illusion: {
    name: "분신", short: "분", color: "#d0d0ff",
    desc: "처음 다치면 한 대 맞으면 사라지는 분신 2마리를 만들어요. 진짜는 이름표가 있어요.", counter: "이름표가 있는 진짜를 노리기",
    onHit(m) {
      if (m.cloned || m.hp > m.maxHp * 0.85) return;
      m.cloned = true;
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        const spot = findFreeSpot(m.x + Math.cos(a) * 1.2, m.y + Math.sin(a) * 1.2, m.r, 2) || { x: m.x, y: m.y };
        const c = createMonster(m.type, spot.x, spot.y, game.mapLevel || 1);
        c.clone = true; c.hp = c.maxHp = 1; c.aggro = true; c.appearTimer = 0.3; c.scaleMul = m.scaleMul;
        c.damage = m.damage * 0.5;
        monsters.push(c);
        spawnBurst(spot.x, spot.y, ["#d0d0ff", "#ffffff"], 8);
      }
    },
  },
  fast: {
    name: "빠름", short: "빠", color: "#ffe94d",
    desc: "걷는 속도가 35% 빨라요.", counter: "얼음 화살로 느리게 하기",
    apply(m) { m.speed *= 1.35; },
  },
  vampiric: {
    name: "흡혈", short: "흡", color: "#ff3b5a",
    desc: "주인공을 때릴 때마다 체력을 조금 되찾아요.", counter: "맞지 않게 치고 빠지기",
    onHurtPlayer(m) {
      const h = m.maxHp * 0.08;
      m.hp = Math.min(m.maxHp, m.hp + h);
      addFloatText(m.x, m.y, `+${Math.round(h)}`, "#ff6b8a", 16);
    },
  },
  jailer: {
    name: "감옥", short: "옥", color: "#b050ff",
    desc: "보라색 원이 다 차면 그 안에서 발이 묶여요.", counter: "보라 원이 차기 전에 밖으로",
    abilities: ["jail"],
  },
  vortex: {
    name: "소용돌이", short: "끌", color: "#7050d0",
    desc: "주변 넓은 원 안의 주인공을 끌어당겨요.", counter: "끌려간 뒤 바로 구르기",
    abilities: ["pull"],
  },
  lightning: {
    name: "번개", short: "번", color: "#fff27a",
    desc: "맞을 때마다(1.2초에 한 번) 사방으로 작은 번개 구슬을 튀겨요.", counter: "화살로 멀리서 공격하기",
    onHit(m) {
      if ((m.zapT || 0) > game.time) return;
      m.zapT = game.time + 1.2;
      const n = 6, sp = 4.5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
        arrows.push({ x: m.x + Math.cos(a) * 0.4, y: m.y + Math.sin(a) * 0.4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.6, damage: m.damage * 0.4, bolt: true, color: "#fff27a" });
      }
      if (typeof sfx !== "undefined") sfx.zap();
    },
  },
  deathNova: {
    name: "불꽃 유언", short: "유", color: "#ff5a2a",
    desc: "쓰러질 때 사방으로 느린 불꽃 구슬을 퍼뜨려요.", counter: "정예가 쓰러지는 순간 물러나거나 구슬 사이로 피하기",
    onDeath(m) {
      const n = 10, sp = 3.5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        arrows.push({ x: m.x + Math.cos(a) * 0.3, y: m.y + Math.sin(a) * 0.3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 2.2, damage: m.damage * 0.6, bolt: true, color: "#ff8a3a" });
      }
    },
  },
};

// 난이도별: 정예 마릿수, 정예 하나당 속성 개수
const ELITE_RULES = {
  easy: { count: 1, affixes: 1 },
  normal: { count: 2, affixes: 1 },
  hard: { count: 3, affixes: 2 },
  nightmare: { count: 4, affixes: 3 },
  hpMul: 2.2, damageMul: 1.25, sizeMul: 1.15,
  forbiddenEasy: [["vortex", "jailer"], ["jailer", "arcane"], ["vortex", "arcane"]], // 쉬움·보통에서 같이 안 붙어요
  notElite: ["thief", "boneling", "slimeSmall", "jellyMid", "jellyMini"],
};

function pickAffixes(n, diffId) {
  const ids = Object.keys(ELITE_AFFIXES);
  const out = [];
  const forbidden = diffId === "easy" || diffId === "normal" ? ELITE_RULES.forbiddenEasy : [];
  for (let tries = 0; tries < 60 && out.length < n; tries++) {
    const id = ids[Math.floor(Math.random() * ids.length)];
    if (out.includes(id)) continue;
    if (forbidden.some(([a, b]) => (a === id && out.includes(b)) || (b === id && out.includes(a)))) continue;
    out.push(id);
  }
  return out;
}

function makeElite(m, affixIds) {
  m.elite = true;
  m.affixes = affixIds;
  m.maxHp *= ELITE_RULES.hpMul; m.hp = m.maxHp;
  m.damage *= ELITE_RULES.damageMul;
  m.scaleMul = (m.scaleMul || 1) * ELITE_RULES.sizeMul;
  m.name = "정예 " + m.def.name;
  const extra = [];
  for (const id of affixIds) {
    const a = ELITE_AFFIXES[id];
    if (a.apply) a.apply(m);
    if (a.abilities) extra.push(...a.abilities);
  }
  if (extra.length) m.abilities = [...(m.def.abilities || []), ...extra];
  return m;
}

function assignElites(mapDef) {
  const d = (game.profile && game.profile.difficulty) || "normal";
  const rule = ELITE_RULES[d] || ELITE_RULES.normal;
  const idx = Math.max(0, MAPS.indexOf(mapDef));
  const count = rule.count + Math.floor(idx / 4);
  const pool = monsters.filter((m) => !m.boss && !ELITE_RULES.notElite.includes(m.type));
  for (let i = 0; i < count && pool.length; i++) {
    const m = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    makeElite(m, pickAffixes(rule.affixes, d));
  }
}

// ===================== 6) 정예 장판(불 자국, 회전 광선) =====================
let hazards = [];
function addHazard(h) { h.t = 0; h.tickT = 0; hazards.push(h); }

function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

function updateHazards(dt) {
  for (const h of hazards) {
    h.t += dt; h.life -= dt; h.tickT -= dt;
    if (h.owner && h.owner.hp <= 0) h.life = 0; // 주인이 쓰러지면 사라져요
    if (h.life <= 0) continue;
    if (h.kind === "spinBeam") { if (h.t < h.warn) continue; h.angle += h.dir * h.speed * dt; }
    let ticked = false;
    for (const p of allPlayers()) { // 둘이 하기: 두 사람 다
      if (p.hp <= 0) continue;
      let inside = false;
      if (h.kind === "fire") inside = Math.hypot(p.x - h.x, p.y - h.y) < h.radius + p.r * 0.4;
      if (h.kind === "spinBeam") {
        for (const k of [0, Math.PI]) {
          const ex = h.x + Math.cos(h.angle + k) * h.len, ey = h.y + Math.sin(h.angle + k) * h.len;
          if (segDist(p.x, p.y, h.x, h.y, ex, ey) < 0.32 + p.r * 0.5) inside = true;
        }
      }
      if (inside && h.tickT <= 0 && p.rollTimer <= 0) { ticked = true; hurtPlayer(p, (h.owner ? h.owner.damage : 1) * h.dmgMul, { x: h.x, y: h.y }); }
    }
    if (ticked) h.tickT = h.tick;
  }
  hazards = hazards.filter((h) => h.life > 0);
}

function drawHazards() {
  if (!hazards.length) return;
  ctx.save();
  for (const h of hazards) {
    const fade = Math.min(1, h.life / 0.4);
    if (h.kind === "fire") {
      const c = toScreen(h.x, h.y, 0.02), e = floorEllipse(h.radius);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255,${110 + Math.floor(40 * Math.sin(game.time * 12 + h.x))},30,${0.45 * fade})`;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      continue;
    }
    if (h.kind === "spinBeam") {
      const warn = h.t < h.warn;
      for (const k of [0, Math.PI]) {
        const a = toScreen(h.x, h.y, 0.3), b = toScreen(h.x + Math.cos(h.angle + k) * h.len, h.y + Math.sin(h.angle + k) * h.len, 0.3);
        ctx.lineCap = "round";
        if (warn) {
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = `rgba(255,70,50,${0.5 + 0.4 * Math.sin(game.time * 20)})`; ctx.lineWidth = 3; // 아파요 = 빨강
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.setLineDash([]);
          // 도는 방향 화살표
          const mid = toScreen(h.x + Math.cos(h.angle + k) * h.len * 0.7, h.y + Math.sin(h.angle + k) * h.len * 0.7, 0.3);
          const tip = toScreen(h.x + Math.cos(h.angle + k + h.dir * 0.25) * h.len * 0.7, h.y + Math.sin(h.angle + k + h.dir * 0.25) * h.len * 0.7, 0.3);
          ctx.strokeStyle = "rgba(255,220,255,0.9)"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(mid.x, mid.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
          drawStar(tip.x, tip.y, 6 * ZOOM, "rgba(255,220,255,0.9)");
        } else {
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = `rgba(190,90,255,${0.35 * fade})`; ctx.lineWidth = 16 * ZOOM;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.strokeStyle = `rgba(255,230,255,${0.95 * fade})`; ctx.lineWidth = 5 * ZOOM;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.globalCompositeOperation = "source-over";
        }
      }
      const c = toScreen(h.x, h.y, 0);
      drawBox(h.x - 0.12, h.y - 0.12, 0, 0.24, 0.24, 0.5, "#7a3fd0");
      if (!warn) drawStar(c.x, c.y - 0.5 * BLOCK_H, 9 * ZOOM, "#ffe0ff");
    }
  }
  ctx.restore();
}

// 정예 표시: 바닥 빛 + 이름표 + 속성 아이콘
function drawEliteUnder(m) {
  const color = ELITE_AFFIXES[m.affixes[0]].color;
  const c = toScreen(m.x, m.y, 0.02), e = floorEllipse(0.55 * (m.scaleMul || 1));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.35 + 0.15 * Math.sin(game.time * 4 + m.x);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawEliteLabel(m) {
  const p = nearestPlayer(m.x, m.y);
  if (!p || Math.hypot(p.x - m.x, p.y - m.y) > 9) return;
  const S = (m.def.size || 1) * (m.scaleMul || 1);
  const s = toScreen(m.x, m.y, (m.def.shape === "human" ? 1.45 : 0.95) * S + 0.15);
  text(m.name, s.x, s.y, 13 * ZOOM * 0.8, "#ffd84a", "center");
  const n = m.affixes.length, w = 18 * ZOOM * 0.8;
  m.affixes.forEach((id, i) => {
    const a = ELITE_AFFIXES[id];
    const x = s.x - (n * w) / 2 + i * w + 1, y = s.y + 4;
    ctx.fillStyle = a.color; ctx.fillRect(x, y, w - 2, w - 2);
    ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 1; ctx.strokeRect(x, y, w - 2, w - 2);
    ctx.font = `bold ${Math.round((w - 2) * 0.72)}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
    ctx.textAlign = "center"; ctx.fillStyle = "#1a1a1a";
    ctx.fillText(a.short, x + (w - 2) / 2, y + (w - 2) * 0.8);
  });
}

// ===================== 7) 다른 함수들과 연결 (hooks.js 알림 지점) =====================
// 몬스터 배치 뒤: 보물 고블린은 맵당 1마리, 정예 정하기
hookOn("monstersSpawned", (mapDef) => {
  let thieves = 0;
  for (const m of monsters) if (m.type === "thief" && ++thieves > 1) { m.hp = 0; m.escaped = true; }
  monsters = monsters.filter((m) => m.hp > 0);
  assignElites(mapDef);
}, 30);

// 장면이 바뀌면 정예 장판도 지우기
hookOn("reset", () => { hazards = []; }, 20);

// 매 프레임 (기술 엔진 다음에)
hookOn("abilitiesUpdated", (dt) => {
  for (const m of monsters) {
    if (!m.elite || m.hp <= 0) continue;
    for (const id of m.affixes) if (ELITE_AFFIXES[id].update) ELITE_AFFIXES[id].update(m, dt);
  }
  updateHazards(dt);
}, 30);

// 바닥 장판 그리기 (기술 예고와 같은 층)
hookOn("drawTelegraphsAfter", () => drawHazards(), 30);

// 기술 장판(독·거미줄)에 주인 표시 -> 정예가 쓰러지면 같이 사라져요
hookOn("castResolved", (c, p, z0) => { for (let i = z0; i < zones.length; i++) zones[i].owner = c.m; }, 30);

// 몬스터가 맞을 때: 분신은 한 방에, 방패병 정면 막기, 정예 속성(번개·분신)
hookOn("monsterDamage", (h) => {
  const m = h.m, opts = h.opts;
  if (m.hp <= 0) return true;
  if (m.clone && h.dmg > 0) {
    m.hp = 0;
    spawnBurst(m.x, m.y, ["#d0d0ff", "#ffffff"], 10);
    addFloatText(m.x, m.y, "가짜!", "#d0d0ff", 18);
    return true;
  }
  if (m.def.frontShield && !opts.dot && h.dmg > 0) {
    const ax = h.fromX - m.x, ay = h.fromY - m.y, al = Math.hypot(ax, ay) || 1;
    if ((ax * m.faceX + ay * m.faceY) / al > 0.35) {
      m.flash = 0.05;
      addFloatText(m.x, m.y, "방패!", "#d9c27a", 16);
      if (typeof sfx !== "undefined") sfx.block();
      return true;
    }
  }
  if (m.def.behavior === "lurker" && m.hidden) m.hidden = false;
  if (m.def.behavior === "thief" && !m.fleeing) { m.fleeing = true; m.fleeLeft = THIEF_TIME[(game.profile && game.profile.difficulty) || "normal"] || 14; }
  return false;
}, 30);
hookOn("monsterDamaged", (h) => {
  const m = h.m;
  if (m.elite && m.hp > 0 && !h.opts.dot) for (const id of m.affixes) if (ELITE_AFFIXES[id].onHit) ELITE_AFFIXES[id].onHit(m);
}, 10);

// 쓰러질 때: 정예 보상·유언, 독버섯 웅덩이, 보물 고블린 보물
hookOn("monsterKilled", (m) => {
  if (m.elite) {
    for (const id of m.affixes) if (ELITE_AFFIXES[id].onDeath) ELITE_AFFIXES[id].onDeath(m);
    zones = zones.filter((z) => z.owner !== m);
    hazards = hazards.filter((h) => h.owner !== m);
    // 화폐·장비는 loot.js 가 떨어뜨려요
    for (let i = 0; i < 3; i++) dropPickup("emerald", m.x, m.y);
    addFloatText(m.x, m.y, "정예 처치!", "#ffd84a", 22);
  }
  if (m.def.deathPool) zones.push({ x: m.x, y: m.y, radius: 1.1, life: 4, max: 4, tick: 0.8, tickT: 0.6, damage: m.damage * 0.4, kind: "poison" });
  if (m.def.treasure) {
    for (let i = 0; i < 8; i++) dropPickup("emerald", m.x, m.y); // 화폐·장비는 loot.js
    showMessage("보물 고블린을 잡았어요! 보물이 쏟아져요", 2.5, true);
  }
}, 30);

// 흡혈 정예: 때리면 회복
hookOn("playerHurt", (p, damage, from, hp0) => {
  if (from && from.elite && p.hp < hp0) for (const id of from.affixes) if (ELITE_AFFIXES[id].onHurtPlayer) ELITE_AFFIXES[id].onHurtPlayer(from);
}, 30);

// 그리기: 정예 빛·이름표, 숨은 도마뱀, 분신, 북치기 강화 빔
hookOn("drawMonsterUnder", (m) => { if (m.elite) drawEliteUnder(m); }, 30);
hookOn("monsterAlpha", (a, m) => {
  if (m.def.behavior === "lurker" && m.hidden) {
    const easy = game.profile && game.profile.difficulty === "easy";
    return a * ((easy ? 0.32 : 0.14) + 0.05 * Math.sin(game.time * 6 + m.x));
  }
  if (m.clone) return a * 0.75;
  return a;
}, 30);
hookOn("drawMonsterOver", (m) => {
  if (m.def.behavior === "lurker" && m.hidden) return;
  if (m.clone) return;
  if (m.elite) drawEliteLabel(m);
  if (m.type === "drummer" && m.hp > 0) {
    // 강해진 동료에게 빨간 빛줄기
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const a = toScreen(m.x, m.y, 0.8);
    for (const o of monsters) {
      if (o === m || !o._buff || o.hp <= 0 || Math.hypot(o.x - m.x, o.y - m.y) > 6) continue;
      const b = toScreen(o.x, o.y, 0.7);
      ctx.strokeStyle = `rgba(255,80,60,${0.35 + 0.2 * Math.sin(game.time * 10)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }
}, 30);

