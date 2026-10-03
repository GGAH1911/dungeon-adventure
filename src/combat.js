// ===== 근접 전투: 3단 연속기, 타격감, 무기 그리기 =====
// 공격 버튼을 연달아 누르면 1타 -> 2타 -> 3타(마무리)! (누르고 있어도 이어져요)
// 무기 종류(type)마다 동작이 달라요. 동작 숫자를 바꿔보세요.
//   kind: slash 가로 베기, thrust 찌르기, overhead 내려찍기, spin 회오리, slam 땅 울리기
//   dir: 베는 방향 (1 / -1)   dmg: 공격력 배수   dur: 동작 시간(초)
//   lunge: 앞으로 내딛는 거리   shock: 충격파 크기

const MOVESETS = {
  sword: [
    { kind: "slash", dir: 1, dmg: 1, dur: 0.17 },
    { kind: "slash", dir: -1, dmg: 1.05, dur: 0.17 },
    { kind: "overhead", dmg: 1.7, dur: 0.26, lunge: 0.35, shock: 1.2 },
  ],
  dagger: [
    { kind: "thrust", dmg: 1, dur: 0.12, lunge: 0.12 },
    { kind: "thrust", dmg: 1, dur: 0.12, lunge: 0.12 },
    { kind: "spin", dir: 1, dmg: 1.5, dur: 0.24 },
  ],
  spear: [
    { kind: "thrust", dmg: 1, dur: 0.17, lunge: 0.2 },
    { kind: "thrust", dmg: 1.1, dur: 0.17, lunge: 0.2 },
    { kind: "slash", dir: 1, dmg: 1.5, dur: 0.26, arc: 1.7, rangeMul: 0.9 },
  ],
  axe: [
    { kind: "overhead", dmg: 1, dur: 0.22 },
    { kind: "slash", dir: -1, dmg: 1.1, dur: 0.2 },
    { kind: "spin", dir: 1, dmg: 1.6, dur: 0.32 },
  ],
  hammer: [
    { kind: "overhead", dmg: 1, dur: 0.24, shock: 0.9 },
    { kind: "overhead", dmg: 1.1, dur: 0.24, shock: 0.9 },
    { kind: "slam", dmg: 1.9, dur: 0.36, lunge: 0.25, shock: 2.4 },
  ],
  scythe: [
    { kind: "slash", dir: 1, dmg: 1, dur: 0.2 },
    { kind: "slash", dir: -1, dmg: 1, dur: 0.2 },
    { kind: "spin", dir: -1, dmg: 1.6, dur: 0.3 },
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
  const hitAt = p.move.kind === "overhead" || p.move.kind === "slam" ? 0.55 : 0.2;
  if (t >= hitAt) { p.hitDone = true; resolveMove(p, p.move); }
}

function weaponPower(p) {
  const w = p.weapon;
  return w.damage * damageBonus(game.profile.level) * (1 + UPGRADE.weaponBonus * upgradeLevel("weapon", w.id));
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

// ----- 휘두르는 칼의 위치 계산 -----
const easeOut = (t) => 1 - (1 - t) * (1 - t);

// 칼 손잡이(hand)와 칼끝(tip)의 3D 위치
function bladeGeom(p) {
  const w = p.weapon;
  const base = Math.atan2(p.faceY, p.faceX);
  const L = w.length;
  const mv = p.move;
  const swinging = mv && p.swingTimer > 0;
  const t = swinging ? Math.min(1, Math.max(0, 1 - p.swingTimer / mv.dur)) : 0;
  const at = (a, r, z) => ({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, z });
  if (!swinging) {
    const a = base + 0.9;
    const hand = at(a, 0.25, 0.55);
    return { hand, tip: { x: hand.x + Math.cos(a) * L, y: hand.y + Math.sin(a) * L, z: 0.62 }, kind: "idle", t };
  }
  if (mv.kind === "slash" || mv.kind === "spin") {
    const arc = mv.kind === "spin" ? Math.PI : Math.min(mv.arc || w.arc, Math.PI * 0.95);
    const dir = mv.dir || 1;
    const a = mv.kind === "spin" ? base - dir * Math.PI + dir * 2 * Math.PI * easeOut(t) : base + dir * arc - dir * 2 * arc * easeOut(t);
    const hand = at(a, 0.25, 0.55);
    return { hand, tip: { x: hand.x + Math.cos(a) * L, y: hand.y + Math.sin(a) * L, z: 0.6 }, kind: mv.kind, t, angle: a };
  }
  if (mv.kind === "thrust") {
    const ext = Math.sin(t * Math.PI);
    const hand = at(base, 0.18 + 0.38 * ext, 0.56);
    return { hand, tip: { x: hand.x + p.faceX * L, y: hand.y + p.faceY * L, z: 0.58 }, kind: "thrust", t, ext };
  }
  // overhead / slam: 위에서 앞으로 내려찍기
  const phi = 1.9 - 2.3 * easeOut(t);
  const hand = at(base, 0.22, 0.72);
  return {
    hand,
    tip: { x: hand.x + p.faceX * Math.cos(phi) * L, y: hand.y + p.faceY * Math.cos(phi) * L, z: Math.max(0.05, 0.72 + Math.sin(phi) * L) },
    kind: mv.kind, t, phi,
  };
}

// 휘두르는 궤적
function drawSwingTrail(p, colorAt, width) {
  const mv = p.move;
  if (!mv || p.swingTimer <= 0) return;
  const g = bladeGeom(p);
  const w = p.weapon;
  const R = 0.25 + w.length * 0.92;
  const pts = [];
  const steps = 16;
  if (g.kind === "slash" || g.kind === "spin") {
    const base = Math.atan2(p.faceY, p.faceX);
    const arc = g.kind === "spin" ? Math.PI : Math.min(mv.arc || w.arc, Math.PI * 0.95);
    const dir = mv.dir || 1;
    const start = g.kind === "spin" ? base - dir * Math.PI : base + dir * arc;
    for (let i = 0; i <= steps; i++) {
      const a = start + (g.angle - start) * (i / steps);
      pts.push(toScreen(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, 0.56));
    }
  } else if (g.kind === "thrust") {
    const back = toScreen(g.hand.x - p.faceX * 0.3, g.hand.y - p.faceY * 0.3, 0.57);
    const front = toScreen(g.tip.x + p.faceX * 0.25 * g.ext, g.tip.y + p.faceY * 0.25 * g.ext, 0.58);
    pts.push(back, front);
  } else {
    for (let i = 0; i <= steps; i++) {
      const ph = 1.9 + (g.phi - 1.9) * (i / steps);
      pts.push(toScreen(g.hand.x + p.faceX * Math.cos(ph) * w.length, g.hand.y + p.faceY * Math.cos(ph) * w.length, Math.max(0.05, 0.72 + Math.sin(ph) * w.length)));
    }
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "lighter";
  const fade = 1 - g.t * 0.5;
  for (let i = 1; i < pts.length; i++) {
    const k = i / (pts.length - 1);
    ctx.strokeStyle = colorAt(k, fade);
    ctx.lineWidth = width * (0.35 + 0.65 * k);
    ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
  }
  ctx.restore();
}

// 무기 그리기 (종류마다 모양이 달라요)
function drawWeapon(p) {
  const w = p.weapon;
  const g = bladeGeom(p);
  const mv = p.move;
  const fx = EFFECT_COLORS[w.effect];
  const trailColor = fx || "#ffffff";
  const rgb = parseInt(trailColor.slice(1), 16);
  const r = (rgb >> 16) & 255, gg = (rgb >> 8) & 255, b = rgb & 255;
  drawSwingTrail(p, (k, fade) => `rgba(${r},${gg},${b},${(0.25 + 0.55 * k) * fade})`, (mv && mv.finisher ? 13 : 9) * ZOOM);

  const H = toScreen(g.hand.x, g.hand.y, g.hand.z);
  const T = toScreen(g.tip.x, g.tip.y, g.tip.z);
  const ux = g.tip.x - g.hand.x, uy = g.tip.y - g.hand.y, uz = g.tip.z - g.hand.z;
  const ul = Math.hypot(ux, uy, uz) || 1;
  const back = toScreen(g.hand.x - (ux / ul) * 0.14, g.hand.y - (uy / ul) * 0.14, g.hand.z - (uz / ul) * 0.14);
  const line = (a, c, color, width) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke(); };
  ctx.lineCap = "round";

  // 특수 효과 무기는 은은하게 빛나요
  if (fx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    line(H, T, `rgba(${r},${gg},${b},${0.3 + 0.12 * Math.sin(game.time * 14)})`, 15 * ZOOM);
    ctx.restore();
    if (w.effect === "burn" && Math.random() < 0.3) spawnBurst(g.tip.x, g.tip.y, ["#ffb03b", "#ff5a1f"], 1);
  }

  const type = w.type;
  if (type === "spear" || type === "axe" || type === "hammer" || type === "scythe") {
    // 긴 자루
    const start = toScreen(g.hand.x - (ux / ul) * 0.3, g.hand.y - (uy / ul) * 0.3, g.hand.z - (uz / ul) * 0.3);
    line(start, T, "#3d2a16", 7 * ZOOM);
    line(start, T, "#7a5230", 4.5 * ZOOM);
    const sx = -p.faceY, sy = p.faceX; // 옆 방향
    if (type === "spear") {
      const tipEnd = toScreen(g.tip.x + (ux / ul) * 0.25, g.tip.y + (uy / ul) * 0.25, g.tip.z + (uz / ul) * 0.25);
      const s1 = toScreen(g.tip.x + sx * 0.08, g.tip.y + sy * 0.08, g.tip.z);
      const s2 = toScreen(g.tip.x - sx * 0.08, g.tip.y - sy * 0.08, g.tip.z);
      fillPoly([s1, tipEnd, s2], w.color);
      ctx.strokeStyle = "#1d2a33"; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (type === "hammer") {
      drawBox(g.tip.x - 0.17, g.tip.y - 0.17, g.tip.z - 0.12, 0.34, 0.34, 0.26, w.color);
    } else if (type === "axe") {
      const a1 = toScreen(g.tip.x - (ux / ul) * 0.28, g.tip.y - (uy / ul) * 0.28, g.tip.z - (uz / ul) * 0.28);
      const a2 = toScreen(g.tip.x - (ux / ul) * 0.32 + sx * 0.3, g.tip.y - (uy / ul) * 0.32 + sy * 0.3, g.tip.z - (uz / ul) * 0.32);
      const a3 = toScreen(g.tip.x + sx * 0.34, g.tip.y + sy * 0.34, g.tip.z);
      fillPoly([a1, a2, a3, T], w.color);
      ctx.strokeStyle = "#1d2a33"; ctx.lineWidth = 2; ctx.stroke();
    } else {
      // 낫: 휘어진 날
      const c1 = toScreen(g.tip.x + sx * 0.45 - (ux / ul) * 0.1, g.tip.y + sy * 0.45 - (uy / ul) * 0.1, g.tip.z + 0.1);
      const c2 = toScreen(g.tip.x + sx * 0.6 - (ux / ul) * 0.45, g.tip.y + sy * 0.6 - (uy / ul) * 0.45, g.tip.z - 0.05);
      ctx.strokeStyle = "#1d2a33"; ctx.lineWidth = 7 * ZOOM;
      ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.quadraticCurveTo(c1.x, c1.y, c2.x, c2.y); ctx.stroke();
      ctx.strokeStyle = w.color; ctx.lineWidth = 4 * ZOOM;
      ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.quadraticCurveTo(c1.x, c1.y, c2.x, c2.y); ctx.stroke();
    }
    return;
  }
  // 칼, 단검
  line(H, T, "#1d2a33", 8 * ZOOM);
  line(H, T, w.color, 5 * ZOOM);
  line(back, H, "#6b4423", 6 * ZOOM);
  const sx = -p.faceY * 0.1, sy = p.faceX * 0.1;
  line(toScreen(g.hand.x + sx, g.hand.y + sy, g.hand.z), toScreen(g.hand.x - sx, g.hand.y - sy, g.hand.z), "#8a6a2a", 4 * ZOOM);
  if (type === "dagger") {
    // 왼손에도 단검 하나 더
    const ox = -p.faceY * 0.3, oy = p.faceX * 0.3;
    const h2 = toScreen(p.x - ox + p.faceX * 0.2, p.y - oy + p.faceY * 0.2, 0.5);
    const t2 = toScreen(p.x - ox + p.faceX * 0.55, p.y - oy + p.faceY * 0.55, 0.55);
    line(h2, t2, "#1d2a33", 7 * ZOOM);
    line(h2, t2, w.color, 4 * ZOOM);
  }
}

// 손 위치를 주인공 기준(앞, 옆, 높이)으로 바꾸기 (팔 그림용)
function toLocal(p, pt) {
  const dx = pt.x - p.x, dy = pt.y - p.y;
  return { f: dx * p.faceX + dy * p.faceY, s: dx * -p.faceY + dy * p.faceX, z: pt.z };
}
