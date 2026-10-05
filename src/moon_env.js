// ===== 월드 3 "달" 환경 (설계서 docs/design/world3-moon.md 2-3, 6장) =====
//   ① 낮은 중력 lowgrav  방 하나: 구르면 1.5배 멀리 (무적 시간은 그대로), 밀리는 힘 1.3배
//   ② 달먼지 dust        원: 걸으면 0.75배 (구르기는 그대로), 몬스터도 0.75배
//   ③ 크레이터 craters    원: 가운데로 0.9칸/초 끌려요 (방장이 밀어요: 물살과 같은 방식)
//   ④ 통통 점프대 pads     밟으면 화살표 쪽으로 4.5칸 0.6초 붕 (나는 동안 땅 공격 "ground" 안 맞아요: w3Air)
//   ⑤ 지구빛 earthlight / 지구빛 탑 towers   어두운 맵의 빛 (탑 빛 안에선 그림자 늑대가 또렷해요)
//   ⑥ 별똥별 meteors      방장이 박자마다 예고(그림자 1.6초)를 만들어요 (월드 2 물기둥 분출구와 같은 방식)
//   (+) 공기 돔 domes     서 있으면 하트가 조금씩 차요 (월드 2 거품 기둥과 같은 규칙)
//   (+) 일식 eclipse       24초마다 8초 깜깜 (3초 전에 알려요). 깜깜해도 예고는 빛나요
// 놓기는 씨앗 난수(rand)로 monstersSpawned 에서: 같이 하기 두 기기가 같은 자리를 만들어요.
// 몸에 붙는 효과(먼지·낮은 중력·점프대)는 조작 단계(playerInput)라 기기마다 자기 주인공을 똑같이 움직여요.

const W3_ENV = {
  rollMul: 1.5, knockMul: 1.3, dustMul: 0.75, craterPull: 0.9, hopDist: 4.5, hopTime: 0.6,
  meteorPeriod: 6.5, meteorNear: 12, domeStand: 1.2, domeHeal: 0.35, domeCharge: 3, domeRefill: 9,
  eclipse: { period: 24, warn: 3, dark: 8, lightDark: 0.35, darkDark: 0.8 },
};

function w3EnvOn() { return inWorld3() && !!world.w3; }
function w3Diff() { return (game.profile && game.profile.difficulty) || "normal"; }
// 처음 한 번만 알려줘요 (판마다)
function w3Teach(key, text, color = "#d6daea") {
  const E = world.w3; if (!E) return;
  E.taught = E.taught || {};
  if (E.taught[key]) return;
  E.taught[key] = true;
  showMessage(text, 2.6, false, color);
}
// 열쇠 찾기(padHop)가 놓은 점프대·먼지도 같이 봐요 (열쇠 찾기 상태는 같이 하기 친구 기기에도 가요)
function w3ChField(k) { const kh = game.keyhunt, ch = kh && kh.ch; return ch && Array.isArray(ch[k]) ? ch[k] : []; }
function w3AllPads() { const E = world.w3; return [...((E && E.pads) || []), ...w3ChField("pads")]; }
function w3AllDust() { const E = world.w3; return [...((E && E.dust) || []), ...w3ChField("dust")]; }
function w3OnDustAt(x, y) { return !!w3InZone(w3AllDust(), x, y); }

