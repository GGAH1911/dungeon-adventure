// ===== 같이 하기: 아이템 교환 (장비·화살·물약) =====
// 메뉴 "교환하기" -> 친구에게 묻기 -> 둘 다 교환 창: 각자 줄 것을 올리고, 둘 다 "좋아요"를 누르면 한꺼번에 바뀌어요.
//   한쪽이 줄 것을 바꾸면 두 사람 "좋아요"가 모두 풀려요 (몰래 바꾸기 막기).
//   "좋아요"에는 (내가 줄 것 | 받을 것) 모양을 실어 보내고, 두 기기가 본 모양이 같을 때만 바꿔요.
// 메시지 (친구끼리는 방장을 거쳐요): { t: "trade", to, from, k: req|yes|no|busy|offer|ok|cancel, ... }
// 받은 장비는 아는 종류·범위만 남기고 makeItem 으로 새로 만들어요 (번호도 새로).

const TRADE_ASK_TIMEOUT = 20; // 초
const trade = { phase: null, with: null, mine: null, theirs: null, myOk: false, theirOk: null, note: "", noteColor: "#ddd", noteT: 0, page: 0, askAt: 0 };
// 화살·물약은 최대치가 없지만, 친구에게서 받은 숫자는 이 정도에서 잘라요 (이상한 값 막기)
const TRADE_COUNT_MAX = 99999;
function tradeEmpty() { return { items: [], arrows: {}, potions: 0 }; }
function tradeReset() { Object.assign(trade, { phase: null, with: null, mine: tradeEmpty(), theirs: tradeEmpty(), myOk: false, theirOk: null, page: 0 }); }
tradeReset();
function tradeNote(s, c = "#ddd") { trade.note = s; trade.noteColor = c; trade.noteT = 3; }
function tradeMyPid() { return netplay.role === "host" ? 1 : netplay.slot; }
function tradePartner() { return allPlayers().find((q) => (q.pid || 1) === trade.with) || null; }
function tradeName(pid) { const q = allPlayers().find((x) => (x.pid || 1) === pid); return q ? playerLabel(q) : `${pid}번`; }

// ----- 보내기 (방장은 바로, 친구는 방장에게: 방장이 받는 사람에게 넘겨줘요) -----
function tradeSend(to, body) {
  const S = netSession(); if (!S || !Number.isInteger(to)) return;
  const msg = { t: "trade", to, ...body };
  if (netplay.role === "host") { if (S.peers.has(to)) S.send(to, { ...msg, from: 1 }); }
  else S.toHost(msg);
}
// 방장: 교환 메시지 받기 (나에게 온 것은 처리, 친구에게 가는 것은 넘겨주기)
function tradeOnHost(msg, slot) {
  const to = Number(msg.to);
  if (to === 1) return tradeOnMessage(msg, slot);
  const S = netSession();
  if (S && Number.isInteger(to) && to !== slot && S.peers.has(to)) S.send(to, { ...tradeCleanMsg(msg), t: "trade", to, from: slot });
}
// 넘겨줄 때도 아는 칸만
function tradeCleanMsg(msg) {
  const out = { k: typeof msg.k === "string" ? msg.k.slice(0, 8) : "" };
  if (msg.o !== undefined) out.o = tradeCleanOffer(msg.o);
  if (typeof msg.h === "string" && msg.h.length <= 4000) out.h = msg.h;
  return out;
}

