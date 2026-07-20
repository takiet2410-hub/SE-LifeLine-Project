const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-lifeline';

const token = jwt.sign(
  { id: 'test-staff-001', role: 'Blood Center Staff' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log(token);
