// ===== 상인의 가게 =====
// 장비 사기(등급 화폐로, 찜해 두기), 화살·물약 사기, 가진 것 팔기, 화폐 바꾸기 (장비 강화는 대장장이에서!)

const shop = { cat: 0, sel: 0, page: 0, confirm: null, note: "", noteColor: "#fff", noteTimer: 0 };
const SHOP_CATS = ["장비", "화살 · 물약", "팔기", "바꾸기"];
const SELL_CAT = 2, EXCHANGE_CAT = 3;
// 파는 값 (에메랄드). 산 값의 절반쯤. 장비는 loot.js sellValue (그 등급 화폐로)
const SELL = {
  potion: 2,
  arrowPack: { normal: 1, fire: 2, ice: 2, bomb: 3, poison: 2 }, // 화살은 묶음(가게에서 사는 크기)으로 팔아요
};

function openShop() { game.overlay = "shop"; shop.sel = 0; shop.noteTimer = 0; if (typeof shopRestock === "function") shopRestock(); sfx.equip(); }
function shopNote(msg, color = "#fff") { shop.note = msg; shop.noteColor = color; shop.noteTimer = 2.2; }
function setShopCat(c) { shop.cat = c; shop.sel = 0; shop.page = 0; shop.confirm = null; }

function shopEntries() {
  if (shop.cat === 0) return game.profile.shopStock.map((it) => ({ kind: "gear", id: it.u, it, item: { name: itemLabel(it), color: itemRarity(it).color } }));
  return [...ARROW_TYPES.map((item) => ({ kind: "arrows", id: item.id, item })), { kind: "potion", id: "potion", item: POTION }, ...shopBuffEntries(), ...(typeof shopFoodEntries === "function" ? shopFoodEntries() : []), ...(typeof shopBoomEntries === "function" ? shopBoomEntries() : [])];
}
// 강화 물약: 작은·큰 것만 팔아요 (최상급은 던전에서 줍기만, buffpots.js)
function shopBuffEntries() {
  if (typeof BUFF_IDS === "undefined") return [];
  return BUFF_IDS.filter((id) => BUFF_TIERS[buffPotParse(id).tier].price > 0).map((id) => {
    const { type, tier } = buffPotParse(id);
    return { kind: "buffpot", id, item: { name: buffPotName(id), color: BUFF_TYPES[type].liquid, price: BUFF_TIERS[tier].price } };
  });
}

function updateShop(dt) {
  shop.noteTimer -= dt;
  for (let i = 0; i < SHOP_CATS.length; i++) if (wasPressed("Digit" + (i + 1))) setShopCat(i);
  if (shop.cat === SELL_CAT) return updateSellTab();
  if (shop.cat === EXCHANGE_CAT) return updateExchangeTab();
  const n = shopEntries().length;
  if (wasPressed("ArrowUp", "KeyW")) shop.sel -= 2;
  if (wasPressed("ArrowDown", "KeyS")) shop.sel += 2;
  if (wasPressed("ArrowLeft", "KeyA")) shop.sel -= 1;
  if (wasPressed("ArrowRight", "KeyD")) shop.sel += 1;
  shop.sel = Math.max(0, Math.min(n - 1, shop.sel));
  if (wasPressed("Enter", "Space")) shopAction();
  if (wasPressed("KeyF") && shop.cat === 0) shopHoldAction();
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}
// 찜하기 / 풀기 (고른 장비)
function shopHoldAction() {
  const e = shopEntries()[shop.sel];
  if (!e || e.kind !== "gear") return;
  const r = toggleShopHold(e.it.u);
  if (!r.ok) { sfx.denied(); return shopNote(r.why, "#ffb070"); }
  sfx.equip();
  shopNote(r.held ? `${josa(itemLabel(e.it), "을/를")} 찜했어요! 던전을 다녀와도 남아 있어요` : "찜을 풀었어요", r.held ? "#ff9ad5" : "#ddd");
}

function notEnough(price) { sfx.denied(); shopNote(lackText(typeof price === "number" ? { cur: "emerald", n: price } : price), "#ff8080"); }

