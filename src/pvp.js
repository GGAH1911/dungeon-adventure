// ===== 결투장 (PvP): 1:1 결투 · 각자 싸움 · 팀전 =====
// 캠프의 "결투장" 깃발에서 방장(혼자 둘이 하기면 그 기기)이 시작해요. 2명 이상일 때만.
// 공정하게: 결투장에서는 레벨·장비와 상관없이 모두 하트 20개, 한 번 때리면 기술 세기대로 하트가 줄어요(무기 힘으로 나눠서 맞춰요).
// 아이 친화: 하트가 다 닳으면 "넉다운" → 바로 자기 출발 자리에서 하트 가득 + 2초 보호막. 때린 사람(팀)이 1점.
//   먼저 목표 점수(1:1 5점 · 각자 6점 · 팀 8점)에 닿거나 3분이 지나면 끝 → 5초 뒤 다 같이 캠프로.
// 어떻게 맞나: 주인공마다 보이지 않는 "과녁"(소품 몬스터 pvp_av)이 붙어 다녀요. 칼·화살·기술이 몬스터를 때리는 길을 그대로 쓰고,
//   과녁이 맞으면 그 주인 주인공의 하트를 깎아요(monsterDamage 훅). 나·우리 팀 과녁은 노리지도(자동 조준) 맞지도 않아요.
// 같이 하기: 방장이 모두 계산해요. 점수·팀·남은 시간은 소품 몬스터 pvp_board 의 글자칸으로 친구에게 가요.
//   친구 기기는 장면 소식(맵 pvparena)을 받으면 같은 결투장을 만들어요(netGuestScene 훅).

const PVP = { hp: 20, k: 1.8, shield: 2.0, hurtT: 0.45, goal: { duel: 5, ffa: 6, team: 8 }, time: 180, endWait: 5, N: 24 };
const PVP_MODES = { duel: "1:1 결투", ffa: "각자 싸움", team: "팀전" };
const PVP_MAP = { id: "pvparena", name: "결투장", type: "pvp", minLevel: 1,
  theme: { floor: "#6a6458", moss: "#c9a24a", wall: "#4a4038", darkness: 0, bg: "#1a1410" } };
const PVP_TEAM_COLORS = ["#4aa3ff", "#ff6a5a"], PVP_TEAM_NAMES = ["파랑 팀", "빨강 팀"];
const PVP_COLORS = ["#ffd23f", "#7dffb0", "#c08aff", "#ff9ad6"];
const pvp = { cur: null, matchN: 0, teamShift: 0, saved: new Map() };

function inPvp() { return game.scene === "dungeon" && game.mode === "pvp"; }
function pvpGuest() { return typeof netGuest === "function" && netGuest(); }
function pvpPid(p) { return (p && p.pid) || 1; }

// ----- 결투장 소품: 과녁(주인공마다) + 점수판 -----
MONSTERS.pvp_av = { name: "결투 과녁", color: "#ffffff", shape: "pvp_av", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, codexSkip: true };
MONSTERS.pvp_board = { name: "점수판", color: "#ffffff", shape: "pvp_av", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, untargetable: true, codexSkip: true };
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push("pvp_av", "pvp_board");
if (typeof CODEX_SKIP !== "undefined") { CODEX_SKIP.add("pvp_av"); CODEX_SKIP.add("pvp_board"); }
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.pvp_av = () => {}; // 안 보여요 (주인공 발밑 고리는 drawFloor 에서)
function pvpBoard() { return monsters.find((m) => m.type === "pvp_board" && m.hp > 0) || null; }
function pvpAvatars() { return monsters.filter((m) => m.type === "pvp_av" && m.hp > 0); }
function pvpAvatarOf(pid) { return monsters.find((m) => m.type === "pvp_av" && m.pvPid === pid) || null; }
// 점수판 글자칸 읽기: "pid:값,pid:값"
function pvpParse(s) { const out = new Map(); for (const t of String(s || "").split(",")) { const [a, b] = t.split(":"); if (a) out.set(+a, +b); } return out; }
function pvpPack(map) { return [...map].map(([a, b]) => `${a}:${b}`).join(","); }
function pvpTeamOf(pid, B = pvpBoard()) { if (!B || B.pvMode !== "team") return null; const t = pvpParse(B.pvTm).get(pid); return t === undefined ? null : t; }
// 같은 편인가 (나 자신 포함)
function pvpAlly(a, b, B = pvpBoard()) { if (a === b) return true; const ta = pvpTeamOf(a, B), tb = pvpTeamOf(b, B); return ta !== null && ta === tb; }

