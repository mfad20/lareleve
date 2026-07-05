/**
 * LA RELÈVE — Main JavaScript
 * Loader · GSAP Hero · Navbar · AOS · Vanilla Tilt · UI helpers
 */

/* ════════════════════════════════════════════════════
   0.  UTILITIES
   ════════════════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function lerp(a, b, t) { return a + (b - a) * t; }

/* ════════════════════════════════════════════════════
   1.  LOADER — une seule fois par session
   ════════════════════════════════════════════════════ */
(function initLoader() {
  const loader = $('#loader');
  if (!loader) return;

  // Déjà vu dans cette session → masquer immédiatement, lancer le hero
  if (sessionStorage.getItem('loaderSeen')) {
    loader.style.display = 'none';
    document.body.classList.remove('loading');
    triggerHeroAnimation();
    return;
  }

  const bar     = $('.loader-bar');
  const percent = $('.loader-percent');
  const logo    = $('.loader-logo');
  const title   = $('.loader-title');

  let prog = 0;
  const TARGET = 100;

  function step() {
    const remaining = TARGET - prog;
    prog += Math.max(0.4, remaining * 0.04);
    if (prog >= TARGET) prog = TARGET;

    if (bar)     bar.style.width     = prog + '%';
    if (percent) percent.textContent = Math.floor(prog) + '%';

    if (prog < TARGET) {
      requestAnimationFrame(step);
    } else {
      setTimeout(dismissLoader, 350);
    }
  }

  function dismissLoader() {
    sessionStorage.setItem('loaderSeen', '1');
    if (typeof gsap !== 'undefined') {
      gsap.to(loader, {
        opacity: 0,
        duration: 0.7,
        ease: 'power2.inOut',
        onComplete: () => {
          loader.style.display = 'none';
          document.body.classList.remove('loading');
          triggerHeroAnimation();
        },
      });
    } else {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.7s';
      setTimeout(() => {
        loader.style.display = 'none';
        document.body.classList.remove('loading');
        triggerHeroAnimation();
      }, 700);
    }
  }

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(logo,  { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)' });
    gsap.fromTo(title, { opacity: 0, y: 12 },       { opacity: 1, y: 0,     duration: 0.5, delay: 0.3, ease: 'power2.out' });
  }

  setTimeout(() => requestAnimationFrame(step), 200);
})();


/* ════════════════════════════════════════════════════
   2.  HERO ANIMATION (triggered after loader)
   ════════════════════════════════════════════════════ */
function triggerHeroAnimation() {
  if (typeof gsap === 'undefined') return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Badge
  tl.fromTo('.hero-badge',
    { opacity: 0, y: -20, scale: 0.85 },
    { opacity: 1, y: 0, scale: 1, duration: 0.6 }, 0
  );

  // "LA"
  tl.fromTo('.hero-la',
    { opacity: 0, x: -60, y: 0, skewX: -6 },
    { opacity: 1, x: 0, y: 0, skewX: 0, duration: 0.8 }, 0.15
  );

  // "RELÈVE"
  tl.fromTo('.hero-releve',
    { opacity: 0, x: 60, y: 0, skewX: 6 },
    { opacity: 1, x: 0, y: 0, skewX: 0, duration: 0.8 }, 0.15
  );

  // Slogan
  tl.fromTo('.hero-slogan',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6 }, 0.6
  );

  // Sub-text
  tl.fromTo('.hero-sub',
    { opacity: 0, y: 15 },
    { opacity: 1, y: 0, duration: 0.5 }, 0.75
  );

  // CTA buttons
  tl.fromTo('.hero-actions',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5 }, 0.9
  );

  // Meta stats
  tl.fromTo('.hero-meta-item',
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, 1.1
  );

  // Scroll hint
  tl.fromTo('.scroll-hint',
    { opacity: 0 },
    { opacity: 1, duration: 0.4 }, 1.4
  );

  // ScrollTrigger section reveals
  initScrollTrigger();
}


/* ════════════════════════════════════════════════════
   3.  SCROLL TRIGGER SECTION REVEALS
   ════════════════════════════════════════════════════ */
