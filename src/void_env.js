// ===== 월드 5 "공허" 환경 (설계서 docs/design/world5-void.md 1·2장) =====
//   ① 색 수정 crystals   칼·화살·마법이 지나가면 9초 켜짐. 빛(3.2칸) 안은 색이 돌아오고 그림자 몬스터가 들켜요. 맵의 수정을 다 한 번씩 켜면 에메랄드 5개
//   ② 공허 구멍 holes     방을 가로지르는 깜깜한 띠. 다리 위가 아니면 빠져요: 하트 1(쉬움 0.5, 하트 0.5 밑으로는 안 내려가요) + 가까운 안전 칸 + 1.5초 무적
//   ③ 다리 bridges        돌 다리(늘 있음) · 깜빡 다리(켜짐 → 깜빡 예고 → 꺼짐) · 색 다리(가까운 색 수정이 켜져 있을 때만). 띠마다 돌 또는 깜빡 다리 하나는 꼭
//   ④ 메아리 종 bells     때리면 8초 "딩~" 7칸 안 그림자가 들켜요
//   ⑤ 그림자 웅덩이 puddles 주인공이 2칸 안에 오면 분신이 솟아 그 주인공 길을 2.5초 늦게 따라와요(10초). 닿으면 하트 0.5(0.5 밑 X), 때리면 펑
// 아이 규칙: 환경은 절대 쓰러뜨리지 않아요 (W5.floorHp).
// 놓기는 씨앗 난수(rand)로 monstersSpawned(60) 에서: 같이 하기 두 기기가 같은 자리를 만들어요. 데이터는 w5_common.js 의 world.w5 (계약)
// 같이 하기:
//   - 바뀌는 상태(수정 남은 초 cr · 종 남은 초 bl · 다리 시계 bt)는 숨은 소품 몬스터 "w5_env" 칸으로 방장 → 친구 (w5GuestSync)
//   - 구멍 빠짐·분신 닿음은 방장이 모든 주인공(allPlayers)에 대해 계산 (1칸 넘게 옮기면 netplay 가 친구 자리를 맞춰요)
//   - 분신은 소품 몬스터 "w5_echo" (자리는 방장 계산, 친구 화면엔 몬스터처럼 가요)

const W5_ENV = { holeW: [2, 3], bridgeW: 2.0, puddleR: 2.0, echoDelay: 2.5, echoLife: 10, echoCd: 9, echoHurt: 0.5, allLitReward: 5 };

function w5EnvOn() { return game.scene === "dungeon" && !!world.w5; }
function w5IsGuest() { return typeof netGuest === "function" && netGuest(); }
function w5Teach(key, text, color = "#d8c8ff") {
  const E = world.w5; if (!E) return;
  E.taught = E.taught || {};
  if (E.taught[key]) return;
  E.taught[key] = true;
  showMessage(text, 2.6, false, color);
}
function w5Tries(fn, n = 25) { for (let t = 0; t < n; t++) if (fn()) return true; return false; }
function w5Far(list, x, y, d) { return !list.some((o) => Math.hypot((o.x !== undefined ? o.x : (o.x0 + o.x1) / 2) - x, (o.y !== undefined ? o.y : (o.y0 + o.y1) / 2) - y) < d); }

// ===== 소품 몬스터 정의 =====
MONSTERS.w5_env = { name: "공허 환경", color: "#000000", shape: "w5_env", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true, world: 5, codexSkip: true, w5Prop: true };
// 분신은 때릴 수 있어요 (맞으면 펑): 소품이지만 w5Prop 이 아니에요
MONSTERS.w5_echo = { name: "그림자 분신", color: "#2a2440", shape: "w5_echo", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, world: 5, codexSkip: true, size: 1 };
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push("w5_env", "w5_echo");
if (typeof CODEX_SKIP !== "undefined") { CODEX_SKIP.add("w5_env"); CODEX_SKIP.add("w5_echo"); }
hookOn("untargetable", (o) => !!(o && o.def && o.def.w5Prop), 50);
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m || !m.def) return false;
  if (m.def.w5Prop) return true; // 환경 소품은 안 아파요
  if (m.type === "w5_echo") { if (!h.opts.dot && m.hp > 0) w5EchoPop(m, true); return true; }
  return false;
}, 5);

