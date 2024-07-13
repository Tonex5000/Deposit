import logo from './logo.svg';
import './App.css';
import SmDeposit from './DepositHistory';
import ConnectWallet from './ConnectWallet';
import DepositHistory from './DepositHistory';
import {WalletProvider} from './WalletContext'

function App() {
  return (
    <>
      <header className="App-header">
        <h1>Connect to Binance Smart Chain</h1>
        <WalletProvider>
          <ConnectWallet />
          <DepositHistory />
        </WalletProvider>
      </header>
    </>
  )
}

export default App;
