/* =========================================================================
   Miss Lith — interfaz
   ========================================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Umbral 18+ ───────────────────────────────────────────────────── */
  var gate = $('#gate');
  var KEY  = 'ml-age-ok';
  var seen = false;

  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  var openSite = function () {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    $('#gate-load').classList.add('on');
    setTimeout(function () {
      gate.classList.add('off');
      document.documentElement.classList.remove('lock');
      document.body.classList.add('entered');
    }, 520);
    setTimeout(function () { gate.remove(); }, 1500);
  };

  if (seen) {
    gate.remove();
    document.body.classList.add('entered');
  } else {
    document.documentElement.classList.add('lock');
    $('#gate-yes').addEventListener('click', openSite);
  }

  /* ── Cabecera + barra de progreso ─────────────────────────────────── */
  var hdr  = $('#hdr');
  var bar  = $('#progress').firstElementChild;

  var onScroll = function () {
    var y = window.scrollY;
    hdr.classList.toggle('stuck', y > 40);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Menú móvil ───────────────────────────────────────────────────── */
  var burger = $('#burger');
  var nav    = $('#nav');

  var closeNav = function () {
    nav.classList.remove('open');
    burger.classList.remove('on');
    hdr.classList.remove('navopen');
    document.documentElement.classList.remove('lock');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.classList.toggle('on', open);
    hdr.classList.toggle('navopen', open);
    document.documentElement.classList.toggle('lock', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });

  /* ── Cursor ───────────────────────────────────────────────────────── */
  var cur = $('#cursor');

  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, shown = false;

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { cx = tx; cy = ty; shown = true; cur.classList.add('on'); }
    }, { passive: true });

    (function loop () {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(loop);
    })();

    var hot = 'a,button,input,select,textarea,label,[data-c],.gi,.p,.drum canvas';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hot)) cur.classList.add('hot');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hot)) cur.classList.remove('hot');
    });
  }

  /* ── Reveal ───────────────────────────────────────────────────────── */
  var marks = $$('.rv, .rv-l');

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
          return n.classList.contains('rv') || n.classList.contains('rv-l');
        });
        var i = sibs.indexOf(el);
        el.style.transitionDelay = (i > 0 ? Math.min(i, 7) * 80 : 0) + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });

    marks.forEach(function (el) { io.observe(el); });
  } else {
    marks.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── Inclinación 3D del retrato ───────────────────────────────────── */
  var fig  = $('#tilt');
  var arch = fig && $('.hero__arch', fig);

  if (arch && !reduce && window.matchMedia('(hover: hover)').matches) {
    fig.addEventListener('mousemove', function (e) {
      var r = fig.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width  - 0.5;
      var py = (e.clientY - r.top)  / r.height - 0.5;
      arch.style.transform =
        'rotateY(' + (px * 9).toFixed(2) + 'deg) rotateX(' + (-py * 9).toFixed(2) + 'deg) translateZ(14px)';
    });
    fig.addEventListener('mouseleave', function () { arch.style.transform = ''; });
  }

  /* ── Filtro de prácticas ──────────────────────────────────────────── */
  var items = $$('.p');
  var chips = $$('.ch');
  var find  = $('#pfind');
  var empty = $('#pempty');
  var cat   = 'all';

  var norm = function (s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  };

  var apply = function () {
    var q = norm(find.value.trim());
    var n = 0;

    items.forEach(function (it) {
      var ok = (cat === 'all' || it.dataset.c2 === cat) &&
               (!q || norm(it.textContent).indexOf(q) > -1);
      it.classList.toggle('hide', !ok);
      if (ok) n++;
    });

    empty.hidden = n > 0;
  };

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('on'); });
      chip.classList.add('on');
      cat = chip.dataset.f;
      apply();
    });
  });
  find.addEventListener('input', apply);

  /* ── Lightbox ─────────────────────────────────────────────────────── */
  var shots = $$('.gi');
  var lb    = $('#lb');
  var lbImg = $('#lb-img');
  var lbC   = $('#lb-c');
  var idx   = 0;

  var show = function (i) {
    idx = (i + shots.length) % shots.length;
    lbImg.src = shots[idx].dataset.src;
    lbImg.alt = $('img', shots[idx]).alt;
    lbC.textContent = (idx + 1) + ' / ' + shots.length;
  };

  var openLb = function (i) {
    show(i);
    lb.hidden = false;
    document.documentElement.classList.add('lock');
    requestAnimationFrame(function () { lb.classList.add('on'); });
  };

  var closeLb = function () {
    lb.classList.remove('on');
    document.documentElement.classList.remove('lock');
    setTimeout(function () { lb.hidden = true; lbImg.removeAttribute('src'); }, 460);
  };

  shots.forEach(function (b, i) { b.addEventListener('click', function () { openLb(i); }); });

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

  /* el carrusel 3D entra por aquí */
  window.ML = {
    sources: shots.map(function (b) { return b.dataset.src; }),
    openLightbox: openLb,
    reduce: reduce
  };

  /* ── Formulario → correo ──────────────────────────────────────────── */
  $('#form').addEventListener('submit', function (e) {
    e.preventDefault();

    var name = $('#f-name').value.trim();
    var body = [
      'Nombre o alias: ' + name,
      'Edad: ' + $('#f-age').value.trim(),
      'Formato: ' + $('#f-type').value,
      '',
      'Qué busco y mis límites:',
      $('#f-msg').value.trim(),
      '',
      '— Enviado desde misslith.com'
    ].join('\n');

    window.location.href = 'mailto:lilithbdsmvlc@gmail.com'
      + '?subject=' + encodeURIComponent('Solicitud de sesión — ' + (name || 'sin nombre'))
      + '&body='    + encodeURIComponent(body);
  });

  /* ── Tema (demo) ──────────────────────────────────────────────────────
     Bloque de la herramienta de paletas. Se borra entero al cerrar color. */
  var tsw = $('#tsw');

  if (tsw) {
    var swatches = $$('button', tsw);
    var meta = $('meta[name=theme-color]');

    var mark = function (t) {
      swatches.forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
    };

    mark(document.documentElement.dataset.tema || 'cromo');

    swatches.forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.dataset.t;
        document.documentElement.dataset.tema = t;
        try { localStorage.setItem('ml-tema', t); } catch (e) {}
        mark(t);
        if (meta) {
          meta.content = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg').trim();
        }
        window.dispatchEvent(new CustomEvent('ml:tema', { detail: t }));
      });
    });
  }

  /* ── Año ──────────────────────────────────────────────────────────── */
  $('#yr').textContent = new Date().getFullYear();

})();
