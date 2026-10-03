// ===== 게임 본체: 장면 바꾸기, 싸우기, 레벨, 그리기 =====
// 장면(scene): "title" 처음 화면 -> "lobby" 캠프 <-> "dungeon" 던전
// 창(overlay): "shop" 가게, "maps" 모험 지도, "menu" 메뉴, "result" 결과

const game = {
  scene: "title",
  overlay: null,
  profile: loadProfile(),
  player: null,
  mapDef: null,
  run: null,          // 이번 던전에서 모은 것
  result: null,
  endTimer: 0,
  nearNpc: null,
  message: "", messageTimer: 0, messageRainbow: false, messageColor: null,
  shake: 0,
  time: 0,
  confirmReset: false,
};

function playing() {
  return (game.scene === "lobby" || game.scene === "dungeon") && !game.overlay && !cheatOpen;
}

function showMessage(str, time = 2, rainbowText = false, color = null) {
  game.message = str;
  game.messageTimer = time;
  game.messageRainbow = rainbowText;
  game.messageColor = color;
}

function resetEffects() {
  particles = []; pickups = []; floatTexts = []; arrows = []; monsters = []; shots = [];
  clearLegendary();
  pathFrom = { x: -1, y: -1 };
  game.endTimer = 0;
  game.nearNpc = null;
}

function placePlayer() {
  game.player = createPlayer(world.start.x, world.start.y);
  camera.x = game.player.x;
  camera.y = game.player.y;
}

// ----- 장면 바꾸기 -----
function enterLobby(msg) {
  resetEffects();
  buildLobby();
  game.scene = "lobby";
  game.overlay = null;
  game.mapDef = null;
  placePlayer();
  game.player.faceX = -Math.SQRT1_2; game.player.faceY = -Math.SQRT1_2;
  saveProfile();
  if (msg) showMessage(msg, 2);
}

function startDungeon(def, level) {
  resetEffects();
  const rand = generateDungeon(def);
  spawnMonsters(def, level, rand);
  game.scene = "dungeon";
  game.overlay = null;
  game.mapDef = def;
  game.mapLevel = level;
  placePlayer();
  game.run = { kills: 0, emeralds: 0, xp: 0, levels: 0, arrows: 0 };
  sfx.wave();
  showMessage(`${def.name} Lv ${level}  ·  몬스터를 모두 물리치세요!`, 3);
}

// ----- 싸우기 -----
// 칼 휘두르기 (player.js 에서 불러요)
function swordAttack(p) {
  const w = p.weapon;
  const dmg = w.damage * damageBonus(game.profile.level);
  // 가까운 몬스터 쪽으로 자동으로 몸을 돌려요
  let nearest = null, best = w.range + 0.6;
  for (const m of monsters) {
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < best && m.appearTimer <= 0) { best = d; nearest = m; }
  }
  if (nearest && best > 0.01) {
    p.faceX = (nearest.x - p.x) / best;
    p.faceY = (nearest.y - p.y) / best;
  }

  const minFacing = Math.cos(Math.min(w.arc, Math.PI)) - 0.05;
  const hit = [];
  for (const m of monsters.slice()) {
    if (m.appearTimer > 0 || m.hp <= 0) continue;
    const dx = m.x - p.x, dy = m.y - p.y;
    const d = Math.hypot(dx, dy) || 0.001;
    if (d > w.range + m.r) continue;
    const facing = (dx * p.faceX + dy * p.faceY) / d; // 1 이면 정면
    if (d > 0.5 && facing < minFacing) continue;       // 칼이 안 닿는 쪽
    damageMonster(m, dmg, p.x, p.y, w.legendary);
    hit.push(m);
  }

  if (w.legendary) legendStrike(p, hit);
  else {
    sfx.swing();
    if (hit.length) sfx.hit();
  }
}

// knock: 밀려나는 정도 (화살은 조금만)
function damageMonster(m, dmg, fromX, fromY, legendary, knock = 1) {
  if (m.hp <= 0) return;
  if (m.def.armor) dmg *= 1 - m.def.armor; // 갑옷 입은 몬스터는 덜 아파요
  m.hp -= dmg;
  m.flash = 0.12;
  m.stunTimer = 0.25 * knock;
  const dx = m.x - fromX, dy = m.y - fromY, d = Math.hypot(dx, dy) || 1;
  const push = (legendary ? 16 : 9) * knock;
  m.knockX = (dx / d) * push; m.knockY = (dy / d) * push;
  m.aggro = true;
  const shown = Math.round(dmg * 10) / 10;
  addFloatText(m.x, m.y, `${shown}`, legendary ? "rainbow" : "#fff", legendary ? 26 : 18);
  game.shake = Math.max(game.shake, 0.12);
  if (m.hp <= 0) killMonster(m, legendary);
}

