// ===== 열쇠 찾기 =====
// 맵마다 보스방 열쇠를 얻는 "도전"이 있어요. (maps.js 의 key: [도전 이름들])
// 도전이 여러 개면 순서대로: 하나를 깨면 다음 단서가 나타나고, 마지막을 깨면 열쇠가 나와요.
// 도전 종류는 아래 KEY_CHALLENGES. 문서: docs/keyhunt.md
// 난이도(쉬움~악몽)에 따라 시간 제한, 몹 수, 단서 강도가 바뀌어요.

const KEYHUNT_TUNE = {
  //            시간 배수   몹 배수   수호자 체력   단서 강도   힌트까지(초)  버티기 시간 배수
  easy:      { time: 1.5,  mobs: 0.6, guardHp: 3,   clue: 2,    hint: 90,   hold: 0.75 },
  normal:    { time: 1,    mobs: 1,   guardHp: 4,   clue: 1,    hint: 150,  hold: 1 },
  hard:      { time: 0.8,  mobs: 1.3, guardHp: 5,   clue: 0.6,  hint: 210,  hold: 1.2 },
  nightmare: { time: 0.65, mobs: 1.6, guardHp: 6,   clue: 0.35, hint: 300,  hold: 1.4 },
};
function ktune() { return KEYHUNT_TUNE[game.profile.difficulty] || KEYHUNT_TUNE.normal; }

// ----- 열쇠 찾기 전용 몬스터 (몬스터 도감에 더해요) -----
MONSTERS.crackBlock = {
  name: "금 간 벽", shape: "crackBlock", behavior: "inert", color: "#8a8178",
  hp: 3, speed: 0, damage: 0, xp: 0, emerald: 0, arrowDrop: 0.000001, attackRange: -1, attackCooldown: 99, heavy: true,
};
MONSTERS.mimic = {
  name: "미믹", shape: "mimic", behavior: "melee", color: "#8a5a2b",
  hp: 6, speed: 2.3, damage: 1.5, xp: 6, emerald: 1, emeraldCount: 4, attackRange: 0.8, attackCooldown: 1.1, windup: 0.3,
};
MONSTERS.keyThief = {
  name: "열쇠 도둑", shape: "human", behavior: "keyThief",
  hp: 4, speed: 3.3, damage: 0, xp: 8, emerald: 1, emeraldCount: 5, attackRange: -1, attackCooldown: 99,
  look: { skin: "#8fbf5a", hair: "#3a2a1a", shirt: "#c9a040", pants: "#5a3a22", eyes: "#ffe27a" },
};

EXTRA_BEHAVIORS.inert = (m) => { m.moving = false; };
// 열쇠 도둑: 주인공을 보면 가까운 포털로 도망! 포털에 닿으면 다른 방에서 다시 나타나요
EXTRA_BEHAVIORS.keyThief = (m, p, dist, dt) => {
  if (!m.portal) {
    m.portal = khPortalSpot(m, p);
    if (m.portal) { showMessage("도둑이 포털로 도망가요! 얼른 잡아요", 2); sfx.fuse(); }
  }
  if (!m.portal) { moveWithSeparation(m, (m.x - p.x) / (dist || 1), (m.y - p.y) / (dist || 1), dt, m.speed); return; }
  const dx = m.portal.x - m.x, dy = m.portal.y - m.y, d = Math.hypot(dx, dy) || 1;
  // 포털 쪽 + 주인공 반대쪽
  const fx = dx / d * 1.0 + (m.x - p.x) / (dist || 1) * 0.35, fy = dy / d * 1.0 + (m.y - p.y) / (dist || 1) * 0.35;
  moveWithSeparation(m, fx, fy, dt, m.speed);
  if (Math.random() < dt * 8) spawnBurst(m.x, m.y, ["#ffe27a"], 1);
  if (d < 0.6) {
    // 놓쳤어요! 다른 방으로
    spawnBurst(m.x, m.y, ["#7a3fd0", "#c9a040"], 16);
    const room = khRandomRoomFar(p, 12);
    const s = findFreeSpot(room.cx, room.cy, m.r) || { x: room.cx, y: room.cy };
    m.x = s.x; m.y = s.y; m.portal = null; m.aggro = false;
    m.hp = m.maxHp;
    sfx.zap();
    showMessage("도둑이 포털로 도망쳤어요! 다른 방에 숨었어요", 2.5, false, "#ffb070");
    if (game.keyhunt) game.keyhunt.hint += 30; // 조금 더 빨리 힌트
  }
};

function khPortalSpot(m, p) {
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, r = 5 + (i % 3) * 1.5;
    const x = m.x + Math.cos(a) * r, y = m.y + Math.sin(a) * r;
    if (hitsWall(x, y, 0.5) || !lineOfSight(m.x, m.y, x, y)) continue;
    const score = Math.hypot(x - p.x, y - p.y) - r * 0.3;
    if (score > bestScore) { bestScore = score; best = { x, y }; }
  }
  return best;
}

// 모양: 금 간 벽 블록, 미믹
EXTRA_SHAPES.crackBlock = (m) => {
  const white = m.flash > 0;
  const c = white ? "#ffffff" : shade((world.theme && world.theme.wall) || "#8a8178", 0.95);
  const x = m.home ? m.home.x : m.x, y = m.home ? m.home.y : m.y;
  drawBox(x - 0.5, y - 0.5, 0, 1, 1, 1.3, c);
  if (white) return;
  const crack = "#2a2420";
  for (const side of ["x", "y"]) {
    drawOnFace(side, x - 0.5, y - 0.5, 0, 1, 1, 0.2, 0.26, 0.3, 1.1, crack);
    drawOnFace(side, x - 0.5, y - 0.5, 0, 1, 1, 0.26, 0.55, 0.62, 0.68, crack);
    drawOnFace(side, x - 0.5, y - 0.5, 0, 1, 1, 0.55, 0.6, 0.15, 0.68, crack);
    drawOnFace(side, x - 0.5, y - 0.5, 0, 1, 1, 0.6, 0.85, 0.95, 1.0, crack);
  }
};
EXTRA_SHAPES.mimic = (m) => {
  const white = m.flash > 0;
  const hop = m.moving ? Math.abs(Math.sin(m.walkTime * 9)) * 0.18 : 0;
  const open = 0.12 + 0.12 * Math.abs(Math.sin(game.time * 6));
  const body = white ? "#ffffff" : "#8a5a2b", trim = white ? "#ffffff" : "#d9a520";
  const x = m.x - 0.32, y = m.y - 0.24;
  drawBox(x, y, hop, 0.64, 0.48, 0.32, body);
  drawBox(x - 0.01, y + 0.2, hop + 0.02, 0.66, 0.08, 0.28, trim);
  if (!white) {
    drawBox(m.x - 0.25, m.y - 0.18, hop + 0.32, 0.5, 0.36, 0.05, "#7a1f1f"); // 입속
    for (let i = 0; i < 4; i++) drawBox(x + 0.06 + i * 0.15, y + 0.4, hop + 0.32, 0.07, 0.05, 0.07, "#ffffff");
  }
  drawBox(x - 0.02, y - 0.02, hop + 0.32 + open, 0.68, 0.52, 0.14, white ? "#ffffff" : shade("#8a5a2b", 1.1));
  if (!white) {
    const side = faceSide(m.faceX, m.faceY);
    if (side) {
      drawOnFace(side, x - 0.02, y - 0.02, hop + 0.32 + open, 0.68, 0.52, 0.2, 0.35, 0.04, 0.11, "#ffe27a");
      drawOnFace(side, x - 0.02, y - 0.02, hop + 0.32 + open, 0.68, 0.52, 0.65, 0.8, 0.04, 0.11, "#ffe27a");
    }
  }
};

