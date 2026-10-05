// ===== 버튼 배치 바꾸기 (메뉴 → "버튼 배치 바꾸기") =====
// 터치 버튼과 이동 동그라미(조이스틱)를 끌어서 옮기고, 크기를 바꿔요.
// 기기마다 따로 저장해요 (캐릭터 저장과 따로: BTN_LAYOUT_KEY).
//
// 저장 모양: { v: 1, b: { 버튼코드: { dx, dy, k } } }  (바꾼 버튼만 들어 있어요)
//   버튼:   dx, dy = 오른쪽 아래 구석에서 떨어진 거리 ÷ touchScale()  (classes.js 기본 자리와 같은 단위)
//           그래서 화면 = (view.w − dx·s, view.h − dy·s), 크기 = 기본 반지름 × k
//   이동:   "Joy" 는 왼쪽 아래 구석에서 떨어진 거리 ÷ max(0.8, s) (hud.js 의 쉬는 자리와 같은 단위), k 는 늘 1
//   아무것도 안 바꾸면 b 가 비어 있어서 자리가 기본 그대로예요 (tools/smoke.d/63-icons-help.mjs 가 지켜요)
// 코드: "BTN1-" + "번호.dx.dy.k100" 를 "_" 로 이은 것 (예: BTN1-0.120.98.120_9.130.110.100)

const BTN_LAYOUT_KEY = "dungeon-adventure-buttons-v1";
// 순서가 코드 번호예요. 뒤에만 더하세요 (앞을 바꾸면 예전 코드가 엉뚱한 버튼으로 가요)
const BTN_CODES = ["TouchAttack", "TouchRoll", "TouchBow", "TouchArrowType", "TouchPotion", "TouchUse", "TouchSkill1", "TouchSkill2", "TouchUlt", "Joy", "TouchSpeedPot", "TouchAtkPot", "TouchFood", "TouchTnt", "TouchFirework"];
// 기본 자리 [dx, dy, 반지름] (classes.js 의 터치 버튼 자리, hud.js 의 이동 동그라미와 같아야 해요. 시험이 확인해요)
const BTN_DEFAULTS = {
  TouchAttack: [105, 105, 60], TouchRoll: [245, 55, 40], TouchBow: [310, 135, 36], TouchArrowType: [345, 215, 22],
  TouchPotion: [262, 262, 30], TouchUse: [105, 338, 40], TouchSkill1: [215, 152, 38], TouchSkill2: [168, 235, 36], TouchUlt: [75, 248, 36],
  Joy: [120, 120, 60],
  TouchSpeedPot: [338, 292, 24], TouchAtkPot: [290, 338, 24], // 강화 물약 (buffpots.js, 가진 게 있을 때만 보여요)
  TouchFood: [200, 318, 24], // 음식 먹기 (hunger.js, 어려움·악몽에서 음식이 있을 때만 보여요)
  TouchTnt: [385, 252, 24], TouchFirework: [215, 372, 22], // TNT·폭죽 (boom.js, 가진 게 있을 때만 보여요)
};
const BTN_NAMES = { TouchAttack: "공격", TouchRoll: "구르기", TouchBow: "활", TouchArrowType: "화살 바꾸기", TouchPotion: "물약", TouchUse: "열기", TouchSkill1: "기술 1", TouchSkill2: "기술 2", TouchUlt: "궁극기", Joy: "이동", TouchSpeedPot: "신속 물약", TouchFood: "음식", TouchTnt: "TNT", TouchFirework: "폭죽", TouchAtkPot: "공격력 물약" };
const BTN_K_MIN = 0.6, BTN_K_MAX = 1.8, BTN_D_MAX = 1500, BTN_CODE_MAX = 600;

const btnEdit = { draft: null, sel: null, drag: null, confirmReset: false, code: "", toast: "", toastT: 0, raw: false, bar: null };
let btnLayout = Object.create(null);

const btnHas = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const btnClamp = (v, a, b) => Math.max(a, Math.min(b, v));
function btnCoop() { return typeof coopLocal === "function" && coopLocal(); } // 둘이 하기 (한 기기) 는 따로 배치해요

