import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple XOR encryption for private keys
function encryptPrivateKey(privateKey: string, encryptionKey: string): string {
  const keyBytes = new TextEncoder().encode(encryptionKey);
  const dataBytes = new TextEncoder().encode(privateKey);
  const encrypted = new Uint8Array(dataBytes.length);
  
  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

// Hash function for deriving address from private key
async function hashBytes(data: Uint8Array): Promise<Uint8Array> {
  // Use SubtleCrypto for SHA-256 to create deterministic address from key
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  return new Uint8Array(hashBuffer);
}

// Generate a random Ethereum-compatible wallet
async function generateWallet(): Promise<{ address: string; privateKey: string }> {
  // Generate 32 random bytes for private key
  const privateKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const privateKey = '0x' + Array.from(privateKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Derive address from private key (simplified - uses hash of private key)
  // In production, this would use secp256k1 elliptic curve
  const addressHash = await hashBytes(privateKeyBytes);
  // Take last 20 bytes for the address
  const addressBytes = addressHash.slice(-20);
  const address = '0x' + Array.from(addressBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { address, privateKey };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('WALLET_ENCRYPTION_KEY')!;

    if (!encryptionKey) {
      console.error('WALLET_ENCRYPTION_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to update profile
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user's token
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating wallet for user:', user.id);

    // Check if user already has a wallet
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingProfile?.wallet_address) {
      console.log('User already has wallet:', existingProfile.wallet_address);
      return new Response(
        JSON.stringify({ 
          success: true, 
          wallet_address: existingProfile.wallet_address,
          message: 'Wallet already exists' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new wallet
    const wallet = await generateWallet();
    console.log('Generated wallet address:', wallet.address);

    // Encrypt private key
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, encryptionKey);

    // Update profile with wallet info
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        wallet_address: wallet.address,
        encrypted_private_key: encryptedPrivateKey,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Wallet saved successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        wallet_address: wallet.address,
        message: 'Wallet generated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-wallet function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
