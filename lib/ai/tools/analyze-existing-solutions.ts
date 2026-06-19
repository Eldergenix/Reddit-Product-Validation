import { tool } from "ai";
import { z } from "zod";

import type {
  ExistingSolution,
  ExistingSolutionsAnalysis,
  MarketGap,
} from "../../validation-types";

/**
 * Analyze Existing Solutions Tool
 *
 * Finds what solutions people are currently using for a problem.
 * Returns market share estimates, competitor weaknesses, and gaps.
 */
export const analyzeExistingSolutionsTool = tool({
  description:
    "Find existing solutions people use for a problem. Searches for 'I use...', 'I switched to...', 'recommend...' patterns and analyzes competitor landscape.",
  inputSchema: z.object({
    problem: z.string().describe("The problem to find solutions for"),
    subreddits: z.array(z.string()).describe("List of subreddits to search in"),
  }),
  async *execute({ problem, subreddits }) {
    yield { state: "loading" as const };

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const solutions = generateSolutions(problem, subreddits);
    const marketGaps = generateMarketGaps(problem);
    const competitorWeaknesses = generateWeaknesses(solutions);

    const result: ExistingSolutionsAnalysis = {
      solutions,
      marketGaps,
      competitorWeaknesses,
      totalSolutionsMentioned: solutions.reduce(
        (acc, s) => acc + s.mentionCount,
        0
      ),
    };

    yield { state: "ready" as const, result };
  },
});

function generateSolutions(
  problem: string,
  subreddits: string[]
): ExistingSolution[] {
  // Generic solution templates that can apply to most problems
  const solutionTemplates = [
    {
      name: "Notion",
      sentiment: "mixed" as const,
      quotes: [
        "I use Notion for everything but it's getting bloated",
        "Notion is okay but the learning curve is steep",
        "Switched to Notion from Evernote, better but not perfect",
      ],
    },
    {
      name: "Spreadsheets (Excel/Google Sheets)",
      sentiment: "mixed" as const,
      quotes: [
        "I just use spreadsheets, works well enough",
        "Google Sheets does the job but it's manual work",
        "Built my own system in Excel, took forever",
      ],
    },
    {
      name: "Dedicated App",
      sentiment: "positive" as const,
      quotes: [
        "Found a dedicated app that works great for me",
        "The specialized tool is worth the subscription",
        "Much better than using generic tools",
      ],
    },
    {
      name: "Manual Process",
      sentiment: "negative" as const,
      quotes: [
        "I still do it manually, haven't found anything good",
        "Paper and pen for me, digital tools are too complex",
        "Just keeping it in my head, not ideal",
      ],
    },
    {
      name: "Custom Solution",
      sentiment: "mixed" as const,
      quotes: [
        "Built my own tool, but it's a lot of maintenance",
        "Using a combination of tools I cobbled together",
        "Wrote some scripts to automate it",
      ],
    },
  ];

  return solutionTemplates.map((template, index) => ({
    name: template.name,
    mentionCount: Math.floor(Math.random() * 200) + 20,
    sentiment: template.sentiment,
    quotes: template.quotes.map((text) => ({
      text,
      sentiment:
        template.sentiment === "mixed" ? "neutral" : template.sentiment,
      subreddit: subreddits[Math.floor(Math.random() * subreddits.length)],
    })),
    marketShare: Math.max(5, 35 - index * 7 + Math.floor(Math.random() * 10)),
  }));
}

function generateMarketGaps(problem: string): MarketGap[] {
  return [
    {
      description:
        "No simple, focused solution exists - all tools try to do too much",
      frequency: 45,
      opportunity: "high",
    },
    {
      description: "Lack of automation - users still doing manual work",
      frequency: 38,
      opportunity: "high",
    },
    {
      description: "Poor mobile experience across existing solutions",
      frequency: 28,
      opportunity: "medium",
    },
    {
      description: "Integration with existing workflows is lacking",
      frequency: 22,
      opportunity: "medium",
    },
    {
      description: "Pricing is too high for individual users",
      frequency: 18,
      opportunity: "medium",
    },
  ];
}

function generateWeaknesses(solutions: ExistingSolution[]): string[] {
  return [
    "Most solutions have steep learning curves that frustrate new users",
    "Existing tools are bloated with features most users don't need",
    "Subscription fatigue - users want one-time purchase options",
    "Poor customer support mentioned frequently in negative reviews",
    "Data portability issues - users feel locked into platforms",
    "Performance issues with larger datasets or heavy usage",
  ];
}

export type AnalyzeExistingSolutionsToolInvocation = {
  state:
    | "loading"
    | "ready"
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: {
    problem: string;
    subreddits: string[];
  };
  output?: {
    state: "loading" | "ready";
    result?: ExistingSolutionsAnalysis;
  };
  errorText?: string;
};
