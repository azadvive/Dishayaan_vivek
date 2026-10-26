const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../.env") })
const { createClient } = require("@supabase/supabase-js")
const content = require("../../src/data/content.json")

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed the database.")
  console.log("Please add them to server/.env first.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function seed() {
  console.log("🌱 Starting DishaYaaN database seed...")

  // 1. Seed Programs
  const programs = (content.programmes || []).map((p) => ({
    content_id: p.id || null,
    slug: p.slug,
    title: p.title,
    kind: p.kind || "future",
    track_id: p.trackId || p.track_id || null,
    exam_code: p.examCode || p.exam_code || null,
    summary: p.summary || "",
    accent: p.accent || "blue",
    class_range: p.classRange || p.class_range || "Class 6-12",
    duration_weeks: p.durationWeeks || p.duration_weeks || 8,
    sessions_per_week: p.sessionsPerWeek || p.sessions_per_week || 2,
    mode: p.mode || "Online live sessions",
    skills: p.skills || [],
    projects: p.projects || [],
    outcomes: p.outcomes || [],
    price_inr: p.priceInr || p.price_inr || null,
    goal_oriented: Boolean(p.goalOriented || p.goal_oriented),
    featured: Boolean(p.featured),
    published: true,
  }))

  console.log(`📦 Seeding ${programs.length} programs...`)
  for (const prog of programs) {
    const { error } = await supabase.from("programs").upsert(prog, { onConflict: "slug" })
    if (error) console.warn(`  ⚠️ Program ${prog.slug}:`, error.message)
    else console.log(`  ✅ Program ${prog.slug}`)
  }

  // 2. Seed Mentors
  const mentors = (content.mentor_seats || []).map((m) => ({
    content_id: m.id || null,
    slug: m.slug,
    code: m.code || m.slug,
    role_title: m.role || m.role_title,
    domain: m.domain || "general",
    bio: m.bio || "",
    expertise: m.expertise || [],
    helps_with: m.helpsWith || m.helps_with || [],
    languages: m.languages || ["English", "Hindi"],
    availability: m.availability || "Weekends",
    format: m.format || "1-on-1 Online video",
    video_url: m.videoUrl || m.video_url || null,
    video_duration: m.videoDuration || m.video_duration || null,
    college: m.college || null,
    company: m.company || null,
    status: m.status || "verified",
    published: true,
  }))

  console.log(`\n👨‍🏫 Seeding ${mentors.length} mentors...`)
  for (const mentor of mentors) {
    const { error } = await supabase.from("mentors").upsert(mentor, { onConflict: "slug" })
    if (error) console.warn(`  ⚠️ Mentor ${mentor.slug}:`, error.message)
    else console.log(`  ✅ Mentor ${mentor.slug}`)
  }

  // 3. Seed Plans
  const plans = (content.plans || []).map((pl) => ({
    content_id: pl.id || null,
    slug: pl.slug || pl.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: pl.name,
    tagline: pl.tagline || pl.bestFor || "",
    best_for: pl.bestFor || pl.best_for || "",
    price_inr: pl.priceInr || pl.price_inr || 0,
    billing_period: pl.billingPeriod || pl.billing_period || "month",
    mentor_sessions_per_month: pl.mentorSessionsPerMonth || pl.mentor_sessions_per_month || 1,
    ai_credits_per_month: pl.aiCreditsPerMonth || pl.ai_credits_per_month || 100,
    accent: pl.accent || "blue",
    popular: Boolean(pl.popular),
    features: pl.features || [],
    published: true,
  }))

  console.log(`\n💳 Seeding ${plans.length} plans...`)
  for (const plan of plans) {
    const { error } = await supabase.from("plans").upsert(plan, { onConflict: "slug" })
    if (error) console.warn(`  ⚠️ Plan ${plan.slug}:`, error.message)
    else console.log(`  ✅ Plan ${plan.slug}`)
  }

  console.log("\n🎉 Database seeding finished successfully!")
}

seed().catch((err) => {
  console.error("Fatal seed error:", err)
  process.exit(1)
})
