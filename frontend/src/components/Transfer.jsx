import React, { useState } from 'react';
import { transfer } from '../utils/api';

const Transfer = () => {
  const [toUser, setToUser] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();

    // No client-side validation — negative amounts, zero, or strings allowed
    try {
      const res = await transfer(toUser, amount);
      setStatus(`Transfer complete! ID: ${res.data.transactionId}`);
    } catch (err) {
      // Leaking full error response to UI
      setStatus(`Error: ${JSON.stringify(err.response?.data)}`);
    }
  };

  return (
    <div className="transfer">
      <h2>Send Money</h2>
      <form onSubmit={handleTransfer}>
        <input
          type="text"
          placeholder="Recipient username"
          value={toUser}
          onChange={(e) => setToUser(e.target.value)}
          // No maxLength, no input sanitisation
        />
        <input
          type="text"
          placeholder="Amount (£)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          // Accepts any string — not restricted to number
        />
        <button type="submit">Transfer</button>
      </form>

      {/* Unsanitised status output — could reflect injected content */}
      {status && <p className="status">{status}</p>}
    </div>
  );
};

export default Transfer;
