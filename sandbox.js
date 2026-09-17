/* ==========================================================================
   ⚛️ PHYSICS NOTES — SANDBOX ENGINE (sandbox.js)
   Contains:
   - Module 1: Vector-Based Playground Physics
   - Module 2: Projectile Kinematics Engine
   - Module 3: Free Fall & Energy Tracker
   - Module 4: Mathematical Graph Plotter
   - Module 5: FSc Physics Calculator (Sig Figs, Dimensions, Homogeneity)
   ========================================================================== */

// ==========================================
// 🎛️ TAB SWITCHING SYSTEM
// ==========================================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".sandbox-module")
      .forEach((m) => m.classList.remove("active"));

    btn.classList.add("active");
    const targetModule = document.getElementById("mod-" + btn.dataset.tab);
    if (targetModule) targetModule.classList.add("active");

    setTimeout(() => {
      if (btn.dataset.tab === "playground") pgResize();
      if (btn.dataset.tab === "projectile") projResize();
      if (btn.dataset.tab === "freefall") ffResize();
      if (btn.dataset.tab === "graph") graphResize();
    }, 50);
  });
});

// ==========================================
// 📐 CANVAS HELPER FUNCTIONS (DPI Scaling)
// ==========================================
function setupCanvas(canvas) {
  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height };
}

function getCanvasPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}

// ==========================================
// 🎮 MODULE 1: PLAYGROUND PHYSICS (2D Engine)
// ==========================================
const pgCanvas = document.getElementById("pgCanvas");
let pgCtx, pgW, pgH;
let pgBalls = [],
  pgWalls = [];
let pgTool = "ball";
let pgPlaying = true;
let pgGrav = 9.8,
  pgBounceFactor = 0.7;
let pgWallStart = null;
const PG_SCALE = 50;

function pgResize() {
  if (!pgCanvas) return;
  const s = setupCanvas(pgCanvas);
  pgCtx = s.ctx;
  pgW = s.w;
  pgH = s.h;
}
pgResize();
window.addEventListener("resize", pgResize);

const pgToolsContainer = document.getElementById("pgTools");
if (pgToolsContainer) {
  pgToolsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".tool-btn");
    if (!btn) return;
    document
      .querySelectorAll("#pgTools .tool-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    pgTool = btn.dataset.tool;
    pgWallStart = null;
  });
}

const pgGravitySlider = document.getElementById("pgGravity");
if (pgGravitySlider) {
  pgGravitySlider.addEventListener("input", (e) => {
    pgGrav = parseFloat(e.target.value);
    document.getElementById("pgGravVal").textContent =
      pgGrav.toFixed(1) + " m/s²";
  });
}

const pgBounceSlider = document.getElementById("pgBounce");
if (pgBounceSlider) {
  pgBounceSlider.addEventListener("input", (e) => {
    pgBounceFactor = parseFloat(e.target.value);
    document.getElementById("pgBounceVal").textContent =
      pgBounceFactor.toFixed(2);
  });
}

function pgPreset(p) {
  const g = { earth: 9.8, moon: 1.6, jupiter: 24.8, zero: 0 }[p];
  if (pgGravitySlider) {
    pgGravitySlider.value = g;
    pgGrav = g;
    document.getElementById("pgGravVal").textContent = g.toFixed(1) + " m/s²";
  }
}

function pgTogglePlay() {
  pgPlaying = !pgPlaying;
  const btn = document.getElementById("pgPlayBtn");
  if (btn) {
    btn.textContent = pgPlaying ? "⏸" : "▶";
    btn.classList.toggle("active", pgPlaying);
  }
}

function pgReset() {
  pgBalls = [];
  pgWalls = [];
  pgWallStart = null;
}

function pgHandleTap(e) {
  if (!pgCanvas) return;
  e.preventDefault();
  const pos = getCanvasPos(pgCanvas, e);

  if (pgTool === "ball") {
    const r = 12 + Math.random() * 10;
    const colors = [
      "#00f0ff",
      "#ff00aa",
      "#00ff88",
      "#ffe600",
      "#a855f7",
      "#ff6a00",
    ];
    pgBalls.push({
      x: pos.x,
      y: pos.y,
      vx: (Math.random() - 0.5) * 60,
      vy: 0,
      r: r,
      color: colors[Math.floor(Math.random() * colors.length)],
      mass: r * r,
    });
  } else if (pgTool === "wall" || pgTool === "ramp") {
    if (!pgWallStart) {
      pgWallStart = { x: pos.x, y: pos.y };
    } else {
      pgWalls.push({
        x1: pgWallStart.x,
        y1: pgWallStart.y,
        x2: pos.x,
        y2: pos.y,
      });
      pgWallStart = null;
    }
  } else if (pgTool === "eraser") {
    let minD = 40,
      minI = -1;
    pgBalls.forEach((b, i) => {
      const d = Math.hypot(b.x - pos.x, b.y - pos.y);
      if (d < minD) {
        minD = d;
        minI = i;
      }
    });
    if (minI >= 0) pgBalls.splice(minI, 1);

    pgWalls = pgWalls.filter((w) => {
      const mx = (w.x1 + w.x2) / 2,
        my = (w.y1 + w.y2) / 2;
      return Math.hypot(mx - pos.x, my - pos.y) > 30;
    });
  }
}

if (pgCanvas) {
  pgCanvas.addEventListener("click", pgHandleTap);
  pgCanvas.addEventListener("touchstart", pgHandleTap, { passive: false });
}

function pgStep(dt) {
  if (!pgPlaying) return;
  const gPx = pgGrav * PG_SCALE;

  pgBalls.forEach((b) => {
    b.vy += gPx * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.y + b.r > pgH) {
      b.y = pgH - b.r;
      b.vy *= -pgBounceFactor;
      b.vx *= 0.98;
      if (Math.abs(b.vy) < 5) b.vy = 0;
    }
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx *= -pgBounceFactor;
    }
    if (b.x + b.r > pgW) {
      b.x = pgW - b.r;
      b.vx *= -pgBounceFactor;
    }
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy *= -pgBounceFactor;
    }

    pgWalls.forEach((w) => {
      const dx = w.x2 - w.x1,
        dy = w.y2 - w.y1;
      const len = Math.hypot(dx, dy);
      if (len === 0) return;
      const nx = -dy / len,
        ny = dx / len;
      const t = ((b.x - w.x1) * dx + (b.y - w.y1) * dy) / (len * len);
      if (t < 0 || t > 1) return;

      const closestX = w.x1 + t * dx;
      const closestY = w.y1 + t * dy;
      const dist = Math.hypot(b.x - closestX, b.y - closestY);

      if (dist < b.r + 2) {
        const overlap = b.r + 2 - dist;
        const sign = (b.x - closestX) * nx + (b.y - closestY) * ny > 0 ? 1 : -1;
        b.x += nx * overlap * sign;
        b.y += ny * overlap * sign;

        const vDotN = b.vx * nx * sign + b.vy * ny * sign;
        if (vDotN < 0) {
          b.vx -= (1 + pgBounceFactor) * vDotN * nx * sign;
          b.vy -= (1 + pgBounceFactor) * vDotN * ny * sign;
        }
      }
    });
  });

  for (let i = 0; i < pgBalls.length; i++) {
    for (let j = i + 1; j < pgBalls.length; j++) {
      const a = pgBalls[i],
        b = pgBalls[j];
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;

      if (dist < minDist && dist > 0) {
        const nx = dx / dist,
          ny = dy / dist;
        const overlap = minDist - dist;
        const totalMass = a.mass + b.mass;

        a.x -= nx * overlap * (b.mass / totalMass);
        a.y -= ny * overlap * (b.mass / totalMass);
        b.x += nx * overlap * (a.mass / totalMass);
        b.y += ny * overlap * (a.mass / totalMass);

        const kx = a.vx - b.vx,
          ky = a.vy - b.vy;
        const vDotN = kx * nx + ky * ny;
        if (vDotN > 0) {
          const impulse = ((1 + pgBounceFactor) * vDotN) / totalMass;
          a.vx -= impulse * b.mass * nx;
          a.vy -= impulse * b.mass * ny;
          b.vx += impulse * a.mass * nx;
          b.vy += impulse * a.mass * ny;
        }
      }
    }
  }
}

