const SUPABASE_URL = 'https://rsfeogzegsdkiehtrjms.supabase.co'; // <-- pon aquí tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZmVvZ3plZ3Nka2llaHRyam1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDQxNTMsImV4cCI6MjA2NDUyMDE1M30.ea4r9w34jzLVPXuRA5uGc8XOjT6jWSJlUDVYN0py-zs'; // <-- pon aquí tu anon key

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);