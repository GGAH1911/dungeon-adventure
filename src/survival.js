// ===== 버티기: 가만히 있으면 체력이 차올라요 (배고픔 게이지도 여기에 넣을 자리) =====
// 3초 넘게 가만히 있으면(걷기·휘두르기·구르기·활 없이, 안 맞고) 하트가 천천히 차오르고, 오래 쉴수록 빨라져요.
//   1초에 최대 체력의 2% 에서 시작해 4초 동안 7% 까지. 맞거나 움직이면 처음부터.
// 같이 하기: 방장 기기가 모든 주인공(친구 포함)을 계산해요 (친구 하트는 방장이 보내요)
const REGEN = { wait: 3, start: 0.02, top: 0.07, ramp: 4 };

function regenStill(p) { return !p.moving && !(p.swingTimer > 0) && !(p.rollTimer > 0) && !(p.bowTimer > 0) && !(p.castPose > 0); }
function regenRate(p) { // 1초에 차는 하트 (아직이면 0)
  const t = (p.stillT || 0) - REGEN.wait;
  if (t < 0) return 0;
  const k = Math.min(1, t / REGEN.ramp);
  return p.maxHp * (REGEN.start + (REGEN.top - REGEN.start) * k);
}
hookOn("playersUpdated", (dt) => {
  if (game.scene === "title") return;
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0 || p.ghost) { if (p) p.stillT = 0; continue; }
    p.stillT = regenStill(p) ? (p.stillT || 0) + dt : 0;
    if (p.hp >= p.maxHp) continue;
    const r = regenRate(p);
    if (!r) continue;
    p.hp = Math.min(p.maxHp, p.hp + r * dt);
    p.regenFx = (p.regenFx || 0) - dt;
    if (p.regenFx <= 0) { p.regenFx = 0.35; addSparkle(p.x + (Math.random() - 0.5) * 0.5, p.y + (Math.random() - 0.5) * 0.5, 0.2 + Math.random() * 0.6, { vz: 1.4, life: 0.6, size: 0.6, hue: 130 }); }
  }
}, 70);
hookOn("playerHurt", (p, damage, from, hp0) => { if (p && p.hp < hp0) p.stillT = 0; }, 40);
// 화면: 하트 옆에 "쉬는 중 +" (친구 기기는 내 주인공 움직임으로 스스로 재요)
let regenHudT = 0;
hookOn("hudDraw", () => {
  const p = game.player;
  if (!p || game.scene === "title" || p.hp <= 0) return;
  const now = game.time, dt = Math.min(0.2, Math.max(0, now - regenHudT)); regenHudT = now;
  if (typeof netGuest === "function" && netGuest()) p.stillT = regenStill(p) && !(p.hurtTimer > 1.5) ? (p.stillT || 0) + dt : 0;
  if (p.hp >= p.maxHp || (p.stillT || 0) < REGEN.wait) return;
  const a = 0.6 + 0.4 * Math.sin(now * 6);
  text("쉬는 중 · 하트 +", 282, 18, 12, `rgba(125,255,150,${a})`);
}, 30);
