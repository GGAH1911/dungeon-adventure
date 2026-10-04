// ===== 효과: 조각 튀기, 먼지, 떨어진 아이템, 숫자 =====

let particles = [];
let pickups = [];     // 바닥에 떨어진 에메랄드, 사과
let floatTexts = [];  // 떠오르는 숫자/글씨

function spawnBurst(x, y, colors, count = 12) { hookRun("event", "burst", [x, y, colors, count]); return spawnBurstBase(x, y, colors, count); }
function spawnBurstBase(x, y, colors, count = 12) {
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

// 반짝이 색: 에메랄드 초록, 화폐는 화폐 색, 장비는 등급 색
const PICKUP_HUE = { silver: 210, amethyst: 275, gold: 46, diamond: 186 };
const RARITY_HUE = [210, 214, 275, 46, 186];
function pickupHue(e) { return e.type === "coin" ? PICKUP_HUE[e.cur] || 140 : e.type === "item" ? RARITY_HUE[(e.item && e.item.r) || 0] : 140; }

// 튀어 나왔다가 바닥에 떨어지고, 가까이 가면 빨려와요
// 에메랄드 자동 줍기: 가장 가까운 살아있는 주인공에게 포물선으로 날아와 빨려 들어가요
// 돌려주는 값 true = 이 주인공 차례에 처리 끝 (다른 주인공 차례면 건드리지 않아요)
function emeraldHome(e, player, dt, onPickup) {
  if (!e.home || !e.home.target || e.home.target.hp <= 0) {
    const t = typeof nearestPlayer === "function" ? nearestPlayer(e.x, e.y) : player;
    if (!t || t.hp <= 0) return true;
    e.home = { target: t, t: 0, x0: e.x, y0: e.y, delay: Math.random() * 0.25 };
  }
  if (e.home.target !== player) return true;
  const h = e.home;
  h.t += dt;
  if (h.t < h.delay) { e.z = Math.max(e.z || 0, 0) + dt * 1.5; return true; } // 살짝 떠오르기
  const k = h.t - h.delay;
  const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy);
  const speed = Math.min(26, 5 + k * 34); // 점점 빨라져요
  if (d > 0.01) { const m = Math.min(d, speed * dt); e.x += dx / d * m; e.y += dy / d * m; }
  e.z = 0.35 + Math.min(1.2, d * 0.25) * Math.min(1, k * 4); // 높이 떠서 날아와요
  e.spin = (e.spin || 0) + dt * 18;
  const hue = pickupHue(e);
  if (Math.random() < dt * 30) addSparkle(e.x, e.y, e.z + 0.2, { life: 0.35, size: 0.45, hue, vz: 0.3 });
  if (d < 0.35) {
    e.taken = true; onPickup(e);
    addRing(player.x, player.y, { speed: 4, life: 0.25, hue });
    for (let i = 0; i < 4; i++) { const a = Math.random() * Math.PI * 2; addSparkle(player.x, player.y, 0.9, { vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, vz: 1.5, gravity: 5, life: 0.35, size: 0.5, hue }); }
    if (e.type === "emerald") game.emeraldBumpAt = game.time; // 화면 위 에메랄드가 통통 (hud.js)
  }
  return true;
}

function updatePickups(player, dt, onPickup) {
  for (const e of pickups) {
    if (e.home) { if (e.home.target === player || !e.home.target || e.home.target.hp <= 0) { e.t += dt; emeraldHome(e, player, dt, onPickup); } continue; }
    e.t += dt;
    if (e.vz !== undefined && (e.z > 0 || e.vz > 0)) {
      e.vz -= 12 * dt;
      e.z += e.vz * dt;
      if (!hitsWall(e.x + e.vx * dt, e.y, 0.1)) e.x += e.vx * dt; else e.vx *= -0.4;
      if (!hitsWall(e.x, e.y + e.vy * dt, 0.1)) e.y += e.vy * dt; else e.vy *= -0.4;
      if (e.z <= 0) { e.z = 0; e.vz = Math.abs(e.vz) > 2 ? -e.vz * 0.35 : 0; e.vx *= 0.5; e.vy *= 0.5; }
      if (e.z > 0 || e.vz > 0) continue;
    }
    // 에메랄드는 바닥에 닿으면 저절로 주인공에게 날아와요 (자동 줍기)
    // 화폐도 저절로, 장비는 빛기둥을 잠깐 보여준 뒤 날아와요
    if ((e.type === "emerald" || e.type === "coin") && e.t >= 0.45 && emeraldHome(e, player, dt, onPickup)) continue;
    if (e.type === "item" && e.t >= 1.1 && emeraldHome(e, player, dt, onPickup)) continue;
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
  if (e.type === "buffpot") { drawBuffPotPickup(e, z); return; } // 강화 물약 (buffpots.js)
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
  if (e.type === "coin") {
    const c = toScreen(e.x, e.y, z + 0.05);
    drawCurrencyIcon(e.cur, c.x, c.y, 8 * ZOOM);
    if (Math.sin(e.t * 6 + e.x) > 0.75) drawStar(c.x + 4 * ZOOM, c.y - 6 * ZOOM, 5 * ZOOM, "#ffffff");
    return;
  }
  if (e.type === "item") {
    const it = e.item, rar = RARITIES[(it && it.r) || 0];
    const base = toScreen(e.x, e.y, 0);
    // 등급 색 빛기둥 (보통은 짧게, 전설·신화는 높게)
    if (!e.home) {
      const hgt = (60 + it.r * 35) * ZOOM, w = (6 + it.r * 2) * ZOOM;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, base.y, 0, base.y - hgt);
      g.addColorStop(0, rar.color + "aa"); g.addColorStop(1, rar.color + "00");
      ctx.fillStyle = g; ctx.globalAlpha = 0.55 + 0.25 * Math.sin(e.t * 5);
      ctx.fillRect(base.x - w / 2, base.y - hgt, w, hgt);
      ctx.restore();
    }
    const c = toScreen(e.x, e.y, z + 0.1);
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.beginPath(); ctx.arc(c.x, c.y, 11 * ZOOM, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rar.color; ctx.lineWidth = 2.5 * ZOOM; ctx.stroke(); ctx.restore();
    if (typeof drawItemIcon === "function") drawItemIcon(it, c.x, c.y, 18 * ZOOM);
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
function addFloatText(x, y, str, color = "#fff", size = 18) { hookRun("event", "float", [x, y, str, color, size]); return addFloatTextBase(x, y, str, color, size); }
function addFloatTextBase(x, y, str, color = "#fff", size = 18) {
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
