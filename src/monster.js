// ===== 몬스터: 움직이기, 공격하기, 그리기 =====
// 몬스터 숫자(체력, 속도 등)는 src/monsters.js 에 있어요.

let monsters = [];
let arrows = [];

function createMonster(type, x, y, mapDef) {
  const def = MONSTERS[type];
  const hpMul = mapDef ? mapDef.hpMul : 1;
  const dmgMul = mapDef ? mapDef.damageMul : 1;
  const size = def.size || 1;
  return {
    type, def, x, y,
    r: 0.3 * Math.max(0.7, size),
    faceX: Math.SQRT1_2, faceY: Math.SQRT1_2,
    hp: def.hp * hpMul, maxHp: def.hp * hpMul,
    damage: def.damage * dmgMul,
    speed: def.speed * (0.9 + Math.random() * 0.2),
    attackTimer: 0.5 + Math.random(),
    stunTimer: 0, knockX: 0, knockY: 0, flash: 0,
    appearTimer: 0,
    aggro: false,
    state: "chase", stateTimer: 0, leapX: 0, leapY: 0, hitThisLeap: false,
    wanderTimer: 0, wanderX: 0, wanderY: 0,
    moving: false, walkTime: Math.random() * 10,
  };
}

// 맵의 방마다 몬스터 배치 (첫 방은 비워둬요)
function spawnMonsters(mapDef, rand) {
  monsters = [];
  const table = Object.entries(mapDef.monsters);
  const total = table.reduce((s, [, w]) => s + w, 0);
  const rooms = world.rooms.slice(1);
  for (let i = 0; i < mapDef.count; i++) {
    let roll = rand() * total, type = table[0][0];
    for (const [t, w] of table) { roll -= w; if (roll <= 0) { type = t; break; } }
    const room = rooms[i % rooms.length];
    const spot = randomSpotInRoom(room, rand);
    monsters.push(createMonster(type, spot.x, spot.y, mapDef));
  }
}

// ----- 움직임 도우미 -----
function chaseMove(m, p, dist, dt, speedMul = 1) {
  let mx = 0, my = 0;
  const step = dist > 1.5 ? nextStepToward(m.x, m.y) : null;
  if (step) {
    const sx = step.x - m.x, sy = step.y - m.y, sd = Math.hypot(sx, sy) || 1;
    mx = sx / sd; my = sy / sd;
  } else {
    mx = (p.x - m.x) / (dist || 1); my = (p.y - m.y) / (dist || 1);
  }
  moveWithSeparation(m, mx, my, dt, m.speed * speedMul);
}

function moveWithSeparation(m, mx, my, dt, speed) {
  // 다른 몬스터랑 겹치지 않게 살짝 밀기
  for (const o of monsters) {
    if (o === m) continue;
    const ox = m.x - o.x, oy = m.y - o.y;
    const minD = m.r + o.r + 0.05;
    if (Math.abs(ox) > minD || Math.abs(oy) > minD) continue;
    const d = Math.hypot(ox, oy);
    if (d > 0 && d < minD) { mx += (ox / d) * 0.8; my += (oy / d) * 0.8; }
  }
  const len = Math.hypot(mx, my);
  m.moving = len > 0.1;
  if (!m.moving) return;
  moveEntity(m, (mx / len) * speed * dt, (my / len) * speed * dt);
  m.faceX = mx / len; m.faceY = my / len;
  m.walkTime += dt;
}

function faceToward(m, p) {
  const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
  m.faceX = dx / d; m.faceY = dy / d;
}

