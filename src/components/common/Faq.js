import React, { useState } from "react"
import { FaPlus, FaMinus } from "react-icons/fa"

export default function Faq({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="faq-list">
      {items.map((f, i) => (
        <div className={`faq-item shadow ${open === i ? "open" : ""}`} key={i}>
          <button className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{f.q}</span>
            {open === i ? <FaMinus /> : <FaPlus />}
          </button>
          {open === i && <div className="faq-a">{f.a}</div>}
        </div>
      ))}
    </div>
  )
}
