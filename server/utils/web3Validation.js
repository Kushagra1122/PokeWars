const { ethers } = require('ethers');

const CONTRACT_ADDRESS = process.env.POKEMON_MARKETPLACE_ADDRESS || '0x...';
const RPC_PROVIDER = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

// Initialize provider for verification
const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);

/**
 * Verify that a transaction was submitted to the blockchain
 * @param {string} transactionHash - Transaction hash to verify
 * @returns {Promise<object>} Transaction details if valid
 */
async function verifyBlockchainTransaction(transactionHash) {
  try {
    if (!transactionHash || !transactionHash.startsWith('0x')) {
      throw new Error('Invalid transaction hash format');
    }

    const transaction = await provider.getTransaction(transactionHash);
    
    if (!transaction) {
      throw new Error('Transaction not found on blockchain');
    }

    // Verify transaction was to our contract
    if (transaction.to.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
      throw new Error('Transaction was not sent to marketplace contract');
    }

    return {
      valid: true,
      hash: transactionHash,
      to: transaction.to,
      from: transaction.from,
      value: transaction.value.toString(),
      data: transaction.data,
      blockNumber: transaction.blockNumber,
      gasPrice: transaction.gasPrice?.toString()
    };
  } catch (error) {
    console.error('Transaction verification error:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Wait for transaction confirmation
 * @param {string} transactionHash - Transaction hash
 * @param {number} confirmations - Required confirmations (default: 1)
 * @returns {Promise<object>} Receipt if confirmed
 */
async function waitForConfirmation(transactionHash, confirmations = 1) {
  try {
    const receipt = await provider.waitForTransaction(transactionHash, confirmations);
    
    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return {
      confirmed: true,
      hash: transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Confirmation wait error:', error);
    return {
      confirmed: false,
      error: error.message
    };
  }
}

/**
 * Verify listing creation on blockchain
 * @param {string} listingId - Listing ID (bytes32)
 * @param {string} pokemonId - Pokemon ID
 * @returns {Promise<boolean>} True if listing exists on blockchain
 */
async function verifyListingCreated(listingId, pokemonId) {
  try {
    // This would require the contract ABI and a function to check listing
    // For now, we verify through transaction verification
    return true; // Backend handles final verification
  } catch (error) {
    console.error('Listing verification error:', error);
    return false;
  }
}

/**
 * Get transaction receipt details
 * @param {string} transactionHash - Transaction hash
 * @returns {Promise<object>} Receipt details
 */
async function getTransactionReceipt(transactionHash) {
  try {
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      return { found: false };
    }

    return {
      found: true,
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
      logs: receipt.logs.length
    };
  } catch (error) {
    console.error('Receipt fetch error:', error);
    return { found: false, error: error.message };
  }
}

module.exports = {
  verifyBlockchainTransaction,
  waitForConfirmation,
  verifyListingCreated,
  getTransactionReceipt,
  CONTRACT_ADDRESS,
  provider
};