// ----- 매 프레임 -----
function updateMonster(m, p, dt) {
  const def = m.def;
  m.flash -= dt;
  m.attackTimer -= dt;
  m.stateTimer -= dt;
  if (m.appearTimer > 0) { m.appearTimer -= dt; return; }

  // 칼에 맞고 밀려나는 중
  if (m.stunTimer > 0) {
    m.stunTimer -= dt;
    const k = def.heavy ? 0.3 : 1;
    moveEntity(m, m.knockX * dt * k, m.knockY * dt * k);
    m.knockX *= 0.85; m.knockY *= 0.85;
    m.moving = false;
    if (m.state === "leap" || m.state === "windup") m.state = "chase";
    return;
  }

  const dx = p.x - m.x, dy = p.y - m.y;
  const dist = Math.hypot(dx, dy);

  // 주인공을 알아채기
  if (!m.aggro && p.hp > 0 && dist < CONFIG.monster.aggroRange && (dist < 3 || lineOfSight(m.x, m.y, p.x, p.y))) {
    m.aggro = true;
  }
  if (!m.aggro || p.hp <= 0) {
    // 어슬렁어슬렁
    m.wanderTimer -= dt;
    if (m.wanderTimer <= 0) {
      m.wanderTimer = 1.5 + Math.random() * 2.5;
      const a = Math.random() * Math.PI * 2;
      const go = Math.random() < 0.6;
      m.wanderX = go ? Math.cos(a) : 0; m.wanderY = go ? Math.sin(a) : 0;
    }
    if (m.wanderX || m.wanderY) moveWithSeparation(m, m.wanderX, m.wanderY, dt, m.speed * 0.35);
    else m.moving = false;
    return;
  }

  switch (def.behavior) {
    case "pounce": updatePouncer(m, p, dist, dt); break;
    case "archer": updateArcher(m, p, dist, dt); break;
    case "exploder": updateExploder(m, p, dist, dt); break;
    default: updateMelee(m, p, dist, dt);
  }
}

function updateMelee(m, p, dist, dt) {
  const def = m.def;
  if (dist > def.attackRange * 0.85) chaseMove(m, p, dist, dt);
  else { m.moving = false; faceToward(m, p); }
  if (dist < def.attackRange + p.r && m.attackTimer <= 0) {
    m.attackTimer = def.attackCooldown;
    m.swing = 0.25;
    if (def.heavy) {
      // 골렘: 땅을 쾅!
      addRing(m.x + m.faceX * 0.6, m.y + m.faceY * 0.6, { speed: 4, life: 0.35, gold: false, hue: 30 });
      spawnDust(m.x + m.faceX * 0.6, m.y + m.faceY * 0.6);
      game.shake = Math.max(game.shake, 0.2);
      sfx.slam();
    }
    hurtPlayer(p, m.damage, m);
  }
}

// 거미: 다가와서 웅크렸다가 점프!
function updatePouncer(m, p, dist, dt) {
  const def = m.def;
  if (m.state === "windup") {
    m.moving = false;
    faceToward(m, p);
    if (m.stateTimer <= 0) {
      m.state = "leap"; m.stateTimer = 0.32; m.hitThisLeap = false;
      const d = dist || 1;
      m.leapX = (p.x - m.x) / d; m.leapY = (p.y - m.y) / d;
      sfx.pounce();
    }
    return;
  }
  if (m.state === "leap") {
    moveEntity(m, m.leapX * 8 * dt, m.leapY * 8 * dt);
    m.moving = false;
    if (!m.hitThisLeap && dist < 0.65) { m.hitThisLeap = true; hurtPlayer(p, m.damage, m); }
    if (m.stateTimer <= 0) { m.state = "chase"; m.attackTimer = def.attackCooldown; }
    return;
  }
  if (dist < def.pounceRange && m.attackTimer <= 0 && lineOfSight(m.x, m.y, p.x, p.y)) {
    m.state = "windup"; m.stateTimer = 0.4; // 웅크리는 걸 보면 구르기로 피하세요!
    return;
  }
  if (dist > 1.2) chaseMove(m, p, dist, dt);
  else {
    // 쉬는 동안은 옆으로 살금살금
    moveWithSeparation(m, -(p.y - m.y), p.x - m.x, dt, m.speed * 0.4);
    faceToward(m, p);
  }
}

