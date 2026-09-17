/* ============================================
   ⚛️ CORE SCRIPTS — Mobile-First
   ============================================ */

// ========== PARTICLES ==========
(function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [];
  const isMobile = window.innerWidth < 640;
  const COUNT = isMobile ? 30 : 60;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class P {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 1.5 + 0.3;
      this.c = ["#00f0ff", "#ff00aa", "#00ff88", "#a855f7"][
        Math.floor(Math.random() * 4)
      ];
      this.a = Math.random() * 0.4 + 0.15;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.c;
      ctx.globalAlpha = this.a;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new P());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();

// ========== PROGRESS BAR ==========
(function () {
  const bar = document.getElementById("progress-bar");
  if (!bar) return;
  window.addEventListener(
    "scroll",
    () => {
      const st = window.scrollY;
      const dh = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (st / dh) * 100 + "%";
    },
    { passive: true },
  );
})();

// ========== REVEAL ON SCROLL ==========
(function () {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
  );
  els.forEach((el) => obs.observe(el));
})();

// ========== BOTTOM NAV ACTIVE STATE ==========
(function () {
  const links = document.querySelectorAll(".bottom-nav a");
  const path = window.location.pathname.split("/").pop() || "index.html";
  links.forEach((a) => {
    a.classList.remove("active");
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });
})();
