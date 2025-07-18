// DEPRECATED: This file has been replaced with src/utils/config.js for security
// Keeping for backward compatibility until all imports are updated

// Import secure configuration
import { API_URL, RPC_URL, SECRET_KEY } from '../utils/config';

// SECURITY FIX: Removed hardcoded credentials
// The following values are now loaded from environment variables:
// - INFURA_PROJECT_ID (now from REACT_APP_INFURA_PROJECT_ID)
// - SECRET_KEY (now undefined - MetaMask will handle signing)

// Export for backward compatibility
export { API_URL, RPC_URL, SECRET_KEY };

// TODO: Update all imports to use src/utils/config.js directly
// This file can be removed once all components are updated
