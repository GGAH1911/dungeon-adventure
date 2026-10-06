// ===== 캐릭터 창 (가방) =====
// 내 캐릭터를 크게 보면서 장비 4칸, 가방 20칸, 능력치, 화폐를 봐요. 캠프에서는 공용 보관함도.
// 여는 법: 화면 위 가방 버튼 · C 키 · 캠프의 보관함 상자
// 장비 그림(아이콘)도 여기서 만들어요 (drawItemIcon)

const hero = { tab: "bag", sel: null, page: 0, confirm: null, note: "", noteColor: "#fff", noteT: 0 };
function openHero(tab = "bag") { game.overlay = "hero"; hero.tab = tab; hero.sel = null; hero.page = 0; hero.confirm = null; hero.noteT = 0; sfx.equip(); }
function heroNote(msg, color = "#7dffb0") { hero.note = msg; hero.noteColor = color; hero.noteT = 2.4; }

// ----- 장비 그림 -----
const ITEM_ICON_DRAW = {
  blade: (g, c) => { g.line(8, 12, 16.5, 3.5, c, 2.2); g.line(15, 5, 16.5, 3.5, "w"); g.line(4.5, 10.5, 9.5, 15.5, "y", 2); g.line(3, 17, 7, 13, "b", 2); g.disc(2.6, 17.4, 1.2, "y"); },
  dagger: (g, c) => { g.line(6, 13, 12, 7, c, 2); g.line(4, 11, 8, 15, "y", 1.6); g.line(2, 17, 5, 14, "b", 2); g.line(11, 15, 17, 9, c, 2); g.line(13, 17, 15, 19, "b", 1.6); },
  axe: (g, c) => { g.line(4, 18, 13, 4, "b", 2); g.tri(11, 3, 18, 5, 14, 11, c); g.disc(14.5, 6.5, 3, c); },
  hammer: (g, c) => { g.line(5, 18, 12, 7, "b", 2); g.rect(8, 2, 17, 8, c); g.rect(9, 3, 16, 4, "w"); },
  trident: (g, c) => { g.line(2.5, 18.5, 11, 10, "b", 2.2); g.line(8.6, 7.6, 13.4, 12.4, c, 1.8); g.line(8.6, 7.6, 12.4, 3.8, c, 1.6); g.line(11, 10, 15.6, 5.4, c, 1.6); g.line(13.4, 12.4, 17.2, 8.6, c, 1.6); g.tri(13.6, 2.6, 11.6, 3.2, 13, 4.6, c); g.tri(16.8, 4.2, 14.8, 4.8, 16.2, 6.2, c); g.tri(18.4, 7.4, 16.4, 8, 17.8, 9.4, c); g.line(10, 11, 8.6, 13.6, "C", 1.4); }, // 삼지창: 가로대 + 세 갈래 + 뾰족한 끝
  spear: (g, c) => { g.line(2.5, 18.5, 12.5, 8, "b", 2.4); g.line(11.6, 8.9, 13.4, 7.1, "y", 2.6); g.tri(18.6, 1.4, 12.8, 7.2, 13.1, 2.9, c); g.tri(18.6, 1.4, 12.8, 7.2, 17.1, 6.9, c); g.line(14, 6, 17.5, 2.5, "w", 0.9); g.line(11.2, 9.2, 9.6, 12, "r", 1.4); g.line(12.2, 10, 12, 12.8, "r", 1.4); }, // 창: 굵은 자루·쇠고리·마름모 날·빨간 술
  scythe: (g, c) => { g.line(5, 19, 11, 3, "b", 2); g.arc(5, 6, 7, -70, 30, c, 2.4); },
  staff: (g, c) => { g.line(4, 18, 13, 5, "b", 2); g.disc(14, 4, 3, c); g.disc(13, 3, 1.2, "w"); },
  bow: (g, c) => { g.arc(13, 10, 8.5, 112, 248, c, 2.2); g.line(9.8, 2.3, 9.8, 17.7, "g"); },
  crossbow: (g, c) => { g.arc(10, 12, 8, 200, 340, c, 2.2); g.line(10, 4, 10, 18, "b", 2); g.line(3, 9, 17, 9, "g"); },
  armor: (g, c) => { g.rect(5, 4, 14, 16, c); g.rect(2, 4, 5, 9, c); g.rect(14, 4, 17, 9, c); g.rect(8, 3, 11, 5, "k"); g.rect(9, 8, 10, 14, "w"); },
  ring: (g, c) => { g.arc(10, 12, 5.5, 0, 360, "y", 2); g.disc(10, 5.5, 3, c); g.px(9, 4, "w"); },
  amulet: (g, c) => { g.arc(10, 4, 7, 20, 160, "y"); g.disc(10, 13, 4.5, c); g.disc(8.8, 11.8, 1.2, "w"); },
  feather: (g, c) => { g.line(4, 18, 15, 3, "w", 1.4); for (let i = 0; i < 6; i++) { g.line(13 - i * 1.6, 5 + i * 2, 17 - i * 1.6, 7 + i * 2, c); g.line(13 - i * 1.6, 5 + i * 2, 10 - i * 1.6, 3 + i * 2, c); } },
  clover: (g, c) => { g.disc(7, 7, 3.2, c); g.disc(13, 7, 3.2, c); g.disc(7, 13, 3.2, c); g.disc(13, 13, 3.2, c); g.line(10, 10, 15, 18, "D", 1.4); },
  quiver: (g, c) => { g.rect(6, 6, 13, 18, c); g.line(7, 6, 5, 1, "w"); g.line(10, 6, 10, 1, "w"); g.line(12, 6, 14, 1, "w"); g.px(5, 1, "r"); g.px(10, 1, "r"); g.px(14, 1, "r"); },
  bracelet: (g, c) => { g.arc(10, 10, 6, 0, 360, c, 2.4); g.px(10, 2, "G"); g.px(18, 10, "G"); g.px(10, 18, "G"); g.px(2, 10, "G"); },
  crown: (g, c) => { g.rect(4, 10, 16, 15, c); g.tri(4, 10, 4, 4, 8, 10, c); g.tri(8, 10, 10, 3, 12, 10, c); g.tri(12, 10, 16, 4, 16, 10, c); g.px(10, 12, "r"); },
};
function itemIconKind(it) {
  const b = itemBase(it); if (!b) return "blade";
  if (b.slot === "bow") return itemType(it) === "crossbow" ? "crossbow" : "bow";
  if (b.slot === "armor") return "armor";
  if (b.slot === "charm") return b.icon || "ring";
  const f = itemForm(it);
  if (b.cls && (b.cls.includes("mage") || b.cls.includes("druid")) || (f && /지팡이/.test(f.name))) return "staff";
  if (b.cls && b.cls.includes("hunter") || (f && /단검/.test(f.name))) return "dagger";
  const t = itemType(it);
  if (t === "spear" && (b.head === "trident" || (f && f.head === "trident"))) return "trident";
  return { dagger: "dagger", axe: "axe", hammer: "hammer", spear: "spear", scythe: "scythe" }[t] || "blade";
}
function itemIconColor(it) {
  const b = itemBase(it) || {};
  if (b.slot === "armor") return (b.look && b.look.body) || "#c9b08a";
  return b.color || "#ccc";
}
function drawItemIcon(it, x, y, size, opts) {
  if (!it || typeof ICON_DEFS === "undefined") return;
  const kind = itemIconKind(it), c = itemIconColor(it), id = `it_${kind}_${c}`;
  if (!ICON_DEFS[id]) ICON_DEFS[id] = (g) => ITEM_ICON_DRAW[kind](g, c);
  drawIcon(id, x, y, size, opts);
}
// 장비 칸 하나 (등급 색 테두리, 강화, 새 것 표시, 잠금)
function drawItemCell(it, x, y, s, sel, onTap, emptyLabel) {
  roundRectPath(x, y, s, s, 8);
  const rar = it ? itemRarity(it) : null;
  ctx.fillStyle = it ? `${rar.color}22` : "rgba(255,255,255,0.04)"; ctx.fill();
  ctx.strokeStyle = sel ? "#ffe27a" : it ? rar.color : "rgba(255,255,255,0.15)"; ctx.lineWidth = sel ? 3 : it && it.r >= 3 ? 2.5 : 1.5; ctx.stroke();
  if (it) {
    if (it.r >= 3) { ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(game.time * 4); ctx.fillStyle = rar.color; roundRectPath(x + 3, y + 3, s - 6, s - 6, 6); ctx.fill(); ctx.restore(); }
    drawItemIcon(it, x + s / 2, y + s / 2, s * 0.68, { gray: !canUseItem(it) });
    if (it.p) text(`+${it.p}`, x + s - 4, y + s - 5, Math.max(10, s * 0.22), "#ffe27a", "right");
    text(`${it.l}`, x + 4, y + 13, Math.max(9, s * 0.17), "#ccc");
    if (it.n) { ctx.fillStyle = "#ff5a5a"; ctx.beginPath(); ctx.arc(x + s - 7, y + 7, 4.5, 0, Math.PI * 2); ctx.fill(); }
    if (it.lock) drawIcon("lock", x + s - 10, y + 12, 13);
  } else if (emptyLabel) text(emptyLabel, x + s / 2, y + s / 2 + 5, 12, "#666", "center");
  addUI(x, y, s, s, onTap);
}

