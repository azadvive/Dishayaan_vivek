import React, { useEffect, useState } from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import { Field, Input } from "../common/Field"
import { Notice, BusyButton } from "../common/Notice"
import { useAuth } from "../../lib/auth"
import { supabase } from "../../lib/supabase"
import { functionPost, getAccessToken } from "../../lib/api"
import { useSeo } from "../../forms"
import { C } from "../../content"

const TABS = ["Overview", "Programmes", "Mentors", "Bookings", "Enquiries", "Users", "Community", "Orders"]

export default function Admin() {
  useSeo("Admin", "DishaYaaN operations console")
  const auth = useAuth()
  const [tab, setTab] = useState("Overview")
  if (auth.loading) return <section className="padding"><div className="container">Loading…</div></section>
  if (!auth.configured) {
    return (
      <section className="padding"><div className="container narrow">
        <Notice>Admin requires Supabase. Configure keys, register, then call the admin-bootstrap function.</Notice>
      </div></section>
    )
  }
  if (!auth.user) {
    return (
      <>
        <PageHero crumb="Admin" title="Operations console" lead="Administrator sign-in required." />
        <section className="padding"><div className="container narrow"><Link to="/account" className="btn-link primary-btn">Sign in</Link></div></section>
      </>
    )
  }
  if (!auth.isAdmin) {
    return (
      <section className="padding"><div className="container narrow">
        <Notice kind="error">This account is not an administrator. Role changes cannot be made from the profile form.</Notice>
      </div></section>
    )
  }
  return (
    <>
      <PageHero crumb="Admin" title="Operations console" lead={typeof C.page_copy.admin_page === "string" ? C.page_copy.admin_page : "Manage programmes, mentors, bookings and community reports."} />
      <section className="padding">
        <div className="container">
          <div className="tabs wrap">
            {TABS.map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
          </div>
          {tab === "Overview" && <Overview />}
          {tab === "Programmes" && <ProgramsAdmin />}
          {tab === "Mentors" && <MentorsAdmin />}
          {tab === "Bookings" && <BookingsAdmin />}
          {tab === "Enquiries" && <EnquiriesAdmin />}
          {tab === "Users" && <UsersAdmin />}
          {tab === "Community" && <CommunityAdmin />}
          {tab === "Orders" && <OrdersAdmin />}
        </div>
      </section>
    </>
  )
}

function Overview() {
  const [stats, setStats] = useState(null)
  const [err, setErr] = useState(null)
  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("programs").select("id", { count: "exact", head: true }),
      supabase.from("mentors").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("enrollments").select("id", { count: "exact", head: true }),
      supabase.from("audit_log").select("action,created_at,entity_type").order("created_at", { ascending: false }).limit(8),
    ]).then((rows) => {
      const fail = rows.find((r) => r.error)
      if (fail) setErr(fail.error.message)
      setStats({
        users: rows[0].count,
        programs: rows[1].count,
        mentors: rows[2].count,
        pendingBookings: rows[3].count,
        newEnquiries: rows[4].count,
        enrollments: rows[5].count,
        activity: rows[6].data || [],
      })
    })
  }, [])
  if (!stats) return <p>Loading overview…</p>
  return (
    <div>
      <Notice kind="error">{err}</Notice>
      <div className="proof-stats admin-stats">
        {[["Users", stats.users], ["Programmes", stats.programs], ["Mentors", stats.mentors], ["Pending bookings", stats.pendingBookings], ["New enquiries", stats.newEnquiries], ["Enrolments", stats.enrollments]].map(([l, n]) => (
          <div key={l}><b>{n ?? "—"}</b><span>{l}</span></div>
        ))}
      </div>
      <div className="card shadow pad">
        <h3>Recent admin actions</h3>
        <ul className="plain">{stats.activity.map((a, i) => <li key={i}>{a.created_at} · {a.action} · {a.entity_type}</li>)}</ul>
      </div>
    </div>
  )
}

