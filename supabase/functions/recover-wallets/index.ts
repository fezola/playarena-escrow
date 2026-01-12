import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { privateKeyToAccount } from "https://esm.sh/viem@2.21.54/accounts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OLD XOR-based decryption (legacy method)
function decryptPrivateKeyXOR(encryptedData: string, encryptionKey: string): string {
  const encrypted = atob(encryptedData);
  let result = '';
  
  for (let i = 0; i < encrypted.length; i++) {
    result += String.fromCharCode(
      encrypted.charCodeAt(i) ^ encryptionKey.charCodeAt(i % encryptionKey.length)
    );
  }
  
  return result;
}

// Try decoding as raw base64 (maybe it's not encrypted at all)
function tryBase64Decode(data: string): string | null {
  try {
    return atob(data);
  } catch {
    return null;
  }
}

// Try treating as hex directly
function isHex(str: string): boolean {
  return /^(0x)?[a-fA-F0-9]+$/.test(str);
}

// AES-GCM encryption for re-encrypting recovered keys
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

function getAddressFromPrivateKey(privateKey: string): string | null {
  try {
    const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(pk as `0x${string}`);
    return account.address;
  } catch {
    return null;
  }
}

function isValidPrivateKey(pk: string): boolean {
  if (!pk) return false;
  const normalized = pk.startsWith('0x') ? pk.slice(2) : pk;
  return /^[a-fA-F0-9]{64}$/.test(normalized);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const keysToTry = body.keysToTry || [];
    const dryRun = body.dryRun !== false;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const currentEncryptionKey = Deno.env.get('WALLET_ENCRYPTION_KEY')!;

    // Add current key to the list if not already there
    if (!keysToTry.includes(currentEncryptionKey)) {
      keysToTry.push(currentEncryptionKey);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, wallet_address, encrypted_private_key, wallet_balance')
      .not('encrypted_private_key', 'is', null);

    if (profileError) throw profileError;

    const results: any[] = [];

    for (const profile of profiles || []) {
      if (!profile.encrypted_private_key || !profile.wallet_address) continue;
      if (profile.encrypted_private_key.length < 10) continue;

      const result: any = {
        id: profile.id,
        username: profile.username,
        wallet_address: profile.wallet_address,
        wallet_balance: profile.wallet_balance,
        encrypted_key_length: profile.encrypted_private_key.length,
        status: 'analyzing',
        decryption_attempts: [],
      };

      let foundKey: string | null = null;
      let foundMethod: string | null = null;

      // Method 1: Check if it's just raw base64-encoded private key (no encryption)
      const base64Decoded = tryBase64Decode(profile.encrypted_private_key);
      if (base64Decoded && isValidPrivateKey(base64Decoded)) {
        const derivedAddress = getAddressFromPrivateKey(base64Decoded);
        result.decryption_attempts.push({
          method: 'raw_base64',
          derived_address: derivedAddress,
          matches: derivedAddress?.toLowerCase() === profile.wallet_address.toLowerCase(),
        });
        if (derivedAddress?.toLowerCase() === profile.wallet_address.toLowerCase()) {
          foundKey = base64Decoded;
          foundMethod = 'raw_base64';
        }
      }

      // Method 2: Try XOR with each provided key
      for (const testKey of keysToTry) {
        if (foundKey) break;
        
        try {
          const xorDecrypted = decryptPrivateKeyXOR(profile.encrypted_private_key, testKey);
          const derivedAddress = isValidPrivateKey(xorDecrypted) ? getAddressFromPrivateKey(xorDecrypted) : null;
          
          result.decryption_attempts.push({
            method: `xor_${testKey.substring(0, 10)}...`,
            decrypted_preview: xorDecrypted.substring(0, 15) + '...',
            is_valid_pk: isValidPrivateKey(xorDecrypted),
            derived_address: derivedAddress,
            matches: derivedAddress?.toLowerCase() === profile.wallet_address.toLowerCase(),
          });

          if (derivedAddress?.toLowerCase() === profile.wallet_address.toLowerCase()) {
            foundKey = xorDecrypted;
            foundMethod = `xor_with_key_${testKey.substring(0, 10)}`;
          }
        } catch (e) {
          result.decryption_attempts.push({
            method: `xor_${testKey.substring(0, 10)}...`,
            error: String(e),
          });
        }
      }

      // Method 3: Check if it's the private key stored directly (not base64)
      if (!foundKey && isHex(profile.encrypted_private_key)) {
        const derivedAddress = getAddressFromPrivateKey(profile.encrypted_private_key);
        result.decryption_attempts.push({
          method: 'raw_hex',
          derived_address: derivedAddress,
          matches: derivedAddress?.toLowerCase() === profile.wallet_address.toLowerCase(),
        });
        if (derivedAddress?.toLowerCase() === profile.wallet_address.toLowerCase()) {
          foundKey = profile.encrypted_private_key;
          foundMethod = 'raw_hex';
        }
      }

      if (foundKey) {
        result.status = 'recoverable';
        result.recovery_method = foundMethod;
        
        if (!dryRun) {
          // Re-encrypt with current key using AES-GCM
          const newEncryptedKey = await encryptPrivateKey(foundKey, currentEncryptionKey);

          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ encrypted_private_key: newEncryptedKey })
            .eq('id', profile.id);

          if (updateError) {
            result.status = 'update_failed';
            result.error = updateError.message;
          } else {
            result.status = 'recovered';
          }
        }
      } else {
        result.status = 'failed';
      }

      results.push(result);
    }

    return new Response(
      JSON.stringify({
        mode: dryRun ? 'DRY RUN' : 'LIVE',
        instructions: 'Pass { "keysToTry": ["key1", "key2"], "dryRun": false } to recover',
        summary: {
          total_wallets: results.length,
          recoverable: results.filter(r => r.status === 'recoverable').length,
          recovered: results.filter(r => r.status === 'recovered').length,
          failed: results.filter(r => r.status === 'failed').length,
        },
        wallets: results,
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
