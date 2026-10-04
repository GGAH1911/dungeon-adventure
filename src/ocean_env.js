// ===== 월드 2 깊은 바다: 맵 환경 2 (설계서 docs/design/world2-ocean.md 2-3 + 새 맵 4개) =====
// 맵의 features 숫자대로 씨앗 난수(rand)로 놓아요 (같이 하기에서 방장·친구가 같은 자리). ocean.js 가 world.w2 를 만든 뒤에 더해요.
//   vents   거품 기둥 (배 무덤): 서 있으면 하트가 차고 느려짐·불이 풀려요. 위에 있으면 "둥실" (땅울림이 안 아파요: w2Floating)
//   glow    빛 산호 (깜깜 해구): 작은 빛
//   geysers 물기둥 분출구 (열수구): 박자마다 빨간 원 예고 -> 물기둥
//   ice     얼음판 (얼음 바다): 미끄러워요 (멈춰도 쭉, 방향 바꾸기 느림)
//   sponges 통통 해면 (노래 산호밭): 밟으면 화살표 쪽으로 붕 날아가요
//   clams   덫 조개 (상어 암초): 몬스터가 밟으면 꽉! (주인공은 안 물어요) -> 몬스터를 데려와요
//   pipes   물 파이프 (잠긴 도시): 같은 색 파이프끼리 이어져 있어요. 들어가면 슝
// 보스방도 쓸 수 있어요: w2AddVent(x, y) / w2Floating(p)

const W2_ENV = {
  ventHeal: 0.25,         // 물약 회복량의 몇 배
  ventStand: 1.0,         // 몇 초 서 있으면 한 번 회복
  ventRefill: 20,
  geyserPeriod: 5.5,
  geyserNear: 12,         // 주인공 몇 칸 안의 분출구만 예고를 만들어요 (성능)
  iceGrip: { easy: 3.2, normal: 1.9, hard: 1.6, nightmare: 1.4 }, // 클수록 덜 미끄러워요 (조작을 따라가는 빠르기)
  hopTime: 0.5, hopDist: 3.5,
  pipeEnter: 0.3,          // 파이프 위에 이만큼 있으면 슝
  clamHold: { easy: 3.6, normal: 3.0, hard: 2.6, nightmare: 2.2 },
  clamReopen: 6,
  pipeHues: ["#ff8f7a", "#7fd0ff", "#ffe27a", "#b08aff", "#7dffb0", "#ff9ad6"],
};

ABILITIES.w2_geyser = { name: "물기둥 분출구", desc: "바닥 분출구에서 뜨거운 물기둥이 솟아요.", counter: "빨간 원이 차기 전에 지나가요",
  tags: ["area", "trap"], telegraph: { shape: "circle", radius: 1.1, at: "self", time: 1.3 }, cooldown: 99, range: [0, 99], damageMul: 1,
  anim: "raise", effect: { type: "knockback", force: 1.2 } };

function w2EnsureEnv(w = world) {
  if (!w.w2) w.w2 = { currents: [], kelp: [] };
  for (const k of ["vents", "glows", "geysers", "ice", "sponges", "clams", "pipes"]) if (!w.w2[k]) w.w2[k] = [];
  return w.w2;
}
// 지금 싸우는 바다 보스: 보스방(열쇠 찾기 뒤) 또는 탑의 보스 층 (보스 파일들이 이걸로 찾아요)
function w2BossNow() {
  const kh = game.keyhunt;
  if (kh && kh.inBoss) return kh.boss || null;
  if (game.mode === "tower" && game.scene === "dungeon" && game.tower && game.tower.boss) return game.tower.boss;
  return null;
}
function w2AddVent(x, y, w = world) { const v = { x, y, r: 0.9, charge: 3, refill: 0 }; w2EnsureEnv(w).vents.push(v); return v; }
function w2Floating(p) { return (p.w2Float || 0) > 0; }

