// ===== 조작: 키보드 + 터치 + 마우스 =====
// e.code 를 써서 한글 입력 상태여도 키가 잘 먹어요.

const keys = {};     // 지금 누르고 있는 키
const pressed = {};  // 이번에 막 누른 키 (한 번만)

window.addEventListener("keydown", (e) => {
  unlockAudio(); // 키를 처음 누르면 소리가 켜져요
  if (typeof cheatOpen !== "undefined" && cheatOpen) return; // 치트 입력 중엔 게임 조작 안 해요
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
window.addEventListener("blur", () => {
  for (const k in keys) keys[k] = false;
  touch.moveX = touch.moveY = 0;
  touch.joyId = null;
});

function wasPressed(...codes) {
  return codes.some((c) => pressed[c]);
}
function isDown(...codes) {
  return codes.some((c) => keys[c]);
}
function clearPressed() {
  for (const k in pressed) delete pressed[k];
}

// ===== 화면 버튼 (메뉴, 가게 같은 것) =====
// 그릴 때마다 "여기 누르면 이거 해" 를 등록해요.
let uiRegions = [];
function clearUI() { uiRegions = []; }
function addUI(x, y, w, h, onTap) {
  const k = typeof uiK === "number" ? uiK : 1; // 작은 화면이면 줄인 만큼 맞춰요
  uiRegions.push({ x: x * k, y: y * k, w: w * k, h: h * k, onTap });
}
// 창이 열려 있으면 뒤에 있는 버튼은 못 누르게 막아요
function blockUI() { uiRegions.push({ x: 0, y: 0, w: view.w, h: view.h, onTap: null }); }
function hitUI(x, y) {
  for (let i = uiRegions.length - 1; i >= 0; i--) {
    const r = uiRegions[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
  }
  return null;
}

// ===== 터치 조이스틱과 버튼 =====
const touch = {
  show: "ontouchstart" in window || navigator.maxTouchPoints > 0, // 터치 화면이면 버튼 보이기
  joyId: null, joyX0: 0, joyY0: 0, joyX: 0, joyY: 0,
  moveX: 0, moveY: 0,
  held: {},      // 손가락 번호 -> 누르고 있는 버튼
  taps: {},      // 손가락 번호 -> 누른 화면 버튼
};
let JOY_R = 60;
// 터치 버튼 크기: 휴대폰처럼 작은 화면이면 작게
function touchScale() {
  const s = Math.max(0.62, Math.min(1.2, Math.min(view.w, view.h) / 700));
  JOY_R = 60 * Math.max(0.8, s);
  return s;
}

// 지금 화면에 있는 터치 버튼들 (game.js 상태에 따라 달라져요)
function touchButtons() {
  if (!touch.show || !playing()) return [];
  const W = view.w, H = view.h;
  const s = touchScale();
  const p = game.player;
  const list = [
    { code: "TouchAttack", icon: "sword", label: "공격", x: W - 110 * s, y: H - 110 * s, r: 64 * s, color: "#e25555" },
    { code: "TouchRoll", icon: "roll", label: "구르기", x: W - 255 * s, y: H - 62 * s, r: 44 * s, color: "#4aa3df" },
  ];
  const type = currentArrowType();
  const at = arrowTypeById(type);
  const bowLabel = p.bow.infinite || game.scene === "lobby" ? "활 ∞" : `활 ${arrowCount(type)}`;
  list.push({ code: "TouchBow", icon: "bow", label: bowLabel, x: W - 235 * s, y: H - 190 * s, r: 46 * s, color: p.bow.legendary ? rainbow(game.time * 200, 50) : "#b07a2a" });
  list.push({ code: "TouchArrowType", icon: "arrow_" + type, label: "화살", x: W - 318 * s, y: H - 238 * s, r: 26 * s, color: at.color, dark: type === "normal" || type === "ice" });
  if (game.scene === "dungeon") list.push({ code: "TouchPotion", icon: "potion", label: `물약 ${game.profile.potions}`, x: W - 72 * s, y: H - 245 * s, r: 36 * s, color: "#c64fa0" });
  if (game.nearNpc) list.push({ code: "TouchUse", icon: "use", label: game.nearNpc.short, x: W - 160 * s, y: H - 300 * s, r: 46 * s, color: "#3fbf6f" });
  return hookFilter("touchButtons", list, s); // 둘이 하기: 양쪽 배치 (coop.js)
}

canvas.style.touchAction = "none";
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("pointerdown", (e) => {
  unlockAudio();
  if (typeof cheatOpen !== "undefined" && cheatOpen) return;
  if (e.pointerType === "touch") touch.show = true;
  const x = e.clientX, y = e.clientY;

  // 1) 공격/구르기 같은 게임 버튼 (누르는 순간 바로)
  for (const b of touchButtons()) {
    if ((x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r) {
      touch.held[e.pointerId] = b.code;
      keys[b.code] = true;
      pressed[b.code] = true;
      return;
    }
  }
  // 2) 메뉴, 가게 같은 화면 버튼 (손을 뗄 때 눌려요)
  const r = hitUI(x, y);
  if (r) {
    if (r.onTap) touch.taps[e.pointerId] = r;
    return;
  }
  // 3) 왼쪽 화면을 누르면 조이스틱 (둘이 하기면 오른쪽은 2번 조이스틱: coop.js)
  if (playing() && hookAny("touchJoyStart", e, x, y)) return;
  if (playing() && x < view.w * 0.55 && touch.joyId === null) {
    touch.joyId = e.pointerId;
    touch.joyX0 = touch.joyX = x;
    touch.joyY0 = touch.joyY = y;
    touch.moveX = touch.moveY = 0;
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (e.pointerId !== touch.joyId) { hookRun("touchMove", e); return; }
  let dx = e.clientX - touch.joyX0, dy = e.clientY - touch.joyY0;
  const d = Math.hypot(dx, dy);
  if (d > JOY_R) {
    // 손가락이 멀리 가면 조이스틱도 따라와요
    touch.joyX0 += (dx / d) * (d - JOY_R);
    touch.joyY0 += (dy / d) * (d - JOY_R);
    dx = e.clientX - touch.joyX0; dy = e.clientY - touch.joyY0;
  }
  touch.joyX = e.clientX; touch.joyY = e.clientY;
  const len = Math.hypot(dx, dy);
  touch.moveX = len > 8 ? dx / JOY_R : 0;
  touch.moveY = len > 8 ? dy / JOY_R : 0;
});

function endPointer(e) {
  hookRun("touchEnd", e);
  if (e.pointerId === touch.joyId) {
    touch.joyId = null;
    touch.moveX = touch.moveY = 0;
  }
  const code = touch.held[e.pointerId];
  if (code) { keys[code] = false; delete touch.held[e.pointerId]; }
  const tap = touch.taps[e.pointerId];
  if (tap) {
    delete touch.taps[e.pointerId];
    if (e.type === "pointerup" && e.clientX >= tap.x - 10 && e.clientX <= tap.x + tap.w + 10 && e.clientY >= tap.y - 10 && e.clientY <= tap.y + tap.h + 10) {
      sfx.click();
      tap.onTap();
    }
  }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

// 태블릿에서 화면이 움직이거나 확대되지 않게
document.addEventListener("touchmove", (e) => { if (e.target === canvas) e.preventDefault(); }, { passive: false });
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());