// ===== 놓기 =====
hookOn("monstersSpawned", (def, level, rand) => {
  if (!def || mapWorld(def) !== 5 || !def.features) return;
  const f = def.features, E = w5Env();
  const rooms = (world.rooms || []).slice(1);
  if (!rooms.length) return;
  const nearDoor = (x, y, d) => typeof w2NearDoorSpot === "function" && w2NearDoorSpot(x, y, d);
  const flat = (x0, y0, x1, y1) => {
    const h0 = typeof tileH === "function" ? tileH(Math.floor(x0), Math.floor(y0)) : 0;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      if (isWall(x, y)) return false;
      if (typeof tileH === "function" && tileH(x, y) !== h0) return false;
      if (typeof isStair === "function" && isStair(x, y)) return false;
    }
    return true;
  };
  // ② 구멍 띠: 방을 짧은 쪽으로 가로질러요 (벽에서 벽까지) + 다리 (띠마다 돌 또는 깜빡 다리 하나는 꼭)
  const holeRooms = new Set();
  // 처음엔 8칸 넘는 방만, 그래도 하나도 못 놓으면 6칸 방·문 가까이(2칸)까지 넓혀서 한 번 더 (구멍이 없는 공허 맵이 없게)
  for (const relax of [false, true]) {
  if (relax && (E.holes.length || !f.holes)) break;
  const minR = relax ? 6 : 8, doorR = relax ? 2 : 4;
  for (let i = 0; i < (relax ? 1 : (f.holes || 0)); i++) w5Tries(() => {
    const r = rooms[Math.floor(rand() * rooms.length)];
    if (holeRooms.has(r) || r.w < minR || r.h < minR || nearDoor(r.cx, r.cy, doorR)) return false;
    const vert = r.w >= r.h, wid = W5_ENV.holeW[0] + Math.floor(rand() * (W5_ENV.holeW[1] - W5_ENV.holeW[0] + 1));
    let rect;
    if (vert) { const x0 = r.x + Math.floor(r.w / 3 + rand() * (r.w / 3 - wid)); rect = { x0, y0: r.y, x1: x0 + wid, y1: r.y + r.h }; }
    else { const y0 = r.y + Math.floor(r.h / 3 + rand() * (r.h / 3 - wid)); rect = { x0: r.x, y0, x1: r.x + r.w, y1: y0 + wid }; }
    if (!flat(rect.x0, rect.y0, rect.x1, rect.y1)) return false;
    const span = vert ? r.h : r.w, BW = W5_ENV.bridgeW, bridges = [];
    const at = (k) => Math.floor((vert ? r.y : r.x) + 1 + (span - 2 - BW) * k);
    const mk = (pos, kind) => (vert ? { x0: rect.x0, y0: pos, x1: rect.x1, y1: pos + BW, kind } : { x0: pos, y0: rect.y0, x1: pos + BW, y1: rect.y1, kind });
    const blink = !!f.blink && rand() < 0.75;
    // 색 다리 맵: 넓은 띠는 두 번째 다리가 색 다리, 좁은 띠는 남는 자리가 있으면 끝 쪽에 (첫 다리는 늘 돌 또는 깜빡이라 길이 막히지 않아요)
    if (span >= 10) { bridges.push(mk(at(0.1 + rand() * 0.2), blink ? "blink" : "stone")); bridges.push(mk(at(0.7 + rand() * 0.2), f.colorBridges ? "color" : "stone")); }
    else {
      bridges.push(mk(at(0.15 + rand() * 0.15), blink ? "blink" : "stone"));
      if (f.colorBridges) { const pos = at(1); if (!bridges.some((b) => Math.abs((vert ? b.y0 : b.x0) - pos) < BW + 0.2)) bridges.push(mk(pos, "color")); }
    }
    bridges.forEach((b, k) => { b.ph = (i * 1.7 + k * 2.3) % 6; });
    holeRooms.add(r);
    w5AddHole(world, rect, bridges);
    return true;
  }, 150); // 맞는 방이 적은 맵도 있어서 넉넉히 다시 골라요 (가끔 구멍이 하나도 없던 맵)
  }
  // 깜빡 다리 맵인데 (운이 나빠) 깜빡 다리가 하나도 없으면 첫 띠의 첫 다리를 깜빡 다리로 (이 맵에서 배우는 것이라 꼭 하나는 있어야 해요)
  // 색 다리 맵인데 색 다리가 하나도 없으면 가장 긴 띠의 빈 끝에 하나 (길을 막는 첫 다리는 그대로 두고 더해요)
  if (f.colorBridges && E.holes.length && !E.holes.some((h) => h.bridges.some((b) => b.kind === "color"))) {
    const BW = W5_ENV.bridgeW;
    const long = E.holes.map((h) => ({ h, vert: h.y1 - h.y0 > h.x1 - h.x0 })).sort((a, b) => ((b.vert ? b.h.y1 - b.h.y0 : b.h.x1 - b.h.x0) - (a.vert ? a.h.y1 - a.h.y0 : a.h.x1 - a.h.x0)));
    for (const { h, vert } of long) {
      const a = vert ? h.y0 : h.x0, z = vert ? h.y1 : h.x1;
      const cands = [Math.floor(z - 1 - BW), Math.floor(a + 1)];
      const pos = cands.find((p) => p >= a && p + BW <= z && !h.bridges.some((b) => Math.abs((vert ? b.y0 : b.x0) - p) < BW + 0.2));
      if (pos === undefined) continue;
      h.bridges.push(vert ? { x0: h.x0, y0: pos, x1: h.x1, y1: pos + BW, kind: "color", ph: 0 } : { x0: pos, y0: h.y0, x1: pos + BW, y1: h.y1, kind: "color", ph: 0 });
      break;
    }
  }
  if (f.blink && E.holes.length && !E.holes.some((h) => h.bridges.some((b) => b.kind === "blink"))) { const b0 = E.holes[0].bridges.find((b) => b.kind === "stone"); if (b0) b0.kind = "blink"; }
  const onHoleAny = (x, y, pad = 0) => E.holes.some((h) => x > h.x0 - pad && x < h.x1 + pad && y > h.y0 - pad && y < h.y1 + pad);
  const all = () => [...E.crystals, ...E.bells, ...E.puddles];
  const spot = (pad, rad) => (typeof w2EnvSpot === "function" ? w2EnvSpot(rand, rooms, pad, rad) : null);
  // 색 다리마다 가까이(띠 옆 1.6칸) 색 수정 하나는 꼭 (켜야 다리가 생겨요)
  for (const h of E.holes) for (const b of h.bridges) {
    if (b.kind !== "color") continue;
    const vert = h.y1 - h.y0 > h.x1 - h.x0, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const tries = vert ? [[h.x0 - 1.6, cy], [h.x1 + 1.6, cy]] : [[cx, h.y0 - 1.6], [cx, h.y1 + 1.6]];
    for (const [x, y] of tries) { const s = findFreeSpot(x, y, 0.45, 1); if (s && !onHoleAny(s.x, s.y, 0.6)) { w5AddCrystal(world, s.x, s.y); break; } }
  }
  // ① 색 수정 (시작 방에도 하나)
  if (f.crystals && world.rooms[0]) { const s0 = world.rooms[0], s = findFreeSpot(s0.x + 1.6, s0.y + 1.6, 0.5, 2); if (s) w5AddCrystal(world, s.x, s.y); }
  for (let i = E.crystals.length; i < (f.crystals || 0); i++) w5Tries(() => { const s = spot(1.2, 0.5); if (!s || onHoleAny(s.x, s.y, 1) || !w5Far(all(), s.x, s.y, 2.4)) return false; w5AddCrystal(world, s.x, s.y); return true; });
  // ④ 종
  for (let i = 0; i < (f.bells || 0); i++) w5Tries(() => { const s = spot(1.3, 0.5); if (!s || onHoleAny(s.x, s.y, 1) || !w5Far(all(), s.x, s.y, 4)) return false; w5AddBell(world, s.x, s.y); return true; });
  // ⑤ 그림자 웅덩이
  for (let i = 0; i < (f.puddles || 0); i++) w5Tries(() => { const s = spot(1.4, 0.7); if (!s || onHoleAny(s.x, s.y, 1.2) || !w5Far(all(), s.x, s.y, 3.5) || nearDoor(s.x, s.y, 2)) return false; w5AddPuddle(world, s.x, s.y); return true; });
  E.crystals.forEach((c, k) => { c.hue = ["#ffdf5a", "#ff9ad6", "#9fe8ff", "#c8ff7a", "#d8a8ff"][k % 5]; });
  // 수정·종은 부딪히는 자리 (두 기기 모두 같은 데이터로)
  for (const c of E.crystals) world.solids.push({ x: c.x, y: c.y, r: 0.35, w5: true });
  for (const b of E.bells) world.solids.push({ x: b.x, y: b.y, r: 0.4, w5: true });
  // 구멍 위에 놓인 몬스터는 옆으로 (둥실 몬스터는 그대로)
  for (const m of monsters) if (m.def && !m.def.floaty && m.def.behavior !== "prop" && w5OnHole(m.x, m.y)) { const s = w5SafeSpot(m.x, m.y); if (s) { m.x = s.x; m.y = s.y; } }
}, 60);