// 방 안의 빈 자리 (계단·벽·시작 방은 피해요)
function w2EnvSpot(rand, rooms, pad = 1.5, rad = 0.6) {
  for (let k = 0; k < 12; k++) {
    const r = rooms[Math.floor(rand() * rooms.length)];
    if (!r || r.w < pad * 2 + 1 || r.h < pad * 2 + 1) continue;
    const x = r.x + pad + rand() * (r.w - pad * 2), y = r.y + pad + rand() * (r.h - pad * 2);
    if (hitsWall(x, y, rad) || (typeof nearStair === "function" && nearStair(x, y, 1.6))) continue;
    if ((typeof chests !== "undefined" && chests.some((c) => Math.hypot(c.x - x, c.y - y) < 1.6)) || world.solids.some((o) => Math.hypot(o.x - x, o.y - y) < 1.4)) continue;
    if (w2NearDoorSpot(x, y, 3)) continue;
    return { x, y, room: r };
  }
  return null;
}
// 보스 문은 나중에 "시작 방에서 가장 먼 방" 가운데 근처에 놓여요 (bossroom.js placeBossDoor): 그 둘레는 비워 둬요
function w2NearDoorSpot(x, y, d) {
  const rs = world.rooms || [];
  if (rs.length < 2) return false;
  let far = rs[rs.length - 1], best = -1;
  for (const r of rs.slice(1)) { const q = Math.hypot(r.cx - rs[0].cx, r.cy - rs[0].cy); if (q > best) { best = q; far = r; } }
  return Math.hypot(x - far.cx, y - far.cy) < d;
}
function w2SameH(x, y, h) { return typeof tileH !== "function" || tileH(Math.floor(x), Math.floor(y)) === h; }
function w2FarFromOthers(list, x, y, d) { return !list.some((o) => Math.hypot((o.x !== undefined ? o.x : (o.x0 + o.x1) / 2) - x, (o.y !== undefined ? o.y : (o.y0 + o.y1) / 2) - y) < d); }

hookOn("monstersSpawned", (def, level, rand) => {
  if (!def || mapWorld(def) !== 2 || !def.features) return;
  const f = def.features, E = w2EnsureEnv();
  const rooms = (world.rooms || []).slice(1);
  if (!rooms.length) return;
  const all = () => [...E.vents, ...E.glows, ...E.geysers, ...E.sponges, ...E.clams, ...E.pipes.flatMap((q) => [q.a, q.b])];
  for (let i = 0; i < (f.vents || 0); i++) { const s = w2EnvSpot(rand, rooms, 1.6, 0.9); if (s && w2FarFromOthers(all(), s.x, s.y, 3)) w2AddVent(s.x, s.y); }
  for (let i = 0; i < (f.glow || 0); i++) {
    const s = w2EnvSpot(rand, rooms, 1.0, 0.4);
    if (s && w2FarFromOthers(E.glows, s.x, s.y, 1.6)) E.glows.push({ x: s.x, y: s.y, c: ["#5ff0d0", "#7fb8ff", "#c88aff", "#7dffb0"][Math.floor(rand() * 4)], h: 0.4 + rand() * 0.4 });
  }
  for (let i = 0; i < (f.geysers || 0); i++) {
    const s = w2EnvSpot(rand, rooms, 1.5, 0.8);
    if (s && w2FarFromOthers(all(), s.x, s.y, 2.6)) E.geysers.push({ x: s.x, y: s.y, period: W2_ENV.geyserPeriod, offset: rand() * W2_ENV.geyserPeriod });
  }
  // 얼음판: 방 안 직사각형 (칸이 다 바닥이고 높이가 같아야)
  for (let i = 0; i < (f.ice || 0); i++) {
    const r = rooms[Math.floor(rand() * rooms.length)];
    const w = Math.min(r.w - 2, 3 + Math.floor(rand() * 4)), h = Math.min(r.h - 2, 3 + Math.floor(rand() * 4));
    if (w < 2 || h < 2) continue;
    const x0 = r.x + 1 + Math.floor(rand() * (r.w - 1 - w)), y0 = r.y + 1 + Math.floor(rand() * (r.h - 1 - h));
    const h0 = typeof tileH === "function" ? tileH(x0, y0) : 0;
    let ok = true;
    for (let y = y0; y < y0 + h && ok; y++) for (let x = x0; x < x0 + w; x++) if (isWall(x, y) || !w2SameH(x + 0.5, y + 0.5, h0) || (typeof isStair === "function" && isStair(x, y))) { ok = false; break; }
    if (ok && !E.ice.some((q) => x0 < q.x1 && q.x0 < x0 + w && y0 < q.y1 && q.y0 < y0 + h)) E.ice.push({ x0, y0, x1: x0 + w, y1: y0 + h });
  }
  // 통통 해면: 화살표 쪽으로 날아갈 길이 다 바닥(같은 높이)인 방향만
  for (let i = 0; i < (f.sponges || 0); i++) {
    const s = w2EnvSpot(rand, rooms, 1.2, 0.5);
    if (!s || !w2FarFromOthers(all(), s.x, s.y, 2.5)) continue;
    const h0 = typeof tileH === "function" ? tileH(Math.floor(s.x), Math.floor(s.y)) : 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const start = Math.floor(rand() * 4);
    for (let k = 0; k < 4; k++) {
      const [dx, dy] = dirs[(start + k) % 4], D = W2_ENV.hopDist;
      let ok = true;
      for (let t = 0.4; t <= D + 0.6 && ok; t += 0.25) { const x = s.x + dx * t, y = s.y + dy * t; if (hitsWall(x, y, 0.4) || !w2SameH(x, y, h0) || (typeof isStair === "function" && isStair(Math.floor(x), Math.floor(y))) || w2NearDoorSpot(x, y, 2.6)) ok = false; }
      if (ok) { E.sponges.push({ x: s.x, y: s.y, dx, dy, dist: D }); break; }
    }
  }
  for (let i = 0; i < (f.clams || 0); i++) { const s = w2EnvSpot(rand, rooms, 1.4, 0.7); if (s && w2FarFromOthers(all(), s.x, s.y, 2.6)) E.clams.push({ x: s.x, y: s.y, shutT: 0 }); }
  // 물 파이프: 서로 먼 방 둘을 이어요
  for (let i = 0; i < (f.pipes || 0); i++) {
    for (let k = 0; k < 10; k++) {
      const a = w2EnvSpot(rand, rooms, 1.6, 0.7), b = w2EnvSpot(rand, rooms, 1.6, 0.7);
      if (!a || !b || a.room === b.room || Math.hypot(a.x - b.x, a.y - b.y) < 14) continue;
      if (!w2FarFromOthers(all(), a.x, a.y, 3) || !w2FarFromOthers(all(), b.x, b.y, 3)) continue;
      E.pipes.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, hue: W2_ENV.pipeHues[E.pipes.length % W2_ENV.pipeHues.length] });
      break;
    }
  }
}, 61);