// ----- 받은 것 검사 -----
function tradeCleanItem(x) {
  if (!x || typeof x !== "object" || typeof x.b !== "string" || !Object.hasOwn(ITEM_BASES, x.b)) return null;
  const extra = { p: Math.round(netNum(x.p, 0, PLUS_MAX, 0)) };
  if (typeof x.e === "string" && typeof ENCHANTS !== "undefined" && Object.hasOwn(ENCHANTS, x.e)) extra.e = x.e;
  if (typeof x.f === "string" && typeof CLASS_DEFS !== "undefined" && Object.hasOwn(CLASS_DEFS, x.f)) extra.f = x.f;
  return makeItem(x.b, Math.round(netNum(x.r, 0, 4, 0)), Math.round(netNum(x.l, 0, 999, 0)), extra);
}
function tradeCleanOffer(o) {
  const out = tradeEmpty();
  if (!o || typeof o !== "object") return out;
  for (const x of Array.isArray(o.items) ? o.items.slice(0, BAG_MAX) : []) { const it = tradeCleanItem(x); if (it) out.items.push(it); }
  for (const at of ARROW_TYPES) { const n = Math.round(netNum(o.arrows && o.arrows[at.id], 0, Math.min(CONFIG.player.maxArrows, TRADE_COUNT_MAX), 0)); if (n > 0) out.arrows[at.id] = n; }
  out.potions = Math.round(netNum(o.potions, 0, Math.min(CONFIG.player.maxPotions, TRADE_COUNT_MAX), 0));
  return out;
}
// 보낼 모양 (장비는 필요한 칸만)
function tradeWire(o) {
  return { items: o.items.map((it) => { const w = { b: it.b, r: it.r, l: it.l, p: it.p || 0 }; if (it.e) w.e = it.e; if (it.f) w.f = it.f; return w; }), arrows: { ...o.arrows }, potions: o.potions };
}
// 두 기기가 같은 것을 보는지 비교하는 글자 (번호 u 는 빼요)
function tradeCanon(o) {
  const w = tradeWire(o);
  return JSON.stringify([w.items.map((x) => [x.b, x.r, x.l, x.p, x.e || "", x.f || ""]), ARROW_TYPES.map((a) => w.arrows[a.id] || 0), w.potions]);
}

// ----- 시작·묻기 -----
function tradeOthers() { const me = tradeMyPid(); return allPlayers().filter((q) => (q.pid || 1) !== me); }
function tradeStart(pid) {
  if (!netOn()) return;
  const others = tradeOthers();
  if (pid === undefined) {
    if (!others.length) { showMessage("같이 하는 친구가 없어요", 2); return; }
    if (others.length > 1) { tradeReset(); trade.phase = "pick"; game.overlay = "trade"; return; }
    pid = others[0].pid || 1;
  }
  tradeReset();
  trade.with = pid; trade.phase = "wait"; trade.askAt = game.time;
  game.overlay = "trade";
  tradeSend(pid, { k: "req" });
}
function tradeAnswer(yes) {
  if (trade.phase !== "ask") return;
  tradeSend(trade.with, { k: yes ? "yes" : "no" });
  if (yes) { trade.phase = "open"; tradeNote("줄 것을 골라 올리고 '좋아요'를 눌러요", "#ffe27a"); }
  else tradeClose();
}
function tradeClose() { tradeReset(); if (game.overlay === "trade") game.overlay = null; }
function tradeCancel(why) {
  if (trade.with && (trade.phase === "open" || trade.phase === "wait")) tradeSend(trade.with, { k: "cancel" });
  tradeClose();
  if (why) showMessage(why, 2);
}

// ----- 메시지 받기 -----
function tradeOnMessage(msg, from) {
  if (!msg || typeof msg !== "object" || !Number.isInteger(from)) return;
  const k = msg.k;
  if (k === "req") {
    if (trade.phase || (game.overlay && game.overlay !== "menu") || game.result) { tradeSend(from, { k: "busy" }); return; }
    tradeReset(); trade.with = from; trade.phase = "ask"; trade.askAt = game.time;
    game.overlay = "trade"; if (typeof sfx !== "undefined") sfx.equip();
    return;
  }
  if (from !== trade.with) return; // 지금 교환하는 친구 것만
  if (k === "busy" || k === "no") { tradeClose(); showMessage(k === "busy" ? `${josa(tradeName(from), "은/는")} 지금 다른 것을 하고 있어요. 잠시 뒤 다시!` : `${josa(tradeName(from), "이/가")} 교환을 안 한대요`, 2.5); return; }
  if (k === "yes" && trade.phase === "wait") { trade.phase = "open"; tradeNote("줄 것을 골라 올리고 '좋아요'를 눌러요", "#ffe27a"); return; }
  if (k === "cancel") { tradeClose(); showMessage(`${josa(tradeName(from), "이/가")} 교환을 그만뒀어요`, 2.5); return; }
  if (trade.phase !== "open") return;
  if (k === "offer") { trade.theirs = tradeCleanOffer(msg.o); trade.myOk = false; trade.theirOk = null; tradeNote(`${josa(tradeName(from), "이/가")} 줄 것을 바꿨어요`, "#7dd3ff"); return; }
  if (k === "ok") { trade.theirOk = typeof msg.h === "string" ? msg.h : null; tradeTryCommit(); }
}

