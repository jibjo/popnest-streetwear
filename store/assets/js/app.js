/* ==========================================================================
   HEAVENLY.CO — Storefront App (vanilla JS, no dependencies)
   --------------------------------------------------------------------------
   Modules:
     HN.money / HN.currency  — formatting + live conversion (labeled estimates)
     HN.cart                 — cart state + drawer (Shopify Cart AJAX in theme)
     HN.wishlist             — localStorage wishlist
     HN.analytics            — consent-gated event tracking (GA4 / Meta / TikTok ready)
     HN.ui                   — drawers, header, reveals, toast, chat, cookie consent
     HN.pages                — page renderers (PDP, shop, cart, checkout, wishlist…)
   Integration points are marked with: [INTEGRATION]
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const store = {
    get(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const byHandle = (h) => HN.PRODUCTS.find((p) => p.handle === h);

  /* ---------- Currency ----------
     [INTEGRATION] Live rates come from open.er-api.com (free, no key) with a
     weekly localStorage cache and static fallback. Converted prices are always
     labeled "est." — the charged currency is the store currency at checkout. */
  const FALLBACK_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.51, AED: 3.67, JPY: 156.8, INR: 83.5, KES: 129.5, UGX: 3760 };
  const CURRENCY_META = {
    USD: { symbol: "$", label: "USD — US Dollar" }, EUR: { symbol: "€", label: "EUR — Euro" },
    GBP: { symbol: "£", label: "GBP — British Pound" }, CAD: { symbol: "CA$", label: "CAD — Canadian Dollar" },
    AUD: { symbol: "A$", label: "AUD — Australian Dollar" }, AED: { symbol: "AED ", label: "AED — UAE Dirham" },
    JPY: { symbol: "¥", label: "JPY — Japanese Yen" }, INR: { symbol: "₹", label: "INR — Indian Rupee" },
    KES: { symbol: "KSh ", label: "KES — Kenyan Shilling" }, UGX: { symbol: "USh ", label: "UGX — Ugandan Shilling" }
  };
  const currency = {
    active: store.get("hn_currency", "USD"),
    rates: { ...FALLBACK_RATES },
    isLive: false,
    async init() {
      const cached = store.get("hn_rates", null);
      const fresh = cached && Date.now() - cached.ts < 7 * 864e5;
      if (fresh) { this.rates = cached.rates; this.isLive = true; }
      else {
        try {
          const res = await fetch("https://open.er-api.com/v6/latest/USD");
          const data = await res.json();
          if (data && data.rates) {
            this.rates = { ...FALLBACK_RATES, ...data.rates };
            this.isLive = true;
            store.set("hn_rates", { ts: Date.now(), rates: this.rates });
          }
        } catch (e) { /* offline preview — static fallback rates stay active */ }
      }
      const sel = $("#currencySelect");
      if (sel) {
        sel.value = this.active;
        sel.addEventListener("change", () => { this.set(sel.value); });
      }
      this.refresh();
    },
    set(code) {
      if (!CURRENCY_META[code]) return;
      this.active = code; store.set("hn_currency", code);
      this.refresh();
      HN.ui.toast(`Prices shown as ${code} estimates`);
      HN.analytics.track("currency_change", { currency: code });
    },
    convert(usd) { return usd * (this.rates[this.active] || 1); },
    fmt(v) {
      const meta = CURRENCY_META[this.active] || CURRENCY_META.USD;
      const n = this.active === "UGX" || this.active === "KES" ? Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 })
        : this.active === "JPY" ? Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 })
        : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return meta.symbol + n;
    },
    money(usd) { return this.fmt(this.convert(usd)); },
    isEstimate() { return this.active !== "USD"; },
    refresh() {
      $$("[data-price-usd]").forEach((el) => {
        const usd = parseFloat(el.dataset.priceUsd);
        el.innerHTML = this.money(usd) + (this.isEstimate() ? ' <span class="price__est">≈ ' + this.active + " estimate</span>" : "");
      });
      $$("[data-compare-usd]").forEach((el) => { el.textContent = this.money(parseFloat(el.dataset.compareUsd)); });
      document.dispatchEvent(new CustomEvent("hn:prices"));
    }
  };

  /* ---------- Money helper ---------- */
  function money(usd) { return currency.money(usd); }

  /* ---------- Analytics ----------
     [INTEGRATION] Set IDs in this config (or via GTM) — events flow to
     dataLayer immediately, and to GA4 / Meta / TikTok once IDs are supplied.
     Marketing/analytics events only fire after cookie consent. */
  const analyticsCfg = window.HN_ANALYTICS || { ga4Id: "", metaPixelId: "", tiktokId: "", debug: true };
  const analytics = {
    consent: null,
    init() { this.consent = store.get("hn_consent", null); },
    allowed() { return this.consent && this.consent.analytics; },
    track(event, data = {}) {
      const payload = { event: "hn_" + event, ...data, ts: Date.now(), page: location.pathname };
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
      if (analyticsCfg.debug) console.debug("[HN analytics]", event, data, this.allowed() ? "" : "(consent pending — queued to dataLayer)");
      if (!this.allowed()) return;
      if (typeof gtag === "function" && analyticsCfg.ga4Id) { /* gtag('event', event, data) — [INTEGRATION: GA4 ID] */ }
      if (typeof fbq === "function" && analyticsCfg.metaPixelId) { /* fbq('trackCustom', event, data) — [INTEGRATION: Meta Pixel ID] */ }
      if (typeof ttq !== "undefined" && analyticsCfg.tiktokId) { /* ttq.track(...) — [INTEGRATION: TikTok Pixel ID] */ }
    }
  };

  /* ---------- Cart ----------
     Static preview persists to localStorage.
     [INTEGRATION] Shopify theme version uses /cart/add.js + /cart/change.js
     (see shopify-theme/assets/theme.js) — same UI, live backend. */
  const cart = {
    items: store.get("hn_cart", []),
    listeners: [],
    onChange(fn) { this.listeners.push(fn); },
    emit() { this.listeners.forEach((f) => f()); this.renderAll(); },
    count() { return this.items.reduce((n, i) => n + i.qty, 0); },
    subtotal() { return this.items.reduce((n, i) => n + i.price * i.qty, 0); },
    add(handle, variantLabel, qty) {
      const p = byHandle(handle); if (!p) return;
      if (p.stockStatus === "out") { HN.ui.toast("This item is currently out of stock"); return; }
      qty = Math.max(1, qty | 0);
      const key = handle + "::" + (variantLabel || "");
      const existing = this.items.find((i) => i.key === key);
      if (existing) existing.qty += qty;
      else this.items.push({ key, handle, variant: variantLabel || null, qty, price: p.price, title: p.title, image: p.images[0].src });
      store.set("hn_cart", this.items);
      this.emit();
      HN.ui.toast("Added to bag — " + p.title);
      HN.analytics.track("add_to_cart", { item: p.title, variant: variantLabel, qty, value: p.price * qty });
      HN.ui.openCart();
    },
    updateQty(key, delta) {
      const it = this.items.find((i) => i.key === key); if (!it) return;
      it.qty += delta;
      if (it.qty <= 0) return this.remove(key);
      store.set("hn_cart", this.items); this.emit();
    },
    remove(key) {
      this.items = this.items.filter((i) => i.key !== key);
      store.set("hn_cart", this.items); this.emit();
      HN.analytics.track("remove_from_cart", { key });
    },
    clear() { this.items = []; store.set("hn_cart", this.items); this.emit(); },
    renderAll() {
      const n = this.count();
      $$(".js-cart-count").forEach((el) => { el.textContent = n; el.classList.toggle("is-visible", n > 0); });
      this.renderDrawer();
      if ($("#cartPageGrid")) this.renderCartPage();
      if ($("#checkoutSummary")) this.renderCheckoutSummary();
    },
    lineHTML(i) {
      return `<div class="cart-line" data-key="${esc(i.key)}">
        <img src="${esc(i.image)}" alt="${esc(i.title)}" loading="lazy">
        <div>
          <div class="cart-line__title">${esc(i.title)}</div>
          ${i.variant ? `<div class="cart-line__variant">${esc(i.variant)}</div>` : ""}
          <div class="cart-line__price">${money(i.price)}</div>
          <button class="cart-line__remove" data-remove="${esc(i.key)}">Remove</button>
        </div>
        <div class="cart-line__right">
          <span class="qty">
            <button data-dec="${esc(i.key)}" aria-label="Decrease quantity">−</button>
            <input value="${i.qty}" readonly aria-label="Quantity">
            <button data-inc="${esc(i.key)}" aria-label="Increase quantity">+</button>
          </span>
        </div>
      </div>`;
    },
    freeShipHTML() {
      const th = HN.CATALOG.freeShippingThreshold;
      const sub = this.subtotal();
      const pct = Math.min(100, (sub / th) * 100);
      const remain = th - sub;
      return `<div class="freeship-bar">
        <p class="freeship-bar__text">${sub >= th
          ? "✓ You’ve unlocked <strong>free shipping</strong> on this order"
          : `You’re <strong>${money(Math.max(0, remain))}</strong> away from free shipping`}</p>
        <div class="freeship-bar__track"><div class="freeship-bar__fill" style="width:${pct}%"></div></div>
      </div>`;
    },
    renderDrawer() {
      const body = $("#cartDrawerBody"); if (!body) return;
      if (!this.items.length) {
        body.innerHTML = `<div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
          <p><strong>Your bag is empty</strong></p>
          <p class="small muted">Discover lighting designed to transform everyday spaces.</p>
          <a class="btn btn--primary btn--small" href="shop.html" data-drawer-close>Shop all</a>
        </div>`;
        $("#cartDrawerFoot").style.display = "none";
        return;
      }
      $("#cartDrawerFoot").style.display = "";
      body.innerHTML = this.freeShipHTML() + this.items.map((i) => this.lineHTML(i)).join("");
      $("#cartSubtotal").textContent = money(this.subtotal());
    },
    renderCartPage() {
      const grid = $("#cartPageGrid");
      if (!this.items.length) {
        grid.innerHTML = `<div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
          <p><strong>Your bag is empty</strong></p>
          <a class="btn btn--primary" href="shop.html">Explore the collection</a></div>`;
        $("#cartPageSummary").style.display = "none";
        return;
      }
      $("#cartPageSummary").style.display = "";
      grid.innerHTML = this.freeShipHTML() + this.items.map((i) => this.lineHTML(i)).join("");
      $("#cartPageSubtotal").textContent = money(this.subtotal());
    },
    renderCheckoutSummary() {
      const box = $("#checkoutSummary"); if (!box) return;
      const sub = this.subtotal();
      box.innerHTML = this.items.map((i) => `<div class="summary-line">
          <img src="${esc(i.image)}" alt="">
          <div><div class="t">${esc(i.title)}</div><div class="v">${esc(i.variant || "")} · Qty ${i.qty}</div></div>
          <div style="margin-left:auto;font-weight:600;font-size:14px">${money(i.price * i.qty)}</div>
        </div>`).join("");
      const shipMethod = ($('input[name="shipMethod"]:checked') || {}).dataset;
      const shipCost = shipMethod && shipMethod.cost ? parseFloat(shipMethod.cost) : 0;
      const discount = this.discountAmount(sub);
      $("#coSubtotal").textContent = money(sub);
      $("#coShipping").textContent = sub >= HN.CATALOG.freeShippingThreshold ? "Free" : money(shipCost);
      $("#coDiscountRow").style.display = discount > 0 ? "" : "none";
      if (discount > 0) $("#coDiscount").textContent = "−" + money(discount);
      $("#coTotal").textContent = money(Math.max(0, sub + (sub >= HN.CATALOG.freeShippingThreshold ? 0 : shipCost) - discount));
    },
    /* [INTEGRATION] Sample discount code for the design preview. In production,
       discount codes are created in the Shopify admin (Discounts) and validated
       server-side at checkout. */
    discountAmount(sub) {
      const code = ($("#discountCode")?.value || "").trim().toUpperCase();
      if (code === "HEAVENLY10") return Math.round(sub * 0.10 * 100) / 100;
      return 0;
    }
  };

  /* ---------- Wishlist ---------- */
  const wishlist = {
    items: store.get("hn_wishlist", []),
    has(h) { return this.items.includes(h); },
    toggle(h) {
      const p = byHandle(h); if (!p) return;
      if (this.has(h)) { this.items = this.items.filter((x) => x !== h); HN.ui.toast("Removed from wishlist"); }
      else { this.items.push(h); HN.ui.toast("Saved to wishlist ♥"); }
      store.set("hn_wishlist", this.items);
      this.sync();
      HN.analytics.track("wishlist_toggle", { item: p.title, saved: this.has(h) });
    },
    sync() {
      const n = this.items.length;
      $$(".js-wish-count").forEach((el) => { el.textContent = n; el.classList.toggle("is-visible", n > 0); });
      $$(".js-wish-btn").forEach((b) => {
        const active = this.has(b.dataset.wish);
        b.classList.toggle("is-active", active);
        const lbl = b.querySelector(".js-wish-label");
        if (lbl) lbl.textContent = active ? "Saved to wishlist" : "Add to wishlist";
      });
      if ($("#wishlistGrid")) this.renderPage();
    },
    renderPage() {
      const grid = $("#wishlistGrid");
      if (!this.items.length) {
        grid.innerHTML = `<div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20s-7-4.6-9.3-8.6C.9 8 2.6 4.5 6 4.5c2.2 0 3.6 1.2 6 3.7 2.4-2.5 3.8-3.7 6-3.7 3.4 0 5.1 3.5 3.3 6.9C19 15.4 12 20 12 20z"/></svg>
          <p><strong>Your wishlist is empty</strong></p>
          <p class="small muted">Tap the heart on any product to save it here.</p>
          <a class="btn btn--primary btn--small" href="shop.html">Browse products</a></div>`;
        return;
      }
      grid.innerHTML = `<div class="product-grid product-grid--3">${this.items.map((h) => HN.ui.cardHTML(byHandle(h))).join("")}</div>`;
    }
  };

  /* ---------- Recently viewed ---------- */
  const recent = {
    push(handle) {
      let list = store.get("hn_recent", []).filter((h) => h !== handle);
      list.unshift(handle);
      store.set("hn_recent", list.slice(0, 8));
    },
    render(el) {
      const list = store.get("hn_recent", []).filter((h) => h !== (HN.currentPage || "")).map(byHandle).filter(Boolean).slice(0, 4);
      if (!list.length || !el) { if (el) el.closest(".section").style.display = "none"; return; }
      el.innerHTML = `<div class="product-grid product-grid--3">${list.map((p) => HN.ui.cardHTML(p)).join("")}</div>`;
    }
  };

  /* ---------- Shared UI ---------- */
  const ui = {
    init() {
      this.header();
      this.drawers();
      this.mobileMenu();
      this.searchOverlay();
      this.announcement();
      this.reveals();
      this.chat();
      this.cookieConsent();
      this.newsletterForms();
    },
    /* Header */
    header() {
      const header = $("#siteHeader");
      if (header) {
        const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
        onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
      }
      const y = new Date().getFullYear();
      $$(".js-year").forEach((el) => (el.textContent = y));
    },
    /* Drawers (cart, mobile menu, filters) */
    drawers() {
      const closeAll = () => $$(".drawer.is-open").forEach((d) => { d.classList.remove("is-open"); document.body.style.overflow = ""; });
      document.addEventListener("click", (e) => {
        const opener = e.target.closest("[data-drawer-open]");
        if (opener) {
          const d = $("#" + opener.dataset.drawerOpen);
          if (d) { d.classList.add("is-open"); document.body.style.overflow = "hidden";
            if (opener.dataset.drawerOpen === "cartDrawer") HN.analytics.track("cart_view", {}); }
        }
        if (e.target.closest("[data-drawer-close]") || e.target.classList.contains("drawer__scrim")) closeAll();
        if (e.target.closest(".js-wish-btn")) { e.preventDefault(); wishlist.toggle(e.target.closest(".js-wish-btn").dataset.wish); }
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
    },
    mobileMenu() {},
    searchOverlay() {
      const input = $("#searchInput"), results = $("#searchResults");
      if (!input) return;
      const run = () => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 2) { results.innerHTML = ""; return; }
        const matches = HN.PRODUCTS.filter((p) => (p.title + " " + p.category + " " + p.tags.join(" ")).toLowerCase().includes(q)).slice(0, 6);
        results.innerHTML = matches.length
          ? matches.map((p) => `<a class="search-result" href="product.html?handle=${p.handle}">
              <img src="${esc(p.images[0].src)}" alt="">
              <span><span class="r-title">${esc(p.title)}</span><br><span class="r-cat">${HN.catTitle(p.category)} · ${money(p.price)}</span></span>
            </a>`).join("")
          : `<p class="muted" style="padding:12px 4px">No matches for “${esc(input.value)}”. Try “sconce”, “pendant” or “mirror”.</p>`;
        if (q.length > 2) HN.analytics.track("search", { query: q, results: matches.length });
      };
      input.addEventListener("input", run);
      $$(".search-hints button").forEach((b) => b.addEventListener("click", () => { input.value = b.textContent; run(); }));
    },
    announcement() {
      const msgs = $$(".announcement__msg");
      if (msgs.length < 2) return;
      let idx = 0; msgs[0].classList.add("is-active");
      setInterval(() => {
        msgs[idx].classList.remove("is-active");
        idx = (idx + 1) % msgs.length;
        msgs[idx].classList.add("is-active");
      }, 4800);
    },
    reveals() {
      const els = $$("[data-reveal]");
      if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-visible")); return; }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      els.forEach((el) => io.observe(el));
    },
    toast(msg) {
      let t = $("#hnToast");
      if (!t) { t = document.createElement("div"); t.id = "hnToast"; t.className = "toast"; t.setAttribute("role", "status");
        t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg><span></span>';
        document.body.appendChild(t); }
      t.querySelector("span").textContent = msg;
      t.classList.add("is-visible");
      clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove("is-visible"), 2600);
    },
    /* Chat widget — polished front-end, clearly labelled as awaiting a live
       [INTEGRATION] point (Shopify Inbox / Gorgias / Tidium etc.). */
    chat() {
      const w = $("#chatWidget"); if (!w) return;
      $("#chatFab").addEventListener("click", () => {
        w.classList.toggle("is-open");
        if (w.classList.contains("is-open") && !w.dataset.greeted) {
          w.dataset.greeted = "1";
          this.botSay("Hi — thanks for stopping by Heavenly. Our human team replies within one business day at <strong>support@heavenly.co</strong>.");
          this.botSay("Live chat goes here the moment we connect our support desk — this panel is integration-ready.");
        }
      });
      const form = $("#chatForm"), input = $("#chatInput");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = input.value.trim(); if (!v) return;
        this.userSay(v); input.value = "";
        setTimeout(() => this.botSay("Message noted — for a guaranteed reply during the preview period, please email <strong>support@heavenly.co</strong> and we’ll help personally."), 700);
        HN.analytics.track("chat_message", {});
      });
    },
    botSay(html) { this.chatMsg(html, "bot"); },
    userSay(text) { this.chatMsg(esc(text), "user"); },
    chatMsg(html, who) {
      const body = $("#chatBody");
      const div = document.createElement("div");
      div.className = "chat-msg chat-msg--" + who;
      div.innerHTML = html;
      body.appendChild(div); body.scrollTop = body.scrollHeight;
    },
    /* Cookie consent — accept / reject / manage. Essential only by default. */
    cookieConsent() {
      const banner = $("#cookieBanner");
      const saved = store.get("hn_consent", null);
      const apply = (c) => { store.set("hn_consent", c); analytics.consent = c; banner.classList.remove("is-visible"); };
      if (!saved) setTimeout(() => banner.classList.add("is-visible"), 1400);
      else analytics.consent = saved;
      $$("[data-consent-accept]").forEach((b) => b.addEventListener("click", () => apply({ essential: true, analytics: true, marketing: true, ts: Date.now() })));
      $$("[data-consent-reject]").forEach((b) => b.addEventListener("click", () => apply({ essential: true, analytics: false, marketing: false, ts: Date.now() })));
      $$("[data-consent-manage]").forEach((b) => b.addEventListener("click", () => HN.ui.openDrawer("cookieDrawer")));
      const form = $("#cookiePrefsForm");
      if (form) form.addEventListener("submit", (e) => {
        e.preventDefault();
        apply({
          essential: true,
          analytics: $("#ckAnalytics").checked,
          marketing: $("#ckMarketing").checked,
          ts: Date.now()
        });
        HN.ui.toast("Cookie preferences saved");
        HN.ui.closeDrawers();
      });
      const reshow = $("#cookieSettingsLink");
      if (reshow) reshow.addEventListener("click", (e) => { e.preventDefault(); HN.ui.openDrawer("cookieDrawer"); });
    },
    newsletterForms() {
      $$("form.js-newsletter").forEach((form) => {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const email = form.querySelector('input[type="email"]');
          if (!email.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) { HN.ui.toast("Please enter a valid email address"); email.focus(); return; }
          /* [INTEGRATION] Connect Klaviyo / Shopify Customers API here.
             Marketing email is ONLY sent with this explicit opt-in. */
          HN.analytics.track("newsletter_signup", { source: form.dataset.source || "site" });
          const ok = form.parentElement.querySelector(".newsletter__success, .js-news-success");
          if (ok) ok.classList.add("is-visible");
          form.style.display = "none";
        });
      });
    },
    accordions(root) {
      $$(".accordion__trigger", root || document).forEach((btn) => {
        btn.addEventListener("click", () => {
          const expanded = btn.getAttribute("aria-expanded") === "true";
          const content = document.getElementById(btn.getAttribute("aria-controls"));
          btn.setAttribute("aria-expanded", String(!expanded));
          content.style.maxHeight = expanded ? "0px" : content.scrollHeight + "px";
        });
      });
    },
    tabs() {
      $$(".tabs").forEach((wrap) => {
        const btns = $$(".tabs__nav button", wrap);
        const panels = $$(".tabs__panel", wrap);
        btns.forEach((b, i) => b.addEventListener("click", () => {
          btns.forEach((x) => x.classList.remove("is-active"));
          panels.forEach((x) => x.classList.remove("is-active"));
          b.classList.add("is-active"); panels[i].classList.add("is-active");
        }));
      });
    },
    openDrawer(id) {
      const d = $("#" + id); if (!d) return;
      d.classList.add("is-open"); document.body.style.overflow = "hidden";
    },
    closeDrawers() {
      $$(".drawer.is-open").forEach((d) => d.classList.remove("is-open"));
      document.body.style.overflow = "";
    },
    openCart() { this.openDrawer("cartDrawer"); },
    /* Product card */
    cardHTML(p) {
      const badge = p.stockStatus === "out" ? '<span class="badge badge--out">Out of stock</span>'
        : p.stockStatus === "low" ? '<span class="badge badge--low">Low stock</span>'
        : p.tags.includes("new") ? '<span class="badge badge--new">New</span>' : "";
      return `<article class="card" data-reveal>
        <div class="card__media">
          ${badge ? `<div class="card__badges">${badge}</div>` : ""}
          <button class="card__wish js-wish-btn ${wishlist.has(p.handle) ? "is-active" : ""}" data-wish="${p.handle}" aria-label="Add ${esc(p.title)} to wishlist">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.6-9.3-8.6C.9 8 2.6 4.5 6 4.5c2.2 0 3.6 1.2 6 3.7 2.4-2.5 3.8-3.7 6-3.7 3.4 0 5.1 3.5 3.3 6.9C19 15.4 12 20 12 20z"/></svg>
          </button>
          <a href="product.html?handle=${p.handle}" aria-label="${esc(p.title)}">
            <img src="${esc(p.images[0].src)}" alt="${esc(p.images[0].alt)}" loading="lazy" width="600" height="750">
          </a>
          ${p.stockStatus !== "out" ? `<button class="card__quick" data-quick-add="${p.handle}">Add to bag</button>` : ""}
        </div>
        <div class="card__info">
          <span class="card__cat">${HN.catTitle(p.category)}</span>
          <h3 class="card__title"><a href="product.html?handle=${p.handle}">${esc(p.title)}</a></h3>
          <div class="card__row">
            <span class="price" data-price-usd="${p.price}"></span>
            ${p.sampleReviews ? `<span class="rating-row"><span class="stars">${HN.starsHTML(5)}</span> Sample</span>` : ""}
          </div>
        </div>
      </article>`;
    }
  };

  /* ---------- Shared helpers exposed ---------- */
  HN.catTitle = (slug) => (HN.CATALOG.categories.find((c) => c.slug === slug) || {}).title || slug;
  HN.starsHTML = (rating, of = 5) => {
    let html = "";
    for (let i = 1; i <= of; i++) {
      const lit = i <= Math.round(rating);
      html += `<svg viewBox="0 0 24 24" fill="currentColor" class="${lit ? "" : "dim"}"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z"/></svg>`;
    }
    return `<span class="stars ${rating ? "" : "stars--empty"}" aria-label="${rating} out of ${of} stars">${html}</span>`;
  };
  HN.ui = ui; HN.cart = cart; HN.wishlist = wishlist; HN.recent = recent; HN.analytics = analytics; HN.currency = currency; HN.money = money;

  /* ---------- Shipping estimator ----------
     [INTEGRATION] Preview uses a transparent zone table. In production, rates
     come from your carrier/fulfilment setup at checkout (Shopify returns live
     rates). Estimates here are labelled as estimates. */
  const SHIP_ZONES = [
    { countries: ["US", "CA"], names: ["United States", "Canada"], rate: 12.95, freeOver: 150, window: "3–7 business days" },
    { countries: ["GB", "IE", "FR", "DE", "ES", "IT", "NL", "SE", "DK", "FI", "PT", "AT", "BE", "PL"], names: ["United Kingdom", "Ireland", "France", "Germany", "Spain", "Italy", "Netherlands", "Sweden", "Denmark", "Finland", "Portugal", "Austria", "Belgium", "Poland"], rate: 18.95, freeOver: 150, window: "5–10 business days" },
    { countries: ["AU", "NZ"], names: ["Australia", "New Zealand"], rate: 24.95, freeOver: 200, window: "6–12 business days" },
    { countries: ["AE", "SA", "QA", "KW"], names: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait"], rate: 29.95, freeOver: 250, window: "7–14 business days" },
    { countries: ["KE", "UG", "TZ", "NG", "ZA", "GH"], names: ["Kenya", "Uganda", "Tanzania", "Nigeria", "South Africa", "Ghana"], rate: 34.95, freeOver: 250, window: "8–16 business days" },
    { countries: ["IN", "JP", "SG", "HK", "KR"], names: ["India", "Japan", "Singapore", "Hong Kong SAR", "South Korea"], rate: 26.95, freeOver: 200, window: "6–12 business days" },
    { countries: ["*"], names: ["Rest of world"], rate: 34.95, freeOver: 250, window: "8–16 business days" }
  ];
  HN.shipping = {
    zones: SHIP_ZONES,
    estimate(countryCode, subtotal) {
      const zone = SHIP_ZONES.find((z) => z.countries.includes(countryCode)) || SHIP_ZONES.find((z) => z.countries[0] === "*");
      if (subtotal != null && subtotal >= (zone.freeOver ?? Infinity)) return { cost: 0, window: zone.window, free: true };
      return { cost: zone.rate, window: zone.window, free: false };
    },
    countryOptions() {
      return SHIP_ZONES.flatMap((z) => z.names.map((n) => ({ name: n, code: z.countries[SHIP_ZONES.indexOf(z)] })));
    }
  };
  function bindShipEstimator(rootSel) {
    const form = $(rootSel); if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const country = form.querySelector("select").value;
      const sub = cart.subtotal() || null;
      const r = HN.shipping.estimate(country, sub);
      const out = form.parentElement.querySelector(".ship-est-result");
      out.innerHTML = r.free
        ? `✓ <strong>Free shipping</strong> to ${esc(form.querySelector("select").selectedOptions[0].text)} — estimated delivery ${r.window}.`
        : `Estimated shipping <strong>${money(r.cost)}</strong> to ${esc(form.querySelector("select").selectedOptions[0].text)} — delivery ${r.window}.`;
      HN.analytics.track("shipping_estimate", { country });
    });
  }
  HN.bindShipEstimator = bindShipEstimator;

  /* ---------- Page: Product (PDP) ---------- */
  function renderPDP() {
    const params = new URLSearchParams(location.search);
    const handle = params.get("handle") || "arden-modern-outdoor-wall-sconce";
    const p = byHandle(handle);
    const root = $("#pdpRoot");
    if (!p) { location.href = "404.html"; return; }
    HN.currentPage = handle;
    recent.push(handle);
    document.title = `${p.title} — Heavenly.co`;
    const md = $('meta[name="description"]');
    if (md) md.setAttribute("content", p.description.slice(0, 155));

    /* Gallery */
    const gal = $("#pdpGallery");
    gal.innerHTML = `
      <div class="gallery__main" id="galMain" role="button" tabindex="0" aria-label="Zoom product image">
        <span class="gallery__badge badge badge--new">Flagship</span>
        <img id="galImg" src="${esc(p.images[0].src)}" alt="${esc(p.images[0].alt)}" width="1000" height="1100">
      </div>
      <div class="gallery__thumbs">${p.images.map((im, i) => `
        <button class="gallery__thumb ${i === 0 ? "is-active" : ""}" data-thumb="${i}" aria-label="View image ${i + 1}">
          <img src="${esc(im.src)}" alt="" loading="lazy" width="200" height="200">
        </button>`).join("")}
      </div>
      <p class="gallery__hint"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M11 8v6M8 11h6"/></svg> Hover to zoom · click to enlarge</p>`;

    const main = $("#galMain"), img = $("#galImg");
    main.addEventListener("mousemove", (e) => {
      const r = main.getBoundingClientRect();
      main.style.setProperty("--zx", ((e.clientX - r.left) / r.width) * 100 + "%");
      main.style.setProperty("--zy", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
    main.addEventListener("mouseenter", () => main.classList.add("zooming"));
    main.addEventListener("mouseleave", () => main.classList.remove("zooming"));
    main.addEventListener("click", () => {
      const lb = $("#lightbox");
      $("#lightboxImg").src = img.src; $("#lightboxImg").alt = img.alt;
      lb.classList.add("is-open"); HN.analytics.track("image_zoom", { item: p.title });
    });
    $("#lightbox").addEventListener("click", () => $("#lightbox").classList.remove("is-open"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#lightbox").classList.remove("is-open"); });

    $$("#pdpGallery .gallery__thumb").forEach((t) => t.addEventListener("click", () => {
      $$("#pdpGallery .gallery__thumb").forEach((x) => x.classList.remove("is-active"));
      t.classList.add("is-active");
      const im = p.images[+t.dataset.thumb];
      img.style.opacity = 0;
      setTimeout(() => { img.src = im.src; img.alt = im.alt; img.style.opacity = 1; }, 180);
    }));

    /* Buy panel */
    const stock = p.stockStatus === "in" ? '<span class="stock"><span class="stock__dot"></span>In stock — ready to ship</span>'
      : p.stockStatus === "low" ? '<span class="stock stock--low"><span class="stock__dot"></span>Low stock</span>'
      : '<span class="stock stock--out"><span class="stock__dot"></span>Out of stock — back-in-stock alerts available</span>';
    $("#pdpBuy").innerHTML = `
      <p class="eyebrow">${HN.catTitle(p.category)}</p>
      <h1>${esc(p.title)}</h1>
      <div class="buy-panel__meta">
        <span>SKU ${esc(p.sku)}</span>
        ${p.sampleReviews ? `<span class="rating-row"><span class="stars">${HN.starsHTML(5)}</span> <a href="#reviews">Sample reviews</a></span>` : `<a class="rating-row" href="#reviews">No reviews yet — be the first</a>`}
      </div>
      <div class="buy-panel__price">
        <span class="price" data-price-usd="${p.price}"></span>
        ${p.compareAtPrice ? `<s data-compare-usd="${p.compareAtPrice}"></s>` : ""}
      </div>
      <p class="buy-panel__tax">Tax included. Shipping calculated at checkout.</p>
      ${stock}
      <p class="lede mt-4">${esc(p.description)}</p>
      <ul class="prose-list mt-4" style="display:grid;gap:8px;padding-left:20px;color:var(--ink-soft)">
        ${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}
      </ul>
      <div class="option-group">
        <span class="option-group__label">${esc(p.variants[0].option)} <span>— ${esc(p.variants[0].label)}</span></span>
        <div class="swatches" role="radiogroup" aria-label="${esc(p.variants[0].option)}">
          ${p.variants.map((v, i) => `
            <button class="swatch ${i === 0 ? "is-active" : ""}" role="radio" aria-checked="${i === 0}" data-variant="${i}">
              <span class="swatch__dot" style="background:${esc(v.hex)}"></span>${esc(v.label)}
            </button>`).join("")}
        </div>
      </div>
      <div class="qty-row">
        <span class="qty">
          <button id="qtyDec" aria-label="Decrease quantity">−</button>
          <input id="qtyInput" value="1" readonly aria-label="Quantity">
          <button id="qtyInc" aria-label="Increase quantity">+</button>
        </span>
        <button class="btn btn--primary" id="pdpAdd">Add to bag — <span data-price-usd="${p.price}"></span></button>
      </div>
      <div class="buy-panel__ctas">
        <button class="btn btn--accent" id="pdpBuyNow">Buy it now</button>
        <a class="btn btn--ghost" href="wishlist.html">View wishlist</a>
      </div>
      <div class="wish-line">
        <button class="wish-btn js-wish-btn" data-wish="${p.handle}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.6-9.3-8.6C.9 8 2.6 4.5 6 4.5c2.2 0 3.6 1.2 6 3.7 2.4-2.5 3.8-3.7 6-3.7 3.4 0 5.1 3.5 3.3 6.9C19 15.4 12 20 12 20z"/></svg>
          <span class="js-wish-label">Add to wishlist</span>
        </button>
      </div>
      <div class="assurance mt-6">
        <div class="assurance__row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="1.5" y="6" width="15" height="11" rx="2"/><path d="M16.5 10h3l2.5 3v4h-5.5M5.5 20a2 2 0 1 0 0-.01M18 20a2 2 0 1 0 0-.01"/></svg>
          <div><strong>Shipping estimate</strong>
            <form class="ship-est-form" id="pdpShipForm">
              <select aria-label="Country">${SHIP_ZONES.flatMap((z) => z.names.map((n, i) => `<option value="${z.countries[0]}">${esc(i === 0 ? n : z.names[0])}</option>`)).join("")}</select>
              <input placeholder="Postal code" aria-label="Postal code">
              <button class="btn btn--ghost btn--small">Check</button>
            </form>
            <div class="ship-est-result" aria-live="polite"></div>
          </div>
        </div>
        <div class="assurance__row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"/></svg>
          <div><strong>Easy returns</strong><span>See our Returns &amp; Refunds policy for eligibility and the current return window.</span></div>
        </div>
        <div class="assurance__row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2l8 4v6c0 5-3.5 8.4-8 10-4.5-1.6-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>
          <div><strong>Secure checkout</strong><span>256-bit SSL. Payment processed by our payment provider at checkout — card details never touch our servers.</span></div>
        </div>
        <div class="assurance__row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          <div><strong>${esc(p.warranty.label)}</strong><span>${esc(p.warranty.value)}</span></div>
        </div>
      </div>
      <p class="secure-note mt-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
        SSL secured · ${["VISA", "MASTERCARD", "AMEX", "PAYPAL"].map((x) => `<strong>${x}</strong>`).join(" · ")} — enabled when the payment gateway is connected
      </p>`;

    /* Variant / qty / add-to-cart wiring */
    let activeVariant = 0, qty = 1;
    $$("#pdpBuy .swatch").forEach((s) => s.addEventListener("click", () => {
      $$("#pdpBuy .swatch").forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-checked", "false"); });
      s.classList.add("is-active"); s.setAttribute("aria-checked", "true");
      activeVariant = +s.dataset.variant;
      $(".option-group__label span", $("#pdpBuy")).textContent = "— " + p.variants[activeVariant].label;
      currency.refresh();
    }));
    const qtyInput = $("#qtyInput");
    $("#qtyDec").addEventListener("click", () => { qty = Math.max(1, qty - 1); qtyInput.value = qty; });
    $("#qtyInc").addEventListener("click", () => { qty = Math.min(99, qty + 1); qtyInput.value = qty; });
    $("#pdpAdd").addEventListener("click", () => cart.add(p.handle, p.variants[activeVariant].label, qty));
    $("#pdpBuyNow").addEventListener("click", () => {
      if (p.stockStatus === "out") return HN.ui.toast("Out of stock");
      cart.add(p.handle, p.variants[activeVariant].label, qty);
      HN.ui.closeDrawers();
      setTimeout(() => (location.href = "checkout.html"), 350);
      HN.analytics.track("checkout_started", { item: p.title, source: "buy_now" });
    });

    bindShipEstimator("#pdpShipForm");
    currency.refresh();

    /* Specs table (admin-configurable in the Shopify theme) */
    $("#pdpSpecs").innerHTML = `
      <table class="spec-table">
        ${p.specs.map((s) => `<tr><th scope="row">${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join("")}
      </table>
      <p class="spec-note">⚠ ${esc(p.specsNote)}</p>`;

    /* FAQs (accordion + schema) */
    $("#pdpFaq").innerHTML = p.faqs.map((f, i) => `
      <div class="accordion__item">
        <h3><button class="accordion__trigger" aria-expanded="false" aria-controls="pf${i}">${esc(f.q)}
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button></h3>
        <div class="accordion__content" id="pf${i}"><div class="accordion__content-inner">${esc(f.a)}</div></div>
      </div>`).join("");
    HN.ui.accordions($("#pdpFaq"));

    /* Reviews — sample-labelled on flagship, honest empty state otherwise */
    const revRoot = $("#pdpReviews");
    if (p.sampleReviews) {
      revRoot.innerHTML = `
        <div class="demo-banner" style="margin-bottom:24px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 11v5"/></svg>
          <span><strong>Sample content.</strong> The reviews below are clearly-labelled design samples. At launch this section is powered by verified-purchase reviews from our review platform — fabricated reviews are never used.</span>
        </div>
        <div class="reviews-summary">
          <div class="reviews-summary__score">
            <div class="big">5.0</div>
            ${HN.starsHTML(5)}
            <p class="small muted mt-2">${p.sampleReviews.length} sample reviews</p>
          </div>
          <div class="reviews-summary__bars">${[5].map((s) => `
            <div class="rbar"><span>${s} ★</span><div class="rbar__track"><div class="rbar__fill" data-w="100"></div></div><span>100%</span></div>`).join("")}
          </div>
        </div>
        <div class="reviews-grid">${p.sampleReviews.map((r) => `
          <article class="review-card">
            <div class="review-card__head">
              <div class="review-card__avatar">${esc(r.author.replace("Sample review — ", "").slice(0, 1))}</div>
              <div>
                <div class="review-card__name">${esc(r.author)}</div>
                <div class="review-card__meta">${HN.starsHTML(r.rating)} <span>· ${esc(r.date)}</span>
                  ${r.verified ? `<span class="verified-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg> Verified purchase</span>` : ""}
                </div>
              </div>
            </div>
            <strong>${esc(r.title)}</strong>
            <p>${esc(r.body)}</p>
          </article>`).join("")}
        </div>`;
    } else {
      revRoot.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z"/></svg>
        <p><strong>No reviews yet</strong></p>
        <p class="small muted">Reviews appear here after verified customers share theirs. We only publish reviews from real, confirmed orders.</p>
      </div>`;
    }

    /* Frequently bought together */
    const fbtHandles = ["arden-modern-outdoor-wall-sconce", "vela-opal-dome-pendant", "aurora-ribbed-table-lamp"].filter((h) => h !== handle).slice(0, 2);
    const fbtList = [p, ...fbtHandles.map(byHandle)];
    $("#pdpFbt").innerHTML = `
      <div class="fbt__row">
        ${fbtList.map((fp, i) => `
          ${i > 0 ? '<span class="fbt__plus">+</span>' : ""}
          <label class="fbt__item">
            <input type="checkbox" checked data-fbt-price="${fp.price}" data-fbt-handle="${fp.handle}" data-fbt-variant="${esc(fp.variants[0].label)}">
            <img src="${esc(fp.images[0].src)}" alt="${esc(fp.title)}">
            <span class="t">${esc(fp.title)}</span>
            <span class="p" data-price-usd="${fp.price}"></span>
          </label>`).join("")}
        <div class="fbt__cta">
          <div class="fbt__total">Bundle total <strong id="fbtTotal"></strong></div>
          <button class="btn btn--primary btn--small" id="fbtAdd">Add selected to bag</button>
        </div>
      </div>`;
    const fbtTotal = () => {
      const sum = $$("#pdpFbt input:checked").reduce((n, i) => n + parseFloat(i.dataset.fbtPrice), 0);
      $("#fbtTotal").textContent = money(sum);
    };
    $$("#pdpFbt input").forEach((i) => i.addEventListener("change", fbtTotal));
    fbtTotal();
    $("#fbtAdd").addEventListener("click", () => {
      $$("#pdpFbt input:checked").forEach((i) => cart.add(i.dataset.fbtHandle, i.dataset.fbtVariant, 1));
      HN.analytics.track("fbt_add", { items: $$("#pdpFbt input:checked").length });
    });

    /* Related products */
    const related = HN.PRODUCTS.filter((x) => x.handle !== p.handle && (x.category === p.category || x.tags.some((t) => p.tags.includes(t)))).slice(0, 4);
    $("#pdpRelated").innerHTML = `<div class="product-grid">${related.map((x) => HN.ui.cardHTML(x)).join("")}</div>`;
    ui.reveals();

    /* Product structured data (Product schema) */
    const schema = {
      "@context": "https://schema.org", "@type": "Product",
      name: p.title, description: p.description, sku: p.sku,
      brand: { "@type": "Brand", name: "Heavenly" },
      image: p.images.map((i) => i.src),
      offers: {
        "@type": "Offer", price: p.price, priceCurrency: "USD",
        availability: p.stockStatus === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        url: location.href
      }
    };
    $("#pdpSchema").textContent = JSON.stringify(schema);

    HN.analytics.track("product_view", { item: p.title, handle: p.handle, price: p.price });
  }

  /* ---------- Page: Shop / collections ---------- */
  function renderShop() {
    const grid = $("#shopGrid"); if (!grid) return;
    const params = new URLSearchParams(location.search);
    const state = {
      cats: params.get("category") ? [params.get("category")] : [],
      q: params.get("q") || "",
      max: null, min: null,
      colors: [], materials: [],
      inStockOnly: false,
      sort: params.get("sort") || "featured"
    };
    if (state.q) { const s = $("#shopSearch"); if (s) s.value = state.q; }

    /* Pre-compute facet values */
    const colors = [...new Set(HN.PRODUCTS.flatMap((p) => p.variants.map((v) => v.label)))];
    const materials = [...new Set(HN.PRODUCTS.flatMap((p) => (p.specs.find((s) => s.label === "Material")?.value || "").split(",").map((m) => m.trim()).filter(Boolean)))];

    const aside = $("#shopFilters");
    aside.innerHTML = `
      <div class="filters__group">
        <div class="filters__group-title">Category</div>
        ${HN.CATALOG.categories.map((c) => {
          const n = HN.PRODUCTS.filter((p) => p.category === c.slug).length;
          if (!n) return "";
          return `<label class="check-row"><input type="checkbox" value="${c.slug}" data-f="cat" ${state.cats.includes(c.slug) ? "checked" : ""}> ${c.title} <span class="count">${n}</span></label>`;
        }).join("")}
      </div>
      <div class="filters__group">
        <div class="filters__group-title">Price</div>
        <div class="price-inputs">
          <input type="number" id="fMin" placeholder="Min $" min="0" aria-label="Minimum price">
          <span>–</span>
          <input type="number" id="fMax" placeholder="Max $" min="0" aria-label="Maximum price">
        </div>
        <div class="chip-filters mt-3">
          <button data-price-chip="0,100">Under $100</button>
          <button data-price-chip="100,250">$100–250</button>
          <button data-price-chip="250,9999">$250+</button>
        </div>
      </div>
      <div class="filters__group">
        <div class="filters__group-title">Colour / finish</div>
        ${colors.slice(0, 8).map((c) => `<label class="check-row"><input type="checkbox" value="${esc(c)}" data-f="color"> ${esc(c)}</label>`).join("")}
      </div>
      <div class="filters__group">
        <div class="filters__group-title">Material</div>
        ${materials.slice(0, 8).map((m) => `<label class="check-row"><input type="checkbox" value="${esc(m)}" data-f="material"> ${esc(m)}</label>`).join("")}
      </div>
      <div class="filters__group">
        <div class="filters__group-title">Availability</div>
        <label class="check-row"><input type="checkbox" id="fStock" data-f="stock"> In stock only</label>
      </div>
      <button class="btn btn--ghost btn--small w-full mt-4" id="clearFilters">Clear all filters</button>`;

    const apply = () => {
      let list = [...HN.PRODUCTS];
      if (state.cats.length) list = list.filter((p) => state.cats.includes(p.category));
      if (state.q) list = list.filter((p) => (p.title + " " + p.tags.join(" ")).toLowerCase().includes(state.q.toLowerCase()));
      if (state.min != null) list = list.filter((p) => p.price >= state.min);
      if (state.max != null) list = list.filter((p) => p.price <= state.max);
      if (state.colors.length) list = list.filter((p) => p.variants.some((v) => state.colors.includes(v.label)));
      if (state.materials.length) list = list.filter((p) => state.materials.some((m) => (p.specs.find((s) => s.label === "Material")?.value || "").includes(m)));
      if (state.inStockOnly) list = list.filter((p) => p.stockStatus !== "out");
      const sorters = {
        "price-asc": (a, b) => a.price - b.price,
        "price-desc": (a, b) => b.price - a.price,
        "title": (a, b) => a.title.localeCompare(b.title),
        "featured": (a, b) => (b.tags.includes("bestseller-sample") ? 1 : 0) - (a.tags.includes("bestseller-sample") ? 1 : 0)
      };
      list.sort(sorters[state.sort] || sorters.featured);

      $("#shopCount").textContent = list.length + (list.length === 1 ? " product" : " products");
      const active = [];
      state.cats.forEach((c) => active.push([c, HN.catTitle(c)]));
      state.colors.forEach((c) => active.push([c, c]));
      state.materials.forEach((m) => active.push([m, m]));
      $("#activeFilters").innerHTML = active.map(([v, l]) => `<button data-clear="${esc(v)}">${esc(l)} ✕</button>`).join("");

      grid.innerHTML = list.length
        ? `<div class="product-grid product-grid--3">${list.map((p) => ui.cardHTML(p)).join("")}</div>`
        : `<div class="empty-state"><p><strong>No products match those filters</strong></p><p class="small muted">Try removing a filter or browsing the full collection.</p><button class="btn btn--primary btn--small" id="clearFilters2">Clear filters</button></div>`;
      const cf = $("#clearFilters2"); if (cf) cf.addEventListener("click", reset);
      ui.reveals();
      currency.refresh();
      $$("#activeFilters button").forEach((b) => b.addEventListener("click", () => {
        const v = b.dataset.clear;
        state.cats = state.cats.filter((x) => x !== v);
        state.colors = state.colors.filter((x) => x !== v);
        state.materials = state.materials.filter((x) => x !== v);
        syncInputs(); apply();
      }));
      HN.analytics.track("collection_view", { count: list.length });
    };
    const syncInputs = () => {
      $$('input[data-f="cat"]', aside).forEach((i) => (i.checked = state.cats.includes(i.value)));
      $$('input[data-f="color"]', aside).forEach((i) => (i.checked = state.colors.includes(i.value)));
      $$('input[data-f="material"]', aside).forEach((i) => (i.checked = state.materials.includes(i.value)));
      $("#fStock").checked = state.inStockOnly;
      $("#fMin").value = state.min ?? ""; $("#fMax").value = state.max ?? "";
    };
    const reset = () => {
      Object.assign(state, { cats: [], q: "", min: null, max: null, colors: [], materials: [], inStockOnly: false });
      syncInputs(); apply();
    };
    aside.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.f === "cat") { state.cats = $$('input[data-f="cat"]:checked', aside).map((i) => i.value); }
      if (t.dataset.f === "color") { state.colors = $$('input[data-f="color"]:checked', aside).map((i) => i.value); }
      if (t.dataset.f === "material") { state.materials = $$('input[data-f="material"]:checked', aside).map((i) => i.value); }
      if (t.dataset.f === "stock") state.inStockOnly = t.checked;
      apply();
    });
    aside.addEventListener("input", (e) => {
      if (e.target.id === "fMin") state.min = e.target.value === "" ? null : parseFloat(e.target.value);
      if (e.target.id === "fMax") state.max = e.target.value === "" ? null : parseFloat(e.target.value);
      if (e.target.id === "fMin" || e.target.id === "fMax") apply();
    });
    aside.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-price-chip]");
      if (chip) { const [a, b] = chip.dataset.priceChip.split(","); state.min = +a; state.max = +b; syncInputs(); apply(); }
      if (e.target.id === "clearFilters") reset();
    });
    $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; apply(); });
    const ftoggle = $("#filtersToggle");
    if (ftoggle) ftoggle.addEventListener("click", () => $("#shopFilters").classList.toggle("is-open"));
    const shopSearch = $("#shopSearch");
    if (shopSearch) shopSearch.addEventListener("input", () => { state.q = shopSearch.value; apply(); });

    /* Heading reflects category deep-link */
    if (state.cats.length === 1) {
      const c = HN.CATALOG.categories.find((x) => x.slug === state.cats[0]);
      if (c) { $("#shopTitle").textContent = c.title; $("#shopLede").textContent = c.tagline + " — designed, finished and packed with care.";
        $('input[data-f="cat"][value="' + c.slug + '"]').checked = true; }
    }
    apply();
    recent.render($("#recentShelf"));
  }

  /* ---------- Page: Checkout preview ---------- */
  function renderCheckout() {
    if (!$("#checkoutSummary")) return;
    if (!cart.items.length) { location.href = "cart.html"; return; }
    cart.renderCheckoutSummary();
    $$('input[name="shipMethod"]').forEach((r) => r.addEventListener("change", () => {
      $$(".radio-card").forEach((c) => c.classList.remove("is-active"));
      r.closest(".radio-card").classList.add("is-active");
      cart.renderCheckoutSummary();
      HN.analytics.track("shipping_method_selected", { method: r.value });
    }));
    const dc = $("#discountCode");
    if (dc) dc.addEventListener("input", () => cart.renderCheckoutSummary());
    const form = $("#checkoutForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      /* [INTEGRATION] Production checkout never runs on the storefront:
         customers are redirected to Shopify's PCI-compliant checkout (or a
         custom server checkout) where the payment gateway validates payment.
         This preview demonstrates the flow without collecting any payment data. */
      HN.analytics.track("checkout_started", { step: "details_complete" });
      $("#checkoutMain").style.display = "none";
      const done = $("#orderConfirm");
      done.style.display = "";
      done.scrollIntoView({ behavior: "smooth" });
      HN.analytics.track("purchase_completed_demo", { value: cart.subtotal() });
      cart.clear();
    });
  }

  /* ---------- Page: Track order (demo) ---------- */
  function renderTrackOrder() {
    const form = $("#trackForm"); if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const num = $("#trackNum").value.trim(), email = $("#trackEmail").value.trim();
      if (!num || !email) return;
      $("#trackResult").innerHTML = `
        <div class="demo-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 11v5"/></svg>
          <span><strong>Demo response.</strong> Order <strong>${esc(num)}</strong> isn’t in a live system yet. At launch this page queries the order API with the order number + email (or tracking number) and shows live carrier status.</span>
        </div>
        <div class="checkout-box">
          <h3><span class="step-num">✓</span> Order received</h3>
          <p class="small muted">Order #${esc(num)} · updates sent to ${esc(email)}</p>
          <div class="mt-4" style="display:grid;gap:0">
            ${["Order placed", "Preparing for dispatch", "In transit", "Delivered"].map((s, i) => `
              <div class="assurance__row" style="border-bottom:1px solid var(--line-soft)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" style="color:${i === 0 ? "var(--success)" : "var(--ink-faint)"}"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
                <div><strong>${s}</strong><span>${i === 0 ? "Confirmed — confirmation email sent" : i === 1 ? "We’re packing your order" : i === 2 ? "Carrier updates appear here" : "Enjoy your Heavenly pieces"}</span></div>
              </div>`).join("")}
          </div>
        </div>`;
      HN.analytics.track("track_order_search", {});
    });
  }

  /* ---------- Page: Contact ---------- */
  function renderContact() {
    const form = $("#contactForm"); if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      $$("[required]", form).forEach((f) => {
        const bad = !f.value.trim() || (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
        f.closest(".field").classList.toggle("is-invalid", bad);
        if (bad) valid = false;
      });
      if (!valid) return;
      /* [INTEGRATION] Wire to Shopify Contact form / helpdesk (e.g. Gorgias,
         Zendesk) or a server endpoint with spam protection + rate limiting. */
      HN.analytics.track("contact_submit", { topic: $("#contactTopic")?.value });
      form.style.display = "none";
      $("#contactSuccess").style.display = "";
    });
  }

  /* ---------- Page: Cart ---------- */
  function renderCartPage() { cart.renderAll(); }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    analytics.init();
    ui.init();
    cart.onChange(() => {});
    cart.renderAll();
    wishlist.sync();
    currency.init();

    /* Global click: quick add + analytics CTA clicks */
    document.addEventListener("click", (e) => {
      const qa = e.target.closest("[data-quick-add]");
      if (qa) { const p = byHandle(qa.dataset.quickAdd); cart.add(p.handle, p.variants[0].label, 1); }
      const cta = e.target.closest("[data-track-cta]");
      if (cta) HN.analytics.track("cta_click", { label: cta.dataset.trackCta });
    });

    /* Page renderers */
    if ($("#pdpRoot")) renderPDP();
    if ($("#shopGrid")) renderShop();
    if ($("#checkoutSummary")) renderCheckout();
    if ($("#trackForm")) renderTrackOrder();
    if ($("#contactForm")) renderContact();
    if ($("#cartPageGrid")) renderCartPage();
    ui.tabs();
    ui.accordions();
    bindShipEstimator("#cartShipForm");

    /* Hero entrance */
    const hero = $(".hero");
    if (hero) requestAnimationFrame(() => hero.classList.add("is-ready"));

    /* Product JSON-LD for non-PDP pages is inlined server-side via the build;
       Organization + WebSite schema ship in the head partial. */
  });
})();
