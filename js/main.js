/* ─────────────────────────────────────────────────────────────────────
   Grid Velocity — main.js
   Shared scripts for all pages.
   Lottie Web is loaded on demand when an animation container needs it.
───────────────────────────────────────────────────────────────────── */

/* ── GLOBAL A11Y PREFS — apply saved prefs on every page ─────────── */
(function applyA11yPrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem('gv-a11y-prefs') || '{}');
    const root = document.documentElement;
    ['large-text', 'high-contrast', 'reduce-motion', 'underline-links'].forEach(p => {
      if (prefs[p]) root.classList.add('a11y-' + p);
    });
  } catch (e) { /* ignore */ }
})();

/* ── LAZY LOTTIE LOADER ───────────────────────────────────────────── */
let gvLottiePromise = null;

function gvAssetPrefix() {
  const cssLink = document.querySelector('link[href*="css/main.css"]');
  return cssLink && cssLink.getAttribute('href').startsWith('../') ? '../' : '';
}

function loadLottieLibrary() {
  if (window.lottie) return Promise.resolve(window.lottie);
  if (gvLottiePromise) return gvLottiePromise;

  gvLottiePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-gv-lottie]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.lottie));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = gvAssetPrefix() + 'js/vendor/lottie-light.min.js';
    script.defer = true;
    script.dataset.gvLottie = 'true';
    script.onload = () => resolve(window.lottie);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return gvLottiePromise;
}

/* ── HERO ASTRONAUT LOTTIE — loads per-page animation into .ab-astro-lottie ── */
(function initHeroLotties() {
  const slots = document.querySelectorAll('.ab-astro-lottie[data-src]');
  if (!slots.length) return;

  loadLottieLibrary().then(() => slots.forEach(slot => {
    if (slot.dataset.loaded) return;
    const url = slot.dataset.src;
    slot.dataset.loaded = '1';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        lottie.loadAnimation({
          container: slot,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data,
        });
        slot.closest('.ab-painter')?.classList.add('has-lottie');
      })
      .catch(() => { /* keep static img as fallback */ });
  })).catch(() => { /* keep static img as fallback */ });
})();

/* ── SCALE TO VIEWPORT ─────────────────────────────────────────────── */
function scaleToFit() {
  const scaler = document.getElementById('scaler');
  if (!scaler) return;
  const vw = window.innerWidth || document.documentElement.clientWidth || 1440;
  if (vw < 1024) {
    /* Mobile/tablet: CSS handles layout — no JS scaling */
    scaler.style.transform = '';
    document.body.style.height = '';
    return;
  }
  const sc = Math.max(vw, 100) / 1440;
  scaler.style.transform = `scale(${sc})`;
  document.body.style.height = (scaler.offsetHeight * sc) + 'px';
}
scaleToFit();
window.addEventListener('load', scaleToFit);
window.addEventListener('resize', scaleToFit);
setTimeout(scaleToFit, 150);

/* ── NAV SCROLL (eyekiller-style smart hide/show) ──────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let lastY = 0;
  let downAccum = 0; // px scrolled downward since last upward movement
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    ticking = false;

    if (Math.abs(dy) < 1) return; // ignore micro-jitter from momentum scrolling

    if (y <= 60) {
      // Back at the top — transparent, full-width, always visible
      nav.classList.remove('scrolled', 'hidden');
      downAccum = 0;
      return;
    }

    // Past the hero — pill state active
    nav.classList.add('scrolled');

    if (dy > 0) {
      // Scrolling down: accumulate and hide after ~25% of viewport height scrolled continuously
      downAccum += dy;
      if (downAccum > window.innerHeight * 0.25) {
        nav.classList.add('hidden');
      }
    } else {
      // Any upward scroll — snap back immediately, reset accumulator
      downAccum = 0;
      nav.classList.remove('hidden');
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  });
})();

/* ── SCROLL REVEAL ─────────────────────────────────────────────────── */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  /* Late-reveal: fires only after 60% of the viewport has scrolled past */
  const obsLate = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('on'); obsLate.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40% 0px' });
  document.querySelectorAll('.reveal-late').forEach(el => obsLate.observe(el));
})();

/* ── HOMEPAGE SERVICE CARDS ───────────────────────────────────────── */
(function initHomeServiceCards() {
  const cards = [...document.querySelectorAll('.services .svc-card')];
  if (!cards.length) return;

  const touchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (!touchLike) return;

  cards.forEach(card => {
    card.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (link && card.classList.contains('is-open')) return;

      if (!card.classList.contains('is-open')) {
        event.preventDefault();
        cards.forEach(other => {
          if (other !== card) other.classList.remove('is-open');
        });
        card.classList.add('is-open');
      }
    });
  });

  document.addEventListener('click', event => {
    if (event.target.closest('.services .svc-card')) return;
    cards.forEach(card => card.classList.remove('is-open'));
  });
})();

/* ── LITEBOX-STYLE CARD BLOB ───────────────────────────────────────
   Exact replication of litebox.ai (values measured from their live DOM).

   STRUCTURE — each card image is split into a TOP half and a BOTTOM half.
   When BOTH halves round all four corners, the rounded inner corners meet
   at the waist and create two concave notches → the pinched peanut/blob.

   DESKTOP (hover-capable) — blob appears on HOVER:
       both halves round to max radius + card scales to 0.985. No scroll effect.
   TOUCH (mobile/tablet, no hover) — blob is SCROLL-DRIVEN:
       radius = clamp01((vh - cardCenter) / (vh*0.6)) * maxR, live on scroll.
       (Measured on litebox: card centred at 58% vh → 0.70·max; at top → max;
        below viewport → 0.) No scale on touch. */
(function initLbCards() {
  const HOV_SC   = 0.985;  /* card scale on hover (litebox: 0.9855) */
  const EASE     = 'cubic-bezier(.22,1,.36,1)';
  const TR       = `520ms ${EASE}`;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Max corner radius for a card — +20% rounder than litebox's ~70px.
     Caps at 84px, scales down on very small screens so the notch stays proportional. */
  function maxR(card) { return Math.min(84, card.offsetWidth * 0.192); }

  function buildHalves(url) {
    const top = document.createElement('div');
    const bot = document.createElement('div');
    top.className = 'lb-half lb-top';
    bot.className = 'lb-half lb-bot';
    top.style.backgroundImage = `url("${url}")`;
    bot.style.backgroundImage = `url("${url}")`;
    return { top, bot };
  }

  const items = [];
  const pending = [];

  function activateItem(item) {
    if (item.ready) return;

    if (item.kind === 'home') {
      const url = item.img.currentSrc || item.img.src;
      if (!url) return;
      const { top, bot } = buildHalves(url);
      item.thumb.appendChild(top);
      item.thumb.appendChild(bot);
      item.thumb.classList.add('lb-ready');
      item.top = top;
      item.bot = bot;
      item.scaleEl = item.thumb;
    } else {
      const bg = item.imgEl.style.backgroundImage || getComputedStyle(item.imgEl).backgroundImage;
      const url = (bg.match(/url\(["']?(.*?)["']?\)/) || [])[1];
      if (!url) return;
      const { top, bot } = buildHalves(url);
      item.imgEl.style.display = 'none';
      item.card.insertBefore(bot, item.card.firstChild);
      item.card.insertBefore(top, item.card.firstChild);
      item.top = top;
      item.bot = bot;
      item.scaleEl = item.card;
    }

    item.ready = true;
    items.push(item);
  }

  function enterItem(item) {
    activateItem(item);
    if (!item.ready) return;
    item.top.style.transition = `border-radius ${TR}`;
    item.bot.style.transition = `border-radius ${TR}`;
    item.scaleEl.style.transition = `transform ${TR}`;
    if (item.overlay) item.overlay.style.transition = `border-radius ${TR}`;
    applyBlob(item, 1, true);
  }

  function leaveItem(item) {
    if (!item.ready) return;
    applyBlob(item, 0, true);
  }

  /* Homepage featured cards (<img>) — prepare near viewport so lazy images stay lazy. */
  document.querySelectorAll('.work-card').forEach(card => {
    const thumb = card.querySelector('.work-thumb');
    const img   = card.querySelector('.work-thumb-img');
    if (!thumb || !img) return;
    const item = { kind: 'home', card, thumb, img };
    pending.push(item);
    if (canHover) {
      card.addEventListener('mouseenter', () => enterItem(item));
      card.addEventListener('mouseleave', () => leaveItem(item));
    }
  });

  /* Work page cards (background-image) */
  document.querySelectorAll('.wk-card').forEach(card => {
    const imgEl   = card.querySelector('.wk-card-img');
    const overlay = card.querySelector('.wk-card-overlay');
    if (!imgEl) return;
    const item = { kind: 'work', card, imgEl, overlay };
    pending.push(item);
    if (canHover) {
      card.addEventListener('mouseenter', () => enterItem(item));
      card.addEventListener('mouseleave', () => leaveItem(item));
    }
  });

  if (!pending.length) return;

  /* Apply blob amount (0..1) to one card. */
  function applyBlob(item, amt, withScale) {
    const r = amt * maxR(item.card);
    const v = r > 0.3 ? r.toFixed(1) + 'px' : '0';
    item.top.style.borderRadius = v;
    item.bot.style.borderRadius = v;
    if (item.overlay) item.overlay.style.borderRadius = v;
    if (withScale) {
      const sc = 1 - amt * (1 - HOV_SC);
      item.scaleEl.style.transform = amt > 0.001 ? `scale(${sc.toFixed(4)})` : '';
    }
  }

  let updateBlobCards = null;

  function prepareVisibleCards() {
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const item = pending.find(p => p.card === entry.target);
          if (item) activateItem(item);
          observer.unobserve(entry.target);
          if (!canHover && updateBlobCards) updateBlobCards();
        });
      }, { rootMargin: '900px 0px' });
      pending.forEach(item => obs.observe(item.card));
    } else {
      pending.forEach(activateItem);
    }
  }

  if (canHover) {
    prepareVisibleCards();
  } else {
    /* ── Touch: scroll-driven blob (live, no transition, no scale) ── */
    updateBlobCards = function update() {
      const vh = window.innerHeight;
      items.forEach(item => {
        item.top.style.transition = 'none';
        item.bot.style.transition = 'none';
        if (item.overlay) item.overlay.style.transition = 'none';
        const rect   = item.card.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const amt    = Math.max(0, Math.min(1, (vh - center) / (vh * 0.6)));
        applyBlob(item, amt, false);
      });
    };
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(() => { updateBlobCards(); ticking = false; }); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateBlobCards);
    prepareVisibleCards();
  }
})();

/* ── HERO (homepage only) ──────────────────────────────────────────── */
(function initHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  /* Wrap each character in .glyph-word spans for per-letter stagger */
  let i = 0;
  hero.querySelectorAll('.glyph-word').forEach(word => {
    const text = word.dataset.text || word.textContent;
    word.innerHTML = '';
    for (const ch of text) {
      if (ch === ' ') {
        const sp = document.createElement('span');
        sp.className = 'glyph-space';
        word.appendChild(sp);
      } else {
        const s = document.createElement('span');
        s.className = 'glyph';
        s.style.setProperty('--i', i++);
        s.textContent = ch;
        word.appendChild(s);
      }
    }
  });

  /* Mouse spotlight */
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });

  /* Entrance sequence */
  let astroAnim = null;

  function runHeroSequence() {
    setTimeout(() => hero.classList.add('lit'), 60);
    // Enable the per-letter hover pop-out only after the headline entrance
    // has settled, so a cursor resting on a letter during load can't pop it.
    setTimeout(() => hero.classList.add('hero-ready'), 1300);
    // Fall starts at 1600ms. Transition is 750ms (no overshoot) → lands at 2350ms.
    setTimeout(() => hero.classList.add('astro-fall'), 1600);
    setTimeout(() => {
      hero.classList.add('astro-landed');
      if (astroAnim) astroAnim.play();
    }, 2350);
  }

  /* Load the hero astronaut animation without adding Lottie to the critical path. */
  const astroSlot = document.getElementById('astroLottie');
  if (astroSlot) {
    loadLottieLibrary()
      .then(() => fetch(gvAssetPrefix() + 'assets/astronaut-original.json'))
      .then(r => r.json())
      .then(data => {
        astroAnim = lottie.loadAnimation({
          container: astroSlot,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          animationData: data
        });
      })
      .catch(() => {});
  }

  if (document.readyState === 'complete') runHeroSequence();
  else window.addEventListener('load', runHeroSequence);
})();

