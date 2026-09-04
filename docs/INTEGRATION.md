# Heavenly.co — Integration & Launch Guide

Everything marked **[INTEGRATION]** in the code is a deliberate, documented
hook — nothing pretends to be connected. This guide walks through each one.

---

## 0. Fast path — upload, don't copy-paste

1. Download **`heavenly-shopify-theme-v1.0.0.zip`** (repo root — pre-packaged,
   validated, folders at zip root).
2. Shopify Admin → **Online Store → Themes → Add theme → Upload zip file**.
3. Follow **`docs/shopify-content/00-PUBLISH-CHECKLIST.md`**: import
   `docs/shopify-products-import.csv`, create menus/collections/pages, paste
   the policy texts from `docs/shopify-content/policies/`, configure in the
   theme editor, then **Publish**.
4. Theme code lives in `shopify-theme/` — edit and re-zip (folders at root)
   whenever you need changes, or use the theme editor's *Edit code*.

---

## 1. What's in this repository

| Path | What it is |
|---|---|
| `store/` | The **design preview** — a fully working static build of the storefront (homepage, PDP, shop with filters, cart, checkout preview, policies, blog). Serve it with any static server. Regenerate pages after editing `store/src/` with `python3 tools/build.py`. |
| `shopify-theme/` | The **production deliverable** — a complete Shopify Online Store 2.0 theme implementing the same design with native sections/settings/blocks. |
| `docs/` | This guide + the profit calculator tool. |
| `index.html` (repo root) | Pre-existing file from a previous project — unrelated, safe to remove. |

---

## 2. Install the Shopify theme (15 minutes)

1. Shopify admin → **Online Store → Themes → Add theme → Upload zip**.
   Zip the *contents* of `shopify-theme/` (folders `assets`, `config`,
   `layout`, `locales`, `sections`, `snippets`, `templates` at the zip root).
2. **Navigation → create menus**
   - `main-menu`: Shop · Lighting (with children: Outdoor Lighting, Wall Sconces, Pendant Lighting, Chandeliers, Lamps) · Outdoor (children: the sconce products) · Home Decor (children: Mirrors, Rugs, Accessories) · New Arrivals (`/collections/new`) · Best Sellers · About · Contact
   - `footer`: policy and category links.
3. **Collections** to create: `outdoor-lighting`, `wall-sconces`,
   `pendant-lighting`, `chandeliers`, `lamps`, `mirrors`, `rugs`,
   `home-accessories`, `decorative-objects`, plus `new` and `best-sellers`
   (automated collections using tags work well).
4. **Theme editor** → set the menus, hero image, featured/flagship products,
   category cards, lifestyle images. Every homepage section is a section with
   settings — no code edits needed.

## 3. Create the flagship product

Product: **Arden Modern Outdoor Wall Sconce**

- **Variants:** Finish → `Textured Black`, `Brushed Bronze`
- **Tags:** `outdoor`, `sconce`, `new`
- **Metafields** (Settings → Custom data → Products):
  - `custom.specifications` (multi-line text) — one row per line, format
    `Label|Value`, e.g. `Voltage|AC 100–240 V`. These render in the Specs tab.
  - `custom.features` (multi-line text) — pipe-separated bullet list.
  - `custom.warranty` (single line).
  - `custom.faqs` (JSON or use the FAQ section blocks instead).
- **Specifications blocks:** on the product template you can also add
  “Specification row” blocks and type exact supplier values directly in the
  theme editor — **specifications are never hard-coded in the theme.**
- ⚠ Confirm every spec (wattage, voltage, IP rating, dimensions) against the
  real supplier datasheet before launch. The preview uses example values.

## 4. Reviews (the integrity-first system)

The theme supports, in order of priority:

1. **Verified review metafields** — `reviews.rating.value` +
   `reviews.rating_count.value` (+ optional `reviews.reviews_list`). These are
   written by review apps or the Shopify Product Reviews import standard.
   They power star display, product cards, and `AggregateRating` schema.
2. **App blocks** — Judge.me / Loox / Okendo / Yotpo drop into the product
   template as `@app` blocks. Nothing else to wire.
3. **Sample mode** — *Theme settings → “Show clearly-labelled SAMPLE
   reviews”*. Renders **obviously labelled** sample reviews for design
   review. **Turn OFF before launch** — the store never shows fabricated
   reviews.

## 5. Live features — what's real, what's a hook

