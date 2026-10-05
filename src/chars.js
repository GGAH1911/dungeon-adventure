// ===== 캐릭터 여러 개 =====
// 처음 화면에서 캐릭터를 고르거나 새로 만들어요 (최대 6개). 캐릭터마다 저장이 따로예요.
// - 캐릭터마다 따로: 이름, 직업(만들 때 정해요), 레벨, 장비·가방, 화폐, 깬 맵, 열쇠, 난이도 ...
// - 모두 같이: 공용 보관함(캠프 상자), 도감, 설정(안내·FPS). 버튼 배치는 기기에 따로 (btnlayout.js)
// 저장 자리:
//   목록   dungeon-adventure-chars-v1  = { v, active, next, list: [{ id, name, cls, level, look, last }] }
//   캐릭터 dungeon-adventure-save-v1 (1번, 예전 저장 그대로) / dungeon-adventure-save-v1-c2 ...
//   공용   dungeon-adventure-shared-v1 = { stash: [장비], codex, settings, guideSeen, qol }

const CHARS_KEY = "dungeon-adventure-chars-v1";
const SHARED_KEY = "dungeon-adventure-shared-v1";
const CHAR_MAX = 6;
const SAVE_BASE = "dungeon-adventure-save-v1";
const SHARED_FIELDS = ["codex", "settings", "guideSeen", "qol"];
function charKey(id) { return id === 1 ? SAVE_BASE : `${SAVE_BASE}-c${id}`; }

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

// ----- 목록 -----
function loadChars() {
  let idx = lsGet(CHARS_KEY);
  if (!idx || !Array.isArray(idx.list)) {
    // 처음: 예전 저장이 있으면 1번 캐릭터로 (백업도 남겨요)
    idx = { v: 1, active: null, next: 2, list: [] };
    const old = lsGet(SAVE_BASE);
    if (old && old.level) {
      try { localStorage.setItem(SAVE_BASE + "-backup-before-chars", localStorage.getItem(SAVE_BASE)); } catch (e) { /* 백업 실패는 무시 */ }
      idx.list.push({ id: 1, name: (typeof old.name === "string" && old.name) || "모험가", cls: old.cls || "warrior", level: old.level, look: old.look || {}, last: Date.now(), old: true });
      idx.active = 1;
    }
    lsSet(CHARS_KEY, idx);
  }
  idx.list = idx.list.filter((c) => c && Number.isInteger(c.id) && c.id > 0).slice(0, CHAR_MAX);
  if (!Number.isInteger(idx.next) || idx.next < 2) idx.next = Math.max(2, ...idx.list.map((c) => c.id + 1));
  if (!idx.list.some((c) => c.id === idx.active)) idx.active = idx.list[0] ? idx.list[0].id : null;
  return idx;
}
const chars = { idx: loadChars(), ui: { mode: "pick", step: 0, name: "", cls: "warrior", del: null, delT: 0 } };
function saveChars() { lsSet(CHARS_KEY, chars.idx); }
function activeChar() { return chars.idx.list.find((c) => c.id === chars.idx.active) || null; }
// 게임을 켤 때: 고른 캐릭터의 저장 자리 (main.js 의 loadProfile 이 이 자리를 읽어요)
SAVE_KEY = charKey(chars.idx.active || 1);

// ----- 공용 -----
let SHARED = null;
function sharedStore() {
  if (!SHARED) { SHARED = lsGet(SHARED_KEY); if (!SHARED || typeof SHARED !== "object") SHARED = { seeded: false }; }
  if (!Array.isArray(SHARED.stash)) SHARED.stash = [];
  return SHARED;
}
function sharedStash() { const st = sharedStore().stash; return st; }
function saveShared() { lsSet(SHARED_KEY, sharedStore()); }

hookOn("profileLoaded", (pr) => {
  const sh = sharedStore();
  if (sh.seeded) { for (const k of SHARED_FIELDS) if (sh[k] !== undefined) pr[k] = sh[k]; }
  if (typeof pr.name !== "string") pr.name = (activeChar() && activeChar().name) || "모험가";
}, 1);
// 저장할 때 목록(카드에 보일 것)과 공용 칸도 같이
hookOn("profileSaved", (pr) => {
  const sh = sharedStore();
  for (const k of SHARED_FIELDS) if (pr[k] !== undefined) sh[k] = pr[k];
  sh.seeded = true;
  saveShared();
  const c = chars.idx.list.find((x) => charKey(x.id) === SAVE_KEY);
  if (c) { c.name = pr.name || c.name; c.cls = pr.cls || c.cls; c.level = pr.level; c.look = pr.look || {}; c.last = Date.now(); saveChars(); }
}, 50);

