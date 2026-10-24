import React, { useState } from "react"
import { Link, useSearchParams } from "../../router"
import PageHero from "../common/PageHero"
import { Field, Input, Select } from "../common/Field"
import { C, P } from "../../content"
import { useSeo, submitForm, track } from "../../forms"
import { FaCheckCircle } from "react-icons/fa"

export default function Book() {
  const B = P.book_page
  useSeo(B.title, B.lead)
  const qs = useSearchParams()
  const [done, setDone] = useState(null)
  const [role, setRole] = useState(0)
  const roles = [[B.booker_roles[0], B.booker_roles[1]], [B.booker_roles[2]], [B.booker_roles[3]], [B.booker_roles[4]]]
  const domains = [...C.tracks.map((t) => [t.id, t.name]), ...B.domains_extra]
  const submit = async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.target).entries())
    const ref = "DY-" + Math.random().toString(36).slice(2, 8).toUpperCase()
    await submitForm("book-session", { ...data, reference: ref })
    track("book_session_submit", { domain: data.domain })
    setDone(ref)
    window.scrollTo(0, 0)
  }
  if (done)
    return (
      <>
        <PageHero crumb="Book" title={B.after.title} lead={B.after.body} />
        <section className="padding"><div className="container narrow center">
          <div className="card shadow pad">
            <FaCheckCircle className="big-ok" />
            <h2>{done}</h2>
            <p>{B.after.reschedule}</p>
            <div className="btns center">
              <Link to="/plans" className="btn-link primary-btn">{B.after.ctas[1]}</Link>
              <button className="outline-btn auto" onClick={() => setDone(null)}>{B.after.ctas[2]}</button>
            </div>
          </div>
        </div></section>
      </>
    )
  return (
    <>
      <PageHero eyebrow={B.eyebrow} crumb="Book" title={B.title} lead={B.lead}>
        <div className="hero-meta">{B.trust_chips.map((c) => <span className="pill light" key={c}>{c}</span>)}</div>
      </PageHero>
      <section className="padding">
        <div className="container book-grid">
          <form className="card shadow pad form" onSubmit={submit}>
            <p className="small muted">{B.prefill_note}</p>
            <Field label={B.fields[0]}>
              <div className="radios">
                {roles.map(([a, b], i) => (
                  <label key={a} className={role === i ? "on" : ""}>
                    <input type="radio" name="role" value={a} checked={role === i} onChange={() => setRole(i)} />
                    <b>{a}</b>{b && <small>{b}</small>}
                  </label>
                ))}
              </div>
            </Field>
            <div className="form-row">
              <Field label={B.fields[1]}><Input name="name" required /></Field>
              <Field label={B.fields[2].split(" — ")[0]} hint={B.fields[2].split(" — ")[1]}><Input name="whatsapp" type="tel" required /></Field>
            </div>
            <Field label={B.fields[3]}><Input name="email" type="email" /></Field>
            <div className="form-row">
              <Field label={B.fields[4]}><Select name="domain" defaultValue={qs.get("domain") || ""} options={domains} placeholder="—" /></Field>
              <Field label="Mode"><Select name="mode" options={B.modes} /></Field>
            </div>
            <Field label={B.fields[5].split(" — ")[0]} hint={B.fields[5].split(" — ")[1]}>
              <Select name="mentor_seat" options={C.mentor_seats.map((m) => [m.slug, m.role])} placeholder="—" />
            </Field>
            <Field label={B.fields[6].split(" Example: ")[0]} hint={"Example: " + B.fields[6].split(" Example: ")[1]}><textarea name="context" rows="4" /></Field>
            <Field label={B.fields[7].split(" Slots")[0]} hint={"Slots" + B.fields[7].split(" Slots")[1]}>
              <div className="form-row">
                <Input name="date" type="date" />
                <Select name="slot" options={B.slots} />
              </div>
            </Field>
            <button className="primary-btn full">{B.submit}</button>
          </form>
          <aside>
            <div className="card shadow pad">
              <h3>{B.what_next.title}</h3>
              <ol className="steps-ol">{B.what_next.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              <div className="chips">{B.what_next.chips.map((c) => <span key={c}>{c}</span>)}</div>
            </div>
            <div className="card shadow pad">
              <h3>{B.not_ready.title}</h3><p>{B.not_ready.body}</p>
              <div className="btns col">
                <Link to="/mentors" className="btn-link outline-btn auto">{B.not_ready.ctas[0]}</Link>
                <Link to="/pathfinder" className="btn-link outline-btn auto">{B.not_ready.ctas[1]}</Link>
                <Link to="/plans" className="btn-link outline-btn auto">{B.not_ready.ctas[2]}</Link>
              </div>
            </div>
            <div className="card shadow pad">
              <h3>{B.institutions.title}</h3><p>{B.institutions.body}</p>
              <Link to="/partners" className="btn-link primary-btn">{B.institutions.cta}</Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
