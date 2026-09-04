# Heavenly — Shopify Theme (Online Store 2.0)

The production theme for **Heavenly.co** — an original premium lighting &
home-décor brand. Matches the static design preview in `/store` one-to-one.

## Install

1. Zip the **contents** of this folder (so `layout/`, `sections/`, … sit at
   the zip root) and upload via **Online Store → Themes → Add theme**.
2. Follow `docs/INTEGRATION.md` §2 for menus, collections and theme-editor
   setup. Every homepage section is configurable — no code edits required.

## Highlights

- **All homepage sections**: announcement bar (rotating messages), sticky
  header with dropdowns, hero, featured collection, flagship product
  showcase, trust bar, category grid, customer favorites, lifestyle
  editorial, brand story, stats band, blog teasers, newsletter.
- **Product page**: gallery with zoom, variant picker, honest inventory
  status, quantity + AJAX add-to-cart, buy buttons, wishlist, shipping
  estimator, admin-entered specification rows, FAQ tab, integrity-first
  reviews (verified metafields → app blocks → labelled samples → honest
  empty state), frequently-bought-together, related products.
- **Storefront features**: AJAX cart drawer with free-shipping progress
  (real threshold, no fake scarcity), predictive search, collection
  filtering via Shopify's Search & Discovery, estimated currency switcher,
  cookie consent gating analytics, integration-ready chat widget, wishlist.
- **SEO**: meta tags + OG/Twitter, Product / Organization / WebSite /
  Breadcrumb / FAQ / Article structured data, canonical URLs.
- **A11y**: semantic HTML, focus states, Escape-closes-overlays, skip link,
  reduced-motion support, labelled forms.

## Conventions

- `[INTEGRATION]` comments mark every external-service hook.
- No fake scarcity, fake reviews, fake timers, or invented discounts — by
  design, documented in `docs/INTEGRATION.md`.
