// ===== 주인공 =====

// 레벨에 따라 강해져요
function playerMaxHp(level) {
  return CONFIG.player.baseHp + Math.floor((level - 1) / CONFIG.level.heartEvery);
}
function damageBonus(level) {
  return 1 + (level - 1) * CONFIG.level.damagePerLevel;
}
function xpNeeded(level) {
  return CONFIG.level.xpFirst + (level - 1) * CONFIG.level.xpGrow;
}

function createPlayer(x, y) {
  const pr = game.profile;
  const maxHp = playerMaxHp(pr.level);
  return {
    x, y, r: 0.3,
    faceX: Math.SQRT1_2, faceY: Math.SQRT1_2, // 보고 있는 방향
    hp: maxHp, maxHp,
    weapon: weaponById(pr.weapon),
    armor: armorById(pr.armor),
    bow: bowById(pr.bow),
    attackTimer: 0, swingTimer: 0, bowCooldown: 0, bowTimer: 0,
    rollTimer: 0, rollCooldown: 0, rollX: 0, rollY: 0,
    hurtTimer: 0, flash: 0, regenTimer: 0,
    moving: false, walkTime: 0,
  };
}

// 장비 바꾸기 (저장도 같이)
function equipItem(kind, item) {
  if (kind === "weapon") { game.profile.weapon = item.id; game.player.weapon = item; }
  else if (kind === "bow") { game.profile.bow = item.id; game.player.bow = item; }
  else { game.profile.armor = item.id; game.player.armor = item; }
  saveProfile();
}

function swingDuration(p) {
  return p.weapon.swingTime || 0.16;
}

// 지금 칼이 가리키는 각도
function swordAngle(p) {
  const base = Math.atan2(p.faceY, p.faceX);
  const arc = Math.min(p.weapon.arc, Math.PI);
  if (p.swingTimer > 0) {
    const t = 1 - p.swingTimer / swingDuration(p); // 0 -> 1
    return base - arc + t * 2 * arc;
  }
  return base + 0.9;
}

function updatePlayer(p, dt) {
  const cfg = CONFIG.player;
  p.attackTimer -= dt;
  p.swingTimer -= dt;
  p.rollCooldown -= dt;
  p.hurtTimer -= dt;
  p.flash -= dt;
  p.bowCooldown -= dt;
  p.bowTimer -= dt;

  // 화면 기준 방향 (오른쪽 +, 아래 +) : 키보드 + 터치 조이스틱
  let sx = touch.moveX, sy = touch.moveY;
  if (isDown("KeyA", "ArrowLeft")) sx -= 1;
  if (isDown("KeyD", "ArrowRight")) sx += 1;
  if (isDown("KeyW", "ArrowUp")) sy -= 1;
  if (isDown("KeyS", "ArrowDown")) sy += 1;
  // 화면 방향 -> 세상 방향 (비스듬한 시점이라 바꿔줘야 해요)
  let wx = sx + sy, wy = -sx + sy;
  let len = Math.hypot(wx, wy);
  // 키보드는 늘 최고 속도, 조이스틱은 살짝 밀면 천천히
  const power = Math.min(1, Math.hypot(sx, sy));
  p.moving = len > 0.05 && power > 0.15;
  if (len > 0) { wx /= len; wy /= len; }

  // 구르는 중이면 굴러가기만
  if (p.rollTimer > 0) {
    p.rollTimer -= dt;
    moveEntity(p, p.rollX * cfg.rollSpeed * dt, p.rollY * cfg.rollSpeed * dt);
    p.moving = false;
    return;
  }

  if (p.moving) {
    p.faceX = wx; p.faceY = wy;
    const speed = cfg.speed * (1 + (game.profile.level - 1) * CONFIG.level.speedPerLevel) * power;
    moveEntity(p, wx * speed * dt, wy * speed * dt);
    p.walkTime += dt * power;
  }

  // 칼 공격 (누르고 있으면 계속 휘둘러요)
  if ((wasPressed("Space", "KeyJ", "TouchAttack") || isDown("Space", "KeyJ", "TouchAttack")) && p.attackTimer <= 0) {
    p.attackTimer = p.weapon.cooldown;
    p.swingTimer = swingDuration(p);
    swordAttack(p); // main.js 에 있어요
  }

  // 구르기
  if (wasPressed("ShiftLeft", "ShiftRight", "KeyK", "TouchRoll") && p.rollCooldown <= 0) {
    p.rollTimer = cfg.rollTime;
    p.rollCooldown = cfg.rollCooldown;
    p.rollX = p.faceX; p.rollY = p.faceY;
    spawnDust(p.x, p.y);
    sfx.roll();
  }

  // 활 쏘기 (누르고 있으면 계속)
  if (game.scene === "dungeon" && isDown("KeyL", "TouchBow") && p.bowCooldown <= 0) fireBow(p);

  // 물약 마시기
  if (wasPressed("KeyQ", "TouchPotion") && game.scene === "dungeon") drinkPotion(p);
}

