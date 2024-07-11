import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import { Web3Provider } from '@ethersproject/providers';
import { formatEther, parseEther } from 'ethers';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const injected = injectedModule();
const onboard = Onboard({
  wallets: [injected],
  chains: [
    {
      id: '0x38', // Chain ID for Binance Smart Chain
      token: 'BNB',
      label: 'Binance Smart Chain',
      rpcUrl: 'https://bsc-dataseed.binance.org/'
    }
  ],
  appMetadata: {
    name: 'My Web3 App',
    icon: '<svg><svg/>', // You can use a valid SVG icon here
    description: 'A simple web3-onboard example'
  }
});

const contractAddress = "0x80fE0E686e1E5D46Ff4c6AaeBb70f4B2153C3485"; // Replace with your contract address
const contractABI = [
  
  {
    "inputs": [],
    "stateMutability": "payable",
    "type": "function",
    "name": "deposit"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BNBReceived",
    "type": "event"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  },
  {
    "inputs": [],
    "name": "getTotalBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getUserDepositBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const ConnectWallet = () => {
  const [wallets, setWallets] = useState([]);
  const [userAddress, setUserAddress] = useState(null);
  const [error, setError] = useState(null);
  const [userDepositBalance, setUserDepositBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [usdBalance, setUsdBalance] = useState(0);

  const fetchBnbToUsdRate = async () => {
    const maxRetries = 3;
    let attempts = 0;
    let success = false;
    let rate = null;
  
    while (attempts < maxRetries && !success) {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: { ids: 'binancecoin', vs_currencies: 'usd' }
        });
        rate = response.data.binancecoin.usd;
        success = true;
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} - Error fetching BNB to USD conversion rate:`, error.message);
        if (attempts >= maxRetries) {
          toast.error('Network error: Unable to fetch BNB to USD conversion rate. Please try again later.');
        }
      }
    }
    
    return rate;
  };
  

  const updateUsdBalance = async (bnbBalance) => {
    const rate = await fetchBnbToUsdRate();
    if (rate) {
      setUsdBalance((bnbBalance * rate).toFixed(2));
    }
  };

  const connectWallet = async () => {
    try {
      const connectedWallets = await onboard.connectWallet();
      setWallets(connectedWallets);
      if (connectedWallets.length > 0) {
        const provider = new Web3Provider(connectedWallets[0].provider);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
        localStorage.setItem('userAddress', address);
        toast.success(`Connected: ${address}`);
        const balance = await provider.getBalance(address);
        console.log('Balance:', formatEther(balance));
        await getUserDepositBalance(address);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const disconnectWallet = async () => {
    try {
      await onboard.disconnectWallet({ label: wallets[0].label });
      setWallets([]);
      setUserAddress(null);
      localStorage.removeItem('userAddress');
      toast.info('Wallet disconnected');
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(`Disconnection error: ${err.message}`);
    }
  };

  const depositBNB = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      setError('Please enter a valid deposit amount');
      toast.error('Please enter a valid deposit amount');
      return;
    }
    try {
      const provider = new Web3Provider(wallets[0].provider);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.deposit({ value: parseEther(depositAmount.toString()) });
      const receipt = await provider.waitForTransaction(tx.hash);
      console.log("Deposit successful, transaction hash:", receipt.transactionHash);
      toast.success(`Deposit successful, transaction hash: ${receipt.transactionHash}`);

      // Save transaction data to the backend
      const token = localStorage.getItem('token'); // Assuming JWT is stored in localStorage
      await fetch('https://trading-2-3d4p.onrender.com/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userAddress,
          amount: depositAmount,
          usdBalance,
          status: 'Successful',
          transactionHash: receipt.transactionHash
        })
      });

      await getUserDepositBalance(userAddress);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(`Deposit error: ${err.message}`);

      // Save failed transaction data to the backend
      const token = localStorage.getItem('token'); // Assuming JWT is stored in localStorage
      await fetch('https://trading-2-3d4p.onrender.com/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userAddress,
          amount: depositAmount,
          usdBalance,
          status: 'Failed',
          transactionHash: null
        })
      });
    }
  };

  const getUserDepositBalance = useCallback(async (address) => {
    if (!wallets[0]) return;
    try {
      const provider = new Web3Provider(wallets[0].provider);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const balance = await contract.getUserDepositBalance({ from: address });
      const formattedBalance = parseFloat(formatEther(balance)).toFixed(4);
      setUserDepositBalance(formattedBalance);
      await updateUsdBalance(formattedBalance);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(`Error fetching balance: ${err.message}`);
    }
  }, [wallets]);

  useEffect(() => {
    const loadConnectedWallets = async () => {
      const previouslyConnectedWallets = onboard.state.get().wallets;
      if (previouslyConnectedWallets.length > 0) {
        setWallets(previouslyConnectedWallets);
        const address = previouslyConnectedWallets[0].accounts[0].address;
        setUserAddress(address);
        localStorage.setItem('userAddress', address);
        await getUserDepositBalance(address);
      }
    };
    loadConnectedWallets();
  }, [getUserDepositBalance]);

  useEffect(() => {
    let interval;
    if (userAddress) {
      interval = setInterval(async () => {
        await getUserDepositBalance(userAddress);
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [userAddress, getUserDepositBalance]);

  // Toast notification logic
  useEffect(() => {
    if (!toast.isActive(13, "friendRequest")) {
      console.log("first time running");
      toast('User does not exist', {
        position: "bottom-right",
        autoClose: false,
        closeOnClick: true,
        draggable: false,
        type: "error",
        toastId: 13
      });
    }
  }, []);

  const truncateAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  };

  return (
    <div>
      <ToastContainer containerId={"friendRequest"}/>
      {wallets.length === 0 ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected as: {truncateAddress(userAddress)}</p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
          <div>
            <p>Your Deposit Balance: {userDepositBalance} BNB (~${usdBalance} USD)</p>
            <input
              type="text"
              placeholder="Enter amount to deposit"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <button onClick={depositBNB}>Deposit BNB</button>
          </div>
        </div>
      )}
      {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}
    </div>
  );
};

export default ConnectWallet;
