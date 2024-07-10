import logo from './logo.svg';
import './App.css';
import SmDeposit from './SmDeposit';
import ConnectWallet from './ConnectWallet';

function App() {
  return (
    <>
      <header className="App-header">
        <h1>Connect to Binance Smart Chain</h1>
        <ConnectWallet />
      </header>
    </>
  )
}

export default App;
