// ============================================================
// rankingAgent.js — Step 4: Score and rank providers
// ============================================================

/**
 * Calculates provider availability score.
 * @param {string[]} slots
 * @param {boolean} isCrisis
 * @returns {number} 0–10
 */
function getAvailabilityScore(slots, isCrisis) {
  if (!slots || slots.length === 0) return 0;
  const slotsLower = slots.map((s) => s.toLowerCase());

  if (isCrisis) {
    // In crisis mode: only "TODAY NOW" or "abhi" counts as full score
    return slotsLower.some((s) => s.includes("now") || s.includes("abhi")) ? 10 : 5;
  }

  if (slotsLower.some((s) => s.includes("today") || s.includes("now"))) return 10;
  if (slotsLower.some((s) => s.includes("tomorrow"))) return 7;
  return 5;
}

/**
 * Scores and ranks providers using the spec formula:
 * SCORE = (rating×30) + (proximity×35) + (availability×20) + (jobs×15)
 *
 * @param {Object[]} providers - Providers with distance_km
 * @param {boolean} isCrisis - If true, rank only by availability + proximity
 * @returns {{ ranked: Object[], trace: Object }}
 */
export function runRankingAgent(providers, isCrisis = false) {
  const startTime = Date.now();

  if (!providers || providers.length === 0) {
    return {
      ranked: [],
      trace: {
        step: "RANKING",
        agent: "RankingAgent",
        input_summary: "0 providers to rank",
        output_summary: "No providers — skipped",
        tools_used: [],
        duration_ms: Date.now() - startTime,
        reasoning: "No candidates received from DiscoveryAgent.",
        confidence: 0,
      },
    };
  }

  const scored = providers.map((p) => {
    const ratingScore = p.rating * 10;                              // 0–50 → normalized to 0–10
    const proximityScore = Math.max(0, 10 - p.distance_km);        // 0–10
    const availScore = getAvailabilityScore(p.available_slots, isCrisis);
    const jobsScore = Math.min(10, p.completed_jobs / 10);          // 0–10

    let totalScore;
    let reasoning;

    if (isCrisis) {
      // Crisis override: only availability + proximity matter
      totalScore = availScore * 50 + proximityScore * 50;
      reasoning = `🚨 CRISIS: ranked by availability (${availScore}/10) + proximity (${proximityScore.toFixed(1)}/10)`;
    } else {
      totalScore =
        (ratingScore / 10) * 30 +
        proximityScore * 35 +
        availScore * 20 +
        jobsScore * 15;
      reasoning = `Rating(${p.rating}×30) + Proximity(${proximityScore.toFixed(1)}×35) + Avail(${availScore}×20) + Jobs(${jobsScore.toFixed(1)}×15)`;
    }

    return {
      ...p,
      scores: {
        rating: parseFloat((ratingScore / 10).toFixed(1)),
        proximity: parseFloat(proximityScore.toFixed(1)),
        availability: availScore,
        jobs: parseFloat(jobsScore.toFixed(1)),
        total: parseFloat(totalScore.toFixed(1)),
      },
      ranking_reason: reasoning,
    };
  });

  // Sort descending by total score
  const ranked = scored.sort((a, b) => b.scores.total - a.scores.total).slice(0, 3);

  // Add rank labels
  ranked.forEach((p, i) => {
    p.rank = i + 1;
    p.rank_reason = `${p.name} ranked #${i + 1} because: ${p.ranking_reason}`;
  });

  const duration = Date.now() - startTime;

  const trace = {
    step: "RANKING",
    agent: "RankingAgent",
    input_summary: `${providers.length} providers | crisis=${isCrisis}`,
    output_summary: `Top pick: ${ranked[0]?.name} (score: ${ranked[0]?.scores.total})`,
    tools_used: ["scoring_formula", "sort_algorithm"],
    duration_ms: duration,
    reasoning: isCrisis
      ? "Crisis mode: sorted by availability + proximity only. Rating ignored."
      : "Normal mode: SCORE = (rating×30) + (proximity×35) + (availability×20) + (jobs×15)",
    confidence: 0.95,
  };

  return { ranked, trace };
}
