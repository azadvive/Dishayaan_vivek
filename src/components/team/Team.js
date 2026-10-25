import React, { useState } from "react"
import PageHero from "../common/PageHero"
import { MentorCard } from "../cards"
import { useUI } from "../../ui"
import { C, P } from "../../content"
import { useSeo } from "../../forms"
import { useCatalog } from "../../lib/catalog"
import { Notice } from "../common/Notice"
import { FaSearch } from "react-icons/fa"

export default function Team() {
  const { openMentor } = useUI()
  const cat = useCatalog()
  const M = P.mentors_page
  useSeo(M.title, M.lead)
  const [q, setQ] = useState("")
  const [av, setAv] = useState("")
  const [lang, setLang] = useState("")
  const [domain, setDomain] = useState("")
  const domains = Array.from(new Set(cat.mentors.map((m) => m.domain).filter(Boolean)))
  const langs = Array.from(new Set(cat.mentors.flatMap((m) => m.languages || [])))
  const list = cat.mentors.filter((m) => {
    const hay = [m.role, m.bio, ...(m.expertise || []), ...(m.helpsWith || [])].join(" ").toLowerCase()
    const okAv = !av || (m.availability || "").toLowerCase().includes(av.toLowerCase())
    const okLang = !lang || (m.languages || []).includes(lang)
    const okDom = !domain || m.domain === domain
    return hay.includes(q.toLowerCase()) && okAv && okLang && okDom
  })
  return (
    <>
      <PageHero crumb="Mentors" title={M.title} lead={M.lead} />
      <section className="padding">
        <div className="container">
          <div className="filters">
            <label className="search"><FaSearch /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={M.search_placeholder} aria-label={M.search_placeholder} /></label>
            <select value={av} onChange={(e) => setAv(e.target.value)} className="sel" aria-label="Availability">
              <option value="">Availability</option>
              {M.availability_filters.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} className="sel" aria-label="Domain">
              <option value="">Domain</option>
              {domains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="sel" aria-label="Language">
              <option value="">Language</option>
              {langs.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          {cat.loading && <p className="muted">Loading mentors…</p>}
          {cat.error && <Notice kind="error">{cat.error}</Notice>}
          {cat.source === "content-fallback" && !cat.error && (
            <p className="note-line">Showing published website mentor seats. Live directory records replace this after seeding Supabase.</p>
          )}
          {list.length ? (
            <div className="grid-4">{list.map((m) => <MentorCard key={m.id} m={m} />)}</div>
          ) : (
            <div className="empty card shadow">
              <h3>{M.empty.title}</h3><p>{M.empty.body}</p>
              <button className="primary-btn" onClick={() => openMentor({})}>{M.empty.cta}</button>
            </div>
          )}
          <p className="note-line">{P.mentors_section_notes.disclaimer}</p>
          <div className="card apply shadow">
            <div><h2>{M.apply.title}</h2><p>{M.apply.body}</p></div>
            <div className="btns">
              <button className="primary-btn" onClick={() => openMentor({})}>{M.apply.ctas[0]}</button>
              <button className="outline-btn auto" onClick={() => openMentor({})}>{M.apply.ctas[1]}</button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
