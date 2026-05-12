/* ═══════════════════════════════════════════
   API URL — Railway Production
   ═══════════════════════════════════════════ */
const API_URL = 'https://hijap-production.up.railway.app';

function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}/api${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Server returned non-JSON: ${text.substring(0, 200)}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  } catch (e) {
    console.error('API Error:', e);
    throw e;
  }
}

/* ═══════════════════════════════════════════
   بيانات المنتجات (Fallback)
   ═══════════════════════════════════════════ */
// Default products — used only for seeding the database on first run
const DEFAULT_PRODUCTS = [
  { name:'Chiffon hijab with attached inner cap', price:120, images:['jel8.jpg','jel3.jpg','jel4.jpg','jel5.jpg','jel6.jpg','jel7.jpg'], isBestSeller:true },
  { name:'FLOWERS HIJAB',  price:180, images:['m2.jpg','m3.jpg','m4.jpg','m5.jpg','m6.jpg','m7.jpg'], isBestSeller:true },
  { name:'STAN HIJAB',     price:299, images:['stan2.jpg','stan3.jpg','stan4.jpg','stan5.jpg','stan6.jpg','stan7.jpg'], isBestSeller:true },
  { name:'PASHAMIL HIJAB', price:250, images:['p7.jpg','p2.jpg','p8.jpg','p3.jpg','p4.jpg','p5.jpg'], isBestSeller:false },
  { name:'MILT HIJAB',     price:150, images:['c1.jpg','c2.jpg','c4.jpg','c3.jpg','c5.jpg','c6.jpg'], isBestSeller:false },
  { name:'TIGER HIJAB',    price:200, images:['d1.jpg','d2.jpg','d3.jpg','d5.jpg','d7.jpg'], isBestSeller:false },
];

// Seed default products into DB if it's empty (runs once on page load)
async function seedDefaultProducts() {
  try {
    const data = await apiRequest('/products');
    if (data.products && data.products.length > 0) return; // already have products
    const token = getToken();
    if (!token) return; // need admin token to seed
    for (const p of DEFAULT_PRODUCTS) {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(p)
      });
    }
    console.log('✅ Default products seeded');
  } catch (e) {
    console.log('Seed skipped:', e.message);
  }
}

/* ═══════════════════════════════════════════
   Hamburger Menu
   ═══════════════════════════════════════════ */
function toggleMenu() {
  const navLinks = document.getElementById('nav-links');
  if (navLinks) navLinks.classList.toggle('open');
}

function closeMenu() {
  const navLinks = document.getElementById('nav-links');
  if (navLinks) navLinks.classList.remove('open');
}

/* ═══════════════════════════════════════════
   Scroll Helpers
   ═══════════════════════════════════════════ */
