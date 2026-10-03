// ===== 직업 4개: 전사 · 사냥꾼 · 마법사 · 드루이드 =====
// 설계서: docs/design/classes.md
// - 게임 함수를 감싸지 않아요. hooks.js 알림 지점만 써요.
// - 힘 막대·쿨다운·늑대·곰 변신은 모두 "주인공마다"(p.cls, p.res, p.cd ...) 따로 가져요. (같이 하기에서 그대로 써요)
// - W = 그 직업의 주 무기 공격력 (전사·마법사·드루이드: 무기 강화, 사냥꾼: 활 강화)

const CLASS_ORDER = ["warrior", "hunter", "mage", "druid"];
const CLASS_DEFS = {
  warrior: {
    name: "전사", color: "#e25555", icon: "sword", hpMul: 1.0, speed: 0, dmgMul: 1.2,
    desc: "앞에서 부딪치는 힘! 무기 연속기와 회오리 베기",
    res: { name: "분노", color: "#ff5a4a", rule: "때리거나 맞으면 차요 · 가만히 있으면 줄어요" },
    style: null,
  },
  hunter: {
    name: "사냥꾼", color: "#4caf50", icon: "bow", hpMul: 0.92, speed: 0.08, dmgMul: 0.7,
    desc: "멀리서 피하며 쏘기! 공격 버튼이 활이에요 (보통 화살 무한)",
    res: { name: "집중", color: "#7ddc5a", rule: "저절로 빨리 차요 · 서 있으면 더 빨리" },
    style: "dagger",
  },
  mage: {
    name: "마법사", color: "#4f7dff", icon: "orb", hpMul: 0.85, speed: 0, dmgMul: 0.72,
    desc: "큰 마법 한 방! 몸은 조금 약해요",
    res: { name: "마나", color: "#5aa8ff", rule: "저절로 천천히 차요 · 구슬이 맞으면 조금 더" },
    style: "staff", orb: "#9fd0ff",
  },
  druid: {
    name: "드루이드", color: "#8bc34a", icon: "staff", hpMul: 0.97, speed: 0, dmgMul: 0.75,
    desc: "동물 친구와 함께! 늑대를 부르고 큰 곰으로 변신",
    res: { name: "기운", color: "#b6e35a", rule: "지팡이로 때리면 차요 · 저절로 조금" },
    style: "staff", orb: "#9be86a",
  },
};

// 기술 표 (check.mjs 가 검사하고 gen-docs 가 docs/classes.md 를 만들어요)
// slot: basic / s1 / s2 / ult · unlock: 필요한 레벨 · cost: 힘 막대 · cooldown: 초 · dmg: W 배수(설명용)
const PLAYER_SKILLS = {
  w_basic: { cls: "warrior", slot: "basic", unlock: 1, cost: 0, cooldown: 0, name: "연속 베기", short: "공격", icon: "sword", ref: "Bash / Frenzy", dmg: "1.0~1.9W", desc: "고른 무기의 3단 연속기 (지금 칼 공격 그대로)", kidText: "공격 버튼을 연달아 눌러요!" },
  w_whirl: { cls: "warrior", slot: "s1", unlock: 3, cost: 18, costPerSec: true, cooldown: 0, name: "회오리 베기", short: "회오리", icon: "whirl", ref: "Whirlwind", dmg: "0.5W / 0.25초",
    desc: "누르고 있는 동안 빙글빙글 돌며 걸어요. 둘레 1.6칸 모두 맞아요", kidText: "누르고 있으면 빙글빙글!",
    mods: { A: { name: "빨아들이는 바람", desc: "몬스터를 살짝 끌어당겨요" }, B: { name: "불꽃 자국", desc: "지나간 자리에 불꽃이 남아요" } } },
  w_leap: { cls: "warrior", slot: "s2", unlock: 8, cost: 25, cooldown: 8, name: "점프 찍기", short: "점프", icon: "leap", ref: "Leap Attack", dmg: "2.0W",
    desc: "적 무리로 뛰어올라 쿵! 공중에선 안 맞고, 둘레 2칸이 1초 기절", kidText: "점프해서 쿵!",
    mods: { A: { name: "두 번 쿵", desc: "착지 충격파가 두 번" }, B: { name: "빠른 점프", desc: "쿨다운 6초, 범위 조금 작게" } } },
  w_shout: { cls: "warrior", slot: "ult", unlock: 15, cost: 0, cooldown: 40, name: "함성", short: "함성", icon: "shout", ref: "Battle Cry / War Cry", dmg: "-",
    desc: "우리 편 하트 30% 회복 + 8초 공격력 +30%, 둘레 몬스터는 겁먹고 밀려나요", kidText: "와아아! 힘이 솟아요" },

  h_basic: { cls: "hunter", slot: "basic", unlock: 1, cost: 0, cooldown: 0, name: "활 쏘기", short: "쏘기", icon: "bow", ref: "Hungering Arrow", dmg: "1.0W", desc: "가까운 적을 자동으로 겨냥해 화살을 계속 쏴요. 보통 화살 무한", kidText: "누르고 있으면 계속 쏴요!" },
  h_multi: { cls: "hunter", slot: "s1", unlock: 3, cost: 25, cooldown: 0, name: "여러 발 쏘기", short: "여러 발", icon: "multi", ref: "Multishot", dmg: "0.75W x7",
    desc: "부채꼴로 화살 7발, 한 마리씩 뚫어요", kidText: "화살 7발 펑!",
    mods: { A: { name: "불화살", desc: "모두 불화살 (불붙음)" }, B: { name: "얼음 화살", desc: "모두 얼음 화살 (느려짐)" } } },
  h_vault: { cls: "hunter", slot: "s2", unlock: 8, cost: 0, cooldown: 6, name: "공중제비", short: "공중제비", icon: "vault", ref: "Vault, Spike Trap", dmg: "1.2W",
    desc: "뒤로 3칸 공중제비(안 맞아요), 떠난 자리에 가시 덫 (최대 3개)", kidText: "휙! 뒤로 피하고 덫 깔기",
    mods: { A: { name: "덫 두 개", desc: "덫이 2개씩" }, B: { name: "두 번 공중제비", desc: "2번까지 연속으로" } } },
  h_rain: { cls: "hunter", slot: "ult", unlock: 15, cost: 0, cooldown: 40, name: "화살비", short: "화살비", icon: "rain", ref: "Rain of Vengeance", dmg: "0.5W x12",
    desc: "적 무리 위에 3초 동안 화살비 12번", kidText: "하늘에서 화살이 쏟아져요!" },

  m_basic: { cls: "mage", slot: "basic", unlock: 1, cost: 0, cooldown: 0, name: "마법 구슬", short: "구슬", icon: "orb", ref: "Magic Missile", dmg: "0.9W", desc: "적을 살짝 따라가는 마법 구슬", kidText: "반짝 구슬 발사!" },
  m_fire: { cls: "mage", slot: "s1", unlock: 3, cost: 20, cooldown: 0, name: "불덩이", short: "불덩이", icon: "fireball", ref: "Fireball", dmg: "2.2W",
    desc: "날아가 터지는 불덩이, 둘레 1.6칸 + 불붙음", kidText: "불덩이 펑!",
    mods: { A: { name: "세 갈래", desc: "작은 불덩이 3개" }, B: { name: "큰 폭발", desc: "폭발 범위 2.4칸" } } },
  m_blink: { cls: "mage", slot: "s2", unlock: 8, cost: 15, cooldown: 5, name: "순간이동", short: "순간이동", icon: "blink", ref: "Teleport, Frost Nova", dmg: "0.6W",
    desc: "4칸 순간이동, 떠난 자리 둘레 2칸을 얼려요 (보스는 느려짐)", kidText: "슝! 얼음 고리",
    mods: { A: { name: "양쪽 고리", desc: "도착한 자리에도 얼음 고리" }, B: { name: "빠른 순간이동", desc: "쿨다운 3초, 고리 없음" } } },
  m_meteor: { cls: "mage", slot: "ult", unlock: 15, cost: 0, cooldown: 40, name: "운석", short: "운석", icon: "meteor", ref: "Meteor", dmg: "6W",
    desc: "금색 원 1초 뒤 운석 쿵! 둘레 3칸 + 불타는 땅", kidText: "하늘에서 큰 돌이 쿵!" },

  d_basic: { cls: "druid", slot: "basic", unlock: 1, cost: 0, cooldown: 0, name: "덩굴 지팡이", short: "공격", icon: "staff", ref: "Maul / Earth Spike", dmg: "1.0~1.4W", desc: "지팡이 연속기, 3번째는 앞으로 가시 덩굴이 솟아요", kidText: "세 번째엔 덩굴이 쑥!" },
  d_wolf: { cls: "druid", slot: "s1", unlock: 3, cost: 40, cooldown: 0, name: "늑대 부르기", short: "늑대", icon: "wolf", ref: "Summon Spirit Wolf", dmg: "0.35W / 물기",
    desc: "늑대 친구들을 불러요(변형 A 3마리, B 2마리). 이미 있으면 '덮쳐!' (기운 15)", kidText: "늑대야 도와줘!",
    mods: { A: { name: "늑대 셋", desc: "늑대 3마리 (조금 약해요)" }, B: { name: "고마운 늑대", desc: "늑대가 물면 내 하트가 조금 차요" } } },
  d_tornado: { cls: "druid", slot: "s2", unlock: 8, cost: 25, cooldown: 0, name: "회오리바람", short: "바람", icon: "tornado", ref: "Tornado", dmg: "0.3W / 0.2초",
    desc: "앞으로 구불구불 가는 회오리, 몬스터를 살짝 끌어당겨요", kidText: "회오리야 가라!",
    mods: { A: { name: "회오리 둘", desc: "회오리 2개" }, B: { name: "머무는 회오리", desc: "제자리에서 3초 머물러요" } } },
  d_bear: { cls: "druid", slot: "ult", unlock: 15, cost: 0, cooldown: 45, name: "곰 변신", short: "곰", icon: "bear", ref: "Werebear", dmg: "1.6배",
    desc: "12초 동안 통통한 큰 곰! 하트 +50%, 공격이 1.6배", kidText: "으르렁! 곰이 됐어요" },
};
const SKILL_SLOTS = ["s1", "s2", "ult"];
function classSkill(cls, slot) { for (const [id, s] of Object.entries(PLAYER_SKILLS)) if (s.cls === cls && s.slot === slot) return { id, ...s }; return null; }