// 값 하나 다듬기 (숫자가 아니면 null)
function btnCleanEntry(code, e) {
  if (!e || typeof e !== "object") return null;
  const dx = Number(e.dx), dy = Number(e.dy), k = code === "Joy" ? 1 : Number(e.k === undefined ? 1 : e.k);
  if (![dx, dy, k].every(Number.isFinite)) return null;
  return { dx: btnClamp(dx, 0, BTN_D_MAX), dy: btnClamp(dy, 0, BTN_D_MAX), k: btnClamp(k, BTN_K_MIN, BTN_K_MAX) };
}
// 아는 버튼만, 기본과 같은 건 빼고 (그래야 "안 바꿈" = 정확히 기본 자리)
function btnCleanLayout(src) {
  const out = Object.create(null);
  if (!src || typeof src !== "object") return out;
  for (const code of BTN_CODES) {
    if (!btnHas(src, code)) continue;
    const e = btnCleanEntry(code, src[code]);
    if (!e) continue;
    const d = BTN_DEFAULTS[code];
    if (Math.abs(e.dx - d[0]) < 0.05 && Math.abs(e.dy - d[1]) < 0.05 && Math.abs(e.k - 1) < 0.001) continue;
    out[code] = { dx: Math.round(e.dx * 100) / 100, dy: Math.round(e.dy * 100) / 100, k: Math.round(e.k * 100) / 100 };
  }
  return out;
}
function btnCopyLayout(L) { const out = Object.create(null); for (const c in L) out[c] = { ...L[c] }; return out; }

function loadBtnLayout() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(BTN_LAYOUT_KEY)); } catch (e) { raw = null; }
  btnLayout = btnCleanLayout(raw && raw.v === 1 ? raw.b : null);
  return btnLayout;
}
function saveBtnLayout() {
  const b = {};
  for (const c of BTN_CODES) if (btnHas(btnLayout, c)) b[c] = btnLayout[c];
  try {
    if (Object.keys(b).length) localStorage.setItem(BTN_LAYOUT_KEY, JSON.stringify({ v: 1, b }));
    else localStorage.removeItem(BTN_LAYOUT_KEY);
  } catch (e) { /* 저장 못 해도 게임은 계속 */ }
}
loadBtnLayout();

// ----- 자리 계산 -----
// 화면 자리 {x, y, r}. 화면 밖으로 안 나가게 가둬요
function btnPlace(code, ent, W = view.w, H = view.h) {
  const s = touchScale(); // JOY_R 도 여기서 맞춰져요
  const d = BTN_DEFAULTS[code], e = ent || { dx: d[0], dy: d[1], k: 1 };
  let x, y, r;
  if (code === "Joy") { const jk = Math.max(0.8, s); r = JOY_R; x = e.dx * jk; y = H - e.dy * jk; }
  else { r = d[2] * s * e.k; x = W - e.dx * s; y = H - e.dy * s; }
  x = W >= 2 * r ? btnClamp(x, r, W - r) : W / 2;
  y = H >= 2 * r ? btnClamp(y, r, H - r) : H / 2;
  return { x, y, r };
}
// 화면 자리 -> 저장 값
function btnUnplace(code, x, y, k, W = view.w, H = view.h) {
  const s = touchScale();
  if (code === "Joy") { const jk = Math.max(0.8, s); return { dx: x / jk, dy: (H - y) / jk, k: 1 }; }
  return { dx: (W - x) / s, dy: (H - y) / s, k };
}
function btnLayoutOn(L) { for (const c in L) return true; return false; }

// 놀 때: 바꾼 버튼만 새 자리로 (classes.js 40, coop.js 50 다음)
hookOn("touchButtons", (list) => {
  if (btnEdit.raw || btnCoop() || !btnLayoutOn(btnLayout)) return list;
  return list.map((b) => {
    if (!btnHas(btnLayout, b.code) || b.code === "Joy") return b;
    const p = btnPlace(b.code, btnLayout[b.code]);
    return { ...b, x: p.x, y: p.y, r: p.r };
  });
}, 90);
// 이동 동그라미가 쉬는 자리 (hud.js)
function btnJoyRest(L = btnLayout) { return btnPlace("Joy", btnHas(L, "Joy") ? L.Joy : null); }
hookOn("joyRest", (pos) => (btnCoop() || !btnHas(btnLayout, "Joy") ? pos : btnJoyRest()), 90);
// 이동 동그라미를 오른쪽으로 옮겼으면 그 근처를 눌러도 시작돼요 (왼쪽 55% 는 원래대로 아무 데나)
hookOn("touchJoyStart", (e, x, y) => {
  if (btnCoop() || !btnHas(btnLayout, "Joy") || touch.joyId !== null || x < view.w * 0.55) return false;
  const r = btnJoyRest();
  if (Math.hypot(x - r.x, y - r.y) > JOY_R * 1.6) return false;
  touch.joyId = e.pointerId;
  touch.joyX0 = touch.joyX = x; touch.joyY0 = touch.joyY = y;
  touch.moveX = touch.moveY = 0;
  return true;
}, 40);

