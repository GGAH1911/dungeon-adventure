// ===== 새 몬스터: 광부 좀비, 바람 정령, 집게 게, 그림자 기사 + 맵 보스 =====
// 몬스터 숫자는 src/monsters.js, 맵은 src/maps.js 에 있어요.
// 여기는 "어떻게 움직이나(EXTRA_BEHAVIORS)"와 "어떻게 생겼나(EXTRA_SHAPES)" 등록표예요.
// monster.js 가 모르는 행동/모양이면 이 표를 찾아봐요.

const EXTRA_BEHAVIORS = {
  // 광부 좀비: 달려와서 때리고, 멀면 가끔 곡괭이를 던져요
  miner(m, p, dist, dt) {
    const def = m.def;
    m.throwTimer = (m.throwTimer === undefined ? 0.4 + Math.random() : m.throwTimer) - dt;
    if (m.state === "throw") {
      m.moving = false;
      faceToward(m, p);
      if (m.stateTimer <= 0) {
        m.state = "chase";
        const d = dist || 1;
        arrows.push({
          x: m.x + ((p.x - m.x) / d) * 0.4, y: m.y + ((p.y - m.y) / d) * 0.4,
          vx: ((p.x - m.x) / d) * def.throwSpeed, vy: ((p.y - m.y) / d) * def.throwSpeed,
          life: 2, damage: m.damage, pick: true, spin: 0,
        });
        sfx.arrow();
      }
      return;
    }
    if (m.throwTimer <= 0 && dist > 2.2 && dist < def.throwRange && lineOfSight(m.x, m.y, p.x, p.y)) {
      m.throwTimer = def.throwCooldown;
      m.state = "throw";
      m.stateTimer = 0.45; // 팔을 드는 예고
      return;
    }
    updateMelee(m, p, dist, dt);
  },

  // 바람 정령: 거리를 두고 지그재그로 날면서 바람 구슬을 쏴요
  wisp(m, p, dist, dt) {
    const def = m.def;
    m.flyT = (m.flyT || Math.random() * 10) + dt;
    const d = dist || 1;
    const ux = (p.x - m.x) / d, uy = (p.y - m.y) / d;
    const zig = Math.sin(m.flyT * 4.5) * 1.2;
    let toward = 0;
    if (dist > def.keepDistance + 1) toward = 1;
    else if (dist < def.keepDistance - 1) toward = -1;
    if (dist > 9 || !lineOfSight(m.x, m.y, p.x, p.y)) chaseMove(m, p, dist, dt);
    else moveWithSeparation(m, ux * toward - uy * zig, uy * toward + ux * zig, dt, m.speed);
    faceToward(m, p);
    if (m.attackTimer <= 0 && dist < def.shootRange && lineOfSight(m.x, m.y, p.x, p.y)) {
      m.attackTimer = def.shootCooldown;
      arrows.push({
        x: m.x + ux * 0.4, y: m.y + uy * 0.4, vx: ux * def.arrowSpeed, vy: uy * def.arrowSpeed,
        life: 3, damage: m.damage, orb: true, wind: true,
      });
      sfx.orb();
    }
  },

  // 집게 게: 몸은 주인공을 보고 옆걸음으로 다가와서 집게로 꽉!
  crab(m, p, dist, dt) {
    const def = m.def;
    m.sideT = (m.sideT || Math.random() * 10) + dt;
    const d = dist || 1;
    const ux = (p.x - m.x) / d, uy = (p.y - m.y) / d;
    if (dist > def.attackRange * 0.9) {
      const side = Math.sin(m.sideT * 2.2) > 0 ? 1 : -1;
      if (dist > 5 || !lineOfSight(m.x, m.y, p.x, p.y)) chaseMove(m, p, dist, dt);
      else moveWithSeparation(m, ux * 0.6 - uy * side, uy * 0.6 + ux * side, dt, m.speed);
    } else m.moving = false;
    faceToward(m, p); // 옆으로 걸어도 얼굴은 주인공 쪽
    m.pinch = Math.max(0, (m.pinch || 0) - dt);
    if (dist < def.attackRange + p.r && m.attackTimer <= 0) {
      m.attackTimer = def.attackCooldown;
      m.pinch = 0.25;
      hurtPlayer(p, m.damage, m);
    }
  },

  // 그림자 기사: 가끔 연기를 피우며 주인공 뒤로 순간이동 -> 바로 공격
  shadow(m, p, dist, dt) {
    const def = m.def;
    m.blinkTimer = (m.blinkTimer === undefined ? 1.5 + Math.random() * 1.5 : m.blinkTimer) - dt;
    if (m.state === "blinkWarn") {
      m.moving = false;
      if (Math.random() < dt * 30) spawnBurst(m.x, m.y, ["#2a1838", "#5a3a7a"], 1);
      if (m.stateTimer <= 0) {
        // 펑! 순간이동
        spawnBurst(m.x, m.y, ["#1a1024", "#3d2a58", "#7a3fd0"], 14);
        m.x = m.blinkTo.x; m.y = m.blinkTo.y;
        spawnBurst(m.x, m.y, ["#1a1024", "#3d2a58", "#7a3fd0"], 14);
        sfx.zap();
        m.blinkTo = null;
        m.state = "blinkStrike";
        m.stateTimer = 0.3;
        faceToward(m, p);
      }
      return;
    }
    if (m.state === "blinkStrike") {
      m.moving = false;
      faceToward(m, p);
      if (m.stateTimer <= 0) {
        m.state = "chase";
        m.attackTimer = def.attackCooldown;
        if (dist < def.attackRange + p.r + 0.3) hurtPlayer(p, m.damage, m);
      }
      return;
    }
    if (m.blinkTimer <= 0 && dist < 8 && lineOfSight(m.x, m.y, p.x, p.y)) {
      // 주인공 등 뒤 빈 자리
      const bx = p.x - p.faceX * 1.1, by = p.y - p.faceY * 1.1;
      const spot = typeof findFreeSpot === "function" ? findFreeSpot(bx, by, m.r, 1.5) : (!hitsWall(bx, by, m.r) ? { x: bx, y: by } : null);
      m.blinkTimer = def.blinkCooldown;
      if (spot) {
        m.blinkTo = spot;
        m.state = "blinkWarn";
        m.stateTimer = def.blinkWarn;
        sfx.fuse();
        return;
      }
    }
    updateMelee(m, p, dist, dt);
  },
};

