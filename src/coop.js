// ===== 둘이 하기 (한 태블릿 / 한 키보드에서 2인 협동) =====
// 캠프 메뉴 "둘이 하기: 켜기" 를 누르면 친구(2번 주인공)가 나타나요.
//   game.player  = 1번 (카메라·기존 코드)   game.players = [1번, 2번]
//   1번 키보드: WASD 이동, Space 공격, 왼쪽 Shift 구르기, L 활, Q 물약, Tab 화살 종류
//   2번 키보드: 방향키 이동, Enter 또는 / 공격, . 또는 오른쪽 Shift 구르기, ' 또는 ] 활, ; 물약
//   터치: 화면 왼쪽 절반 = 1번 (조이스틱 왼쪽 아래), 오른쪽 절반 = 2번 (조이스틱 오른쪽 아래)
// 규칙: 한 명이 쓰러지면 유령이 되어 따라다녀요. 친구가 옆에 3초 서 있으면 부활(하트 절반),
//       쉬움·보통은 10초 뒤 저절로 부활. 둘 다 쓰러지면 지금 규칙(다시 도전 / 하드모드 결과창).
//       둘이 하면 몬스터 체력 x1.5, 보스 x1.6 (보상은 같아요).

CONFIG.coop = {
  monsterHp: 1.5, bossHp: 1.6,
  reviveTime: 3, reviveRange: 1.6, autoRevive: 10, reviveHp: 0.5,
  catchUp: 13,        // 이만큼 멀어지면 뒤처진 친구가 옆으로 순간이동
  minZoom: 0.7,       // 멀어지면 화면을 이만큼까지 멀리
};

// 2번 친구 옷 색 (옷장 대신 메뉴에서 바꿔요)
const COOP_COLORS = [
  { name: "파랑", tint: "#3a7bd5", hair: "#e0b040", skin: "#f1c27d", label: "#6fb6ff" },
  { name: "초록", tint: "#3faa5a", hair: "#7a4a2a", skin: "#e0ac69", label: "#7dffb0" },
  { name: "보라", tint: "#8a4fd0", hair: "#222222", skin: "#c68642", label: "#c9a0ff" },
  { name: "주황", tint: "#e0782a", hair: "#b0302a", skin: "#ffdbac", label: "#ffb070" },
];

const coop = { tiles: null, allDown: false, zoomStep: 1 };
const touch2 = { joyId: null, joyX0: 0, joyY0: 0, joyX: 0, joyY: 0, moveX: 0, moveY: 0 };
var coopZoomMul = 1; // iso.js 가 읽어요

// 저장을 coop.js 보다 먼저 읽는 경우도 있어서 늘 이걸로 꺼내요
function coopPr() { const pr = game.profile; if (!pr.coop) pr.coop = { on: false, color: 0 }; return pr.coop; }
function coopOn() { return !!(game.profile && coopPr().on); }
// 여러 명이 같이 있는지 (한 태블릿이든 같은 Wi-Fi 든). 그리기는 이것으로.
function coopActive() { return !!(game.players && game.players.length > 1); }
// 한 태블릿 둘이 하기 (키보드·화면 나누기) 일 때만
function coopLocal() { return coopOn() && coopActive(); }
// 이 기기가 세상을 계산하는지 (혼자·한 태블릿·같은 Wi-Fi 방장). 같은 Wi-Fi 친구 기기는 계산 안 해요
function coopNetGuest() { return typeof netplay !== "undefined" && netplay.role === "guest"; }
function coopSim() { return coopActive() && !coopNetGuest(); }
// 번호별 색 (1번 빨강, 2~4번 COOP_COLORS)
function coopColorOf(pid) { if (pid === 1) return { label: "#ff7a7a" }; const c = pid === 2 && coopOn() ? coopPr().color : (pid - 2) % COOP_COLORS.length; return COOP_COLORS[c] || COOP_COLORS[0]; }
function coopFriend() { return game.players && game.players[1]; }
// 머리 위·안내에 쓰는 이름: 캐릭터 이름 (같이 하기 이름 규칙을 통과한 것만: 한글·영어·숫자·띄어쓰기 12자), 아니면 번호
function playerLabel(q) {
  const n = typeof netCleanName === "function" ? netCleanName(q && q.netName) : "";
  return n || `${(q && q.pid) || 1}번`;
}

