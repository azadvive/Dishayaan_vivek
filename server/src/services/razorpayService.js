const Razorpay = require("razorpay")
const crypto = require("crypto")
const env = require("../config/env")

function isConfigured() {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
}

function getInstance() {
  if (!isConfigured()) return null
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  })
}

async function createOrder({ amountInr, receipt, notes = {} }) {
  if (!isConfigured()) {
    return {
      configured: false,
      mode: "manual",
      receipt,
      amountInr,
    }
  }

  const rzp = getInstance()
  const amountPaise = Math.round(Number(amountInr) * 100)

  const order = await rzp.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    payment_capture: 1,
    notes,
  })

  return {
    configured: true,
    mode: "razorpay",
    keyId: env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amountPaise: order.amount,
    currency: order.currency,
    receipt: order.receipt,
  }
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!env.RAZORPAY_KEY_SECRET) return false
  const body = orderId + "|" + paymentId
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex")
  return expectedSignature === signature
}

function verifyWebhookSignature(bodyString, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(bodyString)
    .digest("hex")
  return expectedSignature === signature
}

module.exports = {
  isConfigured,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
}
