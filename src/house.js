// ===== 우리 집 =====
// 캠프에 집이 있어요. 문 앞에서 E: 집 안으로 (캠프 땅 오른쪽 멀리, 빈 곳에 떠 있는 방이에요. 같은 캠프라 같이 하기 친구도 들어와요)
//   집 안: 트로피 홀(월드마다 보스 트로피 + 탑 트로피 · showcase.js 와 탑 파일들), 공용 보관함 상자(hero.js), 도감(showcase.js)
//          침대(하루 한 번 꿈 선물), 꾸미기 책(가구 사기 · 벽지 · 바닥), 산 가구(피아노·어항·곰인형·화분·스탠드·그림·러그)
//   저장: pr.house = { owned: { 가구 id: true }, wall, floor, lamp, slept: "날짜", plant: 자란 정도, plantDay, visited }
//   가구·색은 내 기기 저장이에요. 같이 하기 친구는 자기 집 꾸밈으로 보여요
// 이 파일은 showcase.js 앞에 불러요 (트로피 자리 HOUSE 를 먼저 정해요)

LOBBY.extraW = 31; // 캠프 30칸 + 빈 곳 + 집 방 (world.js buildLobbyWorld)
// 집 안 방: 바닥 x 40~58, y 3~19. 뒤 벽(x 39, y 2)은 높게, 앞 벽(x 59, y 20)은 낮게 (안이 다 보이는 인형집처럼)
const HOUSE = { x0: 40, y0: 3, x1: 59, y1: 20, wallH: 2, inDoor: { x: 40.75, y: 15.5 } };
// 캠프의 집 (밖에서 보는 모양): 바닥 x 21.6~25.4, y 16.3~19.2, 문은 앞쪽(y 큰 쪽)
const HOUSE_OUT = { x: 21.6, y: 16.3, w: 3.8, d: 2.9, h: 1.5 };
const HOUSE_SPOTS = {
  stash: { x: 40.95, y: 13.3 }, codex: { x: 41.5, y: 18.5 }, catalog: { x: 44.2, y: 13.4 }, bed: { x: 57.55, y: 18.45 },
  crown1: { x: 47.4, y: 12.3 }, crown2: { x: 48.9, y: 12.3 }, crown3: { x: 50.4, y: 12.3 }, crown4: { x: 51.9, y: 12.3 },
};
function houseSpot(id) { return HOUSE_SPOTS[id]; }
function houseDoorOut() { const O = HOUSE_OUT; return { x: O.x + O.w / 2, y: O.y + O.d }; }
function houseInside(q) { const H = HOUSE; return !!q && q.x > H.x0 - 1 && q.x < H.x1 + 1 && q.y > H.y0 - 1 && q.y < H.y1 + 1; }

// ----- 저장 -----
hookOn("profileLoaded", (pr) => {
  const h = (pr.house = pr.house && typeof pr.house === "object" ? pr.house : {});
  if (!h.owned || typeof h.owned !== "object") h.owned = {};
  for (const k of Object.keys(h.owned)) if (!HOUSE_FURN[k]) delete h.owned[k];
  h.wall = Number.isInteger(h.wall) && HOUSE_WALLS[h.wall] ? h.wall : 0;
  h.floor = Number.isInteger(h.floor) && HOUSE_FLOORS[h.floor] ? h.floor : 0;
  h.lamp = h.lamp !== false;
  h.plant = Math.max(0, Math.min(3, Math.floor(Number(h.plant) || 0)));
  if (typeof h.slept !== "string") h.slept = "";
  if (typeof h.plantDay !== "string") h.plantDay = "";
}, 55);
function houseData() { return game.profile.house; }
function houseToday() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }

// ----- 벽지·바닥 -----
const HOUSE_WALLS = [
  { name: "나무", c: "#9a7448" }, { name: "하늘", c: "#6f9fd0" }, { name: "분홍", c: "#d98aa8" },
  { name: "민트", c: "#6fbfa0" }, { name: "보라", c: "#8a72c0" }, { name: "햇살", c: "#d8b860" },
];
const HOUSE_FLOORS = [
  { name: "나무 마루", a: "#a77b45", b: "#956b3a" }, { name: "바둑 타일", a: "#e2dac8", b: "#b9ab8e" },
  { name: "푸른 타일", a: "#86aed0", b: "#7097bb" }, { name: "분홍 카펫", a: "#e3a8bf", b: "#d898b2" }, { name: "풀밭 카펫", a: "#8fbf6a", b: "#82b25e" },
];
function houseFloorAt(x, y, v) {
  const H = HOUSE;
  if (x < H.x0 || x >= H.x1 || y < H.y0 || y >= H.y1) return null;
  const f = HOUSE_FLOORS[houseData().floor] || HOUSE_FLOORS[0];
  const c = houseData().floor === 1 ? ((x + y) % 2 ? f.a : f.b) : (y % 2 ? f.a : f.b); // 바둑 타일은 바둑판, 나머지는 줄무늬
  return shade(c, 0.95 + Math.round(v * 3) / 3 * 0.08);
}
function houseWallAt(tx, ty) {
  const H = HOUSE;
  if (tx < H.x0 - 1 || tx > H.x1 || ty < H.y0 - 1 || ty > H.y1) return null;
  return (HOUSE_WALLS[houseData().wall] || HOUSE_WALLS[0]).c;
}
hookOn("lobbyWorldBuilt", () => {
  const H = HOUSE, T = world.tiles;
  for (let ty = H.y0 - 1; ty <= H.y1; ty++) for (let tx = H.x0 - 1; tx <= H.x1; tx++) {
    if (!T[ty] || tx >= world.W) continue;
    T[ty][tx] = tx === H.x0 - 1 || ty === H.y0 - 1 ? H.wallH : tx === H.x1 || ty === H.y1 ? LOW_WALL : 0;
  }
  world.floorAt = houseFloorAt;
  world.wallAt = houseWallAt;
  const d = houseDoorOut();
  carvePath(lobby.fire.x, lobby.fire.y, d.x, d.y + 0.6); // 모닥불에서 집 문까지 흙길
});