// ===== 도우미 =====
function khRoomsFree() {
  const kh = game.keyhunt;
  const start = world.rooms[0];
  return world.rooms.filter((r) => r !== start && r !== kh.doorRoom && !kh.used.has(r));
}
function khDist(r) { const s = world.rooms[0]; return Math.hypot(r.cx - s.cx, r.cy - s.cy); }
// 조건에 맞는 방 하나 고르기 (적당히 먼 방 위주, 조금 무작위)
function khTakeRoom(pred) {
  const kh = game.keyhunt;
  let list = khRoomsFree().filter(pred || (() => true));
  if (!list.length) list = khRoomsFree();
  if (!list.length) list = world.rooms.slice(1);
  list.sort((a, b) => khDist(b) - khDist(a));
  const pickFrom = list.slice(0, Math.max(1, Math.ceil(list.length * 0.6)));
  const r = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  kh.used.add(r);
  return r;
}
function khRandomRoomFar(p, minD) {
  const rooms = world.rooms.filter((r) => Math.hypot(r.cx - p.x, r.cy - p.y) > minD && r !== game.keyhunt.doorRoom);
  const list = rooms.length ? rooms : world.rooms;
  return list[Math.floor(Math.random() * list.length)];
}
function khSpot(r, fx, fy, rad = 0.45) {
  const s = findFreeSpot(r.x + r.w * fx, r.y + r.h * fy, rad, 4);
  // 계단 길은 비워 둬요 (terrain.js): 계단 옆이면 방 안에서 조금씩 옮겨 봐요
  const busy = (x, y) => (typeof nearStair === "function" && nearStair(x, y, 1.2)) || (typeof w2EnvKeepClear === "function" && w2EnvKeepClear(x, y)); // 계단·바다 해면 길
  if (s && busy(s.x, s.y)) {
    for (let k = 1; k <= 8; k++) {
      const a = k * 2.4, d = 0.8 + k * 0.4, t = findFreeSpot(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, rad, 1);
      if (t && t.x > r.x && t.x < r.x + r.w && t.y > r.y && t.y < r.y + r.h && !busy(t.x, t.y)) return t;
    }
  }
  return s || { x: r.cx, y: r.cy };
}
function khSpawn(n, x, y) {
  const table = Object.keys(game.mapDef.monsters || { zombie: 1 });
  const count = Math.max(1, Math.round(n * ktune().mobs));
  for (let i = 0; i < count; i++) {
    const t = table[Math.floor(Math.random() * table.length)];
    const a = Math.random() * Math.PI * 2;
    const s = findFreeSpot(x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, 0.4, 3) || { x, y };
    const m = createMonster(t, s.x, s.y, game.mapLevel);
    m.aggro = true; m.appearTimer = 0.6;
    monsters.push(m);
    addRing(s.x, s.y, { speed: 3, life: 0.4, hue: 280 });
  }
}
function khGuardType() {
  const table = Object.keys(game.mapDef.monsters || { zombie: 1 }).filter((t) => MONSTERS[t] && MONSTERS[t].shape !== "slime" && MONSTERS[t].behavior !== "exploder");
  const prefer = ["golem", "knight", "shadow", "mummy", "miner", "crab", "zombie", "skeleton", "mage", "spider"];
  return prefer.find((t) => table.includes(t)) || table[0] || "zombie";
}
function khMakeGuard(x, y, extraName = "") {
  const m = createMonster(khGuardType(), x, y, game.mapLevel + 1);
  m.maxHp *= ktune().guardHp; m.hp = m.maxHp;
  m.damage *= 1.25;
  m.scaleMul = 1.3; m.r *= 1.2;
  m.keyGuard = true;
  m.name = `열쇠 수호자${extraName} (${m.def.name})`;
  monsters.push(m);
  return m;
}
function khFloorQuad(x0, y0, x1, y1, color) {
  fillPoly([toScreen(x0, y0, 0.015), toScreen(x1, y0, 0.015), toScreen(x1, y1, 0.015), toScreen(x0, y1, 0.015)], color);
}
function khFloorCircle(x, y, r, fill, stroke, lw = 3) {
  const c = toScreen(x, y, 0.02), e = floorEllipse(r);
  ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function khIconKey(x, y, z, s = 1) {
  const c = toScreen(x, y, z);
  const k = s * ZOOM;
  ctx.save();
  ctx.strokeStyle = "#5a3a00"; ctx.lineWidth = 6 * k; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(c.x - 7 * k, c.y, 5 * k, 0, Math.PI * 2); ctx.moveTo(c.x - 2 * k, c.y); ctx.lineTo(c.x + 10 * k, c.y); ctx.moveTo(c.x + 7 * k, c.y); ctx.lineTo(c.x + 7 * k, c.y + 5 * k); ctx.stroke();
  ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 3.5 * k;
  ctx.beginPath(); ctx.arc(c.x - 7 * k, c.y, 5 * k, 0, Math.PI * 2); ctx.moveTo(c.x - 2 * k, c.y); ctx.lineTo(c.x + 10 * k, c.y); ctx.moveTo(c.x + 7 * k, c.y); ctx.lineTo(c.x + 7 * k, c.y + 5 * k); ctx.stroke();
  ctx.restore();
}
function khTorch(x, y, lit, bowl) {
  if (bowl) {
    drawBox(x - 0.12, y - 0.12, 0, 0.24, 0.24, 0.55, "#5a5652");
    drawBox(x - 0.3, y - 0.3, 0.55, 0.6, 0.6, 0.18, "#6e6a66");
  } else {
    drawBox(x - 0.07, y - 0.07, 0, 0.14, 0.14, 0.95, "#6b4423");
    drawBox(x - 0.13, y - 0.13, 0.95, 0.26, 0.26, 0.12, "#3f3f46");
  }
  const top = bowl ? 0.73 : 1.07;
  if (!lit) { drawBox(x - 0.08, y - 0.08, top, 0.16, 0.16, 0.06, "#2a2420"); return; }
  const t = game.time * 11 + x;
  drawBox(x - 0.1, y - 0.1, top, 0.2, 0.2, 0.32 + 0.08 * Math.sin(t), "#ff7a1a");
  drawBox(x - 0.06, y - 0.06, top, 0.12, 0.12, 0.22 + 0.06 * Math.sin(t * 1.3), "#fff2a8");
  glowAt(x, y, top + 0.2, bowl ? 70 : 45, "255,160,60", 0.4);
}

// ===== 도전 종류 =====
// 각 도전: name, short(HUD), setup(ch) -> 실패하면 false, update(ch,p,dt), floor(ch), things(ch,list), interact(ch), lights(ch), status(ch), target(ch)
const KEY_CHALLENGES = {
  // ① 정예 수호자
  guardian: {
    name: "열쇠 수호자", desc: "열쇠를 가진 강한 수호자를 물리쳐요",
    setup(ch) { const r = khTakeRoom(); ch.room = r; const s = khSpot(r, 0.5, 0.5, 0.6); ch.g = khMakeGuard(s.x, s.y); return true; },
    update(ch) { if (ch.g.hp <= 0) khStepDone({ x: ch.g.x, y: ch.g.y }); },
    status() { return "열쇠 수호자를 물리쳐요"; },
    target(ch) { return ch.g; },
  },

  // ⑬ 쌍둥이 수호자: 하나만 쓰러뜨리면 잠시 뒤 다시 살아나요
  twins: {
    name: "쌍둥이 수호자", desc: "두 수호자를 거의 동시에 쓰러뜨려요",
    setup(ch) {
      const r = khTakeRoom((q) => q.w >= 7 && q.h >= 7); ch.room = r;
      ch.spots = [khSpot(r, 0.3, 0.5, 0.6), khSpot(r, 0.7, 0.5, 0.6)];
      ch.g = ch.spots.map((s, i) => khMakeGuard(s.x, s.y, i ? " 둘째" : " 첫째"));
      ch.window = 10 * ktune().time;
      ch.deadT = 0;
      return true;
    },
    update(ch, p, dt) {
      const dead = ch.g.map((g) => g.hp <= 0);
      if (dead[0] && dead[1]) return khStepDone({ x: ch.g[1].x, y: ch.g[1].y });
      if (dead[0] || dead[1]) {
        if (ch.deadT <= 0) { ch.deadT = ch.window; showMessage(`${Math.round(ch.window)}초 안에 다른 수호자도 쓰러뜨려요!`, 2, false, "#ffb070"); }
        ch.deadT -= dt;
        if (ch.deadT <= 0) {
          const i = dead[0] ? 0 : 1;
          const s = ch.spots[i];
          ch.g[i] = khMakeGuard(s.x, s.y, i ? " 둘째" : " 첫째");
          ch.g[i].aggro = true;
          spawnBurst(s.x, s.y, ["#ffe27a", "#ffffff"], 20);
          sfx.boss();
          showMessage("수호자가 다시 일어났어요! 둘을 같이 쓰러뜨려야 해요", 2.8, false, "#ff8080");
        }
      } else ch.deadT = 0;
    },
    status(ch) {
      const left = ch.g.filter((g) => g.hp > 0).length;
      return left === 1 && ch.deadT > 0 ? `쌍둥이 수호자 · ${Math.ceil(ch.deadT)}초 안에!` : "쌍둥이 수호자를 같이 물리쳐요";
    },
    target(ch) { return ch.g.find((g) => g.hp > 0) || ch.g[0]; },
  },

  // ② 열쇠 조각 3개
  shards: {
    name: "열쇠 조각 3개", desc: "맵 곳곳에 흩어진 조각 3개를 모아요",
    setup(ch) {
      ch.shards = [0, 1, 2].map(() => { const r = khTakeRoom(); const s = khSpot(r, 0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6, 0.3); return { x: s.x, y: s.y, got: false, t: Math.random() * 5 }; });
      return true;
    },
    update(ch, p) {
      for (const s of ch.shards) {
        s.t += 1 / 60;
        if (!s.got && Math.hypot(p.x - s.x, p.y - s.y) < 0.75) {
          s.got = true; sfx.coin(); game.keyhunt.hint = 0;
          const n = ch.shards.filter((q) => q.got).length;
          addFloatText(p.x, p.y, `열쇠 조각 ${n}/3`, "#ffd23f", 22);
          for (let i = 0; i < 12; i++) addSparkle(s.x, s.y, 0.6, { vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, vz: 2, gravity: 6, life: 0.6, size: 0.7, gold: true });
        }
      }
      if (ch.shards.every((s) => s.got)) khStepDone({ x: p.x + 0.8, y: p.y + 0.8 });
    },
    things(ch, list) {
      for (const s of ch.shards) if (!s.got) list.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
        const z = 0.45 + Math.sin(game.time * 3 + s.x) * 0.08;
        drawBox(s.x - 0.1, s.y - 0.1, z, 0.2, 0.2, 0.2, "#ffd23f");
        drawBox(s.x + 0.04, s.y - 0.04, z + 0.05, 0.22, 0.08, 0.08, "#e0b020");
        if (Math.sin(game.time * 5 + s.x) > 0.3) { const c = toScreen(s.x, s.y, z + 0.3); drawStar(c.x, c.y, 8 * ZOOM, "#fff7c0"); }
      } });
    },
    lights(ch) { return ch.shards.filter((s) => !s.got).map((s) => ({ x: s.x, y: s.y, radius: 1.4, power: 0.6 })); },
    status(ch) { return `열쇠 조각 ${ch.shards.filter((s) => s.got).length}/3 모으기`; },
    target(ch) { const p = game.player; return ch.shards.filter((s) => !s.got).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; },
  },

  // ③ 부서지는 벽 뒤 숨은 공간
  crackwall: {
    name: "금 간 벽", desc: "금 간 벽을 부수면 숨은 공간에 열쇠가 있어요",
    setup(ch) {
      const found = khFindAlcove();
      if (!found) return false;
      game.keyhunt.used.add(found.r);
      const { ox, oy, sx, sy } = found;
      ch.alcove = { x: ox + 0.5 + 0.5 * sx, y: oy + 0.5 + 0.5 * sy };
      const cells = [[2, 0], [2, 1], [2, 2], [1, 2], [0, 2]];
      ch.blocks = cells.map(([i, j]) => {
        const x = ox + i * sx + 0.5, y = oy + j * sy + 0.5;
        const m = createMonster("crackBlock", x, y, game.mapLevel);
        m.home = { x, y }; m.r = 0.45; m.aggro = false;
        monsters.push(m);
        const solid = { x, y, r: 0.5 };
        world.solids.push(solid);
        return { m, solid };
      });
      // 숨은 공간에 있던 몬스터는 밖으로
      for (const m of monsters) if (!m.home && Math.abs(m.x - ch.alcove.x) < 1.2 && Math.abs(m.y - ch.alcove.y) < 1.2) { m.x = found.r.cx; m.y = found.r.cy; }
      return true;
    },
    update(ch, p) {
      for (const b of ch.blocks) {
        if (b.m.hp > 0) { b.m.x = b.m.home.x; b.m.y = b.m.home.y; b.m.knockX = b.m.knockY = 0; }
        else if (b.solid) { world.solids = world.solids.filter((s) => s !== b.solid); b.solid = null; spawnBurst(b.m.home.x, b.m.home.y, ["#8a8178", "#5a5248"], 14); sfx.slam(); }
      }
      if (Math.hypot(p.x - ch.alcove.x, p.y - ch.alcove.y) < 0.95) khStepDone(ch.alcove);
    },
    things(ch, list) {
      list.push({ depth: ch.alcove.x + ch.alcove.y, x: ch.alcove.x, y: ch.alcove.y, draw: () => {
        const z = 0.5 + Math.sin(game.time * 3) * 0.06;
        drawBox(ch.alcove.x - 0.18, ch.alcove.y - 0.18, 0, 0.36, 0.36, 0.3, "#d9a520");
        const c = toScreen(ch.alcove.x, ch.alcove.y, z);
        drawStar(c.x, c.y, 10 * ZOOM, "#fff7c0");
      } });
    },
    lights(ch) { return [{ x: ch.alcove.x, y: ch.alcove.y, radius: 1.8, power: 0.6 }]; },
    status(ch) { return ch.blocks.some((b) => b.m.hp <= 0) ? "숨은 공간에 들어가요" : "금 간 벽을 부숴요 (칼·폭탄 화살)"; },
    target(ch) { return ch.alcove; },
  },

  // ④ 압력판 2개 동시에
  plates: {
    name: "압력판 2개", desc: "돌을 밀어 압력판 하나에 올리고, 다른 하나는 직접 밟아요",
    setup(ch) {
      const r = khTakeRoom((q) => q.w >= 7 && q.h >= 7); ch.room = r;
      ch.plates = [khSpot(r, 0.25, 0.5, 0.5), khSpot(r, 0.75, 0.5, 0.5)].map((s) => ({ x: s.x, y: s.y, on: false }));
      const st = khSpot(r, 0.5, 0.25, 0.5);
      ch.stone = { x: st.x, y: st.y, r: 0.42, home: { x: st.x, y: st.y } };
      ch.holdT = 0;
      return true;
    },
    update(ch, p, dt) {
      const s = ch.stone;
      const dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy) || 0.001, minD = p.r + s.r;
      if (d < minD && p.hp > 0) {
        const nx = dx / d, ny = dy / d, push = minD - d;
        const tx = s.x + nx * push, ty = s.y + ny * push;
        if (!hitsWall(tx, s.y, s.r)) s.x = tx;
        if (!hitsWall(s.x, ty, s.r)) s.y = ty;
        const d2 = Math.hypot(s.x - p.x, s.y - p.y);
        if (d2 < minD) { const k = minD - d2; if (!hitsWall(p.x - nx * k, p.y - ny * k, p.r)) { p.x -= nx * k; p.y -= ny * k; } }
      }
      for (const pl of ch.plates) {
        const near = (o) => Math.hypot(o.x - pl.x, o.y - pl.y) < 0.5;
        pl.on = near(p) || near(s) || monsters.some((m) => m.hp > 0 && !m.home && near(m));
      }
      if (ch.plates.every((pl) => pl.on)) { ch.holdT += dt; if (ch.holdT > 0.6) { sfx.anvil(); khStepDone({ x: ch.room.cx, y: ch.room.cy }); } }
      else ch.holdT = 0;
    },
    floor(ch) {
      for (const pl of ch.plates) {
        khFloorQuad(pl.x - 0.45, pl.y - 0.45, pl.x + 0.45, pl.y + 0.45, pl.on ? "#4fd07a" : "#7a756e");
        khFloorQuad(pl.x - 0.3, pl.y - 0.3, pl.x + 0.3, pl.y + 0.3, pl.on ? "#9affc0" : "#9a948a");
      }
      const h = ch.stone.home;
      khFloorCircle(h.x, h.y, 0.35, null, "rgba(120,190,255,0.6)", 2);
    },
    things(ch, list) {
      const s = ch.stone;
      list.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => { drawBox(s.x - 0.42, s.y - 0.42, 0, 0.84, 0.84, 0.8, "#8c8c94"); drawBox(s.x - 0.42, s.y - 0.42, 0.8, 0.84, 0.84, 0.05, "#6f9a55"); } });
    },
    interact(ch) {
      const h = ch.stone.home;
      return [{ x: h.x, y: h.y, range: 1.2, short: "되돌리기", prompt: "돌을 제자리로", action: () => {
        const p = game.player;
        if (Math.hypot(p.x - h.x, p.y - h.y) < 0.9) { showMessage("한 걸음 비켜서 눌러요", 1.5); return; }
        ch.stone.x = h.x; ch.stone.y = h.y; sfx.click();
      } }];
    },
    status(ch) { return `압력판 ${ch.plates.filter((p) => p.on).length}/2 동시에 누르기 (돌 밀기)`; },
    target(ch) { return ch.plates[0]; },
  },

  // ⑤ 시간 제한 횃불
  torches: {
    name: "횃불 점화", desc: "제한 시간 안에 횃불을 모두 켜요 (E 또는 불화살)",
    setup(ch) {
      const a = khTakeRoom((q) => q.w >= 7 && q.h >= 7), b = khTakeRoom();
      const n = game.profile.difficulty === "nightmare" ? 5 : 4;
      const spots = [khSpot(a, 0.15, 0.15), khSpot(a, 0.85, 0.15), khSpot(a, 0.15, 0.85), khSpot(b, 0.5, 0.5), khSpot(a, 0.85, 0.85)].slice(0, n);
      ch.torches = spots.map((s) => ({ x: s.x, y: s.y, lit: false, solid: world.solids.push({ x: s.x, y: s.y, r: 0.2 }) }));
      ch.limit = 40 * ktune().time; ch.timer = 0; ch.room = a;
      return true;
    },
    update(ch, p, dt) {
      for (const sh of shots) if (sh.type === "fire") for (const t of ch.torches) if (!t.lit && Math.hypot(sh.x - t.x, sh.y - t.y) < 0.6) khLight(ch, t);
      if (ch.timer > 0) {
        ch.timer -= dt;
        if (ch.timer <= 0) { for (const t of ch.torches) t.lit = false; sfx.denied(); showMessage("시간이 다 돼서 횃불이 꺼졌어요! 다시 해봐요", 2.5, false, "#ff8080"); }
      }
      if (ch.torches.every((t) => t.lit)) khStepDone({ x: ch.room.cx, y: ch.room.cy });
    },
    things(ch, list) { for (const t of ch.torches) list.push({ depth: t.x + t.y, x: t.x, y: t.y, draw: () => khTorch(t.x, t.y, t.lit, false) }); },
    interact(ch) { return ch.torches.filter((t) => !t.lit).map((t) => ({ x: t.x, y: t.y, range: 1.2, short: "불 켜기", prompt: "횃불 켜기", action: () => khLight(ch, t) })); },
    lights(ch) { return ch.torches.filter((t) => t.lit).map((t) => ({ x: t.x, y: t.y, radius: 3, power: 0.8 })); },
    status(ch) { const n = ch.torches.filter((t) => t.lit).length; return ch.timer > 0 ? `횃불 ${n}/${ch.torches.length} · ${Math.ceil(ch.timer)}초!` : `횃불 ${ch.torches.length}개를 ${Math.round(ch.limit)}초 안에 켜요`; },
    target(ch) { return ch.torches.find((t) => !t.lit) || ch.torches[0]; },
  },

  // ⑪ 어둠 밝히기: 맵이 깜깜해져요. 화로 4개를 켜면 열쇠가 나와요
  dark: {
    name: "어둠 밝히기", desc: "깜깜한 맵에서 화로 4개를 찾아 켜요",
    setup(ch) {
      ch.bowls = [0, 1, 2, 3].map(() => { const r = khTakeRoom(); const s = khSpot(r, 0.5, 0.5, 0.5); world.solids.push({ x: s.x, y: s.y, r: 0.3 }); return { x: s.x, y: s.y, lit: false }; });
      ch.theme = world.theme;
      world.theme = { ...world.theme, darkness: Math.max(0.86, world.theme.darkness) };
      game.keyhunt.dark = true;
      return true;
    },
    update(ch) {
      for (const sh of shots) if (sh.type === "fire") for (const t of ch.bowls) if (!t.lit && Math.hypot(sh.x - t.x, sh.y - t.y) < 0.6) khLight(ch, t);
      if (ch.bowls.every((t) => t.lit)) { world.theme = ch.theme; game.keyhunt.dark = false; khStepDone({ x: ch.bowls[3].x + 0.8, y: ch.bowls[3].y + 0.8 }); }
    },
    things(ch, list) { for (const t of ch.bowls) list.push({ depth: t.x + t.y, x: t.x, y: t.y, draw: () => khTorch(t.x, t.y, t.lit, true) }); },
    interact(ch) { return ch.bowls.filter((t) => !t.lit).map((t) => ({ x: t.x, y: t.y, range: 1.3, short: "불 켜기", prompt: "화로 켜기", action: () => khLight(ch, t) })); },
    lights(ch) { return ch.bowls.map((t) => (t.lit ? { x: t.x, y: t.y, radius: 6.5, power: 1 } : { x: t.x, y: t.y, radius: 1.2, power: 0.5 })); },
    status(ch) { return `어둠 속 화로 ${ch.bowls.filter((t) => t.lit).length}/4 켜기`; },
    target(ch) { return ch.bowls.find((t) => !t.lit) || ch.bowls[0]; },
  },

  // ⑥ 레버 순서
  levers: {
    name: "레버 순서", desc: "벽화에 그려진 순서대로 레버를 당겨요. 틀리면 몬스터가!",
    setup(ch) {
      const r = khTakeRoom((q) => q.w >= 8 && q.h >= 7); ch.room = r;
      const colors = ["#e23b3b", "#3b7de2", "#ffd23f", "#3fbf6f"];
      ch.levers = [0.2, 0.4, 0.6, 0.8].map((fx, i) => { const s = khSpot(r, fx, 0.3, 0.4); world.solids.push({ x: s.x, y: s.y, r: 0.22 }); return { x: s.x, y: s.y, color: colors[i], pulled: false, idx: i }; });
      ch.order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const ms = khSpot(r, 0.5, 0.75, 0.7); ch.mural = { x: ms.x, y: ms.y };
      world.solids.push({ x: ms.x, y: ms.y, r: 0.5 });
      ch.k = 0;
      return true;
    },
    update() {},
    things(ch, list) {
      for (const l of ch.levers) list.push({ depth: l.x + l.y, x: l.x, y: l.y, draw: () => {
        drawBox(l.x - 0.2, l.y - 0.15, 0, 0.4, 0.3, 0.25, "#5a5652");
        const ang = l.pulled ? 0.6 : -0.6;
        const a = toScreen(l.x, l.y, 0.25), b = toScreen(l.x + Math.sin(ang) * 0.35, l.y, 0.25 + Math.cos(ang) * 0.45);
        ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 5 * ZOOM; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.fillStyle = l.color; ctx.beginPath(); ctx.arc(b.x, b.y, 6 * ZOOM, 0, Math.PI * 2); ctx.fill();
        if (ktune().clue >= 2) { const t = toScreen(l.x, l.y, 1.2); text(`${ch.order.indexOf(l.idx) + 1}`, t.x, t.y, 16 * ZOOM * 0.8, "#fff", "center"); }
      } });
      const m = ch.mural;
      list.push({ depth: m.x + m.y, x: m.x, y: m.y, draw: () => {
        drawBox(m.x - 0.75, m.y - 0.1, 0, 1.5, 0.2, 1.35, "#9a8a72");
        const p = game.player;
        const see = ktune().clue >= 1 || Math.hypot(p.x - m.x, p.y - m.y) < (ktune().clue >= 0.5 ? 4 : 2.5);
        ch.order.forEach((li, i) => {
          const u = 0.08 + i * 0.22;
          drawOnFace("y", m.x - 0.75, m.y - 0.1, 0, 1.5, 0.2, u, u + 0.16, 0.55, 0.85, see ? ch.levers[li].color : "#6a6058");
          drawOnFace("y", m.x - 0.75, m.y - 0.1, 0, 1.5, 0.2, u + 0.05, u + 0.11, 0.35, 0.45, i < ch.k ? "#7dffb0" : "#4a4038");
        });
      } });
    },
    interact(ch) {
      return ch.levers.filter((l) => !l.pulled).map((l) => ({ x: l.x, y: l.y, range: 1.0, short: "당기기", prompt: "레버 당기기", action: () => {
        l.pulled = true; sfx.click();
        if (ch.order[ch.k] === l.idx) {
          ch.k++; game.keyhunt.hint = 0;
          if (ch.k === 4) { sfx.anvil(); khStepDone({ x: ch.mural.x + 0.9, y: ch.mural.y + 0.9 }); }
        } else {
          sfx.denied();
          showMessage("틀렸어요! 몬스터가 나와요. 벽화를 잘 보세요", 2.5, false, "#ff8080");
          for (const q of ch.levers) q.pulled = false;
          ch.k = 0;
          khSpawn(2, ch.room.cx, ch.room.cy);
        }
      } }));
    },
    status(ch) { return `벽화 순서대로 레버 ${ch.k}/4`; },
    target(ch) { return ch.mural; },
  },

  // ⑦ 빛의 원 지키기
  hold: {
    name: "빛의 원 지키기", desc: "빛나는 원 안에서 버텨 게이지를 채워요. 몬스터가 몰려와요",
    setup(ch) {
      const r = khTakeRoom((q) => q.w >= 7 && q.h >= 7); ch.room = r;
      const s = khSpot(r, 0.5, 0.5, 1.2); ch.c = { x: s.x, y: s.y }; ch.rad = 2.1;
      ch.gauge = 0; ch.need = 24 * ktune().hold; ch.wave = 3; ch.started = false;
      return true;
    },
    update(ch, p, dt) {
      const inside = Math.hypot(p.x - ch.c.x, p.y - ch.c.y) < ch.rad;
      if (inside && !ch.started) { ch.started = true; showMessage("원 안에서 버텨요! 몬스터가 몰려와요", 2.5); sfx.wave(); }
      if (!ch.started) return;
      ch.gauge = Math.max(0, ch.gauge + (inside ? dt : -dt * 0.35));
      ch.wave -= dt;
      if (ch.wave <= 0) { ch.wave = 7 * Math.max(0.6, ktune().time); khSpawn(2, ch.c.x, ch.c.y); }
      if (ch.gauge >= ch.need) khStepDone(ch.c);
    },
    floor(ch) {
      const k = ch.gauge / ch.need;
      khFloorCircle(ch.c.x, ch.c.y, ch.rad, `rgba(255,230,120,${0.12 + 0.08 * Math.sin(game.time * 3)})`, "rgba(255,230,120,0.8)", 3);
      if (k > 0) khFloorCircle(ch.c.x, ch.c.y, ch.rad * Math.sqrt(k), "rgba(125,255,176,0.25)", null);
    },
    lights(ch) { return [{ x: ch.c.x, y: ch.c.y, radius: 3.5, power: 0.8 }]; },
    status(ch) { return ch.started ? `빛의 원 지키기 ${Math.floor(100 * ch.gauge / ch.need)}%` : "빛나는 원을 찾아 들어가요"; },
    target(ch) { return ch.c; },
  },

  // ⑧ 보물 미믹: 상자 3개 중 진짜는 하나. 가짜는 숨을 쉬어요(들썩들썩)
  mimic: {
    name: "진짜 상자 찾기", desc: "상자 3개 중 진짜를 열어요. 가짜는 숨을 쉬어요(미믹!)",
    setup(ch) {
      const r = khTakeRoom((q) => q.w >= 7); ch.room = r;
      ch.boxes = [0.25, 0.5, 0.75].map((fx) => { const s = khSpot(r, fx, 0.5, 0.45); const solid = { x: s.x, y: s.y, r: 0.38 }; world.solids.push(solid); return { x: s.x, y: s.y, solid, open: false, gone: false, phase: Math.random() * 6 }; });
      ch.real = Math.floor(Math.random() * 3);
      return true;
    },
    update() {},
    things(ch, list) {
      ch.boxes.forEach((b, i) => {
        if (b.gone) return;
        list.push({ depth: b.x + b.y, x: b.x, y: b.y, draw: () => {
          const fake = i !== ch.real && !b.open;
          const breath = fake ? Math.max(0, Math.sin(game.time * 2.2 + b.phase)) * 0.05 * Math.min(1.5, ktune().clue) : 0;
          const w = 0.62, d = 0.44, x = b.x - w / 2, y = b.y - d / 2;
          drawBox(x, y, 0, w, d, 0.34 + breath * 0.6, "#8a5a2b");
          drawBox(x - 0.01, y + d / 2 - 0.04, 0.02, w + 0.02, 0.08, 0.3, "#d9a520");
          if (b.open) drawBox(x - 0.02, y - 0.16, 0.36, w + 0.04, 0.14, 0.4, "#9a6a3a");
          else drawBox(x - 0.02, y - 0.02, 0.34 + breath, w + 0.04, d + 0.04, 0.16, "#9a6a3a");
        } });
      });
    },
    interact(ch) {
      return ch.boxes.filter((b) => !b.open && !b.gone).map((b) => ({ x: b.x, y: b.y, range: 1.3, short: "열기", prompt: "상자 열기", action: () => {
        const i = ch.boxes.indexOf(b);
        if (i === ch.real) { b.open = true; sfx.chest(); khStepDone({ x: b.x + 0.7, y: b.y + 0.7 }); return; }
        b.gone = true; world.solids = world.solids.filter((s) => s !== b.solid);
        const m = createMonster("mimic", b.x, b.y, game.mapLevel + 1);
        m.aggro = true; monsters.push(m);
        sfx.boss(); game.shake = 0.3;
        showMessage("미믹이다! 가짜 상자였어요", 2.2, false, "#ff8080");
      } }));
    },
    status() { return "진짜 상자를 열어요 (가짜는 숨을 쉬어요)"; },
    target(ch) { return ch.boxes.find((b) => !b.gone && !b.open) || ch.boxes[0]; },
  },

  // ⑨ 열쇠 도둑 추격
  thief: {
    name: "열쇠 도둑", desc: "열쇠를 훔친 도둑이 포털로 도망가요. 닿기 전에 잡아요",
    setup(ch) {
      const r = khTakeRoom(); const s = khSpot(r, 0.5, 0.5, 0.4);
      ch.t = createMonster("keyThief", s.x, s.y, game.mapLevel);
      ch.t.maxHp *= 1.5; ch.t.hp = ch.t.maxHp;
      ch.t.speed = MONSTERS.keyThief.speed * (0.8 + 0.2 / ktune().time);
      monsters.push(ch.t);
      return true;
    },
    update(ch) { if (ch.t.hp <= 0) khStepDone({ x: ch.t.x, y: ch.t.y }); },
    floor(ch) {
      const pt = ch.t.portal;
      if (pt && ch.t.hp > 0) {
        khFloorCircle(pt.x, pt.y, 0.6 + 0.08 * Math.sin(game.time * 8), "rgba(140,70,230,0.35)", "rgba(200,140,255,0.9)", 3);
      }
    },
    things(ch, list) {
      const pt = ch.t.portal;
      if (pt && ch.t.hp > 0) list.push({ depth: pt.x + pt.y, x: pt.x, y: pt.y, draw: () => {
        const c = toScreen(pt.x, pt.y, 0.9);
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(200,140,255,0.8)"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(c.x, c.y, 16 * ZOOM, 30 * ZOOM, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "rgba(120,60,200,0.35)"; ctx.fill();
        ctx.restore();
      } });
    },
    status(ch) { return ch.t.portal ? "도둑이 포털로 달려요! 잡아요" : "열쇠 도둑을 찾아 잡아요"; },
    target(ch) { return ch.t; },
  },

  // ⑩ 함정 복도: 불기둥 줄이 파도처럼 터져요. 터진 바로 뒤를 따라가요
  traphall: {
    name: "불기둥 함정", desc: "줄지어 터지는 불기둥 사이를 지나 끝의 상자에 닿아요",
    setup(ch) {
      const r = khTakeRoom((q) => Math.max(q.w, q.h) >= 8); ch.room = r;
      ch.horiz = r.w >= r.h;
      ch.n = ch.horiz ? r.w : r.h;
      const end = ch.horiz ? { x: r.x + r.w - 0.8, y: r.cy } : { x: r.cx, y: r.y + r.h - 0.8 };
      const start = ch.horiz ? { x: r.x + 0.8, y: r.cy } : { x: r.cx, y: r.y + 0.8 };
      // 시작 방에서 먼 쪽 끝에 상자
      const s0 = world.rooms[0];
      const far = Math.hypot(end.x - s0.cx, end.y - s0.cy) > Math.hypot(start.x - s0.cx, start.y - s0.cy) ? end : start;
      ch.goal = findFreeSpot(far.x, far.y, 0.35, 2) || far;
      ch.t = 0;
      ch.period = 0.95 * Math.max(0.75, ktune().time);
      ch.tele = Math.max(0.45, 0.6 * ktune().time);
      ch.dmg = 1.5 * monsterDamageMul(game.mapLevel) * diff().dmg;
      return true;
    },
    // 지금 i번째 줄의 상태: 0 꺼짐, 1 예고, 2 불
    band(ch, i) {
      const beat = Math.floor(ch.t / ch.period);
      const ph = ch.t - beat * ch.period;
      const fires = ((i + beat) % 3) === 0;
      const next = ((i + beat + 1) % 3) === 0;
      if (fires && ph < 0.35) return 2;
      if (next && ph > ch.period - ch.tele) return 1;
      return 0;
    },
    inBand(ch, x, y) {
      const r = ch.room;
      if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) return -1;
      return ch.horiz ? Math.floor(x - r.x) : Math.floor(y - r.y);
    },
    update(ch, p, dt) {
      ch.t += dt;
      const i = this.inBand(ch, p.x, p.y);
      if (i >= 0 && this.band(ch, i) === 2) hurtPlayer(p, ch.dmg, ch.horiz ? { x: p.x - 1, y: p.y } : { x: p.x, y: p.y - 1 });
      if (Math.hypot(p.x - ch.goal.x, p.y - ch.goal.y) < 0.8) khStepDone(ch.goal);
    },
    floor(ch) {
      const r = ch.room;
      for (let i = 0; i < ch.n; i++) {
        const st = this.band(ch, i);
        if (!st) continue;
        const color = st === 2 ? "rgba(255,140,40,0.75)" : "rgba(230,40,40,0.35)";
        if (ch.horiz) khFloorQuad(r.x + i, r.y, r.x + i + 1, r.y + r.h, color);
        else khFloorQuad(r.x, r.y + i, r.x + r.w, r.y + i + 1, color);
      }
    },
    things(ch, list) {
      const r = ch.room;
      for (let i = 0; i < ch.n; i++) {
        if (this.band(ch, i) !== 2) continue;
        for (let k = 0; k < 3; k++) {
          const x = ch.horiz ? r.x + i + 0.5 : r.x + (k + 0.5) * r.w / 3, y = ch.horiz ? r.y + (k + 0.5) * r.h / 3 : r.y + i + 0.5;
          list.push({ depth: x + y, x, y, draw: () => { drawBox(x - 0.15, y - 0.15, 0, 0.3, 0.3, 0.9 + 0.2 * Math.sin(game.time * 20 + k), "#ff7a1a"); drawBox(x - 0.08, y - 0.08, 0, 0.16, 0.16, 0.6, "#fff2a8"); } });
        }
      }
      const g = ch.goal;
      list.push({ depth: g.x + g.y, x: g.x, y: g.y, draw: () => { drawBox(g.x - 0.3, g.y - 0.22, 0, 0.6, 0.44, 0.34, "#d9a520"); drawBox(g.x - 0.32, g.y - 0.24, 0.34, 0.64, 0.48, 0.14, "#ffe27a"); } });
    },
    lights(ch) { return [{ x: ch.goal.x, y: ch.goal.y, radius: 2.2, power: 0.7 }, { x: ch.room.cx, y: ch.room.cy, radius: 4, power: 0.5 }]; },
    status() { return "불기둥 사이를 지나 끝의 황금 상자로!"; },
    target(ch) { return ch.goal; },
  },

  // ⑫ 기억 타일: 받침대를 누르면 타일이 순서대로 빛나요. 같은 순서로 밟아요
  memory: {
    name: "기억 타일", desc: "빛나는 순서를 기억해서 같은 순서로 타일을 밟아요",
    setup(ch) {
      const ok = (r) => {
        if (r.w < 7 || r.h < 7) return false;
        const gx = Math.floor(r.cx) - 1, gy = Math.floor(r.cy) - 1;
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (isWall(gx + x, gy + y)) return false;
        // 상자 같은 물건이 타일 위에 있으면 안 돼요
        if (world.solids.some((q) => q.x > gx - 0.6 && q.x < gx + 3.6 && q.y > gy - 0.6 && q.y < gy + 3.6)) return false;
        if (typeof w2EnvKeepClear === "function" && (w2EnvKeepClear(r.cx + 2.6, r.cy + 2.6) || w2EnvKeepClear(r.cx, r.cy, 2.2))) return false; // 바다 해면 길·파이프 (ocean_env.js)
        return !hitsWall(r.cx + 2.6, r.cy + 2.6, 0.4);
      };
      const r = khTakeRoom(ok);
      if (!ok(r)) return false;
      ch.room = r; ch.gx = Math.floor(r.cx) - 1; ch.gy = Math.floor(r.cy) - 1;
      ch.ped = { x: r.cx + 2.6, y: r.cy + 2.6 };
      world.solids.push({ x: ch.ped.x, y: ch.ped.y, r: 0.3 });
      const len = { easy: 3, normal: 4, hard: 5, nightmare: 6 }[game.profile.difficulty] || 4;
      ch.seq = memorySequence(len); ch.tries = 0;
      ch.phase = "idle"; ch.t = 0; ch.k = 0; ch.last = -1; ch.flash = null;
      return true;
    },
    // 타일 가운데 쪽에 들어가야 밟은 걸로 쳐요 (가장자리 0.18칸은 안 쳐요)
    tileAt(ch, x, y) {
      const fx = x - ch.gx, fy = y - ch.gy, tx = Math.floor(fx), ty = Math.floor(fy);
      if (tx < 0 || tx >= 3 || ty < 0 || ty >= 3) return -1;
      const ix = fx - tx, iy = fy - ty, m = 0.18;
      if (ix < m || ix > 1 - m || iy < m || iy > 1 - m) return -1;
      return ty * 3 + tx;
    },
    update(ch, p, dt) {
      ch.t += dt;
      if (ch.flash) { ch.flash.t -= dt; if (ch.flash.t <= 0) ch.flash = null; }
      // 보는 중·밟는 중에는 가까이 (멀리 가면 원래대로)
      const near = Math.hypot(p.x - (ch.gx + 1.5), p.y - (ch.gy + 1.5)) < 6;
      easeFocusZoom((ch.phase === "show" || ch.phase === "input") && near ? 1.35 : 1, dt);
      const step = 0.75 * Math.max(0.7, ktune().time);
      if (ch.phase === "show" && ch.t > ch.seq.length * step + 0.3) { ch.phase = "input"; ch.k = 0; ch.last = this.tileAt(ch, p.x, p.y); showMessage("이제 같은 순서로 밟아요! (첫 타일부터)", 2); }
      if (ch.phase !== "input") return;
      const tile = this.tileAt(ch, p.x, p.y);
      if (tile !== ch.last && tile >= 0) {
        if (tile === ch.seq[ch.k]) {
          ch.k++; ch.flash = { tile, ok: true, t: 0.4 }; sfx.coin(); game.keyhunt.hint = 0;
          if (ch.k === ch.seq.length) { ch.phase = "done"; khZoomBack(); khStepDone({ x: ch.ped.x - 0.8, y: ch.ped.y - 0.8 }); }
        } else if (ch.k === 0) {
          // 첫 타일을 밟기 전에는 가는 길에 지나간 타일을 틀린 걸로 치지 않아요 (받침대가 타일 밖에 있어서)
        } else {
          ch.flash = { tile, ok: false, t: 0.6 }; ch.phase = "idle"; sfx.denied();
          showMessage("틀렸어요! 받침대를 눌러 다시 봐요", 2.5, false, "#ff8080");
          khSpawn(2, ch.room.cx, ch.room.cy);
        }
      }
      if (tile >= 0) ch.last = tile; // 가장자리·밖에 있을 땐 마지막 타일을 기억해요 (같은 타일을 두 번 친 걸로 안 쳐요)
    },
    floor(ch) {
      const step = 0.75 * Math.max(0.7, ktune().time);
      const showing = ch.phase === "show" ? Math.floor(ch.t / step) : -1;
      const showOn = showing >= 0 && showing < ch.seq.length && ch.t - showing * step < step * 0.75 ? ch.seq[showing] : -1;
      for (let i = 0; i < 9; i++) {
        const x = ch.gx + (i % 3), y = ch.gy + Math.floor(i / 3);
        let c = "#5a5f70";
        if (i === showOn) c = "#ffe27a";
        if (ch.flash && ch.flash.tile === i) c = ch.flash.ok ? "#4fd07a" : "#e23b3b";
        khFloorQuad(x + 0.06, y + 0.06, x + 0.94, y + 0.94, c);
      }
    },
    things(ch, list) {
      const d = ch.ped;
      list.push({ depth: d.x + d.y, x: d.x, y: d.y, draw: () => {
        drawBox(d.x - 0.22, d.y - 0.22, 0, 0.44, 0.44, 0.7, "#8a8178");
        const c = toScreen(d.x, d.y, 0.85);
        ctx.fillStyle = ch.phase === "input" ? "#7dffb0" : "#ffe27a";
        ctx.beginPath(); ctx.arc(c.x, c.y, 7 * ZOOM, 0, Math.PI * 2); ctx.fill();
      } });
    },
    interact(ch) {
      if (ch.phase === "show") return [];
      return [{ x: ch.ped.x, y: ch.ped.y, range: 1.3, short: "보기", prompt: "빛 순서 보기", action: () => {
        // 어려움·악몽은 다시 볼 때마다 새 순서 (외워서 찍기 막기). 쉬움·보통은 같은 순서로 다시 연습
        const hardish = ["hard", "nightmare"].includes(game.profile.difficulty);
        if (ch.tries > 0 && hardish) { ch.seq = memorySequence(ch.seq.length, ch.seq); showMessage("새 순서예요! 잘 봐요", 1.6, false, "#ffe27a"); }
        ch.tries = (ch.tries || 0) + 1;
        ch.phase = "show"; ch.t = 0; sfx.click();
      } }];
    },
    lights(ch) { return [{ x: ch.room.cx, y: ch.room.cy, radius: 3.5, power: 0.8 }]; },
    status(ch) { return ch.phase === "input" ? `기억 타일 ${ch.k}/${ch.seq.length} 밟기` : "받침대를 눌러 빛 순서를 봐요"; },
    target(ch) { return ch.ped; },
  },
};

