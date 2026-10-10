// ===== 월드 7 "픽셀 사이버 세계" 이야기·퀘스트 (설계서 docs/design/world7-cyber.md 0·7장, story.md) =====
// 퀘스트 엔진(quests.js)이 있을 때만 등록해요.
// 이야기: "별빛도 그림자도 아닌 색" = 화면 빛. 무지냥(작은 무지개 고양이)은 이 세계에서 떨어진 색 조각이었어요.
//   버그(지지직 오류)가 퍼져 친구들이 고장 났어요 -> 보스를 달래면 "다시 켜졌어요!" -> 커널 코어의 오류왕 블루스크린
//   -> 블루스크린: "이 뜨거운 버그는 아래쪽에서 올라왔어" (새 떡밥, 다음 월드가 있으면 그 이름을 말해요)
// "마지막"이라는 말은 쓰지 않아요. 다음 월드 예고는 next (다음 월드가 있을 때만).

if (typeof questGiver === "function") questGiver(7, {
  id: "mujinyang", name: "무지냥", label: "무지냥 (작은 무지개 고양이)", x: 18.6, y: 13.4,
  draw(n) {
    // 작은 무지개 고양이: 크림색 몸 + 세모 귀 + 무지개 꼬리(색이 돌아요) + 머리띠
    const x = n.x, y = n.y, t = (typeof game !== "undefined" ? game.time : 0), hue = (k) => ["#ff8ab0", "#ffd060", "#7adf8a", "#7ac8ff", "#c08aff"][Math.floor(t * 2 + k) % 5];
    drawBox(x - 0.2, y - 0.14, 0, 0.4, 0.28, 0.28, "#f4dcb8");
    drawBox(x - 0.16, y - 0.14, 0.28, 0.32, 0.28, 0.26, "#f4dcb8");
    drawBox(x - 0.16, y - 0.1, 0.54, 0.08, 0.08, 0.12, "#f4dcb8"); drawBox(x + 0.08, y - 0.1, 0.54, 0.08, 0.08, 0.12, "#f4dcb8");
    drawBox(x - 0.17, y - 0.15, 0.48, 0.34, 0.3, 0.05, hue(1));
    drawBox(x - 0.1, y + 0.14, 0.38, 0.06, 0.02, 0.06, "#4a1a6a"); drawBox(x + 0.04, y + 0.14, 0.38, 0.06, 0.02, 0.06, "#4a1a6a");
    drawBox(x - 0.04, y - 0.34, 0.12 + Math.sin(t * 3) * 0.04, 0.08, 0.22, 0.08, hue(0));
  },
});

