const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// ⚠️ Insecure CORS — allows any origin
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// ⚠️ Hardcoded JWT secret — should be in environment variable
const JWT_SECRET = 'finflow_super_secret_key_2024';

// ⚠️ Hardcoded Stripe API key — credential exposure
const STRIPE_SECRET_KEY = 'FINFLOW_DEMO_USE_ENV_NOT_A_REAL_STRIPE_KEY';

// ⚠️ Hardcoded database credentials
const DB_PASSWORD = 'Admin1234!';
const DB_HOST = 'finflow-prod.cluster-abc123.eu-west-1.rds.amazonaws.com';

// In-memory SQLite for demo
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT,
    balance REAL,
    role TEXT
  )`);

  db.run(`CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    from_user TEXT,
    to_user TEXT,
    amount REAL,
    created_at TEXT
  )`);

  // Seed data
  db.run(`INSERT INTO users VALUES (1, 'alice', 'password123', 50000.00, 'user')`);
  db.run(`INSERT INTO users VALUES (2, 'bob', 'qwerty', 12000.00, 'user')`);
  db.run(`INSERT INTO users VALUES (3, 'admin', 'admin', 999999.99, 'admin')`);
});

// Routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

// ⚠️ Unsafe eval — arbitrary code execution risk
app.post('/api/calculate', (req, res) => {
  const { formula } = req.body;
  try {
    // Never use eval() with user input
    const result = eval(formula);
    res.json({ result });
  } catch (e) {
    res.status(400).json({ error: 'Invalid formula' });
  }
});

// ⚠️ Verbose error messages leak stack traces to client
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    dbHost: DB_HOST
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FinFlow API running on port ${PORT}`);
  console.log(`JWT Secret: ${JWT_SECRET}`); // ⚠️ Logging secrets
});

module.exports = { db, JWT_SECRET };
