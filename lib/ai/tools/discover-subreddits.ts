import { tool } from "ai";
import { z } from "zod";

import type { Subreddit, SubredditDiscovery } from "../../validation-types";

/**
 * Discover Subreddits Tool
 *
 * Phase 1 tool that finds relevant subreddits for a startup idea.
 * Returns subreddits with relevance scores, subscriber counts, and sample posts.
 */
export const discoverSubredditsTool = tool({
  description:
    "Discover relevant subreddits for a startup idea. Returns communities where the target problem is discussed, with relevance scores and sample posts to help users select which subreddits to analyze.",
  inputSchema: z.object({
    idea: z.string().describe("The startup idea or problem to validate"),
    keywords: z
      .array(z.string())
      .optional()
      .describe("Additional keywords to search for"),
  }),
  async *execute({ idea, keywords }) {
    yield { state: "loading" as const };

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate relevant subreddits based on the idea
    const subreddits = generateSubredditsForIdea(idea, keywords);

    // Sort by relevance and mark top ones as recommended
    const sortedSubreddits = subreddits
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map((sub, index) => ({
        ...sub,
        recommended: index < 4, // Recommend top 4
      }));

    const recommendedSubreddits = sortedSubreddits
      .filter((s) => s.recommended)
      .map((s) => s.name);

    const result: SubredditDiscovery = {
      subreddits: sortedSubreddits,
      recommendedSubreddits,
      reasoning: generateReasoning(idea, recommendedSubreddits),
    };

    yield { state: "ready" as const, result };
  },
});

