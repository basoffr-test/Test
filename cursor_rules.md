# Cursor AI Rules for Wallet Airdrop DApp

## Project Context
You are working on a React-based Web3 DApp for token airdrops. The project was partially developed and needs completion of MetaMask integration, smart contract interactions, and security fixes.

## Current Tech Stack
- **Frontend**: React 18, CoreUI Bootstrap, ethers.js v6
- **Blockchain**: Ethereum, ERC-20 tokens, MetaMask
- **Build**: Create React App with react-app-rewired
- **Testing**: Jest, React Testing Library (to be implemented)

## Critical Issues to Address
1. **MetaMask Integration**: Currently mocked with alerts - needs real implementation
2. **Security**: Hardcoded private keys in config.js - must be removed
3. **Dependencies**: React 17/18 conflicts, unnecessary sqlite3
4. **Smart Contracts**: Missing decimals handling, gas estimation

## Code Standards & Patterns

### File Structure Preferences
```
src/
├── components/
│   ├── wallet/          # Wallet-related components
│   ├── airdrop/         # Airdrop functionality
│   └── common/          # Reusable UI components
├── hooks/               # Custom React hooks
│   ├── useWallet.js     # Wallet state management
│   ├── useContract.js   # Smart contract interactions
│   └── useAirdrop.js    # Airdrop logic
├── utils/               # Utility functions
│   ├── web3.js          # Web3 helpers
│   ├── validation.js    # Address/input validation
│   └── constants.js     # App constants
├── context/             # React Context providers
└── __tests__/           # Test files
```

### React Patterns
- Use functional components with hooks
- Prefer custom hooks for Web3 logic
- Use React Context for wallet state
- Implement proper error boundaries
- Always handle loading states

### Web3 Best Practices
- Always check for `window.ethereum` before using
- Use `ethers.BrowserProvider` for MetaMask connections
- Handle network switching and account changes
- Implement proper gas estimation
- Validate all addresses with checksums
- Use `parseUnits` and `formatUnits` for token amounts

### Error Handling
- Create custom error classes for Web3 errors
- Always wrap async operations in try/catch
- Provide user-friendly error messages
- Log detailed errors for debugging
- Implement retry logic for network requests

## Coding Rules

### Security First
- NEVER hardcode private keys or sensitive data
- Use environment variables for all configuration
- Validate all user inputs
- Sanitize CSV data before processing
- Implement proper CORS headers

### Performance
- Lazy load components where possible
- Debounce user inputs
- Optimize CSV processing for large files
- Use React.memo for expensive components
- Implement proper cleanup in useEffect

### Code Quality
- Use TypeScript interfaces for better type safety
- Write descriptive function and variable names
- Add JSDoc comments for complex functions
- Keep functions small and single-purpose
- Use consistent naming conventions

## Web3 Implementation Guidelines

### MetaMask Connection Pattern
```javascript
// Always use this pattern for wallet connections
const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }
    // Implementation here
  };

  useEffect(() => {
    // Setup event listeners for account/chain changes
  }, []);

  return { account, chainId, connect, isConnecting };
};
```

### Smart Contract Interaction Pattern
```javascript
// Always handle decimals and gas estimation
const transferToken = async (tokenAddress, recipient, amount) => {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  
  // Get token decimals
  const decimals = await contract.decimals();
  const value = ethers.parseUnits(amount.toString(), decimals);
  
  // Estimate gas
  const gasLimit = await contract.transfer.estimateGas(recipient, value);
  
  // Execute with proper gas limit
  return contract.transfer(recipient, value, { gasLimit });
};
```

## Component Guidelines

### UI Components
- Use CoreUI components consistently
- Implement mobile-first responsive design
- Add proper accessibility attributes
- Include loading states for all async operations
- Show clear error messages to users

### Form Handling
- Use controlled components
- Validate inputs on change and submit
- Provide real-time feedback
- Handle file uploads properly
- Clear forms after successful submission

## Testing Requirements

### Unit Tests
- Test all utility functions
- Mock external dependencies (MetaMask, contracts)
- Test custom hooks with React Testing Library
- Validate error handling paths

### Integration Tests
- Test complete wallet connection flow
- Validate CSV processing pipeline
- Test transaction execution
- Verify error boundaries

## Common Mistakes to Avoid
1. **Don't use hardcoded gas limits** - always estimate
2. **Don't ignore network changes** - implement listeners
3. **Don't trust user input** - validate everything
4. **Don't block UI** - use proper async patterns
5. **Don't ignore errors** - handle all edge cases

## Environment Setup
- Use Node.js 18.20.8 (LTS)
- Install with `npm install --legacy-peer-deps`
- Configure environment variables in `.env.local`
- Never commit `.env` files

## Documentation Standards
- Update README.md for any major changes
- Document all environment variables needed
- Include setup instructions for new developers
- Add inline comments for complex Web3 logic

## Deployment Considerations
- Remove all console.logs before production
- Optimize bundle size
- Configure proper environment variables
- Test on multiple networks (mainnet, testnet)
- Implement proper error monitoring

When generating code, always consider these rules and the current project context. Focus on completing the MetaMask integration and fixing security issues as top priorities.