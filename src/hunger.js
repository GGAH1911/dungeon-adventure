// ===== 배고픔 게이지 (난이도 어려움·악몽만) =====
// 던전·탑에서 시간이 지나면 배고픔이 줄어요 (캠프에선 안 줄어요). 0 이 되면 하트가 조금씩 줄어요(하트 1 칸 밑으로는 안 내려가요).
//   먹기: G (터치: 음식 버튼). 음식은 상인 가게(화살 · 물약 칸)에서 싸게 팔아요. 사과를 주우면 모두 +10.
//   0 일 때는 가만히 있어도 하트가 안 차요(survival.js 자동 회복을 막아요).
//   저장: profile.hunger (0~100), profile.food = { bread, meat, lunch } (개수)
// 같이 하기: 배고픔은 기기마다 자기 저장이에요(물약처럼). 친구 기기는 "배고파서 아픈 중"(starveHeld)·"먹었어요"(eatPressed)를 조작으로 보내고,
//   하트는 방장 기기가 모든 주인공(친구 포함)에게 같은 규칙으로 깎아요. 사과는 방장이 사건("food")으로 보내서 친구도 +10.

const HUNGER = {
  max: 100,
  drain: { hard: 100 / 480, nightmare: 100 / 360 }, // 1초에 줄어드는 양: 어려움 8분, 악몽 6분에 가득 -> 0
  low: 25,          // 이 밑이면 "배고파요" 알림
  hurtEvery: 2,     // 0 일 때 몇 초마다
  hurtFrac: 0.03,   // 최대 하트의 몇 %
  floor: 1,         // 배고픔으로는 하트가 이 밑으로 안 내려가요
  apple: 10,
  key: "KeyG", keyName: "G", touch: "TouchFood",
};
const FOODS = [
  { id: "bread", name: "빵", add: 30, price: 1, color: "#d8a050" },
  { id: "meat", name: "고기", add: 60, price: 2, color: "#c0603a" },
  { id: "lunch", name: "도시락", add: 100, price: 3, color: "#5fa0d0" },
];
const FOOD_MAX = 20; // 한 종류 최대 개수

function hungerOn() { const d = game.profile && game.profile.difficulty; return d === "hard" || d === "nightmare"; }
function hungerVal(pr = game.profile) { return pr && Number.isFinite(pr.hunger) ? Math.max(0, Math.min(HUNGER.max, pr.hunger)) : HUNGER.max; }
function hungerSet(v, pr = game.profile) { if (pr) pr.hunger = Math.max(0, Math.min(HUNGER.max, v)); }
function foodInv(pr = game.profile) { if (!pr) return {}; if (!pr.food || typeof pr.food !== "object" || Array.isArray(pr.food)) pr.food = {}; return pr.food; }
function foodCount(id, pr) { const n = foodInv(pr)[id]; return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; }
function foodTotal(pr) { return FOODS.reduce((s, f) => s + foodCount(f.id, pr), 0); }
function foodById(id) { return FOODS.find((f) => f.id === id) || null; }
function foodAdd(id, n = 1, pr) { if (!foodById(id) || !(n > 0)) return 0; const inv = foodInv(pr), had = foodCount(id, pr); inv[id] = Math.min(FOOD_MAX, had + Math.floor(n)); return inv[id] - had; }
function foodTake(id, pr) { const have = foodCount(id, pr); if (!have) return false; const inv = foodInv(pr); inv[id] = have - 1; if (!inv[id]) delete inv[id]; return true; }
// 무엇을 먹을까: 모자란 만큼을 채우는 가장 작은 음식, 없으면 가진 것 중 가장 큰 것 (아깝지 않게)
function foodPick(pr = game.profile) {
  const need = HUNGER.max - hungerVal(pr), have = FOODS.filter((f) => foodCount(f.id, pr) > 0);
  if (!have.length) return null;
  return have.find((f) => f.add >= need) || have[have.length - 1];
}
function hungerStarving(pr) { return hungerOn() && hungerVal(pr) <= 0; }
function hungerGuest() { return typeof netGuest === "function" && netGuest(); }

hookOn("profileLoaded", (pr) => {
  if (!Number.isFinite(pr.hunger)) pr.hunger = HUNGER.max;
  pr.hunger = Math.max(0, Math.min(HUNGER.max, pr.hunger));
  const inv = foodInv(pr);
  for (const k of Object.keys(inv)) if (!foodById(k) || !(Number.isFinite(inv[k]) && inv[k] > 0)) delete inv[k]; else inv[k] = Math.min(FOOD_MAX, Math.floor(inv[k]));
}, 50);

