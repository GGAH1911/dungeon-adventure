// ===== 활과 화살 (주인공) =====
// 터치: "활" 버튼 (누르고 있으면 계속 쏴요), 작은 "화살" 버튼으로 화살 종류 바꾸기
// 키보드: L 쏘기, Tab 화살 바꾸기
// 가장 가까운 몬스터를 저절로 겨냥해요. 화살은 가게에서 사거나 몬스터·상자에서 얻어요.
// 로비 연습장에서는 화살이 줄지 않아요.

let shots = [];

// 쏠 방향: 가까이 보이는 몬스터가 있으면 그쪽, 없으면 보고 있는 쪽
function bowAim(p) {
  let best = null, bestD = CONFIG.player.autoAimRange;
  for (const m of allTargets()) {
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < bestD && lineOfSight(p.x, p.y, m.x, m.y)) { bestD = d; best = m; }
  }
  if (!best) return { x: p.faceX, y: p.faceY };
  // 움직이는 몬스터는 조금 앞을 겨냥
  const lead = best.dummy ? 0 : bestD / p.bow.speed;
  const tx = best.x + (best.moving ? best.faceX * best.speed * lead : 0);
  const ty = best.y + (best.moving ? best.faceY * best.speed * lead : 0);
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
}

// 지금 쏠 화살 종류 (특수 화살이 떨어지면 보통 화살)
function currentArrowType() {
  const t = game.profile.arrowType || "normal";
  return t !== "normal" && arrowCount(t) <= 0 ? "normal" : t;
}

function cycleArrowType() {
  const pr = game.profile;
  const ids = ARROW_TYPES.map((a) => a.id).filter((id) => id === "normal" || arrowCount(id) > 0);
  const i = ids.indexOf(currentArrowType());
  pr.arrowType = ids[(i + 1) % ids.length];
  const at = arrowTypeById(pr.arrowType);
  showMessage(`${at.name} (${arrowCount(at.id)}개)`, 1, false, at.color);
  sfx.click();
}

// 이 주인공이 쏠 화살: { type, empty(화살 없음), own(내 저장에서 빼요) }
//   같이 하기 친구 주인공은 친구가 고른 화살·친구 저장 (netplay.js 가 hookFilter "arrowFor" 로 바꿔요)
function arrowFor(p) { return hookFilter("arrowFor", { type: currentArrowType(), empty: false, own: true }, p); }

function fireBow(p) {
  const bow = p.bow;
  const pr = game.profile;
  const practice = game.scene === "lobby";
  const A = arrowFor(p), type = A.type;
  if (!A.own && A.empty && !practice) { p.bowCooldown = 0.4; return; } // 친구 화살이 다 떨어졌어요 (친구 화면에서 "화살이 없어요")
  const free = bow.infinite || practice || !A.own;
  if (!free && arrowCount(type) <= 0) {
    if (!p.noArrowWarned) { showMessage("화살이 없어요! 가게에서 사거나 몬스터한테서 주워요", 1.8); p.noArrowWarned = true; }
    sfx.bowEmpty();
    p.bowCooldown = 0.4;
    return;
  }
  p.noArrowWarned = false;
  const aim = bowAim(p);
  p.faceX = aim.x; p.faceY = aim.y;
  p.bowCooldown = bow.cooldown;
  p.bowTimer = Math.max(0.4, bow.cooldown + 0.18); // 계속 쏘면 활 자세 유지
  p.bowAge = 0;
  if (!free) { if (type === "normal") pr.arrows--; else pr.special[type]--; }

  const n = bow.multishot || 1;
  const spread = n > 1 ? 0.22 : 0;
  const base = Math.atan2(aim.y, aim.x);
  const dmg = bow.damage * damageBonus(pr.level) * (type === "bomb" ? 1.4 : 1) * buffMul(p, "atk"); // 공격력 물약 (buffpots.js)
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * spread;
    shots.push({
      x: p.x + Math.cos(a) * 0.35, y: p.y + Math.sin(a) * 0.35,
      vx: Math.cos(a) * bow.speed, vy: Math.sin(a) * bow.speed,
      life: 1.4, damage: dmg, pierce: type === "bomb" ? 0 : bow.pierce || 0, hit: [],
      legendary: !!bow.legendary, hue: Math.random() * 360, type, owner: p,
    });
  }
  if (bow.legendary) { sfx.legendBow(); flashScreen(0.05); }
  else sfx.bowShot();
}