// 상자·열쇠 물건·위층 계단이 구멍·수정·종·웅덩이 위에 놓이지 않게 (w2EnvKeepClear 를 늘려요)
if (typeof w2EnvKeepClear === "function") {
  const w2KeepW5 = w2EnvKeepClear;
  w2EnvKeepClear = function (x, y, pad = 1.0) {
    if (w2KeepW5(x, y, pad)) return true;
    const E = world.w5;
    if (!E) return false;
    for (const h of E.holes) if (x > h.x0 - pad && x < h.x1 + pad && y > h.y0 - pad && y < h.y1 + pad) return true;
    for (const v of [...E.crystals, ...E.bells, ...E.puddles]) if (Math.hypot(x - v.x, y - v.y) < pad + 0.4) return true;
    return false;
  };
}

// ===== 소품 =====
function w5EnvProp() { return monsters.find((m) => m.type === "w5_env" && m.hp > 0) || null; }
function w5Echoes() { return monsters.filter((m) => m.type === "w5_echo" && m.hp > 0); }
function w5EnsureProps() {
  const E = world.w5;
  if (!E || w5IsGuest() || w5EnvProp()) return;
  if (!(E.crystals.length || E.bells.length || E.holes.length || E.puddles.length)) return;
  const s = world.start || { x: 1, y: 1 };
  const m = createMonster("w5_env", s.x, s.y, game.mapLevel || 1);
  m.appearTimer = 0; m.aggro = false; m.immovable = true; m.r = 0.05;
  monsters.push(m);
}
// 친구 기기: 방장 소품에서 받은 상태를 world.w5 에 다시 적어요 (w5Lit·w5Rung·w5OnHole 이 두 기기에서 같게)
function w5GuestSync() {
  const E = world.w5; if (!E || !w5IsGuest()) return;
  const env = w5EnvProp(); if (!env) return;
  if (typeof env.cr === "string") E.crystals.forEach((c, i) => { const v = parseInt(env.cr[i] || "0", 36) || 0; if (Math.abs((c.litT || 0) - v) >= 1 || (v === 0) !== !(c.litT > 0)) c.litT = v; if (v > 0) c.ever = true; });
  if (typeof env.bl === "string") E.bells.forEach((b, i) => { const v = parseInt(env.bl[i] || "0", 36) || 0; if (Math.abs((b.ringT || 0) - v) >= 1 || (v === 0) !== !(b.ringT > 0)) b.ringT = v; });
  if (typeof env.bt === "number") E.clock = env.bt;
}

