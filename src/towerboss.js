// ===== 시련의 탑 30층: 탑의 주인 + 탑 보상 =====
// 탑의 주인: 금빛 왕관을 쓴 커다란 돌 왕. 여러 보스의 기술을 섞어 써요 (세 단계)
//   1단계 내려찍기·충격파·부채꼴 탄막·돌진 → 2단계 회전 광선·돌 비·영혼 구슬 → 3단계 종말의 폭발(기둥 뒤에 숨기)·분신·따라오는 낙인
// 탑 보상: 보스 층마다 화폐 + 가끔 그 보스의 전설, 30층을 처음 깨면 "탑의 왕관"(전설 장신구) + 캠프에 금빛 탑 트로피

Object.assign(MONSTERS, {
  towerMaster: { color: "#c9a040", name: "탑의 주인", shape: "towerKing", behavior: "b2_boss", hp: 250, speed: 1.5, damage: 1.15, xp: 90, emerald: 1, emeraldCount: 20, attackRange: 2.1, attackCooldown: 1.8,
    phases: [
      { until: 0.66, abilities: ["slam", "shockRing", "volley", "charge"] },
      { until: 0.33, abilities: ["b2_spinBeams", "meteorRain", "b2_soulOrbs", "blink"] },
      { abilities: ["b2_doomBlast", "b2_clones", "trackingStrike", "nova", "enrage"] },
    ] },
});

// 모양: 돌 몸 + 금 왕관 + 보라 망토 + 빛나는 눈
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.towerKing = (m) => {
  const P = b2Pose(m), stone = "#8a8478", dark = "#5e5a52", gold = "#ffd23f", cape = "#6a3a9a";
  const raise = P.cast, fist = P.strike;
  const parts = [
    { f: 0, s: 0.3, z: 0, w: 0.35, d: 0.35, h: 0.45, c: dark }, { f: 0, s: -0.3, z: 0, w: 0.35, d: 0.35, h: 0.45, c: dark },
    { f: -0.32, s: 0, z: 0.35, w: 0.18, d: 1.1, h: 1.0, c: cape },
    { f: 0, s: 0, z: 0.4 + P.breath, w: 0.95, d: 0.95, h: 0.85, c: stone },
    { f: 0.48, s: 0, z: 0.75, w: 0.08, d: 0.4, h: 0.4, c: gold },
    { f: 0.25 + fist * 0.4, s: 0.66, z: 0.4 + raise * 1.0 - fist * 0.3, w: 0.42, d: 0.42, h: 0.42, c: dark }, { f: 0.25 + fist * 0.4, s: -0.66, z: 0.4 + raise * 1.0 - fist * 0.3, w: 0.42, d: 0.42, h: 0.42, c: dark },
    { f: 0.18, s: 0, z: 1.25 + P.breath, w: 0.62, d: 0.62, h: 0.52, c: stone, face: true, eye: "#ffffff", pupil: "#a060ff" },
    { f: 0.18, s: 0, z: 1.77 + P.breath, w: 0.66, d: 0.66, h: 0.12, c: gold },
    { f: 0.4, s: 0, z: 1.89 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: gold }, { f: 0.18, s: 0.26, z: 1.89 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: gold }, { f: 0.18, s: -0.26, z: 1.89 + P.breath, w: 0.12, d: 0.12, h: 0.2, c: gold },
    { f: 0.4, s: 0, z: 2.0 + P.breath, w: 0.07, d: 0.07, h: 0.07, c: "#ff4a6a" },
  ];
  b2DrawBody(m, parts, { top: 2.2 });
};

// 보스 정의 (보스방 보스와 같은 모양) - 탑 30층에서만 나와요
const TOWER_MASTER_DEF = {
  id: "towerMaster", name: "탑의 주인", title: "시련의 탑 꼭대기", size: 3.3,
  arena: { size: 28, theme: { floor: "#5e5470", moss: "#c9a040", wall: "#4e465e", darkness: 0.45, bg: "#0a0812" },
    build: (w) => b2Pillars(w, [[-4, -4], [4, 4], [-4, 4], [4, -4], [0, -7], [0, 7]]) },
  create: (x, y, level) => b2MakeBoss("towerMaster", x, y, level, 3.3),
};
TOWER_MASTER_DEF.phases = MONSTERS.towerMaster.phases;
TOWER_MASTERS.tower = TOWER_MASTER_DEF;
// 기술 뒤 비틀거림은 다른 보스와 같아요 (B2_STAGGER_AFTER)

