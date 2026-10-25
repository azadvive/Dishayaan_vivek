import { useEffect } from "react"
import { functionPost, getAccessToken, newIdempotencyKey } from "./lib/api"
import { isSupabaseConfigured } from "./lib/config"
import { supabase } from "./lib/supabase"

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key)
      return v ? JSON.parse(v) : fallback
    } catch (e) {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {}
  },
}

function rememberUnsent(name, data, reason) {
  const list = store.get("dy_outbox_unsent", [])
  list.push({ name, data, at: new Date().toISOString(), reason, sent: false })
  store.set("dy_outbox_unsent", list)
}

function mapFormToTable(name) {
  if (name === "book-session") return "bookings"
  if (name === "mentor-connect") return "mentor_requests"
  return "enquiries"
}

async function clientInsert(name, data, tokenMeta) {
  if (!supabase) return { ok: false, error: "Database is not configured." }
  if (name === "book-session") {
    const reference = data.reference || "DY-" + Math.random().toString(36).slice(2, 8).toUpperCase()
    const row = {
      reference,
      user_id: tokenMeta.userId || null,
      booker_role: data.role || null,
      name: data.name,
      whatsapp: data.whatsapp,
      email: data.email || null,
      domain: data.domain || null,
      session_mode: data.mode || null,
      mentor_slug: data.mentor_seat || null,
      context: data.context || null,
      requested_date: data.date || null,
      slot: data.slot || null,
      status: "pending",
      idempotency_key: "book:" + (data.idempotencyKey || reference),
    }
    const { data: saved, error } = await supabase.from("bookings").insert(row).select("reference, status").single()
    if (error) return { ok: false, error: error.message }
    return { ok: true, reference: saved.reference, status: saved.status, pending: true }
  }
  if (name === "mentor-connect") {
    const { data: saved, error } = await supabase
      .from("mentor_requests")
      .insert({
        user_id: tokenMeta.userId || null,
        name: data.name,
        whatsapp: data.whatsapp,
        class_level: data.class || null,
        domain: data.domain || null,
        language: data.language || null,
        availability: data.availability || null,
        context: data.context || null,
        status: "pending",
        idempotency_key: "mentor:" + (data.idempotencyKey || data.whatsapp + data.domain),
      })
      .select("id, status")
      .single()
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: saved.id, status: saved.status }
  }
  const { data: saved, error } = await supabase
    .from("enquiries")
    .insert({
      user_id: tokenMeta.userId || null,
      category: name,
      name: data.name || data.student,
      organization: data.institution || null,
      email: data.email || null,
      phone: data.whatsapp || data.phone,
      class_level: data.class || null,
      domain: data.domain || null,
      message: data.context || data.requirement || null,
      plan_slug: data.plan || null,
      status: "new",
      idempotency_key: name + ":" + (data.idempotencyKey || Date.now()),
    })
    .select("id, status")
    .single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, id: saved.id, status: saved.status }
}

// Primary path: Netlify function (service role, validation, notifications).
// Fallback: authenticated/anonymous Supabase insert when functions are not running locally.
// Local outbox is unsent-only and is never treated as a successful save.
export async function submitForm(name, data) {
  const payload = { form: name, data, idempotencyKey: data.idempotencyKey || newIdempotencyKey() }
  const token = await getAccessToken()
  const fn = await functionPost("submit", payload, { token })
  if (fn.ok) return { ok: true, ...fn.data }
  if (!fn.missing && fn.status !== 0 && fn.status !== 404) {
    rememberUnsent(name, data, fn.data.error || "server_rejected")
    return { ok: false, error: (fn.data && fn.data.error) || "Could not save. Please retry." }
  }
  if (isSupabaseConfigured) {
    let userId = null
    if (supabase) {
      const { data: s } = await supabase.auth.getUser()
      userId = s.user ? s.user.id : null
    }
    if (!userId && name !== "never") {
      // Anonymous visitors cannot insert under RLS; require the function in production.
      // Still try — some policies allow authenticated only.
    }
    const inserted = await clientInsert(name, { ...data, idempotencyKey: payload.idempotencyKey }, { userId })
    if (inserted.ok) return inserted
    rememberUnsent(name, data, inserted.error)
    return {
      ok: false,
      error: userId
        ? inserted.error
        : "Could not reach the booking service. Sign in, or run `npx netlify dev` so submissions can be saved.",
    }
  }
  rememberUnsent(name, data, "config_missing")
  return {
    ok: false,
    error: "The backend is not configured yet. Add Supabase keys (see .env.example). This request was stored locally as unsent, not as a confirmed record.",
    unsent: true,
  }
}

export function useSeo(title, description) {
  useEffect(() => {
    if (title) document.title = title.includes("DishaYaaN") ? title : title + " · DishaYaaN"
    if (description) {
      let m = document.querySelector('meta[name="description"]')
      if (!m) {
        m = document.createElement("meta")
        m.name = "description"
        document.head.appendChild(m)
      }
      m.content = description
    }
  }, [title, description])
}

export const track = (event, props = {}) => {
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...props })
  } catch (e) {}
}

export { mapFormToTable }
