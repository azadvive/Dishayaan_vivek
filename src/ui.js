import React, { createContext, useContext, useState } from "react"
const UI = createContext({})
export function UIProvider({ children }) {
  const [mentor, setMentor] = useState(null) // null | {auto?, domain?}
  const [ai, setAi] = useState(false)
  return (
    <UI.Provider value={{ mentor, openMentor: (o = {}) => setMentor(o), closeMentor: () => setMentor(null), ai, openAI: () => setAi(true), closeAI: () => setAi(false) }}>
      {children}
    </UI.Provider>
  )
}
export const useUI = () => useContext(UI)
