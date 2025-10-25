import { ethers } from 'ethers';
import MatchEscrowABI from './MatchEscrow.json';

const CONTRACT_ADDRESS = import.meta.env?.VITE_MATCH_ESCROW_ADDRESS || '0x...'; // Replace with deployed address

export class MatchEscrowService {
  constructor(signer) {
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

  // EIP-712 signing helper
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
    const domain = {
      name: 'PokeWars MatchEscrow',
      version: '1',
      chainId: await signer.provider.getNetwork().then((n) => n.chainId),
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

    return await signer.signTypedData(domain, types, value);
  }
}

export default MatchEscrowService;
