// ===== 월드 7 "픽셀 사이버 세계" 환경 (설계서 docs/design/world7-cyber.md 2장) =====
//   ① 글리치 칸 glitch   {x,y,r}  안에 있으면 1.5초마다 "지지직!" 하트 0.5 (하트 1 밑으로는 안 내려가요). 몬스터는 안 아파요
//   ② 충전 패드 charge   {x,y}    밟으면 하트 1.5 (주인공마다 10초에 한 번)
//   ③ 순간이동 패드 tele {a:{x,y}, b:{x,y}}  한쪽을 밟으면 짝 패드로 슝 (주인공마다 2초 쉬고)
// 아이 규칙: 환경은 절대 쓰러뜨리지 않아요 (W7.floorHp).
// 놓기: 씨앗 난수(rand)로 monstersSpawned 에서 -> 같이 하기 두 기기가 같은 자리 (바뀌는 상태 없음).
// 하트는 방장(dungeonTick)이 모든 주인공에 대해, 순간이동은 각 기기가 자기 주인공을 (playersUpdated, 친구는 자리를 보내요).

const W7 = { floorHp: 1, glitchHurt: 0.5, glitchEvery: 1.5, chargeHeal: 1.5, chargeCd: 10, chargeR: 0.6, teleR: 0.5, teleCd: 2 };
const W7_ENV_KEYS = ["glitch", "charge", "tele"];
function w7Env(w = world) { if (!w.w7) w.w7 = {}; for (const k of W7_ENV_KEYS) if (!w.w7[k]) w.w7[k] = []; return w.w7; }
// 보스방에서는 환경을 안 써요 (보스방은 던전 world 를 다시 써서 world.w7 이 남아 있어요. 다시 도전으로 돌아오면 그대로 다시 켜져요)
function w7E() { const kh = game.keyhunt; return game.scene !== "dungeon" || (kh && kh.inBoss) ? null : world.w7; } // 캠프로 돌아와도 안 보이게
function w7InGlitch(x, y) { const E = w7E(); return !!(E && E.glitch.some((q) => Math.hypot(q.x - x, q.y - y) < q.r)); }
function w7Hurt(p, n, text, color) {
  if (!p || p.hp <= 0) return;
  if (p.hp > W7.floorHp) p.hp = Math.max(W7.floorHp, p.hp - n);
  p.hurtTimer = Math.max(p.hurtTimer || 0, 0.5); p.stillT = 0; // 아프면 쉬며 차오르기도 처음부터 (survival.js)
  addFloatText(p.x, p.y, text, color, 16);
}
function w7Teach(key, text) { const E = w7E(); if (!E) return; E.taught = E.taught || {}; if (E.taught[key]) return; E.taught[key] = true; showMessage(text, 2.6, false, "#8fe8ff"); }
hookOn("reset", () => { if (game.scene !== "dungeon") world.w7 = null; }, 60);

// ===== 놓기 =====
hookOn("monstersSpawned", (def, level, rand) => {
  if (!def || mapWorld(def) !== 7 || !def.features) return;
  world.w7 = null;
  const f = def.features, E = w7Env(), rooms = (world.rooms || []).slice(1);
  if (!rooms.length) return;
  const nearDoor = (x, y, d) => typeof w2NearDoorSpot === "function" && w2NearDoorSpot(x, y, d);
  const all = () => [...E.glitch, ...E.charge, ...E.tele.flatMap((t) => [t.a, t.b])];
  const far = (x, y, d) => !all().some((o) => Math.hypot(o.x - x, o.y - y) < d);
  const spot = (pad, r0) => {
    const r = r0 || rooms[Math.floor(rand() * rooms.length)];
    const x = r.x + pad + rand() * Math.max(0.1, r.w - pad * 2), y = r.y + pad + rand() * Math.max(0.1, r.h - pad * 2);
    if (hitsWall(x, y, pad) || nearDoor(x, y, 2.5) || (world.start && Math.hypot(x - world.start.x, y - world.start.y) < 5)) return null;
    if (typeof tileH === "function" && tileH(Math.floor(x), Math.floor(y)) !== tileH(Math.floor(x + pad * 0.7), Math.floor(y))) return null;
    return { x, y, room: r };
  };
  const tries = (fn, n = 40) => { for (let t = 0; t < n; t++) if (fn()) return true; return false; };
  for (let i = 0; i < (f.glitch || 0); i++) tries(() => { const s = spot(1.6); if (!s || !far(s.x, s.y, 3)) return false; E.glitch.push({ x: s.x, y: s.y, r: 1.2 + rand() * 0.5 }); return true; });
  for (let i = 0; i < (f.charge || 0); i++) tries(() => { const s = spot(1.0); if (!s || !far(s.x, s.y, 3.5)) return false; E.charge.push({ x: s.x, y: s.y }); return true; });
  for (let i = 0; i < (f.tele || 0); i++) tries(() => {
    const a = spot(1.0); if (!a || !far(a.x, a.y, 3)) return false;
    let b = null; for (let t = 0; t < 30 && !b; t++) { const s = spot(1.0); if (s && s.room !== a.room && far(s.x, s.y, 3) && Math.hypot(s.x - a.x, s.y - a.y) > 8) b = s; }
    if (!b) return false;
    E.tele.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, hue: [190, 310, 90, 45][i % 4] });
    return true;
  });
}, 60);

