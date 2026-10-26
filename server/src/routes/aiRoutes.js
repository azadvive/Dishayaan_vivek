const express = require("express")
const router = express.Router()
const { optionalAuth } = require("../middleware/auth")
const { aiLimiter } = require("../middleware/rateLimiter")
const { sanitizeString } = require("../utils/validate")
const { sendSuccess, sendError } = require("../utils/helpers")
const {
  buildSystemPrompt,
  getLiveCompletion,
  getRuleBasedReply,
  checkAndIncrementQuota,
} = require("../services/aiService")

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Ask a question to the DishaYaaN Career Assistant
 *     tags: [AI Assistant]
 */
router.post("/chat", aiLimiter, optionalAuth, async (req, res, next) => {
  try {
    const question = sanitizeString(req.body.question || req.body.q, 800)
    if (question.length < 2) {
      return sendError(res, "Please enter a valid question.", 400)
    }

    const sessionKey = sanitizeString(req.body.sessionKey, 80) || (req.user ? req.user.id : req.ip)

    // Check daily quota
    const quota = await checkAndIncrementQuota(sessionKey)
    if (!quota.allowed) {
      return sendSuccess(res, {
        limited: true,
        text: "You have reached your daily question limit. Please book a one-to-one session with a mentor for detailed personalized guidance.",
        links: [["/book", "Book a Mentor Session"], ["/plans", "Upgrade Plan"]],
        used: quota.used,
        limit: quota.limit,
        source: "limit",
      })
    }

    // Try live completion
    const messages = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: question },
    ]

    const liveReply = await getLiveCompletion(messages)
    if (liveReply) {
      return sendSuccess(res, {
        text: liveReply,
        source: "live-ai",
        used: quota.used,
        limit: quota.limit,
      })
    }

    // Fallback to grounded rule-based responder
    const fallback = getRuleBasedReply(question)
    return sendSuccess(res, {
      text: fallback.text,
      links: fallback.links,
      source: "grounded-fallback",
      used: quota.used,
      limit: quota.limit,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
