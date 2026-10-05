// ===== 퀘스트 (이야기 따라가기) =====
// 이야기 설계서: docs/design/story.md · 퀘스트 약속(API): docs/design/quests.md
// 월드마다 캠프에 "이야기꾼"이 한 명 있어요 (questGiver). 말을 걸면 퀘스트를 주고, 다 하면 보상을 줘요.
//   퀘스트 데이터는 월드 파일에 따로 (quests_w14.js, quests_w5.js ...). 이 파일은 장치만.
// 세는 법 (같이 하기: 방장·친구 모두 자기 저장에 한 번씩)
//   몬스터·보스·맵 깸: records.js 의 함께 쌓는 기록(recApplied 훅)으로 세요. 방장이 친구에게 같은 기록을 보내서 두 기기가 똑같이 한 번.
//   이야기 조각: 던전 바닥의 빛나는 조각(pickups "qfrag"). 방장이 줍는 걸 계산하고 "qfrag" 사건으로 친구에게 알려요.
//   캠프 말 걸기·강아지·집: 내 기기에서 (창이 열리는 순간, 쓰다듬은 횟수, 집 안에 들어간 순간을 봐요)
// 저장: pr.quests = { active: {id: true}, prog: {id: 숫자}, done: {id: true}, frags: {조각id: true}, titles: [칭호], furn: {가구id: true} }
//   보상은 "다 했어요"(done)를 먼저 저장한 뒤 줘요 (두 번 받지 않게).

const QUESTS = {};          // id -> 퀘스트
const QUEST_GIVERS = {};    // 월드 -> 이야기꾼
const QUEST_FRAGS = {};     // 조각 id -> { id, world, map, name, text, secret }
const STORY_BOSS = {};      // 맵 id -> "원래는 ○○였어요"
const QUEST_GOAL_TYPES = ["kill", "clear", "boss", "fragment", "talk", "pet", "coop", "visit", "collect"];
const QUEST_TALK_NPCS = ["shop", "map", "smith", "wardrobe", "well", "board", "dog"];
const QUEST_NPC_NAMES = { shop: "상인", map: "모험 지도", smith: "대장장이", wardrobe: "옷장", well: "소원 우물", board: "기록판", dog: "강아지" };
const QUEST_COLLECT = {
  emeralds: { name: "에메랄드", have: (pr) => pr.emeralds || 0 },
  potion: { name: "물약", have: (pr) => pr.potions || 0 },
  arrows: { name: "화살", have: (pr) => pr.arrows || 0 },
};
const QUEST_LINE_MAX = 60; // 대사 한 줄 최대 글자 (화면 넘치지 않게)

// ----- 등록 -----
function questGiver(world, g) {
  if (!g || typeof g.id !== "string" || typeof g.name !== "string") return null;
  QUEST_GIVERS[world] = { world, id: g.id, name: g.name, x: Number(g.x) || 18.6, y: Number(g.y) || 8.6, draw: typeof g.draw === "function" ? g.draw : null, label: g.label || g.name, placed: null };
  return QUEST_GIVERS[world];
}
function questRegister(q) {
  if (!q || typeof q.id !== "string" || QUESTS[q.id]) return null;
  QUESTS[q.id] = { order: 0, requires: [], intro: [], done: [], reward: {}, main: false, ...q };
  return QUESTS[q.id];
}
function questFragment(f) { if (f && typeof f.id === "string") QUEST_FRAGS[f.id] = { secret: false, ...f }; return QUEST_FRAGS[f && f.id]; }
function storyBossLines(table) { for (const [k, v] of Object.entries(table || {})) if (typeof v === "string") STORY_BOSS[k] = v; }
function storyBossLine(mapId) { return STORY_BOSS[mapId] || null; }

// ----- 저장 -----
hookOn("profileLoaded", (pr) => {
  const q = (pr.quests = pr.quests && typeof pr.quests === "object" && !Array.isArray(pr.quests) ? pr.quests : {});
  for (const k of ["active", "prog", "done", "frags", "furn"]) if (!q[k] || typeof q[k] !== "object" || Array.isArray(q[k])) q[k] = {};
  if (!Array.isArray(q.titles)) q.titles = [];
  q.titles = q.titles.filter((t) => typeof t === "string").slice(0, 50);
  for (const id of Object.keys(q.prog)) { const v = Number(q.prog[id]); q.prog[id] = Number.isFinite(v) && v > 0 ? Math.min(9999, Math.floor(v)) : 0; }
  for (const k of ["active", "done", "frags", "furn"]) for (const id of Object.keys(q[k])) if (q[k][id] !== true) delete q[k][id];
  for (const id of Object.keys(q.active)) if (q.done[id]) delete q.active[id]; // 다 한 건 진행 중이 아니에요
}, 58);
function questSave() { return game.profile.quests; }