// ----- 코드 -----
function btnLayoutExport(L) {
  if (!L) L = game.overlay === "btnedit" && btnEdit.draft ? btnEdit.draft : btnLayout;
  L = btnCleanLayout(L);
  const parts = [];
  BTN_CODES.forEach((c, i) => {
    if (!btnHas(L, c)) return;
    const e = L[c];
    parts.push(`${i}.${Math.round(e.dx)}.${Math.round(e.dy)}.${Math.round(e.k * 100)}`);
  });
  return "BTN1-" + parts.join("_");
}
// 코드 읽기: 이상하면 null
function btnParseCode(str) {
  if (typeof str !== "string" || str.length > BTN_CODE_MAX) return null;
  str = str.replace(/\s+/g, "");
  if (!/^BTN1-/i.test(str)) return null;
  const body = str.slice(5), out = Object.create(null);
  if (body === "") return out; // 기본 배치
  const parts = body.split("_");
  if (parts.length > BTN_CODES.length) return null;
  for (const p of parts) {
    const m = /^(\d{1,2})\.(\d{1,4})\.(\d{1,4})\.(\d{1,3})$/.exec(p);
    if (!m) return null;
    const i = Number(m[1]);
    if (!(i < BTN_CODES.length)) return null;
    const code = BTN_CODES[i];
    if (btnHas(out, code)) return null; // 같은 버튼 두 번
    const e = btnCleanEntry(code, { dx: Number(m[2]), dy: Number(m[3]), k: Number(m[4]) / 100 });
    if (!e) return null;
    out[code] = e;
  }
  return btnCleanLayout(out);
}
function btnLayoutImport(str) {
  const L = btnParseCode(str);
  if (!L) return false;
  btnLayout = L;
  saveBtnLayout();
  if (game.overlay === "btnedit") { btnEdit.draft = btnCopyLayout(L); btnEdit.sel = null; btnEdit.drag = null; }
  return true;
}

// ----- 편집 창 -----
function openBtnEdit() {
  // 누르고 있던 버튼·조이스틱은 놓아요 (창이 열린 뒤 계속 걷지 않게)
  for (const id in touch.held) { keys[touch.held[id]] = false; delete touch.held[id]; }
  touch.joyId = null; touch.moveX = touch.moveY = 0;
  Object.assign(btnEdit, { draft: btnCopyLayout(btnLayout), sel: null, drag: null, confirmReset: false, code: "", toast: "", toastT: 0, bar: null });
  game.overlay = "btnedit";
}
function closeBtnEdit(save = true) {
  if (save && btnEdit.draft) { btnLayout = btnCleanLayout(btnEdit.draft); saveBtnLayout(); }
  btnEdit.drag = null; btnEdit.draft = null;
  closeOverlay();
  if (save) showMessage("버튼 자리를 저장했어요", 1.5);
}
function btnToast(t, sec = 2) { btnEdit.toast = t; btnEdit.toastT = sec; }

