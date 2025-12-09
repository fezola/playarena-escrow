import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'PlayArena',
  projectId: 'playarena-demo', // Replace with WalletConnect project ID for production
  chains: [base, baseSepolia],
  ssr: false,
});

// Contract addresses - configure via environment
export const CONTRACTS = {
  ESCROW: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  USDC: import.meta.env.VITE_USDC_TOKEN_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
};

// Platform fee in basis points (100 = 1%)
export const PLATFORM_FEE_BPS = Number(import.meta.env.VITE_PLATFORM_FEE_BPS) || 250;
