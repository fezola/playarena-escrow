# Platform Wallet Setup - Complete Guide

## 🎯 What You Need

A **platform wallet** that holds ETH to pay gas fees for user withdrawals.

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Platform Wallet

**Option A: Use MetaMask (Easiest)**
1. Install MetaMask browser extension
2. Create new wallet or use existing
3. Switch to Base network
4. Copy the wallet address
5. Export private key:
   - Click 3 dots → Account details → Export private key
   - Enter password
   - Copy the private key (starts with `0x`)

**Option B: Generate Programmatically**
```bash
# Install viem if needed
npm install viem

# Generate wallet
node -e "const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts'); const pk = generatePrivateKey(); const account = privateKeyToAccount(pk); console.log('Address:', account.address); console.log('Private Key:', pk);"
```

**⚠️ SAVE THESE:**
- Platform Wallet Address: `0x...`
- Platform Wallet Private Key: `0x...`

---

### Step 2: Fund Platform Wallet with ETH

Send ETH to your platform wallet address on Base network.

**How much ETH?**
- **For 100 users:** 0.01 ETH (~$30) - Gives each user 0.0001 ETH
- **For 1,000 users:** 0.1 ETH (~$300) - Gives each user 0.0001 ETH
- **Each user gets:** 0.0001 ETH (~$0.30) - Enough for ~10 withdrawals
- **Each withdrawal costs:** ~0.00001 ETH (~$0.03) on Base L2

**How to get ETH on Base:**

**Option 1: Bridge from Ethereum**
1. Go to https://bridge.base.org
2. Connect your wallet
3. Bridge ETH from Ethereum → Base
4. Send to your platform wallet address

**Option 2: Buy on Coinbase**
1. Buy ETH on Coinbase
2. Withdraw → Select "Base" network
3. Send to your platform wallet address

**Option 3: Swap on Base**
1. Go to https://app.uniswap.org
2. Connect wallet on Base network
3. Swap USDC → ETH
4. Send to platform wallet address

---

### Step 3: Add Platform Wallet to Supabase

```bash
# Set platform wallet private key as Supabase secret
supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Verify it's set
supabase secrets list
```

**Should see:**
```
WALLET_ENCRYPTION_KEY
NETWORK
BASE_RPC_URL
PLATFORM_WALLET_PRIVATE_KEY  ← New!
```

**⚠️ SECURITY:**
- Never commit this to git
- Never share this key
- Backup securely (password manager + offline)

---

### Step 4: Deploy Updated Functions

```bash
# Deploy wallet generation (now pre-funds with ETH)
supabase functions deploy generate-wallet

# Verify deployment
supabase functions list
```

---

### Step 5: Test It Works

```bash
# Create a test wallet (in your app)
# 1. Sign up / Login
# 2. Go to Profile → Create Wallet
# 3. Check the wallet receives 0.001 ETH

# Or check manually:
# Install cast (from Foundry): https://book.getfoundry.sh/getting-started/installation
cast balance YOUR_NEW_WALLET_ADDRESS --rpc-url https://mainnet.base.org
```

**Expected:** `0.000100000000000000` (0.0001 ETH = $0.30)

---

## ✅ What Happens Now

### When User Creates Wallet:
1. System generates Ethereum wallet
2. Encrypts private key
3. Saves to database
4. **Platform wallet sends 0.0001 ETH to user wallet** ← NEW!
5. User can now withdraw without needing to buy ETH

### When User Withdraws:
1. User has USDC in wallet
2. User has 0.0001 ETH for gas (from platform)
3. Withdrawal transaction uses ~0.00001 ETH for gas
4. USDC sent to destination
5. ✅ Works! User can withdraw ~10 times

---

## 💰 Cost Analysis

| Users | ETH per User | Total ETH Needed | Cost @ $3000/ETH |
|-------|--------------|------------------|------------------|
| 100 | 0.0001 | 0.01 | **$30** |
| 1,000 | 0.0001 | 0.1 | **$300** |
| 10,000 | 0.0001 | 1.0 | **$3,000** |

**Per User Cost:**
- **$0.30 per user** (0.0001 ETH)
- Enough for ~10 withdrawals
- Each withdrawal: ~$0.03 gas

**Why so cheap?**
- Base is a Layer 2 (L2) blockchain
- Gas fees are 100x cheaper than Ethereum mainnet
- Typical transaction: $0.01 - $0.05