// 던전에서 보이는 버튼 모두 (캠프여도 던전처럼): 그림·글자·색은 진짜 버튼에서 가져와요
function btnEditItems(L = btnEdit.draft || btnLayout) {
  const keep = { overlay: game.overlay, scene: game.scene, near: game.nearNpc, show: touch.show };
  let list = [];
  btnEdit.raw = true;
  try {
    game.overlay = null; touch.show = true;
    if (game.scene !== "dungeon") game.scene = "dungeon";
    if (!game.nearNpc) game.nearNpc = { short: "열기" };
    if (game.player) list = touchButtons();
  } finally {
    btnEdit.raw = false;
    game.overlay = keep.overlay; game.scene = keep.scene; game.nearNpc = keep.near; touch.show = keep.show;
  }
  const out = [];
  for (const b of list) {
    if (!btnHas(BTN_DEFAULTS, b.code) || b.code === "Joy") continue; // 둘이 하기 2번 버튼 같은 건 빼요
    const e = btnHas(L, b.code) ? L[b.code] : null;
    const p = btnPlace(b.code, e);
    out.push({ code: b.code, icon: b.icon, label: b.label, color: b.locked ? "#6a6f7a" : b.color, x: p.x, y: p.y, r: p.r, k: e ? e.k : 1 });
  }
  const j = btnPlace("Joy", btnHas(L, "Joy") ? L.Joy : null);
  out.push({ code: "Joy", icon: "joystick", label: "이동", color: "#ffffff", x: j.x, y: j.y, r: j.r, k: 1, joy: true });
  return out;
}
// 겹친 버튼 코드들
function btnOverlaps(items) {
  const bad = new Set();
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 1) { bad.add(a.code); bad.add(b.code); }
  }
  return bad;
}
function btnEditMove(code, x, y) {
  const d = btnEdit.draft; if (!d || !btnHas(BTN_DEFAULTS, code)) return;
  const k = btnHas(d, code) ? d[code].k : 1;
  const r = code === "Joy" ? (touchScale(), JOY_R) : BTN_DEFAULTS[code][2] * touchScale() * k;
  const W = view.w, H = view.h;
  x = W >= 2 * r ? btnClamp(x, r, W - r) : W / 2;
  y = H >= 2 * r ? btnClamp(y, r, H - r) : H / 2;
  d[code] = btnUnplace(code, x, y, k);
  btnEdit.confirmReset = false;
}
function btnEditResize(code, dir) {
  const d = btnEdit.draft; if (!d || !code || code === "Joy") return false;
  const items = btnEditItems(), it = items.find((b) => b.code === code); if (!it) return false;
  const k = Math.round(btnClamp((it.k || 1) + dir * 0.1, BTN_K_MIN, BTN_K_MAX) * 10) / 10;
  const e = btnUnplace(code, it.x, it.y, k);
  d[code] = e;
  const p = btnPlace(code, e); // 커져서 화면 밖으로 나가면 안쪽으로
  d[code] = btnUnplace(code, p.x, p.y, k);
  btnEdit.confirmReset = false;
  return true;
}
function btnEditReset() {
  if (!btnEdit.confirmReset) { btnEdit.confirmReset = true; btnToast("한 번 더 누르면 처음 자리로 돌아가요", 2.5); return; }
  btnEdit.confirmReset = false;
  btnEdit.draft = Object.create(null); btnEdit.sel = null;
  btnToast("처음 자리로 돌아갔어요");
}
function btnEditCopy() {
  const code = btnLayoutExport(btnEdit.draft);
  btnEdit.code = code;
  const ask = () => { if (typeof prompt === "function") prompt("이 코드를 복사하세요", code); };
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => btnToast("코드를 복사했어요"), () => ask());
    } else ask();
  } catch (e) { ask(); }
  btnToast("코드를 만들었어요");
}
function btnEditPaste() {
  const s = typeof prompt === "function" ? prompt("버튼 코드를 넣어 주세요 (BTN1- 로 시작해요)", "") : null;
  if (s === null || s === undefined) return;
  if (btnLayoutImport(s)) { btnEdit.code = btnLayoutExport(btnLayout); btnToast("코드대로 바꾸고 저장했어요"); }
  else btnToast("코드가 이상해요", 2.5);
}

hookOn("menuItems", (items) => { items.push({ label: "버튼 배치 바꾸기", act: () => { closeOverlay(); openBtnEdit(); } }); }, 6);

hookOn("overlayUpdate", (name, dt) => {
  if (name !== "btnedit") return false;
  if (btnEdit.toastT > 0) btnEdit.toastT -= dt || 0;
  if (wasPressed("Escape", "Enter")) closeBtnEdit(true);
  return true;
});

