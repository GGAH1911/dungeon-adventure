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
// 갑옷 하트와 강화까지 더한 최대 하트
function maxHpFor(armor) {
  return playerMaxHp(game.profile.level) + (armor.hearts || 0) + upgradeLevel("armor", armor.id) * UPGRADE.armorHearts;
}

function createPlayer(x, y) {
  const pr = game.profile;
  const armor = armorById(pr.armor);
  const maxHp = maxHpFor(armor);
  return {
    x, y, r: 0.3,
    faceX: Math.SQRT1_2, faceY: Math.SQRT1_2, // 보고 있는 방향
    hp: maxHp, maxHp,
    weapon: weaponById(pr.weapon),
    armor,
    bow: bowById(pr.bow),
    attackTimer: 0, swingTimer: 0, move: null, combo: 0, comboTimer: 0, hitDone: true, lungeTimer: 0, lungeSpeed: 0,
    bowCooldown: 0, bowTimer: 0,
    rollTimer: 0, rollCooldown: 0, rollX: 0, rollY: 0,
    hurtTimer: 0, hurtLean: 0, flash: 0, regenTimer: 0,
    moving: false, walkTime: 0,
  };
}

// 장비 바꾸기 (저장도 같이)
function equipItem(kind, item) {
  const p = game.player;
  if (kind === "weapon") { game.profile.weapon = item.id; p.weapon = item; p.move = null; }
  else if (kind === "bow") { game.profile.bow = item.id; p.bow = item; }
  else {
    game.profile.armor = item.id; p.armor = item;
    const old = p.maxHp;
    p.maxHp = maxHpFor(item);
    p.hp = Math.max(1, Math.min(p.maxHp, p.hp + (p.maxHp - old)));
  }
  saveProfile();
}

function rollCooldownFor(p) {
  return CONFIG.player.rollCooldown * (1 - (p.armor.roll || 0));
}

function updatePlayer(p, dt) {
  const cfg = CONFIG.player;
  p.attackTimer -= dt;
  p.swingTimer -= dt;
  p.rollCooldown -= dt;
  p.hurtTimer -= dt;
  p.hurtLean = Math.max(0, p.hurtLean - dt);
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
  const len = Math.hypot(wx, wy);
  const power = Math.min(1, Math.hypot(sx, sy));
  p.moving = len > 0.05 && power > 0.15;
  if (len > 0) { wx /= len; wy /= len; }

  // 구르는 중이면 굴러가기만
  if (p.rollTimer > 0) {
    p.rollTimer -= dt;
    moveEntity(p, p.rollX * cfg.rollSpeed * dt, p.rollY * cfg.rollSpeed * dt);
    p.moving = false;
    if (Math.random() < dt * 25) spawnDust(p.x - p.rollX * 0.2, p.y - p.rollY * 0.2);
    return;
  }

  updateAttack(p, dt); // combat.js

  // 휘두르는 동안은 천천히 걸어요
  const attacking = p.swingTimer > 0;
  if (p.moving) {
    if (!attacking) { p.faceX = wx; p.faceY = wy; }
    const speed = cfg.speed * (1 + (game.profile.level - 1) * CONFIG.level.speedPerLevel) * (1 + (p.armor.speed || 0)) * power * (attacking ? 0.45 : 1);
    moveEntity(p, wx * speed * dt, wy * speed * dt);
    p.walkTime += dt * power;
  }

  // 칼 공격 (연달아 누르면 연속기, 누르고 있어도 이어져요)
  // 조금 일찍 눌러도 기억해뒀다가 바로 다음 동작으로 이어줘요
  p.attackBuffer = (p.attackBuffer || 0) - dt;
  if (wasPressed("Space", "KeyJ", "TouchAttack")) p.attackBuffer = 0.35;
  if ((p.attackBuffer > 0 || isDown("Space", "KeyJ", "TouchAttack")) && p.attackTimer <= 0) {
    p.attackBuffer = 0;
    startAttack(p);
  }

  // 구르기 (방향키를 누르고 있으면 그쪽으로)
  if (wasPressed("ShiftLeft", "ShiftRight", "KeyK", "TouchRoll") && p.rollCooldown <= 0) {
    p.rollTimer = cfg.rollTime;
    p.rollCooldown = rollCooldownFor(p);
    if (p.moving) { p.faceX = wx; p.faceY = wy; }
    p.rollX = p.faceX; p.rollY = p.faceY;
    p.swingTimer = 0; p.move = null; p.combo = 0;
    spawnDust(p.x, p.y);
    sfx.roll();
  }

  // 활 쏘기 (누르고 있으면 계속)
  if (isDown("KeyL", "TouchBow") && p.bowCooldown <= 0 && p.swingTimer <= 0) fireBow(p);
  if (wasPressed("Tab", "TouchArrowType")) cycleArrowType();

  // 물약 마시기
  if (wasPressed("KeyQ", "TouchPotion") && game.scene !== "lobby") drinkPotion(p);
}

