import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// ERC20 ABI for balanceOf
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
  console.log('\n🔍 Checking Your Wallet Balance...\n');
  console.log(`Address: ${YOUR_WALLET}\n`);

  try {
    const client = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org'),
    });

    // Check BASE balance
    const baseBalance = await client.getBalance({ address: YOUR_WALLET });
    const balanceInBase = formatEther(baseBalance);
    const baseInUsd = (parseFloat(balanceInBase) * 3000).toFixed(2);

    console.log('Base Mainnet:');
    console.log(`  BASE: ${balanceInBase} (~$${baseInUsd})`);

    // Check USDC balance
    const usdcBalance = await client.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [YOUR_WALLET],
    });
    const balanceInUsdc = formatUnits(usdcBalance, 6);

    console.log(`  USDC: ${balanceInUsdc} (~$${balanceInUsdc})`);
    console.log('');

    // Summary
    const totalUsd = parseFloat(baseInUsd) + parseFloat(balanceInUsdc);
    console.log(`Total Value: ~$${totalUsd.toFixed(2)}`);
    console.log('');

  } catch (error) {
    console.log('Error checking balance:', error);
  }
}

checkBalance();

