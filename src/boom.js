// ===== TNT 와 폭죽 =====
// TNT (T 키 · 터치 TNT 버튼, 던전에서만): 발밑에 TNT 를 놓아요. 2초 동안 칙칙 타다가 쾅! 둘레 2.6칸 몬스터가 크게 아파요.
//   주인공(나·친구)은 안 다쳐요. 근처 다른 TNT 도 같이 터져요(연쇄). 보스는 40% 만 아파요.
// 폭죽 (B 키 · 터치 폭죽 버튼, 캠프·던전 어디서나): 슝~ 올라가서 펑! 알록달록. 던전에선 둘레 3칸 몬스터가 0.8초 눈부셔 멈춰요(보스는 안 멈춰요).
// 가게(화살 · 물약 칸)에서 사요: TNT 에메랄드 5 (10개까지), 폭죽 에메랄드 2 (20개까지).
//   저장: profile.boomItems = { tnt, fw } (개수)
// 같이 하기: 물건은 기기마다 자기 저장에서 꺼내요. 친구 기기는 "놓았어요/쏘았어요"(tntPressed/fwPressed)를 조작으로 보내고,
//   방장이 TNT(소품 몬스터 boom_tnt, 남은 시간 tntT 가 친구에게 가요)와 폭죽 효과를 만들어요.
//   폭죽 불꽃(반짝이)은 각 기기가 그려요: 방장이 "fw" 사건을 보내요.

const BOOM = {
  tnt: { id: "tnt", name: "TNT", key: "KeyT", keyName: "T", touch: "TouchTnt", price: 5, max: 10, icon: "tnt", color: "#d8382c",
    fuse: 2.0, radius: 2.6, mul: 5, bossMul: 0.4, chain: 0.15 },
  fw: { id: "fw", name: "폭죽", key: "KeyB", keyName: "B", touch: "TouchFirework", price: 2, max: 20, icon: "firework", color: "#7fd8ff",
    rise: 0.9, stunR: 3, stun: 0.8 },
};
const BOOM_IDS = ["tnt", "fw"];

function boomInv(pr = game.profile) { if (!pr) return {}; if (!pr.boomItems || typeof pr.boomItems !== "object" || Array.isArray(pr.boomItems)) pr.boomItems = {}; return pr.boomItems; }
function boomCount(id, pr) { const n = boomInv(pr)[id]; return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; }
function boomAdd(id, n = 1, pr) { if (!BOOM[id] || !(n > 0)) return 0; const inv = boomInv(pr), had = boomCount(id, pr); inv[id] = Math.min(BOOM[id].max, had + Math.floor(n)); return inv[id] - had; }
function boomTake(id, pr) { const have = boomCount(id, pr); if (!have) return false; const inv = boomInv(pr); inv[id] = have - 1; if (!inv[id]) delete inv[id]; return true; }
function boomGuest() { return typeof netGuest === "function" && netGuest(); }
hookOn("profileLoaded", (pr) => {
  const inv = boomInv(pr);
  for (const k of Object.keys(inv)) if (!BOOM[k] || !(Number.isFinite(inv[k]) && inv[k] > 0)) delete inv[k]; else inv[k] = Math.min(BOOM[k].max, Math.floor(inv[k]));
}, 50);

