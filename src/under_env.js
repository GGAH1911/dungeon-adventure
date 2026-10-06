// ===== 월드 4 "지하세계" 환경 (설계서 docs/design/world4-underworld.md 2-3, 6장) =====
//   ① 빛 수정 crystals    칼·화살·마법이 지나가면 9초 반짝 (켜진 수정 3.2칸 안 = w4Lit). 꺼져도 아주 조금은 빛나요
//   ② 버섯 통통 패드 shrooms  밟으면 화살표 쪽으로 4칸 0.55초 붕 (월드 2 해면·월드 3 점프대와 같은 틀). 착지 자리는 금색 원
//   ③ 광차 레일 rails      광차가 5.5칸/초로 돌아요. 레일 위 주인공을 보면 0.8초 멈칫(쉬움 1.2). 정류장에서 서 있는 광차에 올라서면 타요(구르면 내려요)
//   ④ 종유석 drips        방장이 박자마다 예고(바닥 그림자 1.3초)를 만들어요 (월드 3 별똥별과 같은 방식)
//   ⑤ 용암 강 lava        다리 아닌 용암 위: 0.5초마다 하트 0.5(하트 0.5 밑으로는 안 내려가요) + 강가로 3칸/초 밀려나요. 즉사 없음
//   ⑥ 무너지는 바닥 cracks  올라서면 흔들(보통 1초) → 구멍 8초 → 다시 멀쩡. 구멍에 서 있으면 하트 1(쉬움 0.5) + 가까운 멀쩡한 칸으로
//   (+) 지하 물살 currents  지하 강(undriver): 월드 2 해류와 같은 규칙 (world.w4.currents)
// 놓기는 씨앗 난수(rand)로 monstersSpawned(60) 에서: 같이 하기 두 기기가 같은 자리를 만들어요. 데이터는 w4_common.js 의 world.w4 (계약)
// 같이 하기:
//   - 바뀌는 상태(수정 남은 초·바닥 상태)는 숨은 소품 몬스터 "w4_env" 의 글자칸 cr/ck 로 방장 → 친구. 친구 기기는 받은 값을 world.w4 에 다시 적어요(w4GuestSync)
//     그래서 w4Lit·w4CrackAt 이 두 기기에서 같은 답을 줘요
//   - 광차는 소품 몬스터 "w4_cart" (자리는 방장 계산, 친구 화면엔 몬스터처럼 가요). 타기는 기기마다 자기 주인공(조작 단계)
//   - 몸에 붙는 효과(버섯 붕·광차 타기)는 playerInput, 방장만 아는 밀림(용암·물살)은 playersUpdated 96 (netplay 95 뒤)
//   - 종유석 예고는 방장만 casts 에 넣어요 (casts 는 친구에게 가요)
// 소품 몬스터는 탑에서도 만들어요 (tower.js 는 prop 몬스터를 세지 않고 층을 끝내요): 끄려면 W4_ENV.propsInTower = false

const W4_ENV = {
  crystalLit: 9, crystalLight: { radius: 3.2, power: 0.75 }, crystalDim: { radius: 1.0, power: 0.25 },
  shroomHop: { time: 0.55, dist: 4.0 },
  cartSpeed: 5.5, cartGap: 7.0, cartHit: 1.3, cartStop: 1.5, cartBrake: { easy: 1.2, normal: 0.8, hard: 0.8, nightmare: 0.8 }, cartLook: 4,
  dripPeriod: 6.0, dripNear: 12,
  lavaTick: 0.5, lavaHurt: 0.5, lavaPush: 3.0, bridgeW: 2.0,
  crackShake: { easy: 1.5, normal: 1.0, hard: 0.85, nightmare: 0.7 }, crackBack: 8, fallHurt: { easy: 0.5, normal: 1, hard: 1, nightmare: 1 },
  currentPush: 1.6, propsInTower: true,
};

function w4EnvOn() { return game.scene === "dungeon" && !!world.w4; }
function w4Diff() { return (game.profile && game.profile.difficulty) || "normal"; }
function w4IsGuest() { return typeof netGuest === "function" && netGuest(); }
function w4Teach(key, text, color = "#ffe27a") {
  const E = world.w4; if (!E) return;
  E.taught = E.taught || {};
  if (E.taught[key]) return;
  E.taught[key] = true;
  showMessage(text, 2.6, false, color);
}
function w4Tries(fn, n = 25) { for (let t = 0; t < n; t++) if (fn()) return true; return false; }
function w4Spot(rand, rooms, pad, rad) { return typeof w2EnvSpot === "function" ? w2EnvSpot(rand, rooms, pad, rad) : null; }
function w4Far(list, x, y, d) { return !list.some((o) => Math.hypot((o.x !== undefined ? o.x : (o.x0 + o.x1) / 2) - x, (o.y !== undefined ? o.y : (o.y0 + o.y1) / 2) - y) < d); }
function w4Floor(x, y) { return typeof isWall === "function" ? !isWall(Math.floor(x), Math.floor(y)) : true; }
function w4InRect(r, x, y) { return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1; }

// ===== 소품 몬스터 정의 =====
MONSTERS.w4_env = { name: "지하 환경", color: "#000000", shape: "w4_env", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true, world: 4, codexSkip: true, w4Prop: true };
MONSTERS.w4_cart = { name: "광차", color: "#8a6a4a", shape: "w4_cart", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, untargetable: true, world: 4, codexSkip: true, w4Prop: true };
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push("w4_env", "w4_cart");
if (typeof CODEX_SKIP !== "undefined") { CODEX_SKIP.add("w4_env"); CODEX_SKIP.add("w4_cart"); }
hookOn("untargetable", (o) => !!(o && o.def && o.def.w4Prop), 50);
hookOn("monsterDamage", (h) => !!(h && h.m && h.m.def && h.m.def.w4Prop), 5); // 소품은 안 아파요

// 종유석 (방장이 예고를 넣어요)
ABILITIES.w4_drip = { name: "떨어지는 종유석", desc: "천장에서 종유석이 뚝! 바닥 그림자가 진해지면 떨어져요.",
  counter: "그림자 밖으로 걸어가요", tags: ["area", "trap", "drop"],
  telegraph: { shape: "circle", radius: 1.0, at: "self", time: 1.3 }, cooldown: 99, range: [0, 99], damageMul: 1.2,
  anim: "raise", effect: { type: "knockback", force: 0.6 } };
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, { w4_drip: { text: "종유석 그림자! 밖으로" } });

