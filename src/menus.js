// ===== 메뉴, 결과 화면 =====

const menu = { index: 0 };

function closeOverlay() {
  game.overlay = null;
}

function menuItems() {
  const items = [{ label: "계속하기", act: closeOverlay }];
  if (game.scene === "dungeon") items.push({ label: "로비로 돌아가기", act: () => { closeOverlay(); leaveRunToLobby(); } });
  if (game.scene === "lobby") {
    // 난이도와 하드모드는 캠프에서만 바꿔요 (다음 맵부터 적용)
    const order = ["easy", "normal", "hard", "nightmare"];
    const pr = game.profile;
    items.push({ label: `난이도: ${DIFFICULTY[pr.difficulty].name} (바꾸기)`, act: () => setRoomRule("diff", order[(order.indexOf(pr.difficulty) + 1) % order.length]) });
    items.push({ label: pr.hardMode ? "하드모드: 켜짐 (끄기)" : "하드모드: 꺼짐 (켜기)", act: () => setRoomRule("hard", !pr.hardMode) });
  }
  items.push({ label: muted ? "소리 켜기" : "소리 끄기", act: () => { muted = !muted; } });
  if (canFullscreen()) items.push({ label: isFullscreen() ? "전체 화면 끄기" : "전체 화면", act: () => { toggleFullscreen(); closeOverlay(); } });
  hookRun("menuItems", items); // 다른 파일이 메뉴 항목을 더해요 (예: 목소리 안내, 저장 코드)
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
  const L = menuLayout(items.length);
  if (L.cols === 2 && wasPressed("ArrowRight", "KeyD", "ArrowLeft", "KeyA")) menu.index = (menu.index + L.rows) % (L.rows * 2) % items.length;
  if (wasPressed("Enter", "Space")) items[menu.index].act();
  else if (wasPressed("Escape")) closeOverlay();
}

// 항목이 많으면 (휴대폰 화면에서 넘치면) 두 줄(열)로 나눠요
function menuLayout(n) {
  const H = view.h - 24, W = view.w - 24;
  const one = 80 + n * 56;
  const cols = one > H && W >= 640 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const bh = Math.max(34, Math.min(48, (H - 80) / rows - 8));
  const colW = cols === 2 ? Math.min(330, (W - 72) / 2) : 332;
  const pw = cols * colW + (cols - 1) * 16 + 48;
  const ph = 72 + rows * (bh + 8);
  return { cols, rows, bh, colW, pw, ph };
}

function drawMenu() {
  const items = menuItems();
  const L = menuLayout(items.length);
  const x0 = (view.w - L.pw) / 2, y0 = Math.max(8, (view.h - L.ph) / 2);
  drawPanel(x0, y0, L.pw, L.ph);
  text("메뉴", view.w / 2, y0 + 40, 24, "#ffe27a", "center");
  items.forEach((it, i) => {
    const c = Math.floor(i / L.rows), r = i % L.rows;
    drawButton(x0 + 24 + c * (L.colW + 16), y0 + 58 + r * (L.bh + 8), L.colW, L.bh, it.label, it.act, { selected: menu.index === i, size: L.bh < 42 ? 15 : 17 });
  });
}

// ----- 던전 결과 (클리어 / 쓰러짐) -----
function updateResult() { if (hookAny("resultUpdate")) return; return updateResultBase(); }
function updateResultBase() {
  if (wasPressed("Enter", "Space", "KeyR", "Escape")) finishResult();
}

// 같이 하기: 누가 누르든 다 같이 (친구 기기는 방장에게 부탁해요: netplay.js 훅)
function finishResult() { if (hookAny("finishResult")) return; return finishResultBase(); }
function finishResultBase() {
  game.result = null;
  closeOverlay();
  enterLobby();
}

function drawResult() { if (hookAny("resultDraw")) return; return drawResultBase(); }
function drawResultBase() {
  const r = game.result;
  const pw = Math.min(660, view.w - 24), ph = Math.min(view.h - 16, 430);
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
  if (r.money && Object.keys(r.money).length) lines.push("화폐: " + Object.entries(r.money).map(([id, n]) => `${CUR[id].name} ${n}`).join(", "));
  if (r.items && r.items.length) { const its = r.items.map((u) => findItem(u)).filter(Boolean).map((f) => f.it); if (its.length) lines.push(`장비 ${its.length}개: ` + its.slice(0, 3).map((it) => `${RARITIES[it.r].name} ${itemName(it)}`).join(", ") + (its.length > 3 ? " ..." : "")); }
  if (r.mats && Object.keys(r.mats).length) lines.push("부품: " + Object.entries(r.mats).map(([id, n]) => `${(MATERIALS[id] || { name: id }).name} ${n}`).join(", "));
  if (r.levels > 0) lines.push(`레벨 업! 지금 레벨 ${game.profile.level}`);
  if (!r.win) lines.push("모은 에메랄드와 경험치는 그대로예요");
  const small = (l) => /^(부품|화폐|장비)/.test(l);
  const lh = lines.length > 6 ? 26 : 30;
  lines.forEach((l, i) => text(l, cx, y0 + 138 + i * lh, small(l) ? 16 : 18, l.startsWith("레벨 업") ? "#ffe27a" : l.startsWith("장비") ? "#c8a8ff" : small(l) ? "#7dd3ff" : "#fff", "center"));
  drawButton(cx - 100, y0 + ph - 64, 200, 46, "로비로", finishResult, { color: "rgba(80,200,120,0.35)", size: 20 });
  // 빈 칸 (글줄 아래 ~ 버튼 위): 다른 파일이 안내를 넣어요 (guide.js 쓰러진 이유)
  hookRun("resultSlot", cx, y0 + 138 + (lines.length - 1) * lh + 16, y0 + ph - 72, pw, y0 + ph);
}

// 던전에서 메뉴 "로비로 돌아가기" (같이 하기: 누가 눌러도 다 같이)
function leaveRunToLobby() { if (hookAny("leaveRun")) return; return enterLobby("로비로 돌아왔어요"); }
// 방 규칙: 난이도·하드모드 (같이 하기: 방장 규칙으로 다 같이. 친구가 바꾸면 방장에게 부탁해요)
function setRoomRule(kind, value) { if (hookAny("setRoomRule", kind, value)) return; return setRoomRuleBase(kind, value); }
function setRoomRuleBase(kind, value) {
  const pr = game.profile;
  if (kind === "diff" && Object.hasOwn(DIFFICULTY, value)) {
    pr.difficulty = value;
    const d = DIFFICULTY[value];
    showMessage(`난이도 ${d.name}: 몬스터 체력 x${d.hp} · 공격 x${d.dmg} · 보상 x${d.reward}`, 2.5);
  } else if (kind === "hard") {
    pr.hardMode = !!value;
    showMessage(pr.hardMode ? "하드모드! 쓰러지면 맵을 처음부터 (보상 x1.25)" : "하드모드 끔: 쓰러지면 보스방 앞에서 다시 도전", 3);
  } else return;
  saveProfile();
}
