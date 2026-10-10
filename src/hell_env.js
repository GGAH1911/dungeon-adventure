// ===== 월드 8 "뜨끈 지옥" 환경 (설계서 docs/design/world8-hell.md 3장) =====
//   ① 불기둥 구멍 vent {x,y,ph}  3.6초 박자: 1.4초 주황 예고 고리 → 0.8초 불기둥(반지름 0.95) → 쉼.
//                                 불기둥에 닿으면 하트 1 + 밖으로 밀려요 (0.8초에 한 번, 하트 1 밑으로는 안 내려가요)
//   ② 뜨끈 바람길 gust {x0,y0,x1,y1,dx,dy}  방을 가로지르는 띠. 안에 있으면 그 방향으로 초당 1.6칸 밀려요 (몬스터도)
//   ③ 시원 샘 spring {x,y,r}    들어가면 하트 1.5 회복 (주인공마다 10초에 한 번)
// 월드 4 용암 강(under_env.js)과 달리 "박자"와 "바람" 이에요.
// 아이 규칙: 환경은 절대 쓰러뜨리지 않아요 (W8.floorHp).
// 같이 하기: 자리는 씨앗 난수(rand). 시계(E.clock)는 던전(또는 보스방)이 시작된 뒤 각 기기가 재요 (거의 같아요).
//   하트는 방장(dungeonTick), 밀림은 각 기기가 자기 주인공에게 (updatePlayer 의 playerSkills: 친구 기기도 불러요).

const W8 = { floorHp: 1, cycle: 3.6, warn: 1.4, burn: 0.8, ventR: 0.95, ventHurt: 1, ventCd: 0.8, push: 1.6, springHeal: 1.5, springCd: 10 };
const W8_ENV_KEYS = ["vent", "gust", "spring"];
function w8Env(w = world) { if (!w.w8) w.w8 = { clock: 0 }; for (const k of W8_ENV_KEYS) if (!w.w8[k]) w.w8[k] = []; return w.w8; }
function w8AddVent(w, x, y, ph = 0) { const v = { x, y, ph }; w8Env(w).vent.push(v); return v; }
function w8AddGust(w, rect, dx, dy) { const g = { ...rect, dx, dy }; w8Env(w).gust.push(g); return g; }
function w8AddSpring(w, x, y, r = 1.2) { const s = { x, y, r }; w8Env(w).spring.push(s); return s; }
// 구멍 상태: 0 쉼, 1 예고(0~1 차오름), 2 불기둥
function w8VentState(v, clock = (world.w8 && world.w8.clock) || 0) {
  const t = ((clock + v.ph) % W8.cycle + W8.cycle) % W8.cycle;
  if (t < W8.warn) return { s: 1, k: t / W8.warn };
  if (t < W8.warn + W8.burn) return { s: 2, k: (t - W8.warn) / W8.burn };
  return { s: 0, k: 0 };
}
function w8FireAt(x, y, pad = 0) { const E = world.w8; return E ? E.vent.find((v) => w8VentState(v).s === 2 && Math.hypot(v.x - x, v.y - y) < W8.ventR + pad) || null : null; }
function w8InGust(x, y) { const E = world.w8; return E ? E.gust.find((g) => x > g.x0 && x < g.x1 && y > g.y0 && y < g.y1) || null : null; }
function w8InSpring(x, y) { const E = world.w8; return E ? E.spring.find((s) => Math.hypot(s.x - x, s.y - y) < s.r) || null : null; }
function w8Hurt(p, n, text, color) {
  if (!p || p.hp <= 0) return false;
  if (p.rollTimer > 0) return false; // 구르면 안 아파요
  const h0 = p.hp;
  if (p.hp > W8.floorHp) p.hp = Math.max(W8.floorHp, p.hp - n);
  p.hurtTimer = Math.max(p.hurtTimer || 0, 0.5); p.stillT = 0; // 아프면 쉬며 차오르기도 처음부터 (survival.js)
  addFloatText(p.x, p.y, p.hp < h0 ? text : "앗 뜨거! (하트 1은 지켜요)", color, 16);
  return p.hp < h0;
}
function w8Teach(key, text) { const E = world.w8; if (!E) return; E.taught = E.taught || {}; if (E.taught[key]) return; E.taught[key] = true; showMessage(text, 2.6, false, "#ffc070"); }
hookOn("reset", () => { if (game.scene !== "dungeon") world.w8 = null; }, 60);

