// ===== 기믹 안내 =====
// 보스·몬스터가 큰 기술을 쓰면 "뭘 해야 하는지"를 알려줘요.
//   1) 화면 위쪽 큰 글자 배너 (아이콘 + 짧은 문장)
//   2) 안전한 곳을 금색(+흰 테두리)으로 바닥에 칠하기: 기둥 뒤, 고리 가운데, 폭풍 안쪽, 모래섬, 깰 수정
//   3) 목소리 안내 (브라우저 음성, 한국어) - 단계가 바뀔 때나 큰 기믹처럼 여유 있는 순간에만
//   4) 처음 보는 기술은 (쉬움에서) 잠깐 느린 화면으로 설명
//   5) 쓰러진 이유: 다시 도전 화면·결과창에 "쓰러진 이유: 기술 → 이렇게 해요"
// 난이도별: 쉬움·보통 = 전부, 어려움 = 글자만(보스 기술, 짧게), 악몽 = 안내 없음 (예고 장판만)
// 메뉴 "안내" 로 바꿀 수 있어요: 자동 → 글자+목소리 → 글자만 → 끄기
// 색 규칙은 abilities.js 의 GUIDE_COLORS (docs/guide.md)
// 다른 파일은 hooks.js 알림 지점으로만 연결해요.

// ----- 아이 눈높이 안내 문장 (기술 id -> 문장) -----
//   do: true    = "해야 할 일" (금색 아이콘)
//   voice: true = 보스가 쓰면 목소리로도 알려줘요 (큰 기믹)
//   noBanner    = 보스 파일이 이미 같은 말을 화면에 띄워서 글자 배너는 생략 (목소리만)
const GUIDE_TEXT = {
  slam: { text: "빨간 원 밖으로!" },
  fireBreath: { text: "불 숨결! 옆으로 돌아가요" },
  frostBreath: { text: "얼음 숨결! 부채꼴 밖으로" },
  charge: { text: "돌진! 옆으로 비켜요" },
  beam: { text: "빛줄기! 옆으로 한 걸음" },
  shockRing: { text: "금색 가운데가 안전해요!", do: true },
  meteorRain: { text: "원 사이 빈 곳으로!" },
  trackingStrike: { text: "계속 움직이다 빠져요!" },
  summonMinions: { text: "지금 때리면 끊겨요!", do: true },
  shield: { text: "보호막! 세게 몰아쳐요", do: true },
  healAllies: { text: "치유를 끊어요! 화살 쏴요", do: true },
  rallyCry: { text: "함성 몬스터부터 잡아요", do: true },
  pull: { text: "보라 원 밖으로!" },
  repelBlast: { text: "뒤로 물러나요!" },
  blink: { text: "보라 원에서 떨어져요!" },
  nova: { text: "구슬 사이로 빠져요" },
  volley: { text: "옆으로 돌아요!" },
  poisonPool: { text: "초록 웅덩이 밟지 마요" },
  webTrap: { text: "거미줄을 돌아가요" },
  selfDestruct: { text: "터져요! 멀리 도망!" },
  enrage: { text: "화났어요! 피하면서 싸워요", voice: true },
  groundSpikes: { text: "가시 줄 옆으로!" },
  bossSlam: { text: "원 밖으로! 그다음 공격!" },
  sporeCloud: { text: "초록 구름 밖에서 싸워요" },
  sporeRain: { text: "원 사이로 걸어가요" },
  mushroomCall: { text: "부를 때 때리면 끊겨요!", do: true },
  boneSlam: { text: "피하고 박힌 주먹을 때려요!", do: true },
  boulderToss: { text: "바위를 피해요. 숨을 곳이 생겨요" },
  giantRoar: { text: "바위 뒤에 숨어요!", do: true, voice: true },
  stompRing: { text: "발밑 금색 안으로!", do: true },
  slimeJump: { text: "그림자가 멈추면 빠져요!" },
  slimeCall: { text: "먹보를 먼저 잡아요!", do: true, voice: true, noBanner: true },
  checkerRain: { text: "원 없는 칸으로!" },
  bandagePull: { text: "보라 원 밖으로! 끌리면 구르기" },
  pharaohSmash: { text: "원 밖으로 굴러요!" },
  sandRain: { text: "원 사이로 움직여요" },
  sandstorm: { text: "멀리 떨어져요!" },
  arrowTraps: { text: "빈 줄에 서요!", do: true, voice: true },
  iceLance: { text: "옆으로 한 걸음!" },
  frostNova: { text: "얼음 기둥 뒤에 숨어요!", do: true, voice: true },
  iceShield: { text: "빛나는 화로를 때려서 갑옷을 녹여요!", do: true, voice: true },
  blizzard: { text: "눈보라를 끌고 다녀요" },
  layEggs: { text: "알부터 깨요!", do: true, voice: true, noBanner: true },
  ceilingDrop: { text: "그림자가 멈추면 빠져요!" },
  b2_tailSwipe: { text: "용 뒤는 위험! 옆으로" },
  b2_deepBreath: { text: "큰 불길! 양옆으로 피해요", voice: true },
  b2_lavaCrack: { text: "용암 밟지 마요!" },
  b2_summonWhelps: { text: "새끼 용을 정리해요", do: true },
  b2_summonGuards: { text: "부르는 동안 공격!", do: true },
  b2_soulOrbs: { text: "계속 움직여요!" },
  b2_deathWave: { text: "때려서 끊어요! 못 끊으면 구르기", do: true, voice: true },
  b2_clones: { text: "그림자 진한 게 진짜예요", do: true, voice: true },
  b2_crystalShield: { text: "수정을 부숴요!", do: true, voice: true, noBanner: true },
  b2_spinBeams: { text: "광선을 따라 같이 돌아요", voice: true },
  b2_gust: { text: "부채꼴 밖으로! 벽 등지지 마요" },
  b2_stormRing: { text: "가운데 금색 안으로!", do: true, voice: true, noBanner: true },
  b2_tentacles: { text: "촉수를 먼저 끊어요", do: true },
  b2_tide: { text: "금색 모래섬 위로!", do: true, voice: true, noBanner: true },
  b2_inkCloud: { text: "먹물 밖으로 나와요" },
  b2_fearRune: { text: "보라 원 밖으로!" },
  b2_doomBlast: { text: "기둥 뒤에 숨어요!", do: true, voice: true },
  snipe: { text: "조준선 옆으로 한 걸음!" },
  summonBones: { text: "피리 불 때 끊어요!", do: true },
  spinAttack: { text: "한 걸음 물러나요" },
  frostOrb: { text: "하늘색 원 밖으로!" },
  jail: { text: "보라 원 밖으로!" },
  stickyGoo: { text: "젤리를 돌아가요" },
};

