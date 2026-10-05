// ===== 퀘스트 데이터: 월드 1~4 (1부 "조각 모으기") =====
// 이야기: docs/design/story.md · 약속: docs/design/quests.md
// 월드마다: 이야기꾼(questGiver) · 이야기 조각(questFragment) · 퀘스트(questRegister) · 보스 한 줄(storyBossLines)
// 이야기꾼은 모두 캠프의 같은 빈자리(예전 도감 받침대 자리) 근처에 서요. 지금 월드의 이야기꾼만 보여요.

const QG_SPOT = { x: 18.6, y: 8.6 };

// ----- 이야기꾼 그림 -----
function drawGiverOwl(g) {
  const p = g.placed, bob = Math.sin(game.time * 2) * 0.02;
  drawBox(p.x - 0.32, p.y - 0.32, 0, 0.64, 0.64, 0.42, "#7a5530");           // 나무 그루터기
  drawBox(p.x - 0.34, p.y - 0.34, 0.42, 0.68, 0.68, 0.04, "#c49a62");
  drawBox(p.x - 0.2, p.y - 0.16, 0.46 + bob, 0.4, 0.32, 0.42, "#8a6a4a");      // 몸
  drawBox(p.x - 0.14, p.y + 0.12, 0.5 + bob, 0.28, 0.06, 0.3, "#d8c0a0");       // 배
  drawBox(p.x - 0.22, p.y - 0.18, 0.88 + bob, 0.44, 0.36, 0.3, "#9a7a5a");      // 머리
  for (const ox of [-0.13, 0.05]) { drawBox(p.x + ox, p.y + 0.16, 0.98 + bob, 0.1, 0.03, 0.1, "#fff4c0"); drawBox(p.x + ox + 0.03, p.y + 0.18, 1.0 + bob, 0.04, 0.02, 0.05, "#2a1a10"); }
  drawBox(p.x - 0.03, p.y + 0.18, 0.92 + bob, 0.06, 0.04, 0.06, "#e8a030");     // 부리
  for (const ox of [-0.2, 0.12]) drawBox(p.x + ox, p.y - 0.08, 1.18 + bob, 0.08, 0.08, 0.1, "#7a5a3a"); // 귀깃
  drawBox(p.x - 0.18, p.y + 0.16, 1.12 + bob, 0.36, 0.03, 0.03, "#c9a24a");     // 안경테
}
function drawGiverSeahorse(g) {
  const p = g.placed, bob = Math.sin(game.time * 1.6) * 0.05;
  drawBox(p.x - 0.3, p.y - 0.3, 0, 0.6, 0.6, 0.1, "#c8b886");                  // 모래 받침
  drawBox(p.x - 0.12, p.y - 0.1, 0.1 + bob, 0.24, 0.2, 0.3, "#e89a5a");         // 꼬리
  drawBox(p.x - 0.16, p.y - 0.12, 0.4 + bob, 0.32, 0.26, 0.42, "#f0aa6a");      // 몸
  drawBox(p.x - 0.12, p.y + 0.1, 0.45 + bob, 0.24, 0.05, 0.34, "#ffd8a8");      // 배
  drawBox(p.x - 0.15, p.y - 0.1, 0.82 + bob, 0.3, 0.24, 0.26, "#f0aa6a");       // 머리
  drawBox(p.x - 0.05, p.y + 0.12, 0.86 + bob, 0.1, 0.22, 0.08, "#e89a5a");      // 주둥이
  drawBox(p.x - 0.1, p.y + 0.12, 0.96 + bob, 0.06, 0.02, 0.06, "#2a1a10");      // 눈
  drawBox(p.x - 0.18, p.y - 0.14, 1.06 + bob, 0.36, 0.3, 0.06, "#7a6ac0");      // 할머니 모자
  drawBox(p.x - 0.1, p.y - 0.08, 1.12 + bob, 0.2, 0.18, 0.1, "#9a8ae0");
}
function drawGiverRabbit(g) {
  const p = g.placed;
  drawBox(p.x - 0.18, p.y - 0.14, 0, 0.36, 0.28, 0.5, "#f4f4f8");               // 하얀 가운
  drawBox(p.x - 0.19, p.y - 0.15, 0.2, 0.38, 0.3, 0.04, "#9fd0ff");
  drawBox(p.x - 0.2, p.y - 0.16, 0.5, 0.4, 0.32, 0.32, "#e8e4ee");              // 머리
  for (const ox of [-0.14, 0.04]) drawBox(p.x + ox, p.y - 0.04, 0.82, 0.1, 0.08, 0.36 + (ox > 0 ? Math.sin(game.time * 3) * 0.03 : 0), "#e8e4ee"); // 귀
  for (const ox of [-0.13, 0.05]) drawBox(p.x + ox, p.y + 0.16, 0.66, 0.08, 0.02, 0.06, "#c03a5a"); // 빨간 눈
  drawBox(p.x - 0.16, p.y + 0.17, 0.68, 0.32, 0.02, 0.02, "#555");               // 안경
  drawBox(p.x + 0.22, p.y - 0.05, 0.3, 0.06, 0.06, 0.34, "#c9a24a");            // 망원경
}
function drawGiverGoblinGirl(g) {
  const p = g.placed;
  drawBox(p.x - 0.18, p.y - 0.12, 0, 0.36, 0.24, 0.48, "#c0503a");              // 앞치마 옷
  drawBox(p.x - 0.14, p.y + 0.1, 0.12, 0.28, 0.04, 0.32, "#8a5a3a");
  drawBox(p.x - 0.2, p.y - 0.16, 0.48, 0.4, 0.32, 0.32, "#7fc06a");             // 초록 얼굴
  drawBox(p.x - 0.04, p.y - 0.02, 0.8, 0.08, 0.08, 0.14, "#ffe27a");            // 작은 뿔
  for (const ox of [-0.13, 0.05]) drawBox(p.x + ox, p.y + 0.16, 0.64, 0.08, 0.02, 0.07, "#2a1a10");
  drawBox(p.x - 0.22, p.y - 0.1, 0.62, 0.06, 0.2, 0.14, "#ff7aa8");             // 리본
  drawBox(p.x + 0.2, p.y - 0.02, 0.2, 0.1, 0.06, 0.3, "#8a8a92");               // 작은 망치
  drawBox(p.x + 0.16, p.y - 0.04, 0.48, 0.18, 0.1, 0.08, "#5a5a62");
}
questGiver(1, { id: "owl", name: "부엉 할아버지", ...QG_SPOT, draw: drawGiverOwl });
questGiver(2, { id: "seahorse", name: "해마 할머니", ...QG_SPOT, draw: drawGiverSeahorse });
questGiver(3, { id: "toto", name: "토토 박사", ...QG_SPOT, draw: drawGiverRabbit });
questGiver(4, { id: "banjjak", name: "반짝이", ...QG_SPOT, draw: drawGiverGoblinGirl });

