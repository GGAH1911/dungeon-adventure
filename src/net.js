// ===== 같이 하기: 연결만 하는 파일 (게임 로직 없음) =====
// docs/design/netplay.md
//
// 쓰는 법
//   const s = Net;                       // 기본 세션 (new NetSession() 으로 더 만들 수도 있어요: 시험용)
//   const code = await s.host();         // 방 만들기 -> "4719"
//   await s.join("4719");                // 방 들어가기
//   s.on("join", (slot, info) => ...)    // 친구가 들어옴 (방장만)
//   s.on("leave", (slot, why) => ...)    // 친구가 나감 / 방장이 끊김(slot 1)
//   s.on("message", (msg, fromSlot) => ...)
//   s.on("rtt", (slot, ms) => ...)       // 2초마다 왕복 시간
//   s.on("error", (err) => ...)          // err = { code, text } (아이 친화 문구)
//   s.send(slot, msg) / s.broadcast(msg) / s.toHost(msg)
//   s.sendFast(...)                      // 상태 스냅샷용 빠른 길(순서·재전송 없음). 없으면 보통 길로
//   s.leave()
//
// 연결 방법(transport)
//   "peer"      : PeerJS 무료 공용 서버로 처음 인사 → 그 뒤 기기끼리 직접 (기본)
//   "broadcast" : 같은 브라우저 두 탭 (BroadcastChannel) - 시험용
//   "loopback"  : 같은 JS 안 두 세션 - smoke 시험용 (NetLoopback)
//
// PeerJS 는 같이 하기를 누를 때만 불러와요 (혼자 할 때·인터넷 없을 때 게임에 영향 없음).

const NET_PROTOCOL = 1;          // 메시지 규칙 버전 (바꾸면 서로 다른 버전끼리 못 붙어요)
const NET_ID_PREFIX = "dadv-";   // PeerJS 아이디 = dadv-4719
const NET_MAX_PLAYERS = 4;       // 방장 1 + 친구 3
const NET_JOIN_TIMEOUT = 15000;  // 들어가기 시간 제한 (ms)
const NET_PING_EVERY = 2000;
const NET_LOST_AFTER = 9000;     // 이만큼 아무 소식이 없으면 끊긴 걸로
const NET_PART_SIZE = 15000;     // PeerJS json 한 메시지 한계(16300바이트)보다 조금 작게

const NET_TEXT = {
  "no-room": (c) => `방 번호 ${c || ""}번을 찾을 수 없어요. 방장 화면의 숫자를 다시 봐요`,
  offline: () => "연결 도우미에 닿지 않아요. 인터넷(Wi-Fi)이 켜져 있는지 확인해요",
  timeout: () => "연결이 너무 오래 걸려요. 두 기기가 같은 Wi-Fi인지, 손님용 Wi-Fi가 아닌지 확인해요",
  full: () => "방이 꽉 찼어요 (최대 4명)",
  lib: () => "같이 하기 준비물을 못 불러왔어요. 인터넷을 확인하고 새로고침해요",
  browser: () => "이 브라우저는 같이 하기를 못 해요. 크롬으로 열어요",
  version: () => "게임 버전이 달라요. 두 기기 모두 새로고침해요",
  lost: () => "연결이 끊겼어요",
  busy: () => "방 번호를 만들지 못했어요. 다시 해봐요",
};
function netError(code, extra) {
  const f = NET_TEXT[code] || NET_TEXT.lost;
  return { code, text: f(extra) };
}

// ----- PeerJS 불러오기 (한 번만) -----
// net.js 의 주소에서 vendor/peerjs.min.js 주소를 만들어요 (?v= 버전도 그대로 붙여요)
const NET_LIB_URL = (() => {
  try {
    const cs = typeof document !== "undefined" && document.currentScript;
    const src = cs && cs.src;
    if (!src) return "src/vendor/peerjs.min.js";
    const q = src.indexOf("?") >= 0 ? src.slice(src.indexOf("?")) : "";
    return src.replace(/net\.js(\?.*)?$/, "vendor/peerjs.min.js" + q);
  } catch (e) { return "src/vendor/peerjs.min.js"; }
})();
let netLibPromise = null;
function netLoadPeerLib() {
  if (typeof Peer === "function") return Promise.resolve();
  if (netLibPromise) return netLibPromise;
  netLibPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = NET_LIB_URL;
    s.async = true;
    s.onload = () => (typeof Peer === "function" ? resolve() : reject(netError("lib")));
    s.onerror = () => { netLibPromise = null; reject(netError("lib")); };
    document.head.appendChild(s);
  });
  return netLibPromise;
}

