import { apiPath, isSupabaseConfigured } from "./config"
import { supabase } from "./supabase"

export async function functionPost(name, payload, { token } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = "Bearer " + token
  if (payload && payload.idempotencyKey) headers["X-Idempotency-Key"] = payload.idempotencyKey
  const res = await fetch(apiPath(name), { method: "POST", headers, body: JSON.stringify(payload || {}) })
  let data = {}
  try {
    data = await res.json()
  } catch (e) {
    data = {}
  }
  return { ok: res.ok && data.ok !== false, status: res.status, data, missing: res.status === 404 }
}

export async function getAccessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ? data.session.access_token : null
}

export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return "k-" + Date.now() + "-" + Math.random().toString(36).slice(2)
}

export { isSupabaseConfigured }
