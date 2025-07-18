// Application constants for Wallet Airdrop DApp
// This file contains all constant values used throughout the application

// =============================================================================
// BLOCKCHAIN CONSTANTS
// =============================================================================

// Network configurations
export const NETWORKS = {
  MAINNET: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io',
    rpcUrl: 'mainnet'
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    symbol: 'SEP',
    blockExplorer: 'https://sepolia.etherscan.io',
    rpcUrl: 'sepolia'
  },
  POLYGON: {
    chainId: 137,
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
    rpcUrl: 'polygon-mainnet'
  },
  MUMBAI: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    symbol: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com',
    rpcUrl: 'polygon-mumbai'
  }
};

// Default token addresses for testing
export const DEFAULT_TOKENS = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
  USDC: '0xA0b86a33E6441c8e08C1E1234567890ABCDEfghi', // Example USDC
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'   // DAI on Ethereum
};

// Gas limits for different operations
export const GAS_LIMITS = {
  TRANSFER: 65000,
  APPROVE: 55000,
  BATCH_TRANSFER: 200000,
  EMERGENCY_LIMIT: 500000
};

// =============================================================================
// APPLICATION LIMITS
// =============================================================================

export const CSV_LIMITS = {
  MAX_FILE_SIZE_MB: 5,
  MAX_ADDRESSES: 1000,
  MIN_ADDRESSES: 1,
  BATCH_SIZE: 50
};

export const VALIDATION_LIMITS = {
  MIN_AMOUNT: 0.000001,
  MAX_AMOUNT: 1000000,
  ADDRESS_LENGTH: 42,
  DECIMALS_PRECISION: 18
};

// =============================================================================
// ERROR MESSAGES
// =============================================================================

export const ERROR_MESSAGES = {
  // MetaMask errors
  METAMASK_NOT_INSTALLED: 'MetaMask is not installed. Please install MetaMask to continue.',
  METAMASK_NOT_CONNECTED: 'Please connect your MetaMask wallet.',
  METAMASK_WRONG_NETWORK: 'Please switch to the correct network in MetaMask.',
  METAMASK_USER_REJECTED: 'Transaction was rejected by user.',
  
  // Wallet errors
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  WALLET_ACCOUNT_CHANGED: 'Wallet account changed. Please reconnect.',
  WALLET_NETWORK_CHANGED: 'Network changed. Please refresh the page.',
  
  // Transaction errors
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  INSUFFICIENT_GAS: 'Insufficient gas for this transaction.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  TRANSACTION_REJECTED: 'Transaction was rejected.',
  GAS_ESTIMATION_FAILED: 'Failed to estimate gas. Please try again.',
  
  // CSV errors
  CSV_FILE_TOO_LARGE: `File size exceeds ${CSV_LIMITS.MAX_FILE_SIZE_MB}MB limit.`,
  CSV_TOO_MANY_ADDRESSES: `Cannot process more than ${CSV_LIMITS.MAX_ADDRESSES} addresses.`,
  CSV_INVALID_FORMAT: 'Invalid CSV format. Please check your file.',
  CSV_EMPTY_FILE: 'CSV file is empty.',
  CSV_INVALID_ADDRESS: 'Invalid Ethereum address found in CSV.',
  CSV_DUPLICATE_ADDRESS: 'Duplicate addresses found in CSV.',
  
  // Validation errors
  INVALID_ADDRESS: 'Invalid Ethereum address format.',
  INVALID_AMOUNT: 'Invalid amount. Please enter a valid number.',
  AMOUNT_TOO_SMALL: `Amount must be at least ${VALIDATION_LIMITS.MIN_AMOUNT}.`,
  AMOUNT_TOO_LARGE: `Amount cannot exceed ${VALIDATION_LIMITS.MAX_AMOUNT}.`,
  REQUIRED_FIELD: 'This field is required.',
  
  // Generic errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait before trying again.'
};

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully!',
  TRANSACTION_SENT: 'Transaction sent successfully!',
  TRANSACTION_CONFIRMED: 'Transaction confirmed!',
  CSV_UPLOADED: 'CSV file uploaded and validated successfully!',
  AIRDROP_COMPLETED: 'Airdrop completed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

// =============================================================================
// VALIDATION PATTERNS
// =============================================================================

// Regular expression for Ethereum address validation
export const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Regular expression for amount validation (supports decimals)
export const AMOUNT_REGEX = /^\d+(\.\d{1,18})?$/;

// File extensions allowed for CSV upload
export const ALLOWED_FILE_EXTENSIONS = ['.csv', '.txt'];

// =============================================================================
// UI CONSTANTS
// =============================================================================

export const UI_CONSTANTS = {
  LOADING_TIMEOUT: 30000, // 30 seconds
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds
  POLLING_INTERVAL: 3000, // 3 seconds for transaction polling
  DEBOUNCE_DELAY: 500, // 500ms debounce for search inputs
  
  // Toast positions
  TOAST_POSITION: 'top-right',
  
  // Modal sizes
  MODAL_SIZE: {
    SMALL: 'sm',
    MEDIUM: 'md',
    LARGE: 'lg'
  }
};

// =============================================================================
// DEVELOPER CONSTANTS
// =============================================================================

export const DEV_CONSTANTS = {
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_LOGS: process.env.REACT_APP_ENABLE_LOGS === 'true',
  MOCK_METAMASK: process.env.REACT_APP_MOCK_METAMASK === 'true',
  SKIP_VALIDATIONS: process.env.REACT_APP_SKIP_VALIDATIONS === 'true'
};

// =============================================================================
// ERC-20 TOKEN ABI (commonly used functions)
// =============================================================================

export const ERC20_ABI = [
  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Write functions
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// =============================================================================
// EXPORT GROUPED CONSTANTS
// =============================================================================

export const CONSTANTS = {
  NETWORKS,
  DEFAULT_TOKENS,
  GAS_LIMITS,
  CSV_LIMITS,
  VALIDATION_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UI_CONSTANTS,
  DEV_CONSTANTS
};

export default CONSTANTS; 