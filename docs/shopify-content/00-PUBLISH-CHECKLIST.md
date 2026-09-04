# Publish Heavenly.co on Shopify — Step-by-Step

No code copy-pasting required for the theme itself — you upload one ZIP.
Copy-pasting only happens for **policies and page text** (provided below).

---

## STEP 1 — Upload the theme (2 minutes)

1. Download **`heavenly-shopify-theme-v1.0.0.zip`** (repo root).
2. Shopify Admin → **Online Store → Themes** → **Add theme → Upload zip file**
   → choose the ZIP → **Add**.
3. Don't publish yet — set up content first (Steps 2–6), then click
   **Customize** to check the design, and only then **Publish**.

> Until you publish, your current live theme is untouched. Preview safely.

## STEP 2 — Import the products (3 minutes)

1. Download **`docs/shopify-products-import.csv`**.
2. Shopify Admin → **Products → Import** → add the CSV → **Preview → Import**.
3. 11 products, 12 variants (Arden has Textured Black + Brushed Bronze) are
   created with SEO metadata and tags pre-filled.
4. **Add photos**: open each product → Media → upload from
   `store/assets/img/`:

| Product | Image files |
|---|---|
| Arden | `product-arden-front.jpg`, `product-arden-angle.jpg`, `product-arden-glow.jpg`, `product-arden-detail.jpg`, `product-arden-entry.jpg` (set `product-arden-front` as first) |
| Strata | `product-strata.jpg` |
| Vela | `product-vela.jpg` |
| Meridian | `product-meridian.jpg` |
| Aurora | `product-aurora.jpg` |
| Halcyon | `product-halcyon.jpg` *(photography pending — placeholder until replaced)* |
| Cirrus / Ora / Terra / Nimbus / Ember | *(photography pending)* |

5. **Enter the real specs** on the Arden: open the product template in the
   theme editor and fill the “Specification row” blocks (dimensions, wattage,
   voltage, IP rating…) from your supplier datasheet. Nothing is hard-coded.

## STEP 3 — Create collections (5 minutes)

Admin → **Products → Collections** → create automated collections
(Condition: *Product tag is equal to* …):

| Title | Handle (set explicitly) | Tag condition |
|---|---|---|
| Outdoor Lighting | `outdoor-lighting` | `outdoor-lighting` |
| Wall Sconces | `wall-sconces` | `wall-sconces` |
| Pendant Lighting | `pendant-lighting` | `pendant-lighting` |
| Chandeliers | `chandeliers` | `chandeliers` |
| Lamps | `lamps` | `lamps` |
| Mirrors | `mirrors` | `mirrors` |
| Rugs | `rugs` | `rugs` |
| Home Accessories | `home-accessories` | `home-accessories` |
| Decorative Objects | `decorative-objects` | `decorative-objects` |
| New arrivals | `new` | `new` |
| Best sellers | `best-sellers` | `best-sellers` |

(The import tags already match these handles — collections fill themselves.)

## STEP 4 — Create navigation menus (5 minutes)

Admin → **Content → Menus** (or Navigation on older plans):

**Main menu** (`main-menu`, already the default):
- Home → `/` *(optional)*
- Shop → `/collections/all`
- Lighting → `/collections/pendant-lighting`
  - Outdoor Lighting → `/collections/outdoor-lighting`
  - Wall Sconces → `/collections/wall-sconces`
  - Pendant Lighting → `/collections/pendant-lighting`
  - Chandeliers → `/collections/chandeliers`
  - Lamps → `/collections/lamps`
- Outdoor → `/collections/outdoor-lighting`
  - Arden Wall Sconce → `/products/arden-modern-outdoor-wall-sconce`
- Home Decor → `/collections/mirrors`
  - Mirrors → `/collections/mirrors`
  - Rugs → `/collections/rugs`
  - Accessories → `/collections/home-accessories`
- New Arrivals → `/collections/new`
- Best Sellers → `/collections/best-sellers`
- About → `/pages/about-us`
- Contact → `/pages/contact`

**Footer menu** (`footer`): policies + support links (fill after Step 5):
Shipping Policy → `/policies/shipping-policy`, Refund Policy →
`/policies/refund-policy`, Privacy Policy → `/policies/privacy-policy`,
Terms → `/policies/terms-of-service`, FAQ → `/pages/faq`,
Track Order → `/pages/track-order`, Wishlist → `/pages/wishlist`,
Contact → `/pages/contact`.