// 기억 타일 순서: 다음 타일은 늘 위·아래·왼쪽·오른쪽 옆 칸 (대각선으로 가다 다른 타일을 밟지 않게)
// avoid: 지난 순서와 똑같으면 다시 뽑아요
function memorySequence(len, avoid) {
  for (let tries = 0; tries < 20; tries++) {
    const seq = [Math.floor(Math.random() * 9)];
    while (seq.length < len) {
      const cur = seq[seq.length - 1], cx = cur % 3, cy = Math.floor(cur / 3), prev = seq[seq.length - 2];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy]).filter(([x, y]) => x >= 0 && x < 3 && y >= 0 && y < 3).map(([x, y]) => y * 3 + x);
      const pick = nb.filter((t) => t !== prev);
      const from = pick.length ? pick : nb;
      seq.push(from[Math.floor(Math.random() * from.length)]);
    }
    if (!avoid || seq.join() !== avoid.join()) return seq;
  }
  return avoid.slice().reverse();
}

// 기억 타일 등에서 가까이 본 화면을 원래대로 (성공·실패·장면 바뀜)
let khZoomT = 0;
function khZoomBack() { khZoomT = 1.2; }
hookOn("dungeonTick", (dt) => { if (khZoomT > 0) { khZoomT -= dt; easeFocusZoom(1, dt * 2); if (khZoomT <= 0) easeFocusZoom(1, 99); } }, 60);
hookOn("reset", () => { khZoomT = 0; if (typeof easeFocusZoom === "function") easeFocusZoom(1, 99); }, 95);

