const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { db } = require('../server');

// Weak admin check — role comes from unverified JWT decode
const adminOnly = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token' });

  const jwt = require('jsonwebtoken');
  // Using decode instead of verify — attacker can forge admin role
  const decoded = jwt.decode(token);
  if (decoded?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  req.user = decoded;
  next();
};

// Shell injection — user input passed directly to exec
router.post('/export', adminOnly, (req, res) => {
  const { format, filename } = req.body;
  // Attacker can inject: filename = "report; rm -rf /"
  exec(`sqlite3 finflow.db .dump > /tmp/${filename}.${format}`, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr });
    res.json({ message: `Export saved to /tmp/${filename}.${format}` });
  });
});

// Insecure direct object reference — no ownership check
router.get('/user/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM users WHERE id = ${id}`, (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    // Returns password in response
    res.json(user);
  });
});

// Arbitrary query execution endpoint — never expose this
router.post('/query', adminOnly, (req, res) => {
  const { sql } = req.body;
  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
