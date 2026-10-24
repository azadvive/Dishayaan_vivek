import React from "react"
import { FaRobot, FaUserFriends } from "react-icons/fa"
import { useUI } from "../../ui"
import { useI18n } from "../../i18n"

export default function StickyBar() {
  const { openAI, openMentor } = useUI()
  const { t } = useI18n()
  return (
    <div className="sticky-bar">
      <button onClick={openAI}><FaRobot /> {t("nav.askAiShort")}</button>
      <button className="primary" onClick={() => openMentor({})}><FaUserFriends /> {t("nav.connectMentor")}</button>
    </div>
  )
}
