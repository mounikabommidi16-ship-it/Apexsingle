// Apex DX Labs — single landing page interactions
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile menu
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', function () { setOpen(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }

  // Sticky header shadow
  var header = document.querySelector('header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Hero: video autoplay, parallax and gold glow following the pointer
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var vid = hero.querySelector('video');
    if (vid) {
      vid.muted = true;
      var pr = vid.play && vid.play();
      if (pr && pr.catch) pr.catch(function () {});
    }
    var glow = hero.querySelector('[data-glow]');
    if (!reduceMotion) {
      var raf = null;
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var rx = ((50 - y) / 50) * 5, ry = ((x - 50) / 50) * 6;
          if (vid) vid.style.transform = 'translate(' + (-ry * 2.2).toFixed(1) + 'px,' + (rx * 2.2).toFixed(1) + 'px)';
          if (glow) glow.style.background = 'radial-gradient(640px circle at ' + x.toFixed(1) + '% ' + y.toFixed(1) + '%, rgba(217,181,102,.16), transparent 60%)';
        });
      });
      hero.addEventListener('mouseleave', function () {
        if (vid) vid.style.transform = 'translate(0px,0px)';
        if (glow) glow.style.background = 'none';
      });
    }
  }

  // Test tabs: auto-rotate every 7 s with a progress bar; a click stops auto-rotation
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab[data-tab]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  if (tabs.length) {
    var DUR = 7000, current = 0, auto = !reduceMotion, paused = false, elapsed = 0, last = null;
    var show = function (i) {
      current = i;
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.tabIndex = j === i ? 0 : -1;
        t.querySelector('.tbar').style.width = j === i && !auto ? '100%' : '0%';
      });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
      elapsed = 0;
    };
    var pick = function (i) { auto = false; show(i); };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
          pick(n); tabs[n].focus(); e.preventDefault();
        }
      });
    });
    document.querySelectorAll('[data-pick]').forEach(function (a) {
      a.addEventListener('click', function () { pick(+a.getAttribute('data-pick')); });
    });
    var box = document.querySelector('[data-panels]');
    if (box) {
      box.addEventListener('mouseenter', function () { paused = true; });
      box.addEventListener('mouseleave', function () { paused = false; });
    }
    var tick = function (ts) {
      if (last === null) last = ts;
      var dt = ts - last; last = ts;
      if (auto && !paused && !document.hidden) {
        elapsed += dt;
        if (elapsed >= DUR) show((current + 1) % tabs.length);
        tabs[current].querySelector('.tbar').style.width = Math.min(100, (elapsed / DUR) * 100).toFixed(1) + '%';
      }
      if (auto) requestAnimationFrame(tick);
    };
    show(0);
    if (auto) requestAnimationFrame(tick);
  }

  // What we test: "Learn More" pop-up, filled from the clicked card
  var modal = document.getElementById('test-modal');
  if (modal) {
    var q = function (sel) { return modal.querySelector(sel); };
    var lastFocus = null;
    var open = function (card) {
      var img = card.querySelector('.tcard-img img');
      var res = card.querySelector('.res');
      q('[data-m="img"]').src = img.getAttribute('src');
      q('[data-m="img"]').alt = img.getAttribute('alt');
      q('[data-m="name"]').textContent = card.querySelector('.tcard-name').textContent;
      q('[data-m="headline"]').textContent = card.querySelector('h3').textContent;
      q('[data-m="body"]').textContent = card.querySelector('.tcard-body > p:not(.res)').textContent;
      q('[data-m="res"]').textContent = res ? res.textContent : '';
      q('[data-m="res"]').hidden = !res;
      q('[role="dialog"]').setAttribute('aria-label', card.querySelector('.tcard-name').textContent);
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      q('.modal-x').focus();
    };
    var close = function () {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    document.querySelectorAll('[data-open-test]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.closest('.tcard')); });
    });
    modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
    var cta = q('[data-close-link]');
    if (cta) cta.addEventListener('click', function () { modal.hidden = true; document.body.style.overflow = ''; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
  }

  // Contact form (Netlify Forms)
  var form = document.getElementById('contact-form');
  if (form) {
    var btn = form.querySelector('button[type="submit"]');
    var status = document.getElementById('form-status');
    var setErr = function (name, msg) {
      var inp = form.elements[name], err = document.getElementById(name + '-err');
      inp.classList.toggle('err', !!msg);
      inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
      err.textContent = msg; err.hidden = !msg;
    };
    var validate = function () {
      var name = form.elements.name.value.trim(), email = form.elements.email.value.trim(), msg = form.elements.message.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      setErr('name', name ? '' : 'Required');
      setErr('email', emailOk ? '' : (email ? 'Enter a valid email' : 'Required'));
      setErr('message', msg ? '' : 'Required');
      return name && emailOk && msg;
    };
    var tried = false;
    form.addEventListener('input', function () { if (tried) validate(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      if (!validate()) { var bad = form.querySelector('.inp.err'); if (bad) bad.focus(); return; }
      btn.disabled = true;
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset(); tried = false;
        btn.querySelector('[data-label]').textContent = 'Sent';
      }).catch(function () {
        status.textContent = '(469) 694-2210 | info@apexdxlabs.com';
      }).then(function () { btn.disabled = false; });
    });
  }
})();
