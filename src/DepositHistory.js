import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DepositHistory = () => {
  const [depositHistory, setDepositHistory] = useState([]);
  const [error, setError] = useState(null);
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1LCJleHAiOjE3MjMyNjExODR9.OjN4VgtFO85BEIhcOyEPGz6H3S6M8yIUQGMdO5HpHUk';
  localStorage.setItem('token', token);

  useEffect(() => {
    const fetchDepositHistory = async () => {
      try {
        const response = await fetch('https://trading-2-3d4p.onrender.com/deposit_history', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setDepositHistory(data);
      } catch (err) {
        console.error('Error fetching deposit history:', err);
        setError('Error fetching deposit history');
        if (err.message === 'User does not exist') {
          if (!toast.isActive(13, "friendRequest")) {
            toast.error('User does not exist', {
              position: "bottom-right",
              autoClose: false,
              closeOnClick: true,
              draggable: false,
              type: "error",
              toastId: 13
            });
          }
        } else {
          toast.error(error, {
            autoClose: 5000,
          });
        }
      }
    };
    fetchDepositHistory();
  }, [error, token]); // Include 'error' and 'token' in dependencies to update when they change

  return (
    <div>
      <ToastContainer containerId={"friendRequest"}/>
      <h2>Deposit History</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Amount</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {depositHistory.map((deposit, index) => (
            <tr key={index}>
              <td>{deposit.amount}</td>
              <td>{deposit.status}</td>
              <td>{new Date(deposit.timestamp * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepositHistory;
