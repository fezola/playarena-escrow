// Blockchain configuration for PlayArena
// Using in-app wallets, no external wallet connection needed

// Network configuration
export const NETWORK = import.meta.env.VITE_NETWORK || 'base'; // 'base' or 'baseSepolia'

// Contract addresses - configure via environment
export const CONTRACTS = {
  ESCROW: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  USDC: {
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base Mainnet
    baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
  },
};

// RPC URLs
export const RPC_URLS = {
  base: import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
  baseSepolia: import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
};

// Platform fee in basis points (100 = 1%)
export const PLATFORM_FEE_BPS = Number(import.meta.env.VITE_PLATFORM_FEE_BPS) || 250;

// Get current USDC address based on network
export const getUSDCAddress = () => {
  return CONTRACTS.USDC[NETWORK as keyof typeof CONTRACTS.USDC] || CONTRACTS.USDC.base;
};

// Get current RPC URL based on network
export const getRPCUrl = () => {
  return RPC_URLS[NETWORK as keyof typeof RPC_URLS] || RPC_URLS.base;
};
