/* import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import { Web3Provider } from '@ethersproject/providers';
import { formatEther, parseEther } from 'ethers';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { WalletContext } from './WalletContext';


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
  const { setWalletAddress } = useContext(WalletContext);
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
          // toast.error('Network error: Unable to fetch BNB to USD conversion rate. Please try again later.');
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
        setWalletAddress(address);
        localStorage.setItem('userAddress', address);
        const balance = await provider.getBalance(address);
        const bigNumberBalance = utils.BigNumber.from(balance);
        console.log('Balance:', formatEther(bigNumberBalance));
        await getUserDepositBalance(address);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };


  const disconnectWallet = async () => {
    try {
      if (wallets[0]) {
        await onboard.disconnectWallet({ label: wallets[0].label });
      }
      setWallets([]);
      setUserAddress(null);
      setWalletAddress(null);
      localStorage.removeItem('userAddress');
      // toast.info('Wallet disconnected');
    } catch (err) {
      console.error(err);
      setError(err.message);
      // toast.error(`Disconnection error: ${err.message}`);
    }
  };

  const depositBNB = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      setError('Please enter a valid deposit amount');
      // toast.error('Please enter a valid deposit amount');
      return;
    }

    try {
      if (!wallets[0]) {
        setError('No wallet connected');
        // toast.error('No wallet connected');
        return;
      }

      const provider = new Web3Provider(wallets[0].provider);
      const network = await provider.getNetwork();

      if (network.chainId !== 56) { // 56 is the chain ID for Binance Smart Chain Mainnet
        try {
          await provider.send('wallet_addEthereumChain', [{
            chainId: '0x38', // Hexadecimal value of 56
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
              name: 'Binance Coin',
              symbol: 'BNB',
              decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com']
          }]);
          // toast.success('Binance Smart Chain added to MetaMask');
        } catch (error) {
          console.error('Failed to add Binance Smart Chain:', error);
          // toast.error('Failed to add Binance Smart Chain to MetaMask');
          return;
        }
      }

      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.deposit({ value: parseEther(depositAmount.toString()) });
      const receipt = await provider.waitForTransaction(tx.hash);

      const transactionHash = receipt.transactionHash;
      const transactionFee = receipt.gasUsed.mul(tx.gasPrice).toString();

      console.log("Deposit successful, transaction hash:", receipt.transactionHash);

      // toast.success(`Deposit successful, transaction hash: ${receipt.transactionHash}`);

      // Get the current date and time
      const currentDateTime = new Date().toISOString();

      // Save transaction data to the backend
      const token = localStorage.getItem('token'); // Assuming JWT is stored in localStorage
      console.log(currentDateTime, depositAmount, "Successful");

      const response = await fetch('http://127.0.0.1:5000/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: currentDateTime,
          amount: parseFloat(depositAmount),
          status: 'Successful',
          transactionHash,
          contractAddress,
          transactionFee,
          walletAddress: userAddress
        })
      });

      if (response.ok) {
        console.log('Data stored successfully for a successful deposit.');
      } else {
        console.log('Failed to store data for a successful deposit.');
      }

      await getUserDepositBalance(userAddress);
    } catch (err) {
      setError(err.message);
      // toast.error(`Deposit error: ${err.message}`);

      // Get the current date and time
      const currentDateTime = new Date().toISOString();

      // Save failed transaction data to the backend
      const token = localStorage.getItem('token'); // Assuming JWT is stored in localStorage
      const response = await fetch('http://127.0.0.1:5000/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: currentDateTime,
          amount: parseFloat(depositAmount),
          status: 'Failed',
          transactionHash: 'N/A',
          contractAddress,
          transactionFee: 'N/A',
          walletAddress: userAddress
        })
      });

      if (response.ok) {
        console.log('Data stored successfully for a failed deposit.');
      } else {
        console.log('Failed to store data for a failed deposit.');
      }
    }
  };

  const getUserDepositBalance = useCallback(async (address) => {
    if (!address) {
      console.error('Invalid address');
      setError('Invalid address');
      return;
    }
  
    try {
      if (!wallets[0] || !wallets[0].provider) {
        console.error('No wallet connected or provider is null');
        setError('No wallet connected');
        return;
      }
  
      const provider = new Web3Provider(wallets[0].provider);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
  
      // Ensure the contract method exists
      if (typeof contract.getUserDepositBalance !== 'function') {
        console.error('getUserDepositBalance method not found in contract');
        setError('Contract method not found');
        return;
      }
  
      const balance = await contract.getUserDepositBalance();
      setUserDepositBalance(formatEther(balance));
      await updateUsdBalance(formatEther(balance));
    } catch (error) {
      console.error('Error fetching user deposit balance:', error);
      setError(error.message);
    }
  }, [wallets, updateUsdBalance]);
  

  useEffect(() => {
    const loadConnectedWallets = async () => {
      const previouslyConnectedWallets = onboard.state.get().wallets;
      if (previouslyConnectedWallets.length > 0) {
        setWallets(previouslyConnectedWallets);
        const address = previouslyConnectedWallets[0].accounts[0].address;
        setUserAddress(address);
        localStorage.setItem('userAddress', address);
        if (wallets[0] && wallets[0].provider) {
          await getUserDepositBalance(address);
        }
      }
    };
    loadConnectedWallets();
  }, [getUserDepositBalance, wallets]);

  useEffect(() => {
    let interval;
    if (userAddress) {
      interval = setInterval(async () => {
        await getUserDepositBalance(userAddress);
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [userAddress, getUserDepositBalance]);

  const truncateAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  };

  return (
    <div>
      <ToastContainer />
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
            {<button onClick={depositBNB}>Deposit BNB</button>}
          </div>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ConnectWallet;
 */