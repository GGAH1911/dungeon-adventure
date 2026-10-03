// ===== 상인의 가게 =====
// 무기 종류·활 종류 열기, 화살·물약 사기, 가진 것 팔기 (장비 강화는 대장장이에서 부품으로!)

const shop = { cat: 0, sel: 0, page: 0, confirm: null, note: "", noteColor: "#fff", noteTimer: 0 };
const SHOP_CATS = ["무기 종류", "활 종류", "화살 · 물약", "팔기"];
const SELL_CAT = 3;
// 파는 값 (에메랄드). 산 값의 절반쯤. 부품은 단계가 높을수록 비싸요
const SELL = {
  potion: 2,
  arrowPack: { normal: 1, fire: 2, ice: 2, bomb: 3 }, // 화살은 묶음(가게에서 사는 크기)으로 팔아요
  typeRate: 0.5,     // 무기·활 종류는 연 값의 절반
};
const TYPE_DESC = {
  sword: "베기 → 반대로 베기 → 내려찍기", dagger: "아주 빨라요 · 찌르기 → 찌르기 → 회오리",
  spear: "멀리 닿아요 · 찌르기 → 찌르기 → 휘두르기", axe: "세고 느려요 · 내려찍기 → 베기 → 회오리",
  hammer: "아주 세고 느려요 · 마무리는 땅 울리기", scythe: "넓게 베어요 · 베기 → 베기 → 회오리",
};
const BOW_DESC = {
  basic: "기본 활", rapid: "아주 빨리 쏴요", long: "세고 1마리 뚫어요", triple: "3발씩 쏴요",
  crossbow: "아주 세고 2마리 뚫어요, 느려요", storm: "5발씩, 1마리 뚫기",
};

function openShop() { game.overlay = "shop"; shop.sel = 0; shop.noteTimer = 0; sfx.equip(); }
function shopNote(msg, color = "#fff") { shop.note = msg; shop.noteColor = color; shop.noteTimer = 2.2; }
function setShopCat(c) { shop.cat = c; shop.sel = 0; shop.page = 0; shop.confirm = null; }

function shopEntries() {
  if (shop.cat === 0) return WEAPON_TYPE_ORDER.map((id) => ({ kind: "weaponType", id, item: WEAPON_TYPES[id] }));
  if (shop.cat === 1) return BOW_TYPE_ORDER.map((id) => ({ kind: "bowType", id, item: BOW_TYPES[id] }));
  return [...ARROW_TYPES.map((item) => ({ kind: "arrows", id: item.id, item })), { kind: "potion", id: "potion", item: POTION }];
}

