import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kytphnasmdvebmdvvwtx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjI4MTAsImV4cCI6MjA3MTE5ODgxMH0.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    headers: {},
  },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});