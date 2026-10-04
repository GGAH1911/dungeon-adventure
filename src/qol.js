// ===== 편의 기능 =====
// 1) 플레이 기록 (보스·맵·하루 플레이 시간) + 기록 복사
// 2) 저장 코드 복사/붙여넣기 (다른 기기로 옮기기, 실수로 지워도 되살리기)
// 3) FPS 보기, 효과 개수 상한 (CONFIG.limits)
// 4) 추천 강화 / 추천 맵·레벨 (lobbyui.js, mapselect.js 가 qolRecommend... 를 불러요)
// 5) 열쇠를 찾으면 보스방 문으로 가는 빛 포털 + 금색 발자국
// 게임 함수는 감싸지 않고 hooks.js 알림 지점만 써요.

const QOL_LOG_VERSION = 1;
const QOL_MAX_CAUSES = 12;   // 보스마다 기억할 "쓰러뜨린 공격" 종류 수
const QOL_DAYS = 14;         // 하루별 플레이 시간을 기억할 날 수

// ----- 저장 필드 기본값 -----
function qolEmptyLog() {
  return { v: QOL_LOG_VERSION, playSec: 0, days: {}, bosses: {}, maps: {}, deathsOther: {} };
}
hookOn("profileLoaded", (pr) => {
  if (!pr.log || typeof pr.log !== "object") pr.log = qolEmptyLog();
  const L = pr.log;
  L.days = L.days || {}; L.bosses = L.bosses || {}; L.maps = L.maps || {}; L.deathsOther = L.deathsOther || {};
  L.playSec = L.playSec || 0;
  pr.qol = Object.assign({ showFps: false }, pr.qol || {});
}, 10);

function qolLog() {
  const pr = game.profile;
  if (!pr.log) pr.log = qolEmptyLog();
  return pr.log;
}
function qolBossRec(mapId) {
  const B = qolLog().bosses;
  return (B[mapId] = B[mapId] || { tries: 0, wins: 0, deaths: 0, best: 0, last: 0, maxPhase: 0, causes: {} });
}
function qolMapRec(mapId) {
  const M = qolLog().maps;
  return (M[mapId] = M[mapId] || { runs: 0, clears: 0, bestClear: 0, lastClear: 0, retries: 0, keyTimes: {}, diffs: {} });
}
function qolToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function qolTrimDays(days) {
  const keys = Object.keys(days).sort();
  while (keys.length > QOL_DAYS) delete days[keys.shift()];
}
function qolAddCause(obj, key) {
  obj[key] = (obj[key] || 0) + 1;
  const keys = Object.keys(obj);
  if (keys.length > QOL_MAX_CAUSES) {
    keys.sort((a, b) => obj[a] - obj[b]);
    delete obj[keys[0] === key ? keys[1] : keys[0]];
  }
}
const qolRound = (x) => Math.round(x * 10) / 10;

// ----- 지금 이 판의 기록 상태 -----
const qolRun = { mapId: null, t: 0, stepIndex: 0, stepT: 0, inBoss: false, bossT: 0, hadKey: false, castId: null, lastFrame: 0 };

hookOn("dungeonStarted", (def, level) => {
  if (game.mode !== "dungeon") { qolRun.mapId = null; return; }
  const kh = game.keyhunt;
  qolRun.mapId = def.id; qolRun.bossTries = 0; qolRun.won = false; qolRun.t = 0; qolRun.stepT = 0; qolRun.inBoss = false; qolRun.bossT = 0;
  qolRun.stepIndex = kh ? kh.index : 0;
  qolRun.hadKey = !!(kh && kh.hasKey);
  const r = qolMapRec(def.id);
  r.runs++;
  // 지난번에 찾은 열쇠가 있으면: 시작하자마자 문으로 가는 포털
  qolClearPortal();
  if (kh && kh.hasKey && kh.door) qolMakePortal(game.player.x + 1.2, game.player.y + 0.4);
}, 60);

// 기술이 효과를 내는 동안 어떤 기술인지 기억해요 (주인공이 그 기술에 쓰러지면 기록)
hookOn("resolveCast", (c) => { qolRun.castId = c.id; return false; }, 0);
hookOn("castResolved", () => { qolRun.castId = null; }, 99);

