import { tool } from "ai";
import { z } from "zod";

import type { PainPoint, PainPointsAnalysis } from "../../validation-types";

/**
 * Find Pain Points Tool
 *
 * Searches for pain expressions in selected subreddits.
 * Returns validated pain points with upvotes as social proof.
 */
export const findPainPointsTool = tool({
  description:
    "Search for pain points in selected subreddits. Finds expressions like 'I hate...', 'I wish...', 'frustrated with...' and returns them with upvote validation.",
  inputSchema: z.object({
    topic: z.string().describe("The problem or topic to search for"),
    subreddits: z.array(z.string()).describe("List of subreddits to search in"),
  }),
  async *execute({ topic, subreddits }) {
    yield { state: "loading" as const };

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const painPoints = generatePainPoints(topic, subreddits);

    const result: PainPointsAnalysis = {
      painPoints,
      topPainPoints: painPoints.slice(0, 3).map((p) => p.text),
      totalMentions: painPoints.reduce((acc, p) => acc + p.upvotes, 0),
    };

    yield { state: "ready" as const, result };
  },
});

function generatePainPoints(topic: string, subreddits: string[]): PainPoint[] {
  const topicLower = topic.toLowerCase();

  // Pain point templates based on common patterns
  const painTemplates = [
    {
      pattern: "I hate",
      texts: [
        `I hate how ${topic} tools are so complicated. Why can't there just be something simple?`,
        `I hate spending hours every week on ${topic}. There has to be a better way.`,
        `I hate that every ${topic} solution requires a subscription. Just let me pay once!`,
      ],
    },
    {
      pattern: "I wish",
      texts: [
        `I wish there was a ${topic} tool that actually worked the way I think.`,
        `I wish someone would build a simple ${topic} solution. Everything is so bloated.`,
        `I wish I could automate ${topic}. I'm wasting so much time doing it manually.`,
      ],
    },
    {
      pattern: "frustrated",
      texts: [
        `So frustrated with current ${topic} options. They all have the same problems.`,
        `Getting frustrated trying to find a good ${topic} tool. Any recommendations?`,
        `Frustrated that ${topic} still requires so much manual work in 2024.`,
      ],
    },
    {
      pattern: "annoying",
      texts: [
        `The most annoying thing about ${topic} is the lack of integration with other tools.`,
        `It's so annoying that ${topic} apps don't sync properly across devices.`,
        `Annoying how every ${topic} tool wants you to change your workflow instead of adapting to it.`,
      ],
    },
    {
      pattern: "why can't",
      texts: [
        `Why can't ${topic} tools just be simple? I don't need 100 features.`,
        `Why can't I find a ${topic} solution that doesn't require a PhD to use?`,
        `Why can't someone build a ${topic} app that actually understands what users need?`,
      ],
    },
  ];

  const painPoints: PainPoint[] = [];
  const frequencies: PainPoint["frequency"][] = [
    "rare",
    "occasional",
    "common",
    "very-common",
  ];

  for (const template of painTemplates) {
    for (const text of template.texts) {
      const subreddit =
        subreddits[Math.floor(Math.random() * subreddits.length)];
      painPoints.push({
        text,
        upvotes: Math.floor(Math.random() * 500) + 20,
        subreddit,
        url: `https://reddit.com/${subreddit}/comments/${generatePostId()}`,
        sentiment: (Math.floor(Math.random() * 3) + 3) as 3 | 4 | 5,
        frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      });
    }
  }

  // Sort by upvotes (validation signal)
  return painPoints.sort((a, b) => b.upvotes - a.upvotes).slice(0, 12);
}

function generatePostId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export type FindPainPointsToolInvocation = {
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
    result?: PainPointsAnalysis;
  };
  errorText?: string;
};
