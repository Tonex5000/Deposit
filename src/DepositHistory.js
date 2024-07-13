// DepositHistory.js
import React, { useEffect, useState, useContext } from 'react';
import { WalletContext } from './WalletContext';
import axios from 'axios';

const DepositHistory = () => {
  const { walletAddress } = useContext(WalletContext);
  const [depositHistory, setDepositHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepositHistory = async () => {
      try {
        if (walletAddress) {
          const token = localStorage.getItem('token'); // Assuming JWT is stored in localStorage
          const response = await axios.get('http://127.0.0.1:5000/deposit_history', {
            params: { walletAddress },
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setDepositHistory(response.data);
        }
      } catch (error) {
        console.error('Error fetching deposit history:', error);
        setError(error.message);
      }
    };

    fetchDepositHistory(); // Initial fetch

    const intervalId = setInterval(fetchDepositHistory, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, [walletAddress]);

  return (
    <div className="deposit-history">
      <h2>Deposit History</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Amount (BNB)</th>
            <th>Status</th>
            <th>Timestamp</th>
            <th>Transaction Hash</th>
            <th>Contract Address</th>
            <th>Transaction Fee</th>
          </tr>
        </thead>
        <tbody>
          {depositHistory.map((deposit, index) => (
            <tr key={index}>
              <td>{deposit.amount}</td>
              <td>{deposit.status}</td>
              <td>{new Date(deposit.timestamp * 1000).toLocaleString()}</td>
              <td>{deposit.transaction_hash}</td>
              <td>{deposit.contract_address}</td>
              <td>{deposit.transaction_fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepositHistory;