// ----- 장비 설명 -----
function pct(x) { return `${Math.round(x * 100)}%`; }
function itemLines(it) {
  const b = itemBase(it) || {}, out = [], pr = game.profile, lvK = damageBonus(pr.level);
  if (b.slot === "weapon") {
    const w = weaponFromItem(it);
    const tname = b.cls && b.cls.includes("warrior") ? (WEAPON_TYPES[w.type] || {}).name : b.cls ? `${b.cls.map((c) => CLASS_DEFS[c].name).join("·")} 무기` : (WEAPON_TYPES[w.type] || {}).name;
    out.push([`공격력 ${(w.damage * lvK).toFixed(1)}`, "#fff"]);
    out.push([`${tname || "무기"}${b.cls ? ` · ${b.cls.map((c) => CLASS_DEFS[c].name).join("·")}만` : ""}`, canUseItem(it) ? "#aaa" : "#ff9090"]);
    if (w.effect && ENCHANTS[w.effect] && !(b.legend && b.desc)) out.push([`${ENCHANTS[w.effect].name}: ${ENCHANTS[w.effect].desc}`, ENCHANTS[w.effect].color]);
  } else if (b.slot === "bow") {
    const w = bowFromItem(it);
    out.push([`화살 공격력 ${(w.damage * lvK).toFixed(1)}`, "#fff"]);
    out.push([`${(BOW_TYPES[itemType(it)] || {}).name || "활"}${w.multishot > 1 ? ` · ${w.multishot}발씩` : ""}${w.pierce ? ` · ${w.pierce}마리 뚫기` : ""}`, "#aaa"]);
  } else {
    const a = b.slot === "armor" ? armorFromItems(it, null) : armorFromItems(null, it);
    if (a.hearts) out.push([`하트 +${a.hearts}`, "#ff8a9a"]);
    if (a.block > 0.005) out.push([`막기 ${pct(a.block)}`, "#ffe27a"]);
    if (a.dmgMul > 1.001) out.push([`공격력 +${pct(a.dmgMul - 1)}`, "#ffb070"]);
    if (a.bowMul > 1.001) out.push([`화살 +${pct(a.bowMul - 1)}`, "#e8d0a0"]);
    if (a.speed > 0.001) out.push([`빠르기 +${pct(a.speed)}`, "#9be8ff"]);
    if (a.roll > 0.001) out.push([`구르기 자주 +${pct(a.roll)}`, "#9be8ff"]);
    if (a.luck > 0.001) out.push([`행운 +${pct(a.luck)} (에메랄드·화폐)`, "#7dffb0"]);
    if (a.thorns) out.push([`가시: 때린 몬스터도 아파요`, "#c8e070"]);
    if (a.frost) out.push([`서리: 때린 몬스터가 느려져요`, "#8fe0ff"]);
    if (a.regen) out.push([`하트가 저절로 차요`, "#ff8a9a"]);
  }
  if (b.desc) out.push([b.desc, RARITIES[3].color]);
  return out;
}

