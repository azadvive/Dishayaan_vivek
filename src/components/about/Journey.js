import React from "react"
import Heading from "../common/Heading"
import { useI18n } from "../../i18n"
import { C, P } from "../../content"

export default function Journey() {
  const { t } = useI18n()
  return (
    <section className="padding journey" id="how-it-works">
      <div className="container">
        <Heading subtitle={t("home.journey.eyebrow")} title={t("home.journey.title")} lead={t("home.journey.lead")} light />
        <div className="grid-3">
          {C.journey_steps.map((s, i) => (
            <div className="step" key={s.id}>
              <span className="step-no">{s.id}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {i === C.journey_steps.length - 1 && <span className="pill grow">{P.journey_last_badge}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

