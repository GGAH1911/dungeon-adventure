// ===== 지갑: 화폐는 서버 장부가 진짜예요 (서버 server/wallet/core.js, 설계서 docs/design/wallet.md) =====
// - 계정 하나에 지갑 하나 (캐릭터가 다 같이 써요). 로그인 없이 "이어하기 코드" (32자)로 기기를 이어요.
// - 화면의 숫자 = 서버 잔액 + 오프라인 지갑 남은 것 + 아직 확인 안 된 것(보낼 줄에 있는 보상)
// - 던전에서 번 것: 판이 끝나면 서버에 청구 (서버가 상한으로 확인). 던전 밖 선물: 이유와 함께 청구 (하루 한 번은 서버가 판단)
// - 쓰기: 인터넷이 되면 서버 잔액에서, 안 되면 오프라인 지갑(서버가 미리 떼어 준 돈)에서. 오프라인 지갑 기록은 이 기기만 가진 열쇠로 서명해요
// - 인터넷이 끊겨도 아무것도 잃지 않아요: 보낼 줄(queue)은 저장돼 있다가 다시 연결되면 같은 번호(idem)로 보내요 (두 번 받지 않아요)
// 지갑이 없으면(시험·fetch 없음·아직 등록 전) 예전처럼 기기 안 숫자만 써요.

const WALLET = {
  url: "https://da-wallet.hwangi0404.workers.dev",
  key: "dungeon-adventure-wallet-v1",
  // 오프라인 지갑 증서를 확인하는 서버 공개키 (개인키는 서버 비밀에만)
  pub: { kty: "EC", crv: "P-256", x: "Qyfb5r_o2r722d3Jtbr83dyUCQUwYfOkkQGIs_tV2vQ", y: "0ri2SfMRgu-__dX1rC44z6HShNDk5_zungKgTnkvt2Q" },
  unconf: { emerald: 30, silver: 3, amethyst: 1, gold: 0, diamond: 0 }, // 서버 CFG.unconfCap 과 같게
  syncEvery: 15000,
  onlineFresh: 90000, // 마지막으로 서버와 이야기한 지 이 안이면 "인터넷 됨"
};
const W_CURS = ["emerald", "silver", "amethyst", "gold", "diamond"];
const wallet = { st: null, priv: null, online: false, lastOk: 0, busy: false, run: null, lack: "", timer: null, signing: Promise.resolve(), keyStore: null, fetch: null, pubOverride: null, flushing: null, ready: false };

const wZero = () => Object.fromEntries(W_CURS.map((c) => [c, 0]));
const wClean = (o) => { const z = wZero(); if (o) for (const c of W_CURS) { const v = Math.floor(Number(o[c])); z[c] = Number.isFinite(v) && v > 0 ? v : 0; } return z; };
function wRand(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map((x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join(""); }
function walletOn() { return !!(wallet.st && wallet.st.code && wallet.priv && wallet.ready); }
function walletLoad() { try { return JSON.parse(localStorage.getItem(WALLET.key)); } catch (e) { return null; } }
function walletSave() { try { if (wallet.st) localStorage.setItem(WALLET.key, JSON.stringify(wallet.st)); } catch (e) { /* 저장 못 해도 다음에 */ } }

// ----- 기기 열쇠: 꺼낼 수 없는 서명 열쇠 (IndexedDB 에 CryptoKey 그대로). 시험은 wallet.keyStore 로 바꿔요 -----
function walletIdb() {
  return {
    async get() { return new Promise((res) => { try { const r = indexedDB.open("dungeon-wallet", 1); r.onupgradeneeded = () => r.result.createObjectStore("k"); r.onsuccess = () => { const t = r.result.transaction("k").objectStore("k").get("dev"); t.onsuccess = () => res(t.result || null); t.onerror = () => res(null); }; r.onerror = () => res(null); } catch (e) { res(null); } }); },
    async put(v) { return new Promise((res) => { try { const r = indexedDB.open("dungeon-wallet", 1); r.onupgradeneeded = () => r.result.createObjectStore("k"); r.onsuccess = () => { const t = r.result.transaction("k", "readwrite"); t.objectStore("k").put(v, "dev"); t.oncomplete = () => res(true); t.onerror = () => res(false); }; r.onerror = () => res(false); } catch (e) { res(false); } }); },
  };
}
async function walletDeviceKey() {
  const ks = wallet.keyStore || (typeof indexedDB !== "undefined" ? walletIdb() : null);
  if (!ks) return null;
  let v = await ks.get();
  if (!v || !v.priv || !v.pub) {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]); // 개인키는 꺼낼 수 없어요
    v = { priv: kp.privateKey, pub: await crypto.subtle.exportKey("jwk", kp.publicKey) };
    if (!(await ks.put(v))) return null;
    return { ...v, fresh: true };
  }
  return v;
}