// ----- 열고 닫기, 키 -----
hookOn("overlayUpdate", (name, dt) => {
  if (name !== "hero") return false;
  hero.noteT -= dt;
  easeFocusZoom(1.45, dt);
  if (wasPressed("Escape", "KeyC", "KeyE")) closeHero();
  if (wasPressed("Tab") && game.scene === "lobby") hero.tab = hero.tab === "bag" ? "stash" : "bag";
  return true;
}, 50);
function closeHero() { closeOverlay(); easeFocusZoom(1, 99); saveProfile(); }
// C 키로 열기 (던전·캠프)
hookOn("dungeonTick", () => { if (wasPressed("KeyC") && !game.overlay) openHero(); }, 80);
hookOn("playersUpdated", () => { if (game.scene === "lobby" && wasPressed("KeyC") && !game.overlay) openHero(); }, 80);
// 창이 열리면 캐릭터가 왼쪽에 크게 보이게 카메라를 옮겨요
hookOn("cameraTarget", (t, cx, cy) => {
  if (game.overlay !== "hero" || !game.player) return t;
  // 캐릭터가 창 왼쪽 빈 곳 한가운데에 오게 (hero.focusX: 실제 화면 x)
  const fx = hero.focusX || view.w * 0.3;
  const a = (view.w / 2 - fx) / TILE_W, p = game.player;
  return { x: p.x + a, y: p.y - a };
}, 90);
hookOn("hudSkip", () => game.overlay === "hero", 50);
hookOn("reset", () => { if (game.overlay === "hero") game.overlay = null; easeFocusZoom(1, 99); }, 96);