function khLight(ch, t) {
  if (t.lit) return;
  t.lit = true;
  sfx.coin();
  game.keyhunt.hint = 0;
  for (let i = 0; i < 10; i++) addSparkle(t.x, t.y, 1, { vz: 1.5, life: 0.6, size: 0.5, gold: true });
  if (ch.limit && ch.timer <= 0) { ch.timer = ch.limit; showMessage(`${Math.round(ch.limit)}초 안에 나머지 횃불도 켜요!`, 2.2, false, "#ffb070"); }
}

// 방 구석 2x2 공간 + 그 앞을 막는 금 간 벽 자리 찾기
function khFindAlcove() {
  const rooms = khRoomsFree().filter((r) => r.w >= 6 && r.h >= 6).sort(() => Math.random() - 0.5);
  const T = (x, y) => (world.tiles[y] ? world.tiles[y][x] : undefined);
  const floor = (x, y) => T(x, y) === 0;
  const wall = (x, y) => { const t = T(x, y); return t === undefined || t > 0; };
  for (const r of rooms) {
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]].sort(() => Math.random() - 0.5)) {
      const ox = sx > 0 ? r.x : r.x + r.w - 1, oy = sy > 0 ? r.y : r.y + r.h - 1;
      let ok = true;
      for (let i = 0; i < 2 && ok; i++) for (let j = 0; j < 2; j++) if (!floor(ox + i * sx, oy + j * sy)) ok = false;
      for (let j = -1; j <= 2 && ok; j++) if (!wall(ox - sx, oy + j * sy)) ok = false;
      for (let i = -1; i <= 2 && ok; i++) if (!wall(ox + i * sx, oy - sy)) ok = false;
      for (const [i, j] of [[2, 0], [2, 1], [2, 2], [1, 2], [0, 2]]) if (!floor(ox + i * sx, oy + j * sy)) ok = false;
      if (ok) return { r, ox, oy, sx, sy };
    }
  }
  return null;
}

