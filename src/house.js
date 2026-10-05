// ===== 우리 집 (방이 여러 개) =====
// 캠프의 집 문 앞에서 E: 거실(현관)로 들어가요. 거실 문으로 침실·부엌·놀이방·트로피 복도에 가요.
// 트로피 복도에는 월드마다 문이 하나씩 있고, 문마다 그 월드의 트로피 룸이 있어요 (house_trophy.js, WORLD_ORDER 를 보고 저절로 생겨요).
// 방들은 캠프 땅 오른쪽·아래의 빈 곳(VOID)에 멀리 떨어져 있어요. 그래서 한 방에 있으면 옆 방이 안 보여요. 문은 순간이동이에요.
//   거실: 공용 보관함 · 도감 책장 · 꾸미기 책 · 벽난로 · 우편함 · 출석 달력 · 소파 (+ 러그·화분·그림)
//   침실: 침대(하루 한 번 꿈 선물) · 커튼(낮/밤) · 저금통 · 일기장 · 거울(옷장) · 알람시계 (+ 스탠드·별빛 램프)
//   부엌: 냉장고(음식 더 보관) · 요리대(빵 2 -> 도시락) · 강아지 밥그릇
//   놀이방: 피아노 · 어항 · 곰인형 · 다트판 · 블록 쌓기 · 장난감 공
//   퀘스트 선물 가구 (월드마다 마지막 큰 이야기 보상, HOUSE_FURN 의 q_*): 부엉이 시계(거실) · 등대 모형·망원경(침실) · 도깨비 등불(부엌) · 별빛 병(놀이방)
//   이야기 편지: 월드 마지막 큰 이야기를 끝내면 그 월드 이야기꾼 편지가 우편함에 한 번 (houseStoryLetter)
// 저장: pr.house = { owned, wall, floor, lamp, slept, plant, plantDay, visited, curtain, fire, piggy, piggyDay, stamps, stampDay, calGift,
//                    mailDay, mail[], fridge{}, dartsBest, blockBest, diary{} }
// 가구·색은 내 기기 저장이에요. 같이 하기 친구는 자기 집 꾸밈으로 보여요. 친구 문 이동은 방장에게 부탁해요 (req "house").
// 이 파일은 showcase.js 앞, house_trophy.js 는 바로 뒤에 불러요.

// ----- 방 자리 (거실·침실·부엌·놀이방은 늘 같은 자리, 복도·트로피 룸은 월드 수에 맞춰 houseLayout 이 정해요) -----
const HOUSE_GAP = 22; // 방 사이 빈 곳 (이만큼 떨어져야 옆 방이 화면에 안 보여요)
const HOUSE_FIXED = [
  { id: "living", name: "거실", x0: 46, y0: 3, w: 14, d: 10 },
  { id: "bed", name: "침실", x0: 84, y0: 3, w: 12, d: 10 },
  { id: "kitchen", name: "부엌", x0: 118, y0: 3, w: 11, d: 9 },
  { id: "play", name: "놀이방", x0: 46, y0: 40, w: 12, d: 9 }, // 13x10 은 큰 화면에서 오른쪽 끝까지 꽉 차서 한 칸씩 줄였어요
];
for (const r of HOUSE_FIXED) { r.x1 = r.x0 + r.w; r.y1 = r.y0 + r.d; r.home = true; }
const HR = Object.fromEntries(HOUSE_FIXED.map((r) => [r.id, r]));
const HOUSE = { x0: HR.living.x0, y0: HR.living.y0, x1: HR.living.x1, y1: HR.living.y1, wallH: 2 }; // 거실 (예전 이름 그대로)
const HOUSE_ROW2_Y = 40, HOUSE_ROW_MAX_X = 236;
// 캠프의 집 (밖에서 보는 모양): 바닥 x 21.6~25.4, y 16.3~19.2, 문은 앞쪽(y 큰 쪽)
const HOUSE_OUT = { x: 21.6, y: 16.3, w: 3.8, d: 2.9, h: 1.5 };
const hAt = (room, rx, ry) => ({ x: HR[room].x0 + rx, y: HR[room].y0 + ry });
// 고정된 물건 자리
const HOUSE_SPOTS = {
  stash: hAt("living", 0.95, 5.2), codex: hAt("living", 7.75, 0.5), catalog: hAt("living", 3.2, 8.9), fire: hAt("living", 12.0, 0.45),
  mailbox: hAt("living", 1.0, 9.3), calendar: hAt("living", 1.3, 0) /* 뒤 벽 왼쪽 끝: 가운데에 두면 화면 위 안내 글에 가려요 */, sofa: hAt("living", 11.0, 4.6),
  bed: hAt("bed", 10.55, 8.45), alarm: hAt("bed", 10.6, 6.6), window: hAt("bed", 6.0, 0), mirror: hAt("bed", 9.4, 0.45),
  diary: hAt("bed", 2.5, 0.5), piggy: hAt("bed", 1.0, 3.0),
  fridge: hAt("kitchen", 1.0, 0.5), stove: hAt("kitchen", 4.5, 0.45), sink: hAt("kitchen", 7.2, 0.45), table: hAt("kitchen", 5.5, 4.8), bowl: hAt("kitchen", 9.6, 7.8),
  darts: hAt("play", 10.0, 0), blocks: hAt("play", 3.0, 6.0), toybox: hAt("play", 1.2, 2.6), ball: hAt("play", 7.5, 6.0),
};
function houseSpot(id) { return HOUSE_SPOTS[id]; }
function houseDoorOut() { const O = HOUSE_OUT; return { x: O.x + O.w / 2, y: O.y + O.d }; }

// ----- 방 배치 (월드가 늘면 복도가 길어지고 트로피 룸이 더 생겨요) -----
const houseL = { key: "", L: null };
function houseLayoutKey() { return (typeof WORLD_ORDER !== "undefined" ? WORLD_ORDER.join(",") : "1") + "|" + (typeof MAPS !== "undefined" ? MAPS.length : 0) + "|" + (typeof houseCrowns === "function" ? houseCrowns().length : 0); }
function houseWorlds() { return typeof WORLD_ORDER !== "undefined" ? WORLD_ORDER.slice() : [1]; }
function houseLayout() {
  const key = houseLayoutKey();
  if (houseL.L && houseL.key === key) return houseL.L;
  const worlds = houseWorlds(), rooms = HOUSE_FIXED.map((r) => ({ ...r })), doors = [];
  // 트로피 복도: 왼쪽 벽 문은 거실로, 뒤 벽에 월드마다 문 하나 (2.8칸마다)
  const hall = { id: "hall", name: "트로피 복도", x0: 84, y0: HOUSE_ROW2_Y, w: Math.ceil(4 + 2.8 * worlds.length), d: 5, home: true };
  hall.x1 = hall.x0 + hall.w; hall.y1 = hall.y0 + hall.d; rooms.push(hall);
  // 트로피 룸: 복도 오른쪽부터 차례로, 줄이 길어지면 아래 줄로
  let x = hall.x1 + HOUSE_GAP, y = HOUSE_ROW2_Y, rowD = Math.max(HR.play.d, hall.d);
  for (const w of worlds) {
    const T = typeof houseTrophyPlan === "function" ? houseTrophyPlan(w) : { w: 12, d: 9, spots: [], centers: [] };
    if (x + T.w > HOUSE_ROW_MAX_X) { x = HR.play.x0; y += rowD + HOUSE_GAP; rowD = 0; }
    const r = { id: "trophy" + w, name: `${houseWorldName(w)} 트로피 룸`, world: w, x0: x, y0: y, w: T.w, d: T.d, plan: T };
    r.x1 = r.x0 + r.w; r.y1 = r.y0 + r.d;
    if (typeof houseTrophyPlace === "function") houseTrophyPlace(r);
    rooms.push(r);
    x = r.x1 + HOUSE_GAP; rowD = Math.max(rowD, r.d);
  }
  // 문 (spot: 서서 E 누르는 자리, to: 도착하는 문)
  const L0 = HR.living;
  const left = (id, room, ry, to, extra) => { const r = rooms.find((q) => q.id === room); doors.push({ id, room, wall: "left", wx: r.x0 - 1, wy: r.y0 + ry, spot: { x: r.x0 + 0.55, y: r.y0 + ry }, arrive: { x: r.x0 + 1.0, y: r.y0 + ry }, to, ...extra }); };
  const back = (id, room, rx, to, extra) => { const r = rooms.find((q) => q.id === room); doors.push({ id, room, wall: "back", wx: r.x0 + rx, wy: r.y0 - 1, spot: { x: r.x0 + rx, y: r.y0 + 0.55 }, arrive: { x: r.x0 + rx, y: r.y0 + 1.0 }, to, ...extra }); };
  const d0 = houseDoorOut();
  doors.push({ id: "camp", room: null, wall: "out", spot: { x: d0.x, y: d0.y + 0.45 }, arrive: { x: d0.x, y: d0.y + 0.75 }, to: "front", label: "우리 집" });
  left("front", "living", 7.5, "camp", { label: "캠프로" });
  left("livHall", "living", 3.0, "hallLiv", { label: "트로피 복도" });
  back("livBed", "living", 2.5, "bedDoor", { label: "침실" });
  back("livKit", "living", 6.0, "kitDoor", { label: "부엌" });
  back("livPlay", "living", 9.5, "playDoor", { label: "놀이방" });
  left("bedDoor", "bed", 7.5, "livBed", { label: "거실" });
  left("kitDoor", "kitchen", 6.5, "livKit", { label: "거실" });
  left("playDoor", "play", 7.5, "livPlay", { label: "거실" });
  left("hallLiv", "hall", 2.5, "livHall", { label: "거실" });
  worlds.forEach((w, i) => {
    back("hallW" + w, "hall", 2.8 + 2.8 * i, "trophyIn" + w, { label: houseWorldName(w), world: w });
    const r = rooms.find((q) => q.id === "trophy" + w);
    left("trophyIn" + w, "trophy" + w, r.d - 1.5, "hallW" + w, { label: "트로피 복도" });
  });
  const W = Math.max(...rooms.map((r) => r.x1)) + 3, H = Math.max(...rooms.map((r) => r.y1)) + 3;
  houseL.key = key; houseL.L = { rooms, doors, W, H, worlds };
  return houseL.L;
}
function houseWorldName(w) { return (typeof WORLDS !== "undefined" && WORLDS[w] && WORLDS[w].name) || `월드 ${w}`; }
Object.defineProperty(LOBBY, "extraW", { configurable: true, get: () => Math.max(0, houseLayout().W - LOBBY.width) });
Object.defineProperty(LOBBY, "extraH", { configurable: true, get: () => Math.max(0, houseLayout().H - LOBBY.height) });
function houseRooms() { return houseLayout().rooms; }
function houseRoom(id) { return houseRooms().find((r) => r.id === id) || null; }
function houseDoor(id) { return houseLayout().doors.find((d) => d.id === id) || null; }
// (x, y) 가 어느 방 바닥인가 (벽은 빼요)
function houseRoomAt(x, y) { for (const r of houseRooms()) if (x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1) return r; return null; }
function houseInside(q) { return !!q && !!houseRoomAt(q.x, q.y); }
// 그 방이 화면에 보이나 (안 보이는 방은 그리지 않아요)
function houseRoomVisible(r) { return onScreen(r.x0 + r.w / 2, r.y0 + r.d / 2, Math.max(r.w, r.d) * 0.75 + 2); }

// ----- 저장 -----
hookOn("profileLoaded", (pr) => {
  const h = (pr.house = pr.house && typeof pr.house === "object" ? pr.house : {});
  if (!h.owned || typeof h.owned !== "object") h.owned = {};
  for (const k of Object.keys(h.owned)) if (!HOUSE_FURN[k]) delete h.owned[k];
  h.wall = Number.isInteger(h.wall) && HOUSE_WALLS[h.wall] ? h.wall : 0;
  h.floor = Number.isInteger(h.floor) && HOUSE_FLOORS[h.floor] ? h.floor : 0;
  h.lamp = h.lamp !== false; h.curtain = h.curtain !== false; h.fire = h.fire !== false;
  h.plant = Math.max(0, Math.min(3, Math.floor(Number(h.plant) || 0)));
  for (const k of ["slept", "plantDay", "stampDay", "mailDay"]) if (typeof h[k] !== "string") h[k] = "";
  const num = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));
  h.piggy = num(h.piggy, 0, PIGGY.cap); h.piggyDay = num(h.piggyDay, 0, 1e7);
  h.stamps = num(h.stamps, 0, 9999); h.calGift = !!h.calGift;
  h.dartsBest = num(h.dartsBest, 0, 999); h.blockBest = num(h.blockBest, 0, 999);
  if (!Array.isArray(h.mail)) h.mail = [];
  h.mail = h.mail.filter((m) => m && typeof m.text === "string").slice(0, 20);
  if (!h.fridge || typeof h.fridge !== "object" || Array.isArray(h.fridge)) h.fridge = {};
  for (const k of Object.keys(h.fridge)) { const n = num(h.fridge[k], 0, FRIDGE_MAX); if (!n || !(typeof foodById !== "function" || foodById(k))) delete h.fridge[k]; else h.fridge[k] = n; }
  if (!h.diary || typeof h.diary !== "object") h.diary = {};
  h.lighthouse = !!h.lighthouse; h.lanternC = num(h.lanternC, 0, HOUSE_LANTERN_C.length - 1);
  if (!h.letters || typeof h.letters !== "object" || Array.isArray(h.letters)) h.letters = {}; // 이야기 편지 보낸 월드 { 월드: true }
}, 55);
// 퀘스트 선물 가구 옮기기: 예전에 집이 몰라서 퀘스트 저장(pr.quests.furn)에만 남은 가구도 집에 놓아요 (선물이 사라지지 않게)
hookOn("profileLoaded", (pr) => {
  const q = pr.quests, h = pr.house;
  if (!q || !q.furn || typeof q.furn !== "object" || !h) return;
  for (const id of Object.keys(q.furn)) if (q.furn[id] === true && HOUSE_FURN[id] && !h.owned[id]) h.owned[id] = true;
}, 70);
function houseData() { return game.profile.house; }
function houseToday() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function houseDayNum() { const d = new Date(); return Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5); }

