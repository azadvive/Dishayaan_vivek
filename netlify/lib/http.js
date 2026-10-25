const buckets = new Map()

function corsHeaders(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "*"
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Idempotency-Key",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  }
}

function json(event, status, body) {
  return { statusCode: status, headers: corsHeaders(event), body: JSON.stringify(body) }
}

function readBody(event) {
  if (!event.body) return {}
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body
  try {
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}

function clientKey(event) {
  const h = event.headers || {}
  return h["x-nf-client-connection-ip"] || h["x-forwarded-for"] || h["client-ip"] || "local"
}

function rateLimit(event, name, limit, windowMs) {
  const key = name + ":" + clientKey(event)
  const now = Date.now()
  const slot = buckets.get(key) || { n: 0, t: now }
  if (now - slot.t > windowMs) {
    slot.n = 0
    slot.t = now
  }
  slot.n += 1
  buckets.set(key, slot)
  return slot.n <= limit
}

function randomRef(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 8).toUpperCase()
}

module.exports = { json, readBody, corsHeaders, rateLimit, clientKey, randomRef }