// ----- 결투장 만들기 (방장·친구 같은 모양) -----
function pvpBuildArena() {
  const N = PVP.N, c = N / 2;
  resetWorld(N, N, -1, PVP_MAP.theme);
  for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) if (Math.abs(x + 0.5 - c) + Math.abs(y + 0.5 - c) < 14) world.tiles[y][x] = 0;
  for (const [x, y] of [[8, 8], [15, 8], [8, 15], [15, 15]]) world.tiles[y][x] = 2; // 숨을 기둥 4개
  world.tiles[11][11] = 1; world.tiles[12][12] = 1; // 가운데 낮은 벽
  finishWalls(makeRandom(4242));
  world.rooms = [{ x: 3, y: 3, w: N - 6, h: N - 6, cx: c, cy: c }];
  world.start = { x: c, y: c + 6 };
  world.explored = null; world.mini = null;
  stairs = null; chests = [];
}
// 출발 자리: 네 귀퉁이 (팀전은 같은 편끼리 같은 쪽)
function pvpSpawn(i) {
  const c = PVP.N / 2, d = 6.2, spots = [[c + d, c], [c - d, c], [c, c + d], [c, c - d]];
  const s = spots[i % 4];
  return findFreeSpot(s[0], s[1], 0.4, 3) || { x: s[0], y: s[1] };
}
function pvpSpawnFor(pid, B = pvpBoard()) {
  const order = pvpParse(B && B.pvOrd);
  const i = order.has(pid) ? order.get(pid) : 0;
  if (B && B.pvMode === "team") { const t = pvpTeamOf(pid, B) || 0; return pvpSpawn(t === 0 ? (i % 2 ? 2 : 0) : (i % 2 ? 3 : 1)); }
  return pvpSpawn(i);
}

