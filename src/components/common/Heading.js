import React from "react"
// Section heading in the Academia template style (teal eyebrow, big title, lead line)
export default function Heading({ subtitle, title, lead, left, light }) {
  return (
    <div id="heading" className={`${left ? "left" : ""} ${light ? "light" : ""}`}>
      {subtitle && <h3>{subtitle}</h3>}
      {title && <h1>{title}</h1>}
      {lead && <p className="lead">{lead}</p>}
    </div>
  )
}
