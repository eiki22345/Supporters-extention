/**
 * サポーターズチャレンジ 桜吹雪エフェクト
 * 対象: https://geek.supporterz.jp/apps/supporterz-challenge
 *
 * 結果エリア: <div id="gacha-result-area">
 * 各文字カード: その直下に動的追加される <div>（innerText に1文字）
 * 6枚のカードが同時追加され、揃い文字列が「サポーターズ」のとき発動
 */
const RESULT_AREA_ID = 'gacha-result-area'; // ガチャ結果エリアのid
const REEL_COUNT = 6;                   // リール枚数
const TARGET_TEXT = 'サポーターズ';       // 揃ったら発動する文字列

// ──────────────────────────────────────────────────
// ガチャ結果エリアの文字を読み取る
// ──────────────────────────────────────────────────
function readSlotText() {
  const area = document.getElementById(RESULT_AREA_ID);
  if (!area) return '';
  // 直接の子 div のテキストを順番に結合
  return Array.from(area.children)
    .filter(el => el.tagName === 'DIV')
    .map(el => el.innerText.trim())
    .join('');
}

// ──────────────────────────────────────────────────
// MutationObserver でガチャ結果エリアを監視
// ──────────────────────────────────────────────────
let animationTriggered = false;

const observer = new MutationObserver((mutations) => {
  if (animationTriggered) return;

  const area = document.getElementById(RESULT_AREA_ID);
  if (!area) return;

  // サイト内部のコードは6枚のカードを同時に appendChild するため、
  // 子 div が REEL_COUNT 枚揃った時点でテキストを確認する
  const cards = Array.from(area.children).filter(el => el.tagName === 'DIV');
  if (cards.length !== REEL_COUNT) return;

  const text = cards.map(el => el.innerText.trim()).join('');
  if (text === TARGET_TEXT) {
    animationTriggered = true;
    // 最後のカードのフリップアニメーション（約1.5秒）が終わってから発動
    setTimeout(() => launchSakura(), 1600);
    setTimeout(() => { animationTriggered = false; }, 10000);
  }
});

// ページ全体の子孫変化を監視（スロットが動的に生成される場合にも対応）
// gacha-result-area が存在すれば直接監視、なければ body を監視して動的生成を待つ
function startObserving() {
  const area = document.getElementById(RESULT_AREA_ID);
  if (area) {
    observer.observe(area, { childList: true });
  } else {
    // ページ初期化後に gacha-result-area が挿入されるまで待つ
    const bodyObserver = new MutationObserver(() => {
      const a = document.getElementById(RESULT_AREA_ID);
      if (a) {
        bodyObserver.disconnect();
        observer.observe(a, { childList: true });
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }
}
startObserving();


// ──────────────────────────────────────────────────
// 桜吹雪アニメーション
// ──────────────────────────────────────────────────
function launchSakura() {
  // 既存のCanvasがあれば削除
  const existing = document.getElementById('sakura-canvas');
  if (existing) existing.remove();

  // Canvas を body 最前面に挿入
  const canvas = document.createElement('canvas');
  canvas.id = 'sakura-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483647',      // 最前面
    pointerEvents: 'none',        // クリックを透過
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const DURATION_MS = 6000;       // アニメーション継続時間（ms）
  const PETAL_COUNT = 160;        // 花びらの枚数

  // ── 花びらクラス ──
  class Petal {
    constructor() { this.reset(true); }

    reset(initial = false) {
      const W = canvas.width;
      const H = canvas.height;
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * -H : -20;   // 最初は画面内にも分散
      this.size = 6 + Math.random() * 10;               // 6〜16px
      this.speedY = 1.5 + Math.random() * 2.5;            // 落下速度
      this.speedX = (Math.random() - 0.5) * 1.5;          // 横ドリフト
      this.angle = Math.random() * Math.PI * 2;          // 初期回転角
      this.spin = (Math.random() - 0.5) * 0.08;         // 回転速度
      this.swing = Math.random() * Math.PI * 2;          // ゆらぎの位相
      this.swingSpeed = 0.03 + Math.random() * 0.02;
      // 花びらの色：白桃〜ピンク系
      const pinks = ['#FFB7C5', '#FF9EBA', '#FFCDD8', '#FF85AA', '#FFC0CB', '#FFADC0'];
      this.color = pinks[Math.floor(Math.random() * pinks.length)];
    }

    update() {
      this.y += this.speedY;
      this.swing += this.swingSpeed;
      this.x += this.speedX + Math.sin(this.swing) * 1.2;
      this.angle += this.spin;
      if (this.y > canvas.height + 20) this.reset();
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // 花びら形状：楕円2枚を重ねてハート風に
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.55, this.size, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // 筋（中心線）
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(0, this.size);
      ctx.strokeStyle = 'rgba(255,150,170,0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    }
  }

  // ── Canvas サイズをウィンドウに合わせる ──
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── 花びら生成 ──
  const petals = Array.from({ length: PETAL_COUNT }, () => new Petal());

  // ── アニメーションループ ──
  const startTime = performance.now();
  let rafId;

  function animate(now) {
    const elapsed = now - startTime;
    const remaining = DURATION_MS - elapsed;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 終了フェードアウト（残り1秒でフェード）
    const alpha = remaining < 1000 ? remaining / 1000 : 1;
    ctx.globalAlpha = alpha;

    petals.forEach(p => { p.update(); p.draw(); });

    if (remaining > 0) {
      rafId = requestAnimationFrame(animate);
    } else {
      canvas.remove();
      window.removeEventListener('resize', resize);
    }
  }

  rafId = requestAnimationFrame(animate);
}