// ===== 진행 =====
function khStartChallenge(id) {
  let C = KEY_CHALLENGES[id] ? id : "guardian";
  const ch = { id: C };
  if (KEY_CHALLENGES[C].setup(ch) === false) {
    C = "guardian"; ch.id = C;
    KEY_CHALLENGES.guardian.setup(ch);
  }
  return ch;
}

// 도전 하나를 깼어요
function khStepDone(spot) {
  const kh = game.keyhunt;
  if (!kh || kh.stepLock) return;
  kh.stepLock = true;
  kh.index++;
  kh.hint = 0;
  kh.ch = null;
  if (kh.index >= kh.steps.length) {
    const s = findFreeSpot(spot.x, spot.y, 0.3, 3) || spot;
    kh.keyItem = { x: s.x, y: s.y, t: 0 };
    sfx.chest();
    showMessage("보스방 열쇠가 나타났어요!", 3, true);
    for (let i = 0; i < 3; i++) addRing(s.x, s.y, { speed: 4, life: 0.6, gold: true, delay: i * 0.15 });
  } else {
    kh.ch = khStartChallenge(kh.steps[kh.index]);
    sfx.stairs();
    showMessage(`좋아요! 다음 단서: ${KEY_CHALLENGES[kh.ch.id].name}`, 3.2, false, "#7dffb0");
  }
  kh.stepLock = false;
}

