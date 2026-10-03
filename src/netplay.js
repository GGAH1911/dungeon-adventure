// ===== 같은 Wi-Fi 같이 하기 (docs/design/netplay.md) =====
// 방장 기기가 세상을 모두 계산하고, 친구 기기는 자기 조작을 보내고 방장 상태를 받아 그려요.
//   방장: game.players = [나(1번), 친구(2~4번, p.remote)]  친구 조작은 "playerInput" 훅으로 넣어요
//   친구: game.player = 내 주인공(내 화면에서 먼저 움직임), 나머지(몬스터·다른 사람·장판)는 받은 상태
// 연결은 net.js (PeerJS 는 같이 하기를 누를 때만 불러와요).
//
// 메시지 (net.js 위에서 { t: 종류, ... })
//   친구 -> 방장: hello(장비·직업·모습) / input(조작, 초당 30) / gear(장비 바뀜)
//   방장 -> 친구: scene(장면) / snap(상태, 초당 15) / result(결과창) / reward(보상)

const NP = {
  snapHz: 15,          // 방장이 상태를 보내는 횟수 (초당)
  inputHz: 30,         // 친구가 조작을 보내는 횟수 (초당)
  keyhuntEvery: 5,     // 열쇠 찾기 상태는 상태 5번에 1번
  correct: 0.8,        // 친구 내 주인공 위치가 방장과 이만큼 다르면 당겨 맞춰요
};
const netplay = {
  role: null,          // null | "host" | "guest"
  session: null,       // NetSession (시험에서는 loopback 을 넣어요)
  code: null, slot: 1,
  remotes: new Map(),  // 방장: 자리 -> { info, input, prev }
  sendT: 0, inT: 0, snapN: 0, nid: 1,
  sent: new Map(),     // 방장: 몬스터 nid -> { 필드: json }
  events: [],          // 방장: 다음 상태에 실어 보낼 사건
  sceneKey: null, resultSent: null, prof: null,
  mons: new Map(),     // 친구: nid -> 몬스터
  others: new Map(),   // 친구: pid -> 다른 주인공
  rxSnap: 0, guestSceneKey: null, presses: {}, replaying: false, pendingSnap: null,
  stats: { snaps: 0, bytes: 0, t0: 0, kbps: 0, lastBytes: 0, lastT: 0 },
  status: "", ui: { digits: "" },
};

// 저장 칸: 같이 할 때 머리 위 이름 (비어 있으면 번호만)
hookOn("profileLoaded", (pr) => { if (typeof pr.netName !== "string") pr.netName = ""; }, 50);

function netSession() { return netplay.session || (netplay.session = typeof Net !== "undefined" ? Net : null); }
function netHosting() { return netplay.role === "host" && netSession() && netSession().peers.size > 0; }
function netGuest() { return netplay.role === "guest"; }
function netOn() { return !!netplay.role; }

// ----- 친구가 보내는 내 소개 (장비는 내 기기 저장으로 계산한 값) -----
function netHello() {
  const pr = game.profile, armor = currentArmor();
  return {
    name: (pr.netName || "").slice(0, 6), cls: pr.cls || "warrior", level: pr.level, skillMods: pr.skillMods,
    weapon: currentWeapon(), bow: currentBow(), armor, maxHp: maxHpFor(armor),
    look: pr.look || {},
  };
}

// ===================== 방장 =====================
async function netHost() {
  const S = netSession(); if (!S) return;
  netReset();
  S.info = { name: "방장" };
  netBind(S);
  try {
    const code = await S.host();
    netplay.role = "host"; netplay.code = code; netplay.slot = 1;
    netplay.prof = netProfileCounts();
    netplay.status = `방 번호 ${code}`;
    if (game.player) game.player.pid = 1;
    return code;
  } catch (e) { netplay.status = (e && e.text) || "방을 못 만들었어요"; netplay.role = null; throw e; }
}

function netAddRemote(slot, info) {
  const p1 = game.player; if (!p1) return null;
  p1.pid = 1;
  const s = findFreeSpot(p1.x + 0.9 * (slot - 1), p1.y - 0.9, 0.35, 4) || { x: p1.x, y: p1.y };
  const q = createPlayer(s.x, s.y);
  q.pid = slot; q.remote = true; q.faceX = p1.faceX; q.faceY = p1.faceY;
  netApplyGear(q, info);
  const list = (game.players || [p1]).filter((x) => x.pid !== slot);
  list.push(q); list.sort((a, b) => (a.pid || 1) - (b.pid || 1));
  game.players = list;
  if (typeof coop !== "undefined") coop.tiles = world.tiles;
  return q;
}
function netApplyGear(q, info) {
  info = info || {};
  const lvK = typeof damageBonus === "function" && info.level ? damageBonus(info.level) / damageBonus(game.profile.level) : 1;
  if (info.weapon) q.weapon = { ...info.weapon, damage: info.weapon.damage * lvK };
  if (info.bow) q.bow = { ...info.bow, damage: info.bow.damage * lvK, infinite: true }; // 친구 화살은 방장 저장에서 빼지 않아요
  if (info.armor) q.armor = info.armor;
  if (info.maxHp) { const was = q.maxHp; q.maxHp = info.maxHp; if (q.hp > 0) q.hp = Math.min(q.maxHp, q.hp + Math.max(0, q.maxHp - was)); }
  q.cls = info.cls; q.skillMods = info.skillMods; q.level = info.level; q.netName = info.name || "";
  q.netLook = info.look && info.look.hideArmor ? null : null;
  q.remoteInfo = info;
  if (typeof clsPrepare === "function") { q._cls = null; try { clsPrepare(q); } catch (e) { /* 직업 준비 실패는 무시 */ } }
}
hookOn("refreshPlayerGear", (p) => { if (!p.remote) return false; netApplyGear(p, p.remoteInfo); return true; }, 50);

