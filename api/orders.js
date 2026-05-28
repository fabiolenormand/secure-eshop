const { db } = require('./_firebase');
const { setCors, requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try { requireAuth(req); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const snap = await db.ref('orders').once('value');
  const data = snap.val() || {};
  return res.json(Object.entries(data).map(([id, v]) => ({ ...v, id })));
};
