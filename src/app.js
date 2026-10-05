// ===== 안드로이드 앱(Capacitor)에서만 하는 일 =====
// 웹(브라우저)에서는 window.Capacitor 가 없어서 아무 일도 안 해요. (앱 만들기: docs/design/android-app.md)
//   1) 뒤로 가기 버튼: 창이 열려 있으면 닫고, 아니면 메뉴를 열어요. 처음 화면에서만 "끌까요?" 물어보고 꺼요
//   2) 저장 지키기: localStorage(기기 브라우저 저장)를 앱 저장소(Preferences)에도 한 벌 더 적어 둬요.
//      앱 데이터가 이상하게 지워져 localStorage 가 비어 있으면, 켤 때 Preferences 에서 되살리고 한 번 다시 켜요
//   가로 화면·전체 화면·화면 꺼짐 막기·소리 바로 나기는 안드로이드 쪽(MainActivity.java)에서 해요
// 이 파일은 hooks.js 바로 다음에 불러요 (되살리기를 캐릭터 저장을 읽기 전에 시작하려고)

const APP_SAVE_PREFIX = "dungeon-adventure";      // 우리 게임 저장 이름은 모두 이걸로 시작해요 (chars.js, save.js, btnlayout.js)
const APP_MIRROR_KEY = "da-save-mirror-v1";       // Preferences 에 적는 이름
function appIsNative() { return typeof window !== "undefined" && !!window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform(); }
function appPlugin(name) {
  const C = window.Capacitor;
  if (!C) return null;
  if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
  try { return typeof C.registerPlugin === "function" ? C.registerPlugin(name) : null; } catch (e) { return null; }
}

// ----- 1) 뒤로 가기: 무엇을 할지 고르기 (순수 함수: 시험 119) -----
//   st = { scene, overlay, textBox }  ->  "closeBox" | "closeMenu" | "escape" | "menu" | "exit"
function appBackAction(st) {
  st = st || {};
  if (st.textBox) return "closeBox";             // 글 입력 창 (이름 바꾸기·저장 코드)
  if (st.overlay === "menu") return "closeMenu";  // 메뉴가 열려 있으면 닫기
  if (st.overlay) return "escape";                // 다른 창은 그 창의 Esc 처리대로 (가게·교환·집 꾸미기 ...)
  if (!st.scene || st.scene === "title") return "exit"; // 처음 화면: 끌까요?
  return "menu";                                  // 캠프·던전: 메뉴 열기 (게임 중에 실수로 꺼지지 않게)
}
function appBackState() {
  return { scene: typeof game !== "undefined" ? game.scene : null, overlay: typeof game !== "undefined" ? game.overlay : null, textBox: typeof qolBoxOpen !== "undefined" && !!qolBoxOpen };
}
function appOnBack() {
  const act = appBackAction(appBackState());
  if (act === "closeBox") { if (typeof qolCloseBox === "function") qolCloseBox(); return act; }
  if (act === "closeMenu") { if (typeof closeOverlay === "function") closeOverlay(); return act; }
  if (act === "menu") { if (typeof openMenu === "function") openMenu(); return act; }
  if (act === "escape") {
    const ov = game.overlay;
    pressed.Escape = true; // 창마다 Esc 를 받아 스스로 닫아요
    // Esc 를 안 받는 창은 잠깐 뒤에 그냥 닫아요 (결과창은 버튼으로만: 보상을 놓치지 않게)
    setTimeout(() => { if (game.overlay === ov && ov !== "result" && ov !== "vote") closeOverlay(); }, 250);
    return act;
  }
  // 처음 화면: 정말 끌까요?
  if (window.confirm("던전 모험을 끌까요?")) { const A = appPlugin("App"); if (A && A.exitApp) A.exitApp(); }
  return act;
}

// ----- 2) 저장 지키기 -----
function appCollectSaves(ls = localStorage) {
  const out = {};
  for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(APP_SAVE_PREFIX)) out[k] = ls.getItem(k); }
  return out;
}
let appMirrorT = null;
function appMirrorSoon() {
  if (!appIsNative()) return;
  clearTimeout(appMirrorT);
  appMirrorT = setTimeout(() => {
    const P = appPlugin("Preferences");
    try { if (P) P.set({ key: APP_MIRROR_KEY, value: JSON.stringify({ at: Date.now(), saves: appCollectSaves() }) }); } catch (e) { /* 못 적어도 localStorage 는 그대로 */ }
  }, 1500); // 저장이 몰려도 1.5초에 한 번
}
// localStorage 가 비었는데 Preferences 에 저장이 있으면 되살리고 한 번 다시 켜요 (true = 다시 켜는 중)
async function appRestoreIfEmpty() {
  if (!appIsNative()) return false;
  if (Object.keys(appCollectSaves()).length) return false;
  const P = appPlugin("Preferences"); if (!P) return false;
  try {
    const r = await P.get({ key: APP_MIRROR_KEY });
    const m = r && r.value ? JSON.parse(r.value) : null;
    if (!m || !m.saves || !Object.keys(m.saves).length) return false;
    for (const [k, v] of Object.entries(m.saves)) if (k.startsWith(APP_SAVE_PREFIX) && typeof v === "string") localStorage.setItem(k, v);
    if (sessionStorage.getItem("da-restored")) return false; // 두 번 돌지 않게
    sessionStorage.setItem("da-restored", "1");
    location.reload();
    return true;
  } catch (e) { return false; }
}

if (appIsNative()) {
  appRestoreIfEmpty();
  const A = appPlugin("App");
  try { if (A && A.addListener) A.addListener("backButton", () => appOnBack()); } catch (e) { /* 뒤로 가기는 기본 동작 */ }
  // 앱을 내려놓을 때(홈 버튼) 바로 저장 + 한 벌 더
  try { if (A && A.addListener) A.addListener("pause", () => { try { if (typeof saveProfile === "function" && game.profile) saveProfile(); } catch (e) { /* 무시 */ } appMirrorSoon(); }); } catch (e) { /* 무시 */ }
  hookOn("profileSaved", () => appMirrorSoon(), 90);
}