// 장면이 바뀌면(캠프·던전·보스방) 친구들도 다시 세워요
hookOn("playerPlaced", (p1) => {
  if (netplay.role !== "host") return;
  p1.pid = 1;
  for (const [slot, r] of netplay.remotes) netAddRemote(slot, r.info);
}, 70);

// 친구 조작 -> 친구 주인공
hookOn("playerInput", (inp, p) => {
  netplay.curP = p;
  if (p.remote) {
    const r = netplay.remotes.get(p.pid);
    const out = { sx: 0, sy: 0 };
    if (!r || !r.input) return out;
    const I = r.input, prev = r.prev || {};
    for (const k of Object.keys(I)) {
      if (k === "sx" || k === "sy") out[k] = I[k];
      else if (k.endsWith("Pressed")) out[k] = (I[k] || 0) !== (prev[k] || 0);
      else out[k] = !!I[k];
    }
    if (out.potionPressed) { out.potionPressed = false; if (p.hp > 0 && p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + POTION.heal); addFloatText(p.x, p.y, `+${POTION.heal}`, "#ff7bd0", 22); sfx.potion(); } }
    if (out.usePressed && game.scene === "dungeon") { const n = nearestNpc(p); if (n) n.action(); }
    r.prev = { ...I };
    return out;
  }
  // 같이 하는 중 메뉴가 열려 있으면 방장 주인공은 가만히
  if (netHosting() && game.overlay) return { sx: 0, sy: 0 };
  return inp;
}, 80);
hookOn("playersUpdated", () => { netplay.curP = null; }, 0);
hookOn("keepRunning", () => netHosting(), 50);

// 사건 모으기 (소리·글자·터짐·고리·번쩍·메시지)
hookOn("event", (kind, args) => {
  if (!netHosting() || netplay.replaying) return;
  if (netplay.events.length > 120) return;
  const src = netplay.curP && netplay.curP.remote ? netplay.curP.pid : 0;
  netplay.events.push([kind, netEnc(args, 1), src]);
}, 50);
hookOn("reward", (kind, n) => { if (netHosting() && kind === "xp") netplay.events.push(["xp", n, 0]); }, 50);

function netProfileCounts() {
  const pr = game.profile;
  return { emeralds: pr.emeralds, arrows: pr.arrows, potions: pr.potions, materials: { ...(pr.materials || {}) }, special: { ...(pr.special || {}) } };
}
// 방장이 얻은 것(늘어난 것만)을 친구에게도 (모두 1인분씩)
function netRewardDelta() {
  const a = netplay.prof || netProfileCounts(), b = netProfileCounts(), d = {};
  for (const k of ["emeralds", "arrows", "potions"]) if (b[k] > a[k]) d[k] = b[k] - a[k];
  for (const g of ["materials", "special"]) for (const id of Object.keys(b[g])) if ((b[g][id] || 0) > (a[g][id] || 0)) (d[g] = d[g] || {})[id] = b[g][id] - (a[g][id] || 0);
  netplay.prof = b;
  return Object.keys(d).length ? d : null;
}

// ----- 상태 만들기 (몬스터는 바뀐 칸만) -----
let NP_AB_REV = null, NP_DEF_REV = null;
function netRevMaps() {
  if (NP_AB_REV) return;
  NP_AB_REV = new Map(); NP_DEF_REV = new Map();
  if (typeof ABILITIES !== "undefined") for (const [k, v] of Object.entries(ABILITIES)) NP_AB_REV.set(v, k);
  for (const [k, v] of Object.entries(MONSTERS)) NP_DEF_REV.set(v, k);
}
const NP_SKIP = new Set(["def", "snap", "trail", "world", "remoteInfo", "doorRoom", "img", "canvas", "cache", "thumb"]);
function netEnc(v, depth = 0) {
  if (v === null || v === undefined) return v;
  const t = typeof v;
  if (t === "number") return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  if (t === "string" || t === "boolean") return v;
  if (t === "function" || t === "symbol") return undefined;
  if (Array.isArray(v)) { if (depth > 3) return undefined; const out = []; const n = Math.min(v.length, 300); for (let i = 0; i < n; i++) out.push(netEnc(v[i], depth + 1)); return out; }
  if (Object.prototype.toString.call(v) === "[object Set]") return { $s: [...v].slice(0, 100).map((x) => netEnc(x, depth + 1)) };
  netRevMaps();
  if (v._nid !== undefined && depth > 0) return { $m: v._nid };
  if (v.pid !== undefined && v.walkTime !== undefined && depth > 0) return { $p: v.pid };
  if (NP_AB_REV.has(v)) return { $a: NP_AB_REV.get(v) };
  if (NP_DEF_REV.has(v)) return { $d: NP_DEF_REV.get(v) };
  const proto = Object.getPrototypeOf(v);
  if (proto !== null && Object.getPrototypeOf(proto) !== null) return undefined; // 보통 객체만 (그림·캔버스 같은 것은 안 보내요)
  if (depth > 3) return undefined;
  const out = {};
  for (const k of Object.keys(v)) {
    if (NP_SKIP.has(k) || (k[0] === "_" && k !== "_nid" && k !== "_buff")) continue;
    const e = netEnc(v[k], depth + 1);
    if (e !== undefined) out[k] = e;
  }
  return out;
}

