import React, { useState } from "react"
import { FaPlay } from "react-icons/fa"
import Modal from "./Modal"
import { P, accentOf } from "../../content"

const embed = (u) => {
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null
}

// Video thumbnail for a mentor seat. Plays when a videoUrl is set; otherwise explains it publishes after verification.
export default function MentorVideo({ m, url, accent, height = 150 }) {
  const [open, setOpen] = useState(false)
  const c = accentOf(accent)
  const yt = url && embed(url)
  return (
    <>
      <button className="mvideo" style={{ height, background: `linear-gradient(135deg, ${c}, #0b3b4a)` }} onClick={() => setOpen(true)} aria-label={m.role + " — " + m.videoDuration}>
        <span className="play"><FaPlay /></span>
        <span className="vlabel">{m.videoDuration}</span>
        {!url && <span className="soon">{P.mentors_page.seat_status_label}</span>}
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} title={m.role} wide>
          {url ? (
            yt ? <iframe className="vframe" src={yt} title={m.role} allow="autoplay; encrypted-media" allowFullScreen /> : <video className="vframe" src={url} controls autoPlay />
          ) : (
            <p className="modal-sub">{P.mentors_page.detail.video}</p>
          )}
        </Modal>
      )}
    </>
  )
}
