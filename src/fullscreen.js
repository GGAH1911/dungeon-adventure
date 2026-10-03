// ===== 전체 화면 =====
// 안드로이드 크롬: 주소창을 숨기고 가로 화면으로 고정해요.
// "앱 설치(홈 화면에 추가)"로 설치하면 처음부터 전체 화면으로 열려요.

function isInstalledApp() {
  return matchMedia("(display-mode: fullscreen)").matches ||
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

// 버튼을 누를 때만 쓸 수 있어요 (브라우저 규칙)
function enterFullscreen() {
  if (!canFullscreen() || isFullscreen()) return;
  const el = document.documentElement;
  try {
    const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: "hide" }) : el.webkitRequestFullscreen();
    if (r && r.then) r.then(lockLandscape).catch(() => {});
    else lockLandscape();
  } catch (e) { /* 안 되면 그냥 넘어가요 */ }
}

function exitFullscreen() {
  if (!isFullscreen()) return;
  (document.exitFullscreen || document.webkitExitFullscreen).call(document);
}

function toggleFullscreen() {
  if (isFullscreen()) exitFullscreen();
  else enterFullscreen();
}

document.addEventListener("fullscreenchange", () => setTimeout(resizeCanvas, 100));
document.addEventListener("webkitfullscreenchange", () => setTimeout(resizeCanvas, 100));
