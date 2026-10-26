const { createClient } = require("@supabase/supabase-js")
const env = require("./env")

let adminClient = null
let anonClient = null

function isConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
}

function getAdminClient() {
  if (!isConfigured()) return null
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return adminClient
}

function getAnonClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null
  if (!anonClient) {
    anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return anonClient
}

module.exports = {
  isConfigured,
  getAdminClient,
  getAnonClient,
}