const netLater = (fn) => Promise.resolve().then(fn);

// ===== 연결 방법 1: PeerJS =====
// 연결(conn) 공통 모양: { remote, open, send(obj), onData(fn), onClose(fn), close(), pc, fast? }
const netEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
function netByteLen(str) { return netEncoder ? netEncoder.encode(str).length : str.length * 3; }
function netWrapPeerConn(c) {
  const conn = { remote: c.peer, open: c.open, kind: (c.metadata && c.metadata.kind) || "main", _data: [], _close: [], raw: c };
  Object.defineProperty(conn, "pc", { get: () => c.peerConnection });
  // PeerJS "json" 연결은 한 메시지가 16300바이트를 넘으면 오류를 내고 연결을 끊어요 -> 큰 메시지는 조각내서 보내요
  let partSeq = 0;
  conn.send = (obj) => {
    if (!c.open) return;
    const str = JSON.stringify(obj);
    if (str.length * 3 < NET_PART_SIZE || netByteLen(str) < NET_PART_SIZE) { c.send(obj); return; }
    const id = ++partSeq, step = Math.floor(NET_PART_SIZE / 3), n = Math.ceil(str.length / step); // 한글은 UTF-8 로 3바이트까지
    for (let i = 0; i < n; i++) c.send({ _n: "part", id, i, n, s: str.slice(i * step, (i + 1) * step) });
  };
  const parts = new Map();
  const deliver = (d) => {
    if (d && d._n === "part") {
      let a = parts.get(d.id); if (!a) { a = []; parts.set(d.id, a); }
      a[d.i] = d.s;
      if (a.filter((x) => x !== undefined).length < d.n) return;
      parts.delete(d.id);
      try { d = JSON.parse(a.join("")); } catch (e) { return; }
    }
    for (const f of conn._data) f(d);
  };
  conn.onData = (fn) => conn._data.push(fn);
  conn.onClose = (fn) => conn._close.push(fn);
  let closed = false;
  const fireClose = (why) => { if (closed) return; closed = true; conn.open = false; for (const f of conn._close) f(why); };
  conn.close = () => { try { c.close(); } catch (e) { /* 무시 */ } fireClose("closed"); };
  c.on("open", () => { conn.open = true; });
  c.on("data", deliver);
  c.on("close", () => fireClose("closed"));
  c.on("error", () => fireClose("error"));
  return conn;
}

class NetPeerTransport {
  constructor(opts = {}) { this.opts = opts; this.peer = null; }
  peerOptions() {
    return {
      debug: 0,
      config: { iceServers: this.opts.iceServers || [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] },
    };
  }
  async start(id) {
    await netLoadPeerLib();
    if (typeof RTCPeerConnection === "undefined") throw netError("browser");
    return new Promise((resolve, reject) => {
      const peer = id ? new Peer(id, this.peerOptions()) : new Peer(this.peerOptions());
      this.peer = peer;
      let opened = false;
      peer.on("open", () => { opened = true; resolve(peer.id); });
      peer.on("error", (e) => {
        const t = e && e.type;
        if (!opened) {
          if (t === "unavailable-id") reject({ code: "taken" });
          else if (t === "browser-incompatible") reject(netError("browser"));
          else reject(netError("offline"));
          return;
        }
        if (this.onPeerError) this.onPeerError(t, e);
      });
    });
  }
  // 방장: 들어오는 연결 받기
  listen(id, onConn) {
    return this.start(id).then(() => {
      this.peer.on("connection", (c) => onConn(netWrapPeerConn(c)));
    });
  }
  // 친구: 방장에게 연결
  async connect(id, opts = {}) {
    if (!this.peer) await this.start(null);
    return new Promise((resolve, reject) => {
      const c = this.peer.connect(id, { reliable: opts.kind !== "fast", serialization: "json", metadata: { kind: opts.kind || "main" }, label: opts.kind || "main" });
      const conn = netWrapPeerConn(c);
      let done = false;
      const timer = setTimeout(() => { if (!done) { done = true; reject(netError("timeout")); } }, opts.timeout || NET_JOIN_TIMEOUT);
      this.onPeerError = (t) => { if (!done && t === "peer-unavailable") { done = true; clearTimeout(timer); reject(netError("no-room", id.replace(NET_ID_PREFIX, ""))); } };
      c.on("open", () => { if (done) return; done = true; clearTimeout(timer); conn.open = true; resolve(conn); });
    });
  }
  destroy() { try { if (this.peer) this.peer.destroy(); } catch (e) { /* 무시 */ } this.peer = null; }
}

