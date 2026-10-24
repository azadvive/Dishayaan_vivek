import React, { useEffect, useState, useCallback } from "react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { DOMAINS } from "../../data/domains"

const INTERVAL = 2000 // ms per slide

// Full-bleed photo slideshow, changes every 2 seconds. Only domains that have a photo in
// public/images/hero/<id>.jpg are shown, so adding a photo adds a slide automatically.
export default function HeroSlides({ children }) {
  const [found, setFound] = useState({})
  const [i, setI] = useState(0)
  const [hold, setHold] = useState(false)

  useEffect(() => {
    DOMAINS.forEach((d) => {
      const im = new Image()
      im.onload = () => setFound((f) => ({ ...f, [d.id]: true }))
      im.src = `/images/hero/${d.id}.jpg`
    })
  }, [])

  const slides = DOMAINS.filter((d) => found[d.id])
  const n = slides.length
  const go = useCallback((d) => setI((x) => (n ? (x + d + n) % n : 0)), [n])

  useEffect(() => {
    if (hold || n < 2) return undefined
    const id = setInterval(() => setI((x) => (x + 1) % n), INTERVAL)
    return () => clearInterval(id)
  }, [hold, n])

  const cur = slides[n ? i % n : 0]
  return (
    <section className="hero cine" style={{ "--c": cur ? cur.color : "#1eb2a6" }}>
      <div className="cine-stage" aria-hidden="true">
        {slides.map((d, k) => (
          <div key={d.id} className={`cine-slide ${k === i % n ? "on" : ""}`}>
            <img src={`/images/hero/${d.id}.jpg`} alt="" decoding="async" />
          </div>
        ))}
        <div className="cine-shade" />
      </div>

      <div className="container cine-body">
        {cur && <span key={cur.id} className="cine-pill"><cur.Icon /> {cur.full}</span>}
        {children}
        {cur && <p key={"t" + cur.id} className="cine-tag">{cur.tag}</p>}
      </div>

      {n > 1 && (
        <>
          <button className="cine-arrow l" aria-label="Previous" onClick={() => go(-1)} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}><FaChevronLeft /></button>
          <button className="cine-arrow r" aria-label="Next" onClick={() => go(1)} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}><FaChevronRight /></button>
          <div className="cine-dots" role="tablist">
            {slides.map((d, k) => (
              <button key={d.id} role="tab" aria-label={d.full} aria-selected={k === i % n} className={k === i % n ? "on" : ""} onClick={() => setI(k)} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
