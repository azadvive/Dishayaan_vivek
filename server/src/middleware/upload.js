const multer = require("multer")
const path = require("path")
const fs = require("fs")

const uploadsDir = path.join(__dirname, "../../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "")
    const unique = Date.now() + "-" + Math.random().toString(36).slice(2, 8)
    cb(null, `${safeBase || "file"}-${unique}${ext}`)
  },
})

const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/
    const isMime = allowed.test(file.mimetype)
    const isExt = allowed.test(path.extname(file.originalname).toLowerCase())
    if (isMime && isExt) return cb(null, true)
    cb(new Error("Avatars must be an image (PNG, JPG, WebP, or GIF) under 2MB"))
  },
})

const communityUpload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|pdf|txt|docx?/
    const isExt = allowed.test(path.extname(file.originalname).toLowerCase().replace(".", ""))
    if (isExt) return cb(null, true)
    cb(new Error("File attachment must be an image, PDF, or document under 6MB"))
  },
})

module.exports = {
  avatarUpload,
  communityUpload,
}
