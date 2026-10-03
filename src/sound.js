// ===== 효과음 =====
// 소리 파일 없이 컴퓨터가 직접 소리를 만들어요. (M 키: 소리 끄기/켜기)

let audioCtx = null;
let masterGain = null;
let muted = false;

function unlockAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  // 아이패드/아이폰은 처음에 소리를 한 번 내줘야 켜져요
  if (!audioCtx.__unlocked) {
    const b = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = b; src.connect(audioCtx.destination); src.start(0);
    audioCtx.__unlocked = true;
  }
}

function tone(freq, dur, type = "square", vol = 0.1, slideTo = null, delay = 0) {
  if (!audioCtx || muted) return;
  const t0 = audioCtx.currentTime + delay;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(masterGain);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur, vol, freq, type = "bandpass", delay = 0) {
  if (!audioCtx || muted) return;
  const len = Math.floor(audioCtx.sampleRate * dur);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const f = audioCtx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = audioCtx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(masterGain);
  src.start(audioCtx.currentTime + delay);
}

const sfx = {
  swing() { noise(0.09, 0.18, 1800); },
  hit() { tone(190, 0.09, "square", 0.1, 90); },
  kill() { tone(320, 0.14, "square", 0.08, 70); },
  hurt() { tone(240, 0.22, "sawtooth", 0.1, 100); },
  block() { tone(900, 0.08, "triangle", 0.12); tone(1350, 0.12, "triangle", 0.08, null, 0.05); },
  roll() { noise(0.14, 0.1, 600); },
  emerald() { tone(1320, 0.07, "triangle", 0.07); tone(1760, 0.1, "triangle", 0.07, null, 0.06); },
  apple() { tone(500, 0.08, "sine", 0.1, 800); },
  wave() { tone(330, 0.15, "square", 0.06); tone(440, 0.25, "square", 0.06, null, 0.12); },
  buy() { [660, 880, 1100].forEach((f, i) => tone(f, 0.1, "triangle", 0.08, null, i * 0.07)); },
  equip() { tone(700, 0.08, "triangle", 0.08); tone(1050, 0.1, "triangle", 0.08, null, 0.06); },
  denied() { tone(200, 0.15, "square", 0.07); tone(150, 0.2, "square", 0.07, null, 0.1); },
  legendSwing() {
    noise(0.2, 0.2, 2600);
    tone(1200, 0.28, "triangle", 0.06, 2400);
    tone(1800, 0.3, "sine", 0.05, 3600, 0.03);
  },
  thunder() { noise(0.4, 0.35, 320, "lowpass"); tone(90, 0.3, "sawtooth", 0.07, 40); },
  sparkle() { tone(2400 + Math.random() * 800, 0.06, "sine", 0.03); },
  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "square", 0.06, null, i * 0.08));
    tone(1568, 0.4, "triangle", 0.06, null, 0.32);
  },
  arrow() { noise(0.08, 0.12, 3000); },
  orb() { tone(700, 0.3, "sine", 0.05, 1400); },
  bowShot() { noise(0.06, 0.15, 2200); tone(300, 0.06, "triangle", 0.05, 160); },
  bowEmpty() { tone(250, 0.06, "square", 0.04); },
  legendBow() { tone(1500, 0.18, "triangle", 0.05, 3000); noise(0.12, 0.12, 4000); },
  fuse() { noise(0.9, 0.08, 5000, "highpass"); },
  boom() { noise(0.6, 0.5, 400, "lowpass"); tone(70, 0.5, "sawtooth", 0.12, 30); },
  slam() { noise(0.25, 0.3, 250, "lowpass"); tone(60, 0.25, "square", 0.08, 40); },
  pounce() { tone(600, 0.12, "sawtooth", 0.05, 1200); },
  potion() { [400, 600, 800].forEach((f, i) => tone(f, 0.1, "sine", 0.08, f * 1.3, i * 0.06)); },
  clear() {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.08, null, i * 0.12));
  },
  click() { tone(900, 0.04, "triangle", 0.05); },
  cheat() {
    const notes = [523, 659, 784, 1047, 1319, 1568, 2093];
    notes.forEach((f, i) => tone(f, 0.18, "triangle", 0.09, null, i * 0.07));
    [1047, 1319, 1568].forEach((f) => tone(f, 0.9, "triangle", 0.06, null, 0.55));
    for (let i = 0; i < 10; i++) tone(2500 + Math.random() * 1500, 0.08, "sine", 0.03, null, 0.6 + i * 0.06);
  },
};
