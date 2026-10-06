// ===== 월드 6 "색모래 사막" 이야기·퀘스트 (설계서 docs/design/story.md "월드 6", world6-desert.md 9장) =====
// 퀘스트 엔진(quests.js)이 있을 때만 등록해요.
// 이야기: 틈이 닫히기 전에 본 "별빛도 그림자도 아닌 색"이 사막에 떨어졌어요 → 낙타 할머니 사막여우 "사르르"가 길잡이
//   → 모래가 신기루(예전 보스 모양의 모래 그림자)를 만들어요 → 신기루를 달래며 색모래를 모아요 → 무지개 피라미드의 새빛 스핑크스 무지냥
//   → 무지냥은 나쁜 게 아니라 "집에 가는 길을 잃은 새 색깔"이었어요 (새 떡밥: 무지냥은 어디서 왔을까?)
// "마지막"이라는 말은 쓰지 않아요. 다음 월드 예고는 next (다음 월드가 있을 때만).

if (typeof questGiver === "function") questGiver(6, {
  id: "sareureu", name: "사르르", label: "사르르 (사막여우)", x: 18.6, y: 13.4,
  draw(n) {
    // 사막여우: 모래색 몸 + 아주 큰 귀 + 하얀 배 + 복슬 꼬리 + 파란 목도리
    const x = n.x, y = n.y, t = (typeof game !== "undefined" ? game.time : 0), tail = Math.sin(t * 2.4) * 0.07;
    drawBox(x - 0.22, y - 0.16, 0, 0.44, 0.32, 0.32, "#e0b070");
    drawBox(x - 0.12, y + 0.12, 0.06, 0.24, 0.06, 0.22, "#fff4e0");
    drawBox(x - 0.16, y - 0.14, 0.32, 0.32, 0.3, 0.26, "#e8bc7c");
    drawBox(x - 0.2, y - 0.12, 0.58, 0.12, 0.08, 0.28, "#e8bc7c"); drawBox(x + 0.08, y - 0.12, 0.58, 0.12, 0.08, 0.28, "#e8bc7c");
    drawBox(x - 0.17, y - 0.1, 0.62, 0.06, 0.04, 0.18, "#ffc8b0"); drawBox(x + 0.11, y - 0.1, 0.62, 0.06, 0.04, 0.18, "#ffc8b0");
    drawBox(x - 0.1, y + 0.16, 0.44, 0.06, 0.02, 0.06, "#2a1a10"); drawBox(x + 0.04, y + 0.16, 0.44, 0.06, 0.02, 0.06, "#2a1a10");
    drawBox(x - 0.18, y - 0.16, 0.3, 0.36, 0.34, 0.06, "#4a98d0");
    drawBox(x - 0.06 + tail, y - 0.36, 0.08, 0.14, 0.24, 0.14, "#e0b070"); drawBox(x - 0.04 + tail * 1.4, y - 0.46, 0.14, 0.1, 0.1, 0.12, "#fff4e0");
  },
});

