const express = require("express")
const router = express.Router()
const db = require("../config/db")
const { authenticate, requireAdmin } = require("../middleware/auth")
const { BOOKING_STATUSES, USER_ROLES, ACCOUNT_STATUSES, sanitizeString } = require("../utils/validate")
const { enqueueAndSend } = require("../services/emailService")
const { sendSuccess, sendError } = require("../utils/helpers")

// Apply admin authentication to all routes in this router
router.use(authenticate, requireAdmin)

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Get dashboard KPI metrics and counts
 *     tags: [Admin]
 */
router.get("/overview", async (req, res, next) => {
  try {
    const client = db.getAdminClient()
    if (!client) {
      return sendSuccess(res, {
        stats: { users: 1, bookings: 0, enquiries: 0, mentorRequests: 0, orders: 0, posts: 0 },
      })
    }

    const [u, b, e, mr, o, p] = await Promise.all([
      client.from("profiles").select("id", { count: "exact", head: true }),
      client.from("bookings").select("id", { count: "exact", head: true }),
      client.from("enquiries").select("id", { count: "exact", head: true }),
      client.from("mentor_requests").select("id", { count: "exact", head: true }),
      client.from("orders").select("id", { count: "exact", head: true }),
      client.from("community_posts").select("id", { count: "exact", head: true }),
    ])

    return sendSuccess(res, {
      stats: {
        users: u.count || 0,
        bookings: b.count || 0,
        enquiries: e.count || 0,
        mentorRequests: mr.count || 0,
        orders: o.count || 0,
        posts: p.count || 0,
      },
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: List all bookings
 *     tags: [Admin]
 */
router.get("/bookings", async (req, res, next) => {
  try {
    const { status } = req.query
    const client = db.getAdminClient()
    if (!client) return sendSuccess(res, { bookings: [] })

    let query = client.from("bookings").select("*").order("created_at", { ascending: false }).limit(100)
    if (status) query = query.eq("status", status)

    const { data, error } = await query
    if (error) return sendError(res, error.message, 400)
    return sendSuccess(res, { bookings: data || [] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   patch:
 *     summary: Update booking status, notes, or assign mentor
 *     tags: [Admin]
 */
router.patch("/bookings/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, notes, assigned_mentor_id } = req.body

    if (status && !BOOKING_STATUSES.includes(status)) {
      return sendError(res, "Invalid booking status.", 400)
    }

    const client = db.getAdminClient()
    if (!client) return sendSuccess(res, {}, "Updated (standalone mode).")

    const { data: current, error: findErr } = await client.from("bookings").select("*").eq("id", id).single()
    if (findErr || !current) return sendError(res, "Booking not found.", 404)

    // Conflict check if confirming
    if (status === "confirmed" && current.requested_date && current.slot) {
      const mentorIdToCheck = assigned_mentor_id || current.mentor_id
      if (mentorIdToCheck) {
        const { data: clash } = await client
          .from("bookings")
          .select("id")
          .eq("mentor_id", mentorIdToCheck)
          .eq("requested_date", current.requested_date)
          .eq("slot", current.slot)
          .eq("status", "confirmed")
          .neq("id", id)

        if (clash && clash.length > 0) {
          return sendError(res, "That mentor already has a confirmed session in this slot.", 409)
        }
      }
    }

    const patch = {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { admin_notes: notes } : {}),
      ...(assigned_mentor_id ? { mentor_id: assigned_mentor_id } : {}),
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error } = await client.from("bookings").update(patch).eq("id", id).select().single()
    if (error) return sendError(res, error.message, 400)

    // Audit log
    await client.from("audit_log").insert({
      actor_id: req.profile.id,
      action: "booking_status_update",
      entity_type: "bookings",
      entity_id: id,
      meta: { status, notes },
    })

    // Email notification on status change
    if (current.email && (status === "confirmed" || status === "cancelled" || status === "rejected")) {
      await enqueueAndSend({
        eventType: "booking_" + status,
        idempotencyKey: `mail:booking:${status}:${current.reference}`,
        payload: { reference: current.reference, status },
        email: {
          to: current.email,
          subject: `DishaYaaN Session Update: ${current.reference} is ${status}`,
          text: `Dear ${current.name},\n\nYour session request (${current.reference}) has been marked as ${status.toUpperCase()}.\n${notes ? `\nNote from counselor: ${notes}\n` : ""}\nBest regards,\nDishaYaaN Mentorship Team`,
        },
      })
    }

    return sendSuccess(res, { booking: updated }, "Booking updated successfully.")
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/enquiries:
 *   get:
 *     summary: List all enquiries
 *     tags: [Admin]
 */
router.get("/enquiries", async (req, res, next) => {
  try {
    const client = db.getAdminClient()
    if (!client) return sendSuccess(res, { enquiries: [] })

    const { data, error } = await client.from("enquiries").select("*").order("created_at", { ascending: false }).limit(100)
    if (error) return sendError(res, error.message, 400)
    return sendSuccess(res, { enquiries: data || [] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/mentor-requests:
 *   get:
 *     summary: List all quick mentor connect requests
 *     tags: [Admin]
 */
router.get("/mentor-requests", async (req, res, next) => {
  try {
    const client = db.getAdminClient()
    if (!client) return sendSuccess(res, { requests: [] })

    const { data, error } = await client.from("mentor_requests").select("*").order("created_at", { ascending: false }).limit(100)
    if (error) return sendError(res, error.message, 400)
    return sendSuccess(res, { requests: data || [] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List user profiles
 *     tags: [Admin]
 */
router.get("/users", async (req, res, next) => {
  try {
    const client = db.getAdminClient()
    if (!client) return sendSuccess(res, { users: [] })

    const { data, error } = await client.from("profiles").select("*").order("created_at", { ascending: false }).limit(100)
    if (error) return sendError(res, error.message, 400)
    return sendSuccess(res, { users: data || [] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Change user role (student, mentor, admin)
 *     tags: [Admin]
 */
router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!USER_ROLES.includes(role)) {
      return sendError(res, "Invalid user role.", 400)
    }

    const client = db.getAdminClient()
    if (client) {
      const { data, error } = await client
        .from("profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) return sendError(res, error.message, 400)

      await client.from("audit_log").insert({
        actor_id: req.profile.id,
        action: "user_role_change",
        entity_type: "profiles",
        entity_id: id,
        meta: { role },
      })

      return sendSuccess(res, { user: data }, "User role updated.")
    }

    return sendSuccess(res, {}, "Role updated.")
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: List all payment orders
 *     tags: [Admin]
 */
router.get("/orders", async (req, res, next) => {
  try {
    const client = db.getAdminClient()
    if (!client) return sendSuccess(res, { orders: [] })

    const { data, error } = await client.from("orders").select("*").order("created_at", { ascending: false }).limit(100)
    if (error) return sendError(res, error.message, 400)
    return sendSuccess(res, { orders: data || [] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: List community content reports
 *     tags: [Admin]
 */
router.get("/reports", async (req, res, next) => {
  try {
    const client = db.getAdminClient()
    if (!client) return sendSuccess(res, { reports: [] })

    const { data, error } = await client.from("community_reports").select("*").order("created_at", { ascending: false })
    if (error) return sendError(res, error.message, 400)
    return sendSuccess(res, { reports: data || [] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/admin/moderate-post:
 *   post:
 *     summary: Moderate community post (hide/restore)
 *     tags: [Admin]
 */
router.post("/moderate-post", async (req, res, next) => {
  try {
    const { postId, action, notes } = req.body // action: 'removed', 'published', 'flagged'
    const visibility = action === "published" ? "public" : "hidden"
    const moderation_status = action || "removed"

    const client = db.getAdminClient()
    if (client) {
      const { error } = await client
        .from("community_posts")
        .update({ visibility, moderation_status, updated_at: new Date().toISOString() })
        .eq("id", postId)

      if (error) return sendError(res, error.message, 400)

      await client.from("moderation_actions").insert({
        admin_id: req.profile.id,
        target_type: "post",
        target_id: postId,
        action: moderation_status,
        notes: notes || null,
      })

      return sendSuccess(res, {}, "Post moderation updated.")
    }

    return sendSuccess(res, {}, "Post moderation updated.")
  } catch (err) {
    next(err)
  }
})

module.exports = router
