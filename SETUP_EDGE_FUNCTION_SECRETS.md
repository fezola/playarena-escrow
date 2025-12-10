# Setting Up Supabase Edge Function Secrets

## ⚠️ CRITICAL: Required Environment Variables

Your Edge Functions **will not work** without these environment variables. They must be configured in Supabase Dashboard.

---

## 🔧 How to Set Edge Function Secrets

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** (in left sidebar)
4. Click **Manage secrets** or **Add secret**

---

### Step 2: Add Required Secrets

Add these **4 critical secrets**:

#### 1. WALLET_ENCRYPTION_KEY (CRITICAL!)

```bash
# Generate a strong key first:
openssl rand -base64 32
```

Then add to Supabase:
```
Name: WALLET_ENCRYPTION_KEY
Value: <paste the generated key>
```

**⚠️ IMPORTANT:**
- Backup this key in a password manager
- If lost, all wallets are unrecoverable
- Never commit to git

---

#### 2. NETWORK

For **Base Mainnet** (production):
```
Name: NETWORK
Value: base
```

For **Base Sepolia** (testing):
```
Name: NETWORK
Value: baseSepolia
```

---

#### 3. BASE_RPC_URL

Choose one of these RPC providers:

**Option A: Public Base RPC (Free, No Signup)**
```
Name: BASE_RPC_URL
Value: https://mainnet.base.org
```

**Option B: Ankr (Free, No Signup, Better Reliability)**
```
Name: BASE_RPC_URL
Value: https://rpc.ankr.com/base
```

**Option C: Infura (Free Tier, Requires Signup)**
```
Name: BASE_RPC_URL
Value: https://base-mainnet.infura.io/v3/YOUR_API_KEY
```
Sign up at: https://infura.io

**Option D: QuickNode (Free Tier, Requires Signup)**
```
Name: BASE_RPC_URL
Value: https://your-endpoint.base.quiknode.pro/YOUR_TOKEN/
```
Sign up at: https://www.quicknode.com

