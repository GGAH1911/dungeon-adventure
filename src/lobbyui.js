// ===== 로비 창: 대장장이(강화), 옷장, 기록판 =====

// ----- 대장장이 -----
// 끼고 있는 장비 4칸을 +1 ~ +10 강화하고 (실패 없음), 보스 부품으로 무기에 마법을 붙여요
const smith = { tab: "upgrade", row: 0, note: "", noteColor: "#7dffb0", noteTimer: 0 };

function openSmith() { game.overlay = "smith"; smith.row = 0; smith.noteTimer = 0; sfx.anvil(); }
function smithNote(msg, color = "#7dffb0") { smith.note = msg; smith.noteColor = color; smith.noteTimer = 2.4; }

// 다음 강화에서 얼마나 좋아지나 (첫 줄 능력치 비교)
function upgradePreview(slot) {
  const it = game.profile.eq[slot]; if (!it) return "";
  const now = itemLines(it)[0], next = itemLines({ ...it, p: Math.min(PLUS_MAX, (it.p || 0) + 1) })[0];
  if (!now) return "";
  if (!next || it.p >= PLUS_MAX) return now[0];
  const nv = now[0].match(/[\d.]+%?/), xv = next[0].match(/[\d.]+%?/);
  return nv && xv && nv[0] !== xv[0] ? `${now[0]} → ${xv[0]}` : now[0];
}

function doUpgrade(slot) {
  const it = game.profile.eq[slot];
  if (!it) return smithNote("이 칸에 낀 장비가 없어요", "#ffb070");
  const r = plusItem(it.u);
  if (!r.ok) { sfx.denied(); return smithNote(r.why, r.why.includes("최고") ? "#ffe27a" : "#ff8080"); }
  sfx.anvil();
  for (let i = 0; i < (r.big ? 40 : 20); i++) {
    const a = Math.random() * Math.PI * 2;
    addSparkle(lobby.anvil.x, lobby.anvil.y, 0.5, { vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, vz: 2 + Math.random() * 2, gravity: 8, life: 0.6, size: 0.6, gold: true });
  }
  if (r.big) { smithNote(`+${it.p}! 특별 능력이 더 세졌어요! ${itemLabel(it)}`, "#ffe27a"); sfx.levelUp(); if (game.player) addRing(game.player.x, game.player.y, { speed: 6, life: 0.6, gold: true }); }
  else smithNote(`강화 성공! ${itemLabel(it)}`);
}

function setEnchant(id) {
  const w = game.profile.eq.weapon; if (!w) return;
  w.e = id || null;
  refreshGear();
  sfx.equip();
  smithNote(id ? `무기에 ${ENCHANTS[id].name} 마법!` : "마법을 뺐어요", id ? ENCHANTS[id].color : "#ddd");
}

