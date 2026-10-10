// ===== 월드 7 "픽셀 사이버 세계" 보스 10명 (설계서 docs/design/world7-cyber.md 5장) =====
// 모두 새 모습·새 기술 (예전 보스를 빌리지 않아요). 3단계(0.66/0.33), bossAI 정해진 순서. 단계마다 기술 2가지 이상을 섞어요.
// 사이버 보스 규칙: 아레나 네 귀퉁이 "백신 단말기"(w7_vterm). 치면 보스에게 백신 빛줄기! 보스가 9칸 안이면 비틀 2.5초 + 3% (단말기마다 12초 쉬기).
// 같이 하기: 단말기 상태(w7Cd)는 소품 몬스터 칸이라 친구 화면에도 가요. 계산은 방장만 (monsterDamage 는 방장에서 처리).

const W7B = { termR: 9, stun: 2.5, frac: 0.03, termCd: 12 };
function w7bBoss() { const b = typeof w2BossNow === "function" ? w2BossNow() : null; return b && b.hp > 0 && b.bossDef && b.bossDef.world === 7 ? b : null; }

// ----- 사이버 공통 기술 -----
Object.assign(ABILITIES, {
  w7_byteRain: { name: "바이트 비", desc: "네모난 데이터 덩이가 여러 군데 떨어져요.", counter: "원들 사이 빈 곳으로 걸어가요",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.0, at: "target", time: 1.2 }, cooldown: 9, range: [0, 40], damageMul: 1.3, anim: "raise", effect: { type: "rain", count: 6, spread: 3.4, stagger: 0.18 } },
  w7_pingRing: { name: "핑 고리", desc: "보스 둘레로 핑! 고리가 퍼져요. 보스 바로 곁은 안전해요.", counter: "고리 안쪽, 보스 곁으로!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 6, inner: 2.2, at: "self", time: 1.3 }, cooldown: 10, range: [0, 40], damageMul: 1.4, anim: "roar", effect: { type: "knockback", force: 1.0 } },
  w7_gridLaser: { name: "격자 레이저", desc: "앞으로 쭉 레이저가 나가요.", counter: "빨간 길 옆으로 비켜요",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 14, width: 1.3, at: "self", time: 1.2 }, cooldown: 7, range: [0, 40], damageMul: 1.5, anim: "point", effect: { type: "damage" } },
  w7_bugCall: { name: "버그 부르기", desc: "비트 벌레 둘을 불러요.", counter: "벌레부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise", effect: { type: "summon", monster: "w7_bitBug", count: 2 } },
  w7_droneCall: { name: "드론 부르기", desc: "데이터 드론 둘을 불러요.", counter: "드론부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.2, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise", effect: { type: "summon", monster: "w7_drone", count: 2 } },
  // 1 테트로
  w7_a_blockDrop: { name: "블록 떨어뜨리기", desc: "커다란 네모 블록이 하늘에서 쿵 떨어져요.", counter: "원 밖으로!",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 1.3, at: "target", time: 1.2 }, cooldown: 7, range: [0, 40], damageMul: 1.4, anim: "raise", effect: { type: "rain", count: 4, spread: 3.0, stagger: 0.25 } },
  w7_a_lineClear: { name: "한 줄 지우기", desc: "번쩍! 넓은 한 줄이 싹 지워져요.", counter: "넓은 빨간 줄 밖으로",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 16, width: 2.0, at: "self", time: 1.4 }, cooldown: 8, range: [0, 40], damageMul: 1.6, anim: "point", effect: { type: "damage" } },
  // 2 찌릿이
  w7_b_dash: { name: "패킷 돌진", desc: "장어가 빨간 줄을 따라 쭉 미끄러져 와요. 벽에 쿵 하면 멍해요.", counter: "줄 옆으로! 벽에 쿵 하면 때려요",
    tags: ["boss", "line", "move"], telegraph: { shape: "line", length: 8, width: 1.3, at: "self", time: 1.0 }, cooldown: 6, range: [1.5, 9], damageMul: 1.5, anim: "crouch", effect: { type: "charge", speed: 9, stunOnWall: 1.6 } },
  w7_b_zap: { name: "찌릿 구슬", desc: "찌릿찌릿 번개 구슬을 사방으로 쏴요.", counter: "구슬 사이 빈틈으로",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.0 }, cooldown: 7, range: [0, 40], damageMul: 0.9, anim: "roar", effect: { type: "nova", count: 10, speed: 4.4, color: "#ffe94d" } },
  // 3 활활이
  w7_c_fireWall: { name: "불벽 세우기", desc: "땅에 불벽 장판을 세워요. 안에 있으면 조금씩 아파요.", counter: "장판 밖에서 싸워요",
    tags: ["boss", "zone"], telegraph: { shape: "circle", radius: 1.8, at: "target", time: 1.1 }, cooldown: 7, range: [0, 40], damageMul: 0.45, anim: "slam", effect: { type: "zone", duration: 6, tick: 0.8, kind: "fire" } },
  w7_c_shieldBash: { name: "방패 밀치기", desc: "방패로 앞을 쾅! 부채꼴로 밀어내요.", counter: "옆이나 뒤로 돌아가요",
    tags: ["boss", "cone"], telegraph: { shape: "cone", length: 4.2, angle: 1.2, at: "self", time: 0.95 }, cooldown: 5, range: [0, 4.5], damageMul: 1.6, anim: "slam", effect: { type: "knockback", force: 1.3 } },
  // 4 지지직
  w7_d_blink: { name: "지지직 순간이동", desc: "지지직이 사라졌다가 주인공 자리로 뿅 나타나요.", counter: "빨간 원 밖으로",
    tags: ["boss", "move"], telegraph: { shape: "circle", radius: 1.6, at: "target", time: 1.2 }, cooldown: 7, range: [0, 40], damageMul: 1.5, anim: "crouch", effect: { type: "teleport" } },
  w7_d_static: { name: "잡음 파동", desc: "지지직 잡음이 둘레로 퍼져요. 바로 곁은 조용해요.", counter: "지지직 곁으로 쏙!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 5.5, inner: 1.8, at: "self", time: 1.2 }, cooldown: 8, range: [0, 40], damageMul: 1.4, anim: "roar", effect: { type: "knockback", force: 0.9 } },
  // 5 윙윙이
  w7_e_suck: { name: "빨아들이는 바람", desc: "냉각팬이 거꾸로 돌아 바람이 빨아들여요.", counter: "보스 반대쪽으로 걸어요",
    tags: ["boss", "pull"], telegraph: { shape: "circle", radius: 7, at: "self", time: 1.3 }, cooldown: 9, range: [0, 40], damageMul: 0, anim: "roar", effect: { type: "pull", force: 2.6 } },
  w7_e_fanBlast: { name: "찬바람 펑", desc: "앞으로 부채꼴 찬바람을 펑! 맞으면 멀리 밀려요.", counter: "옆으로 돌아가요",
    tags: ["boss", "cone"], telegraph: { shape: "cone", length: 7, angle: 0.9, at: "self", time: 1.1 }, cooldown: 6, range: [0, 7], damageMul: 1.4, anim: "point", effect: { type: "knockback", force: 1.6 } },
  // 6 둥실이
  w7_f_upload: { name: "업로드 비", desc: "구름에서 사진 조각이 여기저기 떨어져요.", counter: "원 사이 빈 곳으로",
    tags: ["boss", "multi"], telegraph: { shape: "circle", radius: 0.9, at: "target", time: 1.3 }, cooldown: 8, range: [0, 40], damageMul: 1.2, anim: "raise", effect: { type: "rain", count: 8, spread: 4.0, stagger: 0.15 } },
  w7_f_thunder: { name: "구름 번개", desc: "구름 다리에서 번개가 한 줄로 쭉!", counter: "번개 길 옆으로",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 12, width: 1.2, at: "self", time: 1.2, follow: true }, cooldown: 6, range: [0, 40], damageMul: 1.5, anim: "point", effect: { type: "damage" } },
  // 7 띵동이
  w7_g_mailVolley: { name: "편지 폭탄", desc: "편지 일곱 장을 부채꼴로 휙휙!", counter: "옆으로 돌거나 가까이 붙어요",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 7, angle: 1.0, at: "self", time: 1.0 }, cooldown: 6, range: [0, 40], damageMul: 1.0, anim: "point", effect: { type: "volley", count: 7, spread: 1.0, speed: 6, color: "#fff4d8" } },
  w7_g_spamCall: { name: "스팸 편지 부르기", desc: "띵동! 스팸 편지 셋이 날아와요.", counter: "편지부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise", effect: { type: "summon", monster: "w7_spam", count: 3 } },
  // 8 집집이
  w7_h_claw: { name: "집게 내리기", desc: "커다란 집게가 주인공을 따라오다 쿵 내려와요.", counter: "원이 멈추면 옆으로!",
    tags: ["boss"], telegraph: { shape: "circle", radius: 1.5, at: "target", time: 1.2, follow: true }, cooldown: 5, range: [0, 40], damageMul: 1.6, anim: "slam", effect: { type: "damage" } },
  w7_h_coins: { name: "동전 와르르", desc: "동전이 사방으로 와르르 쏟아져요.", counter: "동전 사이 빈틈으로",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 1.6, at: "self", time: 1.1 }, cooldown: 8, range: [0, 40], damageMul: 0.9, anim: "roar", effect: { type: "nova", count: 12, speed: 3.8, color: "#ffd23f" } },
  // 9 꿈틀이
  w7_i_spit: { name: "버그 침", desc: "버그 침을 다섯 방울 퉤퉤!", counter: "옆으로 돌아요",
    tags: ["boss", "projectile"], telegraph: { shape: "cone", length: 6, angle: 0.8, at: "self", time: 0.95 }, cooldown: 5, range: [0, 40], damageMul: 1.0, anim: "point", effect: { type: "volley", count: 5, spread: 0.8, speed: 5.5, color: "#9aff4a" } },
  w7_i_goo: { name: "끈적 코드", desc: "끈적한 코드를 바닥에 뿌려요. 밟으면 느려져요.", counter: "끈적 장판을 피해 걸어요",
    tags: ["boss", "zone"], telegraph: { shape: "circle", radius: 2.0, at: "target", time: 1.1 }, cooldown: 8, range: [0, 40], damageMul: 0.5, anim: "slam", effect: { type: "zone", duration: 6, tick: 1.0, kind: "web" } },
  w7_i_eggs: { name: "버그 알 깨우기", desc: "버그 알이 깨어나 비트 벌레 셋이 나와요.", counter: "벌레부터 정리해요",
    tags: ["boss", "summon"], telegraph: { shape: "self", radius: 1.4, at: "self", time: 1.0 }, cooldown: 14, range: [0, 40], damageMul: 0, anim: "raise", effect: { type: "summon", monster: "w7_bitBug", count: 3 } },
  // 10 블루스크린
  w7_j_bsod: { name: "블루스크린 파동", desc: "화면이 파랗게! 커다란 파동이 둘레로 퍼져요. 블루스크린 바로 곁만 안전해요.", counter: "보스 곁 안쪽 원으로 쏙!",
    tags: ["boss", "ring"], telegraph: { shape: "ring", radius: 9, inner: 2.4, at: "self", time: 1.6 }, cooldown: 12, range: [0, 40], damageMul: 1.8, anim: "roar", effect: { type: "knockback", force: 1.2 } },
  w7_j_cross: { name: "오류 레이저", desc: "오류 레이저가 주인공을 따라오다 쭉!", counter: "줄이 멈추면 옆으로 한 걸음",
    tags: ["boss", "line"], telegraph: { shape: "line", length: 18, width: 1.4, at: "self", time: 1.2, follow: true }, cooldown: 6, range: [0, 40], damageMul: 1.6, anim: "point", effect: { type: "damage" } },
  w7_j_reboot: { name: "다시 시작 구슬", desc: "다시 시작! 구슬 열여섯 개가 사방으로 퍼져요.", counter: "구슬 사이 빈틈으로",
    tags: ["boss", "projectile"], telegraph: { shape: "self", radius: 2.0, at: "self", time: 1.2 }, cooldown: 9, range: [0, 40], damageMul: 0.9, anim: "raise", effect: { type: "nova", count: 16, speed: 4.0, color: "#4a8aff" } },
});
if (typeof GUIDE_TEXT !== "undefined") Object.assign(GUIDE_TEXT, {
  w7_byteRain: { text: "원 사이 빈 곳으로" }, w7_pingRing: { text: "고리 안쪽, 보스 곁으로!", do: true }, w7_gridLaser: { text: "레이저 옆으로" }, w7_bugCall: { text: "벌레부터 정리해요" }, w7_droneCall: { text: "드론부터 정리해요" },
  w7_a_blockDrop: { text: "블록! 원 밖으로" }, w7_a_lineClear: { text: "넓은 줄 밖으로!" }, w7_b_dash: { text: "돌진! 줄 옆으로" }, w7_b_zap: { text: "구슬 사이로" },
  w7_c_fireWall: { text: "불벽 밖에서" }, w7_c_shieldBash: { text: "옆으로 돌아요" }, w7_d_blink: { text: "원 밖으로" }, w7_d_static: { text: "지지직 곁으로!", do: true },
  w7_e_suck: { text: "반대쪽으로 걸어요" }, w7_e_fanBlast: { text: "옆으로!" }, w7_f_upload: { text: "원 사이로" }, w7_f_thunder: { text: "번개 길 옆으로" },
  w7_g_mailVolley: { text: "옆으로 돌아요" }, w7_g_spamCall: { text: "편지부터 정리해요" }, w7_h_claw: { text: "원이 멈추면 옆으로" }, w7_h_coins: { text: "동전 사이로" },
  w7_i_spit: { text: "옆으로" }, w7_i_goo: { text: "끈적 장판 피해요" }, w7_i_eggs: { text: "벌레부터!" },
  w7_j_bsod: { text: "블루스크린 곁으로!", do: true, voice: true }, w7_j_cross: { text: "줄이 멈추면 옆으로" }, w7_j_reboot: { text: "구슬 사이로" },
});