// 상자·열쇠 찾기 물건·위층 계단은 환경보다 늦게 놓여요: 해면 길·파이프·거품 기둥 위는 비워 둬요 (chest.js, keyhunt.js, upper.js 가 불러요)
function w2EnvKeepClear(x, y, pad = 1.0) {
  const E = world.w2;
  if (!E) return false;
  for (const s of E.sponges || []) {
    const ex = s.x + s.dx * s.dist, ey = s.y + s.dy * s.dist;
    const t = Math.max(0, Math.min(1, ((x - s.x) * (ex - s.x) + (y - s.y) * (ey - s.y)) / (s.dist * s.dist)));
    if (Math.hypot(x - (s.x + (ex - s.x) * t), y - (s.y + (ey - s.y) * t)) < pad) return true;
  }
  for (const q of E.pipes || []) for (const e of [q.a, q.b]) if (Math.hypot(x - e.x, y - e.y) < pad + 0.8) return true;
  for (const v of [...(E.vents || []), ...(E.clams || []), ...(E.geysers || [])]) if (Math.hypot(x - v.x, y - v.y) < pad + 0.3) return true;
  return false;
}

function w2EnvOn() { return game.scene === "dungeon" && game.mapDef && mapWorld(game.mapDef) === 2 && world.w2; }
function w2Diff2() { return (game.profile && game.profile.difficulty) || "normal"; }
function w2OnIce(x, y) { const E = world.w2; if (!E || !E.ice) return false; for (const q of E.ice) if (x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1) return true; return false; }
function w2Teach(key, text, color = "#9fe6ff") {
  const E = world.w2; if (!E) return;
  E.taughtSet = E.taughtSet || {};
  if (E.taughtSet[key]) return;
  E.taughtSet[key] = true;
  showMessage(text, 2.6, false, color);
}

