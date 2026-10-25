import React, { useState } from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import Heading from "../common/Heading"
import { ProgrammeCard } from "../cards"
import { DOMAINS, examFor } from "../../data/domains"
import { useUI } from "../../ui"
import { C, P, accentOf } from "../../content"
import { useSeo } from "../../forms"
import { useCatalog } from "../../lib/catalog"
import { Notice } from "../common/Notice"
import { FaSearch } from "react-icons/fa"

export default function CourseHome() {
  const { openMentor } = useUI()
  const cat = useCatalog()
  const K = P.catalog_page
  useSeo(K.title, K.seo)
  const [f, setF] = useState(0)
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const kinds = [null, "future", "goal", "direction"]
  const programmeFor = (d) => {
    const [kind, val] = d.key.split(":")
    return cat.programmes.find((p) => (kind === "track" ? p.trackId === val : p.examCode === val))
  }
  const base = [...DOMAINS.map(programmeFor).filter(Boolean), ...cat.programmes.filter((p) => p.kind === "direction")]
  const exams = DOMAINS.map(examFor).filter(Boolean)
  const list = base.filter((p) => {
    if (kinds[f] && p.kind !== kinds[f]) return false
    const hay = [p.title, p.summary, ...(p.skills || []), ...(p.projects || [])].join(" ").toLowerCase()
    return hay.includes(q.toLowerCase())
  })
  const pageSize = 12
  const shown = list.slice(0, page * pageSize)
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
          {cat.loading && <p className="muted">Loading programmes…</p>}
          {cat.error && <Notice kind="error">Could not load the catalogue from the database. {cat.error}</Notice>}
          {cat.source === "content-fallback" && !cat.error && (
            <p className="note-line">Showing published website content. Database records will replace this list after you run the seed against Supabase.</p>
          )}
          {shown.length ? (
            <div className="grid-3">{shown.map((p) => <ProgrammeCard key={p.id} p={p} />)}</div>
          ) : (
            !cat.loading && <div className="empty card shadow"><p>{K.empty}</p></div>
          )}
          {shown.length < list.length && (
            <div className="center"><button className="outline-btn auto" onClick={() => setPage(page + 1)}>Load more</button></div>
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
