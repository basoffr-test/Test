import React, { useState, useEffect } from 'react';
import { NETWORKS } from '../../utils/constants';
import './TransactionProgress.css';

/**
 * TransactionProgress Component
 * Displays real-time progress for batch transfer operations
 */
const TransactionProgress = ({ 
  batchResult, 
  onCancel, 
  onRetry, 
  className = '',
  showDetails = true 
}) => {
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get current network info
  useEffect(() => {
    const getNetworkInfo = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const numericChainId = parseInt(chainId, 16);
          const network = Object.values(NETWORKS).find(net => net.chainId === numericChainId);
          setCurrentNetwork(network);
        } catch (error) {
          console.error('Failed to get network info:', error);
        }
      }
    };

    getNetworkInfo();
  }, []);

  // Auto-refresh progress
  useEffect(() => {
    if (!autoRefresh || !batchResult || batchResult.status === 'completed' || batchResult.status === 'completed_with_errors') {
      return;
    }

    const interval = setInterval(() => {
      // Trigger re-render to update progress
      // In a real implementation, you might want to poll the blockchain for updates
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, batchResult]);

  if (!batchResult) {
    return (
      <div className={`transaction-progress-container ${className}`}>
        <div className="card">
          <div className="card-body text-center">
            <i className="fas fa-info-circle text-muted mb-2"></i>
            <p className="text-muted mb-0">No transaction data available</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage(batchResult);
  const statusColor = getStatusColor(batchResult.status);
  const statusIcon = getStatusIcon(batchResult.status);

  /**
   * Get progress percentage
   * @param {Object} batchResult - Batch transfer result
   * @returns {number} Progress percentage
   */
  const getProgressPercentage = (batchResult) => {
    const completed = batchResult.successfulTransfers.length + batchResult.failedTransfers.length;
    return Math.min((completed / batchResult.totalTransfers) * 100, 100);
  };

  /**
   * Get status color
   * @param {string} status - Transaction status
   * @returns {string} Bootstrap color class
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'primary';
      case 'completed':
        return 'success';
      case 'completed_with_errors':
        return 'warning';
      case 'cancelled':
        return 'secondary';
      case 'failed':
        return 'danger';
      default:
        return 'info';
    }
  };

  /**
   * Get status icon
   * @param {string} status - Transaction status
   * @returns {string} FontAwesome icon class
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return 'fas fa-spinner fa-spin';
      case 'completed':
        return 'fas fa-check-circle';
      case 'completed_with_errors':
        return 'fas fa-exclamation-triangle';
      case 'cancelled':
        return 'fas fa-times-circle';
      case 'failed':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  /**
   * Format duration
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  const formatDuration = (duration) => {
    if (!duration) return '0s';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Get block explorer URL
   * @param {string} transactionHash - Transaction hash
   * @returns {string} Block explorer URL
   */
  const getBlockExplorerUrl = (transactionHash) => {
    if (!currentNetwork || !transactionHash) return null;
    return `${currentNetwork.blockExplorer}/tx/${transactionHash}`;
  };

  /**
   * Toggle transaction details
   * @param {string} transactionHash - Transaction hash
   */
  const toggleTransactionDetails = (transactionHash) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionHash)) {
      newExpanded.delete(transactionHash);
    } else {
      newExpanded.add(transactionHash);
    }
    setExpandedTransactions(newExpanded);
  };

  /**
   * Handle retry for failed transfers
   */
  const handleRetry = () => {
    if (onRetry && batchResult.failedTransfers.length > 0) {
      onRetry(batchResult.failedTransfers);
    }
  };

  /**
   * Handle cancel operation
   */
  const handleCancel = () => {
    if (onCancel && batchResult.status === 'processing') {
      onCancel(batchResult);
    }
  };

  return (
    <div className={`transaction-progress-container ${className}`}>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className={`${statusIcon} text-${statusColor} me-2`}></i>
            <h6 className="mb-0">Batch Transfer Progress</h6>
          </div>
          <div className="d-flex align-items-center">
            <div className="form-check form-switch me-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="autoRefresh">
                Auto-refresh
              </label>
            </div>
            {batchResult.status === 'processing' && onCancel && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {/* Overall Progress */}
          <div className="overall-progress mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold">Overall Progress</span>
              <span className="text-muted">{progress.toFixed(1)}%</span>
            </div>
            <div className="progress mb-2" style={{ height: '20px' }}>
              <div
                className={`progress-bar bg-${statusColor}`}
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {progress.toFixed(1)}%
              </div>
            </div>
            <div className="row text-center">
              <div className="col-md-3">
                <div className="text-success">
                  <h5>{batchResult.successfulTransfers.length}</h5>
                  <small>Successful</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-danger">
                  <h5>{batchResult.failedTransfers.length}</h5>
                  <small>Failed</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-info">
                  <h5>{batchResult.totalTransfers}</h5>
                  <small>Total</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-warning">
                  <h5>{formatDuration(batchResult.duration)}</h5>
                  <small>Duration</small>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Information */}
          <div className="batch-info mb-4">
            <div className="row">
              <div className="col-md-6">
                <div className="info-item">
                  <label className="text-muted small">Token Address:</label>
                  <div className="text-break">{batchResult.tokenAddress}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-item">
                  <label className="text-muted small">Total Gas Used:</label>
                  <div>{ethers.formatEther(batchResult.totalCost || 0)} ETH</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {batchResult.failedTransfers.length > 0 && onRetry && (
            <div className="mb-4">
              <button
                className="btn btn-warning"
                onClick={handleRetry}
              >
                <i className="fas fa-redo me-2"></i>
                Retry Failed Transfers ({batchResult.failedTransfers.length})
              </button>
            </div>
          )}

          {/* Transaction Details */}
          {showDetails && (
            <div className="transaction-details">
              <h6 className="mb-3">Transaction Details</h6>
              
              {/* Successful Transfers */}
              {batchResult.successfulTransfers.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-success">
                    <i className="fas fa-check-circle me-2"></i>
                    Successful Transfers ({batchResult.successfulTransfers.length})
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Recipient</th>
                          <th>Amount</th>
                          <th>Gas Used</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResult.successfulTransfers.map((transfer, index) => (
                          <tr key={index} className="table-success">
                            <td>
                              <div className="text-break">{transfer.recipient}</div>
                            </td>
                            <td>{transfer.amount}</td>
                            <td>{transfer.gasUsed?.toString() || 'N/A'}</td>
                            <td>
                              <span className="badge bg-success">Success</span>
                            </td>
                            <td>
                              {transfer.transactionHash && (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => toggleTransactionDetails(transfer.transactionHash)}
                                  >
                                    <i className="fas fa-eye"></i>
                                  </button>
                                  {getBlockExplorerUrl(transfer.transactionHash) && (
                                    <a
                                      href={getBlockExplorerUrl(transfer.transactionHash)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-outline-secondary btn-sm"
                                    >
                                      <i className="fas fa-external-link-alt"></i>
                                    </a>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Failed Transfers */}
              {batchResult.failedTransfers.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-danger">
                    <i className="fas fa-times-circle me-2"></i>
                    Failed Transfers ({batchResult.failedTransfers.length})
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Recipient</th>
                          <th>Amount</th>
                          <th>Error</th>
                          <th>Attempts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResult.failedTransfers.map((transfer, index) => (
                          <tr key={index} className="table-danger">
                            <td>
                              <div className="text-break">{transfer.recipient}</div>
                            </td>
                            <td>{transfer.amount}</td>
                            <td>
                              <div className="text-break small">{transfer.error}</div>
                            </td>
                            <td>{transfer.attempts || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Transaction Details Modal */}
              {batchResult.successfulTransfers.map((transfer, index) => (
                transfer.transactionHash && expandedTransactions.has(transfer.transactionHash) && (
                  <div key={index} className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Transaction Details</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => toggleTransactionDetails(transfer.transactionHash)}
                          ></button>
                        </div>
                        <div className="modal-body">
                          <div className="row">
                            <div className="col-md-6">
                              <strong>Transaction Hash:</strong>
                              <div className="text-break">{transfer.transactionHash}</div>
                            </div>
                            <div className="col-md-6">
                              <strong>Block Number:</strong>
                              <div>{transfer.blockNumber || 'Pending'}</div>
                            </div>
                          </div>
                          <div className="row mt-3">
                            <div className="col-md-6">
                              <strong>Gas Used:</strong>
                              <div>{transfer.gasUsed?.toString() || 'N/A'}</div>
                            </div>
                            <div className="col-md-6">
                              <strong>Gas Price:</strong>
                              <div>{transfer.effectiveGasPrice?.toString() || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="row mt-3">
                            <div className="col-md-6">
                              <strong>Total Cost:</strong>
                              <div>{transfer.totalGasCostEth || 'N/A'}</div>
                            </div>
                            <div className="col-md-6">
                              <strong>Confirmations:</strong>
                              <div>{transfer.confirmations || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          {getBlockExplorerUrl(transfer.transactionHash) && (
                            <a
                              href={getBlockExplorerUrl(transfer.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                            >
                              View on Block Explorer
                            </a>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => toggleTransactionDetails(transfer.transactionHash)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionProgress; 