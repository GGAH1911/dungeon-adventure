// ===== 월드 8 "뜨끈 지옥" 보스 5~8 (공통 규칙·등록은 bosses_w8.js) =====
//  5 sulfurspa  온천 하마 뜨끈이       : 김 뿜기(느림) · 소용돌이(끌어당김) → 뜨끈 물대포(따라오는 줄) → 온천 파도(고리, 곁 안전)
//  6 wispmarket 도깨비불 상인 깜빡이   : 도깨비불 부채 · 깜빡 이동 → 불씨 꼬마 부르기 → 등불 비
//  7 goatpeak   불꽃 피리 염소 메에롱 : 피리 빛줄기 · 뿔 박치기(돌진) → 박자 불꽃(여러 원) → 메에 고리
//  8 firethrone 불씨 임금 화르릉       : 불씨 비 · 왕 불꽃 줄 → 불씨 꼬마 + 불꽃 고리 → 따라오는 왕 불꽃 + 광폭화
//    화르릉을 이기면 "큰 불씨 종을 같이 고쳤어요" (다음 월드가 있으면 그 이름을 말해요. 마지막 월드라고 가정하지 않아요)

Object.assign(ABILITIES, {
  // 5 뜨끈이
  w8b_steamBurst: { name: "뜨끈 김 뿜기", desc: "뜨끈이가 숨을 크게 들이쉬었다가 둘레로 김을 뿜어요. 맞으면 느려요.", counter: "둘레 원 밖으로 물러나요",
    tags: ["boss", "circle"], telegraph: { shape: "self", radius: 3.0, at: "self", time: 1.1 }, cooldown: 7, range: [0, 3.2], damageMul: 1.4, anim: "roar",
    effect: { type: "slow", duration: 2.0 } },
  w8b_whirl: { name: "온천 소용돌이", desc: "뜨끈이가 꼬리로 물을 휘저어 둘레를 끌어당겨요.", counter: "원 밖으로 미리 걸어 나가요",
    tags: ["boss", "pull"], telegraph: { shape: "circle", radius: 6, at: "self", time: 1.2 }, cooldown: 11, range: [0, 6], damageMul: 0, anim: "raise",
    effect: { type: "pull", force: 2.8 } },
  w8b_waterCannon: { name: "뜨끈 물대포", desc: "뜨끈이 입에서 뜨거운 물이 한 줄로 쭉! 조준선이 따라와요.", counter: "조준선이 멈추면 옆으로 한 걸음",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 11, width: 1.4, at: "self", time: 1.3, follow: true }, cooldown: 8, range: [2.8, 11], damageMul: 1.6, anim: "point",
    effect: { type: "damage" } },
  w8b_spaWave: { name: "온천 파도", desc: "뜨끈이 둘레로 뜨끈한 물결 고리가 퍼져요. 뜨끈이 곁은 안전해요.", counter: "고리 안쪽, 뜨끈이 곁으로!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 7, inner: 2.4, at: "self", time: 1.3 }, cooldown: 11, range: [0, 7], damageMul: 1.5, anim: "roar",
    effect: { type: "knockback", force: 1.1 } },
  // 6 깜빡이
  w8b_wispVolley: { name: "도깨비불 부채", desc: "깜빡이가 등불을 흔들어 파란 도깨비불 다섯을 부채처럼 쏴요.", counter: "옆으로 돌거나 불 사이로",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 8, angle: 1.0, at: "self", time: 0.9, harmlessPreview: true }, cooldown: 5, range: [0, 10], damageMul: 1.0, anim: "point",
    effect: { type: "volley", count: 5, spread: 1.0, speed: 6.5, color: "#6ab0ff" } },
  w8b_blink: { name: "깜빡 이동", desc: "깜빡이가 등불을 끄고 깜빡! 빨간 원 자리에 나타나요.", counter: "빨간 원 밖으로! 나타난 뒤 때려요",
    tags: ["boss", "move"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 1.1 }, cooldown: 8, range: [3, 12], damageMul: 1.4, anim: "raise",
    effect: { type: "teleport" } },
  w8b_wispCall: { name: "불씨 꼬마 부르기", desc: "깜빡이가 등불에서 불씨 꼬마 셋을 꺼내요.", counter: "꼬마부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w8_minion", count: 3 }, when: { maxSummons: 5 } },
  w8b_lanternRain: { name: "등불 비", desc: "작은 등불들이 여러 군데 톡톡 떨어져요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 0.95, at: "target", time: 1.2 }, cooldown: 8, range: [0, 14], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 7, spread: 4.0, stagger: 0.16 } },
  // 7 메에롱
  w8b_fluteBeam: { name: "피리 빛줄기", desc: "메에롱이 불꽃 피리를 불어 앞으로 빛줄기를 쭉 쏴요.", counter: "빛 길 옆으로 한 걸음!",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.3, at: "self", time: 1.1 }, cooldown: 6, range: [2.8, 12], damageMul: 1.5, anim: "point",
    effect: { type: "damage" } },
  w8b_ram: { name: "뿔 박치기", desc: "메에롱이 발을 구르다가 빨간 줄을 따라 들이받아요. 벽에 부딪히면 멍해요.", counter: "빨간 줄 옆으로! 멍할 때 때려요",
    tags: ["boss", "line", "move"], telegraph: { shape: "line", length: 9, width: 1.5, at: "self", time: 1.0 }, cooldown: 8, range: [2, 9], damageMul: 1.6, anim: "crouch",
    effect: { type: "charge", speed: 10, stunOnWall: 2.2 } },
  w8b_beatFire: { name: "박자 불꽃", desc: "피리 박자에 맞춰 불꽃이 여기저기 퐁퐁 솟아요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.0 }, cooldown: 8, range: [0, 14], damageMul: 1.3, anim: "raise",
    effect: { type: "rain", count: 8, spread: 4.5, stagger: 0.25 } },
  w8b_baaRing: { name: "메에 고리", desc: "메에롱이 크게 메에~ 하고 울면 둘레로 소리 고리가 퍼져요. 메에롱 곁은 안전해요.", counter: "고리 안쪽, 메에롱 곁으로!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 6.5, inner: 2.3, at: "self", time: 1.3 }, cooldown: 11, range: [0, 7], damageMul: 1.5, anim: "roar",
    effect: { type: "knockback", force: 1.1 } },
  // 8 화르릉
  w8b_kingRain: { name: "불씨 비", desc: "화르릉이 손을 번쩍 들면 불씨가 여러 군데 떨어져요.", counter: "원들 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.2 }, cooldown: 8, range: [0, 14], damageMul: 1.35, anim: "raise",
    effect: { type: "rain", count: 7, spread: 4.0, stagger: 0.18 } },
  w8b_kingFlame: { name: "왕 불꽃", desc: "화르릉이 홀을 앞으로 내밀어 커다란 불꽃을 한 줄로 쏴요.", counter: "빨간 길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.7, at: "self", time: 1.2 }, cooldown: 7, range: [2.8, 12], damageMul: 1.6, anim: "point",
    effect: { type: "damage" } },
  w8b_kingCall: { name: "불씨 신하 부르기", desc: "화르릉이 불씨 꼬마 둘을 불러요.", counter: "꼬마부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.3, at: "self", time: 1.0 }, cooldown: 18, range: [0, 40], damageMul: 0, anim: "raise",
    effect: { type: "summon", monster: "w8_minion", count: 2 }, when: { maxSummons: 3 } },
  w8b_kingRing: { name: "불꽃 고리", desc: "화르릉 둘레로 불꽃 고리가 퍼져요. 화르릉 곁은 안전해요.", counter: "고리 안쪽, 화르릉 곁으로!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 7.5, inner: 2.6, at: "self", time: 1.4 }, cooldown: 11, range: [0, 8], damageMul: 1.6, anim: "roar",
    effect: { type: "knockback", force: 1.2 } },
  w8b_kingBeam: { name: "따라오는 왕 불꽃", desc: "화르릉 눈에서 불꽃 줄기가 나가요. 조준선이 따라오다 멈춰요.", counter: "조준선이 멈추면 옆으로 한 걸음!",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 13, width: 1.4, at: "self", time: 1.3, follow: true }, cooldown: 8, range: [2.8, 13], damageMul: 1.7, anim: "point",
    effect: { type: "damage" } },
  w8b_kingRage: { name: "왕의 화", desc: "체력이 적어지면 화르릉 불꽃이 더 커지고 빨라져요.", counter: "무리하지 말고 피하면서 마무리",
    tags: ["boss", "buff"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.0 }, cooldown: 999, range: [0, 99], damageMul: 0, anim: "roar",
    when: { hpBelow: 0.2, once: true }, weight: 50, effect: { type: "enrage", speed: 1.25, damage: 1.2 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w8b_steamBurst: { text: "김! 원 밖으로" }, w8b_whirl: { text: "원 밖으로 미리!" }, w8b_waterCannon: { text: "물대포! 옆으로" }, w8b_spaWave: { text: "고리 안쪽, 곁으로!", do: true },
  w8b_wispVolley: { text: "도깨비불 사이로" }, w8b_blink: { text: "원 밖으로! 나타나요" }, w8b_wispCall: { text: "꼬마부터 정리해요" }, w8b_lanternRain: { text: "원 사이 빈 곳으로" },
  w8b_fluteBeam: { text: "빛 길 옆으로" }, w8b_ram: { text: "박치기! 줄 옆으로" }, w8b_beatFire: { text: "원 사이 빈 곳으로" }, w8b_baaRing: { text: "고리 안쪽, 곁으로!", do: true },
  w8b_kingRain: { text: "원 사이 빈 곳으로" }, w8b_kingFlame: { text: "길 옆으로 비켜요" }, w8b_kingCall: { text: "꼬마부터 정리해요" }, w8b_kingRing: { text: "고리 안쪽, 곁으로!", do: true },
  w8b_kingBeam: { text: "멈추면 옆으로!" }, w8b_kingRage: { text: "화났어요! 피하면서 마무리" },
});

