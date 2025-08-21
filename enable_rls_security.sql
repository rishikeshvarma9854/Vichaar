-- Enable Row Level Security (RLS) on student tables
-- This is CRITICAL for data security and privacy

-- Enable RLS on student_credentials table
ALTER TABLE student_credentials ENABLE ROW LEVEL SECURITY;

-- Enable RLS on student_profiles table  
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Create security policies for student_credentials
-- Users can only access their own credentials
CREATE POLICY "Users can view own credentials" ON student_credentials
    FOR SELECT USING (auth.uid()::text = mobile_number);

CREATE POLICY "Users can insert own credentials" ON student_credentials
    FOR INSERT WITH CHECK (auth.uid()::text = mobile_number);

CREATE POLICY "Users can update own credentials" ON student_credentials
    FOR UPDATE USING (auth.uid()::text = mobile_number);

-- Create security policies for student_profiles
-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON student_profiles
    FOR SELECT USING (auth.uid()::text = mobile_number);

CREATE POLICY "Users can insert own profile" ON student_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = mobile_number);

CREATE POLICY "Users can update own profile" ON student_profiles
    FOR UPDATE USING (auth.uid()::text = mobile_number);

-- Additional security: Restrict table access to authenticated users only
CREATE POLICY "Only authenticated users can access credentials" ON student_credentials
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can access profiles" ON student_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('student_credentials', 'student_profiles');

-- Show created policies
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
WHERE tablename IN ('student_credentials', 'student_profiles');
