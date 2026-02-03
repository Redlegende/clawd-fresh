-- SQL Verification Script for OAuth Debugging
-- Run these queries in Supabase SQL Editor to diagnose issues

-- =====================================================
-- 1. CHECK SCHEMA SETUP
-- =====================================================

-- What schema are the tables in?
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('calendars', 'events', 'users')
ORDER BY table_schema, table_name;

-- Should return rows with table_schema = 'orchestrator'

-- =====================================================
-- 2. CHECK TABLE STRUCTURE
-- =====================================================

-- Calendars table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'orchestrator' 
AND table_name = 'calendars'
ORDER BY ordinal_position;

-- Events table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'orchestrator' 
AND table_name = 'events'
ORDER BY ordinal_position;

-- =====================================================
-- 3. CHECK UNIQUE CONSTRAINTS
-- =====================================================

-- Unique constraints on calendars table
SELECT 
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'orchestrator'
AND tc.table_name = 'calendars'
AND tc.constraint_type = 'UNIQUE';

-- Should show: user_id, provider, external_id

-- =====================================================
-- 4. VERIFY USER EXISTS
-- =====================================================

-- Check if the hardcoded user exists
SELECT id, email, telegram_id, created_at
FROM orchestrator.users
WHERE id = 'b4004bf7-9b69-47e5-8032-c0f39c654a61';

-- If no rows, you need to create this user first:
-- INSERT INTO orchestrator.users (id, email, timezone)
-- VALUES ('b4004bf7-9b69-47e5-8032-c0f39c654a61', 'your@email.com', 'Europe/Oslo');

-- =====================================================
-- 5. CHECK RLS POLICIES
-- =====================================================

-- RLS enabled on calendars table?
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'orchestrator'
AND tablename = 'calendars';

-- RLS policies for calendars
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'orchestrator'
AND tablename = 'calendars';

-- =====================================================
-- 6. TEST INSERT (Manual Verification)
-- =====================================================

-- Test if you can manually insert a calendar record
-- This should work if service role is configured correctly

-- First, check if there's an existing record:
SELECT * FROM orchestrator.calendars 
WHERE user_id = 'b4004bf7-9b69-47e5-8032-c0f39c654a61'
AND provider = 'google';

-- Test insert (you can delete this after):
/*
INSERT INTO orchestrator.calendars (
    user_id,
    provider,
    external_id,
    name,
    email,
    color,
    sync_enabled,
    is_active
) VALUES (
    'b4004bf7-9b69-47e5-8032-c0f39c654a61',
    'google',
    'test-calendar-id',
    'Test Calendar',
    'test@example.com',
    '#4285F4',
    true,
    true
)
ON CONFLICT (user_id, provider, external_id) 
DO UPDATE SET 
    name = EXCLUDED.name,
    updated_at = NOW();
*/

-- =====================================================
-- 7. CHECK FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Check if calendars.user_id references users.id properly
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'orchestrator'
AND tc.table_name = 'calendars'
AND tc.constraint_type = 'FOREIGN KEY';

-- =====================================================
-- 8. VERIFY OAUTH MIGRATION APPLIED
-- =====================================================

-- Check if OAuth columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'orchestrator'
AND table_name = 'calendars'
AND column_name IN (
    'provider_account_id',
    'access_token',
    'refresh_token',
    'expires_at',
    'scopes',
    'webhook_channel_id',
    'calendars',
    'sync_enabled'
);

-- All of these should return rows. If any are missing, run the migration:
-- projects/the-observatory/sql/06_oauth_webhook_migration.sql

-- =====================================================
-- 9. CLEANUP TEST DATA
-- =====================================================

-- Remove test records if needed:
-- DELETE FROM orchestrator.calendars 
-- WHERE external_id = 'test-calendar-id';

-- =====================================================
-- 10. CHECK DATABASE LOGS
-- =====================================================

-- View recent errors (if you have logging enabled)
-- This requires the pgAudit extension or similar

-- Check if you can see RLS violations in logs:
-- (Check Supabase Dashboard > Logs > PostgREST for detailed errors)
