
// RexShop - script.js (prices in Toman)
// Default products (initial)
const DEFAULT_PRODUCTS = [
  {id:'p1',title:'Minecraft Premium',price:120000,category:'Minecraft',desc:'اکانت پریمیوم جاوا ادیشن',img:''},
  {id:'p2',title:'Discord Nitro 1 ماهه',price:250000,category:'Discord',desc:'نیترو بوست ۱ ماهه',img:''},
  {id:'p3',title:'Telegram Premium',price:300000,category:'Telegram',desc:'پرمیوم رسمی تلگرام',img:''},
  {id:'p4',title:'VPN Pro Key',price:180000,category:'VPN',desc:'دسترسی پرسرعت به ۵ سرور',img:''}
];

function lsGet(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch(e){return fallback}}
function lsSet(key,val){localStorage.setItem(key,JSON.stringify(val))}

// Load or init data
let products = lsGet('rex_products', DEFAULT_PRODUCTS); lsSet('rex_products', products);
let cart = lsGet('rex_cart', []); lsSet('rex_cart', cart);
let purchases = lsGet('rex_purchases', []); lsSet('rex_purchases', purchases);

// Utilities
function formatToman(n){ return n.toLocaleString('fa-IR') + ' تـ'; }

// Rendering categories
function renderCategories(elemId){
  const wrap = document.getElementById(elemId); if(!wrap) return;
  const cats = Array.from(new Set(products.map(p=>p.category)));
  wrap.innerHTML='';
  cats.forEach(c=>{const el=document.createElement('div');el.className='cat';el.textContent=c;el.onclick=()=>renderProducts('products-grid', products.filter(p=>p.category===c));wrap.appendChild(el)});
}

// Products grid
function renderProducts(gridId,list=products){
  const productsGrid = document.getElementById(gridId); if(!productsGrid) return;
  productsGrid.innerHTML='';
  list.forEach(p=>{
    const card=document.createElement('div');card.className='product';
    card.innerHTML = `<div class="p-img">${p.img?'<img src="'+p.img+'" style="max-height:100%;max-width:100%;border-radius:6px">':'<svg width="80" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M7 21h10"/></svg>'}</div>
      <div class="p-title">${p.title}</div>
      <div class="p-price">${formatToman(p.price)}</div>
      <div style="font-size:12px;color:#9aa8c8;margin-top:6px">${p.desc||''}</div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
        <button class="add" onclick='addToCart("${p.id}")'>افزودن به سبد</button>
        <a class="btn" href="product.html?id=${p.id}">جزئیات</a>
      </div>`;
    productsGrid.appendChild(card);
  });
}

// Featured
function renderFeatured(elemId){
  const wrap = document.getElementById(elemId); if(!wrap) return;
  const f = products.slice(0,2); wrap.innerHTML='';
  f.forEach(p=>{const d=document.createElement('div');d.style.padding='10px';d.style.borderRadius='10px';d.style.marginTop='8px';d.style.background='linear-gradient(90deg, rgba(255,255,255,0.01), transparent)';d.innerHTML=`<strong>${p.title}</strong><div style="color:#9aa8c8">${formatToman(p.price)}</div>`;wrap.appendChild(d)});
}

// Cart utilities
function updateCartCount(){ cart = lsGet('rex_cart',[]); const el=document.getElementById('cart-count'); if(el) el.textContent = cart.reduce((s,i)=>s+i.qty,0); }
let toastTimer=null;
function showToast(message){ const toast = document.getElementById('toast'); const toastText = document.getElementById('toast-text'); if(!toast) return; toastText.textContent = message; toast.classList.add('show'); if(toastTimer) clearTimeout(toastTimer); toastTimer = setTimeout(()=>{toast.classList.remove('show')},2000); }

function addToCart(pid){ const pr = products.find(x=>x.id===pid); if(!pr) return showToast('محصول پیدا نشد'); cart = lsGet('rex_cart',[]); const existing = cart.find(i=>i.id===pid); if(existing){existing.qty+=1}else{cart.push({id:pid,qty:1})} lsSet('rex_cart',cart); updateCartCount(); showToast('محصول به سبد اضافه شد'); }

// Admin helpers for product management
function renderAdminProducts(){
  const wrap = document.getElementById('admin-products-list'); if(!wrap) return; wrap.innerHTML='';
  products.forEach(p=>{ const el=document.createElement('div'); el.style.padding='8px'; el.style.borderBottom='1px solid rgba(255,255,255,0.03)'; el.innerHTML = `<strong>${p.title}</strong> — ${formatToman(p.price)} <div style="margin-top:6px"><button class="btn" onclick='editProduct("${p.id}")'>ویرایش</button> <button class="btn" onclick='deleteProduct("${p.id}")'>حذف</button></div>`; wrap.appendChild(el); });
}