function generateSubredditsForIdea(
  idea: string,
  keywords?: string[]
): Subreddit[] {
  const ideaLower = idea.toLowerCase();

  // Categorize the idea to return relevant subreddits
  const subredditPools: Record<string, Subreddit[]> = {
    startup: [
      {
        name: "r/startups",
        subscribers: 1_200_000,
        activeUsers: 4500,
        relevanceScore: 92,
        topicMatch: "Startup founders discussing validation, MVPs, and growth",
        samplePosts: [
          "How I validated my SaaS idea in 2 weeks",
          "Looking for feedback on my startup concept",
          "What's the best way to find early adopters?",
        ],
        recommended: false,
      },
      {
        name: "r/Entrepreneur",
        subscribers: 2_100_000,
        activeUsers: 8200,
        relevanceScore: 88,
        topicMatch:
          "Entrepreneurs sharing business ideas and seeking validation",
        samplePosts: [
          "Would you pay for this service?",
          "Idea validation: need honest feedback",
          "How do you know if your idea is worth pursuing?",
        ],
        recommended: false,
      },
      {
        name: "r/SideProject",
        subscribers: 180_000,
        activeUsers: 890,
        relevanceScore: 85,
        topicMatch: "Indie hackers building and validating side projects",
        samplePosts: [
          "Launched my MVP, looking for beta testers",
          "How I found my first 100 users",
          "Pivoted after user feedback - here's what I learned",
        ],
        recommended: false,
      },
      {
        name: "r/indiehackers",
        subscribers: 95_000,
        activeUsers: 620,
        relevanceScore: 90,
        topicMatch: "Indie hackers validating and building products",
        samplePosts: [
          "Revenue milestone: $1k MRR from validation to launch",
          "How I validated my B2B idea on Reddit",
          "Honest feedback needed on my landing page",
        ],
        recommended: false,
      },
    ],
    saas: [
      {
        name: "r/SaaS",
        subscribers: 320_000,
        activeUsers: 1800,
        relevanceScore: 94,
        topicMatch: "SaaS founders discussing product-market fit",
        samplePosts: [
          "What's your biggest pain point with current tools?",
          "How much would you pay for X?",
          "Switched from competitor Y - here's why",
        ],
        recommended: false,
      },
      {
        name: "r/microsaas",
        subscribers: 45_000,
        activeUsers: 340,
        relevanceScore: 86,
        topicMatch: "Micro-SaaS builders sharing validation strategies",
        samplePosts: [
          "Finding a niche: my validation process",
          "Price testing results for my micro-SaaS",
          "How I found paying customers before building",
        ],
        recommended: false,
      },
    ],
    productivity: [
      {
        name: "r/productivity",
        subscribers: 2_800_000,
        activeUsers: 12_000,
        relevanceScore: 78,
        topicMatch: "Users discussing productivity tools and workflows",
        samplePosts: [
          "What app do you wish existed?",
          "Frustrated with current task management apps",
          "I'd pay for a tool that does X",
        ],
        recommended: false,
      },
      {
        name: "r/GetDisciplined",
        subscribers: 980_000,
        activeUsers: 3200,
        relevanceScore: 72,
        topicMatch: "Users seeking better habits and tools",
        samplePosts: [
          "Apps that actually helped me stay focused",
          "Why I stopped using popular app X",
          "Looking for accountability tool recommendations",
        ],
        recommended: false,
      },
    ],
    finance: [
      {
        name: "r/personalfinance",
        subscribers: 18_000_000,
        activeUsers: 45_000,
        relevanceScore: 82,
        topicMatch: "Users discussing financial tools and pain points",
        samplePosts: [
          "Why is budgeting software so complicated?",
          "Finally found a tool that works for me",
          "Would pay for simpler expense tracking",
        ],
        recommended: false,
      },
      {
        name: "r/FinancialPlanning",
        subscribers: 420_000,
        activeUsers: 1500,
        relevanceScore: 76,
        topicMatch: "Financial planning discussions and tool recommendations",
        samplePosts: [
          "Best tools for tracking investments?",
          "Frustrated with my current budgeting app",
          "Looking for automation in financial tracking",
        ],
        recommended: false,
      },
    ],
    health: [
      {
        name: "r/loseit",
        subscribers: 3_500_000,
        activeUsers: 15_000,
        relevanceScore: 80,
        topicMatch: "Weight loss community discussing tools and apps",
        samplePosts: [
          "Why I stopped using MyFitnessPal",
          "Wish there was an app that did X",
          "What calorie tracker do you recommend?",
        ],
        recommended: false,
      },
      {
        name: "r/fitness",
        subscribers: 11_000_000,
        activeUsers: 32_000,
        relevanceScore: 75,
        topicMatch: "Fitness enthusiasts discussing workout tools",
        samplePosts: [
          "Best app for tracking progressive overload?",
          "Frustrated with fitness app subscriptions",
          "Looking for meal prep planning tool",
        ],
        recommended: false,
      },
    ],
    tech: [
      {
        name: "r/webdev",
        subscribers: 2_100_000,
        activeUsers: 8500,
        relevanceScore: 70,
        topicMatch: "Web developers discussing tools and workflows",
        samplePosts: [
          "What developer tool do you wish existed?",
          "Pain points with current deployment tools",
          "Would pay for better documentation tool",
        ],
        recommended: false,
      },
      {
        name: "r/programming",
        subscribers: 5_800_000,
        activeUsers: 18_000,
        relevanceScore: 65,
        topicMatch: "Programmers discussing development tools",
        samplePosts: [
          "Why are code review tools so clunky?",
          "Frustrated with current CI/CD options",
          "Looking for better debugging tools",
        ],
        recommended: false,
      },
    ],
    smallbusiness: [
      {
        name: "r/smallbusiness",
        subscribers: 1_800_000,
        activeUsers: 6500,
        relevanceScore: 84,
        topicMatch: "Small business owners discussing operational challenges",
        samplePosts: [
          "What software do you use for invoicing?",
          "Frustrated with inventory management",
          "Would pay for simpler scheduling tool",
        ],
        recommended: false,
      },
      {
        name: "r/freelance",
        subscribers: 420_000,
        activeUsers: 1800,
        relevanceScore: 79,
        topicMatch: "Freelancers discussing business tools and pain points",
        samplePosts: [
          "Best tool for client management?",
          "Hate tracking billable hours manually",
          "Looking for proposal software recommendations",
        ],
        recommended: false,
      },
    ],
  };

  // Determine which categories are relevant based on the idea
  const relevantCategories: string[] = ["startup"]; // Always include startup

  if (
    ideaLower.includes("saas") ||
    ideaLower.includes("software") ||
    ideaLower.includes("app") ||
    ideaLower.includes("tool")
  ) {
    relevantCategories.push("saas");
  }
  if (
    ideaLower.includes("productivity") ||
    ideaLower.includes("task") ||
    ideaLower.includes("time") ||
    ideaLower.includes("focus")
  ) {
    relevantCategories.push("productivity");
  }
  if (
    ideaLower.includes("finance") ||
    ideaLower.includes("budget") ||
    ideaLower.includes("money") ||
    ideaLower.includes("expense") ||
    ideaLower.includes("invoice")
  ) {
    relevantCategories.push("finance", "smallbusiness");
  }
  if (
    ideaLower.includes("health") ||
    ideaLower.includes("fitness") ||
    ideaLower.includes("meal") ||
    ideaLower.includes("diet") ||
    ideaLower.includes("workout")
  ) {
    relevantCategories.push("health");
  }
  if (
    ideaLower.includes("developer") ||
    ideaLower.includes("code") ||
    ideaLower.includes("programming") ||
    ideaLower.includes("api")
  ) {
    relevantCategories.push("tech");
  }
  if (
    ideaLower.includes("business") ||
    ideaLower.includes("freelance") ||
    ideaLower.includes("client") ||
    ideaLower.includes("invoice")
  ) {
    relevantCategories.push("smallbusiness");
  }

  // If no specific categories matched, add some general ones
  if (relevantCategories.length === 1) {
    relevantCategories.push("saas", "productivity");
  }

  // Collect subreddits from relevant categories
  const result: Subreddit[] = [];
  const seenNames = new Set<string>();

  for (const category of relevantCategories) {
    const pool = subredditPools[category];
    if (pool) {
      for (const sub of pool) {
        if (!seenNames.has(sub.name)) {
          seenNames.add(sub.name);
          // Adjust relevance based on keyword matches
          let adjustedRelevance = sub.relevanceScore;
          const combinedKeywords = [
            ...(keywords ?? []),
            ...idea.toLowerCase().split(" "),
          ];
          for (const keyword of combinedKeywords) {
            if (
              sub.topicMatch.toLowerCase().includes(keyword) ||
              sub.samplePosts.some((p) => p.toLowerCase().includes(keyword))
            ) {
              adjustedRelevance = Math.min(100, adjustedRelevance + 3);
            }
          }
          result.push({
            ...sub,
            relevanceScore: adjustedRelevance,
          });
        }
      }
    }
  }

  return result.slice(0, 8); // Return top 8 subreddits
}

function generateReasoning(idea: string, recommended: string[]): string {
  const subredditList = recommended.join(", ");
  return `Based on "${idea}", I recommend ${subredditList} as primary research sources. These communities have active discussions about similar problems, established validation patterns, and users who actively share their pain points and willingness to pay for solutions.`;
}

export type DiscoverSubredditsToolInvocation = {
  state:
    | "loading"
    | "ready"
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: {
    idea: string;
    keywords?: string[];
  };
  output?: {
    state: "loading" | "ready";
    result?: SubredditDiscovery;
  };
  errorText?: string;
};
