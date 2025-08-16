-- Database schema for KMIT Vichaar student search system

-- Table 1: Store student credentials (mobile number and password)
CREATE TABLE student_credentials (
    id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Store student profile data
CREATE TABLE student_profiles (
    id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(15) REFERENCES student_credentials(mobile_number) ON DELETE CASCADE,
    hall_ticket VARCHAR(20) UNIQUE, -- Removed NOT NULL constraint
    name VARCHAR(255), -- Removed NOT NULL constraint
    branch VARCHAR(100),
    year VARCHAR(10),
    semester VARCHAR(10),
    student_image TEXT, -- Base64 encoded image
    qr_code TEXT, -- Base64 encoded QR code
    profile_data JSONB, -- Full profile data from KMIT API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX idx_student_profiles_hall_ticket ON student_profiles(hall_ticket);
CREATE INDEX idx_student_profiles_name ON student_profiles(name);
CREATE INDEX idx_student_profiles_mobile ON student_profiles(mobile_number);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_student_credentials_updated_at 
    BEFORE UPDATE ON student_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
-- INSERT INTO student_credentials (mobile_number, password) VALUES 
-- ('8712596188', 'Kmit123$'),
-- ('9876543210', 'Password123');

-- INSERT INTO student_profiles (mobile_number, hall_ticket, name, branch, year, semester) VALUES 
-- ('8712596188', '23BD1A664Y', 'KUCHARLAPATI SRI RISHIKESH VARMA', 'CSM', '3', '1'),
-- ('9876543210', '23BD1A665Z', 'SAMPLE STUDENT', 'CSM', '2', '2');
