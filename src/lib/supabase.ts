import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dzghtarxvdichthsrhbf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yyHgFvPEOu2zQyaJ4WHB8g_Qrt9chbv';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)