// 친구 기기는 매 화면 받은 상태를 적어 둬요 (조작 단계: 그리기 전에도 w5Lit·w5OnHole 이 맞게)
hookOn("playerInput", (inp) => { if (game.scene === "dungeon" && world.w5) w5GuestSync(); return inp; }, 82);

// 칼 휘두름·화살·마법이 지나갔나 (월드 4 빛 수정과 같은 규칙)
function w5HitAt(x, y, rad = 0.45) {
  for (const p of allPlayers()) if (p && p.hp > 0 && p.swingTimer > 0 && Math.hypot(p.x - x, p.y - y) < 1.7 && ((x - p.x) * (p.faceX || 0) + (y - p.y) * (p.faceY || 0)) > -0.3) return true;
  if (typeof shots !== "undefined") for (const s of shots) if (s && s.life > 0 && Math.hypot(s.x - x, s.y - y) < rad + 0.25) return true;
  if (typeof clsFx !== "undefined") for (const f of clsFx) if (f && typeof f.x === "number" && f.owner && Math.hypot(f.x - x, f.y - y) < rad + 0.3) return true;
  return false;
}
// 코드에서 켜기 (보스·시험이 써요, 방장 기기)
function w5LightCrystal(c, sec = W5.litSec) {
  if (!c) return;
  const was = c.litT > 0;
  c.litT = Math.max(c.litT || 0, sec);
  if (!was) {
    addRing(c.x, c.y, { speed: 3, life: 0.45, hue: 50 });
    for (let i = 0; i < 10; i++) addSparkle(c.x, c.y, 0.6, { vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, vz: 1.5, gravity: 2, life: 0.7, size: 0.5, hue: Math.random() * 360 });
    if (typeof sfx !== "undefined" && sfx.sparkle) sfx.sparkle();
    w5Teach("crystal", "색 수정을 때리면 색이 돌아와요! 그림자도 들켜요", "#ffe27a");
  }
  if (!c.ever) { c.ever = true; w5CheckAllLit(); }
}
function w5CheckAllLit() {
  const E = world.w5; if (!E || E.allLit || !E.crystals.length || !E.crystals.every((c) => c.ever)) return;
  E.allLit = true;
  showMessage("섬에 색이 돌아왔어요! 무지개 선물!", 3, true);
  const p = game.player;
  if (p && typeof dropPickup === "function") for (let i = 0; i < W5_ENV.allLitReward; i++) dropPickup("emerald", p.x + (Math.random() - 0.5) * 2, p.y + (Math.random() - 0.5) * 2);
  if (typeof hookRun === "function") hookRun("w5AllLit", game.mapDef && game.mapDef.id); // 퀘스트가 들어요 (quests_w5.js)
}
function w5RingBell(b, sec = W5.bellSec) {
  if (!b) return;
  const was = b.ringT > 0;
  b.ringT = Math.max(b.ringT || 0, sec);
  if (!was) {
    addRing(b.x, b.y, { speed: 6, life: 0.8, hue: 270 }); addRing(b.x, b.y, { speed: 4, life: 0.8, hue: 270, delay: 0.2 });
    addFloatText(b.x, b.y, "딩~", "#e8d8ff", 22);
    if (typeof tone === "function") { tone(880, 0.5, "sine", 0.06); tone(1320, 0.6, "sine", 0.04, null, 0.15); }
    w5Teach("bell", "메아리 종! 울리는 동안 그림자가 들켜요", "#e8d8ff");
  }
}