// ===== 놓기 =====
hookOn("monstersSpawned", (def, level, rand) => {
  if (!def || mapWorld(def) !== 4 || !def.features) return;
  const f = def.features, E = w4Env();
  E.currents = [];
  const rooms = (world.rooms || []).slice(1);
  if (!rooms.length) return;
  const all = () => [...E.crystals, ...E.shrooms, ...E.drips];
  const nearDoor = (x, y, d) => typeof w2NearDoorSpot === "function" && w2NearDoorSpot(x, y, d);
  const inRoom = (r, x, y) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  // ⑤ 용암 강: 방을 짧은 쪽으로 가로질러요 (벽에서 벽까지) + 다리 1~2개 (길이 막히지 않게 다리는 꼭)
  const lavaRooms = new Set();
  // 처음엔 8칸 넘는 방만 25번, 그래도 하나도 못 놓으면 6칸 방·문 가까이(2칸)까지 넓혀서 100번 더 (용암 강이 없는 용암 맵이 없게)
  for (const relax of [false, true]) {
  if (relax && (E.lava.length || !f.lava)) break;
  const minR = relax ? 6 : 8, doorR = relax ? 2 : 4;
  for (let i = 0; i < (relax ? 1 : (f.lava || 0)); i++) w4Tries(() => {
    const r = rooms[Math.floor(rand() * rooms.length)];
    if (lavaRooms.has(r) || r.w < minR || r.h < minR || nearDoor(r.cx, r.cy, doorR)) return false;
    const vert = r.w >= r.h, wid = 2 + Math.floor(rand() * 2); // vert: 세로 띠 (좌우로 건너요)
    let rect;
    if (vert) { const x0 = r.x + Math.floor(r.w / 3 + rand() * (r.w / 3 - wid)); rect = { x0, y0: r.y, x1: x0 + wid, y1: r.y + r.h }; }
    else { const y0 = r.y + Math.floor(r.h / 3 + rand() * (r.h / 3 - wid)); rect = { x0: r.x, y0, x1: r.x + r.w, y1: y0 + wid }; }
    const span = vert ? r.h : r.w, nb = span >= 10 ? 2 : 1, bridges = [];
    for (let k = 0; k < nb; k++) {
      const at = Math.floor((vert ? r.y : r.x) + 1 + (span - 2 - W4_ENV.bridgeW) * (nb === 1 ? 0.3 + rand() * 0.4 : k === 0 ? 0.1 + rand() * 0.2 : 0.7 + rand() * 0.2));
      bridges.push(vert ? { x0: rect.x0, y0: at, x1: rect.x1, y1: at + W4_ENV.bridgeW } : { x0: at, y0: rect.y0, x1: at + W4_ENV.bridgeW, y1: rect.y1 });
    }
    lavaRooms.add(r);
    w4AddLava(world, rect, bridges);
    return true;
  }, relax ? 100 : 25);
  }
  const onLavaAny = (x, y, pad = 0) => E.lava.some((l) => x > l.x0 - pad && x < l.x1 + pad && y > l.y0 - pad && y < l.y1 + pad);
  // ③ 광차 레일: 큰 방 안의 네모 고리 (벽에서 1.5칸 안쪽). 정류장은 첫 모서리
  const railRooms = new Set();
  for (let i = 0; i < (f.rails || 0); i++) w4Tries(() => {
    const r = rooms[Math.floor(rand() * rooms.length)];
    if (railRooms.has(r) || lavaRooms.has(r) || Math.max(r.w, r.h) < 8 || Math.min(r.w, r.h) < 7 || nearDoor(r.cx, r.cy, 4)) return false;
    const x0 = r.x + 1.5, y0 = r.y + 1.5, x1 = r.x + r.w - 1.5, y1 = r.y + r.h - 1.5;
    const pts = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
    if (!w4RailClear(pts, true)) return false;
    railRooms.add(r);
    const len = w4PathLen(pts, true);
    w4AddRail(world, pts, { carts: Math.max(1, Math.round(len / (W4_ENV.cartGap * 2))), stops: [0], speed: W4_ENV.cartSpeed, loop: true });
    return true;
  });
  const onRailAny = (x, y, pad) => E.rails.some((rl) => w4NearRail(rl, x, y) < pad);
  const busy = (x, y, pad = 1) => onLavaAny(x, y, pad) || onRailAny(x, y, pad + 0.4);
  // ① 빛 수정: 방 안 빈 자리 (시작 방에도 하나 꼭)
  if (f.crystals && world.rooms[0]) {
    const s0 = world.rooms[0], s = findFreeSpot(s0.x + 1.6, s0.y + 1.6, 0.5, 2);
    if (s && !busy(s.x, s.y)) w4AddCrystal(world, s.x, s.y, false);
  }
  for (let i = E.crystals.length; i < (f.crystals || 0); i++) w4Tries(() => { const s = w4Spot(rand, rooms, 1.2, 0.5); if (!s || busy(s.x, s.y) || !w4Far(all(), s.x, s.y, 2.2)) return false; w4AddCrystal(world, s.x, s.y, false); return true; });
  E.crystals.forEach((c, k) => { c.hue = ["#7fe0ff", "#c08aff", "#7fe0c0"][k % 3]; c.litT = 0; });
  // ② 버섯 통통 패드: 날아갈 길이 다 바닥이고 착지 자리가 안전할 때만
  for (let i = 0; i < (f.shrooms || 0); i++) w4Tries(() => {
    const s = w4Spot(rand, rooms, 1.2, 0.5);
    if (!s || busy(s.x, s.y) || !w4Far(all(), s.x, s.y, 2.5)) return false;
    const h0 = typeof tileH === "function" ? tileH(Math.floor(s.x), Math.floor(s.y)) : 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], start = Math.floor(rand() * 4), D = W4_ENV.shroomHop.dist;
    for (let k = 0; k < 4; k++) {
      const [dx, dy] = dirs[(start + k) % 4];
      let ok = true;
      for (let t = 0.4; t <= D + 0.6 && ok; t += 0.25) {
        const x = s.x + dx * t, y = s.y + dy * t;
        if (hitsWall(x, y, 0.4) || busy(x, y, 0.3) || E.crystals.some((c) => Math.hypot(c.x - x, c.y - y) < 0.9) || world.solids.some((o) => Math.hypot(o.x - x, o.y - y) < (o.r || 0.3) + 0.45) || (typeof w2SameH === "function" && !w2SameH(x, y, h0)) || (typeof isStair === "function" && isStair(Math.floor(x), Math.floor(y))) || nearDoor(x, y, 2.6)) ok = false;
      }
      if (ok && w4SafeLand(s.x + dx * D, s.y + dy * D)) { w4AddShroom(world, s.x, s.y, dx, dy, D); return true; }
    }
    return false;
  });
  // ④ 종유석
  for (let i = 0; i < (f.drips || 0); i++) w4Tries(() => { const s = w4Spot(rand, rooms, 1.4, 0.7); if (!s || busy(s.x, s.y) || !w4Far(all(), s.x, s.y, 2.4)) return false; w4AddDrip(world, s.x, s.y, W4_ENV.dripPeriod, rand() * W4_ENV.dripPeriod); return true; });
  // ⑥ 무너지는 바닥: 복도 칸에 2~3칸 이어서 (한 줄에 3칸까지)
  const corr = [];
  for (let y = 1; y < world.H - 1; y++) for (let x = 1; x < world.W - 1; x++) {
    if (isWall(x, y) || world.rooms.some((r) => inRoom(r, x + 0.5, y + 0.5))) continue;
    const fh = !isWall(x - 1, y) && !isWall(x + 1, y), fv = !isWall(x, y - 1) && !isWall(x, y + 1); // 복도는 1~2칸 너비
    const h = fh && !fv, v = fv && !fh;
    if (h || v) corr.push({ x, y, h });
  }
  let cracksLeft = f.cracks || 0;
  for (let g = 0; g < 200 && cracksLeft > 0 && corr.length; g++) {
    const c = corr[Math.floor(rand() * corr.length)], n = Math.min(cracksLeft, 2 + Math.floor(rand() * 2));
    const cells = [];
    for (let k = 0; k < n; k++) {
      const x = c.x + (c.h ? k : 0), y = c.y + (c.h ? 0 : k);
      if (isWall(x, y) || w4CrackAt(x, y) || E.cracks.some((q) => Math.hypot(q.x - x - 0.5, q.y - y - 0.5) < 2.5) || nearDoor(x + 0.5, y + 0.5, 3) || busy(x + 0.5, y + 0.5, 0.5)) break;
      cells.push({ x, y });
    }
    if (cells.length < 2) continue;
    for (const q of cells) w4AddCrack(world, q.x, q.y);
    cracksLeft -= cells.length;
  }
  // (+) 지하 물살 (월드 2 해류와 같은 띠)
  for (let i = 0; i < (f.currents || 0); i++) w4Tries(() => {
    const r = rooms[Math.floor(rand() * rooms.length)];
    const horiz = rand() < 0.5, dir = rand() < 0.5 ? 1 : -1;
    const len = Math.min(9, (horiz ? r.w : r.h) - 2), wid = 1.8;
    if (len < 4) return false;
    const x0 = horiz ? r.cx - len / 2 : r.cx - wid / 2, y0 = horiz ? r.cy - wid / 2 : r.cy - len / 2;
    const x1 = horiz ? x0 + len : x0 + wid, y1 = horiz ? y0 + wid : y0 + len;
    for (let y = y0; y < y1; y += 0.5) for (let x = x0; x < x1; x += 0.5) if (!w4Floor(x, y) || busy(x, y, 0)) return false;
    if (E.currents.some((c) => Math.hypot((c.x0 + c.x1) / 2 - r.cx, (c.y0 + c.y1) / 2 - r.cy) < 3)) return false;
    E.currents.push({ x0, y0, x1, y1, dx: horiz ? dir : 0, dy: horiz ? 0 : dir, push: W4_ENV.currentPush });
    return true;
  });
  // 수정은 부딪히는 자리 (두 기기 모두 같은 데이터로)
  for (const c of E.crystals) world.solids.push({ x: c.x, y: c.y, r: 0.35, w4: true });
}, 60);

