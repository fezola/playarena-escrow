import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Import viem for proper Ethereum wallet generation
import { generatePrivateKey, privateKeyToAccount } from "https://esm.sh/viem@2.21.54/accounts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-256-GCM encryption for private keys (more secure than XOR)
async function encryptPrivateKey(privateKey: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();

  // Derive a proper encryption key from the password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive AES key
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

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the private key
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(privateKey)
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

// Decrypt private key (for withdrawals)
async function decryptPrivateKey(encryptedData: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Decode base64
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

  // Extract salt, iv, and encrypted data
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  // Derive the same key
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

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}

// Generate a real Ethereum wallet using viem
function generateWallet(): { address: string; privateKey: string } {
  // Generate a cryptographically secure private key using viem
  const privateKey = generatePrivateKey();

  // Derive the Ethereum address from the private key using secp256k1
  const account = privateKeyToAccount(privateKey);

  return {
    address: account.address,
    privateKey: privateKey
  };
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
