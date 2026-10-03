// ===== 로비 창: 대장장이(강화), 옷장, 기록판 =====

// ----- 대장장이 -----
const smith = { row: 0, note: "", noteTimer: 0, sparkT: 0 };

function openSmith() { game.overlay = "smith"; smith.row = 0; smith.noteTimer = 0; sfx.anvil(); }

function smithRows() {
  const p = game.player;
  return [
    { kind: "weapon", item: p.weapon, label: "무기" },
    { kind: "bow", item: p.bow, label: "활" },
    { kind: "armor", item: p.armor, label: "갑옷" },
  ];
}

function doUpgrade(row) {
  const pr = game.profile;
  const { kind, item } = row;
  const n = upgradeLevel(kind, item.id);
  if (item.secret) { smith.note = "전설의 장비는 이미 최고예요!"; smith.noteTimer = 2; return; }
  if (n >= UPGRADE.max) { smith.note = "더는 강화할 수 없어요"; smith.noteTimer = 2; return; }
  const cost = upgradeCost(kind, item);
  if (pr.emeralds < cost) { sfx.denied(); smith.note = `에메랄드가 ${cost - pr.emeralds}개 모자라요`; smith.noteTimer = 2; return; }
  pr.emeralds -= cost;
  pr.upgrades[kind + ":" + item.id] = n + 1;
  if (kind === "armor") {
    const p = game.player;
    p.maxHp = maxHpFor(p.armor);
    p.hp = p.maxHp;
  }
  saveProfile();
  sfx.anvil();
  smith.sparkT = 0.5;
  smith.note = `${item.name} +${n + 1} 강화 성공!`;
  smith.noteTimer = 2.2;
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(lobby.anvil.x, lobby.anvil.y, 0.5, { vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, vz: 2 + Math.random() * 2, gravity: 8, life: 0.6, size: 0.6, gold: true });
  }
}

