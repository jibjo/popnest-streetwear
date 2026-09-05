/* Heavenly Lights — minimal fix (theme, cart, filters, checkout, newsletter) */
(function () {
  var PAYHIP = 'https://payhip.com/Popnest';   // your real PayHip storefront
  var KEY = 'heavenly_cart_v1', cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function money(n) { return '$' + Number(n || 0).toFixed(2); }
  function tot() {
    var c = 0, t = 0;
    cart.forEach(function (i) { c += i.qty; t += i.price * i.qty; });
    return { c: c, t: t };
  }

  /* theme: CSS defaults to light, dark needs data-theme on <html> */
  function theme(dark) {
    var html = document.documentElement, t = document.getElementById('themeToggle');
    if (dark) html.setAttribute('data-theme', 'dark'); else html.removeAttribute('data-theme');
    if (t) { var i = t.querySelector('.theme-icon'); if (i) i.textContent = dark ? '☀️' : '🌙'; }
    try { localStorage.setItem('heavenly_theme_v1', dark ? '1' : '0'); } catch (e) {}
  }
  var stored = null;
  try { stored = localStorage.getItem('heavenly_theme_v1'); } catch (e) {}
  theme(stored === null ? true : stored === '1');
  var tg = document.getElementById('themeToggle');
  if (tg) tg.onclick = function () {
    theme(document.documentElement.getAttribute('data-theme') !== 'dark');
  };

  /* cart */
  function draw() {
    var box = document.getElementById('cartItems');
    if (box) {
      box.innerHTML = cart.length ? cart.map(function (i, n) {
        return '<div class="cart-item"><div><div class="cart-item-name">' + i.name +
          (i.v ? ' · ' + i.v : '') + '</div><div class="cart-item-price">' + money(i.price) +
          ' × ' + i.qty + '</div></div><div><button onclick="setQty(' + n + ',-1)">−</button> ' +
          '<button onclick="setQty(' + n + ',1)">+</button> ' +
          '<button onclick="delLine(' + n + ')">✕</button></div></div>';
      }).join('') : '<p style="text-align:center;color:var(--text-light);padding:30px 0">Your cart is empty.</p>';
    }
    document.querySelectorAll('.cart-count').forEach(function (e) { e.textContent = tot().c; });
    var el = document.getElementById('cartTotal');
    if (el) el.textContent = money(tot().t);
  }
  window.addToCart = function (name, price) {
    var v = '', q = 1;
    var s = document.querySelector('.size-options .size-btn.active');
    if (s) v = s.textContent.trim();
    var input = document.getElementById('quantity');
    if (name === 'Armor Sconce' && input) q = Math.max(1, parseInt(input.value, 10) || 1);
    var hit = cart.filter(function (i) { return i.name === name && i.v === v; })[0];
    if (hit) hit.qty += q; else cart.push({ name: name, price: price, qty: q, v: v });
    save(); draw(); openCart();
  };
  window.setQty = function (n, d) {
    cart[n].qty = Math.max(1, cart[n].qty + d); save(); draw();
  };
  window.delLine = function (n) { cart.splice(n, 1); save(); draw(); };
  window.increaseQty = function () { step(1); };
  window.decreaseQty = function () { step(-1); };
  function step(d) {
    var i = document.getElementById('quantity');
    if (i) i.value = Math.min(99, Math.max(1, (parseInt(i.value, 10) || 1) + d));
  }
  function openCart() {
    var s = document.getElementById('cartSidebar');
    if (s) s.classList.add('open');
  }
  window.openCart = openCart;
  window.closeCart = function () {
    var s = document.getElementById('cartSidebar');
    if (s) s.classList.remove('open');
  };
  document.querySelectorAll('a[href="#cart"]').forEach(function (a) {
    a.onclick = function (e) { e.preventDefault(); openCart(); };
  });
  document.onkeydown = function (e) { if (e.key === 'Escape') window.closeCart(); };

  window.buyNow = function () {
    var p = document.querySelector('.current-price');
    window.addToCart('Armor Sconce', p ? parseFloat(p.textContent.replace(/[^0-9.]/g, '')) : 129.99);
  };
  window.checkout = function () {
    if (!cart.length) { alert('Your cart is empty — add a product first.'); return; }
    window.location.href = PAYHIP;
  };

  /* filters */
  window.filterProducts = function (cat) {
    document.querySelectorAll('.product-card').forEach(function (c) {
      c.style.display = (cat === 'all' || c.dataset.category === cat) ? '' : 'none';
    });
    var btns = document.querySelectorAll('.filter-btn');
    for (var n = 0; n < btns.length; n++) {
      var i = (btns[n].getAttribute('onclick') || '').indexOf("'" + cat + "'");
      btns[n].classList.toggle('active', i > -1);
    }
  };

  /* newsletter (the markup has no <form>, so wire the button by hand) */
  var form = document.querySelector('.newsletter-form');
  if (form) {
    var input = form.querySelector('input'), btn = form.querySelector('button');
    function send() {
      var v = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { alert('Please enter a valid email.'); return; }
      var list = [];
      try { list = JSON.parse(localStorage.getItem('heavenly_subs')) || []; } catch (e) {}
      list.push(v);
      try { localStorage.setItem('heavenly_subs', JSON.stringify(list)); } catch (e) {}
      input.value = '';
      alert('Thanks! You are on the list.');
    }
    if (btn) btn.onclick = function (e) { e.preventDefault(); send(); };
    input.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } };
  }

  draw();
})();