// 해골 궁수: 멀리서 활 쏘기
function updateArcher(m, p, dist, dt) {
  const def = m.def;
  const see = lineOfSight(m.x, m.y, p.x, p.y);
  if (m.state === "aim") {
    m.moving = false;
    faceToward(m, p);
    if (m.stateTimer <= 0) {
      m.state = "chase";
      m.attackTimer = def.shootCooldown;
      const d = dist || 1;
      // 화살 발사!
      arrows.push({
        x: m.x + ((p.x - m.x) / d) * 0.4, y: m.y + ((p.y - m.y) / d) * 0.4,
        vx: ((p.x - m.x) / d) * def.arrowSpeed, vy: ((p.y - m.y) / d) * def.arrowSpeed,
        life: 2.5, damage: m.damage,
      });
      sfx.arrow();
    }
    return;
  }
  if (!see || dist > def.shootRange) {
    chaseMove(m, p, dist, dt);
  } else if (dist < 2.5) {
    // 너무 가까우면 뒤로 도망
    moveWithSeparation(m, -(p.x - m.x) / dist, -(p.y - m.y) / dist, dt, m.speed);
    faceToward(m, p);
  } else {
    m.moving = false;
    faceToward(m, p);
  }
  if (see && dist <= def.shootRange && m.attackTimer <= 0) {
    m.state = "aim"; m.stateTimer = 0.55;
  }
}

// 펑펑이: 가까이 오면 부풀다가 펑!
function updateExploder(m, p, dist, dt) {
  const def = m.def;
  if (m.state === "fuse") {
    m.moving = false;
    if (m.stateTimer <= 0) explodeMonster(m, p);
    return;
  }
  chaseMove(m, p, dist, dt);
  if (dist < 1.3) {
    m.state = "fuse";
    m.stateTimer = def.fuse;
    sfx.fuse();
  }
}

function explodeMonster(m, p) {
  const def = m.def;
  m.hp = 0;
  m.exploded = true;
  game.shake = 0.45;
  sfx.boom();
  addRing(m.x, m.y, { speed: 8, life: 0.35, hue: 30 });
  addRing(m.x, m.y, { speed: 5, life: 0.45, hue: 10, delay: 0.05 });
  spawnBurst(m.x, m.y, ["#ff9a3b", "#ffd23f", "#555555", def.color], 30);
  flashScreen(0.12);
  if (p.hp > 0 && Math.hypot(p.x - m.x, p.y - m.y) < def.blastRadius) hurtPlayer(p, m.damage, m);
  // 옆에 있는 몬스터도 휘말려요
  for (const o of monsters) {
    if (o === m || o.hp <= 0) continue;
    if (Math.hypot(o.x - m.x, o.y - m.y) < def.blastRadius) damageMonster(o, 3, m.x, m.y, false);
  }
}

// ----- 화살 -----
function updateArrows(p, dt) {
  for (const a of arrows) {
    a.x += a.vx * dt; a.y += a.vy * dt;
    a.life -= dt;
    if (isWall(Math.floor(a.x), Math.floor(a.y))) { a.life = 0; spawnDust(a.x - a.vx * 0.02, a.y - a.vy * 0.02); continue; }
    if (p.hp > 0 && Math.hypot(p.x - a.x, p.y - a.y) < 0.4) {
      if (p.rollTimer > 0) continue; // 구르면 피해요!
      a.life = 0;
      hurtPlayer(p, a.damage, { x: a.x - a.vx, y: a.y - a.vy });
    }
    // 전설의 검을 휘두르면 화살도 부숴요
    if (p.weapon.legendary && p.swingTimer > 0 && Math.hypot(p.x - a.x, p.y - a.y) < p.weapon.range) {
      a.life = 0;
      legendBurst(a.x, a.y);
    }
  }
  arrows = arrows.filter((a) => a.life > 0);
}

