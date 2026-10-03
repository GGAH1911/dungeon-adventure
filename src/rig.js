// ===== 캐릭터 뼈대(리그) =====
// 게임 개발에서 쓰는 방법 그대로:
//  1) 몸을 "뼈대"로 만들어요: 엉덩이 -> 몸통 -> 어깨 -> 팔꿈치 -> 손
//  2) 손 위치만 정하면 팔꿈치는 자동으로 계산돼요 (IK: 팔 길이가 늘어나지 않게)
//  3) 무기·활은 손에 붙어요 (소켓). 손이 움직이면 무기도 같이!
//  4) 몸, 팔, 무기, 활을 전부 한 목록에 넣고 "뒤에 있는 것부터" 그려요
//     -> 뒤를 볼 때 활이 머리 위에 겹쳐 보이는 일이 없어요
//
// 좌표: f = 앞, s = 왼쪽(+) / 오른쪽(-), z = 위. 단위는 칸(타일).

const V = (f, s, z) => ({ f, s, z });
const vadd = (a, b) => V(a.f + b.f, a.s + b.s, a.z + b.z);
const vsub = (a, b) => V(a.f - b.f, a.s - b.s, a.z - b.z);
const vmul = (a, k) => V(a.f * k, a.s * k, a.z * k);
const vlen = (a) => Math.hypot(a.f, a.s, a.z);
const vnorm = (a) => { const l = vlen(a) || 1; return vmul(a, 1 / l); };
const vdot = (a, b) => a.f * b.f + a.s * b.s + a.z * b.z;
const vlerp = (a, b, t) => V(a.f + (b.f - a.f) * t, a.s + (b.s - a.s) * t, a.z + (b.z - a.z) * t);
const vcross = (a, b) => V(a.s * b.z - a.z * b.s, a.z * b.f - a.f * b.z, a.f * b.s - a.s * b.f);

// 세로축으로 돌리기 (+ 는 오른쪽으로)
function rotZ(v, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return V(v.f * c + v.s * s, -v.f * s + v.s * c, v.z);
}
// 앞으로 기울이기 (pivotZ 높이를 기준으로, + 는 앞으로)
function pitchAbout(v, pivotZ, a) {
  const dz = v.z - pivotZ, c = Math.cos(a), s = Math.sin(a);
  return V(v.f * c + dz * s, v.s, pivotZ - v.f * s + dz * c);
}
// 몸 둘레의 손 위치: yaw(+ 오른쪽), r(몸에서 거리), z(높이)
const handAt = (yaw, r, z) => V(r * Math.cos(yaw), -r * Math.sin(yaw), z);
// 무기가 가리키는 방향: yaw(+ 오른쪽), pitch(+ 위)
const dirAt = (yaw, pitch) => V(Math.cos(pitch) * Math.cos(yaw), -Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch));

const RIG = {
  hipZ: 0.36, legH: 0.36, legW: 0.15, legS: 0.09,
  torsoW: 0.38, torsoH: 0.38,
  headSize: 0.36,
  shoulderZ: 0.67, shoulderS: 0.25,
  upper: 0.22, lower: 0.21, armW: 0.12, handW: 0.11,
};

// 팔꿈치 위치 계산 (2개 뼈 IK). 손이 너무 멀면 팔 길이만큼만 뻗어요.
function solveArm(sh, target, hint) {
  const L1 = RIG.upper, L2 = RIG.lower;
  let d = vsub(target, sh);
  let dist = vlen(d);
  let hand = target;
  const maxR = L1 + L2 - 0.002;
  if (dist > maxR) { d = vmul(d, maxR / dist); dist = maxR; hand = vadd(sh, d); }
  if (dist < 0.03) return { elbow: vadd(sh, V(0, 0, -L1)), hand, stretch: 0 };
  const dn = vmul(d, 1 / dist);
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  let perp = vsub(hint, vmul(dn, vdot(hint, dn)));
  if (vlen(perp) < 1e-4) perp = V(0, 0, -1);
  perp = vnorm(perp);
  return { elbow: vadd(vadd(sh, vmul(dn, a)), vmul(perp, h)), hand, stretch: vlen(vsub(target, hand)) };
}

