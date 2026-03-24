/**
 * サポーターズチャレンジ エフェクト拡張 — 全12パターン対応
 * 対象: https://geek.supporterz.jp/apps/supporterz-challenge
 */

// ──────────────────────────────────────────────────
// BGM（bgm.wav をループ再生） + ミュートボタン
// ──────────────────────────────────────────────────
(function setupBGM() {
  const audio = document.createElement('audio');
  audio.src = chrome.runtime.getURL('bgm.wav');
  audio.loop = true;
  audio.volume = 0.4;

  // ページのユーザー操作後に自動再生（ブラウザポリシー対応）
  let started = false;
  function tryPlay() {
    if (started) return;
    started = true;
    audio.play().catch(() => { started = false; });
  }
  document.addEventListener('click', tryPlay, { once: false });
  document.addEventListener('keydown', tryPlay, { once: false });

  // ミュート / カラオケ切り替えボタン
  const btn = document.createElement('button');
  btn.textContent = '🔊';
  btn.title = 'BGM ミュート切り替え';
  Object.assign(btn.style, {
    position: 'fixed', bottom: '16px', right: '16px',
    zIndex: '2147483647', width: '44px', height: '44px',
    borderRadius: '50%', border: 'none',
    background: 'rgba(0,0,0,0.55)', color: '#fff',
    fontSize: '20px', cursor: 'pointer',
    lineHeight: '44px', textAlign: 'center', padding: '0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.muted = !audio.muted;
    btn.textContent = audio.muted ? '🔇' : '🔊';
    // ミュート解除時に再生開始されていなければ開始
    if (!audio.muted) tryPlay();
  });
  document.body.appendChild(btn);
})();

const RESULT_AREA_ID = 'gacha-result-area';
const REEL_COUNT = 6;

// パターン → エフェクト関数の対応表
const EFFECT_MAP = {
  'サポーターズ': launchSakura,       // 1. 桜吹雪（大当たり）
  'サポーターア': launchShock,        // 2. 衝撃 !?
  'サポータービ': launchAlmost,       // 3. 惜しい！虹が途切れる
  'サポーターン': launchZen,          // 4. 禅（墨汁が広がる和風）
  'サポーターＺ': launchThunder,      // 5. 稲妻フラッシュ
  'サポーターー': launchFire,         // 6. 炎が燃え上がる
  'サポータータ': launchRain,         // 7. 雨が降る
  'ズーターポサ': launchReverse,      // 8. 画面回転
  'ポッポーポー': launchBubbles,      // 9. 泡がぶくぶく
  'カツオーーー': launchFish,         // 10. 魚が泳ぐ
  'クサークサー': launchSmoke,        // 11. 緑の毒煙
  'ダーーーーー': launchImpact,       // 12. 元気ズーム衝撃波
};

// ──────────────────────────────────────────────────
// MutationObserver でガチャ結果エリアを監視
// ──────────────────────────────────────────────────
let animationTriggered = false;

const observer = new MutationObserver(() => {
  if (animationTriggered) return;
  const area = document.getElementById(RESULT_AREA_ID);
  if (!area) return;
  const cards = Array.from(area.children).filter(el => el.tagName === 'DIV');
  if (cards.length !== REEL_COUNT) return;

  const text = cards.map(el => el.innerText.trim()).join('');
  const effectFn = EFFECT_MAP[text];
  if (effectFn) {
    animationTriggered = true;
    setTimeout(() => effectFn(), 1600);
    setTimeout(() => { animationTriggered = false; }, 10000);
  }
});

function startObserving() {
  const area = document.getElementById(RESULT_AREA_ID);
  if (area) {
    observer.observe(area, { childList: true });
  } else {
    const bodyObs = new MutationObserver(() => {
      const a = document.getElementById(RESULT_AREA_ID);
      if (a) { bodyObs.disconnect(); observer.observe(a, { childList: true }); }
    });
    bodyObs.observe(document.body, { childList: true, subtree: true });
  }
}
startObserving();