// ----- 탑의 왕관 (전설 장신구) -----
defBase("L_tower", { slot: "charm", legend: "tower", name: "탑의 왕관", minL: 0, icon: "crown", color: "#ffd23f", perk: { hearts: 2, dmg: 0.08, speed: 0.05 }, desc: "탑의 주인을 물리친 증표: 하트·공격력·빠르기가 모두 올라요" });
BOSS_LEGENDS.tower = "L_tower";

// ----- 보스 층 보상 -----
// 5~25층: 그 보스의 화폐(보스방보다 조금 적게) + 10% 그 보스의 전설
// 30층: 처음 깨면 탑의 왕관 + 다이아몬드 2, 그 뒤에는 25% 왕관
function towerBossReward(mapId, L) {
  const pr = game.profile;
  const got = [];
  if (mapId !== "tower" && TOWER_MASTERS[mapId] && TOWER_MASTERS[mapId].reward) return TOWER_MASTERS[mapId].reward(L); // 다른 탑의 주인 (seatower.js)
  if (mapId === "tower") {
    const first = !pr.towerCrown;
    pr.towerCrown = (pr.towerCrown || 0) + 1;
    curAdd("gold", 3 + coinCount(2));
    curAdd("diamond", first ? 2 : Math.random() < 0.5 ? 1 : 0);
    if (first || Math.random() < 0.25) { const it = makeLegend("tower", L); if (it) { giveItem(it); got.push(it); } }
    showMessage(first ? "시련의 탑 정복! 탑의 왕관을 받았어요!" : "탑의 주인을 또 물리쳤어요!", 4, true);
  } else {
    const coins = bossCoins(L, false);
    delete coins.diamond; // 다이아몬드는 보스방·30층에서
    for (const [id, n] of Object.entries(coins)) curAdd(id, Math.max(1, Math.round(n * 0.7)));
    if (Math.random() < 0.1) { const it = makeLegend(mapId, L); if (it) { giveItem(it); got.push(it); } }
  }
  return got;
}

// ----- 캠프: 30층을 깨면 금빛 탑 트로피 -----
const TOWER_TROPHY = { x: 4.2, y: 11.4, placed: false };
function towerTrophySpot() {
  if (!TOWER_TROPHY.placed && game.scene === "lobby" && typeof findFreeSpot === "function") { const s = findFreeSpot(4.2, 11.4, 0.45, 3); if (s) { TOWER_TROPHY.x = s.x; TOWER_TROPHY.y = s.y; } TOWER_TROPHY.placed = true; }
  return TOWER_TROPHY;
}
hookOn("lobbyThings", (things) => {
  const pr = game.profile;
  if (!pr.towerCrown || (typeof curWorld === "function" && curWorld() !== 1)) return; // 시련의 탑 트로피는 월드 1 캠프에
  const s = towerTrophySpot();
  things.push({ depth: s.x + s.y, x: s.x, y: s.y, draw: () => {
    drawBox(s.x - 0.32, s.y - 0.32, 0, 0.64, 0.64, 0.18, "#5e5470");
    for (let i = 0; i < 4; i++) { const w = 0.42 - i * 0.08; drawBox(s.x - w / 2, s.y - w / 2, 0.18 + i * 0.28, w, w, 0.28, i % 2 ? "#ffe27a" : "#ffd23f"); }
    if (Math.sin(game.time * 3 + 1) > 0.7) { const c = toScreen(s.x, s.y, 1.5); drawStar(c.x, c.y, 8 * ZOOM, "#fff6c0"); }
  } });
}, 65);
hookOn("lobbyInteractables", (list) => {
  const pr = game.profile;
  if (!pr.towerCrown || (typeof curWorld === "function" && curWorld() !== 1)) return list;
  const s = towerTrophySpot();
  list.push({ x: s.x, y: s.y, range: 1.4, label: "탑 트로피", short: "보기", prompt: "시련의 탑 정복 트로피", action: () => showMessage(`시련의 탑 정복 ${pr.towerCrown}번! 최고 ${pr.towerBest || 0}층`, 3, true) });
  return list;
}, 65);

// 보스 층 카메라: 주인공과 보스 사이 30% 지점 (보스방과 같아요, 보스가 화면 밖으로 안 나가게)
hookOn("cameraTarget", (t, cx, cy) => {
  const T = game.tower, p = game.player;
  if (t || game.mode !== "tower" || !T || !T.boss || T.boss.hp <= 0 || !p || game.overlay === "hero") return t;
  const b = T.boss, d = Math.hypot(b.x - p.x, b.y - p.y), k = d > 12 ? 0.15 : 0.3;
  return { x: p.x + (b.x - p.x) * k, y: p.y + (b.y - p.y) * k };
}, 60);