function killMonster(m, legendary) {
  const def = m.def;
  game.run.kills++;
  const colors = def.look ? [def.look.skin, def.look.shirt, def.look.pants] : [def.color, shade(def.color, 0.6), "#ffffff"];
  spawnBurst(m.x, m.y, colors);
  if (legendary) legendBurst(m.x, m.y);
  sfx.kill();
  gainXp(Math.max(1, Math.round(def.xp * rewardMul(game.mapLevel))));
  const drops = def.emeraldCount || 1;
  for (let i = 0; i < drops; i++) if (Math.random() < def.emerald) dropPickup("emerald", m.x, m.y);
  if (Math.random() < CONFIG.monster.appleChance) dropPickup("apple", m.x, m.y);
  if (Math.random() < (def.arrowDrop || CONFIG.monster.arrowChance)) dropPickup("arrows", m.x, m.y);
  // 슬라임은 쪼개져요!
  if (def.splits) {
    for (let i = 0; i < def.splitCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const c = createMonster(def.splits, m.x + Math.cos(a) * 0.3, m.y + Math.sin(a) * 0.3, game.mapLevel);
      c.aggro = true;
      c.appearTimer = 0.25;
      c.stunTimer = 0.2; c.knockX = Math.cos(a) * 5; c.knockY = Math.sin(a) * 5;
      monsters.push(c);
    }
  }
}

// 주인공이 맞았을 때
function hurtPlayer(p, damage, from) {
  if (p.rollTimer > 0 || p.hurtTimer > 0 || p.hp <= 0) return;

  // 갑옷이 막았어요!
  if (Math.random() < p.armor.block) {
    p.hurtTimer = 0.3;
    addFloatText(p.x, p.y, "막음!", "#ffe27a", 20);
    sfx.block();
    if (p.armor.legendary) legendBlock(p);
    const dx = from.x - p.x, dy = from.y - p.y, d = Math.hypot(dx, dy) || 1;
    from.stunTimer = 0.3;
    from.knockX = (dx / d) * 8; from.knockY = (dy / d) * 8;
    return;
  }

  p.hp = Math.max(0, p.hp - damage);
  p.hurtTimer = CONFIG.player.hurtInvincible;
  p.flash = 0.1;
  game.shake = 0.25;
  sfx.hurt();
  addFloatText(p.x, p.y, `-${Math.round(damage * 10) / 10}`, "#ff6b6b", 18);
  const dx = p.x - from.x, dy = p.y - from.y, d = Math.hypot(dx, dy) || 1;
  moveEntity(p, (dx / d) * 0.35, (dy / d) * 0.35);
  if (p.hp <= 0) {
    spawnBurst(p.x, p.y, [CONFIG.colors.player.shirt, CONFIG.colors.player.skin], 16);
    endRun(false);
  }
}

function endRun(win) {
  const r = game.run;
  let bonus = 0;
  if (win) {
    bonus = clearBonus(game.mapDef, game.mapLevel);
    game.profile.emeralds += bonus;
    if (!game.profile.cleared.includes(game.mapDef.id)) game.profile.cleared.push(game.mapDef.id);
    const best = game.profile.best[game.mapDef.id] || 0;
    if (game.mapLevel > best) game.profile.best[game.mapDef.id] = game.mapLevel;
    sfx.clear();
    showMessage("던전 클리어!", 2, true);
    for (let i = 0; i < 3; i++) addRing(game.player.x, game.player.y, { speed: 6, life: 0.6, hue: i * 120, delay: i * 0.15 });
  }
  game.result = { win, mapName: `${game.mapDef.name} Lv ${game.mapLevel}`, kills: r.kills, emeralds: r.emeralds, xp: r.xp, levels: r.levels, bonus };
  game.endTimer = win ? 1.8 : 1.4;
  saveProfile();
}

