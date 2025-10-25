const Match = require('../models/Match');
const User = require('../models/User');
const { ethers } = require('ethers');
const MatchEscrowABI = require('../../web3/services/MatchEscrow.json');
const {
  normalizeAddress,
  normalizeMatchId,
  generateMatchId,
  isValidContractAddress,
} = require('../utils/web3Utils');

const CONTRACT_ADDRESS = process.env.MATCH_ESCROW_ADDRESS || '0x...';

class MatchController {
  // Create a new rated match with escrow
  async createMatch(req, res) {
    try {
      const { playerBId, stakeWei } = req.body;
      const playerAId = req.user.id;

      if (!playerBId || !stakeWei) {
        return res
          .status(400)
          .json({ error: 'playerBId and stakeWei required' });
      }

      // Verify players exist and have wallets linked
      const [playerA, playerB] = await Promise.all([
        User.findById(playerAId),
        User.findById(playerBId),
      ]);

      if (!playerA || !playerA.address) {
        return res
          .status(400)
          .json({ error: 'Player A must have wallet linked' });
      }
      if (!playerB || !playerB.address) {
        return res
          .status(400)
          .json({ error: 'Player B must have wallet linked' });
      }

      // Validate contract address is configured
      if (!isValidContractAddress(CONTRACT_ADDRESS)) {
        return res
          .status(500)
          .json({ error: 'Contract address not configured' });
      }

      // Normalize addresses
      const addressA = normalizeAddress(playerA.address);
      const addressB = normalizeAddress(playerB.address);

      // Generate unique matchId
      const matchId = generateMatchId(playerAId, playerBId);

      // Create match record
      const match = new Match({
        matchId,
        playerA: playerAId,
        playerB: playerBId,
        stakeWei,
        contractAddress: CONTRACT_ADDRESS,
        status: 'waiting',
      });

      await match.save();

      console.log(`✅ Match created: ${matchId} | ${addressA} vs ${addressB}`);

      res.json({
        matchId,
        playerA: addressA,
        playerB: addressB,
        stakeWei,
      });
    } catch (error) {
      console.error('Create match error:', error);
      res.status(500).json({ error: 'Failed to create match' });
    }
  }

  // Join an existing match
  async joinMatch(req, res) {
    try {
      const { matchId } = req.params;
      const playerId = req.user.id;

      const match = await Match.findOne({ matchId });
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      if (match.playerB.toString() !== playerId) {
        return res
          .status(403)
          .json({ error: 'Not authorized to join this match' });
      }

      if (match.status !== 'waiting') {
        return res.status(400).json({ error: 'Match not available to join' });
      }

      match.status = 'active';
      match.startedAt = new Date();
      await match.save();

      res.json({ success: true });
    } catch (error) {
      console.error('Join match error:', error);
      res.status(500).json({ error: 'Failed to join match' });
    }
  }

