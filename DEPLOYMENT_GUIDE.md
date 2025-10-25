# PokéWars - Deployment & Testing Guide

## Prerequisites

1. **Node.js** v18+
2. **MongoDB** running locally or remote
3. **Base Sepolia ETH** for deployment and testing
4. **OnchainKit API Key** from Coinbase Developer Portal

## Step 1: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install web3 dependencies
cd ../web3
npm install
```

## Step 2: Compile and Test Smart Contract

```bash
cd web3

# Compile contract
npx hardhat compile

# Run unit tests locally
npx hardhat test

# Expected output: All tests passing ✅
```

## Step 3: Deploy Contract to Base Sepolia

### Get Base Sepolia Test ETH
- Visit https://www.coinbase.com/faucet
- Connect your wallet
- Request Base Sepolia testnet ETH

### Configure Deployment

Create `web3/.env`:
```bash
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
```

### Deploy

```bash
cd web3
npx hardhat run scripts/deploy.js --network baseSepolia
```

**Expected output:**
```
Deploying MatchEscrow contract...
MatchEscrow deployed to: 0x...
Contract artifact saved to services/MatchEscrow.json
```

**Save the deployed contract address!**

## Step 4: Configure Environment Variables

### Server Configuration

Create `server/.env`:
```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pokewars
JWT_SECRET=your_secure_jwt_secret_here
MATCH_ESCROW_ADDRESS=0x_paste_deployed_address_here
```

### Client Configuration

Create `client/.env`:
```bash
VITE_API_BASE=http://localhost:4000
VITE_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here
VITE_MATCH_ESCROW_ADDRESS=0x_paste_deployed_address_here
```

## Step 5: Start the Application

### Terminal 1: Start Server
```bash
cd server
npm run dev
```

**Expected output:**
```
✅ Contract address configured: 0x...
🌐 Default chain: Base Sepolia (84532)
📍 API running on port 4000
Connected to MongoDB
🔌 Socket.io server initialized
Server listening on 4000
```

### Terminal 2: Start Client
```bash
cd client
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 6: End-to-End Testing on Base Sepolia

### Test Flow

1. **Open browser** → http://localhost:5173

2. **Create two test accounts**
   - Player A: Create account → Login
   - Player B: Create account → Login (use incognito/different browser)

3. **Link wallets**
   - Both players: Click "Connect Wallet" in top right
   - Connect to Base Sepolia (84532)
   - Wallet addresses will be linked automatically

4. **Get starter Pokémon**
   - Both players: Dashboard → "Get Your First Pokémon"
   - Select a Pokémon

5. **Create Rated Match**
   - Player A: Battle → Create Lobby
   - Share lobby code with Player B
   - Player B: Battle → Join Lobby (enter code)

6. **Configure Rated Game**
   - Player A (owner):
     - Select game time: 5 minutes
     - Select map: Forest
     - Select game type: **Rated**
     - Set stake: 0.001 ETH
   - Wait for both players' wallets to be connected
   - Click **Start**

7. **Escrow Creation** 🔐
   - Player A wallet prompts: Approve transaction (createMatch)
   - **Transaction 1**: Record tx hash from wallet
   - Player B wallet prompts: Approve transaction (joinMatch)
   - **Transaction 2**: Record tx hash from wallet
   - Game starts after both deposits confirmed

8. **Play Match**
   - Players engage in gameplay
   - Server tracks scores automatically
   - Match ends after timer expires or win condition

9. **Settlement** 💰
   - Settlement modal appears
   - Both players prompted to sign typed data (EIP-712)
   - Server verifies signatures
   - Contract called with `submitResult`
   - **Transaction 3**: Record settlement tx hash
   - Winner receives 2x stake (0.002 ETH)

### Verification

Check transactions on Base Sepolia explorer:
- https://sepolia.basescan.org/tx/[your_tx_hash]

### Expected Transaction Hashes

After completing the flow above, you should have:

1. **createMatch TX**: `0x...` (Player A deposit)
2. **joinMatch TX**: `0x...` (Player B deposit)
3. **submitResult TX**: `0x...` (Settlement to winner)

## Step 7: Verify Contract Events

On BaseScan, check the contract:
- https://sepolia.basescan.org/address/[your_contract_address]

Expected events:
1. `MatchCreated(matchId, playerA, playerB, stake)`
2. `MatchJoined(matchId, playerB, stake)`
3. `MatchResult(matchId, winner, scoreA, scoreB, totalPayout, serverNonce)`

## Troubleshooting

### Contract address not configured
- Ensure `.env` files have correct `MATCH_ESCROW_ADDRESS`
- Restart server and client after updating .env

### Wallet not on Base Sepolia
- Switch network in wallet to "Base Sepolia"
- Chain ID: 84532
- RPC: https://sepolia.base.org

### Transaction failed
- Check you have sufficient Base Sepolia ETH
- Verify gas settings in wallet
- Check server logs for signature verification errors

### Signatures invalid
- Ensure both players are on Base Sepolia (84532)
- Check contract address matches in client and server .env
- Verify typed data matches contract EIP-712 domain

## Testing Checklist

- [x] Contract compiles without errors
- [x] All unit tests pass locally
- [x] Contract deployed to Base Sepolia
- [x] ABI exported to `web3/services/MatchEscrow.json`
- [ ] Environment variables configured (client + server)
- [ ] Server starts with contract address validated
- [ ] Client connects wallet successfully
- [ ] Wallet linking creates/updates user
- [ ] Basename displays (if available)
- [ ] Rated game disables start without wallet
- [ ] Escrow transactions succeed onchain
- [ ] Both deposits confirmed before game start
- [ ] Signatures verified server-side
- [ ] Settlement transaction succeeds
- [ ] Winner receives correct payout
- [ ] Three tx hashes captured and verified on BaseScan

## Next Steps (Prompt 3)

After this gate check passes, the following will be implemented:
- Points anchoring onchain
- Leaderboard with onchain verification
- Advanced dispute resolution
- Token economy integration

