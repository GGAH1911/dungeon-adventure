// ===== 로비 (캠프) =====
// 상인, 모험 지도, 대장장이, 옷장, 소원 우물, 기록판, 강아지, 연습장(허수아비, 과녁)

const lobby = {
  fire: { x: 15, y: 11 },
  merchant: { x: 9, y: 6.2, r: 0.3, faceX: Math.SQRT1_2, faceY: Math.SQRT1_2, moving: false, walkTime: 0, flash: 0 },
  smith: { x: 6.8, y: 14.2, r: 0.3, faceX: Math.SQRT1_2, faceY: Math.SQRT1_2, moving: false, walkTime: 0, flash: 0 },
  table: { x: 21.5, y: 6 },
  well: { x: 15, y: 4.5 },
  wardrobe: { x: 24, y: 14 },
  board: { x: 4, y: 9 },
  anvil: { x: 8.3, y: 15.2 },
  furnace: { x: 5.3, y: 12.6 },
  crates: [{ x: 7.6, y: 5 }, { x: 7.6, y: 6.1 }, { x: 10.6, y: 4.8 }],
  trees: [{ x: 3, y: 3 }, { x: 27, y: 3.5 }, { x: 3.5, y: 19.5 }, { x: 27.6, y: 21 }, { x: 26.5, y: 9.5 }, { x: 11, y: 2.5 }, { x: 19.5, y: 2.6 }],
  flowers: [],
  well_timer: 0,
};
let npcs = [];     // 말 걸 수 있는 것들 (E 키 / 터치 버튼)
let dummies = [];  // 연습용 허수아비, 과녁
const dog = { x: 17, y: 12.5, r: 0.25, faceX: 1, faceY: 0, moving: false, walkTime: 0, follow: 0, wander: 0, wx: 0, wy: 0, jump: 0, wag: 0 };

const smithColors = { skin: "#d9a07a", hair: "#3a2a1a", shirt: "#5a4632", pants: "#3f3428", eyes: "#2a1a10" };