// ----- 그리기 -----
hookOn("overlayDraw", (name) => {
  if (name !== "hero") return false;
  const W = view.w, H = view.h, pr = game.profile, p = game.player;
  const pw = Math.min(640, W - 250), ph = Math.min(596, H - 16);
  const x0 = W - pw - 10, y0 = (H - ph) / 2;
  // 왼쪽: 이름과 레벨 (캐릭터는 세상에 크게 보여요)
  const def = CLASS_DEFS[pr.cls] || CLASS_DEFS.warrior;
  const lx = x0 / 2;
  hero.focusX = lx * (typeof uiK === "number" ? uiK : 1);
  const pbw = Math.min(260, x0 - 24);
  roundRectPath(lx - pbw / 2, 12, pbw, 104, 12); ctx.fillStyle = "rgba(10,10,20,0.6)"; ctx.fill();
  roundRectPath(lx - pbw / 2, H - 154, pbw, 136, 12); ctx.fillStyle = "rgba(10,10,20,0.6)"; ctx.fill();
  text(pr.name || "모험가", lx, 44, 26, "#fff", "center");
  text(`${def.name} · Lv ${pr.level}`, lx, 72, 18, def.color, "center");
  const need = xpNeeded(pr.level), bw = Math.min(200, x0 - 40);
  ctx.fillStyle = "#2b2f38"; ctx.fillRect(lx - bw / 2, 82, bw, 8); ctx.fillStyle = "#56c7ff"; ctx.fillRect(lx - bw / 2, 82, bw * Math.min(1, pr.xp / need), 8);
  text(`경험치 ${pr.xp} / ${need}`, lx, 106, 12, "#9bd", "center");
  // 능력치
  const lvK = damageBonus(pr.level), st = [
    ["하트", `${p.maxHp}`, "#ff8a9a"], ["공격력", (p.weapon.damage * lvK).toFixed(1), "#ffb070"], ["화살", (p.bow.damage * lvK).toFixed(1), "#e8d0a0"],
    ["막기", pct(p.armor.block || 0), "#ffe27a"], ["빠르기", `+${pct(p.armor.speed || 0)}`, "#9be8ff"],
  ];
  st.forEach(([k, v, c], i) => { const yy = H - 132 + i * 22; text(k, lx - 60, yy, 14, "#bbb"); text(v, lx + 64, yy, 15, c, "right"); });

  drawPanel(x0, y0, pw, ph);
  // 머리: 탭 + 닫기
  drawButton(x0 + 14, y0 + 12, 96, 36, "가방", () => { hero.tab = "bag"; hero.page = 0; }, { selected: hero.tab === "bag", size: 16 });
  if (game.scene === "lobby") drawButton(x0 + 116, y0 + 12, 120, 36, "공용 보관함", () => { hero.tab = "stash"; hero.page = 0; }, { selected: hero.tab === "stash", size: 15 });
  drawButton(x0 + pw - 54, y0 + 12, 42, 36, "✕", closeHero, { size: 18 });
  // 화폐
  let cx = x0 + 16;
  for (const c of CURRENCIES) {
    drawCurrencyIcon(c.id, cx + 9, y0 + 66, 8.5);
    text(`${curHave(c.id)}`, cx + 22, y0 + 72, 15, "#fff");
    cx += Math.min(118, (pw - 30) / 5);
  }
  // 끼고 있는 장비 4칸
  const s = Math.min(70, (Math.min(340, pw * 0.56) - 3 * 10) / 4), lx0 = x0 + 16;
  text("끼고 있는 장비", lx0, y0 + 102, 13, "#aaa");
  EQ_SLOTS.forEach((slot, i) => {
    const it = pr.eq[slot.id], x = lx0 + i * (s + 10), y = y0 + 110;
    drawItemCell(it, x, y, s, it && hero.sel === it.u, () => { if (it) { hero.sel = it.u; hero.confirm = null; } }, slot.name);
    text(slot.name, x + s / 2, y + s + 13, 12, "#999", "center");
  });
  // 가방 / 보관함
  const list = hero.tab === "stash" ? sharedStash() : pr.bag;
  const max = hero.tab === "stash" ? STASH_MAX : BAG_MAX;
  const per = 20, pages = Math.max(1, Math.ceil(Math.max(list.length, 1) / per));
  hero.page = Math.min(hero.page, pages - 1);
  const gy = y0 + 110 + s + 44, cs = Math.min(62, (Math.min(340, pw * 0.56) - 4 * 6) / 5), rows = 4;
  text(hero.tab === "stash" ? `공용 보관함 ${list.length}/${max} (모든 캐릭터가 같이 써요)` : `가방 ${list.length}/${max}`, lx0, gy - 6, 13, list.length >= max ? "#ff9090" : "#aaa");
  for (let k = 0; k < per; k++) {
    const i = hero.page * per + k, it = list[i];
    const x = lx0 + (k % 5) * (cs + 6), y = gy + Math.floor(k / 5) * (cs + 6);
    if (Math.floor(k / 5) >= rows) break;
    drawItemCell(it, x, y, cs, it && hero.sel === it.u, () => { if (it) { hero.sel = it.u; hero.confirm = null; if (it.n) it.n = false; } });
  }
  if (pages > 1) {
    const py = gy + rows * (cs + 6) + 4;
    drawButton(lx0, py, 44, 30, "◀", () => { hero.page = (hero.page + pages - 1) % pages; }, { size: 14 });
    text(`${hero.page + 1}/${pages}`, lx0 + 74, py + 20, 14, "#ccc", "center");
    drawButton(lx0 + 104, py, 44, 30, "▶", () => { hero.page = (hero.page + 1) % pages; }, { size: 14 });
  }
  if (hero.tab === "bag" && list.length > 1) drawButton(lx0 + 5 * (cs + 6) - 112, gy - 27, 106, 22, "좋은 순 정렬", () => { pr.bag.sort((a, b) => b.r - a.r || itemScore(b) - itemScore(a)); }, { size: 12 });
  // 오른쪽: 고른 장비
  drawHeroDetail(x0 + Math.min(356, pw * 0.58), y0 + 96, pw - Math.min(356, pw * 0.58) - 14, ph - 110);
  if (hero.noteT > 0) { ctx.globalAlpha = Math.min(1, hero.noteT * 2); text(hero.note, x0 + pw / 2, y0 + ph - 12, 15, hero.noteColor, "center"); ctx.globalAlpha = 1; }
  return true;
}, 50);

