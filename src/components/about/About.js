import React from "react"
import { Link } from "../../router"
import Journey from "./Journey"
import PageHero from "../common/PageHero"
import Heading from "../common/Heading"
import { useUI } from "../../ui"
import { C, P } from "../../content"
import { useSeo } from "../../forms"
import { FaCheckCircle } from "react-icons/fa"

export default function About() {
  const A = P.about_page
  const { openMentor } = useUI()
  useSeo(A.seo.title, A.seo.description)
  const marquee = [...C.tracks.map((t) => t.short), "Mentorship", "Projects", "Parent visibility"]
  return (
    <>
      <PageHero eyebrow={A.hero.eyebrow} crumb="About" title={A.hero.title} lead={A.hero.lead} />
      <div className="marquee"><div className="marquee-track">{[...marquee, ...marquee, ...marquee].map((m, i) => <span key={i}>{m}</span>)}</div></div>
      <section className="padding">
        <div className="container parents-grid">
          <div className="card shadow pad">
            <h3 className="eyebrow">{A.hero.gap_label}</h3>
            <ul className="ticks big">{A.hero.gap_list.map((g) => <li key={g}><FaCheckCircle /> {g}</li>)}</ul>
            <p><b>{A.hero.gap_closing}</b></p>
          </div>
          <div>
            <h3 className="eyebrow">{A.problem.label}</h3>
            {A.problem.paragraphs.map((p) => <p key={p}>{p}</p>)}
            <p><b>{A.problem.emphasis}</b></p>
          </div>
        </div>
      </section>
      <section className="padding vision">
        <div className="container center narrow">
          <h3 className="eyebrow">{A.vision.label}</h3>
          <h1>{A.vision.title}</h1>
          <p>{A.vision.body}</p>
        </div>
      </section>
      <section className="padding">
        <div className="container">
          <Heading subtitle={A.approach.eyebrow} title={A.approach.title} lead={A.approach.lead} />
          <div className="grid">
            {A.approach.steps.map((s, i) => (
              <div className="card shadow inc" key={s.step}><span className="step-no dark">0{i + 1}</span><h3>{s.step}</h3><p className="small">{s.body}</p></div>
            ))}
          </div>
        </div>
      </section>
      <Journey />
      <section className="padding alt">
        <div className="container">
          <Heading subtitle={A.philosophy.eyebrow} title={A.philosophy.title} lead={A.philosophy.lead} />
          <div className="grid-2">
            {A.philosophy.items.map((i) => <div className="card shadow inc" key={i.title}><h3>{i.title}</h3><p>{i.body}</p></div>)}
          </div>
        </div>
      </section>
      <section className="padding">
        <div className="container">
          <Heading subtitle={A.audiences.eyebrow} title={A.audiences.title} />
          <div className="grid-3">
            {A.audiences.items.map((i) => <div className="card shadow inc" key={i.title}><h3>{i.title}</h3><p>{i.body}</p></div>)}
          </div>
        </div>
      </section>
      <section className="padding ai-section">
        <div className="container center narrow">
          <h3 className="eyebrow">{A.campus.eyebrow}</h3>
          <h1>{A.campus.title}</h1>
          <p>{A.campus.body}</p>
          <div className="btns center">
            <Link to="/catalog" className="btn-link primary-btn">{A.campus.ctas[0]}</Link>
            <button className="light-btn" onClick={() => openMentor({})}>{A.campus.ctas[1]}</button>
          </div>
        </div>
      </section>
      <section className="padding">
        <div className="container narrow">
          <div className="card shadow pad">
            <span className="pill">{A.founder_story.label}</span>
            <p>{A.founder_story.body}</p>
            <p className="small muted">{A.founder_story.footnote}</p>
          </div>
        </div>
      </section>
    </>
  )
}