// ===== 연결 방법 2: 같은 JS 안 (smoke 시험) =====
const NetLoopback = {
  servers: new Map(),
  delay: 0, // ms (0 이면 바로 다음 마이크로태스크)
  pair(aId, bId) {
    const mk = (remote) => ({ remote, open: true, kind: "main", _data: [], _close: [], pc: null });
    const a = mk(bId), b = mk(aId);
    const deliver = (to, d) => {
      const copy = JSON.parse(JSON.stringify(d)); // 실제처럼 복사해서 보내요
      const go = () => { if (to.open) for (const f of to._data) f(copy); };
      if (NetLoopback.delay > 0) setTimeout(go, NetLoopback.delay); else netLater(go);
    };
    for (const [me, other] of [[a, b], [b, a]]) {
      me.send = (d) => { if (me.open) deliver(other, d); };
      me.onData = (fn) => me._data.push(fn);
      me.onClose = (fn) => me._close.push(fn);
      me.close = () => {
        for (const x of [me, other]) { if (!x.open) continue; x.open = false; const fs = x._close.slice(); netLater(() => fs.forEach((f) => f("closed"))); }
      };
    }
    return [a, b];
  },
};
let netLoopSeq = 0;
class NetLoopTransport {
  constructor() { this.id = null; }
  async listen(id, onConn) {
    if (NetLoopback.servers.has(id)) throw { code: "taken" };
    this.id = id; NetLoopback.servers.set(id, onConn);
  }
  async connect(id) {
    const onConn = NetLoopback.servers.get(id);
    if (!onConn) throw netError("no-room", id.replace(NET_ID_PREFIX, ""));
    this.id = this.id || "guest-" + (++netLoopSeq);
    const [mine, theirs] = NetLoopback.pair(this.id, id);
    netLater(() => onConn(theirs));
    return mine;
  }
  destroy() { if (this.id && NetLoopback.servers.get(this.id)) NetLoopback.servers.delete(this.id); }
}

// ===== 연결 방법 3: 같은 브라우저 두 탭 (BroadcastChannel) =====
class NetTabTransport {
  constructor() {
    this.id = null; this.ch = null; this.conns = new Map(); this.onConn = null; this.waiters = new Map();
  }
  chan() {
    if (this.ch) return this.ch;
    if (typeof BroadcastChannel === "undefined") throw netError("browser");
    this.ch = new BroadcastChannel("dadv-net");
    this.ch.onmessage = (e) => this.onMsg(e.data);
    return this.ch;
  }
  post(m) { this.chan().postMessage({ ...m, from: this.id }); }
  makeConn(remote, cid) {
    const conn = { remote, cid, open: true, kind: "main", _data: [], _close: [], pc: null };
    conn.send = (d) => { if (conn.open) this.post({ k: "data", to: remote, cid, d }); };
    conn.onData = (fn) => conn._data.push(fn);
    conn.onClose = (fn) => conn._close.push(fn);
    conn.close = () => { if (!conn.open) return; this.post({ k: "close", to: remote, cid }); this.dropConn(cid); };
    this.conns.set(cid, conn);
    return conn;
  }
  dropConn(cid) {
    const c = this.conns.get(cid);
    if (!c || !c.open) return;
    c.open = false; this.conns.delete(cid);
    for (const f of c._close) f("closed");
  }
  onMsg(m) {
    if (m.to && m.to !== this.id) return;
    if (m.k === "who" && m.id === this.id && this.onConn) this.post({ k: "here", to: m.from });
    else if (m.k === "here") { const w = this.waiters.get("who"); if (w) w(); }
    else if (m.k === "conn" && this.onConn) { const c = this.makeConn(m.from, m.cid); this.post({ k: "accept", to: m.from, cid: m.cid }); this.onConn(c); }
    else if (m.k === "accept") { const w = this.waiters.get(m.cid); if (w) w(); }
    else if (m.k === "data") { const c = this.conns.get(m.cid); if (c && c.open) for (const f of c._data) f(m.d); }
    else if (m.k === "close") this.dropConn(m.cid);
  }
  async listen(id, onConn) {
    this.id = id; this.chan();
    // 같은 번호 방이 이미 있는지 물어봐요
    const taken = await new Promise((res) => { this.waiters.set("who", () => res(true)); this.post({ k: "who", id }); setTimeout(() => res(false), 250); });
    this.waiters.delete("who");
    if (taken) throw { code: "taken" };
    this.onConn = onConn;
  }
  async connect(id) {
    this.id = this.id || "tab-" + Math.random().toString(36).slice(2, 8); this.chan();
    const cid = this.id + "-" + Date.now();
    await new Promise((res, rej) => {
      this.waiters.set(cid, res);
      this.post({ k: "conn", to: id, cid });
      setTimeout(() => rej(netError("no-room", id.replace(NET_ID_PREFIX, ""))), 1500);
    });
    this.waiters.delete(cid);
    return this.makeConn(id, cid);
  }
  destroy() { for (const cid of [...this.conns.keys()]) { const c = this.conns.get(cid); if (c) c.close(); } if (this.ch) this.ch.close(); this.ch = null; }
}

