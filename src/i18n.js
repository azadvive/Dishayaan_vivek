import React, { createContext, useContext, useEffect, useState } from "react"
import content from "./data/content.json"

const dict = content.i18n
export const languages = content.languages
const Ctx = createContext({ lang: "en", setLang: () => {}, t: (k) => k })

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("dy_lang") || "en"
    } catch (e) {
      return "en"
    }
  })
  const setLang = (l) => {
    setLangState(l)
    try {
      localStorage.setItem("dy_lang", l)
    } catch (e) {}
  }
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const t = (key, vars = {}) => {
    let s = (dict[lang] && dict[lang][key]) || dict.en[key] || key
    Object.keys(vars).forEach((k) => {
      s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k])
    })
    return s
  }
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}
export const useI18n = () => useContext(Ctx)