if (typeof questFragment === "function") {
  questFragment({ id: "w7_pixelPaw", world: 7, map: "datariver", name: "픽셀 발자국", text: "데이터 강가에 작은 고양이 발자국이 픽셀로 찍혀 있어요. 무지냥 발자국이에요!" });
  questFragment({ id: "w7_hotChip", world: 7, map: "serverfarm", name: "뜨거운 칩", text: "서버 농장 바닥에서 아주 뜨거운 칩을 찾았어요. 아래쪽에서 올라온 것 같아요." });
  questFragment({ id: "w7_secret", world: 7, map: "glitchmaze", name: "읽을 수 없는 조각", secret: true });
}
if (typeof questRegister === "function") {
  const Q = (o) => questRegister({ world: 7, giver: "mujinyang", main: true, ...o });
  Q({ id: "w7_q1", order: 1, title: "무지냥의 집", intro: ["여기가 내 집이야! 픽셀 사이버 세계!", "그런데… 다들 지지직 고장 났어. 버그가 퍼졌나 봐.", "픽셀 마을의 테트로부터 다시 켜 줄래? 이번엔 더 세니까 조심해!"],
    goal: { type: "boss", map: "pixeltown" }, done: ["테트로가 다시 켜졌어! 블록이 반짝반짝.", "보스방 귀퉁이 백신 단말기를 치면 보스가 비틀거려. 꼭 써 봐!"], reward: { emeralds: 30 } });
  Q({ id: "w7_q2", order: 2, title: "강가의 발자국", requires: ["w7_q1"], intro: ["데이터 강가에 내 발자국이 남아 있을 거야.", "내가 떨어지기 전에 어디로 갔는지 알 수 있어."],
    goal: { type: "fragment", map: "datariver", frag: "w7_pixelPaw" }, done: ["맞아, 이건 내 발자국이야!", "버그를 피해 도망치다가 사막으로 떨어졌던 거야."], reward: { emeralds: 30 } });
  Q({ id: "w7_q3", order: 3, title: "지지직 젤리 정리", requires: ["w7_q2"], intro: ["글리치 젤리가 가짜를 자꾸 만들어서 헷갈려.", "진짜 젤리 열두 마리만 달래 줘. 가짜는 줄무늬가 있어!"],
    goal: { type: "kill", mon: "w7_glitchJelly", n: 12 }, done: ["미로가 조금 덜 꼬였어. 고마워!"], reward: { emeralds: 35 } });
  Q({ id: "w7_q4", order: 4, title: "뜨거운 칩", requires: ["w7_q3"], intro: ["서버 농장이 이상하게 뜨거워.", "바닥에 떨어진 걸 찾아 줄래?"],
    goal: { type: "fragment", map: "serverfarm", frag: "w7_hotChip" }, done: ["앗 뜨거! 이 칩은 우리 세계 것이 아니야.", "버그는 더 아래쪽, 뜨거운 곳에서 올라온 것 같아."], reward: { emeralds: 35 } });
  Q({ id: "w7_q5", order: 5, title: "네온 오락실", requires: ["w7_q4"], intro: ["네온 오락실 집집이가 인형을 다 가둬 놨대.", "집게가 멈추면 옆으로 피해!"],
    goal: { type: "boss", map: "neonarcade" }, done: ["인형들이 다 풀려났어! 커널 코어 길이 열렸어."], reward: { emeralds: 40 } });
  Q({ id: "w7_q6", order: 6, title: "오류왕 블루스크린", requires: ["w7_q5"], intro: ["커널 코어에 오류왕 블루스크린이 있어.", "파란 파동이 오면 블루스크린 곁 안쪽 원으로 쏙!"],
    goal: { type: "boss", map: "kernelcore" }, done: ["블루스크린이 다시 켜졌어! 우리 세계가 돌아왔어!", "그런데 블루스크린이 그랬지? 버그는 아래쪽 뜨거운 곳에서 올라왔다고."],
    next: ["{next}… 거기서 뜨거운 버그가 올라왔대. 같이 가 보자!"],
    nextNone: ["아래쪽 뜨거운 곳은 아직 아무도 몰라. 언젠가 같이 찾아보자."],
    reward: { emeralds: 70, title: "픽셀 수리공" } });
  questRegister({ id: "w7_side_secret", world: 7, order: 10, title: "글리치 미로의 수수께끼", giver: "mujinyang", main: false, requires: ["w7_q2"],
    intro: ["글리치 미로에 읽을 수 없는 글자 조각이 있대.", "모아 두면 언젠가 뜻을 알 거야."],
    goal: { type: "fragment", map: "glitchmaze", frag: "w7_secret" }, done: ["역시 못 읽겠어. 그래도 소중히!"], reward: { emeralds: 20 } });
  questRegister({ id: "w7_side_coop", world: 7, order: 11, title: "구름 저장소는 둘이서", giver: "mujinyang", main: false, requires: ["w7_q1"],
    intro: ["구름 저장소는 넓어서 친구랑 가면 좋아."], goal: { type: "coop", map: "cloudvault" }, done: ["둘이 지키니까 사진이 하나도 안 없어졌어!"], reward: { emeralds: 20 } });
}
if (typeof storyBossLines === "function" && typeof W7_BOSS_LIST !== "undefined") {
  const lines = {}; for (const E of W7_BOSS_LIST) lines[E.mapId] = E.line;
  storyBossLines(lines);
}