## STEP 5 — Create pages (5 minutes)

Admin → **Online Store → Pages → Add page**. The **title** sets the handle —
use these exact titles:

| Page title | Content |
|---|---|
| `About Us` | Paste **`docs/shopify-content/pages/about-us.html`** in the HTML (`<>`) view. Fix image paths to your uploaded Files URLs. |
| `Contact` | Leave body empty — the theme's contact template renders the form. |
| `FAQ` | Leave body empty — the FAQ accordion is managed in the theme editor (Predefined template `page.faq`). |
| `Track Order` | Leave body empty — template `page.track-order` renders it. |
| `Wishlist` | Leave body empty — template `page.wishlist` renders it. |
| `Cookie Policy` | Paste **`docs/shopify-content/pages/cookie-policy.html`**. |
| `Accessibility` | Paste **`docs/shopify-content/pages/accessibility.html`**. |

> If a template doesn't auto-apply, open the page → **Theme template** dropdown → pick `page.contact` / `page.faq` / `page.track-order` / `page.wishlist`.

## STEP 6 — Policies (5 minutes, then legal review)

Admin → **Settings → Policies** → paste each file from
`docs/shopify-content/policies/` into its box:

- `privacy-policy.txt` → Privacy policy
- `refund-policy.txt` → Refund policy
- `shipping-policy.txt` → Shipping policy
- `terms-of-service.txt` → Terms of service

**Replace every `[PLACEHOLDER]`** (return window, processing time, address,
jurisdiction…) and have counsel review. The theme footer links to these
routes automatically.

## STEP 7 — Configure the theme editor (10 minutes)

**Online Store → Themes → Customize**:

1. **Header / Announcement** — menus are picked from Step 4.
2. **Hero section** — upload `store/assets/img/hero-exterior.jpg` as the
   background; set CTA links to the outdoor collection + best sellers.
3. **Flagship product** — select the Arden product.
4. **Featured collection / Customer favorites** — pick collections.
5. **Category grid** — pick each collection + card image:
   Outdoor → `product-arden-entry.jpg`, Sconces → `product-arden-glow.jpg`,
   Pendants → `product-vela.jpg`, Chandeliers → `product-meridian.jpg`,
   Lamps → `product-aurora.jpg` (mirrors/rugs pending photography).
6. **Lifestyle editorial** — upload `lifestyle-*.jpg` (pending — skip or
   use product photos until generated).
7. **Brand story** — image + text (pre-filled original copy).
8. **Theme settings**:
   - Store operations: free-shipping threshold (`150`), support email,
     **turn OFF “sample reviews” before launch**.
   - Analytics & pixels: leave blank until you have real IDs.
9. **Footer** — pick footer menu + social URLs (only real profiles).

## STEP 8 — Connect the business plumbing

- **Settings → Payments** — enable Shopify Payments + PayPal (footer payment
  icons auto-render only what's enabled).
- **Settings → Shipping and delivery** — real zones/rates (the storefront
  estimator is labelled an estimate; checkout shows your real rates).
- **Settings → Notifications** — order/shipping/delivery emails.
- **Settings → Domains** — connect `heavenly.co` (+ HTTPS is automatic).
- Optional apps: reviews (Judge.me / Okendo), email (Klaviyo),
  back-in-stock, chat (Shopify Inbox → paste embed in
  `snippets/chat-widget.liquid`).

## STEP 9 — Launch QA (1 hour)

- [ ] Test order end-to-end with Bogus Gateway / real $1 product
- [ ] Every `[PLACEHOLDER]` replaced (search the site for “[”)
- [ ] Sample reviews OFF (Theme settings)
- [ ] Menus/collections/pages all resolve — click every footer link
- [ ] Mobile pass (phone + Shopify app preview)
- [ ] Announcement bar text matches your real offers
- [ ] Google Search Console verified, sitemap submitted (`/sitemap.xml`)
- [ ] Password page removed: **Settings → Remove password** (this is the true "publish" switch for the store itself)

## STEP 10 — Publish

**Online Store → Themes → … → Publish** on the Heavenly theme. 🎉
