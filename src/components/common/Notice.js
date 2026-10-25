import React from "react"

export function Notice({ kind = "info", children }) {
  if (!children) return null
  return (
    <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  )
}

export function BusyButton({ busy, children, className = "primary-btn full", ...rest }) {
  return (
    <button className={className} disabled={busy || rest.disabled} {...rest}>
      {busy ? "Please wait…" : children}
    </button>
  )
}