// 던전을 시작할 때 (bossroom.js 가 불러요)
function setupKeyHunt(def) {
  const pr = game.profile;
  const steps = (def.key && def.key.length ? def.key : ["guardian"]).slice();
  const kh = game.keyhunt = {
    mapId: def.id, steps, index: 0, ch: null, hasKey: false, keyItem: null,
    used: new Set(), hint: 0, dark: false, inBoss: false, door: null, doorRoom: null,
  };
  placeBossDoor(); // bossroom.js
  if (pr.hardMode) delete pr.keys[def.id];
  if (!pr.hardMode && pr.keys[def.id]) {
    kh.hasKey = true; kh.index = steps.length;
    showMessage(`${def.name} · 지난번에 찾은 열쇠가 있어요! 보스방 문으로`, 3.5, false, "#ffd23f");
    return;
  }
  kh.ch = khStartChallenge(steps[0]);
  showMessage(`${def.name} Lv ${game.mapLevel} · 보스방 열쇠를 찾아요! (${KEY_CHALLENGES[kh.ch.id].name})`, 3.5);
}

function updateKeyHunt(p, dt) {
  const kh = game.keyhunt;
  if (!kh || p.hp <= 0) return;
  if (kh.ch) KEY_CHALLENGES[kh.ch.id].update(kh.ch, p, dt);
  if (kh.keyItem) {
    kh.keyItem.t += dt;
    if (Math.hypot(p.x - kh.keyItem.x, p.y - kh.keyItem.y) < 0.75) {
      kh.keyItem = null; kh.hasKey = true; kh.hint = 0;
      game.profile.keys[kh.mapId] = true; saveProfile();
      sfx.levelUp();
      showMessage("보스방 열쇠를 찾았다!", 3, true);
      for (let i = 0; i < 30; i++) addSparkle(p.x, p.y, Math.random(), { vz: 2 + Math.random() * 2, life: 1, size: 0.9, gold: true });
    }
  }
  if (!kh.hasKey || (kh.door && !kh.door.open)) kh.hint += dt;
}