// ===== 놓기 =====
hookOn("monstersSpawned", (def, level, rand) => {
  if (!def || mapWorld(def) !== 8 || !def.features) return;
  world.w8 = null;
  const f = def.features, E = w8Env(), rooms = (world.rooms || []).slice(1);
  if (!rooms.length) return;
  const nearDoor = (x, y, d) => typeof w2NearDoorSpot === "function" && w2NearDoorSpot(x, y, d);
  const pts = () => [...E.vent, ...E.spring];
  const far = (x, y, d) => !pts().some((o) => Math.hypot(o.x - x, o.y - y) < d) && !E.gust.some((g) => x > g.x0 - 1 && x < g.x1 + 1 && y > g.y0 - 1 && y < g.y1 + 1);
  const spot = (pad) => {
    const r = rooms[Math.floor(rand() * rooms.length)];
    const x = r.x + pad + rand() * Math.max(0.1, r.w - pad * 2), y = r.y + pad + rand() * Math.max(0.1, r.h - pad * 2);
    if (hitsWall(x, y, pad) || nearDoor(x, y, 2.5) || (world.start && Math.hypot(x - world.start.x, y - world.start.y) < 5)) return null;
    if (typeof tileH === "function" && tileH(Math.floor(x), Math.floor(y)) !== tileH(Math.floor(x + pad * 0.7), Math.floor(y))) return null;
    return { x, y };
  };
  const tries = (fn, n = 40) => { for (let t = 0; t < n; t++) if (fn()) return true; return false; };
  // 바람길: 방을 짧은 쪽으로 가로지르는 띠(폭 2), 띠를 따라 한쪽으로 불어요
  const gustRooms = new Set();
  for (let i = 0; i < (f.gust || 0); i++) tries(() => {
    const r = rooms[Math.floor(rand() * rooms.length)];
    if (gustRooms.has(r) || r.w < 7 || r.h < 7) return false;
    if (world.start && world.start.x > r.x - 1 && world.start.x < r.x + r.w + 1 && world.start.y > r.y - 1 && world.start.y < r.y + r.h + 1) return false;
    const vert = r.w >= r.h, sgn = rand() < 0.5 ? -1 : 1;
    let rect;
    if (vert) { const x0 = r.x + Math.floor(r.w / 3 + rand() * (r.w / 3 - 2)); rect = { x0, y0: r.y + 0.5, x1: x0 + 2, y1: r.y + r.h - 0.5 }; }
    else { const y0 = r.y + Math.floor(r.h / 3 + rand() * (r.h / 3 - 2)); rect = { x0: r.x + 0.5, y0, x1: r.x + r.w - 0.5, y1: y0 + 2 }; }
    gustRooms.add(r);
    w8AddGust(world, rect, vert ? 0 : sgn, vert ? sgn : 0); // 띠를 따라 불어요 (가로지르는 길은 막지 않아요)
    return true;
  }, 30);
  for (let i = 0; i < (f.spring || 0); i++) tries(() => { const s = spot(1.4); if (!s || !far(s.x, s.y, 3.5)) return false; w8AddSpring(world, s.x, s.y); return true; });
  for (let i = 0; i < (f.vent || 0); i++) tries(() => { const s = spot(1.0); if (!s || !far(s.x, s.y, 2.4)) return false; w8AddVent(world, s.x, s.y, rand() * W8.cycle); return true; });
}, 60);

// ===== 시계 + 밀림 (각 기기: updatePlayer 안의 "playerSkills" 는 같이 하기 친구 기기에서도 자기 주인공에게 불려요) =====
function w8EnvStep(p, dt) {
  const E = world.w8; if (!E || game.scene !== "dungeon" || !p) return;
  dt = dt || 1 / 60;
  if (p === game.player) E.clock += dt;
  if (p.remote || p.hp <= 0) return;
  const g = w8InGust(p.x, p.y);
  if (g) { moveEntity(p, g.dx * W8.push * dt, g.dy * W8.push * dt); if (p === game.player) w8Teach("gust", "뜨끈 바람길! 화살표 쪽으로 밀려요. 옆으로 빠져나와요"); }
}
hookOn("playerSkills", (p, inp, dt) => w8EnvStep(p, dt), 61);
// 내 주인공이 쓰러져 있는 동안에도 시계는 가요 (방장)
hookOn("dungeonTick", (dt) => { const E = world.w8; if (E && game.player && game.player.hp <= 0) E.clock += dt || 1 / 60; }, 61);

// ===== 매 화면 (방장): 하트 계산, 몬스터 밀림 =====
hookOn("dungeonTick", (dt) => {
  const E = world.w8; if (!E || game.scene !== "dungeon") return;
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    p._w8Fire = Math.max(0, (p._w8Fire || 0) - dt);
    const v = w8FireAt(p.x, p.y, (p.r || 0.3) * 0.5);
    if (v && p._w8Fire <= 0) {
      p._w8Fire = W8.ventCd;
      w8Hurt(p, W8.ventHurt, "앗 뜨거!", "#ff9a4a");
      let dx = p.x - v.x, dy = p.y - v.y, d = Math.hypot(dx, dy);
      if (d < 0.05) { dx = -(p.faceX || 1); dy = -(p.faceY || 0); d = Math.hypot(dx, dy) || 1; } // 한가운데면 보던 반대쪽으로
      moveEntity(p, dx / d * 0.9, dy / d * 0.9);
      w8Teach("vent", "불기둥 구멍! 주황 고리가 차오르면 비켜요");
    }
    const s = w8InSpring(p.x, p.y);
    p._w8Drink = Math.max(0, (p._w8Drink || 0) - dt);
    if (s && p._w8Drink <= 0 && p.hp < p.maxHp) {
      p._w8Drink = W8.springCd; p.hp = Math.min(p.maxHp, p.hp + W8.springHeal);
      addFloatText(p.x, p.y, `시원 샘! +${W8.springHeal}`, "#7ad8ff", 18);
      for (let i = 0; i < 8; i++) addSparkle(s.x + (Math.random() - 0.5) * s.r, s.y + (Math.random() - 0.5) * s.r, 0.2, { vz: 1.2, gravity: 2, life: 0.6, size: 0.35, hue: 190 });
    }
    if (s) w8Teach("spring", "시원 샘에 들어가면 하트가 차요!");
  }
  for (const m of monsters) {
    if (m.hp <= 0 || !m.def || m.def.behavior === "prop" || m.boss || m.def.floaty) continue;
    const g = w8InGust(m.x, m.y); if (g) moveEntity(m, g.dx * W8.push * dt, g.dy * W8.push * dt);
  }
}, 62);

