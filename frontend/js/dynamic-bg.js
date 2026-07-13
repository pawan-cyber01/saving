// dynamic-bg.js — Highly optimized Sky Cycle Background (Morning, Afternoon, Evening, Night)

window.DynamicBG = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  theme: 'afternoon', // morning, afternoon, evening, night
  stars: [],
  clouds: [],
  meteors: [],
  animationId: null,

  init() {
    this.canvas = document.getElementById('space-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    
    // Sync with initial theme if available
    if (window.Theme && window.Theme.timeOfDay) {
      this.theme = window.Theme.timeOfDay;
    }
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.initElements();
    this.animate();
  },

  setTheme(newTheme) {
    if (this.theme === newTheme) return;
    this.theme = newTheme;
    this.initElements();
  },

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.initElements();
  },

  initElements() {
    this.stars = [];
    this.clouds = [];
    this.meteors = [];

    if (this.theme === 'night') {
      // Create stars
      const numStars = this.width < 768 ? 50 : 150;
      for (let i = 0; i < numStars; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          r: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.05 + 0.01,
          alpha: Math.random()
        });
      }
    } else {
      // Create clouds for day themes
      const numClouds = this.width < 768 ? 4 : 8;
      for (let i = 0; i < numClouds; i++) {
        this.clouds.push({
          x: Math.random() * this.width,
          y: Math.random() * (this.height * 0.4), // upper 40% of screen
          size: Math.random() * 60 + 40,
          speed: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
          opacity: this.theme === 'evening' ? 0.3 : 0.6
        });
      }
    }
  },

  drawSkyGradient() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    if (this.theme === 'morning') {
      grad.addColorStop(0, '#74ebd5');
      grad.addColorStop(1, '#ACB6E5');
    } else if (this.theme === 'afternoon') {
      grad.addColorStop(0, '#2193b0');
      grad.addColorStop(1, '#6dd5ed');
    } else if (this.theme === 'evening') {
      grad.addColorStop(0, '#ff7e5f');
      grad.addColorStop(1, '#feb47b');
    } else {
      // night
      grad.addColorStop(0, '#040b14');
      grad.addColorStop(1, '#0b1626');
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  },

  drawSunOrMoon() {
    this.ctx.beginPath();
    
    if (this.theme === 'morning') {
      this.ctx.arc(this.width * 0.8, this.height * 0.3, 40, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 235, 150, 0.9)';
    } else if (this.theme === 'afternoon') {
      this.ctx.arc(this.width * 0.5, this.height * 0.15, 50, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 220, 0.9)';
    } else if (this.theme === 'evening') {
      this.ctx.arc(this.width * 0.2, this.height * 0.6, 60, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 120, 80, 0.9)';
    } else {
      // Moon
      this.ctx.arc(this.width * 0.8, this.height * 0.2, 30, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(230, 240, 255, 0.9)';
    }
    
    this.ctx.fill();
  },

  drawClouds() {
    this.ctx.fillStyle = this.theme === 'evening' ? 'rgba(50, 30, 50, 0.2)' : 'rgba(255, 255, 255, 0.5)';
    for (let c of this.clouds) {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      this.ctx.arc(c.x + c.size * 0.6, c.y - c.size * 0.3, c.size * 0.8, 0, Math.PI * 2);
      this.ctx.arc(c.x + c.size * 1.2, c.y, c.size * 0.7, 0, Math.PI * 2);
      this.ctx.fill();

      // move cloud
      c.x += c.speed;
      if (c.x > this.width + c.size * 2) c.x = -c.size * 2;
      if (c.x < -c.size * 2) c.x = this.width + c.size * 2;
    }
  },

  drawStars() {
    this.ctx.fillStyle = '#ffffff';
    for (let s of this.stars) {
      s.alpha += s.speed;
      if (s.alpha > 1 || s.alpha < 0) s.speed = -s.speed;
      
      this.ctx.globalAlpha = Math.max(0, s.alpha);
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  },

  triggerMeteor(isGoal = false) {
    if (this.theme !== 'night') return; // Meteors only at night
    this.meteors.push({
      x: Math.random() * this.width,
      y: -50,
      len: Math.random() * 80 + 40,
      speedX: - (Math.random() * 4 + 4),
      speedY: Math.random() * 4 + 4,
      color: isGoal ? '#10b981' : '#ef4444',
      life: 1.0
    });
  },

  drawMeteors() {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      let m = this.meteors[i];
      this.ctx.beginPath();
      this.ctx.moveTo(m.x, m.y);
      this.ctx.lineTo(m.x - m.speedX * 4, m.y - m.speedY * 4);
      this.ctx.strokeStyle = `rgba(${m.color === '#10b981' ? '16,185,129' : '239,68,68'}, ${m.life})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      m.x += m.speedX;
      m.y += m.speedY;
      m.life -= 0.02;

      if (m.life <= 0 || m.y > this.height) {
        this.meteors.splice(i, 1);
      }
    }
  },

  animate() {
    this.drawSkyGradient();
    this.drawSunOrMoon();

    if (this.theme === 'night') {
      this.drawStars();
      this.drawMeteors();
    } else {
      this.drawClouds();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
};

window.addEventListener('load', () => DynamicBG.init());