// ----- 고르기·만들기·지우기 -----
function selectChar(id) {
  const c = chars.idx.list.find((x) => x.id === id); if (!c) return false;
  if (game.profile && SAVE_KEY === charKey(chars.idx.active || 1) && activeChar()) saveProfile();
  chars.idx.active = id; saveChars();
  SAVE_KEY = charKey(id);
  if (typeof CLS_STATE !== "undefined") for (const k of Object.keys(CLS_STATE)) delete CLS_STATE[k];
  game.profile = loadProfile();
  if (!game.profile.cls) game.profile.cls = c.cls;
  return true;
}
const NAME_IDEAS = ["용감이", "번개", "별빛", "튼튼이", "바람", "불꽃", "새싹", "얼음"];
function cleanName(s) { return String(s || "").replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 8); }
function createChar(name, cls) {
  if (chars.idx.list.length >= CHAR_MAX) return null;
  if (!CLASS_DEFS[cls]) cls = "warrior";
  const id = chars.idx.list.some((c) => c.id === 1) || lsGet(SAVE_BASE) ? chars.idx.next++ : 1;
  const nm = cleanName(name) || NAME_IDEAS[chars.idx.list.length % NAME_IDEAS.length];
  chars.idx.list.push({ id, name: nm, cls, level: 1, look: {}, last: Date.now() });
  chars.idx.active = id; saveChars();
  SAVE_KEY = charKey(id);
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 없으면 그만 */ }
  const pr = newProfile();
  pr.name = nm; pr.cls = cls; pr.clsLocked = true; pr.clsSeen = true;
  hookRun("profileLoaded", pr);
  game.profile = pr;
  if (typeof CLS_STATE !== "undefined") for (const k of Object.keys(CLS_STATE)) delete CLS_STATE[k];
  saveProfile();
  return id;
}
function deleteChar(id) {
  const c = chars.idx.list.find((x) => x.id === id); if (!c) return false;
  try { const raw = localStorage.getItem(charKey(id)); if (raw) localStorage.setItem(`${charKey(id)}-deleted-${Date.now()}`, raw); localStorage.removeItem(charKey(id)); } catch (e) { /* 그래도 목록에서는 빼요 */ }
  chars.idx.list = chars.idx.list.filter((x) => x.id !== id);
  if (chars.idx.active === id) chars.idx.active = chars.idx.list[0] ? chars.idx.list[0].id : null;
  saveChars();
  SAVE_KEY = charKey(chars.idx.active || 1);
  game.profile = chars.idx.active ? loadProfile() : newProfile();
  return true;
}

// ----- 이름 바꾸기 (처음 화면 카드의 ✎, 캠프 메뉴 "이름 바꾸기") -----
// 그 캐릭터 저장(이름 칸)과 목록 카드를 같이 바꿔요. 이름 규칙은 만들 때와 같아요 (글자·숫자·띄어쓰기, 8글자)
function renameChar(id, name) {
  const c = chars.idx.list.find((x) => x.id === id); if (!c) return false;
  const nm = cleanName(name); if (!nm) return false;
  c.name = nm;
  if (game.profile && SAVE_KEY === charKey(id)) { game.profile.name = nm; saveProfile(); } // 지금 캐릭터: 저장하면 목록도 같이 바뀌어요
  else { const raw = lsGet(charKey(id)); if (raw && typeof raw === "object") { raw.name = nm; lsSet(charKey(id), raw); } }
  saveChars();
  if (game.player && SAVE_KEY === charKey(id)) game.player.netName = typeof netCleanName === "function" ? netCleanName(nm) : nm;
  return true;
}
function askRename(id) {
  const c = chars.idx.list.find((x) => x.id === id); if (!c) return false;
  let v = null;
  try { v = window.prompt("새 이름 (8글자까지)", c.name || ""); } catch (e) { v = null; }
  if (v === null) return false; // 취소
  if (!cleanName(v)) { showMessage("이름은 글자나 숫자로 써 주세요", 2); return false; }
  const old = c.name;
  if (!renameChar(id, v)) return false;
  const net = typeof netOn === "function" && netOn();
  showMessage(`이름을 바꿨어요: ${old} → ${c.name}${net ? " (친구 화면엔 다음에 같이 할 때부터)" : ""}`, net ? 3 : 2.4, false, "#7dffb0");
  return true;
}
hookOn("menuItems", (items) => {
  if (game.scene !== "lobby" || !activeChar() || SAVE_KEY !== charKey(activeChar().id)) return;
  items.push({ label: `이름 바꾸기 (지금: ${game.profile.name})`, act: () => { closeOverlay(); askRename(activeChar().id); } });
}, 4);

