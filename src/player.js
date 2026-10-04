// ===== 주인공 =====

// 레벨에 따라 강해져요
function playerMaxHp(level) {
  return CONFIG.player.baseHp + Math.floor((level - 1) / CONFIG.level.heartEvery);
}
function damageBonus(level) {
  return 1 + (level - 1) * CONFIG.level.damagePerLevel;
}
// 최고 레벨은 없어요. 30레벨까지는 예전 그대로, 그 뒤로는 레벨마다 조금씩 더 많이 필요해요
// (30레벨 1배 -> 50레벨 약 1.8배 -> 100레벨 약 3.8배: 높을수록 레벨 올리기가 어려워요)
function xpNeeded(level) {
  const base = CONFIG.level.xpFirst + (level - 1) * CONFIG.level.xpGrow;
  const over = Math.max(0, level - CONFIG.level.hardFrom);
  return Math.round(base * (1 + CONFIG.level.hardGrow * over));
}
// 갑옷 하트(머리·바지·세트)까지 더한 최대 하트
function maxHpFor(armor) {
  return playerMaxHp(game.profile.level) + (armor.hearts || 0);
}

// ===== 주인공 여러 명 (둘이 하기: coop.js) =====
// game.player 는 늘 1번 주인공 (카메라·기존 코드). game.players 가 있으면 둘이 하는 중이에요.
function allPlayers() { return game.players && game.players.length ? game.players : game.player ? [game.player] : []; }
function alivePlayers() { return allPlayers().filter((q) => q.hp > 0); }
// 가장 가까운 살아있는 주인공 (모두 쓰러졌으면 1번)
function nearestPlayer(x, y) {
  let best = null, bd = Infinity;
  for (const q of allPlayers()) { if (q.hp <= 0) continue; const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = q; } }
  return best || game.player;
}

// 조작 읽기: 혼자면 지금 그대로, 둘이면 coop.js 가 사람마다 나눠요 (hookFilter "playerInput")
function playerInput(p) {
  const inp = {
    sx: touch.moveX, sy: touch.moveY,
    attackPressed: wasPressed("Space", "KeyJ", "TouchAttack"), attackHeld: isDown("Space", "KeyJ", "TouchAttack"),
    rollPressed: wasPressed("ShiftLeft", "ShiftRight", "KeyK", "TouchRoll"),
    bowHeld: isDown("KeyL", "TouchBow"), arrowTypePressed: wasPressed("Tab", "TouchArrowType"),
    potionPressed: wasPressed("KeyQ", "TouchPotion"),
  };
  if (isDown("KeyA", "ArrowLeft")) inp.sx -= 1;
  if (isDown("KeyD", "ArrowRight")) inp.sx += 1;
  if (isDown("KeyW", "ArrowUp")) inp.sy -= 1;
  if (isDown("KeyS", "ArrowDown")) inp.sy += 1;
  return hookFilter("playerInput", inp, p);
}

function createPlayer(x, y) {
  const armor = currentArmor();
  const maxHp = maxHpFor(armor);
  return {
    x, y, r: 0.3,
    faceX: Math.SQRT1_2, faceY: Math.SQRT1_2, // 보고 있는 방향
    hp: maxHp, maxHp,
    weapon: currentWeapon(),
    armor,
    bow: currentBow(),
    attackTimer: 0, swingTimer: 0, move: null, combo: 0, comboTimer: 0, hitDone: true, lungeTimer: 0, lungeSpeed: 0,
    bowCooldown: 0, bowTimer: 0,
    rollTimer: 0, rollCooldown: 0, rollX: 0, rollY: 0,
    hurtTimer: 0, hurtLean: 0, flash: 0, regenTimer: 0,
    moving: false, walkTime: 0,
  };
}

