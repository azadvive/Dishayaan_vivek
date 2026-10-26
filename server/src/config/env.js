const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../../.env") })

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET || "dishayaan-dev-secret-key-replace-in-production-32chars!",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Supabase / Database
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // Admin bootstrap
  ADMIN_SETUP_SECRET: process.env.ADMIN_SETUP_SECRET || "dishayaan-super-secure-admin-setup-secret-2026",
  ADMIN_SETUP_EMAIL: (process.env.ADMIN_SETUP_EMAIL || "admin@dishayaan.com").trim().toLowerCase(),

  // AI Service
  AI_PROVIDER: process.env.AI_PROVIDER || "groq",
  AI_API_KEY: process.env.AI_API_KEY || "",
  AI_MODEL: process.env.AI_MODEL || "llama-3.1-8b-instant",
  AI_API_URL: process.env.AI_API_URL || "https://api.groq.com/openai/v1/chat/completions",
  AI_DAILY_LIMIT: parseInt(process.env.AI_DAILY_LIMIT || "10", 10),

  // Email notifications
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  NOTIFY_FROM: process.env.NOTIFY_FROM || "DishaYaaN <noreply@dishayaan.com>",
  NOTIFY_ADMIN_EMAIL: process.env.NOTIFY_ADMIN_EMAIL || "",

  // Payments (Razorpay)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
}