// ----- 이야기 조각 -----
questFragment({ id: "f1_star", world: 1, map: "cave", name: "떨어진 회색 별", text: "어느 밤, 하늘에서 회색 별이 숲으로 떨어졌대요." });
questFragment({ id: "f1_secret", world: 1, map: "castle", name: "읽을 수 없는 조각", secret: true });
questFragment({ id: "f2_song", world: 2, map: "kelp", name: "등대의 노래", text: "등대 불빛이 회색이 되자 바다 노래가 멈췄어요." });
questFragment({ id: "f2_secret", world: 2, map: "sunken", name: "읽을 수 없는 조각", secret: true });
questFragment({ id: "f3_pull", world: 3, map: "craterfield", name: "끌어당기는 조각", text: "회색 조각들은 서로를 자석처럼 끌어당겨요." });
questFragment({ id: "f3_secret", world: 3, map: "ufowreck", name: "읽을 수 없는 조각", secret: true });
questFragment({ id: "f4_knock", world: 4, map: "shroomwood", name: "똑똑 소리", text: "땅속 깊은 곳에서 누가 벽을 두드려요. 똑, 똑." });
questFragment({ id: "f4_secret", world: 4, map: "ruins", name: "읽을 수 없는 조각", secret: true });

// ----- 퀘스트 -----
const QN = (world, list) => list.forEach((q, i) => questRegister({ world, order: i + 1, ...q }));