// ===== 주인공에게 일어나는 일 (방장 기기: 친구 주인공도 여기서 밀리고 옮겨져요) =====
hookOn("playersUpdated", (dt) => {
  if (!w2EnvOn()) return;
  dt = dt || 1 / 60;
  const E = world.w2;
  for (const p of allPlayers()) {
    if (p.hp <= 0) continue;
    // ③ 거품 기둥
    let inVent = false;
    for (const v of E.vents || []) {
      if (Math.hypot(p.x - v.x, p.y - v.y) > v.r) continue;
      inVent = true;
      if (v.charge <= 0) continue;
      p._ventT = (p._ventT || 0) + dt;
      if (p._ventT >= W2_ENV.ventStand) {
        p._ventT = 0; v.charge--; if (v.charge <= 0) v.refill = W2_ENV.ventRefill;
        const heal = (typeof POTION !== "undefined" ? POTION.heal : 4) * W2_ENV.ventHeal;
        if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + heal); addFloatText(p.x, p.y, "+" + Math.round(heal * 10) / 10, "#9fe6ff", 18); }
        p.abSlow = 0; p.abBurn = 0;
      }
      w2Teach("vent", "거품 기둥! 서 있으면 하트가 차요", "#bff6ff");
    }
    if (!inVent) p._ventT = 0;
    p.w2Float = inVent ? 0.6 : Math.max(0, (p.w2Float || 0) - dt);
    // 물 파이프
    p._pipeCd = Math.max(0, (p._pipeCd || 0) - dt);
    let inPipe = null, outEnd = null;
    if (p._pipeCd <= 0) for (const q of E.pipes || []) {
      if (Math.hypot(p.x - q.a.x, p.y - q.a.y) < 0.5) { inPipe = q; outEnd = q.b; break; }
      if (Math.hypot(p.x - q.b.x, p.y - q.b.y) < 0.5) { inPipe = q; outEnd = q.a; break; }
    }
    if (inPipe) {
      p._pipeT = (p._pipeT || 0) + dt;
      if (p._pipeT >= W2_ENV.pipeEnter) {
        p._pipeT = 0; p._pipeCd = 1.5;
        const fromX = p.x, fromY = p.y;
        const s = findFreeSpot(outEnd.x + 1.1, outEnd.y + 0.6, p.r || 0.35, 2) || { x: outEnd.x, y: outEnd.y };
        p.x = s.x; p.y = s.y; p._iceIn = null;
        if (p === game.player) { camera.x = p.x; camera.y = p.y; }
        for (const [x, y] of [[fromX, fromY], [p.x, p.y]]) { addRing(x, y, { speed: 3, life: 0.4, hue: 190 }); for (let i = 0; i < 8; i++) addSparkle(x, y, 0.2, { vz: 1.6, gravity: -0.3, life: 0.7, size: 0.5, hue: 190 }); }
        addFloatText(p.x, p.y, "슝!", "#9fe6ff", 22);
        if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
      }
    } else p._pipeT = 0;
    if (w2OnIce(p.x, p.y)) w2Teach("ice", "꽁꽁 얼음! 미끄러워요", "#e6fbff");
  }
}, 96); // 같이 하기: netplay 가 친구 자리를 적어 둔 뒤(95)에 옮겨야 "방장이 옮김(밀림·순간이동)"으로 친구 기기에 가요

// 통통 해면: 밟으면 구르기처럼 화살표 쪽으로 붕 (조작 단계라서 친구 기기도 자기 주인공을 똑같이 날려요)
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || !w2EnvOn() || !world.w2.sponges || !world.w2.sponges.length || p.hp <= 0) return inp;
  const t = game.time;
  if (p.w2Hop && t - p.w2Hop.t0 > p.w2Hop.T) p.w2Hop = null;
  if (p.rollTimer > 0 || (p._spUntil || 0) > t) return inp;
  for (const s of world.w2.sponges) {
    if (Math.hypot(p.x - s.x, p.y - s.y) > 0.45) continue;
    // 나중에 놓인 물건(상자·열쇠 찾기 물건)이 길을 막으면 그 앞까지만 날아요
    let D = 0;
    for (let k = 0.25; k <= s.dist + 1e-6; k += 0.25) { if (hitsWall(s.x + s.dx * k, s.y + s.dy * k, (p.r || 0.35) * 0.9)) break; D = k; }
    if (D < 1) continue;
    const T = W2_ENV.hopTime * D / s.dist, rs = CONFIG.player.rollSpeed;
    p.x = s.x; p.y = s.y;
    p.rollTimer = T; p.rollX = s.dx * D / (rs * T); p.rollY = s.dy * D / (rs * T);
    p.w2Hop = { t0: t, T }; p._spUntil = t + T + 0.5; p._iceIn = null;
    addFloatText(p.x, p.y, "붕!", "#ffd36a", 20); addRing(s.x, s.y, { speed: 3, life: 0.35, hue: 45 });
    if (typeof sfx !== "undefined" && sfx.roll) sfx.roll();
    w2Teach("sponge", "통통 해면! 밟으면 화살표 쪽으로 붕", "#ffd36a");
    break;
  }
  return inp;
}, 84);

