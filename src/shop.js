// ===== 상인의 가게: 사기와 팔기 =====
// 키보드: 방향키로 고르고 엔터, Tab 으로 사기/팔기 바꾸기, E 나 ESC 로 닫기
// 터치: 물건을 누르면 고르고, 한 번 더 누르거나 아래 버튼을 누르면 사기/팔기

const shop = { tab: "buy", col: 0, row: 0, note: "", noteColor: "#fff", noteTimer: 0 };

function openShop() {
  game.overlay = "shop";
  shop.col = 0; shop.row = 0; shop.noteTimer = 0;
  sfx.equip();
}

function shopNote(msg, color = "#fff") {
  shop.note = msg; shop.noteColor = color; shop.noteTimer = 2.2;
}

// 지금 탭에 보이는 물건 [근접 무기, 활·화살, 갑옷·물약]
function shopColumns() {
  const sellable = (list, kind) => list.filter((i) => !i.secret && i.price > 0 && owns(kind, i.id)).map((item) => ({ kind, item }));
  if (shop.tab === "buy") {
    const w = WEAPONS.filter((i) => !i.secret).map((item) => ({ kind: "weapon", item }));
    const b = BOWS.filter((i) => !i.secret).map((item) => ({ kind: "bow", item }));
    b.push({ kind: "arrows", item: ARROW_PACK });
    const a = ARMORS.filter((i) => !i.secret).map((item) => ({ kind: "armor", item }));
    a.push({ kind: "potion", item: POTION });
    return [w, b, a];
  }
  return [sellable(WEAPONS, "weapon"), sellable(BOWS, "bow"), sellable(ARMORS, "armor")];
}

function setShopTab(tab) {
  shop.tab = tab; shop.col = 0; shop.row = 0;
}