function drinkPotion(p) {
  const pr = game.profile;
  if (pr.potions <= 0) { showMessage("물약이 없어요", 1); sfx.denied(); return; }
  if (p.hp >= p.maxHp) { showMessage("체력이 가득해요", 1); return; }
  pr.potions--;
  p.hp = Math.min(p.maxHp, p.hp + POTION.heal);
  addFloatText(p.x, p.y, `+${POTION.heal}`, "#ff7bd0", 22);
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(p.x + Math.cos(a) * 0.3, p.y + Math.sin(a) * 0.3, Math.random() * 0.8, { vz: 1.5, life: 0.7, size: 0.7, hue: 320 });
  }
  sfx.potion();
  saveProfile();
}

// 갑옷에 따라 옷 색깔이 바뀌어요 (천 옷이면 옷장에서 고른 색)
function playerLook(p) {
  const base = { ...CONFIG.colors.player, ...(game.profile.look || {}) };
  const a = game.profile.look && game.profile.look.hideArmor ? {} : p.armor;
  return { ...base, shirt: a.body || base.shirt, pants: a.legs || base.pants, helmet: a.helmet || null };
}

// 지금 자세 (손 위치, 기울기)
function playerPose(p) {
  const pose = { lean: 0 };
  if (p.hurtLean > 0) pose.lean = -0.1 * (p.hurtLean / 0.2);
  if (p.bowTimer > 0) {
    pose.leftHand = { f: 0.34, s: -0.06, z: 0.62 };
    pose.rightHand = { f: p.bowTimer > 0.18 ? -0.02 : 0.12, s: 0.08, z: 0.64 };
  } else if (p.move && p.swingTimer > 0) {
    const g = bladeGeom(p);
    pose.rightHand = toLocal(p, g.hand);
    pose.lean = p.move.finisher ? 0.08 : 0.04;
    if (p.move.kind === "overhead" || p.move.kind === "slam") pose.leftHand = { ...pose.rightHand, s: pose.rightHand.s - 0.12 };
  } else {
    pose.rightHand = toLocal(p, bladeGeom(p).hand);
  }
  return pose;
}

function drawPlayer(p) {
  const legendArmor = p.armor.legendary;
  if (legendArmor) drawArmorAuraBehind(p); // legendary.js

  // 맞은 뒤 무적일 때는 깜빡깜빡
  if (p.hurtTimer > 0 && p.rollTimer <= 0 && Math.floor(p.hurtTimer * 14) % 2 === 0) return;
  const look = playerLook(p);
  const shimmer = legendArmor ? game.time : undefined;

  if (p.rollTimer > 0) {
    // 진짜 구르기: 웅크려서 앞으로 한 바퀴
    const t = 1 - p.rollTimer / CONFIG.player.rollTime;
    const curl = Math.sin(Math.min(1, t * 1.15) * Math.PI);
    drawCharacter(p, look, { roll: t * Math.PI * 2, curl: Math.max(0.6, curl), hop: Math.sin(t * Math.PI) * 0.18, shimmer });
    return;
  }
  drawCharacter(p, look, { pose: playerPose(p), shimmer });
  if (p.bowTimer > 0) drawBowInHand(p); // bow.js
  else if (p.weapon.legendary) drawLegendSword(p); // legendary.js
  else drawWeapon(p); // combat.js
}