// 레일 꺾은선 도우미
function w4PathLen(pts, loop) { let L = 0; const n = pts.length; for (let i = 0; i < (loop ? n : n - 1); i++) { const a = pts[i], b = pts[(i + 1) % n]; L += Math.hypot(b.x - a.x, b.y - a.y); } return L; }
function w4PathAt(rl, t) { // 길 위 거리 t 의 자리와 방향
  const pts = rl.pts, n = pts.length, loop = rl.loop, L = rl._len || (rl._len = w4PathLen(pts, loop));
  t = loop ? ((t % L) + L) % L : Math.max(0, Math.min(L, t));
  for (let i = 0; i < (loop ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b.x - a.x, b.y - a.y);
    if (t <= d || i === (loop ? n : n - 1) - 1) { const k = d ? Math.min(1, t / d) : 0; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dx: d ? (b.x - a.x) / d : 1, dy: d ? (b.y - a.y) / d : 0 }; }
    t -= d;
  }
  return { x: pts[0].x, y: pts[0].y, dx: 1, dy: 0 };
}
function w4NearRail(rl, x, y) { // 레일 선까지 거리
  let best = 99; const pts = rl.pts, n = pts.length;
  for (let i = 0; i < (rl.loop ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy || 1;
    const k = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / L2));
    best = Math.min(best, Math.hypot(x - (a.x + vx * k), y - (a.y + vy * k)));
  }
  return best;
}
function w4RailClear(pts, loop) {
  const n = pts.length;
  for (let i = 0; i < (loop ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b.x - a.x, b.y - a.y);
    for (let t = 0; t <= d; t += 0.5) { const x = a.x + (b.x - a.x) * t / d, y = a.y + (b.y - a.y) * t / d; if (hitsWall(x, y, 0.45) || (typeof isStair === "function" && isStair(Math.floor(x), Math.floor(y)))) return false; }
  }
  return true;
}

// 상자·열쇠 찾기 물건·위층 계단이 용암·레일·바닥 금·버섯 길·수정 위에 놓이지 않게 (w2EnvKeepClear 를 늘려요)
if (typeof w2EnvKeepClear === "function") {
  const w2KeepW4 = w2EnvKeepClear;
  w2EnvKeepClear = function (x, y, pad = 1.0) {
    if (w2KeepW4(x, y, pad)) return true;
    const E = world.w4;
    if (!E) return false;
    for (const l of E.lava) if (x > l.x0 - pad && x < l.x1 + pad && y > l.y0 - pad && y < l.y1 + pad) return true;
    for (const rl of E.rails) if (w4NearRail(rl, x, y) < pad + 0.4) return true;
    for (const c of E.cracks) if (Math.hypot(x - c.x, y - c.y) < pad + 0.5) return true;
    for (const s of E.shrooms) {
      const ex = s.x + s.dx * s.dist, ey = s.y + s.dy * s.dist;
      const t = Math.max(0, Math.min(1, ((x - s.x) * (ex - s.x) + (y - s.y) * (ey - s.y)) / (s.dist * s.dist)));
      if (Math.hypot(x - (s.x + (ex - s.x) * t), y - (s.y + (ey - s.y) * t)) < pad) return true;
    }
    for (const v of [...E.crystals, ...E.drips]) if (Math.hypot(x - v.x, y - v.y) < pad + 0.4) return true;
    return false;
  };
}

// ===== 소품 몬스터 (방장): 환경 상태 글자칸 + 광차 =====
function w4EnvProp() { return monsters.find((m) => m.type === "w4_env" && m.hp > 0) || null; }
function w4Carts() { return monsters.filter((m) => m.type === "w4_cart" && m.hp > 0); }
function w4CartOf(key) { return monsters.find((m) => m.type === "w4_cart" && m.w4Key === key) || null; }
function w4MakeProp(type, x, y) {
  const m = createMonster(type, x, y, game.mapLevel || 1);
  m.appearTimer = 0; m.aggro = false; m.immovable = true; m.r = type === "w4_cart" ? 0.45 : 0.05;
  monsters.push(m);
  return m;
}
// 방장 기기: 없으면 만들어요 (맵 시작·보스방·다시 도전마다 몬스터 목록이 새로 생겨요)
function w4EnsureProps(force) {
  const E = world.w4;
  if (!E || w4IsGuest() || (game.mode === "tower" && !W4_ENV.propsInTower && !force)) return;
  if ((E.crystals.length || E.cracks.length) && !w4EnvProp()) { const s = world.start || { x: 1, y: 1 }; w4MakeProp("w4_env", s.x, s.y); }
  E.rails.forEach((rl, ri) => {
    rl._len = w4PathLen(rl.pts, rl.loop);
    const n = rl.carts === 0 ? 0 : Math.max(1, rl.carts || 1); // carts: 0 = 광차 없는 레일 (보스가 레일만 써요: bosses_w4cartmine.js)
    for (let ci = 0; ci < n; ci++) {
      const key = "r" + ri + "c" + ci;
      if (w4CartOf(key)) continue;
      const t0 = rl._len * ci / n, at = w4PathAt(rl, t0);
      const m = w4MakeProp("w4_cart", at.x, at.y);
      Object.assign(m, { w4Kind: "cart", w4Rail: ri, w4Ci: ci, w4Key: key, w4T: t0, w4Dir: 1, w4Stop: ci === 0 ? W4_ENV.cartStop : 0, w4Brake: 0, w4BrakeCd: 0, w4Speed: rl.speed || W4_ENV.cartSpeed, faceX: at.dx, faceY: at.dy });
    }
  });
}
// 레일 하나 그리기 (침목 + 쇠줄 + 정류장 금색 발판). 보스 파일(bosses_w4cartmine.js)은 이 함수가 있으면 레일 선을 따로 안 그려요
function w4DrawRail(rl) {
  if (!rl.pts || rl.pts.length < 2) return;
  ctx.save(); ctx.strokeStyle = "rgba(120,84,48,0.9)"; ctx.lineWidth = 7 * ZOOM; ctx.beginPath();
  rl.pts.forEach((q, i) => { const s = toScreen(q.x, q.y, 0.02); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); });
  if (rl.loop) ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = "rgba(200,200,210,0.9)"; ctx.lineWidth = 2 * ZOOM; ctx.stroke(); ctx.restore();
  for (const st of rl.stops || []) { const a = w4PathAt(rl, st); w4Quad(a.x - 0.45, a.y - 0.45, a.x + 0.45, a.y + 0.45, "rgba(255,210,80,0.45)", 0.025); }
}
// 친구 기기: 방장 소품에서 받은 상태를 world.w4 에 다시 적어요 (w4Lit·w4CrackAt 이 두 기기에서 같게)
function w4GuestSync() {
  const E = world.w4; if (!E || !w4IsGuest()) return;
  const env = w4EnvProp();
  if (env && typeof env.cr === "string") E.crystals.forEach((c, i) => { if (c.bossProp) return; const v = parseInt(env.cr[i] || "0", 36) || 0; if (Math.abs((c.litT || 0) - v) >= 1 || (v === 0) !== !c.on) c.litT = v; c.on = c.litT > 0; });
  if (env && typeof env.ck === "string") E.cracks.forEach((c, i) => { const v = +(env.ck[i] || 0); if (v !== c.state) { c.state = v; c.t = v === 1 ? W4_ENV.crackShake[w4Diff()] : 0; } });
  // 열쇠 찾기 광차 고리 (방장이 정한 레일을 같은 자리 번호에)
  const ch = game.keyhunt && game.keyhunt.ch;
  // fromHost: 친구 기기가 스스로 만든 도전(첫 상태를 받기 전)은 자리가 다를 수 있어서 방장이 보낸 것만 믿어요
  if (ch && ch.id === "cartRide" && ch.fromHost && ch.rail && !ch.rail.reuse && typeof ch.rail.ps === "string" && ch.rail.ps && !E.rails[ch.rail.idx]) {
    while (E.rails.length < ch.rail.idx) E.rails.push({ pts: [], carts: 0, stops: [], speed: 0, loop: false, dummy: true });
    const pts = ch.rail.ps.split(";").map((t) => { const [x, y] = t.split(","); return { x: +x, y: +y }; });
    ch.rail.pts = pts;
    E.rails[ch.rail.idx] = { pts, carts: 1, stops: [0], speed: 4, loop: true };
  }
}