// ----- 뼈대 -> 그릴 조각 목록 -----
// pose: anim.js 가 만들어요
//   bodyYaw 몸 전체 돌기, twist 윗몸 돌기, lean 앞으로 기울기, hop 뛰어오르기, crouch 웅크리기
//   walk { phase, amp }, rh/lh 손 위치(없으면 팔을 옆에 내려요)
//   weapon { item, style, dir, len, twoHand }, offWeapon(왼손 무기), bow { draw, aim, arrow, item }
//   back [ 등에 멘 것들 ]
function buildRigItems(e, look, pose, opts = {}) {
  const items = [];
  const box = (c, w, d, h, color, extra = {}) => items.push({ type: "box", c, w, d, h, color, ...extra });
  const seg = (a, b, style, extra = {}) => items.push({ type: "seg", a, b, style, ...extra });

  const walkPhase = pose.walk ? pose.walk.phase : 0;
  const walkAmp = pose.walk ? pose.walk.amp : 0;
  const swing = Math.sin(walkPhase) * walkAmp;
  const bob = pose.bob || 0;
  const crouch = pose.crouch || 0;
  const hipZ = RIG.hipZ * (1 - crouch * 0.35) + bob;

  // 다리 (걸을 때 앞뒤로)
  const legH = RIG.legH * (1 - crouch * 0.35);
  for (const side of [1, -1]) {
    const f = swing * 0.13 * side;
    box(V(f, side * RIG.legS, legH / 2), RIG.legW, RIG.legW, legH, look.pants, { armor: true, tag: "leg" });
    // 신발 (다리 아랫부분을 감싸요)
    if (look.boots) box(V(f + 0.015, side * RIG.legS, 0.065), RIG.legW + 0.03, RIG.legW + 0.03, 0.13, look.boots, { armor: true, tag: "boot" });
  }

  // 윗몸 변환: 엉덩이를 중심으로 기울이고 돌리기
  const lean = pose.lean || 0, twist = pose.twist || 0;
  const upper = (v) => rotZ(pitchAbout(V(v.f, v.s, v.z - RIG.hipZ + hipZ), hipZ, lean), twist);

  box(upper(V(0, 0, RIG.hipZ + RIG.torsoH / 2)), RIG.torsoW, RIG.torsoW, RIG.torsoH, look.shirt, { armor: true, tag: "torso" });
  const headC = rotZ(upper(V(0.0, 0, RIG.hipZ + RIG.torsoH + RIG.headSize / 2)), (pose.headYaw || 0) - twist * 0.4);
  box(headC, RIG.headSize, RIG.headSize, RIG.headSize, look.skin, { tag: "head", faceYaw: twist * 0.6 + (pose.headYaw || 0) });

  // 팔: 어깨에서 손까지 (IK)
  const arms = {};
  for (const [key, side] of [["rh", -1], ["lh", 1]]) {
    const sh = upper(V(0, side * RIG.shoulderS, RIG.shoulderZ));
    let target = pose[key];
    // 두손 무기: 왼손은 자루에서 "닿는 가장 가까운 곳"을 잡아요. 못 닿으면 놓아요.
    if (key === "lh" && pose.lhShaft && pose.weapon && arms.rh) {
      const d = vnorm(pose.weapon.dir);
      const a = vadd(arms.rh.hand, vmul(d, pose.lhShaft[0])), b = vadd(arms.rh.hand, vmul(d, pose.lhShaft[1]));
      const ab = vsub(b, a);
      const t = Math.max(0, Math.min(1, vdot(vsub(sh, a), ab) / Math.max(1e-6, vdot(ab, ab))));
      const near = vadd(a, vmul(ab, t));
      target = vlen(vsub(near, sh)) <= RIG.upper + RIG.lower - 0.01 ? near : null;
    }
    if (!target) {
      // 손을 옆으로 내리고 걸을 때 흔들기 (반대쪽 다리와 엇갈리게)
      target = V(-swing * 0.16 * side * -1, side * 0.27, 0.42 + bob);
      target = upper(V(target.f, target.s, target.z - bob));
    }
    const hint = pose[key + "Hint"] || V(-0.35, side * 0.55, -1);
    const sol = solveArm(sh, target, hint);
    arms[key] = { sh, ...sol, side };
    const sleeve = look.sleeve || look.shirt;
    // 위팔 2조각, 아래팔 2조각, 손
    for (const t of [0.3, 0.75]) box(vlerp(sh, sol.elbow, t), RIG.armW, RIG.armW, RIG.armW * 1.25, sleeve, { armor: true, tag: "arm" });
    for (const t of [0.3, 0.72]) box(vlerp(sol.elbow, sol.hand, t), RIG.armW * 0.95, RIG.armW * 0.95, RIG.armW * 1.15, look.forearm || sleeve, { armor: !look.forearm, tag: "arm" });
    box(sol.hand, RIG.handW, RIG.handW, RIG.handW, look.hand || look.skin, { tag: "hand" });
  }

  // 무기 (오른손에 붙어요)
  if (pose.weapon) addWeaponItems(items, arms.rh.hand, pose.weapon);
  if (pose.offWeapon) addWeaponItems(items, arms.lh.hand, pose.offWeapon);
  if (pose.shield) {
    const c = vadd(arms.lh.hand, vmul(pose.shield.dir, 0.06));
    box(c, 0.08, 0.3, 0.34, pose.shield.color, { tag: "shield" });
  }
  // 활 (왼손에 붙어요)
  if (pose.bow) addBowItems(items, arms.lh.hand, arms.rh.hand, pose.bow);
  // 등에 멘 것
  for (const b of pose.back || []) {
    if (b.kind === "weapon") addWeaponItems(items, upper(b.at), { ...b.weapon, dir: rotZ(b.dir, twist) });
    if (b.kind === "bow") addBowItems(items, upper(b.at), null, { ...b.bow, aim: rotZ(b.aim, twist), back: true });
  }
  return { items, arms, headC };
}