/* ── MOBILE NAV TOGGLE ─────────────────────────────────────────────── */
(function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  const nav    = document.getElementById('nav');
  if (!toggle || !drawer || !nav) return;

  /* Focusable elements inside the drawer */
  function getFocusable() {
    return Array.from(drawer.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
  }

  function openDrawer() {
    drawer.classList.add('open');
    nav.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    /* Move focus to the first item in the drawer */
    const first = getFocusable()[0];
    if (first) requestAnimationFrame(() => first.focus());
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    nav.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    /* Collapse services accordion on close */
    const svcItem = drawer.querySelector('.drawer-svc');
    const svcBtn  = drawer.querySelector('.drawer-svc-toggle');
    if (svcItem) svcItem.classList.remove('open');
    if (svcBtn)  svcBtn.setAttribute('aria-expanded', 'false');
    /* Return focus to the button that opened the drawer */
    toggle.focus();
  }

  toggle.addEventListener('click', () =>
    drawer.classList.contains('open') ? closeDrawer() : openDrawer()
  );

  /* Services accordion toggle */
  const svcToggle = drawer.querySelector('.drawer-svc-toggle');
  if (svcToggle) {
    svcToggle.addEventListener('click', () => {
      const svcItem  = svcToggle.closest('.drawer-svc');
      const isOpen   = svcItem.classList.toggle('open');
      svcToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* Close on any link click inside drawer */
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  /* Close on Escape — return focus to toggle */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  /* Focus trap: keep Tab/Shift+Tab cycling inside the open drawer */
  drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ── SHOWREEL ──────────────────────────────────────────────────────── */
(function initShowreel() {
  const overlay = document.getElementById('showreelOverlay');
  const wrap    = document.querySelector('.showreel-wrap');
  const frame   = document.getElementById('showreelFrame');
  const vid     = document.getElementById('showreelVid') || document.querySelector('.showreel-vid');
  if (!wrap) return;

  if (frame) {
    const previewSrc = frame.dataset.previewSrc || frame.src;
    const playSrc = frame.dataset.playSrc || frame.src;
    let playing = false;

    function loadPreview() {
      if (playing || frame.dataset.loaded === 'preview') return;
      frame.src = previewSrc;
      frame.dataset.loaded = 'preview';
    }

    function queuePreviewLoad() {
      if (!previewSrc) return;
      if (!('IntersectionObserver' in window)) {
        loadPreview();
        return;
      }
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        loadPreview();
        observer.disconnect();
      }, { rootMargin: '700px 0px' });
      observer.observe(wrap);
    }

    function setPreview() {
      playing = false;
      frame.src = previewSrc;
      frame.dataset.loaded = 'preview';
      wrap.classList.remove('is-playing');
      if (overlay) overlay.classList.remove('playing');
      wrap.setAttribute('aria-label', 'Play showreel');
    }

    function setPlaying() {
      playing = true;
      frame.src = playSrc;
      frame.dataset.loaded = 'play';
      wrap.classList.add('is-playing');
      if (overlay) overlay.classList.add('playing');
      wrap.setAttribute('aria-label', 'Pause showreel');
    }

    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('aria-label', 'Play showreel');
    wrap.addEventListener('mousemove', e => {
      const r = wrap.getBoundingClientRect();
      wrap.style.setProperty('--cursor-x', (e.clientX - r.left) + 'px');
      wrap.style.setProperty('--cursor-y', (e.clientY - r.top) + 'px');
    });
    wrap.addEventListener('click', () => playing ? setPreview() : setPlaying());
    wrap.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      playing ? setPreview() : setPlaying();
    });
    queuePreviewLoad();
    return;
  }

  const playBtn = document.getElementById('showreelPlay');
  if (!overlay || !playBtn || !vid) return;

  /* preview = true  → muted, looped ambient preview (default on load)
     preview = false → unmuted, full showreel playback                 */
  let preview = true;

  function goPreview() {
    preview        = true;
    vid.muted      = true;
    vid.loop       = true;
    overlay.classList.remove('playing');
    wrap.classList.remove('is-playing');
    playBtn.setAttribute('aria-label', 'Play showreel');
    vid.play().catch(() => {});
  }

  function goPlay() {
    preview         = false;
    vid.muted       = false;
    vid.loop        = false;
    vid.currentTime = 0;
    vid.play().catch(() => {});
    overlay.classList.add('playing');
    wrap.classList.add('is-playing');
    playBtn.setAttribute('aria-label', 'Pause showreel');
  }

  /* Click anywhere on the wrap (including through the transparent overlay) */
  wrap.addEventListener('click', function() {
    if (preview || vid.paused || vid.ended) {
      goPlay();
    } else {
      goPreview();
    }
  });

  /* When full playback ends, fall back to preview loop */
  vid.addEventListener('ended', function() {
    if (!preview) goPreview();
  });
})();

/* ── CASE STUDY VIDEO FRAMES — same Vimeo treatment as homepage ─────── */
(function initCaseVideoFrames() {
  document.querySelectorAll('.gv-video-frame').forEach(frameWrap => {
    const frame = frameWrap.querySelector('iframe[data-preview-src][data-play-src]');
    if (!frame) return;

    const previewSrc = frame.dataset.previewSrc;
    const playSrc = frame.dataset.playSrc;
    let playing = false;

    function loadPreview() {
      if (playing || frame.dataset.loaded === 'preview') return;
      frame.src = previewSrc;
      frame.dataset.loaded = 'preview';
    }

    function queuePreviewLoad() {
      if (!previewSrc) return;
      if (!('IntersectionObserver' in window)) {
        loadPreview();
        return;
      }
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        loadPreview();
        observer.disconnect();
      }, { rootMargin: '700px 0px' });
      observer.observe(frameWrap);
      window.setTimeout(loadPreview, 1800);
    }

    function preview() {
      playing = false;
      frame.src = previewSrc;
      frame.dataset.loaded = 'preview';
      frameWrap.classList.remove('is-playing');
      frameWrap.setAttribute('aria-label', frameWrap.dataset.playLabel || 'Play project video');
    }

    function play() {
      playing = true;
      frame.src = playSrc;
      frame.dataset.loaded = 'play';
      frameWrap.classList.add('is-playing');
      frameWrap.setAttribute('aria-label', frameWrap.dataset.pauseLabel || 'Pause project video');
    }

    frameWrap.setAttribute('role', 'button');
    frameWrap.setAttribute('tabindex', '0');
    frameWrap.addEventListener('click', () => playing ? preview() : play());
    frameWrap.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      playing ? preview() : play();
    });
    queuePreviewLoad();
  });
})();

/* ── RICH HERO PATTERN (about + service + blog + careers) ─────────── */
(function initRichHeroes() {
  const heroes = document.querySelectorAll('.ab-hero');
  if (!heroes.length) return;

  function syncStageTop(hero) {
    if (!hero.classList.contains('gv-hero-svc')) return;
    const cta = hero.querySelector('.ab-cta-row');
    if (!cta) return;
    const hr = hero.getBoundingClientRect();
    const cr = cta.getBoundingClientRect();
    hero.style.setProperty('--hero-stage-top', Math.round(cr.bottom - hr.top + 5) + 'px');
  }

  heroes.forEach(hero => {
    /* Split each headline line into per-letter glyph spans (continuous stagger) */
    let i = 0;
    hero.querySelectorAll('.ab-glyph-line').forEach(line => {
      const text = line.dataset.text || line.textContent;
      line.innerHTML = '';
      for (const ch of text) {
        if (ch === ' ') {
          const sp = document.createElement('span');
          sp.className = 'ab-glyph-space';
          line.appendChild(sp);
        } else {
          const s = document.createElement('span');
          s.className = 'ab-glyph';
          s.style.setProperty('--i', i++);
          s.textContent = ch;
          line.appendChild(s);
        }
      }
    });

    /* Entrance sequence: light up → astronaut lands → begins painting */
    const runSeq = () => {
      setTimeout(() => hero.classList.add('lit'),     60);
      setTimeout(() => hero.classList.add('painted'), 1000);
      setTimeout(() => syncStageTop(hero), 120);
    };
    if (document.readyState === 'complete') runSeq();
    else window.addEventListener('load', runSeq, { once: true });
    window.addEventListener('resize', () => syncStageTop(hero), { passive: true });

    /* Mouse spotlight */
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      hero.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });

    /* Mouse parallax — mascot drifts opposite to cursor for depth */
    const painter = hero.querySelector('.ab-painter');
    if (painter) {
      hero.addEventListener('mousemove', e => {
        const r  = hero.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - 0.5;
        const py = (e.clientY - r.top)  / r.height - 0.5;
        painter.style.setProperty('--par-x', (px * -26) + 'px');
        painter.style.setProperty('--par-y', (py * -18) + 'px');
      });
      hero.addEventListener('mouseleave', () => {
        painter.style.setProperty('--par-x', '0px');
        painter.style.setProperty('--par-y', '0px');
      });
    }
  });
})();

/* ── CTA Card Lotties (any page with ctaLaptop / ctaLevitate slots) ─── */
/* Lazy-loaded via IntersectionObserver — JSON only fetches when the CTA  */
/* section scrolls into view (saves ~200KB on initial page load).         */
(function initCtaLotties() {
  const prefix = gvAssetPrefix();

  function loadLottie(el, id) {
    if (el.dataset.loaded) return;
    el.dataset.loaded = '1';
    const url = prefix + (id === 'ctaLaptop' ? 'assets/astro-laptop.json' : 'assets/astro-levitate.json');
    loadLottieLibrary()
      .then(() => fetch(url))
      .then(r => r.json())
      .then(data => lottie.loadAnimation({ container: el, renderer: 'svg', loop: true, autoplay: true, animationData: data }))
      .catch(() => {});
  }

  const ids = ['ctaLaptop', 'ctaLevitate'];
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          loadLottie(entry.target, entry.target.id);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' }); /* start fetching 200px before entering viewport */
    ids.forEach(function(id) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  } else {
    /* Fallback for browsers without IO support */
    ids.forEach(function(id) {
      const el = document.getElementById(id);
      if (el) loadLottie(el, id);
    });
  }
})();

/* ── LOGO TICKER (homepage only) ───────────────────────────────────── */
(function initLogoTicker() {
  const strip = document.getElementById('logoStrip');
  if (!strip) return;
  const logos = [
    { src: 'assets/Home Page Client Logos/logo_01_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_02_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_03_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_04_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_05_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_06_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_07_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_08_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_10_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_11_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_12_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_13_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_14_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_15_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_16_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_18_black_156x99_27.svg', alt: 'Client logo' },
    { src: 'assets/Home Page Client Logos/logo_19_black_156x99_27.svg', alt: 'Client logo' }
  ];
  const row = logos
    .map(l => `<div class="logo-item"><img src="${l.src}" alt="${l.alt}" width="156" height="99" loading="lazy" onerror="this.parentNode.style.display='none'"></div>`)
    .join('');
  /* Wrap both copies in flex rows so they sit side-by-side inside the flex container.
     Second copy is purely visual (loop continuity) — hide from screen readers. */
  strip.innerHTML =
    `<div style="display:flex;align-items:center;flex-shrink:0;">${row}</div>` +
    `<div aria-hidden="true" style="display:flex;align-items:center;flex-shrink:0;">${row}</div>`;
})();