// ----- 시작 (방장·혼자) -----
function pvpCanStart(mode) {
  const n = allPlayers().length;
  if (pvpGuest()) return "방장이 결투를 시작할 수 있어요";
  if (n < 2) return "결투는 두 명 이상일 때 해요 (같이 하기나 둘이 하기)";
  if (mode === "duel" && n !== 2) return "1:1 결투는 딱 두 명일 때 해요";
  return null;
}
function pvpStart(mode) {
  const why = pvpCanStart(mode);
  if (why) { showMessage(why, 2.4); if (typeof sfx !== "undefined" && sfx.denied) sfx.denied(); return false; }
  if (typeof hookAny === "function" && hookAny("sceneGate", "pvp")) return false;
  const pids = allPlayers().map(pvpPid).sort((a, b) => a - b);
  pvp.matchN++;
  pvpEnterLocal();
  netplayRunSeed(9000 + pvp.matchN);
  // 점수판
  const B = createMonster("pvp_board", 1.5, 1.5, 1);
  B.appearTimer = 0; B.aggro = false; B.immovable = true; B.r = 0.01;
  const sc = new Map(), tm = new Map(), ord = new Map();
  const split = pvpTeamSplit(pids);
  pids.forEach((pid, i) => { ord.set(pid, i); sc.set(pid, 0); tm.set(pid, split.get(pid)); });
  Object.assign(B, { pvMode: mode, pvOrd: pvpPack(ord), pvTm: pvpPack(tm), pvSc: mode === "team" ? "0:0,1:0" : pvpPack(sc), pvGoal: PVP.goal[mode], pvLeft: PVP.time, pvEnd: 0, pvWin: "", pvEndT: 0 });
  monsters.push(B);
  // 과녁 + 하트 20 + 출발 자리
  pvp.saved.clear();
  for (const p of allPlayers()) {
    const pid = pvpPid(p);
    pvp.saved.set(pid, p.maxHp);
    p.maxHp = PVP.hp; p.hp = PVP.hp; p.hurtTimer = 0; p._pvpM = pvp.matchN; p._hpApplied = PVP.hp;
    const s = pvpSpawnFor(pid, B); p.x = s.x; p.y = s.y;
    const a = createMonster("pvp_av", p.x, p.y, 1);
    a.appearTimer = 0; a.aggro = false; a.immovable = true; a.r = p.r || 0.3; a.pvPid = pid; a.pvSh = PVP.shield;
    monsters.push(a);
  }
  camera.x = game.player.x; camera.y = game.player.y;
  if (typeof hookRun === "function") hookRun("playersTeleported");
  showMessage(`${PVP_MODES[mode]} 시작! 먼저 ${PVP.goal[mode]}점`, 3, true);
  if (typeof sfx !== "undefined" && sfx.wave) sfx.wave();
  return true;
}
function netplayRunSeed(v) { if (typeof netplay !== "undefined") netplay.runSeed = v; }
// 방장·친구 둘 다: 결투장 장면으로
function pvpEnterLocal() {
  resetEffects();
  game.scene = "dungeon"; game.mode = "pvp"; game.overlay = null; game.result = null;
  game.mapDef = PVP_MAP; game.mapLevel = game.profile.level || 1;
  game.keyhunt = null; game.tower = null; game.upper = false;
  pvpBuildArena();
  placePlayer();
  game.run = { kills: 0, emeralds: 0, xp: 0, levels: 0 };
}
// 친구 기기: 방장이 결투장으로 가면 같은 결투장을 만들어요
hookOn("netGuestScene", (msg) => {
  if (!msg || msg.map !== PVP_MAP.id) return false;
  if (!(game.scene === "dungeon" && game.mode === "pvp" && netplay.lastScene && netplay.lastScene.seed === msg.seed)) pvpEnterLocal();
  return true;
}, 50);

// ----- 매 화면 (방장·혼자): 과녁 따라가기 · 하트 20 지키기 · 보호막 · 시간 · 끝 -----
hookOn("playersUpdated", (dt) => {
  if (!inPvp() || pvpGuest()) return;
  const B = pvpBoard(); if (!B) return;
  const players = allPlayers();
  for (const p of players) {
    const pid = pvpPid(p);
    if (p.maxHp !== PVP.hp) { p.maxHp = PVP.hp; if (p.hp > PVP.hp) p.hp = PVP.hp; }
    p._hpApplied = PVP.hp;
    if (p._pvpM !== pvp.matchN) { p._pvpM = pvp.matchN; p.hp = PVP.hp; } // 이번 경기에 처음 보는 주인공(친구 정보가 늦게 와서 새로 세운 경우 등): 하트 가득
    if (p.hp <= 0) p.hp = PVP.hp; // 혹시 다른 길로 쓰러지면 바로 일으켜요
    let a = pvpAvatarOf(pid);
    if (!a) { // 도중에 들어온 친구
      a = createMonster("pvp_av", p.x, p.y, 1); a.appearTimer = 0; a.aggro = false; a.immovable = true; a.r = p.r || 0.3; a.pvPid = pid; a.pvSh = PVP.shield; monsters.push(a);
      const ord = pvpParse(B.pvOrd); if (!ord.has(pid)) { ord.set(pid, ord.size); B.pvOrd = pvpPack(ord); }
      const tm = pvpParse(B.pvTm); if (!tm.has(pid)) { const n0 = [...tm.values()].filter((t) => t === 0).length; tm.set(pid, n0 <= tm.size - n0 ? 0 : 1); B.pvTm = pvpPack(tm); }
      if (B.pvMode !== "team") { const sc = pvpParse(B.pvSc); if (!sc.has(pid)) { sc.set(pid, 0); B.pvSc = pvpPack(sc); } }
    }
    a.x = p.x; a.y = p.y; a.hp = a.maxHp;
    if (a.pvSh > 0) a.pvSh = Math.max(0, a.pvSh - dt);
  }
  for (const a of pvpAvatars()) if (!players.some((p) => pvpPid(p) === a.pvPid)) a.hp = 0; // 나간 친구
}, 40);
// 경기 시계는 실제 시간으로 (맞는 순간 잠깐 멈춤 같은 것과 상관없이): 방장·혼자
hookOn("timeScale", (dt) => {
  if (!inPvp() || pvpGuest() || !(dt > 0)) return dt;
  const B = pvpBoard(); if (!B) return dt;
  if (B.pvEnd) { B.pvEndT += dt; if (B.pvEndT >= PVP.endWait) pvpFinish(); return dt; }
  B.pvLeft = Math.max(0, B.pvLeft - dt);
  if (B.pvLeft <= 0) pvpEnd(B, "시간 끝!");
  else if (allPlayers().length < 2) pvpEnd(B, "친구가 나갔어요");
  return dt;
}, 30);

