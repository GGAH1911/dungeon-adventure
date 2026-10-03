// ===== 화면 정보 (하트, 레벨, 에메랄드, 미니맵, 터치 버튼) =====

function drawHUD() { const r = drawHUDBase(); hookRun("hudDraw"); return r; }
function drawHUDBase() {
  const W = view.w, H = view.h;
  const p = game.player;
  const pr = game.profile;

  // 하트 (10개씩 한 줄)
  const hs = 22;
  const shown = Math.min(p.maxHp, 40); // 하트가 너무 많으면 40개까지만
  for (let i = 0; i < shown; i++) {
    const fill = p.hp >= i + 1 ? 1 : p.hp >= i + 0.5 ? 0.5 : 0;
    drawHeart(16 + (i % 10) * (hs + 4), 14 + Math.floor(i / 10) * (hs + 2), hs, fill);
  }
  let y = 14 + Math.ceil(shown / 10) * (hs + 2) + 6;
  if (p.maxHp > shown) { text(`${Math.ceil(p.hp)} / ${p.maxHp}`, 280, 34, 16); }

  // 레벨과 경험치 막대
  const need = xpNeeded(pr.level);
  text(`Lv ${pr.level}`, 16, y + 16, 18, "#7dd3ff");
  const bx = 70, bw = 190;
  ctx.fillStyle = "#2b2f38"; ctx.fillRect(bx, y + 4, bw, 10);
  ctx.fillStyle = "#56c7ff"; ctx.fillRect(bx, y + 4, bw * (pr.level >= CONFIG.level.max ? 1 : pr.xp / need), 10);
  y += 26;

  // 에메랄드, 물약
  drawEmeraldIcon(26, y + 10, 11);
  text(`${pr.emeralds}`, 42, y + 18, 20);
  ctx.fillStyle = "#c64fa0";
  ctx.fillRect(100, y + 1, 14, 18);
  ctx.fillStyle = "#ffd6f2"; ctx.fillRect(103, y - 3, 8, 5);
  text(`${pr.potions}`, 120, y + 18, 20);
  // 화살 (지금 쏠 화살 종류)
  const at = arrowTypeById(currentArrowType());
  ctx.strokeStyle = "#c9a36a"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(158, y + 18); ctx.lineTo(174, y + 2); ctx.stroke();
  ctx.fillStyle = at.color; ctx.fillRect(171, y - 1, 7, 7);
  text(p.bow.infinite ? "∞" : `${arrowCount(at.id)}`, 182, y + 18, 20, at.id === "normal" ? "#fff" : at.color);
  y += 30;

  // 구르기 준비
  const ready = p.rollCooldown <= 0;
  const frac = ready ? 1 : 1 - p.rollCooldown / CONFIG.player.rollCooldown;
  ctx.fillStyle = "#3a3d44"; ctx.fillRect(16, y, 100, 8);
  ctx.fillStyle = ready ? "#7dd3ff" : "#4a7a99"; ctx.fillRect(16, y, 100 * frac, 8);
  text("구르기", 124, y + 9, 13, ready ? "#7dd3ff" : "#999");

  // 장비
  const wColor = p.weapon.legendary ? rainbow(game.time * 200, 70) : "#fff";
  const aColor = p.armor.legendary ? `hsl(45, 100%, ${65 + 15 * Math.sin(game.time * 6)}%)` : "#fff";
  const eqY = touch.show ? 150 : H - 70;
  if (!touch.show) {
    text(`무기: ${p.weapon.name} Lv ${gearLevel("weapon")} · 활: ${p.bow.name} Lv ${gearLevel("bow")}`, 16, eqY - 24, 16, wColor);
    text(`갑옷: ${p.armor.name} · 난이도 ${DIFFICULTY[game.profile.difficulty].name}${game.profile.hardMode ? " · 하드모드" : ""}`, 16, eqY, 16, aColor);
  }

  // 메뉴 버튼 (오른쪽 위)
  drawButton(W - 58, 12, 44, 40, "≡", openMenu, { size: 24 });
  // 전체 화면 버튼 (터치 기기에서 아직 전체 화면이 아닐 때)
  if (touch.show && canFullscreen() && !isFullscreen()) drawButton(W - 112, 12, 44, 40, "⛶", enterFullscreen, { size: 22 });

  // 장소 정보
  if (game.scene === "dungeon" && game.mode === "tower") {
    text(`시련의 탑 ${game.tower.floor}층 / ${TOWER.floors}`, W - 124, 40, 20, "#ffe27a", "right");
    const lvText = `Lv ${game.mapLevel + Math.floor((game.tower.floor - 1) * 0.6)}`;
    const left = game.tower.waveDelay <= 0 && !game.tower.cleared ? ` · 남은 몬스터 ${monsters.length}` : "";
    text(lvText + left, W - 124, 64, 15, monsters.length <= 3 && left ? "#ff8080" : "#ccc", "right");
    drawBossBar();
  } else if (game.scene === "dungeon") {
    text(`${game.mapDef.name} Lv ${game.mapLevel}`, W - 124, 40, 20, "#ffe27a", "right");
    const khs = typeof keyHuntStatus === "function" ? keyHuntStatus() : null; // 열쇠 찾기 진행 (keyhunt.js)
    text(khs || `남은 몬스터 ${monsters.length}`, W - 124, 64, 16, khs ? "#ffd23f" : monsters.length <= 3 ? "#ff8080" : "#fff", "right");
    drawMinimap(p, monsters);
    if (monsters.some((m) => m.boss && m.aggro)) drawBossBar(); // 보스가 깨어나면 체력 막대
  } else if (game.scene === "lobby") {
    text("캠프", W - 124, 40, 20, "#ffe27a", "right");
  }

  // 가운데 메시지
  if (game.messageTimer > 0) {
    ctx.globalAlpha = Math.min(1, game.messageTimer * 2);
    if (game.messageRainbow) {
      const s = 1 + 0.06 * Math.sin(game.time * 10);
      text(game.message, W / 2, H * 0.22, 44 * s, rainbow(game.time * 300, 65), "center");
    } else {
      text(game.message, W / 2, H * 0.22, 30, game.messageColor || "#fff", "center");
    }
    ctx.globalAlpha = 1;
  }

  if (!touch.show && !game.overlay) {
    const hint = game.scene === "dungeon"
      ? "이동 WASD · 공격 스페이스(연타=연속기) · 활 L · 화살 Tab · 구르기 Shift · 물약 Q · 열기 E · 메뉴 ESC"
      : "이동 WASD/방향키 · 말 걸기 E · 메뉴 ESC";
    text(hint, W / 2, H - 14, 14, "rgba(255,255,255,0.55)", "center");
  }
}