function qolCauseName(from, p) {
  // 안내(guide.js)가 이번에 기록한 쓰러진 이유가 있으면 같은 이름을 써요 (화면 표시와 기록이 같게). 친구 주인공 것은 친구 기기에 있어요
  const g = typeof guideDeathCause === "function" && !(p && p.remote) ? guideDeathCause() : null;
  if (g && g.name && p && p.hp <= 0) return g.name;
  if (qolRun.castId && ABILITIES[qolRun.castId]) return ABILITIES[qolRun.castId].name;
  if (from && from.def) return `${from.def.name || from.type} 공격`;
  return "바닥 장판·탄";
}

hookOn("playerHurt", (p, damage, from, hp0) => {
  if (!(hp0 > 0 && p.hp <= 0)) return;
  const kh = game.keyhunt;
  const cause = qolCauseName(from, p);
  const boss = game.mode === "dungeon" && kh && kh.inBoss && qolRun.mapId ? qolRun.mapId : null;
  if (p.remote) recShared("downCause", { map: boss, cause }, { pid: p.pid }); // 친구 주인공: 친구 기록에 (records.js)
  else qolRecDown(boss, cause);
}, 60);
// 쓰러진 이유 기록 (보스방이면 그 보스 기록에)
function qolRecDown(mapId, cause) {
  cause = String(cause || "").slice(0, 24) || "?";
  if (mapId) { const b = qolBossRec(mapId); b.deaths++; qolAddCause(b.causes, cause); }
  else qolAddCause(qolLog().deathsOther, cause);
}

// 이긴 판 (보스방 쪽에서 막지 않고 통과한 endRun(true))
hookOn("endRun", (win) => {
  const kh = game.keyhunt;
  if (!win || !kh || !kh.bossWon || !qolRun.mapId || qolRun.won) return false;
  qolRun.won = true; // 기록은 보스를 쓰러뜨릴 때("bossWin")·맵을 깰 때("clear") records.js 가 남겨요 (친구 저장에도)
  return false;
}, 60);
// ----- 모험 기록 남기기 (records.js 가 불러요: 방장·친구 기기 모두 같은 식으로) -----
function qolRecBossWin(mapId, sec) {
  const b = qolBossRec(mapId);
  b.wins++;
  b.last = qolRound(sec);
  if (!b.best || b.last < b.best) b.best = b.last;
  b.maxPhase = Math.max(b.maxPhase, 3);
}
function qolRecClear(mapId, runSec) {
  const m = qolMapRec(mapId);
  m.clears++;
  m.lastClear = qolRound(runSec);
  if (!m.bestClear || m.lastClear < m.bestClear) m.bestClear = m.lastClear;
  const d = (game.profile && game.profile.difficulty) || "normal";
  m.diffs[d] = (m.diffs[d] || 0) + 1;
}
function qolRecBossTry(mapId, name, retry) {
  const b = qolBossRec(mapId);
  b.tries++;
  if (name) b.name = name;
  if (retry) qolMapRec(mapId).retries++;
}
function qolRecKeyStep(mapId, step, sec) {
  const kt = qolMapRec(mapId).keyTimes;
  const rec = (kt[step] = kt[step] || { best: 0, last: 0, n: 0 });
  rec.last = qolRound(sec); rec.n++;
  if (!rec.best || rec.last < rec.best) rec.best = rec.last;
}
function qolRecBossPhase(mapId, phase) { const b = qolBossRec(mapId); b.maxPhase = Math.max(b.maxPhase, phase); }

function qolBossPhase(boss) {
  for (const k of ["phaseIndex", "phase", "phaseIdx"]) if (typeof boss[k] === "number") return boss[k];
  const f = boss.hp / (boss.maxHp || 1);
  return f > 0.66 ? 0 : f > 0.33 ? 1 : 2;
}