// 보스 단계가 바뀔 때 목소리 (보스 파일이 화면 글자는 이미 띄우는 것들)
const GUIDE_PHASE_VOICE = {
  volcano: { 1: "용이 날아올랐어요. 화살로 쏘세요!" },
  ice: { 1: "얼음 기둥이 솟았어요. 서리 폭발 때 숨어요!" },
  desert: { 1: "석관을 부숴야 파라오가 아파해요!" },
  mine: { 1: "곧 수정 보호막이 생겨요. 수정을 부숴요!" },
  void: { 1: "종말의 폭발이 와요. 기둥 뒤에 숨어요!" },
};

// 설명이 없는 기술은 counter 를 짧게 줄여 써요
function guideLine(id) {
  const g = GUIDE_TEXT[id];
  if (g) return g;
  const ab = typeof ABILITIES !== "undefined" ? ABILITIES[id] : null;
  if (!ab) return null;
  let t = (ab.counter || ab.name || "").split(/[.(]/)[0].trim();
  if (t.length > 18) t = t.slice(0, 17) + "…";
  return { text: t || ab.name };
}

// ----- 설정 (저장: profile.settings.guide, profile.guideSeen) -----
const GUIDE_MODES = ["auto", "full", "text", "off"];
const GUIDE_MODE_NAMES = { auto: "자동", full: "글자+목소리", text: "글자만", off: "끄기" };
function guideFields(pr) {
  if (!pr) return;
  pr.settings = pr.settings || {};
  if (!GUIDE_MODES.includes(pr.settings.guide)) pr.settings.guide = "auto";
  pr.guideSeen = pr.guideSeen || {};
}
hookOn("profileLoaded", guideFields, 20);
guideFields(typeof game !== "undefined" ? game.profile : null); // 이 파일보다 먼저 읽힌 저장

// 지금 안내 수준: "full" | "text" | "none"
function guideLevel() {
  const pr = game.profile;
  guideFields(pr);
  const mode = pr.settings.guide;
  if (mode === "off") return "none";
  if (mode === "full") return "full";
  if (mode === "text") return "text";
  const d = pr.difficulty || "normal";
  return d === "nightmare" ? "none" : d === "hard" ? "text" : "full";
}

hookOn("menuItems", (items) => {
  const pr = game.profile;
  guideFields(pr);
  const mode = pr.settings.guide;
  const now = guideLevel();
  const label = mode === "auto" ? `안내: 자동 (지금 ${now === "full" ? "글자+목소리" : now === "text" ? "글자만" : "없음"})` : `안내: ${GUIDE_MODE_NAMES[mode]}`;
  items.push({ label, act: () => {
    pr.settings.guide = GUIDE_MODES[(GUIDE_MODES.indexOf(mode) + 1) % GUIDE_MODES.length];
    saveProfile();
    const lv = guideLevel();
    showMessage(`안내: ${GUIDE_MODE_NAMES[pr.settings.guide]}${pr.settings.guide === "auto" ? " (쉬움·보통 전부, 어려움 글자만, 악몽 없음)" : ""}`, 2.5);
    if (lv === "full") guideSpeak("목소리 안내를 켰어요", "menu", 99);
    else guideVoiceStop();
  } });
}, 50);

// ----- 상태 -----
const guide = {
  banner: null,          // { text, sub, kind, until, start }
  lastText: "", lastAt: -99,
  runShown: {},          // 이 판에서 배너를 보여준 일반 몬스터 기술
  voiceCount: {},        // 같은 말은 처음 1~2번만
  lastHit: null,         // 마지막으로 나를 아프게 한 것
  death: null,           // 쓰러진 이유
  resolving: null,       // 지금 효과가 터지는 기술
  safeCache: null,       // 기둥 뒤 안전 칸 (잠깐씩 다시 계산)
};

hookOn("reset", () => {
  guide.banner = null; guide.lastText = ""; guide.runShown = {}; guide.voiceCount = {}; guide.lastHit = null; guide.resolving = null; guide.safeCache = null;
  game.slowT = 0;
  guideVoiceStop();
}, 40);
hookOn("dungeonStarted", () => { guide.death = null; }, 40);

// ----- 목소리 -----
let guideKoVoice = null;
function guidePickVoice() {
  try {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    guideKoVoice = vs.find((v) => /^ko/i.test(v.lang)) || vs.find((v) => /ko|korean/i.test(v.lang + v.name)) || null;
  } catch (e) { guideKoVoice = null; }
}
if (typeof window !== "undefined" && window.speechSynthesis) {
  guidePickVoice();
  try { speechSynthesis.addEventListener("voiceschanged", guidePickVoice); } catch (e) { /* 옛 브라우저 */ }
}
function guideVoiceStop() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* 무시 */ } }
// key 가 같은 말은 max 번까지만 (보스방마다 새로 세요)
function guideSpeak(text, key = text, max = 2) {
  if (guideLevel() !== "full" || muted) return false;
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return false;
  const n = guide.voiceCount[key] || 0;
  if (n >= max) return false;
  guide.voiceCount[key] = n + 1;
  try {
    speechSynthesis.cancel(); // 겹치면 앞 말은 멈춰요
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    if (guideKoVoice) u.voice = guideKoVoice;
    u.rate = 1.08; u.pitch = 1.1; u.volume = 1;
    speechSynthesis.speak(u);
    guide.lastSpoken = text;
    return true;
  } catch (e) { return false; }
}

