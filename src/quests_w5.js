// ===== 월드 5 "공허" 이야기·퀘스트 (설계서 docs/design/story.md 2장 "반전: 월드 5 공허", world5-void.md 9장) =====
// 퀘스트 엔진(quests.js: questGiver · questRegister · storyBossLines)이 있을 때만 등록해요. 없으면 아무것도 안 해요.
// 이야기: 색이 빠진 회색 섬들 → 회색 고양이 고요가 처음엔 의심 → 섬마다 메아리(예전 보스의 그림자)에 색을 돌려줘요
//   → 고요가 그림자 마왕은 원래 장막의 문지기(친구)였다고 털어놓아요 → 틈새 거인 → 틈 너머 블랙홀 꿀꺽이를 이기면 틈이 닫혀요 (열린 결말)
// "마지막"이라는 말은 쓰지 않아요 (월드 6 이 이어져요). 다음 월드 예고는 퀘스트 next(다음 월드가 있을 때만)와 블랙홀 쓰러짐 문구(bosses_w5hole.js)가 해요.

if (typeof questGiver === "function") questGiver(5, {
  id: "goyo", name: "고요", label: "고요 (회색 고양이)", x: 18.6, y: 13.4,
  draw(n) {
    // 회색 고양이: 통통한 몸 + 세모 귀 + 별 목걸이 + 살랑 꼬리
    const x = n.x, y = n.y, t = (typeof game !== "undefined" ? game.time : 0), tail = Math.sin(t * 2) * 0.08;
    drawBox(x - 0.22, y - 0.18, 0, 0.44, 0.36, 0.34, "#8a8898");
    drawBox(x - 0.18, y - 0.16, 0.34, 0.36, 0.32, 0.28, "#9a98a8");
    drawBox(x - 0.16, y - 0.14, 0.62, 0.08, 0.08, 0.1, "#9a98a8"); drawBox(x + 0.06, y - 0.14, 0.62, 0.08, 0.08, 0.1, "#9a98a8");
    drawBox(x - 0.12, y + 0.16, 0.44, 0.06, 0.02, 0.06, "#d8f0ff"); drawBox(x + 0.06, y + 0.16, 0.44, 0.06, 0.02, 0.06, "#d8f0ff");
    drawBox(x - 0.05, y + 0.18, 0.3, 0.1, 0.04, 0.08, "#fff6d8");
    drawBox(x - 0.04 + tail, y - 0.34, 0.1, 0.08, 0.2, 0.08, "#7a7888"); drawBox(x - 0.04 + tail * 1.5, y - 0.4, 0.18, 0.08, 0.08, 0.2, "#7a7888");
  },
});

