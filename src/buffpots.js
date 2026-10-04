// ===== 강화 물약: 신속(이동 속도)·공격력 =====
// 지금 값의 % 만큼 올려요. 3단계: 작은(가게) · 큰(가게) · 최상급(던전에서 줍기만, 가게에 없어요)
//   마시기: 신속 Z · 공격력 X (터치: 물약 버튼 옆 작은 버튼). 가진 것 중 가장 센 것을 마셔요.
//   같은 종류를 또 마시면: 더 세거나 같으면 바꾸고 시간은 긴 쪽, 약하면 안 마셔요 (아깝지 않게)
//   저장: profile.buffPots = { speed1, speed2, speed3, atk1, atk2, atk3 } (개수, 끝 없음)
// 같이 하기: 친구는 자기 저장에서 마셔요(netplay.js netGuestTick -> buffPotGuestPress). 방장 기기는 친구 주인공에게도 같은 효과를 걸어요
//   (공격력은 방장이 피해를 계산하고, 신속은 친구 기기가 자기 주인공을 움직이니까 두 기기 모두 효과를 알아요)

const BUFF_TYPES = {
  speed: { name: "신속", key: "KeyZ", keyName: "Z", touch: "TouchSpeedPot", icon: "pot_speed", color: "#5fd0ff", liquid: "#39b8f0" },
  atk: { name: "공격력", key: "KeyX", keyName: "X", touch: "TouchAtkPot", icon: "pot_atk", color: "#ff7a5a", liquid: "#e8483a" },
};
// 단계: 올리는 %, 시간(초), 가게 값(에메랄드, 최상급은 0 = 안 팔아요), 파는 값
const BUFF_TIERS = [
  null,
  { label: "작은", pct: { speed: 15, atk: 15 }, dur: 30, price: 8, sell: 3 },
  { label: "큰", pct: { speed: 25, atk: 30 }, dur: 45, price: 20, sell: 8 },
  { label: "최상급", pct: { speed: 40, atk: 50 }, dur: 60, price: 0, sell: 20 },
];
const BUFF_IDS = Object.keys(BUFF_TYPES).flatMap((t) => [1, 2, 3].map((n) => t + n));
function buffPotOk(id) { return typeof id === "string" && BUFF_IDS.includes(id); }
function buffPotParse(id) { return { type: id.slice(0, -1), tier: Number(id.slice(-1)) }; }
function buffPotName(id) { const { type, tier } = buffPotParse(id); return `${BUFF_TIERS[tier].label} ${BUFF_TYPES[type].name} 물약`; }
function buffPotDesc(id) { const { type, tier } = buffPotParse(id); const T = BUFF_TIERS[tier]; return `${type === "speed" ? "이동 속도" : "공격력"} +${T.pct[type]}% · ${T.dur}초`; }

// ----- 가진 개수 -----
function buffInv(pr = game.profile) {
  if (!pr) return {};
  if (!pr.buffPots || typeof pr.buffPots !== "object" || Array.isArray(pr.buffPots)) pr.buffPots = {};
  return pr.buffPots;
}
function buffPotCount(id, pr) { const n = buffInv(pr)[id]; return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; }
function buffPotAdd(id, n = 1, pr) { if (!buffPotOk(id) || !(n > 0)) return; const inv = buffInv(pr); inv[id] = buffPotCount(id, pr) + Math.floor(n); }
function buffPotTake(id, n = 1, pr) { const have = buffPotCount(id, pr); if (have < n) return false; const inv = buffInv(pr); inv[id] = have - n; if (!inv[id]) delete inv[id]; return true; }
// 가진 것 중 가장 센 단계 (없으면 0)
function buffPotBest(type, pr) { for (let t = 3; t >= 1; t--) if (buffPotCount(type + t, pr) > 0) return t; return 0; }
function buffPotTotal(type, pr) { let n = 0; for (let t = 1; t <= 3; t++) n += buffPotCount(type + t, pr); return n; }

hookOn("profileLoaded", (pr) => {
  const inv = buffInv(pr);
  for (const k of Object.keys(inv)) if (!buffPotOk(k) || !(Number.isFinite(inv[k]) && inv[k] > 0)) delete inv[k]; else inv[k] = Math.floor(inv[k]);
}, 50);