// ----- 상태 -----
function questNeed(q) { const g = q.goal || {}; return g.type === "kill" || g.type === "collect" ? Math.max(1, g.n || 1) : 1; }
function questProg(q) {
  const S = questSave(), g = q.goal || {};
  if (g.type === "collect") { const c = QUEST_COLLECT[g.item]; return Math.min(questNeed(q), Math.max(S.prog[q.id] || 0, c ? c.have(game.profile) : 0)); }
  if (g.type === "fragment") return S.frags[g.frag] ? 1 : 0;
  return Math.min(questNeed(q), S.prog[q.id] || 0);
}
// "locked" 아직 못 받음 · "open" 받을 수 있음 · "active" 하는 중 · "ready" 다 했어요(이야기꾼에게) · "done" 끝
function questState(q) {
  const S = questSave();
  if (!q) return "locked";
  if (S.done[q.id]) return "done";
  if (S.active[q.id]) return questProg(q) >= questNeed(q) ? "ready" : "active";
  return (q.requires || []).every((r) => S.done[r]) ? "open" : "locked";
}
function questsOf(world) { return Object.values(QUESTS).filter((q) => q.world === world).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0) || a.order - b.order); }
function questActiveList() { return Object.values(QUESTS).filter((q) => { const s = questState(q); return s === "active" || s === "ready"; }); }
function questWorlds() { return (typeof WORLD_ORDER !== "undefined" ? WORLD_ORDER : [1]).filter((w) => questsOf(w).length); }
function questNextWorld(world) { const L = typeof WORLD_ORDER !== "undefined" ? WORLD_ORDER : []; const i = L.indexOf(world); return i >= 0 && i + 1 < L.length ? L[i + 1] : null; }
function questWorldName(w) { return (typeof WORLDS !== "undefined" && WORLDS[w] && WORLDS[w].name) || `월드 ${w}`; }

// 목표 글 (퀘스트 책·지금 할 일)
function questMapName(id) { const m = MAPS.find((x) => x.id === id); return m ? m.name : id; }
function questGoalText(q) {
  const g = q.goal || {};
  if (g.type === "kill") { const who = g.mon && MONSTERS[g.mon] ? MONSTERS[g.mon].name : "몬스터"; return `${g.map ? questMapName(g.map) + "에서 " : ""}${who} ${questNeed(q)}마리 물리치기`; }
  if (g.type === "clear") return `${questMapName(g.map)} 끝까지 깨기`;
  if (g.type === "boss") { const b = typeof BOSS_DEFS !== "undefined" && BOSS_DEFS[g.map]; return `${questMapName(g.map)}의 ${b ? b.name : "보스"} 이기기`; }
  if (g.type === "fragment") return `${questMapName(g.map)}에서 이야기 조각 찾기`;
  if (g.type === "talk") return g.npc === "dog" ? "강아지 쓰다듬기" : `캠프의 ${QUEST_NPC_NAMES[g.npc] || g.npc}에게 가 보기`;
  if (g.type === "pet") return "강아지 쓰다듬기";
  if (g.type === "coop") return `${g.map ? josa(questMapName(g.map), "을/를") : "아무 던전이나"} 친구와 같이 깨기`;
  if (g.type === "visit") return "우리 집에 들어가 보기";
  if (g.type === "collect") { const c = QUEST_COLLECT[g.item]; return `${c ? c.name : g.item} ${questNeed(q)}개 모으기`; }
  return "?";
}
function questProgText(q) { const n = questNeed(q); return n > 1 ? ` (${questProg(q)}/${n})` : ""; }

// ----- 세기 -----
// questEvent(종류, 값): 다른 파일도 불러요 (예: house.js 가 questEvent("visit", "house"))
//   kill: { type, map } · boss/clear: 맵 id · coop: 맵 id · talk: npc id · pet · visit: "house" · frag: 조각 id
function questEvent(type, arg) {
  if (!game.profile || !game.profile.quests) return 0;
  const S = questSave();
  let hits = 0;
  for (const q of Object.values(QUESTS)) {
    if (!S.active[q.id] || S.done[q.id]) continue;
    const g = q.goal || {};
    let ok = false;
    if (type === "kill" && g.type === "kill") ok = !!arg && (!g.mon || g.mon === arg.type) && (!g.map || g.map === arg.map);
    else if (type === "boss" && g.type === "boss") ok = g.map === arg;
    else if (type === "clear" && g.type === "clear") ok = g.map === arg;
    else if (type === "coop" && g.type === "coop") ok = !g.map || g.map === arg;
    else if (type === "talk" && g.type === "talk") ok = g.npc === arg;
    else if (type === "pet" && (g.type === "pet" || (g.type === "talk" && g.npc === "dog"))) ok = true;
    else if (type === "visit" && g.type === "visit") ok = (g.place || "house") === arg;
    if (!ok) continue;
    const before = questProg(q);
    if (before >= questNeed(q)) continue;
    S.prog[q.id] = (S.prog[q.id] || 0) + 1;
    hits++;
    if (questProg(q) >= questNeed(q)) questReadyToast(q);
  }
  if (hits) saveProfile();
  return hits;
}
function questReadyToast(q) {
  const giver = QUEST_GIVERS[q.world];
  showMessage(`퀘스트 완료! ${giver ? giver.name + "에게" : "이야기꾼에게"} 가요`, 3, false, "#7dffb0");
  if (typeof sfx !== "undefined") sfx.levelUp();
}
// 이야기 조각을 얻었어요 (그 조각을 찾는 퀘스트를 하는 중일 때만 가져요)
function questWants(fragId) { const S = questSave(); return Object.values(QUESTS).some((q) => S.active[q.id] && !S.done[q.id] && q.goal && q.goal.type === "fragment" && q.goal.frag === fragId); }
function questGotFrag(fragId) {
  const f = QUEST_FRAGS[fragId];
  if (!f || !game.profile) return false;
  const S = questSave();
  if (S.frags[fragId]) return false;
  if (!questWants(fragId)) { showMessage("반짝이는 조각이에요. 이야기꾼에게 먼저 이야기를 들어 봐요", 2.6); return false; }
  S.frags[fragId] = true;
  saveProfile();
  showMessage(f.secret ? "이야기 조각! 읽을 수 없는 글자가 적혀 있어요" : `이야기 조각: ${f.name}`, 3, true);
  if (typeof sfx !== "undefined") sfx.sparkle();
  for (const q of Object.values(QUESTS)) if (S.active[q.id] && q.goal && q.goal.frag === fragId) questReadyToast(q);
  return true;
}