/* ── WORK FILTER (work page) ───────────────────────────────────────── */
(function initWorkFilter() {
  const bar   = document.querySelector('.wk-filters');
  const grid  = document.querySelector('.wk-grid');
  const empty = document.getElementById('wkEmpty');
  if (!bar || !grid) return;
  const cards = Array.from(grid.querySelectorAll('.wk-card'));
  const tabs  = Array.from(bar.querySelectorAll('.wk-filter'));

  function activateTab(btn) {
    tabs.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('tabindex', '-1');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');
    const cat = btn.dataset.filter;
    let visible = 0;
    cards.forEach(card => {
      const match = cat === 'all' || (card.dataset.category || '').split(' ').includes(cat);
      card.classList.remove('enter');
      if (match) {
        card.classList.remove('hide');
        void card.offsetWidth;
        card.classList.add('enter');
        visible++;
      } else {
        card.classList.add('hide');
      }
    });
    if (empty) empty.hidden = visible > 0;
  }

  /* Wire "See all work →" link inside empty state */
  if (empty) {
    const allLink = empty.querySelector('[data-filter="all"]');
    if (allLink) allLink.addEventListener('click', e => {
      e.preventDefault();
      const allTab = tabs.find(b => b.dataset.filter === 'all');
      if (allTab) { activateTab(allTab); allTab.focus(); }
    });
  }

  /* Set up roving tabindex — only active tab is in natural tab order */
  tabs.forEach((btn, i) => {
    btn.setAttribute('tabindex', btn.classList.contains('active') ? '0' : '-1');
    btn.addEventListener('click', () => { activateTab(btn); btn.focus(); });
  });

  /* Arrow key navigation between tabs (ARIA tablist pattern) */
  bar.addEventListener('keydown', e => {
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft')  next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home')       next = 0;
    if (e.key === 'End')        next = tabs.length - 1;
    if (next !== -1) {
      e.preventDefault();
      activateTab(tabs[next]);
      tabs[next].focus();
    }
  });
})();

/* ── SERVICE HERO (service pages) ──────────────────────────────────── */
(function initServiceHero() {
  const hero = document.querySelector('.sv-hero');
  if (!hero) return;
  requestAnimationFrame(() => hero.classList.add('lit'));
})();

/* ── PROCESS ACCORDION (service pages) ────────────────────────────── */
(function initProcessRows() {
  const list = document.querySelector('.sv-prow-list');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('.sv-prow'));

  /* ── Scroll-in entrance (line draw + title wipe) ── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('prow-in')) {
        entry.target.classList.add('prow-in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  rows.forEach(row => obs.observe(row));

  /* ── Accordion state ── */
  function setExpanded(row, open) {
    row.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* Open first row immediately */
  if (rows[0]) setExpanded(rows[0], true);

  rows.forEach(row => {
    row.addEventListener('click', () => {
      const isOpen = row.getAttribute('aria-expanded') === 'true';
      rows.forEach(r => setExpanded(r, false));   /* collapse all */
      if (!isOpen) setExpanded(row, true);         /* open clicked if it was closed */
    });

    /* Keyboard: Enter or Space toggles */
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });
  });
})();

/* ── FLOWER PROCESS scroll animation ──────────────────────────────────
   The site renders at a fixed 1440 design and stretches to the screen via a
   CSS `transform: scale()` on #scaler. A transformed ancestor breaks BOTH
   native `position: sticky` and any compositor-smooth pinning — so the old
   JS "manual sticky" (writing a transform every frame to chase the scroll)
   jittered on desktop, worst right as a step flipped.

   Fix — pin OUTSIDE the transform:
   • DESKTOP (≥1024px): portal the flower element out of #scaler into <body>
     and give it `position: fixed` + its own `scale()` so it looks identical
     but is pinned by the browser's compositor — zero per-frame JS, zero
     jitter. The (now-empty) scroll zone stays in #scaler as the scroll runway.
     JS only toggles the flower's visibility while the zone covers the viewport
     and advances the stroke/step (neither is position-critical).
   • MOBILE (<1024px): #scaler has no transform, so native `position: sticky`
     (set in CSS) already pins smoothly; the element stays in place.

   The active-step class is only rewritten when the index actually changes, so
   there's no per-frame style recalc. */
(function initFlowerProcess() {
  document.querySelectorAll('.sv-proc-flower-scroll').forEach(scrollZone => {
    const stickyEl = scrollZone.querySelector('.sv-proc-flower-sticky');
    const stroke   = scrollZone.querySelector('.sv-proc-stroke');
    const steps    = Array.from(scrollZone.querySelectorAll('.sv-proc-flower-step'));
    const nSteps   = steps.length;
    if (!stickyEl || !stroke || !nSteps) return;

    const homeParent = stickyEl.parentNode;            /* the scroll zone */
    const isMobile   = () => window.innerWidth < 1024;
    const getScale   = () => Math.max(window.innerWidth, 100) / 1440;

    let lastIdx = -1, lastStrokeShown = null, portaled = false, lastPinned = null;

    /* Move the flower to <body> (escaping #scaler's transform) so position:fixed
       pins it to the viewport. */
    function portal() {
      if (portaled) return;
      document.body.appendChild(stickyEl);
      stickyEl.classList.add('gv-flower-fixed');
      portaled = true; lastPinned = null;
    }
    /* Put it back inside the scroll zone for the mobile native-sticky path. */
    function unportal() {
      if (!portaled) return;
      homeParent.appendChild(stickyEl);
      stickyEl.classList.remove('gv-flower-fixed', 'is-pinned');
      stickyEl.style.width = '';
      stickyEl.style.height = '';
      stickyEl.style.transform = '';
      portaled = false; lastPinned = null;
    }

    function resize() {
      const scale   = getScale();
      const vhDesk  = window.innerHeight / scale;       /* viewport height in scaler coords */
      const vhMob   = window.innerHeight;
      if (isMobile()) {
        unportal();
        scrollZone.style.height = (nSteps * vhMob * 0.7 + vhMob * 0.4) + 'px';
      } else {
        portal();
        /* Size the body-level fixed flower to match the scaled 1440 design:
           width 1440 × scale = viewport width; height = viewport (after scale). */
        stickyEl.style.width = '1440px';
        stickyEl.style.height = vhDesk + 'px';
        stickyEl.style.transform = 'scale(' + scale + ')';
        scrollZone.style.height = (nSteps * vhDesk + vhDesk * 0.4) + 'px';
      }
    }

    function update() {
      const rect    = scrollZone.getBoundingClientRect();
      const viewH   = window.innerHeight;
      const maxV    = rect.height - viewH;
      const progress = Math.max(0, Math.min(1, (-rect.top) / Math.max(maxV, 1)));

      /* Stroke fill */
      stroke.style.strokeDashoffset = (1 - progress).toFixed(4);
      const shown = progress > 0.015;
      if (shown !== lastStrokeShown) { stroke.style.opacity = shown ? '1' : '0'; lastStrokeShown = shown; }

      /* Active step — only on change */
      const idx = Math.min(nSteps - 1, Math.floor(progress * nSteps + 0.008));
      if (idx !== lastIdx) {
        if (steps[lastIdx]) steps[lastIdx].classList.remove('active');
        steps[idx].classList.add('active');
        lastIdx = idx;
      }

      /* Desktop: reveal the fixed flower only while the zone covers the viewport
         (i.e. the section's dark backdrop fills the screen behind it). Pure
         opacity toggle — the pin itself is handled by position:fixed. */
      if (portaled) {
        const pinned = rect.top <= 1 && rect.bottom >= viewH - 1;
        if (pinned !== lastPinned) { stickyEl.classList.toggle('is-pinned', pinned); lastPinned = pinned; }
      }
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', () => { resize(); update(); }, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(() => { resize(); update(); }, 120), { passive: true });
    window.addEventListener('load', () => { resize(); update(); }, { passive: true });
    requestAnimationFrame(() => { resize(); update(); requestAnimationFrame(() => { resize(); update(); }); });
  });
})();

/* ── WHAT YOU GET hover interaction ───────────────────────────────── */
(function initWYG() {
  document.querySelectorAll('.sv-wyg-section').forEach(section => {
    const items = Array.from(section.querySelectorAll('.sv-wyg-item'));
    const imgs  = Array.from(section.querySelectorAll('.sv-wyg-panel-img'));
    if (!items.length) return;

    /* ── Mobile: create description container + progress bar ── */
    const layout = section.querySelector('.sv-wyg-layout');
    const mobileDesc = document.createElement('div');
    mobileDesc.className = 'sv-wyg-mobile-desc';
    layout.appendChild(mobileDesc);

    /* Progress bar — desktop: vertical alongside panel; mobile: horizontal between panel & desc */
    const progressWrap = document.createElement('div');
    progressWrap.className = 'wyg-progress-wrap';
    const progressBar = document.createElement('div');
    progressBar.className = 'wyg-progress-bar';
    progressWrap.appendChild(progressBar);
    const panel = section.querySelector('.sv-wyg-panel');
    if (panel) {
      panel.style.position = 'relative';
      panel.appendChild(progressWrap);
    }

    const isMobile = () => window.innerWidth < 1024;
    let activeIdx = 0;
    let autoTimer = null;
    const AUTO_DURATION = 4000; /* ms per tab */

    function activate(idx, userTapped) {
      activeIdx = idx;
      items.forEach((it, i) => it.classList.toggle('wyg-active', i === idx));
      imgs.forEach((img, i)  => img.classList.toggle('wyg-img-active', i === idx));
      /* Mobile description */
      const descInner = items[idx]?.querySelector('.sv-wyg-desc-inner');
      if (descInner) mobileDesc.textContent = descInner.textContent;
      /* Restart progress bar animation — vertical on desktop, horizontal on mobile */
      progressBar.style.animation = 'none';
      progressBar.offsetHeight; /* force reflow */
      var anim = isMobile() ? 'wygFillH' : 'wygFillV';
      progressBar.style.animation = anim + ' ' + AUTO_DURATION + 'ms linear forwards';
      /* Restart auto-advance timer */
      clearTimeout(autoTimer);
      autoTimer = setTimeout(advance, AUTO_DURATION);
    }

    function advance() {
      const next = (activeIdx + 1) % items.length;
      activate(next, false);
    }

    activate(0); /* first item active by default */

    items.forEach((item, i) => {
      item.addEventListener('mouseenter', () => { if (!isMobile()) activate(i, true); });
      item.addEventListener('click',      () => activate(i, true));
      item.addEventListener('focus',      () => activate(i, true));
    });

    /* Reset to first on list mouse-leave (desktop only) */
    const list = section.querySelector('.sv-wyg-list');
    if (list) {
      list.addEventListener('mouseleave', () => { if (!isMobile()) activate(0, false); });
      list.addEventListener('focusout', e => {
        if (!isMobile() && !list.contains(e.relatedTarget)) activate(0, false);
      });
    }
  });
})();

/* ── Tunable same-page smooth scroll ─────────────────────────────── */
(function initSmoothAnchors() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function duration() {
    const styles = getComputedStyle(document.documentElement);
    const key = window.innerWidth < 1024 ? '--gv-scroll-mobile-ms' : '--gv-scroll-desktop-ms';
    const raw = parseFloat(styles.getPropertyValue(key));
    return Number.isFinite(raw) ? raw : 800;
  }

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  window.gvSmoothScrollTo = function gvSmoothScrollTo(target, opts) {
    if (!target) return;
    const options = opts || {};
    if (prefersReduced.matches) {
      target.scrollIntoView({ block: options.block || 'start' });
      return;
    }
    const startY = window.scrollY;
    const rect = target.getBoundingClientRect();
    const top = rect.top + startY - (options.offset || 0);
    const distance = top - startY;
    const total = duration();
    const start = performance.now();

    function tick(now) {
      const p = Math.min(1, (now - start) / total);
      window.scrollTo(0, startY + distance * ease(p));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"], a[href*=".html#"]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    history.pushState(null, '', url.hash);
    window.gvSmoothScrollTo(target);
  });

  if (window.location.hash) {
    window.setTimeout(() => {
      const target = document.querySelector(window.location.hash);
      if (target) window.gvSmoothScrollTo(target);
    }, 120);
  }
})();