function pgDraw() {
  if (!pgCtx) return;
  pgCtx.clearRect(0, 0, pgW, pgH);

  pgCtx.strokeStyle = "rgba(0,240,255,0.03)";
  pgCtx.lineWidth = 1;
  for (let x = 0; x < pgW; x += PG_SCALE) {
    pgCtx.beginPath();
    pgCtx.moveTo(x, 0);
    pgCtx.lineTo(x, pgH);
    pgCtx.stroke();
  }
  for (let y = 0; y < pgH; y += PG_SCALE) {
    pgCtx.beginPath();
    pgCtx.moveTo(0, y);
    pgCtx.lineTo(pgW, y);
    pgCtx.stroke();
  }

  pgWalls.forEach((w) => {
    pgCtx.strokeStyle = "#a855f7";
    pgCtx.lineWidth = 5;
    pgCtx.lineCap = "round";
    pgCtx.beginPath();
    pgCtx.moveTo(w.x1, w.y1);
    pgCtx.lineTo(w.x2, w.y2);
    pgCtx.stroke();
    pgCtx.shadowBlur = 8;
    pgCtx.shadowColor = "#a855f7";
    pgCtx.stroke();
    pgCtx.shadowBlur = 0;
  });

  pgBalls.forEach((b) => {
    const grd = pgCtx.createRadialGradient(
      b.x - b.r * 0.3,
      b.y - b.r * 0.3,
      b.r * 0.1,
      b.x,
      b.y,
      b.r,
    );
    grd.addColorStop(0, "#fff");
    grd.addColorStop(0.3, b.color);
    grd.addColorStop(1, "rgba(0,0,0,0.35)");

    pgCtx.fillStyle = grd;
    pgCtx.beginPath();
    pgCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    pgCtx.fill();

    pgCtx.shadowBlur = 10;
    pgCtx.shadowColor = b.color;
    pgCtx.strokeStyle = b.color;
    pgCtx.lineWidth = 1;
    pgCtx.stroke();
    pgCtx.shadowBlur = 0;
  });

  pgCtx.fillStyle = "rgba(255,255,255,0.25)";
  pgCtx.font = "10px Consolas";
  pgCtx.textAlign = "right";
  pgCtx.fillText(
    `${pgBalls.length} Balls | g = ${pgGrav.toFixed(1)} m/s²`,
    pgW - 10,
    15,
  );
}

let pgLastTime = 0;
function pgLoop(time) {
  const dt = Math.min((time - pgLastTime) / 1000, 0.033);
  pgLastTime = time;
  pgStep(dt);
  pgDraw();
  requestAnimationFrame(pgLoop);
}
requestAnimationFrame(pgLoop);

// ==========================================
// 🚀 MODULE 2: PROJECTILE KINEMATICS ENGINE
// ==========================================
const projCanvas = document.getElementById("projCanvas");
let projCtx, projW, projH;
let projAngle = 45,
  projVel = 30,
  projGrav = 9.8;
let projTrail = [],
  projRunning = false,
  projT = 0;

function projResize() {
  if (!projCanvas) return;
  const s = setupCanvas(projCanvas);
  projCtx = s.ctx;
  projW = s.w;
  projH = s.h;
  projDrawStatic();
}
projResize();
window.addEventListener("resize", projResize);

const projAngleSlider = document.getElementById("projAngle");
if (projAngleSlider) {
  projAngleSlider.addEventListener("input", (e) => {
    projAngle = parseInt(e.target.value);
    document.getElementById("projAngleVal").textContent = projAngle + "°";
    projCalcStats();
    if (!projRunning) projDrawStatic();
  });
}

const projVelSlider = document.getElementById("projVel");
if (projVelSlider) {
  projVelSlider.addEventListener("input", (e) => {
    projVel = parseInt(e.target.value);
    document.getElementById("projVelVal").textContent = projVel + " m/s";
    projCalcStats();
    if (!projRunning) projDrawStatic();
  });
}

const projGravSlider = document.getElementById("projGrav");
if (projGravSlider) {
  projGravSlider.addEventListener("input", (e) => {
    projGrav = parseFloat(e.target.value);
    document.getElementById("projGravVal").textContent =
      projGrav.toFixed(1) + " m/s²";
    projCalcStats();
    if (!projRunning) projDrawStatic();
  });
}

function projPreset(p) {
  const g = { earth: 9.8, moon: 1.6, mars: 3.7, jupiter: 24.8 }[p];
  if (projGravSlider) {
    projGravSlider.value = g;
    projGrav = g;
    document.getElementById("projGravVal").textContent = g.toFixed(1) + " m/s²";
    projCalcStats();
    if (!projRunning) projDrawStatic();
  }
}

function projCalcStats() {
  const rad = (projAngle * Math.PI) / 180;
  const vx = projVel * Math.cos(rad);
  const vy = projVel * Math.sin(rad);
  const tFlight = (2 * vy) / projGrav;
  const range = vx * tFlight;
  const maxH = (vy * vy) / (2 * projGrav);

  document.getElementById("projRange").textContent = range.toFixed(1) + " m";
  document.getElementById("projHeight").textContent = maxH.toFixed(1) + " m";
  document.getElementById("projTime").textContent = tFlight.toFixed(2) + " s";
  document.getElementById("projFinalV").textContent =
    projVel.toFixed(1) + " m/s";

  const res = document.getElementById("projResult");
  if (res) {
    res.style.display = "block";
    document.getElementById("projSteps").innerHTML =
      `v₀ₓ = v₀ cos(θ) = ${projVel} cos(${projAngle}°) = ${vx.toFixed(2)} m/s\n` +
      `v₀ᵧ = v₀ sin(θ) = ${projVel} sin(${projAngle}°) = ${vy.toFixed(2)} m/s\n` +
      `Time of Flight (T) = 2v₀ᵧ/g = 2 × ${vy.toFixed(2)} / ${projGrav} = ${tFlight.toFixed(2)} s\n` +
      `Horizontal Range (R) = v₀ₓ × T = ${vx.toFixed(2)} × ${tFlight.toFixed(2)} = ${range.toFixed(1)} m\n` +
      `Max Altitude (H) = v₀ᵧ² / 2g = ${vy.toFixed(2)}² / (2 × ${projGrav}) = ${maxH.toFixed(1)} m`;
  }
}
projCalcStats();

