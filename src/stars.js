// ===== 반짝별 가게 (진짜 돈으로 사는 꾸미기) =====
// 설계서: docs/design/monetization.md · 서버: server/wallet/stars.js
// 아이 규칙:
//   - 반짝별로는 꾸미기만 사요. 공격·방어·빠르기·떨어지는 물건은 하나도 안 바뀌어요 (시험 210)
//   - 랜덤 상자 없음, 시간 제한 할인 없음, 조르는 글 없음
//   - 결제는 안드로이드 앱에서만, 어른 확인 문제를 푼 뒤에만. 30일 한도(기본 11,000원)는 서버가 지켜요
//   - 반짝별은 인터넷이 될 때만 써요 (서버 장부가 진짜). 입어 보기는 언제나 돼요
//   - 산 반짝별(paid)과 받은 반짝별(free)은 따로 세고, 받은 것부터 써요

// 서버 STAR_ITEMS 와 같은 값이어야 해요 (시험 210 이 비교해요)
const STAR_SHOP = [
  { id: "glow_fire", kind: "glow", name: "불꽃 빛깔", short: "불꽃", price: 60, color: "#ff7a2a", hue: 22 },
  { id: "glow_frost", kind: "glow", name: "서리 빛깔", short: "서리", price: 60, color: "#8fe0ff", hue: 195 },
  { id: "glow_leaf", kind: "glow", name: "새싹 빛깔", short: "새싹", price: 60, color: "#6be36b", hue: 115 },
  { id: "glow_star", kind: "glow", name: "별빛 빛깔", short: "별빛", price: 60, color: "#ffe27a", hue: 50 },
  { id: "glow_candy", kind: "glow", name: "사탕 빛깔", short: "사탕", price: 60, color: "#ff8ad8", hue: 320 },
  { id: "glow_rainbow", kind: "glow", name: "무지개 빛깔", short: "무지개", price: 60, color: "#ffffff", rainbow: true },
  { id: "fw_gold", kind: "fw", name: "황금 승리 폭죽", short: "황금", price: 60, colors: ["#ffd84a", "#fff3b0", "#ffb000"] },
  { id: "fw_heart", kind: "fw", name: "하트 승리 폭죽", short: "하트", price: 60, colors: ["#ff6b9a", "#ffc0d6", "#ff2d6f"] },
  { id: "fw_ocean", kind: "fw", name: "바다 승리 폭죽", short: "바다", price: 60, colors: ["#4fc3ff", "#b8ecff", "#2a7fff"] },
  { id: "fw_rainbow", kind: "fw", name: "무지개 승리 폭죽", short: "무지개", price: 60, colors: ["#ff5a5a", "#ffd84a", "#6be36b", "#4fc3ff", "#b07aff"] },
  // 처음 모험 꾸러미에만 들어 있어요 (반짝별로는 못 사요)
  { id: "cape_first", kind: "cape", name: "첫 모험 망토", short: "망토", price: 0, pack: true, color: "#2f5fd0", trim: "#ffd84a" },
  { id: "flag_adventurer", kind: "flag", name: "모험가 깃발 (집 가구)", short: "깃발", price: 0, pack: true },
];
const STAR_PACK_LIST = [
  { sku: "starter_pack", name: "처음 모험 꾸러미", krw: 3300, stars: 300, once: true, note: "반짝별 300 + 첫 모험 망토 + 모험가 깃발 (한 번만)" },
  { sku: "star_60", name: "반짝별 60", krw: 1100, stars: 60 },
  { sku: "star_330", name: "반짝별 330", krw: 5500, stars: 330, note: "10% 더" },
  { sku: "star_720", name: "반짝별 720", krw: 11000, stars: 720, note: "20% 더" },
];
const STAR_LIMIT_CHOICES = [0, 5500, 11000, 33000];
const STAR_PRICE_KRW = 15.3; // 가장 큰 묶음 기준 반짝별 1개 값 (값 옆 "약 ○원")
const STAR_LEGAL = [
  "반짝별은 꾸미기에만 써요. 강해지는 물건은 팔지 않아요. 랜덤 상자는 없어요.",
  "산 반짝별은 산 날부터 7일 안에 쓰지 않은 만큼 청약철회(환불)할 수 있어요. 이미 쓴 반짝별과 꾸러미의 꾸미기는 철회가 제한돼요. 사기 전에 '입어 보기'로 미리 볼 수 있어요.",
  "만 19세 미만은 부모님 동의를 받고 사요. 동의 없이 산 것은 취소할 수 있어요.",
  "판매자: 티엠이 (대표 황인성)",
];

