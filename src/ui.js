// ===== 화면 글씨, 버튼, 아이콘 그리기 도구 =====

// ----- 작은 화면(휴대폰)용 크기 맞추기 -----
// 창은 최소 이 크기라고 생각하고 배치한 다음, 화면이 작으면 통째로 줄여서 그려요.
// (버튼 누르는 자리도 같이 줄어들어요)
let uiK = 1;
let uiSaved = null;
function beginUIScale(minW, minH) {
  uiK = Math.min(1, view.w / minW, view.h / minH);
  if (uiK >= 1) { uiK = 1; return; }
  uiSaved = { w: view.w, h: view.h };
  ctx.save();
  ctx.scale(uiK, uiK);
  view.w = uiSaved.w / uiK;
  view.h = uiSaved.h / uiK;
}
// 오류로 endUIScale 을 못 불렀을 때 원래대로 (main.js reportLoopError)
function uiRecover() {
  if (uiSaved && uiK < 1) { view.w = uiSaved.w; view.h = uiSaved.h; }
  uiK = 1; uiSaved = null;
  try { for (let i = 0; i < 24; i++) ctx.restore(); const d = typeof renderScale === "function" ? renderScale() : 1; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.globalAlpha = 1; } catch (e) { /* 그만 */ }
}
function endUIScale() {
  if (uiK < 1 && uiSaved) {
    view.w = uiSaved.w;
    view.h = uiSaved.h;
    ctx.restore();
  }
  uiSaved = null;
  uiK = 1;
}

function text(str, x, y, size, color = "#fff", align = "left") {
  ctx.font = `bold ${size}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  ctx.textAlign = align;
  ctx.lineWidth = Math.max(3, size / 6);
  ctx.strokeStyle = "rgba(0,0,0,0.7)";
  ctx.lineJoin = "round";
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 창 (가게, 지도, 메뉴)
// 창 (뒤를 어둡게 하고 뒤 버튼은 못 누르게 막아요: blockUI). 창 위에 얹는 작은 상자는 drawInfoBox 를 써요
function drawPanel(x, y, w, h) {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, view.w, view.h);
  blockUI();
  roundRectPath(x, y, w, h, 16);
  ctx.fillStyle = "rgba(24,22,32,0.96)";
  ctx.fill();
  ctx.strokeStyle = "#c8a050";
  ctx.lineWidth = 3;
  ctx.stroke();
}
// 상자만 (어둡게 하지도, 누르기를 막지도 않아요: 결과창 안의 안내·같이 하기 배너). drawBox 는 3D 블록이에요
function drawInfoBox(x, y, w, h) {
  roundRectPath(x, y, w, h, 12);
  ctx.fillStyle = "rgba(24,22,32,0.96)";
  ctx.fill();
  ctx.strokeStyle = "#c8a050";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// 누를 수 있는 버튼
function drawButton(x, y, w, h, label, onTap, opts = {}) {
  roundRectPath(x, y, w, h, 10);
  ctx.fillStyle = opts.selected ? "rgba(255,226,122,0.28)" : opts.color || "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = opts.selected ? "#ffe27a" : "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  text(label, x + w / 2, y + h / 2 + (opts.size || 18) * 0.36, opts.size || 18, opts.textColor || "#fff", "center");
  if (onTap) addUI(x, y, w, h, onTap);
}

function drawEmeraldIcon(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.65, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.65, y);
  ctx.closePath();
  ctx.fillStyle = CONFIG.colors.emerald;
  ctx.fill();
  ctx.strokeStyle = "#0b5a31"; ctx.lineWidth = 1.5; ctx.stroke();
}

// 하트 (fill: 0 빈 하트, 0.5 반 하트, 1 꽉 찬 하트)
const HEART_SHAPE = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];
function drawHeart(x, y, size, fill) {
  const s = size / 7;
  for (let r = 0; r < HEART_SHAPE.length; r++)
    for (let c = 0; c < 7; c++) {
      if (HEART_SHAPE[r][c] !== "1") continue;
      const filled = fill >= 1 || (fill >= 0.5 && c < 4);
      ctx.fillStyle = filled ? (r === 1 && c === 1 ? "#ffb3b3" : "#e23b3b") : "#3a3d44";
      ctx.fillRect(x + c * s, y + r * s, s + 0.5, s + 0.5);
    }
}


// ----- 받침에 맞는 조사 붙이기: josa("분노", "이/가") -> "분노가", josa("집중", "이/가") -> "집중이" -----
// 쓸 수 있는 짝: "이/가", "을/를", "은/는", "과/와", "으로/로", "이에요/예요"
function hasBatchim(word) {
  const s = String(word).trim();
  if (!s) return false;
  const ch = s[s.length - 1], code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[0-9]/.test(ch)) return "0136784".includes(ch); // 영·일·삼·육·칠·팔 받침 있음 (2이 4사 5오 9구 없음)
  return false;
}
function josa(word, pair) {
  const [withB, withoutB] = pair.split("/");
  const s = String(word);
  if (withB === "으로") {
    const last = s.trim().slice(-1), code = last.charCodeAt(0);
    const rieul = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 8; // ㄹ 받침은 "로"
    return s + (hasBatchim(s) && !rieul ? "으로" : "로");
  }
  return s + (hasBatchim(s) ? withB : withoutB);
}