function projDrawStatic() {
  if (!projCtx) return;
  projCtx.clearRect(0, 0, projW, projH);

  const rad = (projAngle * Math.PI) / 180;
  const vx = projVel * Math.cos(rad);
  const vy = projVel * Math.sin(rad);
  const tFlight = (2 * vy) / projGrav;
  const range = vx * tFlight;
  const maxH = (vy * vy) / (2 * projGrav);

  const margin = 40;
  const scaleX = (projW - margin * 2) / Math.max(range, 1);
  const scaleY = (projH - margin * 2) / Math.max(maxH, 1);
  const scale = Math.min(scaleX, scaleY);
  const ox = margin,
    oy = projH - margin;

  projCtx.strokeStyle = "rgba(0,240,255,0.04)";
  projCtx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = ox + (range / 10) * i * scale;
    projCtx.beginPath();
    projCtx.moveTo(x, oy);
    projCtx.lineTo(x, oy - maxH * scale - 10);
    projCtx.stroke();
  }

  projCtx.strokeStyle = "rgba(0,240,255,0.25)";
  projCtx.lineWidth = 1.5;
  projCtx.beginPath();
  projCtx.moveTo(ox, oy);
  projCtx.lineTo(ox + range * scale + 15, oy);
  projCtx.moveTo(ox, oy);
  projCtx.lineTo(ox, oy - maxH * scale - 15);
  projCtx.stroke();

  projCtx.strokeStyle = "rgba(255,0,170,0.25)";
  projCtx.lineWidth = 1.5;
  projCtx.setLineDash([3, 3]);
  projCtx.beginPath();
  for (let t = 0; t <= tFlight; t += tFlight / 100) {
    const px = ox + vx * t * scale;
    const py = oy - (vy * t - 0.5 * projGrav * t * t) * scale;
    if (t === 0) projCtx.moveTo(px, py);
    else projCtx.lineTo(px, py);
  }
  projCtx.stroke();
  projCtx.setLineDash([]);

  projCtx.strokeStyle = "rgba(0,255,136,0.5)";
  projCtx.lineWidth = 2.5;
  projCtx.beginPath();
  projCtx.moveTo(ox, oy);
  projCtx.lineTo(ox + 45 * Math.cos(rad), oy - 45 * Math.sin(rad));
  projCtx.stroke();

  projCtx.fillStyle = "rgba(255,255,255,0.4)";
  projCtx.font = "10px Consolas";
  projCtx.fillText("θ = " + projAngle + "°", ox + 45, oy - 10);
  projCtx.fillText(
    "Y (H_max = " + maxH.toFixed(1) + " m)",
    ox + 5,
    oy - maxH * scale - 5,
  );
}

function projLaunch() {
  projTrail = [];
  projT = 0;
  projRunning = true;
  projAnimate();
}

function projAnimate() {
  if (!projRunning) return;
  const dt = 0.02;
  projT += dt;

  const rad = (projAngle * Math.PI) / 180;
  const vx = projVel * Math.cos(rad);
  const vy = projVel * Math.sin(rad);
  const tFlight = (2 * vy) / projGrav;
  const range = vx * tFlight;
  const maxH = (vy * vy) / (2 * projGrav);

  const margin = 40;
  const scale = Math.min(
    (projW - margin * 2) / Math.max(range, 1),
    (projH - margin * 2) / Math.max(maxH, 1),
  );
  const ox = margin,
    oy = projH - margin;

  const px = vx * projT;
  const py = vy * projT - 0.5 * projGrav * projT * projT;

  if (projT <= tFlight) {
    projTrail.push({ x: ox + px * scale, y: oy - py * scale });
  }

  projDrawStatic();

  if (projTrail.length > 1) {
    projCtx.strokeStyle = "#00f0ff";
    projCtx.lineWidth = 3;
    projCtx.shadowBlur = 10;
    projCtx.shadowColor = "#00f0ff";
    projCtx.beginPath();
    projTrail.forEach((p, i) =>
      i === 0 ? projCtx.moveTo(p.x, p.y) : projCtx.lineTo(p.x, p.y),
    );
    projCtx.stroke();
    projCtx.shadowBlur = 0;
  }

  if (projT <= tFlight && projTrail.length > 0) {
    const last = projTrail[projTrail.length - 1];
    projCtx.fillStyle = "#ffe600";
    projCtx.shadowBlur = 15;
    projCtx.shadowColor = "#ffe600";
    projCtx.beginPath();
    projCtx.arc(last.x, last.y, 6, 0, Math.PI * 2);
    projCtx.fill();
    projCtx.shadowBlur = 0;
  }

  if (projT < tFlight) {
    requestAnimationFrame(projAnimate);
  } else {
    projRunning = false;
  }
}

function projReset() {
  projRunning = false;
  projTrail = [];
  projT = 0;
  projDrawStatic();
}

// ==========================================
// 🎢 MODULE 3: FREE FALL & ENERGY TRACKER
// ==========================================
const ffCanvas = document.getElementById("ffCanvas");
let ffCtx, ffW, ffH;
let ffHeight = 20,
  ffInitV = 0,
  ffGrav = 9.8,
  ffMass = 1;
let ffRunning = false,
  ffT = 0;
let ffBallY = 0,
  ffBallV = 0;
let ffTrail = [];
let ffGraphData = [];

function ffResize() {
  if (!ffCanvas) return;
  const s = setupCanvas(ffCanvas);
  ffCtx = s.ctx;
  ffW = s.w;
  ffH = s.h;
  ffDrawStatic();
}
ffResize();
window.addEventListener("resize", ffResize);

const ffHeightSlider = document.getElementById("ffHeightSlider");
if (ffHeightSlider) {
  ffHeightSlider.addEventListener("input", (e) => {
    ffHeight = parseInt(e.target.value);
    document.getElementById("ffHeightVal").textContent = ffHeight + " m";
    if (!ffRunning) ffDrawStatic();
  });
}

const ffInitVSlider = document.getElementById("ffInitV");
if (ffInitVSlider) {
  ffInitVSlider.addEventListener("input", (e) => {
    ffInitV = parseInt(e.target.value);
    document.getElementById("ffInitVVal").textContent = ffInitV + " m/s";
    if (!ffRunning) ffDrawStatic();
  });
}

const ffGravSlider = document.getElementById("ffGrav");
if (ffGravSlider) {
  ffGravSlider.addEventListener("input", (e) => {
    ffGrav = parseFloat(e.target.value);
    document.getElementById("ffGravVal").textContent =
      ffGrav.toFixed(1) + " m/s²";
    if (!ffRunning) ffDrawStatic();
  });
}

const ffMassSlider = document.getElementById("ffMass");
if (ffMassSlider) {
  ffMassSlider.addEventListener("input", (e) => {
    ffMass = parseFloat(e.target.value);
    document.getElementById("ffMassVal").textContent =
      ffMass.toFixed(1) + " kg";
  });
}

function ffPreset(p) {
  if (p === "drop") {
    ffHeight = 20;
    ffInitV = 0;
    ffGrav = 9.8;
  } else if (p === "throw") {
    ffHeight = 10;
    ffInitV = 20;
    ffGrav = 9.8;
  } else if (p === "moon") {
    ffHeight = 20;
    ffInitV = 0;
    ffGrav = 1.6;
  }
  if (ffHeightSlider) ffHeightSlider.value = ffHeight;
  if (ffInitVSlider) ffInitVSlider.value = ffInitV;
  if (ffGravSlider) ffGravSlider.value = ffGrav;

  document.getElementById("ffHeightVal").textContent = ffHeight + " m";
  document.getElementById("ffInitVVal").textContent = ffInitV + " m/s";
  document.getElementById("ffGravVal").textContent =
    ffGrav.toFixed(1) + " m/s²";
  ffReset();
}

function ffDrawStatic() {
  if (!ffCtx) return;
  ffCtx.clearRect(0, 0, ffW, ffH);

  const margin = 40;
  const drawH = ffH - margin * 2;
  const maxH = Math.max(ffHeight + (ffInitV * ffInitV) / (2 * ffGrav), 10);
  const scale = drawH / maxH;
  const groundY = ffH - margin;
  const startY = groundY - ffHeight * scale;

  ffCtx.fillStyle = "#06060f";
  ffCtx.fillRect(0, 0, ffW, ffH);

  ffCtx.fillStyle = "rgba(0,240,255,0.3)";
  ffCtx.font = "10px Consolas";
  ffCtx.textAlign = "right";
  const step = Math.max(1, Math.floor(maxH / 8));
  for (let h = 0; h <= maxH; h += step) {
    const y = groundY - h * scale;
    if (y < margin - 15) break;
    ffCtx.fillText(h + " m", margin - 6, y + 3);
    ffCtx.strokeStyle = "rgba(0,240,255,0.06)";
    ffCtx.beginPath();
    ffCtx.moveTo(margin, y);
    ffCtx.lineTo(ffW - 10, y);
    ffCtx.stroke();
  }

  ffCtx.strokeStyle = "rgba(0,255,136,0.4)";
  ffCtx.lineWidth = 2.5;
  ffCtx.beginPath();
  ffCtx.moveTo(margin, groundY);
  ffCtx.lineTo(ffW - 10, groundY);
  ffCtx.stroke();

  const ballX = ffW * 0.28;
  const ballR = 10 + ffMass * 2;
  ffCtx.fillStyle = "#ff6a00";
  ffCtx.shadowBlur = 10;
  ffCtx.shadowColor = "#ff6a00";
  ffCtx.beginPath();
  ffCtx.arc(ballX, startY, ballR, 0, Math.PI * 2);
  ffCtx.fill();
  ffCtx.shadowBlur = 0;
}

