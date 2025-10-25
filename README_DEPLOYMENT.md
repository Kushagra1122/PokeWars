# PokéWars Deployment - Getting Started

## 📋 Environment Variables You Need

### Quick Answer: 3 Files, 7 Variables

1. **`web3/.env`** (2 variables)
   - `PRIVATE_KEY` - Your MetaMask private key
   - `ETHERSCAN_API_KEY` - From etherscan.io (works for Base!)

2. **`server/.env`** (4 variables)
   - `PORT` - Server port (default: 4000)
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - Random 32-char string
   - `MATCH_ESCROW_ADDRESS` - Contract address (fill after deployment)

3. **`client/.env`** (3 variables)
   - `VITE_API_BASE` - Backend URL (default: http://localhost:4000)
   - `VITE_ONCHAINKIT_API_KEY` - From portal.cdp.coinbase.com
   - `VITE_MATCH_ESCROW_ADDRESS` - Contract address (fill after deployment)

---

## 🎯 Getting Started (5 Minutes)

### Step 1: Get Your API Keys (2 min)

```bash
# 1. Etherscan API Key (for contract verification)
#    → https://etherscan.io/register
#    → https://etherscan.io/apidashboard
#    → Create new key
#    ✅ This ONE key works for ALL chains including Base Sepolia!

# 2. OnchainKit API Key (for wallet features)
#    → https://portal.cdp.coinbase.com/
#    → Sign in with Coinbase
#    → Create project → Copy API key

# 3. Test ETH (Base Sepolia)
#    → https://www.coinbase.com/faucet
#    → Connect wallet → Select Base Sepolia → Request ETH
```

### Step 2: Create Environment Files (2 min)

```bash
# In project root
cd /Users/sourabhkapure/Desktop/PokéWars

# Create the 3 .env files
touch web3/.env server/.env client/.env
```

### Step 3: Fill Variables (1 min)

#### `web3/.env`
```bash
PRIVATE_KEY=paste_your_metamask_private_key_here
ETHERSCAN_API_KEY=paste_your_etherscan_key_here
```

#### `server/.env`
```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pokewars
JWT_SECRET=$(openssl rand -base64 32)
MATCH_ESCROW_ADDRESS=0x...
```

#### `client/.env`
```bash
VITE_API_BASE=http://localhost:4000
VITE_ONCHAINKIT_API_KEY=paste_your_onchainkit_key_here
VITE_MATCH_ESCROW_ADDRESS=0x...
```

---

## 🚀 Deploy in 3 Commands

```bash
# 1. Deploy contract to Base Sepolia
cd web3
npx hardhat run scripts/deploy.js --network baseSepolia
# ✅ Copy the contract address from output!

# 2. Update both .env files with contract address
# Edit server/.env and client/.env
# Replace 0x... with your deployed address

# 3. Start everything
cd ../server && npm run dev &  # Start server
cd ../client && npm run dev    # Start client
```

---

## 📖 Documentation Index

| File | Purpose |
|------|---------|
| `QUICK_ENV_REFERENCE.md` | Quick reference card (start here!) |
| `ENV_SETUP_GUIDE.md` | Complete environment setup guide |
| `DEPLOYMENT_GUIDE.md` | Full deployment instructions |
| `GATE_CHECK_REPORT.md` | Technical audit report |

---

## ✅ Verification Checklist

Before deployment:
- [ ] MongoDB is running
- [ ] Have Base Sepolia ETH in wallet
- [ ] All 3 `.env` files created
- [ ] Etherscan API key obtained (from etherscan.io!)
- [ ] OnchainKit API key obtained
- [ ] JWT secret generated

After deployment:
- [ ] Contract address copied to both server and client .env
- [ ] Server starts without "contract not configured" warning
- [ ] Client connects to wallet successfully
- [ ] Can create and join lobbies

---

## 🔧 Important: Etherscan API V2

⚠️ **Note:** We're using Etherscan API V2!

- **OLD (deprecated):** Separate API keys per chain (BaseScan, PolygonScan, etc.)
- **NEW (correct):** Single Etherscan API key from etherscan.io works for ALL chains!

Get your key from: https://etherscan.io/apidashboard

This is already configured in `web3/hardhat.config.js` ✅

---

## 🆘 Quick Troubleshooting

### "Contract address not configured"
```bash
# Make sure you:
# 1. Deployed the contract
# 2. Copied address to BOTH .env files (server AND client)
# 3. Restarted server and client
```

### "MongoDB connection failed"
```bash
# Start MongoDB:
brew services start mongodb-community  # Mac
sudo systemctl start mongod           # Linux
```

### "VITE_XXX is undefined"
```bash
# Vite requires restart after .env changes:
# 1. Stop client (Ctrl+C)
# 2. Start again: npm run dev
```

---

## 🎮 Next Steps

After deployment:
1. Open http://localhost:5173
2. Create two test accounts
3. Connect wallets (both players)
4. Create rated lobby with 0.001 ETH stake
5. Play match
6. Verify settlement on BaseScan

Full testing guide: See `DEPLOYMENT_GUIDE.md` Step 6

---

## 📞 Need Help?

- Environment setup issues → `ENV_SETUP_GUIDE.md`
- Deployment issues → `DEPLOYMENT_GUIDE.md`
- Technical details → `GATE_CHECK_REPORT.md`
- Quick reference → `QUICK_ENV_REFERENCE.md`

---

**Ready to deploy? Start with `QUICK_ENV_REFERENCE.md`!** 🚀