**Option E: Coinbase Cloud (Base's Official Provider)**
```
Name: BASE_RPC_URL
Value: https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
```
Sign up at: https://www.coinbase.com/cloud

**For Base Sepolia (Testing):**
```
Name: BASE_RPC_URL
Value: https://sepolia.base.org
```
Or with Ankr:
```
Name: BASE_RPC_URL
Value: https://rpc.ankr.com/base_sepolia
```

---

#### 4. BASE_SEPOLIA_RPC_URL (Optional but recommended)

```
Name: BASE_SEPOLIA_RPC_URL
Value: https://sepolia.base.org
```

Or with Alchemy:
```
Name: BASE_SEPOLIA_RPC_URL
Value: https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

---

## 📋 Complete Setup Checklist

### Minimum Required (Must Have):
- [ ] `WALLET_ENCRYPTION_KEY` - Generated and backed up
- [ ] `NETWORK` - Set to `base` or `baseSepolia`
- [ ] `BASE_RPC_URL` - Set to appropriate RPC endpoint

### Auto-Provided by Supabase (Already Set):
- [x] `SUPABASE_URL` - Automatically available
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Automatically available
- [x] `SUPABASE_ANON_KEY` - Automatically available

### Optional but Recommended:
- [ ] `BASE_SEPOLIA_RPC_URL` - For easy testnet switching

---

## 🚀 Quick Setup Commands

### Option 1: Using Supabase CLI

```bash
# Set encryption key
supabase secrets set WALLET_ENCRYPTION_KEY="$(openssl rand -base64 32)"

# Set network (mainnet)
supabase secrets set NETWORK=base

# Set RPC URL (mainnet)
supabase secrets set BASE_RPC_URL=https://mainnet.base.org

# Optional: Set testnet RPC
supabase secrets set BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Option 2: Using Dashboard (Recommended)

1. Go to Supabase Dashboard → Edge Functions → Manage secrets
2. Click "Add secret" for each variable
3. Enter name and value
4. Click "Save"

---

## 🔍 Verify Secrets Are Set

### Using Supabase CLI:

```bash
# List all secrets
supabase secrets list
```

You should see:
```
WALLET_ENCRYPTION_KEY
NETWORK
BASE_RPC_URL
BASE_SEPOLIA_RPC_URL (optional)
```

### Using Dashboard:

1. Go to Edge Functions → Manage secrets
2. You should see all your secrets listed
3. Values are hidden for security

---

## 🧪 Test Edge Functions

After setting secrets, test that they work:

```bash
# Test wallet generation
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/generate-wallet \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Test deposit monitoring
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/monitor-deposits \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## ⚠️ Common Issues

### Issue: "NETWORK is not defined"

**Solution:** Set the `NETWORK` secret in Supabase Dashboard
```
Name: NETWORK
Value: base
```

### Issue: "BASE_RPC_URL is not defined"

**Solution:** Set the `BASE_RPC_URL` secret
```
Name: BASE_RPC_URL
Value: https://mainnet.base.org
```

### Issue: "Failed to decrypt private key"

**Solution:** 
1. Check `WALLET_ENCRYPTION_KEY` is set
2. Make sure it's the same key used to encrypt wallets
3. If you changed the key, old wallets won't work

### Issue: "RPC request failed"

**Solutions:**
1. Check RPC URL is correct
2. Try using Alchemy instead of public RPC
3. Check network connectivity

---

## 🎯 Recommended Configuration

### For Testing (Base Sepolia):

```bash
supabase secrets set WALLET_ENCRYPTION_KEY="$(openssl rand -base64 32)"
supabase secrets set NETWORK=baseSepolia
supabase secrets set BASE_RPC_URL=https://sepolia.base.org
```

### For Production (Base Mainnet):

```bash
# Use the SAME encryption key from testing!
supabase secrets set WALLET_ENCRYPTION_KEY="your_backed_up_key"
supabase secrets set NETWORK=base
supabase secrets set BASE_RPC_URL=https://mainnet.base.org
```

**Or with Alchemy (recommended):**

```bash
supabase secrets set BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

---

## 📊 Why These Are Needed

### WALLET_ENCRYPTION_KEY
- Encrypts/decrypts private keys
- Must be the same across all environments
- **Critical for security**

### NETWORK
- Tells Edge Functions which blockchain to use
- `base` = Base Mainnet (production)
- `baseSepolia` = Base Sepolia (testing)

### BASE_RPC_URL
- Endpoint to communicate with Base blockchain
- Used for:
  - Checking USDC balances (deposits)
  - Sending withdrawal transactions
  - Reading blockchain state

### RPC Provider Comparison

| Provider | Free? | Signup? | Rate Limit | Reliability | Best For |
|----------|-------|---------|------------|-------------|----------|
| **Public Base RPC** | ✅ Yes | ❌ No | Low | Medium | Testing, MVP |
| **Ankr** | ✅ Yes | ❌ No | Medium | Good | Production (free) |
| **Infura** | ✅ Free tier | ✅ Yes | 100k/day | Excellent | Production |
| **QuickNode** | ✅ Free tier | ✅ Yes | Varies | Excellent | Production |
| **Coinbase Cloud** | ✅ Free tier | ✅ Yes | Varies | Excellent | Production (official) |

**Recommendations:**
- **Testing/MVP:** Public Base RPC or Ankr (no signup needed)
- **Production (Free):** Ankr (best free option)
- **Production (Paid):** Infura, QuickNode, or Coinbase Cloud

---

## 🔐 Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.example` for templates
   - Add `.env` to `.gitignore`

2. **Backup encryption key securely**
   - Password manager (1Password, LastPass)
   - Offline backup (encrypted USB, paper in safe)
   - Share with trusted team member

3. **Use different keys for test/prod**
   - Test environment: One key
   - Production: Different key
   - Never mix them

4. **Rotate keys periodically**
   - Change encryption key every 6-12 months
   - Requires re-encrypting all wallets
   - Plan migration carefully

---

## ✅ Final Checklist

Before deploying Edge Functions:

- [ ] Generated encryption key with `openssl rand -base64 32`
- [ ] Backed up encryption key in 2+ secure locations
- [ ] Set `WALLET_ENCRYPTION_KEY` in Supabase
- [ ] Set `NETWORK` to `base` or `baseSepolia`
- [ ] Set `BASE_RPC_URL` to appropriate endpoint
- [ ] Verified secrets with `supabase secrets list`
- [ ] Tested Edge Functions work
- [ ] Documented which key is used for which environment

---

## 🆘 Need Help?

If secrets aren't working:

1. **Check they're set:**
   ```bash
   supabase secrets list
   ```

2. **Check Edge Function logs:**
   ```bash
   supabase functions logs generate-wallet
   supabase functions logs monitor-deposits
   supabase functions logs process-withdrawal
   ```

3. **Redeploy functions after setting secrets:**
   ```bash
   supabase functions deploy generate-wallet
   supabase functions deploy monitor-deposits
   supabase functions deploy process-withdrawal
   ```

---

## 📞 Quick Reference

**Set all secrets at once:**

```bash
# Generate and set encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "BACKUP THIS KEY: $ENCRYPTION_KEY"
supabase secrets set WALLET_ENCRYPTION_KEY="$ENCRYPTION_KEY"

# Set network and RPC
supabase secrets set NETWORK=base
supabase secrets set BASE_RPC_URL=https://mainnet.base.org

# Verify
supabase secrets list
```

**Done!** Your Edge Functions now have all required environment variables. 🎉

