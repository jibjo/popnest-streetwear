# HEAVENLY.CO — Complete Theme Analysis
# What's in the code + everything you can do WITHOUT touching code

---

# PART A — BRAND IDENTITY (encoded in the code)

| Element | Value | Where it lives |
|---|---|---|
| Brand name | **Heavenly** / Heavenly.co | Theme settings (`brand_wordmark`) — editable in editor |
| Tagline | LIGHTING & DÉCOR | Theme settings (`brand_tagline`) — editable in editor |
| Logo | Circular "sun/light" SVG mark + serif wordmark | `sections/header.liquid` — replace with your own logo image in editor |
| Primary accent | Brass `#a8875a`, deep brass `#7c6238`, tint `#f3ece1` | Theme settings (`color_accent`) — editable in editor |
| Dark color | Night `#131518` (footer, announcement, dark sections) | Theme settings (`color_night`) — editable in editor |
| Backgrounds | Warm ivory `#faf8f4`, warm panel `#f4f0e9`, white `#ffffff` | CSS variables |
| Text colors | Ink `#191a1c`, soft `#52565c`, faint `#8a8d92` | CSS variables |
| Status colors | Success green `#2e7d4f`, warning amber `#b07818`, danger red `#b3402e` | CSS variables |
| Display font | **Fraunces** (elegant serif, used for headlines) | Google Fonts in `layout/theme.liquid` |
| Body font | **Inter** (clean modern sans) | Google Fonts in `layout/theme.liquid` |
| Brand voice | Warm, honest, premium-but-accessible ("Light up your space with modern elegance") | Section defaults — all editable in editor |
| Flagship product | Arden Modern Outdoor Wall Sconce ($149, 2 finishes) | Selected in editor; imported via CSV |

---

# PART B — DESIGN SYSTEM INVENTORY (assets/theme.css, 59KB, zero dependencies)

## Layout components
- `.container` — 1280px max-width, responsive gutters
- `.section` / `.section--tight` — consistent vertical rhythm (56–112px, viewport-scaled)
- Section backgrounds: white surface, warm cream, full dark ("night")
- Grids: 4/3/2-column product grids, 4-column category grid, 3-column trust/blog/review grids

## Every UI component in the stylesheet
1. **Buttons** — 5 styles (primary black, brass accent, ghost outline, ghost-light for dark bg, white) × 2 sizes × full-width, with hover lift + shadow animations
2. **Announcement bar** — dark strip, rotating messages with fade animation
3. **Header** — sticky with blur/glass effect, adds shadow on scroll, dropdown menus (hover + keyboard accessible), icon buttons with animated count badges, currency mini-select, hamburger for mobile
4. **Drawers** (slide-in panels) — cart drawer, search overlay (slides from top), mobile menu, cookie preferences — all with scrim, Escape-to-close, body scroll lock
5. **Hero** — full-bleed image with slow Ken-Burns zoom-in, layered dark gradient, glass "kicker" pill, staggered text entrance, dual CTAs
6. **Marquee** — infinite scrolling category strip with ✦ separators
7. **Product cards** — 4:5 image with hover zoom, badges (New / Sale / Low stock / Sold out), wishlist heart button, quick-add bar sliding up on hover, price with strikethrough compare-at, star ratings
8. **Category cards** — image tiles with dark gradient, serif labels, arrow slide animation
9. **Product page (PDP)** — sticky gallery with hover-zoom (mouse-tracking transform-origin), thumbnail strip, lightbox, buy panel with swatch variant picker, pill quantity stepper, stock status dots (green/amber/red glow), assurance rows, shipping-estimator form
10. **Tabs** — vertical tab nav (sticky) on desktop, horizontal scroll on mobile, fade-in panels
11. **Accordion** — animated max-height open/close, rotating chevron
12. **Reviews** — score card, animated rating bars, review cards with avatars + verified pills, star-input widget, demo banners for sample content
13. **Editorial/lifestyle grid** — mixed-width image figures with caption overlays
14. **Split feature** (brand story) — image + text half/half, floating "glass" card on image
15. **Stats band** — 4-up big numbers on dark background
16. **Trust cards** — icon + title + copy, hover lift
17. **Blog cards** — image zoom hover, tag/title/excerpt/meta
18. **Article layout** — 760px reading column, styled headings, blockquotes with brass rule
19. **Newsletter** — dark section with pulsing radial glow animation, pill email form
20. **Footer** — 5-column, social buttons with hover lift, payment icons, legal row
21. **Cart** — line items with qty stepper, free-shipping progress bar (animated fill), empty state
22. **Forms** — labelled fields, invalid states (red border + error text), radio-cards for shipping methods, toggle switches (cookie prefs)
23. **Chat widget** — floating FAB (morphs + to ✕), chat panel with bot/user bubbles, online-status dot
24. **Cookie banner** — bottom-left card, accept/reject/manage, preferences drawer with toggles
25. **Toast notifications** — centered bottom pill, auto-dismiss
26. **Utility classes** — spacing (mt-0…mt-7), flex helpers, `.prose` typographic style for page content, `.placeholder-token` for `[PLACEHOLDER]` highlighting

