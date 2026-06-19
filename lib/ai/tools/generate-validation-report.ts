import { tool } from "ai";
import { z } from "zod";

import type {
  NextStep,
  ValidationInsight,
  ValidationReport,
  ValidationRisk,
  ValidationScores,
  ValidationVerdict,
} from "../../validation-types";

/**
 * Generate Validation Report Tool
 *
 * Synthesizes all analysis data into a final go/no-go recommendation.
 * Returns comprehensive scorecard with insights, risks, and next steps.
 */
export const generateValidationReportTool = tool({
  description:
    "Generate a comprehensive validation report from all analysis data. Returns go/no-go recommendation, scores, insights, risks, and recommended next steps.",
  inputSchema: z.object({
    topic: z.string().describe("The startup idea being validated"),
    subredditsAnalyzed: z
      .array(z.string())
      .describe("Subreddits that were analyzed"),
    painPointCount: z.number().describe("Number of pain points found"),
    averagePainSentiment: z.number().describe("Average pain intensity (1-5)"),
    solutionCount: z.number().describe("Number of existing solutions found"),
    topCompetitorShare: z.number().describe("Market share of top competitor"),
    paymentIntentScore: z.number().describe("Willingness to pay score (0-100)"),
    priceSensitivity: z
      .enum(["low", "medium", "high"])
      .describe("Price sensitivity level"),
    demandScore: z.number().describe("Demand score (0-100)"),
    trendDirection: z
      .enum(["up", "down", "stable"])
      .describe("Demand trend direction"),
    earlyAdopterCount: z
      .number()
      .describe("Number of potential early adopters"),
  }),
  async *execute({
    topic,
    subredditsAnalyzed,
    painPointCount,
    averagePainSentiment,
    solutionCount,
    topCompetitorShare,
    paymentIntentScore,
    priceSensitivity,
    demandScore,
    trendDirection,
    earlyAdopterCount,
  }) {
    yield { state: "loading" as const };

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Calculate scores
    const scores = calculateScores({
      painPointCount,
      averagePainSentiment,
      solutionCount,
      topCompetitorShare,
      paymentIntentScore,
      demandScore,
      trendDirection,
      earlyAdopterCount,
    });

    // Determine verdict
    const verdict = determineVerdict(scores);

    // Generate insights
    const insights = generateInsights({
      scores,
      painPointCount,
      solutionCount,
      topCompetitorShare,
      paymentIntentScore,
      priceSensitivity,
      trendDirection,
      earlyAdopterCount,
    });

    // Generate risks
    const risks = generateRisks({
      scores,
      topCompetitorShare,
      priceSensitivity,
      trendDirection,
    });

    // Generate next steps
    const nextSteps = generateNextSteps(verdict, scores);

    // Generate summary
    const summary = generateSummary(topic, verdict, scores);

    const result: ValidationReport = {
      scores,
      verdict,
      confidence: calculateConfidence(
        subredditsAnalyzed.length,
        painPointCount
      ),
      keyInsights: insights,
      risks,
      nextSteps,
      subredditsAnalyzed,
      summary,
    };

    yield { state: "ready" as const, result };
  },
});

type ScoreInputs = {
  painPointCount: number;
  averagePainSentiment: number;
  solutionCount: number;
  topCompetitorShare: number;
  paymentIntentScore: number;
  demandScore: number;
  trendDirection: "up" | "down" | "stable";
  earlyAdopterCount: number;
};

function calculateScores(inputs: ScoreInputs): ValidationScores {
  // Problem Score: Based on pain points and sentiment
  const problemScore = Math.min(
    100,
    Math.floor(inputs.painPointCount * 5 + inputs.averagePainSentiment * 10)
  );

  // Market Size Score: Based on demand and early adopters
  const marketSizeScore = Math.min(
    100,
    Math.floor(inputs.demandScore * 0.6 + (inputs.earlyAdopterCount / 50) * 40)
  );

  // Monetization Score: Based on willingness to pay
  const monetizationScore = inputs.paymentIntentScore;

  // Competition Score: Higher = less competition (inverse of competitor dominance)
  const competitionScore = Math.max(0, 100 - inputs.topCompetitorShare);

  // Trend bonus/penalty
  let trendModifier = 0;
  if (inputs.trendDirection === "up") trendModifier = 10;
  if (inputs.trendDirection === "down") trendModifier = -10;

  // Overall Score: Weighted average
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.floor(
        problemScore * 0.3 +
          marketSizeScore * 0.25 +
          monetizationScore * 0.25 +
          competitionScore * 0.2 +
          trendModifier
      )
    )
  );

  return {
    problemScore,
    marketSizeScore,
    monetizationScore,
    competitionScore,
    overallScore,
  };
}

function determineVerdict(scores: ValidationScores): ValidationVerdict {
  if (scores.overallScore >= 75) return "strong-go";
  if (scores.overallScore >= 55) return "go";
  if (scores.overallScore >= 35) return "conditional";
  return "no-go";
}