// 강화하거나 종류를 바꾸면 주인공 장비를 다시 계산해요 (저장도 같이)
function refreshGear() {
  for (const p of allPlayers()) {
    if (hookAny("refreshPlayerGear", p)) continue; // 같이 하기: 친구는 자기 기기 장비 (netplay.js)
    p.weapon = currentWeapon();
    p.bow = currentBow();
    p.armor = currentArmor();
    p.move = null;
    const old = p.maxHp;
    p.maxHp = maxHpFor(p.armor);
    if (p.hp <= 0 && p !== game.player) continue; // 쓰러진 친구(유령)는 되살리지 않아요
    p.hp = Math.max(1, Math.min(p.maxHp, p.hp + Math.max(0, p.maxHp - old)));
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
  p.bowAge = (p.bowAge || 0) + dt;

  // 화면 기준 방향 (오른쪽 +, 아래 +) : 키보드 + 터치 조이스틱
  const inp = playerInput(p);
  const sx = inp.sx, sy = inp.sy;
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
  updateTrail(p, dt);  // anim.js

  // 휘두르는 동안은 천천히 걸어요
  const attacking = p.swingTimer > 0;
  if (p.moving) {
    if (!attacking) { p.faceX = wx; p.faceY = wy; }
    const slowed = p.abSlow > 0 ? 0.55 : 1; // 거미줄·얼음 숨결 등에 맞으면 느려져요
    const speed = cfg.speed * (1 + (Math.min(game.profile.level, CONFIG.level.speedUntil) - 1) * CONFIG.level.speedPerLevel) * (1 + (p.armor.speed || 0)) * power * (attacking ? 0.45 : 1) * slowed;
    moveEntity(p, wx * speed * dt, wy * speed * dt);
    p.walkTime += dt * power;
  }

  // 칼 공격 (연달아 누르면 연속기, 누르고 있어도 이어져요)
  // 조금 일찍 눌러도 기억해뒀다가 바로 다음 동작으로 이어줘요
  p.attackBuffer = (p.attackBuffer || 0) - dt;
  if (inp.attackPressed) p.attackBuffer = 0.35;
  if ((p.attackBuffer > 0 || inp.attackHeld) && p.attackTimer <= 0) {
    p.attackBuffer = 0;
    if (!hookAny("basicAttack", p, inp)) startAttack(p); // 직업마다 기본 공격이 달라요 (classes.js)
  }

  // 구르기 (방향키를 누르고 있으면 그쪽으로)
  if (inp.rollPressed && p.rollCooldown <= 0) {
    p.rollTimer = cfg.rollTime;
    p.rollCooldown = rollCooldownFor(p);
    if (p.moving) { p.faceX = wx; p.faceY = wy; }
    p.rollX = p.faceX; p.rollY = p.faceY;
    p.swingTimer = 0; p.move = null; p.combo = 0;
    spawnDust(p.x, p.y);
    sfx.roll();
  }

  // 활 쏘기 (누르고 있으면 계속)
  if (inp.bowHeld && p.bowCooldown <= 0 && p.swingTimer <= 0) fireBow(p);
  if (inp.arrowTypePressed) cycleArrowType();

  // 물약 마시기
  if (inp.potionPressed && game.scene !== "lobby") drinkPotion(p);

  // 직업 기술 (classes.js)
  hookRun("playerSkills", p, inp, dt);
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
function playerLook(p) { return hookFilter("playerLook", playerLookBase(p), p); }
function playerLookBase(p) {
  const base = { ...CONFIG.colors.player, ...(game.profile.look || {}) };
  const a = game.profile.look && game.profile.look.hideArmor ? {} : p.armor;
  return {
    ...base,
    shirt: a.body || base.shirt, pants: a.legs || base.pants, helmet: a.helmet || null,
    boots: a.boots || null, hand: a.gloves || null, forearm: a.gloves ? shade(a.gloves, 0.9) : null,
  };
}

function drawPlayer(p) {
  const legendArmor = p.armor.legendary;
  if (legendArmor) drawArmorAuraBehind(p); // legendary.js

  // 맞은 뒤 무적일 때는 깜빡깜빡
  if (p.hurtTimer > 0 && p.rollTimer <= 0 && Math.floor(p.hurtTimer * 14) % 2 === 0) return;
  if (hookAny("drawPlayerAs", p)) { hookRun("drawPlayerOver", p); return; } // 곰 변신 등 (classes.js)
  const look = playerLook(p);
  const shimmer = legendArmor || p.armor.shimmerSet ? game.time : undefined;
  const pose = playerPose(p); // anim.js

  if (p.rollTimer > 0) {
    // 진짜 구르기: 손과 무기를 몸에 붙이고 웅크려서 앞으로 한 바퀴
    const t = 1 - p.rollTimer / CONFIG.player.rollTime;
    const curl = Math.sin(Math.min(1, t * 1.15) * Math.PI);
    pose.rh = V(0.24, -0.13, 0.52); pose.lh = V(0.24, 0.13, 0.52);
    pose.bow = null;
    pose.back = [];
    drawRig(p, look, pose, { roll: t * Math.PI * 2, curl: Math.max(0.6, curl), hop: Math.sin(t * Math.PI) * 0.18, shimmer });
    return;
  }
  drawRig(p, look, pose, { bodyYaw: pose.bodyYaw || 0, shimmer });
  drawTrail(p); // anim.js: 칼끝이 지나간 궤적
  hookRun("drawPlayerOver", p);
}
