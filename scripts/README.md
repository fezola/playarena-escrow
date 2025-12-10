# Platform Wallet Generation Script

## 🎯 Purpose

This script generates a secure Ethereum wallet for the PlayArena platform to use for paying gas fees for user withdrawals.

## 🔐 Security Features

- ✅ Uses cryptographically secure random number generation
- ✅ Generates proper secp256k1 Ethereum private keys
- ✅ Creates backup file with timestamp
- ✅ Checks balance on both Base Mainnet and Sepolia
- ✅ Provides clear security warnings
- ✅ Never exposes keys in logs (except during generation)

## 🚀 Usage

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Run the Script

```bash
npm run generate-platform-wallet
```

### Step 3: Follow the Instructions

The script will:
1. Generate a secure private key
2. Derive the Ethereum address
3. Create a backup file in `backups/`
4. Display the wallet information
5. Check current balance on Base networks
6. Show next steps

## 📋 Output

The script outputs:

```
============================================================
PlayArena Platform Wallet Generator
============================================================

🔐 Generating cryptographically secure private key...
🔑 Deriving Ethereum account...

============================================================
✅ Platform Wallet Generated Successfully!
============================================================

Wallet Address:
  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

Private Key:
  0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

📁 Backup file created:
  /path/to/backups/platform-wallet-2025-12-10T12-00-00-000Z.json

============================================================
⚠️  CRITICAL SECURITY WARNINGS
============================================================

1. BACKUP THIS INFORMATION IMMEDIATELY:
   - Save in password manager (1Password, LastPass, etc.)
   - Write on paper and store in safe
   - Keep backup file secure and encrypted

2. NEVER SHARE OR EXPOSE:
   - Do NOT commit to git
   - Do NOT share in Slack/Discord/Email
   - Do NOT store in plain text files

3. ADD TO .gitignore:
   - backups/
   - *.json (wallet backups)

============================================================
📋 Next Steps
============================================================

1. Backup the private key securely (see warnings above)
2. Add to Supabase secrets:
   supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=0x...

3. Fund the wallet with ETH on Base network:
   Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   Amount: 0.01 ETH (~$30) for 100 users
   Amount: 0.1 ETH (~$300) for 1,000 users

4. Verify the secret is set:
   supabase secrets list

5. Deploy the wallet generation function:
   supabase functions deploy generate-wallet

6. Check wallet balance:
   cast balance 0x... --rpc-url https://mainnet.base.org

============================================================
🔍 Checking Wallet Balance
============================================================

Base Mainnet: 0 ETH
Base Sepolia: 0 ETH

============================================================
🎯 Important Reminders
============================================================

✅ Wallet generated successfully
✅ Backup file created
⚠️  BACKUP THE PRIVATE KEY NOW!
⚠️  ADD TO SUPABASE SECRETS!
⚠️  FUND WITH ETH ON BASE!
```

## 📁 Backup File

The script creates a JSON backup file in `backups/` directory:

```json
{
  "generated_at": "2025-12-10T12:00:00.000Z",
  "wallet_type": "platform_gas_wallet",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "private_key": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "network": "base",
  "purpose": "Pay gas fees for user withdrawals",
  "warning": "KEEP THIS FILE SECURE! Never commit to git or share publicly."
}
```

**⚠️ IMPORTANT:** This file contains your private key! Keep it secure!

## 🔒 Security Checklist

After running the script:

- [ ] Private key saved in password manager
- [ ] Private key written on paper and stored in safe
- [ ] Backup file encrypted or stored securely
- [ ] Added to Supabase secrets
- [ ] Verified `backups/` is in `.gitignore`
- [ ] Never committed backup file to git
- [ ] Shared with trusted team member (encrypted)

## 🚨 What NOT to Do

❌ **DO NOT:**
- Commit the backup file to git
- Share the private key in Slack/Discord/Email
- Store in plain text files
- Screenshot and share
- Copy-paste in unsecured channels
- Leave backup file unencrypted

✅ **DO:**
- Use password manager
- Encrypt backup file
- Store offline backup
- Share securely with team (if needed)
- Keep multiple backups
- Test the wallet works before funding heavily

## 🧪 Testing

After generating the wallet:

1. **Add to Supabase:**
   ```bash
   supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=0xYOUR_KEY
   ```

2. **Verify:**
   ```bash
   supabase secrets list
   ```

3. **Fund with small amount first (0.001 ETH):**
   - Test on Base Sepolia first
   - Then test on Base Mainnet

4. **Check balance:**
   ```bash
   cast balance YOUR_ADDRESS --rpc-url https://mainnet.base.org
   ```

5. **Deploy function:**
   ```bash
   supabase functions deploy generate-wallet
   ```

6. **Create test user wallet:**
   - Should receive 0.0001 ETH automatically

## 📊 Funding Recommendations

| Users | ETH Needed | Cost @ $3000/ETH | Per User |
|-------|------------|------------------|----------|
| 100 | 0.01 ETH | $30 | $0.30 |
| 1,000 | 0.1 ETH | $300 | $0.30 |
| 10,000 | 1 ETH | $3,000 | $0.30 |

**Start small:** Fund with 0.01 ETH first, test, then add more.

## 🔍 Troubleshooting

### Script fails to run

**Error:** `Cannot find module 'viem'`

**Solution:**
```bash
npm install
```

### Script runs but shows errors

**Error:** `Network error checking balance`

**Solution:** This is normal if you haven't funded the wallet yet. The wallet is still valid.

### Backup file not created

**Solution:** Check that you have write permissions in the project directory.

## 📞 Support

For issues:
1. Check the script output for errors
2. Verify dependencies are installed (`npm install`)
3. Check you have write permissions
4. Review the security warnings

## ✅ Summary

This script:
- ✅ Generates secure Ethereum wallet
- ✅ Creates encrypted backup
- ✅ Provides clear instructions
- ✅ Checks balance on Base networks
- ✅ Warns about security best practices

**Use this instead of manual wallet generation for production!**

