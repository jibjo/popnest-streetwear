/* ==========================================================================
   HEAVENLY.CO — Theme JS (Shopify OS 2.0)
   Vanilla JS. Modules: drawers/ui, AJAX cart, predictive search, wishlist,
   variant picker, shipping estimator, currency estimates, cookie consent,
   chat placeholder, consent-gated analytics. [INTEGRATION] marks hooks.
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const shop = window.HN_SHOP || { routes: {}, moneyFormat: "${{amount}}", freeShippingThreshold: 0 };
  const store = {
    get(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- Analytics (consent-gated) ----------
     [INTEGRATION] Add IDs in Theme settings → Analytics & pixels. The layout
     loads the vendor scripts only when IDs are present. */
  const analytics = {
    consent: store.get("hn_consent", null),
    allowed() { return this.consent && this.consent.analytics; },
    track(event, data = {}) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "hn_" + event, ...data });
      if (!this.allowed()) return;
      if (typeof gtag === "function") gtag("event", event, data);         // GA4
      if (typeof fbq === "function") fbq("trackCustom", event, data);      // Meta
      if (typeof ttq !== "undefined") ttq.track(event.charAt(0).toUpperCase() + event.slice(1).replace(/_/g, ""), data); // TikTok
    }
  };
  window.HN = window.HN || {};
  window.HN.analytics = analytics;

  /* ---------- Toast ---------- */
  function toast(msg) {
    const t = $("#hnToast");
    if (!t) return;
    t.querySelector("span").textContent = msg;
    t.classList.add("is-visible");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("is-visible"), 2600);
  }

  /* ---------- Money (Shopify format) ---------- */
  function money(cents) {
    const fmt = shop.moneyFormat || "${{amount}}";
    const amount = (cents / 100).toFixed(2);
    return fmt.replace(/\{\{\s*\w+\s*\}\}/, amount);
  }

  /* ---------- Currency estimates (labeled) ----------
     [INTEGRATION] For guaranteed multi-currency use Shopify Markets; the
     switcher below is a courtesy estimate via open exchange rates. */
  const FALLBACK_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.51, AED: 3.67, JPY: 156.8, INR: 83.5 };
  const currency = {
    active: store.get("hn_currency", shop.currency || "USD"),
    rates: { ...FALLBACK_RATES },
    async init() {
      const cached = store.get("hn_rates", null);
      if (cached && Date.now() - cached.ts < 7 * 864e5) this.rates = cached.rates;
      else {
        try {
          const d = await (await fetch("https://open.er-api.com/v6/latest/USD")).json();
          if (d && d.rates) { this.rates = { ...FALLBACK_RATES, ...d.rates }; store.set("hn_rates", { ts: Date.now(), rates: this.rates }); }
        } catch (e) {}
      }
      const sel = $("#currencySelect");
      if (sel) {
        sel.value = this.active;
        sel.addEventListener("change", () => {
          this.active = sel.value; store.set("hn_currency", sel.value);
          toast("Converted prices shown as " + sel.value + " estimates");
          analytics.track("currency_change", { currency: sel.value });
          this.refresh();
        });
      }
      this.refresh();
    },
    refresh() {
      if (this.active === (shop.currency || "USD")) return; // native money is authoritative
      $$("[data-price]").forEach((el) => {
        const cents = parseFloat(el.dataset.price);
        if (isNaN(cents)) return;
        const converted = (cents / 100) * (this.rates[this.active] || 1);
        el.innerHTML = this.fmt(converted) + ' <span class="price__est">≈ ' + this.active + " estimate</span>";
      });
    },
    fmt(v) { return (v).toLocaleString("en-US", { style: "currency", currency: this.active, maximumFractionDigits: 2 }); }
  };

  /* ---------- Cart (Shopify AJAX API) ---------- */
  const cart = {
    async get() { const r = await fetch(shop.routes.cart + ".js"); return r.json(); },
    async add(id, quantity = 1, properties) {
      const res = await fetch(shop.routes.cartAdd + ".js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id, quantity, properties }] })
      });
      const data = await res.json();
      if (res.ok) {
        toast("Added to bag");
        analytics.track("add_to_cart", { id, quantity });
        await this.refresh();
        ui.openDrawer("cartDrawer");
      } else toast(data.description || "Sorry — something went wrong");
      return res.ok;
    },
    async change(line, quantity) {
      await fetch(shop.routes.cartChange + ".js", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line, quantity })
      });
      await this.refresh();
    },
    async refresh() {
      const c = await this.get();
      const n = c.item_count;
      $$(".js-cart-count").forEach((el) => { el.textContent = n; el.classList.toggle("is-visible", n > 0); });
      const body = $("[data-cart-items]");
      if (body) {
        if (!n) {
          body.innerHTML = '<div class="cart-empty"><p><strong>' + "Your bag is empty" + '</strong></p><a class="btn btn--primary btn--small" href="' + (window.routes && routes.all_products_collection_url || "/collections/all") + '" data-drawer-close>Shop all</a></div>';
          const foot = $("#cartDrawerFoot"); if (foot) foot.style.display = "none";
        } else {
          body.innerHTML = c.items.map((i, idx) => `
            <div class="cart-line">
              <img src="${i.image}" alt="${i.product_title.replace(/"/g, "&quot;")}" loading="lazy">
              <div>
                <div class="cart-line__title">${i.product_title}</div>
                ${i.variant_title ? `<div class="cart-line__variant">${i.variant_title}</div>` : ""}
                <div class="cart-line__price">${money(i.final_line_price)}</div>
                <button class="cart-line__remove" data-cart-remove="${idx + 1}">Remove</button>
              </div>
              <div class="cart-line__right">
                <span class="qty">
                  <button data-cart-dec="${idx + 1}" aria-label="Decrease">−</button>
                  <input value="${i.quantity}" readonly aria-label="Quantity">
                  <button data-cart-inc="${idx + 1}" aria-label="Increase">+</button>
                </span>
              </div>
            </div>`).join("");
          const foot = $("#cartDrawerFoot"); if (foot) foot.style.display = "";
          const sub = $("[data-cart-subtotal]"); if (sub) sub.textContent = money(c.total_price);
          const bar = $("[data-freeship]");
          if (bar && shop.freeShippingThreshold > 0) {
            const remain = shop.freeShippingThreshold - c.total_price;
            bar.innerHTML = remain > 0
              ? `<p class="freeship-bar__text">You're <strong>${money(remain)}</strong> away from free shipping</p><div class="freeship-bar__track"><div class="freeship-bar__fill" style="width:${Math.min(100, (c.total_price / shop.freeShippingThreshold) * 100)}%"></div></div>`
              : `<p class="freeship-bar__text">✓ You've unlocked <strong>free shipping</strong> on this order</p><div class="freeship-bar__track"><div class="freeship-bar__fill" style="width:100%"></div></div>`;
          }
        }
      }
      analytics.track("cart_state", { count: c.item_count, value: c.total_price / 100 });
    }
  };
  window.HN.cart = cart;

  /* ---------- UI: drawers, reveals, accordions, tabs, sticky header ---------- */
  const ui = {
    init() {
      /* drawers */
      document.addEventListener("click", (e) => {
        const opener = e.target.closest("[data-drawer-open]");
        if (opener) { this.openDrawer(opener.dataset.drawerOpen); return; }
        if (e.target.closest("[data-drawer-close]") || e.target.classList.contains("drawer__scrim")) this.closeDrawers();
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") this.closeDrawers(); });

      /* sticky header */
      const header = $("#siteHeader");
      if (header) {
        const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
        onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
      }

      /* reveals */
      const els = $$("[data-reveal]");
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((ents) => ents.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
        }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        els.forEach((el) => io.observe(el));
      } else els.forEach((el) => el.classList.add("is-visible"));
      const hero = $(".hero"); if (hero) requestAnimationFrame(() => hero.classList.add("is-ready"));

      /* accordions */
      $$("[data-accordion] .accordion__trigger, .accordion__trigger").forEach((btn) => {
        btn.addEventListener("click", () => {
          const expanded = btn.getAttribute("aria-expanded") === "true";
          const content = document.getElementById(btn.getAttribute("aria-controls"));
          btn.setAttribute("aria-expanded", String(!expanded));
          if (content) content.style.maxHeight = expanded ? "0px" : content.scrollHeight + "px";
        });
      });

      /* tabs */
      $$(".tabs").forEach((wrap) => {
        const btns = $$(".tabs__nav button", wrap), panels = $$(".tabs__panel", wrap);
        btns.forEach((b, i) => b.addEventListener("click", () => {
          btns.forEach((x) => x.classList.remove("is-active")); panels.forEach((x) => x.classList.remove("is-active"));
          b.classList.add("is-active"); panels[i] && panels[i].classList.add("is-active");
        }));
      });

      /* announcement rotation */
      const msgs = $$(".announcement__msg");
      if (msgs.length > 1) {
        let i = 0;
        setInterval(() => { msgs[i].classList.remove("is-active"); i = (i + 1) % msgs.length; msgs[i].classList.add("is-active"); }, 4800);
      }

      /* quantity steppers */
      document.addEventListener("click", (e) => {
        const dec = e.target.closest('[data-qty="dec"]'), inc = e.target.closest('[data-qty="inc"]');
        if (dec || inc) {
          const wrap = (dec || inc).closest(".qty");
          const input = $("input", wrap);
          let v = parseInt(input.value || "1", 10) + (inc ? 1 : -1);
          input.value = Math.min(99, Math.max(1, v));
        }
      });

      /* cookie consent + prefs */
      this.cookieConsent();
      /* chat */
      this.chat();
      /* newsletter */
      this.newsletter();
      /* quick add */
      document.addEventListener("click", (e) => {
        const qa = e.target.closest("[data-quick-add]");
        if (qa) {
          const btn = qa;
          btn.disabled = true;
          this.fetchFirstAvailableVariant(qa.dataset.quickAdd).then((id) => {
            if (id) cart.add(id, 1);
            btn.disabled = false;
          });
          analytics.track("cta_click", { label: "quick_add", handle: qa.dataset.quickAdd });
        }
        const cta = e.target.closest("[data-track-cta]");
        if (cta) analytics.track("cta_click", { label: cta.dataset.trackCta });
      });

      /* cart line buttons */
      document.addEventListener("click", (e) => {
        const dec = e.target.closest("[data-cart-dec]"), inc = e.target.closest("[data-cart-inc]"), rm = e.target.closest("[data-cart-remove]");
        if (dec) { const line = +dec.dataset.cartDec; cart.change(line, 0); }  // handled below w/ current qty
        if (inc) { const line = +inc.dataset.cartInc; this.bumpLine(line, +1); }
        if (rm) cart.change(+rm.dataset.cartRemove, 0);
      });

      /* predictive search */
      this.predictiveSearch();

      /* shipping estimators */
      $$("[data-shipping-estimator]").forEach((f) => f.addEventListener("submit", (e) => {
        e.preventDefault();
        const country = $("select", f).value;
        const r = this.shippingEstimate(country, 0);
        const out = f.parentElement.querySelector(".ship-est-result");
        out.textContent = `Estimated shipping ${money(r.cost * 100)} — delivery ${r.window}. (Estimate; final rates at checkout.)`;
        analytics.track("shipping_estimate", { country });
      }));

      /* variant picker */
      this.variantPicker();

      /* wishlist */
      this.wishlistButtons();

      cart.refresh();
    },
    openDrawer(id) { const d = document.getElementById(id); if (!d) return; d.classList.add("is-open"); document.body.style.overflow = "hidden"; },
    closeDrawers() { $$(".drawer.is-open").forEach((d) => d.classList.remove("is-open")); document.body.style.overflow = ""; },
    cookieConsent() {
      const banner = $("#cookieBanner");
      const apply = (c) => { store.set("hn_consent", c); analytics.consent = c; banner && banner.classList.remove("is-visible"); this.closeDrawers(); toast("Cookie preferences saved"); };
      if (banner && !store.get("hn_consent", null)) setTimeout(() => banner.classList.add("is-visible"), 1200);
      document.addEventListener("click", (e) => {
        if (e.target.closest("[data-consent-accept]")) apply({ essential: true, analytics: true, marketing: true, ts: Date.now() });
        if (e.target.closest("[data-consent-reject]")) apply({ essential: true, analytics: false, marketing: false, ts: Date.now() });
        if (e.target.closest("[data-consent-manage]") || e.target.closest("[data-cookie-prefs]")) { e.preventDefault(); this.openDrawer("cookieDrawer"); }
      });
      const form = $("#cookiePrefsForm");
      if (form) form.addEventListener("submit", (e) => {
        e.preventDefault();
        apply({ essential: true, analytics: $("#ckAnalytics").checked, marketing: $("#ckMarketing").checked, ts: Date.now() });
      });
    },
    chat() {
      const w = $("#chatWidget"); if (!w) return;
      $("#chatFab").addEventListener("click", () => w.classList.toggle("is-open"));
      const form = $("#chatForm");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = $("#chatInput"); const v = input.value.trim(); if (!v) return;
        const body = $("#chatBody");
        const div = document.createElement("div");
        div.className = "chat-msg chat-msg--user"; div.textContent = v;
        body.appendChild(div); body.scrollTop = body.scrollHeight; input.value = "";
        analytics.track("chat_message", {});
      });
    },
    newsletter() {
      $$("form[action*='/contact'][id^='ContactFooter'], form.js-newsletter").forEach(() => {}); // Shopify form handles posting
    },
    predictiveSearch() {
      const input = $("#searchInput"), results = $("[data-predictive-results]");
      if (!input || !results) return;
      let t;
      input.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(async () => {
          const q = input.value.trim();
          if (q.length < 2) { results.innerHTML = ""; return; }
          /* [INTEGRATION] Shopify Predictive Search API — native, no key needed */
          const url = (shop.routes.predictiveSearch || "/search/suggest") + "?q=" + encodeURIComponent(q) + "&resources[type]=product&resources[limit]=6&section_id=predictive-search";
          try {
            const res = await fetch(url.replace("section_id=predictive-search", "resources[limit]=6"), { headers: { Accept: "application/json" } });
            const data = await res.json();
            const items = (((data.resources || {}).results || {}).product_results || {}).products || [];
            results.innerHTML = items.length
              ? items.map((p) => `<a class="search-result" href="${p.url}">
                  <img src="${p.featured_image.url}" alt="" width="64" height="64" loading="lazy">
                  <span><span class="r-title">${p.title}</span><br><span class="r-cat">${money(p.price)}</span></span></a>`).join("")
              : `<p class="muted" style="padding:12px 4px">No matches for “${q.replace(/</g, "&lt;")}”.</p>`;
            analytics.track("search", { query: q, results: items.length });
          } catch (e) { /* fall back to full search page submit */ }
        }, 250);
      });
      $$(".search-hints button").forEach((b) => b.addEventListener("click", () => { input.value = b.textContent; input.dispatchEvent(new Event("input")); }));
    },
    shippingEstimate(country, subtotalCents) {
      const zones = [
        { codes: ["US", "CA"], rate: 12.95, window: "3–7 business days" },
        { codes: ["GB", "IE", "FR", "DE", "ES", "IT", "NL", "SE"], rate: 18.95, window: "5–10 business days" },
        { codes: ["AU", "NZ"], rate: 24.95, window: "6–12 business days" },
        { codes: ["AE", "SA"], rate: 29.95, window: "7–14 business days" },
        { codes: ["IN", "JP", "SG"], rate: 26.95, window: "6–12 business days" },
        { codes: ["KE", "UG", "TZ", "NG", "ZA"], rate: 34.95, window: "8–16 business days" }
      ];
      const zone = zones.find((z) => z.codes.includes(country)) || { rate: 34.95, window: "8–16 business days" };
      /* [INTEGRATION] Replace with real carrier rates (Shopify checkout rates or a rates API). */
      if (shop.freeShippingThreshold > 0 && subtotalCents >= shop.freeShippingThreshold) return { cost: 0, window: zone.window };
      return { cost: zone.rate, window: zone.window };
    },
    bumpLine(line, delta) {
      cart.get().then((c) => {
        const item = c.items[line - 1];
        if (item) cart.change(line, Math.max(0, item.quantity + delta));
      });
    },
    async fetchFirstAvailableVariant(handle) {
      const res = await fetch("/products/" + handle + ".js");
      const p = await res.json();
      const v = p.variants.find((v) => v.available) || p.variants[0];
      return v ? v.id : null;
    },
    variantPicker() {
      $$("variant-picker").forEach((picker) => {
        const json = $("[data-variant-json]", picker);
        if (!json) return;
        const variants = JSON.parse(json.textContent);
        const form = picker.closest("form") || document;
        picker.addEventListener("change", () => {
          const selected = $$("input[type=radio]:checked", picker).map((i) => i.value);
          const match = variants.find((v) => selected.every((s) => v.options.includes(s)));
          if (!match) return;
          const url = new URL(location.href);
          url.searchParams.set("variant", match.id);
          history.replaceState({}, "", url);
          const priceEl = $("[data-product-price]");
          if (priceEl) priceEl.innerHTML = money(match.price) + (match.compare_at_price > match.price ? " <s>" + money(match.compare_at_price) + "</s>" : "");
          const sku = $("[data-sku]"); if (sku && match.sku) sku.textContent = "SKU " + match.sku;
          const btn = $("[data-add-to-cart]", form);
          const btnText = $("[data-add-to-cart-text]", form);
          if (btn) btn.disabled = !match.available;
          if (btnText) btnText.textContent = match.available ? "Add to bag" : "Sold out";
          analytics.track("variant_change", { variant: match.title });
        });
      });
    },
    wishlistButtons() {
      const list = store.get("hn_wishlist", []);
      $$("[data-wishlist-button]").forEach((b) => {
        const h = b.dataset.wishlistHandle;
        const active = list.includes(h);
        b.classList.toggle("is-active", active);
        const lbl = $("[data-wishlist-label]", b);
        if (lbl) lbl.textContent = active ? "Saved to wishlist" : "Add to wishlist";
        b.addEventListener("click", (e) => {
          e.preventDefault();
          const cur = store.get("hn_wishlist", []);
          const has = cur.includes(h);
          store.set("hn_wishlist", has ? cur.filter((x) => x !== h) : [...cur, h]);
          toast(has ? "Removed from wishlist" : "Saved to wishlist ♥");
          this.wishlistButtons();
          analytics.track("wishlist_toggle", { handle: h, saved: !has });
        });
      });
    }
  };
  window.HN.ui = ui;
  window.HN.money = money;

  document.addEventListener("DOMContentLoaded", () => { ui.init(); currency.init(); });
})();