// ===== 세션: 방장/친구, 자리 번호, 핑, 메시지 =====
class NetSession {
  constructor(opts = {}) {
    this.opts = opts;
    this.transportName = opts.transport || "peer";
    this.role = null;          // "host" | "guest"
    this.code = null;          // 방 번호 "4719"
    this.slot = 0;             // 내 자리 (방장 1, 친구 2~4)
    this.peers = new Map();    // 방장: 자리 -> { conn, fast, info, lastSeen, rtt } / 친구: 1 -> 방장
    this.handlers = {};
    this.rtt = {};             // 자리 -> 최근 왕복 ms
    this.stats = { sent: 0, recv: 0, bytesSent: 0, bytesRecv: 0 };
    this.timer = null;
    this.info = opts.info || {};
  }
  on(name, fn) { (this.handlers[name] = this.handlers[name] || []).push(fn); return this; }
  off(name, fn) { const l = this.handlers[name]; if (l) this.handlers[name] = l.filter((f) => f !== fn); }
  emit(name, ...a) { for (const f of this.handlers[name] || []) { try { f(...a); } catch (e) { console.error(e); } } }
  get connected() { return this.role === "host" ? true : this.peers.size > 0; }
  get count() { return this.role === "host" ? 1 + this.peers.size : this.role === "guest" ? this.lastCount || 2 : 1; }

  makeTransport() {
    if (this.transportName === "loopback") return new NetLoopTransport();
    if (this.transportName === "broadcast") return new NetTabTransport();
    return new NetPeerTransport(this.opts);
  }

  // ----- 방 만들기 -----
  async host() {
    this.leave(true);
    for (let tries = 0; tries < 6; tries++) {
      const code = this.opts.fixedCode || String(1000 + Math.floor(Math.random() * 9000));
      const t = this.makeTransport();
      try {
        await t.listen(NET_ID_PREFIX + code, (conn) => this.acceptConn(conn));
        this.transport = t; this.role = "host"; this.code = code; this.slot = 1;
        this.startPing();
        this.emit("open", { role: "host", code, slot: 1 });
        return code;
      } catch (e) {
        t.destroy && t.destroy();
        if (e && e.code === "taken" && !this.opts.fixedCode) continue;
        const err = e && e.text ? e : netError(e && e.code === "taken" ? "busy" : "offline");
        this.emit("error", err); throw err;
      }
    }
    const err = netError("busy"); this.emit("error", err); throw err;
  }

