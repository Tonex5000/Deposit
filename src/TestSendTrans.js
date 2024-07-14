import { useMoralis } from 'react-moralis';
import { useEffect, useState } from 'react';
import Web3 from 'web3';

export default function Home() {
  const {
    enableWeb3,
    account,
    isWeb3Enabled,
    Moralis,
    deactivateWeb3,
    chainId,
  } = useMoralis();

  const [showMessage, setShowMessage] = useState(false);
  const [preferredChainId, setPreferredChainId] = useState('0x61'); // BSC Testnet
  const [isConnecting, setIsConnecting] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);

  const contractAddress = '0x80fE0E686e1E5D46Ff4c6AaeBb70f4B2153C3485';
  const contractABI = [
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
      "inputs": [],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
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
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ];

  const web3 = new Web3(Moralis.provider);
  const contract = new web3.eth.Contract(contractABI, contractAddress);

  const handleConnectClick = async () => {
    setIsConnecting(true);
    await enableWeb3();
    window.localStorage.setItem('connected', 'injected');
    setIsConnecting(false);
  };

  const handleDisconnectClick = async () => {
    deactivateWeb3();
    window.localStorage.removeItem('connected');
    setUserBalance(0);
  };

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      console.log(`Account changed to ${account}`);
      if (account == null) {
        window.localStorage.removeItem('connected');
        deactivateWeb3();
        console.log('Null account found');
      }
    });

    console.log('Connected chainId:', chainId);
    if (account && chainId) {
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [chainId, account]);

  useEffect(() => {
    if (account && chainId !== preferredChainId) {
      switchToPreferredNetwork();
    }
  }, [account, chainId]);

  const switchToPreferredNetwork = async () => {
    try {
      if (chainId !== preferredChainId) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x61',
              chainName: 'Binance Smart Chain Testnet',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'tBNB',
                decimals: 18,
              },
              rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
              blockExplorerUrls: ['https://testnet.bscscan.com'],
            },
          ],
        });

        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x61' }],
        });

        console.log('Switched to preferred network');
        fetchUserBalance();
      } else {
        console.log('Already connected to the preferred network');
      }
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  const handleDeposit = async () => {
    const token = localStorage.getItem('token'); // Assuming JWT is stored in localStorage
    const currentDateTime = new Date().toISOString(); // Get the current date and time
    const userAddress = account;

    try {
      const transaction = await contract.methods.deposit().send({
        from: account,
        value: web3.utils.toWei(depositAmount, 'ether'),
      });
      console.log(`Deposited ${depositAmount} BNB`);

      // Fetch the transaction receipt to get the transaction hash and fee
      const receipt = await web3.eth.getTransactionReceipt(transaction.transactionHash);
      const transactionHash = receipt.transactionHash;

      // Save transaction data to the backend as successful
      const response = await fetch('http://127.0.0.1:5000/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: currentDateTime,
          amount: parseFloat(depositAmount),
          status: 'Successful',
          contractAddress,
          transactionHash,
          walletAddress: userAddress,
        }),
      });

      if (response.ok) {
        console.log('Transaction data saved successfully');
      } else {
        console.error('Failed to save transaction data');
      }

      fetchUserBalance(); // Update balance after deposit
    } catch (error) {
      console.error('Error depositing BNB:', error);

      // Save transaction data to the backend as failed
      const response = await fetch('http://127.0.0.1:5000/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: currentDateTime,
          amount: parseFloat(depositAmount),
          status: 'Failed',
          transactionHash: error.transactionHash || 'N/A',
          contractAddress,
          walletAddress: userAddress,
        }),
      });

      if (response.ok) {
        console.log('Failed transaction data saved successfully');
      } else {
        console.error('Failed to save failed transaction data');
      }
    }
  };

  const fetchUserBalance = async () => {
    try {
      const balance = await contract.methods.getUserDepositBalance().call({ from: account });
      setUserBalance(web3.utils.fromWei(balance, 'ether'));
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  useEffect(() => {
    if (account) {
      fetchUserBalance();
    }
  }, [account]);

  return (
    <div>
      {!account && (
        <div>
          <button
            onClick={handleConnectClick}
            disabled={isWeb3Enabled || isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      )}

      {account && (
        <div>
          Connected to {account.slice(0, 6)}...{account.slice(account.length - 4)}
          <div>
            <input
              type='text'
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder='Amount in BNB'
            />
            <button onClick={handleDeposit}>Deposit BNB</button>
          </div>
          <div>Your Deposit Balance: {userBalance} BNB</div>
          <button onClick={handleDisconnectClick}>Disconnect</button>
        </div>
      )}

      {showMessage && (
        chainId === '0x61' ? (
          <div>
            <h1>Hello World</h1>
          </div>
        ) : (
          <p>Switching to preferred network...</p>
        )
      )}
    </div>
  );
}