// ===== 처음 화면 =====
function startWithChar(id) {
  if (!selectChar(id)) return;
  if (touch.show && typeof enterFullscreen === "function") enterFullscreen();
  enterLobby(`${game.profile.name}의 모험!`);
}
hookOn("titleUpdate", () => {
  const ui = chars.ui;
  ui.delT = Math.max(0, ui.delT - 1 / 60);
  if (ui.mode === "new") {
    if (wasPressed("Escape")) { ui.mode = "pick"; ui.step = 0; }
    if (ui.step === 1) {
      const i = CLASS_ORDER.indexOf(ui.cls);
      if (wasPressed("ArrowRight", "KeyD")) ui.cls = CLASS_ORDER[(i + 1) % CLASS_ORDER.length];
      if (wasPressed("ArrowLeft", "KeyA")) ui.cls = CLASS_ORDER[(i + CLASS_ORDER.length - 1) % CLASS_ORDER.length];
      if (wasPressed("Enter", "Space")) finishNewChar();
    } else if (wasPressed("Enter", "Space")) ui.step = 1;
    return true;
  }
  if (wasPressed("Enter", "Space")) {
    if (activeChar()) startWithChar(activeChar().id); else openNewChar();
  }
  return true;
}, 50);
function openNewChar() {
  if (chars.idx.list.length >= CHAR_MAX) { showMessage(`캐릭터는 ${CHAR_MAX}개까지예요. 하나를 지우면 새로 만들 수 있어요`, 3); return; }
  const ui = chars.ui; ui.mode = "new"; ui.step = 0; ui.name = ""; ui.cls = "warrior";
}
function askName() {
  let v = null;
  try { v = window.prompt("캐릭터 이름 (8글자까지)", chars.ui.name || ""); } catch (e) { v = null; }
  if (v !== null) chars.ui.name = cleanName(v);
}
function finishNewChar() {
  const ui = chars.ui;
  const id = createChar(ui.name, ui.cls);
  ui.mode = "pick"; ui.step = 0;
  if (!id) return;
  if (touch.show && typeof enterFullscreen === "function") enterFullscreen();
  enterLobby(`${game.profile.name}의 모험 시작!`);
  if (typeof openWardrobe === "function") openWardrobe(); // 옷 고르기
}

function fmtDay(t) {
  if (!t) return "";
  const d = new Date(t), now = new Date();
  const days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  return days <= 0 ? "오늘" : days === 1 ? "어제" : `${days}일 전`;
}

hookOn("titleDraw", () => {
  if (typeof CLASS_DEFS === "undefined") return false; // 아직 다 안 읽혔어요
  const W = view.w, H = view.h, ui = chars.ui;
  ctx.fillStyle = "rgba(0,0,0,0.62)"; ctx.fillRect(0, 0, W, H);
  text("던전 모험", W / 2, 58, 46, "#ffe27a", "center");
  if (ui.mode === "new") return drawNewChar(W, H), true;
  text(chars.idx.list.length ? "누구로 모험할까요?" : "캐릭터를 만들어요!", W / 2, 92, 18, "#ddd", "center");
  const cols = 3, cw = Math.min(250, (W - 60) / cols - 12), chh = Math.min(150, (H - 210) / 2 - 12);
  const gx = (W - cols * (cw + 12) + 12) / 2, gy = 112;
  const slots = chars.idx.list.slice();
  const cards = slots.map((c) => ({ c })); if (cards.length < CHAR_MAX) cards.push({ add: true });
  cards.forEach((card, i) => {
    const x = gx + (i % cols) * (cw + 12), y = gy + Math.floor(i / cols) * (chh + 12);
    if (card.add) {
      drawButton(x, y, cw, chh, "", openNewChar, { color: "rgba(80,200,120,0.18)" });
      text("+", x + cw / 2, y + chh / 2 - 4, 44, "#7dffb0", "center");
      text("새 캐릭터 만들기", x + cw / 2, y + chh / 2 + 32, 16, "#7dffb0", "center");
      return;
    }
    const c = card.c, def = CLASS_DEFS[c.cls] || CLASS_DEFS.warrior, on = c.id === chars.idx.active;
    drawButton(x, y, cw, chh, "", () => startWithChar(c.id), { selected: on, color: "rgba(255,255,255,0.06)" });
    // 모습: 직업 그림 + 옷 색
    const look = { ...CONFIG.colors.player, ...(c.look || {}) };
    ctx.fillStyle = def.color; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x + 46, y + chh / 2, 32, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = look.shirt; ctx.fillRect(x + 32, y + chh / 2 + 4, 28, 22);
    ctx.fillStyle = look.skin; ctx.fillRect(x + 35, y + chh / 2 - 20, 22, 22);
    ctx.fillStyle = look.hair; ctx.fillRect(x + 35, y + chh / 2 - 24, 22, 7);
    drawIcon(def.icon, x + 70, y + chh / 2 + 18, 28);
    text(c.name, x + 92, y + chh / 2 - 14, 20, "#fff");
    text(`${def.name} · Lv ${c.level || 1}`, x + 92, y + chh / 2 + 10, 15, def.color);
    text(fmtDay(c.last), x + 92, y + chh / 2 + 32, 12, "#999");
    // 지우기 (두 번 눌러야)
    const del = ui.del === c.id && ui.delT > 0;
    drawButton(x + cw - 34, y + 6, 28, 26, "✕", () => {
      if (ui.del === c.id && ui.delT > 0) { deleteChar(c.id); ui.del = null; showMessage("캐릭터를 지웠어요", 1.5); }
      else { ui.del = c.id; ui.delT = 3; }
    }, { size: 13, color: del ? "rgba(220,70,70,0.7)" : "rgba(255,255,255,0.08)" });
    if (del) text("한 번 더 누르면 지워져요", x + cw / 2, y + chh - 10, 13, "#ff8080", "center");
    // 이름 바꾸기
    drawButton(x + cw - 68, y + 6, 28, 26, "✎", () => askRename(c.id), { size: 13, color: "rgba(255,255,255,0.08)" });
  });
  const yb = gy + 2 * (chh + 12) + 8;
  if (touch.show) {
    if (canFullscreen() && !isFullscreen()) drawButton(W / 2 - 90, yb, 180, 38, "⛶ 전체 화면", enterFullscreen, { size: 15 });
  } else text("카드를 눌러 시작 · 엔터: 지금 캐릭터로 시작", W / 2, yb + 22, 15, "#ccc", "center");
  return true;
}, 50);