// 함께 쌓는 기록이 내 저장에 남을 때 (방장·혼자: recShared / 친구: recFromHost) -> 한 기기에 한 번
hookOn("recApplied", (kind, d) => {
  if (!d || typeof d !== "object") return;
  if (kind === "kill") questEvent("kill", { type: d.type, map: game.scene === "dungeon" && game.mapDef ? game.mapDef.id : null });
  else if (kind === "bossWin") questEvent("boss", d.map);
  else if (kind === "clear") {
    questEvent("clear", d.map);
    if (typeof allPlayers === "function" && allPlayers().length >= 2) questEvent("coop", d.map);
  }
}, 50);

// 캠프: 창이 열리는 순간 / 쓰다듬은 횟수 / 우물 / 집 안에 들어간 순간 (내 기기에서 매 화면)
const QUEST_OVERLAY_NPC = { shop: "shop", maps: "map", smith: "smith", wardrobe: "wardrobe", records: "board" };
const questWatch = { ov: null, pets: null, well: 0, inHouse: false };
function questWatchTick() {
  const pr = game.profile;
  if (!pr || !pr.quests) return;
  const W = questWatch;
  const pets = (pr.stats && pr.stats.pets) || 0;
  if (W.pets === null) W.pets = pets;
  if (pets > W.pets) questEvent("pet");
  W.pets = pets;
  const ov = game.scene === "lobby" ? game.overlay : null;
  if (ov && ov !== W.ov && QUEST_OVERLAY_NPC[ov]) questEvent("talk", QUEST_OVERLAY_NPC[ov]);
  W.ov = ov;
  const well = game.scene === "lobby" && typeof lobby !== "undefined" ? lobby.well_timer || 0 : 0;
  if (well > 0 && !(W.well > 0)) questEvent("talk", "well");
  W.well = well;
  const inH = game.scene === "lobby" && typeof houseInside === "function" && !!game.player && houseInside(game.player);
  if (inH && !W.inHouse) questEvent("visit", "house");
  W.inHouse = inH;
}
hookOn("netTick", questWatchTick, 80);