function updateShop(dt) {
  shop.noteTimer -= dt;
  let cols = shopColumns();
  if (wasPressed("Tab", "Digit1", "Digit2")) setShopTab(pressed.Digit1 ? "buy" : pressed.Digit2 ? "sell" : shop.tab === "buy" ? "sell" : "buy");
  cols = shopColumns();
  if (wasPressed("ArrowUp", "KeyW")) shop.row--;
  if (wasPressed("ArrowDown", "KeyS")) shop.row++;
  if (wasPressed("ArrowLeft", "KeyA")) shop.col = Math.max(0, shop.col - 1);
  if (wasPressed("ArrowRight", "KeyD")) shop.col = Math.min(2, shop.col + 1);
  if (cols[shop.col].length === 0) {
    const other = cols.findIndex((c) => c.length > 0);
    if (other >= 0) shop.col = other;
  }
  shop.row = Math.max(0, Math.min(cols[shop.col].length - 1, shop.row));
  if (wasPressed("Enter", "Space")) shopAction();
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

function shopAction() {
  const entry = shopColumns()[shop.col][shop.row];
  if (!entry) return;
  if (shop.tab === "buy") buyEntry(entry);
  else sellEntry(entry);
}

function buyEntry({ kind, item }) {
  const pr = game.profile;
  if (kind === "arrows") {
    if (pr.arrows >= CONFIG.player.maxArrows) return shopNote(`화살은 ${CONFIG.player.maxArrows}개까지만 가질 수 있어요`, "#ddd");
    if (pr.emeralds < item.price) { sfx.denied(); return shopNote(`에메랄드가 ${item.price - pr.emeralds}개 모자라요`, "#ff8080"); }
    pr.emeralds -= item.price;
    pr.arrows = Math.min(CONFIG.player.maxArrows, pr.arrows + item.count);
    saveProfile();
    sfx.buy();
    return shopNote(`화살을 샀어요! (${pr.arrows}개)`, "#7dffb0");
  }
  if (kind === "potion") {
    if (pr.potions >= CONFIG.player.maxPotions) return shopNote(`물약은 ${CONFIG.player.maxPotions}개까지만 가질 수 있어요`, "#ddd");
    if (pr.emeralds < item.price) { sfx.denied(); return shopNote(`에메랄드가 ${item.price - pr.emeralds}개 모자라요`, "#ff8080"); }
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
  if (pr.emeralds < item.price) {
    sfx.denied();
    return shopNote(`에메랄드가 ${item.price - pr.emeralds}개 모자라요`, "#ff8080");
  }
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
  pr.emeralds += sellPrice(item);
  // 쓰던 걸 팔면 기본 장비로 바꿔요
  if (kind === "weapon" && pr.weapon === item.id) equipItem("weapon", WEAPONS[0]);
  if (kind === "armor" && pr.armor === item.id) equipItem("armor", ARMORS[0]);
  if (kind === "bow" && pr.bow === item.id) equipItem("bow", BOWS[0]);
  saveProfile();
  sfx.emerald();
  shopNote(`${item.name}${josa(item.name, "을", "를")} 팔았어요! 에메랄드 +${sellPrice(item)}`, "#7dffb0");
}

function itemStats({ kind, item }) {
  if (kind === "weapon") {
    const speed = item.cooldown <= 0.3 ? "빠름" : item.cooldown <= 0.45 ? "보통" : "느림";
    let s = `공격력 ${item.damage} · 거리 ${item.range} · ${speed}`;
    if (item.chain) s += " · 연쇄 번개";
    return s;
  }
  if (kind === "bow") {
    let s = `공격력 ${item.damage}`;
    if (item.multishot) s += ` · ${item.multishot}발씩`;
    if (item.pierce) s += ` · ${item.pierce}마리 뚫기`;
    s += item.cooldown <= 0.5 ? " · 빠름" : item.cooldown <= 0.65 ? " · 보통" : " · 느림";
    return s;
  }
  if (kind === "arrows") return `화살 ${item.count}개 (최대 ${CONFIG.player.maxArrows}개)`;
  if (kind === "armor") {
    let s = item.block > 0 ? `공격 막기 ${Math.round(item.block * 100)}%` : "아무것도 못 막아요";
    if (item.regen) s += " · 체력 재생";
    return s;
  }
  return `던전에서 마시면 하트 ${item.heal}개 회복`;
}

function drawShop() {
  const W = view.w, H = view.h;
  const pr = game.profile;
  const pw = Math.min(1120, W - 24), ph = Math.min(620, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);

  text("상인의 가게", x0 + 24, y0 + 42, 28, "#ffe27a");
  drawEmeraldIcon(x0 + pw - 150, y0 + 32, 12);
  text(`${pr.emeralds}`, x0 + pw - 132, y0 + 41, 22, "#fff");
  drawButton(x0 + pw - 58, y0 + 14, 42, 38, "✕", closeOverlay, { size: 20 });

  // 탭
  const tabY = y0 + 60;
  drawButton(x0 + 24, tabY, 110, 38, "사기", () => setShopTab("buy"), { selected: shop.tab === "buy" });
  drawButton(x0 + 142, tabY, 110, 38, "팔기", () => setShopTab("sell"), { selected: shop.tab === "sell" });
  if (shop.tab === "sell") text("파는 값은 산 값의 절반이에요", x0 + 270, tabY + 25, 14, "#aaa");

  const cols = shopColumns();
  const titles = shop.tab === "buy" ? ["근접 무기", "활 · 화살", "갑옷 · 물약"] : ["근접 무기", "활", "갑옷"];
  const gap = 12;
  const colW = (pw - 40 - gap * 2) / 3;
  const listTop = tabY + 70;
  const listBottom = y0 + ph - 70;
  const rowH = Math.min(58, (listBottom - listTop) / Math.max(1, ...cols.map((c) => c.length)));

  for (let c = 0; c < 3; c++) {
    const cx = x0 + 20 + c * (colW + gap);
    text(titles[c], cx + 6, listTop - 8, 16, "#bbb");
    if (cols[c].length === 0) text("팔 물건이 없어요", cx + 10, listTop + 30, 15, "#777");
    cols[c].forEach((entry, r) => {
      const ry = listTop + r * rowH;
      const selected = shop.col === c && shop.row === r;
      const { kind, item } = entry;
      const consumable = kind === "potion" || kind === "arrows";
      const equipped = (kind === "weapon" && pr.weapon === item.id) || (kind === "armor" && pr.armor === item.id) || (kind === "bow" && pr.bow === item.id);
      const own = !consumable && owns(kind, item.id);

      roundRectPath(cx, ry, colW, rowH - 5, 8);
      ctx.fillStyle = selected ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.04)";
      ctx.fill();
      if (selected) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
      addUI(cx, ry, colW, rowH - 5, () => {
        if (shop.col === c && shop.row === r) shopAction();
        else { shop.col = c; shop.row = r; }
      });

      const ix = cx + 8, iy = ry + (rowH - 5) / 2 - 10;
      ctx.fillStyle = item.color || item.body || (kind === "potion" ? "#c64fa0" : kind === "arrows" ? "#c9a36a" : CONFIG.colors.player.shirt);
      ctx.fillRect(ix, iy, 20, 20);

      const small = rowH < 50 || colW < 280;
      text(item.name, cx + 36, ry + (small ? 20 : 23), small ? 15 : 17, "#fff");
      text(itemStats(entry), cx + 36, ry + (small ? 37 : 43), 11, "#aaa");

      const rx = cx + colW - 8, my = ry + 21;
      const priceTag = (n, color) => {
        text(`${n}`, rx, my, 16, color, "right");
        drawEmeraldIcon(rx - 10 - String(n).length * 9, my - 6, 7);
      };
      if (shop.tab === "sell") {
        priceTag(`+${sellPrice(item)}`, "#7dffb0");
        if (equipped) text("쓰는 중", rx, my + 18, 11, "#7dd3ff", "right");
      } else if (equipped) text("장착중", rx, my, 14, "#7dffb0", "right");
      else if (own) text("가지고 있음", rx, my, 12, "#7dd3ff", "right");
      else {
        priceTag(item.price, pr.emeralds >= item.price ? "#fff" : "#ff8080");
        if (kind === "potion") text(`${pr.potions}/${CONFIG.player.maxPotions}`, rx, my + 18, 11, "#ccc", "right");
        if (kind === "arrows") text(`${pr.arrows}/${CONFIG.player.maxArrows}`, rx, my + 18, 11, "#ccc", "right");
      }
    });
  }

  // 아래: 실행 버튼과 안내
  const entry = cols[shop.col][shop.row];
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
  } else if (!touch.show) {
    text("방향키·엔터 · Tab: 사기/팔기 · E/ESC: 닫기", x0 + 24, y0 + ph - 28, 14, "#888");
  }
}
