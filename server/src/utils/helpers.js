const crypto = require("crypto")

function sendSuccess(res, data = {}, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    message,
    data,
  })
}

function sendError(res, error = "An error occurred", statusCode = 400, details = null) {
  return res.status(statusCode).json({
    ok: false,
    error: typeof error === "string" ? error : error.message || "An error occurred",
    ...(details ? { details } : {}),
  })
}

function generateRandomRef(prefix = "DY") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${result}`
}

function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2)
}

module.exports = {
  sendSuccess,
  sendError,
  generateRandomRef,
  generateUUID,
}
