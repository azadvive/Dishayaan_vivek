import React, { useState, useEffect } from "react"
import { Link } from "../../router"
import { FaArrowRight } from "react-icons/fa"
import { DOMAINS, DOMAIN_GROUPS, programmeFor } from "../../data/domains"

const CX = 450, CY = 420, R1 = 175, R2 = 318
const TICK = 2600

// "Explore it first" orbit: skills on the inner ring, exam pathways on the outer ring.
// Both rings slowly orbit in opposite directions; nodes stay upright. Auto-cycles through
// every domain; hover / focus / tap takes control and pauses the motion.
export default function NetworkMap() {
  const [active, setActive] = useState(0)
  const [hold, setHold] = useState(false)

  const skills = DOMAINS.filter((d) => d.group === "skill")
  const exams = DOMAINS.filter((d) => d.group === "exam")
  const place = (list, r, off) => list.map((d, k) => {
    const a = (k / list.length) * Math.PI * 2 - Math.PI / 2 + off
    return { ...d, x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r }
  })
  const inner = place(skills, R1, 0)
  const outer = place(exams, R2, Math.PI / 8)
  const pos = [...inner, ...outer]

  useEffect(() => {
    if (hold) return undefined
    const id = setInterval(() => setActive((x) => (x + 1) % pos.length), TICK)
    return () => clearInterval(id)
  }, [hold, pos.length])

  const cur = pos[active]
  const prog = programmeFor(cur)
  const link = prog ? `/program/${prog.slug}` : "/catalog"

  const node = (n, k) => {
    const on = k === active, rad = on ? 40 : 32
    return (
      <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
        <g className="cg" tabIndex="0" role="button" aria-label={n.full}
          onMouseEnter={() => setActive(k)} onFocus={() => setActive(k)} onClick={() => setActive(k)}>
          {on && <circle r={rad + 14} fill={n.color} opacity=".45" filter="url(#glow)" />}
          {on && <circle className="halo" r={rad + 6} fill="none" stroke={n.color} strokeWidth="2.5" />}
          <circle r={rad} fill={on ? n.color : "#0f2547"} stroke={n.color} strokeWidth="3.5" className="ncirc" />
          <n.Icon x={-(on ? 17 : 13)} y={-(on ? 17 : 13)} size={on ? 34 : 26} color={on ? "#fff" : n.color} />
          <text className="olabel" y={rad + 22} textAnchor="middle" fontSize={on ? 19 : 16} fontWeight={on ? 800 : 600} fill={on ? "#fff" : "#c9d8ef"}>{n.label}</text>
        </g>
      </g>
    )
  }

  return (
    <div className={`orbit ${hold ? "paused" : ""}`} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="orbit-map">
        <svg viewBox="0 0 900 840" role="img" aria-label="Domains around DishaYaaN: skills and exam pathways">
          <defs>
            <radialGradient id="hubg"><stop offset="0" stopColor="#2dd4bf" /><stop offset="1" stopColor="#0f766e" /></radialGradient>
            <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9" /></filter>
          </defs>
          <circle cx={CX} cy={CY} r={R1} fill="none" stroke="#7dd3fc" strokeOpacity=".3" strokeDasharray="3 9" />
          <circle cx={CX} cy={CY} r={R2} fill="none" stroke="#7dd3fc" strokeOpacity=".24" strokeDasharray="3 11" />

          <g className="rg r1">
            {inner.map((n, k) => <line key={"a" + k} x1={CX} y1={CY} x2={n.x} y2={n.y} stroke={n.color} strokeOpacity={k === active ? 0.95 : 0.14} strokeWidth={k === active ? 3.5 : 1.2} className={k === active ? "flow" : ""} />)}
            {inner.map((n, k) => node(n, k))}
          </g>
          <g className="rg r2">
            {outer.map((n, k) => <line key={"b" + k} x1={CX} y1={CY} x2={n.x} y2={n.y} stroke={n.color} strokeOpacity={k + 8 === active ? 0.95 : 0.1} strokeWidth={k + 8 === active ? 3.5 : 1} className={k + 8 === active ? "flow" : ""} />)}
            {outer.map((n, k) => node(n, k + 8))}
          </g>

          <circle cx={CX} cy={CY} r="86" fill={cur.color} opacity=".35" filter="url(#glow)" className="hub-pulse" />
          <circle cx={CX} cy={CY} r="62" fill="url(#hubg)" />
          <text x={CX} y={CY - 2} textAnchor="middle" fill="#fff" fontWeight="800" fontSize="22">Disha</text>
          <text x={CX} y={CY + 22} textAnchor="middle" fill="#fff" fontWeight="800" fontSize="22">YaaN</text>
        </svg>
        <div className="orbit-legend"><span><i className="lg a" /> Skill domains</span><span><i className="lg b" /> Exam pathways</span></div>
      </div>

      <div className="orbit-panel" style={{ "--c": cur.color }}>
        <div key={cur.id} className="orbit-card">
          <span className="orbit-badge"><cur.Icon /> {DOMAIN_GROUPS[cur.group]}</span>
          <h3>{cur.full}</h3>
          <p>{cur.blurb}</p>
          <div className="orbit-chips">{cur.subs.map((s) => <span key={s}>{s}</span>)}</div>
          <Link to={link} className="orbit-go">See the programme <FaArrowRight /></Link>
        </div>
        <div className="orbit-timer"><i key={active + (hold ? "h" : "")} style={{ animationDuration: TICK + "ms", animationPlayState: hold ? "paused" : "running" }} /></div>
        <div className="orbit-pick" role="tablist">
          {pos.map((n, k) => (
            <button key={n.id} role="tab" aria-selected={k === active} className={k === active ? "on" : ""} style={{ "--c": n.color }} onClick={() => setActive(k)}>{n.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
