// ===== 오류 기록 =====
// 게임 안에서 오류가 나면 기기에 남겨 둬요 (최근 12개). 메뉴의 "오류 기록 복사"로 아빠에게 보낼 수 있어요.
// 화면 버튼을 누를 때 난 오류, 게임 루프 오류, 그 밖의 오류(window error, promise) 모두 여기로 모여요.
const ERRLOG_KEY = "dungeon-adventure-errors-v1";
const ERRLOG_MAX = 12;
function errLogAll() {
  try { const a = JSON.parse(localStorage.getItem(ERRLOG_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function errLogAdd(err, where) {
  const msg = String((err && err.message) || err || "?").slice(0, 200);
  const stack = String((err && err.stack) || "").split("\n").slice(0, 7).map((l) => l.replace(/https?:\/\/[^\s)]*?\/(src\/)/g, "$1").trim()).join(" | ").slice(0, 700);
  const g = typeof game !== "undefined" ? game : {};
  const entry = {
    t: new Date().toISOString(), where, msg, stack, n: 1,
    scene: g.scene, overlay: g.overlay, cls: g.profile && g.profile.cls, lv: g.profile && g.profile.level,
    screen: `${window.innerWidth}x${window.innerHeight}`, ua: String(navigator.userAgent || "").slice(0, 140),
    ver: errLogVer(),
  };
  const all = errLogAll();
  const top = (st) => String(st).split(" | ").slice(0, 3).join(" | "); // 오류 이름 + 위쪽 두 줄이 같으면 같은 오류
  const same = all.find((x) => x.msg === msg && top(x.stack) === top(stack));
  if (same) { same.n = (same.n || 1) + 1; same.t = entry.t; same.scene = entry.scene; same.overlay = entry.overlay; }
  else all.push(entry);
  while (all.length > ERRLOG_MAX) all.shift();
  try { localStorage.setItem(ERRLOG_KEY, JSON.stringify(all)); } catch (e) { /* 저장 못 해도 그만 */ }
  return entry;
}
function errLogVer() { try { const sc = document.querySelector && document.querySelector('script[src*="main.js"]'); return sc ? String(sc.src).split("?")[1] || "" : ""; } catch (e) { return ""; } }
function errLogText() { return JSON.stringify({ game: "dungeon-adventure", errors: errLogAll() }, null, 1); }
window.addEventListener("error", (ev) => {
  errLogAdd(ev.error || ev.message, "window");
  try { if (typeof showMessage === "function") showMessage("앗, 오류가 났어요 (메뉴 > 오류 기록 복사)", 2.5); } catch (e) { /* 그만 */ }
});
window.addEventListener("unhandledrejection", (ev) => { errLogAdd(ev.reason, "promise"); });
if (typeof hookOn === "function") hookOn("menuItems", (items) => {
  const n = errLogAll().length;
  if (!n) return;
  items.push({ label: `오류 기록 복사 (${n})`, act: () => { closeOverlay(); if (typeof qolCopy === "function") qolCopy(errLogText(), "오류 기록 (아빠에게 보내 주세요)", "오류 기록을 복사했어요! 아빠에게 보내 주세요"); } });
  items.push({ label: "오류 기록 지우기", act: () => { try { localStorage.removeItem(ERRLOG_KEY); } catch (e) { /* 그만 */ } closeOverlay(); showMessage("오류 기록을 지웠어요", 1.5); } });
}, 90);