// ----- TNT 소품 (못 때리고, 안 막고, 도감·정예에서 빠져요) -----
MONSTERS.boom_tnt = { name: "TNT", color: "#d8382c", shape: "boom_tnt", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, untargetable: true, codexSkip: true };
if (typeof ELITE_RULES !== "undefined") ELITE_RULES.notElite.push("boom_tnt");
if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add("boom_tnt");
function boomTnts() { return monsters.filter((m) => m.type === "boom_tnt" && m.hp > 0); }
function boomPlaceTnt(p) {
  const T = BOOM.tnt, x = p.x + (p.faceX || 0) * 0.5, y = p.y + (p.faceY || 0) * 0.5;
  const s = !hitsWall(x, y, 0.2) ? { x, y } : { x: p.x, y: p.y };
  const m = createMonster("boom_tnt", s.x, s.y, game.mapLevel || 1);
  m.appearTimer = 0; m.aggro = false; m.immovable = true; m.r = 0.05;
  m.tntT = T.fuse; m.tntDmg = (typeof weaponPower === "function" ? weaponPower(p) : 5) * T.mul; m.tntBy = p.pid || 1;
  monsters.push(m);
  if (typeof sfx !== "undefined" && sfx.fuse) sfx.fuse();
  addFloatText(s.x, s.y, "칙칙...", "#ffb070", 15);
  return m;
}
function boomExplode(t) {
  const T = BOOM.tnt;
  t.hp = 0; t.tntT = 0;
  addRing(t.x, t.y, { speed: 9, life: 0.35, hue: 20 });
  addRing(t.x, t.y, { speed: 6, life: 0.45, hue: 45, delay: 0.08 });
  spawnBurst(t.x, t.y, ["#ff7a3b", "#ffd23f", "#ffffff", "#555555"], 26);
  game.shake = Math.max(game.shake, 0.45);
  if (typeof sfx !== "undefined" && sfx.boom) sfx.boom();
  addFloatText(t.x, t.y, "쾅!", "#ffd23f", 24);
  for (const m of monsters) {
    if (m.hp <= 0 || m === t) continue;
    const d = Math.hypot(m.x - t.x, m.y - t.y);
    if (m.type === "boom_tnt") { if (d < T.radius && m.tntT > T.chain) m.tntT = T.chain; continue; } // 연쇄
    if (d > T.radius + (m.r || 0.4) * 0.5 || (m.def && (m.def.untargetable || m.def.behavior === "prop"))) continue;
    damageMonster(m, (t.tntDmg || 5) * (m.boss ? T.bossMul : 1), t.x, t.y, false, 2.2, {});
  }
}
// 방장(혼자) 기기: 타는 시간
hookOn("dungeonTick", (dt) => {
  if (boomGuest()) return;
  for (const t of boomTnts()) { t.tntT = (t.tntT ?? BOOM.tnt.fuse) - dt; if (t.tntT <= 0) boomExplode(t); }
}, 40);
// TNT 모양: 빨간 상자 + 흰 띠 + 심지 불꽃, 바닥에 터질 자리 (끝날수록 빨리 깜빡)
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.boom_tnt = (m) => {
  const x = m.x, y = m.y, left = Math.max(0, m.tntT ?? BOOM.tnt.fuse), blink = Math.sin(game.time * (8 + (BOOM.tnt.fuse - left) * 10)) > 0;
  drawBox(x - 0.22, y - 0.22, 0, 0.44, 0.44, 0.42, blink && left < 1 ? "#ff8a7a" : "#d8382c");
  drawBox(x - 0.23, y - 0.23, 0.15, 0.46, 0.46, 0.12, "#f4efe6");
  drawBox(x - 0.03, y - 0.03, 0.42, 0.06, 0.06, 0.12, "#3a2a1a");
  const s = toScreen(x, y, 0.58);
  if (typeof drawStar === "function") drawStar(s.x, s.y, (4 + Math.random() * 2) * ZOOM, Math.random() < 0.5 ? "#ffd23f" : "#ff7a3b");
};
hookOn("drawFloor", () => {
  if (game.scene !== "dungeon" || typeof monsters === "undefined") return;
  for (const t of monsters) {
    if (t.type !== "boom_tnt" || t.hp <= 0 || !onScreen(t.x, t.y, 4)) continue;
    const left = Math.max(0, t.tntT ?? BOOM.tnt.fuse), k = 1 - left / BOOM.tnt.fuse, pts = [];
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push(toScreen(t.x + Math.cos(a) * BOOM.tnt.radius, t.y + Math.sin(a) * BOOM.tnt.radius, 0.02)); }
    ctx.save(); ctx.strokeStyle = `rgba(255,170,60,${0.35 + 0.5 * k})`; ctx.lineWidth = 2.5 * ZOOM; ctx.setLineDash([6 * ZOOM, 5 * ZOOM]);
    ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
}, 46);