hookOn("dungeonTick", (dt) => {
  const kh = game.keyhunt;
  if (game.mode !== "dungeon" || !kh || !qolRun.mapId || game.result) return;
  qolRun.t += dt;
  // 열쇠 찾기 도전 시간 (도전 하나를 깰 때마다)
  if (kh.index !== qolRun.stepIndex) {
    const id = kh.steps[qolRun.stepIndex];
    if (id && kh.index > qolRun.stepIndex) recShared("keyStep", { map: qolRun.mapId, step: id, sec: qolRun.stepT });
    qolRun.stepIndex = kh.index; qolRun.stepT = 0;
  } else if (!kh.hasKey) qolRun.stepT += dt;
  // 보스방 들어감 / 나옴(다시 도전)
  if (kh.inBoss && !qolRun.inBoss) {
    qolRun.inBoss = true; qolRun.bossT = 0; qolRun.won = false; qolRun.phaseSent = 0;
    recShared("bossTry", { map: qolRun.mapId, name: kh.boss && kh.boss.name, retry: qolRun.bossTries > 0 });
    qolRun.bossTries = (qolRun.bossTries || 0) + 1;
    qolClearPortal();
  } else if (!kh.inBoss && qolRun.inBoss) {
    qolRun.inBoss = false;
  }
  if (kh.inBoss && kh.boss) {
    qolRun.bossT += dt;
    const ph = qolBossPhase(kh.boss) + 1;
    if (ph > (qolRun.phaseSent || 0)) { qolRun.phaseSent = ph; recShared("bossPhase", { map: qolRun.mapId, phase: ph }); }
  }
  // 열쇠를 막 주웠어요 -> 문으로 가는 포털 + 발자국
  if (kh.hasKey && !qolRun.hadKey && !kh.inBoss) {
    const p = (kh.keyBy && allPlayers().find((q) => (q.pid || 1) === kh.keyBy)) || game.player; // 열쇠를 주운 사람 옆에
    qolMakePortal(p.x, p.y);
  }
  qolRun.hadKey = kh.hasKey;
  qolUpdatePortal(dt);
}, 60);

// ----- 플레이 시간 + FPS + 효과 상한 (그릴 때마다) -----
const qolFps = { frames: 0, acc: 0, value: 0 };
hookOn("hudDraw", () => {
  const now = performance.now();
  const dt = qolRun.lastFrame ? Math.min(0.5, (now - qolRun.lastFrame) / 1000) : 0;
  qolRun.lastFrame = now;
  const pr = game.profile;
  if (pr && dt > 0 && (game.scene === "lobby" || game.scene === "dungeon")) {
    const L = qolLog();
    L.playSec += dt;
    const k = qolToday();
    if (!L.days[k]) { L.days[k] = 0; qolTrimDays(L.days); }
    L.days[k] += dt;
  }
  qolFps.frames++; qolFps.acc += dt;
  if (qolFps.acc >= 1) { qolFps.value = qolFps.frames / qolFps.acc; qolFps.frames = 0; qolFps.acc = 0; }
  qolApplyLimits();
  if (pr && pr.qol && pr.qol.showFps) qolDrawFps();
}, 90);

function qolDrawFps() {
  const scale = typeof renderScale === "function" ? renderScale() : 1;
  const s = `FPS ${Math.round(qolFps.value)} · 화질 ${scale}x`;
  // hudDraw 는 UI 크기(900x540 기준)로 그려져요. 위쪽 가운데 (하트·미니맵과 안 겹치게)
  const x = view.w / 2;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x - 72, 4, 144, 20);
  ctx.restore();
  text(s, x, 19, 13, qolFps.value < 30 ? "#ff8080" : "#7dffb0", "center");
}

function qolTrim(arr, max) {
  if (arr && arr.length > max) arr.splice(0, arr.length - max); // 오래된 것부터
}
function qolApplyLimits() {
  const L = CONFIG.limits;
  if (!L) return;
  qolTrim(particles, L.particles);
  qolTrim(floatTexts, L.floatTexts);
  qolTrim(arrows, L.projectiles);
  if (typeof sparkles !== "undefined") qolTrim(sparkles, L.sparkles);
  if (typeof zones !== "undefined") qolTrim(zones, L.zones);
  if (typeof hazards !== "undefined") qolTrim(hazards, L.zones);
  if (typeof impacts !== "undefined") qolTrim(impacts, L.impacts);
}