function ProgramsAdmin() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [edit, setEdit] = useState(null)
  const load = async () => {
    const { data, error } = await supabase.from("programs").select("*").order("title")
    if (error) setErr(error.message)
    setRows(data || [])
  }
  useEffect(() => { load() }, [])
  const save = async (e) => {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.target).entries())
    const row = {
      slug: d.slug,
      title: d.title,
      summary: d.summary,
      kind: d.kind,
      track_id: d.track_id || null,
      class_range: d.class_range,
      duration_weeks: Number(d.duration_weeks) || null,
      sessions_per_week: Number(d.sessions_per_week) || null,
      mode: d.mode,
      price_inr: d.price_inr ? Number(d.price_inr) : null,
      published: d.published === "on",
      featured: d.featured === "on",
      skills: split(d.skills),
      projects: split(d.projects),
      outcomes: split(d.outcomes),
    }
    const q = edit && edit.id
      ? await supabase.from("programs").update(row).eq("id", edit.id)
      : await supabase.from("programs").insert(row)
    if (q.error) setErr(q.error.message)
    else { setEdit(null); load() }
  }
  return (
    <div className="admin-split">
      <Notice kind="error">{err}</Notice>
      <div>
        {rows.map((r) => (
          <div className="card pad shadow" key={r.id}>
            <b>{r.title}</b> <span className="pill">{r.published ? "published" : "draft"}</span>
            <p className="small muted">{r.slug} · {r.kind}</p>
            <button className="outline-btn auto small" onClick={() => setEdit(r)}>Edit</button>
          </div>
        ))}
      </div>
      <form className="card pad shadow form" onSubmit={save}>
        <h3>{edit ? "Edit programme" : "New programme"}</h3>
        <Field label="Title"><Input name="title" defaultValue={edit && edit.title} required key={edit && edit.id} /></Field>
        <Field label="Slug"><Input name="slug" defaultValue={edit && edit.slug} required /></Field>
        <Field label="Summary"><textarea name="summary" rows="3" defaultValue={edit && edit.summary} /></Field>
        <div className="form-row">
          <Field label="Kind"><Input name="kind" defaultValue={(edit && edit.kind) || "future"} /></Field>
          <Field label="Track id"><Input name="track_id" defaultValue={edit && edit.track_id} /></Field>
        </div>
        <div className="form-row">
          <Field label="Class range"><Input name="class_range" defaultValue={edit && edit.class_range} /></Field>
          <Field label="Mode"><Input name="mode" defaultValue={edit && edit.mode} /></Field>
        </div>
        <div className="form-row">
          <Field label="Weeks"><Input name="duration_weeks" type="number" defaultValue={edit && edit.duration_weeks} /></Field>
          <Field label="Sessions / week"><Input name="sessions_per_week" type="number" defaultValue={edit && edit.sessions_per_week} /></Field>
        </div>
        <Field label="Price INR"><Input name="price_inr" type="number" defaultValue={edit && edit.price_inr} /></Field>
        <Field label="Skills"><Input name="skills" defaultValue={((edit && edit.skills) || []).join(", ")} /></Field>
        <Field label="Projects"><Input name="projects" defaultValue={((edit && edit.projects) || []).join(", ")} /></Field>
        <Field label="Outcomes"><Input name="outcomes" defaultValue={((edit && edit.outcomes) || []).join(", ")} /></Field>
        <label className="field"><input type="checkbox" name="published" defaultChecked={!edit || edit.published} /> Published</label>
        <label className="field"><input type="checkbox" name="featured" defaultChecked={edit && edit.featured} /> Featured</label>
        <BusyButton>Save programme</BusyButton>
        {edit && <button type="button" className="link-btn" onClick={() => setEdit(null)}>New</button>}
      </form>
    </div>
  )
}

