import React, { useState } from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import { useUI } from "../../ui"
import { C, P, accentOf, trackById, trackIcons } from "../../content"
import { useSeo, store, track } from "../../forms"

// Each option adds weight to profile axes (0 tech, 1 problem, 2 research, 3 making, 4 markets, 5 people)
// and to exploration tracks. Relative strengths only – never a prediction.
const W = [
  null,
  [[{ 1: 2, 3: 2 }, ["physics", "engineering", "robotics"]], [{ 2: 3 }, ["biotechnology", "research"]], [{ 4: 2, 5: 2 }, ["stock-market", "entrepreneurship"]], [{ 0: 3 }, ["ai-ml", "computer-science"]], [{ 5: 2, 2: 1 }, ["research", "entrepreneurship"]]],
  [[{ 3: 3 }, ["robotics", "engineering", "drones"]], [{ 2: 3 }, ["research", "physics", "biotechnology"]], [{ 0: 3 }, ["computer-science", "ai-ml"]], [{ 4: 3 }, ["stock-market", "entrepreneurship"]]],
  [[{ 0: 3 }, ["ai-ml"]], [{ 3: 3 }, ["robotics"]], [{ 3: 2, 1: 1 }, ["drones"]], [{ 0: 2 }, ["computer-science"]], [{}, []]],
  [[{ 1: 3 }, []], [{ 3: 3 }, ["engineering"]], [{ 2: 3 }, ["research"]], [{ 1: 2, 0: 1 }, ["ai-ml"]], [{ 5: 3 }, []]],
  [[{ 2: 3 }, ["biotechnology"]], [{ 2: 1 }, []], [{}, []]],
  [[{ 0: 3 }, ["computer-science", "ai-ml"]], [{ 0: 1 }, []], [{}, []]],
  [[{ 4: 3 }, ["stock-market", "entrepreneurship"]], [{ 4: 1 }, []], [{}, []]],
  [[{ 3: 3 }, ["robotics", "engineering"]], [{ 2: 3 }, ["research", "physics"]], [{ 4: 2, 5: 2 }, ["entrepreneurship", "stock-market"]], [{}, []]],
  [[{ 1: 3 }, ["physics"]], [{ 1: 1 }, []], [{}, []]],
  [[{ 3: 3 }, ["robotics"]], [{ 0: 3 }, ["ai-ml"]], [{ 2: 3 }, ["research", "biotechnology"]], [{ 4: 3 }, ["stock-market", "entrepreneurship"]], [{ 5: 3 }, ["entrepreneurship"]]],
]

export default function PathFinder() {
  const L = P.pathfinder_page
  const { openMentor } = useUI()
  useSeo(L.hero.title, L.hero.lead)
  const [step, setStep] = useState(-1)
  const [ans, setAns] = useState([])
  const [result, setResult] = useState(() => store.get("dy_pathfinder", null))
  const qs = L.questions.map((q, i) => {
    if (i === 0) return { ...q, options: C.class_options }
    if (i >= 5 && i <= 7) return { ...q, options: [...q.options, "Not really"] } // original scale: Very / Somewhat / Not really
    return q
  })

  const pick = (i) => {
    const next = [...ans.slice(0, step), i]
    setAns(next)
    if (step === qs.length - 1) finish(next)
    else setStep(step + 1)
  }
  const finish = (a) => {
    const axes = [0, 0, 0, 0, 0, 0]
    const tr = {}
    a.forEach((opt, qi) => {
      if (qi === 0 || !W[qi]) return
      const [ax, tracks] = W[qi][opt] || [{}, []]
      Object.keys(ax).forEach((k) => (axes[k] += ax[k]))
      tracks.forEach((t) => (tr[t] = (tr[t] || 0) + 1))
    })
    const max = Math.max(...axes, 1)
    const top = Object.entries(tr).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([id]) => id)
    const res = { cls: C.class_options[a[0]], axes: axes.map((v) => Math.round((v / max) * 100)), top: top.length ? top : ["ai-ml", "robotics", "research"].slice(0, 3) }
    store.set("dy_pathfinder", res)
    track("pathfinder_complete", { top: res.top.join(",") })
    setResult(res)
  }
  const reset = () => { setResult(null); setStep(-1); setAns([]); store.set("dy_pathfinder", null) }

  if (result)
    return (
      <>
        <PageHero crumb="Path Finder" title={L.result.title} lead={L.result.subtitle} />
        <section className="padding"><div className="container narrow">
          <div className="card shadow pad">
            <p className="small muted">{L.result.sub}</p>
            {L.profile_axes.map((a, i) => (
              <div className="metric" key={a}>
                <div className="metric-row"><span>{a}</span><b>{result.axes[i]}%</b></div>
                <div className="bar"><i style={{ width: result.axes[i] + "%" }} /></div>
              </div>
            ))}
          </div>
          <div className="card shadow pad">
            <h3>{L.result.areas.title}</h3>
            <p>{L.result.areas.body}</p>
            <div className="grid-3 tight">
              {result.top.map((id) => {
                const t = trackById(id); const Icon = trackIcons[t.icon]
                return (
                  <div className="mini-track" key={id} style={{ "--accent": accentOf(t.accent) }}>
                    <span className="track-icon"><Icon /></span><b>{t.name}</b><small>{t.tagline}</small>
                    <Link to="/catalog">{P.track_card_labels.explore} →</Link>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="card shadow pad">
            <h3>{L.result.second_opinion.title}</h3>
            <p>{L.result.second_opinion.body}</p>
            <button className="primary-btn" onClick={() => openMentor({ domain: result.top[0] })}>{L.result.second_opinion.cta}</button>
            <button className="outline-btn auto" onClick={reset}>{L.start}</button>
          </div>
        </div></section>
      </>
    )

  if (step < 0)
    return (
      <>
        <PageHero crumb="Path Finder" title={L.hero.title} lead={L.hero.lead} />
        <section className="padding"><div className="container narrow">
          <div className="card shadow pad center">
            <h3>{L.disclaimer.title}</h3><p>{L.disclaimer.body}</p>
            <p className="small muted">{L.hint}</p>
            <button className="primary-btn" onClick={() => setStep(0)}>{L.start}</button>
          </div>
        </div></section>
      </>
    )

  const q = qs[step]
  return (
    <>
      <PageHero crumb="Path Finder" title={L.hero.title} />
      <section className="padding"><div className="container narrow">
        <div className="card shadow pad">
          <div className="progress"><i style={{ width: ((step + 1) / qs.length) * 100 + "%" }} /></div>
          <small className="muted">{step + 1} / {qs.length}{step >= qs.length - 3 ? " · " + L.last_few : ""}</small>
          <h2>{q.q}</h2>
          {q.note && <p className="small muted">{q.note}</p>}
          <div className="options">
            {q.options.map((o, i) => (
              <button key={o} className={ans[step] === i ? "on" : ""} onClick={() => pick(i)}>{o}</button>
            ))}
          </div>
          <div className="btns">
            {step > 0 && <button className="outline-btn auto" onClick={() => setStep(step - 1)}>←</button>}
          </div>
          <p className="small muted">{L.hint}</p>
        </div>
      </div></section>
    </>
  )
}
