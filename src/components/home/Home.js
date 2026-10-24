import React, { useState } from "react"
import { Link } from "../../router"
import Heading from "../common/Heading"
import Faq from "../common/Faq"
import { Field, Input, Select } from "../common/Field"
import NetworkMap from "./NetworkMap"
import HeroSlides from "./HeroSlides"
import { MentorCard } from "../cards"
import { useI18n } from "../../i18n"
import { useUI } from "../../ui"
import { C, P, accentOf, instIcons } from "../../content"
import { useSeo, submitForm, track } from "../../forms"
import { FaUserGraduate, FaUsers, FaChalkboardTeacher, FaQuoteLeft, FaCheckCircle, FaArrowRight } from "react-icons/fa"

function Hero() {
  const { t } = useI18n()
  return (
    <>
      <HeroSlides>
        <h2>{t("hero.eyebrow")}</h2>
        <h1>
          {t("hero.titleTop")} <span className="hl">{t("hero.titleHighlight")}</span> {t("hero.titleBottom")}
        </h1>
        <p className="cine-lead">{t("hero.lead")}</p>
        <div className="hero-btns">
          <Link to="/pathfinder" className="btn-link primary-btn" onClick={() => track("hero_cta_click", { cta: "discover" })}>{t("hero.ctaDiscover")}</Link>
          <Link to="/mentors" className="btn-link light-btn" onClick={() => track("hero_cta_click", { cta: "mentors" })}>{t("hero.ctaMentors")}</Link>
        </div>
        <div className="trust">
          <span><FaUserGraduate /> {t("hero.trustStudents")}</span>
          <span><FaUsers /> {t("hero.trustParents")}</span>
          <span><FaChalkboardTeacher /> {t("hero.trustMentors")}</span>
        </div>
      </HeroSlides>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...P.marquee_items, ...P.marquee_items, ...P.marquee_items].map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>
    </>
  )
}