// ----- 벽지·바닥 (거실·침실·부엌·놀이방) -----
const HOUSE_WALLS = [
  { name: "나무", c: "#9a7448" }, { name: "하늘", c: "#6f9fd0" }, { name: "분홍", c: "#d98aa8" },
  { name: "민트", c: "#6fbfa0" }, { name: "보라", c: "#8a72c0" }, { name: "햇살", c: "#d8b860" },
];
const HOUSE_FLOORS = [
  { name: "나무 마루", a: "#a77b45", b: "#956b3a" }, { name: "바둑 타일", a: "#e2dac8", b: "#b9ab8e" },
  { name: "푸른 타일", a: "#86aed0", b: "#7097bb" }, { name: "분홍 카펫", a: "#e3a8bf", b: "#d898b2" }, { name: "풀밭 카펫", a: "#8fbf6a", b: "#82b25e" },
];
const HOUSE_HALL = { floor: "#7a5a3a", floor2: "#6c4f33", wall: "#8c8378" }; // 트로피 복도 (돌벽, 짙은 마루)
function houseFloorAt(x, y, v) {
  const r = houseRoomAt(x, y);
  if (!r) return null;
  if (r.world !== undefined && typeof houseTrophyFloor === "function") return houseTrophyFloor(r, x, y, v);
  if (r.id === "hall") return shade((x + y) % 2 ? HOUSE_HALL.floor : HOUSE_HALL.floor2, 0.95 + Math.round(v * 3) / 3 * 0.06);
  const h = houseData(), f = HOUSE_FLOORS[h.floor] || HOUSE_FLOORS[0];
  let c = h.floor === 1 ? ((x + y) % 2 ? f.a : f.b) : (y % 2 ? f.a : f.b); // 바둑 타일은 바둑판, 나머지는 줄무늬
  if (r.id === "kitchen") c = (x + y) % 2 ? "#e8e0d0" : "#c8bca4"; // 부엌은 늘 타일
  return shade(c, 0.95 + Math.round(v * 3) / 3 * 0.08);
}
function houseWallAt(tx, ty) {
  for (const r of houseRooms()) {
    if (tx < r.x0 - 1 || tx > r.x1 || ty < r.y0 - 1 || ty > r.y1) continue;
    if (r.world !== undefined && typeof houseTrophyWall === "function") return houseTrophyWall(r);
    if (r.id === "hall") return HOUSE_HALL.wall;
    if (r.id === "kitchen") return "#d8d0c0";
    return (HOUSE_WALLS[houseData().wall] || HOUSE_WALLS[0]).c;
  }
  return null;
}
hookOn("lobbyWorldBuilt", () => {
  const T = world.tiles;
  for (const r of houseRooms()) {
    for (let ty = r.y0 - 1; ty <= r.y1; ty++) for (let tx = r.x0 - 1; tx <= r.x1; tx++) {
      if (!T[ty] || tx >= world.W) continue;
      T[ty][tx] = tx === r.x0 - 1 || ty === r.y0 - 1 ? HOUSE.wallH : tx === r.x1 || ty === r.y1 ? LOW_WALL : 0;
    }
  }
  world.floorAt = houseFloorAt;
  world.wallAt = houseWallAt;
  const d = houseDoorOut();
  carvePath(lobby.fire.x, lobby.fire.y, d.x, d.y + 0.6); // 모닥불에서 집 문까지 흙길
  houseBallReset();
});

// ----- 가구 (꾸미기 책에서 에메랄드로 사요. gift 는 선물로만) -----
//   x, y: 자리 · r: 부딪히는 크기(0 이면 밟고 지나가요) · use: E 로 하는 것
const HOUSE_FURN = {
  rug:      { name: "동그라미 러그", price: 4, ...hAt("living", 6.5, 5.8), r: 0, desc: "거실 가운데 폭신한 러그" },
  plant:    { name: "화분", price: 3, ...hAt("living", 13.2, 9.2), r: 0.3, desc: "하루 한 번 물 주면 자라서 꽃이 펴요", use: "물 주기" },
  lamp:     { name: "스탠드", price: 5, ...hAt("bed", 11.2, 1.0), r: 0.25, desc: "침실을 밝히는 따뜻한 불빛", use: "켜기·끄기" },
  teddy:    { name: "곰인형", price: 6, ...hAt("play", 11.2, 1.0), r: 0.3, desc: "꼭 안아 주면 하트가 퐁퐁", use: "안아 주기" },
  painting: { name: "그림 액자", price: 8, ...hAt("living", 0, 1.3), r: 0, desc: "거실 벽에 거는 산과 해 그림", use: "보기" },
  fishtank: { name: "어항", price: 12, ...hAt("play", 7.0, 0.55), r: 0.55, desc: "물고기 세 마리. 밥을 주면 신나게 헤엄쳐요", use: "밥 주기" },
  piano:    { name: "피아노", price: 15, ...hAt("play", 3.0, 0.5), r: 0.6, desc: "E 를 누를 때마다 노래 한 소절", use: "연주하기" },
  starlamp: { name: "별빛 램프", price: 0, gift: true, ...hAt("bed", 1.0, 9.4), r: 0.25, desc: "출석 도장 7개 선물", use: "켜기" },
  // 퀘스트 선물 (월드마다 마지막 이야기를 끝내면 이야기꾼이 줘요: quests_w14.js · quests_w5.js 의 reward.furn)
  q_owlclock:   { name: "부엉이 뻐꾸기시계", price: 0, gift: true, quest: 1, ...hAt("living", 9.2, 9.2), r: 0.3, desc: "부엉 할아버지 선물", use: "시간 보기" },
  q_lighthouse: { name: "작은 등대 모형", price: 0, gift: true, quest: 2, ...hAt("bed", 4.6, 9.2), r: 0.3, desc: "해마 할머니 선물", use: "불빛 켜기" },
  q_telescope:  { name: "망원경", price: 0, gift: true, quest: 3, ...hAt("bed", 7.9, 1.3), r: 0.3, desc: "토토 박사 선물", use: "별 보기" },
  q_lantern:    { name: "도깨비 등불", price: 0, gift: true, quest: 4, ...hAt("kitchen", 10.2, 1.2), r: 0.25, desc: "반짝이 선물", use: "색 바꾸기" },
  q_starjar:    { name: "별빛 병", price: 0, gift: true, quest: 5, ...hAt("play", 10.2, 7.4), r: 0.3, desc: "블랙홀에서 지켜 낸 색깔들", use: "흔들기" },
};
// 등불 색 (E 로 차례로 바꿔요)
const HOUSE_LANTERN_C = [{ c: "#ffb050", name: "주황" }, { c: "#7fe0ff", name: "하늘" }, { c: "#ff7ac8", name: "분홍" }, { c: "#a8ff7a", name: "연두" }];
const HOUSE_FURN_ORDER = ["plant", "rug", "lamp", "teddy", "painting", "fishtank", "piano"]; // 살 수 있는 것
function houseOwns(id) { return !!(game.profile && game.profile.house && game.profile.house.owned[id]); }
function houseBuy(id) {
  const f = HOUSE_FURN[id], pr = game.profile;
  if (!f || f.gift || houseOwns(id)) return false;
  if (pr.emeralds < f.price) { house.note = `에메랄드가 ${f.price - pr.emeralds}개 모자라요`; house.noteC = "#ff9090"; sfx.denied(); return false; }
  pr.emeralds -= f.price;
  houseGiveFurn(id);
  const nm = f.name; house.note = `${josa(nm, "을/를")} 집에 놓았어요!`; house.noteC = "#7dffb0";
  sfx.buy();
  return true;
}
function houseGiveFurn(id) {
  const f = HOUSE_FURN[id], pr = game.profile;
  if (!f || pr.house.owned[id]) return false;
  pr.house.owned[id] = true;
  if (f.r && world.solids && world.solids.__house) world.solids.push({ x: f.x, y: f.y, r: f.r });
  saveProfile();
  return true;
}

// ----- 문으로 다니기 -----
const house = { note: "", noteC: "#ddd", fish: 0, sleepT: 0, sleepMsg: "", tune: 0, hugT: 0, alarmT: 0, owlT: 0, jarT: 0, scopeT: 0, scopeSeed: 0, sit: null, ball: null, blocks: { n: 0, fall: 0 }, darts: null, page: null, mailFlash: 0 };
// 내 기기에서 움직이는 주인공들 (둘이 하기면 둘 다, 같이 하기면 나만)
function houseLocalPlayers() { return allPlayers().filter((q) => q && !q.remote); }
function houseArriveSpot(door) { return door.arrive; }
function houseCamTo(x, y) {
  camera.x = x; camera.y = y;
  const r = houseRoomAt(x, y), c = r && houseCamCenter(r);
  if (c) { camera.x = c.x; camera.y = c.y; }
}
function houseMove(spot, faceX, faceY) {
  houseLocalPlayers().forEach((q, i) => {
    const s = findFreeSpot(spot.x + (i % 2) * 0.6, spot.y + Math.floor(i / 2) * 0.6, q.r || 0.3, 2) || spot;
    q.x = s.x; q.y = s.y; q.faceX = faceX; q.faceY = faceY;
  });
  house.sit = null;
  houseCamTo(game.player.x, game.player.y);
}
function houseDoorFace(door) { return door.wall === "left" ? [1, 0] : door.wall === "back" ? [0, 1] : [0, 1]; }
// 잠긴 문 (아직 못 간 월드의 트로피 룸): 이유 글, 안 잠겼으면 ""
function houseDoorLock(door) {
  const w = door && door.world;
  if (w === undefined || typeof worldUnlocked !== "function" || worldUnlocked(w)) return "";
  return (typeof worldUnlockText === "function" && worldUnlockText(w)) || "아직 잠겨 있어요";
}
function houseUseDoor(id) {
  const door = houseDoor(id), to = door && houseDoor(door.to);
  if (!door || !to) return false;
  const lock = houseDoorLock(door);
  if (lock) { showMessage(`${door.label} 트로피 룸: ${lock}`, 2.8); sfx.denied(); return false; }
  if (typeof netGuest === "function" && netGuest() && typeof netGuestAsk === "function") { netGuestAsk("house", { door: id }); sfx.stairs(); houseArrived(to); return true; }
  const [fx, fy] = houseDoorFace(to);
  houseMove(houseArriveSpot(to), fx, fy);
  sfx.stairs();
  houseArrived(to);
  return true;
}
function houseArrived(to) {
  const r = to.room && houseRoom(to.room);
  if (!r) { showMessage("캠프", 1.2); return; }
  const h = houseData();
  if (r.id === "living" && !h.visited) { h.visited = true; saveProfile(); showMessage("우리 집이에요! 문으로 침실·부엌·놀이방·트로피 복도에 가요", 4.5); return; }
  showMessage(r.name, 1.3);
}
// 같이 하기: 친구가 문을 쓰면 방장이 자리를 정해요 (먼 순간이동은 방장만 허락해요. 문 가까이 있을 때만)
hookOn("netHostReq", (slot, w, d) => {
  if (w !== "house" || game.scene !== "lobby") return false;
  const q = allPlayers().find((x) => x.pid === slot && x.remote);
  if (!q || !(q.hp > 0)) return true;
  const id = d && typeof d.door === "string" ? d.door : d && d.go === "in" ? "camp" : d && d.go === "out" ? "front" : "";
  const door = houseDoor(id), to = door && houseDoor(door.to);
  if (!door || !to || Math.hypot(q.x - door.spot.x, q.y - door.spot.y) > 2.2) return true;
  const s = findFreeSpot(to.arrive.x, to.arrive.y, q.r || 0.3, 2) || to.arrive;
  q.x = s.x; q.y = s.y;
  if (typeof netWarpSlot === "function") netWarpSlot(slot);
  return true;
}, 50);
// 예전 이름 (시험·다른 파일): 집에 들어가기 / 캠프로 나가기
function houseEnter() { return houseUseDoor("camp"); }
function houseExit() { return houseUseDoor("front"); }

// 카메라: 화면에 다 들어오는 방이면 방 한가운데를 보여줘요 (긴 복도·작은 화면은 주인공을 따라가요)
function houseCamCenter(r) {
  const span = r.w + r.d, sw = span * TILE_W / 2, sh = span * TILE_H / 2 + 2 * BLOCK_H;
  return sw < view.w - 30 && sh < view.h - 50 ? { x: r.x0 + r.w / 2, y: r.y0 + r.d / 2 - 0.4 } : null;
}
hookOn("cameraTarget", (t, cx, cy) => {
  const p = game.player;
  if (game.scene !== "lobby" || !p) return t;
  const r = houseRoomAt(p.x, p.y);
  return (r && houseCamCenter(r)) || t;
}, 80);

