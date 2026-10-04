// ===== 전체 화면 =====
// 안드로이드 크롬: 주소창을 숨기고 가로 화면으로 고정해요.
// "앱 설치(홈 화면에 추가)"로 설치하면 처음부터 전체 화면으로 열려요.

// 안드로이드·아이폰 앱(Capacitor) 안이면 이미 전체 화면이에요 (app/ 폴더)
function isNativeApp() {
  const C = typeof window !== "undefined" ? window.Capacitor : null;
  return !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
}
function isInstalledApp() {
  return isNativeApp() || matchMedia("(display-mode: fullscreen)").matches ||
    matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;
}

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function canFullscreen() {
  const el = document.documentElement;
  return !isInstalledApp() && !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

function lockLandscape() {
  try {
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
  } catch (e) { /* 안 되는 기기는 그냥 넘어가요 */ }
}

// 전체 화면을 원하는지 기억해요. 아이패드는 두 손가락을 모으는 동작(핀치)으로,
// 안드로이드는 화면 가장자리 밀기로 전체 화면이 저절로 풀려요 (웹페이지가 막을 수 없어요).
// 메뉴로 끈 게 아니면 다음에 화면을 누를 때 다시 켜요. 1분에 3번 넘게 풀리면 그만 켜고 홈 화면 추가를 알려줘요.
const fsAuto = { want: false, lost: false, exits: [], tip: false };
function isIPad() {
  const n = typeof navigator !== "undefined" ? navigator : {};
  return /iPad/.test(n.userAgent || "") || (n.platform === "MacIntel" && (n.maxTouchPoints || 0) > 1);
}
function fsOnChange(now = Date.now()) {
  if (isFullscreen() || !fsAuto.want) { fsAuto.lost = false; return; }
  fsAuto.lost = true;
  fsAuto.exits = fsAuto.exits.filter((t) => now - t < 60000);
  fsAuto.exits.push(now);
}
// 화면을 뗄 때 (브라우저는 누르는 순간에만 전체 화면을 허락해요)
function fsOnTap(pointerType, now = Date.now()) {
  if (!fsAuto.lost || !fsAuto.want || pointerType !== "touch" || !canFullscreen()) return false;
  fsAuto.lost = false;
  if (fsAuto.exits.filter((t) => now - t < 60000).length > 3) {
    if (!fsAuto.tip && typeof showMessage === "function") {
      fsAuto.tip = true;
      showMessage(isIPad() ? "전체 화면이 자꾸 풀려요. 공유 버튼 → 홈 화면에 추가로 열면 안 풀려요" : "전체 화면이 자꾸 풀려요. 오른쪽 위 ⛶ 버튼으로 다시 켤 수 있어요", 5, false, "#ffe27a");
    }
    return false;
  }
  enterFullscreen();
  return true;
}

// 버튼을 누를 때만 쓸 수 있어요 (브라우저 규칙)
function enterFullscreen() {
  fsAuto.want = true;
  if (!canFullscreen() || isFullscreen()) return;
  const el = document.documentElement;
  try {
    const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: "hide" }) : el.webkitRequestFullscreen();
    if (r && r.then) r.then(lockLandscape).catch(() => {});
    else lockLandscape();
  } catch (e) { /* 안 되면 그냥 넘어가요 */ }
}

function exitFullscreen() {
  fsAuto.want = false; fsAuto.lost = false;
  if (!isFullscreen()) return;
  (document.exitFullscreen || document.webkitExitFullscreen).call(document);
}

function toggleFullscreen() {
  if (isFullscreen()) exitFullscreen();
  else enterFullscreen();
}

document.addEventListener("fullscreenchange", () => { fsOnChange(); setTimeout(resizeCanvas, 100); });
document.addEventListener("webkitfullscreenchange", () => { fsOnChange(); setTimeout(resizeCanvas, 100); });
document.addEventListener("pointerup", (e) => { try { fsOnTap(e.pointerType); } catch (err) { /* 무시 */ } }, true);