## All 12 animations in the code (54 transition/animation rules total)
| # | Animation | Where | Trigger |
|---|---|---|---|
| 1 | Ken-Burns slow zoom + fade | Hero image | Page load |
| 2 | Staggered text rise (0.12s steps) | Hero kicker/h1/lede/CTAs | Page load |
| 3 | Scroll reveal (fade + 26px rise) | Every section/card (`data-reveal`) | Enters viewport |
| 4 | Image scale 1.05–1.06 | Product/category/blog/lifestyle cards | Hover |
| 5 | Quick-add bar slide-up | Product cards | Hover |
| 6 | Badge/count pop (scale 0→1) | Cart & wishlist counts | Item added |
| 7 | Marquee infinite scroll | Category strip | Continuous |
| 8 | Glow pulse (scale + opacity) | Newsletter radial glow | Continuous |
| 9 | Accordion max-height + chevron rotate | FAQs | Click |
| 10 | Drawer slide + scrim fade | All drawers | Open/close |
| 11 | Toast rise + fade | Notifications | Event |
| 12 | Button lift (+2px, shadow grow) | All buttons | Hover |
- **All animations respect `prefers-reduced-motion`** — they auto-disable for users who request reduced motion. Print stylesheet hides chrome.

## Responsive behavior (mobile-first priority)
- **Breakpoints:** 1100px (tablet-landscape), 960px (tablet — nav collapses to drawer, PDP stacks, filters become bottom sheet), 640px (phone — 2-col product grids, stacked CTAs, single-column forms)
- Filters turn into a **bottom-sheet drawer** on mobile; sticky sidebars unstick
- Hero shrinks 88vh → 78vh on phones; newsletter form stacks

## Accessibility built into the code
Skip-to-content link · visible focus rings (brass outline) · semantic landmarks (`header/nav/main/footer`) · proper heading hierarchy · Escape closes all overlays · `aria-expanded`/`aria-controls` on accordions & menus · `aria-live` on search results, cart, toasts, ship estimates · labelled form fields with error announcements · alt text everywhere · AA-contrast palette

---

# PART C — PAGE-BY-PAGE: WHAT THE CODE RENDERS

## Homepage (templates/index.json — 11 sections in order)
1. **Hero** — Arden launch kicker, "Light Up Your Space With Modern Elegance", 2 CTAs (Shop Outdoor Lighting / Explore Best Sellers)
2. **Featured collection** — 8 products from any collection you pick
3. **Flagship product** — "Meet the Arden" showcase with 4 bullet blocks
4. **Trust bar** — 6 cards: Secure checkout, Order tracking, Reachable support, Clear returns, Transparent shipping, Quality you can verify
5. **Category grid** — up to 9 collection cards (Outdoor, Sconces, Pendants, Chandeliers, Lamps, Mirrors, Rugs, Accessories…)
6. **Customer favorites** — second featured-collection instance (4 products)
7. **Lifestyle editorial** — 4 image scenes with captions ("The living room, after sunset"…)
8. **Brand story** — split image/text with original copy (no fake founding dates/awards)
9. **Stats band** — IP65 · 30k hrs · 2 yr · 3000 K
10. **Blog posts** — latest 3 journal articles
11. **Newsletter** — "Bring Better Design Home" + privacy note (Shopify-native customer form)

## Global (every page)
- Rotating announcement bar (up to 4 messages)
- Sticky glass header: logo, menu with dropdowns, currency selector, search, wishlist, account, cart
- Cart drawer: AJAX add/update/remove, free-shipping progress to your threshold
- Predictive search overlay (native Shopify API)
- Cookie consent (accept / essential-only / manage) — gates all analytics
- Chat widget placeholder (honest "connects at launch")
- Footer with policy links + payment icons (auto-renders only enabled gateways)

