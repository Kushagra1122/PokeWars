# Environment Variables Setup Guide

## Overview

You need to configure environment variables for **three** parts of the application:
1. **web3/** - For contract deployment
2. **server/** - Backend API
3. **client/** - Frontend React app

---

## Step-by-Step Setup

### 1️⃣ Web3 Environment (for deployment)

**File:** `web3/.env`

```bash
# Private key of deployer wallet (must have Base Sepolia ETH)
# Get ETH from: https://www.coinbase.com/faucet
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Etherscan API key for contract verification (optional but recommended)
# NOTE: Using Etherscan API V2 - single key works for ALL chains including Base!
# Get from: https://etherscan.io/myapikey
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**Where to get:**
- **PRIVATE_KEY**: Export from MetaMask (Account Details → Export Private Key)
  - ⚠️ **NEVER commit this to git!**
  - ⚠️ Use a test wallet, not your main wallet
- **ETHERSCAN_API_KEY**: 
  1. Sign up at https://etherscan.io/register
  2. Go to https://etherscan.io/apidashboard
  3. Create new API key
  4. This **same key** works for Base Sepolia (Etherscan API V2!)

---

### 2️⃣ Server Environment

**File:** `server/.env`

```bash
# Server port
PORT=4000

# MongoDB connection string
MONGO_URI=mongodb://127.0.0.1:27017/pokewars

# JWT secret for authentication (use a strong random string)
JWT_SECRET=change_this_to_a_long_random_secure_string_for_production

# Contract address - LEAVE AS IS until after deployment!
MATCH_ESCROW_ADDRESS=0x...
```

**Configuration Details:**

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `MONGO_URI` | MongoDB connection | Local: `mongodb://127.0.0.1:27017/pokewars`<br>Cloud: `mongodb+srv://user:pass@cluster.mongodb.net/pokewars` |
| `JWT_SECRET` | Auth token secret | Generate: `openssl rand -base64 32` |
| `MATCH_ESCROW_ADDRESS` | Contract address | **Fill after deployment** |

---

### 3️⃣ Client Environment

**File:** `client/.env`

```bash
# Backend API URL
VITE_API_BASE=http://localhost:4000

# OnchainKit API key from Coinbase Developer Portal
VITE_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here

# Contract address - LEAVE AS IS until after deployment!
VITE_MATCH_ESCROW_ADDRESS=0x...
```

**Configuration Details:**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_API_BASE` | Backend URL | Local dev: `http://localhost:4000` |
| `VITE_ONCHAINKIT_API_KEY` | OnchainKit key | Get from: https://portal.cdp.coinbase.com/ |
| `VITE_MATCH_ESCROW_ADDRESS` | Contract address | **Fill after deployment** |

**How to get OnchainKit API Key:**
1. Go to https://portal.cdp.coinbase.com/
2. Sign in with Coinbase account
3. Create new project
4. Copy API key

---

## Pre-Deployment Checklist

Before you start, make sure you have:

### ✅ Prerequisites

- [ ] **Node.js** v18+ installed
- [ ] **MongoDB** running (local or cloud)
- [ ] **MetaMask** or wallet with Base Sepolia ETH
- [ ] **OnchainKit API key** from Coinbase
- [ ] **Test ETH** from Base Sepolia faucet

### ✅ Get Test ETH

1. Visit https://www.coinbase.com/faucet
2. Connect your wallet
3. Select "Base Sepolia" network
4. Request test ETH
5. Wait ~1 minute for confirmation

### ✅ Create Environment Files

```bash
# Create all three .env files
touch web3/.env
touch server/.env
touch client/.env
```

---

## Fill Environment Variables (Step-by-Step)

### **Phase 1: Before Deployment**

#### 1. `web3/.env` ← Start here!
```bash
PRIVATE_KEY=abc123...your_private_key
ETHERSCAN_API_KEY=XYZ789...your_etherscan_api_key  # optional, for verification
```

#### 2. `server/.env`
```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pokewars
JWT_SECRET=generate_random_32_char_string_here
MATCH_ESCROW_ADDRESS=0x...  # ← LEAVE AS IS for now
```

#### 3. `client/.env`
```bash
VITE_API_BASE=http://localhost:4000
VITE_ONCHAINKIT_API_KEY=your_onchainkit_key_from_coinbase
VITE_MATCH_ESCROW_ADDRESS=0x...  # ← LEAVE AS IS for now
```

---

### **Phase 2: After Deployment**

After running `npx hardhat run scripts/deploy.js --network baseSepolia`, you'll see:

```
MatchEscrow deployed to: 0x1234567890abcdef1234567890abcdef12345678
```

**Now update both server and client:**

#### Update `server/.env`:
```bash
MATCH_ESCROW_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

#### Update `client/.env`:
```bash
VITE_MATCH_ESCROW_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

---

## Quick Start Commands

### Generate JWT Secret
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use Node:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Verify MongoDB is Running
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Or start MongoDB (Mac):
brew services start mongodb-community
```

### Test Environment Variables
```bash
# In server directory:
node -e "require('dotenv').config(); console.log('CONTRACT:', process.env.MATCH_ESCROW_ADDRESS)"

# In client directory:
npm run dev  # Check console for any missing env warnings
```

---

## Example Complete Setup

Here's what your files should look like:

### `web3/.env`
```bash
PRIVATE_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
ETHERSCAN_API_KEY=ABC123XYZ789
```

### `server/.env`
```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pokewars
JWT_SECRET=8x2Kp9mN4vB7zQ3wR6tY5uI8oP0aS2dF4gH6jK8lM9nB3vC5xZ7
MATCH_ESCROW_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### `client/.env`
```bash
VITE_API_BASE=http://localhost:4000
VITE_ONCHAINKIT_API_KEY=org_1a2b3c4d5e6f7g8h9i0j
VITE_MATCH_ESCROW_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## Validation

### Check All Variables Are Set

```bash
# Server
cd server
node -e "
require('dotenv').config();
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI ? '✓ Set' : '✗ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
console.log('CONTRACT:', process.env.MATCH_ESCROW_ADDRESS);
"

# Client
cd ../client
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
console.log('API_BASE:', env.includes('VITE_API_BASE') ? '✓ Set' : '✗ Missing');
console.log('ONCHAINKIT:', env.includes('VITE_ONCHAINKIT_API_KEY') ? '✓ Set' : '✗ Missing');
console.log('CONTRACT:', env.includes('VITE_MATCH_ESCROW_ADDRESS') ? '✓ Set' : '✗ Missing');
"
```

---

## Security Best Practices

⚠️ **NEVER commit `.env` files to git!**

Add to `.gitignore`:
```
# Environment files
**/.env
**/.env.local
**/.env.*.local

# But keep examples
!**/.env.example
```

✅ **Use different keys for production:**
- Different private key (not the deployment key)
- Different JWT secret
- Different MongoDB credentials

✅ **Rotate secrets regularly:**
- JWT secrets every 90 days
- API keys every 6 months

---

## Troubleshooting

### "Contract address not configured" error
- Make sure you deployed the contract first
- Copy the EXACT address from deployment output
- Restart server after updating .env

### "VITE_XXX is undefined" in client
- Vite requires `VITE_` prefix
- Restart dev server after changing .env
- Clear browser cache

### MongoDB connection failed
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB (Mac)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod
```

### OnchainKit errors
- Verify API key is valid at https://portal.cdp.coinbase.com/
- Check you're on Base/Base Sepolia network
- Clear browser cache and reconnect wallet

---

## Next Steps

After filling all environment variables:

1. ✅ Deploy contract: `cd web3 && npm run deploy`
2. ✅ Copy contract address to both server and client `.env`
3. ✅ Start server: `cd server && npm run dev`
4. ✅ Start client: `cd client && npm run dev`
5. ✅ Test wallet connection
6. ✅ Run end-to-end rated match

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions!

