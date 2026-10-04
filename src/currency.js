// ===== 화폐 5가지 =====
// 에메랄드 < 은 < 자수정 < 금 < 다이아몬드
// - 좋은 장비일수록 높은 화폐로만 살 수 있어요 (장비 등급 색 = 화폐 색: 은=파랑 희귀, 자수정=보라 영웅, 금=전설, 다이아=신화)
// - 높은 화폐는 낮은 물건 값으로도 써져요 (은 1 = 에메랄드 10)
// - 낮은 화폐를 모아 바로 위 화폐로 바꿀 수 있어요 (가게 "바꾸기"). 값의 1.5배를 내요: 높은 맵에 갈 이유가 남게
// - 맵 레벨이 높거나 보스를 잡으면 좋은 화폐가 나와요
// 에메랄드는 예전처럼 game.profile.emeralds, 나머지는 game.profile.money = { silver, amethyst, gold, diamond }

const CURRENCIES = [
  { id: "emerald", name: "에메랄드", value: 1, color: "#29d67a", dark: "#0b5a31" },
  { id: "silver", name: "은", value: 10, color: "#e4ebf2", dark: "#7c8794" },
  { id: "amethyst", name: "자수정", value: 50, color: "#b47cff", dark: "#5a2f9a" },
  { id: "gold", name: "금", value: 200, color: "#ffd23f", dark: "#9a6c10" },
  { id: "diamond", name: "다이아몬드", value: 1000, color: "#86f3ff", dark: "#1c8a99" },
];
const CUR = Object.fromEntries(CURRENCIES.map((c, i) => [c.id, { ...c, tier: i }]));
const CUR_ORDER = CURRENCIES.map((c) => c.id);
// 바꾸기: 낮은 화폐 n개 -> 바로 위 화폐 1개 (값의 1.5배, 올림)
const CUR_EXCHANGE = CURRENCIES.slice(1).map((c, i) => ({ from: CURRENCIES[i].id, to: c.id, n: Math.ceil(1.5 * c.value / CURRENCIES[i].value) }));
// 몇 번까지 바꿀 수 있나
function exchangeMax(i, pr = game.profile) { const x = CUR_EXCHANGE[i]; return x ? Math.floor(curHave(x.from, pr) / x.n) : 0; }
// times 번 바꾸기 (모자라면 안 바꿔요)
function exchangeCur(i, times = 1, pr = game.profile) {
  const x = CUR_EXCHANGE[i];
  times = Math.floor(times);
  if (!x || !(times > 0)) return { ok: false, why: "바꿀 수 없어요" };
  const need = x.n * times;
  if (curHave(x.from, pr) < need) return { ok: false, why: `${josa(CUR[x.from].name, "이/가")} ${need - curHave(x.from, pr)}개 모자라요` };
  curSet(x.from, curHave(x.from, pr) - need, pr);
  curSet(x.to, curHave(x.to, pr) + times, pr);
  return { ok: true, paid: need, got: times };
}
// 맵 레벨마다 나오는 화폐 (보스는 한 단계 위)
const CUR_MAP_LEVEL = { silver: 5, amethyst: 12, gold: 20 };

function moneyFields(pr) {
  const m = pr.money && typeof pr.money === "object" ? pr.money : {};
  pr.money = { silver: 0, amethyst: 0, gold: 0, diamond: 0 };
  for (const id of Object.keys(pr.money)) { const v = Math.floor(Number(m[id])); pr.money[id] = Number.isFinite(v) && v > 0 ? v : 0; }
  if (!Number.isFinite(pr.emeralds) || pr.emeralds < 0) pr.emeralds = 0;
}