// 무기 조각들. grip = 손 위치, dir = 칼끝 방향
function addWeaponItems(items, grip, w) {
  const dir = vnorm(w.dir);
  const L = w.len;
  const style = w.style;
  const color = w.color;
  const pieces = Math.max(2, Math.round(L / 0.22));
  // 긴 칼날은 여러 조각으로 나눠서 앞뒤 순서를 정확히 해요 (이음매가 안 보이게 끝은 평평하게)
  const segN = (a, b, n, extra) => {
    for (let i = 0; i < n; i++) items.push({ type: "seg", a: vlerp(a, b, i / n), b: vlerp(a, b, (i + 1) / n), ...extra, k0: i / n, k1: (i + 1) / n, capA: i === 0, capB: i === n - 1 });
  };
  // 옆 방향 (도끼날, 가드 등)
  let side = vcross(dir, V(0, 0, 1));
  if (vlen(side) < 0.2) side = V(0, 1, 0);
  side = vnorm(side);
  const tip = vadd(grip, vmul(dir, L));

  if (style === "blade" || style === "legend" || style === "dagger") {
    const pommel = vadd(grip, vmul(dir, -0.11));
    const guardP = vadd(grip, vmul(dir, 0.07));
    items.push({ type: "seg", a: pommel, b: guardP, color: "#6b4423", width: 6, outline: true });
    items.push({ type: "seg", a: vadd(guardP, vmul(side, 0.1)), b: vadd(guardP, vmul(side, -0.1)), color: style === "legend" ? "#ffd23f" : "#8a6a2a", width: 4.5, outline: true });
    segN(guardP, tip, pieces, { color, width: style === "dagger" ? 4.5 : 5, outline: true, glow: w.glow, legend: style === "legend" });
    if (style === "legend") items.push({ type: "star", c: tip, size: 15, legend: true }, { type: "star", c: guardP, size: 8, gem: true });
    return;
  }
  // 자루가 있는 무기: 손 아래로도 자루가 나와요
  const butt = vadd(grip, vmul(dir, -(w.butt || 0.3)));
  segN(butt, tip, pieces + 1, { color: "#7a5230", width: 4.5, outline: true });
  if (style === "spear") {
    const a = vadd(tip, vmul(side, 0.08)), b = vadd(tip, vmul(side, -0.08)), c = vadd(tip, vmul(dir, 0.24));
    items.push({ type: "poly", pts: [a, c, b], color });
  } else if (style === "hammer") {
    items.push({ type: "box", c: tip, w: 0.3, d: 0.3, h: 0.24, color, tag: "weaponhead" });
  } else if (style === "axe") {
    const a = vadd(tip, vmul(dir, -0.26));
    const b = vadd(vadd(tip, vmul(dir, -0.32)), vmul(side, 0.3));
    const c = vadd(tip, vmul(side, 0.34));
    items.push({ type: "poly", pts: [a, b, c, tip], color, outline: true });
  } else if (style === "scythe") {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push(vadd(vadd(tip, vmul(side, 0.55 * Math.sin(t * 1.4))), vmul(dir, -0.45 * t * t + 0.06 * t)));
    }
    for (let i = 0; i < pts.length - 1; i++) items.push({ type: "seg", a: pts[i], b: pts[i + 1], color, width: 4.5 * (1 - i / 8), outline: true, glow: w.glow, capA: i === 0, capB: i === pts.length - 2 });
  } else if (style === "staff") {
    items.push({ type: "orb", c: vadd(tip, vmul(dir, 0.05)), color: w.orb || "#9fe6ff", power: w.power || 0.4 });
  } else if (style === "pick") {
    const a = vadd(vadd(tip, vmul(side, 0.28)), vmul(dir, -0.12));
    const b = vadd(vadd(tip, vmul(side, -0.28)), vmul(dir, -0.12));
    items.push({ type: "seg", a: tip, b: a, color, width: 4, outline: true }, { type: "seg", a: tip, b: b, color, width: 4, outline: true });
  }
}

