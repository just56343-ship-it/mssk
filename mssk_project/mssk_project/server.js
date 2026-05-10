const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // ✅ بيقرأ الملفات من نفس فولدر server.js

// ===== DATA FILES =====
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');

function readJSON(filePath, defaultValue = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return defaultValue; }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ===== DEFAULT DATA =====
function initData() {
  if (!fs.existsSync(USERS_FILE)) {
    writeJSON(USERS_FILE, [
      { id: 1, username: 'admin', password: '1234', name: 'Administrator', email: 'admin@mssk.com', role: 'admin' },
      { id: 2, username: 'user', password: '1234', name: 'Demo User', email: 'user@example.com', role: 'customer' }
    ]);
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    writeJSON(PRODUCTS_FILE, [
      { id: 1, name: 'Cosmetics Kit 1', category: 'Cosmetics', price: 550, stock: 20, image: 'assets/images/cos2.jpg' },
      { id: 2, name: 'Cosmetics Kit 2', category: 'Cosmetics', price: 450, stock: 15, image: 'assets/images/cos1.jpg' },
      { id: 3, name: 'Cosmetics Kit 3', category: 'Cosmetics', price: 357, stock: 30, image: 'assets/images/cos3.jpg' },
      { id: 4, name: 'Mom & Baby Set 1', category: 'Mom & Baby', price: 100, stock: 50, image: 'assets/images/baby1.jpg' },
      { id: 5, name: 'Mom & Baby Set 2', category: 'Mom & Baby', price: 500, stock: 25, image: 'assets/images/baby2.jpg' },
      { id: 6, name: 'Mom & Baby Set 3', category: 'Mom & Baby', price: 400, stock: 40, image: 'assets/images/baby3.jpg' },
      { id: 7, name: 'First Aid Kit 1', category: 'First Aid', price: 28000, stock: 5, image: 'assets/images/aid1.jpg' },
      { id: 8, name: 'First Aid Kit 2', category: 'First Aid', price: 100, stock: 100, image: 'assets/images/aid22.jpg' },
      { id: 9, name: 'First Aid Kit 3', category: 'First Aid', price: 265, stock: 60, image: 'assets/images/aid3.jpg' },
      { id: 10, name: 'Pil 1', category: 'Medicines', price: 40, stock: 200, image: 'assets/images/pil1.jpeg' },
      { id: 11, name: 'Pil 2', category: 'Medicines', price: 80, stock: 150, image: 'assets/images/pil2.jpeg' },
      { id: 12, name: 'Pil 3', category: 'Medicines', price: 100, stock: 120, image: 'assets/images/pil3.jpeg' },
      { id: 13, name: 'Vitamin 1', category: 'Vitamins', price: 650, stock: 80, image: 'assets/images/v1.jpeg' },
      { id: 14, name: 'Vitamin 2', category: 'Vitamins', price: 1750, stock: 30, image: 'assets/images/v2.jpeg' },
      { id: 15, name: 'Vitamin 3', category: 'Vitamins', price: 899, stock: 45, image: 'assets/images/v3.jpeg' }
    ]);
  }
  if (!fs.existsSync(ORDERS_FILE)) writeJSON(ORDERS_FILE, []);
  if (!fs.existsSync(CARTS_FILE)) writeJSON(CARTS_FILE, {});
  if (!fs.existsSync(FAVORITES_FILE)) writeJSON(FAVORITES_FILE, {});
}
initData();

// ===== AUTH =====
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid username or password' });
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, name, email } = req.body;
  const users = readJSON(USERS_FILE);
  if (users.find(u => u.username === username))
    return res.status(400).json({ success: false, message: 'Username already exists' });
  const newUser = { id: Date.now(), username, password, name: name || username, email: email || '', role: 'customer' };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  const { password: _, ...safe } = newUser;
  res.json({ success: true, user: safe });
});

// ===== PRODUCTS =====
app.get('/api/products', (req, res) => res.json(readJSON(PRODUCTS_FILE)));

app.post('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const newProduct = {
    id: Date.now(),
    name: req.body.name,
    category: req.body.category,
    price: parseFloat(req.body.price),
    stock: parseInt(req.body.stock) || 0,
    image: req.body.image || 'assets/images/pharmacy2.jpeg'
  };
  products.push(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true, product: newProduct });
});

