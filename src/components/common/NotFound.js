import React from "react"
import { Link } from "../../router"
import Heading from "./Heading"
import { P } from "../../content"
import { useSeo } from "../../forms"
export default function NotFound() {
  useSeo(P.not_found.title)
  return (
    <section className="padding"><div className="container center">
      <Heading title={P.not_found.title} lead={P.not_found.body} />
      <Link to="/catalog" className="btn-link primary-btn">{P.not_found.cta}</Link>
    </div></section>
  )
}
