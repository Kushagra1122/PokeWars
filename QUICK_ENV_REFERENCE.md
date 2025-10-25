# Quick Environment Variables Reference

## 🚀 TL;DR - What You Need

### Before Deployment

Create these 3 files with these exact variables:

---

### 📁 `web3/.env`
```bash
PRIVATE_KEY=your_64_char_private_key_from_metamask
ETHERSCAN_API_KEY=your_etherscan_api_key_from_etherscan_io
```

**Get these:**
- Private Key: MetaMask → Account Details → Export Private Key
- Etherscan Key: https://etherscan.io/apidashboard (works for ALL chains with V2!)

---

### 📁 `server/.env`
```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pokewars
JWT_SECRET=your_32_character_random_string
MATCH_ESCROW_ADDRESS=0x...
```

**Notes:**
- JWT_SECRET: Generate with `openssl rand -base64 32`
- MATCH_ESCROW_ADDRESS: Leave as `0x...` until after deployment

---

### 📁 `client/.env`
```bash
VITE_API_BASE=http://localhost:4000
VITE_ONCHAINKIT_API_KEY=your_onchainkit_key_from_coinbase
VITE_MATCH_ESCROW_ADDRESS=0x...
```

**Get OnchainKit key:**
https://portal.cdp.coinbase.com/ → Create Project → Copy API Key

---

## ✅ Pre-Flight Checklist

- [ ] Get Base Sepolia test ETH: https://www.coinbase.com/faucet
- [ ] MongoDB is running: `mongosh --eval "db.version()"`
- [ ] Created all 3 `.env` files above
- [ ] Generated JWT secret
- [ ] Got Etherscan API key (V2 from etherscan.io)
- [ ] Got OnchainKit API key from Coinbase

---

## 🎯 After Deployment

When you see:
```
MatchEscrow deployed to: 0x1234567890abcdef...
```

Update **both**:
- `server/.env` → `MATCH_ESCROW_ADDRESS=0x1234...`
- `client/.env` → `VITE_MATCH_ESCROW_ADDRESS=0x1234...`

Then restart server and client!

---

## 🔧 Quick Commands

```bash
# Generate JWT secret
openssl rand -base64 32

# Check MongoDB
mongosh --eval "db.version()"

# Test server env
cd server && node -e "require('dotenv').config(); console.log(process.env.MATCH_ESCROW_ADDRESS)"

# Deploy contract
cd web3 && npx hardhat run scripts/deploy.js --network baseSepolia

# Start server
cd server && npm run dev

# Start client
cd client && npm run dev
```

---

## ⚠️ Important Notes

### Etherscan API V2 Migration
- **Old way (deprecated):** BaseScan API key from basescan.org
- **New way (correct):** Single Etherscan API key from etherscan.io works for ALL chains!
- Read more: https://docs.etherscan.io/v/v2-migration-guide

### Security
- ⚠️ NEVER commit `.env` files to git
- ⚠️ Use a test wallet, not your main wallet
- ⚠️ Generate a strong JWT secret (32+ characters)

### Common Issues
- "Contract not configured" → Did you deploy and update both .env files?
- "VITE_XXX undefined" → Restart `npm run dev` after updating .env
- MongoDB errors → Is MongoDB running? Check with `ps aux | grep mongod`

---

## 📚 Full Documentation

See these files for detailed guides:
- `ENV_SETUP_GUIDE.md` - Comprehensive environment setup
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions
- `GATE_CHECK_REPORT.md` - Technical audit and verification

---

**Ready to deploy?** Follow `DEPLOYMENT_GUIDE.md` step-by-step! 🚀

