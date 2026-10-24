import {
  FaBrain, FaRobot, FaCode, FaChartLine, FaDna, FaAtom, FaWrench, FaMicroscope, FaRocket,
  FaCogs, FaUserSecret, FaSchool, FaGraduationCap, FaBuilding, FaHandHoldingHeart,
} from "react-icons/fa"
import { GiDeliveryDrone } from "react-icons/gi"
import content from "./data/content.json"

export default content
export const C = content
export const P = content.page_copy

export const accents = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  green: "#16a34a",
  orange: "#f97316",
  pink: "#ec4899",
  red: "#ef4444",
  yellow: "#d9a406",
}
export const accentOf = (a) => accents[a] || "#1eb2a6"

export const trackIcons = {
  brain: FaBrain, bot: FaRobot, drone: GiDeliveryDrone, code: FaCode, "trending-up": FaChartLine,
  dna: FaDna, cogs: FaCogs, shield: FaUserSecret, atom: FaAtom, wrench: FaWrench, microscope: FaMicroscope, rocket: FaRocket,
}
export const instIcons = {
  school: FaSchool, "graduation-cap": FaGraduationCap, building: FaBuilding, "heart-handshake": FaHandHoldingHeart,
}
export const trackById = (id) => content.tracks.find((t) => t.id === id)
export const kindLabel = { future: P.home_catalogue_tabs[0], goal: P.home_catalogue_tabs[1], direction: P.home_catalogue_tabs[2] }
export const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN")
export const fill = (s, vars) => Object.keys(vars).reduce((a, k) => a.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]), s)
export const initials = (s) => s.split(/[^A-Za-z]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