w8DefineBoss({
  mapId: "sulfurspa", type: "w8_hippoBoss", name: "온천 하마 뜨끈이", title: "유황 온천", hp: 620, damage: 3.8, size: 3.2, speed: 1.2,
  phases: [
    { until: 0.66, abilities: ["w8b_steamBurst", "w8b_whirl"] },
    { until: 0.33, abilities: ["w8b_steamBurst", "w8b_whirl", "w8b_waterCannon"] },
    { abilities: ["w8b_steamBurst", "w8b_waterCannon", "w8b_spaWave", "w8b_whirl"] },
  ],
  mat: { id: "w8_spaStone", name: "온천 조약돌", color: "#e8d060" },
  legend: { id: "L_w8_sulfurspa", slot: "charm", name: "뜨끈 온천 팔찌", icon: "bracelet", color: "#e8d060", perk: { regen: 14, hearts: 3 }, desc: "따끈한 온천 팔찌: 하트 +3, 하트가 빨리 차요" },
  phaseMsg: ["뜨끈 물대포! 조준선이 멈추면 옆으로!", "온천 파도! 뜨끈이 곁으로!"],
  draw(m) {
    const P = b2Pose(m), open = P.cast * 0.15, k = (game.time * 0.7) % 1;
    b2DrawBody(m, [
      { f: 0.25, s: 0.3, z: 0, w: 0.26, d: 0.26, h: 0.3, c: "#8a6a9a" }, { f: 0.25, s: -0.3, z: 0, w: 0.26, d: 0.26, h: 0.3, c: "#8a6a9a" },
      { f: -0.25, s: 0.3, z: 0, w: 0.26, d: 0.26, h: 0.3, c: "#8a6a9a" }, { f: -0.25, s: -0.3, z: 0, w: 0.26, d: 0.26, h: 0.3, c: "#8a6a9a" },
      { f: -0.08, s: 0, z: 0.26, w: 1.1, d: 0.9, h: 0.6 + P.breath, c: "#a888b8" },
      { f: 0.5, s: 0, z: 0.4, w: 0.55, d: 0.75, h: 0.5 + open, c: "#b898c8", face: true, eye: "#ffffff", pupil: "#2a1a3a", blush: "#ffb0c8" },
      { f: 0.78, s: 0, z: 0.38, w: 0.1, d: 0.6, h: 0.1 + open, c: "#ffd0e0" },                               // 큰 입
      { f: 0.42, s: 0.24, z: 0.92, w: 0.12, d: 0.12, h: 0.12, c: "#a888b8" }, { f: 0.42, s: -0.24, z: 0.92, w: 0.12, d: 0.12, h: 0.12, c: "#a888b8" }, // 귀
      { f: -0.08, s: 0, z: 0.88 + P.breath, w: 0.42, d: 0.42, h: 0.08, c: "#f8f8f8" },                         // 머리 수건
      { f: -0.08, s: 0, z: 1.0 + k * 0.6, w: 0.18, d: 0.18, h: 0.14, c: "#f4f4f4" },             // 김
    ], { top: 1.6 });
  },
});
w8DefineBoss({
  mapId: "wispmarket", type: "w8_merchantBoss", name: "도깨비불 상인 깜빡이", title: "도깨비불 시장", hp: 635, damage: 3.8, size: 2.9, speed: 1.5,
  phases: [
    { until: 0.66, abilities: ["w8b_wispVolley", "w8b_blink"] },
    { until: 0.33, abilities: ["w8b_wispVolley", "w8b_blink", "w8b_wispCall"] },
    { abilities: ["w8b_wispVolley", "w8b_blink", "w8b_wispCall", "w8b_lanternRain"] },
  ],
  mat: { id: "w8_wispWick", name: "도깨비불 심지", color: "#6ab0ff" },
  legend: { id: "L_w8_wispmarket", slot: "weapon", name: "깜빡 등불 단검", effect: "burn", mul: 1.09, color: "#6ab0ff", forms: { w: "깜빡 등불 단검", m: "깜빡 등불 지팡이", d: "깜빡 등불 지팡이", h: "깜빡 등불 단검" }, desc: "도깨비불이 붙어요: 맞으면 불이 붙어요 (공격력 +9%)" },
  phaseMsg: ["불씨 꼬마 셋! 꼬마부터!", "등불이 비처럼 떨어져요! 원 사이로!"],
  draw(m) {
    const P = b2Pose(m), t = game.time, sw = Math.sin(t * 3) * 0.08, lift = P.cast * 0.3;
    b2DrawBody(m, [
      { f: 0, s: 0, z: 0, w: 0.75, d: 0.8, h: 0.75 + P.breath, c: "#5a3a7a" },                                        // 큰 도포
      { f: 0, s: 0, z: 0.7, w: 0.85, d: 0.9, h: 0.06, c: "#ffd060" },                                                   // 허리띠
      { f: 0.05, s: 0, z: 0.78 + P.breath, w: 0.66, d: 0.7, h: 0.6, c: "#e8806a", face: true, eye: "#ffffff", pupil: "#1a1030", blush: "#ffb0a0" },
      { f: 0.05, s: 0, z: 1.38 + P.breath, w: 0.95, d: 1.0, h: 0.08, c: "#2a2a3a" }, { f: 0.05, s: 0, z: 1.46 + P.breath, w: 0.5, d: 0.5, h: 0.3, c: "#2a2a3a" }, // 갓
      { f: 0.05, s: 0, z: 1.76 + P.breath, w: 0.1, d: 0.1, h: 0.14, c: "#ffe060" },                                    // 뿔이 갓 위로 쏙
      { f: 0.3, s: 0.55, z: 0.5 + lift, w: 0.06, d: 0.06, h: 0.5, c: "#8a5a2a" },                                       // 등불 막대
      { f: 0.3, s: 0.55 + sw, z: 0.3 + lift, w: 0.28, d: 0.28, h: 0.3, c: "#6ab0ff" }, { f: 0.3, s: 0.55 + sw, z: 0.38 + lift, w: 0.14, d: 0.14, h: 0.14, c: "#e0f4ff" },
      { f: -0.3, s: -0.45, z: 0.2, w: 0.4, d: 0.3, h: 0.4, c: "#a87a4a" },                                              // 등짐
    ], { top: 2.0 });
  },
});
w8DefineBoss({
  mapId: "goatpeak", type: "w8_goatBoss", name: "불꽃 피리 염소 메에롱", title: "불꽃 염소 봉우리", hp: 660, damage: 3.9, size: 3.0, speed: 1.45,
  phases: [
    { until: 0.66, abilities: ["w8b_fluteBeam", "w8b_ram"] },
    { until: 0.33, abilities: ["w8b_fluteBeam", "w8b_ram", "w8b_beatFire"] },
    { abilities: ["w8b_fluteBeam", "w8b_ram", "w8b_beatFire", "w8b_baaRing"] },
  ],
  mat: { id: "w8_fluteReed", name: "불꽃 피리", color: "#ff6a4a" },
  legend: { id: "L_w8_goatpeak", slot: "weapon", name: "메에롱 불꽃 창", effect: "burn", mul: 1.1, color: "#ff6a4a", forms: { w: "메에롱 불꽃 창", m: "메에롱 피리 지팡이", d: "메에롱 피리 지팡이", h: "메에롱 불꽃 단검" }, desc: "뿔처럼 찌르는 창: 맞으면 불이 붙어요 (공격력 +10%)" },
  phaseMsg: ["박자 불꽃! 원 사이로!", "메에~ 고리! 메에롱 곁으로!"],
  draw(m) {
    const P = b2Pose(m), dip = P.cast * 0.15, step = m.moving ? Math.sin(game.time * 9) * 0.06 : 0;
    b2DrawBody(m, [
      { f: 0.3, s: 0.24, z: step, w: 0.18, d: 0.18, h: 0.45, c: "#5a4a40" }, { f: 0.3, s: -0.24, z: -step, w: 0.18, d: 0.18, h: 0.45, c: "#5a4a40" },
      { f: -0.3, s: 0.24, z: -step, w: 0.18, d: 0.18, h: 0.45, c: "#5a4a40" }, { f: -0.3, s: -0.24, z: step, w: 0.18, d: 0.18, h: 0.45, c: "#5a4a40" },
      { f: 0, s: 0, z: 0.42, w: 1.0, d: 0.66, h: 0.5 + P.breath, c: "#d8d0cc" },                                       // 복슬 몸
      { f: 0.55, s: 0, z: 0.72 - dip, w: 0.45, d: 0.48, h: 0.48, c: "#ece6e2", face: true, eye: "#ffffff", pupil: "#3a1a10", blush: "#ffb0a0" },
      { f: 0.48, s: 0.24, z: 1.18 - dip, w: 0.16, d: 0.12, h: 0.3, c: "#e83a2a" }, { f: 0.48, s: -0.24, z: 1.18 - dip, w: 0.16, d: 0.12, h: 0.3, c: "#e83a2a" }, // 빨간 뿔
      { f: 0.36, s: 0.24, z: 1.4 - dip, w: 0.2, d: 0.1, h: 0.1, c: "#ffb030" }, { f: 0.36, s: -0.24, z: 1.4 - dip, w: 0.2, d: 0.1, h: 0.1, c: "#ffb030" },
      { f: 0.8, s: 0, z: 0.6 - dip, w: 0.1, d: 0.12, h: 0.16, c: "#ffffff" },                                            // 수염
      { f: 0.85, s: 0.1, z: 0.8 - dip, w: 0.4, d: 0.08, h: 0.08, c: "#c8803a" }, { f: 1.05, s: 0.1, z: 0.8 - dip, w: 0.08, d: 0.1, h: 0.1, c: "#ffd060" }, // 불꽃 피리
    ], { top: 1.8 });
  },
});
w8DefineBoss({
  mapId: "firethrone", type: "w8_kingBoss", name: "불씨 임금 화르릉", title: "불씨 왕좌", hp: 600, damage: 4.0, size: 3.4, speed: 1.35, arena: 28,
  phases: [
    { until: 0.66, abilities: ["w8b_kingRain", "w8b_kingFlame"] },
    { until: 0.33, abilities: ["w8b_kingRain", "w8b_kingFlame", "w8b_kingCall", "w8b_kingRing"] },
    { abilities: ["w8b_kingRain", "w8b_kingBeam", "w8b_kingRing", "w8b_kingCall", "w8b_kingRage"] },
  ],
  mat: { id: "w8_bellShard", name: "큰 불씨 종 조각", color: "#ffb030" },
  legend: { id: "L_w8_firethrone", slot: "weapon", name: "화르릉 불씨 검", effect: "burn", mul: 1.12, color: "#ffb030", forms: { w: "화르릉 불씨 검", m: "화르릉 불씨 홀", d: "화르릉 불씨 홀", h: "화르릉 불씨 단검" }, desc: "불씨 임금의 검: 맞으면 불이 붙어요 (공격력 +12%)" },
  phaseMsg: ["불씨 신하와 불꽃 고리! 화르릉 곁이 안전해요!", "따라오는 왕 불꽃! 조준선이 멈추면 옆으로!"],
  draw(m) {
    const P = b2Pose(m), t = game.time, fl = (k) => ["#ff5a2a", "#ff8a2a", "#ffb030", "#ffe060"][Math.floor(t * 6 + k) % 4], raise = P.cast * 0.35;
    const parts = [
      { f: 0, s: 0.26, z: 0, w: 0.3, d: 0.3, h: 0.35, c: "#5a1a1a" }, { f: 0, s: -0.26, z: 0, w: 0.3, d: 0.3, h: 0.35, c: "#5a1a1a" },
      { f: -0.05, s: 0, z: 0.32, w: 0.85, d: 0.95, h: 0.62 + P.breath, c: "#c83a2a" },                                   // 왕 옷
      { f: -0.3, s: 0, z: 0.3, w: 0.1, d: 1.1, h: 0.75, c: "#8a1a2a" },                                                  // 망토
      { f: 0.05, s: 0, z: 0.94 + P.breath, w: 0.78, d: 0.82, h: 0.66, c: "#ffb080", face: true, eye: "#ffffff", pupil: "#3a0a00", blush: "#ff8a6a" },
      { f: 0.05, s: 0, z: 1.6 + P.breath, w: 0.7, d: 0.74, h: 0.14, c: "#ffd23f" },                                      // 왕관
      { f: 0.05, s: 0.26, z: 1.74 + P.breath, w: 0.12, d: 0.12, h: 0.16, c: "#ffd23f" }, { f: 0.05, s: -0.26, z: 1.74 + P.breath, w: 0.12, d: 0.12, h: 0.16, c: "#ffd23f" },
      { f: 0.05, s: 0, z: 1.74 + P.breath, w: 0.12, d: 0.12, h: 0.22, c: "#ff4a4a" },
      { f: 0.2, s: 0.56, z: 0.5 + raise, w: 0.08, d: 0.08, h: 0.9, c: "#8a5a2a" }, { f: 0.2, s: 0.56, z: 1.4 + raise, w: 0.22, d: 0.22, h: 0.22, c: fl(0) }, // 홀
    ];
    for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; parts.push({ f: -0.25 + Math.cos(a) * 0.05, s: Math.sin(a) * 0.45, z: 1.3 + P.breath + Math.sin(t * 5 + i) * 0.04, w: 0.16, d: 0.16, h: 0.3, c: fl(i) }); } // 불꽃 갈기
    b2DrawBody(m, parts, { top: 2.2 });
  },
});
// 화르릉을 이기면: 큰 불씨 종을 같이 고쳐요 (다음 월드가 있으면 그 이름을 말해요)
hookOn("monsterKilled", (m) => {
  if (!m || m.type !== "w8_kingBoss" || m.trophy) return;
  for (let i = 0; i < 30; i++) addSparkle(m.x, m.y, 1.4, { vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vz: 3, gravity: 3, life: 1.2, size: 0.7, hue: 20 + Math.random() * 40 });
  const at = WORLD_ORDER.indexOf(8), next = at >= 0 ? WORLD_ORDER[at + 1] : null;
  showMessage(next && WORLDS[next] ? `화르릉: "고마워! 큰 불씨 종을 같이 고쳤어. 종소리가 ${WORLDS[next].name}까지 울려!"` : "화르릉: \"고마워! 큰 불씨 종을 같이 고쳤어. 이제 지옥도 뜨끈하고 다정해!\"", 5, true);
  hookRun("w8KingCalm", m);
});
// 보스 목소리 (간단한 소리)
if (typeof BOSS_VOICE !== "undefined" && typeof tone === "function") Object.assign(BOSS_VOICE, {
  hellgate: { intro: () => { tone(110, 0.5, "square", 0.07, 80); tone(220, 0.25, "triangle", 0.05, null, 0.4); }, fall: () => { tone(220, 0.8, "triangle", 0.06, 110); } },
  firethrone: { intro: () => { tone(160, 0.8, "sawtooth", 0.06, 320); tone(240, 0.6, "sine", 0.06, 480, 0.3); }, fall: () => { [880, 660, 523, 440].forEach((f, i) => tone(f, 0.3, "sine", 0.06, null, i * 0.15)); } },
});
if (typeof GUIDE_PHASE_VOICE !== "undefined") for (const E of W8_BOSS_LIST) GUIDE_PHASE_VOICE[E.mapId] = { 0: "주황 고리가 차오르는 불기둥 구멍으로 보스를 데려가요", 1: "새 기술이 나와요! 예고를 잘 봐요", 2: "조금만 더! 불기둥 박자를 써요" };