function buildLobby() {
  if (typeof applyWorldLobby === "function") applyWorldLobby(); // 월드마다 마을 바닥 색 (worlds.js)
  buildLobbyWorld();
  const L = lobby;
  const f = L.fire;
  for (const t of [L.merchant, L.table, L.well, L.smith, L.wardrobe, L.board, { x: 12, y: 19.5 }, { x: 19, y: 19.5 }]) carvePath(f.x, f.y, t.x, t.y);
  world.solids = [
    { x: L.table.x, y: L.table.y, r: 0.7 },
    { x: f.x, y: f.y, r: 0.55 },
    { x: L.merchant.x, y: L.merchant.y, r: 0.35 },
    { x: L.smith.x, y: L.smith.y, r: 0.35 },
    { x: L.well.x, y: L.well.y, r: 0.85 },
    { x: L.wardrobe.x, y: L.wardrobe.y, r: 0.6 },
    { x: L.board.x, y: L.board.y, r: 0.5 },
    { x: L.anvil.x, y: L.anvil.y, r: 0.35 },
    { x: L.furnace.x, y: L.furnace.y, r: 0.6 },
    ...L.crates.map((c) => ({ x: c.x, y: c.y, r: 0.4 })),
    ...L.trees.map((t) => ({ x: t.x, y: t.y, r: 0.45 })),
  ];
  dummies = [
    { x: 11, y: 19.5, r: 0.35, dummy: true, kind: "dummy", hitT: 0, faceX: 0, faceY: -1 },
    { x: 13.2, y: 20, r: 0.35, dummy: true, kind: "dummy", hitT: 0, faceX: 0, faceY: -1 },
    { x: 19.5, y: 20, r: 0.45, dummy: true, kind: "target", hitT: 0, faceX: -0.7, faceY: -0.7 },
  ];
  for (const d of dummies) world.solids.push({ x: d.x, y: d.y, r: d.r });
  // 꽃
  const rand = makeRandom(42);
  L.flowers = [];
  for (let i = 0; i < 45; i++) {
    const x = 1.5 + rand() * (LOBBY.width - 3), y = 1.5 + rand() * (LOBBY.height - 3);
    if (world.path[Math.floor(y)][Math.floor(x)] || hitsWall(x, y, 0.5)) continue;
    const sea = typeof worldLook === "function" && worldLook() === 2; // 바닷속: 조개·불가사리·해초
    const moon = typeof worldLook === "function" && worldLook() === 3; // 달 마을: 별사탕 (moon.js)
    const under = typeof worldLook === "function" && worldLook() === 4; // 버섯 등불 마을: 작은 수정·버섯·반딧불 (under.js)
    L.flowers.push({ x, y, c: (under && typeof UNDER_FLOWERS !== "undefined" ? UNDER_FLOWERS : moon && typeof MOON_FLOWERS !== "undefined" ? MOON_FLOWERS : sea ? ["#ff9a7a", "#ffd6e8", "#7fe0c0", "#ffb84a"] : ["#ffdf5a", "#ff7aa8", "#ffffff", "#a98aff"])[Math.floor(rand() * 4)] });
  }
  npcs = [
    { x: L.merchant.x, y: L.merchant.y, range: 1.9, label: "상인", short: "가게", prompt: "가게 열기", action: openShop },
    { x: L.table.x, y: L.table.y, range: 2, label: "모험 지도", short: "지도", prompt: "맵 고르기", action: openMapSelect },
    { x: L.smith.x, y: L.smith.y, range: 1.9, label: "대장장이", short: "강화", prompt: "장비 강화", action: openSmith },
    { x: L.wardrobe.x, y: L.wardrobe.y, range: 1.8, label: "옷장", short: "옷장", prompt: "옷 갈아입기", action: openWardrobe },
    { x: L.well.x, y: L.well.y, range: 1.9, label: typeof worldLook === "function" && worldLook() === 2 ? "소원 조개" : typeof worldLook === "function" && worldLook() === 3 ? "소원 분화구" : typeof worldLook === "function" && worldLook() === 4 ? "소원 수정 샘" : "소원 우물", short: "소원", prompt: "에메랄드 3개 던지기", action: wishWell },
    { x: L.board.x, y: L.board.y, range: 1.8, label: "기록판", short: "기록", prompt: "내 기록 보기", action: openRecords },
    { dog: true, x: dog.x, y: dog.y, range: 1.4, label: "강아지", short: "쓰담", prompt: "쓰다듬기", action: petDog },
  ];
}

// only: 이 사람만 쓸 수 있어요 (같이 하기에서 "내 기기의 나"만, 예: 친구와 교환) · weak: 다른 것(상자·가게)이 가까이 있으면 그쪽이 먼저
function nearestNpc(p) {
  let best = null, bestD = Infinity;
  for (const n of interactables()) {
    if (n.only && n.only !== p) continue;
    const d = Math.hypot(p.x - n.x, p.y - n.y);
    const score = d + (n.weak ? 2 : 0);
    if (d < n.range && score < bestD) { best = n; bestD = score; }
  }
  return best;
}

// 지금 장면에서 말 걸 수 있는 것들
function interactables() {
  if (game.scene === "lobby") return [...npcs, ...hookFilter("lobbyInteractables", [])];
  return hookFilter("dungeonInteractables", [...chestInteractables(), ...stairsInteractables(), ...(typeof keyHuntInteractables === "function" ? keyHuntInteractables() : [])]); // 위층 계단 (upper.js)
}