/* ── Service hero "See the Process" buttons ────────────────────────
   Raw hash jumps land awkwardly on the tall process section and can fail in
   the scaled layout. Scroll to the visible process header instead. */
(function initServiceProcessButtons() {
  const links = Array.from(document.querySelectorAll('a.hero-pill[href="#sv-process"]'));
  if (!links.length) return;

  links.forEach(link => {
    link.addEventListener('click', e => {
      const section = document.getElementById('sv-process');
      if (!section) return;
      const header = section.querySelector('.sv-proc-flower-header') || section;
      e.preventDefault();
      history.replaceState(null, '', '#sv-process');
      if (window.gvSmoothScrollTo) {
        window.gvSmoothScrollTo(header);
      } else {
        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

(function initClientsHover() {
  const section = document.querySelector('.sv-cl-section');
  if (!section) return;
  const list  = section.querySelector('.sv-cl-list');
  const items = Array.from(section.querySelectorAll('.sv-cl-item'));
  const imgs  = Array.from(section.querySelectorAll('.sv-cl-img'));
  if (!items.length || !imgs.length) return;

  function setActive(idx) {
    items.forEach((item, i) => item.classList.toggle('cl-active', i === idx));
    imgs.forEach((img,  i) => img.classList.toggle('cl-vis',    i === idx));
  }

  setActive(0); // first item visible by default — no dimming yet

  /* Track which item was last tapped (for browse-first on touch) */
  let lastTapped = -1;

  items.forEach((item, idx) => {
    /* Mouse hover */
    item.addEventListener('mouseenter', () => {
      list.classList.add('cl-live');
      setActive(idx);
    });
    /* Keyboard focus on the link inside the item — same as hover */
    const link = item.querySelector('a');
    if (link) {
      link.addEventListener('focus', () => {
        list.classList.add('cl-live');
        setActive(idx);
      });

      /* Touch: first tap previews; second tap on same item navigates */
      link.addEventListener('click', e => {
        const isTouch = window.matchMedia('(pointer: coarse)').matches;
        if (!isTouch) return; /* mouse users navigate normally */
        if (lastTapped !== idx) {
          /* First tap — show preview, prevent navigation */
          e.preventDefault();
          list.classList.add('cl-live');
          setActive(idx);
          lastTapped = idx;
        }
        /* Second tap on same item — allow navigation (default behaviour) */
      });
    }
  });

  function resetList() {
    list.classList.remove('cl-live');
    setActive(0);
    lastTapped = -1;
  }

  list.addEventListener('mouseleave', resetList);

  /* Reset when focus leaves the entire list */
  list.addEventListener('focusout', e => {
    if (!list.contains(e.relatedTarget)) resetList();
  });
})();

/* ── COOKIE CONSENT BANNER ─────────────────────────────────────────── */
(function initCookieBanner() {
  const KEY = 'gv_cookie_consent';
  if (localStorage.getItem(KEY)) return; /* already decided — skip */

  /* Resolve the cookies page path relative to current location */
  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  const cookiePage = depth <= 1 ? 'legal/cookies.html' : '../legal/cookies.html';

  const banner = document.createElement('div');
  banner.className = 'gv-cookie';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML =
    '<p class="gv-cookie-text">We use essential cookies to keep this site running and may use analytics cookies to understand how it\'s used. See our <a href="' + cookiePage + '">Cookie Policy</a>.</p>' +
    '<div class="gv-cookie-btns">' +
      '<button class="gv-cookie-btn gv-cookie-btn--essential" type="button" id="cookieEssential">Essentials Only</button>' +
      '<button class="gv-cookie-btn gv-cookie-btn--accept"    type="button" id="cookieAccept">Accept All</button>' +
    '</div>';
  document.body.appendChild(banner);

  /* Animate in after two rAF ticks (ensures layout has run) */
  requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('gv-cookie--visible')));

  function dismiss(val) {
    localStorage.setItem(KEY, val);
    banner.classList.remove('gv-cookie--visible');
    setTimeout(() => { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 460);
  }

  document.getElementById('cookieAccept').addEventListener('click',    () => dismiss('all'));
  document.getElementById('cookieEssential').addEventListener('click', () => dismiss('essential'));
})();

/* ── ABOUT: GSAP polish (about.html only) ──────────────────────────── */
(function initAboutGSAP() {
  const hero = document.getElementById('ab-hero');
  if (!hero) return;
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* 1) "Spray-paint the galaxy" — stagger objects into view as the astronaut sprays.
        Only opacity + blur are animated (transforms stay owned by the CSS idle anims). */
  const objs = Array.from(document.querySelectorAll('#ab-hero .ab-dot, #ab-hero .ab-saturn, #ab-hero .ab-streak'));
  if (hasGSAP && objs.length) {
    gsap.set(objs, { opacity: 0, filter: 'blur(7px)' });
    gsap.to(objs, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.55,
      ease: 'power2.out',
      stagger: { each: 0.06, from: 'random' },
      delay: 1.15
    });
  }

  /* 2) Stat count-up on scroll */
  if (hasGSAP && hasST) {
    Array.from(document.querySelectorAll('.ab-stat-val')).forEach(el => {
      const target = parseFloat(el.dataset.count || '0');
      if (!target) return;
      const state = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => gsap.to(state, {
          v: target,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(state.v); }
        })
      });
    });
  }

  /* 3) Network Roles — clean scroll-scrubbed astro travel.
     Astros settle in safe outer lanes first, then scrub toward the two “Us.”
     words as the reader leaves the crew section. Keep the math direct so the
     animation tracks the scroll instead of firing late/early. */
  var netRoles   = document.querySelector('.ab-net-roles');
  var supSection = document.querySelector('.ab-superpower');

  if (netRoles) {
    var anrLines  = netRoles.querySelectorAll('.anr-line');
    var anrLeft   = netRoles.querySelector('.anr-left');
    var wordEls   = Array.from(netRoles.querySelectorAll('.anr-word[data-img]'));
    var supWordEls = supSection ? Array.from(supSection.querySelectorAll('.ab-sup-word')) : [];
    var floWrap = document.createElement('div');
    floWrap.className = 'anr-floaters';
    floWrap.setAttribute('aria-hidden', 'true');

    var isMobile = window.innerWidth < 768;
    var SZ  = isMobile ? 58 : 104;
    var PCT = isMobile ? [
      { left:  1, top: 31, rot: -12 },
      { left: 76, top: 31, rot:  10 },
      { left:  2, top: 74, rot:  15 },
      { left: 76, top: 74, rot:  -7 },
      { left: 42, top: 11, rot: -13 },
      { left: 42, top: 84, rot:   8 },
      { left: 82, top: 54, rot:  16 }
    ] : [
      { left:  3, top: 11, rot: -12 },
      { left: 87, top: 11, rot:  10 },
      { left:  5, top: 69, rot:  15 },
      { left: 87, top: 68, rot:  -7 },
      { left: 15, top: 43, rot: -13 },
      { left: 75, top: 43, rot:   8 },
      { left: 47, top: 10, rot:  16 }
    ];

    var floaters = [];
    wordEls.forEach(function(word, i) {
      if (i >= PCT.length) return;
      var p = PCT[i];
      var el = document.createElement('img');
      el.className = 'anr-floater';
      el.src = word.dataset.img;
      el.alt = ''; el.loading = 'eager'; el.decoding = 'async';
      el.style.left   = p.left + '%';
      el.style.top    = p.top  + '%';
      el.style.width  = SZ + 'px';
      el.style.height = SZ + 'px';
      el.style.opacity = '1';
      el.style.transform = 'rotate(' + p.rot + 'deg)';
      floWrap.appendChild(el);
      floaters.push({ el: el, word: word, cfg: p });
    });
    netRoles.appendChild(floWrap);

    if (!hasGSAP) {
      anrLines.forEach(function(line) {
        line.style.opacity = '1';
        line.style.transform = 'none';
      });
      wordEls.forEach(function(word) {
        word.style.opacity = '1';
      });
      floaters.forEach(function(it) {
        it.el.style.opacity = '0.92';
        it.el.style.transform = 'rotate(' + it.cfg.rot + 'deg)';
      });
      return;
    }

    function anrAnimate() {
      if (anrLeft) gsap.from(anrLeft, { opacity: 0, y: 28, duration: 0.65, ease: 'power3.out' });

      if (isMobile) {
        /* display:contents lines have no box — animate word elements directly */
        var allAnrWords = netRoles.querySelectorAll('.anr-word');
        gsap.to(allAnrWords, { opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power3.out', delay: 0.1 });
      } else {
        gsap.to(anrLines, { opacity: 1, y: 0, duration: 0.85, stagger: 0.13, ease: 'power3.out', delay: 0.1 });
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        floaters.forEach(function(it) {
          gsap.set(it.el, { opacity: 1, scale: 1, rotate: it.cfg.rot });
        });
        return;
      }

      floaters.forEach(function(it, i) {
        var base = 0.18 + i * 0.12;
        gsap.to(it.word, { color: '#ffffff', duration: 0.28, delay: base, ease: 'power2.out' });
        gsap.to(it.word, { scale: 1.06, duration: 0.15, delay: base + 0.08,
                           ease: 'power2.out', yoyo: true, repeat: 1 });
        gsap.set(it.el, { opacity: 1, scale: 1, y: 0, rotate: it.cfg.rot });
      });
    }

    var anrStarted = false;
    function startAnr() {
      if (anrStarted) return;
      anrStarted = true;
      anrAnimate();
    }

    /* On mobile, .anr-line has display:contents — GSAP transforms don't
       apply on the wrapper; animate .anr-word elements directly instead. */
    if (isMobile) {
      gsap.set(wordEls, { opacity: 1 });
    } else {
      gsap.set(anrLines, { opacity: 1, y: 0 });
    }

    if ('IntersectionObserver' in window) {
      var anrObs = new IntersectionObserver(function(entries, obs) {
        if (entries[0].isIntersecting) { obs.disconnect(); startAnr(); }
      }, { threshold: 0.05 });
      anrObs.observe(netRoles);
      setTimeout(startAnr, 700);
      setTimeout(function() {
        var r = netRoles.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > window.innerHeight * 0.08) {
          anrObs.disconnect();
          startAnr();
        }
      }, 280);
    } else {
      gsap.set(anrLines, { opacity: 1, y: 0 });
      floaters.forEach(function(it) {
        gsap.set(it.el, { opacity: 1, scale: 1, rotate: it.cfg.rot });
      });
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && hasST && supWordEls.length) {
      var travelClones = [];
      var travPortal = document.createElement('div');
      travPortal.setAttribute('aria-hidden', 'true');
      travPortal.style.cssText =
        'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;' +
        'z-index:9980;pointer-events:none;';
      document.body.insertBefore(travPortal, document.body.firstChild);

      function lerp(a, b, t) { return a + (b - a) * t; }
      function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

      function clearTravel() {
        travelClones.forEach(function(tc) {
          if (tc && tc.el && tc.el.parentNode) tc.el.parentNode.removeChild(tc.el);
        });
        travelClones = [];
        floaters.forEach(function(it) { it.el.style.opacity = '1'; });
        supWordEls.forEach(function(el) { el.classList.remove('sup-absorbing'); });
      }

      function makeTravelClones() {
        clearTravel();
        floaters.forEach(function(it, i) {
          var fr = it.el.getBoundingClientRect();
          var size = Math.max(fr.width, fr.height) || SZ;
          var sx = fr.left + fr.width * 0.5;
          var sy = fr.top + fr.height * 0.5;
          var clone = document.createElement('img');
          clone.src = it.el.src;
          clone.alt = '';
          clone.style.cssText =
            'position:fixed;left:' + (sx - size * 0.5) + 'px;top:' + (sy - size * 0.5) + 'px;' +
            'width:' + size + 'px;height:' + size + 'px;object-fit:contain;opacity:1;' +
            'transform-origin:center;filter:drop-shadow(0 20px 36px rgba(0,0,0,0.45));';
          travPortal.appendChild(clone);
          it.el.style.opacity = '0';
          travelClones.push({ el: clone, sx: sx, sy: sy, size: size, rot: it.cfg.rot, targetIndex: i < 3 ? 0 : 1 });
        });
      }

      ScrollTrigger.create({
        trigger: netRoles,
        start: 'top 78%',
        endTrigger: supSection,
        end: 'top 42%',
        scrub: true,
        invalidateOnRefresh: true,
        onLeaveBack: clearTravel,
        onUpdate: function(self) {
          var travelStart = 0.38;
          if (self.progress < travelStart) {
            clearTravel();
            return;
          }
          if (!travelClones.length) makeTravelClones();
          var travelProgress = Math.max(0, Math.min(1, (self.progress - travelStart) / (1 - travelStart)));
          var active = travelClones.length || 1;
          travelClones.forEach(function(tc, i) {
            var target = supWordEls[tc.targetIndex] || supWordEls[0];
            var tr = target.getBoundingClientRect();
            var tx = tr.left + tr.width * 0.5;
            var ty = tr.top + tr.height * 0.5;
            var offset = active > 1 ? (i / (active - 1)) * 0.18 : 0;
            var fp = Math.max(0, Math.min(1, (travelProgress - offset) / (1 - offset)));
            var ep = easeOut(fp);
            var left = lerp(tc.sx, tx, ep) - tc.size * 0.5;
            var top = lerp(tc.sy, ty, ep) - tc.size * 0.5;
            var scale = lerp(1, 0.05, ep);
            var opacity = fp > 0.72 ? lerp(1, 0, (fp - 0.72) / 0.28) : 1;
            tc.el.style.left = left.toFixed(1) + 'px';
            tc.el.style.top = top.toFixed(1) + 'px';
            tc.el.style.opacity = opacity.toFixed(3);
            tc.el.style.transform = 'rotate(' + (tc.rot + ep * (i % 2 ? -210 : 210)).toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')';
          });
          if (travelProgress > 0.86) {
            supWordEls.forEach(function(el) { el.classList.add('sup-absorbing'); });
          } else {
            supWordEls.forEach(function(el) { el.classList.remove('sup-absorbing'); });
          }
        },
        onLeave: function() {
          supWordEls.forEach(function(el) { el.classList.add('sup-absorbing'); });
          setTimeout(clearTravel, 350);
        }
      });
    }
  }

  /* Team Swiper init */
  function initTeamSwiper() {
    if (typeof Swiper === 'undefined' || !document.querySelector('.ab-team-swiper')) return;
    new Swiper('.ab-team-swiper', {
      /* Mobile-first: one full card + a peek of the next to invite swiping.
         Scales up to the 4-up desktop layout via breakpoints. */
      slidesPerView: 1.15,
      spaceBetween: 16,
      loop: true,
      speed: 600,
      navigation: { nextEl: '.ab-swiper-next', prevEl: '.ab-swiper-prev' },
      breakpoints: {
        480:  { slidesPerView: 2,    spaceBetween: 16 },
        768:  { slidesPerView: 3,    spaceBetween: 20 },
        1024: { slidesPerView: 4,    spaceBetween: 24 },
      },
    });
  }
  if (typeof Swiper !== 'undefined') {
    initTeamSwiper();
  } else {
    window.addEventListener('load', initTeamSwiper, { once: true });
  }
})();


/* ═════════════════════════════════════════════════════════════════════
   ROUND-5 — GSAP hero animations (service / blog / careers concept stages)
═════════════════════════════════════════════════════════════════════ */
(function initHeroStages() {
  function whenReady(fn) {
    if (typeof gsap !== 'undefined') return fn();
    let tries = 0;
    const id = setInterval(() => {
      if (typeof gsap !== 'undefined' || ++tries > 50) { clearInterval(id); if (typeof gsap !== 'undefined') fn(); }
    }, 100);
  }

  whenReady(() => {
    /* ── BRANDING — colour-wall shuffle + interactive swap game ─── */
    const wall = document.getElementById('gvColorWall');
    if (wall) {
      const tiles = gsap.utils.toArray('#gvColorWall .gv-cw-tile');

      // Entrance animation
      tiles.forEach((tile, i) => {
        gsap.from(tile, { opacity: 0, scale: 0.4, rotate: -20, duration: 0.7, delay: 0.3 + i * 0.06, ease: 'back.out(1.6)' });
      });

      // Idle flip loop — pauses once user starts playing
      let flipPaused = false;
      const flipNext = () => {
        if (flipPaused) return;
        const t = tiles[Math.floor(Math.random() * tiles.length)];
        gsap.to(t, { rotateY: '+=360', duration: 1.2, ease: 'power3.inOut' });
      };
      gsap.delayedCall(1.6, () => { flipNext(); gsap.delayedCall(0, function loop() { flipNext(); gsap.delayedCall(2.2, loop); }); });

      // Subtle idle pulse — killed on first interaction
      const idleTween = gsap.to(tiles, { scale: 0.96, duration: 2, repeat: -1, yoyo: true, stagger: { each: 0.15, from: 'random' }, ease: 'sine.inOut', delay: 1.2 });

      // Hint — on mobile auto-hides after 4s; on desktop stays visible
      const hint = wall.querySelector('.brd-hint');
      const hideHint = () => hint && hint.classList.add('brd-hint-hide');
      if (hint && window.innerWidth < 1024) setTimeout(hideHint, 4000);

      // --- Swap game ---
      let selected = null;

      function getIdx(tile) { return tiles.indexOf(tile); }

      function isAdjacent(a, b) {
        const ai = getIdx(a), bi = getIdx(b);
        const dr = Math.abs(Math.floor(ai / 3) - Math.floor(bi / 3));
        const dc = Math.abs((ai % 3) - (bi % 3));
        return dr <= 1 && dc <= 1 && (dr + dc) !== 0; // orthogonal + diagonal
      }

      function getTileData(tile) {
        return {
          c:     tile.style.getPropertyValue('--c'),
          color: tile.style.color,
          label: tile.querySelector('span') ? tile.querySelector('span').textContent : ''
        };
      }

      function applyTileData(tile, d) {
        tile.style.setProperty('--c', d.c);
        tile.style.color = d.color;
        let sp = tile.querySelector('span');
        if (d.label) {
          if (!sp) { sp = document.createElement('span'); tile.appendChild(sp); }
          sp.textContent = d.label;
        } else if (sp) {
          sp.remove();
        }
      }

      function checkMatches() {
        const cols = tiles.map(t => t.style.getPropertyValue('--c').trim());
        const matched = new Set();
        for (let r = 0; r < 3; r++) {
          if (cols[r*3] && cols[r*3] === cols[r*3+1] && cols[r*3+1] === cols[r*3+2]) {
            [r*3, r*3+1, r*3+2].forEach(i => matched.add(i));
          }
        }
        for (let c = 0; c < 3; c++) {
          if (cols[c] && cols[c] === cols[c+3] && cols[c+3] === cols[c+6]) {
            [c, c+3, c+6].forEach(i => matched.add(i));
          }
        }
        matched.forEach(i => {
          const t = tiles[i];
          t.classList.add('brd-match');
          gsap.timeline()
            .to(t, { scale: 1.18, duration: 0.18, ease: 'back.out(2)' })
            .to(t, { scale: 1,    duration: 0.28, ease: 'power2.out' })
            .call(() => t.classList.remove('brd-match'));
        });
      }

      function swapTiles(a, b) {
        const aData = getTileData(a);
        const bData = getTileData(b);
        gsap.to([a, b], {
          scale: 0.82, duration: 0.14, ease: 'power2.in',
          onComplete: () => {
            applyTileData(a, bData);
            applyTileData(b, aData);
            gsap.to([a, b], { scale: 1, duration: 0.32, ease: 'back.out(1.8)' });
            checkMatches();
          }
        });
      }

      function deselect(tile) {
        tile.classList.remove('brd-selected');
        gsap.to(tile, { scale: 1, rotateY: 0, duration: 0.2, ease: 'power2.out' });
      }

      tiles.forEach(tile => {
        tile.addEventListener('click', () => {
          // First interaction — stop idle animations; hide hint on mobile only
          if (!flipPaused) {
            flipPaused = true;
            idleTween.kill();
            gsap.to(tiles, { scale: 1, duration: 0.3, ease: 'power2.out', overwrite: true });
            if (window.innerWidth < 1024) hideHint();
          }

          if (!selected) {
            selected = tile;
            tile.classList.add('brd-selected');
            gsap.to(tile, { scale: 1.1, duration: 0.2, ease: 'back.out(2)', overwrite: true });
          } else if (selected === tile) {
            deselect(tile);
            selected = null;
          } else {
            const prev = selected;
            deselect(prev);
            selected = null;
            swapTiles(prev, tile);
          }
        });
      });
    }

    /* ── VIDEO — three-strip cinema stage + projector play emblem ── */
    const film = document.getElementById('gvFilmStage');
    if (film) {
      const mainStrip  = document.getElementById('gvStripMain');
      const ghostA     = document.getElementById('gvStripA');
      const ghostB     = document.getElementById('gvStripB');
      const reelNum    = document.getElementById('gvReelNum');
      const npType     = document.getElementById('gvNpType');

      /* ── Main strip: clone frames for seamless infinite scroll ── */
      const frames = Array.from(mainStrip ? mainStrip.querySelectorAll('.gv-frame') : []);
      frames.forEach(f => mainStrip && mainStrip.appendChild(f.cloneNode(true)));
      const MAIN_H = 144;   // 128px frame + 16px gap
      const GHOST_A_H = 98; // 86px frame + 12px gap
      const GHOST_B_H = 78; // 68px frame + 10px gap
      const GHOST_COUNT = 12;

      if (mainStrip && frames.length) {
        gsap.to(mainStrip, { y: -(MAIN_H * frames.length), duration: frames.length * 1.5, ease: 'none', repeat: -1 });
      }

      /* ── Ghost strips: create frames, clone, animate at different speeds ── */
      function buildGhostStrip(el, count, H, duration) {
        if (!el) return;
        for (let i = 0; i < count; i++) {
          const d = document.createElement('div');
          d.className = 'gv-frame-ghost';
          el.appendChild(d);
        }
        Array.from(el.children).forEach(f => el.appendChild(f.cloneNode(true)));
        gsap.to(el, { y: -(H * count), duration, ease: 'none', repeat: -1 });
      }
      buildGhostStrip(ghostA, GHOST_COUNT, GHOST_A_H, GHOST_COUNT * 1.2);  // slower
      buildGhostStrip(ghostB, GHOST_COUNT, GHOST_B_H, GHOST_COUNT * 0.85); // faster

      /* ── Active frame cycling + reel counter update ── */
      let active = frames.findIndex(f => f.classList.contains('is-active'));
      if (active < 0) active = 0;
      setInterval(() => {
        if (!mainStrip) return;
        active = (active + 1) % frames.length;
        mainStrip.querySelectorAll('.gv-frame').forEach((f, i) =>
          f.classList.toggle('is-active', (i % frames.length) === active)
        );
        if (reelNum) reelNum.textContent = String(active + 1).padStart(2, '0');
      }, 1300);

      /* ── Now Playing type cycling ── */
      const types = ['Brand Film', 'DVC', 'Animation', 'CGI', 'Event Coverage', '3D Motion'];
      let typeIdx = 0;
      if (npType) {
        setInterval(() => {
          typeIdx = (typeIdx + 1) % types.length;
          gsap.to(npType, {
            opacity: 0, y: -6, duration: 0.28, ease: 'power2.in',
            onComplete() {
              npType.textContent = types[typeIdx];
              gsap.fromTo(npType,
                { opacity: 0, y: 7 },
                { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
              );
            }
          });
        }, 2600);
      }

      /* ── Play core entrance + breathing glow ── */
      gsap.from('#gvFilmStage .gv-play-core', { scale: 0.75, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.5 });
      gsap.to('#gvFilmStage .gv-play-core', {
        boxShadow: '0 0 70px rgba(239,72,35,0.4), 0 0 130px rgba(239,72,35,0.13), inset 0 0 32px rgba(239,72,35,0.12)',
        duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1
      });
    }

    /* ── WEBSITES — inner scroller + windows entrance ──────────── */
    const web = document.getElementById('gvWebStage');
    if (web) {
      gsap.from('#gvWebStage .gv-w-card-3', { x: -80, y: 60, rotate: -16, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.3 });
      gsap.from('#gvWebStage .gv-w-card-2', { x: -50, y: 40, rotate: -10, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.45 });
      gsap.from('#gvWebStage .gv-w-card-1', { y: 50, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.6 });

      // Infinite scroll inside the foreground card
      const scroll = web.querySelector('.gv-w-scroll');
      if (scroll) {
        const rows = Array.from(scroll.children);
        rows.forEach(r => scroll.appendChild(r.cloneNode(true)));
        const h = scroll.scrollHeight / 2;
        gsap.to(scroll, { y: -h, duration: 20, ease: 'none', repeat: -1 });
      }

      // Subtle "breath" on the stack
      gsap.to('#gvWebStage', { y: -6, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
    }

    /* ── PAID ADS — bars rise to staggered heights + KPI counter ── */
    const paid = document.getElementById('gvPaidStage');
    if (paid) {
      const bars = gsap.utils.toArray('#gvPaidStage .gv-paid-bars span');
      const heights = [0.28, 0.46, 0.36, 0.62, 0.78, 0.66, 0.86, 1.00, 0.92, 0.78, 0.60, 0.44];
      bars.forEach((b, i) => {
        gsap.to(b, { scaleY: heights[i] || 0.5, duration: 1.3, delay: 0.2 + i * 0.08, ease: 'power3.out' });
        // Subtle breathe after entrance
        gsap.to(b, { scaleY: (heights[i] || 0.5) * 1.04, duration: 2.4, delay: 2.6 + i * 0.12, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      });

      // KPI numbers count up
      gsap.utils.toArray('#gvPaidStage .gv-kpi-val span').forEach(el => {
        const from = parseFloat(el.dataset.from || '0');
        const to   = parseFloat(el.dataset.to   || '0');
        const isInt = Number.isInteger(to) && Number.isInteger(from);
        const obj = { v: from };
        gsap.to(obj, {
          v: to, duration: 1.6, delay: 0.6, ease: 'power2.out',
          onUpdate: () => { el.textContent = isInt ? Math.round(obj.v) : obj.v.toFixed(1); }
        });
      });
    }

    /* ── BLOG — cards drift (CSS keyframes handle the entrance) ─── */
    const blogStage = document.getElementById('gvBlogStage');
    if (blogStage) {
      const cards = gsap.utils.toArray('#gvBlogStage .gv-blog-card');
      cards.forEach((card, i) => {
        // Drift starts after CSS entrance animation completes (~1.6s)
        gsap.to(card, {
          y: -10, duration: 3 + i * 0.4, delay: 1.8 + i * 0.3,
          repeat: -1, yoyo: true, ease: 'sine.inOut'
        });
      });
    }

    /* ── CAREERS — pills bob (CSS keyframes handle the entrance) ── */
    const roleCloud = document.getElementById('gvRoleCloud');
    if (roleCloud) {
      const roles = gsap.utils.toArray('#gvRoleCloud .gv-role');
      roles.forEach((role, i) => {
        // Continuous floating starts after CSS entrance (~1.2s)
        gsap.to(role, {
          y: '+=' + (8 + Math.random() * 6),
          duration: 2.4 + Math.random() * 1.2,
          delay: 1.6 + i * 0.1,
          repeat: -1, yoyo: true, ease: 'sine.inOut'
        });
      });
      // Orange pulse
      const orange = roleCloud.querySelector('.gv-role.is-orange');
      if (orange) {
        gsap.to(orange, { scale: 1.06, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.8 });
      }
    }
  });
})();

/* ── CUSTOM CURSOR ─────────────────────────────────────────────────── */
/* Single filled circle, spring physics, GV Yellow #f0c133.           */
/* Mirrors serious.business cursor behaviour. Touch devices untouched. */
(function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  /* Wrapper (position-only) + dot (visible circle) */
  const wrap = document.createElement('div');
  const dot  = document.createElement('div');
  wrap.className = 'gv-cursor';
  dot.className  = 'gv-cursor-dot';
  wrap.appendChild(dot);
  document.body.appendChild(wrap);

  /* Spring physics — frame-rate independent so feel is consistent at any fps */
  var LERP   = 0.2;
  var BOUNCE = 0.65;
  var tx = 0, ty = 0;   /* target: raw mouse */
  var cx = 0, cy = 0;   /* current: spring-lerped */
  var vx = 0, vy = 0;   /* velocity */
  var started = false;
  var lastTs  = 0;

  document.addEventListener('mousemove', function(e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!started) {
      /* Snap on first move — no slide-in from 0,0 */
      cx = tx; cy = ty; vx = 0; vy = 0;
      wrap.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      wrap.classList.add('gv-show');
      started = true;
    }
  }, { passive: true });

  /* Spring RAF loop — delta-time normalised to 60 fps so physics feel
     identical whether the display runs at 30, 60, or 120 fps.          */
  (function loop(ts) {
    requestAnimationFrame(loop);
    if (!started) { lastTs = ts; return; }

    /* dt = frames elapsed since last tick; cap at 3 to ignore tab-switch gaps */
    var dt = lastTs ? Math.min((ts - lastTs) / 16.667, 3) : 1;
    lastTs = ts;

    var b = Math.pow(BOUNCE, dt);
    var l = 1 - Math.pow(1 - LERP, dt);
    vx = vx * b + (tx - cx) * l;
    vy = vy * b + (ty - cy) * l;
    cx += vx * dt;
    cy += vy * dt;

    /* Skip DOM write when cursor is essentially stationary */
    if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05 ||
        Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
      wrap.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
    }
  })(0);

  /* Elements where the circle grows on hover */
  var SEL = 'a, button, [role="button"], label, ' +
    '.hero-pill, .nav-cta, .sv-prow, .sv-cl-item, .work-card, ' +
    '.cta-card, .footer-wm-g, .logo-item, .wk-card, .glyph, ' +
    '.btn-dark, .btn-outline-white, .showreel-play-btn';

  /* Elements where cursor hides (equivalent to data-cursor="none") */
  var HIDE = 'input, textarea, select';

  document.addEventListener('mouseover', function(e) {
    if (!e.target.closest) return;
    if (e.target.closest(HIDE)) {
      wrap.classList.add('gv-none');
      wrap.classList.remove('gv-hov');
    } else if (e.target.closest(SEL)) {
      wrap.classList.add('gv-hov');
      wrap.classList.remove('gv-none');
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (!e.target.closest) return;
    if (e.target.closest(HIDE)) {
      wrap.classList.remove('gv-none');
    } else if (e.target.closest(SEL)) {
      wrap.classList.remove('gv-hov');
    }
  });

  /* Hide when pointer leaves the browser window */
  document.addEventListener('mouseleave', function() {
    wrap.classList.remove('gv-show');
  });
  document.addEventListener('mouseenter', function(e) {
    if (!started) return;
    /* Snap to re-entry position so circle doesn't slide in from old spot */
    tx = e.clientX; ty = e.clientY;
    cx = tx; cy = ty; vx = 0; vy = 0;
    wrap.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
    wrap.classList.add('gv-show');
  });
})();

/* ── FLOATING "LET'S TALK" BUBBLE ───────────────────────────────────
   Quarter-circle bubble fixed to bottom-right of every page except
   contact. Injected into <body> (outside #scaler) so it's unaffected
   by scale. Eyekiller-style shape + bounce-in animation.
───────────────────────────────────────────────────────────────────── */
(function initGVCTABubble() {
  'use strict';

  /* Skip on contact page */
  if (window.location.pathname.replace(/\/$/, '').replace(/\.html$/, '').split('/').pop() === 'contact') return;

  /* Resolve relative path to contact.html based on page depth */
  var parts  = window.location.pathname.split('/').filter(Boolean);
  var depth  = parts.length > 1 ? parts.length - 1 : 0;
  var prefix = depth > 0 ? new Array(depth + 1).join('../') : '';

  /* Speech bubble + smiley SVG — eyekiller icon with GV colours */
  var icon = '<svg class="gv-cta-icon" viewBox="0 0 66 67" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<path d="M52.3489 49.2379C54.0562 52.009 56.9734 54.2661 60.1475 54.9302C57.3867 55.9216 54.0837 56.4416 51.1835 55.9881C49.7113 55.7567 47.9329 55.634 46.5329 54.5838C42.0421 57.4803 35.5936 60.2168 30.5503 60.0506C25.0495 59.8691 19.1582 57.47 14.8235 54.1358C10.2527 50.6197 6.83779 45.5295 5.61234 39.8827C3.89757 31.9751 6.69075 23.3555 12.3779 17.6463C21.6053 8.37949 40.3828 4.82501 50.8786 18.5618C56.5419 25.9733 58.5811 36.4058 54.7654 45.1006C54.1273 46.5532 53.3116 47.9392 52.3489 49.2379Z" fill="#1c1a1d"/>'
    + '<path d="M52.7154 48.4492C54.1752 51.3565 56.8847 53.8555 59.9888 54.794C57.1513 55.5403 53.8119 55.7706 50.9611 55.0674C49.5131 54.709 47.75 54.4328 46.448 53.2652C41.7181 55.7574 35.049 57.922 30.0353 57.3186C24.5673 56.6594 18.9062 53.7595 14.8788 50.0633C10.6307 46.1664 7.67421 40.8011 6.9487 35.0727C5.93344 27.051 9.47586 18.7141 15.645 13.5235C25.6566 5.10102 44.6862 3.19499 53.9428 17.7834C58.9365 25.653 60.0529 36.2178 55.4861 44.5419C54.7232 45.9327 53.7875 47.2402 52.7154 48.4492Z" fill="#a2d0ce"/>'
    + '<path d="M6.26206 35.4908C5.51856 30.1516 6.76802 24.6776 9.38162 20.0093C11.6887 15.886 15.0981 12.511 19.1793 10.1697C22.6092 8.20026 26.4687 6.92658 30.3888 6.43704C34.4487 5.9296 38.6127 6.24928 42.4916 7.59389C46.6069 9.01979 50.2155 11.6283 52.9406 15.029C56.2213 19.1242 58.2543 24.2592 58.8894 29.4597C59.552 34.8873 58.6071 40.4863 55.9016 45.2523C55.2461 46.4059 54.4711 47.4859 53.6158 48.4983C55.0928 51.0968 57.4386 53.1667 60.297 54.0416C60.6076 54.1363 60.7623 54.562 60.7061 54.8558C60.6388 55.2056 60.4045 55.4864 60.0559 55.5766C58.1351 56.0789 56.1395 56.3233 54.1547 56.2781C52.3036 56.2365 50.4627 55.8476 48.6917 55.3241C47.8432 55.0734 47.0193 54.7124 46.31 54.1815C43.8868 55.4204 41.3338 56.4212 38.7165 57.1526C36.072 57.8906 33.2726 58.3787 30.5199 58.1704C27.6638 57.9557 24.8186 57.062 22.2252 55.8678C19.5677 54.6467 17.0589 53.0451 14.857 51.1142C10.2963 47.1142 7.10415 41.5316 6.26365 35.4882L6.26206 35.4908Z" fill="#1c1a1d"/>'
    + '<path d="M44.8369 34.4547C43.7622 38.4651 40.7037 41.5069 36.6556 42.5917C32.6074 43.6765 28.4376 42.5714 25.5014 39.6357C25.0376 39.172 25.0375 38.4201 25.5013 37.9564C25.9651 37.4925 26.7169 37.4926 27.1806 37.9562C29.5096 40.2849 32.8219 41.1602 36.0409 40.2976C39.2596 39.4351 41.6903 37.021 42.5429 33.8399C42.7126 33.2064 43.3638 32.8305 43.9973 33.0003C44.6308 33.1701 45.0067 33.8212 44.8369 34.4547ZM22.615 29.5707C22.2759 28.3052 23.0295 26.9998 24.2951 26.6607C25.5606 26.3216 26.866 27.0752 27.2051 28.3408C27.5442 29.6063 26.7905 30.9117 25.525 31.2508C24.2595 31.5899 22.9541 30.8363 22.615 29.5707ZM42.3042 24.295C42.6433 25.5605 41.8896 26.8659 40.6241 27.205C39.3586 27.5441 38.0532 26.7905 37.7141 25.5249C37.375 24.2594 38.1286 22.954 39.3942 22.6149C40.6597 22.2759 41.9651 23.0295 42.3042 24.295Z" fill="#a2d0ce"/>'
    + '</svg>';

  /* Main bubble wrapper */
  var el = document.createElement('div');
  el.id  = 'gvFloatCTA';
  el.className = 'gv-cta-bubble';
  el.innerHTML = '<a href="' + prefix + 'contact.html"'
    + ' aria-label="Contact Grid Velocity — Let\'s Talk">'
    + icon
    + '<div class="gv-bubble-text text-line1"><span>Let\'s</span></div>'
    + '<div class="gv-bubble-text text-line2"><span>Talk</span></div>'
    + '</a>';
  document.body.appendChild(el);

  /* Show on scroll — matches eyekiller: hidden until user scrolls past hero */
  var THRESHOLD = 220; /* px — roughly past the top nav + hero edge */
  var bubbleShown = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (!bubbleShown && y > THRESHOLD) {
      bubbleShown = true;
      el.classList.remove('is-hidden');
      el.classList.add('is-visible');
    } else if (bubbleShown && y <= THRESHOLD) {
      bubbleShown = false;
      el.classList.remove('is-visible');
      el.classList.add('is-hidden');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  /* Handle case where page loads already scrolled (anchor, back-nav) */
  if ((window.scrollY || window.pageYOffset) > THRESHOLD) onScroll();

  /* Hide bubble when footer enters the viewport */
  var footer = document.querySelector('footer');
  if (footer && 'IntersectionObserver' in window) {
    var footerObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        el.classList.toggle('footer-in-view', entry.isIntersecting);
      });
    }, { threshold: 0.05 });
    footerObs.observe(footer);
  }
})();

/* ── ACCESSIBILITY PANEL OVERLAY ────────────────────────────────────
   Full-screen panel triggered by .nav-a11y — same pattern as
   eyekiller.com. Injected into <body> on every page.
───────────────────────────────────────────────────────────────────── */
(function initA11yPanel() {
  'use strict';
  var KEY = 'gv-a11y-prefs';

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function savePrefs(p) { localStorage.setItem(KEY, JSON.stringify(p)); }
  function applyPrefs(p) {
    var root = document.documentElement;
    ['large-text', 'high-contrast', 'reduce-motion', 'underline-links'].forEach(function(k) {
      root.classList.toggle('a11y-' + k, !!p[k]);
    });
  }

  /* Resolve relative root path based on page depth */
  var parts  = window.location.pathname.split('/').filter(Boolean);
  var depth  = parts.length > 1 ? parts.length - 1 : 0;
  var prefix = depth > 0 ? new Array(depth + 1).join('../') : '';

  var CONTROLS = [
    { key: 'large-text',      label: 'Larger Text',     desc: 'Bumps every font size by ~12%' },
    { key: 'high-contrast',   label: 'High Contrast',   desc: 'Forces a high-contrast palette' },
    { key: 'reduce-motion',   label: 'Reduce Motion',   desc: 'Pauses animations and effects' },
    { key: 'underline-links', label: 'Underline Links', desc: 'Underlines all body links' }
  ];

  var rows = CONTROLS.map(function(c) {
    return '<div class="gv-a11y-panel-row">'
      + '<div><div class="gv-a11y-panel-row-label">' + c.label + '</div>'
      + '<div class="gv-a11y-panel-row-desc">' + c.desc + '</div></div>'
      + '<button type="button" class="a11y-toggle" data-pref="' + c.key + '" aria-pressed="false">'
      + '<span class="a11y-toggle-track"><span class="a11y-toggle-knob"></span></span>'
      + '<span class="a11y-toggle-label">Off</span>'
      + '</button>'
      + '</div>';
  }).join('');

  var html = '<div class="gv-a11y-panel" id="gvA11yPanel" role="dialog" aria-modal="true"'
    + ' aria-label="Accessibility preferences">'
    + '<button class="gv-a11y-close" id="gvA11yClose" aria-label="Close accessibility preferences">'
    + '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"'
    + ' stroke-width="2.5" stroke-linecap="round" aria-hidden="true">'
    + '<line x1="2" y1="2" x2="16" y2="16"/><line x1="16" y1="2" x2="2" y2="16"/></svg>'
    + '</button>'
    + '<div class="gv-a11y-panel-inner">'
    + '<h2 class="gv-a11y-panel-h">Accessibility<br>Preferences.</h2>'
    + '<p class="gv-a11y-panel-sub">Adjust the site to suit you. Your choices are saved on this device.</p>'
    + '<div class="gv-a11y-panel-controls" role="group" aria-label="Display preferences">' + rows + '</div>'
    + '<button type="button" class="gv-a11y-panel-reset" id="gvA11yReset">Reset all preferences</button>'
    + '<div class="gv-a11y-panel-links">'
    + '<a href="' + prefix + 'accessibility.html">Full statement</a>'
    + '<a href="' + prefix + 'contact.html">Get in touch</a>'
    + '</div>'
    + '</div>'
    + '</div>';

  document.body.insertAdjacentHTML('beforeend', html);

  var panel    = document.getElementById('gvA11yPanel');
  var closeBtn = document.getElementById('gvA11yClose');
  var resetBtn = document.getElementById('gvA11yReset');
  var lastFocus = null;

  /* Sync ALL .a11y-toggle on page (panel + accessibility page) to saved prefs */
  function syncToggles() {
    var p = loadPrefs();
    document.querySelectorAll('.a11y-toggle').forEach(function(btn) {
      var on = !!p[btn.dataset.pref];
      btn.setAttribute('aria-pressed', on);
      btn.classList.toggle('on', on);
      btn.querySelector('.a11y-toggle-label').textContent = on ? 'On' : 'Off';
    });
  }
  syncToggles();

  /* Global toggle click handler — covers panel AND static page toggles */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.a11y-toggle');
    if (!btn) return;
    var p = loadPrefs();
    p[btn.dataset.pref] = !p[btn.dataset.pref];
    savePrefs(p);
    applyPrefs(p);
    /* Update every toggle sharing this pref key */
    document.querySelectorAll('.a11y-toggle[data-pref="' + btn.dataset.pref + '"]').forEach(function(t) {
      var on = !!p[btn.dataset.pref];
      t.setAttribute('aria-pressed', on);
      t.classList.toggle('on', on);
      t.querySelector('.a11y-toggle-label').textContent = on ? 'On' : 'Off';
    });
  });

  /* Reset handler — handles panel (#gvA11yReset) and page (#a11yReset) */
  document.addEventListener('click', function(e) {
    if (e.target.closest('#gvA11yReset, #a11yReset')) {
      localStorage.removeItem(KEY);
      document.documentElement.className =
        document.documentElement.className.replace(/\ba11y-\S+/g, '').trim();
      syncToggles();
    }
  });

  /* Open */
  function openPanel() {
    lastFocus = document.activeElement;
    panel.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  /* Close */
  function closePanel() {
    panel.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus) { try { lastFocus.focus(); } catch(e) {} }
  }

  /* Intercept ALL .nav-a11y link clicks — works on every page */
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest('.nav-a11y');
    if (trigger) { e.preventDefault(); openPanel(); }
  });

  closeBtn && closeBtn.addEventListener('click', closePanel);

  /* Escape key */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
  });

  /* Click backdrop (panel itself, not inner content) */
  panel.addEventListener('click', function(e) {
    if (e.target === panel) closePanel();
  });
})();

