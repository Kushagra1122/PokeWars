# Web3 Marketplace Integration Guide - Pokemon Wars

## 📋 Overview

This guide provides complete integration of the Pokemon Marketplace with MetaMask and Web3 smart contracts for real ETH transactions.

---

## 🏗️ Architecture

### Smart Contract Layer
- **PokemonMarketplace.sol**: Main marketplace contract handling buy/sell/upgrade
- Deployed on Base or Base Sepolia testnet
- ReentrancyGuard security for safe transactions
- Platform fee system (2% default, configurable)

### Service Layer
- **PokemonMarketplaceService.js**: Ethers.js wrapper for contract interaction
- Handles unit conversion (ETH ↔ Wei)
- Gas estimation and error handling

### Hook Layer
- **useMarketplaceWeb3.js**: React hook for marketplace operations
- Manages wallet connection state
- Handles loading and error states

---

## 🚀 Setup Instructions

### 1. Deploy Smart Contract

```bash
cd web3

# Install dependencies
npm install

# Compile contract
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network base-sepolia
```

**Save the deployed address!** You'll need it in the next step.

### 2. Environment Configuration

Add to `.env` (root directory):

```env
VITE_POKEMON_MARKETPLACE_ADDRESS=0x<your-deployed-contract-address>
```

Add to `client/.env`:

```env
VITE_POKEMON_MARKETPLACE_ADDRESS=0x<your-deployed-contract-address>
```

### 3. Update MarketPlace Component

Import the Web3 hook in `MarketPlace.jsx`:

```javascript
import useMarketplaceWeb3 from '../hooks/useMarketplaceWeb3';

function MarketPlace() {
  const { 
    address, 
    isConnected, 
    loading,
    error,
    createListingOnBlockchain,
    buyListingOnBlockchain,
    upgradeLevelOnBlockchain
  } = useMarketplaceWeb3();
  
  // ... rest of component
}
```

---

## 🔄 Transaction Flow

### Buying from Marketplace

**Old Flow (Simulated):**
```
User clicks Buy → Backend deducts balance → Pokémon transferred
```

**New Web3 Flow:**
```
User clicks Buy 
  ↓
Wallet opens → User confirms transaction
  ↓
Smart contract receives ETH payment
  ↓
Seller receives 98% (2% platform fee)
  ↓
Backend updates Pokémon ownership
  ↓
User sees confirmation
```

### Selling Pokemon

**New Web3 Flow:**
```
User lists Pokémon with price
  ↓
Create listing on blockchain (listingId, pokemonId, level, price)
  ↓
Wallet confirms (only for smart contract interaction)
  ↓
Listing visible to other players
  ↓
When sold: Seller receives ETH directly from contract
```

### Level Upgrade

**New Web3 Flow:**
```
User clicks Upgrade Level
  ↓
Wallet opens → User confirms 0.1 ETH payment
  ↓
Smart contract receives payment
  ↓
Platform receives upgrade fee
  ↓
Backend updates Pokémon level
  ↓
User sees new level in collection
```

---

## 📝 Updated API Endpoints

### Backend Still Handles:
- Database updates (Pokémon ownership, levels)
- User authentication
- Non-financial operations

### Blockchain Handles:
- ETH transfers
- Listing creation records
- Payment verification
- Fee distribution

### New Integration Points

#### List for Sale
```javascript
// 1. Frontend creates listing on blockchain
const receipt = await createListingOnBlockchain(
  listingId,  // bytes32
  pokemonId,  // string
  level,      // uint256
  priceInEth  // number (e.g., 0.75)
);

// 2. Frontend calls backend to record in database
await axios.post(
  '/api/pokemon/list-for-sale',
  { pokemonId, price, listingId: receipt.transactionHash }
);
```

#### Buy from Listing
```javascript
// 1. Frontend calls blockchain to transfer ETH
const receipt = await buyListingOnBlockchain(
  listingId,
  priceInEth
);

// 2. Frontend calls backend to update ownership
await axios.post(
  '/api/pokemon/buy-from-listing',
  { listingId }
);
```

