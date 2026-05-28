const { db } = require('./_firebase');
const { setCors } = require('./_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { customerName, customerEmail, items, total } = req.body;
  if (!customerName || !customerEmail || !items?.length) return res.status(400).json({ error: 'Missing fields' });
  const order = { customerName, customerEmail, items, total: parseFloat(total), status: 'pending', createdAt: new Date().toISOString() };
  const ref = await db.ref('orders').push(order);
  return res.status(201).json({ message: 'Order placed', order: { ...order, id: ref.key } });
};
