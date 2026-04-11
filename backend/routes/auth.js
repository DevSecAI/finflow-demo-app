const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db, JWT_SECRET } = require('../server');

// ⚠️ SQL Injection — user input concatenated directly into query
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Vulnerable query — attacker can bypass auth with: ' OR '1'='1
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(query, (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ⚠️ JWT signed with weak algorithm and hardcoded secret
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '30d' } // ⚠️ Excessively long token expiry
    );

    // ⚠️ Returning full user object including password hash
    res.json({ token, user });
  });
});

// ⚠️ No rate limiting on registration — open to abuse
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // ⚠️ Storing plaintext password — never hash with MD5/SHA1/nothing
  const query = `INSERT INTO users (username, password, balance, role)
                 VALUES ('${username}', '${password}', 0, 'user')`;

  db.run(query, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User created', id: this.lastID });
  });
});

// ⚠️ Password reset with predictable token
router.post('/reset-password', (req, res) => {
  const { email } = req.body;
  // Predictable reset token — based on email + timestamp (no entropy)
  const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  res.json({ resetToken, message: `Send this to ${email}` });
});

module.exports = router;
