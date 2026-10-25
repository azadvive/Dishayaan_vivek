// Each option adds weight to profile axes (0 tech, 1 problem, 2 research, 3 making, 4 markets, 5 people)
// and to exploration tracks. Relative strengths only — never a prediction.
export const PATHFINDER_WEIGHTS = [
  null,
  [[{ 1: 2, 3: 2 }, ["physics", "engineering", "robotics"]], [{ 2: 3 }, ["biotechnology", "research"]], [{ 4: 2, 5: 2 }, ["stock-market", "entrepreneurship"]], [{ 0: 3 }, ["ai-ml", "computer-science"]], [{ 5: 2, 2: 1 }, ["research", "entrepreneurship"]]],
  [[{ 3: 3 }, ["robotics", "engineering", "drones"]], [{ 2: 3 }, ["research", "physics", "biotechnology"]], [{ 0: 3 }, ["computer-science", "ai-ml"]], [{ 4: 3 }, ["stock-market", "entrepreneurship"]]],
  [[{ 0: 3 }, ["ai-ml"]], [{ 3: 3 }, ["robotics"]], [{ 3: 2, 1: 1 }, ["drones"]], [{ 0: 2 }, ["computer-science"]], [{}, []]],
  [[{ 1: 3 }, []], [{ 3: 3 }, ["engineering"]], [{ 2: 3 }, ["research"]], [{ 1: 2, 0: 1 }, ["ai-ml"]], [{ 5: 3 }, []]],
  [[{ 2: 3 }, ["biotechnology"]], [{ 2: 1 }, []], [{}, []]],
  [[{ 0: 3 }, ["computer-science", "ai-ml"]], [{ 0: 1 }, []], [{}, []]],
  [[{ 4: 3 }, ["stock-market", "entrepreneurship"]], [{ 4: 1 }, []], [{}, []]],
  [[{ 3: 3 }, ["robotics", "engineering"]], [{ 2: 3 }, ["research", "physics"]], [{ 4: 2, 5: 2 }, ["entrepreneurship", "stock-market"]], [{}, []]],
  [[{ 1: 3 }, ["physics"]], [{ 1: 1 }, []], [{}, []]],
  [[{ 3: 3 }, ["robotics"]], [{ 0: 3 }, ["ai-ml"]], [{ 2: 3 }, ["research", "biotechnology"]], [{ 4: 3 }, ["stock-market", "entrepreneurship"]], [{ 5: 3 }, ["entrepreneurship"]]],
]

export function scorePathfinder(answers, classLabel) {
  const axes = [0, 0, 0, 0, 0, 0]
  const tr = {}
  answers.forEach((opt, qi) => {
    if (qi === 0 || !PATHFINDER_WEIGHTS[qi]) return
    const [ax, tracks] = PATHFINDER_WEIGHTS[qi][opt] || [{}, []]
    Object.keys(ax).forEach((k) => {
      axes[k] += ax[k]
    })
    tracks.forEach((t) => {
      tr[t] = (tr[t] || 0) + 1
    })
  })
  const max = Math.max(...axes, 1)
  const top = Object.entries(tr)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 3)
    .map(([id]) => id)
  return {
    cls: classLabel,
    axes: axes.map((v) => Math.round((v / max) * 100)),
    top: top.length ? top : ["ai-ml", "robotics", "research"].slice(0, 3),
    answers,
  }
}