function shopAction() {
  const e = shopEntries()[shop.sel];
  if (!e) return;
  const pr = game.profile;
  if (e.kind === "gear") {
    const r = buyShopItem(e.it.u);
    if (!r.ok) { sfx.denied(); return shopNote(r.why, "#ff8080"); }
    sfx.buy();
    shop.sel = Math.max(0, Math.min(shopEntries().length - 1, shop.sel));
    return shopNote(`${josa(itemLabel(e.it), "을/를")} 샀어요! 가방(캐릭터 창)에서 껴요`, "#7dffb0");
  }
  if (e.kind === "arrows") {
    const it = e.item, max = CONFIG.player.maxArrows;
    if (arrowCount(it.id) >= max) return shopNote(`${josa(it.name, "은/는")} ${max}개까지만 가질 수 있어요`, "#ddd");
    if (!pay({ cur: "emerald", n: it.price })) return notEnough(it.price);
    if (it.id === "normal") pr.arrows = Math.min(max, pr.arrows + it.pack);
    else pr.special[it.id] = Math.min(max, (pr.special[it.id] || 0) + it.pack);
    saveProfile(); sfx.buy();
    return shopNote(`${it.name} ${it.pack}개를 샀어요! (${arrowCount(it.id)}개)`, "#7dffb0");
  }
  if (e.kind === "food") return shopBuyFood(e.id); // 음식 (hunger.js)
  if (e.kind === "boom") return shopBuyBoom(e.id); // TNT·폭죽 (boom.js)
  if (e.kind === "buffpot") {
    if (!pay({ cur: "emerald", n: e.item.price })) return notEnough(e.item.price);
    buffPotAdd(e.id, 1);
    saveProfile(); sfx.buy();
    return shopNote(`${josa(e.item.name, "을/를")} 샀어요! (${buffPotCount(e.id)}개) 던전에서 ${BUFF_TYPES[buffPotParse(e.id).type].keyName} 로 마셔요`, "#7dffb0");
  }
  if (pr.potions >= CONFIG.player.maxPotions) return shopNote(`물약은 ${CONFIG.player.maxPotions}개까지만 가질 수 있어요`, "#ddd");
  if (!pay({ cur: "emerald", n: POTION.price })) return notEnough(POTION.price);
  pr.potions++;
  saveProfile(); sfx.buy();
  shopNote(`물약을 샀어요! (${pr.potions}개)`, "#7dffb0");
}

function drawShopMoney(x, y, pw) {
  let cx = x;
  for (const c of CURRENCIES) { drawCurrencyIcon(c.id, cx + 8, y - 6, 8); text(`${curHave(c.id)}`, cx + 20, y, 15, "#fff"); cx += Math.min(78, pw / 5); }
}

