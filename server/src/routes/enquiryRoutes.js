const express = require("express")
const router = express.Router()
const db = require("../config/db")
const { optionalAuth } = require("../middleware/auth")
const { submissionLimiter } = require("../middleware/rateLimiter")
const { validateEnquiryData, sanitizeString, isValidPhone, fingerprint } = require("../utils/validate")
const { enqueueAndSend } = require("../services/emailService")
const { sendSuccess, sendError } = require("../utils/helpers")

/**
 * @swagger
 * /api/enquiries/mentor-connect:
 *   post:
 *     summary: Submit quick mentor connection lead
 *     tags: [Enquiries]
 */
router.post("/mentor-connect", submissionLimiter, optionalAuth, async (req, res, next) => {
  try {
    const { name, whatsapp, domain, language, availability, context } = req.body
    const cleanName = sanitizeString(name, 120)
    const cleanPhone = sanitizeString(whatsapp, 24)

    if (cleanName.length < 2) return sendError(res, "Name is required.", 400)
    if (!isValidPhone(cleanPhone)) return sendError(res, "Valid WhatsApp number is required.", 400)

    const client = db.getAdminClient()
    const idempotency = req.headers["x-idempotency-key"] || fingerprint(["mentor", cleanPhone, domain])

    const row = {
      name: cleanName,
      whatsapp: cleanPhone,
      class_level: sanitizeString(req.body.class, 40) || null,
      domain: sanitizeString(domain, 100) || null,
      language: sanitizeString(language, 50) || null,
      availability: sanitizeString(availability, 100) || null,
      context: sanitizeString(context, 4000) || null,
      user_id: req.user ? req.user.id : null,
      status: "pending",
      idempotency_key: "mentor:" + idempotency,
      created_at: new Date().toISOString(),
    }

    if (client) {
      const { data: saved, error } = await client
        .from("mentor_requests")
        .insert(row)
        .select("id, status")
        .single()

      if (error) {
        if (error.code === "23505") return sendSuccess(res, { duplicate: true }, "Request already recorded.")
        return sendError(res, "Could not save the mentor request.", 400)
      }

      await enqueueAndSend({
        eventType: "mentor_connect",
        idempotencyKey: "mail:mentor:" + saved.id,
        payload: { id: saved.id },
        email: {
          to: process.env.NOTIFY_ADMIN_EMAIL,
          subject: `[Mentor Lead] ${row.name} - ${row.domain || "General"}`,
          text: `New mentor connection request:\nName: ${row.name}\nWhatsApp: ${row.whatsapp}\nDomain: ${row.domain}\nAvailability: ${row.availability}\nMessage: ${row.context}`,
        },
      })

      return sendSuccess(res, { id: saved.id, status: saved.status }, "Mentor request received.", 201)
    }

    return sendSuccess(res, { status: "pending" }, "Mentor request received (standalone mode).", 201)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/enquiries/general:
 *   post:
 *     summary: Ingest general/partner/home enquiries
 *     tags: [Enquiries]
 */
router.post("/general", submissionLimiter, optionalAuth, async (req, res, next) => {
  try {
    const category = req.body.category || req.body["form-name"] || "home-demand"
    const v = validateEnquiryData(req.body, category)
    if (!v.isValid) {
      return sendError(res, "Please fill in all required fields.", 400, v.errors)
    }

    const client = db.getAdminClient()
    const idempotency = req.headers["x-idempotency-key"] || fingerprint([category, v.data.phone, v.data.email])

    const row = {
      ...v.data,
      user_id: req.user ? req.user.id : null,
      status: "new",
      idempotency_key: `${category}:${idempotency}`,
      created_at: new Date().toISOString(),
    }

    if (client) {
      const { data: saved, error } = await client
        .from("enquiries")
        .insert(row)
        .select("id, status")
        .single()

      if (error) {
        if (error.code === "23505") return sendSuccess(res, { duplicate: true }, "Enquiry already received.")
        return sendError(res, "Could not save enquiry.", 400)
      }

      await enqueueAndSend({
        eventType: category,
        idempotencyKey: `mail:${category}:${saved.id}`,
        payload: { id: saved.id },
        email: {
          to: process.env.NOTIFY_ADMIN_EMAIL,
          subject: `[DishaYaaN Lead] ${category} from ${row.name}`,
          text: `Category: ${category}\nName: ${row.name}\nPhone: ${row.phone}\nEmail: ${row.email || "—"}\nOrg: ${row.organization || "—"}\nMessage: ${row.message}`,
        },
      })

      return sendSuccess(res, { id: saved.id, status: saved.status }, "Enquiry received successfully.", 201)
    }

    return sendSuccess(res, { status: "new" }, "Enquiry received (standalone mode).", 201)
  } catch (err) {
    next(err)
  }
})

module.exports = router