// ----- 서버와 이야기하기 -----
async function walletCall(path, body, opts = {}) {
  const f = wallet.fetch || (typeof fetch === "function" ? fetch : null);
  if (!f) throw new Error("offline");
  const headers = { "content-type": "application/json" };
  if (!opts.noKey && wallet.st && wallet.st.code) headers["x-wallet-key"] = wallet.st.code;
  let r;
  try {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const to = ctl ? setTimeout(() => ctl.abort(), 8000) : null;
    r = await f(WALLET.url + path, { method: "POST", headers, body: JSON.stringify(body || {}), signal: ctl ? ctl.signal : undefined, cache: "no-store" });
    if (to) clearTimeout(to);
  } catch (e) { wallet.online = false; throw new Error("offline"); }
  let j = {}; try { j = await r.json(); } catch (e) { /* 빈 응답 */ }
  if (r.status >= 500 || r.status === 429) { wallet.online = false; throw new Error("server"); }
  wallet.online = true; wallet.lastOk = Date.now();
  if (j && j.balances && wallet.st) wallet.st.bal = wClean(j.balances);
  return { status: r.status, ...j };
}
function walletOnline() { return wallet.online && Date.now() - wallet.lastOk < WALLET.onlineFresh; }

// ----- 숫자 계산 -----
function walletVoucherLeft() {
  const st = wallet.st, v = st && st.voucher, left = wZero();
  if (!v) return left;
  for (const c of W_CURS) left[c] = v.amounts[c] || 0;
  for (const e of st.log) for (const c of W_CURS) left[c] -= ((e.cost && e.cost[c]) || 0) - ((e.change && e.change[c]) || 0);
  return left;
}
function walletPending() {
  const st = wallet.st, inc = wZero(), out = wZero();
  for (const op of st.queue) {
    if (op.type === "grant") for (const c of W_CURS) inc[c] += op.amounts[c] || 0;
    else if (op.type === "claim") for (const c of W_CURS) inc[c] += op.summary.earned[c] || 0;
    else if (op.type === "spend") for (const c of W_CURS) { out[c] += op.cost[c] || 0; inc[c] += (op.change && op.change[c]) || 0; }
    else if (op.type === "exchange") { out[op.from] += op.pay; inc[op.to] += op.times; }
    else if (op.type === "piggy" && op.op === "in") out.emerald += op.n;
    else if (op.type === "piggy" && op.op === "out") inc.emerald += op.n || 0;
  }
  if (wallet.run) for (const c of W_CURS) inc[c] += wallet.run.earned[c] || 0;
  return { inc, out };
}
function walletTotal() {
  const st = wallet.st, t = wZero(); if (!st) return t;
  const left = walletVoucherLeft(), p = walletPending();
  for (const c of W_CURS) t[c] = Math.max(0, (st.bal[c] || 0) + left[c] + p.inc[c] - p.out[c]);
  return t;
}
// 화면 숫자를 지갑 숫자로 (모든 캐릭터가 같은 지갑)
function walletApply() {
  if (!walletOn() || !game.profile) return;
  const t = walletTotal(), pr = game.profile;
  pr.emeralds = t.emerald; pr.money = pr.money || {};
  for (const c of W_CURS) if (c !== "emerald") pr.money[c] = t[c];
}

