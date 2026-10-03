// ===== 동작(애니메이션) =====
// 동작마다 "핵심 자세(키프레임)"를 정해두고, 그 사이를 부드럽게 이어요.
// 애니메이션 원칙:
//  - 예비동작: 휘두르기 전에 살짝 뒤로 빼요 (힘을 모으는 느낌)
//  - 빠른 타격: 때리는 순간은 아주 빠르게
//  - 따라오기: 휘두른 뒤 칼이 조금 더 지나갔다가 멈춰요
//  - 무게 이동: 몸통이 같이 돌고(twist) 기울어요(lean)
// 손 위치: hy(+ 오른쪽으로 돈 각도), hr(몸에서 거리), hz(높이)
// 무기 방향: wy(+ 오른쪽), wp(+ 위쪽)

const EASE = {
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  fast: (t) => 1 - Math.pow(1 - t, 3.5),
  smooth: (t) => t * t * (3 - 2 * t),
};

// 무기 종류 -> 자세 묶음
function weaponClass(w) {
  if (!w) return "sword";
  if (w.type === "spear") return "spear";
  if (w.type === "axe" || w.type === "hammer" || w.type === "scythe") return "heavy";
  if (w.type === "dagger") return "dagger";
  return "sword";
}
function weaponStyle(w) {
  if (w.legendary) return "legend";
  return { sword: "blade", dagger: "dagger", spear: "spear", axe: "axe", hammer: "hammer", scythe: "scythe" }[w.type] || "blade";
}

// 가만히 있을 때 무기 드는 자세
const IDLE_GRIP = {
  sword: { hy: 0.95, hr: 0.27, hz: 0.44, wy: 0.45, wp: -0.75 },
  dagger: { hy: 0.95, hr: 0.27, hz: 0.45, wy: 0.3, wp: -0.35 },
  spear: { hy: 0.45, hr: 0.2, hz: 0.52, wy: 0.1, wp: 0.28, tw: 0.5, shaft: [0.08, 0.45] },
  heavy: { hy: 0.55, hr: 0.24, hz: 0.5, wy: -0.55, wp: 1.0, shaft: [-0.32, -0.08] },
};