/* ── CHARACTER-LEVEL PARAGRAPH REVEAL (litebox.ai style) ─────────────
   Splits paragraphs into individual character spans. Each paragraph maps
   its scroll progress (0 = bottom enters viewport → 1 = top exits) to
   how many characters are lit. No CSS transition — purely scroll-driven
   so the reveal is mechanically coupled to scroll speed, exactly like
   litebox.ai. Scrolling back dims characters again.
─────────────────────────────────────────────────────────────────────── */
(function initCharReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  /* Utility/secondary pages (careers, blog, blog articles, legal) opt out of
     the character-by-character scroll reveal entirely — plain solid text. */
  if (document.body.classList.contains('page-util')) return;

  /* Excluded containers — cards, service items, pricing, forms, chrome */
  var excluded =
    'nav, footer, form, .nav-drawer, .gv-cookie, .ct-note, ' +
    '.gv-cta-bubble, [aria-hidden="true"], .skip-link, ' +
    /* service/work cards and item blocks */
    '.sv-prow-body, .sv-wyg-item, .sv-deliver-item, ' +
    /* "How We Do It" flower section — no char-reveal on its intro/steps
       (.sv-proc-flower-sticky is portaled to <body> on desktop, so list it too) */
    '.sv-proc-flower-section, .sv-proc-flower-sticky, ' +
    /* Hero subtitles are above the fold — they'd start half-dim on load. The
       home hero has no subtitle <p>, so heroes stay solid there; match that on
       every page by excluding the hero lead paragraphs. */
    '.ab-sub, .ct-lead, .a11y-lead, .wk-hero-sub, ' +
    '[class*="-card"], [class*="-item"], [class*="-chip"], ' +
    /* CTA / services / logo zones */
    '.cta-section, .services, .logo-strip, ' +
    /* case study / work pages */
    '.cs-overview, .cs-results, ' +
    /* legal / accessibility pages */
    '.legal-body, .a11y-body';

  function eligible(p) {
    return p.textContent.trim().length >= 60 && !p.closest(excluded);
  }
  var paras = Array.from(document.querySelectorAll('p')).filter(function(p) {
    if (p.closest(excluded)) return false;
    if (p.textContent.trim().length >= 60) return true;
    /* Include a SHORT paragraph (e.g. a closing line like "It's not the
       traditional way. It's a better one.") only when it sits in the same
       block as a longer sibling paragraph that already reveals — so it stays
       consistent with its group, without making tiny standalone labels split. */
    if (p.textContent.trim().length >= 20 && p.parentElement) {
      var sibs = p.parentElement.children;
      for (var i = 0; i < sibs.length; i++) {
        if (sibs[i] !== p && sibs[i].tagName === 'P' && eligible(sibs[i])) return true;
      }
    }
    return false;
  });

  if (!paras.length) return;

  /* Split each paragraph into individual character spans */
  var items = paras.map(function(p) {
    var text  = p.textContent;
    var frag  = document.createDocumentFragment();
    var chars = [];

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ' || ch === '\n') {
        frag.appendChild(document.createTextNode(ch));
      } else {
        var s = document.createElement('span');
        s.className = 'rc';
        s.textContent = ch;
        frag.appendChild(s);
        chars.push(s);
      }
    }

    p.innerHTML = '';
    p.appendChild(frag);
    return { el: p, chars: chars };
  });

  var ticking = false;

  function update() {
    var vh = window.innerHeight;

    /* Reveal while the paragraph is comfortably in view. This keeps the
       Litebox-inspired effect readable instead of lighting copy as it exits. */
    items.forEach(function(item) {
      var rect     = item.el.getBoundingClientRect();
      var progress = (vh * 0.78 - rect.top) / (vh * 0.36);
      progress     = Math.max(0, Math.min(1, progress));
      var litCount = Math.round(progress * item.chars.length);

      for (var i = 0; i < item.chars.length; i++) {
        if (i < litCount) {
          item.chars[i].classList.add('rc-on');
        } else {
          item.chars[i].classList.remove('rc-on');
        }
      }
    });

    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  update();
})();

