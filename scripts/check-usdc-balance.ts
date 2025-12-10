import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { base } from 'viem/chains';

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const YOUR_WALLET = '0x7bf933dd6bacc4319c326c919f271213ebcd6bb6';

async function checkBalance() {
  console.log('\n💰 Checking Your Wallet Balances...\n');
  console.log(`Wallet: ${YOUR_WALLET}\n`);

  try {
    const client = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org'),
    });

    // Check BASE balance
    console.log('Checking BASE balance...');
    const baseBalance = await client.getBalance({ address: YOUR_WALLET as `0x${string}` });
    const balanceInBase = formatEther(baseBalance);
    const baseInUsd = (parseFloat(balanceInBase) * 3000).toFixed(2);

    console.log(`✅ BASE: ${balanceInBase} (~$${baseInUsd})\n`);

    // Check USDC balance
    console.log('Checking USDC balance...');
    const usdcBalance = await client.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [YOUR_WALLET as `0x${string}`],
    });
    const balanceInUsdc = formatUnits(usdcBalance, 6);

    console.log(`✅ USDC: ${balanceInUsdc} USDC (~$${balanceInUsdc})\n`);

    // Summary
    const totalUsd = parseFloat(baseInUsd) + parseFloat(balanceInUsdc);
    console.log('━'.repeat(50));
    console.log(`Total Value: ~$${totalUsd.toFixed(2)}`);
    console.log('━'.repeat(50));
    console.log('');

    if (parseFloat(balanceInUsdc) > 0) {
      console.log('🎉 USDC deposit detected!');
      console.log('');
      console.log('To update your balance in the app:');
      console.log('1. Run the deposit monitoring function');
      console.log('2. Or wait for automatic sync (runs every 5 minutes)');
      console.log('');
    } else {
      console.log('⚠️  No USDC found in wallet');
      console.log('');
      console.log('To deposit USDC:');
      console.log(`1. Send USDC to: ${YOUR_WALLET}`);
      console.log('2. Make sure you\'re on Base network');
      console.log('3. Wait a few minutes for confirmation');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking balance:', error);
  }
}

checkBalance();

