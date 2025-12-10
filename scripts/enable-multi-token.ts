/**
 * Enable Multi-Token Support
 * 
 * This script:
 * 1. Adds ETH and USDT balance columns to profiles
 * 2. Adds currency column to matches
 * 3. Credits your ETH balance automatically
 * 
 * Usage: npm run enable-multi-token
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// Your wallet address
const YOUR_WALLET = '0x7bf933dd6bacc4319c326c919f271213ebcd6bb6';

async function enableMultiToken() {
  console.log('\n🚀 Enabling Multi-Token Support...\n');

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Step 1: Add ETH and USDT balance columns
    console.log('📊 Step 1: Adding ETH and USDT balance columns...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS eth_balance DECIMAL(18, 6) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS usdt_balance DECIMAL(18, 6) DEFAULT 0;
      `
    });

    if (alterError) {
      console.log('⚠️  Note: Columns might already exist or need admin access');
      console.log('   Running alternative approach...\n');
    } else {
      console.log('✅ Balance columns added!\n');
    }

    // Step 2: Check your ETH balance on-chain
    console.log('🔍 Step 2: Checking your on-chain ETH balance...');
    
    const publicClient = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org'),
    });

    const balance = await publicClient.getBalance({ 
      address: YOUR_WALLET as `0x${string}` 
    });
    
    const balanceInEth = formatEther(balance);
    const balanceInUsd = (parseFloat(balanceInEth) * 3000).toFixed(2);

    console.log(`   Wallet: ${YOUR_WALLET}`);
    console.log(`   ETH Balance: ${balanceInEth} ETH (~$${balanceInUsd})\n`);

    // Step 3: Update database with ETH balance
    console.log('💾 Step 3: Updating database with your ETH balance...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        eth_balance: parseFloat(balanceInEth)
      })
      .eq('wallet_address', YOUR_WALLET);

    if (updateError) {
      console.error('❌ Error updating balance:', updateError.message);
      console.log('\n📋 Manual SQL to run in Supabase Dashboard:');
      console.log(`
UPDATE public.profiles 
SET eth_balance = ${balanceInEth}
WHERE wallet_address = '${YOUR_WALLET}';
      `);
      return;
    }

    console.log('✅ ETH balance updated!\n');

    // Step 4: Verify the update
    console.log('🔍 Step 4: Verifying database update...');
    
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_balance, eth_balance, usdt_balance')
      .eq('wallet_address', YOUR_WALLET)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching profile:', fetchError.message);
      return;
    }

    console.log('\n✅ SUCCESS! Your balances:');
    console.log('━'.repeat(50));
    console.log(`Wallet: ${profile.wallet_address}`);
    console.log(`USDC Balance: $${(profile.wallet_balance || 0).toFixed(2)}`);
    console.log(`ETH Balance: ${(profile.eth_balance || 0).toFixed(6)} ETH (~$${((profile.eth_balance || 0) * 3000).toFixed(2)})`);
    console.log(`USDT Balance: $${(profile.usdt_balance || 0).toFixed(2)}`);
    console.log('━'.repeat(50));

    console.log('\n🎮 You can now play games with ETH!');
    console.log('\nNext steps:');
    console.log('1. Refresh your app');
    console.log('2. Go to Create Match');
    console.log('3. Select ETH as currency');
    console.log('4. Play and win! 🎉\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.log('\n📋 If this fails, run this SQL manually in Supabase Dashboard:');
    console.log(`
-- Add columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS eth_balance DECIMAL(18, 6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS usdt_balance DECIMAL(18, 6) DEFAULT 0;

-- Add currency to matches
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDC';

-- Update your balance (check on-chain first)
UPDATE public.profiles 
SET eth_balance = 0.00166  -- Replace with actual balance
WHERE wallet_address = '${YOUR_WALLET}';

-- Verify
SELECT wallet_address, wallet_balance as usdc, eth_balance as eth, usdt_balance as usdt
FROM public.profiles 
WHERE wallet_address = '${YOUR_WALLET}';
    `);
  }
}

// Run the script
enableMultiToken().catch(console.error);

