import { ethers } from 'ethers';
import MultiPlayerEscrowABI from './MultiPlayerEscrow.json';

const CONTRACT_ADDRESS = import.meta.env?.VITE_MULTI_PLAYER_ESCROW_ADDRESS || '0x...';

export class MultiPlayerEscrowService {
  constructor(signer) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      MultiPlayerEscrowABI.abi,
      signer,
    );
  }

  async createGame(gameId, players, stakeAmount) {
    const tx = await this.contract.createGame(gameId, players, stakeAmount);
    return await tx.wait();
  }

  async stake(gameId, stakeAmount) {
    const tx = await this.contract.stake(gameId, {
      value: stakeAmount,
    });
    return await tx.wait();
  }

  async submitResult(gameId, winner, scores, serverNonce, signatures) {
    const tx = await this.contract.submitResult(
      gameId,
      winner,
      scores,
      serverNonce,
      signatures,
    );
    return await tx.wait();
  }

  async cancelGame(gameId) {
    const tx = await this.contract.cancelGame(gameId);
    return await tx.wait();
  }

  async getGame(gameId) {
    return await this.contract.getGame(gameId);
  }

  async isPlayerStaked(gameId, player) {
    return await this.contract.isPlayerStaked(gameId, player);
  }

  async getPlayerStake(gameId, player) {
    return await this.contract.getPlayerStake(gameId, player);
  }

  async getPoints(player) {
    return await this.contract.getPoints(player);
  }

  // EIP-712 signing helper
  async signGameResult(
    signer,
    gameId,
    players,
    winner,
    scores,
    serverNonce,
  ) {
    const domain = {
      name: 'PokeWars MultiPlayerEscrow',
      version: '1',
      chainId: await signer.provider.getNetwork().then((n) => n.chainId),
      verifyingContract: CONTRACT_ADDRESS,
    };

    const types = {
      GameResult: [
        { name: 'gameId', type: 'bytes32' },
        { name: 'players', type: 'address[]' },
        { name: 'winner', type: 'address' },
        { name: 'scores', type: 'uint256[]' },
        { name: 'serverNonce', type: 'uint256' },
      ],
    };

    const value = {
      gameId,
      players,
      winner,
      scores,
      serverNonce,
    };

    return await signer.signTypedData(domain, types, value);
  }
}

export default MultiPlayerEscrowService;
