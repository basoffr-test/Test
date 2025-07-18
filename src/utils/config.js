// Secure configuration using environment variables
// This file replaces the insecure hardcoded config.js

// Environment variable validation
const requiredEnvVars = [
  'REACT_APP_INFURA_PROJECT_ID'
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing required environment variables:');
    missing.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('📋 Please create a .env.local file with the required variables.');
    console.warn('📖 See env_example.txt for reference.');
  }
};

// Validate environment on import
validateEnvironment();

// Secure configuration object
export const config = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  
  // Blockchain Configuration
  INFURA_PROJECT_ID: process.env.REACT_APP_INFURA_PROJECT_ID || null,
  DEFAULT_NETWORK_ID: parseInt(process.env.REACT_APP_DEFAULT_NETWORK_ID) || 11155111,
  
  // Application Configuration
  ENABLE_LOGS: process.env.REACT_APP_ENABLE_LOGS === 'true',
  MAX_FILE_SIZE_MB: parseInt(process.env.REACT_APP_MAX_FILE_SIZE_MB) || 5,
  MAX_ADDRESSES: parseInt(process.env.REACT_APP_MAX_ADDRESSES) || 1000,
  
  // Development flags
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

// Helper function to get RPC URL
export const getRPCUrl = (networkId = config.DEFAULT_NETWORK_ID) => {
  if (!config.INFURA_PROJECT_ID) {
    throw new Error('INFURA_PROJECT_ID not configured. Please check your .env.local file.');
  }
  
  const networkMap = {
    1: 'mainnet',
    11155111: 'sepolia',
    137: 'polygon-mainnet',
    80001: 'polygon-mumbai'
  };
  
  const networkName = networkMap[networkId] || 'sepolia';
  return `https://${networkName}.infura.io/v3/${config.INFURA_PROJECT_ID}`;
};

// Export for backward compatibility (until all imports are updated)
export const API_URL = config.API_URL;
export const RPC_URL = getRPCUrl();

// SECURITY NOTE: SECRET_KEY has been removed
// MetaMask integration will handle signing instead of hardcoded private keys
export const SECRET_KEY = undefined; // Explicitly undefined for security

// Log configuration status
if (config.ENABLE_LOGS) {
  console.log('🔧 Configuration loaded:', {
    apiUrl: config.API_URL,
    networkId: config.DEFAULT_NETWORK_ID,
    hasInfuraId: !!config.INFURA_PROJECT_ID,
    environment: process.env.NODE_ENV
  });
} 