function updateLobby(p, dt) {
  const who = lobby.merchant;
  const mdx = p.x - who.x, mdy = p.y - who.y, md = Math.hypot(mdx, mdy) || 1;
  if (md < 6) { who.faceX = mdx / md; who.faceY = mdy / md; }
  // 대장장이는 늘 모루를 봐요
  const sdx = lobby.anvil.x - lobby.smith.x, sdy = lobby.anvil.y - lobby.smith.y, sd = Math.hypot(sdx, sdy) || 1;
  lobby.smith.faceX = sdx / sd; lobby.smith.faceY = sdy / sd;
  // 모닥불 불티, 화로 불티
  if (Math.random() < dt * 12) addSparkle(lobby.fire.x + (Math.random() - 0.5) * 0.4, lobby.fire.y + (Math.random() - 0.5) * 0.4, 0.4, { vz: 1 + Math.random(), life: 0.9, size: 0.45, gold: true });
  if (Math.random() < dt * 6) addSparkle(lobby.furnace.x, lobby.furnace.y, 1.1, { vz: 1.2, life: 0.7, size: 0.4, gold: true });
  // 대장장이 망치가 모루에 닿는 순간 불꽃 (anim.js 의 박자와 맞춰요)
  const beat = (game.time % 1.4) / 1.4, prevBeat = ((game.time - dt) % 1.4) / 1.4;
  if (prevBeat < 0.66 && beat >= 0.66) {
    for (let i = 0; i < 6; i++) addSparkle(lobby.anvil.x - 0.2, lobby.anvil.y, 0.5, { vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5, vz: 1.5 + Math.random(), gravity: 8, life: 0.4, size: 0.4, gold: true });
  }
  for (const d of dummies) d.hitT = Math.max(0, d.hitT - dt);
  updateDog(p, dt);
  // 소원 우물 결과
  if (lobby.well_timer > 0) {
    lobby.well_timer -= dt;
    if (lobby.well_timer <= 0) wishResult();
  }
}

// ----- 강아지 -----
function updateDog(p, dt) {
  dog.jump = Math.max(0, dog.jump - dt);
  dog.wag += dt * (dog.follow > 0 ? 18 : 8);
  dog.follow -= dt;
  let tx, ty, speed;
  if (dog.follow > 0) {
    const d = Math.hypot(p.x - dog.x, p.y - dog.y);
    if (d > 1.3) { tx = p.x; ty = p.y; speed = Math.min(6, 2 + d); }
  } else {
    dog.wander -= dt;
    if (dog.wander <= 0) {
      dog.wander = 2 + Math.random() * 3;
      const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 3;
      dog.wx = lobby.fire.x + Math.cos(a) * r; dog.wy = lobby.fire.y + Math.sin(a) * r;
    }
    if (Math.hypot(dog.wx - dog.x, dog.wy - dog.y) > 0.3) { tx = dog.wx; ty = dog.wy; speed = 1.6; }
  }
  if (tx !== undefined) {
    const dx = tx - dog.x, dy = ty - dog.y, d = Math.hypot(dx, dy) || 1;
    dog.faceX = dx / d; dog.faceY = dy / d;
    moveEntity(dog, (dx / d) * speed * dt, (dy / d) * speed * dt);
    dog.moving = true; dog.walkTime += dt * speed / 1.6;
  } else {
    dog.moving = false;
  }
  const n = npcs.find((x) => x.dog);
  if (n) { n.x = dog.x; n.y = dog.y; }
}

function petDog() {
  dog.jump = 0.5;
  dog.follow = 12;
  game.profile.stats.pets++;
  sfx.bark();
  for (let i = 0; i < 4; i++) addFloatText(dog.x + (Math.random() - 0.5) * 0.4, dog.y, "♥", "#ff7aa8", 20);
}

function drawDog() {
  const d = dog;
  const fx = d.faceX, fy = d.faceY, px = -fy, py = fx;
  const z = d.jump > 0 ? Math.sin((d.jump / 0.5) * Math.PI) * 0.35 : 0;
  const walk = d.moving ? Math.sin(d.walkTime * 14) * 0.06 : 0;
  const tan = "#d9a066", dark = "#8a5a2e";
  const parts = [];
  const add = (f, s, zz, w, dd, h, c) => parts.push({ x: d.x + fx * f + px * s, y: d.y + fy * f + py * s, z: zz + z, w, d: dd, h, c });
  for (const [f, s, ph] of [[0.15, 0.08, 1], [0.15, -0.08, -1], [-0.15, 0.08, -1], [-0.15, -0.08, 1]]) add(f + walk * ph, s, 0, 0.08, 0.08, 0.16, dark);
  add(0, 0, 0.14, 0.42, 0.22, 0.18, tan);
  add(0.27, 0, 0.24, 0.2, 0.2, 0.18, tan);
  add(0.3, 0.07, 0.42, 0.06, 0.05, 0.06, dark);
  add(0.3, -0.07, 0.42, 0.06, 0.05, 0.06, dark);
  add(-0.24, Math.sin(d.wag) * 0.06, 0.28, 0.06, 0.06, 0.14, tan);
  parts.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z);
  for (const q of parts) drawBox(q.x - q.w / 2, q.y - q.d / 2, q.z, q.w, q.d, q.h, q.c);
}

