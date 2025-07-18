# 🤖 Cursor AI Development Guide - Wallet Airdrop DApp

> **Cursor Configuration**: This guide provides specific instructions for using Cursor AI effectively with this Web3 project.

## 📋 Project Context for Cursor

### Current Project State
- **Status**: 30% complete, requires MetaMask integration rebuild
- **Priority**: Security fixes first, then Web3 functionality
- **Timeline**: 6-8 weeks development cycle
- **Tech Stack**: React 18, ethers.js v6, CoreUI, MetaMask

### Key Files for Cursor to Understand
```
📁 Project Structure
├── 📄 IMPLEMENTATION_PLAN.md      # Detailed roadmap
├── 📄 TECHNICAL_ASSESSMENT.md     # Complete issue analysis  
├── 📄 .cursorrules                # Cursor-specific rules
├── 📄 .env.example               # Environment setup
├── 📁 src/
│   ├── 📄 utils/constants.js     # Web3 constants and config
│   ├── 📁 hooks/                 # Custom React hooks (to create)
│   ├── 📁 components/            # React components (existing)
│   └── 📁 utils/                 # Utility functions (to create)
```

## 🎯 Cursor Prompting Strategy

### For Initial Setup (Week 1)
Use these specific prompts with Cursor:

#### Security Fixes
```
@TECHNICAL_ASSESSMENT.md Help me remove all hardcoded credentials from config.js and implement proper environment variable handling. Focus on the security vulnerabilities listed in the assessment.
```

#### Dependency Resolution
```
@package.json @IMPLEMENTATION_PLAN.md Fix the React 17/18 version conflict with CoreUI and remove unnecessary sqlite3 dependencies that are causing build failures.
```

### For MetaMask Integration (Week 2)
```
@constants.js @.cursorrules Create a useWallet hook that implements proper MetaMask connection with event listeners for account and network changes. Follow the patterns in .cursorrules.
```

```
@TECHNICAL_ASSESSMENT.md Implement the wallet connection flow described in the assessment, replacing the placeholder implementation in App.js.
```

### For Smart Contract Logic (Week 3)
```
@constants.js Create a TokenTransferService class that handles ERC-20 transfers with proper decimals conversion, gas estimation, and error handling.
```

```
@IMPLEMENTATION_PLAN.md Build the batch transfer functionality described in Week 3 of the implementation plan.
```

## 🔧 Cursor-Specific Development Patterns

### 1. Context-Aware File Creation
When asking Cursor to create new files, always reference existing project files:

```
@constants.js @.cursorrules Create src/hooks/useWallet.js following the patterns in constants.js for error handling and the rules in .cursorrules for React patterns.
```

### 2. Code Review with Context
```
@TECHNICAL_ASSESSMENT.md Review this MetaMask connection code and identify any issues mentioned in the technical assessment.
```

### 3. Implementation Following Plans
```
@IMPLEMENTATION_PLAN.md Implement the CSV processing functionality outlined in Week 4 of the implementation plan.
```

## 🚀 Quick Start Commands for Cursor

### Environment Setup
```bash
# Use these commands in Cursor terminal
cp .env.example .env.local
npm install --legacy-peer-deps
npm start
```

### Development Workflow
1. **Always reference documentation**: Use `@filename` to include context
2. **Follow the roadmap**: Reference `@IMPLEMENTATION_PLAN.md` for priorities
3. **Check against assessment**: Use `@TECHNICAL_ASSESSMENT.md` to avoid known issues
4. **Follow patterns**: Reference `@.cursorrules` for coding standards

## 📝 Common Cursor Prompts for This Project

### MetaMask Integration
```
@constants.js @.cursorrules Create a React hook for MetaMask wallet connection that:
- Detects if MetaMask is installed
- Handles account and network changes
- Provides loading and error states
- Follows the error handling patterns in constants.js
```

### Smart Contract Interactions
```
@constants.js Create a utility function for ERC-20 token transfers that:
- Uses the ERC20_ABI from constants.js
- Handles decimals conversion properly
- Estimates gas before transactions
- Returns transaction hash and confirmation promise
```

### CSV Processing
```
@IMPLEMENTATION_PLAN.md @constants.js Implement CSV address validation that:
- Follows the validation requirements in the implementation plan
- Uses error messages from constants.js
- Handles the file size limits defined in CSV_LIMITS
- Returns detailed validation results
```

### UI Components
```
@.cursorrules Create a responsive wallet connection component that:
- Shows connection status and account address
- Handles loading and error states
- Follows CoreUI design patterns
- Includes proper accessibility attributes
```

