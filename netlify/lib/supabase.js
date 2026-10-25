const { createClient } = require("@supabase/supabase-js")

function envUrl() {
  return process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || ""
}

function service() {
  const url = envUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function configured() {
  return Boolean(envUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

module.exports = { service, configured, envUrl }