// ===== 빛 수정: 칼 휘두름·화살·마법이 지나가면 켜져요 =====
function w4CrystalHit(x, y, rad = 0.45) {
  for (const p of allPlayers()) if (p && p.hp > 0 && p.swingTimer > 0 && Math.hypot(p.x - x, p.y - y) < 1.7 && ((x - p.x) * (p.faceX || 0) + (y - p.y) * (p.faceY || 0)) > -0.3) return true;
  if (typeof shots !== "undefined") for (const s of shots) if (s && s.life > 0 && Math.hypot(s.x - x, s.y - y) < rad + 0.25) return true;
  if (typeof clsFx !== "undefined") for (const f of clsFx) if (f && typeof f.x === "number" && f.owner && Math.hypot(f.x - x, f.y - y) < rad + 0.3) return true;
  return false;
}
// 코드에서 수정 켜기 (보스·열쇠가 써요). 방장 기기에서 부르세요 (친구 기기는 방장이 보내요)
function w4LightCrystal(c, sec = W4_ENV.crystalLit) {
  if (!c) return;
  const was = c.on;
  c.litT = Math.max(c.litT || 0, sec); c.on = true;
  if (!was) { addRing(c.x, c.y, { speed: 3, life: 0.4, hue: 190 }); if (typeof sfx !== "undefined" && sfx.sparkle) sfx.sparkle(); w4Teach("crystal", "수정을 때리면 불이 켜져요!", "#9fe8ff"); }
}

// ===== 방장: 매 화면 =====
hookOn("dungeonTick", (dt) => {
  if (!w4EnvOn()) return;
  const E = world.w4;
  w4EnsureProps();
  // ① 수정
  for (const c of E.crystals) {
    if (c.bossProp) continue; // 보스가 자기 소품으로 켜고 끄는 수정 (bosses_w4glowcave.js)
    if (w4CrystalHit(c.x, c.y)) w4LightCrystal(c);
    if (c.litT > 0) { c.litT = Math.max(0, c.litT - dt); c.on = c.litT > 0; }
  }
  // ⑥ 바닥
  const shake = W4_ENV.crackShake[w4Diff()] || 1;
  for (const c of E.cracks) {
    const onIt = (q) => q && q.hp > 0 && Math.abs(q.x - c.x) < 0.5 && Math.abs(q.y - c.y) < 0.5;
    // 보스 파일이 상태를 바로 바꿨으면(영차 돌진 = 구멍, 쿵 = 흔들림) 시간을 여기서 채워요
    if (c._st !== c.state) { if (c.state === 1 && !(c.t > 0)) c.t = shake; else if (c.state === 2 && !(c.t > 0)) c.t = W4_ENV.crackBack; }
    if (c.state === 0) { if (allPlayers().some((q) => onIt(q) && !(q.w4Ride))) { c.state = 1; c.t = shake; w4Teach("crack", "금 간 바닥! 흔들리면 얼른 지나가요", "#d8b878"); } }
    else if (c.state === 1) { c.t -= dt; if (c.t <= 0) { c.state = 2; c.t = W4_ENV.crackBack; addRing(c.x, c.y, { speed: 2, life: 0.4, hue: 30 }); } }
    else { c.t -= dt; if (c.t <= 0) { c.state = 0; c.t = 0; } }
    c._st = c.state;
    if (c.state === 2) {
      for (const q of allPlayers()) if (onIt(q)) w4FallOut(q, c);
      for (const m of monsters) if (m.hp > 0 && m.def && m.def.behavior !== "prop" && !m.boss && !m.def.floaty && onIt(m)) { const s = w4SafeSpot(m.x, m.y, c); if (s) { m.x = s.x; m.y = s.y; } }
    }
  }
  // 상태를 소품 글자칸에 (친구에게)
  const env = w4EnvProp();
  if (env) {
    env.cr = E.crystals.map((c) => Math.min(35, Math.ceil(c.litT || 0)).toString(36)).join("");
    env.ck = E.cracks.map((c) => c.state).join("");
  }
  // ③ 광차
  for (const m of w4Carts()) w4CartTick(m, dt);
  // 몬스터: 용암 밖으로 (용암 걸음 몬스터 빼고), 물살에 둥실 몬스터
  for (const m of monsters) {
    if (m.hp <= 0 || !m.def || m.def.behavior === "prop" || m.boss || m.def.lavaWalk || m.def.floaty) continue;
    if (E.lava.length && w4OnLava(m.x, m.y)) { const t = w4LavaExit(m.x, m.y); if (t) { const d = Math.hypot(t.x - m.x, t.y - m.y) || 1; moveEntity(m, (t.x - m.x) / d * W4_ENV.lavaPush * dt, (t.y - m.y) / d * W4_ENV.lavaPush * dt); } }
  }
  for (const m of monsters) {
    if (m.hp <= 0 || !m.def || !m.def.floaty) continue;
    for (const c of E.currents || []) if (w4InRect(c, m.x, m.y)) moveEntity(m, c.dx * c.push * 0.6 * dt, c.dy * c.push * 0.6 * dt);
  }
  // ④ 종유석
  if (E.drips.length) {
    const t1 = game.time, t0 = E.dripT !== undefined && E.dripT <= t1 ? E.dripT : t1 - dt, L = game.mapLevel || 1;
    E.dripT = t1;
    const lead = ABILITIES.w4_drip.telegraph.time * abilityTuning().telegraph;
    for (const g of E.drips) {
      const ph0 = (t0 + g.offset + lead) % g.period, ph1 = (t1 + g.offset + lead) % g.period;
      if (ph1 >= ph0) continue;
      if (!allPlayers().some((p) => p.hp > 0 && Math.hypot(p.x - g.x, p.y - g.y) < W4_ENV.dripNear)) continue;
      w4DripAt(g.x, g.y, L);
      w4Teach("drip", "종유석 그림자! 진해지기 전에 밖으로", "#9fb8d0");
    }
  }
}, 62);

// 종유석 하나 (맵·보스가 같이 써요): 가짜 주인으로 예고를 넣어요. 방장 기기에서만 부르세요
function w4DripAt(x, y, L = game.mapLevel || 1, dmg = 1.2) {
  if (typeof casts === "undefined" || typeof makeCast !== "function") return null;
  const owner = { x, y, hp: 1, maxHp: 1, damage: dmg * monsterDamageMul(L) * diff().dmg, faceX: 1, faceY: 0, def: {}, state: "", w2Geyser: true, w4Drip: true };
  const tune = abilityTuning();
  const c = makeCast(owner, ABILITIES.w4_drip, "w4_drip", owner, ABILITIES.w4_drip.telegraph.time * tune.telegraph, tune);
  casts.push(c);
  return c;
}

