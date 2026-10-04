// ===== 함께 쌓는 기록 (방장과 친구는 차이가 없어요) =====
// 던전에서 내 저장에 남는 기록(깬 맵·최고 레벨·통계·트로피·도감·보스 첫 보상·모험 기록·탑 정복…)은 모두 recShared(종류, 내용)로 남겨요.
//   혼자: 바로 내 저장에.  같이 하기 방장: 내 저장에 + 친구들에게 같은 기록을 보내요(친구 기기가 자기 저장에 똑같이 남겨요).
//   pid 를 주면 그 주인공 한 명의 기록이에요 (쓰러진 이유): 그 사람 기기에서만 남겨요.
// 화폐·장비·경험치는 다른 길로 가요 (netplay.js netRewardDelta, "xp" 사건). 여기에는 "기록" 만.

function recDiff() { return (game.profile && game.profile.difficulty) || "normal"; }
function recMapOk(id) { return typeof id === "string" && id.length < 40 && (MAPS.some((m) => m.id === id) || (typeof BOSS_DEFS !== "undefined" && Object.hasOwn(BOSS_DEFS, id))); }
function recMonOk(t) { return typeof t === "string" && Object.hasOwn(MONSTERS, t); }
const recNum = (v, lo, hi) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo; };

// 탑 정복 횟수 (새 칸 pr.crowns[id] 와 예전 칸 towerCrown·seaTowerCrown 중 큰 것)
function towerCrownCount(id, pr = game.profile) {
  if (!pr) return 0;
  const legacy = id === "tower" ? pr.towerCrown : id === "seatower" ? pr.seaTowerCrown : 0;
  const n = pr.crowns && Number.isFinite(pr.crowns[id]) ? pr.crowns[id] : 0;
  return Math.max(n, Number.isFinite(legacy) ? legacy : 0);
}

