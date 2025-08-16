-- Database Performance Indexes for Faster Searches
-- Run this in your Supabase SQL Editor

-- Add indexes to student_profiles table for faster searches
CREATE INDEX IF NOT EXISTS idx_student_profiles_hall_ticket ON student_profiles(hall_ticket);
CREATE INDEX IF NOT EXISTS idx_student_profiles_name ON student_profiles(name);
CREATE INDEX IF NOT EXISTS idx_student_profiles_mobile_number ON student_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_student_profiles_branch ON student_profiles(branch);

-- Add indexes to student_credentials table
CREATE INDEX IF NOT EXISTS idx_student_credentials_mobile_number ON student_credentials(mobile_number);

-- Add composite index for common search combinations
CREATE INDEX IF NOT EXISTS idx_student_profiles_search ON student_profiles(hall_ticket, name, mobile_number);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('student_profiles', 'student_credentials')
ORDER BY tablename, indexname;

-- Performance test query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM student_profiles 
WHERE hall_ticket = '23BD1A664Z' 
   OR name ILIKE '%KUCHARLAPATI%' 
   OR mobile_number = '8712596188';