// 함께 보내는 배열들 (없을 수 있는 것은 typeof 로 확인)
const NP_LISTS = {
  arrows: [() => arrows, (v) => { arrows = v; }],
  shots: [() => shots, (v) => { shots = v; }],
  casts: [() => (typeof casts !== "undefined" ? casts : []), (v) => { if (typeof casts !== "undefined") casts = v; }],
  zones: [() => (typeof zones !== "undefined" ? zones : []), (v) => { if (typeof zones !== "undefined") zones = v; }],
  hazards: [() => (typeof hazards !== "undefined" ? hazards : []), (v) => { if (typeof hazards !== "undefined") hazards = v; }],
  pickups: [() => pickups, (v) => { pickups = v; }],
  chests: [() => chests, (v) => { chests = v; }],
  allies: [() => (typeof allies !== "undefined" ? allies : []), (v) => { if (typeof allies !== "undefined") allies = v; }],
  clsFx: [() => (typeof clsFx !== "undefined" ? clsFx : []), (v) => { if (typeof clsFx !== "undefined") clsFx = v; }],
  b2Spins: [() => (typeof b2Spins !== "undefined" ? b2Spins : []), (v) => { if (typeof b2Spins !== "undefined") b2Spins = v; }],
};

function netMonsterFields(m) {
  const out = {};
  for (const k of Object.keys(m)) {
    if (NP_SKIP.has(k) || (k[0] === "_" && k !== "_buff")) continue;
    const e = netEnc(m[k], 1);
    if (e !== undefined) out[k] = e;
  }
  out.type = m.type;
  return out;
}

function netBuildSnap() {
  const snap = { t: "snap", n: ++netplay.snapN, key: netplay.sceneKey, tm: game.time, sh: game.shake };
  // 주인공들
  snap.pl = allPlayers().map((q) => { const e = netEnc(q, 0); e.pid = q.pid || 1; e.cls = typeof playerCls === "function" ? playerCls(q) : q.cls; return e; });
  // 몬스터 (바뀐 칸만)
  const ids = [], md = [];
  const seen = new Set();
  for (const m of monsters) {
    if (m._nid === undefined) m._nid = netplay.nid++;
    ids.push(m._nid); seen.add(m._nid);
    const f = netMonsterFields(m);
    const last = netplay.sent.get(m._nid) || {};
    const delta = {}; let any = false;
    for (const k of Object.keys(f)) { const j = JSON.stringify(f[k]); if (last[k] !== j) { delta[k] = f[k]; last[k] = j; any = true; } }
    netplay.sent.set(m._nid, last);
    if (any) md.push([m._nid, delta]);
  }
  for (const id of [...netplay.sent.keys()]) if (!seen.has(id)) netplay.sent.delete(id);
  snap.ids = ids; snap.md = md;
  snap.ls = {};
  for (const [k, [get]] of Object.entries(NP_LISTS)) { const a = get(); snap.ls[k] = a && a.length ? netEnc(a, 0) : []; }
  if (typeof b2Field !== "undefined") snap.b2f = netEnc(b2Field, 1);
  if (game.keyhunt && netplay.snapN % NP.keyhuntEvery === 1) snap.kh = netEnc(game.keyhunt, 0);
  if (netplay.events.length) { snap.ev = netplay.events; netplay.events = []; }
  const rw = netRewardDelta(); if (rw) snap.rw = rw;
  return snap;
}

function netSceneKey() {
  const kh = game.keyhunt;
  return [game.scene, game.scene === "dungeon" && game.mapDef ? game.mapDef.id : "", game.mapLevel || 0, game.scene === "dungeon" ? netplay.runSeed || 0 : 0, kh && kh.inBoss ? "boss" : ""].join("|");
}
function netSceneMsg() {
  const kh = game.keyhunt;
  return { t: "scene", s: game.scene, map: game.mapDef ? game.mapDef.id : null, level: game.mapLevel, seed: netplay.runSeed, boss: !!(kh && kh.inBoss), diff: game.profile.difficulty, key: netSceneKey() };
}