function drawArrow(a) {
  const sp = Math.hypot(a.vx, a.vy) || 1;
  const ux = a.vx / sp, uy = a.vy / sp;
  const tail = toScreen(a.x - ux * 0.45, a.y - uy * 0.45, 0.6);
  const tip = toScreen(a.x, a.y, 0.6);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5b3a1e"; ctx.lineWidth = 3 * ZOOM;
  ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  ctx.fillStyle = "#cfd6dd";
  ctx.beginPath(); ctx.arc(tip.x, tip.y, 2.5 * ZOOM, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(tail.x - 2, tail.y - 2, 4, 4);
}

// ----- 그리기 -----
function drawMonster(m) {
  const def = m.def;
  ctx.save();
  if (m.appearTimer > 0) ctx.globalAlpha = 1 - m.appearTimer / 0.6;
  switch (def.shape) {
    case "spider": drawSpider(m); break;
    case "boomer": drawBoomer(m); break;
    case "slime": drawSlime(m); break;
    default: {
      drawCharacter(m, def.look, { arms: def.armsForward ? "forward" : "side", scale: def.size || 1 });
      if (def.behavior === "archer") drawBow(m);
      if (def.heavy && !m.flash) {
        // 골렘 눈이 빛나요
        const s = toScreen(m.x, m.y, 1.1 * (def.size || 1));
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(255,150,60,0.35)";
        ctx.beginPath(); ctx.arc(s.x, s.y, 14 * ZOOM, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }
  ctx.restore();

  // 다친 몬스터는 머리 위에 체력 막대
  if (m.hp < m.maxHp && m.hp > 0) {
    const top = def.shape === "slime" ? 0.7 * (def.size || 1) : def.shape === "spider" ? 0.7 : 1.3 * (def.size || 1);
    const s = toScreen(m.x, m.y, top + 0.1);
    const w = 24 * ZOOM * Math.max(1, def.size || 1), h = 5;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(s.x - w / 2 - 1, s.y - 1, w + 2, h + 2);
    ctx.fillStyle = "#e23b3b";
    ctx.fillRect(s.x - w / 2, s.y, w * (m.hp / m.maxHp), h);
  }
}

function drawBow(m) {
  const px = -m.faceY, py = m.faceX;
  const hx = m.x + m.faceX * 0.3 + px * 0.15, hy = m.y + m.faceY * 0.3 + py * 0.15;
  const a = toScreen(hx + px * 0.3, hy + py * 0.3, 0.6);
  const b = toScreen(hx - px * 0.3, hy - py * 0.3, 0.6);
  const bend = m.state === "aim" ? 0.35 : 0.2;
  const c = toScreen(hx + m.faceX * bend, hy + m.faceY * bend, 0.6);
  ctx.strokeStyle = "#7a5230"; ctx.lineWidth = 3 * ZOOM;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}

function drawSpider(m) {
  const def = m.def;
  const fx = m.faceX, fy = m.faceY, px = -fy, py = fx;
  let z0 = 0.12;
  if (m.state === "windup") z0 = 0.04;
  if (m.state === "leap") z0 = 0.12 + Math.sin((1 - m.stateTimer / 0.32) * Math.PI) * 0.5;
  const white = m.flash > 0;
  const color = white ? "#ffffff" : def.color;
  const legColor = white ? "#ffffff" : shade(def.color, 0.7);
  const walk = m.moving ? m.walkTime * 14 : 0;

  // 다리 8개
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 3 * ZOOM;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const along = (i - 1.5) * 0.12;
      const swing = Math.sin(walk + i * 1.6 + (side > 0 ? 0 : Math.PI)) * 0.08;
      const bx = m.x + fx * along, by = m.y + fy * along;
      const kx = bx + px * side * 0.28 + fx * (along * 0.8 + swing), ky = by + py * side * 0.28 + fy * (along * 0.8 + swing);
      const tx = bx + px * side * 0.5 + fx * (along * 1.6 + swing), ty = by + py * side * 0.5 + fy * (along * 1.6 + swing);
      const A = toScreen(bx, by, z0 + 0.12), K = toScreen(kx, ky, z0 + 0.32), T = toScreen(tx, ty, Math.max(0, z0 - 0.1));
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(K.x, K.y); ctx.lineTo(T.x, T.y); ctx.stroke();
    }
  }
  // 몸통 (뒤쪽 큰 배 + 앞쪽 머리)
  const ax = m.x - fx * 0.13, ay = m.y - fy * 0.13;
  const hx = m.x + fx * 0.2, hy = m.y + fy * 0.2;
  const parts = [
    { x: ax - 0.2, y: ay - 0.2, z: z0, w: 0.4, d: 0.4, h: 0.26, c: color, head: false },
    { x: hx - 0.13, y: hy - 0.13, z: z0 + 0.03, w: 0.26, d: 0.26, h: 0.2, c: white ? "#ffffff" : shade(def.color, 1.2), head: true },
  ].sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const q of parts) {
    drawBox(q.x, q.y, q.z, q.w, q.d, q.h, q.c);
    if (q.head && !white) {
      const side = faceSide(fx, fy);
      if (side) {
        drawOnFace(side, q.x, q.y, q.z, q.w, q.d, 0.12, 0.35, 0.09, 0.15, def.eyes);
        drawOnFace(side, q.x, q.y, q.z, q.w, q.d, 0.65, 0.88, 0.09, 0.15, def.eyes);
      }
    }
  }
}

function drawBoomer(m) {
  const def = m.def;
  let s = 1;
  let white = m.flash > 0;
  if (m.state === "fuse") {
    const t = 1 - m.stateTimer / def.fuse;
    s = 1 + t * 0.3;
    if (Math.floor(game.time * (6 + t * 18)) % 2 === 0) white = true;
  }
  const c = white ? "#ffffff" : def.color;
  const dark = white ? "#ffffff" : shade(def.color, 0.7);
  const walk = m.moving ? Math.sin(m.walkTime * 12) * 0.05 : 0;
  // 발 4개
  for (const [ox, oy] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) {
    drawBox(m.x + ox * s - 0.07 * s, m.y + oy * s - 0.07 * s + walk * Math.sign(ox), 0, 0.14 * s, 0.14 * s, 0.22 * s, dark);
  }
  // 몸통과 머리
  drawBox(m.x - 0.17 * s, m.y - 0.17 * s, 0.22 * s, 0.34 * s, 0.34 * s, 0.6 * s, c);
  const hx = m.x - 0.2 * s, hy = m.y - 0.2 * s, hz = 0.82 * s;
  drawBox(hx, hy, hz, 0.4 * s, 0.4 * s, 0.38 * s, c);
  if (!white) {
    // 머리 위 심지 (불이 붙으면 반짝여요)
    drawBox(m.x - 0.03 * s, m.y - 0.03 * s, hz + 0.38 * s, 0.06 * s, 0.06 * s, 0.16 * s, "#5b3a1e");
    if (m.state === "fuse") {
      const t = toScreen(m.x, m.y, hz + 0.6 * s);
      drawStar(t.x, t.y, (6 + Math.random() * 5) * ZOOM, "#ffd23f");
    }
    // 동그란 눈과 놀란 입
    const side = faceSide(m.faceX, m.faceY);
    if (side) {
      const W = 0.4 * s;
      drawOnFace(side, hx, hy, hz, W, W, 0.1, 0.42, 0.18 * s, 0.33 * s, "#ffffff");
      drawOnFace(side, hx, hy, hz, W, W, 0.58, 0.9, 0.18 * s, 0.33 * s, "#ffffff");
      drawOnFace(side, hx, hy, hz, W, W, 0.2, 0.34, 0.2 * s, 0.29 * s, "#222222");
      drawOnFace(side, hx, hy, hz, W, W, 0.68, 0.82, 0.2 * s, 0.29 * s, "#222222");
      drawOnFace(side, hx, hy, hz, W, W, 0.4, 0.6, 0.04 * s, 0.13 * s, "#7a1f1f");
    }
  }
}

function drawSlime(m) {
  const def = m.def;
  const s = def.size || 1;
  const hop = m.moving ? Math.abs(Math.sin(m.walkTime * 6)) * 0.3 * s : 0;
  const squash = m.moving && hop < 0.03 ? 0.85 : 1;
  const white = m.flash > 0;
  const w = 0.5 * s, h = 0.45 * s * squash;
  const x = m.x - w / 2, y = m.y - w / 2;
  // 속에 있는 진한 덩어리
  drawBox(m.x - w * 0.22, m.y - w * 0.22, hop + h * 0.25, w * 0.44, w * 0.44, h * 0.44, white ? "#ffffff" : shade(def.color, 0.55));
  // 반투명 겉
  ctx.save();
  ctx.globalAlpha *= 0.72;
  drawBox(x, y, hop, w, w, h, white ? "#ffffff" : def.color);
  ctx.restore();
  if (!white) {
    const side = faceSide(m.faceX, m.faceY);
    if (side) {
      drawOnFace(side, x, y, hop, w, w, 0.18, 0.36, h * 0.55, h * 0.72, "#163d1a");
      drawOnFace(side, x, y, hop, w, w, 0.64, 0.82, h * 0.55, h * 0.72, "#163d1a");
    }
  }
}