function MentorsAdmin() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [edit, setEdit] = useState(null)
  const load = async () => {
    const { data, error } = await supabase.from("mentors").select("*").order("role_title")
    if (error) setErr(error.message)
    setRows(data || [])
  }
  useEffect(() => { load() }, [])
  const save = async (e) => {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.target).entries())
    const row = {
      slug: d.slug,
      code: d.code,
      role_title: d.role_title,
      domain: d.domain,
      bio: d.bio,
      availability: d.availability,
      format: d.format,
      languages: split(d.languages),
      expertise: split(d.expertise),
      helps_with: split(d.helps_with),
      college: d.college || null,
      company: d.company || null,
      video_url: d.video_url || null,
      published: d.published === "on",
      status: d.status || "verifying",
    }
    const q = edit && edit.id ? await supabase.from("mentors").update(row).eq("id", edit.id) : await supabase.from("mentors").insert(row)
    if (q.error) setErr(q.error.message)
    else { setEdit(null); load() }
  }
  return (
    <div className="admin-split">
      <Notice kind="error">{err}</Notice>
      <div>
        {rows.map((r) => (
          <div className="card pad shadow" key={r.id}>
            <b>{r.role_title}</b> <span className="pill">{r.published ? "published" : "hidden"}</span>
            <p className="small muted">{r.slug} · {r.domain}</p>
            <button className="outline-btn auto small" onClick={() => setEdit(r)}>Edit</button>
          </div>
        ))}
      </div>
      <form className="card pad shadow form" onSubmit={save}>
        <h3>{edit ? "Edit mentor seat" : "New mentor seat"}</h3>
        <Field label="Role title"><Input name="role_title" defaultValue={edit && edit.role_title} required key={edit && edit.id} /></Field>
        <Field label="Slug"><Input name="slug" defaultValue={edit && edit.slug} required /></Field>
        <Field label="Code"><Input name="code" defaultValue={edit && edit.code} /></Field>
        <Field label="Domain"><Input name="domain" defaultValue={edit && edit.domain} /></Field>
        <Field label="Bio"><textarea name="bio" rows="3" defaultValue={edit && edit.bio} /></Field>
        <Field label="Availability"><Input name="availability" defaultValue={edit && edit.availability} /></Field>
        <Field label="Format"><Input name="format" defaultValue={edit && edit.format} /></Field>
        <Field label="Languages"><Input name="languages" defaultValue={((edit && edit.languages) || []).join(", ")} /></Field>
        <Field label="Expertise"><Input name="expertise" defaultValue={((edit && edit.expertise) || []).join(", ")} /></Field>
        <Field label="Helps with"><Input name="helps_with" defaultValue={((edit && edit.helps_with) || []).join(", ")} /></Field>
        <Field label="College (verified only)"><Input name="college" defaultValue={edit && edit.college} /></Field>
        <Field label="Company (verified only)"><Input name="company" defaultValue={edit && edit.company} /></Field>
        <Field label="Intro video URL"><Input name="video_url" defaultValue={edit && edit.video_url} /></Field>
        <Field label="Status"><Input name="status" defaultValue={(edit && edit.status) || "verifying"} /></Field>
        <label className="field"><input type="checkbox" name="published" defaultChecked={!edit || edit.published} /> Published</label>
        <BusyButton>Save mentor</BusyButton>
        {edit && <button type="button" className="link-btn" onClick={() => setEdit(null)}>New</button>}
      </form>
    </div>
  )
}

