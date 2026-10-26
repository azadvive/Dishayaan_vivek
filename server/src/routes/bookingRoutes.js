const express = require("express")
const router = express.Router()
const db = require("../config/db")
const { authenticate, optionalAuth } = require("../middleware/auth")
const { submissionLimiter } = require("../middleware/rateLimiter")
const { validateBookingData, fingerprint } = require("../utils/validate")
const { enqueueAndSend } = require("../services/emailService")
const { sendSuccess, sendError, generateRandomRef } = require("../utils/helpers")

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Request a one-to-one mentorship session
 *     tags: [Bookings]
 */
router.post("/", submissionLimiter, optionalAuth, async (req, res, next) => {
  try {
    const v = validateBookingData(req.body)
    if (!v.isValid) {
      return sendError(res, "Please check highlighted fields.", 400, v.errors)
    }

    const client = db.getAdminClient()
    const reference = req.body.reference && /^DY-[A-Z0-9]{6}$/.test(req.body.reference)
      ? req.body.reference
      : generateRandomRef("DY")

    const idempotency = req.headers["x-idempotency-key"] ||
      fingerprint(["book", v.data.whatsapp, v.data.email, v.data.requested_date, v.data.slot])

    const row = {
      ...v.data,
      reference,
      user_id: req.user ? req.user.id : null,
      status: "pending",
      idempotency_key: "book:" + idempotency,
      created_at: new Date().toISOString(),
    }

    if (client) {
      // Find mentor id if slug provided
      if (row.mentor_slug) {
        const { data: mentor } = await client
          .from("mentors")
          .select("id, role_title")
          .eq("slug", row.mentor_slug)
          .maybeSingle()
        if (mentor) row.mentor_id = mentor.id
      }

      // Conflict check for confirmed bookings
      if (row.mentor_id && row.requested_date && row.slot) {
        const { data: clash } = await client
          .from("bookings")
          .select("id")
          .eq("mentor_id", row.mentor_id)
          .eq("requested_date", row.requested_date)
          .eq("slot", row.slot)
          .eq("status", "confirmed")
        if (clash && clash.length > 0) {
          return sendError(res, "That mentor is already booked for this specific slot. Please choose another slot.", 409)
        }
      }

      const { data: saved, error } = await client
        .from("bookings")
        .insert(row)
        .select("id, reference, status, requested_date, slot")
        .single()

      if (error) {
        if (error.code === "23505") {
          const { data: existing } = await client
            .from("bookings")
            .select("id, reference, status")
            .eq("idempotency_key", row.idempotency_key)
            .maybeSingle()
          if (existing) {
            return sendSuccess(res, { duplicate: true, reference: existing.reference, status: existing.status }, "Duplicate request detected.")
          }
          return sendError(res, "A similar booking request already exists for this slot.", 409)
        }
        return sendError(res, "Could not save the booking request.", 400)
      }

      // Dispatch transactional emails
      await enqueueAndSend({
        eventType: "booking_requested",
        idempotencyKey: "mail:book:" + saved.reference,
        payload: { reference: saved.reference },
        email: {
          to: row.email,
          subject: `DishaYaaN Session Request ${saved.reference}`,
          text: `Hello ${row.name},\n\nWe have received your mentorship session request (${saved.reference}) for ${row.domain || "general guidance"} on ${row.requested_date || "date TBD"} (${row.slot || "slot TBD"}).\n\nOur academic counselor will verify mentor availability and send you the confirmed session link shortly.`,
        },
      })

      if (process.env.NOTIFY_ADMIN_EMAIL) {
        await enqueueAndSend({
          eventType: "booking_admin",
          idempotencyKey: "mail:book-admin:" + saved.reference,
          payload: { reference: saved.reference },
          email: {
            to: process.env.NOTIFY_ADMIN_EMAIL,
            subject: `[New Booking] ${saved.reference} - ${row.name}`,
            text: `New session request:\nName: ${row.name}\nWhatsApp: ${row.whatsapp}\nDomain: ${row.domain}\nMentor: ${row.mentor_slug || "Any"}\nSlot: ${row.requested_date} ${row.slot}`,
          },
        })
      }

      return sendSuccess(res, { reference: saved.reference, status: saved.status, pending: true }, "Booking request received.", 201)
    }

    // Standalone demo mode if DB is not active
    return sendSuccess(
      res,
      { reference, status: "pending", pending: true },
      "Booking request received (standalone mode).",
      201
    )
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/bookings/my:
 *   get:
 *     summary: Get all bookings for the logged-in user
 *     tags: [Bookings]
 */
router.get("/my", authenticate, async (req, res, next) => {
  try {
    const client = db.getAdminClient()
    if (client) {
      const { data, error } = await client
        .from("bookings")
        .select("reference, status, domain, requested_date, slot, created_at, mentor_slug")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false })

      if (error) return sendError(res, error.message, 400)
      return sendSuccess(res, { bookings: data || [] })
    }

    return sendSuccess(res, { bookings: [] })
  } catch (err) {
    next(err)
  }
})

module.exports = router
