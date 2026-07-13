// space-bg.js — Animated Space Background
// Stars · Aurora · Floating Planets · Meteor Trails
// Savings → Stars    |    Expenses → Meteors    |    Goals → Planets

(function () {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;
  let stars = [], nebulae = [], planets = [], meteors = [];
  let animId;
  let tick = 0;

  // --- Resize ---
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    init();
  }

  // --- Star data ---
  function mkStar() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      color: ['#ffffff','#ccd6f6','#a8d8ff','#ffd6f6','#d6ffe8'][Math.floor(Math.random()*5)],
    };
  }

  // --- Nebula / aurora blob ---
  function mkNebula() {
    const colors = [
      'rgba(124,58,237,',
      'rgba(20,184,166,',
      'rgba(244,114,182,',
      'rgba(99,102,241,',
      'rgba(52,211,153,',
    ];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      rx: 200 + Math.random() * 300,
      ry: 120 + Math.random() * 200,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.04 + Math.random() * 0.07,
      drift: (Math.random() - 0.5) * 0.15,
      driftY: (Math.random() - 0.5) * 0.08,
    };
  }

  // --- Planet ---
  function mkPlanet() {
    const palettes = [
      { body: '#7c3aed', ring: 'rgba(167,139,250,0.3)', glow: 'rgba(124,58,237,0.3)' },
      { body: '#14b8a6', ring: 'rgba(94,234,212,0.3)',  glow: 'rgba(20,184,166,0.3)' },
      { body: '#f472b6', ring: 'rgba(244,114,182,0.3)', glow: 'rgba(244,114,182,0.3)' },
      { body: '#f59e0b', ring: 'rgba(253,224,71,0.2)',  glow: 'rgba(245,158,11,0.25)' },
    ];
    const p = palettes[Math.floor(Math.random() * palettes.length)];
    const r = 12 + Math.random() * 28;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r,
      ...p,
      floatPhase: Math.random() * Math.PI * 2,
      floatSpeed: 0.003 + Math.random() * 0.004,
      floatAmp: 8 + Math.random() * 20,
      hasRing: Math.random() > 0.5,
    };
  }

  // --- Meteor ---
  function spawnMeteor() {
    return {
      x: Math.random() * W * 0.8,
      y: -20,
      vx: 3 + Math.random() * 4,
      vy: 4 + Math.random() * 5,
      len: 60 + Math.random() * 80,
      alpha: 1,
      life: 0,
      maxLife: 40 + Math.random() * 30,
      color: Math.random() > 0.7 ? '#fca5a5' : '#c4b5fd',
    };
  }

  // --- Init ---
  function init() {
    const count = Math.min(Math.floor((W * H) / 5000), 200); // reduced star count slightly
    stars   = Array.from({ length: count }, mkStar);
    meteors = [];
  }

  // --- Draw ---
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Pure black background for speed
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // --- Stars ---
    for (const s of stars) {
      const twinkle = Math.sin(tick * s.twinkleSpeed + s.twinklePhase);
      const a = s.alpha + twinkle * 0.25;
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      ctx.fillStyle = s.color;
      // Removed shadowBlur on stars for massive speed up
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- Meteors ---
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life++;
      m.alpha = 1 - m.life / m.maxLife;

      if (m.life >= m.maxLife || m.x > W + 100 || m.y > H + 100) {
        meteors.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = m.alpha;
      const mGrad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
      mGrad.addColorStop(0, m.color);
      mGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = mGrad;
      ctx.lineWidth = 1.5;
      // Removed shadowBlur on meteors
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 14, m.y - m.vy * 14);
      ctx.stroke();
      ctx.restore();
    }

    // Occasional random meteor
    if (tick % 240 === 0 && Math.random() > 0.5) {
      meteors.push(spawnMeteor());
    }

    tick++;
    animId = requestAnimationFrame(draw);
  }

  // Color helper
  function lighten(hex, amount) {
    const num = parseInt(hex.replace('#',''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }

  // --- Public API: trigger effects ---
  window.SpaceBG = {
    // ⭐ Savings saved → burst of stars
    burstStars(originEl) {
      if (!originEl) return;
      const rect = originEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      for (let i = 0; i < 12; i++) {
        const el = document.createElement('div');
        const angle = (i / 12) * Math.PI * 2;
        const dist = 60 + Math.random() * 80;
        el.style.cssText = `
          position:fixed;left:${cx}px;top:${cy}px;
          font-size:${14 + Math.random() * 10}px;
          z-index:9999;pointer-events:none;
          --dx:${Math.cos(angle) * dist}px;
          --dy:${Math.sin(angle) * dist}px;
        `;
        el.textContent = ['⭐','✨','💫','🌟'][Math.floor(Math.random()*4)];
        el.className = 'star-burst';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1200);
      }
    },

    // ☄️ Expense added → meteor falls
    spawnExpenseMeteor() {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => meteors.push(spawnMeteor()), i * 120);
      }
    },

    // 🪐 Goal completed → planet pulse
    pulseGoalPlanet() {
      if (!planets.length) return;
      const p = planets[0];
      const orig = p.r;
      let frames = 0;
      const pulse = () => {
        frames++;
        p.r = orig + Math.sin(frames * 0.3) * 10;
        if (frames < 40) requestAnimationFrame(pulse);
        else p.r = orig;
      };
      pulse();
    },
  };

  // --- Boot ---
  window.addEventListener('resize', resize);
  resize();
  draw();
})();