// 월드 1 햇빛 땅: 부엉 할아버지
QN(1, [
  { id: "w1_1", main: true, title: "숲 친구들이 이상해", goal: { type: "pet" },
    intro: ["부엉! 어서 오너라, 꼬마 모험가야.", "요즘 숲 친구들이 이상하게 화가 나 있단다.", "먼저 강아지에게 인사부터 해 볼래?"],
    done: ["강아지가 꼬리를 흔드는구나.", "그런데 회색 별 얘기만 나오면 낑낑댄다지 뭐냐."], reward: { emeralds: 5 } },
  { id: "w1_2", main: true, title: "이끼 동굴 좀비", requires: ["w1_1"], goal: { type: "kill", mon: "zombie", map: "cave", n: 5 },
    intro: ["이끼 동굴의 좀비들이 밤마다 시끄럽단다.", "좀비 다섯 마리만 혼내 주렴."],
    done: ["조용해졌구나! 이제 잠 좀 자겠다, 부엉."], reward: { emeralds: 8 } },
  { id: "w1_3", main: true, title: "회색 별 이야기", requires: ["w1_2"], goal: { type: "fragment", map: "cave", frag: "f1_star" },
    intro: ["옛날이야기가 적힌 조각이 동굴에 떨어졌단다.", "반짝이는 조각을 찾아오렴. 지도에 노란 별이 보일 거야."],
    done: ["회색 별이 숲으로 떨어졌다고?", "그래서 친구들이 이상해졌구나. 흠흠."], reward: { emeralds: 10 } },
  { id: "w1_4", main: true, title: "뭉게뭉게 깨우기", requires: ["w1_3"], goal: { type: "boss", map: "cave" },
    intro: ["동굴 깊은 곳의 뭉게뭉게가 회색 별에 홀렸단다.", "이기면 원래 마음으로 돌아올 거야."],
    done: ["뭉게뭉게가 고맙다고 트로피를 줬구나!", "보스들은 원래 나쁜 애들이 아니었단다."], reward: { emeralds: 15 } },
  { id: "w1_5", main: true, title: "대장장이에게 물어봐", requires: ["w1_4"], goal: { type: "talk", npc: "smith" },
    intro: ["회색 별을 이기려면 튼튼한 무기가 필요하지.", "대장장이에게 가서 무기를 보여 주렴."],
    done: ["좋아, 이제 먼 곳까지 갈 수 있겠구나."], reward: { emeralds: 10 } },
  { id: "w1_6", main: true, title: "공허의 끝", requires: ["w1_5"], goal: { type: "boss", map: "void" },
    intro: ["가장 큰 회색 별은 공허의 끝에 떨어졌단다.", "그림자 마왕이 그걸 꼭 쥐고 있어.", "무섭지만 너라면 할 수 있어!"],
    done: ["해냈구나! 큰 공허 조각이 빠져나왔어.", "그런데 작은 조각들이 바다 쪽으로 날아갔단다."],
    next: ["{next}에 가면 해마 할머니가 도와줄 거야."], nextNone: ["조각들이 어디로 갔는지는 아직 몰라."],
    reward: { emeralds: 30, title: "숲의 친구", furn: "q_owlclock" } },
  { id: "w1_s1", title: "친구랑 같이", requires: ["w1_2"], goal: { type: "coop" },
    intro: ["혼자보다 둘이 더 신나지!", "친구나 아빠랑 같이 던전을 하나 깨 보렴."],
    done: ["같이 하니까 더 든든했지? 부엉!"], reward: { emeralds: 10 } },
  { id: "w1_s2", title: "우리 집 구경", requires: ["w1_1"], goal: { type: "visit", place: "house" },
    intro: ["캠프에 네 집이 있다면서?", "집에 한번 들어가 보렴."],
    done: ["집이 있으니 든든하구나. 트로피도 거기 모인단다."], reward: { emeralds: 5 } },
  { id: "w1_s3", title: "이상한 조각", requires: ["w1_4"], goal: { type: "fragment", map: "castle", frag: "f1_secret" },
    intro: ["어둠의 성에 이상한 조각이 있다는 소문이 있단다.", "나도 못 읽는 글자래. 찾아오렴."],
    done: ["음... 정말 못 읽겠구나.", "언젠가 이 글자를 읽을 날이 오겠지."], reward: { emeralds: 15 } },
]);