function drawHeroDetail(x, y, w, h) {
  const pr = game.profile;
  roundRectPath(x, y, w, h, 10); ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fill();
  const f = hero.sel ? findItem(hero.sel) : null;
  if (!f) {
    text("장비를 눌러 보세요", x + w / 2, y + 40, 15, "#999", "center");
    const tips = ["상자·정예·보스에서 장비가 나와요", "색이 좋을수록 좋은 장비:", "흰색 < 파랑 < 보라 < 금색 < 하늘색", "대장장이에서 +10까지 강화!"];
    tips.forEach((t, i) => text(t, x + w / 2, y + 80 + i * 22, 12, i === 2 ? "#ffe27a" : "#aaa", "center"));
    return;
  }
  const it = f.it, b = itemBase(it), rar = itemRarity(it);
  drawItemIcon(it, x + 34, y + 36, 46, { gray: !canUseItem(it) });
  const nm = itemLabel(it);
  text(nm, x + 66, y + 30, nm.length > 9 ? 15 : 18, rar.color);
  text(`${rar.name} · 장비 Lv ${it.l} · ${EQ_SLOTS.find((s) => s.id === b.slot).name}`, x + 66, y + 52, 12, "#bbb");
  let ly = y + 82;
  for (const [t, c] of itemLines(it)) { for (const l of wrapLines(t, w - 24, 13)) { text(l, x + 12, ly, 13, c); ly += 19; } }
  // 비교 (같은 칸에 끼고 있는 것과)
  const cur = pr.eq[b.slot];
  if (f.where !== "eq") {
    const d = itemScore(it) - itemScore(cur);
    text(cur ? (d > 0 ? `▲ 지금 것보다 ${d} 좋아요` : d < 0 ? `▼ 지금 것보다 ${-d} 약해요` : "지금 것과 같아요") : "▲ 빈 칸에 낄 수 있어요", x + 12, ly + 4, 14, d > 0 || !cur ? "#7dffb0" : d < 0 ? "#ff8080" : "#ddd");
    ly += 24;
  }
  text(`강화 +${it.p || 0} / ${PLUS_MAX}`, x + 12, ly + 4, 12, "#ffe27a");
  // 단추
  const bw = w - 24, bh = 36;
  let by = y + h - bh - 8;
  const btn = (label, fn, color) => { drawButton(x + 12, by, bw, bh, label, fn, { size: 14, color }); by -= bh + 6; };
  if (f.where !== "eq") {
    // 팔기는 캠프 상점에서만 (값만 알려줘요)
    drawPriceButton(x + 12, by, bw, bh, "상점에서 팔면", sellValue(it), () => heroNote("팔기는 캠프 상점의 \"팔기\" 칸에서 해요", "#ffe27a"), { size: 14, color: "rgba(90,90,90,0.35)" }); by -= bh + 6;
    if (game.scene === "lobby") {
      if (f.where === "bag") btn("보관함에 넣기", () => {
        const st = sharedStash(); if (st.length >= STASH_MAX) return heroNote("보관함이 꽉 찼어요", "#ffb070");
        pr.bag.splice(pr.bag.indexOf(it), 1); st.push(it); saveShared(); saveProfile(); heroNote("보관함에 넣었어요 (다른 캐릭터도 꺼낼 수 있어요)");
      }, "rgba(80,140,200,0.35)");
      else btn("가방으로 꺼내기", () => {
        if (pr.bag.length >= BAG_MAX) return heroNote("가방이 꽉 찼어요", "#ffb070");
        const st = sharedStash(); st.splice(st.indexOf(it), 1); pr.bag.push(it); saveShared(); saveProfile(); heroNote("가방에 넣었어요");
      }, "rgba(80,140,200,0.35)");
    }
    btn(it.lock ? "잠금 풀기" : "잠그기 (실수로 안 팔게)", () => { it.lock = !it.lock; saveProfile(); if (f.where === "stash") saveShared(); }, "rgba(255,255,255,0.08)");
    if (canUseItem(it)) btn("장착하기", () => { if (equipItem(it.u)) heroNote(`${josa(itemName(it), "을/를")} 꼈어요!`); }, "rgba(80,200,120,0.45)");
    else text(`${(b.cls || []).map((c) => CLASS_DEFS[c].name).join("·")}만 쓸 수 있어요 (보관함으로 넘겨줘요)`, x + 12, by + bh - 8, 12, "#ff9090");
  } else {
    if (b.slot === "charm") btn("빼기", () => { if (!unequipCharm()) heroNote("가방이 꽉 찼어요", "#ffb070"); }, "rgba(255,255,255,0.08)");
    btn(it.lock ? "잠금 풀기" : "잠그기", () => { it.lock = !it.lock; saveProfile(); }, "rgba(255,255,255,0.08)");
    text("끼고 있어요 · 강화는 캠프의 대장장이에서", x + 12, by + bh - 6, 12, "#7dffb0");
  }
}

