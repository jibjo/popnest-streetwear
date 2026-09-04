# Heavenly.co — Premium Lighting & Home Décor Store

Complete, original, conversion-focused ecommerce build for **Heavenly** — an
independent home-décor brand (lighting, outdoor lighting, wall sconces,
chandeliers, pendants, lamps, mirrors, rugs, accessories).

**Flagship product:** Arden Modern Outdoor Wall Sconce — a slim architectural
up/down-light in sealed aluminum (IP65-class outdoor rating, warm 3000 K
integrated LED, two finishes).

## What's inside

| Path | Purpose |
|---|---|
| **`store/`** | Live, fully working **design preview** — homepage, product page (gallery zoom, variants, reviews, FAQ, FBT), shop with filters/sort, cart + drawer, checkout preview, wishlist, track-order, about, contact, FAQ, all policy templates, blog (3 original articles), 404, sitemap, robots. Edit `store/src/`, then `python3 tools/build.py`. |
| **`shopify-theme/`** | The **production Shopify Online Store 2.0 theme** — same design, native sections/blocks, AJAX cart, predictive search, collection filters, consent-gated analytics, customer account templates, structured data. See `shopify-theme/README.md`. |
| **`docs/INTEGRATION.md`** | Step-by-step launch guide: menus, products/metafields, reviews apps, shipping/rates, tracking pixels, email flows, policies, QA. |
| **`docs/profit-calculator.html`** | Backend-friendly profit tool (price − cost − shipping − fees − ads). Browser-only, guarantees nothing. |
| `store/assets/img/` | Original AI-generated photography. Five product images are currently elegant branded SVG placeholders marked "photography in production" — replace file-for-file with real photos. |

## Brand integrity (non-negotiables, enforced in code)

- Original brand, identity, copy, imagery — no copied material.
- No fake reviews (samples are clearly labelled), no fake timers/scarcity,
  no invented certifications, offices, dates or claims.
- Compare-at price ships **null** — set only with a factual reference price.
- Policies use explicit `[PLACEHOLDER]` tokens for merchant/legal inputs.

## Quick start

```bash
# preview the static site
python3 -m http.server 8080 --directory store

# edit the preview
$EDITOR store/src/pages/*.html && python3 tools/build.py
```

The live preview of `store/` is served on port 8080 in this workspace.

*The AliExpress listings shared by the owner were used strictly as
category/spec reference; no AliExpress branding, imagery, or copy appears
anywhere in the store.*