// 얼음판: 조이스틱(조작)을 부드럽게 따라가요 -> 손을 떼도 쭉, 방향 바꾸기는 천천히.
// 조작 단계에서 바꾸니 친구 기기(내 주인공은 내 기기가 움직여요)에서도 똑같이 미끄러져요.
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || !w2EnvOn() || !world.w2.ice || !world.w2.ice.length) return inp;
  if (!w2OnIce(p.x, p.y) || p.rollTimer > 0 || p.hp <= 0) { p._iceIn = null; return inp; }
  const st = p._iceIn || (p._iceIn = { sx: inp.sx, sy: inp.sy, t: game.time });
  const dt = Math.min(0.1, game.time - st.t);
  if (dt > 0) { // 한 화면에 여러 번 읽어도 한 번만 따라가요
    st.t = game.time;
    const k = 1 - Math.exp(-(W2_ENV.iceGrip[w2Diff2()] || 2.4) * dt);
    st.sx += (inp.sx - st.sx) * k; st.sy += (inp.sy - st.sy) * k;
  }
  return { ...inp, sx: st.sx, sy: st.sy };
}, 85);

// ===== 몬스터·박자 (방장) =====
hookOn("dungeonTick", (dt) => {
  if (!w2EnvOn()) return;
  const E = world.w2;
  for (const v of E.vents || []) if (v.charge <= 0) { v.refill -= dt; if (v.refill <= 0) v.charge = 3; }
  // 물기둥 분출구: 박자마다 예고 (가까운 것만)
  if ((E.geysers || []).length) {
    const t1 = game.time, t0 = E.geyT !== undefined && E.geyT <= t1 ? E.geyT : t1 - dt, L = game.mapLevel || 1; // 지난번에 본 시간부터 (느린 화면·멈춤에도 박자를 놓치지 않게)
    E.geyT = t1;
    for (const g of E.geysers) {
      const lead = ABILITIES.w2_geyser.telegraph.time * abilityTuning().telegraph;
      const ph0 = (t0 + g.offset + lead) % g.period, ph1 = (t1 + g.offset + lead) % g.period;
      if (ph1 >= ph0) continue; // 이번 화면에 박자가 넘어갔을 때만
      if (!allPlayers().some((p) => p.hp > 0 && Math.hypot(p.x - g.x, p.y - g.y) < W2_ENV.geyserNear)) continue;
      const owner = { x: g.x, y: g.y, hp: 1, maxHp: 1, damage: 1.3 * monsterDamageMul(L) * diff().dmg, faceX: 1, faceY: 0, def: {}, state: "", w2Geyser: true };
      const tune = abilityTuning();
      casts.push(makeCast(owner, ABILITIES.w2_geyser, "w2_geyser", owner, ABILITIES.w2_geyser.telegraph.time * tune.telegraph, tune));
    }
  }
  // 덫 조개: 몬스터가 밟으면 꽉! (보스·소품·숨은 장어는 빼요)
  for (let i = 0; i < (E.clams || []).length; i++) {
    const c = E.clams[i];
    if (c.shutT > 0) { c.shutT -= dt; continue; }
    for (const m of monsters) {
      if (m.hp <= 0 || m.boss || m.w2Hidden || (m.def && (m.def.untargetable || m.def.behavior === "prop")) || m.appearTimer > 0) continue;
      if (Math.hypot(m.x - c.x, m.y - c.y) > 0.6) continue;
      c.shutT = W2_ENV.clamReopen;
      m.x = c.x; m.y = c.y; m.charge = null; m.state = "chase";
      m.stunTimer = W2_ENV.clamHold[w2Diff2()] || 3; m.w2Clam = i + 1;
      addFloatText(m.x, m.y, "꽉!", "#ff9ad6", 24); addRing(c.x, c.y, { speed: 3, life: 0.35, hue: 320 });
      damageMonster(m, m.maxHp * 0.3, c.x, c.y - 1, false, 0, { dot: true });
      if (typeof sfx !== "undefined" && sfx.hit) sfx.hit();
      break;
    }
  }
  for (const m of monsters) if (m.w2Clam && !(m.stunTimer > 0)) m.w2Clam = 0;
  // 물살 띠 위의 얼음 같은 건 없어요. 덫 조개 가르치기
  const p = game.player;
  if (p && (E.clams || []).some((c) => Math.hypot(p.x - c.x, p.y - c.y) < 3)) w2Teach("clam", "덫 조개! 몬스터를 데려오면 꽉 물어요", "#ff9ad6");
  if (p && (E.pipes || []).some((q) => Math.hypot(p.x - q.a.x, p.y - q.a.y) < 3 || Math.hypot(p.x - q.b.x, p.y - q.b.y) < 3)) w2Teach("pipe", "물 파이프! 같은 색 파이프로 슝 이어져요", "#9fe6ff");
}, 62);
// 물기둥은 몬스터가 아니라서 친구 기기·자동 조준·피해 계산에서 빼요
hookOn("untargetable", (o) => !!o.w2Geyser, 50);

