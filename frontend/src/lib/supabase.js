import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Reduce retry attempts to avoid flooding console with errors
    retryAttempts: 3,
  },
  global: {
    // Use native fetch to avoid conflicts with monitoring tools
    fetch: (...args) => fetch(...args),
  },
});

export const STORAGE_BUCKETS = {
  MEDICAL_DOCUMENTS: 'medical-documents',
};
