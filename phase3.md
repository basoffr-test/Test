🎯 Phase 3 Micro-Prompts - Token Airdrop Logic

Core Business Functionality: CSV processing, token transfers, batch operations


📋 Day 15: Smart Contract Foundation
Prompt 3.1: Token Contract Service
@src/utils/constants.js @src/context/WalletContext.js 

STEP 1: Create TokenService for ERC-20 interactions

Create src/utils/TokenService.js:
✅ Class-based service using ERC20_ABI from constants.js
✅ getTokenInfo(address) - name, symbol, decimals, balance
✅ checkAllowance(tokenAddress, spenderAddress)
✅ Use connected signer from WalletContext
✅ Proper error handling with try/catch

PROGRESS TRACKING:
- [ ] TokenService class created
- [ ] Token info fetching working
- [ ] Balance checking implemented
- [ ] Error handling added

Test: Should fetch USDC token info on Sepolia testnet.
Prompt 3.2: Gas Estimation Service
@src/utils/TokenService.js @src/utils/constants.js 

STEP 2: Add gas estimation to TokenService

Extend TokenService with gas estimation:
✅ estimateTransferGas(tokenAddress, recipient, amount)
✅ Handle decimals conversion properly
✅ Add gas price fetching
✅ Calculate total transaction cost
✅ Use GAS_LIMITS from constants.js for fallbacks

PROGRESS TRACKING:
- [ ] Gas estimation implemented
- [ ] Decimals handling added
- [ ] Gas price fetching working
- [ ] Cost calculation complete

Test: Should estimate gas for token transfers accurately.
Prompt 3.3: Single Token Transfer
@src/utils/TokenService.js @src/utils/constants.js 

STEP 3: Implement single token transfer

Add transferToken method to TokenService:
✅ transferToken(tokenAddress, recipient, amount)
✅ Proper decimals conversion using parseUnits
✅ Gas estimation with 20% buffer
✅ Transaction confirmation waiting
✅ Return transaction hash and receipt

PROGRESS TRACKING:
- [ ] Transfer method implemented
- [ ] Decimals conversion working
- [ ] Gas buffer added
- [ ] Confirmation tracking

Test: Should successfully transfer tokens to a test address.

📋 Day 16: CSV Processing
Prompt 3.4: CSV Upload Component
@.cursorrules @src/utils/constants.js 

STEP 4: Create CSV upload component

Create src/components/airdrop/CSVUpload.js:
✅ File input with drag & drop functionality
✅ File size validation using CSV_LIMITS
✅ CSV parsing with proper error handling
✅ Progress indicator during processing
✅ Bootstrap styling for consistency

PROGRESS TRACKING:
- [ ] Component created
- [ ] File upload working
- [ ] Size validation implemented
- [ ] Progress indicators added

Test: Should accept CSV files and show upload progress.
Prompt 3.5: Address Validation Service
@src/utils/constants.js @.cursorrules 

STEP 5: Create address validation utility

Create src/utils/AddressValidator.js:
✅ validateEthereumAddress(address) using ethers.isAddress
✅ Checksum validation with getAddress()
✅ Duplicate detection in address arrays
✅ Batch validation for large lists
✅ Use REGEX_PATTERNS from constants.js

PROGRESS TRACKING:
- [ ] Validation service created
- [ ] Address format checking
- [ ] Checksum validation
- [ ] Duplicate detection

Test: Should validate Ethereum addresses and catch duplicates.
Prompt 3.6: CSV Processing Logic
@src/components/airdrop/CSVUpload.js @src/utils/AddressValidator.js 

STEP 6: Integrate CSV processing with validation

Add processing logic to CSVUpload:
✅ Parse CSV into addresses and amounts
✅ Validate each address using AddressValidator
✅ Show validation results (valid/invalid/duplicates)
✅ Allow user to review and edit before proceeding
✅ Export clean address list

PROGRESS TRACKING:
- [ ] CSV parsing implemented
- [ ] Validation integration
- [ ] Results display
- [ ] Edit functionality

Test: Upload CSV with mixed valid/invalid addresses, should categorize correctly.

📋 Day 17: Batch Transfer Logic
Prompt 3.7: Batch Transfer Service
@src/utils/TokenService.js @src/utils/constants.js 

STEP 7: Add batch transfer to TokenService

Add batchTransfer method:
✅ Process transfers in chunks (BATCH_SETTINGS.MAX_BATCH_SIZE)
✅ Add delay between batches (BATCH_SETTINGS.BATCH_DELAY_MS)
✅ Progress tracking for each transfer
✅ Error collection for failed transfers
✅ Retry logic for network issues

PROGRESS TRACKING:
- [ ] Batch processing implemented
- [ ] Chunk management
- [ ] Progress tracking
- [ ] Error collection

Test: Should handle batch transfers with progress updates.
Prompt 3.8: Transaction Progress Component
@.cursorrules @src/utils/constants.js 

STEP 8: Create transaction progress display

Create src/components/airdrop/TransactionProgress.js:
✅ Progress bar for batch operations
✅ Individual transaction status display
✅ Success/error indicators per transfer
✅ Transaction hash links to block explorer
✅ Real-time updates during processing

