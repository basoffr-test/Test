import React from 'react';
import { useWalletContext } from '../contexts/WalletContext';
import { NETWORKS } from '../utils/constants';

/**
 * Test component for MetaMask detection, connection state, network validation, error handling, and loading states
 * This will be removed after testing is complete
 * Now uses WalletContext instead of direct hook
 */
const MetaMaskTest = () => {
  const { 
    isMetaMaskInstalled, 
    error, 
    getProvider,
    account,
    chainId,
    isConnected,
    isConnecting,
    isSupportedNetwork,
    currentNetwork,
    lastErrorCode,
    errorCount,
    isLoading,
    isInitializing,
    isLoadingNetwork,
    isLoadingAccount,
    isDisconnecting,
    isWalletLocked,
    autoReconnectAttempted,
    connect,
    disconnect,
    switchNetwork,
    retryConnection,
    clearError
  } = useWalletContext();

  // Network switching test functions
  const testSwitchToMainnet = () => switchNetwork(NETWORKS.MAINNET.chainId);
  const testSwitchToSepolia = () => switchNetwork(NETWORKS.SEPOLIA.chainId);
  const testSwitchToPolygon = () => switchNetwork(NETWORKS.POLYGON.chainId);
  const testSwitchToMumbai = () => switchNetwork(NETWORKS.MUMBAI.chainId);

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔍 MetaMask Detection, State, Network, Error & Loading Test</h3>
      
      {/* Loading States Section */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '10px', 
        borderRadius: '4px', 
        marginBottom: '15px' 
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔄 Loading States</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong>Overall Loading:</strong> 
            <span style={{ 
              color: isLoading ? 'blue' : 'green',
              marginLeft: '10px'
            }}>
              {isLoading ? '🔄 Loading...' : '✅ Ready'}
            </span>
          </div>
          
          <div>
            <strong>Initializing:</strong> 
            <span style={{ 
              color: isInitializing ? 'blue' : 'green',
              marginLeft: '10px'
            }}>
              {isInitializing ? '🔄 Initializing...' : '✅ Initialized'}
            </span>
          </div>
          
          <div>
            <strong>Connecting:</strong> 
            <span style={{ 
              color: isConnecting ? 'blue' : 'gray',
              marginLeft: '10px'
            }}>
              {isConnecting ? '🔄 Connecting...' : '⏸️ Idle'}
            </span>
          </div>
          
          <div>
            <strong>Loading Network:</strong> 
            <span style={{ 
              color: isLoadingNetwork ? 'blue' : 'green',
              marginLeft: '10px'
            }}>
              {isLoadingNetwork ? '🔄 Loading...' : '✅ Loaded'}
            </span>
          </div>
          
          <div>
            <strong>Loading Account:</strong> 
            <span style={{ 
              color: isLoadingAccount ? 'blue' : 'green',
              marginLeft: '10px'
            }}>
              {isLoadingAccount ? '🔄 Loading...' : '✅ Loaded'}
            </span>
          </div>
          
          <div>
            <strong>Disconnecting:</strong> 
            <span style={{ 
              color: isDisconnecting ? 'blue' : 'gray',
              marginLeft: '10px'
            }}>
              {isDisconnecting ? '🔄 Disconnecting...' : '⏸️ Idle'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Connection States Section */}
      <div style={{ 
        backgroundColor: '#f3e5f5', 
        padding: '10px', 
        borderRadius: '4px', 
        marginBottom: '15px' 
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>🔗 Connection States</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>MetaMask Installed:</strong> 
          <span style={{ 
            color: isMetaMaskInstalled ? 'green' : 'red',
            marginLeft: '10px'
          }}>
            {isMetaMaskInstalled ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Connection Status:</strong> 
          <span style={{ 
            color: isConnected ? 'green' : 'orange',
            marginLeft: '10px'
          }}>
            {isConnected ? '✅ Connected' : '⏳ Not Connected'}
          </span>
        </div>
        
        {account && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Account:</strong> 
            <span style={{ 
              color: 'green',
              marginLeft: '10px',
              fontFamily: 'monospace'
            }}>
              {account.substring(0, 6)}...{account.substring(38)}
            </span>
          </div>
        )}
        
        {chainId && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Chain ID:</strong> 
            <span style={{ 
              color: 'blue',
              marginLeft: '10px'
            }}>
              {chainId}
            </span>
          </div>
        )}
        
        {currentNetwork && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Network:</strong> 
            <span style={{ 
              color: isSupportedNetwork ? 'green' : 'orange',
              marginLeft: '10px'
            }}>
              {currentNetwork.name} ({currentNetwork.symbol})
            </span>
          </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Supported Network:</strong> 
          <span style={{ 
            color: isSupportedNetwork ? 'green' : 'orange',
            marginLeft: '10px'
          }}>
            {isSupportedNetwork ? '✅ Yes' : '⚠️ No'}
          </span>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Provider Available:</strong> 
          <span style={{ 
            color: getProvider() ? 'green' : 'red',
            marginLeft: '10px'
          }}>
            {getProvider() ? '✅ Yes' : '❌ No'}
          </span>
        </div>
      </div>
      
      {/* Error States Section */}
      <div style={{ 
        backgroundColor: '#ffebee', 
        padding: '10px', 
        borderRadius: '4px', 
        marginBottom: '15px' 
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#c62828' }}>⚠️ Error States</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Error Count:</strong> 
          <span style={{ 
            color: errorCount > 0 ? 'orange' : 'green',
            marginLeft: '10px'
          }}>
            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </span>
        </div>
        
        {lastErrorCode && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Last Error Code:</strong> 
            <span style={{ 
              color: 'red',
              marginLeft: '10px',
              fontFamily: 'monospace'
            }}>
              {lastErrorCode}
            </span>
          </div>
        )}
        
        {error && (
          <div style={{ 
            color: 'red', 
            backgroundColor: '#fff3e0',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px',
            border: '1px solid #ff9800'
          }}>
            <strong>Current Error:</strong> {error}
          </div>
        )}
      </div>
      
      {/* Auto-Reconnection States Section */}
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '10px', 
        borderRadius: '4px', 
        marginBottom: '15px' 
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>🔄 Auto-Reconnection States</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Wallet Locked:</strong> 
          <span style={{ 
            color: isWalletLocked ? 'orange' : 'green',
            marginLeft: '10px'
          }}>
            {isWalletLocked ? '🔒 Yes - Unlock MetaMask' : '✅ No'}
          </span>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Auto-Reconnect Attempted:</strong> 
          <span style={{ 
            color: autoReconnectAttempted ? 'blue' : 'gray',
            marginLeft: '10px'
          }}>
            {autoReconnectAttempted ? '✅ Yes' : '⏳ Not yet'}
          </span>
        </div>
        
        {isWalletLocked && (
          <div style={{ 
            color: 'orange', 
            backgroundColor: '#fff3e0',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px',
            border: '1px solid #ff9800'
          }}>
            <strong>🔒 MetaMask is locked!</strong> Please unlock your MetaMask wallet to connect.
          </div>
        )}
      </div>
      
      {/* Test buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={connect}
          disabled={!isMetaMaskInstalled || isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: isMetaMaskInstalled && !isLoading ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isMetaMaskInstalled && !isLoading ? 'pointer' : 'not-allowed'
          }}
        >
          {isConnecting ? 'Connecting...' : 'Test Connect'}
        </button>
        
        <button 
          onClick={disconnect}
          disabled={!isConnected || isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: isConnected && !isLoading ? '#dc3545' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected && !isLoading ? 'pointer' : 'not-allowed'
          }}
        >
          {isDisconnecting ? 'Disconnecting...' : 'Test Disconnect'}
        </button>
        
        {error && (
          <button 
            onClick={retryConnection}
            disabled={isLoading || errorCount >= 3}
            style={{
              padding: '8px 16px',
              backgroundColor: errorCount < 3 && !isLoading ? '#ffc107' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: errorCount < 3 && !isLoading ? 'pointer' : 'not-allowed'
            }}
          >
            {errorCount >= 3 ? 'Max Retries' : `Retry (${errorCount}/3)`}
          </button>
        )}
        
        {error && (
          <button 
            onClick={clearError}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: !isLoading ? '#6c757d' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !isLoading ? 'pointer' : 'not-allowed'
            }}
          >
            Clear Error
          </button>
        )}
      </div>
      
      {/* Network Switching Test Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={testSwitchToMainnet}
          disabled={!isConnected || isLoading || !isSupportedNetwork}
          style={{
            padding: '8px 16px',
            backgroundColor: isConnected && !isLoading && isSupportedNetwork ? '#4caf50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected && !isLoading && isSupportedNetwork ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoadingNetwork ? 'Switching...' : 'Switch to Mainnet'}
        </button>
        <button 
          onClick={testSwitchToSepolia}
          disabled={!isConnected || isLoading || !isSupportedNetwork}
          style={{
            padding: '8px 16px',
            backgroundColor: isConnected && !isLoading && isSupportedNetwork ? '#ff9800' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected && !isLoading && isSupportedNetwork ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoadingNetwork ? 'Switching...' : 'Switch to Sepolia'}
        </button>
        <button 
          onClick={testSwitchToPolygon}
          disabled={!isConnected || isLoading || !isSupportedNetwork}
          style={{
            padding: '8px 16px',
            backgroundColor: isConnected && !isLoading && isSupportedNetwork ? '#2196f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected && !isLoading && isSupportedNetwork ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoadingNetwork ? 'Switching...' : 'Switch to Polygon'}
        </button>
        <button 
          onClick={testSwitchToMumbai}
          disabled={!isConnected || isLoading || !isSupportedNetwork}
          style={{
            padding: '8px 16px',
            backgroundColor: isConnected && !isLoading && isSupportedNetwork ? '#9c27b0' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected && !isLoading && isSupportedNetwork ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoadingNetwork ? 'Switching...' : 'Switch to Mumbai'}
        </button>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
        <p>This test component verifies MetaMask detection, connection state, network validation, error handling, and loading states.</p>
        <p><strong>Loading States:</strong> isInitializing, isConnecting, isLoadingNetwork, isLoadingAccount, isDisconnecting, isLoading (combined)</p>
        <p><strong>Connection States:</strong> account, chainId, isConnected, isSupportedNetwork, currentNetwork</p>
        <p><strong>Error Handling:</strong> error, lastErrorCode, errorCount, retryConnection, clearError</p>
        <p><strong>Auto-reconnection:</strong> Automatically detects existing connections on page load</p>
        <p>Supported networks: Ethereum Mainnet, Sepolia, Polygon, Mumbai</p>
      </div>
    </div>
  );
};

export default MetaMaskTest; 