// 넉다운·점수
function pvpScore(B, attackerPid) {
  const sc = pvpParse(B.pvSc);
  const key = B.pvMode === "team" ? pvpTeamOf(attackerPid, B) : attackerPid;
  if (key === null || key === undefined) return;
  sc.set(key, (sc.get(key) || 0) + 1);
  B.pvSc = pvpPack(sc);
  if (sc.get(key) >= B.pvGoal) pvpEnd(B, "");
}
function pvpLabel(pid) {
  const q = allPlayers().find((x) => pvpPid(x) === pid);
  const nm = q && (q === game.player && game.profile ? game.profile.name : typeof netCleanName === "function" ? netCleanName(q.netName) : q.netName);
  return nm || (pid === 1 ? "방장" : `${pid}번`);
}
function pvpEnd(B, why) {
  if (B.pvEnd) return;
  const sc = pvpParse(B.pvSc);
  let best = -1, win = [];
  for (const [k, v] of sc) { if (v > best) { best = v; win = [k]; } else if (v === best) win.push(k); }
  const name = (k) => (B.pvMode === "team" ? PVP_TEAM_NAMES[k] : pvpLabel(k));
  B.pvWin = win.length === 1 ? `${name(win[0])} 승리!` : `비겼어요! (${win.map(name).join(" · ")})`;
  B.pvEnd = 1; B.pvEndT = 0;
  showMessage(`${why ? why + " " : ""}${B.pvWin}`, PVP.endWait, true);
  if (typeof sfx !== "undefined" && sfx.clear) sfx.clear();
}
function pvpFinish() {
  for (const p of allPlayers()) { const m = pvp.saved.get(pvpPid(p)); if (m) { p.maxHp = m; p.hp = m; } }
  pvp.saved.clear();
  enterLobby("결투 끝! 캠프로 돌아왔어요");
}

