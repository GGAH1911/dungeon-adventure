// ===== 보스 6종 (뒤쪽 맵): 화염 용, 해골 왕, 수정 골렘 왕, 바람 정령 군주, 크라켄, 그림자 마왕 =====
// 문법은 dungeon-creature 스킬을 따라요:
//   MONSTERS[보스몹] = 몬스터 정의 (shape: 블록 조립 그림, behavior: "b2_boss", phases: 단계별 기술)
//   ABILITIES 에 새 기술(접두어 b2_), BEHAVIOR_DOCS 에 새 행동 설명
//   BOSS_DEFS[mapId] = { id, name, title, size, material, arena, phases, create(x, y, level) }
// 공정성: 모든 아픈 기술은 예고(장판)가 있고, 단계가 바뀔 때 2초 무적 연출, 큰 공격 뒤엔 비틀거림(때릴 시간)!

if (typeof BOSS_DEFS === "undefined") globalThis.BOSS_DEFS = {};

// ----- 보스 부품 (마법 부여를 열어요) -----
Object.assign(MATERIALS, {
  b2_dragonScale: { name: "불꽃 비늘", color: "#ff6a2a", enchant: "burn" },
  b2_kingBone: { name: "왕의 뼈", color: "#e8e0c8", enchant: "heal" },
  b2_coreCrystal: { name: "골렘 핵 수정", color: "#9ff0ff" },
  b2_stormFeather: { name: "폭풍 깃털", color: "#bdf6ff", enchant: "chain" },
  b2_inkPearl: { name: "먹물 진주", color: "#5a4a7a" },
  b2_voidHeart: { name: "공허의 심장", color: "#a060ff" },
});

// ----- 새 행동 설명 (문서용) -----
Object.assign(BEHAVIOR_DOCS, {
  b2_boss: { name: "거대 보스", desc: "천천히 다가와 큰 기술을 써요. 체력이 66%, 33%가 되면 새 단계가 시작돼요.", counter: "예고 장판을 보고 피하고, 큰 공격 뒤 비틀거릴 때 몰아치기" },
  b2_still: { name: "제자리", desc: "움직이지 않고 그 자리에 있어요.", counter: "멀리서 화살로 부수기" },
  b2_tentacle: { name: "촉수", desc: "바닥에서 솟아 제자리에서 내려쳐요.", counter: "옆으로 비켜서서 촉수를 끊기" },
});

