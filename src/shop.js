// ===== 상인의 가게: 사기와 팔기 =====
// 위쪽 "사기/팔기", 그 아래 종류(근접 무기 / 활 / 화살·물약 / 갑옷)를 고르고
// 물건을 누르면 고르고, 한 번 더 누르거나 아래 버튼을 누르면 사기/팔기

const shop = { tab: "buy", cat: 0, sel: 0, note: "", noteColor: "#fff", noteTimer: 0 };
const SHOP_CATS = ["근접 무기", "활", "화살 · 물약", "갑옷"];
const TYPE_NAMES = { sword: "칼", dagger: "단검", spear: "창", axe: "도끼", hammer: "망치", scythe: "낫" };
const EFFECT_NAMES = { burn: "불붙이기", slow: "느리게", chain: "번개", heal: "처치 시 회복", emerald: "에메랄드 더" };

function openShop() {
  game.overlay = "shop";
  shop.sel = 0; shop.noteTimer = 0;
  sfx.equip();
}

function shopNote(msg, color = "#fff") {
  shop.note = msg; shop.noteColor = color; shop.noteTimer = 2.2;
}

function shopEntries() {
  const sellable = (list, kind) => list.filter((i) => !i.secret && i.price > 0 && owns(kind, i.id)).map((item) => ({ kind, item }));
  const c = shop.cat;
  if (shop.tab === "buy") {
    if (c === 0) return WEAPONS.filter((i) => !i.secret).map((item) => ({ kind: "weapon", item }));
    if (c === 1) return BOWS.filter((i) => !i.secret).map((item) => ({ kind: "bow", item }));
    if (c === 2) return [...ARROW_TYPES.map((item) => ({ kind: "arrows", item })), { kind: "potion", item: POTION }];
    return ARMORS.filter((i) => !i.secret).map((item) => ({ kind: "armor", item }));
  }
  if (c === 0) return sellable(WEAPONS, "weapon");
  if (c === 1) return sellable(BOWS, "bow");
  if (c === 2) return [];
  return sellable(ARMORS, "armor");
}

function setShopTab(tab) { shop.tab = tab; shop.sel = 0; if (tab === "sell" && shop.cat === 2) shop.cat = 0; }
function setShopCat(c) { shop.cat = c; shop.sel = 0; }