// ----- 줄어들기: 내 기기 저장만 (던전에서 세상이 움직일 때만) -----
let hungerWarnT = 0, hungerSaveT = 0;
function hungerPaused() {
  if (game.scene !== "dungeon" || game.result) return true;
  if (typeof netOn === "function" && netOn()) return !!(netplay.pzLeft > 0); // 같이 하기: 누가 창을 열어 다 같이 멈췄을 때만
  return !!game.overlay; // 혼자: 창을 열면 멈춰요
}
hookOn("timeScale", (dt) => {
  if (!hungerOn() || hungerPaused() || !(dt > 0)) return dt;
  const pr = game.profile, h0 = hungerVal(pr), h1 = Math.max(0, h0 - (HUNGER.drain[pr.difficulty] || 0) * dt);
  hungerSet(h1, pr);
  const p = game.player;
  if (p && h0 > HUNGER.low && h1 <= HUNGER.low) { showMessage(`배고파요! ${HUNGER.keyName} 로 먹어요`, 2.2, false, "#ffcf7a"); hungerWarnT = game.time; }
  if (p && h0 > 0 && h1 <= 0) showMessage("너무 배고파요! 하트가 줄어요. 얼른 먹어요", 2.6, false, "#ff9a7a");
  hungerSaveT -= dt; if (hungerSaveT <= 0) { hungerSaveT = 5; saveProfile(); }
  return dt;
}, 72);

// ----- 조작: 먹기 키 + 배고파서 아픈 중 (내 기기 주인공들) -----
if (typeof NP_INPUT_KEYS !== "undefined") { NP_INPUT_KEYS.add("starveHeld"); NP_INPUT_KEYS.add("eatPressed"); }
hookOn("playerInput", (inp, p) => {
  if (!inp || !p || p.remote) return inp; // 친구 주인공은 친구가 보낸 조작 그대로
  inp.starveHeld = hungerStarving();
  if (p === game.player && wasPressed(HUNGER.key, HUNGER.touch)) inp.eatPressed = hungerEat(p);
  return inp;
}, 61);
// 내 저장에서 꺼내 먹어요 (어느 기기든). 먹었으면 true
let hungerEatAt = -9;
function hungerEat(p) {
  // 조작은 한 장면에 여러 번 읽힐 수 있어요(친구 기기): 0.3초 안에 두 번은 안 먹어요
  if (game.time - hungerEatAt < 0.3 && game.time >= hungerEatAt) return false;
  if (!hungerOn()) { showMessage("배고픔은 어려움·악몽 난이도에서만 있어요", 1.6); return false; }
  if (!p || p.hp <= 0) return false;
  if (hungerVal() > HUNGER.max - 5) { showMessage("배가 불러요", 1); return false; }
  hungerEatAt = game.time;
  const f = foodPick();
  if (!f) { showMessage("먹을 게 없어요 (상인 가게에서 싸게 팔아요)", 1.6); if (typeof sfx !== "undefined" && sfx.denied) sfx.denied(); return false; }
  foodTake(f.id);
  hungerSet(hungerVal() + f.add);
  if (!hungerGuest()) hungerEatFx(p, f.name); // 친구 기기는 방장이 글자를 보내줘요 (두 번 안 보이게)
  saveProfile();
  return true;
}
function hungerEatFx(p, name) {
  addFloatText(p.x, p.y, name ? `냠냠 ${name}` : "냠냠", "#ffcf7a", 18);
  spawnBurst(p.x, p.y, ["#ffcf7a", "#ffffff", "#d8a050"], 8);
  if (typeof sfx !== "undefined" && sfx.apple) sfx.apple();
}

// ----- 하트 깎기: 방장(혼자) 기기가 모든 주인공에게 같은 규칙 -----
const hungerEatT = new Map();
hookOn("playerSkills", (p, inp, dt) => {
  if (!p || !inp || hungerGuest()) return;
  if (p.remote && inp.eatPressed) { // 친구가 먹었어요: 모두에게 보이게 (너무 자주는 안 받아요)
    const last = hungerEatT.get(p.pid);
    if (last === undefined || game.time - last > 0.4 || game.time < last) { hungerEatT.set(p.pid, game.time); hungerEatFx(p, ""); }
  }
  p.starving = game.scene === "dungeon" && !!inp.starveHeld;
  if (!p.starving || p.hp <= 0 || !(dt > 0)) { p.starveT = 0; return; }
  p.stillT = 0; // 배고프면 가만히 있어도 하트가 안 차요 (survival.js)
  p.starveT = (p.starveT || 0) + dt;
  if (p.starveT < HUNGER.hurtEvery) return;
  p.starveT -= HUNGER.hurtEvery;
  const floor = Math.min(p.maxHp, HUNGER.floor);
  if (p.hp <= floor) return;
  const lose = Math.min(p.hp - floor, Math.max(0.5, p.maxHp * HUNGER.hurtFrac));
  p.hp -= lose;
  addFloatText(p.x, p.y, "꼬르륵...", "#ffb070", 15);
}, 50);

