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
// type: emerald 에메랄드, apple 사과, arrows 화살 묶음, special 특수 화살, potion 물약, item 장비
function dropPickup(type, x, y, extra = {}) {
  const a = Math.random() * Math.PI * 2, s = 0.8 + Math.random() * 1.2;
  pickups.push({ type, x, y, z: 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 2.5, t: Math.random() * 0.2, ...extra });
}

// 튀어 나왔다가 바닥에 떨어지고, 가까이 가면 빨려와요
function updatePickups(player, dt, onPickup) {
  for (const e of pickups) {
    e.t += dt;
    if (e.vz !== undefined && (e.z > 0 || e.vz > 0)) {
      e.vz -= 12 * dt;
      e.z += e.vz * dt;
      if (!hitsWall(e.x + e.vx * dt, e.y, 0.1)) e.x += e.vx * dt; else e.vx *= -0.4;
      if (!hitsWall(e.x, e.y + e.vy * dt, 0.1)) e.y += e.vy * dt; else e.vy *= -0.4;
      if (e.z <= 0) { e.z = 0; e.vz = Math.abs(e.vz) > 2 ? -e.vz * 0.35 : 0; e.vx *= 0.5; e.vy *= 0.5; }
      if (e.z > 0 || e.vz > 0) continue;
    }
    const dx = player.x - e.x, dy = player.y - e.y;
    const d = Math.hypot(dx, dy);
    if (player.hp <= 0 || e.t < 0.35) continue;
    const magnet = e.type === "item" ? 1.2 : 2;
    if (d < magnet && d > 0.01) {
      e.x += (dx / d) * 7 * dt;
      e.y += (dy / d) * 7 * dt;
    }
    if (d < 0.45) { e.taken = true; onPickup(e); }
  }
  pickups = pickups.filter((e) => !e.taken);
}

function drawPickup(e) {
  const z = (e.z || 0) + 0.22 + Math.sin(e.t * 4) * 0.06;
  if (e.type === "apple") {
    drawBox(e.x - 0.12, e.y - 0.12, z, 0.24, 0.24, 0.22, "#d8342c");
    drawBox(e.x - 0.02, e.y - 0.02, z + 0.22, 0.04, 0.04, 0.08, "#5a3a1a");
    drawBox(e.x + 0.02, e.y - 0.06, z + 0.26, 0.1, 0.06, 0.03, "#3fae3f");
    return;
  }
  if (e.type === "potion") {
    drawBox(e.x - 0.1, e.y - 0.1, z, 0.2, 0.2, 0.24, "#c64fa0");
    drawBox(e.x - 0.04, e.y - 0.04, z + 0.24, 0.08, 0.08, 0.08, "#ffd6f2");
    return;
  }
  if (e.type === "arrows" || e.type === "special") {
    const tip = e.type === "special" ? arrowTypeById(e.arrowType).color : "#dfe6ee";
    for (let i = -1; i <= 1; i++) {
      const a = toScreen(e.x - 0.2, e.y + i * 0.08, z);
      const b = toScreen(e.x + 0.2, e.y + i * 0.08, z);
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 3 * ZOOM;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.fillStyle = tip; ctx.beginPath(); ctx.arc(b.x, b.y, 3 * ZOOM, 0, Math.PI * 2); ctx.fill();
    }
    return;
  }
  if (e.type === "material") {
    // 부품: 반짝이는 작은 결정
    const m = MATERIALS[e.mat] || MATERIALS.scrap;
    const sz = 0.2 + Math.sin(e.t * 5) * 0.02;
    drawBox(e.x - sz / 2, e.y - sz / 2, z, sz, sz, sz * 1.2, m.color);
    if (Math.sin(e.t * 6 + e.x) > 0.6) { const c = toScreen(e.x, e.y, z + sz * 1.3); drawStar(c.x, c.y, 6 * ZOOM, "#ffffff"); }
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
    const age = f.max - f.life;
    const pop = age < 0.12 ? 1.7 - age * 5.8 : 1; // 처음에 크게 튀어나와요
    ctx.globalAlpha = Math.min(1, (f.life / f.max) * 2);
    const color = f.color === "rainbow" ? rainbow(game.time * 500, 65) : f.color;
    text(f.str, s.x, s.y, f.size * ZOOM * 0.8 * pop, color, "center");
    ctx.globalAlpha = 1;
  }
}