// ===== 기록 요약 (기록판 "기록 복사") =====
function qolCauseTop(causes, n = 3) {
  return Object.entries(causes || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
}
function qolAllBossCauses() {
  const all = {};
  for (const b of Object.values(qolLog().bosses)) for (const [k, v] of Object.entries(b.causes || {})) all[k] = (all[k] || 0) + v;
  return all;
}
function qolSummary() {
  const pr = game.profile, L = qolLog();
  const bosses = {};
  for (const [id, b] of Object.entries(L.bosses)) {
    const def = typeof BOSS_DEFS !== "undefined" && BOSS_DEFS[id];
    bosses[id] = { name: b.name || (def ? def.name : id), tries: b.tries, wins: b.wins, deaths: b.deaths, bestSec: b.best, lastSec: b.last, maxPhase: b.maxPhase, killedBy: Object.fromEntries(qolCauseTop(b.causes, QOL_MAX_CAUSES)) };
  }
  const maps = {};
  for (const [id, m] of Object.entries(L.maps)) {
    maps[id] = { runs: m.runs, clears: m.clears, bestClearSec: m.bestClear, lastClearSec: m.lastClear, bossRetries: m.retries, keySec: Object.fromEntries(Object.entries(m.keyTimes).map(([k, v]) => [k, { best: v.best, last: v.last, n: v.n }])), clearsByDifficulty: m.diffs };
  }
  return {
    game: "dungeon-adventure", logVersion: QOL_LOG_VERSION, date: new Date().toISOString().slice(0, 10),
    level: pr.level, difficulty: pr.difficulty, hardMode: !!pr.hardMode,
    gear: Object.fromEntries(EQ_SLOTS.map((s) => { const it = pr.eq && pr.eq[s.id]; return [s.id, it ? `${itemName(it)} ${RARITIES[it.r].name} Lv${it.l} +${it.p || 0}` : null]; })),
    money: { emerald: pr.emeralds, ...(pr.money || {}) }, bag: (pr.bag || []).length,
    playMinutes: Math.round(L.playSec / 60),
    minutesByDay: Object.fromEntries(Object.entries(L.days).map(([k, v]) => [k, Math.round(v / 60)])),
    stats: pr.stats, bosses, maps,
    deathsOutsideBoss: L.deathsOther,
  };
}

// ===== 글 상자 (복사용 보여주기 / 붙여넣기 입력) =====
// 터치 키보드가 뜨도록 진짜 HTML 입력창을 써요 (cheat.js 와 같은 방식)
const qolBox = document.createElement("div");
qolBox.innerHTML = '<div class="t"></div><textarea autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea><div class="m"></div><div class="b"><button data-act="ok">확인</button><button data-act="cancel">닫기</button></div>';
Object.assign(qolBox.style, {
  position: "fixed", left: "50%", top: "10%", transform: "translateX(-50%)", width: "min(92vw, 560px)",
  display: "none", flexDirection: "column", gap: "10px",
  background: "rgba(10,10,20,0.92)", border: "2px solid #ffe27a", borderRadius: "12px",
  padding: "14px 16px", color: "#ffe27a", zIndex: 10,
  font: 'bold 17px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
});
document.body.appendChild(qolBox);
const qolBoxText = qolBox.querySelector("textarea");
const qolBoxTitle = qolBox.querySelector(".t");
const qolBoxMsg = qolBox.querySelector(".m");
Object.assign(qolBoxText.style || {}, {
  font: '14px ui-monospace, Menlo, monospace', height: "34vh", resize: "none",
  background: "#111", color: "#fff", border: "1px solid #555", borderRadius: "6px", padding: "8px", outline: "none",
});
if (qolBoxMsg.style) Object.assign(qolBoxMsg.style, { color: "#ddd", font: '14px "Apple SD Gothic Neo", sans-serif' });
let qolBoxOk = null;
for (const b of qolBox.querySelectorAll("button")) {
  Object.assign(b.style, {
    font: 'bold 17px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', padding: "8px 16px", marginRight: "10px",
    borderRadius: "8px", border: "none", cursor: "pointer", background: b.dataset.act === "ok" ? "#3fbf6f" : "#555", color: "#fff",
  });
  b.addEventListener("click", (e) => {
    e.preventDefault();
    if (b.dataset.act === "ok" && qolBoxOk) qolBoxOk(qolBoxText.value); else qolCloseBox();
  });
}
qolBoxText.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") qolCloseBox(); });

let qolBoxOpen = false;
function qolOpenBox({ title, value = "", message = "", readOnly = false, okLabel = "확인", onOk = null }) {
  qolBoxOpen = true;
  for (const k in keys) keys[k] = false;
  cheatOpen = true; // 입력 중엔 게임 조작을 멈춰요 (input.js 가 이 값을 봐요)
  game.overlay = null;
  qolBoxTitle.textContent = title;
  qolBoxMsg.textContent = message;
  qolBoxText.value = value;
  qolBoxText.readOnly = readOnly;
  const ok = qolBox.querySelector('[data-act="ok"]');
  ok.textContent = okLabel; ok.style.display = onOk ? "" : "none";
  qolBoxOk = onOk;
  qolBox.style.display = "flex";
  if (readOnly) { qolBoxText.focus(); qolBoxText.select && qolBoxText.select(); } else qolBoxText.focus();
}
function qolCloseBox() {
  qolBoxOpen = false;
  cheatOpen = false;
  qolBoxOk = null;
  qolBox.style.display = "none";
  qolBoxText.blur && qolBoxText.blur();
}

// 클립보드에 복사, 안 되면 글 상자에 보여주기
function qolCopy(textValue, title, okMsg) {
  const fallback = () => qolOpenBox({ title, value: textValue, readOnly: true, message: "자동 복사가 안 됐어요. 글을 길게 눌러 모두 선택해서 복사하세요." });
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textValue).then(() => showMessage(okMsg, 2.5, false, "#7dffb0"), fallback);
      return;
    }
  } catch (e) { /* 아래로 */ }
  fallback();
}

