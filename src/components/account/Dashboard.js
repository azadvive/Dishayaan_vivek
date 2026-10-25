import React, { useEffect, useState } from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import { Notice } from "../common/Notice"
import { useAuth } from "../../lib/auth"
import { supabase } from "../../lib/supabase"
import { useSeo, store } from "../../forms"
import { P } from "../../content"

export default function Dashboard() {
  const L = P.dashboard_page
  useSeo("My dashboard", L.intro)
  const auth = useAuth()
  const [bookings, setBookings] = useState([])
  const [orders, setOrders] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [path, setPath] = useState(store.get("dy_pathfinder", null))
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!auth.user || !supabase) return
    let alive = true
    const load = async () => {
      const [b, o, e, pf] = await Promise.all([
        supabase.from("bookings").select("reference,status,domain,requested_date,slot,created_at").order("created_at", { ascending: false }),
        supabase.from("orders").select("receipt,status,amount_inr,created_at").order("created_at", { ascending: false }),
        supabase.from("enrollments").select("id,status,payment_status,enrolled_at").order("enrolled_at", { ascending: false }),
        supabase.from("pathfinder_results").select("class_level,axes,top_tracks,created_at").order("created_at", { ascending: false }).limit(1),
      ])
      if (!alive) return
      const firstErr = b.error || o.error || e.error
      if (firstErr) setErr(firstErr.message)
      setBookings(b.data || [])
      setOrders(o.data || [])
      setEnrollments(e.data || [])
      if (pf.data && pf.data[0]) {
        const r = pf.data[0]
        setPath({ cls: r.class_level, axes: r.axes, top: r.top_tracks, saved: true })
      }
    }
    load()
    return () => { alive = false }
  }, [auth.user])

  if (!auth.configured) {
    return (
      <section className="padding"><div className="container narrow">
        <Notice>Sign-in is not configured. You can still use Path Finder locally.</Notice>
        <Link to="/pathfinder" className="btn-link primary-btn">Path Finder</Link>
      </div></section>
    )
  }
  if (auth.loading) return <section className="padding"><div className="container">Loading…</div></section>
  if (!auth.user) {
    return (
      <>
        <PageHero crumb="Dashboard" title="My dashboard" lead="Sign in to see bookings, Path Finder saves and enrolments." />
        <section className="padding"><div className="container narrow">
          <Link to="/account" className="btn-link primary-btn">Sign in</Link>
        </div></section>
      </>
    )
  }

  return (
    <>
      <PageHero crumb="Dashboard" title={auth.profile && auth.profile.full_name ? auth.profile.full_name : "My dashboard"} lead={L.intro} />
      <section className="padding">
        <div className="container dash-grid">
          <Notice kind="error">{err}</Notice>
          <div className="card shadow pad">
            <h3>Path Finder</h3>
            {path ? (
              <p>Top areas: {(path.top || []).join(", ")} {path.saved ? "(saved to your account)" : "(saved only in this browser until you re-run while signed in)"}.</p>
            ) : (
              <p>{L.blocks[2]}</p>
            )}
            <Link to="/pathfinder" className="btn-link outline-btn auto">Open Path Finder</Link>
          </div>
          <div className="card shadow pad">
            <h3>Booking requests</h3>
            {!bookings.length && <p className="muted">No booking requests yet. Requested slots stay pending until confirmed.</p>}
            <ul className="plain">{bookings.map((b) => (
              <li key={b.reference}><b>{b.reference}</b> · {b.status} · {b.domain || "—"} · {b.requested_date || "date TBC"}</li>
            ))}</ul>
            <Link to="/book" className="btn-link outline-btn auto">Book a session</Link>
          </div>
          <div className="card shadow pad">
            <h3>Enrolments & orders</h3>
            {!orders.length && !enrollments.length && <p className="muted">No enrolment records yet.</p>}
            <ul className="plain">
              {orders.map((o) => <li key={o.receipt}>{o.receipt} · {o.status} · ₹{o.amount_inr}</li>)}
              {enrollments.map((e) => <li key={e.id}>{e.status} · payment {e.payment_status}</li>)}
            </ul>
            <Link to="/plans" className="btn-link outline-btn auto">View plans</Link>
          </div>
          <div className="card shadow pad">
            <h3>Community</h3>
            <p>{L.blocks[0]}</p>
            <Link to="/community" className="btn-link outline-btn auto">Open community</Link>
            <Link to="/account" className="btn-link outline-btn auto">Edit profile</Link>
          </div>
        </div>
      </section>
    </>
  )
}