// ----- 가구 (꾸미기 책에서 에메랄드로 사요) -----
//   x, y: 집 안 자리 · r: 부딪히는 크기(0 이면 밟고 지나가요) · use: E 로 하는 것
const HOUSE_FURN = {
  rug:      { name: "동그라미 러그", price: 4, x: 49.6, y: 16.2, r: 0, desc: "방 가운데 폭신한 러그" },
  plant:    { name: "화분", price: 3, x: 58.15, y: 12.7, r: 0.3, desc: "하루 한 번 물 주면 자라서 꽃이 펴요", use: "물 주기" },
  lamp:     { name: "스탠드", price: 5, x: 58.2, y: 15.0, r: 0.25, desc: "켜고 끌 수 있는 따뜻한 불빛", use: "켜기·끄기" },
  teddy:    { name: "곰인형", price: 6, x: 46.2, y: 19.25, r: 0.3, desc: "꼭 안아 주면 하트가 퐁퐁", use: "안아 주기" },
  painting: { name: "그림 액자", price: 8, x: 40.0, y: 11.6, r: 0, desc: "벽에 거는 산과 해 그림", use: "보기" },
  fishtank: { name: "어항", price: 12, x: 54.7, y: 12.55, r: 0.55, desc: "물고기 세 마리. 밥을 주면 신나게 헤엄쳐요", use: "밥 주기" },
  piano:    { name: "피아노", price: 15, x: 51.7, y: 19.15, r: 0.6, desc: "E 를 누를 때마다 노래 한 소절", use: "연주하기" },
};
const HOUSE_FURN_ORDER = ["plant", "rug", "lamp", "teddy", "painting", "fishtank", "piano"];
function houseOwns(id) { return !!(game.profile && game.profile.house && game.profile.house.owned[id]); }
function houseBuy(id) {
  const f = HOUSE_FURN[id], pr = game.profile;
  if (!f || houseOwns(id)) return false;
  if (pr.emeralds < f.price) { house.note = `에메랄드가 ${f.price - pr.emeralds}개 모자라요`; house.noteC = "#ff9090"; sfx.denied(); return false; }
  pr.emeralds -= f.price;
  pr.house.owned[id] = true;
  if (f.r && world.solids) world.solids.push({ x: f.x, y: f.y, r: f.r });
  saveProfile();
  house.note = `${josa(f.name, "을/를")} 집에 놓았어요!`; house.noteC = "#7dffb0";
  sfx.buy();
  return true;
}

// ----- 집 들어가기 / 나가기 -----
const house = { note: "", noteC: "#ddd", fish: 0, sleepT: 0, sleepMsg: "", tune: 0, hugT: 0 };
// 내 기기에서 움직이는 주인공들 (둘이 하기면 둘 다, 같이 하기면 나만)
function houseLocalPlayers() { return allPlayers().filter((q) => q && !q.remote); }
function houseMove(spot, faceX, faceY) {
  houseLocalPlayers().forEach((q, i) => {
    const s = findFreeSpot(spot.x + (i % 2) * 0.6, spot.y + Math.floor(i / 2) * 0.6, q.r || 0.3, 2) || spot;
    q.x = s.x; q.y = s.y; q.faceX = faceX; q.faceY = faceY;
  });
  camera.x = game.player.x; camera.y = game.player.y;
}
// 같이 하기 친구는 방장에게 부탁해요 (방장이 친구 자리를 정해요: 먼 순간이동은 방장만 허락해요)
function houseGuestAsk(go) { return typeof netGuest === "function" && netGuest() && typeof netGuestAsk === "function" && netGuestAsk("house", { go }); }
hookOn("netHostReq", (slot, w, d) => {
  if (w !== "house" || game.scene !== "lobby") return false;
  const q = allPlayers().find((x) => x.pid === slot && x.remote);
  if (!q || !(q.hp > 0)) return true;
  const door = houseDoorOut(), inD = HOUSE.inDoor;
  let to = null;
  if (d.go === "in" && Math.hypot(q.x - door.x, q.y - door.y - 0.45) < 2.6) to = { x: inD.x + 0.4, y: inD.y + 0.5 };
  else if (d.go === "out" && Math.hypot(q.x - inD.x, q.y - inD.y) < 2.6) to = { x: door.x + 0.5, y: door.y + 0.75 };
  if (!to) return true;
  const s = findFreeSpot(to.x, to.y, q.r || 0.3, 2) || to;
  q.x = s.x; q.y = s.y;
  if (typeof netWarpSlot === "function") netWarpSlot(slot);
  return true;
}, 50);
function houseEnter() {
  if (houseGuestAsk("in")) { houseWelcome(); return; }
  houseMove({ x: HOUSE.inDoor.x + 0.4, y: HOUSE.inDoor.y }, 1, 0);
  houseWelcome();
}
function houseWelcome() {
  sfx.stairs();
  const h = houseData();
  if (!h.visited) { h.visited = true; saveProfile(); showMessage("우리 집이에요! 트로피·보관함·도감이 여기 있어요. 꾸미기 책으로 가구를 사요", 4.5); }
  else showMessage("우리 집", 1.4);
}
function houseExit() {
  if (houseGuestAsk("out")) { sfx.stairs(); return; }
  const d = houseDoorOut();
  houseMove({ x: d.x, y: d.y + 0.75 }, 0, 1);
  sfx.stairs();
}

