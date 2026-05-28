const { db } = require('../_firebase');
const { setCors, requireAuth } = require('../_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { id } = req.query;

  if (req.method === 'GET') {
    const snap = await db.ref('products/' + id).once('value');
    if (!snap.val()) return res.status(404).json({ error: 'Not found' });
    return res.json({ ...snap.val(), id });
  }

  if (req.method === 'PUT') {
    try { requireAuth(req); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
    await db.ref('products/' + id).update(req.body);
    const snap = await db.ref('products/' + id).once('value');
    return res.json({ ...snap.val(), id });
  }

  if (req.method === 'DELETE') {
    try { requireAuth(req); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
    await db.ref('products/' + id).remove();
    return res.json({ message: 'Product deleted' });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
