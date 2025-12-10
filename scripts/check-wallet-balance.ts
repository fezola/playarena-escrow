import { createPublicClient, http, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';

const PLATFORM_WALLET = '0xc5B4c3D069C5C8eae7f9486C014E664Fcfd26F96';

async function checkBalance() {
  console.log('\n🔍 Checking Platform Wallet Balance...\n');
  console.log(`Address: ${PLATFORM_WALLET}\n`);

  const networks = [
    { name: 'Base Mainnet', chain: base, rpc: 'https://mainnet.base.org' },
    { name: 'Base Sepolia', chain: baseSepolia, rpc: 'https://sepolia.base.org' },
  ];

  for (const network of networks) {
    try {
      const client = createPublicClient({
        chain: network.chain,
        transport: http(network.rpc),
      });

      const balance = await client.getBalance({ address: PLATFORM_WALLET });
      const balanceInEth = formatEther(balance);
      const balanceInUsd = (parseFloat(balanceInEth) * 3000).toFixed(2);

      console.log(`${network.name}:`);
      console.log(`  ${balanceInEth} ETH (~$${balanceInUsd})`);
      
      if (parseFloat(balanceInEth) > 0) {
        const usersCanFund = Math.floor(parseFloat(balanceInEth) / 0.0001);
        console.log(`  Can fund ~${usersCanFund} users (0.0001 ETH each)`);
      }
      console.log('');
    } catch (error) {
      console.log(`${network.name}: Error checking balance`);
      console.log('');
    }
  }
}

checkBalance();

