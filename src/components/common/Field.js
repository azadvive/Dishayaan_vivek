import React from "react"
export const Field = ({ label, hint, children }) => (
  <label className="field">
    <span className="field-label">{label}</span>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
  </label>
)
export const Input = (p) => <input {...p} />
export const Select = ({ options, placeholder, ...rest }) => (
  <select {...rest}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o]
      return <option key={v} value={v}>{l}</option>
    })}
  </select>
)