// ----- 지금 걸린 효과 (주인공마다: pid 로) -----
// buffActive.get(pid) = { speed: { tier, mul, t, dur }, atk: {...} }
const buffActive = new Map();
function buffKey(p) { return (p && p.pid) || 1; }
function buffOf(p, type) { const b = buffActive.get(buffKey(p)); const e = b && b[type]; return e && e.t > 0 ? e : null; }
// 곱하는 값 (효과가 없으면 1)
function buffMul(p, type) { const e = buffOf(p, type); return e ? e.mul : 1; }
function buffApply(p, type, tier) {
  const T = BUFF_TIERS[tier]; if (!T || !BUFF_TYPES[type]) return false;
  const k = buffKey(p), b = buffActive.get(k) || {}, cur = b[type] && b[type].t > 0 ? b[type] : null;
  if (cur && cur.tier > tier) return false; // 더 센 게 걸려 있어요
  b[type] = { tier, mul: 1 + T.pct[type] / 100, t: Math.max(T.dur, cur ? cur.t : 0), dur: T.dur };
  buffActive.set(k, b);
  return true;
}
function buffClearAll() { buffActive.clear(); }
// 마실 수 있나 (그 단계를 가졌고, 더 센 게 안 걸려 있으면)
function buffCanDrink(p, type, tier) { const cur = buffOf(p, type); return !(cur && cur.tier > tier); }

// 시간: 던전에서 게임이 움직일 때만 줄어요 (창을 열면 멈춰요). 캠프로 돌아가면 다 풀려요
hookOn("timeScale", (dt) => {
  if (game.scene !== "dungeon") { if (buffActive.size) buffClearAll(); return dt; }
  if (game.overlay || game.result || !buffActive.size) return dt;
  for (const [k, b] of buffActive) {
    for (const type of Object.keys(b)) { b[type].t -= dt; if (b[type].t <= 0) delete b[type]; }
    if (!Object.keys(b).length) buffActive.delete(k);
  }
  return dt;
}, 70);
hookOn("dungeonStarted", () => buffClearAll(), 50);

// ----- 마시기 -----
// 조작: 내 기기 주인공(혼자·방장·친구 기기의 나)은 Z/X 를 "가진 것 중 가장 센 단계"로 바꿔서 넘겨요 (potSpeed3Pressed 처럼)
//   이름에 단계를 담아야 방장이 친구 주인공에게 같은 단계를 걸 수 있어요
function buffInputKey(type, tier) { return `pot${type === "speed" ? "Speed" : "Atk"}${tier}Pressed`; }
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || p.remote || (p !== game.player && typeof coopLocal === "function" && coopLocal())) return inp; // 친구 주인공은 netplay.js 가 친구 조작으로 바꿔요 / 한 기기 2번은 키가 없어요
  for (const type of Object.keys(BUFF_TYPES)) {
    const B = BUFF_TYPES[type], pressed = wasPressed(B.key, B.touch);
    const best = pressed ? buffPotBest(type) : 0;
    for (let t = 1; t <= 3; t++) inp[buffInputKey(type, t)] = pressed && best === t;
    if (pressed && !best && game.scene === "dungeon" && !netGuestMine()) { showMessage(`${B.name} 물약이 없어요`, 1); sfx.denied(); }
  }
  return inp;
}, 60);
function netGuestMine() { return typeof netGuest === "function" && netGuest(); }