// 공격 동작 키프레임 (t: 0~1). impact = 실제로 맞는 순간
const MOVE_ANIMS = {
  slash: { impact: 0.42, keys: [
    { t: 0, hy: 0.95, hr: 0.27, hz: 0.5, wy: 0.6, wp: -0.5 },
    { t: 0.28, hy: 1.5, hr: 0.27, hz: 0.66, wy: 2.1, wp: 0.12, lean: -0.03, tw: 0.75, ease: "out" },
    { t: 0.56, hy: -0.7, hr: 0.27, hz: 0.6, wy: -1.4, wp: -0.05, lean: 0.08, tw: -0.8, ease: "fast" },
    { t: 1, hy: -0.95, hr: 0.22, hz: 0.52, wy: -1.9, wp: -0.4, lean: 0.03, tw: -0.95, ease: "out" },
  ] },
  backslash: { impact: 0.42, keys: [
    { t: 0, hy: -0.95, hr: 0.22, hz: 0.52, wy: -1.9, wp: -0.4, tw: -0.95 },
    { t: 0.25, hy: -0.8, hr: 0.23, hz: 0.66, wy: -1.65, wp: 0.15, lean: -0.03, tw: -0.9, ease: "out" },
    { t: 0.56, hy: 1.2, hr: 0.31, hz: 0.6, wy: 1.7, wp: 0, lean: 0.08, tw: 0.7, ease: "fast" },
    { t: 1, hy: 1.4, hr: 0.29, hz: 0.52, wy: 2.1, wp: -0.35, lean: 0.03, tw: 0.8, ease: "out" },
  ] },
  overhead: { impact: 0.58, keys: [
    { t: 0, hy: 1.2, hr: 0.29, hz: 0.52, wy: 1.7, wp: -0.3, tw: 0.7 },
    { t: 0.42, hy: 0.3, hr: 0.14, hz: 1.0, wy: 0.15, wp: 2.25, lean: -0.08, hop: 0.03, tw: 0.25, ease: "out" },
    { t: 0.6, hy: 0.08, hr: 0.36, hz: 0.5, wy: 0.04, wp: -0.6, lean: 0.16, tw: -0.35, ease: "fast" },
    { t: 1, hy: 0.08, hr: 0.34, hz: 0.45, wy: 0.04, wp: -0.85, lean: 0.1, tw: -0.3, ease: "out" },
  ] },
  thrust: { impact: 0.5, keys: [
    { t: 0, hy: 0.6, hr: 0.22, hz: 0.52, wy: 0.2, wp: -0.1, tw: 0.4 },
    { t: 0.35, hy: 0.75, hr: 0.1, hz: 0.57, wy: 0.06, wp: 0.02, lean: -0.06, tw: 0.4, ease: "out" },
    { t: 0.55, hy: 0.12, hr: 0.46, hz: 0.58, wy: 0.0, wp: 0.0, lean: 0.14, tw: -0.55, ease: "fast" },
    { t: 1, hy: 0.35, hr: 0.34, hz: 0.55, wy: 0.05, wp: -0.08, lean: 0.05, tw: -0.25, ease: "out" },
  ] },
  // 창: 두 손으로 잡고 몸통째 밀어 찌르기 (왼쪽 어깨가 앞으로)
  spearThrust: { impact: 0.5, keys: [
    { t: 0, hy: 0.45, hr: 0.2, hz: 0.52, wy: 0.1, wp: 0.2, tw: 0.5 },
    { t: 0.35, hy: 0.7, hr: 0.08, hz: 0.55, wy: 0.05, wp: 0.05, lean: -0.06, tw: 0.55, ease: "out" },
    { t: 0.55, hy: 0.2, hr: 0.26, hz: 0.56, wy: 0.0, wp: 0.0, lean: 0.15, tw: 0.45, ease: "fast" },
    { t: 1, hy: 0.35, hr: 0.2, hz: 0.54, wy: 0.05, wp: 0.12, lean: 0.05, tw: 0.5, ease: "out" },
  ] },
  spin: { impact: 0.5, keys: [
    { t: 0, hy: 1.1, hr: 0.3, hz: 0.55, wy: 1.3, wp: -0.2, body: 0, tw: 0.5 },
    { t: 0.22, hy: 1.35, hr: 0.31, hz: 0.6, wy: 1.7, wp: 0.05, body: -0.6, lean: -0.04, tw: 0.6, ease: "out" },
    { t: 0.82, hy: 1.35, hr: 0.32, hz: 0.6, wy: 1.7, wp: 0, body: Math.PI * 2 - 0.15, lean: 0.06, tw: 0.4, ease: "fast" },
    { t: 1, hy: 1.2, hr: 0.3, hz: 0.55, wy: 1.6, wp: -0.25, body: Math.PI * 2, tw: 0.4, ease: "out" },
  ] },
  slam: { impact: 0.62, keys: [
    { t: 0, hy: 0.55, hr: 0.24, hz: 0.5, wy: -0.55, wp: 1.0, tw: 0.3 },
    { t: 0.46, hy: 0.25, hr: 0.12, hz: 1.0, wy: 0.1, wp: 2.35, lean: -0.1, hop: 0.12, crouch: 0, tw: 0.15, ease: "out" },
    { t: 0.63, hy: 0.06, hr: 0.36, hz: 0.42, wy: 0.03, wp: -0.75, lean: 0.2, hop: 0, crouch: 0.3, tw: -0.35, ease: "fast" },
    { t: 1, hy: 0.06, hr: 0.34, hz: 0.42, wy: 0.03, wp: -0.85, lean: 0.14, crouch: 0.15, tw: -0.3, ease: "out" },
  ] },
};