// ----- 저장 -----
hookOn("profileLoaded", (pr) => {
  if (!CLASS_DEFS[pr.cls]) pr.cls = "warrior";
  pr.skillMods = pr.skillMods || {};
  for (const c of CLASS_ORDER) pr.skillMods[c] = { s1: "A", s2: "A", ...(pr.skillMods[c] || {}) };
  if (pr.clsSeen === undefined) pr.clsSeen = (pr.level || 1) > 1 || (pr.stats && pr.stats.runs > 0); // 예전 저장은 이미 전사
}, 40);

function playerCls(p) { return (p && p.cls) || (game.profile && game.profile.cls) || "warrior"; }
function skillMod(p, slot) { const mods = (p && p.skillMods) || game.profile.skillMods || {}; return (mods[playerCls(p)] || {})[slot] || "A"; }
function skillUnlocked(s, p) { return ((p && p.level) || game.profile.level || 1) >= s.unlock; } // p.level: 같이 하기 친구 레벨

// ----- 우리 편(늑대)과 기술 효과들 -----
let allies = [];     // 늑대 (몬스터 배열에 넣지 않아요)
let clsFx = [];      // 기술 효과 (투사체, 덫, 화살비, 운석, 회오리, 덩굴, 불꽃 자국)

function W(p) {
  const pr = game.profile;
  const base = playerCls(p) === "hunter" ? p.bow.damage * damageBonus(pr.level) : weaponPower(p);
  // 직업 배수: 같은 장비에서 직업끼리 처치 시간이 비슷하게 (봇 시험으로 맞춤, docs/design/classes.md 1-4)
  return base * (CLASS_DEFS[playerCls(p)].dmgMul || 1) * (p.buffT > 0 ? 1.3 : 1);
}
function targetsNear(x, y, r) { return allTargets().filter((m) => Math.hypot(m.x - x, m.y - y) <= r + (m.r || 0.3)); }
function hitTarget(p, m, dmg, opts = {}) {
  if (m.dummy) { hitDummy(m, dmg, false, p); return; }
  const crit = Math.random() < CONFIG.player.critChance;
  damageMonster(m, dmg * (crit ? CONFIG.player.critDamage : 1), opts.fx !== undefined ? opts.fx : p.x, opts.fy !== undefined ? opts.fy : p.y, false, opts.knock || 0.4, { crit, effect: opts.effect || null, skill: true });
}
function hitArea(p, x, y, r, dmg, opts = {}) {
  const list = targetsNear(x, y, r);
  for (const m of list) hitTarget(p, m, dmg, { fx: x, fy: y, ...opts });
  return list;
}
function freezeTarget(m, t) {
  if (m.dummy) return;
  if (m.boss) { m.slow = Math.max(m.slow || 0, t); return; }
  m.stunTimer = Math.max(m.stunTimer || 0, t); m.slow = Math.max(m.slow || 0, t + 1);
}
function nearestEnemy(x, y, maxD) {
  let best = null, bd = maxD;
  for (const m of allTargets()) { const d = Math.hypot(m.x - x, m.y - y); if (d < bd) { bd = d; best = m; } }
  return best;
}
// 적이 가장 많이 모인 곳 (궁극기 겨냥)
function crowdSpot(p, maxD, r) {
  let best = null, score = 0;
  for (const m of allTargets()) {
    if (Math.hypot(m.x - p.x, m.y - p.y) > maxD) continue;
    const n = targetsNear(m.x, m.y, r).reduce((s, o) => s + (o.boss ? 3 : 1), 0);
    if (n > score) { score = n; best = { x: m.x, y: m.y }; }
  }
  return best || { x: p.x + p.faceX * 4, y: p.y + p.faceY * 4 };
}
function faceTo(p, x, y) { const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy); if (d > 0.01) { p.faceX = dx / d; p.faceY = dy / d; } }
function gainRes(p, n) { p.res = Math.max(0, Math.min(100, (p.res || 0) + n)); }

// ----- 직업 준비 (매 프레임 확인: 장비가 바뀌면 다시) -----
// 장면이 바뀌면 주인공 객체가 새로 만들어져요 -> 번호(pid)별로 힘 막대·쿨다운을 이어가요
const CLS_STATE = {};
function clsPrepare(p) {
  const cls = playerCls(p), def = CLASS_DEFS[cls], pid = p.pid || 1;
  if (p.res === undefined) {
    const st = CLS_STATE[pid];
    if (st && st.cls === cls) { p.res = st.res; p.cd = st.cd; p.bear = st.bear || 0; if (p.bear > 0) p.hp += p.maxHp * 0.5 * Math.min(1, p.bear / 12); p._cls = cls; }
    else { p.res = cls === "warrior" ? 0 : 60; p.cd = { s1: 0, s2: 0, ult: 0 }; }
    p.resIdle = 0;
  }
  if (p._cls !== cls) { p._cls = cls; p.res = cls === "warrior" ? 0 : 60; p.cd = { s1: 0, s2: 0, ult: 0 }; p.bear = 0; p.spinning = false; p._hpApplied = null; }
  CLS_STATE[pid] = { cls, res: p.res, cd: p.cd, bear: p.bear };
  // 무기: 전사만 무기 종류(칼·도끼·망치…)를 써요. 다른 직업은 기본 칼 수치 + 직업 모양 (망치 배수로 마법이 너무 세지지 않게)
  if (p.weapon && p.weapon._cls !== cls && !p.weapon.legendary) {
    const w = { ...p.weapon, _cls: cls, style: def.style || undefined, orb: def.orb };
    if (cls !== "warrior") {
      const t = WEAPON_TYPES[w.type] || WEAPON_TYPES.sword, sw = WEAPON_TYPES.sword;
      w.damage = w.damage / (t.mul || 1); w.type = "sword"; w.range = sw.range; w.cooldown = sw.cooldown; w.arc = sw.arc; w.length = sw.length;
      if (cls === "hunter") w.length = 0.5; // 사냥꾼 단검은 짧게 (그림만)
    }
    p.weapon = w;
  }
  // 이동 속도 (사냥꾼 +8%): 갑옷의 speed 에 더해요 (refreshGear 가 갑옷을 바꾸면 다시)
  if (p.armor && p.armor._cls !== cls) p.armor = { ...p.armor, _cls: cls, speed: (p.armor.speed || 0) + (def.speed || 0) };
  // 하트 배수 (refreshGear 가 maxHp 를 다시 계산하면 다시 적용)
  if (p._hpApplied !== p.maxHp) {
    const base = p._hpApplied === null || p._hpApplied === undefined ? p.maxHp : p.maxHp;
    const want = Math.max(4, Math.round(base * def.hpMul));
    if (want !== p.maxHp) { const k = p.hp / p.maxHp; p.maxHp = want; p.hp = Math.min(want, Math.max(p.hp > 0 ? 1 : 0, Math.round(want * k * 10) / 10)); }
    p._hpApplied = p.maxHp;
  }
}

// ----- 조작: 기술 버튼 -----
hookOn("playerInput", (inp, p) => {
  const two = p && p.pid === 2 && typeof coopLocal === "function" && coopLocal(); // 한 태블릿 2번만 숫자패드 (같은 Wi-Fi 친구는 자기 기기 키)
  const k1 = two ? ["Numpad7", "T2Skill1"] : ["KeyU", "Digit1", "TouchSkill1"];
  const k2 = two ? ["Numpad8", "T2Skill2"] : ["KeyI", "Digit2", "TouchSkill2"];
  const k3 = two ? ["Numpad9", "T2Ult"] : ["KeyO", "Digit3", "TouchUlt"];
  inp.s1Pressed = wasPressed(...k1); inp.s1Held = isDown(...k1);
  inp.s2Pressed = wasPressed(...k2);
  inp.ultPressed = wasPressed(...k3);
  return inp;
}, 70);

