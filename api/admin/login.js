const jwt = require('jsonwebtoken');
const { setCors } = require('../_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET || 'supersecret_jwt_key_2024',
      { expiresIn: '8h' }
    );
    return res.json({ token, username });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
};
