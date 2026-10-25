async function sendEmail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.NOTIFY_FROM
  if (!key || !from || !to) {
    return { skipped: true, reason: "email_not_configured" }
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text, html: html || `<p>${text}</p>` }),
  })
  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: body }
  }
  return { ok: true }
}

async function enqueueAndSend(supabase, { eventType, idempotencyKey, payload, email }) {
  if (!supabase) return { skipped: true }
  const { data } = await supabase
    .from("notification_outbox")
    .insert({
      event_type: eventType,
      payload,
      idempotency_key: idempotencyKey,
      status: "pending",
    })
    .select("id")
    .maybeSingle()

  const result = await sendEmail(email)
  if (data && data.id) {
    await supabase
      .from("notification_outbox")
      .update({
        status: result.ok ? "sent" : result.skipped ? "pending" : "failed",
        attempts: 1,
        last_error: result.error || result.reason || null,
        sent_at: result.ok ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
  }
  return result
}

module.exports = { sendEmail, enqueueAndSend }
