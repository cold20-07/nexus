# Admin Panel Setup Guide

## ✅ Admin Panel is Ready!

Your admin panel is now fully functional. Here's how to use it:

## Access the Admin Panel

**URL**: `http://localhost:3000/admin/login` (or `https://your-site.vercel.app/admin/login`)

## Create Admin User

You need to create an admin user in Supabase:

### Step 1: Go to Supabase Authentication

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ehwejkvlreyokfarjjeu
2. Click **"Authentication"** in the left sidebar
3. Click **"Users"** tab
4. Click **"Add user"** or **"Invite user"**

### Step 2: Create Admin Account

Choose one of these methods:

**Method A: Create User Directly**
1. Click **"Add user"** → **"Create new user"**
2. Enter:
   - Email: `admin@yourdomain.com`
   - Password: `YourSecurePassword123!`
3. Check **"Auto Confirm User"** (so you don't need email verification)
4. Click **"Create user"**

**Method B: Invite User**
1. Click **"Invite user"**
2. Enter admin email
3. User will receive invitation email
4. Click link to set password

## Login to Admin Panel

1. Go to: `http://localhost:3000/admin/login`
2. Enter your admin email and password
3. Click **"Sign In"**
4. You'll be redirected to the dashboard

## Admin Panel Features

### 📊 Dashboard (`/admin/dashboard`)
- View statistics (total contacts, services, blog posts, files)
- Quick action links
- Overview of your site

### 📧 Contacts (`/admin/contacts`)
- View all form submissions
- Search contacts
- View full contact details
- Delete contacts
- See contact date and time

### 💼 Services (`/admin/services`)
- View all services
- Toggle active/inactive status
- See service pricing and details
- Quick edit access

### 📝 Blog Posts (`/admin/blog`)
- View all blog posts
- Toggle published/draft status
- See post categories and dates
- Quick edit access

## Features

✅ **Secure Authentication** - Supabase Auth
✅ **Protected Routes** - Only accessible when logged in
✅ **Responsive Design** - Works on mobile and desktop
✅ **Real-time Data** - Direct connection to Supabase
✅ **Search & Filter** - Find contacts quickly
✅ **No Extra Cost** - Uses same Supabase instance

## Security

- All admin routes are protected
- Must be logged in to access
- Session-based authentication
- Automatic logout on session expiry
- Secure password hashing by Supabase

## Editing Content

### For Now:
- **Services & Blog**: Edit directly in Supabase Table Editor
- **Contacts**: View and delete in admin panel

### Coming Soon:
- Full CRUD interface for services
- Rich text editor for blog posts
- Image upload for services/blog
- Bulk actions

## Logout

Click the **"Logout"** button in the sidebar to sign out.

## Troubleshooting

### Can't Login
- Make sure you created a user in Supabase Authentication
- Check email and password are correct
- Verify user is confirmed (not pending)

### "Session expired"
- Your session timed out
- Just login again

### Can't Access Admin Routes
- Make sure you're logged in
- Check browser console for errors
- Clear browser cache and try again

## Mobile Access

The admin panel is fully responsive and works on:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile phones

## Next Steps

1. Create your admin user in Supabase
2. Login to the admin panel
3. Start managing your content!

## Support

If you have issues:
1. Check browser console for errors
2. Verify Supabase credentials in `.env`
3. Make sure you're logged in
4. Try clearing browser cache

---

**Your admin panel is ready to use! 🎉**

Access it at: `/admin/login`
