import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './App.css';

// ABI of the smart contract
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

// Address of the deployed contract
const contractAddress = '0x80fE0E686e1E5D46Ff4c6AaeBb70f4B2153C3485';

function Connect() {
  const [account, setAccount] = useState('');
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [userDepositBalance, setUserDepositBalance] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    async function loadWeb3() {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const accounts = await web3.eth.requestAccounts();
        setAccount(accounts[0]);
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        setContract(contract);
      } else {
        alert('Please install MetaMask to use this dApp!');
      }
    }
    loadWeb3();
  }, []);

  const handleDeposit = async (event) => {
    event.preventDefault();
    if (contract && depositAmount > 0) {
      try {
        await contract.methods.deposit().send({ from: account, value: web3.utils.toWei(depositAmount, 'ether') });
        alert('Deposit successful!');
        loadBalances();
      } catch (error) {
        alert('Deposit failed!');
      }
    } else {
      alert('Please enter a valid deposit amount.');
    }
  };

  const loadBalances = async () => {
    if (contract) {
      const userBalance = await contract.methods.getUserDepositBalance().call({ from: account });
      setUserDepositBalance(web3.utils.fromWei(userBalance, 'ether'));
      const totalBal = await contract.methods.getTotalBalance().call();
      setTotalBalance(web3.utils.fromWei(totalBal, 'ether'));
    }
  };

  useEffect(() => {
    if (account) {
      loadBalances();
    }
  }, [account, contract]);

  return (
    <div className="App">
      <h1>BNB Deposit DApp</h1>
      <p>Account: {account}</p>
      <form onSubmit={handleDeposit}>
        <div>
          <label>Deposit Amount (BNB):</label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
        </div>
        <button type="submit">Deposit</button>
      </form>
      <div>
        <h2>Your Deposit Balance: {userDepositBalance} BNB</h2>
        <h2>Total Contract Balance: {totalBalance} BNB</h2>
      </div>
    </div>
  );
}

export default Connect;
