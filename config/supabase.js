const { createClient } = require('@supabase/supabase-js');

let supabase;

const initSupabase = () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Please check your environment variables.');
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false // We'll handle sessions manually for server-side
      }
    });

    console.log('🗄️  Supabase client initialized successfully');
    console.log(`📍 Project URL: ${supabaseUrl}`);
    
    return supabase;
  } catch (error) {
    console.error('❌ Supabase initialization error:', error.message);
    process.exit(1);
  }
};

const getSupabase = () => {
  if (!supabase) {
    return initSupabase();
  }
  return supabase;
};

// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is expected initially
      throw error;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.warn('⚠️  Supabase connection test failed (this is normal if tables don\'t exist yet):', error.message);
    return false;
  }
};

module.exports = {
  initSupabase,
  getSupabase,
  testConnection
};