// ----- 새 기술 -----
Object.assign(ABILITIES, {
  b2_tailSwipe: {
    name: "꼬리 후려치기", desc: "뒤에 있는 적을 꼬리로 후려쳐 멀리 날려요.",
    counter: "용 뒤에 서지 말고 옆구리로!", tags: ["cone", "boss"],
    telegraph: { shape: "cone", length: 3.4, angle: 1.6, at: "self", time: 0.8, back: true },
    cooldown: 6, range: [0, 3.4], damageMul: 1.3, anim: "crouch", effect: { type: "knockback", force: 2.4 },
  },
  b2_deepBreath: {
    name: "대숨결", desc: "하늘에서 방을 가로지르는 넓은 불길을 뿜어요.",
    counter: "넓은 빨간 길 밖 양옆으로 피하기 (길이 다 차기 전에!)", tags: ["line", "fire", "boss"],
    telegraph: { shape: "line", length: 26, width: 4.5, at: "self", time: 2.4 },
    cooldown: 11, range: [0, 30], damageMul: 3.2, anim: "roar", effect: { type: "burn", duration: 3, tick: 0.8, tickMul: 0.2 },
  },
  b2_lavaCrack: {
    name: "용암 균열", desc: "발밑에 용암이 솟는 균열이 여러 개 생겨요. 잠시 남아 있어요.",
    counter: "빨간 원 밖으로, 남은 용암은 밟지 않기", tags: ["area", "fire", "boss"],
    telegraph: { shape: "circle", radius: 1.3, at: "target", time: 1.1 },
    cooldown: 9, range: [0, 20], damageMul: 1.5, anim: "slam", effect: { type: "zone", duration: 5, tick: 0.8, kind: "lava" },
  },
  b2_summonWhelps: {
    name: "새끼 용 부르기", desc: "작은 새끼 용들을 불러요.", counter: "새끼 용은 약해요. 휘둘러서 빨리 정리!",
    tags: ["summon", "boss"], telegraph: { shape: "self", radius: 1.5, at: "self", time: 1.0 },
    cooldown: 14, range: [0, 30], anim: "roar", effect: { type: "summon", monster: "b2_whelp", count: 3 }, when: { maxSummons: 4 },
  },
  b2_summonGuards: {
    name: "방패 기사 부르기", desc: "방패를 든 해골 기사를 불러요. 부르는 동안 꼼짝 못 해요.",
    counter: "부르는 동안이 기회! 화살이나 칼로 끊을 수도 있어요", tags: ["summon", "boss"],
    telegraph: { shape: "self", radius: 1.8, at: "self", time: 2.2 }, interruptible: true, interruptAt: 0.06,
    cooldown: 16, range: [0, 30], anim: "staff", effect: { type: "summon", monster: "knight", count: 2 }, when: { maxSummons: 3 },
  },
  b2_soulOrbs: {
    name: "영혼 구슬", desc: "천천히 따라오는 영혼 구슬을 사방으로 날려요.",
    counter: "계속 움직이고, 구르기로 통과하기", tags: ["projectile", "boss"],
    telegraph: { shape: "self", radius: 1.6, at: "self", time: 0.8 },
    cooldown: 8, range: [0, 12], damageMul: 0.9, anim: "staff", effect: { type: "nova", count: 8, speed: 3.2, color: "#9ff0c8" },
  },
  b2_deathWave: {
    name: "죽음의 파동", desc: "긴 주문 뒤 방 전체를 휩쓰는 파동! 주문 중에 때려서 끊을 수 있어요.",
    counter: "보라 원이 차오르는 동안 화살·칼로 몰아쳐 끊기! 못 끊으면 구르기", tags: ["room", "boss"],
    telegraph: { shape: "circle", radius: 30, at: "self", time: 3.2 }, interruptible: true, interruptAt: 0.05,
    cooldown: 18, range: [0, 30], damageMul: 3.5, anim: "staff", effect: { type: "damage" },
  },
  b2_clones: {
    name: "분신술", desc: "똑같이 생긴 가짜를 만들어요. 가짜는 한 대에 사라져요.",
    counter: "진짜는 발밑 그림자가 진해요. 가짜는 한 번 때리면 펑!", tags: ["summon", "boss"],
    telegraph: { shape: "self", radius: 2, at: "self", time: 1.0 },
    cooldown: 15, range: [0, 30], anim: "raise", effect: { type: "b2_clones", count: 3 },
  },
  b2_crystalShield: {
    name: "수정 보호막", desc: "방 구석에 수정을 세우고 보호막을 둘러요. 수정이 남아 있으면 안 아파해요.",
    counter: "빛줄기로 연결된 수정을 먼저 부수기 (화살 OK)", tags: ["shield", "boss"],
    telegraph: { shape: "self", radius: 2.2, at: "self", time: 1.2 },
    cooldown: 30, range: [0, 30], anim: "raise", effect: { type: "b2_crystals", count: 3 }, when: { once: true }, weight: 30,
  },
  b2_spinBeams: {
    name: "회전 광선", desc: "몸에서 광선 여러 줄을 뿜으며 천천히 돌아요.",
    counter: "광선과 같은 방향으로 따라 돌기, 틈에서 구르기", tags: ["line", "boss"],
    telegraph: { shape: "self", radius: 2.4, at: "self", time: 1.1 },
    cooldown: 12, range: [0, 30], damageMul: 1.2, anim: "raise", effect: { type: "b2_spin", beams: 3, turn: 1.6, duration: 4.5, length: 9 },
  },
  b2_gust: {
    name: "돌풍", desc: "넓은 부채꼴로 바람을 불어 멀리 밀어내요. 방 가장자리는 폭풍이라 아파요!",
    counter: "부채꼴 밖으로, 등 뒤에 벽을 두지 않기", tags: ["cone", "boss"],
    telegraph: { shape: "cone", length: 7, angle: 1.3, at: "self", time: 0.9 },
    cooldown: 7, range: [0, 7], damageMul: 0.8, anim: "roar", effect: { type: "knockback", force: 3.5 },
  },
  b2_stormRing: {
    name: "폭풍 고리", desc: "방 가장자리부터 폭풍이 점점 좁혀 들어와요.",
    counter: "가운데 쪽 안전한 동그라미 안에 머물기", tags: ["area", "boss"],
    telegraph: { shape: "self", radius: 2, at: "self", time: 1.2 },
    cooldown: 999, range: [0, 30], anim: "roar", effect: { type: "b2_storm", from: 11, to: 4.5, time: 22 }, when: { once: true }, weight: 40,
  },
  b2_tentacles: {
    name: "촉수 부르기", desc: "바닥에서 촉수가 솟아올라요. 촉수는 내려치기를 해요.",
    counter: "촉수를 먼저 끊으면 편해져요", tags: ["summon", "boss"],
    telegraph: { shape: "circle", radius: 1.1, at: "target", time: 1.1 },
    cooldown: 13, range: [0, 30], anim: "raise", effect: { type: "summon", monster: "b2_tentacle", count: 2 }, when: { maxSummons: 4 },
  },
  b2_tide: {
    name: "밀물", desc: "물이 차올라 섬 밖에서는 느려지고 조금씩 아파요.",
    counter: "밝은 모래섬 위로 올라가기", tags: ["area", "boss"],
    telegraph: { shape: "self", radius: 2, at: "self", time: 1.4 },
    cooldown: 20, range: [0, 30], damageMul: 0.25, anim: "roar", effect: { type: "b2_tide", duration: 9 },
  },
  b2_inkCloud: {
    name: "먹물 구름", desc: "먹물을 뿜어 주변이 캄캄해지고 느려져요.",
    counter: "먹물 웅덩이 밖으로 나오기", tags: ["zone", "boss"],
    telegraph: { shape: "circle", radius: 2.2, at: "target", time: 1.0 },
    cooldown: 10, range: [0, 20], damageMul: 0, anim: "crouch", effect: { type: "zone", duration: 6, tick: 1, kind: "web" },
  },
  b2_fearRune: {
    name: "공포의 룬", desc: "바닥에 보라 룬이 새겨지고, 끝나면 안에 있는 적이 얼어붙듯 느려져요.",
    counter: "보라 원이 다 차기 전에 밖으로!", tags: ["area", "boss"],
    telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.2, follow: true },
    cooldown: 7, range: [0, 20], damageMul: 0.6, anim: "point", effect: { type: "slow", duration: 2.2 },
  },
  b2_doomBlast: {
    name: "종말의 폭발", desc: "긴 주문 뒤 보이는 모든 곳에 폭발! 기둥 뒤에 숨으면 안 맞아요.",
    counter: "기둥 뒤로 숨어서 마왕이 안 보이게! (못 숨으면 구르기)", tags: ["room", "boss"],
    telegraph: { shape: "circle", radius: 30, at: "self", time: 3.6 },
    cooldown: 20, range: [0, 30], damageMul: 4, anim: "raise", effect: { type: "b2_hideBlast" },
  },
});

