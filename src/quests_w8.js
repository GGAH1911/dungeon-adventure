// ===== 월드 8 "뜨끈 지옥" 이야기·퀘스트 (설계서 docs/design/world8-hell.md 7장) =====
// 퀘스트 엔진(quests.js)이 있을 때만 등록해요.
// 이야기: 월드 7 커널 코어를 고치자 뜨끈한 틈이 열려요 → 꼬마 도깨비 "뿔이"가 길잡이
//   → 큰 불씨 종에 금이 가서 불씨들이 심술이 났어요 → 종 조각을 모으며 보스들을 달래요 → 불씨 왕좌의 불씨 임금 화르릉
//   → 화르릉은 종이 깨져서 속상했던 것뿐. 같이 종을 고쳐요.
// "마지막"이라는 말은 쓰지 않아요. 다음 월드 예고는 next (다음 월드가 있을 때만).

if (typeof questGiver === "function") questGiver(8, {
  id: "ppuri", name: "뿔이", label: "뿔이 (꼬마 도깨비)", x: 18.6, y: 13.4,
  draw(n) {
    // 꼬마 도깨비: 빨간 몸 + 노란 뿔 하나 + 호랑이 줄무늬 바지 + 작은 방망이
    const x = n.x, y = n.y, t = (typeof game !== "undefined" ? game.time : 0), bob = Math.abs(Math.sin(t * 3)) * 0.03;
    drawBox(x - 0.14, y - 0.1, 0, 0.12, 0.2, 0.2, "#ffd23f"); drawBox(x + 0.02, y - 0.1, 0, 0.12, 0.2, 0.2, "#2a2018");
    drawBox(x - 0.16, y - 0.14, 0.2 + bob, 0.32, 0.28, 0.24, "#e8503a");
    drawBox(x - 0.18, y - 0.16, 0.44 + bob, 0.36, 0.32, 0.3, "#f06a50");
    drawBox(x - 0.1, y + 0.16, 0.56 + bob, 0.06, 0.02, 0.07, "#2a0a0a"); drawBox(x + 0.04, y + 0.16, 0.56 + bob, 0.06, 0.02, 0.07, "#2a0a0a");
    drawBox(x - 0.04, y - 0.04, 0.74 + bob, 0.08, 0.08, 0.14, "#ffe060");
    drawBox(x + 0.2, y - 0.04, 0.2 + bob, 0.06, 0.06, 0.3, "#8a5a2a"); drawBox(x + 0.17, y - 0.07, 0.48 + bob, 0.12, 0.12, 0.12, "#a86a32");
  },
});