// ----- 내 줄 것 바꾸기 (바꾸면 두 사람 좋아요가 풀려요) -----
function tradeChanged() {
  trade.myOk = false; trade.theirOk = null;
  tradeSend(trade.with, { k: "offer", o: tradeWire(trade.mine) });
}
function tradeGiveable() { return game.profile.bag.filter((it) => !it.lock && !trade.mine.items.includes(it)); }
function tradeAddItem(it) { if (trade.phase !== "open" || !it || it.lock || trade.mine.items.includes(it) || !game.profile.bag.includes(it)) return; trade.mine.items.push(it); tradeChanged(); }
function tradeRemoveItem(it) { const i = trade.mine.items.indexOf(it); if (i < 0) return; trade.mine.items.splice(i, 1); tradeChanged(); }
function tradeAddArrows(id, n) {
  const have = arrowCount(id) - (trade.mine.arrows[id] || 0); n = Math.min(n, have);
  if (n <= 0) return;
  trade.mine.arrows[id] = (trade.mine.arrows[id] || 0) + n; tradeChanged();
}
function tradeTakeArrows(id) { if (!trade.mine.arrows[id]) return; delete trade.mine.arrows[id]; tradeChanged(); }
function tradeAddPotion(d) {
  const n = Math.max(0, Math.min(game.profile.potions, trade.mine.potions + d));
  if (n === trade.mine.potions) return;
  trade.mine.potions = n; tradeChanged();
}

