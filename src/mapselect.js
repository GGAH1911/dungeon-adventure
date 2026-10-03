// ===== 모험 지도: 진짜 세계 지도에서 맵 고르기 =====
// 한 손가락으로 끌면 지도가 움직이고, 두 손가락으로 벌리면 커져요 (마우스는 휠).
// 두 번 톡톡 누르면 확대. 장소를 누르면 오른쪽에 정보가 나오고, 레벨을 고른 다음 "출발!"
// 키보드: 방향키로 장소 옮기기, -/+ 레벨, 엔터 출발, ESC 닫기

const WORLD_W = 2400, WORLD_H = 1600;

// 지도 위 장소 자리 (지도 좌표). 새 맵을 만들면 여기에 자리를 추가하세요.
// 표에 없는 맵은 아래 SPARE_PLACES 의 빈 자리에 저절로 놓여요.
const WORLD_PLACES = {
  cave: { x: 480, y: 1040 },
  tower: { x: 330, y: 700 },
  crypt: { x: 760, y: 1230 },
  jungle: { x: 1060, y: 1360 },
  desert: { x: 1390, y: 1230 },
  ice: { x: 1020, y: 470 },
  swamp: { x: 1330, y: 800 },
  volcano: { x: 1700, y: 520 },
  castle: { x: 1830, y: 880 },
  mine: { x: 2000, y: 640 },
  sky: { x: 2200, y: 300 },
  coral: { x: 2180, y: 1160 },
  void: { x: 1900, y: 1430 },
};
const SPARE_PLACES = [
  { x: 640, y: 420 }, { x: 600, y: 1420 }, { x: 1540, y: 1000 }, { x: 260, y: 1250 },
  { x: 1500, y: 300 }, { x: 820, y: 900 }, { x: 1240, y: 1500 }, { x: 2250, y: 850 },
];

const mapSel = {
  index: 0, level: 1,
  cam: { x: 1200, y: 800, z: 0.6 },
  goal: null,          // 카메라가 부드럽게 갈 곳 { x, y, z }
  vel: { x: 0, y: 0 }, // 끌고 놓았을 때 미끄러지는 속도 (지도 좌표/초)
  pointers: new Map(),
  drag: null, pinch: null,
  lastTap: null,
  hits: [],            // 이번 화면에서 장소의 화면 위치
  area: { x: 0, y: 0, w: 800, h: 600 },
  lastT: 0,
  terrain: null,
  note: "", noteTimer: 0,
};

// ----- 장소 자리 -----
function placeOf(m) {
  if (WORLD_PLACES[m.id]) return WORLD_PLACES[m.id];
  if (!mapSel.autoPlaces) mapSel.autoPlaces = {};
  if (!mapSel.autoPlaces[m.id]) {
    const used = Object.values(WORLD_PLACES).concat(Object.values(mapSel.autoPlaces));
    const free = SPARE_PLACES.find((s) => !used.some((u) => Math.hypot(u.x - s.x, u.y - s.y) < 60));
    mapSel.autoPlaces[m.id] = free || { x: 200 + ((Object.keys(mapSel.autoPlaces).length * 173) % 2000), y: 220 };
  }
  return mapSel.autoPlaces[m.id];
}

// ----- 선택, 레벨 -----
function selectMap(i) {
  mapSel.index = i;
  const r = levelRange(MAPS[i]);
  mapSel.level = Math.max(r.min, Math.min(r.max, game.profile.level)); // 처음엔 내 레벨
}

function changeLevel(delta) {
  const r = levelRange(MAPS[mapSel.index]);
  mapSel.level = Math.max(r.min, Math.min(r.max, mapSel.level + delta));
}

function focusPlace(i, zoom) {
  const p = placeOf(MAPS[i]);
  mapSel.goal = { x: p.x, y: p.y, z: zoom || Math.max(mapSel.cam.z, 0.8) };
  mapSel.vel.x = mapSel.vel.y = 0;
}

function openMapSelect() {
  game.overlay = "maps";
  // 가장 최근에 열린 맵(탑 말고)을 골라서 가운데로
  let last = 0;
  for (let i = 0; i < MAPS.length; i++) if (mapUnlocked(i) && MAPS[i].type !== "tower") last = i;
  selectMap(last);
  layoutMapArea();
  const p = placeOf(MAPS[last]);
  mapSel.cam.z = Math.max(mapZoomLimits().min, Math.min(0.65, mapSel.area.w / 1100, mapSel.area.h / 700)); // 작은 화면은 더 넓게 보여요
  mapSel.cam.x = p.x; mapSel.cam.y = p.y;
  clampMapCam();
  mapSel.goal = null;
  mapSel.vel.x = mapSel.vel.y = 0;
  mapSel.pointers.clear(); mapSel.drag = null; mapSel.pinch = null;
  mapSel.lastT = performance.now();
  sfx.equip();
}

function tryStartMap(i) {
  if (!mapUnlocked(i)) {
    sfx.denied();
    const prev = unlockSource(i).name;
    mapSel.note = `${prev}${josa(prev, "을", "를")} 먼저 깨야 열려요`;
    mapSel.noteTimer = 2;
    showMessage(mapSel.note, 1.8);
    return;
  }
  closeOverlay();
  if (MAPS[i].type === "tower") startTower(mapSel.level);
  else startDungeon(MAPS[i], mapSel.level);
}

// ----- 화면 배치 -----
// 정보 창은 작은 화면에서 줄여서(오른쪽), 지도는 나머지 전체
const PANEL_MIN_W = 1040, PANEL_MIN_H = 480;
function panelScale() { return Math.min(1, view.w / PANEL_MIN_W, view.h / PANEL_MIN_H); }
function panelVirtualW() { const k = panelScale(); return Math.min(400, (view.w / k) * 0.38); }

function layoutMapArea() {
  const k = panelScale();
  const pwReal = (panelVirtualW() + 24) * k;
  mapSel.area = { x: 0, y: 0, w: Math.max(200, view.w - pwReal), h: view.h };
}

function mapZoomLimits() {
  const a = mapSel.area;
  const fit = Math.min(a.w / WORLD_W, a.h / WORLD_H);
  return { min: Math.max(0.15, fit * 0.95), max: 1.8 };
}