function drawShop() {
  const W = view.w, H = view.h, pr = game.profile;
  const pw = Math.min(960, W - 24), ph = Math.min(560, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("상인의 가게", x0 + 24, y0 + 40, 26, "#ffe27a");
  drawShopMoney(x0 + pw - 470, y0 + 40, 400);
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  const catW = (pw - 40 - 10 * (SHOP_CATS.length - 1)) / SHOP_CATS.length;
  SHOP_CATS.forEach((name, i) => drawButton(x0 + 20 + i * (catW + 10), y0 + 60, catW, 40, name, () => setShopCat(i), { selected: shop.cat === i, size: 16 }));
  if (shop.cat === SELL_CAT) { drawSellTab(x0, y0, pw, ph); drawShopNote(x0, y0, ph); return; }
  if (shop.cat === EXCHANGE_CAT) { drawExchangeTab(x0, y0, pw, ph); drawShopNote(x0, y0, ph); return; }
  text(shop.cat === 0 ? `좋은 장비일수록 높은 화폐로만 살 수 있어요 · 던전을 다녀오면 물건이 바뀌어요 (♥ 찜하면 남아요, ${SHOP_HOLD_MAX}개까지)` : "화살과 물약은 에메랄드로 사요", x0 + 24, y0 + 124, 13, "#999");

  const entries = shopEntries();
  if (!entries.length) text("다 팔렸어요! 던전을 다녀오면 새 물건이 와요", x0 + pw / 2, y0 + ph / 2, 18, "#ccc", "center");
  const top = y0 + 136, bottom = y0 + ph - 64;
  const colW = (pw - 52) / 2;
  const rows = Math.max(1, Math.ceil(entries.length / 2));
  const rowH = Math.min(84, (bottom - top) / rows);
  entries.forEach((e, i) => {
    const cx = x0 + 20 + (i % 2) * (colW + 12), ry = top + Math.floor(i / 2) * rowH;
    const sel = shop.sel === i;
    roundRectPath(cx, ry, colW, rowH - 6, 8);
    ctx.fillStyle = sel ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.04)"; ctx.fill();
    if (sel) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
    addUI(cx, ry, colW, rowH - 6, () => { if (shop.sel === i) shopAction(); else shop.sel = i; });
    let desc = "", price;
    if (e.kind === "gear") {
      const it = e.it, b = itemBase(it), cur = pr.eq[b.slot], d = itemScore(it) - itemScore(cur);
      drawItemCell(it, cx + 6, ry + 4, rowH - 14, false, () => { if (shop.sel === i) shopAction(); else shop.sel = i; });
      text(itemLabel(it), cx + rowH + 2, ry + 25, 17, itemRarity(it).color);
      const first = itemLines(it)[0];
      desc = `${itemRarity(it).name} · ${EQ_SLOTS.find((s) => s.id === b.slot).name} · Lv ${it.l}${first ? " · " + first[0] : ""}`;
      text(desc, cx + rowH + 2, ry + 45, 12, "#aaa");
      if (!canUseItem(it)) text("다른 직업 무기", cx + rowH + 2, ry + 63, 12, "#ff9090");
      else text(d > 0 ? `▲ 지금보다 ${d} 좋아요` : d < 0 ? `▼ 지금보다 약해요` : "지금과 같아요", cx + rowH + 2, ry + 63, 12, d > 0 ? "#7dffb0" : "#999");
      price = buyPrice(it);
      drawPrice(price, cx + colW - 12, ry + 32, 18, "right", canPay(price));
      if (isShopHeld(it.u)) text("♥ 찜", cx + colW - 12, ry + 58, 14, "#ff9ad5", "right");
      return;
    }
    if (e.kind === "arrows") { desc = `${e.item.desc} · ${e.item.pack}개 묶음 · ${arrowCount(e.id)}개 있음`; price = { cur: "emerald", n: e.item.price }; }
    else if (e.kind === "buffpot") { desc = `${buffPotDesc(e.id)} · ${buffPotCount(e.id)}개 있음`; price = { cur: "emerald", n: e.item.price }; }
    else if (e.kind === "food") { desc = shopFoodDesc(e.id); price = { cur: "emerald", n: e.item.price }; }
    else if (e.kind === "boom") { desc = shopBoomDesc(e.id); price = { cur: "emerald", n: e.item.price }; }
    else { desc = `던전에서 마시면 하트 ${POTION.heal}개 회복 · ${pr.potions}개 있음`; price = { cur: "emerald", n: POTION.price }; }
    ctx.fillStyle = e.item.color || (e.kind === "potion" ? "#c64fa0" : "#a0784a");
    ctx.fillRect(cx + 10, ry + rowH / 2 - 14, 20, 20);
    text(e.item.name, cx + 40, ry + 25, 18, "#fff");
    text(desc, cx + 40, ry + 47, 12, "#aaa");
    drawPrice(price, cx + colW - 12, ry + 30, 18, "right", canPay(price));
  });
  if (entries[shop.sel]) drawButton(x0 + pw - 170, y0 + ph - 54, 150, 42, "사기", shopAction, { color: "rgba(80,200,120,0.35)", size: 19 });
  const se = entries[shop.sel];
  if (se && se.kind === "gear") { const held = isShopHeld(se.it.u); drawButton(x0 + pw - 330, y0 + ph - 54, 150, 42, held ? "♥ 찜 풀기" : "♡ 찜하기", shopHoldAction, { color: held ? "rgba(255,120,190,0.35)" : "rgba(255,255,255,0.08)", size: 17 }); }
  drawShopNote(x0, y0, ph);
}

function drawShopNote(x0, y0, ph) {
  if (shop.noteTimer > 0) {
    ctx.globalAlpha = Math.min(1, shop.noteTimer * 2);
    text(shop.note, x0 + 24, y0 + ph - 26, 17, shop.noteColor);
    ctx.globalAlpha = 1;
  }
}