// ----- 이야기 조각 (던전 바닥) -----
// 걸어갈 수 있는 바닥 칸 중 시작점에서 먼 곳 (높은 단은 계단으로만: 높이 차이 0.5 까지)
function questFloorOk(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= world.W || ty >= world.H || world.tiles[ty][tx] !== 0) return false;
  const x = tx + 0.5, y = ty + 0.5;
  if (typeof w4OnLava === "function" && w4OnLava(x, y)) return false;
  if (typeof w4CrackAt === "function" && w4CrackAt(x, y)) return false;
  return true;
}
// 장애물(나무·통·소품)이 가까운 칸은 못 지나가는 칸으로 봐요
//   칸 가운데끼리 걸어갈 때 주인공 몸(0.3)이 장애물에 안 닿으려면: 가운데가 장애물에서 (반지름 + 0.3 + 반 칸) 넘게 떨어져야 해요
//   (넉넉하게 막아서, 조각은 "꼭 걸어갈 수 있는 곳"에만 놓여요)
function questSolidMask() {
  const W = world.W, H = world.H, m = new Uint8Array(W * H);
  for (const s of world.solids || []) {
    const R = (s.r || 0) + 0.81;
    for (let ty = Math.floor(s.y - R); ty <= Math.floor(s.y + R); ty++) for (let tx = Math.floor(s.x - R); tx <= Math.floor(s.x + R); tx++) {
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
      if (Math.hypot(tx + 0.5 - s.x, ty + 0.5 - s.y) < R) m[ty * W + tx] = 1;
    }
  }
  return m;
}
function questReach(sx, sy) {
  const W = world.W, H = world.H, dist = new Int32Array(W * H).fill(-1), hg = world.hgt, solid = questSolidMask();
  const s0 = Math.floor(sy) * W + Math.floor(sx);
  if (s0 < 0 || s0 >= W * H) return dist;
  const qu = [s0]; dist[s0] = 0; solid[s0] = 0;
  for (let i = 0; i < qu.length; i++) {
    const c = qu[i], cx = c % W, cy = (c / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, n = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || dist[n] >= 0 || solid[n] || !questFloorOk(nx, ny)) continue;
      if (hg && Math.abs((hg[n] || 0) - (hg[c] || 0)) > 0.5) continue;
      dist[n] = dist[c] + 1; qu.push(n);
    }
  }
  return dist;
}
// questReach(목표) 로 만든 거리표에서, (x, y) 다음에 갈 칸 가운데 (높이 차이 0.5 까지인 이웃만) · 시험 봇이 걸을 때 써요
function questNextTile(x, y, dist) {
  const W = world.W, cx = Math.floor(x), cy = Math.floor(y), here = dist[cy * W + cx], hg = world.hgt;
  if (here <= 0) return null;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = cx + dx, ny = cy + dy, n = ny * W + nx;
    if (nx < 0 || ny < 0 || nx >= W || ny >= world.H || dist[n] !== here - 1) continue;
    if (hg && Math.abs((hg[n] || 0) - (hg[cy * W + cx] || 0)) > 0.5) continue;
    return { x: nx + 0.5, y: ny + 0.5 };
  }
  return null;
}
function questFragSpot(rand = Math.random) {
  const st = world.start || (game.player && { x: game.player.x, y: game.player.y });
  if (!st) return null;
  const dist = questReach(st.x, st.y);
  let max = 0;
  for (let i = 0; i < dist.length; i++) if (dist[i] > max) max = dist[i];
  if (max < 4) return null;
  const cand = [];
  for (let i = 0; i < dist.length; i++) {
    if (dist[i] < max * 0.6) continue;
    const x = (i % world.W) + 0.5, y = ((i / world.W) | 0) + 0.5;
    if (!hitsWall(x, y, 0.35)) cand.push({ x, y, d: dist[i] });
  }
  if (!cand.length) return null;
  return cand[Math.floor(rand() * cand.length)];
}
// 이 던전에 놓을 조각: 혼자면 내가 찾는 것만, 방장이면 친구가 찾을 수도 있으니 이 맵의 조각 모두
function questFragsFor(mapId) {
  const hosting = typeof netHosting === "function" && netHosting();
  return Object.values(QUEST_FRAGS).filter((f) => f.map === mapId && (hosting || (questWants(f.id) && !questSave().frags[f.id])));
}
function questPlaceFrags() {
  if (game.scene !== "dungeon" || !game.mapDef || game.mapDef.type === "tower") return 0;
  if (typeof netGuest === "function" && netGuest()) return 0; // 친구 기기는 방장 것을 받아요
  if (typeof pickups === "undefined") return 0;
  let n = 0;
  for (const f of questFragsFor(game.mapDef.id)) {
    if (pickups.some((e) => e.type === "qfrag" && e.frag === f.id)) continue;
    const s = questFragSpot();
    if (!s) continue;
    pickups.push({ type: "qfrag", frag: f.id, x: s.x, y: s.y, z: 0, t: 0 });
    n++;
  }
  if (n && questFragsFor(game.mapDef.id).some((f) => questWants(f.id))) showMessage("이 던전 어딘가에 이야기 조각이 있어요! 지도의 노란 별을 찾아봐요", 3.5);
  return n;
}
hookOn("dungeonStarted", () => { try { questPlaceFrags(); } catch (e) { console.error(e); } }, 70);
// 주우면: 방장(혼자)이 계산하고 친구에게 알려요
hookOn("pickedUp", (item) => {
  if (!item || item.type !== "qfrag" || typeof item.frag !== "string") return;
  if (typeof netGuest === "function" && netGuest()) return;
  questGotFrag(item.frag);
  if (typeof netHosting === "function" && netHosting() && !netplay.replaying && netplay.events.length < 200) netplay.events.push(["qfrag", item.frag, 0]);
}, 50);
hookOn("netGuestEvent", (kind, args) => {
  if (kind !== "qfrag") return false;
  if (typeof args === "string" && Object.hasOwn(QUEST_FRAGS, args)) questGotFrag(args);
  return true;
}, 50);
hookOn("drawPickup", (e) => {
  if (e.type !== "qfrag") return false;
  const z = 0.35 + Math.sin(e.t * 3) * 0.08, base = toScreen(e.x, e.y, 0);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const hgt = 70 * ZOOM, g = ctx.createLinearGradient(0, base.y, 0, base.y - hgt);
  g.addColorStop(0, "rgba(255,226,122,0.6)"); g.addColorStop(1, "rgba(255,226,122,0)");
  ctx.fillStyle = g; ctx.fillRect(base.x - 5 * ZOOM, base.y - hgt, 10 * ZOOM, hgt);
  ctx.restore();
  drawBox(e.x - 0.14, e.y - 0.14, z, 0.28, 0.28, 0.06, "#f2e6c8");
  drawBox(e.x - 0.11, e.y - 0.11, z + 0.06, 0.22, 0.22, 0.02, "#c9a24a");
  const c = toScreen(e.x, e.y, z + 0.35);
  drawStar(c.x, c.y, (5 + 2 * Math.sin(e.t * 5)) * ZOOM, "#ffe27a");
  return true;
}, 50);
// 지도에 노란 별 (깜빡)
hookOn("minimapDraw", () => {
  if (game.scene !== "dungeon" || !world.mini || typeof pickups === "undefined") return;
  const fr = pickups.filter((e) => e.type === "qfrag");
  if (!fr.length) return;
  const size = Math.min(260, view.w * 0.24, view.h * 0.42), k = size / (world.W + world.H), ox = view.w - 16 - world.W * k, oy = 96;
  for (const e of fr) { const sx = ox + (e.x - e.y) * k, sy = oy + (e.x + e.y) * k / 2; if (Math.sin(game.time * 6) > -0.3) drawStar(sx, sy, 6, "#ffe27a"); }
}, 60);

