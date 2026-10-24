import React, { useState } from "react"
import { Link } from "../../router"
import PageHero from "../common/PageHero"
import { Field, Input } from "../common/Field"
import { P } from "../../content"
import { useSeo, store } from "../../forms"

// Posts are kept in this browser (localStorage) – no backend is required to deploy.
export default function Community() {
  const L = P.community_page
  useSeo(L.title, L.lead)
  const [posts, setPosts] = useState(() => store.get("dy_posts", []))
  const [q, setQ] = useState("")
  const save = (next) => { setPosts(next); store.set("dy_posts", next) }
  const publish = (e) => {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.target).entries())
    const file = e.target.elements.file.files[0]
    if (file && file.size > 6 * 1024 * 1024) { alert(L.rules[3]); return }
    save([{ id: Date.now(), author: d.author, text: d.text, link: d.link, file: file ? file.name : "", tags: (d.tags || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6), at: new Date().toLocaleDateString("en-IN"), comments: [] }, ...posts])
    e.target.reset()
  }
  const comment = (id, e) => {
    e.preventDefault()
    const v = e.target.elements.c.value.trim()
    if (!v) return
    save(posts.map((p) => (p.id === id ? { ...p, comments: [...p.comments, v] } : p)))
    e.target.reset()
  }
  const shown = posts.filter((p) => (p.text + p.author + p.tags.join(" ")).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHero eyebrow={L.eyebrow} crumb="Community" title={L.title} lead={L.lead} />
      <section className="padding">
        <div className="container community-grid">
          <div>
            <input className="search-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.search_placeholder} aria-label={L.search_placeholder} />
            {shown.length === 0 && (
              <div className="card shadow pad empty"><h3>{L.empty}</h3><p>{L.empty_hint}</p></div>
            )}
            {shown.map((p) => (
              <article className="card shadow pad post" key={p.id}>
                <div className="small muted"><b>{p.author}</b> · {p.at}</div>
                <p>{p.text}</p>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer noopener" className="small">{p.link}</a>}
                {p.file && <div className="small muted">📎 {p.file}</div>}
                <div className="chips">{p.tags.map((t) => <span key={t}>#{t}</span>)}</div>
                {p.comments.map((c, i) => <div className="comment" key={i}>{c}</div>)}
                <form className="comment-form" onSubmit={(e) => comment(p.id, e)}><input name="c" aria-label="Comment" placeholder="…" /><button className="outline-btn auto small">↵</button></form>
              </article>
            ))}
          </div>
          <aside>
            <form className="card shadow pad form" onSubmit={publish}>
              <h3>{L.composer.title}</h3>
              <Field label="Display name"><Input name="author" required /></Field>
              <Field label={L.composer.label}><textarea name="text" rows="4" required /></Field>
              <Field label="Tags" hint={L.composer.tags_hint}><Input name="tags" /></Field>
              <Field label={L.composer.link_label}><Input name="link" type="url" /></Field>
              <Field label={L.composer.file_label}><input type="file" name="file" /></Field>
              <button className="primary-btn full">{L.composer.cta}</button>
              <p className="small muted">{L.composer.note}</p>
            </form>
            <div className="card shadow pad">
              <h3>{L.where_to_start.title}</h3>
              <ul className="plain">{L.where_to_start.items.map((i) => <li key={i}>{i}</li>)}</ul>
              <Link to="/catalog" className="btn-link outline-btn auto">{L.where_to_start.cta}</Link>
            </div>
            <div className="card shadow pad">
              <ul className="ticks">{L.rules.map((r) => <li key={r}>• {r}</li>)}</ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
