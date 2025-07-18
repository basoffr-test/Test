import "./App.css";
import Nav from "./Nav/Nav";
import TokenPart from "./Token/Token";
import SenderTable from "./Table";
import Transfer from "./Transfer/Transfer";
import ConnectWallet from "./ConnectWallet";
import Fee from "./Fee";
import Airdrop from "./Airdrop";
import MetaMaskTest from "./MetaMaskTest"; // Temporary test component
import NetworkSwitch from "./NetworkSwitch"; // Network switching component
import "bootstrap/dist/css/bootstrap.min.css";
import { Spinner, Alert, Badge } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useWalletContext } from "../contexts/WalletContext";
// import { ethers } from "ethers";
// import { RPC_URL, SECRET_KEY } from "./config";

// Load the sender's wallet from the private key
// TODO: replace by MetaMask signer
// const signer = null;


function App() {
  // Real MetaMask integration using WalletContext
  const {
    isMetaMaskInstalled,
    account,
    isConnected,
    isConnecting,
    isSupportedNetwork,
    currentNetwork,
    error,
    isLoading,
    isInitializing,
    connect,
    disconnect,
    retryConnection,
    clearError
  } = useWalletContext();

  // State variables
  const [tokenAddress, setTokenAddress] = useState("0xdAC17F958D2ee523a2206206994597C13D831ec7"); // ERC-20 token contract address
  const [wallets, setWallets] = useState([]); // List of recipient addresses
  // const [walletAddress, setWalletAddress] = useState("");
  const [quantity, setQuantity] = useState(0); // Tokens to send per wallet
  const [fee, setFee] = useState(0); // Gas fee per transaction (not actively used for Ethereum)
  const [balanceAmount, setBalanceAmount] = useState(0); // Sender's token balance

  // Fetch token balance of the sender's wallet
  useEffect(() => {
    if (tokenAddress && isConnected && account) {
      getTokenBalance();
    }
  }, [tokenAddress, isConnected, account]);

  const getTokenBalance = async () => {
    console.log("getTokenBalance disabled – UI-only mode");
    // Temporarily disabled to prevent runtime crashes
    // Will be re-enabled when MetaMask integration is complete
    /*
    try {
      const erc20ABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() view returns (uint8)",
      ];
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(senderWallet.address);
      setBalanceAmount(Number(ethers.formatUnits(balance, decimals)));
    } catch (error) {
      console.error("Error fetching token balance:", error);
      alert("Failed to fetch token balance. Check the token address and try again.");
    }
    */
  };

  // Enhanced connection handler using real MetaMask integration
  const handleConnect = async () => {
    if (isConnected) {
      const confirmDisconnect = window.confirm("Do you want to disconnect your MetaMask wallet?");
      if (confirmDisconnect) {
        await disconnect();
      }
    } else {
      await connect();
    }
  };

  // Airdrop logic
  const handleAirdrop = async () => {
    console.log("handleAirdrop disabled – UI-only mode");
    console.log("Airdrop parameters:", { tokenAddress, wallets, quantity });
    // Temporarily disabled to prevent runtime crashes
    // Will be re-enabled when MetaMask integration is complete
    /*
    if (!tokenAddress || wallets.length === 0 || quantity <= 0) {
      alert("Please fill in all parameters correctly!");
      return;
    }

    setLoading(true);
    try {
      const erc20ABI = [
        "function transfer(address to, uint256 value) public returns (bool)",
        "function decimals() view returns (uint8)",
      ];
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, senderWallet);
      const decimals = await tokenContract.decimals();
      const amount = ethers.parseUnits(quantity.toString(), decimals);

      for (let i = 0; i < wallets.length; i++) {
        const recipient = wallets[i];
        console.log(`Transferring ${quantity} tokens to ${recipient}...`);
        const tx = await tokenContract.transfer(recipient, amount);
        await tx.wait(); // Wait for the transaction to confirm
        console.log(`Successfully sent to ${recipient}`);
      }
      alert("Airdrop completed successfully!");
    } catch (error) {
      console.error("Airdrop failed:", error);
      alert("Airdrop failed! Check the console for more details.");
    }
    setLoading(false);
    */
  };

  // Render connection status component
  const renderConnectionStatus = () => {
    if (isInitializing) {
      return (
        <Alert variant="info" className="mb-3">
          <div className="d-flex align-items-center">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Initializing MetaMask connection...</span>
          </div>
        </Alert>
      );
    }

    if (!isMetaMaskInstalled) {
      return (
        <Alert variant="warning" className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>MetaMask Not Installed</strong>
              <br />
              <small>Please install MetaMask to use this application.</small>
            </div>
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-warning btn-sm"
            >
              Install MetaMask
            </a>
          </div>
        </Alert>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Connection Error</strong>
              <br />
              <small>{error}</small>
            </div>
            <div>
              <button 
                onClick={retryConnection}
                className="btn btn-outline-danger btn-sm me-2"
                disabled={isLoading}
              >
                Retry
              </button>
              <button 
                onClick={clearError}
                className="btn btn-outline-secondary btn-sm"
                disabled={isLoading}
              >
                Clear
              </button>
            </div>
          </div>
        </Alert>
      );
    }

    if (isConnected) {
      return (
        <Alert variant="success" className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>✅ Connected to MetaMask</strong>
              <br />
              <small>
                Account: {account?.substring(0, 6)}...{account?.substring(38)}
                {currentNetwork && (
                  <>
                    <br />
                    Network: {currentNetwork.name} 
                    <Badge 
                      bg={isSupportedNetwork ? "success" : "warning"} 
                      className="ms-2"
                    >
                      {isSupportedNetwork ? "Supported" : "Unsupported"}
                    </Badge>
                  </>
                )}
              </small>
            </div>
            <button 
              onClick={handleConnect}
              className="btn btn-outline-danger btn-sm"
              disabled={isLoading}
            >
              Disconnect
            </button>
          </div>
        </Alert>
      );
    }

    return (
      <Alert variant="info" className="mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>MetaMask Ready</strong>
            <br />
            <small>Click connect to link your MetaMask wallet</small>
          </div>
          <button 
            onClick={handleConnect}
            className="btn btn-primary btn-sm"
            disabled={isLoading || isConnecting}
          >
            {isConnecting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      </Alert>
    );
  };

  return (
    <div className="App">
      <Nav />
      
      {/* TEMPORARY: MetaMask Detection Test */}
      <MetaMaskTest />
      
      {/* Real MetaMask Connection Status */}
      {renderConnectionStatus()}
      
      {/* Network Switch Component - Only show when connected */}
      {isConnected && <NetworkSwitch />}
      
      <div style={{ opacity: isLoading ? 0.5 : 1 }}>
        {isLoading && (
          <div className="d-flex justify-content-center align-items-center custom-loading">
            <Spinner animation="border" variant="primary" role="status" />
          </div>
        )}
        <div className="connectWallet">
          {/* Enhanced ConnectWallet component with real MetaMask integration */}
          <ConnectWallet
            handleConnect={handleConnect}
            isConnected={isConnected}
            isConnecting={isConnecting}
            account={account}
            currentNetwork={currentNetwork}
            isSupportedNetwork={isSupportedNetwork}
            isLoading={isLoading}
          />
        </div>
        <div className="event">
          <SenderTable wallets={wallets} setWallets={setWallets} isConnected={isConnected}/>
        </div>
        <div className="main">
          <TokenPart
            tokenaddress={tokenAddress}
            setTokenAddress={setTokenAddress}
            balanceAmount={balanceAmount}
          />
          <Transfer
            quantity={quantity}
            setQuantity={setQuantity}
            totalQuantity={wallets?.length ? wallets.length * quantity : 0}
            balanceAmount={balanceAmount}
          />
          <Fee
            fee={fee}
            setFee={setFee}
            totalFee={wallets?.length ? wallets.length * fee : 0}
          />
        </div>
        <div className="airdrop">
          <Airdrop
            isConnected={
              isConnected && wallets?.length
                ? wallets.length * quantity < balanceAmount
                : 0
            }
            handleAirdrop={handleAirdrop}
          />
          {/* <Airdrop handleAirdrop={handleAirdrop} isConnected={true} /> */}
        </div>
      </div>
    </div>
  );
}

export default App;