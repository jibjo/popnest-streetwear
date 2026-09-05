import { JSDOM } from '/home/user/heavenly-preview/node_modules/jsdom/lib/api.js';
import fs from 'fs';

const dir = '/home/user/heavenly-preview';
const html = fs.readFileSync(`${dir}/index.html`, 'utf8');
const js = fs.readFileSync(`${dir}/script.js`, 'utf8');
if (!js.includes('HeavenlyCart')) throw new Error('script.js missing');
void js;

let pass = 0, fail = 0;
const ok = (label, cond, extra = '') => {
  if (cond) { pass++; console.log(`  \x1b[32mPASS\x1b[0m ${label}`); }
  else { fail++; console.log(`  \x1b[31mFAIL\x1b[0m ${label} ${extra}`); }
};

// Load the real page the way a browser would: inline <script src="script.js">
// plus inline onclick="" attributes, both of which need runScripts:dangerously.
const store = () => {
  const map = new Map();
  return {
    getItem: k => (map.has(String(k)) ? map.get(String(k)) : null),
    setItem: (k, v) => void map.set(String(k), String(v)),
    removeItem: k => void map.delete(String(k)),
    clear: () => map.clear(),
    key: i => [...map.keys()][i] ?? null,
    get length() { return map.size; },
  };
};

const dom = await JSDOM.fromFile(`${dir}/index.html`, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  // jsdom forbids localStorage on file:// origins, so give the page an in-memory one
  // before the document's own <script> executes.
  beforeParse(window) {
    Object.defineProperty(window, 'localStorage', { value: store(), configurable: true });
  },
});
const { window } = dom;
const { document } = window;
const errs = [];
window.addEventListener('error', e => errs.push(String(e.error || e.message)));
await new Promise(r => window.addEventListener('load', () => setTimeout(r, 30), { once: true }));
const W = window;
void html;

const $ = s => document.querySelector(s);
const txt = s => ($(s)?.textContent || '').trim();
const click = el => el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

console.log('\n[boot]');
ok('script executes without error', errs.length === 0, errs.join('|'));
ok('default theme = dark (brand look)', document.documentElement.getAttribute('data-theme') === 'dark');
ok('toggle icon is sun in dark mode', txt('.theme-icon') === '☀️', txt('.theme-icon'));

console.log('\n[theme toggle]');
click($('#themeToggle'));
ok('click flips to light', !document.documentElement.hasAttribute('data-theme'));
ok('icon flips to moon', txt('.theme-icon') === '🌙');
ok('choice persisted as plain JSON', window.localStorage.getItem('heavenly_theme_v1') === '"light"', window.localStorage.getItem('heavenly_theme_v1'));
click($('#themeToggle'));
ok('click flips back to dark', document.documentElement.getAttribute('data-theme') === 'dark');

console.log('\n[quick add from product grid]');
const solarBtn = [...document.querySelectorAll('.add-btn')].find(b => b.getAttribute('onclick').includes('Solar Garden Lights'));
click(solarBtn);
ok('cart badge = 1', txt('.cart-count') === '1', txt('.cart-count'));
ok('total = $49.99', txt('#cartTotal') === '$49.99', txt('#cartTotal'));
ok('one cart line rendered', document.querySelectorAll('#cartItems .cart-item').length === 1);
ok('line shows product name', $('#cartItems .cart-item-name')?.textContent === 'Solar Garden Lights');

console.log('\n[featured: respects qty + size variant]');
$('#quantity').value = '3';
click(document.querySelector('.add-to-cart-btn'));
let items = W.HeavenlyCart.items();
const armor = items.find(i => i.name === 'Armor Sconce');
ok('armor qty = 3 from #quantity', armor?.qty === 3, JSON.stringify(armor));
ok('armor variant carries active size', armor?.variant.includes('30cm'), armor?.variant);
ok('badge = 1 + 3', txt('.cart-count') === '4', txt('.cart-count'));
ok('total = 49.99 + 3*129.99', txt('#cartTotal') === '$439.96', txt('#cartTotal'));

console.log('\n[size picker changes variant]');
click([...document.querySelectorAll('.size-btn')].find(b => b.textContent.trim() === '40cm'));
$('#quantity').value = '1';
click(document.querySelector('.add-to-cart-btn'));
const armor2 = W.HeavenlyCart.items().find(i => i.name === 'Armor Sconce');
ok('new 40cm line added separately', W.HeavenlyCart.items().some(i => i.variant.includes('40cm')), armor2?.variant);
ok('re-adding same variant merges (armor 30cm still qty 3)',
   W.HeavenlyCart.items().find(i => i.variant.includes('30cm'))?.qty === 3);

console.log('\n[qty stepper]');
$('#quantity').value = '5';
click([...document.querySelectorAll('.quantity-selector button')].find(b => b.getAttribute('onclick') === 'increaseQty()'));
ok('increaseQty 5 -> 6', $('#quantity').value === '6', $('#quantity').value);
click([...document.querySelectorAll('.quantity-selector button')].find(b => b.getAttribute('onclick') === 'decreaseQty()'));
click([...document.querySelectorAll('.quantity-selector button')].find(b => b.getAttribute('onclick') === 'decreaseQty()'));
ok('decreaseQty twice -> 4', $('#quantity').value === '4', $('#quantity').value);
$('#quantity').value = '1';
click([...document.querySelectorAll('.quantity-selector button')].find(b => b.getAttribute('onclick') === 'decreaseQty()'));
ok('never below 1', $('#quantity').value === '1', $('#quantity').value);

