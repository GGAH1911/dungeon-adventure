// ===== 전설의 장비 효과 =====
// 무지개 별빛 대검: 무지개 칼날, 한 바퀴 회전 베기, 바닥 충격파, 연쇄 번개
// 태양의 황금 갑옷: 흐르는 빛, 회전하는 빛줄기, 반짝이 별, 던전을 밝히는 빛

let sparkles = [];  // 반짝이 별
let rings = [];     // 바닥 충격파
let bolts = [];     // 번개
const screenFlash = { life: 0, max: 1, rainbow: false };
let sparkleBudget = 0;
let twinkleBudget = 0;

function clearLegendary() {
  sparkles = []; rings = []; bolts = [];
  screenFlash.life = 0;
}

function rainbow(h, light = 60, alpha = 1) {
  return `hsla(${((h % 360) + 360) % 360}, 100%, ${light}%, ${alpha})`;
}

function addSparkle(x, y, z, o = {}) {
  const life = o.life || 0.6;
  sparkles.push({
    x, y, z,
    vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0,
    life, max: life,
    size: o.size || 1,
    hue: o.hue !== undefined ? o.hue : Math.random() * 360,
    gold: !!o.gold,
    gravity: o.gravity || 0,
  });
}

function addRing(x, y, o = {}) {
  const life = o.life || 0.45;
  rings.push({ x, y, r: 0.2, speed: o.speed || 9, life, max: life, hue: o.hue || 0, gold: !!o.gold, delay: o.delay || 0 });
}

function flashScreen(time, rainbowFlash = false) {
  screenFlash.life = time;
  screenFlash.max = time;
  screenFlash.rainbow = rainbowFlash;
}

function swordTip(p) {
  return bladeGeom(p).tip;
}

// ----- 매 프레임 -----
function updateLegendary(dt, p) {
  for (const s of sparkles) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    s.vz -= s.gravity * dt;
    s.vx *= 0.96; s.vy *= 0.96;
    s.life -= dt;
  }
  sparkles = sparkles.filter((s) => s.life > 0);

  for (const r of rings) {
    if (r.delay > 0) { r.delay -= dt; continue; }
    r.r += r.speed * dt;
    r.life -= dt;
  }
  rings = rings.filter((r) => r.life > 0);

  for (const b of bolts) b.life -= dt;
  bolts = bolts.filter((b) => b.life > 0);

  screenFlash.life -= dt;

  if (!p || p.hp <= 0) return;

  // 전설의 검: 칼끝에서 무지개 반짝이가 계속 나와요
  if (p.weapon.legendary && p.rollTimer <= 0) {
    sparkleBudget += dt * (p.swingTimer > 0 ? 160 : 35);
    const tip = swordTip(p);
    while (sparkleBudget >= 1) {
      sparkleBudget -= 1;
      addSparkle(tip.x + (Math.random() - 0.5) * 0.2, tip.y + (Math.random() - 0.5) * 0.2, tip.z + Math.random() * 0.15, {
        vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8, vz: 0.3 + Math.random() * 0.8,
        life: 0.4 + Math.random() * 0.4, size: 0.6 + Math.random() * 0.6, hue: game.time * 300 + Math.random() * 80,
      });
    }
  }

  // 황금 갑옷: 몸 주변에 반짝반짝 별
  if (p.armor.legendary) {
    twinkleBudget += dt * 28;
    while (twinkleBudget >= 1) {
      twinkleBudget -= 1;
      addSparkle(p.x + (Math.random() - 0.5) * 0.7, p.y + (Math.random() - 0.5) * 0.7, 0.1 + Math.random() * 1.1, {
        vz: 0.25, life: 0.35 + Math.random() * 0.35, size: 0.5 + Math.random() * 0.9, gold: true,
      });
    }
    // 걸을 때 발자국에 금가루
    if (p.moving && Math.random() < dt * 20) {
      addSparkle(p.x, p.y, 0.05, {
        vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), vz: 0.6,
        life: 0.5, size: 0.5, gold: true, gravity: 1.5,
      });
    }
  }
}

// ----- 무지개 검 휘두르기 (combat.js 에서 불러요) -----
function legendStrike(p, alreadyHit) {
  const w = p.weapon;
  const hue = game.time * 300;
  addRing(p.x, p.y, { speed: 10, life: 0.4, hue });
  addRing(p.x, p.y, { speed: 6, life: 0.5, hue: hue + 120, delay: 0.06 });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    addSparkle(p.x, p.y, 0.5, {
      vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, vz: 1 + Math.random(),
      life: 0.5, size: 1, hue: hue + i * 13, gravity: 3,
    });
  }
  flashScreen(0.06);

  // 연쇄 번개: 칼이 닿지 않은 몬스터에게 번개가 튀어요
  const targets = monsters
    .filter((z) => z.hp > 0 && z.appearTimer <= 0 && !alreadyHit.includes(z))
    .map((z) => ({ z, d: Math.hypot(z.x - p.x, z.y - p.y) }))
    .filter((t) => t.d < w.chainRange)
    .sort((a, b) => a.d - b.d)
    .slice(0, w.chain);
  let from = { x: p.x, y: p.y };
  for (const t of targets) {
    bolts.push({ ax: from.x, ay: from.y, bx: t.z.x, by: t.z.y, life: 0.3, max: 0.3 });
    damageMonster(t.z, weaponPower(p) * 0.6, from.x, from.y, true);
    from = { x: t.z.x, y: t.z.y };
  }
  if (targets.length > 0) { sfx.thunder(); game.shake = Math.max(game.shake, 0.25); }
}

