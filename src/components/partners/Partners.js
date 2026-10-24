import React, { useState } from "react"
import PageHero from "../common/PageHero"
import Heading from "../common/Heading"
import { Field, Input, Select } from "../common/Field"
import { C, P, accentOf, instIcons } from "../../content"
import { useSeo, submitForm } from "../../forms"
import { FaCheckCircle } from "react-icons/fa"

export default function Partners() {
  const L = P.partners_page
  const M = P.mentor_connect_modal
  useSeo(L.hero.title, L.hero.lead)
  const [sent, setSent] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    await submitForm("partner-enquiry", Object.fromEntries(new FormData(e.target).entries()))
    setSent(true)
  }
  const R = L.requirement_form
  return (
    <>
      <PageHero eyebrow={L.hero.eyebrow} crumb="Partners" title={L.hero.title} lead={L.hero.lead} />
      <section className="padding">
        <div className="container">
          <Heading subtitle={L.who.eyebrow} title={L.who.title} />
          <div className="grid-4">
            {C.institution_types.map((i) => {
              const Icon = instIcons[i.icon]
              return (
                <div className="card inst shadow" key={i.id} style={{ "--accent": accentOf(i.accent) }}>
                  <span className="aud-icon">{Icon && <Icon />}</span>
                  <h3>{i.name}</h3><p className="tagline">{i.line}</p><p className="small">{i.detail}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <section className="padding alt">
        <div className="container">
          <Heading subtitle={L.delivery.eyebrow} title={L.delivery.title} />
          <div className="grid-3">
            {L.delivery.models.map((m, i) => (
              <div className="card shadow inc" key={m.title}><span className="step-no dark">0{i + 1}</span><h3>{m.title}</h3><p>{m.body}</p></div>
            ))}
          </div>
          <div className="card quote shadow need"><div><h2>{L.need_from_you.title}</h2><p>{L.need_from_you.body}</p></div></div>
          <div className="card quote shadow need"><div><span className="pill">{P.partners_section.requirement_card.label}</span><h2>{P.partners_section.requirement_card.title}</h2><p>{P.partners_section.requirement_card.body}</p></div></div>
        </div>
      </section>
      <section className="padding" id="requirement">
        <div className="container">
          <Heading subtitle={R.eyebrow} title={R.title} lead={R.lead} />
          <div className="parents-grid">
            <div>
              <h3>{R.ask_heading}</h3>
              <ol className="steps-ol">{R.questions.map((q) => <li key={q}>{q}</li>)}</ol>
              <p className="small muted">{R.ask_hint}</p>
            </div>
            <div className="card shadow pad">
              {sent ? (
                <div className="sent"><FaCheckCircle /><b>{M.sent_title}</b><p>{M.sent_subtitle}</p></div>
              ) : (
                <form className="form" onSubmit={submit}>
                  <Field label={M.fields[0]}><Input name="name" required /></Field>
                  <Field label={M.fields[1]}><Input name="whatsapp" type="tel" required /></Field>
                  <Field label={L.who.title}><Select name="institution" options={C.institution_types.map((i) => i.name)} /></Field>
                  <Field label={M.fields[6]}><textarea name="requirement" rows="6" /></Field>
                  <button className="primary-btn full">{P.partners_section.requirement_card.ctas[0]} →</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
