import React from 'react';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import { useWalletContext } from '../../contexts/WalletContext';
import { NETWORKS } from '../../utils/constants';
import './NetworkSwitch.css';

/**
 * NetworkSwitch component for switching between supported networks
 * Provides dropdown interface with current network display and switch functionality
 */
const NetworkSwitch = () => {
  const {
    isConnected,
    currentNetwork,
    isSupportedNetwork,
    isLoadingNetwork,
    switchNetwork,
    error
  } = useWalletContext();

  // Handle network switch
  const handleNetworkSwitch = async (targetChainId) => {
    if (!isConnected) {
      return;
    }
    
    try {
      const success = await switchNetwork(targetChainId);
      if (success) {
        console.log('✅ Network switch initiated successfully');
      }
    } catch (error) {
      console.error('❌ Network switch failed:', error);
    }
  };

  // Get network display info
  const getNetworkDisplay = () => {
    if (!isConnected) {
      return { name: 'Not Connected', color: 'secondary' };
    }
    
    if (!currentNetwork) {
      return { name: 'Unknown Network', color: 'warning' };
    }
    
    if (!isSupportedNetwork) {
      return { name: currentNetwork.name, color: 'danger' };
    }
    
    return { name: currentNetwork.name, color: 'success' };
  };

  // Get network icon/symbol
  const getNetworkSymbol = () => {
    if (!currentNetwork) return '🌐';
    
    switch (currentNetwork.chainId) {
      case NETWORKS.MAINNET.chainId:
        return '🔵';
      case NETWORKS.SEPOLIA.chainId:
        return '🟠';
      case NETWORKS.POLYGON.chainId:
        return '🟣';
      case NETWORKS.MUMBAI.chainId:
        return '🟢';
      default:
        return '🌐';
    }
  };

  const networkDisplay = getNetworkDisplay();
  const networkSymbol = getNetworkSymbol();

  // Don't render if not connected
  if (!isConnected) {
    return null;
  }

  return (
    <div className="network-switch-container">
      {/* Current Network Display */}
      <div className="current-network-display mb-2">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <span className="me-2" style={{ fontSize: '1.2em' }}>
              {networkSymbol}
            </span>
            <span className="fw-bold">{networkDisplay.name}</span>
            <Badge 
              bg={networkDisplay.color} 
              className="ms-2"
            >
              {isSupportedNetwork ? 'Supported' : 'Unsupported'}
            </Badge>
          </div>
          
          {isLoadingNetwork && (
            <Spinner 
              animation="border" 
              size="sm" 
              variant="primary"
              className="ms-2"
            />
          )}
        </div>
        
        {/* Network Warning */}
        {!isSupportedNetwork && (
          <div className="alert alert-warning alert-sm mt-2 mb-0">
            <small>
              ⚠️ This network is not supported. Please switch to a supported network.
            </small>
          </div>
        )}
      </div>

      {/* Network Switch Dropdown */}
      <Dropdown>
        <Dropdown.Toggle 
          variant="outline-primary" 
          size="sm"
          disabled={isLoadingNetwork}
          className="w-100"
        >
          {isLoadingNetwork ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Switching Network...
            </>
          ) : (
            'Switch Network'
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu className="w-100">
          {Object.values(NETWORKS).map((network) => {
            const isCurrentNetwork = currentNetwork?.chainId === network.chainId;
            const isDisabled = isCurrentNetwork || isLoadingNetwork;
            
            return (
              <Dropdown.Item
                key={network.chainId}
                onClick={() => handleNetworkSwitch(network.chainId)}
                disabled={isDisabled}
                className={`d-flex align-items-center justify-content-between ${
                  isCurrentNetwork ? 'active' : ''
                }`}
              >
                <div className="d-flex align-items-center">
                  <span className="me-2">
                    {network.chainId === NETWORKS.MAINNET.chainId && '🔵'}
                    {network.chainId === NETWORKS.SEPOLIA.chainId && '🟠'}
                    {network.chainId === NETWORKS.POLYGON.chainId && '🟣'}
                    {network.chainId === NETWORKS.MUMBAI.chainId && '🟢'}
                  </span>
                  <span>{network.name}</span>
                </div>
                
                <div className="d-flex align-items-center">
                  <small className="text-muted me-2">
                    {network.symbol}
                  </small>
                  {isCurrentNetwork && (
                    <Badge bg="success" size="sm">
                      Current
                    </Badge>
                  )}
                </div>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>

      {/* Network Switch Error */}
      {error && error.includes('network') && (
        <div className="alert alert-danger alert-sm mt-2 mb-0">
          <small>
            ❌ {error}
          </small>
        </div>
      )}

      {/* Network Info */}
      <div className="network-info mt-2">
        <small className="text-muted">
          <strong>Supported Networks:</strong> Ethereum Mainnet, Sepolia Testnet, Polygon Mainnet, Mumbai Testnet
        </small>
      </div>
    </div>
  );
};

export default NetworkSwitch; 