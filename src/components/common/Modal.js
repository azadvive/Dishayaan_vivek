import React, { useEffect } from "react"
import { FaTimes } from "react-icons/fa"

export default function Modal({ onClose, title, subtitle, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>
        {title && <h2>{title}</h2>}
        {subtitle && <p className="modal-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