/* ═══════════════════════════════════════════════════════════════════════
   SITE-WIDE ENHANCEMENTS
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Smooth scroll ──────────────────────────────────────────────────────
   Change SMOOTH_SCROLL_MS to adjust how fast anchor links animate.      */
var SMOOTH_SCROLL_MS = 800;

(function () {
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var start = window.scrollY;
    var end   = target.getBoundingClientRect().top + window.scrollY;
    var diff  = end - start;
    var t0    = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / SMOOTH_SCROLL_MS, 1);
      window.scrollTo(0, start + diff * easeOutQuart(p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
})();

/* ── Viewport height (--vp-h) ───────────────────────────────────────────
   Desktop sections inside #scaler can't use 100vh directly because the
   scaler transform changes the visual size. This sets --vp-h to the
   equivalent of 100vh in scaler-pixel space so CSS min-height works.    */
(function () {
  function setVpH() {
    if (window.innerWidth < 1024) return; /* mobile uses svh natively */
    var scale = window.innerWidth / 1440;
    var vpH   = Math.round(window.innerHeight / scale);
    document.documentElement.style.setProperty('--vp-h', vpH + 'px');
  }
  setVpH();
  window.addEventListener('resize', setVpH, { passive: true });
})();


/* ═══════════════════════════════════════════════════════════════════
   EXPERIENCE UPGRADE — WAVE 1 — 2026-06-12 (dev branch)
   Page transitions · magnetic CTAs · velocity ticker · heading reveals
   All dependency-free (no GSAP requirement — homepage doesn't load it).
   ═══════════════════════════════════════════════════════════════════ */

function gvMotionOK() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
         !document.documentElement.classList.contains('a11y-reduce-motion');
}