// ----- 이야기꾼 (캠프) -----
function questGiverHere() { const g = QUEST_GIVERS[typeof curWorld === "function" ? curWorld() : 1]; return game.scene === "lobby" && g ? g : null; }
function questGiverPos(g) {
  if (!g.placed || g.placed.solids !== world.solids) {
    const s = (typeof findFreeSpot === "function" && findFreeSpot(g.x, g.y, 0.45, 3)) || { x: g.x, y: g.y };
    g.placed = { x: s.x, y: s.y, solids: world.solids };
    if (world.solids) world.solids.push({ x: s.x, y: s.y, r: 0.35 });
  }
  return g.placed;
}
// 이야기꾼 위 표시: "!" 새 이야기 / "?" 다 했어요
function questGiverMark(world) {
  const qs = questsOf(world);
  if (qs.some((q) => questState(q) === "ready")) return "?";
  if (qs.some((q) => questState(q) === "open")) return "!";
  return "";
}
function drawGiverDefault(g) {
  const p = g.placed;
  drawBox(p.x - 0.18, p.y - 0.12, 0, 0.36, 0.24, 0.5, "#5a6a8a");
  drawBox(p.x - 0.2, p.y - 0.16, 0.5, 0.4, 0.32, 0.32, "#e8c39e");
}
hookOn("lobbyThings", (things) => {
  const g = questGiverHere();
  if (!g) return;
  const p = questGiverPos(g);
  things.push({ depth: p.x + p.y, x: p.x, y: p.y, draw: () => {
    try { (g.draw || drawGiverDefault)(g); } catch (e) { drawGiverDefault(g); }
    const mk = questGiverMark(g.world);
    if (mk) { const c = toScreen(p.x, p.y, 1.75 + Math.sin(game.time * 4) * 0.06); text(mk, c.x, c.y, Math.round(22 * ZOOM * 0.8), mk === "?" ? "#7dffb0" : "#ffe27a", "center"); }
  } });
}, 64);
hookOn("lobbyInteractables", (list) => {
  const g = questGiverHere();
  if (!g) return list;
  const p = questGiverPos(g), mk = questGiverMark(g.world);
  list.push({ x: p.x, y: p.y, range: 1.7, label: g.label, short: "이야기", prompt: mk === "?" ? `${g.name}: 다 했어요!` : mk === "!" ? `${g.name}: 새 이야기` : `${josa(g.name, "과/와")} 이야기하기`, action: () => questTalk(g.world) });
  return list;
}, 64);

// 말 걸기: 다 한 것 보고 -> 새 퀘스트 받기 -> 하는 중이면 다시 알려 주기
function questTalk(world) {
  const g = QUEST_GIVERS[world];
  if (!g) return;
  const qs = questsOf(world);
  const ready = qs.find((q) => questState(q) === "ready");
  if (ready) { questDialog(g, questDoneLines(ready), () => questClaim(ready)); return; }
  const open = qs.find((q) => questState(q) === "open");
  if (open) { questDialog(g, [...open.intro, `할 일: ${questGoalText(open)}`], () => questAccept(open)); return; }
  const act = qs.find((q) => questState(q) === "active");
  if (act) { questDialog(g, [`${act.title}: ${questGoalText(act)}${questProgText(act)}`, "기다리고 있을게!"]); return; }
  const nx = questNextWorld(world);
  questDialog(g, ["고마워! 이 월드의 이야기는 다 들었어.", nx ? `이제 ${questWorldName(nx)}에 가 볼 차례야!` : "다음 이야기는 아직 아무도 몰라."]);
}
// 끝 대사 + 다음 월드 예고 (다음 월드가 있을 때만: q.next) / 없으면 열린 말 (q.nextNone)
function questDoneLines(q) {
  const out = [...q.done];
  if (q.next && q.next.length) { const nx = questNextWorld(q.world); if (nx) out.push(...q.next.map((s) => s.replace("{next}", questWorldName(nx)))); else if (q.nextNone) out.push(...q.nextNone); }
  return out;
}
function questAccept(q) {
  const S = questSave();
  if (questState(q) !== "open") return false;
  S.active[q.id] = true;
  if (!S.prog[q.id]) S.prog[q.id] = 0;
  saveProfile();
  showMessage(`새 퀘스트: ${q.title}`, 2.5, false, "#ffe27a");
  if (typeof sfx !== "undefined") sfx.equip();
  return true;
}
function questClaim(q) {
  const S = questSave(), pr = game.profile;
  if (questState(q) !== "ready") return false;
  if (q.goal && q.goal.type === "collect" && questProg(q) < questNeed(q)) return false;
  S.done[q.id] = true; delete S.active[q.id];
  saveProfile(); // 먼저 "다 했어요"를 남겨요 (보상을 두 번 받지 않게)
  const r = q.reward || {}, got = [];
  if (r.emeralds > 0) { pr.emeralds += Math.floor(r.emeralds); got.push(`에메랄드 ${Math.floor(r.emeralds)}개`); }
  if (typeof r.title === "string" && !S.titles.includes(r.title)) { S.titles.push(r.title); got.push(`칭호 "${r.title}"`); }
  if (typeof r.furn === "string") {
    // 퀘스트 저장에도 남겨요: 집이 그 가구를 아직 모르면(또는 집 파일이 없으면) 나중에 집이 읽을 때 놓아요 (house.js profileLoaded)
    S.furn[r.furn] = true;
    if (typeof houseGiveFurn === "function") houseGiveFurn(r.furn);
    const fn = typeof HOUSE_FURN !== "undefined" && HOUSE_FURN[r.furn] ? HOUSE_FURN[r.furn].name : "";
    got.push(fn ? `집 가구 "${fn}"` : "집 가구");
  }
  saveProfile();
  showMessage(`보상: ${got.join(" · ") || "고마워!"}`, 3, false, "#7dffb0");
  if (typeof sfx !== "undefined") sfx.buy();
  hookRun("questDone", q);
  return true;
}

