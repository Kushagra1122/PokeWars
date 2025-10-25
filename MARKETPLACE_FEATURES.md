# Pokémon Marketplace Features

## Overview
The Pokémon Marketplace has been completely enhanced with a full trading system, level upgrades, and multi-tab interface for buying, selling, and browsing listings.

---

## 🎯 Key Features Implemented

### 1. **ETH Pricing System**
- All Pokémon now have ETH prices (default: 0.5 ETH)
- Prices are fully configurable in the database
- Real-time price display in the marketplace UI
- Support for decimal pricing (e.g., 0.75 ETH)

### 2. **Marketplace Tabs**

#### Buy Tab
- Browse all available Pokémon for purchase
- Filter by Name, Price, or Type
- Display Pokémon with sprite, type, base stats, and ETH price
- One-click purchase functionality
- User balance tracking

#### Your Collection Tab
- View all owned Pokémon
- Display each Pokémon's current level
- **Sell Option**: List Pokémon for sale at custom prices
- **Upgrade Option**: Increase Pokémon levels (cost: 0.1 ETH per level)
- Show active listings with "On Sale" badge
- Cancel listings to get Pokémon back

#### Marketplace Listings Tab
- Browse Pokémon listed for sale by other players
- View seller name for each listing
- Show Pokémon level
- Display asking price in ETH
- Purchase from other players
- Filter out own listings automatically

### 3. **Pokemon Selling System**
- **List for Sale Modal**:
  - Select any Pokémon from collection
  - Enter custom ETH price
  - Minimum price: 0.01 ETH
  - Show Pokémon details (name, level, type)
  
- **Marketplace Listings**:
  - Seller name displayed on each listing
  - Pokémon level shown
  - Current price in ETH
  - Prevent selling same Pokémon twice
  - Can cancel active listings anytime

### 4. **Level Upgrade System**
- **Upgrade Cost**: 0.1 ETH per level
- **Maximum Level**: 50
- **Level Display**: Shown throughout the UI (collection, listings, marketplace)
- **Upgrade Modal**:
  - Shows current level → new level
  - Display upgrade cost
  - Show current user balance
  - Prevent upgrade if balance insufficient or max level reached

### 5. **Transaction System**
- **Buying from Marketplace**:
  - Verify buyer has sufficient balance
  - Check buyer doesn't already own the Pokémon
  - Deduct price from buyer's balance
  - Add price to seller's balance
  - Transfer Pokémon to buyer
  - Remove Pokémon from seller's collection
  - Mark listing as "sold"

- **Balance Tracking**:
  - Display user balance in header (ETH)
  - Initial balance: 1.0 ETH
  - Real-time updates after transactions

---

## 📊 Database Schema

### Pokemon Model
```javascript
{
  name: String,           // Pokémon name
  type: String,          // Type (Fire, Water, etc.)
  baseStats: Object,     // shootRange, shootPerMin, hitPoints, speed
  sprite: String,        // Image URL
  isFirstClaim: Boolean, // First claim flag
  price: Number          // ETH price (default: 0.5)
}
```

### User Model
```javascript
{
  name: String,
  passwordHash: String,
  pokemon: [
    {
      pokemonId: ObjectId,
      level: Number (1-50)
    }
  ],
  address: String,       // Web3 address
  basename: String,      // ENS/Basename
  balance: Number,       // ETH balance (default: 1.0)
  experience: Number     // Experience points (for future)
}
```

### Listing Model (New)
```javascript
{
  sellerId: ObjectId,           // Seller reference
  pokemon: {
    pokemonId: ObjectId,        // Pokémon being sold
    level: Number               // Level at time of listing
  },
  price: Number,                // ETH asking price
  status: String,               // 'active', 'sold', 'cancelled'
  createdAt: Date,              // Listing creation time
  soldTo: ObjectId              // Buyer reference (if sold)
}
```

---

## 🔌 API Endpoints

### GET `/api/pokemon`
Get all available Pokémon for purchase

### POST `/api/pokemon/list-for-sale`
List a Pokémon for sale
- Body: `{ pokemonId, price }`
- Auth: Required

### GET `/api/pokemon/listings`
Get all active marketplace listings
- Returns: Array of listings with seller and Pokémon details

### POST `/api/pokemon/buy-from-listing`
Purchase a Pokémon from a listing
- Body: `{ listingId }`
- Auth: Required

### POST `/api/pokemon/upgrade-level`
Upgrade a Pokémon's level
- Body: `{ pokemonId }`
- Auth: Required
- Cost: 0.1 ETH per level

### GET `/api/pokemon/my-listings`
Get current user's active listings
- Auth: Required

### POST `/api/pokemon/cancel-listing`
Cancel an active listing
- Body: `{ listingId }`
- Auth: Required

---

## 🎨 UI/UX Features

### Beautiful Design Elements
- **Gradient Backgrounds**: Color-coded tabs (emerald for buy, blue for collection, pink for marketplace)
- **Smooth Animations**: Floating Pokémon sprites, hover effects, loading spinners
- **Responsive Layout**: Grid system adapts to screen size (1-4 columns)
- **Modal Dialogs**: Sell and Upgrade confirmations with preview
- **Status Badges**: "On Sale", "Listed", "Max Level" indicators
- **Real-time Feedback**: Success/error messages with auto-dismiss

### Interactive Elements
- Toggle "Show My Active Listings" button
- Sort options (Name, Price, Type)
- Disabled states for impossible actions
- Balance display with live updates
- Seller name tags on marketplace listings

---

## 🔒 Security Features

1. **Authorization Checks**: All transaction endpoints require authentication
2. **Balance Verification**: Prevent purchases/upgrades with insufficient balance
3. **Ownership Validation**: Only can sell/upgrade own Pokémon
4. **Duplicate Prevention**: Prevent buying Pokémon already owned
5. **Transaction Atomicity**: All-or-nothing updates ensure data consistency

---

## 🚀 Future Enhancements

- [ ] Smart contract integration for decentralized transactions
- [ ] Trading between players (fair exchange without money)
- [ ] Battle rewards for leveling
- [ ] Rare/Shiny Pokémon variations
- [ ] Experience system (levels increase through battles)
- [ ] Season-based leaderboards
- [ ] Auction house system
- [ ] Pokémon breeding system

---

## 📝 Usage Guide

### To Buy a Pokémon
1. Go to "Buy Pokémon" tab
2. Filter by Name, Price, or Type if needed
3. Click "Add to Team" on desired Pokémon
4. Balance will be deducted

### To Sell a Pokémon
1. Go to "Your Collection" tab
2. Click "Sell" on the Pokémon to list
3. Enter desired price in ETH
4. Pokémon appears on "Marketplace Listings" for other players
5. When sold, balance is credited to your account

### To Upgrade a Level
1. Go to "Your Collection" tab
2. Click "Upgrade" on the Pokémon
3. Costs 0.1 ETH per level
4. Maximum level is 50

### To View Marketplace Listings
1. Go to "Marketplace Listings" tab (if you own Pokémon)
2. Browse Pokémon listed by other players
3. Click "Buy" to purchase at asking price

---

## 🐛 Known Limitations

- Prices are not integrated with real ETH yet (simulated balance system)
- No transaction fees or taxes
- No dispute resolution system
- Listings don't expire (manual cancellation only)
- No bulk purchase/listing operations
