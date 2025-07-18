import { ethers } from 'ethers';
import { ERROR_MESSAGES, ETHEREUM_ADDRESS_REGEX } from './constants';

/**
 * AddressValidator - Handles Ethereum address validation and processing
 * Provides methods for address validation, checksum validation, and duplicate detection
 */
class AddressValidator {
  /**
   * Validate a single Ethereum address
   * @param {string} address - The address to validate
   * @returns {Object} Validation result
   */
  static validateEthereumAddress(address) {
    try {
      if (!address || typeof address !== 'string') {
        return {
          isValid: false,
          address: address,
          error: 'Address is required and must be a string'
        };
      }

      // Trim whitespace
      const trimmedAddress = address.trim();

      // Check if empty
      if (trimmedAddress === '') {
        return {
          isValid: false,
          address: address,
          error: 'Address cannot be empty'
        };
      }

      // Check length
      if (trimmedAddress.length !== 42) {
        return {
          isValid: false,
          address: address,
          error: `Invalid address length. Expected 42 characters, got ${trimmedAddress.length}`
        };
      }

      // Check format with regex
      if (!ETHEREUM_ADDRESS_REGEX.test(trimmedAddress)) {
        return {
          isValid: false,
          address: address,
          error: 'Invalid address format. Must start with 0x followed by 40 hexadecimal characters'
        };
      }

      // Use ethers.js for advanced validation
      if (!ethers.isAddress(trimmedAddress)) {
        return {
          isValid: false,
          address: address,
          error: 'Invalid Ethereum address format'
        };
      }

      // Get checksum address
      let checksumAddress;
      try {
        checksumAddress = ethers.getAddress(trimmedAddress);
      } catch (error) {
        return {
          isValid: false,
          address: address,
          error: 'Invalid checksum address'
        };
      }

      // Check if it's a zero address
      if (checksumAddress === ethers.ZeroAddress) {
        return {
          isValid: false,
          address: address,
          error: 'Zero address (0x0000...0000) is not allowed'
        };
      }

      return {
        isValid: true,
        address: address,
        checksumAddress: checksumAddress,
        isChecksumValid: checksumAddress === trimmedAddress,
        isZeroAddress: false
      };
    } catch (error) {
      return {
        isValid: false,
        address: address,
        error: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Validate and normalize an address (return checksum version)
   * @param {string} address - The address to validate and normalize
   * @returns {Object} Validation and normalization result
   */
  static validateAndNormalize(address) {
    const validation = this.validateEthereumAddress(address);
    
    if (!validation.isValid) {
      return validation;
    }

    return {
      ...validation,
      normalizedAddress: validation.checksumAddress
    };
  }

  /**
   * Check if address is a contract address (basic check)
   * @param {string} address - The address to check
   * @param {Object} provider - Ethers provider instance
   * @returns {Promise<Object>} Contract check result
   */
  static async isContractAddress(address, provider) {
    try {
      if (!provider) {
        throw new Error('Provider is required for contract address check');
      }

      const validation = this.validateEthereumAddress(address);
      if (!validation.isValid) {
        return {
          isContract: false,
          address: address,
          error: validation.error
        };
      }

      const code = await provider.getCode(validation.checksumAddress);
      const isContract = code !== '0x';

      return {
        isContract: isContract,
        address: address,
        checksumAddress: validation.checksumAddress,
        codeLength: code.length - 2 // Subtract '0x' prefix
      };
    } catch (error) {
      return {
        isContract: false,
        address: address,
        error: `Contract check error: ${error.message}`
      };
    }
  }

  /**
   * Detect duplicates in an array of addresses
   * @param {Array} addresses - Array of addresses to check
   * @returns {Object} Duplicate detection result
   */
  static detectDuplicates(addresses) {
    try {
      if (!Array.isArray(addresses)) {
        return {
          hasDuplicates: false,
          duplicates: [],
          uniqueAddresses: [],
          error: 'Input must be an array of addresses'
        };
      }

      const seen = new Map(); // Map to track first occurrence
      const duplicates = [];
      const uniqueAddresses = [];

      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const validation = this.validateEthereumAddress(address);

        if (!validation.isValid) {
          continue; // Skip invalid addresses
        }

        const normalizedAddress = validation.checksumAddress.toLowerCase();

        if (seen.has(normalizedAddress)) {
          // Found duplicate
          const firstOccurrence = seen.get(normalizedAddress);
          duplicates.push({
            address: address,
            checksumAddress: validation.checksumAddress,
            firstOccurrence: firstOccurrence.index,
            duplicateOccurrence: i,
            originalAddress: firstOccurrence.address
          });
        } else {
          // First time seeing this address
          seen.set(normalizedAddress, {
            address: address,
            checksumAddress: validation.checksumAddress,
            index: i
          });
          uniqueAddresses.push({
            address: address,
            checksumAddress: validation.checksumAddress,
            index: i
          });
        }
      }

      return {
        hasDuplicates: duplicates.length > 0,
        duplicates: duplicates,
        uniqueAddresses: uniqueAddresses,
        totalAddresses: addresses.length,
        validAddresses: uniqueAddresses.length + duplicates.length,
        invalidAddresses: addresses.length - (uniqueAddresses.length + duplicates.length)
      };
    } catch (error) {
      return {
        hasDuplicates: false,
        duplicates: [],
        uniqueAddresses: [],
        error: `Duplicate detection error: ${error.message}`
      };
    }
  }

  /**
   * Batch validate multiple addresses
   * @param {Array} addresses - Array of addresses to validate
   * @returns {Object} Batch validation result
   */
  static batchValidate(addresses) {
    try {
      if (!Array.isArray(addresses)) {
        return {
          valid: [],
          invalid: [],
          duplicates: [],
          summary: {
            total: 0,
            valid: 0,
            invalid: 0,
            duplicates: 0
          },
          error: 'Input must be an array of addresses'
        };
      }

      const valid = [];
      const invalid = [];
      const seen = new Set();

      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const validation = this.validateEthereumAddress(address);

        if (validation.isValid) {
          const normalizedAddress = validation.checksumAddress.toLowerCase();
          
          if (seen.has(normalizedAddress)) {
            // This is a duplicate
            valid.push({
              ...validation,
              index: i,
              isDuplicate: true
            });
          } else {
            // First occurrence
            seen.add(normalizedAddress);
            valid.push({
              ...validation,
              index: i,
              isDuplicate: false
            });
          }
        } else {
          invalid.push({
            ...validation,
            index: i
          });
        }
      }

      // Separate duplicates
      const duplicates = valid.filter(item => item.isDuplicate);
      const uniqueValid = valid.filter(item => !item.isDuplicate);

      return {
        valid: uniqueValid,
        invalid: invalid,
        duplicates: duplicates,
        summary: {
          total: addresses.length,
          valid: uniqueValid.length,
          invalid: invalid.length,
          duplicates: duplicates.length
        }
      };
    } catch (error) {
      return {
        valid: [],
        invalid: [],
        duplicates: [],
        summary: {
          total: 0,
          valid: 0,
          invalid: 0,
          duplicates: 0
        },
        error: `Batch validation error: ${error.message}`
      };
    }
  }

  /**
   * Validate addresses with custom options
   * @param {Array} addresses - Array of addresses to validate
   * @param {Object} options - Validation options
   * @returns {Object} Custom validation result
   */
  static validateWithOptions(addresses, options = {}) {
    const {
      allowDuplicates = false,
      allowZeroAddress = false,
      requireChecksum = false,
      maxAddresses = null
    } = options;

    try {
      if (!Array.isArray(addresses)) {
        return {
          isValid: false,
          error: 'Input must be an array of addresses'
        };
      }

      // Check max addresses limit
      if (maxAddresses && addresses.length > maxAddresses) {
        return {
          isValid: false,
          error: `Too many addresses. Maximum allowed: ${maxAddresses}, provided: ${addresses.length}`
        };
      }

      const batchResult = this.batchValidate(addresses);
      
      if (batchResult.error) {
        return batchResult;
      }

      // Check for invalid addresses
      if (batchResult.invalid.length > 0) {
        return {
          isValid: false,
          error: `Found ${batchResult.invalid.length} invalid addresses`,
          details: batchResult
        };
      }

      // Check for duplicates if not allowed
      if (!allowDuplicates && batchResult.duplicates.length > 0) {
        return {
          isValid: false,
          error: `Found ${batchResult.duplicates.length} duplicate addresses`,
          details: batchResult
        };
      }

      // Check for zero addresses if not allowed
      if (!allowZeroAddress) {
        const zeroAddresses = batchResult.valid.filter(
          item => item.checksumAddress === ethers.ZeroAddress
        );
        
        if (zeroAddresses.length > 0) {
          return {
            isValid: false,
            error: `Found ${zeroAddresses.length} zero addresses`,
            details: batchResult
          };
        }
      }

      // Check for checksum requirement
      if (requireChecksum) {
        const nonChecksumAddresses = batchResult.valid.filter(
          item => !item.isChecksumValid
        );
        
        if (nonChecksumAddresses.length > 0) {
          return {
            isValid: false,
            error: `Found ${nonChecksumAddresses.length} addresses without valid checksum`,
            details: batchResult
          };
        }
      }

      return {
        isValid: true,
        details: batchResult
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Generate a sample CSV format for address uploads
   * @returns {string} Sample CSV content
   */
  static getSampleCSV() {
    return `address,amount
0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6,100
0x1234567890123456789012345678901234567890,50
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,25`;
  }

  /**
   * Get validation statistics
   * @param {Array} addresses - Array of addresses
   * @returns {Object} Statistics
   */
  static getValidationStats(addresses) {
    try {
      if (!Array.isArray(addresses)) {
        return {
          total: 0,
          valid: 0,
          invalid: 0,
          duplicates: 0,
          checksumValid: 0,
          zeroAddresses: 0
        };
      }

      const batchResult = this.batchValidate(addresses);
      
      const checksumValid = batchResult.valid.filter(item => item.isChecksumValid).length;
      const zeroAddresses = batchResult.valid.filter(
        item => item.checksumAddress === ethers.ZeroAddress
      ).length;

      return {
        total: addresses.length,
        valid: batchResult.valid.length,
        invalid: batchResult.invalid.length,
        duplicates: batchResult.duplicates.length,
        checksumValid: checksumValid,
        zeroAddresses: zeroAddresses
      };
    } catch (error) {
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        duplicates: 0,
        checksumValid: 0,
        zeroAddresses: 0,
        error: error.message
      };
    }
  }
}

export default AddressValidator; 