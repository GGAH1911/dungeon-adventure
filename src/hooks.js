// ===== 알림 지점(훅) =====
// 다른 파일이 게임 함수를 직접 감싸지 않고, 정해진 "알림 지점"에 등록해서 끼어들어요.
// 그래야 파일 하나를 고쳐도 다른 파일이 깨지지 않아요.
//
//   hookOn(이름, 함수, 순서=50)   순서가 작을수록 먼저 불려요
//   hookRun(이름, ...값)          등록된 함수를 모두 불러요
//   hookAny(이름, ...값)          하나라도 true 를 돌려주면 거기서 멈추고 true (막기/대신하기)
//   hookFilter(이름, 값, ...값)   값을 차례로 바꿔가며 넘겨요
//
// 알림 지점 목록 (어디서 불리는지)
//   reset()                         장면이 바뀔 때 (main.js resetEffects 끝)
//   monsterDamage(h) -> true=막음   몬스터가 맞기 전. h = { m, dmg, fromX, fromY, legendary, knock, opts } 를 고칠 수 있어요
//   monsterDamaged(h)               몬스터가 맞은 뒤
//   monsterKilled(m, legendary, opts)
//   playerHurt(p, damage, from, hpBefore)   주인공이 맞은 뒤
//   monstersSpawned(mapDef, level, rand)    던전 몬스터 배치 뒤
//   dungeonStarted(def, level)              던전 시작 뒤
//   endRun(win) -> true=막음
//   dungeonTick(dt)                 던전에서 매 프레임 (상자 갱신 뒤)
//   drawArrow(a) -> true=대신 그림
//   drawMonsterUnder(m) / drawMonsterOver(m) / monsterAlpha(값, m)
//   drawFloor()                     바닥 표시 그리기 (전설 바닥 뒤)
//   worldThings(things)             깊이 정렬해서 그릴 물건 더하기
//   lights(lights)                  어둠 속 빛 더하기
//   resultUpdate() -> true=대신 처리 / resultDraw() -> true=대신 그림
//   hudDraw() / minimapDraw(p, list)
//   untargetable(o) -> true=자동 조준에서 빼기
//   castStart(m, id) / castStarted(m, id)          기술 예고 시작 전/후 (abilities.js)
//   resolveCast(c, p) -> true=대신 처리 / castResolved(c, p, zonesBefore)
//   abilitiesUpdated(dt) / drawTelegraphsAfter()
//   menuItems(items)                메뉴 항목 더하기 (items.push({ label, act }))
//   profileLoaded(pr)               저장을 읽은 뒤 (새 필드 기본값 채우기)
//   profileSaved(pr)                저장한 뒤 (캐릭터 목록·공용 보관함: chars.js)
//   titleUpdate(dt) -> true / titleDraw() -> true   처음 화면 대신 (캐릭터 고르기: chars.js)
//   hudSkip() -> true               화면 정보(하트·화폐...)를 그리지 않기 (캐릭터 창: hero.js)
//   overlayUpdate(name, dt) -> true / overlayDraw(name) -> true   새 창 (game.overlay = "이름")
//   lobbyInteractables(list) -> list   캠프에서 E/터치로 쓸 것 더하기 ({ x, y, range, short, prompt, action })
//   playerInput(inp, p) -> inp      주인공 조작 (둘이 하기에서 사람마다 나눠요)
//   playerLook(look, p) -> look / playerPlaced(p1) / playerDown(p) -> true=결과창 대신 (친구가 살아있음)
//   playersUpdated(dt)              주인공들 움직인 뒤 매 프레임 (캠프·던전)
//   cameraTarget(null, x, y) -> {x,y} / touchButtons(list, s) -> list / touchJoyStart(e, x, y) -> true / touchMove(e) / touchEnd(e) / touchDraw()
//   touchDown(e, x, y) -> true      화면을 누른 맨 처음 (true 면 게임 버튼·조이스틱 대신 처리. 버튼 배치 바꾸기: btnlayout.js)
//   joyRest(pos) -> pos             조이스틱이 쉬는 자리 {x, y} (hud.js)
//   lobbyThings(things)             캠프에 그릴 물건 더하기 ({ depth, draw })
//   timeScale(dt) -> dt             매 프레임 시간 바꾸기 (느린 화면). 원래 dt 를 받아 바꾼 dt 를 돌려줘요 (main.js update)
const HOOKS = {};
let hookSeq = 0;
function hookOn(name, fn, order = 50) {
  const list = (HOOKS[name] = HOOKS[name] || []);
  list.push({ fn, order, seq: hookSeq++ });
  list.sort((a, b) => a.order - b.order || a.seq - b.seq);
}
function hookRun(name, ...args) {
  const list = HOOKS[name];
  if (list) for (const h of list) h.fn(...args);
}
function hookAny(name, ...args) {
  const list = HOOKS[name];
  if (list) for (const h of list) if (h.fn(...args)) return true;
  return false;
}
function hookFilter(name, value, ...args) {
  const list = HOOKS[name];
  if (list) for (const h of list) value = h.fn(value, ...args);
  return value;
}