// ----- 놓기 -----
function w3EnvSpot(rand, rooms, pad, rad) { return typeof w2EnvSpot === "function" ? w2EnvSpot(rand, rooms, pad, rad) : null; }
function w3Far(list, x, y, d) { return typeof w2FarFromOthers === "function" ? w2FarFromOthers(list, x, y, d) : true; }
hookOn("monstersSpawned", (def, level, rand) => {
  if (!def || mapWorld(def) !== 3 || !def.features) return;
  const f = def.features, E = w3EnsureEnv();
  E.domes = []; E.eclipse = null;
  const rooms = (world.rooms || []).slice(1);
  if (!rooms.length) return;
  const all = () => [...E.craters, ...E.pads, ...E.towers, ...E.meteors, ...E.domes];
  const floorAt = (x, y) => !isWall(Math.floor(x), Math.floor(y));
  // ③ 크레이터: 방 가운데 근처, 방이 충분히 클 때만
  for (let i = 0; i < (f.craters || 0); i++) w3Tries(() => {
    const r = rooms[Math.floor(rand() * rooms.length)], rr = 2 + rand();
    if (r.w < rr * 2 + 2 || r.h < rr * 2 + 2) return false;
    const x = r.cx + (rand() - 0.5) * (r.w - rr * 2 - 2), y = r.cy + (rand() - 0.5) * (r.h - rr * 2 - 2);
    if (!floorAt(x, y) || !w3Far(all(), x, y, rr + 1.4) || world.solids.some((o) => Math.hypot(o.x - x, o.y - y) < rr + 0.5) || (typeof w2NearDoorSpot === "function" && w2NearDoorSpot(x, y, rr + 1.5))) return false;
    w3AddCrater(x, y, rr);
    return true;
  });
  // ① 낮은 중력: 방 하나 통째 (벽 안쪽)
  const usedLG = new Set();
  for (let i = 0; i < (f.lowgrav || 0); i++) w3Tries(() => {
    const r = rooms[Math.floor(rand() * rooms.length)];
    if (usedLG.has(r)) return false;
    usedLG.add(r);
    w3AddLowGrav(r.x + 0.5, r.y + 0.5, r.x + r.w - 0.5, r.y + r.h - 0.5);
    return true;
  });
  // ② 달먼지: 방 안 빈 자리
  for (let i = 0; i < (f.dust || 0); i++) w3Tries(() => { const s = w3EnvSpot(rand, rooms, 1.8, 0.6); if (!(s && w3Far(E.dust, s.x, s.y, 2.6))) return false; w3AddDust(s.x, s.y, 1.6 + rand() * 0.8); return true; });
  // ⑤ 지구빛 탑: 큰 방 가운데
  //   큰 방이 모자라거나 가운데가 막혔으면 다음으로 큰 방에서 다시 (탑이 하나도 없는 어두운 맵이 없게)
  const bigRooms = rooms.filter((r) => r.w >= 8 && r.h >= 8);
  const roomPool = bigRooms.length >= 2 ? bigRooms : [...rooms].sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 4);
  for (let i = 0; i < (f.towers || 0); i++) w3Tries(() => {
    const r = roomPool[Math.floor(rand() * roomPool.length)];
    if (!r || E.towers.some((t) => Math.hypot(t.x - r.cx, t.y - r.cy) < 5)) return false;
    const s = findFreeSpot(r.cx + (rand() - 0.5) * 2, r.cy + (rand() - 0.5) * 2, 0.5, 3);
    if (!(s && w3Far(all(), s.x, s.y, 2))) return false;
    w3AddTower(s.x, s.y); return true;
  });
  // ⑤ 지구빛 수정
  for (let i = 0; i < (f.earthlight || 0); i++) w3Tries(() => { const s = w3EnvSpot(rand, rooms, 1.0, 0.4); if (!(s && w3Far(E.lights, s.x, s.y, 1.6))) return false; E.lights.push({ x: s.x, y: s.y, c: ["#9fe8ff", "#7fb8ff", "#c8a8ff"][Math.floor(rand() * 3)], h: 0.4 + rand() * 0.4 }); return true; });
  // ④ 점프대: 날아갈 길이 다 바닥(같은 높이)인 방향만 (월드 2 해면 규칙)
  for (let i = 0; i < (f.pads || 0); i++) w3Tries(() => {
    const s = w3EnvSpot(rand, rooms, 1.2, 0.5);
    if (!s || !w3Far(all(), s.x, s.y, 2.5)) return false;
    const h0 = typeof tileH === "function" ? tileH(Math.floor(s.x), Math.floor(s.y)) : 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], start = Math.floor(rand() * 4), D = W3_ENV.hopDist;
    for (let k = 0; k < 4; k++) {
      const [dx, dy] = dirs[(start + k) % 4];
      let ok = true;
      for (let t = 0.4; t <= D + 0.6 && ok; t += 0.25) {
        const x = s.x + dx * t, y = s.y + dy * t;
        if (hitsWall(x, y, 0.4) || (typeof w2SameH === "function" && !w2SameH(x, y, h0)) || (typeof isStair === "function" && isStair(Math.floor(x), Math.floor(y))) || (typeof w2NearDoorSpot === "function" && w2NearDoorSpot(x, y, 2.6)) || E.craters.some((c) => Math.hypot(c.x - x, c.y - y) < c.r)) ok = false;
      }
      if (ok) { w3AddPad(s.x, s.y, dx, dy, world, D); return true; }
    }
    return false;
  });
  // ⑥ 별똥별
  for (let i = 0; i < (f.meteors || 0); i++) w3Tries(() => { const s = w3EnvSpot(rand, rooms, 1.5, 0.8); if (!(s && w3Far(all(), s.x, s.y, 2.6))) return false; w3AddMeteor(s.x, s.y, W3_ENV.meteorPeriod, rand() * W3_ENV.meteorPeriod); return true; });
  // (+) 공기 돔
  for (let i = 0; i < (f.domes || 0); i++) w3Tries(() => { const s = w3EnvSpot(rand, rooms, 1.6, 0.9); if (!(s && w3Far(all(), s.x, s.y, 3))) return false; E.domes.push({ x: s.x, y: s.y, r: 1.0, charge: W3_ENV.domeCharge, refill: 0 }); return true; });
  // (+) 일식
  if (f.eclipse) E.eclipse = { ...W3_ENV.eclipse, base: theme0(def) };
}, 60);
// 자리 고르기를 몇 번까지 다시 해 봐요 (씨앗 난수라 두 기기가 같은 자리, 한 번에 못 찾아 개수가 모자라던 것)
function w3Tries(fn, n = 25) { for (let t = 0; t < n; t++) if (fn()) return true; return false; }
function theme0(def) { return (def.theme && def.theme.darkness) || 0.4; }

