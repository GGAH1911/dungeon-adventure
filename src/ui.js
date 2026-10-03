// ===== 화면 글씨, 버튼, 아이콘 그리기 도구 =====

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

// 받침 있으면 "을", 없으면 "를"
function josa(word, withFinal, withoutFinal) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return withoutFinal;
  return code % 28 !== 0 ? withFinal : withoutFinal;
}