function BookingsAdmin() {
  const [rows, setRows] = useState([])
  const [mentors, setMentors] = useState([])
  const [err, setErr] = useState(null)
  const load = async () => {
    const b = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100)
    const m = await supabase.from("mentors").select("id, role_title, slug")
    if (b.error) setErr(b.error.message)
    setRows(b.data || [])
    setMentors(m.data || [])
  }
  useEffect(() => { load() }, [])
  const act = async (id, status, notes, assigned_mentor_id) => {
    const token = await getAccessToken()
    const res = await functionPost("admin-action", { action: "booking_status", id, status, notes, assigned_mentor_id }, { token })
    if (!res.ok) setErr(res.data.error || "Update failed")
    else load()
  }
  return (
    <div>
      <Notice kind="error">{err}</Notice>
      <p className="small muted">Requested slots stay pending until you confirm. Confirmation is blocked if the mentor already has a confirmed booking in that slot.</p>
      {rows.map((r) => (
        <div className="card pad shadow" key={r.id}>
          <b>{r.reference}</b> <span className="pill">{r.status}</span>
          <p>{r.name} · {r.whatsapp} · {r.email}</p>
          <p className="small">{r.domain} · {r.session_mode} · {r.requested_date} {r.slot} · mentor {r.mentor_slug || "unassigned"}</p>
          <p className="small muted">{r.context}</p>
          <div className="form-row">
            <select defaultValue={r.mentor_id || ""} id={"m-" + r.id} className="sel">
              <option value="">Assign mentor</option>
              {mentors.map((m) => <option key={m.id} value={m.id}>{m.role_title}</option>)}
            </select>
            <input defaultValue={r.admin_notes || ""} id={"n-" + r.id} placeholder="Internal notes" />
          </div>
          <div className="btns">
            {["confirmed", "rejected", "cancelled", "completed"].map((s) => (
              <button key={s} className="outline-btn auto small" onClick={() => act(r.id, s, document.getElementById("n-" + r.id).value, document.getElementById("m-" + r.id).value || null)}>{s}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EnquiriesAdmin() {
  const [rows, setRows] = useState([])
  const [reqs, setReqs] = useState([])
  const [err, setErr] = useState(null)
  const load = async () => {
    const e = await supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(100)
    const m = await supabase.from("mentor_requests").select("*").order("created_at", { ascending: false }).limit(100)
    if (e.error) setErr(e.error.message)
    setRows(e.data || [])
    setReqs(m.data || [])
  }
  useEffect(() => { load() }, [])
  const act = async (action, id, status, notes) => {
    const token = await getAccessToken()
    const res = await functionPost("admin-action", { action, id, status, notes }, { token })
    if (!res.ok) setErr(res.data.error || "Update failed")
    else load()
  }
  return (
    <div>
      <Notice kind="error">{err}</Notice>
      <h3>Enquiries</h3>
      {rows.map((r) => (
        <div className="card pad shadow" key={r.id}>
          <b>{r.category}</b> <span className="pill">{r.status}</span>
          <p>{r.name} · {r.phone} · {r.organization}</p>
          <p className="small">{r.message}</p>
          <div className="btns">
            {["open", "in_progress", "closed"].map((s) => (
              <button key={s} className="outline-btn auto small" onClick={() => act("enquiry_status", r.id, s)}>{s}</button>
            ))}
          </div>
        </div>
      ))}
      <h3>Mentor connection requests</h3>
      {reqs.map((r) => (
        <div className="card pad shadow" key={r.id}>
          <b>{r.name}</b> <span className="pill">{r.status}</span>
          <p>{r.whatsapp} · {r.domain} · {r.language} · {r.availability}</p>
          <p className="small">{r.context}</p>
          <div className="btns">
            {["assigned", "contacted", "closed", "rejected"].map((s) => (
              <button key={s} className="outline-btn auto small" onClick={() => act("mentor_request_status", r.id, s)}>{s}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function UsersAdmin() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const load = async () => {
    const { data, error } = await supabase.from("profiles").select("id,email,full_name,role,account_status,created_at").order("created_at", { ascending: false }).limit(200)
    if (error) setErr(error.message)
    setRows(data || [])
  }
  useEffect(() => { load() }, [])
  const act = async (action, id, extra) => {
    const token = await getAccessToken()
    const res = await functionPost("admin-action", { action, id, ...extra }, { token })
    if (!res.ok) setErr(res.data.error || "Update failed")
    else load()
  }
  return (
    <div>
      <Notice kind="error">{err}</Notice>
      <p className="small muted">Granting admin uses a server-side role check. Users cannot set this on their own profile.</p>
      {rows.map((r) => (
        <div className="card pad shadow" key={r.id}>
          <b>{r.full_name || r.email}</b> · {r.role} · {r.account_status}
          <p className="small muted">{r.email}</p>
          <div className="btns">
            <button className="outline-btn auto small" onClick={() => act("user_status", r.id, { account_status: r.account_status === "suspended" ? "active" : "suspended" })}>{r.account_status === "suspended" ? "Reactivate" : "Suspend"}</button>
            <button className="outline-btn auto small" onClick={() => act("user_role", r.id, { role: "mentor" })}>Make mentor</button>
            <button className="outline-btn auto small" onClick={() => act("user_role", r.id, { role: "student" })}>Make student</button>
            <button className="outline-btn auto small" onClick={() => act("user_role", r.id, { role: "admin" })}>Make admin</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function CommunityAdmin() {
  const [reports, setReports] = useState([])
  const [err, setErr] = useState(null)
  const load = async () => {
    const { data, error } = await supabase.from("community_reports").select("*").order("created_at", { ascending: false })
    if (error) setErr(error.message)
    setReports(data || [])
  }
  useEffect(() => { load() }, [])
  const act = async (report, moderation) => {
    const token = await getAccessToken()
    if (report.post_id) {
      const res = await functionPost("admin-action", { action: "moderate_post", id: report.post_id, moderation_status: moderation, visibility: moderation === "published" ? "public" : "hidden" }, { token })
      if (!res.ok) { setErr(res.data.error); return }
    }
    await functionPost("admin-action", { action: "report_status", id: report.id, status: "actioned" }, { token })
    load()
  }
  return (
    <div>
      <Notice kind="error">{err}</Notice>
      {!reports.length && <p>No reports.</p>}
      {reports.map((r) => (
        <div className="card pad shadow" key={r.id}>
          <b>{r.status}</b> · {r.reason}
          <p className="small muted">post {r.post_id} · comment {r.comment_id}</p>
          <div className="btns">
            <button className="outline-btn auto small" onClick={() => act(r, "removed")}>Hide content</button>
            <button className="outline-btn auto small" onClick={() => act(r, "published")}>Restore</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function OrdersAdmin() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100).then(({ data, error }) => {
      if (error) setErr(error.message)
      setRows(data || [])
    })
  }, [])
  return (
    <div>
      <Notice kind="error">{err}</Notice>
      <p className="small muted">Orders are marked paid only after a verified Razorpay webhook. Manual requests stay pending.</p>
      {rows.map((r) => (
        <div className="card pad shadow" key={r.id}>
          <b>{r.receipt}</b> · {r.status} · {r.provider} · ₹{r.amount_inr}
          <p className="small">{r.student_name} · {r.whatsapp}</p>
        </div>
      ))}
    </div>
  )
}

function split(s) {
  return String(s || "").split(",").map((x) => x.trim()).filter(Boolean)
}