// ----- 소원 우물 -----
function wishWell() {
  const pr = game.profile;
  if (lobby.well_timer > 0) return;
  if (pr.emeralds < 3) { sfx.denied(); showMessage("에메랄드가 3개 있어야 해요", 1.5); return; }
  pr.emeralds -= 3;
  saveProfile();
  lobby.well_timer = 0.7;
  const p = game.player;
  for (let i = 0; i < 3; i++) addSparkle(p.x, p.y, 1, { vx: (lobby.well.x - p.x) * 1.3, vy: (lobby.well.y - p.y) * 1.3, vz: 2.5, gravity: 7, life: 0.65, size: 0.9, hue: 145 });
  sfx.coin();
}

function wishResult() {
  const pr = game.profile;
  const w = lobby.well;
  sfx.splash();
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(w.x, w.y, 0.5, { vx: Math.cos(a), vy: Math.sin(a), vz: 2 + Math.random() * 1.5, gravity: 6, life: 0.6, size: 0.6, hue: 200 });
  }
  const r = Math.random() * 100;
  if (r < 38) showMessage("퐁당... 아무 일도 없었어요", 1.8, false, "#bbb");
  else if (r < 63) { pr.arrows = Math.min(CONFIG.player.maxArrows, pr.arrows + 6); showMessage("화살 6개가 떠올랐어요!", 2, false, "#e8d0a0"); sfx.emerald(); }
  else if (r < 78) { pr.potions = Math.min(CONFIG.player.maxPotions, pr.potions + 1); showMessage("물약이 떠올랐어요!", 2, false, "#ff9ad8"); sfx.potion(); }
  else if (r < 88) { pr.emeralds += 8; showMessage("에메랄드 8개! 이득!", 2, false, "#7dffb0"); sfx.buy(); }
  else if (r < 97) { const t = randomSpecialArrow(); pr.special[t] = Math.min(CONFIG.player.maxArrows, (pr.special[t] || 0) + 3); showMessage(`${arrowTypeById(t).name} 3개!`, 2, false, arrowTypeById(t).color); sfx.emerald(); }
  else { pr.emeralds += 30; showMessage("대박!! 에메랄드 30개!", 2.5, true); sfx.cheat(); }
  saveProfile();
}

// ----- 허수아비, 과녁 -----
function hitDummy(d, dmg, crit, p) {
  d.hitT = 0.35;
  d.lastCrit = crit;
  addImpact(d, p.x, p.y, crit);
  const shown = Math.round(dmg * 10) / 10;
  addFloatText(d.x, d.y, crit ? `치명타! ${shown}` : `${shown}`, crit ? "#ffd84a" : "#fff", crit ? 24 : 19);
  spawnBurst(d.x, d.y, ["#d9c27a", "#b89a50"], 5);
}

function drawDummy(d) {
  const wob = d.hitT > 0 ? Math.sin(d.hitT * 40) * 0.08 * (d.hitT / 0.35) : 0;
  if (d.kind === "target") {
    drawBox(d.x - 0.05, d.y - 0.05, 0, 0.1, 0.1, 0.7, "#6b4423");
    const c = toScreen(d.x + wob, d.y, 1.05);
    for (const [r, col] of [[30, "#ffffff"], [24, "#e23b3b"], [17, "#ffffff"], [10, "#e23b3b"], [4, "#ffd23f"]]) {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, r * ZOOM * 0.75, r * ZOOM * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    }
    return;
  }
  drawBox(d.x - 0.05, d.y - 0.05, 0, 0.1, 0.1, 0.5, "#6b4423");
  drawBox(d.x - 0.18 + wob, d.y - 0.14, 0.45, 0.36, 0.28, 0.42, "#d9c27a");
  drawBox(d.x - 0.42 + wob, d.y - 0.05, 0.7, 0.84, 0.1, 0.1, "#b89a50");
  drawBox(d.x - 0.15 + wob * 1.4, d.y - 0.15, 0.87, 0.3, 0.3, 0.3, "#e8d9a0");
  drawOnFace("y", d.x - 0.15 + wob * 1.4, d.y - 0.15, 0.87, 0.3, 0.3, 0.2, 0.4, 0.15, 0.22, "#3a2a1a");
  drawOnFace("y", d.x - 0.15 + wob * 1.4, d.y - 0.15, 0.87, 0.3, 0.3, 0.6, 0.8, 0.15, 0.22, "#3a2a1a");
}