const stars = {
  paid: 0, free: 0, owned: [], limit: 11000, spent30: 0, orders: [], buy: "off", known: false,
  busy: false, msg: "", msgT: 0, preview: null, gate: null, tab: "shop", testPay: null, payQ: Promise.resolve(),
};
const starItem = (id) => STAR_SHOP.find((s) => s.id === id) || null;
function starsOwns(id) { return stars.owned.includes(id); }
function starsTotal() { return stars.paid + stars.free; }
function starsKrwText(n) { return `약 ${Math.round(n * STAR_PRICE_KRW / 10) * 10}원`; }

// 입은 꾸미기 (내 기기 저장: 무엇을 입을지만. 가졌는지는 서버가 알아요)
hookOn("profileLoaded", (pr) => {
  if (!pr) return;
  if (!pr.starWear || typeof pr.starWear !== "object") pr.starWear = { glow: null, fw: null, cape: false };
  if (!Array.isArray(pr.starOwned)) pr.starOwned = []; // 마지막으로 서버에서 본 가진 것 (인터넷 없을 때 그대로 입게)
}, 40);
function starsWear() { const pr = game.profile; return (pr && pr.starWear) || { glow: null, fw: null, cape: false }; }
// 지금 보이는 꾸미기: 입어 보기가 먼저, 아니면 입은 것 (가진 것만)
function starsActive(kind) {
  const pv = stars.preview && starItem(stars.preview);
  if (pv && pv.kind === kind) return pv;
  const w = starsWear(), pr = game.profile, own = (id) => starsOwns(id) || (pr && pr.starOwned && pr.starOwned.includes(id));
  if (kind === "glow" && w.glow && own(w.glow)) return starItem(w.glow);
  if (kind === "fw" && w.fw && own(w.fw)) return starItem(w.fw);
  if (kind === "cape" && w.cape && own("cape_first")) return starItem("cape_first");
  return null;
}
// 꾸미기는 내 주인공에게만 (같이 하기 친구 화면에는 아직 안 보여요)
function starsMine(p) { return p && (p === game.player || (!p.remote && (p.pid || 1) === 1)); }

