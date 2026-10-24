import React from "react"
import { Link } from "../../router"
export default function PageHero({ eyebrow, title, lead, crumb, children }) {
  return (
    <section className="page-hero">
      <div className="container">
        {crumb && <div className="crumb"><Link to="/">DishaYaaN</Link> / <span>{crumb}</span></div>}
        {eyebrow && <h3>{eyebrow}</h3>}
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
        {children}
      </div>
    </section>
  )
}