// ----- 좋아요 / 바꾸기 -----
// 바꾼 뒤에도 가방·화살·물약이 넘치지 않는지
function tradeFits() {
  const pr = game.profile, m = trade.mine, t = trade.theirs;
  if (pr.bag.length - m.items.length + t.items.length > BAG_MAX) return `가방이 넘쳐요 (${BAG_MAX}칸). 가방을 비우거나 덜 받아요`;
  for (const a of ARROW_TYPES) if (arrowCount(a.id) - (m.arrows[a.id] || 0) + (t.arrows[a.id] || 0) > CONFIG.player.maxArrows) return `${a.name}이 너무 많아져요 (${CONFIG.player.maxArrows}개까지)`;
  if (pr.potions - m.potions + t.potions > CONFIG.player.maxPotions) return `물약이 너무 많아져요 (${CONFIG.player.maxPotions}개까지)`;
  for (const it of m.items) if (!pr.bag.includes(it) || it.lock) return "줄 장비가 가방에 없어요";
  for (const a of ARROW_TYPES) if ((m.arrows[a.id] || 0) > arrowCount(a.id)) return "줄 화살이 모자라요";
  if (m.potions > pr.potions) return "줄 물약이 모자라요";
  return null;
}
function tradeOkHash() { return tradeCanon(trade.mine) + "|" + tradeCanon(trade.theirs); }        // 내가 보는 모양
function tradeOkWant() { return tradeCanon(trade.theirs) + "|" + tradeCanon(trade.mine); }        // 친구가 보낼 모양
function tradePressOk() {
  if (trade.phase !== "open") return;
  if (!trade.mine.items.length && !Object.keys(trade.mine.arrows).length && !trade.mine.potions && !trade.theirs.items.length && !Object.keys(trade.theirs.arrows).length && !trade.theirs.potions) { tradeNote("아직 아무것도 안 올렸어요", "#ffb070"); return; }
  const why = tradeFits(); if (why) { tradeNote(why, "#ff8080"); if (typeof sfx !== "undefined") sfx.denied(); return; }
  trade.myOk = true;
  tradeSend(trade.with, { k: "ok", h: tradeOkHash() });
  tradeNote(`좋아요! ${josa(tradeName(trade.with), "이/가")} 좋아요를 누르면 바뀌어요`, "#7dffb0");
  tradeTryCommit();
}
function tradeTryCommit() {
  if (trade.phase !== "open" || !trade.myOk || trade.theirOk !== tradeOkWant()) return false;
  const why = tradeFits();
  if (why) { trade.myOk = false; tradeNote(why, "#ff8080"); return false; }
  const pr = game.profile, m = trade.mine, t = trade.theirs;
  pr.bag = pr.bag.filter((it) => !m.items.includes(it));
  for (const a of ARROW_TYPES) { const d = (t.arrows[a.id] || 0) - (m.arrows[a.id] || 0); if (!d) continue; if (a.id === "normal") pr.arrows += d; else pr.special[a.id] = (pr.special[a.id] || 0) + d; }
  pr.potions += t.potions - m.potions;
  for (const it of t.items) { it.n = true; pr.bag.push(it); if (typeof codexGear === "function") codexGear(it); }
  if (netplay.role === "host" && typeof netProfileCounts === "function") netplay.prof = netProfileCounts(); // 교환으로 늘어난 건 던전 보상이 아니에요 (친구에게 또 주지 않게)
  saveProfile();
  if (typeof refreshGear === "function") refreshGear();
  const got = t.items.length + Object.values(t.arrows).reduce((a, b) => a + b, 0) + t.potions;
  const name = tradeName(trade.with);
  tradeClose();
  showMessage(`${josa(name, "과/와")} 교환했어요! (${got}개 받음)`, 2.5, false, "#7dffb0");
  if (typeof sfx !== "undefined") sfx.buy();
  hookRun("tradeDone", got);
  return true;
}

// ----- 메뉴·창 -----
// 친구 옆에 가면 "교환" 버튼 (E 키 / 터치 버튼). 내 기기의 나만 보여요 (only), 상자·가게·계단이 가까우면 그쪽이 먼저 (weak)
function tradeNearList(list) {
  const me = game.player;
  if (!netOn() || !me || me.hp <= 0 || game.mode === "pvp" || trade.phase) return list;
  for (const q of tradeOthers()) {
    if (!(q.hp > 0)) continue;
    const pid = q.pid || 1, nm = playerLabel(q);
    list.push({ x: q.x, y: q.y, range: 1.6, only: me, weak: true, local: true, short: "교환", prompt: `${josa(nm, "과/와")} 교환하기`, action: () => tradeStart(pid) });
  }
  return list;
}
hookOn("lobbyInteractables", tradeNearList, 90);
hookOn("dungeonInteractables", tradeNearList, 90);
hookOn("netTick", () => {
  if (!trade.phase) return;
  if (!netOn() || (trade.with && !tradePartner())) { const had = trade.phase === "open" || trade.phase === "wait"; tradeClose(); if (had) showMessage("교환하던 친구가 나갔어요", 2.5); return; }
  if ((trade.phase === "wait" || trade.phase === "ask") && game.time - trade.askAt > TRADE_ASK_TIMEOUT) { if (trade.phase === "ask") tradeAnswer(false); else { tradeSend(trade.with, { k: "cancel" }); tradeClose(); showMessage("대답이 없어서 교환을 그만뒀어요", 2.5); } }
  if (game.overlay !== "trade" && trade.phase) { if (trade.phase === "open" || trade.phase === "wait") tradeSend(trade.with, { k: "cancel" }); else if (trade.phase === "ask") tradeSend(trade.with, { k: "no" }); tradeReset(); }
}, 60);
hookOn("overlayUpdate", (name) => {
  if (name !== "trade") return false;
  trade.noteT -= 1 / 60;
  if (wasPressed("Escape")) { if (trade.phase === "ask") tradeAnswer(false); else tradeCancel(); }
  if (trade.phase === "ask") { if (wasPressed("KeyY", "Enter")) tradeAnswer(true); else if (wasPressed("KeyN")) tradeAnswer(false); }
  else if (trade.phase === "open" && wasPressed("Enter")) tradePressOk();
  return true;
}, 50);

