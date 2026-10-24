import { FaBrain, FaCode, FaUserSecret, FaChartLine, FaRobot, FaCogs, FaDna, FaAtom, FaStethoscope, FaLandmark, FaFlag, FaBriefcase, FaCalculator, FaFileAlt, FaBalanceScale } from "react-icons/fa"
import { GiDeliveryDrone } from "react-icons/gi"
import { C } from "../content"

// One list drives BOTH the hero slideshow and the "Explore it first" orbit map.
// Hero photos: drop a file named <id>.jpg into public/images/hero/ (see README.txt there).
// If a photo is missing, the slide falls back to the animated gradient scene automatically.
export const DOMAINS = [
  // ---- skill domains (inner ring) ----
  { id: "ai-ml", key: "track:ai-ml", group: "skill", label: "AI / ML", full: "AI & Machine Learning", Icon: FaBrain, color: "#3b82f6", dark: "#0b1d4a", tag: "Build models that learn", blurb: "From first Python notebook to a working model you can demo.", subs: ["Python", "Machine Learning", "Generative AI", "Data", "Projects"] },
  { id: "programming", key: "track:computer-science", group: "skill", label: "Programming", full: "Computer Science & Programming", Icon: FaCode, color: "#06b6d4", dark: "#062c3a", tag: "Think in code", blurb: "Logic, algorithms and real apps — not just syntax.", subs: ["Logic & Algorithms", "Web & Apps", "Python / C++", "Problem solving", "Projects"] },
  { id: "cyber", key: "track:cybersecurity", group: "skill", label: "Cybersecurity", full: "Cybersecurity & Ethical Hacking", Icon: FaUserSecret, color: "#22c55e", dark: "#05260f", tag: "Learn to defend by thinking like an attacker", blurb: "Ethical hacking in safe, supervised labs — learn how systems break so you can protect them.", subs: ["Networking basics", "Ethical hacking", "CTF challenges", "Cryptography", "Safe-practice labs"] },
  { id: "trading", key: "track:stock-market", group: "skill", label: "Stock Market", full: "Stock Market & Trading", Icon: FaChartLine, color: "#f59e0b", dark: "#2b1c02", tag: "Understand money & markets", blurb: "Charts, price action, risk and psychology — taught as learning, not tips.", subs: ["Market basics", "Price action", "Risk management", "Investing", "Paper trading"] },
  { id: "robotics", key: "track:robotics", group: "skill", label: "Robotics", full: "Robotics & Automation", Icon: FaRobot, color: "#8b5cf6", dark: "#1a0b3d", tag: "Make machines move", blurb: "Sensors, control and embedded systems on real hardware.", subs: ["Sensors", "Control", "Embedded systems", "Automation", "Robot builds"] },
  { id: "drones", key: "track:drones", group: "skill", label: "Drone Tech", full: "Drone Technology", Icon: GiDeliveryDrone, color: "#0ea5e9", dark: "#06263a", tag: "Take engineering to the sky", blurb: "Aerodynamics, flight controllers, mapping and the rules of flying.", subs: ["Aerodynamics", "Flight controllers", "Telemetry", "Mapping", "Regulation"] },
  { id: "mechanical", key: "track:engineering", group: "skill", label: "Mech Design", full: "Mechanical Design", Icon: FaCogs, color: "#f97316", dark: "#2e1204", tag: "Design it, then build it", blurb: "CAD, mechanisms and 3D-printed prototypes.", subs: ["CAD modelling", "Mechanisms", "3D printing", "Materials", "Prototypes"] },
  { id: "biotech", key: "track:biotechnology", group: "skill", label: "Biotech", full: "Biotechnology", Icon: FaDna, color: "#ec4899", dark: "#2f0a1d", tag: "Explore the code of life", blurb: "Genetics, lab thinking and the biology behind tomorrow's medicine.", subs: ["Genetics", "Cell biology", "Lab methods", "Bioinformatics", "Research"] },
  // ---- exam pathways (outer ring) ----
  { id: "jee", key: "exam:JEE", group: "exam", label: "IIT-JEE", full: "IIT-JEE", Icon: FaAtom, color: "#3b82f6", dark: "#0a1a45", tag: "Aim for engineering", blurb: "Concept-first Physics, Chemistry and Maths with a mentor-planned schedule.", subs: ["Physics", "Chemistry", "Maths", "Mock analysis", "Strategy"] },
  { id: "neet", key: "exam:NEET", group: "exam", label: "NEET", full: "NEET", Icon: FaStethoscope, color: "#16a34a", dark: "#04240f", tag: "Aim for medicine", blurb: "Biology depth, Physics and Chemistry fundamentals and steady revision.", subs: ["Biology", "Physics", "Chemistry", "NCERT revision", "Mock tests"] },
  { id: "upsc", key: "exam:UPSC", group: "exam", label: "UPSC", full: "UPSC Civil Services", Icon: FaLandmark, color: "#d97706", dark: "#2a1a02", tag: "Serve the nation", blurb: "Build the reading, writing and current-affairs habits early.", subs: ["Polity & History", "Geography", "Current affairs", "Answer writing", "Foundation"] },
  { id: "nda", key: "exam:NDA", group: "exam", label: "NDA", full: "NDA (Defence)", Icon: FaFlag, color: "#8b5cf6", dark: "#190a3a", tag: "Prepare for the forces", blurb: "Maths, general ability and the discipline behind SSB readiness.", subs: ["Maths", "General ability", "English", "SSB awareness", "Fitness mindset"] },
  { id: "cat", key: "exam:CAT", group: "exam", label: "CAT / MBA", full: "CAT & MBA Entrance", Icon: FaBriefcase, color: "#06b6d4", dark: "#062a34", tag: "Lead and manage", blurb: "Quant, verbal and reasoning foundations — and what management really is.", subs: ["Quant", "Verbal", "Reasoning", "Business basics", "Foundation"] },
  { id: "cma", key: "exam:CMA", group: "exam", label: "CMA", full: "CMA (Cost & Management)", Icon: FaCalculator, color: "#14b8a6", dark: "#04262a", tag: "Master cost & management", blurb: "Costing, finance and the numbers behind how businesses run.", subs: ["Costing", "Accounting", "Finance", "Law basics", "Foundation"] },
  { id: "cs", key: "exam:CS", group: "exam", label: "CS", full: "CS (Company Secretary)", Icon: FaFileAlt, color: "#6366f1", dark: "#0f1038", tag: "Corporate law & governance", blurb: "Company law, governance and compliance, explained simply.", subs: ["Company law", "Governance", "Compliance", "Economics", "Foundation"] },
  { id: "ca", key: "exam:CA", group: "exam", label: "CA", full: "CA (Chartered Accountant)", Icon: FaBalanceScale, color: "#ef4444", dark: "#2f0a0a", tag: "Accounts, audit & tax", blurb: "Accounting, law and quantitative aptitude with a clear roadmap.", subs: ["Accounting", "Law", "Quantitative aptitude", "Taxation basics", "Foundation"] },
]
export const DOMAIN_GROUPS = { skill: "Skill domain", exam: "Exam pathway" }

// The catalogue shows exactly one card per domain: the first programme that belongs to it.
export const programmeFor = (d) => {
  const [kind, val] = d.key.split(":")
  return C.programmes.find((p) => (kind === "track" ? p.trackId === val : p.examCode === val))
}
export const examFor = (d) => C.exam_pathways.find((e) => d.key === "exam:" + e.code)
