/**
 * Token Encryption Utilities
 * 
 * IMPORTANT: OAuth tokens should NEVER be stored in plain text.
 * Use these utilities to encrypt tokens before storing in Supabase.
 * 
 * Setup:
 * 1. Generate a strong encryption key:
 *    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 
 * 2. Add to environment variables:
 *    TOKEN_ENCRYPTION_SECRET=your-generated-key
 * 
 * 3. Update the database to add encrypted columns
 * 4. Update the OAuth callback to use these functions
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = 'observatory-oauth-v1'; // Change this for your app

/**
 * Get or derive encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_SECRET;
  
  if (!secret) {
    throw new Error(
      'TOKEN_ENCRYPTION_SECRET environment variable is required for token encryption.\n' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  
  // Derive a 32-byte key from the secret using scrypt
  return scryptSync(secret, SALT, KEY_LENGTH);
}

/**
 * Encrypt a token string
 * @param token The plaintext token to encrypt
 * @returns Encrypted token string (format: iv:authTag:ciphertext)
 */
export function encryptToken(token: string): string {
  if (!token) return '';
  
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt an encrypted token string
 * @param encryptedToken The encrypted token (format: iv:authTag:ciphertext)
 * @returns Decrypted plaintext token
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) return '';
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedToken.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token - token may be corrupted or key may have changed');
  }
}

/**
 * Hash a token for comparison/storage (one-way, not reversible)
 * Use this to store a token hash for detecting token changes/rotation
 * @param token The token to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  if (!token) return '';
  
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compare two token hashes in constant time (prevents timing attacks)
 * @param hashA First hash
 * @param hashB Second hash
 * @returns True if hashes match
 */
export function compareTokenHashes(hashA: string, hashB: string): boolean {
  if (!hashA || !hashB) return false;
  
  try {
    const bufA = Buffer.from(hashA, 'hex');
    const bufB = Buffer.from(hashB, 'hex');
    
    if (bufA.length !== bufB.length) return false;
    
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Prepare calendar data for database storage with encrypted tokens
 * @param data Raw calendar data with plaintext tokens
 * @returns Calendar data with encrypted tokens
 */
export function encryptCalendarTokens(data: {
  access_token?: string | null;
  refresh_token?: string | null;
  [key: string]: any;
}): { [key: string]: any } {
  return {
    ...data,
    access_token: data.access_token ? encryptToken(data.access_token) : null,
    refresh_token: data.refresh_token ? encryptToken(data.refresh_token) : null,
    // Store a hash of the access token for detecting rotation
    access_token_hash: data.access_token ? hashToken(data.access_token) : null,
  };
}

/**
 * Decrypt calendar tokens from database
 * @param data Calendar data from database
 * @returns Calendar data with decrypted tokens
 */
export function decryptCalendarTokens(data: {
  access_token?: string | null;
  refresh_token?: string | null;
  [key: string]: any;
}): { [key: string]: any } {
  return {
    ...data,
    access_token: data.access_token ? decryptToken(data.access_token) : null,
    refresh_token: data.refresh_token ? decryptToken(data.refresh_token) : null,
  };
}

/**
 * Safe version that returns null on decryption failure
 * Use this when you're not sure if the token is encrypted or not
 */
export function tryDecryptToken(encryptedToken: string): string | null {
  try {
    return decryptToken(encryptedToken);
  } catch {
    return null;
  }
}

// =====================================================
// MIGRATION SQL
// =====================================================

/**
 * Run this SQL in Supabase to add encrypted token columns:
 * 
 * ```sql
 * -- Add encrypted token columns
 * ALTER TABLE orchestrator.calendars 
 * ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
 * ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT,
 * ADD COLUMN IF NOT EXISTS access_token_hash TEXT;
 * 
 * -- Create index on token hash for faster lookups
 * CREATE INDEX IF NOT EXISTS idx_calendars_token_hash 
 * ON orchestrator.calendars(access_token_hash) 
 * WHERE access_token_hash IS NOT NULL;
 * 
 * -- Add comment for documentation
 * COMMENT ON COLUMN orchestrator.calendars.access_token IS 
 *   'DEPRECATED: Use access_token_encrypted instead. This column will be removed.';
 * 
 * COMMENT ON COLUMN orchestrator.calendars.refresh_token IS 
 *   'DEPRECATED: Use refresh_token_encrypted instead. This column will be removed.';
 * ```
 */

// =====================================================
// USAGE EXAMPLES
// =====================================================

/**
 * Example: Update OAuth callback to use encrypted tokens
 * 
 * ```typescript
 * import { encryptCalendarTokens, decryptCalendarTokens } from '@/lib/encrypt-tokens';
 * 
 * // In the callback route, before upserting:
 * const encryptedData = encryptCalendarTokens({
 *   user_id: USER_ID,
 *   provider: 'google',
 *   external_id: primaryCal.id,
 *   name: primaryCal.summary,
 *   access_token: tokens.access_token,
 *   refresh_token: tokens.refresh_token,
 *   // ... other fields
 * });
 * 
 * await supabase.from('calendars').upsert(encryptedData);
 * 
 * // When retrieving and using tokens:
 * const { data } = await supabase.from('calendars').select('*').single();
 * const decrypted = decryptCalendarTokens(data);
 * 
 * // Use decrypted.access_token for API calls
 * ```
 */