// ----- 보스 몸(블록 조립) 그리기 -----
// parts: { f 앞, s 옆, z 높이, w 폭(앞뒤), d 폭(옆), h 높이, c 색, face: 눈 달기, tag }
function b2DrawBody(m, parts, opts = {}) {
  const S = m.b2Scale || 1;
  const fx = m.faceX, fy = m.faceY, px = -fy, py = fx;
  const white = m.flash > 0;
  const p = game.player;
  const lift = (m.flyZ || 0);
  const list = parts.map((q) => {
    const cx = m.x + (fx * q.f + px * q.s) * S, cy = m.y + (fy * q.f + py * q.s) * S;
    return { ...q, cx, cy, w: q.w * S, d: q.d * S, h: q.h * S, z: (q.z + lift) * S };
  });
  list.sort((a, b) => a.cx + a.cy - (b.cx + b.cy) || a.z - b.z);
  // 주인공을 가리면 반투명
  ctx.save();
  if (p && !m.trophy && m.x + m.y > p.x + p.y && Math.hypot(m.x - p.x, m.y - p.y) < 3.5 * S) ctx.globalAlpha *= 0.55; // 트로피 미니어처는 늘 또렷하게
  if (m.b2Decoy) ctx.globalAlpha *= 0.92;
  for (const q of list) {
    const bx = q.cx - q.w / 2, by = q.cy - q.d / 2;
    drawBox(bx, by, Math.max(0, q.z), q.w, q.d, q.h, white ? "#ffffff" : q.c);
    if (q.face && !white) {
      const side = faceSide(fx, fy);
      if (side) {
        const big = q.eye || "#ffffff";
        drawOnFace(side, bx, by, q.z, q.w, q.d, 0.12, 0.42, q.h * 0.42, q.h * 0.78, big);
        drawOnFace(side, bx, by, q.z, q.w, q.d, 0.58, 0.88, q.h * 0.42, q.h * 0.78, big);
        drawOnFace(side, bx, by, q.z, q.w, q.d, 0.22, 0.38, q.h * 0.45, q.h * 0.66, q.pupil || "#1a1020");
        drawOnFace(side, bx, by, q.z, q.w, q.d, 0.68, 0.84, q.h * 0.45, q.h * 0.66, q.pupil || "#1a1020");
        if (q.blush) {
          drawOnFace(side, bx, by, q.z, q.w, q.d, 0.04, 0.16, q.h * 0.28, q.h * 0.38, q.blush);
          drawOnFace(side, bx, by, q.z, q.w, q.d, 0.84, 0.96, q.h * 0.28, q.h * 0.38, q.blush);
        }
      }
    }
  }
  ctx.restore();
  // 비틀거림: 머리 위 별
  if (m.staggerT > 0) {
    const s = toScreen(m.x, m.y, (opts.top || 2.4) * S + lift * S);
    for (let i = 0; i < 3; i++) { const a = game.time * 5 + i * 2.1; drawStar(s.x + Math.cos(a) * 16 * ZOOM, s.y + Math.sin(a) * 6 * ZOOM, 6 * ZOOM, "#ffe27a"); }
  }
  if (m.invulnT > 0) {
    const c = toScreen(m.x, m.y, 1.2 * S + lift * S);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,240,170,${0.5 + 0.3 * Math.sin(game.time * 20)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(c.x, c.y, 60 * ZOOM * S * 0.5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

// 자세 값: 숨쉬기, 걷기, 예비동작(cast), 공격 직후(strikeT), 맞음(hitT)
function b2Pose(m) {
  const t = game.time + (m.seed || 0);
  return {
    breath: Math.sin(t * 2.4) * 0.04,
    walk: m.moving ? Math.sin(m.walkTime * 7) : 0,
    cast: m.state === "cast" ? (m.castT || 0) : 0,
    strike: (m.strikeT || 0) / 0.22,
    hit: m.hitT > 0 ? 1 : 0,
    stag: m.staggerT > 0 ? 1 : 0,
  };
}

const B2_SHAPES = {
  // 화염 용: 통통한 몸, 큰 머리, 짧은 다리, 작은 날개, 동그란 큰 눈
  b2_dragon(m) {
    const P = b2Pose(m), c1 = "#d8442e", c2 = "#ffb84a", c3 = "#8a2a1e", horn = "#fff2c0";
    const flap = m.flyZ > 0 ? Math.sin(game.time * 10) * 0.35 : Math.sin(game.time * 2) * 0.08;
    const headUp = P.cast * 0.25 - P.strike * 0.15 + P.breath, lean = P.stag * -0.1;
    const parts = [
      { f: -0.25 + P.walk * 0.08, s: 0.32, z: 0, w: 0.28, d: 0.28, h: 0.4, c: c3 }, { f: -0.25 - P.walk * 0.08, s: -0.32, z: 0, w: 0.28, d: 0.28, h: 0.4, c: c3 },
      { f: 0.3 - P.walk * 0.08, s: 0.3, z: 0, w: 0.26, d: 0.26, h: 0.38, c: c3 }, { f: 0.3 + P.walk * 0.08, s: -0.3, z: 0, w: 0.26, d: 0.26, h: 0.38, c: c3 },
      { f: 0, s: 0, z: 0.35 + P.breath, w: 1.05, d: 0.85, h: 0.75, c: c1 },
      { f: 0.12, s: 0, z: 0.4 + P.breath, w: 0.7, d: 0.6, h: 0.5, c: c2 }, // 배
      { f: -0.7, s: 0, z: 0.45, w: 0.5, d: 0.35, h: 0.3, c: c1 }, { f: -1.1, s: Math.sin(game.time * 3) * 0.15, z: 0.4, w: 0.4, d: 0.24, h: 0.22, c: c1 },
      { f: -1.35, s: Math.sin(game.time * 3) * 0.25, z: 0.38, w: 0.2, d: 0.3, h: 0.2, c: c3 },
      { f: -0.1, s: 0.55, z: 1.0 + flap, w: 0.5, d: 0.5, h: 0.08, c: c3 }, { f: -0.1, s: -0.55, z: 1.0 + flap, w: 0.5, d: 0.5, h: 0.08, c: c3 },
      { f: 0.6 + lean, s: 0, z: 0.95 + headUp, w: 0.75, d: 0.75, h: 0.7, c: c1, face: true, eye: "#fff7d0", blush: "#ff9a8a" },
      { f: 1.02 + lean, s: 0, z: 0.98 + headUp - P.cast * 0.1, w: 0.32, d: 0.5, h: 0.32, c: c2 }, // 주둥이
      { f: 0.45, s: 0.22, z: 1.62 + headUp, w: 0.12, d: 0.12, h: 0.22, c: horn }, { f: 0.45, s: -0.22, z: 1.62 + headUp, w: 0.12, d: 0.12, h: 0.22, c: horn },
    ];
    b2DrawBody(m, parts, { top: 2.0 });
    if (m.state === "cast" && P.cast > 0.3) { const s = toScreen(m.x + m.faceX * 1.2 * m.b2Scale, m.y + m.faceY * 1.2 * m.b2Scale, (1.1 + (m.flyZ || 0)) * m.b2Scale); drawStar(s.x, s.y, 10 * ZOOM * P.cast, "rgba(255,200,80,0.9)"); }
  },
  // 해골 왕: 큰 해골 머리, 금관, 망토, 지팡이
  b2_skelking(m) {
    const P = b2Pose(m), bone = "#ece4cc", robe = "#4a2a6a", gold = "#ffd23f";
    const arm = P.cast * 0.6;
    const parts = [
      { f: 0, s: 0.2, z: 0, w: 0.22, d: 0.22, h: 0.45 + P.walk * 0.03, c: bone }, { f: 0, s: -0.2, z: 0, w: 0.22, d: 0.22, h: 0.45 - P.walk * 0.03, c: bone },
      { f: 0, s: 0, z: 0.35 + P.breath, w: 0.8, d: 0.75, h: 0.75, c: robe }, { f: -0.25, s: 0, z: 0.1, w: 0.4, d: 0.85, h: 0.9, c: "#3a1e55" },
      { f: 0.25, s: 0.5, z: 0.75 + arm, w: 0.2, d: 0.2, h: 0.45, c: bone }, { f: 0.25, s: -0.5, z: 0.75, w: 0.2, d: 0.2, h: 0.4, c: bone },
      { f: 0.35, s: 0.5, z: 0.3 + arm, w: 0.1, d: 0.1, h: 1.4, c: "#5a3a22" }, { f: 0.35, s: 0.5, z: 1.7 + arm, w: 0.24, d: 0.24, h: 0.24, c: "#9ff0c8" },
      { f: 0.05, s: 0, z: 1.1 + P.breath, w: 0.78, d: 0.78, h: 0.7, c: bone, face: true, eye: "#1a1020", pupil: "#7dffb0" },
      { f: 0.05, s: 0, z: 1.8 + P.breath, w: 0.82, d: 0.82, h: 0.14, c: gold }, { f: 0.05, s: 0.3, z: 1.94, w: 0.14, d: 0.14, h: 0.18, c: gold }, { f: 0.05, s: -0.3, z: 1.94, w: 0.14, d: 0.14, h: 0.18, c: gold },
    ];
    b2DrawBody(m, parts, { top: 2.3 });
  },
  // 수정 골렘 왕: 바위 몸, 등에 수정, 큰 주먹
  b2_golemking(m) {
    const P = b2Pose(m), rock = "#7c7a86", dark = "#55535e", cry = "#8ff0ff";
    const raise = P.cast, fist = P.strike;
    const parts = [
      { f: 0, s: 0.3, z: 0, w: 0.35, d: 0.35, h: 0.4, c: dark }, { f: 0, s: -0.3, z: 0, w: 0.35, d: 0.35, h: 0.4, c: dark },
      { f: 0, s: 0, z: 0.35 + P.breath, w: 1.0, d: 1.0, h: 0.85, c: rock },
      { f: -0.35, s: 0.2, z: 1.1, w: 0.2, d: 0.2, h: 0.5, c: cry }, { f: -0.35, s: -0.25, z: 1.0, w: 0.18, d: 0.18, h: 0.4, c: cry }, { f: -0.4, s: 0, z: 1.15, w: 0.22, d: 0.22, h: 0.6, c: cry },
      { f: 0.25 + fist * 0.4, s: 0.68, z: 0.35 + raise * 1.0 - fist * 0.3, w: 0.45, d: 0.45, h: 0.45, c: dark }, { f: 0.25 + fist * 0.4, s: -0.68, z: 0.35 + raise * 1.0 - fist * 0.3, w: 0.45, d: 0.45, h: 0.45, c: dark },
      { f: 0.2, s: 0, z: 1.2 + P.breath, w: 0.6, d: 0.6, h: 0.5, c: rock, face: true, eye: "#ffd27a", pupil: "#ff7a1a" },
      { f: 0.48, s: 0, z: 0.65, w: 0.1, d: 0.35, h: 0.35, c: m.coreOpen ? "#ffffff" : cry },
    ];
    b2DrawBody(m, parts, { top: 2.0 });
  },
  // 바람 정령 군주: 떠 있는 구름 몸 + 소용돌이 꼬리 + 큰 눈
  b2_windlord(m) {
    const P = b2Pose(m), a = "#e8fbff", b = "#9fe6ff", c = "#6fc8e8";
    const t = game.time, bob = Math.sin(t * 2) * 0.12;
    const parts = [];
    for (let i = 0; i < 4; i++) { const ang = t * 4 + i * 1.57; parts.push({ f: Math.cos(ang) * 0.25 * (1 - i * 0.15), s: Math.sin(ang) * 0.25, z: 0.05 + i * 0.18 + bob, w: 0.4 - i * 0.06, d: 0.4 - i * 0.06, h: 0.16, c: i % 2 ? b : c }); }
    parts.push({ f: 0, s: 0, z: 0.75 + bob, w: 1.0, d: 1.0, h: 0.85, c: a, face: true, eye: "#2a4a6a", pupil: "#ffffff", blush: "#ffc0d0" });
    parts.push({ f: -0.1, s: 0.55, z: 1.0 + bob + P.cast * 0.3, w: 0.42, d: 0.42, h: 0.42, c: b }, { f: -0.1, s: -0.55, z: 1.0 + bob + P.cast * 0.3, w: 0.42, d: 0.42, h: 0.42, c: b });
    parts.push({ f: -0.2, s: 0, z: 1.6 + bob, w: 0.6, d: 0.6, h: 0.3, c: b });
    b2DrawBody(m, parts, { top: 2.2 });
  },
  // 크라켄: 바다에서 머리만 내민 통통한 문어
  b2_kraken(m) {
    const P = b2Pose(m), body = "#c45a8a", spot = "#e888b0", dark = "#8a3a64";
    const expose = m.staggerT > 0 ? 0.35 : 0;
    const parts = [];
    for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2 + game.time * 0.6; const w = Math.sin(game.time * 3 + i) * 0.1; parts.push({ f: Math.cos(ang) * 0.75, s: Math.sin(ang) * 0.75, z: 0 + w, w: 0.3, d: 0.3, h: 0.25, c: dark }); }
    parts.push({ f: 0, s: 0, z: 0.1 + expose + P.breath, w: 1.15, d: 1.15, h: 1.1, c: body, face: true, eye: "#fff7e0", blush: "#ff9ac0" });
    parts.push({ f: -0.1, s: 0, z: 1.2 + expose + P.breath - P.cast * 0.1, w: 0.9, d: 0.9, h: 0.5, c: body }, { f: -0.15, s: 0.3, z: 1.5 + expose, w: 0.2, d: 0.2, h: 0.1, c: spot }, { f: -0.25, s: -0.2, z: 1.6 + expose, w: 0.16, d: 0.16, h: 0.1, c: spot });
    b2DrawBody(m, parts, { top: 2.1 });
  },
  // 그림자 마왕: 커다란 뿔, 보라 눈, 망토
  b2_shadowlord(m) {
    const P = b2Pose(m), dark = "#241a34", cloak = "#3a2458", glow = "#c080ff";
    const raise = P.cast * 0.7;
    const parts = [
      { f: 0, s: 0, z: 0, w: 0.9, d: 0.9, h: 0.9, c: cloak }, { f: -0.15, s: 0, z: 0.05, w: 0.6, d: 1.1, h: 1.0, c: "#2a1a40" },
      { f: 0.05, s: 0, z: 0.85 + P.breath, w: 0.8, d: 0.8, h: 0.55, c: dark },
      { f: 0.25, s: 0.55, z: 0.9 + raise, w: 0.22, d: 0.22, h: 0.5, c: dark }, { f: 0.25, s: -0.55, z: 0.9 + raise, w: 0.22, d: 0.22, h: 0.5, c: dark },
      { f: 0.3, s: 0.55, z: 1.4 + raise, w: 0.2, d: 0.2, h: 0.2, c: glow }, { f: 0.3, s: -0.55, z: 1.4 + raise, w: 0.2, d: 0.2, h: 0.2, c: glow },
      { f: 0.1, s: 0, z: 1.35 + P.breath, w: 0.72, d: 0.72, h: 0.62, c: dark, face: true, eye: glow, pupil: "#ffffff" },
      { f: 0.05, s: 0.38, z: 1.85, w: 0.14, d: 0.14, h: 0.4, c: "#8a7aa0" }, { f: 0.05, s: -0.38, z: 1.85, w: 0.14, d: 0.14, h: 0.4, c: "#8a7aa0" },
      { f: -0.05, s: 0.45, z: 2.15, w: 0.12, d: 0.12, h: 0.18, c: "#8a7aa0" }, { f: -0.05, s: -0.45, z: 2.15, w: 0.12, d: 0.12, h: 0.18, c: "#8a7aa0" },
    ];
    b2DrawBody(m, parts, { top: 2.6 });
  },
  // 작은 친구들
  b2_whelp(m) {
    const P = b2Pose(m), c = "#e8603e";
    const z = 0.6 + Math.sin(game.time * 6 + (m.seed || 0)) * 0.1, flap = Math.sin(game.time * 16) * 0.12;
    b2DrawBody(m, [
      { f: 0, s: 0, z, w: 0.36, d: 0.3, h: 0.28, c },
      { f: 0.22, s: 0, z: z + 0.12, w: 0.28, d: 0.28, h: 0.26, c, face: true, eye: "#fff7d0" },
      { f: -0.05, s: 0.24, z: z + 0.2 + flap, w: 0.22, d: 0.22, h: 0.04, c: "#8a2a1e" }, { f: -0.05, s: -0.24, z: z + 0.2 + flap, w: 0.22, d: 0.22, h: 0.04, c: "#8a2a1e" },
    ]);
  },
  b2_crystal(m) {
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 4);
    b2DrawBody(m, [{ f: 0, s: 0, z: 0, w: 0.5, d: 0.5, h: 0.2, c: "#55535e" }, { f: 0, s: 0, z: 0.2, w: 0.32, d: 0.32, h: 1.0, c: mixHex("#6fe0ff", "#ffffff", pulse * 0.4) }]);
    const owner = m.owner;
    if (owner && owner.hp > 0) {
      const a = toScreen(m.x, m.y, 1.0), b = toScreen(owner.x, owner.y, 1.0 * (owner.b2Scale || 1));
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(140,230,255,${0.4 + 0.3 * pulse})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
    }
  },
  b2_tentacle(m) {
    const P = b2Pose(m), c = "#c45a8a", up = 0.3 + P.cast * 0.6 - P.strike * 0.4;
    const parts = [];
    for (let i = 0; i < 5; i++) parts.push({ f: Math.sin(game.time * 2 + i) * 0.06 * i + P.strike * i * 0.1, s: 0, z: i * 0.3 * (0.6 + up), w: 0.3 - i * 0.04, d: 0.3 - i * 0.04, h: 0.32, c: i % 2 ? "#e888b0" : c });
    b2DrawBody(m, parts);
  },
};
Object.assign(EXTRA_SHAPES, B2_SHAPES);

// ----- 보스 몬스터 정의 (체력·공격력은 맵 레벨과 난이도로 자동 커져요) -----
Object.assign(MONSTERS, {
  b2_whelp: { color: "#e8603e", name: "새끼 용", shape: "b2_whelp", behavior: "flyer", hp: 4, speed: 3.0, damage: 0.8, xp: 3, emerald: 0.3, attackCooldown: 1.4 },
  b2_crystal: { color: "#8ff0ff", name: "보호막 수정", shape: "b2_crystal", behavior: "b2_still", hp: 4, speed: 0, damage: 0, xp: 2, emerald: 0.2, heavy: true },
  b2_tentacle: { color: "#c45a8a", name: "촉수", shape: "b2_tentacle", behavior: "b2_tentacle", hp: 9, speed: 0, damage: 1.5, xp: 3, emerald: 0.2, abilities: ["slam"] },
  b2_dragonBoss: { color: "#d8442e", name: "화염 용", shape: "b2_dragon", behavior: "b2_boss", hp: 170, speed: 1.6, damage: 1.25, xp: 40, emerald: 1, emeraldCount: 10, attackRange: 2.2, attackCooldown: 2.2,
    phases: [{ until: 0.66, abilities: ["fireBreath", "b2_tailSwipe", "slam"] }, { until: 0.33, abilities: ["b2_deepBreath", "meteorRain", "b2_summonWhelps"] }, { abilities: ["fireBreath", "b2_tailSwipe", "b2_lavaCrack", "enrage", "charge"] }] },
  b2_skelkingBoss: { color: "#ece4cc", name: "해골 왕", shape: "b2_skelking", behavior: "b2_boss", hp: 190, speed: 1.4, damage: 1.25, xp: 45, emerald: 1, emeraldCount: 10, attackRange: 1.8, attackCooldown: 2.2,
    phases: [{ until: 0.66, abilities: ["b2_summonGuards", "b2_soulOrbs", "slam"] }, { until: 0.33, abilities: ["b2_clones", "b2_deathWave", "b2_soulOrbs"] }, { abilities: ["poisonPool", "trackingStrike", "b2_deathWave", "b2_summonGuards", "enrage"] }] },
  b2_golemBoss: { color: "#7c7a86", name: "수정 골렘 왕", shape: "b2_golem", behavior: "b2_boss", hp: 200, speed: 1.2, damage: 1.3, xp: 50, emerald: 1, emeraldCount: 12, attackRange: 2.2, attackCooldown: 2.4,
    phases: [{ until: 0.66, abilities: ["slam", "groundSpikes", "shockRing"] }, { until: 0.33, abilities: ["b2_crystalShield", "slam", "meteorRain"] }, { abilities: ["b2_spinBeams", "shockRing", "summonMinions", "enrage"] }] },
  b2_windBoss: { color: "#bdf6ff", name: "바람 정령 군주", shape: "b2_windlord", behavior: "b2_boss", hp: 210, speed: 2.0, damage: 1.2, xp: 55, emerald: 1, emeraldCount: 12, attackRange: 2, attackCooldown: 2,
    phases: [{ until: 0.66, abilities: ["b2_gust", "volley", "pull"] }, { until: 0.33, abilities: ["pull", "b2_spinBeams", "nova", "b2_gust"] }, { abilities: ["blink", "b2_stormRing", "nova", "b2_gust", "enrage"] }] },
  b2_krakenBoss: { color: "#c45a8a", name: "크라켄", shape: "b2_kraken", behavior: "b2_boss", hp: 220, speed: 0.9, damage: 1.3, xp: 60, emerald: 1, emeraldCount: 14, attackRange: 2.4, attackCooldown: 2.4,
    phases: [{ until: 0.66, abilities: ["b2_tentacles", "groundSpikes", "slam"] }, { until: 0.33, abilities: ["b2_tide", "pull", "b2_tentacles", "volley"] }, { abilities: ["pull", "b2_inkCloud", "meteorRain", "b2_tide", "enrage"] }] },
  b2_shadowBoss: { color: "#3a2458", name: "그림자 마왕", shape: "b2_shadowlord", behavior: "b2_boss", hp: 240, speed: 1.7, damage: 1.3, xp: 70, emerald: 1, emeraldCount: 16, attackRange: 2, attackCooldown: 2,
    phases: [{ until: 0.66, abilities: ["b2_clones", "b2_fearRune", "blink", "beam"] }, { until: 0.33, abilities: ["b2_fearRune", "nova", "b2_doomBlast", "trackingStrike"] }, { abilities: ["b2_crystalShield", "b2_doomBlast", "b2_clones", "blink", "enrage"] }] },
});
// 수정 골렘 왕 모양 이름 맞추기
EXTRA_SHAPES.b2_golem = B2_SHAPES.b2_golemking;
MONSTERS.b2_golemBoss.shape = "b2_golem";
// 이 기술들 뒤엔 보스가 비틀거려요 (때릴 시간!)
const B2_STAGGER_AFTER = { b2_deepBreath: 2.4, b2_deathWave: 2.2, b2_doomBlast: 2.6, slam: 1.0, pull: 1.6, b2_spinBeams: 2.0, charge: 1.2, b2_summonGuards: 1.0 };

// ----- 행동 -----
if (typeof EXTRA_BEHAVIORS !== "undefined") Object.assign(EXTRA_BEHAVIORS, {
  b2_boss(m, p, dist, dt) {
    if (m.staggerT > 0 || m.invulnT > 0) { m.moving = false; return; }
    if (m.flying) {
      // 하늘에서 맴돌아요 (칼은 안 닿아요)
      m.flyAng = (m.flyAng || 0) + dt * 0.5;
      const cx = world.W / 2, cy = world.H / 2;
      moveWithSeparation(m, cx + Math.cos(m.flyAng) * 5 - m.x, cy + Math.sin(m.flyAng) * 5 - m.y, dt, 2.5);
      faceToward(m, p);
      return;
    }
    const def = m.def;
    if (dist > def.attackRange * 0.9) chaseMove(m, p, dist, dt);
    else { m.moving = false; faceToward(m, p); }
    if (dist < def.attackRange + p.r && m.attackTimer <= 0) {
      m.attackTimer = def.attackCooldown;
      m.strikeT = 0.22;
      hurtPlayer(p, m.damage * 0.7, m);
    }
  },
  b2_still(m) { m.moving = false; },
  b2_tentacle(m, p, dist) { m.moving = false; faceToward(m, p); },
});

// ----- 보스 공통 처리 (매 프레임) -----
function b2BossTick(m, p, dt) {
  m.invulnT = Math.max(0, (m.invulnT || 0) - dt);
  if (m.staggerT > 0) { m.staggerT -= dt; m.coreOpen = m.staggerT > 0; }
  // 기술이 끝나는 순간 비틀거림
  if (m.b2PrevState === "cast" && m.state !== "cast" && B2_STAGGER_AFTER[m.lastCastId] && !m.flying) {
    m.staggerT = B2_STAGGER_AFTER[m.lastCastId] * (game.profile.difficulty === "easy" ? 1.3 : game.profile.difficulty === "nightmare" ? 0.75 : 1);
    addFloatText(m.x, m.y, "비틀!", "#ffe27a", 22);
  }
  m.b2PrevState = m.state;
  // 용: 비행 단계
  if (m.def === MONSTERS.b2_dragonBoss) {
    const flyNow = m.phaseIndex === 1 && m.flyTimer > 0;
    if (m.phaseIndex === 1 && m.flyTimer === undefined) { m.flyTimer = { easy: 10, normal: 14, hard: 16, nightmare: 18 }[game.profile.difficulty] || 14; showMessage("용이 날아올랐어요! 화살로 쏘세요", 2.5, false, "#ffb070"); }
    if (m.flyTimer > 0) { m.flyTimer -= dt; if (m.flyTimer <= 0) { m.flying = false; m.staggerT = 4; spawnDust(m.x, m.y); game.shake = 0.4; showMessage("쿵! 착지했어요. 지금이 기회!", 2, false, "#ffe27a"); } }
    m.flying = flyNow;
    m.flyZ += ((m.flying ? 1.6 : 0) - (m.flyZ || 0)) * Math.min(1, dt * 3);
  }
  // 수정이 남아 있으면 보호막
  if (m.crystals) {
    const alive = m.crystals.filter((c) => c.hp > 0);
    m.crystalGuard = alive.length > 0;
    if (!alive.length && m.crystals.length) { m.crystals = null; m.staggerT = 3; addFloatText(m.x, m.y, "보호막이 깨졌어요!", "#9ff0ff", 22); }
  }
}

// ----- 데미지 막기·늘리기 (무적, 비행, 수정 보호막, 비틀거림) -----
hookOn("monsterDamage", (h) => {
  const m = h.m;
  if (m && m.b2Boss) {
    const fromPlayer = allPlayers().some((p) => Math.hypot(h.fromX - p.x, h.fromY - p.y) < 0.6); // 칼(주인공 자리에서 온 공격, 둘 중 누구든)
    if (m.invulnT > 0) { if (!h.opts.dot) addFloatText(m.x, m.y, "무적", "#ffe9a8", 15); return true; }
    if (m.crystalGuard) { if (!h.opts.dot) addFloatText(m.x, m.y, "수정 보호막!", "#9ff0ff", 15); return true; }
    if (m.flying && fromPlayer) { addFloatText(m.x, m.y, "닿지 않아요! 화살로!", "#ffb070", 15); return true; }
    if (m.staggerT > 0) h.dmg *= 1.5;
    h.knock = Math.min(h.knock === undefined ? 1 : h.knock, 0.15);
  }
  if (m && m.b2Decoy && !h.opts.dot) { spawnBurst(m.x, m.y, ["#3a2458", "#c080ff"], 10); m.hp = 0; m.flash = 0.1; return true; }
  return false;
}, 10);

// ----- 새 기술 효과 + 끝난 기술 기록 -----
hookOn("castStart", (m, id) => { m.lastCastId = id; }, 10);
// 꼬리 후려치기는 뒤쪽 부채꼴
hookOn("castStarted", (m, id) => {
  if (ABILITIES[id] && ABILITIES[id].telegraph.back) for (const c of casts) if (c.m === m && c.id === id && !c.b2Flipped) { c.dirX = -c.dirX; c.dirY = -c.dirY; c.b2Flipped = true; }
}, 10);
let b2Spins = [];   // 회전 광선
let b2Field = null; // 폭풍 고리 / 밀물
{
  hookOn("resolveCast", (c, p) => {
    const e = c.ab.effect, m = c.m;
    if (!e.type.startsWith("b2_")) return false;
    const dmg = abilityDamage(c);
    const hurt = () => { if (p.rollTimer > 0) { addFloatText(p.x, p.y, "회피!", "#9be8ff", 18); return; } hurtPlayer(p, dmg, m); };
    switch (e.type) {
      case "b2_clones":
        for (let i = 0; i < e.count; i++) {
          const a = (i / e.count) * Math.PI * 2 + Math.random();
          const spot = findFreeSpot(m.x + Math.cos(a) * 2.5, m.y + Math.sin(a) * 2.5, m.r, 3) || { x: m.x, y: m.y };
          const d = createMonster(m.type, spot.x, spot.y, 1);
          d.hp = d.maxHp = 1; d.b2Decoy = true; d.damage = m.damage * 0.4; d.b2Scale = m.b2Scale; d.phases = [{ abilities: [] }]; d.aggro = true; d.name = m.name;
          monsters.push(d);
          spawnBurst(spot.x, spot.y, ["#3a2458", "#c080ff"], 8);
        }
        // 진짜도 자리 바꾸기
        { const s = findFreeSpot(m.x + (Math.random() - 0.5) * 4, m.y + (Math.random() - 0.5) * 4, m.r, 3); if (s) { m.x = s.x; m.y = s.y; } }
        break;
      case "b2_crystals": {
        m.crystals = [];
        const n = { easy: 2, normal: e.count, hard: e.count + 1, nightmare: e.count + 1 }[game.profile.difficulty] || e.count;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + 0.4;
          const spot = findFreeSpot(world.W / 2 + Math.cos(a) * 7.5, world.H / 2 + Math.sin(a) * 7.5, 0.4, 3) || { x: world.W / 2, y: world.H / 2 };
          const cr = createMonster("b2_crystal", spot.x, spot.y, m.level || game.mapLevel || 1);
          cr.owner = m; cr.aggro = true; cr.appearTimer = 0.5;
          monsters.push(cr); m.crystals.push(cr);
        }
        showMessage("수정을 부숴서 보호막을 깨요!", 2.5, false, "#9ff0ff");
        break;
      }
      case "b2_spin": {
        const dir = Math.random() < 0.5 ? 1 : -1;
        b2Spins.push({ m, t: 0, dur: e.duration, beams: e.beams + (game.profile.difficulty === "nightmare" ? 1 : 0), turn: e.turn * dir, len: e.length, base: Math.atan2(m.faceY, m.faceX), dmg, hitT: 0 });
        break;
      }
      case "b2_storm":
        b2Field = { kind: "storm", t: 0, from: e.from, to: e.to, time: e.time, dmg: dmg || m.damage * 0.4, tick: 0 };
        showMessage("폭풍이 좁혀와요! 가운데로!", 2.5, false, "#bdf6ff");
        break;
      case "b2_tide":
        b2Field = { kind: "tide", t: 0, dur: e.duration, dmg: m.damage * 0.25 * abilityTuning().damage, tick: 0, islands: m.islands || [{ x: world.W / 2, y: world.H / 2 + 5 }, { x: world.W / 2 - 5, y: world.H / 2 }, { x: world.W / 2 + 5, y: world.H / 2 - 3 }] };
        showMessage("물이 차올라요! 모래섬 위로!", 2.5, false, "#8fe0ff");
        break;
      case "b2_hideBlast": {
        flashScreen(0.25); game.shake = 0.5;
        if (typeof sfx !== "undefined") sfx.boom();
        if (p && p.hp > 0) {
          if (!lineOfSight(m.x, m.y, p.x, p.y)) addFloatText(p.x, p.y, "숨었다!", "#9be8ff", 20);
          else hurt();
        }
        break;
      }
    }
    return true;
  }, 10);
}

function b2UpdateFields(dt) {
  const players = allPlayers(); // 둘이 하기: 두 사람 다 맞아요
  for (const s of b2Spins) {
    s.t += dt; s.hitT -= dt;
    if (s.m.hp <= 0) continue;
    s.hitP = s.hitP || new Map();
    for (const p of players) {
      if (p.hp <= 0) continue;
      const ht = (s.hitP.get(p) || 0) - dt; s.hitP.set(p, ht);
      for (let i = 0; i < s.beams; i++) {
        const a = s.base + (i / s.beams) * Math.PI * 2 + s.turn * s.t;
        const dx = p.x - s.m.x, dy = p.y - s.m.y;
        const along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
        if (along > 0 && along < s.len && perp < 0.45 && s.hitP.get(p) <= 0 && p.rollTimer <= 0) { s.hitP.set(p, 0.6); hurtPlayer(p, s.dmg, s.m); }
      }
    }
  }
  b2Spins = b2Spins.filter((s) => s.t < s.dur && s.m.hp > 0);
  if (b2Field && players.length) {
    const f = b2Field;
    f.t += dt; f.tick -= dt;
    let ticked = false;
    if (f.kind === "storm") {
      f.r = f.from + (f.to - f.from) * Math.min(1, f.t / f.time);
      for (const p of players) {
        const out = Math.hypot(p.x - world.W / 2, p.y - world.H / 2) > f.r;
        if (out && f.tick <= 0 && p.hp > 0) { ticked = true; hurtPlayer(p, f.dmg, { x: world.W / 2, y: world.H / 2 }); }
      }
      if (ticked) f.tick = 0.9;
    } else if (f.kind === "tide") {
      for (const p of players) {
        const safe = f.islands.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < 1.7);
        if (!safe) { p.abSlow = Math.max(p.abSlow || 0, 0.3); if (f.tick <= 0 && p.hp > 0) { ticked = true; hurtPlayer(p, f.dmg, { x: p.x, y: p.y }); } }
      }
      if (ticked) f.tick = 1.0;
      if (f.t > f.dur) b2Field = null;
    }
  }
}

