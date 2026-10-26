const env = require("../config/env")
const db = require("../config/db")
const content = require("../../../src/data/content.json")

const trackKeywords = [
  [/\b(ai|ml|machine|artificial|generative|data)\b/i, "ai-ml"],
  [/robot|arduino|embedded|sensor/i, "robotics"],
  [/drone|flight|aero/i, "drones"],
  [/python|coding|code|program|computer|software|web/i, "computer-science"],
  [/stock|trading|market|invest|finance|money/i, "stock-market"],
  [/bio|dna|life science|genetic/i, "biotechnology"],
  [/physic/i, "physics"],
  [/engineer/i, "engineering"],
  [/research/i, "research"],
  [/entrepreneur|startup|business|company/i, "entrepreneurship"],
]

function getRuleBasedReply(question) {
  const q = String(question || "").toLowerCase()
  const links = []
  let text = ""

  if (/parent|my child|my son|my daughter/i.test(q)) {
    text = "DishaYaaN partners with families to guide students from Class 6 to 12. We focus on real exploration, foundational conceptual rigor, and 1-on-1 mentorship rather than high-stress rote memorization."
    links.push(["/plans", "Explore plans"])
    links.push(["/book", "Book a discovery session"])
    return { text, links, source: "rule-based" }
  }

  if (/fee|price|cost|how much|inr|charge/i.test(q)) {
    const plansList = (content.plans || []).map((p) => `• ${p.name}: ₹${p.priceInr || p.price_inr} / ${p.billingPeriod || p.billing_period || "month"}`).join("\n")
    text = `Here are our published plans:\n\n${plansList}\n\nOne-on-one mentor sessions can also be booked on a pay-per-session basis.`
    links.push(["/plans", "View all plans"])
    links.push(["/book", "Book session"])
    return { text, links, source: "rule-based" }
  }

  if (/book|appointment|slot|talk to mentor|schedule/i.test(q)) {
    text = "You can book a 1-on-1 session with a specialized mentor in science, engineering, AI, robotics, or commerce directly through our booking portal."
    links.push(["/book", "Go to Booking Portal"])
    links.push(["/mentors", "Browse Mentors"])
    return { text, links, source: "rule-based" }
  }

  // Check track match
  const matchedTrack = trackKeywords.find(([re]) => re.test(q))
  if (matchedTrack) {
    const trackId = matchedTrack[1]
    const track = (content.tracks || []).find((t) => t.id === trackId)
    const progs = (content.programmes || []).filter((p) => p.trackId === trackId || p.track_id === trackId).slice(0, 2)
    if (track) {
      text = `${track.name}: ${track.tagline || track.summary || ""}\n\nRecommended programs:\n` +
        progs.map((p) => `• ${p.title} (${p.classRange || p.class_range || "Class 6-12"})`).join("\n")
      if (progs[0]) links.push([`/program/${progs[0].slug}`, `View ${progs[0].title}`])
      links.push(["/catalog", "Browse all programs"])
      return { text, links, source: "rule-based" }
    }
  }

  // Check exam match
  const exam = (content.exam_pathways || []).find((e) => new RegExp(`\\b${e.code.toLowerCase()}\\b`).test(q))
  if (exam) {
    text = `${exam.name} (${exam.code}) Strategy & Guidance:\n${exam.summary || ""}\nTarget stages: ${exam.stages || "High school"}.`
    links.push(["/mentors", "Connect with Exam Mentors"])
    return { text, links, source: "rule-based" }
  }

  text = "DishaYaaN offers structured mentorship and project-based programs for Class 6–12 students across AI, Robotics, Coding, Drones, Biotechnology, and competitive exam tracks. How can I help you explore your path today?"
  links.push(["/pathfinder", "Take Path Finder Quiz"])
  links.push(["/catalog", "Explore Catalogue"])
  links.push(["/mentors", "Meet Mentors"])
  return { text, links, source: "rule-based" }
}

function buildSystemPrompt() {
  const programs = (content.programmes || []).map((p) => `- ${p.title} (/program/${p.slug}) for ${p.classRange || p.class_range || "Class 6-12"}, Price: ${p.priceInr ? "₹" + p.priceInr : "published on site"}`).join("\n")
  const mentors = (content.mentor_seats || []).map((m) => `- ${m.role} (${m.slug}), Domain: ${m.domain}`).join("\n")
  const plans = (content.plans || []).map((p) => `- ${p.name}: ₹${p.priceInr || p.price_inr} / ${p.billingPeriod || p.billing_period}`).join("\n")

  return `You are the DishaYaaN AI Assistant, guiding students (Class 6-12) and their parents across India in exploring careers, technical skills (AI, Robotics, Drones, Coding, Biotechnology), and exam preparation (JEE, NEET, NDA, Olympiads).

Core Rules:
1. Always ground your answers strictly in the approved DishaYaaN catalog below.
2. Never invent unlisted courses, false pricing, admission guarantees, or fake exam ranks.
3. Be encouraging, concise, and structured.
4. Always provide 1 to 3 relevant internal links in markdown format, e.g. [Browse Mentors](/mentors), [Book a Session](/book), or [Explore Plans](/plans).

DishaYaaN Programs:
${programs}

Mentors:
${mentors}

Plans:
${plans}
`
}

async function getLiveCompletion(messages) {
  if (!env.AI_API_KEY) return null

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 12000)

  try {
    const res = await fetch(env.AI_API_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: "Bearer " + env.AI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature: 0.3,
        max_tokens: 600,
        messages,
      }),
    })

    if (!res.ok) {
      console.warn("[AI Service] Live completion returned status:", res.status)
      return null
    }

    const data = await res.json()
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content
    }
    return null
  } catch (err) {
    console.warn("[AI Service] Live completion error:", err.message)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function checkAndIncrementQuota(sessionKey) {
  const client = db.getAdminClient()
  if (!client) {
    return { allowed: true, used: 1, limit: env.AI_DAILY_LIMIT }
  }

  const today = new Date().toISOString().slice(0, 10)

  try {
    const { data: row } = await client
      .from("ai_usage")
      .select("id, request_count")
      .eq("session_key", sessionKey)
      .eq("feature", "assistant")
      .eq("used_on", today)
      .maybeSingle()

    const used = row ? row.request_count : 0

    if (used >= env.AI_DAILY_LIMIT) {
      return { allowed: false, used, limit: env.AI_DAILY_LIMIT }
    }

    if (row) {
      await client
        .from("ai_usage")
        .update({ request_count: used + 1, updated_at: new Date().toISOString() })
        .eq("id", row.id)
    } else {
      await client.from("ai_usage").insert({
        session_key: sessionKey,
        feature: "assistant",
        request_count: 1,
        used_on: today,
      })
    }

    return { allowed: true, used: used + 1, limit: env.AI_DAILY_LIMIT }
  } catch (err) {
    console.warn("[AI Service] Quota check failed, allowing fallback:", err.message)
    return { allowed: true, used: 1, limit: env.AI_DAILY_LIMIT }
  }
}

module.exports = {
  getRuleBasedReply,
  buildSystemPrompt,
  getLiveCompletion,
  checkAndIncrementQuota,
}
