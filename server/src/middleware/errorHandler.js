const multer = require("multer")
const { sendError } = require("../utils/helpers")

function notFoundHandler(req, res, next) {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404)
}

function globalErrorHandler(err, req, res, next) {
  console.error("[ServerError]", err)

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, "File size limit exceeded.", 400)
    }
    return sendError(res, `File upload error: ${err.message}`, 400)
  }

  if (err.type === "entity.parse.failed") {
    return sendError(res, "Malformed JSON payload.", 400)
  }

  if (err.name === "UnauthorizedError") {
    return sendError(res, "Invalid authentication token.", 401)
  }

  const statusCode = err.statusCode || err.status || 500
  const message = process.env.NODE_ENV === "production" ? "Internal server error." : err.message || "Internal server error."

  return sendError(res, message, statusCode, process.env.NODE_ENV === "development" ? err.stack : undefined)
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
}