// 통통 해면으로 날아가는 모습 (주인공이 붕 떠요)
hookOn("drawPlayerAs", (p) => {
  if (!p.w2Hop) return false;
  const t = Math.min(1, (game.time - p.w2Hop.t0) / p.w2Hop.T);
  if (t >= 1 || !(p.rollTimer > 0)) return false;
  drawRig(p, playerLook(p), playerPose(p), { hop: Math.sin(t * Math.PI) * 1.6 });
  return true;
}, 45);

// ===== 빛 =====
hookOn("lights", (lights) => {
  if (!w2EnvOn()) return;
  const E = world.w2;
  for (const g of E.glows || []) if (onScreen(g.x, g.y, 4)) lights.push({ x: g.x, y: g.y, radius: 2.0, power: 0.55 });
  for (const v of E.vents || []) if (onScreen(v.x, v.y, 3)) lights.push({ x: v.x, y: v.y, radius: 1.4, power: 0.35 });
  for (const q of E.pipes || []) for (const e of [q.a, q.b]) if (onScreen(e.x, e.y, 3)) lights.push({ x: e.x, y: e.y, radius: 1.3, power: 0.45 });
}, 55);

// ===== 그리기 =====
function w2FloorRect(x0, y0, x1, y1, color) { fillPoly([toScreen(x0, y0, 0.012), toScreen(x1, y0, 0.012), toScreen(x1, y1, 0.012), toScreen(x0, y1, 0.012)], color); }
function w2FloorCircle(x, y, r, fill, stroke, lw = 2) {
  const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push(toScreen(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.015)); }
  if (fill) fillPoly(pts, fill);
  if (stroke) { ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = lw * ZOOM; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore(); }
}
hookOn("drawFloor", () => {
  if (!w2EnvOn()) return;
  const E = world.w2;
  for (const q of E.ice || []) {
    if (!onScreen((q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2, 6)) continue;
    w2FloorRect(q.x0, q.y0, q.x1, q.y1, "rgba(225,248,255,0.8)");
    ctx.save(); ctx.strokeStyle = "rgba(120,200,255,0.9)"; ctx.lineWidth = 3 * ZOOM; const cs = [toScreen(q.x0, q.y0, 0.02), toScreen(q.x1, q.y0, 0.02), toScreen(q.x1, q.y1, 0.02), toScreen(q.x0, q.y1, 0.02)];
    ctx.beginPath(); cs.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2 * ZOOM;
    for (let k = 0; k < 3; k++) { const fx = q.x0 + (q.x1 - q.x0) * (0.25 + k * 0.25); const a = toScreen(fx - 0.5, q.y0 + 0.6, 0.02), b = toScreen(fx + 0.2, q.y0 + 1.3, 0.02); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.restore();
  }
  for (const v of E.vents || []) if (onScreen(v.x, v.y, 3)) w2FloorCircle(v.x, v.y, v.r, "rgba(190,240,255,0.18)", v.charge > 0 ? "rgba(255,226,122,0.85)" : "rgba(160,180,190,0.5)", 3);
  for (const s of E.sponges || []) {
    if (!onScreen(s.x, s.y, 3)) continue;
    // 갈 곳 표시: 점선 화살표
    ctx.save(); ctx.strokeStyle = "rgba(255,211,106,0.55)"; ctx.lineWidth = 3 * ZOOM; ctx.setLineDash([6 * ZOOM, 6 * ZOOM]);
    const a = toScreen(s.x + s.dx * 0.7, s.y + s.dy * 0.7, 0.02), b = toScreen(s.x + s.dx * s.dist, s.y + s.dy * s.dist, 0.02);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
    w2FloorCircle(s.x + s.dx * s.dist, s.y + s.dy * s.dist, 0.45, null, "rgba(255,211,106,0.6)", 2);
  }
  for (const g of E.geysers || []) if (onScreen(g.x, g.y, 3)) { w2FloorCircle(g.x, g.y, 0.45, "rgba(40,20,20,0.7)", "rgba(255,138,74,0.6)", 2); }
}, 52);

hookOn("worldThings", (things) => {
  if (!w2EnvOn()) return;
  const E = world.w2;
  for (const v of E.vents || []) {
    if (!onScreen(v.x, v.y, 3)) continue;
    things.push({ depth: v.x + v.y, x: v.x, y: v.y, draw: () => {
      const n = v.charge > 0 ? 3 + v.charge * 2 : 1;
      for (let i = 0; i < n; i++) {
        const t = (game.time * 0.8 + i / n) % 1, a = i * 2.4 + game.time;
        const s = 0.1 + 0.05 * Math.sin(i), z = t * 2.2;
        drawBox(v.x + Math.cos(a) * 0.3 - s / 2, v.y + Math.sin(a) * 0.3 - s / 2, z, s, s, s, v.charge > 0 ? "#e6fbff" : "#9ab0b8");
      }
      drawBox(v.x - 0.25, v.y - 0.25, 0, 0.5, 0.5, 0.08, "#5a4a3a");
    } });
  }
  for (const g of E.glows || []) {
    if (!onScreen(g.x, g.y, 3)) continue;
    things.push({ depth: g.x + g.y, x: g.x, y: g.y, draw: () => {
      const pulse = 0.05 * Math.sin(game.time * 2 + g.x);
      drawBox(g.x - 0.08, g.y - 0.08, 0, 0.16, 0.16, g.h, g.c);
      drawBox(g.x + 0.05, g.y - 0.12, 0, 0.12, 0.12, g.h * 0.7, g.c);
      drawBox(g.x - 0.12, g.y - 0.12, g.h - 0.02, 0.24 + pulse, 0.24 + pulse, 0.12, "#ffffff");
    } });
  }
  for (const s of E.sponges || []) {
    if (!onScreen(s.x, s.y, 3)) continue;
    things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
      const sq = 0.04 * Math.sin(game.time * 5 + s.x);
      drawBox(s.x - 0.4, s.y - 0.4, 0, 0.8, 0.8, 0.22 + sq, "#ffd36a");
      for (const [ox, oy] of [[-0.2, -0.2], [0.15, -0.1], [-0.1, 0.2], [0.2, 0.18]]) drawBox(s.x + ox - 0.05, s.y + oy - 0.05, 0.22 + sq, 0.1, 0.1, 0.02, "#c89a3a");
      // 화살표
      const tip = { x: s.x + s.dx * 0.5, y: s.y + s.dy * 0.5 };
      drawBox(tip.x - 0.09, tip.y - 0.09, 0.26, 0.18, 0.18, 0.05, "#ff8f3a");
    } });
  }
  for (let i = 0; i < (E.clams || []).length; i++) {
    const c = E.clams[i];
    if (!onScreen(c.x, c.y, 3)) continue;
    const shut = c.shutT > 0 || monsters.some((m) => m.w2Clam === i + 1 && m.stunTimer > 0);
    things.push({ depth: c.x + c.y - 0.3, x: c.x, y: c.y, draw: () => { w2DrawClam(c.x, c.y, shut, 1); } });
  }
  for (const q of E.pipes || []) for (const e of [q.a, q.b]) {
    if (!onScreen(e.x, e.y, 3)) continue;
    things.push({ depth: e.x + e.y - 0.2, x: e.x, y: e.y, draw: () => {
      drawBox(e.x - 0.55, e.y - 0.55, 0, 1.1, 1.1, 0.3, "#7a8a8a");
      drawBox(e.x - 0.42, e.y - 0.42, 0.3, 0.84, 0.84, 0.02, "#0a1418");
      drawBox(e.x - 0.55, e.y - 0.55, 0.3, 1.1, 0.13, 0.1, q.hue); drawBox(e.x - 0.55, e.y + 0.42, 0.3, 1.1, 0.13, 0.1, q.hue);
      drawBox(e.x - 0.55, e.y - 0.42, 0.3, 0.13, 0.84, 0.1, q.hue); drawBox(e.x + 0.42, e.y - 0.42, 0.3, 0.13, 0.84, 0.1, q.hue);
      const t = (game.time * 1.2) % 1; drawBox(e.x - 0.06 + Math.sin(game.time * 3) * 0.15, e.y - 0.06, 0.3 + t * 1.2, 0.12, 0.12, 0.12, "#e6fbff");
    } });
  }
}, 52);