function ffStart() {
  ffT = 0;
  ffBallY = ffHeight;
  ffBallV = -ffInitV;
  ffTrail = [];
  ffGraphData = [];
  ffRunning = true;
  ffAnimate();
}

function ffAnimate() {
  if (!ffRunning) return;
  const dt = 0.016;
  ffT += dt;

  ffBallV -= ffGrav * dt;
  ffBallY += ffBallV * dt;

  const maxH = Math.max(ffHeight + (ffInitV * ffInitV) / (2 * ffGrav), 10);
  const margin = 40;
  const scale = (ffH - margin * 2) / maxH;
  const groundY = ffH - margin;
  const ballX = ffW * 0.28;
  const ballR = 10 + ffMass * 2;

  ffGraphData.push({ t: ffT, y: Math.max(ffBallY, 0), v: Math.abs(ffBallV) });

  if (ffBallY <= 0) {
    ffBallY = 0;
    ffRunning = false;

    const tGround =
      (ffInitV + Math.sqrt(ffInitV * ffInitV + 2 * ffGrav * ffHeight)) / ffGrav;
    const vFinal = Math.sqrt(ffInitV * ffInitV + 2 * ffGrav * ffHeight);
    const peLost = ffMass * ffGrav * ffHeight;
    const keGained = 0.5 * ffMass * vFinal * vFinal;

    const res = document.getElementById("ffResult");
    if (res) {
      res.style.display = "block";
      document.getElementById("ffSteps").innerHTML =
        `Theoretical Flight Time: t = ${tGround.toFixed(3)} s\n` +
        `Final velocity: v = ${vFinal.toFixed(2)} m/s\n` +
        `Potential Energy Lost: PE = ${peLost.toFixed(1)} J\n` +
        `Kinetic Energy Gained: KE = ${keGained.toFixed(1)} J`;
    }
  }

  ffCtx.clearRect(0, 0, ffW, ffH);
  ffCtx.fillStyle = "#06060f";
  ffCtx.fillRect(0, 0, ffW, ffH);

  ffCtx.fillStyle = "rgba(0,240,255,0.3)";
  ffCtx.font = "10px Consolas";
  ffCtx.textAlign = "right";
  const step = Math.max(1, Math.floor(maxH / 8));
  for (let h = 0; h <= maxH; h += step) {
    const y = groundY - h * scale;
    ffCtx.fillText(h + " m", margin - 6, y + 3);
  }

  ffCtx.strokeStyle = "rgba(0,255,136,0.4)";
  ffCtx.lineWidth = 2;
  ffCtx.beginPath();
  ffCtx.moveTo(margin, groundY);
  ffCtx.lineTo(ffW - 10, groundY);
  ffCtx.stroke();

  const by = groundY - Math.max(ffBallY, 0) * scale;
  const grd = ffCtx.createRadialGradient(
    ballX - 3,
    by - 3,
    2,
    ballX,
    by,
    ballR,
  );
  grd.addColorStop(0, "#ffb366");
  grd.addColorStop(0.5, "#ff6a00");
  grd.addColorStop(1, "#8b0000");
  ffCtx.fillStyle = grd;
  ffCtx.shadowBlur = 15;
  ffCtx.shadowColor = "#ff6a00";
  ffCtx.beginPath();
  ffCtx.arc(ballX, by, ballR, 0, Math.PI * 2);
  ffCtx.fill();
  ffCtx.shadowBlur = 0;

  const currentH = Math.max(ffBallY, 0);
  const currentV = Math.abs(ffBallV);
  const pe = ffMass * ffGrav * currentH;
  const ke = 0.5 * ffMass * currentV * currentV;
  const totalE = pe + ke || 1;

  document.getElementById("ffTime").textContent = ffT.toFixed(2) + " s";
  document.getElementById("ffHeight").textContent = currentH.toFixed(1) + " m";
  document.getElementById("ffVel").textContent = currentV.toFixed(1) + " m/s";
  document.getElementById("ffEnergy").textContent =
    Math.round((ke / totalE) * 100) +
    " / " +
    Math.round((pe / totalE) * 100) +
    "%";

  if (ffGraphData.length > 2) {
    const gx = ffW * 0.48,
      gy = 15,
      gw = ffW * 0.48,
      gh = ffH * 0.35;
    ffCtx.fillStyle = "rgba(13,13,36,0.85)";
    ffCtx.fillRect(gx, gy, gw, gh);
    ffCtx.strokeStyle = "rgba(0,240,255,0.15)";
    ffCtx.strokeRect(gx, gy, gw, gh);

    ffCtx.fillStyle = "rgba(255,255,255,0.4)";
    ffCtx.font = "9px Consolas";
    ffCtx.textAlign = "left";
    ffCtx.fillText("Cyan: Position | Pink: Velocity", gx + 6, gy + 12);

    const maxT = Math.max(ffT, 1);
    const maxVal = Math.max(maxH, 10);

    ffCtx.strokeStyle = "#00f0ff";
    ffCtx.lineWidth = 1.5;
    ffCtx.beginPath();
    ffGraphData.forEach((d, i) => {
      const px = gx + (d.t / maxT) * gw;
      const py = gy + gh - (d.y / maxVal) * (gh - 18) - 6;
      if (i === 0) ffCtx.moveTo(px, py);
      else ffCtx.lineTo(px, py);
    });
    ffCtx.stroke();

    const maxV = Math.max(...ffGraphData.map((d) => d.v), 1);
    ffCtx.strokeStyle = "#ff00aa";
    ffCtx.beginPath();
    ffGraphData.forEach((d, i) => {
      const px = gx + (d.t / maxT) * gw;
      const py = gy + gh - (d.v / maxV) * (gh - 18) - 6;
      if (i === 0) ffCtx.moveTo(px, py);
      else ffCtx.lineTo(px, py);
    });
    ffCtx.stroke();
  }

  if (ffRunning) requestAnimationFrame(ffAnimate);
}

function ffReset() {
  ffRunning = false;
  ffT = 0;
  ffTrail = [];
  ffGraphData = [];
  document.getElementById("ffTime").textContent = "0.00 s";
  document.getElementById("ffHeight").textContent = ffHeight + " m";
  document.getElementById("ffVel").textContent = "0.0 m/s";
  document.getElementById("ffEnergy").textContent = "0 / 100%";
  const res = document.getElementById("ffResult");
  if (res) res.style.display = "none";
  ffDrawStatic();
}

// ==========================================
// 📊 MODULE 4: GRAPH PLOTTER
// ==========================================
const graphCanvas = document.getElementById("graphCanvas");
let graphCtx, graphW, graphH;
const eqColors = ["#00f0ff", "#ff00aa", "#00ff88", "#ffe600"];
let equations = ["sin(x)", "0.5*x"];
let graphZoom = 1;
let graphParamA = 1;
let graphPanX = 0,
  graphPanY = 0;