// 끌기: 창 위의 다른 버튼보다 게임 버튼을 먼저 잡아요 (버튼이 아래 막대에 숨어도 꺼낼 수 있게)
function btnHit(x, y) {
  const items = btnEditItems();
  for (let i = items.length - 2; i >= 0; i--) { const b = items[i]; if ((x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r) return b; } // 버튼이 먼저
  const j = items[items.length - 1];
  return (x - j.x) ** 2 + (y - j.y) ** 2 <= j.r * j.r ? j : null;
}
hookOn("touchDown", (e, x, y) => {
  if (game.overlay !== "btnedit" || !btnEdit.draft) return false;
  if (btnEdit.drag) return true; // 한 번에 하나만
  const b = btnHit(x, y);
  if (!b) return false; // 아래 막대 같은 창 버튼은 원래대로
  btnEdit.sel = b.code;
  btnEdit.drag = { id: e.pointerId, code: b.code, ox: x - b.x, oy: y - b.y };
  btnEdit.confirmReset = false;
  return true;
}, 50);
hookOn("touchMove", (e) => {
  const d = btnEdit.drag;
  if (!d || e.pointerId !== d.id || game.overlay !== "btnedit") return;
  btnEditMove(d.code, e.clientX - d.ox, e.clientY - d.oy);
}, 50);
hookOn("touchEnd", (e) => { if (btnEdit.drag && e.pointerId === btnEdit.drag.id) btnEdit.drag = null; }, 50);

hookOn("overlayDraw", (name) => {
  if (name !== "btnedit") return false;
  // 터치 버튼은 실제 화면 크기 그대로 그려요: 작은 화면 배율을 잠깐 풀어요
  const k = uiK, vw = view.w, vh = view.h, scaled = uiK < 1 && uiSaved;
  ctx.save();
  if (scaled) { ctx.scale(1 / uiK, 1 / uiK); view.w = uiSaved.w; view.h = uiSaved.h; }
  uiK = 1;
  try { drawBtnEdit(); } finally { uiK = k; view.w = vw; view.h = vh; ctx.restore(); }
  return true;
});

function btnBarRect() {
  const W = view.w, H = view.h, gap = 6;
  const bw = Math.max(70, Math.min(120, (W - 380) / 4, (W - 20 - 3 * gap) / 4)), bh = 42;
  const tw = bw * 4 + gap * 3;
  const jsr = Math.max(0.8, touchScale());
  let x0 = 120 * jsr + JOY_R + 10; // 기본 이동 동그라미 오른쪽
  if (x0 + tw > W - 10) x0 = (W - tw) / 2;
  return { x0, y: H - bh - 8, bw, bh, gap };
}

function drawBtnEdit() {
  const W = view.w, H = view.h;
  if (!btnEdit.draft) btnEdit.draft = btnCopyLayout(btnLayout);
  ctx.fillStyle = "rgba(8,10,18,0.78)";
  ctx.fillRect(0, 0, W, H);
  blockUI();

  const sel = btnEdit.sel;
  const items = btnEditItems();
  const bad = btnOverlaps(items);
  // 위: 제목, 설명, 크기 버튼 (뒤 화면 글씨가 비치지 않게 어두운 판)
  const per = Math.max(20, Math.floor((W * 0.5) / 8));
  const codeLines = btnEdit.code ? Math.min(4, Math.ceil(btnEdit.code.length / per)) : 0;
  const hh = 118 + (bad.size ? 22 : 0) + (btnCoop() ? 22 : 0) + (codeLines ? 18 + codeLines * 17 : 0);
  roundRectPath(6, 6, Math.min(W - 12, Math.max(400, per * 8 + 24)), hh, 12);
  ctx.fillStyle = "rgba(18,20,30,0.94)"; ctx.fill();
  ctx.strokeStyle = "rgba(200,160,80,0.6)"; ctx.lineWidth = 2; ctx.stroke();
  const big = W >= 900;
  text("버튼 배치 바꾸기", 16, 34, big ? 26 : 21, "#ffe27a");
  text("버튼을 끌어서 옮겨요. 누르면 골라져요.", 16, 58, 14, "#ddd");
  const selItem = items.find((b) => b.code === sel);
  const canSize = selItem && !selItem.joy;
  drawButton(16, 70, 76, 38, "작게", () => { if (!btnEditResize(btnEdit.sel, -1)) btnToast(btnEdit.sel === "Joy" ? "이동 동그라미는 크기를 못 바꿔요" : "먼저 버튼을 눌러 골라요"); }, { size: 16, color: canSize ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)", textColor: canSize ? "#fff" : "#888" });
  drawButton(98, 70, 76, 38, "크게", () => { if (!btnEditResize(btnEdit.sel, 1)) btnToast(btnEdit.sel === "Joy" ? "이동 동그라미는 크기를 못 바꿔요" : "먼저 버튼을 눌러 골라요"); }, { size: 16, color: canSize ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)", textColor: canSize ? "#fff" : "#888" });
  text(selItem ? `고른 버튼: ${BTN_NAMES[sel]}${canSize ? ` (${Math.round(selItem.k * 100)}%)` : ""}` : "고른 버튼: 없음", 184, 95, 15, selItem ? "#7dd3ff" : "#999");
  let y = 130;
  if (bad.size) { text("빨간 버튼이 겹쳐 있어요 (그래도 저장은 돼요)", 16, y, 14, "#ff8080"); y += 22; }
  if (btnCoop()) { text("둘이 하기 중에는 원래 자리를 써요", 16, y, 14, "#ffd84a"); y += 22; }
  if (btnEdit.code) {
    text("내 코드:", 16, y, 13, "#aaa"); y += 18;
    for (let i = 0; i < btnEdit.code.length && i < per * 4; i += per) { text(btnEdit.code.slice(i, i + per), 16, y, 13, "#9dffc0"); y += 17; }
  }

  // 아래 막대
  const bar = btnBarRect();
  const label = btnEdit.confirmReset ? "정말?" : "처음대로";
  const acts = [
    [label, btnEditReset, btnEdit.confirmReset ? "rgba(220,70,70,0.6)" : "rgba(40,44,60,0.92)"],
    ["코드 복사", btnEditCopy, "rgba(40,44,60,0.92)"],
    ["코드 넣기", btnEditPaste, "rgba(40,44,60,0.92)"],
    ["다 했어요", () => closeBtnEdit(true), "rgba(60,170,100,0.85)"],
  ];
  acts.forEach(([t, fn, color], i) => drawButton(bar.x0 + i * (bar.bw + bar.gap), bar.y, bar.bw, bar.bh, t, fn, { size: bar.bw < 96 ? 14 : 16, color }));

  // 버튼들 (막대 위에 그려요: 끌어서 꺼낼 수 있게)
  for (const b of items) {
    const over = bad.has(b.code), isSel = b.code === sel;
    ctx.save();
    if (b.joy) {
      ctx.globalAlpha = 0.35; ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.6; ctx.fillStyle = "#dfe6ee";
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.47, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalAlpha = 0.8; ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    }
    if (over) { ctx.globalAlpha = 0.5; ctx.fillStyle = "#ff2a2a"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.lineWidth = isSel ? 5 : 3;
    ctx.strokeStyle = isSel ? "#ffe27a" : over ? "#ff5050" : "#ffffff";
    ctx.stroke();
    if (isSel) { ctx.setLineDash && ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 7, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash && ctx.setLineDash([]); }
    ctx.restore();
    if (b.joy) text("이동", b.x, b.y + 6, Math.max(12, b.r * 0.3), "#fff", "center");
    else if (b.icon && typeof hasIcon === "function" && hasIcon(b.icon)) {
      drawIcon(b.icon, b.x, b.y - b.r * 0.14, b.r * 1.05);
      if (b.label) text(b.label, b.x, b.y + b.r * 0.72, Math.max(9, b.r * 0.26), "#fff", "center");
    } else text(b.label || BTN_NAMES[b.code], b.x, b.y + 6, Math.max(12, b.r * 0.36), "#fff", "center");
  }

  if (btnEdit.toastT > 0 && btnEdit.toast) {
    ctx.globalAlpha = Math.min(1, btnEdit.toastT * 2);
    text(btnEdit.toast, W / 2, H * 0.45, 22, btnEdit.toast === "코드가 이상해요" ? "#ff8080" : "#ffe27a", "center");
    ctx.globalAlpha = 1;
  }
}
