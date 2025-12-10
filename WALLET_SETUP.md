# PlayArena Wallet & Blockchain Setup Guide

This guide explains how to set up the real-money wallet system for PlayArena.

## 🏗️ Architecture Overview

PlayArena uses **in-app custodial wallets** where:
1. Each user gets a real Ethereum wallet (Base network)
2. Private keys are encrypted and stored in Supabase
3. Users deposit USDC to their wallet address
4. Deposits are automatically detected and credited
5. Withdrawals are processed via Edge Functions

## 📋 Prerequisites

1. **Supabase Project** - Already set up
2. **Base Network RPC** - Free public RPC or Alchemy/Infura account
3. **Encryption Key** - Strong random key for encrypting private keys

## 🔧 Setup Steps

### 1. Generate Encryption Key

Generate a strong encryption key for private keys:

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**⚠️ CRITICAL: Store this key securely! If lost, wallets cannot be recovered.**

### 2. Configure Supabase Edge Functions

Go to your Supabase Dashboard → Edge Functions → Secrets and add:

```
WALLET_ENCRYPTION_KEY=<your_generated_key>
NETWORK=baseSepolia
BASE_RPC_URL=https://sepolia.base.org
```

For production, use:
```
NETWORK=base
BASE_RPC_URL=https://mainnet.base.org
```

### 3. Deploy Edge Functions

Deploy the three edge functions:

```bash
# Deploy wallet generation
supabase functions deploy generate-wallet

# Deploy deposit monitoring
supabase functions deploy monitor-deposits

# Deploy withdrawal processing
supabase functions deploy process-withdrawal
```

### 4. Set Up Deposit Monitoring (Cron Job)

Option A: **Supabase Cron** (Recommended)

Add to your Supabase SQL editor:

```sql
-- Create a cron job to check for deposits every minute
SELECT cron.schedule(
  'check-deposits',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/monitor-deposits',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

Option B: **External Cron Service**

Use a service like cron-job.org or GitHub Actions to call:
```
POST https://your-project.supabase.co/functions/v1/monitor-deposits
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

### 5. Configure Frontend Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_NETWORK=baseSepolia
```

## 🧪 Testing on Base Sepolia Testnet

### 1. Get Test ETH for Gas

Visit: https://www.alchemy.com/faucets/base-sepolia
- Connect a wallet
- Get free Sepolia ETH

### 2. Get Test USDC

Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

You can:
- Use a faucet if available
- Bridge from Ethereum Sepolia
- Or manually mint if you have a test contract

### 3. Test the Flow

1. **Create Wallet**
   - Sign up/login to PlayArena
   - Go to Profile → Create Wallet
   - Copy your wallet address

2. **Deposit USDC**
   - Send test USDC to your wallet address
   - Wait 1-2 minutes for monitoring to detect it
   - Balance should update automatically

3. **Withdraw USDC**
   - Go to Profile → Withdraw
   - Enter destination address and amount
   - Confirm withdrawal
   - Check transaction on BaseScan

## 🚀 Production Deployment

### 1. Switch to Base Mainnet

Update Supabase secrets:
```
NETWORK=base
BASE_RPC_URL=https://mainnet.base.org
```

### 2. Use Production RPC (Recommended)

For better reliability, use Alchemy or Infura:

```
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### 3. Fund Platform Wallet

The platform needs ETH for gas fees when processing withdrawals.

**Option 1:** Pre-fund user wallets
- Send small amount of ETH to each wallet when created
- Cons: Expensive at scale

**Option 2:** Gas Station (Recommended for production)
- Use a relayer service
- Or implement EIP-2771 meta-transactions

### 4. Security Checklist

- [ ] Encryption key stored securely (not in code)
- [ ] Service role key never exposed to frontend
- [ ] Rate limiting on withdrawal endpoint
- [ ] Monitoring for suspicious activity
- [ ] Backup encryption key in secure location
- [ ] Test recovery procedures

## 📊 Monitoring

### Check Deposit Monitoring Logs

```bash
supabase functions logs monitor-deposits
```

### Check Withdrawal Logs

```bash
supabase functions logs process-withdrawal
```

### Manual Balance Check

You can manually trigger deposit check:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/monitor-deposits \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 🔒 Security Best Practices

1. **Never expose private keys** - They stay encrypted in database
2. **Use HTTPS only** - All API calls must be over HTTPS
3. **Rate limit withdrawals** - Prevent abuse
4. **Monitor for anomalies** - Set up alerts for large withdrawals
5. **Regular backups** - Backup encryption key securely
6. **Audit logs** - Keep transaction logs for compliance

## 🆘 Troubleshooting

### Deposits not detected

1. Check cron job is running
2. Check RPC URL is accessible
3. Verify USDC contract address is correct
4. Check Edge Function logs

### Withdrawals failing

1. Check wallet has ETH for gas
2. Verify private key decryption works
3. Check RPC connection
4. Verify USDC balance on-chain

### Balance mismatch

Run manual sync:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/monitor-deposits \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 📞 Support

For issues, check:
1. Supabase Edge Function logs
2. Browser console for frontend errors
3. BaseScan for transaction status

