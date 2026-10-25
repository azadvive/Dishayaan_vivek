const { service, configured } = require("../lib/supabase")
const { json, readBody, rateLimit, randomRef } = require("../lib/http")
const { validateBooking, validateMentorConnect, validateEnquiry, fingerprint } = require("../lib/validate")
const { enqueueAndSend } = require("../lib/notify")

function authHeader(event) {
  const h = event.headers || {}
  return h.authorization || h.Authorization || ""
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(event, 204, {})
  if (event.httpMethod !== "POST") return json(event, 405, { ok: false, error: "Method not allowed" })
  if (!rateLimit(event, "submit", 20, 10 * 60 * 1000)) {
    return json(event, 429, { ok: false, error: "Too many submissions. Please wait and retry." })
  }
  if (!configured()) {
    return json(event, 503, {
      ok: false,
      error: "Backend is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
      code: "CONFIG_MISSING",
    })
  }

  const body = readBody(event)
  const form = body.form || body["form-name"]
  const data = body.data || body
  const idempotency = body.idempotencyKey || (event.headers && event.headers["x-idempotency-key"]) || fingerprint([form, data.whatsapp, data.email, data.date, data.slot, data.context])
  const db = service()

  const jwt = authHeader(event).replace(/^Bearer\s+/i, "")
  let userId = null
  if (jwt) {
    const { data: u } = await db.auth.getUser(jwt)
    userId = u && u.user ? u.user.id : null
  }

  try {
    if (form === "book-session") {
      const v = validateBooking(data)
      if (!v.ok) return json(event, 400, { ok: false, error: "Please check the highlighted fields.", fields: v.errors })
      const reference = data.reference && /^DY-[A-Z0-9]{6}$/.test(data.reference) ? data.reference : randomRef("DY")
      const row = {
        ...v.value,
        reference,
        user_id: userId,
        status: "pending",
        idempotency_key: "book:" + idempotency,
      }
      if (row.mentor_slug) {
        const { data: m } = await db.from("mentors").select("id").eq("slug", row.mentor_slug).maybeSingle()
        if (m) row.mentor_id = m.id
      }
      const { data: saved, error } = await db.from("bookings").insert(row).select("id, reference, status").single()
      if (error) {
        if (error.code === "23505") {
          const { data: existing } = await db.from("bookings").select("id, reference, status").eq("idempotency_key", row.idempotency_key).maybeSingle()
          if (existing) return json(event, 200, { ok: true, duplicate: true, reference: existing.reference, status: existing.status })
          return json(event, 409, { ok: false, error: "A similar pending request already exists for that slot." })
        }
        return json(event, 400, { ok: false, error: "Could not save the booking request." })
      }
      await enqueueAndSend(db, {
        eventType: "booking_requested",
        idempotencyKey: "mail:book:" + saved.reference,
        payload: { reference: saved.reference },
        email: {
          to: row.email || process.env.NOTIFY_ADMIN_EMAIL,
          subject: `DishaYaaN booking request ${saved.reference}`,
          text: `We received your session request ${saved.reference}. It is pending until the team confirms a slot. This is not a confirmed appointment.`,
        },
      })
      if (process.env.NOTIFY_ADMIN_EMAIL) {
        await enqueueAndSend(db, {
          eventType: "booking_admin",
          idempotencyKey: "mail:book-admin:" + saved.reference,
          payload: { reference: saved.reference },
          email: {
            to: process.env.NOTIFY_ADMIN_EMAIL,
            subject: `New booking ${saved.reference}`,
            text: `${row.name} requested ${row.domain || "a session"} (${saved.reference}). Status: pending.`,
          },
        })
      }
      return json(event, 200, { ok: true, reference: saved.reference, status: saved.status, pending: true })
    }

    if (form === "mentor-connect") {
      const v = validateMentorConnect(data)
      if (!v.ok) return json(event, 400, { ok: false, error: "Please check name and WhatsApp number.", fields: v.errors })
      const row = { ...v.value, user_id: userId, status: "pending", idempotency_key: "mentor:" + idempotency }
      const { data: saved, error } = await db.from("mentor_requests").insert(row).select("id, status").single()
      if (error) {
        if (error.code === "23505") return json(event, 200, { ok: true, duplicate: true })
        return json(event, 400, { ok: false, error: "Could not save the mentor request." })
      }
      await enqueueAndSend(db, {
        eventType: "mentor_request",
        idempotencyKey: "mail:mentor:" + saved.id,
        payload: { id: saved.id },
        email: {
          to: process.env.NOTIFY_ADMIN_EMAIL,
          subject: "New mentor connection request",
          text: `${row.name} (${row.whatsapp}) asked to connect about ${row.domain || "a domain"}.`,
        },
      })
      return json(event, 200, { ok: true, id: saved.id, status: saved.status })
    }

    if (form === "home-demand" || form === "partner-enquiry" || form === "plan-checkout") {
      const v = validateEnquiry(data, form)
      if (!v.ok) return json(event, 400, { ok: false, error: "Please check the required fields.", fields: v.errors })
      const row = { ...v.value, user_id: userId, status: "new", idempotency_key: form + ":" + idempotency }
      const { data: saved, error } = await db.from("enquiries").insert(row).select("id, status").single()
      if (error) {
        if (error.code === "23505") return json(event, 200, { ok: true, duplicate: true, id: null })
        return json(event, 400, { ok: false, error: "Could not save the enquiry." })
      }
      await enqueueAndSend(db, {
        eventType: form,
        idempotencyKey: "mail:" + form + ":" + saved.id,
        payload: { id: saved.id },
        email: {
          to: process.env.NOTIFY_ADMIN_EMAIL,
          subject: form === "partner-enquiry" ? "New partnership enquiry" : "New DishaYaaN enquiry",
          text: `${row.name}: ${row.message || row.plan_slug || ""}`,
        },
      })
      return json(event, 200, { ok: true, id: saved.id, status: saved.status, payment: form === "plan-checkout" ? "not_charged" : undefined })
    }

    return json(event, 400, { ok: false, error: "Unknown form." })
  } catch (e) {
    return json(event, 500, { ok: false, error: "Server error while saving. Please retry." })
  }
}
