const env = require("../config/env")
const db = require("../config/db")

async function sendEmail({ to, subject, text, html }) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_FROM || !to) {
    return { skipped: true, reason: "email_not_configured" }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM,
        to: [to],
        subject,
        text,
        html: html || `<p>${text}</p>`,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: errText }
    }

    const data = await res.json()
    return { ok: true, id: data.id }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

async function enqueueAndSend({ eventType, idempotencyKey, payload = {}, email }) {
  const client = db.getAdminClient()
  let outboxId = null

  if (client) {
    try {
      const { data } = await client
        .from("notification_outbox")
        .insert({
          event_type: eventType,
          payload,
          idempotency_key: idempotencyKey,
          status: "pending",
        })
        .select("id")
        .maybeSingle()
      if (data) outboxId = data.id
    } catch (e) {
      console.warn("[NotificationOutbox] Could not enqueue to outbox:", e.message)
    }
  }

  const result = await sendEmail(email)

  if (client && outboxId) {
    try {
      await client
        .from("notification_outbox")
        .update({
          status: result.ok ? "sent" : result.skipped ? "pending" : "failed",
          attempts: 1,
          last_error: result.error || result.reason || null,
          sent_at: result.ok ? new Date().toISOString() : null,
        })
        .eq("id", outboxId)
    } catch (e) {}
  }

  return result
}

module.exports = {
  sendEmail,
  enqueueAndSend,
}