// ----- 맞기: 과녁이 맞으면 그 주인 주인공의 하트 (방장·혼자 기기) -----
function pvpAttackerOf(h) { return (h.opts && h.opts.by) || pvp.cur || game.player; }
hookOn("monsterDamage", (h) => {
  const a = h.m;
  if (!a || a.type !== "pvp_av") return false;
  if (!inPvp() || pvpGuest()) return true;
  const B = pvpBoard(); if (!B || B.pvEnd) return true;
  if (h.opts && h.opts.dot) return true; // 불·독 같은 계속 피해는 결투에선 없어요
  const att = pvpAttackerOf(h), ap = pvpPid(att), owner = allPlayers().find((p) => pvpPid(p) === a.pvPid);
  if (!owner || pvpAlly(ap, a.pvPid, B)) return true;
  const ref = Math.max(0.01, typeof weaponPower === "function" ? weaponPower(att) : 1);
  const hearts = Math.min(PVP.hp * 0.45, (h.dmg / ref) * PVP.k);
  pvpHurt(owner, a, hearts, att, h.fromX, h.fromY, h.opts || {});
  return true;
}, 1);
function pvpHurt(p, a, hearts, att, fx, fy, opts) {
  if (a.pvSh > 0) { if (Math.random() < 0.3) addFloatText(p.x, p.y, "보호막!", "#9fe6ff", 15); return; }
  if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 16); return; }
  if (p.hurtTimer > 0) return;
  p.hp -= hearts; p.hurtTimer = PVP.hurtT; p.flash = 0.1; p.hurtLean = 0.2;
  addFloatText(p.x, p.y, `-${Math.round(hearts * 10) / 10}`, "#ff6b6b", 18);
  if (typeof sfx !== "undefined" && sfx.hurt) sfx.hurt();
  if (opts.effect === "slow") p.abSlow = Math.max(p.abSlow || 0, 1.0);
  const ox = Number.isFinite(fx) ? fx : att.x, oy = Number.isFinite(fy) ? fy : att.y, dx = p.x - ox, dy = p.y - oy, d = Math.hypot(dx, dy) || 1;
  moveEntity(p, (dx / d) * 0.35, (dy / d) * 0.35);
  if (p.hp > 0.05) return;
  // 넉다운: 출발 자리에서 하트 가득 + 보호막, 때린 쪽 1점
  const B = pvpBoard();
  addFloatText(p.x, p.y, "넉다운!", "#ffd23f", 24);
  spawnBurst(p.x, p.y, ["#ffd23f", "#ffffff"], 14);
  showMessage(`${pvpLabel(pvpPid(att))} → ${pvpLabel(pvpPid(p))} 넉다운!`, 1.8, false, "#ffe27a");
  p.hp = PVP.hp; p.hurtTimer = 0;
  const s = pvpSpawnFor(pvpPid(p), B); p.x = s.x; p.y = s.y;
  a.x = s.x; a.y = s.y; a.pvSh = PVP.shield;
  if (B) pvpScore(B, pvpPid(att));
}

// ----- 노리기: 나·우리 팀 과녁은 자동 조준·맞기에서 빼요 -----
hookOn("playerInput", (inp, p) => {
  if (!p) return inp;
  pvp.cur = p;
  if (inPvp()) p._hpApplied = p.maxHp; // 직업 하트 배수(classes.js)가 결투장 하트 20을 다시 줄이지 않게 (모두 똑같이 20)
  return inp;
}, 1);
hookOn("playersUpdated", () => { pvp.cur = null; }, 1);
hookOn("untargetable", (o) => {
  if (!o || o.type !== "pvp_av") return false;
  const me = pvp.cur || game.player;
  return pvpAlly(pvpPid(me), o.pvPid);
}, 50);
// 화살: 쏜 사람 과녁은 지나가요 (bow.js 에서 불러요)
function pvpSkipShot(m, s) { return !!(m && m.type === "pvp_av" && s && s.owner && pvpAlly(pvpPid(s.owner), m.pvPid)); }

// ----- 결투장에선 쉬지 않아요: 자동 회복·배고픔 없음 -----
hookOn("playersUpdated", () => { if (inPvp()) for (const p of allPlayers()) p.stillT = 0; }, 69);

