-- Migration: Admin User Management System
-- This enables role-based access control and admin account creation

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by ON admin_users(created_by);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all admin users
CREATE POLICY "Admins can view all admin users"
ON admin_users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid() AND is_active = true
    )
);

-- RLS Policy: Super admins can create admin users
CREATE POLICY "Super admins can create admin users"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    )
);

-- RLS Policy: Super admins can update admin users
CREATE POLICY "Super admins can update admin users"
ON admin_users FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    )
);

-- RLS Policy: Admins can update their own profile
CREATE POLICY "Admins can update their own profile"
ON admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = user_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = user_id 
        AND role = 'super_admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM admin_users
    WHERE id = user_id AND is_active = true;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- Trigger: Update last_login on auth sign in
CREATE OR REPLACE FUNCTION update_admin_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE admin_users
    SET last_login = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger needs to be created on auth.users table
-- Run this separately if you have access to auth schema:
-- CREATE TRIGGER on_auth_user_login
--     AFTER UPDATE ON auth.users
--     FOR EACH ROW
--     WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
--     EXECUTE FUNCTION update_admin_last_login();

-- Add comments for documentation
COMMENT ON TABLE admin_users IS 'Admin user management with role-based access control';
COMMENT ON COLUMN admin_users.role IS 'User role: super_admin (full access), admin (manage content), editor (edit only)';
COMMENT ON COLUMN admin_users.is_active IS 'Whether the admin account is active and can log in';
COMMENT ON COLUMN admin_users.created_by IS 'ID of the admin who created this account';
COMMENT ON COLUMN admin_users.last_login IS 'Timestamp of last successful login';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON admin_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert initial super admin (update with your email)
-- Note: This user must already exist in auth.users
-- INSERT INTO admin_users (id, email, full_name, role, is_active)
-- SELECT id, email, 'Super Admin', 'super_admin', true
-- FROM auth.users
-- WHERE email = 'your-email@example.com'
-- ON CONFLICT (id) DO NOTHING;