## Product page (templates/product.json)
Gallery (zoom + lightbox + thumbs) → vendor → title → price (+% off badge when compare-at set) → honest inventory status (threshold-based low stock) → description → feature bullets (metafield) → variant swatches → qty + Add to bag → wishlist → dynamic wallet buttons → shipping estimator → assurance rows → warranty → **tabs**: Specifications (owner-entered), Installation & care (from any page), Shipping & returns, FAQ (metafield) → **reviews** (verified → labelled samples → honest empty) → Frequently bought together → Related products.

## Other templates
Collection (native filters + sort) · List of collections (9 category cards) · Cart · Search · 404 ("This room is dark") · Page · FAQ (8 pre-written Q&A with schema) · Contact (native form + quick links) · Track order · Wishlist · Blog + Article (with schema) · Gift card · 7 customer account pages (login, register, reset, activate, account, order, addresses)

---

# PART D — ★ EVERYTHING YOU CAN DO WITHOUT CODE ★

## D1. In the theme editor (Online Store → Customize) — drag, drop, type. NO CODE.

### Add / remove / reorder / repeat entire sections
Every homepage section is a library block. Click **Add section** and choose any of:
`Hero · Featured collection · Flagship product · Trust bar · Category grid · Lifestyle editorial · Brand story · Stats band · Blog posts · Newsletter · FAQ accordion · Contact form · Track order · Related products · Wishlist · Cart · Search · 404`
You can stack multiple Featured collections, reorder by dragging, hide any section per page, and **add any section to any page** (e.g., put a Trust bar on the About page, a Newsletter mid-homepage, a Category grid on a collection page).

### Section-by-section, editable with ZERO code:
| Section | What you control by clicking/typing |
|---|---|
| **Hero** | Background image, kicker pill text, H1, subheading, both CTA labels + destinations |
| **Featured collection** | Which collection, how many products (2–12), eyebrow, heading, "View all" link — *use it unlimited times for "New arrivals", "Sale", any category* |
| **Flagship product** | Pick ANY product from a picker; section heading; product eyebrow; the 4 bullet points (add/remove/edit as blocks); 2 trust badges. Point it at your next hero product any time |
| **Trust bar** | Add/remove/reorder unlimited trust cards; each has title + body (icons are built in) |
| **Category grid** | Up to 9 cards; each = any collection + custom image override + title + tagline |
| **Lifestyle editorial** | Unlimited scenes; each = image + caption; first & last auto-format wide |
| **Brand story** | Image, mirror-layout toggle, eyebrow, heading, rich-text body (bold/lists/links), floating card text, 2 CTAs |
| **Stats band** | Unlimited stat tiles; each = value + label (e.g. change to "50+ countries shipped" when true) |
| **Blog posts** | Which blog source; heading; eyebrow |
| **Newsletter** | Eyebrow, heading, body, privacy note + link (signups land in Shopify Customers, tag `newsletter`) |
| **Announcement bar** | Up to 4 rotating messages, each with optional link; reorder freely |
| **Header** | Pick which menu powers nav + mobile drawer; mobile CTA link |
| **Footer** | Brand blurb, Instagram/Pinterest/Facebook URLs (only set ones you own), unlimited link columns from any menu, cookie-preferences link on/off |
| **Product page** | Reorder/remove every element as drag-and-drop blocks: vendor, title, price, inventory, description, variant picker, qty+ATC, buy buttons, estimator, assurance, warranty. **Add "Specification row" blocks** and type exact values (Dimensions, Wattage, Voltage, IP rating…) — this is how you enter the Arden's real specs, no code. Slider for low-stock threshold. Toggle FAQ tab. Pick installation page, related-products collection, FBT collection |
| **FAQ page** | Unlimited Q&A blocks, each editable/reorderable; JSON-LD schema is automatic |
| **Contact page** | Eyebrow, heading, intro copy (form is Shopify-native) |

### Global theme settings (Theme settings ⚙ in editor) — 16 controls, no code
Logo image + width · brand wordmark + tagline · **accent color** · **night color** · free-shipping threshold (drives the progress bar) · support email (used in 12 places) · business hours · cookie banner on/off · chat widget on/off · **sample reviews on/off (turn OFF at launch)** · GA4 ID · Meta Pixel ID · TikTok ID · Google Ads ID · currency-estimator on/off

## D2. In the Shopify ADMIN — no code

