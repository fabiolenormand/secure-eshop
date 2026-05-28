const { db } = require('../_firebase');
const { setCors, requireAuth } = require('../_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try { requireAuth(req); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
  const { id } = req.query;
  if (req.method === 'PUT') {
    await db.ref('orders/' + id).update(req.body);
    const snap = await db.ref('orders/' + id).once('value');
    return res.json({ ...snap.val(), id });
  }
  if (req.method === 'DELETE') {
    await db.ref('orders/' + id).remove();
    return res.json({ message: 'Order deleted' });
  }
  res.status(405).json({ error: 'Method not allowed' });
};