function updateShop(dt) {
  shop.noteTimer -= dt;
  for (let i = 0; i < 4; i++) if (wasPressed("Digit" + (i + 1))) setShopCat(i);
  if (wasPressed("Tab")) setShopTab(shop.tab === "buy" ? "sell" : "buy");
  const n = shopEntries().length;
  if (wasPressed("ArrowUp", "KeyW")) shop.sel -= 2;
  if (wasPressed("ArrowDown", "KeyS")) shop.sel += 2;
  if (wasPressed("ArrowLeft", "KeyA")) shop.sel -= 1;
  if (wasPressed("ArrowRight", "KeyD")) shop.sel += 1;
  shop.sel = Math.max(0, Math.min(n - 1, shop.sel));
  if (wasPressed("Enter", "Space")) shopAction();
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

function shopAction() {
  const entry = shopEntries()[shop.sel];
  if (!entry) return;
  if (shop.tab === "buy") buyEntry(entry);
  else sellEntry(entry);
}

function notEnough(price) {
  sfx.denied();
  shopNote(`에메랄드가 ${price - game.profile.emeralds}개 모자라요`, "#ff8080");
}

function buyEntry({ kind, item }) {
  const pr = game.profile;
  if (kind === "arrows") {
    const max = CONFIG.player.maxArrows;
    if (arrowCount(item.id) >= max) return shopNote(`${item.name}은 ${max}개까지만 가질 수 있어요`, "#ddd");
    if (pr.emeralds < item.price) return notEnough(item.price);
    pr.emeralds -= item.price;
    if (item.id === "normal") pr.arrows = Math.min(max, pr.arrows + item.pack);
    else pr.special[item.id] = Math.min(max, (pr.special[item.id] || 0) + item.pack);
    saveProfile();
    sfx.buy();
    return shopNote(`${item.name} ${item.pack}개를 샀어요! (${arrowCount(item.id)}개)`, "#7dffb0");
  }
  if (kind === "potion") {
    if (pr.potions >= CONFIG.player.maxPotions) return shopNote(`물약은 ${CONFIG.player.maxPotions}개까지만 가질 수 있어요`, "#ddd");
    if (pr.emeralds < item.price) return notEnough(item.price);
    pr.emeralds -= item.price;
    pr.potions++;
    saveProfile();
    sfx.buy();
    return shopNote(`물약을 샀어요! (${pr.potions}개)`, "#7dffb0");
  }
  if (owns(kind, item.id)) {
    equipItem(kind, item);
    sfx.equip();
    return shopNote(`${item.name} 장착!`, "#7dd3ff");
  }
  if (pr.emeralds < item.price) return notEnough(item.price);
  pr.emeralds -= item.price;
  ownedList(kind).push(item.id);
  equipItem(kind, item);
  sfx.buy();
  shopNote(`${item.name}${josa(item.name, "을", "를")} 샀어요!`, "#7dffb0");
}

function sellEntry({ kind, item }) {
  const pr = game.profile;
  const list = ownedList(kind);
  const i = list.indexOf(item.id);
  if (i < 0) return;
  list.splice(i, 1);
  // 강화한 만큼 조금 더 쳐줘요
  const price = sellPrice(item) + upgradeLevel(kind, item.id) * 2;
  delete pr.upgrades[kind + ":" + item.id];
  pr.emeralds += price;
  if (kind === "weapon" && pr.weapon === item.id) equipItem("weapon", WEAPONS[0]);
  if (kind === "armor" && pr.armor === item.id) equipItem("armor", ARMORS[0]);
  if (kind === "bow" && pr.bow === item.id) equipItem("bow", BOWS[0]);
  saveProfile();
  sfx.emerald();
  shop.sel = Math.max(0, Math.min(shopEntries().length - 1, shop.sel));
  shopNote(`${item.name}${josa(item.name, "을", "를")} 팔았어요! 에메랄드 +${price}`, "#7dffb0");
}

function itemStats({ kind, item }) {
  if (kind === "weapon") {
    const speed = item.cooldown <= 0.3 ? "빠름" : item.cooldown <= 0.45 ? "보통" : "느림";
    let s = `${TYPE_NAMES[item.type] || "칼"} · 공격력 ${item.damage} · ${speed}`;
    if (item.effect) s += ` · ${EFFECT_NAMES[item.effect]}`;
    return s;
  }
  if (kind === "bow") {
    let s = `공격력 ${item.damage}`;
    if (item.multishot) s += ` · ${item.multishot}발씩`;
    if (item.pierce) s += ` · ${item.pierce}마리 뚫기`;
    s += item.cooldown <= 0.3 ? " · 아주 빠름" : item.cooldown <= 0.5 ? " · 빠름" : item.cooldown <= 0.65 ? " · 보통" : " · 느림";
    return s;
  }
  if (kind === "arrows") return `${item.desc} · ${item.pack}개 묶음`;
  if (kind === "armor") {
    const bits = [item.block > 0 ? `막기 ${Math.round(item.block * 100)}%` : "못 막아요"];
    if (item.speed > 0) bits.push(`빠름 +${Math.round(item.speed * 100)}%`);
    if (item.speed < 0) bits.push(`느림 ${Math.round(item.speed * 100)}%`);
    if (item.roll) bits.push("구르기 자주");
    if (item.hearts) bits.push(`하트 +${item.hearts}`);
    if (item.thorns) bits.push("가시 반사");
    if (item.frost) bits.push("때린 몹 느리게");
    if (item.regen) bits.push("체력 재생");
    return bits.join(" · ");
  }
  return `던전에서 마시면 하트 ${item.heal}개 회복`;
}

function drawShop() {
  const W = view.w, H = view.h;
  const pr = game.profile;
  const pw = Math.min(1000, W - 24), ph = Math.min(640, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);

  text("상인의 가게", x0 + 24, y0 + 40, 26, "#ffe27a");
  drawEmeraldIcon(x0 + pw - 150, y0 + 30, 12);
  text(`${pr.emeralds}`, x0 + pw - 132, y0 + 39, 22, "#fff");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });

  // 사기/팔기
  drawButton(x0 + 190, y0 + 14, 90, 36, "사기", () => setShopTab("buy"), { selected: shop.tab === "buy" });
  drawButton(x0 + 288, y0 + 14, 90, 36, "팔기", () => setShopTab("sell"), { selected: shop.tab === "sell" });
  // 종류
  const catW = (pw - 40 - 30) / 4;
  SHOP_CATS.forEach((name, i) => {
    if (shop.tab === "sell" && i === 2) return;
    drawButton(x0 + 20 + i * (catW + 10), y0 + 62, catW, 40, name, () => setShopCat(i), { selected: shop.cat === i, size: 16 });
  });

  const entries = shopEntries();
  const top = y0 + 116, bottom = y0 + ph - 70;
  const colW = (pw - 52) / 2;
  const rows = Math.max(1, Math.ceil(entries.length / 2));
  const rowH = Math.min(62, (bottom - top) / rows);
  if (!entries.length) text(shop.tab === "sell" ? "팔 물건이 없어요" : "", x0 + 30, top + 30, 16, "#777");
  entries.forEach((entry, i) => {
    const cx = x0 + 20 + (i % 2) * (colW + 12);
    const ry = top + Math.floor(i / 2) * rowH;
    const selected = shop.sel === i;
    const { kind, item } = entry;
    const consumable = kind === "potion" || kind === "arrows";
    const equipped = (kind === "weapon" && pr.weapon === item.id) || (kind === "armor" && pr.armor === item.id) || (kind === "bow" && pr.bow === item.id);
    const own = !consumable && owns(kind, item.id);

    roundRectPath(cx, ry, colW, rowH - 5, 8);
    ctx.fillStyle = selected ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.04)";
    ctx.fill();
    if (selected) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
    addUI(cx, ry, colW, rowH - 5, () => { if (shop.sel === i) shopAction(); else shop.sel = i; });

    ctx.fillStyle = item.color || item.body || (kind === "potion" ? "#c64fa0" : CONFIG.colors.player.shirt);
    ctx.fillRect(cx + 10, ry + (rowH - 5) / 2 - 11, 22, 22);
    const name = consumable ? item.name : itemLabel(kind, item);
    const small = rowH < 52;
    text(name, cx + 42, ry + (small ? 20 : 24), small ? 15 : 17, "#fff");
    text(itemStats(entry), cx + 42, ry + (small ? 37 : 44), 12, "#aaa");

    const rx = cx + colW - 10, my = ry + 22;
    const priceTag = (n, color) => { text(`${n}`, rx, my, 17, color, "right"); drawEmeraldIcon(rx - 12 - String(n).length * 10, my - 6, 8); };
    if (shop.tab === "sell") {
      priceTag(`+${sellPrice(item) + upgradeLevel(kind, item.id) * 2}`, "#7dffb0");
      if (equipped) text("쓰는 중", rx, my + 19, 11, "#7dd3ff", "right");
    } else if (equipped) text("장착중", rx, my + 4, 15, "#7dffb0", "right");
    else if (own) text("가지고 있음", rx, my + 4, 13, "#7dd3ff", "right");
    else {
      priceTag(item.price, pr.emeralds >= item.price ? "#fff" : "#ff8080");
      if (kind === "potion") text(`${pr.potions}/${CONFIG.player.maxPotions}`, rx, my + 19, 11, "#ccc", "right");
      if (kind === "arrows") text(`${arrowCount(item.id)}개 있음`, rx, my + 19, 11, "#ccc", "right");
    }
  });

  const entry = entries[shop.sel];
  let label = null;
  if (entry) {
    if (shop.tab === "sell") label = "팔기";
    else if (entry.kind === "potion" || entry.kind === "arrows") label = "사기";
    else label = owns(entry.kind, entry.item.id) ? "장착하기" : "사기";
  }
  if (label) drawButton(x0 + pw - 170, y0 + ph - 56, 150, 42, label, shopAction, { color: "rgba(80,200,120,0.35)", size: 19 });
  if (shop.noteTimer > 0) {
    ctx.globalAlpha = Math.min(1, shop.noteTimer * 2);
    text(shop.note, x0 + 24, y0 + ph - 28, 17, shop.noteColor);
    ctx.globalAlpha = 1;
  }
}
