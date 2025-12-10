# ✅ Required Setup Checklist

## Before Your Edge Functions Will Work

This is a **mandatory** checklist. If any item is missing, your wallet system **will not work**.

---

## 🔴 CRITICAL: Supabase Edge Function Secrets

These **must** be set in Supabase Dashboard → Edge Functions → Manage Secrets

### ✅ Step 1: Generate Encryption Key

```bash
openssl rand -base64 32
```

**Output example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6==`

**⚠️ BACKUP THIS KEY IMMEDIATELY:**
- [ ] Saved in password manager
- [ ] Saved in offline backup
- [ ] Never commit to git

---

### ✅ Step 2: Set Supabase Secrets

Go to: https://supabase.com/dashboard → Your Project → Edge Functions → Manage Secrets

**Add these 3 secrets:**

#### Secret #1: WALLET_ENCRYPTION_KEY
```
Name: WALLET_ENCRYPTION_KEY
Value: <paste your generated key>
```
- [ ] Added to Supabase
- [ ] Verified it's set

#### Secret #2: NETWORK
```
Name: NETWORK
Value: base
```
(Use `baseSepolia` for testing)
- [ ] Added to Supabase
- [ ] Verified it's set

#### Secret #3: BASE_RPC_URL
```
Name: BASE_RPC_URL
Value: https://mainnet.base.org
```
(Use `https://sepolia.base.org` for testing)
- [ ] Added to Supabase
- [ ] Verified it's set

---

### ✅ Step 3: Verify Secrets Are Set

**Using Supabase CLI:**
```bash
supabase secrets list
```

**Expected output:**
```
WALLET_ENCRYPTION_KEY
NETWORK
BASE_RPC_URL
```

**Using Dashboard:**
- Go to Edge Functions → Manage Secrets
- You should see all 3 secrets listed

- [ ] Verified all secrets are set
- [ ] No errors when listing secrets

---

## 🔵 Deploy Edge Functions

After secrets are set, deploy the functions:

```bash
# Deploy all 3 functions
supabase functions deploy generate-wallet
supabase functions deploy monitor-deposits
supabase functions deploy process-withdrawal
```

- [ ] generate-wallet deployed successfully
- [ ] monitor-deposits deployed successfully
- [ ] process-withdrawal deployed successfully

---

## 🟢 Set Up Deposit Monitoring Cron

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule deposit monitoring every minute
SELECT cron.schedule(
  'check-deposits',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-deposits',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key (from Settings → API)

**Verify it's running:**
```sql
SELECT * FROM cron.job;
```

- [ ] Cron job created
- [ ] Verified it's scheduled

---

## 🟡 Configure Frontend Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_NETWORK=base
```

- [ ] .env file created
- [ ] VITE_SUPABASE_URL set
- [ ] VITE_SUPABASE_PUBLISHABLE_KEY set
- [ ] VITE_NETWORK set

---

## 🟣 Install and Run

```bash
npm install
npm run dev
```

- [ ] Dependencies installed
- [ ] App running locally
- [ ] No errors in console

---

## 🧪 Test Everything Works

### Test 1: Create Wallet
1. Sign up / Login
2. Go to Profile
3. Click "Create Wallet"
4. Should see wallet address

- [ ] Wallet created successfully
- [ ] Wallet address displayed
- [ ] No errors in console

### Test 2: Check Edge Function Logs
```bash
supabase functions logs generate-wallet --tail
```

- [ ] No errors in logs
- [ ] Wallet generation logged

### Test 3: Test Deposit Monitoring
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-deposits \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Expected response:
```json
{
  "success": true,
  "walletsChecked": 1,
  "depositsDetected": 0
}
```

- [ ] Monitor-deposits responds
- [ ] No errors returned

---

## ❌ Common Errors and Fixes

### Error: "NETWORK is not defined"
**Fix:** Set `NETWORK` secret in Supabase Dashboard
```bash
supabase secrets set NETWORK=base
```

### Error: "BASE_RPC_URL is not defined"
**Fix:** Set `BASE_RPC_URL` secret
```bash
supabase secrets set BASE_RPC_URL=https://mainnet.base.org
```

### Error: "WALLET_ENCRYPTION_KEY is not defined"
**Fix:** Set encryption key secret
```bash
supabase secrets set WALLET_ENCRYPTION_KEY="your_key"
```

### Error: "Failed to decrypt private key"
**Fix:** Make sure you're using the same encryption key that was used to create wallets

### Error: "RPC request failed"
**Fix:** 
1. Check RPC URL is correct
2. Try using Alchemy: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
3. Check network connectivity

---

## 📊 Final Verification

Before considering setup complete:

- [ ] All 3 Supabase secrets set (WALLET_ENCRYPTION_KEY, NETWORK, BASE_RPC_URL)
- [ ] Encryption key backed up in 2+ locations
- [ ] All 3 Edge Functions deployed
- [ ] Deposit monitoring cron job running
- [ ] Frontend .env configured
- [ ] App runs without errors
- [ ] Can create wallet successfully
- [ ] Edge Function logs show no errors

---

## 🎯 Quick Setup (Copy-Paste)

If you want to set everything up quickly:

```bash
# 1. Generate and set encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "⚠️ BACKUP THIS KEY: $ENCRYPTION_KEY"
supabase secrets set WALLET_ENCRYPTION_KEY="$ENCRYPTION_KEY"

# 2. Set network and RPC
supabase secrets set NETWORK=base
supabase secrets set BASE_RPC_URL=https://mainnet.base.org

# 3. Verify secrets
supabase secrets list

# 4. Deploy functions
supabase functions deploy generate-wallet
supabase functions deploy monitor-deposits
supabase functions deploy process-withdrawal

# 5. Create frontend .env
cp .env.example .env
# Edit .env with your Supabase credentials

# 6. Install and run
npm install
npm run dev
```

Then set up the cron job in Supabase SQL Editor (see above).

---

## 📞 Need Help?

**Detailed guides:**
- `SETUP_EDGE_FUNCTION_SECRETS.md` - Complete secrets setup guide
- `QUICK_START.md` - Full quick start guide
- `WALLET_SETUP.md` - Wallet system details

**Check logs:**
```bash
supabase functions logs generate-wallet
supabase functions logs monitor-deposits
supabase functions logs process-withdrawal
```

**Verify secrets:**
```bash
supabase secrets list
```

---

## ✅ You're Done!

Once all checkboxes are checked, your system is ready to:
- ✅ Create real Ethereum wallets
- ✅ Detect USDC deposits automatically
- ✅ Process real withdrawals
- ✅ Handle multiplayer matches with escrow

**Next:** Test with real USDC on mainnet! 🚀