// ===== 방장: 매 화면 =====
hookOn("dungeonTick", (dt) => {
  if (!w5EnvOn()) return;
  const E = world.w5;
  w5EnsureProps();
  E.clock = (E.clock || 0) + dt;
  for (const c of E.crystals) { if (w5HitAt(c.x, c.y)) w5LightCrystal(c); if (c.litT > 0) c.litT = Math.max(0, c.litT - dt); }
  for (const b of E.bells) { if (w5HitAt(b.x, b.y, 0.5)) w5RingBell(b); if (b.ringT > 0) b.ringT = Math.max(0, b.ringT - dt); }
  // ② 구멍: 다리 아닌 곳에 선 주인공은 빠져요, 몬스터는 옆으로
  if (E.holes.length) {
    for (const p of allPlayers()) if (p && p.hp > 0 && w5OnHole(p.x, p.y)) w5FallOut(p);
    for (const m of monsters) if (m.hp > 0 && m.def && m.def.behavior !== "prop" && !m.boss && !m.def.floaty && w5OnHole(m.x, m.y)) { const s = w5SafeSpot(m.x, m.y); if (s) { m.x = s.x; m.y = s.y; } }
    if (allPlayers().some((p) => p && E.holes.some((h) => Math.hypot(p.x - (h.x0 + h.x1) / 2, p.y - (h.y0 + h.y1) / 2) < 6))) w5Teach("hole", "깜깜한 공허 구멍! 다리로 건너요 (깜빡이면 곧 사라져요)", "#b8a8d8");
  }
  // ⑤ 웅덩이 → 분신, 분신 움직이기
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    const tr = p._w5Trail || (p._w5Trail = []);
    p._w5TrT = (p._w5TrT || 0) - dt;
    if (p._w5TrT <= 0) { p._w5TrT = 0.1; tr.push({ x: p.x, y: p.y }); if (tr.length > 120) tr.shift(); }
  }
  for (const q of E.puddles) {
    q.cd = Math.max(0, (q.cd || 0) - dt);
    if (q.cd > 0) continue;
    const p = allPlayers().find((o) => o && o.hp > 0 && Math.hypot(o.x - q.x, o.y - q.y) < W5_ENV.puddleR);
    if (p && !w5Echoes().some((e) => e.w5For === (p.pid || 1))) { q.cd = W5_ENV.echoCd; w5SpawnEcho(q, p); }
  }
  for (const e of w5Echoes()) w5EchoTick(e, dt);
  // 상태를 소품 칸에 (친구에게)
  const env = w5EnvProp();
  if (env) {
    env.cr = E.crystals.map((c) => Math.min(35, Math.ceil(c.litT || 0)).toString(36)).join("");
    env.bl = E.bells.map((b) => Math.min(35, Math.ceil(b.ringT || 0)).toString(36)).join("");
    env.bt = Math.round(E.clock * 100) / 100;
  }
}, 62);

// ② 구멍에 빠짐
function w5SafeSpot(x, y) {
  for (let d = 0.5; d <= 7; d += 0.5) for (let k = 0; k < 16; k++) {
    const a = k * Math.PI / 8, tx = x + Math.cos(a) * d, ty = y + Math.sin(a) * d;
    if (w5SafeLand(tx, ty, 0.4)) return { x: tx, y: ty };
  }
  return null;
}
function w5FallOut(p) {
  const back = p._w5Trail && p._w5Trail.length ? p._w5Trail.slice().reverse().find((q) => w5SafeLand(q.x, q.y, 0.4)) : null;
  const s = back || w5SafeSpot(p.x, p.y);
  const hurt = W5.fallHurt[w5Diff()] || 1;
  if (p.hp > W5.floorHp) p.hp = Math.max(W5.floorHp, p.hp - hurt);
  if (s) { p.x = s.x; p.y = s.y; }
  p.rollTimer = 0; p.hurtTimer = Math.max(p.hurtTimer || 0, 1.5);
  if (p === game.player) { camera.x = p.x; camera.y = p.y; }
  addFloatText(p.x, p.y, "앗, 쑥 빠졌어요!", "#d8c8ff", 18);
  for (let i = 0; i < 8; i++) addSparkle(p.x, p.y, 0.4, { vz: 1.2, gravity: 2, life: 0.5, size: 0.4, hue: 270 });
}

