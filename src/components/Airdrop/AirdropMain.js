import React, { useState, useEffect, useCallback } from 'react';
import { useWalletContext } from '../../contexts/WalletContext';
import TokenService from '../../utils/TokenService';
import CSVUpload from './CSVUpload';
import TransactionProgress from './TransactionProgress';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, CSV_LIMITS, VALIDATION_LIMITS } from '../../utils/constants';
import './AirdropMain.css';
import AddressValidator from '../../utils/AddressValidator';

/**
 * AirdropMain Component
 * Main interface for token airdrop functionality
 */
const AirdropMain = ({ className = '' }) => {
  // Wallet context
  const { account, isConnected, signer } = useWalletContext();
  
  // Token service instance
  const [tokenService, setTokenService] = useState(null);
  
  // Token selection state
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  
  // CSV and validation state
  const [csvData, setCsvData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Transfer configuration
  const [batchSize, setBatchSize] = useState(50);
  const [batchDelay, setBatchDelay] = useState(2000);
  const [maxRetries, setMaxRetries] = useState(3);
  const [gasBuffer, setGasBuffer] = useState(1.2);
  
  // Transfer execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  
  // Preview and estimation state
  const [gasEstimate, setGasEstimate] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Initialize token service when wallet connects
  useEffect(() => {
    if (signer) {
      setTokenService(new TokenService(signer));
    } else {
      setTokenService(null);
    }
  }, [signer]);

  /**
   * Handle token address input and validation
   * @param {string} address - Token contract address
   */
  const handleTokenAddressChange = async (address) => {
    setTokenAddress(address);
    setTokenInfo(null);
    setTokenError(null);
    setGasEstimate(null);
    setPreviewData(null);

    if (!address.trim()) return;

    if (!tokenService) {
      setTokenError(ERROR_MESSAGES.METAMASK_NOT_CONNECTED);
      return;
    }

    setIsLoadingToken(true);
    try {
      // Validate token address
      const isValid = await tokenService.validateToken(address);
      if (!isValid) {
        setTokenError('Invalid token contract address');
        return;
      }

      // Get token info
      const info = await tokenService.getTokenInfo(address);
      setTokenInfo(info);
      
      // Update preview if CSV data is available
      if (validationResults?.validAddresses?.length > 0) {
        await updatePreview(address, validationResults.validAddresses);
      }
    } catch (error) {
      console.error('❌ Error loading token info:', error);
      setTokenError(error.message);
    } finally {
      setIsLoadingToken(false);
    }
  };

  /**
   * Handle CSV file processing
   * @param {Object} fileData - Processed CSV data
   */
  const handleFileProcessed = useCallback((fileData) => {
    setCsvData(fileData);
    setCurrentStep(2);
  }, []);

  /**
   * Handle CSV validation completion
   * @param {Object} validation - Validation results
   */
  const handleValidationComplete = useCallback(async (validation) => {
    setValidationResults(validation);
    setIsValidating(false);

    if (validation.isValid && tokenAddress && tokenService) {
      await updatePreview(tokenAddress, validation.validAddresses);
    }
  }, [tokenAddress, tokenService]);

  /**
   * Update transfer preview with gas estimation
   * @param {string} tokenAddr - Token address
   * @param {Array} validAddresses - Valid addresses from CSV
   */
  const updatePreview = async (tokenAddr, validAddresses) => {
    if (!tokenService || !validAddresses?.length) return;

    setIsEstimating(true);
    try {
      // Prepare transfers array
      const transfers = validAddresses.map(row => ({
        recipient: row.normalizedAddress || row.address,
        amount: row.amount
      }));

      // Estimate gas for batch transfer
      const estimate = await tokenService.estimateBatchTransferGas(tokenAddr, transfers);
      setGasEstimate(estimate);

      // Check balances
      const totalAmount = validAddresses.reduce((sum, row) => sum + parseFloat(row.amount), 0);
      const balanceCheck = await tokenService.checkSufficientBalance(tokenAddr, totalAmount.toString());
      const ethCheck = await tokenService.checkSufficientEthForGas(estimate.totalEstimatedGasWithBuffer);

      setPreviewData({
        totalTransfers: validAddresses.length,
        totalAmount: totalAmount.toFixed(6),
        estimatedGas: estimate.totalEstimatedGasWithBuffer,
        estimatedCost: estimate.totalCostWithBufferEth,
        tokenBalance: balanceCheck.currentBalance,
        tokenBalanceSufficient: balanceCheck.isSufficient,
        ethBalance: ethCheck.ethBalanceEth,
        ethBalanceSufficient: ethCheck.isSufficient,
        transfers: transfers
      });
    } catch (error) {
      console.error('❌ Error updating preview:', error);
      setGasEstimate(null);
      setPreviewData(null);
    } finally {
      setIsEstimating(false);
    }
  };

  /**
   * Execute the airdrop
   */
  const executeAirdrop = async () => {
    if (!tokenService || !validationResults?.validAddresses?.length || !previewData) {
      setExecutionError('Missing required data for airdrop execution');
      return;
    }

    // Pre-flight validation
    const validationResult = await performPreFlightValidation();
    if (!validationResult.isValid) {
      setExecutionError(validationResult.error);
      return;
    }

    // User confirmation for large airdrops
    if (validationResults.validAddresses.length > 100) {
      const confirmed = window.confirm(
        `You are about to execute a large airdrop with ${validationResults.validAddresses.length} transfers.\n\n` +
        `Total amount: ${previewData.totalAmount} ${tokenInfo?.symbol}\n` +
        `Estimated cost: ${previewData.estimatedCost} ETH\n\n` +
        `Are you sure you want to proceed?`
      );
      
      if (!confirmed) {
        return;
      }
    }

    setIsExecuting(true);
    setExecutionError(null);
    setCurrentStep(3);

    try {
      // Prepare batch transfer options
      const batchOptions = {
        maxBatchSize: batchSize,
        batchDelayMs: batchDelay,
        maxRetries: maxRetries,
        gasBuffer: gasBuffer
      };

      // Execute batch transfer
      const result = await tokenService.batchTransfer(
        tokenAddress,
        previewData.transfers,
        batchOptions
      );

      setBatchResult(result);
      
      if (result.status === 'completed') {
        setCurrentStep(4);
      } else if (result.status === 'completed_with_errors') {
        setCurrentStep(4);
        setExecutionError(`Airdrop completed with ${result.failedTransfers.length} failed transfers`);
      }
    } catch (error) {
      console.error('❌ Airdrop execution failed:', error);
      setExecutionError(error.message);
      setCurrentStep(2);
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Perform pre-flight validation before executing airdrop
   * @returns {Promise<Object>} Validation result
   */
  const performPreFlightValidation = async () => {
    try {
      if (!tokenService || !validationResults?.validAddresses?.length || !previewData) {
        return {
          isValid: false,
          error: 'Missing required data for validation'
        };
      }

      // 1. Check token balance vs total airdrop amount
      const totalAmount = validationResults.validAddresses.reduce((sum, row) => sum + parseFloat(row.amount), 0);
      const balanceCheck = await tokenService.checkSufficientBalance(tokenAddress, totalAmount.toString());
      
      if (!balanceCheck.isSufficient) {
        return {
          isValid: false,
          error: `Insufficient token balance. Required: ${totalAmount.toFixed(6)} ${tokenInfo?.symbol}, Available: ${balanceCheck.currentBalance} ${tokenInfo?.symbol}`
        };
      }

      // 2. Validate gas fees vs ETH balance
      const ethCheck = await tokenService.checkSufficientEthForGas(previewData.estimatedGas);
      
      if (!ethCheck.isSufficient) {
        return {
          isValid: false,
          error: `Insufficient ETH for gas fees. Required: ${ethCheck.requiredCostEth} ETH, Available: ${ethCheck.ethBalanceEth} ETH`
        };
      }

      // 3. Confirm all addresses are valid
      const invalidAddresses = validationResults.validAddresses.filter(row => {
        const validation = AddressValidator.validateEthereumAddress(row.address);
        return !validation.isValid;
      });

      if (invalidAddresses.length > 0) {
        return {
          isValid: false,
          error: `Found ${invalidAddresses.length} invalid addresses in the list`
        };
      }

      // 4. Check for duplicate addresses
      const addresses = validationResults.validAddresses.map(row => row.address);
      const duplicateCheck = AddressValidator.detectDuplicates(addresses);
      
      if (duplicateCheck.hasDuplicates) {
        return {
          isValid: false,
          error: `Found ${duplicateCheck.duplicates.length} duplicate addresses in the list`
        };
      }

      // 5. Validate amounts are positive
      const invalidAmounts = validationResults.validAddresses.filter(row => {
        const amount = parseFloat(row.amount);
        return isNaN(amount) || amount <= 0;
      });

      if (invalidAmounts.length > 0) {
        return {
          isValid: false,
          error: `Found ${invalidAmounts.length} invalid amounts (must be positive numbers)`
        };
      }

      // 6. Check network connectivity
      try {
        await tokenService.provider.getNetwork();
      } catch (error) {
        return {
          isValid: false,
          error: 'Network connectivity issue - please check your connection'
        };
      }

      // 7. Validate token contract is still accessible
      try {
        await tokenService.validateToken(tokenAddress);
      } catch (error) {
        return {
          isValid: false,
          error: 'Token contract is no longer accessible - please verify the address'
        };
      }

      // 8. Check for reasonable gas prices (optional warning)
      const gasPrice = await tokenService.getGasPrice();
      const gasPriceGwei = parseFloat(gasPrice.gasPriceGwei);
      
      if (gasPriceGwei > 100) {
        console.warn('⚠️ High gas prices detected:', gasPriceGwei, 'gwei');
        // Don't fail, just warn
      }

      return {
        isValid: true,
        warnings: gasPriceGwei > 100 ? [`High gas prices detected: ${gasPriceGwei} gwei`] : []
      };
    } catch (error) {
      console.error('❌ Pre-flight validation error:', error);
      return {
        isValid: false,
        error: `Validation error: ${error.message}`
      };
    }
  };

  /**
   * Retry failed transfers
   * @param {Array} failedTransfers - Array of failed transfers
   */
  const handleRetryFailed = async (failedTransfers) => {
    if (!tokenService) return;

    setIsExecuting(true);
    setExecutionError(null);

    try {
      const batchOptions = {
        maxBatchSize: batchSize,
        batchDelayMs: batchDelay,
        maxRetries: maxRetries,
        gasBuffer: gasBuffer
      };

      const result = await tokenService.batchTransfer(
        tokenAddress,
        failedTransfers,
        batchOptions
      );

      // Update batch result with new successful transfers
      setBatchResult(prev => ({
        ...prev,
        successfulTransfers: [...prev.successfulTransfers, ...result.successfulTransfers],
        failedTransfers: result.failedTransfers,
        totalGasUsed: prev.totalGasUsed.add(result.totalGasUsed),
        totalCost: prev.totalCost.add(result.totalCost),
        successRate: ((prev.successfulTransfers.length + result.successfulTransfers.length) / prev.totalTransfers) * 100
      }));
    } catch (error) {
      console.error('❌ Retry failed:', error);
      setExecutionError(error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Cancel ongoing airdrop
   * @param {Object} currentBatchResult - Current batch result
   */
  const handleCancelAirdrop = (currentBatchResult) => {
    if (!tokenService) return;

    const cancelResult = tokenService.cancelBatchTransfer(currentBatchResult);
    if (cancelResult.cancelled) {
      setBatchResult(prev => ({ ...prev, status: 'cancelled' }));
      setCurrentStep(2);
    }
  };

  /**
   * Reset airdrop state
   */
  const handleReset = () => {
    setTokenAddress('');
    setTokenInfo(null);
    setTokenError(null);
    setCsvData(null);
    setValidationResults(null);
    setGasEstimate(null);
    setPreviewData(null);
    setBatchResult(null);
    setExecutionError(null);
    setCurrentStep(1);
  };

  // Check if wallet is connected
  if (!isConnected) {
    return (
      <div className={`airdrop-main-container ${className}`}>
        <div className="card">
          <div className="card-body text-center">
            <i className="fas fa-wallet text-muted mb-3" style={{ fontSize: '3rem' }}></i>
            <h5>Wallet Not Connected</h5>
            <p className="text-muted">Please connect your MetaMask wallet to start the airdrop process.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`airdrop-main-container ${className}`}>
      {/* Progress Steps */}
      <div className="progress-steps mb-4">
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Token & CSV</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Preview</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Execute</div>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Complete</div>
          </div>
        </div>
      </div>

      {/* Step 1: Token Selection and CSV Upload */}
      {currentStep === 1 && (
        <div className="step-content">
          <div className="row">
            {/* Token Selection */}
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-coins me-2"></i>
                    Token Selection
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Token Contract Address</label>
                    <input
                      type="text"
                      className={`form-control ${tokenError ? 'is-invalid' : ''}`}
                      placeholder="0x..."
                      value={tokenAddress}
                      onChange={(e) => handleTokenAddressChange(e.target.value)}
                      disabled={isLoadingToken}
                    />
                    {tokenError && (
                      <div className="invalid-feedback">{tokenError}</div>
                    )}
                  </div>

                  {isLoadingToken && (
                    <div className="text-center">
                      <div className="spinner-border spinner-border-sm me-2"></div>
                      Loading token information...
                    </div>
                  )}

                  {tokenInfo && (
                    <div className="token-info">
                      <div className="row">
                        <div className="col-6">
                          <small className="text-muted">Name</small>
                          <div className="fw-bold">{tokenInfo.name}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Symbol</small>
                          <div className="fw-bold">{tokenInfo.symbol}</div>
                        </div>
                      </div>
                      <div className="row mt-2">
                        <div className="col-6">
                          <small className="text-muted">Decimals</small>
                          <div className="fw-bold">{tokenInfo.decimals}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Your Balance</small>
                          <div className="fw-bold">{parseFloat(tokenInfo.balance).toFixed(6)} {tokenInfo.symbol}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CSV Upload */}
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-file-csv me-2"></i>
                    CSV Upload
                  </h6>
                </div>
                <div className="card-body">
                  <CSVUpload
                    onFileProcessed={handleFileProcessed}
                    onValidationComplete={handleValidationComplete}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="card mb-4">
            <div className="card-header">
              <button
                className="btn btn-link p-0"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              >
                <i className={`fas fa-chevron-${showAdvancedSettings ? 'up' : 'down'} me-2`}></i>
                Advanced Settings
              </button>
            </div>
            {showAdvancedSettings && (
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <label className="form-label">Batch Size</label>
                    <input
                      type="number"
                      className="form-control"
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                    <small className="text-muted">Transfers per batch</small>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Batch Delay (ms)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={batchDelay}
                      onChange={(e) => setBatchDelay(parseInt(e.target.value))}
                      min="0"
                      max="10000"
                    />
                    <small className="text-muted">Delay between batches</small>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Max Retries</label>
                    <input
                      type="number"
                      className="form-control"
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                    <small className="text-muted">Retry attempts per transfer</small>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Gas Buffer</label>
                    <input
                      type="number"
                      className="form-control"
                      value={gasBuffer}
                      onChange={(e) => setGasBuffer(parseFloat(e.target.value))}
                      min="1.0"
                      max="2.0"
                      step="0.1"
                    />
                    <small className="text-muted">Gas estimation buffer</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Preview and Confirmation */}
      {currentStep === 2 && (
        <div className="step-content">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="fas fa-eye me-2"></i>
                Transfer Preview
              </h6>
            </div>
            <div className="card-body">
              {isEstimating ? (
                <div className="text-center">
                  <div className="spinner-border me-2"></div>
                  Estimating gas costs...
                </div>
              ) : previewData ? (
                <div className="preview-data">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Transfer Summary</h6>
                      <div className="summary-item">
                        <span>Total Transfers:</span>
                        <span className="fw-bold">{previewData.totalTransfers}</span>
                      </div>
                      <div className="summary-item">
                        <span>Total Amount:</span>
                        <span className="fw-bold">{previewData.totalAmount} {tokenInfo?.symbol}</span>
                      </div>
                      <div className="summary-item">
                        <span>Estimated Gas:</span>
                        <span className="fw-bold">{previewData.estimatedGas}</span>
                      </div>
                      <div className="summary-item">
                        <span>Estimated Cost:</span>
                        <span className="fw-bold">{previewData.estimatedCost} ETH</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6>Balance Check</h6>
                      <div className={`summary-item ${previewData.tokenBalanceSufficient ? 'text-success' : 'text-danger'}`}>
                        <span>Token Balance:</span>
                        <span className="fw-bold">
                          {previewData.tokenBalance} {tokenInfo?.symbol}
                          {previewData.tokenBalanceSufficient ? ' ✅' : ' ❌'}
                        </span>
                      </div>
                      <div className={`summary-item ${previewData.ethBalanceSufficient ? 'text-success' : 'text-danger'}`}>
                        <span>ETH Balance:</span>
                        <span className="fw-bold">
                          {previewData.ethBalance} ETH
                          {previewData.ethBalanceSufficient ? ' ✅' : ' ❌'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Validation Warnings */}
                  {validationResults && (
                    <div className="mt-3">
                      <h6>Validation Status</h6>
                      <div className="row">
                        <div className="col-md-3">
                          <div className="text-center">
                            <div className={`badge ${validationResults.validAddresses.length > 0 ? 'bg-success' : 'bg-danger'} fs-6`}>
                              {validationResults.validAddresses.length}
                            </div>
                            <div className="small text-muted">Valid Addresses</div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-center">
                            <div className={`badge ${validationResults.invalidAddresses.length === 0 ? 'bg-success' : 'bg-warning'} fs-6`}>
                              {validationResults.invalidAddresses.length}
                            </div>
                            <div className="small text-muted">Invalid Addresses</div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-center">
                            <div className={`badge ${validationResults.duplicates.length === 0 ? 'bg-success' : 'bg-warning'} fs-6`}>
                              {validationResults.duplicates.length}
                            </div>
                            <div className="small text-muted">Duplicates</div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-center">
                            <div className="badge bg-info fs-6">
                              {validationResults.totalAmount.toFixed(2)}
                            </div>
                            <div className="small text-muted">Total Amount</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      className="btn btn-primary me-2"
                      onClick={executeAirdrop}
                      disabled={!previewData.tokenBalanceSufficient || !previewData.ethBalanceSufficient || isExecuting}
                    >
                      {isExecuting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Executing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-rocket me-2"></i>
                          Execute Airdrop
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setCurrentStep(1)}
                    >
                      <i className="fas fa-arrow-left me-2"></i>
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted">
                  <i className="fas fa-info-circle mb-2"></i>
                  <p>Please select a token and upload a valid CSV file to see the preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 & 4: Execution Progress and Results */}
      {(currentStep === 3 || currentStep === 4) && (
        <div className="step-content">
          <TransactionProgress
            batchResult={batchResult}
            onCancel={handleCancelAirdrop}
            onRetry={handleRetryFailed}
            showDetails={true}
          />

          {executionError && (
            <div className="alert alert-warning mt-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {executionError}
            </div>
          )}

          {currentStep === 4 && (
            <div className="mt-4">
              <button
                className="btn btn-success me-2"
                onClick={handleReset}
              >
                <i className="fas fa-plus me-2"></i>
                New Airdrop
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setCurrentStep(2)}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Preview
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AirdropMain; 