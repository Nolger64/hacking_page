/* ========================================================
   CYBERPUNK INTERACTIVITY & HUD SCRIPTS
   ======================================================== */

// --- Web Audio API Synthesizer (Cyber SFX) ---
class CyberAudioEngine {
  constructor() {
    this.enabled = true;
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playHoverBeep() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  playClickBlip() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.12);
    } catch (e) {
      // Audio context error handling
    }
  }

  playSuccessChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
      });
    } catch (e) {}
  }
}

const cyberAudio = new CyberAudioEngine();

// --- Live HUD Clock ---
function startHudClock() {
  const clockElement = document.getElementById('sys-clock');
  if (!clockElement) return;

  function update() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    const s = pad(now.getSeconds());

    clockElement.textContent = `${y}.${m}.${d} // ${h}:${min}:${s}`;
  }

  update();
  setInterval(update, 1000);
}

// --- Terminal Clone Clipboard Copy ---
function setupClipboardCopy() {
  const copyBtn = document.getElementById('copy-btn');
  const cloneCmd = document.getElementById('clone-cmd');
  const copyNotify = document.getElementById('copy-notify');

  if (!copyBtn || !cloneCmd) return;

  copyBtn.addEventListener('click', () => {
    cyberAudio.playSuccessChime();
    const textToCopy = cloneCmd.textContent.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
      if (copyNotify) {
        copyNotify.classList.add('show');
        setTimeout(() => {
          copyNotify.classList.remove('show');
        }, 2500);
      }
      copyBtn.innerHTML = '<i class="fa-solid fa-check text-neon-green"></i> ¡LISTO!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> COPIAR';
      }, 2500);
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      if (copyNotify) {
        copyNotify.classList.add('show');
        setTimeout(() => copyNotify.classList.remove('show'), 2500);
      }
    });
  });
}

// --- Audio SFX Button Listeners & Toggle ---
function setupAudioInteractivity() {
  const toggleBtn = document.getElementById('sfx-toggle');
  const statusSpan = document.getElementById('sfx-status');

  if (toggleBtn && statusSpan) {
    toggleBtn.addEventListener('click', () => {
      cyberAudio.enabled = !cyberAudio.enabled;
      statusSpan.textContent = cyberAudio.enabled ? 'ON' : 'OFF';
      toggleBtn.classList.toggle('muted', !cyberAudio.enabled);
      if (cyberAudio.enabled) {
        cyberAudio.playClickBlip();
      }
    });
  }

  // Attach hover and click to interactive elements
  const interactives = document.querySelectorAll('button, a, .cyber-widget');
  interactives.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cyberAudio.playHoverBeep();
    });
    el.addEventListener('click', () => {
      if (el.id !== 'copy-btn') {
        cyberAudio.playClickBlip();
      }
    });
  });
}

// --- Cyberpunk Interactive Canvas Background ---
function initCyberCanvas() {
  const canvas = document.getElementById('cyber-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Nodes / Data packets
  const totalNodes = Math.floor((width * height) / 18000);
  const nodes = [];

  for (let i = 0; i < totalNodes; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.3 ? '#00f0ff' : '#ff0055'
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Subtle Perspective Cyber Grid lines at the bottom
    const gridY = height * 0.65;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal horizon lines
    for (let y = gridY; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Connect nodes
    for (let i = 0; i < nodes.length; i++) {
      const p1 = nodes[i];

      p1.x += p1.vx;
      p1.y += p1.vy;

      if (p1.x < 0 || p1.x > width) p1.vx *= -1;
      if (p1.y < 0 || p1.y > height) p1.vy *= -1;

      // Draw node point
      ctx.fillStyle = p1.color;
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
      ctx.fill();

      // Connect nearby nodes
      for (let j = i + 1; j < nodes.length; j++) {
        const p2 = nodes[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist / 110)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(render);
  }

  render();
}

// --- Initialize Everything on DOM Load ---
document.addEventListener('DOMContentLoaded', () => {
  startHudClock();
  setupClipboardCopy();
  setupAudioInteractivity();
  initCyberCanvas();
});