if (typeof questFragment === "function") {
  questFragment({ id: "w6_colorSand", world: 6, map: "quicksands", name: "반짝 색모래", text: "모래 늪 깊은 곳에서 무지개처럼 반짝이는 모래를 찾았어요." });
  questFragment({ id: "w6_catBell", world: 6, map: "sunken_temple", name: "작은 고양이 방울", text: "신전 벽에 고양이 그림이 있어요. 방울 소리가 어딘가 낯익어요." });
  questFragment({ id: "w6_secret", world: 6, map: "glassdune", name: "읽을 수 없는 조각", secret: true });
}
if (typeof questRegister === "function") {
  const Q = (o) => questRegister({ world: 6, giver: "sareureu", main: true, ...o });
  Q({ id: "w6_q1", order: 1, title: "사막에 떨어진 새 색깔", intro: ["어서 와, 꼬마 모험가! 나는 사막여우 사르르야.", "며칠 전 밤하늘에서 처음 보는 색깔이 사막에 떨어졌어.", "그 뒤로 모래가 이상한 신기루를 만들어. 햇살 모래 언덕부터 봐 줄래?"],
    goal: { type: "boss", map: "sunsand" }, done: ["쨍쨍이가 선글라스를 벗고 웃었어!", "새 색깔이 사막 친구들 마음을 들뜨게 했대. 그래서 다들 장난이 심해졌나 봐."], reward: { emeralds: 25 } });
  Q({ id: "w6_q2", order: 2, title: "모래 늪의 반짝이", requires: ["w6_q1"], intro: ["쑥쑥 모래 늪 깊은 곳에서 뭔가 반짝였대.", "모래 늪에 오래 있으면 쑥쑥 빠지니까 조심해."],
    goal: { type: "fragment", map: "quicksands", frag: "w6_colorSand" }, done: ["와, 무지개처럼 반짝이는 모래야!", "새 색깔이 지나간 자리마다 이런 모래가 남나 봐."], reward: { emeralds: 25 } });
  Q({ id: "w6_q3", order: 3, title: "따끔따끔 선인장 젤리", requires: ["w6_q2"], intro: ["선인장 골짜기에 선인장 젤리가 너무 많아졌어.", "열 마리만 달래 줄래? 선인장은 따끔하니까 피해서!"],
    goal: { type: "kill", mon: "w6_cactusJelly", n: 10 }, done: ["골짜기가 조용해졌어. 고마워!"], reward: { emeralds: 30 } });
  Q({ id: "w6_q4", order: 4, title: "묻힌 신전의 고양이 그림", requires: ["w6_q3"], intro: ["모래에 묻힌 신전 벽에 오래된 그림이 있대.", "그림 근처에 떨어진 조각을 찾아 줘."],
    goal: { type: "fragment", map: "sunken_temple", frag: "w6_catBell" }, done: ["고양이 방울이네… 이 소리, 새 색깔이 떨어지던 밤에도 들렸어!", "어쩌면 새 색깔은 고양이 모습일지도 몰라."], reward: { emeralds: 30 } });
  Q({ id: "w6_q5", order: 5, title: "색모래 들판", requires: ["w6_q4"], intro: ["색모래 들판까지 가면 새 색깔이 어디로 갔는지 알 수 있을 거야."],
    goal: { type: "boss", map: "rainbowsand" }, done: ["색모래 발자국이 스핑크스 문 쪽으로 이어져 있어!"], reward: { emeralds: 35 } });
  Q({ id: "w6_q6", order: 6, title: "태양 왕좌의 신기루", requires: ["w6_q5"], intro: ["피라미드로 가려면 태양 왕좌를 지나야 해.", "물 항아리를 깨서 신기루를 젖은 땅으로 데려가면 비틀거려."],
    goal: { type: "boss", map: "sunthrone" }, done: ["길이 열렸어! 무지개 피라미드가 보여."], reward: { emeralds: 40 } });
  Q({ id: "w6_q7", order: 7, title: "새빛 스핑크스 무지냥", requires: ["w6_q6"], intro: ["피라미드 꼭대기에 무지개 스핑크스가 있대. 이름은 무지냥.", "무지개 빛기둥은 옆으로, 무지개 회오리는 무지냥 곁으로 쏙!"],
    goal: { type: "boss", map: "prismpyramid" }, done: ["무지냥이 작은 무지개 고양이가 됐어!", "무지냥은 나쁜 애가 아니었어. 집에 가는 길을 잃어서 울고 있었던 거야.", "그런데 무지냥의 집은 어디일까? 별빛도 그림자도 아닌 그 색이 사는 곳."],
    next: ["무지냥이 {next} 쪽을 가리켜. 같이 데려다주자!", "이건 선물이야. 색모래를 담은 모래시계야."],
    nextNone: ["그곳은 아직 아무도 몰라. 무지냥이랑 같이 찾아보자.", "이건 선물이야. 색모래를 담은 모래시계야."],
    reward: { emeralds: 60, title: "색모래 길잡이", furn: "q_sandglass" } });
  questRegister({ id: "w6_side_secret", world: 6, order: 10, title: "유리 모래의 수수께끼", giver: "sareureu", main: false, requires: ["w6_q2"],
    intro: ["유리 모래 언덕에 이상한 글자가 새겨진 조각이 있대.", "읽을 수는 없지만 모아 두면 언젠가 뜻을 알 거야."],
    goal: { type: "fragment", map: "glassdune", frag: "w6_secret" }, done: ["역시 못 읽겠어. 그래도 소중히 간직하자."], reward: { emeralds: 20 } });
  questRegister({ id: "w6_side_coop", world: 6, order: 11, title: "낙타 길은 둘이서", giver: "sareureu", main: false, requires: ["w6_q1"],
    intro: ["낙타 길은 길어서 혼자 가면 심심해.", "친구랑 같이 가 봐."],
    goal: { type: "coop", map: "camelroad" }, done: ["둘이 가니까 금방이지?"], reward: { emeralds: 20 } });
  questRegister({ id: "w6_side_dog", world: 6, order: 12, title: "더운 날엔 강아지도", giver: "sareureu", main: false, requires: ["w6_q1"],
    intro: ["사막은 더워서 강아지도 지쳤어.", "캠프 강아지를 쓰다듬어 줄래?"],
    goal: { type: "pet" }, done: ["강아지가 꼬리를 살랑살랑! 시원해졌대."], reward: { emeralds: 10 } });
}
if (typeof storyBossLines === "function") storyBossLines({
  sunsand: "원래는 언덕 위에서 일광욕하던 느긋한 도마뱀이었어요",
  quicksands: "원래는 모래 구멍에서 친구를 기다리던 수줍은 개미귀신이었어요",
  cactusvale: "원래는 골짜기에 꽃을 피우던 다정한 선인장이었어요",
  mirageoasis: "원래는 오아시스에서 숨바꼭질을 좋아하던 장난꾸러기 낙타였어요",
  dunecastle: "원래는 아이들이 쌓은 모래성을 지키던 꼬마 기사였어요",
  starnight: "원래는 밤길 잃은 낙타를 등불로 안내하던 올빼미였어요",
  scarabhall: "원래는 사막 길을 동글동글 다져 주던 일꾼 대장이었어요",
  windcanyon: "원래는 협곡 바람으로 모래 언덕을 예쁘게 빚던 독수리였어요",
  sunken_temple: "원래는 신전 그늘에서 낮잠 자던 고양이였어요",
  glassdune: "원래는 햇빛을 모아 언덕을 반짝이게 하던 유리 전갈이었어요",
  camelroad: "원래는 대상단을 이끌던 착한 대장 낙타였어요",
  rainbowsand: "원래는 색모래 들판에서 무지개 놀이를 하던 장난꾸러기 뱀이었어요",
  sphinxgate: "원래는 스핑크스 문을 지키며 수수께끼를 내던 다정한 돌 문지기였어요",
  sunthrone: "원래는 사막을 따뜻하게 비추던 상냥한 태양 왕이었어요",
  prismpyramid: "원래는 집에 가는 길을 잃은 새 색깔이었어요. 이제 작은 무지개 고양이예요",
});
