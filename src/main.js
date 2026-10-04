// ===== 게임 본체: 장면 바꾸기, 싸우기, 레벨, 그리기 =====
// 장면(scene): "title" 처음 화면 -> "lobby" 캠프 <-> "dungeon" 던전(또는 탑)
// 창(overlay): "shop" 가게, "maps" 모험 지도, "smith" 대장장이, "wardrobe" 옷장,
//              "records" 기록판, "menu" 메뉴, "result" 결과

const game = {
  scene: "title",
  mode: null,         // "tower" 이면 시련의 탑
  overlay: null,
  profile: loadProfile(),
  player: null,
  mapDef: null,
  mapLevel: 1,
  tower: null,
  run: null,          // 이번 던전에서 모은 것
  result: null,
  endTimer: 0,
  nearNpc: null,
  message: "", messageTimer: 0, messageRainbow: false, messageColor: null,
  shake: 0,
  hitstop: 0,         // 맞는 순간 잠깐 멈춤
  fade: 0,            // 층 올라갈 때 화면 깜깜
  time: 0,
  confirmReset: false,
};

function playing() {
  return (game.scene === "lobby" || game.scene === "dungeon") && !game.overlay && !cheatOpen;
}

function showMessage(str, time = 2, rainbowText = false, color = null) {
  hookRun("event", "msg", [str, time, rainbowText, color]); // 같이 하기: 방장이 모아 친구에게
  game.message = str;
  game.messageTimer = time;
  game.messageRainbow = rainbowText;
  game.messageColor = color;
}

// 장면이 바뀔 때 (다른 파일은 hookOn("reset") 으로 끼어들어요)
function resetEffects() { resetEffectsBase(); hookRun("reset"); }
function resetEffectsBase() {
  particles = []; pickups = []; floatTexts = []; arrows = []; monsters = []; shots = []; impacts = []; chests = [];
  stairs = null;
  clearLegendary();
  pathFrom = { x: -1, y: -1 };
  game.endTimer = 0;
  game.result = null;
  game.nearNpc = null;
  game.hitstop = 0;
}

function placePlayer() {
  const spot = findFreeSpot(world.start.x, world.start.y, 0.35) || world.start;
  game.player = createPlayer(spot.x, spot.y);
  game.players = null;
  hookRun("playerPlaced", game.player); // 둘이 하기: 친구도 옆에 (coop.js)
  camera.x = game.player.x;
  camera.y = game.player.y;
}

// ----- 장면 바꾸기 -----
function enterLobby(msg) {
  resetEffects();
  buildLobby();
  game.scene = "lobby";
  game.mode = null;
  game.overlay = null;
  game.mapDef = null;
  game.tower = null;
  placePlayer();
  game.player.faceX = -Math.SQRT1_2; game.player.faceY = -Math.SQRT1_2;
  saveProfile();
  if (msg) showMessage(msg, 2);
}

function startDungeon(def, level) { const r = startDungeonBase(def, level); hookRun("dungeonStarted", def, level); return r; }
function startDungeonBase(def, level) {
  resetEffects();
  const rand = generateDungeon(def, hookFilter("dungeonSeed", undefined, def)); // 같이 하기: 방장 씨앗
  spawnMonsters(def, level, rand);
  placeChests(rand);
  game.scene = "dungeon";
  game.mode = "dungeon";
  game.overlay = null;
  game.mapDef = def;
  game.mapLevel = level;
  placePlayer();
  game.run = { kills: 0, emeralds: 0, xp: 0, levels: 0, mats: {} };
  game.profile.stats.runs++;
  sfx.wave();
  showMessage(`${def.name} Lv ${level}  ·  몬스터를 모두 물리치세요!`, 3);
}

