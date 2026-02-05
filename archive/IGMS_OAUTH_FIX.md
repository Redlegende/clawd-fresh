# iGMS OAuth Fix Summary

## Problem Identified
The OAuth connection was failing due to a **database schema mismatch**. The settings page was trying to query `igms_tokens` ordered by a `created_at` column that didn't exist:

```typescript
// This was causing an error:
.order('created_at', { ascending: false })
```

Error: `column igms_tokens.created_at does not exist`

## Fixes Applied

### 1. Settings Page (`src/app/dashboard/settings/page.tsx`)
**Before:**
```typescript
const { data: igmsToken } = await supabase
  .from('igms_tokens')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

**After:**
```typescript
const { data: igmsToken } = await supabase
  .from('igms_tokens')
  .select('*')
  .neq('access_token', '')  // Filter out placeholder rows
  .limit(1)
  .maybeSingle()  // Handle empty results gracefully
```

### 2. Auth Route (`src/app/api/igms/auth/route.ts`)
**Before:**
```typescript
await supabase.from('igms_tokens').delete()  // Deleted ALL tokens!
```

**After:**
```typescript
await supabase.from('igms_tokens').delete().eq('id', state)  // Only delete placeholder for this state
```

## How to Complete the Fix

### Option A: Add the created_at column (Recommended)
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/spjcdygewwthheriwqaa
2. Navigate to: Database → Tables → igms_tokens → Edit Table
3. Add column: `created_at` (type: `timestamptz`, default: `now()`)

### Option B: Use the code without created_at (Current)
The code has been updated to work without the `created_at` column.

## Testing the OAuth Flow

1. Go to: https://app-pink-eight-65.vercel.app/dashboard/settings
2. Click "Connect iGMS"
3. You should be redirected to iGMS to authorize
4. After authorization, you'll be redirected back with `?igms_connected=true`
5. The dashboard should now show "Connected to iGMS"

## Next Steps

1. Wait for the current deployment to complete
2. Try the OAuth flow
3. If it works, add the `created_at` column for better tracking
4. Update the code to include `created_at` in the upsert operations