// ----- 그리기 -----
function lobbyThings(things) {
  const L = lobby;
  things.push({ depth: L.merchant.x + L.merchant.y, x: L.merchant.x, y: L.merchant.y, draw: () => drawCharacter(L.merchant, worldLook() === 4 && typeof UNDER_LOOK !== "undefined" ? UNDER_LOOK.merchant : worldLook() === 3 && typeof MOON_LOOK !== "undefined" ? MOON_LOOK.merchant : CONFIG.colors.merchant) });
  things.push({ depth: L.smith.x + L.smith.y, x: L.smith.x, y: L.smith.y, draw: () => drawCharacter(L.smith, worldLook() === 4 && typeof UNDER_LOOK !== "undefined" ? UNDER_LOOK.smith : worldLook() === 3 && typeof MOON_LOOK !== "undefined" ? MOON_LOOK.smith : smithColors, { pose: npcPose(L.smith, "smith") }) });
  for (const c of L.crates) things.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => drawCrate(c) });
  for (const t of L.trees) if (onScreen(t.x, t.y, 3)) things.push({ depth: t.x + t.y, x: t.x, y: t.y, draw: () => drawTree(t) });
  for (const f of L.flowers) if (onScreen(f.x, f.y)) things.push({ depth: f.x + f.y - 0.5, draw: () => drawBox(f.x - 0.05, f.y - 0.05, 0, 0.1, 0.1, 0.12, f.c) });
  for (const d of dummies) things.push({ depth: d.x + d.y, x: d.x, y: d.y, draw: () => drawDummy(d) });
  things.push({ depth: L.table.x + L.table.y, x: L.table.x, y: L.table.y, draw: drawMapTable });
  things.push({ depth: L.fire.x + L.fire.y, x: L.fire.x, y: L.fire.y, draw: drawCampfire });
  hookRun("lobbyThings", things); // 다른 파일이 캠프에 물건을 더해요 (예: 트로피)
  things.push({ depth: L.well.x + L.well.y, x: L.well.x, y: L.well.y, draw: drawWell });
  things.push({ depth: L.wardrobe.x + L.wardrobe.y, x: L.wardrobe.x, y: L.wardrobe.y, draw: drawWardrobeProp });
  things.push({ depth: L.board.x + L.board.y, x: L.board.x, y: L.board.y, draw: drawBoard });
  things.push({ depth: L.anvil.x + L.anvil.y, x: L.anvil.x, y: L.anvil.y, draw: drawAnvil });
  things.push({ depth: L.furnace.x + L.furnace.y, x: L.furnace.x, y: L.furnace.y, draw: drawFurnace });
  things.push({ depth: dog.x + dog.y, x: dog.x, y: dog.y, draw: drawDog });
}

function lobbyLights() {
  const flicker = 0.9 + 0.1 * Math.sin(game.time * 13) * Math.sin(game.time * 7);
  return [
    { x: lobby.fire.x, y: lobby.fire.y, radius: 7 * flicker },
    { x: lobby.furnace.x, y: lobby.furnace.y, radius: 3.5 * flicker, power: 0.85 },
    { x: lobby.merchant.x, y: lobby.merchant.y, radius: 3, power: 0.75 },
    { x: lobby.table.x, y: lobby.table.y, radius: 3, power: 0.75 },
    { x: lobby.well.x, y: lobby.well.y, radius: 2.5, power: 0.6 },
    { x: lobby.wardrobe.x, y: lobby.wardrobe.y, radius: 2.5, power: 0.6 },
  ];
}

function drawCrate(c) {
  drawBox(c.x - 0.38, c.y - 0.38, 0, 0.76, 0.76, 0.7, "#9a6b3a");
  drawBox(c.x - 0.39, c.y - 0.05, 0.3, 0.78, 0.1, 0.1, "#6e4a24");
}