function b2DrawFields() {
  ctx.save();
  for (const s of b2Spins) {
    const k = Math.min(1, s.t / 0.3);
    for (let i = 0; i < s.beams; i++) {
      const a = s.base + (i / s.beams) * Math.PI * 2 + s.turn * s.t;
      const A = toScreen(s.m.x, s.m.y, 0.6), B = toScreen(s.m.x + Math.cos(a) * s.len, s.m.y + Math.sin(a) * s.len, 0.6);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(140,230,255,${0.35 * k})`; ctx.lineWidth = 18 * ZOOM; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * k})`; ctx.lineWidth = 5 * ZOOM; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = "source-over";
  const f = b2Field;
  if (f && f.kind === "storm" && f.r) {
    const c = toScreen(world.W / 2, world.H / 2, 0.02), e = floorEllipse(f.r);
    ctx.strokeStyle = "rgba(190,240,255,0.85)"; ctx.lineWidth = 5; ctx.setLineDash([12, 8]);
    ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  if (f && f.kind === "tide") {
    const c = toScreen(world.W / 2, world.H / 2, 0.01), e = floorEllipse(14);
    ctx.fillStyle = "rgba(40,120,200,0.28)"; ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.fill();
    for (const s of f.islands) { const q = toScreen(s.x, s.y, 0.02), r = floorEllipse(1.7); ctx.fillStyle = "rgba(240,220,150,0.75)"; ctx.beginPath(); ctx.ellipse(q.x, q.y, r.rx, r.ry, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

hookOn("abilitiesUpdated", (dt) => {
  for (const m of monsters) if (m.b2Boss && m.hp > 0) b2BossTick(m, nearestPlayer(m.x, m.y), dt);
  b2UpdateFields(dt);
}, 10);
hookOn("drawTelegraphsAfter", () => b2DrawFields(), 10);
hookOn("reset", () => { b2Spins = []; b2Field = null; }, 30);

// ----- 보스 만들기 도우미 -----
function b2MakeBoss(type, x, y, level, scale, extra = {}) {
  const m = createMonster(type, x, y, level);
  m.boss = true; m.b2Boss = true; m.level = level;
  m.name = MONSTERS[type].name;
  m.b2Scale = scale; m.r = 0.45 * scale;
  m.aggro = true; m.appearTimer = 1; m.seed = Math.random() * 10;
  m.attackTimer = 1.5; m.abGlobal = 2.0;
  m.onPhase = () => { m.invulnT = 2; m.staggerT = 0; casts = casts.filter((c) => c.m !== m); if (m.state === "cast") m.state = "chase"; game.shake = 0.45; };
  Object.assign(m, extra);
  const free = findFreeSpot(m.x, m.y, m.r, 4);
  if (free) { m.x = free.x; m.y = free.y; }
  return m;
}

// 아레나 꾸미기: 기둥(숨을 곳), 기본은 둥근 방 (보스방 담당 코드가 build(world) 를 불러요)
function b2Pillars(world, pts, h = 2) {
  const c = Math.floor(world.W / 2);
  for (const [dx, dy] of pts) { const x = c + dx, y = c + dy; if (world.tiles[y] && world.tiles[y][x] === 0) world.tiles[y][x] = h; }
}

// ----- 보스 정의 (계약) -----
const B2_DEFS = {
  volcano: {
    id: "b2_dragonBoss", name: "화염 용", title: "용암 요새의 주인", size: 3.2,
    material: { id: "b2_dragonScale", name: "불꽃 비늘", color: "#ff6a2a", enchant: "burn" },
    arena: { size: 26, theme: { floor: "#4a3530", moss: "#d8541c", wall: "#3e302c", darkness: 0.45, bg: "#1a0a06", lava: true }, build: (w) => b2Pillars(w, [[-5, -5], [5, 5], [-5, 5], [5, -5]]) },
    create: (x, y, level) => b2MakeBoss("b2_dragonBoss", x, y, level, 3.2, { flyZ: 0 }),
  },
  castle: {
    id: "b2_skelkingBoss", name: "해골 왕", title: "어둠의 성 왕좌의 주인", size: 3.0,
    material: { id: "b2_kingBone", name: "왕의 뼈", color: "#e8e0c8", enchant: "heal" },
    arena: { size: 24, theme: { floor: "#3e3a46", moss: "#5a2030", wall: "#4a4552", darkness: 0.55, bg: "#09070d" }, build: (w) => b2Pillars(w, [[-4, 0], [4, 0], [0, -4], [0, 4]]) },
    create: (x, y, level) => b2MakeBoss("b2_skelkingBoss", x, y, level, 3.0),
  },
  mine: {
    id: "b2_golemBoss", name: "수정 골렘 왕", title: "버려진 광산의 심장", size: 3.4,
    material: { id: "b2_coreCrystal", name: "골렘 핵 수정", color: "#9ff0ff" },
    arena: { size: 26, theme: { floor: "#5a4a3a", moss: "#d8b040", wall: "#4a3c30", darkness: 0.45, bg: "#120c08" }, build: (w) => b2Pillars(w, [[-6, -2], [6, 2], [-2, 6], [2, -6]], 1) },
    create: (x, y, level) => b2MakeBoss("b2_golemBoss", x, y, level, 3.4),
  },
  sky: {
    id: "b2_windBoss", name: "바람 정령 군주", title: "구름 섬의 폭풍", size: 3.0,
    material: { id: "b2_stormFeather", name: "폭풍 깃털", color: "#bdf6ff", enchant: "chain" },
    arena: { size: 26, theme: { floor: "#e8f2f8", moss: "#c8e8f8", wall: "#a8c8e0", darkness: 0.12, bg: "#7ab8e8" } },
    create: (x, y, level) => b2MakeBoss("b2_windBoss", x, y, level, 3.0),
  },
  coral: {
    id: "b2_krakenBoss", name: "크라켄", title: "산호 바다 동굴의 깊은 곳", size: 3.4,
    material: { id: "b2_inkPearl", name: "먹물 진주", color: "#5a4a7a" },
    arena: { size: 26, theme: { floor: "#3a7a7a", moss: "#e87a8a", wall: "#2a5a6a", darkness: 0.35, bg: "#06202a" } },
    create: (x, y, level) => b2MakeBoss("b2_krakenBoss", x, y, level, 3.4),
  },
  void: {
    id: "b2_shadowBoss", name: "그림자 마왕", title: "공허의 끝, 마지막 왕", size: 3.2,
    material: { id: "b2_voidHeart", name: "공허의 심장", color: "#a060ff" },
    arena: { size: 28, theme: { floor: "#3c3252", moss: "#6a3a9a", wall: "#4a3e5c", darkness: 0.5, bg: "#07040c" }, build: (w) => b2Pillars(w, [[-4, -4], [4, 4], [-4, 4], [4, -4], [0, -7], [0, 7]]) },
    create: (x, y, level) => b2MakeBoss("b2_shadowBoss", x, y, level, 3.2),
  },
};
for (const [mapId, def] of Object.entries(B2_DEFS)) {
  def.phases = MONSTERS[def.id].phases;
  BOSS_DEFS[mapId] = def;
}
