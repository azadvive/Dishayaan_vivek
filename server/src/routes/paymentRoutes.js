const express = require("express")
const router = express.Router()
const db = require("../config/db")
const { optionalAuth } = require("../middleware/auth")
const { sanitizeString, isValidEmail, isValidPhone } = require("../utils/validate")
const { sendSuccess, sendError, generateRandomRef } = require("../utils/helpers")
const {
  isConfigured,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require("../services/razorpayService")
const content = require("../../../src/data/content.json")

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create a checkout order for a plan or program
 *     tags: [Payments]
 */
router.post("/create-order", optionalAuth, async (req, res, next) => {
  try {
    const student = sanitizeString(req.body.student || req.body.name, 120)
    const whatsapp = sanitizeString(req.body.whatsapp, 24)
    const email = sanitizeString(req.body.email, 200)
    const planSlug = sanitizeString(req.body.planSlug || req.body.plan, 80)

    if (student.length < 2) return sendError(res, "Student name is required.", 400)
    if (!isValidPhone(whatsapp)) return sendError(res, "Valid WhatsApp number is required.", 400)
    if (email && !isValidEmail(email)) return sendError(res, "Valid email is required.", 400)

    const client = db.getAdminClient()
    let plan = null

    if (client) {
      const { data } = await client
        .from("plans")
        .select("*")
        .or(`slug.eq.${planSlug},name.eq.${planSlug}`)
        .maybeSingle()
      plan = data
    }

    if (!plan) {
      plan = (content.plans || []).find((p) => p.slug === planSlug || p.name === planSlug)
    }

    if (!plan) {
      return sendError(res, "Selected plan not found.", 404)
    }

    const amountInr = Number(plan.price_inr || plan.priceInr)
    if (!amountInr || amountInr <= 0) {
      return sendError(res, "This plan has no published price.", 400)
    }

    const receipt = generateRandomRef("RCP")
    const orderResult = await createOrder({
      amountInr,
      receipt,
      notes: { student, whatsapp, plan: plan.name || plan.slug },
    })

    const orderRow = {
      user_id: req.user ? req.user.id : null,
      plan_id: plan.id && String(plan.id).length > 20 ? plan.id : null,
      student_name: student,
      email: email || null,
      whatsapp,
      amount_inr: amountInr,
      currency: "INR",
      provider: orderResult.configured ? "razorpay" : "manual",
      provider_order_id: orderResult.orderId || null,
      status: "pending",
      receipt,
      created_at: new Date().toISOString(),
    }

    if (client) {
      const { data: savedOrder, error: orderErr } = await client
        .from("orders")
        .insert(orderRow)
        .select()
        .single()

      if (orderErr) {
        return sendError(res, "Failed to save order record.", 400)
      }

      return sendSuccess(res, {
        order: savedOrder,
        mode: orderResult.mode,
        keyId: orderResult.keyId,
        amountPaise: orderResult.amountPaise,
        receipt,
      })
    }

    return sendSuccess(res, {
      order: orderRow,
      mode: orderResult.mode,
      keyId: orderResult.keyId,
      amountPaise: Math.round(amountInr * 100),
      receipt,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify Razorpay payment signature & activate enrollment
 *     tags: [Payments]
 */
router.post("/verify", optionalAuth, async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, receipt } = req.body

    const isValid = verifyPaymentSignature({ orderId, paymentId, signature })
    if (!isValid) {
      return sendError(res, "Invalid payment signature verification failed.", 400)
    }

    const client = db.getAdminClient()
    if (client) {
      // Update order to paid
      const { data: updatedOrder, error } = await client
        .from("orders")
        .update({
          status: "paid",
          provider_payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .or(`provider_order_id.eq.${orderId},receipt.eq.${receipt}`)
        .select()
        .single()

      if (!error && updatedOrder) {
        // Automatically activate enrollment
        if (updatedOrder.user_id) {
          await client.from("enrollments").insert({
            user_id: updatedOrder.user_id,
            order_id: updatedOrder.id,
            plan_id: updatedOrder.plan_id,
            status: "active",
            payment_status: "paid",
            enrolled_at: new Date().toISOString(),
          })
        }
      }
    }

    return sendSuccess(res, { status: "paid", paymentId }, "Payment verified successfully!")
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Razorpay webhook endpoint
 *     tags: [Payments]
 */
router.post("/webhook", async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"]
    const rawBody = JSON.stringify(req.body)

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      return sendError(res, "Invalid webhook signature.", 400)
    }

    const event = req.body.event
    const payload = req.body.payload

    if (event === "payment.captured" || event === "order.paid") {
      const orderId = payload.payment.entity.order_id
      const paymentId = payload.payment.entity.id
      const client = db.getAdminClient()

      if (client && orderId) {
        await client
          .from("orders")
          .update({
            status: "paid",
            provider_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_order_id", orderId)
      }
    }

    return res.json({ status: "ok" })
  } catch (err) {
    next(err)
  }
})

module.exports = router