// 덫 조개 그림: 둥근 껍데기(블록 십자 모양) + 골 무늬. 열리면 분홍 속살과 진주, 뒤 껍데기가 서 있어요
function w2DrawClam(x, y, shut, k = 1) {
  const sh = "#9a86c0", rib = "#7a68a0", lip = "#c8b8e8";
  const shell = (z, h, c) => { drawBox(x - 0.62 * k, y - 0.38 * k, z, 1.24 * k, 0.76 * k, h, c); drawBox(x - 0.42 * k, y - 0.55 * k, z, 0.84 * k, 1.1 * k, h, c); };
  shell(0, 0.16, sh);
  if (shut) {
    const wob = Math.sin(game.time * 20) * 0.02;
    shell(0.16, 0.2 + wob, sh);
    for (const o of [-0.3, 0, 0.3]) drawBox(x + o * k - 0.05, y - 0.5 * k, 0.36 + wob, 0.1, 1.0 * k, 0.04, rib);
    drawBox(x - 0.6 * k, y - 0.06, 0.16, 1.2 * k, 0.12, 0.06, lip);
    return;
  }
  drawBox(x - 0.5 * k, y - 0.3 * k, 0.16, 1.0 * k, 0.6 * k, 0.03, "#ffb0c8");
  drawBox(x - 0.32 * k, y - 0.42 * k, 0.16, 0.64 * k, 0.84 * k, 0.03, "#ffb0c8");
  drawBox(x - 0.1, y - 0.1, 0.19, 0.2, 0.2, 0.18, "#fffaf0");
  // 뒤 껍데기 (서 있어요): 계단처럼 쌓아 둥글게
  for (let i = 0; i < 4; i++) { const w = [0.8, 1.1, 1.2, 1.0][i] * k; drawBox(x - w / 2, y - 0.6 * k, 0.16 + i * 0.2, w, 0.14, 0.2, i % 2 ? sh : rib); }
}