function netHostTick(dt) {
  const S = netSession();
  if (!S || S.peers.size === 0) return;
  // 장면 바뀜
  const key = netSceneKey();
  if (key !== netplay.sceneKey) { netplay.sceneKey = key; netplay.sent.clear(); S.broadcast(netSceneMsg()); }
  // 결과창
  if (game.result && netplay.resultSent !== game.result) { netplay.resultSent = game.result; S.broadcast({ t: "result", r: netEnc(game.result, 0), et: game.endTimer }); }
  if (!game.result) netplay.resultSent = null;
  // 상태
  netplay.sendT -= dt;
  if (netplay.sendT > 0) return;
  netplay.sendT = 1 / NP.snapHz;
  const snap = netBuildSnap();
  const json = JSON.stringify(snap);
  netStatBytes(json.length);
  S.broadcast(snap, true);
}
function netStatBytes(n) {
  const st = netplay.stats; st.snaps++; st.bytes += n;
  const now = game.time;
  if (now - st.lastT >= 2) { st.kbps = (st.bytes - st.lastBytes) / 1024 / Math.max(0.001, now - st.lastT); st.lastT = now; st.lastBytes = st.bytes; }
}

function netOnMessageHost(msg, slot) {
  if (!msg || !msg.t) return;
  const r = netplay.remotes.get(slot);
  if (msg.t === "hello" || msg.t === "gear") {
    const info = msg.info || {};
    if (!r) netplay.remotes.set(slot, { info, input: null, prev: null }); else r.info = info;
    const q = allPlayers().find((x) => x.pid === slot);
    if (q) netApplyGear(q, info); else netAddRemote(slot, info);
    if (msg.t === "hello") {
      showMessage(`${slot}번 친구가 들어왔어요!`, 2.5, false, coopColorOf(slot).label);
      netplay.sceneKey = null; netplay.sent.clear(); // 다음 틱에 장면·전체 상태
      if (game.scene === "dungeon" && typeof coopScaleMonsters === "function") coopScaleMonsters(allPlayers().length);
    }
    return;
  }
  if (msg.t === "input" && r) { r.input = msg.i; return; }
}

// ===================== 친구 =====================
async function netJoin(code) {
  const S = netSession(); if (!S) return;
  netReset();
  S.info = netHello();
  netBind(S);
  try {
    const slot = await S.join(code);
    netplay.role = "guest"; netplay.code = String(code); netplay.slot = slot;
    if (game.player) game.player.pid = slot;
    S.toHost({ t: "hello", info: netHello() });
    netplay.status = `${slot}번으로 들어왔어요`;
    netplay.gearJson = JSON.stringify(netHello());
    return slot;
  } catch (e) { netplay.status = (e && e.text) || "들어가지 못했어요"; netplay.role = null; throw e; }
}

function netGuestTick(dt) {
  const S = netSession(); if (!S) return;
  // 조작 보내기
  netplay.inT -= dt;
  const p = game.player;
  if (p) {
    const inp = playerInputLocal(p);
    // 물약은 친구 자기 저장에서 써요 (없거나 하트가 가득하면 보내지 않아요)
    if (inp.potionPressed) {
      const pr = game.profile;
      if (game.scene === "lobby" || p.hp <= 0) inp.potionPressed = false;
      else if (pr.potions <= 0) { inp.potionPressed = false; showMessage("물약이 없어요", 1); sfx.denied(); }
      else if (p.hp >= p.maxHp) { inp.potionPressed = false; showMessage("체력이 가득해요", 1); }
      else { pr.potions--; saveProfile(); }
    }
    for (const k of Object.keys(inp)) if (k.endsWith("Pressed") && inp[k]) netplay.presses[k] = (netplay.presses[k] || 0) + 1;
    if (wasPressed("KeyE", "TouchUse") && game.scene === "dungeon") netplay.presses.usePressed = (netplay.presses.usePressed || 0) + 1;
    if (netplay.inT <= 0) {
      netplay.inT = 1 / NP.inputHz;
      const i = {};
      for (const k of Object.keys(inp)) { if (k.endsWith("Pressed")) continue; i[k] = typeof inp[k] === "number" ? Math.round(inp[k] * 100) / 100 : !!inp[k]; }
      Object.assign(i, netplay.presses);
      S.toHost({ t: "input", i }, true);
    }
  }
  // 장비가 바뀌면 알려요 (1초마다 확인)
  netplay.gearT = (netplay.gearT || 0) - dt;
  if (netplay.gearT <= 0) {
    netplay.gearT = 1;
    const j = JSON.stringify(netHello());
    if (j !== netplay.gearJson) { netplay.gearJson = j; S.toHost({ t: "gear", info: JSON.parse(j) }); }
  }
}
// 내 기기 조작 (훅을 거치지 않은 원래 값)
function playerInputLocal(p) {
  const was = netplay.role; netplay.role = null; // 우리 훅이 끼어들지 않게
  const i = playerInput(p);
  netplay.role = was;
  return i;
}

function netOnMessageGuest(msg) {
  if (!msg || !msg.t) return;
  if (msg.t === "scene") return netGuestScene(msg);
  if (msg.t === "snap") { if (msg.key === netplay.guestSceneKey) netGuestApply(msg); return; } // 장면이 맞을 때만
  if (msg.t === "result") {
    game.result = netDec(msg.r); game.endTimer = msg.et || 1;
    return;
  }
}

