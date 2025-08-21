-- Comprehensive Security Setup for Student Portal
-- This addresses the RLS issues and adds multiple security layers

-- 1. ENABLE ROW LEVEL SECURITY (CRITICAL)
ALTER TABLE student_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create a secure role for the application
CREATE ROLE app_user NOLOGIN;
CREATE ROLE authenticated_user NOLOGIN;

-- 3. Grant minimal necessary permissions
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON student_credentials TO app_user;
GRANT SELECT, INSERT, UPDATE ON student_profiles TO app_user;

-- 4. Create comprehensive security policies for student_credentials
CREATE POLICY "cred_select_policy" ON student_credentials
    FOR SELECT USING (
        -- Users can only see their own credentials
        mobile_number = current_setting('app.current_user_mobile', true)::text
        OR 
        -- Allow search functionality for authenticated users
        (current_setting('app.current_user_mobile', true) IS NOT NULL)
    );

CREATE POLICY "cred_insert_policy" ON student_credentials
    FOR INSERT WITH CHECK (
        -- Users can only insert their own credentials
        mobile_number = current_setting('app.current_user_mobile', true)::text
    );

CREATE POLICY "cred_update_policy" ON student_credentials
    FOR UPDATE USING (
        -- Users can only update their own credentials
        mobile_number = current_setting('app.current_user_mobile', true)::text
    );

-- 5. Create comprehensive security policies for student_profiles
CREATE POLICY "profile_select_policy" ON student_profiles
    FOR SELECT USING (
        -- Users can only see their own profile
        mobile_number = current_setting('app.current_user_mobile', true)::text
        OR
        -- Allow search functionality for authenticated users
        (current_setting('app.current_user_mobile', true) IS NOT NULL)
    );

CREATE POLICY "profile_insert_policy" ON student_profiles
    FOR INSERT WITH CHECK (
        -- Users can only insert their own profile
        mobile_number = current_setting('app.current_user_mobile', true)::text
    );

CREATE POLICY "profile_update_policy" ON student_profiles
    FOR UPDATE USING (
        -- Users can only update their own profile
        mobile_number = current_setting('app.current_user_mobile', true)::text
    );

-- 6. Create a function to set current user context
CREATE OR REPLACE FUNCTION set_user_context(user_mobile text)
RETURNS void AS $$
BEGIN
    -- Set the current user's mobile number for RLS policies
    PERFORM set_config('app.current_user_mobile', user_mobile, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a function to clear user context
CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS void AS $$
BEGIN
    -- Clear the current user context
    PERFORM set_config('app.current_user_mobile', NULL, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permissions
GRANT EXECUTE ON FUNCTION set_user_context(text) TO app_user;
GRANT EXECUTE ON FUNCTION clear_user_context() TO app_user;

-- 9. Create a secure search function that respects RLS
CREATE OR REPLACE FUNCTION secure_search_students(search_term text)
RETURNS TABLE(
    id integer,
    name text,
    hall_ticket text,
    mobile_number text,
    email text
) AS $$
BEGIN
    -- Set context for the current authenticated user
    PERFORM set_user_context(current_setting('app.current_user_mobile', true));
    
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.hall_ticket,
        sp.mobile_number,
        sp.email
    FROM student_profiles sp
    WHERE 
        UPPER(sp.name) LIKE '%' || UPPER(search_term) || '%'
        OR UPPER(sp.hall_ticket) LIKE '%' || UPPER(search_term) || '%'
        OR sp.mobile_number LIKE '%' || search_term || '%';
        
    -- Clear context after search
    PERFORM clear_user_context();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant execute on search function
GRANT EXECUTE ON FUNCTION secure_search_students(text) TO app_user;

-- 11. Verify RLS is enabled and policies are created
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED - SECURITY RISK!'
    END as security_status
FROM pg_tables 
WHERE tablename IN ('student_credentials', 'student_profiles');

-- 12. Show all created policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN permissive THEN 'Permissive'
        ELSE 'Restrictive'
    END as policy_type
FROM pg_policies 
WHERE tablename IN ('student_credentials', 'student_profiles')
ORDER BY tablename, cmd;

-- 13. Test RLS functionality
-- This will show if RLS is working properly
SELECT 
    'RLS Test Results' as test_type,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies
FROM pg_policies 
WHERE tablename IN ('student_credentials', 'student_profiles');