// 월드 2 깊은 바다: 해마 할머니
QN(2, [
  { id: "w2_1", main: true, title: "회색 등대", goal: { type: "talk", npc: "map" },
    intro: ["어머, 햇빛 땅에서 온 아이로구나.", "내 등대 불빛이 회색으로 바뀌었단다.", "먼저 바다 지도를 펼쳐 보렴."],
    done: ["바다가 넓지? 친구들이 여기저기 있단다."], reward: { emeralds: 8 } },
  { id: "w2_2", main: true, title: "산호초 청소", requires: ["w2_1"], goal: { type: "kill", mon: "w2_puffer", map: "shallows", n: 5 },
    intro: ["햇살 산호초의 꼬마 복어들이 화가 나 있어.", "다섯 마리만 진정시켜 주렴."],
    done: ["후유, 산호초가 다시 반짝이는구나."], reward: { emeralds: 10 } },
  { id: "w2_3", main: true, title: "멈춘 바다 노래", requires: ["w2_2"], goal: { type: "fragment", map: "kelp", frag: "f2_song" },
    intro: ["다시마 숲에 노래가 적힌 조각이 있대.", "랄랄라... 찾아와 줄래?"],
    done: ["불빛이 회색이 되자 노래가 멈췄구나.", "회색 조각이 바다에도 왔어."], reward: { emeralds: 12 } },
  { id: "w2_4", main: true, title: "가라앉은 배 무덤", requires: ["w2_3"], goal: { type: "clear", map: "wreck" },
    intro: ["가라앉은 배 무덤에 조각이 더 떨어졌단다.", "끝까지 가서 살펴보렴."],
    done: ["씩씩하구나! 배 무덤이 조용해졌어."], reward: { emeralds: 15 } },
  { id: "w2_5", main: true, title: "뿌뿌 달래기", requires: ["w2_4"], goal: { type: "boss", map: "shallows" },
    intro: ["뿌뿌는 원래 노래를 좋아하는 착한 아이란다.", "회색 조각을 빼 주렴."],
    done: ["뿌뿌가 다시 노래하는구나. 고마워라."], reward: { emeralds: 15 } },
  { id: "w2_6", main: true, title: "심해 궁전", requires: ["w2_5"], goal: { type: "boss", map: "abyss" },
    intro: ["가장 깊은 곳, 심해 궁전의 출렁이가 큰 조각을 품었단다.", "조심해서 다녀오렴."],
    done: ["등대 불빛이 다시 노래졌어!", "그런데 조각들이 달빛을 따라 위로 올라갔단다."],
    next: ["{next}의 토토 박사를 찾아가 보렴."], nextNone: ["조각들이 어디로 갔는지는 아직 몰라."],
    reward: { emeralds: 30, title: "바다의 노래", furn: "q_lighthouse" } },
  { id: "w2_s1", title: "에메랄드 모으기", requires: ["w2_1"], goal: { type: "collect", item: "emeralds", n: 40 },
    intro: ["등대 기름을 사려면 에메랄드가 필요하단다.", "에메랄드를 40개 모아 볼래?"],
    done: ["부자가 되었구나! 아껴 쓰렴."], reward: { emeralds: 10 } },
  { id: "w2_s2", title: "잠긴 도시의 글자", requires: ["w2_4"], goal: { type: "fragment", map: "sunken", frag: "f2_secret" },
    intro: ["잠긴 도시 벽에 아무도 못 읽는 조각이 있대.", "가져와 줄래?"],
    done: ["이 글자... 햇빛 땅의 조각과 비슷하구나."], reward: { emeralds: 15 } },
  { id: "w2_s3", title: "바다 친구와 함께", requires: ["w2_2"], goal: { type: "coop" },
    intro: ["바다는 넓으니 친구랑 같이 다니렴.", "같이 던전 하나를 깨 보자."],
    done: ["둘이 함께라 바다도 안 무섭지?"], reward: { emeralds: 10 } },
]);

