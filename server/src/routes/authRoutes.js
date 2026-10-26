const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const env = require("../config/env")
const db = require("../config/db")
const { authenticate } = require("../middleware/auth")
const { authLimiter } = require("../middleware/rateLimiter")
const { avatarUpload } = require("../middleware/upload")
const { isValidEmail, sanitizeString } = require("../utils/validate")
const { sendSuccess, sendError, generateUUID } = require("../utils/helpers")

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               fullName: { type: string }
 */
router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body
    const cleanEmail = sanitizeString(email, 200).toLowerCase()
    const cleanName = sanitizeString(fullName, 120)

    if (!isValidEmail(cleanEmail)) {
      return sendError(res, "A valid email address is required.", 400)
    }
    if (!password || password.length < 6) {
      return sendError(res, "Password must be at least 6 characters.", 400)
    }

    const client = db.getAdminClient()

    if (client) {
      // Register with Supabase Auth
      const { data, error } = await client.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: cleanName },
      })

      if (error) {
        return sendError(res, error.message, 400)
      }

      // Ensure profile exists
      const userId = data.user.id
      const { data: profile } = await client
        .from("profiles")
        .upsert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          role: "student",
          account_status: "active",
        })
        .select()
        .single()

      const token = jwt.sign(
        { id: userId, email: cleanEmail, role: "student" },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      )

      return sendSuccess(res, { token, user: data.user, profile }, "Registration successful.", 201)
    }

    // Fallback if Supabase not yet configured: generate standalone JWT
    const mockId = generateUUID()
    const token = jwt.sign(
      { id: mockId, email: cleanEmail, role: "student" },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    return sendSuccess(
      res,
      {
        token,
        user: { id: mockId, email: cleanEmail },
        profile: { id: mockId, email: cleanEmail, full_name: cleanName, role: "student", account_status: "active" },
      },
      "Registration successful (standalone mode).",
      201
    )
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to account
 *     tags: [Auth]
 */
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body
    const cleanEmail = sanitizeString(email, 200).toLowerCase()

    if (!cleanEmail || !password) {
      return sendError(res, "Email and password are required.", 400)
    }

    const client = db.getAdminClient()

    if (client) {
      // Authenticate via Supabase Anon client
      const anon = db.getAnonClient() || client
      const { data, error } = await anon.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) {
        return sendError(res, error.message, 401)
      }

      const user = data.user
      const { data: profile } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle()

      if (profile && profile.account_status === "suspended") {
        return sendError(res, "Your account has been suspended. Please contact support.", 403)
      }

      // Generate API token
      const token = data.session
        ? data.session.access_token
        : jwt.sign(
            { id: user.id, email: user.email, role: profile ? profile.role : "student" },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
          )

      return sendSuccess(res, { token, user, profile }, "Login successful.")
    }

    // Standalone demo mode if Supabase not configured
    const mockId = generateUUID()
    const token = jwt.sign(
      { id: mockId, email: cleanEmail, role: cleanEmail === env.ADMIN_SETUP_EMAIL ? "admin" : "student" },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    return sendSuccess(
      res,
      {
        token,
        user: { id: mockId, email: cleanEmail },
        profile: {
          id: mockId,
          email: cleanEmail,
          full_name: cleanEmail.split("@")[0],
          role: cleanEmail === env.ADMIN_SETUP_EMAIL ? "admin" : "student",
          account_status: "active",
        },
      },
      "Login successful."
    )
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get currently authenticated user and profile
 *     tags: [Auth]
 */
router.get("/me", authenticate, (req, res) => {
  return sendSuccess(res, {
    user: req.user,
    profile: req.profile,
  })
})

/**
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     summary: Update profile details
 *     tags: [Auth]
 */
router.patch("/profile", authenticate, async (req, res, next) => {
  try {
    const patch = req.body
    const safe = {
      full_name: sanitizeString(patch.full_name, 120),
      phone: sanitizeString(patch.phone, 24),
      bio: sanitizeString(patch.bio, 2000),
      education: typeof patch.education === "object" ? patch.education : { background: sanitizeString(patch.education, 200) },
      interests: Array.isArray(patch.interests)
        ? patch.interests.map((x) => sanitizeString(x, 50))
        : String(patch.interests || "").split(",").map((x) => x.trim()).filter(Boolean),
      preferred_domains: Array.isArray(patch.preferred_domains)
        ? patch.preferred_domains.map((x) => sanitizeString(x, 50))
        : [sanitizeString(patch.preferred_domains, 50)].filter(Boolean),
      updated_at: new Date().toISOString(),
    }

    const client = db.getAdminClient()
    if (client) {
      const { data, error } = await client
        .from("profiles")
        .update(safe)
        .eq("id", req.user.id)
        .select()
        .single()

      if (error) return sendError(res, error.message, 400)
      return sendSuccess(res, { profile: data }, "Profile updated successfully.")
    }

    const updated = { ...req.profile, ...safe }
    return sendSuccess(res, { profile: updated }, "Profile updated (standalone mode).")
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/auth/avatar:
 *   post:
 *     summary: Upload avatar image
 *     tags: [Auth]
 */
router.post("/avatar", authenticate, avatarUpload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, "No image file provided.", 400)
    }

    const avatarUrl = `/uploads/${req.file.filename}`
    const client = db.getAdminClient()

    if (client) {
      const { error } = await client
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", req.user.id)

      if (error) return sendError(res, error.message, 400)
    }

    return sendSuccess(res, { avatar_url: avatarUrl }, "Avatar uploaded successfully.")
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /api/auth/admin-bootstrap:
 *   post:
 *     summary: Bootstrap initial administrator role
 *     tags: [Auth]
 */
router.post("/admin-bootstrap", async (req, res, next) => {
  try {
    const { secret, email } = req.body

    if (!secret || secret !== env.ADMIN_SETUP_SECRET) {
      return sendError(res, "Invalid setup secret.", 403)
    }

    const adminEmail = (email || env.ADMIN_SETUP_EMAIL).trim().toLowerCase()
    if (!adminEmail) {
      return sendError(res, "Provide an administrator email address.", 400)
    }

    const client = db.getAdminClient()
    if (client) {
      const { data: profile, error } = await client
        .from("profiles")
        .select("id, email, role")
        .eq("email", adminEmail)
        .maybeSingle()

      if (error) return sendError(res, error.message, 400)
      if (!profile) {
        return sendError(res, `No account exists for ${adminEmail}. Please register on /account first.`, 404)
      }

      const { error: updateErr } = await client
        .from("profiles")
        .update({ role: "admin", account_status: "active", updated_at: new Date().toISOString() })
        .eq("id", profile.id)

      if (updateErr) return sendError(res, updateErr.message, 400)

      await client.from("audit_log").insert({
        actor_id: profile.id,
        action: "bootstrap_admin",
        entity_type: "profiles",
        entity_id: profile.id,
      })

      return sendSuccess(res, { email: adminEmail, role: "admin" }, "Admin role granted successfully.")
    }

    return sendSuccess(res, { email: adminEmail, role: "admin" }, "Admin role granted (standalone mode).")
  } catch (err) {
    next(err)
  }
})

module.exports = router