// ----- 기본 공격 -----
hookOn("basicAttack", (p) => {
  clsPrepare(p);
  const cls = playerCls(p);
  if (p.spinning || p.bear > 0 && cls !== "druid") return true;
  if (cls === "hunter") { hunterShoot(p); return true; }
  if (cls === "mage") { mageOrb(p); return true; }
  if (cls === "druid") {
    startAttack(p);
    if (p.bear > 0) { p.attackTimer *= 1.15; }
    else if (p.move && p.move.finisher) clsFx.push({ kind: "vine", owner: p, delay: 0.16, x: p.x, y: p.y, fx: p.faceX, fy: p.faceY });
    return true;
  }
  return false; // 전사: 원래 연속기
});

function hunterShoot(p) {
  const pr = game.profile, bow = p.bow;
  let type = currentArrowType();
  if (type !== "normal" && arrowCount(type) <= 0) type = "normal";
  if (type !== "normal" && game.scene !== "lobby") pr.special[type]--;
  const aim = bowAim(p);
  p.faceX = aim.x; p.faceY = aim.y;
  const cd = Math.max(0.16, bow.cooldown * 0.8);
  p.attackTimer = cd; p.bowCooldown = cd; p.bowTimer = Math.max(0.4, cd + 0.18); p.bowAge = 0;
  const n = bow.multishot || 1, base = Math.atan2(aim.y, aim.x);
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * (n > 1 ? 0.22 : 0);
    shots.push({ x: p.x + Math.cos(a) * 0.35, y: p.y + Math.sin(a) * 0.35, vx: Math.cos(a) * bow.speed, vy: Math.sin(a) * bow.speed,
      life: 1.4, damage: W(p) * (type === "bomb" ? 1.4 : 1) * (n > 1 ? 0.7 : 1), pierce: type === "bomb" ? 0 : bow.pierce || 0, hit: [], type, hue: 0 });
  }
  sfx.bowShot();
}

function mageOrb(p) {
  const t = nearestEnemy(p.x, p.y, 8);
  if (t) faceTo(p, t.x, t.y);
  p.attackTimer = 0.35;
  p.castPose = 0.2;
  clsFx.push({ kind: "orb", owner: p, x: p.x + p.faceX * 0.4, y: p.y + p.faceY * 0.4, vx: p.faceX * 9, vy: p.faceY * 9, life: 0.85, dmg: W(p) * 0.9, target: t, r: 0.25 });
  sfx.swing();
}

// ----- 기술 버튼 처리 (updatePlayer 끝에서) -----
hookOn("playerSkills", (p, inp, dt) => {
  clsPrepare(p);
  const cls = playerCls(p);
  for (const k of SKILL_SLOTS) p.cd[k] = Math.max(0, p.cd[k] - dt);
  p.buffT = Math.max(0, (p.buffT || 0) - dt);
  p.castPose = Math.max(0, (p.castPose || 0) - dt);
  // 힘 막대
  p.resIdle = (p.resIdle || 0) + dt;
  if (cls === "warrior") { if (p.resIdle > 4) gainRes(p, -8 * dt); }
  else if (cls === "hunter") gainRes(p, (p.moving ? 12 : 16) * dt);
  else if (cls === "mage") gainRes(p, 10 * dt);
  else if (cls === "druid") gainRes(p, 3 * dt);
  // 곰
  if (p.bear > 0) {
    p.bear -= dt;
    if (p.bear <= 0) { p.bear = 0; p.hp = Math.min(p.hp, p.maxHp); spawnBurst(p.x, p.y, ["#8a5a32", "#c08850"], 14); addFloatText(p.x, p.y, "원래대로!", "#ddd", 16); }
  }
  // 회오리 베기 (누르고 있는 동안)
  const s1 = classSkill(cls, "s1");
  if (cls === "warrior" && skillUnlocked(s1, p) && inp.s1Held && p.res > 1 && p.swingTimer <= 0) {
    if (!p.spinning) { p.spinning = true; p.spinT = 0; p.spinAng = Math.atan2(p.faceY, p.faceX); sfx.bigSwing(); }
    p.res -= s1.cost * dt; p.resIdle = 0;
    p.spinAng += dt * 16;
    p.faceX = Math.cos(p.spinAng); p.faceY = Math.sin(p.spinAng);
    p.spinT -= dt;
    if (p.spinT <= 0) {
      p.spinT = 0.25;
      const hit = hitArea(p, p.x, p.y, 1.6, W(p) * 0.5, { effect: p.weapon.effect });
      if (hit.length) { gainRes(p, 0); sfx.hit(); }
      if (skillMod(p, "s1") === "A") for (const m of hit) if (!m.boss && !m.dummy) moveEntity(m, (p.x - m.x) * 0.12, (p.y - m.y) * 0.12);
      if (skillMod(p, "s1") === "B") clsFx.push({ kind: "flame", owner: p, x: p.x, y: p.y, r: 0.8, life: 3, tick: 0, dmg: W(p) * 0.15 });
    }
    if (Math.random() < dt * 20) addSparkle(p.x + Math.cos(p.spinAng) * 1.2, p.y + Math.sin(p.spinAng) * 1.2, 0.6, { life: 0.25, size: 0.5, gold: true });
    return;
  }
  if (p.spinning) p.spinning = false;
  if (inp.s1Pressed) useSkill(p, "s1");
  if (inp.s2Pressed) useSkill(p, "s2");
  if (inp.ultPressed) useSkill(p, "ult");
});

function skillBlocked(p, s) {
  if (!s) return "없음";
  if (!skillUnlocked(s, p)) return `Lv ${s.unlock}에 열려요`;
  if (p.cd[s.slot] > 0) return "준비 중";
  const cost = skillCost(p, s);
  if (!s.costPerSec && cost > 0 && p.res < cost) return `${josa(CLASS_DEFS[s.cls].res.name, "이/가")} 모자라요`;
  // 누르고 있는 기술(회오리 베기)은 막대가 조금이라도 있어야 해요
  if (s.costPerSec && p.res <= 1) return `${josa(CLASS_DEFS[s.cls].res.name, "이/가")} 모자라요 (몬스터를 때려서 모아요)`;
  return null;
}
function skillCost(p, s) {
  if (s.id === "d_wolf" && allies.some((a) => a.owner === p && a.hp > 0)) return 15; // 덮쳐!
  return s.cost;
}
function skillCooldown(p, s) {
  if (s.id === "w_leap" && skillMod(p, "s2") === "B") return 6;
  if (s.id === "m_blink" && skillMod(p, "s2") === "B") return 3;
  return s.cooldown;
}

function useSkill(p, slot) {
  const cls = playerCls(p), s = classSkill(cls, slot);
  const why = skillBlocked(p, s);
  if (why) {
    if (why !== "없음" && (p.pid || 1) === 1) { if (!p._denyT || game.time - p._denyT > 0.8) { addFloatText(p.x, p.y, why, "#bbb", 15); p._denyT = game.time; } }
    return false;
  }
  const cost = skillCost(p, s);
  if (s.id === "h_vault" && skillMod(p, "s2") === "B") {
    p.vaultCharges = p.vaultCharges === undefined ? 2 : p.vaultCharges;
    if (p.vaultCharges <= 0) return false;
  }
  const run = SKILL_RUN[s.id];
  if (!run) return false; // 누르고 있는 동안 도는 기술(회오리)은 위에서 따로 처리해요
  const ok = run(p, s);
  if (ok === false) return false;
  p.res -= cost; p.resIdle = 0;
  if (s.id === "h_vault" && skillMod(p, "s2") === "B") { p.vaultCharges--; if (p.vaultCharges <= 0) { p.vaultCharges = 2; p.cd[slot] = skillCooldown(p, s); } }
  else p.cd[slot] = skillCooldown(p, s);
  p.castPose = 0.3;
  hookRun("playerSkillUsed", p, s.id);
  return true;
}