function drawTree(t) {
  if (typeof worldLook === "function" && worldLook() === 2) return drawCoralTree(t);
  if (typeof worldLook === "function" && worldLook() === 3 && typeof drawCrystalTree === "function") return drawCrystalTree(t); // 달 마을 (moon.js)
  if (typeof worldLook === "function" && worldLook() === 4 && typeof drawBigShroom === "function") return drawBigShroom(t); // 버섯 등불 마을 (under.js)
  drawBox(t.x - 0.15, t.y - 0.15, 0, 0.3, 0.3, 1.2, "#6b4a2a");
  drawBox(t.x - 0.6, t.y - 0.6, 1.0, 1.2, 1.2, 0.8, "#3f7a3a");
  drawBox(t.x - 0.4, t.y - 0.4, 1.8, 0.8, 0.8, 0.5, "#4f9346");
}

function drawMapTable() {
  const t = lobby.table;
  for (const [ox, oy] of [[-0.5, -0.32], [0.42, -0.32], [-0.5, 0.24], [0.42, 0.24]]) drawBox(t.x + ox, t.y + oy, 0, 0.08, 0.08, 0.5, "#5b3c1e");
  drawBox(t.x - 0.6, t.y - 0.4, 0.5, 1.2, 0.8, 0.1, "#8a5a2e");
  const paper = [toScreen(t.x - 0.45, t.y - 0.28, 0.61), toScreen(t.x + 0.45, t.y - 0.28, 0.61), toScreen(t.x + 0.45, t.y + 0.28, 0.61), toScreen(t.x - 0.45, t.y + 0.28, 0.61)];
  fillPoly(paper, "#ead9a7");
  const c = toScreen(t.x + 0.1, t.y, 0.61);
  ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(c.x - 6, c.y - 3); ctx.lineTo(c.x + 6, c.y + 3); ctx.moveTo(c.x + 6, c.y - 3); ctx.lineTo(c.x - 6, c.y + 3); ctx.stroke();
  ctx.strokeStyle = "rgba(90,60,30,0.7)"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  const a = toScreen(t.x - 0.35, t.y + 0.15, 0.61);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(a.x + 10, a.y - 20, c.x, c.y); ctx.stroke();
  ctx.setLineDash([]);
}

// 바닷속 마을: 나무 대신 산호, 모닥불 대신 빛나는 말미잘 등불, 우물 대신 큰 조개
function drawCoralTree(t) {
  const k = (Math.floor(t.x * 7 + t.y * 3) % 3 + 3) % 3, col = ["#ff7a8a", "#ffb04a", "#c87aff"][k], dk = ["#c84a5a", "#c8802a", "#8a4ac8"][k];
  drawBox(t.x - 0.18, t.y - 0.18, 0, 0.36, 0.36, 0.7, dk);
  drawBox(t.x - 0.5, t.y - 0.12, 0.6, 0.3, 0.24, 0.8, col); drawBox(t.x + 0.2, t.y - 0.1, 0.5, 0.26, 0.24, 1.0, col);
  drawBox(t.x - 0.1, t.y - 0.4, 0.7, 0.24, 0.26, 1.1, col);
  const sw = Math.sin(game.time * 1.6 + t.x) * 0.06;
  drawBox(t.x + 0.45 + sw, t.y + 0.3, 0, 0.1, 0.1, 1.2, "#3f9a6a"); drawBox(t.x - 0.55 - sw, t.y + 0.25, 0, 0.1, 0.1, 0.9, "#4fae7a");
}
function drawSeaLantern() {
  const f = lobby.fire, t = game.time;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; drawBox(f.x + Math.cos(a) * 0.5 - 0.1, f.y + Math.sin(a) * 0.5 - 0.1, 0, 0.2, 0.2, 0.12, "#6a8a92"); }
  drawBox(f.x - 0.25, f.y - 0.25, 0, 0.5, 0.5, 0.25, "#3a7a8a");
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + t * 0.5; const h = 0.35 + 0.12 * Math.sin(t * 3 + i); drawBox(f.x + Math.cos(a) * 0.18 - 0.05, f.y + Math.sin(a) * 0.18 - 0.05, 0.25, 0.1, 0.1, h, i % 2 ? "#7ff0ff" : "#c8a8ff"); }
  drawBox(f.x - 0.1, f.y - 0.1, 0.3, 0.2, 0.2, 0.3 + 0.05 * Math.sin(t * 4), "#e6fbff");
  glowAt(f.x, f.y, 0.4, 60, "120,220,255", 0.4);
}
function drawGiantClam(w) {
  drawBox(w.x - 0.7, w.y - 0.6, 0, 1.4, 1.2, 0.35, "#e8c8b8");
  drawBox(w.x - 0.62, w.y - 0.52, 0.35, 1.24, 1.04, 0.06, "#ffe6f0");
  const open = 0.25 + 0.08 * Math.sin(game.time * 1.5);
  drawBox(w.x - 0.7, w.y - 0.75, 0.42 + open, 1.4, 0.3, 0.5, "#dcb4a4");
  drawBox(w.x - 0.12, w.y - 0.12, 0.42, 0.24, 0.24, 0.22, "#ffffff");
  glowAt(w.x, w.y, 0.6, 30, "255,240,255", 0.3);
}

