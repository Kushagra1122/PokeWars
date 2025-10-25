# Ethers.js v5 API Testing Plan

## ✅ Environment Status
- **Client:** Running on http://localhost:5173
- **Server:** Should be running on http://localhost:4000
- **Network:** Base Sepolia (chainId: 84532)

---

## 🧪 Test Cases

### **Test 1: Stake Parsing (ethers.utils.parseEther)**
**Location:** `GameSettings.jsx` line 56

**Steps:**
1. Navigate to dashboard: http://localhost:5173/dashboard
2. Click "Create Lobby"
3. Set game to **"Rated"**
4. Set stake to **0.0001 ETH**
5. Wait for second player to join
6. Click **"Start"**

**Expected Result:**
- ✅ No error: `ethers.parseEther is not a function`
- ✅ Wallet prompts for transaction approval
- ✅ Console log shows: `Creating match with opponent: {...}`

**What's Being Tested:**
```javascript
const stakeWei = ethers.utils.parseEther(gameSettings.stake.toString());
```

---

### **Test 2: Provider Creation (ethers.providers.Web3Provider)**
**Location:** `GameSettings.jsx` line 36, `Game.jsx` line 44

**Steps:**
1. Continue from Test 1
2. Observe wallet connection

**Expected Result:**
- ✅ No error: `ethers.BrowserProvider is not a constructor`
- ✅ Signer is created successfully
- ✅ Transaction can be signed

**What's Being Tested:**
```javascript
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
```

---

### **Test 3: EIP-712 Signature (signer._signTypedData)**
**Location:** `Game.jsx` line 138, `MatchEscrowService.js` line 102

**Steps:**
1. Complete a match (play to end)
2. Click "Settle Match"
3. Wallet prompts for signature

**Expected Result:**
- ✅ No error: `signer.signTypedData is not a function`
- ✅ Wallet shows EIP-712 typed data for signing
- ✅ Signature is created and submitted
- ✅ Console shows: `Signing result...`

**What's Being Tested:**
```javascript
const signature = await signer._signTypedData(domain, types, message);
```

---

### **Test 4: Chain ID Retrieval (getNetwork)**
**Location:** `MatchEscrowService.js` line 69-70

**Steps:**
1. During Test 3, check console logs
2. Look for domain/chainId information

**Expected Result:**
- ✅ ChainId is correctly set to `84532` (Base Sepolia)
- ✅ No error about `getNetwork()`
- ✅ Domain structure is valid

**What's Being Tested:**
```javascript
const network = await signer.provider.getNetwork();
const chainId = network.chainId;
```

---

## 🎯 Quick Test Checklist

Open browser console (F12) and check for these errors:

- [ ] ❌ `ethers.parseEther is not a function` → Should NOT appear
- [ ] ❌ `ethers.BrowserProvider is not a constructor` → Should NOT appear
- [ ] ❌ `signer.signTypedData is not a function` → Should NOT appear
- [ ] ✅ No TypeErrors related to ethers
- [ ] ✅ Wallet prompts appear correctly
- [ ] ✅ Transactions can be signed

---

## 🔍 Manual Testing Steps

### **Setup (Do Once)**
1. Open http://localhost:5173
2. Login with **gary_oak** account
3. Connect wallet (Coinbase Wallet recommended)
4. Ensure wallet is on **Base Sepolia** network
5. Check balance > 0.001 ETH

### **Full Flow Test**
```bash
1. Dashboard → Create Lobby
2. Set: Rated ✅, Stake: 0.0001 ETH, Time: 3 min
3. Copy lobby code
4. Open incognito window → Login as spkap → Join lobby
5. [gary_oak] Click "Start" 
   → Test 1 & 2: Should prompt wallet (createMatch)
6. [spkap] Approve join 
   → Should prompt wallet (joinMatch)
7. Play game to completion
8. [Winner] Click "Settle Match" 
   → Test 3 & 4: Should prompt wallet (EIP-712 signature)
9. Check transaction on Base Sepolia explorer
```

---

## 📊 Expected Console Output

### **When Clicking "Start":**
```javascript
Creating match with opponent: {id: '...', name: 'spkap', ...}
Stake in wei: 100000000000000 // 0.0001 ETH
Escrow created: 0x... // Transaction hash
```

### **When Settling Match:**
```javascript
Signing result...
Message hash: 0x...
Submitting to blockchain...
Settlement complete!
Winner receives: 0.0002 ETH
```

---

## ❌ Errors You Should NOT See

1. ❌ `TypeError: ethers.parseEther is not a function`
2. ❌ `TypeError: ethers.BrowserProvider is not a constructor`
3. ❌ `TypeError: signer.signTypedData is not a function`
4. ❌ `TypeError: Cannot read properties of undefined`
5. ❌ Any ethers-related TypeError

---

## ✅ What Success Looks Like

### **Test 1 Pass:**
```javascript
✅ Stake parsed correctly: 100000000000000 wei
✅ No parseEther error
```

### **Test 2 Pass:**
```javascript
✅ Provider created
✅ Signer obtained
✅ Wallet prompts for signature
```

### **Test 3 Pass:**
```javascript
✅ EIP-712 signature created
✅ Typed data shown in wallet
✅ Signature submitted to server
```

### **Test 4 Pass:**
```javascript
✅ ChainId: 84532 (Base Sepolia)
✅ Domain verified
✅ Contract address correct
```

---

## 🐛 If You See Errors

### **Still seeing ethers errors?**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear Vite cache: `rm -rf client/node_modules/.vite`
3. Restart dev server: `npm run dev`

### **Wallet not prompting?**
1. Check network is Base Sepolia
2. Check wallet is unlocked
3. Check sufficient ETH balance
4. Check console for error details

### **Signature fails?**
1. Check signer is not null
2. Check typed data structure
3. Check contract address is configured
4. Verify EIP-712 domain matches contract

---

## 📝 Test Results Template

Copy this and fill it out:

```
Date: 2025-10-24
Tester: [Your Name]
Browser: [Chrome/Firefox/Safari]
Wallet: [Coinbase Wallet/MetaMask]

Test 1 (parseEther): [ ] PASS / [ ] FAIL
  - Error seen: ___________
  - Transaction hash: ___________

Test 2 (Provider): [ ] PASS / [ ] FAIL
  - Error seen: ___________

Test 3 (EIP-712): [ ] PASS / [ ] FAIL
  - Error seen: ___________
  - Signature: ___________

Test 4 (ChainId): [ ] PASS / [ ] FAIL
  - ChainId detected: ___________

Overall: [ ] ALL PASS / [ ] SOME FAIL
```

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Mark ethers.js migration complete
2. ✅ Update GATE_CHECK_REPORT.md
3. ✅ Proceed to full E2E test with real transactions
4. ✅ Collect 3 tx hashes for audit:
   - createMatch tx
   - joinMatch tx
   - submitResult tx

---

**Current Status:** 🧪 Ready for Testing  
**Start Here:** http://localhost:5173/dashboard

Good luck! 🎮

