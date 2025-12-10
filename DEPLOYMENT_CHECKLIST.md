# PlayArena Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Environment Configuration

- [ ] Generate strong encryption key: `openssl rand -base64 32`
- [ ] Add encryption key to Supabase Edge Functions secrets
- [ ] Configure network (baseSepolia for testing, base for production)
- [ ] Set up RPC URLs (consider using Alchemy/Infura for production)
- [ ] Update frontend `.env` file with Supabase credentials

### 2. Database Setup

- [ ] Run all Supabase migrations
- [ ] Verify `profiles` table has `encrypted_private_key` column
- [ ] Verify `transactions` table exists with correct schema
- [ ] Check RLS policies are enabled

### 3. Edge Functions Deployment

Deploy all three edge functions:

```bash
# 1. Wallet Generation
supabase functions deploy generate-wallet

# 2. Deposit Monitoring
supabase functions deploy monitor-deposits

# 3. Withdrawal Processing
supabase functions deploy process-withdrawal
```

Verify deployment:
```bash
supabase functions list
```

### 4. Deposit Monitoring Setup

Choose one option:

**Option A: Supabase Cron (Recommended)**
```sql
SELECT cron.schedule(
  'check-deposits',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/monitor-deposits',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

**Option B: External Cron**
- Set up cron-job.org or similar
- Schedule: Every 1 minute
- URL: `https://YOUR_PROJECT.supabase.co/functions/v1/monitor-deposits`
- Header: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

**Option C: GitHub Actions**
- Create `.github/workflows/monitor-deposits.yml`
- Use schedule trigger with cron expression

### 5. Testing on Base Sepolia

- [ ] Set `NETWORK=baseSepolia` in Edge Functions
- [ ] Get test ETH from Base Sepolia faucet
- [ ] Get test USDC (address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
- [ ] Create test wallet in app
- [ ] Send test USDC to wallet
- [ ] Verify deposit is detected (check logs)
- [ ] Test withdrawal to external address
- [ ] Verify transaction on BaseScan Sepolia

## 🧪 Testing Checklist

### Wallet Creation
- [ ] User can create wallet
- [ ] Wallet address is valid Ethereum address
- [ ] Private key is encrypted in database
- [ ] Wallet address is displayed in profile
- [ ] Can copy wallet address

### Deposits
- [ ] Send USDC to wallet address
- [ ] Balance updates within 1-2 minutes
- [ ] Transaction appears in transaction history
- [ ] Transaction status is "confirmed"
- [ ] Correct amount is credited

### Withdrawals
- [ ] Can initiate withdrawal
- [ ] Validates destination address
- [ ] Validates amount (not more than balance)
- [ ] Transaction is sent to blockchain
- [ ] Balance is deducted
- [ ] Transaction hash is recorded
- [ ] Can view transaction on BaseScan
- [ ] Funds arrive at destination

### Edge Cases
- [ ] Multiple deposits in quick succession
- [ ] Withdrawal with insufficient balance (should fail)
- [ ] Invalid withdrawal address (should fail)
- [ ] Concurrent withdrawals (should handle properly)
- [ ] Very small amounts (0.01 USDC)
- [ ] Maximum amounts

## 🚀 Production Deployment

### 1. Switch to Mainnet

Update Supabase Edge Functions secrets:
```
NETWORK=base
BASE_RPC_URL=https://mainnet.base.org
```

Or use Alchemy:
```
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### 2. Gas Fee Strategy

**Critical:** User wallets need ETH for gas when withdrawing.

Options:
1. **Pre-fund wallets** - Send 0.001 ETH to each new wallet (expensive)
2. **Gas station** - Platform pays gas, deduct from USDC balance
3. **Relayer service** - Use Gelato or similar
4. **Meta-transactions** - Implement EIP-2771 (complex)

**Recommended for MVP:** Option 2 (Gas station)
- Platform wallet holds ETH
- Withdrawal function uses platform wallet for gas
- Deduct gas cost from user's USDC balance

### 3. Security Hardening

- [ ] Enable rate limiting on withdrawal endpoint
- [ ] Set up monitoring/alerts for large withdrawals
- [ ] Implement withdrawal limits (e.g., max $1000/day)
- [ ] Add 2FA for withdrawals (optional but recommended)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Regular security audits

### 4. Monitoring & Logging

- [ ] Set up log aggregation
- [ ] Monitor Edge Function errors
- [ ] Track deposit detection rate
- [ ] Monitor withdrawal success rate
- [ ] Set up alerts for failures
- [ ] Dashboard for transaction volume

### 5. Backup & Recovery

- [ ] Backup encryption key in secure location (password manager, vault)
- [ ] Document recovery procedures
- [ ] Test key recovery process
- [ ] Set up database backups
- [ ] Document disaster recovery plan

## 📊 Post-Deployment Monitoring

### Day 1
- [ ] Monitor all deposits are detected
- [ ] Check withdrawal processing time
- [ ] Verify no errors in logs
- [ ] Test with real users

### Week 1
- [ ] Review transaction success rate
- [ ] Check for any failed deposits
- [ ] Monitor gas costs
- [ ] Gather user feedback

### Ongoing
- [ ] Weekly review of transaction logs
- [ ] Monthly security audit
- [ ] Monitor blockchain gas prices
- [ ] Update RPC endpoints if needed

## 🆘 Rollback Plan

If issues occur:

1. **Disable withdrawals:**
   ```sql
   -- Add to profiles table
   ALTER TABLE profiles ADD COLUMN withdrawals_enabled BOOLEAN DEFAULT true;
   
   -- Disable for all users
   UPDATE profiles SET withdrawals_enabled = false;
   ```

2. **Pause deposit monitoring:**
   ```sql
   SELECT cron.unschedule('check-deposits');
   ```

3. **Investigate issues:**
   - Check Edge Function logs
   - Review recent transactions
   - Check blockchain status

4. **Fix and redeploy:**
   - Fix the issue
   - Test on testnet
   - Redeploy Edge Functions
   - Re-enable features

## 📞 Emergency Contacts

- Supabase Support: support@supabase.io
- Base Network Status: https://status.base.org
- RPC Provider Support: (your provider)

## ✅ Final Checklist

Before going live:

- [ ] All tests passing on testnet
- [ ] Encryption key backed up securely
- [ ] Monitoring and alerts configured
- [ ] Rate limiting enabled
- [ ] Error tracking set up
- [ ] Documentation complete
- [ ] Team trained on operations
- [ ] Rollback plan tested
- [ ] Legal/compliance review (if required)
- [ ] User communication prepared

## 🎉 Go Live!

Once all checks pass:

1. Switch to mainnet
2. Deploy Edge Functions
3. Enable deposit monitoring
4. Announce to users
5. Monitor closely for first 24 hours

Good luck! 🚀