// 연속기 동작 이름 고르기
function moveAnimName(mv, w) {
  if (mv.kind === "slash") return mv.dir === -1 ? "backslash" : "slash";
  if (mv.kind === "thrust" && w && w.type === "spear") return "spearThrust";
  return mv.kind;
}

// 키프레임 사이를 이어서 지금 자세 구하기
function sampleKeys(keys, t) {
  t = Math.max(0, Math.min(1, t));
  let i = 1;
  while (i < keys.length - 1 && t > keys[i].t) i++;
  const a = keys[i - 1], b = keys[i];
  const k = (EASE[b.ease] || EASE.smooth)((t - a.t) / Math.max(0.0001, b.t - a.t));
  const out = {};
  for (const key of ["hy", "hr", "hz", "wy", "wp", "lean", "hop", "crouch", "body", "tw"]) {
    const va = a[key] !== undefined ? a[key] : 0, vb = b[key] !== undefined ? b[key] : va;
    out[key] = va + (vb - va) * k;
  }
  return out;
}

// ===== 주인공 자세 =====
function playerPose(p) {
  const w = p.weapon;
  const cls = weaponClass(w);
  const walking = p.moving && p.swingTimer <= 0;
  const pose = {
    walk: { phase: p.walkTime * 11, amp: walking ? 1 : 0 },
    bob: walking ? Math.abs(Math.sin(p.walkTime * 11)) * 0.045 : Math.sin(game.time * 2.6 + p.x * 3) * 0.012,
    lean: walking ? 0.05 : 0,
    back: [],
  };
  const style = weaponStyle(w);
  const glow = EFFECT_GLOW[w.effect];
  const weaponSpec = (dir) => ({ style, color: w.color, len: w.length, dir, glow, butt: cls === "heavy" ? 0.32 : 0.35 });

  // --- 활 쏘는 자세 ---
  if (p.bowTimer > 0) {
    const bow = p.bow;
    const age = p.bowAge || 0;
    const cd = Math.max(0.15, bow.cooldown);
    // 쏜 직후 0.08초는 시위가 풀린 상태, 그 뒤 다음 화살을 다시 당겨요
    const draw = age < 0.08 ? 0 : Math.min(1, (age - 0.08) / Math.max(0.05, cd - 0.08));
    const lh = V(0.42, 0.03, 0.68);
    const rest = V(0.34, -0.02, 0.68), full = V(0.05, -0.07, 0.73), after = V(-0.02, -0.12, 0.76);
    const rh = age < 0.08 ? vlerp(full, after, age / 0.08) : vlerp(rest, full, EASE.out(draw));
    pose.lh = lh; pose.rh = rh;
    pose.rhHint = V(-1, -0.4, -0.2); // 당기는 팔꿈치는 뒤로
    pose.lhHint = V(0, 0.6, -1);
    pose.twist = -0.25;
    pose.lean = 0.02;
    pose.bow = { draw, aim: V(1, 0, 0), arrow: draw > 0.15, color: bow.legendary ? "#ffffff" : bow.color, legend: bow.legendary, arrowColor: arrowTypeById(currentArrowType()).color };
    // 칼은 등에
    pose.back.push({ kind: "weapon", at: V(-0.22, 0.05, 0.44), dir: dirAt(Math.PI - 0.3, 1.2), weapon: { ...weaponSpec(V(0, 0, 1)), len: Math.min(0.7, w.length * 0.8), glow: null } });
    return pose;
  }

  // --- 칼 자세 (가만히 / 공격) ---
  let g;
  let bodyYaw = 0;
  if (p.move && p.swingTimer > 0) {
    const anim = MOVE_ANIMS[moveAnimName(p.move, w)];
    const t = 1 - p.swingTimer / p.move.dur;
    g = sampleKeys(anim.keys, t);
    bodyYaw = g.body || 0;
    pose.lean = g.lean || 0;
    pose.hop = g.hop || 0;
    pose.crouch = g.crouch || 0;
  } else {
    const idle = IDLE_GRIP[cls];
    g = { ...idle };
    if (p.moving) { g.hy += Math.sin(p.walkTime * 11) * 0.12; g.hz += Math.abs(Math.sin(p.walkTime * 11)) * 0.02; }
  }
  const rh = handAt(g.hy, g.hr, g.hz);
  pose.rh = rh;
  // 윗몸 돌기: 키프레임(또는 자세)에 정해져 있으면 그걸, 아니면 손 방향을 따라서
  pose.twist = g.tw !== undefined ? g.tw : Math.max(-0.6, Math.min(0.6, g.hy * 0.35));
  const wdir = dirAt(g.wy, g.wp);
  pose.weapon = weaponSpec(wdir);
  pose.bodyYaw = bodyYaw;

  // 왼손: 두손 무기는 자루를 잡고, 아니면 균형 잡기
  const idle = IDLE_GRIP[cls];
  if (idle.shaft) {
    pose.lhShaft = idle.shaft; // rig.js 가 닿는 자리를 찾아 잡아요
  } else if (cls === "dagger") {
    pose.lh = handAt(-0.95 + (p.moving ? Math.sin(p.walkTime * 11) * 0.12 : 0), 0.27, 0.45);
    pose.offWeapon = { style: "dagger", color: w.color, len: w.length * 0.9, dir: dirAt(-0.3, -0.35) };
  } else if (p.move && p.swingTimer > 0) {
    pose.lh = handAt(-1.25, 0.22, 0.5);
  }
  if (p.hurtLean > 0) { pose.lean -= 0.12 * (p.hurtLean / 0.2); pose.crouch = Math.max(pose.crouch || 0, 0.1); }
  // 활은 등에
  pose.back.push({ kind: "bow", at: V(-0.22, 0, 0.56), aim: V(-1, 0, 0), bow: { color: p.bow.legendary ? "#ffffff" : p.bow.color, half: 0.22, legend: p.bow.legendary } });
  return pose;
}