// 방장·혼자 기기: 주인공마다 (친구 주인공 포함)
const buffRemoteT = new Map();
hookOn("playerSkills", (p, inp) => {
  if (!inp || game.scene !== "dungeon" || p.hp <= 0 || netGuestMine()) return; // 친구 기기의 나는 netGuestTick 에서 이미 마셨어요
  for (const type of Object.keys(BUFF_TYPES)) for (let t = 3; t >= 1; t--) {
    if (!inp[buffInputKey(type, t)]) continue;
    if (p.remote) {
      // 친구는 자기 물약을 이미 썼어요. 너무 자주는 안 받아요 (0.4초)
      const k = p.pid + type, last = buffRemoteT.get(k);
      if (last !== undefined && game.time - last < 0.4 && game.time >= last) break;
      buffRemoteT.set(k, game.time);
      if (buffApply(p, type, t)) buffDrinkFx(p, type, t, true);
      break;
    }
    buffDrink(p, type, t);
    break;
  }
});
function buffDrink(p, type, tier) {
  const B = BUFF_TYPES[type], id = type + tier;
  if (!buffCanDrink(p, type, tier)) { showMessage(`더 센 ${B.name} 물약이 아직 효과 중이에요`, 1.4); sfx.denied(); return false; }
  if (!buffPotTake(id)) { showMessage(`${B.name} 물약이 없어요`, 1); sfx.denied(); return false; }
  buffApply(p, type, tier);
  buffDrinkFx(p, type, tier, true);
  saveProfile();
  return true;
}
function buffDrinkFx(p, type, tier, text) {
  const B = BUFF_TYPES[type], T = BUFF_TIERS[tier];
  if (text) addFloatText(p.x, p.y, `${B.name} +${T.pct[type]}%`, B.color, 20);
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(p.x + Math.cos(a) * 0.35, p.y + Math.sin(a) * 0.35, Math.random() * 0.9, { vz: 1.6, life: 0.7, size: 0.7, hue: type === "speed" ? 195 : 10 });
  }
  if (typeof sfx !== "undefined") sfx.potion();
}
// 친구 기기: 보내기 전에 내 저장에서 꺼내요 (없거나 더 센 게 걸려 있으면 안 보내요)
function buffPotGuestPress(inp, p) {
  for (const type of Object.keys(BUFF_TYPES)) for (let t = 1; t <= 3; t++) {
    const k = buffInputKey(type, t);
    if (!inp[k]) continue;
    if (game.scene !== "dungeon" || !p || p.hp <= 0 || !buffCanDrink(p, type, t) || !buffPotTake(type + t)) {
      inp[k] = false;
      if (game.scene === "dungeon" && p && p.hp > 0) { showMessage(buffCanDrink(p, type, t) ? `${BUFF_TYPES[type].name} 물약이 없어요` : `더 센 ${BUFF_TYPES[type].name} 물약이 아직 효과 중이에요`, 1.4); sfx.denied(); }
      continue;
    }
    buffApply(p, type, t); // 내 화면 (빠르기·남은 시간). 글자는 방장이 보내요
    buffDrinkFx(p, type, t, false);
    saveProfile();
  }
}

// ----- 줍기 (상자·정예·보스) -----
// 단계 고르기: 보통 / 정예·황금 상자 / 보스
const BUFF_DROP_W = { normal: [65, 28, 7], good: [45, 38, 17], boss: [20, 45, 35] };
function buffPotRoll(kind = "normal") {
  const w = BUFF_DROP_W[kind] || BUFF_DROP_W.normal, sum = w[0] + w[1] + w[2];
  let r = Math.random() * sum, tier = 1;
  for (let i = 0; i < 3; i++) { if (r < w[i]) { tier = i + 1; break; } r -= w[i]; }
  return (Math.random() < 0.5 ? "speed" : "atk") + tier;
}
function buffPotDrop(x, y, kind) { dropPickup("buffpot", x, y, { pot: buffPotRoll(kind) }); }
// 주웠을 때 (main.js onPickup)
function buffPotPickup(e, p) {
  const id = buffPotOk(e.pot) ? e.pot : "speed1";
  buffPotAdd(id, 1);
  const { type, tier } = buffPotParse(id);
  addFloatText(p.x, p.y, `${buffPotName(id)} +1`, tier === 3 ? "#ffe066" : BUFF_TYPES[type].color, tier === 3 ? 18 : 16);
  if (typeof sfx !== "undefined") (tier === 3 && sfx.levelUp ? sfx.levelUp : sfx.potion)();
}
// 바닥에 놓인 모양 (effects.js drawPickup)
function drawBuffPotPickup(e, z) {
  const id = buffPotOk(e.pot) ? e.pot : "speed1", { type, tier } = buffPotParse(id), B = BUFF_TYPES[type];
  const s = 0.18 + tier * 0.02;
  drawBox(e.x - s / 2, e.y - s / 2, z, s, s, 0.24, B.liquid);
  drawBox(e.x - 0.04, e.y - 0.04, z + 0.24, 0.08, 0.08, 0.08, tier === 3 ? "#ffe066" : "#e8eef5");
  if (tier === 3 && Math.sin(e.t * 6 + e.x) > 0.6) { const c = toScreen(e.x, e.y, z + 0.4); drawStar(c.x, c.y, 5 * ZOOM, "#fff6c0"); }
}