// 지도 좌표 <-> 화면 좌표
function worldToScreen(x, y) {
  const a = mapSel.area, c = mapSel.cam;
  return { x: (x - c.x) * c.z + a.x + a.w / 2, y: (y - c.y) * c.z + a.y + a.h / 2 };
}
function screenToWorld(x, y) {
  const a = mapSel.area, c = mapSel.cam;
  return { x: (x - a.x - a.w / 2) / c.z + c.x, y: (y - a.y - a.h / 2) / c.z + c.y };
}

function clampMapCam() {
  const a = mapSel.area, c = mapSel.cam;
  const lim = mapZoomLimits();
  c.z = Math.max(lim.min, Math.min(lim.max, c.z));
  const hw = a.w / 2 / c.z, hh = a.h / 2 / c.z;
  const m = 30; // 가장자리 조금은 더 볼 수 있게
  c.x = hw * 2 >= WORLD_W + m * 2 ? WORLD_W / 2 : Math.max(hw - m, Math.min(WORLD_W - hw + m, c.x));
  c.y = hh * 2 >= WORLD_H + m * 2 ? WORLD_H / 2 : Math.max(hh - m, Math.min(WORLD_H - hh + m, c.y));
}

// (sx, sy) 화면 자리를 고정한 채로 확대/축소
function zoomAt(sx, sy, factor) {
  const before = screenToWorld(sx, sy);
  const lim = mapZoomLimits();
  mapSel.cam.z = Math.max(lim.min, Math.min(lim.max, mapSel.cam.z * factor));
  const after = screenToWorld(sx, sy);
  mapSel.cam.x += before.x - after.x;
  mapSel.cam.y += before.y - after.y;
  clampMapCam();
}

function inMapArea(x, y) {
  const a = mapSel.area;
  return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
}

// ----- 손가락 / 마우스 -----
function placeAtScreen(x, y) {
  let best = -1, bestD = 44;
  for (const h of mapSel.hits) {
    const d = Math.hypot(h.x - x, h.y - y);
    if (d < bestD) { bestD = d; best = h.i; }
  }
  return best;
}

function mapPointerDown(e) {
  if (game.overlay !== "maps") return;
  const x = e.clientX, y = e.clientY;
  if (hitUI(x, y)) return;          // 버튼은 원래 방식대로
  if (!inMapArea(x, y)) return;      // 정보 창 위는 무시
  mapSel.pointers.set(e.pointerId, { x, y });
  mapSel.goal = null;
  mapSel.vel.x = mapSel.vel.y = 0;
  if (mapSel.pointers.size === 1) {
    mapSel.drag = { id: e.pointerId, sx: x, sy: y, lx: x, ly: y, lt: performance.now(), moved: false, t0: performance.now() };
    mapSel.pinch = null;
  } else if (mapSel.pointers.size === 2) {
    const [p1, p2] = [...mapSel.pointers.values()];
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    mapSel.pinch = { d0: Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1, z0: mapSel.cam.z, world: screenToWorld(mx, my) };
    if (mapSel.drag) mapSel.drag.moved = true; // 두 손가락이면 탭이 아니에요
  }
}

function mapPointerMove(e) {
  if (game.overlay !== "maps" || !mapSel.pointers.has(e.pointerId)) return;
  const x = e.clientX, y = e.clientY;
  mapSel.pointers.set(e.pointerId, { x, y });
  if (mapSel.pinch && mapSel.pointers.size >= 2) {
    const [p1, p2] = [...mapSel.pointers.values()];
    const d = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1;
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const lim = mapZoomLimits();
    const c = mapSel.cam, a = mapSel.area;
    c.z = Math.max(lim.min, Math.min(lim.max, mapSel.pinch.z0 * (d / mapSel.pinch.d0)));
    // 두 손가락 가운데 아래 지도 자리가 그대로 있게
    c.x = mapSel.pinch.world.x - (mx - a.x - a.w / 2) / c.z;
    c.y = mapSel.pinch.world.y - (my - a.y - a.h / 2) / c.z;
    clampMapCam();
    return;
  }
  const dr = mapSel.drag;
  if (!dr || dr.id !== e.pointerId) return;
  if (!dr.moved && Math.hypot(x - dr.sx, y - dr.sy) > 9) dr.moved = true; // 조금 움직이면 끌기
  if (!dr.moved) return;
  const dx = x - dr.lx, dy = y - dr.ly;
  mapSel.cam.x -= dx / mapSel.cam.z;
  mapSel.cam.y -= dy / mapSel.cam.z;
  clampMapCam();
  const now = performance.now();
  const dt = Math.max(1, now - dr.lt) / 1000;
  // 놓았을 때 미끄러질 속도 (부드럽게 평균)
  mapSel.vel.x = mapSel.vel.x * 0.6 + (-dx / mapSel.cam.z / dt) * 0.4;
  mapSel.vel.y = mapSel.vel.y * 0.6 + (-dy / mapSel.cam.z / dt) * 0.4;
  dr.lx = x; dr.ly = y; dr.lt = now;
}

function mapPointerUp(e) {
  if (!mapSel.pointers.has(e.pointerId)) return;
  mapSel.pointers.delete(e.pointerId);
  const dr = mapSel.drag;
  if (mapSel.pinch) {
    if (mapSel.pointers.size < 2) mapSel.pinch = null;
    if (mapSel.pointers.size === 0) { mapSel.drag = null; mapSel.vel.x = mapSel.vel.y = 0; }
    else {
      // 남은 손가락으로 계속 끌 수 있게
      const [id, p] = [...mapSel.pointers.entries()][0];
      mapSel.drag = { id, sx: p.x, sy: p.y, lx: p.x, ly: p.y, lt: performance.now(), moved: true, t0: 0 };
    }
    return;
  }
  if (!dr || dr.id !== e.pointerId) return;
  mapSel.drag = null;
  if (game.overlay !== "maps") return;
  if (dr.moved) {
    // 천천히 놓았으면 안 미끄러져요
    if (performance.now() - dr.lt > 90) mapSel.vel.x = mapSel.vel.y = 0;
    return;
  }
  mapSel.vel.x = mapSel.vel.y = 0;
  if (e.type !== "pointerup") return;
  mapTap(e.clientX, e.clientY);
}

