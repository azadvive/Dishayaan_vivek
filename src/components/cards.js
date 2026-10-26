import React from "react"
import { Link } from "../router"
import { useI18n } from "../i18n"
import { useUI } from "../ui"
import { P, accentOf, trackIcons, trackById, fmtINR, fill, kindLabel } from "../content"
import { FaClock, FaCalendarAlt, FaLaptop, FaArrowRight, FaCheckCircle, FaGraduationCap, FaBriefcase } from "react-icons/fa"
import MentorVideo from "./common/MentorVideo"
import { extraFor } from "../data/mentorExtras"

export function Cover({ accent, Icon, children, h = 160 }) {
  const c = accentOf(accent)
  return (
    <div className="cover" style={{ height: h, background: `linear-gradient(135deg, ${c}, ${c}99 60%, #0b3b4a)` }}>
      <svg className="cover-pattern" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="#fff" strokeOpacity=".22" fill="none">
          <path d="M0 80 L40 55 L80 70 L120 30 L160 50 L200 15" />
          <circle cx="40" cy="55" r="3" fill="#fff" />
          <circle cx="80" cy="70" r="3" fill="#fff" />
          <circle cx="120" cy="30" r="3" fill="#fff" />
          <circle cx="160" cy="50" r="3" fill="#fff" />
        </g>
      </svg>
      {Icon && <Icon className="cover-icon" />}
      {children}
    </div>
  )
}

export function ProgrammeCard({ p }) {
  const track = p.trackId ? trackById(p.trackId) : null
  const Icon = track ? trackIcons[track.icon] : null
  return (
    <div className="card programme shadow">
      <Cover accent={p.accent} Icon={Icon || FaCheckCircle}>
        <span className="badge">{p.examCode || (track && track.short) || kindLabel[p.kind].split("· ")[1]}</span>
      </Cover>
      <div className="card-body">
        <div className="meta small">{p.classRange}</div>
        <h3>
          <Link to={`/program/${p.slug}`}>{p.title}</Link>
        </h3>
        <p className="clamp">{p.summary}</p>
        <div className="meta-row">
          <span><FaClock /> {p.durationWeeks}w</span>
          <span><FaCalendarAlt /> {p.sessionsPerWeek}×/wk</span>
          <span><FaLaptop /> {p.mode}</span>
        </div>
      </div>
      <div className="card-foot">
        <span className="price">{p.priceInr ? fmtINR(p.priceInr) : P.programme_detail_labels.fee_unknown}</span>
        <Link to={`/program/${p.slug}`} className="arrow-link">
          <FaArrowRight />
        </Link>
      </div>
    </div>
  )
}

export function TrackCard({ track }) {
  const { openMentor } = useUI()
  const L = P.track_card_labels
  const Icon = trackIcons[track.icon]
  const c = accentOf(track.accent)
  return (
    <div className="card track shadow" id={track.id} style={{ "--accent": c }}>
      <div className="track-top">
        <span className="track-icon">{Icon && <Icon />}</span>
        <div>
          <h3>{track.name}</h3>
          <div className="small muted">{track.classRange}</div>
        </div>
      </div>
      <p className="tagline">{track.tagline}</p>
      <p className="clamp">{track.summary}</p>
      <h5>{L.skills}</h5>
      <div className="chips">{track.skills.map((s) => <span key={s}>{s}</span>)}</div>
      <h5>{L.projects}</h5>
      <div className="chips">{track.projects.map((s) => <span key={s}>{s}</span>)}</div>
      <h5>{L.pathways}</h5>
      <div className="chips">{track.pathways.map((s) => <span key={s}>{s}</span>)}</div>
      <div className="track-actions">
        <Link to="/catalog" className="outline-btn btn-link">{L.explore}</Link>
        <button className="link-btn" onClick={() => openMentor({ domain: track.id })}>{fill(L.talk, { short: track.short })} →</button>
      </div>
      <p className="small muted foot">{fill(L.footnote, { classRange: track.classRange })}</p>
    </div>
  )
}

export function MentorCard({ m }) {
  const { t } = useI18n()
  const x = extraFor(m.slug)
  const accent = (trackById(m.domain) || {}).accent
  return (
    <div className="card mentor shadow">
      <MentorVideo m={m} url={x.videoUrl} accent={accent} />
      <div className="mentor-body">
        <h3>
          <Link to={`/mentor/${m.slug}`}>{m.role}</Link>
        </h3>
        <div className="small muted">{m.code}</div>
        <div className="mfacts">
          <div><FaGraduationCap /><span>{x.college || "Pending verification"}</span></div>
          <div><FaBriefcase /><span>{x.company || "Pending verification"}</span></div>
        </div>
        <Link to={`/mentor/${m.slug}`} className="outline-btn btn-link">{t("nav.connectMentor")}</Link>
      </div>
    </div>
  )
}

export function PlanCard({ plan, onChoose }) {
  const c = accentOf(plan.accent)
  return (
    <div className={`card plan shadow ${plan.popular ? "popular" : ""}`} style={{ "--accent": c }}>
      {plan.popular && <span className="ribbon">★</span>}
      <h4 className="plan-name">{plan.name}</h4>
      <div className="plan-price">
        {fmtINR(plan.priceInr)}
        <small> / {plan.billingPeriod === "project" ? "one-time" : plan.billingPeriod === "monthly" ? "month" : plan.billingPeriod}</small>
      </div>
      <p className="tagline">{plan.tagline}</p>
      <p className="small muted">{plan.bestFor}</p>
      <ul className="ticks">
        {plan.features.map((f) => (
          <li key={f}><FaCheckCircle /> {f}</li>
        ))}
      </ul>
      <div className="plan-stats small">
        <span>{plan.mentorSessionsPerMonth} sessions</span>
        <span>{plan.aiCreditsPerMonth} AI credits</span>
      </div>
      <button className="primary-btn full" onClick={() => onChoose && onChoose(plan)}>{P.plans_page.checkout.title} →</button>
    </div>
  )
}
