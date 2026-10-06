// ===== 월드 6 "색모래 사막" 환경 (설계서 docs/design/world6-desert.md 2장) =====
//   ① 모래 늪 quicksand  {x,y,r}  안에 있으면 느려지고, 2초마다 "쑥!" 하트 0.5 (하트 1 밑으로는 안 내려가요)
//   ② 오아시스 oasis     {x,y,r}  들어가면 하트 2 회복 (주인공마다 8초에 한 번), 반짝 물결
//   ③ 선인장 cactus      {x,y}    막혀요(부딪힘). 몸이 닿으면 따끔 하트 0.5 + 살짝 밀려요 (하트 1 밑으로는 안 내려가요, 1.2초에 한 번)
// 아이 규칙: 환경은 절대 쓰러뜨리지 않아요 (W6.floorHp).
// 놓기: 씨앗 난수(rand)로 monstersSpawned 에서. 같이 하기 두 기기가 같은 자리를 만들어요 (바뀌는 상태가 없어서 따로 보낼 게 없어요).
// 하트 계산은 방장(dungeonTick)이 모든 주인공(allPlayers)에 대해, 느려지기는 각 기기가 자기 주인공에 대해 (둘 다 같은 목록을 봐요).

const W6 = { floorHp: 1, sinkHurt: 0.5, sinkEvery: 2.0, oasisHeal: 2, oasisCd: 8, cactusHurt: 0.5, cactusCd: 1.2 };
const W6_ENV_KEYS = ["quicksand", "oasis", "cactus"];
function w6Env(w = world) { if (!w.w6) w.w6 = {}; for (const k of W6_ENV_KEYS) if (!w.w6[k]) w.w6[k] = []; return w.w6; }
function w6AddQuicksand(w, x, y, r = 1.6) { const q = { x, y, r }; w6Env(w).quicksand.push(q); return q; }
function w6AddOasis(w, x, y, r = 1.3) { const o = { x, y, r }; w6Env(w).oasis.push(o); return o; }
function w6AddCactus(w, x, y) { const c = { x, y }; w6Env(w).cactus.push(c); if (w.solids) w.solids.push({ x, y, r: 0.32, w6: true }); return c; }
function w6InSand(x, y) { const E = world.w6; return !!(E && E.quicksand.some((q) => Math.hypot(q.x - x, q.y - y) < q.r)); }
function w6InOasis(x, y) { const E = world.w6; return E ? E.oasis.find((o) => Math.hypot(o.x - x, o.y - y) < o.r) || null : null; }
function w6Hurt(p, n, text, color) {
  if (!p || p.hp <= 0) return;
  if (p.hp > W6.floorHp) p.hp = Math.max(W6.floorHp, p.hp - n);
  p.hurtTimer = Math.max(p.hurtTimer || 0, 0.5); p.stillT = 0; // 아프면 쉬며 차오르기도 처음부터 (survival.js)
  addFloatText(p.x, p.y, text, color, 16);
}
function w6Teach(key, text) { const E = world.w6; if (!E) return; E.taught = E.taught || {}; if (E.taught[key]) return; E.taught[key] = true; showMessage(text, 2.6, false, "#ffe08a"); }
hookOn("reset", () => { if (game.scene !== "dungeon") world.w6 = null; }, 60);

// ===== 놓기 =====
hookOn("monstersSpawned", (def, level, rand) => {
  if (!def || mapWorld(def) !== 6 || !def.features) return;
  world.w6 = null;
  const f = def.features, E = w6Env(), rooms = (world.rooms || []).slice(1);
  if (!rooms.length) return;
  const nearDoor = (x, y, d) => typeof w2NearDoorSpot === "function" && w2NearDoorSpot(x, y, d);
  const all = () => [...E.quicksand, ...E.oasis, ...E.cactus];
  const far = (x, y, d) => !all().some((o) => Math.hypot(o.x - x, o.y - y) < d);
  const spot = (pad) => {
    const r = rooms[Math.floor(rand() * rooms.length)];
    const x = r.x + pad + rand() * Math.max(0.1, r.w - pad * 2), y = r.y + pad + rand() * Math.max(0.1, r.h - pad * 2);
    if (hitsWall(x, y, pad) || nearDoor(x, y, 2.5) || (world.start && Math.hypot(x - world.start.x, y - world.start.y) < 5)) return null;
    if (typeof tileH === "function" && tileH(Math.floor(x), Math.floor(y)) !== tileH(Math.floor(x + pad * 0.7), Math.floor(y))) return null;
    return { x, y };
  };
  const tries = (fn, n = 40) => { for (let t = 0; t < n; t++) if (fn()) return true; return false; };
  for (let i = 0; i < (f.quicksand || 0); i++) tries(() => { const s = spot(1.8); if (!s || !far(s.x, s.y, 3)) return false; w6AddQuicksand(world, s.x, s.y, 1.4 + rand() * 0.5); return true; });
  for (let i = 0; i < (f.oasis || 0); i++) tries(() => { const s = spot(1.5); if (!s || !far(s.x, s.y, 3.5)) return false; w6AddOasis(world, s.x, s.y); return true; });
  for (let i = 0; i < (f.cactus || 0); i++) tries(() => { const s = spot(0.8); if (!s || !far(s.x, s.y, 1.8)) return false; w6AddCactus(world, s.x, s.y); return true; });
}, 60);

