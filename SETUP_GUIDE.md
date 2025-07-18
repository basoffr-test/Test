# 🚀 Setup Guide - Wallet Airdrop DApp

## ⚠️ Security Fixes Applied

This project has undergone critical security fixes. The previous hardcoded credentials have been removed and replaced with secure environment variable handling.

## 📋 Prerequisites

- **Node.js**: 18.20.8 (LTS recommended)
- **npm**: 8.x or higher
- **MetaMask**: Browser extension installed
- **Git**: For version control

## 🔧 Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd wallet-airdrop

# Install dependencies (use legacy-peer-deps for compatibility)
npm install --legacy-peer-deps
```

### 2. Environment Configuration

**CRITICAL**: You must configure environment variables before running the project.

```bash
# Create your environment file
cp env_example.txt .env.local
```

Edit `.env.local` with your actual values:

```env
# =============================================================================
# REQUIRED - Fill in these values
# =============================================================================

# Get your Infura Project ID from: https://infura.io/dashboard
REACT_APP_INFURA_PROJECT_ID=your_actual_infura_project_id

# Optional - adjust as needed
REACT_APP_DEFAULT_NETWORK_ID=11155111
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENABLE_LOGS=true
```

### 3. Start Development Server

```bash
# Start the development server
npm start

# The app will open at http://localhost:3000
```

## 🛡️ Security Changes Made

### ✅ Fixed Critical Vulnerabilities

1. **Removed hardcoded credentials** from `src/components/config.js`
2. **Eliminated eval() vulnerability** in `config-overrides.js`
3. **Added .env files to .gitignore** to prevent credential leaks
4. **Implemented environment variable validation**
5. **Created secure configuration system**

### ❌ Removed Dangerous Dependencies

The following server-side dependencies have been removed to prevent build issues:

- `sqlite3` - Caused Node.js compilation errors
- `sequelize` - Database ORM not needed for frontend
- `session-file-store` - Server-side session storage
- `cookie-parser` - Server-side middleware
- `cors` - Server-side middleware
- `express-session` - Server-side sessions
- `request` & `request-promise` - Deprecated packages
- `fs` - Node.js filesystem (not for browser)
- `express` - Server framework
- `nodemon` - Server development tool

## 🔍 Project Structure Changes

### New Secure Structure:
```
src/
├── utils/
│   ├── config.js          # ✅ Secure environment-based config
│   └── constants.js       # ✅ Application constants
├── components/
│   └── config.js          # ⚠️ Deprecated (backward compatibility)
└── config/
    └── constants.js       # ⚠️ Deprecated (backward compatibility)
```

### Configuration Files:

1. **`src/utils/config.js`** - New secure configuration system
2. **`src/utils/constants.js`** - Application constants and error messages
3. **`src/components/config.js`** - Deprecated, kept for backward compatibility
4. **`src/config/constants.js`** - Deprecated, kept for backward compatibility

## 🚨 Important Environment Variables

### Required Variables:
- `REACT_APP_INFURA_PROJECT_ID` - Your Infura project ID

### Optional Variables:
- `REACT_APP_DEFAULT_NETWORK_ID` - Network ID (default: 11155111 for Sepolia)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)
- `REACT_APP_ENABLE_LOGS` - Enable console logging (default: false)

### Security Notes:
- **NEVER** commit `.env.local` files
- **NEVER** put private keys in environment variables starting with `REACT_APP_`
- Variables starting with `REACT_APP_` are included in the client bundle

## 🔧 Build Process

### Development:
```bash
npm start           # Start development server
npm test            # Run tests
npm run build       # Create production build
```

### Production Build:
```bash
# Create optimized production build
npm run build

# Serve the build locally (for testing)
npx serve -s build
```

## 🐛 Troubleshooting

### Common Issues:

#### 1. Build Errors with sqlite3
**Error**: `node-gyp` compilation errors
**Solution**: Dependencies have been removed. Run `npm install --legacy-peer-deps`

#### 2. MetaMask Connection Issues
**Error**: "MetaMask support coming soon" alert
**Solution**: This is expected. MetaMask integration is planned for Phase 2.

#### 3. Missing Environment Variables
**Error**: Console warnings about missing variables
**Solution**: Create `.env.local` file with required variables.

#### 4. Network Connection Errors
**Error**: Failed to fetch from Infura
**Solution**: Check your `REACT_APP_INFURA_PROJECT_ID` in `.env.local`

### Clean Installation:
```bash
# If you encounter issues, try a clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 📚 Next Steps

### Phase 2 - MetaMask Integration (Planned)
- Real wallet connection functionality
- Account change listeners
- Network switching support
- Transaction handling

### Phase 3 - Smart Contract Integration (Planned)
- Token balance checking
- Transfer functionality
- Gas estimation
- Transaction confirmation

## 🔐 Security Best Practices

1. **Always use environment variables** for sensitive data
2. **Never commit `.env.local`** files
3. **Validate all user inputs** before processing
4. **Use proper error handling** for Web3 operations
5. **Test on testnets** before mainnet deployment

## 📞 Support

If you encounter issues:

1. Check this setup guide
2. Verify your environment variables
3. Ensure MetaMask is installed
4. Check the console for error messages

---

## ✅ Success Criteria

You should now have:
- ✅ Clean `npm install` without compilation errors
- ✅ Working `npm start` with stable development server
- ✅ No hardcoded credentials in source code
- ✅ Proper environment variable configuration
- ✅ Security vulnerabilities resolved

The project is now ready for Phase 2 development! 