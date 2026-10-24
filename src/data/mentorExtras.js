// Fill these in once a mentor is verified and has consented to being listed.
// Nothing is invented: empty fields show "Pending verification" on the site.
//   college  : college / university name
//   company  : company where the mentor currently works
//   videoUrl : YouTube link (https://www.youtube.com/watch?v=...) or a direct .mp4 link
const extras = {
  "applied-ai-ml-mentor":        { college: "", company: "", videoUrl: "" },
  "robotics-embedded-mentor":    { college: "", company: "", videoUrl: "" },
  "drone-systems-mentor":        { college: "", company: "", videoUrl: "" },
  "computer-science-mentor":     { college: "", company: "", videoUrl: "" },
  "markets-trading-mentor":      { college: "", company: "", videoUrl: "" },
  "life-sciences-mentor":        { college: "", company: "", videoUrl: "" },
  "physics-jee-mentor":          { college: "", company: "", videoUrl: "" },
  "neet-strategy-mentor":        { college: "", company: "", videoUrl: "" },
  "nda-defence-mentor":          { college: "", company: "", videoUrl: "" },
  "commerce-professional-mentor":{ college: "", company: "", videoUrl: "" },
}
export const extraFor = (slug) => extras[slug] || {}
export default extras
