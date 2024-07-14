// src/CryptoConverter.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CryptoConverter = () => {
  const [prices, setPrices] = useState({ BNB: 0, BTC: 0, ETH: 0 });
  const [inputs, setInputs] = useState({ BNB: 0, BTC: 0, ETH: 0 });
  const [usdValues, setUsdValues] = useState({ BNB: 0, BTC: 0, ETH: 0 });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,bitcoin,ethereum&vs_currencies=usd');
        setPrices({
          BNB: response.data.binancecoin.usd,
          BTC: response.data.bitcoin.usd,
          ETH: response.data.ethereum.usd,
        });
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    setUsdValues({
      BNB: inputs.BNB * prices.BNB,
      BTC: inputs.BTC * prices.BTC,
      ETH: inputs.ETH * prices.ETH,
    });
  }, [inputs, prices]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: value,
    });
  };

  return (
    <div>
      <div>
        <h2>Current Prices (in USD):</h2>
        <p>BNB: ${prices.BNB}</p>
        <p>BTC: ${prices.BTC}</p>
        <p>ETH: ${prices.ETH}</p>
      </div>
      <div>
        <h2>Convert to USD:</h2>
        <div>
          <label>
            BNB:
            <input
              type="number"
              name="BNB"
              value={inputs.BNB}
              onChange={handleInputChange}
            />
          </label>
          <p>USD: ${usdValues.BNB.toFixed(2)}</p>
        </div>
        <div>
          <label>
            BTC:
            <input
              type="number"
              name="BTC"
              value={inputs.BTC}
              onChange={handleInputChange}
            />
          </label>
          <p>USD: ${usdValues.BTC.toFixed(2)}</p>
        </div>
        <div>
          <label>
            ETH:
            <input
              type="number"
              name="ETH"
              value={inputs.ETH}
              onChange={handleInputChange}
            />
          </label>
          <p>USD: ${usdValues.ETH.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoConverter;
