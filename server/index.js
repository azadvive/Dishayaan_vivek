const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const path = require("path")
const swaggerUi = require("swagger-ui-express")

const env = require("./src/config/env")
const db = require("./src/config/db")
const swaggerSpec = require("./src/config/swagger")

const authRoutes = require("./src/routes/authRoutes")
const catalogRoutes = require("./src/routes/catalogRoutes")
const bookingRoutes = require("./src/routes/bookingRoutes")
const enquiryRoutes = require("./src/routes/enquiryRoutes")
const pathfinderRoutes = require("./src/routes/pathfinderRoutes")
const communityRoutes = require("./src/routes/communityRoutes")
const aiRoutes = require("./src/routes/aiRoutes")
const paymentRoutes = require("./src/routes/paymentRoutes")
const adminRoutes = require("./src/routes/adminRoutes")

const { generalLimiter } = require("./src/middleware/rateLimiter")
const { notFoundHandler, globalErrorHandler } = require("./src/middleware/errorHandler")
const { sendSuccess } = require("./src/utils/helpers")

const app = express()

// 1. Security & Core Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
)

const allowedOrigins = [env.CORS_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"]
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".netlify.app")) {
        callback(null, true)
      } else {
        callback(null, true) // Allow in development
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key"],
  })
)

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Apply rate limiting
app.use("/api", generalLimiter)

// 2. Static File Serving (Uploaded files)
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// 3. Interactive API Documentation (Swagger)
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// 4. Health Check
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check system status and database connectivity
 *     tags: [System]
 */
app.get("/api/health", (req, res) => {
  return sendSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    databaseConfigured: db.isConfigured(),
    aiProvider: env.AI_PROVIDER,
    paymentsConfigured: Boolean(env.RAZORPAY_KEY_ID),
  })
})

// 5. Core API Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", authRoutes)
app.use("/api/catalog", catalogRoutes)
app.use("/api", catalogRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/enquiries", enquiryRoutes)
app.use("/api/pathfinder", pathfinderRoutes)
app.use("/api/community", communityRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/admin", adminRoutes)

// 6. Netlify Functions Compatibility Facade
// Allows frontend to call either REST endpoints or legacy /.netlify/functions endpoints
app.post(["/api/submit", "/.netlify/functions/submit"], (req, res, next) => {
  const form = req.body.form || req.body["form-name"]
  if (form === "book-session") {
    return bookingRoutes(req, res, next)
  }
  if (form === "mentor-connect") {
    return enquiryRoutes(req, res, next)
  }
  return enquiryRoutes(req, res, next)
})
app.post(["/api/ai-function", "/.netlify/functions/ai"], (req, res, next) => {
  return aiRoutes(req, res, next)
})
app.post(["/api/admin-bootstrap-function", "/.netlify/functions/admin-bootstrap"], (req, res, next) => {
  return authRoutes(req, res, next)
})
app.post(["/api/admin-action-function", "/.netlify/functions/admin-action"], (req, res, next) => {
  return adminRoutes(req, res, next)
})
app.post(["/api/razorpay-order-function", "/.netlify/functions/razorpay-order"], (req, res, next) => {
  return paymentRoutes(req, res, next)
})

// 7. Error Handling
app.use(notFoundHandler)
app.use(globalErrorHandler)

// 8. Start Server
const server = app.listen(env.PORT, () => {
  console.log(`\n======================================================`)
  console.log(`🚀 DishaYaaN Backend Server running on port ${env.PORT}`)
  console.log(`📄 Swagger API Docs:  http://localhost:${env.PORT}/api/docs`)
  console.log(`❤️  Health Check:     http://localhost:${env.PORT}/api/health`)
  console.log(`🗄️  Database Status:  ${db.isConfigured() ? "Connected (Supabase)" : "Ready (Local fallback mode)"}`)
  console.log(`======================================================\n`)
})

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server")
  server.close(() => console.log("HTTP server closed"))
})

module.exports = app