// ===================== 그리기 =====================
function hb(x, y, z, w, d, h, c) { drawBox(x, y, z, w, d, h, c); }
// 캠프의 집 (밖에서 보는 모양)
function drawHouseOutside() {
  const O = HOUSE_OUT, wall = (HOUSE_WALLS[houseData().wall] || HOUSE_WALLS[0]).c;
  const x = O.x, y = O.y, w = O.w, d = O.d, h = O.h;
  ctx.save();
  if (houseHides()) ctx.globalAlpha = 0.4; // 집 뒤에 숨은 주인공이 보이게 반투명
  hb(x - 0.1, y - 0.1, 0, w + 0.2, d + 0.2, 0.22, "#8c8378");
  hb(x, y, 0.22, w, d, h, wall);
  for (const cx of [x + 0.02, x + w - 0.14]) hb(cx, y + d - 0.12, 0.22, 0.12, 0.12, h, "#6b4a2a");
  const dx = x + w / 2 - 0.35;
  hb(dx, y + d, 0.22, 0.7, 0.04, 1.05, "#6b4a2a");
  hb(dx + 0.52, y + d + 0.03, 0.6, 0.08, 0.03, 0.08, "#ffd23f");
  const lit = "#ffe9a8";
  for (const wx of [x + 0.35, x + w - 1.05]) { hb(wx, y + d, 0.72, 0.7, 0.03, 0.5, "#5a3a22"); hb(wx + 0.06, y + d + 0.01, 0.78, 0.58, 0.03, 0.38, lit); }
  hb(x + w, y + 0.9, 0.72, 0.03, 1.1, 0.5, "#5a3a22"); hb(x + w + 0.01, y + 0.96, 0.78, 0.03, 0.98, 0.38, lit);
  const roofC = "#b04a3a", top = 0.22 + h;
  for (let i = 0; i < 4; i++) { const inset = i * 0.42; hb(x - 0.25, y - 0.25 + inset, top + i * 0.32, w + 0.5, d + 0.5 - inset * 2, 0.32, shade(roofC, 1 - i * 0.06)); }
  hb(x + w - 0.9, y + 0.35, top + 0.3, 0.45, 0.45, 1.25, "#8c8378");
  for (let i = 0; i < 3; i++) { const k = (game.time * 0.35 + i / 3) % 1; ctx.globalAlpha = (houseHides() ? 0.2 : 0.45) * (1 - k); const sz = 0.18 + k * 0.25; hb(x + w - 0.68 - sz / 2 + k * 0.3, y + 0.58 - sz / 2, top + 1.6 + k * 1.4, sz, sz, sz, "#d8d8d8"); }
  ctx.restore();
  if (!houseData().visited && Math.sin(game.time * 4) > 0.5) { const s = toScreen(x + w / 2, y + d, 2.2); drawStar(s.x, s.y, 9 * ZOOM, "#ffe27a"); }
}
// 내 기기 주인공이 집 뒤(화면에서 집에 가리는 자리)에 있나
function houseHides() {
  const O = HOUSE_OUT;
  return houseLocalPlayers().some((q) => q.x < O.x + O.w + 0.2 && q.y < O.y + O.d + 0.2 && q.x > O.x - 2.6 && q.y > O.y - 3.2 && q.x + q.y < O.x + O.y + O.w + O.d);
}
// 문 그림 (왼쪽 벽 / 뒤 벽)
function drawHouseDoor(door) {
  const locked = !!houseDoorLock(door), wood = locked ? "#5a5650" : "#8a6038", frame = "#6b4a2a";
  if (door.wall === "left") {
    const x = door.wx + 1, y = door.wy - 0.5;
    hb(x - 0.02, y, 0, 0.05, 1.0, 1.6, frame); hb(x, y + 0.08, 0.06, 0.04, 0.84, 1.45, wood);
    hb(x + 0.02, y + 0.15, 0.72, 0.05, 0.1, 0.1, "#ffd23f");
    if (locked) hb(x + 0.03, y + 0.38, 0.8, 0.06, 0.24, 0.28, "#e8c040");
    hb(x, y - 0.05, 0, 0.75, 1.1, 0.02, "#7a3a3a");
  } else {
    const x = door.wx - 0.5, y = door.wy + 1;
    hb(x, y - 0.02, 0, 1.0, 0.05, 1.6, frame); hb(x + 0.08, y, 0.06, 0.84, 0.04, 1.45, wood);
    hb(x + 0.75, y + 0.02, 0.72, 0.1, 0.05, 0.1, "#ffd23f");
    if (locked) hb(x + 0.38, y + 0.03, 0.8, 0.24, 0.06, 0.28, "#e8c040");
    hb(x - 0.05, y, 0, 1.1, 0.75, 0.02, "#7a3a3a");
  }
}
// 벽에 붙은 물건: 왼쪽 벽은 x0, 뒤 벽은 y0 에 얇게
const HOUSE_DRAW = {
  rug(f) {
    hb(f.x - 1.7, f.y - 1.1, 0, 3.4, 2.2, 0.025, "#c0504a");
    hb(f.x - 1.5, f.y - 0.9, 0.025, 3.0, 1.8, 0.01, "#e8c060");
    hb(f.x - 1.2, f.y - 0.6, 0.035, 2.4, 1.2, 0.01, "#c0504a");
  },
  plant(f) {
    const g = houseData().plant;
    hb(f.x - 0.2, f.y - 0.2, 0, 0.4, 0.4, 0.32, "#b8643a");
    hb(f.x - 0.17, f.y - 0.17, 0.32, 0.34, 0.34, 0.03, "#5a3a22");
    const hgt = 0.25 + g * 0.18;
    hb(f.x - 0.03, f.y - 0.03, 0.35, 0.06, 0.06, hgt, "#4a8a3a");
    hb(f.x - 0.16, f.y - 0.16, 0.35 + hgt * 0.5, 0.32, 0.32, 0.16, "#5aa548");
    hb(f.x - 0.13, f.y - 0.13, 0.35 + hgt, 0.26, 0.26, 0.16, "#6cbf55");
    if (g >= 2) for (const [ox, oy] of [[-0.12, 0.05], [0.1, -0.08], [0.02, 0.12]]) hb(f.x + ox - 0.05, f.y + oy - 0.05, 0.5 + hgt, 0.1, 0.1, 0.08, g >= 3 ? "#ff7aa8" : "#ffdf5a");
  },
  lamp(f) {
    hb(f.x - 0.15, f.y - 0.15, 0, 0.3, 0.3, 0.05, "#5a4632");
    hb(f.x - 0.03, f.y - 0.03, 0.05, 0.06, 0.06, 1.0, "#5a4632");
    hb(f.x - 0.2, f.y - 0.2, 1.0, 0.4, 0.4, 0.3, houseData().lamp ? "#ffe6a0" : "#c8b890");
  },
  starlamp(f) {
    hb(f.x - 0.18, f.y - 0.18, 0, 0.36, 0.36, 0.2, "#4a4a7a");
    const tw = 0.85 + 0.15 * Math.sin(game.time * 3);
    hb(f.x - 0.14, f.y - 0.14, 0.2, 0.28, 0.28, 0.28, shade("#bfe0ff", tw));
    if (Math.sin(game.time * 2.3) > 0.4) { const s = toScreen(f.x, f.y, 0.75); drawStar(s.x, s.y, 6 * ZOOM, "#fff6c0"); }
  },
  teddy(f) {
    const hug = house.hugT > 0 ? Math.sin(house.hugT * 20) * 0.03 : 0;
    hb(f.x - 0.2, f.y - 0.16, 0, 0.4, 0.32, 0.36 + hug, "#b07a48");
    hb(f.x - 0.16, f.y - 0.14, 0.36 + hug, 0.32, 0.28, 0.28, "#c08a58");
    for (const ox of [-0.16, 0.1]) hb(f.x + ox, f.y - 0.1, 0.6 + hug, 0.08, 0.08, 0.08, "#b07a48");
    hb(f.x - 0.06, f.y + 0.14, 0.44 + hug, 0.12, 0.02, 0.06, "#7a4a28");
    hb(f.x - 0.08, f.y + 0.16, 0.2, 0.16, 0.02, 0.06, "#ff8ab0");
  },
  painting(f) {
    const x = HR.living.x0 - 0.02, y = f.y - 0.6;
    hb(x, y, 0.75, 0.05, 1.2, 0.85, "#c9a24a");
    hb(x + 0.01, y + 0.07, 0.82, 0.05, 1.06, 0.71, "#8fd0ff");
    hb(x + 0.02, y + 0.07, 0.82, 0.05, 1.06, 0.26, "#5aa548");
    hb(x + 0.03, y + 0.35, 1.08, 0.05, 0.42, 0.12, "#4a8a3a");
    hb(x + 0.03, y + 0.75, 1.25, 0.05, 0.16, 0.16, "#ffd23f");
  },
  fishtank(f) {
    hb(f.x - 0.55, f.y - 0.3, 0, 1.1, 0.6, 0.55, "#6b4a2a");
    ctx.save(); ctx.globalAlpha = 0.55; hb(f.x - 0.5, f.y - 0.26, 0.55, 1.0, 0.52, 0.6, "#5ab8e8"); ctx.restore();
    const fast = house.fish > 0 ? 3 : 1;
    ["#ff8a3a", "#ffd23f", "#ff6aa0"].forEach((c, i) => {
      const t = game.time * (0.8 + i * 0.25) * fast + i * 2.1, fx = f.x + Math.sin(t) * 0.35, fz = 0.7 + i * 0.13 + Math.sin(t * 1.7) * 0.05;
      hb(fx - 0.06, f.y - 0.04 + (i - 1) * 0.12, fz, 0.12, 0.08, 0.07, c);
    });
    hb(f.x - 0.52, f.y - 0.28, 1.15, 1.04, 0.56, 0.04, "#3a5a6a");
  },
  q_owlclock(f) { // 키 큰 시계 + 위에 부엉이 (E 를 누르면 부엉이가 튀어나와요)
    hb(f.x - 0.28, f.y - 0.22, 0, 0.56, 0.44, 1.5, "#7a5530");
    hb(f.x - 0.22, f.y + 0.22, 0.9, 0.44, 0.02, 0.44, "#f4ecd8");
    const a = game.time * 0.6; // 시계바늘 (작은 상자 두 개)
    hb(f.x - 0.03 + Math.sin(a) * 0.1, f.y + 0.23, 1.1 + Math.cos(a) * 0.1, 0.05, 0.01, 0.05, "#3a2a1a");
    hb(f.x - 0.03, f.y + 0.23, 1.1, 0.05, 0.01, 0.05, "#3a2a1a");
    hb(f.x - 0.05 + Math.sin(game.time * 2.5) * 0.1, f.y + 0.23, 0.45, 0.1, 0.01, 0.25, "#c9a24a"); // 추
    const pop = house.owlT > 0 ? Math.sin(Math.min(1, (1.5 - house.owlT) * 4) * Math.PI / 2) * 0.35 : 0;
    hb(f.x - 0.2, f.y - 0.12 + pop * 0.6, 1.5, 0.4, 0.3, 0.32, "#9a6a40"); // 부엉이 몸
    hb(f.x - 0.14, f.y + 0.18 + pop * 0.6, 1.68, 0.1, 0.02, 0.1, "#fff6c0"); hb(f.x + 0.04, f.y + 0.18 + pop * 0.6, 1.68, 0.1, 0.02, 0.1, "#fff6c0");
    hb(f.x - 0.03, f.y + 0.19 + pop * 0.6, 1.6, 0.06, 0.02, 0.06, "#ffb030");
    for (const ox of [-0.2, 0.12]) hb(f.x + ox, f.y - 0.05 + pop * 0.6, 1.82, 0.08, 0.08, 0.1, "#7a5530"); // 귀깃
  },
  q_lighthouse(f) { // 빨강·하양 줄무늬 등대 (켜면 빛줄기가 빙글빙글)
    hb(f.x - 0.3, f.y - 0.3, 0, 0.6, 0.6, 0.12, "#8c8378");
    for (let i = 0; i < 4; i++) { const w = 0.36 - i * 0.04; hb(f.x - w / 2, f.y - w / 2, 0.12 + i * 0.22, w, w, 0.22, i % 2 ? "#f4f0e6" : "#d04040"); }
    const on = houseData().lighthouse;
    hb(f.x - 0.13, f.y - 0.13, 1.0, 0.26, 0.26, 0.18, on ? "#fff2a0" : "#8a8a7a");
    hb(f.x - 0.17, f.y - 0.17, 1.18, 0.34, 0.34, 0.08, "#3a3a3a");
    if (on) { // 빛줄기: 화면에 옅은 부채꼴
      const c = toScreen(f.x, f.y, 1.09), a = game.time * 1.6, L = 70 * ZOOM;
      ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = "#fff6b0"; ctx.beginPath(); ctx.moveTo(c.x, c.y);
      ctx.arc(c.x, c.y, L, a - 0.18, a + 0.18); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  },
  q_telescope(f) { // 세 다리 + 비스듬한 통
    for (const [ox, oy] of [[-0.18, 0.1], [0.18, 0.1], [0, -0.18]]) hb(f.x + ox - 0.03, f.y + oy - 0.03, 0, 0.06, 0.06, 0.7, "#5a4632");
    for (let i = 0; i < 4; i++) hb(f.x - 0.25 + i * 0.12, f.y - 0.08 - i * 0.05, 0.7 + i * 0.1, 0.16, 0.16, 0.14, i === 3 ? "#c9a24a" : "#4a5a9a");
    if (Math.sin(game.time * 2.1) > 0.6) { const t = toScreen(f.x + 0.2, f.y - 0.3, 1.4); drawStar(t.x, t.y, 5 * ZOOM, "#fff6c0"); }
  },
  q_lantern(f) { // 막대 + 큰 둥근 등불 (색은 houseData().lanternC) + 도깨비 얼굴
    const c = HOUSE_LANTERN_C[houseData().lanternC].c, fl = 0.92 + 0.08 * Math.sin(game.time * 9);
    hb(f.x - 0.2, f.y - 0.2, 0, 0.4, 0.4, 0.08, "#3a2a1a");
    hb(f.x - 0.05, f.y - 0.05, 0.08, 0.1, 0.1, 0.75, "#5a3a22");
    hb(f.x - 0.3, f.y - 0.3, 0.83, 0.6, 0.6, 0.06, "#3a2a1a");
    hb(f.x - 0.26, f.y - 0.26, 0.89, 0.52, 0.52, 0.58, shade(c, fl));
    hb(f.x - 0.3, f.y - 0.3, 1.47, 0.6, 0.6, 0.06, "#3a2a1a"); hb(f.x - 0.06, f.y - 0.06, 1.53, 0.12, 0.12, 0.14, "#3a2a1a");
    for (const ox of [-0.16, 0.06]) hb(f.x + ox, f.y + 0.26, 1.2, 0.1, 0.02, 0.1, "#2a1a14"); // 도깨비 눈
    hb(f.x - 0.1, f.y + 0.26, 1.02, 0.2, 0.02, 0.05, "#2a1a14"); // 웃는 입
    for (const ox of [-0.24, 0.16]) hb(f.x + ox, f.y - 0.04, 1.53, 0.08, 0.08, 0.14, "#e8dcc0"); // 뿔
  },
  q_starjar(f) { // 받침 + 유리병 + 안에서 빙글빙글 도는 색깔들
    hb(f.x - 0.3, f.y - 0.3, 0, 0.6, 0.6, 0.35, "#6a5a8a");
    ctx.save(); ctx.globalAlpha = 0.35; hb(f.x - 0.22, f.y - 0.22, 0.35, 0.44, 0.44, 0.6, "#dff4ff"); ctx.restore();
    const sp = house.jarT > 0 ? 4 : 1, cols = ["#ff6a6a", "#ffd23f", "#6adf7a", "#5ab8ff", "#c07aff", "#ff9ad8"];
    cols.forEach((c, i) => { const a = game.time * 1.2 * sp + i * 1.05; hb(f.x + Math.cos(a) * 0.12 - 0.05, f.y + Math.sin(a) * 0.12 - 0.05, 0.42 + ((i * 0.09 + game.time * 0.1 * sp) % 0.45), 0.1, 0.1, 0.08, c); });
    hb(f.x - 0.12, f.y - 0.12, 0.95, 0.24, 0.24, 0.08, "#b08050"); // 코르크
  },
  piano(f) {
    const x = f.x - 0.9, y = f.y - 0.35;
    hb(x, y, 0, 1.8, 0.7, 0.85, "#2a2a32");
    hb(x, y, 0.85, 1.8, 0.3, 0.45, "#34343e");
    hb(x + 0.05, y + 0.3, 0.86, 1.7, 0.36, 0.04, "#f4f4f4");
    for (let i = 0; i < 9; i++) if (i % 7 !== 2 && i % 7 !== 6) hb(x + 0.2 + i * 0.18, y + 0.3, 0.9, 0.08, 0.2, 0.04, "#1a1a1a");
    hb(x + 0.55, y + 0.9, 0, 0.7, 0.35, 0.45, "#3a2a1a");
  },
};
// 고정 물건 그림
const HOUSE_FIX = {
  stash(s) { hb(s.x - 0.25, s.y - 0.35, 0, 0.5, 0.7, 0.42, "#6a4a8a"); hb(s.x - 0.27, s.y - 0.37, 0.42, 0.54, 0.74, 0.12, "#8a6ac0"); hb(s.x + 0.22, s.y - 0.05, 0.28, 0.05, 0.1, 0.12, "#ffd23f"); },
  codex(s) { // 책장 (뒤 벽)
    hb(s.x - 0.6, s.y - 0.25, 0, 1.2, 0.5, 1.7, "#6b4a2a");
    const cols = ["#c04040", "#4a7ac0", "#e0b040", "#50a060", "#9050b0", "#e07040"];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) hb(s.x - 0.52 + i * 0.17, s.y + 0.2, 0.12 + r * 0.52, 0.13, 0.06, 0.36 - (i % 3) * 0.05, cols[(i + r * 2) % cols.length]);
    const c = game.profile.codex; if (c && Math.sin(game.time * 4) > 0.7) { const t = toScreen(s.x, s.y, 2.0); drawStar(t.x, t.y, 6 * ZOOM, "#9fe6ff"); }
  },
  catalog(s) {
    hb(s.x - 0.45, s.y - 0.3, 0, 0.9, 0.6, 0.55, "#7a5530"); hb(s.x - 0.48, s.y - 0.33, 0.55, 0.96, 0.66, 0.06, "#9a6e40");
    hb(s.x - 0.28, s.y - 0.2, 0.61, 0.5, 0.38, 0.06, "#e86a8a"); hb(s.x - 0.26, s.y - 0.18, 0.67, 0.46, 0.34, 0.01, "#ffd0dc");
    if (Math.sin(game.time * 3) > 0.75) { const c = toScreen(s.x, s.y, 1.0); drawStar(c.x, c.y, 6 * ZOOM, "#ffb0c8"); }
  },
  fire(s) { // 벽난로
    hb(s.x - 0.85, s.y - 0.4, 0, 1.7, 0.8, 1.25, "#9a8a7a"); hb(s.x - 0.95, s.y - 0.45, 1.25, 1.9, 0.9, 0.12, "#7a6a5a");
    hb(s.x - 0.5, s.y + 0.38, 0.05, 1.0, 0.04, 0.7, "#2a1a14");
    if (houseData().fire) for (let i = 0; i < 4; i++) { const k = Math.sin(game.time * (7 + i) + i * 2) * 0.5 + 0.5; hb(s.x - 0.38 + i * 0.2, s.y + 0.3, 0.08, 0.14, 0.06, 0.25 + k * 0.3, i % 2 ? "#ffb030" : "#ff6a20"); }
    hb(s.x - 0.42, s.y + 0.32, 0.03, 0.84, 0.06, 0.08, "#5a3a22");
    hb(s.x - 0.15, s.y - 0.45, 1.37, 0.3, 0.3, 0.9, "#8c8378"); // 굴뚝
  },
  mailbox(s) {
    hb(s.x - 0.05, s.y - 0.05, 0, 0.1, 0.1, 0.7, "#5a3a22");
    hb(s.x - 0.22, s.y - 0.15, 0.7, 0.44, 0.3, 0.3, "#3a6ac0"); hb(s.x - 0.22, s.y - 0.15, 1.0, 0.44, 0.3, 0.06, "#2a5aa8");
    if (houseHasMail()) { hb(s.x + 0.22, s.y - 0.02, 0.85, 0.04, 0.06, 0.4, "#e03a3a"); if (Math.sin(game.time * 5) > 0.3) { const t = toScreen(s.x, s.y, 1.5); drawStar(t.x, t.y, 6 * ZOOM, "#ffe27a"); } }
  },
  calendar(s) { // 뒤 벽 달력: 도장 7칸
    const x = s.x - 0.45, y = HR.living.y0 - 0.02, h = houseData();
    hb(x, y, 0.75, 0.9, 0.04, 0.8, "#f4f0e6"); hb(x, y + 0.01, 1.45, 0.9, 0.04, 0.12, "#d04040");
    const got = h.calGift ? 7 : h.stamps % 7;
    for (let i = 0; i < 7; i++) hb(x + 0.08 + (i % 4) * 0.2, y + 0.02, 1.25 - Math.floor(i / 4) * 0.25, 0.14, 0.03, 0.14, i < got ? "#e04060" : "#c8c0b0");
    if (h.stampDay !== houseToday() && Math.sin(game.time * 4) > 0.5) { const t = toScreen(s.x, s.y + 0.3, 2.0); drawStar(t.x, t.y, 6 * ZOOM, "#ffb0c8"); }
  },
  sofa(s) { // 앉는 곳 (등받이는 sofaBack: 앉은 주인공보다 나중에 그려요)
    const c = "#c06a4a";
    hb(s.x - 1.2, s.y + 0.1, 0, 2.4, 0.65, 0.35, shade(c, 0.85));
    hb(s.x - 0.5, s.y + 0.2, 0.35, 0.4, 0.3, 0.12, "#ffe0a0");
  },
  sofaBack(s) {
    const c = "#c06a4a";
    hb(s.x - 1.2, s.y + 0.75, 0, 2.4, 0.22, 0.75, c);
    for (const ox of [-1.32, 1.08]) hb(s.x + ox, s.y + 0.1, 0, 0.24, 0.87, 0.55, shade(c, 0.75));
  },
  bed(s) {
    const x = s.x - 0.65, y = s.y - 1.1;
    hb(x, y, 0, 1.3, 2.2, 0.32, "#7a5530"); hb(x, y, 0, 1.3, 0.16, 0.9, "#6b4a2a");
    hb(x + 0.05, y + 0.15, 0.32, 1.2, 2.0, 0.14, "#f4f0e6"); hb(x + 0.18, y + 0.24, 0.46, 0.94, 0.4, 0.12, "#ffffff");
    hb(x + 0.04, y + 0.85, 0.46, 1.22, 1.32, 0.08, "#5a8ad0"); hb(x + 0.04, y + 0.85, 0.54, 1.22, 0.14, 0.02, "#8ab4f0");
    if (house.sleepT > 0) { const c = toScreen(s.x, s.y - 0.6, 1.1 + (game.time % 1.2)); text("Z", c.x, c.y, Math.round(10 * ZOOM), "#cfe0ff", "center"); }
  },
  alarm(s) { // 협탁 + 알람시계 (울리면 흔들)
    hb(s.x - 0.3, s.y - 0.3, 0, 0.6, 0.6, 0.5, "#8a6038");
    const j = house.alarmT > 0 ? Math.sin(game.time * 60) * 0.04 : 0;
    hb(s.x - 0.14 + j, s.y - 0.08, 0.5, 0.28, 0.16, 0.26, "#e04040"); hb(s.x - 0.1 + j, s.y + 0.08, 0.54, 0.2, 0.02, 0.18, "#fff6e0");
    for (const ox of [-0.14, 0.08]) hb(s.x + ox + j, s.y - 0.04, 0.76, 0.08, 0.08, 0.06, "#ffd23f");
  },
  window(s) { // 뒤 벽 창문 + 커튼
    const x = s.x - 0.8, y = HR.bed.y0 - 0.02, open = houseData().curtain;
    hb(x, y, 0.6, 1.6, 0.04, 1.1, "#5a3a22");
    hb(x + 0.08, y + 0.01, 0.68, 1.44, 0.04, 0.94, open ? "#9fd8ff" : "#1a2450");
    if (open) hb(x + 1.0, y + 0.02, 1.3, 0.25, 0.03, 0.25, "#fff2a0"); else { hb(x + 1.05, y + 0.02, 1.32, 0.18, 0.03, 0.18, "#f4f0d0"); }
    const cw = open ? 0.25 : 0.72, cc = "#d86a8a";
    hb(x + 0.04, y + 0.03, 0.62, cw, 0.04, 1.05, cc); hb(x + 1.56 - cw, y + 0.03, 0.62, cw, 0.04, 1.05, cc);
  },
  mirror(s) { hb(s.x - 0.35, s.y - 0.12, 0, 0.7, 0.24, 1.7, "#c9a24a"); hb(s.x - 0.28, s.y + 0.13, 0.1, 0.56, 0.02, 1.5, "#cfe8f4"); hb(s.x - 0.1, s.y + 0.15, 0.9, 0.12, 0.01, 0.5, "#ffffff"); },
  diary(s) { // 책상 + 일기장
    hb(s.x - 0.6, s.y - 0.3, 0, 1.2, 0.6, 0.62, "#8a6038"); hb(s.x - 0.62, s.y - 0.32, 0.62, 1.24, 0.64, 0.05, "#a07040");
    hb(s.x - 0.2, s.y - 0.1, 0.67, 0.4, 0.3, 0.06, "#4a8a4a"); hb(s.x + 0.32, s.y - 0.15, 0.67, 0.06, 0.06, 0.25, "#ffd23f");
  },
  piggy(s) {
    hb(s.x - 0.25, s.y - 0.25, 0, 0.5, 0.5, 0.25, "#7a5530");
    const full = Math.min(1, houseData().piggy / PIGGY.cap), sz = 0.3 + full * 0.08;
    hb(s.x - sz / 2, s.y - sz / 2 * 0.8, 0.25, sz, sz * 0.8, sz * 0.75, "#ff9ab8");
    hb(s.x - 0.04, s.y + sz * 0.4, 0.33, 0.08, 0.04, 0.08, "#e07a98"); hb(s.x - 0.06, s.y - 0.03, 0.25 + sz * 0.75, 0.12, 0.04, 0.02, "#5a3a3a");
  },
  fridge(s) { hb(s.x - 0.45, s.y - 0.35, 0, 0.9, 0.7, 1.9, "#e8eef4"); hb(s.x - 0.45, s.y + 0.36, 1.1, 0.9, 0.01, 0.02, "#a0aab4"); hb(s.x + 0.3, s.y + 0.37, 0.5, 0.05, 0.03, 0.45, "#8090a0"); hb(s.x + 0.3, s.y + 0.37, 1.3, 0.05, 0.03, 0.35, "#8090a0"); },
  stove(s) {
    hb(s.x - 1.0, s.y - 0.3, 0, 2.0, 0.6, 0.85, "#c8c0b4"); hb(s.x - 1.02, s.y - 0.32, 0.85, 2.04, 0.64, 0.05, "#a09888");
    hb(s.x - 0.7, s.y - 0.15, 0.9, 0.4, 0.3, 0.02, "#3a3a3a"); hb(s.x + 0.2, s.y - 0.15, 0.9, 0.4, 0.3, 0.02, "#3a3a3a");
    hb(s.x - 0.65, s.y - 0.1, 0.92, 0.3, 0.2, 0.18, "#5a5a6a"); // 냄비
    hb(s.x - 0.8, s.y + 0.31, 0.15, 1.6, 0.02, 0.55, "#b0a898");
  },
  sink(s) { hb(s.x - 0.6, s.y - 0.3, 0, 1.2, 0.6, 0.85, "#c8c0b4"); hb(s.x - 0.4, s.y - 0.15, 0.86, 0.8, 0.35, 0.02, "#8ab4d0"); hb(s.x - 0.03, s.y - 0.28, 0.86, 0.06, 0.06, 0.3, "#b0b8c0"); },
  table(s) { hb(s.x - 0.7, s.y - 0.5, 0.6, 1.4, 1.0, 0.08, "#a07040"); for (const [ox, oy] of [[-0.6, -0.4], [0.5, -0.4], [-0.6, 0.4], [0.5, 0.4]]) hb(s.x + ox, s.y + oy, 0, 0.08, 0.08, 0.6, "#7a5530"); hb(s.x - 0.15, s.y - 0.15, 0.68, 0.3, 0.3, 0.1, "#ff9050"); },
  bowl(s) { hb(s.x - 0.2, s.y - 0.2, 0, 0.4, 0.4, 0.1, "#e04a4a"); hb(s.x - 0.15, s.y - 0.15, 0.1, 0.3, 0.3, 0.01, house.bowlT > 0 ? "#c08040" : "#7a2a2a"); },
  darts(s) { // 뒤 벽 다트판
    const x = s.x - 0.45, y = HR.play.y0 - 0.02;
    hb(x, y, 0.85, 0.9, 0.04, 0.9, "#2a2a2a");
    hb(x + 0.1, y + 0.01, 0.95, 0.7, 0.04, 0.7, "#f0e0c0"); hb(x + 0.22, y + 0.02, 1.07, 0.46, 0.04, 0.46, "#d04040"); hb(x + 0.36, y + 0.03, 1.21, 0.18, 0.04, 0.18, "#30a050");
  },
  blocks(s) {
    const B = house.blocks, cols = ["#e04a4a", "#4a8ad0", "#ffd23f", "#50b060", "#b060d0"];
    if (B.fall > 0) { for (let i = 0; i < B.fallN; i++) { const a = i * 2.1, d = (1 - B.fall) * 1.2; hb(s.x + Math.cos(a) * d - 0.15, s.y + Math.sin(a) * d * 0.7 - 0.15, Math.max(0, (B.fall - 0.3) * (i % 3)), 0.3, 0.3, 0.22, cols[i % 5]); } }
    else for (let i = 0; i < B.n; i++) { const wob = Math.sin(game.time * 3 + i) * 0.01 * i; hb(s.x - 0.16 + wob, s.y - 0.16, i * 0.22, 0.32, 0.32, 0.22, cols[i % 5]); }
    if (!B.n && B.fall <= 0) hb(s.x - 0.16, s.y - 0.16, 0, 0.32, 0.32, 0.22, cols[0]);
  },
  toybox(s) { hb(s.x - 0.4, s.y - 0.3, 0, 0.8, 0.6, 0.45, "#e8a040"); hb(s.x - 0.42, s.y - 0.32, 0.45, 0.84, 0.64, 0.06, "#d04a4a"); hb(s.x - 0.1, s.y - 0.1, 0.5, 0.2, 0.2, 0.15, "#4a8ad0"); },
};
function drawHouseBall() {
  const b = house.ball; if (!b) return;
  const s = toScreen(b.x, b.y, 0);
  ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(s.x, s.y, 9 * ZOOM * 0.6, 4.5 * ZOOM * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const t = toScreen(b.x, b.y, 0.25 + b.z), r = 10 * ZOOM * 0.75;
  ctx.save(); ctx.fillStyle = "#ff5a5a"; ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2 * ZOOM * 0.6; ctx.beginPath(); ctx.arc(t.x, t.y, r * 0.65, b.spin, b.spin + Math.PI); ctx.stroke(); ctx.restore();
}

// 부딪히는 자리 (캠프를 새로 만들 때마다 한 번)
const HOUSE_SOLIDS = { stash: [[0, 0, 0.38]], codex: [[0, -0.05, 0.45]], catalog: [[0, 0, 0.42]], fire: [[-0.5, 0, 0.42], [0.5, 0, 0.42]], mailbox: [[0, 0, 0.25]],
  sofa: [[-1.2, 0.5, 0.15], [1.2, 0.5, 0.15], [-0.7, 0.86, 0.12], [0, 0.86, 0.12], [0.7, 0.86, 0.12]], alarm: [[0, 0, 0.35]], mirror: [[0, 0, 0.35]], diary: [[-0.35, 0, 0.35], [0.35, 0, 0.35]], piggy: [[0, 0, 0.3]],
  fridge: [[0, 0, 0.45]], stove: [[-0.55, 0, 0.36], [0.55, 0, 0.36]], sink: [[0, 0, 0.38]], table: [[0, 0, 0.6]], darts: [], blocks: [[0, 0, 0.25]], toybox: [[0, 0, 0.38]],
  bed: [[0, -0.8, 0.55], [0, -0.25, 0.55], [0, 0.3, 0.55], [0, 0.85, 0.55]] };
function houseAddSolids() {
  if (!world.solids || world.solids.__house) return;
  world.solids.__house = true;
  const O = HOUSE_OUT;
  for (let yy = O.y + 0.25; yy <= O.y + O.d - 0.2; yy += 0.45) for (let xx = O.x + 0.25; xx <= O.x + O.w - 0.2; xx += 0.45) world.solids.push({ x: xx, y: yy, r: 0.3 });
  for (const [id, list] of Object.entries(HOUSE_SOLIDS)) { const s = HOUSE_SPOTS[id]; for (const [ox, oy, r] of list) world.solids.push({ x: s.x + ox, y: s.y + oy, r }); }
  for (const id of Object.keys(HOUSE_FURN)) { const f = HOUSE_FURN[id]; if (f.r && houseOwns(id)) world.solids.push({ x: f.x, y: f.y, r: f.r }); }
  if (typeof houseTrophySolids === "function") houseTrophySolids();
}
// 물건마다 깊이 (벽에 붙은 건 벽 바로 앞)
function houseFixDepth(id, s) { return id === "calendar" || id === "window" || id === "darts" ? s.x + s.y + 0.05 : s.x + s.y; }
const HOUSE_FIX_ROOM = { stash: "living", codex: "living", catalog: "living", fire: "living", mailbox: "living", calendar: "living", sofa: "living",
  bed: "bed", alarm: "bed", window: "bed", mirror: "bed", diary: "bed", piggy: "bed", fridge: "kitchen", stove: "kitchen", sink: "kitchen", table: "kitchen", bowl: "kitchen",
  darts: "play", blocks: "play", toybox: "play" };
const HOUSE_FURN_ROOM = { rug: "living", plant: "living", painting: "living", lamp: "bed", starlamp: "bed", teddy: "play", fishtank: "play", piano: "play",
  q_owlclock: "living", q_lighthouse: "bed", q_telescope: "bed", q_lantern: "kitchen", q_starjar: "play" };
hookOn("lobbyThings", (things) => {
  houseAddSolids();
  const O = HOUSE_OUT;
  // 집 앞(문 쪽·오른쪽)에 선 주인공보다는 먼저 그려요 (주인공을 덮지 않게)
  let depth = O.x + O.y + O.w + O.d - 0.5;
  for (const q of allPlayers()) if (q && (q.y > O.y + O.d - 0.05 || q.x > O.x + O.w - 0.05) && Math.abs(q.x - (O.x + O.w / 2)) < 4 && Math.abs(q.y - (O.y + O.d / 2)) < 4) depth = Math.min(depth, q.x + q.y - 0.03);
  things.push({ depth, x: O.x, y: O.y, draw: drawHouseOutside });
  const vis = new Set(houseRooms().filter(houseRoomVisible).map((r) => r.id));
  if (!vis.size) return;
  for (const d of houseLayout().doors) if (d.room && vis.has(d.room)) things.push({ depth: d.wall === "left" ? d.wx + 1 + d.wy + 0.1 : d.wx + d.wy + 1 + 0.1, x: d.wx, y: d.wy, draw: () => drawHouseDoor(d) });
  for (const [id, room] of Object.entries(HOUSE_FIX_ROOM)) { if (!vis.has(room)) continue; const s = HOUSE_SPOTS[id]; things.push({ depth: houseFixDepth(id, s), x: s.x, y: s.y, draw: () => HOUSE_FIX[id](s) }); }
  if (vis.has("living")) { const s = HOUSE_SPOTS.sofa; things.push({ depth: s.x + s.y + 0.9, x: s.x, y: s.y, draw: () => HOUSE_FIX.sofaBack(s) }); }
  for (const [id, room] of Object.entries(HOUSE_FURN_ROOM)) {
    if (!vis.has(room) || !houseOwns(id)) continue;
    const f = HOUSE_FURN[id], dep = id === "rug" ? 0 : id === "painting" ? HR.living.x0 + f.y + 0.15 : f.x + f.y;
    things.push({ depth: dep, x: f.x, y: f.y, draw: () => HOUSE_DRAW[id](f) });
  }
  if (vis.has("play") && house.ball) things.push({ depth: house.ball.x + house.ball.y, x: house.ball.x, y: house.ball.y, draw: drawHouseBall });
  if (vis.has("hall")) { const r = houseRoom("hall"); things.push({ depth: 0.5, x: r.x0, y: r.y0, draw: () => { hb(r.x0 + 0.4, r.y0 + 1.6, 0, r.w - 0.8, 1.6, 0.02, "#8a2a2a"); hb(r.x0 + 0.5, r.y0 + 1.7, 0.02, r.w - 1.0, 1.4, 0.01, "#b04040"); } }); }
  if (typeof houseTrophyThings === "function") houseTrophyThings(things, vis);
}, 62);

hookOn("lights", (lights) => {
  if (game.scene !== "lobby") return;
  const h = houseData();
  for (const r of houseRooms()) {
    if (!houseRoomVisible(r)) continue;
    let rad = Math.max(r.w, r.d) * 0.8 + 2, pow = 1;
    if (r.id === "bed" && !h.curtain) { rad = 3.5; pow = 0.55; } // 커튼을 치면 밤: 어두워요
    lights.push({ x: r.x0 + r.w / 2, y: r.y0 + r.d / 2, radius: rad, power: pow });
    if (r.id === "hall") for (let x = r.x0 + 2; x < r.x1; x += 5) lights.push({ x, y: r.y0 + 1.5, radius: 3.5, power: 0.8 });
  }
  const F = HOUSE_SPOTS.fire; if (h.fire) lights.push({ x: F.x, y: F.y + 0.8, radius: 4.5 * (0.92 + 0.08 * Math.sin(game.time * 11)), power: 1 });
  if (houseOwns("lamp") && h.lamp) lights.push({ x: HOUSE_FURN.lamp.x, y: HOUSE_FURN.lamp.y, radius: 4.5, power: 0.9 });
  if (houseOwns("starlamp")) lights.push({ x: HOUSE_FURN.starlamp.x, y: HOUSE_FURN.starlamp.y, radius: 3.2, power: 0.8 });
  if (houseOwns("q_lantern")) lights.push({ x: HOUSE_FURN.q_lantern.x, y: HOUSE_FURN.q_lantern.y, radius: 3.4, power: 0.85 });
  if (houseOwns("q_lighthouse") && h.lighthouse) lights.push({ x: HOUSE_FURN.q_lighthouse.x, y: HOUSE_FURN.q_lighthouse.y, radius: 3, power: 0.8 });
  if (houseOwns("q_starjar")) lights.push({ x: HOUSE_FURN.q_starjar.x, y: HOUSE_FURN.q_starjar.y, radius: 2.4, power: 0.7 });
  const O = HOUSE_OUT; lights.push({ x: O.x + O.w / 2, y: O.y + O.d + 0.5, radius: 2.6, power: 0.55 });
});

// 왼쪽 위 화면 정보(하트·기술 칸) 자리에 걸리는 글은 그 아래로 내려요
const HOUSE_HUD_BOX = { w: 250, h: 268 };
function houseLabelClear(s) { if (s.x < HOUSE_HUD_BOX.w && s.y < HOUSE_HUD_BOX.h) s.y = HOUSE_HUD_BOX.h + 10; return s; }
// 이름표 (문 위 방 이름 · 캠프의 "우리 집")
function drawHouseLabels() {
  if (game.scene !== "lobby" || game.overlay) return;
  const p = game.player; if (!p) return;
  const O = HOUSE_OUT, r = houseRoomAt(p.x, p.y);
  if (!r && Math.hypot(p.x - (O.x + O.w / 2), p.y - (O.y + O.d / 2)) < 7) { const s = toScreen(O.x + O.w / 2, O.y + O.d / 2, 3.4); text("우리 집", s.x, s.y, 14 * ZOOM * 0.8, "#ffe27a", "center"); }
  if (!r) return;
  for (const d of houseLayout().doors) {
    if (d.room !== r.id || (game.nearNpc && game.nearNpc.x === d.spot.x && game.nearNpc.y === d.spot.y)) continue; // 바로 앞 문은 안내 글(E 키)이 대신 말해요
    const s = d.wall === "left" ? toScreen(d.wx + 1, d.wy, 2.0) : toScreen(d.wx, d.wy + 1, 2.0), lock = houseDoorLock(d);
    houseLabelClear(s);
    text(lock ? `${d.label} (잠김)` : d.label, s.x, s.y, Math.round(8 * ZOOM), lock ? "#bbb" : "#ffe27a", "center");
  }
  if (r.world !== undefined && typeof drawTrophyRoomLabels === "function") drawTrophyRoomLabels(r);
}
hookOn("hudDraw", drawHouseLabels, 40);

// ===================== E 로 쓰는 것 =====================
function houseItem(list, id, opt) { const s = opt.at || HOUSE_SPOTS[id]; list.push({ x: s.x, y: s.y + (opt.dy || 0), range: opt.range || 1.4, label: opt.label, short: opt.short, prompt: opt.prompt, action: opt.action, local: true }); }
hookOn("lobbyInteractables", (list) => {
  const h = houseData(), S = HOUSE_SPOTS;
  for (const d of houseLayout().doors) {
    const lock = houseDoorLock(d);
    list.push({ x: d.spot.x, y: d.spot.y, range: d.wall === "out" ? 1.3 : 1.15, label: d.wall === "out" ? "우리 집" : "문", short: d.wall === "out" ? "집" : lock ? "잠김" : "문",
      prompt: d.wall === "out" ? "집에 들어가기" : lock ? `${d.label} 트로피 룸 (잠김: ${lock})` : `${d.label} 가기`, action: () => houseUseDoor(d.id) });
  }
  // 거실
  houseItem(list, "stash", { range: 1.5, label: "공용 보관함", short: "보관함", prompt: "공용 보관함 열기", action: () => openHero("stash"), at: { x: S.stash.x + 0.4, y: S.stash.y } });
  houseItem(list, "codex", { range: 1.5, label: "도감", short: "도감", prompt: "몬스터 도감 보기", action: () => openCodex(), at: { x: S.codex.x, y: S.codex.y + 0.5 } });
  houseItem(list, "catalog", { range: 1.5, label: "꾸미기 책", short: "꾸미기", prompt: "집 꾸미기 (가구·벽지·바닥)", action: openHouseCatalog });
  houseItem(list, "fire", { range: 1.6, label: "벽난로", short: "불", prompt: h.fire ? "벽난로 불 끄기" : "벽난로 불 켜기", action: houseFireToggle, at: { x: S.fire.x, y: S.fire.y + 0.6 } });
  houseItem(list, "mailbox", { range: 1.3, label: "우편함", short: "편지", prompt: houseHasMail() ? "우편함에 편지가 왔어요!" : "우편함 보기", action: houseMailOpen });
  houseItem(list, "calendar", { range: 1.2, label: "출석 달력", short: "도장", prompt: h.stampDay === houseToday() ? `출석 달력 (오늘 도장 찍었어요 · ${houseStampText()})` : `출석 도장 찍기 (${houseStampText()})`, action: houseStamp, at: { x: S.calendar.x, y: S.calendar.y + 0.6 } });
  houseItem(list, "sofa", { range: 1.3, label: "소파", short: "앉기", prompt: "소파에 앉기", action: houseSit, at: { x: S.sofa.x, y: S.sofa.y + 0.3 } });
  // 침실
  houseItem(list, "bed", { range: 1.6, label: "침대", short: "자기", prompt: h.slept === houseToday() ? "침대에서 쉬기 (오늘 꿈 선물은 받았어요)" : "침대에서 자기 (하루 한 번 꿈 선물!)", action: houseSleep, at: { x: S.bed.x - 0.9, y: S.bed.y } });
  houseItem(list, "window", { range: 1.2, label: "커튼", short: "커튼", prompt: h.curtain ? "커튼 치기 (밤)" : "커튼 열기 (낮)", action: houseCurtain, at: { x: S.window.x, y: S.window.y + 0.6 } });
  houseItem(list, "piggy", { range: 1.3, label: "저금통", short: "저금", prompt: `저금통 (${h.piggy}개 · 하루마다 조금씩 불어나요)`, action: openPiggy, at: { x: S.piggy.x + 0.55, y: S.piggy.y } });
  houseItem(list, "diary", { range: 1.4, label: "일기장", short: "일기", prompt: "오늘 일기 보기", action: houseDiaryOpen, at: { x: S.diary.x, y: S.diary.y + 0.6 } });
  houseItem(list, "mirror", { range: 1.2, label: "거울", short: "거울", prompt: "거울 앞에서 옷 갈아입기", action: () => { if (typeof openWardrobe === "function") openWardrobe(); }, at: { x: S.mirror.x, y: S.mirror.y + 0.55 } });
  houseItem(list, "alarm", { range: 1.2, label: "알람시계", short: "따르릉", prompt: "알람시계 울리기", action: houseAlarm, at: { x: S.alarm.x - 0.6, y: S.alarm.y } });
  // 부엌
  houseItem(list, "fridge", { range: 1.5, label: "냉장고", short: "냉장고", prompt: "냉장고 열기 (음식 넣기·꺼내기)", action: openFridge, at: { x: S.fridge.x + 0.3, y: S.fridge.y + 0.7 } });
  houseItem(list, "stove", { range: 1.5, label: "요리대", short: "요리", prompt: `요리하기: 빵 2개 -> 도시락 (빵 ${houseFoodHave("bread")}개)`, action: () => houseCook("lunch"), at: { x: S.stove.x, y: S.stove.y + 0.65 } });
  houseItem(list, "bowl", { range: 1.2, label: "강아지 밥그릇", short: "밥", prompt: "강아지 밥 주기", action: houseFeedDog });
  // 놀이방
  houseItem(list, "darts", { range: 1.3, label: "다트판", short: "다트", prompt: `다트 놀이 10초 (최고 ${h.dartsBest}점)`, action: houseDartsStart, at: { x: S.darts.x, y: S.darts.y + 0.7 } });
  houseItem(list, "blocks", { range: 1.2, label: "블록", short: "쌓기", prompt: `블록 쌓기 (지금 ${house.blocks.n}층 · 최고 ${h.blockBest}층)`, action: houseBlockStack });
  if (house.ball) list.push({ x: house.ball.x, y: house.ball.y, range: 0.9, label: "장난감 공", short: "뻥", prompt: "공 차기", action: houseKick, local: true });
  // 가구
  for (const id of Object.keys(HOUSE_FURN)) {
    const f = HOUSE_FURN[id];
    if (!f.use || !houseOwns(id)) continue;
    const p = id === "painting" ? { x: HR.living.x0 + 0.7, y: f.y } : id === "piano" ? { x: f.x, y: f.y + 1.3 } : id === "fishtank" ? { x: f.x, y: f.y + 0.8 } : f.quest ? { x: f.x, y: f.y + 0.6 } : f;
    list.push({ x: p.x, y: p.y, range: id === "fishtank" || id === "piano" ? 1.4 : 1.2, label: f.name, short: f.use.split("·")[0].slice(0, 3), prompt: houseUsePrompt(id), action: () => houseUse(id), local: true });
  }
  return list;
}, 60);
function houseUsePrompt(id) {
  const f = HOUSE_FURN[id], h = houseData();
  if (id === "lamp") return h.lamp ? "스탠드 끄기" : "스탠드 켜기";
  if (id === "plant") return h.plantDay === houseToday() ? "화분 (오늘 물은 줬어요)" : h.plant >= 3 ? "화분에 물 주기 (꽃이 활짝!)" : "화분에 물 주기";
  if (id === "starlamp") return "별빛 램프 반짝이기";
  if (id === "q_lighthouse") return h.lighthouse ? "등대 불빛 끄기" : "등대 불빛 켜기";
  if (id === "q_lantern") { const nx = HOUSE_LANTERN_C[(h.lanternC + 1) % HOUSE_LANTERN_C.length].name; return `도깨비 등불을 ${nx}색으로`; }
  if (id === "q_owlclock") return "부엉이 시계 보기";
  if (id === "q_telescope") return "망원경으로 별 보기";
  if (id === "q_starjar") return "별빛 병 흔들기";
  return `${f.name} ${f.use}`;
}
const HOUSE_TUNES = [[523, 587, 659, 523], [659, 698, 784, 659], [392, 523, 659, 784], [784, 659, 523, 392], [523, 523, 784, 784, 880, 880, 784]];
function houseUse(id) {
  const f = HOUSE_FURN[id], h = houseData();
  if (id === "lamp") { h.lamp = !h.lamp; saveProfile(); tone(h.lamp ? 880 : 440, 0.05, "square", 0.04); return; }
  if (id === "starlamp") { for (let i = 0; i < 6; i++) addSparkle(f.x + (Math.random() - 0.5) * 0.6, f.y, 0.6 + Math.random(), { vz: 0.8, life: 0.8, size: 0.35, gold: true }); tone(1320, 0.1, "sine", 0.04, 1760); return; }
  if (id === "plant") {
    if (h.plantDay === houseToday()) { showMessage("오늘은 물을 줬어요. 내일 또 줘요!", 2); return; }
    h.plantDay = houseToday(); h.plant = Math.min(3, h.plant + 1); saveProfile();
    for (let i = 0; i < 8; i++) addSparkle(f.x + (Math.random() - 0.5) * 0.4, f.y, 0.6 + Math.random() * 0.5, { vz: -0.5, life: 0.6, size: 0.3, hue: 200 });
    sfx.splash();
    showMessage(h.plant >= 3 ? "화분에 꽃이 활짝 폈어요!" : h.plant === 2 ? "꽃봉오리가 생겼어요! 내일 또 물 줘요" : "쑥쑥! 내일 또 물 줘요", 2.4);
    return;
  }
  if (id === "teddy") { house.hugT = 0.6; for (let i = 0; i < 4; i++) addFloatText(f.x + (Math.random() - 0.5) * 0.6, f.y, "♥", "#ff8ab0", 16); tone(660, 0.12, "sine", 0.05, 880); return; }
  if (id === "fishtank") { house.fish = 3; for (let i = 0; i < 6; i++) addSparkle(f.x + (Math.random() - 0.5) * 0.6, f.y, 1.25, { vz: -0.4, life: 0.8, size: 0.25, gold: true }); tone(1200, 0.06, "sine", 0.04, 1600); showMessage("물고기들이 신났어요!", 1.6); return; }
  if (id === "piano") { const t = HOUSE_TUNES[house.tune++ % HOUSE_TUNES.length]; t.forEach((fr, i) => tone(fr, 0.22, "triangle", 0.07, null, i * 0.2)); for (let i = 0; i < 3; i++) addFloatText(f.x + (i - 1) * 0.4, f.y, "♪", "#ffe27a", 16); return; }
  if (id === "painting") { showMessage("햇빛 땅의 산과 해 그림이에요", 2); return; }
  if (id === "q_owlclock") {
    house.owlT = 1.5;
    const d = new Date(), hh = d.getHours(), mm = d.getMinutes(), ap = hh < 12 ? "오전" : "오후", h12 = hh % 12 || 12;
    tone(620, 0.18, "sine", 0.06, 520); tone(520, 0.25, "sine", 0.06, 420, 0.25);
    showMessage(`부엉부엉! 지금은 ${ap} ${h12}시 ${mm}분이에요`, 2.6);
    return;
  }
  if (id === "q_lighthouse") { h.lighthouse = !h.lighthouse; saveProfile(); tone(h.lighthouse ? 990 : 495, 0.08, "sine", 0.05); if (h.lighthouse) showMessage("등대 불빛이 빙글빙글 돌아요", 1.8); return; }
  if (id === "q_lantern") {
    h.lanternC = (h.lanternC + 1) % HOUSE_LANTERN_C.length; saveProfile();
    const nm = HOUSE_LANTERN_C[h.lanternC].name;
    tone(700 + h.lanternC * 120, 0.1, "triangle", 0.05);
    showMessage(`도깨비 등불이 ${nm}색이 됐어요!`, 1.8);
    return;
  }
  if (id === "q_telescope") { house.scopeT = 4; house.scopeSeed = Math.floor(Math.random() * HOUSE_STARS.length); game.overlay = "hscope"; tone(880, 0.3, "sine", 0.04, 1320); return; }
  if (id === "q_starjar") {
    house.jarT = 1.5;
    for (let i = 0; i < 10; i++) addSparkle(f.x + (Math.random() - 0.5) * 0.4, f.y, 0.6 + Math.random() * 0.6, { vz: 0.9, life: 0.9, size: 0.35, hue: Math.random() * 360 });
    [523, 659, 784, 1047].forEach((fr, i) => tone(fr, 0.12, "sine", 0.04, null, i * 0.07));
    showMessage("블랙홀에서 지켜 낸 색깔들이 반짝반짝 춤춰요", 2.4);
    return;
  }
}
// 망원경 별자리 (아이용 이름)
const HOUSE_STARS = [
  { name: "강아지 별자리", pts: [[0.2, 0.6], [0.35, 0.45], [0.5, 0.5], [0.65, 0.4], [0.75, 0.55], [0.6, 0.7]] },
  { name: "큰 국자 별자리", pts: [[0.15, 0.4], [0.3, 0.42], [0.45, 0.45], [0.6, 0.5], [0.62, 0.68], [0.82, 0.7], [0.8, 0.52]] },
  { name: "부엉이 별자리", pts: [[0.35, 0.3], [0.65, 0.3], [0.72, 0.55], [0.5, 0.75], [0.28, 0.55], [0.35, 0.3]] },
  { name: "왕관 별자리", pts: [[0.2, 0.6], [0.3, 0.35], [0.42, 0.55], [0.5, 0.3], [0.58, 0.55], [0.7, 0.35], [0.8, 0.6]] },
];

// ----- 거실: 벽난로 · 소파 · 우편함 · 출석 달력 -----
function houseFireToggle() { const h = houseData(); h.fire = !h.fire; saveProfile(); if (h.fire) { noise(0.4, 0.12, 900, "lowpass"); showMessage("타닥타닥, 따뜻해요", 1.6); } else tone(300, 0.15, "sine", 0.04, 150); }
function houseSit() {
  const s = HOUSE_SPOTS.sofa, p = game.player;
  const seat = { x: s.x, y: s.y + 0.42 };
  p.x = seat.x; p.y = seat.y; p.faceX = 0; p.faceY = -1;
  house.sit = { pid: p.pid || 1, x: seat.x, y: seat.y, t: 0 };
  showMessage("푹신! 앉아 있으면 하트가 조금씩 차요 (움직이면 일어나요)", 2.4);
}
const HOUSE_LETTERS = [
  { from: "상인", text: "새 물건이 들어왔어요! 가게에 놀러 와요." },
  { from: "대장장이", text: "장비가 낡았으면 언제든 와요. 땅땅 고쳐 줄게요." },
  { from: "강아지", text: "멍! 멍멍! (같이 놀자는 뜻 같아요)" },
  { from: "부엉 할아버지", text: "밤하늘에 회색 별이 떨어지는 걸 봤단다. 조심하렴." },
  { from: "소원 우물", text: "퐁당! 오늘의 소원은 이루어질까요?" },
  { from: "이웃 모험가", text: "어제 동굴에서 반짝이는 상자를 봤어요!" },
  { from: "꼬마 유령", text: "무섭지 않아요. 그냥 인사하고 싶었어요. 안녕!" },
];
function houseHasMail() { const h = houseData(); return h.mail.length > 0 || h.mailDay !== houseToday(); }
// 다른 파일(이야기·퀘스트)이 편지를 보내요: houseAddLetter("글", { emeralds: 5 }, "보낸 이")
function houseAddLetter(text, gift, from) {
  const h = game.profile && game.profile.house; if (!h || typeof text !== "string") return false;
  h.mail.push({ text: text.slice(0, 200), gift: houseCleanGift(gift), from: typeof from === "string" ? from.slice(0, 20) : "" });
  if (h.mail.length > 20) h.mail.shift();
  saveProfile();
  return true;
}
function houseCleanGift(g) { const n = typeof g === "number" ? g : g && typeof g === "object" ? g.emeralds : 0; return Number.isFinite(n) && n > 0 ? { emeralds: Math.min(99, Math.floor(n)) } : null; }
function houseMailOpen() {
  const h = houseData(), pr = game.profile;
  let letter = null;
  if (h.mail.length) letter = h.mail.shift();
  else if (h.mailDay !== houseToday()) {
    h.mailDay = houseToday();
    const L = HOUSE_LETTERS[Math.floor(Math.random() * HOUSE_LETTERS.length)];
    letter = { from: L.from, text: L.text, gift: Math.random() < 0.3 ? { emeralds: 2 + Math.floor(Math.random() * 3) } : null };
  }
  if (!letter) { showMessage("오늘 편지는 다 읽었어요. 내일 또 와요!", 2.2); return null; }
  const lines = [letter.text];
  if (letter.gift && letter.gift.emeralds) { pr.emeralds += letter.gift.emeralds; lines.push(`선물: 에메랄드 ${letter.gift.emeralds}개!`); sfx.emerald(); } else sfx.click();
  saveProfile();
  houseNoteOpen(letter.from ? `${letter.from}의 편지` : "편지", lines);
  return letter;
}
// ----- 이야기 편지: 월드의 마지막 큰 이야기(main 퀘스트 중 마지막)를 끝내면 그 월드 이야기꾼이 고맙다는 편지를 보내요 (월드마다 한 번) -----
const HOUSE_STORY_LETTERS = {
  1: "숲 친구들이 다시 웃는단다. 회색 별 조각을 찾아 줘서 고맙구나. 바다 쪽도 부탁하마.",
  2: "등대 불빛이 다시 노랗게 빛나요. 바다 친구들도 노래해요. 정말 고마워요, 꼬마 모험가.",
  3: "조각끼리 끌어당긴다는 걸 알아낸 건 다 네 덕분이야! 내 망원경 일지에 네 이름을 적었어.",
  4: "땅속 두드리는 소리가 멈췄어! 너 진짜 대단해. 우리 아빠도 너 칭찬 엄청 했어.",
  5: "고마워. 공허에 색이 돌아왔어. 장막도 이제 조용해. 가끔 놀러 와.",
};
function houseStoryLetter(q) {
  const pr = game.profile, h = pr && pr.house;
  if (!q || !q.main || !h || typeof questsOf !== "function") return false;
  const w = q.world, mains = questsOf(w).filter((x) => x.main);
  if (!mains.length || Math.max(...mains.map((x) => x.order)) !== q.order) return false; // 마지막 큰 이야기일 때만
  if (h.letters[w]) return false; // 한 번만
  h.letters[w] = true;
  const g = typeof QUEST_GIVERS !== "undefined" && QUEST_GIVERS[w];
  const wn = houseWorldName(w), text = HOUSE_STORY_LETTERS[w] || `${josa(wn, "을/를")} 지켜 줘서 고마워요!`;
  houseAddLetter(text, { emeralds: 10 }, g ? g.name : "이야기꾼");
  return true;
}
hookOn("questDone", houseStoryLetter, 60);

const HOUSE_CAL_DAYS = 7;
function houseStampText() { const h = houseData(); return h.calGift ? `도장 ${h.stamps}개` : `도장 ${h.stamps}/${HOUSE_CAL_DAYS}`; }
function houseStamp() {
  const h = houseData();
  if (h.stampDay === houseToday()) { showMessage(`오늘 도장은 찍었어요 (${houseStampText()})`, 2); return false; }
  h.stampDay = houseToday(); h.stamps++;
  tone(880, 0.08, "square", 0.05); tone(1175, 0.1, "square", 0.05, null, 0.09);
  if (h.stamps >= HOUSE_CAL_DAYS && !h.calGift) {
    h.calGift = true; houseGiveFurn("starlamp");
    showMessage("도장 7개! 선물로 별빛 램프가 침실에 생겼어요!", 3.5, true);
  } else showMessage(`쾅! 출석 도장 (${houseStampText()})`, 2);
  saveProfile();
  return true;
}

// ----- 침실: 침대 · 커튼 · 저금통 · 일기장 · 알람시계 -----
function houseSleep() {
  if (house.sleepT > 0) return;
  house.sleepT = 2.6;
  game.overlay = "sleep";
  for (const q of houseLocalPlayers()) q.hp = q.maxHp;
  tone(392, 0.4, "sine", 0.05); tone(330, 0.5, "sine", 0.05, null, 0.4);
  const h = houseData(), pr = game.profile;
  if (h.slept === houseToday()) { house.sleepMsg = "푹 쉬었어요! (꿈 선물은 하루에 한 번, 내일 또 와요)"; return; }
  h.slept = houseToday();
  const r = Math.random();
  if (r < 0.5 || (pr.potions >= CONFIG.player.maxPotions && pr.arrows >= CONFIG.player.maxArrows)) { const n = 4 + Math.floor(Math.random() * 6); pr.emeralds += n; house.sleepMsg = `꿈 선물: 에메랄드 ${n}개!`; }
  else if (r < 0.75 && pr.potions < CONFIG.player.maxPotions) { pr.potions += 1; house.sleepMsg = "꿈 선물: 물약 1개!"; }
  else { const n = Math.min(15, CONFIG.player.maxArrows - pr.arrows); if (n > 0) { pr.arrows += n; house.sleepMsg = `꿈 선물: 화살 ${n}개!`; } else { pr.emeralds += 5; house.sleepMsg = "꿈 선물: 에메랄드 5개!"; } }
  saveProfile();
}
function houseCurtain() { const h = houseData(); h.curtain = !h.curtain; saveProfile(); noise(0.25, 0.08, 2000); showMessage(h.curtain ? "커튼을 열었어요. 햇빛!" : "커튼을 쳤어요. 쉿, 밤이에요", 1.8); }
function houseAlarm() { house.alarmT = 1.2; for (let i = 0; i < 8; i++) tone(i % 2 ? 1568 : 1319, 0.07, "square", 0.04, null, i * 0.08); showMessage("따르릉! 일어나요!", 1.4); }
// 저금통: 넣어 두면 하루마다 10개당 1개씩 불어나요 (하루 최대 5개, 저금통은 200개까지)
const PIGGY = { cap: 200, per: 10, maxDay: 5 };
function piggyAccrue() {
  const h = houseData(), today = houseDayNum();
  if (!h.piggyDay || h.piggy <= 0) { h.piggyDay = today; return 0; }
  const days = Math.max(0, Math.min(60, today - h.piggyDay));
  let got = 0;
  for (let i = 0; i < days && h.piggy < PIGGY.cap; i++) { const add = Math.min(PIGGY.maxDay, Math.floor(h.piggy / PIGGY.per), PIGGY.cap - h.piggy); h.piggy += add; got += add; }
  h.piggyDay = today;
  return got;
}
function piggyDeposit(n) {
  const h = houseData(), pr = game.profile;
  piggyAccrue();
  n = Math.max(0, Math.min(Math.floor(n), pr.emeralds, PIGGY.cap - h.piggy));
  if (!n) { house.note = h.piggy >= PIGGY.cap ? "저금통이 꽉 찼어요 (200개)" : "넣을 에메랄드가 없어요"; house.noteC = "#ff9090"; return 0; }
  pr.emeralds -= n; h.piggy += n; saveProfile();
  house.note = `${n}개 넣었어요!`; house.noteC = "#7dffb0"; sfx.coin();
  return n;
}
function piggyWithdraw() {
  const h = houseData(), pr = game.profile;
  piggyAccrue();
  const n = h.piggy; if (!n) return 0;
  pr.emeralds += n; h.piggy = 0; saveProfile();
  house.note = `${n}개 꺼냈어요!`; house.noteC = "#7dffb0"; sfx.emerald();
  return n;
}
function openPiggy() {
  const got = piggyAccrue(); saveProfile();
  house.note = got ? `저금통이 ${got}개 불어났어요!` : ""; house.noteC = "#7dffb0";
  game.overlay = "piggy"; sfx.equip();
}
// 일기장: 오늘 한 일 (기록판 숫자에서 오늘 아침 숫자를 빼요)
const HOUSE_DIARY_KEYS = [["kills", "잡은 몬스터", "마리"], ["chests", "연 상자", "개"], ["bosses", "물리친 보스", "명"], ["clears", "깬 던전", "번"]];
function houseDiaryRoll(pr = game.profile) {
  const h = pr.house, st = pr.stats || {};
  if (h.diary.day === houseToday() && h.diary.base) return;
  h.diary = { day: houseToday(), base: Object.fromEntries(HOUSE_DIARY_KEYS.map(([k]) => [k, st[k] || 0])), lv: pr.level || 1 };
}
function houseDiaryLines() {
  houseDiaryRoll();
  const h = houseData(), st = game.profile.stats || {}, b = h.diary.base, out = [];
  for (const [k, name, unit] of HOUSE_DIARY_KEYS) out.push(`${name}: ${Math.max(0, (st[k] || 0) - (b[k] || 0))}${unit}`);
  const up = (game.profile.level || 1) - (h.diary.lv || 1);
  if (up > 0) out.push(`레벨이 ${up} 올랐어요! (지금 Lv ${game.profile.level})`);
  const tr = Object.values(game.profile.trophies || {}).filter((t) => t && t.wins).length;
  out.push(`모은 트로피: ${tr}개`);
  return out;
}
function houseDiaryOpen() { saveProfile(); houseNoteOpen(`${houseToday().replace(/-/g, ". ")} 오늘의 일기`, houseDiaryLines()); sfx.click(); }
hookOn("profileLoaded", (pr) => { if (pr && pr.house) houseDiaryRoll(pr); }, 70);

// ----- 부엌: 냉장고 · 요리대 · 강아지 밥그릇 -----
const FRIDGE_MAX = 99;
function houseFoodHave(id) { return typeof foodCount === "function" ? foodCount(id) : 0; }
function fridgeCount(id) { const n = houseData().fridge[id]; return Number.isFinite(n) && n > 0 ? n : 0; }
// 가방 -> 냉장고 (n 개까지)
function houseFridgePut(id, n = 1) {
  if (typeof foodById !== "function" || !foodById(id)) return 0;
  const h = houseData();
  n = Math.max(0, Math.min(Math.floor(n), houseFoodHave(id), FRIDGE_MAX - fridgeCount(id)));
  for (let i = 0; i < n; i++) foodTake(id);
  if (n) { h.fridge[id] = fridgeCount(id) + n; saveProfile(); }
  return n;
}
// 냉장고 -> 가방 (가방은 한 종류 FOOD_MAX 까지)
function houseFridgeTake(id, n = 1) {
  if (typeof foodById !== "function" || !foodById(id)) return 0;
  const h = houseData();
  n = Math.max(0, Math.min(Math.floor(n), fridgeCount(id), FOOD_MAX - houseFoodHave(id)));
  if (!n) return 0;
  foodAdd(id, n); h.fridge[id] = fridgeCount(id) - n; if (!h.fridge[id]) delete h.fridge[id];
  saveProfile();
  return n;
}
function openFridge() { if (typeof FOODS === "undefined") return; game.overlay = "fridge"; house.note = ""; sfx.equip(); }
const HOUSE_RECIPES = { lunch: { name: "도시락", need: { bread: 2 } } };
// 요리: 재료는 가방에서 먼저, 모자라면 냉장고에서. 다 된 도시락은 가방에 (가득이면 냉장고에)
function houseCook(id) {
  const R = HOUSE_RECIPES[id]; if (!R || typeof foodById !== "function") return false;
  for (const [k, n] of Object.entries(R.need)) if (houseFoodHave(k) + fridgeCount(k) < n) { const nm = foodById(k).name; showMessage(`${josa(nm, "이/가")} ${n}개 있어야 해요 (가게에서 사요)`, 2.2); sfx.denied(); return false; }
  if (houseFoodHave(id) >= FOOD_MAX && fridgeCount(id) >= FRIDGE_MAX) { showMessage("도시락을 둘 곳이 없어요", 2); return false; }
  const h = houseData();
  for (const [k, n] of Object.entries(R.need)) for (let i = 0; i < n; i++) { if (!foodTake(k)) { h.fridge[k] = fridgeCount(k) - 1; if (!h.fridge[k]) delete h.fridge[k]; } }
  if (houseFoodHave(id) < FOOD_MAX) foodAdd(id, 1); else h.fridge[id] = fridgeCount(id) + 1;
  saveProfile();
  const S = HOUSE_SPOTS.stove; for (let i = 0; i < 6; i++) addSparkle(S.x + (Math.random() - 0.5) * 0.6, S.y, 1.0, { vz: 0.8, life: 0.7, size: 0.3, gold: true });
  noise(0.5, 0.1, 1500, "highpass"); tone(660, 0.15, "triangle", 0.05, 990, 0.4);
  const nm = R.name; showMessage(`보글보글! ${josa(nm, "이/가")} 완성됐어요`, 2.2, false, "#7dffb0");
  return true;
}
// 강아지 밥: 고기·빵이 있으면 하나 주고, 없어도 하루 한 번은 강아지 과자 (그 뒤 2분 동안 캠프에서 졸졸 따라와요)
function houseFeedDog() {
  const h = houseData();
  let what = null;
  for (const k of ["meat", "bread"]) if (houseFoodHave(k) > 0) { foodTake(k); what = foodById(k).name; break; }
  if (!what && h.dogDay !== houseToday()) { h.dogDay = houseToday(); what = "강아지 과자"; }
  if (!what) { showMessage("줄 음식이 없어요 (강아지 과자는 하루 한 번)", 2.2); return false; }
  if (typeof dog !== "undefined") { dog.follow = 120; dog.jump = 0.5; }
  house.bowlT = 3;
  saveProfile();
  if (typeof sfx.bark === "function") sfx.bark();
  showMessage(`${josa(what, "을/를")} 줬어요! 강아지가 한동안 졸졸 따라다녀요`, 2.6);
  return true;
}

// ----- 놀이방: 다트 · 블록 · 공 -----
function houseDartsStart() { house.darts = { t: 10, score: 0, throws: [], aimT: Math.random() * 6, aim: { x: 0, y: 0 }, cd: 0, done: false, fixedAim: null }; game.overlay = "darts"; sfx.equip(); }
function houseDartsAim(D) { if (D.fixedAim) return D.fixedAim; return { x: Math.sin(D.aimT * 1.9) * 0.85, y: Math.sin(D.aimT * 2.7 + 1) * 0.85 }; }
function houseDartsScore(x, y) { const d = Math.hypot(x, y); return d < 0.12 ? 10 : d < 0.3 ? 7 : d < 0.5 ? 5 : d < 0.75 ? 3 : d < 1 ? 1 : 0; }
function houseDartsThrow() {
  const D = house.darts; if (!D || D.done || D.cd > 0) return 0;
  const a = houseDartsAim(D), sc = houseDartsScore(a.x, a.y);
  D.throws.push({ x: a.x, y: a.y, s: sc }); D.score += sc; D.cd = 0.35;
  if (sc >= 7) tone(sc === 10 ? 1568 : 1175, 0.12, "square", 0.05); else noise(0.06, 0.15, 1200);
  return sc;
}
function houseDartsEnd() {
  const D = house.darts; if (!D || D.done) return;
  D.done = true; const h = houseData(), best = D.score > h.dartsBest;
  if (best) { h.dartsBest = D.score; saveProfile(); }
  D.msg = best ? `새 최고 기록 ${D.score}점!` : `${D.score}점 (최고 ${h.dartsBest}점)`;
  if (best) sfx.levelUp && sfx.levelUp(); else sfx.click();
}
function houseBlockStack() {
  const B = house.blocks, h = houseData();
  if (B.fall > 0) return false;
  B.n++;
  tone(440 + B.n * 60, 0.06, "square", 0.04);
  const fallP = B.n >= 3 ? Math.min(0.9, 0.06 * (B.n - 2)) : 0;
  if (Math.random() < fallP) {
    B.fallN = B.n; B.n = 0; B.fall = 1;
    noise(0.4, 0.2, 700, "lowpass");
    showMessage(`와르르! ${B.fallN}층에서 무너졌어요`, 2);
    return false;
  }
  if (B.n > h.blockBest) { h.blockBest = B.n; saveProfile(); if (B.n >= 5) showMessage(`최고 기록 ${B.n}층!`, 1.6, false, "#7dffb0"); }
  return true;
}
function houseBallReset() { const s = HOUSE_SPOTS.ball; house.ball = { x: s.x, y: s.y, vx: 0, vy: 0, z: 0, vz: 0, spin: 0 }; }
function houseKick() {
  const b = house.ball, p = game.player; if (!b || !p) return;
  let dx = b.x - p.x, dy = b.y - p.y, l = Math.hypot(dx, dy);
  if (l < 0.05) { dx = p.faceX || 1; dy = p.faceY || 0; l = Math.hypot(dx, dy) || 1; }
  b.vx = dx / l * 6; b.vy = dy / l * 6; b.vz = 2.2;
  noise(0.08, 0.2, 500, "lowpass");
}
function houseBallTick(dt) {
  const b = house.ball, r = HR.play; if (!b) return;
  // 주인공이 부딪히면 살짝 밀려요
  for (const q of allPlayers()) { if (!q) continue; const dx = b.x - q.x, dy = b.y - q.y, d = Math.hypot(dx, dy); if (d < 0.5 && d > 0.001) { b.vx += dx / d * 3 * dt * 10; b.vy += dy / d * 3 * dt * 10; } }
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > 9) { b.vx *= 9 / sp; b.vy *= 9 / sp; }
  b.x += b.vx * dt; b.y += b.vy * dt;
  const R = 0.22;
  if (b.x < r.x0 + R) { b.x = r.x0 + R; b.vx = Math.abs(b.vx) * 0.7; } if (b.x > r.x1 - R) { b.x = r.x1 - R; b.vx = -Math.abs(b.vx) * 0.7; }
  if (b.y < r.y0 + R) { b.y = r.y0 + R; b.vy = Math.abs(b.vy) * 0.7; } if (b.y > r.y1 - R) { b.y = r.y1 - R; b.vy = -Math.abs(b.vy) * 0.7; }
  for (const s of world.solids || []) { if (s.x < r.x0 || s.x > r.x1 || s.y < r.y0 || s.y > r.y1) continue; const dx = b.x - s.x, dy = b.y - s.y, d = Math.hypot(dx, dy), m = s.r + R; if (d < m && d > 0.001) { b.x = s.x + dx / d * m; b.y = s.y + dy / d * m; const dot = (b.vx * dx + b.vy * dy) / d; if (dot < 0) { b.vx -= 1.7 * dot * dx / d; b.vy -= 1.7 * dot * dy / d; } } }
  const k = Math.exp(-1.6 * dt); b.vx *= k; b.vy *= k;
  if (Math.abs(b.vx) < 0.02) b.vx = 0; if (Math.abs(b.vy) < 0.02) b.vy = 0;
  b.vz -= 12 * dt; b.z += b.vz * dt; if (b.z < 0) { b.z = 0; b.vz = Math.abs(b.vz) > 1 ? -b.vz * 0.4 : 0; }
  b.spin += Math.hypot(b.vx, b.vy) * dt * 3;
}