function drawTouchControls() {
  if (!touch.show) return;
  // 조이스틱
  const js = touchScale();
  const baseX = touch.joyId !== null ? touch.joyX0 : 120 * Math.max(0.8, js);
  const baseY = touch.joyId !== null ? touch.joyY0 : view.h - 120 * Math.max(0.8, js);
  ctx.save();
  ctx.globalAlpha = touch.joyId !== null ? 0.6 : 0.25;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(baseX, baseY, JOY_R, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = touch.joyId !== null ? 0.9 : 0.4;
  const kx = touch.joyId !== null ? baseX + touch.moveX * JOY_R : baseX;
  const ky = touch.joyId !== null ? baseY + touch.moveY * JOY_R : baseY;
  ctx.fillStyle = "#dfe6ee";
  ctx.beginPath(); ctx.arc(kx, ky, JOY_R * 0.47, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (touch.joyId === null) text("이동", baseX, baseY + 6, 16, "rgba(255,255,255,0.8)", "center");

  // 버튼들
  for (const b of touchButtons()) {
    const down = keys[b.code];
    ctx.save();
    ctx.globalAlpha = down ? 0.85 : 0.55;
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    // 그림(아이콘) + 작은 글자. 아이콘이 없으면 글자만
    if (b.icon && typeof hasIcon === "function" && hasIcon(b.icon)) {
      const small = b.r < 25; // 아주 작은 버튼(화살 바꾸기 등)은 그림만
      drawIcon(b.locked ? "lock" : b.icon, b.x, b.y - (small ? 0 : b.r * 0.14), b.r * (small ? 1.15 : 1.05), { gray: b.locked });
      if (!small && b.label) text(b.label, b.x, b.y + b.r * 0.72, Math.max(9, b.r * 0.26), "#fff", "center");
    } else text(b.label, b.x, b.y + 6, Math.max(12, b.r * 0.36), "#fff", "center");
  }
  hookRun("touchDraw"); // 둘이 하기: 2번 조이스틱 (coop.js)
}

function drawTitle() {
  const W = view.w, H = view.h;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, W, H);
  text("던전 모험", W / 2, H / 2 - 120, 64, "#ffe27a", "center");
  text("(게임 이름은 아들이 지어주세요!)", W / 2, H / 2 - 78, 18, "#ddd", "center");
  const pr = game.profile;
  const hasSave = pr.level > 1 || pr.emeralds > 0 || pr.cleared.length > 0;
  drawButton(W / 2 - 130, H / 2 - 40, 260, 60, hasSave ? `이어하기 (Lv ${pr.level})` : "시작하기", () => { if (touch.show) enterFullscreen(); enterLobby(); }, { color: "rgba(80,200,120,0.4)", size: 24 });
  if (hasSave) {
    const label = game.confirmReset ? "정말 지울까요? 한 번 더 누르세요" : "기록 지우고 처음부터";
    drawButton(W / 2 - 150, H / 2 + 36, 300, 42, label, () => {
      if (game.confirmReset) { resetProfile(); game.confirmReset = false; showMessage("기록을 지웠어요", 1.5); }
      else game.confirmReset = true;
    }, { color: game.confirmReset ? "rgba(220,70,70,0.45)" : "rgba(255,255,255,0.06)", size: 15 });
  }
  if (touch.show) {
    text("왼쪽 화면: 이동 · 오른쪽 버튼: 공격, 구르기", W / 2, H / 2 + 130, 18, "#fff", "center");
    if (canFullscreen() && !isFullscreen()) {
      drawButton(W / 2 - 90, H / 2 + 150, 180, 40, "⛶ 전체 화면", enterFullscreen, { size: 16 });
    }
  } else {
    text("이동 WASD/방향키 · 공격 스페이스/J · 구르기 Shift/K", W / 2, H / 2 + 120, 18, "#fff", "center");
    text("말 걸기 E · 물약 Q · 메뉴 ESC · 엔터로 시작", W / 2, H / 2 + 148, 18, "#fff", "center");
  }
}