PROGRESS TRACKING:
- [ ] Progress component created
- [ ] Status indicators
- [ ] Block explorer links
- [ ] Real-time updates

Test: Should show progress during batch transfers.

📋 Day 18: Airdrop UI Integration
Prompt 3.9: Main Airdrop Component
@src/components/airdrop/CSVUpload.js @src/utils/TokenService.js 

STEP 9: Create main airdrop interface

Create src/components/airdrop/AirdropMain.js:
✅ Token selection (address input with validation)
✅ CSV upload and validation display
✅ Transfer preview with gas estimates
✅ Batch size configuration
✅ Execute airdrop button with confirmations

PROGRESS TRACKING:
- [ ] Main component created
- [ ] Token selection working
- [ ] CSV integration
- [ ] Preview functionality

Test: Should provide complete airdrop workflow.
Prompt 3.10: Replace Transfer Component
@src/components/Transfer/ @src/components/airdrop/AirdropMain.js 

STEP 10: Replace old Transfer component

Integrate new airdrop functionality:
✅ Replace existing Transfer component with AirdropMain
✅ Update routing if necessary
✅ Maintain existing UI layout
✅ Add navigation between upload and execution
✅ Preserve Bootstrap styling

PROGRESS TRACKING:
- [ ] Component replacement
- [ ] Routing updated
- [ ] UI layout maintained
- [ ] Navigation added

Test: Should replace old transfer functionality completely.

📋 Day 19: Error Handling & Validation
Prompt 3.11: Comprehensive Error Handling
@src/utils/TokenService.js @src/utils/constants.js 

STEP 11: Add robust error handling

Enhance error handling throughout airdrop flow:
✅ Token not found errors
✅ Insufficient balance handling
✅ Gas estimation failures
✅ Network congestion handling
✅ Use ERROR_MESSAGES from constants.js

PROGRESS TRACKING:
- [ ] Token error handling
- [ ] Balance validation
- [ ] Gas error handling
- [ ] Network error handling

Test: Should handle all error scenarios gracefully.
Prompt 3.12: Transaction Validation
@src/components/airdrop/AirdropMain.js @src/utils/TokenService.js 

STEP 12: Add pre-flight validation

Add validation before executing airdrop:
✅ Check token balance vs total airdrop amount
✅ Validate gas fees vs ETH balance
✅ Confirm all addresses are valid
✅ Show warning for large airdrops
✅ Require user confirmation

PROGRESS TRACKING:
- [ ] Balance validation
- [ ] Gas validation
- [ ] Address validation
- [ ] Confirmation dialogs

Test: Should prevent impossible airdrops before execution.

📋 Day 20: Performance & Polish
Prompt 3.13: Performance Optimization
@src/components/airdrop/ @src/utils/ 

STEP 13: Optimize for large CSV files

Add performance optimizations:
✅ Chunked CSV processing for large files
✅ Virtual scrolling for large address lists
✅ Debounced validation during editing
✅ Lazy loading of transaction history
✅ Memory management for large datasets

PROGRESS TRACKING:
- [ ] Chunked processing
- [ ] Virtual scrolling
- [ ] Debounced validation
- [ ] Memory management

Test: Should handle 1000+ addresses smoothly.
Prompt 3.14: Mobile Responsiveness
@src/components/airdrop/ @.cursorrules 

STEP 14: Ensure mobile compatibility

Optimize airdrop interface for mobile:
✅ Responsive design for all screen sizes
✅ Touch-friendly file upload
✅ Readable transaction progress on small screens
✅ Accessible navigation
✅ Fast loading on mobile networks

PROGRESS TRACKING:
- [ ] Responsive design
- [ ] Touch compatibility
- [ ] Mobile readability
- [ ] Performance optimized

Test: Should work perfectly on mobile devices.
Prompt 3.15: Final Integration Test
@src/components/airdrop/ @src/utils/ 

STEP 15: Complete airdrop flow testing

Test entire airdrop workflow:
✅ CSV upload and validation
✅ Token selection and balance checking
✅ Gas estimation and fee calculation
✅ Batch transfer execution
✅ Error handling and recovery
✅ Mobile and desktop compatibility

PROGRESS TRACKING:
- [ ] Upload flow tested
- [ ] Token flow tested
- [ ] Transfer execution tested
- [ ] Error scenarios tested
- [ ] Cross-platform tested

FINAL TEST: Complete end-to-end airdrop should work flawlessly.

🎯 Phase 3 Success Criteria
Core Functionality:

 CSV upload with validation
 Token balance checking
 Gas estimation and cost calculation
 Batch transfer execution
 Progress tracking and status updates

User Experience:

 Intuitive workflow
 Clear error messages
 Mobile-responsive design
 Professional UI consistency
 Fast performance

Technical Quality:

 Proper error handling
 Efficient batch processing
 Memory management
 Security validations
 Production-ready code


🚀 Ready for Phase 3?
Start with Prompt 3.1 - Token Contract Service
This phase will build the core business logic that makes this a real airdrop platform! 💪
Daily Workflow:

Execute 3-4 prompts per day
Test each feature thoroughly
Update progress tracker
Client update at week end

Let's build the airdrop functionality! 🎯