// ----- 그리기: 캠프의 집 -----
function drawHouseOutside() {
  const O = HOUSE_OUT, wall = (HOUSE_WALLS[houseData().wall] || HOUSE_WALLS[0]).c;
  const x = O.x, y = O.y, w = O.w, d = O.d, h = O.h;
  ctx.save();
  if (houseHides()) ctx.globalAlpha = 0.4; // 집 뒤에 숨은 주인공이 보이게 반투명
  drawBox(x - 0.1, y - 0.1, 0, w + 0.2, d + 0.2, 0.22, "#8c8378");        // 돌 바닥
  drawBox(x, y, 0.22, w, d, h, wall);                                       // 벽
  for (const cx of [x + 0.02, x + w - 0.14]) drawBox(cx, y + d - 0.12, 0.22, 0.12, 0.12, h, "#6b4a2a"); // 기둥
  // 문 (앞쪽 가운데)
  const dx = x + w / 2 - 0.35;
  drawBox(dx, y + d, 0.22, 0.7, 0.04, 1.05, "#6b4a2a");
  drawBox(dx + 0.52, y + d + 0.03, 0.6, 0.08, 0.03, 0.08, "#ffd23f");
  // 창문 (앞쪽 양옆 + 오른쪽 벽)
  const lit = "#ffe9a8";
  for (const wx of [x + 0.35, x + w - 1.05]) { drawBox(wx, y + d, 0.72, 0.7, 0.03, 0.5, "#5a3a22"); drawBox(wx + 0.06, y + d + 0.01, 0.78, 0.58, 0.03, 0.38, lit); }
  drawBox(x + w, y + 0.9, 0.72, 0.03, 1.1, 0.5, "#5a3a22"); drawBox(x + w + 0.01, y + 0.96, 0.78, 0.03, 0.98, 0.38, lit);
  // 지붕: 블록 계단 (앞뒤로 내려가는 박공)
  const roofC = "#b04a3a", top = 0.22 + h;
  for (let i = 0; i < 4; i++) {
    const inset = i * 0.42;
    drawBox(x - 0.25, y - 0.25 + inset, top + i * 0.32, w + 0.5, d + 0.5 - inset * 2, 0.32, shade(roofC, 1 - i * 0.06));
  }
  // 굴뚝 + 연기
  drawBox(x + w - 0.9, y + 0.35, top + 0.3, 0.45, 0.45, 1.25, "#8c8378");
  ctx.save(); // 연기 세 덩이가 천천히 올라가요
  for (let i = 0; i < 3; i++) { const k = (game.time * 0.35 + i / 3) % 1; ctx.globalAlpha = 0.45 * (1 - k); const sz = 0.18 + k * 0.25; drawBox(x + w - 0.68 - sz / 2 + k * 0.3, y + 0.58 - sz / 2, top + 1.6 + k * 1.4, sz, sz, sz, "#d8d8d8"); }
  ctx.restore();
  ctx.restore();
  if (!houseData().visited && Math.sin(game.time * 4) > 0.5) { const s = toScreen(x + w / 2, y + d, 2.2); drawStar(s.x, s.y, 9 * ZOOM, "#ffe27a"); }
}
// 내 기기 주인공이 집 뒤(화면에서 집에 가리는 자리)에 있나
function houseHides() {
  const O = HOUSE_OUT;
  return houseLocalPlayers().some((q) => q.x < O.x + O.w + 0.2 && q.y < O.y + O.d + 0.2 && q.x > O.x - 2.6 && q.y > O.y - 3.2 && q.x + q.y < O.x + O.y + O.w + O.d);
}