// ----- 대화 창 -----
const qtalk = { g: null, lines: [], i: 0, then: null, t: 0 };
function questDialog(g, lines, then) {
  qtalk.g = g; qtalk.lines = lines.filter((s) => typeof s === "string" && s); qtalk.i = 0; qtalk.then = then || null; qtalk.t = 0;
  if (!qtalk.lines.length) { if (then) then(); return; }
  game.overlay = "qtalk";
  questSay();
}
function questSay() { const s = qtalk.lines[qtalk.i]; if (s && typeof guideSpeak === "function") guideSpeak(s.replace(/[·()]/g, " "), "q:" + s, 99); }
function questNextLine() {
  if (qtalk.t < 0.15) return; // 빠르게 두 번 눌러 건너뛰지 않게
  qtalk.t = 0;
  qtalk.i++;
  if (qtalk.i < qtalk.lines.length) { questSay(); if (typeof sfx !== "undefined") sfx.click(); return; }
  const then = qtalk.then; qtalk.then = null;
  if (game.overlay === "qtalk") game.overlay = null;
  if (typeof guideVoiceStop === "function") guideVoiceStop();
  if (then) then();
}
hookOn("overlayUpdate", (name, dt) => {
  if (name !== "qtalk") return false;
  qtalk.t += dt || 1 / 60;
  if (wasPressed("Escape")) { qtalk.then = null; qtalk.i = qtalk.lines.length; game.overlay = null; if (typeof guideVoiceStop === "function") guideVoiceStop(); return true; }
  if (wasPressed("KeyE", "Enter", "Space", "TouchUse", "TouchAttack")) questNextLine();
  return true;
}, 50);
hookOn("overlayDraw", (name) => {
  if (name !== "qtalk" || !qtalk.g) return false;
  const W = view.w, H = view.h, pw = Math.min(680, W - 20), ph = 150, x0 = (W - pw) / 2, y0 = H - ph - 20;
  drawPanel(x0, y0, pw, ph);
  text(qtalk.g.name, x0 + 20, y0 + 32, 18, "#ffe27a");
  text(`${qtalk.i + 1}/${qtalk.lines.length}`, x0 + pw - 20, y0 + 32, 13, "#aaa", "right");
  const lines = questWrap(qtalk.lines[qtalk.i] || "", pw - 40, 19);
  lines.slice(0, 3).forEach((s, i) => text(s, x0 + 20, y0 + 66 + i * 26, 19, "#fff"));
  text(touch.show ? "눌러서 다음 ▶" : "E / 클릭: 다음 ▶", x0 + pw - 20, y0 + ph - 14, 13, "#7dffb0", "right");
  addUI(0, 0, W, H, questNextLine); // 아무 데나 눌러도 다음
  return true;
}, 50);
// 글자 폭에 맞춰 줄 나누기 (한글은 띄어쓰기로)
function questWrap(s, w, size) {
  ctx.save(); ctx.font = `bold ${size}px sans-serif`;
  const out = []; let cur = "";
  for (const word of String(s).split(" ")) {
    const t = cur ? cur + " " + word : word;
    if (ctx.measureText(t).width > w && cur) { out.push(cur); cur = word; } else cur = t;
  }
  if (cur) out.push(cur);
  ctx.restore();
  return out;
}

