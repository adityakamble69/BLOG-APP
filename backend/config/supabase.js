require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

// The service role key bypasses Row Level Security — this client must only
// ever run on the server, never be shipped to the browser.
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Quick connectivity check on startup
(async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Connected to Supabase.');
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err.message);
    console.error('   Check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env, and that models/schema.sql has been run in the Supabase SQL Editor.');
  }
})();

module.exports = supabase;
