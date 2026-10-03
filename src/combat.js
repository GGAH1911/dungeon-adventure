// ===== 근접 전투: 3단 연속기, 타격감, 무기 그리기 =====
// 공격 버튼을 연달아 누르면 1타 -> 2타 -> 3타(마무리)! (누르고 있어도 이어져요)
// 무기 종류(type)마다 동작이 달라요. 동작 숫자를 바꿔보세요.
//   kind: slash 가로 베기, thrust 찌르기, overhead 내려찍기, spin 회오리, slam 땅 울리기
//   dir: 베는 방향 (1 / -1)   dmg: 공격력 배수   dur: 동작 시간(초)
//   lunge: 앞으로 내딛는 거리   shock: 충격파 크기

const MOVESETS = {
  sword: [
    { kind: "slash", dir: 1, dmg: 1, dur: 0.22 },
    { kind: "slash", dir: -1, dmg: 1.05, dur: 0.22 },
    { kind: "overhead", dmg: 1.7, dur: 0.32, lunge: 0.35, shock: 1.2 },
  ],
  dagger: [
    { kind: "thrust", dmg: 1, dur: 0.15, lunge: 0.12 },
    { kind: "thrust", dmg: 1, dur: 0.15, lunge: 0.12 },
    { kind: "spin", dir: 1, dmg: 1.5, dur: 0.3 },
  ],
  spear: [
    { kind: "thrust", dmg: 1, dur: 0.2, lunge: 0.2 },
    { kind: "thrust", dmg: 1.1, dur: 0.2, lunge: 0.2 },
    { kind: "slash", dir: 1, dmg: 1.5, dur: 0.3, arc: 1.7, rangeMul: 0.9 },
  ],
  axe: [
    { kind: "overhead", dmg: 1, dur: 0.3 },
    { kind: "slash", dir: -1, dmg: 1.1, dur: 0.26 },
    { kind: "spin", dir: 1, dmg: 1.6, dur: 0.36 },
  ],
  hammer: [
    { kind: "overhead", dmg: 1, dur: 0.32, shock: 0.9 },
    { kind: "overhead", dmg: 1.1, dur: 0.32, shock: 0.9 },
    { kind: "slam", dmg: 1.9, dur: 0.46, lunge: 0.25, shock: 2.4 },
  ],
  scythe: [
    { kind: "slash", dir: 1, dmg: 1, dur: 0.26 },
    { kind: "slash", dir: -1, dmg: 1, dur: 0.26 },
    { kind: "spin", dir: -1, dmg: 1.6, dur: 0.36 },
  ],
};

const EFFECT_COLORS = { burn: "#ff8a2a", slow: "#8fe0ff", chain: "#ffe94d", heal: "#c08aff", emerald: "#29d67a" };

let impacts = []; // 맞은 자리 번쩍 효과

// ----- 공격 시작 -----
function startAttack(p) {
  const w = p.weapon;
  const moves = MOVESETS[w.type] || MOVESETS.sword;
  const idx = p.comboTimer > 0 ? p.combo % moves.length : 0;
  const mv = moves[idx];
  const finisher = idx === moves.length - 1;
  p.move = { ...mv, index: idx, finisher };
  p.swingTimer = mv.dur;
  p.hitDone = false;
  p.attackTimer = w.cooldown * (finisher ? 1.35 : 1);
  p.combo = idx + 1;
  p.comboTimer = p.attackTimer + CONFIG.player.comboWindow;
  // 마무리 동작은 앞으로 쭉
  if (mv.lunge) { p.lungeTimer = 0.12; p.lungeSpeed = mv.lunge / 0.12; }

  // 가까운 몬스터 쪽으로 자동으로 몸을 돌려요
  let nearest = null, best = w.range + 0.8;
  for (const m of allTargets()) {
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < best) { best = d; nearest = m; }
  }
  if (nearest && best > 0.01) { p.faceX = (nearest.x - p.x) / best; p.faceY = (nearest.y - p.y) / best; }

  if (w.legendary) sfx.legendSwing();
  else if (finisher) sfx.bigSwing();
  else sfx.swing();
}

// 몬스터 + 연습용 허수아비
function allTargets() {
  const list = monsters.filter((m) => m.hp > 0 && m.appearTimer <= 0);
  if (game.scene === "lobby") for (const d of dummies) list.push(d);
  return list;
}

// 매 프레임: 휘두르는 중 "맞는 순간"이 오면 판정해요
function updateAttack(p, dt) {
  p.comboTimer -= dt;
  if (p.lungeTimer > 0) {
    p.lungeTimer -= dt;
    moveEntity(p, p.faceX * p.lungeSpeed * dt, p.faceY * p.lungeSpeed * dt);
  }
  if (!p.move || p.hitDone) return;
  const t = 1 - p.swingTimer / p.move.dur;
  const hitAt = MOVE_ANIMS[moveAnimName(p.move, p.weapon)].impact; // 칼이 실제로 지나가는 순간 (anim.js)
  if (t >= hitAt) { p.hitDone = true; resolveMove(p, p.move); }
}

function weaponPower(p) {
  const w = p.weapon;
  return w.damage * damageBonus(game.profile.level); // 무기 강화·팔·세트는 currentWeapon() 에 들어 있어요
}