function graphResize() {
  if (!graphCanvas) return;
  const s = setupCanvas(graphCanvas);
  graphCtx = s.ctx;
  graphW = s.w;
  graphH = s.h;
  drawGraph();
}
graphResize();
window.addEventListener("resize", graphResize);

function evalExpr(expr, x, a) {
  try {
    let e = expr
      .toLowerCase()
      .replace(/\^/g, "**")
      .replace(/pi/g, "Math.PI")
      .replace(/(?<![a-z])e(?![a-z])/g, "Math.E")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/asin\(/g, "Math.asin(")
      .replace(/acos\(/g, "Math.acos(")
      .replace(/atan\(/g, "Math.atan(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/exp\(/g, "Math.exp(")
      .replace(/abs\(/g, "Math.abs(");

    if (
      !/^[0-9xaMathPIE.+\-*/()\s,]*$/.test(
        e.replace(
          /Math\.(sin|cos|tan|asin|acos|atan|sqrt|log10|log|exp|abs|PI|E)/g,
          "",
        ),
      )
    ) {
      return NaN;
    }
    return Function("x", "a", "return " + e)(x, a);
  } catch (err) {
    return NaN;
  }
}

function drawGraph() {
  if (!graphCtx) return;
  graphCtx.clearRect(0, 0, graphW, graphH);

  const range = 10 / graphZoom;
  const cx = graphW / 2 + graphPanX;
  const cy = graphH / 2 + graphPanY;
  const scale = Math.min(graphW, graphH) / (2 * range);

  graphCtx.strokeStyle = "rgba(0,240,255,0.04)";
  graphCtx.lineWidth = 1;
  const gridStep = Math.max(1, Math.pow(10, Math.floor(Math.log10(range))) / 2);
  for (let x = -Math.ceil(range); x <= Math.ceil(range); x += gridStep) {
    const px = cx + x * scale;
    graphCtx.beginPath();
    graphCtx.moveTo(px, 0);
    graphCtx.lineTo(px, graphH);
    graphCtx.stroke();
  }
  for (let y = -Math.ceil(range); y <= Math.ceil(range); y += gridStep) {
    const py = cy - y * scale;
    graphCtx.beginPath();
    graphCtx.moveTo(0, py);
    graphCtx.lineTo(graphW, py);
    graphCtx.stroke();
  }

  graphCtx.strokeStyle = "rgba(0,240,255,0.35)";
  graphCtx.lineWidth = 1.5;
  graphCtx.beginPath();
  graphCtx.moveTo(0, cy);
  graphCtx.lineTo(graphW, cy);
  graphCtx.moveTo(cx, 0);
  graphCtx.lineTo(cx, graphH);
  graphCtx.stroke();

  graphCtx.fillStyle = "rgba(255,255,255,0.4)";
  graphCtx.font = "9px Consolas";
  graphCtx.textAlign = "center";
  for (let x = -Math.ceil(range); x <= Math.ceil(range); x += gridStep) {
    if (x === 0) continue;
    const px = cx + x * scale;
    if (px > 10 && px < graphW - 10)
      graphCtx.fillText(x.toFixed(gridStep < 1 ? 1 : 0), px, cy + 12);
  }
  graphCtx.textAlign = "right";
  for (let y = -Math.ceil(range); y <= Math.ceil(range); y += gridStep) {
    if (y === 0) continue;
    const py = cy - y * scale;
    if (py > 10 && py < graphH - 10)
      graphCtx.fillText(y.toFixed(gridStep < 1 ? 1 : 0), cx - 4, py + 3);
  }

  equations.forEach((eq, idx) => {
    if (!eq.trim()) return;
    graphCtx.strokeStyle = eqColors[idx];
    graphCtx.lineWidth = 2.5;
    graphCtx.shadowBlur = 6;
    graphCtx.shadowColor = eqColors[idx];

    graphCtx.beginPath();
    let first = true;
    let lastY = null;

    for (let px = 0; px <= graphW; px++) {
      const x = (px - cx) / scale;
      const y = evalExpr(eq, x, graphParamA);

      if (isNaN(y) || !isFinite(y)) {
        first = true;
        lastY = null;
        continue;
      }
      const py = cy - y * scale;

      if (py < -100 || py > graphH + 100) {
        first = true;
        continue;
      }
      if (lastY !== null && Math.abs(py - lastY) > graphH * 0.8) {
        first = true;
      }

      if (first) {
        graphCtx.moveTo(px, py);
        first = false;
      } else {
        graphCtx.lineTo(px, py);
      }
      lastY = py;
    }
    graphCtx.stroke();
    graphCtx.shadowBlur = 0;
  });

  const xrElem = document.getElementById("graphXRange");
  if (xrElem) xrElem.textContent = "±" + range.toFixed(1);
  const yrElem = document.getElementById("graphYRange");
  if (yrElem) yrElem.textContent = "±" + range.toFixed(1);
  const zmElem = document.getElementById("graphZoom");
  if (zmElem) zmElem.textContent = graphZoom.toFixed(1) + "×";
}

function addEq() {
  if (equations.length >= 4) return;
  equations.push("");
  renderEqInputs();
}

function removeEq(idx) {
  equations.splice(idx, 1);
  renderEqInputs();
  drawGraph();
}

function renderEqInputs() {
  const list = document.getElementById("eqList");
  if (!list) return;
  list.innerHTML = "";
  equations.forEach((eq, idx) => {
    const row = document.createElement("div");
    row.className = "eq-row";
    row.innerHTML = `
      <div class="eq-color" style="background:${eqColors[idx]}"></div>
      <input type="text" class="eq-input" data-idx="${idx}" placeholder="e.g. sin(x)" value="${eq}">
      <button class="eq-remove" onclick="removeEq(${idx})">×</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll(".eq-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      equations[parseInt(e.target.dataset.idx)] = e.target.value;
      drawGraph();
    });
  });
}
renderEqInputs();

const graphZoomSlider = document.getElementById("graphZoomSlider");
if (graphZoomSlider) {
  graphZoomSlider.addEventListener("input", (e) => {
    graphZoom = parseFloat(e.target.value);
    document.getElementById("graphZoomVal").textContent =
      graphZoom.toFixed(1) + "×";
    drawGraph();
  });
}

const graphASlider = document.getElementById("graphA");
if (graphASlider) {
  graphASlider.addEventListener("input", (e) => {
    graphParamA = parseFloat(e.target.value);
    document.getElementById("graphAVal").textContent = graphParamA.toFixed(1);
    drawGraph();
  });
}

function graphPreset(p) {
  const presets = {
    linear: ["a*x", "x+a"],
    quad: ["a*x^2", "x^2 - a"],
    projectile: ["30*sin(45*pi/180)*x - 0.5*a*x^2", "0"],
    trig: ["sin(a*x)", "cos(x)"],
    decay: ["exp(-a*x)", "sin(x)*exp(-0.1*x)"],
  };
  equations = presets[p] || equations;
  renderEqInputs();
  drawGraph();
}

function graphReset() {
  graphZoom = 1;
  graphPanX = 0;
  graphPanY = 0;
  if (graphZoomSlider) graphZoomSlider.value = 1;
  document.getElementById("graphZoomVal").textContent = "1.0×";
  drawGraph();
}

let graphDragging = false,
  graphLastX = 0,
  graphLastY = 0;
if (graphCanvas) {
  graphCanvas.addEventListener("mousedown", (e) => {
    graphDragging = true;
    graphLastX = e.clientX;
    graphLastY = e.clientY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!graphDragging) return;
    graphPanX += e.clientX - graphLastX;
    graphPanY += e.clientY - graphLastY;
    graphLastX = e.clientX;
    graphLastY = e.clientY;
    drawGraph();
  });
  window.addEventListener("mouseup", () => (graphDragging = false));

  let graphTouchStart = null;
  graphCanvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      graphTouchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });
  graphCanvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && graphTouchStart) {
        graphPanX += e.touches[0].clientX - graphTouchStart.x;
        graphPanY += e.touches[0].clientY - graphTouchStart.y;
        graphTouchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        drawGraph();
      }
    },
    { passive: false },
  );
}

// ==========================================
// 🧮 MODULE 5: BOARD-EXAM PHYSICS CALCULATOR
// ==========================================

document.querySelectorAll(".calc-tab").forEach((t) => {
  t.addEventListener("click", () => {
    document
      .querySelectorAll(".calc-tab")
      .forEach((x) => x.classList.remove("active"));
    document
      .querySelectorAll(".calc-panel")
      .forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById("panel-" + t.dataset.panel).classList.add("active");
  });
});

function analyzeSigFigs(s) {
  if (!s || s.trim() === "") return null;
  s = s.trim().replace(/^\+/, "");
  const neg = s.startsWith("-");
  if (neg) s = s.substring(1);

  let expPart = "";
  if (/e/i.test(s)) {
    const parts = s.split(/e/i);
    s = parts[0];
    expPart = "e" + parts[1];
  }
  const hasDecimal = s.includes(".");
  const clean = s.replace(".", "");
  let firstNZ = -1,
    lastNZ = -1;
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] !== "0") {
      if (firstNZ < 0) firstNZ = i;
      lastNZ = i;
    }
  }
  if (firstNZ < 0)
    return {
      digits: s.split("").map((c) => ({ c, sig: false })),
      count: 0,
      rule: "Zeroes only — none significant.",
    };

  let digits = [];
  let idx = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === ".") {
      digits.push({ c: ".", sig: "dot" });
      continue;
    }
    let sig = false;
    if (s[i] !== "0") sig = true;
    else if (idx > firstNZ && idx < lastNZ) sig = true;
    else if (idx > lastNZ && hasDecimal) sig = true;
    else if (idx > lastNZ && !hasDecimal) sig = false;
    digits.push({ c: s[i], sig });
    idx++;
  }
  const count = digits.filter((d) => d.sig === true).length;
  let rule = "";
  if (s.startsWith("0") && hasDecimal)
    rule = "Leading zeroes are NOT significant.";
  else if (hasDecimal && s.endsWith("0"))
    rule = "Trailing zeroes inside decimal fraction ARE significant.";
  else if (!hasDecimal && s.endsWith("0"))
    rule =
      "Trailing zeroes in an integer with no decimal are placeholder placeholders.";
  else rule = "All non-zero integers are naturally significant.";

  return { digits, count, rule, expPart };
}

function updateSigFig() {
  const input = document.getElementById("sfInput");
  if (!input) return;
  const val = input.value;
  const res = analyzeSigFigs(val);
  const breakdown = document.getElementById("sfBreakdown");
  if (!res) {
    if (breakdown) breakdown.innerHTML = "";
    document.getElementById("sfCount").textContent = "—";
    document.getElementById("sfExplain").textContent = "";
    return;
  }
  if (breakdown) {
    breakdown.innerHTML =
      res.digits
        .map((d) => {
          if (d.sig === "dot")
            return `<span style="color:var(--text-muted)">.</span>`;
          if (d.sig)
            return `<span style="color:var(--neon-green);text-shadow:0 0 8px var(--neon-green)">${d.c}</span>`;
          return `<span style="color:#444">${d.c}</span>`;
        })
        .join("") +
      (res.expPart
        ? `<span style="color:var(--neon-purple)">${res.expPart}</span>`
        : "");
  }
  document.getElementById("sfCount").textContent =
    res.count + " significant figure" + (res.count === 1 ? "" : "s");
  document.getElementById("sfExplain").textContent = "📖 Rule: " + res.rule;
}
const sfInput = document.getElementById("sfInput");
if (sfInput) {
  sfInput.addEventListener("input", updateSigFig);
  updateSigFig();
}

let sfOp = "add";
function setSfOp(op) {
  sfOp = op;
  document
    .querySelectorAll("#panel-sigfig .segmented button")
    .forEach((b, i) => {
      b.classList.toggle(
        "active",
        (op === "add" && i === 0) || (op === "mul" && i === 1),
      );
    });
  updateSfArith();
}
function countDecimals(s) {
  if (!s.includes(".")) return 0;
  return s.split(".")[1].length;
}
function updateSfArith() {
  const a = document.getElementById("sfA")?.value.trim() || "";
  const b = document.getElementById("sfB")?.value.trim() || "";
  const c = document.getElementById("sfC")?.value.trim() || "";
  const vals = [a, b, c].filter((v) => v !== "" && !isNaN(parseFloat(v)));
  if (vals.length < 2) {
    const resElem = document.getElementById("sfArithResult");
    if (resElem) resElem.textContent = "—";
    return;
  }
  const nums = vals.map(parseFloat);
  let result, targetDec, targetSf, steps;

  if (sfOp === "add") {
    result = nums.reduce((acc, curr) => acc + curr);
    targetDec = Math.min(...vals.map(countDecimals));
    const rounded = parseFloat(result.toFixed(targetDec));
    document.getElementById("sfArithResult").textContent = rounded;
    steps = `Raw Sum = ${result}\nSmallest Decimal Places = ${targetDec}\nRounded = ${rounded}`;
  } else {
    result = nums.reduce((acc, curr) => acc * curr);
    targetSf = Math.min(...vals.map((v) => analyzeSigFigs(v).count));
    const rounded = parseFloat(result.toPrecision(targetSf));
    document.getElementById("sfArithResult").textContent = rounded;
    steps = `Raw Product = ${result}\nSmallest Significant Figures = ${targetSf}\nRounded = ${rounded}`;
  }
  const stepsElem = document.getElementById("sfArithSteps");
  if (stepsElem) stepsElem.textContent = steps;
}
["sfA", "sfB", "sfC"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updateSfArith);
});
updateSfArith();

function updateUncertainty() {
  const vInput = document.getElementById("unV");
  const dxInput = document.getElementById("unDx");
  if (!vInput || !dxInput) return;
  const v = parseFloat(vInput.value);
  const dx = parseFloat(dxInput.value);
  if (isNaN(v) || isNaN(dx) || v === 0) {
    document.getElementById("unResult").textContent = "Enter valid numbers";
    return;
  }
  const frac = dx / Math.abs(v);
  const pct = frac * 100;
  document.getElementById("unResult").innerHTML =
    `Absolute Uncertainty: Δx = ${dx}\n` +
    `Fractional Uncertainty: Δx/x = ${dx}/${Math.abs(v)} = ${frac.toFixed(5)}\n` +
    `Percentage Uncertainty: (Δx/x) × 100 = ${pct.toFixed(3)}%\n` +
    `Interval: ${(v - dx).toFixed(3)} to ${(v + dx).toFixed(3)}`;
}
["unV", "unDx"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updateUncertainty);
});
updateUncertainty();

let cuOp = "+";
function setCuOp(op) {
  cuOp = op;
  document
    .querySelectorAll("#panel-uncert .segmented button")
    .forEach((b) => b.classList.remove("active"));
  document.querySelectorAll("#panel-uncert .segmented button").forEach((b) => {
    if (
      (op === "+" && b.textContent.includes("+")) ||
      (op === "-" && b.textContent.includes("−")) ||
      (op === "*" && b.textContent.includes("×")) ||
      (op === "/" && b.textContent.includes("÷"))
    )
      b.classList.add("active");
  });
  updateCu();
}
function updateCu() {
  const A = parseFloat(document.getElementById("cuA")?.value || "10");
  const dA = parseFloat(document.getElementById("cuDA")?.value || "0.5");
  const B = parseFloat(document.getElementById("cuB")?.value || "5");
  const dB = parseFloat(document.getElementById("cuDB")?.value || "0.2");
  if ([A, dA, B, dB].some(isNaN)) {
    document.getElementById("cuResult").textContent = "—";
    return;
  }
  let R, dR, steps;
  if (cuOp === "+") {
    R = A + B;
    dR = dA + dB;
    steps = `R = A + B = ${A} + ${B} = ${R}\nUncertainty: ΔR = ΔA + ΔB = ${dA} + ${dB} = ${dR}`;
  } else if (cuOp === "-") {
    R = A - B;
    dR = dA + dB;
    steps = `R = A − B = ${A} − ${B} = ${R}\nUncertainty: ΔR = ΔA + ΔB = ${dA} + ${dB} = ${dR}`;
  } else if (cuOp === "*") {
    R = A * B;
    const fA = dA / Math.abs(A),
      fB = dB / Math.abs(B);
    dR = Math.abs(R) * (fA + fB);
    steps = `R = A × B = ${A} × ${B} = ${R}\nFractional Uncertainties:\nΔA/A = ${fA.toFixed(4)}\nΔB/B = ${fB.toFixed(4)}\nΔR = R × (ΔA/A + ΔB/B) = ${dR.toFixed(4)}`;
  } else {
    R = A / B;
    const fA = dA / Math.abs(A),
      fB = dB / Math.abs(B);
    dR = Math.abs(R) * (fA + fB);
    steps = `R = A ÷ B = ${A} ÷ ${B} = ${R.toFixed(4)}\nFractional Uncertainties:\nΔA/A = ${fA.toFixed(4)}\nΔB/B = ${fB.toFixed(4)}\nΔR = R × (ΔA/A + ΔB/B) = ${dR.toFixed(4)}`;
  }
  document.getElementById("cuResult").textContent =
    `${R.toFixed(3)} ± ${dR.toFixed(3)}`;
  document.getElementById("cuSteps").textContent = steps;
}
["cuA", "cuDA", "cuB", "cuDB"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updateCu);
});
updateCu();

const convUnits = {
  length: [
    ["m", 1],
    ["cm", 0.01],
    ["mm", 0.001],
    ["km", 1000],
    ["inch", 0.0254],
    ["ft", 0.3048],
    ["mile", 1609.34],
    ["angstrom (Å)", 1e-10],
    ["light year", 9.461e15],
  ],
  mass: [
    ["kg", 1],
    ["g", 0.001],
    ["mg", 1e-6],
    ["tonne", 1000],
    ["lb", 0.453592],
    ["oz", 0.0283495],
    ["amu (u)", 1.66054e-27],
  ],
  time: [
    ["s", 1],
    ["ms", 0.001],
    ["µs", 1e-6],
    ["min", 60],
    ["hour", 3600],
    ["day", 86400],
    ["year", 3.1536e7],
  ],
  temp: [
    ["°C", "C"],
    ["K", "K"],
    ["°F", "F"],
  ],
  energy: [
    ["J", 1],
    ["kJ", 1000],
    ["cal", 4.184],
    ["kcal", 4184],
    ["eV", 1.602e-19],
    ["kWh", 3.6e6],
    ["erg", 1e-7],
  ],
  pressure: [
    ["Pa", 1],
    ["kPa", 1000],
    ["atm", 101325],
    ["bar", 100000],
    ["mmHg (torr)", 133.322],
    ["psi", 6894.76],
  ],
  force: [
    ["N", 1],
    ["kN", 1000],
    ["dyne", 1e-5],
    ["lbf", 4.44822],
  ],
  speed: [
    ["m/s", 1],
    ["km/h", 0.27778],
    ["mph", 0.44704],
    ["knot", 0.51444],
    ["c", 2.998e8],
  ],
};

function rebuildConvUnits() {
  const typeSelect = document.getElementById("convType");
  if (!typeSelect) return;
  const type = typeSelect.value;
  const from = document.getElementById("convFrom");
  const to = document.getElementById("convTo");
  from.innerHTML = "";
  to.innerHTML = "";
  convUnits[type].forEach((u, i) => {
    from.innerHTML += `<option value="${i}">${u[0]}</option>`;
    to.innerHTML += `<option value="${i}" ${i === 1 ? "selected" : ""}>${u[0]}</option>`;
  });
  updateConv();
}

function updateConv() {
  const typeSelect = document.getElementById("convType");
  if (!typeSelect) return;
  const type = typeSelect.value;
  const val = parseFloat(document.getElementById("convA").value);
  const fromIdx = parseInt(document.getElementById("convFrom").value);
  const toIdx = parseInt(document.getElementById("convTo").value);
  if (isNaN(val)) {
    document.getElementById("convB").value = "";
    return;
  }
  let result, steps;

  if (type === "temp") {
    const from = convUnits.temp[fromIdx][1],
      to = convUnits.temp[toIdx][1];
    let kelvin;
    if (from === "C") kelvin = val + 273.15;
    else if (from === "F") kelvin = ((val - 32) * 5) / 9 + 273.15;
    else kelvin = val;

    if (to === "C") result = kelvin - 273.15;
    else if (to === "F") result = ((kelvin - 273.15) * 9) / 5 + 32;
    else result = kelvin;
    steps = `${val} ${convUnits.temp[fromIdx][0]} → ${kelvin.toFixed(2)} K → ${convUnits.temp[toIdx][0]}`;
  } else {
    const fromFactor = convUnits[type][fromIdx][1];
    const toFactor = convUnits[type][toIdx][1];
    result = (val * fromFactor) / toFactor;
    steps = `${val} × ${fromFactor} / ${toFactor}`;
  }
  document.getElementById("convB").value = result
    .toPrecision(6)
    .replace(/\.?0+$/, "");
  document.getElementById("convResult").textContent =
    `${val} ${convUnits[type][fromIdx][0]} = ${result.toPrecision(6).replace(/\.?0+$/, "")} ${convUnits[type][toIdx][0]}`;
  document.getElementById("convSteps").textContent = steps;
}
["convA", "convFrom", "convTo"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updateConv);
});
rebuildConvUnits();

function updatePref() {
  const val = parseFloat(document.getElementById("prefVal").value);
  const from = parseInt(document.getElementById("prefFrom").value);
  const to = parseInt(document.getElementById("prefTo").value);
  if (isNaN(val)) {
    document.getElementById("prefResult").textContent = "—";
    return;
  }
  const result = val * Math.pow(10, from - to);
  const fromName = document
    .getElementById("prefFrom")
    .options[
      document.getElementById("prefFrom").selectedIndex
    ].text.split(" ")[0];
  const toName = document
    .getElementById("prefTo")
    .options[
      document.getElementById("prefTo").selectedIndex
    ].text.split(" ")[0];
  document.getElementById("prefResult").textContent =
    `${val} ${fromName} = ${result.toExponential(4).replace(/\.?0+e/, "e")} ${toName}`;
}
["prefVal", "prefFrom", "prefTo"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updatePref);
});
updatePref();

let snMode = "to";
function setSnMode(m) {
  snMode = m;
  document
    .querySelectorAll("#panel-scinot .segmented button")
    .forEach((b, i) => {
      b.classList.toggle(
        "active",
        (m === "to" && i === 0) || (m === "from" && i === 1),
      );
    });
  const input = document.getElementById("snInput");
  if (input) input.placeholder = m === "to" ? "0.0000456" : "4.56e-5";
  updateSn();
}
function updateSn() {
  const val = document.getElementById("snInput")?.value.trim();
  if (!val) {
    document.getElementById("snResult").textContent = "—";
    return;
  }
  if (snMode === "to") {
    const n = parseFloat(val);
    if (isNaN(n)) {
      document.getElementById("snResult").textContent = "Invalid";
      return;
    }
    if (n === 0) {
      document.getElementById("snResult").textContent = "0";
      return;
    }
    const exp = Math.floor(Math.log10(Math.abs(n)));
    const mantissa = n / Math.pow(10, exp);
    document.getElementById("snResult").textContent =
      `${mantissa.toPrecision(6).replace(/\.?0+$/, "")} × 10^${exp}`;
    document.getElementById("snSteps").textContent =
      `Decimal moved ${Math.abs(exp)} places → Exponent = ${exp}`;
  } else {
    const n = parseFloat(val);
    if (isNaN(n)) {
      document.getElementById("snResult").textContent = "Invalid Notation";
      return;
    }
    document.getElementById("snResult").textContent = n.toString();
    document.getElementById("snSteps").textContent =
      `Expanded Standard: ${val}`;
  }
}
const snInputElem = document.getElementById("snInput");
if (snInputElem) {
  snInputElem.addEventListener("input", updateSn);
  updateSn();
}

let snaOp = "+";
function setSnaOp(op) {
  snaOp = op;
  document
    .querySelectorAll(
      "#panel-scinot .controls-panel:nth-child(2) .segmented button",
    )
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(
      "#panel-scinot .controls-panel:nth-child(2) .segmented button",
    )
    .forEach((b) => {
      if (
        b.textContent === op ||
        (op === "-" && b.textContent === "−") ||
        (op === "*" && b.textContent === "×") ||
        (op === "/" && b.textContent === "÷")
      )
        b.classList.add("active");
    });
  updateSna();
}
function updateSna() {
  const a = parseFloat(document.getElementById("snA").value);
  const ae = parseInt(document.getElementById("snAe").value);
  const b = parseFloat(document.getElementById("snB").value);
  const be = parseInt(document.getElementById("snBe").value);
  if ([a, ae, b, be].some(isNaN)) {
    document.getElementById("snaResult").textContent = "—";
    return;
  }

  const A = a * Math.pow(10, ae);
  const B = b * Math.pow(10, be);
  let R;
  if (snaOp === "+") R = A + B;
  else if (snaOp === "-") R = A - B;
  else if (snaOp === "*") R = A * B;
  else R = A / B;

  if (R === 0) {
    document.getElementById("snaResult").textContent = "0";
    return;
  }
  const exp = Math.floor(Math.log10(Math.abs(R)));
  const mant = R / Math.pow(10, exp);
  document.getElementById("snaResult").textContent =
    `${mant.toPrecision(5).replace(/\.?0+$/, "")} × 10^${exp}`;
  document.getElementById("snaSteps").textContent =
    `(${a}×10^${ae}) ${snaOp} (${b}×10^${be})\n= ${A.toExponential(3)} ${snaOp} ${B.toExponential(3)}\n= ${R.toPrecision(6)}\n= ${mant.toPrecision(5).replace(/\.?0+$/, "")} × 10^${exp}`;
}
["snA", "snAe", "snB", "snBe"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updateSna);
});
updateSna();

// ===== Dimensions Lookup Matrices =====
const dimData = {
  length: { formula: "[L]", si: "m", explain: "Length scale" },
  mass: { formula: "[M]", si: "kg", explain: "Mass scale" },
  time: { formula: "[T]", si: "s", explain: "Time scale" },
  velocity: {
    formula: "[L T⁻¹]",
    si: "m s⁻¹",
    explain: "Velocity = [L] / [T]",
  },
  acceleration: {
    formula: "[L T⁻²]",
    si: "m s⁻²",
    explain: "Acceleration = [L T⁻¹] / [T]",
  },
  force: { formula: "[M L T⁻²]", si: "N", explain: "Force = [M] × [L T⁻²]" },
  work: {
    formula: "[M L² T⁻²]",
    si: "J",
    explain: "Work = Force × distance = [M L T⁻²] × [L]",
  },
  power: {
    formula: "[M L² T⁻³]",
    si: "W",
    explain: "Power = Work / time = [M L² T⁻²]/[T]",
  },
  pressure: {
    formula: "[M L⁻¹ T⁻²]",
    si: "Pa",
    explain: "Pressure = Force / Area = [M L T⁻²]/[L²]",
  },
  momentum: {
    formula: "[M L T⁻¹]",
    si: "kg m s⁻¹",
    explain: "Momentum = [M] × [L T⁻¹]",
  },
  frequency: { formula: "[T⁻¹]", si: "Hz", explain: "Frequency = 1 / [T]" },
  density: {
    formula: "[M L⁻³]",
    si: "kg m⁻³",
    explain: "Density = [M] / [L³]",
  },
  charge: {
    formula: "[I T]",
    si: "C",
    explain: "Charge = Current × Time = [I] × [T]",
  },
  voltage: {
    formula: "[M L² T⁻³ I⁻¹]",
    si: "V",
    explain: "Voltage = Work / Charge = [M L² T⁻²] / [I T]",
  },
};

function showDim() {
  const dimSelect = document.getElementById("dimSelect");
  if (!dimSelect) return;
  const key = dimSelect.value;
  const d = dimData[key];
  document.getElementById("dimResult").textContent = d.formula;
  document.getElementById("dimSteps").textContent =
    `SI Standard unit: ${d.si}\nDerivation: ${d.explain}`;
}
const dimSelectElem = document.getElementById("dimSelect");
if (dimSelectElem) {
  dimSelectElem.addEventListener("change", showDim);
  showDim();
}

function checkEq(eq) {
  const checks = {
    vut: {
      name: "v = u + at",
      lhs: "[L T⁻¹]",
      rhs: "[L T⁻¹] + [L T⁻²][T] = [L T⁻¹] + [L T⁻¹]",
      ok: true,
      note: "Homogeneous: [L T⁻¹] ✅",
    },
    s: {
      name: "s = ut + ½at²",
      lhs: "[L]",
      rhs: "[L T⁻¹][T] + [L T⁻²][T²] = [L] + [L]",
      ok: true,
      note: "Homogeneous: [L] ✅",
    },
    v2: {
      name: "v² = u² + 2as",
      lhs: "[L² T⁻²]",
      rhs: "[L² T⁻²] + [L T⁻²][L] = [L² T⁻²] + [L² T⁻²]",
      ok: true,
      note: "Homogeneous: [L² T⁻²] ✅",
    },
    ke: {
      name: "KE = ½mv²",
      lhs: "[M L² T⁻²]",
      rhs: "[M][L T⁻¹]² = [M L² T⁻²]",
      ok: true,
      note: "Homogeneous: energy standard J ✅",
    },
    pe: {
      name: "PE = mgh",
      lhs: "[M L² T⁻²]",
      rhs: "[M][L T⁻²][L] = [M L² T⁻²]",
      ok: true,
      note: "Homogeneous: energy standard J ✅",
    },
    emc2: {
      name: "E = mc²",
      lhs: "[M L² T⁻²]",
      rhs: "[M][L T⁻¹]² = [M L² T⁻²]",
      ok: true,
      note: "Homogeneous: [M L² T⁻²] ✅",
    },
    f: {
      name: "F = ma",
      lhs: "[M L T⁻²]",
      rhs: "[M][L T⁻²]",
      ok: true,
      note: "Homogeneous: matching forces ✅",
    },
    t2pi: {
      name: "T = 2π√(l/g)",
      lhs: "[T]",
      rhs: "√([L] / [L T⁻²]) = √[T²] = [T]",
      ok: true,
      note: "Homogeneous: matching standard seconds ✅",
    },
  };
  const c = checks[eq];
  if (!c) return;
  document.getElementById("eqCheckSteps").innerHTML =
    `📐 Equation: ${c.name}\nLHS Dimensions = ${c.lhs}\nRHS Dimensions = ${c.rhs}\n\n${c.ok ? "✅ DIMENSIONALLY HOMOGENEOUS" : "❌ NOT HOMOGENEOUS"}\n\nAnalysis: ${c.note}`;
}
