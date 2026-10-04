// ===== 버튼 설명 (메뉴 → "버튼 설명") =====
// 모든 직업이 쓰는 버튼과, 직업마다 다른 기술 버튼을 그림과 함께 보여줘요.

const help = { cls: null };

const HELP_COMMON = [
  { icon: "joystick", name: "이동", touch: "왼쪽 아래 동그라미를 끌어요", key: "W A S D / 방향키" },
  { icon: "@attack", name: "공격", touch: "연달아 누르면 연속기", key: "Space" },
  { icon: "roll", name: "구르기", touch: "굴러서 피해요 (구르는 동안 안 맞아요)", key: "Shift" },
  { icon: "bow", name: "활", touch: "누르고 있으면 계속 쏴요", key: "L" },
  { icon: "arrow_fire", name: "화살 바꾸기", touch: "보통 · 불 · 얼음 · 폭탄 화살", key: "Tab" },
  { icon: "potion", name: "물약", touch: "하트를 채워요", key: "Q" },
  { icon: "use", name: "열기 · 말 걸기", touch: "가까이 가면 나타나요 (상자·문·가게)", key: "E" },
  { icon: "menu", name: "메뉴", touch: "오른쪽 위 버튼", key: "Esc" },
];

function openHelp() { help.cls = playerCls(game.player || {}); game.overlay = "help"; }

hookOn("menuItems", (items) => { items.push({ label: "버튼 설명", act: () => { closeOverlay(); openHelp(); } }); }, 5);

hookOn("overlayUpdate", (name) => {
  if (name !== "help") return false;
  const i = CLASS_ORDER.indexOf(help.cls);
  if (wasPressed("ArrowRight", "KeyD")) help.cls = CLASS_ORDER[(i + 1) % CLASS_ORDER.length];
  if (wasPressed("ArrowLeft", "KeyA")) help.cls = CLASS_ORDER[(i + CLASS_ORDER.length - 1) % CLASS_ORDER.length];
  if (wasPressed("Escape", "Enter", "Space", "KeyE")) closeOverlay();
  return true;
});

hookOn("overlayDraw", (name) => {
  if (name !== "help") return false;
  drawHelp();
  return true;
});

function drawHelp() {
  const W = view.w, H = view.h;
  const pw = Math.min(980, W - 20), ph = Math.min(600, H - 20);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("버튼 설명", x0 + 22, y0 + 40, 26, "#ffe27a");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });

  const cls = help.cls || "warrior", def = CLASS_DEFS[cls];
  const colW = (pw - 60) / 2, top = y0 + 64;
  const rowH = Math.min(62, (ph - 84) / HELP_COMMON.length);

  // 왼쪽: 모든 직업
  text("모든 직업", x0 + 22, top + 4, 15, "#aaa");
  HELP_COMMON.forEach((r, i) => {
    const y = top + 14 + i * rowH;
    const icon = r.icon === "@attack" ? def.icon : r.icon;
    roundRectPath(x0 + 18, y, colW, rowH - 6, 8); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill();
    drawIcon(icon, x0 + 18 + rowH * 0.5, y + (rowH - 6) / 2, Math.min(40, rowH - 14));
    const tx = x0 + 18 + rowH + 4;
    text(r.name, tx, y + (rowH - 6) * 0.42, 16, "#fff");
    text(r.touch, tx, y + (rowH - 6) * 0.82, 12, "#bbb");
    text(r.key, x0 + 18 + colW - 10, y + (rowH - 6) * 0.42, 12, "#7dd3ff", "right");
  });

  // 오른쪽: 직업 기술 (화살표로 다른 직업도 볼 수 있어요)
  const rx = x0 + 30 + colW;
  drawButton(rx, top - 8, 40, 34, "◀", () => { const i = CLASS_ORDER.indexOf(cls); help.cls = CLASS_ORDER[(i + CLASS_ORDER.length - 1) % CLASS_ORDER.length]; }, { size: 16 });
  drawIcon(def.icon, rx + 64, top + 9, 28);
  text(def.name + (cls === playerCls(game.player || {}) ? " (지금 직업)" : ""), rx + 84, top + 16, 18, def.color);
  drawButton(rx + colW - 40, top - 8, 40, 34, "▶", () => { const i = CLASS_ORDER.indexOf(cls); help.cls = CLASS_ORDER[(i + 1) % CLASS_ORDER.length]; }, { size: 16 });

  let y = top + 38;
  roundRectPath(rx, y, colW, 46, 8); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill();
  ctx.fillStyle = def.res.color; ctx.fillRect(rx + 12, y + 12, 34, 10);
  text(`${def.res.name} 막대`, rx + 56, y + 21, 15, def.res.color);
  text(def.res.rule, rx + 12, y + 39, 12, "#bbb");
  y += 54;

  const keyOf = { basic: "Space", s1: "U", s2: "I", ult: "O" };
  const slotName = { basic: "공격 버튼", s1: "기술 1", s2: "기술 2", ult: "궁극기" };
  const lvl = (game.profile && game.profile.level) || 1;
  const rows = ["basic", "s1", "s2", "ult"];
  const rh = Math.min(92, (y0 + ph - 14 - y) / rows.length);
  rows.forEach((slot, i) => {
    const s = classSkill(cls, slot), ry = y + i * rh, open = lvl >= s.unlock;
    roundRectPath(rx, ry, colW, rh - 6, 8); ctx.fillStyle = slot === "ult" ? "rgba(255,216,74,0.08)" : "rgba(255,255,255,0.05)"; ctx.fill();
    drawIcon(s.icon, rx + 32, ry + (rh - 6) / 2, Math.min(44, rh - 18), { gray: !open });
    const tx = rx + 64;
    text(s.name, tx, ry + 22, 16, open ? "#fff" : "#999");
    text(`${slotName[slot]} · ${keyOf[slot]}${open ? "" : ` · Lv ${s.unlock}에 열려요`}`, rx + colW - 10, ry + 22, 11, slot === "ult" ? "#ffd84a" : "#7dd3ff", "right");
    text(s.kidText, tx, ry + 42, 13, "#ffe9a8");
    if (rh > 70) text(s.desc, tx, ry + 62, 11, "#aaa");
  });
  text("버튼 자리는 메뉴의 '버튼 배치 바꾸기'에서 바꿀 수 있어요", x0 + 22, y0 + ph - 8, 12, "#9a9a9a");
}