function drawCampfire() {
  if (typeof worldLook === "function" && worldLook() === 2) return drawSeaLantern();
  if (typeof worldLook === "function" && worldLook() === 3 && typeof drawMoonLamp === "function") return drawMoonLamp(lobby.fire);
  if (typeof worldLook === "function" && worldLook() === 4 && typeof drawShroomLamp === "function") return drawShroomLamp(lobby.fire); // 큰 빛버섯 등불 (under.js)
  const f = lobby.fire;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    drawBox(f.x + Math.cos(a) * 0.5 - 0.1, f.y + Math.sin(a) * 0.5 - 0.1, 0, 0.2, 0.2, 0.12, "#7c7c80");
  }
  drawBox(f.x - 0.4, f.y - 0.08, 0, 0.8, 0.16, 0.14, "#4a2e16");
  drawBox(f.x - 0.08, f.y - 0.4, 0.02, 0.16, 0.8, 0.14, "#5b3a1e");
  const t = game.time;
  const flames = [
    [0, 0, 0.55 + 0.1 * Math.sin(t * 11), "#ff7a1a"],
    [0.1, -0.08, 0.35 + 0.08 * Math.sin(t * 13 + 1), "#ffb321"],
    [-0.1, 0.06, 0.4 + 0.08 * Math.sin(t * 9 + 2), "#ff9a1f"],
    [0, 0.02, 0.25 + 0.06 * Math.sin(t * 15), "#fff2a8"],
  ];
  for (const [ox, oy, h, c] of flames) drawBox(f.x + ox - 0.1, f.y + oy - 0.1, 0.14, 0.2, 0.2, h, c);
  glowAt(f.x, f.y, 0.4, 60, "255,160,60", 0.4);
}

function glowAt(x, y, z, r, rgb, a) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const s = toScreen(x, y, z);
  const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * ZOOM);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(s.x, s.y, r * ZOOM, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawWell() {
  const w = lobby.well;
  if (typeof worldLook === "function" && worldLook() === 2) return drawGiantClam(w);
  if (typeof worldLook === "function" && worldLook() === 3 && typeof drawWishCrater === "function") return drawWishCrater(w);
  if (typeof worldLook === "function" && worldLook() === 4 && typeof drawCrystalSpring === "function") return drawCrystalSpring(w); // 소원 수정 샘 (under.js)
  // 둥근 돌 우물
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x = w.x + Math.cos(a) * 0.62, y = w.y + Math.sin(a) * 0.62;
    if (x + y < w.x + w.y - 0.2) drawBox(x - 0.17, y - 0.17, 0, 0.34, 0.34, 0.5, i % 2 ? "#8c8c94" : "#7a7a82");
  }
  const water = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; water.push(toScreen(w.x + Math.cos(a) * 0.48, w.y + Math.sin(a) * 0.48, 0.42)); }
  fillPoly(water, `hsl(205, 70%, ${38 + 4 * Math.sin(game.time * 2)}%)`);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x = w.x + Math.cos(a) * 0.62, y = w.y + Math.sin(a) * 0.62;
    if (x + y >= w.x + w.y - 0.2) drawBox(x - 0.17, y - 0.17, 0, 0.34, 0.34, 0.5, i % 2 ? "#8c8c94" : "#7a7a82");
  }
  // 지붕
  drawBox(w.x - 0.75, w.y - 0.08, 0, 0.12, 0.16, 1.5, "#6b4a2a");
  drawBox(w.x + 0.63, w.y - 0.08, 0, 0.12, 0.16, 1.5, "#6b4a2a");
  drawBox(w.x - 0.95, w.y - 0.5, 1.5, 1.9, 1.0, 0.18, "#a0522d");
}

