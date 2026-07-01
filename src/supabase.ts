import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eortonjursosvasbkana.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yDLqXmAA4x5e2uQI8LwoFg_OxPYlx7K';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