// ----- 아레나 소품: 백신 단말기 -----
MONSTERS.w7_vterm = { name: "백신 단말기", color: "#5ad8ff", shape: "w7_vterm", behavior: "prop", hp: 9999, speed: 0, damage: 0, xp: 0, emerald: 0, heavy: true, world: 7, codexSkip: true };
if (typeof ELITE_RULES !== "undefined" && ELITE_RULES.notElite) ELITE_RULES.notElite.push("w7_vterm");
if (typeof CODEX_SKIP !== "undefined") CODEX_SKIP.add("w7_vterm");
if (typeof BEHAVIOR_DOCS !== "undefined") BEHAVIOR_DOCS.w7_bossAI = { name: "사이버 보스", desc: "단계마다 정해진 순서로 기술 두세 가지를 섞어 써요.", counter: "백신 단말기를 치면 보스가 비틀해요 (9칸 안일 때)" };
if (typeof EXTRA_BEHAVIORS !== "undefined") EXTRA_BEHAVIORS.w7_bossAI = (m, p, dist, dt) => {
  if (EXTRA_BEHAVIORS.bossAI) EXTRA_BEHAVIORS.bossAI(m, p, dist, dt);
  m.staggerT = m.stagger > 0 ? m.stagger : 0; // 머리 위 별 (b2DrawBody)
};