/* ── PAGE TRANSITIONS ─────────────────────────────────────────────── */
(function initPageTransitions() {
  const docEl = document.documentElement;

  // Entrance: drop the curtain pseudo-elements once the reveal finishes.
  if (docEl.classList.contains('gv-in')) {
    setTimeout(() => docEl.classList.remove('gv-in'), 950);
  }

  if (!gvMotionOK()) return;

  let wipe = null;
  let leaving = false;

  document.addEventListener('click', e => {
    if (leaving || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;          // same-page anchor
    if (/\.(pdf|zip|jpe?g|png|webp|avif|svg|mp4|webm)(\?|$)/i.test(url.pathname)) return;

    e.preventDefault();
    leaving = true;
    if (!wipe) {
      wipe = document.createElement('div');
      wipe.className = 'gv-wipe';
      wipe.setAttribute('aria-hidden', 'true');
      wipe.innerHTML = '<span class="gv-wipe-a"></span><span class="gv-wipe-b"><span class="gv-wipe-mark">grid.</span></span>';
      document.body.appendChild(wipe);
    }
    // Two frames so the append registers before the animation class lands.
    requestAnimationFrame(() => requestAnimationFrame(() => wipe.classList.add('run')));
    try { sessionStorage.setItem('gv-nav', '1'); } catch (_) { /* ignore */ }
    setTimeout(() => { location.href = url.href; }, 560);
  });

  // BFCache restore (e.g. Safari back button): clear any stuck overlay state.
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return;
    leaving = false;
    docEl.classList.remove('gv-in');
    if (wipe) wipe.classList.remove('run');
  });
})();