// 활 조각들: 세로로 세운 활 + 시위 + (당기고 있으면) 화살
function addBowItems(items, grip, pull, b) {
  const aim = vnorm(b.aim || V(1, 0, 0));
  const up = V(0, 0, 1);
  let side = vnorm(vcross(aim, up));
  const cant = b.back ? 0.9 : 0.18; // 손에 들 땐 살짝, 등에 멜 땐 비스듬히
  const limbUp = vnorm(vadd(up, vmul(side, cant)));
  const half = b.half || 0.36;
  const bend = b.back ? 0.05 : 0.1 + (b.draw || 0) * 0.05;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 4 - 1; // -1 ~ 1
    pts.push(vadd(vadd(grip, vmul(limbUp, t * half)), vmul(aim, -bend * t * t)));
  }
  const bw = b.back ? 3 : 4;
  for (let i = 0; i < pts.length - 1; i++) items.push({ type: "seg", a: pts[i], b: pts[i + 1], color: b.color || "#a0703a", width: bw, outline: true, legend: b.legend, k0: i / 8, k1: (i + 1) / 8, capA: i === 0, capB: i === pts.length - 2 });
  const top = pts[0], bot = pts[pts.length - 1];
  const nock = pull && b.draw > 0.05 ? pull : vadd(grip, vmul(aim, -bend * 1.0));
  items.push({ type: "seg", a: top, b: nock, color: "rgba(255,255,255,0.85)", width: 1.2, thin: true });
  items.push({ type: "seg", a: nock, b: bot, color: "rgba(255,255,255,0.85)", width: 1.2, thin: true });
  if (b.arrow && pull) {
    const tipA = vadd(nock, vmul(aim, 0.62));
    items.push({ type: "seg", a: nock, b: tipA, color: "#6b4423", width: 2.2, outline: false });
    items.push({ type: "star", c: tipA, size: 2.2, arrowTip: b.arrowColor || "#dfe6ee" });
  }
}