// ===== 저장 코드 =====
// 모양: DA1-<검사합 6자리>-<base64(JSON)>
function qolChecksum(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).padStart(6, "0").slice(-6);
}
function qolB64Encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function qolB64Decode(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function makeSaveCode(profile = game.profile) {
  const b64 = qolB64Encode(JSON.stringify(profile));
  return `DA1-${qolChecksum(b64)}-${b64}`;
}
// 잘못된 코드면 { error: "친절한 문구" }
function parseSaveCode(code) {
  const s = String(code || "").replace(/\s+/g, "");
  if (!s) return { error: "코드가 비어 있어요. 복사한 저장 코드를 붙여넣어 주세요." };
  const m = s.match(/^DA1-([0-9a-z]{6})-([A-Za-z0-9+/=]+)$/);
  if (!m) return { error: "저장 코드 모양이 아니에요. 'DA1-' 로 시작하는 코드 전체를 붙여넣어 주세요." };
  if (qolChecksum(m[2]) !== m[1]) return { error: "코드 일부가 빠졌거나 바뀌었어요. 처음부터 끝까지 다시 복사해 주세요." };
  try {
    const data = JSON.parse(qolB64Decode(m[2]));
    if (!data || typeof data !== "object" || !data.level) return { error: "이 코드에는 저장 내용이 없어요." };
    return { data };
  } catch (e) {
    return { error: "코드를 읽을 수 없어요. 다시 복사해 주세요." };
  }
}
function applySaveData(data) {
  try { localStorage.setItem(SAVE_KEY + "-backup-before-code", JSON.stringify(game.profile)); } catch (e) { /* 백업 실패는 무시 */ }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* 아래 loadProfile 이 처리 */ }
  game.profile = loadProfile(); // 예전 버전 저장이어도 바꿔줘요
  saveProfile();
  if (typeof refreshGear === "function") refreshGear();
  enterLobby("저장을 불러왔어요!");
}

function copySaveCode() {
  saveProfile();
  qolCopy(makeSaveCode(), "저장 코드 (다른 기기에서 '저장 코드 붙여넣기')", "저장 코드를 복사했어요! 메모장 등에 붙여넣어 보관하세요");
}

let qolPending = null; // 불러올까요? 확인 화면
function pasteSaveCode() {
  qolOpenBox({
    title: "저장 코드 붙여넣기", okLabel: "불러오기",
    message: "복사해 둔 저장 코드(DA1-...)를 붙여넣고 '불러오기'를 누르세요.",
    onOk: (v) => {
      const r = parseSaveCode(v);
      if (r.error) { qolBoxMsg.textContent = r.error; qolBoxMsg.style.color = "#ff9090"; return; }
      qolCloseBox();
      qolPending = r.data;
      game.overlay = "qolConfirm";
    },
  });
  if (qolBoxMsg.style) qolBoxMsg.style.color = "#ddd";
}