// ⑤ 분신
function w5SpawnEcho(q, p) {
  const m = createMonster("w5_echo", q.x, q.y, game.mapLevel || 1);
  m.appearTimer = 0.5; m.aggro = false; m.immovable = true; m.r = 0.3;
  m.w5For = p.pid || 1; m.w5Life = W5_ENV.echoLife + W5_ENV.echoDelay; m.w5Wait = W5_ENV.echoDelay; // 솟은 뒤 2.5초는 웅덩이에서 기다렸다가 그때부터의 길을 따라가요
  m.w5Lag = Math.round(W5_ENV.echoDelay / 0.1);
  monsters.push(m);
  addRing(q.x, q.y, { speed: 2.5, life: 0.5, hue: 270 });
  addFloatText(q.x, q.y, "스르르… 내 그림자?", "#b8a8d8", 16);
  w5Teach("echo", "그림자 분신이 내 길을 따라와요! 닿지 않게, 때리면 펑", "#b8a8d8");
}
function w5EchoPop(m, byHit) {
  m.hp = 0; m.silent = true;
  spawnBurst(m.x, m.y, ["#4a4060", "#b8a8d8", "#ffffff"], 12);
  if (byHit) { addFloatText(m.x, m.y, "펑!", "#e8d8ff", 18); if (Math.random() < 0.35 && typeof dropPickup === "function") dropPickup("emerald", m.x, m.y); }
}
function w5EchoTick(m, dt) {
  m.w5Life -= dt;
  if (m.w5Life <= 0) { w5EchoPop(m, false); return; }
  const p = allPlayers().find((o) => (o.pid || 1) === m.w5For);
  if (!p || p.hp <= 0) { w5EchoPop(m, false); return; }
  // 닿으면 조금 아파요 (환경이라 하트 0.5 밑으로는 안 내려가요)
  for (const q of allPlayers()) {
    if (!q || q.hp <= 0 || q.hurtTimer > 0 || q.rollTimer > 0 || Math.hypot(q.x - m.x, q.y - m.y) > 0.55) continue;
    if (q.hp > W5.floorHp) q.hp = Math.max(W5.floorHp, q.hp - W5_ENV.echoHurt);
    q.hurtTimer = Math.max(q.hurtTimer || 0, 0.8);
    addFloatText(q.x, q.y, "앗, 내 그림자!", "#b8a8d8", 16);
    w5EchoPop(m, false);
    return;
  }
  const tr = p._w5Trail || [];
  // 따라갈 점: 지금 끝에서 2.5초(25점) 앞 (솟은 뒤 2.5초 동안은 웅덩이에서 기다려요)
  if (m.w5Wait > 0) { m.w5Wait -= dt; m.moving = false; return; }
  const want = tr.length - 1 - m.w5Lag;
  const target = tr[Math.max(0, want)] || p;
  const dx = target.x - m.x, dy = target.y - m.y, d = Math.hypot(dx, dy);
  const sp = Math.min(d, 4.2 * dt);
  if (d > 0.02) { m.x += dx / d * sp; m.y += dy / d * sp; m.faceX = dx / d; m.faceY = dy / d; m.moving = true; m.walkTime = (m.walkTime || 0) + dt; } else m.moving = false;

}

// ===== 빛 =====
hookOn("lights", (lights) => {
  if (!w5EnvOn()) return;
  w5GuestSync();
  const E = world.w5;
  for (const c of E.crystals) {
    if (!onScreen(c.x, c.y, 5)) continue;
    if (c.litT > 0) { const k = Math.min(1, c.litT / 2); lights.push({ x: c.x, y: c.y, radius: 1 + (W5.litR - 1) * k, power: 0.25 + 0.55 * k }); }
    else lights.push({ x: c.x, y: c.y, radius: 1.0, power: 0.22 });
  }
  for (const b of E.bells) if (b.ringT > 0 && onScreen(b.x, b.y, 8)) lights.push({ x: b.x, y: b.y, radius: 2.4, power: 0.5 });
}, 55);

