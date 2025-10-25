import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

/**
 * Unified Marketplace Service
 * Coordinates Web3 transactions with backend API calls
 */
export class MarketplaceService {
  constructor(token, web3Service) {
    this.token = token;
    this.web3Service = web3Service;
    this.apiClient = axios.create({
      baseURL: `${API_BASE}/api`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Create a listing (Web3 + Backend)
   */
  async createListing(pokemonId, pokemonLevel, priceInEth) {
    try {
      // Step 1: Create listing on blockchain
      const blockchainReceipt = await this.web3Service.createListingOnBlockchain(
        this.generateListingId(),
        pokemonId,
        pokemonLevel,
        priceInEth
      );

      if (!blockchainReceipt) {
        throw new Error('Blockchain transaction failed');
      }

      // Step 2: Sync with backend
      const transactionHash = blockchainReceipt.transactionHash || blockchainReceipt.hash;
      
      const response = await this.apiClient.post('/pokemon/list-for-sale', {
        pokemonId,
        price: priceInEth,
        transactionHash
      });

      return {
        success: true,
        listing: response.data.listing,
        transactionHash,
        blockchainReceipt
      };
    } catch (error) {
      console.error('Create listing error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create listing'
      };
    }
  }

  /**
   * Buy from a listing (Web3 + Backend)
   */
  async buyListing(listingId, priceInEth) {
    try {
      // Step 1: Execute transaction on blockchain
      const blockchainReceipt = await this.web3Service.buyListingOnBlockchain(
        listingId,
        priceInEth
      );

      if (!blockchainReceipt) {
        throw new Error('Blockchain transaction failed');
      }

      // Step 2: Sync with backend
      const transactionHash = blockchainReceipt.transactionHash || blockchainReceipt.hash;
      
      const response = await this.apiClient.post('/pokemon/buy-from-listing', {
        listingId,
        transactionHash
      });

      return {
        success: true,
        user: response.data.user,
        transactionHash,
        blockchainReceipt
      };
    } catch (error) {
      console.error('Buy listing error:', error);
      return {
        success: false,
        error: error.message || 'Failed to purchase listing'
      };
    }
  }

  /**
   * Cancel a listing (Web3 + Backend)
   */
  async cancelListing(listingId, transactionHash = null) {
    try {
      // Step 1: Cancel on blockchain (if transactionHash provided)
      if (transactionHash) {
        const blockchainReceipt = await this.web3Service.cancelListingOnBlockchain(listingId);
        if (!blockchainReceipt) {
          throw new Error('Blockchain transaction failed');
        }
        transactionHash = blockchainReceipt.transactionHash || blockchainReceipt.hash;
      }

      // Step 2: Sync with backend
      const response = await this.apiClient.post('/pokemon/cancel-listing', {
        listingId,
        transactionHash
      });

      return {
        success: true,
        message: response.data.message,
        transactionHash
      };
    } catch (error) {
      console.error('Cancel listing error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel listing'
      };
    }
  }

  /**
   * Upgrade Pokemon level (Web3 + Backend)
   */
  async upgradePokemonLevel(pokemonId) {
    try {
      // Step 1: Pay upgrade fee on blockchain
      const blockchainReceipt = await this.web3Service.upgradeLevelOnBlockchain(
        pokemonId,
        0.1
      );

      if (!blockchainReceipt) {
        throw new Error('Blockchain transaction failed');
      }

      // Step 2: Update level in backend
      const transactionHash = blockchainReceipt.transactionHash || blockchainReceipt.hash;
      
      const response = await this.apiClient.post('/pokemon/upgrade-level', {
        pokemonId,
        transactionHash
      });

      return {
        success: true,
        user: response.data.user,
        transactionHash,
        blockchainReceipt
      };
    } catch (error) {
      console.error('Upgrade level error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upgrade level'
      };
    }
  }

  /**
   * Get marketplace listings
   */
  async getListings() {
    try {
      const response = await axios.get(`${API_BASE}/api/pokemon/listings`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data.listings || [];
    } catch (error) {
      console.error('Get listings error:', error);
      return [];
    }
  }

  /**
   * Get user's active listings
   */
  async getMyListings() {
    try {
      const response = await this.apiClient.get('/pokemon/my-listings');
      return response.data.listings || [];
    } catch (error) {
      console.error('Get my listings error:', error);
      return [];
    }
  }

  /**
   * Generate unique listing ID
   */
  generateListingId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get transaction status from blockchain
   */
  async getTransactionStatus(transactionHash) {
    try {
      // Call backend verification endpoint
      const response = await this.apiClient.get(`/transaction/${transactionHash}`);
      return response.data;
    } catch (error) {
      console.error('Get transaction status error:', error);
      return { status: 'unknown' };
    }
  }
}

export default MarketplaceService;
