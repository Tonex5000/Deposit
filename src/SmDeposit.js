import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from 'axios';
import contractABI from './constant/ABI';
import './App.css';

function SmDeposit() {
    const contractAddress = "0x479184e115870b792f4B24904368536f6B954bf6";
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState('');
    const [contract, setContract] = useState(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [balanceBNB, setBalanceBNB] = useState('0');
    const [balanceUSD, setBalanceUSD] = useState('0.00');
    const [conversionRate, setConversionRate] = useState(0);

    useEffect(() => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
            const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
            setContract(contractInstance);
        } else {
            alert('MetaMask is not installed. Please install it to use this app.');
        }
        fetchConversionRate();
    }, []);

    const fetchConversionRate = async () => {
        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
            const rate = response.data.binancecoin.usd;
            setConversionRate(rate);
        } catch (error) {
            console.error('Error fetching conversion rate', error);
        }
    };

    const checkNetwork = async (web3Instance) => {
        const chainId = await web3Instance.eth.getChainId();
        if (chainId !== 56) { // 56 is the chain ID for Binance Smart Chain Mainnet
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: Web3.utils.toHex(56) }],
                });
                window.location.reload();
            } catch (switchError) {
                if (switchError.code === 4902) {
                    alert('Binance Smart Chain is not added to your MetaMask. Please add it manually.');
                } else {
                    console.error('Error switching to Binance Smart Chain', switchError);
                }
            }
        }
    };

    const connectWallet = async () => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
            const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
            setContract(contractInstance);
            checkNetwork(web3Instance);
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAccount(accounts[0]);
            } catch (error) {
                console.error('Error connecting wallet', error);
            }
        } else {
            alert('MetaMask is not installed. Please install it to use this app.');
        }
    };

    const disconnectWallet = () => {
        setAccount('');
        setBalanceBNB('0');
        setBalanceUSD('0.00');
    };

    const handleDeposit = async () => {
        if (depositAmount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }
        try {
            await contract.methods.deposit().send({
                from: account,
                value: web3.utils.toWei(depositAmount, 'ether')
            });
            alert('Deposit successful');
            checkBalance();
        } catch (error) {
            console.error('Error depositing BNB', error);
            alert('Deposit failed');
        }
    };

    const checkBalance = async () => {
        try {
            const balance = await contract.methods.getUserDepositBalance().call({ from: account });
            const balanceBNB = web3.utils.fromWei(balance, 'ether');
            setBalanceBNB(balanceBNB);
            const balanceUSD = (balanceBNB * conversionRate).toFixed(2);
            setBalanceUSD(balanceUSD);
            sendDataToBackend(account, depositAmount, balanceUSD);
        } catch (error) {
            console.error('Error checking balance', error);
        }
    };

    const sendDataToBackend = async (address, amount, balanceUSD) => {
        try {
            await axios.post('http://localhost:5000/api/deposit', {
                address,
                amount,
                balance: balanceUSD
            });
            console.log('Data sent to backend');
        } catch (error) {
            console.error('Error sending data to backend', error);
        }
    };

    const truncateAddress = (address) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>BNB Deposit</h1>
                {account ? (
                    <div>
                        <div>
                            <p>Connected as: {truncateAddress(account)}</p>
                            <button onClick={disconnectWallet}>Disconnect</button>
                        </div>
                        <div>
                            <label htmlFor="depositAmount">Deposit Amount (in BNB):</label>
                            <input
                                type="number"
                                id="depositAmount"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div>
                            <button onClick={handleDeposit}>Deposit BNB</button>
                        </div>
                        <div>
                            <button onClick={checkBalance}>Check My Deposit Balance</button>
                        </div>
                        <div>
                            <p>Your deposit balance: {balanceUSD} USD</p>
                        </div>
                    </div>
                ) : (
                    <button onClick={connectWallet}>Connect Wallet</button>
                )}
            </header>
        </div>
    );
}

export default SmDeposit;