// ──────────────────────────────────────────────────
// ユーティリティ
// ──────────────────────────────────────────────────
function createEffectCanvas(id) {
  const old = document.getElementById(id);
  if (old) old.remove();
  const c = document.createElement('canvas');
  c.id = id;
  Object.assign(c.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100vw', height: '100vh',
    zIndex: '2147483647', pointerEvents: 'none',
  });
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  c.width = window.innerWidth; c.height = window.innerHeight;
  const onResize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
  window.addEventListener('resize', onResize);
  return { canvas: c, ctx, cleanup: () => { c.remove(); window.removeEventListener('resize', onResize); } };
}

function runAnimation(id, duration, drawFn) {
  const { canvas, ctx, cleanup } = createEffectCanvas(id);
  const start = performance.now();
  (function loop(now) {
    const elapsed = now - start;
    const remaining = duration - elapsed;
    if (remaining <= 0) { cleanup(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fade = remaining < 1000 ? remaining / 1000 : 1;
    drawFn(ctx, canvas, elapsed, fade);
    requestAnimationFrame(loop);
  })(performance.now());
}

function showBigText(text, color, shadow, duration) {
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%) scale(0.3)',
    fontSize: '25vw', fontWeight: '900', color,
    textShadow: shadow, zIndex: '2147483647', pointerEvents: 'none',
    opacity: '1',
    transition: `transform 0.4s cubic-bezier(0.2,1.4,0.5,1), opacity ${duration * 0.6}ms ease ${duration * 0.3}ms`,
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transform = 'translate(-50%,-50%) scale(1)';
    el.style.opacity = '0';
  }));
  setTimeout(() => el.remove(), duration);
}

function showFlash(color, dur) {
  const f = document.createElement('div');
  Object.assign(f.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100vw', height: '100vh', background: color,
    zIndex: '2147483646', pointerEvents: 'none',
    opacity: '0.85', transition: `opacity ${dur}ms ease`,
  });
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = '0'; }));
  setTimeout(() => f.remove(), dur + 100);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ══════════════════════════════════════════════════
// 1. サポーターズ — 桜吹雪（大当たり！）
// ══════════════════════════════════════════════════
function launchSakura() {
  const PETAL_COUNT = 160;
  const pinks = ['#FFB7C5', '#FF9EBA', '#FFCDD8', '#FF85AA', '#FFC0CB', '#FFADC0'];
  let petals = [];
  runAnimation('fx-sakura', 6000, (ctx, canvas, elapsed, fade) => {
    if (petals.length === 0) {
      for (let i = 0; i < PETAL_COUNT; i++) petals.push({
        x: Math.random() * canvas.width, y: Math.random() * -canvas.height,
        size: 6 + Math.random() * 10, sy: 1.5 + Math.random() * 2.5,
        sx: (Math.random() - 0.5) * 1.5, angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08, sw: Math.random() * Math.PI * 2,
        swSpd: 0.03 + Math.random() * 0.02,
        color: pinks[Math.floor(Math.random() * pinks.length)],
      });
    }
    petals.forEach(p => {
      p.y += p.sy; p.sw += p.swSpd;
      p.x += p.sx + Math.sin(p.sw) * 1.2;
      p.angle += p.spin;
      if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.85 * fade; ctx.fill();
      ctx.restore();
    });
  });
}

// ══════════════════════════════════════════════════
// 2. サポーターア — 衝撃 !? 画面シェイク
// ══════════════════════════════════════════════════
function launchShock() {
  showFlash('#ff0000', 300);
  showBigText('!?', '#ff2222', '0 0 30px #f00, 0 0 60px #ff0', 2000);
  let t = 0;
  const shakeEnd = Date.now() + 1500;
  (function shake() {
    if (Date.now() > shakeEnd) { document.body.style.transform = ''; return; }
    t++;
    const x = Math.sin(t * 1.1) * 8 * Math.random();
    const y = Math.cos(t * 1.3) * 8 * Math.random();
    document.body.style.transform = `translate(${x}px,${y}px)`;
    requestAnimationFrame(shake);
  })();
}

