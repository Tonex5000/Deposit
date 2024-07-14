import logo from './logo.svg';
import './App.css';
import SmDeposit from './DepositHistory';
import DepositHistory from './DepositHistory';
import {WalletProvider} from './WalletContext';
import SpotGrid from './SpotGrid';
import Connect from './WalletConnect'
import { MoralisProvider } from 'react-moralis'; 
import Home from "./Wallet"

function App() {
  return (
    <>
      <header className="App-header">
        <h1>Connect to Binance Smart Chain</h1>
     <MoralisProvider initializeOnMount = {false}>
        <Home />
     </MoralisProvider> 
     
      </header>
    </>
  )
}

export default App;