/* ── MAGNETIC CTAs (desktop pointer only) ─────────────────────────── */
(function initMagneticCTAs() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (!gvMotionOK()) return;

  document.querySelectorAll('.nav-cta, .hero-pill, .btn-dark, .ct-submit, [data-magnetic]').forEach(el => {
    let tx = 0, ty = 0, cx = 0, cy = 0, ts = 1, cs = 1, raf = null;

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cs += (ts - cs) * 0.25;
      const settled = Math.abs(tx - cx) < 0.1 && Math.abs(ty - cy) < 0.1 && Math.abs(ts - cs) < 0.002;
      if (settled && tx === 0 && ty === 0 && ts === 1) {
        el.style.transform = '';                       // restore CSS-driven hover states at rest
        raf = null;
        return;
      }
      el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) scale(${cs.toFixed(3)})`;
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left - r.width / 2) * 0.28;
      ty = (e.clientY - r.top - r.height / 2) * 0.34;
      kick();
    });
    el.addEventListener('mouseleave', () => { tx = 0; ty = 0; ts = 1; kick(); });
    el.addEventListener('mousedown',  () => { ts = 0.96; kick(); });
    el.addEventListener('mouseup',    () => { ts = 1; kick(); });
  });
})();

/* ── LOGO TICKER: scroll-velocity skew ────────────────────────────── */
(function initTickerVelocity() {
  const strip = document.querySelector('.logo-strip');
  if (!strip || !gvMotionOK()) return;

  let lastY = window.scrollY, lastT = performance.now(), skew = 0, raf = null;

  const tick = () => {
    const now = performance.now();
    const y = window.scrollY;
    const dt = Math.max(now - lastT, 1);
    const v = (y - lastY) / dt;                        // px per ms
    lastY = y; lastT = now;
    const target = Math.max(-6, Math.min(6, -v * 8));
    skew += (target - skew) * 0.12;
    if (Math.abs(skew) < 0.05 && Math.abs(target) < 0.05) {
      strip.style.transform = '';
      raf = null;
      return;
    }
    strip.style.transform = `skewX(${skew.toFixed(2)}deg)`;
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener('scroll', () => {
    if (!raf) { lastY = window.scrollY; lastT = performance.now(); raf = requestAnimationFrame(tick); }
  }, { passive: true });
})();

/* ── MASKED HEADING REVEALS (site-wide, IO-driven) ────────────────── */
(function initHeadingReveals() {
  if (!gvMotionOK()) return;
  // About page has its own GSAP choreography — leave it alone.
  if (/about/.test(location.pathname)) return;

  const headings = Array.from(document.querySelectorAll('h2')).filter(h =>
    !h.closest('.reveal') &&
    !h.closest('nav') &&
    !h.closest('.nav-drawer') &&
    !h.closest('[role="dialog"]') &&
    !/a11y/.test(h.className)
  );
  if (!headings.length) return;

  const start = () => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('gv-on'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
    headings.forEach(h => obs.observe(h));
    // Failsafe: if IO is starved (throttled/background tab), never leave
    // an on-screen heading clipped.
    setTimeout(() => {
      headings.forEach(h => {
        if (h.classList.contains('gv-on')) return;
        const r = h.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) h.classList.add('gv-on');
      });
    }, 5000);
  };
  headings.forEach(h => h.classList.add('gv-h-rev'));
  // If arriving via a transition, let the curtain lift before revealing.
  setTimeout(start, document.documentElement.classList.contains('gv-in') ? 420 : 0);
})();

/* ── CONTACT GLOW: live WebGL aurora (no library) ─────────────────────
   Renders layered flowing noise in GV orange/purple inside .ct-glow.
   Low-res canvas upscaled + parent blur = soft, cheap. Falls back to the
   existing static gradient when WebGL/motion is unavailable. */
(function initContactAurora() {
  const host = document.querySelector('.ct-glow');
  if (!host || !gvMotionOK()) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'ct-glow-gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return;
  host.appendChild(canvas);

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `
precision mediump float;
uniform vec2 r;uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.1;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  vec2 q=uv*vec2(r.x/r.y,1.);
  float f1=fbm(q*1.6+vec2(t*.05,t*.03));
  float f2=fbm(q*2.2-vec2(t*.04,t*.06)+f1);
  float glow=smoothstep(.25,.95,f1*.6+f2*.55);
  vec3 orange=vec3(.937,.282,.137);
  vec3 purple=vec3(.333,.176,.455);
  vec3 col=mix(purple*.55,orange,smoothstep(.2,.85,f2));
  float vig=1.-smoothstep(.35,1.15,distance(uv,vec2(.42,.38)));
  float a=glow*vig*.85;
  gl_FragColor=vec4(col*a,a);
}`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const vs = shader(gl.VERTEX_SHADER, VERT);
  const fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r');
  const uT = gl.getUniformLocation(prog, 't');

  function size() {
    const w = Math.max(2, Math.round(host.clientWidth * 0.25));
    const hgt = Math.max(2, Math.round(host.clientHeight * 0.25));
    if (canvas.width !== w || canvas.height !== hgt) {
      canvas.width = w; canvas.height = hgt;
      gl.viewport(0, 0, w, hgt);
      gl.uniform2f(uR, w, hgt);
    }
  }

  let running = false, raf = null;
  const t0 = performance.now();
  function frame() {
    if (!running) { raf = null; return; }
    size();
    gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  function setRunning(on) {
    running = on;
    if (on && !raf) raf = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(en => setRunning(en[0].isIntersecting && !document.hidden), { rootMargin: '120px' });
  io.observe(host);
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden));
})();

/* ── SERVICE LANDING LEAD FORM ────────────────────────────────────────
   Service pages double as standalone landing pages: this submits their
   on-page enquiry form to /api/contact with the service pre-attributed. */
(function initServiceLeadForm() {
  const form = document.querySelector('.svl-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = form.querySelector('.ct-submit');
    const note = form.querySelector('.ct-note');

    const payload = {
      name:    (form.querySelector('[name="name"]').value    || '').trim(),
      email:   (form.querySelector('[name="email"]').value   || '').trim(),
      company: (form.querySelector('[name="company"]').value || '').trim(),
      services: (form.dataset.service || 'Service') + ' — service page enquiry',
      budget:   form.querySelector('[name="budget"]').value,
      message: (form.querySelector('[name="message"]').value || '').trim(),
      'cf-turnstile-response': (form.querySelector('[name="cf-turnstile-response"]') || {}).value || '',
    };

    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      const res  = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        btn.textContent = 'Sent — we\'ll be in touch soon';
        if (note) note.textContent = 'We reply within one business day.';
        form.reset();
        if (window.turnstile) window.turnstile.reset();
      } else {
        if (note) note.textContent = data.error || 'Something went wrong. Please try again.';
        btn.textContent = 'Start the Conversation';
        btn.disabled = false;
      }
    } catch (_) {
      if (note) note.textContent = 'Connection error — please try again or email hello@gridvelocity.com directly.';
      btn.textContent = 'Start the Conversation';
      btn.disabled = false;
    }
  });
})();

/* ── SHOWREEL SCALE-IN (homepage, scroll-linked) ──────────────────── */
(function initShowreelScale() {
  const wrap = document.getElementById('showreelWrap');
  if (!wrap || !gvMotionOK()) return;

  let raf = null;
  function update() {
    raf = null;
    const r = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -80 || r.top > vh + 80) return;       // offscreen: leave as-is
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
    wrap.style.transform = 'scale(' + (0.9 + 0.1 * p).toFixed(4) + ')';
    wrap.style.borderRadius = (36 * (1 - p)).toFixed(1) + 'px';
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  update();
})();

/* ── FOOTER WORDMARK ART: lazy-load the 1.2MB webp ────────────────── */
(function lazyFooterArt() {
  const el = document.querySelector('.footer-wm-g');
  if (!el) return;
  const io = new IntersectionObserver(en => {
    if (en[0].isIntersecting) { el.classList.add('gv-bg-loaded'); io.disconnect(); }
  }, { rootMargin: '600px' });
  io.observe(el);
})();