// 월드 3 달: 토토 박사
QN(3, [
  { id: "w3_1", main: true, title: "하늘의 금", goal: { type: "talk", npc: "board" },
    intro: ["안녕안녕! 나는 토토 박사야!", "망원경으로 하늘에 금이 간 걸 봤어!", "기록판을 보면서 지금까지 여행을 정리해 볼래?"],
    done: ["좋아좋아, 꼼꼼한 모험가구나!"], reward: { emeralds: 8 } },
  { id: "w3_2", main: true, title: "먼지 공 실험", requires: ["w3_1"], goal: { type: "kill", mon: "w3_dustBall", n: 6 },
    intro: ["먼지 공 속에 회색 가루가 섞였어!", "먼지 공 여섯 개만 터뜨려 줘. 실험해야 해!"],
    done: ["역시! 회색 가루는 조각 부스러기였어."], reward: { emeralds: 10 } },
  { id: "w3_3", main: true, title: "끌어당기는 조각", requires: ["w3_2"], goal: { type: "fragment", map: "craterfield", frag: "f3_pull" },
    intro: ["크레이터 들판에 큰 조각이 박혀 있대!", "빨리빨리, 가져와 줘!"],
    done: ["조각끼리 서로 끌어당긴다니!", "조각을 다 모으면 무슨 일이 생길까?"], reward: { emeralds: 12 } },
  { id: "w3_4", main: true, title: "떡방아 마을 돕기", requires: ["w3_3"], goal: { type: "clear", map: "rabbitvale" },
    intro: ["달토끼 떡방아 마을이 난리래!", "끝까지 가서 도와줘!"],
    done: ["마을 토끼들이 떡을 보내 왔어. 냠냠!"], reward: { emeralds: 15 } },
  { id: "w3_5", main: true, title: "삐뽀 고치기", requires: ["w3_4"], goal: { type: "boss", map: "moonbase" },
    intro: ["삐뽀는 원래 기지를 청소하던 로봇이야.", "회색 조각 때문에 고장 났어. 고쳐 줘!"],
    done: ["삐뽀가 다시 청소를 해! 삐뽀삐뽀!"], reward: { emeralds: 15 } },
  { id: "w3_6", main: true, title: "달의 궁전", requires: ["w3_5"], goal: { type: "boss", map: "mooncastle" },
    intro: ["달의 궁전 은하가 제일 큰 조각을 가졌어!", "조각 지도가 거기를 가리키고 있어."],
    done: ["대단해! 조각 지도가 이번엔 땅속을 가리켜!"],
    next: ["{next}의 반짝이에게 가 봐!"], nextNone: ["땅속에 뭐가 있는지는 아직 몰라!"],
    reward: { emeralds: 30, title: "달의 박사", furn: "q_telescope" } },
  { id: "w3_s1", title: "물약 챙기기", requires: ["w3_1"], goal: { type: "collect", item: "potion", n: 3 },
    intro: ["달은 위험하니까 물약을 챙겨!", "물약을 세 개 가지고 와 봐."],
    done: ["준비성 최고! 안전 제일!"], reward: { emeralds: 8 } },
  { id: "w3_s2", title: "우주선의 글자", requires: ["w3_4"], goal: { type: "fragment", map: "ufowreck", frag: "f3_secret" },
    intro: ["부서진 우주선에서 이상한 조각을 봤어!", "글자가 외계어 같아. 가져와 줘!"],
    done: ["외계어도 아니야... 이건 대체 뭘까?"], reward: { emeralds: 15 } },
  { id: "w3_s3", title: "먼지 바다 청소", requires: ["w3_2"], goal: { type: "kill", mon: null, map: "dustsea", n: 15 },
    intro: ["고요한 먼지 바다가 너무 시끄러워!", "몬스터 열다섯 마리를 혼내 줘!"],
    done: ["이제 고요해졌어. 이름값을 하네!"], reward: { emeralds: 12 } },
]);

