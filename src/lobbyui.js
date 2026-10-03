// ===== 로비 창: 대장장이(강화), 옷장, 기록판 =====

// ----- 대장장이 -----
// 부품으로 7부위(무기, 활, 머리, 가슴, 바지, 팔, 신발)를 강화하고, 보스 부품으로 무기에 마법을 붙여요
const smith = { tab: "upgrade", row: 0, note: "", noteColor: "#7dffb0", noteTimer: 0 };

function openSmith() { game.overlay = "smith"; smith.row = 0; smith.noteTimer = 0; sfx.anvil(); }
function smithNote(msg, color = "#7dffb0") { smith.note = msg; smith.noteColor = color; smith.noteTimer = 2.4; }

// 다음 레벨에서 얼마나 좋아지나
function upgradePreview(slot) {
  const L = gearLevel(slot), N = Math.min(GEAR_MAX, L + 1);
  const pct = (x) => `${Math.round(x * 100)}%`;
  switch (slot) {
    case "weapon": return `공격력 ${(weaponBaseDamage(L)).toFixed(1)} → ${weaponBaseDamage(N).toFixed(1)} (x 종류 배수)`;
    case "bow": return `화살 ${bowBaseDamage(L).toFixed(1)} → ${bowBaseDamage(N).toFixed(1)}`;
    case "head": return `하트 +${Math.floor(L / 4)} → +${Math.floor(N / 4)}`;
    case "chest": return `막기 ${pct(chestBlock(L))} → ${pct(chestBlock(N))}`;
    case "legs": return `하트 +${Math.floor(L / 6)} → +${Math.floor(N / 6)}, 덜 밀려남`;
    case "arms": return `공격력 +${(1.5 * L).toFixed(1)}% → +${(1.5 * N).toFixed(1)}%, 빨라짐`;
    case "boots": return `이동 +${(0.6 * L).toFixed(1)}% → +${(0.6 * N).toFixed(1)}%, 구르기 자주`;
  }
  return "";
}

function doUpgrade(slot) {
  const pr = game.profile;
  const cost = upgradeCost(slot);
  if (!cost) return smithNote("최고 레벨이에요!", "#ffe27a");
  const have = pr.materials[cost.mat] || 0;
  if (have < cost.count) { sfx.denied(); return smithNote(`${josa(MATERIALS[cost.mat].name, "이/가")} ${cost.count - have}개 모자라요 (맵을 깨면 받아요)`, "#ff8080"); }
  if (pr.emeralds < cost.emeralds) { sfx.denied(); return smithNote(`에메랄드가 ${cost.emeralds - pr.emeralds}개 모자라요`, "#ff8080"); }
  const before = tierIndex(gearLevel(slot));
  pr.materials[cost.mat] = have - cost.count;
  pr.emeralds -= cost.emeralds;
  pr.gear[slot] = gearLevel(slot) + 1;
  refreshGear();
  sfx.anvil();
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(lobby.anvil.x, lobby.anvil.y, 0.5, { vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, vz: 2 + Math.random() * 2, gravity: 8, life: 0.6, size: 0.6, gold: true });
  }
  const after = tierIndex(gearLevel(slot));
  if (after > before) { smithNote(`새 단계! ${gearLabel(slot)}`, "#ffe27a"); sfx.levelUp(); }
  else smithNote(`${GEAR_SLOTS.find((s) => s.id === slot).name} 강화 성공! Lv ${gearLevel(slot)}`);
}

function setEnchant(id) {
  game.profile.enchant = id;
  refreshGear();
  sfx.equip();
  smithNote(id ? `무기에 ${ENCHANTS[id].name} 마법!` : "마법을 뺐어요", id ? ENCHANTS[id].color : "#ddd");
}

function updateSmith(dt) {
  smith.noteTimer -= dt;
  const n = smith.tab === "upgrade" ? GEAR_SLOTS.length : Object.keys(ENCHANTS).length + 1;
  if (wasPressed("Tab")) { smith.tab = smith.tab === "upgrade" ? "enchant" : "upgrade"; smith.row = 0; }
  if (wasPressed("ArrowUp", "KeyW")) smith.row = (smith.row + n - 1) % n;
  if (wasPressed("ArrowDown", "KeyS")) smith.row = (smith.row + 1) % n;
  if (wasPressed("Enter", "Space")) {
    if (smith.tab === "upgrade") doUpgrade(GEAR_SLOTS[smith.row].id);
    else { const ids = [null, ...Object.keys(ENCHANTS)]; const id = ids[smith.row]; if (!id || game.profile.enchants.includes(id)) setEnchant(id); }
  }
  if (wasPressed("Escape", "KeyE")) closeOverlay();
}