// ══════════════════════════════════════════════════
// 3. サポータービ — 虹が途切れる（惜しい！）
// ══════════════════════════════════════════════════
function launchAlmost() {
  showBigText('惜しい!', '#ff69b4', '0 0 20px #fff', 2500);
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#00cc00', '#0088ff', '#8800ff', '#ff00ff'];
  runAnimation('fx-almost', 4000, (ctx, canvas, elapsed, fade) => {
    ctx.globalAlpha = fade;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const progress = Math.min(elapsed / 2000, 1);
    const breakAt = 0.75;
    colors.forEach((c, i) => {
      const r = 80 + i * 35;
      const endAngle = Math.PI * progress;
      if (progress > breakAt) {
        const crack = (progress - breakAt) / (1 - breakAt);
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(crack * 0.3); ctx.translate(-cx, -cy);
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r * (0.5 + progress * 1.5), Math.PI, Math.PI + endAngle);
      ctx.strokeStyle = c; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.globalAlpha = fade * (progress > breakAt ? 1 - (progress - breakAt) / (1 - breakAt) : 1);
      ctx.stroke();
      if (progress > breakAt) ctx.restore();
    });
    // 飛び散る破片
    if (progress > breakAt) {
      const frag = (progress - breakAt) / (1 - breakAt);
      for (let i = 0; i < 15; i++) {
        ctx.globalAlpha = fade * (1 - frag);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(
          cx + Math.sin(i * 2.4) * frag * 300,
          cy - 100 + Math.cos(i * 1.7) * frag * 200 + frag * 150, 8, 8);
      }
    }
  });
}

// ══════════════════════════════════════════════════
// 4. サポーターン — 禅（墨汁が広がる和風）
// ══════════════════════════════════════════════════
function launchZen() {
  showBigText('ン', '#222', '0 0 40px rgba(0,0,0,0.5)', 3000);
  const drops = [];
  runAnimation('fx-zen', 5000, (ctx, canvas, elapsed, fade) => {
    if (drops.length === 0) {
      for (let i = 0; i < 12; i++) drops.push({
        x: canvas.width * 0.2 + Math.random() * canvas.width * 0.6,
        y: canvas.height * 0.2 + Math.random() * canvas.height * 0.6,
        maxR: 30 + Math.random() * 80, delay: Math.random() * 2000,
      });
    }
    drops.forEach(d => {
      const t = Math.max(0, elapsed - d.delay);
      if (t <= 0) return;
      const p = Math.min(t / 2000, 1);
      const r = d.maxR * Math.sqrt(p);
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(30,30,30,${0.3 * (1 - p) * fade})`; ctx.fill();
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,0,0,${0.5 * (1 - p * 0.7) * fade})`;
      ctx.lineWidth = 2; ctx.stroke();
    });
  });
}