function updateSmith(dt) {
  smith.noteTimer -= dt;
  const rows = smithRows();
  if (wasPressed("ArrowUp", "KeyW")) smith.row = (smith.row + 2) % 3;
  if (wasPressed("ArrowDown", "KeyS")) smith.row = (smith.row + 1) % 3;
  if (wasPressed("Enter", "Space")) doUpgrade(rows[smith.row]);
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

function drawSmith() {
  const W = view.w, H = view.h;
  const pw = Math.min(620, W - 24), ph = 430;
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("대장장이", x0 + 24, y0 + 42, 28, "#ffe27a");
  drawEmeraldIcon(x0 + pw - 150, y0 + 32, 12);
  text(`${game.profile.emeralds}`, x0 + pw - 132, y0 + 41, 22);
  drawButton(x0 + pw - 58, y0 + 14, 42, 38, "✕", closeOverlay, { size: 20 });
  text("지금 쓰는 장비를 강화해요 (최대 +5)", x0 + 24, y0 + 72, 15, "#bbb");

  smithRows().forEach((row, i) => {
    const ry = y0 + 92 + i * 92;
    const { kind, item } = row;
    const n = upgradeLevel(kind, item.id);
    const selected = smith.row === i;
    roundRectPath(x0 + 20, ry, pw - 40, 82, 10);
    ctx.fillStyle = selected ? "rgba(255,226,122,0.15)" : "rgba(255,255,255,0.05)";
    ctx.fill();
    if (selected) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
    addUI(x0 + 20, ry, pw - 220, 82, () => { smith.row = i; });
    text(row.label, x0 + 36, ry + 26, 14, "#aaa");
    text(itemLabel(kind, item), x0 + 36, ry + 52, 21, item.legendary ? rainbow(game.time * 200, 70) : "#fff");
    // 강화 별
    for (let k = 0; k < UPGRADE.max; k++) drawStar(x0 + 40 + k * 18, ry + 70, 6, k < n ? "#ffd23f" : "#444");
    const next = kind === "armor" ? `하트 +${UPGRADE.armorHearts}` : `공격력 +${Math.round(UPGRADE.weaponBonus * 100)}%`;
    if (item.secret) text("전설 장비", x0 + pw - 200, ry + 46, 15, "#ffe27a");
    else if (n >= UPGRADE.max) text("최고 강화!", x0 + pw - 200, ry + 46, 16, "#7dffb0");
    else {
      const cost = upgradeCost(kind, item);
      text(next, x0 + pw - 330, ry + 46, 14, "#7dd3ff");
      drawButton(x0 + pw - 190, ry + 18, 150, 46, `강화 ${cost}`, () => { smith.row = i; doUpgrade(row); }, {
        color: game.profile.emeralds >= cost ? "rgba(80,200,120,0.35)" : "rgba(120,60,60,0.35)", size: 17,
      });
      drawEmeraldIcon(x0 + pw - 168, ry + 41, 7);
    }
  });
  if (smith.noteTimer > 0) {
    ctx.globalAlpha = Math.min(1, smith.noteTimer * 2);
    text(smith.note, W / 2, y0 + ph - 22, 18, "#7dffb0", "center");
    ctx.globalAlpha = 1;
  }
}

// ----- 옷장 -----
const PALETTE = {
  shirt: ["#d94f45", "#2bb3b1", "#4a7ad9", "#f2b632", "#8a5ad9", "#3fae5a", "#ff7aa8", "#ffffff", "#333333"],
  pants: ["#3b3f58", "#3a4fa0", "#5a3a22", "#2f5a2f", "#6a2f6a", "#777777", "#c94040", "#222222"],
  hair: ["#2b1d14", "#7a4a20", "#e8c060", "#d9662b", "#222222", "#f0f0f0", "#6a3fae", "#3fae9a"],
  skin: ["#f2c39b", "#e0a878", "#b9784e", "#8a5a3a", "#ffd9c0"],
};
const PALETTE_NAMES = { shirt: "윗옷", pants: "바지", hair: "머리", skin: "피부" };

function openWardrobe() { game.overlay = "wardrobe"; sfx.equip(); }

function updateWardrobe() {
  if (wasPressed("Escape", "KeyE", "Enter")) closeOverlay();
}

function setLook(part, color) {
  game.profile.look = { ...(game.profile.look || {}), [part]: color };
  saveProfile();
  sfx.click();
}

// 오른쪽에만 창을 띄워서 주인공이 바뀌는 걸 볼 수 있어요
function drawWardrobe() {
  const W = view.w, H = view.h;
  const pw = Math.min(460, W * 0.45), ph = Math.min(560, H - 24);
  const x0 = W - pw - 16, y0 = (H - ph) / 2;
  blockUI();
  roundRectPath(x0, y0, pw, ph, 16);
  ctx.fillStyle = "rgba(24,22,32,0.94)"; ctx.fill();
  ctx.strokeStyle = "#c8a050"; ctx.lineWidth = 3; ctx.stroke();
  text("옷장", x0 + 22, y0 + 40, 26, "#ffe27a");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  const look = { ...CONFIG.colors.player, ...(game.profile.look || {}) };
  let y = y0 + 70;
  for (const part of ["shirt", "pants", "hair", "skin"]) {
    text(PALETTE_NAMES[part], x0 + 22, y + 18, 16, "#ccc");
    const sw = Math.min(38, (pw - 110) / PALETTE[part].length - 4);
    PALETTE[part].forEach((c, i) => {
      const sx = x0 + 90 + i * (sw + 4);
      ctx.fillStyle = c;
      ctx.fillRect(sx, y, sw, sw);
      ctx.strokeStyle = look[part] === c ? "#ffe27a" : "rgba(255,255,255,0.25)";
      ctx.lineWidth = look[part] === c ? 3 : 1;
      ctx.strokeRect(sx, y, sw, sw);
      addUI(sx, y, sw, sw, () => setLook(part, c));
    });
    y += sw + 18;
  }
  const hide = !!(game.profile.look && game.profile.look.hideArmor);
  drawButton(x0 + 22, y + 6, pw - 44, 44, hide ? "갑옷 모습 보이기" : "갑옷 모습 숨기기 (옷 색 보이기)", () => setLook("hideArmor", !hide), { size: 15 });
  text("갑옷을 숨겨도 막아주는 힘은 그대로예요", x0 + 22, y + 74, 13, "#999");
}

// ----- 기록판 -----
function openRecords() { game.overlay = "records"; sfx.equip(); }
function updateRecords() { if (wasPressed("Escape", "KeyE", "Enter", "Space")) closeOverlay(); }

function drawRecords() {
  const pr = game.profile, st = pr.stats;
  const W = view.w, H = view.h;
  const pw = Math.min(620, W - 24), ph = Math.min(560, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("나의 기록", x0 + 24, y0 + 42, 28, "#ffe27a");
  drawButton(x0 + pw - 58, y0 + 14, 42, 38, "✕", closeOverlay, { size: 20 });
  const lines = [
    [`레벨`, `${pr.level}`],
    [`물리친 몬스터`, `${st.kills}마리`],
    [`연 보물상자`, `${st.chests}개`],
    [`던전 도전 / 클리어`, `${st.runs}번 / ${st.clears}번`],
    [`시련의 탑 최고`, `${pr.towerBest || 0}층`],
    [`강아지 쓰다듬기`, `${st.pets}번`],
    [`모은 장비`, `${pr.weapons.length + pr.bows.length + pr.armors.length}개`],
  ];
  lines.forEach(([k, v], i) => {
    text(k, x0 + 36, y0 + 92 + i * 34, 18, "#ccc");
    text(v, x0 + pw - 36, y0 + 92 + i * 34, 18, "#fff", "right");
  });
  const cleared = MAPS.filter((m) => pr.best[m.id] || pr.cleared.includes(m.id)).map((m) => `${m.name}${pr.best[m.id] ? " Lv" + pr.best[m.id] : ""}`);
  text("깬 맵", x0 + 36, y0 + 92 + lines.length * 34 + 10, 18, "#ccc");
  const msg = cleared.length ? cleared.join(" · ") : "아직 없어요";
  // 줄바꿈
  const words = msg.split(" · ");
  let line = "", ly = y0 + 92 + lines.length * 34 + 40;
  ctx.font = 'bold 15px "Apple SD Gothic Neo", sans-serif';
  for (const w of words) {
    const tryLine = line ? line + " · " + w : w;
    if (ctx.measureText(tryLine).width > pw - 72) { text(line, x0 + 36, ly, 15, "#7dffb0"); ly += 24; line = w; }
    else line = tryLine;
  }
  if (line) text(line, x0 + 36, ly, 15, "#7dffb0");
}