// 월드 4 지하세계: 반짝이
QN(4, [
  { id: "w4_1", main: true, title: "똑똑 소리", goal: { type: "talk", npc: "shop" },
    intro: ["안녕! 나는 대장장이 딸 반짝이야!", "요즘 땅속에서 똑똑 소리가 나.", "먼저 가게에서 필요한 걸 사 둬!"],
    done: ["좋아, 준비 끝! 가자가자!"], reward: { emeralds: 8 } },
  { id: "w4_2", main: true, title: "반딧불 동굴 탐험", requires: ["w4_1"], goal: { type: "kill", mon: "w4_glowbug", map: "glowcave", n: 5 },
    intro: ["반딧불 벌레들이 회색 빛을 내고 있어!", "다섯 마리만 혼내 줘!"],
    done: ["동굴이 다시 노랗게 반짝여!"], reward: { emeralds: 10 } },
  { id: "w4_3", main: true, title: "두드리는 소리", requires: ["w4_2"], goal: { type: "fragment", map: "shroomwood", frag: "f4_knock" },
    intro: ["통통 버섯 숲에서 소리가 적힌 조각을 봤대!", "찾아오면 내가 망치로 두드려 볼게!"],
    done: ["누가 벽을 두드린다고? 으스스해!", "그래도 우리가 같이 있으니 괜찮아!"], reward: { emeralds: 12 } },
  { id: "w4_4", main: true, title: "버섯 숲 끝까지", requires: ["w4_3"], goal: { type: "clear", map: "shroomwood" },
    intro: ["버섯 숲 끝에 조각이 더 있을지 몰라.", "끝까지 통통 뛰어가 봐!"],
    done: ["역시! 너 진짜 날쌔다!"], reward: { emeralds: 15 } },
  { id: "w4_5", main: true, title: "뒤적이 진정시키기", requires: ["w4_4"], goal: { type: "boss", map: "glowcave" },
    intro: ["뒤적이는 원래 땅굴을 파 주던 착한 두더지야.", "회색 조각 때문에 화가 났어. 도와줘!"],
    done: ["뒤적이가 다시 땅굴을 파 줘! 고마워!"], reward: { emeralds: 15 } },
  { id: "w4_6", main: true, title: "지하 왕궁", requires: ["w4_5"], goal: { type: "boss", map: "underthrone" },
    intro: ["모든 조각이 지하 왕궁으로 모이고 있어!", "부글대왕을 이기면 무슨 일이 생길 거야."],
    done: ["와! 조각이 전부 모였어!", "조각들이 빛나면서 커다란 문이 열렸어!"],
    next: ["문 너머는 {next}야. 같이 가 보자!"], nextNone: ["문 너머가 어딘지는 아직 아무도 몰라."],
    reward: { emeralds: 30, title: "땅속 영웅", furn: "q_lantern" } },
  { id: "w4_s1", title: "같이 반딧불 보기", requires: ["w4_2"], goal: { type: "coop", map: "glowcave" },
    intro: ["반딧불 동굴은 친구랑 보면 더 예뻐!", "같이 끝까지 가 봐!"],
    done: ["반짝반짝, 진짜 예뻤지?"], reward: { emeralds: 12 } },
  { id: "w4_s2", title: "유적의 글자", requires: ["w4_4"], goal: { type: "fragment", map: "ruins", frag: "f4_secret" },
    intro: ["잠든 옛 유적에 못 읽는 조각이 있대!", "아빠도 못 읽었대. 찾아와 줘!"],
    done: ["다른 월드 조각이랑 글자가 똑같아!", "다 모으면 읽을 수 있을까?"], reward: { emeralds: 15 } },
  { id: "w4_s3", title: "새 옷 입기", requires: ["w4_1"], goal: { type: "talk", npc: "wardrobe" },
    intro: ["모험가는 멋도 부려야지!", "옷장에서 옷을 골라 봐!"],
    done: ["우와, 멋있다!"], reward: { emeralds: 5 } },
]);

