const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'haj_secret_key_2025';
const DB_FILE = 'database.json';

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// ── Database Helpers ──────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const init = { users: {}, orders: {}, products: {}, nextId: 1 };
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Auth Middleware ───────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.userId = jwt.verify(token, JWT_SECRET).userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  const db = readDB();
  const user = db.users[req.userId];
  if (!user || user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
}

// ── Root ──────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ success: true, message: 'Haj API شغال ✅' }));

// ════════════════════════════════════════════
//  AUTH  /api/auth/...
// ════════════════════════════════════════════

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'كل الحقول مطلوبة' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'الباسورد لازم يكون 6 حروف على الأقل' });

    const db = readDB();
    if (Object.values(db.users).find(u => u.email === email))
      return res.status(400).json({ success: false, message: 'الإيميل ده مسجل قبل كده' });

    const userId = 'user_' + (db.nextId || 1);
    db.nextId = (db.nextId || 1) + 1;
    db.users[userId] = {
      id: userId, name, email,
      password: await bcrypt.hash(password, 10),
      address: '', phone: '', orders: [], cart: [],
      role: 'user', createdAt: new Date().toISOString()
    };
    writeDB(db);

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...userSafe } = db.users[userId];
    return res.status(201).json({ success: true, token, user: userSafe });
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'كل الحقول مطلوبة' });

    const db = readDB();
    const user = Object.values(db.users).find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'الإيميل أو الباسورد غلط' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...userSafe } = user;
    return res.json({ success: true, token, user: userSafe });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const user = db.users[req.userId];
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { password: _, ...userSafe } = user;
    return res.json({ success: true, user: userSafe });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/auth/profile', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const user = db.users[req.userId];
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { address, phone, name } = req.body;
    if (address !== undefined) user.address = address;
    if (phone   !== undefined) user.phone   = phone;
    if (name    !== undefined) user.name    = name;
    writeDB(db);
    const { password: _, ...userSafe } = user;
    return res.json({ success: true, user: userSafe });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════
//  PRODUCTS  /api/products/...
// ════════════════════════════════════════════

app.get('/api/products', (req, res) => {
  try {
    const db = readDB();
    return res.json({ success: true, products: Object.values(db.products || {}) });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/products/bestsellers/list', (req, res) => {
  try {
    const db = readDB();
    const products = Object.values(db.products || {})
      .filter(p => p.isBestSeller === true);
    return res.json({ success: true, products });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
app.post('/api/products', authMiddleware, adminMiddleware, (req, res) => {
  try {
   const { name, price, images, isBestSeller } = req.body;
    if (!name || !price)
      return res.status(400).json({ success: false, message: 'Name and price required' });

    const db = readDB();
    if (!db.products) db.products = {};

    const productId = 'prod_' + Date.now();
    db.products[productId] = {
      id: productId,
      name,
      price: Number(price),
     images: images || [],
      isBestSeller: isBestSeller || false,
      createdAt: new Date().toISOString()
    };
    writeDB(db);
    return res.status(201).json({ success: true, product: db.products[productId] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = readDB();
    const product = db.products?.[req.params.id];
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const { name, price, isBestSeller } = req.body;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = Number(price);
    if (isBestSeller !== undefined) product.isBestSeller = isBestSeller;
    writeDB(db);
    return res.json({ success: true, product });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/products/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = readDB();
    if (!db.products?.[req.params.id])
      return res.status(404).json({ success: false, message: 'Product not found' });
    delete db.products[req.params.id];
    writeDB(db);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
// ════════════════════════════════════════════
//  ORDERS  /api/orders/...
// ════════════════════════════════════════════

app.post('/api/orders', authMiddleware, (req, res) => {
  try {
    const { items, shippingInfo, paymentMethod } = req.body;
    if (!items || !shippingInfo?.fullName || !shippingInfo?.phone || !shippingInfo?.address)
      return res.status(400).json({ success: false, message: 'بيانات الأوردر ناقصة' });

    const db = readDB();
    if (!db.orders) db.orders = {};

    const orderId = 'order_' + Date.now();
    const order = {
      id: orderId,
      orderNumber: 'HAJ-' + Date.now().toString().slice(-6),
      userId: req.userId,
      items,
      shippingInfo,
      paymentMethod: paymentMethod || 'cash',
      totalAmount: items.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
      orderStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    db.orders[orderId] = order;
    if (db.users[req.userId]) {
      if (!db.users[req.userId].orders) db.users[req.userId].orders = [];
      db.users[req.userId].orders.push(order);
    }
    writeDB(db);
    return res.status(201).json({ success: true, order });
  } catch (e) {
    console.error('Order error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════
//  ADMIN  /api/admin/...
// ════════════════════════════════════════════

app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = readDB();
    const orders = Object.values(db.orders || {});
    const users  = Object.values(db.users  || {}).filter(u => u.role !== 'admin');
    return res.json({
      success: true,
      stats: {
        totalRevenue:  orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        totalOrders:   orders.length,
        totalUsers:    users.length,
        pendingOrders: orders.filter(o => o.orderStatus === 'pending').length
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/orders', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = readDB();
    const orders = Object.values(db.orders || {})
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(order => {
        const user = db.users[order.userId];
        return {
          ...order,
          userName: user ? user.name : 'Unknown',
          userEmail: user ? user.email : 'N/A',
          userPhone: user ? (user.phone || 'N/A') : 'N/A',
          userAddress: user ? (user.address || 'N/A') : 'N/A'
        };
      });
    return res.json({ success: true, orders });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/admin/orders/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = readDB();
    const order = db.orders[req.params.id];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.orderStatus = req.body.status;
    writeDB(db);
    return res.json({ success: true, order });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = readDB();
    const users = Object.values(db.users || {}).map(u => {
      const { password: _, ...safe } = u;
      return { ...safe, ordersCount: (u.orders || []).length };
    });
    return res.json({ success: true, users });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => console.log(`✅ Haj Server شغال على port ${PORT}`));