import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ijrseqksqmzeamtdaney.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcnNlcWtzcW16ZWFtdGRhbmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzcwOTIsImV4cCI6MjA3ODUxMzA5Mn0.lIA8EG7Qc24htAmpuDUhnZfvzIvlYUUXu1r-AX8IVaw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
