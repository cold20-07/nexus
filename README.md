# Medical Consulting Website

A modern, serverless medical consulting website built with React and Supabase.

## Features

- 🏥 **Services Showcase** - Display medical consulting services
- 📝 **Blog System** - Share articles and updates
- 📧 **Contact Forms** - Contact form and Aid & Attendance form
- 📎 **File Uploads** - Secure file upload with Supabase Storage
- 🔒 **HIPAA Compliant** - Private storage and Row Level Security
- ⚡ **Serverless** - No backend server needed

## Tech Stack

- **Frontend**: React 18, React Router, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **UI Components**: Radix UI, Lucide Icons
- **Forms**: React Hook Form, Sonner (toasts)

## Project Structure

```
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # API and utilities
│   │   └── hooks/        # Custom React hooks
│   ├── public/           # Static assets
│   └── package.json
├── supabase/             # Database migrations and seeds
│   ├── migrations/       # SQL schema
│   └── seed.sql          # Sample data
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migration: `supabase/migrations/001_initial_schema.sql`
   - Run the seed data: `supabase/seed.sql`
   - Run the policies: `supabase/enable_all_access.sql`

4. **Configure environment variables**
   
   Create `frontend/.env`:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Database Setup

### 1. Run Migrations

Go to Supabase SQL Editor and run:
- `supabase/migrations/001_initial_schema.sql` - Creates tables
- `supabase/seed.sql` - Adds sample data
- `supabase/enable_all_access.sql` - Sets up RLS policies

### 2. Create Storage Bucket

The storage bucket is created automatically by the `enable_all_access.sql` script.

## Available Scripts

```bash
npm start       # Start development server
npm build       # Build for production
npm test        # Run tests
```

## Key Features

### Services
- Display medical consulting services
- Service detail pages with FAQs
- Pricing and duration information

### Blog
- Article listing with search and filters
- Category-based organization
- Individual blog post pages

### Contact Forms
- General contact form
- Specialized Aid & Attendance form
- File upload capability
- Form submissions saved to Supabase

### File Management
- Secure file uploads to Supabase Storage
- File listing and management
- Download with signed URLs
- Delete functionality

## Deployment

### Frontend (Vercel/Netlify)

1. Connect your repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/build`
4. Add environment variables

### Database (Supabase)

Already hosted on Supabase - no additional deployment needed.

## Environment Variables

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on GitHub.