function curHave(id, pr = game.profile) { return id === "emerald" ? pr.emeralds : (pr.money && pr.money[id]) || 0; }
function curSet(id, n, pr = game.profile) { n = Math.max(0, Math.floor(n)); if (id === "emerald") pr.emeralds = n; else pr.money[id] = n; }
// 화폐 더하기 (던전에서 얻으면 결과창에도)
function curAdd(id, n, pr = game.profile) {
  if (!CUR[id] || !(n > 0)) return;
  curSet(id, curHave(id, pr) + n, pr);
  if (pr === game.profile && game.run && game.scene === "dungeon" && id !== "emerald") { game.run.money = game.run.money || {}; game.run.money[id] = (game.run.money[id] || 0) + n; }
  if (id !== "emerald") game.coinBumpAt = { id, t: game.time };
}

// ----- 값 치르기 -----
// price = { cur: "silver", n: 3 }. 그 화폐가 모자라면 더 높은 화폐로 내고 거스름돈은 그 화폐로 받아요
function payPlan(price, pr = game.profile) {
  const req = CUR[price.cur]; if (!req) return null;
  let need = price.n;
  const take = {};
  const have = curHave(req.id, pr);
  take[req.id] = Math.min(have, need); need -= take[req.id];
  let change = 0;
  for (let t = req.tier + 1; t < CURRENCIES.length && need > 0; t++) {
    const c = CURRENCIES[t], k = c.value / req.value; // 높은 화폐 1개 = 낮은 화폐 k개
    const want = Math.ceil(need / k), got = Math.min(curHave(c.id, pr), want);
    if (got > 0) { take[c.id] = got; need -= got * k; }
  }
  if (need > 0) return null;
  change = -need; // 더 낸 만큼 돌려받아요
  return { take, change, cur: req.id };
}
function canPay(price, pr) { return !!payPlan(price, pr); }
function pay(price, pr = game.profile) {
  const plan = payPlan(price, pr); if (!plan) return false;
  for (const [id, n] of Object.entries(plan.take)) curSet(id, curHave(id, pr) - n, pr);
  if (plan.change) curSet(plan.cur, curHave(plan.cur, pr) + plan.change, pr);
  return true;
}
// 모자란 만큼 알려주기: "자수정 3개 모자라요"
function lackText(price, pr = game.profile) {
  const c = CUR[price.cur];
  return `${josa(c.name, "이/가")} ${Math.max(1, price.n - curHave(c.id, pr))}개 모자라요`;
}
function priceText(price) { return `${CUR[price.cur].name} ${price.n}`; }

// 맵 레벨에서 나오는 화폐 단계 (0 에메랄드, 1 은, 2 자수정, 3 금)
function mapCoinTier(L) { return L >= CUR_MAP_LEVEL.gold ? 3 : L >= CUR_MAP_LEVEL.amethyst ? 2 : L >= CUR_MAP_LEVEL.silver ? 1 : 0; }

