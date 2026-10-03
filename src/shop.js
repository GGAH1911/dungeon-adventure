// ===== 상인의 가게 =====
// 무기 종류·활 종류 열기, 화살·물약 사기 (장비 강화는 대장장이에서 부품으로!)

const shop = { cat: 0, sel: 0, note: "", noteColor: "#fff", noteTimer: 0 };
const SHOP_CATS = ["무기 종류", "활 종류", "화살 · 물약"];
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
function setShopCat(c) { shop.cat = c; shop.sel = 0; }

function shopEntries() {
  if (shop.cat === 0) return WEAPON_TYPE_ORDER.map((id) => ({ kind: "weaponType", id, item: WEAPON_TYPES[id] }));
  if (shop.cat === 1) return BOW_TYPE_ORDER.map((id) => ({ kind: "bowType", id, item: BOW_TYPES[id] }));
  return [...ARROW_TYPES.map((item) => ({ kind: "arrows", id: item.id, item })), { kind: "potion", id: "potion", item: POTION }];
}

function updateShop(dt) {
  shop.noteTimer -= dt;
  for (let i = 0; i < 3; i++) if (wasPressed("Digit" + (i + 1))) setShopCat(i);
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
    if (arrowCount(it.id) >= max) return shopNote(`${it.name}은 ${max}개까지만 가질 수 있어요`, "#ddd");
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
  const catW = (pw - 40 - 20) / 3;
  SHOP_CATS.forEach((name, i) => drawButton(x0 + 20 + i * (catW + 10), y0 + 60, catW, 40, name, () => setShopCat(i), { selected: shop.cat === i, size: 16 }));
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
  if (shop.noteTimer > 0) {
    ctx.globalAlpha = Math.min(1, shop.noteTimer * 2);
    text(shop.note, x0 + 24, y0 + ph - 26, 17, shop.noteColor);
    ctx.globalAlpha = 1;
  }
}