// ----- 퀘스트 책 (P 키 · 화면 위 책 단추) -----
const qbook = { tab: "quests", world: null, fresh: false };
function openQuestBook() { qbook.tab = "quests"; qbook.fresh = true; qbook.world = typeof curWorld === "function" ? curWorld() : 1; if (!questsOf(qbook.world).length) qbook.world = questWorlds()[0] || 1; game.overlay = "qbook"; if (typeof sfx !== "undefined") sfx.equip(); }
hookOn("overlayUpdate", (name) => {
  if (name !== "qbook") return false;
  if (qbook.fresh) { qbook.fresh = false; return true; } // 연 그 화면의 P 로 바로 닫히지 않게
  if (wasPressed("Escape", "KeyP")) closeOverlay();
  return true;
}, 50);
hookOn("overlayDraw", (name) => {
  if (name !== "qbook") return false;
  const W = view.w, H = view.h, pw = Math.min(760, W - 16), ph = Math.min(560, H - 16), x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("퀘스트 책", x0 + 20, y0 + 38, 24, "#ffe27a");
  drawButton(x0 + pw - 56, y0 + 10, 42, 38, "✕", closeOverlay, { size: 20 });
  const tabs = [["quests", "이야기"], ["frags", "이야기 조각"]];
  tabs.forEach(([id, label], i) => drawButton(x0 + 150 + i * 128, y0 + 12, 120, 34, label, () => { qbook.tab = id; }, { size: 14, selected: qbook.tab === id }));
  // 월드 고르기 (퀘스트가 있는 월드만)
  const ws = questWorlds();
  let wx = x0 + 20;
  const wy = y0 + 58;
  for (const w of ws) {
    const label = questWorldName(w), bw = Math.min(130, 24 + label.length * 15);
    if (wx + bw > x0 + pw - 16) break;
    drawButton(wx, wy, bw, 30, label, () => { qbook.world = w; }, { size: 13, selected: qbook.world === w });
    wx += bw + 6;
  }
  const top = wy + 42, S = questSave();
  if (qbook.tab === "quests") {
    const qs = questsOf(qbook.world).filter((q) => questState(q) !== "locked");
    const g = QUEST_GIVERS[qbook.world];
    text(g ? `이야기꾼: ${g.name}` : "", x0 + 20, top + 6, 13, "#ccc");
    const doneN = questsOf(qbook.world).filter((q) => S.done[q.id]).length;
    text(`${doneN}/${questsOf(qbook.world).length} 끝`, x0 + pw - 20, top + 6, 13, "#ccc", "right");
    const rowH = Math.max(34, Math.min(46, (y0 + ph - top - 30) / Math.max(6, qs.length)));
    qs.slice(0, Math.floor((y0 + ph - top - 20) / rowH)).forEach((q, i) => {
      const y = top + 16 + i * rowH, st = questState(q);
      const col = st === "done" ? "#8a8" : st === "ready" ? "#7dffb0" : st === "open" ? "#ffe27a" : "#fff";
      const tag = st === "done" ? "✓" : st === "ready" ? "다 했어요!" : st === "open" ? "새 이야기 (이야기꾼에게)" : "하는 중";
      ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(x0 + 16, y, pw - 32, rowH - 4);
      text(`${q.main ? "★" : "·"} ${q.title}`, x0 + 26, y + 17, 15, col);
      text(tag, x0 + pw - 26, y + 17, 12, col, "right");
      if (rowH >= 40) text(`${questGoalText(q)}${st === "active" ? questProgText(q) : ""}`, x0 + 40, y + 34, 12, "#bbb");
    });
    if (!qs.length) text("이야기꾼에게 말을 걸어 봐요!", x0 + 26, top + 40, 15, "#ccc");
    if (S.titles.length) text(`칭호: ${S.titles.slice(-3).join(" · ")}`, x0 + 20, y0 + ph - 14, 13, "#ffd0a0");
  } else {
    const fs = Object.values(QUEST_FRAGS).filter((f) => f.world === qbook.world);
    const got = fs.filter((f) => S.frags[f.id]).length;
    text(`모은 조각 ${got}/${fs.length}`, x0 + 20, top + 6, 13, "#ccc");
    fs.forEach((f, i) => {
      const y = top + 18 + i * 52, has = !!S.frags[f.id];
      if (y + 48 > y0 + ph) return;
      ctx.fillStyle = has ? "rgba(255,226,122,0.10)" : "rgba(255,255,255,0.04)"; ctx.fillRect(x0 + 16, y, pw - 32, 46);
      text(has ? (f.secret ? "??? (읽을 수 없는 글자)" : f.name) : "???", x0 + 28, y + 19, 15, has ? "#ffe27a" : "#777");
      const body = has ? (f.secret ? "알 수 없는 글자가 빛나요. 언젠가 읽을 수 있을까요?" : f.text) : `${questMapName(f.map)} 어딘가에 있대요`;
      text(questWrap(body, pw - 70, 12)[0] || "", x0 + 40, y + 37, 12, "#ccc");
    });
  }
  return true;
}, 50);

// ----- 화면: 책 단추 + 지금 할 일 -----
function questTrackText() {
  const w = typeof curWorld === "function" ? curWorld() : 1;
  const acts = questActiveList().sort((a, b) => (a.world === w ? 0 : 1) - (b.world === w ? 0 : 1) || (b.main ? 1 : 0) - (a.main ? 1 : 0) || a.order - b.order);
  const r = acts.find((q) => questState(q) === "ready");
  if (r) { const g = QUEST_GIVERS[r.world]; return `다 했어요! ${g ? g.name + "에게" : "이야기꾼에게"} 가요`; }
  if (acts.length) return `지금 할 일: ${questGoalText(acts[0])}${questProgText(acts[0])}`;
  const g = QUEST_GIVERS[w];
  if (g && game.scene === "lobby" && questsOf(w).some((q) => questState(q) === "open")) return `${g.name}에게 이야기를 들어 봐요`;
  return "";
}
hookOn("hudDraw", () => {
  if (game.overlay || game.scene === "title" || !game.profile || !game.profile.quests || !questWorlds().length) return;
  const W = view.w;
  drawButton(W - 58, 58, 44, 34, "", openQuestBook, { size: 14 });
  // 펼친 책 그림
  ctx.fillStyle = "#a0302a"; ctx.fillRect(W - 50, 64, 28, 22);
  ctx.fillStyle = "#f2e6c8"; ctx.fillRect(W - 48, 66, 11, 18); ctx.fillRect(W - 35, 66, 11, 18);
  ctx.fillStyle = "#b8a888"; for (let i = 0; i < 3; i++) { ctx.fillRect(W - 46, 70 + i * 4, 7, 1.5); ctx.fillRect(W - 33, 70 + i * 4, 7, 1.5); }
  if (questActiveList().some((q) => questState(q) === "ready")) { ctx.fillStyle = "#7dffb0"; ctx.beginPath(); ctx.arc(W - 20, 64, 5, 0, Math.PI * 2); ctx.fill(); }
  const t = questTrackText();
  if (!t) return;
  const mapBottom = game.scene === "dungeon" && world.mini ? 96 + Math.min(260, W * 0.24, view.h * 0.42) / 2 + 8 : 96;
  const y = Math.max(108, mapBottom + 14);
  const s = t.length > 26 && W < 900 ? 12 : 14;
  ctx.save(); ctx.font = `bold ${s}px sans-serif`; const tw = ctx.measureText(t).width; ctx.restore();
  ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(W - 22 - tw, y - s - 3, tw + 12, s + 9);
  text(t, W - 16, y, s, t.startsWith("다 했어요") ? "#7dffb0" : "#ffe27a", "right");
}, 45);
hookOn("netTick", () => { if (!game.overlay && game.scene !== "title" && game.profile && game.profile.quests && wasPressed("KeyP") && questWorlds().length) openQuestBook(); }, 81);
if (typeof NP_BUSY_WORDS !== "undefined") Object.assign(NP_BUSY_WORDS, { qtalk: "이야기를 듣고", qbook: "퀘스트 책을 보고" });

