// ===== AUTH HELPERS =====
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user")) || null; }
  catch { return null; }
}
function isAdmin() { const u = getCurrentUser(); return u && u.role === "admin"; }
function isLoggedIn() { return getCurrentUser() !== null; }

// ===== SIDEBAR =====
let menuBtn = document.getElementById("menu-btn");
let sidebar = document.getElementById("sidebar");
if (menuBtn && sidebar) {
  menuBtn.addEventListener("click", () => sidebar.classList.toggle("hide"));
}

// ===== ACCOUNT DROPDOWN =====
let accountBtn = document.getElementById("account-btn");
let accountBox = document.getElementById("account-box");
let accountMsg = document.getElementById("account-msg");
let logoutBtn = document.getElementById("logout-btn");

if (accountBtn) {
  accountBtn.addEventListener("click", function(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (user) {
      accountMsg.textContent = `Hi ${user.name}`;
      if (logoutBtn) logoutBtn.style.display = "block";
    } else {
      accountMsg.textContent = "You are not logged in yet!";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
    accountBox.style.display = accountBox.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", function(e) {
    if (accountBox && !accountBox.contains(e.target) && !accountBtn.contains(e.target)) {
      accountBox.style.display = "none";
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    localStorage.removeItem("favorites");
    window.location.href = "logout.html";
  });
}

// ===== NOTIFICATIONS =====
let notifBtn = document.getElementById("notif-btn");
let notifBox = document.getElementById("notif-box");
let notifCount = document.getElementById("notif-count");
const notifications = ["Your order has been shipped 🚚", "New offer 20% off 🎉", "Vitamin C is back in stock 💊"];
if (notifBtn && notifBox) {
  notifBox.innerHTML = notifications.map(n => `<div class="notif-item">${n}</div>`).join('');
  notifBtn.addEventListener("click", function(e) {
    e.preventDefault();
    notifBox.style.display = notifBox.style.display === "flex" ? "none" : "flex";
    if (notifCount) notifCount.style.display = "none";
  });
}

// ===== SPEECH RECOGNITION =====
let micBtn = document.getElementById("mic-btn");
let searchInput = document.getElementById("search-input");
let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition && micBtn && searchInput) {
  let recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  micBtn.addEventListener("click", () => recognition.start());
  recognition.addEventListener("result", e => { searchInput.value = e.results[0][0].transcript; });
}

// ===== CART =====
let cartBtn = document.getElementById("cart-btn");
let cartBox = document.getElementById("cart-box");
let cartItemsContainer = document.getElementById("cart-items");
let cartCount = document.getElementById("cart-count");
let cartEmpty = document.getElementById("cart-empty");
let cart = JSON.parse(localStorage.getItem("cart")) || [];

if (cartBtn && cartBox) {
  cartBtn.addEventListener("click", function(e) {
    e.preventDefault();
    cartBox.style.display = cartBox.style.display === "flex" ? "none" : "flex";
  });
}

function updateCartUI() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = "";
  if (cart.length === 0) {
    if (cartEmpty) cartEmpty.style.display = "block";
    if (cartCount) cartCount.textContent = 0;
  } else {
    if (cartEmpty) cartEmpty.style.display = "none";
    cart.forEach((item, index) => {
      let div = document.createElement("div");
      div.classList.add("cart-item");
      div.innerHTML = `
        <img src="${item.imgSrc}" alt="${item.name}">
        <h5>${item.name}</h5>
        <p>${item.price} L.E</p>
        <span class="remove-btn" data-index="${index}">&times;</span>
      `;
      cartItemsContainer.appendChild(div);
    });
    if (cartCount) cartCount.textContent = cart.length;
    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        cart.splice(parseInt(btn.getAttribute("data-index")), 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI();
      });
    });
  }
}
updateCartUI();

document.querySelectorAll(".add-to-cart").forEach(btn => {
  btn.addEventListener("click", function() {
    let product = btn.closest(".product-item");
    let name = product.querySelector("h4").textContent.trim();
    let priceText = product.querySelector("p").textContent.trim();
    let price = parseFloat(priceText.replace(/[^\d.]/g, ''));
    let imgSrc = product.querySelector("img").src;
    cart.push({ name, price, imgSrc });
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();
    showToast("Added to cart 🛒");
  });
});

// ===== CHECKOUT BUTTON =====
let checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (!isLoggedIn()) {
      alert("Please log in first to proceed with checkout");
      window.location.href = "logout.html";
    } else {
      window.location.href = "checkout.html";
    }
  });
}

// ===== CONTACT =====
let contactBtn = document.getElementById("contact-btn");
let contactSpace = document.getElementById("contact-space");
if (contactBtn && contactSpace) {
  contactBtn.addEventListener("click", function(e) {
    e.preventDefault();
    contactSpace.classList.toggle("hide");
  });
}

// ===== FAVORITES =====
function initFavorites() {
  document.querySelectorAll(".add-to-favorite").forEach(button => {
    let product = button.closest(".product-item");
    if (!product) return;
    let name = product.querySelector("h4").textContent.trim();
    let price = product.querySelector("p").textContent.replace("L.E", "").replace("$", "").trim();
    let imgSrc = product.querySelector("img").getAttribute("src");
    let productId = "product-" + name.replace(/\s+/g, '-');
    product.id = productId;
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.some(item => item.name === name)) {
      button.classList.add("active");
      button.innerHTML = '<i class="material-icons">favorite</i>';
    }
    button.addEventListener("click", function() {
      let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
      let index = favorites.findIndex(item => item.name === name);
      if (index === -1) {
        favorites.push({ name, price, imgSrc });
        button.classList.add("active");
        button.innerHTML = '<i class="material-icons">favorite</i>';
        showToast("Added to Favorites ❤️");
      } else {
        favorites.splice(index, 1);
        button.classList.remove("active");
        button.innerHTML = '<i class="material-icons">favorite_border</i>';
        showToast("Removed from Favorites 💔");
      }
      localStorage.setItem("favorites", JSON.stringify(favorites));
    });
  });
}
initFavorites();

// ===== SCROLL TO PRODUCT FROM FAVORITES =====
if (window.location.hash) {
  let id = window.location.hash.substring(1);
  let product = document.getElementById(id);
  if (product) {
    product.scrollIntoView({ behavior: "smooth", block: "start" });
    product.classList.add("highlight");
    setTimeout(() => product.classList.remove("highlight"), 2000);
  }
}

// ===== TOAST =====
function showToast(message) {
  let toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 2000);
}
