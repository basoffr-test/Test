import { ethers } from 'ethers';
import { ERC20_ABI, ERROR_MESSAGES, GAS_LIMITS } from './constants';

/**
 * TokenService - Handles ERC-20 token interactions
 * Provides methods for token info, balance checking, transfers, and gas estimation
 */
class TokenService {
  constructor(signer) {
    this.signer = signer;
    this.provider = signer?.provider;
  }

  /**
   * Get token information (name, symbol, decimals, balance)
   * @param {string} tokenAddress - The token contract address
   * @returns {Promise<Object>} Token information object
   */
  async getTokenInfo(tokenAddress) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const account = await this.signer.getAddress();

      // Fetch token information in parallel
      const [name, symbol, decimals, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balanceOf(account)
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals),
        balance: ethers.formatUnits(balance, decimals),
        balanceRaw: balance.toString()
      };
    } catch (error) {
      console.error('❌ Error getting token info:', error);
      
      // Enhanced error handling
      if (error.message.includes('execution reverted')) {
        throw new Error('Token contract not found or invalid address');
      }
      
      if (error.message.includes('network')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      if (error.message.includes('user rejected')) {
        throw new Error(ERROR_MESSAGES.METAMASK_USER_REJECTED);
      }
      
      if (error.message.includes('insufficient funds')) {
        throw new Error(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
      }
      
      // Generic error with more context
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  /**
   * Check token allowance for a spender address
   * @param {string} tokenAddress - The token contract address
   * @param {string} spenderAddress - The spender address to check allowance for
   * @returns {Promise<Object>} Allowance information
   */
  async checkAllowance(tokenAddress, spenderAddress) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(spenderAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const owner = await this.signer.getAddress();

      const allowance = await tokenContract.allowance(owner, spenderAddress);
      
      // Get token decimals for proper formatting
      const decimals = await tokenContract.decimals();

      return {
        tokenAddress,
        owner,
        spender: spenderAddress,
        allowance: ethers.formatUnits(allowance, decimals),
        allowanceRaw: allowance.toString(),
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('❌ Error checking allowance:', error);
      throw error;
    }
  }

  /**
   * Get token balance for a specific address
   * @param {string} tokenAddress - The token contract address
   * @param {string} address - The address to check balance for (optional, defaults to connected wallet)
   * @returns {Promise<Object>} Balance information
   */
  async getTokenBalance(tokenAddress, address = null) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const targetAddress = address || await this.signer.getAddress();

      if (address && !ethers.isAddress(targetAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(targetAddress),
        tokenContract.decimals()
      ]);

      return {
        tokenAddress,
        address: targetAddress,
        balance: ethers.formatUnits(balance, decimals),
        balanceRaw: balance.toString(),
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('❌ Error getting token balance:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient token balance
   * @param {string} tokenAddress - The token contract address
   * @param {string} amount - The amount to check (in token units)
   * @returns {Promise<Object>} Balance check result
   */
  async checkSufficientBalance(tokenAddress, amount) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      const balanceInfo = await this.getTokenBalance(tokenAddress);
      const requiredAmount = ethers.parseUnits(amount, balanceInfo.decimals);
      const currentBalance = ethers.parseUnits(balanceInfo.balance, balanceInfo.decimals);

      const isSufficient = currentBalance >= requiredAmount;
      const shortfall = isSufficient ? ethers.parseUnits('0', balanceInfo.decimals) : requiredAmount - currentBalance;

      return {
        tokenAddress,
        requiredAmount: ethers.formatUnits(requiredAmount, balanceInfo.decimals),
        currentBalance: balanceInfo.balance,
        isSufficient,
        shortfall: ethers.formatUnits(shortfall, balanceInfo.decimals),
        shortfallRaw: shortfall.toString()
      };
    } catch (error) {
      console.error('❌ Error checking sufficient balance:', error);
      throw error;
    }
  }

  /**
   * Get token metadata (name, symbol, decimals) without balance
   * @param {string} tokenAddress - The token contract address
   * @returns {Promise<Object>} Token metadata
   */
  async getTokenMetadata(tokenAddress) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('❌ Error getting token metadata:', error);
      
      if (error.message.includes('execution reverted')) {
        throw new Error('Token contract not found or invalid address');
      }
      
      throw error;
    }
  }

  /**
   * Validate token address and check if it's a valid ERC-20 contract
   * @param {string} tokenAddress - The token contract address
   * @returns {Promise<boolean>} True if valid ERC-20 token
   */
  async validateToken(tokenAddress) {
    try {
      if (!ethers.isAddress(tokenAddress)) {
        return false;
      }

      // Try to get basic token info to verify it's a valid ERC-20
      await this.getTokenMetadata(tokenAddress);
      return true;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return false;
    }
  }

  /**
   * Estimate gas for token transfer
   * @param {string} tokenAddress - The token contract address
   * @param {string} recipient - The recipient address
   * @param {string} amount - The amount to transfer (in token units)
   * @returns {Promise<Object>} Gas estimation result
   */
  async estimateTransferGas(tokenAddress, recipient, amount) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(recipient)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      
      // Get token decimals for proper amount conversion
      const decimals = await tokenContract.decimals();
      
      // Convert amount to wei/smallest unit
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      // Estimate gas for transfer
      const estimatedGas = await tokenContract.transfer.estimateGas(recipient, amountInWei);
      
      // Get current gas price
      const gasPrice = await this.provider.getFeeData();
      
      // Calculate total cost
      const totalCost = estimatedGas * gasPrice.gasPrice;
      
      return {
        tokenAddress,
        recipient,
        amount,
        amountInWei: amountInWei.toString(),
        decimals: Number(decimals),
        estimatedGas: estimatedGas.toString(),
        gasPrice: gasPrice.gasPrice.toString(),
        gasPriceGwei: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
        totalCost: totalCost.toString(),
        totalCostEth: ethers.formatEther(totalCost),
        // Add 20% buffer for safety
        estimatedGasWithBuffer: (estimatedGas * 1.2).toString(),
        totalCostWithBuffer: (totalCost * 1.2).toString(),
        totalCostEthWithBuffer: ethers.formatEther(totalCost * 1.2)
      };
    } catch (error) {
      console.error('❌ Error estimating transfer gas:', error);
      
      // Enhanced error handling for gas estimation
      if (error.message.includes('insufficient funds')) {
        throw new Error(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
      }
      
      if (error.message.includes('execution reverted')) {
        throw new Error('Transfer would fail - check token balance and recipient address');
      }
      
      if (error.message.includes('network')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      if (error.message.includes('gas required exceeds allowance')) {
        throw new Error('Gas estimation failed - transaction may be too complex');
      }
      
      if (error.message.includes('always failing transaction')) {
        throw new Error('Transaction will always fail - check parameters');
      }
      
      if (error.message.includes('user rejected')) {
        throw new Error(ERROR_MESSAGES.METAMASK_USER_REJECTED);
      }
      
      // Network congestion handling
      if (error.message.includes('timeout') || error.message.includes('deadline')) {
        throw new Error('Network is congested - please try again later');
      }
      
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  /**
   * Get current gas price information
   * @returns {Promise<Object>} Gas price information
   */
  async getGasPrice() {
    try {
      if (!this.provider) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      const feeData = await this.provider.getFeeData();
      
      return {
        gasPrice: feeData.gasPrice.toString(),
        gasPriceGwei: ethers.formatUnits(feeData.gasPrice, 'gwei'),
        maxFeePerGas: feeData.maxFeePerGas?.toString() || null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || null,
        lastBaseFeePerGas: feeData.lastBaseFeePerGas?.toString() || null,
        // EIP-1559 support
        supportsEIP1559: !!feeData.maxFeePerGas
      };
    } catch (error) {
      console.error('❌ Error getting gas price:', error);
      throw error;
    }
  }

  /**
   * Calculate transaction cost based on gas limit and gas price
   * @param {string|number} gasLimit - Gas limit for the transaction
   * @param {string|number} gasPrice - Gas price in wei (optional, will fetch current if not provided)
   * @returns {Promise<Object>} Transaction cost information
   */
  async calculateTransactionCost(gasLimit, gasPrice = null) {
    try {
      if (!this.provider) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      // Convert gas limit to BigInt
      const gasLimitBN = BigInt(gasLimit);

      // Get current gas price if not provided
      let gasPriceBN;
      if (gasPrice) {
        gasPriceBN = BigInt(gasPrice);
      } else {
        const feeData = await this.provider.getFeeData();
        gasPriceBN = feeData.gasPrice || BigInt(0);
      }

      // Calculate total cost
      const totalCost = gasLimitBN * gasPriceBN;

      return {
        gasLimit: gasLimitBN.toString(),
        gasPrice: gasPriceBN.toString(),
        totalCost: totalCost.toString(),
        totalCostEth: ethers.formatEther(totalCost),
        gasPriceGwei: ethers.formatUnits(gasPriceBN, 'gwei')
      };
    } catch (error) {
      console.error('❌ Error calculating transaction cost:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for batch transfer operations
   * @param {string} tokenAddress - The token contract address
   * @param {Array} transfers - Array of transfer objects {recipient, amount}
   * @returns {Promise<Object>} Batch gas estimation
   */
  async estimateBatchTransferGas(tokenAddress, transfers) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      if (!Array.isArray(transfers) || transfers.length === 0) {
        throw new Error('Transfers array is required and cannot be empty');
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const decimals = await tokenContract.decimals();
      
      // Calculate total gas for all transfers
      let totalEstimatedGas = BigInt(0);
      const transferDetails = [];

      for (const transfer of transfers) {
        if (!ethers.isAddress(transfer.recipient)) {
          throw new Error(`Invalid recipient address: ${transfer.recipient}`);
        }

        const amountInWei = ethers.parseUnits(transfer.amount, decimals);
        const estimatedGas = await tokenContract.transfer.estimateGas(transfer.recipient, amountInWei);
        
        totalEstimatedGas = totalEstimatedGas + estimatedGas;
        
        transferDetails.push({
          recipient: transfer.recipient,
          amount: transfer.amount,
          amountInWei: amountInWei.toString(),
          estimatedGas: estimatedGas.toString()
        });
      }

      // Get gas price
      const gasPrice = await this.provider.getFeeData();
      const totalCost = totalEstimatedGas * gasPrice.gasPrice;

      return {
        tokenAddress,
        totalTransfers: transfers.length,
        totalEstimatedGas: totalEstimatedGas.toString(),
        gasPrice: gasPrice.gasPrice.toString(),
        gasPriceGwei: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
        totalCost: totalCost.toString(),
        totalCostEth: ethers.formatEther(totalCost),
        // Add 20% buffer for safety
        totalEstimatedGasWithBuffer: (totalEstimatedGas * 120n) / 100n,
        totalCostWithBuffer: (totalCost * 120n) / 100n,
        totalCostEthWithBuffer: ethers.formatEther((totalCost * 120n) / 100n),
        transferDetails,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('❌ Error estimating batch transfer gas:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient ETH for gas fees
   * @param {string|number} requiredGas - The required gas amount
   * @param {string|number} gasPrice - The gas price (optional)
   * @returns {Promise<Object>} ETH balance check result
   */
  async checkSufficientEthForGas(requiredGas, gasPrice = null) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      const account = await this.signer.getAddress();
      const ethBalance = await this.provider.getBalance(account);
      
      // Get gas price if not provided
      let gasPriceBN;
      if (gasPrice) {
        gasPriceBN = BigInt(gasPrice);
      } else {
        const feeData = await this.provider.getFeeData();
        gasPriceBN = feeData.gasPrice || BigInt(0);
      }

      const requiredGasBN = BigInt(requiredGas);
      const requiredCost = requiredGasBN * gasPriceBN;
      
      const isSufficient = ethBalance >= requiredCost;
      const shortfall = isSufficient ? BigInt(0) : requiredCost - ethBalance;

      return {
        account,
        ethBalance: ethBalance.toString(),
        ethBalanceEth: ethers.formatEther(ethBalance),
        requiredGas: requiredGasBN.toString(),
        gasPrice: gasPriceBN.toString(),
        gasPriceGwei: ethers.formatUnits(gasPriceBN, 'gwei'),
        requiredCost: requiredCost.toString(),
        requiredCostEth: ethers.formatEther(requiredCost),
        isSufficient,
        shortfall: shortfall.toString(),
        shortfallEth: ethers.formatEther(shortfall)
      };
    } catch (error) {
      console.error('❌ Error checking ETH balance for gas:', error);
      throw error;
    }
  }

  /**
   * Get recommended gas settings based on network conditions
   * @returns {Promise<Object>} Recommended gas settings
   */
  async getRecommendedGasSettings() {
    try {
      if (!this.provider) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      const feeData = await this.provider.getFeeData();
      const network = await this.provider.getNetwork();
      
      // Get recent block for base fee
      const latestBlock = await this.provider.getBlock('latest');
      const baseFeePerGas = latestBlock.baseFeePerGas;

      return {
        network: network.name,
        chainId: network.chainId,
        // Legacy gas price
        gasPrice: feeData.gasPrice.toString(),
        gasPriceGwei: ethers.formatUnits(feeData.gasPrice, 'gwei'),
        // EIP-1559 settings
        maxFeePerGas: feeData.maxFeePerGas?.toString() || null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || null,
        baseFeePerGas: baseFeePerGas?.toString() || null,
        // Gas limits from constants
        recommendedGasLimits: {
          transfer: GAS_LIMITS.TRANSFER,
          approve: GAS_LIMITS.APPROVE,
          batchTransfer: GAS_LIMITS.BATCH_TRANSFER,
          emergencyLimit: GAS_LIMITS.EMERGENCY_LIMIT
        },
        // EIP-1559 support
        supportsEIP1559: !!feeData.maxFeePerGas,
        // Network congestion indicator
        isCongested: baseFeePerGas ? baseFeePerGas.gt(ethers.parseUnits('50', 'gwei')) : false
      };
    } catch (error) {
      console.error('❌ Error getting recommended gas settings:', error);
      throw error;
    }
  }

  /**
   * Get provider and signer information
   * @returns {Object} Provider and signer info
   */
  getConnectionInfo() {
    return {
      hasSigner: !!this.signer,
      hasProvider: !!this.provider,
      signerAddress: this.signer ? 'Connected' : 'Not connected',
      network: this.provider?.network ? this.provider.network.name : 'Unknown'
    };
  }

  /**
   * Transfer tokens to a recipient
   * @param {string} tokenAddress - The token contract address
   * @param {string} recipient - The recipient address
   * @param {string} amount - The amount to transfer (in token units)
   * @param {Object} options - Optional parameters for the transfer
   * @returns {Promise<Object>} Transfer result with transaction details
   */
  async transferToken(tokenAddress, recipient, amount, options = {}) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(recipient)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      
      // Get token decimals for proper amount conversion
      const decimals = await tokenContract.decimals();
      
      // Convert amount to wei/smallest unit
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      // Check if user has sufficient balance
      const balanceCheck = await this.checkSufficientBalance(tokenAddress, amount);
      if (!balanceCheck.isSufficient) {
        throw new Error(`${ERROR_MESSAGES.INSUFFICIENT_BALANCE} - Required: ${amount}, Available: ${balanceCheck.currentBalance}`);
      }

      // Estimate gas with 20% buffer
      const gasEstimate = await this.estimateTransferGas(tokenAddress, recipient, amount);
      const gasLimit = BigInt(gasEstimate.estimatedGasWithBuffer);
      
      // Check if user has sufficient ETH for gas
      const ethCheck = await this.checkSufficientEthForGas(gasLimit, gasEstimate.gasPrice);
      if (!ethCheck.isSufficient) {
        throw new Error(`${ERROR_MESSAGES.INSUFFICIENT_GAS} - Required: ${ethCheck.requiredCostEth} ETH, Available: ${ethCheck.ethBalanceEth} ETH`);
      }

      // Prepare transaction
      const tx = await tokenContract.transfer.populateTransaction(recipient, amountInWei);
      
      // Add gas limit and price to transaction
      tx.gasLimit = gasLimit;
      tx.gasPrice = BigInt(gasEstimate.gasPrice);
      
      // Add custom options if provided
      if (options.maxFeePerGas) {
        tx.maxFeePerGas = BigInt(options.maxFeePerGas);
      }
      if (options.maxPriorityFeePerGas) {
        tx.maxPriorityFeePerGas = BigInt(options.maxPriorityFeePerGas);
      }

      // Send transaction
      console.log('🚀 Sending token transfer transaction...');
      const transaction = await this.signer.sendTransaction(tx);
      
      console.log('📝 Transaction sent:', {
        hash: transaction.hash,
        to: transaction.to,
        from: transaction.from,
        gasLimit: transaction.gasLimit?.toString(),
        gasPrice: transaction.gasPrice?.toString()
      });

      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await transaction.wait();
      
      console.log('✅ Transaction confirmed:', {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString()
      });

      // Get updated balance after transfer
      const newBalance = await this.getTokenBalance(tokenAddress);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        totalGasCost: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
        totalGasCostEth: ethers.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)),
        // Transfer details
        tokenAddress,
        recipient,
        amount,
        amountInWei: amountInWei.toString(),
        decimals: Number(decimals),
        // Balance updates
        previousBalance: balanceCheck.currentBalance,
        newBalance: newBalance.balance,
        // Transaction status
        status: receipt.status === 1 ? 'success' : 'failed',
        confirmations: receipt.confirmations
      };
    } catch (error) {
      console.error('❌ Error transferring tokens:', error);
      
      // Enhanced error handling for transfers
      if (error.message.includes('insufficient funds')) {
        throw new Error(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
      }
      
      if (error.message.includes('user rejected')) {
        throw new Error(ERROR_MESSAGES.METAMASK_USER_REJECTED);
      }
      
      if (error.message.includes('execution reverted')) {
        throw new Error('Transfer failed - check token balance and recipient address');
      }
      
      if (error.message.includes('network')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      if (error.message.includes('nonce too low')) {
        throw new Error('Transaction nonce error - please refresh and try again');
      }
      
      if (error.message.includes('replacement transaction underpriced')) {
        throw new Error('Gas price too low - please increase gas price and try again');
      }
      
      if (error.message.includes('already known')) {
        throw new Error('Transaction already submitted - please wait for confirmation');
      }
      
      if (error.message.includes('timeout') || error.message.includes('deadline')) {
        throw new Error('Transaction timeout - network may be congested');
      }
      
      if (error.message.includes('gas required exceeds allowance')) {
        throw new Error('Gas limit too low - please increase gas limit');
      }
      
      if (error.message.includes('always failing transaction')) {
        throw new Error('Transaction will always fail - check parameters');
      }
      
      // Generic error with context
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Transfer tokens with custom gas settings
   * @param {string} tokenAddress - The token contract address
   * @param {string} recipient - The recipient address
   * @param {string} amount - The amount to transfer (in token units)
   * @param {Object} gasSettings - Custom gas settings
   * @returns {Promise<Object>} Transfer result
   */
  async transferTokenWithCustomGas(tokenAddress, recipient, amount, gasSettings) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(recipient)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Check balance
      const balanceCheck = await this.checkSufficientBalance(tokenAddress, amount);
      if (!balanceCheck.isSufficient) {
        throw new Error(`${ERROR_MESSAGES.INSUFFICIENT_BALANCE} - Required: ${amount}, Available: ${balanceCheck.currentBalance}`);
      }

      // Prepare transaction with custom gas settings
      const tx = await tokenContract.transfer.populateTransaction(recipient, amountInWei);
      
      // Apply custom gas settings
      if (gasSettings.gasLimit) {
        tx.gasLimit = BigInt(gasSettings.gasLimit);
      }
      if (gasSettings.gasPrice) {
        tx.gasPrice = BigInt(gasSettings.gasPrice);
      }
      if (gasSettings.maxFeePerGas) {
        tx.maxFeePerGas = BigInt(gasSettings.maxFeePerGas);
      }
      if (gasSettings.maxPriorityFeePerGas) {
        tx.maxPriorityFeePerGas = BigInt(gasSettings.maxPriorityFeePerGas);
      }

      // Check ETH balance for gas
      const gasLimit = tx.gasLimit || BigInt(GAS_LIMITS.TRANSFER);
      const gasPrice = tx.gasPrice || (await this.provider.getFeeData()).gasPrice;
      const ethCheck = await this.checkSufficientEthForGas(gasLimit, gasPrice);
      
      if (!ethCheck.isSufficient) {
        throw new Error(`${ERROR_MESSAGES.INSUFFICIENT_GAS} - Required: ${ethCheck.requiredCostEth} ETH, Available: ${ethCheck.ethBalanceEth} ETH`);
      }

      // Send transaction
      const transaction = await this.signer.sendTransaction(tx);
      const receipt = await transaction.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        totalGasCost: (BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice)).toString(),
        totalGasCostEth: ethers.formatEther(BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice)),
        tokenAddress,
        recipient,
        amount,
        amountInWei: amountInWei.toString(),
        decimals: Number(decimals),
        status: receipt.status === 1 ? 'success' : 'failed',
        confirmations: receipt.confirmations
      };
    } catch (error) {
      console.error('❌ Error transferring tokens with custom gas:', error);
      throw error;
    }
  }

  /**
   * Get transaction status and details
   * @param {string} transactionHash - The transaction hash
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionStatus(transactionHash) {
    try {
      if (!this.provider) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return {
          hash: transactionHash,
          status: 'pending',
          confirmations: 0,
          blockNumber: null
        };
      }

      return {
        hash: receipt.transactionHash,
        status: receipt.status === 1 ? 'success' : 'failed',
        confirmations: receipt.confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        totalGasCost: (BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice)).toString(),
        totalGasCostEth: ethers.formatEther(BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice))
      };
    } catch (error) {
      console.error('❌ Error getting transaction status:', error);
      throw error;
    }
  }

  /**
   * Execute batch token transfers
   * @param {string} tokenAddress - The token contract address
   * @param {Array} transfers - Array of transfer objects {recipient, amount}
   * @param {Object} options - Batch transfer options
   * @returns {Promise<Object>} Batch transfer result
   */
  async batchTransfer(tokenAddress, transfers, options = {}) {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      }

      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      if (!Array.isArray(transfers) || transfers.length === 0) {
        throw new Error('Transfers array is required and cannot be empty');
      }

      // Default batch settings
      const batchSettings = {
        maxBatchSize: options.maxBatchSize || 50,
        batchDelayMs: options.batchDelayMs || 2000,
        maxRetries: options.maxRetries || 3,
        retryDelayMs: options.retryDelayMs || 5000,
        gasBuffer: options.gasBuffer || 1.2, // 20% buffer
        ...options
      };

      // Validate all transfers first
      const validationResults = await this.validateBatchTransfers(tokenAddress, transfers);
      if (!validationResults.isValid) {
        throw new Error(`Batch validation failed: ${validationResults.error}`);
      }

      // Split transfers into chunks
      const chunks = this.chunkArray(transfers, batchSettings.maxBatchSize);
      
      const batchResult = {
        tokenAddress,
        totalTransfers: transfers.length,
        totalChunks: chunks.length,
        successfulTransfers: [],
        failedTransfers: [],
        pendingTransfers: [],
        totalGasUsed: BigInt(0),
        totalCost: BigInt(0),
        startTime: Date.now(),
        endTime: null,
        status: 'processing'
      };

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        console.log(`🔄 Processing chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length} transfers`);

        // Process transfers in current chunk
        const chunkResults = await this.processChunk(
          tokenAddress, 
          chunk, 
          chunkIndex, 
          batchSettings,
          batchResult
        );

        // Add chunk results to batch result
        batchResult.successfulTransfers.push(...chunkResults.successful);
        batchResult.failedTransfers.push(...chunkResults.failed);
        batchResult.totalGasUsed = batchResult.totalGasUsed + chunkResults.totalGasUsed;
        batchResult.totalCost = batchResult.totalCost + chunkResults.totalCost;

        // Add delay between chunks (except for the last chunk)
        if (chunkIndex < chunks.length - 1) {
          console.log(`⏳ Waiting ${batchSettings.batchDelayMs}ms before next chunk...`);
          await this.delay(batchSettings.batchDelayMs);
        }
      }

      // Finalize batch result
      batchResult.endTime = Date.now();
      batchResult.duration = batchResult.endTime - batchResult.startTime;
      batchResult.status = batchResult.failedTransfers.length === 0 ? 'completed' : 'completed_with_errors';
      batchResult.successRate = (batchResult.successfulTransfers.length / batchResult.totalTransfers) * 100;
      batchResult.totalCostEth = ethers.formatEther(batchResult.totalCost);

      console.log(`✅ Batch transfer completed: ${batchResult.successfulTransfers.length}/${batchResult.totalTransfers} successful`);

      return batchResult;
    } catch (error) {
      console.error('❌ Batch transfer failed:', error);
      
      // Enhanced error handling for batch transfers
      if (error.message.includes('insufficient funds')) {
        throw new Error(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
      }
      
      if (error.message.includes('user rejected')) {
        throw new Error(ERROR_MESSAGES.METAMASK_USER_REJECTED);
      }
      
      if (error.message.includes('network')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      if (error.message.includes('timeout') || error.message.includes('deadline')) {
        throw new Error('Network timeout - please try again later');
      }
      
      if (error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded - please wait before retrying');
      }
      
      // Generic error with context
      throw new Error(`Batch transfer failed: ${error.message}`);
    }
  }

  /**
   * Validate batch transfers before execution
   * @param {string} tokenAddress - The token contract address
   * @param {Array} transfers - Array of transfer objects
   * @returns {Promise<Object>} Validation result
   */
  async validateBatchTransfers(tokenAddress, transfers) {
    try {
      // Check token balance
      const totalAmount = transfers.reduce((sum, transfer) => sum + parseFloat(transfer.amount), 0);
      const balanceCheck = await this.checkSufficientBalance(tokenAddress, totalAmount.toString());
      
      if (!balanceCheck.isSufficient) {
        return {
          isValid: false,
          error: `Insufficient token balance. Required: ${totalAmount}, Available: ${balanceCheck.currentBalance}`
        };
      }

      // Validate all addresses
      for (const transfer of transfers) {
        if (!ethers.isAddress(transfer.recipient)) {
          return {
            isValid: false,
            error: `Invalid recipient address: ${transfer.recipient}`
          };
        }

        const amount = parseFloat(transfer.amount);
        if (isNaN(amount) || amount <= 0) {
          return {
            isValid: false,
            error: `Invalid amount for address ${transfer.recipient}: ${transfer.amount}`
          };
        }
      }

      // Estimate total gas cost
      const gasEstimate = await this.estimateBatchTransferGas(tokenAddress, transfers);
      const ethCheck = await this.checkSufficientEthForGas(gasEstimate.totalEstimatedGasWithBuffer);

      if (!ethCheck.isSufficient) {
        return {
          isValid: false,
          error: `Insufficient ETH for gas. Required: ${ethCheck.requiredCostEth}, Available: ${ethCheck.ethBalanceEth}`
        };
      }

      return {
        isValid: true,
        totalAmount,
        estimatedGas: gasEstimate.totalEstimatedGasWithBuffer,
        estimatedCost: gasEstimate.totalCostWithBufferEth
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Process a single chunk of transfers
   * @param {string} tokenAddress - The token contract address
   * @param {Array} chunk - Array of transfers in this chunk
   * @param {number} chunkIndex - Index of the current chunk
   * @param {Object} batchSettings - Batch settings
   * @param {Object} batchResult - Overall batch result
   * @returns {Promise<Object>} Chunk processing result
   */
  async processChunk(tokenAddress, chunk, chunkIndex, batchSettings, batchResult) {
    const chunkResult = {
      successful: [],
      failed: [],
      totalGasUsed: BigInt(0),
      totalCost: BigInt(0)
    };

    // Process transfers in parallel within the chunk (with concurrency limit)
    const concurrencyLimit = Math.min(5, chunk.length); // Max 5 concurrent transfers per chunk
    const chunks = this.chunkArray(chunk, concurrencyLimit);

    for (const subChunk of chunks) {
      const promises = subChunk.map(transfer => 
        this.processSingleTransfer(tokenAddress, transfer, batchSettings)
      );

      const results = await Promise.allSettled(promises);

      // Process results
      results.forEach((result, index) => {
        const transfer = subChunk[index];
        
        if (result.status === 'fulfilled') {
          const transferResult = result.value;
          chunkResult.successful.push(transferResult);
          chunkResult.totalGasUsed = chunkResult.totalGasUsed + transferResult.gasUsed;
          chunkResult.totalCost = chunkResult.totalCost + transferResult.totalGasCost;
        } else {
          const failedTransfer = {
            recipient: transfer.recipient,
            amount: transfer.amount,
            error: result.reason.message || 'Transfer failed',
            timestamp: Date.now(),
            chunkIndex,
            transferIndex: index
          };
          chunkResult.failed.push(failedTransfer);
        }
      });

      // Small delay between sub-chunks to avoid overwhelming the network
      if (subChunk !== chunks[chunks.length - 1]) {
        await this.delay(500);
      }
    }

    return chunkResult;
  }

  /**
   * Process a single transfer with retry logic
   * @param {string} tokenAddress - The token contract address
   * @param {Object} transfer - Transfer object {recipient, amount}
   * @param {Object} batchSettings - Batch settings
   * @returns {Promise<Object>} Transfer result
   */
  async processSingleTransfer(tokenAddress, transfer, batchSettings) {
    let lastError = null;

    for (let attempt = 1; attempt <= batchSettings.maxRetries; attempt++) {
      try {
        console.log(`🔄 Transfer attempt ${attempt}/${batchSettings.maxRetries} for ${transfer.recipient}`);

        // Estimate gas for this transfer
        const gasEstimate = await this.estimateTransferGas(tokenAddress, transfer.recipient, transfer.amount);
        const gasLimit = BigInt(gasEstimate.estimatedGasWithBuffer);

        // Execute transfer
        const result = await this.transferToken(tokenAddress, transfer.recipient, transfer.amount, {
          gasLimit: gasLimit.toString(),
          gasPrice: gasEstimate.gasPrice
        });

        console.log(`✅ Transfer successful: ${transfer.recipient} - ${transfer.amount}`);
        return {
          ...result,
          recipient: transfer.recipient,
          amount: transfer.amount,
          attempt,
          gasUsed: BigInt(result.gasUsed),
          totalGasCost: BigInt(result.totalGasCost)
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ Transfer attempt ${attempt} failed for ${transfer.recipient}:`, error.message);

        // Don't retry for certain types of errors
        if (error.message.includes('insufficient funds') || 
            error.message.includes('user rejected') ||
            error.message.includes('execution reverted')) {
          break;
        }

        // Wait before retry (except for the last attempt)
        if (attempt < batchSettings.maxRetries) {
          console.log(`⏳ Waiting ${batchSettings.retryDelayMs}ms before retry...`);
          await this.delay(batchSettings.retryDelayMs);
        }
      }
    }

    // All attempts failed
    throw new Error(`Transfer failed after ${batchSettings.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Split array into chunks
   * @param {Array} array - Array to split
   * @param {number} chunkSize - Size of each chunk
   * @returns {Array} Array of chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get batch transfer progress
   * @param {Object} batchResult - Batch transfer result
   * @returns {Object} Progress information
   */
  getBatchProgress(batchResult) {
    if (!batchResult) {
      return { progress: 0, status: 'not_started' };
    }

    const completed = batchResult.successfulTransfers.length + batchResult.failedTransfers.length;
    const progress = (completed / batchResult.totalTransfers) * 100;

    return {
      progress: Math.min(progress, 100),
      status: batchResult.status,
      completed,
      total: batchResult.totalTransfers,
      successful: batchResult.successfulTransfers.length,
      failed: batchResult.failedTransfers.length,
      successRate: (batchResult.successfulTransfers.length / batchResult.totalTransfers) * 100
    };
  }

  /**
   * Cancel ongoing batch transfer
   * @param {Object} batchResult - Batch transfer result
   * @returns {Object} Cancellation result
   */
  cancelBatchTransfer(batchResult) {
    if (batchResult.status === 'completed' || batchResult.status === 'completed_with_errors') {
      return {
        cancelled: false,
        error: 'Batch transfer is already completed'
      };
    }

    batchResult.status = 'cancelled';
    batchResult.endTime = Date.now();
    batchResult.duration = batchResult.endTime - batchResult.startTime;

    return {
      cancelled: true,
      completedTransfers: batchResult.successfulTransfers.length,
      failedTransfers: batchResult.failedTransfers.length,
      pendingTransfers: batchResult.totalTransfers - (batchResult.successfulTransfers.length + batchResult.failedTransfers.length)
    };
  }
}

export default TokenService; 