// ⑥ 구멍에 빠짐: 하트 1(쉬움 0.5, 하트 0.5 밑으로는 안 내려가요) + 가까운 멀쩡한 칸 + 1.5초 무적
function w4SafeSpot(x, y, avoid) {
  for (let d = 1; d <= 6; d += 0.5) for (let k = 0; k < 16; k++) {
    const a = k * Math.PI / 8, tx = x + Math.cos(a) * d, ty = y + Math.sin(a) * d;
    if (avoid && Math.abs(tx - avoid.x) < 0.7 && Math.abs(ty - avoid.y) < 0.7) continue;
    if (!w4SafeLand(tx, ty)) continue;
    const c = w4CrackAt(tx, ty); if (c && c.state !== 0) continue;
    return { x: tx, y: ty };
  }
  return null;
}
function w4FallOut(p, c) {
  const s = w4SafeSpot(p.from ? p.from.x : p.x, p.y, c) || w4SafeSpot(p.x, p.y, c);
  const hurt = W4_ENV.fallHurt[w4Diff()] || 1;
  if (p.hp > 0.5) p.hp = Math.max(0.5, p.hp - hurt);
  if (s) { p.x = s.x; p.y = s.y; }
  p.rollTimer = 0; p.hurtTimer = Math.max(p.hurtTimer || 0, 1.5);
  if (p === game.player) { camera.x = p.x; camera.y = p.y; }
  addFloatText(p.x, p.y, "앗, 떨어졌어요!", "#ffb070", 18);
}

// ③ 광차 한 대 (방장)
function w4CartTick(m, dt) {
  const rl = world.w4.rails[m.w4Rail];
  if (!rl || !rl.pts || rl.pts.length < 2) return;
  rl._len = rl._len || w4PathLen(rl.pts, rl.loop);
  m.w4BrakeCd = Math.max(0, (m.w4BrakeCd || 0) - dt);
  const at0 = w4PathAt(rl, m.w4T), dir = m.w4Dir || 1, fx = at0.dx * dir, fy = at0.dy * dir;
  const riding = (q) => (q.remote ? Math.hypot(q.x - m.x, q.y - m.y) < 0.6 : q.w4Ride === m.w4Key);
  if (m.w4Stop > 0) m.w4Stop -= dt;
  else if (m.w4Brake > 0) { m.w4Brake -= dt; if (Math.random() < 0.5) addSparkle(m.x, m.y, 0.2, { vz: 1.5, life: 0.3, size: 0.5, gold: true }); }
  else {
    // 레일 위 주인공을 보면 멈칫 (앞 4칸)
    const ahead = allPlayers().some((q) => q && q.hp > 0 && !riding(q) && (() => { const ax = q.x - m.x, ay = q.y - m.y, f = ax * fx + ay * fy; return f > 0.2 && f < W4_ENV.cartLook && Math.abs(ax * -fy + ay * fx) < 0.8; })());
    if (ahead && m.w4BrakeCd <= 0) { m.w4Brake = W4_ENV.cartBrake[w4Diff()] || 0.8; m.w4BrakeCd = m.w4Brake + 2.2; addFloatText(m.x, m.y, "끼익!", "#ffd060", 16); }
    else {
      const t0 = m.w4T, sp = m.w4Speed || rl.speed || W4_ENV.cartSpeed;
      m.w4T += sp * dt * dir;
      // 정류장을 지나면 그 자리에서 1.5초 서요
      for (const st of rl.stops || []) {
        const L = rl._len, k0 = Math.floor((t0 - st) / L), k1 = Math.floor((m.w4T - st) / L);
        if (dir > 0 && k1 > k0) { m.w4T = st + L * k1; m.w4Stop = W4_ENV.cartStop; m.w4Arrive = (m.w4Arrive || 0) + 1; break; }
        const c0 = Math.ceil((t0 - st) / L), c1 = Math.ceil((m.w4T - st) / L);
        if (dir < 0 && c1 < c0) { m.w4T = st + L * c1; m.w4Stop = W4_ENV.cartStop; m.w4Arrive = (m.w4Arrive || 0) + 1; break; }
      }
      if (!rl.loop && (m.w4T <= 0 || m.w4T >= rl._len)) { m.w4T = Math.max(0, Math.min(rl._len, m.w4T)); m.w4Dir = -dir; m.w4Stop = W4_ENV.cartStop; }
    }
  }
  const at = w4PathAt(rl, m.w4T);
  m.x = at.x; m.y = at.y; m.faceX = at.dx * (m.w4Dir || 1); m.faceY = at.dy * (m.w4Dir || 1); m.moving = !(m.w4Stop > 0 || m.w4Brake > 0);
  // 부딪힘 (앞쪽, 타고 있지 않은 주인공)
  if (!m.moving) return;
  for (const q of allPlayers()) {
    if (!q || q.hp <= 0 || riding(q) || q.hurtTimer > 0 || q.rollTimer > 0) continue;
    const ax = q.x - m.x, ay = q.y - m.y, f = ax * m.faceX + ay * m.faceY, side = ax * -m.faceY + ay * m.faceX;
    if (f < -0.2 || f > 0.95 || Math.abs(side) > 0.7) continue;
    const L = game.mapLevel || 1;
    hurtPlayer(q, W4_ENV.cartHit * monsterDamageMul(L) * diff().dmg, m);
    const s = side >= 0 ? 1 : -1;
    moveEntity(q, -m.faceY * s * 0.9, m.faceX * s * 0.9);
    addFloatText(q.x, q.y, "덜컹!", "#ffd060", 18);
  }
}

// ⑤ 용암: 가장 가까운 강가 (다리 쪽 먼저)
function w4LavaExit(x, y) {
  const E = world.w4; if (!E) return null;
  for (const l of E.lava) {
    if (!w4InRect(l, x, y)) continue;
    let best = null, bd = 99;
    const tryP = (tx, ty, bonus = 0) => { const d = Math.hypot(tx - x, ty - y) - bonus; if (d < bd && w4Floor(tx, ty) && !w4OnLava(tx, ty)) { bd = d; best = { x: tx, y: ty }; } };
    for (const b of l.bridges) tryP(Math.max(b.x0 + 0.4, Math.min(b.x1 - 0.4, x)), Math.max(b.y0 + 0.4, Math.min(b.y1 - 0.4, y)), 0.5);
    tryP(l.x0 - 0.5, y); tryP(l.x1 + 0.5, y); tryP(x, l.y0 - 0.5); tryP(x, l.y1 + 0.5);
    return best;
  }
  return null;
}

// ===== 방장: 미는 힘 (netplay 95 뒤 96 에서: 친구 기기에도 가요) =====
hookOn("playersUpdated", (dt) => {
  if (!w4EnvOn()) return;
  dt = dt || 1 / 60;
  const E = world.w4;
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    // ⑤ 용암
    if (E.lava.length && !(p.w4Ride) && w4OnLava(p.x, p.y)) {
      w4Teach("lava", "용암은 뜨거워요! 금색 다리로 건너요", "#ffb04a");
      p._w4LavaT = (p._w4LavaT || 0) - dt;
      if (p._w4LavaT <= 0) {
        p._w4LavaT = W4_ENV.lavaTick;
        if (p.hp > 0.5) { p.hp = Math.max(0.5, p.hp - W4_ENV.lavaHurt); addFloatText(p.x, p.y, "앗 뜨거!", "#ffb04a", 16); }
        p.abBurn = Math.max(p.abBurn || 0, 1.5);
      }
      const t = w4LavaExit(p.x, p.y);
      if (t) { const d = Math.hypot(t.x - p.x, t.y - p.y) || 1; moveEntity(p, (t.x - p.x) / d * W4_ENV.lavaPush * dt, (t.y - p.y) / d * W4_ENV.lavaPush * dt); }
    } else p._w4LavaT = 0;
    // (+) 물살
    for (const c of E.currents || []) if (w4InRect(c, p.x, p.y)) {
      const k = p.rollTimer > 0 ? 0.3 : 1;
      moveEntity(p, c.dx * c.push * k * dt, c.dy * c.push * k * dt);
      w4Teach("current", "지하 물살! 거스르면 느려요, 타면 빨라요", "#9fe6ff");
    }
  }
}, 96);

