const express = require("express")
const router = express.Router()
const db = require("../config/db")
const { optionalAuth, authenticate } = require("../middleware/auth")
const { communityUpload } = require("../middleware/upload")
const { validatePostData, sanitizeString } = require("../utils/validate")
const { sendSuccess, sendError, generateUUID } = require("../utils/helpers")

// In-memory post cache for demo / zero-DB mode
let localPosts = []

/**
 * @swagger
 * /api/community/posts:
 *   get:
 *     summary: Get all public community discussion posts
 *     tags: [Community]
 */
router.get("/posts", async (req, res, next) => {
  try {
    const { search, tag } = req.query
    const client = db.getAdminClient()

    if (client) {
      let query = client
        .from("community_posts")
        .select(`
          id, author_name, content, tags, link_url, file_url, created_at,
          comments:community_comments(id, author_name, content, created_at)
        `)
        .eq("visibility", "public")
        .eq("moderation_status", "published")
        .order("created_at", { ascending: false })
        .limit(50)

      const { data, error } = await query
      if (!error && data) {
        let results = data
        if (tag) {
          results = results.filter((p) => (p.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase()))
        }
        if (search) {
          const s = search.toLowerCase()
          results = results.filter((p) => (p.content + " " + p.author_name).toLowerCase().includes(s))
        }
        return sendSuccess(res, { posts: results })
      }
    }

    // In-memory fallback
    let list = localPosts
    if (tag) list = list.filter((p) => (p.tags || []).includes(tag))
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((p) => (p.content + " " + p.author_name).toLowerCase().includes(s))
    }
    return sendSuccess(res, { posts: list })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/community/posts:
 *   post:
 *     summary: Create a new discussion post with optional file attachment
 *     tags: [Community]
 */
router.post("/posts", optionalAuth, communityUpload.single("file"), async (req, res, next) => {
  try {
    const v = validatePostData(req.body)
    if (!v.isValid) {
      return sendError(res, "Invalid post data.", 400, v.errors)
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null
    const client = db.getAdminClient()

    const newPost = {
      ...v.data,
      file_url: fileUrl,
      user_id: req.user ? req.user.id : null,
      visibility: "public",
      moderation_status: "published",
      created_at: new Date().toISOString(),
    }

    if (client) {
      const { data, error } = await client
        .from("community_posts")
        .insert(newPost)
        .select()
        .single()

      if (error) return sendError(res, error.message, 400)
      return sendSuccess(res, { post: { ...data, comments: [] } }, "Post published.", 201)
    }

    // Fallback store
    const localPost = { id: generateUUID(), ...newPost, comments: [] }
    localPosts.unshift(localPost)
    return sendSuccess(res, { post: localPost }, "Post published (standalone mode).", 201)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/community/posts/{id}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Community]
 */
router.post("/posts/:id/comments", optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const content = sanitizeString(req.body.content || req.body.c, 2000)
    const author = sanitizeString(req.body.author || (req.profile && req.profile.full_name) || "Student", 80)

    if (content.length < 1) {
      return sendError(res, "Comment cannot be empty.", 400)
    }

    const client = db.getAdminClient()
    const newComment = {
      post_id: id,
      user_id: req.user ? req.user.id : null,
      author_name: author,
      content,
      created_at: new Date().toISOString(),
    }

    if (client) {
      const { data, error } = await client
        .from("community_comments")
        .insert(newComment)
        .select()
        .single()

      if (error) return sendError(res, error.message, 400)
      return sendSuccess(res, { comment: data }, "Comment added.", 201)
    }

    const post = localPosts.find((p) => p.id === id)
    if (post) {
      post.comments = post.comments || []
      post.comments.push({ id: generateUUID(), ...newComment })
    }

    return sendSuccess(res, { comment: newComment }, "Comment added (standalone mode).", 201)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/community/posts/{id}/report:
 *   post:
 *     summary: Report a post for moderation
 *     tags: [Community]
 */
router.post("/posts/:id/report", optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const reason = sanitizeString(req.body.reason || "Inappropriate content", 500)

    const client = db.getAdminClient()
    if (client) {
      const { error } = await client.from("community_reports").insert({
        post_id: id,
        reporter_id: req.user ? req.user.id : null,
        reason,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      if (error) return sendError(res, error.message, 400)
    }

    return sendSuccess(res, {}, "Report submitted for moderator review.")
  } catch (err) {
    next(err)
  }
})

module.exports = router