// ----- 사과: 주운 사람 말고 모두 +10 (방장이 친구에게 "food" 사건으로) -----
hookOn("pickedUp", (item) => {
  if (!item || item.type !== "apple" || !hungerOn()) return;
  hungerSet(hungerVal() + HUNGER.apple);
  if (typeof netHosting === "function" && netHosting() && !netplay.replaying) netplay.events.push(["food", HUNGER.apple, 0]);
}, 50);
hookOn("netGuestEvent", (kind, args) => {
  if (kind !== "food") return false;
  const n = typeof args === "number" && Number.isFinite(args) ? Math.max(0, Math.min(HUNGER.apple, args)) : 0;
  if (n && hungerOn()) { hungerSet(hungerVal() + n); saveProfile(); }
  return true;
}, 50);

// ----- 가게: 음식 (싸게) -----
function shopFoodEntries() { return FOODS.map((f) => ({ kind: "food", id: f.id, item: { name: f.name, color: f.color, price: f.price } })); }
function shopFoodDesc(id) { const f = foodById(id); return `배고픔 +${f.add} · ${foodCount(id)}개 있음 · 어려움·악몽에서 ${HUNGER.keyName} 로 먹어요`; }
function shopBuyFood(id) {
  const f = foodById(id);
  if (foodCount(id) >= FOOD_MAX) return shopNote(`${josa(f.name, "은/는")} ${FOOD_MAX}개까지만 가질 수 있어요`, "#ddd");
  if (!pay({ cur: "emerald", n: f.price })) return notEnough(f.price);
  foodAdd(id, 1);
  saveProfile(); sfx.buy();
  return shopNote(`${josa(f.name, "을/를")} 샀어요! (${foodCount(id)}개)`, "#7dffb0");
}

// ----- 화면: 배고픔 막대 (구르기 막대 오른쪽) -----
hookOn("hudDraw", () => {
  const p = game.player;
  if (!p || !hungerOn() || (game.scene !== "dungeon" && game.scene !== "lobby")) return;
  const shown = Math.min(p.maxHp, 40);
  const y = 14 + Math.ceil(shown / 10) * 24 + 6 + 26 + 30; // 구르기 막대 줄 (hud.js)
  const x = 182, h = hungerVal(), k = h / HUNGER.max, low = h <= HUNGER.low;
  const blink = h <= 0 ? 0.5 + 0.5 * Math.sin(game.time * 8) : 1;
  ctx.fillStyle = "#3a3d44"; ctx.fillRect(x, y, 90, 8);
  ctx.fillStyle = low ? `rgba(255,120,80,${blink})` : "#ffcf7a"; ctx.fillRect(x, y, 90 * k, 8);
  const n = foodTotal();
  text(`배고픔${n ? ` · ${HUNGER.keyName} 먹기(${n})` : ""}`, x + 98, y + 9, 13, low ? "#ff9a7a" : "#ffcf7a");
}, 31);

// ----- 터치 버튼 (음식이 있거나 배고플 때, 어려움·악몽 던전) -----
hookOn("touchButtons", (list, s) => {
  if (game.scene !== "dungeon" || !game.player || !hungerOn()) return list;
  const editing = typeof btnEdit !== "undefined" && btnEdit.raw, n = foodTotal();
  if (!n && !editing) return list;
  const q = BTN_DEFAULTS[HUNGER.touch];
  list.push({ code: HUNGER.touch, icon: "food", label: `먹기 ${n}`, x: view.w - q[0] * s, y: view.h - q[1] * s, r: q[2] * s, color: "#d8a050", cd: 1 - hungerVal() / HUNGER.max });
  return list;
}, 44);

// 아이콘: 빵
if (typeof ICON_DEFS !== "undefined") ICON_DEFS.food = (g) => {
  g.disc(10, 10, 6.5, "y"); g.rect(4, 10, 16, 15, "y");
  g.line(7, 7, 8.5, 10, "b", 1.2); g.line(10.5, 6, 12, 9.5, "b", 1.2); g.line(13.5, 7, 14.5, 10, "b", 1.2);
};
// 버튼 설명 (메뉴 → 버튼 설명): 물약 줄 다음에
if (typeof HELP_COMMON !== "undefined") { const i = HELP_COMMON.findIndex((h) => h.icon === "pot_atk"); HELP_COMMON.splice(i >= 0 ? i + 1 : HELP_COMMON.length, 0, { icon: "food", name: "먹기", touch: "배고픔을 채워요 (어려움·악몽, 음식은 상인 가게)", key: "G" }); }
