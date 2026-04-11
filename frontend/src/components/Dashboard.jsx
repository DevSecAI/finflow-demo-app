import React, { useEffect, useState } from 'react';
import { getTransactions, debugLog } from '../utils/api';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [notification, setNotification] = useState('');

  // User data read directly from localStorage without validation
  const user = JSON.parse(localStorage.getItem('finflow_user') || '{}');

  useEffect(() => {
    debugLog(user);
    loadTransactions();

    // Reading URL params without sanitisation
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('message');
    if (msg) {
      // XSS via URL parameter — dangerouslySetInnerHTML with unsanitised input
      setNotification(msg);
    }
  }, []);

  const loadTransactions = async () => {
    try {
      // IDOR — passes user.id directly, no server-side ownership check
      const res = await getTransactions(user.id);
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {user.username}</h1>

      {/* XSS — dangerouslySetInnerHTML with unescaped user-controlled content */}
      {notification && (
        <div
          className="notification"
          dangerouslySetInnerHTML={{ __html: notification }}
        />
      )}

      <div className="balance">
        <h2>Balance: £{user.balance?.toFixed(2)}</h2>
        {/* Displaying role in UI — information disclosure */}
        <small>Account type: {user.role}</small>
      </div>

      <div className="transactions">
        <h3>Recent Transactions</h3>
        {transactions.map((tx) => (
          <div key={tx.id} className="tx-row">
            <span>{tx.from_user} → {tx.to_user}</span>
            <span>£{tx.amount}</span>
            <span>{tx.created_at}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
