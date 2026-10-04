// ===== 같이 하기: 출발 투표 =====
// 누가 지도에서 맵을 고르고 "출발!"을 누르면 바로 떠나지 않고 투표를 해요. 모두 "좋아요"면 출발, 한 명이라도 "싫어요"면 취소.
//   고른 사람은 자동으로 "좋아요". 30초 안에 다 안 모이면 취소. 투표는 한 번에 하나.
//   방장 기기가 표를 모으고(netVote.cur), 상태에 실어 보내요(snap.vt). 친구는 "req vote" 로 표를 보내요.
const NV = { time: 30 };
const netVote = { cur: null, seq: 0, done: 0 }; // cur(방장): { id, map, level, by, yes: Set, t }. done: 내가 표를 낸 투표 번호

function netVotePids() { return allPlayers().map((q) => q.pid || 1); }
function netVoteName(pid) { return typeof playerLabelOf === "function" ? playerLabelOf(pid) : `${pid}번`; }
// 방장: 투표 시작
function netVoteStart(by, def, level) {
  if (netVote.cur) { showMessage("벌써 투표 중이에요. 끝나면 다시 골라요", 2, false, "#ffe27a"); return; }
  netVote.cur = { id: ++netVote.seq + Math.floor(Math.random() * 1000) * 100, map: def.id, level, by, yes: new Set([by]), t: 0 };
  const who = josa(netVoteName(by), "이/가");
  showMessage(`${who} ${def.name} Lv ${level} 에 가자고 해요! 투표해요`, 3, false, "#ffe27a");
  netVoteCheck();
}
// 방장: 표 받기
function netVoteCast(pid, yes, id) {
  const v = netVote.cur;
  if (!v || (id !== undefined && id !== v.id)) return;
  if (!yes) { netVote.cur = null; const who = josa(netVoteName(pid), "이/가"); showMessage(`${who} 싫대요. 다시 골라요`, 2.6, false, "#ffb070"); return; }
  v.yes.add(pid);
  netVoteCheck();
}
// 방장: 다 모였나
function netVoteCheck() {
  const v = netVote.cur; if (!v) return;
  if (!netVotePids().every((pid) => v.yes.has(pid))) return;
  netVote.cur = null;
  const def = MAPS.find((m) => m.id === v.map);
  if (!def || game.scene !== "lobby" || game.result) return;
  netplay.reqSlot = v.by;
  try {
    if (hookAny("sceneGate", "start")) return;
    if (game.overlay === "vote" || game.overlay === "maps") closeOverlay();
    showMessage(`모두 좋대요! ${def.name} 출발!`, 2, false, "#7dffb0");
    startChosenMapBase(def, v.level);
  } finally { netplay.reqSlot = 0; }
}
// 방장 기기에서 출발을 누르면 투표로 (혼자면 그냥 출발)
hookOn("startChosenMap", (def, level) => {
  if (!netHosting() || netplay.replaying || allPlayers().length < 2) return false;
  netVoteStart(1, def, level);
  return true;
}, 40);
// 방장: 시간 재기
hookOn("netTick", (dt) => {
  const v = netVote.cur;
  if (!v || !netHosting()) return;
  if (game.scene !== "lobby") { netVote.cur = null; return; }
  v.t += dt;
  if (v.t > NV.time) { netVote.cur = null; showMessage("시간이 지나서 투표가 끝났어요", 2, false, "#ffb070"); return; }
  netVoteCheck(); // 친구가 나가면 남은 사람끼리
}, 60);
// 상태에 싣기 / 받기
function netVoteSnap(snap) {
  const v = netVote.cur; if (!v) return;
  snap.vt = [v.id, v.map, v.level, v.by, [...v.yes], Math.max(0, Math.round((NV.time - v.t) * 10) / 10)];
}
function netVoteApply(vt) {
  if (!Array.isArray(vt) || !MAPS.some((m) => m.id === vt[1])) { netplay.vote = null; return; }
  netplay.vote = { id: Math.round(netNum(vt[0], 0, 1e9, 0)), map: vt[1], level: Math.round(netNum(vt[2], 1, 999, 1)), by: Math.round(netNum(vt[3], 1, 9, 1)),
    yes: (Array.isArray(vt[4]) ? vt[4] : []).filter((x) => Number.isInteger(x)).slice(0, 8), left: netNum(vt[5], 0, NV.time, 0) };
}
// 지금 보이는 투표 (방장은 내 것, 친구는 받은 것)
function netVoteNow() {
  if (netHosting()) { const v = netVote.cur; return v ? { id: v.id, map: v.map, level: v.level, by: v.by, yes: [...v.yes], left: Math.max(0, NV.time - v.t) } : null; }
  return netGuest() ? netplay.vote || null : null;
}
function netVoteMine() { return netHosting() ? 1 : netplay.slot; }
// 내 표
function netVoteSend(yes) {
  const v = netVoteNow(); if (!v) return;
  netVote.done = v.id;
  if (game.overlay === "vote") closeOverlay();
  if (netHosting()) netVoteCast(1, yes, v.id);
  else { const S = netSession(); if (S) S.toHost({ t: "req", w: "vote", d: { id: v.id, yes: !!yes } }); }
  sfx.click && sfx.click();
}
// 투표 창: 표를 안 낸 사람에게 저절로 열려요 (결과창·교환 중이면 안 열어요)
hookOn("netTick", () => {
  if (!netOn()) return;
  const v = netVoteNow();
  if (!v) { if (game.overlay === "vote") closeOverlay(); return; }
  if (v.yes.includes(netVoteMine()) || netVote.done === v.id) return;
  if (game.overlay === "vote" || game.overlay === "result" || game.overlay === "trade" || game.overlay === "netask") return;
  game.overlay = "vote";
  if (typeof sfx !== "undefined" && sfx.levelUp) sfx.levelUp();
}, 70);
hookOn("overlayUpdate", (name) => {
  if (name !== "vote") return false;
  if (wasPressed("Enter", "Space", "KeyY")) netVoteSend(true);
  else if (wasPressed("Escape", "KeyN")) netVoteSend(false);
  return true;
}, 50);
hookOn("overlayDraw", (name) => {
  if (name !== "vote") return false;
  const v = netVoteNow(); if (!v) return true;
  const def = MAPS.find((m) => m.id === v.map) || { name: v.map };
  const W = view.w, H = view.h, pw = Math.min(560, W - 24), ph = 270, x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("출발 투표", W / 2, y0 + 40, 26, "#ffe27a", "center");
  const who = josa(netVoteName(v.by), "이/가");
  text(`${who} ${def.name} Lv ${v.level} 에 가자고 해요!`, W / 2, y0 + 78, 18, "#fff", "center");
  const pids = netVotePids();
  text(pids.map((pid) => `${netVoteName(pid)} ${v.yes.includes(pid) ? "좋아요" : "…"}`).join(" · "), W / 2, y0 + 112, 15, "#9fe6ff", "center");
  text(`모두 좋아요면 출발해요 · ${Math.ceil(v.left)}초`, W / 2, y0 + 140, 14, "#bbb", "center");
  drawButton(W / 2 - 220, y0 + ph - 84, 200, 56, "좋아요!", () => netVoteSend(true), { color: "rgba(80,200,120,0.5)", size: 22 });
  drawButton(W / 2 + 20, y0 + ph - 84, 200, 56, "싫어요", () => netVoteSend(false), { size: 20 });
  return true;
}, 50);