function drawSmith() {
  const W = view.w, H = view.h, pr = game.profile;
  const pw = Math.min(980, W - 24), ph = Math.min(600, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("대장장이", x0 + 22, y0 + 40, 26, "#ffe27a");
  drawButton(x0 + 160, y0 + 14, 90, 36, "강화", () => { smith.tab = "upgrade"; smith.row = 0; }, { selected: smith.tab === "upgrade" });
  drawButton(x0 + 258, y0 + 14, 110, 36, "마법 부여", () => { smith.tab = "enchant"; smith.row = 0; }, { selected: smith.tab === "enchant" });
  drawEmeraldIcon(x0 + pw - 150, y0 + 30, 12);
  text(`${pr.emeralds}`, x0 + pw - 132, y0 + 39, 22);
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  // 추천 강화 (qol.js): 지금 할 수 있는 강화 중 가장 좋은 부위
  const rec = smith.tab === "upgrade" && typeof qolRecommendSlot === "function" ? qolRecommendSlot() : null;
  if (rec) {
    const nm = GEAR_SLOTS.find((s) => s.id === rec).name;
    drawButton(x0 + 378, y0 + 14, Math.min(190, pw - 600), 36, `★ 추천: ${nm}`, () => { smith.row = GEAR_SLOTS.findIndex((s) => s.id === rec); doUpgrade(rec); }, { size: 15, color: "rgba(255,200,60,0.45)" });
  }

  // 가진 부품
  let mx = x0 + 22;
  for (const id of MATERIAL_ORDER) {
    const m = MATERIALS[id];
    ctx.fillStyle = m.color; ctx.fillRect(mx, y0 + 62, 14, 14);
    text(`${m.name} ${pr.materials[id] || 0}`, mx + 19, y0 + 75, 13, "#ddd");
    mx += Math.min(150, (pw - 44) / 6);
  }

  const top = y0 + 92, rowH = Math.min(64, (ph - 150) / GEAR_SLOTS.length);
  if (smith.tab === "upgrade") {
    GEAR_SLOTS.forEach((slot, i) => {
      const ry = top + i * rowH;
      const L = gearLevel(slot.id);
      const sel = smith.row === i;
      roundRectPath(x0 + 18, ry, pw - 36, rowH - 6, 8);
      ctx.fillStyle = sel ? "rgba(255,226,122,0.15)" : "rgba(255,255,255,0.05)"; ctx.fill();
      if (sel) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
      addUI(x0 + 18, ry, pw - 260, rowH - 6, () => { smith.row = i; });
      const tier = TIERS[tierIndex(L)];
      ctx.fillStyle = slot.id === "weapon" || slot.id === "bow" ? tier.color : L > 0 ? tier.armor.body : "#555"; ctx.fillRect(x0 + 30, ry + 12, 22, 22);
      text(slot.name, x0 + 62, ry + 22, 13, "#aaa");
      if (rec === slot.id) { drawStar(x0 + 30, ry + 12, 9, "#ffd23f"); text("추천!", x0 + 62 + 40, ry + 22, 13, "#ffd23f"); }
      text(gearLabel(slot.id), x0 + 62, ry + 42, 17, "#fff");
      // 레벨 막대 (5칸씩 단계 색)
      const bx = x0 + 300, bw = Math.min(260, pw - 640);
      for (let k = 0; k < GEAR_MAX; k++) {
        ctx.fillStyle = k < L ? TIERS[tierIndex(k + 1)].color : "#333";
        ctx.fillRect(bx + k * (bw / GEAR_MAX), ry + 14, bw / GEAR_MAX - 1, 8);
      }
      text(upgradePreview(slot.id), bx, ry + 42, 12, "#7dd3ff");
      const cost = upgradeCost(slot.id);
      if (!cost) { text("최고 레벨!", x0 + pw - 40, ry + 34, 16, "#7dffb0", "right"); return; }
      const have = pr.materials[cost.mat] || 0;
      const ok = have >= cost.count && pr.emeralds >= cost.emeralds;
      text(`${MATERIALS[cost.mat].name} ${have}/${cost.count}`, x0 + pw - 210, ry + 24, 13, have >= cost.count ? "#ddd" : "#ff8080", "right");
      text(`에메랄드 ${cost.emeralds}`, x0 + pw - 210, ry + 42, 13, pr.emeralds >= cost.emeralds ? "#ddd" : "#ff8080", "right");
      drawButton(x0 + pw - 196, ry + 8, 150, rowH - 22, "강화", () => { smith.row = i; doUpgrade(slot.id); }, { color: ok ? "rgba(80,200,120,0.4)" : "rgba(120,60,60,0.35)", size: 17 });
    });
  } else {
    const ids = [null, ...Object.keys(ENCHANTS)];
    ids.forEach((id, i) => {
      const ry = top + i * rowH;
      const open = !id || pr.enchants.includes(id);
      const on = pr.enchant === id;
      roundRectPath(x0 + 18, ry, pw - 36, rowH - 6, 8);
      ctx.fillStyle = on ? "rgba(125,255,176,0.15)" : smith.row === i ? "rgba(255,226,122,0.12)" : "rgba(255,255,255,0.05)"; ctx.fill();
      addUI(x0 + 18, ry, pw - 36, rowH - 6, () => { smith.row = i; if (open) setEnchant(id); });
      const e = id ? ENCHANTS[id] : { name: "마법 없음", desc: "무기에 붙은 마법을 빼요", color: "#999" };
      ctx.fillStyle = open ? e.color : "#444"; ctx.fillRect(x0 + 30, ry + 12, 22, 22);
      text(e.name, x0 + 62, ry + 26, 18, open ? "#fff" : "#777");
      text(open ? e.desc : "보스를 물리치고 보스 부품을 얻으면 열려요", x0 + 62, ry + 45, 13, open ? "#bbb" : "#777");
      text(on ? "사용 중" : open ? "누르면 붙이기" : "잠김", x0 + pw - 40, ry + 34, 15, on ? "#7dffb0" : open ? "#7dd3ff" : "#777", "right");
    });
  }
  if (smith.noteTimer > 0) {
    ctx.globalAlpha = Math.min(1, smith.noteTimer * 2);
    text(smith.note, W / 2, y0 + ph - 18, 17, smith.noteColor, "center");
    ctx.globalAlpha = 1;
  }
}

// ----- 옷장 -----
const PALETTE = {
  shirt: ["#d94f45", "#2bb3b1", "#4a7ad9", "#f2b632", "#8a5ad9", "#3fae5a", "#ff7aa8", "#ffffff", "#333333"],
  pants: ["#3b3f58", "#3a4fa0", "#5a3a22", "#2f5a2f", "#6a2f6a", "#777777", "#c94040", "#222222"],
  hair: ["#2b1d14", "#7a4a20", "#e8c060", "#d9662b", "#222222", "#f0f0f0", "#6a3fae", "#3fae9a"],
  skin: ["#f2c39b", "#e0a878", "#b9784e", "#8a5a3a", "#ffd9c0"],
};
const PALETTE_NAMES = { shirt: "윗옷", pants: "바지", hair: "머리", skin: "피부" };

function openWardrobe() { game.overlay = "wardrobe"; sfx.equip(); }

function updateWardrobe() {
  if (wasPressed("Escape", "KeyE", "Enter")) closeOverlay();
}

function setLook(part, color) {
  game.profile.look = { ...(game.profile.look || {}), [part]: color };
  saveProfile();
  sfx.click();
}

// 오른쪽에만 창을 띄워서 주인공이 바뀌는 걸 볼 수 있어요
function drawWardrobe() {
  const W = view.w, H = view.h;
  const pw = Math.min(460, W * 0.45), ph = Math.min(560, H - 24);
  const x0 = W - pw - 16, y0 = (H - ph) / 2;
  blockUI();
  roundRectPath(x0, y0, pw, ph, 16);
  ctx.fillStyle = "rgba(24,22,32,0.94)"; ctx.fill();
  ctx.strokeStyle = "#c8a050"; ctx.lineWidth = 3; ctx.stroke();
  text("옷장", x0 + 22, y0 + 40, 26, "#ffe27a");
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  const look = { ...CONFIG.colors.player, ...(game.profile.look || {}) };
  let y = y0 + 70;
  for (const part of ["shirt", "pants", "hair", "skin"]) {
    text(PALETTE_NAMES[part], x0 + 22, y + 18, 16, "#ccc");
    const sw = Math.min(38, (pw - 110) / PALETTE[part].length - 4);
    PALETTE[part].forEach((c, i) => {
      const sx = x0 + 90 + i * (sw + 4);
      ctx.fillStyle = c;
      ctx.fillRect(sx, y, sw, sw);
      ctx.strokeStyle = look[part] === c ? "#ffe27a" : "rgba(255,255,255,0.25)";
      ctx.lineWidth = look[part] === c ? 3 : 1;
      ctx.strokeRect(sx, y, sw, sw);
      addUI(sx, y, sw, sw, () => setLook(part, c));
    });
    y += sw + 18;
  }
  const hide = !!(game.profile.look && game.profile.look.hideArmor);
  drawButton(x0 + 22, y + 6, pw - 44, 44, hide ? "갑옷 모습 보이기" : "갑옷 모습 숨기기 (옷 색 보이기)", () => setLook("hideArmor", !hide), { size: 15 });
  text("갑옷을 숨겨도 막아주는 힘은 그대로예요", x0 + 22, y + 74, 13, "#999");
}

// ----- 기록판 -----
// 쪽: "basic" 나의 기록, "boss" 보스 기록 (qol.js 의 플레이 기록)
const records = { tab: "basic" };
function openRecords() { game.overlay = "records"; records.tab = "basic"; sfx.equip(); }
function updateRecords() {
  if (wasPressed("Tab", "ArrowLeft", "ArrowRight", "KeyA", "KeyD")) records.tab = records.tab === "basic" ? "boss" : "basic";
  if (wasPressed("Escape", "KeyE", "Enter", "Space")) closeOverlay();
}

function fmtSec(sec) {
  if (!sec) return "-";
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m ? `${m}분 ${s}초` : `${s}초`;
}

function drawRecords() {
  const W = view.w, H = view.h;
  const pw = Math.min(records.tab === "boss" ? 820 : 620, W - 24), ph = Math.min(560, H - 24);
  const x0 = (W - pw) / 2, y0 = (H - ph) / 2;
  drawPanel(x0, y0, pw, ph);
  text("나의 기록", x0 + 24, y0 + 42, 28, "#ffe27a");
  drawButton(x0 + 170, y0 + 14, 80, 36, "기본", () => { records.tab = "basic"; }, { selected: records.tab === "basic", size: 15 });
  drawButton(x0 + 256, y0 + 14, 110, 36, "보스 기록", () => { records.tab = "boss"; }, { selected: records.tab === "boss", size: 15 });
  if (typeof qolSummary === "function") drawButton(x0 + pw - 186, y0 + 14, 120, 38, "기록 복사", () => qolCopy(JSON.stringify(qolSummary(), null, 1), "플레이 기록 (개발자에게 보내 주세요)", "기록을 복사했어요! 아빠에게 보내 주세요"), { size: 15, color: "rgba(80,160,220,0.4)" });
  drawButton(x0 + pw - 58, y0 + 14, 42, 38, "✕", closeOverlay, { size: 20 });
  if (records.tab === "boss" && typeof qolLog === "function") return drawBossRecords(x0, y0, pw, ph);
  drawBasicRecords(x0, y0, pw, ph);
}

function drawBossRecords(x0, y0, pw, ph) {
  const L = qolLog();
  const ids = MAPS.filter((m) => m.type !== "tower").map((m) => m.id);
  const cols = [x0 + 30, x0 + pw * 0.42, x0 + pw * 0.52, x0 + pw * 0.62, x0 + pw * 0.72, x0 + pw * 0.86];
  let y = y0 + 80;
  ["보스", "도전", "이김", "쓰러짐", "가장 빨리", "단계"].forEach((h, i) => text(h, cols[i] + (i ? 0 : 26), y, 13, "#aaa", i ? "center" : "left"));
  const rowH = Math.min(26, (ph - 200) / ids.length);
  y += 8;
  for (const id of ids) {
    y += rowH;
    const b = L.bosses[id];
    const def = typeof BOSS_DEFS !== "undefined" && BOSS_DEFS[id];
    const name = (b && b.name) || (def ? def.name : (MAPS.find((m) => m.id === id) || {}).name);
    const seen = !!b && b.tries > 0;
    ctx.fillStyle = def && def.material ? def.material.color : "#777";
    ctx.globalAlpha = seen ? 1 : 0.35; ctx.fillRect(cols[0], y - 14, 16, 16); ctx.globalAlpha = 1;
    text(seen ? name : "???", cols[0] + 26, y, 14, seen ? "#fff" : "#666");
    if (!seen) continue;
    text(`${b.tries}`, cols[1], y, 15, "#ddd", "center");
    text(`${b.wins}`, cols[2], y, 15, b.wins ? "#7dffb0" : "#888", "center");
    text(`${b.deaths}`, cols[3], y, 15, b.deaths ? "#ff9090" : "#888", "center");
    text(fmtSec(b.best), cols[4], y, 14, "#ffe27a", "center");
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = k < b.maxPhase ? "#ffd23f" : "#444";
      ctx.beginPath(); ctx.arc(cols[5] - 14 + k * 14, y - 5, 5, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 많이 쓰러진 공격 TOP3
  y += 34;
  text("나를 가장 많이 쓰러뜨린 공격", x0 + 30, y, 16, "#ffb070");
  const top = qolCauseTop(qolAllBossCauses(), 3);
  if (!top.length) text("아직 없어요! 보스방에서 쓰러지면 여기에 나와요", x0 + 30, y + 26, 14, "#999");
  top.forEach(([k, n], i) => text(`${i + 1}. ${k} · ${n}번`, x0 + 30 + i * ((pw - 60) / 3), y + 26, 15, "#fff"));
  const min = Math.round(L.playSec / 60);
  text(`모두 ${Math.floor(min / 60)}시간 ${min % 60}분 놀았어요 · 오늘 ${Math.round((L.days[qolToday()] || 0) / 60)}분`, x0 + 30, y0 + ph - 18, 13, "#999");
}

function drawBasicRecords(x0, y0, pw, ph) {
  const pr = game.profile, st = pr.stats;
  const lines = [
    [`레벨`, `${pr.level}`],
    [`물리친 몬스터`, `${st.kills}마리`],
    [`연 보물상자`, `${st.chests}개`],
    [`던전 도전 / 클리어`, `${st.runs}번 / ${st.clears}번`],
    [`시련의 탑 최고`, `${pr.towerBest || 0}층`],
    [`강아지 쓰다듬기`, `${st.pets}번`],
    [`장비 강화 합계`, `Lv ${Object.values(pr.gear).reduce((a, b) => a + b, 0)}`],
    [`보스 처치`, `${st.bosses || 0}번`],
  ];
  lines.forEach(([k, v], i) => {
    text(k, x0 + 36, y0 + 92 + i * 34, 18, "#ccc");
    text(v, x0 + pw - 36, y0 + 92 + i * 34, 18, "#fff", "right");
  });
  const cleared = MAPS.filter((m) => pr.best[m.id] || pr.cleared.includes(m.id)).map((m) => `${m.name}${pr.best[m.id] ? " Lv" + pr.best[m.id] : ""}`);
  text("깬 맵", x0 + 36, y0 + 92 + lines.length * 34 + 10, 18, "#ccc");
  const msg = cleared.length ? cleared.join(" · ") : "아직 없어요";
  // 줄바꿈
  const words = msg.split(" · ");
  let line = "", ly = y0 + 92 + lines.length * 34 + 40;
  ctx.font = 'bold 15px "Apple SD Gothic Neo", sans-serif';
  for (const w of words) {
    const tryLine = line ? line + " · " + w : w;
    if (ctx.measureText(tryLine).width > pw - 72) { text(line, x0 + 36, ly, 15, "#7dffb0"); ly += 24; line = w; }
    else line = tryLine;
  }
  if (line) text(line, x0 + 36, ly, 15, "#7dffb0");
}
