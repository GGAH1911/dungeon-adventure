// ===== 메뉴, 결과 화면 =====

const menu = { index: 0 };

function closeOverlay() {
  game.overlay = null;
}

function menuItems() {
  const items = [{ label: "계속하기", act: closeOverlay }];
  if (game.scene === "dungeon") items.push({ label: "로비로 돌아가기", act: () => { closeOverlay(); enterLobby("로비로 돌아왔어요"); } });
  items.push({ label: muted ? "소리 켜기" : "소리 끄기", act: () => { muted = !muted; } });
  items.push({ label: "치트", act: () => { closeOverlay(); openCheat(); } });
  if (game.scene === "lobby") items.push({ label: "처음 화면으로", act: () => { closeOverlay(); game.scene = "title"; } });
  return items;
}

function openMenu() {
  game.overlay = "menu";
  menu.index = 0;
}

function updateMenu() {
  const items = menuItems();
  if (wasPressed("ArrowUp", "KeyW")) menu.index = (menu.index + items.length - 1) % items.length;
  if (wasPressed("ArrowDown", "KeyS")) menu.index = (menu.index + 1) % items.length;
  if (wasPressed("Enter", "Space")) items[menu.index].act();
  else if (wasPressed("Escape")) closeOverlay();
}

function drawMenu() {
  const items = menuItems();
  const pw = 320, bh = 52, ph = 80 + items.length * (bh + 10);
  const x0 = (view.w - pw) / 2, y0 = (view.h - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("메뉴", view.w / 2, y0 + 44, 26, "#ffe27a", "center");
  items.forEach((it, i) => {
    drawButton(x0 + 24, y0 + 64 + i * (bh + 10), pw - 48, bh, it.label, it.act, { selected: menu.index === i, size: 19 });
  });
}

// ----- 던전 결과 (클리어 / 쓰러짐) -----
function updateResult() {
  if (wasPressed("Enter", "Space", "KeyR", "Escape")) finishResult();
}

function finishResult() {
  game.result = null;
  closeOverlay();
  enterLobby();
}

function drawResult() {
  const r = game.result;
  const pw = Math.min(520, view.w - 24), ph = 330;
  const x0 = (view.w - pw) / 2, y0 = (view.h - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  const cx = view.w / 2;
  if (r.win) {
    text("던전 클리어!", cx, y0 + 60, 40, rainbow(game.time * 200, 70), "center");
  } else {
    text("쓰러졌어요...", cx, y0 + 60, 38, "#ff8080", "center");
  }
  text(r.mapName, cx, y0 + 95, 18, "#ddd", "center");
  const lines = [
    `처치한 몬스터  ${r.kills}마리`,
    `모은 에메랄드  ${r.emeralds}개` + (r.bonus ? `  + 클리어 보너스 ${r.bonus}개` : ""),
    `얻은 경험치  ${r.xp}`,
  ];
  if (r.levels > 0) lines.push(`레벨 업! 지금 레벨 ${game.profile.level}`);
  if (!r.win) lines.push("모은 에메랄드와 경험치는 그대로예요");
  lines.forEach((l, i) => text(l, cx, y0 + 140 + i * 30, 18, i === 3 && r.levels > 0 ? "#ffe27a" : "#fff", "center"));
  drawButton(cx - 100, y0 + ph - 64, 200, 46, "로비로", finishResult, { color: "rgba(80,200,120,0.35)", size: 20 });
}