const EXTRA_SHAPES = {
  // 떠다니는 빛 구슬 + 작은 소용돌이
  wisp(m) {
    const def = m.def;
    const S = m.scaleMul || 1;
    const t = game.time + m.x;
    const z = 0.75 + Math.sin(t * 3) * 0.12;
    const c = toScreen(m.x, m.y, z);
    const white = m.flash > 0;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const R = 26 * ZOOM * S;
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R);
    g.addColorStop(0, white ? "rgba(255,255,255,1)" : "rgba(240,255,255,0.95)");
    g.addColorStop(0.35, "rgba(150,230,255,0.75)");
    g.addColorStop(1, "rgba(120,200,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI * 2); ctx.fill();
    // 소용돌이 바람 줄기
    ctx.strokeStyle = "rgba(220,250,255,0.7)";
    ctx.lineWidth = 2 * ZOOM;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const a = t * 5 + k * 2.1 + i * 0.35;
        const r = (6 + i * 1.3) * ZOOM * S;
        const x = c.x + Math.cos(a) * r, y = c.y + 10 * ZOOM * S + Math.sin(a) * r * 0.45 + i * 0.6;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    // 작은 눈
    const ex = -m.faceY * 5 * ZOOM * S;
    ctx.fillStyle = "#1a3a5a";
    ctx.fillRect(c.x - 6 * ZOOM * S + ex * 0.3, c.y - 3 * ZOOM * S, 3 * ZOOM * S, 4 * ZOOM * S);
    ctx.fillRect(c.x + 3 * ZOOM * S + ex * 0.3, c.y - 3 * ZOOM * S, 3 * ZOOM * S, 4 * ZOOM * S);
  },

  // 납작한 몸 + 집게 2개 + 다리 6개
  crab(m) {
    const def = m.def;
    const S = m.scaleMul || 1;
    const white = m.flash > 0;
    const body = white ? "#ffffff" : def.color;
    const dark = white ? "#ffffff" : shade(def.color, 0.7);
    const fx = m.faceX, fy = m.faceY, px = -fy, py = fx;
    const walk = m.moving ? m.walkTime * 16 : 0;
    const parts = [];
    const add = (f, s, z, w, d, h, c, eyes) => parts.push({ x: m.x + (fx * f + px * s) * S, y: m.y + (fy * f + py * s) * S, z: z * S, w: w * S, d: d * S, h: h * S, c, eyes });
    // 다리
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const lift = Math.max(0, Math.sin(walk + i * 2 + (side > 0 ? 0 : Math.PI))) * 0.06;
      add((i - 1) * 0.14, side * 0.36, lift, 0.07, 0.16, 0.12, dark);
    }
    // 몸
    add(0, 0, 0.1, 0.42, 0.56, 0.18, body);
    // 눈자루
    add(0.16, 0.1, 0.28, 0.05, 0.05, 0.12, dark);
    add(0.16, -0.1, 0.28, 0.05, 0.05, 0.12, dark);
    add(0.16, 0.1, 0.38, 0.07, 0.07, 0.07, white ? "#ffffff" : def.eyes);
    add(0.16, -0.1, 0.38, 0.07, 0.07, 0.07, white ? "#ffffff" : def.eyes);
    // 집게 (공격하면 앞으로 쭉)
    const reach = (m.pinch || 0) > 0 ? 0.18 : 0;
    for (const side of [-1, 1]) {
      add(0.28 + reach, side * 0.3, 0.12, 0.2, 0.16, 0.16, body);
      add(0.4 + reach, side * 0.3 + side * 0.04, 0.12, 0.1, 0.06, 0.12, dark);
    }
    parts.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z);
    for (const q of parts) drawBox(q.x - q.w / 2, q.y - q.d / 2, q.z, q.w, q.d, q.h, q.c);
  },
};