// ----- 배너 -----
function guideKind(id) {
  const g = GUIDE_TEXT[id];
  if (g && g.do) return "safe";
  const ab = ABILITIES[id];
  if (!ab) return "danger";
  const c = telegraphColor({ id, ab });
  for (const k of Object.keys(GUIDE_COLORS)) if (GUIDE_COLORS[k] === c) return k;
  return "danger";
}
function guideShowBanner(text, kind = "danger", dur = 2.2, sub = null) {
  if (!text) return false;
  if (text === guide.lastText && game.time - guide.lastAt < 5 && !sub) return false; // 같은 말 연속 반복 막기
  guide.lastText = text; guide.lastAt = game.time;
  guide.banner = { text, sub, kind, start: game.time, until: game.time + dur };
  return true;
}

// 기술 예고가 시작될 때
hookOn("castStarted", (m, id) => {
  if (!m || m === game.player || game.scene !== "dungeon") return;
  const lv = guideLevel();
  if (lv === "none") return;
  if (!casts.some((c) => c.m === m && c.id === id)) return; // 실제로 시작 안 됨
  const g = guideLine(id);
  if (!g) return;
  const isBoss = !!m.boss;
  const ab = ABILITIES[id];
  const pr = game.profile;
  // 처음 보는 기술 (쉬움 + 전부 안내일 때): 잠깐 느린 화면으로 설명
  if (lv === "full" && pr.difficulty === "easy" && !pr.guideSeen[id] && (isBoss || m.elite || g.do)) {
    pr.guideSeen[id] = 1;
    saveProfile();
    game.slowT = 0.8; game.slowK = 0.35;
    guide.lastText = "";
    guideShowBanner(g.text, guideKind(id), 3.2, `처음 보는 기술: ${ab.name}`);
    if (isBoss) guideSpeak(g.text, "first:" + id, 1);
    return;
  }
  if (lv === "text") {
    if (!isBoss) return; // 어려움: 보스 기술만, 짧게
    if (!g.noBanner) guideShowBanner(g.text, guideKind(id), 1.4);
    return;
  }
  // 전부 안내
  if (!isBoss) {
    if (guide.runShown[id]) return; // 일반 몬스터 기술은 한 판에 한 번만
    guide.runShown[id] = true;
  }
  if (!g.noBanner) guideShowBanner(g.text, guideKind(id), isBoss ? 2.3 : 1.8);
  if (isBoss && g.voice) guideSpeak(g.text, "ab:" + id, 2);
}, 50);