// ----- 몸 변환 (돌기, 구르기, 크기) -> 세상 좌표 -----
function rigTransform(e, opts) {
  const S = opts.scale || 1;
  const squash = opts.squash || 1;
  const fx = e.faceX, fy = e.faceY, px = -fy, py = fx;
  const bodyYaw = opts.bodyYaw || 0;
  const roll = opts.roll, curl = opts.curl || 0, hop = opts.hop || 0;
  const C = 0.42;
  const cosR = roll !== undefined ? Math.cos(roll) : 1, sinR = roll !== undefined ? Math.sin(roll) : 0;
  const local = (v) => {
    let p = rotZ(v, bodyYaw);
    if (curl > 0) p = V(p.f * (1 - 0.45 * curl), p.s * (1 - 0.2 * curl), C + (p.z - C) * (1 - 0.5 * curl));
    if (roll !== undefined) p = pitchAbout(p, C, roll);
    return p;
  };
  const world = (v) => {
    const p = local(v);
    return { x: e.x + (fx * p.f + px * p.s) * S, y: e.y + (fy * p.f + py * p.s) * S, z: Math.max(0, (p.z + hop) * S * squash) };
  };
  return { world, local, S, squash, cosR, sinR, roll, curl, bodyYaw };
}

// ----- 그리기 -----
function drawRig(e, look, pose, opts = {}) {
  const built = buildRigItems(e, look, pose, opts);
  const X = rigTransform(e, opts);
  const white = e.flash > 0;
  const shine = (color, w) => {
    if (opts.shimmer === undefined) return color;
    const wave = Math.sin(opts.shimmer * 4 - (w.x + w.y) * 5 - w.z * 7);
    const band = Math.round(Math.pow(Math.max(0, wave), 6) * 12) / 12;
    return mixHex(color, "#ffffff", band * 0.85);
  };

  // 세상 좌표로 바꾸고, 깊이(뒤에서 앞으로) 순서 정하기
  const list = [];
  for (const it of built.items) {
    if (it.type === "box") {
      const w = X.world(it.c);
      let bw = it.w, bd = it.d, bh = it.h;
      if (X.roll !== undefined) {
        const hv = bh * Math.abs(X.cosR) + bw * Math.abs(X.sinR);
        const hw = Math.min(0.42, bw * Math.abs(X.cosR) + bh * Math.abs(X.sinR));
        bh = hv; bw = Math.max(bw, hw); bd = Math.max(bd, hw * 0.9);
      }
      if (X.curl > 0) bh *= 1 - 0.3 * X.curl;
      list.push({ it, w, bw: bw * X.S, bd: bd * X.S, bh: bh * X.S * X.squash, depth: w.x + w.y, z: w.z });
    } else if (it.type === "seg") {
      const a = X.world(it.a), b = X.world(it.b);
      list.push({ it, a, b, depth: (a.x + a.y + b.x + b.y) / 2 + 0.001, z: (a.z + b.z) / 2 });
    } else if (it.type === "poly") {
      const pts = it.pts.map(X.world);
      const d = pts.reduce((s, q) => s + q.x + q.y, 0) / pts.length;
      list.push({ it, pts, depth: d + 0.002, z: 0 });
    } else {
      const w = X.world(it.c);
      list.push({ it, w, depth: w.x + w.y + 0.003, z: w.z });
    }
  }
  list.sort((a, b) => a.depth - b.depth || a.z - b.z);

  const sc = (q) => toScreen(q.x, q.y, q.z);
  for (const L of list) {
    const it = L.it;
    if (it.type === "box") {
      const bx = L.w.x - L.bw / 2, by = L.w.y - L.bd / 2, bz = L.w.z - L.bh / 2;
      const color = white ? "#ffffff" : it.armor ? shine(it.color, L.w) : it.color;
      drawBox(bx, by, Math.max(0, bz), L.bw, L.bd, L.bh, color);
      if (it.tag === "head" && !white) drawHeadDetails(e, look, bx, by, Math.max(0, bz), L.bw, L.bd, L.bh, it, X, opts);
    } else if (it.type === "seg") {
      drawRigSeg(L, it, white);
    } else if (it.type === "poly") {
      fillPoly(L.pts.map(sc), white ? "#ffffff" : it.color);
      if (it.outline) { ctx.strokeStyle = "#1d2a33"; ctx.lineWidth = 1.5; ctx.stroke(); }
    } else if (it.type === "star") {
      const s = sc(L.w);
      if (it.legend) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const pulse = 1 + 0.3 * Math.sin(game.time * 12);
        drawStar(s.x, s.y, it.size * ZOOM * pulse, rainbow(game.time * 200 + 90, 70, 0.9));
        drawStar(s.x, s.y, it.size * 0.45 * ZOOM * pulse, "#ffffff");
        ctx.restore();
      } else if (it.gem) {
        drawStar(s.x, s.y, it.size * ZOOM, rainbow(game.time * 200 + 180, 65));
        drawStar(s.x, s.y, it.size * 0.45 * ZOOM, "#ffffff");
      } else if (it.arrowTip) {
        ctx.fillStyle = it.arrowTip; ctx.beginPath(); ctx.arc(s.x, s.y, it.size * ZOOM, 0, Math.PI * 2); ctx.fill();
      }
    } else if (it.type === "orb") {
      const s = sc(L.w);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const r = (10 + 10 * it.power) * ZOOM;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      g.addColorStop(0, "rgba(230,250,255,0.95)"); g.addColorStop(0.45, it.color); g.addColorStop(1, "rgba(60,120,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  return { built, X };
}

function drawRigSeg(L, it, white) {
  const A = toScreen(L.a.x, L.a.y, L.a.z), B = toScreen(L.b.x, L.b.y, L.b.z);
  const line = (color, width) => {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.lineCap = "butt";
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    // 무기 양 끝만 둥글게
    ctx.fillStyle = color;
    if (it.capA !== false) { ctx.beginPath(); ctx.arc(A.x, A.y, width / 2, 0, Math.PI * 2); ctx.fill(); }
    if (it.capB !== false) { ctx.beginPath(); ctx.arc(B.x, B.y, width / 2, 0, Math.PI * 2); ctx.fill(); }
  };
  if (it.legend) {
    // 무지개 칼날
    const hue = game.time * 200 + (it.k0 || 0) * 300;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [w, a] of [[34, 0.1], [22, 0.16]]) line(rainbow(hue, 60, a), w * ZOOM);
    ctx.restore();
    line(rainbow(hue, 60), 12 * ZOOM);
    line("rgba(255,255,255,0.95)", 4.5 * ZOOM);
    return;
  }
  if (it.glow && !white) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    line(it.glow, 14 * ZOOM);
    ctx.restore();
  }
  if (it.thin) { line(it.color, it.width); return; }
  if (it.outline) line("#1d2a33", (it.width + 3) * ZOOM);
  line(white ? "#ffffff" : it.color, it.width * ZOOM);
}

