# PlayArena Base Mainnet Setup Guide

## 🚀 Production Deployment on Base Mainnet

This guide walks you through deploying PlayArena on Base mainnet with real USDC.

---

## ⚠️ CRITICAL: Pre-Deployment Checklist

Before going to mainnet, ensure:

- [ ] **Tested thoroughly on Base Sepolia testnet**
- [ ] **All wallet flows work correctly** (create, deposit, withdraw)
- [ ] **Multiplayer matches tested** (create, join, play, escrow release)
- [ ] **Encryption key backed up securely** (in password manager + offline)
- [ ] **Team understands the system** (how to monitor, troubleshoot)
- [ ] **Monitoring and alerts set up** (error tracking, transaction monitoring)
- [ ] **Legal/compliance review completed** (if required in your jurisdiction)

---

## 📋 Step-by-Step Mainnet Setup

### Step 1: Generate Production Encryption Key

```bash
# Generate a strong encryption key
openssl rand -base64 32
```

**⚠️ CRITICAL:**
- Store this key in **at least 2 secure locations**:
  1. Password manager (1Password, LastPass, etc.)
  2. Offline backup (encrypted USB drive, paper in safe)
- **NEVER commit to git**
- **NEVER share with anyone**
- If lost, all user wallets are **permanently unrecoverable**

---

### Step 2: Configure Supabase for Mainnet

Go to Supabase Dashboard → Settings → Edge Functions → Secrets

**Add/Update these secrets:**

```
Name: WALLET_ENCRYPTION_KEY
Value: <your_generated_key_from_step_1>

Name: NETWORK
Value: base

Name: BASE_RPC_URL
Value: https://mainnet.base.org
```

**Recommended: Use Alchemy for Production**

For better reliability and rate limits:

1. Sign up at https://www.alchemy.com
2. Create a new app for Base Mainnet
3. Copy your API key
4. Update the secret:

```
Name: BASE_RPC_URL
Value: https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

---

### Step 3: Deploy Edge Functions to Production

```bash
# Make sure you're logged in
supabase login

# Link to your production project
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF

# Deploy all functions
supabase functions deploy generate-wallet
supabase functions deploy monitor-deposits
supabase functions deploy process-withdrawal
```

Verify deployment:
```bash
supabase functions list
```

---

### Step 4: Set Up Deposit Monitoring (Mainnet)

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule deposit monitoring every minute
SELECT cron.schedule(
  'check-deposits-mainnet',
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

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key

Verify it's running:
```sql
SELECT * FROM cron.job;
```

---

### Step 5: Configure Frontend for Mainnet

Create/update `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_NETWORK=base
VITE_BASE_RPC_URL=https://mainnet.base.org
```

Or with Alchemy:
```
VITE_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

---

### Step 6: Build and Deploy Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to your hosting (Vercel, Netlify, etc.)
# Example for Vercel:
vercel --prod
```

---

## 💰 CRITICAL: Gas Fee Strategy

**Problem:** User wallets need ETH to pay gas fees when withdrawing USDC.

### Solution Options:

#### Option 1: Pre-Fund Wallets (Simple but Expensive)

When a user creates a wallet, automatically send them ~0.001 ETH for gas.

**Pros:**
- Simple to implement
- Users can withdraw immediately

**Cons:**
- Expensive at scale (ETH costs money)
- Need to maintain a funded platform wallet
- Wasted ETH if users never withdraw

**Implementation:**
Add to `generate-wallet` function to send ETH after wallet creation.

---

#### Option 2: Gas Station (Recommended for MVP)

Platform pays gas fees, deducts equivalent from user's USDC balance.

**Pros:**
- No wasted ETH
- Users don't need ETH
- Better UX

**Cons:**
- More complex implementation
- Need to estimate gas costs
- Platform needs ETH reserves

**Implementation:**
Modify `process-withdrawal` to:
1. Use platform wallet to send transaction
2. Calculate gas cost in USD
3. Deduct from user's USDC balance

---

#### Option 3: Relayer Service (Best for Scale)

Use a service like Gelato or Biconomy to handle gas.

**Pros:**
- Professional solution
- Handles gas optimization
- Scalable

**Cons:**
- Additional service dependency
- Monthly costs
- More complex setup

**Services:**
- Gelato: https://www.gelato.network
- Biconomy: https://www.biconomy.io

---

### Recommended Approach for Launch:

**Phase 1 (MVP):** Pre-fund wallets with 0.001 ETH
- Quick to implement
- Works immediately
- Cost: ~$3 per wallet (at current ETH prices)

**Phase 2 (Scale):** Implement gas station
- Better economics
- Deduct gas from USDC balance
- Platform maintains ETH reserves

**Phase 3 (Production):** Migrate to relayer service
- Professional solution
- Optimized gas costs
- Scalable to millions of users

---

## 🔒 Security Hardening

### 1. Rate Limiting

Add rate limits to prevent abuse:

```sql
-- In Supabase, create a rate limiting table
CREATE TABLE rate_limits (
  user_id UUID,
  action TEXT,
  count INTEGER,
  window_start TIMESTAMP,
  PRIMARY KEY (user_id, action, window_start)
);