// ----- 싸우기 -----
// knock: 밀려나는 정도   opts: { crit 치명타, melee 칼/화살, effect 특수효과, finisher 마무리, dot 지속피해 }
// 몬스터 맞기: 맞기 전/뒤 알림 (보호막, 무적, 방패, 정예 속성 등은 각 파일에서)
function damageMonster(m, dmg, fromX, fromY, legendary, knock = 1, opts = {}) {
  if (!m) return;
  if (m.dummy && typeof hitDummy === "function") { hitDummy(m, dmg, false, game.player); return; } // 허수아비는 따로
  if (!m.def) return; // 몬스터가 아닌 것은 무시 (오류 막기)
  const h = { m, dmg, fromX, fromY, legendary, knock, opts: opts || {} };
  if (hookAny("monsterDamage", h)) return;
  const r = damageMonsterBase(m, h.dmg, h.fromX, h.fromY, h.legendary, h.knock, h.opts);
  hookRun("monsterDamaged", h);
  return r;
}
function damageMonsterBase(m, dmg, fromX, fromY, legendary, knock = 1, opts = {}) {
  if (m.hp <= 0) return;
  if (m.def.armor) dmg *= 1 - m.def.armor; // 갑옷 입은 몬스터는 덜 아파요
  m.hp -= dmg;
  m.lastCrit = !!opts.crit;
  m.aggro = true;
  const shown = Math.round(dmg * 10) / 10;
  if (opts.dot) {
    addFloatText(m.x, m.y, `${shown}`, opts.color || "#ffb070", 15);
  } else {
    m.flash = 0.1;
    m.hitT = 0.15;
    if (knock > 0) {
      m.stunTimer = 0.22 * Math.min(1.5, knock);
      const dx = m.x - fromX, dy = m.y - fromY, d = Math.hypot(dx, dy) || 1;
      const push = (legendary ? 16 : 10) * knock * (m.boss ? 0.2 : 1);
      m.knockX = (dx / d) * push; m.knockY = (dy / d) * push;
    }
    if (opts.crit) addFloatText(m.x, m.y, `치명타! ${shown}`, "#ffd84a", 26);
    else addFloatText(m.x, m.y, `${shown}`, legendary ? "rainbow" : opts.finisher ? "#ffe9a8" : "#fff", legendary ? 26 : opts.finisher ? 23 : 19);
    if (opts.melee) addImpact(m, fromX, fromY, opts.crit, EFFECT_COLORS[opts.effect]);
    game.shake = Math.max(game.shake, opts.finisher || opts.crit ? 0.2 : 0.1);
    if (opts.effect) applyEffect(m, opts.effect, dmg);
  }
  if (m.hp <= 0) killMonster(m, legendary, opts);
}