hookOn("overlayUpdate", (name) => {
  if (name !== "qolConfirm") return false;
  if (wasPressed("Enter")) qolConfirmYes();
  else if (wasPressed("Escape")) qolConfirmNo();
  return true;
}, 50);
function qolConfirmYes() { const d = qolPending; qolPending = null; game.overlay = null; if (d) applySaveData(d); }
function qolConfirmNo() { qolPending = null; game.overlay = null; showMessage("불러오지 않았어요", 1.8); }
hookOn("overlayDraw", (name) => {
  if (name !== "qolConfirm" || !qolPending) return false;
  const d = qolPending;
  const W = view.w, H = view.h;
  const pw = Math.min(560, W - 24), ph = 270;
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2, cx = W / 2;
  drawPanel(x0, y0, pw, ph);
  text("이 저장을 불러올까요?", cx, y0 + 52, 26, "#ffe27a", "center");
  const bosses = (d.stats && d.stats.bosses) || 0;
  text(`레벨 ${d.level} · 에메랄드 ${d.emeralds || 0} · 보스 처치 ${bosses}번`, cx, y0 + 96, 18, "#fff", "center");
  text(`지금 저장(레벨 ${game.profile.level})은 기기 안에 따로 보관해 둬요`, cx, y0 + 128, 14, "#aaa", "center");
  drawButton(cx - 210, y0 + ph - 82, 200, 52, "불러오기", qolConfirmYes, { color: "rgba(80,200,120,0.45)", size: 19 });
  drawButton(cx + 10, y0 + ph - 82, 200, 52, "그만두기", qolConfirmNo, { size: 18 });
  return true;
}, 50);

// ----- 메뉴 항목 -----
hookOn("menuItems", (items) => {
  const pr = game.profile;
  if (game.scene === "lobby") {
    items.push({ label: "저장 코드 복사", act: () => { closeOverlay(); copySaveCode(); } });
    items.push({ label: "저장 코드 붙여넣기", act: () => { closeOverlay(); pasteSaveCode(); } });
  }
  items.push({ label: pr.qol && pr.qol.showFps ? "FPS 숨기기" : "FPS 보기", act: () => { pr.qol = pr.qol || {}; pr.qol.showFps = !pr.qol.showFps; saveProfile(); } });
}, 60);

// ===== 추천 =====
// 끼고 있는 장비를 "기대 장비" 레벨로 (loot.js eqAvgLevel: 등급·강화까지 쳐요)
function qolAvgGear() { return typeof eqAvgLevel === "function" ? eqAvgLevel() : 0; }
// 장비에 맞는 맵 레벨 (보스 기대 장비 = 0.85 x (레벨-1))
function qolRecommendedLevel() { return Math.max(1, Math.round(qolAvgGear() / 0.85 + 1)); }

const QOL_SLOT_WEIGHT = { weapon: 1.35, armor: 1.15, bow: 0.8, charm: 0.7 };
// 지금 가진 화폐로 할 수 있는 강화 중 가장 좋은 칸 (없으면 null)
function qolRecommendSlot() {
  const pr = game.profile;
  const avg = qolAvgGear();
  let best = null, bestScore = -Infinity;
  for (const s of EQ_SLOTS) {
    const it = pr.eq && pr.eq[s.id]; if (!it) continue;
    const cost = plusCost(it);
    if (!cost || !canPay(cost)) continue;
    let w = QOL_SLOT_WEIGHT[s.id] || 1;
    if (pr.cls === "hunter" && s.id === "bow") w = 1.4;
    if (pr.cls === "hunter" && s.id === "weapon") w = 0.6;
    let score = w * (avg + 3 - itemEqLevel(it));
    if (s.id === "armor" && game.player && game.player.maxHp < 14) score += 1.5; // 하트가 적으면 갑옷
    if (score > bestScore) { bestScore = score; best = s.id; }
  }
  return best;
}

