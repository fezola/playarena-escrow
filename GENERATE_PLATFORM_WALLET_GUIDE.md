# Generate Platform Wallet - Complete Guide

## 🎯 What This Does

Generates a **secure Ethereum wallet** for your platform to pay gas fees for user withdrawals.

---

## 🚀 Quick Start (5 Steps)

### **Step 1: Install Dependencies**

```bash
npm install
```

This installs `viem` and `tsx` needed for the script.

---

### **Step 2: Run the Generation Script**

```bash
npm run generate-platform-wallet
```

**What happens:**
- ✅ Generates cryptographically secure private key
- ✅ Derives Ethereum address
- ✅ Creates backup file in `backups/`
- ✅ Displays wallet information
- ✅ Shows next steps

---

### **Step 3: Save the Output**

You'll see output like:

```
============================================================
✅ Platform Wallet Generated Successfully!
============================================================

Wallet Address:
  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

Private Key:
  0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

📁 Backup file created:
  /path/to/backups/platform-wallet-2025-12-10T12-00-00-000Z.json
```

**⚠️ CRITICAL - Save These Immediately:**

1. **Password Manager** (1Password, LastPass, Bitwarden)
   - Create entry: "PlayArena Platform Wallet"
   - Save both address and private key

2. **Offline Backup**
   - Write on paper, store in safe
   - Or encrypted USB drive

3. **Backup File**
   - The JSON file in `backups/` directory
   - Encrypt it or store securely
   - **Never commit to git!**

---

### **Step 4: Add to Supabase Secrets**

```bash
# Copy the private key from the output
supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Verify it's set
supabase secrets list
```

**Expected output:**
```
WALLET_ENCRYPTION_KEY
NETWORK
BASE_RPC_URL
PLATFORM_WALLET_PRIVATE_KEY  ← Should see this!
```

---

### **Step 5: Fund the Wallet**

Send ETH to the **Wallet Address** on Base network.

**How much to send:**
- **For 100 users:** 0.01 ETH (~$30)
- **For 1,000 users:** 0.1 ETH (~$300)
- **For 10,000 users:** 1 ETH (~$3,000)

**How to get ETH on Base:**

#### **Option A: Bridge from Ethereum**
1. Go to https://bridge.base.org
2. Connect your wallet (MetaMask)
3. Bridge ETH from Ethereum → Base
4. Send to your platform wallet address

#### **Option B: Coinbase**
1. Buy ETH on Coinbase
2. Withdraw → Select "Base" network
3. Paste your platform wallet address
4. Send

#### **Option C: Swap on Base**
1. Go to https://app.uniswap.org
2. Connect wallet on Base network
3. Swap USDC → ETH
4. Send to platform wallet address

---

## ✅ Verify Everything Works

### **1. Check Wallet Balance**

```bash
# Using cast (from Foundry)
cast balance YOUR_PLATFORM_WALLET_ADDRESS --rpc-url https://mainnet.base.org

# Or using the script (it checks automatically)
npm run generate-platform-wallet
```

**Expected:** Should show your ETH balance

---

### **2. Deploy Updated Function**

```bash
supabase functions deploy generate-wallet
```

---

### **3. Test with New User**

1. Create a test user in your app
2. Go to Profile → Create Wallet
3. Check the logs:
   ```bash
   supabase functions logs generate-wallet --tail
   ```
   
   Look for:
   ```
   ✅ Sent 0.0001 ETH to 0x..., tx: 0x...
   ```

4. Verify the new wallet received ETH:
   ```bash
   cast balance NEW_USER_WALLET_ADDRESS --rpc-url https://mainnet.base.org
   ```
   
   **Expected:** `100000000000000` (0.0001 ETH)

---

## 🔒 Security Checklist

- [ ] Ran `npm run generate-platform-wallet`
- [ ] Saved private key in password manager
- [ ] Saved private key on paper (offline backup)
- [ ] Backup file encrypted or stored securely
- [ ] Added `PLATFORM_WALLET_PRIVATE_KEY` to Supabase secrets
- [ ] Verified secret is set (`supabase secrets list`)
- [ ] Verified `backups/` is in `.gitignore`
- [ ] **Never committed backup file to git**
- [ ] Funded platform wallet with ETH on Base
- [ ] Verified platform wallet balance
- [ ] Deployed `generate-wallet` function
- [ ] Tested with new user wallet
- [ ] Verified new user received 0.0001 ETH

---

## 🚨 Security Warnings

### **DO NOT:**
- ❌ Commit backup file to git
- ❌ Share private key in Slack/Discord/Email
- ❌ Store in plain text files
- ❌ Screenshot and share
- ❌ Leave backup file unencrypted

### **DO:**
- ✅ Use password manager
- ✅ Encrypt backup file
- ✅ Store offline backup
- ✅ Keep multiple backups
- ✅ Test before funding heavily
- ✅ Monitor wallet balance regularly

---

## 📊 Cost Breakdown

| Action | Cost |
|--------|------|
| **Generate wallet** | Free |
| **Fund wallet (100 users)** | 0.01 ETH (~$30) |
| **Per user gas** | 0.0001 ETH (~$0.30) |
| **Per withdrawal** | ~0.00001 ETH (~$0.03) |

**Total for 100 users:** ~$30 (one-time)

---

## 🔍 Troubleshooting

### **Issue: Script won't run**

**Error:** `Cannot find module 'viem'`

**Solution:**
```bash
npm install
```

---

### **Issue: Backup file not created**

**Solution:** Check you have write permissions in the project directory.

---

### **Issue: Can't check balance**

**Error:** `Network error checking balance`

**Solution:** This is normal if you haven't funded the wallet yet. The wallet is still valid.

---

### **Issue: New users not receiving ETH**

**Check:**
1. Platform wallet has ETH:
   ```bash
   cast balance PLATFORM_WALLET_ADDRESS --rpc-url https://mainnet.base.org
   ```

2. Secret is set:
   ```bash
   supabase secrets list
   ```

3. Function logs:
   ```bash
   supabase functions logs generate-wallet
   ```

---

## 📋 Complete Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate platform wallet
npm run generate-platform-wallet

# 3. Save the output (address and private key)
# - Password manager
# - Paper backup
# - Backup file

# 4. Add to Supabase
supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=0xYOUR_KEY

# 5. Verify
supabase secrets list

# 6. Fund wallet (send ETH to the address on Base)
# Use bridge.base.org or Coinbase

# 7. Check balance
cast balance YOUR_ADDRESS --rpc-url https://mainnet.base.org

# 8. Deploy function
supabase functions deploy generate-wallet

# 9. Test - create user wallet in app
# Should receive 0.0001 ETH automatically
```

---

## ✅ Summary

**What you did:**
1. ✅ Generated secure platform wallet with proper script
2. ✅ Backed up private key securely
3. ✅ Added to Supabase secrets
4. ✅ Funded with ETH on Base
5. ✅ Deployed updated function

**What happens now:**
- ✅ New users get 0.0001 ETH automatically
- ✅ Users can withdraw without buying ETH
- ✅ Platform pays ~$0.30 per user
- ✅ Each user can make ~10 withdrawals

**Next:**
- Monitor platform wallet balance
- Refill when low
- Set up alerts

**Done!** Your platform wallet is ready. 🚀

---

## 📚 Related Documentation

- **[scripts/README.md](scripts/README.md)** - Script documentation
- **[PLATFORM_WALLET_SETUP_SUMMARY.md](PLATFORM_WALLET_SETUP_SUMMARY.md)** - Platform wallet overview
- **[GAS_STATION_SETUP.md](GAS_STATION_SETUP.md)** - Gas station details

