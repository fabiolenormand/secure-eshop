const { db } = require('../_firebase');
const { setCors, requireAuth } = require('../_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    requireAuth(req);
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const snapshot = await db.ref('orders').once('value');
  const data = snapshot.val() || {};
  const orders = Object.entries(data).map(([id, o]) => ({ id, ...o }));

  const headers = ['id','customerName','customerEmail','total','status','createdAt'];
  const csv = [
    headers.join(','),
    ...orders.map(o =>
      headers.map(h => JSON.stringify(o[h] ?? '')).join(',')
    )
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  return res.send(csv);
};
