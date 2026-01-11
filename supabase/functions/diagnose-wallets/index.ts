import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { privateKeyToAccount } from "https://esm.sh/viem@2.21.54/accounts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decrypt private key using AES-GCM (current method)
async function decryptPrivateKeyAESGCM(encryptedData: string, encryptionKey: string): Promise<string> {
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

// Try XOR decryption (old method that might have been used)
function decryptPrivateKeyXOR(encryptedHex: string, encryptionKey: string): string {
  try {
    const encrypted = Uint8Array.from(encryptedHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    const keyBytes = new TextEncoder().encode(encryptionKey);
    const decrypted = new Uint8Array(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

// Check if a string looks like a valid private key
function isValidPrivateKey(str: string): boolean {
  // Private keys are 66 chars (0x + 64 hex) or 64 hex chars
  if (str.startsWith('0x') && str.length === 66) {
    return /^0x[a-fA-F0-9]{64}$/.test(str);
  }
  if (str.length === 64) {
    return /^[a-fA-F0-9]{64}$/.test(str);
  }
  return false;
}

// Verify private key matches wallet address
function verifyKeyMatchesAddress(privateKey: string, expectedAddress: string): boolean {
  try {
    const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(pk as `0x${string}`);
    return account.address.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Admin diagnostic - using service role key for internal access

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('WALLET_ENCRYPTION_KEY')!;

    // Optional: try with an alternate key if provided
    const body = await req.json().catch(() => ({}));
    const alternateKey = body.alternateKey;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all wallets with encrypted keys
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, wallet_address, encrypted_private_key, wallet_balance')
      .not('encrypted_private_key', 'is', null);

    if (profileError) {
      throw profileError;
    }

    const results: any[] = [];

    for (const profile of profiles || []) {
      if (!profile.encrypted_private_key || !profile.wallet_address) continue;

      const result: any = {
        id: profile.id,
        username: profile.username,
        wallet_address: profile.wallet_address,
        wallet_balance: profile.wallet_balance,
        encrypted_data_length: profile.encrypted_private_key.length,
        current_key_works: false,
        alternate_key_works: false,
        recovery_possible: false,
        error: null,
      };

      // Try current encryption key with AES-GCM
      try {
        const decrypted = await decryptPrivateKeyAESGCM(profile.encrypted_private_key, encryptionKey);
        if (isValidPrivateKey(decrypted)) {
          const matches = verifyKeyMatchesAddress(decrypted, profile.wallet_address);
          result.current_key_works = matches;
          result.recovery_possible = matches;
          if (matches) {
            result.note = 'Wallet is recoverable with current key!';
          } else {
            result.note = 'Decrypted but address mismatch';
          }
        } else {
          result.decrypted_format = decrypted.substring(0, 20) + '...';
          result.note = 'Decryption produced invalid format';
        }
      } catch (e: any) {
        result.error = e.message;
      }

      // Try alternate key if provided and current key failed
      if (!result.current_key_works && alternateKey) {
        try {
          const decrypted = await decryptPrivateKeyAESGCM(profile.encrypted_private_key, alternateKey);
          if (isValidPrivateKey(decrypted)) {
            const matches = verifyKeyMatchesAddress(decrypted, profile.wallet_address);
            result.alternate_key_works = matches;
            result.recovery_possible = matches;
            if (matches) {
              result.note = 'Wallet is recoverable with ALTERNATE key!';
            }
          }
        } catch {
          // Alternate key also failed
        }
      }

      // Check if encrypted data looks like it was stored incorrectly
      if (profile.encrypted_private_key === '[object Promise]') {
        result.error = 'Private key was not properly stored (Promise object)';
        result.recovery_possible = false;
      }

      results.push(result);
    }

    const summary = {
      total_wallets: results.length,
      recoverable: results.filter(r => r.recovery_possible).length,
      need_alternate_key: results.filter(r => !r.current_key_works && !r.alternate_key_works && r.error?.includes('Decryption')).length,
      corrupted: results.filter(r => r.encrypted_private_key === '[object Promise]').length,
      total_balance_at_risk: results.filter(r => !r.recovery_possible).reduce((sum, r) => sum + (r.wallet_balance || 0), 0),
    };

    return new Response(
      JSON.stringify({ 
        summary, 
        wallets: results,
        hint: 'If wallets show "Decryption failed", the WALLET_ENCRYPTION_KEY may have been changed. Try passing the old key as alternateKey in the request body.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in diagnose-wallets function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});