const SKILL_RUN = {
  w_leap(p) {
    const t = nearestEnemy(p.x, p.y, 5.5);
    let tx = t ? t.x : p.x + p.faceX * 4, ty = t ? t.y : p.y + p.faceY * 4;
    const d = Math.hypot(tx - p.x, ty - p.y);
    if (d > 5) { tx = p.x + (tx - p.x) / d * 5; ty = p.y + (ty - p.y) / d * 5; }
    if (t && d > 0.6) { tx -= (tx - p.x) / d * 0.6; ty -= (ty - p.y) / d * 0.6; }
    faceTo(p, tx, ty);
    const dur = 0.5, rs = CONFIG.player.rollSpeed;
    p.leap = { t: dur, dur, x0: p.x, y0: p.y };
    p.rollTimer = dur; p.rollX = (tx - p.x) / (rs * dur); p.rollY = (ty - p.y) / (rs * dur);
    p.swingTimer = 0; p.move = null;
    sfx.roll();
    clsFx.push({ kind: "aim", x: tx, y: ty, r: skillMod(p, "s2") === "B" ? 1.6 : 2.0, life: dur, max: dur });
  },
  w_shout(p) {
    for (const q of alivePlayers()) if (Math.hypot(q.x - p.x, q.y - p.y) < 8) {
      const h = q.maxHp * 0.3; q.hp = Math.min(q.maxHp + (q.bear > 0 ? q.maxHp * 0.5 : 0), q.hp + h); q.buffT = 8;
      addFloatText(q.x, q.y, `+${Math.round(h * 10) / 10}`, "#7dffb0", 20);
    }
    for (const m of monsters) {
      if (m.hp <= 0 || Math.hypot(m.x - p.x, m.y - p.y) > 6) continue;
      if (m.boss) { m.stunTimer = Math.max(m.stunTimer || 0, 0.8); continue; }
      const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) || 1;
      m.stunTimer = Math.max(m.stunTimer || 0, 2); m.knockX = dx / d * 7; m.knockY = dy / d * 7;
      addFloatText(m.x, m.y, "덜덜", "#ffe27a", 14);
    }
    for (let i = 0; i < 3; i++) addRing(p.x, p.y, { speed: 9, life: 0.5, gold: true, delay: i * 0.12 });
    game.shake = Math.max(game.shake, 0.3); sfx.levelUp();
  },
  h_multi(p) {
    const t = nearestEnemy(p.x, p.y, 9); if (t) faceTo(p, t.x, t.y);
    const base = Math.atan2(p.faceY, p.faceX), mod = skillMod(p, "s1");
    const type = mod === "A" ? "fire" : "ice";
    for (let i = 0; i < 7; i++) {
      const a = base + (i - 3) * (70 / 6) * Math.PI / 180;
      shots.push({ x: p.x + Math.cos(a) * 0.35, y: p.y + Math.sin(a) * 0.35, vx: Math.cos(a) * p.bow.speed, vy: Math.sin(a) * p.bow.speed, life: 1.1, damage: W(p) * 0.75, pierce: 1, hit: [], type, hue: 0 });
    }
    p.bowTimer = 0.45; p.bowAge = 0.3; sfx.bowShot();
  },
  h_vault(p) {
    const traps = clsFx.filter((f) => f.kind === "trap" && f.owner === p);
    const n = skillMod(p, "s2") === "A" ? 2 : 1;
    for (let i = 0; i < n; i++) clsFx.push({ kind: "trap", owner: p, x: p.x + (i ? -p.faceY * 0.7 : 0), y: p.y + (i ? p.faceX * 0.7 : 0), r: 0.7, life: 20, dmg: W(p) * 1.2 });
    const all = clsFx.filter((f) => f.kind === "trap" && f.owner === p);
    while (all.length > 3) { const old = all.shift(); old.life = 0; }
    const rs = CONFIG.player.rollSpeed, dur = CONFIG.player.rollTime;
    p.rollTimer = dur; p.rollX = -p.faceX * 3 / (rs * dur); p.rollY = -p.faceY * 3 / (rs * dur);
    p.swingTimer = 0; p.move = null; sfx.roll(); spawnDust(p.x, p.y);
    void traps;
  },
  h_rain(p) {
    const c = crowdSpot(p, 9, 3.5);
    clsFx.push({ kind: "aim", x: c.x, y: c.y, r: 3.5, life: 0.5, max: 0.5 });
    clsFx.push({ kind: "rain", owner: p, x: c.x, y: c.y, r: 3.5, delay: 0.5, life: 3, tick: 0, left: 12, dmg: W(p) * 0.5 });
    p.bowTimer = 0.5; p.bowAge = 0.3; sfx.bowShot();
  },
  m_fire(p) {
    const t = nearestEnemy(p.x, p.y, 9); if (t) faceTo(p, t.x, t.y);
    const mod = skillMod(p, "s1"), base = Math.atan2(p.faceY, p.faceX);
    const list = mod === "A" ? [-0.3, 0, 0.3] : [0];
    for (const da of list) {
      const a = base + da;
      clsFx.push({ kind: "fireball", owner: p, x: p.x + Math.cos(a) * 0.4, y: p.y + Math.sin(a) * 0.4, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, life: 1.1,
        dmg: W(p) * (mod === "A" ? 1.0 : 2.2), boom: mod === "B" ? 2.4 : 1.6, r: mod === "A" ? 0.22 : 0.32 });
    }
    sfx.bigSwing();
  },
  m_blink(p) {
    const mod = skillMod(p, "s2");
    const x0 = p.x, y0 = p.y;
    let dx = p.faceX, dy = p.faceY;
    const inp = playerInput(p); if (Math.hypot(inp.sx, inp.sy) > 0.2) { const wx = inp.sx + inp.sy, wy = -inp.sx + inp.sy, l = Math.hypot(wx, wy); dx = wx / l; dy = wy / l; }
    for (let i = 0; i < 20; i++) moveEntity(p, dx * 0.2, dy * 0.2);
    spawnBurst(x0, y0, ["#bfe6ff", "#ffffff"], 10); spawnBurst(p.x, p.y, ["#bfe6ff", "#ffffff"], 10);
    p.hurtTimer = Math.max(p.hurtTimer, 0.01);
    const nova = (x, y) => { addRing(x, y, { speed: 8, life: 0.35, hue: 195 }); for (const m of hitArea(p, x, y, 2, W(p) * 0.6)) freezeTarget(m, 1.5); };
    if (mod !== "B") nova(x0, y0);
    if (mod === "A") nova(p.x, p.y);
    sfx.zap ? sfx.zap() : sfx.roll();
  },
  m_meteor(p) {
    const c = crowdSpot(p, 9, 3);
    clsFx.push({ kind: "aim", x: c.x, y: c.y, r: 3, life: 1, max: 1 });
    clsFx.push({ kind: "meteor", owner: p, x: c.x, y: c.y, r: 3, delay: 1, dmg: W(p) * 6 });
  },
  d_wolf(p) {
    const mine = allies.filter((a) => a.owner === p && a.hp > 0);
    if (mine.length) { for (const w of mine) { w.pounce = 0.6; w.target = nearestEnemy(w.x, w.y, 8); } addFloatText(p.x, p.y, "덮쳐!", "#b6e35a", 18); return; }
    const mod = skillMod(p, "s1"), n = mod === "A" ? 3 : 2, k = mod === "A" ? 0.75 : 1;
    for (let i = 0; i < n; i++) {
      const s = findFreeSpot(p.x - p.faceX + (i - 1) * 0.6, p.y - p.faceY + (i - 1) * 0.6, 0.25, 3) || { x: p.x, y: p.y };
      const hp = Math.max(2, p.maxHp * 0.4 * k);
      allies.push({ ally: true, wolf: true, owner: p, ownerPid: p.pid || 1, x: s.x, y: s.y, r: 0.25, hp, maxHp: hp, k, faceX: p.faceX, faceY: p.faceY, rollTimer: 0, hurtTimer: 0, flash: 0, bite: 0.3, walk: 0, def: { size: 0.9 } });
      spawnBurst(s.x, s.y, ["#ffffff", "#b6e35a"], 10);
    }
    sfx.levelUp();
  },
  d_tornado(p) {
    const t = nearestEnemy(p.x, p.y, 8); if (t) faceTo(p, t.x, t.y);
    const mod = skillMod(p, "s2");
    const list = mod === "A" ? [-0.35, 0.35] : [0];
    for (const da of list) {
      const a = Math.atan2(p.faceY, p.faceX) + da;
      clsFx.push({ kind: "tornado", owner: p, x: p.x + Math.cos(a) * 0.5, y: p.y + Math.sin(a) * 0.5, dir: a, speed: mod === "B" ? 0 : 3, life: mod === "B" ? 3 : 2, tick: 0, t: 0, dmg: W(p) * 0.3 });
    }
    sfx.roll();
  },
  d_bear(p) {
    p.bear = 12;
    p.hp = p.hp + p.maxHp * 0.5;
    spawnBurst(p.x, p.y, ["#8a5a32", "#c08850", "#ffffff"], 20);
    addFloatText(p.x, p.y, "으르렁!", "#ffb070", 24);
    game.shake = Math.max(game.shake, 0.3); sfx.boss();
  },
};

// 늑대가 문 사람 (주인공 근접 타격 = 같은 자리에서 온 피해) 힘 막대 · 버프 · 곰
hookOn("monsterDamage", (h) => {
  if (h.opts.dot || h.opts.skill) return false;
  for (const p of allPlayers()) {
    if (Math.abs(h.fromX - p.x) > 1e-6 || Math.abs(h.fromY - p.y) > 1e-6) continue;
    if (p.buffT > 0) h.dmg *= 1.3;
    if (p.bear > 0) h.dmg *= 1.45;
    const cls = playerCls(p);
    if (cls === "warrior") { if ((p._resMove !== p.move)) { p._resMove = p.move; p._resGain = 0; } if (p._resGain < 12) { gainRes(p, 6); p._resGain += 6; } p.resIdle = 0; }
    if (cls === "druid") gainRes(p, 10);
    break;
  }
  return false;
}, 60);
hookOn("playerHurt", (p, dmg, from, hp0) => { if (p.hp < hp0 && playerCls(p) === "warrior") { gainRes(p, 8); p.resIdle = 0; } });

