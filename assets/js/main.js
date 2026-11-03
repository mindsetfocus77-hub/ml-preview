/* =========================================================================
   Miss Lith — interacciones
   ========================================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── Verificación de edad ─────────────────────────────────────────── */
  var gate = $('#agegate');
  var KEY  = 'ml-age-ok';
  var passed = false;

  try { passed = sessionStorage.getItem(KEY) === '1'; } catch (e) { passed = false; }

  if (passed) {
    gate.remove();
  } else {
    document.documentElement.classList.add('is-locked');
    $('#ag-yes').addEventListener('click', function () {
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      gate.classList.add('is-gone');
      document.documentElement.classList.remove('is-locked');
      setTimeout(function () { gate.remove(); }, 700);
    });
  }

  /* ── Cabecera ─────────────────────────────────────────────────────── */
  var hdr = $('#hdr');
  var onScroll = function () {
    hdr.classList.toggle('is-stuck', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Menú móvil ───────────────────────────────────────────────────── */
  var burger = $('#burger');
  var nav    = $('#nav');

  var closeNav = function () {
    nav.classList.remove('is-open');
    burger.classList.remove('is-on');
    hdr.classList.remove('is-navopen');
    document.documentElement.classList.remove('is-locked');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.classList.toggle('is-on', open);
    hdr.classList.toggle('is-navopen', open);
    document.documentElement.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });

  /* ── Reveal al hacer scroll ───────────────────────────────────────── */
  var targets = $$('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
          return n.classList.contains('reveal');
        });
        var i = sibs.indexOf(el);
        el.style.transitionDelay = (i > 0 ? Math.min(i, 6) * 70 : 0) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Filtro de prácticas ──────────────────────────────────────────── */
  var cards = $$('.pcard');
  var chips = $$('.chip');
  var find  = $('#pfind');
  var empty = $('#pempty');
  var cat   = 'all';

  var norm = function (s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  };

  var apply = function () {
    var q = norm(find.value.trim());
    var shown = 0;

    cards.forEach(function (card) {
      var okCat = cat === 'all' || card.dataset.c === cat;
      var okTxt = !q || norm(card.textContent).indexOf(q) > -1;
      var ok = okCat && okTxt;
      card.classList.toggle('is-hidden', !ok);
      if (ok) shown++;
    });

    empty.hidden = shown > 0;
  };

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('is-on'); });
      chip.classList.add('is-on');
      cat = chip.dataset.f;
      apply();
    });
  });

  find.addEventListener('input', apply);

  /* ── Lightbox ─────────────────────────────────────────────────────── */
  var shots = $$('.gal__i');
  var lb    = $('#lb');
  var lbImg = $('#lb-img');
  var lbC   = $('#lb-c');
  var idx   = 0;

  var show = function (i) {
    idx = (i + shots.length) % shots.length;
    var btn = shots[idx];
    lbImg.src = btn.dataset.src;
    lbImg.alt = $('img', btn).alt;
    lbC.textContent = (idx + 1) + ' / ' + shots.length;
  };

  var openLb = function (i) {
    show(i);
    lb.hidden = false;
    document.documentElement.classList.add('is-locked');
    requestAnimationFrame(function () { lb.classList.add('is-on'); });
  };

  var closeLb = function () {
    lb.classList.remove('is-on');
    document.documentElement.classList.remove('is-locked');
    setTimeout(function () { lb.hidden = true; lbImg.removeAttribute('src'); }, 420);
  };

  shots.forEach(function (btn, i) {
    btn.addEventListener('click', function () { openLb(i); });
  });

  $('#lb-x').addEventListener('click', closeLb);
  $('#lb-p').addEventListener('click', function () { show(idx - 1); });
  $('#lb-n').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape')     closeLb();
    if (e.key === 'ArrowLeft')  show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  /* ── Formulario → correo ──────────────────────────────────────────── */
  var form = $('#form');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = $('#f-name').value.trim();
    var age  = $('#f-age').value.trim();
    var type = $('#f-type').value;
    var msg  = $('#f-msg').value.trim();

    var subject = 'Solicitud de sesión — ' + (name || 'sin nombre');
    var body = [
      'Nombre o alias: ' + name,
      'Edad: ' + age,
      'Formato: ' + type,
      '',
      'Qué busco y mis límites:',
      msg,
      '',
      '— Enviado desde misslith.com'
    ].join('\n');

    window.location.href = 'mailto:lilithbdsmvlc@gmail.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body='    + encodeURIComponent(body);
  });

  /* ── Año en el pie ────────────────────────────────────────────────── */
  $('#yr').textContent = new Date().getFullYear();

})();