function tradeDrawOffer(o, x, y, w, h, mine) {
  roundRectPath(x, y, w, h, 10); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill();
  const s = Math.min(48, (h - 12) / 2 - 4); let cx = x + 8, cy = y + 8;
  const next = () => { cx += s + 6; if (cx + s > x + w - 6) { cx = x + 8; cy += s + 6; } };
  for (const it of o.items) { if (cy + s > y + h) break; drawItemCell(it, cx, cy, s, false, mine ? () => tradeRemoveItem(it) : null); next(); }
  const chip = (color, label, onTap) => {
    if (cy + s > y + h) return;
    roundRectPath(cx, cy, s, s, 8); ctx.fillStyle = `${color}33`; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    text(label, cx + s / 2, cy + s / 2 + 5, 13, "#fff", "center");
    if (onTap) addUI(cx, cy, s, s, onTap);
    next();
  };
  for (const a of ARROW_TYPES) if (o.arrows[a.id]) chip(a.color, `${a.name.replace(" 화살", "").replace("화살", "")}×${o.arrows[a.id]}`, mine ? () => tradeTakeArrows(a.id) : null);
  if (o.potions) chip("#c64fa0", `물약×${o.potions}`, mine ? () => tradeAddPotion(-o.potions) : null);
  if (!o.items.length && !Object.keys(o.arrows).length && !o.potions) text(mine ? "아래에서 줄 것을 눌러 올려요" : "아직 없어요", x + w / 2, y + h / 2 + 5, 14, "#888", "center");
}
hookOn("overlayDraw", (name) => {
  if (name !== "trade") return false;
  const W = view.w, H = view.h, pw = Math.min(920, W - 16), ph = Math.min(580, H - 12);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2, cx = W / 2;
  drawPanel(x0, y0, pw, ph);
  if (trade.phase === "pick") {
    text("누구와 교환할까요?", cx, y0 + 60, 22, "#ffe27a", "center");
    tradeOthers().forEach((q, i) => drawButton(cx - 120, y0 + 90 + i * 56, 240, 46, playerLabel(q), () => tradeStart(q.pid || 1), { size: 18, color: `${coopColorOf(q.pid || 1).label}55` }));
    drawButton(cx - 80, y0 + ph - 60, 160, 44, "닫기", tradeClose, { size: 17 });
    return true;
  }
  const nm = tradeName(trade.with);
  if (trade.phase === "ask" || trade.phase === "wait") {
    const title = trade.phase === "ask" ? `${josa(nm, "이/가")} 교환하자고 해요` : `${nm}에게 물어보는 중...`;
    text(title, cx, y0 + ph / 2 - 30, 22, "#ffe27a", "center");
    text(`${Math.max(0, Math.ceil(TRADE_ASK_TIMEOUT - (game.time - trade.askAt)))}초`, cx, y0 + ph / 2, 14, "#aaa", "center");
    if (trade.phase === "ask") {
      drawButton(cx - 170, y0 + ph / 2 + 24, 160, 50, "좋아요", () => tradeAnswer(true), { size: 20, color: "rgba(80,200,120,0.45)" });
      drawButton(cx + 10, y0 + ph / 2 + 24, 160, 50, "싫어요", () => tradeAnswer(false), { size: 20, color: "rgba(220,90,90,0.45)" });
    } else drawButton(cx - 80, y0 + ph / 2 + 24, 160, 46, "그만두기", () => tradeCancel(), { size: 17 });
    return true;
  }
  // 교환 창
  text(`교환 · ${nm}`, x0 + 20, y0 + 36, 22, "#ffe27a");
  drawButton(x0 + pw - 52, y0 + 8, 42, 38, "✕", () => tradeCancel(), { size: 20 });
  const top = y0 + 50, colW = (pw - 36) / 2, offH = Math.min(132, ph * 0.3);
  text("내가 줄 것 (누르면 빼요)", x0 + 14, top + 14, 14, "#ddd");
  text(`${josa(nm, "이/가")} 줄 것`, x0 + 22 + colW, top + 14, 14, "#ddd");
  if (trade.myOk) text("✓ 좋아요", x0 + 14 + colW - 8, top + 14, 14, "#7dffb0", "right");
  if (trade.theirOk) text("✓ 좋아요", x0 + 22 + colW * 2 - 8, top + 14, 14, "#7dffb0", "right");
  tradeDrawOffer(trade.mine, x0 + 14, top + 22, colW, offH, true);
  tradeDrawOffer(trade.theirs, x0 + 22 + colW, top + 22, colW, offH, false);
  // 내 것: 가방 장비 + 화살·물약
  const by = top + 30 + offH;
  text("내 가방 (누르면 올려요 · 잠근 장비는 빠져요)", x0 + 14, by + 12, 14, "#ddd");
  const bagTop = by + 20, bottomBar = y0 + ph - 58, s = Math.min(46, Math.max(34, (bottomBar - bagTop - 60) / 2));
  const perRow = Math.max(1, Math.floor((pw - 28) / (s + 6))), rows = Math.max(1, Math.floor((bottomBar - bagTop - 50) / (s + 6)));
  const list = tradeGiveable(), per = perRow * rows, pages = Math.max(1, Math.ceil(list.length / per));
  trade.page = Math.min(trade.page, pages - 1);
  list.slice(trade.page * per, trade.page * per + per).forEach((it, i) => drawItemCell(it, x0 + 14 + (i % perRow) * (s + 6), bagTop + Math.floor(i / perRow) * (s + 6), s, false, () => tradeAddItem(it)));
  if (!list.length) text("줄 수 있는 장비가 없어요", x0 + 20, bagTop + 24, 13, "#888");
  if (pages > 1) drawButton(x0 + pw - 120, by - 4, 106, 28, `다음 ${trade.page + 1}/${pages}`, () => { trade.page = (trade.page + 1) % pages; }, { size: 13 });
  // 화살·물약 더하기
  const ay = bagTop + rows * (s + 6) + 2; let ax = x0 + 14;
  for (const a of ARROW_TYPES) {
    const left = arrowCount(a.id) - (trade.mine.arrows[a.id] || 0), step = Math.min(a.pack, left);
    if (left <= 0) continue;
    const bw = 116;
    if (ax + bw > x0 + pw - 14) break;
    drawButton(ax, ay, bw, 38, `${a.name} +${step}`, () => tradeAddArrows(a.id, a.pack), { size: 13, color: `${a.color}44` });
    ax += bw + 6;
  }
  if (game.profile.potions - trade.mine.potions > 0 && ax + 96 <= x0 + pw - 14) drawButton(ax, ay, 96, 38, "물약 +1", () => tradeAddPotion(1), { size: 13, color: "rgba(198,79,160,0.4)" });
  // 아래: 안내 + 좋아요
  if (trade.noteT > 0) text(trade.note, x0 + 16, y0 + ph - 26, 15, trade.noteColor);
  drawButton(x0 + pw - 330, y0 + ph - 52, 150, 42, "그만두기", () => tradeCancel(), { size: 16 });
  drawButton(x0 + pw - 170, y0 + ph - 52, 156, 42, trade.myOk ? "✓ 기다리는 중" : "좋아요", tradePressOk, { size: 18, color: trade.myOk ? "rgba(80,200,120,0.25)" : "rgba(80,200,120,0.5)" });
  return true;
}, 50);