function scrollToHome() {
  closeMenu();
  const el = document.getElementById('home');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
function scrollToProducts() {
  closeMenu();
  const el = document.getElementById('products');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
function scrollToAbout() {
  closeMenu();
  const el = document.getElementById('about');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
function scrollToContact() {
  closeMenu();
  const el = document.getElementById('contact');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ═══════════════════════════════════════════
   بناء الصفحات
   ═══════════════════════════════════════════ */
async function buildNewCollection() {
  try {
    const data = await apiRequest('/products');
    const apiProducts = (data.products || []).map(p => ({
      id: p._id || p.id,
      name: p.name,
      price: p.price.toString(),
      imgs: p.images
    }));
    renderProducts(apiProducts);
  } catch (e) {
    console.log('API products failed:', e.message);
    renderProducts([]);
  }
}

async function buildBestSellers() {
  try {
    const data = await apiRequest('/products/bestsellers/list');
    const apiProducts = (data.products || []).map(p => ({
      id: p._id || p.id,
      name: p.name,
      price: p.price.toString(),
      imgs: p.images
    }));
    renderBestSellers(apiProducts);
  } catch (e) {
    console.log('API bestsellers failed:', e.message);
    renderBestSellers([]);
  }
}

function renderBestSellers(products) {
  const container = document.getElementById('best-sellers-container');
  if (!container) return;
  container.innerHTML = products.map(p => `
    <div class="product-card" onclick="addToCartSimple('${p.name}','${p.price}','${p.imgs[0]}',event)">
      <img src="${p.imgs[0]}" alt="${p.name}"/>
      <p class="product-name">${p.name}</p>
      <p class="product-price">${p.price} EG</p>
    </div>
  `).join('');
}

function renderProducts(products) {
  const container = document.getElementById('nc-products-container');
  if (!container) return;
  container.innerHTML = products.map(p => `
    <div class="nc-card">
      <div class="nc-main-wrap">
        <img class="nc-main-img" id="img-product${p.id}" src="${p.imgs[0]}" alt="${p.name}"/>
      </div>
      <div class="nc-thumbs">
        ${p.imgs.map(img => `
          <img class="nc-thumb" src="${img}" onclick="changeMainImg('product${p.id}',this)" alt=""/>
        `).join('')}
      </div>
      <div class="nc-info">
        <h3 class="nc-name">${p.name}</h3>
        <p class="nc-price">${p.price} EG</p>
        <a class="nc-add-btn" onclick="addToCartDirect('img-product${p.id}','${p.name}','${p.price}',this)">
          Add to Cart
        </a>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.nc-card').forEach(card => {
    const firstThumb = card.querySelector('.nc-thumb');
    if (firstThumb) firstThumb.classList.add('active');
  });
}

// On page load: try to seed defaults if DB is empty
seedDefaultProducts().then(() => {
  buildNewCollection();
  buildBestSellers();
});

/* ═══════════════════════════════════════════
   Search
   ═══════════════════════════════════════════ */
function handleSearch(query) {
  const q = query.toLowerCase().trim();

  const main = document.getElementById('search-input');
  const nc = document.getElementById('search-input-nc');
  if (main && main.value !== query) main.value = query;
  if (nc && nc.value !== query) nc.value = query;

  if (q === '') {
    buildNewCollection();
    buildBestSellers();
    return;
  }

  const results = allProducts.filter(p =>
    p.name.toLowerCase().includes(q)
  );

  showPage('new-collection');

  if (results.length > 0) {
    renderProducts(results);
  } else {
    const container = document.getElementById('nc-products-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center;padding:80px 20px;color:#9e8e82;">
          <p style="font-size:48px;margin-bottom:16px;">🔍</p>
          <p style="font-size:18px;font-family:'Playfair Display',serif;color:#3a2e27;margin-bottom:8px;">
            No results for "${query}"
          </p>
          <p style="font-size:13px;">Try: Chiffon · Flowers · Stan · Pashamil · Milt · Tiger</p>
          <a onclick="clearSearch()"
             style="display:inline-block;margin-top:20px;background:#3a2e27;color:#fff;
                    padding:10px 28px;border-radius:20px;cursor:pointer;font-size:13px;">
            Show All Products
          </a>
        </div>
      `;
    }
  }
}

function clearSearch() {
  const main = document.getElementById('search-input');
  const nc = document.getElementById('search-input-nc');
  if (main) main.value = '';
  if (nc) nc.value = '';
  buildNewCollection();
}

/* ═══════════════════════════════════════════
   Navigation
   ═══════════════════════════════════════════ */
function showPage(page) {
  ['main-page','checkout-page','new-collection-page','account-page','success-page']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  const map = {
    'main':           'main-page',
    'checkout':       'checkout-page',
    'new-collection': 'new-collection-page',
    'account':        'account-page',
    'success':        'success-page'
  };
  const target = document.getElementById(map[page]);
  if (target) target.style.display = 'block';
  window.scrollTo(0, 0);
  closeMenu();

  if (page === 'new-collection') {
    buildNewCollection();
  }
}

/* ═══════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════ */
let currentUser = null;

function openAuth() {
  const el = document.getElementById('auth-overlay');
  if (el) el.style.display = 'flex';
  // دايماً افتح على تاب Login
  switchTab('login');
}

function closeAuth() {
  const el = document.getElementById('auth-overlay');
  if (el) el.style.display = 'none';
  const loginErr = document.getElementById('login-error');
  const signupErr = document.getElementById('signup-error');
  if (loginErr) loginErr.innerText = '';
  if (signupErr) signupErr.innerText = '';
}

function switchTab(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
  if (signupForm) signupForm.style.display = tab === 'signup' ? 'block' : 'none';
  if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
  if (tabSignup) tabSignup.classList.toggle('active', tab === 'signup');

  // امسح الأخطاء لما بنبدل تاب
  const loginErr = document.getElementById('login-error');
  const signupErr = document.getElementById('signup-error');
  if (loginErr) loginErr.innerText = '';
  if (signupErr) signupErr.innerText = '';
}

async function signup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-pass').value;
  const err = document.getElementById('signup-error');
  const btn = document.getElementById('signup-btn');

  if (!name || !email || !pass) {
    if (err) err.innerText = 'Please fill all fields.';
    return;
  }
  if (pass.length < 6) {
    if (err) err.innerText = 'Password must be 6+ characters.';
    return;
  }

  // Loading state
  if (btn) { btn.innerText = 'Creating...'; btn.disabled = true; }

  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: pass })
    });

    localStorage.setItem('token', data.token);
    loginUser(data.user);
    closeAuth();
    if (err) err.innerText = '';
  } catch (e) {
    if (err) err.innerText = e.message || 'Registration failed';
  } finally {
    if (btn) { btn.innerText = 'Create Account'; btn.disabled = false; }
  }
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  if (!email || !pass) {
    if (err) err.innerText = 'Please fill all fields.';
    return;
  }

  // Loading state
  if (btn) { btn.innerText = 'Logging in...'; btn.disabled = true; }

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });

    localStorage.setItem('token', data.token);
    loginUser(data.user);
    closeAuth();
    if (err) err.innerText = '';
  } catch (e) {
    if (err) err.innerText = e.message || 'Wrong email or password.';
  } finally {
    if (btn) { btn.innerText = 'Login'; btn.disabled = false; }
  }
}