// 열려 있는 맵 중 추천 레벨에 맞는 곳 (탑 제외)
function qolRecommendedMap() {
  const L = qolRecommendedLevel();
  let best = -1, bestMin = -1;
  const inW = (i) => typeof mapWorld !== "function" || mapWorld(MAPS[i]) === curWorld(); // 지금 월드의 맵만
  for (let i = 0; i < MAPS.length; i++) {
    const m = MAPS[i];
    if (m.type === "tower" || !mapUnlocked(i) || !inW(i)) continue;
    const r = levelRange(m);
    if (L >= r.min && L <= r.max && r.min > bestMin) { best = i; bestMin = r.min; }
  }
  if (best < 0) for (let i = 0; i < MAPS.length; i++) if (MAPS[i].type !== "tower" && mapUnlocked(i) && inW(i)) best = i; // 맞는 곳이 없으면 가장 뒤에 열린 맵
  return best;
}

// ===== 열쇠 -> 보스방 문 포털, 발자국 =====
// 포털은 game.keyhunt.portal 에 있어요: 같이 하기 친구 기기에도 그대로 가고(netplay 열쇠 찾기 상태), 주인공 누구나 탈 수 있어요.
// 발자국(qolSteps)은 기기마다 내 주인공 발밑에서 문까지 그려요.
let qolSteps = null;   // { until, dist(문까지 거리 지도), id }
const QOL_STEP_TIME = 10;
const qolPortalArmed = new Set(); // 포털 자리에서 한 번 떨어진 주인공 pid (방장 기기)
let qolPortalSeq = 0, qolStepsFor = 0;
function qolPortalNow() { const kh = game.keyhunt; return kh && !kh.inBoss && kh.portal && typeof kh.portal === "object" ? kh.portal : null; }
function qolMakePortal(x, y) {
  const kh = game.keyhunt;
  if (!kh || !kh.door) return;
  const s = findFreeSpot(x, y, 0.4, 3) || { x, y };
  kh.portal = { x: s.x, y: s.y, t: 0, id: ++qolPortalSeq + Math.floor(Math.random() * 1e6) };
  qolPortalArmed.clear();
  showMessage("보스방 문으로 가는 빛 포털이 열렸어요! (걸어가도 돼요: 금색 발자국)", 3.2, false, "#ffd23f");
}
function qolClearPortal() { const kh = game.keyhunt; if (kh) kh.portal = null; qolSteps = null; qolPortalArmed.clear(); }

// 문에서부터 모든 칸까지 걸음 수 (발자국 길 찾기용)
function qolDistFrom(t) {
  const W = world.W, H = world.H;
  const dist = new Int32Array(W * H).fill(-1);
  const sx = Math.floor(t.x), sy = Math.floor(t.y);
  if (isWall(sx, sy)) return dist;
  dist[sy * W + sx] = 0;
  const q = [sy * W + sx];
  for (let i = 0; i < q.length; i++) {
    const c = q[i], x = c % W, y = (c / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || isWall(nx, ny) || dist[ny * W + nx] >= 0) continue;
      dist[ny * W + nx] = dist[c] + 1;
      q.push(ny * W + nx);
    }
  }
  return dist;
}