// ----- 처음: 기기 열쇠 → (없으면) 계정 만들기 + 예전 화폐 한 번 가져오기 -----
function walletLocalSum() {
  // 이 기기의 모든 캐릭터 화폐를 더해요 (지갑으로 옮길 때 한 번만)
  const sum = wZero();
  const add = (pr) => { if (!pr) return; sum.emerald += Math.max(0, Math.floor(pr.emeralds) || 0); for (const c of W_CURS.slice(1)) sum[c] += Math.max(0, Math.floor((pr.money && pr.money[c]) || 0)); };
  try {
    const idx = JSON.parse(localStorage.getItem(typeof CHARS_KEY !== "undefined" ? CHARS_KEY : "dungeon-adventure-chars-v1"));
    if (idx && Array.isArray(idx.list) && idx.list.length && typeof charKey === "function") {
      for (const c of idx.list) { if (charKey(c.id) === SAVE_KEY) add(game.profile); else add(JSON.parse(localStorage.getItem(charKey(c.id)))); }
    } else add(game.profile);
  } catch (e) { add(game.profile); }
  return sum;
}
async function walletBoot() {
  if (wallet.booting) return wallet.booting;
  wallet.booting = (async () => {
    if (typeof crypto === "undefined" || !crypto.subtle || !(wallet.fetch || typeof fetch === "function")) return false;
    const dk = await walletDeviceKey(); if (!dk) return false;
    wallet.priv = dk.priv;
    const st = wallet.st = walletLoad() || {};
    st.v = 1; st.bal = wClean(st.bal); st.queue = Array.isArray(st.queue) ? st.queue : []; st.log = Array.isArray(st.log) ? st.log : [];
    // 열쇠를 새로 만들었으면(앱 데이터가 지워짐 등) 기기 번호도 새로: 서버에 등록된 옛 공개키와 섞이지 않게. 옛 오프라인 지갑은 7일 뒤 저절로 돌아와요
    if (dk.fresh || !st.device) { st.device = "d" + wRand(15); st.voucher = null; st.log = []; }
    st.pub = dk.pub; st.offSeq = st.offSeq || 0; st.web = !(typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (st.run) { walletEndRunState(st.run); st.run = null; } // 지난번에 꺼진 판: 지금 청구
    walletSave();
    if (!st.code) {
      try {
        const r = await walletCall("/register", { device: st.device, devicePub: dk.pub, import: walletLocalSum(), web: st.web }, { noKey: true });
        if (r.status !== 200 || !r.code) return false;
        st.code = r.code; st.bal = wClean(r.balances); walletSave();
      } catch (e) { return false; } // 인터넷이 없으면 다음에 (그동안은 예전처럼)
    }
    wallet.ready = true;
    walletApply();
    walletFlush();
    if (!wallet.timer && typeof setInterval === "function") wallet.timer = setInterval(() => { walletFlush(); }, WALLET.syncEvery);
    return true;
  })();
  const r = await wallet.booting; if (!r) wallet.booting = null;
  return r;
}

// ----- 보낼 줄 -----
// noApply: 게임이 곧 화면 숫자를 직접 바꿀 때 (pay·바꾸기: 그 뒤에 숫자가 같아져요)
function walletQueue(op, noApply) { op.idem = op.idem || (wallet.st.device + "-" + wRand(10)); wallet.st.queue.push(op); walletSave(); if (!noApply) walletApply(); walletFlush(); }
async function walletFlush() {
  if (!wallet.st || !wallet.st.code || !wallet.priv) return;
  if (wallet.flushing) return wallet.flushing;
  wallet.flushing = (async () => {
    const st = wallet.st;
    try {
      // 1) 오프라인 지갑 정산 (기록이 있거나 만료가 가까우면) + 새 증서
      await wallet.signing;
      if (st.voucher && (st.log.length || st.voucher.expires - Date.now() < 86400e3)) {
        const r = await walletCall("/escrow/settle", { device: st.device, voucher: st.voucher.id, log: st.log, reissue: true });
        if (r.status === 200 || (r.status === 409 && r.error === "replay")) { st.voucher = (await walletCheckVoucher(r.voucher)) ? r.voucher : null; st.log = []; st.prev = st.voucher ? st.voucher.id : null; }
        else if (r.status === 404) { st.voucher = null; st.log = []; }
        else if (r.status === 400) { st.badLog = (st.badLog || 0) + 1; st.voucher = null; st.log = []; } // 서버가 받지 않은 기록 (여기까지 오면 안 돼요)
        walletSave();
      }
      // 2) 보낼 줄 차례대로
      while (st.queue.length) {
        const op = st.queue[0];
        const r = await walletSend(op);
        if (r === "retry") break;
        st.queue.shift(); walletSave();
      }
      // 3) 오프라인 지갑이 없으면 받아 두기
      if (!st.voucher) {
        const r = await walletCall("/escrow/issue", { device: st.device });
        if (r.status === 200 && (await walletCheckVoucher(r.voucher))) { st.voucher = r.voucher; st.log = []; st.prev = r.voucher.id; }
        else if (r.status === 403) await walletCall("/device", { device: st.device, devicePub: st.pub, web: st.web });
      }
      if (st.queue.length === 0 && !st.log.length) await walletCall("/balance", {});
    } catch (e) { /* 인터넷이 없어요: 다음에 */ }
    walletSave(); walletApply();
  })();
  try { await wallet.flushing; } finally { wallet.flushing = null; }
}
async function walletSend(op) {
  let r;
  if (op.type === "grant") r = await walletCall("/grant", { idem: op.idem, reason: op.reason, key: op.key, amounts: op.amounts });
  else if (op.type === "claim") {
    if (!op.run) op.run = op.localRun;
    r = await walletCall("/run/claim", { run: op.run, summary: op.summary });
    if (r.status === 200 && r.clamped) wallet.st.clamped = (wallet.st.clamped || 0) + 1;
    // 상한에 걸린 몫은 서버가 버리지 않고 맡아 둬요 (3일 뒤 저절로). 그럴 때만 살짝 알려요
    if (r.status === 200 && r.held && !r.dup && typeof showMessage === "function") showMessage("보상 일부를 서버가 잠깐 맡아 뒀어요. 며칠 안에 저절로 돌아와요", 3.5, false, "#ffe27a");
  } else if (op.type === "spend") {
    r = await walletCall("/spend", { idem: op.idem, reason: op.reason, cost: op.cost, change: op.change });
    if (r.status === 409) { wallet.st.conflicts = (wallet.st.conflicts || 0) + 1; } // 다른 기기에서 먼저 써서 모자람 (물건은 이미 받았어요)
  } else if (op.type === "exchange") {
    r = await walletCall("/exchange", { idem: op.idem, i: op.i, times: op.times });
  } else if (op.type === "piggy") {
    r = await walletCall("/piggy", { idem: op.idem, op: op.op, n: op.n });
    if (r.status === 200 && typeof r.piggy === "number" && game.profile && game.profile.house) { game.profile.house.piggy = r.piggy; game.profile.house.piggyDay = typeof houseDayNum === "function" ? houseDayNum() : 0; }
  } else return "drop";
  return r.status >= 500 ? "retry" : "done"; // 400·403·404·409 는 다시 보내도 같아요: 버려요 (잔액은 서버 숫자로 맞춰져요)
}
async function walletCheckVoucher(v) {
  if (!v || !v.sig || !v.amounts) return false;
  try {
    const k = await crypto.subtle.importKey("jwk", wallet.pubOverride || WALLET.pub, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const text = `V1|${v.id}|${v.acct}|${v.device}|${JSON.stringify(W_CURS.map((c) => v.amounts[c] || 0))}|${v.issued}|${v.expires}`;
    const sig = Uint8Array.from(atob(v.sig), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, k, sig, new TextEncoder().encode(text));
  } catch (e) { return false; }
}

// ----- 오프라인 지갑 기록 (차례대로 서명: 앞 줄 지문으로 사슬) -----
async function wSha(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function walletLogSpend(reason, cost, change) {
  const st = wallet.st, e = { seq: st.log.length + 1, reason: String(reason).slice(0, 24), cost: wClean(cost), change: wClean(change), ts: Date.now() };
  st.log.push(e); walletSave();
  const vid = st.voucher.id;
  wallet.signing = wallet.signing.then(async () => {
    const prevE = st.log[e.seq - 2];
    e.prev = e.seq === 1 ? vid : prevE && prevE.hash;
    const text = `E1|${vid}|${e.seq}|${e.prev}|${e.reason}|${JSON.stringify(W_CURS.map((c) => e.cost[c]))}|${JSON.stringify(W_CURS.map((c) => e.change[c]))}|${e.ts}`;
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, wallet.priv, new TextEncoder().encode(text));
    e.sig = btoa(String.fromCharCode(...new Uint8Array(sig)));
    e.hash = await wSha(text);
    walletSave();
  }).catch(() => {});
}
// 꺼졌다 켜졌을 때 서명 못 한 줄이 있으면 마저 (같은 열쇠라 괜찮아요)
function walletResign() {
  const st = wallet.st; if (!st || !st.voucher) return;
  const vid = st.voucher.id;
  for (const e of st.log) if (!e.sig) {
    wallet.signing = wallet.signing.then(async () => {
      const prevE = st.log[e.seq - 2]; e.prev = e.seq === 1 ? vid : prevE && prevE.hash;
      const text = `E1|${vid}|${e.seq}|${e.prev}|${e.reason}|${JSON.stringify(W_CURS.map((c) => e.cost[c]))}|${JSON.stringify(W_CURS.map((c) => e.change[c]))}|${e.ts}`;
      e.sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, wallet.priv, new TextEncoder().encode(text)))));
      e.hash = await wSha(text); walletSave();
    }).catch(() => {});
  }
}