app.put('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Product not found' });
  products[index] = { ...products[index], ...req.body };
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true, product: products[index] });
});

app.delete('/api/products/:id', (req, res) => {
  let products = readJSON(PRODUCTS_FILE);
  products = products.filter(p => p.id != req.params.id);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true });
});

// ===== ORDERS =====
app.get('/api/orders', (req, res) => res.json(readJSON(ORDERS_FILE)));

app.post('/api/orders', (req, res) => {
  const orders = readJSON(ORDERS_FILE);
  const { customer, items, total, address, phone, paymentMethod } = req.body;
  const newOrder = {
    id: 'ORD-' + Date.now(),
    customer: customer || 'Guest',
    items: items || [],
    total: parseFloat(total) || 0,
    address: address || '',
    phone: phone || '',
    paymentMethod: paymentMethod || 'cash',
    status: 'pending',
    date: new Date().toLocaleDateString()
  };
  orders.push(newOrder);
  writeJSON(ORDERS_FILE, orders);
  const products = readJSON(PRODUCTS_FILE);
  (items || []).forEach(item => {
    const prod = products.find(p => p.name === item.name);
    if (prod) prod.stock = Math.max(0, prod.stock - 1);
  });
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true, order: newOrder });
});

app.put('/api/orders/:id', (req, res) => {
  const orders = readJSON(ORDERS_FILE);
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Order not found' });
  orders[index] = { ...orders[index], ...req.body };
  writeJSON(ORDERS_FILE, orders);
  res.json({ success: true, order: orders[index] });
});

// ===== CART =====
app.get('/api/cart/:userId', (req, res) => {
  const carts = readJSON(CARTS_FILE);
  res.json(carts[req.params.userId] || []);
});
app.post('/api/cart/:userId', (req, res) => {
  const carts = readJSON(CARTS_FILE);
  if (!carts[req.params.userId]) carts[req.params.userId] = [];
  carts[req.params.userId].push(req.body);
  writeJSON(CARTS_FILE, carts);
  res.json({ success: true, cart: carts[req.params.userId] });
});
app.delete('/api/cart/:userId/:index', (req, res) => {
  const carts = readJSON(CARTS_FILE);
  if (carts[req.params.userId]) carts[req.params.userId].splice(parseInt(req.params.index), 1);
  writeJSON(CARTS_FILE, carts);
  res.json({ success: true });
});
app.delete('/api/cart/:userId', (req, res) => {
  const carts = readJSON(CARTS_FILE);
  carts[req.params.userId] = [];
  writeJSON(CARTS_FILE, carts);
  res.json({ success: true });
});

// ===== FAVORITES =====
app.get('/api/favorites/:userId', (req, res) => {
  const favorites = readJSON(FAVORITES_FILE);
  res.json(favorites[req.params.userId] || []);
});
app.post('/api/favorites/:userId', (req, res) => {
  const favorites = readJSON(FAVORITES_FILE);
  if (!favorites[req.params.userId]) favorites[req.params.userId] = [];
  const exists = favorites[req.params.userId].find(f => f.name === req.body.name);
  if (!exists) { favorites[req.params.userId].push(req.body); writeJSON(FAVORITES_FILE, favorites); }
  res.json({ success: true, favorites: favorites[req.params.userId] });
});
app.delete('/api/favorites/:userId/:productName', (req, res) => {
  const favorites = readJSON(FAVORITES_FILE);
  if (favorites[req.params.userId]) {
    favorites[req.params.userId] = favorites[req.params.userId].filter(
      f => f.name !== decodeURIComponent(req.params.productName)
    );
    writeJSON(FAVORITES_FILE, favorites);
  }
  res.json({ success: true });
});

// ===== USERS =====
app.get('/api/users', (req, res) => {
  const users = readJSON(USERS_FILE);
  res.json(users.map(({ password, ...u }) => u));
});

// ===== STATS =====
app.get('/api/stats', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const orders = readJSON(ORDERS_FILE);
  const users = readJSON(USERS_FILE);
  res.json({
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    totalOrders: orders.length,
    totalProducts: products.length,
    totalUsers: users.length,
    lowStock: products.filter(p => p.stock < 10).length
  });
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`✅ MSSK Server running on http://localhost:${PORT}`);
  console.log(`📂 Serving files from: ${__dirname}`);
});