// 상자·열쇠 찾기 물건·위층 계단이 점프대 길·크레이터 위에 놓이지 않게 (w2EnvKeepClear 를 늘려요: chest.js·keyhunt.js·upper.js 가 불러요)
if (typeof w2EnvKeepClear === "function") {
  const w2Keep = w2EnvKeepClear;
  w2EnvKeepClear = function (x, y, pad = 1.0) {
    if (w2Keep(x, y, pad)) return true;
    const E = world.w3;
    if (!E) return false;
    for (const s of E.pads || []) {
      const ex = s.x + s.dx * s.dist, ey = s.y + s.dy * s.dist;
      const t = Math.max(0, Math.min(1, ((x - s.x) * (ex - s.x) + (y - s.y) * (ey - s.y)) / (s.dist * s.dist)));
      if (Math.hypot(x - (s.x + (ex - s.x) * t), y - (s.y + (ey - s.y) * t)) < pad) return true;
    }
    for (const c of E.craters || []) if (Math.hypot(x - c.x, y - c.y) < c.r) return true;
    for (const v of [...(E.domes || []), ...(E.meteors || []), ...(E.towers || [])]) if (Math.hypot(x - v.x, y - v.y) < pad + 0.4) return true;
    return false;
  };
}

// ----- 조작 단계 (기기마다 자기 주인공) -----
// ④ 점프대 (해면과 같은 틀)
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || p.hp <= 0 || game.scene !== "dungeon" || !world.w3 && !w3ChField("pads").length) return inp;
  const t = game.time;
  p.w3Air = p.w3AirUntil ? Math.max(0, p.w3AirUntil - t) : 0;
  if (p.rollTimer > 0 || (p._w3PadUntil || 0) > t) return inp;
  for (const s of w3AllPads()) {
    if (Math.hypot(p.x - s.x, p.y - s.y) > 0.45) continue;
    let D = 0;
    for (let k = 0.25; k <= s.dist + 1e-6; k += 0.25) { if (hitsWall(s.x + s.dx * k, s.y + s.dy * k, (p.r || 0.35) * 0.9)) break; D = k; }
    if (D < 1) continue;
    const T = W3_ENV.hopTime * D / s.dist, rs = CONFIG.player.rollSpeed;
    p.x = s.x; p.y = s.y;
    p.rollTimer = T; p.rollX = s.dx * D / (rs * T); p.rollY = s.dy * D / (rs * T);
    p._w3Roll = true; // 낮은 중력 1.5배를 또 곱하지 않게
    p.w3AirUntil = t + T; p.w3Air = T; p._w3PadUntil = t + T + 0.5;
    addFloatText(p.x, p.y, "붕!", "#ffe27a", 20); addRing(s.x, s.y, { speed: 3, life: 0.35, hue: 50 });
    if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
    w3Teach("pad", "통통 점프대! 밟으면 화살표 쪽으로 붕", "#ffe27a");
    break;
  }
  return inp;
}, 84);
// ① 낮은 중력 구르기 1.5배 (같은 시간에 더 멀리: 무적 시간은 그대로) · ② 먼지 위 걷기 0.75배
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || p.hp <= 0 || game.scene !== "dungeon") return inp;
  if (!(p.rollTimer > 0)) p._w3Roll = false;
  else if (!p._w3Roll) {
    p._w3Roll = true;
    if (world.w3 && w3InLowGrav(p)) { p.rollX *= W3_ENV.rollMul; p.rollY *= W3_ENV.rollMul; w3Teach("lowgrav", "몸이 가벼워요! 구르면 멀리 가요", "#bfe6ff"); }
  }
  if (p.rollTimer > 0 || !w3OnDustAt(p.x, p.y)) return inp;
  w3Teach("dust", "푹신한 먼지! 걸으면 느려요, 구르면 빨리 나가요", "#e0dccf");
  return { ...inp, sx: inp.sx * W3_ENV.dustMul, sy: inp.sy * W3_ENV.dustMul };
}, 86);
// 땅 공격(tags "ground")은 점프대로 나는 동안 안 맞아요
hookOn("resolveCast", (c) => {
  if (!c || !c.ab || !(c.ab.tags || []).includes("ground")) return false;
  c._w3AirSafe = allPlayers().filter((q) => w3Air(q));
  for (const q of c._w3AirSafe) { q._w3AirHurt = q.hurtTimer; q.hurtTimer = Math.max(q.hurtTimer || 0, 0.05); }
  return false;
}, 5);
hookOn("castResolved", (c) => {
  if (!c || !c._w3AirSafe) return;
  for (const q of c._w3AirSafe) { q.hurtTimer = q._w3AirHurt || 0; addFloatText(q.x, q.y, "붕 떠서 안전!", "#ffe27a", 16); }
  c._w3AirSafe = null;
}, 95);