// ----- 보스 목록 -----
const W7_BOSS_LIST = [
  { mapId: "pixeltown", type: "w7_tetro", name: "블록 로봇 테트로", hp: 500, size: 2.6, speed: 1.2, color: "#4a8aff",
    calm: "블록이 딱 맞았어! 이제 다시 마을을 예쁘게 쌓을게.", line: "원래는 픽셀 마을 집을 블록으로 쌓아 주던 꼬마 건축 로봇이었어요",
    material: { id: "w7_block", name: "반짝 블록", color: "#4a8aff" },
    legend: { id: "L_w7_pixeltown", slot: "charm", name: "픽셀 블록 목걸이", icon: "amulet", color: "#4a8aff", perk: { hearts: 3, block: 0.06 }, desc: "테트로의 블록: 하트 +3, 막기 +6%" },
    phases: [["w7_a_blockDrop", "w7_a_lineClear", "w7_a_blockDrop"], ["w7_a_blockDrop", "w7_a_lineClear", "w7_byteRain", "w7_a_lineClear"], ["w7_a_lineClear", "w7_a_blockDrop", "w7_pingRing", "w7_a_blockDrop", "w7_a_lineClear"]] },
  { mapId: "datariver", type: "w7_eel", name: "패킷 장어 찌릿이", hp: 512, size: 2.6, speed: 1.4, color: "#3ae0c8",
    calm: "데이터 강이 다시 맑게 흘러! 찌릿찌릿 미안해.", line: "원래는 데이터 강에서 편지(패킷)를 배달하던 장어였어요",
    material: { id: "w7_packet", name: "패킷 비늘", color: "#3ae0c8" },
    legend: { id: "L_w7_datariver", slot: "weapon", name: "찌릿 케이블 창", effect: "chain", mul: 1.09, color: "#3ae0c8", forms: { w: "찌릿 케이블 창", m: "찌릿 케이블 지팡이", d: "찌릿 케이블 지팡이", h: "찌릿 케이블 단검" }, desc: "찌릿이의 창: 옆 몬스터에게 번개가 튀어요" },
    phases: [["w7_b_dash", "w7_b_zap", "w7_b_dash"], ["w7_b_dash", "w7_b_zap", "w7_gridLaser", "w7_b_zap"], ["w7_b_zap", "w7_b_dash", "w7_gridLaser", "w7_b_dash", "w7_byteRain"]] },
  { mapId: "firewallgate", type: "w7_fireKnight", name: "방화벽 기사 활활이", hp: 524, size: 2.8, speed: 1.1, color: "#ff7a4a",
    calm: "나쁜 버그만 막으려던 건데… 친구까지 막아서 미안해!", line: "원래는 나쁜 버그만 막아 주던 든든한 문지기 기사였어요",
    material: { id: "w7_firebrick", name: "불꽃 벽돌", color: "#ff7a4a" },
    legend: { id: "L_w7_firewallgate", slot: "charm", name: "방화벽 방패 반지", icon: "ring", color: "#ff7a4a", perk: { block: 0.14, hearts: 2 }, desc: "활활이의 방패: 막기 +14%, 하트 +2" },
    phases: [["w7_c_shieldBash", "w7_c_fireWall", "w7_c_shieldBash"], ["w7_c_fireWall", "w7_c_shieldBash", "w7_pingRing", "w7_c_shieldBash"], ["w7_c_fireWall", "w7_gridLaser", "w7_c_shieldBash", "w7_c_fireWall", "w7_pingRing"]] },
  { mapId: "glitchmaze", type: "w7_glitchGhost", name: "글리치 유령 지지직", hp: 536, size: 2.4, speed: 1.3, color: "#c07aff",
    calm: "지지직… 이제 또렷하게 보여! 숨바꼭질은 그만할게.", line: "원래는 미로 게임에서 길을 알려 주던 안내 유령이었어요",
    material: { id: "w7_static", name: "지지직 조각", color: "#c07aff" },
    legend: { id: "L_w7_glitchmaze", slot: "weapon", name: "지지직 글리치 낫", effect: "slow", mul: 1.09, color: "#c07aff", forms: { w: "지지직 글리치 낫", m: "지지직 글리치 지팡이", d: "지지직 글리치 지팡이", h: "지지직 글리치 단검" }, desc: "지지직이의 낫: 맞은 적이 지지직 느려져요" },
    phases: [["w7_d_blink", "w7_d_static", "w7_d_blink"], ["w7_d_blink", "w7_d_static", "w7_bugCall", "w7_d_static"], ["w7_d_blink", "w7_d_static", "w7_byteRain", "w7_d_blink", "w7_d_static"]] },
  { mapId: "serverfarm", type: "w7_fanGiant", name: "냉각팬 거인 윙윙이", hp: 548, size: 3.0, speed: 1.0, color: "#7affb0",
    calm: "휴, 열이 식었어. 이제 서버들이 시원하게 쉴 수 있어!", line: "원래는 뜨거운 서버를 식혀 주던 친절한 선풍기 거인이었어요",
    material: { id: "w7_fanBlade", name: "냉각팬 날개", color: "#7affb0" },
    legend: { id: "L_w7_serverfarm", slot: "charm", name: "시원 바람 팔찌", icon: "bracelet", color: "#7affb0", perk: { speed: 0.08, regen: 10, hearts: 1 }, desc: "윙윙이의 바람: 빠르기 +8%, 하트 회복, 하트 +1" },
    phases: [["w7_e_suck", "w7_e_fanBlast", "w7_e_fanBlast"], ["w7_e_suck", "w7_e_fanBlast", "w7_byteRain", "w7_e_fanBlast"], ["w7_e_suck", "w7_e_fanBlast", "w7_pingRing", "w7_droneCall", "w7_e_fanBlast"]] },
  { mapId: "cloudvault", type: "w7_cloudJelly", name: "구름 해파리 둥실이", hp: 560, size: 2.8, speed: 1.1, color: "#d8e8ff",
    calm: "사진들을 다 지켜 줘서 고마워! 이건 우리 모두의 추억이야.", line: "원래는 모두의 사진과 그림을 꼭 안고 지키던 구름 해파리였어요",
    material: { id: "w7_cloudPix", name: "구름 사진", color: "#d8e8ff" },
    legend: { id: "L_w7_cloudvault", slot: "weapon", name: "둥실 구름 망치", effect: "heal", mul: 1.09, color: "#d8e8ff", forms: { w: "둥실 구름 망치", m: "둥실 구름 지팡이", d: "둥실 구름 지팡이", h: "둥실 구름 단검" }, desc: "둥실이의 망치: 쓰러뜨리면 하트가 조금 차요" },
    phases: [["w7_f_upload", "w7_f_thunder", "w7_f_upload"], ["w7_f_upload", "w7_droneCall", "w7_f_thunder", "w7_f_upload"], ["w7_f_thunder", "w7_f_upload", "w7_pingRing", "w7_f_thunder", "w7_f_upload"]] },
  { mapId: "spamcastle", type: "w7_mailKing", name: "스팸 우편함 왕 띵동이", hp: 572, size: 2.8, speed: 1.1, color: "#ffd23f",
    calm: "편지는 진짜 친구한테만 보낼게. 띵동!", line: "원래는 친구들 편지를 하나하나 정성껏 나르던 우편함 왕이었어요",
    material: { id: "w7_stamp", name: "금빛 우표", color: "#ffd23f" },
    legend: { id: "L_w7_spamcastle", slot: "charm", name: "띵동 우표 부적", icon: "clover", color: "#ffd23f", perk: { luck: 0.3, hearts: 2 }, desc: "띵동이의 우표: 행운 +30%, 하트 +2" },
    phases: [["w7_g_mailVolley", "w7_g_spamCall", "w7_g_mailVolley"], ["w7_g_mailVolley", "w7_g_spamCall", "w7_gridLaser", "w7_g_mailVolley"], ["w7_g_mailVolley", "w7_byteRain", "w7_g_spamCall", "w7_g_mailVolley", "w7_gridLaser"]] },
  { mapId: "neonarcade", type: "w7_crane", name: "집게 크레인 집집이", hp: 584, size: 2.9, speed: 1.2, color: "#ff5ad8",
    calm: "인형을 다 놓아줬어. 같이 노는 게 더 재밌네!", line: "원래는 오락실에서 아이들에게 인형을 뽑아 주던 크레인이었어요",
    material: { id: "w7_neonCoin", name: "네온 동전", color: "#ff5ad8" },
    legend: { id: "L_w7_neonarcade", slot: "weapon", name: "네온 집게 도끼", effect: "burn", mul: 1.09, color: "#ff5ad8", forms: { w: "네온 집게 도끼", m: "네온 집게 지팡이", d: "네온 집게 지팡이", h: "네온 집게 단검" }, desc: "집집이의 도끼: 맞으면 네온 불이 붙어요" },
    phases: [["w7_h_claw", "w7_h_coins", "w7_h_claw"], ["w7_h_claw", "w7_h_coins", "w7_byteRain", "w7_h_claw"], ["w7_h_coins", "w7_h_claw", "w7_pingRing", "w7_h_claw", "w7_h_coins"]] },
  { mapId: "bugnest", type: "w7_bugQueen", name: "버그 여왕 꿈틀이", hp: 596, size: 3.0, speed: 1.0, color: "#9aff4a",
    calm: "버그 아이들이 착한 코드가 됐어! 고마워, 고마워.", line: "원래는 프로그램을 꼼꼼히 살피던 무당벌레 검사관이었어요",
    material: { id: "w7_bugShell", name: "버그 껍데기", color: "#9aff4a" },
    legend: { id: "L_w7_bugnest", slot: "charm", name: "무당벌레 반지", icon: "ring", color: "#9aff4a", perk: { crit: 0.08, hearts: 2 }, desc: "꿈틀이의 반지: 치명타 +8%, 하트 +2" },
    phases: [["w7_i_spit", "w7_i_goo", "w7_i_spit"], ["w7_i_eggs", "w7_i_goo", "w7_i_spit", "w7_i_spit"], ["w7_i_eggs", "w7_i_goo", "w7_byteRain", "w7_i_spit", "w7_pingRing"]] },
  { mapId: "kernelcore", type: "w7_bsod", name: "오류왕 블루스크린", hp: 660, size: 3.4, speed: 1.1, color: "#2a5ad8",
    calm: "다시 시작했어… 이제 머릿속이 맑아. 그런데 이 뜨거운 버그는 아래쪽에서 올라왔어.", line: "원래는 사이버 세계를 차분히 돌보던 커널 임금님이었어요",
    material: { id: "w7_kernel", name: "커널 칩", color: "#4a8aff" },
    legend: { id: "L_w7_kernelcore", slot: "weapon", name: "커널 코어 검", effect: "chain", mul: 1.12, color: "#4a8aff", forms: { w: "커널 코어 검", m: "커널 코어 지팡이", d: "커널 코어 지팡이", h: "커널 코어 단검" }, desc: "커널 임금님의 검: 옆 몬스터에게 번개 (공격력 +12%)" },
    phases: [["w7_j_cross", "w7_byteRain", "w7_j_cross", "w7_j_bsod"], ["w7_j_cross", "w7_bugCall", "w7_j_bsod", "w7_gridLaser", "w7_j_cross"], ["w7_j_bsod", "w7_j_cross", "w7_j_reboot", "w7_byteRain", "w7_j_cross", "w7_j_reboot"]] },
];
const W7_BOSS_BY_MAP = {};
const W7_BOSS_THEME = { floor: "#2a3458", moss: "#5ad8ff", wall: "#4a5490", darkness: 0.34, bg: "#04060f" };
const W7_PHASE_MSG = ["", "보스가 기술을 섞어 써요! 백신 단말기를 쳐서 멈춰요", "마지막 힘! 조금만 더, 다시 켜질 거예요!"];
for (const E of W7_BOSS_LIST) {
  W7_BOSS_BY_MAP[E.mapId] = E;
  const last = E.mapId === "kernelcore";
  MONSTERS[E.type] = { name: E.name, shape: E.type, behavior: "w7_bossAI", color: E.color, hp: E.hp, speed: E.speed, damage: last ? 3.4 : 3.2,
    xp: last ? 180 : 100, emerald: 1, emeraldCount: last ? 32 : 20, heavy: true, isBoss: true, size: E.size, world: 7 };
  MATERIALS[E.material.id] = { name: E.material.name, color: E.material.color };
  const map = typeof MAPS !== "undefined" ? MAPS.find((m) => m.id === E.mapId) : null;
  const phases = E.phases.map((pat, i) => ({ until: [0.66, 0.33, 0][i], gap: [1.8, 1.6, 1.45][i], pattern: pat, abilities: [...new Set(pat)] }));
  BOSS_DEFS[E.mapId] = {
    id: E.type, name: E.name, title: (map && map.name) || E.mapId, size: E.size, world: 7, material: E.material, w7New: true,
    arena: { size: last ? 28 : 26, theme: (map && map.theme) || W7_BOSS_THEME, build: last ? (w) => { if (typeof b2Pillars === "function") b2Pillars(w, [[-6, -6], [6, 6], [-6, 6], [6, -6]]); } : undefined },
    phases,
    create(x, y, level) {
      const m = createMonster(E.type, x, y, level);
      m.boss = true; m.bossA = true; m.bossDef = BOSS_DEFS[E.mapId];
      m.name = `${(map && map.name) || ""}, ${E.name}`;
      m.r = Math.min(1.35, 0.45 + E.size * 0.25); m.b2Scale = E.size / 2.6; m.seed = Math.random() * 10;
      m.level = level; m.aggro = true; m.appearTimer = 1;
      m.phaseIdx = 0; m.patIdx = 0; m.gap = 2.2; m.queue = []; m.w7Boss = E.mapId;
      m.onPhase = (idx) => { if (W7_PHASE_MSG[idx]) showMessage(W7_PHASE_MSG[idx], 3, false, "#8fe8ff"); };
      return m;
    },
  };
  if (typeof w6RegisterLegend === "function") w6RegisterLegend(E.mapId, E.legend);
  if (typeof GUIDE_PHASE_VOICE !== "undefined") GUIDE_PHASE_VOICE[E.mapId] = { 0: "빨간 예고를 잘 보고 피해요", 1: "백신 단말기를 쳐서 보스를 멈춰요", 2: "조금만 더! 다시 켜질 거예요" };
}
// 보스를 달래면: "다시 켜졌어요!" + 소환한 것 정리 + 마지막 보스는 다음 월드 떡밥
hookOn("monsterKilled", (m) => {
  if (!m || !m.w7Boss) return;
  const E = W7_BOSS_BY_MAP[m.w7Boss]; if (!E) return;
  for (const o of monsters) if (o.summoned && o.hp > 0 && !o.boss) { o.hp = 0; o.silent = true; }
  for (let i = 0; i < 24; i++) addSparkle(m.x, m.y, 1.2, { vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, vz: 2.5, gravity: 3, life: 1.0, size: 0.6, hue: [190, 310, 90][i % 3] });
  if (E.mapId !== "kernelcore") { showMessage(`${E.name}: "${E.calm}" (다시 켜졌어요!)`, 4, true); return; }
  const at = WORLD_ORDER.indexOf(7), next = at >= 0 ? WORLD_ORDER[at + 1] : null;
  showMessage(next && WORLDS[next] ? `블루스크린: "다시 켜졌어! 그런데 이 뜨거운 버그는 ${WORLDS[next].name}에서 올라왔어."` : `블루스크린: "다시 켜졌어! 그런데 이 뜨거운 버그는… 아래쪽 어딘가에서 올라왔어."`, 5, true);
  hookRun("w7KernelCalm", m);
}, 40);