const EFFECT_GLOW = {
  burn: "rgba(255,120,30,0.35)", slow: "rgba(140,220,255,0.35)", chain: "rgba(255,230,80,0.35)",
  heal: "rgba(190,140,255,0.3)", emerald: "rgba(60,220,120,0.3)",
};

// 지금 칼끝/손잡이의 세상 좌표 (궤적, 반짝이용)
function bladeWorld(p) {
  const pose = playerPose(p);
  const opts = { bodyYaw: pose.bodyYaw || 0 };
  const built = buildRigItems(p, CONFIG.colors.player, pose, opts);
  const X = rigTransform(p, opts);
  const hand = built.arms.rh.hand;
  if (!pose.weapon) return { hand: X.world(hand), tip: X.world(hand) };
  const tip = vadd(hand, vmul(vnorm(pose.weapon.dir), pose.weapon.len));
  return { hand: X.world(hand), tip: X.world(tip) };
}

// ===== 휘두른 궤적 (칼끝이 지나간 자리를 기록해서 그려요) =====
function updateTrail(p, dt) {
  p.trail = (p.trail || []).filter((s) => (s.life -= dt) > 0);
  if (p.move && p.swingTimer > 0 && p.rollTimer <= 0) {
    const b = bladeWorld(p);
    p.trail.push({ hand: b.hand, tip: b.tip, life: 0.14, max: 0.14 });
  }
}