window.deleteProduct = function(id){ if(!confirm('آیا حذف شود؟')) return; products = products.filter(p=>p.id!==id); lsSet('rex_products',products); renderProducts('products-grid'); renderCategories('categories'); renderAdminProducts(); showToast('حذف شد') }

window.editProduct = function(id){
  const p = products.find(x=>x.id===id); if(!p) return;
  document.getElementById('p-title').value = p.title;
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-category').value = p.category;
  document.getElementById('p-img').value = p.img || '';
  document.getElementById('p-desc').value = p.desc || '';
  // set form to update mode
  document.getElementById('product-form').dataset.editId = id;
  showToast('در حال ویرایش محصول');
}

// Purchases (payments)
function calculateCartTotal(){
  cart = lsGet('rex_cart',[]);
  products = lsGet('rex_products',DEFAULT_PRODUCTS);
  let total = 0;
  cart.forEach(item=>{ const p = products.find(x=>x.id===item.id); if(p) total += p.price * item.qty; });
  return total;
}

function buildCartTable(elemId){
  const el = document.getElementById(elemId); if(!el) return;
  const cartDetails = getCartDetails();
  if(cartDetails.length===0){ el.innerHTML = '<p style="color:#94a3b8">سبد خرید خالی است</p>'; return; }
  let html = '<table style="width:100%;border-collapse:collapse"><thead><tr><th>محصول</th><th>قیمت</th><th>تعداد</th><th>جمع</th></tr></thead><tbody>';
  let total = 0;
  cartDetails.forEach(r=>{ const pr = r.product; const sum = (pr.price * r.qty); total += sum; html += `<tr><td>${pr.title}</td><td>${formatToman(pr.price)}</td><td>${r.qty}</td><td>${formatToman(sum)}</td></tr>`; });
  html += `</tbody></table><div style="margin-top:12px;font-weight:700">جمع کل: ${formatToman(total)}</div><div style="margin-top:12px"><button class="btn neon" id="checkout-open">پرداخت</button></div>`;
  el.innerHTML = html;
  const btn = document.getElementById('checkout-open'); if(btn) btn.addEventListener('click', ()=>{ document.getElementById('checkout-form').scrollIntoView({behavior:'smooth'}); showToast('فرم پرداخت باز شد'); });
}

function getCartDetails(){
  cart = lsGet('rex_cart',[]);
  products = lsGet('rex_products',DEFAULT_PRODUCTS);
  return cart.map(item=>{ const p = products.find(x=>x.id===item.id); return {id:item.id,qty:item.qty,product:p}; });
}

// Checkout processing
function processCheckout(){
  // read form
  const first = document.getElementById('c-first').value.trim();
  const last = document.getElementById('c-last').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const age = document.getElementById('c-age').value.trim();
  const note = document.getElementById('c-note').value.trim();
  if(!first||!last||!phone||!email||!age){ alert('لطفاً تمام فیلدها را پر کنید'); return; }
  const details = getCartDetails();
  if(details.length===0){ alert('سبد خرید خالی است'); return; }
  const total = calculateCartTotal();
  // show card & upload area
  const cardArea = document.getElementById('card-area');
  cardArea.innerHTML = `<div style="padding:12px;border-radius:8px;background:linear-gradient(90deg, rgba(255,255,255,0.02), transparent)">
    <div style="font-weight:700;margin-bottom:8px">شماره کارت برای انتقال (نمونه)</div>
    <div style="display:flex;gap:8px;align-items:center"><div id="sample-card" style="font-family:monospace;background:rgba(0,0,0,0.35);padding:10px;border-radius:8px">${'6037-9911-2222-3333'}</div><button class="btn" id="copy-card">کپی شماره کارت</button></div>
    <div style="margin-top:10px">پس از انتقال، تصویر رسید را آپلود کنید:</div>
    <input type="file" id="receipt-file" accept="image/*" style="margin-top:8px" />
    <div style="margin-top:8px"><button class="btn neon" id="confirm-payment">تایید پرداخت و ارسال</button></div>
  </div>`;
  // copy handler
  document.getElementById('copy-card').addEventListener('click', ()=>{
    const txt = document.getElementById('sample-card').textContent.trim();
    navigator.clipboard.writeText(txt).then(()=>{ showToast('شماره کارت کپی شد'); }, ()=>{ alert('کپی ناموفق'); });
  });
  // handle upload & confirm
  document.getElementById('confirm-payment').addEventListener('click', ()=>{
    const fileInput = document.getElementById('receipt-file');
    if(!fileInput.files || fileInput.files.length===0){ alert('لطفاً عکس رسید را انتخاب کنید'); return; }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e){
      const dataUrl = e.target.result;
      // save purchase object
      const purchase = {
        id: 'pur'+Date.now(),
        user: {first,last,phone,email,age,note},
        items: details,
        total: total,
        receipt: dataUrl,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      purchases = lsGet('rex_purchases',[]);
      purchases.push(purchase);
      lsSet('rex_purchases', purchases);
      // clear cart
      lsSet('rex_cart', []);
      // refresh UI
      buildCartTable('cart-contents');
      updateCartCount();
      cardArea.innerHTML = '<p style="color:#9aa8c8">پرداخت ثبت شد. در پنل مدیریت، رسید نمایش داده خواهد شد.</p>';
      showToast('پرداخت ثبت شد');
    };
    reader.readAsDataURL(file);
  });
}

