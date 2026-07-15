import { tool } from "@opencode-ai/plugin"

const CRITERIA = [
  "perspective_fit", "feasibility", "audience", "wow_factor",
  "shareability", "engagement", "friction", "scope", "inversion",
  "moat", "tension", "clarity", "network_effect", "platform_potential",
  "timing", "originality_vs_predictions", "audacity",
] as const

type Criterion = typeof CRITERIA[number]

const DEFAULT_WEIGHTS: Record<string, Record<Criterion, number>> = {
  format: {
    perspective_fit: 1, feasibility: 1, audience: 1, wow_factor: 2,
    shareability: 2, engagement: 1, friction: 2, scope: 1, inversion: 0.5,
    moat: 2, tension: 0.5, clarity: 1, network_effect: 2, platform_potential: 2,
    timing: 1, originality_vs_predictions: 1, audacity: 1.5,
  },
  friction: {
    perspective_fit: 1, feasibility: 2, audience: 2, wow_factor: 1,
    shareability: 1, engagement: 1, friction: 1.5, scope: 1, inversion: 0.5,
    moat: 2, tension: 0.5, clarity: 1, network_effect: 1, platform_potential: 0.5,
    timing: 1, originality_vs_predictions: 1, audacity: 2,
  },
  behavior: {
    perspective_fit: 1, feasibility: 1.5, audience: 1.5, wow_factor: 1,
    shareability: 1, engagement: 1.5, friction: 1, scope: 1, inversion: 0.5,
    moat: 1.5, tension: 0.5, clarity: 1, network_effect: 2, platform_potential: 2,
    timing: 1.5, originality_vs_predictions: 1, audacity: 2,
  },
  tension: {
    perspective_fit: 1, feasibility: 1, audience: 1, wow_factor: 1.5,
    shareability: 1, engagement: 1.5, friction: 1, scope: 1, inversion: 1,
    moat: 1, tension: 2, clarity: 1, network_effect: 1, platform_potential: 1,
    timing: 1, originality_vs_predictions: 2, audacity: 1.5,
  },
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export default tool({
  description:
    "Compute the weighted average score for an app concept evaluated by idea-critic. Takes per-criterion scores (1-10) and the perspective (format/friction/behavior/tension), applies the perspective-specific weight multipliers, computes the weighted average, applies the audacity bonus (final_score +1 if audacity >= 8), and validates approval/rejection rules. Returns a structured verdict so the LLM does not have to do arithmetic.",

  args: {
    perspective: tool.schema
      .string()
      .describe("The perspective: 'format' | 'friction' | 'behavior' | 'tension'"),
    scores: tool.schema
      .object(
        Object.fromEntries(
          CRITERIA.map((c) => [c, tool.schema.number().describe(`Score for ${c} (1-10)`)]),
        ),
      )
      .describe("All 17 criterion scores, each 1-10"),
    custom_weights: tool.schema
      .object(
        Object.fromEntries(
          CRITERIA.map((c) => [c, tool.schema.number().optional().describe(`Override weight for ${c}`)]),
        ),
      )
      .optional()
      .describe("Optional per-criterion weight overrides"),
  },

  async execute(args) {
    const perspective = args.perspective
    const scores = args.scores
    const customWeights = args.custom_weights ?? {}

    const weights = { ...DEFAULT_WEIGHTS[perspective], ...customWeights } as Record<Criterion, number>

    let totalWeighted = 0
    let totalWeight = 0
    const weightedScores: Record<string, number> = {}
    const rawScores: Record<string, number> = {}
    let minRawScore = 10
    let minRawCriterion: Criterion | "" = ""

    for (const criterion of CRITERIA) {
      const rawScore = scores[criterion]
      rawScores[criterion] = rawScore
      if (rawScore < minRawScore) {
        minRawScore = rawScore
        minRawCriterion = criterion
      }
      const weight = weights[criterion]
      totalWeighted += rawScore * weight
      totalWeight += weight
      weightedScores[criterion] = round2(rawScore * weight)
    }

    const weightedAverage = totalWeight > 0 ? round2(totalWeighted / totalWeight) : 0

    const audacityRaw = scores.audacity
    const audacityBonusApplied = audacityRaw >= 8
    const finalScore = audacityBonusApplied ? round2(weightedAverage + 1) : weightedAverage

    const allAbove4 = minRawScore >= 4

    const perspectiveFitRaw = scores.perspective_fit
    const feasibilityRaw = scores.feasibility
    const rejectedReasons: string[] = []

    if (perspectiveFitRaw < 5) {
      rejectedReasons.push(`perspective_fit (${perspectiveFitRaw}) < 5`)
    }
    if (feasibilityRaw < 4) {
      rejectedReasons.push(`feasibility (${feasibilityRaw}) < 4`)
    }

    const violations: string[] = []
    if (!allAbove4) {
      violations.push(`${minRawCriterion} (${minRawScore}) < 4`)
    }

    const moatRaw = scores.moat
    if (moatRaw < 3) {
      const net = scores.network_effect
      const wow = scores.wow_factor
      const aud = scores.audacity
      if (!(net > 7 || wow > 7 || aud >= 8)) {
        violations.push(
          `moat (${moatRaw}) < 3 requires compensation: network_effect=${net} <= 7, wow_factor=${wow} <= 7, audacity=${aud} < 8`,
        )
      }
    }

    const approved = !rejectedReasons.length && violations.length === 0
    const rejected = rejectedReasons.length > 0

    return JSON.stringify({
      perspective,
      raw_scores: rawScores,
      weighted_scores: weightedScores,
      total_weighted: round2(totalWeighted),
      total_weight: round2(totalWeight),
      weighted_average: weightedAverage,
      audacity_bonus_applied: audacityBonusApplied,
      final_score: finalScore,
      min_raw_score: minRawScore,
      all_above_4: allAbove4,
      violations,
      rejected_reasons: rejectedReasons,
      approved,
      rejected,
    })
  },
})