function loginUser(user) {
  if (!user) {
    console.error('loginUser called with no user data');
    return;
  }
  currentUser = user;
  const navLabel = document.getElementById('nav-account-label');
  if (navLabel) navLabel.innerText = user.name ? user.name.split(' ')[0] : 'User';

  const addrField = document.getElementById('customer-address');
  if (addrField && user.address) addrField.value = user.address;

  const savedAddr = document.getElementById('saved-address');
  if (savedAddr && user.address) savedAddr.value = user.address;

  // اظهر زرار Admin لو الuser ادمن
  const adminBtn = document.getElementById('admin-nav-btn');
  if (adminBtn) adminBtn.style.display = user.role === 'admin' ? 'block' : 'none';
}

function logout() {
  currentUser = null;
  localStorage.removeItem('token');
  const navLabel = document.getElementById('nav-account-label');
  if (navLabel) navLabel.innerText = 'Login';
  const adminBtn = document.getElementById('admin-nav-btn');
  if (adminBtn) adminBtn.style.display = 'none';
  showPage('main');
}

function showAdminPage() {
  // اخفي كل الصفحات
  ['main-page','checkout-page','new-collection-page','account-page','success-page']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  const adminPage = document.getElementById('admin-page');
  if (adminPage) {
    adminPage.style.display = 'block';
    loadAdminDashboard();
  }
  window.scrollTo(0, 0);
}

function handleAccountClick() {
  if (currentUser) { loadAccountPage(); showPage('account'); }
  else { openAuth(); }
}

async function loadAccountPage() {
  if (!currentUser) return;

  try {
    const data = await apiRequest('/auth/me');
    const user = data.user;
    if (!user) return;
    currentUser = user;

    const nameDisplay = document.getElementById('account-name-display');
    const emailDisplay = document.getElementById('account-email-display');
    const savedAddr = document.getElementById('saved-address');
    const ordersList = document.getElementById('orders-list');

    if (nameDisplay) nameDisplay.innerText = '👤 ' + (user.name || 'Unknown');
    if (emailDisplay) emailDisplay.innerText = '📧 ' + (user.email || 'No email');
    if (savedAddr) savedAddr.value = user.address || '';

    const orders = user.orders || [];
    if (ordersList) {
      ordersList.innerHTML = orders.length === 0
        ? '<p style="color:#9e8e82;font-size:13px;">No orders yet.</p>'
        : orders.map(o => `
            <div class="order-item">
              <p class="order-date">${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</p>
              <p class="order-items-text">${o.items ? o.items.map(i => i.name).join(', ') : ''}</p>
              <p class="order-total">${o.totalAmount || 0} EG</p>
            </div>`).join('');
    }
  } catch (e) {
    console.error('Failed to load account:', e);
  }
}

async function saveAddress() {
  if (!currentUser) return;
  const addrEl = document.getElementById('saved-address');
  if (!addrEl) return;
  const addr = addrEl.value.trim();

  try {
    await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ address: addr })
    });
    currentUser.address = addr;
    const customerAddr = document.getElementById('customer-address');
    if (customerAddr) customerAddr.value = addr;
    alert('Address saved! ✅');
  } catch (e) {
    alert('Failed to save address: ' + e.message);
  }
}