function mapTap(x, y) {
  const now = performance.now();
  const i = placeAtScreen(x, y);
  const lt = mapSel.lastTap;
  const dbl = lt && now - lt.t < 330 && Math.hypot(lt.x - x, lt.y - y) < 36;
  mapSel.lastTap = dbl ? null : { t: now, x, y };
  if (i >= 0) {
    if (mapSel.index !== i) { selectMap(i); sfx.click(); }
    if (dbl) focusPlace(i, Math.min(mapZoomLimits().max, mapSel.cam.z * 1.7));
    return;
  }
  if (dbl) {
    const w = screenToWorld(x, y);
    const z = Math.min(mapZoomLimits().max, mapSel.cam.z * 1.7);
    // 누른 자리가 화면에서 그대로 있게 목표 카메라 계산
    const a = mapSel.area;
    mapSel.goal = { x: w.x - (x - a.x - a.w / 2) / z, y: w.y - (y - a.y - a.h / 2) / z, z };
  }
}

function mapWheel(e) {
  if (game.overlay !== "maps") return;
  e.preventDefault();
  if (!inMapArea(e.clientX, e.clientY)) return;
  mapSel.goal = null;
  zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
}

canvas.addEventListener("pointerdown", mapPointerDown);
canvas.addEventListener("pointermove", mapPointerMove);
canvas.addEventListener("pointerup", mapPointerUp);
canvas.addEventListener("pointercancel", mapPointerUp);
canvas.addEventListener("wheel", mapWheel, { passive: false });

// ----- 매 프레임 -----
function updateMapSelect() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - (mapSel.lastT || now)) / 1000);
  mapSel.lastT = now;
  mapSel.noteTimer -= dt;
  layoutMapArea();
  const c = mapSel.cam;

  // 미끄러짐
  if (!mapSel.drag && (Math.abs(mapSel.vel.x) > 5 || Math.abs(mapSel.vel.y) > 5)) {
    c.x += mapSel.vel.x * dt; c.y += mapSel.vel.y * dt;
    const k = Math.exp(-dt * 5);
    mapSel.vel.x *= k; mapSel.vel.y *= k;
    clampMapCam();
  }
  // 부드럽게 목표로
  if (mapSel.goal) {
    const g = mapSel.goal, t = 1 - Math.exp(-dt * 8);
    c.x += (g.x - c.x) * t; c.y += (g.y - c.y) * t; c.z += (g.z - c.z) * t;
    clampMapCam();
    if (Math.abs(g.x - c.x) < 0.5 && Math.abs(g.y - c.y) < 0.5 && Math.abs(g.z - c.z) < 0.002) mapSel.goal = null;
  }

  // 키보드
  const dirs = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] };
  for (const code in dirs) {
    if (!wasPressed(code)) continue;
    const [dx, dy] = dirs[code];
    const from = placeOf(MAPS[mapSel.index]);
    let best = -1, bestScore = Infinity;
    MAPS.forEach((m, i) => {
      if (i === mapSel.index) return;
      const p = placeOf(m), vx = p.x - from.x, vy = p.y - from.y;
      const along = vx * dx + vy * dy;
      if (along <= 0) return;
      const side = Math.abs(vx * dy - vy * dx);
      const score = along + side * 2;
      if (score < bestScore) { bestScore = score; best = i; }
    });
    if (best >= 0) { selectMap(best); focusPlace(best); sfx.click(); }
  }
  if (wasPressed("Minus", "BracketLeft", "NumpadSubtract")) changeLevel(-1);
  if (wasPressed("Equal", "BracketRight", "NumpadAdd")) changeLevel(1);
  if (wasPressed("Enter", "Space")) tryStartMap(mapSel.index);
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

// ===== 지도 그림 (한 번만 그려서 저장해 둬요) =====
function noisyBlob(g, cx, cy, r, rand, bump = 0.25, n = 48) {
  const pts = [];
  const ph = [rand() * 6, rand() * 6, rand() * 6];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + bump * (0.5 * Math.sin(a * 3 + ph[0]) + 0.3 * Math.sin(a * 7 + ph[1]) + 0.2 * Math.sin(a * 13 + ph[2])) + (rand() - 0.5) * bump * 0.3;
    pts.push([cx + Math.cos(a) * r.x * k, cy + Math.sin(a) * r.y * k]);
  }
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
}

