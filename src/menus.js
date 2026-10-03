// ===== 메뉴, 결과 화면 =====

const menu = { index: 0 };

function closeOverlay() {
  game.overlay = null;
}

function menuItems() {
  const items = [{ label: "계속하기", act: closeOverlay }];
  if (game.scene === "dungeon") items.push({ label: "로비로 돌아가기", act: () => { closeOverlay(); enterLobby("로비로 돌아왔어요"); } });
  if (game.scene === "lobby") {
    // 난이도와 하드모드는 캠프에서만 바꿔요 (다음 맵부터 적용)
    const order = ["easy", "normal", "hard", "nightmare"];
    const pr = game.profile;
    items.push({ label: `난이도: ${DIFFICULTY[pr.difficulty].name} (바꾸기)`, act: () => {
      pr.difficulty = order[(order.indexOf(pr.difficulty) + 1) % order.length];
      saveProfile();
      const d = DIFFICULTY[pr.difficulty];
      showMessage(`난이도 ${d.name}: 몬스터 체력 x${d.hp} · 공격 x${d.dmg} · 보상 x${d.reward}`, 2.5);
    } });
    items.push({ label: pr.hardMode ? "하드모드: 켜짐 (끄기)" : "하드모드: 꺼짐 (켜기)", act: () => {
      pr.hardMode = !pr.hardMode;
      saveProfile();
      showMessage(pr.hardMode ? "하드모드! 쓰러지면 맵을 처음부터 (보상 x1.25)" : "하드모드 끔: 쓰러지면 보스방 앞에서 다시 도전", 3);
    } });
  }
  items.push({ label: muted ? "소리 켜기" : "소리 끄기", act: () => { muted = !muted; } });
  if (canFullscreen()) items.push({ label: isFullscreen() ? "전체 화면 끄기" : "전체 화면", act: () => { toggleFullscreen(); closeOverlay(); } });
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
  const pw = 380, bh = 48, ph = 80 + items.length * (bh + 8);
  const x0 = (view.w - pw) / 2, y0 = (view.h - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("메뉴", view.w / 2, y0 + 44, 26, "#ffe27a", "center");
  items.forEach((it, i) => {
    drawButton(x0 + 24, y0 + 64 + i * (bh + 8), pw - 48, bh, it.label, it.act, { selected: menu.index === i, size: 17 });
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
  const pw = Math.min(620, view.w - 24), ph = 370;
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
  if (r.mats && Object.keys(r.mats).length) lines.push("부품: " + Object.entries(r.mats).map(([id, n]) => `${MATERIALS[id].name} ${n}`).join(", "));
  if (r.levels > 0) lines.push(`레벨 업! 지금 레벨 ${game.profile.level}`);
  if (!r.win) lines.push("모은 에메랄드와 경험치는 그대로예요");
  lines.forEach((l, i) => text(l, cx, y0 + 138 + i * 30, l.startsWith("부품") ? 16 : 18, l.startsWith("레벨 업") ? "#ffe27a" : l.startsWith("부품") ? "#7dd3ff" : "#fff", "center"));
  drawButton(cx - 100, y0 + ph - 64, 200, 46, "로비로", finishResult, { color: "rgba(80,200,120,0.35)", size: 20 });
}