function Audience() {
  const { t } = useI18n()
  const { openMentor } = useUI()
  const A = P.home_audience
  const cards = [
    [A.student, FaUserGraduate, "/pathfinder", "/catalog"],
    [A.parent, FaUsers, "/about", "/plans"],
  ]
  return (
    <section className="aud-band">
      <div className="container">
        <h2 className="aud-title"><small>{t("home.audience.eyebrow")}</small>{t("home.audience.title")}</h2>
        <div className="aud-row">
          {cards.map(([c, Icon, to1, to2]) => (
            <div className="aud-mini shadow" key={c.title}>
              <span className="aud-icon"><Icon /></span>
              <div className="aud-txt">
                <h3>{c.title} <span className="pill">{c.badge}</span></h3>
                <p>{c.body}</p>
                <div className="aud-links">
                  <Link to={to1} className="aud-main">{c.cta_primary} <FaArrowRight /></Link>
                  <Link to={to2}>{c.cta_secondary}</Link>
                  <button className="link-btn" onClick={() => openMentor({})}>{c.mentor_link}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Explore() {
  const { t } = useI18n()
  return (
    <section className="explore">
      <div className="container">
        <Heading light subtitle={t("home.tracks.eyebrow")} title={`${t("home.tracks.title1")} ${t("home.tracks.title2")}`} lead={t("home.tracks.lead")} />
        <NetworkMap />
        <div className="center">
          <Link to="/catalog" className="btn-link primary-btn">{P.catalogue_notes.open_full} <FaArrowRight /></Link>
        </div>
      </div>
    </section>
  )
}

function Mentors() {
  const { t } = useI18n()
  return (
    <section className="padding">
      <div className="container">
        <Heading subtitle={t("home.mentors.eyebrow")} title={t("home.mentors.title")} lead={t("home.mentors.lead")} />
        <div className="grid-4">
          {C.mentor_seats.slice(0, 4).map((m) => <MentorCard key={m.id} m={m} />)}
        </div>
        <p className="note-line">{P.mentors_section_notes.disclaimer}</p>
        <div className="center">
          <Link to="/mentors" className="btn-link primary-btn">{P.mentors_section_notes.see_all}</Link>
        </div>
      </div>
    </section>
  )
}

function Partners() {
  const { t } = useI18n()
  return (
    <section className="padding">
      <div className="container">
        <Heading subtitle={t("home.partners.eyebrow")} title={t("home.partners.title")} lead={t("home.partners.lead")} />
        <div className="grid-4">
          {C.institution_types.map((i) => {
            const Icon = instIcons[i.icon]
            return (
              <div className="card inst shadow" key={i.id} style={{ "--accent": accentOf(i.accent) }}>
                <span className="aud-icon">{Icon && <Icon />}</span>
                <h3>{i.name}</h3>
                <p className="tagline">{i.line}</p>
                <p className="small">{i.detail}</p>
              </div>
            )
          })}
        </div>
        <div className="center"><Link to="/partners" className="btn-link primary-btn">{P.partners_section.requirement_card.ctas[0]}</Link></div>
      </div>
    </section>
  )
}

function ProofFaq() {
  const { t } = useI18n()
  const stats = [
    [C.tracks.length, "Exploration tracks"],
    [C.programmes.length, "Programmes"],
    [C.mentor_seats.length, "Mentor seats"],
    [C.languages.length, "Languages"],
  ]
  return (
    <section className="padding alt proof">
      <div className="container">
        <Heading subtitle={`${t("home.voices.eyebrow")} · ${t("home.faq.eyebrow")}`} title={`${t("home.faq.eyebrow")}. ${t("home.faq.title")}`} lead={t("home.faq.lead")} />
        <div className="proof-grid">
          <div className="proof-left">
            <div className="proof-stats">
              {stats.map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}
            </div>
            <p className="proof-note">{t("home.voices.title")} {t("home.voices.lead")}</p>
            {C.voices_placeholders.map((v) => (
              <div className="voice-mini" key={v.author}>
                <FaQuoteLeft />
                <div><p>{v.quote}</p><small><b>{v.author}</b> · {v.context}</small></div>
              </div>
            ))}
          </div>
          <Faq items={C.faq.slice(0, 6)} />
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  const { t } = useI18n()
  const { openMentor, openAI } = useUI()
  const [sent, setSent] = useState(false)
  const D = P.demand_section
  const M = P.mentor_connect_modal
  const onSubmit = async (e) => {
    e.preventDefault()
    await submitForm("home-demand", Object.fromEntries(new FormData(e.target).entries()))
    setSent(true)
  }
  return (
    <section className="padding">
      <div className="container">
        <div className="final shadow">
          <div>
            <h3 className="eyebrow">{t("home.final.eyebrow")}</h3>
            <h1>{t("home.final.title")}</h1>
            <p>{t("home.final.lead")}</p>
            <div className="btns">
              <button className="primary-btn" onClick={() => openMentor({})}>{t("home.final.connect")}</button>
              <Link to="/plans" className="btn-link outline-btn auto">{t("home.final.compare")}</Link>
              <Link to="/pathfinder" className="btn-link outline-btn auto">{t("home.final.pathfinder")}</Link>
            </div>
            <h4>{t("home.final.aside")}</h4>
            <ol className="steps-ol">
              {[1, 2, 3, 4].map((n) => <li key={n}>{t("home.final.step" + n)}</li>)}
            </ol>
          </div>
          <div className="demand">
            <h3 className="eyebrow">{t("home.demand.eyebrow")}</h3>
            <h2>{t("home.demand.title")}</h2>
            <p className="small">{t("home.demand.lead")}</p>
            {sent ? (
              <div className="sent"><FaCheckCircle /> <b>{M.sent_title}</b><p>{M.sent_subtitle}</p></div>
            ) : (
              <form className="form" onSubmit={onSubmit}>
                <Field label={M.fields[0]}><Input name="name" required /></Field>
                <Field label={M.fields[1]}><Input name="whatsapp" type="tel" required /></Field>
                <div className="form-row">
                  <Field label={M.fields[2]}><Select name="class" options={C.class_options} placeholder="—" /></Field>
                  <Field label={M.fields[3]}><Select name="domain" options={C.tracks.map((x) => [x.id, x.name])} placeholder="—" /></Field>
                </div>
                <Field label={M.fields[6]}><textarea name="context" rows="3" /></Field>
                <button className="primary-btn full">{t("home.demand.eyebrow")} →</button>
                <button type="button" className="link-btn" onClick={openAI}>{D.ai_button}</button>
              </form>
            )}
            <p className="small muted privacy"><b>{D.privacy.label}.</b> {D.privacy.text}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  useSeo(P.seo_home.title, P.seo_home.description)
  return (
    <>
      <Hero />
      <Audience />
      <Explore />
      <Mentors />
      <Partners />
      <ProofFaq />
      <FinalCta />
    </>
  )
}
