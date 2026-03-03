// ============================================
// SUPABASE CONFIGURATION
// ============================================
// Your SPLITWISE Supabase credentials

const SUPABASE_URL = 'https://zmfsxhnkfplicmkfviuc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MNb_NDYvHpkZ8DbTtWRc1A_M12v4-E9';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is already logged in
async function checkAuth() {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error checking auth:', error);
    return null;
  }
}

// Make available globally
window.supabase = supabaseClient;
window.checkAuth = checkAuth;

console.log('Supabase initialized successfully');