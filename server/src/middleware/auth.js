const jwt = require("jsonwebtoken")
const env = require("../config/env")
const db = require("../config/db")
const { sendError } = require("../utils/helpers")

async function resolveUserFromToken(token) {
  if (!token) return null

  // 1. First try verifying as local JWT
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (decoded && decoded.id) {
      const client = db.getAdminClient()
      if (client) {
        const { data: profile } = await client.from("profiles").select("*").eq("id", decoded.id).maybeSingle()
        return {
          user: { id: decoded.id, email: decoded.email },
          profile: profile || { id: decoded.id, email: decoded.email, role: decoded.role || "student", account_status: "active" },
        }
      }
      return {
        user: { id: decoded.id, email: decoded.email },
        profile: { id: decoded.id, email: decoded.email, role: decoded.role || "student", account_status: "active" },
      }
    }
  } catch (err) {
    // Not a local JWT or expired; fall through to Supabase token verification
  }

  // 2. Try verifying via Supabase Auth
  const client = db.getAdminClient()
  if (client) {
    try {
      const { data, error } = await client.auth.getUser(token)
      if (!error && data && data.user) {
        const { data: profile } = await client.from("profiles").select("*").eq("id", data.user.id).maybeSingle()
        return {
          user: data.user,
          profile: profile || {
            id: data.user.id,
            email: data.user.email,
            full_name: (data.user.user_metadata && data.user.user_metadata.full_name) || "",
            role: "student",
            account_status: "active",
          },
        }
      }
    } catch (e) {
      return null
    }
  }

  return null
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()

  if (!token) {
    return sendError(res, "Authentication required. Please sign in.", 401)
  }

  const resolved = await resolveUserFromToken(token)
  if (!resolved) {
    return sendError(res, "Invalid or expired session. Please sign in again.", 401)
  }

  req.user = resolved.user
  req.profile = resolved.profile
  next()
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()

  if (token) {
    const resolved = await resolveUserFromToken(token)
    if (resolved) {
      req.user = resolved.user
      req.profile = resolved.profile
    }
  }

  next()
}

function requireAdmin(req, res, next) {
  if (!req.profile || req.profile.role !== "admin") {
    return sendError(res, "Access denied. Administrator privileges required.", 403)
  }
  if (req.profile.account_status !== "active") {
    return sendError(res, "Administrator account is suspended or inactive.", 403)
  }
  next()
}

function requireMentor(req, res, next) {
  if (!req.profile || (req.profile.role !== "mentor" && req.profile.role !== "admin")) {
    return sendError(res, "Access denied. Mentor privileges required.", 403)
  }
  if (req.profile.account_status !== "active") {
    return sendError(res, "Mentor account is inactive.", 403)
  }
  next()
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireMentor,
}
