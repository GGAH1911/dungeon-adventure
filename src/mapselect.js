// ===== 모험 지도: 맵 고르기 =====

const mapSel = { index: 0 };

function openMapSelect() {
  game.overlay = "maps";
  // 아직 안 깬 맵 중 첫 번째를 골라둬요
  mapSel.index = 0;
  for (let i = 0; i < MAPS.length; i++) if (mapUnlocked(i)) mapSel.index = i;
  sfx.equip();
}

function tryStartMap(i) {
  if (!mapUnlocked(i)) {
    sfx.denied();
    const prev = MAPS[i - 1].name;
    showMessage(`${prev}${josa(prev, "을", "를")} 먼저 깨야 열려요`, 1.8);
    return;
  }
  closeOverlay();
  startDungeon(MAPS[i]);
}

function updateMapSelect() {
  const cols = 2;
  if (wasPressed("ArrowLeft", "KeyA")) mapSel.index = Math.max(0, mapSel.index - 1);
  if (wasPressed("ArrowRight", "KeyD")) mapSel.index = Math.min(MAPS.length - 1, mapSel.index + 1);
  if (wasPressed("ArrowUp", "KeyW")) mapSel.index = Math.max(0, mapSel.index - cols);
  if (wasPressed("ArrowDown", "KeyS")) mapSel.index = Math.min(MAPS.length - 1, mapSel.index + cols);
  if (wasPressed("Enter", "Space")) tryStartMap(mapSel.index);
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

function drawMapSelect() {
  const W = view.w, H = view.h;
  const pw = Math.min(900, W - 24), ph = Math.min(600, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("모험 지도", x0 + 24, y0 + 42, 28, "#ffe27a");
  text(`내 레벨 ${game.profile.level}`, x0 + 170, y0 + 40, 17, "#7dd3ff");
  drawButton(x0 + pw - 58, y0 + 14, 42, 38, "✕", closeOverlay, { size: 20 });

  const gap = 14;
  const cardW = (pw - 48 - gap) / 2;
  const cardH = (ph - 140 - gap) / 2;
  MAPS.forEach((m, i) => {
    const cx = x0 + 24 + (i % 2) * (cardW + gap);
    const cy = y0 + 64 + Math.floor(i / 2) * (cardH + gap);
    const open = mapUnlocked(i);
    const selected = mapSel.index === i;
    const cleared = game.profile.cleared.includes(m.id);

    roundRectPath(cx, cy, cardW, cardH, 12);
    ctx.fillStyle = open ? m.theme.floor + "cc" : "rgba(40,40,46,0.9)";
    ctx.fill();
    ctx.strokeStyle = selected ? "#ffe27a" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = selected ? 4 : 2;
    ctx.stroke();
    addUI(cx, cy, cardW, cardH, () => {
      if (mapSel.index === i) tryStartMap(i);
      else mapSel.index = i;
    });

    const small = cardH < 150;
    text(`${i + 1}. ${m.name}`, cx + 16, cy + 32, small ? 19 : 22, open ? "#fff" : "#888");
    if (cleared) text("클리어!", cx + cardW - 14, cy + 30, 16, "#7dffb0", "right");
    if (!open) {
      text("잠겨 있어요", cx + 16, cy + 62, 16, "#aaa");
      text(`"${MAPS[i - 1].name}" 깨면 열려요`, cx + 16, cy + 86, 14, "#888");
      return;
    }
    const lvColor = game.profile.level >= m.level ? "#7dffb0" : "#ffb070";
    text(`추천 레벨 ${m.level}`, cx + 16, cy + 58, 15, lvColor);
    text(m.desc, cx + 16, cy + 82, 14, "#eee");
    const names = Object.keys(m.monsters).map((k) => MONSTERS[k].name).join(", ");
    if (!small) text(`몬스터: ${names}`, cx + 16, cy + 106, 13, "#ddd");
    text(`크기 ${m.size}×${m.size} · 몬스터 ${m.count}마리 · 보상 에메랄드 ${m.reward}`, cx + 16, cy + cardH - 16, 12, "#ccc");
  });

  const sel = MAPS[mapSel.index];
  const open = mapUnlocked(mapSel.index);
  drawButton(x0 + pw - 210, y0 + ph - 60, 190, 44, open ? `${sel.name} 출발!` : "잠겨 있어요", () => tryStartMap(mapSel.index), {
    color: open ? "rgba(140,90,220,0.45)" : "rgba(80,80,80,0.4)", size: 18,
  });
  if (!touch.show) text("방향키로 고르고 엔터로 출발 · ESC 닫기", x0 + 24, y0 + ph - 30, 14, "#888");
}