// 방장 기기: 주인공 누구든 포털에 들어가면 그 주인공을 문 앞으로 (친구는 순간이동으로 친구 기기에 가요)
function qolUpdatePortal(dt) {
  const P = qolPortalNow();
  if (!P) return;
  P.t += dt;
  for (const p of allPlayers()) {
    if (!p || p.hp <= 0) continue;
    const id = p.pid || 1, d = Math.hypot(p.x - P.x, p.y - P.y);
    if (!qolPortalArmed.has(id)) { if (d > 1.3) qolPortalArmed.add(id); continue; } // 만들어진 자리에서 한 번 떨어진 뒤에 탈 수 있어요
    if (d < 0.6) qolUsePortal(p);
  }
}
function qolUsePortal(p) {
  p = p || game.player;
  const s0 = doorFront(), s = findFreeSpot(s0.x, s0.y, p.r || 0.35, 2) || s0;
  for (let i = 0; i < 24; i++) addSparkle(p.x, p.y, Math.random(), { vz: 2 + Math.random() * 2, life: 0.8, size: 0.8, gold: true });
  p.x = s.x; p.y = s.y; p.move = null; p.rollTimer = 0;
  qolPortalArmed.delete(p.pid || 1);
  if (p === game.player) {
    camera.x = p.x; camera.y = p.y;
    if (typeof pathFrom !== "undefined") pathFrom = { x: -1, y: -1 };
    game.fade = 0.6;
    qolSteps = null;
  }
  sfx.stairs && sfx.stairs();
  showMessage("보스방 문 앞이에요! 열쇠로 열어요", 2.5, false, "#ffd23f");
}
// 기기마다: 내 주인공이 포털로 문 앞에 왔으면(친구 기기: 방장이 옮겨 줌) 화면도 따라가요, 새 포털이면 발자국
hookOn("hudDraw", () => {
  const P = game.scene === "dungeon" ? qolPortalNow() : null;
  if (!P) { if (qolSteps && !(game.keyhunt && game.keyhunt.portal)) qolSteps = null; return; }
  if (P.id !== qolStepsFor) { qolStepsFor = P.id; qolSteps = { until: game.time + QOL_STEP_TIME, dist: qolDistFrom(doorFront()) }; }
  if (qolSteps && game.time > qolSteps.until) qolSteps = null;
  const p = game.player, kh = game.keyhunt;
  if (qolSteps && p && kh.door && Math.hypot(p.x - kh.door.x, p.y - kh.door.y) < 2.2) qolSteps = null; // 문에 왔어요
}, 61);

hookOn("worldThings", (things) => {
  const P = game.scene === "dungeon" ? qolPortalNow() : null;
  if (!P) return;
  things.push({ depth: P.x + P.y, x: P.x, y: P.y, draw: () => qolDrawPortal(P) });
}, 60);

function qolDrawPortal(P) {
  // 블록 테두리 문 + 빛나는 가운데
  const x = P.x, y = P.y, t = game.time;
  const gold = "#e8b830", dark = "#9a7418";
  drawBox(x - 0.55, y - 0.12, 0, 0.2, 0.24, 1.4, gold);
  drawBox(x + 0.35, y - 0.12, 0, 0.2, 0.24, 1.4, gold);
  drawBox(x - 0.55, y - 0.12, 1.4, 1.1, 0.24, 0.2, dark);
  const c = toScreen(x, y, 0.7);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const r = (0.42 + 0.05 * Math.sin(t * 5)) * TILE_W * 0.5;
  const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r * 1.6);
  g.addColorStop(0, `rgba(255,250,210,${(P.t || 0) > 0.8 ? 0.95 : 0.6})`); g.addColorStop(0.5, "rgba(255,210,80,0.55)"); g.addColorStop(1, "rgba(255,180,40,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(c.x, c.y, r * 0.8, r * 1.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (Math.random() < 0.3) addSparkle(x + (Math.random() - 0.5) * 0.6, y, 0.3 + Math.random(), { vz: 1, life: 0.6, size: 0.45, gold: true });
}

hookOn("drawFloor", () => {
  if (game.scene !== "dungeon" || !qolSteps || !game.player || (game.keyhunt && game.keyhunt.inBoss)) return;
  const p = game.player, D = qolSteps.dist, W = world.W;
  let x = Math.floor(p.x), y = Math.floor(p.y);
  if (D[y * W + x] < 0) return;
  const a = Math.min(1, (qolSteps.until - game.time) / 2) * (0.6 + 0.25 * Math.sin(game.time * 6));
  ctx.save();
  ctx.fillStyle = `rgba(255,214,70,${a})`;
  for (let n = 0; n < 14; n++) {
    let bx = x, by = y, bd = D[y * W + x];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const v = D[(y + dy) * W + (x + dx)];
      if (v >= 0 && v < bd) { bd = v; bx = x + dx; by = y + dy; }
    }
    if (bx === x && by === y) break;
    x = bx; y = by;
    if (n === 0) continue; // 발밑 바로 앞은 건너뛰어요
    const c = toScreen(x + 0.5 + (n % 2 ? 0.12 : -0.12), y + 0.5, 0.02);
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 5 * ZOOM, 2.6 * ZOOM, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}, 60);
