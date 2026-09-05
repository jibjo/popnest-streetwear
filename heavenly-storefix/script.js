/* ============================================================================
   HEAVENLY LIGHTS — store interactivity
   Implements every hook index.html already calls:
   theme toggle, cart, quantity, variants, filters, newsletter, checkout.
   Written as progressive enhancement: the page renders fully from HTML/CSS
   even if this file throws, so a JS error can never blank the store.
   ============================================================================ */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- config */
  var CONFIG = {
    CART_KEY: 'heavenly_cart_v1',
    THEME_KEY: 'heavenly_theme_v1',
    SUBSCRIBER_KEY: 'heavenly_subscribers_v1',
    CURRENCY: '$',
    MAX_QTY: 99,
    // PayHip wiring. The storefront below is live today, so checkout always
    // sends the customer somewhere real instead of doing nothing.
    PAYHIP_STORE_URL: 'https://payhip.com/Popnest',
    PAYHIP_BUY_URL: 'https://payhip.com/buy',
    CHECKOUT_URL: '',
    // One entry per product, keyed by the exact name used in index.html's
    // addToCart(...) calls. The value is the PayHip link code — the part after
    // payhip.com/b/ (e.g. 'https://payhip.com/b/k5ORp' -> 'k5ORp'). Fill these
    // in and "Buy Now" goes straight to the payment page and the cart
    // pre-fills itself on PayHip. Until then, checkout opens the storefront.
    PRODUCT_LINKS: {
      // 'Armor Sconce': '',
      // 'Rotatable Strip Light': '',
      // 'Up Down Wall Sconce': '',
      // 'Solar Garden Lights': '',
      // 'Square Wall Light': '',
      // 'Triple Strip Light': '',
      // 'Pathway Lights': ''
    }
  };

  function linkCodeFor(name) {
    var map = CONFIG.PRODUCT_LINKS || {};
    if (map[name]) return String(map[name]);
    var lower = String(name || '').toLowerCase();
    var found = Object.keys(map).filter(function (key) {
      return key.toLowerCase() === lower;
    })[0];
    return found ? String(map[found]) : '';
  }

  /* ----------------------------------------------------------------- state */
  var cart = sanitize(load(JSON.parse, CONFIG.CART_KEY, []));

  function sanitize(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (item) {
      return item && typeof item.name === 'string' && isFinite(Number(item.price)) &&
        isFinite(Number(item.qty)) && Number(item.qty) > 0;
    }).map(function (item) {
      return {
        key: item.key || itemKey(item.name, item.variant),
        name: item.name,
        price: Number(item.price),
        qty: Math.min(CONFIG.MAX_QTY, Math.max(1, Math.round(Number(item.qty)))),
        variant: typeof item.variant === 'string' ? item.variant : ''
      };
    });
  }

  function load(parse, key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* private mode / quota — cart still works for this visit */
    }
  }

  function money(amount) {
    return CONFIG.CURRENCY + Number(amount || 0).toFixed(2);
  }

  /* ------------------------------------------------------------------ boot */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initTheme();
    initVariants();
    initQuantity();
    initCartUI();
    initNewsletter();
    initMotion();
    initMobileNav();
    renderCart();
  }

  /* ------------------------------------------------------------ 1. theme */
  function preferredTheme() {
    var stored = load(JSON.parse, CONFIG.THEME_KEY, null);
    if (stored === 'dark' || stored === 'light') return stored;
    // Brand direction is a dark luxury look, so dark is the default;
    // visitors whose OS explicitly asks for light still get light.
    var wantsLight = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches;
    return wantsLight ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    var toggle = document.getElementById('themeToggle');
    if (toggle) {
      var icon = toggle.querySelector('.theme-icon');
      if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
      toggle.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }

  function initTheme() {
    applyTheme(preferredTheme());
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'light' : 'dark';
      applyTheme(next);
      save(CONFIG.THEME_KEY, next);
    });
  }

  /* -------------------------------------------------- 2. colour/size picks */
  function selectedVariants() {
    var parts = [];
    var group = {
      color: document.querySelector('.color-options .color-btn.active'),
      size: document.querySelector('.size-options .size-btn.active')
    };
    if (group.size) parts.push(group.size.textContent.trim());
    if (group.color) {
      var label = group.color.getAttribute('title') ||
        group.color.getAttribute('aria-label') ||
        group.color.getAttribute('data-color');
      if (label) parts.push(label);
    }
    return parts;
  }

  function initVariants() {
    ['.color-options', '.size-options'].forEach(function (selector) {
      var wrap = document.querySelector(selector);
      if (!wrap) return;
      wrap.addEventListener('click', function (event) {
        var btn = event.target.closest('.color-btn, .size-btn');
        if (!btn || !wrap.contains(btn)) return;
        wrap.querySelectorAll('.active').forEach(function (el) {
          el.classList.remove('active');
        });
        btn.classList.add('active');
      });
    });
  }

  /* ----------------------------------------------------- 3. qty stepper */
  function qtyInput() {
    return document.getElementById('quantity');
  }

  function stepQty(delta) {
    var input = qtyInput();
    if (!input) return;
    var current = parseInt(input.value, 10);
    if (isNaN(current)) current = 1;
    var next = Math.min(CONFIG.MAX_QTY, Math.max(1, current + delta));
    input.value = String(next);
  }

  function initQuantity() {
    var input = qtyInput();
    if (!input) return;
    input.addEventListener('change', function () {
      var value = parseInt(input.value, 10);
      if (isNaN(value) || value < 1) value = 1;
      input.value = String(Math.min(CONFIG.MAX_QTY, value));
    });
  }

  window.increaseQty = function () { stepQty(1); };
  window.decreaseQty = function () { stepQty(-1); };

  /* ------------------------------------------------------------ 4. cart */
  function cartItemsEl() { return document.getElementById('cartItems'); }
  function cartTotalEl() { return document.getElementById('cartTotal'); }
  function sidebarEl() { return document.getElementById('cartSidebar'); }

  function cartCountEls() {
    return document.querySelectorAll('.cart-count');
  }

  function lineTotal(item) {
    return Number(item.price) * Number(item.qty);
  }

  function cartTotals() {
    var count = 0;
    var total = 0;
    cart.forEach(function (item) {
      count += item.qty;
      total += lineTotal(item);
    });
    return { count: count, total: total };
  }

  function itemKey(name, variant) {
    return name + '::' + (variant || '');
  }

  function addToCart(name, price, qty, variant) {
    var quantity = Math.max(1, parseInt(qty, 10) || 1);
    var extra = variant || '';

    // The flagship "Armor Sconce" button passes only (name, price), so pull
    // the chosen quantity and colour/size from the featured section.
    if (qty === undefined && name === 'Armor Sconce') {
      var input = qtyInput();
      quantity = input ? Math.max(1, parseInt(input.value, 10) || 1) : 1;
      var picked = selectedVariants();
      if (picked.length) extra = picked.join(' / ');
    }

    var key = itemKey(name, extra);
    var existing = null;
    cart.forEach(function (item) {
      if (item.key === key) existing = item;
    });

    if (existing) {
      existing.qty = Math.min(CONFIG.MAX_QTY, existing.qty + quantity);
    } else {
      cart.push({
        key: key,
        name: name,
        price: Number(price) || 0,
        qty: quantity,
        variant: extra
      });
    }

    save(CONFIG.CART_KEY, cart);
    renderCart();
    bumpBadge();
    toast(name + ' ×' + quantity + ' added to cart', 'success');
  }

  window.addToCart = addToCart;

  function removeLine(key) {
    cart = cart.filter(function (item) { return item.key !== key; });
    save(CONFIG.CART_KEY, cart);
    renderCart();
  }

  function changeLineQty(key, delta) {
    cart.forEach(function (item) {
      if (item.key !== key) return;
      item.qty = Math.min(CONFIG.MAX_QTY, Math.max(1, item.qty + delta));
    });
    save(CONFIG.CART_KEY, cart);
    renderCart();
  }

  function renderCart() {
    var list = cartItemsEl();
    if (list) {
      if (!cart.length) {
        list.innerHTML =
          '<p style="color:var(--text-light);text-align:center;padding:40px 0;line-height:1.8">' +
          'Your cart is empty.<br>Add a fixture to get started.</p>';
      } else {
        list.innerHTML = cart.map(function (item) {
          var variant = item.variant
            ? '<div style="color:var(--text-light);font-size:12px;margin-top:4px">' +
              escapeHtml(item.variant) + '</div>'
            : '';
          return '' +
            '<div class="cart-item" style="flex-direction:column;align-items:stretch;gap:12px">' +
              '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
                '<div>' +
                  '<div class="cart-item-name">' + escapeHtml(item.name) + '</div>' +
                  variant +
                '</div>' +
                '<button type="button" aria-label="Remove ' + escapeHtml(item.name) + '" ' +
                  'data-remove="' + escapeAttr(item.key) + '" ' +
                  'style="background:none;border:none;cursor:pointer;font-size:16px;' +
                  'line-height:1;color:var(--text-light)">&#10005;</button>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<div style="display:flex;align-items:center;gap:8px">' +
                  '<button type="button" data-dec="' + escapeAttr(item.key) + '" ' +
                    'style="width:28px;height:28px;border-radius:50%;border:1px solid ' +
                    'var(--border-color);background:var(--bg-primary);color:var(--text-primary);' +
                    'cursor:pointer;font-size:14px;line-height:1">&minus;</button>' +
                  '<span style="min-width:24px;text-align:center;font-weight:600">' +
                    item.qty + '</span>' +
                  '<button type="button" data-inc="' + escapeAttr(item.key) + '" ' +
                    'style="width:28px;height:28px;border-radius:50%;border:1px solid ' +
                    'var(--border-color);background:var(--bg-primary);color:var(--text-primary);' +
                    'cursor:pointer;font-size:14px;line-height:1">+</button>' +
                '</div>' +
                '<div class="cart-item-price">' + money(lineTotal(item)) + '</div>' +
              '</div>' +
            '</div>';
        }).join('');
      }
    }

    var totals = cartTotals();
    cartCountEls().forEach(function (el) { el.textContent = String(totals.count); });
    if (cartTotalEl()) cartTotalEl().textContent = money(totals.total);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function initCartUI() {
    var list = cartItemsEl();
    if (list) {
      list.addEventListener('click', function (event) {
        var btn = event.target.closest('[data-inc],[data-dec],[data-remove]');
        if (!btn) return;
        if (btn.dataset.remove) removeLine(btn.dataset.remove);
        if (btn.dataset.inc) changeLineQty(btn.dataset.inc, 1);
        if (btn.dataset.dec) changeLineQty(btn.dataset.dec, -1);
      });
    }

    // Nav cart icon and any #cart anchor opens the drawer.
    document.querySelectorAll('a[href="#cart"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        openCart();
      });
    });

    var sidebar = sidebarEl();
    if (sidebar) sidebar.addEventListener('click', function (event) {
      if (event.target === sidebar) closeCart();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeCart();
    });
  }

  function overlay() {
    var id = 'cartOverlay';
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);' +
      'opacity:0;pointer-events:none;transition:opacity .3s ease;z-index:1999';
    el.addEventListener('click', closeCart);
    document.body.appendChild(el);
    return el;
  }

  function openCart() {
    var sidebar = sidebarEl();
    if (!sidebar) return;
    sidebar.classList.add('open');
    var shade = overlay();
    requestAnimationFrame(function () { shade.style.opacity = '1'; shade.style.pointerEvents = 'auto'; });
    document.body.style.overflow = 'hidden';
    var checkout = sidebar.querySelector('.checkout-btn');
    if (checkout) checkout.focus({ preventScroll: true });
  }

  window.openCart = openCart;

  function closeCart() {
    var sidebar = sidebarEl();
    if (sidebar) sidebar.classList.remove('open');
    var shade = document.getElementById('cartOverlay');
    if (shade) { shade.style.opacity = '0'; shade.style.pointerEvents = 'none'; }
    document.body.style.overflow = '';
  }

  window.closeCart = closeCart;

  function bumpBadge() {
    cartCountEls().forEach(function (el) {
      if (!el.animate) return;
      el.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }],
        { duration: 420, easing: 'ease-out' }
      );
    });
  }

  /* ------------------------------------------------- 5. buy now/checkout */
  window.buyNow = function () {
    var price = 129.99;
    var priceEl = document.querySelector('.current-price');
    if (priceEl) {
      var parsed = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) price = parsed;
    }
    addToCart('Armor Sconce', price);

    var code = linkCodeFor('Armor Sconce');
    if (code) {
      goTo(payhipCartUrl([{ name: 'Armor Sconce', qty: cartQtyOf('Armor Sconce') }]));
      return;
    }
    openCart();
  };

  function cartQtyOf(name) {
    var total = 0;
    cart.forEach(function (item) {
      if (item.name === name) total += item.qty;
    });
    return total || 1;
  }

  // Turns the current cart into a PayHip "pre-fill my cart" link, using the
  // same shape that already works on the Popnest store:
  //   https://payhip.com/buy?s=1&qty[CODE]=2&cart_links[]=CODE
  function payhipCartUrl(items) {
    var mapped = (items || cart).filter(function (item) { return linkCodeFor(item.name); });
    if (!mapped.length) return '';
    // Built by hand so the parameter order matches the link that already
    // works on the Popnest store: qty[..] entries first, then cart_links[..].
    var parts = ['s=1'];
    mapped.forEach(function (item) {
      parts.push('qty%5B' + encodeURIComponent(linkCodeFor(item.name)) + '%5D=' +
        encodeURIComponent(item.qty));
    });
    mapped.forEach(function (item) {
      parts.push('cart_links%5B%5D=' + encodeURIComponent(linkCodeFor(item.name)));
    });
    return CONFIG.PAYHIP_BUY_URL + '?' + parts.join('&');
  }

  // Where the checkout button sends the customer right now.
  function resolveCheckoutUrl() {
    if (CONFIG.CHECKOUT_URL) return CONFIG.CHECKOUT_URL;
    var deep = payhipCartUrl(cart);
    if (deep) return deep;
    return CONFIG.PAYHIP_STORE_URL || '';
  }

  function goTo(url) {
    toast('Taking you to secure checkout…', 'success');
    window.setTimeout(function () { window.location.href = url; }, 450);
  }

  window.checkout = function () {
    if (!cart.length) {
      toast('Your cart is empty — add a product first', 'error');
      return;
    }

    var url = resolveCheckoutUrl();
    if (!url) {
      toast('Checkout is not connected yet — add your PayHip link codes in script.js (CONFIG.PRODUCT_LINKS)', 'error');
      console.info('[Heavenly] pending order', {
        items: cart.map(function (i) {
          return { name: i.name, variant: i.variant, qty: i.qty, price: i.price };
        }),
        total: Number(cartTotals().total.toFixed(2))
      });
      return;
    }

    var unmapped = cart.filter(function (item) { return !linkCodeFor(item.name); });
    if (unmapped.length && !CONFIG.CHECKOUT_URL) {
      console.info('[Heavenly] these products have no PayHip link code yet, so the cart could not be pre-filled:',
        unmapped.map(function (i) { return i.name; }));
    }
    goTo(url);
  };

  window.payhipCartUrl = payhipCartUrl;

  /* ------------------------------------------------------- 6. filters */
  window.filterProducts = function (category) {
    var cards = document.querySelectorAll('.product-card');
    var shown = 0;
    Array.prototype.forEach.call(cards, function (card) {
      var match = category === 'all' || card.dataset.category === category;
      card.style.display = match ? '' : 'none';
      if (match) {
        shown++;
        if (card.animate) {
          card.animate(
            [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
            { duration: 360, easing: 'ease-out' }
          );
        }
      }
    });

    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.classList.remove('active');
    });
    var active = Array.prototype.find.call(
      document.querySelectorAll('.filter-btn'),
      function (btn) { return (btn.getAttribute('onclick') || '').indexOf("'" + category + "'") > -1; }
    );
    if (active) active.classList.add('active');

    if (!shown) toast('No products in this category yet', 'error');
  };


  /* --------------------------------------------------- 7. newsletter */
  function initNewsletter() {
    var form = document.querySelector('.newsletter-form');
    if (!form) return;
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button');
    if (!input) return;

    function subscribe() {
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        toast('Please enter a valid email address', 'error');
        input.focus();
        return;
      }
      var list = load(JSON.parse, CONFIG.SUBSCRIBER_KEY, []);
      if (list.indexOf(email) === -1) list.push(email);
      save(CONFIG.SUBSCRIBER_KEY, list);
      input.value = '';
      toast('You are on the list — welcome to Heavenly ✨', 'success');
      console.info('[Heavenly] newsletter subscribers', list);
    }

    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        subscribe();
      });
    }
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        subscribe();
      }
    });
  }

  /* ------------------------------------------------------ 8. motion */
  function initMotion() {
    if (!('IntersectionObserver' in window)) return;

    var targets = document.querySelectorAll(
      '.product-card, .review-card, .trust-item, .featured-details, .hero-content'
    );
    if (!targets.length) return;

    var seen = new WeakSet();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (!entry.isIntersecting || seen.has(el)) return;
        seen.add(el);
        if (!el.animate) return;
        el.animate(
          [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }],
          { duration: 620, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'none' }
        );
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(targets, function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------- 8b. mobile nav menu
     styles.css hides .nav-menu below 768px and the markup ships no button to
     bring it back, so on phones the links are unreachable. Injected here so the
     whole fix stays one file. */
  function initMobileNav() {
    var style = document.createElement('style');
    style.textContent =
      '.nav-burger{display:none;background:none;border:1px solid var(--border-color);' +
      'border-radius:8px;color:var(--text-primary);font-size:20px;line-height:1;padding:6px 10px;' +
      'cursor:pointer;margin-left:12px}' +
      '.nav-burger:focus-visible{outline:2px solid var(--accent-primary);outline-offset:2px}' +
      '@media (max-width:768px){.nav-burger{display:inline-flex}' +
      '.nav-menu.nav-open{display:flex;flex-direction:column;position:absolute;top:100%;left:0;' +
      'right:0;margin:0;padding:16px 20px 20px;background:var(--bg-primary);gap:16px;' +
      'border-bottom:1px solid var(--border-color);box-shadow:0 14px 30px var(--shadow-dark);z-index:1200}' +
      '.nav-menu.nav-open a{font-size:16px;color:var(--text-primary)}}';
    document.head.appendChild(style);

    var bar = document.querySelector('.navbar .nav-right') || document.querySelector('.nav-wrapper');
    var menu = document.querySelector('.nav-menu');
    if (!bar || !menu) return;

    var burger = document.createElement('button');
    burger.type = 'button';
    burger.className = 'nav-burger';
    burger.setAttribute('aria-controls', 'navMenu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    burger.textContent = '\u2630';
    bar.appendChild(burger);

    if (!menu.id) menu.id = 'navMenu';

    function close() {
      menu.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      burger.textContent = '\u2630';
    }
    function toggle() {
      var open = menu.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      burger.textContent = open ? '\u2715' : '\u2630';
      if (open) {
        var first = menu.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      }
    }
    burger.addEventListener('click', toggle);

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('nav-open')) {
        close();
        burger.focus({ preventScroll: true });
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) close();
    });
  }

  /* ------------------------------------------------------- 9. toasts */
  var toastHost = null;

  function toast(message, type) {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.setAttribute('aria-live', 'polite');
      toastHost.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);' +
        'z-index:2500;display:flex;flex-direction:column;gap:10px;align-items:center;' +
        'pointer-events:none;width:max-content;max-width:min(92vw,520px)';
      document.body.appendChild(toastHost);
    }

    var bubble = document.createElement('div');
    var accent = type === 'error' ? '#e05b5b' : 'var(--accent-primary)';
    bubble.style.cssText = 'background:var(--bg-secondary);color:var(--text-primary);' +
      'border:1px solid var(--border-color);border-left:4px solid ' + accent + ';' +
      'border-radius:12px;padding:13px 18px;font-size:14px;font-weight:500;line-height:1.45;' +
      'box-shadow:0 14px 40px var(--shadow-dark);text-align:left';
    bubble.textContent = message;
    toastHost.appendChild(bubble);

    var life = type === 'error' ? 4200 : 2600;
    if (bubble.animate) {
      bubble.animate(
        [{ opacity: 0, transform: 'translateY(14px) scale(.97)' }, { opacity: 1, transform: 'none' }],
        { duration: 240, easing: 'ease-out', fill: 'both' }
      );
      window.setTimeout(function () {
        var out = bubble.animate(
          [{ opacity: 1 }, { opacity: 0, transform: 'translateY(10px)' }],
          { duration: 240, easing: 'ease-in', fill: 'both' }
        );
        out.onfinish = function () { if (bubble.parentNode) bubble.parentNode.removeChild(bubble); };
      }, life);
    } else {
      window.setTimeout(function () {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      }, life);
    }
  }

  /* --------------------------------------------- 10. small public helper */
  window.HeavenlyCart = {
    add: addToCart,
    open: openCart,
    close: closeCart,
    clear: function () { cart = []; save(CONFIG.CART_KEY, cart); renderCart(); },
    items: function () { return cart.slice(); },
    totals: cartTotals,
    setCheckoutUrl: function (url) { CONFIG.CHECKOUT_URL = String(url || ''); },
    setProductLink: function (name, code) { CONFIG.PRODUCT_LINKS[name] = String(code || ''); },
    checkoutUrl: function () { return resolveCheckoutUrl(); },
    previewPayhipUrl: function () { return payhipCartUrl(cart); }
  };
})();