// ----- 화폐 그림 -----
function drawCurrencyIcon(id, x, y, r) {
  const c = CUR[id] || CUR.emerald;
  if (id === "emerald") return drawEmeraldIcon(x, y, r);
  ctx.save();
  if (id === "silver" || id === "gold") { // 동전
    ctx.fillStyle = c.dark; ctx.beginPath(); ctx.arc(x, y + r * 0.12, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(x, y, r * 0.92, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.dark; ctx.lineWidth = Math.max(1, r * 0.16); ctx.beginPath(); ctx.arc(x, y, r * 0.58, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillRect(x - r * 0.45, y - r * 0.5, r * 0.22, r * 0.4);
  } else if (id === "amethyst") { // 보라 결정
    ctx.fillStyle = c.color; ctx.strokeStyle = c.dark; ctx.lineWidth = Math.max(1, r * 0.16);
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x + r * 0.75, y - r * 0.35); ctx.lineTo(x + r * 0.55, y + r); ctx.lineTo(x - r * 0.55, y + r); ctx.lineTo(x - r * 0.75, y - r * 0.35); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.moveTo(x - r * 0.15, y - r * 0.85); ctx.lineTo(x - r * 0.45, y - r * 0.3); ctx.lineTo(x - r * 0.2, y + r * 0.6); ctx.closePath(); ctx.fill();
  } else { // 다이아몬드: 위가 납작한 보석
    ctx.fillStyle = c.color; ctx.strokeStyle = c.dark; ctx.lineWidth = Math.max(1, r * 0.16);
    ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.75); ctx.lineTo(x + r * 0.6, y - r * 0.75); ctx.lineTo(x + r * 1.05, y - r * 0.2); ctx.lineTo(x, y + r * 1.05); ctx.lineTo(x - r * 1.05, y - r * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.beginPath(); ctx.moveTo(x - r * 1.0, y - r * 0.2); ctx.lineTo(x + r * 1.0, y - r * 0.2); ctx.moveTo(x - r * 0.3, y - r * 0.75); ctx.lineTo(x, y + r); ctx.stroke();
  }
  ctx.restore();
}
// 값 그리기: 그림 + 숫자 (오른쪽 정렬이면 x 가 오른쪽 끝)
function drawPrice(price, x, y, size = 16, align = "left", have = true) {
  const r = size * 0.5, color = have ? "#fff" : "#ff8080";
  ctx.font = `bold ${size}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  const w = ctx.measureText(String(price.n)).width;
  const left = align === "right" ? x - w - r * 2 - 6 : x;
  drawCurrencyIcon(price.cur, left + r, y - size * 0.35, r);
  text(String(price.n), left + r * 2 + 5, y, size, color);
  return left;
}

// ----- 떨어지는 화폐 (에메랄드처럼 저절로 날아와요: effects.js) -----
function dropCoin(id, x, y, n = 1) { for (let i = 0; i < n; i++) dropPickup("coin", x, y, { cur: id }); }
function coinIdOfTier(t) { return CUR_ORDER[Math.max(0, Math.min(CUR_ORDER.length - 1, t))]; }

// 보상 배수 (난이도·하드모드)에 맞춰 개수
function coinCount(base) { const k = typeof rewardFactor === "function" ? rewardFactor() : 1; const v = base * k; return Math.floor(v) + (Math.random() < v - Math.floor(v) ? 1 : 0); }

// 몬스터가 쓰러질 때 (보통 몬스터는 가끔, 정예는 자주, 보물 고블린은 많이)
function coinsForKill(m, L) {
  const T = mapCoinTier(L);
  if (m.boss || m.ally) return;
  if (m.def && m.def.treasure) { dropCoin(coinIdOfTier(Math.max(1, T)), m.x, m.y, 2 + coinCount(2)); if (Math.random() < 0.35) dropCoin(coinIdOfTier(Math.min(3, Math.max(1, T) + 1)), m.x, m.y, 1); return; }
  if (m.keyGuard) { dropCoin("amethyst", m.x, m.y, 1); if (T >= 1) dropCoin(coinIdOfTier(T), m.x, m.y, 1 + coinCount(1)); return; }
  if (m.elite) {
    // 정예는 꼭 화폐를 줘요: 맵 단계 화폐 1개 (낮은 맵은 가끔 은, 아니면 에메랄드 2개 더)
    if (T >= 1) dropCoin(coinIdOfTier(T), m.x, m.y, 1);
    else if (Math.random() < 0.2) dropCoin("silver", m.x, m.y, 1);
    else { dropPickup("emerald", m.x, m.y); dropPickup("emerald", m.x, m.y); }
    if (T >= 1 && Math.random() < 0.12) dropCoin(coinIdOfTier(Math.min(3, T + 1)), m.x, m.y, 1);
    return;
  }
  if (T >= 1 && Math.random() < 0.035) dropCoin(coinIdOfTier(T), m.x, m.y, 1);
}

// 상자
function coinsForChest(c, L) {
  const T = mapCoinTier(L);
  if (c.gold) {
    if (T >= 1) dropCoinsAt(c, coinIdOfTier(T), 1 + coinCount(1));
    else if (Math.random() < 0.5) dropCoinsAt(c, "silver", 1);
    if (T >= 1 && Math.random() < 0.3) dropCoinsAt(c, coinIdOfTier(Math.min(3, T + 1)), 1);
  } else if (T >= 1 && Math.random() < 0.35) dropCoinsAt(c, coinIdOfTier(T), 1);
}
function dropCoinsAt(c, id, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 1.2 + Math.random() * 1.6;
    pickups.push({ type: "coin", cur: id, x: c.x, y: c.y, z: 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 3 + Math.random() * 2, t: 0 });
  }
}

// 맵을 깨면 받는 화폐 (맵 단계 화폐 + 한 단계 아래 조금). 처음 깨면 1.5배
function stageCoins(L, firstClear) {
  const T = mapCoinTier(L), out = {};
  const k = (typeof rewardFactor === "function" ? rewardFactor() : 1) * (firstClear ? 1.5 : 1);
  if (T >= 1) {
    const start = [0, CUR_MAP_LEVEL.silver, CUR_MAP_LEVEL.amethyst, CUR_MAP_LEVEL.gold][T];
    out[coinIdOfTier(T)] = Math.max(1, Math.round(Math.min(6, 2 + Math.floor((L - start) / 4)) * k));
    if (T >= 2) out[coinIdOfTier(T - 1)] = Math.max(1, Math.round(2 * k));
  }
  return out;
}

// 보스방 보스: 한 단계 위 화폐 + 금 1개, 다이아몬드는 처음 잡을 때·높은 난이도에서
function bossCoins(L, first) {
  const T = mapCoinTier(L), out = {};
  const up = Math.min(3, T + 1);
  out[coinIdOfTier(up)] = (out[coinIdOfTier(up)] || 0) + 2 + coinCount(1);
  out.gold = (out.gold || 0) + 1;
  const d = game.profile.difficulty;
  const dChance = { easy: 0.05, normal: 0.1, hard: 0.25, nightmare: 1 }[d] || 0.1;
  let dia = first ? 1 : 0;
  if (Math.random() < dChance + (L >= 30 ? 0.15 : 0)) dia++;
  if (dia) out.diamond = dia;
  return out;
}

// ----- 예전 부품 -> 화폐로 바꾸기 (한 번만) -----
// 낡은 조각: 에메랄드 3 · 철 조각 3개: 은 1 · 다이아 조각 3개: 자수정 1 · 흑요석 3개, 용비늘 2개, 별가루 1.5개: 금 1
const OLD_MAT_RATE = { scrap: ["emerald", 1 / 3], iron: ["silver", 3], diamond: ["amethyst", 3], obsidian: ["gold", 3], dragon: ["gold", 2], star: ["gold", 1.5] };
function convertOldMaterials(pr) {
  if (pr.matsConverted) return null;
  const mats = pr.materials || {};
  const got = {};
  for (const [mid, [cid, per]] of Object.entries(OLD_MAT_RATE)) {
    const have = Math.floor(Number(mats[mid]) || 0); if (have <= 0) continue;
    let coins, rest = 0;
    if (per < 1) coins = Math.round(have / per);
    else { coins = Math.floor(have / per); rest = have - coins * per; }
    if (coins > 0) got[cid] = (got[cid] || 0) + coins;
    // 남은 부품은 한 단계 아래 화폐로
    if (rest > 0) { const lower = coinIdOfTier(CUR[cid].tier - 1); const v = Math.round(rest / per * CUR[cid].value / CUR[lower].value); if (v > 0) got[lower] = (got[lower] || 0) + v; }
    delete mats[mid];
  }
  for (const [id, n] of Object.entries(got)) curSet(id, curHave(id, pr) + n, pr);
  pr.matsConverted = true;
  return got;
}

hookOn("profileLoaded", (pr) => {
  moneyFields(pr);
  const got = convertOldMaterials(pr);
  if (got && Object.keys(got).length) pr.convertNote = "예전 부품이 화폐로 바뀌었어요: " + Object.entries(got).map(([id, n]) => `${CUR[id].name} ${n}`).join(", ");
}, 12);
