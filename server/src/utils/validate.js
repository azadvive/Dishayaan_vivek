const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{7,18}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function sanitizeString(val, maxLength = 255) {
  if (val === null || val === undefined) return ""
  return String(val).trim().slice(0, maxLength)
}

function isValidEmail(email) {
  const str = sanitizeString(email, 255)
  return Boolean(str && EMAIL_REGEX.test(str))
}

function isValidPhone(phone) {
  const cleaned = sanitizeString(phone, 24).replace(/\s/g, "")
  return Boolean(cleaned && PHONE_REGEX.test(cleaned))
}

function isValidUUID(uuid) {
  return Boolean(uuid && UUID_REGEX.test(String(uuid)))
}

function fingerprint(parts = []) {
  return parts.map((p) => sanitizeString(p, 200).toLowerCase()).join("|")
}

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled", "rejected"]
const USER_ROLES = ["student", "mentor", "admin"]
const ACCOUNT_STATUSES = ["active", "suspended", "pending"]

function validateBookingData(data) {
  const name = sanitizeString(data.name, 120)
  const whatsapp = sanitizeString(data.whatsapp, 24)
  const email = sanitizeString(data.email, 200)
  const errors = []

  if (name.length < 2) errors.push("name is required (minimum 2 characters)")
  if (!isValidPhone(whatsapp)) errors.push("valid whatsapp phone number is required")
  if (email && !isValidEmail(email)) errors.push("valid email address is required")

  if (data.date) {
    const d = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (Number.isNaN(d.getTime()) || d < today) {
      errors.push("date cannot be in the past")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      booker_role: sanitizeString(data.role || data.booker_role, 80),
      name,
      whatsapp,
      email: email || null,
      domain: sanitizeString(data.domain, 100) || null,
      session_mode: sanitizeString(data.session_mode || data.mode, 50) || null,
      mentor_slug: sanitizeString(data.mentor_seat || data.mentor_slug, 120) || null,
      context: sanitizeString(data.context, 4000),
      requested_date: data.date ? new Date(data.date).toISOString().slice(0, 10) : null,
      slot: sanitizeString(data.slot, 80),
    },
  }
}

function validateEnquiryData(data, category = "general") {
  const name = sanitizeString(data.name || data.student, 120)
  const phone = sanitizeString(data.whatsapp || data.phone, 24)
  const email = sanitizeString(data.email, 200)
  const errors = []

  if (name.length < 2) errors.push("name is required (minimum 2 characters)")
  if (!isValidPhone(phone)) errors.push("valid phone number is required")
  if (email && !isValidEmail(email)) errors.push("valid email is required")

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      category,
      name,
      organization: sanitizeString(data.institution || data.organization, 255) || null,
      email: email || null,
      phone,
      class_level: sanitizeString(data.class || data.class_level, 40) || null,
      domain: sanitizeString(data.domain, 80) || null,
      message: sanitizeString(data.context || data.requirement || data.message, 4000),
      plan_slug: sanitizeString(data.plan || data.plan_slug, 80) || null,
    },
  }
}

function validatePostData(data) {
  const content = sanitizeString(data.text || data.content, 8000)
  const author = sanitizeString(data.author || data.author_name, 80)
  const errors = []

  if (content.length < 5) errors.push("post content must be at least 5 characters")
  if (author.length < 2) errors.push("author name is required")

  let tags = []
  if (Array.isArray(data.tags)) {
    tags = data.tags.map((t) => sanitizeString(t, 40)).filter(Boolean).slice(0, 6)
  } else if (typeof data.tags === "string") {
    tags = data.tags.split(",").map((t) => sanitizeString(t, 40)).filter(Boolean).slice(0, 6)
  }

  const linkUrl = sanitizeString(data.link || data.link_url, 500)
  if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
    errors.push("link must be a valid http/https URL")
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      content,
      author_name: author,
      tags,
      link_url: linkUrl || null,
    },
  }
}

module.exports = {
  sanitizeString,
  isValidEmail,
  isValidPhone,
  isValidUUID,
  fingerprint,
  BOOKING_STATUSES,
  USER_ROLES,
  ACCOUNT_STATUSES,
  validateBookingData,
  validateEnquiryData,
  validatePostData,
}
