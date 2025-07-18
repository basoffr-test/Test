import { useState, useEffect, useCallback } from 'react';
import { ERROR_MESSAGES, NETWORKS } from '../utils/constants';

/**
 * Custom hook for MetaMask wallet integration
 * Step 8: Loading states implementation
 */
export const useWallet = () => {
  // MetaMask detection state
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [error, setError] = useState(null);

  // Connection state management
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Network validation state
  const [isSupportedNetwork, setIsSupportedNetwork] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState(null);

  // Error handling state
  const [lastErrorCode, setLastErrorCode] = useState(null);
  const [errorCount, setErrorCount] = useState(0);

  // Loading states
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Auto-reconnection state
  const [isWalletLocked, setIsWalletLocked] = useState(false);
  const [autoReconnectAttempted, setAutoReconnectAttempted] = useState(false);

  // Helper function to validate network
  const validateNetwork = (chainId) => {
    const supportedChainIds = Object.values(NETWORKS).map(network => network.chainId);
    const isValid = supportedChainIds.includes(chainId);
    
    if (isValid) {
      const network = Object.values(NETWORKS).find(network => network.chainId === chainId);
      setCurrentNetwork(network);
      setIsSupportedNetwork(true);
      return true;
    } else {
      setCurrentNetwork(null);
      setIsSupportedNetwork(false);
      return false;
    }
  };

  // Enhanced error handling function
  const handleError = (error, context = 'unknown') => {
    console.error(`❌ Error in ${context}:`, error);
    
    let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
    let errorCode = null;

    // Handle MetaMask specific error codes
    if (error.code) {
      errorCode = error.code;
      setLastErrorCode(errorCode);
      
      switch (error.code) {
        case 4001:
          errorMessage = ERROR_MESSAGES.METAMASK_USER_REJECTED;
          break;
        case 4100:
          errorMessage = ERROR_MESSAGES.METAMASK_NOT_CONNECTED;
          break;
        case 4200:
          errorMessage = ERROR_MESSAGES.METAMASK_WRONG_NETWORK;
          break;
        case 4900:
          errorMessage = ERROR_MESSAGES.WALLET_NETWORK_CHANGED;
          break;
        case 4901:
          errorMessage = ERROR_MESSAGES.METAMASK_WRONG_NETWORK;
          break;
        case 4902:
          errorMessage = ERROR_MESSAGES.WALLET_CONNECTION_FAILED;
          break;
        default:
          errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
      }
    } else if (error.message) {
      // Handle generic error messages
      if (error.message.includes('User rejected')) {
        errorMessage = ERROR_MESSAGES.METAMASK_USER_REJECTED;
      } else if (error.message.includes('network')) {
        errorMessage = ERROR_MESSAGES.METAMASK_WRONG_NETWORK;
      } else if (error.message.includes('connection')) {
        errorMessage = ERROR_MESSAGES.WALLET_CONNECTION_FAILED;
      } else {
        errorMessage = error.message;
      }
    }

    setError(errorMessage);
    setErrorCount(prev => prev + 1);
    
    return { errorMessage, errorCode };
  };

  // Error recovery function
  const clearError = () => {
    setError(null);
    setLastErrorCode(null);
  };

  // Auto-clear errors after successful operations
  const clearErrorOnSuccess = useCallback(() => {
    if (error) {
      console.log('✅ Clearing error after successful operation');
      clearError();
    }
  }, [error]);

  // Check if MetaMask is installed and handle auto-reconnection
  useEffect(() => {
    const checkMetaMask = async () => {
      try {
        setIsInitializing(true);
        console.log('🔄 Initializing MetaMask connection...');
        
        // Check if window.ethereum exists
        if (typeof window !== 'undefined' && window.ethereum) {
          // Check if it's specifically MetaMask (not other wallets)
          if (window.ethereum.isMetaMask) {
            setIsMetaMaskInstalled(true);
            clearError(); // Clear any previous errors
            
            // Enhanced auto-reconnection logic
            try {
              console.log('🔍 Checking for existing MetaMask connection...');
              
              // First, check if MetaMask is locked
              const accounts = await window.ethereum.request({
                method: 'eth_accounts'
              });
              
              if (accounts && accounts.length > 0) {
                // Found existing connection - restore state
                console.log('✅ Found existing connection:', accounts[0]);
                setAccount(accounts[0]);
                setIsConnected(true);
                
                // Get and validate current network
                setIsLoadingNetwork(true);
                try {
                  const chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                  });
                  const numericChainId = parseInt(chainId, 16);
                  setChainId(numericChainId);
                  
                  // Validate network and update state
                  const isSupported = validateNetwork(numericChainId);
                  console.log('🌐 Current network:', {
                    chainId: numericChainId,
                    network: currentNetwork?.name || 'Unknown',
                    isSupported
                  });
                  
                  if (!isSupported) {
                    console.warn('⚠️ Connected to unsupported network:', numericChainId);
                    setError(ERROR_MESSAGES.METAMASK_WRONG_NETWORK);
                  } else {
                    console.log('✅ Connected to supported network:', currentNetwork?.name);
                    clearErrorOnSuccess();
                  }
                } catch (networkError) {
                  console.error('❌ Failed to get network info:', networkError);
                  handleError(networkError, 'network detection');
                } finally {
                  setIsLoadingNetwork(false);
                }
                
                console.log('✅ Auto-reconnection successful');
              } else {
                // No existing connection - MetaMask might be locked or not connected
                console.log('ℹ️ No existing connection found - MetaMask may be locked or not connected');
                setAccount(null);
                setIsConnected(false);
                setChainId(null);
                setIsSupportedNetwork(false);
                setCurrentNetwork(null);
                setIsWalletLocked(false);
                
                // Don't set error here as this is normal behavior
                // User will need to manually connect
              }
            } catch (connectionError) {
              // Handle specific MetaMask locked state
              if (connectionError.code === 4100) {
                console.log('🔒 MetaMask is locked - user needs to unlock');
                setAccount(null);
                setIsConnected(false);
                setChainId(null);
                setIsSupportedNetwork(false);
                setCurrentNetwork(null);
                setIsWalletLocked(true);
                // Don't set error for locked state - this is expected
              } else {
                console.error('❌ Auto-reconnection failed:', connectionError);
                handleError(connectionError, 'auto-reconnection');
                setAccount(null);
                setIsConnected(false);
                setChainId(null);
                setIsSupportedNetwork(false);
                setCurrentNetwork(null);
                setIsWalletLocked(false);
              }
            }
            
            // Mark auto-reconnection as attempted
            setAutoReconnectAttempted(true);
          } else {
            // Ethereum provider exists but not MetaMask
            console.log('⚠️ Ethereum provider found but not MetaMask');
            setIsMetaMaskInstalled(false);
            setError(ERROR_MESSAGES.METAMASK_NOT_INSTALLED);
          }
        } else {
          // No Ethereum provider at all
          console.log('❌ No Ethereum provider found');
          setIsMetaMaskInstalled(false);
          setError(ERROR_MESSAGES.METAMASK_NOT_INSTALLED);
        }
      } catch (error) {
        console.error('❌ MetaMask initialization failed:', error);
        handleError(error, 'MetaMask detection');
      } finally {
        setIsInitializing(false);
        console.log('✅ MetaMask initialization complete');
      }
    };

    // Check immediately on mount
    checkMetaMask();

    // Listen for provider changes (user installing/uninstalling MetaMask)
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', () => {
        console.log('🔄 MetaMask provider initialized - rechecking connection');
        checkMetaMask();
      });
      
      // Cleanup
      return () => {
        window.removeEventListener('ethereum#initialized', checkMetaMask);
      };
    }
  }, []);

  // Account change event listener
  useEffect(() => {
    if (!isMetaMaskInstalled || !window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      try {
        console.log('🔄 Account changed:', accounts);
        setIsLoadingAccount(true);
        
        if (accounts.length === 0) {
          // User disconnected their wallet
          console.log('🔌 User disconnected wallet');
          setAccount(null);
          setIsConnected(false);
          setChainId(null);
          setIsSupportedNetwork(false);
          setCurrentNetwork(null);
          setError(ERROR_MESSAGES.WALLET_ACCOUNT_CHANGED);
        } else {
          // User switched to a different account
          const newAccount = accounts[0];
          console.log('👤 User switched to account:', newAccount);
          setAccount(newAccount);
          setIsConnected(true);
          clearErrorOnSuccess(); // Clear errors on successful account switch
          
          // Note: We don't update chainId here as it might not have changed
          // The chain change listener will handle network updates
        }
      } catch (error) {
        handleError(error, 'account change');
      } finally {
        setIsLoadingAccount(false);
      }
    };

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    // Cleanup listener on unmount
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [isMetaMaskInstalled, clearErrorOnSuccess, currentNetwork?.name]);

  // Network change event listener
  useEffect(() => {
    if (!isMetaMaskInstalled || !window.ethereum) {
      return;
    }

    const handleChainChanged = (chainId) => {
      try {
        console.log('🌐 Network changed:', chainId);
        setIsLoadingNetwork(true);
        
        const numericChainId = parseInt(chainId, 16);
        setChainId(numericChainId);
        
        // Re-validate network
        const isSupported = validateNetwork(numericChainId);
        
        if (!isSupported) {
          console.warn('⚠️ Switched to unsupported network:', numericChainId);
          setError(ERROR_MESSAGES.METAMASK_WRONG_NETWORK);
        } else {
          console.log('✅ Switched to supported network:', currentNetwork?.name);
          clearErrorOnSuccess(); // Clear errors on successful network switch
        }
        
        // Show network switch notification
        console.log('🔄 Network switched to:', {
          chainId: numericChainId,
          network: currentNetwork?.name || 'Unsupported',
          isSupported
        });
      } catch (error) {
        handleError(error, 'network change');
      } finally {
        setIsLoadingNetwork(false);
      }
    };

    // Listen for network changes
    window.ethereum.on('chainChanged', handleChainChanged);
    
    // Cleanup listener on unmount
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, clearErrorOnSuccess, currentNetwork?.name]);

  // Clear error when MetaMask becomes available
  useEffect(() => {
    if (isMetaMaskInstalled && error) {
      clearError();
    }
  }, [isMetaMaskInstalled, error, clearErrorOnSuccess]);

  // Enhanced MetaMask connection implementation with comprehensive error handling and loading states
  const connect = async () => {
    if (!isMetaMaskInstalled) {
      setError(ERROR_MESSAGES.METAMASK_NOT_INSTALLED);
      return;
    }

    setIsConnecting(true);
    clearError(); // Clear any previous errors

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        // Set account state
        setAccount(accounts[0]);
        setIsConnected(true);
        setIsWalletLocked(false); // Clear locked state on successful connection
        
        // Get current network
        setIsLoadingNetwork(true);
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });
        const numericChainId = parseInt(chainId, 16);
        setChainId(numericChainId);
        
        // Validate network
        const isSupported = validateNetwork(numericChainId);
        
        if (!isSupported) {
          // Show warning for unsupported network but don't block connection
          console.warn('⚠️ Connected to unsupported network:', numericChainId);
          setError(ERROR_MESSAGES.METAMASK_WRONG_NETWORK);
        } else {
          clearErrorOnSuccess(); // Clear errors on successful connection
        }
        
        console.log('✅ MetaMask connected successfully:', {
          account: accounts[0],
          chainId: numericChainId,
          network: currentNetwork?.name || 'Unsupported',
          isSupported
        });
      } else {
        // No accounts returned
        setError(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
        setIsConnected(false);
        setIsWalletLocked(false);
      }
    } catch (error) {
      handleError(error, 'connection');
      
      setIsConnected(false);
      setAccount(null);
      setChainId(null);
      setIsSupportedNetwork(false);
      setCurrentNetwork(null);
      
      // Check if error is due to locked wallet
      if (error.code === 4100) {
        setIsWalletLocked(true);
      } else {
        setIsWalletLocked(false);
      }
    } finally {
      setIsConnecting(false);
      setIsLoadingNetwork(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsDisconnecting(true);
      
      // Clear all connection state
      setAccount(null);
      setChainId(null);
      setIsConnected(false);
      clearError(); // Clear errors on disconnect
      setIsSupportedNetwork(false);
      setCurrentNetwork(null);
      setIsWalletLocked(false); // Clear locked state on disconnect
      
      console.log('🔌 MetaMask disconnected');
    } catch (error) {
      handleError(error, 'disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const switchNetwork = async (targetChainId) => {
    if (!isMetaMaskInstalled || !isConnected) {
      setError(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      return false;
    }

    // Find the target network configuration
    const targetNetwork = Object.values(NETWORKS).find(network => network.chainId === targetChainId);
    
    if (!targetNetwork) {
      setError(`Unsupported network: ${targetChainId}`);
      return false;
    }

    // Don't switch if already on the target network
    if (chainId === targetChainId) {
      console.log('✅ Already on target network:', targetNetwork.name);
      return true;
    }

    setIsLoadingNetwork(true);
    clearError();

    try {
      console.log(`🔄 Switching to network: ${targetNetwork.name} (${targetChainId})`);
      
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });

      console.log('✅ Network switch successful');
      clearErrorOnSuccess();
      return true;

    } catch (error) {
      // Handle specific error codes
      if (error.code === 4902) {
        // Network not added to MetaMask, try to add it
        console.log('📝 Network not found, attempting to add:', targetNetwork.name);
        
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: targetNetwork.name,
              nativeCurrency: {
                name: targetNetwork.symbol,
                symbol: targetNetwork.symbol,
                decimals: 18
              },
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: [targetNetwork.blockExplorer]
            }]
          });

          console.log('✅ Network added and switched successfully');
          clearErrorOnSuccess();
          return true;

        } catch (addError) {
          console.error('❌ Failed to add network:', addError);
          handleError(addError, 'add network');
          return false;
        }
      } else {
        // Handle other switch errors
        console.error('❌ Network switch failed:', error);
        handleError(error, 'switch network');
        return false;
      }
    } finally {
      setIsLoadingNetwork(false);
    }
  };

  // Retry connection function
  const retryConnection = async () => {
    if (error && errorCount < 3) {
      console.log(`🔄 Retrying connection (attempt ${errorCount + 1}/3)`);
      await connect();
    } else if (errorCount >= 3) {
      setError('Too many connection attempts. Please refresh the page and try again.');
    }
  };

  // Combined loading state
  const isLoading = isInitializing || isConnecting || isLoadingNetwork || isLoadingAccount || isDisconnecting;

  return {
    // MetaMask detection
    isMetaMaskInstalled,
    
    // Connection state
    account,
    chainId,
    isConnected,
    isConnecting,
    
    // Network validation
    isSupportedNetwork,
    currentNetwork,
    
    // Error state
    error,
    lastErrorCode,
    errorCount,
    
    // Loading states
    isLoading,
    isInitializing,
    isLoadingNetwork,
    isLoadingAccount,
    isDisconnecting,
    
    // Auto-reconnection state
    isWalletLocked,
    autoReconnectAttempted,
    
    // Connection functions
    connect,
    disconnect,
    switchNetwork,
    retryConnection,
    clearError,
    
    // Helper function to get MetaMask provider
    getProvider: () => {
      if (isMetaMaskInstalled && window.ethereum) {
        return window.ethereum;
      }
      return null;
    }
  };
};

export default useWallet;