function drawNewChar(W, H) {
  const ui = chars.ui;
  const pw = Math.min(700, W - 30), ph = Math.min(380, H - 110), x0 = (W - pw) / 2, y0 = 86;
  drawPanel(x0, y0, pw, ph);
  drawButton(x0 + pw - 54, y0 + 10, 42, 36, "✕", () => { ui.mode = "pick"; }, { size: 18 });
  if (ui.step === 0) {
    text("1. 이름을 지어요", x0 + 24, y0 + 40, 22, "#ffe27a");
    drawButton(x0 + 24, y0 + 60, pw - 48, 56, ui.name ? `이름: ${ui.name}  (눌러서 바꾸기)` : "여기를 눌러 이름 쓰기", askName, { size: 19, color: "rgba(80,160,220,0.35)" });
    text("또는 골라요", x0 + 24, y0 + 142, 14, "#aaa");
    const bw = (pw - 48 - 3 * 10) / 4;
    NAME_IDEAS.forEach((n, i) => drawButton(x0 + 24 + (i % 4) * (bw + 10), y0 + 152 + Math.floor(i / 4) * 50, bw, 42, n, () => { ui.name = n; }, { selected: ui.name === n, size: 16 }));
    drawButton(x0 + pw - 184, y0 + ph - 60, 160, 46, "다음 ▶", () => { if (!ui.name) ui.name = NAME_IDEAS[chars.idx.list.length % NAME_IDEAS.length]; ui.step = 1; }, { color: "rgba(80,200,120,0.45)", size: 19 });
    return;
  }
  text(`2. ${ui.name}의 직업을 골라요`, x0 + 24, y0 + 40, 22, "#ffe27a");
  text("직업은 캐릭터마다 하나예요. 다른 직업은 새 캐릭터로!", x0 + 24, y0 + 64, 13, "#aaa");
  const n = CLASS_ORDER.length, cw = (pw - 48 - (n - 1) * 10) / n;
  CLASS_ORDER.forEach((c, i) => {
    const d = CLASS_DEFS[c], x = x0 + 24 + i * (cw + 10), y = y0 + 78, h = ph - 160;
    drawButton(x, y, cw, h, "", () => { ui.cls = c; }, { selected: ui.cls === c, color: ui.cls === c ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.05)" });
    drawIcon(d.icon, x + cw / 2, y + 44, 52);
    text(d.name, x + cw / 2, y + 96, 19, d.color, "center");
    const lines = wrapLines(d.desc || "", cw - 14, 12).slice(0, 4);
    lines.forEach((l, k) => text(l, x + cw / 2, y + 122 + k * 18, 12, "#ccc", "center"));
  });
  drawButton(x0 + 24, y0 + ph - 60, 130, 46, "◀ 이름", () => { ui.step = 0; }, { size: 17 });
  drawButton(x0 + pw - 204, y0 + ph - 60, 180, 46, "만들기!", finishNewChar, { color: "rgba(80,200,120,0.5)", size: 20 });
}