console.log('\n[in-cart qty + remove]');
const before = W.HeavenlyCart.items().length;
click($('#cartItems [data-inc]'));
ok('inc button raises first line to 2', W.HeavenlyCart.items()[0]?.qty === 2, JSON.stringify(W.HeavenlyCart.items()[0]));
click($('#cartItems [data-remove]'));
ok('remove drops one line', W.HeavenlyCart.items().length === before - 1);

console.log('\n[filters]');
click([...document.querySelectorAll('.filter-btn')].find(b => b.textContent.includes('Garden Lights')));
const visible = [...document.querySelectorAll('.product-card')].filter(c => c.style.display !== 'none');
ok('garden filter shows only garden cards', visible.length === 2 && visible.every(c => c.dataset.category === 'garden'), JSON.stringify(visible.map(v => v.dataset.category)));
ok('garden filter hides the other 4', document.querySelectorAll('.product-card[style*="none"]').length === 4);
ok('garden button is .active', [...document.querySelectorAll('.filter-btn')].filter(b => b.classList.contains('active')).map(b => b.textContent.trim()).join() === 'Garden Lights');
click(document.querySelector('.filter-btn'));
ok('All Products restores 6 cards', [...document.querySelectorAll('.product-card')].filter(c => c.style.display !== 'none').length === 6);
W.HeavenlyCart.clear();
ok('clear() empties cart + badge', W.HeavenlyCart.totals().count === 0 && txt('.cart-count') === '0' && txt('#cartTotal') === '$0.00');
ok('empty-state copy returns', /cart is empty/i.test(txt('#cartItems')), txt('#cartItems').slice(0, 40));

console.log('\n[cart drawer open/close]');
click(document.querySelector('a[href="#cart"]'));
ok('#cartSidebar opens (preventDefault worked)', $('#cartSidebar').classList.contains('open'));
ok('body scroll locked', document.body.style.overflow === 'hidden', document.body.style.overflow);
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok('Escape closes', !$('#cartSidebar').classList.contains('open'));
ok('scroll restored', document.body.style.overflow === '');

console.log('\n[buy now]');
const n0 = W.HeavenlyCart.totals().count;
click(document.querySelector('.buy-now-btn'));
ok('buyNow adds armor and opens drawer', W.HeavenlyCart.totals().count > n0 && $('#cartSidebar').classList.contains('open'));

console.log('\n[checkout — PayHip wiring]');
W.HeavenlyCart.clear();
click($('.checkout-btn'));
let bubbleTxt = () => [...document.querySelectorAll('[aria-live="polite"] div')].map(e => e.textContent).join(' | ');
ok('empty cart is refused with a toast', /empty/i.test(bubbleTxt()), bubbleTxt());

W.HeavenlyCart.add('Armor Sconce', 129.99);
ok('unmapped cart falls back to the real PayHip storefront',
   W.HeavenlyCart.checkoutUrl() === 'https://payhip.com/Popnest', W.HeavenlyCart.checkoutUrl());

W.HeavenlyCart.setProductLink('Armor Sconce', 'k5ORp');
const deep = W.HeavenlyCart.previewPayhipUrl();
ok('mapped cart becomes a PayHip pre-fill link',
   deep === 'https://payhip.com/buy?s=1&qty%5Bk5ORp%5D=1&cart_links%5B%5D=k5ORp', deep);
ok('deep link beats storefront fallback', W.HeavenlyCart.checkoutUrl() === deep, W.HeavenlyCart.checkoutUrl());

W.HeavenlyCart.add('Pathway Lights', 64.99);
W.HeavenlyCart.setProductLink('Pathway Lights', 'oZn3J');
const deep2 = W.HeavenlyCart.previewPayhipUrl();
ok('two items -> both qtys then both links',
   deep2 === 'https://payhip.com/buy?s=1&qty%5Bk5ORp%5D=1&qty%5BoZn3J%5D=1&cart_links%5B%5D=k5ORp&cart_links%5B%5D=oZn3J', deep2);

W.HeavenlyCart.add('Square Wall Light', 109.99);
ok('partially mapped cart only pre-fills known items',
   W.HeavenlyCart.previewPayhipUrl().includes('k5ORp') && !W.HeavenlyCart.previewPayhipUrl().includes('109'),
   W.HeavenlyCart.previewPayhipUrl());
W.HeavenlyCart.setProductLink('Armor Sconce', ''); W.HeavenlyCart.setProductLink('Pathway Lights', '');
W.HeavenlyCart.clear();

click($('.checkout-btn'));
await new Promise(r => setTimeout(r, 550));
ok('checkout produces a toast, no crash', errs.length === 0, errs.join('|'));

console.log('\n[newsletter]');
const nl = $('.newsletter-form');
nl.querySelector('input').value = 'not-an-email';
click(nl.querySelector('button'));
ok('invalid email rejected', window.localStorage.getItem('heavenly_subscribers_v1') === null);
nl.querySelector('input').value = 'buyer@example.com';
click(nl.querySelector('button'));
ok('valid email stored', (window.localStorage.getItem('heavenly_subscribers_v1') || '').includes('buyer@example.com'));
ok('input cleared after subscribe', nl.querySelector('input').value === '');
const enter = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
nl.querySelector('input').value = 'second@example.com';
nl.querySelector('input').dispatchEvent(enter);
ok('Enter key submits too', (window.localStorage.getItem('heavenly_subscribers_v1') || '').includes('second@example.com'));

console.log('\n[no duplicate side effects]');
ok('exactly one overlay element', document.querySelectorAll('#cartOverlay').length === 1, String(document.querySelectorAll('#cartOverlay').length));
ok('zero runtime errors overall', errs.length === 0, errs.join(' | '));

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
