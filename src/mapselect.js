// ===== 모험 지도: 맵과 레벨 고르기 =====
// 맵을 누르고, 아래에서 레벨(난이도)을 -/+ 로 고른 다음 "출발!"

const mapSel = { index: 0, level: 1 };

function selectMap(i) {
  mapSel.index = i;
  const r = levelRange(MAPS[i]);
  // 처음엔 내 레벨에 맞춰요
  mapSel.level = Math.max(r.min, Math.min(r.max, game.profile.level));
}

function changeLevel(delta) {
  const r = levelRange(MAPS[mapSel.index]);
  mapSel.level = Math.max(r.min, Math.min(r.max, mapSel.level + delta));
}

function openMapSelect() {
  game.overlay = "maps";
  // 열린 맵 중 마지막 맵을 골라둬요
  let last = 0;
  for (let i = 0; i < MAPS.length; i++) if (mapUnlocked(i)) last = i;
  selectMap(last);
  sfx.equip();
}

function tryStartMap(i) {
  if (!mapUnlocked(i)) {
    sfx.denied();
    const prev = unlockSource(i).name;
    showMessage(`${prev}${josa(prev, "을", "를")} 먼저 깨야 열려요`, 1.8);
    return;
  }
  closeOverlay();
  if (MAPS[i].type === "tower") startTower(mapSel.level);
  else startDungeon(MAPS[i], mapSel.level);
}

function updateMapSelect() {
  const cols = 5;
  const move = (i) => selectMap(Math.max(0, Math.min(MAPS.length - 1, i)));
  if (wasPressed("ArrowLeft", "KeyA")) move(mapSel.index - 1);
  if (wasPressed("ArrowRight", "KeyD")) move(mapSel.index + 1);
  if (wasPressed("ArrowUp", "KeyW")) move(mapSel.index - cols);
  if (wasPressed("ArrowDown", "KeyS")) move(mapSel.index + cols);
  if (wasPressed("Minus", "BracketLeft")) changeLevel(-1);
  if (wasPressed("Equal", "BracketRight")) changeLevel(1);
  if (wasPressed("Enter", "Space")) tryStartMap(mapSel.index);
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

function drawMapSelect() {
  const W = view.w, H = view.h;
  const pr = game.profile;
  const pw = Math.min(1060, W - 24), ph = Math.min(640, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("모험 지도", x0 + 24, y0 + 42, 28, "#ffe27a");
  text(`내 레벨 ${pr.level}`, x0 + 170, y0 + 40, 17, "#7dd3ff");
  drawButton(x0 + pw - 58, y0 + 14, 42, 38, "✕", closeOverlay, { size: 20 });

  // 맵 카드 5 x 2
  const gap = 10, cols = 5;
  const gridTop = y0 + 62;
  const cardW = (pw - 40 - gap * (cols - 1)) / cols;
  const cardH = Math.min(104, (ph - 330) / 2);
  MAPS.forEach((m, i) => {
    const cx = x0 + 20 + (i % cols) * (cardW + gap);
    const cy = gridTop + Math.floor(i / cols) * (cardH + gap);
    const open = mapUnlocked(i);
    const selected = mapSel.index === i;
    const best = pr.best[m.id];

    roundRectPath(cx, cy, cardW, cardH, 10);
    ctx.fillStyle = open ? m.theme.floor + "dd" : "rgba(40,40,46,0.9)";
    ctx.fill();
    ctx.strokeStyle = selected ? "#ffe27a" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = selected ? 4 : 2;
    ctx.stroke();
    addUI(cx, cy, cardW, cardH, () => {
      if (mapSel.index === i) tryStartMap(i);
      else selectMap(i);
    });

    text(m.type === "tower" ? `★ ${m.name}` : `${i + 1}. ${m.name}`, cx + 12, cy + 28, cardW < 200 ? 15 : 17, open ? "#fff" : "#888");
    if (!open) {
      text("잠겨 있어요", cx + 12, cy + 56, 14, "#aaa");
      return;
    }
    text(`Lv ${m.minLevel}부터`, cx + 12, cy + 52, 13, "#eee");
    if (m.type === "tower") { if (pr.towerBest) text(`최고 ${pr.towerBest}층`, cx + 12, cy + cardH - 14, 13, "#7dffb0"); }
    else if (best) text(`최고 Lv ${best} 클리어`, cx + 12, cy + cardH - 14, 13, "#7dffb0");
    else if (pr.cleared.includes(m.id)) text("클리어!", cx + 12, cy + cardH - 14, 13, "#7dffb0");
  });

  // 고른 맵 자세히 + 레벨 고르기
  const m = MAPS[mapSel.index];
  const open = mapUnlocked(mapSel.index);
  const dy = gridTop + 2 * (cardH + gap) + 6;
  roundRectPath(x0 + 20, dy, pw - 40, y0 + ph - 20 - dy, 12);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();

  text(m.name, x0 + 40, dy + 34, 24, open ? "#ffe27a" : "#888");
  text(m.desc, x0 + 40, dy + 62, 15, "#ddd");
  if (m.type === "tower") {
    text(`${m.floors}층까지 · 층마다 웨이브 · 5층·10층 보스 · 보스를 잡으면 황금 상자`, x0 + 40, dy + 88, 14, "#ccc");
    text(`올라갈수록 몬스터가 세져요. 최고 기록 ${game.profile.towerBest || 0}층`, x0 + 40, dy + 112, 14, "#aaa");
  } else {
    const names = Object.keys(m.monsters).map((k) => MONSTERS[k].name).join(", ");
    text(`몬스터: ${names}`, x0 + 40, dy + 88, 14, "#ccc");
    text(`크기 ${m.size}×${m.size} · 몬스터 ${m.count}마리 · 보물상자 3~4개`, x0 + 40, dy + 112, 14, "#aaa");
  }

  if (!open) {
    const prev = unlockSource(mapSel.index).name;
    text(`${prev}${josa(prev, "을", "를")} 먼저 깨면 열려요`, x0 + 40, dy + 150, 17, "#ffb070");
    return;
  }

  // 레벨 고르기
  const r = levelRange(m);
  const L = mapSel.level;
  const lx = x0 + 40, ly = dy + 132;
  const btn = 50;
  drawButton(lx, ly, btn, btn, "−", () => changeLevel(-1), { size: 28, color: L > r.min ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)" });
  text(`Lv ${L}`, lx + btn + 60, ly + 35, 30, "#fff", "center");
  drawButton(lx + btn + 120, ly, btn, btn, "+", () => changeLevel(1), { size: 28, color: L < r.max ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)" });
  const label = difficultyLabel(L);
  text(label.text, lx + btn * 2 + 140, ly + 22, 20, label.color);
  text(`고를 수 있는 레벨 ${r.min}~${r.max}`, lx + btn * 2 + 140, ly + 44, 13, "#aaa");
  if (L !== pr.level && pr.level >= r.min && pr.level <= r.max) {
    drawButton(lx + btn * 2 + 320, ly + 6, 120, 38, `내 레벨(${pr.level})`, () => { mapSel.level = pr.level; }, { size: 14 });
  }

  // 보상
  const bonus = clearBonus(m, L);
  text(`클리어 보너스 에메랄드 ${bonus}개 · 경험치 ×${rewardMul(L).toFixed(2)}`, lx, ly + 80, 15, "#7dffb0");

  drawButton(x0 + pw - 230, y0 + ph - 78, 196, 52, `출발!`, () => tryStartMap(mapSel.index), {
    color: "rgba(140,90,220,0.5)", size: 22,
  });
}