// ----- 투사체 그림: 곡괭이, 바람 구슬 -----
hookOn("drawArrow", (a) => {
  if (a.pick) {
    a.spin = (a.spin || 0) + 0.35;
    const c = toScreen(a.x, a.y, 0.6);
    const L = 14 * ZOOM;
    const ca = Math.cos(a.spin), sa = Math.sin(a.spin);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 3.5 * ZOOM;
    ctx.beginPath(); ctx.moveTo(c.x - ca * L, c.y - sa * L); ctx.lineTo(c.x + ca * L, c.y + sa * L); ctx.stroke();
    ctx.strokeStyle = "#cfd6dd"; ctx.lineWidth = 4 * ZOOM;
    ctx.beginPath();
    ctx.moveTo(c.x + ca * L - sa * 9 * ZOOM, c.y + sa * L + ca * 9 * ZOOM);
    ctx.quadraticCurveTo(c.x + ca * L * 1.25, c.y + sa * L * 1.25, c.x + ca * L + sa * 9 * ZOOM, c.y + sa * L - ca * 9 * ZOOM);
    ctx.stroke();
    return true;
  }
  if (a.wind) {
    const c = toScreen(a.x, a.y, 0.65);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 14 * ZOOM);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.5, "rgba(170,255,230,0.6)");
    g.addColorStop(1, "rgba(120,240,200,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, 14 * ZOOM, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(230,255,250,0.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(c.x, c.y, 9 * ZOOM, game.time * 9, game.time * 9 + 4); ctx.stroke();
    ctx.restore();
    return true;
  }
  return false;
}, 50);

// ----- 그림자 기사 순간이동 예고: 도착할 자리에 보라색 연기 원 -----
hookOn("drawMonsterUnder", (m) => {
  if (m.state === "blinkWarn" && m.blinkTo) {
    const k = 1 - Math.max(0, m.stateTimer) / (m.def.blinkWarn || 0.75);
    const c = toScreen(m.blinkTo.x, m.blinkTo.y, 0.02);
    const e = floorEllipse(0.35 + 0.35 * k);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(190,110,255,${0.4 + 0.5 * k})`;
    ctx.lineWidth = 3 * ZOOM;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(120,50,200,${0.15 + 0.25 * k})`;
    ctx.fill();
    ctx.restore();
  }
}, 50);
hookOn("monsterAlpha", (a, m) => (m.state === "blinkWarn" ? a * (0.55 + 0.45 * Math.sin(game.time * 30)) : a), 50);
// 곡괭이 드는 예고는 anim.js 의 자세(머리 위로 들기)로 보여줘요

// 맵 보스는 이제 보스방에서 나와요 (bossroom.js, BOSS_DEFS)
