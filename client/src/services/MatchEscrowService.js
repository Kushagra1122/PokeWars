import { ethers } from 'ethers';
import MatchEscrowABI from './MatchEscrow.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_MATCH_ESCROW_ADDRESS;

export class MatchEscrowService {
  constructor(signer) {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x...') {
      console.warn('⚠️ Contract address not configured');
    }
    
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      MatchEscrowABI.abi,
      signer,
    );
  }

  async createMatch(matchId, playerA, playerB, stakeWei) {
    const tx = await this.contract.createMatch(matchId, playerA, playerB, {
      value: stakeWei,
    });
    return await tx.wait();
  }

  async joinMatch(matchId, stakeWei) {
    const tx = await this.contract.joinMatch(matchId, { value: stakeWei });
    return await tx.wait();
  }

  async submitResult(matchId, winner, scoreA, scoreB, serverNonce, sigA, sigB) {
    const tx = await this.contract.submitResult(
      matchId,
      winner,
      scoreA,
      scoreB,
      serverNonce,
      sigA,
      sigB,
    );
    return await tx.wait();
  }

  async cancelMatch(matchId) {
    const tx = await this.contract.cancelMatch(matchId);
    return await tx.wait();
  }

  async getMatch(matchId) {
    return await this.contract.getMatch(matchId);
  }

  async getPoints(player) {
    return await this.contract.getPoints(player);
  }

  // EIP-712 signing helper (ethers v5 API)
  async signMatchResult(
    signer,
    matchId,
    playerA,
    playerB,
    winner,
    scoreA,
    scoreB,
    serverNonce,
  ) {
    // Get chainId using ethers v5 API
    const network = await signer.provider.getNetwork();
    const chainId = network.chainId;
    
    const domain = {
      name: 'PokeWars MatchEscrow',
      version: '1',
      chainId: chainId,
      verifyingContract: CONTRACT_ADDRESS,
    };

    const types = {
      MatchResult: [
        { name: 'matchId', type: 'bytes32' },
        { name: 'playerA', type: 'address' },
        { name: 'playerB', type: 'address' },
        { name: 'winner', type: 'address' },
        { name: 'scoreA', type: 'uint256' },
        { name: 'scoreB', type: 'uint256' },
        { name: 'serverNonce', type: 'uint256' },
      ],
    };

    const value = {
      matchId,
      playerA,
      playerB,
      winner,
      scoreA,
      scoreB,
      serverNonce,
    };

    // Use _signTypedData for ethers v5
    return await signer._signTypedData(domain, types, value);
  }
}

export default MatchEscrowService;