function drawTrail(p) {
  const tr = p.trail || [];
  if (tr.length < 2) return;
  const w = p.weapon;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 1; i < tr.length; i++) {
    const a = tr[i - 1], b = tr[i];
    const k = b.life / b.max;
    const inner = (q) => ({ x: q.hand.x + (q.tip.x - q.hand.x) * 0.45, y: q.hand.y + (q.tip.y - q.hand.y) * 0.45, z: q.hand.z + (q.tip.z - q.hand.z) * 0.45 });
    const pts = [toScreen(a.tip.x, a.tip.y, a.tip.z), toScreen(b.tip.x, b.tip.y, b.tip.z), (() => { const q = inner(b); return toScreen(q.x, q.y, q.z); })(), (() => { const q = inner(a); return toScreen(q.x, q.y, q.z); })()];
    let color;
    if (w.legendary) color = rainbow(game.time * 300 + i * 25, 60, 0.55 * k);
    else if (w.effect === "burn") color = `rgba(255,140,50,${0.5 * k})`;
    else if (w.effect === "slow") color = `rgba(150,225,255,${0.5 * k})`;
    else if (w.effect === "chain") color = `rgba(255,235,90,${0.5 * k})`;
    else color = `rgba(255,255,255,${0.42 * k})`;
    fillPoly(pts, color);
  }
  ctx.restore();
}