// ----- 매 프레임 (방장·친구 모두: netTick 은 늘 불려요) -----
hookOn("netTick", (dt) => {
  if (game.scene !== "lobby" || !game.profile || !game.profile.house) return;
  if (house.fish > 0) house.fish -= dt;
  if (house.hugT > 0) house.hugT -= dt;
  if (house.alarmT > 0) house.alarmT -= dt;
  if (house.owlT > 0) house.owlT -= dt;
  if (house.jarT > 0) house.jarT -= dt;
  if (house.bowlT > 0) house.bowlT -= dt;
  if (house.blocks.fall > 0) house.blocks.fall = Math.max(0, house.blocks.fall - dt * 1.2);
  if (house.darts && game.overlay !== "darts") house.darts = null;
  houseBallTick(Math.min(dt, 0.05));
  const S = house.sit;
  if (S) {
    const q = allPlayers().find((x) => (x.pid || 1) === S.pid && !x.remote);
    if (!q || Math.hypot(q.x - S.x, q.y - S.y) > 0.08) house.sit = null;
    else { S.t += dt; if (S.t > 1 && q.hp < q.maxHp) { q.hp = Math.min(q.maxHp, q.hp + dt * 0.5); } }
  }
}, 70);

// 소파에 앉은 모습: 엉덩이를 낮추고(웅크리기) 걷는 흔들림 없이 (변신 같은 다른 모습이 먼저예요: 순서 90)
function houseSitting(p) { const S = house.sit; return !!(S && p && !p.remote && (p.pid || 1) === S.pid && Math.hypot(p.x - S.x, p.y - S.y) <= 0.08); }
hookOn("drawPlayerAs", (p) => {
  if (game.scene !== "lobby" || !houseSitting(p) || p.rollTimer > 0) return false;
  const pose = playerPose(p);
  pose.walk = null; pose.crouch = 1; pose.lean = -0.12; pose.bob = -0.05;
  drawRig(p, playerLook(p), pose, { bodyYaw: pose.bodyYaw || 0 });
  return true;
}, 90);

