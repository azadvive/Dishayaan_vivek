import React from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import Heading from "../common/Heading"
import { ProgrammeCard, MentorCard } from "../cards"
import { useUI } from "../../ui"
import { P, fmtINR, accentOf, trackById, kindLabel } from "../../content"
import { useSeo } from "../../forms"
import { useCatalog } from "../../lib/catalog"
import { Notice } from "../common/Notice"
import { FaCheckCircle, FaClock, FaCalendarAlt, FaLaptop } from "react-icons/fa"

const examMentor = { JEE: "physics-jee-mentor", NEET: "neet-strategy-mentor", NDA: "nda-defence-mentor", CS: "commerce-professional-mentor", CMA: "commerce-professional-mentor" }

export default function ProgramDetail({ match }) {
  const { openMentor } = useUI()
  const cat = useCatalog()
  const L = P.programme_detail_labels
  const p = cat.programmes.find((x) => x.slug === match.params.slug)
  useSeo(p ? p.title : L.not_found.title, p && p.summary)
  if (cat.loading) return <section className="padding"><div className="container">Loading programme…</div></section>
  if (cat.error) return <section className="padding"><div className="container"><Notice kind="error">{cat.error}</Notice></div></section>
  if (!p)
    return (
      <section className="padding"><div className="container center">
        <Heading title={L.not_found.title} lead={L.not_found.body} />
        <Link to="/catalog" className="btn-link primary-btn">{L.not_found.cta}</Link>
      </div></section>
    )
  const mentors = cat.mentors.filter((m) => (p.trackId ? m.domain === p.trackId : m.slug === examMentor[p.examCode]))
  const related = cat.programmes.filter((x) => x.id !== p.id && (p.trackId ? x.trackId === p.trackId : x.kind === p.kind)).slice(0, 3)
  const track = p.trackId && trackById(p.trackId)
  return (
    <>
      <PageHero title={p.title} lead={p.summary} crumb={p.title}>
        <Link to="/catalog" className="back-link">{L.back}</Link>
        <div className="hero-meta">
          <span className="pill light">{kindLabel[p.kind]}</span>
          <span><FaClock /> {p.durationWeeks} weeks</span>
          <span><FaCalendarAlt /> {p.sessionsPerWeek} sessions / week</span>
          <span><FaLaptop /> {p.mode}</span>
          <span>{p.classRange}</span>
        </div>
      </PageHero>
      <section className="padding">
        <div className="container detail-grid">
          <div>
            <h2 className="h2">{L.sections[0]}</h2>
            <ul className="ticks big">{p.outcomes.map((o) => <li key={o}><FaCheckCircle /> {o}</li>)}</ul>
            <h2 className="h2">{L.sections[1]}</h2>
            <div className="chips big">{p.projects.map((o) => <span key={o}>{o}</span>)}</div>
            <div className="chips">{p.skills.map((o) => <span className="soft" key={o}>{o}</span>)}</div>
            {track && <p className="small muted">{track.name} — {track.tagline}</p>}
          </div>
          <aside className="card fee shadow" style={{ "--accent": accentOf(p.accent) }}>
            <div className="price big">{p.priceInr ? fmtINR(p.priceInr) : L.fee_unknown}</div>
            <p className="small">{L.fee_note}</p>
            <p className="small"><b>{L.refund}</b></p>
            <button className="primary-btn full" onClick={() => openMentor({ domain: p.trackId })}>{L.ctas[0]}</button>
            <button className="outline-btn full" onClick={() => openMentor({ domain: p.trackId })}>{L.ctas[1]}</button>
            <Link to="/mentors" className="small center-link">{L.ctas[2]}</Link>
            <p className="small muted">{L.no_rank}</p>
          </aside>
        </div>
      </section>
      {mentors.length > 0 && (
        <section className="padding alt"><div className="container">
          <Heading title={L.sections[2]} />
          <div className="grid-4">{mentors.map((m) => <MentorCard key={m.id} m={m} />)}</div>
        </div></section>
      )}
      {related.length > 0 && (
        <section className="padding"><div className="container">
          <Heading title={L.sections[3]} />
          <div className="grid-3">{related.map((r) => <ProgrammeCard key={r.id} p={r} />)}</div>
        </div></section>
      )}
    </>
  )
}