function netGuestScene(msg) {
  netplay.guestSceneKey = msg.key;
  game.profile.difficulty = msg.diff || game.profile.difficulty;
  const prev = netplay.lastScene || {};
  netplay.replaying = true;
  try {
    if (msg.s === "lobby") { if (game.scene !== "lobby" || game.result) { game.result = null; enterLobby(); } }
    else if (msg.s === "dungeon") {
      const def = MAPS.find((m) => m.id === msg.map);
      const sameMap = prev.s === "dungeon" && prev.map === msg.map && prev.seed === msg.seed && game.scene === "dungeon";
      if (msg.boss && sameMap && game.keyhunt && !game.keyhunt.inBoss) enterBossRoom();
      else if (!msg.boss && sameMap && game.keyhunt && game.keyhunt.inBoss && game.keyhunt.snap) retryBoss();
      else if (!sameMap && def) {
        netplay.forceSeed = msg.seed;
        startDungeon(def, msg.level);
        netplay.forceSeed = undefined;
        if (msg.boss && game.keyhunt) enterBossRoom();
      }
      game.result = null; game.overlay = null;
    }
  } finally { netplay.replaying = false; }
  // 몬스터·물건은 방장 상태로만
  monsters = []; netplay.mons.clear();
  for (const [, [, set]] of Object.entries(NP_LISTS)) set([]);
  if (game.player) game.player.pid = netplay.slot;
  netplay.others.clear();
  netplay.lastScene = msg;
}
hookOn("dungeonStarted", () => { netplay.runSeed = world.seed; }, 10);
hookOn("dungeonSeed", (seed) => (netGuest() && netplay.forceSeed !== undefined ? netplay.forceSeed : seed), 50);