// Admin: render purchases
function renderAdminPurchases(){
  const wrap = document.getElementById('admin-purchases-list'); if(!wrap) return; wrap.innerHTML='';
  purchases = lsGet('rex_purchases',[]);
  if(purchases.length===0){ wrap.innerHTML = '<p style="color:#94a3b8">هیچ خریدی ثبت نشده است</p>'; return; }
  purchases.slice().reverse().forEach(p=>{
    const el = document.createElement('div'); el.style.padding='10px'; el.style.borderBottom='1px solid rgba(255,255,255,0.03)';
    el.innerHTML = `<div style="display:flex;gap:12px;align-items:flex-start"><div style="width:140px"><img src="${p.receipt}" style="max-width:140px;border-radius:6px"></div><div style="flex:1"><strong>${p.user.first} ${p.user.last}</strong> — ${p.user.phone}<div style="color:#9aa8c8;margin-top:6px">${p.user.email} · سن: ${p.user.age}</div><div style="margin-top:8px">جمع: ${formatToman(p.total)}</div><div style="margin-top:8px">محصولات:<ul>${p.items.map(i=>'<li>'+i.product.title+' × '+i.qty+'</li>').join('')}</ul></div><div style="margin-top:8px"><button class="btn" onclick='markProcessed("${p.id}")'>تایید و پردازش</button> <button class="btn" onclick='deletePurchase("${p.id}")'>حذف</button></div></div></div>`;
    wrap.appendChild(el);
  });
}

window.deletePurchase = function(id){ if(!confirm('آیا حذف شود؟')) return; purchases = purchases.filter(x=>x.id!==id); lsSet('rex_purchases',purchases); renderAdminPurchases(); showToast('حذف شد'); }
window.markProcessed = function(id){ purchases = lsGet('rex_purchases',[]); const p = purchases.find(x=>x.id===id); if(!p) return; p.status = 'processed'; lsSet('rex_purchases',purchases); renderAdminPurchases(); showToast('پردازش شد'); }

// Init admin & forms
function initAdmin(){
  const loginBtn = document.getElementById('admin-login'); if(loginBtn){ loginBtn.addEventListener('click', ()=>{ const pass = document.getElementById('admin-pass').value.trim(); if(pass==='RexUP_Admin124578'){ document.getElementById('admin-area').style.display='block'; document.getElementById('login-area').style.display='none'; renderAdminProducts(); renderAdminPurchases(); } else alert('رمز نادرست'); }); }
  const pForm = document.getElementById('product-form'); if(pForm) pForm.addEventListener('submit',(e)=>{ e.preventDefault(); const editId = pForm.dataset.editId; const title = document.getElementById('p-title').value.trim(); const price = parseInt(document.getElementById('p-price').value)||0; const category = document.getElementById('p-category').value; const img = document.getElementById('p-img').value.trim(); const desc = document.getElementById('p-desc').value.trim(); if(editId){ const idx = products.findIndex(x=>x.id===editId); if(idx>=0){ products[idx].title=title; products[idx].price=price; products[idx].category=category; products[idx].img=img; products[idx].desc=desc; delete pForm.dataset.editId; showToast('محصول بروزرسانی شد'); } } else { products.push({id:'p'+Date.now(),title,price,category,img,desc}); showToast('محصول اضافه شد'); } lsSet('rex_products',products); renderProducts('products-grid'); renderCategories('categories'); renderAdminProducts(); pForm.reset(); });
  const exportBtn = document.getElementById('export-data'); if(exportBtn) exportBtn.addEventListener('click', ()=>{ const data = {products:products,purchases:lsGet('rex_purchases',[]),cart:lsGet('rex_cart',[])}; const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='rexshop_data.json';a.click();URL.revokeObjectURL(url); });
}

// Init pages
function initPage(){
  renderCategories('categories'); renderProducts('products-grid'); renderFeatured('featured'); updateCartCount(); initAdmin();
  try{ renderAdminPurchases(); }catch(e){}
}

document.addEventListener('DOMContentLoaded', ()=>{ try{ initPage() }catch(e){} });
