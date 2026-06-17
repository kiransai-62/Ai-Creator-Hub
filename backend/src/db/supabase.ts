import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
}

export let supabase: SupabaseClient = null as any;

try {
  if (supabaseUrl && supabaseServiceKey) {
    // We use the Service Role Key in the backend to bypass Row Level Security 
    // for admin operations or secure queries.
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

