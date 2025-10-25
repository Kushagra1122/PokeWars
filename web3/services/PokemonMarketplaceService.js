import { ethers } from 'ethers';
import PokemonMarketplaceABI from './PokemonMarketplace.json';

const CONTRACT_ADDRESS = import.meta.env?.VITE_POKEMON_MARKETPLACE_ADDRESS || '0x...'; // Replace with deployed address

export class PokemonMarketplaceService {
  constructor(signer) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      PokemonMarketplaceABI,
      signer
    );
    this.signer = signer;
  }

  // Create a listing on the blockchain
  async createListing(listingId, pokemonId, pokemonLevel, priceInEth) {
    const priceWei = ethers.parseEther(priceInEth.toString());
    const tx = await this.contract.createListing(
      listingId,
      pokemonId,
      pokemonLevel,
      priceWei
    );
    return await tx.wait();
  }

  // Buy from a listing
  async buyListing(listingId, priceInEth) {
    const priceWei = ethers.parseEther(priceInEth.toString());
    const tx = await this.contract.buyListing(listingId, {
      value: priceWei
    });
    return await tx.wait();
  }

  // Cancel a listing
  async cancelListing(listingId) {
    const tx = await this.contract.cancelListing(listingId);
    return await tx.wait();
  }

  // Upgrade Pokemon level
  async upgradePokemonLevel(pokemonId, costInEth = 0.1) {
    const costWei = ethers.parseEther(costInEth.toString());
    const tx = await this.contract.upgradePokemonLevel(pokemonId, {
      value: costWei
    });
    return await tx.wait();
  }

  // Deposit funds
  async depositFunds(amountInEth) {
    const amountWei = ethers.parseEther(amountInEth.toString());
    const tx = await this.contract.depositFunds({
      value: amountWei
    });
    return await tx.wait();
  }

  // Withdraw funds
  async withdrawFunds(amountInEth) {
    const amountWei = ethers.parseEther(amountInEth.toString());
    const tx = await this.contract.withdrawFunds(amountWei);
    return await tx.wait();
  }

  // View functions
  async getListing(listingId) {
    return await this.contract.getListing(listingId);
  }

  async getPlayerBalance(playerAddress) {
    const balanceWei = await this.contract.getPlayerBalance(playerAddress);
    return ethers.formatEther(balanceWei);
  }

  async getPlatformFeePercent() {
    return await this.contract.platformFeePercent();
  }

  async getLevelUpgradeCost() {
    const costWei = await this.contract.levelUpgradeCost();
    return ethers.formatEther(costWei);
  }

  // Estimate functions
  async estimateBuyListing(listingId, priceInEth) {
    const priceWei = ethers.parseEther(priceInEth.toString());
    return await this.contract.buyListing.estimateGas(listingId, {
      value: priceWei
    });
  }

  // Get contract address
  static getContractAddress() {
    return CONTRACT_ADDRESS;
  }
}

export default PokemonMarketplaceService;
