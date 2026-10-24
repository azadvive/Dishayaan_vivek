import React, { useRef } from "react"
import { FaRobot, FaBrain, FaCode, FaChartLine, FaDna, FaAtom } from "react-icons/fa"
import { GiDeliveryDrone } from "react-icons/gi"
import HERO_IMAGE from "../../data/heroImage"

const Cube = ({ cls }) => (
  <div className={`layer ${cls}`}>
    <div className="cube"><i /><i /><i /><i /><i /><i /></div>
  </div>
)
const Chip = ({ cls, Icon, color }) => (
  <div className={`layer chip-wrap ${cls}`}>
    <div className="chip" style={{ color }}><Icon /></div>
  </div>
)

function Student() {
  return (
    <svg viewBox="0 0 400 460" className="student" role="img" aria-label="Illustration of a student holding a book">
      <ellipse cx="200" cy="440" rx="120" ry="14" fill="#0b2a4a" opacity=".12" />
      {/* legs + shoes */}
      <rect x="150" y="340" width="46" height="88" rx="14" fill="#1b3a6b" />
      <rect x="204" y="340" width="46" height="88" rx="14" fill="#1b3a6b" />
      <path d="M140 428 q0-14 20-14 h38 v18 h-58z" fill="#fff" stroke="#cfe3f5" strokeWidth="2" />
      <path d="M260 428 q0-14-20-14 h-38 v18 h58z" fill="#fff" stroke="#cfe3f5" strokeWidth="2" />
      {/* backpack */}
      <rect x="112" y="205" width="40" height="110" rx="18" fill="#0ea5e9" />
      {/* torso hoodie */}
      <path d="M135 232 q0-40 40-44 h50 q40 4 40 44 l8 122 h-146z" fill="#3b82f6" />
      <path d="M170 188 q30 36 60 0 q-30-14-60 0z" fill="#2563eb" />
      <path d="M190 208 v50 M210 208 v50" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <rect x="160" y="300" width="80" height="34" rx="12" fill="#2f74e0" />
      {/* arms */}
      <path d="M140 235 Q128 290 178 296" stroke="#3b82f6" strokeWidth="34" strokeLinecap="round" fill="none" />
      <path d="M260 235 Q272 290 222 296" stroke="#3b82f6" strokeWidth="34" strokeLinecap="round" fill="none" />
      {/* open book */}
      <path d="M150 282 L200 292 L250 282 L250 328 L200 338 L150 328z" fill="#0b5fd1" />
      <path d="M154 276 L200 286 V328 L154 318z" fill="#fff" />
      <path d="M246 276 L200 286 V328 L246 318z" fill="#f1f7ff" />
      <path d="M164 292 h26 M164 302 h26 M164 312 h20 M210 292 h26 M210 302 h26 M210 312 h20" stroke="#9cc3f5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="176" cy="298" r="15" fill="#f2c6a0" /><circle cx="224" cy="298" r="15" fill="#f2c6a0" />
      {/* neck + head */}
      <rect x="186" y="170" width="28" height="30" rx="10" fill="#e8b48a" />
      <circle cx="200" cy="130" r="50" fill="#f6cfa8" />
      <circle cx="152" cy="134" r="9" fill="#f0bd93" /><circle cx="248" cy="134" r="9" fill="#f0bd93" />
      <path d="M150 124 q-6-58 52-60 q58 2 48 62 q-12-34-48-34 q-34 0-52 32z" fill="#2b2d42" />
      <path d="M170 100 q30-26 70 4" stroke="#3a3d5c" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* face */}
      <circle cx="182" cy="136" r="5" fill="#2b2d42" /><circle cx="218" cy="136" r="5" fill="#2b2d42" />
      <circle cx="184" cy="134" r="1.6" fill="#fff" /><circle cx="220" cy="134" r="1.6" fill="#fff" />
      <path d="M186 156 q14 14 28 0" stroke="#b5654a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="168" cy="150" r="7" fill="#f4a7a0" opacity=".55" /><circle cx="232" cy="150" r="7" fill="#f4a7a0" opacity=".55" />
      {/* headphones */}
      <path d="M150 128 q0-62 50-62 q50 0 50 62" stroke="#0b2a4a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="140" y="120" width="16" height="32" rx="8" fill="#0ea5e9" /><rect x="244" y="120" width="16" height="32" rx="8" fill="#0ea5e9" />
    </svg>
  )
}

export default function HeroArt() {
  const ref = useRef(null)
  const move = (e) => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5) * 2)
    ref.current.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  const reset = () => { ref.current.style.setProperty("--mx", 0); ref.current.style.setProperty("--my", 0) }
  return (
    <div className="hero-art" ref={ref} onMouseMove={move} onMouseLeave={reset} aria-hidden="false">
      <div className="stage">
        <div className="glow" />
        <div className="ring r1" /><div className="ring r2" />
        <div className="layer person" style={{ "--d": 6 }}>
          {HERO_IMAGE ? <img className="student-photo" src={HERO_IMAGE} alt="Student" /> : <Student />}
        </div>
        <Cube cls="cube1" /><Cube cls="cube2" /><Cube cls="cube3" />
        <Chip cls="chip1" Icon={FaBrain} color="#2563eb" />
        <Chip cls="chip2" Icon={FaRobot} color="#7c3aed" />
        <Chip cls="chip3" Icon={GiDeliveryDrone} color="#0891b2" />
        <Chip cls="chip4" Icon={FaChartLine} color="#16a34a" />
        <Chip cls="chip5" Icon={FaCode} color="#ea580c" />
        <Chip cls="chip6" Icon={FaDna} color="#db2777" />
        <Chip cls="chip7" Icon={FaAtom} color="#0284c7" />
      </div>
    </div>
  )
}