function generateInsights(data: {
  scores: ValidationScores;
  painPointCount: number;
  solutionCount: number;
  topCompetitorShare: number;
  paymentIntentScore: number;
  priceSensitivity: string;
  trendDirection: string;
  earlyAdopterCount: number;
}): ValidationInsight[] {
  const insights: ValidationInsight[] = [];

  // Strengths
  if (data.scores.problemScore >= 70) {
    insights.push({
      type: "strength",
      text: "Strong problem validation - users are actively expressing pain points",
    });
  }
  if (data.paymentIntentScore >= 60) {
    insights.push({
      type: "strength",
      text: "Good monetization signals - users are willing to pay for solutions",
    });
  }
  if (data.earlyAdopterCount >= 100) {
    insights.push({
      type: "strength",
      text: "Significant early adopter pool identified for initial traction",
    });
  }

  // Weaknesses
  if (data.scores.competitionScore < 40) {
    insights.push({
      type: "weakness",
      text: "Crowded market with established competitors - differentiation critical",
    });
  }
  if (data.priceSensitivity === "high") {
    insights.push({
      type: "weakness",
      text: "High price sensitivity may limit monetization options",
    });
  }

  // Opportunities
  if (data.trendDirection === "up") {
    insights.push({
      type: "opportunity",
      text: "Growing demand trend - good timing to enter market",
    });
  }
  if (data.topCompetitorShare < 50) {
    insights.push({
      type: "opportunity",
      text: "Fragmented market with no dominant player - room for new entrant",
    });
  }

  // Threats
  if (data.trendDirection === "down") {
    insights.push({
      type: "threat",
      text: "Declining interest trend - investigate if problem is being solved elsewhere",
    });
  }

  return insights;
}

function generateRisks(data: {
  scores: ValidationScores;
  topCompetitorShare: number;
  priceSensitivity: string;
  trendDirection: string;
}): ValidationRisk[] {
  const risks: ValidationRisk[] = [];

  if (data.topCompetitorShare > 60) {
    risks.push({
      risk: "Dominant competitor with strong market position",
      severity: "high",
      mitigation: "Focus on underserved niche or unique differentiator",
    });
  }

  if (data.priceSensitivity === "high") {
    risks.push({
      risk: "Price-sensitive market may resist paid solutions",
      severity: "medium",
      mitigation: "Consider freemium model or usage-based pricing",
    });
  }

  if (data.trendDirection === "down") {
    risks.push({
      risk: "Declining market interest",
      severity: "high",
      mitigation: "Validate with direct user interviews before building",
    });
  }

  if (data.scores.problemScore < 50) {
    risks.push({
      risk: "Problem may not be painful enough to drive adoption",
      severity: "medium",
      mitigation: "Focus on users with highest pain intensity",
    });
  }

  // Always include some general risks
  risks.push({
    risk: "Reddit research may not represent broader market",
    severity: "low",
    mitigation: "Supplement with surveys and interviews outside Reddit",
  });

  return risks;
}

function generateNextSteps(
  verdict: ValidationVerdict,
  scores: ValidationScores
): NextStep[] {
  const steps: NextStep[] = [];

  if (verdict === "strong-go" || verdict === "go") {
    steps.push(
      {
        action: "Build landing page and start collecting email signups",
        priority: "high",
        effort: "low",
      },
      {
        action: "Reach out to 10 identified early adopters for interviews",
        priority: "high",
        effort: "medium",
      },
      {
        action: "Create MVP specification based on top pain points",
        priority: "high",
        effort: "medium",
      }
    );
  }

  if (verdict === "conditional") {
    steps.push(
      {
        action: "Conduct user interviews to validate findings",
        priority: "high",
        effort: "medium",
      },
      {
        action: "Test pricing with fake door tests or surveys",
        priority: "high",
        effort: "low",
      },
      {
        action: "Analyze competitor weaknesses in detail",
        priority: "medium",
        effort: "medium",
      }
    );
  }

  if (verdict === "no-go") {
    steps.push(
      {
        action: "Pivot: explore adjacent problems or different market",
        priority: "high",
        effort: "medium",
      },
      {
        action: "Interview users who expressed pain to understand depth",
        priority: "medium",
        effort: "medium",
      },
      {
        action: "Research why existing solutions dominate",
        priority: "low",
        effort: "low",
      }
    );
  }

  // Add scoring-specific steps
  if (scores.monetizationScore < 50) {
    steps.push({
      action:
        "Test different value propositions that might increase willingness to pay",
      priority: "medium",
      effort: "low",
    });
  }

  return steps;
}

function generateSummary(
  topic: string,
  verdict: ValidationVerdict,
  scores: ValidationScores
): string {
  const verdictText = {
    "strong-go": "strongly validated",
    go: "validated with good signals",
    conditional: "shows potential but needs more validation",
    "no-go": "not validated - significant concerns identified",
  };

  return `Based on analysis of Reddit discussions, "${topic}" is ${verdictText[verdict]}. 
Problem score: ${scores.problemScore}/100, Market size: ${scores.marketSizeScore}/100, 
Monetization potential: ${scores.monetizationScore}/100, Competition favorability: ${scores.competitionScore}/100. 
Overall validation score: ${scores.overallScore}/100.`;
}

function calculateConfidence(
  subredditCount: number,
  painPointCount: number
): number {
  // More data sources = higher confidence
  let confidence = 50;

  // Add for subreddits analyzed
  confidence += Math.min(20, subredditCount * 5);

  // Add for pain points found
  confidence += Math.min(30, painPointCount * 3);

  return Math.min(95, confidence);
}

export type GenerateValidationReportToolInvocation = {
  state:
    | "loading"
    | "ready"
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: {
    topic: string;
    subredditsAnalyzed: string[];
    painPointCount: number;
    averagePainSentiment: number;
    solutionCount: number;
    topCompetitorShare: number;
    paymentIntentScore: number;
    priceSensitivity: "low" | "medium" | "high";
    demandScore: number;
    trendDirection: "up" | "down" | "stable";
    earlyAdopterCount: number;
  };
  output?: {
    state: "loading" | "ready";
    result?: ValidationReport;
  };
  errorText?: string;
};
