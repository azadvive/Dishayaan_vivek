export const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ""
export const supabaseAnon = process.env.REACT_APP_SUPABASE_ANON_KEY || ""
export const siteUrl = process.env.REACT_APP_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")
export const paymentsFlag = process.env.REACT_APP_PAYMENTS_ENABLED === "true"
export const razorpayKeyId = process.env.REACT_APP_RAZORPAY_KEY_ID || ""
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon)

export const apiUrl = process.env.REACT_APP_API_URL || ""

export function apiPath(name) {
  const base = apiUrl ? apiUrl.replace(/\/$/, "") : ""
  return base + "/.netlify/functions/" + name
}