function resolveMove(p, mv) {
  const w = p.weapon;
  const range = w.range * (mv.rangeMul || 1);
  let arc = w.arc;
  if (mv.kind === "spin") arc = Math.PI;
  else if (mv.kind === "thrust") arc = Math.min(0.45, w.arc);
  else if (mv.kind === "overhead") arc = Math.min(0.8, w.arc);
  else if (mv.arc) arc = mv.arc;
  const minFacing = Math.cos(Math.min(arc, Math.PI)) - 0.05;
  const base = weaponPower(p) * mv.dmg;

  const hit = [];
  for (const m of allTargets()) {
    const dx = m.x - p.x, dy = m.y - p.y;
    const d = Math.hypot(dx, dy) || 0.001;
    let inside = false;
    if (mv.kind === "slam") {
      const cx = p.x + p.faceX * 0.8, cy = p.y + p.faceY * 0.8;
      inside = Math.hypot(m.x - cx, m.y - cy) < mv.shock + m.r;
    } else {
      inside = d <= range + m.r && (d < 0.5 || (dx * p.faceX + dy * p.faceY) / d >= minFacing);
    }
    if (!inside) continue;
    hit.push(m);
    const crit = Math.random() < CONFIG.player.critChance;
    const dmg = base * (crit ? CONFIG.player.critDamage : 1);
    const knock = (mv.finisher ? 1.6 : 1) * (crit ? 1.3 : 1);
    if (m.dummy) hitDummy(m, dmg, crit, p);
    else damageMonster(m, dmg, p.x, p.y, w.legendary, knock, { crit, melee: true, effect: w.effect, finisher: mv.finisher });
  }

  // 충격파 (안 맞아도 보여요)
  if (mv.shock) {
    const cx = p.x + p.faceX * 0.8, cy = p.y + p.faceY * 0.8;
    addRing(cx, cy, { speed: mv.shock * 6, life: 0.3, hue: 35 });
    spawnDust(cx, cy); spawnDust(cx, cy);
    game.shake = Math.max(game.shake, mv.kind === "slam" ? 0.35 : 0.18);
    sfx.slam();
  }

  if (w.legendary) legendStrike(p, hit.filter((m) => !m.dummy));
  if (hit.length) {
    const anyCrit = hit.some((m) => m.lastCrit);
    hitStop(mv.finisher ? 0.085 : 0.05, anyCrit);
    if (mv.finisher) sfx.bigHit(); else sfx.hit();
  }
}

// 맞는 순간 화면이 아주 잠깐 멈춰요 (묵직한 느낌!)
function hitStop(time, crit) {
  game.hitstop = Math.max(game.hitstop || 0, time + (crit ? 0.035 : 0));
}

// 맞은 자리에 번쩍 + 불꽃
function addImpact(m, fromX, fromY, crit, color) {
  const dx = m.x - fromX, dy = m.y - fromY, d = Math.hypot(dx, dy) || 1;
  const x = m.x - (dx / d) * m.r * 0.8, y = m.y - (dy / d) * m.r * 0.8;
  impacts.push({ x, y, z: 0.6 * (m.def && m.def.size ? m.def.size : 1), life: 0.16, max: 0.16, angle: Math.atan2(dy, dx) + Math.PI / 2 + (Math.random() - 0.5), crit, color });
  for (let i = 0; i < (crit ? 10 : 6); i++) {
    const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.8, s = 3 + Math.random() * 4;
    addSparkle(x, y, 0.6, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 1 + Math.random() * 2, life: 0.25, size: 0.45, gold: true, gravity: 8 });
  }
}

function updateImpacts(dt) {
  for (const im of impacts) im.life -= dt;
  impacts = impacts.filter((im) => im.life > 0);
}

function drawImpacts() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const im of impacts) {
    const c = toScreen(im.x, im.y, im.z);
    const k = im.life / im.max;
    const L = (im.crit ? 46 : 32) * ZOOM * (1.2 - k * 0.4);
    // 하얀 칼자국
    ctx.strokeStyle = `rgba(255,255,255,${k})`;
    ctx.lineWidth = (im.crit ? 7 : 5) * ZOOM * k;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(c.x - Math.cos(im.angle) * L, c.y - Math.sin(im.angle) * L * 0.6);
    ctx.lineTo(c.x + Math.cos(im.angle) * L, c.y + Math.sin(im.angle) * L * 0.6);
    ctx.stroke();
    drawStar(c.x, c.y, (im.crit ? 26 : 16) * ZOOM * k, im.crit ? `rgba(255,230,90,${k})` : im.color ? im.color : `rgba(255,255,255,${k})`);
  }
  ctx.restore();
}

// ----- 상태 이상 -----
function applyEffect(m, effect, dmg) {
  if (effect === "burn") { m.burn = 3; m.burnDmg = Math.max(m.burnDmg || 0, dmg * 0.15); m.burnTick = 0.5; }
  if (effect === "slow") m.slow = 2.5;
  if (effect === "chain") {
    // 근처 몬스터 2마리에게 번개
    const others = monsters.filter((o) => o !== m && o.hp > 0 && Math.hypot(o.x - m.x, o.y - m.y) < 3.5).slice(0, 2);
    for (const o of others) {
      bolts.push({ ax: m.x, ay: m.y, bx: o.x, by: o.y, life: 0.22, max: 0.22 });
      damageMonster(o, dmg * 0.5, m.x, m.y, false, 0.4, { dot: true });
    }
    if (others.length) sfx.zap();
  }
}