// 한 태블릿 둘이 하기는 쓰지 않아요 (화면이 좁아서). 메뉴에서 숨기고, 둘이 하는 엔진(game.players 등)은
// 나중에 같은 Wi-Fi 네트워크 둘이 하기에서 다시 써요.
const COOP_LOCAL_MENU = false;
hookOn("profileLoaded", (pr) => {
  pr.coop = pr.coop || { on: false, color: 0 };
  if (!COOP_LOCAL_MENU) pr.coop.on = false;
  if (pr.coop.color === undefined) pr.coop.color = 0;
}, 50);

// ----- 친구 만들기 -----
function coopSpawnFriend(p1) {
  // 화면에서 옆으로 나란히 서게 (x+, y- 방향이 화면 오른쪽)
  const s = findFreeSpot(p1.x + 1.1, p1.y - 1.1, 0.35, 3) || findFreeSpot(p1.x, p1.y, 0.35, 4) || { x: p1.x, y: p1.y };
  const p2 = createPlayer(s.x, s.y);
  p1.pid = 1; p2.pid = 2;
  p2.faceX = p1.faceX; p2.faceY = p1.faceY;
  game.players = [p1, p2];
  coop.tiles = world.tiles;
  coop.allDown = false;
  return p2;
}
hookOn("playerPlaced", (p1) => { if (coopOn() && game.scene !== "title") coopSpawnFriend(p1); }, 50);

function coopToggle() {
  const pr = game.profile; coopPr();
  pr.coop.on = !pr.coop.on;
  saveProfile();
  if (pr.coop.on) { coopSpawnFriend(game.player); showMessage("친구가 왔어요! 2번은 방향키 또는 화면 오른쪽", 3, false, COOP_COLORS[pr.coop.color].label); sfx.levelUp(); }
  else { game.players = null; coopSetZoom(1); showMessage("혼자 하기로 바꿨어요", 2); }
}

hookOn("menuItems", (items) => {
  if (!COOP_LOCAL_MENU || game.scene !== "lobby") return;
  const pr = game.profile; coopPr();
  items.push({ label: pr.coop.on ? "둘이 하기: 켜짐 (끄기)" : "둘이 하기: 꺼짐 (켜기)", act: coopToggle });
  if (pr.coop.on) items.push({ label: `친구 옷 색: ${COOP_COLORS[pr.coop.color].name} (바꾸기)`, act: () => { pr.coop.color = (pr.coop.color + 1) % COOP_COLORS.length; saveProfile(); } });
}, 40);

// ----- 겉모습: 2번은 옷 색을 섞어서 구분 -----
hookOn("playerLook", (look, p) => {
  if (!p.pid || p.pid < 2) return look;
  if (p.netLook) look = { ...look, ...p.netLook }; // 같은 Wi-Fi 친구: 자기 기기 모습
  const c = coopColorOf(p.pid);
  return { ...look, hair: c.hair, skin: c.skin, shirt: mixHex(look.shirt, c.tint, 0.55), pants: mixHex(look.pants, c.tint, 0.35) };
}, 50);

// ----- 조작 나누기 -----
hookOn("playerInput", (inp, p) => {
  if (!coopLocal()) return inp;
  if (p.pid === 2) {
    const q = {
      sx: touch2.moveX, sy: touch2.moveY,
      attackPressed: wasPressed("Enter", "NumpadEnter", "Slash", "Numpad0", "T2Attack"), attackHeld: isDown("Enter", "NumpadEnter", "Slash", "Numpad0", "T2Attack"),
      rollPressed: wasPressed("Period", "ShiftRight", "NumpadDecimal", "T2Roll"),
      bowHeld: isDown("Quote", "BracketRight", "Numpad1", "T2Bow"), arrowTypePressed: wasPressed("Backslash"),
      potionPressed: wasPressed("Semicolon", "T2Potion"),
    };
    if (isDown("ArrowLeft")) q.sx -= 1;
    if (isDown("ArrowRight")) q.sx += 1;
    if (isDown("ArrowUp")) q.sy -= 1;
    if (isDown("ArrowDown")) q.sy += 1;
    return q;
  }
  // 1번: 방향키·오른쪽 Shift 는 2번 몫이라 빼요
  const q = {
    sx: touch.moveX, sy: touch.moveY,
    attackPressed: wasPressed("Space", "KeyJ", "TouchAttack"), attackHeld: isDown("Space", "KeyJ", "TouchAttack"),
    rollPressed: wasPressed("ShiftLeft", "KeyK", "TouchRoll"),
    bowHeld: isDown("KeyL", "TouchBow"), arrowTypePressed: wasPressed("Tab", "TouchArrowType"),
    potionPressed: wasPressed("KeyQ", "TouchPotion"),
  };
  if (isDown("KeyA")) q.sx -= 1;
  if (isDown("KeyD")) q.sx += 1;
  if (isDown("KeyW")) q.sy -= 1;
  if (isDown("KeyS")) q.sy += 1;
  return q;
}, 50);