#### Upgrade Level
```javascript
// 1. Frontend pays upgrade fee on blockchain
const receipt = await upgradeLevelOnBlockchain(
  pokemonId,
  0.1  // 0.1 ETH per level
);

// 2. Backend updates level in database
await axios.post(
  '/api/pokemon/upgrade-level',
  { pokemonId }
);
```

---

## 🎯 Implementation Example

### Update MarketPlace.jsx

```javascript
import useMarketplaceWeb3 from '../hooks/useMarketplaceWeb3';

// In component:
const { 
  isConnected, 
  buyListingOnBlockchain, 
  createListingOnBlockchain,
  upgradeLevelOnBlockchain,
  loading,
  error: web3Error
} = useMarketplaceWeb3();

// Handle buy click
const handleBuyFromListing = async (listing) => {
  if (!isConnected) {
    setError('Please connect MetaMask wallet');
    return;
  }

  // First: blockchain transaction
  const receipt = await buyListingOnBlockchain(
    listing._id,
    listing.price
  );
  
  if (!receipt) {
    setError(web3Error || 'Blockchain transaction failed');
    return;
  }

  // Second: update backend
  await axios.post(
    `${API_BASE}/api/pokemon/buy-from-listing`,
    { listingId: listing._id },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  await refreshUser();
  setSuccess('Successfully purchased Pokémon!');
};

// Handle sell
const handleListForSale = async () => {
  if (!isConnected) {
    setError('Please connect MetaMask wallet');
    return;
  }

  // Generate listing ID from blockchain tx hash
  const listingId = ethers.id(
    `${selectedPokemonToSell._id}-${Date.now()}-${selectedPokemonToSell.name}`
  );

  // First: blockchain transaction
  const receipt = await createListingOnBlockchain(
    listingId,
    selectedPokemonToSell._id,
    selectedPokemonToSell.userLevel || 1,
    parseFloat(sellPrice)
  );

  if (!receipt) {
    setError(web3Error || 'Blockchain transaction failed');
    return;
  }

  // Second: create database record
  await axios.post(
    `${API_BASE}/api/pokemon/list-for-sale`,
    { pokemonId: selectedPokemonToSell._id, price: parseFloat(sellPrice) },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  await refreshUser();
  setSuccess('Pokémon listed successfully!');
  setShowSellModal(false);
};

// Handle upgrade
const handleUpgradeLevel = async () => {
  if (!isConnected) {
    setError('Please connect MetaMask wallet');
    return;
  }

  // First: blockchain payment
  const receipt = await upgradeLevelOnBlockchain(
    selectedPokemonToUpgrade._id,
    0.1
  );

  if (!receipt) {
    setError(web3Error || 'Blockchain transaction failed');
    return;
  }

  // Second: backend update
  await axios.post(
    `${API_BASE}/api/pokemon/upgrade-level`,
    { pokemonId: selectedPokemonToUpgrade._id },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  await refreshUser();
  setSuccess('Level upgraded successfully!');
  setShowUpgradeModal(false);
};
```

---

## 💰 Smart Contract Functions Reference

### User Functions

#### `createListing(listingId, pokemonId, pokemonLevel, price)`
- Creates a new listing
- No ETH required (just gas)
- Emits `ListingCreated` event

#### `buyListing(listingId)`
- Purchase a listed Pokémon
- Value: exact listing price
- Seller receives 98% (2% platform fee)

#### `cancelListing(listingId)`
- Only seller can cancel
- Removes listing from marketplace

#### `upgradePokemonLevel(pokemonId)`
- Pay to upgrade Pokémon level
- Value: 0.1 ETH (configurable)
- Only covers payment, backend handles level update

#### `depositFunds()`
- Deposit ETH to contract balance
- Can withdraw anytime

#### `withdrawFunds(amount)`
- Withdraw deposited funds
- Amount in Wei

---

