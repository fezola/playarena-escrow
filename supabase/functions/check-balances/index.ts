import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createPublicClient, http, formatEther, formatUnits } from "https://esm.sh/viem@2.21.54";
import { base, baseSepolia } from "https://esm.sh/viem@2.21.54/chains";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const addresses: string[] = body.addresses || [];
    
    if (addresses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Please provide addresses array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const network = Deno.env.get('NETWORK') || 'base';
    const rpcUrl = Deno.env.get('BASE_RPC_URL') || 'https://mainnet.base.org';
    const chain = network === 'baseSepolia' ? baseSepolia : base;
    const usdcAddress = network === 'baseSepolia' ? USDC_SEPOLIA : USDC_ADDRESS;

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const results = [];

    for (const address of addresses) {
      try {
        // Get ETH balance
        const ethBalance = await publicClient.getBalance({ address: address as `0x${string}` });
        
        // Get USDC balance
        const usdcBalance = await publicClient.readContract({
          address: usdcAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });

        results.push({
          address,
          eth_balance: formatEther(ethBalance),
          usdc_balance: formatUnits(usdcBalance, 6),
          has_funds: ethBalance > 0n || usdcBalance > 0n,
        });
      } catch (e) {
        results.push({
          address,
          error: String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({
        network,
        results,
        summary: {
          total_checked: results.length,
          with_funds: results.filter(r => r.has_funds).length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