// ----- 그리기: 집 안 -----
function drawHouseDoorIn() {
  const y = HOUSE.inDoor.y - 0.5;
  drawBox(HOUSE.x0 - 0.02, y, 0, 0.05, 1.0, 1.6, "#6b4a2a");
  drawBox(HOUSE.x0, y + 0.08, 0.06, 0.04, 0.84, 1.45, "#8a6038");
  drawBox(HOUSE.x0 + 0.02, y + 0.15, 0.72, 0.05, 0.1, 0.1, "#ffd23f");
  drawBox(HOUSE.x0, y - 0.05, 0, 0.75, 1.1, 0.02, "#7a3a3a"); // 문 앞 깔개
}
function drawHouseStash() {
  const s = HOUSE_SPOTS.stash;
  drawBox(s.x - 0.35, s.y - 0.25, 0, 0.7, 0.5, 0.42, "#6a4a8a");
  drawBox(s.x - 0.37, s.y - 0.27, 0.42, 0.74, 0.54, 0.12, "#8a6ac0");
  drawBox(s.x + 0.32, s.y - 0.05, 0.28, 0.05, 0.1, 0.12, "#ffd23f");
}
function drawHouseCatalog() {
  const s = HOUSE_SPOTS.catalog;
  drawBox(s.x - 0.45, s.y - 0.3, 0, 0.9, 0.6, 0.55, "#7a5530");
  drawBox(s.x - 0.48, s.y - 0.33, 0.55, 0.96, 0.66, 0.06, "#9a6e40");
  drawBox(s.x - 0.28, s.y - 0.2, 0.61, 0.5, 0.38, 0.06, "#e86a8a"); // 꾸미기 책 (분홍 표지)
  drawBox(s.x - 0.26, s.y - 0.18, 0.67, 0.46, 0.34, 0.01, "#ffd0dc");
  if (Math.sin(game.time * 3) > 0.75) { const c = toScreen(s.x, s.y, 1.0); drawStar(c.x, c.y, 6 * ZOOM, "#ffb0c8"); }
}
function drawHouseBed() {
  const s = HOUSE_SPOTS.bed, x = s.x - 0.65, y = s.y - 1.1;
  drawBox(x, y, 0, 1.3, 2.2, 0.32, "#7a5530");                 // 틀
  drawBox(x, y, 0, 1.3, 0.16, 0.9, "#6b4a2a");                 // 머리판
  drawBox(x + 0.05, y + 0.15, 0.32, 1.2, 2.0, 0.14, "#f4f0e6"); // 매트리스
  drawBox(x + 0.18, y + 0.24, 0.46, 0.94, 0.4, 0.12, "#ffffff"); // 베개
  drawBox(x + 0.04, y + 0.85, 0.46, 1.22, 1.32, 0.08, "#5a8ad0"); // 이불
  drawBox(x + 0.04, y + 0.85, 0.54, 1.22, 0.14, 0.02, "#8ab4f0");
  if (house.sleepT > 0) { const c = toScreen(s.x, s.y - 0.6, 1.1 + (game.time % 1.2)); text("Z", c.x, c.y, Math.round(10 * ZOOM), "#cfe0ff", "center"); }
}
function drawHouseCrownStand(i) {
  const s = HOUSE_SPOTS["crown" + i];
  drawBox(s.x - 0.3, s.y - 0.3, 0, 0.6, 0.6, 0.16, "#5e5470");
}
// 가구 그림
const HOUSE_DRAW = {
  rug(f) {
    drawBox(f.x - 1.7, f.y - 1.1, 0, 3.4, 2.2, 0.025, "#c0504a");
    drawBox(f.x - 1.5, f.y - 0.9, 0.025, 3.0, 1.8, 0.01, "#e8c060");
    drawBox(f.x - 1.2, f.y - 0.6, 0.035, 2.4, 1.2, 0.01, "#c0504a");
  },
  plant(f) {
    const g = houseData().plant; // 0~3 자란 정도
    drawBox(f.x - 0.2, f.y - 0.2, 0, 0.4, 0.4, 0.32, "#b8643a");
    drawBox(f.x - 0.17, f.y - 0.17, 0.32, 0.34, 0.34, 0.03, "#5a3a22");
    const hgt = 0.25 + g * 0.18;
    drawBox(f.x - 0.03, f.y - 0.03, 0.35, 0.06, 0.06, hgt, "#4a8a3a");
    drawBox(f.x - 0.16, f.y - 0.16, 0.35 + hgt * 0.5, 0.32, 0.32, 0.16, "#5aa548");
    drawBox(f.x - 0.13, f.y - 0.13, 0.35 + hgt, 0.26, 0.26, 0.16, "#6cbf55");
    if (g >= 2) for (const [ox, oy] of [[-0.12, 0.05], [0.1, -0.08], [0.02, 0.12]]) drawBox(f.x + ox - 0.05, f.y + oy - 0.05, 0.5 + hgt, 0.1, 0.1, 0.08, g >= 3 ? "#ff7aa8" : "#ffdf5a");
  },
  lamp(f) {
    drawBox(f.x - 0.15, f.y - 0.15, 0, 0.3, 0.3, 0.05, "#5a4632");
    drawBox(f.x - 0.03, f.y - 0.03, 0.05, 0.06, 0.06, 1.0, "#5a4632");
    drawBox(f.x - 0.2, f.y - 0.2, 1.0, 0.4, 0.4, 0.3, houseData().lamp ? "#ffe6a0" : "#c8b890");
  },
  teddy(f) {
    const hug = house.hugT > 0 ? Math.sin(house.hugT * 20) * 0.03 : 0;
    drawBox(f.x - 0.2, f.y - 0.16, 0, 0.4, 0.32, 0.36 + hug, "#b07a48");             // 몸
    drawBox(f.x - 0.16, f.y - 0.14, 0.36 + hug, 0.32, 0.28, 0.28, "#c08a58");         // 머리
    for (const ox of [-0.16, 0.1]) drawBox(f.x + ox, f.y - 0.1, 0.6 + hug, 0.08, 0.08, 0.08, "#b07a48"); // 귀
    drawBox(f.x - 0.06, f.y + 0.14, 0.44 + hug, 0.12, 0.02, 0.06, "#7a4a28");         // 코
    drawBox(f.x - 0.08, f.y + 0.16, 0.2, 0.16, 0.02, 0.06, "#ff8ab0");                // 리본
  },
  painting(f) {
    const x = HOUSE.x0 - 0.02, y = f.y - 0.6;
    drawBox(x, y, 0.75, 0.05, 1.2, 0.85, "#c9a24a");
    drawBox(x + 0.01, y + 0.07, 0.82, 0.05, 1.06, 0.71, "#8fd0ff");
    drawBox(x + 0.02, y + 0.07, 0.82, 0.05, 1.06, 0.26, "#5aa548");
    drawBox(x + 0.03, y + 0.35, 1.08, 0.05, 0.42, 0.12, "#4a8a3a");
    drawBox(x + 0.03, y + 0.75, 1.25, 0.05, 0.16, 0.16, "#ffd23f");
  },
  fishtank(f) {
    drawBox(f.x - 0.55, f.y - 0.3, 0, 1.1, 0.6, 0.55, "#6b4a2a");
    ctx.save(); ctx.globalAlpha = 0.55;
    drawBox(f.x - 0.5, f.y - 0.26, 0.55, 1.0, 0.52, 0.6, "#5ab8e8");
    ctx.restore();
    const fast = house.fish > 0 ? 3 : 1;
    ["#ff8a3a", "#ffd23f", "#ff6aa0"].forEach((c, i) => {
      const t = game.time * (0.8 + i * 0.25) * fast + i * 2.1, fx = f.x + Math.sin(t) * 0.35, fz = 0.7 + i * 0.13 + Math.sin(t * 1.7) * 0.05;
      drawBox(fx - 0.06, f.y - 0.04 + (i - 1) * 0.12, fz, 0.12, 0.08, 0.07, c);
    });
    drawBox(f.x - 0.52, f.y - 0.28, 1.15, 1.04, 0.56, 0.04, "#3a5a6a");
    if (Math.random() < (house.fish > 0 ? 0.3 : 0.04)) addSparkle(f.x + (Math.random() - 0.5) * 0.8, f.y, 0.7, { vz: 0.6, life: 0.7, size: 0.25, hue: 195 });
  },
  piano(f) {
    const x = f.x - 0.9, y = f.y - 0.35;
    drawBox(x, y, 0, 1.8, 0.7, 0.85, "#2a2a32");
    drawBox(x, y, 0.85, 1.8, 0.3, 0.45, "#34343e");
    drawBox(x + 0.05, y + 0.3, 0.86, 1.7, 0.36, 0.04, "#f4f4f4");
    for (let i = 0; i < 9; i++) if (i % 7 !== 2 && i % 7 !== 6) drawBox(x + 0.2 + i * 0.18, y + 0.3, 0.9, 0.08, 0.2, 0.04, "#1a1a1a");
    drawBox(x - 0.05 + 0.55, y + 0.9, 0, 0.7, 0.35, 0.45, "#3a2a1a"); // 의자
  },
};