function buildTerrain() {
  const c = document.createElement("canvas");
  c.width = WORLD_W; c.height = WORLD_H;
  const g = c.getContext("2d");
  const rand = makeRandom(20261003);

  // 바다 (양피지 바다색)
  g.fillStyle = "#b9cfc4";
  g.fillRect(0, 0, WORLD_W, WORLD_H);
  g.strokeStyle = "rgba(70,110,110,0.25)"; g.lineWidth = 3;
  for (let i = 0; i < 160; i++) {
    const x = rand() * WORLD_W, y = rand() * WORLD_H;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 12, y - 8, x + 24, y); g.quadraticCurveTo(x + 36, y + 8, x + 48, y); g.stroke();
  }

  // 대륙 모양
  const land = new Path2D();
  const addBlob = (cx, cy, rx, ry, bump) => {
    const pts = [];
    const n = 48, ph = [rand() * 6, rand() * 6, rand() * 6];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + bump * (0.5 * Math.sin(a * 3 + ph[0]) + 0.3 * Math.sin(a * 7 + ph[1]) + 0.2 * Math.sin(a * 13 + ph[2]));
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    land.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) land.lineTo(x, y);
    land.closePath();
  };
  addBlob(1150, 860, 920, 620, 0.12);   // 큰 대륙
  addBlob(520, 1080, 400, 380, 0.15);   // 서쪽
  addBlob(1500, 1250, 520, 300, 0.15);  // 남쪽
  addBlob(1000, 460, 520, 280, 0.15);   // 북쪽 눈 땅
  addBlob(1800, 650, 360, 360, 0.15);   // 북동쪽 산
  addBlob(1880, 1380, 260, 170, 0.2);   // 남동쪽 끝 (공허)
  addBlob(2170, 1180, 120, 90, 0.3);    // 산호 섬
  addBlob(2290, 1060, 60, 45, 0.3);
  addBlob(2070, 1290, 55, 40, 0.3);
  addBlob(330, 690, 180, 150, 0.2);     // 탑 반도

  // 해안 얕은 물 테두리
  g.save();
  g.strokeStyle = "rgba(220,235,225,0.9)"; g.lineWidth = 26; g.stroke(land);
  g.strokeStyle = "rgba(120,150,140,0.5)"; g.lineWidth = 10; g.stroke(land);
  g.fillStyle = "#e3d2a2"; g.fill(land);
  g.restore();

  // 땅 위 지형 (땅 밖으로 안 나가게)
  g.save();
  g.clip(land);
  const region = (cx, cy, rx, ry, color, bump = 0.3) => { noisyBlob(g, cx, cy, { x: rx, y: ry }, rand, bump); g.fillStyle = color; g.fill(); };
  region(470, 1000, 330, 260, "#bcd39a");  // 숲
  region(330, 690, 170, 140, "#c9d2a8");
  region(760, 1230, 170, 130, "#b8b3a6");  // 무덤 (회색)
  region(1060, 1370, 230, 160, "#8fbf72"); // 정글
  region(1420, 1230, 300, 190, "#ecd28c"); // 사막
  region(1000, 450, 470, 220, "#f4f7f8");  // 눈
  region(1330, 800, 200, 140, "#b9a8c6");  // 버섯 늪
  region(1700, 520, 220, 180, "#b88a7a");  // 화산 땅
  region(1830, 880, 180, 130, "#9f98a8");  // 어둠의 성
  region(2000, 640, 170, 160, "#c2b29c");  // 광산 산악
  region(1900, 1420, 220, 140, "#b49acb"); // 공허
  region(2170, 1180, 120, 90, "#f2d6c8");  // 산호 섬

  // 땅 얼룩
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(120,90,50,${0.03 + rand() * 0.05})`;
    g.beginPath(); g.arc(rand() * WORLD_W, rand() * WORLD_H, 3 + rand() * 14, 0, Math.PI * 2); g.fill();
  }

  // 나무 (숲, 정글)
  const tree = (x, y, s, col) => {
    g.fillStyle = "#6b4a2a"; g.fillRect(x - 2 * s, y, 4 * s, 8 * s);
    g.fillStyle = col; g.beginPath(); g.moveTo(x, y - 16 * s); g.lineTo(x + 9 * s, y + 2 * s); g.lineTo(x - 9 * s, y + 2 * s); g.closePath(); g.fill();
    g.strokeStyle = "rgba(40,50,20,0.5)"; g.lineWidth = 1.5; g.stroke();
  };
  for (let i = 0; i < 90; i++) { const a = rand() * Math.PI * 2, r = rand(); tree(470 + Math.cos(a) * 300 * r, 1000 + Math.sin(a) * 230 * r, 1, "#4f8a3a"); }
  for (let i = 0; i < 70; i++) { const a = rand() * Math.PI * 2, r = rand(); tree(1060 + Math.cos(a) * 210 * r, 1370 + Math.sin(a) * 140 * r, 1.2, "#2f7a3a"); }

  // 산 (북쪽 산맥, 광산 산악)
  const mountain = (x, y, s, snow) => {
    g.fillStyle = "#9c8a72"; g.beginPath(); g.moveTo(x - 26 * s, y); g.lineTo(x, y - 34 * s); g.lineTo(x + 26 * s, y); g.closePath(); g.fill();
    g.fillStyle = "#7c6c58"; g.beginPath(); g.moveTo(x, y - 34 * s); g.lineTo(x + 26 * s, y); g.lineTo(x + 6 * s, y); g.closePath(); g.fill();
    if (snow) { g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(x - 9 * s, y - 22 * s); g.lineTo(x, y - 34 * s); g.lineTo(x + 9 * s, y - 22 * s); g.closePath(); g.fill(); }
    g.strokeStyle = "rgba(60,45,30,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 26 * s, y); g.lineTo(x, y - 34 * s); g.lineTo(x + 26 * s, y); g.stroke();
  };
  for (let i = 0; i < 26; i++) mountain(640 + i * 30 + rand() * 20, 560 + Math.sin(i * 0.7) * 40 + rand() * 30, 1 + rand() * 0.5, true);
  for (let i = 0; i < 24; i++) { const a = rand() * Math.PI * 2, r = 40 + rand() * 120; mountain(2000 + Math.cos(a) * r, 650 + Math.sin(a) * r, 0.9 + rand() * 0.6, rand() < 0.4); }
  for (let i = 0; i < 12; i++) mountain(1500 + i * 28, 420 + rand() * 40, 1.2, true);

  // 눈송이 점
  g.fillStyle = "rgba(160,200,230,0.7)";
  for (let i = 0; i < 120; i++) { const a = rand() * Math.PI * 2, r = rand(); g.fillRect(1000 + Math.cos(a) * 440 * r, 450 + Math.sin(a) * 200 * r, 3, 3); }
  // 사막 모래 언덕
  g.strokeStyle = "rgba(170,120,50,0.5)"; g.lineWidth = 2.5;
  for (let i = 0; i < 40; i++) { const x = 1420 + (rand() - 0.5) * 520, y = 1230 + (rand() - 0.5) * 300; g.beginPath(); g.arc(x, y + 16, 20, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  // 늪 버섯과 물웅덩이
  for (let i = 0; i < 30; i++) {
    const x = 1330 + (rand() - 0.5) * 340, y = 800 + (rand() - 0.5) * 220;
    g.fillStyle = "rgba(90,110,130,0.5)"; g.beginPath(); g.ellipse(x, y, 16, 7, 0, 0, Math.PI * 2); g.fill();
    if (i % 2) { g.fillStyle = "#f0e6d0"; g.fillRect(x + 10, y - 10, 3, 10); g.fillStyle = "#9a4ab0"; g.beginPath(); g.arc(x + 11.5, y - 10, 7, Math.PI, 0); g.fill(); }
  }
  // 화산 용암 줄기
  g.strokeStyle = "rgba(230,90,30,0.75)"; g.lineWidth = 5; g.lineCap = "round";
  for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(1700, 500); let x = 1700, y = 500; for (let k = 0; k < 6; k++) { x += (rand() - 0.5) * 50; y += 18 + rand() * 12; g.lineTo(x, y); } g.stroke(); }
  // 무덤 비석
  for (let i = 0; i < 26; i++) { const x = 760 + (rand() - 0.5) * 280, y = 1230 + (rand() - 0.5) * 200; g.fillStyle = "#8a8680"; g.fillRect(x - 5, y - 12, 10, 12); g.beginPath(); g.arc(x, y - 12, 5, Math.PI, 0); g.fill(); }
  // 공허 균열
  g.save();
  const vg = g.createRadialGradient(1900, 1430, 10, 1900, 1430, 230);
  vg.addColorStop(0, "rgba(120,40,200,0.65)"); vg.addColorStop(1, "rgba(120,40,200,0)");
  g.fillStyle = vg; g.fillRect(1650, 1250, 500, 350);
  g.strokeStyle = "#2a0d40"; g.lineWidth = 5;
  for (let i = 0; i < 6; i++) { g.beginPath(); let x = 1900, y = 1430; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += Math.cos(i + rand()) * 30; y += Math.sin(i * 1.7 + rand()) * 22; g.lineTo(x, y); } g.stroke(); }
  g.restore();
  g.restore(); // 땅 클립 끝

  // 산호 바다 (섬 주변 분홍 산호)
  for (let i = 0; i < 60; i++) {
    const a = rand() * Math.PI * 2, r = 120 + rand() * 120;
    const x = 2170 + Math.cos(a) * r, y = 1180 + Math.sin(a) * r * 0.7;
    g.strokeStyle = ["#ff8aa0", "#ff6f7f", "#ffb07a"][i % 3]; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 10); g.moveTo(x, y - 6); g.lineTo(x - 5, y - 12); g.moveTo(x, y - 6); g.lineTo(x + 5, y - 13); g.stroke();
  }

  // 구름 섬 (하늘에 떠 있는 섬)
  const cloud = (x, y, s) => {
    g.fillStyle = "rgba(255,255,255,0.92)";
    for (const [ox, oy, r] of [[0, 0, 26], [24, -8, 22], [48, 0, 24], [-22, 4, 18], [70, 6, 16]]) { g.beginPath(); g.arc(x + ox * s, y + oy * s, r * s, 0, Math.PI * 2); g.fill(); }
  };
  for (const [x, y, s] of [[2160, 300, 1.4], [2050, 200, 0.9], [2290, 420, 0.8]]) {
    g.fillStyle = "rgba(0,0,0,0.12)"; g.beginPath(); g.ellipse(x + 20, y + 110 * s, 80 * s, 18 * s, 0, 0, Math.PI * 2); g.fill(); // 아래 그림자
    cloud(x - 40 * s, y + 40 * s, s);
    g.fillStyle = "#7fb85a"; g.beginPath(); g.ellipse(x, y, 70 * s, 24 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#8a6a42"; g.beginPath(); g.moveTo(x - 70 * s, y); g.lineTo(x + 70 * s, y); g.lineTo(x + 10 * s, y + 60 * s); g.lineTo(x - 15 * s, y + 55 * s); g.closePath(); g.fill();
    g.fillStyle = "#7fb85a"; g.beginPath(); g.ellipse(x, y - 2, 70 * s, 22 * s, 0, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 8; i++) cloud(1800 + rand() * 550, 120 + rand() * 260, 0.6 + rand() * 0.5);

  // 나침반
  const cx = 2200, cy = 1470;
  g.save(); g.translate(cx, cy);
  g.fillStyle = "rgba(240,225,180,0.85)"; g.beginPath(); g.arc(0, 0, 70, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#6b4a2a"; g.lineWidth = 3; g.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, L = i % 2 ? 36 : 62;
    g.fillStyle = i === 0 ? "#b0392b" : i % 2 ? "#a08a62" : "#6b4a2a";
    g.beginPath(); g.moveTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a + 0.35) * 12, Math.sin(a + 0.35) * 12); g.lineTo(Math.cos(a - 0.35) * 12, Math.sin(a - 0.35) * 12); g.closePath(); g.fill();
  }
  g.fillStyle = "#3a2a1a"; g.font = "bold 26px sans-serif"; g.textAlign = "center"; g.fillText("N", 0, -74);
  g.restore();

  // 양피지 가장자리 어둡게 + 테두리
  const vig = g.createRadialGradient(WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.45, WORLD_W / 2, WORLD_H / 2, WORLD_W * 0.62);
  vig.addColorStop(0, "rgba(90,60,20,0)"); vig.addColorStop(1, "rgba(90,60,20,0.45)");
  g.fillStyle = vig; g.fillRect(0, 0, WORLD_W, WORLD_H);
  g.strokeStyle = "#6b4a2a"; g.lineWidth = 14; g.strokeRect(14, 14, WORLD_W - 28, WORLD_H - 28);
  g.strokeStyle = "#a07a48"; g.lineWidth = 4; g.strokeRect(36, 36, WORLD_W - 72, WORLD_H - 72);
  g.fillStyle = "#5a3a1a"; g.font = "bold 54px serif"; g.textAlign = "left"; g.fillText("모험의 땅", 70, 110);
  return c;
}

// ===== 장소 아이콘 =====
function greyish(col, locked) {
  if (!locked) return col;
  const n = parseInt(col.slice(1), 16);
  const v = Math.round(((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11);
  const w = Math.round(v * 0.8 + 30);
  return `rgb(${w},${w},${w})`;
}

function drawPlaceIcon(m, x, y, s, locked) {
  const g = ctx, C = (c) => greyish(c, locked);
  const poly = (pts, col) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(x + px * s, y + py * s) : g.moveTo(x + px * s, y + py * s))); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(30,20,10,0.7)"; g.lineWidth = 1.5; g.stroke(); };
  const rect = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(x + rx * s, y + ry * s, w * s, h * s); g.strokeStyle = "rgba(30,20,10,0.7)"; g.lineWidth = 1.5; g.strokeRect(x + rx * s, y + ry * s, w * s, h * s); };
  const circ = (cx, cy, r, col) => { g.beginPath(); g.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2); g.fillStyle = col; g.fill(); };
  // 바닥 그림자
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(x, y + 4 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
  switch (m.id) {
    case "cave":
      poly([[-26, 4], [-14, -22], [10, -26], [26, 4]], C("#8c7c66"));
      g.beginPath(); g.ellipse(x, y - 2 * s, 9 * s, 13 * s, 0, Math.PI, 0); g.lineTo(x + 9 * s, y + 4 * s); g.lineTo(x - 9 * s, y + 4 * s); g.closePath(); g.fillStyle = "#1a1410"; g.fill();
      circ(-16, -4, 4, C("#5f8a3a")); circ(18, -8, 5, C("#5f8a3a"));
      break;
    case "tower":
      rect(-9, -46, 18, 50, C("#a39684")); poly([[-13, -46], [0, -62], [13, -46]], C("#7a4a3a"));
      rect(-3, -36, 6, 8, "#2a2018"); rect(-3, -18, 6, 8, "#2a2018");
      g.strokeStyle = "#3a2a1a"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 62 * s); g.lineTo(x, y - 74 * s); g.stroke();
      poly([[0, -74], [12, -70], [0, -66]], C("#d23c3c"));
      break;
    case "crypt":
      rect(-20, -18, 40, 22, C("#9a948a")); poly([[-24, -18], [0, -32], [24, -18]], C("#7a746c"));
      rect(-5, -12, 10, 16, "#2a2622"); rect(-30, -10, 7, 14, C("#8a8680")); rect(23, -10, 7, 14, C("#8a8680"));
      break;
    case "jungle":
      for (const [ox, h, col] of [[-12, 34, "#2f7a3a"], [10, 40, "#3f8a3a"], [0, 28, "#4f9a46"]]) {
        rect(ox - 2, -h + 8, 4, h - 4, C("#6b4a2a"));
        for (const a of [-2.4, -1.6, -0.8, -0.2]) poly([[ox, -h + 8], [ox + Math.cos(a) * 18, -h + 8 + Math.sin(a) * 10 + 8], [ox + Math.cos(a) * 10, -h + 14]], C(col));
      }
      break;
    case "desert":
      poly([[-28, 4], [0, -34], [28, 4]], C("#e0b860")); poly([[0, -34], [28, 4], [8, 4]], C("#c49a48"));
      g.strokeStyle = "rgba(120,80,30,0.6)"; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - 28 * s * i / 4, y + 4 * s - 38 * s * (1 - i / 4) + 4 * s); g.lineTo(x + 28 * s * i / 4, y + 4 * s - 38 * s * (1 - i / 4) + 4 * s); g.stroke(); }
      break;
    case "ice":
      rect(-20, -20, 40, 24, C("#cfe8f5")); rect(-24, -34, 10, 38, C("#e4f4fb")); rect(14, -34, 10, 38, C("#e4f4fb"));
      poly([[-26, -34], [-19, -46], [-12, -34]], C("#7fb6e0")); poly([[12, -34], [19, -46], [26, -34]], C("#7fb6e0")); rect(-5, -8, 10, 12, "#3a5a7a");
      break;
    case "swamp":
      for (const [ox, h, r, col] of [[-12, 18, 12, "#9a4ab0"], [10, 26, 15, "#b05ac0"], [0, 10, 8, "#d06ad0"]]) {
        rect(ox - 2.5, -h, 5, h + 2, C("#f0e6d0"));
        g.beginPath(); g.arc(x + ox * s, y - h * s, r * s, Math.PI, 0); g.closePath(); g.fillStyle = C(col); g.fill(); g.stroke();
        circ(ox - r * 0.4, -h - r * 0.4, 2.2, "#ffffff");
      }
      break;
    case "volcano":
      poly([[-30, 4], [-8, -32], [8, -32], [30, 4]], C("#6a4a40"));
      poly([[-8, -32], [0, -26], [8, -32]], locked ? "#888" : "#ff7a1a");
      if (!locked) { g.strokeStyle = "#ff5a1a"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x - 2 * s, y - 28 * s); g.lineTo(x - 8 * s, y - 8 * s); g.stroke(); circ(4, -42, 6, "rgba(90,90,90,0.6)"); circ(10, -50, 8, "rgba(110,110,110,0.45)"); }
      rect(14, -12, 12, 16, C("#4b403e"));
      break;
    case "castle":
      rect(-22, -22, 44, 26, C("#4a4552")); for (const ox of [-22, -6, 10]) rect(ox, -28, 8, 6, C("#4a4552"));
      rect(-30, -38, 12, 42, C("#3e3a46")); rect(18, -38, 12, 42, C("#3e3a46"));
      poly([[-32, -38], [-24, -52], [-16, -38]], C("#5a2030")); poly([[16, -38], [24, -52], [32, -38]], C("#5a2030"));
      rect(-5, -10, 10, 14, "#120a10"); if (!locked) { circ(-24, -28, 2, "#ffd84a"); circ(24, -28, 2, "#ffd84a"); }
      break;
    case "mine":
      poly([[-30, 4], [-6, -30], [22, -24], [30, 4]], C("#8c7c66"));
      rect(-12, -18, 4, 22, C("#7a5230")); rect(8, -18, 4, 22, C("#7a5230")); rect(-14, -20, 28, 5, C("#7a5230"));
      rect(-8, -15, 16, 19, "#1a1410");
      rect(16, -4, 14, 8, C("#6a6a72")); circ(19, 5, 2.5, "#333"); circ(27, 5, 2.5, "#333");
      break;
    case "sky":
      g.fillStyle = locked ? "#ddd" : "#ffffff";
      for (const [ox, oy, r] of [[-16, 6, 10], [0, 8, 12], [16, 6, 10]]) { g.beginPath(); g.arc(x + ox * s, y + oy * s, r * s, 0, Math.PI * 2); g.fill(); }
      poly([[-24, -10], [24, -10], [6, 6], [-8, 4]], C("#8a6a42"));
      g.beginPath(); g.ellipse(x, y - 11 * s, 25 * s, 8 * s, 0, 0, Math.PI * 2); g.fillStyle = C("#7fb85a"); g.fill(); g.stroke();
      rect(-2, -28, 4, 16, C("#6b4a2a")); circ(0, -30, 8, C("#4f9a46"));
      break;
    case "coral":
      g.beginPath(); g.ellipse(x, y, 26 * s, 8 * s, 0, 0, Math.PI * 2); g.fillStyle = C("#5a9ab0"); g.fill();
      g.lineCap = "round";
      for (const [ox, col] of [[-12, "#ff6f8f"], [0, "#ff9a7a"], [12, "#ff5f9f"]]) {
        g.strokeStyle = C(col); g.lineWidth = 4 * s;
        g.beginPath(); g.moveTo(x + ox * s, y); g.lineTo(x + ox * s, y - 22 * s); g.moveTo(x + ox * s, y - 12 * s); g.lineTo(x + (ox - 7) * s, y - 20 * s); g.moveTo(x + ox * s, y - 15 * s); g.lineTo(x + (ox + 7) * s, y - 26 * s); g.stroke();
      }
      if (!locked) { g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 1.5; for (const [ox, oy, r] of [[18, -30, 3], [22, -38, 2], [15, -42, 2.5]]) { g.beginPath(); g.arc(x + ox * s, y + oy * s, r * s, 0, Math.PI * 2); g.stroke(); } }
      break;
    case "void": {
      const t = game.time;
      for (let i = 0; i < 3; i++) {
        g.beginPath(); g.ellipse(x, y - 16 * s, (22 - i * 6) * s, (16 - i * 4) * s, t * (i % 2 ? 1 : -1) * 0.8, 0, Math.PI * 2);
        g.strokeStyle = locked ? "#999" : ["#7a2ad0", "#a04aff", "#e0b0ff"][i]; g.lineWidth = 4 * s; g.stroke();
      }
      circ(0, -16, 5, locked ? "#777" : "#12041e");
      break;
    }
    default:
      g.strokeStyle = "#3a2a1a"; g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(x, y + 4 * s); g.lineTo(x, y - 34 * s); g.stroke();
      poly([[0, -34], [20, -28], [0, -22]], C((m.theme && m.theme.moss) || "#d23c3c"));
  }
  if (locked) {
    // 자물쇠
    g.strokeStyle = "#3a3a3a"; g.lineWidth = 3 * s;
    g.beginPath(); g.arc(x + 18 * s, y - 34 * s, 6 * s, Math.PI, 0); g.stroke();
    g.fillStyle = "#c8a050"; g.fillRect(x + 10 * s, y - 34 * s, 16 * s, 12 * s);
    g.strokeStyle = "#3a2a1a"; g.lineWidth = 1.5; g.strokeRect(x + 10 * s, y - 34 * s, 16 * s, 12 * s);
  }
}

// 이름표
function placeLabel(str, x, y, size, color, bg) {
  ctx.font = `bold ${size}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  const w = ctx.measureText(str).width + size;
  roundRectPath(x - w / 2, y - size * 0.95, w, size * 1.35, size * 0.4);
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = "rgba(60,40,20,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(str, x, y);
}