// ----- 레벨 -----
function gainXp(n) {
  const pr = game.profile;
  if (pr.level >= CONFIG.level.max) return;
  pr.xp += n;
  if (game.run) game.run.xp += n;
  while (pr.level < CONFIG.level.max && pr.xp >= xpNeeded(pr.level)) {
    pr.xp -= xpNeeded(pr.level);
    pr.level++;
    if (game.run) game.run.levels++;
    levelUp();
  }
  if (pr.level >= CONFIG.level.max) pr.xp = 0;
}

function levelUp() {
  const p = game.player;
  p.maxHp = playerMaxHp(game.profile.level);
  p.hp = p.maxHp;
  sfx.levelUp();
  showMessage(`레벨 업!  Lv ${game.profile.level}`, 2.5, false, "#7dd3ff");
  addRing(p.x, p.y, { speed: 5, life: 0.5, gold: true });
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(p.x + Math.cos(a) * 0.4, p.y + Math.sin(a) * 0.4, Math.random() * 0.5, { vz: 2 + Math.random() * 2, life: 0.9, size: 0.9, hue: 190 + Math.random() * 30 });
  }
  saveProfile();
}

function onPickup(item) {
  const p = game.player;
  if (item.type === "emerald") {
    game.profile.emeralds++;
    if (game.run) game.run.emeralds++;
    sfx.emerald();
  } else if (item.type === "arrows") {
    const pr = game.profile;
    const n = 3 + Math.floor(Math.random() * 3);
    const got = Math.min(n, CONFIG.player.maxArrows - pr.arrows);
    pr.arrows += got;
    addFloatText(p.x, p.y, got > 0 ? `화살 +${got}` : "화살 가득", "#e8d0a0", 16);
    sfx.emerald();
  } else if (item.type === "apple") {
    p.hp = Math.min(p.maxHp, p.hp + 2);
    addFloatText(p.x, p.y, "+2", "#ff7b7b", 20);
    sfx.apple();
  }
}

// ----- 매 프레임 계산 -----
function update(dt) {
  game.time += dt;
  game.messageTimer -= dt;
  game.shake = Math.max(0, game.shake - dt);
  if (cheatOpen) return; // 치트 입력 중엔 잠깐 멈춰요

  if (wasPressed("KeyM")) {
    muted = !muted;
    showMessage(muted ? "소리 끔" : "소리 켬", 1);
  }

  if (game.scene === "title") {
    if (wasPressed("Enter", "Space")) enterLobby();
    return;
  }
  switch (game.overlay) {
    case "shop": updateShop(dt); return;
    case "maps": updateMapSelect(); return;
    case "menu": updateMenu(); return;
    case "result": updateResult(); return;
  }
  if (wasPressed("Escape")) { openMenu(); return; }

  const p = game.player;
  if (p.hp > 0) updatePlayer(p, dt);
  updateParticles(dt);
  updatePickups(p, dt, onPickup);
  updateFloatTexts(dt);
  updateLegendary(dt, p);

  if (game.scene === "lobby") {
    updateLobby(p, dt);
    game.nearNpc = nearestNpc(p);
    if (game.nearNpc && wasPressed("KeyE", "TouchUse")) game.nearNpc.action();
    return;
  }

  // ----- 던전 -----
  revealAround(p.x, p.y);
  updatePaths(p.x, p.y);
  for (const m of monsters) updateMonster(m, p, dt);
  monsters = monsters.filter((m) => m.hp > 0);
  updateArrows(p, dt);
  updateShots(dt);
  monsters = monsters.filter((m) => m.hp > 0);

  // 황금 갑옷: 체력이 저절로 차요
  if (p.armor.regen && p.hp < p.maxHp && p.hp > 0) {
    p.regenTimer += dt;
    if (p.regenTimer >= p.armor.regen) {
      p.regenTimer = 0;
      p.hp = Math.min(p.maxHp, p.hp + 1);
      addFloatText(p.x, p.y, "+1", "#ffe27a", 18);
    }
  }

  // 다 물리쳤나?
  if (monsters.length === 0 && !game.result && p.hp > 0) endRun(true);
  if (game.result && game.endTimer > 0) {
    game.endTimer -= dt;
    if (game.endTimer <= 0) game.overlay = "result";
  }
}

// ----- 어둠과 빛 -----
const darkCanvas = document.createElement("canvas");
const darkCtx = darkCanvas.getContext("2d");

