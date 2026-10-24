import React from "react"
import { Link } from "../../../router"
import { Logo } from "../header/Header"
import { useI18n } from "../../../i18n"
import { useUI } from "../../../ui"

export default function Footer() {
  const { t } = useI18n()
  const { openMentor } = useUI()
  const cols = [
    [t("footer.colExplore"), [["/catalog", "footer.linkProgrammes"], ["/mentors", "footer.linkMentors"], ["/plans", "footer.linkPlans"], ["/about", "footer.linkAbout"]]],
    [t("footer.colStudents"), [["/pathfinder", "footer.linkPathFinder"], ["/catalog", "footer.linkCatalog"], ["/book", "footer.linkAskMentor"], ["/community", "nav.community"]]],
    [t("footer.colParents"), [["/plans", "footer.linkParentGuide"], ["/plans", "footer.linkProgress"], ["/book", "footer.linkTalkMentor"], ["/plans", "footer.linkFees"]]],
    [t("footer.colInstitutions"), [["/partners", "footer.linkSchools"], ["/partners", "footer.linkColleges"], ["/partners", "footer.linkCoaching"], ["/partners", "footer.linkPartner"]]],
    [t("footer.colCompany"), [["/about", "footer.linkAboutBrand"], ["/partners#requirement", "footer.linkRequirement"], ["/book", "footer.linkContact"]]],
  ]
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-cta">
          <h2>{t("home.final.title")}</h2>
          <button className="primary-btn" onClick={() => openMentor({})}>
            {t("footer.bookFree")}
          </button>
        </div>
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo light />
            <p>{t("footer.intro")}</p>
          </div>
          {cols.map(([title, links]) => (
            <div key={title}>
              <h4>{title}</h4>
              <ul>
                {links.map(([to, key], i) => (
                  <li key={i}>
                    <Link to={to}>{t(key)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p className="small">{t("footer.verification")}</p>
        </div>
      </div>
    </footer>
  )
}