-- Example: Limit withdrawals to 5 per hour
```

### 2. Withdrawal Limits

Set maximum withdrawal amounts:

```typescript
// In process-withdrawal function
const MAX_WITHDRAWAL_PER_TRANSACTION = 1000; // $1000
const MAX_WITHDRAWAL_PER_DAY = 5000; // $5000

if (amount > MAX_WITHDRAWAL_PER_TRANSACTION) {
  return error('Exceeds maximum withdrawal amount');
}
```

### 3. Monitoring & Alerts

Set up alerts for:
- Large withdrawals (>$500)
- Failed transactions
- Unusual activity patterns
- Low platform ETH balance

**Recommended Tools:**
- Sentry for error tracking
- Datadog for monitoring
- PagerDuty for alerts

### 4. Two-Factor Authentication (Optional)

For withdrawals over a certain amount, require 2FA:
- Email confirmation
- SMS code
- Authenticator app

---

## 📊 Monitoring Dashboard

### Key Metrics to Track:

1. **Wallet Metrics**
   - Total wallets created
   - Total USDC deposited
   - Total USDC withdrawn
   - Average balance per wallet

2. **Transaction Metrics**
   - Deposits detected (success rate)
   - Withdrawals processed (success rate)
   - Failed transactions
   - Average processing time

3. **Game Metrics**
   - Active matches
   - Total stakes in escrow
   - Platform fees collected
   - Match completion rate

4. **System Health**
   - Edge Function errors
   - RPC response times
   - Cron job success rate
   - Database performance

### SQL Queries for Monitoring:

```sql
-- Total USDC in system
SELECT SUM(wallet_balance) FROM profiles;

-- Total in escrow
SELECT SUM(amount) FROM escrow WHERE status = 'held';

-- Recent failed transactions
SELECT * FROM transactions 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

-- Deposit detection rate (last hour)
SELECT COUNT(*) FROM transactions 
WHERE tx_type = 'deposit' 
AND created_at > NOW() - INTERVAL '1 hour';
```

---

## 🆘 Emergency Procedures

### If Something Goes Wrong:

#### 1. Pause Withdrawals

```sql
-- Add a global flag
CREATE TABLE system_flags (
  flag_name TEXT PRIMARY KEY,
  enabled BOOLEAN
);

INSERT INTO system_flags VALUES ('withdrawals_enabled', false);
```

Update `process-withdrawal` to check this flag.

#### 2. Pause Deposit Monitoring

```sql
SELECT cron.unschedule('check-deposits-mainnet');
```

#### 3. Emergency Contact List

- Supabase Support: support@supabase.io
- Alchemy Support: (if using Alchemy)
- Base Network Status: https://status.base.org
- Your team lead: [PHONE NUMBER]

---

## ✅ Final Pre-Launch Checklist

- [ ] All tests passing on mainnet
- [ ] Encryption key backed up (2+ locations)
- [ ] Gas fee strategy implemented
- [ ] Rate limiting enabled
- [ ] Monitoring dashboard set up
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Emergency procedures documented
- [ ] Team trained on operations
- [ ] Legal/compliance approved
- [ ] User communication prepared
- [ ] Rollback plan tested

---

## 🎉 Launch Day!

1. **Final verification:**
   ```bash
   # Check Edge Functions are deployed
   supabase functions list
   
   # Verify cron job is running
   # (Run in Supabase SQL Editor)
   SELECT * FROM cron.job;
   ```

2. **Monitor closely for first 24 hours:**
   - Watch Edge Function logs
   - Check deposit detection
   - Monitor withdrawal success rate
   - Track user signups

3. **Be ready to respond:**
   - Have team on standby
   - Monitor support channels
   - Be ready to pause if needed

---

## 📞 Support

- Technical docs: See `WALLET_SETUP.md`
- Deployment checklist: See `DEPLOYMENT_CHECKLIST.md`
- Multiplayer flow: See `MULTIPLAYER_FLOW_AUDIT.md`

Good luck with your launch! 🚀