function initScrollTrigger() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // Generic fade-up for sections
  $$('.section-header, .vision-card, .valeur-card, .chiffre-card, .innovation-card').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });

  // Stagger card groups
  ['.valeurs-grid', '.innovations-grid', '.preview-grid', '.chiffres-grid'].forEach((grid) => {
    const container = $(grid);
    if (!container) return;
    const cards = $$(':scope > *', container);
    if (!cards.length) return;

    ScrollTrigger.create({
      trigger: container,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo(cards,
          { opacity: 0, y: 50, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
        );
      },
    });
  });

  // Programme preview line
  const progLine = $('.programme-preview-line');
  if (progLine) {
    gsap.fromTo(progLine,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: progLine, start: 'top 90%', once: true },
      }
    );
  }
}


/* ════════════════════════════════════════════════════
   4.  NAVBAR
   ════════════════════════════════════════════════════ */
(function initNavbar() {
  const navbar = $('.navbar') || $('nav');
  if (!navbar) return;

  let lastY = 0;

  function handleScroll() {
    const y = window.scrollY;

    // Add scrolled class after 60px
    navbar.classList.toggle('scrolled', y > 60);

    // Hide on scroll-down, show on scroll-up
    if (y > 200) {
      navbar.classList.toggle('navbar-hidden', y > lastY + 5);
      navbar.classList.toggle('navbar-visible', y < lastY - 5);
    } else {
      navbar.classList.remove('navbar-hidden', 'navbar-visible');
    }

    lastY = y;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  /* Active link highlight */
  const navLinks = $$('.nav-link');
  const currentPath = window.location.pathname;

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });

  /* Burger menu */
  const burger     = $('#nav-burger, .nav-burger, .burger-btn');
  const mobileMenu = $('#mobile-menu, .mobile-menu, .nav-mobile');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
    });

    // Close on link click
    $$('a', mobileMenu).forEach((a) => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        document.body.classList.remove('menu-open');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        document.body.classList.remove('menu-open');
      }
    });
  }
})();


/* ════════════════════════════════════════════════════
   5.  AOS — Animate on Scroll
   ════════════════════════════════════════════════════ */
(function initAOS() {
  if (typeof AOS === 'undefined') return;

  AOS.init({
    duration: 700,
    easing: 'ease-out-cubic',
    once: true,
    offset: 60,
    delay: 0,
  });
})();


/* ════════════════════════════════════════════════════
   6.  VANILLA TILT — 3-D Card Hover
   ════════════════════════════════════════════════════ */
(function initTilt() {
  if (typeof VanillaTilt === 'undefined') return;

  // Team member cards
  VanillaTilt.init($$('.membre-card, .mf-card'), {
    max: 8,
    speed: 400,
    glare: true,
    'max-glare': 0.12,
    perspective: 900,
  });

  // Innovation cards
  VanillaTilt.init($$('.innovation-card'), {
    max: 6,
    speed: 500,
    glare: false,
    perspective: 1000,
  });
})();


/* ════════════════════════════════════════════════════
   7.  COUNTER ANIMATION (Chiffres Clés)
   ════════════════════════════════════════════════════ */
(function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);

      const el       = entry.target;
      const target   = parseFloat(el.dataset.count);
      const suffix   = el.dataset.suffix || '';
      const duration = 1800;
      const start    = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const value = target * ease;

        el.textContent = (Number.isInteger(target)
          ? Math.round(value)
          : value.toFixed(1)) + suffix;

        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });

  counters.forEach((el) => observer.observe(el));
})();


/* ════════════════════════════════════════════════════
   8.  PROGRAMME TABS
   ════════════════════════════════════════════════════ */
(function initTabs() {
  const tabs    = $$('.prog-tab');
  const panels  = $$('.prog-panel');
  if (!tabs.length) return;

  function activateTab(btn) {
    const target = btn.dataset.tab;

    tabs.forEach((t)   => t.classList.toggle('active', t === btn));
    panels.forEach((p) => {
      const active = p.id === target || p.dataset.panel === target;
      p.classList.toggle('active', active);
      p.setAttribute('aria-hidden', !active);
    });

    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn));
  });

  const tabGroup = tabs[0]?.closest('[role="tablist"]');
  if (tabGroup) {
    tabGroup.addEventListener('keydown', (e) => {
      const current = $$('.prog-tab.active', tabGroup)[0];
      const idx     = tabs.indexOf(current);

      if (e.key === 'ArrowRight' && idx < tabs.length - 1) {
        tabs[idx + 1].click();
        tabs[idx + 1].focus();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        tabs[idx - 1].click();
        tabs[idx - 1].focus();
      }
    });
  }
})();


/* ════════════════════════════════════════════════════
   9.  CONTACT FORM — AJAX + VALIDATION
   ════════════════════════════════════════════════════ */