// ===== 바다 맵 그림 (모험 지도 장소, 새 맵들) =====
hookOn("drawPlaceIcon", (m, x, y, s, locked) => {
  if (mapWorld(m) !== 2 || m.id === "shallows" || m.id === "kelp") return false;
  const g = ctx, C = (c) => greyish(c, locked);
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(10,20,30,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(10,20,30,0.6)"; g.lineWidth = 1.2; g.stroke(); };
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  switch (m.id) {
    case "wreck": rect(-24, -12, 40, 12, C("#7a5a3a")); rect(-6, -40, 4, 30, C("#5a4030")); rect(-16, -36, 18, 14, C("#e8e0c8")); circ(14, -18, 4, C("#e6fbff")); break;
    case "icefloe": rect(-22, -8, 44, 10, C("#e6f4fa")); rect(-14, -26, 14, 18, C("#cfe6f2")); rect(2, -20, 12, 12, C("#ffffff")); rect(6, -32, 6, 8, C("#2a2f3a")); rect(7, -27, 4, 4, C("#f4f8fb")); break;
    case "songreef": rect(-20, -6, 40, 8, C("#d8bcd0")); rect(-14, -22, 10, 16, C("#ffd36a")); rect(2, -30, 8, 24, C("#c88aff")); circ(14, -12, 6, C("#ff9ad6")); break;
    case "trench": rect(-24, -10, 48, 12, C("#1e2640")); rect(-4, -14, 8, 6, C("#02040c")); circ(-12, -20, 4, C("#5ff0d0")); circ(12, -16, 3, C("#7fb8ff")); circ(2, -26, 3, C("#ffe27a")); break;
    case "sharkreef": rect(-22, -6, 44, 8, C("#b8a888")); rect(-8, -22, 16, 14, C("#7f95a8")); rect(-2, -32, 6, 10, C("#7f95a8")); rect(10, -16, 10, 6, C("#8a7aa8")); break;
    case "vents": rect(-20, -8, 40, 10, C("#4a4048")); rect(-12, -22, 8, 14, C("#3a3036")); rect(4, -18, 8, 10, C("#3a3036")); rect(-10, -38, 4, 16, C("#bff6ff")); rect(6, -30, 4, 12, C("#ff8a4a")); break;
    case "sunken": rect(-22, -8, 44, 10, C("#9a9a8a")); rect(-18, -32, 6, 24, C("#c8c8b8")); rect(12, -32, 6, 24, C("#c8c8b8")); rect(-20, -36, 40, 6, C("#b8b8a8")); circ(0, -14, 5, C("#7fd0ff")); break;
    case "abyss": rect(-20, -10, 40, 10, C("#3a4a6a")); rect(-14, -34, 28, 24, C("#2a3550")); rect(-16, -40, 32, 6, C("#e0c060")); circ(0, -22, 5, C("#fffaf0")); break;
    default: circ(0, -14, 14, C("#3a6a9a"));
  }
  return true;
}, 45);

// ===== 안내 문구 =====
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w2_geyser: { text: "빨간 원이 차기 전에 지나가요" },
  w2_eelLunge: { text: "거품 구멍! 줄 옆으로" },
  w2_inkSquirt: { text: "검은 원 밖으로!" },
  w2_starSpin: { text: "웅크리면 한 걸음 뒤로" },
});