// ----- 터치: 화면을 좌우로 나눠요 -----
hookOn("touchButtons", (list, s) => {
  if (!coopLocal()) return list;
  const W = view.w, H = view.h, k = s * 0.82;
  const mid = W / 2;
  // 1번 버튼: 왼쪽 절반의 가운데 아래 (조이스틱은 왼쪽 아래 구석)
  const place = { TouchAttack: [mid - 95, H - 100, 52], TouchRoll: [mid - 200, H - 58, 36], TouchBow: [mid - 180, H - 170, 38], TouchArrowType: [mid - 250, H - 215, 22], TouchPotion: [mid - 70, H - 215, 30], TouchUse: [mid - 130, H - 265, 38] };
  const out = [];
  const nearP2 = game.nearNpc && game.nearWho && game.nearWho !== game.player;
  for (const b of list) {
    if (b.code === "TouchUse" && nearP2) continue; // 2번이 가까이 있으면 2번 쪽에 "열기" 버튼
    const pl = place[b.code];
    if (pl) out.push({ ...b, x: pl[0] * 1 + (mid - pl[0]) * (1 - k), y: H - (H - pl[1]) * k, r: pl[2] * k });
    else out.push(b);
  }
  // 2번 버튼: 오른쪽 절반 (거울처럼)
  const p2 = coopFriend();
  const mir = (x) => W - x;
  out.push({ code: "T2Attack", label: "공격", x: mir(place.TouchAttack[0] * 1 + (mid - place.TouchAttack[0]) * (1 - k)), y: H - (H - place.TouchAttack[1]) * k, r: place.TouchAttack[2] * k, color: "#3a7bd5" });
  out.push({ code: "T2Roll", label: "구르기", x: mir(place.TouchRoll[0] * 1 + (mid - place.TouchRoll[0]) * (1 - k)), y: H - (H - place.TouchRoll[1]) * k, r: place.TouchRoll[2] * k, color: "#4aa3df" });
  out.push({ code: "T2Bow", label: "활", x: mir(place.TouchBow[0] * 1 + (mid - place.TouchBow[0]) * (1 - k)), y: H - (H - place.TouchBow[1]) * k, r: place.TouchBow[2] * k, color: p2 && p2.bow.legendary ? rainbow(game.time * 200, 50) : "#b07a2a" });
  if (nearP2) out.push({ code: "T2Use", label: game.nearNpc.short, x: mir(place.TouchUse[0] * 1 + (mid - place.TouchUse[0]) * (1 - k)), y: H - (H - place.TouchUse[1]) * k, r: place.TouchUse[2] * k, color: "#3fbf6f" });
  if (game.scene === "dungeon") out.push({ code: "T2Potion", label: `물약 ${game.profile.potions}`, x: mir(place.TouchPotion[0] * 1 + (mid - place.TouchPotion[0]) * (1 - k)), y: H - (H - place.TouchPotion[1]) * k, r: place.TouchPotion[2] * k, color: "#c64fa0" });
  return out;
}, 50);

