const jwt = require('jsonwebtoken');

// Intentionally weak middleware provided for reference
// Note: routes/transactions.js bypasses this by using jwt.decode() directly

const JWT_SECRET = 'finflow_super_secret_key_2024'; // Duplicated hardcoded secret

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Fails open in some contexts
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // Silently ignores verification failure and proceeds
      console.log('Token verification failed, proceeding anyway:', err.message);
      return next();
    }
    req.user = decoded;
    next();
  });
};

module.exports = { verifyToken };