function drawWardrobeProp() {
  const w = lobby.wardrobe;
  drawBox(w.x - 0.5, w.y - 0.35, 0, 1.0, 0.7, 1.7, "#7a4f2a");
  drawOnFace("y", w.x - 0.5, w.y - 0.35, 0, 1.0, 0.7, 0.08, 0.47, 0.15, 1.55, "#8e5f34");
  drawOnFace("y", w.x - 0.5, w.y - 0.35, 0, 1.0, 0.7, 0.53, 0.92, 0.15, 1.55, "#8e5f34");
  drawOnFace("y", w.x - 0.5, w.y - 0.35, 0, 1.0, 0.7, 0.42, 0.46, 0.8, 0.95, "#ffd23f");
  drawOnFace("y", w.x - 0.5, w.y - 0.35, 0, 1.0, 0.7, 0.54, 0.58, 0.8, 0.95, "#ffd23f");
  // 옆 거울
  drawOnFace("x", w.x - 0.5, w.y - 0.35, 0, 1.0, 0.7, 0.15, 0.85, 0.5, 1.5, `hsl(195, 50%, ${70 + 8 * Math.sin(game.time * 1.5)}%)`);
}

function drawBoard() {
  const b = lobby.board;
  drawBox(b.x - 0.5, b.y - 0.05, 0, 0.1, 0.1, 1.2, "#5b3c1e");
  drawBox(b.x + 0.4, b.y - 0.05, 0, 0.1, 0.1, 1.2, "#5b3c1e");
  drawBox(b.x - 0.6, b.y - 0.08, 0.55, 1.2, 0.16, 0.75, "#9a6b3a");
  for (let i = 0; i < 3; i++) drawOnFace("y", b.x - 0.6, b.y - 0.08, 0.55, 1.2, 0.16, 0.12 + i * 0.28, 0.32 + i * 0.28, 0.2 + (i % 2) * 0.1, 0.55, ["#f2e6c2", "#e8d9a0", "#f7efd8"][i]);
}

function drawAnvil() {
  const a = lobby.anvil;
  drawBox(a.x - 0.2, a.y - 0.15, 0, 0.4, 0.3, 0.3, "#3f3f46");
  drawBox(a.x - 0.32, a.y - 0.18, 0.3, 0.64, 0.36, 0.16, "#55555e");
}

function drawFurnace() {
  const f = lobby.furnace;
  drawBox(f.x - 0.55, f.y - 0.55, 0, 1.1, 1.1, 1.0, "#6e6a66");
  drawOnFace("y", f.x - 0.55, f.y - 0.55, 0, 1.1, 1.1, 0.25, 0.75, 0.15, 0.55, `hsl(${25 + 8 * Math.sin(game.time * 9)}, 100%, 55%)`);
  drawBox(f.x - 0.2, f.y - 0.2, 1.0, 0.4, 0.4, 0.8, "#5a5652");
  glowAt(f.x, f.y + 0.4, 0.4, 45, "255,140,40", 0.35);
}

// 말 걸 수 있는 것 머리 위 이름과 안내
function drawNpcLabels() {
  if (game.scene === "lobby") {
    for (const n of npcs) {
      if (n.dog) continue;
      const s = toScreen(n.x, n.y, 1.9);
      text(n.label, s.x, s.y, 14 * ZOOM * 0.8, "#ffe27a", "center");
    }
  }
  const n = game.nearNpc;
  if (n && !game.overlay) {
    const s = toScreen(n.x, n.y, n.dog ? 0.9 : 1.9);
    const bob = Math.sin(game.time * 5) * 3;
    const how = touch.show ? `"${n.short}" 버튼` : "E 키";
    text(`${how}: ${n.prompt}`, s.x, s.y - 22 + bob, 17 * ZOOM * 0.8, "#7dffb0", "center");
  }
}