if (typeof questFragment === "function") {
  questFragment({ id: "w8_bellShard", world: 8, map: "chainbridge", name: "금 간 종 조각", text: "사슬 다리 밑에서 반짝이는 쇳조각을 찾았어요. 종소리가 희미하게 나요." });
  questFragment({ id: "w8_bell", world: 8, map: "wispmarket", name: "도깨비 방울", text: "시장 구석에 떨어진 작은 방울. 흔들면 큰 종과 같은 소리가 나요." });
  questFragment({ id: "w8_secret", world: 8, map: "coalmine", name: "읽을 수 없는 숯 조각", secret: true });
}
if (typeof questRegister === "function") {
  const Q = (o) => questRegister({ world: 8, giver: "ppuri", main: true, ...o });
  Q({ id: "w8_q1", order: 1, title: "뜨끈한 틈 아래", intro: ["어, 사람이다! 나는 꼬마 도깨비 뿔이야.", "위에서 틈이 열리더니 네가 내려왔구나. 여기는 뜨끈 지옥이야. 무서운 데 아니야, 그냥 뜨끈해!", "그런데 요즘 다들 심술이 났어. 문지기 뿔뚝이부터 달래 줄래?"],
    goal: { type: "boss", map: "hellgate" }, done: ["뿔뚝이가 방망이를 내려놓고 하품했어!", "큰 불씨 종에 금이 간 뒤로 다들 잠을 못 잤대."], reward: { emeralds: 40 } });
  Q({ id: "w8_q2", order: 2, title: "불똥 폭포의 퐁퐁이", requires: ["w8_q1"], intro: ["불똥 폭포에 사는 해파리 퐁퐁이가 불똥을 마구 뿌린대.", "뜨끈 바람길은 화살표 쪽으로 밀어. 옆으로 빠져나와!"],
    goal: { type: "boss", map: "emberfall" }, done: ["퐁퐁이가 다시 폭포에서 둥실둥실 놀아!"], reward: { emeralds: 40 } });
  Q({ id: "w8_q3", order: 3, title: "금 간 종 조각", requires: ["w8_q2"], intro: ["사슬 다리 밑에서 종 조각을 봤다는 도깨비가 있어.", "찾아 주면 종을 고칠 수 있을지도 몰라."],
    goal: { type: "fragment", map: "chainbridge", frag: "w8_bellShard" }, done: ["맞아, 큰 불씨 종 조각이야!", "누가 종을 깨뜨린 걸까? 아니면 저절로 금이 간 걸까?"], reward: { emeralds: 45 } });
  Q({ id: "w8_q4", order: 4, title: "단단한 숯덩이 골렘", requires: ["w8_q3"], intro: ["숯 광산에 숯덩이 골렘이 너무 많아졌어.", "열두 마리만 달래 줘. 굴러오면 빨간 줄 옆으로!"],
    goal: { type: "kill", mon: "w8_coalGolem", n: 12 }, done: ["광산이 조용해졌어. 고마워!"], reward: { emeralds: 50 } });
  Q({ id: "w8_q5", order: 5, title: "도깨비불 시장의 방울", requires: ["w8_q4"], intro: ["도깨비불 시장에 큰 종과 같은 소리가 나는 방울이 있대.", "그 방울이 있으면 종소리를 다시 맞출 수 있어."],
    goal: { type: "fragment", map: "wispmarket", frag: "w8_bell" }, done: ["딸랑! 큰 종 소리랑 똑같아!", "이제 불씨 왕좌로 가면 돼."], reward: { emeralds: 55 } });
  Q({ id: "w8_q6", order: 6, title: "불씨 임금 화르릉", requires: ["w8_q5"], intro: ["불씨 왕좌에 불씨 임금 화르릉이 있어.", "불기둥 구멍에 주황 고리가 차오를 때 화르릉을 그쪽으로 데려가면 비틀거려!", "고리 공격은 화르릉 곁이 안전해."],
    goal: { type: "boss", map: "firethrone" }, done: ["화르릉이 울먹였어. 종이 깨져서 속상했대.", "방울 소리에 맞춰 종을 고쳤더니, 지옥 전체가 뜨끈하고 다정해졌어!"],
    next: ["종소리가 {next} 쪽까지 울려 퍼져. 가 볼래?"],
    nextNone: ["종소리가 아주 멀리까지 울려. 그 끝엔 뭐가 있을까?"],
    reward: { emeralds: 90, title: "불씨 종 지킴이" } });
  questRegister({ id: "w8_side_secret", world: 8, order: 10, title: "숯 조각의 수수께끼", giver: "ppuri", main: false, requires: ["w8_q2"],
    intro: ["숯 광산에 이상한 글자가 새겨진 숯 조각이 있대.", "읽을 수는 없지만 모아 두자."],
    goal: { type: "fragment", map: "coalmine", frag: "w8_secret" }, done: ["역시 못 읽겠어. 그래도 소중히 간직하자."], reward: { emeralds: 25 } });
  questRegister({ id: "w8_side_coop", world: 8, order: 11, title: "온천은 둘이서", giver: "ppuri", main: false, requires: ["w8_q1"],
    intro: ["유황 온천은 친구랑 가야 더 뜨끈해.", "친구랑 같이 가 봐."],
    goal: { type: "coop", map: "sulfurspa" }, done: ["둘이 가니까 더 뜨끈했지?"], reward: { emeralds: 25 } });
}
if (typeof storyBossLines === "function") storyBossLines({
  hellgate: "원래는 지옥 문 앞에서 손님을 반기던 다정한 문지기였어요",
  emberfall: "원래는 불똥 폭포에서 둥실둥실 노래하던 해파리였어요",
  chainbridge: "원래는 사슬 다리를 튼튼하게 엮던 부지런한 거미였어요",
  coalmine: "원래는 숯을 반짝반짝 닦던 광부 두더지였어요",
  sulfurspa: "원래는 온천물을 딱 알맞게 데우던 느긋한 하마였어요",
  wispmarket: "원래는 도깨비불 등불을 나눠 주던 친절한 상인이었어요",
  goatpeak: "원래는 피리로 아침을 알리던 명랑한 염소였어요",
  firethrone: "원래는 큰 불씨 종을 지키던 마음 따뜻한 임금님이었어요. 이제 종을 같이 고쳤어요",
});