function updateShop(dt) {
  shop.noteTimer -= dt;
  for (let i = 0; i < SHOP_CATS.length; i++) if (wasPressed("Digit" + (i + 1))) setShopCat(i);
  if (shop.cat === SELL_CAT) return updateSellTab();
  const n = shopEntries().length;
  if (wasPressed("ArrowUp", "KeyW")) shop.sel -= 2;
  if (wasPressed("ArrowDown", "KeyS")) shop.sel += 2;
  if (wasPressed("ArrowLeft", "KeyA")) shop.sel -= 1;
  if (wasPressed("ArrowRight", "KeyD")) shop.sel += 1;
  shop.sel = Math.max(0, Math.min(n - 1, shop.sel));
  if (wasPressed("Enter", "Space")) shopAction();
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

function notEnough(price) { sfx.denied(); shopNote(`에메랄드가 ${price - game.profile.emeralds}개 모자라요`, "#ff8080"); }

function shopAction() {
  const e = shopEntries()[shop.sel];
  if (!e) return;
  const pr = game.profile;
  if (e.kind === "weaponType" || e.kind === "bowType") {
    const owned = e.kind === "weaponType" ? pr.weaponTypes : pr.bowTypes;
    if (!owned.includes(e.id)) {
      if (pr.emeralds < e.item.price) return notEnough(e.item.price);
      pr.emeralds -= e.item.price;
      owned.push(e.id);
      sfx.buy();
    }
    if (e.kind === "weaponType") pr.weaponType = e.id; else pr.bowType = e.id;
    refreshGear();
    sfx.equip();
    return shopNote(`${e.item.name} 장착! (강화 레벨은 그대로)`, "#7dffb0");
  }
  if (e.kind === "arrows") {
    const it = e.item, max = CONFIG.player.maxArrows;
    if (arrowCount(it.id) >= max) return shopNote(`${josa(it.name, "은/는")} ${max}개까지만 가질 수 있어요`, "#ddd");
    if (pr.emeralds < it.price) return notEnough(it.price);
    pr.emeralds -= it.price;
    if (it.id === "normal") pr.arrows = Math.min(max, pr.arrows + it.pack);
    else pr.special[it.id] = Math.min(max, (pr.special[it.id] || 0) + it.pack);
    saveProfile(); sfx.buy();
    return shopNote(`${it.name} ${it.pack}개를 샀어요! (${arrowCount(it.id)}개)`, "#7dffb0");
  }
  if (pr.potions >= CONFIG.player.maxPotions) return shopNote(`물약은 ${CONFIG.player.maxPotions}개까지만 가질 수 있어요`, "#ddd");
  if (pr.emeralds < POTION.price) return notEnough(POTION.price);
  pr.emeralds -= POTION.price; pr.potions++;
  saveProfile(); sfx.buy();
  shopNote(`물약을 샀어요! (${pr.potions}개)`, "#7dffb0");
}

function drawShop() {
  const W = view.w, H = view.h, pr = game.profile;
  const pw = Math.min(960, W - 24), ph = Math.min(560, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("상인의 가게", x0 + 24, y0 + 40, 26, "#ffe27a");
  drawEmeraldIcon(x0 + pw - 150, y0 + 30, 12);
  text(`${pr.emeralds}`, x0 + pw - 132, y0 + 39, 22, "#fff");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  const catW = (pw - 40 - 10 * (SHOP_CATS.length - 1)) / SHOP_CATS.length;
  SHOP_CATS.forEach((name, i) => drawButton(x0 + 20 + i * (catW + 10), y0 + 60, catW, 40, name, () => setShopCat(i), { selected: shop.cat === i, size: 16 }));
  if (shop.cat === SELL_CAT) { drawSellTab(x0, y0, pw, ph); drawShopNote(x0, y0, ph); return; }
  text("장비를 더 세게 하려면 대장장이에서 부품으로 강화하세요", x0 + 24, y0 + 124, 13, "#999");

  const entries = shopEntries();
  const top = y0 + 136, bottom = y0 + ph - 64;
  const colW = (pw - 52) / 2;
  const rows = Math.ceil(entries.length / 2);
  const rowH = Math.min(70, (bottom - top) / rows);
  entries.forEach((e, i) => {
    const cx = x0 + 20 + (i % 2) * (colW + 12), ry = top + Math.floor(i / 2) * rowH;
    const sel = shop.sel === i;
    roundRectPath(cx, ry, colW, rowH - 6, 8);
    ctx.fillStyle = sel ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.04)"; ctx.fill();
    if (sel) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
    addUI(cx, ry, colW, rowH - 6, () => { if (shop.sel === i) shopAction(); else shop.sel = i; });
    let desc = "", right = "", rightColor = "#fff", price = null;
    if (e.kind === "weaponType" || e.kind === "bowType") {
      const owned = (e.kind === "weaponType" ? pr.weaponTypes : pr.bowTypes).includes(e.id);
      const using = e.kind === "weaponType" ? pr.weaponType === e.id : pr.bowType === e.id;
      desc = e.kind === "weaponType" ? TYPE_DESC[e.id] : BOW_DESC[e.id];
      if (using) { right = "사용 중"; rightColor = "#7dffb0"; }
      else if (owned) { right = "장착하기"; rightColor = "#7dd3ff"; }
      else price = e.item.price;
    } else if (e.kind === "arrows") { desc = `${e.item.desc} · ${e.item.pack}개 묶음 · ${arrowCount(e.id)}개 있음`; price = e.item.price; }
    else { desc = `던전에서 마시면 하트 ${POTION.heal}개 회복 · ${pr.potions}/${CONFIG.player.maxPotions}`; price = POTION.price; }
    ctx.fillStyle = e.item.color || (e.kind === "potion" ? "#c64fa0" : "#a0784a");
    ctx.fillRect(cx + 10, ry + rowH / 2 - 14, 20, 20);
    text(e.item.name, cx + 40, ry + 25, 18, "#fff");
    text(desc, cx + 40, ry + 47, 12, "#aaa");
    if (price !== null) {
      text(`${price}`, cx + colW - 12, ry + 30, 18, pr.emeralds >= price ? "#fff" : "#ff8080", "right");
      drawEmeraldIcon(cx + colW - 22 - String(price).length * 10, ry + 24, 8);
    } else text(right, cx + colW - 12, ry + 30, 15, rightColor, "right");
  });
  const e = entries[shop.sel];
  if (e) {
    const owned = e.kind === "weaponType" ? pr.weaponTypes.includes(e.id) : e.kind === "bowType" ? pr.bowTypes.includes(e.id) : false;
    drawButton(x0 + pw - 170, y0 + ph - 54, 150, 42, owned ? "장착하기" : e.kind.endsWith("Type") ? "열기" : "사기", shopAction, { color: "rgba(80,200,120,0.35)", size: 19 });
  }
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
// 팔 수 있는 것: 화살, 물약, 연 무기·활 종류 (부품은 돈처럼 쓰는 거라 못 팔아요)
function sellEntries() {
  const pr = game.profile, out = [];
  // 부품(조각·보스 부품)은 돈처럼 쓰는 거라 팔지 않아요
  for (const at of ARROW_TYPES) {
    const n = arrowCount(at.id);
    if (n < at.pack) continue;
    out.push({ kind: "arrows", id: at.id, name: at.name, color: at.color, count: n, unit: at.pack, price: SELL.arrowPack[at.id] || 1 });
  }
  if (pr.potions > 0) out.push({ kind: "potion", id: "potion", name: POTION.name, color: "#c64fa0", count: pr.potions, unit: 1, price: SELL.potion });
  for (const id of pr.weaponTypes) {
    const t = WEAPON_TYPES[id]; if (!t) continue;
    out.push({ kind: "weaponType", id, name: t.name, color: "#a0784a", count: 1, unit: 1, price: Math.floor(t.price * SELL.typeRate), free: !t.price, using: pr.weaponType === id });
  }
  for (const id of pr.bowTypes) {
    const t = BOW_TYPES[id]; if (!t) continue;
    out.push({ kind: "bowType", id, name: t.name, color: "#b07a2a", count: 1, unit: 1, price: Math.floor(t.price * SELL.typeRate), free: !t.price, using: pr.bowType === id });
  }
  return out;
}

function sellCannot(e) {
  if (e.kind === "weaponType" || e.kind === "bowType") {
    if (e.free) return "기본 무기·활은 팔 수 없어요";
    if (e.using) return "쓰고 있는 건 못 팔아요 (다른 걸 장착하고 팔아요)";
  }
  return null;
}

// all: 모두 팔기
function sellItem(e, all) {
  if (!e) return;
  const pr = game.profile;
  const why = sellCannot(e);
  if (why) { sfx.denied(); return shopNote(why, "#ffb070"); }
  // 무기·활 종류와 "모두 팔기"는 한 번 더 눌러야 팔아요 (실수 막기)
  const key = `${e.kind}:${e.id}:${all ? "all" : "one"}`;
  const needConfirm = e.kind === "weaponType" || e.kind === "bowType" || (all && e.count / e.unit > 1);
  if (needConfirm && shop.confirm !== key) {
    shop.confirm = key;
    const n = all ? Math.floor(e.count / e.unit) : 1;
    return shopNote(`한 번 더 누르면 ${josa(e.name + (n > 1 ? ` ${n * e.unit}개` : ""), "을/를")} 팔아요 (+${n * e.price})`, "#ffe27a");
  }
  shop.confirm = null;
  const packs = all ? Math.floor(e.count / e.unit) : 1;
  if (packs <= 0) return;
  const qty = packs * e.unit, gain = packs * e.price;
  if (e.kind === "arrows") { if (e.id === "normal") pr.arrows -= qty; else pr.special[e.id] -= qty; }
  else if (e.kind === "potion") pr.potions -= qty;
  else if (e.kind === "weaponType") pr.weaponTypes = pr.weaponTypes.filter((x) => x !== e.id);
  else if (e.kind === "bowType") pr.bowTypes = pr.bowTypes.filter((x) => x !== e.id);
  pr.emeralds += gain;
  if (e.kind === "weaponType" || e.kind === "bowType") refreshGear(); else saveProfile();
  sfx.buy();
  shopNote(`${josa(e.name + (qty > 1 ? ` ${qty}개` : ""), "을/를")} 팔았어요! 에메랄드 +${gain}`, "#7dffb0");
  hookRun("itemSold", e, qty, gain);
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
  text("화살·물약·무기 종류를 팔고 에메랄드를 받아요 (부품은 강화에 쓰는 거라 못 팔아요)", x0 + 24, y0 + 124, 13, "#999");
  if (!list.length) { text("팔 수 있는 게 없어요. 던전에서 부품을 모아 와요!", x0 + pw / 2, y0 + ph / 2, 18, "#ccc", "center"); return; }
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
    ctx.fillStyle = e.color; ctx.fillRect(cx + 10, ry + 12, 20, 20);
    const countTxt = e.kind === "weaponType" || e.kind === "bowType" ? (e.kind === "weaponType" ? "무기 종류" : "활 종류") : `${e.count}개`;
    text(e.name, cx + 40, ry + 25, 17, "#fff");
    let sub = countTxt + (e.unit > 1 ? ` · ${e.unit}개에 ${e.price}` : ` · 1개에 ${e.price}`);
    text(sub, cx + 40, ry + 45, 12, "#aaa");
    if (why) text(e.using ? "사용 중" : "기본", cx + colW - 12, ry + 30, 14, "#888", "right");
    else {
      const bw = Math.min(86, colW * 0.22), bh = Math.min(32, rowH - 26);
      const many = e.count / e.unit > 1;
      const conf1 = shop.confirm === `${e.kind}:${e.id}:one`, confA = shop.confirm === `${e.kind}:${e.id}:all`;
      drawButton(cx + colW - (many ? 2 * bw + 18 : bw + 10), ry + (rowH - 6 - bh) / 2, bw, bh, conf1 ? "정말?" : `팔기 +${e.price}`, () => { shop.sel = i; sellItem(e, false); }, { size: 13, color: conf1 ? "rgba(255,200,60,0.5)" : "rgba(80,200,120,0.35)" });
      if (many) drawButton(cx + colW - bw - 10, ry + (rowH - 6 - bh) / 2, bw, bh, confA ? "정말?" : `모두 +${Math.floor(e.count / e.unit) * e.price}`, () => { shop.sel = i; sellItem(e, true); }, { size: 13, color: confA ? "rgba(255,200,60,0.5)" : "rgba(60,160,220,0.35)" });
    }
  });
  if (pages > 1) {
    drawButton(x0 + pw - 220, y0 + ph - 54, 56, 42, "◀", () => { shop.page = (shop.page + pages - 1) % pages; shop.sel = shop.page * SELL_PER_PAGE; shop.confirm = null; }, { size: 18 });
    text(`${shop.page + 1} / ${pages}`, x0 + pw - 130, y0 + ph - 26, 16, "#ddd", "center");
    drawButton(x0 + pw - 96, y0 + ph - 54, 56, 42, "▶", () => { shop.page = (shop.page + 1) % pages; shop.sel = shop.page * SELL_PER_PAGE; shop.confirm = null; }, { size: 18 });
  }
}