// ===== 사이버 보스 규칙: 백신 단말기 =====
hookOn("monsterDamage", (h) => {
  const m = h && h.m; if (!m || m.type !== "w7_vterm") return false;
  if (h.opts.dot || game.time - (m.w7HitT || -9) < 0.3) return true;
  m.w7HitT = game.time;
  if ((m.w7Cd || 0) > 0) { addFloatText(m.x, m.y, `백신 충전 중 ${Math.ceil(m.w7Cd)}`, "#9ab8c8", 14); return true; }
  const b = w7bBoss();
  if (!b) return true;
  if (Math.hypot(b.x - m.x, b.y - m.y) > W7B.termR) { addFloatText(m.x, m.y, "보스가 너무 멀어요! 가까이 데려와요", "#ffd8a0", 15); return true; }
  m.w7Cd = W7B.termCd;
  bolts.push({ ax: m.x, ay: m.y, bx: b.x, by: b.y, life: 0.5, max: 0.5 });
  for (let i = 1; i <= 8; i++) addSparkle(m.x + (b.x - m.x) * i / 8, m.y + (b.y - m.y) * i / 8, 0.8, { vz: 0.5, life: 0.5, size: 0.5, hue: 190 });
  if (typeof w5bStun === "function") w5bStun(b, W7B.stun, W7B.frac, "백신 빛줄기! 비틀비틀", "#8fe8ff");
  else { b.stagger = Math.max(b.stagger || 0, W7B.stun); damageMonster(b, b.maxHp * W7B.frac, b.x, b.y, false, 0, { w7Prop: true }); }
  hookRun("w7VaccineStun", b);
  return true;
}, 4);
hookOn("dungeonTick", (dt) => {
  for (const o of monsters) if (o.type === "w7_vterm" && o.w7Cd > 0) o.w7Cd = Math.max(0, o.w7Cd - dt);
  const b = w7bBoss(); if (!b || b.w7Init) return;
  b.w7Init = true;
  const c = world.W / 2, d = Math.max(4, world.W / 2 - 4);
  for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const s = spawnProp("w7_vterm", c + ox * d * 0.78, c + oy * d * 0.78, b); s.r = 0.42; s.appearTimer = 0; s.w7Cd = 0; }
  showMessage("귀퉁이 백신 단말기를 치면 가까운 보스가 비틀해요!", 3, false, "#8fe8ff");
}, 41);
hookOn("lights", (lights) => { for (const o of monsters) if (o.type === "w7_vterm") lights.push({ x: o.x, y: o.y, radius: o.w7Cd > 0 ? 0.8 : 1.6, power: o.w7Cd > 0 ? 0.25 : 0.55 }); }, 50);
hookOn("drawMonsterUnder", (m) => {
  if (m.type !== "w7_vterm" || (m.w7Cd || 0) > 0) return;
  const b = w7bBoss(); if (!b) return;
  const c = toScreen(m.x, m.y, 0.01);
  ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, W7B.termR * TILE_W / 2 * 1.41, W7B.termR * TILE_H / 2 * 1.41, 0, 0, Math.PI * 2);
  ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(140,230,255,0.35)"; ctx.setLineDash([4, 8]); ctx.stroke(); ctx.restore();
}, 50);