function killMonster(m, legendary, opts) { const r = killMonsterBase(m, legendary, opts); hookRun("monsterKilled", m, legendary, opts); return r; }
function killMonsterBase(m, legendary, opts = {}) {
  const def = m.def;
  const pr = game.profile;
  if (game.run) game.run.kills++;
  recShared("kill", { type: m.type, skip: typeof codexSkipMonster === "function" ? codexSkipMonster(m) : true }); // 팀 처치 수·도감 (같이 하기: 친구도, records.js)
  const colors = def.look ? [def.look.skin, def.look.shirt, def.look.pants] : [def.color, shade(def.color, 0.6), "#ffffff"];
  spawnBurst(m.x, m.y, colors, m.boss ? 40 : 14);
  if (legendary) legendBurst(m.x, m.y);
  if (m.boss) { game.shake = 0.5; flashScreen(0.2); hitStop(0.15); addRing(m.x, m.y, { speed: 8, life: 0.6, gold: true }); }
  sfx.kill();
  gainXp(Math.max(1, Math.round(def.xp * rewardMul(game.mapLevel) * (m.boss ? 8 : 1))));
  const killer = opts.by && opts.by.weapon ? opts.by : game.player; // 잡은 사람의 무기·장신구로 (같이 하기: 친구가 잡으면 친구 것)
  const w = killer.weapon;
  if (w.effect === "heal" && opts.melee) {
    const p = killer;
    p.hp = Math.min(p.maxHp, p.hp + 0.5);
    addFloatText(p.x, p.y, "+0.5", "#c08aff", 15);
  }
  const extra = (w.effect === "emerald" && opts.melee ? 0.25 : 0) + Math.min(0.5, (killer.armor.luck || 0)); // 행운: 황금 칼·행운 장신구
  const drops = (def.emeraldCount || 1) * (m.boss ? 8 : 1);
  for (let i = 0; i < drops; i++) if (Math.random() < def.emerald + extra) dropPickup("emerald", m.x, m.y);
  if (Math.random() < CONFIG.monster.appleChance) dropPickup("apple", m.x, m.y);
  if (Math.random() < (def.arrowDrop || CONFIG.monster.arrowChance)) dropPickup("arrows", m.x, m.y);
  if (Math.random() < 0.03) dropPickup("special", m.x, m.y, { arrowType: randomSpecialArrow() });
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
function hurtPlayer(p, damage, from) { if (p && p.ally) { hookRun("allyHurt", p, damage, from); return; } const hp0 = p.hp; const r = hurtPlayerBase(p, damage, from); hookRun("playerHurt", p, damage, from, hp0); return r; }
function hurtPlayerBase(p, damage, from) {
  if (p.rollTimer > 0 || p.hurtTimer > 0 || p.hp <= 0) return;
  const a = p.armor;
  const isMonster = from && from.def;

  // 갑옷이 막았어요!
  if (Math.random() < a.block) {
    p.hurtTimer = 0.3;
    addFloatText(p.x, p.y, "막음!", "#ffe27a", 20);
    sfx.block();
    if (a.legendary) legendBlock(p);
    if (isMonster) {
      const dx = from.x - p.x, dy = from.y - p.y, d = Math.hypot(dx, dy) || 1;
      from.stunTimer = 0.3;
      from.knockX = (dx / d) * 8; from.knockY = (dy / d) * 8;
    }
    armorRevenge(p, from);
    return;
  }

  p.hp = Math.max(0, p.hp - damage);
  p.hurtTimer = CONFIG.player.hurtInvincible;
  p.hurtLean = 0.2;
  p.flash = 0.1;
  game.shake = 0.3;
  hitStop(0.06);
  flashScreen(0.08);
  sfx.hurt();
  addFloatText(p.x, p.y, `-${Math.round(damage * 10) / 10}`, "#ff6b6b", 20);
  const dx = p.x - from.x, dy = p.y - from.y, d = Math.hypot(dx, dy) || 1;
  moveEntity(p, (dx / d) * 0.4, (dy / d) * 0.4);
  armorRevenge(p, from);
  if (p.hp <= 0) {
    spawnBurst(p.x, p.y, [CONFIG.colors.player.shirt, CONFIG.colors.player.skin], 16);
    if (!hookAny("playerDown", p)) endRun(false); // 둘이 하기: 친구가 살아있으면 유령이 돼요
  }
}

// 가시 갑옷, 서리 갑옷: 때린 몬스터도 혼나요
function armorRevenge(p, from) {
  if (!from || !from.def || from.hp <= 0) return;
  if (p.armor.thorns) damageMonster(from, p.armor.thorns * damageBonus(game.profile.level), p.x, p.y, false, 0.6, { color: "#c8e070" });
  if (p.armor.frost) from.slow = 2.5;
}

// 보상 배수: 난이도 x 하드모드
function rewardFactor() {
  return diff().reward * (game.profile.hardMode ? CONFIG.hardModeReward : 1);
}


function endRun(win) { if (hookAny("endRun", win)) return; return endRunBase(win); }
function endRunBase(win) {
  if (game.result) return;
  const r = game.run;
  const pr = game.profile;
  let bonus = 0;
  let mats = null;
  if (win) {
    bonus = Math.round(clearBonus(game.mapDef, game.mapLevel) * rewardFactor());
    pr.emeralds += bonus;
    const key = `${game.mapDef.id}:${pr.difficulty}`;
    const first = !pr.firstClears[key];
    // 맵을 깨면 받는 화폐 (currency.js)
    for (const [id, n] of Object.entries(stageCoins(game.mapLevel, first))) curAdd(id, n);
    mats = r.mats && Object.keys(r.mats).length ? { ...r.mats } : null; // 보스 부품
    // 깬 맵·최고 레벨·첫 클리어·통계·모험 기록 (같이 하기: 친구 저장에도 똑같이, records.js)
    const kh = game.keyhunt;
    recShared("clear", { map: game.mapDef.id, level: game.mapLevel, dungeon: !!(game.mode === "dungeon" && kh && kh.bossWon), runSec: typeof qolRun !== "undefined" ? qolRun.t : 0 });
    sfx.clear();
    showMessage(game.mode === "tower" ? `${curTower().name} 정복!` : "던전 클리어!", 2, true);
    for (let i = 0; i < 3; i++) addRing(game.player.x, game.player.y, { speed: 6, life: 0.6, hue: i * 120, delay: i * 0.15 });
  } else {
    recShared("lose"); // 다 같이 쓰러짐 (같이 하기: 친구 기록에도, records.js)
  }
  const where = game.mode === "tower" ? `${curTower().name} Lv ${game.mapLevel} · ${game.tower.floor}층` : `${game.mapDef.name} Lv ${game.mapLevel}`;
  if (!win) mats = r.mats || null;
  game.result = { win, mapName: where, kills: r.kills, emeralds: r.emeralds, xp: r.xp, levels: r.levels, bonus, mats, money: { ...(r.money || {}) }, items: (r.items || []).slice() };
  game.endTimer = win ? 1.8 : 1.4;
  saveProfile();
}

// ----- 레벨 -----
function gainXp(n) {
  hookRun("reward", "xp", n); // 같이 하기: 친구도 같이 받아요
  const pr = game.profile;
  // 최고 레벨은 없어요 (높을수록 레벨 올리기가 어려워요: player.js xpNeeded)
  pr.xp += n;
  if (game.run) game.run.xp += n;
  while (pr.xp >= xpNeeded(pr.level)) {
    pr.xp -= xpNeeded(pr.level);
    pr.level++;
    if (game.run) game.run.levels++;
    levelUp();
  }
}

function levelUp() {
  const p = game.player;
  p.maxHp = maxHpFor(p.armor);
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

function onPickup(item, picker) {
  const p = picker || game.player;
  const pr = game.profile;
  const max = CONFIG.player.maxArrows;
  if (item.type === "emerald") {
    pr.emeralds++;
    if (game.run) game.run.emeralds++;
    sfx.emerald();
  } else if (item.type === "arrows") {
    const got = Math.min(3 + Math.floor(Math.random() * 3), max - pr.arrows);
    pr.arrows += got;
    addFloatText(p.x, p.y, got > 0 ? `화살 +${got}` : "화살 가득", "#e8d0a0", 16);
    sfx.emerald();
  } else if (item.type === "special") {
    const at = arrowTypeById(item.arrowType);
    pr.special[at.id] = Math.min(max, (pr.special[at.id] || 0) + 3);
    addFloatText(p.x, p.y, `${at.name} +3`, at.color, 16);
    sfx.emerald();
  } else if (item.type === "potion") {
    if (pr.potions < CONFIG.player.maxPotions) { pr.potions++; addFloatText(p.x, p.y, "물약 +1", "#ff9ad8", 16); }
    else { p.hp = Math.min(p.maxHp, p.hp + POTION.heal); addFloatText(p.x, p.y, `+${POTION.heal}`, "#ff9ad8", 18); }
    sfx.potion();
  } else if (item.type === "coin") {
    curAdd(item.cur, 1);
    sfx.emerald();
  } else if (item.type === "item") {
    giveItem(item.item);
  } else if (item.type === "material") {
    addMaterial(item.mat, item.count || 1);
    if (game.run) { game.run.mats = game.run.mats || {}; game.run.mats[item.mat] = (game.run.mats[item.mat] || 0) + (item.count || 1); }
    addFloatText(p.x, p.y, `${MATERIALS[item.mat].name} +${item.count || 1}`, MATERIALS[item.mat].color, 16);
    sfx.emerald();
  } else if (item.type === "buffpot") {
    buffPotPickup(item, p); // 강화 물약 (buffpots.js)
  } else if (item.type === "apple") {
    p.hp = Math.min(p.maxHp, p.hp + 2);
    addFloatText(p.x, p.y, "+2", "#ff7b7b", 20);
    sfx.apple();
  }
  saveProfile();
}

// ----- 매 프레임 계산 -----
// 화면 속도 (보스 쓰러짐 느린 화면 등): hookFilter("timeScale", dt)
function update(dt) { return updateBase(hookFilter("timeScale", dt)); }
function updateBase(dt) {
  game.time += dt;
  game.messageTimer -= dt;
  game.shake = Math.max(0, game.shake - dt);
  game.fade = Math.max(0, game.fade - dt);
  hookRun("netTick", dt); // 같이 하기: 주고받기 (netplay.js)
  if (cheatOpen && !hookAny("cheatKeepsRunning")) return; // 글 입력 창 중엔 잠깐 멈춰요 (같이 하기 중엔 안 멈춰요: netplay.js)

  // 맞는 순간 잠깐 멈춤 (타격감)
  if (game.hitstop > 0) { game.hitstop -= dt; return; }
  // 잠깐 느린 화면 (처음 보는 기믹 설명: guide.js). slowT 는 실제 시간으로 줄어요
  if (game.slowT > 0) { game.slowT -= dt; dt *= game.slowK || 0.35; }

  if (wasPressed("KeyM")) {
    muted = !muted;
    showMessage(muted ? "소리 끔" : "소리 켬", 1);
  }

  if (game.scene === "title") {
    if (hookAny("titleUpdate", dt)) return; // 캐릭터 고르기 (chars.js)
    if (wasPressed("Enter", "Space")) enterLobby();
    return;
  }
  // 창(가게·지도·메뉴…) 보는 중: 창만 움직여요. "keepRunning" 이면 세상도 계속 (같이 하기: 누가 창을 봐도 다른 사람은 그대로 놀아요, netplay.js)
  const hadOverlay = !!game.overlay;
  let handled = true;
  switch (game.overlay) {
    case "shop": updateShop(dt); break;
    case "maps": updateMapSelect(); break;
    case "smith": updateSmith(dt); break;
    case "wardrobe": updateWardrobe(); break;
    case "records": updateRecords(); break;
    case "menu": updateMenu(); break;
    case "result": updateResult(); break;
    default: handled = !!(game.overlay && hookAny("overlayUpdate", game.overlay, dt)); // 다른 파일이 만든 창
  }
  if (hadOverlay && handled) { if (hookAny("keepRunning", dt)) updateWorld(dt); return; }
  if (wasPressed("Escape")) { openMenu(); return; }
  updateWorld(dt);
}

// 세상 계산 (주인공·몬스터·기술). 같이 하기의 친구 기기는 계산을 건너뛰고 방장 상태를 그려요 ("simulateSkip")
function updateWorld(dt) {
  if (hookAny("simulateSkip", dt)) return;
  const p = game.player;
  for (const q of allPlayers()) if (q.hp > 0) updatePlayer(q, dt); // 혼자면 1번만
  updateParticles(dt);
  for (const q of alivePlayers()) updatePickups(q, dt, (item) => onPickup(item, q)); // 누가 주워도 같이 써요 (하트 회복은 주운 사람)
  hookRun("playersUpdated", dt); // 둘이 하기: 유령·부활·따라가기 (coop.js)
  updateFloatTexts(dt);
  updateLegendary(dt, p);
  updateImpacts(dt);
  updateShots(dt);

  // 말 걸기 / 상자 열기 / 계단
  // 둘이 할 때는 둘 중 누구든 가까이 가면 열 수 있어요 (1번 E, 2번 , 키 / 각자 터치 버튼)
  game.nearNpc = null; game.nearWho = null;
  for (const q of alivePlayers()) {
    const n = nearestNpc(q);
    if (n) { game.nearNpc = n; game.nearWho = q; break; }
  }
  if (game.nearNpc && !game.overlay && wasPressed("KeyE", "TouchUse", "Comma", "NumpadAdd", "T2Use")) game.nearNpc.action(); // 창을 보는 동안(같이 하기라 세상이 도는 중)엔 E 가 창 몫이에요

  if (game.scene === "lobby") {
    updateLobby(p, dt);
    return;
  }

  // ----- 던전 / 탑 -----
  if (game.mode !== "tower") for (const q of alivePlayers()) revealAround(q.x, q.y);
  updatePaths(p.x, p.y);
  // 가장 가까운 주인공을 쫓아요 (드루이드 늑대처럼 우리 편이 더 가까우면 그쪽도: classes.js "targetsForMonster")
  for (const m of monsters) updateMonster(m, hookFilter("targetsForMonster", nearestPlayer(m.x, m.y), m), dt);
  monsters = monsters.filter((m) => m.hp > 0);
  updateArrows(p, dt);
  if (typeof updateAbilities === "function") updateAbilities(dt);
  updateChests(dt);

  // 체력 재생 갑옷
  if (p.armor.regen && p.hp < p.maxHp && p.hp > 0) {
    p.regenTimer += dt;
    if (p.regenTimer >= p.armor.regen) {
      p.regenTimer = 0;
      p.hp = Math.min(p.maxHp, p.hp + 1);
      addFloatText(p.x, p.y, "+1", "#ffe27a", 18);
    }
  }

  if (game.mode === "tower") {
    if (!game.result && p.hp > 0) updateTower(p, dt);
  } else if (monsters.length === 0 && !game.result && alivePlayers().length) {
    endRun(true);
  }
  if (game.result && game.endTimer > 0) {
    game.endTimer -= dt;
    if (game.endTimer <= 0) game.overlay = "result";
  }
}

// ----- 어둠과 빛 -----
const darkCanvas = document.createElement("canvas");
const darkCtx = darkCanvas.getContext("2d");

// 어둠은 부드러운 그림이라 절반 크기로 그려서 늘려도 티가 안 나요 (빠르게!)
function drawDarkness(lights) { hookRun("lights", lights); return drawDarknessBase(lights); }
function drawDarknessBase(lights) {
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
  // 모험 지도는 화면 전체를 쓰는 진짜 지도라서 따로 그려요 (뒤 세상은 안 그려도 돼요)
  if (game.overlay === "maps") { drawMapSelect(); return; }
  ctx.fillStyle = world.theme.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  const p = game.player;
  // 보스방에서는 보스가 같이 보이게 카메라를 보스 쪽으로 조금 당겨요
  const cb = typeof bossCameraBias === "function" ? bossCameraBias(p) : null;
  let cx = cb ? cb.x : p.x, cy = cb ? cb.y : p.y;
  const ct = hookFilter("cameraTarget", null, cx, cy); // 둘이 하기: 두 사람 가운데 (coop.js)
  if (ct) { cx = ct.x; cy = ct.y; }
  camera.x += (cx - camera.x) * 0.12;
  camera.y += (cy - camera.y) * 0.12;
  camera.z += ((world.hgt ? groundZ(p.x, p.y) : 0) - camera.z) * 0.12; // 위층에 올라가면 화면도 따라 올라가요
  liftZ = 0; autoLift = false;

  ctx.save();
  if (game.shake > 0) {
    const k = (12 * game.shake) / 0.25;
    ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
  }

  drawFloor();
  autoLift = true; // 바닥에 붙은 것(고리·예고 원·장판)은 그 자리 높이에 (terrain.js)
  drawLegendFloor();
  if (typeof drawTelegraphs === "function") drawTelegraphs();
  autoLift = false;

  for (const q of allPlayers()) if (q.hp > 0) drawShadow(q.x, q.y, q.r);
  for (const m of monsters) if (onScreen(m.x, m.y)) drawShadow(m.x, m.y, m.r);

  // 뒤에 있는 것부터 그려야 앞에 있는 게 가려요
  const things = [];
  collectWalls(things, p);
  if (game.scene !== "dungeon") lobbyThings(things);
  chestThings(things);
  stairsThings(things);
  for (const q of allPlayers()) if (q.hp > 0) things.push({ depth: q.x + q.y, e: q, draw: () => drawPlayer(q) });
  for (const m of monsters) if (onScreen(m.x, m.y)) things.push({ depth: m.x + m.y, e: m, draw: () => drawMonster(m) });
  for (const e of pickups) things.push({ depth: e.x + e.y, x: e.x, y: e.y, draw: () => drawPickup(e) });
  for (const a of arrows) things.push({ depth: a.x + a.y, x: a.x, y: a.y, draw: () => drawArrow(a) });
  for (const sh of shots) things.push({ depth: sh.x + sh.y, x: sh.x, y: sh.y, draw: () => drawShot(sh) });
  for (const q of particles) things.push({ depth: q.x + q.y, x: q.x, y: q.y, draw: () => drawBox(q.x - q.size / 2, q.y - q.size / 2, q.z, q.size, q.size, q.size, q.color) });
  if (world.hgt) terrainOccluders(things, [...allPlayers(), ...monsters, ...chests]); // 절벽 뒤에 선 것 가리기 (terrain.js)
  things.sort((a, b) => a.depth - b.depth);
  // 높은 단 위의 것은 그 높이에 (캐릭터는 부드럽게 떨어져요)
  for (const t of things) { liftZ = !world.hgt || t.lift !== undefined ? t.lift || 0 : t.e ? entityLift(t.e) : t.x !== undefined ? groundZ(t.x, t.y) : 0; t.draw(); }
  liftZ = 0;
  ctx.restore();

  // 어둠 (빛이 있는 곳만 밝아요)
  const lights = [{ x: p.x, y: p.y, radius: p.armor.legendary ? CONFIG.light.legendLight : CONFIG.light.playerLight }];
  if (p.weapon.legendary) lights.push({ x: p.x, y: p.y, radius: CONFIG.light.playerLight + 2, power: 0.6 });
  for (const q of allPlayers()) if (q !== p) lights.push({ x: q.x, y: q.y, radius: CONFIG.light.playerLight, power: q.hp > 0 ? 1 : 0.5 });
  if (game.scene !== "dungeon") lights.push(...lobbyLights());
  for (const c of chests) if (!c.open) lights.push({ x: c.x, y: c.y, radius: 1.6, power: 0.5 });
  if (stairs && stairs.open) lights.push({ x: stairs.x, y: stairs.y, radius: 3.5, power: 0.8 });
  autoLift = true; // 빛·떠오르는 글자도 그 자리 높이에
  drawDarkness(lights);

  // 어둠 위에서 빛나는 것들
  drawLegendGlow(p);
  drawImpacts();
  drawFloatTexts();
  drawNpcLabels();
  autoLift = false;
  drawScreenFlash();
  if (game.fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, game.fade / 0.4)})`;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  // 화면 글씨와 창 (휴대폰처럼 작은 화면에서는 줄여서)
  if (game.scene === "title") {
    beginUIScale(820, 520); drawTitle(); endUIScale();
    return;
  }
  beginUIScale(900, 540); drawHUD(); endUIScale();
  if (!game.overlay) drawTouchControls(); // 터치 버튼은 실제 화면 크기 그대로
  if (game.overlay) {
    beginUIScale(1000, 620);
    switch (game.overlay) {
      case "shop": drawShop(); break;
      case "smith": drawSmith(); break;
      case "wardrobe": drawWardrobe(); break;
      case "records": drawRecords(); break;
      case "menu": drawMenu(); break;
      case "result": drawResult(); break;
      default: hookAny("overlayDraw", game.overlay);
    }
    endUIScale();
  }
}

// ----- 게임 루프 -----
// 컴퓨터/태블릿이 힘들지 않게:
//  1) 화면이 안 보이거나 다른 앱으로 가면 멈춰요
//  2) 버벅이면 그리는 해상도를 자동으로 낮춰요
//  3) 가게·메뉴 같은 창이 떠 있을 땐 덜 자주 그려요
let lastTime = performance.now();
let lastDraw = 0;
let rafId = null;
let paused = false;
const frameTimes = [];

// 오류 기록 (같은 오류는 한 번만 콘솔에, 화면엔 작게 알려요)
const loopErrors = [];
function reportLoopError(e, where = "loop") {
  const msg = String((e && e.message) || e);
  uiRecover(); // 그리다가 오류가 나면 줄인 화면 배율이 안 풀려서 모든 게 작게 그려져요. 원래대로
  try { if (typeof errLogAdd === "function") errLogAdd(e, where); } catch (_) {} // 기기에 남겨요 (errlog.js)
  if (!loopErrors.includes(msg)) {
    loopErrors.push(msg);
    console.error("게임 오류(계속 진행해요):", e);
    try { showMessage("앗, 작은 오류가 났어요 (메뉴 > 오류 기록 복사)", 2.5); } catch (_) {}
  }
  try { clearPressed(); } catch (_) {}
}

function loop(now) {
  rafId = null;
  if (paused) return;
  const raw = now - lastTime;
  const dt = Math.min(0.05, raw / 1000);
  lastTime = now;
  // 혹시 오류가 나도 게임이 멈추지 않게 (오류는 기록하고 다음 프레임은 계속)
  try {
    update(dt);
  } catch (e) { reportLoopError(e); }

  const calm = (game.overlay && game.overlay !== "maps") || game.scene === "title" || cheatOpen; // 지도는 끌 때 부드럽게
  if (!calm || now - lastDraw > 66) { // 창이 떠 있으면 1초에 15번만
    try { draw(); } catch (e) { reportLoopError(e); }
    lastDraw = now;
  }
  if (game.hitstop <= 0) clearPressed(); // 멈춘 동안 누른 버튼은 기억해둬요

  // 게임 중에 계속 많이 느리면(초당 25번도 못 그리면) 해상도를 한 단계 낮춰요
  // (절전 모드처럼 초당 30번으로 고정된 건 괜찮아요)
  if (!calm && raw < 250) {
    frameTimes.push(raw);
    if (frameTimes.length >= 90) {
      const sorted = frameTimes.slice().sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      frameTimes.length = 0;
      if (median > 40) lowerQuality();
    }
  }
  rafId = requestAnimationFrame(loop);
}

function pauseGame() {
  if (paused) return;
  paused = true;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  for (const k in keys) keys[k] = false;
  touch.moveX = touch.moveY = 0; touch.joyId = null;
  // 멈춤 화면 한 번만 그려둬요
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, view.w, view.h);
  text("잠깐 멈춤", view.w / 2, view.h / 2, 40, "#ffe27a", "center");
  text("화면을 누르면 계속해요", view.w / 2, view.h / 2 + 40, 18, "#ddd", "center");
}

function resumeGame() {
  if (!paused || document.hidden || !gameBooted) return;
  paused = false;
  lastTime = performance.now();
  frameTimes.length = 0;
  if (!rafId) rafId = requestAnimationFrame(loop);
}

document.addEventListener("visibilitychange", () => (document.hidden ? pauseGame() : resumeGame()));
window.addEventListener("blur", () => { if (!cheatOpen) pauseGame(); });
window.addEventListener("focus", resumeGame);
window.addEventListener("pointerdown", resumeGame, true);
window.addEventListener("keydown", resumeGame, true);
window.addEventListener("resize", () => { frameTimes.length = 0; });

// 처음 화면 뒤에는 캠프가 보여요
buildLobby();
placePlayer();
// 모든 스크립트가 다 읽힌 뒤에 시작해요. 그 전에 그리면 아직 안 읽힌 파일(직업 등)을 찾다가 오류가 나요
// (느린 인터넷에서는 다음 파일을 받는 동안 화면을 먼저 그릴 수 있어요)
let gameBooted = false;
// 다 읽힐 때까지 "불러오는 중" (까만 화면 대신)
try {
  ctx.fillStyle = "#16181d"; ctx.fillRect(0, 0, view.w, view.h);
  ctx.fillStyle = "#ffe27a"; ctx.font = 'bold 30px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'; ctx.textAlign = "center";
  ctx.fillText("던전 모험", view.w / 2, view.h / 2 - 10);
  ctx.fillStyle = "#cccccc"; ctx.font = 'bold 16px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  ctx.fillText("불러오는 중...", view.w / 2, view.h / 2 + 22);
  ctx.textAlign = "left";
} catch (e) { /* 그만 */ }
function bootLoop() { if (gameBooted) return; gameBooted = true; lastTime = performance.now(); if (!rafId && !paused) rafId = requestAnimationFrame(loop); }
if (document.readyState === "complete") bootLoop(); else window.addEventListener("load", bootLoop);