// 이야기 조각: 돌 정원에 숨은 그림자 마왕의 반쪽 왕관 (떡밥 4)
if (typeof questFragment === "function") questFragment({ id: "w5_halfCrown", world: 5, map: "stonegarden", name: "반쪽 왕관", text: "그림자 마왕의 왕관 반쪽이에요. 나머지 반쪽은 어디 있을까요?" });
if (typeof questRegister === "function") {
  const Q = (o) => questRegister({ world: 5, giver: "goyo", main: true, ...o });
  Q({ id: "w5_q1", order: 1, title: "회색 섬의 첫 색",
    intro: ["…누구야? 여긴 고요 섬이야.", "너희가 공허 조각을 다 모아 가서 장막이 더 약해졌어.", "회색 꽃 섬의 메아리에게 색을 돌려주면, 조금은 믿어 줄게."],
    goal: { type: "boss", map: "graybloom" },
    done: ["…정말 색이 돌아왔네.", "메아리는 예전 보스들의 그림자야. 조각이 남긴 회색 꿈이지.", "좋아. 조금 믿어 볼게."],
    reward: { emeralds: 20 } });
  Q({ id: "w5_q2", order: 2, title: "흐릿한 꼬마들", requires: ["w5_q1"],
    intro: ["메아리 숲에 흐릿한 그림자 꼬마들이 늘었어.", "메아리 종을 치거나 색 수정을 켜면 들켜.", "그림자 꼬마 여덟 마리를 정리해 줄래?"],
    goal: { type: "kill", mon: "w5_shadeKid", n: 8 },
    done: ["고마워. 숲이 조금 조용해졌어.", "…종소리, 오랜만에 들었네."],
    reward: { emeralds: 25 } });
  Q({ id: "w5_q3", order: 3, title: "그림자 웅덩이의 비밀", requires: ["w5_q2"],
    intro: ["조용한 돌 정원 어딘가에 이야기 조각이 떨어져 있대.", "그림자 분신을 조심하면서 찾아봐."],
    goal: { type: "fragment", map: "stonegarden", frag: "w5_halfCrown" },
    done: ["이건… 반쪽 왕관 그림이야.", "나머지 반쪽은 어디 있을까. 나도 몰라."],
    reward: { emeralds: 25 } });
  Q({ id: "w5_q4", order: 4, title: "달 없는 들판의 고백", requires: ["w5_q3"],
    intro: ["달 없는 들판의 메아리는 숨는 걸 좋아해.", "숨으면 메아리 종을 쳐."],
    goal: { type: "boss", map: "moonless" },
    done: ["…말해 줄게. 그림자 마왕은 원래 장막의 문지기였어.", "내 친구였지. 틈이 생겼을 때 제일 먼저 홀렸어.", "너희가 이겨서 다행이야. 이제 그 애를 기다릴 수 있어."],
    reward: { emeralds: 30 } });
  Q({ id: "w5_q5", order: 5, title: "꽁꽁 꿈 호수", requires: ["w5_q4"],
    intro: ["꿈 호수가 꽁꽁 얼었어. 꿈들이 쉬지 못해.", "호수의 메아리에게 색을 돌려줘."],
    goal: { type: "boss", map: "frostdream" },
    done: ["호수가 반짝여. 꿈들이 다시 쉬고 있어.", "이제 남은 건 틈새야."],
    reward: { emeralds: 30 } });
  Q({ id: "w5_q6", order: 6, title: "틈새 거인", requires: ["w5_q5"],
    intro: ["틈새에서 공허가 뭉쳐 거인이 됐어.", "색 수정 네 개를 한꺼번에 켜면 거인이 눈부셔할 거야.", "…같이 가 줄 수는 없지만, 응원할게."],
    goal: { type: "boss", map: "rift" },
    done: ["거인이 잠들었어! 문지기도 돌아왔대.", "그런데 이상해. 틈 너머에서 별이 하나씩 사라지고 있어.", "누가 별을 꿀꺽꿀꺽 삼키고 있나 봐."],
    reward: { emeralds: 40 } });
  Q({ id: "w5_q7", order: 7, title: "별을 삼키는 블랙홀", requires: ["w5_q6"],
    intro: ["틈 너머에 블랙홀이 있어. 별과 색을 다 빨아들여.", "빨아들일 땐 초록으로 빛나는 자리에 꼭 숨어.", "기둥 뒤 그림자, 켜진 색 수정 빛 방울, 작은 별 닻이야."],
    goal: { type: "boss", map: "starmaw" },
    done: ["별과 색이 펑 하고 돌아왔어! 틈이 닫혔어.", "그런데 닫히기 전에 봤어? 별빛도 그림자도 아닌 색.", "장막 저편에서 누가 두드리고 있었어."],
    next: ["그 저편 이름은 {next}래. 같이 가 보자.", "이건 선물이야. 별을 담은 병이야."],
    nextNone: ["그게 누군지는 아직 아무도 몰라.", "이건 선물이야. 별을 담은 병이야."],
    reward: { emeralds: 60, title: "별을 되찾은 용사", furn: "q_starjar" } });
  // 곁 퀘스트 (이야기 줄기와 따로)
  questRegister({ id: "w5_side_house", world: 5, order: 10, title: "고요의 집 구경", giver: "goyo", main: false, requires: ["w5_q1"],
    intro: ["너희 집에는 트로피가 많다며?", "한 번 들어가 봐. 나는 문 앞에서 볼게."],
    goal: { type: "visit", place: "house" }, done: ["…따뜻해 보이네. 나도 언젠가 놀러 갈래."], reward: { emeralds: 10 } });
  questRegister({ id: "w5_side_coop", world: 5, order: 11, title: "같이 가면 무섭지 않아", giver: "goyo", main: false, requires: ["w5_q2"],
    intro: ["떠도는 별배는 혼자 가면 길을 잃기 쉬워.", "친구랑 같이 가 봐."],
    goal: { type: "coop", map: "driftship" }, done: ["둘이 가니까 별배도 금방이지?"], reward: { emeralds: 20 } });
  questRegister({ id: "w5_side_bells", world: 5, order: 12, title: "고요 섬의 별빛 꽃", giver: "goyo", main: false, requires: ["w5_q1"],
    intro: ["고요 섬의 민들레는 공허 섬을 깰 때마다 색이 돌아와.", "모래시계 언덕까지 가 보면 꽃이 꽤 예뻐질 거야."],
    goal: { type: "clear", map: "sandglass" }, done: ["봐, 민들레가 노랗게 웃고 있어."], reward: { emeralds: 20 } });
  questRegister({ id: "w5_side_keep", world: 5, order: 13, title: "잊힌 성의 이름", giver: "goyo", main: false, requires: ["w5_q5"],
    intro: ["아무도 이름을 기억 못 하는 성이 있어.", "끝까지 가 보면 성이 이름을 떠올릴지도 몰라."],
    goal: { type: "clear", map: "forgotkeep" }, done: ["성 문에 글자가 다시 보여. 해골 임금님 성이었대."], reward: { emeralds: 25 } });
}

if (typeof storyBossLines === "function") storyBossLines({
  graybloom: "원래는 동굴 버섯을 돌보던 정원사 버섯의 메아리였어요",
  mistshore: "원래는 바닷가 진주를 지키던 큰 조개의 메아리였어요",
  hushcrater: "원래는 별똥별을 받아 주던 돌 골렘의 메아리였어요",
  echowood: "원래는 정글 슬라임들의 다정한 임금님의 메아리였어요",
  stonegarden: "원래는 옛 유적의 성실한 돌 문지기의 메아리였어요",
  moonless: "원래는 달의 뒷면을 지키던 늑대의 메아리였어요",
  sandglass: "원래는 사막 신전의 꼬마 파라오의 메아리였어요",
  driftship: "원래는 길 잃은 우주선 꼬마 선장의 메아리였어요",
  ashforge: "원래는 땅속 대장간 대장장이 거인의 메아리였어요",
  frostdream: "원래는 얼음 성채 눈송이 여왕의 메아리였어요",
  emberwing: "원래는 용암 요새를 지키던 불의 용의 메아리였어요",
  forgotkeep: "원래는 뼈 기사들을 아끼던 해골 임금님의 메아리였어요",
  dreamdeep: "원래는 산호 동굴의 장난꾸러기 문어 대왕의 메아리였어요",
  rift: "원래는 틈새로 새어 나온 공허가 뭉친 거인이었어요. 이제는 조용히 잠들어요",
  starmaw: "원래는 꿈을 재워 주던 작은 별 우물이었어요. 이제 별을 하나씩 돌려줘요",
});
