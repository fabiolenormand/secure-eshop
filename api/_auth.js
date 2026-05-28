const jwt = require('jsonwebtoken');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function requireAuth(req) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'supersecret_jwt_key_2024');
}

module.exports = { setCors, requireAuth };