| Task | Where | Notes |
|---|---|---|
| Add/edit products, variants, prices, compare-at, SKUs, inventory | Products | Arden ships with Textured Black + Brushed Bronze |
| Product photos & alt text | Product → Media | Drag-and-drop |
| SEO title/description per product/page | Bottom of each editor | Pre-filled by the CSV |
| Collections | Products → Collections | Automated by the tags already on the CSV (outdoor-lighting, wall-sconces, pendant-lighting, chandeliers, lamps, mirrors, rugs, home-accessories, decorative-objects, new, best-sellers) |
| Navigation menus (header dropdowns, footer columns, mobile drawer) | Content → Menus | Theme reads `main-menu`; dropdowns auto-generate from sub-items |
| Pages (About, Contact, FAQ, Track Order, Wishlist…) | Online Store → Pages | Pick the matching **theme template** from a dropdown (page.contact, page.faq, page.track-order, page.wishlist) — zero code |
| Policies | Settings → Policies | Paste the 4 provided texts; replace [PLACEHOLDER]s |
| Discount codes | Discounts | Native checkout validation (the preview's `HEAVENLY10` was demo-only) |
| Gift cards | Products/Discounts | `gift_card.liquid` template included |
| Blog | Content → Blog | Article template has hero image, meta, Article schema |
| Customer accounts | Settings → Customer accounts | All 7 account templates included |
| Orders & fulfilment & tracking numbers | Orders | Tracking auto-shows in the customer's order page |
| Real shipping rates | Settings → Shipping | Checkout always shows these; store estimator is labelled "estimate" |
| Markets / real multi-currency | Settings → Markets | Overrides the estimate switcher with guaranteed conversion |
| Email flows (welcome, abandoned cart, shipping…) | Shopify Email or Klaviyo | Newsletter tags feed Welcome flow |
| **Product metafields** (rendered by the theme automatically) | Settings → Custom data → Products | `custom.specifications` (one "Label|Value" per line), `custom.features` ("feature|feature|feature"), `custom.warranty` (text), `custom.faqs` (JSON list of q/a) |
| Verified review ratings | Review app or Shopify Reviews import | Theme auto-renders stars + AggregateRating schema when `reviews.rating` metafields exist |
| Complementary products (FBT) | Search & Discovery app (free) | Fills the "Frequently bought together" block |
| Review apps (Judge.me, Loox, Okendo, Yotpo) | App store | Drop into the `@app` block slot on the product page — zero code |
| Pixels/analytics IDs | Theme settings (see above) | Paste ID, done — consent-gated automatically |

## D3. Design variants you can create by combining editor options only
- **"New arrivals" homepage**: Hero → Featured-collection (collection: new) → Stats → Newsletter
- **Category landing**: any page + Category grid + Featured collection + Trust bar
- **Single-product landing page** (for ads): Hero with product image → Flagship product → Reviews-style Trust bar → FAQ accordion → Newsletter
- **Seasonal sale page**: Announcement (sale message w/ link) + Featured collection (automated "sale" collection) + Stats + Newsletter — discount code made in Discounts
- **Journal-first brand**: Reorder template JSON-less — drag Blog posts to position 2, drop Hero CTA links to `/blogs/journal`
- All without opening a single file.

---

# PART E — WHAT *DOES* REQUIRE CODE (honest list)

| Task | File | Difficulty |
|---|---|---|
| Change shipping-estimator zones/rates | `assets/theme.js` → `shippingEstimate()` | Easy (edit numbers) |
| Embed a real chat vendor (Gorgias/Inbox/Tidio) | `snippets/chat-widget.liquid` | Easy (paste embed) |
| Swap fonts | Google Fonts link in `layout/theme.liquid` + 2 CSS variables | Easy |
| Add a brand-new section type | New file in `sections/` | Medium |
| Change the zone table's countries list | `theme.js` + snippet select options | Easy |
| Anything else (colors, sections, blocks, pages, products) | — | **No code needed — see Part D** |

---

# PART F — INTEGRATION HOOKS (marked [INTEGRATION] in code)
1. Pixels — theme settings IDs; fire only after cookie consent
2. Real carrier rates — replace `HN.ui.shippingEstimate()` (Shopify checkout uses your real rates regardless)
3. Order tracking — app proxy to Order API or AfterShip/17TRACK embed in `sections/track-order.liquid`
4. Live chat — paste vendor embed in `snippets/chat-widget.liquid`
5. Multi-currency — Shopify Markets replaces the labelled estimate switcher
6. Reviews — verified metafields or any app via @app block
7. Email marketing — newsletter form already posts to Shopify Customers with `newsletter` tag

# PART G — INTEGRITY GUARDRAILS (by design)
- Sample reviews clearly labelled + one-click OFF setting
- No fake scarcity: stock shows In/Low/Out only, threshold you set
- Compare-at price renders only when you actually set it
- Policies use `[PLACEHOLDER]` tokens — nothing invented
- Payment icons auto-render ONLY your enabled gateways
- Chat states it's not live yet; tracking page states it's not connected
