-- First, add unique constraints to existing tables if they don't exist
-- This is needed for the foreign key constraints to work properly

-- Add unique constraint to student_credentials.mobile_number if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_credentials_mobile_number_key'
    ) THEN
        ALTER TABLE student_credentials ADD CONSTRAINT student_credentials_mobile_number_key UNIQUE (mobile_number);
    END IF;
END $$;

-- Add unique constraint to student_profiles.mobile_number if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_profiles_mobile_number_key'
    ) THEN
        ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_mobile_number_key UNIQUE (mobile_number);
    END IF;
END $$;

-- Create login_mappings table to link login credentials with student profiles
-- This prevents overwriting when registering for friends

CREATE TABLE IF NOT EXISTS login_mappings (
    id SERIAL PRIMARY KEY,
    login_phone_number VARCHAR(15) NOT NULL UNIQUE,
    student_mobile_number VARCHAR(15) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_mappings_login_phone ON login_mappings(login_phone_number);
CREATE INDEX IF NOT EXISTS idx_login_mappings_student_phone ON login_mappings(student_mobile_number);

-- Add foreign key constraints (now that unique constraints exist)
ALTER TABLE login_mappings 
ADD CONSTRAINT fk_login_mappings_credentials 
FOREIGN KEY (login_phone_number) REFERENCES student_credentials(mobile_number) ON DELETE CASCADE;

ALTER TABLE login_mappings 
ADD CONSTRAINT fk_login_mappings_profiles 
FOREIGN KEY (student_mobile_number) REFERENCES student_profiles(mobile_number) ON DELETE CASCADE;

-- Add comment
COMMENT ON TABLE login_mappings IS 'Maps login phone numbers to actual student mobile numbers to prevent profile overwriting';