// ===== 그리기 =====
function w5Quad(x0, y0, x1, y1, color, z = 0.012) { fillPoly([toScreen(x0, y0, z), toScreen(x1, y0, z), toScreen(x1, y1, z), toScreen(x0, y1, z)], color); }
function w5QuadLine(x0, y0, x1, y1, color, w = 2.5, z = 0.03, dash) {
  const q = [toScreen(x0, y0, z), toScreen(x1, y0, z), toScreen(x1, y1, z), toScreen(x0, y1, z)];
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * ZOOM; if (dash) ctx.setLineDash([6 * ZOOM, 5 * ZOOM]);
  ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
}
function w5Circle(x, y, r, fill, stroke, lw = 2, dash) {
  const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push(toScreen(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.015)); }
  if (fill) fillPoly(pts, fill);
  if (stroke) { ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = lw * ZOOM; if (dash) { ctx.setLineDash([5 * ZOOM, 5 * ZOOM]); ctx.lineDashOffset = -game.time * 20 * ZOOM; } ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore(); }
}
// 구멍 하나 그리기 (보스 아레나도 같이 써요)
function w5DrawHole(h) {
  const t = game.time;
  w5Quad(h.x0, h.y0, h.x1, h.y1, "#0b0916");
  // 깜깜한 속 별 점 (자리마다 같은 별)
  for (let i = 0; i < 10; i++) {
    const sx = h.x0 + ((i * 0.618 + h.x0 * 0.13) % 1) * (h.x1 - h.x0), sy = h.y0 + ((i * 0.381 + h.y0 * 0.17) % 1) * (h.y1 - h.y0);
    if (Math.sin(t * 2 + i) > -0.3) w5Quad(sx - 0.04, sy - 0.04, sx + 0.04, sy + 0.04, "rgba(230,220,255,0.7)", 0.013);
  }
  w5QuadLine(h.x0, h.y0, h.x1, h.y1, "rgba(184,168,216,0.55)", 1.5, 0.014);
  const clock = (world.w5 && world.w5.clock) || 0;
  for (const b of h.bridges) {
    if (b.kind === "blink") {
      const st = w5BlinkState(b, clock);
      if (st === 0) { w5QuadLine(b.x0 + 0.1, b.y0 + 0.1, b.x1 - 0.1, b.y1 - 0.1, "rgba(184,168,216,0.5)", 1.5, 0.02, true); continue; }
      const flick = st === 1 && Math.sin(t * 28) < 0;
      w5Quad(b.x0, b.y0, b.x1, b.y1, flick ? "rgba(150,140,190,0.45)" : "#8a82b0", 0.02);
      w5Quad(b.x0 + 0.1, b.y0 + 0.1, b.x1 - 0.1, b.y1 - 0.1, flick ? "rgba(190,180,230,0.4)" : "#a89ed0", 0.022);
      w5QuadLine(b.x0, b.y0, b.x1, b.y1, st === 1 ? "rgba(255,80,80,0.95)" : "rgba(255,226,122,0.95)", 2.5, 0.025);
    } else if (b.kind === "color") {
      if (!w5ColorBridgeOn(b)) { w5QuadLine(b.x0 + 0.1, b.y0 + 0.1, b.x1 - 0.1, b.y1 - 0.1, "rgba(255,226,122,0.35)", 1.5, 0.02, true); continue; }
      const cols = ["#ff9a9a", "#ffd27a", "#fff27a", "#9aff9a", "#9ad8ff", "#c8a8ff"], vert = b.y1 - b.y0 > b.x1 - b.x0;
      for (let k = 0; k < 6; k++) {
        if (vert) w5Quad(b.x0 + (b.x1 - b.x0) * k / 6, b.y0, b.x0 + (b.x1 - b.x0) * (k + 1) / 6, b.y1, cols[k], 0.02);
        else w5Quad(b.x0, b.y0 + (b.y1 - b.y0) * k / 6, b.x1, b.y0 + (b.y1 - b.y0) * (k + 1) / 6, cols[k], 0.02);
      }
      w5QuadLine(b.x0, b.y0, b.x1, b.y1, "rgba(255,226,122,0.95)", 2.5, 0.025);
    } else {
      w5Quad(b.x0, b.y0, b.x1, b.y1, "#6e6a7e", 0.02); w5Quad(b.x0 + 0.08, b.y0 + 0.08, b.x1 - 0.08, b.y1 - 0.08, "#8a86a0", 0.022);
      w5QuadLine(b.x0, b.y0, b.x1, b.y1, "rgba(255,226,122,0.95)", 2.5, 0.025);
    }
  }
}
hookOn("drawFloor", () => {
  if (!w5EnvOn()) return;
  w5GuestSync();
  const E = world.w5;
  // 켜진 수정 둘레: 색이 돌아온 바닥 (무지개 빛 동그라미, 흐리게)
  for (const c of E.crystals) if (c.litT > 0 && onScreen(c.x, c.y, 6)) { const k = Math.min(1, c.litT / 2); w5Circle(c.x, c.y, W5.litR * k, `rgba(${c.hue === "#ff9ad6" ? "255,154,214" : c.hue === "#9fe8ff" ? "159,232,255" : c.hue === "#c8ff7a" ? "200,255,122" : c.hue === "#d8a8ff" ? "216,168,255" : "255,223,90"},0.16)`, null); }
  for (const h of E.holes) if (onScreen((h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2, 10)) w5DrawHole(h);
  for (const q of E.puddles) if (onScreen(q.x, q.y, 3)) { w5Circle(q.x, q.y, 0.7, "rgba(30,24,50,0.75)", "rgba(184,168,216,0.5)", 1.5); if (Math.random() < 0.03) addSparkle(q.x + (Math.random() - 0.5), q.y + (Math.random() - 0.5), 0.1, { vz: 0.6, gravity: -0.1, life: 0.8, size: 0.35, hue: 270 }); }
  for (const b of E.bells) if (b.ringT > 0 && onScreen(b.x, b.y, 8)) w5Circle(b.x, b.y, W5.bellR * (0.9 + 0.1 * Math.sin(game.time * 4)), null, "rgba(216,200,255,0.45)", 2, true);
}, 52);
function w5DrawCrystal(c) {
  const on = c.litT > 0, col = on ? c.hue || "#ffdf5a" : c.ever ? w5Gray(c.hue || "#ffdf5a", 0.55) : "#7a7888";
  drawBox(c.x - 0.25, c.y - 0.25, 0, 0.5, 0.5, 0.1, "#5a5868");
  drawBox(c.x - 0.09, c.y - 0.09, 0.1, 0.18, 0.18, 0.85, col);
  drawBox(c.x + 0.06, c.y - 0.16, 0.1, 0.16, 0.16, 0.55, col);
  drawBox(c.x - 0.2, c.y + 0.04, 0.1, 0.15, 0.15, 0.5, col);
  if (on && Math.random() < 0.15) addSparkle(c.x + (Math.random() - 0.5) * 0.4, c.y + (Math.random() - 0.5) * 0.4, 0.4 + Math.random() * 0.6, { vz: 0.6, life: 0.5, size: 0.45, hue: Math.random() * 360 });
}
function w5DrawBell(b) {
  const sw = b.ringT > 0 ? Math.sin(game.time * 14) * 0.06 : 0;
  drawBox(b.x - 0.32, b.y - 0.06, 0, 0.08, 0.12, 1.3, "#6a5a4a"); drawBox(b.x + 0.24, b.y - 0.06, 0, 0.08, 0.12, 1.3, "#6a5a4a");
  drawBox(b.x - 0.36, b.y - 0.1, 1.3, 0.72, 0.2, 0.1, "#7a6a5a");
  drawBox(b.x - 0.2 + sw, b.y - 0.2, 0.75, 0.4, 0.4, 0.5, b.ringT > 0 ? "#e8d8ff" : "#a8a0c0");
  drawBox(b.x - 0.25 + sw, b.y - 0.25, 0.7, 0.5, 0.5, 0.08, b.ringT > 0 ? "#fff6d8" : "#8a84a0");
}
hookOn("worldThings", (things) => {
  if (!w5EnvOn()) return;
  const E = world.w5;
  for (const c of E.crystals) if (onScreen(c.x, c.y, 2)) things.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => w5DrawCrystal(c) });
  for (const b of E.bells) if (onScreen(b.x, b.y, 2)) things.push({ depth: b.x + b.y, x: b.x, y: b.y, draw: () => w5DrawBell(b) });
}, 52);
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  w5_env() {},
  // 그림자 분신: 짙은 남보라 주인공 모양 + 흐릿한 하늘색 눈 + 빨간 점선 테두리(아픔 규칙)
  w5_echo(m) {
    const fade = Math.min(1, (m.w5Life || 0) / 1.5);
    ctx.save(); ctx.globalAlpha *= 0.75 * fade;
    drawRig(m, { skin: "#3a3254", hair: "#241e38", shirt: "#2e2846", pants: "#221c34", eyes: "#9fe8ff" }, typeof monsterPose === "function" ? monsterPose(m) : undefined, { scale: 0.95 });
    ctx.restore();
    w5Circle(m.x, m.y, 0.45, null, "rgba(255,90,90,0.8)", 2, true);
  },
});