// ===== 팔기 =====
// 팔 수 있는 것: 화살, 물약, 가방의 장비 (부품·화폐는 돈처럼 쓰는 거라 못 팔아요)
function sellEntries() {
  const pr = game.profile, out = [];
  for (const at of ARROW_TYPES) {
    const n = arrowCount(at.id);
    if (n < at.pack) continue;
    out.push({ kind: "arrows", id: at.id, name: at.name, color: at.color, count: n, unit: at.pack, price: SELL.arrowPack[at.id] || 1, cur: "emerald" });
  }
  if (pr.potions > 0) out.push({ kind: "potion", id: "potion", name: POTION.name, color: "#c64fa0", count: pr.potions, unit: 1, price: SELL.potion, cur: "emerald" });
  if (typeof BUFF_IDS !== "undefined") for (const id of BUFF_IDS) {
    const n = buffPotCount(id); if (!n) continue;
    const { type, tier } = buffPotParse(id);
    out.push({ kind: "buffpot", id, name: buffPotName(id), color: BUFF_TYPES[type].liquid, count: n, unit: 1, price: BUFF_TIERS[tier].sell, cur: "emerald" });
  }
  for (const it of pr.bag) {
    const v = sellValue(it);
    out.push({ kind: "item", id: it.u, it, name: itemLabel(it), color: itemRarity(it).color, count: 1, unit: 1, price: v.n, cur: v.cur, locked: !!it.lock });
  }
  return out;
}

function sellCannot(e) {
  if (e.kind === "item" && e.locked) return "잠근 장비예요 (캐릭터 창에서 잠금을 풀어요)";
  return null;
}

// all: 모두 팔기
function sellItem(e, all) {
  if (!e) return;
  const pr = game.profile;
  const why = sellCannot(e);
  if (why) { sfx.denied(); return shopNote(why, "#ffb070"); }
  // 좋은 장비(영웅 이상)와 "모두 팔기"는 한 번 더 눌러야 팔아요 (실수 막기)
  const key = `${e.kind}:${e.id}:${all ? "all" : "one"}`;
  const needConfirm = (e.kind === "item" && e.it.r >= 2) || (all && e.count / e.unit > 1);
  if (needConfirm && shop.confirm !== key) {
    shop.confirm = key;
    const n = all ? Math.floor(e.count / e.unit) : 1;
    return shopNote(`한 번 더 누르면 ${josa(e.name + (n > 1 ? ` ${n * e.unit}개` : ""), "을/를")} 팔아요 (+${n * e.price} ${CUR[e.cur].name})`, "#ffe27a");
  }
  shop.confirm = null;
  if (e.kind === "item") {
    const r = sellItemU(e.id);
    if (!r.ok) { sfx.denied(); return shopNote(r.why, "#ffb070"); }
    sfx.buy();
    shopNote(`${josa(e.name, "을/를")} 팔았어요! ${priceText(r.price)}`, "#7dffb0");
  } else {
    const packs = all ? Math.floor(e.count / e.unit) : 1;
    if (packs <= 0) return;
    const qty = packs * e.unit, gain = packs * e.price;
    if (e.kind === "arrows") { if (e.id === "normal") pr.arrows -= qty; else pr.special[e.id] -= qty; }
    else if (e.kind === "potion") pr.potions -= qty;
    else if (e.kind === "buffpot") { if (!buffPotTake(e.id, qty)) return; }
    curEarn("emerald", gain, "sell");
    saveProfile();
    sfx.buy();
    shopNote(`${josa(e.name + (qty > 1 ? ` ${qty}개` : ""), "을/를")} 팔았어요! 에메랄드 +${gain}`, "#7dffb0");
    hookRun("itemSold", e, qty, gain);
  }
  const n = sellEntries().length;
  shop.sel = Math.max(0, Math.min(n - 1, shop.sel));
}