// ----- 폭죽 -----
const FW_LIVE = []; // 이 기기에서 그리는 폭죽 { x, y, t, hue, burst }
function fwLaunchLocal(x, y, hue, sound) {
  FW_LIVE.push({ x, y, t: 0, hue, burst: false, sound });
  if (sound && typeof sfx !== "undefined" && sfx.fuse) sfx.fuse();
}
// 방장(혼자): 쏘기 (친구 기기도 그리게 사건으로)
function fwLaunch(p) {
  const hue = Math.floor(Math.random() * 360);
  fwLaunchLocal(p.x, p.y, hue, true);
  if (typeof netHosting === "function" && netHosting() && !netplay.replaying) netplay.events.push(["fw", [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, hue], 0]);
}
hookOn("netGuestEvent", (kind, args) => {
  if (kind !== "fw") return false;
  if (Array.isArray(args) && args.every((v) => typeof v === "number" && Number.isFinite(v))) fwLaunchLocal(args[0], args[1], args[2] % 360, false); // 소리는 방장 사건으로 와요
  return true;
}, 50);
// 매 화면 (캠프·던전 모두): 올라가며 꼬리 반짝, 다 올라가면 펑
hookOn("timeScale", (dt) => {
  if (!FW_LIVE.length || !(dt > 0) || game.scene === "title") return dt;
  for (const f of FW_LIVE) {
    f.t += dt;
    const k = Math.min(1, f.t / BOOM.fw.rise), z = 0.6 + k * 3.6;
    if (!f.burst) {
      addSparkle(f.x + (Math.random() - 0.5) * 0.1, f.y + (Math.random() - 0.5) * 0.1, z, { vz: -0.6, life: 0.4, size: 0.7, hue: 40 });
      if (k >= 1) { f.burst = true; fwBurst(f, z); }
    }
  }
  for (let i = FW_LIVE.length - 1; i >= 0; i--) if (FW_LIVE[i].burst) FW_LIVE.splice(i, 1);
  return dt;
}, 74);
function fwBurst(f, z) {
  // 알록달록 큰 공 모양 (두 겹: 바깥 큰 별 + 안쪽 작은 별)
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * Math.PI, sp = (i < 50 ? 3.8 : 2.0) + Math.random() * 0.8;
    addSparkle(f.x, f.y, z, { vx: Math.cos(a) * Math.cos(b) * sp, vy: Math.sin(a) * Math.cos(b) * sp, vz: Math.sin(b) * sp + 0.5, life: 1.2 + Math.random() * 0.5, size: i < 50 ? 1.4 : 1.0, hue: (f.hue + i * 47) % 360, gravity: 1.8 });
  }
  if (typeof flashScreen === "function" && f.sound) flashScreen(0.08);
  if (f.sound && typeof sfx !== "undefined") { if (sfx.boom) sfx.boom(); if (sfx.sparkle) sfx.sparkle(); }
  // 던전(방장·혼자): 둘레 몬스터가 눈부셔 잠깐 멈춰요
  if (game.scene === "dungeon" && !boomGuest() && f.sound) {
    let n = 0;
    for (const m of monsters) {
      if (m.hp <= 0 || m.boss || (m.def && (m.def.untargetable || m.def.behavior === "prop")) || Math.hypot(m.x - f.x, m.y - f.y) > BOOM.fw.stunR) continue;
      m.stunTimer = Math.max(m.stunTimer || 0, BOOM.fw.stun); n++;
    }
    if (n) addFloatText(f.x, f.y, "번쩍! 눈부셔!", "#ffe27a", 18);
  }
}

// ----- 조작: 내 기기 주인공이 키를 누르면 내 저장에서 꺼내요 -----
if (typeof NP_INPUT_KEYS !== "undefined") { NP_INPUT_KEYS.add("tntPressed"); NP_INPUT_KEYS.add("fwPressed"); }
const BOOM_USE_AT = { tnt: -9, fw: -9 };
function boomUse(id, p) {
  const B = BOOM[id];
  if (game.time - BOOM_USE_AT[id] < 0.3 && game.time >= BOOM_USE_AT[id]) return false; // 한 장면에 여러 번 읽혀도 한 번만
  if (!p || p.hp <= 0) return false;
  if (id === "tnt" && game.scene !== "dungeon") { showMessage("TNT 는 던전에서 써요", 1.4); return false; }
  if (!boomCount(id)) { showMessage(`${josa(B.name, "이/가")} 없어요 (상인 가게에서 사요)`, 1.6); if (typeof sfx !== "undefined" && sfx.denied) sfx.denied(); return false; }
  boomTake(id); BOOM_USE_AT[id] = game.time;
  saveProfile();
  return true;
}
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || p.remote || p !== game.player || game.overlay) return inp;
  if (wasPressed(BOOM.tnt.key, BOOM.tnt.touch)) inp.tntPressed = boomUse("tnt", p);
  if (wasPressed(BOOM.fw.key, BOOM.fw.touch)) inp.fwPressed = boomUse("fw", p);
  return inp;
}, 62);
// 방장(혼자): 모든 주인공 (친구는 이미 자기 저장에서 꺼냈어요)
const BOOM_REMOTE_T = new Map();
hookOn("playerSkills", (p, inp) => {
  if (!p || !inp || boomGuest() || p.hp <= 0) return;
  for (const id of BOOM_IDS) {
    if (!inp[id + "Pressed"]) continue;
    if (p.remote) { const k = (p.pid || 0) + id, last = BOOM_REMOTE_T.get(k); if (last !== undefined && game.time - last < 0.4 && game.time >= last) continue; BOOM_REMOTE_T.set(k, game.time); }
    if (id === "tnt") { if (game.scene === "dungeon") boomPlaceTnt(p); }
    else fwLaunch(p);
  }
}, 52);

