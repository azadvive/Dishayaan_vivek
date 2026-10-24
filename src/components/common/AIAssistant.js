import React, { useEffect, useRef, useState } from "react"
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa"
import { Link } from "../../router"
import { useUI } from "../../ui"
import { useI18n } from "../../i18n"
import { C, P, fmtINR } from "../../content"
import { store, track } from "../../forms"

const LIMIT = 10
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

// Grounded only in DishaYaaN's own content: never invents prices, mentors or exam outcomes.
function reply(q) {
  const s = q.toLowerCase()
  const links = []
  let text = ""
  const exam = C.exam_pathways.find((e) => new RegExp("\\b" + e.code.toLowerCase() + "\\b").test(s) || (e.code === "CS" && /company secretary/.test(s)))
  const tk = trackKeys.find(([re]) => re.test(s))
  if (/parent|my child|my son|my daughter/.test(s)) {
    text = P.home_audience.parent.body + "\n\n" + P.parents_section.bullets.map((b) => "• " + b).join("\n")
    links.push(["/plans", P.parents_section.ctas[1]])
  } else if (/plan|price|fee|cost|pay|refund/.test(s)) {
    text = C.plans.map((p) => `• ${p.name} — ${p.tagline} ${fmtINR(p.priceInr)} ${p.billingPeriod === "project" ? "one-time" : "/ month"}`).join("\n") + "\n\n" + P.programme_detail_labels.refund
    links.push(["/plans", P.plans_page.hero.title])
  } else if (exam) {
    text = `${exam.name} — ${exam.whoFor}.\n${exam.approach}\n• ${exam.mentorship}\n• ${exam.planning}\n• ${exam.monitoring}\n\n${P.programme_detail_labels.no_rank}`
    links.push(["/catalog", P.catalog_page.exam_block.title])
  } else if (tk) {
    const t = C.tracks.find((x) => x.id === tk[1])
    const progs = C.programmes.filter((p) => p.trackId === t.id)
    text = `${t.name}: ${t.tagline}\n${t.summary}\n\n${P.track_card_labels.skills}: ${t.skills.join(", ")}.\n${P.track_card_labels.projects}: ${t.projects.join(", ")}.`
    if (progs.length) text += "\n\n" + progs.map((p) => `• ${p.title} (${p.classRange})`).join("\n")
    progs.forEach((p) => links.push([`/program/${p.slug}`, p.title]))
  } else if (/mentor|human|person|talk/.test(s)) {
    text = P.mentors_page.lead
    links.push(["/mentors", P.mentors_section_notes.see_all])
  } else if (/confus|career|not sure|path|direction|decide/.test(s)) {
    const pf = P.catalogue_notes.pathfinder_card
    text = `${pf.title}\n${pf.body}`
    links.push(["/pathfinder", pf.cta])
  } else {
    const words = s.split(/\W+/).filter((w) => w.length > 3)
    const best = C.faq.map((f) => ({ f, n: words.filter((w) => (f.q + f.a).toLowerCase().includes(w)).length })).sort((a, b) => b.n - a.n)[0]
    if (best && best.n > 0) text = `${best.f.q}\n${best.f.a}`
    else text = C.ai_assistant_suggested_prompts.map((x) => "• " + x).join("\n")
  }
  return { text, links }
}

export default function AIAssistant() {
  const { ai, openAI, closeAI, openMentor } = useUI()
  const { t } = useI18n()
  const A = P.ai_assistant
  const [used, setUsed] = useState(() => store.get("dy_ai_used", 0))
  const [msgs, setMsgs] = useState([{ from: "bot", text: A.greeting }])
  const [input, setInput] = useState("")
  const end = useRef(null)
  useEffect(() => { end.current && end.current.scrollIntoView({ block: "end" }) }, [msgs, ai])

  const ask = (q) => {
    q = q.trim()
    if (!q) return
    setInput("")
    if (used >= LIMIT) return
    const r = reply(q)
    const n = used + 1
    setUsed(n)
    store.set("dy_ai_used", n)
    track("ai_question", { n })
    setMsgs((m) => [...m, { from: "user", text: q }, { from: "bot", ...r }])
  }
  const done = used >= LIMIT

  return (
    <>
      {!ai && (
        <button className="ai-fab" onClick={openAI} aria-label={t("nav.askAi")}>
          <FaRobot /> <span>{t("nav.askAi")}</span>
        </button>
      )}
      {ai && (
        <div className="ai-panel" role="dialog" aria-label="DishaYaaN AI">
          <div className="ai-head">
            <div>
              <b>DishaYaaN AI</b>
              <small>{A.tagline}</small>
            </div>
            <button onClick={closeAI} aria-label="Close"><FaTimes /></button>
          </div>
          <div className="ai-body">
            <p className="ai-notice">{A.limit_notice}</p>
            {msgs.map((m, i) => (
              <div key={i} className={`ai-msg ${m.from}`}>
                {m.text.split("\n").map((l, j) => <p key={j}>{l}</p>)}
                {m.links && m.links.slice(0, 3).map(([to, label]) => (
                  <Link key={to} to={to} className="ai-link" onClick={closeAI}>{label} →</Link>
                ))}
              </div>
            ))}
            {used === 0 && (
              <div className="chips ai-chips">
                {C.ai_assistant_starter_chips.map((c) => <button key={c} onClick={() => ask(c)}>{c}</button>)}
              </div>
            )}
            {used > 0 && !done && (
              <div className="chips ai-chips">
                {C.ai_assistant_suggested_prompts.slice(0, 4).map((c) => <button key={c} onClick={() => ask(c)}>{c}</button>)}
              </div>
            )}
            {(done || used > 0) && (
              <button className="primary-btn small" onClick={() => { closeAI(); openMentor({}) }}>
                {done ? A.ctas[0] : A.ctas[1]}
              </button>
            )}
            {done && <p className="ai-msg bot">{A.after_limit}</p>}
            <div ref={end} />
          </div>
          <form className="ai-input" onSubmit={(e) => { e.preventDefault(); ask(input) }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} disabled={done} placeholder={A.greeting} aria-label="Message" />
            <button disabled={done} aria-label="Send"><FaPaperPlane /></button>
          </form>
          <div className="ai-foot">{A.footer} · {Math.max(0, LIMIT - used)}/{LIMIT}</div>
        </div>
      )}
    </>
  )
}