// ----- 방장: 미는 힘·몬스터·박자 -----
// ③ 크레이터: 주인공을 가운데로 (netplay 가 친구 자리를 적은 뒤 95 → 96 에서 밀어야 친구 기기에도 가요) · 공기 돔
hookOn("playersUpdated", (dt) => {
  if (!w3EnvOn()) return;
  dt = dt || 1 / 60;
  const E = world.w3;
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    for (const c of E.craters) {
      const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy);
      if (d >= c.r || d < 0.6 || w3Air(p)) continue;
      const k = (p.rollTimer > 0 ? 0.3 : 1) * W3_ENV.craterPull * (c.pullMul || 1) * dt; // pullMul: 달의 여왕 반달 단계 x1.5 (bosses_w3d.js)
      moveEntity(p, dx / d * k, dy / d * k);
      w3Teach("crater", "크레이터! 가운데로 미끄러져요. 걸어서 나와요", "#cfd0dc");
    }
    let inDome = false;
    for (const v of E.domes || []) {
      if (Math.hypot(p.x - v.x, p.y - v.y) > v.r) continue;
      inDome = true;
      w3Teach("dome", "공기 돔! 서 있으면 하트가 차요", "#bff6ff");
      if (v.charge <= 0) continue;
      p._w3DomeT = (p._w3DomeT || 0) + dt;
      if (p._w3DomeT >= W3_ENV.domeStand) {
        p._w3DomeT = 0; v.charge--; if (v.charge <= 0) v.refill = W3_ENV.domeRefill;
        const heal = (typeof POTION !== "undefined" ? POTION.heal : 4) * W3_ENV.domeHeal;
        if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + heal); addFloatText(p.x, p.y, "+" + Math.round(heal * 10) / 10, "#9fe6ff", 18); }
      }
    }
    if (!inDome) p._w3DomeT = 0;
  }
}, 96);
// ① 낮은 중력: 맞아서 밀리는 힘 1.3배 (방장 계산)
hookOn("playerHurt", (p, damage, from, hp0) => {
  if (!w3EnvOn() || !p || !(p.hp < hp0) || !w3InLowGrav(p) || !from || !from.x) return;
  const dx = p.x - from.x, dy = p.y - from.y, d = Math.hypot(dx, dy) || 1;
  moveEntity(p, dx / d * 0.3 * (W3_ENV.knockMul - 1) * 3, dy / d * 0.3 * (W3_ENV.knockMul - 1) * 3);
}, 60);
hookOn("dungeonTick", (dt) => {
  if (!w3EnvOn()) return;
  const E = world.w3;
  for (const v of E.domes || []) if (v.charge <= 0) { v.refill -= dt; if (v.refill <= 0) v.charge = W3_ENV.domeCharge; }
  // 몬스터: 먼지 위 0.75배 (지난 화면에서 움직인 만큼의 1/4 을 되돌려요) · 크레이터 끌림
  for (const m of monsters) {
    if (m.hp <= 0 || !m.def || m.boss || m.def.behavior === "prop" || m.def.untargetable) { m._w3p = null; continue; }
    const fly = m.def.floaty || m.def.behavior === "flyer" || m.def.behavior === "wisp";
    if (m._w3p && !fly && w3OnDustAt(m.x, m.y)) {
      const dx = m.x - m._w3p.x, dy = m.y - m._w3p.y;
      if (Math.hypot(dx, dy) < 0.5) moveEntity(m, -dx * (1 - W3_ENV.dustMul), -dy * (1 - W3_ENV.dustMul));
    }
    if (!m.def.heavy) for (const c of E.craters) {
      const dx = c.x - m.x, dy = c.y - m.y, d = Math.hypot(dx, dy);
      if (d < c.r && d > 0.6) moveEntity(m, dx / d * W3_ENV.craterPull * dt, dy / d * W3_ENV.craterPull * dt);
    }
    m._w3p = { x: m.x, y: m.y };
  }
  // ⑥ 별똥별: 박자마다 예고 (가까운 것만)
  if (E.meteors.length) {
    const t1 = game.time, t0 = E.metT !== undefined && E.metT <= t1 ? E.metT : t1 - dt, L = game.mapLevel || 1;
    E.metT = t1;
    for (const g of E.meteors) {
      const lead = ABILITIES.w3_meteor.telegraph.time * abilityTuning().telegraph;
      const ph0 = (t0 + g.offset + lead) % g.period, ph1 = (t1 + g.offset + lead) % g.period;
      if (ph1 >= ph0) continue;
      if (!allPlayers().some((p) => p.hp > 0 && Math.hypot(p.x - g.x, p.y - g.y) < W3_ENV.meteorNear)) continue;
      w3MeteorAt(g.x, g.y, L);
      w3Teach("meteor", "별똥별 그림자! 진해지기 전에 밖으로", "#ffb87a");
    }
  }
}, 62);
// 별똥별 하나 (맵·열쇠·보스가 같이 써요): 가짜 주인(owner)으로 예고를 넣어요. 방장 기기에서만 부르세요
function w3MeteorAt(x, y, L = game.mapLevel || 1, dmg = 1.3) {
  if (typeof casts === "undefined" || typeof makeCast !== "function") return null;
  const owner = { x, y, hp: 1, maxHp: 1, damage: dmg * monsterDamageMul(L) * diff().dmg, faceX: 1, faceY: 0, def: {}, state: "", w2Geyser: true, w3Meteor: true };
  const tune = abilityTuning();
  const c = makeCast(owner, ABILITIES.w3_meteor, "w3_meteor", owner, ABILITIES.w3_meteor.telegraph.time * tune.telegraph, tune);
  casts.push(c);
  return c;
}