// ----- 서버 -----
function starsApply(r) {
  if (!r || typeof r.paid !== "number") return;
  stars.paid = r.paid; stars.free = r.free; stars.owned = Array.isArray(r.owned) ? r.owned : [];
  stars.limit = r.limit; stars.spent30 = r.spent30 || 0; stars.orders = r.orders || []; stars.buy = r.buy || "off"; stars.known = true;
  const pr = game.profile;
  if (pr) {
    pr.starOwned = stars.owned.filter((id) => starItem(id));
    if (stars.owned.includes("flag_adventurer") && typeof houseGiveFurn === "function" && typeof houseOwns === "function" && !houseOwns("flag_adventurer")) houseGiveFurn("flag_adventurer");
  }
}
async function starsCall(path, body, headers) {
  if (typeof walletCall !== "function" || !wallet.st || !wallet.st.code) throw new Error("offline");
  return walletCall(path, body, headers ? { headers } : {});
}
async function starsRefresh() {
  try { const r = await starsCall("/stars", {}); if (r.status === 200) starsApply(r); return true; } catch (e) { return false; }
}
function starsSay(m, t = 3) { stars.msg = m; stars.msgT = t; }
// 무료 반짝별 (보스 첫 처치·월드 끝·출석 7개): 서버가 한 번만 줘요. 인터넷이 없으면 다음에 다시 (기기에 기억)
function starsFree(reason, key) {
  const pr = game.profile; if (!pr) return;
  pr.starFreeQ = Array.isArray(pr.starFreeQ) ? pr.starFreeQ : [];
  const k = reason + ":" + (key || "");
  if (!pr.starFreeQ.includes(k)) pr.starFreeQ.push(k);
  starsFlushFree();
}
async function starsFlushFree() {
  const pr = game.profile; if (!pr || !Array.isArray(pr.starFreeQ) || !pr.starFreeQ.length || stars.flushing) return;
  stars.flushing = true;
  let again = false;
  try {
    for (const k of pr.starFreeQ.slice()) {
      const [reason, key] = k.split(":");
      const r = await starsCall("/stars/free", { reason, key: key || undefined });
      if (r.status !== 200 && r.status !== 400) break;
      again = true;
      pr.starFreeQ = pr.starFreeQ.filter((x) => x !== k);
      if (r.status === 200) { starsApply(r); if (r.got > 0 && game.scene === "lobby") showMessage(`반짝별 ${r.got}개를 받았어요!`, 2.5); }
    }
  } catch (e) { again = false; /* 인터넷이 없으면 다음에 */ }
  stars.flushing = false;
  if (again && pr.starFreeQ.length) return starsFlushFree(); // 도는 동안 새로 생긴 것
}
// 보스 첫 처치 (함께 쌓는 기록: 방장·친구 모두 자기 기기에서 한 번)
hookOn("recApplied", (kind, d) => { if (kind === "bossWin" && d && typeof d.map === "string") starsFree("boss", d.map.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40)); }, 60);
// 월드 마지막 이야기 (선물 가구를 주는 퀘스트)
hookOn("questDone", (q) => {
  const furn = q && q.reward && q.reward.furn, f = furn && typeof HOUSE_FURN !== "undefined" ? HOUSE_FURN[furn] : null;
  if (f && f.quest) starsFree("world", "w" + f.quest);
}, 60);