// 어둠은 부드러운 그림이라 절반 크기로 그려서 늘려도 티가 안 나요 (빠르게!)
function drawDarkness(lights) {
  const scale = 0.5;
  const w = Math.ceil(view.w * scale), h = Math.ceil(view.h * scale);
  if (darkCanvas.width !== w || darkCanvas.height !== h) { darkCanvas.width = w; darkCanvas.height = h; }
  darkCtx.setTransform(scale, 0, 0, scale, 0, 0);
  darkCtx.globalCompositeOperation = "source-over";
  darkCtx.clearRect(0, 0, view.w, view.h);
  darkCtx.fillStyle = `rgba(8,6,22,${world.theme.darkness})`;
  darkCtx.fillRect(0, 0, view.w, view.h);
  darkCtx.globalCompositeOperation = "destination-out";
  for (const L of lights) {
    const s = toScreen(L.x, L.y, 0.3);
    const R = L.radius * TILE_W * 0.75;
    const power = L.power || 1;
    darkCtx.save();
    darkCtx.translate(s.x, s.y);
    darkCtx.scale(1, 0.62);
    const g = darkCtx.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, `rgba(0,0,0,${power})`);
    g.addColorStop(0.55, `rgba(0,0,0,${power * 0.75})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    darkCtx.fillStyle = g;
    darkCtx.beginPath(); darkCtx.arc(0, 0, R, 0, Math.PI * 2); darkCtx.fill();
    darkCtx.restore();
  }
  ctx.drawImage(darkCanvas, 0, 0, view.w, view.h);
}

// ----- 그리기 -----
function draw() {
  clearUI();
  ctx.fillStyle = world.theme.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  const p = game.player;
  camera.x += (p.x - camera.x) * 0.12;
  camera.y += (p.y - camera.y) * 0.12;

  ctx.save();
  if (game.shake > 0) {
    const k = (10 * game.shake) / 0.25;
    ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
  }

  drawFloor();
  drawLegendFloor();

  if (p.hp > 0) drawShadow(p.x, p.y, p.r);
  for (const m of monsters) if (onScreen(m.x, m.y)) drawShadow(m.x, m.y, m.r);

  // 뒤에 있는 것부터 그려야 앞에 있는 게 가려요
  const things = [];
  collectWalls(things, p);
  if (game.scene !== "dungeon") lobbyThings(things);
  if (p.hp > 0) things.push({ depth: p.x + p.y, draw: () => drawPlayer(p) });
  for (const m of monsters) if (onScreen(m.x, m.y)) things.push({ depth: m.x + m.y, draw: () => drawMonster(m) });
  for (const e of pickups) things.push({ depth: e.x + e.y, draw: () => drawPickup(e) });
  for (const a of arrows) things.push({ depth: a.x + a.y, draw: () => drawArrow(a) });
  for (const sh of shots) things.push({ depth: sh.x + sh.y, draw: () => drawShot(sh) });
  for (const q of particles) things.push({ depth: q.x + q.y, draw: () => drawBox(q.x - q.size / 2, q.y - q.size / 2, q.z, q.size, q.size, q.size, q.color) });
  things.sort((a, b) => a.depth - b.depth);
  for (const t of things) t.draw();
  ctx.restore();

  // 어둠 (빛이 있는 곳만 밝아요)
  const lights = [{ x: p.x, y: p.y, radius: p.armor.legendary ? CONFIG.light.legendLight : CONFIG.light.playerLight }];
  if (p.weapon.legendary) lights.push({ x: p.x, y: p.y, radius: CONFIG.light.playerLight + 2, power: 0.6 });
  if (game.scene !== "dungeon") lights.push(...lobbyLights());
  drawDarkness(lights);

  // 어둠 위에서 빛나는 것들
  drawLegendGlow(p);
  drawFloatTexts();
  if (game.scene === "lobby") drawNpcLabels();
  drawScreenFlash();

  if (game.scene === "title") { drawTitle(); return; }
  drawHUD();
  if (game.overlay === "shop") drawShop();
  else if (game.overlay === "maps") drawMapSelect();
  else if (game.overlay === "menu") drawMenu();
  else if (game.overlay === "result") drawResult();
}

// ----- 게임 루프 -----
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  clearPressed();
  requestAnimationFrame(loop);
}

// 처음 화면 뒤에는 캠프가 보여요
buildLobby();
placePlayer();
requestAnimationFrame(loop);