hookOn("lobbyThings", (things) => {
  // 부딪히는 자리 (캠프를 새로 만들 때마다 한 번)
  if (world.solids && !world.solids.__house) {
    world.solids.__house = true;
    const O = HOUSE_OUT;
    for (let yy = O.y + 0.25; yy <= O.y + O.d - 0.2; yy += 0.45) for (let xx = O.x + 0.25; xx <= O.x + O.w - 0.2; xx += 0.45) world.solids.push({ x: xx, y: yy, r: 0.3 });
    const S = HOUSE_SPOTS;
    world.solids.push({ x: S.stash.x, y: S.stash.y, r: 0.38 }, { x: S.catalog.x, y: S.catalog.y, r: 0.42 });
    for (let k = 0; k < 4; k++) world.solids.push({ x: S.bed.x, y: S.bed.y - 0.8 + k * 0.55, r: 0.55 });
    for (let i = 1; i <= 4; i++) world.solids.push({ x: S["crown" + i].x, y: S["crown" + i].y, r: 0.3 });
    for (const id of HOUSE_FURN_ORDER) { const f = HOUSE_FURN[id]; if (f.r && houseOwns(id)) world.solids.push({ x: f.x, y: f.y, r: f.r }); }
  }
  const O = HOUSE_OUT;
  // 집 앞(문 쪽·오른쪽)에 선 주인공보다는 먼저 그려요 (주인공을 덮지 않게)
  let depth = O.x + O.y + O.w + O.d - 0.5;
  for (const q of allPlayers()) if (q && (q.y > O.y + O.d - 0.05 || q.x > O.x + O.w - 0.05) && Math.abs(q.x - (O.x + O.w / 2)) < 4 && Math.abs(q.y - (O.y + O.d / 2)) < 4) depth = Math.min(depth, q.x + q.y - 0.03);
  things.push({ depth, x: O.x, y: O.y, draw: drawHouseOutside });
  // 집 안 (보일 때만)
  const cx = (HOUSE.x0 + HOUSE.x1) / 2, cy = (HOUSE.y0 + HOUSE.y1) / 2;
  if (!onScreen(cx, cy, 16)) return;
  const S = HOUSE_SPOTS;
  things.push({ depth: HOUSE.x0 + HOUSE.inDoor.y + 0.1, x: HOUSE.x0, y: HOUSE.inDoor.y, draw: drawHouseDoorIn });
  things.push({ depth: S.stash.x + S.stash.y, x: S.stash.x, y: S.stash.y, draw: drawHouseStash });
  things.push({ depth: S.catalog.x + S.catalog.y, x: S.catalog.x, y: S.catalog.y, draw: drawHouseCatalog });
  things.push({ depth: S.bed.x + S.bed.y + 0.6, x: S.bed.x, y: S.bed.y, draw: drawHouseBed });
  for (let i = 1; i <= 4; i++) things.push({ depth: S["crown" + i].x + S["crown" + i].y - 0.01, x: S["crown" + i].x, y: S["crown" + i].y, draw: () => drawHouseCrownStand(i) });
  for (const id of HOUSE_FURN_ORDER) {
    if (!houseOwns(id)) continue;
    const f = HOUSE_FURN[id];
    const dep = id === "rug" ? 0 : id === "painting" ? HOUSE.x0 + f.y + 0.15 : f.x + f.y; // 러그는 바닥처럼 맨 먼저
    things.push({ depth: dep, x: f.x, y: f.y, draw: () => HOUSE_DRAW[id](f) });
  }
}, 62);