function drinkPotion(p) {
  const pr = game.profile;
  if (pr.potions <= 0) { showMessage("물약이 없어요", 1); sfx.denied(); return; }
  if (p.hp >= p.maxHp) { showMessage("체력이 가득해요", 1); return; }
  pr.potions--;
  p.hp = Math.min(p.maxHp, p.hp + POTION.heal);
  addFloatText(p.x, p.y, `+${POTION.heal}`, "#ff7bd0", 22);
  for (let i = 0; i < 10; i++) spawnBurst(p.x, p.y, ["#ff7bd0", "#ffffff"], 1);
  sfx.potion();
  saveProfile();
}

// 갑옷에 따라 옷 색깔이 바뀌어요
function playerLook(p) {
  const base = CONFIG.colors.player;
  const a = p.armor;
  return { ...base, shirt: a.body || base.shirt, pants: a.legs || base.pants, helmet: a.helmet || null };
}

function drawPlayer(p) {
  const legendArmor = p.armor.legendary;
  if (legendArmor) drawArmorAuraBehind(p); // legendary.js

  // 맞은 뒤 무적일 때는 깜빡깜빡
  if (p.hurtTimer > 0 && Math.floor(p.hurtTimer * 14) % 2 === 0) return;
  const rolling = p.rollTimer > 0;
  drawCharacter(p, playerLook(p), {
    squash: rolling ? 0.55 : 1,
    shimmer: legendArmor ? game.time : undefined,
  });
  if (rolling) return;
  if (p.bowTimer > 0) drawBowInHand(p); // bow.js
  else if (p.weapon.legendary) drawLegendSword(p); // legendary.js
  else drawSword(p);
}

// 보통 칼 그리기
function drawSword(p) {
  const w = p.weapon;
  const angle = swordAngle(p);
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const hand = { x: p.x + dx * 0.25, y: p.y + dy * 0.25 };
  const a = toScreen(hand.x, hand.y, 0.55);
  const b = toScreen(hand.x + dx * w.length, hand.y + dy * w.length, 0.6);
  const h = toScreen(hand.x - dx * 0.12, hand.y - dy * 0.12, 0.54);

  ctx.lineCap = "round";
  if (w.id === "axe") {
    // 도끼: 긴 손잡이 + 끝에 큰 날
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 6 * ZOOM;
    ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const px = -dy, py = dx;
    const tip = { x: hand.x + dx * w.length, y: hand.y + dy * w.length };
    const pts = [
      toScreen(tip.x - dx * 0.25, tip.y - dy * 0.25, 0.6),
      toScreen(tip.x - dx * 0.3 + px * 0.28, tip.y - dy * 0.3 + py * 0.28, 0.6),
      toScreen(tip.x + px * 0.32, tip.y + py * 0.32, 0.6),
      toScreen(tip.x + dx * 0.02, tip.y + dy * 0.02, 0.6),
    ];
    fillPoly(pts, w.color);
    ctx.strokeStyle = "#1d2a33"; ctx.lineWidth = 2; ctx.stroke();
  } else {
    if (w.id === "flame") {
      // 불꽃 대검은 은은하게 타올라요
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,120,30,${0.35 + 0.15 * Math.sin(game.time * 15)})`;
      ctx.lineWidth = 16 * ZOOM;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.restore();
      if (Math.random() < 0.3) spawnBurst(hand.x + dx * w.length * Math.random(), hand.y + dy * w.length * Math.random(), ["#ffb03b", "#ff5a1f"], 1);
    }
    ctx.strokeStyle = "#1d2a33"; ctx.lineWidth = 8 * ZOOM;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = w.color; ctx.lineWidth = 5 * ZOOM;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 6 * ZOOM;
    ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(a.x, a.y); ctx.stroke();
  }

  // 휘두를 때 하얀 궤적
  if (p.swingTimer > 0) {
    const base = Math.atan2(p.faceY, p.faceX);
    const arc = Math.min(w.arc, Math.PI);
    const t = 1 - p.swingTimer / swingDuration(p);
    const R = w.range * 0.8;
    ctx.strokeStyle = w.id === "flame" ? `rgba(255,150,60,${0.8 * (1 - t * 0.5)})` : `rgba(255,255,255,${0.7 * (1 - t * 0.5)})`;
    ctx.lineWidth = 7 * ZOOM;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const ang = base - arc + (i / 14) * 2 * arc * t;
      const s = toScreen(p.x + Math.cos(ang) * R, p.y + Math.sin(ang) * R, 0.5);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
  }
}
