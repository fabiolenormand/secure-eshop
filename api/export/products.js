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

  const snapshot = await db.ref('products').once('value');
  const data = snapshot.val() || {};
  const products = Object.entries(data).map(([id, p]) => ({ id, ...p }));

  const headers = ['id','name','price','description','category','stock'];
  const csv = [
    headers.join(','),
    ...products.map(p =>
      headers.map(h => JSON.stringify(p[h] ?? '')).join(',')
    )
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
  return res.send(csv);
};