hookOn("lights", (lights) => {
  if (game.scene !== "lobby") return;
  const H = HOUSE;
  lights.push({ x: (H.x0 + H.x1) / 2, y: (H.y0 + H.y1) / 2, radius: 15, power: 1 });
  if (houseOwns("lamp") && houseData().lamp) lights.push({ x: HOUSE_FURN.lamp.x, y: HOUSE_FURN.lamp.y, radius: 4.5, power: 0.9 });
  const O = HOUSE_OUT; lights.push({ x: O.x + O.w / 2, y: O.y + O.d + 0.5, radius: 2.6, power: 0.55 }); // 창문 불빛
});

// ----- 이름표 -----
function drawHouseLabels() {
  if (game.scene !== "lobby" || game.overlay) return;
  const p = game.player; if (!p) return;
  const O = HOUSE_OUT;
  if (!houseInside(p) && Math.hypot(p.x - (O.x + O.w / 2), p.y - (O.y + O.d / 2)) < 7) { const s = toScreen(O.x + O.w / 2, O.y + O.d / 2, 3.4); text("우리 집", s.x, s.y, 14 * ZOOM * 0.8, "#ffe27a", "center"); }
  if (houseInside(p) && typeof drawTrophyHallLabels === "function") drawTrophyHallLabels(); // 월드 이름 팻말 (벽에 가리지 않게 맨 위에)
}