// ----- 매 프레임: 도약 착지, 기술 효과, 늑대 -----
hookOn("playersUpdated", (dt) => {
  for (const p of allPlayers()) {
    if (p.leap) {
      p.leap.t -= dt;
      if (p.rollTimer <= 0 || p.leap.t <= 0) {
        p.leap = null; p.rollTimer = 0;
        const B = skillMod(p, "s2") === "B", r = B ? 1.6 : 2.0;
        const land = () => {
          for (const m of hitArea(p, p.x, p.y, r, W(p) * 2.0, { knock: 1.2 })) if (!m.dummy && !m.boss) m.stunTimer = Math.max(m.stunTimer || 0, 1);
          addRing(p.x, p.y, { speed: 10, life: 0.35, hue: 35 }); spawnDust(p.x, p.y); spawnDust(p.x, p.y);
          game.shake = Math.max(game.shake, 0.35); sfx.slam();
        };
        land();
        if (!B && skillMod(p, "s2") === "A") clsFx.push({ kind: "later", owner: p, delay: 0.35, run: land });
      }
    }
  }
  updateClsFx(dt);
  updateAllies(dt);
});

function updateClsFx(dt) {
  for (const f of clsFx) {
    if (f.delay > 0) { f.delay -= dt; if (f.delay > 0) continue; if (f.run) { f.run(); f.life = 0; continue; } }
    const p = f.owner;
    switch (f.kind) {
      case "aim": f.life -= dt; break;
      case "orb": {
        if (f.target && f.target.hp > 0) { const dx = f.target.x - f.x, dy = f.target.y - f.y, d = Math.hypot(dx, dy) || 1; f.vx += (dx / d * 9 - f.vx) * Math.min(1, dt * 6); f.vy += (dy / d * 9 - f.vy) * Math.min(1, dt * 6); }
        projStep(f, dt, (m) => { hitTarget(p, m, f.dmg, { fx: f.x, fy: f.y, knock: 0.3, effect: p.weapon.effect }); if (playerCls(p) === "mage") gainRes(p, 3); });
        if (Math.random() < 0.6) addSparkle(f.x, f.y, 0.6, { life: 0.25, size: 0.45, hue: 210 });
        break;
      }
      case "fireball": {
        const boom = () => { hitArea(p, f.x, f.y, f.boom, f.dmg, { effect: "burn", knock: 0.8 }); addRing(f.x, f.y, { speed: f.boom * 6, life: 0.3, hue: 20 }); spawnBurst(f.x, f.y, ["#ff9a3b", "#ffd23f", "#ff5a2a"], 14); sfx.slam(); game.shake = Math.max(game.shake, 0.15); };
        projStep(f, dt, () => { boom(); f.life = 0; }, true, boom);
        if (Math.random() < 0.8) addSparkle(f.x, f.y, 0.6, { life: 0.3, size: 0.6, gold: true });
        break;
      }
      case "trap": {
        f.life -= dt;
        const m = targetsNear(f.x, f.y, f.r).find((o) => !o.dummy);
        if (m) { hitArea(p, f.x, f.y, 1.0, f.dmg, { effect: "slow" }); spawnBurst(f.x, f.y, ["#c8c8c8", "#8a6a3a"], 10); sfx.hit(); f.life = 0; }
        break;
      }
      case "rain": {
        f.life -= dt; f.tick -= dt;
        if (f.tick <= 0 && f.left > 0) { f.tick = 0.25; f.left--; hitArea(p, f.x, f.y, f.r, f.dmg, { knock: 0.1 }); for (let i = 0; i < 5; i++) { const a = Math.random() * 6.28, r = Math.random() * f.r; spawnDust(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); } sfx.bowShot(); }
        if (f.left <= 0) f.life = 0;
        break;
      }
      case "meteor": {
        hitArea(p, f.x, f.y, f.r, f.dmg, { effect: "burn", knock: 1.5 });
        addRing(f.x, f.y, { speed: 14, life: 0.45, hue: 25 }); addRing(f.x, f.y, { speed: 9, life: 0.5, hue: 45, delay: 0.1 });
        spawnBurst(f.x, f.y, ["#ff7a2a", "#ffd23f", "#5a3a2a"], 30); game.shake = Math.max(game.shake, 0.55); flashScreen(0.12); sfx.boom ? sfx.boom() : sfx.slam();
        clsFx.push({ kind: "flame", owner: p, x: f.x, y: f.y, r: 2.6, life: 3, tick: 0, dmg: W(p) * 0.3 });
        f.life = 0; break;
      }
      case "flame": {
        f.life -= dt; f.tick -= dt;
        if (f.tick <= 0) { f.tick = 0.5; hitArea(p, f.x, f.y, f.r, f.dmg, { knock: 0 }); }
        if (Math.random() < dt * 10 * f.r) addSparkle(f.x + (Math.random() - 0.5) * f.r, f.y + (Math.random() - 0.5) * f.r, 0.2, { vz: 1, life: 0.5, size: 0.45, gold: true });
        break;
      }
      case "tornado": {
        f.life -= dt; f.t += dt; f.tick -= dt;
        const a = f.dir + Math.sin(f.t * 5) * 0.6;
        if (f.speed) { const nx = f.x + Math.cos(a) * f.speed * dt, ny = f.y + Math.sin(a) * f.speed * dt; if (isWall(Math.floor(nx), Math.floor(ny))) f.life = 0; else { f.x = nx; f.y = ny; } }
        if (f.tick <= 0) { f.tick = 0.2; for (const m of hitArea(p, f.x, f.y, 1.0, f.dmg, { knock: 0 })) if (!m.boss && !m.dummy) moveEntity(m, (f.x - m.x) * 0.15, (f.y - m.y) * 0.15); }
        if (Math.random() < dt * 30) addSparkle(f.x + (Math.random() - 0.5) * 0.6, f.y + (Math.random() - 0.5) * 0.6, Math.random() * 1.2, { life: 0.4, size: 0.5, hue: 100 });
        break;
      }
      case "vine": {
        for (let i = 1; i <= 3; i++) {
          const x = f.x + f.fx * i, y = f.y + f.fy * i;
          if (isWall(Math.floor(x), Math.floor(y))) break;
          clsFx.push({ kind: "spike", x, y, life: 0.45, max: 0.45, delay: i * 0.06 });
        }
        const hitSet = new Set();
        for (let i = 1; i <= 3; i++) for (const m of targetsNear(f.x + f.fx * i, f.y + f.fy * i, 0.7)) hitSet.add(m);
        for (const m of hitSet) hitTarget(p, m, W(p) * 1.4, { fx: f.x, fy: f.y, knock: 0.6 });
        if (hitSet.size && playerCls(p) === "druid") gainRes(p, 10);
        f.life = 0; break;
      }
      case "spike": f.life -= dt; break;
    }
  }
  clsFx = clsFx.filter((f) => f.delay > 0 || f.life > 0);
}

// 투사체 한 걸음: 벽이면 끝(onWall), 적에 닿으면 onHit
function projStep(f, dt, onHit, once, onWall) {
  f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt;
  if (isWall(Math.floor(f.x), Math.floor(f.y))) { f.life = 0; if (onWall) onWall(); else spawnDust(f.x, f.y); return; }
  f.hit = f.hit || [];
  for (const m of allTargets()) {
    if (f.hit.includes(m)) continue;
    if (Math.hypot(m.x - f.x, m.y - f.y) > (m.r || 0.3) + f.r) continue;
    f.hit.push(m); onHit(m); f.life = 0; return;
  }
  if (f.life <= 0 && onWall && once) onWall();
}

