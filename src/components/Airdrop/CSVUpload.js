import React, { useState, useRef, useCallback, useMemo } from 'react';
import { CSV_LIMITS, ERROR_MESSAGES, SUCCESS_MESSAGES, ALLOWED_FILE_EXTENSIONS } from '../../utils/constants';
import AddressValidator from '../../utils/AddressValidator';
import './CSVUpload.css';

/**
 * CSVUpload Component
 * Handles CSV file upload with drag & drop, validation, and parsing
 * Optimized for large files with chunked processing and virtual scrolling
 */
const CSVUpload = ({ onFileProcessed, onValidationComplete, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [validationResults, setValidationResults] = useState(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [processingChunk, setProcessingChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [virtualScrollStart, setVirtualScrollStart] = useState(0);
  const [virtualScrollEnd, setVirtualScrollEnd] = useState(50);
  const fileInputRef = useRef(null);
  const validationTimeoutRef = useRef(null);

  // Performance constants
  const CHUNK_SIZE = 1000; // Process 1000 addresses per chunk
  const VIRTUAL_SCROLL_ITEM_HEIGHT = 60; // Height of each table row
  const VIRTUAL_SCROLL_VISIBLE_ITEMS = 50; // Number of visible items
  const VALIDATION_DEBOUNCE_MS = 500; // Debounce validation by 500ms

  /**
   * Validate file type and size
   * @param {File} file - The file to validate
   * @returns {Object} Validation result
   */
  const validateFile = (file) => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
      };
    }

    // Check file size (convert to MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > CSV_LIMITS.MAX_FILE_SIZE_MB) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.CSV_FILE_TOO_LARGE
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.CSV_EMPTY_FILE
      };
    }

    return { isValid: true };
  };

  /**
   * Parse CSV file content with chunked processing for large files
   * @param {string} content - CSV file content
   * @returns {Array} Parsed CSV data
   */
  const parseCSV = (content) => {
    try {
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
      
      // Validate headers
      const requiredHeaders = ['address', 'amount'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue; // Skip empty lines
        
        const values = line.split(',').map(value => value.trim());
        
        if (values.length !== headers.length) {
          throw new Error(`Invalid CSV format at line ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
        }

        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        data.push({
          ...row,
          lineNumber: i + 1 // Add line number for reference
        });
      }

      // Validate data limits
      if (data.length > CSV_LIMITS.MAX_ADDRESSES) {
        throw new Error(ERROR_MESSAGES.CSV_TOO_MANY_ADDRESSES);
      }

      if (data.length < CSV_LIMITS.MIN_ADDRESSES) {
        throw new Error(`CSV must contain at least ${CSV_LIMITS.MIN_ADDRESSES} address`);
      }

      return data;
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  };

  /**
   * Process CSV data in chunks for better performance
   * @param {Array} data - Parsed CSV data
   * @returns {Promise<Object>} Validation result
   */
  const processCSVInChunks = async (data) => {
    const chunks = chunkArray(data, CHUNK_SIZE);
    setTotalChunks(chunks.length);
    
    const allValidAddresses = [];
    const allInvalidAddresses = [];
    const allDuplicates = [];
    let totalAmount = 0;

    for (let i = 0; i < chunks.length; i++) {
      setProcessingChunk(i + 1);
      
      const chunk = chunks[i];
      const addresses = chunk.map(row => row.address);
      
      // Process chunk with AddressValidator
      const batchValidation = AddressValidator.batchValidate(addresses);
      
      // Process each row with validation results
      chunk.forEach((row, chunkIndex) => {
        const globalIndex = i * CHUNK_SIZE + chunkIndex;
        const addressValidation = batchValidation.valid.find(v => v.index === chunkIndex) ||
                                  batchValidation.invalid.find(v => v.index === chunkIndex);

        if (addressValidation && addressValidation.isValid) {
          const amount = parseFloat(row.amount);
          
          if (isNaN(amount) || amount <= 0) {
            allInvalidAddresses.push({
              ...row,
              reason: 'Invalid amount',
              validation: addressValidation
            });
          } else if (addressValidation.isDuplicate) {
            allDuplicates.push({
              ...row,
              validation: addressValidation
            });
          } else {
            allValidAddresses.push({
              ...row,
              validation: addressValidation,
              normalizedAddress: addressValidation.checksumAddress
            });
            totalAmount += amount;
          }
        } else {
          allInvalidAddresses.push({
            ...row,
            reason: addressValidation?.error || 'Invalid address',
            validation: addressValidation
          });
        }
      });

      // Small delay to prevent UI blocking
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return {
      isValid: allValidAddresses.length > 0,
      totalAddresses: data.length,
      validAddresses: allValidAddresses,
      invalidAddresses: allInvalidAddresses,
      duplicates: allDuplicates,
      totalAmount: totalAmount,
      summary: {
        total: data.length,
        valid: allValidAddresses.length,
        invalid: allInvalidAddresses.length,
        duplicates: allDuplicates.length
      }
    };
  };

  /**
   * Split array into chunks
   * @param {Array} array - Array to split
   * @param {number} chunkSize - Size of each chunk
   * @returns {Array} Array of chunks
   */
  const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  /**
   * Debounced validation function
   * @param {Array} data - Data to validate
   */
  const debouncedValidation = useCallback((data) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(async () => {
      try {
        setIsValidating(true);
        const result = await processCSVInChunks(data);
        setValidationResults(result);
        
        if (result.isValid) {
          setSuccess(SUCCESS_MESSAGES.CSV_UPLOADED);
          setEditableData([...result.validAddresses]); // Create editable copy
          
          if (onValidationComplete) {
            onValidationComplete(result);
          }
        } else {
          setError('No valid addresses found in CSV');
        }
      } catch (error) {
        setError(`Validation error: ${error.message}`);
      } finally {
        setIsValidating(false);
      }
    }, VALIDATION_DEBOUNCE_MS);
  }, [onValidationComplete]);

  /**
   * Validate parsed CSV data using AddressValidator with chunked processing
   * @param {Array} data - Parsed CSV data
   * @returns {Promise<Object>} Validation result
   */
  const validateParsedData = async (data) => {
    try {
      // For small datasets, use immediate validation
      if (data.length <= CHUNK_SIZE) {
        return await processCSVInChunks(data);
      }
      
      // For large datasets, use debounced validation
      debouncedValidation(data);
      
      // Return a placeholder result while processing
      return {
        isValid: false,
        processing: true,
        totalAddresses: data.length
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error.message}`
      };
    }
  };

  /**
   * Process uploaded file
   * @param {File} file - The file to process
   */
  const processFile = async (file) => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      setValidationResults(null);
      setEditableData(null);
      setUploadProgress(0);
      setProcessingChunk(0);
      setTotalChunks(0);

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      // Update file info
      setFileName(file.name);
      setFileSize(file.size);
      setUploadProgress(25);

      // Read file content
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          setUploadProgress(50);
          
          const content = event.target.result;
          const parsedData = parseCSV(content);
          
          setUploadProgress(75);

          // Validate parsed data
          const validationResult = await validateParsedData(parsedData);
          
          setUploadProgress(100);
          
          if (validationResult.processing) {
            // Large file is being processed in background
            setSuccess('Large file detected - processing in background...');
          } else if (validationResult.isValid) {
            setSuccess(SUCCESS_MESSAGES.CSV_UPLOADED);
            setValidationResults(validationResult);
            setEditableData([...validationResult.validAddresses]); // Create editable copy
            
            if (onFileProcessed) {
              onFileProcessed({
                fileName: file.name,
                fileSize: file.size,
                data: parsedData,
                validation: validationResult
              });
            }
            if (onValidationComplete) {
              onValidationComplete(validationResult);
            }
          } else {
            setError(validationResult.error);
            setValidationResults(validationResult);
          }
        } catch (error) {
          setError(error.message);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setIsProcessing(false);
      };

      reader.readAsText(file);
    } catch (error) {
      setError(error.message);
      setIsProcessing(false);
    }
  };

  /**
   * Handle editing of address data with debounced validation
   * @param {number} index - Index of the address to edit
   * @param {string} field - Field to edit ('address' or 'amount')
   * @param {string} value - New value
   */
  const handleEditAddress = (index, field, value) => {
    if (!editableData) return;

    const updatedData = [...editableData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value
    };

    setEditableData(updatedData);

    // Debounced re-validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      handleRevalidate(updatedData);
    }, VALIDATION_DEBOUNCE_MS);
  };

  /**
   * Remove address from editable data
   * @param {number} index - Index of the address to remove
   */
  const handleRemoveAddress = (index) => {
    if (!editableData) return;

    const updatedData = editableData.filter((_, i) => i !== index);
    setEditableData(updatedData);
    
    // Immediate re-validation for removal
    handleRevalidate(updatedData);
  };

  /**
   * Re-validate edited data
   * @param {Array} data - Data to validate (optional, uses editableData if not provided)
   */
  const handleRevalidate = async (data = null) => {
    const dataToValidate = data || editableData;
    if (!dataToValidate) return;

    try {
      setIsValidating(true);
      setError(null);

      // Re-validate the edited data
      const addresses = dataToValidate.map(row => row.address);
      const batchValidation = AddressValidator.batchValidate(addresses);

      const validationResult = {
        isValid: batchValidation.valid.length > 0,
        totalAddresses: dataToValidate.length,
        validAddresses: [],
        invalidAddresses: [],
        duplicates: [],
        totalAmount: 0,
        summary: batchValidation.summary
      };

      // Process each row
      dataToValidate.forEach((row, index) => {
        const addressValidation = batchValidation.valid.find(v => v.index === index) ||
                                  batchValidation.invalid.find(v => v.index === index);

        if (addressValidation && addressValidation.isValid) {
          const amount = parseFloat(row.amount);
          
          if (isNaN(amount) || amount <= 0) {
            validationResult.invalidAddresses.push({
              ...row,
              reason: 'Invalid amount',
              validation: addressValidation
            });
          } else if (addressValidation.isDuplicate) {
            validationResult.duplicates.push({
              ...row,
              validation: addressValidation
            });
          } else {
            validationResult.validAddresses.push({
              ...row,
              validation: addressValidation,
              normalizedAddress: addressValidation.checksumAddress
            });
            validationResult.totalAmount += amount;
          }
        } else {
          validationResult.invalidAddresses.push({
            ...row,
            reason: addressValidation?.error || 'Invalid address',
            validation: addressValidation
          });
        }
      });

      setValidationResults(validationResult);
      
      if (validationResult.isValid) {
        setSuccess('Data re-validated successfully');
        if (onValidationComplete) {
          onValidationComplete(validationResult);
        }
      } else {
        setError('Some addresses are still invalid');
      }
    } catch (error) {
      setError(`Re-validation error: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Export clean address list
   */
  const handleExportClean = () => {
    if (!validationResults || !validationResults.validAddresses.length) {
      setError('No valid addresses to export');
      return;
    }

    try {
      const csvContent = [
        'address,amount',
        ...validationResults.validAddresses.map(row => 
          `${row.normalizedAddress || row.address},${row.amount}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clean_${fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Clean address list exported successfully');
    } catch (error) {
      setError('Failed to export clean address list');
    }
  };

  /**
   * Handle file input change
   * @param {Event} event - File input change event
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  /**
   * Handle drag over event
   * @param {Event} event - Drag over event
   */
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  /**
   * Handle drag leave event
   * @param {Event} event - Drag leave event
   */
  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  /**
   * Handle drop event
   * @param {Event} event - Drop event
   */
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  /**
   * Handle click on upload area
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Clear uploaded file
   */
  const handleClear = () => {
    setFileName('');
    setFileSize(0);
    setError(null);
    setSuccess(null);
    setValidationResults(null);
    setEditableData(null);
    setUploadProgress(0);
    setProcessingChunk(0);
    setTotalChunks(0);
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle virtual scroll for large address lists
   * @param {Event} event - Scroll event
   */
  const handleVirtualScroll = (event) => {
    const scrollTop = event.target.scrollTop;
    const startIndex = Math.floor(scrollTop / VIRTUAL_SCROLL_ITEM_HEIGHT);
    const endIndex = Math.min(
      startIndex + VIRTUAL_SCROLL_VISIBLE_ITEMS,
      editableData?.length || 0
    );
    
    setVirtualScrollStart(startIndex);
    setVirtualScrollEnd(endIndex);
  };

  /**
   * Get visible items for virtual scrolling
   */
  const visibleItems = useMemo(() => {
    if (!editableData) return [];
    
    return editableData.slice(virtualScrollStart, virtualScrollEnd).map((item, index) => ({
      ...item,
      virtualIndex: virtualScrollStart + index
    }));
  }, [editableData, virtualScrollStart, virtualScrollEnd]);

  /**
   * Calculate total height for virtual scrolling
   */
  const totalHeight = useMemo(() => {
    return (editableData?.length || 0) * VIRTUAL_SCROLL_ITEM_HEIGHT;
  }, [editableData]);

  /**
   * Calculate offset for virtual scrolling
   */
  const offsetY = useMemo(() => {
    return virtualScrollStart * VIRTUAL_SCROLL_ITEM_HEIGHT;
  }, [virtualScrollStart]);

  return (
    <div className={`csv-upload-container ${className}`}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Upload Area */}
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        {isProcessing ? (
          <div className="upload-processing">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Processing...</span>
            </div>
            <p className="mt-2 mb-0">Processing CSV file...</p>
            {totalChunks > 0 && (
              <p className="text-muted small">
                Processing chunk {processingChunk} of {totalChunks}
              </p>
            )}
            <div className="progress mt-2">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadProgress}%` }}
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {uploadProgress}%
              </div>
            </div>
          </div>
        ) : fileName ? (
          <div className="upload-success">
            <i className="fas fa-check-circle text-success mb-2"></i>
            <h6 className="mb-1">{fileName}</h6>
            <p className="text-muted mb-2">
              {(fileSize / 1024).toFixed(2)} KB
            </p>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <i className="fas fa-cloud-upload-alt mb-3"></i>
            <h5>Upload CSV File</h5>
            <p className="text-muted">
              Drag and drop your CSV file here, or click to browse
            </p>
            <p className="text-muted small">
              Supported formats: {ALLOWED_FILE_EXTENSIONS.join(', ')}<br />
              Max file size: {CSV_LIMITS.MAX_FILE_SIZE_MB}MB<br />
              Max addresses: {CSV_LIMITS.MAX_ADDRESSES}
            </p>
            <button className="btn btn-primary">
              Choose File
            </button>
          </div>
        )}
      </div>

      {/* Validation Results */}
      {validationResults && (
        <div className="validation-results mt-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Validation Results</h6>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => setShowValidationDetails(!showValidationDetails)}
                >
                  {showValidationDetails ? 'Hide' : 'Show'} Details
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={handleExportClean}
                  disabled={!validationResults.validAddresses.length}
                >
                  Export Clean
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="text-center">
                    <h4 className="text-success">{validationResults.validAddresses.length}</h4>
                    <small className="text-muted">Valid</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <h4 className="text-danger">{validationResults.invalidAddresses.length}</h4>
                    <small className="text-muted">Invalid</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <h4 className="text-warning">{validationResults.duplicates.length}</h4>
                    <small className="text-muted">Duplicates</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <h4 className="text-info">{validationResults.totalAmount.toFixed(2)}</h4>
                    <small className="text-muted">Total Amount</small>
                  </div>
                </div>
              </div>

              {showValidationDetails && (
                <div className="mt-3">
                  {/* Valid Addresses with Virtual Scrolling */}
                  {validationResults.validAddresses.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-success">Valid Addresses ({validationResults.validAddresses.length})</h6>
                      
                      {editableData && editableData.length > 100 ? (
                        // Virtual scrolling for large lists
                        <div 
                          className="virtual-scroll-container"
                          style={{ height: '400px', overflow: 'auto' }}
                          onScroll={handleVirtualScroll}
                        >
                          <div style={{ height: totalHeight, position: 'relative' }}>
                            <div style={{ transform: `translateY(${offsetY}px)` }}>
                              <div className="table-responsive">
                                <table className="table table-sm">
                                  <thead>
                                    <tr>
                                      <th>Line</th>
                                      <th>Address</th>
                                      <th>Amount</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {visibleItems.map((row) => (
                                      <tr key={row.virtualIndex}>
                                        <td>{row.lineNumber}</td>
                                        <td>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={row.address}
                                            onChange={(e) => handleEditAddress(row.virtualIndex, 'address', e.target.value)}
                                          />
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            value={row.amount}
                                            onChange={(e) => handleEditAddress(row.virtualIndex, 'amount', e.target.value)}
                                          />
                                        </td>
                                        <td>
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleRemoveAddress(row.virtualIndex)}
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Regular table for small lists
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Line</th>
                                <th>Address</th>
                                <th>Amount</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {editableData?.map((row, index) => (
                                <tr key={index}>
                                  <td>{row.lineNumber}</td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={row.address}
                                      onChange={(e) => handleEditAddress(index, 'address', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={row.amount}
                                      onChange={(e) => handleEditAddress(index, 'amount', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleRemoveAddress(index)}
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleRevalidate()}
                        disabled={validationResults.processing}
                      >
                        {validationResults.processing ? 'Re-validating...' : 'Re-validate'}
                      </button>
                    </div>
                  )}

                  {/* Invalid Addresses */}
                  {validationResults.invalidAddresses.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-danger">Invalid Addresses ({validationResults.invalidAddresses.length})</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Line</th>
                              <th>Address</th>
                              <th>Amount</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validationResults.invalidAddresses.map((row, index) => (
                              <tr key={index}>
                                <td>{row.lineNumber}</td>
                                <td className="text-danger">{row.address}</td>
                                <td>{row.amount}</td>
                                <td className="text-danger">{row.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Duplicates */}
                  {validationResults.duplicates.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-warning">Duplicate Addresses ({validationResults.duplicates.length})</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Line</th>
                              <th>Address</th>
                              <th>Amount</th>
                              <th>First Occurrence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validationResults.duplicates.map((row, index) => (
                              <tr key={index}>
                                <td>{row.lineNumber}</td>
                                <td className="text-warning">{row.address}</td>
                                <td>{row.amount}</td>
                                <td>Line {row.validation?.firstOccurrence + 2}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="alert alert-success mt-3" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </div>
      )}
    </div>
  );
};

export default CSVUpload; 