// ----- E 로 쓰는 것 -----
hookOn("lobbyInteractables", (list) => {
  const d = houseDoorOut(), S = HOUSE_SPOTS;
  list.push({ x: d.x, y: d.y + 0.45, range: 1.3, label: "우리 집", short: "집", prompt: "집에 들어가기", action: houseEnter });
  list.push({ x: HOUSE.inDoor.x, y: HOUSE.inDoor.y, range: 1.2, label: "문", short: "나가기", prompt: "캠프로 나가기", action: houseExit });
  list.push({ x: S.stash.x, y: S.stash.y, range: 1.5, label: "공용 보관함", short: "보관함", prompt: "공용 보관함 열기", action: () => openHero("stash") });
  list.push({ x: S.catalog.x, y: S.catalog.y, range: 1.5, label: "꾸미기 책", short: "꾸미기", prompt: "집 꾸미기 (가구·벽지·바닥)", action: openHouseCatalog });
  list.push({ x: S.bed.x - 0.9, y: S.bed.y, range: 1.6, label: "침대", short: "자기", prompt: houseData().slept === houseToday() ? "침대에서 쉬기 (오늘 꿈 선물은 받았어요)" : "침대에서 자기 (하루 한 번 꿈 선물!)", action: houseSleep });
  for (const id of HOUSE_FURN_ORDER) {
    const f = HOUSE_FURN[id];
    if (!f.use || !houseOwns(id)) continue;
    const at = id === "painting" ? { x: HOUSE.x0 + 0.7, y: f.y } : id === "piano" ? { x: f.x, y: f.y - 0.6 } : f;
    list.push({ x: at.x, y: at.y, range: id === "fishtank" || id === "piano" ? 1.5 : 1.2, label: f.name, short: f.use.split("·")[0].slice(0, 3), prompt: houseUsePrompt(id), action: () => houseUse(id) });
  }
  return list;
}, 60);
// 아직 없는 탑 트로피 받침대: 어떻게 받는지 알려줘요
const HOUSE_CROWNS = [
  { name: "시련의 탑", has: () => game.profile.towerCrown },
  { name: "심해 탑", has: () => game.profile.seaTowerCrown },
  { name: "달빛 탑", has: () => typeof towerCrownCount === "function" && towerCrownCount("moontower") },
  { name: "지하 탑", has: () => typeof underTowerCrowns === "function" && underTowerCrowns() },
];
hookOn("lobbyInteractables", (list) => {
  HOUSE_CROWNS.forEach((c, i) => {
    if (c.has()) return;
    const s = HOUSE_SPOTS["crown" + (i + 1)];
    list.push({ x: s.x, y: s.y, range: 1.0, label: "빈 받침대", short: "보기", prompt: `${c.name} 트로피 자리`, action: () => showMessage(`빈 받침대: ${josa(c.name, "을/를")} 끝까지 오르면 트로피가 와요`, 2.6) });
  });
  return list;
}, 66);
function houseUsePrompt(id) {
  const f = HOUSE_FURN[id], h = houseData();
  if (id === "lamp") return h.lamp ? "스탠드 끄기" : "스탠드 켜기";
  if (id === "plant") return h.plantDay === houseToday() ? "화분 (오늘 물은 줬어요)" : h.plant >= 3 ? "화분에 물 주기 (꽃이 활짝!)" : "화분에 물 주기";
  return `${f.name} ${f.use}`;
}
const HOUSE_TUNES = [
  [523, 587, 659, 523], [659, 698, 784, 659], [392, 523, 659, 784], [784, 659, 523, 392], [523, 523, 784, 784, 880, 880, 784],
];
function houseUse(id) {
  const f = HOUSE_FURN[id], h = houseData();
  if (id === "lamp") { h.lamp = !h.lamp; saveProfile(); tone(h.lamp ? 880 : 440, 0.05, "square", 0.04); return; }
  if (id === "plant") {
    if (h.plantDay === houseToday()) { showMessage("오늘은 물을 줬어요. 내일 또 줘요!", 2); return; }
    h.plantDay = houseToday(); h.plant = Math.min(3, h.plant + 1); saveProfile();
    for (let i = 0; i < 8; i++) addSparkle(f.x + (Math.random() - 0.5) * 0.4, f.y, 0.6 + Math.random() * 0.5, { vz: -0.5, life: 0.6, size: 0.3, hue: 200 });
    sfx.splash();
    showMessage(h.plant >= 3 ? "화분에 꽃이 활짝 폈어요!" : h.plant === 2 ? "꽃봉오리가 생겼어요! 내일 또 물 줘요" : "쑥쑥! 내일 또 물 줘요", 2.4);
    return;
  }
  if (id === "teddy") {
    house.hugT = 0.6;
    for (let i = 0; i < 4; i++) addFloatText(f.x + (Math.random() - 0.5) * 0.6, f.y, "♥", "#ff8ab0", 16);
    tone(660, 0.12, "sine", 0.05, 880);
    return;
  }
  if (id === "fishtank") {
    house.fish = 3;
    for (let i = 0; i < 6; i++) addSparkle(f.x + (Math.random() - 0.5) * 0.6, f.y, 1.25, { vz: -0.4, life: 0.8, size: 0.25, gold: true });
    tone(1200, 0.06, "sine", 0.04, 1600);
    showMessage("물고기들이 신났어요!", 1.6);
    return;
  }
  if (id === "piano") {
    const t = HOUSE_TUNES[house.tune++ % HOUSE_TUNES.length];
    t.forEach((fr, i) => tone(fr, 0.22, "triangle", 0.07, null, i * 0.2));
    for (let i = 0; i < 3; i++) addFloatText(f.x + (i - 1) * 0.4, f.y, "♪", "#ffe27a", 16);
    return;
  }
  if (id === "painting") { showMessage("햇빛 땅의 산과 해 그림이에요", 2); return; }
}