// ----- 늑대 -----
function updateAllies(dt) {
  const players = allPlayers();
  for (const w of allies) if (!players.includes(w.owner)) { const o = players.find((q) => (q.pid || 1) === w.ownerPid); if (o) { w.owner = o; w.relocate = true; } }
  allies = allies.filter((w) => w.hp > 0 && players.includes(w.owner) && playerCls(w.owner) === "druid");
  for (const w of allies) {
    const o = w.owner;
    w.hurtTimer -= dt; w.flash -= dt; w.bite -= dt; w.pounce = Math.max(0, (w.pounce || 0) - dt);
    if (w.relocate) { const s = findFreeSpot(o.x - o.faceX, o.y - o.faceY, 0.25, 4); if (s) { w.x = s.x; w.y = s.y; } w.relocate = false; }
    if (o.hp <= 0) continue;
    if (!w.target || w.target.hp <= 0 || Math.hypot(w.target.x - o.x, w.target.y - o.y) > 9) w.target = monsters.find((m) => m.hp > 0 && m.appearTimer <= 0 && Math.hypot(m.x - w.x, m.y - w.y) < 6 && !(m.def && m.def.untargetable) && !m.hidden) || null;
    let gx = o.x - o.faceX * 1.1, gy = o.y - o.faceY * 1.1, speed = 4.2;
    if (w.target) { gx = w.target.x; gy = w.target.y; if (w.pounce > 0) speed = 9; }
    const dx = gx - w.x, dy = gy - w.y, d = Math.hypot(dx, dy);
    if (Math.hypot(o.x - w.x, o.y - w.y) > 12) { const s = findFreeSpot(o.x, o.y, 0.25, 3); if (s) { w.x = s.x; w.y = s.y; } continue; }
    const reach = w.target ? (w.target.r || 0.4) + 0.45 : 0.5;
    w.moving = d > reach;
    if (w.moving) { moveEntity(w, dx / d * Math.min(speed * dt, d - reach * 0.9), dy / d * Math.min(speed * dt, d - reach * 0.9)); w.faceX = dx / d; w.faceY = dy / d; w.walk += dt; }
    else if (w.target && w.bite <= 0) {
      w.bite = 0.8;
      const dmg = W(o) * 0.35 * w.k * (w.pounce > 0 ? 0.8 / 0.35 : 1);
      if (w.target.dummy) hitDummy(w.target, dmg, false, o); // 캠프 허수아비
      else damageMonster(w.target, dmg, w.x, w.y, false, 0.3, { skill: true });
      w.lunge = 0.15;
      if (skillMod(o, "s1") === "B") o.hp = Math.min(o.maxHp, o.hp + 0.15);
    }
    w.lunge = Math.max(0, (w.lunge || 0) - dt);
  }
}
hookOn("allyHurt", (w, dmg) => {
  if (w.hurtTimer > 0) return;
  w.hp -= dmg; w.hurtTimer = 0.4; w.flash = 0.1;
  addFloatText(w.x, w.y, `-${Math.round(dmg * 10) / 10}`, "#ffb0b0", 14);
  if (w.hp <= 0) { spawnBurst(w.x, w.y, ["#e8e8e8", "#b6e35a"], 12); addFloatText(w.x, w.y, "깨갱", "#ddd", 14); }
});
// 일반 몬스터는 늑대가 더 가까우면 늑대를 쫓아요 (보스는 늘 주인공)
hookOn("targetsForMonster", (t, m) => {
  if (!allies.length || m.boss || !t) return t;
  const dp = Math.hypot(t.x - m.x, t.y - m.y);
  let best = t, bd = dp;
  for (const w of allies) { if (w.hp <= 0) continue; const d = Math.hypot(w.x - m.x, w.y - m.y); if (d < bd - 0.3 && d < 5) { bd = d; best = w; } }
  return best;
});
hookOn("reset", () => { for (const w of allies) w.relocate = true; clsFx = []; for (const p of allPlayers()) { p.leap = null; p.spinning = false; } }, 40);

// ----- 그리기 -----
function drawParts(e, parts, S, alpha) {
  const X = rigTransform(e, { scale: 1 });
  const list = parts.map((q) => ({ w: X.world(V(q[0] * S, q[1] * S, (q[2] + q[5] / 2) * S)), bw: q[3] * S, bd: q[4] * S, bh: q[5] * S, c: q[6] }));
  list.sort((a, b) => (a.w.x + a.w.y) - (b.w.x + b.w.y) || a.w.z - b.w.z);
  ctx.save(); if (alpha) ctx.globalAlpha *= alpha;
  for (const L of list) drawBox(L.w.x - L.bw / 2, L.w.y - L.bd / 2, Math.max(0, L.w.z - L.bh / 2), L.bw, L.bd, L.bh, e.flash > 0 ? "#ffffff" : L.c);
  ctx.restore();
}
function wolfParts(w) {
  const step = w.moving ? Math.sin(w.walk * 14) * 0.06 : 0, wag = Math.sin(game.time * 14) * 0.12, lun = (w.lunge || 0) * 1.2;
  const fur = "#e9eef2", dark = "#9aa4ad", eye = "#1a1a1a", nose = "#333";
  return [
    [0.0 + lun, 0, 0.14, 0.5, 0.26, 0.24, fur],
    [0.3 + lun, 0, 0.26, 0.26, 0.26, 0.24, fur],
    [0.45 + lun, 0, 0.3, 0.1, 0.12, 0.08, nose],
    [0.37 + lun, 0.07, 0.42, 0.06, 0.06, 0.08, dark], [0.37 + lun, -0.07, 0.42, 0.06, 0.06, 0.08, dark],
    [0.44 + lun, 0.065, 0.36, 0.03, 0.04, 0.04, eye], [0.44 + lun, -0.065, 0.36, 0.03, 0.04, 0.04, eye],
    [-0.3 + lun, wag, 0.3, 0.2, 0.08, 0.08, fur], // 덮칠 때 꼬리·다리도 몸을 따라가요 (떨어져 보이지 않게)
    [0.15 + step + lun, 0.08, 0, 0.08, 0.08, 0.15, dark], [0.15 - step + lun, -0.08, 0, 0.08, 0.08, 0.15, dark],
    [-0.15 - step + lun * 0.6, 0.08, 0, 0.08, 0.08, 0.15, dark], [-0.15 + step + lun * 0.6, -0.08, 0, 0.08, 0.08, 0.15, dark],
  ];
}
function bearParts(p) {
  const step = p.moving ? Math.sin(p.walkTime * 11) * 0.07 : 0, br = Math.sin(game.time * 2.5) * 0.015;
  const swing = p.swingTimer > 0 ? Math.sin((1 - p.swingTimer / (p.move ? p.move.dur : 0.3)) * Math.PI) : 0;
  const fur = "#8a5a32", light = "#c08850", eye = "#1a1a1a", nose = "#2a1a10";
  return [
    [0, 0, 0.18, 0.6, 0.55, 0.5 + br, fur],
    [0.05, 0, 0.18, 0.4, 0.42, 0.3, light],
    [0.32, 0, 0.5, 0.36, 0.38, 0.32, fur],
    [0.5, 0, 0.56, 0.12, 0.16, 0.12, light], [0.56, 0, 0.6, 0.05, 0.07, 0.05, nose],
    [0.48, 0.1, 0.7, 0.04, 0.05, 0.05, eye], [0.48, -0.1, 0.7, 0.04, 0.05, 0.05, eye],
    [0.28, 0.15, 0.82, 0.1, 0.1, 0.09, fur], [0.28, -0.15, 0.82, 0.1, 0.1, 0.09, fur],
    [0.15 + step + swing * 0.3, 0.2, 0 + swing * 0.3, 0.16, 0.16, 0.22, fur], [0.15 - step, -0.2, 0, 0.16, 0.16, 0.22, fur],
    [-0.18 - step, 0.2, 0, 0.16, 0.16, 0.2, fur], [-0.18 + step, -0.2, 0, 0.16, 0.16, 0.2, fur],
  ];
}

hookOn("drawPlayerAs", (p) => {
  if (p.bear > 0) {
    drawParts(p, bearParts(p), 1.6);
    if (p.bear < 2 && Math.floor(p.bear * 8) % 2) drawParts(p, bearParts(p), 1.6, 0.4);
    return true;
  }
  if (p.leap) {
    const t = 1 - Math.max(0, p.leap.t) / p.leap.dur;
    const pose = playerPose(p);
    drawRig(p, playerLook(p), pose, { hop: Math.sin(t * Math.PI) * 1.4 });
    return true;
  }
  // 기술 자세: 회오리 베기(무기를 옆으로 쭉), 함성(무기 번쩍), 마법·드루이드 시전(지팡이를 앞으로 들어 올림)
  const pose = clsSkillPose(p);
  if (pose) {
    const shimmer = p.armor.legendary || p.armor.shimmerSet ? game.time : undefined;
    drawRig(p, playerLook(p), pose, { bodyYaw: pose.bodyYaw || 0, shimmer });
    return true;
  }
  return false;
});
function clsSkillPose(p) {
  if (p.rollTimer > 0 || p.swingTimer > 0 || p.bowTimer > 0 || p.bear > 0) return null;
  const cls = playerCls(p);
  const spin = cls === "warrior" && p.spinning;
  const cast = (p.castPose || 0) > 0 && cls !== "hunter";
  if (!spin && !cast) return null;
  const pose = playerPose(p);
  if (!pose.weapon) return null;
  const k = spin ? 1 : Math.min(1, p.castPose / 0.15);
  if (spin) {
    pose.rh = handAt(1.35, 0.36, 0.56); pose.weapon.dir = dirAt(1.45, 0.06);
    pose.lh = handAt(-1.35, 0.3, 0.56); pose.twist = 0.35; pose.lean = 0.05; pose.lhShaft = null;
  } else if (cls === "warrior") {
    pose.rh = handAt(0.55, 0.2, 0.6 + 0.35 * k); pose.weapon.dir = dirAt(0.3, 0.6 + 0.75 * k);
    pose.lh = handAt(-0.7, 0.24, 0.6 + 0.3 * k); pose.lean = -0.08 * k; pose.lhShaft = null;
  } else {
    pose.rh = handAt(0.6, 0.3 + 0.06 * k, 0.6 + 0.12 * k); pose.weapon.dir = dirAt(0.5, 0.35 + 0.6 * k);
    pose.lh = handAt(-0.5, 0.3, 0.62 + 0.1 * k); pose.lean = 0.04 * k; pose.lhShaft = null;
  }
  return pose;
}
// 모자 자리: 실제로 그린 머리 위 (걸을 때 흔들림·몸 기울기·기술 자세를 따라가요)
function clsHeadTop(p) {
  const pose = clsSkillPose(p) || playerPose(p);
  const opts = { bodyYaw: pose.bodyYaw || 0 };
  try {
    const b = buildRigItems(p, playerLook(p), pose, opts), X = rigTransform(p, opts);
    const h = b.items.find((i) => i.tag === "head");
    if (h) { const w = X.world(h.c); return { x: w.x, y: w.y, z: w.z + RIG.headSize / 2 }; }
  } catch (e) { /* 아래 기본값 */ }
  return { x: p.x, y: p.y, z: 1.08 };
}

