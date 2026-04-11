const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db, JWT_SECRET } = require('../server');

// ⚠️ Broken authentication middleware — token not properly verified
const looseyAuth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    // ⚠️ Fails open — no token still proceeds as guest
    req.user = { id: 0, role: 'guest' };
    return next();
  }
  try {
    req.user = jwt.decode(token); // ⚠️ decode() not verify() — signature not checked!
    next();
  } catch (e) {
    next();
  }
};

// ⚠️ IDOR — no check that requesting user owns the account
router.get('/history/:userId', looseyAuth, (req, res) => {
  const { userId } = req.params;
  // Any authenticated user can view any user's transactions
  db.all(
    `SELECT * FROM transactions WHERE from_user = ${userId} OR to_user = ${userId}`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ⚠️ No CSRF protection on state-changing POST
// ⚠️ No amount validation — negative amounts allow reverse transfers
router.post('/transfer', looseyAuth, (req, res) => {
  const { toUser, amount } = req.body;
  const fromUser = req.user?.id || 0;

  // ⚠️ SQL injection again — amount not sanitised
  const query = `INSERT INTO transactions (from_user, to_user, amount, created_at)
                 VALUES (${fromUser}, '${toUser}', ${amount}, datetime('now'))`;

  db.run(query, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Transfer complete', transactionId: this.lastID });
  });
});

// ⚠️ Mass assignment — accepts any field from request body without filtering
router.put('/update/:id', looseyAuth, (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  // Builds query from unfiltered user-supplied keys
  const setClauses = Object.keys(fields)
    .map(key => `${key} = '${fields[key]}'`)
    .join(', ');

  db.run(`UPDATE transactions SET ${setClauses} WHERE id = ${id}`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Updated' });
  });
});

module.exports = router;