// ----- 침대: 하루 한 번 꿈 선물 -----
function houseSleep() {
  if (house.sleepT > 0) return;
  house.sleepT = 2.6;
  game.overlay = "sleep";
  for (const q of houseLocalPlayers()) q.hp = q.maxHp;
  tone(392, 0.4, "sine", 0.05); tone(330, 0.5, "sine", 0.05, null, 0.4);
  const h = houseData(), pr = game.profile;
  if (h.slept === houseToday()) { house.sleepMsg = "푹 쉬었어요! (꿈 선물은 하루에 한 번, 내일 또 와요)"; return; }
  h.slept = houseToday();
  // 꿈 선물: 에메랄드 / 물약 / 화살 중 하나
  const r = Math.random();
  if (r < 0.5 || (pr.potions >= CONFIG.player.maxPotions && pr.arrows >= CONFIG.player.maxArrows)) { const n = 4 + Math.floor(Math.random() * 6); pr.emeralds += n; house.sleepMsg = `꿈 선물: 에메랄드 ${n}개!`; }
  else if (r < 0.75 && pr.potions < CONFIG.player.maxPotions) { pr.potions += 1; house.sleepMsg = "꿈 선물: 물약 1개!"; }
  else { const n = Math.min(15, CONFIG.player.maxArrows - pr.arrows); if (n > 0) { pr.arrows += n; house.sleepMsg = `꿈 선물: 화살 ${n}개!`; } else { pr.emeralds += 5; house.sleepMsg = "꿈 선물: 에메랄드 5개!"; } }
  saveProfile();
}
hookOn("overlayUpdate", (name, dt) => {
  if (name !== "sleep") return false;
  house.sleepT -= dt || 1 / 60;
  if (house.sleepT <= 0) { house.sleepT = 0; game.overlay = null; showMessage(house.sleepMsg, 3, false, "#7dffb0"); }
  return true;
}, 50);
hookOn("overlayDraw", (name) => {
  if (name !== "sleep") return false;
  const W = view.w, H = view.h, t = house.sleepT, a = t > 1.6 ? (2.6 - t) : t > 0.8 ? 1 : t / 0.8;
  ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a)) * 0.92; ctx.fillStyle = "#0a0f24"; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (t > 0.6) text("Z z z", W / 2, H / 2 - 20 - (2.6 - t) * 12, 34, "#cfe0ff", "center");
  else { text("좋은 아침!", W / 2, H / 2 - 20, 30, "#ffe27a", "center"); text(house.sleepMsg, W / 2, H / 2 + 20, 18, "#7dffb0", "center"); }
  return true;
}, 50);
// 시간 줄이기
hookOn("playersUpdated", (dt) => {
  if (house.fish > 0) house.fish -= dt;
  if (house.hugT > 0) house.hugT -= dt;
}, 60);

// ----- 꾸미기 책 (창) -----
function openHouseCatalog() { game.overlay = "house"; house.note = ""; sfx.equip(); }
hookOn("overlayUpdate", (name) => {
  if (name !== "house") return false;
  if (wasPressed("Escape")) closeOverlay();
  return true;
}, 50);
hookOn("overlayDraw", (name) => {
  if (name !== "house") return false;
  const cols = view.w > 640 ? 2 : 1, rows = Math.ceil(HOUSE_FURN_ORDER.length / cols);
  const W = view.w, Hh = view.h, pw = Math.min(720, W - 20), ph = Math.min(82 + rows * 56 + 14 + 132 + 30, Hh - 20), x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  const pr = game.profile, h = pr.house;
  drawPanel(x0, y0, pw, ph);
  text("꾸미기 책", x0 + 22, y0 + 40, 24, "#ffb0c8");
  drawEmeraldIcon(x0 + pw - 150, y0 + 32, 9); text(`${pr.emeralds}`, x0 + pw - 136, y0 + 39, 18, "#7dffb0");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  // 가구
  text("가구 (에메랄드로 사서 집에 놓아요)", x0 + 22, y0 + 72, 14, "#ddd");
  const bw = (pw - 44 - (cols - 1) * 10) / cols, bh = 50;
  HOUSE_FURN_ORDER.forEach((id, i) => {
    const f = HOUSE_FURN[id], own = houseOwns(id), bx = x0 + 22 + (i % cols) * (bw + 10), by = y0 + 82 + Math.floor(i / cols) * (bh + 6);
    const can = !own && pr.emeralds >= f.price;
    drawButton(bx, by, bw, bh, "", own ? null : () => houseBuy(id), { color: own ? "rgba(80,200,120,0.18)" : can ? "rgba(232,106,138,0.32)" : "rgba(70,70,80,0.4)" });
    text(f.name, bx + 12, by + 21, 16, "#fff");
    text(f.desc, bx + 12, by + 40, 11, "#ccc");
    if (own) text("✓ 있어요", bx + bw - 12, by + 21, 14, "#7dffb0", "right");
    else { text(`${f.price}`, bx + bw - 12, by + 22, 16, can ? "#7dffb0" : "#ff9090", "right"); drawEmeraldIcon(bx + bw - 36 - String(f.price).length * 8, by + 16, 7); }
  });
  // 벽지·바닥
  let y = y0 + 82 + Math.ceil(HOUSE_FURN_ORDER.length / cols) * (bh + 6) + 14;
  const swatch = (list, cur, set, label) => {
    text(label, x0 + 22, y + 4, 14, "#ddd");
    const sw = Math.min(96, (pw - 44 - (list.length - 1) * 8) / list.length);
    list.forEach((c, i) => {
      const bx = x0 + 22 + i * (sw + 8);
      drawButton(bx, y + 12, sw, 40, c.name, () => { set(i); saveProfile(); sfx.click && sfx.click(); }, { size: 12, selected: cur === i, color: (c.c || c.a) + "aa" });
    });
    y += 66;
  };
  swatch(HOUSE_WALLS, h.wall, (i) => { h.wall = i; }, "벽지 (공짜로 바꿔요)");
  swatch(HOUSE_FLOORS, h.floor, (i) => { h.floor = i; }, "바닥 (공짜로 바꿔요)");
  if (house.note) text(house.note, x0 + 22, y0 + ph - 18, 15, house.noteC);
  return true;
}, 50);
hookOn("hudDraw", drawHouseLabels, 40);