const SELL_PER_PAGE = 8;
function updateSellTab() {
  const list = sellEntries(), n = list.length;
  const pages = Math.max(1, Math.ceil(n / SELL_PER_PAGE));
  if (wasPressed("ArrowUp", "KeyW")) { shop.sel -= 2; shop.confirm = null; }
  if (wasPressed("ArrowDown", "KeyS")) { shop.sel += 2; shop.confirm = null; }
  if (wasPressed("ArrowLeft", "KeyA")) { shop.sel -= 1; shop.confirm = null; }
  if (wasPressed("ArrowRight", "KeyD")) { shop.sel += 1; shop.confirm = null; }
  shop.sel = Math.max(0, Math.min(n - 1, shop.sel));
  shop.page = Math.min(pages - 1, Math.floor(Math.max(0, shop.sel) / SELL_PER_PAGE));
  if (wasPressed("Enter", "Space")) sellItem(list[shop.sel], false);
  if (wasPressed("KeyR")) sellItem(list[shop.sel], true);
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

function drawSellTab(x0, y0, pw, ph) {
  const pr = game.profile;
  const list = sellEntries();
  text("화살·물약·가방 장비를 팔아요. 장비 값은 등급·레벨·강화·마법으로 정해요 (끼고 있는 것·잠근 것은 안 팔려요)", x0 + 24, y0 + 124, 13, "#999");
  if (!list.length) { text("팔 수 있는 게 없어요. 던전에서 장비를 모아 와요!", x0 + pw / 2, y0 + ph / 2, 18, "#ccc", "center"); return; }
  const pages = Math.max(1, Math.ceil(list.length / SELL_PER_PAGE));
  shop.page = Math.max(0, Math.min(pages - 1, shop.page));
  const start = shop.page * SELL_PER_PAGE, items = list.slice(start, start + SELL_PER_PAGE);
  const top = y0 + 136, bottom = y0 + ph - 64;
  const colW = (pw - 52) / 2, rowH = Math.min(78, (bottom - top) / 4);
  items.forEach((e, k) => {
    const i = start + k;
    const cx = x0 + 20 + (k % 2) * (colW + 12), ry = top + Math.floor(k / 2) * rowH;
    const sel = shop.sel === i, why = sellCannot(e);
    roundRectPath(cx, ry, colW, rowH - 6, 8);
    ctx.fillStyle = sel ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.04)"; ctx.fill();
    if (sel) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
    addUI(cx, ry, colW * 0.5, rowH - 6, () => { shop.sel = i; shop.confirm = null; });
    if (e.kind === "item") drawItemIcon(e.it, cx + 20, ry + 22, 26); else { ctx.fillStyle = e.color; ctx.fillRect(cx + 10, ry + 12, 20, 20); }
    const countTxt = e.kind === "item" ? `${itemRarity(e.it).name} · Lv ${e.it.l}` : `${e.count}개`;
    text(e.name, cx + 40, ry + 25, 17, e.kind === "item" ? e.color : "#fff");
    // 값은 글자 대신 화폐 아이콘으로 (예: 전설 · Lv 12 · [자수정] 6)
    drawLabelPrice(countTxt + (e.unit > 1 ? ` · ${e.unit}개에` : " ·"), { cur: e.cur, n: e.price }, cx + 40, ry + 45, 12, "left", "#aaa");
    if (why) text("잠김", cx + colW - 12, ry + 30, 14, "#888", "right");
    else {
      const bw = Math.min(104, colW * 0.26), bh = Math.min(32, rowH - 26);
      const many = e.count / e.unit > 1;
      const conf1 = shop.confirm === `${e.kind}:${e.id}:one`, confA = shop.confirm === `${e.kind}:${e.id}:all`;
      (conf1 ? drawButton : drawPriceButton)(cx + colW - (many ? 2 * bw + 18 : bw + 10), ry + (rowH - 6 - bh) / 2, bw, bh, conf1 ? "정말?" : "팔기", ...(conf1 ? [] : [{ cur: e.cur, n: e.price }]), () => { shop.sel = i; sellItem(e, false); }, { size: 13, plus: "+", color: conf1 ? "rgba(255,200,60,0.5)" : "rgba(80,200,120,0.35)" });
      if (many) (confA ? drawButton : drawPriceButton)(cx + colW - bw - 10, ry + (rowH - 6 - bh) / 2, bw, bh, confA ? "정말?" : "모두", ...(confA ? [] : [{ cur: e.cur, n: Math.floor(e.count / e.unit) * e.price }]), () => { shop.sel = i; sellItem(e, true); }, { size: 13, plus: "+", color: confA ? "rgba(255,200,60,0.5)" : "rgba(60,160,220,0.35)" });
    }
  });
  if (pages > 1) {
    drawButton(x0 + pw - 220, y0 + ph - 54, 56, 42, "◀", () => { shop.page = (shop.page + pages - 1) % pages; shop.sel = shop.page * SELL_PER_PAGE; shop.confirm = null; }, { size: 18 });
    text(`${shop.page + 1} / ${pages}`, x0 + pw - 130, y0 + ph - 26, 16, "#ddd", "center");
    drawButton(x0 + pw - 96, y0 + ph - 54, 56, 42, "▶", () => { shop.page = (shop.page + 1) % pages; shop.sel = shop.page * SELL_PER_PAGE; shop.confirm = null; }, { size: 18 });
  }
}