async function checkAuth() {
  const token = getToken();
  if (!token) return;

  try {
    const data = await apiRequest('/auth/me');
    if (data.user) {
      loginUser(data.user);
    }
  } catch (e) {
    console.log('Auth check failed, clearing token:', e.message);
    localStorage.removeItem('token');
  }
}

checkAuth().catch(err => {
  console.log('Initial auth check failed:', err.message);
  localStorage.removeItem('token');
});

/* ═══════════════════════════════════════════
   Cart
   ═══════════════════════════════════════════ */
let cart = [];

function updateCart() {
  const cartCount = document.getElementById('cart-count');
  const cartCountNc = document.getElementById('cart-count-nc');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');

  if (cartCount) cartCount.innerText = cart.length;
  if (cartCountNc) cartCountNc.innerText = cart.length;

  if (!cartItems || !cartTotal) return;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    cartTotal.innerText = '0 EG';
    return;
  }
  let total = 0;
  cartItems.innerHTML = cart.map((item, i) => {
    total += parseInt(item.price) * (item.quantity || 1);
    return `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}"/>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">${item.price} EG ${item.quantity > 1 ? 'x' + item.quantity : ''}</p>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
      </div>`;
  }).join('');
  cartTotal.innerText = total + ' EG';
}

function addToCartSimple(name, price, img, e) {
  cart.push({ name, price, img, quantity: 1 });
  updateCart();
  if (e && e.currentTarget) {
    e.currentTarget.style.opacity = '0.6';
    setTimeout(() => e.currentTarget.style.opacity = '1', 400);
  }
}

function addToCartDirect(imgId, name, price, btn) {
  const imgEl = document.getElementById(imgId);
  if (!imgEl) return;
  const card = imgEl.closest('.nc-card');
  if (!card) return;
  const activeThumb = card.querySelector('.nc-thumb.active');
  const img = activeThumb ? activeThumb.src : imgEl.src;
  cart.push({ name, price, img, quantity: 1 });
  updateCart();
  if (btn) {
    btn.innerText = '✓ Added!';
    btn.style.background = '#c9a87c';
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.innerText = 'Add to Cart';
      btn.style.background = '#3a2e27';
      btn.style.pointerEvents = 'auto';
    }, 1200);
  }
}

function removeFromCart(i) { cart.splice(i, 1); updateCart(); }

function openCart() {
  const el = document.getElementById('cart');
  if (el) el.style.display = 'flex';
}
function closeCart() {
  const el = document.getElementById('cart');
  if (el) el.style.display = 'none';
}

/* ═══════════════════════════════════════════
   Checkout
   ═══════════════════════════════════════════ */
let selectedPayment = 'cash';

function selectPayment(method) {
  selectedPayment = method;
  const optWhatsapp = document.getElementById('opt-whatsapp');
  const optVisa = document.getElementById('opt-visa');
  const visaForm = document.getElementById('visa-form');

  if (optWhatsapp) optWhatsapp.classList.toggle('active', method === 'cash');
  if (optVisa) optVisa.classList.toggle('active', method === 'visa');
  if (visaForm) visaForm.style.display = method === 'visa' ? 'block' : 'none';
}

function goToCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  const checkoutItems = document.getElementById('checkout-items');
  const checkoutTotal = document.getElementById('checkout-total-price');
  const customerName = document.getElementById('customer-name');
  const customerAddr = document.getElementById('customer-address');

  if (!checkoutItems || !checkoutTotal) return;

  let total = 0;
  checkoutItems.innerHTML = cart.map(item => {
    total += parseInt(item.price) * (item.quantity || 1);
    return `
      <div class="checkout-item">
        <img src="${item.img}" alt="${item.name}"/>
        <div>
          <p>${item.name}</p>
          <p style="color:#c9a87c;font-weight:600;">${item.price} EG</p>
        </div>
      </div>`;
  }).join('');

  checkoutTotal.innerText = total + ' EG';

  if (currentUser) {
    if (customerName) customerName.value = currentUser.name || '';
    if (customerAddr) customerAddr.value = currentUser.address || '';
  }

  closeCart();
  showPage('checkout');
}

function goBack() {
  showPage('main');
}