// ----- 일식: 던전 시작부터 센 시간 (기기마다 같은 박자) -----
let w3EclT = 0;
hookOn("dungeonStarted", () => { w3EclT = 0; }, 60);
function w3EclipsePhase() { // 0 밝음 / 1 예고 / 2 깜깜
  const E = world.w3, e = E && E.eclipse; if (!e) return 0;
  const t = w3EclT % e.period, light = e.period - e.dark;
  return t < light - e.warn ? 0 : t < light ? 1 : 2;
}
hookOn("timeScale", (dt) => {
  if (!w3EnvOn() || !world.w3.eclipse || game.overlay) return dt;
  const before = w3EclipsePhase();
  w3EclT += dt;
  const ph = w3EclipsePhase(), e = world.w3.eclipse;
  if (ph !== before) {
    if (ph === 1) { showMessage("해가 가려져요! 지구빛 곁으로 가요", 2.6, false, "#ffb070"); if (typeof guideSpeak === "function") guideSpeak("해가 가려져요! 빛 곁으로 가요", "w3eclipse", 1); }
    if (ph === 0) showMessage("다시 밝아졌어요!", 1.6, false, "#ffe27a");
  }
  if (world.theme) world.theme.darkness = ph === 2 ? e.darkDark : ph === 1 ? (e.lightDark + e.darkDark) / 2 : e.lightDark;
  return dt;
}, 72);

