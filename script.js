(function () {
  'use strict';
  var C = window.SITE_CONFIG || {};
  var body = document.body;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  /* ---------- Analytics (dataLayer + eventos) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(name, params) {
    params = params || {};
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    if (typeof window.fbq === 'function') {
      if (name === 'generate_lead') window.fbq('track', 'Lead');
      else if (name === 'whatsapp_click') window.fbq('track', 'Contact');
    }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) track(el.getAttribute('data-track'), { label: (el.textContent || '').trim().slice(0, 40) });
  });

  /* ---------- WhatsApp ---------- */
  function waUrl(text) {
    return 'https://wa.me/' + (C.whatsapp || '5521964887610') + '?text=' + encodeURIComponent(text || C.whatsappMsg || '');
  }
  ['waMain', 'waFloat'].forEach(function (id) {
    var a = document.getElementById(id);
    if (a) a.href = waUrl();
  });
  if (C.instagram) {
    var ig = document.getElementById('igLink');
    if (ig) ig.href = 'https://instagram.com/' + C.instagram;
  }
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Consentimento + carregamento de trackers ---------- */
  function loadScript(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }
  function loadTrackers() {
    if (C.gtm) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(C.gtm));
    }
    if (C.ga4) {
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', C.ga4);
      loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.ga4));
    }
    if (C.metaPixel) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', C.metaPixel); window.fbq('track', 'PageView');
    }
  }
  (function consent() {
    if (!(C.ga4 || C.gtm || C.metaPixel)) return;
    var box = document.getElementById('consent'), saved = null;
    try { saved = localStorage.getItem('av_consent'); } catch (e) {}
    if (saved === 'yes') return loadTrackers();
    if (saved === 'no') return;
    box.hidden = false;
    function set(v) { try { localStorage.setItem('av_consent', v); } catch (e) {} box.hidden = true; if (v === 'yes') loadTrackers(); }
    document.getElementById('consentYes').onclick = function () { set('yes'); };
    document.getElementById('consentNo').onclick = function () { set('no'); };
  })();

  /* ---------- Navegação ---------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Abertura cinematográfica ---------- */
  var video = document.getElementById('heroVideo');
  var skipBtn = document.getElementById('skipIntro');
  var steps = [
    [0, 's-video'], [3000, 's-lines'], [4000, 's-brand'], [5000, 's-head'],
    [7000, 's-cta'], [8000, 's-nav'], [9500, 's-done']
  ];
  var timers = [], finished = false;

  function startVideo() {
    if (!video || saveData) { if (video) video.removeAttribute('autoplay'); return; }
    var p = video.play(); if (p && p.catch) p.catch(function () {});
  }
  function finish(skip) {
    if (finished) return; finished = true;
    timers.forEach(clearTimeout);
    if (skip) body.classList.add('intro-skip');
    steps.forEach(function (s) { body.classList.add(s[1]); });
    body.classList.remove('intro-on');
    if (skip) setTimeout(function () { body.classList.remove('intro-skip'); }, 120);
  }
  function runIntro() {
    startVideo();
    if (reduce || !root.classList.contains('js')) { finish(true); return; }
    steps.forEach(function (s) {
      timers.push(setTimeout(function () {
        body.classList.add(s[1]);
        if (s[1] === 's-done') { body.classList.remove('intro-on'); finished = true; }
      }, s[0]));
    });
  }
  skipBtn.addEventListener('click', function () { finish(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(true); });
  // âncora/hash durante a abertura: pula
  window.addEventListener('hashchange', function () { finish(true); });
  // conexão lenta: poster no lugar do vídeo e abertura curta
  if (saveData && video) { video.pause(); video.removeAttribute('src'); }
  runIntro();

  /* ---------- Revelação conforme o scroll ---------- */
  var targets = document.querySelectorAll('[data-reveal],[data-draw]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t, i) {
      // pequeno escalonamento entre irmãos
      var sib = Array.prototype.indexOf.call(t.parentNode.children, t);
      if (t.hasAttribute('data-reveal') && sib > 0 && sib < 7) t.style.transitionDelay = (sib * 0.07) + 's';
      io.observe(t);
    });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  /* ---------- Scroll: nav sólida, parallax sutil, linha do método ---------- */
  var media = document.querySelector('.hero__media');
  var stepsEl = document.getElementById('steps');
  var fill = document.getElementById('stepsFill');
  var desktop = window.matchMedia('(min-width: 901px)');
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    nav.classList.toggle('solid', y > 60);
    if (media && !reduce && y < vh * 1.1) media.style.transform = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0)';
    if (stepsEl && fill) {
      var r = stepsEl.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.2)));
      if (reduce) p = 1;
      fill.style.transform = desktop.matches ? 'scaleX(' + p.toFixed(3) + ')' : 'scaleY(' + p.toFixed(3) + ')';
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* ---------- Formulário ---------- */
  var form = document.getElementById('leadForm');
  var msg = document.getElementById('formMsg');
  function check(field) {
    var err = field.parentNode.querySelector('.err'), v = field.value.trim(), m = '';
    if (!v) m = 'Preencha este campo.';
    else if (field.name === 'nome' && v.length < 2) m = 'Informe seu nome.';
    err.textContent = m;
    field.classList.toggle('invalid', !!m);
    field.setAttribute('aria-invalid', m ? 'true' : 'false');
    return !m;
  }
  form.addEventListener('input', function (e) { if (e.target.classList.contains('invalid')) check(e.target); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fields = Array.prototype.slice.call(form.elements).filter(function (f) { return f.name; });
    var ok = fields.map(check).every(Boolean);
    if (!ok) {
      msg.style.color = '#ff8a8a'; msg.textContent = 'Revise os campos destacados.';
      var bad = form.querySelector('.invalid'); if (bad) bad.focus();
      return;
    }
    var d = {}; fields.forEach(function (f) { d[f.name] = f.value.trim(); });
    var text = 'Olá Alex! Vim pelo site.\n' +
      'Nome: ' + d.nome + '\nEmpresa: ' + d.empresa + '\nSegmento: ' + d.segmento + '\nObjetivo: ' + d.objetivo;
    track('generate_lead', { segmento: d.segmento, objetivo: d.objetivo });
    msg.style.color = ''; msg.textContent = 'Pronto! Abrindo o WhatsApp para enviar sua mensagem…';
    var w = window.open(waUrl(text), '_blank');
    if (w) { try { w.opener = null; } catch (err) {} }
    else { msg.innerHTML = 'Se o WhatsApp não abriu, <a href="' + waUrl(text) + '" target="_blank" rel="noopener" style="text-decoration:underline">clique aqui</a>.'; }
    form.reset();
  });
})();