// 머리카락/투구/눈
function drawHeadDetails(e, look, bx, by, bz, w, d, h, it, X, opts) {
  const S = X.S;
  if (look.helmet) {
    drawBox(bx - 0.03 * S, by - 0.03 * S, bz + h * 0.62, w + 0.06 * S, d + 0.06 * S, h * 0.45, look.helmet);
  } else if (look.hair) {
    drawBox(bx - 0.01 * S, by - 0.01 * S, bz + h - 0.07 * S, w + 0.02 * S, d + 0.02 * S, 0.08 * S, look.hair);
  }
  if (X.roll !== undefined && X.cosR < 0.5) return;
  // 머리가 보는 방향 (몸 돌기 + 고개)
  const yaw = (opts.bodyYaw || 0) + (it.faceYaw || 0);
  const lf = rotZ(V(1, 0, 0), yaw);
  const fx = e.faceX * lf.f + -e.faceY * lf.s, fy = e.faceY * lf.f + e.faceX * lf.s;
  const side = faceSide(fx, fy);
  if (side) {
    const v1 = h * 0.36, v2 = h * 0.55;
    drawOnFace(side, bx, by, bz, w, d, 0.15, 0.35, v1, v2, look.eyes);
    drawOnFace(side, bx, by, bz, w, d, 0.65, 0.85, v1, v2, look.eyes);
  }
}

// 손/칼끝의 세상 좌표 (휘두른 궤적, 반짝이 위치 계산용)
function rigWorldPoint(e, pose, opts, localPoint) {
  return rigTransform(e, opts).world(localPoint);
}
