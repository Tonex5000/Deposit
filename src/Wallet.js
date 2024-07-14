import { useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import Web3 from "web3";

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
  const [preferredChainId, setPreferredChainId] = useState("0x57");
  const [isConnecting, setIsConnecting] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [userBalance, setUserBalance] = useState(0);

  const contractAddress = "0x80fE0E686e1E5D46Ff4c6AaeBb70f4B2153C3485";
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
    window.localStorage.setItem("connected", "injected");
    setIsConnecting(false);
  };

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      console.log(`Account changed to ${account}`);
      if (account == null) {
        window.localStorage.removeItem("connected");
        deactivateWeb3();
        console.log("Null account found");
      }
    });

    console.log("Connected chainId:", chainId);
    if (account && chainId) {
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [chainId, account]);

  const switchToPreferredNetwork = async () => {
    try {
      if (chainId !== preferredChainId) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x61",
            chainName: "Binance Smart Chain Testnet",
            nativeCurrency: {
              name: "BNB",
              symbol: "tBNB",
              decimals: 18,
            },
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
            blockExplorerUrls: ["https://testnet.bscscan.com"],
          }],
        });

        await Moralis.switchNetwork("0x61");
        console.log(`Switched to preferred network`);
      } else {
        console.log("Already connected to the preferred network");
      }
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };

  const handleDeposit = async () => {
    try {
      await contract.methods.deposit().send({
        from: account,
        value: web3.utils.toWei(depositAmount, "ether"),
      });
      console.log(`Deposited ${depositAmount} BNB`);
      fetchUserBalance(); // Update balance after deposit
    } catch (error) {
      console.error("Error depositing BNB:", error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const balance = await contract.methods.getUserDepositBalance().call({ from: account });
      setUserBalance(web3.utils.fromWei(balance, "ether"));
    } catch (error) {
      console.error("Error fetching user balance:", error);
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
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </div>
      )}

      {account && (
        <div>
          Connected to {account.slice(0, 6)}...{account.slice(account.length - 4)}
          <div>
            <input
              type="text"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount in BNB"
            />
            <button onClick={handleDeposit}>Deposit BNB</button>
          </div>
          <div>
            Your Deposit Balance: {userBalance} BNB
          </div>
        </div>
      )}

      {showMessage && (
        chainId === "0x61" ? (
          <div>
            <h1>Hello World</h1>
          </div>
        ) : (
          <button onClick={switchToPreferredNetwork}>Switch Network</button>
        )
      )}
    </div>
  );
}