function bombBlast(x, y, dmg) {
  addRing(x, y, { speed: 7, life: 0.3, hue: 20 });
  spawnBurst(x, y, ["#ff9a3b", "#ffd23f", "#555555"], 16);
  game.shake = Math.max(game.shake, 0.25);
  sfx.boom();
  for (const m of monsters) if (m.hp > 0 && Math.hypot(m.x - x, m.y - y) < 1.8) damageMonster(m, dmg * 0.7, x, y, false, 1.2, { dot: true });
}

function updateShots(dt) { updateShotsBase(dt); if (typeof pvpSetCur === "function") pvpSetCur(null); }
function updateShotsBase(dt) {
  for (const s of shots) {
    if (typeof pvpSetCur === "function") pvpSetCur(s.owner || null); // 결투장: 쏜 사람 쪽에서 노리기 (pvp.js)
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.life -= dt;
    if (isWall(Math.floor(s.x), Math.floor(s.y))) {
      s.life = 0;
      if (s.legendary) legendBurst(s.x, s.y);
      else if (s.type === "bomb") bombBlast(s.x, s.y, s.damage);
      else spawnDust(s.x, s.y);
      continue;
    }
    for (const m of allTargets()) {
      if (s.hit.includes(m)) continue;
      if (typeof pvpSkipShot === "function" && pvpSkipShot(m, s)) continue; // 결투장: 내·우리 팀 과녁은 지나가요 (pvp.js)
      if (Math.hypot(m.x - s.x, m.y - s.y) > m.r + 0.2) continue;
      s.hit.push(m);
      if (m.dummy) {
        m.hitT = 0.35;
        const center = m.kind === "target" && Math.hypot(m.x - s.x, m.y - s.y) < 0.2;
        addFloatText(m.x, m.y, center ? "정중앙!" : m.kind === "target" ? "명중!" : `${Math.round(s.damage * 10) / 10}`, center ? "#ffd84a" : "#fff", center ? 24 : 18);
        sfx.hit();
        s.life = 0;
        break;
      }
      const crit = Math.random() < CONFIG.player.critChance;
      // 화살 종류 효과가 먼저, 없으면 사냥꾼 칼의 마법부여 (classes.js hunterBladeFx)
      const eff = s.type === "fire" ? "burn" : s.type === "ice" ? "slow" : s.type === "poison" ? "poison" : s.ench || null;
      damageMonster(m, s.damage * (crit ? CONFIG.player.critDamage : 1), s.x - s.vx * 0.05, s.y - s.vy * 0.05, s.legendary, 0.5, { crit, effect: eff, melee: true, by: s.owner });
      hitStop(0.03, crit);
      if (s.type === "bomb") bombBlast(s.x, s.y, s.damage);
      if (s.legendary) legendBurst(s.x, s.y);
      if (s.pierce-- <= 0) { s.life = 0; break; }
    }
    // 화살 꼬리
    if (s.legendary && Math.random() < 0.8) addSparkle(s.x, s.y, 0.6, { life: 0.35, size: 0.7, hue: s.hue + game.time * 400, vz: 0.2 });
    else if (s.type === "fire" && Math.random() < 0.6) addSparkle(s.x, s.y, 0.6, { life: 0.3, size: 0.5, gold: true });
    else if (s.type === "ice" && Math.random() < 0.5) addSparkle(s.x, s.y, 0.6, { life: 0.3, size: 0.5, hue: 195 });
    else if (s.type === "poison" && Math.random() < 0.5) addSparkle(s.x, s.y, 0.6, { life: 0.35, size: 0.5, hue: 100 });
  }
  shots = shots.filter((s) => s.life > 0);
}

function drawShot(s) {
  const sp = Math.hypot(s.vx, s.vy) || 1;
  const ux = s.vx / sp, uy = s.vy / sp;
  const tail = toScreen(s.x - ux * 0.5, s.y - uy * 0.5, 0.6);
  const tip = toScreen(s.x, s.y, 0.6);
  ctx.lineCap = "round";
  if (s.legendary) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y);
    g.addColorStop(0, rainbow(s.hue + game.time * 400, 60, 0));
    g.addColorStop(1, rainbow(s.hue + game.time * 400 + 120, 65, 1));
    ctx.strokeStyle = g; ctx.lineWidth = 9 * ZOOM;
    ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    ctx.restore();
    drawStar(tip.x, tip.y, 8 * ZOOM, "#ffffff");
    return;
  }
  ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 3 * ZOOM;
  ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  ctx.fillStyle = arrowTypeById(s.type).color;
  ctx.beginPath(); ctx.arc(tip.x, tip.y, (s.type === "normal" ? 2.8 : 3.8) * ZOOM, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(tail.x - 2.5, tail.y - 2.5, 5, 5);
}