// 무지개 조각 폭발 (몬스터가 쓰러질 때)
function legendBurst(x, y) {
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3;
    addSparkle(x, y, 0.5, {
      vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 2 + Math.random() * 2,
      life: 0.6 + Math.random() * 0.4, size: 1.1, hue: Math.random() * 360, gravity: 6,
    });
  }
  addRing(x, y, { speed: 4, life: 0.35, hue: Math.random() * 360 });
}

// 황금 갑옷이 공격을 막았을 때
function legendBlock(p) {
  addRing(p.x, p.y, { speed: 5, life: 0.35, gold: true });
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(p.x, p.y, 0.6, { vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: 1, life: 0.4, size: 1, gold: true, gravity: 3 });
  }
}

// 치트 성공 축하!
function legendCelebration(p) {
  sfx.cheat();
  flashScreen(0.8, true);
  game.shake = 0.3;
  for (let i = 0; i < 4; i++) addRing(p.x, p.y, { speed: 7, life: 0.6, hue: i * 90, delay: i * 0.12 });
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 4;
    addSparkle(p.x, p.y, 0.3 + Math.random(), {
      vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 3 + Math.random() * 4,
      life: 0.8 + Math.random() * 0.8, size: 1 + Math.random(), hue: Math.random() * 360,
      gold: Math.random() < 0.4, gravity: 5,
    });
  }
}

// ----- 그리기 -----

