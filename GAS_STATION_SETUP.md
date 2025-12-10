# Gas Station Setup - Platform Pays Gas Fees

## 🎯 Problem

User wallets don't have ETH to pay gas fees for withdrawals. We need the **platform to pay gas fees** instead.

---

## 💡 Solution: Two Approaches

### **Approach 1: Pre-Fund User Wallets** (Simple, Expensive)

Send ETH to each user wallet when created.

**Pros:**
- ✅ Simple to implement
- ✅ Works immediately
- ✅ User has full control

**Cons:**
- ❌ Expensive (~$3 per wallet)
- ❌ Wasted ETH if user never withdraws
- ❌ Need to maintain ETH reserves

---

### **Approach 2: Gas Station** (Recommended)

Platform wallet pays gas, user only needs USDC.

**Pros:**
- ✅ No wasted ETH
- ✅ Better user experience
- ✅ More cost-effective at scale

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Platform needs ETH reserves
- ⚠️ Requires USDC approval mechanism

---

## 🚀 Quick Setup: Pre-Fund User Wallets (Approach 1)

This is the **simplest solution** to get started quickly.

### Step 1: Create Platform Wallet

**Using MetaMask:**
1. Install MetaMask
2. Create new wallet or use existing
3. Switch to Base network
4. Copy wallet address
5. Export private key (Account details → Export private key)

**Or generate programmatically:**
```bash
node -e "const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts'); const pk = generatePrivateKey(); const account = privateKeyToAccount(pk); console.log('Address:', account.address); console.log('Private Key:', pk);"
```

### Step 2: Fund Platform Wallet

Send ETH to your platform wallet address:

**How much ETH?**
- For 100 users: ~0.01 ETH (~$30)
- Each user gets: 0.0001 ETH (~$0.30)
- Enough for ~10 withdrawals per user
- Each withdrawal costs: ~0.00001 ETH (~$0.03) on Base L2

**How to get ETH on Base:**
1. **Bridge from Ethereum:** https://bridge.base.org
2. **Buy on Coinbase:** Withdraw to Base network
3. **Swap on Uniswap:** USDC → ETH on Base

### Step 3: Add Platform Wallet to Supabase

```bash
# Set platform wallet private key
supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Verify
supabase secrets list
```

**⚠️ SECURITY:**
- Never commit to git
- Backup securely
- This wallet holds real ETH

### Step 4: Update Wallet Generation Function

Add this to `supabase/functions/generate-wallet/index.ts`:

```typescript
// After creating user wallet, send them ETH for gas
const platformWalletPK = Deno.env.get('PLATFORM_WALLET_PRIVATE_KEY');

if (platformWalletPK) {
  try {
    const platformAccount = privateKeyToAccount(platformWalletPK as `0x${string}`);
    const walletClient = createWalletClient({
      account: platformAccount,
      chain,
      transport: http(rpcUrl),
    });

    // Send 0.0001 ETH to new user wallet
    // Base L2 gas is cheap: ~$0.03 per withdrawal
    // 0.0001 ETH (~$0.30) = enough for ~10 withdrawals
    const hash = await walletClient.sendTransaction({
      to: address as Address,
      value: parseEther('0.0001'), // 0.0001 ETH for gas
    });

    console.log(`Sent 0.0001 ETH to ${address}, tx: ${hash}`);
  } catch (error) {
    console.error('Failed to send ETH to new wallet:', error);
    // Don't fail wallet creation if ETH transfer fails
  }
}
```

### Step 5: Deploy

```bash
supabase functions deploy generate-wallet
```

**Done!** New wallets will automatically receive 0.001 ETH for gas fees.

---

## 💰 Cost Analysis

### Pre-Fund Approach:

| Users | ETH per User | Total ETH | Cost (ETH @ $3000) |
|-------|--------------|-----------|-------------------|
| 100 | 0.0001 | 0.01 | **$30** |
| 1,000 | 0.0001 | 0.1 | **$300** |
| 10,000 | 0.0001 | 1.0 | **$3,000** |