hookOn("touchJoyStart", (e, x, y) => {
  if (!coopLocal()) return false;
  if (x < view.w * 0.5) return false;      // 왼쪽은 1번 (원래 조이스틱)
  if (touch2.joyId === null) {
    touch2.joyId = e.pointerId;
    touch2.joyX0 = touch2.joyX = x; touch2.joyY0 = touch2.joyY = y;
    touch2.moveX = touch2.moveY = 0;
  }
  return true;
}, 50);
hookOn("touchMove", (e) => {
  if (e.pointerId !== touch2.joyId) return;
  let dx = e.clientX - touch2.joyX0, dy = e.clientY - touch2.joyY0;
  const d = Math.hypot(dx, dy);
  if (d > JOY_R) { touch2.joyX0 += (dx / d) * (d - JOY_R); touch2.joyY0 += (dy / d) * (d - JOY_R); dx = e.clientX - touch2.joyX0; dy = e.clientY - touch2.joyY0; }
  touch2.joyX = e.clientX; touch2.joyY = e.clientY;
  const len = Math.hypot(dx, dy);
  touch2.moveX = len > 8 ? dx / JOY_R : 0;
  touch2.moveY = len > 8 ? dy / JOY_R : 0;
}, 50);
hookOn("touchEnd", (e) => { if (e.pointerId === touch2.joyId) { touch2.joyId = null; touch2.moveX = touch2.moveY = 0; } }, 50);
hookOn("touchDraw", () => {
  if (!coopLocal()) return;
  const js = touchScale();
  const on = touch2.joyId !== null;
  const bx = on ? touch2.joyX0 : view.w - 120 * Math.max(0.8, js), by = on ? touch2.joyY0 : view.h - 120 * Math.max(0.8, js);
  ctx.save();
  ctx.globalAlpha = on ? 0.6 : 0.25; ctx.fillStyle = "#cfe3ff";
  ctx.beginPath(); ctx.arc(bx, by, JOY_R, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = on ? 0.9 : 0.4; ctx.fillStyle = "#9cc4ff";
  ctx.beginPath(); ctx.arc(on ? bx + touch2.moveX * JOY_R : bx, on ? by + touch2.moveY * JOY_R : by, JOY_R * 0.47, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (!on) text("2번 이동", bx, by + 6, 15, "rgba(255,255,255,0.8)", "center");
  // 1번 조이스틱 이름, 가운데 나눔 선
  const b1x = 120 * Math.max(0.8, js), b1y = view.h - 120 * Math.max(0.8, js);
  if (touch.joyId === null) text("1번", b1x, b1y - JOY_R - 8, 15, "#ff9a9a", "center");
  if (!on) text("2번", bx, by - JOY_R - 8, 15, COOP_COLORS[coopPr().color].label, "center");
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = "#ffffff"; ctx.fillRect(view.w / 2 - 1, view.h * 0.45, 2, view.h * 0.55); ctx.restore();
}, 50);

// ----- 카메라: 두 사람 가운데, 멀어지면 화면을 멀리 -----
function coopSetZoom(z) {
  if (Math.abs(z - coopZoomMul) < 0.001) return;
  coopZoomMul = z;
  resizeCanvas();
}
hookOn("cameraTarget", (t, cx, cy) => {
  if (!coopLocal()) { if (coopZoomMul !== 1) coopSetZoom(1); return t; } // 같은 Wi-Fi 는 각자 자기 주인공을 따라가요
  const [p1, p2] = game.players;
  const mx = (cx + p2.x) / 2, my = (cy + p2.y) / 2;
  const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  // 0.05 단위로만 바꿔요 (캔버스 크기를 자주 바꾸지 않게)
  const want = Math.max(CONFIG.coop.minZoom, Math.min(1, 1 - Math.max(0, d - 5) * 0.045));
  const step = Math.round(want * 20) / 20;
  if (Math.abs(step - coopZoomMul) >= 0.05) coopSetZoom(step);
  return { x: mx, y: my };
}, 50);

// ----- 매 프레임: 따라가기·유령·부활·난이도 -----
function coopSnap(q, to) {
  const s = findFreeSpot(to.x + 1.0, to.y - 1.0, 0.35, 4) || findFreeSpot(to.x, to.y, 0.35, 5) || { x: to.x, y: to.y };
  q.x = s.x; q.y = s.y; q.rollTimer = 0; q.move = null;
  for (let i = 0; i < 10; i++) addSparkle(q.x, q.y, Math.random(), { vz: 1.5, life: 0.5, size: 0.5, gold: true });
}

function coopRevive(q, frac) {
  q.hp = Math.max(1, Math.round(q.maxHp * frac * 2) / 2);
  q.ghost = false; q.ghostT = 0; q.reviveT = 0; q.hurtTimer = 2;
  addRing(q.x, q.y, { speed: 5, life: 0.6, gold: true });
  addFloatText(q.x, q.y, "부활!", "#7dffb0", 22);
  sfx.levelUp();
}

hookOn("playerDown", (p) => {
  if (!coopSim()) return false;
  const others = alivePlayers().filter((q) => q !== p);
  if (others.length) {
    p.ghost = true; p.ghostT = 0; p.reviveT = 0;
    showMessage(`${josa(playerLabel(p), "이/가")} 쓰러졌어요! 친구 옆에 서 있으면 부활해요`, 3, false, "#ffb070");
    return true;
  }
  coop.allDown = true; // 둘 다 쓰러짐 -> 원래 규칙 (다시 도전 / 결과창)
  return false;
}, 50);

hookOn("playersUpdated", (dt) => {
  if (!coopSim()) return;
  const p1 = game.players[0], rest = game.players.slice(1);
  // 장면(보스방·다시 도전·탑 층·포털)이 바뀌면 친구들도 같이
  if (coop.tiles !== world.tiles) { coop.tiles = world.tiles; for (const q of rest) coopSnap(q, p1); }
  // 둘 다 쓰러졌다가 1번이 다시 일어나면(다시 도전) 친구도 같이 일어나요
  if (coop.allDown && p1.hp > 0) {
    coop.allDown = false;
    for (const q of game.players) if (q.hp <= 0) { coopSnap(q, p1); coopRevive(q, 1); }
  }
  const alive = alivePlayers();
  // 너무 멀어지면 뒤처진 쪽을 앞사람 옆으로
  // (한 태블릿일 때만: 같은 Wi-Fi 는 각자 화면이라 멀어져도 돼요)
  if (coopLocal()) for (const q of rest) if (q.hp > 0 && p1.hp > 0 && Math.hypot(p1.x - q.x, p1.y - q.y) > CONFIG.coop.catchUp) {
    coopSnap(q, p1);
    addFloatText(q.x, q.y, "슝!", "#ffe27a", 18);
  }
  // 유령: 친구를 따라다니고, 친구가 옆에 있으면 부활 게이지
  for (const q of game.players) {
    if (q.hp > 0 || !alive.length) continue;
    q.ghost = true;
    q.ghostT = (q.ghostT || 0) + dt;
    const f = alive[0];
    const dx = f.x - q.x, dy = f.y - q.y, d = Math.hypot(dx, dy);
    if (d > 1.1) { const sp = Math.min(d - 1.1, 4.5 * dt); q.x += (dx / d) * sp; q.y += (dy / d) * sp; q.faceX = dx / d; q.faceY = dy / d; q.moving = true; q.walkTime += dt; }
    else q.moving = false;
    if (d < CONFIG.coop.reviveRange) q.reviveT = (q.reviveT || 0) + dt;
    else q.reviveT = Math.max(0, (q.reviveT || 0) - dt * 2);
    const easy = ["easy", "normal"].includes(game.profile.difficulty);
    if (q.reviveT >= CONFIG.coop.reviveTime) coopRevive(q, CONFIG.coop.reviveHp);
    else if (easy && q.ghostT >= CONFIG.coop.autoRevive) { coopSnap(q, f); coopRevive(q, CONFIG.coop.reviveHp); }
  }
  // 인원 수에 따라 몬스터가 더 튼튼해요 (party.js partyScale). 인원이 바뀌면 체력 비율은 그대로, 최대 체력만 다시
  if (game.scene === "dungeon") coopScaleMonsters(game.players.length);
}, 50);
function coopScaleMonsters(n) {
  const S = typeof partyScale === "function" ? partyScale(n) : { monsterHp: CONFIG.coop.monsterHp, bossHp: CONFIG.coop.bossHp, damage: 1 };
  for (const m of monsters) {
    if (m.hp <= 0 || m.clone || m.b2Decoy || (m.def && m.def.untargetable)) continue;
    const k = m.boss ? S.bossHp : S.monsterHp, kd = S.damage || 1;
    const k0 = m._coopK || 1, d0 = m._coopD || 1;
    if (k !== k0) { m.maxHp *= k / k0; m.hp *= k / k0; m._coopK = k; }
    if (kd !== d0 && typeof m.damage === "number") { m.damage *= kd / d0; m._coopD = kd; }
  }
}


// ----- 기술 장판: 노린 사람 말고 친구도 맞아요 (소환·치유 같은 효과는 한 번만) -----
const COOP_NO_SPLASH = new Set(["summon", "heal", "shield", "buffAllies", "enrage", "teleport", "charge"]);
function coopHitOther(c, q) {
  const ab = c.ab, e = ab.effect, m = c.m;
  if (!abilityHurts(ab) || COOP_NO_SPLASH.has(e.type)) return;
  let hit;
  if (e.type === "losBlast") hit = !(typeof coverBetween === "function" && coverBetween(m.x, m.y, q.x, q.y, e.cover));
  else if (e.type === "b2_doomBlast") hit = lineOfSight(m.x, m.y, q.x, q.y);
  else if (e.type.startsWith("b2_")) return; // 뒤쪽 보스 장판(회전 광선·폭풍·밀물)은 bosses_b 가 두 사람 다 처리해요
  else hit = insideShape(c, q.x, q.y, q.r * 0.6);
  if (!hit) return;
  if (q.rollTimer > 0) { addFloatText(q.x, q.y, "회피!", "#9be8ff", 18); return; }
  const h0 = q.hp;
  hurtPlayer(q, abilityDamage(c), m);
  if (q.hp >= h0) return;
  if (e.slow || e.type === "slow") q.abSlow = Math.max(q.abSlow || 0, e.duration || e.slow || 2);
  if (e.type === "burn") { q.abBurn = e.duration || 3; q.abBurnTick = 0.5; q.abBurnDmg = abilityDamage(c) * 0.25; }
  if (e.type === "knockback" || e.type === "pull") {
    const dx = q.x - m.x, dy = q.y - m.y, d = Math.hypot(dx, dy) || 1, s = (e.type === "pull" ? -1 : 1) * Math.min(e.distance || 2.5, e.type === "pull" ? d - 1 : 9);
    moveEntity(q, (dx / d) * s, (dy / d) * s);
  }
}
hookOn("castResolved", (c, p) => {
  if (!coopSim()) return;
  for (const q of alivePlayers()) if (q !== p) coopHitOther(c, q);
}, 15);

// ----- 그리기: 유령, 번호표, 2번 하트 -----
hookOn("worldThings", (things) => {
  if (!coopActive()) return;
  for (const q of game.players) {
    if (q.hp <= 0) things.push({ depth: q.x + q.y, draw: () => {
      ctx.save(); ctx.globalAlpha = 0.38 + 0.08 * Math.sin(game.time * 5); q.hurtTimer = 0; drawPlayer(q); ctx.restore();
      // 부활 게이지
      const k = Math.min(1, (q.reviveT || 0) / CONFIG.coop.reviveTime);
      const s = toScreen(q.x, q.y, 1.7);
      ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.arc(s.x, s.y, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#7dffb0"; ctx.beginPath(); ctx.arc(s.x, s.y, 14, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke(); ctx.restore();
      text("✚", s.x, s.y + 5, 14, "#ffffff", "center");
    } });
    things.push({ depth: q.x + q.y + 50, draw: () => {
      const s = toScreen(q.x, q.y, 2.05);
      const col = coopColorOf(q.pid).label;
      text(playerLabel(q), s.x, s.y, 15, col, "center"); // 캐릭터 이름 (검사를 통과한 것만, 아니면 번호)
      if (q !== game.player && q.hp > 0) {
        const w = 34, f = Math.max(0, q.hp / q.maxHp);
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(s.x - w / 2, s.y + 4, w, 5);
        ctx.fillStyle = f > 0.35 ? "#ff6b6b" : "#ffb070"; ctx.fillRect(s.x - w / 2, s.y + 4, w * f, 5);
      }
    } });
  }
}, 60);

hookOn("hudDraw", () => {
  if (!coopLocal()) return;
  const p2 = coopFriend(), W = view.w;
  const col = COOP_COLORS[coopPr().color].label;
  const hs = 15, shown = Math.min(p2.maxHp, 20);
  const x0 = W / 2 - 40;
  // 보스 체력바가 보이면 그 아래로 내려요
  const bossBar = monsters.some((m) => m.boss && m.aggro && m.hp > 0);
  const y0 = bossBar ? 96 : 16;
  text("2번", x0 - 8, y0 + 14, 16, col, "right");
  for (let i = 0; i < shown; i++) {
    const fill = p2.hp >= i + 1 ? 1 : p2.hp >= i + 0.5 ? 0.5 : 0;
    drawHeart(x0 + (i % 10) * (hs + 3), y0 + Math.floor(i / 10) * (hs + 2), hs, fill);
  }
  if (p2.hp <= 0) text("유령 · 친구 옆에 서면 부활", x0, y0 + Math.ceil(shown / 10) * (hs + 2) + 14, 13, "#ffb070");
  if (view.w < 700) text("둘이 하기는 태블릿처럼 큰 화면이 좋아요", W / 2, view.h - 14, 13, "#ffe27a", "center");
}, 60);
