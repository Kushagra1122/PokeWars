const { ethers } = require('ethers');

/**
 * Normalize Ethereum address to checksummed format
 * @param {string} address - Address to normalize
 * @returns {string} Checksummed address
 */
function normalizeAddress(address) {
  if (!address) return null;
  try {
    return ethers.getAddress(address.toLowerCase());
  } catch (error) {
    throw new Error(`Invalid address: ${address}`);
  }
}

/**
 * Validate and normalize bytes32 matchId
 * @param {string} matchId - Match ID to validate
 * @returns {string} Normalized 32-byte hex string with 0x prefix
 */
function normalizeMatchId(matchId) {
  if (!matchId) throw new Error('MatchId required');
  
  // Remove 0x prefix if present
  const cleaned = matchId.startsWith('0x') ? matchId.slice(2) : matchId;
  
  // Validate 64 hex characters (32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(cleaned)) {
    throw new Error(`Invalid matchId format: must be 32 bytes hex`);
  }
  
  return '0x' + cleaned.toLowerCase();
}

/**
 * Generate unique match ID from player IDs and timestamp
 * @param {string} playerAId - Player A database ID
 * @param {string} playerBId - Player B database ID
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} 32-byte hex match ID
 */
function generateMatchId(playerAId, playerBId, timestamp = Date.now()) {
  const data = `${playerAId}-${playerBId}-${timestamp}`;
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}

/**
 * Validate contract address is set
 * @param {string} address - Contract address
 * @returns {boolean}
 */
function isValidContractAddress(address) {
  return address && address !== '0x...' && /^0x[0-9a-fA-F]{40}$/.test(address);
}

module.exports = {
  normalizeAddress,
  normalizeMatchId,
  generateMatchId,
  isValidContractAddress,
};