// ===== 매 화면 (방장): 하트 계산 =====
hookOn("dungeonTick", (dt) => {
  const E = world.w6; if (!E || game.scene !== "dungeon") return;
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    if (w6InSand(p.x, p.y)) {
      p._w6Sink = (p._w6Sink || 0) + dt;
      w6Teach("sand", "모래 늪! 쑥쑥 빠지고 느려져요. 얼른 나와요");
      if (p._w6Sink >= W6.sinkEvery) { p._w6Sink = 0; w6Hurt(p, W6.sinkHurt, "쑥!", "#e0c08a"); }
    } else p._w6Sink = 0;
    const o = w6InOasis(p.x, p.y);
    p._w6Drink = Math.max(0, (p._w6Drink || 0) - dt);
    if (o && p._w6Drink <= 0 && p.hp < p.maxHp) {
      p._w6Drink = W6.oasisCd; p.hp = Math.min(p.maxHp, p.hp + W6.oasisHeal);
      addFloatText(p.x, p.y, `오아시스 물! +${W6.oasisHeal}`, "#7ad8ff", 18);
      for (let i = 0; i < 8; i++) addSparkle(o.x + (Math.random() - 0.5) * o.r, o.y + (Math.random() - 0.5) * o.r, 0.2, { vz: 1.2, gravity: 2, life: 0.6, size: 0.35, hue: 190 });
    }
    if (o) w6Teach("oasis", "오아시스 물을 마시면 하트가 차요!");
    p._w6Cac = Math.max(0, (p._w6Cac || 0) - dt);
    const c = p._w6Cac <= 0 && E.cactus.find((k) => Math.hypot(k.x - p.x, k.y - p.y) < (p.r || 0.3) + 0.42);
    if (c) {
      p._w6Cac = W6.cactusCd; w6Hurt(p, W6.cactusHurt, "따끔!", "#7adf8a");
      const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
      moveEntity(p, dx / d * 0.35, dy / d * 0.35);
      w6Teach("cactus", "선인장은 따끔해요! 살짝 피해서 걸어요");
    }
  }
}, 62);
// 느려지기 (각 기기가 자기 주인공에게: 친구 기기도 같은 모래 늪 목록을 봐요)
hookOn("playersUpdated", () => {
  if (!world.w6 || game.scene !== "dungeon") return;
  for (const p of allPlayers()) if (p && !p.remote && p.hp > 0 && w6InSand(p.x, p.y)) p.abSlow = Math.max(p.abSlow || 0, 0.2);
}, 61);
// 몬스터도 모래 늪에선 느려요 (방장)
hookOn("dungeonTick", () => {
  if (!world.w6) return;
  for (const m of monsters) if (m.hp > 0 && m.def && m.def.behavior !== "prop" && !m.boss && !m.def.floaty && w6InSand(m.x, m.y)) m.abSlow = Math.max(m.abSlow || 0, 0.2);
}, 63);

// ===== 그리기 =====
hookOn("drawFloor", () => {
  const E = world.w6; if (!E) return;
  for (const q of E.quicksand) if (onScreen(q.x, q.y, 3)) {
    const c = toScreen(q.x, q.y, 0.01), rx = q.r * TILE_W * 0.5 * ZOOM / (ZOOM || 1) * 1.0;
    ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, q.r * TILE_W / 2 * 1.41, q.r * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(150,110,60,0.55)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(110,70,30,0.8)"; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -game.time * 10; ctx.stroke();
    ctx.setLineDash([]); ctx.beginPath(); ctx.ellipse(c.x, c.y, q.r * TILE_W / 2 * 0.7, q.r * TILE_H / 2 * 0.7, 0, game.time, game.time + 4); ctx.strokeStyle = "rgba(90,60,25,0.6)"; ctx.stroke();
    ctx.restore(); void rx;
  }
  for (const o of E.oasis) if (onScreen(o.x, o.y, 3)) {
    const c = toScreen(o.x, o.y, 0.01);
    ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, o.r * TILE_W / 2 * 1.41, o.r * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(70,190,220,0.6)"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(220,250,255,0.85)"; ctx.stroke();
    const k = (game.time * 0.7) % 1; ctx.beginPath(); ctx.ellipse(c.x, c.y, o.r * TILE_W / 2 * 1.41 * k, o.r * TILE_H / 2 * 1.41 * k, 0, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; ctx.stroke();
    ctx.restore();
  }
});
hookOn("worldThings", (things) => {
  const E = world.w6; if (!E) return;
  for (const c of E.cactus) if (onScreen(c.x, c.y, 2)) things.push({ depth: c.x + c.y, x: c.x, y: c.y, draw: () => {
    drawBox(c.x - 0.14, c.y - 0.14, 0, 0.28, 0.28, 0.95, "#5aa848");
    drawBox(c.x - 0.36, c.y - 0.08, 0.35, 0.22, 0.16, 0.14, "#5aa848"); drawBox(c.x - 0.36, c.y - 0.08, 0.35, 0.14, 0.16, 0.42, "#5aa848");
    drawBox(c.x + 0.14, c.y - 0.08, 0.5, 0.2, 0.16, 0.12, "#5aa848"); drawBox(c.x + 0.22, c.y - 0.08, 0.5, 0.12, 0.16, 0.36, "#5aa848");
    drawBox(c.x - 0.06, c.y - 0.06, 0.95, 0.12, 0.12, 0.1, "#ff8ab0"); // 꽃
  } });
});
hookOn("lights", (lights) => {
  const E = world.w6; if (!E || game.scene !== "dungeon") return;
  for (const o of E.oasis) if (onScreen(o.x, o.y, 4)) lights.push({ x: o.x, y: o.y, radius: o.r + 1.2, power: 0.6 });
});
