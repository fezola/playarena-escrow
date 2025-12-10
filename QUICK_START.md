# PlayArena Wallet System - Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Generate Encryption Key

```bash
# Generate a strong encryption key
openssl rand -base64 32
```

Copy the output - you'll need it next.

### Step 2: Configure Supabase

Go to your Supabase Dashboard → Settings → Edge Functions → Add Secret:

```
Name: WALLET_ENCRYPTION_KEY
Value: <paste your generated key>
```

Add more secrets:
```
Name: NETWORK
Value: base

Name: BASE_RPC_URL
Value: https://mainnet.base.org
```

**For testing on testnet, use:**
```
Name: NETWORK
Value: baseSepolia

Name: BASE_RPC_URL
Value: https://sepolia.base.org
```

### Step 3: Deploy Edge Functions

```bash
# Make sure you're logged in to Supabase
supabase login

# Link to your project (if not already)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy generate-wallet
supabase functions deploy monitor-deposits
supabase functions deploy process-withdrawal
```

### Step 4: Set Up Deposit Monitoring

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Enable cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule deposit monitoring every minute
SELECT cron.schedule(
  'check-deposits',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-deposits',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key (from Settings → API)

### Step 5: Configure Frontend

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_NETWORK=base
```

**For testing on testnet, use:**
```
VITE_NETWORK=baseSepolia
```

### Step 6: Install Dependencies & Run

```bash
npm install
npm run dev
```

## 🧪 Test It Out

### 1. Get USDC (Mainnet)

**Base Mainnet USDC:**
- Contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Buy USDC on Coinbase or other exchanges
- Bridge from Ethereum mainnet to Base

**For Testing (Base Sepolia):**
- Get Base Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia
- Get Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Use a faucet or bridge from Ethereum Sepolia

### 2. Create Wallet

1. Sign up / Login to PlayArena
2. Go to Profile
3. Click "Create Wallet"
4. Copy your wallet address

### 3. Test Deposit

1. Send USDC to your wallet address
2. Wait 1-2 minutes
3. Refresh profile - balance should update!

### 4. Test Withdrawal

1. Click "Withdraw"
2. Enter destination address (your MetaMask, etc.)
3. Enter amount
4. Confirm
5. Check transaction on BaseScan
   - Mainnet: https://basescan.org
   - Testnet: https://sepolia.basescan.org

## 🔍 Troubleshooting

### Deposits not showing up?

Check if monitoring is running:
```bash
supabase functions logs monitor-deposits --tail
```

Manually trigger a check:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-deposits \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Withdrawal failing?

Check logs:
```bash
supabase functions logs process-withdrawal --tail
```

Common issues:
- Wallet needs ETH for gas (send 0.001 ETH to user wallet)
- RPC URL not accessible
- Encryption key mismatch

### Check cron jobs:

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## 📊 Useful Commands

### View Edge Function Logs

```bash
# Real-time logs
supabase functions logs monitor-deposits --tail
supabase functions logs process-withdrawal --tail
supabase functions logs generate-wallet --tail

# Recent logs
supabase functions logs monitor-deposits
```

### Test Edge Functions Locally

```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve monitor-deposits --env-file supabase/.env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/monitor-deposits \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Database Queries

```sql
-- Check recent transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;

-- Check wallets with balances
SELECT wallet_address, wallet_balance FROM profiles WHERE wallet_address IS NOT NULL;

-- Check pending withdrawals
SELECT * FROM transactions WHERE tx_type = 'withdrawal' AND status = 'pending';
```

## 🚀 Going to Production

When ready for mainnet:

1. Update Supabase secrets:
   ```
   NETWORK=base
   BASE_RPC_URL=https://mainnet.base.org
   ```

2. Redeploy functions:
   ```bash
   supabase functions deploy generate-wallet
   supabase functions deploy monitor-deposits
   supabase functions deploy process-withdrawal
   ```

3. Update frontend `.env`:
   ```
   VITE_NETWORK=base
   ```

4. **Important:** Fund user wallets with ETH for gas, or implement gas station

## 📚 More Info

- Full setup guide: `WALLET_SETUP.md`
- Deployment checklist: `DEPLOYMENT_CHECKLIST.md`
- Supabase docs: https://supabase.com/docs
- Base network docs: https://docs.base.org

## 🆘 Need Help?

1. Check the logs first
2. Review `WALLET_SETUP.md` for detailed troubleshooting
3. Check Supabase status: https://status.supabase.com
4. Check Base status: https://status.base.org

