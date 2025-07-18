import React, { createContext, useContext } from 'react';
import { useWallet } from '../hooks/useWallet';

/**
 * WalletContext for global wallet state management
 * Provides MetaMask wallet state to all components in the app
 */

// Create the context
const WalletContext = createContext();

/**
 * WalletProvider component
 * Wraps the useWallet hook and provides wallet state to children
 */
export const WalletProvider = ({ children }) => {
  // Use the useWallet hook to get all wallet functionality
  const walletState = useWallet();

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Custom hook to consume the WalletContext
 * Provides easy access to wallet state throughout the app
 * 
 * @returns {Object} All wallet state and functions from useWallet hook
 * @throws {Error} If used outside of WalletProvider
 */
export const useWalletContext = () => {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  
  return context;
};

/**
 * Higher-order component for components that need wallet access
 * Alternative to useWalletContext hook
 * 
 * @param {React.Component} Component - Component to wrap with wallet context
 * @returns {React.Component} Wrapped component with wallet props
 */
export const withWallet = (Component) => {
  const WrappedComponent = (props) => {
    const walletState = useWalletContext();
    return <Component {...props} {...walletState} />;
  };
  
  // Set display name for debugging
  WrappedComponent.displayName = `withWallet(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Export the context for advanced usage
export { WalletContext };

export default WalletContext; 