// ===== 조작 단계 (기기마다 자기 주인공): 버섯 붕, 광차 타기 =====
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || game.scene !== "dungeon" || !world.w4) return inp;
  w4GuestSync();
  if (p.hp <= 0 || p.remote) return inp;
  const E = world.w4, t = game.time;
  // ③ 광차 타기
  if (p.w4Ride) {
    const m = w4CartOf(p.w4Ride);
    p.w4RideT = (p.w4RideT || 0) + 1 / 60;
    const getOff = (msg) => {
      const side = m ? { x: -m.faceY, y: m.faceX } : { x: 1, y: 0 };
      const s = m && (findFreeSpot(m.x + side.x * 1.1, m.y + side.y * 1.1, 0.35, 2) || findFreeSpot(m.x - side.x * 1.1, m.y - side.y * 1.1, 0.35, 2));
      if (s) { p.x = s.x; p.y = s.y; }
      p.w4Ride = null; p.w4RideT = 0; p._w4RideCd = t + 1.5;
      if (msg) addFloatText(p.x, p.y, msg, "#ffe27a", 16);
    };
    if (!m) { getOff(); return inp; }
    if (inp.rollPressed) { getOff("내렸어요"); return { ...inp, rollPressed: false }; }
    if (m.w4Stop > 0 && p.w4RideT > 1.0 && (m.w4Arrive || 0) !== p._w4BoardArrive) { getOff("도착!"); return inp; }
    p.x = m.x; p.y = m.y; p.move = null;
    return { ...inp, sx: 0, sy: 0, rollPressed: false };
  }
  if ((p._w4RideCd || 0) < t && !(p.rollTimer > 0)) for (const m of w4Carts()) {
    if (!(m.w4Stop > 0) || Math.hypot(p.x - m.x, p.y - m.y) > 0.5) continue;
    p.w4Ride = m.w4Key; p.w4RideT = 0; p._w4BoardArrive = m.w4Arrive || 0;
    addFloatText(p.x, p.y, "광차 탔어요!", "#ffe27a", 18);
    w4Teach("cart", "광차를 탔어요! 구르면 내려요", "#ffe27a");
    return { ...inp, sx: 0, sy: 0 };
  }
  // ② 버섯 붕 (해면·점프대와 같은 틀)
  p.w4Air = p.w4AirUntil ? Math.max(0, p.w4AirUntil - t) : 0;
  if (p.rollTimer > 0 || (p._w4ShroomUntil || 0) > t) return inp;
  for (const s of E.shrooms) {
    if (Math.hypot(p.x - s.x, p.y - s.y) > 0.45) continue;
    let D = 0;
    for (let k = 0.25; k <= s.dist + 1e-6; k += 0.25) { if (hitsWall(s.x + s.dx * k, s.y + s.dy * k, (p.r || 0.35) * 0.9)) break; D = k; }
    if (D < 1) continue;
    const T = W4_ENV.shroomHop.time * D / s.dist, rs = CONFIG.player.rollSpeed;
    p.x = s.x; p.y = s.y;
    p.rollTimer = T; p.rollX = s.dx * D / (rs * T); p.rollY = s.dy * D / (rs * T);
    p._w3Roll = true; // 월드 3 낮은 중력 1.5배를 곱하지 않게
    p.w4AirUntil = t + T; p.w4Air = T; p._w4ShroomUntil = t + T + 0.5;
    addFloatText(p.x, p.y, "통!", "#ff9ad6", 20); addRing(s.x, s.y, { speed: 3, life: 0.35, hue: 320 });
    if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
    w4Teach("shroom", "통통 버섯! 밟으면 화살표 쪽으로 붕", "#ff9ad6");
    break;
  }
  return inp;
}, 83);

// ===== 빛 =====
hookOn("lights", (lights) => {
  if (!w4EnvOn()) return;
  w4GuestSync();
  const E = world.w4;
  for (const c of E.crystals) {
    if (c.bossProp || !onScreen(c.x, c.y, 5)) continue; // 보스 수정은 보스 파일이 빛을 넣어요
    const L = W4_ENV.crystalLight, D = W4_ENV.crystalDim;
    if (c.on) { const k = Math.min(1, (c.litT || 0) / 2); lights.push({ x: c.x, y: c.y, radius: D.radius + (L.radius - D.radius) * k, power: D.power + (L.power - D.power) * k }); }
    else lights.push({ x: c.x, y: c.y, radius: D.radius, power: D.power });
  }
  for (const l of E.lava) { const cx = (l.x0 + l.x1) / 2, cy = (l.y0 + l.y1) / 2; if (onScreen(cx, cy, 8)) lights.push({ x: cx, y: cy, radius: Math.max(l.x1 - l.x0, l.y1 - l.y0) * 0.55, power: 0.35 }); }
}, 55);
// 공정성: 지하에서도 예고 장판 자리에 빛 (어둠이 위험을 숨기지 않게, 1-2 ①)
hookOn("lights", (lights) => {
  if (!(inWorld4() || w4EnvOn()) || typeof casts === "undefined") return;
  const per = {};
  for (const c of casts) {
    if (!c || !c.ab || (c.m && (c.m.pid || c.m === game.player || c.m.ally))) continue;
    per[c.id] = (per[c.id] || 0) + 1; if (per[c.id] > 3) continue;
    const sh = c.ab.telegraph.shape;
    if (sh === "line") for (const t of [0, 0.5, 1]) lights.push({ x: c.x + c.dirX * c.length * t, y: c.y + c.dirY * c.length * t, radius: c.width / 2 + 1.0, power: 0.75 });
    else if (sh === "cone") lights.push({ x: c.x + c.dirX * c.length * 0.5, y: c.y + c.dirY * c.length * 0.5, radius: c.length * 0.6, power: 0.75 });
    else lights.push({ x: c.x, y: c.y, radius: (c.radius || 1.5) + 0.6, power: 0.8 });
  }
}, 61);