// ===== 화폐 바꾸기 =====
// 낮은 화폐 n개 -> 바로 위 화폐 1개 (currency.js CUR_EXCHANGE, 값의 1.5배)
function updateExchangeTab() {
  const n = CUR_EXCHANGE.length;
  if (wasPressed("ArrowUp", "KeyW")) { shop.sel -= 1; shop.confirm = null; }
  if (wasPressed("ArrowDown", "KeyS")) { shop.sel += 1; shop.confirm = null; }
  shop.sel = Math.max(0, Math.min(n - 1, shop.sel));
  if (wasPressed("Enter", "Space")) exchangeAction(shop.sel, false);
  if (wasPressed("KeyR")) exchangeAction(shop.sel, true);
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}
// all: 바꿀 수 있는 만큼 모두 (5번 넘으면 한 번 더 눌러야)
function exchangeAction(i, all) {
  const x = CUR_EXCHANGE[i]; if (!x) return;
  const max = exchangeMax(i), times = all ? max : 1;
  if (times <= 0) { sfx.denied(); return shopNote(`${josa(CUR[x.from].name, "이/가")} ${x.n - curHave(x.from)}개 모자라요`, "#ff8080"); }
  const key = `ex:${i}:${all ? "all" : "one"}`;
  if (all && times >= 5 && shop.confirm !== key) {
    shop.confirm = key;
    return shopNote(`한 번 더 누르면 ${CUR[x.from].name} ${times * x.n}개를 ${CUR[x.to].name} ${times}개로 바꿔요`, "#ffe27a");
  }
  shop.confirm = null;
  const r = exchangeCur(i, times);
  if (!r.ok) { sfx.denied(); return shopNote(r.why, "#ff8080"); }
  saveProfile(); sfx.buy();
  shopNote(`${CUR[x.from].name} ${r.paid}개 → ${CUR[x.to].name} ${r.got}개로 바꿨어요!`, "#7dffb0");
}
function drawExchangeTab(x0, y0, pw, ph) {
  text("낮은 화폐를 모아 바로 위 화폐로 바꿔요 (조금 손해예요. 높은 맵·보스에서 모으면 이득!)", x0 + 24, y0 + 124, 13, "#999");
  const top = y0 + 140, bottom = y0 + ph - 64, rowH = Math.min(84, (bottom - top) / CUR_EXCHANGE.length);
  CUR_EXCHANGE.forEach((x, i) => {
    const ry = top + i * rowH, cx = x0 + 20, w = pw - 40, sel = shop.sel === i, max = exchangeMax(i);
    roundRectPath(cx, ry, w, rowH - 8, 8);
    ctx.fillStyle = sel ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.04)"; ctx.fill();
    if (sel) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
    addUI(cx, ry, w * 0.45, rowH - 8, () => { shop.sel = i; shop.confirm = null; });
    const my = ry + (rowH - 8) / 2;
    drawPrice({ cur: x.from, n: x.n }, cx + 16, my + 7, 22, "left", curHave(x.from) >= x.n);
    text("→", cx + 120, my + 8, 22, "#ddd");
    drawPrice({ cur: x.to, n: 1 }, cx + 152, my + 7, 22);
    text(`${CUR[x.from].name} ${curHave(x.from)}개 있음 · ${max}번 바꿀 수 있어요`, cx + 230, my + 7, 13, max > 0 ? "#bbb" : "#777");
    const bw = Math.min(110, w * 0.16), bh = Math.min(40, rowH - 22);
    const confA = shop.confirm === `ex:${i}:all`;
    drawButton(cx + w - 2 * bw - 20, my - bh / 2, bw, bh, "1번 바꾸기", () => { shop.sel = i; exchangeAction(i, false); }, { size: 14, color: max > 0 ? "rgba(80,200,120,0.35)" : "rgba(255,255,255,0.06)" });
    drawButton(cx + w - bw - 10, my - bh / 2, bw, bh, confA ? "정말?" : `모두 (${max}번)`, () => { shop.sel = i; exchangeAction(i, true); }, { size: 14, color: confA ? "rgba(255,200,60,0.5)" : max > 1 ? "rgba(60,160,220,0.35)" : "rgba(255,255,255,0.06)" });
  });
}
