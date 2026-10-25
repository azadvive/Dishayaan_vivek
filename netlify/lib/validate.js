const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[0-9][0-9\s-]{7,18}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function str(v, max) {
  if (v == null) return ""
  return String(v).trim().slice(0, max)
}

function requireFields(obj, keys) {
  const missing = keys.filter((k) => !str(obj[k], 500))
  return missing
}

function validEmail(v) {
  const s = str(v, 200)
  return !s || EMAIL.test(s)
}

function validPhone(v) {
  return PHONE.test(str(v, 24).replace(/\s/g, ""))
}

function fingerprint(parts) {
  return parts.map((p) => str(p, 200).toLowerCase()).join("|")
}

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled", "rejected"]

function validateBooking(data) {
  const name = str(data.name, 120)
  const whatsapp = str(data.whatsapp, 24)
  const email = str(data.email, 200)
  const errors = []
  if (name.length < 2) errors.push("name")
  if (!validPhone(whatsapp)) errors.push("whatsapp")
  if (!validEmail(email)) errors.push("email")
  if (data.date) {
    const d = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (Number.isNaN(d.getTime()) || d < today) errors.push("date")
  }
  return {
    ok: errors.length === 0,
    errors,
    value: {
      booker_role: str(data.role, 80),
      name,
      whatsapp,
      email: email || null,
      domain: str(data.domain, 80),
      session_mode: str(data.mode, 80),
      mentor_slug: str(data.mentor_seat, 120),
      context: str(data.context, 4000),
      requested_date: str(data.date, 20) || null,
      slot: str(data.slot, 80),
    },
  }
}

function validateMentorConnect(data) {
  const name = str(data.name, 120)
  const whatsapp = str(data.whatsapp, 24)
  const errors = []
  if (name.length < 2) errors.push("name")
  if (!validPhone(whatsapp)) errors.push("whatsapp")
  return {
    ok: errors.length === 0,
    errors,
    value: {
      name,
      whatsapp,
      class_level: str(data.class, 40),
      domain: str(data.domain, 80),
      language: str(data.language, 40),
      availability: str(data.availability, 80),
      context: str(data.context, 4000),
    },
  }
}

function validateEnquiry(data, category) {
  const name = str(data.name || data.student, 120)
  const phone = str(data.whatsapp || data.phone, 24)
  const email = str(data.email, 200)
  const errors = []
  if (name.length < 2) errors.push("name")
  if (!validPhone(phone)) errors.push("whatsapp")
  if (!validEmail(email)) errors.push("email")
  return {
    ok: errors.length === 0,
    errors,
    value: {
      category,
      name,
      organization: str(data.institution, 200) || null,
      email: email || null,
      phone,
      class_level: str(data.class, 40) || null,
      domain: str(data.domain, 80) || null,
      message: str(data.context || data.requirement || data.message, 4000),
      plan_slug: str(data.plan, 80) || null,
    },
  }
}

function validatePost(data) {
  const body = str(data.text || data.body, 8000)
  const author = str(data.author, 80)
  const errors = []
  if (body.length < 8) errors.push("text")
  if (author.length < 2) errors.push("author")
  const tags = str(data.tags, 200)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6)
  const link = str(data.link, 500)
  if (link && !/^https?:\/\//i.test(link)) errors.push("link")
  return {
    ok: errors.length === 0,
    errors,
    value: { body, author_name: author, tags, link: link || null },
  }
}

module.exports = {
  str,
  EMAIL,
  PHONE,
  UUID,
  requireFields,
  validEmail,
  validPhone,
  fingerprint,
  BOOKING_STATUSES,
  validateBooking,
  validateMentorConnect,
  validateEnquiry,
  validatePost,
}