// 상자: 보통 상자 25%, 황금 상자 60%
hookOn("chestOpened", (c) => { if (Math.random() < (c.gold ? 0.6 : 0.25)) buffPotDrop(c.x, c.y, c.gold ? "good" : "normal"); }, 50);
// 몬스터: 정예 10%, 보통 1.5%, 보스는 꼭 (큰 보스방 보스는 2개)
hookOn("monsterKilled", (m) => {
  if (!m || m.dummy || m.clone || (m.def && (m.def.untargetable || m.def.behavior === "prop"))) return;
  if (game.scene !== "dungeon") return;
  if (m.boss) {
    const n = game.keyhunt && game.keyhunt.inBoss ? 2 : 1;
    for (let i = 0; i < n; i++) {
      // 보스방은 바로 결과창이라 바로 넣어요 (탑 보스는 바닥에)
      if (game.keyhunt && game.keyhunt.inBoss) { const id = buffPotRoll("boss"); buffPotAdd(id, 1); if (game.run) { game.run.buffPots = game.run.buffPots || {}; game.run.buffPots[id] = (game.run.buffPots[id] || 0) + 1; } }
      else buffPotDrop(m.x, m.y, "boss");
    }
    return;
  }
  if (Math.random() < (m.elite ? 0.1 : 0.015)) buffPotDrop(m.x, m.y, m.elite ? "good" : "normal");
}, 60);

// ----- 화면: 남은 시간 + 가진 수 (키보드면 Z/X 칸, 터치면 버튼) -----
hookOn("hudDraw", () => {
  const p = game.player;
  if (!p || game.scene !== "dungeon") return;
  const shown = Math.min(p.maxHp, 40);
  const y = 14 + Math.ceil(shown / 10) * 24 + 6 + 26 + 30 + 16 + 18; // 직업 힘 막대 아래 줄 (classes.js), 기술 칸 오른쪽
  let x = 16 + 4 * 46 + 10;
  for (const type of Object.keys(BUFF_TYPES)) {
    const B = BUFF_TYPES[type], e = buffOf(p, type), total = buffPotTotal(type), best = buffPotBest(type);
    if (!e && !total) continue;
    ctx.fillStyle = e ? "rgba(30,40,55,0.92)" : "rgba(29,36,48,0.8)"; ctx.fillRect(x, y, 40, 40);
    ctx.strokeStyle = e ? B.color : "#4a5466"; ctx.lineWidth = 2; ctx.strokeRect(x, y, 40, 40);
    if (e) { ctx.fillStyle = B.color; ctx.globalAlpha = 0.28; ctx.fillRect(x, y + 40 * (1 - e.t / e.dur), 40, 40 * (e.t / e.dur)); ctx.globalAlpha = 1; }
    drawIcon(B.icon, x + 20, y + 19, 28, { gray: !e && !total });
    if (!touch.show) text(B.keyName, x + 35, y + 11, 10, "#fff", "center");
    if (total) text(`${total}`, x + 36, y + 37, 11, best === 3 ? "#ffe066" : "#fff", "right");
    text(e ? `+${Math.round((e.mul - 1) * 100)}% ${Math.ceil(e.t)}초` : B.name, x + 20, y + 52, 10, e ? B.color : "#ddd", "center");
    x += 54;
  }
}, 65);

// 터치 버튼 (가진 게 있거나 효과 중일 때만): 물약 버튼 옆
//   자리는 btnlayout.js BTN_DEFAULTS (버튼 배치 바꾸기에서 옮길 수 있어요. 배치 화면에선 늘 보여요)
hookOn("touchButtons", (list, s) => {
  if (game.scene !== "dungeon" || !game.player) return list;
  const W0 = view.w, H = view.h, editing = typeof btnEdit !== "undefined" && btnEdit.raw;
  for (const type of Object.keys(BUFF_TYPES)) {
    const B = BUFF_TYPES[type], total = buffPotTotal(type), e = buffOf(game.player, type);
    if (!total && !e && !editing) continue;
    const q = BTN_DEFAULTS[B.touch];
    list.push({ code: B.touch, icon: B.icon, label: e ? `${Math.ceil(e.t)}초` : `${B.name} ${total}`, x: W0 - q[0] * s, y: H - q[1] * s, r: q[2] * s, color: B.liquid, cd: e ? 1 - e.t / e.dur : 0 });
  }
  return list;
}, 45);