// 직업 모자 (머리 위 블록)
hookOn("drawPlayerOver", (p) => {
  const cls = playerCls(p);
  if (p.bear > 0 || p.rollTimer > 0 || cls === "warrior") { if (p.buffT > 0 && Math.random() < 0.2) addSparkle(p.x, p.y, 0.8, { life: 0.4, size: 0.5, gold: true, vz: 1 }); return; }
  const H = clsHeadTop(p);
  const top = H.z - 0.02, x = H.x, y = H.y;
  if (cls === "hunter") {
    drawBox(x - 0.21, y - 0.21, top - 0.08, 0.42, 0.42, 0.12, "#2f7d32");
    drawBox(x - 0.13, y - 0.13, top + 0.04, 0.26, 0.26, 0.07, "#3c9a40");
  } else if (cls === "mage") {
    drawBox(x - 0.25, y - 0.25, top - 0.04, 0.5, 0.5, 0.06, "#3a4fb0");
    drawBox(x - 0.15, y - 0.15, top + 0.02, 0.3, 0.3, 0.14, "#4f66d6");
    drawBox(x - 0.08, y - 0.08, top + 0.16, 0.16, 0.16, 0.12, "#5d78f0");
    drawBox(x - 0.035, y - 0.035, top + 0.28, 0.07, 0.07, 0.06, "#ffe27a");
  } else if (cls === "druid") {
    drawBox(x - 0.2, y - 0.2, top - 0.05, 0.4, 0.4, 0.05, "#5a8a2a");
    for (const [ox, oy] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) drawBox(x + ox - 0.05, y + oy - 0.05, top, 0.1, 0.1, 0.1, "#8bc34a");
  }
  if (p.buffT > 0 && Math.random() < 0.2) addSparkle(p.x, p.y, 0.8, { life: 0.4, size: 0.5, gold: true, vz: 1 });
});
hookOn("playerLook", (look, p) => {
  const cls = playerCls(p);
  if (cls !== "warrior" && !(game.profile.look && game.profile.look.hideArmor)) look = { ...look, helmet: null };
  return look;
}, 60);