// 길 (해금 순서)
function drawRoads() {
  const z = mapSel.cam.z;
  ctx.save();
  ctx.lineCap = "round";
  MAPS.forEach((m, i) => {
    const src = unlockSource(i);
    if (!src) return;
    const a = placeOf(src), b = placeOf(m);
    const open = mapUnlocked(i);
    const A = worldToScreen(a.x, a.y), B = worldToScreen(b.x, b.y);
    // 살짝 휜 길
    const mx = (A.x + B.x) / 2 + (B.y - A.y) * 0.12, my = (A.y + B.y) / 2 - (B.x - A.x) * 0.12;
    ctx.setLineDash([10 * z + 3, 9 * z + 3]);
    ctx.strokeStyle = "rgba(255,245,220,0.6)"; ctx.lineWidth = Math.max(3, 9 * z);
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
    ctx.strokeStyle = open ? "#8a3a22" : "rgba(80,70,60,0.55)"; ctx.lineWidth = Math.max(2, 5 * z);
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
  });
  ctx.restore();
}

// ===== 그리기 =====
function drawMapSelect() {
  layoutMapArea();
  const W = view.w, H = view.h;
  const a = mapSel.area, c = mapSel.cam;
  const pr = game.profile;

  // 바깥 배경
  ctx.fillStyle = "#2a1f14";
  ctx.fillRect(0, 0, W, H);

  // 지도
  if (!mapSel.terrain) mapSel.terrain = buildTerrain();
  ctx.save();
  ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.clip();
  const tl = worldToScreen(0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(mapSel.terrain, tl.x, tl.y, WORLD_W * c.z, WORLD_H * c.z);
  drawRoads();

  // 장소
  mapSel.hits = [];
  const s = Math.max(0.75, Math.min(1.6, 0.55 + c.z * 0.7)) * (Math.min(W, H) < 450 ? 0.85 : 1);
  const order = MAPS.map((m, i) => i).sort((i, j) => placeOf(MAPS[i]).y - placeOf(MAPS[j]).y);
  for (const i of order) {
    const m = MAPS[i];
    const p = placeOf(m);
    const P = worldToScreen(p.x, p.y);
    if (P.x < a.x - 80 || P.x > a.x + a.w + 80 || P.y < a.y - 80 || P.y > a.y + a.h + 80) continue;
    const open = mapUnlocked(i);
    const sel = i === mapSel.index;
    mapSel.hits.push({ i, x: P.x, y: P.y - 16 * s });
    if (sel) {
      const pulse = 1 + 0.12 * Math.sin(game.time * 5);
      ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(P.x, P.y + 2 * s, 34 * s * pulse, 12 * s * pulse, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(255,210,63,0.25)"; ctx.fill();
    }
    drawPlaceIcon(m, P.x, P.y, s, !open);
    const cleared = m.type === "tower" ? pr.towerBest > 0 : pr.cleared.includes(m.id);
    if (cleared) drawStar(P.x - 22 * s, P.y - 36 * s, 9 * s, "#ffd23f");
    const fs = Math.round(Math.max(11, Math.min(17, 13 * s)));
    placeLabel(m.name, P.x, P.y + 22 * s, fs, open ? "#3a2210" : "#6a6a6a", sel ? "rgba(255,236,170,0.95)" : open ? "rgba(245,232,200,0.9)" : "rgba(210,205,195,0.85)");
    let sub = null;
    if (m.type === "tower") { if (pr.towerBest) sub = `최고 ${pr.towerBest}층`; }
    else if (pr.best[m.id]) sub = `최고 Lv ${pr.best[m.id]}`;
    if (sub) { ctx.font = `bold ${fs - 2}px sans-serif`; text(sub, P.x, P.y + 22 * s + fs + 2, fs - 2, "#1f7a3a", "center"); }
  }
  ctx.restore();

  // 지도 위 버튼 (실제 화면 크기)
  const bs = Math.min(W, H) < 450 ? 40 : 48;
  text("모험 지도", a.x + 16, a.y + 36, Math.min(28, H * 0.07), "#ffe27a");
  text(`내 레벨 ${pr.level}`, a.x + 16, a.y + 36 + Math.min(26, H * 0.065), Math.min(17, H * 0.045), "#7dd3ff");
  drawButton(a.x + a.w - bs - 12, a.y + a.h - bs * 2 - 20, bs, bs, "+", () => { mapSel.goal = null; zoomAt(a.x + a.w / 2, a.y + a.h / 2, 1.35); }, { size: 24, color: "rgba(40,30,20,0.6)" });
  drawButton(a.x + a.w - bs - 12, a.y + a.h - bs - 12, bs, bs, "−", () => { mapSel.goal = null; zoomAt(a.x + a.w / 2, a.y + a.h / 2, 1 / 1.35); }, { size: 24, color: "rgba(40,30,20,0.6)" });
  if (!touch.show && H > 450) text("끌기: 이동 · 휠: 확대 · 방향키: 장소 · 엔터: 출발", a.x + a.w / 2, a.y + a.h - 14, 13, "rgba(255,240,210,0.85)", "center");

  // 정보 창 (작은 화면에서는 줄여서)
  beginUIScale(PANEL_MIN_W, PANEL_MIN_H);
  drawMapInfoPanel();
  endUIScale();
}

// 글자 줄바꿈
function wrapLines(str, maxW, size) {
  ctx.font = `bold ${size}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  const words = str.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function drawMapInfoPanel() {
  const W = view.w, H = view.h; // 줄인 화면 기준
  const pr = game.profile;
  const pw = panelVirtualW();
  const x0 = W - pw - 12, y0 = 12, ph = H - 24;
  roundRectPath(x0, y0, pw, ph, 14);
  ctx.fillStyle = "rgba(24,22,32,0.95)"; ctx.fill();
  ctx.strokeStyle = "#c8a050"; ctx.lineWidth = 3; ctx.stroke();
  // 패널 바닥 전체는 지도 탭이 안 되게 막아요 (버튼은 위에 따로)
  addUI(x0, y0, pw, ph, null);
  drawButton(x0 + pw - 52, y0 + 10, 42, 38, "✕", closeOverlay, { size: 20 });

  const m = MAPS[mapSel.index];
  const open = mapUnlocked(mapSel.index);
  const ix = x0 + 18, iw = pw - 36;
  let y = y0 + 40;
  text(m.type === "tower" ? `★ ${m.name}` : m.name, ix, y, 24, open ? "#ffe27a" : "#999");
  y += 14;
  for (const l of wrapLines(m.desc || "", iw, 15).slice(0, 2)) { y += 22; text(l, ix, y, 15, "#ddd"); }
  y += 8;
  let info;
  if (m.type === "tower") info = `${m.floors}층까지 · 5층·10층 보스 · 최고 ${pr.towerBest || 0}층`;
  else {
    const names = Object.keys(m.monsters || {}).map((k) => (MONSTERS[k] && MONSTERS[k].name) || k).join(", ");
    info = `몬스터: ${names}`;
  }
  for (const l of wrapLines(info, iw, 13).slice(0, 3)) { y += 19; text(l, ix, y, 13, "#bbb"); }

  if (!open) {
    const prev = unlockSource(mapSel.index).name;
    y += 40;
    text("잠겨 있어요", ix, y, 20, "#ffb070");
    y += 28;
    for (const l of wrapLines(`${prev}${josa(prev, "을", "를")} 먼저 깨면 열려요`, iw, 16)) { text(l, ix, y, 16, "#ffd0a0"); y += 22; }
    return;
  }

  // 레벨 고르기
  const r = levelRange(m);
  const L = mapSel.level;
  y += 20;
  const btn = 46;
  drawButton(ix, y, btn, btn, "−", () => changeLevel(-1), { size: 26, color: L > r.min ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)" });
  text(`Lv ${L}`, ix + btn + 48, y + 33, 28, "#fff", "center");
  drawButton(ix + btn + 96, y, btn, btn, "+", () => changeLevel(1), { size: 26, color: L < r.max ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)" });
  const label = difficultyLabel(L);
  const lx2 = ix + btn * 2 + 108;
  if (lx2 + 60 < x0 + pw) text(label.text, lx2, y + 30, 17, label.color);
  y += btn + 22;
  text(`고를 수 있는 레벨 ${r.min}~${r.max}`, ix, y, 13, "#aaa");
  if (L !== pr.level && pr.level >= r.min && pr.level <= r.max) {
    drawButton(ix + iw - 118, y - 22, 118, 32, `내 레벨(${pr.level})`, () => { mapSel.level = pr.level; }, { size: 14 });
  }
  y += 24;
  text(`클리어 보너스 에메랄드 ${Math.round(clearBonus(m, L) * rewardFactor())}개 · 경험치 ×${rewardMul(L).toFixed(2)}`, ix, y, 13, "#7dffb0");
  y += 20;
  // 받을 부품 미리보기 (처음 깨면 더 많이)
  const first = !pr.firstClears[`${m.id}:${pr.difficulty}`];
  const mats = stageMaterials(L, first);
  text("부품: " + Object.entries(mats).map(([id, n]) => `${MATERIALS[id].name} ${n}`).join(", ") + (first ? " (첫 클리어!)" : ""), ix, y, 13, "#7dd3ff");
  y += 20;
  text(`난이도 ${DIFFICULTY[pr.difficulty].name}${pr.hardMode ? " · 하드모드" : ""}`, ix, y, 13, "#ccc");

  const goH = 52;
  drawButton(ix, y0 + ph - goH - 14, iw, goH, "출발!", () => tryStartMap(mapSel.index), { color: "rgba(140,90,220,0.55)", size: 22 });
}
