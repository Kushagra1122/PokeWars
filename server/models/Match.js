const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true,
  },
  playerA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  playerB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stakeWei: {
    type: String, // Store as string to handle large numbers
    required: true,
  },
  // Onchain fields
  chainId: {
    type: Number,
    default: 84532, // Base Sepolia
  },
  contractAddress: {
    type: String,
    required: true,
  },
  // Transaction hashes
  createTxHash: {
    type: String,
  },
  joinTxHash: {
    type: String,
  },
  settleTxHash: {
    type: String,
  },
  // Match state
  status: {
    type: String,
    enum: ['waiting', 'active', 'settled', 'canceled'],
    default: 'waiting',
  },
  // Game result
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  scoreA: {
    type: Number,
  },
  scoreB: {
    type: Number,
  },
  // Signatures for settlement
  sigA: {
    type: String,
  },
  sigB: {
    type: String,
  },
  serverNonce: {
    type: Number,
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
});

// Indexes for performance
MatchSchema.index({ playerA: 1, status: 1 });
MatchSchema.index({ playerB: 1, status: 1 });
MatchSchema.index({ matchId: 1 });

// Remove sensitive fields when converting to JSON
MatchSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Match', MatchSchema);