// ----- 데이터 검사 (시험·개발용): 문제 목록을 돌려줘요 -----
function questValidate() {
  const errs = [], ids = new Set(Object.keys(QUESTS));
  const mapOk = (id) => MAPS.some((m) => m.id === id);
  const lineOk = (s, where) => { if (typeof s !== "string" || !s.trim()) errs.push(`${where}: 빈 대사`); else if (s.length > QUEST_LINE_MAX) errs.push(`${where}: 대사가 길어요 ${s.length}`); else if (/undefined|null|NaN|\{|\}/.test(s.replace("{next}", ""))) errs.push(`${where}: 이상한 글자 ${s}`); };
  for (const q of Object.values(QUESTS)) {
    const g = q.goal || {}, w = `퀘스트 ${q.id}`;
    if (!QUEST_GOAL_TYPES.includes(g.type)) errs.push(`${w}: 목표 종류 ${g.type}`);
    if ((g.type === "clear" || g.type === "boss" || g.type === "fragment") && !mapOk(g.map)) errs.push(`${w}: 맵 ${g.map}`);
    if ((g.type === "kill" || g.type === "coop") && g.map && !mapOk(g.map)) errs.push(`${w}: 맵 ${g.map}`);
    if (g.type === "kill" && g.mon && !Object.hasOwn(MONSTERS, g.mon)) errs.push(`${w}: 몬스터 ${g.mon}`);
    if (g.type === "kill" && g.mon && g.map) { const m = MAPS.find((x) => x.id === g.map); if (!m.monsters || !m.monsters[g.mon]) errs.push(`${w}: ${g.map}에 ${g.mon}이 안 나와요`); }
    if (g.type === "boss" && (typeof BOSS_DEFS === "undefined" || !BOSS_DEFS[g.map])) errs.push(`${w}: 보스 없는 맵 ${g.map}`);
    if (g.type === "fragment") { const f = QUEST_FRAGS[g.frag]; if (!f) errs.push(`${w}: 조각 ${g.frag}`); else if (f.map !== g.map) errs.push(`${w}: 조각 맵이 달라요`); }
    if (g.type === "talk" && !QUEST_TALK_NPCS.includes(g.npc)) errs.push(`${w}: 말 걸 곳 ${g.npc}`);
    if (g.type === "collect" && !QUEST_COLLECT[g.item]) errs.push(`${w}: 모을 것 ${g.item}`);
    if (g.type === "visit" && (g.place || "house") !== "house") errs.push(`${w}: 갈 곳 ${g.place}`);
    for (const m of [g.map]) if (m && mapOk(m) && typeof mapWorld === "function" && mapWorld(MAPS.find((x) => x.id === m)) !== q.world) errs.push(`${w}: 다른 월드 맵 ${m}`);
    for (const r of q.requires || []) if (!ids.has(r)) errs.push(`${w}: 없는 앞 퀘스트 ${r}`);
    if (!QUEST_GIVERS[q.world]) errs.push(`${w}: ${q.world} 월드 이야기꾼이 없어요`);
    if (typeof q.title !== "string" || !q.title || q.title.length > 18) errs.push(`${w}: 제목 ${q.title}`);
    if (!q.intro.length || !q.done.length) errs.push(`${w}: 대사가 없어요`);
    [...q.intro, ...q.done, ...(q.next || []), ...(q.nextNone || [])].forEach((s, i) => lineOk(s, `${w} 대사 ${i + 1}`));
    const r = q.reward || {};
    if (r.emeralds !== undefined && !(r.emeralds > 0 && r.emeralds <= 200)) errs.push(`${w}: 에메랄드 보상 ${r.emeralds}`);
    if (questGoalText(q).includes("undefined")) errs.push(`${w}: 목표 글`);
  }
  // 앞 퀘스트가 돌고 돌지 않게 (DAG)
  const seen = {}, visit = (id, path) => { if (seen[id] === 2) return; if (seen[id] === 1) { errs.push(`앞 퀘스트가 돌아요: ${[...path, id].join(" -> ")}`); return; } seen[id] = 1; for (const r of (QUESTS[id] && QUESTS[id].requires) || []) visit(r, [...path, id]); seen[id] = 2; };
  for (const id of ids) visit(id, []);
  for (const f of Object.values(QUEST_FRAGS)) { if (!mapOk(f.map)) errs.push(`조각 ${f.id}: 맵 ${f.map}`); if (!f.secret) lineOk(f.text, `조각 ${f.id}`); if (!Object.values(QUESTS).some((q) => q.goal && q.goal.frag === f.id)) errs.push(`조각 ${f.id}: 찾는 퀘스트가 없어요`); }
  for (const w of questWorlds()) if (!QUEST_GIVERS[w]) errs.push(`${w} 월드: 이야기꾼이 없어요`);
  return errs;
}