  // 방장: 새 연결 받기 (첫 메시지 hi 를 기다렸다가 자리를 줘요)
  acceptConn(conn) {
    const remote = conn.remote;
    if (conn.kind === "fast") {
      // 빠른 길: 같은 친구의 보통 연결에 붙여요
      for (const p of this.peers.values()) if (p.remote === remote) { p.fast = conn; conn.onClose(() => { if (p.fast === conn) p.fast = null; }); }
      conn.onData((d) => { const p = [...this.peers.values()].find((x) => x.remote === remote); if (p) this.onData(p.slot, d); });
      return;
    }
    conn.onData((d) => {
      if (d && d._n === "hi" && !conn._slot) return this.onHello(conn, d);
      if (conn._slot) this.onData(conn._slot, d);
    });
    conn.onClose(() => { if (conn._slot) this.dropPeer(conn._slot, "closed"); });
  }
  onHello(conn, d) {
    if (d.ver !== NET_PROTOCOL) { conn.send({ _n: "reject", code: "version" }); setTimeout(() => conn.close(), 300); return; }
    if (1 + this.peers.size >= NET_MAX_PLAYERS) { conn.send({ _n: "reject", code: "full" }); setTimeout(() => conn.close(), 300); return; }
    let slot = 2;
    while (this.peers.has(slot)) slot++;
    conn._slot = slot;
    const p = { slot, conn, fast: null, remote: conn.remote, info: d.info || {}, lastSeen: Date.now(), rtt: null };
    this.peers.set(slot, p);
    conn.send({ _n: "slot", slot, count: 1 + this.peers.size, info: this.info });
    this.broadcastCount();
    this.emit("join", slot, p.info);
  }
  broadcastCount() {
    for (const p of this.peers.values()) p.conn.send({ _n: "count", count: 1 + this.peers.size });
  }
  dropPeer(slot, why) {
    const p = this.peers.get(slot);
    if (!p) return;
    this.peers.delete(slot);
    try { p.conn.close(); } catch (e) { /* 무시 */ }
    try { if (p.fast) p.fast.close(); } catch (e) { /* 무시 */ }
    delete this.rtt[slot];
    if (this.role === "host") this.broadcastCount();
    this.emit("leave", slot, why);
    if (this.role === "guest") { this.emit("error", netError("lost")); this.cleanup(); }
  }

