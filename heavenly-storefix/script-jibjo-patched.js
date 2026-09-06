(() => {
  "use strict";

  const STORAGE_KEY = "heavenly-cart-v1";
  const PAYHIP_STORE = "https://payhip.com/Popnest";
  let cart = [];
  let quantity = 1;

  try {
    cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (_) {
    cart = [];
  }

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function money(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function cartCount() {
    return cart.reduce((total, item) => total + item.qty, 0);
  }

  function cartTotal() {
    return cart.reduce((total, item) => total + item.price * item.qty, 0);
  }

  function updateCart() {
    const count = $(".cart-count");
    const items = $("#cartItems");
    const total = $("#cartTotal");

    if (count) count.textContent = cartCount();
    if (total) total.textContent = money(cartTotal());
    if (!items) return;

    if (!cart.length) {
      items.innerHTML = '<p class="empty-cart">Your cart is empty. Add something beautiful.</p>';
      return;
    }

    items.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${money(item.price)} × ${item.qty}</div>
        </div>
        <button class="remove-cart-item" data-index="${index}" aria-label="Remove ${item.name}">✕</button>
      </div>
    `).join("");

    $$(".remove-cart-item").forEach((button) => {
      button.addEventListener("click", () => {
        cart.splice(Number(button.dataset.index), 1);
        saveCart();
        updateCart();
      });
    });
  }

  function openCart() {
    $("#cartSidebar")?.classList.add("open");
  }

  function closeCart() {
    $("#cartSidebar")?.classList.remove("open");
  }

  window.addToCart = function addToCart(name, price) {
    const box = $("#quantity");
    if (box) quantity = Math.max(1, Math.min(99, Number(box.value) || 1));
    const amount = name === "Armor Sconce" ? quantity : 1;
    const existing = cart.find((item) => item.name === name && item.price === Number(price));

    if (existing) existing.qty += amount;
    else cart.push({ name, price: Number(price), qty: amount });

    saveCart();
    updateCart();
    openCart();
  };

  window.increaseQty = function increaseQty() {
    quantity += 1;
    const input = $("#quantity");
    if (input) input.value = quantity;
  };

  window.decreaseQty = function decreaseQty() {
    quantity = Math.max(1, quantity - 1);
    const input = $("#quantity");
    if (input) input.value = quantity;
  };

  window.closeCart = closeCart;

  window.buyNow = function buyNow() {
    window.addToCart("Armor Sconce", 129.99);
    window.checkout();
  };

  window.checkout = function checkout() {
    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }
    // Real storefront. Swap in per-product payhip.com/b/<code> links later if
    // you want each card to jump straight to its own payment page.
    const summary = "Your cart total is " + money(cartTotal()) + ". Opening PayHip…";
    if (window.location.href.startsWith("file://")) { alert(summary); return; }
    const note = document.createElement("div");
    note.textContent = summary;
    note.setAttribute("role", "status");
    note.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2500;" +
      "background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-color);" +
      "border-left:4px solid var(--accent-primary);border-radius:12px;padding:13px 18px;font-size:14px;" +
      "box-shadow:0 14px 40px var(--shadow-dark);max-width:min(92vw,520px)";
    document.body.appendChild(note);
    window.setTimeout(() => { window.location.href = PAYHIP_STORE; }, 500);
  };

  window.filterProducts = function filterProducts(category) {
    $$(".filter-btn").forEach((button) => {
      button.classList.toggle("active", button.textContent.toLowerCase().includes(category.replace("-", " ")) || category === "all" && button.textContent.includes("All"));
    });

    $$(".product-card").forEach((card) => {
      const visible = category === "all" || card.dataset.category === category;
      card.style.display = visible ? "" : "none";
    });
  };

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function setupTheme() {
    const toggle = $("#themeToggle");
    const icon = $(".theme-icon");

    function render() {
      if (icon) icon.textContent = isDark() ? "☀️" : "🌙";
    }

    // styles.css only exposes the dark palette through [data-theme="dark"],
    // so the attribute has to live on <html>; a body class matches nothing.
    // Dark is the brand default, light is opt-in and remembered.
    if (localStorage.getItem("heavenly-theme") === "light") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    render();

    toggle?.addEventListener("click", () => {
      if (isDark()) document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("heavenly-theme", isDark() ? "dark" : "light");
      render();
    });
  }

  function setupSelections() {
    $$(".color-btn").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".color-btn").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      });
    });

    $$(".size-btn").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".size-btn").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      });
    });

    const input = $("#quantity");
    input?.addEventListener("change", () => {
      quantity = Math.max(1, Number(input.value) || 1);
      input.value = quantity;
    });
  }

  function setupMobileNav() {
    const style = document.createElement("style");
    style.textContent =
      ".nav-burger{display:none;background:none;border:1px solid var(--border-color);border-radius:8px;" +
      "color:var(--text-primary);font-size:20px;line-height:1;padding:6px 10px;cursor:pointer;margin-left:12px}" +
      "@media (max-width:768px){.nav-burger{display:inline-flex}" +
      ".nav-menu.nav-open{display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;margin:0;" +
      "padding:16px 20px 20px;background:var(--bg-primary);gap:16px;border-bottom:1px solid var(--border-color);" +
      "box-shadow:0 14px 30px var(--shadow-dark);z-index:1200}" +
      ".nav-menu.nav-open a{font-size:16px;color:var(--text-primary)}}";
    document.head.appendChild(style);

    const bar = $(".navbar .nav-right") || $(".nav-wrapper");
    const menu = $(".nav-menu");
    if (!bar || !menu) return;
    if (!menu.id) menu.id = "navMenu";

    const burger = document.createElement("button");
    burger.type = "button";
    burger.className = "nav-burger";
    burger.setAttribute("aria-controls", "navMenu");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    burger.textContent = "\u2630";
    bar.appendChild(burger);

    const close = () => {
      menu.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
      burger.textContent = "\u2630";
    };
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      burger.textContent = open ? "\u2715" : "\u2630";
      if (open) menu.querySelector("a")?.focus({ preventScroll: true });
    });
    menu.addEventListener("click", (event) => { if (event.target.closest("a")) close(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 768) close(); });
  }

  function setupCartTrigger() {
    $(".cart-icon")?.addEventListener("click", (event) => {
      event.preventDefault();
      openCart();
    });
  }

  function setupNewsletter() {
    const section = $(".newsletter-form");
    const input = section?.querySelector("input");
    const button = section?.querySelector("button");

    button?.addEventListener("click", () => {
      if (!input?.checkValidity()) {
        input?.reportValidity();
        return;
      }
      button.textContent = "Subscribed ✓";
      button.disabled = true;
      input.disabled = true;
    });
  }

  function setupEscape() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCart();
    });
  }

  function boot() {
    setupTheme();
    setupMobileNav();
    setupSelections();
    setupCartTrigger();
    setupNewsletter();
    setupEscape();
    updateCart();
  }

  // A cached or restored page can reach "complete" before this listener is
  // attached, and then DOMContentLoaded never fires.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();