---

## 📊 Monitor Platform Wallet

### Check Balance:

**Using cast (Foundry):**
```bash
cast balance YOUR_PLATFORM_WALLET_ADDRESS --rpc-url https://mainnet.base.org
```

**Using curl:**
```bash
curl https://mainnet.base.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["YOUR_PLATFORM_WALLET_ADDRESS","latest"],
    "id":1
  }'
```

### Set Up Alerts:

Create a monitoring script to alert when balance is low:

```typescript
// Check platform wallet balance daily
const balance = await publicClient.getBalance({
  address: platformWalletAddress
});

const balanceInEth = Number(balance) / 1e18;

if (balanceInEth < 0.01) {
  // Send alert (email, Slack, etc.)
  console.error('⚠️ Platform wallet low on ETH!');
  console.error(`Current balance: ${balanceInEth} ETH`);
}
```

---

## 🔒 Security Best Practices

### 1. Separate Wallets
- **Gas Wallet:** Holds ETH for gas (this one)
- **Treasury Wallet:** Holds platform earnings (separate)
- Transfer earnings regularly to treasury

### 2. Limit Exposure
- Keep minimum ETH needed (~0.05 ETH)
- Refill regularly rather than holding large amounts
- If hacked, only lose gas funds, not earnings

### 3. Monitor Activity
- Log all ETH transfers
- Alert on unusual activity
- Regular audits

### 4. Backup
- Store private key in password manager
- Offline backup in safe
- Share with trusted team member (encrypted)

---

## 🧪 Testing Checklist

- [ ] Created platform wallet
- [ ] Funded with 0.01+ ETH on Base
- [ ] Added `PLATFORM_WALLET_PRIVATE_KEY` to Supabase
- [ ] Deployed `generate-wallet` function
- [ ] Created test user wallet
- [ ] Verified test wallet received 0.001 ETH
- [ ] Tested withdrawal works
- [ ] Set up balance monitoring

---

## ⚠️ Troubleshooting

### Issue: New wallets not receiving ETH

**Check:**
1. Platform wallet has ETH:
   ```bash
   cast balance PLATFORM_WALLET_ADDRESS --rpc-url https://mainnet.base.org
   ```

2. Secret is set:
   ```bash
   supabase secrets list
   ```
   Should show `PLATFORM_WALLET_PRIVATE_KEY`

3. Function logs:
   ```bash
   supabase functions logs generate-wallet
   ```
   Look for "Sent 0.001 ETH" message

### Issue: Platform wallet running out of ETH

**Solution:** Refill platform wallet
```bash
# Send more ETH to platform wallet address
# Recommended: 0.05 ETH at a time
```

---

## 📋 Complete Setup Commands

```bash
# 1. Generate platform wallet (or use MetaMask)
node -e "const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts'); const pk = generatePrivateKey(); const account = privateKeyToAccount(pk); console.log('Address:', account.address); console.log('Private Key:', pk);"

# 2. Fund platform wallet with ETH (use bridge or exchange)
# Send 0.05 ETH to the address from step 1

# 3. Set Supabase secret
supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# 4. Verify
supabase secrets list

# 5. Deploy
supabase functions deploy generate-wallet

# 6. Test - create wallet in app and check balance
cast balance NEW_USER_WALLET --rpc-url https://mainnet.base.org
```

---

## 🎯 Summary

**What you did:**
1. ✅ Created platform wallet
2. ✅ Funded it with ETH (~$30-150)
3. ✅ Added private key to Supabase
4. ✅ Deployed updated function

**What happens now:**
- ✅ New users get 0.001 ETH automatically
- ✅ Users can withdraw without buying ETH
- ✅ Platform pays ~$3 per user for gas
- ✅ Better user experience

**Next steps:**
- Monitor platform wallet balance
- Refill when low
- Set up alerts

**Done!** Your platform now pays gas fees for users. 🚀

---

## 📚 Related Docs

- **[GAS_STATION_SETUP.md](GAS_STATION_SETUP.md)** - Detailed gas station guide
- **[MAINNET_SETUP.md](MAINNET_SETUP.md)** - Production deployment
- **[REQUIRED_SETUP_CHECKLIST.md](REQUIRED_SETUP_CHECKLIST.md)** - Complete setup checklist

