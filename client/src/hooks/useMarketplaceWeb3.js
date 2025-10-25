import { useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useWalletClient } from 'wagmi';
import { PokemonMarketplaceService } from '../services/PokemonMarketplaceService';

export function useMarketplaceWeb3() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create listing on blockchain
  const createListingOnBlockchain = useCallback(
    async (listingId, pokemonId, pokemonLevel, priceInEth) => {
      if (!isConnected || !walletClient) {
        setError('Please connect your wallet first');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const ethersV6Signer = walletClient.getSigner?.() || walletClient;
        const service = new PokemonMarketplaceService(ethersV6Signer);
        const receipt = await service.createListing(
          listingId,
          pokemonId,
          pokemonLevel,
          priceInEth
        );
        return receipt;
      } catch (err) {
        const errorMessage = err.reason || err.message || 'Failed to create listing';
        setError(errorMessage);
        console.error('Create listing error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, walletClient]
  );

  // Buy listing on blockchain
  const buyListingOnBlockchain = useCallback(
    async (listingId, priceInEth) => {
      if (!isConnected || !walletClient) {
        setError('Please connect your wallet first');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const ethersV6Signer = walletClient.getSigner?.() || walletClient;
        const service = new PokemonMarketplaceService(ethersV6Signer);
        const receipt = await service.buyListing(listingId, priceInEth);
        return receipt;
      } catch (err) {
        const errorMessage = err.reason || err.message || 'Failed to buy listing';
        setError(errorMessage);
        console.error('Buy listing error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, walletClient]
  );

  // Cancel listing on blockchain
  const cancelListingOnBlockchain = useCallback(
    async (listingId) => {
      if (!isConnected || !walletClient) {
        setError('Please connect your wallet first');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const ethersV6Signer = walletClient.getSigner?.() || walletClient;
        const service = new PokemonMarketplaceService(ethersV6Signer);
        const receipt = await service.cancelListing(listingId);
        return receipt;
      } catch (err) {
        const errorMessage = err.reason || err.message || 'Failed to cancel listing';
        setError(errorMessage);
        console.error('Cancel listing error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, walletClient]
  );

  // Upgrade Pokemon level on blockchain
  const upgradeLevelOnBlockchain = useCallback(
    async (pokemonId, costInEth = 0.1) => {
      if (!isConnected || !walletClient) {
        setError('Please connect your wallet first');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const ethersV6Signer = walletClient.getSigner?.() || walletClient;
        const service = new PokemonMarketplaceService(ethersV6Signer);
        const receipt = await service.upgradePokemonLevel(pokemonId, costInEth);
        return receipt;
      } catch (err) {
        const errorMessage = err.reason || err.message || 'Failed to upgrade level';
        setError(errorMessage);
        console.error('Upgrade level error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, walletClient]
  );

  // Get player balance
  const getPlayerBalance = useCallback(
    async (playerAddress) => {
      if (!publicClient) return null;

      try {
        const service = new PokemonMarketplaceService(publicClient);
        const balance = await service.getPlayerBalance(playerAddress);
        return balance;
      } catch (err) {
        console.error('Get balance error:', err);
        return null;
      }
    },
    [publicClient]
  );

  return {
    address,
    isConnected,
    loading,
    error,
    createListingOnBlockchain,
    buyListingOnBlockchain,
    cancelListingOnBlockchain,
    upgradeLevelOnBlockchain,
    getPlayerBalance
  };
}

export default useMarketplaceWeb3;
