const { service, configured } = require("../lib/supabase")
const { json, readBody, rateLimit, randomRef } = require("../lib/http")
const { str, validPhone, validEmail } = require("../lib/validate")

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(event, 204, {})
  if (event.httpMethod !== "POST") return json(event, 405, { ok: false, error: "Method not allowed" })
  if (!rateLimit(event, "pay", 15, 10 * 60 * 1000)) return json(event, 429, { ok: false, error: "Too many payment attempts." })
  if (!configured()) return json(event, 503, { ok: false, error: "Backend is not configured.", code: "CONFIG_MISSING" })

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const body = readBody(event)
  const student = str(body.student || body.name, 120)
  const whatsapp = str(body.whatsapp, 24)
  const email = str(body.email, 200)
  const planSlug = str(body.planSlug || body.plan, 80)
  if (student.length < 2 || !validPhone(whatsapp) || !validEmail(email)) {
    return json(event, 400, { ok: false, error: "Check student name, WhatsApp and email." })
  }

  const db = service()
  const { data: plan } = await db.from("plans").select("*").or(`slug.eq.${planSlug},name.eq.${planSlug}`).maybeSingle()
  if (!plan) return json(event, 404, { ok: false, error: "Plan not found." })
  const amount = Number(plan.price_inr)
  if (!amount) return json(event, 400, { ok: false, error: "This plan has no published price." })

  const receipt = randomRef("RCP")
  const jwt = ((event.headers || {}).authorization || "").replace(/^Bearer\s+/i, "")
  let userId = null
  if (jwt) {
    const { data: u } = await db.auth.getUser(jwt)
    userId = u && u.user ? u.user.id : null
  }

  if (!keyId || !keySecret) {
    const { data: order, error } = await db
      .from("orders")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        student_name: student,
        email: email || null,
        whatsapp,
        amount_inr: amount,
        provider: "manual",
        status: "pending",
        receipt,
        idempotency_key: body.idempotencyKey || receipt,
      })
      .select("id, receipt, status, amount_inr")
      .single()
    if (error) return json(event, 400, { ok: false, error: "Could not record the enrolment request." })
    await db.from("enquiries").insert({
      category: "plan-checkout",
      name: student,
      email: email || null,
      phone: whatsapp,
      plan_slug: plan.slug,
      message: "Manual enrolment request (Razorpay not configured)",
      user_id: userId,
    })
    return json(event, 200, {
      ok: true,
      mode: "manual",
      order,
      message: "Payment provider is not configured. The enrolment request was saved as pending and has not been marked paid.",
    })
  }

  const auth = Buffer.from(keyId + ":" + keySecret).toString("base64")
  const rzp = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: "INR", receipt, payment_capture: 1 }),
  })
  const rzpBody = await rzp.json()
  if (!rzp.ok) return json(event, 400, { ok: false, error: "Could not create a payment order." })

  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: userId,
      plan_id: plan.id,
      student_name: student,
      email: email || null,
      whatsapp,
      amount_inr: amount,
      provider: "razorpay",
      provider_order_id: rzpBody.id,
      status: "pending",
      receipt,
      idempotency_key: body.idempotencyKey || rzpBody.id,
    })
    .select("id, receipt, status, amount_inr, provider_order_id")
    .single()
  if (error) return json(event, 400, { ok: false, error: "Order recorded failed after provider create. Contact support with receipt " + receipt })
  return json(event, 200, { ok: true, mode: "razorpay", keyId, order: { ...order, amountPaise: Math.round(amount * 100) } })
}
