-- KMIT Vichaar Database Setup for Supabase
-- Run this script step by step in your Supabase SQL Editor

-- Step 1: Create student_credentials table
CREATE TABLE IF NOT EXISTS student_credentials (
    id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
    id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(15) REFERENCES student_credentials(mobile_number) ON DELETE CASCADE,
    hall_ticket VARCHAR(20) UNIQUE,
    name VARCHAR(255),
    branch VARCHAR(100),
    year VARCHAR(10),
    semester VARCHAR(10),
    student_image TEXT,
    qr_code TEXT,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_hall_ticket ON student_profiles(hall_ticket);
CREATE INDEX IF NOT EXISTS idx_student_profiles_name ON student_profiles(name);
CREATE INDEX IF NOT EXISTS idx_student_profiles_mobile ON student_profiles(mobile_number);

-- Step 4: Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_student_credentials_updated_at ON student_credentials;
CREATE TRIGGER update_student_credentials_updated_at 
    BEFORE UPDATE ON student_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Verify tables were created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('student_credentials', 'student_profiles')
ORDER BY table_name, ordinal_position;
