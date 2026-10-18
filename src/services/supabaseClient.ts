import { createClient } from '@supabase/supabase-js'

const env = import.meta.env ?? {}

const supabaseUrl = env.VITE_SUPABASE_URL ?? "http://localhost"
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "test-anon-key"

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
