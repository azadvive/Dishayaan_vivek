function ruleReply(q, ctx) {
  const s = String(q || "").toLowerCase()
  const links = []
  let text = ""
  const programmes = ctx.programmes || []
  const plans = ctx.plans || []
  const faq = ctx.faq || []
  const tracks = ctx.tracks || []
  const exams = ctx.exams || []

  const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN")
  const trackKeys = [
    [/\b(ai|ml|machine|artificial|generative|data)\b/, "ai-ml"],
    [/robot|arduino|embedded|sensor/, "robotics"],
    [/drone|flight|aero/, "drones"],
    [/python|coding|code|program|computer|software|web/, "computer-science"],
    [/stock|trading|market|invest|finance|money/, "stock-market"],
    [/bio|dna|life science|genetic/, "biotechnology"],
    [/physic/, "physics"],
    [/engineer/, "engineering"],
    [/research/, "research"],
    [/entrepreneur|startup|business|company/, "entrepreneurship"],
  ]

  const exam = exams.find((e) => new RegExp("\\b" + String(e.code).toLowerCase() + "\\b").test(s))
  const tk = trackKeys.find(([re]) => re.test(s))

  if (/plan|price|fee|cost|pay|refund/.test(s)) {
    text = plans
      .map((p) => `• ${p.name} — ${p.tagline} ${fmt(p.price_inr || p.priceInr)}`)
      .join("\n")
    links.push(["/plans", "Plans"])
  } else if (exam) {
    text = `${exam.name} — ${exam.whoFor || ""}\n${exam.approach || ""}`
    links.push(["/catalog", "Catalogue"])
  } else if (tk) {
    const t = tracks.find((x) => x.id === tk[1])
    const progs = programmes.filter((p) => (p.track_id || p.trackId) === (t && t.id))
    text = t ? `${t.name}: ${t.tagline || ""}\n${t.summary || ""}` : ""
    progs.forEach((p) => links.push([`/program/${p.slug}`, p.title]))
  } else if (/mentor|human|person|talk/.test(s)) {
    text = "Mentor seats are listed on the mentors page. Profiles publish only after verification. Session requests stay pending until the team confirms them."
    links.push(["/mentors", "Mentors"])
  } else if (/confus|career|not sure|path|direction|decide/.test(s)) {
    text = "Path Finder is a guided questionnaire that maps interests to exploration tracks. It is not a scientifically validated career test."
    links.push(["/pathfinder", "Path Finder"])
  } else {
    const words = s.split(/\W+/).filter((w) => w.length > 3)
    const best = faq
      .map((f) => ({ f, n: words.filter((w) => ((f.q || "") + (f.a || "")).toLowerCase().includes(w)).length }))
      .sort((a, b) => b.n - a.n)[0]
    if (best && best.n > 0) text = `${best.f.q}\n${best.f.a}`
    else text = "I can help with programmes, mentors, plans, Path Finder and bookings using DishaYaaN's published content."
  }
  return { text, links, source: "fallback" }
}

module.exports = { ruleReply }