// ----- 빛 -----
hookOn("lights", (lights) => {
  if (!w3EnvOn()) return;
  const E = world.w3;
  for (const g of E.lights) if (onScreen(g.x, g.y, 4)) lights.push({ x: g.x, y: g.y, radius: 2.2, power: 0.6 });
  for (const t of E.towers) if (t.on && onScreen(t.x, t.y, 5)) lights.push({ x: t.x, y: t.y, radius: t.r, power: 0.9 });
  for (const v of E.domes || []) if (onScreen(v.x, v.y, 3)) lights.push({ x: v.x, y: v.y, radius: 1.4, power: 0.35 });
}, 55);
// 공정성: 월드 3 에서도 예고 장판 자리에 빛을 더해요 (어둠·일식이 위험을 숨기지 않게, 월드 2 2-3-⑦)
hookOn("lights", (lights) => {
  if (!inWorld3() || typeof casts === "undefined") return;
  const per = {};
  for (const c of casts) {
    if (!c || !c.ab || (c.m && (c.m.pid || c.m === game.player || c.m.ally))) continue;
    per[c.id] = (per[c.id] || 0) + 1; if (per[c.id] > 3) continue;
    const sh = c.ab.telegraph.shape;
    if (sh === "line") for (const t of [0, 0.5, 1]) lights.push({ x: c.x + c.dirX * c.length * t, y: c.y + c.dirY * c.length * t, radius: c.width / 2 + 1.0, power: 0.75 });
    else if (sh === "cone") lights.push({ x: c.x + c.dirX * c.length * 0.5, y: c.y + c.dirY * c.length * 0.5, radius: c.length * 0.6, power: 0.75 });
    else lights.push({ x: c.x, y: c.y, radius: (c.radius || 1.5) + 0.6, power: 0.8 });
  }
}, 60);

// ----- 그리기 -----
function w3FloorCircle(x, y, r, fill, stroke, lw = 2) {
  const pts = []; for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; pts.push(toScreen(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.015)); }
  if (fill) fillPoly(pts, fill);
  if (stroke) { ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = lw * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore(); }
}
function w3DrawPadsFloor(list) {
  for (const s of list) {
    if (!onScreen(s.x, s.y, 4)) continue;
    ctx.save(); ctx.strokeStyle = "rgba(255,226,122,0.55)"; ctx.lineWidth = 3 * ZOOM; ctx.setLineDash([6 * ZOOM, 6 * ZOOM]);
    const a = toScreen(s.x + s.dx * 0.7, s.y + s.dy * 0.7, 0.02), b = toScreen(s.x + s.dx * s.dist, s.y + s.dy * s.dist, 0.02);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
    w3FloorCircle(s.x + s.dx * s.dist, s.y + s.dy * s.dist, 0.45, null, "rgba(255,226,122,0.6)", 2);
  }
}
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon") return;
  const E = world.w3;
  if (E) {
    for (const z of E.lowgrav) {
      if (!onScreen((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2, 8)) continue;
      fillPoly([toScreen(z.x0, z.y0, 0.01), toScreen(z.x1, z.y0, 0.01), toScreen(z.x1, z.y1, 0.01), toScreen(z.x0, z.y1, 0.01)], "rgba(170,210,255,0.12)");
    }
    for (const c of E.craters) if (onScreen(c.x, c.y, c.r + 2)) { w3FloorCircle(c.x, c.y, c.r, "rgba(40,40,60,0.28)", "rgba(230,230,245,0.55)", 3); w3FloorCircle(c.x, c.y, c.r * 0.55, "rgba(20,20,35,0.22)", null); }
    for (const v of E.domes || []) if (onScreen(v.x, v.y, 3)) w3FloorCircle(v.x, v.y, v.r, "rgba(190,240,255,0.18)", v.charge > 0 ? "rgba(255,226,122,0.85)" : "rgba(160,180,190,0.5)", 3);
    for (const g of E.meteors) if (onScreen(g.x, g.y, 3)) w3FloorCircle(g.x, g.y, 0.4, "rgba(60,40,50,0.6)", "rgba(255,160,120,0.5)", 2);
    w3DrawPadsFloor(E.pads);
  }
  for (const d of w3AllDust()) if (onScreen(d.x, d.y, d.r + 2)) w3FloorCircle(d.x, d.y, d.r, "rgba(225,220,205,0.45)", "rgba(200,195,180,0.5)", 2);
  w3DrawPadsFloor(w3ChField("pads"));
}, 52);
function w3DrawPad(s) {
  const t = game.time;
  drawBox(s.x - 0.32, s.y - 0.32, 0, 0.64, 0.64, 0.08, "#c8ccd8");
  drawBox(s.x - 0.22, s.y - 0.22, 0.08, 0.44, 0.44, 0.05 + 0.02 * Math.sin(t * 6 + s.x), "#e8ecf4");
  drawBox(s.x + s.dx * 0.12 - 0.06, s.y + s.dy * 0.12 - 0.06, 0.14, 0.12, 0.12, 0.04, "#ffd23f");
}
hookOn("worldThings", (things) => {
  if (game.scene !== "dungeon") return;
  const E = world.w3;
  for (const s of w3ChField("pads")) if (onScreen(s.x, s.y, 2)) things.push({ depth: s.x + s.y - 0.4, x: s.x, y: s.y, draw: () => w3DrawPad(s) });
  if (!E) return;
  for (const s of E.pads) if (onScreen(s.x, s.y, 2)) things.push({ depth: s.x + s.y - 0.4, x: s.x, y: s.y, draw: () => w3DrawPad(s) });
  for (const g of E.lights) if (onScreen(g.x, g.y, 2)) things.push({ depth: g.x + g.y, x: g.x, y: g.y, draw: () => { drawBox(g.x - 0.1, g.y - 0.1, 0, 0.2, 0.2, g.h || 0.5, g.c); drawBox(g.x - 0.05, g.y - 0.05, (g.h || 0.5), 0.1, 0.1, 0.12, "#ffffff"); } });
  for (const t of E.towers) if (onScreen(t.x, t.y, 3)) things.push({ depth: t.x + t.y, x: t.x, y: t.y, draw: () => {
    drawBox(t.x - 0.25, t.y - 0.25, 0, 0.5, 0.5, 0.25, "#5a5e78"); drawBox(t.x - 0.12, t.y - 0.12, 0.25, 0.24, 0.24, 1.5, "#8a90a8");
    drawBox(t.x - 0.22, t.y - 0.22, 1.75, 0.44, 0.44, 0.4, t.on ? "#7fb8ff" : "#3a3e58");
  } });
}, 52);
hookOn("playersUpdated", () => {
  if (!w3EnvOn()) return;
  const near = (x, y, d = 3) => allPlayers().some((p) => p && p.hp > 0 && Math.hypot(p.x - x, p.y - y) < d);
  if (world.w3.towers.some((t) => near(t.x, t.y, 4))) w3Teach("tower", "지구빛 탑! 빛 안에선 그림자 늑대가 다 보여요", "#7fb8ff");
}, 97);
// 일식 화면 테두리 (예고 중엔 주황, 깜깜할 땐 검정)
hookOn("hudDraw", () => {
  if (!w3EnvOn() || !world.w3.eclipse) return;
  const ph = w3EclipsePhase(); if (!ph) return;
  ctx.save(); ctx.strokeStyle = ph === 1 ? `rgba(255,150,60,${0.5 + 0.3 * Math.sin(game.time * 8)})` : "rgba(0,0,0,0.6)"; ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, view.w - 14, view.h - 14); ctx.restore();
}, 40);

