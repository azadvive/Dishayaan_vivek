// Tiny History-API router (same API shape as react-router v5: Router, Switch, Route, Link, NavLink)
// so the project has zero extra dependencies and works with Netlify's "/* /index.html 200" rule.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

const RouterCtx = createContext({ path: "/", search: "", navigate: () => {} })

export function Router({ children }) {
  const [loc, setLoc] = useState({ path: window.location.pathname, search: window.location.search })
  useEffect(() => {
    const onPop = () => setLoc({ path: window.location.pathname, search: window.location.search })
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])
  const navigate = useCallback((to) => {
    const url = new URL(to, window.location.origin)
    window.history.pushState({}, "", url.pathname + url.search + url.hash)
    setLoc({ path: url.pathname, search: url.search })
    if (url.hash) {
      setTimeout(() => {
        const el = document.getElementById(url.hash.slice(1))
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 60)
    } else {
      window.scrollTo(0, 0)
    }
  }, [])
  const value = useMemo(() => ({ ...loc, navigate }), [loc, navigate])
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>
}

export const useRouter = () => useContext(RouterCtx)
export const useSearchParams = () => new URLSearchParams(useContext(RouterCtx).search)

function match(pattern, path, exact) {
  if (pattern === undefined) return { params: {} }
  const pp = pattern.split("/").filter(Boolean)
  const cp = path.split("/").filter(Boolean)
  if (exact && pp.length !== cp.length) return null
  if (!exact && cp.length < pp.length) return null
  const params = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = decodeURIComponent(cp[i])
    else if (pp[i] !== cp[i]) return null
  }
  return { params }
}

export function Route() {
  return null
}

export function Switch({ children }) {
  const { path } = useRouter()
  let found = null
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return
    const m = match(child.props.path, path, child.props.exact)
    if (m) found = { child, m }
  })
  if (!found) return null
  const C = found.child.props.component
  return <C match={{ params: found.m.params }} />
}

export function Link({ to, children, onClick, ...rest }) {
  const { navigate } = useRouter()
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        if (onClick) onClick(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || rest.target === "_blank") return
        e.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}

export function NavLink({ to, exact, className = "", activeClassName = "active", ...rest }) {
  const { path } = useRouter()
  const base = to.split("#")[0].split("?")[0]
  const active = exact ? path === base : path === base || path.startsWith(base + "/")
  return <Link to={to} className={`${className} ${active ? activeClassName : ""}`.trim()} {...rest} />
}
