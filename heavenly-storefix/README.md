# Fix for jibjo/heavenly-sconce-store (missing script.js)

`index.html` line 559 loads `script.js`, but that file was never committed, so it 404s on
GitHub Pages and every button on the live site is inert (cart, theme toggle, filters,
newsletter, checkout). Nothing is wrong with the deployed HTML/CSS — Pages is serving the
newest commit `5edac55c` correctly.

## Install (60 seconds, phone or desktop)

1. Download `script.js` (this folder, or the raw link from the Arena chat).
2. On GitHub: `jibjo/heavenly-sconce-store` -> **Add file** -> **Upload files** -> pick `script.js`.
3. Commit directly to `main`. Pages rebuilds in ~1 min (CDN clears within 10).

Terminal version:

```bash
git clone https://github.com/jibjo/heavenly-sconce-store && cd heavenly-sconce-store
cp /path/to/script.js .
git add script.js && git commit -m "Add missing script.js (cart, theme, filters, newsletter, PayHip checkout)"
git push origin main
```

`script.min.js` is the same code minified, if you prefer pasting a smaller blob into the
web editor (create file named `script.js`, paste, commit).

## Verify afterwards

- `https://jibjo.github.io/heavenly-sconce-store/script.js` -> 200 (it is a 404 today)
- Theme switch, Add to Cart, filters, newsletter all respond
- If a browser still shows the old page, GitHub is holding the 600-second CDN copy;
  `?v=2` on the URL bypasses it

## Test harness

`smoke.mjs` loads the real `index.html` in jsdom and exercises all 46 behaviours
(needs `npm i jsdom`, then `node smoke.mjs` from a folder containing index.html,
styles.css and script.js).

## PayHip

Checkout falls back to `https://payhip.com/Popnest` until you add link codes to
`CONFIG.PRODUCT_LINKS` in `script.js`; per-product deep links then pre-fill the PayHip
cart using the same `buy?s=1&qty[..]=n&cart_links[]=..` format that already works on the
Popnest storefront.
