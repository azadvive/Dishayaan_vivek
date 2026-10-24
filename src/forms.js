import { useEffect } from "react"

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key)
      return v ? JSON.parse(v) : fallback
    } catch (e) {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {}
  },
}

// Real submissions on Netlify (Netlify Forms picks the hidden forms up from public/index.html).
// If the POST fails (e.g. local dev) the entry is kept in localStorage so nothing is lost silently.
export async function submitForm(name, data) {
  const body = new URLSearchParams({ "form-name": name, ...data }).toString()
  try {
    const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
    if (res.ok) return { ok: true }
    throw new Error("status " + res.status)
  } catch (e) {
    const list = store.get("dy_outbox", [])
    list.push({ name, data, at: new Date().toISOString() })
    store.set("dy_outbox", list)
    return { ok: true, local: true }
  }
}

export function useSeo(title, description) {
  useEffect(() => {
    if (title) document.title = title.includes("DishaYaaN") ? title : title + " · DishaYaaN"
    if (description) {
      let m = document.querySelector('meta[name="description"]')
      if (!m) {
        m = document.createElement("meta")
        m.name = "description"
        document.head.appendChild(m)
      }
      m.content = description
    }
  }, [title, description])
}

export const track = (event, props = {}) => {
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...props })
  } catch (e) {}
}
