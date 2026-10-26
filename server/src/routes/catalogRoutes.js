const express = require("express")
const router = express.Router()
const db = require("../config/db")
const content = require("../../../src/data/content.json")
const { sendSuccess, sendError } = require("../utils/helpers")

/**
 * @swagger
 * /api/programs:
 *   get:
 *     summary: Get all published educational programs
 *     tags: [Catalog]
 */
router.get("/programs", async (req, res, next) => {
  try {
    const { kind, track, search } = req.query
    const client = db.getAdminClient()

    if (client) {
      let query = client.from("programs").select("*").eq("published", true).order("title")
      if (kind) query = query.eq("kind", kind)
      if (track) query = query.eq("track_id", track)

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        let results = data
        if (search) {
          const s = search.toLowerCase()
          results = results.filter((p) => (p.title + " " + (p.summary || "")).toLowerCase().includes(s))
        }
        return sendSuccess(res, { programs: results, source: "database" })
      }
    }

    // Fallback to content.json
    let list = content.programmes || []
    if (kind) list = list.filter((p) => p.kind === kind)
    if (track) list = list.filter((p) => p.trackId === track || p.track_id === track)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((p) => (p.title + " " + (p.summary || "")).toLowerCase().includes(s))
    }

    return sendSuccess(res, { programs: list, source: "content-fallback" })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/programs/{slug}:
 *   get:
 *     summary: Get program details by slug
 *     tags: [Catalog]
 */
router.get("/programs/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params
    const client = db.getAdminClient()

    if (client) {
      const { data, error } = await client
        .from("programs")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle()

      if (!error && data) {
        return sendSuccess(res, { program: data, source: "database" })
      }
    }

    const fallback = (content.programmes || []).find((p) => p.slug === slug)
    if (fallback) {
      return sendSuccess(res, { program: fallback, source: "content-fallback" })
    }

    return sendError(res, "Program not found.", 404)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/mentors:
 *   get:
 *     summary: Get all active mentors
 *     tags: [Catalog]
 */
router.get("/mentors", async (req, res, next) => {
  try {
    const { domain, language } = req.query
    const client = db.getAdminClient()

    if (client) {
      let query = client.from("mentors").select("*").eq("published", true).order("role_title")
      if (domain) query = query.eq("domain", domain)

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        let results = data
        if (language) {
          results = results.filter((m) => (m.languages || []).some((l) => l.toLowerCase() === language.toLowerCase()))
        }
        return sendSuccess(res, { mentors: results, source: "database" })
      }
    }

    let list = content.mentor_seats || []
    if (domain) list = list.filter((m) => m.domain === domain)
    if (language) {
      list = list.filter((m) => (m.languages || []).some((l) => l.toLowerCase() === language.toLowerCase()))
    }

    return sendSuccess(res, { mentors: list, source: "content-fallback" })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/mentors/{slug}:
 *   get:
 *     summary: Get mentor details by slug
 *     tags: [Catalog]
 */
router.get("/mentors/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params
    const client = db.getAdminClient()

    if (client) {
      const { data, error } = await client
        .from("mentors")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle()

      if (!error && data) {
        return sendSuccess(res, { mentor: data, source: "database" })
      }
    }

    const fallback = (content.mentor_seats || []).find((m) => m.slug === slug)
    if (fallback) {
      return sendSuccess(res, { mentor: fallback, source: "content-fallback" })
    }

    return sendError(res, "Mentor not found.", 404)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Get all membership and project plans
 *     tags: [Catalog]
 */
router.get("/plans", async (req, res, next) => {
  try {
    const client = db.getAdminClient()

    if (client) {
      const { data, error } = await client.from("plans").select("*").eq("published", true).order("price_inr")
      if (!error && data && data.length > 0) {
        return sendSuccess(res, { plans: data, source: "database" })
      }
    }

    return sendSuccess(res, { plans: content.plans || [], source: "content-fallback" })
  } catch (err) {
    next(err)
  }
})

module.exports = router