// ══════════════════════════════════════════════════
// 5. サポーターＺ — 稲妻フラッシュ + 火花
// ══════════════════════════════════════════════════
function launchThunder() {
  showFlash('#fff', 400);
  showBigText('Ｚ', '#00cfff', '0 0 40px #00f, 0 0 80px #0ff, 0 0 120px #fff', 1800);
  const sparks = [];
  const palette = ['#00cfff', '#ffffff', '#ffe600', '#00aaff', '#aaffff'];
  runAnimation('fx-thunder', 5000, (ctx, canvas, elapsed, fade) => {
    if (sparks.length === 0) {
      const cx = canvas.width / 2, cy = canvas.height / 2;
      for (let i = 0; i < 120; i++) {
        const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 8;
        sparks.push({
          x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0.8 + Math.random() * 0.6, decay: 0.012 + Math.random() * 0.018,
          size: 2 + Math.random() * 4, color: palette[Math.floor(Math.random() * 5)]
        });
      }
    }
    sparks.forEach(s => {
      s.x += s.vx; s.y += s.vy; s.vy += 0.15; s.vx *= 0.98; s.life -= s.decay;
      if (s.life <= 0) return;
      ctx.save(); ctx.globalAlpha = s.life * fade;
      ctx.shadowBlur = 10; ctx.shadowColor = s.color; ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  });
}

// ══════════════════════════════════════════════════
// 6. サポーターー — 炎が燃え上がる
// ══════════════════════════════════════════════════
function launchFire() {
  showBigText('🔥', 'transparent', '', 2000);
  const flames = [];
  runAnimation('fx-fire', 5000, (ctx, canvas, elapsed, fade) => {
    if (flames.length === 0) {
      for (let i = 0; i < 200; i++) flames.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 50,
        vy: -(2 + Math.random() * 5), vx: (Math.random() - 0.5) * 2,
        size: 4 + Math.random() * 12, life: 1,
        decay: 0.008 + Math.random() * 0.015,
      });
    }
    ctx.globalCompositeOperation = 'lighter';
    flames.forEach(f => {
      f.y += f.vy; f.x += f.vx + Math.sin(elapsed * 0.005 + f.x) * 0.8;
      f.life -= f.decay;
      if (f.life <= 0) {
        f.x = Math.random() * canvas.width; f.y = canvas.height + 10;
        f.life = 1; f.vy = -(2 + Math.random() * 5);
      }
      const t = 1 - f.life;
      const r = 255, g = Math.floor(100 + 155 * (1 - t)), b = Math.floor(50 * (1 - t));
      ctx.globalAlpha = f.life * fade * 0.7;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size * f.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  });
}

// ══════════════════════════════════════════════════
// 7. サポータータ — 雨が降る（残念…）
// ══════════════════════════════════════════════════
function launchRain() {
  showBigText('😢', 'transparent', '', 2000);
  const drops = [];
  runAnimation('fx-rain', 5000, (ctx, canvas, elapsed, fade) => {
    if (drops.length === 0) {
      for (let i = 0; i < 300; i++) drops.push({
        x: Math.random() * canvas.width * 1.2 - canvas.width * 0.1,
        y: Math.random() * -canvas.height,
        len: 10 + Math.random() * 20, speed: 8 + Math.random() * 12,
        opacity: 0.2 + Math.random() * 0.5,
      });
    }
    ctx.fillStyle = `rgba(0,0,30,${0.15 * fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drops.forEach(d => {
      d.y += d.speed; d.x -= d.speed * 0.15;
      if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width * 1.2; }
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * 0.15, d.y + d.len);
      ctx.strokeStyle = `rgba(150,180,255,${d.opacity * fade})`;
      ctx.lineWidth = 1.5; ctx.stroke();
    });
  });
}

// ══════════════════════════════════════════════════
// 8. ズーターポサ — 画面が回転（逆だったね…）
// ══════════════════════════════════════════════════
function launchReverse() {
  showBigText('↻', '#6644ff', '0 0 30px #88f', 2500);
  const dur = 3000;
  const start = performance.now();
  const body = document.body;
  const origTransition = body.style.transition;
  body.style.transition = 'none';
  (function spin() {
    const elapsed = performance.now() - start;
    if (elapsed > dur) {
      body.style.transform = ''; body.style.transition = origTransition; return;
    }
    const progress = elapsed / dur;
    const angle = 360 * easeInOutCubic(progress);
    const scale = 1 - 0.15 * Math.sin(progress * Math.PI);
    body.style.transform = `rotate(${angle}deg) scale(${scale})`;
    requestAnimationFrame(spin);
  })();
}

// ══════════════════════════════════════════════════
// 9. ポッポーポー — 泡がぶくぶく浮かぶ
// ══════════════════════════════════════════════════
function launchBubbles() {
  showBigText('🕊️', 'transparent', '', 2500);
  const bubbles = [];
  runAnimation('fx-bubbles', 5000, (ctx, canvas, elapsed, fade) => {
    if (bubbles.length === 0) {
      for (let i = 0; i < 80; i++) bubbles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        r: 8 + Math.random() * 30,
        speed: 1 + Math.random() * 3,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpd: 0.02 + Math.random() * 0.03,
        hue: 180 + Math.random() * 60,
      });
    }
    bubbles.forEach(b => {
      b.y -= b.speed; b.wobble += b.wobbleSpd;
      b.x += Math.sin(b.wobble) * 1.5;
      if (b.y < -b.r * 2) { b.y = canvas.height + b.r; b.x = Math.random() * canvas.width; }
      const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
      grad.addColorStop(0, `hsla(${b.hue},80%,90%,${0.5 * fade})`);
      grad.addColorStop(0.7, `hsla(${b.hue},60%,70%,${0.25 * fade})`);
      grad.addColorStop(1, `hsla(${b.hue},50%,60%,${0.05 * fade})`);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      // ハイライト
      ctx.beginPath(); ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.6 * fade})`; ctx.fill();
    });
  });
}

