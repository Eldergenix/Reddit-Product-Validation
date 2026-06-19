import { tool } from "ai";
import { z } from "zod";

import type {
  EarlyAdopter,
  EarlyAdopterAnalysis,
} from "../../validation-types";

/**
 * Find Early Adopters Tool
 *
 * Identifies users actively seeking solutions and posting frequently.
 * Returns user profiles with engagement scores and reach strategy.
 */
export const findEarlyAdoptersTool = tool({
  description:
    "Find potential early adopters who are actively seeking solutions. Returns users with high engagement, their interests, and a strategy to reach them.",
  inputSchema: z.object({
    topic: z.string().describe("The problem/solution topic"),
    subreddits: z.array(z.string()).describe("List of subreddits to search in"),
  }),
  async *execute({ topic, subreddits }) {
    yield { state: "loading" as const };

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const users = generateEarlyAdopters(topic, subreddits);
    const activeSubreddits = identifyActiveSubreddits(subreddits);
    const reachStrategy = generateReachStrategy(topic, activeSubreddits);

    const result: EarlyAdopterAnalysis = {
      users,
      activeSubreddits,
      totalPotentialAdopters: Math.floor(Math.random() * 5000) + 1000,
      reachStrategy,
    };

    yield { state: "ready" as const, result };
  },
});

function generateEarlyAdopters(
  topic: string,
  subreddits: string[]
): EarlyAdopter[] {
  const userTemplates = [
    {
      username: "power_user_pro",
      interests: ["productivity", "automation", "efficiency"],
      postTitles: [
        "Looking for a better solution to X",
        "Why don't tools do Y?",
        "Built my own workaround for Z",
      ],
    },
    {
      username: "indie_builder_42",
      interests: ["startups", "side-projects", "bootstrapping"],
      postTitles: [
        "Anyone else frustrated with current options?",
        "Would pay for this feature",
        "Testing new workflow - feedback wanted",
      ],
    },
    {
      username: "tech_enthusiast_dev",
      interests: ["technology", "early-adopter", "beta-testing"],
      postTitles: [
        "Always looking for new tools to try",
        "Beta tested this - here's my review",
        "Comparison: Tool A vs Tool B",
      ],
    },
    {
      username: "efficiency_seeker",
      interests: ["optimization", "time-saving", "workflows"],
      postTitles: [
        "How I optimized my workflow",
        "Time audit revealed I need better tools",
        "ROI of switching tools: my experience",
      ],
    },
    {
      username: "community_mod_helper",
      interests: ["community", "moderation", "organization"],
      postTitles: [
        "Running a survey on tool preferences",
        "Community poll: What features matter most?",
        "Aggregated feedback from our users",
      ],
    },
    {
      username: "feedback_giver_99",
      interests: ["product-feedback", "ux-design", "feature-requests"],
      postTitles: [
        "Detailed review after 6 months of use",
        "Feature request: Here's what I need",
        "UX issues with current solution",
      ],
    },
  ];

  return userTemplates.map((template) => ({
    username: template.username,
    postCount: Math.floor(Math.random() * 50) + 10,
    commentCount: Math.floor(Math.random() * 200) + 30,
    engagementScore: Math.floor(Math.random() * 40) + 60,
    interests: template.interests,
    samplePosts: template.postTitles.map((title) => ({
      title,
      subreddit: subreddits[Math.floor(Math.random() * subreddits.length)],
      url: `https://reddit.com/r/${subreddits[0]}/comments/${Math.random().toString(36).substring(2, 8)}`,
    })),
  }));
}

function identifyActiveSubreddits(subreddits: string[]): string[] {
  // Return subreddits sorted by "activity" (simulated)
  return subreddits
    .map((sub) => ({ name: sub, activity: Math.random() }))
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 5)
    .map((s) => s.name);
}

function generateReachStrategy(
  topic: string,
  activeSubreddits: string[]
): string {
  const topSubreddit = activeSubreddits[0] ?? "r/startups";

  return `To reach early adopters for ${topic}:

1. **Engage authentically** in ${topSubreddit} by providing value before promoting
2. **Post "Show HN" style** launches in ${activeSubreddits.slice(0, 3).join(", ")}
3. **Offer early access** or beta invites to active commenters
4. **Create valuable content** that addresses pain points discovered in research
5. **Build in public** - share progress updates and get feedback
6. **Direct outreach** to users who posted about the problem (respect Reddit rules)`;
}

export type FindEarlyAdoptersToolInvocation = {
  state:
    | "loading"
    | "ready"
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: {
    topic: string;
    subreddits: string[];
  };
  output?: {
    state: "loading" | "ready";
    result?: EarlyAdopterAnalysis;
  };
  errorText?: string;
};
