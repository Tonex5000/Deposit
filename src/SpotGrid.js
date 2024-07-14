import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { WalletContext } from './WalletContext';

const SpotGrid = () => {
  const { walletAddress } = useContext(WalletContext);
  const [formData, setFormData] = useState({
    symbol: 'BTC/USD',
    lower_price: '',
    upper_price: '',
    grid_intervals: '',
    investment_amount: '',
    wallet_address: ''
  });
  const [responseMessage, setResponseMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      wallet_address: walletAddress
    }));
  }, [walletAddress]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token'); // Assuming JWT is stored in localStorage
      if (!token) {
        setError('User is not authenticated');
        return;
      }
      
      const response = await axios.post('http://127.0.0.1:5000/spot-grid', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setResponseMessage(response.data.msg);
      setError(null);
    } catch (error) {
      console.error('Error starting grid trading:', error);
      setError(error.response ? error.response.data.error : 'Error starting grid trading');
      setResponseMessage(null);
    }
  };

  return (
    <div className="spot-grid">
      <h2>Start Spot Grid Trading</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {responseMessage && <p style={{ color: 'green' }}>{responseMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Symbol:</label>
          <select
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            required
          >
            <option value="BTC/USD">BTC/USD</option>
            <option value="ETH/USD">ETH/USD</option>
            <option value="BNB/USD">BNB/USD</option>
          </select>
        </div>
        <div>
          <label>Lower Price:</label>
          <input
            type="number"
            name="lower_price"
            value={formData.lower_price}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Upper Price:</label>
          <input
            type="number"
            name="upper_price"
            value={formData.upper_price}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Grid Intervals:</label>
          <input
            type="number"
            name="grid_intervals"
            value={formData.grid_intervals}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Investment Amount:</label>
          <input
            type="number"
            name="investment_amount"
            value={formData.investment_amount}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Start Trading</button>
      </form>
    </div>
  );
};

export default SpotGrid;
