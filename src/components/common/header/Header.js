import React, { useState } from "react"
import { Link, NavLink } from "../../../router"
import { useI18n, languages } from "../../../i18n"
import { useUI } from "../../../ui"
import { FaBars, FaTimes, FaRobot, FaChevronDown } from "react-icons/fa"

export const Logo = ({ light }) => (
  <Link to="/" className={`logo ${light ? "light" : ""}`} aria-label="DishaYaaN home">
    <img src="/logo.svg" alt="" width="40" height="40" />
    <span>
      Disha<b>YaaN</b>
    </span>
  </Link>
)

export default function Header() {
  const { t, lang, setLang } = useI18n()
  const { openAI, openMentor } = useUI()
  const [open, setOpen] = useState(false)
  const [more, setMore] = useState(false)
  const primary = [
    ["/", t("nav.home"), true],
    ["/catalog", t("nav.catalog")],
    ["/mentors", t("nav.mentors")],
    ["/community", t("nav.community")],
    ["/plans", t("nav.plans")],
    ["/about", t("nav.about")],
  ]
  const secondary = [
    ["/book", t("nav.bookSession")],
    ["/pathfinder", t("nav.pathfinder")],
    ["/partners", t("nav.partners")],
  ]
  const close = () => {
    setOpen(false)
    setMore(false)
  }
  return (
    <>
      <section className="head">
        <div className="container flexSB">
          <div className="head-left">
            <Link to="/book">{t("nav.bookSession")}</Link>
            <span className="sep" />
            <Link to="/pathfinder">{t("nav.pathfinder")}</Link>
          </div>
          <div className="head-right">
            <label className="lang">
              <span className="sr">{t("lang.label")}</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t("lang.label")}>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>
      <header className="site-header">
        <div className="container flexSB">
          <Logo />
          <nav className={open ? "open" : ""}>
            <ul>
              {primary.map(([to, label, exact]) => (
                <li key={to}>
                  <NavLink to={to} exact={exact} onClick={close}>
                    {label}
                  </NavLink>
                </li>
              ))}
              <li className="has-more">
                <button className="more-btn" onClick={() => setMore(!more)} aria-expanded={more}>
                  {t("nav.more")} <FaChevronDown size={11} />
                </button>
                <ul className={`more ${more ? "show" : ""}`}>
                  {secondary.map(([to, label]) => (
                    <li key={to}>
                      <NavLink to={to} onClick={close}>
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
          <div className="head-cta">
            <button className="outline-btn small" onClick={openAI}>
              <FaRobot /> {t("nav.askAiShort")}
            </button>
            <button className="primary-btn small" onClick={() => openMentor({})}>
              {t("nav.talkToMentor")}
            </button>
            <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}>
              {open ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
