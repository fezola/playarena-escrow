/**
 * Generate Platform Wallet for PlayArena
 * 
 * This script generates a secure Ethereum wallet for the platform
 * to use for paying gas fees for user withdrawals.
 * 
 * Usage: npm run generate-platform-wallet
 */

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

async function generatePlatformWallet() {
  logSection('PlayArena Platform Wallet Generator');

  // Step 1: Generate cryptographically secure private key
  log('🔐 Generating cryptographically secure private key...', colors.blue);
  const privateKey = generatePrivateKey();
  
  // Step 2: Derive account from private key
  log('🔑 Deriving Ethereum account...', colors.blue);
  const account = privateKeyToAccount(privateKey);
  
  // Step 3: Display wallet information
  logSection('✅ Platform Wallet Generated Successfully!');
  
  log('Wallet Address:', colors.green);
  log(`  ${account.address}`, colors.bright);
  
  log('\nPrivate Key:', colors.yellow);
  log(`  ${privateKey}`, colors.bright);
  
  // Step 4: Generate a secure backup file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupData = {
    generated_at: new Date().toISOString(),
    wallet_type: 'platform_gas_wallet',
    address: account.address,
    private_key: privateKey,
    network: 'base',
    purpose: 'Pay gas fees for user withdrawals',
    warning: 'KEEP THIS FILE SECURE! Never commit to git or share publicly.',
  };

  // Create backups directory if it doesn't exist
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `platform-wallet-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
  
  log('\n📁 Backup file created:', colors.green);
  log(`  ${backupFile}`, colors.bright);
  
  // Step 5: Security warnings
  logSection('⚠️  CRITICAL SECURITY WARNINGS');
  
  log('1. BACKUP THIS INFORMATION IMMEDIATELY:', colors.red);
  log('   - Save in password manager (1Password, LastPass, etc.)', colors.yellow);
  log('   - Write on paper and store in safe', colors.yellow);
  log('   - Keep backup file secure and encrypted', colors.yellow);
  
  log('\n2. NEVER SHARE OR EXPOSE:', colors.red);
  log('   - Do NOT commit to git', colors.yellow);
  log('   - Do NOT share in Slack/Discord/Email', colors.yellow);
  log('   - Do NOT store in plain text files', colors.yellow);
  
  log('\n3. ADD TO .gitignore:', colors.red);
  log('   - backups/', colors.yellow);
  log('   - *.json (wallet backups)', colors.yellow);
  
  // Step 6: Next steps
  logSection('📋 Next Steps');
  
  log('1. Backup the private key securely (see warnings above)', colors.cyan);
  log('2. Add to Supabase secrets:', colors.cyan);
  log(`   supabase secrets set PLATFORM_WALLET_PRIVATE_KEY=${privateKey}`, colors.bright);
  
  log('\n3. Fund the wallet with ETH on Base network:', colors.cyan);
  log(`   Address: ${account.address}`, colors.bright);
  log('   Amount: 0.01 ETH (~$30) for 100 users', colors.bright);
  log('   Amount: 0.1 ETH (~$300) for 1,000 users', colors.bright);
  
  log('\n4. Verify the secret is set:', colors.cyan);
  log('   supabase secrets list', colors.bright);
  
  log('\n5. Deploy the wallet generation function:', colors.cyan);
  log('   supabase functions deploy generate-wallet', colors.bright);
  
  log('\n6. Check wallet balance:', colors.cyan);
  log(`   cast balance ${account.address} --rpc-url https://mainnet.base.org`, colors.bright);
  
  // Step 7: Check if wallet already has balance (for verification)
  logSection('🔍 Checking Wallet Balance');
  
  try {
    const networks = [
      { name: 'Base Mainnet', chain: base, rpc: 'https://mainnet.base.org' },
      { name: 'Base Sepolia', chain: baseSepolia, rpc: 'https://sepolia.base.org' },
    ];

    for (const network of networks) {
      const client = createPublicClient({
        chain: network.chain,
        transport: http(network.rpc),
      });

      const balance = await client.getBalance({ address: account.address });
      const balanceInEth = formatEther(balance);
      
      log(`${network.name}: ${balanceInEth} ETH`, colors.blue);
    }
  } catch (error) {
    log('⚠️  Could not check balance (network error)', colors.yellow);
  }
  
  // Step 8: Final reminder
  logSection('🎯 Important Reminders');
  
  log('✅ Wallet generated successfully', colors.green);
  log('✅ Backup file created', colors.green);
  log('⚠️  BACKUP THE PRIVATE KEY NOW!', colors.red + colors.bright);
  log('⚠️  ADD TO SUPABASE SECRETS!', colors.red + colors.bright);
  log('⚠️  FUND WITH ETH ON BASE!', colors.red + colors.bright);
  
  console.log('\n');
}

// Run the script
generatePlatformWallet().catch((error) => {
  log('\n❌ Error generating wallet:', colors.red);
  console.error(error);
  process.exit(1);
});