// ----- 결제 (안드로이드 앱만) -----
function starsPlugin() { return typeof appIsNative === "function" && appIsNative() && typeof appPlugin === "function" ? appPlugin("NativePurchases") : null; }
// 플러그인은 호출마다 결제 연결을 새로 열어서 겹치면 서로 닫아요: 한 줄로 세워요
function starsSerial(fn) { const run = stars.payQ.then(fn, fn); stars.payQ = run.catch(() => {}); return run; }
async function starsTestPay() {
  if (stars.testPay !== null) return stars.testPay;
  stars.testPay = "";
  try { const r = await fetch("test-pay.json", { cache: "no-store" }); if (r.ok) { const j = await r.json(); stars.testPay = typeof j.k === "string" ? j.k : ""; } } catch (e) { /* 웹판·정식 앱엔 없어요 */ }
  return stars.testPay;
}
function starsPending() { const pr = game.profile; if (!pr.starPay || typeof pr.starPay !== "object") pr.starPay = {}; return pr.starPay; }
// 결제 토큰을 서버에 적립 → 소모성은 소비, 꾸러미는 확인
async function starsSettle(token, sku, orderId) {
  const P = starsPlugin(), tp = await starsTestPay();
  const r = await starsCall("/stars/buy", { sku, token, orderId }, tp ? { "x-test-pay": tp } : null);
  if (r.status === 200) {
    starsApply(r);
    const pack = STAR_PACK_LIST.find((x) => x.sku === sku);
    try {
      if (P && pack && !pack.once) await starsSerial(() => P.consumePurchase({ purchaseToken: token }));
      else if (P) await starsSerial(() => P.acknowledgePurchase({ purchaseToken: token }));
    } catch (e) { /* 다음에 켤 때 다시 (서버는 already 로 답해요) */ }
    delete starsPending()[token]; saveProfile();
    return r.first ? "ok" : "already";
  }
  if (r.status === 202) return "pending";
  delete starsPending()[token]; saveProfile();
  return r.error || "fail";
}
async function starsBuyPack(sku) {
  const P = starsPlugin();
  if (!P) { starsSay("반짝별은 안드로이드 앱에서 살 수 있어요"); return; }
  if (stars.busy) return;
  stars.busy = true;
  try {
    const b = await starsCall("/stars/begin", { sku });
    if (b.status !== 200) { starsSay(b.msg || "지금은 살 수 없어요"); return; }
    const t = await starsSerial(() => P.purchaseProduct({ productIdentifier: sku, productType: "inapp", isConsumable: false, autoAcknowledgePurchases: false, appAccountToken: b.acctToken }));
    const token = t && (t.purchaseToken || t.transactionId);
    if (!token) { starsSay("결제가 끝나지 않았어요"); return; }
    if (String(t.purchaseState ?? "1") !== "1") { starsPending()[token] = { sku, at: Date.now() }; saveProfile(); starsSay("결제를 기다리는 중이에요. 끝나면 반짝별이 들어와요"); return; }
    starsPending()[token] = { sku, at: Date.now(), order: t.orderId || null }; saveProfile();
    const res = await starsSettle(token, sku, t.orderId || null);
    starsSay(res === "ok" || res === "already" ? "반짝별이 들어왔어요!" : res === "pending" ? "결제를 확인하는 중이에요" : "결제를 확인하지 못했어요 (" + res + ")");
  } catch (e) {
    const code = String((e && (e.code || e.message)) || "");
    starsSay(/cancel/i.test(code) ? "결제를 그만뒀어요" : /offline|server/.test(code) ? "인터넷이 연결되면 다시 해 주세요" : "결제가 안 됐어요");
  } finally { stars.busy = false; }
}
// 켤 때·가게를 열 때: 끝나지 않은 결제 마무리 (구글 목록 + 기기에 적어 둔 것)
async function starsReconcile() {
  const P = starsPlugin(); if (!P || stars.busy) return;
  stars.busy = true;
  try {
    const list = ((await starsSerial(() => P.getPurchases({ productType: "inapp" }))) || {}).purchases || [];
    for (const t of list) {
      const sku = t.productIdentifier, token = t.purchaseToken;
      if (!token || !STAR_PACK_LIST.some((x) => x.sku === sku) || String(t.purchaseState ?? "1") !== "1") continue;
      if (sku === "starter_pack" && t.isAcknowledged) continue;
      await starsSettle(token, sku, t.orderId || null);
    }
  } catch (e) { /* 다음에 */ }
  stars.busy = false;
}

// 반짝별 쓰기 (꾸미기 사기)
async function starsSpend(id) {
  const it = starItem(id); if (!it || it.pack || stars.busy) return;
  stars.busy = true;
  try {
    const r = await starsCall("/stars/spend", { item: id, expect: it.price });
    if (r.status === 200) { starsApply(r); const w = starsWear(); if (it.kind === "glow") w.glow = id; if (it.kind === "fw") w.fw = id; stars.preview = null; saveProfile(); starsSay(`${it.name}! 입었어요`); }
    else starsSay(r.error === "insufficient" ? "반짝별이 모자라요" : r.msg || "지금은 살 수 없어요");
  } catch (e) { starsSay("인터넷이 연결되면 살 수 있어요"); }
  stars.busy = false;
}
function starsToggleWear(id) {
  const it = starItem(id), w = starsWear(); if (!it) return;
  if (it.kind === "glow") w.glow = w.glow === id ? null : id;
  else if (it.kind === "fw") w.fw = w.fw === id ? null : id;
  else if (it.kind === "cape") w.cape = !w.cape;
  saveProfile();
}

// 어른 확인 (곱셈 문제): 결제와 한도 바꾸기 전에
function starsGate(then, label) {
  const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4), ans = a * b;
  const opts = [ans, ans + a, ans - b, ans + 1].sort(() => Math.random() - 0.5);
  stars.gate = { q: `${a} × ${b} = ?`, ans, opts, then, label };
}