**Per User Cost: $0.30** (not $3!)

**Why so cheap?**
- Base is a Layer 2 (L2) blockchain
- Gas fees are 100x cheaper than Ethereum mainnet
- Each withdrawal: ~$0.03
- 0.0001 ETH = ~10 withdrawals per user

**Ongoing costs:**
- Monitor platform wallet balance
- Refill when low
- ~$0.30 per new user

---

## 🔧 Advanced: Gas Station (Approach 2)

For a more sophisticated solution where platform pays gas without pre-funding:

### How It Works:

1. User requests withdrawal
2. User approves platform to spend their USDC
3. Platform wallet transfers USDC from user → destination
4. Platform pays gas fee
5. Deduct gas cost from user's USDC balance

### Implementation:

This requires:
- USDC approval mechanism
- Gas estimation
- Two-step withdrawal process

**See:** `GAS_STATION_ADVANCED.md` for full implementation (coming soon)

---

## 📊 Monitoring Platform Wallet

### Check Balance:

```bash
# Using cast (from Foundry)
cast balance YOUR_PLATFORM_WALLET_ADDRESS --rpc-url https://mainnet.base.org

# Or using curl
curl https://mainnet.base.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["YOUR_PLATFORM_WALLET_ADDRESS","latest"],"id":1}'
```

### Set Up Alerts:

Monitor platform wallet balance and alert when low:

```sql
-- Create a monitoring function
CREATE OR REPLACE FUNCTION check_platform_wallet_balance()
RETURNS void AS $$
-- Add logic to check balance and send alert
$$ LANGUAGE plpgsql;

-- Schedule to run daily
SELECT cron.schedule(
  'check-platform-balance',
  '0 0 * * *', -- Daily at midnight
  'SELECT check_platform_wallet_balance()'
);
```

---

## ⚠️ Security Best Practices

### Platform Wallet Security:

1. **Separate Wallets:**
   - One for gas fees (small amount)
   - One for platform earnings (larger amount)
   - Transfer earnings regularly

2. **Limit Exposure:**
   - Keep minimum ETH needed
   - Refill regularly rather than holding large amounts

3. **Monitor Activity:**
   - Log all transactions
   - Alert on unusual activity
   - Regular audits

4. **Backup:**
   - Store private key in password manager
   - Offline backup in safe
   - Share with trusted team member

---

## 🧪 Testing

### Test Pre-Funding:

1. Create test wallet
2. Check it receives ETH
3. Try withdrawal
4. Verify gas is paid

```bash
# Check user wallet balance
cast balance USER_WALLET_ADDRESS --rpc-url https://mainnet.base.org
```

Should show ~0.001 ETH

---

## 📋 Quick Setup Checklist

- [ ] Created platform wallet (MetaMask or programmatic)
- [ ] Funded platform wallet with ETH (0.1 ETH minimum)
- [ ] Added `PLATFORM_WALLET_PRIVATE_KEY` to Supabase secrets
- [ ] Updated `generate-wallet` function to send ETH
- [ ] Deployed updated function
- [ ] Tested wallet creation receives ETH
- [ ] Tested withdrawal works
- [ ] Set up balance monitoring
- [ ] Backed up platform wallet private key

---

## 🎯 Recommended Setup for Launch

**Phase 1 (Now):** Pre-fund wallets
- Quick to implement
- Works immediately
- Cost: ~$3 per user

**Phase 2 (Later):** Optimize
- Implement gas station
- Reduce costs
- Better scalability

---

## 📞 Quick Commands

```bash
# 1. Set platform wallet
supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=0xYOUR_KEY

# 2. Verify
supabase secrets list

# 3. Deploy
supabase functions deploy generate-wallet

# 4. Test - create new wallet and check balance
cast balance NEW_WALLET_ADDRESS --rpc-url https://mainnet.base.org
```

**Done!** Your platform now pays gas fees for users. 🚀