// ----- 모양 -----
const W7_SHAPES = {
  w7_vterm(m) {
    const ready = !((m.w7Cd || 0) > 0), k = 0.5 + 0.5 * Math.sin(game.time * 4);
    drawBox(m.x - 0.26, m.y - 0.2, 0, 0.52, 0.4, 0.5, "#2a3458");
    drawBox(m.x - 0.3, m.y - 0.06, 0.5, 0.6, 0.12, 0.44, "#1a2040");
    drawBox(m.x - 0.25, m.y + 0.06, 0.55, 0.5, 0.02, 0.34, ready ? `rgb(${60 + k * 80},${200 + k * 40},255)` : "#3a4058");
    if (ready) drawBox(m.x - 0.06, m.y + 0.07, 0.66, 0.12, 0.02, 0.12, "#ffffff");
  },
  // 1 테트로: 블록 네 개로 된 몸(T 모양) + 네모 머리, 블록 색이 반짝
  w7_tetro(m) {
    const P = b2Pose(m), up = P.cast * 0.2 + P.breath, cs = ["#4a8aff", "#ffd23f", "#ff5a5a", "#3ae0a0"];
    b2DrawBody(m, [
      { f: 0, s: 0.42, z: 0, w: 0.4, d: 0.4, h: 0.4, c: cs[0] }, { f: 0, s: -0.42, z: 0, w: 0.4, d: 0.4, h: 0.4, c: cs[0] },
      { f: 0, s: 0, z: 0.4, w: 0.5, d: 1.3, h: 0.45, c: cs[1] }, { f: 0, s: 0, z: 0.85, w: 0.5, d: 0.45, h: 0.45, c: cs[2] },
      { f: 0.05, s: 0.75, z: 0.55 + P.walk * 0.05 + up, w: 0.3, d: 0.3, h: 0.3, c: cs[3] }, { f: 0.05, s: -0.75, z: 0.55 - P.walk * 0.05 + up, w: 0.3, d: 0.3, h: 0.3, c: cs[3] },
      { f: 0.05, s: 0, z: 1.3 + up, w: 0.6, d: 0.6, h: 0.5, c: "#c8d8ff", face: true, eye: "#ffffff", pupil: "#1a2040" },
      { f: 0.05, s: 0, z: 1.8 + up, w: 0.08, d: 0.08, h: 0.25, c: "#8a94b8" }, { f: 0.05, s: 0, z: 2.05 + up, w: 0.14, d: 0.14, h: 0.14, c: cs[Math.floor(game.time * 3) % 4] },
    ], { top: 2.3 });
  },
  // 2 찌릿이: 긴 청록 장어 몸 마디 + 노란 번개 지느러미 + 큰 눈
  w7_eel(m) {
    const P = b2Pose(m), t = game.time * 4 + (m.seed || 0), c = "#3ae0c8", dark = "#1a8a7a";
    const parts = [];
    for (let i = 0; i < 6; i++) parts.push({ f: 0.3 - i * 0.38, s: Math.sin(t - i * 0.8) * 0.18, z: 0.15 + (i === 0 ? P.cast * 0.15 : 0), w: 0.42, d: 0.5 - i * 0.05, h: 0.45 - i * 0.04, c: i % 2 ? c : dark });
    parts.push({ f: 0.72, s: 0, z: 0.2 + P.cast * 0.2 + P.breath, w: 0.5, d: 0.55, h: 0.5, c, face: true, eye: "#ffffff", pupil: "#0a3030" });
    for (const i of [1, 3]) parts.push({ f: 0.3 - i * 0.38, s: Math.sin(t - i * 0.8) * 0.18, z: 0.6, w: 0.25, d: 0.08, h: 0.22, c: "#ffe94d" });
    b2DrawBody(m, parts, { top: 1.2 });
  },
  // 3 활활이: 벽돌 갑옷 기사 + 큰 방패(불꽃 무늬) + 투구 깃털 불꽃
  w7_fireKnight(m) {
    const P = b2Pose(m), up = P.breath, bash = P.cast * 0.25, fl = Math.sin(game.time * 10) * 0.06;
    b2DrawBody(m, [
      { f: 0, s: 0.22, z: 0, w: 0.3, d: 0.28, h: 0.5, c: "#5a2a3a" }, { f: 0, s: -0.22, z: 0, w: 0.3, d: 0.28, h: 0.5, c: "#5a2a3a" },
      { f: 0, s: 0, z: 0.5 + up, w: 0.6, d: 0.8, h: 0.75, c: "#c8503a" }, { f: 0.01, s: 0, z: 0.75 + up, w: 0.62, d: 0.82, h: 0.05, c: "#ff9a5a" },
      { f: 0, s: 0, z: 1.25 + up, w: 0.55, d: 0.55, h: 0.5, c: "#8a94a8", face: true, eye: "#ffe27a", pupil: "#3a1a10" },
      { f: 0, s: 0, z: 1.75 + up, w: 0.2, d: 0.4, h: 0.2 + fl, c: "#ff7a3a" }, { f: 0, s: 0, z: 1.95 + up + fl, w: 0.12, d: 0.24, h: 0.14, c: "#ffd23f" },
      { f: 0.45 + bash, s: 0.45, z: 0.4, w: 0.12, d: 0.7, h: 1.0, c: "#ff7a4a" }, { f: 0.52 + bash, s: 0.45, z: 0.75, w: 0.04, d: 0.3, h: 0.3, c: "#ffd23f" },
      { f: 0.1, s: -0.5, z: 0.6 + up, w: 0.2, d: 0.2, h: 0.45, c: "#c8503a" },
    ], { top: 2.2 });
  },
  // 4 지지직: 보라 유령(아래로 갈수록 픽셀이 흩어져요) + 옆으로 어긋나는 몸
  w7_glitchGhost(m) {
    const P = b2Pose(m), jit = Math.floor(game.time * 10 + (m.seed || 0)) % 6 === 0 ? 0.12 : 0, float = 0.3 + Math.sin(game.time * 2) * 0.1;
    b2DrawBody(m, [
      { f: 0, s: jit, z: float + 0.4, w: 0.8, d: 0.9, h: 0.8, c: "#c07aff", face: true, eye: "#ffffff", pupil: "#20103a" },
      { f: 0, s: -jit, z: float + 1.2 + P.breath, w: 0.7, d: 0.8, h: 0.35, c: "#d8a8ff" },
      { f: -0.1, s: 0.25, z: float + 0.1, w: 0.2, d: 0.2, h: 0.2, c: "#a05ae0" }, { f: 0.1, s: -0.2, z: float, w: 0.18, d: 0.18, h: 0.18, c: "#a05ae0" }, { f: -0.15, s: -0.05, z: float - 0.15, w: 0.14, d: 0.14, h: 0.14, c: "#5ad8ff" },
      { f: 0.1, s: 0.55, z: float + 0.7 + P.cast * 0.3, w: 0.2, d: 0.2, h: 0.2, c: "#c07aff" }, { f: 0.1, s: -0.55, z: float + 0.7 + P.cast * 0.3, w: 0.2, d: 0.2, h: 0.2, c: "#c07aff" },
    ], { top: 2.0 });
  },
  // 5 윙윙이: 큰 서버 몸통(불빛 줄) + 가슴 냉각팬(빙글) + 굵은 팔
  w7_fanGiant(m) {
    const P = b2Pose(m), spin = game.time * (m.state === "cast" ? 25 : 8), up = P.breath;
    const parts = [
      { f: 0, s: 0.3, z: 0, w: 0.4, d: 0.35, h: 0.5, c: "#4a7a8a" }, { f: 0, s: -0.3, z: 0, w: 0.4, d: 0.35, h: 0.5, c: "#4a7a8a" },
      { f: 0, s: 0, z: 0.5 + up, w: 0.8, d: 1.1, h: 1.1, c: "#6a9aaa" },
      { f: 0, s: 0.75, z: 0.8 + P.walk * 0.06, w: 0.32, d: 0.32, h: 0.7, c: "#4a7a8a" }, { f: 0, s: -0.75, z: 0.8 - P.walk * 0.06, w: 0.32, d: 0.32, h: 0.7, c: "#4a7a8a" },
      { f: 0, s: 0, z: 1.6 + up, w: 0.6, d: 0.7, h: 0.45, c: "#8abaca", face: true, eye: "#7affb0", pupil: "#0a2a1a" },
    ];
    for (let i = 0; i < 4; i++) { const a = spin + i * Math.PI / 2; parts.push({ f: 0.42, s: Math.cos(a) * 0.28, z: 0.95 + up + Math.sin(a) * 0.28, w: 0.06, d: 0.18, h: 0.18, c: "#c8f0e0" }); }
    parts.push({ f: 0.41, s: 0, z: 1.0 + up, w: 0.04, d: 0.14, h: 0.14, c: "#7affb0" });
    for (const z of [0.6, 0.75]) parts.push({ f: 0.41, s: -0.4, z: z + up, w: 0.02, d: 0.12, h: 0.05, c: Math.sin(game.time * 6 + z * 10) > 0 ? "#7affb0" : "#2a4a3a" });
    b2DrawBody(m, parts, { top: 2.2 });
  },
  // 6 둥실이: 구름 머리(뭉게 블록) + 아래로 늘어진 사진 촉수
  w7_cloudJelly(m) {
    const P = b2Pose(m), float = 0.5 + Math.sin(game.time * 1.8) * 0.12, t = game.time * 2;
    const parts = [
      { f: 0, s: 0, z: float + 0.7, w: 1.1, d: 1.2, h: 0.6, c: "#e8f0ff", face: true, eye: "#4a8aff", pupil: "#0a1a3a", blush: "#ffb0d0" },
      { f: -0.2, s: 0.4, z: float + 1.1 + P.breath, w: 0.6, d: 0.6, h: 0.4, c: "#ffffff" }, { f: -0.1, s: -0.4, z: float + 1.15 + P.breath, w: 0.55, d: 0.55, h: 0.35, c: "#ffffff" },
    ];
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; parts.push({ f: Math.cos(a) * 0.35, s: Math.sin(a) * 0.4, z: float + 0.1 + Math.sin(t + i) * 0.08, w: 0.14, d: 0.14, h: 0.55, c: ["#ffd23f", "#ff8ab0", "#7ad8ff", "#9aff4a", "#c08aff"][i] }); }
    b2DrawBody(m, parts, { top: 2.2 });
  },
  // 7 띵동이: 빨간 우편함 몸 + 왕관 + 입처럼 열리는 편지 구멍 + 깃발 팔
  w7_mailKing(m) {
    const P = b2Pose(m), up = P.breath, open = P.cast * 0.12;
    b2DrawBody(m, [
      { f: 0, s: 0, z: 0, w: 0.25, d: 0.25, h: 0.6, c: "#6a4a3a" },
      { f: 0, s: 0, z: 0.6 + up, w: 0.8, d: 1.0, h: 0.9, c: "#e04a4a", face: true, eye: "#ffffff", pupil: "#3a1010" },
      { f: 0.41, s: 0, z: 0.75 + up, w: 0.04, d: 0.5, h: 0.08 + open, c: "#3a1010" },
      { f: 0, s: 0, z: 1.5 + up, w: 0.82, d: 1.02, h: 0.15, c: "#c83a3a" },
      { f: 0, s: 0.3, z: 1.65 + up, w: 0.14, d: 0.14, h: 0.22, c: "#ffd23f" }, { f: 0, s: 0, z: 1.65 + up, w: 0.14, d: 0.14, h: 0.3, c: "#ffd23f" }, { f: 0, s: -0.3, z: 1.65 + up, w: 0.14, d: 0.14, h: 0.22, c: "#ffd23f" },
      { f: 0, s: 0.6, z: 0.9 + up + P.cast * 0.3, w: 0.08, d: 0.08, h: 0.6, c: "#8a94a8" }, { f: 0, s: 0.72, z: 1.35 + up + P.cast * 0.3, w: 0.04, d: 0.24, h: 0.18, c: "#ffd23f" },
      { f: 0.3, s: -0.55, z: 0.9, w: 0.06, d: 0.4, h: 0.3, c: "#fff4d8" },
    ], { top: 2.2 });
  },
  // 8 집집이: 네온 기계 상자 + 위에서 내려오는 집게 + 반짝 전구 테두리
  w7_crane(m) {
    const P = b2Pose(m), drop = P.cast * 0.35, k = Math.floor(game.time * 6);
    const parts = [
      { f: 0, s: 0, z: 0, w: 0.9, d: 1.1, h: 0.7, c: "#4a1e5e" },
      { f: 0, s: 0, z: 0.7, w: 0.85, d: 1.05, h: 0.9, c: "#ff5ad8", face: true, eye: "#ffffff", pupil: "#2a0a2a" },
      { f: 0, s: 0, z: 1.6, w: 0.95, d: 1.15, h: 0.15, c: "#4a1e5e" },
      { f: 0.55, s: 0, z: 1.55 - drop, w: 0.06, d: 0.06, h: 0.35 + drop, c: "#c8c8d8" },
      { f: 0.55, s: 0.12, z: 1.3 - drop, w: 0.06, d: 0.06, h: 0.25, c: "#ffd23f" }, { f: 0.55, s: -0.12, z: 1.3 - drop, w: 0.06, d: 0.06, h: 0.25, c: "#ffd23f" },
    ];
    for (let i = 0; i < 6; i++) parts.push({ f: -0.46, s: -0.5 + i * 0.2, z: 1.62, w: 0.08, d: 0.08, h: 0.08, c: (i + k) % 2 ? "#ffe94d" : "#5ad8ff" });
    b2DrawBody(m, parts, { top: 2.2 });
  },
  // 9 꿈틀이: 초록 무당벌레 여왕 (점박이 등딱지 + 왕관 더듬이) + 짧은 다리 여섯
  w7_bugQueen(m) {
    const P = b2Pose(m), w = P.walk * 0.05, up = P.breath;
    const parts = [];
    for (const [f, s] of [[0.3, 0.55], [0, 0.6], [-0.3, 0.55], [0.3, -0.55], [0, -0.6], [-0.3, -0.55]]) parts.push({ f: f + (s > 0 ? w : -w), s, z: 0, w: 0.12, d: 0.2, h: 0.2, c: "#2a3a1a" });
    parts.push({ f: -0.1, s: 0, z: 0.2 + up, w: 1.2, d: 1.1, h: 0.6, c: "#9aff4a" });
    for (const [f, s] of [[0.1, 0.25], [-0.3, 0.3], [0.1, -0.25], [-0.3, -0.3], [-0.5, 0]]) parts.push({ f, s, z: 0.8 + up, w: 0.18, d: 0.18, h: 0.04, c: "#2a3a1a" });
    parts.push({ f: 0.65, s: 0, z: 0.25 + up + P.cast * 0.15, w: 0.45, d: 0.6, h: 0.45, c: "#3a5a2a", face: true, eye: "#ffffff", pupil: "#1a2a0a" });
    for (const sd of [1, -1]) { parts.push({ f: 0.7, s: sd * 0.18, z: 0.7 + up, w: 0.05, d: 0.05, h: 0.35, c: "#2a3a1a" }); parts.push({ f: 0.7, s: sd * 0.2, z: 1.05 + up, w: 0.12, d: 0.12, h: 0.12, c: "#ffd23f" }); }
    b2DrawBody(m, parts, { top: 1.8 });
  },
  // 10 블루스크린: 커다란 파란 모니터 왕 (화면에 슬픈 얼굴 :( ) + 받침 + 케이블 망토
  w7_bsod(m) {
    const P = b2Pose(m), up = P.breath + P.cast * 0.15, glow = 0.5 + 0.5 * Math.sin(game.time * 3);
    b2DrawBody(m, [
      { f: -0.1, s: 0, z: 0, w: 0.8, d: 1.0, h: 0.2, c: "#3a4058" },
      { f: -0.1, s: 0, z: 0.2, w: 0.25, d: 0.3, h: 0.6, c: "#3a4058" },
      { f: -0.25, s: 0.45, z: 0.3, w: 0.15, d: 0.15, h: 0.9, c: "#1a2040" }, { f: -0.25, s: -0.45, z: 0.3, w: 0.15, d: 0.15, h: 0.9, c: "#1a2040" },
      { f: 0, s: 0, z: 0.8 + up, w: 0.35, d: 1.5, h: 1.15, c: "#1a2a5a" },
      { f: 0.18, s: 0, z: 0.9 + up, w: 0.02, d: 1.3, h: 0.95, c: glow > 0.5 ? "#2a5ad8" : "#244ec0", face: true, eye: "#ffffff", pupil: "#2a5ad8" },
      { f: 0.2, s: 0, z: 1.05 + up, w: 0.02, d: 0.5, h: 0.06, c: "#ffffff" },
      { f: 0, s: 0.3, z: 1.95 + up, w: 0.16, d: 0.16, h: 0.25, c: "#ffd23f" }, { f: 0, s: 0, z: 1.95 + up, w: 0.16, d: 0.16, h: 0.35, c: "#ffd23f" }, { f: 0, s: -0.3, z: 1.95 + up, w: 0.16, d: 0.16, h: 0.25, c: "#ffd23f" },
    ], { top: 2.5 });
  },
};
if (typeof EXTRA_SHAPES !== "undefined") Object.assign(EXTRA_SHAPES, W7_SHAPES);
