const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_2024';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function writeData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

// PRODUCTS
app.get('/api/products', (req, res) => res.json(readData(PRODUCTS_FILE)));
app.get('/api/products/:id', (req, res) => {
  const p = readData(PRODUCTS_FILE).find(p => p.id === parseInt(req.params.id));
  p ? res.json(p) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/products', requireAuth, (req, res) => {
  const { name, price, description, category, stock, image } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  const products = readData(PRODUCTS_FILE);
  const newProduct = { id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1, name, price: parseFloat(price), description: description || '', category: category || 'General', stock: parseInt(stock) || 0, image: image || '' };
  products.push(newProduct);
  writeData(PRODUCTS_FILE, products);
  res.status(201).json(newProduct);
});
app.put('/api/products/:id', requireAuth, (req, res) => {
  const products = readData(PRODUCTS_FILE);
  const i = products.findIndex(p => p.id === parseInt(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  products[i] = { ...products[i], ...req.body, id: products[i].id };
  writeData(PRODUCTS_FILE, products);
  res.json(products[i]);
});
app.delete('/api/products/:id', requireAuth, (req, res) => {
  let products = readData(PRODUCTS_FILE);
  if (!products.find(p => p.id === parseInt(req.params.id))) return res.status(404).json({ error: 'Not found' });
  writeData(PRODUCTS_FILE, products.filter(p => p.id !== parseInt(req.params.id)));
  res.json({ message: 'Deleted' });
});

// ORDERS
app.get('/api/orders', requireAuth, (req, res) => res.json(readData(ORDERS_FILE)));
app.post('/api/order', (req, res) => {
  const { customerName, customerEmail, items, total } = req.body;
  if (!customerName || !customerEmail || !items?.length) return res.status(400).json({ error: 'Missing fields' });
  const orders = readData(ORDERS_FILE);
  const newOrder = { id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1, customerName, customerEmail, items, total: parseFloat(total), status: 'pending', createdAt: new Date().toISOString() };
  orders.push(newOrder);
  writeData(ORDERS_FILE, orders);
  res.status(201).json({ message: 'Order placed', order: newOrder });
});
app.put('/api/orders/:id', requireAuth, (req, res) => {
  const orders = readData(ORDERS_FILE);
  const i = orders.findIndex(o => o.id === parseInt(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  orders[i] = { ...orders[i], ...req.body, id: orders[i].id };
  writeData(ORDERS_FILE, orders);
  res.json(orders[i]);
});
app.delete('/api/orders/:id', requireAuth, (req, res) => {
  let orders = readData(ORDERS_FILE);
  if (!orders.find(o => o.id === parseInt(req.params.id))) return res.status(404).json({ error: 'Not found' });
  writeData(ORDERS_FILE, orders.filter(o => o.id !== parseInt(req.params.id)));
  res.json({ message: 'Deleted' });
});

// ADMIN AUTH
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ token: jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' }), username });
  } else res.status(401).json({ error: 'Invalid credentials' });
});

// CSV EXPORT
app.get('/api/export/products', requireAuth, (req, res) => {
  const rows = readData(PRODUCTS_FILE).map(p => `${p.id},"${p.name}",${p.price},"${p.category}",${p.stock},"${p.description}"`).join('\n');
  res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="products.csv"');
  res.send('ID,Name,Price,Category,Stock,Description\n' + rows);
});
app.get('/api/export/orders', requireAuth, (req, res) => {
  const rows = readData(ORDERS_FILE).map(o => `${o.id},"${o.customerName}","${o.customerEmail}",${o.total},"${o.status}","${o.createdAt}"`).join('\n');
  res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="orders.csv"');
  res.send('ID,Customer,Email,Total,Status,Date\n' + rows);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log('Secure E-Shop at http://localhost:' + PORT));
