import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createPublicClient, http, formatUnits, type Address } from "https://esm.sh/viem@2.21.54";
import { base, baseSepolia } from "https://esm.sh/viem@2.21.54/chains";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USDC contract addresses
const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // Base Sepolia USDC
};

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const rpcUrl = Deno.env.get('BASE_RPC_URL') || 'https://mainnet.base.org';
    const network = Deno.env.get('NETWORK') || 'base'; // 'base' or 'baseSepolia'

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create viem client for Base network
    const chain = network === 'baseSepolia' ? baseSepolia : base;
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const usdcAddress = USDC_ADDRESSES[network as keyof typeof USDC_ADDRESSES];

    console.log(`Monitoring deposits on ${network} network...`);

    // Get all profiles with wallet addresses
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, wallet_address, wallet_balance')
      .not('wallet_address', 'is', null);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    console.log(`Checking ${profiles?.length || 0} wallets...`);

    let updatedCount = 0;
    const updates = [];

    // Check each wallet's USDC balance
    for (const profile of profiles || []) {
      try {
        // Get on-chain USDC balance
        const balance = await publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [profile.wallet_address as Address],
        });

        // Convert from wei to USDC (6 decimals)
        const balanceInUsdc = parseFloat(formatUnits(balance as bigint, 6));
        const currentDbBalance = profile.wallet_balance || 0;

        console.log(`Wallet ${profile.wallet_address}: On-chain=${balanceInUsdc}, DB=${currentDbBalance}`);

        // If on-chain balance is higher, user deposited
        if (balanceInUsdc > currentDbBalance) {
          const depositAmount = balanceInUsdc - currentDbBalance;
          
          updates.push({
            profileId: profile.id,
            userId: profile.user_id,
            newBalance: balanceInUsdc,
            depositAmount,
            walletAddress: profile.wallet_address,
          });

          updatedCount++;
        }
      } catch (error) {
        console.error(`Error checking wallet ${profile.wallet_address}:`, error);
      }
    }

    // Process all updates
    for (const update of updates) {
      // Update wallet balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: update.newBalance })
        .eq('id', update.profileId);

      if (updateError) {
        console.error(`Failed to update balance for ${update.walletAddress}:`, updateError);
        continue;
      }

      // Record deposit transaction
      await supabase.from('transactions').insert({
        user_id: update.userId,
        amount: update.depositAmount,
        tx_type: 'deposit',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        currency: 'USDC',
      });

      console.log(`✅ Detected deposit: ${update.depositAmount} USDC for ${update.walletAddress}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        walletsChecked: profiles?.length || 0,
        depositsDetected: updatedCount,
        updates: updates.map(u => ({
          wallet: u.walletAddress,
          amount: u.depositAmount,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in monitor-deposits function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

