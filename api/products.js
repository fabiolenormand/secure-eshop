const { db } = require('./_firebase');
const { setCors, requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const snap = await db.ref('products').once('value');
    const data = snap.val() || {};
    return res.json(Object.entries(data).map(([id, v]) => ({ ...v, id })));
  }

  if (req.method === 'POST') {
    try { requireAuth(req); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
    const { name, price, description, category, stock, image } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const product = { name, price: parseFloat(price), description: description||'', category: category||'General', stock: parseInt(stock)||0, image: image||'' };
    const ref = await db.ref('products').push(product);
    return res.status(201).json({ ...product, id: ref.key });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
