# KMIT Vichaar - Database Integration Setup

## 🚀 **What's New**

The system now includes:
1. **Database storage** for student credentials and profiles
2. **hCaptcha integration** on the home page
3. **Automatic login** when searching for students
4. **Real-time search** from database instead of localStorage

## 🗄️ **Database Setup**

### 1. **Create Supabase Project**
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Note down your project URL and anon key

### 2. **Set Environment Variables**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. **Run Database Schema**
Execute the SQL commands from `database_schema.sql` in your Supabase SQL editor:

**Important:** The schema now allows NULL values for `hall_ticket` and `name` initially, which will be updated with complete data later. This prevents database constraint errors during the two-phase storage process.

```sql
-- Table 1: Store student credentials
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
    hall_ticket VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    branch VARCHAR(100),
    year VARCHAR(10),
    semester VARCHAR(10),
    student_image TEXT,
    qr_code TEXT,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes and triggers (see database_schema.sql for full details)
```

### 4. **Get hCaptcha Site Key**
1. **Go to [hCaptcha.com](https://www.hcaptcha.com/)**
2. **Sign up/Login** to your account
3. **Create a new site** or use existing one
4. **Copy your site key** (looks like: `10000000-ffff-ffff-ffff-000000000001`)
5. **Update in `src/pages/LoginPage.tsx`:**
   ```tsx
   sitekey="YOUR_ACTUAL_SITE_KEY_HERE"
   ```

**Note:** The `/register` page currently uses a different hCaptcha method (vanilla JS) which is why it works. The home page now uses the React component version.

## 🔄 **How It Works Now**

### **Registration Flow:**
1. Student logs in via `/register` page
2. **Credentials stored** in `student_credentials` table
3. **Minimal profile entry** created in `student_profiles` table (empty fields)
4. **Complete profile data** fetched and stored when dashboard loads
5. Student can now be searched by others with complete information

### **Search Flow:**
1. User enters hall ticket/name on home page (`/`)
2. **hCaptcha verification** required
3. **Database search** finds student profile
4. **Automatic login** using stored credentials + captcha
5. **Direct navigation** to dashboard

### **Database Tables:**
- **`student_credentials`**: Mobile number + password
- **`student_profiles`**: Student info + full profile data
- **Linked by**: `mobile_number` (foreign key relationship)

## 🛠️ **Installation Steps**

1. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js @hcaptcha/react-hcaptcha
   ```

2. **Quick Fix for White Page:**
   - Create `.env` file in root directory
   - Add your Supabase credentials (see `env.example`)
   - Restart your development server

2. **Set up Supabase:**
   - Create project
   - Run schema
   - Update environment variables

3. **Update hCaptcha:**
   - Get your site key from hCaptcha
   - Update in LoginPage.tsx

4. **Test the system:**
   - Register a student
   - Search for that student
   - Verify automatic login works

## 🔍 **Search Features**

- **Search by**: Hall ticket number OR student name
- **Real-time**: Database queries
- **Secure**: hCaptcha verification required
- **Automatic**: Login and redirect to dashboard
- **No manual**: Password entry needed

## 📱 **UI Changes**

- **Home page**: Added hCaptcha above search button
- **Search button**: Disabled until captcha completed
- **No more**: Manual credential entry for search
- **Seamless**: Search → Auto-login → Dashboard

## 🚨 **Important Notes**

1. **First-time users** must register via `/register` page
2. **Search requires** hCaptcha completion
3. **Database storage** happens automatically on first login
4. **Credentials are secure** - only stored for auto-login
5. **Profile updates** happen automatically on subsequent logins

## 🔧 **Troubleshooting**

### **White Page / App Not Loading:**
- **Check console errors** - Look for Supabase connection issues
- **Verify environment variables** - Ensure `.env` file exists with correct values
- **Check Supabase project** - Make sure project is active and accessible

### **Database Issues:**
- **Database connection**: Check Supabase URL and key
- **Table creation**: Verify SQL schema was executed correctly
- **Permissions**: Ensure RLS (Row Level Security) is configured properly

### **hCaptcha Issues:**
- **Site key**: Verify correct site key from hCaptcha dashboard
- **Domain settings**: Ensure your domain is added to hCaptcha site settings
- **Network**: Check if hCaptcha scripts are loading

### **Search Issues:**
- **Search not working**: Check database tables and data
- **Auto-login fails**: Verify stored credentials in database
- **Captcha not working**: Check hCaptcha configuration

## 🎯 **Next Steps**

1. **Test the complete flow**
2. **Add more students** to test search
3. **Monitor database** for data integrity
4. **Customize hCaptcha** styling if needed