// ----- 쓰기 (게임의 pay() 가 물어봐요): true 를 돌려주면 막아요 -----
function walletLackText() { return wallet.lack; }
hookOn("payGate", (plan, reason) => {
  if (!walletOn()) return false;
  wallet.lack = "";
  const cost = wClean(plan.take), change = wZero(); if (plan.change) change[plan.cur] = plan.change;
  const st = wallet.st, p = walletPending();
  // 1) 인터넷이 되면 서버 잔액에서 (보낼 줄에 있는 쓰기를 빼고)
  const free = wZero(); for (const c of W_CURS) free[c] = (st.bal[c] || 0) - p.out[c];
  const fits = (have) => W_CURS.every((c) => (cost[c] || 0) <= have[c]);
  if (walletOnline() && fits(free)) { walletQueue({ type: "spend", reason, cost, change }, true); return false; }
  // 2) 오프라인 지갑에서 (확인 안 된 보상은 조금만 더해요)
  const left = walletVoucherLeft(), room = wZero();
  for (const c of W_CURS) room[c] = left[c] + Math.min(WALLET.unconf[c], p.inc[c]);
  if (st.voucher && st.voucher.expires > Date.now() && fits(room)) { walletLogSpend(reason, cost, change); walletFlush(); return false; }
  // 3) 인터넷이 되는데 서버 숫자가 오래됐으면 일단 보내 보기
  if (walletOnline() && fits(walletTotal())) { walletQueue({ type: "spend", reason, cost, change }, true); return false; }
  wallet.lack = walletOnline() ? "지금은 쓸 수 있는 화폐가 모자라요" : "인터넷에 연결하면 더 쓸 수 있어요";
  if (typeof showMessage === "function") showMessage(wallet.lack, 2.2, false, "#ffd27a");
  walletFlush();
  return true;
}, 50);
// 바꾸기: 서버에서만 (인터넷이 필요해요)
hookOn("exchangeGate", (why, i, times) => {
  if (why || !walletOn()) return why;
  if (!walletOnline()) return "바꾸기는 인터넷에 연결하면 할 수 있어요";
  const x = CUR_EXCHANGE[i];
  walletQueue({ type: "exchange", i, times, from: x.from, to: x.to, pay: x.n * times }, true);
  return null;
}, 50);
// 저금통 (house.js): 서버가 맡아요
function walletPiggy(op, n) {
  const h = houseData(), pr = game.profile;
  if (!walletOnline()) { house.note = "저금통은 인터넷에 연결하면 쓸 수 있어요"; house.noteC = "#ffd27a"; walletFlush(); return 0; }
  if (op === "in") {
    n = Math.max(0, Math.min(Math.floor(n), pr.emeralds, 200 - (h.piggy || 0)));
    if (!n) { house.note = (h.piggy || 0) >= 200 ? "저금통이 꽉 찼어요 (200개)" : "넣을 에메랄드가 없어요"; house.noteC = "#ff9090"; return 0; }
    h.piggy = (h.piggy || 0) + n; walletQueue({ type: "piggy", op: "in", n });
    house.note = `${n}개 넣었어요!`; house.noteC = "#7dffb0"; if (typeof sfx !== "undefined") sfx.coin();
    return n;
  }
  const got = h.piggy || 0; if (!got) return 0;
  h.piggy = 0; walletQueue({ type: "piggy", op: "out", n: got });
  house.note = `${got}개 꺼냈어요!`; house.noteC = "#7dffb0"; if (typeof sfx !== "undefined") sfx.emerald();
  return got;
}