// ===================== 창 =====================
// 글 한 장 (편지·일기): E·Esc·누르기로 닫아요
function houseNoteOpen(title, lines) { house.page = { title, lines }; game.overlay = "hnote"; }
const HOUSE_OVERLAYS = new Set(["house", "sleep", "piggy", "fridge", "darts", "hnote", "hscope"]);
hookOn("overlayUpdate", (name, dt) => {
  if (!HOUSE_OVERLAYS.has(name)) return false;
  dt = dt || 1 / 60;
  if (name === "sleep") {
    house.sleepT -= dt;
    if (house.sleepT <= 0) { house.sleepT = 0; game.overlay = null; showMessage(house.sleepMsg, 3, false, "#7dffb0"); }
    return true;
  }
  if (name === "darts") {
    const D = house.darts;
    if (!D) { closeOverlay(); return true; }
    if (wasPressed("Escape")) { if (!D.done) houseDartsEnd(); closeOverlay(); return true; }
    if (!D.done) {
      D.t -= dt; D.cd -= dt; D.aimT += dt * (1 + 0.06 * D.throws.length);
      if (wasPressed("KeyE", "Space", "Enter", "TouchUse")) houseDartsThrow();
      if (D.t <= 0) houseDartsEnd();
    } else if (wasPressed("Enter", "KeyE")) houseDartsStart();
    return true;
  }
  if (name === "hnote") { if (wasPressed("Escape", "KeyE", "Enter", "Space")) closeOverlay(); return true; }
  if (name === "hscope") { house.scopeT -= dt; if (house.scopeT <= 0 || (house.scopeT < 3.6 && wasPressed("Escape", "KeyE", "Enter", "Space", "TouchUse"))) closeOverlay(); return true; }
  if (wasPressed("Escape")) closeOverlay();
  return true;
}, 50);
hookOn("overlayDraw", (name) => {
  if (!HOUSE_OVERLAYS.has(name)) return false;
  const W = view.w, Hh = view.h;
  if (name === "sleep") {
    const t = house.sleepT, a = t > 1.6 ? (2.6 - t) : t > 0.8 ? 1 : t / 0.8;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a)) * 0.92; ctx.fillStyle = "#0a0f24"; ctx.fillRect(0, 0, W, Hh); ctx.restore();
    if (t > 0.6) text("Z z z", W / 2, Hh / 2 - 20 - (2.6 - t) * 12, 34, "#cfe0ff", "center");
    else { text("좋은 아침!", W / 2, Hh / 2 - 20, 30, "#ffe27a", "center"); text(house.sleepMsg, W / 2, Hh / 2 + 20, 18, "#7dffb0", "center"); }
    return true;
  }
  if (name === "house") return drawHouseCatalog();
  if (name === "hscope") { // 망원경: 동그란 밤하늘에 별자리
    const R = Math.min(W, Hh) * 0.36, cx = W / 2, cy = Hh / 2, S = HOUSE_STARS[house.scopeSeed || 0];
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, W, Hh);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = "#0b1238"; ctx.fill(); ctx.clip();
    const fr = (v) => v - Math.floor(v);
    for (let i = 0; i < 70; i++) { const a = fr(Math.sin(i * 12.9898) * 43758.5) * Math.PI * 2, d = R * 0.97 * Math.sqrt(fr(Math.sin(i * 78.233) * 12345.6)); if (Math.sin(game.time * 3 + i) > -0.6) { ctx.fillStyle = "#cfe0ff"; ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2, 2); } }
    const P = S.pts.map(([u, v]) => [cx - R + u * R * 2, cy - R + v * R * 2]);
    ctx.strokeStyle = "rgba(255,230,140,0.7)"; ctx.lineWidth = 2; ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.restore();
    for (const [x, y] of P) drawStar(x, y, 9, "#fff6c0");
    ctx.save(); ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const sn = S.name, seen = `${josa(sn, "이/가")} 보여요!`;
    text(seen, cx, cy + R + 34, 22, "#ffe27a", "center");
    addUI(0, 0, W, Hh, () => { if (house.scopeT < 3.6) closeOverlay(); });
    return true;
  }
  const panel = (pw, ph, title, color) => { pw = Math.min(pw, W - 20); ph = Math.min(ph, Hh - 20); const x0 = (W - pw) / 2, y0 = (Hh - ph) / 2; drawPanel(x0, y0, pw, ph); text(title, x0 + 22, y0 + 40, 22, color || "#ffe27a"); drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 }); return { x0, y0, pw, ph }; };
  if (name === "hnote") {
    const P = house.page || { title: "", lines: [] };
    const wrapped = []; for (const l of P.lines) for (const s of (typeof wrapText === "function" ? wrapText(l, 26) : [l])) wrapped.push(s);
    const { x0, y0, pw, ph } = panel(520, 120 + wrapped.length * 28, P.title, "#ffe27a");
    wrapped.forEach((l, i) => text(l, x0 + 26, y0 + 82 + i * 28, 17, "#f2e6c8"));
    addUI(x0, y0, pw, ph, closeOverlay);
    return true;
  }
  if (name === "piggy") {
    const h = houseData(), pr = game.profile;
    const { x0, y0, pw, ph } = panel(480, 300, "저금통", "#ff9ab8");
    text(`저금통: ${h.piggy}개 / ${PIGGY.cap}개`, x0 + 26, y0 + 86, 20, "#fff");
    text(`가진 에메랄드: ${pr.emeralds}개`, x0 + 26, y0 + 116, 16, "#7dffb0");
    text(`하루마다 10개당 1개씩 불어나요 (하루 최대 ${PIGGY.maxDay}개)`, x0 + 26, y0 + 144, 13, "#ccc");
    const bw = (pw - 52 - 20) / 3, by = y0 + 168;
    drawButton(x0 + 26, by, bw, 50, "10개 넣기", () => piggyDeposit(10), { size: 15 });
    drawButton(x0 + 36 + bw, by, bw, 50, "모두 넣기", () => piggyDeposit(pr.emeralds), { size: 15 });
    drawButton(x0 + 46 + bw * 2, by, bw, 50, "모두 꺼내기", piggyWithdraw, { size: 15, color: "rgba(80,200,120,0.35)" });
    if (house.note) text(house.note, x0 + 26, y0 + ph - 22, 15, house.noteC);
    return true;
  }
  if (name === "fridge") {
    const h = houseData();
    const { x0, y0, pw, ph } = panel(560, 130 + FOODS.length * 62, "냉장고", "#9fd8ff");
    text(`가방에는 한 종류 ${FOOD_MAX}개까지, 냉장고에는 ${FRIDGE_MAX}개까지`, x0 + 22, y0 + 70, 13, "#ccc");
    FOODS.forEach((f, i) => {
      const y = y0 + 86 + i * 62;
      drawButton(x0 + 22, y, pw - 44, 54, "", null, { color: "rgba(255,255,255,0.05)" });
      text(f.name, x0 + 36, y + 33, 18, f.color);
      text(`가방 ${houseFoodHave(f.id)} · 냉장고 ${fridgeCount(f.id)}`, x0 + 130, y + 33, 15, "#ddd");
      drawButton(x0 + pw - 236, y + 8, 100, 38, "넣기", () => { if (!houseFridgePut(f.id, 1)) { house.note = "넣을 게 없어요"; house.noteC = "#ff9090"; } else house.note = ""; }, { size: 14 });
      drawButton(x0 + pw - 128, y + 8, 100, 38, "꺼내기", () => { if (!houseFridgeTake(f.id, 1)) { house.note = "꺼낼 수 없어요 (냉장고가 비었거나 가방이 가득)"; house.noteC = "#ff9090"; } else house.note = ""; }, { size: 14 });
    });
    if (house.note) text(house.note, x0 + 22, y0 + ph - 18, 14, house.noteC);
    return true;
  }
  if (name === "darts") {
    const D = house.darts; if (!D) return true;
    const { x0, y0, pw, ph } = panel(520, 560, "다트 놀이", "#ffe27a");
    text(D.done ? D.msg : `남은 시간 ${Math.max(0, D.t).toFixed(1)}초 · ${D.score}점`, x0 + pw / 2, y0 + 76, 18, "#fff", "center");
    const R = Math.min(pw, ph - 160) * 0.42, cx = x0 + pw / 2, cy = y0 + 100 + R + 10;
    [["#2a2a2a", 1], ["#f0e0c0", 0.75], ["#d04040", 0.5], ["#f0e0c0", 0.3], ["#30a050", 0.12]].forEach(([c, k]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, Math.PI * 2); ctx.fill(); });
    for (const t of D.throws) { ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(cx + t.x * R, cy + t.y * R, 5, 0, Math.PI * 2); ctx.fill(); }
    if (!D.done) {
      const a = houseDartsAim(D), ax = cx + a.x * R, ay = cy + a.y * R;
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, 12, 0, Math.PI * 2); ctx.moveTo(ax - 18, ay); ctx.lineTo(ax + 18, ay); ctx.moveTo(ax, ay - 18); ctx.lineTo(ax, ay + 18); ctx.stroke();
      text("E · 스페이스 · 누르기: 던지기!", cx, y0 + ph - 22, 14, "#ccc", "center");
      addUI(x0 + 10, y0 + 90, pw - 20, ph - 120, houseDartsThrow);
    } else drawButton(cx - 80, y0 + ph - 60, 160, 44, "다시 하기", houseDartsStart, { size: 16 });
    return true;
  }
  return true;
}, 50);
function openHouseCatalog() { game.overlay = "house"; house.note = ""; sfx.equip(); }
function drawHouseCatalog() {
  const cols = view.w > 640 ? 2 : 1, rows = Math.ceil(HOUSE_FURN_ORDER.length / cols);
  const W = view.w, Hh = view.h, pw = Math.min(720, W - 20), ph = Math.min(82 + rows * 56 + 14 + 132 + 30, Hh - 20), x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  const pr = game.profile, h = pr.house;
  drawPanel(x0, y0, pw, ph);
  text("꾸미기 책", x0 + 22, y0 + 40, 24, "#ffb0c8");
  drawEmeraldIcon(x0 + pw - 150, y0 + 32, 9); text(`${pr.emeralds}`, x0 + pw - 136, y0 + 39, 18, "#7dffb0");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  text("가구 (에메랄드로 사서 집에 놓아요)", x0 + 22, y0 + 72, 14, "#ddd");
  const bw = (pw - 44 - (cols - 1) * 10) / cols, bh = 50;
  HOUSE_FURN_ORDER.forEach((id, i) => {
    const f = HOUSE_FURN[id], own = houseOwns(id), bx = x0 + 22 + (i % cols) * (bw + 10), by = y0 + 82 + Math.floor(i / cols) * (bh + 6);
    const can = !own && pr.emeralds >= f.price;
    drawButton(bx, by, bw, bh, "", own ? null : () => houseBuy(id), { color: own ? "rgba(80,200,120,0.18)" : can ? "rgba(232,106,138,0.32)" : "rgba(70,70,80,0.4)" });
    text(`${f.name} (${HOUSE_FIXED.find((r) => r.id === HOUSE_FURN_ROOM[id]).name})`, bx + 12, by + 21, 16, "#fff");
    text(f.desc, bx + 12, by + 40, 11, "#ccc");
    if (own) text("✓ 있어요", bx + bw - 12, by + 21, 14, "#7dffb0", "right");
    else { text(`${f.price}`, bx + bw - 12, by + 22, 16, can ? "#7dffb0" : "#ff9090", "right"); drawEmeraldIcon(bx + bw - 36 - String(f.price).length * 8, by + 16, 7); }
  });
  let y = y0 + 82 + rows * (bh + 6) + 14;
  const swatch = (list, cur, set, label) => {
    text(label, x0 + 22, y + 4, 14, "#ddd");
    const sw = Math.min(96, (pw - 44 - (list.length - 1) * 8) / list.length);
    list.forEach((c, i) => { const bx = x0 + 22 + i * (sw + 8); drawButton(bx, y + 12, sw, 40, c.name, () => { set(i); saveProfile(); if (sfx.click) sfx.click(); }, { size: 12, selected: cur === i, color: (c.c || c.a) + "aa" }); });
    y += 66;
  };
  swatch(HOUSE_WALLS, h.wall, (i) => { h.wall = i; }, "벽지 (거실·침실·놀이방, 공짜)");
  swatch(HOUSE_FLOORS, h.floor, (i) => { h.floor = i; }, "바닥 (거실·침실·놀이방, 공짜)");
  if (house.note) text(house.note, x0 + 22, y0 + ph - 18, 15, house.noteC);
  return true;
}
