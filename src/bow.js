// ===== 활과 화살 (주인공) =====
// 터치: "활" 버튼 (누르고 있으면 계속 쏴요)   키보드: L
// 가장 가까운 몬스터를 저절로 겨냥해요. 화살은 가게에서 사거나 몬스터가 떨어뜨려요.

let shots = [];

// 쏠 방향: 가까이 보이는 몬스터가 있으면 그쪽, 없으면 보고 있는 쪽
function bowAim(p) {
  let best = null, bestD = CONFIG.player.autoAimRange;
  for (const m of monsters) {
    if (m.appearTimer > 0 || m.hp <= 0) continue;
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < bestD && lineOfSight(p.x, p.y, m.x, m.y)) { bestD = d; best = m; }
  }
  if (!best) return { x: p.faceX, y: p.faceY };
  // 움직이는 몬스터는 조금 앞을 겨냥
  const lead = bestD / p.bow.speed;
  const tx = best.x + (best.moving ? best.faceX * best.speed * lead : 0);
  const ty = best.y + (best.moving ? best.faceY * best.speed * lead : 0);
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
}

function fireBow(p) {
  const bow = p.bow;
  const pr = game.profile;
  if (!bow.infinite && pr.arrows <= 0) {
    if (!p.noArrowWarned) { showMessage("화살이 없어요! 가게에서 사거나 몬스터한테서 주워요", 1.8); p.noArrowWarned = true; }
    sfx.bowEmpty();
    p.bowCooldown = 0.4;
    return;
  }
  p.noArrowWarned = false;
  const aim = bowAim(p);
  p.faceX = aim.x; p.faceY = aim.y;
  p.bowCooldown = bow.cooldown;
  p.bowTimer = 0.28;
  if (!bow.infinite) pr.arrows--;

  const n = bow.multishot || 1;
  const spread = n > 1 ? 0.22 : 0;
  const base = Math.atan2(aim.y, aim.x);
  const dmg = bow.damage * damageBonus(pr.level);
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * spread;
    shots.push({
      x: p.x + Math.cos(a) * 0.35, y: p.y + Math.sin(a) * 0.35,
      vx: Math.cos(a) * bow.speed, vy: Math.sin(a) * bow.speed,
      life: 1.4, damage: dmg, pierce: bow.pierce || 0, hit: [],
      legendary: !!bow.legendary, hue: Math.random() * 360,
    });
  }
  if (bow.legendary) { sfx.legendBow(); flashScreen(0.05); }
  else sfx.bowShot();
}

function updateShots(dt) {
  for (const s of shots) {
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.life -= dt;
    if (isWall(Math.floor(s.x), Math.floor(s.y))) {
      s.life = 0;
      if (s.legendary) legendBurst(s.x, s.y); else spawnDust(s.x, s.y);
      continue;
    }
    for (const m of monsters) {
      if (m.hp <= 0 || m.appearTimer > 0 || s.hit.includes(m)) continue;
      if (Math.hypot(m.x - s.x, m.y - s.y) > m.r + 0.2) continue;
      s.hit.push(m);
      damageMonster(m, s.damage, s.x - s.vx * 0.05, s.y - s.vy * 0.05, s.legendary, 0.5);
      if (s.legendary) legendBurst(s.x, s.y);
      if (s.pierce-- <= 0) { s.life = 0; break; }
    }
    // 전설의 화살은 무지개 꼬리
    if (s.legendary && Math.random() < 0.8) {
      addSparkle(s.x, s.y, 0.6, { life: 0.35, size: 0.7, hue: s.hue + game.time * 400, vz: 0.2 });
    }
  }
  shots = shots.filter((s) => s.life > 0);
}

function drawShot(s) {
  const sp = Math.hypot(s.vx, s.vy) || 1;
  const ux = s.vx / sp, uy = s.vy / sp;
  const tail = toScreen(s.x - ux * 0.5, s.y - uy * 0.5, 0.6);
  const tip = toScreen(s.x, s.y, 0.6);
  ctx.lineCap = "round";
  if (s.legendary) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y);
    g.addColorStop(0, rainbow(s.hue + game.time * 400, 60, 0));
    g.addColorStop(1, rainbow(s.hue + game.time * 400 + 120, 65, 1));
    ctx.strokeStyle = g; ctx.lineWidth = 9 * ZOOM;
    ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    ctx.restore();
    drawStar(tip.x, tip.y, 8 * ZOOM, "#ffffff");
    return;
  }
  ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 3 * ZOOM;
  ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  ctx.fillStyle = "#dfe6ee";
  ctx.beginPath(); ctx.arc(tip.x, tip.y, 2.8 * ZOOM, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(tail.x - 2.5, tail.y - 2.5, 5, 5);
}

// 쏘는 순간 손에 활이 보여요
function drawBowInHand(p) {
  const bow = p.bow;
  const px = -p.faceY, py = p.faceX;
  const hx = p.x + p.faceX * 0.32, hy = p.y + p.faceY * 0.32;
  const a = toScreen(hx + px * 0.34, hy + py * 0.34, 0.6);
  const b = toScreen(hx - px * 0.34, hy - py * 0.34, 0.6);
  const pull = p.bowTimer > 0.18 ? -0.15 : 0.05;
  const c = toScreen(hx + p.faceX * 0.25, hy + p.faceY * 0.25, 0.6);
  const sPt = toScreen(hx + p.faceX * pull, hy + p.faceY * pull, 0.6);
  ctx.lineCap = "round";
  ctx.strokeStyle = bow.legendary ? rainbow(game.time * 300, 65) : bow.color;
  ctx.lineWidth = 4 * ZOOM;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(sPt.x, sPt.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}