  // Submit match result for settlement
  async submitResult(req, res) {
    try {
      const { matchId, winnerId, scoreA, scoreB, sigA, sigB, serverNonce } =
        req.body;

      // Normalize and validate matchId
      const normalizedMatchId = normalizeMatchId(matchId);

      const match = await Match.findOne({ matchId: normalizedMatchId }).populate(
        'playerA playerB winner',
      );
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Idempotency check
      if (match.status === 'settled') {
        console.log(`⚠️ Match ${matchId} already settled, returning existing result`);
        return res.json({
          matchId: match.matchId,
          winner: match.winner.address,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          serverNonce: match.serverNonce,
          settleTxHash: match.settleTxHash,
        });
      }

      if (match.status !== 'active') {
        return res.status(400).json({ error: 'Match not active' });
      }

      // Verify winner is one of the players
      const winner = await User.findById(winnerId);
      if (
        !winner ||
        ![match.playerA._id.toString(), match.playerB._id.toString()].includes(
          winnerId,
        )
      ) {
        return res.status(400).json({ error: 'Invalid winner' });
      }

      // Verify serverNonce matches
      if (match.serverNonce && match.serverNonce !== serverNonce) {
        return res.status(400).json({ error: 'Invalid server nonce' });
      }

      // Normalize addresses
      const addressA = normalizeAddress(match.playerA.address);
      const addressB = normalizeAddress(match.playerB.address);
      const winnerAddress = normalizeAddress(winner.address);

      // Construct typed data for verification
      const domain = {
        name: 'PokeWars MatchEscrow',
        version: '1',
        chainId: 84532, // Base Sepolia
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

      const message = {
        matchId: normalizedMatchId,
        playerA: addressA,
        playerB: addressB,
        winner: winnerAddress,
        scoreA,
        scoreB,
        serverNonce,
      };

      // Compute and log message hash for audit
      const messageHash = ethers.TypedDataEncoder.hash(domain, types, message);
      console.log(`📋 Match result message hash: ${messageHash}`);

      // Verify signatures off-chain
      try {
        const recoveredA = ethers.verifyTypedData(domain, types, message, sigA);
        const recoveredB = ethers.verifyTypedData(domain, types, message, sigB);

        if (recoveredA.toLowerCase() !== addressA.toLowerCase()) {
          return res
            .status(400)
            .json({ error: 'Invalid signature from playerA' });
        }

        if (recoveredB.toLowerCase() !== addressB.toLowerCase()) {
          return res
            .status(400)
            .json({ error: 'Invalid signature from playerB' });
        }

        console.log(`✅ Signatures verified for match ${matchId}`);
      } catch (sigError) {
        console.error('Signature verification error:', sigError);
        return res.status(400).json({ error: 'Signature verification failed' });
      }

      // Update match with result
      match.winner = winnerId;
      match.scoreA = scoreA;
      match.scoreB = scoreB;
      match.sigA = sigA;
      match.sigB = sigB;
      match.serverNonce = serverNonce;
      match.endedAt = new Date();
      match.status = 'settled';

      await match.save();

      console.log(`✅ Match ${matchId} settled: winner=${winnerAddress}`);

      res.json({
        matchId: match.matchId,
        winner: winnerAddress,
        scoreA,
        scoreB,
        serverNonce,
      });
    } catch (error) {
      console.error('Submit result error:', error);
      res.status(500).json({ error: 'Failed to submit result' });
    }
  }

  // Get match details
  async getMatch(req, res) {
    try {
      const { matchId } = req.params;

      const match = await Match.findOne({ matchId })
        .populate('playerA', 'name address basename')
        .populate('playerB', 'name address basename')
        .populate('winner', 'name address basename');

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      res.json(match);
    } catch (error) {
      console.error('Get match error:', error);
      res.status(500).json({ error: 'Failed to get match' });
    }
  }

  // Get user's matches
  async getUserMatches(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const query = {
        $or: [{ playerA: userId }, { playerB: userId }],
      };

      if (status) {
        query.status = status;
      }

      const matches = await Match.find(query)
        .populate('playerA', 'name address basename')
        .populate('playerB', 'name address basename')
        .populate('winner', 'name address basename')
        .sort({ createdAt: -1 });

      res.json(matches);
    } catch (error) {
      console.error('Get user matches error:', error);
      res.status(500).json({ error: 'Failed to get matches' });
    }
  }

  // Get canonical typed data for signing match result
  async getTypedData(req, res) {
    try {
      const { matchId } = req.params;

      // Normalize matchId
      const normalizedMatchId = normalizeMatchId(matchId);

      const match = await Match.findOne({ matchId: normalizedMatchId })
        .populate('playerA', 'address')
        .populate('playerB', 'address')
        .populate('winner', 'address');

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      if (match.status !== 'active') {
        return res.status(400).json({ error: 'Match not active' });
      }

      // Generate server nonce if not already set (prevent reuse)
      if (!match.serverNonce) {
        match.serverNonce = Date.now();
        await match.save();
      }

      // Normalize addresses
      const addressA = normalizeAddress(match.playerA.address);
      const addressB = normalizeAddress(match.playerB.address);

      const typedData = {
        domain: {
          name: 'PokeWars MatchEscrow',
          version: '1',
          chainId: 84532, // Base Sepolia
          verifyingContract: CONTRACT_ADDRESS,
        },
        types: {
          MatchResult: [
            { name: 'matchId', type: 'bytes32' },
            { name: 'playerA', type: 'address' },
            { name: 'playerB', type: 'address' },
            { name: 'winner', type: 'address' },
            { name: 'scoreA', type: 'uint256' },
            { name: 'scoreB', type: 'uint256' },
            { name: 'serverNonce', type: 'uint256' },
          ],
        },
        primaryType: 'MatchResult',
        message: {
          matchId: normalizedMatchId,
          playerA: addressA,
          playerB: addressB,
          winner: match.winner
            ? normalizeAddress(match.winner.address)
            : '0x0000000000000000000000000000000000000000',
          scoreA: match.scoreA || 0,
          scoreB: match.scoreB || 0,
          serverNonce: match.serverNonce,
        },
      };

      // Log message hash for audit
      const messageHash = ethers.TypedDataEncoder.hash(
        typedData.domain,
        typedData.types,
        typedData.message,
      );
      console.log(`📋 Typed data for match ${matchId}: hash=${messageHash}`);

      res.json(typedData);
    } catch (error) {
      console.error('Get typed data error:', error);
      res.status(500).json({ error: 'Failed to get typed data' });
    }
  }
}

module.exports = new MatchController();
