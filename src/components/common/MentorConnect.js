import React, { useEffect, useState } from "react"
import Modal from "./Modal"
import { Field, Input, Select } from "./Field"
import { useUI } from "../../ui"
import { useI18n } from "../../i18n"
import { C, P } from "../../content"
import { submitForm, track } from "../../forms"

export default function MentorConnect() {
  const { mentor, openMentor, closeMentor } = useUI()
  const { t } = useI18n()
  const M = P.mentor_connect_modal
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  // auto prompt once per session after 120 s
  useEffect(() => {
    let shown = false
    try { shown = sessionStorage.getItem("dy_auto_mentor") } catch (e) {}
    if (shown) return
    const id = setTimeout(() => {
      try { sessionStorage.setItem("dy_auto_mentor", "1") } catch (e) {}
      openMentor({ auto: true })
    }, M.auto_prompt_after_seconds * 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line
  }, [])

  useEffect(() => { if (!mentor) setSent(false) }, [mentor])
  if (!mentor) return null

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.target)
    await submitForm("mentor-connect", Object.fromEntries(fd.entries()))
    track("mentor_connect_submit", { domain: fd.get("domain") })
    setBusy(false)
    setSent(true)
  }

  if (sent)
    return (
      <Modal onClose={closeMentor} title={M.sent_title} subtitle={M.sent_subtitle}>
        <button className="primary-btn" onClick={closeMentor}>OK</button>
      </Modal>
    )
  return (
    <Modal onClose={closeMentor} title={mentor.auto ? M.auto_title : M.title} subtitle={M.subtitle}>
      <form onSubmit={onSubmit} className="form">
        <Field label={M.fields[0]}><Input name="name" required /></Field>
        <Field label={M.fields[1]}><Input name="whatsapp" type="tel" required inputMode="tel" /></Field>
        <div className="form-row">
          <Field label={M.fields[2]}><Select name="class" options={C.class_options} placeholder="—" /></Field>
          <Field label={M.fields[3]}>
            <Select name="domain" defaultValue={mentor.domain || ""} placeholder="—" options={C.tracks.map((x) => [x.id, x.name])} />
          </Field>
        </div>
        <div className="form-row">
          <Field label={M.fields[4]}><Select name="language" options={C.languages.map((l) => l.name)} /></Field>
          <Field label={M.fields[5]}><Select name="availability" options={P.mentors_page.availability_filters} placeholder="—" /></Field>
        </div>
        <Field label={M.fields[6]}><textarea name="context" rows="3" /></Field>
        <button className="primary-btn full" disabled={busy}>{t("nav.connectMentor")} →</button>
      </form>
    </Modal>
  )
}