// ----- 벌기 -----
hookOn("curGained", (id, n, reason, key) => {
  if (!walletOn() || !(n > 0)) return;
  if (game.scene === "dungeon" && !reason && !wallet.run && game.mapDef) walletRunBegin(game.mapDef, game.mapLevel || 1); // 판 시작을 놓쳤어도 판 보상으로
  if (game.scene === "dungeon" && wallet.run && !reason) { wallet.run.earned[id] = (wallet.run.earned[id] || 0) + n; wallet.st.run = wallet.run; walletSave(); walletApply(); return; }
  const amounts = wZero(); amounts[id] = n;
  walletQueue({ type: "grant", reason: reason || "misc", key, amounts });
}, 50);
// 던전 한 판: 시작하면 서버 판 번호를 받고(안 되면 오프라인 번호), 끝나면(캠프로·새 판) 청구
function walletRunBegin(def, level) {
  if (!walletOn()) return;
  walletRunEnd();
  const st = wallet.st;
  const run = wallet.run = { map: def && def.id, level: Math.floor(level) || 1, started: Date.now(), earned: wZero(), boss: false, floors: 0, id: null, localRun: `off-${st.device}-${++st.offSeq}` };
  st.run = run; walletSave();
  if (walletOnline() || !wallet.lastOk) walletCall("/run/start", { map: run.map, level: run.level, players: 1 }).then((r) => { if (r.status === 200 && r.run) { run.id = r.run; walletSave(); } }).catch(() => {});
}
function walletEndRunState(run) {
  if (!run || !Object.values(run.earned || {}).some((v) => v > 0)) return;
  const summary = { map: run.map, level: run.level, duration: Math.round((Date.now() - run.started) / 1000), boss: !!run.boss, earned: wClean(run.earned), started: run.started, players: 1, ...(run.floors ? { floors: run.floors } : {}) };
  wallet.st.queue.push({ type: "claim", idem: "c-" + (run.id || run.localRun), run: run.id, localRun: run.localRun, summary });
}
function walletRunEnd() {
  if (!wallet.run || !wallet.st) return;
  walletEndRunState(wallet.run); wallet.run = null; wallet.st.run = null; walletSave(); walletApply(); walletFlush();
}
hookOn("dungeonStarted", (def, level) => walletRunBegin(def, level), 90);
// 탑: 올라간 층 수를 판에 적어요 (서버 상한이 층 수로 커져요)
hookOn("towerFloorBuilt", (f) => { if (wallet.run && Number.isFinite(f)) { wallet.run.floors = Math.max(wallet.run.floors || 0, Math.floor(f)); } }, 90);
// 캠프로 돌아오면 청구 (enterLobby 는 장면을 바꾸기 전에 reset 을 불러서, 캠프 화면에서 봐요)
function walletLobbyCheck() { if (wallet.run && game.scene === "lobby") walletRunEnd(); }
hookOn("playersUpdated", walletLobbyCheck, 90);
hookOn("recApplied", (kind) => { if (wallet.run && /boss|crown/i.test(String(kind))) wallet.run.boss = true; }, 50);
hookOn("profileLoaded", () => { if (walletOn()) walletApply(); }, 95);

