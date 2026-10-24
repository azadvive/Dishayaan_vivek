import React from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import Heading from "../common/Heading"
import { MentorCard } from "../cards"
import { useUI } from "../../ui"
import { C, P, trackById } from "../../content"
import { useSeo } from "../../forms"
import { FaCheckCircle, FaGraduationCap, FaBriefcase } from "react-icons/fa"
import MentorVideo from "../common/MentorVideo"
import { extraFor } from "../../data/mentorExtras"

export default function MentorDetail({ match }) {
  const { openMentor } = useUI()
  const D = P.mentors_page.detail
  const m = C.mentor_seats.find((x) => x.slug === match.params.slug)
  useSeo(m ? m.role : "Mentor", m && m.bio)
  if (!m)
    return (
      <section className="padding"><div className="container center">
        <Heading title={D.not_found} />
        <Link to="/mentors" className="btn-link primary-btn">{P.mentors_section_notes.see_all}</Link>
      </div></section>
    )
  const more = C.mentor_seats.filter((x) => x.id !== m.id).slice(0, 3)
  return (
    <>
      <PageHero crumb={m.code} title={m.role} lead={m.bio}>
        <div className="hero-meta"><span className="pill light">{P.mentors_page.seat_status_label}</span><span>{m.code}</span><span>{m.format}</span></div>
      </PageHero>
      <section className="padding">
        <div className="container detail-grid">
          <div>
            <h2 className="h2">{D.helps_with}</h2>
            <ul className="ticks big">{m.helpsWith.map((h) => <li key={h}><FaCheckCircle /> {h}</li>)}</ul>
            <div className="chips big">{m.expertise.map((s) => <span key={s}>{s}</span>)}</div>
            <div style={{ marginTop: 30 }}><MentorVideo m={m} url={extraFor(m.slug).videoUrl} accent={(trackById(m.domain) || {}).accent} height={260} /><p className="small muted">{D.video}</p></div>
            <p className="note-line left">{D.reviews_note}</p>
          </div>
          <aside className="card fee shadow">
            <div className="mfacts"><div><FaGraduationCap /><span>{extraFor(m.slug).college || "Pending verification"}</span></div><div><FaBriefcase /><span>{extraFor(m.slug).company || "Pending verification"}</span></div></div>
            <p><b>{m.languages.join(" · ")}</b></p>
            <p>{m.availability}</p>
            <p className="small">{m.format}</p>
            <p className="small muted">{D.booking_note}</p>
            <button className="primary-btn full" onClick={() => openMentor({ domain: m.domain })}>{P.programme_detail_labels.ctas[0]}</button>
          </aside>
        </div>
      </section>
      <section className="padding alt"><div className="container">
        <Heading title={D.more} />
        <div className="grid-3">{more.map((x) => <MentorCard key={x.id} m={x} />)}</div>
      </div></section>
    </>
  )
}
