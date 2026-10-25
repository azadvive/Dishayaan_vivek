import { createClient } from "@supabase/supabase-js"
import { isSupabaseConfigured, supabaseAnon, supabaseUrl } from "./config"

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