function drawClsFx() {
  for (const f of clsFx) {
    if (f.delay > 0 && f.kind !== "rain" && f.kind !== "meteor") continue;
    if (f.kind === "aim" || (f.kind === "meteor" && f.delay > 0) || (f.kind === "rain" && f.delay > 0)) {
      if (f.kind !== "aim") continue;
      const k = 1 - f.life / f.max, c = toScreen(f.x, f.y, 0.02), e = floorEllipse(f.r);
      ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * k; ctx.fillStyle = "#ffd84a";
      ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.9; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx * k, e.ry * k, 0, 0, Math.PI * 2); ctx.strokeStyle = "#ffd84a"; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    } else if (f.kind === "trap") {
      const c = toScreen(f.x, f.y, 0.02);
      ctx.fillStyle = "#6b4a2a"; ctx.fillRect(c.x - 9 * ZOOM, c.y - 3 * ZOOM, 18 * ZOOM, 6 * ZOOM);
      ctx.fillStyle = "#d8d8d8"; for (let i = -2; i <= 2; i++) ctx.fillRect(c.x + i * 4 * ZOOM - 1, c.y - 7 * ZOOM, 2 * ZOOM, 5 * ZOOM);
    } else if (f.kind === "flame") {
      const c = toScreen(f.x, f.y, 0.02), e = floorEllipse(f.r);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.25 * Math.min(1, f.life);
      ctx.fillStyle = "#ff7a2a"; ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (f.kind === "rain") {
      const c = toScreen(f.x, f.y, 0.02), e = floorEllipse(f.r);
      ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = "#ffd84a"; ctx.beginPath(); ctx.ellipse(c.x, c.y, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.strokeStyle = "#e8d8a0"; ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) { const a = (i * 2.4 + game.time * 3) % 6.28, r = ((i * 0.37 + game.time * 2) % 1) * f.r; const s = toScreen(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 1.6 - ((game.time * 6 + i) % 1.6)); ctx.beginPath(); ctx.moveTo(s.x, s.y - 10 * ZOOM); ctx.lineTo(s.x, s.y); ctx.stroke(); }
      ctx.restore();
    } else if (f.kind === "spike") {
      const k = Math.sin((1 - f.life / f.max) * Math.PI);
      drawBox(f.x - 0.12, f.y - 0.12, 0, 0.24, 0.24, 0.5 * k, "#5a8a2a");
      drawBox(f.x - 0.06, f.y - 0.06, 0.5 * k, 0.12, 0.12, 0.18 * k, "#8bc34a");
    }
  }
}
function flyingFxThings(things) {
  for (const f of clsFx) {
    if (f.delay > 0) continue;
    if (f.kind === "orb" || f.kind === "fireball") things.push({ depth: f.x + f.y, draw: () => {
      const c = toScreen(f.x, f.y, 0.6), r = (f.kind === "orb" ? 9 : 13 * (f.r / 0.32)) * ZOOM;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
      g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.45, f.kind === "orb" ? "rgba(120,190,255,0.8)" : "rgba(255,140,40,0.85)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } });
    if (f.kind === "tornado") things.push({ depth: f.x + f.y, draw: () => {
      ctx.save(); ctx.globalAlpha = 0.75;
      for (let i = 0; i < 5; i++) { const z = i * 0.28, w = 0.18 + i * 0.09, a = game.time * 12 + i; drawBox(f.x - w / 2 + Math.cos(a) * 0.05, f.y - w / 2 + Math.sin(a) * 0.05, z, w, w, 0.22, i % 2 ? "#cfe8c0" : "#a8d890"); }
      ctx.restore();
    } });
  }
  for (const w of allies) if (w.hp > 0) things.push({ depth: w.x + w.y, draw: () => {
    drawParts(w, wolfParts(w), 1, w.owner.hp <= 0 ? 0.4 : 1);
    if (w.hp < w.maxHp) { const s = toScreen(w.x, w.y, 0.75); ctx.fillStyle = "#222"; ctx.fillRect(s.x - 14, s.y, 28, 4); ctx.fillStyle = "#7dffb0"; ctx.fillRect(s.x - 14, s.y, 28 * w.hp / w.maxHp, 4); }
  } });
}
hookOn("drawTelegraphsAfter", () => drawClsFx(), 60);
hookOn("worldThings", (things) => flyingFxThings(things), 60);
hookOn("lobbyThings", (things) => { flyingFxThings(things); trainerThings(things); }, 60);
hookOn("drawFloor", () => { if (game.scene === "lobby") drawClsFx(); }, 60);

// ----- HUD: 힘 막대 + 기술 칸 (키보드 쓸 때) -----
hookOn("hudDraw", () => {
  const p = game.player; if (!p || game.scene === "title") return;
  clsPrepare(p);
  const cls = playerCls(p), def = CLASS_DEFS[cls];
  const shown = Math.min(p.maxHp, 40);
  let y = 14 + Math.ceil(shown / 10) * 24 + 6 + 26 + 30 + 16;
  ctx.fillStyle = "#2b2f38"; ctx.fillRect(16, y, 100, 9);
  ctx.fillStyle = def.res.color; ctx.fillRect(16, y, p.res, 9);
  text(`${def.res.name} ${Math.floor(p.res)}`, 124, y + 10, 13, def.res.color);
  if (p.bear > 0) text(`곰 ${Math.ceil(p.bear)}초`, 200, y + 10, 13, "#ffb070");
  if (touch.show) return;
  y += 18;
  SKILL_SLOTS.forEach((slot, i) => {
    const s = classSkill(cls, slot), x = 16 + i * 46;
    const lock = !skillUnlocked(s), cd = p.cd[slot], tot = skillCooldown(p, s) || 1;
    ctx.fillStyle = lock ? "#2a2a2a" : "#1d2430"; ctx.fillRect(x, y, 40, 40);
    ctx.strokeStyle = slot === "ult" ? "#ffd84a" : def.color; ctx.lineWidth = 2; ctx.strokeRect(x, y, 40, 40);
    if (!lock && cd > 0) { ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(x, y, 40, 40 * Math.min(1, cd / tot)); }
    if (!lock && !s.costPerSec && p.res < skillCost(p, s)) { ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(x, y, 40, 40); }
    drawIcon(lock ? "lock" : s.icon, x + 20, y + 18, 28, { gray: lock });
    text(lock ? `Lv${s.unlock}` : s.short || s.name, x + 20, y + 52, 10, lock ? "#888" : "#ddd", "center");
    text(["U", "I", "O"][i], x + 35, y + 11, 10, "#fff", "center");
  });
}, 60);

// ----- 터치 버튼 -----
hookOn("touchButtons", (list, s) => {
  const p = game.player; if (!p) return list;
  clsPrepare(p);
  const cls = playerCls(p), def = CLASS_DEFS[cls];
  const W0 = view.w, H = view.h;
  // 원래 버튼(공격·구르기·활·화살·물약·열기)은 예전 자리 그대로 두고 (손에 익은 자리), 기술 버튼은 그 왼쪽에 따로
  const out = [];
  for (const b of list) {
    if (cls === "hunter" && b.code === "TouchBow") continue; // 사냥꾼은 공격 버튼이 활이에요
    const atk = b.code === "TouchAttack";
    out.push(atk ? { ...b, icon: def.icon, label: classSkill(cls, "basic").short } : b);
  }
  const sp = { s1: ["TouchSkill1", 395, 66, 38], s2: ["TouchSkill2", 405, 156, 36], ult: ["TouchUlt", 478, 108, 36] };
  for (const slot of SKILL_SLOTS) {
    const sk = classSkill(cls, slot), [code, dx, dy, r] = sp[slot];
    const lock = !skillUnlocked(sk);
    const cd = p.cd[slot], tot = skillCooldown(p, sk) || 1;
    out.push({ code, icon: sk.icon, label: lock ? `Lv${sk.unlock}` : sk.short || sk.name, x: W0 - dx * s, y: H - dy * s, r: r * s,
      color: lock ? "#555" : slot === "ult" ? "#b8901a" : def.color, dark: false, cd: lock ? 0 : Math.min(1, cd / tot), lowRes: !lock && !sk.costPerSec && p.res < skillCost(p, sk), locked: lock });
  }
  return out;
}, 40);
// 쿨다운 표시는 버튼 위에 덧그려요
hookOn("hudDraw", () => {
  if (!touch.show || typeof touchButtons !== "function") return;
}, 70);
hookOn("touchDraw", () => {
  for (const b of touchButtons()) {
    if (!(b.cd > 0 || b.lowRes)) continue;
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.moveTo(b.x, b.y);
    ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (b.cd > 0 ? b.cd : 1)); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}, 60);

// ----- 직업 훈련관 (캠프) -----
const trainer = { x: 5.4, y: 11.4, placed: false };
function trainerSpot() {
  if (!trainer.placed && typeof findFreeSpot === "function" && game.scene === "lobby") { const s = findFreeSpot(5.4, 11.4, 0.45, 3); if (s) { trainer.x = s.x; trainer.y = s.y; } trainer.placed = true; }
  return trainer;
}
function trainerThings(things) {
  const t = trainerSpot();
  things.push({ depth: t.x + t.y, draw: () => {
    drawBox(t.x - 0.35, t.y - 0.35, 0, 0.7, 0.7, 0.25, "#6b5a4a");
    CLASS_ORDER.forEach((c, i) => {
      const a = (i / 4) * Math.PI * 2 + 0.6, fx = t.x + Math.cos(a) * 0.25, fy = t.y + Math.sin(a) * 0.25;
      drawBox(fx - 0.03, fy - 0.03, 0.25, 0.06, 0.06, 0.7, "#4a3a2a");
      drawBox(fx + 0.02, fy - 0.02, 0.72, 0.22, 0.04, 0.15, CLASS_DEFS[c].color);
    });
    if (!game.profile.clsSeen) { const s = toScreen(t.x, t.y, 1.4 + Math.sin(game.time * 5) * 0.1); text("!", s.x, s.y, 30, "#ffd84a", "center"); }
  } });
}
hookOn("lobbyInteractables", (list) => {
  const t = trainerSpot();
  list.push({ x: t.x, y: t.y, range: 1.7, label: "직업 훈련관", short: "직업", prompt: "직업 고르기", action: openClassPicker });
  return list;
}, 60);
hookOn("dungeonStarted", () => {}, 60);

const picker = { idx: 0 };
function openClassPicker() { game.overlay = "classes"; picker.idx = Math.max(0, CLASS_ORDER.indexOf(game.profile.cls)); game.profile.clsSeen = true; saveProfile(); sfx.equip(); }
function chooseClass(c) {
  const pr = game.profile; pr.cls = c; saveProfile();
  for (const p of allPlayers()) if (!p.pid || p.pid === 1) { p.cls = undefined; p._cls = null; refreshGear(); clsPrepare(p); }
  allies = allies.filter((w) => w.owner !== game.player);
  spawnBurst(game.player.x, game.player.y, [CLASS_DEFS[c].color, "#ffffff"], 18);
  showMessage(`${josa(CLASS_DEFS[c].name, "이/가")} 되었어요!`, 2, true);
  sfx.levelUp();
}
function toggleMod(c, slot) { const m = game.profile.skillMods[c]; m[slot] = m[slot] === "A" ? "B" : "A"; saveProfile(); sfx.equip(); }

hookOn("overlayUpdate", (name) => {
  if (name !== "classes") return false;
  if (wasPressed("ArrowLeft", "KeyA")) picker.idx = (picker.idx + 3) % 4;
  if (wasPressed("ArrowRight", "KeyD")) picker.idx = (picker.idx + 1) % 4;
  const c = CLASS_ORDER[picker.idx];
  if (wasPressed("Digit1")) toggleMod(c, "s1");
  if (wasPressed("Digit2")) toggleMod(c, "s2");
  if (wasPressed("Enter", "Space")) { chooseClass(c); closeOverlay(); }
  if (wasPressed("Escape", "KeyE")) closeOverlay();
  return true;
});
hookOn("overlayDraw", (name) => {
  if (name !== "classes") return false;
  const VW = view.w, VH = view.h, pr = game.profile;
  const pw = Math.min(980, VW - 20), ph = Math.min(600, VH - 20), x0 = (VW - pw) / 2, y0 = (VH - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("직업 훈련관", x0 + 22, y0 + 40, 26, "#ffe27a");
  text(`지금: ${CLASS_DEFS[pr.cls].name} · 레벨·장비는 같이 써요`, x0 + 200, y0 + 38, 15, "#ccc");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  const gap = 10, cw = (pw - 40 - gap * 3) / 4;
  CLASS_ORDER.forEach((c, i) => {
    const d = CLASS_DEFS[c], cx = x0 + 20 + i * (cw + gap), cy = y0 + 62, sel = picker.idx === i, ch = 56;
    drawButton(cx, cy, cw, ch, `   ${d.name}`, () => { picker.idx = i; }, { selected: sel, size: 19, color: pr.cls === c ? "rgba(80,200,120,0.35)" : undefined });
    ctx.font = `bold 19px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
    drawIcon(d.icon, cx + cw / 2 - ctx.measureText(d.name).width / 2 - 12, cy + ch / 2, 30);
  });
  const c = CLASS_ORDER[picker.idx], d = CLASS_DEFS[c];
  let y = y0 + 150;
  text(d.desc, x0 + 24, y, 17, "#fff"); y += 24;
  text(`${d.res.name}: ${d.res.rule} · 하트 ×${d.hpMul}`, x0 + 24, y, 14, d.res.color); y += 16;
  const rows = ["basic", "s1", "s2", "ult"], rh = Math.min(84, (y0 + ph - 80 - y) / 4);
  rows.forEach((slot, i) => {
    const s = classSkill(c, slot), ry = y + i * rh, open = skillUnlocked(s);
    roundRectPath(x0 + 18, ry, pw - 36, rh - 6, 8); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill();
    const tag = { basic: "기본 공격", s1: "기술 1 (U)", s2: "기술 2 (I)", ult: "궁극기 (O)" }[slot];
    text(tag, x0 + 30, ry + 22, 13, slot === "ult" ? "#ffd84a" : "#aaa");
    drawIcon(open ? s.icon : "lock", x0 + 62, ry + 46, 34, { gray: !open });
    text(s.name + (open ? "" : `  (Lv ${s.unlock}에 열려요)`), x0 + 130, ry + 22, 17, open ? "#fff" : "#888");
    const cost = s.cost ? `${d.res.name} ${s.cost}${s.costPerSec ? "/초" : ""}` : "";
    const cool = s.cooldown ? `쿨다운 ${s.cooldown}초` : "";
    text([s.desc, cost, cool].filter(Boolean).join(" · "), x0 + 130, ry + 44, 12, "#bbb");
    if (s.mods && rh > 60) {
      const m = pr.skillMods[c][slot];
      ["A", "B"].forEach((k, j) => {
        const bx = x0 + 130 + j * 250;
        drawButton(bx, ry + 52, 240, rh - 62, `${m === k ? "●" : "○"} ${s.mods[k].name}`, () => { if (pr.skillMods[c][slot] !== k) toggleMod(c, slot); }, { selected: m === k, size: 13 });
      });
    }
  });
  drawButton(x0 + pw - 220, y0 + ph - 60, 200, 46, pr.cls === c ? "지금 이 직업이에요" : `${d.name} 하기!`, () => { chooseClass(c); closeOverlay(); }, { color: "rgba(80,200,120,0.45)", size: 19 });
  text("변형은 1·2 키 또는 버튼으로 바꿔요", x0 + 24, y0 + ph - 30, 13, "#999");
  return true;
});

// 처음 캠프: 직업 훈련관 안내 (자동으로 창을 열지는 않아요)
hookOn("playersUpdated", () => {
  if (game.scene === "lobby" && game.profile && !game.profile.clsSeen && !game._clsHint) { game._clsHint = true; showMessage("직업 훈련관(깃발)에서 직업을 골라요!", 3, false, "#ffd84a"); }
}, 70);