| Feature | Status in theme | How to go live |
|---|---|---|
| Live inventory | Native (`variant.available`, low-stock status at your threshold) | None — honest by design. No fake counters. |
| Shipping estimator | Zone-table estimate, labelled “estimate” | Replace `HN.ui.shippingEstimate()` in `assets/theme.js` with real carrier rates (Shopify checkout rates, EasyPost, Shippo) |
| Currency display | Estimate switcher (open.er-api.com, cached weekly), clearly labelled | For true multi-currency checkout use **Shopify Markets** |
| Order tracking | Page + honest “not connected” state | App proxy to Order API (order # + email both match) or AfterShip/17TRACK embed in `sections/track-order.liquid` |
| Live chat | Polished placeholder, honest status line | Paste your Shopify Inbox / Gorgias / Tidium embed in `snippets/chat-widget.liquid` |
| Search | Native Predictive Search API | None |
| Wishlist | localStorage (per-device) | Optional: app (e.g. Growave) or customer-metafield app for cross-device sync |
| Back-in-stock | “Sold out — alerts available” message | App (Klaviyo back-in-stock) using the same product page |

## 6. Analytics & pixels

- Events (`product_view`, `add_to_cart`, `checkout_started`, `search`,
  `newsletter_signup`, `wishlist_toggle`, `cta_click`, …) flow into
  `window.dataLayer` immediately and console.log in debug.
- Paste IDs in **Theme settings → Analytics & pixels** (GA4, Meta, TikTok,
  Google Ads). Vendors fire **only after analytics consent** via the cookie
  banner.
- Alternative: leave IDs empty and manage tags in Google Tag Manager.

## 7. Email automation (Klaviyo or Shopify Email)

Flows to create, mapped to the site's consent-gated hooks:

| Flow | Trigger |
|---|---|
| Welcome | Newsletter form (homepage section / footer) — explicit opt-in only |
| Abandoned cart | Checkout started, no order |
| Browse abandonment | `product_view` without add-to-cart |
| Order confirmation / Shipping / Delivery | Shopify native notifications |
| Review request | Fulfilled + X days (review app flow) |
| Back in stock | Product restock + subscriber |
| Win-back | No order in 90 days |

## 8. Checkout & payments

Checkout uses **Shopify's PCI-compliant checkout** (this is correct by
default — never rebuild checkout). Enable Shopify Payments / PayPal /
wallets in Settings → Payments; the footer payment icons render the
`shop.enabled_payment_types` automatically, so only *actually enabled*
methods appear. The static `store/checkout.html` is a **design preview
only** and transmits nothing.

## 9. Policies

Template pages exist in the static preview and as standard Shopify policy
pages (`/policies/...`). Fill every `[PLACEHOLDER]`:
`[RETURN WINDOW]`, `[RETURN ADDRESS]`, `[REFUND PROCESSING TIME]`,
`[PROCESSING TIME]`, `[FREE-SHIPPING THRESHOLD]`, `[BUSINESS HOURS]`,
`[GOVERNING JURISDICTION]`, `[PRIVACY CONTACT EMAIL]`.
**Have legal counsel review before launch.** No jurisdiction or compliance
(GDPR/CCPA) is claimed anywhere until you configure it.

## 10. SEO checklist

- ✅ Unique titles/descriptions (edit per product/collection/page in admin)
- ✅ Canonical URLs, Open Graph, Twitter cards (`snippets/meta-tags.liquid`)
- ✅ Product / Organization / WebSite / Breadcrumb / FAQ / Article schema
- ✅ Clean URLs, sitemap.xml (`/sitemap.xml` is automatic on Shopify),
  robots.txt (customise via `robots.txt.liquid` if needed)
- ✅ Semantic HTML, alt text on all imagery, lazy loading, responsive images
- TODO before launch: verify in Google Search Console; self-host fonts for
  Core Web Vitals; compress hero image.

## 11. Performance notes

- No JS libraries — ~30 KB of vanilla JS, deferred.
- One CSS file, system-grid design tokens.
- Responsive images with `srcset`/`widths` everywhere; hero uses
  `fetchpriority=high`.
- Animations are opacity/transform only (compositor-friendly) and fully
  disabled under `prefers-reduced-motion`.

## 12. Security notes

- No secrets in frontend code. Pixel IDs are the only client-side values and
  they are public by nature; API keys belong in server apps/proxies.
- Shopify handles checkout security, rate limiting and CSRF on forms.
- The preview cart/wishlist use localStorage only — no personal data leaves
  the browser.

## 13. Pre-launch QA (done on the preview; repeat on production)

- [x] All internal links/images resolve (automated check: `tools/build.py` era script in commit history)
- [x] No missing images (SVG placeholders documented for pending photography)
- [x] Placeholders only where intentionally marked `[...]`
- [x] Mobile pass at 360/390/768/1280 widths
- [x] Keyboard navigation + visible focus + Escape closes overlays
- [x] Reduced-motion respected
- [x] Console error pass
- [ ] Repeat with real products/reviews and turn sample reviews OFF

---

*Heavenly.co is an original brand. Nothing in this repository copies Novus
Decor's identity, copy, or imagery; the AliExpress listings were used only
as category/spec inspiration and are not referenced anywhere in the store.*
