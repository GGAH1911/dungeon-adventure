// ===== 치트 코드 =====
// 키보드: 게임 중에 / 또는 T 를 누르면 입력창이 나와요.
// 터치: 오른쪽 위 메뉴(≡) 버튼 -> "치트"
// 코드 목록은 src/config.js 의 cheats 에 있어요.

var cheatOpen = false;

const cheatBox = document.createElement("div");
cheatBox.innerHTML = '<span>치트 코드</span><input autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="30" placeholder="코드 입력">' +
  '<button data-act="ok">확인</button><button data-act="cancel">취소</button>';
Object.assign(cheatBox.style, {
  position: "fixed", left: "50%", top: "18%", transform: "translateX(-50%)",
  display: "none", alignItems: "center", gap: "12px",
  background: "rgba(10,10,20,0.85)", border: "2px solid #ffe27a", borderRadius: "12px",
  padding: "12px 16px", color: "#ffe27a",
  font: 'bold 18px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
});
document.body.appendChild(cheatBox);
const cheatInput = cheatBox.querySelector("input");
Object.assign(cheatInput.style, {
  font: '20px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', width: "280px",
  background: "#111", color: "#fff", border: "1px solid #555", borderRadius: "6px",
  padding: "6px 10px", outline: "none",
});

for (const b of cheatBox.querySelectorAll("button")) {
  Object.assign(b.style, {
    font: 'bold 17px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', padding: "8px 14px",
    borderRadius: "8px", border: "none", cursor: "pointer",
    background: b.dataset.act === "ok" ? "#3fbf6f" : "#555", color: "#fff",
  });
  b.addEventListener("click", (e) => {
    e.preventDefault();
    if (b.dataset.act === "ok") submitCheat(); else closeCheat();
  });
}

let submitAfterCompose = false;

function openCheat() {
  cheatOpen = true;
  for (const k in keys) keys[k] = false; // 걷던 것 멈추기
  cheatBox.style.display = "flex";
  cheatInput.value = "";
  cheatInput.focus(); // 태블릿은 여기서 바로 키보드가 올라와요
}

function closeCheat() {
  cheatOpen = false;
  submitAfterCompose = false;
  cheatBox.style.display = "none";
  cheatInput.blur();
}

// 게임 중 / 또는 T 를 누르면 열기
window.addEventListener("keydown", (e) => {
  if (cheatOpen || game.overlay || (game.scene !== "lobby" && game.scene !== "dungeon")) return;
  if (e.code === "Slash" || e.code === "KeyT") {
    e.preventDefault();
    openCheat();
  }
});

cheatInput.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key === "Escape") { closeCheat(); return; }
  if (e.key === "Enter") {
    e.preventDefault();
    // 한글을 조합하는 중이면 글자가 완성된 다음에 확인해요
    if (e.isComposing || e.keyCode === 229) { submitAfterCompose = true; return; }
    submitCheat();
  }
});
cheatInput.addEventListener("compositionend", () => {
  if (submitAfterCompose) { submitAfterCompose = false; setTimeout(submitCheat, 0); }
});

// 한글을 영문 자판 키로 바꾸기 (최강 -> chlrkd)
const CHO_KEYS = ["r", "R", "s", "e", "E", "f", "a", "q", "Q", "t", "T", "d", "w", "W", "c", "z", "x", "v", "g"];
const JUNG_KEYS = ["k", "o", "i", "O", "j", "p", "u", "P", "h", "hk", "ho", "hl", "y", "n", "nj", "np", "nl", "b", "m", "ml", "l"];
const JONG_KEYS = ["", "r", "R", "rt", "s", "sw", "sg", "e", "f", "fr", "fa", "fq", "ft", "fx", "fv", "fg", "a", "q", "qt", "t", "T", "d", "w", "c", "z", "x", "v", "g"];

function hangulToKeys(str) {
  let out = "";
  for (const ch of str) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c > 11171) { out += ch; continue; }
    out += CHO_KEYS[Math.floor(c / 588)] + JUNG_KEYS[Math.floor((c % 588) / 28)] + JONG_KEYS[c % 28];
  }
  return out.toLowerCase();
}

function cleanCode(s) {
  return s.normalize("NFC").replace(/\s+/g, "").toLowerCase();
}

function findCheat(typed) {
  const t = cleanCode(typed);
  if (!t) return null;
  for (const [code, action] of Object.entries(CONFIG.cheats)) {
    const c = cleanCode(code);
    if (t === c || hangulToKeys(t) === hangulToKeys(c)) return action;
  }
  return null;
}

function submitCheat() {
  if (!cheatOpen) return;
  const typed = cheatInput.value;
  closeCheat();
  if (!typed.trim()) return;
  const action = findCheat(typed);
  if (!action) {
    sfx.denied();
    showMessage("그런 치트는 없어요", 1.5);
    return;
  }
  applyCheat(action);
}

function applyCheat(action) {
  const p = game.player;
  const pr = game.profile;
  if (action === "legend") {
    const w = WEAPONS.find((i) => i.id === "legend");
    const a = ARMORS.find((i) => i.id === "legend");
    if (!pr.weapons.includes(w.id)) pr.weapons.push(w.id);
    if (!pr.armors.includes(a.id)) pr.armors.push(a.id);
    equipItem("weapon", w);
    equipItem("armor", a);
    p.hp = p.maxHp;
    legendCelebration(p);
    showMessage("전설의 장비 장착!!", 3.5, true);
  } else if (action === "uncheat") {
    // 전설의 장비를 없애고, 가진 것 중 제일 좋은 걸로 바꿔요
    const had = pr.weapons.some((id) => weaponById(id).secret) || pr.armors.some((id) => armorById(id).secret);
    pr.weapons = pr.weapons.filter((id) => !weaponById(id).secret);
    pr.armors = pr.armors.filter((id) => !armorById(id).secret);
    const best = (list, byId) => list.map(byId).sort((x, y) => y.price - x.price)[0];
    if (weaponById(pr.weapon).secret) equipItem("weapon", best(pr.weapons, weaponById) || WEAPONS[0]);
    if (armorById(pr.armor).secret) equipItem("armor", best(pr.armors, armorById) || ARMORS[0]);
    saveProfile();
    if (had) {
      sfx.denied();
      spawnBurst(p.x, p.y, ["#888888", "#bbbbbb"], 16);
      showMessage("치트 끝! 전설의 장비가 사라졌어요", 2.5);
    } else {
      showMessage("끌 치트가 없어요", 1.5);
    }
  } else if (action === "emeralds") {
    pr.emeralds += 100;
    saveProfile();
    for (let i = 0; i < 25; i++) dropPickupRain(p);
    sfx.buy();
    showMessage("에메랄드 비가 내려요! +100", 2.5);
  }
}

// 에메랄드 비 (보여주기용 반짝이)
function dropPickupRain(p) {
  addSparkle(p.x + (Math.random() - 0.5) * 4, p.y + (Math.random() - 0.5) * 4, 2 + Math.random() * 2, {
    vz: -2, life: 0.9, size: 1.2, hue: 140 + Math.random() * 20,
  });
}