// ===== 새 열쇠 찾기 2종 (keyhunt.js KEY_CHALLENGES 계약) =====
if (typeof KEY_CHALLENGES !== "undefined") Object.assign(KEY_CHALLENGES, {
  // 점프대로 섬 건너기: 섬 3~4개를 점프대가 이어요. 섬 사이는 먼지(걸어도 되지만 느려요). 마지막 섬에 닿으면 끝
  padHop: {
    name: "점프대로 섬 건너기", desc: "점프대를 밟고 붕! 섬을 건너 마지막 섬까지 가요",
    setup(ch) {
      const r = khTakeRoom((q) => Math.max(q.w, q.h) >= 12 && Math.min(q.w, q.h) >= 5);
      if (!r || Math.max(r.w, r.h) < 12) return false;
      const horiz = r.w >= r.h, L = (horiz ? r.w : r.h) - 2, gap = W3_ENV.hopDist, n = Math.min(4, Math.floor(L / gap) + 1);
      if (n < 3) return false;
      const dx = horiz ? 1 : 0, dy = horiz ? 0 : 1;
      const x0 = horiz ? r.x + 1 + (L - (n - 1) * gap) / 2 : r.cx, y0 = horiz ? r.cy : r.y + 1 + (L - (n - 1) * gap) / 2;
      ch.islands = []; ch.pads = []; ch.dust = [];
      for (let i = 0; i < n; i++) {
        const x = x0 + dx * gap * i, y = y0 + dy * gap * i;
        if (hitsWall(x, y, 0.5)) return false;
        ch.islands.push({ x, y, r: 1.3 });
        if (i < n - 1) { ch.pads.push({ x: x + dx * 0.6, y: y + dy * 0.6, dx, dy, dist: gap - 0.6 }); ch.dust.push({ x: x + dx * gap / 2, y: y + dy * gap / 2, r: 1.4 }); }
      }
      ch.reached = 0; ch.room = r;
      return true;
    },
    update(ch, p) {
      const last = ch.islands[ch.islands.length - 1];
      for (let i = 0; i < ch.islands.length; i++) if (khPlayers().some((q) => Math.hypot(q.x - ch.islands[i].x, q.y - ch.islands[i].y) < ch.islands[i].r + 0.2)) ch.reached = Math.max(ch.reached, i + 1);
      if (ch.reached === 1 && !ch.told) { ch.told = true; showMessage("점프대를 밟고 붕! 섬을 건너요", 2.5, false, "#ffe27a"); }
      if (ch.reached >= ch.islands.length) khStepDone(last);
    },
    floor(ch) { ch.islands.forEach((s, i) => khFloorCircle(s.x, s.y, s.r, i < ch.reached ? "rgba(125,255,176,0.22)" : "rgba(255,226,122,0.14)", "rgba(255,210,80,0.9)", 3)); },
    lights(ch) { return ch.islands.map((s) => ({ x: s.x, y: s.y, radius: 2.2, power: 0.6 })); },
    status(ch) { return `섬 건너기 ${ch.reached}/${ch.islands.length}`; },
    target(ch) { return ch.islands[Math.min(ch.reached, ch.islands.length - 1)]; },
  },
  // 떨어지는 별 조각 받기: 금색 원(아프지 않아요) 안에 서 있으면 받아요. 가끔 섞이는 별똥별(빨강 테두리)은 피해요
  starCatch: {
    name: "별 조각 받기", desc: "금색 원 안에 서서 떨어지는 별 조각을 받아요. 빨간 별똥별은 피해요",
    setup(ch) {
      const r = khTakeRoom((q) => q.w >= 7 && q.h >= 7);
      if (!r) return false;
      ch.room = r; ch.c = khSpot(r, 0.5, 0.5, 0.6); ch.stars = []; ch.got = 0; ch.n = 0; ch.wait = 1.5; ch.started = false;
      ch.need = w3Diff() === "easy" ? 3 : 5;
      return true;
    },
    update(ch, p, dt) {
      if (!dt) return;
      const r = ch.room;
      if (!ch.started) { if (khPlayers().some((q) => q.x > r.x && q.x < r.x + r.w && q.y > r.y && q.y < r.y + r.h)) { ch.started = true; showMessage("금색 원 안에 서서 별을 받아요! 빨간 테두리는 피해요", 3, false, "#ffe27a"); } return; }
      for (const s of ch.stars) {
        s.t -= dt;
        if (s.t > 0) continue;
        s.done = true;
        if (khPlayers().some((q) => Math.hypot(q.x - s.x, q.y - s.y) < s.r + (q.r || 0.35) + 0.2)) {
          ch.got++; addFloatText(s.x, s.y, `받았다! ${ch.got}/${ch.need}`, "#ffe27a", 20); addRing(s.x, s.y, { speed: 3, life: 0.4, gold: true });
          if (typeof sfx !== "undefined" && sfx.emerald) sfx.emerald();
        } else addFloatText(s.x, s.y, "놓쳤어요", "#bbb", 14);
      }
      ch.stars = ch.stars.filter((s) => !s.done);
      if (ch.got >= ch.need) { khStepDone(ch.c); return; }
      ch.wait -= dt;
      if (ch.wait > 0 || ch.stars.length) return;
      ch.wait = 0.8 * Math.max(0.7, ktune().time); ch.n++;
      const spot = khSpot(r, 0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6, 0.5);
      if (ch.n % 4 === 0) w3MeteorAt(spot.x, spot.y);
      else ch.stars.push({ x: spot.x, y: spot.y, r: 0.9, t: 1.6 * Math.max(1, ktune().time), T: 1.6 * Math.max(1, ktune().time) });
    },
    floor(ch) {
      const r = ch.room;
      khFloorQuad(r.x + 0.5, r.y + 0.5, r.x + r.w - 0.5, r.y + r.h - 0.5, "rgba(255,226,122,0.05)");
      for (const s of ch.stars) { const k = 1 - s.t / s.T; khFloorCircle(s.x, s.y, s.r, `rgba(255,226,122,${0.15 + 0.35 * k})`, "rgba(255,210,80,0.95)", 3); khFloorCircle(s.x, s.y, s.r * k, "rgba(255,240,170,0.35)", null); }
    },
    lights(ch) { return [{ x: ch.room.cx, y: ch.room.cy, radius: 4, power: 0.6 }, ...ch.stars.map((s) => ({ x: s.x, y: s.y, radius: 1.6, power: 0.8 }))]; },
    status(ch) { return ch.started ? `별 조각 ${ch.got}/${ch.need}` : "별이 떨어지는 방을 찾아요"; },
    target(ch) { return ch.stars[0] || ch.c; },
  },
});
