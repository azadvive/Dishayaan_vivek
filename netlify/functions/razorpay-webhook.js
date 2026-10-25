const crypto = require("crypto")
const { service, configured } = require("../lib/supabase")
const { json, readBody } = require("../lib/http")
const { enqueueAndSend } = require("../lib/notify")

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(event, 405, { ok: false })
  if (!configured()) return json(event, 503, { ok: false, code: "CONFIG_MISSING" })
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return json(event, 503, { ok: false, error: "Webhook secret missing." })
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body || ""
  const sig = (event.headers && (event.headers["x-razorpay-signature"] || event.headers["X-Razorpay-Signature"])) || ""
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex")
  if (!sig || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return json(event, 401, { ok: false, error: "Invalid signature." })
  }
  const payload = readBody(event)
  const eventName = payload.event
  const payment = payload.payload && payload.payload.payment && payload.payload.payment.entity
  const orderId = payment && payment.order_id
  if (!orderId) return json(event, 200, { ok: true, ignored: true })
  const db = service()
  const { data: order } = await db.from("orders").select("*").eq("provider_order_id", orderId).maybeSingle()
  if (!order) return json(event, 200, { ok: true, ignored: true })
  if (order.status === "paid") return json(event, 200, { ok: true, duplicate: true })

  if (eventName === "payment.captured" || eventName === "order.paid") {
    await db
      .from("orders")
      .update({ status: "paid", provider_payment_id: payment.id, raw_event: payload })
      .eq("id", order.id)
    if (order.user_id && order.plan_id) {
      await db.from("enrollments").insert({
        student_id: order.user_id,
        plan_id: order.plan_id,
        status: "active",
        payment_status: "paid",
      })
    }
    if (order.email) {
      await enqueueAndSend(db, {
        eventType: "order_paid",
        idempotencyKey: "mail:paid:" + order.id,
        payload: { id: order.id },
        email: { to: order.email, subject: "DishaYaaN payment received", text: `Payment for receipt ${order.receipt} is confirmed.` },
      })
    }
  } else if (eventName === "payment.failed") {
    await db.from("orders").update({ status: "failed", raw_event: payload }).eq("id", order.id)
  }
  return json(event, 200, { ok: true })
}
