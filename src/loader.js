// ===== 처음 켤 때 불러오기 화면 (진행 막대 + 지금 하는 일 + 안내 문구) =====
// index.html 에서 맨 먼저 읽혀요. 아래 파일(스크립트)들이 하나씩 다 읽힐 때마다 막대가 차요.
//   전체 개수는 이 스크립트 태그의 data-total 에 적어요 (smoke.mjs 가 실제 개수와 같은지 검사해요).
// 느린 인터넷: 한동안 안 차면 "조금만 기다려요", 파일을 못 받으면 새로고침 버튼을 보여줘요.
// 다 읽히면(window load) "준비 완료!" 를 잠깐 보여주고 사라져요. 게임 코드와 상관없이 혼자 돌아요 (훅·전역 함수를 쓰지 않아요).

var daLoader = (function () {
  const TIPS = [
    "빨간 원이나 빨간 줄이 보이면 밖으로 피해요!",
    "구르기를 하는 동안엔 공격에 안 맞아요",
    "보스가 비틀거릴 때가 마구 때릴 시간이에요",
    "금색은 좋은 표시예요. 금색 원 안은 안전해요",
    "활은 멀리 있는 몬스터를 알아서 노려요",
    "하트가 모자라면 물약을 마셔요",
    "상자에서 새 장비가 나와요. 대장장이에게 가면 더 세져요",
    "열쇠를 찾아야 보스방 문이 열려요",
    "높은 곳에선 칼이 아래층에 안 닿아요. 활은 닿아요!",
    "깊은 바다: 거품 기둥 위에 서 있으면 하트가 차요",
    "깊은 바다: 얼음판에선 쭉 미끄러져요",
    "같이 하기: 방 번호를 알려 주면 친구와 함께 모험해요",
  ];
  // 파일 이름으로 지금 하는 일 (재미있게)
  const STEPS = [
    [/^(hooks|errlog|config|items|currency|loot|loot_w2)$/, "가방 챙기는 중"],
    [/^(monsters|maps|iso|rig|anim|sound|world|terrain)$/, "던전 짓는 중"],
    [/^(screenmode|input|save|chars|ui|icons|player|combat)$/, "주인공 깨우는 중"],
    [/^(monster|newmonsters|abilities|mobs_extra|mobs_w2)$/, "몬스터 깨우는 중"],
    [/^(bosses_a|bosses_b|bosses_c|towerboss|bossroom)$/, "보스 깨우는 중"],
    [/^(bow|effects|legendary|chest|tower)$/, "보물 숨기는 중"],
    [/^(lobby|lobbyui|shop|mapselect|menus|hud|main|keyhunt|guide|qol|showcase|classes|help|hero|worlds)$/, "캠프 꾸미는 중"],
    [/^(ocean|ocean_env|bosses_w2|seatower)/, "깊은 바다 채우는 중"],
    [/^(btnlayout|coop|party|net|netplay|trade|upper)$/, "같이 하기 준비 중"],
  ];
  const me = (typeof document !== "undefined" && document.currentScript) || null;
  const total = Math.max(1, parseInt((me && me.getAttribute && me.getAttribute("data-total")) || "100", 10) || 100);
  let seen = 0, done = 0, root = null, bar = null, pct = null, stepEl = null, tipEl = null, warnEl = null, tipI = 0, tipTimer = 0, lastProgress = Date.now(), finished = false, failed = false;
  const BLOCKS = 20;

  function el(tag, css, text) {
    const e = document.createElement(tag);
    Object.assign(e.style, css || {});
    if (text) e.textContent = text;
    return e;
  }
  function build() {
    if (root || typeof document === "undefined" || !document.body) return;
    const font = '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    root = el("div", { position: "fixed", inset: "0", zIndex: "50", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px",
      background: "#15171c", color: "#e8e8e8", font: `bold 18px ${font}`, transition: "opacity 0.45s", padding: "24px", boxSizing: "border-box", textAlign: "center" });
    root.appendChild(el("div", { color: "#ffe27a", fontSize: "40px", letterSpacing: "2px", textShadow: "0 4px 0 #6a4a10" }, "던전 모험"));
    // 블록 막대
    bar = el("div", { display: "flex", gap: "4px", padding: "6px", background: "#0b0c10", border: "3px solid #3a3f4a", borderRadius: "8px" });
    for (let i = 0; i < BLOCKS; i++) bar.appendChild(el("div", { width: "min(3.6vw, 22px)", height: "min(4.2vw, 26px)", background: "#262a33", borderRadius: "3px", transition: "background 0.2s" }));
    root.appendChild(bar);
    pct = el("div", { color: "#ffffff", fontSize: "20px" }, "0%");
    root.appendChild(pct);
    stepEl = el("div", { color: "#9fe6ff", fontSize: "17px" }, "불러오는 중");
    root.appendChild(stepEl);
    tipEl = el("div", { marginTop: "18px", maxWidth: "640px", color: "#d8d8d8", fontSize: "18px", lineHeight: "1.5", minHeight: "56px" });
    root.appendChild(tipEl);
    warnEl = el("div", { color: "#ffb08a", fontSize: "16px", minHeight: "22px" });
    root.appendChild(warnEl);
    document.body.appendChild(root);
    tipI = Math.floor(Math.random() * TIPS.length);
    showTip();
    tipTimer = setInterval(() => { showTip(); slowCheck(); }, 3200);
  }
  function showTip() { if (tipEl) { tipEl.textContent = "안내: " + TIPS[tipI % TIPS.length]; tipI++; } }
  function slowCheck() {
    if (!warnEl || finished || failed) return;
    if (Date.now() - lastProgress > 12000) warnEl.textContent = "인터넷이 조금 느려요. 조금만 기다려 주세요";
  }
  function stepFor(name) { for (const [re, t] of STEPS) if (re.test(name)) return t; return "불러오는 중"; }
  function render(name) {
    if (!root) return;
    const k = Math.min(1, done / total);
    const lit = Math.round(k * BLOCKS);
    const kids = bar.children;
    for (let i = 0; i < kids.length; i++) kids[i].style.background = i < lit ? (i % 2 ? "#ffd23f" : "#ffe27a") : "#262a33";
    pct.textContent = `${Math.round(k * 100)}% (${Math.min(done, total)}/${total})`;
    if (name) stepEl.textContent = stepFor(name) + "...";
  }
  function onScript(e) {
    const t = e && e.target;
    if (!t || t.tagName !== "SCRIPT" || !t.src || t === me) return;
    const name = String(t.src).split("/").pop().replace(/\?.*$/, "").replace(/\.js$/, "");
    if (e.type === "error") { fail(name); return; }
    done++; seen++; lastProgress = Date.now();
    if (warnEl && !failed) warnEl.textContent = "";
    render(name);
  }
  function fail(name) {
    failed = true;
    build();
    if (!warnEl) return;
    warnEl.textContent = `파일(${name})을 못 받았어요. 인터넷을 확인하고 새로고침 해 주세요 (광고 차단 확장이 막았을 수도 있어요: 이 사이트는 꺼 주세요)`;
    if (!root.querySelector || !root.querySelector("button")) {
      const b = el("button", { font: "inherit", fontSize: "18px", padding: "10px 22px", borderRadius: "10px", border: "none", background: "#3fbf6f", color: "#fff", cursor: "pointer" }, "새로고침");
      b.addEventListener("click", () => location.reload());
      root.appendChild(b);
    }
  }
  function finish() {
    if (finished || failed) return;
    finished = true;
    done = total; render();
    if (stepEl) stepEl.textContent = "준비 완료!";
    clearInterval(tipTimer);
    if (!root) return;
    setTimeout(() => { if (root) root.style.opacity = "0"; }, 350);
    setTimeout(() => { if (root && root.parentNode) root.parentNode.removeChild(root); root = null; }, 850);
  }
  try {
    build();
    // 스크립트 하나가 다 읽힐 때마다 (잡기 단계라서 받을 수 있어요). 요소의 load 는 window 까지 안 가요: document 에서 잡아요
    document.addEventListener("load", onScript, true);
    document.addEventListener("error", onScript, true); // 파일을 못 받았을 때
    window.addEventListener("load", (e) => { if (!e || !e.target || e.target === document || e.target === window) finish(); });
  } catch (e) { /* 불러오기 화면은 없어도 게임은 돌아요 */ }
  // 시험·사진용: daLoader.preview(37) 로 화면을 다시 띄워 볼 수 있어요
  return {
    total: () => total, count: () => done, seen: () => seen, // seen = 실제로 다 읽힌 스크립트 개수
    preview(n, tip) { finished = false; failed = false; done = n; build(); if (tip !== undefined) { tipI = tip; showTip(); } render("monster"); },
    hide() { finished = false; finish(); },
  };
})();
