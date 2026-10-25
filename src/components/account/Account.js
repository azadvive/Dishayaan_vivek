import React, { useState } from "react"
import { Link, useRouter } from "../../router"
import PageHero from "../common/PageHero"
import { Field, Input } from "../common/Field"
import { Notice, BusyButton } from "../common/Notice"
import { useAuth } from "../../lib/auth"
import { useSeo } from "../../forms"
import { C } from "../../content"

export default function Account() {
  useSeo("Account", "Sign in or manage your DishaYaaN profile.")
  const auth = useAuth()
  const { navigate } = useRouter()
  const [mode, setMode] = useState("login")
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!auth.configured) {
    return (
      <>
        <PageHero crumb="Account" title="Account" lead="Authentication is not active until Supabase keys are added." />
        <section className="padding">
          <div className="container narrow">
            <Notice kind="info">Copy `.env.example` to `.env.local`, add `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`, then restart the app. Public catalogue pages still work without an account.</Notice>
          </div>
        </section>
      </>
    )
  }

  if (auth.loading) {
    return (
      <section className="padding">
        <div className="container narrow"><p className="muted">Loading account…</p></div>
      </section>
    )
  }

  if (auth.user && auth.profile) {
    return <ProfilePanel auth={auth} />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    setBusy(true)
    const d = Object.fromEntries(new FormData(e.target).entries())
    let res
    if (mode === "login") res = await auth.login(d)
    else if (mode === "register") res = await auth.register(d)
    else res = await auth.requestReset(d.email)
    setBusy(false)
    if (!res.ok) setErr(res.error)
    else if (mode === "register" && res.needsEmail) setMsg("Check your email to verify the account, then sign in.")
    else if (mode === "reset") setMsg("If that email exists, a reset link has been sent.")
    else navigate("/dashboard")
  }

  return (
    <>
      <PageHero crumb="Account" title={mode === "register" ? "Create an account" : mode === "reset" ? "Reset password" : "Sign in"} lead="Browse programmes without an account. Sign in to save Path Finder results, publish in the community, and track bookings." />
      <section className="padding">
        <div className="container narrow">
          <form className="card shadow pad form" onSubmit={onSubmit}>
            <Notice kind="error">{err}</Notice>
            <Notice kind="ok">{msg}</Notice>
            {mode === "register" && (
              <Field label="Full name"><Input name="fullName" required autoComplete="name" /></Field>
            )}
            <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
            {mode !== "reset" && (
              <Field label="Password"><Input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /></Field>
            )}
            <BusyButton busy={busy}>{mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}</BusyButton>
            <div className="btns">
              {mode !== "login" && <button type="button" className="link-btn" onClick={() => setMode("login")}>Sign in</button>}
              {mode !== "register" && <button type="button" className="link-btn" onClick={() => setMode("register")}>Create account</button>}
              {mode !== "reset" && <button type="button" className="link-btn" onClick={() => setMode("reset")}>Forgot password</button>}
            </div>
          </form>
        </div>
      </section>
    </>
  )
}

function ProfilePanel({ auth }) {
  const p = auth.profile
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const d = Object.fromEntries(new FormData(e.target).entries())
    const res = await auth.updateProfile({
      full_name: d.full_name,
      phone: d.phone,
      bio: d.bio,
      education: { background: d.education },
      interests: (d.interests || "").split(",").map((s) => s.trim()).filter(Boolean),
      preferred_domains: d.preferred_domains ? [d.preferred_domains] : [],
    })
    setBusy(false)
    if (!res.ok) setErr(res.error)
    else setMsg("Profile saved.")
  }
  const onFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const res = await auth.uploadAvatar(file)
    if (!res.ok) setErr(res.error)
  }
  return (
    <>
      <PageHero crumb="Account" title={p.full_name || "Your profile"} lead={C.page_copy.dashboard_page.intro} />
      <section className="padding">
        <div className="container narrow">
          <form className="card shadow pad form" onSubmit={save}>
            <Notice kind="error">{err}</Notice>
            <Notice kind="ok">{msg}</Notice>
            <p className="small muted">{p.email} · {p.role} · {p.account_status}</p>
            {p.avatar_url && <img src={p.avatar_url} alt="" className="avatar-preview" />}
            <Field label="Full name"><Input name="full_name" defaultValue={p.full_name || ""} /></Field>
            <Field label="Phone"><Input name="phone" defaultValue={p.phone || ""} /></Field>
            <Field label="Educational background"><Input name="education" defaultValue={(p.education && p.education.background) || ""} /></Field>
            <Field label="Interests" hint="Comma-separated"><Input name="interests" defaultValue={(p.interests || []).join(", ")} /></Field>
            <Field label="Preferred domain">
              <select name="preferred_domains" defaultValue={(p.preferred_domains && p.preferred_domains[0]) || ""}>
                <option value="">—</option>
                {C.tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="About you"><textarea name="bio" rows="3" defaultValue={p.bio || ""} /></Field>
            <Field label="Profile image"><input type="file" accept="image/*" onChange={onFile} /></Field>
            <BusyButton busy={busy}>Save profile</BusyButton>
            <div className="btns">
              <Link to="/dashboard" className="btn-link outline-btn auto">My dashboard</Link>
              {auth.isAdmin && <Link to="/admin" className="btn-link outline-btn auto">Admin</Link>}
              <button type="button" className="link-btn" onClick={() => auth.logout()}>Sign out</button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