function updateSmith(dt) {
  smith.noteTimer -= dt;
  const n = smith.tab === "upgrade" ? EQ_SLOTS.length : Object.keys(ENCHANTS).length + 1;
  if (wasPressed("Tab")) { smith.tab = smith.tab === "upgrade" ? "enchant" : "upgrade"; smith.row = 0; }
  if (wasPressed("ArrowUp", "KeyW")) smith.row = (smith.row + n - 1) % n;
  if (wasPressed("ArrowDown", "KeyS")) smith.row = (smith.row + 1) % n;
  if (wasPressed("Enter", "Space")) {
    if (smith.tab === "upgrade") doUpgrade(EQ_SLOTS[smith.row].id);
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
  drawButton(x0 + pw - 58, y0 + 12, 42, 38, "✕", closeOverlay, { size: 20 });
  // 추천 강화 (qol.js): 지금 할 수 있는 강화 중 가장 좋은 칸
  const rec = smith.tab === "upgrade" && typeof qolRecommendSlot === "function" ? qolRecommendSlot() : null;
  if (rec) {
    const nm = EQ_SLOTS.find((s) => s.id === rec).name;
    drawButton(x0 + 378, y0 + 14, Math.min(190, pw - 600), 36, `★ 추천: ${nm}`, () => { smith.row = EQ_SLOTS.findIndex((s) => s.id === rec); doUpgrade(rec); }, { size: 15, color: "rgba(255,200,60,0.45)" });
  }
  // 가진 화폐
  let mx = x0 + 22;
  for (const c of CURRENCIES) { drawCurrencyIcon(c.id, mx + 8, y0 + 70, 8); text(`${c.name} ${curHave(c.id)}`, mx + 21, y0 + 75, 13, "#ddd"); mx += Math.min(150, (pw - 44) / 5); }

  const top = y0 + 92;
  if (smith.tab === "upgrade") {
    const rowH = Math.min(96, (ph - 150) / EQ_SLOTS.length);
    EQ_SLOTS.forEach((slot, i) => {
      const ry = top + i * rowH, it = pr.eq[slot.id];
      const sel = smith.row === i;
      roundRectPath(x0 + 18, ry, pw - 36, rowH - 6, 8);
      ctx.fillStyle = sel ? "rgba(255,226,122,0.15)" : "rgba(255,255,255,0.05)"; ctx.fill();
      if (sel) { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.stroke(); }
      addUI(x0 + 18, ry, pw - 260, rowH - 6, () => { smith.row = i; });
      const cs = rowH - 18;
      drawItemCell(it, x0 + 26, ry + 6, cs, false, () => { smith.row = i; }, slot.name);
      const tx = x0 + 36 + cs;
      text(slot.name, tx, ry + 20, 13, "#aaa");
      if (rec === slot.id) { drawStar(tx + 44, ry + 14, 8, "#ffd23f"); text("추천!", tx + 56, ry + 20, 13, "#ffd23f"); }
      if (!it) { text("비어 있어요 (가방에서 끼고 오세요)", tx, ry + 44, 16, "#888"); return; }
      text(itemLabel(it), tx, ry + 44, 18, itemRarity(it).color);
      // 강화 칸 10개 (+5, +10 은 특별)
      const bx = tx, bw = Math.min(260, pw - 640);
      for (let k = 0; k < PLUS_MAX; k++) {
        ctx.fillStyle = k < (it.p || 0) ? (k === 4 || k === 9 ? "#ffd23f" : "#7dd3ff") : "#333";
        ctx.fillRect(bx + k * (bw / PLUS_MAX), ry + rowH - 26, bw / PLUS_MAX - 2, 8);
      }
      text(upgradePreview(slot.id), bx + bw + 14, ry + rowH - 18, 12, "#7dd3ff");
      const cost = plusCost(it);
      if (!cost) { text("최고 강화! (+10)", x0 + pw - 40, ry + rowH / 2 + 4, 16, "#7dffb0", "right"); return; }
      const ok = canPay(cost);
      drawPrice(cost, x0 + pw - 212, ry + rowH / 2 + 6, 16, "right", ok);
      if ((it.p || 0) === 4 || (it.p || 0) === 9) text("다음: 특별 능력 UP", x0 + pw - 212, ry + rowH / 2 + 26, 11, "#ffd23f", "right");
      drawButton(x0 + pw - 196, ry + 10, 150, rowH - 26, "강화", () => { smith.row = i; doUpgrade(slot.id); }, { color: ok ? "rgba(80,200,120,0.4)" : "rgba(120,60,60,0.35)", size: 17 });
    });
    text("+1~+3 은 장비 색깔 화폐, +4 부터는 한 단계 위 화폐 · 실패 없어요 · 가방 장비는 끼고 오면 강화돼요", x0 + 22, y0 + ph - 40, 12, "#999");
  } else {
    const ids = [null, ...Object.keys(ENCHANTS)], rowH = Math.min(64, (ph - 150) / ids.length);
    const w = pr.eq.weapon, cur = w ? w.e || null : null;
    ids.forEach((id, i) => {
      const ry = top + i * rowH;
      const open = !id || pr.enchants.includes(id);
      const on = cur === id;
      roundRectPath(x0 + 18, ry, pw - 36, rowH - 6, 8);
      ctx.fillStyle = on ? "rgba(125,255,176,0.15)" : smith.row === i ? "rgba(255,226,122,0.12)" : "rgba(255,255,255,0.05)"; ctx.fill();
      addUI(x0 + 18, ry, pw - 36, rowH - 6, () => { smith.row = i; if (open) setEnchant(id); });
      const e = id ? ENCHANTS[id] : { name: "마법 없음", desc: "대장장이 마법을 빼요 (무기에 원래 있는 힘은 그대로)", color: "#999" };
      ctx.fillStyle = open ? e.color : "#444"; ctx.fillRect(x0 + 30, ry + 12, 22, 22);
      text(e.name, x0 + 62, ry + 26, 18, open ? "#fff" : "#777");
      text(open ? e.desc : "보스를 물리치고 보스 부품을 얻으면 열려요", x0 + 62, ry + 45, 13, open ? "#bbb" : "#777");
      text(on ? "사용 중" : open ? "누르면 붙이기" : "잠김", x0 + pw - 40, ry + 34, 15, on ? "#7dffb0" : open ? "#7dd3ff" : "#777", "right");
    });
  }
  if (smith.noteTimer > 0) {
    ctx.globalAlpha = Math.min(1, smith.noteTimer * 2);
    text(smith.note, W / 2, y0 + ph - 14, 17, smith.noteColor, "center");
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
    // 탑 최고 층: 월드마다 탑 하나 (시련 · 심해 · 달빛 · 지하) 를 한 줄에 (줄이 넘치지 않게)
    [`탑 최고 (시련·심해·달빛·지하)`, ["tower", "seatower", "moontower", "undertower"].map((id) => id === "tower" ? pr.towerBest || 0 : (pr.towerBests && pr.towerBests[id]) || 0).join(" · ") + "층"],
    [`강아지 쓰다듬기`, `${st.pets}번`],
    [`장비 강화 합계`, `+${EQ_SLOTS.reduce((a, sl) => a + ((pr.eq[sl.id] && pr.eq[sl.id].p) || 0), 0)}`],
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
