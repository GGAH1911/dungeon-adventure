// ===== 월드 6 "색모래 사막" 몬스터 7종 (설계서 docs/design/world6-desert.md 4장) =====
// 새 행동·새 모양은 없어요: 있는 행동(melee·charger·flyer·kite·shieldbearer)과 월드 5 블록 모양(색은 def.color)을 다시 써요.
// 수치는 맵 레벨 1 기준 (좀비 = 체력 3, 속도 1.7, 공격 1). 무섭지 않게, 큰 눈.

const W6_MON = (base, o) => {
  const d = { ...(MONSTERS[base] || MONSTERS.zombie || {}) };
  for (const k of ["abilities", "look", "weapon", "w3Placeholder", "w4Placeholder", "codexSkip", "world", "floaty", "heavy", "frontShield", "dizzyAfterCharge", "light", "size", "armsForward", "emeraldCount", "w3Shadow", "w4Dig", "w4Glow", "w5Shade"]) delete d[k];
  return { ...d, ...o, world: 6 };
};
Object.assign(MONSTERS, {
  w6_sunWisp: W6_MON("bat", { name: "햇살 반딧불", shape: "w5_wisp", behavior: "melee", floaty: true, light: 0.3,
    hp: 2.2, speed: 1.5, damage: 0.8, xp: 6, emerald: 0.7, attackRange: 0.7, attackCooldown: 1.5, windup: 0.42, color: "#ffe08a", eyes: "#5a3a10" }),
  w6_sandBunny: W6_MON("w2_urchin", { name: "모래 토끼", shape: "w5_dustBunny", behavior: "charger", dizzyAfterCharge: 2.0,
    hp: 3.4, speed: 1.9, damage: 1.2, xp: 8, emerald: 0.8, attackRange: 0.75, attackCooldown: 1.3, windup: 0.36, abilities: ["w5_hop"], color: "#e0c08a", eyes: "#3a2410" }),
  w6_sandBat: W6_MON("bat", { name: "모래 박쥐", shape: "bat", behavior: "flyer",
    hp: 2.2, speed: 2.4, damage: 0.9, xp: 6, emerald: 0.6, color: "#b08a58", eyes: "#ffe08a" }),
  w6_cactusJelly: W6_MON("zombie", { name: "선인장 젤리", shape: "w5_grayJelly", behavior: "melee",
    hp: 5.5, speed: 1.2, damage: 1.2, xp: 9, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.5, windup: 0.42, color: "#6ab868", eyes: "#1a3010" }),
  w6_mirageGhost: W6_MON("w2_shrimp", { name: "신기루 유령", shape: "w5_lampGhost", behavior: "kite", floaty: true, light: 0.35,
    hp: 2.8, speed: 1.9, damage: 1.0, xp: 8, emerald: 0.8, abilities: ["w5_grayShot"], color: "#f0d8f0", eyes: "#6a2a6a" }),
  w6_shellTurtle: W6_MON("w2_turtle", { name: "모래 거북", shape: "w5_hushTurtle", behavior: "shieldbearer", frontShield: true, heavy: true,
    hp: 7.0, speed: 1.1, damage: 1.3, xp: 10, emerald: 1, armor: 0.18, attackRange: 0.85, attackCooldown: 1.4, windup: 0.4, color: "#c89a58", eyes: "#2a1a08" }),
  w6_sandMummy: W6_MON("mummy", { name: "모래 미라", shape: "human", behavior: "melee", armsForward: true,
    hp: 6.0, speed: 1.4, damage: 1.4, xp: 9, emerald: 0.9, attackRange: 0.8, attackCooldown: 1.2, windup: 0.36,
    look: { skin: "#e8d0a0", hair: "#d0b480", shirt: "#f0dcb0", pants: "#d8c090", eyes: "#ff9ad8" } }),
  w6_mirageKid: W6_MON("zombie", { name: "신기루 꼬마", shape: "w5_shadeKid", behavior: "melee",
    hp: 3.2, speed: 1.9, damage: 1.0, xp: 7, emerald: 0.8, attackRange: 0.7, attackCooldown: 1.3, windup: 0.38, color: "#e8b8d8", eyes: "#4a1a4a" }),
});
