// ===== 월드 5 보스 14: 틈새 거인 (rift) (설계서 docs/design/world5-void.md 5-12) =====
// 새 모습: 회색 돌 거인 + 가슴의 틈(별빛이 새어 나와요) + 별 조각 어깨. 큰 눈, 무섭지 않게.
// 1단계: 주먹 쿵 · 별빛 조각 비 · 회색 물결
// 2단계: 틈새 당기기(끌어당긴 뒤 가운데 별빛 펑) · 그림자 꼬마 부르기
// 3단계: 틈새 닫기 — 색 수정 4개를 모두 켜 두면(각 8초) "으앗, 눈부셔!" 6초 크게 비틀 + 8%. 공허 보스 규칙(하나씩)도 그대로
// 이기면: 틈이 거의 닫혀요. 그런데 틈 너머에서 블랙홀이 별을 삼키고 있어요 (15번째 별을 삼키는 곳으로: bosses_w5hole.js)
// 같이 하기: 상태는 보스·수정 소품 칸, 계산은 방장만 (bosses_w5echo.js 의 w5b* 도우미를 써요)

const W5R = { closeStun: 6.0, closeFrac: 0.08 };
Object.assign(MATERIALS, { w5_riftShard: { name: "틈새 별빛 조각", color: "#fff6d8", enchant: "chain" } });
Object.assign(ABILITIES, {
  w5_rgSlam: { name: "틈새 주먹 쿵", desc: "큰 돌 주먹으로 앞을 쿵! 그 뒤 숨을 골라요.", counter: "빨간 원 밖으로! 숨 고를 때 공격",
    tags: ["boss", "area", "stagger"], telegraph: { shape: "circle", radius: 2.4, at: "front", offset: 1.8, time: 1.2 },
    cooldown: 5, range: [0, 4], damageMul: 2.2, anim: "slam", staggerAfter: 2.0, effect: { type: "knockback", force: 1.4 } },
  w5_rgShards: { name: "별빛 조각 비", desc: "가슴 틈에서 별빛 조각이 여러 군데 떨어져요.", counter: "원 사이로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.2 },
    cooldown: 8, range: [0, 14], damageMul: 1.3, anim: "roar", effect: { type: "rain", count: 8, spread: 4.0, stagger: 0.15 } },
  w5_rgPull: { name: "틈새 당기기", desc: "틈새가 빙글 돌며 둘레를 끌어당겨요. 곧 가운데가 펑!", counter: "당겨지면 바로 바깥으로 걸어 나가요",
    tags: ["boss", "pull"], telegraph: { shape: "circle", radius: 7, at: "self", time: 1.4 },
    cooldown: 12, range: [0, 7], damageMul: 0, anim: "roar", effect: { type: "pull", force: 3.0 } },
  w5_rgCore: { name: "틈새 별빛 펑", desc: "거인 둘레 가운데가 별빛으로 펑!", counter: "거인 곁 원 밖으로",
    tags: ["boss", "area"], telegraph: { shape: "circle", radius: 2.2, at: "self", time: 1.3 },
    cooldown: 12, range: [0, 40], damageMul: 1.8, anim: "slam", effect: { type: "knockback", force: 1.4 } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w5_rgSlam: { text: "원 밖으로! 그다음 공격" },
  w5_rgShards: { text: "원 사이로" },
  w5_rgPull: { text: "바깥으로 걸어 나가요" },
  w5_rgCore: { text: "거인 곁 원 밖으로" },
});
MONSTERS.w5_riftGiant = { name: "틈새 거인", shape: "w5_riftGiant", behavior: "w5_echoAI", color: "#6a6478", hp: 380, speed: 1.1, damage: 2.8,
  xp: 100, emerald: 1, emeraldCount: 24, heavy: true, isBoss: true, size: 3.4, world: 5 };
BOSS_DEFS.rift = {
  id: "w5_riftGiant", name: "틈새 거인", title: "공허의 틈새", size: 3.4, world: 5,
  material: { id: "w5_riftShard", name: "틈새 별빛 조각", color: "#fff6d8", enchant: "chain" },
  arena: { size: 28, theme: { floor: "#7a7488", moss: "#d8c0ff", wall: "#403a50", darkness: 0.5, bg: "#06040c" },
    build(w) {
      const c = w.W / 2;
      w5AddHole(w, { x0: c - 10, y0: c - 1, x1: c - 7.5, y1: c + 1 }, []); w5AddHole(w, { x0: c + 7.5, y0: c - 1, x1: c + 10, y1: c + 1 }, []); // 양쪽 작은 틈 (가장자리 장식, 길은 안 막아요)
    } },
  phases: [
    { until: 0.66, gap: 1.7, pattern: ["w5_rgSlam", "w5_rgShards", "w5_rgSlam", "w5_grayWave"] },
    { until: 0.33, gap: 1.5, pattern: ["w5_rgPull", "w5_rgCore", "w5_rgSlam", "w5_shadeCall", "w5_rgShards"] },
    { until: 0, gap: 1.4, pattern: ["w5_rgPull", "w5_rgCore", "w5_rgShards", "w5_rgSlam", "w5_voidRain", "w5_grayWave", "w5_rgSlam"] },
  ].map((ph) => ({ ...ph, abilities: [...new Set(ph.pattern)] })),
  create(x, y, level) {
    const m = createMonster("w5_riftGiant", x, y, level);
    m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS.rift;
    m.name = "공허의 틈새, 틈새 거인";
    m.r = 1.25; m.level = level; m.aggro = true; m.appearTimer = 1;
    m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = []; m.w5Rift = true;
    m.onPhase = (idx) => {
      if (idx === 1) showMessage("틈새가 당겨요! 당겨지면 바로 바깥으로 걸어 나가요", 3, false, "#d8c8ff");
      if (idx === 2) showMessage("틈새를 닫아요! 색 수정 네 개를 한꺼번에 켜 두면 거인이 크게 비틀!", 3.5, false, "#ffe27a");
    };
    return m;
  },
};
if (typeof defBase === "function" && typeof BOSS_LEGENDS !== "undefined") {
  defBase("L_w5Rift", { slot: "charm", legend: "rift", name: "틈새 별빛 왕관", minL: 0, icon: "crown", color: "#fff6d8", perk: { hearts: 3, dmg: 0.1, luck: 0.2 }, desc: "틈새를 닫은 증표: 하트·공격력·행운이 올라요" });
  BOSS_LEGENDS.rift = "L_w5Rift";
}
// 3단계 틈새 닫기 (방장)
hookOn("dungeonTick", () => {
  const b = typeof w5bBoss === "function" ? w5bBoss() : null;
  if (!b || b.type !== "w5_riftGiant" || (b.phaseIdx || 0) < 2 || b.w5Hide > 0) return;
  const cr = w5bProps("w5_bcrystal");
  if (cr.length < 4 || !cr.every((o) => o.lit > 0)) return;
  for (const o of cr) o.lit = 0;
  b.w5ColorT = 6; b.w5RuleCd = 6;
  w5bStun(b, W5R.closeStun, W5R.closeFrac, "으앗, 눈부셔! 틈새가 닫혀요", "#fff6d8");
  game.shake = Math.max(game.shake || 0, 0.7);
  for (let i = 0; i < 30; i++) addSparkle(b.x, b.y, 1.6, { vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vz: 3, gravity: 3, life: 1.0, size: 0.7, hue: Math.random() * 360 });
}, 42);
// 이기면: 틈이 거의 닫혀요. 열린 결말(별빛도 그림자도 아닌 색)은 블랙홀을 이긴 뒤 (w5VoidEnding)
function w5RiftEnding() { return "틈새 거인이 잠들었어요! 그런데 틈 너머에서 무언가가 별을 꿀꺽꿀꺽 삼키고 있어요…"; }
hookOn("monsterKilled", (m) => {
  if (!m || m.type !== "w5_riftGiant" || m.trophy) return;
  showMessage(w5RiftEnding(), 6, false, "#fff6d8");
  hookRun("w5RiftClosed");
});
// 모습: 회색 돌 거인, 가슴 틈(별빛), 어깨 별 조각, 큰 눈 (체력이 줄수록 색이 돌아와요: 메아리와 같은 회색 칠하기)
if (typeof EXTRA_SHAPES !== "undefined") EXTRA_SHAPES.w5_riftGiant = (m) => {
  const a = bossMotion(m), P = [], st = "#7a7488", dk = "#5a5468", sq = a.stag ? 0.88 : 1, glow = 0.5 + 0.5 * Math.sin(game.time * 3);
  for (const sd of [1, -1]) P.push([0.04 + a.walk * sd * 0.05, sd * 0.13, 0, 0.17, 0.15, 0.2, dk]);
  P.push([0, 0, 0.2, 0.42, 0.46, 0.4 * sq + a.breath, st]);
  P.push([0.212, 0, 0.26, 0.02, 0.06, 0.28 * sq, "#fff6d8", true], [0.214, 0.03, 0.34, 0.02, 0.03, 0.12, glow > 0.5 ? "#ffe9a8" : "#d8c8ff", true]); // 가슴 틈
  P.push([0.02, 0, 0.6 * sq + a.breath, 0.34, 0.36, 0.28, st]);
  eyes(P, 0.192, 0.08, 0.72 * sq + a.breath, 0.08, "#2a2240", a.stag);
  const arm = 0.32 + 0.3 * a.raise;
  for (const sd of [1, -1]) {
    P.push([0.04, sd * 0.3, arm, 0.14, 0.14, 0.26, dk], [0.08 + a.raise * 0.1, sd * 0.32, arm - 0.08, 0.18, 0.18, 0.12, st]);
    P.push([-0.02, sd * 0.26, 0.6 * sq + 0.12, 0.1, 0.1, 0.1, "#fff6d8", true]); // 어깨 별 조각
  }
  const k = typeof w5EchoGrayK === "function" ? w5EchoGrayK(m) : 0;
  w5DrawGray(k * 0.7, () => drawVoxelParts(m, P, { top: 1.0 }));
};
if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE.rift = { 0: "주먹 쿵 뒤에 공격해요", 1: "당겨지면 바로 바깥으로!", 2: "색 수정 네 개를 한꺼번에 켜요!" };