function keyHuntTarget() {
  const kh = game.keyhunt;
  if (!kh || kh.inBoss || game.upper) return null;
  if (kh.keyItem) return kh.keyItem;
  if (kh.hasKey) return kh.door;
  if (kh.ch) { const C = KEY_CHALLENGES[kh.ch.id]; return C.target ? C.target(kh.ch) : null; }
  return null;
}
function keyHuntHintOn() {
  const kh = game.keyhunt;
  return kh && !kh.inBoss && kh.hint > ktune().hint;
}

function keyHuntStatus() {
  const kh = game.keyhunt;
  if (game.upper && game.mode === "dungeon") return chests.some((c) => c.gold && !c.open) ? "위층 · 황금 상자를 찾아요" : "위층 · 계단으로 내려가요";
  if (!kh || game.mode !== "dungeon") return null;
  if (kh.inBoss) return "보스전!";
  if (kh.keyItem) return "열쇠를 주워요!";
  if (kh.hasKey) return "열쇠 있음! 보스방 문으로";
  if (kh.ch) {
    const C = KEY_CHALLENGES[kh.ch.id];
    const pre = kh.steps.length > 1 ? `단서 ${kh.index + 1}/${kh.steps.length} · ` : "";
    return pre + (C.status ? C.status(kh.ch) : C.name);
  }
  return null;
}