// 보스 단계 바뀜 + 날기 같은 상태 지켜보기 (매 프레임)
hookOn("abilitiesUpdated", () => {
  const lv = guideLevel();
  for (const m of monsters) {
    if (!m.boss || m.hp <= 0) continue;
    const idx = m.phaseIndex !== undefined ? m.phaseIndex : m.phaseIdx !== undefined ? m.phaseIdx : m.phase;
    if (idx === undefined) continue;
    if (m._gPhase !== undefined && idx !== m._gPhase && lv !== "none") {
      const mapId = game.mapDef && game.mapDef.id;
      const special = GUIDE_PHASE_VOICE[mapId] && GUIDE_PHASE_VOICE[mapId][idx];
      if (special) guideSpeak(special, `phase:${mapId}:${idx}`, 1);
      else {
        guideShowBanner(`${idx + 1}단계! 새 기술이 와요`, "danger", 2);
        guideSpeak(`${idx + 1}단계! 새 기술이 와요. 조심해요`, `phase:${idx}`, 1);
      }
    }
    m._gPhase = idx;
  }
}, 60);

// ----- 쓰러진 이유 -----
// 효과가 터지는 순간의 기술을 기억해요 (다른 파일보다 먼저: 순서 0)
hookOn("resolveCast", (c) => { guide.resolving = c; return false; }, 0);
hookOn("castResolved", () => { guide.resolving = null; }, 99);
hookOn("playerHurt", (p, damage, from, hp0) => {
  if (!(p.hp < hp0)) return;
  let id = null;
  if (guide.resolving) id = guide.resolving.id;
  else if (from && from.def && from.lastCastId && from.boss && game.time - (from._gLastCastAt || -99) < 6) id = from.lastCastId;
  let name, tip;
  if (id && ABILITIES[id]) {
    name = ABILITIES[id].name;
    tip = (guideLine(id) || {}).text;
  } else if (from && from.def) {
    name = `${from.name || from.def.name}의 공격`;
    tip = from.boss ? "빨간 장판을 피하고, 비틀거릴 때 공격해요" : "구르기로 피하고, 하트가 적으면 물약(Q)!";
  } else if (zones.some((z) => Math.hypot(z.x - p.x, z.y - p.y) < z.radius)) {
    name = "바닥 장판"; tip = "초록·빨간 바닥 위에 서 있지 마요";
  } else if (typeof b2Field !== "undefined" && b2Field) {
    const t = b2Field.kind === "tide" ? "b2_tide" : "b2_stormRing";
    name = ABILITIES[t] ? ABILITIES[t].name : "폭풍"; tip = (guideLine(t) || {}).text;
  } else {
    name = "함정"; tip = "바닥을 잘 보고 피해요";
  }
  guide.lastHit = { id, name, tip, by: from && from.name, t: game.time, damage };
  if (p.hp <= 0) { guide.death = { ...guide.lastHit, map: game.mapDef && game.mapDef.name }; guide.deathHidden = false; }
}, 10);
hookOn("castStarted", (m) => { if (m) m._gLastCastAt = game.time; }, 10);

