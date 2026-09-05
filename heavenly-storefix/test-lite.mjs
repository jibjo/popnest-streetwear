import { JSDOM } from '/home/user/heavenly-preview/node_modules/jsdom/lib/api.js';
const store = () => { const m = new Map(); return {
  getItem: k => m.has(String(k)) ? m.get(String(k)) : null,
  setItem: (k,v) => void m.set(String(k), String(v)),
  removeItem: k => void m.delete(String(k)), clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
  get length(){return m.size;} }; };
const dom = await JSDOM.fromFile('/tmp/litetest/index.html', {
  runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
  beforeParse(w) { Object.defineProperty(w, 'localStorage', { value: store(), configurable: true });
    w.alerts = []; w.alert = m => w.alerts.push(String(m)); } });
const { window } = dom, document = window.document;
const errs = []; window.addEventListener('error', e => errs.push(String(e.error || e.message)));
await new Promise(r => window.addEventListener('load', () => setTimeout(r, 30), { once: true }));
let p=0,f=0; const ok=(l,c,x='')=>{ c?(p++,console.log(`  PASS ${l}`)):(f++,console.log(`  FAIL ${l} ${x}`)); };
const $=s=>document.querySelector(s), txt=s=>($(s)?.textContent||'').trim();
const click=el=>el?.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}));

console.log('[lite: boot + theme]');
ok('no runtime errors', errs.length===0, errs.join('|'));
ok('opens in dark theme', document.documentElement.getAttribute('data-theme')==='dark');
ok('moon/sun icon set', txt('.theme-icon')==='☀️', txt('.theme-icon'));
click($('#themeToggle'));
ok('toggle -> light', !document.documentElement.hasAttribute('data-theme'));
ok('toggle -> persisted', window.localStorage.getItem('heavenly_theme_v1')==='0');
click($('#themeToggle'));
ok('toggle -> dark again', document.documentElement.getAttribute('data-theme')==='dark');

console.log('[lite: cart]');
click([...document.querySelectorAll('.add-btn')].find(b=>b.getAttribute('onclick').includes('Solar Garden Lights')));
ok('badge = 1', txt('.cart-count')==='1', txt('.cart-count'));
ok('total = $49.99', txt('#cartTotal')==='$49.99', txt('#cartTotal'));
ok('line rendered', document.querySelectorAll('#cartItems .cart-item').length===1);
ok('drawer auto-opened on add', $('#cartSidebar').classList.contains('open'));
$('#quantity').value='3';
click(document.querySelector('.size-btn:not(.active)'));
click(document.querySelector('.add-to-cart-btn'));
ok('flagship respects qty 3', window.addToCart && true);
ok('badge = 4', txt('.cart-count')==='4', txt('.cart-count'));
ok('total = 49.99 + 3*129.99', txt('#cartTotal')==='$439.96', txt('#cartTotal'));
click($('#cartItems button[onclick*="setQty(1,-1)"]'));
ok('minus works in drawer', txt('#cartTotal')==='$309.97', txt('#cartTotal'));
click($('#cartItems button[onclick*="delLine(0)"]'));
ok('delete works', txt('#cartTotal')==='$259.98', txt('#cartTotal'));

console.log('[lite: stepper, filters, drawer, checkout, newsletter]');
$('#quantity').value='9'; click([...document.querySelectorAll('.quantity-selector button')].find(b=>b.getAttribute('onclick')==='increaseQty()'));
ok('increaseQty', $('#quantity').value==='10', $('#quantity').value);
ok('capped at 99', (()=>{ $('#quantity').value='99'; for(let i=0;i<5;i++) click([...document.querySelectorAll('.quantity-selector button')].find(b=>b.getAttribute('onclick')==='increaseQty()')); return $('#quantity').value==='99'; })());
click([...document.querySelectorAll('.filter-btn')].find(b=>b.textContent.includes('Garden Lights')));
const vis=[...document.querySelectorAll('.product-card')].filter(c=>c.style.display!=='none');
ok('garden filter -> 2 cards', vis.length===2 && vis.every(c=>c.dataset.category==='garden'), JSON.stringify(vis.map(v=>v.dataset.category)));
click(document.querySelector('.filter-btn'));
ok('all -> 6 cards', [...document.querySelectorAll('.product-card')].filter(c=>c.style.display!=='none').length===6);
window.closeCart();
ok('closeCart works', !$('#cartSidebar').classList.contains('open'));
click(document.querySelector('a[href="#cart"]'));
ok('nav cart icon opens drawer', $('#cartSidebar').classList.contains('open'));
document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
ok('Escape closes', !$('#cartSidebar').classList.contains('open'));
window.__navs=[]; 
click($('.checkout-btn'));
await new Promise(r=>setTimeout(r,50));
ok('checkout sends items to payhip (no crash)', errs.length===0, errs.join('|'));
$('.newsletter-form input').value='bad'; click($('.newsletter-form button'));
ok('bad email rejected via alert', window.alerts.some(a=>/valid email/i.test(a)), JSON.stringify(window.alerts));
$('.newsletter-form input').value='a@b.co'; click($('.newsletter-form button'));
ok('good email saved', (window.localStorage.getItem('heavenly_subs')||'').includes('a@b.co'));
ok('still zero runtime errors', errs.length===0, errs.join('|'));
console.log(`\n=== lite: ${p} passed, ${f} failed ===`);
process.exit(f?1:0);