// ----- 그리기: 발밑 색 고리(팀·사람), 보호막 -----
function pvpColorOf(pid, B = pvpBoard()) {
  if (!B) return "#ffffff";
  if (B.pvMode === "team") { const t = pvpTeamOf(pid, B); return PVP_TEAM_COLORS[t || 0]; }
  const ord = pvpParse(B.pvOrd); return PVP_COLORS[(ord.get(pid) || 0) % PVP_COLORS.length];
}
hookOn("drawFloor", () => {
  if (!inPvp()) return;
  const B = pvpBoard(); if (!B) return;
  for (const p of allPlayers()) {
    const pid = pvpPid(p), col = pvpColorOf(pid, B), pts = [];
    for (let i = 0; i <= 16; i++) { const t = (i / 16) * Math.PI * 2; pts.push(toScreen(p.x + Math.cos(t) * 0.5, p.y + Math.sin(t) * 0.5, 0.02)); }
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3 * ZOOM; ctx.globalAlpha = 0.9;
    ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
    const a = pvpAvatarOf(pid);
    if (a && a.pvSh > 0) { ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(game.time * 10); ctx.fillStyle = "#9fe6ff"; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fill(); ctx.restore(); }
    if (!(typeof coopOn === "function" && coopOn())) { const s = toScreen(p.x, p.y, 1.7); text(pvpLabel(pid), s.x, s.y, Math.round(7 * ZOOM), col, "center"); } // 둘이 하기는 1번·2번 글자가 이미 있어요
  }
}, 40);
// 점수판 (화면 위 가운데)
hookOn("hudDraw", () => {
  if (!inPvp()) return;
  const B = pvpBoard(); if (!B) return;
  const W = view.w, sc = pvpParse(B.pvSc), m = Math.floor(B.pvLeft / 60), s = Math.floor(B.pvLeft % 60);
  const items = B.pvMode === "team" ? [0, 1].map((t) => ({ label: PVP_TEAM_NAMES[t], n: sc.get(t) || 0, col: PVP_TEAM_COLORS[t] }))
    : [...sc].map(([pid, n]) => ({ label: pvpLabel(pid), n, col: pvpColorOf(pid, B) }));
  const w = Math.min(W - 40, 140 + items.length * 120), x0 = (W - w) / 2;
  const y0 = typeof coopOn === "function" && coopOn() ? 74 : 8; // 둘이 하기면 2번 하트 줄 아래로
  ctx.fillStyle = "rgba(20,16,12,0.78)"; ctx.fillRect(x0, y0, w, 56);
  text(`${PVP_MODES[B.pvMode] || "결투"} · 목표 ${B.pvGoal}점 · ${m}:${String(s).padStart(2, "0")}`, W / 2, y0 + 18, 14, "#ffe27a", "center");
  items.forEach((it, i) => { const cx = x0 + (w / items.length) * (i + 0.5); text(`${it.label} ${it.n}`, cx, y0 + 44, 16, it.col, "center"); });
  if (B.pvEnd && B.pvWin) { ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, view.h * 0.38, W, 70); text(B.pvWin, W / 2, view.h * 0.38 + 46, 34, "#ffe27a", "center"); }
}, 40);