const REC_APPLY = {
  // 몬스터 처치 (팀 처치 수) + 도감 잡은 수
  kill(d, pr) {
    pr.stats.kills = (pr.stats.kills || 0) + 1;
    const c = pr.codex;
    if (c && !d.skip && recMonOk(d.type)) { c.seen[d.type] = true; c.killed[d.type] = (c.killed[d.type] || 0) + 1; }
  },
  // 도감: 가까이서 본 몬스터 (내 도감에 처음이면 "도감에 추가!")
  seen(d, pr) {
    const c = pr.codex;
    if (!c || !recMonOk(d.type) || c.seen[d.type]) return;
    c.seen[d.type] = true;
    if (typeof codexSeenToast === "function") codexSeenToast(MONSTERS[d.type].name);
  },
  affix(d, pr) {
    const c = pr.codex;
    if (!c || typeof d.id !== "string" || typeof ELITE_AFFIXES === "undefined" || !Object.hasOwn(ELITE_AFFIXES, d.id) || c.affix[d.id]) return;
    c.affix[d.id] = true;
    if (typeof codexSeenToast === "function") codexSeenToast(`정예 속성 ${ELITE_AFFIXES[d.id].name}`);
  },
  chest(d, pr) { pr.stats.chests = (pr.stats.chests || 0) + 1; },
  // 보스방 열쇠 (다음에 이 맵에 오면 문 앞에서 시작)
  key(d, pr) { if (recMapOk(d.map)) { pr.keys = pr.keys || {}; pr.keys[d.map] = true; } },
  // 보스방에 들어감 (모험 기록: 도전 수)
  bossTry(d, pr) { if (recMapOk(d.map) && typeof qolRecBossTry === "function") qolRecBossTry(d.map, typeof d.name === "string" ? d.name.slice(0, 24) : null, !!d.retry); },
  // 보스를 쓰러뜨림: 통계·열쇠 씀·트로피(횟수·가장 빠른 시간)·도감 보스·모험 기록
  bossWin(d, pr) {
    if (!recMapOk(d.map)) return;
    pr.stats.bosses = (pr.stats.bosses || 0) + 1;
    if (pr.keys) delete pr.keys[d.map];
    const sec = recNum(d.sec, 0, 36000);
    pr.trophies = pr.trophies || {};
    const t = pr.trophies[d.map] || (pr.trophies[d.map] = { wins: 0, best: 0 });
    t.wins++;
    if (sec > 0 && (!t.best || sec < t.best)) t.best = sec;
    if (pr.codex && pr.codex.bossSeen) pr.codex.bossSeen[d.map] = true;
    if (typeof qolRecBossWin === "function") qolRecBossWin(d.map, sec);
  },
  // 보스 첫 보상·전설 받은 수 (다음 보상 계산에 써요)
  bossLoot(d, pr) {
    if (!recMapOk(d.map)) return;
    pr.bossFirst = pr.bossFirst || {}; pr.bossFirst[`${d.map}:${recDiff()}`] = true;
    if (d.legend) { pr.legends = pr.legends || {}; pr.legends[d.map] = (pr.legends[d.map] || 0) + 1; }
  },
  // 맵 클리어: 깬 맵·최고 레벨·첫 클리어·통계·모험 기록
  clear(d, pr) {
    if (!recMapOk(d.map)) return;
    const L = Math.round(recNum(d.level, 1, 9999));
    pr.firstClears[`${d.map}:${recDiff()}`] = true;
    pr.stats.clears = (pr.stats.clears || 0) + 1;
    if (!pr.cleared.includes(d.map)) pr.cleared.push(d.map);
    if (L > (pr.best[d.map] || 0)) pr.best[d.map] = L;
    if (d.dungeon && typeof qolRecClear === "function") qolRecClear(d.map, recNum(d.runSec, 0, 36000));
  },
  // 다 같이 쓰러짐 (혼자 할 때 쓰러진 것과 같아요. 같이 할 때 한 명만 쓰러지면 친구가 부활시켜 줘서 안 세요)
  lose(d, pr) { pr.stats.deaths = (pr.stats.deaths || 0) + 1; },
  keyLost(d, pr) { if (recMapOk(d.map) && pr.keys) delete pr.keys[d.map]; },
  // 탑: 깬 층(최고 층), 꼭대기 정복
  tower(d, pr) { const def = MAPS.find((m) => m.id === d.id && m.type === "tower"); if (def && typeof towerSetBest === "function") towerSetBest(def, Math.round(recNum(d.floor, 0, def.floors || 999))); },
  // 탑 꼭대기 정복: 모든 탑을 pr.crowns[탑 id] 에 (예전 칸 towerCrown·seaTowerCrown 도 같이 올려서 예전 코드·저장이 그대로 돌아요)
  crown(d, pr) {
    if (typeof d.id !== "string" || !MAPS.some((m) => m.id === d.id && m.type === "tower")) return;
    pr.crowns = pr.crowns && typeof pr.crowns === "object" ? pr.crowns : {};
    pr.crowns[d.id] = towerCrownCount(d.id, pr) + 1;
    if (d.id === "tower") pr.towerCrown = pr.crowns[d.id];
    else if (d.id === "seatower") pr.seaTowerCrown = pr.crowns[d.id];
  },
  // 모험 기록(아빠 보고서): 열쇠 단계 시간, 보스 단계
  keyStep(d, pr) { if (recMapOk(d.map) && typeof d.step === "string" && typeof qolRecKeyStep === "function") qolRecKeyStep(d.map, d.step.slice(0, 20), recNum(d.sec, 0, 36000)); },
  downCause(d, pr) { if ((d.map === null || recMapOk(d.map)) && typeof d.cause === "string" && typeof qolRecDown === "function") qolRecDown(d.map, d.cause); },
  // 내 주인공이 맞은 것 (안내·결과창의 쓰러진 이유). 기록은 아니지만 그 사람에게만 가는 같은 길을 써요
  hurtInfo(d, pr) {
    if (typeof guideApplyHit !== "function") return;
    const s = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, "").slice(0, n) : null);
    const id = typeof d.id === "string" && typeof ABILITIES !== "undefined" && Object.hasOwn(ABILITIES, d.id) ? d.id : null;
    guideApplyHit({ id, name: s(d.name, 30) || "?", tip: s(d.tip, 80), by: s(d.by, 30), damage: recNum(d.damage, 0, 9999), dead: !!d.dead });
  },
  bossPhase(d, pr) { if (recMapOk(d.map) && typeof qolRecBossPhase === "function") qolRecBossPhase(d.map, Math.round(recNum(d.phase, 0, 9))); },
};
const REC_SAVE_NOW = new Set(["key", "keyLost", "bossWin", "bossLoot", "clear", "lose", "crown", "tower"]);

// 기록 남기기. opts.pid: 그 주인공 한 명의 기록 (방장 기기의 친구 주인공이면 친구에게만)
function recShared(kind, d = {}, opts = {}) {
  const fn = REC_APPLY[kind];
  if (!fn || !game.profile) return;
  const host = typeof netHosting === "function" && netHosting();
  const mine = opts.pid === undefined || !game.player || opts.pid === (game.player.pid || 1);
  if (mine) { fn(d, game.profile); if (REC_SAVE_NOW.has(kind)) saveProfile(); }
  if (host && typeof netplay !== "undefined" && netplay.events.length < 200) netplay.events.push(["rec", netEnc([kind, d, opts.pid === undefined ? 0 : opts.pid], 1), 0]);
}
// 친구 기기: 방장이 보낸 기록을 내 저장에
function recFromHost(args) {
  const a = netDec(args);
  if (!Array.isArray(a)) return;
  const [kind, d, pid] = a;
  if (typeof kind !== "string" || !Object.hasOwn(REC_APPLY, kind) || !d || typeof d !== "object") return;
  if (pid && pid !== netplay.slot) return; // 다른 친구 한 명의 기록
  REC_APPLY[kind](d, game.profile);
  if (REC_SAVE_NOW.has(kind)) saveProfile(); else if (kind !== "hurtInfo") netplay.saveT = Math.min(netplay.saveT || 9, 2);
}

// 쓰러진 이유(모험 기록)는 그 사람 것: qol.js 가 친구 주인공이면 recShared("downCause", …, { pid }) 로 그 친구에게만 보내요