// ----- 메뉴: 이어하기 코드 -----
const wFmt = (c) => String(c || "").replace(/(.{4})(?=.)/g, "$1-");
function walletCopy(s) { try { if (navigator.clipboard) navigator.clipboard.writeText(s); } catch (e) { /* 복사 못 해도 화면에 보여요 */ } }
async function walletUseCode(code) {
  code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 32) return "코드는 32글자예요";
  const st = wallet.st, old = { code: st.code, bal: st.bal };
  await walletFlush(); // 지금 지갑 일을 먼저 끝내요
  if (st.queue.length || st.log.length) return "아직 보낼 것이 남았어요. 인터넷을 확인하고 다시 해요";
  st.code = code; st.voucher = null; st.log = [];
  try {
    const r = await walletCall("/device", { device: st.device, devicePub: st.pub, web: st.web });
    if (r.status !== 200) { st.code = old.code; st.bal = old.bal; walletSave(); return "코드를 찾을 수 없어요"; }
  } catch (e) { st.code = old.code; st.bal = old.bal; walletSave(); return "인터넷에 연결해 주세요"; }
  walletSave(); walletApply(); walletFlush();
  return null;
}
hookOn("menuItems", (items) => {
  if (!walletOn() || game.scene !== "lobby") return;
  items.push({ label: "지갑 이어하기 코드 보기", act: () => { const c = wFmt(wallet.st.code); walletCopy(wallet.st.code); window.prompt("이어하기 코드 (복사했어요. 아빠 폰에 꼭 적어 두세요!)", c); } });
  items.push({ label: "다른 기기 지갑 이어하기 (코드 넣기)", act: async () => {
    const s = window.prompt("이어하기 코드(32글자) 또는 기기 이전 코드(8글자)를 넣어 주세요", "");
    if (!s) return;
    let code = s.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length === 8) { try { const r = await walletCall("/transfer/redeem", { transfer: code }, { noKey: true }); if (r.status !== 200) { showMessage("기기 이전 코드가 틀렸거나 지났어요", 2.4); return; } code = r.code; } catch (e) { showMessage("인터넷에 연결해 주세요", 2); return; } }
    const why = await walletUseCode(code);
    showMessage(why || "지갑을 이었어요!", 2.4, !why);
  } });
  items.push({ label: "기기 이전 코드 만들기 (15분)", act: async () => {
    try { const r = await walletCall("/transfer", {}); if (r.status === 200) { walletCopy(r.transfer); window.prompt("새 기기에서 15분 안에 넣어 주세요 (한 번만 돼요)", wFmt(r.transfer)); } } catch (e) { showMessage("인터넷에 연결해 주세요", 2); }
  } });
}, 70);

// ----- 작은 동기화 표시 (왼쪽 아래): 다 보냄 초록 점, 보낼 것 있음 노랑, 인터넷 없음 회색 -----
hookOn("hudDraw", () => {
  walletLobbyCheck();
  if (!walletOn() || game.overlay) return;
  const st = wallet.st, wait = st.queue.length + st.log.length + (wallet.run ? 1 : 0);
  const on = walletOnline(), c = !on ? "#9a9aa8" : wait ? "#ffd27a" : "#7dffb0";
  const x = 10, y = view.h - 10;
  ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (!on) text("오프라인", x + 8, y + 4, 11, c);
}, 80);

// 켜질 때·인터넷이 돌아올 때
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("load", () => { setTimeout(() => walletBoot().then(() => walletResign()), 300); });
  window.addEventListener("online", () => { if (wallet.st && wallet.st.code) walletFlush(); else walletBoot(); });
  if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && wallet.run) { wallet.st.run = wallet.run; walletSave(); } });
}