// 다시 도전 화면 / 결과창에서 써요
function guideDeathCause() { return guide.death; }
function drawDeathCause(cx, y, maxW) {
  const d = guide.death;
  if (!d) return false;
  const line = d.tip ? `${d.name} → ${d.tip}` : d.name;
  let size = 17;
  ctx.font = `bold ${size}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  const w0 = ctx.measureText("쓰러진 이유: " + line).width;
  if (w0 > maxW - 40) size = Math.max(12, Math.floor(size * (maxW - 40) / w0));
  drawGuideIcon(cx - Math.min(maxW - 40, w0) / 2 - 12, y - size * 0.35, 10, "danger");
  text("쓰러진 이유: " + line, cx + 8, y, size, "#ffd0a0", "center");
  return true;
}

// 실패 결과창의 쓰러진 이유 상자: 결과창 빈 칸(로비로 버튼 위)에, 자리가 없으면 창 아래나 화면 위에.
// ✕ 로 닫을 수 있어요. 상자는 drawInfoBox (예전엔 drawPanel 이라 화면 전체 누르기를 막아 '로비로'가 안 눌렸어요)
hookOn("resultSlot", (cx, top, bottom, pw, panelBottom) => {
  const r = game.result;
  if (!r || r.win || r.retry || !guide.death || guide.deathHidden) return;
  const bh = 44, bw = Math.min(pw - 24, view.w - 16);
  let by;
  if (bottom - top >= bh) by = bottom - bh;
  else if (panelBottom + 8 + bh <= view.h) by = panelBottom + 8;
  else by = 6;
  const bx = cx - bw / 2;
  drawInfoBox(bx, by, bw, bh);
  drawDeathCause(cx - 18, by + 28, bw - 56);
  drawButton(bx + bw - 42, by + 5, 36, 34, "✕", () => { guide.deathHidden = true; }, { size: 18 });
}, 50);

// ----- 그리기: 아이콘 -----
function drawGuideIcon(x, y, r, kind) {
  const c = GUIDE_COLORS[kind] || GUIDE_COLORS.danger;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = "#ffffff"; ctx.stroke();
  ctx.fillStyle = kind === "safe" || kind === "ally" ? "#3a2a00" : "#ffffff";
  ctx.font = `bold ${Math.round(r * 1.5)}px sans-serif`; ctx.textAlign = "center";
  ctx.fillText(kind === "safe" ? "★" : "!", x, y + r * 0.52);
}

// ----- 그리기: 배너 (HUD) -----
hookOn("hudDraw", () => {
  if (game.scene !== "dungeon" || game.overlay) return;
  const W = view.w, H = view.h;
  const lv = guideLevel();
  let b = guide.banner;
  if (b && game.time > b.until) b = guide.banner = null;
  // 용이 날고 있으면 계속 알려줘요
  const flyer = lv !== "none" && monsters.find((m) => m.boss && m.flying && m.hp > 0);
  if (flyer && b && !b.sub && !b.sticky) b = { ...b, sub: touch.show ? "용이 날고 있어요: 활 버튼으로!" : "용이 날고 있어요: 활(L)로!" };
  if (flyer && !b) b = { text: touch.show ? "날고 있어요! 활 버튼으로 쏴요" : "날고 있어요! 활(L)로 쏴요", kind: "safe", start: game.time - 1, until: game.time + 1, sticky: true };
  if (b) {
    const k = b.sticky ? 0.85 : Math.min(1, (game.time - b.start) * 6, (b.until - game.time) * 3);
    const size = 24, y = Math.max(108, H * 0.3);
    ctx.save();
    ctx.globalAlpha = Math.max(0, k);
    ctx.font = `bold ${size}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
    const tw = ctx.measureText(b.text).width;
    const bw = Math.min(W - 20, tw + 76), bh = b.sub ? 66 : 46;
    // 가운데 메시지가 떠 있으면 그 아래로, 그리고 버튼에 가리지 않게
    const mr = game.messageTimer > 0 && game.lastMsgRect ? game.lastMsgRect : null;
    const below = mr ? mr.y + mr.h + 8 : 0;
    const want = Math.max(y - 32 - (b.sub ? 18 : 0), below);
    const x0 = (W - bw) / 2, y0 = typeof hudAvoidY === "function" ? hudAvoidY((W - bw) / 2, want, bw, bh, Math.max(76, below)) : want;
    guide.lastBannerRect = { x: x0, y: y0, w: bw, h: bh };
    roundRectPath(x0, y0, bw, bh, 12);
    ctx.fillStyle = "rgba(10,10,20,0.72)"; ctx.fill();
    const col = GUIDE_COLORS[b.kind] || GUIDE_COLORS.danger;
    ctx.lineWidth = 3; ctx.strokeStyle = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.stroke();
    if (b.sub) text(b.sub, W / 2, y0 + 22, 15, "#ffe9a8", "center");
    const ty = y0 + bh - 15;
    drawGuideIcon(x0 + 24, ty - 8, 13, b.kind);
    text(b.text, W / 2 + 14, ty, size, b.kind === "safe" ? "#ffe27a" : "#ffffff", "center");
    ctx.restore();
  }
  // 날고 있을 때 활 버튼 강조 (터치). 터치 버튼은 실제 화면 크기 기준이라 잠깐 배율을 풀고 그려요
  if (flyer && touch.show) {
    const scaled = typeof uiK === "number" && uiK < 1 && uiSaved;
    ctx.save();
    const vw = view.w, vh = view.h;
    if (scaled) { ctx.scale(1 / uiK, 1 / uiK); view.w = uiSaved.w; view.h = uiSaved.h; }
    const bow = touchButtons().find((t) => t.code === "TouchBow");
    if (bow) {
      const pulse = 1 + 0.12 * Math.sin(game.time * 8);
      ctx.beginPath(); ctx.arc(bow.x, bow.y, bow.r * 1.3 * pulse, 0, Math.PI * 2);
      ctx.lineWidth = 7; ctx.strokeStyle = "rgba(255,214,70,0.95)"; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#ffffff"; ctx.stroke();
    }
    view.w = vw; view.h = vh;
    ctx.restore();
  }
}, 60);