// ----- 보스 한 줄 (트로피 룸 현판: "원래는 ○○였어요") -----
storyBossLines({
  cave: "원래는 동굴 버섯을 키우던 정원사였어요", crypt: "원래는 무덤을 지키던 성실한 경비병이었어요", jungle: "원래는 정글 아이들과 놀던 말랑 친구였어요",
  desert: "원래는 신전 보물을 닦던 일꾼이었어요", ice: "원래는 눈꽃을 만들던 겨울 요정이었어요", swamp: "원래는 늪에 실로 다리를 놓던 거미였어요",
  volcano: "원래는 화산 마을을 따뜻하게 하던 용이었어요", castle: "원래는 성에서 춤추기를 좋아하던 왕이었어요", mine: "원래는 광부들을 지켜 주던 수정 친구였어요",
  sky: "원래는 구름을 몰고 다니던 바람 목동이었어요", coral: "원래는 배를 밀어 주던 바다 도우미였어요", void: "원래는 세상 끝 장막을 지키던 문지기였어요",
  shallows: "원래는 산호초에서 노래하던 꼬마 가수였어요", kelp: "원래는 다시마 숲을 밝히던 등불 물고기였어요", wreck: "원래는 배 무덤을 청소하던 거품 친구였어요",
  icefloe: "원래는 얼음 바다의 길을 내던 썰매꾼이었어요", songreef: "원래는 산호밭 합창단 지휘자였어요", trench: "원래는 깜깜한 바다의 길잡이였어요",
  sharkreef: "원래는 꼬마 상어들의 수영 선생님이었어요", vents: "원래는 뜨거운 물에 달걀을 삶던 요리사였어요", sunken: "원래는 잠긴 도시의 그림쟁이였어요",
  abyss: "원래는 심해 궁전의 다정한 임금님이었어요",
  moonbase: "원래는 달 기지를 청소하던 로봇이었어요", dustsea: "원래는 먼지 바다에서 모래성을 쌓던 친구였어요", craterfield: "원래는 크레이터에서 데굴데굴 놀던 돌이었어요",
  rabbitvale: "원래는 떡방아를 찧던 부지런한 토끼였어요", crystalcave: "원래는 수정 동굴의 거미 보석공이었어요", meteorhill: "원래는 별똥별을 받아 주던 수문장이었어요",
  ufowreck: "원래는 우주선을 고치던 꼬마 기술자였어요", darkside: "원래는 달 뒷면에서 별을 세던 늑대였어요", cheesevale: "원래는 치즈 바위를 지키던 쥐 대장이었어요",
  starmine: "원래는 별가루를 캐던 광차 친구였어요", lunarlab: "원래는 연구소 조수 로봇이었어요", eclipse: "원래는 해와 달을 번갈아 띄우던 남매였어요",
  earthview: "원래는 지구를 바라보며 노래하던 곰이었어요", mooncastle: "원래는 달의 궁전 은하수 공주였어요",
  glowcave: "원래는 땅굴을 파 주던 착한 두더지였어요", shroomwood: "원래는 버섯 숲의 폭신한 침대였어요", cartmine: "원래는 광차를 몰던 씩씩한 기관사였어요",
  dripcave: "원래는 종유석에 물을 주던 정원사였어요", undriver: "원래는 지하 강의 뱃사공이었어요", crystalhall: "원래는 수정 궁전의 문지기 돌이었어요",
  lavaflow: "원래는 용암 강에서 고구마를 굽던 요리사였어요", crumble: "원래는 다리를 고치던 튼튼한 일꾼이었어요", ruins: "원래는 옛 유적을 지키던 조용한 석상이었어요",
  forge: "원래는 땅속 대장간의 망치 장인이었어요", goblintown: "원래는 도깨비 장터의 인기 장사꾼이었어요", underthrone: "원래는 지하세계를 돌보던 너그러운 왕이었어요",
});
