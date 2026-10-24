import React, { useState } from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import Heading from "../common/Heading"
import { ProgrammeCard } from "../cards"
import { DOMAINS, programmeFor, examFor } from "../../data/domains"
import { useUI } from "../../ui"
import { C, P, accentOf } from "../../content"
import { useSeo } from "../../forms"
import { FaSearch } from "react-icons/fa"

export default function CourseHome() {
  const { openMentor } = useUI()
  const K = P.catalog_page
  useSeo(K.title, K.seo)
  const [f, setF] = useState(0)
  const [q, setQ] = useState("")
  const kinds = [null, "future", "goal", "direction"]
  // one card per domain (same order as the home page), plus the general "direction" programme
  const base = [...DOMAINS.map(programmeFor).filter(Boolean), ...C.programmes.filter((p) => p.kind === "direction")]
  const exams = DOMAINS.map(examFor).filter(Boolean)
  const list = base.filter((p) => {
    if (kinds[f] && p.kind !== kinds[f]) return false
    const hay = [p.title, p.summary, ...(p.skills || []), ...(p.projects || [])].join(" ").toLowerCase()
    return hay.includes(q.toLowerCase())
  })
  return (
    <>
      <PageHero crumb={K.filters[0].split(" ")[0] && "Catalogue"} title={K.title} lead={K.lead}>
        <div className="hero-card">
          <h4>{K.built_for.title}</h4>
          <p>{K.built_for.body}</p>
          <div className="btns">
            <button className="primary-btn" onClick={() => openMentor({})}>{K.ctas[0]}</button>
            <Link to="/pathfinder" className="btn-link light-btn">{K.ctas[1]}</Link>
          </div>
        </div>
      </PageHero>
      <section className="padding">
        <div className="container">
          <div className="filters">
            <div className="tabs">
              {K.filters.map((x, i) => <button key={x} className={f === i ? "on" : ""} onClick={() => setF(i)}>{x}</button>)}
            </div>
            <label className="search"><FaSearch /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={K.search_placeholder} aria-label={K.search_placeholder} /></label>
          </div>
          {list.length ? (
            <div className="grid-3">{list.map((p) => <ProgrammeCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="empty card shadow"><p>{K.empty}</p></div>
          )}
          <p className="note-line">{P.catalogue_notes.no_rank_claims}</p>
        </div>
      </section>
      <section className="padding alt">
        <div className="container">
          <Heading subtitle={K.exam_block.eyebrow} title={K.exam_block.title} lead={K.exam_block.body} />
          <div className="grid-3">
            {exams.map((e) => (
              <div className="card exam shadow" key={e.code} style={{ "--accent": accentOf(e.accent) }}>
                <span className="exam-code">{e.code}</span>
                <h3>{e.name}</h3>
                <p className="small muted">{e.whoFor}</p>
                <p>{e.approach}</p>
                <ul className="plain small">
                  <li>{e.mentorship}</li><li>{e.planning}</li><li>{e.conceptSupport}</li><li>{e.monitoring}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