// ----- 꾸미기 효과 (힘은 그대로: 그림만) -----
// 무기 빛깔: 휘두른 자리(anim.js drawTrail)와 화살 꼬리(bow.js)
function starsGlowColor(p, alpha, i) {
  if (!starsMine(p)) return null;
  const g = starsActive("glow"); if (!g) return null;
  if (g.rainbow) return rainbow(game.time * 300 + (i || 0) * 25, 60, alpha);
  const c = g.color, n = parseInt(c.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
function starsArrowGlow(s) {
  if (!s || s.type !== "normal" || !starsMine(s.owner) || Math.random() > 0.5) return;
  const g = starsActive("glow"); if (!g) return;
  addSparkle(s.x, s.y, 0.6, g.rainbow ? { life: 0.3, size: 0.5, hue: game.time * 400 } : { life: 0.3, size: 0.5, hue: g.hue });
}
// 승리 폭죽: 보스를 쓰러뜨린 순간 내 화면에 색 폭죽
hookOn("recApplied", (kind) => {
  if (kind !== "bossWin") return;
  const fw = starsActive("fw"), p = game.player; if (!fw || !p) return;
  for (let k = 0; k < 5; k++) spawnBurst(p.x + Math.cos(k * 1.26) * 1.6, p.y + Math.sin(k * 1.26) * 1.6, fw.colors, 16);
  if (typeof addRing === "function") addRing(p.x, p.y, { speed: 6, life: 0.6, gold: true });
}, 70);
// 입어 보기: 가게를 닫아도 20초 동안 그대로 (칼을 휘두르거나 활을 쏴 보세요). 폭죽은 바로 한 번 터뜨려 봐요
function starsTry(id) {
  if (stars.preview === id) { stars.preview = null; return; }
  stars.preview = id; stars.previewT = 20;
  const it = starItem(id), p = game.player;
  if (it && it.kind === "fw" && p) for (let k = 0; k < 5; k++) spawnBurst(p.x + Math.cos(k * 1.26) * 1.6, p.y + Math.sin(k * 1.26) * 1.6, it.colors, 16);
}
hookOn("timeScale", (dt) => { if (stars.preview && game.overlay !== "stars" && (stars.previewT -= dt) <= 0) stars.preview = null; return dt; }, 90);
// 망토: 등 뒤 (rig.js 의 back "cape")
function starsBack(p) {
  if (!starsMine(p)) return [];
  const c = starsActive("cape"); return c ? [{ kind: "cape", color: c.color, trim: c.trim }] : [];
}

// ----- 화면 -----
function openStars(tab = "shop") {
  game.overlay = "stars"; stars.tab = tab; stars.preview = null; stars.gate = null; stars.msg = "";
  starsRefresh(); starsFlushFree(); starsReconcile();
}
hookOn("menuItems", (items) => { if (game.scene === "lobby") items.push({ label: "반짝별 가게", short: "반짝별", act: () => { closeOverlay(); openStars(); } }); }, 7);
hookOn("overlayUpdate", (name, dt) => {
  if (name !== "stars") return false;
  if (stars.msgT > 0) stars.msgT -= dt || 1 / 60;
  if (wasPressed("Escape")) { if (stars.gate) stars.gate = null; else closeOverlay(); }
  return true;
});
hookOn("overlayDraw", (name) => { if (name !== "stars") return false; drawStars(); return true; });

function drawStars() {
  const W = view.w, H = view.h, pw = Math.min(1000, W - 16), ph = Math.min(640, H - 16), x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("반짝별 가게", x0 + 20, y0 + 38, 24, "#ffe27a");
  drawButton(x0 + pw - 56, y0 + 10, 42, 38, "✕", () => closeOverlay(), { size: 20 });
  const bal = stars.known ? `반짝별 ${starsTotal()}개 (산 것 ${stars.paid} · 받은 것 ${stars.free})` : "반짝별 확인 중... (인터넷이 필요해요)";
  text(bal, x0 + 190, y0 + 36, 15, "#fff");
  const tabs = [["shop", "꾸미기"], ["buy", "반짝별 사기"], ["log", "산 기록·한도"]];
  tabs.forEach(([id, label], i) => drawButton(x0 + 20 + i * 132, y0 + 54, 124, 34, label, () => { stars.tab = id; stars.gate = null; }, { size: 15, selected: stars.tab === id }));
  const top = y0 + 100, bodyH = ph - 112;
  if (stars.tab === "shop") drawStarsShop(x0 + 20, top, pw - 40, bodyH);
  else if (stars.tab === "buy") drawStarsBuy(x0 + 20, top, pw - 40, bodyH);
  else drawStarsLog(x0 + 20, top, pw - 40, bodyH);
  if (stars.msgT > 0 && stars.msg) { roundRectPath(x0 + pw / 2 - 220, y0 + ph - 50, 440, 36, 10); ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fill(); text(stars.msg, x0 + pw / 2, y0 + ph - 26, 15, "#fff", "center"); }
  if (stars.gate) drawStarsGate();
}
function drawStarsShop(x, y, w, h) {
  const cols = w > 700 ? 4 : 3, gap = 10, cw = (w - gap * (cols - 1)) / cols, chH = Math.min(118, (h - 40) / Math.ceil(STAR_SHOP.length / cols) - gap);
  text("꾸미기는 힘이 안 바뀌어요. '입어 보기'를 누르고 창을 닫으면 20초 동안 입어 볼 수 있어요.", x, y + 12, 13, "#aaa");
  STAR_SHOP.forEach((it, i) => {
    const cx = x + (i % cols) * (cw + gap), cy = y + 26 + Math.floor(i / cols) * (chH + gap);
    const own = starsOwns(it.id), w0 = starsWear();
    const worn = (it.kind === "glow" && w0.glow === it.id) || (it.kind === "fw" && w0.fw === it.id) || (it.kind === "cape" && w0.cape);
    roundRectPath(cx, cy, cw, chH, 10); ctx.fillStyle = stars.preview === it.id ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.06)"; ctx.fill();
    // 색 견본
    const sw = it.kind === "glow" ? (it.rainbow ? [rainbow(game.time * 200, 60, 1)] : [it.color]) : it.colors || [it.color || "#c08a3a"];
    sw.forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + 22 + k * 10, cy + 24, 9, 0, Math.PI * 2); ctx.fill(); });
    text(it.name, cx + 22 + sw.length * 10 + 8, cy + 29, 14, "#fff");
    text(own ? (worn ? "입고 있어요" : "가졌어요") : it.pack ? "꾸러미 전용" : `★ ${it.price} (${starsKrwText(it.price)})`, cx + 12, cy + 54, 13, own ? "#9be35a" : "#ffe27a");
    const bw = (cw - 30) / 2, by = cy + chH - 42;
    if (it.kind !== "flag") drawButton(cx + 10, by, bw, 34, stars.preview === it.id ? "그만 보기" : "입어 보기", () => starsTry(it.id), { size: 13 });
    if (own && it.kind !== "flag") drawButton(cx + 20 + bw, by, bw, 34, worn ? "벗기" : "입기", () => starsToggleWear(it.id), { size: 13 });
    else if (it.kind === "flag") text(own ? "집 거실에 있어요" : "꾸러미에 들어 있어요", cx + 12, by + 22, 13, "#aaa");
    else if (!it.pack) drawButton(cx + 20 + bw, by, bw, 34, "반짝별로 사기", () => starsSpend(it.id), { size: 13, color: "rgba(80,200,120,0.35)" });
  });
}
function drawStarsBuy(x, y, w, h) {
  let ly = y + 12;
  for (const l of STAR_LEGAL) for (const s of wrapLines(l, w, 13)) { text(s, x, ly, 13, "#ddd"); ly += 18; }
  ly += 6;
  const native = !!starsPlugin();
  if (!native) { text("반짝별은 안드로이드 앱(내부 테스트)에서만 살 수 있어요. 웹에서는 받은 반짝별로 꾸미기를 살 수 있어요.", x, ly + 8, 14, "#ffb070"); ly += 26; }
  else if (stars.buy === "off") { text("아직 결제를 받지 않아요 (준비 중)", x, ly + 8, 14, "#ffb070"); ly += 26; }
  else if (stars.buy === "test") { text("시험 결제 중: 라이선스 테스터 계정은 돈이 나가지 않아요", x, ly + 8, 13, "#8fe0ff"); ly += 24; }
  const bh = Math.min(64, (y + h - ly - 30) / STAR_PACK_LIST.length - 8);
  STAR_PACK_LIST.forEach((pk, i) => {
    const by = ly + i * (bh + 8), bought = pk.once && stars.owned.includes("pack:" + pk.sku);
    roundRectPath(x, by, w, bh, 10); ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fill();
    text(pk.name, x + 14, by + bh / 2 - 2, 16, "#ffe27a");
    if (pk.note) text(pk.note, x + 14, by + bh / 2 + 16, 12, "#aaa");
    const can = native && stars.buy !== "off" && !bought && !stars.busy;
    drawButton(x + w - 170, by + (bh - 40) / 2, 156, 40, bought ? "샀어요" : `${pk.krw.toLocaleString()}원`, can ? () => starsGate(() => starsBuyPack(pk.sku), pk.name) : null, { size: 16, color: can ? "rgba(80,200,120,0.45)" : "rgba(255,255,255,0.05)", textColor: can ? "#fff" : "#888" });
  });
  text(`이번 30일 결제 ${stars.spent30.toLocaleString()}원 / 한도 ${stars.limit.toLocaleString()}원`, x, y + h - 6, 13, "#aaa");
}
function drawStarsLog(x, y, w, h) {
  text("30일 결제 한도 (부모님이 바꿔요)", x, y + 16, 15, "#fff");
  STAR_LIMIT_CHOICES.forEach((v, i) => drawButton(x + i * 124, y + 28, 116, 34, v ? `${v.toLocaleString()}원` : "결제 막기", () => starsGate(async () => { try { const r = await starsCall("/stars/limit", { limit: v }); if (r.status === 200) { starsApply(r); starsSay("한도를 바꿨어요"); } } catch (e) { starsSay("인터넷이 연결되면 바꿀 수 있어요"); } }, "한도 바꾸기"), { size: 14, selected: stars.limit === v }));
  text("산 기록 (최근 20건)", x, y + 92, 15, "#fff");
  if (!stars.orders.length) text("아직 산 것이 없어요", x, y + 116, 13, "#aaa");
  stars.orders.slice(0, Math.max(1, Math.floor((h - 120) / 20))).forEach((o, i) => {
    const d = new Date(o.ts), pk = STAR_PACK_LIST.find((p) => p.sku === o.sku);
    text(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}  ${pk ? pk.name : o.sku}  ${o.krw.toLocaleString()}원  ${o.order || ""}`, x, y + 116 + i * 20, 13, "#ddd");
  });
  text("환불·문의: 구글 플레이 주문 내역 또는 개발자 이메일", x, y + h - 6, 12, "#888");
}
function drawStarsGate() {
  const g = stars.gate, W = view.w, H = view.h, pw = 420, ph = 230, x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, W, H);
  drawPanel(x0, y0, pw, ph);
  text("어른 확인", x0 + 20, y0 + 36, 20, "#ffe27a");
  text(`${g.label || ""}: 부모님이 풀어 주세요`, x0 + 20, y0 + 62, 14, "#ddd");
  text(g.q, x0 + pw / 2, y0 + 108, 30, "#fff", "center");
  g.opts.forEach((v, i) => drawButton(x0 + 20 + i * 97, y0 + 136, 88, 44, String(v), () => { const ok = v === g.ans, then = g.then; stars.gate = null; if (ok) then(); else starsSay("다시 해 주세요"); }, { size: 18 }));
  drawButton(x0 + pw / 2 - 50, y0 + 188, 100, 32, "그만두기", () => { stars.gate = null; }, { size: 14 });
}