function keyHuntInteractables() {
  const kh = game.keyhunt;
  if (game.upper) return []; // 위층 (upper.js)
  if (!kh || game.mode !== "dungeon") return [];
  const list = [];
  if (!kh.inBoss) list.push(...bossDoorInteractables()); // bossroom.js
  if (kh.ch && !kh.inBoss) { const C = KEY_CHALLENGES[kh.ch.id]; if (C.interact) list.push(...C.interact(kh.ch)); }
  return list;
}

function keyHuntFloor() {
  if (game.upper) return; // 위층 (upper.js)
  const kh = game.keyhunt;
  if (!kh || game.mode !== "dungeon" || kh.inBoss) return;
  if (kh.ch) { const C = KEY_CHALLENGES[kh.ch.id]; if (C.floor) C.floor(kh.ch); }
  // 열쇠를 가진 몬스터 발밑에 금빛 고리
  for (const m of monsters) if ((m.keyGuard || m.def === MONSTERS.keyThief) && m.hp > 0 && onScreen(m.x, m.y)) khFloorCircle(m.x, m.y, m.r + 0.25, null, `rgba(255,215,80,${0.6 + 0.3 * Math.sin(game.time * 6)})`, 3);
}

function keyHuntThings(list) {
  if (game.upper) return; // 위층 (upper.js)
  const kh = game.keyhunt;
  if (!kh || game.mode !== "dungeon") return;
  if (kh.inBoss) { bossRoomThings(list); return; }
  bossDoorThings(list);
  if (kh.ch) { const C = KEY_CHALLENGES[kh.ch.id]; if (C.things) C.things(kh.ch, list); }
  for (const m of monsters) if ((m.keyGuard || m.def === MONSTERS.keyThief) && m.hp > 0 && onScreen(m.x, m.y)) {
    const S = (m.def.size || 1) * (m.scaleMul || 1);
    list.push({ depth: m.x + m.y + 0.01, x: m.x, y: m.y, draw: () => khIconKey(m.x, m.y, 1.55 * S + Math.sin(game.time * 4) * 0.05, 0.9) });
  }
  if (kh.keyItem) {
    const k = kh.keyItem;
    list.push({ depth: k.x + k.y, x: k.x, y: k.y, draw: () => {
      const c = toScreen(k.x, k.y, 0.4);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(c.x, c.y - 160 * ZOOM, c.x, c.y);
      g.addColorStop(0, "rgba(255,230,120,0)"); g.addColorStop(1, "rgba(255,230,120,0.5)");
      ctx.fillStyle = g; ctx.fillRect(c.x - 18 * ZOOM, c.y - 160 * ZOOM, 36 * ZOOM, 160 * ZOOM);
      ctx.restore();
      khIconKey(k.x, k.y, 0.55 + Math.sin(k.t * 3) * 0.08, 1.6);
    } });
  }
}

function keyHuntLights(lights) {
  if (game.upper) return; // 위층 (upper.js)
  const kh = game.keyhunt;
  if (!kh || game.mode !== "dungeon") return;
  if (kh.inBoss) return;
  if (kh.dark && lights[0]) lights[0].radius = Math.min(lights[0].radius, 2.4);
  if (kh.ch) { const C = KEY_CHALLENGES[kh.ch.id]; if (C.lights) lights.push(...C.lights(kh.ch)); }
  if (kh.keyItem) lights.push({ x: kh.keyItem.x, y: kh.keyItem.y, radius: 3, power: 0.9 });
  if (kh.door) lights.push({ x: kh.door.x, y: kh.door.y, radius: 3, power: 0.7 });
}
