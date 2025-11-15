# Fix Supabase Security Warnings

This guide helps you resolve the security warnings from Supabase's database linter.

## 1. Function Search Path Warnings ✅ FIXED

**Issue**: Functions without explicit `search_path` are vulnerable to search path hijacking attacks.

**Solution**: Run the migration file `005_fix_function_search_path.sql`

```bash
# This migration adds SET search_path = public to all functions
# Run it in Supabase SQL Editor or via CLI
```

The migration updates these functions:
- `update_updated_at_column()`
- `increment_blog_views()`
- `get_supabase_url()`
- `get_service_role_key()`
- `get_function_url()`
- `notify_contact_submission()`
- `notify_form_submission()`

## 2. Leaked Password Protection Warning

**Issue**: Supabase Auth's leaked password protection is currently disabled.

**Solution**: Enable it in the Supabase Dashboard

### Steps to Enable:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Policies** (or **Settings**)
4. Look for **Password Security** or **Leaked Password Protection**
5. Enable the toggle for **"Check passwords against HaveIBeenPwned database"**

### What This Does:

- Prevents users from using passwords that have been compromised in data breaches
- Checks passwords against the HaveIBeenPwned.org database
- Enhances security without impacting user experience
- No code changes required - it's a dashboard setting

### Alternative (if not found in UI):

If you can't find the setting in the dashboard, you can enable it via SQL:

```sql
-- Enable leaked password protection
ALTER DATABASE postgres SET app.settings.auth_password_pwned_check TO 'on';
```

Or contact Supabase support to enable it for your project.

## Verification

After applying the migration and enabling password protection:

1. Go to **Database** → **Linter** in Supabase Dashboard
2. Click **Refresh** or **Run Linter**
3. All warnings should be resolved ✅

## Notes

- The function search_path fix is backward compatible
- Leaked password protection only affects new password creation/changes
- Existing users are not affected
- These changes improve security without breaking functionality