// ===== 그리기 =====
hookOn("drawFloor", () => {
  const E = world.w8; if (!E) return;
  const ell = (x, y, r, fill, stroke, lw = 2) => { const c = toScreen(x, y, 0.01); ctx.beginPath(); ctx.ellipse(c.x, c.y, r * TILE_W / 2 * 1.41, r * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } };
  ctx.save();
  for (const g of E.gust) {
    const cx = (g.x0 + g.x1) / 2, cy = (g.y0 + g.y1) / 2; if (!onScreen(cx, cy, Math.max(g.x1 - g.x0, g.y1 - g.y0))) continue;
    const a = toScreen(g.x0, g.y0, 0.01), b = toScreen(g.x1, g.y0, 0.01), c = toScreen(g.x1, g.y1, 0.01), d = toScreen(g.x0, g.y1, 0.01);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
    ctx.fillStyle = "rgba(255,170,90,0.16)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,200,140,0.45)"; ctx.stroke();
    // 흐르는 화살표 (> 모양)
    const len = g.dx ? g.x1 - g.x0 : g.y1 - g.y0, off = (game.time * W8.push) % 1.5;
    for (let s = off; s < len; s += 1.5) {
      const px = g.dx ? (g.dx > 0 ? g.x0 + s : g.x1 - s) : cx, py = g.dy ? (g.dy > 0 ? g.y0 + s : g.y1 - s) : cy;
      const tip = toScreen(px + g.dx * 0.35, py + g.dy * 0.35, 0.02), l = toScreen(px - g.dy * 0.4, py - g.dx * 0.4, 0.02), r = toScreen(px + g.dy * 0.4, py + g.dx * 0.4, 0.02);
      ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(r.x, r.y); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,230,190,0.75)"; ctx.stroke();
    }
  }
  for (const s of E.spring) if (onScreen(s.x, s.y, 3)) {
    ell(s.x, s.y, s.r, "rgba(110,210,235,0.6)", "rgba(230,250,255,0.9)", 3);
    const k = (game.time * 0.7) % 1; ell(s.x, s.y, s.r * k, null, `rgba(255,255,255,${0.6 * (1 - k)})`);
  }
  for (const v of E.vent) if (onScreen(v.x, v.y, 2)) {
    const st = w8VentState(v);
    ell(v.x, v.y, 0.55, "rgba(40,20,16,0.9)", "rgba(120,60,40,0.9)", 2);
    if (st.s === 1) { ell(v.x, v.y, W8.ventR, `rgba(255,140,40,${0.12 + 0.25 * st.k})`, "rgba(255,170,60,0.9)", 2.5); ell(v.x, v.y, W8.ventR * st.k, null, "rgba(255,230,120,0.95)", 3); }
    if (st.s === 2) ell(v.x, v.y, W8.ventR, "rgba(255,120,30,0.55)", "rgba(255,240,150,0.95)", 3);
  }
  ctx.restore();
});
hookOn("worldThings", (things) => {
  const E = world.w8; if (!E) return;
  for (const v of E.vent) {
    if (!onScreen(v.x, v.y, 2) || w8VentState(v).s !== 2) continue;
    things.push({ depth: v.x + v.y + 0.1, x: v.x, y: v.y, draw: () => {
      const k = w8VentState(v).k, h = 1.6 * Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5 + 0.2);
      drawBox(v.x - 0.32, v.y - 0.32, 0, 0.64, 0.64, h, "#ff7a2a");
      drawBox(v.x - 0.2, v.y - 0.2, 0.1, 0.4, 0.4, h + 0.25, "#ffc040");
      drawBox(v.x - 0.09, v.y - 0.09, 0.2, 0.18, 0.18, h + 0.45, "#fff0a0");
    } });
  }
});
hookOn("lights", (lights) => {
  const E = world.w8; if (!E || game.scene !== "dungeon") return;
  for (const v of E.vent) if (onScreen(v.x, v.y, 4)) { const st = w8VentState(v); lights.push({ x: v.x, y: v.y, radius: st.s === 2 ? 2.4 : 1.0, power: st.s === 2 ? 0.8 : 0.3 }); }
  for (const s of E.spring) if (onScreen(s.x, s.y, 4)) lights.push({ x: s.x, y: s.y, radius: s.r + 1.0, power: 0.5 });
});