// ----- 가게 -----
function shopBoomEntries() { return BOOM_IDS.map((id) => ({ kind: "boom", id, item: { name: BOOM[id].name, color: BOOM[id].color, price: BOOM[id].price } })); }
function shopBoomDesc(id) { return id === "tnt" ? `놓으면 2초 뒤 쾅! 몬스터만 아파요 · ${boomCount(id)}개 있음 · 던전에서 T` : `슝~ 펑! 몬스터가 눈부셔요 · ${boomCount(id)}개 있음 · 어디서나 B`; }
function shopBuyBoom(id) {
  const B = BOOM[id];
  if (boomCount(id) >= B.max) return shopNote(`${josa(B.name, "은/는")} ${B.max}개까지만 가질 수 있어요`, "#ddd");
  if (!pay({ cur: "emerald", n: B.price })) return notEnough(B.price);
  boomAdd(id, 1);
  saveProfile(); sfx.buy();
  return shopNote(`${josa(B.name, "을/를")} 샀어요! (${boomCount(id)}개)`, "#7dffb0");
}

// ----- 화면: 가진 수 (키보드) / 터치 버튼 -----
hookOn("hudDraw", () => {
  const p = game.player;
  if (!p || (game.scene !== "dungeon" && game.scene !== "lobby") || (typeof touch !== "undefined" && touch.show)) return;
  const nt = boomCount("tnt"), nf = boomCount("fw");
  if (!nt && !nf) return;
  const shown = Math.min(p.maxHp, 40), y = 14 + Math.ceil(shown / 10) * 24 + 6 + 26 + 30 + 18; // 분노 막대 줄 오른쪽
  text([nt ? `T TNT ${nt}` : "", nf ? `B 폭죽 ${nf}` : ""].filter(Boolean).join(" · "), 182, y + 9, 13, "#ffd0a0");
}, 32);
hookOn("touchButtons", (list, s) => {
  if (!game.player || (game.scene !== "dungeon" && game.scene !== "lobby")) return list;
  const editing = typeof btnEdit !== "undefined" && btnEdit.raw;
  for (const id of BOOM_IDS) {
    const B = BOOM[id], n = boomCount(id);
    if (!editing && (!n || (id === "tnt" && game.scene !== "dungeon"))) continue;
    const q = BTN_DEFAULTS[B.touch];
    list.push({ code: B.touch, icon: B.icon, label: `${B.name} ${n}`, x: view.w - q[0] * s, y: view.h - q[1] * s, r: q[2] * s, color: B.color, cd: 0 });
  }
  return list;
}, 43);

// 아이콘: TNT 상자 / 폭죽
if (typeof ICON_DEFS !== "undefined") {
  ICON_DEFS.tnt = (g) => { g.rect(4, 6, 16, 18, "r"); g.rect(4, 10, 16, 13, "w"); g.line(10, 6, 12, 2, "N", 1.2); g.disc(12.5, 1.8, 1.2, "Y"); };
  ICON_DEFS.firework = (g) => { g.rect(8, 10, 11, 18, "C"); g.rect(8, 9, 11, 10, "r"); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.line(9.5 + Math.cos(a) * 2, 5 + Math.sin(a) * 2, 9.5 + Math.cos(a) * 4.5, 5 + Math.sin(a) * 4, i % 2 ? "Y" : "m", 1); } };
}
// 버튼 설명
if (typeof HELP_COMMON !== "undefined") {
  const i = HELP_COMMON.findIndex((h) => h.icon === "use");
  HELP_COMMON.splice(i >= 0 ? i : HELP_COMMON.length, 0,
    { icon: "tnt", name: "TNT", touch: "놓으면 2초 뒤 쾅! 몬스터만 아파요 (던전)", key: "T" },
    { icon: "firework", name: "폭죽", touch: "슝~ 펑! 몬스터가 눈부셔요", key: "B" });
}