function netDec(v) {
  if (v === null || v === undefined || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(netDec);
  if (v.$m !== undefined) return netMonById(v.$m);
  if (v.$p !== undefined) return allPlayers().find((q) => q.pid === v.$p) || game.player;
  if (v.$a !== undefined) return typeof ABILITIES !== "undefined" ? ABILITIES[v.$a] : null;
  if (v.$d !== undefined) return MONSTERS[v.$d];
  if (v.$s !== undefined) return new Set(v.$s.map(netDec));
  const out = {};
  for (const k of Object.keys(v)) out[k] = netDec(v[k]);
  return out;
}
function netMonById(id) {
  let m = netplay.mons.get(id);
  if (!m) { m = { _nid: id, x: 0, y: 0, faceX: 1, faceY: 0, hp: 1, maxHp: 1, r: 0.4, walkTime: 0, appearTimer: 0, _new: true }; netplay.mons.set(id, m); }
  return m;
}

function netGuestApply(snap) {
  netplay.rxSnap++;
  // 몬스터
  for (const [id, f] of snap.md || []) {
    const m = netMonById(id);
    for (const k of Object.keys(f)) {
      if (k === "x" || k === "y") { m["_t" + k] = f[k]; if (m._new) m[k] = f[k]; continue; }
      m[k] = netDec(f[k]);
    }
    if (m.type && MONSTERS[m.type]) m.def = MONSTERS[m.type];
    m._new = false;
  }
  const keep = new Set(snap.ids || []);
  for (const id of [...netplay.mons.keys()]) if (!keep.has(id)) netplay.mons.delete(id);
  monsters = (snap.ids || []).map((id) => netplay.mons.get(id)).filter((m) => m && m.def);
  // 다른 배열
  for (const [k, [, set]] of Object.entries(NP_LISTS)) if (snap.ls && snap.ls[k]) set(netDec(snap.ls[k]));
  // 새로 시작된 기술 예고 -> 친구 화면에도 안내 배너·목소리 (guide.js 의 castStarted)
  if (snap.ls && snap.ls.casts && typeof casts !== "undefined") {
    const now = new Set();
    for (const c of casts) {
      if (!c || !c.m || !c.id) continue;
      const key = c.m; let ids = netplay.castSeen && netplay.castSeen.get(key);
      now.add(c);
      if (!ids || !ids.has(c.id)) hookRun("castStarted", c.m, c.id);
    }
    const map = new Map();
    for (const c of now) { if (!map.has(c.m)) map.set(c.m, new Set()); map.get(c.m).add(c.id); }
    netplay.castSeen = map;
  }
  if (snap.b2f !== undefined && typeof b2Field !== "undefined") b2Field = netDec(snap.b2f);
  if (snap.kh && game.keyhunt) { const kh = netDec(snap.kh); for (const k of Object.keys(kh)) if (!NP_KH_LOCAL.has(k)) game.keyhunt[k] = kh[k]; }
  game.shake = Math.max(game.shake, snap.sh || 0);
  // 주인공들
  netGuestPlayers(snap.pl || []);
  // 사건
  if (snap.ev) {
    netplay.replaying = true;
    try {
      for (const [kind, args, src] of snap.ev) {
        const a = netDec(args);
        if (kind === "float") addFloatText(...a);
        else if (kind === "burst") spawnBurst(...a);
        else if (kind === "ring") addRing(...a);
        else if (kind === "flash") flashScreen(...a);
        else if (kind === "msg") showMessage(...a);
        else if (kind === "sfx") { if (src !== netplay.slot && sfx[a[0]]) sfx[a[0]](...a.slice(1)); }
        else if (kind === "xp") gainXp(a);
      }
    } finally { netplay.replaying = false; }
  }
  // 보상 (방장이 얻은 만큼 나도)
  if (snap.rw) netGuestReward(snap.rw);
}

function netGuestReward(d) {
  const pr = game.profile, max = CONFIG.player.maxArrows;
  if (d.emeralds) { pr.emeralds += d.emeralds; if (game.run) game.run.emeralds = (game.run.emeralds || 0) + d.emeralds; }
  if (d.arrows) pr.arrows = Math.min(max, pr.arrows + d.arrows);
  if (d.potions) pr.potions = Math.min(CONFIG.player.maxPotions, pr.potions + d.potions);
  for (const [id, n] of Object.entries(d.materials || {})) addMaterial(id, n);
  for (const [id, n] of Object.entries(d.special || {})) pr.special[id] = Math.min(max, (pr.special[id] || 0) + n);
  netplay.saveT = 0.5;
}

// 열쇠 찾기 상태 중 친구 기기가 스스로 관리하는 것 (보스방 들어가기/나오기는 장면 메시지로)
const NP_KH_LOCAL = new Set(["snap", "inBoss", "keepOnReset", "enterT", "gate"]);
const NP_OWN_FIELDS = ["hp", "maxHp", "res", "resMax", "cd", "bear", "ghost", "ghostT", "reviveT", "abSlow", "abBurn", "hurtTimer", "flash", "buffT"];
function netGuestPlayers(list) {
  const me = game.player;
  const seen = new Set();
  for (const e of list) {
    seen.add(e.pid);
    if (e.pid === netplay.slot && me) {
      for (const k of NP_OWN_FIELDS) if (e[k] !== undefined) me[k] = netDec(e[k]);
      me._hx = e.x; me._hy = e.y;
      continue;
    }
    let q = netplay.others.get(e.pid);
    if (!q) { q = createPlayer(e.x, e.y); netplay.others.set(e.pid, q); }
    const d = netDec(e);
    for (const k of Object.keys(d)) { if (k === "x" || k === "y") continue; q[k] = d[k]; }
    q._tx = e.x; q._ty = e.y; q.pid = e.pid; q.netRemoteView = true;
  }
  for (const pid of [...netplay.others.keys()]) if (!seen.has(pid)) netplay.others.delete(pid);
  if (me) {
    me.pid = netplay.slot;
    const all = [me, ...netplay.others.values()].sort((a, b) => a.pid - b.pid);
    game.players = all.length > 1 ? all : null;
  }
}

// 친구 기기 매 프레임: 내 주인공만 계산, 나머지는 받은 상태를 부드럽게
function netGuestUpdate(dt) {
  const p = game.player;
  if (p && p.hp > 0) updatePlayer(p, dt);
  // 방장 위치와 많이 다르면 당겨 맞춰요
  if (p && p._hx !== undefined) {
    const dx = p._hx - p.x, dy = p._hy - p.y, d = Math.hypot(dx, dy);
    if (d > 4) { p.x = p._hx; p.y = p._hy; }
    else if (d > NP.correct) { p.x += dx * Math.min(1, dt * 6); p.y += dy * Math.min(1, dt * 6); }
  }
  const lerp = (o) => {
    if (o._tx === undefined) return;
    const dx = o._tx - o.x, dy = o._ty - o.y, d = Math.hypot(dx, dy);
    if (d > 3) { o.x = o._tx; o.y = o._ty; } else { const k = Math.min(1, dt * 12); o.x += dx * k; o.y += dy * k; }
  };
  for (const m of monsters) lerp(m);
  for (const q of netplay.others.values()) lerp(q);
  updateParticles(dt);
  updateFloatTexts(dt);
  updateImpacts(dt);
  // 상자·문·말 걸기: 캠프는 내 기기에서(가게·대장장이), 던전은 방장에게 부탁 (E 를 보내요)
  game.nearNpc = p && p.hp > 0 ? nearestNpc(p) : null;
  game.nearWho = p;
  if (game.scene === "lobby") {
    if (game.nearNpc && game.nearNpc.action === openMapSelect) game.nearNpc = { ...game.nearNpc, short: "지도", prompt: "방장이 맵을 골라요", action: () => showMessage("방장이 맵을 고르는 중이에요", 2, false, "#ffe27a") };
    if (game.nearNpc && wasPressed("KeyE", "TouchUse")) game.nearNpc.action();
    updateLobby(p, dt);
  } else if (game.mode !== "tower" && p) revealAround(p.x, p.y);
  if (game.result && game.endTimer > 0) { game.endTimer -= dt; if (game.endTimer <= 0) game.overlay = "result"; }
  netplay.saveT = (netplay.saveT || 0) - dt;
  if (netplay.saveT <= 0 && netplay.saveT > -1) { netplay.saveT = -2; saveProfile(); }
  return true;
}
hookOn("simulateSkip", (dt) => (netGuest() ? netGuestUpdate(dt) : false), 50);
// 친구 기기는 몬스터를 직접 때리지 않아요 (방장이 계산)
hookOn("monsterDamage", () => netGuest() && !netplay.replaying, 0);
// 다시 도전 화면: 친구는 방장이 고를 때까지 기다려요
hookOn("resultDraw", () => {
  if (!netGuest() || !game.result || !game.result.retry) return false;
  const pw = Math.min(520, view.w - 24), ph = 200, x0 = (view.w - pw) / 2, y0 = (view.h - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("다 같이 쓰러졌어요...", view.w / 2, y0 + 70, 30, "#ff8080", "center");
  text("방장이 다시 도전을 고르면 같이 시작해요", view.w / 2, y0 + 120, 16, "#ffe27a", "center");
  return true;
}, 10);
// 결과창 버튼은 방장만
hookOn("resultUpdate", () => netGuest(), 0);
hookOn("endRun", () => netGuest(), 0);

// ===================== 공통 =====================
function netBind(S) {
  if (S._npBound) return;
  S._npBound = true;
  S.on("message", (msg, slot) => { if (netplay.role === "host") netOnMessageHost(msg, slot); else if (netplay.role === "guest") netOnMessageGuest(msg); });
  S.on("join", (slot, info) => { if (netplay.role === "host" && !netplay.remotes.has(slot)) netplay.remotes.set(slot, { info: info || {}, input: null, prev: null }); });
  S.on("leave", (slot, why) => {
    if (netplay.role === "host") {
      netplay.remotes.delete(slot);
      if (game.players) { game.players = game.players.filter((q) => q.pid !== slot); if (game.players.length < 2) game.players = null; }
      if (game.scene === "dungeon" && typeof coopScaleMonsters === "function") coopScaleMonsters(allPlayers().length);
      showMessage(`${slot}번 친구가 나갔어요`, 2.5, false, "#ffb070");
    }
  });
  S.on("error", (e) => {
    if (netplay.role === "guest" && e && (e.code === "lost")) {
      netplay.role = null; game.players = null; saveProfile();
      netplay.status = "방장과 연결이 끊겼어요";
      enterLobby("방장과 연결이 끊겼어요. 받은 보상은 저장됐어요");
    }
  });
}
function netReset() {
  netplay.remotes.clear(); netplay.mons.clear(); netplay.others.clear(); netplay.sent.clear();
  netplay.events = []; netplay.sceneKey = null; netplay.snapN = 0; netplay.presses = {}; netplay.lastScene = null;
}
function netLeave() {
  const S = netSession();
  const wasGuest = netGuest();
  netplay.role = null;
  try { if (S) S.leave(); } catch (e) { /* 무시 */ }
  netReset();
  game.players = null;
  saveProfile();
  if (wasGuest) enterLobby("혼자 하기로 돌아왔어요"); else showMessage("같이 하기를 끝냈어요", 2);
}

hookOn("netTick", (dt) => {
  if (netplay.role === "host") netHostTick(dt);
  else if (netplay.role === "guest") netGuestTick(dt);
}, 50);

// 카메라: 같이 하기는 각자 자기 주인공
hookOn("cameraTarget", (t, cx, cy) => (netOn() && game.player ? { x: game.player.x, y: game.player.y } : t), 40);

// ===================== 화면: 메뉴, 방 번호, 숫자판, 연결 표시 =====================
hookOn("menuItems", (items) => {
  if (!netOn()) {
    if (game.scene !== "lobby") return;
    items.push({ label: "같이 하기: 방 만들기", act: () => { closeOverlay(); game.overlay = "nethost"; netplay.status = "방을 만드는 중..."; netHost().catch(() => {}); } });
    items.push({ label: "같이 하기: 방 들어가기", act: () => { closeOverlay(); netplay.ui.digits = ""; netplay.status = ""; game.overlay = "netjoin"; } });
  } else {
    const n = netSession() ? netSession().count : 1;
    items.push({ label: `같이 하기 끝내기 (방 ${netplay.code} · ${n}명)`, act: () => { closeOverlay(); netLeave(); } });
    if (netplay.role === "host") items.push({ label: "방 번호 다시 보기", act: () => { closeOverlay(); game.overlay = "nethost"; } });
  }
}, 30);

hookOn("overlayUpdate", (name) => {
  if (name === "nethost") { if (wasPressed("Escape", "Enter", "Space")) closeOverlay(); return true; }
  if (name === "netjoin") {
    for (let d = 0; d <= 9; d++) if (wasPressed("Digit" + d, "Numpad" + d)) netKey(String(d));
    if (wasPressed("Backspace")) netKey("<");
    if (wasPressed("Enter")) netKey("ok");
    if (wasPressed("Escape")) closeOverlay();
    return true;
  }
  return false;
}, 50);
function netKey(k) {
  const u = netplay.ui;
  if (netplay.joining) return;
  if (k === "<") u.digits = u.digits.slice(0, -1);
  else if (k === "ok") {
    if (u.digits.length !== 4) { netplay.status = "숫자 4개를 눌러요"; return; }
    netplay.joining = true; netplay.status = "들어가는 중...";
    netJoin(u.digits).then(() => { netplay.joining = false; closeOverlay(); }).catch(() => { netplay.joining = false; });
  } else if (u.digits.length < 4) u.digits += k;
}

hookOn("overlayDraw", (name) => {
  if (name !== "nethost" && name !== "netjoin") return false;
  const W = view.w, H = view.h;
  const pw = Math.min(560, W - 24), ph = Math.min(name === "netjoin" ? 560 : 360, H - 16);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2, cx = W / 2;
  drawPanel(x0, y0, pw, ph);
  drawButton(x0 + pw - 54, y0 + 10, 42, 38, "✕", closeOverlay, { size: 20 });
  if (name === "nethost") {
    text("같이 하기 · 방 만들기", cx, y0 + 44, 22, "#ffe27a", "center");
    if (netplay.code && netplay.role === "host") {
      text("친구에게 이 숫자를 알려줘요", cx, y0 + 86, 16, "#ddd", "center");
      text(netplay.code.split("").join(" "), cx, y0 + 180, Math.min(96, ph * 0.3), "#ffffff", "center");
      const n = netSession() ? netSession().count : 1;
      text(n > 1 ? `친구 ${n - 1}명이 들어왔어요!` : "친구를 기다려요...", cx, y0 + ph - 70, 18, n > 1 ? "#7dffb0" : "#7dd3ff", "center");
    } else text(netplay.status || "", cx, y0 + 170, 18, "#ffb070", "center");
    drawButton(cx - 80, y0 + ph - 54, 160, 42, "닫기", closeOverlay, { size: 17 });
    return true;
  }
  // 숫자판
  text("같이 하기 · 방 들어가기", cx, y0 + 40, 22, "#ffe27a", "center");
  const d = netplay.ui.digits.padEnd(4, "_");
  text(d.split("").join(" "), cx, y0 + 100, 48, "#ffffff", "center");
  const keysPad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "<", "0", "ok"];
  const top = y0 + 124, bottom = y0 + ph - 40, rows = 4;
  const bh = Math.min(64, (bottom - top) / rows - 8), bw = Math.min(120, (pw - 60) / 3);
  keysPad.forEach((k, i) => {
    const c = i % 3, r = Math.floor(i / 3);
    const bx = cx - (bw * 3 + 16) / 2 + c * (bw + 8), by = top + r * (bh + 8);
    drawButton(bx, by, bw, bh, k === "<" ? "지우기" : k === "ok" ? "들어가기" : k, () => netKey(k), { size: k.length > 1 ? 16 : 26, color: k === "ok" ? "rgba(80,200,120,0.45)" : undefined });
  });
  if (netplay.status) text(netplay.status, cx, y0 + ph - 14, 15, netplay.joining ? "#7dd3ff" : "#ffb070", "center");
  return true;
}, 50);

// 연결 표시 + 같이 하는 사람 하트
hookOn("hudDraw", () => {
  if (!netOn()) return;
  const S = netSession(), W = view.w;
  const n = S ? S.count : 1;
  const rtt = S ? Object.values(S.rtt || {}) : [];
  const ms = rtt.length ? Math.max(...rtt) : null;
  const col = ms === null ? "#ddd" : ms < 80 ? "#7dffb0" : ms < 160 ? "#ffe27a" : "#ff8080";
  text(`같이 ${n}명${ms !== null ? ` · ${ms}ms` : ""}${netplay.role === "host" ? ` · 방 ${netplay.code}` : ""}`, W / 2, view.h - 30, 14, col, "center");
  // 다른 사람 하트 (위 가운데, 사람마다 한 줄)
  const bossBar = monsters.some((m) => m.boss && m.aggro && m.hp > 0);
  let y = bossBar ? 96 : 14;
  for (const q of allPlayers()) {
    if (q === game.player) continue;
    const c = coopColorOf(q.pid).label;
    text(`${q.pid}번`, W / 2 - 56, y + 12, 14, c, "right");
    const f = Math.max(0, q.hp / (q.maxHp || 1)), w = 110;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(W / 2 - 50, y + 2, w, 10);
    ctx.fillStyle = q.hp > 0 ? (f > 0.35 ? "#ff6b6b" : "#ffb070") : "#777"; ctx.fillRect(W / 2 - 50, y + 2, w * f, 10);
    if (q.hp <= 0) text("유령", W / 2 + 66, y + 12, 12, "#ffb070");
    y += 16;
  }
  // 지도: 친구 화면 안내
  if (netGuest() && game.scene === "lobby") text("방장이 맵을 고르면 같이 출발해요", W / 2, view.h - 50, 14, "#ffe27a", "center");
}, 70);

// 방장 지도: 친구에게 너무 어려운 레벨이면 알려줘요
hookOn("hudDraw", () => {
  if (!netHosting() || game.overlay !== "maps") return;
  const lv = typeof mapSel !== "undefined" ? mapSel.level : 0;
  const weak = [...netplay.remotes.values()].filter((r) => r.info && r.info.level && lv > r.info.level + 3);
  if (weak.length) text(`친구에게 어려워요 (친구 Lv ${weak.map((r) => r.info.level).join(", ")})`, view.w / 2, 30, 16, "#ffb070", "center");
}, 75);