// 황금 갑옷: 몸 뒤의 빛 (drawPlayer 에서 캐릭터보다 먼저 그려요)
function drawArmorAuraBehind(p) {
  const t = game.time;
  const c = toScreen(p.x, p.y, 0.6);
  const f = toScreen(p.x, p.y, 0);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // 바닥을 비추는 빛
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(1, 0.5);
  const R = TILE_W * 2.4;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, `rgba(255,210,90,${0.45 + 0.1 * Math.sin(t * 3)})`);
  g.addColorStop(1, "rgba(255,170,40,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // 빙글빙글 도는 빛줄기
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const ang = t * 0.8 + (i * Math.PI * 2) / rays;
    const L = 70 * ZOOM * (0.8 + 0.3 * Math.sin(t * 4 + i * 1.7));
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(ang - 0.07) * L, c.y + Math.sin(ang - 0.07) * L);
    ctx.lineTo(c.x + Math.cos(ang + 0.07) * L, c.y + Math.sin(ang + 0.07) * L);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,225,120,${0.13 + 0.06 * Math.sin(t * 3 + i)})`;
    ctx.fill();
  }

  // 몸 둘레 후광
  const halo = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 48 * ZOOM);
  halo.addColorStop(0, "rgba(255,245,190,0.38)");
  halo.addColorStop(1, "rgba(255,200,80,0)");
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(c.x, c.y, 48 * ZOOM, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// 무지개 별빛 대검
function drawLegendSword(p) {
  const t = game.time;
  const g = bladeGeom(p);
  const hue = t * 200;
  const a = toScreen(g.hand.x, g.hand.y, g.hand.z);
  const b = toScreen(g.tip.x, g.tip.y, g.tip.z);
  const ux = g.tip.x - g.hand.x, uy = g.tip.y - g.hand.y, uz = g.tip.z - g.hand.z;
  const ul = Math.hypot(ux, uy, uz) || 1;
  const grip = toScreen(g.hand.x - (ux / ul) * 0.16, g.hand.y - (uy / ul) * 0.16, g.hand.z - (uz / ul) * 0.16);
  const gx = -p.faceY * 0.2, gy = p.faceX * 0.2;
  const g1 = toScreen(g.hand.x + gx, g.hand.y + gy, g.hand.z);
  const g2 = toScreen(g.hand.x - gx, g.hand.y - gy, g.hand.z);

  // 연속기 무지개 궤적
  drawSwingTrail(p, (k, fade) => rainbow(hue + k * 300, 60, (0.35 + 0.6 * k) * fade), (p.move && p.move.finisher ? 22 : 16) * ZOOM);

  ctx.save();
  ctx.lineCap = "round";
  // 황금 손잡이와 가드
  ctx.strokeStyle = "#7a5200"; ctx.lineWidth = 8 * ZOOM;
  ctx.beginPath(); ctx.moveTo(grip.x, grip.y); ctx.lineTo(a.x, a.y); ctx.stroke();
  ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 5 * ZOOM;
  ctx.beginPath(); ctx.moveTo(grip.x, grip.y); ctx.lineTo(a.x, a.y); ctx.stroke();
  ctx.lineWidth = 6 * ZOOM;
  ctx.beginPath(); ctx.moveTo(g1.x, g1.y); ctx.lineTo(g2.x, g2.y); ctx.stroke();

  // 빛나는 무지개 칼날
  ctx.globalCompositeOperation = "lighter";
  for (const [width, alpha] of [[40, 0.12], [26, 0.2]]) {
    ctx.strokeStyle = rainbow(hue, 60, alpha);
    ctx.lineWidth = width * ZOOM;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
  for (let i = 0; i <= 6; i++) grad.addColorStop(i / 6, rainbow(hue + i * 60, 60));
  ctx.strokeStyle = grad;
  ctx.lineWidth = 15 * ZOOM;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 5 * ZOOM;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

  // 가드 보석, 칼끝 별
  ctx.globalCompositeOperation = "source-over";
  drawStar(a.x, a.y, 9 * ZOOM, rainbow(hue + 180, 65));
  drawStar(a.x, a.y, 4 * ZOOM, "#ffffff");
  ctx.globalCompositeOperation = "lighter";
  const pulse = 1 + 0.3 * Math.sin(t * 12);
  drawStar(b.x, b.y, 16 * ZOOM * pulse, rainbow(hue + 90, 70, 0.9));
  drawStar(b.x, b.y, 7 * ZOOM * pulse, "#ffffff");
  ctx.restore();
}

// 바닥 충격파 (바닥 바로 위에 그려요)
function drawLegendFloor() {
  if (rings.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const r of rings) {
    if (r.delay > 0) continue;
    const c = toScreen(r.x, r.y, 0.02);
    const e = floorEllipse(r.r);
    const k = r.life / r.max;
    ctx.lineWidth = (r.gold ? 6 : 9) * ZOOM * k + 1;
    ctx.strokeStyle = r.gold ? `rgba(255,215,90,${k})` : rainbow(r.hue + (1 - k) * 200, 60, k);
    ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// 어둠 위에 그리는 빛나는 것들 (반짝이, 번개, 후광)
function drawLegendGlow(p) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  if (p && p.hp > 0 && p.armor.legendary) {
    const c = toScreen(p.x, p.y, 0.6);
    const halo = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 70 * ZOOM);
    halo.addColorStop(0, "rgba(255,235,160,0.16)");
    halo.addColorStop(1, "rgba(255,200,80,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(c.x, c.y, 70 * ZOOM, 0, Math.PI * 2); ctx.fill();
  }

  // 번개
  for (const b of bolts) {
    const A = toScreen(b.ax, b.ay, 0.7), B = toScreen(b.bx, b.by, 0.6);
    const k = b.life / b.max;
    const nx = -(B.y - A.y), ny = B.x - A.x;
    const nl = Math.hypot(nx, ny) || 1;
    const pts = [A];
    for (let i = 1; i < 9; i++) {
      const j = (Math.random() - 0.5) * 22 * ZOOM;
      pts.push({ x: A.x + (B.x - A.x) * (i / 9) + (nx / nl) * j, y: A.y + (B.y - A.y) * (i / 9) + (ny / nl) * j });
    }
    pts.push(B);
    for (const [width, color] of [[9, `rgba(120,200,255,${0.5 * k})`], [3, `rgba(255,255,255,${k})`]]) {
      ctx.lineWidth = width * ZOOM;
      ctx.strokeStyle = color;
      ctx.beginPath();
      pts.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
      ctx.stroke();
    }
  }

  // 반짝이 별
  for (const s of sparkles) {
    const q = toScreen(s.x, s.y, s.z);
    const k = s.life / s.max;
    const grow = Math.sin(k * Math.PI); // 커졌다가 작아져요
    const size = 7 * ZOOM * s.size * grow;
    if (size < 0.5) continue;
    const color = s.gold ? `rgba(255,${210 + Math.floor(45 * grow)},120,${0.9})` : rainbow(s.hue, 65, 0.9);
    drawStar(q.x, q.y, size, color);
    drawStar(q.x, q.y, size * 0.45, "rgba(255,255,255,0.95)");
  }
  ctx.restore();
}

// 화면 번쩍
function drawScreenFlash() {
  if (screenFlash.life <= 0) return;
  const k = screenFlash.life / screenFlash.max;
  ctx.save();
  if (screenFlash.rainbow) {
    const g = ctx.createLinearGradient(0, 0, view.w, view.h);
    for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, rainbow(game.time * 400 + i * 60, 65, 0.45 * k));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = `rgba(255,255,255,${0.35 * k})`;
  }
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.restore();
}
