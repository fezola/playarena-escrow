import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { privateKeyToAccount } from "https://esm.sh/viem@2.21.54/accounts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decrypt private key using AES-GCM
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

// Encrypt private key using AES-GCM
async function encryptPrivateKey(privateKey: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));

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

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(privateKey)
  );

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

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
    const body = await req.json();
    const oldEncryptionKey = body.oldEncryptionKey;
    const dryRun = body.dryRun !== false; // Default to dry run for safety
    
    if (!oldEncryptionKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing oldEncryptionKey in request body',
          usage: 'POST with { "oldEncryptionKey": "your-old-key", "dryRun": false }'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const currentEncryptionKey = Deno.env.get('WALLET_ENCRYPTION_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all wallets with encrypted keys
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, wallet_address, encrypted_private_key, wallet_balance')
      .not('encrypted_private_key', 'is', null);

    if (profileError) throw profileError;

    const results: any[] = [];
    let recoveredCount = 0;
    let totalRecoveredBalance = 0;

    for (const profile of profiles || []) {
      if (!profile.encrypted_private_key || !profile.wallet_address) continue;
      if (profile.encrypted_private_key.length < 10) continue; // Skip invalid entries

      const result: any = {
        id: profile.id,
        username: profile.username,
        wallet_address: profile.wallet_address,
        wallet_balance: profile.wallet_balance,
        status: 'pending',
      };

      try {
        // Try to decrypt with old key
        const decryptedPrivateKey = await decryptPrivateKey(profile.encrypted_private_key, oldEncryptionKey);
        
        // Verify it matches the wallet address
        if (!verifyKeyMatchesAddress(decryptedPrivateKey, profile.wallet_address)) {
          result.status = 'failed';
          result.error = 'Decrypted key does not match wallet address';
          results.push(result);
          continue;
        }

        result.status = 'recoverable';
        result.verified = true;

        if (!dryRun) {
          // Re-encrypt with current key
          const newEncryptedKey = await encryptPrivateKey(decryptedPrivateKey, currentEncryptionKey);

          // Update database
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ encrypted_private_key: newEncryptedKey })
            .eq('id', profile.id);

          if (updateError) {
            result.status = 'update_failed';
            result.error = updateError.message;
          } else {
            result.status = 'recovered';
            recoveredCount++;
            totalRecoveredBalance += profile.wallet_balance || 0;
          }
        } else {
          recoveredCount++;
          totalRecoveredBalance += profile.wallet_balance || 0;
        }

      } catch (e: any) {
        result.status = 'failed';
        result.error = e.message;
      }

      results.push(result);
    }

    return new Response(
      JSON.stringify({
        mode: dryRun ? 'DRY RUN - No changes made' : 'LIVE - Changes applied',
        summary: {
          total_wallets: results.length,
          recoverable: results.filter(r => r.status === 'recoverable' || r.status === 'recovered').length,
          recovered: results.filter(r => r.status === 'recovered').length,
          failed: results.filter(r => r.status === 'failed').length,
          total_balance_recovered: totalRecoveredBalance,
        },
        wallets: results,
        next_step: dryRun 
          ? 'If results look good, call again with { "oldEncryptionKey": "...", "dryRun": false }'
          : 'Recovery complete! Users can now withdraw their funds.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in recover-wallets function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});