// ===== 매 화면 (방장): 하트 계산 =====
hookOn("dungeonTick", (dt) => {
  const E = w7E(); if (!E || game.scene !== "dungeon") return;
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    if (w7InGlitch(p.x, p.y)) {
      p._w7G = (p._w7G || 0) + dt;
      w7Teach("glitch", "지지직 글리치 칸! 안에 있으면 조금씩 아파요. 얼른 나와요");
      if (p._w7G >= W7.glitchEvery) { p._w7G = 0; w7Hurt(p, W7.glitchHurt, "지지직!", "#d08aff"); }
    } else p._w7G = 0;
    p._w7C = Math.max(0, (p._w7C || 0) - dt);
    const c = E.charge.find((o) => Math.hypot(o.x - p.x, o.y - p.y) < W7.chargeR);
    if (c) w7Teach("charge", "충전 패드! 밟으면 하트가 차요 (10초에 한 번)");
    if (c && p._w7C <= 0 && p.hp < p.maxHp) {
      p._w7C = W7.chargeCd; p.hp = Math.min(p.maxHp, p.hp + W7.chargeHeal);
      addFloatText(p.x, p.y, `충전 완료! +${W7.chargeHeal}`, "#7affb0", 18);
      for (let i = 0; i < 8; i++) addSparkle(c.x + (Math.random() - 0.5) * 0.8, c.y + (Math.random() - 0.5) * 0.8, 0.2, { vz: 1.4, gravity: 0, life: 0.6, size: 0.35, hue: 140 });
    }
  }
}, 62);
// 순간이동 (각 기기가 자기 주인공을)
function w7TeleTarget(x, y) {
  const E = w7E(); if (!E) return null;
  for (const t of E.tele) { if (Math.hypot(t.a.x - x, t.a.y - y) < W7.teleR) return t.b; if (Math.hypot(t.b.x - x, t.b.y - y) < W7.teleR) return t.a; }
  return null;
}
hookOn("playersUpdated", (dt) => {
  if (!w7E() || game.scene !== "dungeon") return;
  for (const p of allPlayers()) {
    if (!p || p.remote || p.hp <= 0) continue;
    p._w7T = Math.max(0, (p._w7T || 0) - (dt || 1 / 60));
    if (p._w7T > 0) continue;
    const to = w7TeleTarget(p.x, p.y);
    if (!to) continue;
    const s = findFreeSpot(to.x, to.y, p.r || 0.3, 1.5) || to;
    spawnBurst(p.x, p.y, ["#5ad8ff", "#ffffff"], 10);
    p.x = s.x; p.y = s.y; p._w7T = W7.teleCd;
    spawnBurst(p.x, p.y, ["#5ad8ff", "#ffffff"], 10);
    if (typeof sfx !== "undefined" && sfx.orb) sfx.orb();
    w7Teach("tele", "순간이동 패드! 짝 패드로 슝 옮겨져요");
  }
}, 62);

// ===== 그리기 =====
hookOn("drawFloor", () => {
  const E = w7E(); if (!E) return;
  const ell = (x, y, r, fill, stroke, dash) => {
    const c = toScreen(x, y, 0.01);
    ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, r * TILE_W / 2 * 1.41, r * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = stroke; if (dash) { ctx.setLineDash([6, 5]); ctx.lineDashOffset = -game.time * 12; } ctx.stroke(); ctx.restore();
  };
  for (const q of E.glitch) if (onScreen(q.x, q.y, 3)) {
    const k = 0.4 + 0.2 * Math.sin(game.time * 13 + q.x);
    ell(q.x, q.y, q.r, `rgba(150,60,220,${k})`, "rgba(220,140,255,0.9)", true);
    if (Math.random() < 0.25) { const a = Math.random() * 6.28, r = Math.random() * q.r, s = toScreen(q.x + Math.cos(a) * r, q.y + Math.sin(a) * r, 0.02); ctx.fillStyle = Math.random() < 0.5 ? "#ff5ad8" : "#5ad8ff"; ctx.fillRect(s.x - 6 * ZOOM, s.y - 2 * ZOOM, 12 * ZOOM, 4 * ZOOM); }
  }
  for (const c of E.charge) if (onScreen(c.x, c.y, 2)) { const k = (game.time * 0.8) % 1; ell(c.x, c.y, W7.chargeR, "rgba(60,220,140,0.5)", "rgba(200,255,220,0.95)"); ell(c.x, c.y, W7.chargeR * k, "rgba(0,0,0,0)", `rgba(255,255,255,${0.7 * (1 - k)})`); }
  for (const t of E.tele) for (const e of [t.a, t.b]) if (onScreen(e.x, e.y, 2)) ell(e.x, e.y, W7.teleR + 0.1, `hsla(${t.hue},90%,60%,0.45)`, `hsla(${t.hue},100%,85%,0.95)`, true);
});
hookOn("lights", (lights) => {
  const E = w7E(); if (!E || game.scene !== "dungeon") return;
  for (const c of E.charge) if (onScreen(c.x, c.y, 4)) lights.push({ x: c.x, y: c.y, radius: 1.6, power: 0.6 });
  for (const t of E.tele) for (const e of [t.a, t.b]) if (onScreen(e.x, e.y, 4)) lights.push({ x: e.x, y: e.y, radius: 1.4, power: 0.5 });
  for (const q of E.glitch) if (onScreen(q.x, q.y, 4)) lights.push({ x: q.x, y: q.y, radius: q.r + 0.5, power: 0.35 });
});
