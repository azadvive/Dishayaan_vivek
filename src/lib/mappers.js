export function mapProgram(row) {
  if (!row) return null
  return {
    id: row.content_id || row.id,
    dbId: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    trackId: row.track_id,
    examCode: row.exam_code,
    summary: row.summary,
    accent: row.accent,
    classRange: row.class_range,
    durationWeeks: row.duration_weeks,
    sessionsPerWeek: row.sessions_per_week,
    mode: row.mode,
    skills: row.skills || [],
    projects: row.projects || [],
    outcomes: row.outcomes || [],
    curriculum: row.curriculum || [],
    prerequisites: row.prerequisites,
    priceInr: row.price_inr == null ? null : Number(row.price_inr),
    goalOriented: row.goal_oriented,
    featured: row.featured,
    published: row.published,
    thumbnailUrl: row.thumbnail_url,
  }
}

export function mapMentor(row) {
  if (!row) return null
  return {
    id: row.content_id || row.id,
    dbId: row.id,
    slug: row.slug,
    code: row.code,
    role: row.role_title,
    displayName: row.display_name,
    domain: row.domain,
    institution: null,
    status: row.status,
    expertise: row.expertise || [],
    helpsWith: row.helps_with || [],
    languages: row.languages || [],
    availability: row.availability,
    format: row.format,
    bio: row.bio,
    videoUrl: row.video_url,
    videoDuration: row.video_duration,
    college: row.college || "",
    company: row.company || "",
    published: row.published,
    userId: row.user_id,
  }
}

export function mapPlan(row) {
  if (!row) return null
  return {
    id: row.content_id || row.id,
    dbId: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    bestFor: row.best_for,
    priceInr: row.price_inr == null ? null : Number(row.price_inr),
    billingPeriod: row.billing_period,
    mentorSessionsPerMonth: row.mentor_sessions_per_month,
    aiCreditsPerMonth: row.ai_credits_per_month,
    accent: row.accent,
    popular: row.popular,
    features: row.features || [],
  }
}

export function programToRow(p) {
  return {
    content_id: p.id || null,
    slug: p.slug,
    title: p.title,
    kind: p.kind,
    track_id: p.trackId || null,
    exam_code: p.examCode || null,
    summary: p.summary,
    accent: p.accent,
    class_range: p.classRange,
    duration_weeks: p.durationWeeks,
    sessions_per_week: p.sessionsPerWeek,
    mode: p.mode,
    skills: p.skills || [],
    projects: p.projects || [],
    outcomes: p.outcomes || [],
    price_inr: p.priceInr ?? null,
    goal_oriented: Boolean(p.goalOriented),
    featured: Boolean(p.featured),
    published: p.published !== false,
  }
}

export function mentorToRow(m) {
  return {
    content_id: m.id || null,
    slug: m.slug,
    code: m.code,
    role_title: m.role,
    domain: m.domain,
    bio: m.bio,
    expertise: m.expertise || [],
    helps_with: m.helpsWith || [],
    languages: m.languages || [],
    availability: m.availability,
    format: m.format,
    video_url: m.videoUrl || null,
    video_duration: m.videoDuration || null,
    college: m.college || null,
    company: m.company || null,
    published: m.published !== false,
    status: m.status || "verifying",
  }
}