(function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const submitBtn  = form.querySelector('[type="submit"]');
  const successMsg = $('#form-success');
  const errorMsg   = $('#form-error');

  /* ── Real-time field validation ─ */
  function validateField(field) {
    const wrapper = field.closest('.form-group');
    if (!wrapper) return true;

    let valid = true;
    let msg   = '';

    if (field.required && !field.value.trim()) {
      valid = false;
      msg   = 'Ce champ est requis.';
    } else if (field.type === 'email' && field.value.trim()) {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
      if (!valid) msg = 'Adresse e-mail invalide.';
    } else if (field.name === 'message' && field.value.trim().length < 20) {
      valid = false;
      msg   = 'Minimum 20 caractères.';
    }

    wrapper.classList.toggle('field-error', !valid);
    wrapper.classList.toggle('field-valid',  valid && field.value.trim() !== '');

    let hint = wrapper.querySelector('.field-hint');
    if (!valid) {
      if (!hint) {
        hint = document.createElement('p');
        hint.className = 'field-hint';
        wrapper.appendChild(hint);
      }
      hint.textContent = msg;
    } else if (hint) {
      hint.remove();
    }

    return valid;
  }

  $$('input, textarea, select', form).forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.closest('.form-group')?.classList.contains('field-error')) {
        validateField(field);
      }
    });
  });

  /* ── Char counter for textarea ─ */
  const textarea  = form.querySelector('textarea[name="message"]');
  const charCount = $('#char-count');
  if (textarea && charCount) {
    const MAX = parseInt(textarea.getAttribute('maxlength') || 1000);
    textarea.addEventListener('input', () => {
      const remaining = MAX - textarea.value.length;
      charCount.textContent = remaining + ' caractères restants';
      charCount.classList.toggle('char-warning', remaining < 100);
    });
  }

  /* ── Submit ─ */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    const fields  = $$('input[required], textarea[required], select[required]', form);
    const allOk   = fields.map(validateField).every(Boolean);
    if (!allOk) return;

    // UI: loading state
    submitBtn.disabled = true;
    const origText     = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span> Envoi…';

    if (successMsg) successMsg.hidden = true;
    if (errorMsg)   errorMsg.hidden   = true;

    try {
      const data = new FormData(form);
      const res  = await fetch(form.action || '/contact', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: data,
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success !== false) {
        form.reset();
        if (successMsg) {
          successMsg.hidden = false;
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        // Clear valid states
        $$('.field-valid', form).forEach((g) => g.classList.remove('field-valid'));
        if (charCount) charCount.textContent = '';
      } else {
        throw new Error(json.message || 'Erreur serveur');
      }
    } catch (err) {
      if (errorMsg) {
        errorMsg.hidden = false;
        const errText = errorMsg.querySelector('p, span');
        if (errText) errText.textContent = err.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    } finally {
      submitBtn.disabled  = false;
      submitBtn.innerHTML = origText;
    }
  });
})();


/* ════════════════════════════════════════════════════
   10. SMOOTH SCROLL (anchor links)
   ════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


/* ════════════════════════════════════════════════════
   11. MARQUEE — pause on hover
   ════════════════════════════════════════════════════ */
(function initMarquee() {
  $$('.marquee-track, .activites-track').forEach((track) => {
    track.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    track.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  });
})();


/* ════════════════════════════════════════════════════
   13. ROADMAP / TIMELINE — step click
   ════════════════════════════════════════════════════ */
(function initRoadmap() {
  const steps = $$('.roadmap-step, .timeline-item');
  steps.forEach((step) => {
    step.addEventListener('click', () => {
      steps.forEach((s) => s.classList.remove('active'));
      step.classList.toggle('active');
    });
  });
})();


/* ════════════════════════════════════════════════════
   14. BACK TO TOP
   ════════════════════════════════════════════════════ */
(function initBackToTop() {
  // Inject button if not present
  if (!$('#back-to-top')) {
    const btn = document.createElement('button');
    btn.id          = 'back-to-top';
    btn.className   = 'back-to-top-btn';
    btn.title       = 'Retour en haut';
    btn.innerHTML   = '↑';
    btn.setAttribute('aria-label', 'Retour en haut de page');
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
  }
})();


/* ════════════════════════════════════════════════════
   15. ACCESSIBILITY — focus-visible polyfill helper
   ════════════════════════════════════════════════════ */
(function initFocusVisible() {
  document.addEventListener('keydown', () => {
    document.body.classList.add('keyboard-nav');
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
})();