async function submitOrder() {
  const nameEl = document.getElementById('customer-name');
  const phoneEl = document.getElementById('customer-phone');
  const addressEl = document.getElementById('customer-address');
  const notesEl = document.getElementById('customer-notes');

  const name = nameEl ? nameEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const address = addressEl ? addressEl.value.trim() : '';
  const notes = notesEl ? notesEl.value.trim() : '';

  if (!name || !phone || !address) {
    alert('Please fill all required fields');
    return;
  }

  if (!currentUser) {
    alert('Please login first');
    openAuth();
    return;
  }

  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }

  const items = cart.map(item => ({
    name: item.name,
    price: parseInt(item.price),
    quantity: item.quantity || 1,
    image: item.img
  }));

  try {
    const data = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items,
        shippingInfo: { fullName: name, phone, address, notes },
        paymentMethod: selectedPayment
      })
    });

    cart = [];
    updateCart();

    const successMsg = document.getElementById('success-message');
    if (successMsg && data.order) {
      successMsg.innerText =
        `Order #${data.order.orderNumber || 'N/A'} confirmed! We will contact you soon.`;
    }
    showPage('success');

  } catch (e) {
    alert('Failed to place order: ' + (e.message || 'Unknown error'));
  }
}

/* ═══════════════════════════════════════════
   Thumbnails
   ═══════════════════════════════════════════ */
function changeMainImg(productId, thumbEl) {
  const imgEl = document.getElementById('img-' + productId);
  if (!imgEl || !thumbEl) return;
  imgEl.classList.add('fade');
  setTimeout(() => {
    imgEl.src = thumbEl.src;
    imgEl.classList.remove('fade');
  }, 200);
  const card = thumbEl.closest('.nc-card');
  if (card) {
    card.querySelectorAll('.nc-thumb').forEach(t => t.classList.remove('active'));
  }
  thumbEl.classList.add('active');
}

/* ═══════════════════════════════════════════
   Visa Format Helpers
   ═══════════════════════════════════════════ */
function formatCard(input) {
  if (!input) return;
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  if (!input) return;
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
  input.value = v;
}
/* ═══════════════════════════════════════════
   ADMIN PRODUCTS MANAGEMENT
   ═══════════════════════════════════════════ */

let productImages = []; // base64 images for new product

// ── Drag & Drop ──────────────────────────────
(function setupDragDrop() {
  document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('prod-img-drop');
    if (!dropArea) return;
    ['dragenter','dragover'].forEach(e => {
      dropArea.addEventListener(e, ev => { ev.preventDefault(); dropArea.classList.add('drag-over'); });
    });
    ['dragleave','drop'].forEach(e => {
      dropArea.addEventListener(e, ev => { ev.preventDefault(); dropArea.classList.remove('drag-over'); });
    });
    dropArea.addEventListener('drop', ev => {
      const files = Array.from(ev.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      processProductImageFiles(files);
    });
  });
})();

function handleProductImages(input) {
  const files = Array.from(input.files);
  processProductImageFiles(files);
  input.value = '';
}

function processProductImageFiles(files) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      productImages.push(e.target.result);
      renderProductPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderProductPreviews() {
  const container = document.getElementById('prod-img-previews');
  if (!container) return;
  container.innerHTML = productImages.map((src, i) => `
    <div class="prod-preview-wrap ${i === 0 ? 'first-badge' : ''}">
      <img src="${src}" alt="preview ${i+1}"/>
      <button class="prod-preview-remove" onclick="removeProductImage(${i})">✕</button>
    </div>
  `).join('');
}

function removeProductImage(index) {
  productImages.splice(index, 1);
  renderProductPreviews();
}

// ── Load/Save Products ───────────────────────
function getLocalProducts() {
  try {
    return JSON.parse(localStorage.getItem('haj_products') || '[]');
  } catch { return []; }
}

function saveLocalProducts(products) {
  localStorage.setItem('haj_products', JSON.stringify(products));
}

