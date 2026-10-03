// ===== 같이 하는 인원 수에 따른 난이도 (docs/design/netplay.md 4절) =====
// 디아블로 2·3 처럼 1명 늘 때마다 몬스터 체력 +50%, 보스는 +70%. 몬스터 수는 그대로.
// 아직 적용 전이에요 (다음 단계 netplay.js 에서 partyScale(인원) 을 써요).
CONFIG.party = {
  maxPlayers: 4,
  monsterHpPer: 0.5,    // 일반 몬스터 체력: 1 + 0.5 x (인원-1)
  bossHpPer: 0.7,       // 보스 체력: 1 + 0.7 x (인원-1)
  damagePer: 0.05,      // 몬스터 피해: 1 + 0.05 x (인원-1)
  staggerTable: [1, 1, 0.9, 0.85, 0.8], // 인원별 보스 비틀거림 시간 배수 (다 같이 때리니까 짧게)
  xpTable: [1, 1, 1.1, 1.15, 1.2],       // 인원별 경험치 배수 (같이 하면 조금 더)
  extraElites: [0, 0, 0, 1, 1],      // 인원별 정예 추가 수
};

// 인원 수 -> 배수 묶음 (1명이면 모두 1)
function partyScale(n) {
  const P = CONFIG.party;
  const k = Math.max(0, Math.min(P.maxPlayers, Math.floor(n || 1)) - 1);
  return {
    players: k + 1,
    monsterHp: 1 + P.monsterHpPer * k,
    bossHp: 1 + P.bossHpPer * k,
    damage: 1 + P.damagePer * k,
    stagger: P.staggerTable[k + 1] || 1,
    xp: P.xpTable[k + 1] || 1,
    extraElites: P.extraElites[k + 1] || 0,
  };
}
