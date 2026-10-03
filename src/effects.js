// ===== 효과: 조각 튀기, 먼지, 떨어진 아이템, 숫자 =====

let particles = [];
let pickups = [];     // 바닥에 떨어진 에메랄드, 사과
let floatTexts = [];  // 떠오르는 숫자/글씨

function spawnBurst(x, y, colors, count = 12) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5;
    particles.push({
      x, y, z: 0.5 + Math.random() * 0.5,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 2 + Math.random() * 3,
      life: 0.8 + Math.random() * 0.5, size: 0.08 + Math.random() * 0.06,
      color: colors[i % colors.length],
    });
  }
}

function spawnDust(x, y) {
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x, y, z: 0.05, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.8, vz: 0.8,
      life: 0.35, size: 0.07, color: "#b9b3a8",
    });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.vz -= 12 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; }
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

// ----- 떨어진 아이템 -----
function dropPickup(type, x, y) {
  pickups.push({ type, x: x + (Math.random() - 0.5) * 0.4, y: y + (Math.random() - 0.5) * 0.4, t: Math.random() * 6 });
}

// 가까이 가면 빨려와요
function updatePickups(player, dt, onPickup) {
  for (const e of pickups) {
    e.t += dt;
    const dx = player.x - e.x, dy = player.y - e.y;
    const d = Math.hypot(dx, dy);
    if (player.hp <= 0) continue;
    if (d < 2 && d > 0.01) {
      e.x += (dx / d) * 7 * dt;
      e.y += (dy / d) * 7 * dt;
    }
    if (d < 0.45) { e.taken = true; onPickup(e); }
  }
  pickups = pickups.filter((e) => !e.taken);
}

function drawPickup(e) {
  const z = 0.25 + Math.sin(e.t * 4) * 0.08;
  if (e.type === "apple") {
    drawBox(e.x - 0.12, e.y - 0.12, z, 0.24, 0.24, 0.22, "#d8342c");
    drawBox(e.x - 0.02, e.y - 0.02, z + 0.22, 0.04, 0.04, 0.08, "#5a3a1a");
    drawBox(e.x + 0.02, e.y - 0.06, z + 0.26, 0.1, 0.06, 0.03, "#3fae3f");
    return;
  }
  const c = toScreen(e.x, e.y, z);
  const w = 7 * ZOOM, h = 12 * ZOOM;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - h); ctx.lineTo(c.x + w, c.y); ctx.lineTo(c.x, c.y + h); ctx.lineTo(c.x - w, c.y);
  ctx.closePath();
  ctx.fillStyle = CONFIG.colors.emerald; ctx.fill();
  ctx.strokeStyle = "#0b5a31"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(c.x - 2, c.y - 6, 3, 5);
}

// ----- 떠오르는 글씨 (데미지 숫자 등) -----
function addFloatText(x, y, str, color = "#fff", size = 18) {
  floatTexts.push({ x, y, z: 1.3, str, color, size, life: 0.8, max: 0.8, dx: (Math.random() - 0.5) * 0.3 });
}

function updateFloatTexts(dt) {
  for (const f of floatTexts) { f.z += dt * 1.2; f.life -= dt; }
  floatTexts = floatTexts.filter((f) => f.life > 0);
}

function drawFloatTexts() {
  for (const f of floatTexts) {
    const s = toScreen(f.x + f.dx, f.y - f.dx, f.z);
    ctx.globalAlpha = Math.min(1, (f.life / f.max) * 2);
    const color = f.color === "rainbow" ? rainbow(game.time * 500, 65) : f.color;
    text(f.str, s.x, s.y, f.size * ZOOM * 0.8, color, "center");
    ctx.globalAlpha = 1;
  }
}