// ----- 그리기: 안전한 곳 (바닥, 기술 예고 위) -----
const GOLD = "255,214,70";
function goldEllipse(x, y, r, alpha = 0.35) {
  const c = toScreen(x, y, 0.03), e = floorEllipse(r);
  ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${GOLD},${alpha})`; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
}

// 보스가 "보이면 아픈" 공격을 준비할 때, 안 보이는 칸(기둥·바위 뒤)
function hideBlastCast() {
  return casts.find((c) => c.m && c.m.hp > 0 && (c.ab.effect.type === "losBlast" || c.ab.effect.type === "b2_hideBlast"));
}
function computeSafeCells(c) {
  const m = c.m, e = c.ab.effect, step = 0.5, cells = new Set();
  const N = world.W, cx = N / 2, cy = world.H / 2;
  for (let y = 1; y < world.H - 1; y += step) {
    for (let x = 1; x < world.W - 1; x += step) {
      const px = x + step / 2, py = y + step / 2;
      const row = world.tiles[Math.floor(py)];
      if (!row || row[Math.floor(px)] !== 0) continue;
      if (Math.hypot(px - cx, py - cy) > N / 2) continue;
      const safe = e.type === "losBlast" ? (typeof coverBetween === "function" && coverBetween(m.x, m.y, px, py, e.cover)) : !lineOfSight(m.x, m.y, px, py);
      if (safe) cells.add(`${x},${y}`);
    }
  }
  return { cast: c, cells, step, at: game.time, mx: m.x, my: m.y };
}
function drawSafeCells(sc) {
  const s = sc.step;
  const pulse = 0.42 + 0.14 * Math.sin(game.time * 6);
  for (const key of sc.cells) {
    const [x, y] = key.split(",").map(Number);
    const pts = [toScreen(x, y, 0.03), toScreen(x + s, y, 0.03), toScreen(x + s, y + s, 0.03), toScreen(x, y + s, 0.03)];
    fillPoly(pts, `rgba(${GOLD},${pulse})`);
  }
  // 흰 테두리: 이웃이 안전하지 않은 쪽만
  ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const key of sc.cells) {
    const [x, y] = key.split(",").map(Number);
    const has = (dx, dy) => sc.cells.has(`${x + dx * s},${y + dy * s}`);
    const seg = (ax, ay, bx, by) => { const a = toScreen(ax, ay, 0.03), b = toScreen(bx, by, 0.03); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); };
    if (!has(0, -1)) seg(x, y, x + s, y);
    if (!has(1, 0)) seg(x + s, y, x + s, y + s);
    if (!has(0, 1)) seg(x, y + s, x + s, y + s);
    if (!has(-1, 0)) seg(x, y, x, y + s);
  }
  ctx.stroke();
}

hookOn("drawTelegraphsAfter", () => {
  if (game.scene !== "dungeon" || guideLevel() !== "full") return;
  ctx.save();
  // 1) 기둥·바위 뒤
  const hc = hideBlastCast();
  if (hc) {
    const sc = guide.safeCache;
    if (!sc || sc.cast !== hc || game.time - sc.at > 0.25 || Math.hypot(sc.mx - hc.m.x, sc.my - hc.m.y) > 0.3) guide.safeCache = computeSafeCells(hc);
    drawSafeCells(guide.safeCache);
  } else guide.safeCache = null;
  // 2) 고리 공격: 가운데가 안전
  for (const c of casts) {
    if (c.ab.telegraph.shape === "ring" && c.inner > 0.6) goldEllipse(c.x, c.y, c.inner * 0.8, 0.3 + 0.1 * Math.sin(game.time * 8));
  }
  // 3) 폭풍 고리 안쪽 / 밀물 모래섬
  if (typeof b2Field !== "undefined" && b2Field) {
    const f = b2Field;
    if (f.kind === "storm" && f.r) goldEllipse(world.W / 2, world.H / 2, f.r, 0.12);
    if (f.kind === "tide" && f.islands) for (const s of f.islands) goldEllipse(s.x, s.y, 1.6, 0.3 + 0.1 * Math.sin(game.time * 6));
  }
  // 4) 깨야 하는 수정·켜진 화로: 바닥 금색 원 + 위에 깜빡이는 화살표
  const goldArrow = (x, y, h) => {
    goldEllipse(x, y, 0.75, 0.35 + 0.15 * Math.sin(game.time * 8));
    const t = toScreen(x, y, h + 0.15 * Math.sin(game.time * 6)), s = 10 * ZOOM;
    ctx.beginPath(); ctx.moveTo(t.x - s, t.y - s); ctx.lineTo(t.x + s, t.y - s); ctx.lineTo(t.x, t.y + s * 0.6); ctx.closePath();
    ctx.fillStyle = `rgba(${GOLD},0.95)`; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
  };
  for (const b of monsters) if (b.type === "fireBrazier" && b.lit && b.hp > 0) goldArrow(b.x, b.y, 1.9);
  for (const m of monsters) {
    if (!m.boss || m.hp <= 0 || !m.crystals) continue;
    for (const cr of m.crystals) {
      if (cr.hp <= 0) continue;
      goldEllipse(cr.x, cr.y, 0.75, 0.35 + 0.15 * Math.sin(game.time * 8));
      const t = toScreen(cr.x, cr.y, 2.0 + 0.15 * Math.sin(game.time * 6));
      const s = 10 * ZOOM;
      ctx.beginPath(); ctx.moveTo(t.x - s, t.y - s); ctx.lineTo(t.x + s, t.y - s); ctx.lineTo(t.x, t.y + s * 0.6); ctx.closePath();
      ctx.fillStyle = `rgba(${GOLD},0.95)`; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
    }
  }
  ctx.restore();
}, 80);