## 🔧 Configuration

### Smart Contract Settings (Admin Only)

#### Change Platform Fee
```solidity
setPlatformFeePercent(3)  // 3% fee
```

#### Change Level Upgrade Cost
```solidity
setLevelUpgradeCost(ethers.parseEther("0.2"))  // 0.2 ETH per level
```

#### Change Platform Fee Recipient
```solidity
setPlatformFeeRecipient(newAddress)
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Create listing
- [ ] Buy listing
- [ ] Cancel listing
- [ ] Upgrade level
- [ ] Deposit/withdraw funds
- [ ] Fee distribution
- [ ] Reentrancy protection

### Integration Tests
- [ ] Full buy flow (blockchain → backend)
- [ ] Full sell flow (blockchain → backend)
- [ ] Level upgrade flow
- [ ] Insufficient funds scenarios
- [ ] Permission checks (only seller can cancel)

### Manual Testing (Testnet)
- [ ] Connect MetaMask to Base Sepolia
- [ ] Test with small amounts (0.01 ETH)
- [ ] Check transaction confirmations
- [ ] Verify database updates
- [ ] Test error scenarios

---

## 🔐 Security Considerations

### Smart Contract Security
- ✅ ReentrancyGuard for safe transfers
- ✅ Checks-effects-interactions pattern
- ✅ Owner-only admin functions
- ✅ Non-zero address validation
- ✅ Safe call() pattern for transfers

### Frontend Security
- ✅ Always verify wallet connection
- ✅ Check network/chain ID
- ✅ Validate user address
- ✅ Handle transaction errors gracefully
- ✅ Show clear confirmation dialogs

### Best Practices
- ✅ Don't reveal private keys
- ✅ Use only secure RPC endpoints
- ✅ Set proper gas limits
- ✅ Validate smart contract address
- ✅ Test on testnet before mainnet

---

## 📊 Gas Estimates (Base Sepolia)

| Operation | Estimated Gas | Est. Cost (0.00001 Gwei) |
|-----------|---------------|--------------------------|
| Create Listing | ~45,000 | ~$0.01 |
| Buy Listing | ~60,000 | ~$0.02 |
| Cancel Listing | ~30,000 | ~$0.01 |
| Upgrade Level | ~35,000 | ~$0.01 |

---

## 🚨 Troubleshooting

### "Missing authorization header" on listings endpoint
→ Ensure wallet is connected before viewing marketplace

### Transaction rejected in wallet
→ Check you have enough ETH for gas
→ Verify correct network (Base Sepolia)
→ Check contract address is correct

### Contract address shows "0x..."
→ Deploy contract and add address to `.env`

### Listing not appearing for other players
→ Wait for blockchain confirmation (5-10 seconds)
→ Refresh page to reload from database

### Gas estimation failed
→ Ensure wallet has enough ETH
→ Check contract address validity
→ Verify RPC endpoint is working

---

## 🔗 Useful Links

- [Ethers.js Docs](https://docs.ethers.org/v6/)
- [Base Network Docs](https://docs.base.org/)
- [MetaMask Developer](https://docs.metamask.io/guide/dapp-integration.html)
- [wagmi Hooks](https://wagmi.sh/)
- [Coinbase OnchainKit](https://onchainkit.xyz/)

---

## 📦 Next Steps

1. Deploy smart contract to Base Sepolia
2. Add contract address to `.env` files
3. Integrate `useMarketplaceWeb3` hook into MarketPlace component
4. Update API endpoints to sync blockchain and database
5. Test on testnet
6. Deploy to production

---

## 💡 Future Enhancements

- [ ] Auction system with time-based bidding
- [ ] Bulk trading (trade multiple Pokémon at once)
- [ ] Staking mechanism for marketplace rewards
- [ ] NFT integration for Pokémon ownership
- [ ] Advanced filtering and search
- [ ] Transaction history viewer
- [ ] Reputation/trust system for traders
- [ ] Multi-signature escrow for large trades