// ══════════════════════════════════════════════════
// 10. カツオーーー — 魚が泳ぐ
// ══════════════════════════════════════════════════
function launchFish() {
  showBigText('🐟', 'transparent', '', 2000);
  const fishes = [];
  runAnimation('fx-fish', 5000, (ctx, canvas, elapsed, fade) => {
    if (fishes.length === 0) {
      for (let i = 0; i < 25; i++) fishes.push({
        x: -50 - Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 3 + Math.random() * 6,
        size: 15 + Math.random() * 25,
        phase: Math.random() * Math.PI * 2,
        color: `hsl(${200 + Math.random() * 40}, 70%, ${40 + Math.random() * 30}%)`,
      });
    }
    ctx.globalAlpha = fade;
    fishes.forEach(f => {
      f.x += f.speed; f.phase += 0.08;
      const yOff = Math.sin(f.phase) * 20;
      if (f.x > canvas.width + 60) { f.x = -60; f.y = Math.random() * canvas.height; }
      ctx.save(); ctx.translate(f.x, f.y + yOff);
      // 体
      ctx.beginPath();
      ctx.ellipse(0, 0, f.size, f.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = f.color; ctx.fill();
      // 尾びれ
      ctx.beginPath();
      ctx.moveTo(-f.size, 0);
      ctx.lineTo(-f.size - f.size * 0.6, -f.size * 0.4);
      ctx.lineTo(-f.size - f.size * 0.6, f.size * 0.4);
      ctx.closePath(); ctx.fillStyle = f.color; ctx.fill();
      // 目
      ctx.beginPath(); ctx.arc(f.size * 0.5, -f.size * 0.1, f.size * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(f.size * 0.53, -f.size * 0.1, f.size * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.restore();
    });
  });
}

// ══════════════════════════════════════════════════
// 11. クサークサー — 緑の毒煙
// ══════════════════════════════════════════════════
function launchSmoke() {
  showBigText('🐛', 'transparent', '', 2000);
  const puffs = [];
  runAnimation('fx-smoke', 5000, (ctx, canvas, elapsed, fade) => {
    if (puffs.length === 0) {
      for (let i = 0; i < 60; i++) puffs.push({
        x: canvas.width * 0.3 + Math.random() * canvas.width * 0.4,
        y: canvas.height * 0.6 + Math.random() * canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 2, vy: -(0.5 + Math.random() * 2),
        r: 20 + Math.random() * 50, life: 1,
        decay: 0.003 + Math.random() * 0.006,
        hue: 80 + Math.random() * 60,
      });
    }
    puffs.forEach(p => {
      p.x += p.vx + Math.sin(elapsed * 0.002 + p.x * 0.01) * 0.5;
      p.y += p.vy; p.r += 0.3; p.life -= p.decay;
      if (p.life <= 0) {
        p.x = canvas.width * 0.3 + Math.random() * canvas.width * 0.4;
        p.y = canvas.height * 0.6 + Math.random() * canvas.height * 0.3;
        p.r = 20 + Math.random() * 50; p.life = 1;
        p.vy = -(0.5 + Math.random() * 2);
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},60%,35%,${p.life * 0.25 * fade})`; ctx.fill();
    });
  });
}

// ══════════════════════════════════════════════════
// 12. ダーーーーー — 元気ズーム衝撃波
// ══════════════════════════════════════════════════
function launchImpact() {
  showFlash('#ffe600', 250);
  showBigText('💥', 'transparent', '', 2000);
  runAnimation('fx-impact', 4000, (ctx, canvas, elapsed, fade) => {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const progress = Math.min(elapsed / 3000, 1);
    ctx.globalAlpha = fade;
    // 集中線
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const innerR = 50 + progress * 100;
      const outerR = Math.max(canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle + 0.03) * outerR, cy + Math.sin(angle + 0.03) * outerR);
      ctx.lineTo(cx + Math.cos(angle - 0.03) * outerR, cy + Math.sin(angle - 0.03) * outerR);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,${180 + Math.floor(Math.random() * 75)},0,${0.15 * fade})`;
      ctx.fill();
    }
    // 衝撃波リング
    for (let r = 0; r < 3; r++) {
      const rp = Math.max(0, progress - r * 0.15);
      const radius = rp * Math.max(canvas.width, canvas.height) * 0.7;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,200,0,${(1 - rp) * 0.6 * fade})`;
      ctx.lineWidth = 6 - r * 1.5; ctx.stroke();
    }
  });
}
