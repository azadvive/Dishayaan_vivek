const express = require("express")
const router = express.Router()
const db = require("../config/db")
const { authenticate, optionalAuth } = require("../middleware/auth")
const { sanitizeString } = require("../utils/validate")
const { sendSuccess, sendError } = require("../utils/helpers")

/**
 * @swagger
 * /api/pathfinder/submit:
 *   post:
 *     summary: Save Path Finder diagnostic results
 *     tags: [PathFinder]
 */
router.post("/submit", optionalAuth, async (req, res, next) => {
  try {
    const { class_level, answers, axes, top_tracks } = req.body

    if (!Array.isArray(axes) || axes.length !== 6) {
      return sendError(res, "Axes must contain exactly 6 score percentages.", 400)
    }

    const client = db.getAdminClient()
    const cleanClass = sanitizeString(class_level || "Class 9-10", 50)
    const cleanTracks = (top_tracks || []).map((t) => sanitizeString(t, 80))

    if (client && req.user) {
      const { data, error } = await client
        .from("pathfinder_results")
        .insert({
          user_id: req.user.id,
          class_level: cleanClass,
          answers: answers || {},
          axes,
          top_tracks: cleanTracks,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) return sendError(res, error.message, 400)
      return sendSuccess(res, { result: data }, "Assessment saved to your profile.", 201)
    }

    return sendSuccess(
      res,
      {
        result: {
          class_level: cleanClass,
          axes,
          top_tracks: cleanTracks,
          created_at: new Date().toISOString(),
        },
      },
      "Assessment completed.",
      200
    )
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/pathfinder/my:
 *   get:
 *     summary: Get latest assessment history for logged-in user
 *     tags: [PathFinder]
 */
router.get("/my", authenticate, async (req, res, next) => {
  try {
    const client = db.getAdminClient()
    if (client) {
      const { data, error } = await client
        .from("pathfinder_results")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) return sendError(res, error.message, 400)
      return sendSuccess(res, { assessment: data || null })
    }

    return sendSuccess(res, { assessment: null })
  } catch (err) {
    next(err)
  }
})

module.exports = router
