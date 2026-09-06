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
    // Swap in per-product payhip.com/b/<code> links later for one-click buys.
    const note = "Your cart total is " + money(cartTotal()) + ". Opening PayHip…";
    if (window.location.protocol === "file:") { alert(note); return; }
    const toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.textContent = note;
    toast.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:60;" +
      "background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--gold);" +
      "color:var(--text);padding:13px 18px;font-size:11px;letter-spacing:1px";
    document.body.appendChild(toast);
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

  function setupTheme() {
    const toggle = $("#themeToggle");
    const icon = $(".theme-icon");
    const saved = localStorage.getItem("heavenly-theme");
    if (saved === "light") document.body.classList.add("light-theme");

    function render() {
      if (icon) icon.textContent = document.body.classList.contains("light-theme") ? "☀️" : "🌙";
    }

    toggle?.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      localStorage.setItem("heavenly-theme", document.body.classList.contains("light-theme") ? "light" : "dark");
      render();
    });

    render();
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

  function setupProductButtons() {
    // The redesign dropped inline onclick="" in favour of data-* attributes,
    // so the handlers have to be attached here or nothing is clickable.
    $$(".product-card .add-product").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(".product-card");
        if (!card) return;
        window.addToCart(card.dataset.product, Number(card.dataset.price));
      });
    });

    $$(".filter-btn[data-filter]").forEach((button) => {
      button.addEventListener("click", () => window.filterProducts(button.dataset.filter));
    });
  }

  function setupFlagship() {
    const add = $("#addArmor");
    add?.addEventListener("click", () => window.addToCart("Armor Sconce", 129.99));

    const buy = $("#buyArmor");
    buy?.addEventListener("click", () => {
      window.addToCart("Armor Sconce", 129.99);
      window.checkout();
    });

    // Quantity controls are element ids now (#increaseQty / #decreaseQty),
    // not onclick attributes, so bind them directly.
    $("#increaseQty")?.addEventListener("click", () => window.increaseQty());
    $("#decreaseQty")?.addEventListener("click", () => window.decreaseQty());

    // Finish and size choices on the flagship card.
    $$(".options button").forEach((button) => {
      button.addEventListener("click", () => {
        button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      });
    });
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

  function setupMobileNav() {
    const nav = $(".navbar nav");
    const actions = $(".nav-actions");
    if (!nav || !actions) return;

    const style = document.createElement("style");
    style.textContent =
      ".nav-burger{display:none}@media(max-width:800px){.nav-burger{display:block}" +
      ".navbar nav.nav-open{display:flex;position:absolute;top:84px;left:0;right:0;flex-direction:column;" +
      "gap:0;background:rgba(16,16,15,.98);border-bottom:1px solid var(--line);padding:10px 5% 18px;z-index:9}" +
      ".navbar nav.nav-open a{padding:14px 0;border-bottom:1px solid var(--line)}}" +
      "body.light-theme .navbar nav.nav-open{background:rgba(244,241,235,.98)}";
    document.head.appendChild(style);

    if (getComputedStyle(nav).position !== "static" && !document.querySelector(".navbar").style.position) {
      document.querySelector(".navbar").style.position = "sticky";
    }

    const burger = document.createElement("button");
    burger.type = "button";
    burger.className = "nav-burger icon-btn";
    burger.setAttribute("aria-controls", "primaryNav");
    burger.setAttribute("aria-expanded", "false");
    burger.textContent = "MENU";
    nav.id = nav.id || "primaryNav";
    actions.insertBefore(burger, actions.firstChild);

    const close = () => {
      nav.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
      burger.textContent = "MENU";
    };
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.textContent = open ? "CLOSE" : "MENU";
    });
    nav.addEventListener("click", (event) => { if (event.target.closest("a")) close(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 800) close(); });
  }

  function setupEscape() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCart();
    });
  }

  function boot() {
    setupTheme();
    setupSelections();
    setupProductButtons();
    setupFlagship();
    setupCartTrigger();
    setupMobileNav();
    setupNewsletter();
    setupEscape();
    updateCart();
  }

  // A restored/cached page can reach "complete" before this listener attaches,
  // and then DOMContentLoaded never fires.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();