// ── Add Product ──────────────────────────────
async function addProduct() {
  const nameEl = document.getElementById('prod-name');
  const priceEl = document.getElementById('prod-price');
  const errEl = document.getElementById('prod-form-error');

  const name = nameEl?.value.trim();
  const price = priceEl?.value.trim();

  if (!name) { errEl.innerText = '❌ Enter product name'; return; }
  if (!price || isNaN(price) || Number(price) <= 0) { errEl.innerText = '❌ Enter valid price'; return; }
  if (productImages.length === 0) { errEl.innerText = '❌ Add at least one image'; return; }
  errEl.innerText = '';

  try {
    await apiRequest('/products', {
      method: 'POST',
     body: JSON.stringify({ name, price, images: productImages, isBestSeller: false })
    });

    nameEl.value = '';
    priceEl.value = '';
    productImages = [];
    renderProductPreviews();
    renderAdminProductsList();
    buildNewCollection();
    buildBestSellers();

    errEl.style.color = '#5a9e6f';
    errEl.innerText = '✅ Product added!';
    setTimeout(() => { errEl.innerText = ''; errEl.style.color = '#e07070'; }, 2000);
  } catch (e) {
    errEl.innerText = '❌ ' + e.message;
  }
}

  // Reset form
  if (nameEl) nameEl.value = '';
  if (priceEl) priceEl.value = '';
  productImages = [];
  renderProductPreviews();

  // Refresh product list & store data
  renderAdminProductsList();
  refreshAllProductsData();

  // Success feedback
  const btn = document.querySelector('#tab-products .admin-login-btn');
  if (btn) {
    btn.innerText = '✅ Product Added!';
    btn.style.background = '#5a9e6f';
    setTimeout(() => { btn.innerText = '✅ Add Product'; btn.style.background = '#3a2e27'; }, 2000);
  }


// ── Toggle Best Seller ───────────────────────
async function toggleBestSeller(id, current) {
  try {
    await apiRequest('/products/' + id, {
      method: 'PUT',
      body: JSON.stringify({ isBestSeller: !current })
    });
    renderAdminProductsList();
    buildBestSellers();
  } catch (e) {
    alert('❌ فشل: ' + e.message);
  }
}

// ── Delete Product ───────────────────────────
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    await apiRequest('/products/' + id, { method: 'DELETE' });
    renderAdminProductsList();
    buildNewCollection();
    buildBestSellers();
  } catch (e) {
    alert('❌ Failed to delete: ' + e.message);
  }
}

// ── Render Admin Products List ───────────────
async function renderAdminProductsList() {
  const container = document.getElementById('admin-products-list');
  const countEl = document.getElementById('products-count');
  if (!container) return;

  try {
    const data = await apiRequest('/products');
    const products = data.products || [];
    if (countEl) countEl.innerText = products.length + ' product(s)';

    if (products.length === 0) {
      container.innerHTML = '<div class="admin-empty"><p>🛍️</p><p>No products yet</p></div>';
      return;
    }

    container.innerHTML = `<div class="admin-products-grid">
      ${products.map(p => `
        <div class="admin-product-card">
          <img class="admin-product-card-img" src="${p.images?.[0] || ''}" alt="${p.name}"/>
          <div class="admin-product-card-body">
            <p class="admin-product-card-name">${p.name}</p>
            <p class="admin-product-card-price">${p.price} EG</p>
            <p class="admin-product-card-imgs">📸 ${p.images?.length || 0} image(s)</p>
            <button
              class="admin-product-bs-btn"
              style="background:${p.isBestSeller ? '#fff3cd' : '#f5f0eb'};color:${p.isBestSeller ? '#856404' : '#9e8e82'};border:1px solid ${p.isBestSeller ? '#ffc107' : '#e0d8d2'};"
              onclick="toggleBestSeller('${p.id}', ${p.isBestSeller})">
              ${p.isBestSeller ? '⭐ Best Seller' : '☆ Set as Best Seller'}
            </button>
            <button class="admin-product-delete-btn" onclick="deleteProduct('${p.id}')">🗑️ Delete</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  } catch (e) {
    container.innerHTML = '<div class="admin-empty"><p>❌ Failed to load products</p></div>';
  }
}

// ── Refresh store products ───────────────────
function refreshAllProductsData() {
  buildNewCollection();
  buildBestSellers();
}



/* ═══════════════════════════════════════════
   ANIMATIONS & SCROLL EFFECTS
   ═══════════════════════════════════════════ */

// ── Nav shrink on scroll ──────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (nav) {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
});

// ── Scroll Reveal ─────────────────────────
function initReveal() {
  const elements = document.querySelectorAll(
    '.about, .products h2, .products-sub, .nc-hero, .footer-top h2'
  );
  elements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', initReveal);

// ── Cart count pop animation ──────────────
const _origUpdateCart = updateCart;
updateCart = function() {
  _origUpdateCart();
  const count = document.getElementById('cart-count');
  if (count) {
    count.classList.remove('pop');
    void count.offsetWidth;
    count.classList.add('pop');
  }
};