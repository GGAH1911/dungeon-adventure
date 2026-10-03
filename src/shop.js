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

// 지금 탭에 보이는 물건 [왼쪽 줄, 오른쪽 줄]
function shopColumns() {
  const pr = game.profile;
  if (shop.tab === "buy") {
    const w = WEAPONS.filter((i) => !i.secret).map((item) => ({ kind: "weapon", item }));
    const a = ARMORS.filter((i) => !i.secret).map((item) => ({ kind: "armor", item }));
    a.push({ kind: "potion", item: POTION });
    return [w, a];
  }
  const w = WEAPONS.filter((i) => !i.secret && i.price > 0 && pr.weapons.includes(i.id)).map((item) => ({ kind: "weapon", item }));
  const a = ARMORS.filter((i) => !i.secret && i.price > 0 && pr.armors.includes(i.id)).map((item) => ({ kind: "armor", item }));
  return [w, a];
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
  if (wasPressed("ArrowLeft", "KeyA")) shop.col = 0;
  if (wasPressed("ArrowRight", "KeyD")) shop.col = 1;
  if (cols[shop.col].length === 0 && cols[1 - shop.col].length > 0) shop.col = 1 - shop.col;
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
  (kind === "weapon" ? pr.weapons : pr.armors).push(item.id);
  equipItem(kind, item);
  sfx.buy();
  shopNote(`${item.name}${josa(item.name, "을", "를")} 샀어요!`, "#7dffb0");
}

function sellEntry({ kind, item }) {
  const pr = game.profile;
  const list = kind === "weapon" ? pr.weapons : pr.armors;
  const i = list.indexOf(item.id);
  if (i < 0) return;
  list.splice(i, 1);
  pr.emeralds += sellPrice(item);
  // 입고 있던 걸 팔면 기본 장비로 바꿔요
  if (kind === "weapon" && pr.weapon === item.id) equipItem("weapon", WEAPONS[0]);
  if (kind === "armor" && pr.armor === item.id) equipItem("armor", ARMORS[0]);
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
  if (kind === "armor") {
    let s = item.block > 0 ? `공격 막기 ${Math.round(item.block * 100)}%` : "아무것도 못 막아요";
    if (item.regen) s += " · 체력 재생";
    return s;
  }
  return `던전에서 마시면 하트 ${item.heal}개 회복 (Q)`;
}

function drawShop() {
  const W = view.w, H = view.h;
  const pr = game.profile;
  const pw = Math.min(920, W - 24), ph = Math.min(600, H - 24);
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
  const titles = ["무기", shop.tab === "buy" ? "갑옷 · 물약" : "갑옷"];
  const colW = (pw - 60) / 2;
  const listTop = tabY + 70;
  const listBottom = y0 + ph - 70;
  const rowH = Math.min(58, (listBottom - listTop) / Math.max(1, cols[0].length, cols[1].length));

  for (let c = 0; c < 2; c++) {
    const cx = x0 + 20 + c * (colW + 20);
    text(titles[c], cx + 6, listTop - 8, 16, "#bbb");
    if (cols[c].length === 0) text("팔 물건이 없어요", cx + 10, listTop + 30, 15, "#777");
    cols[c].forEach((entry, r) => {
      const ry = listTop + r * rowH;
      const selected = shop.col === c && shop.row === r;
      const { kind, item } = entry;
      const equipped = (kind === "weapon" && pr.weapon === item.id) || (kind === "armor" && pr.armor === item.id);
      const own = kind !== "potion" && owns(kind, item.id);

      roundRectPath(cx, ry, colW, rowH - 5, 8);
      ctx.fillStyle = selected ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.04)";
      ctx.fill();
      if (selected) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
      addUI(cx, ry, colW, rowH - 5, () => {
        if (shop.col === c && shop.row === r) shopAction();
        else { shop.col = c; shop.row = r; }
      });

      const ix = cx + 10, iy = ry + (rowH - 5) / 2 - 11;
      ctx.fillStyle = item.color || item.body || (kind === "potion" ? "#c64fa0" : CONFIG.colors.player.shirt);
      ctx.fillRect(ix, iy, 22, 22);

      const small = rowH < 50;
      text(item.name, cx + 42, ry + (small ? 20 : 23), small ? 15 : 17, "#fff");
      text(itemStats(entry), cx + 42, ry + (small ? 37 : 43), small ? 11 : 12, "#aaa");

      const rx = cx + colW - 10, my = ry + (rowH - 5) / 2 + 6;
      if (shop.tab === "sell") {
        text(`+${sellPrice(item)}`, rx, my, 17, "#7dffb0", "right");
        drawEmeraldIcon(rx - 14 - String(sellPrice(item)).length * 10 - 10, my - 6, 8);
        if (equipped) text("장착중", rx - 60, my, 12, "#7dd3ff", "right");
      } else if (equipped) text("장착중", rx, my, 15, "#7dffb0", "right");
      else if (own) text("가지고 있음", rx, my, 13, "#7dd3ff", "right");
      else if (kind === "potion") {
        text(`${item.price}`, rx, my, 17, pr.emeralds >= item.price ? "#fff" : "#ff8080", "right");
        drawEmeraldIcon(rx - 12 - String(item.price).length * 10, my - 6, 8);
        text(`(${pr.potions}/${CONFIG.player.maxPotions})`, rx - 40, my, 12, "#ccc", "right");
      } else {
        text(`${item.price}`, rx, my, 17, pr.emeralds >= item.price ? "#fff" : "#ff8080", "right");
        drawEmeraldIcon(rx - 12 - String(item.price).length * 10, my - 6, 8);
      }
    });
  }

  // 아래: 실행 버튼과 안내
  const entry = cols[shop.col][shop.row];
  let label = null;
  if (entry) {
    if (shop.tab === "sell") label = "팔기";
    else if (entry.kind === "potion") label = "사기";
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