// ===== 몬스터 자세 =====
function monsterPose(m) {
  const def = m.def;
  const walking = m.moving;
  const pose = {
    walk: { phase: m.walkTime * 11, amp: walking ? 1 : 0 },
    bob: walking ? Math.abs(Math.sin(m.walkTime * 11)) * 0.045 : Math.sin(game.time * 2.2 + m.x * 3) * 0.012,
    lean: walking ? 0.05 : 0,
  };
  const wpn = def.weapon;
  let windK = m.state === "windup" && m.windupDur ? 1 - Math.max(0, m.stateTimer) / m.windupDur : 0;
  if (m.state === "blinkStrike") windK = 1 - Math.max(0, m.stateTimer) / 0.3; // 그림자 기사: 순간이동 뒤 내려치기 준비
  if (m.state === "throw" && wpn) {
    // 광부 좀비: 곡괭이를 머리 위로 들어 던질 준비
    const k = 1 - Math.max(0, m.stateTimer) / 0.45;
    pose.rh = handAt(0.4, 0.14 + 0.05 * k, 0.75 + 0.3 * k);
    pose.weapon = { style: "pick", color: wpn.color, len: wpn.length || 0.55, dir: dirAt(0.2, 1.2 + 1.0 * k), butt: 0.2 };
    pose.lean = -0.08 * k;
    pose.twist = 0.3 * k;
    return pose;
  }
  const strikeK = m.strikeT > 0 ? m.strikeT / 0.22 : 0; // 1 -> 0

  if (def.armsForward && !wpn) {
    // 좀비, 미라: 팔을 앞으로 쭉 (걸을 때 흔들흔들)
    const sway = Math.sin(m.walkTime * 6) * 0.04;
    let f = 0.4, z = 0.63;
    if (windK > 0) { f = 0.4 - 0.18 * windK; z = 0.63 + 0.3 * windK; pose.lean = -0.08 * windK; }
    if (strikeK > 0) { f = 0.48; z = 0.5 + 0.1 * (1 - strikeK); pose.lean = 0.14 * strikeK; }
    pose.rh = V(f, -0.13, z + sway); pose.lh = V(f, 0.13, z - sway);
    pose.rhHint = V(0, -0.3, -1); pose.lhHint = V(0, 0.3, -1);
    return pose;
  }
  if (wpn && wpn.type === "bow") {
    // 해골 궁수: 활을 들고, 조준할 때 시위를 당겨요
    const aiming = m.state === "aim";
    const draw = aiming ? Math.min(1, 1 - m.stateTimer / 0.55) : 0;
    if (aiming || m.recentShot > 0) {
      pose.lh = V(0.42, 0.03, 0.68);
      pose.rh = draw > 0 ? vlerp(V(0.34, -0.02, 0.68), V(0.06, -0.07, 0.72), EASE.out(draw)) : V(0.0, -0.12, 0.74);
      pose.rhHint = V(-1, -0.4, -0.2);
      pose.twist = -0.25;
      pose.bow = { draw, aim: V(1, 0, 0), arrow: draw > 0.1, color: wpn.color || "#7a5230" };
    } else {
      pose.lh = handAt(-0.9, 0.28, 0.5);
      pose.bow = { draw: 0, aim: dirAt(-0.3, 0), color: wpn.color || "#7a5230", half: 0.32 };
    }
    return pose;
  }
  if (wpn && wpn.type === "staff") {
    // 얼음 마법사: 지팡이를 짚고 있다가, 주문을 걸 때 높이 들어요
    const casting = m.state === "aim";
    const k = casting ? Math.min(1, 1 - m.stateTimer / 0.55) : 0;
    const hy = 0.7 - 0.5 * k, hz = 0.5 + 0.35 * k;
    pose.rh = handAt(hy, 0.26 + 0.1 * k, hz);
    pose.weapon = { style: "staff", color: wpn.color || "#6b4a2a", len: 0.62, dir: dirAt(0.1, 1.45 - 0.75 * k), butt: 0.42, orb: wpn.orb, power: 0.3 + 0.9 * k };
    pose.lh = casting ? handAt(-0.5, 0.3, 0.7 + 0.1 * k) : null;
    pose.lean = 0.06 * k;
    return pose;
  }
  if (wpn) {
    // 칼(기사), 곡괭이 등: 베기 동작을 예비동작/타격으로
    let g;
    if (windK > 0) g = sampleKeys(MOVE_ANIMS.slash.keys, 0.28 * windK);
    else if (strikeK > 0) g = sampleKeys(MOVE_ANIMS.slash.keys, 0.28 + 0.72 * (1 - strikeK));
    else g = { ...IDLE_GRIP.sword, wp: -0.6 };
    if (wpn.type === "pick" && windK === 0 && strikeK === 0) g = { hy: 0.6, hr: 0.25, hz: 0.5, wy: -0.4, wp: 1.0 };
    pose.rh = handAt(g.hy, g.hr, g.hz);
    pose.twist = Math.max(-0.6, Math.min(0.6, g.hy * 0.35));
    pose.lean = g.lean || pose.lean;
    pose.weapon = { style: wpn.type === "pick" ? "pick" : "blade", color: wpn.color || "#9aa3ad", len: wpn.length || 0.8, dir: dirAt(g.wy, g.wp), butt: 0.3 };
    if (wpn.shield) pose.shield = { color: wpn.shield, dir: V(1, 0, 0) }, pose.lh = handAt(-0.7, 0.3, 0.55);
    return pose;
  }
  // 무기 없는 몬스터(골렘 등): 두 주먹을 들었다가 쾅!
  if (def.heavy) {
    let lift = 0, fwd = 0.22;
    if (windK > 0) { lift = windK; pose.lean = -0.1 * windK; }
    if (strikeK > 0) { lift = 0; fwd = 0.45; pose.lean = 0.2 * strikeK; pose.crouch = 0.25 * strikeK; }
    const z = 0.45 + 0.6 * lift;
    pose.rh = V(fwd - 0.1 * lift, -0.2, z); pose.lh = V(fwd - 0.1 * lift, 0.2, z);
    pose.rhHint = V(-0.3, -1, -0.5); pose.lhHint = V(-0.3, 1, -0.5);
    return pose;
  }
  return pose;
}

// 상인, 대장장이 같은 사람들
function npcPose(n, kind) {
  const pose = { bob: Math.sin(game.time * 2.2 + n.x) * 0.012 };
  if (kind === "smith") {
    // 망치로 모루를 땅땅
    const t = (game.time % 1.4) / 1.4;
    const up = t < 0.6 ? EASE.smooth(t / 0.6) : 1 - EASE.fast((t - 0.6) / 0.15);
    const k = Math.max(0, Math.min(1, up));
    pose.rh = handAt(0.35, 0.3, 0.5 + 0.45 * k);
    pose.weapon = { style: "hammer", color: "#77777f", len: 0.42, dir: dirAt(0.2, -0.5 + 1.9 * k), butt: 0.12 };
    pose.lean = 0.06 - 0.06 * k;
  }
  return pose;
}
