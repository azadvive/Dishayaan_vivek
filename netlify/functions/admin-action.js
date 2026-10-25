const { service, configured } = require("../lib/supabase")
const { json, readBody } = require("../lib/http")
const { BOOKING_STATUSES } = require("../lib/validate")
const { enqueueAndSend } = require("../lib/notify")

async function requireAdmin(event, db) {
  const h = event.headers || {}
  const auth = h.authorization || h.Authorization || ""
  const jwt = auth.replace(/^Bearer\s+/i, "")
  if (!jwt) return { error: "Sign in required." }
  const { data, error } = await db.auth.getUser(jwt)
  if (error || !data.user) return { error: "Invalid session." }
  const { data: profile } = await db.from("profiles").select("id, role, account_status").eq("id", data.user.id).single()
  if (!profile || profile.role !== "admin" || profile.account_status !== "active") return { error: "Administrator access required." }
  return { user: data.user, profile }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(event, 204, {})
  if (event.httpMethod !== "POST") return json(event, 405, { ok: false, error: "Method not allowed" })
  if (!configured()) return json(event, 503, { ok: false, error: "Backend is not configured.", code: "CONFIG_MISSING" })
  const db = service()
  const gate = await requireAdmin(event, db)
  if (gate.error) return json(event, 403, { ok: false, error: gate.error })
  const body = readBody(event)
  const { action, id, status, notes, role, account_status, assigned_mentor_id } = body

  try {
    if (action === "booking_status") {
      if (!BOOKING_STATUSES.includes(status)) return json(event, 400, { ok: false, error: "Invalid status." })
      const { data: current, error: findErr } = await db.from("bookings").select("*").eq("id", id).single()
      if (findErr || !current) return json(event, 404, { ok: false, error: "Booking not found." })
      if (status === "confirmed" && current.mentor_id && current.requested_date && current.slot) {
        const { data: clash } = await db
          .from("bookings")
          .select("id")
          .eq("mentor_id", current.mentor_id)
          .eq("requested_date", current.requested_date)
          .eq("slot", current.slot)
          .eq("status", "confirmed")
          .neq("id", id)
        if (clash && clash.length) return json(event, 409, { ok: false, error: "That mentor already has a confirmed session in this slot." })
      }
      const { error } = await db.from("bookings").update({ status, admin_notes: notes || current.admin_notes, mentor_id: assigned_mentor_id || current.mentor_id }).eq("id", id)
      if (error) return json(event, 400, { ok: false, error: "Could not update booking." })
      await db.from("audit_log").insert({ actor_id: gate.profile.id, action: "booking_status", entity_type: "bookings", entity_id: id, meta: { status } })
      if (current.email && (status === "confirmed" || status === "cancelled" || status === "rejected")) {
        await enqueueAndSend(db, {
          eventType: "booking_" + status,
          idempotencyKey: "mail:booking:" + status + ":" + current.reference,
          payload: { reference: current.reference, status },
          email: {
            to: current.email,
            subject: `DishaYaaN booking ${current.reference} ${status}`,
            text: `Your booking ${current.reference} is now ${status}.`,
          },
        })
      }
      return json(event, 200, { ok: true })
    }
    if (action === "enquiry_status") {
      const { error } = await db.from("enquiries").update({ status, admin_notes: notes || null, assigned_admin_id: gate.profile.id }).eq("id", id)
      if (error) return json(event, 400, { ok: false, error: "Could not update enquiry." })
      await db.from("audit_log").insert({ actor_id: gate.profile.id, action: "enquiry_status", entity_type: "enquiries", entity_id: id, meta: { status } })
      return json(event, 200, { ok: true })
    }
    if (action === "mentor_request_status") {
      const { error } = await db.from("mentor_requests").update({ status, admin_notes: notes || null, assigned_mentor_id: assigned_mentor_id || null }).eq("id", id)
      if (error) return json(event, 400, { ok: false, error: "Could not update request." })
      return json(event, 200, { ok: true })
    }
    if (action === "user_status") {
      if (!["active", "suspended", "pending"].includes(account_status)) return json(event, 400, { ok: false, error: "Invalid account status." })
      const { error } = await db.from("profiles").update({ account_status }).eq("id", id)
      if (error) return json(event, 400, { ok: false, error: "Could not update user." })
      await db.from("audit_log").insert({ actor_id: gate.profile.id, action: "user_status", entity_type: "profiles", entity_id: id, meta: { account_status } })
      return json(event, 200, { ok: true })
    }
    if (action === "user_role") {
      if (!["student", "mentor"].includes(role) && role !== "admin") return json(event, 400, { ok: false, error: "Invalid role." })
      if (role === "admin" && id === gate.profile.id) {
        /* allowed for existing admin granting others; self stays */
      }
      const { error } = await db.from("profiles").update({ role }).eq("id", id)
      if (error) return json(event, 400, { ok: false, error: "Could not update role." })
      await db.from("audit_log").insert({ actor_id: gate.profile.id, action: "user_role", entity_type: "profiles", entity_id: id, meta: { role } })
      return json(event, 200, { ok: true })
    }
    if (action === "moderate_post") {
      const vis = body.visibility || "hidden"
      const mod = body.moderation_status || "removed"
      const { error } = await db.from("community_posts").update({ visibility: vis, moderation_status: mod }).eq("id", id)
      if (error) return json(event, 400, { ok: false, error: "Could not moderate post." })
      await db.from("moderation_actions").insert({ admin_id: gate.profile.id, target_type: "post", target_id: id, action: mod, notes })
      return json(event, 200, { ok: true })
    }
    if (action === "report_status") {
      const { error } = await db.from("community_reports").update({ status, admin_notes: notes || null }).eq("id", id)
      if (error) return json(event, 400, { ok: false, error: "Could not update report." })
      return json(event, 200, { ok: true })
    }
    return json(event, 400, { ok: false, error: "Unknown action." })
  } catch (e) {
    return json(event, 500, { ok: false, error: "Server error." })
  }
}