### Testing
```
@TECHNICAL_ASSESSMENT.md Create unit tests for the wallet connection hook following the testing strategy outlined in the technical assessment.
```

## 🔍 Debugging with Cursor

### Common Issues and Prompts

#### Build Errors
```
@package.json @TECHNICAL_ASSESSMENT.md I'm getting build errors. Help me fix the dependency conflicts mentioned in the technical assessment.
```

#### MetaMask Connection Issues
```
@constants.js @.cursorrules Debug this MetaMask connection error and ensure it follows the error handling patterns in constants.js.
```

#### Transaction Failures
```
@constants.js Help me debug this token transfer transaction. Check gas estimation and decimals handling against the patterns in constants.js.
```

## 📊 Progress Tracking with Cursor

### Week 1 Checklist
Use this prompt to track progress:
```
@IMPLEMENTATION_PLAN.md Review my current progress against Week 1 tasks in the implementation plan and suggest next steps.
```

### Code Quality Checks
```
@.cursorrules @TECHNICAL_ASSESSMENT.md Review this code for security issues and ensure it follows the coding standards in .cursorrules.
```

## 🎨 UI/UX Development

### Component Creation
```
@.cursorrules Create a transaction status component that:
- Shows pending, confirmed, and failed states
- Uses CoreUI components for consistency
- Includes proper loading animations
- Handles mobile responsiveness
```

### Form Handling
```
@constants.js @.cursorrules Create a CSV upload form that:
- Validates file size against CSV_LIMITS
- Shows upload progress
- Displays validation results
- Follows React form patterns in .cursorrules
```

## 🧪 Testing Strategy with Cursor

### Unit Test Creation
```
@IMPLEMENTATION_PLAN.md Create comprehensive tests for the useWallet hook following the testing strategy in the implementation plan.
```

### Integration Testing
```
@constants.js Create integration tests for the token transfer flow using the configurations in constants.js.
```

## 🚀 Deployment Preparation

### Production Builds
```
@.env.example @constants.js Help me prepare production environment variables and ensure all hardcoded values are properly configured.
```

### Performance Optimization
```
@TECHNICAL_ASSESSMENT.md Optimize the CSV processing performance issues mentioned in the technical assessment.
```

## 🔐 Security Review

### Security Audit
```
@TECHNICAL_ASSESSMENT.md @.cursorrules Perform a security review of this code against the vulnerabilities listed in the technical assessment.
```

### Code Hardening
```
@constants.js Implement input validation and sanitization using the patterns and regex in constants.js.
```

## 📚 Learning Resources for Cursor

### Web3 Patterns
- Reference `@constants.js` for Web3 configurations
- Use `@.cursorrules` for React and Web3 best practices
- Follow `@IMPLEMENTATION_PLAN.md` for architectural decisions

### Error Handling
- Use error messages from `@constants.js`
- Follow patterns in `@.cursorrules`
- Reference solutions in `@TECHNICAL_ASSESSMENT.md`

## 🎯 Success Metrics

Track progress using these Cursor prompts:

### Functionality Check
```
@IMPLEMENTATION_PLAN.md Verify that the current implementation meets the success criteria outlined in the implementation plan.
```

### Code Quality Review
```
@.cursorrules @TECHNICAL_ASSESSMENT.md Review the codebase for completion against technical requirements and coding standards.
```

---

## 💡 Pro Tips for Cursor Usage

1. **Always include relevant documentation** in your prompts using `@filename`
2. **Reference multiple files** for better context: `@file1 @file2 prompt`
3. **Follow the implementation order** outlined in `IMPLEMENTATION_PLAN.md`
4. **Use specific, actionable prompts** rather than general requests
5. **Include error context** when debugging issues
6. **Reference existing patterns** from `constants.js` and `.cursorrules`

### Example Perfect Prompt
```
@TECHNICAL_ASSESSMENT.md @constants.js @.cursorrules 

I need to implement MetaMask wallet connection to replace the placeholder in App.js. Based on the technical assessment, create a useWallet hook that:

1. Fixes the security issues mentioned (no hardcoded keys)
2. Uses proper ethers.js BrowserProvider instead of hardcoded signer
3. Implements account and network change listeners
4. Uses error messages from constants.js
5. Follows React patterns from .cursorrules
6. Handles all the edge cases identified in the assessment

The hook should replace the current handleConnect function that just shows an alert.
```

This comprehensive guide will help you maximize Cursor's effectiveness for this Web3 project!