// ===== 그리기 =====
function w4Quad(x0, y0, x1, y1, color, z = 0.012) { fillPoly([toScreen(x0, y0, z), toScreen(x1, y0, z), toScreen(x1, y1, z), toScreen(x0, y1, z)], color); }
function w4Circle(x, y, r, fill, stroke, lw = 2) {
  const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push(toScreen(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.015)); }
  if (fill) fillPoly(pts, fill);
  if (stroke) { ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = lw * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore(); }
}
hookOn("drawFloor", () => {
  if (!w4EnvOn()) return;
  w4GuestSync();
  const E = world.w4, t = game.time;
  // ⑤ 용암 (주황~노랑, 빨강 없음) + 금색 다리
  for (const l of E.lava) {
    if (!onScreen((l.x0 + l.x1) / 2, (l.y0 + l.y1) / 2, 10)) continue;
    const k = 0.5 + 0.5 * Math.sin(t * Math.PI);
    w4Quad(l.x0, l.y0, l.x1, l.y1, `rgb(255,${Math.round(150 + 58 * k)},${Math.round(58 + 38 * k)})`);
    for (const b of l.bridges) { w4Quad(b.x0, b.y0, b.x1, b.y1, "#8a5a32", 0.02); w4Quad(b.x0 + 0.08, b.y0 + 0.08, b.x1 - 0.08, b.y1 - 0.08, "#a87444", 0.022); }
    for (const b of l.bridges) { ctx.save(); ctx.strokeStyle = "rgba(255,226,122,0.95)"; ctx.lineWidth = 2.5 * ZOOM; const q = [toScreen(b.x0, b.y0, 0.025), toScreen(b.x1, b.y0, 0.025), toScreen(b.x1, b.y1, 0.025), toScreen(b.x0, b.y1, 0.025)]; ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  }
  // (+) 물살
  for (const c of E.currents || []) if (onScreen((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, 6)) w4Quad(c.x0, c.y0, c.x1, c.y1, "rgba(150,230,255,0.18)");
  // ③ 레일 (침목 + 쇠줄) + 정류장 금색 발판 + 광차 앞 빨간 줄
  for (const rl of E.rails) w4DrawRail(rl);
  for (const m of w4Carts()) {
    if (m.w4Stop > 0 || !onScreen(m.x, m.y, 5)) continue;
    const a = toScreen(m.x + m.faceX * 0.6, m.y + m.faceY * 0.6, 0.03), b = toScreen(m.x + m.faceX * 3, m.y + m.faceY * 3, 0.03);
    ctx.save(); ctx.strokeStyle = "rgba(255,70,70,0.75)"; ctx.lineWidth = 4 * ZOOM; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
  }
  // ⑥ 바닥 금
  for (const c of E.cracks) {
    if (!onScreen(c.x, c.y, 3)) continue;
    if (c.state === 2) { w4Quad(c.x - 0.5, c.y - 0.5, c.x + 0.5, c.y + 0.5, "rgba(8,6,6,0.92)"); continue; }
    const jig = c.state === 1 ? Math.sin(t * 40) * 0.03 : 0;
    w4Quad(c.x - 0.46 + jig, c.y - 0.46, c.x + 0.46 + jig, c.y + 0.46, c.state === 1 ? "rgba(140,110,80,0.6)" : "rgba(120,100,80,0.35)");
    const p1 = toScreen(c.x - 0.3 + jig, c.y - 0.2, 0.02), p2 = toScreen(c.x + jig, c.y + 0.05, 0.02), p3 = toScreen(c.x + 0.3 + jig, c.y - 0.1, 0.02), p4 = toScreen(c.x + 0.1 + jig, c.y + 0.35, 0.02);
    ctx.save(); ctx.strokeStyle = c.state === 1 ? "rgba(255,80,80,0.9)" : "rgba(30,20,15,0.8)"; ctx.lineWidth = 2 * ZOOM; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.moveTo(p2.x, p2.y); ctx.lineTo(p4.x, p4.y); ctx.stroke(); ctx.restore();
  }
  // ② 버섯 착지 자리 (금색)
  for (const s of E.shrooms) {
    if (!onScreen(s.x, s.y, 5)) continue;
    w4Circle(s.x + s.dx * s.dist, s.y + s.dy * s.dist, 0.45, "rgba(255,226,122,0.18)", "rgba(255,226,122,0.75)", 2);
  }
  // ④ 종유석 자리 (흐린 점)
  for (const g of E.drips) if (onScreen(g.x, g.y, 3)) w4Circle(g.x, g.y, 0.3, "rgba(40,40,50,0.35)", null);
}, 52);
function w4DrawCrystal(c) {
  const col = c.on ? c.hue || "#7fe0ff" : "#4a5060";
  drawBox(c.x - 0.09, c.y - 0.09, 0, 0.18, 0.18, 0.8, col);
  drawBox(c.x + 0.06, c.y - 0.16, 0, 0.16, 0.16, 0.55, col);
  drawBox(c.x - 0.2, c.y + 0.04, 0, 0.15, 0.15, 0.5, col);
  if (c.on && Math.random() < 0.15) addSparkle(c.x + (Math.random() - 0.5) * 0.4, c.y + (Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.6, { vz: 0.6, life: 0.5, size: 0.45, hue: 190 });
}
function w4DrawShroom(s) {
  const bob = 0.02 * Math.sin(game.time * 5 + s.x);
  drawBox(s.x - 0.1, s.y - 0.1, 0, 0.2, 0.2, 0.3, "#f2e6d8");
  drawBox(s.x - 0.5, s.y - 0.5, 0.3 + bob, 1.0, 1.0, 0.18, "#ff9ad6");
  drawBox(s.x - 0.3, s.y - 0.3, 0.48 + bob, 0.6, 0.6, 0.06, "#ffc8e8");
  drawBox(s.x + s.dx * 0.25 - 0.06, s.y + s.dy * 0.25 - 0.06, 0.54 + bob, 0.12, 0.12, 0.04, "#ffd23f");
}
function w4DrawStalactite(g) {
  const sw = (casts || []).some((c) => c && c.id === "w4_drip" && Math.hypot(c.x - g.x, c.y - g.y) < 0.2) ? Math.sin(game.time * 30) * 0.04 : 0;
  drawBox(g.x - 0.18 + sw, g.y - 0.18, 2.3, 0.36, 0.36, 0.3, "#7a7c88");
  drawBox(g.x - 0.12 + sw, g.y - 0.12, 2.0, 0.24, 0.24, 0.3, "#8a8c98");
  drawBox(g.x - 0.06 + sw, g.y - 0.06, 1.75, 0.12, 0.12, 0.25, "#9a9ca8");
}
hookOn("worldThings", (things) => {
  if (!w4EnvOn()) return;
  const E = world.w4;
  for (const c of E.crystals) if (!c.bossProp && onScreen(c.x, c.y, 2)) things.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => w4DrawCrystal(c) });
  for (const s of E.shrooms) if (onScreen(s.x, s.y, 2)) things.push({ depth: s.x + s.y - 0.4, x: s.x, y: s.y, draw: () => w4DrawShroom(s) });
  for (const g of E.drips) if (onScreen(g.x, g.y, 3)) things.push({ depth: g.x + g.y + 0.5, x: g.x, y: g.y, draw: () => w4DrawStalactite(g) });
}, 52);
// 소품 모양: 광차 (나무 상자 + 쇠 바퀴), 환경 소품은 안 보여요
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, {
  w4_env() {},
  w4_cart(m) {
    const x = m.x, y = m.y, rail = m.moving ? Math.sin(game.time * 20) * 0.01 : 0;
    drawBox(x - 0.42, y - 0.32, 0.12 + rail, 0.84, 0.64, 0.42, "#8a6a4a");
    drawBox(x - 0.36, y - 0.26, 0.5 + rail, 0.72, 0.52, 0.04, "#5a4430");
    for (const [ox, oy] of [[-0.3, -0.34], [0.3, -0.34], [-0.3, 0.34], [0.3, 0.34]]) drawBox(x + ox - 0.07, y + oy - 0.04, 0, 0.14, 0.08, 0.14, "#4a4a52");
    if (m.w4Stop > 0) drawBox(x - 0.1, y - 0.1, 0.62, 0.2, 0.2, 0.06, "#ffd23f");
  },
});

