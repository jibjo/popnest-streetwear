(() => {
  "use strict";

  const STORAGE_KEY = "heavenly-cart-v2";
  const FREE_SHIPPING_THRESHOLD = 100;
  const STANDARD_SHIPPING = 12;
  const PAYHIP_STORE = "https://payhip.com/Popnest";
  const PROMOS = { HEAVENLY10: 0.10, LIGHT10: 0.10 };
  let cart = safeLoad(STORAGE_KEY, []);
  let quantity = 1;
  let discount = 0;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const money = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
  function safeLoad(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
  function subtotal() { return cart.reduce((n, item) => n + item.price * item.qty, 0); }
  function shipping() { return subtotal() >= FREE_SHIPPING_THRESHOLD || subtotal() === 0 ? 0 : STANDARD_SHIPPING; }
  function total() { return Math.max(0, subtotal() * (1 - discount) + shipping()); }

  function renderCart() {
    const items = $("#cartItems");
    if (!items) return;
    $(".cart-count").textContent = cart.reduce((n, i) => n + i.qty, 0);
    $("#cartSubtotal").textContent = money(subtotal());
    $("#cartShipping").textContent = shipping() ? money(shipping()) : (subtotal() ? "FREE" : "$0.00");
    $("#cartTotal").textContent = money(total());

    items.innerHTML = cart.length ? cart.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-main"><div class="cart-item-name">${escapeHtml(item.name + (item.variant ? " — " + item.variant : ""))}</div><div class="cart-item-price">${money(item.price)}</div></div>
        <div class="cart-item-controls"><button data-cart-action="minus" data-index="${i}" aria-label="Decrease ${escapeHtml(item.name)}">−</button><span>${item.qty}</span><button data-cart-action="plus" data-index="${i}" aria-label="Increase ${escapeHtml(item.name)}">+</button><button data-cart-action="remove" data-index="${i}" aria-label="Remove ${escapeHtml(item.name)}">✕</button></div>
      </div>`).join("") : '<p class="empty-cart">Your bag is empty. Add something beautiful.</p>';

    $$("[data-cart-action]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const action = button.dataset.cartAction;
      if (action === "plus") cart[index].qty += 1;
      if (action === "minus") cart[index].qty = Math.max(1, cart[index].qty - 1);
      if (action === "remove") cart.splice(index, 1);
      save(); renderCart();
    }));
  }

  function escapeHtml(value) { const d = document.createElement("div"); d.textContent = value; return d.innerHTML; }
  function openCart() { $("#cartSidebar").classList.add("open"); }
  function closeCart() { $("#cartSidebar").classList.remove("open"); }
  function addToCart(name, price, qty = 1, variant = "") {
    const existing = cart.find((i) => i.name === name && i.price === Number(price) && (i.variant || "") === variant);
    if (existing) existing.qty += qty; else cart.push({ name, price: Number(price), qty, variant });
    save(); renderCart(); openCart();
  }

  function showModal(title, text) {
    $("#modalTitle").textContent = title; $("#modalText").textContent = text;
    const modal = $("#messageModal");
    $("#modalBackdrop").hidden = false;
    if (modal.showModal) modal.showModal(); else modal.setAttribute("open", "");
  }
  function closeModal() {
    const modal = $("#messageModal"); $("#modalBackdrop").hidden = true;
    if (modal.close) modal.close(); else modal.removeAttribute("open");
  }

  async function checkout() {
    if (!cart.length) return showModal("Your bag is empty", "Add a product before continuing to checkout.");
    const button = $("#checkoutButton");
    button.disabled = true; button.textContent = "PREPARING CHECKOUT…";
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map(({ name, qty }) => ({ name, quantity: qty })) })
      });
      if (!response.ok) throw new Error("Checkout service unavailable");
      const data = await response.json();
      if (!data.url) throw new Error("Invalid checkout response");
      location.href = data.url;
    } catch {
      showModal("Payment setup required", "The storefront is ready, but live payments require the secure checkout API to be deployed with the store's payment credentials. No payment details are collected on this website until that is connected.");
      const link = document.createElement("a");
      link.className = "gold-btn";
      link.href = PAYHIP_STORE;
      link.textContent = "PAY ON PAYHIP →";
      link.style.cssText = "margin-top:18px;width:max-content";
      $("#modalText").appendChild(link);
    } finally {
      button.disabled = false; button.textContent = "SECURE CHECKOUT →";
    }
  }

  function setupProducts() {
    $$(".add-product").forEach((button) => button.addEventListener("click", () => {
      const card = button.closest(".product-card"); addToCart(card.dataset.product, Number(card.dataset.price));
    }));
    $("#addArmor").addEventListener("click", () => addToCart("Armor Sconce", 129.99, quantity, variantLabel()));
    $("#buyArmor").addEventListener("click", () => { addToCart("Armor Sconce", 129.99, quantity, variantLabel()); checkout(); });
    $("#increaseQty").addEventListener("click", () => { quantity += 1; $("#quantity").value = quantity; });
    $("#decreaseQty").addEventListener("click", () => { quantity = Math.max(1, quantity - 1); $("#quantity").value = quantity; });
    $("#quantity").addEventListener("change", (e) => { quantity = Math.max(1, Number(e.target.value) || 1); e.target.value = quantity; });
  }

  const picked = {};
  function setupOptions() {
    $$(".options").forEach((group) => {
      const label = group.querySelector("span")?.textContent.trim().toLowerCase() || "";
      group.querySelectorAll("button").forEach((button) => {
        button.type = "button";
        button.addEventListener("click", () => {
          group.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === button));
          if (label) picked[label] = button.textContent.trim();
        });
      });
    });
  }
  function variantLabel() {
    return Object.keys(picked).sort().map((k) => picked[k]).filter(Boolean).join(" / ");
  }

  function setupFilters() {
    $$(".filter-btn").forEach((button) => button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      $$(".filter-btn").forEach((b) => b.classList.toggle("active", b === button));
      $$(".product-card").forEach((card) => card.hidden = filter !== "all" && card.dataset.category !== filter);
    }));
  }

  function setupPromo() {
    $("#applyPromo").addEventListener("click", () => {
      const code = $("#promoCode").value.trim().toUpperCase();
      discount = PROMOS[code] || 0;
      $("#promoMessage").textContent = discount ? "Promo applied: 10% off products." : "That promo code is not valid.";
      renderCart();
    });
  }

  function setupMobileNav() {
    const nav = $(".navbar nav"), actions = $(".nav-actions");
    if (!nav || !actions) return;
    const style = document.createElement("style");
    style.textContent =
      ".nav-burger{display:none}@media(max-width:800px){.nav-burger{display:block}" +
      ".navbar nav.nav-open{display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;" +
      "gap:0;background:rgba(16,16,15,.98);border-bottom:1px solid var(--line);padding:8px 5% 14px}" +
      ".navbar nav.nav-open a{padding:15px 0;border-bottom:1px solid var(--line)}}" +
      "body.light-theme .navbar nav.nav-open{background:rgba(244,241,235,.98)}";
    document.head.appendChild(style);
    const burger = document.createElement("button");
    burger.type = "button";
    burger.className = "nav-burger icon-btn";
    burger.id = "navToggle";
    burger.setAttribute("aria-controls", "primaryNav");
    burger.setAttribute("aria-expanded", "false");
    burger.textContent = "MENU";
    nav.id = nav.id || "primaryNav";
    actions.insertBefore(burger, actions.firstChild);
    const close = () => { nav.classList.remove("nav-open"); burger.textContent = "MENU"; burger.setAttribute("aria-expanded", "false"); };
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("nav-open");
      burger.textContent = open ? "CLOSE" : "MENU";
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 800) close(); });
  }

  function setupNewsletter() {
    $("#newsletterForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("#newsletterEmail");
      const msg = $("#newsletterMessage");
      if (!email.checkValidity()) return email.reportValidity();
      localStorage.setItem("heavenly-newsletter-email", email.value);
      msg.textContent = "You're on the list. Welcome to HEAVENLY.";
      e.target.reset();
    });
  }

  function setupPolicies() {
    const policies = {
      shipping: ["Shipping & Returns", "Orders over $100 qualify for complimentary standard shipping. Returns are accepted within 30 days of delivery for unused items in their original condition. Final shipping rates and delivery times are confirmed at secure checkout."],
      privacy: ["Privacy", "This storefront stores cart and theme preferences locally in your browser. Payment details should only be entered on the connected secure payment provider's checkout page."]
    };
    $$(".policy-link").forEach((button) => button.addEventListener("click", () => showModal(...policies[button.dataset.policy])));
  }

  function setupTheme() {
    if (localStorage.getItem("heavenly-theme") === "light") document.body.classList.add("light-theme");
    const render = () => $(".theme-icon").textContent = document.body.classList.contains("light-theme") ? "☀" : "◐";
    $("#themeToggle").addEventListener("click", () => { document.body.classList.toggle("light-theme"); localStorage.setItem("heavenly-theme", document.body.classList.contains("light-theme") ? "light" : "dark"); render(); });
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupOptions();
    setupMobileNav();
    renderCart(); setupProducts(); setupFilters(); setupPromo(); setupNewsletter(); setupPolicies(); setupTheme();
    $(".cart-icon").addEventListener("click", openCart); $("#closeCart").addEventListener("click", closeCart);
    $("#checkoutButton").addEventListener("click", checkout); $("#closeModal").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); closeModal(); } });
  });
})();