// ----- 캠프: 결투장 깃발 + 고르기 창 -----
const PVP_SIGN = { x: 11.6, y: 11.2, placed: false };
function pvpSignSpot() {
  if (!PVP_SIGN.placed && game.scene === "lobby" && typeof findFreeSpot === "function") { const s = findFreeSpot(11.6, 11.2, 0.6, 3); if (s) { PVP_SIGN.x = s.x; PVP_SIGN.y = s.y; } PVP_SIGN.placed = true; }
  return PVP_SIGN;
}
hookOn("lobbyThings", (things) => {
  const s = pvpSignSpot();
  if (world.solids && !world.solids.__pvp) { world.solids.__pvp = true; world.solids.push({ x: s.x, y: s.y, r: 0.3 }); }
  things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
    drawBox(s.x - 0.05, s.y - 0.05, 0, 0.1, 0.1, 1.5, "#6b4a2a");
    drawBox(s.x + 0.05, s.y - 0.04, 1.0, 0.55, 0.06, 0.42, "#c83a3a");
    drawBox(s.x + 0.05, s.y - 0.05, 1.12, 0.55, 0.07, 0.1, "#4aa3ff");
    const c = toScreen(s.x, s.y, 1.9); if (Math.sin(game.time * 3) > 0.7) drawStar(c.x, c.y, 5 * ZOOM, "#ffe27a");
  } });
}, 65);
hookOn("lobbyInteractables", (list) => {
  const s = pvpSignSpot();
  list.push({ x: s.x, y: s.y, range: 1.4, label: "결투장", short: "결투", prompt: allPlayers().length >= 2 ? "결투장: 친구와 겨뤄요!" : "결투장 (친구와 같이 할 때 열려요)", action: () => {
    if (pvpGuest()) { showMessage("방장이 결투를 시작할 수 있어요. 방장에게 말해요!", 2.4); return; }
    if (allPlayers().length < 2) { showMessage("결투는 두 명 이상일 때 해요 (메뉴: 같이 하기 · 둘이 하기)", 2.6); return; }
    game.overlay = "pvp";
  } });
  return list;
}, 65);
// 팀 나누기: 인원이 고르게 되는 나누기들 중 "팀 바꾸기" 누른 횟수 번째 (3명이면 1:2, 4명이면 2:2 세 가지)
function pvpTeamSplit(pids) {
  const n = pids.length, half = Math.floor(n / 2), splits = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    let c = 0; for (let i = 0; i < n; i++) if (mask & (1 << i)) c++;
    if (c !== half || (mask & 1) === 0 && n % 2 === 0) continue; // 짝수면 1번 사람이 든 쪽만 (같은 나누기 두 번 세지 않게)
    splits.push(mask);
  }
  const mask = splits.length ? splits[((pvp.teamShift % splits.length) + splits.length) % splits.length] : 1;
  return new Map(pids.map((pid, i) => [pid, mask & (1 << i) ? 0 : 1]));
}
function pvpTeamPreview() {
  const pids = allPlayers().map(pvpPid).sort((a, b) => a - b), split = pvpTeamSplit(pids);
  return pids.map((pid) => ({ pid, team: split.get(pid) }));
}
hookOn("overlayUpdate", (name) => {
  if (name !== "pvp") return false;
  if (wasPressed("Escape", "KeyE")) closeOverlay();
  if (wasPressed("Digit1")) pvpStart("duel");
  if (wasPressed("Digit2")) pvpStart("ffa");
  if (wasPressed("Digit3")) pvpStart("team");
  if (wasPressed("Digit4")) pvp.teamShift++;
  return true;
}, 50);
hookOn("overlayDraw", (name) => {
  if (name !== "pvp") return false;
  const W = view.w, H = view.h, pw = Math.min(560, W - 24), ph = 380, x0 = (W - pw) / 2, y0 = (H - ph) / 2, n = allPlayers().length;
  drawPanel(x0, y0, pw, ph);
  text("결투장", W / 2, y0 + 42, 26, "#ffe27a", "center");
  text(`지금 ${n}명 · 모두 하트 ${PVP.hp}개로 똑같이 · 넉다운 되면 바로 다시 일어나요`, W / 2, y0 + 68, 13, "#ccc", "center");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  const btn = (i, mode, label, sub) => {
    const why = pvpCanStart(mode), y = y0 + 90 + i * 66;
    drawButton(x0 + 24, y, pw - 48, 56, `${i + 1}. ${label}`, () => pvpStart(mode), { size: 18, color: why ? "rgba(70,70,80,0.5)" : "rgba(200,80,70,0.45)" });
    text(why || sub, x0 + pw - 36, y + 48, 12, why ? "#aab" : "#ffd0c0", "right");
  };
  btn(0, "duel", "1:1 결투", `둘이서 먼저 ${PVP.goal.duel}점`);
  btn(1, "ffa", "각자 싸움", `모두가 적! 먼저 ${PVP.goal.ffa}점`);
  btn(2, "team", "팀전", `편을 나눠 팀 점수 ${PVP.goal.team}점`);
  const prev = pvpTeamPreview(), y = y0 + 300;
  text("팀: " + prev.map((e) => `${pvpLabel(e.pid)}(${e.team ? "빨강" : "파랑"})`).join(" · "), x0 + 24, y + 14, 13, "#ddd");
  drawButton(x0 + pw - 164, y - 6, 140, 40, "4. 팀 바꾸기", () => { pvp.teamShift++; }, { size: 15 });
  return true;
}, 50);
