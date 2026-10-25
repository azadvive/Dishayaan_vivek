const { service, configured } = require("../lib/supabase")
const { json, readBody } = require("../lib/http")

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(event, 204, {})
  if (event.httpMethod !== "POST") return json(event, 405, { ok: false, error: "Method not allowed" })
  if (!configured()) return json(event, 503, { ok: false, error: "Supabase is not configured.", code: "CONFIG_MISSING" })
  const secret = process.env.ADMIN_SETUP_SECRET
  if (!secret || secret.length < 16) {
    return json(event, 503, { ok: false, error: "ADMIN_SETUP_SECRET is not set to a strong value." })
  }
  const body = readBody(event)
  if (body.secret !== secret) return json(event, 403, { ok: false, error: "Invalid setup secret." })
  const email = (body.email || process.env.ADMIN_SETUP_EMAIL || "").trim().toLowerCase()
  if (!email) return json(event, 400, { ok: false, error: "Provide the administrator email." })
  const db = service()
  const { data: profile, error } = await db.from("profiles").select("id, email, role").eq("email", email).maybeSingle()
  if (error) return json(event, 400, { ok: false, error: "Could not look up the profile. The user must register first." })
  if (!profile) return json(event, 404, { ok: false, error: "No account exists for that email. Register on /account first, then retry." })
  const { error: up } = await db.from("profiles").update({ role: "admin", account_status: "active" }).eq("id", profile.id)
  if (up) return json(event, 400, { ok: false, error: "Could not grant administrator role." })
  await db.from("audit_log").insert({ actor_id: profile.id, action: "bootstrap_admin", entity_type: "profiles", entity_id: profile.id })
  return json(event, 200, { ok: true, email, role: "admin" })
}
