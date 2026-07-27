import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmywfaffczulebozlpsx.supabase.co';
const supabasePublishableKey = 'sb_publishable_X8WWqPNHHLh4lcytyNqZxQ_afwuUH6q';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
