import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createWalletClient, createPublicClient, http, parseEther, formatUnits, type Address } from "https://esm.sh/viem@2.21.54";
import { privateKeyToAccount } from "https://esm.sh/viem@2.21.54/accounts";
import { base, baseSepolia } from "https://esm.sh/viem@2.21.54/chains";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uniswap V3 SwapRouter on Base
const SWAP_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481' as Address;

// USDC on Base
const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
};

// WETH on Base
const WETH_ADDRESSES = {
  base: '0x4200000000000000000000000000000000000006' as Address,
  baseSepolia: '0x4200000000000000000000000000000000000006' as Address,
};

// Decrypt private key (same as in process-withdrawal)
async function decryptPrivateKey(encryptedData: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ethAmount } = await req.json();

    if (!ethAmount || ethAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid ETH amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('WALLET_ENCRYPTION_KEY')!;
    const rpcUrl = Deno.env.get('BASE_RPC_URL') || 'https://mainnet.base.org';
    const network = Deno.env.get('NETWORK') || 'base';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile with encrypted private key
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, wallet_address, encrypted_private_key')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !profile.encrypted_private_key) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Swapping ${ethAmount} ETH to USDC for wallet ${profile.wallet_address}`);

    // Decrypt private key
    const privateKey = await decryptPrivateKey(profile.encrypted_private_key, encryptionKey);
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // Setup blockchain clients
    const chain = network === 'baseSepolia' ? baseSepolia : base;
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    // For simplicity, we'll just tell the user to use Uniswap
    // Implementing a full swap requires complex ABI encoding
    
    return new Response(
      JSON.stringify({
        error: 'Direct swap not implemented yet',
        message: 'Please use Uniswap to swap ETH to USDC',
        instructions: [
          '1. Export your private key (contact support)',
          '2. Import to MetaMask',
          '3. Go to app.uniswap.org',
          '4. Swap ETH → USDC on Base network',
          'OR: Send ETH to another wallet, swap there, send USDC back'
        ],
        wallet_address: profile.wallet_address,
      }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in swap function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