// ----- 화면 위 가방 버튼 + "더 좋은 장비!" 알림 -----
hookOn("hudDraw", () => {
  if (game.overlay || game.scene === "title") return;
  const W = view.w, pr = game.profile;
  const hasNew = pr.bag.some((x) => x.n);
  const bx = W - (touch.show && canFullscreen() && !isFullscreen() ? 166 : 112);
  drawButton(bx, 12, 44, 40, "", () => openHero(), { size: 16 });
  drawItemIcon({ b: "a_leather" }, bx + 22, 31, 26); // 가방(갑옷) 그림
  if (hasNew) { ctx.fillStyle = "#ff5a5a"; ctx.beginPath(); ctx.arc(bx + 38, 18, 6, 0, Math.PI * 2); ctx.fill(); }
  const bi = game.betterItem;
  if (bi && game.time - bi.t < 6) {
    const f = findItem(bi.u);
    if (!f || f.where === "eq") { game.betterItem = null; return; }
    const it = f.it, w = 300, x = W / 2 - w / 2;
    const mr = game.messageTimer > 0 && game.lastMsgRect ? game.lastMsgRect : null; // 가운데 메시지 아래, 버튼은 피해서
    const y = hudAvoidY(x, mr ? Math.max(84, mr.y + mr.h + 8) : 84, w, 50, 76);
    ctx.globalAlpha = Math.min(1, (6 - (game.time - bi.t)) * 2);
    drawButton(x, y, w, 50, "", () => { if (equipItem(it.u)) showMessage(`${josa(itemLabel(it), "을/를")} 꼈어요!`, 1.6, false, itemRarity(it).color); }, { color: "rgba(40,120,70,0.75)" });
    drawItemIcon(it, x + 28, y + 25, 34);
    text("더 좋은 장비! 눌러서 끼기", x + 52, y + 21, 15, "#fff");
    text(itemLabel(it), x + 52, y + 41, 13, itemRarity(it).color);
    ctx.globalAlpha = 1;
  } else if (bi) game.betterItem = null;
}, 30);

// ----- 공용 보관함 상자: 집 안에 있어요 (house.js 가 그리고 E 로 열어요) -----
function stashPos() { return houseSpot("stash"); }