// ===== 새 열쇠 찾기 2종 (keyhunt.js KEY_CHALLENGES 계약) =====
function w4KeyLitSec() { return { easy: 15, normal: 12, hard: 11, nightmare: 10 }[w4Diff()] || 12; }
if (typeof KEY_CHALLENGES !== "undefined") Object.assign(KEY_CHALLENGES, {
  // 빛 수정 켜기: 큰 수정 3개를 동시에 켜 두면 열쇠
  crystalLight: {
    name: "빛 수정 켜기", desc: "큰 수정 세 개를 때려서 한꺼번에 켜요",
    setup(ch) {
      const r = khTakeRoom((q) => q.w >= 9 && q.h >= 8);
      if (!r || r.w < 8 || r.h < 7) return false;
      ch.room = r; ch.crystals = [[0.22, 0.3], [0.78, 0.3], [0.5, 0.78]].map(([fx, fy]) => { const s = khSpot(r, fx, fy, 0.6); return { x: s.x, y: s.y, t: 0 }; });
      ch.lit = 0; ch.started = false;
      return true;
    },
    update(ch, p, dt) {
      if (!dt) return;
      const sec = w4KeyLitSec();
      for (const c of ch.crystals) {
        if (w4CrystalHit(c.x, c.y, 0.6)) { if (!(c.t > 0)) { addRing(c.x, c.y, { speed: 3, life: 0.4, hue: 190 }); addFloatText(c.x, c.y, "반짝!", "#9fe8ff", 18); } c.t = sec; }
        else if (c.t > 0) c.t = Math.max(0, c.t - dt);
      }
      ch.lit = ch.crystals.filter((c) => c.t > 0).length;
      if (ch.lit && !ch.started) { ch.started = true; showMessage("수정 세 개를 다 켜요!", 2.5, false, "#9fe8ff"); }
      if (ch.lit >= ch.crystals.length) khStepDone(ch.crystals[2]);
    },
    floor(ch) { for (const c of ch.crystals) khFloorCircle(c.x, c.y, 0.75, c.t > 0 ? "rgba(127,224,255,0.25)" : "rgba(255,226,122,0.10)", c.t > 0 ? "rgba(127,224,255,0.9)" : "rgba(255,210,80,0.8)", 3); },
    things(ch, list) { for (const c of ch.crystals) list.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => {
      const col = c.t > 0 ? "#9fe8ff" : "#4a5466";
      drawBox(c.x - 0.35, c.y - 0.35, 0, 0.7, 0.7, 0.15, "#5a5a66");
      drawBox(c.x - 0.14, c.y - 0.14, 0.15, 0.28, 0.28, 1.2, col); drawBox(c.x + 0.08, c.y - 0.24, 0.15, 0.2, 0.2, 0.8, col); drawBox(c.x - 0.28, c.y + 0.06, 0.15, 0.2, 0.2, 0.7, col);
    } }); },
    lights(ch) { return ch.crystals.map((c) => ({ x: c.x, y: c.y, radius: c.t > 0 ? 3 : 1.2, power: c.t > 0 ? 0.8 : 0.35 })); },
    status(ch) { return `수정 ${ch.lit}/${ch.crystals.length}` + (ch.lit ? ` · ${Math.ceil(Math.min(...ch.crystals.filter((c) => c.t > 0).map((c) => c.t)))}초` : ""); },
    target(ch) { return ch.crystals.find((c) => !(c.t > 0)) || ch.crystals[0]; },
  },
  // 광차 타고 과녁 맞히기: 고리 레일 + 정류장 + 과녁 3개. 광차를 타고 지나가며 과녁을 다 맞히면 열쇠
  cartRide: {
    name: "광차 타고 과녁 맞히기", desc: "광차를 타고 지나가며 과녁 세 개를 칼이나 활로 맞혀요",
    setup(ch) {
      const E = world.w4;
      if (!E || !E.rails.length && !(game.mapDef && game.mapDef.features && game.mapDef.features.rails)) return false; // 레일 맵에서만 (아니면 다른 열쇠)
      const free = (q) => Math.max(q.w, q.h) >= 8 && Math.min(q.w, q.h) >= 7 && !E.rails.some((rl) => rl.pts.some((pt) => pt.x > q.x && pt.x < q.x + q.w && pt.y > q.y && pt.y < q.y + q.h)) && !E.lava.some((l) => l.x0 < q.x + q.w && l.x1 > q.x && l.y0 < q.y + q.h && l.y1 > q.y);
      const r = khTakeRoom(free);
      let pts = null, reuse = -1;
      if (r && free(r)) {
        const x0 = r.x + 1.6, y0 = r.y + 1.6, x1 = r.x + r.w - 1.6, y1 = r.y + r.h - 1.6;
        pts = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
        if (!w4RailClear(pts, true)) pts = null;
      }
      if (!pts) { // 빈 방이 없으면 맵에 있는 고리 레일을 써요 (첫 광차)
        reuse = E.rails.findIndex((rl) => rl.loop && rl.pts.length === 4 && Math.abs(rl.pts[2].x - rl.pts[0].x) >= 4 && Math.abs(rl.pts[2].y - rl.pts[0].y) >= 3.5);
        if (reuse < 0) return false;
        pts = E.rails[reuse].pts;
      }
      const x0 = pts[0].x, y0 = pts[0].y, x1 = pts[2].x, y1 = pts[2].y;
      ch.room = r; ch.rail = { idx: reuse >= 0 ? reuse : E.rails.length, pts: pts.map((q) => ({ x: q.x, y: q.y })), ps: pts.map((q) => q.x + "," + q.y).join(";"), reuse: reuse >= 0 };
      // ps: 친구에게 보내는 글자 꼴 (열쇠 상태는 4단계 깊이까지만 가서 pts 안 점은 비어 도착해요)
      // 과녁: 레일 안쪽 1.5칸
      ch.targets = [{ x: (x0 + x1) / 2, y: y0 + 1.2 }, { x: x1 - 1.2, y: (y0 + y1) / 2 }, { x: (x0 + x1) / 2, y: y1 - 1.2 }].map((t) => ({ ...t, hit: false }));
      ch.got = 0; ch.fromHost = !w4IsGuest();
      if (!w4IsGuest() && !ch.rail.reuse) { w4AddRail(world, pts, { carts: 1, stops: [0], speed: 4, loop: true }); w4EnsureProps(true); }
      return true;
    },
    update(ch) {
      const cart = w4CartOf("r" + ch.rail.idx + "c0");
      const riders = khPlayers().filter((q) => cart && Math.hypot(q.x - cart.x, q.y - cart.y) < 0.65);
      for (const tg of ch.targets) {
        if (tg.hit) continue;
        const byShot = typeof shots !== "undefined" && shots.some((s) => s && s.life > 0 && Math.hypot(s.x - tg.x, s.y - tg.y) < 0.6);
        const bySword = riders.some((q) => q.swingTimer > 0 && Math.hypot(q.x - tg.x, q.y - tg.y) < 2.0);
        if ((byShot && riders.length) || bySword) { tg.hit = true; ch.got++; addFloatText(tg.x, tg.y, `맞혔다! ${ch.got}/3`, "#ffe27a", 20); addRing(tg.x, tg.y, { speed: 3, life: 0.4, gold: true }); }
      }
      if (!ch.told && riders.length) { ch.told = true; showMessage("광차에서 과녁을 맞혀요! (구르면 내려요)", 2.6, false, "#ffe27a"); }
      if (ch.got >= ch.targets.length) khStepDone(ch.targets[0]);
    },
    floor(ch) { for (const tg of ch.targets) khFloorCircle(tg.x, tg.y, 0.5, tg.hit ? "rgba(125,255,176,0.25)" : "rgba(255,226,122,0.15)", "rgba(255,210,80,0.9)", 3); },
    things(ch, list) { for (const tg of ch.targets) if (!tg.hit) list.push({ depth: tg.x + tg.y, x: tg.x, y: tg.y, draw: () => {
      drawBox(tg.x - 0.05, tg.y - 0.05, 0, 0.1, 0.1, 0.7, "#6b4a2a");
      drawBox(tg.x - 0.28, tg.y - 0.06, 0.7, 0.56, 0.12, 0.56, "#f2e6d8"); drawBox(tg.x - 0.16, tg.y - 0.08, 0.82, 0.32, 0.14, 0.32, "#e8483a");
    } }); },
    lights(ch) { return ch.targets.map((t) => ({ x: t.x, y: t.y, radius: 1.6, power: 0.6 })); },
    status(ch) { return `과녁 ${ch.got}/${ch.targets.length} · 광차를 타요`; },
    target(ch) { const c = w4CartOf("r" + ch.rail.idx + "c0"); return c && c.w4Stop > 0 ? c : ch.targets.find((t) => !t.hit) || ch.targets[0]; },
  },
});
// 설계서 열쇠로 바꿔요 (열쇠 2종이 생겼어요: under.js 의 임시 열쇠)
if (typeof W4_MAPS !== "undefined") for (const [id, key] of Object.entries({ glowcave: ["crystalLight", "guardian"], cartmine: ["cartRide", "levers"], crystalhall: ["crystalLight", "dark", "mimic"], forge: ["cartRide", "torches", "hold"] })) {
  const m = W4_MAPS.find((x) => x.id === id); if (m) m.key = key;
}
