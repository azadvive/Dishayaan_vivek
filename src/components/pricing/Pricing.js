import React, { useState } from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import Heading from "../common/Heading"
import Faq from "../common/Faq"
import Modal from "../common/Modal"
import { Field, Input } from "../common/Field"
import { PlanCard } from "../cards"
import { useUI } from "../../ui"
import { C, P, fmtINR } from "../../content"
import { useSeo, submitForm } from "../../forms"
import { FaLock, FaCheckCircle } from "react-icons/fa"

export default function Pricing() {
  const { openMentor } = useUI()
  const L = P.plans_page
  useSeo(L.hero.title, L.hero.lead)
  const [plan, setPlan] = useState(null)
  const [done, setDone] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    await submitForm("plan-checkout", { plan: plan.name, ...Object.fromEntries(new FormData(e.target).entries()) })
    setDone(true)
  }
  const close = () => { setPlan(null); setDone(false) }
  return (
    <>
      <PageHero crumb="Plans" title={L.hero.title} lead={L.hero.lead} />
      <section className="padding">
        <div className="container">
          <div className="grid-plans">{C.plans.map((p) => <PlanCard key={p.id} plan={p} onChoose={setPlan} />)}</div>
          <div className="card pay-note shadow">
            <FaLock />
            <div>
              <h3>{L.pay_note.title}</h3>
              <p>{L.pay_note.body}</p>
              <button className="link-btn" onClick={() => openMentor({})}>{L.pay_note.link} →</button>
            </div>
          </div>
        </div>
      </section>
      <section className="padding alt">
        <div className="container">
          <Heading title={L.every_plan_includes.title} />
          <div className="grid-3">
            {L.every_plan_includes.items.map((i) => (
              <div className="card shadow inc" key={i.title}><h3>{i.title}</h3><p>{i.body}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="padding">
        <div className="container">
          <div className="card quote shadow">
            <div><h2>{L.institution_quote.title}</h2><p>{L.institution_quote.body}</p><p className="small muted">{L.institution_quote.note}</p></div>
            <Link className="btn-link primary-btn" to="/partners#requirement">{L.institution_quote.cta}</Link>
          </div>
        </div>
      </section>
      <section className="padding alt">
        <div className="container">
          <Heading subtitle={L.billing_faq.eyebrow} title={L.billing_faq.title} lead={L.billing_faq.lead} />
          <Faq items={L.billing_faq.items} />
        </div>
      </section>
      {plan && (
        <Modal onClose={close} title={`${L.checkout.title}: ${plan.name}`} subtitle={fmtINR(plan.priceInr)}>
          {done ? (
            <div className="sent"><FaCheckCircle /><p>{L.checkout.fallback}</p><button className="primary-btn" onClick={close}>OK</button></div>
          ) : (
            <form className="form" onSubmit={submit}>
              <Field label={L.checkout.fields[0]}><Input name="student" required /></Field>
              <Field label={L.checkout.fields[1]}><Input name="whatsapp" type="tel" required /></Field>
              <Field label={L.checkout.fields[2]}><Input name="email" type="email" /></Field>
              <button className="primary-btn full">{L.checkout.title} →</button>
              <p className="small muted">{L.checkout.security}</p>
            </form>
          )}
        </Modal>
      )}
    </>
  )
}
