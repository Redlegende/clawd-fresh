-- Create igms_properties table
CREATE TABLE IF NOT EXISTS igms_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
  title TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  type TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  max_guests INTEGER,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_igms_properties_uid ON igms_properties(uid);

-- Clean up old test tokens (if any exist with 'test' or old format)
-- Uncomment and modify as needed:
-- DELETE FROM igms_tokens WHERE created_at < '2025-01-01';
-- DELETE FROM igms_tokens WHERE access_token LIKE '%test%';

-- Or view existing tokens first:
-- SELECT id, created_at, LEFT(access_token, 20) as token_prefix FROM igms_tokens ORDER BY created_at DESC;