  // ----- 방 들어가기 -----
  async join(code, opts = {}) {
    this.leave(true);
    code = String(code).replace(/\D/g, "").slice(0, 4);
    const t = this.makeTransport();
    this.transport = t;
    try {
      const conn = await t.connect(NET_ID_PREFIX + code, { timeout: opts.timeout });
      const slot = await new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(netError("timeout")), opts.timeout || NET_JOIN_TIMEOUT);
        conn.onData((d) => {
          if (!d || !d._n) return;
          if (d._n === "slot") { clearTimeout(to); this.hostInfo = d.info; this.lastCount = d.count; resolve(d.slot); }
          if (d._n === "reject") { clearTimeout(to); reject(netError(d.code)); }
        });
        conn.onClose(() => { clearTimeout(to); reject(netError("lost")); });
        conn.send({ _n: "hi", ver: NET_PROTOCOL, info: this.info });
      });
      this.role = "guest"; this.code = code; this.slot = slot;
      const p = { slot: 1, conn, fast: null, remote: conn.remote, info: this.hostInfo || {}, lastSeen: Date.now(), rtt: null };
      this.peers.set(1, p);
      conn.onData((d) => { if (!(d && (d._n === "slot" || d._n === "reject"))) this.onData(1, d); });
      conn.onClose(() => this.dropPeer(1, "closed"));
      // 빠른 길 (선택): 상태 스냅샷용
      if (this.opts.fast && t.connect && this.transportName === "peer") {
        t.connect(NET_ID_PREFIX + code, { kind: "fast", timeout: 8000 }).then((fc) => { p.fast = fc; fc.onData((d) => this.onData(1, d)); fc.onClose(() => { p.fast = null; }); }).catch(() => {});
      }
      this.startPing();
      this.emit("open", { role: "guest", code, slot });
      return slot;
    } catch (e) {
      const err = e && e.text ? e : netError("timeout");
      this.cleanup();
      this.emit("error", err);
      throw err;
    }
  }

  // ----- 받은 데이터 -----
  onData(slot, d) {
    const p = this.peers.get(slot);
    if (p) p.lastSeen = Date.now();
    this.stats.recv++;
    if (d && d._n) {
      if (d._n === "ping") { const c = p && (p.conn); if (c) c.send({ _n: "pong", t: d.t }); return; }
      if (d._n === "pong") { const ms = Date.now() - d.t; this.rtt[slot] = ms; if (p) p.rtt = ms; this.emit("rtt", slot, ms); return; }
      if (d._n === "count") { this.lastCount = d.count; this.emit("count", d.count); return; }
      if (d._n === "bye") { this.dropPeer(slot, "bye"); return; }
      return;
    }
    this.emit("message", d, slot);
  }

  // ----- 보내기 -----
  send(slot, msg) {
    const p = this.peers.get(slot);
    if (!p) return false;
    this.stats.sent++;
    p.conn.send(msg);
    return true;
  }
  sendFast(slot, msg) {
    const p = this.peers.get(slot);
    if (!p) return false;
    this.stats.sent++;
    (p.fast && p.fast.open ? p.fast : p.conn).send(msg);
    return true;
  }
  broadcast(msg, fast = false) { for (const slot of this.peers.keys()) (fast ? this.sendFast : this.send).call(this, slot, msg); }
  toHost(msg, fast = false) { return this.role === "guest" ? (fast ? this.sendFast(1, msg) : this.send(1, msg)) : false; }

  // ----- 핑 (2초마다) -----
  startPing() {
    this.stopPing();
    if (typeof setInterval === "function") this.timer = setInterval(() => this.tick(), NET_PING_EVERY);
  }
  stopPing() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  tick(now = Date.now()) {
    for (const p of [...this.peers.values()]) {
      if (now - p.lastSeen > NET_LOST_AFTER) { this.dropPeer(p.slot, "timeout"); continue; }
      p.conn.send({ _n: "ping", t: now });
    }
  }

  // ----- 나가기 -----
  leave(quiet = false) {
    if (!this.role && !this.transport) return;
    for (const p of this.peers.values()) { try { p.conn.send({ _n: "bye" }); } catch (e) { /* 무시 */ } }
    this.cleanup(quiet, true); // "잘 가" 가 먼저 닿게 연결은 조금 뒤에 닫아요
  }
  cleanup(quiet = false, soft = false) {
    this.stopPing();
    const ps = [...this.peers.values()];
    this.peers.clear();
    const closeAll = () => { for (const p of ps) { try { p.conn.close(); } catch (e) { /* 무시 */ } try { if (p.fast) p.fast.close(); } catch (e) { /* 무시 */ } } };
    if (soft) setTimeout(closeAll, 250); else closeAll();
    const t = this.transport; this.transport = null;
    if (t) setTimeout(() => t.destroy && t.destroy(), soft ? 500 : 200);
    const was = this.role;
    this.role = null; this.code = null; this.slot = 0; this.rtt = {};
    if (was && !quiet) this.emit("close", was);
  }

  // ----- 진단 (연결 시험 페이지) -----
  // 지금 쓰는 길의 ICE 후보 종류: host(같은 Wi-Fi 직접) / srflx(공유기 바깥 주소) / relay(중계)
  async iceInfo(slot) {
    const p = this.peers.get(slot || (this.role === "guest" ? 1 : [...this.peers.keys()][0]));
    const pc = p && p.conn && p.conn.pc;
    if (!pc || !pc.getStats) return null;
    const stats = await pc.getStats();
    const byId = {};
    stats.forEach((r) => { byId[r.id] = r; });
    let pair = null;
    stats.forEach((r) => {
      if (r.type === "transport" && r.selectedCandidatePairId) pair = byId[r.selectedCandidatePairId];
    });
    if (!pair) stats.forEach((r) => { if (r.type === "candidate-pair" && (r.nominated || r.selected) && r.state === "succeeded") pair = pair || r; });
    const locals = [], remotes = [];
    stats.forEach((r) => {
      if (r.type === "local-candidate") locals.push({ type: r.candidateType, addr: r.address || r.ip || "", proto: r.protocol });
      if (r.type === "remote-candidate") remotes.push({ type: r.candidateType, addr: r.address || r.ip || "", proto: r.protocol });
    });
    const L = pair && byId[pair.localCandidateId], R = pair && byId[pair.remoteCandidateId];
    const show = (c) => c && { type: c.candidateType, addr: c.address || c.ip || "", mdns: /\.local$/.test(c.address || c.ip || ""), proto: c.protocol };
    return { selected: pair ? { local: show(L), remote: show(R), rtt: pair.currentRoundTripTime } : null, locals, remotes };
  }
}

const Net = new NetSession();
