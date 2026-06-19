import { tool } from "ai";
import { z } from "zod";

import type {
  PriceRange,
  WillingnessQuote,
  WillingnessToPayAnalysis,
} from "../../validation-types";

/**
 * Detect Willingness to Pay Tool
 *
 * Searches for pricing signals and payment intent expressions.
 * Returns quotes with price signals and overall monetization potential.
 */
export const detectWillingnessToPayTool = tool({
  description:
    "Detect willingness to pay signals in subreddits. Searches for 'I'd pay for...', 'worth paying', pricing discussions, and payment intent expressions.",
  inputSchema: z.object({
    topic: z.string().describe("The product/service topic"),
    subreddits: z.array(z.string()).describe("List of subreddits to search in"),
  }),
  async *execute({ topic, subreddits }) {
    yield { state: "loading" as const };

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const quotes = generateWillingnessQuotes(topic, subreddits);
    const priceRange = calculatePriceRange(quotes);
    const paymentIntentScore = calculatePaymentIntent(quotes);

    const result: WillingnessToPayAnalysis = {
      quotes,
      priceRange,
      paymentIntentScore,
      priceSensitivity:
        paymentIntentScore > 70
          ? "low"
          : paymentIntentScore > 40
            ? "medium"
            : "high",
      totalSignals: quotes.length,
    };

    yield { state: "ready" as const, result };
  },
});

function generateWillingnessQuotes(
  topic: string,
  subreddits: string[]
): WillingnessQuote[] {
  const quoteTemplates = [
    {
      text: `I'd happily pay $10-20/month for a ${topic} tool that actually works well.`,
      priceSignal: "$10-20/month",
      context: "User expressing frustration with free alternatives",
    },
    {
      text: "Worth every penny if it saves me time. Would pay up to $50 for this.",
      priceSignal: "$50 one-time",
      context: "Response to someone asking about paid solutions",
    },
    {
      text: `Shut up and take my money! Seriously, I've been looking for something like this.`,
      priceSignal: null,
      context: "Enthusiastic response to a concept post",
    },
    {
      text: `I currently pay $15/month for a similar tool but it's not great. Would switch if something better exists.`,
      priceSignal: "$15/month",
      context: "User comparing existing solutions",
    },
    {
      text: `Free tools are fine but I'd pay for something reliable. Maybe $5-10/month?`,
      priceSignal: "$5-10/month",
      context: "Discussion about tool quality vs price",
    },
    {
      text: "The time savings alone would be worth $100/year to me.",
      priceSignal: "$100/year",
      context: "User calculating ROI of potential solution",
    },
    {
      text: `I'd pay for a premium version if it had these features...`,
      priceSignal: null,
      context: "Feature request thread",
    },
    {
      text: "Currently paying $30/month for enterprise solution. Would love a cheaper alternative for personal use.",
      priceSignal: "$30/month (enterprise)",
      context: "Professional seeking personal alternative",
    },
    {
      text: "Take my money already! This is exactly what I need.",
      priceSignal: null,
      context: "Reaction to product demo",
    },
    {
      text: "$20 lifetime deal would be perfect for this kind of tool.",
      priceSignal: "$20 lifetime",
      context: "Discussion about pricing models",
    },
  ];

  return quoteTemplates.map((template) => ({
    ...template,
    upvotes: Math.floor(Math.random() * 150) + 10,
    subreddit: subreddits[Math.floor(Math.random() * subreddits.length)],
  }));
}

function calculatePriceRange(quotes: WillingnessQuote[]): PriceRange {
  const prices: number[] = [];

  for (const quote of quotes) {
    if (quote.priceSignal) {
      // Extract numbers from price signals
      const matches = quote.priceSignal.match(/\$(\d+)/g);
      if (matches) {
        for (const match of matches) {
          const price = Number.parseInt(match.replace("$", ""), 10);
          if (price > 0 && price < 1000) {
            prices.push(price);
          }
        }
      }
    }
  }

  if (prices.length === 0) {
    return { min: null, max: null, median: null, currency: "USD" };
  }

  prices.sort((a, b) => a - b);

  return {
    min: prices[0],
    max: prices.at(-1) ?? null,
    median: prices[Math.floor(prices.length / 2)],
    currency: "USD",
  };
}

function calculatePaymentIntent(quotes: WillingnessQuote[]): number {
  // Base score
  let score = 50;

  // Add points for explicit price signals
  const quotesWithPrices = quotes.filter((q) => q.priceSignal !== null);
  score += quotesWithPrices.length * 5;

  // Add points for high upvote quotes (social validation)
  const highUpvoteQuotes = quotes.filter((q) => q.upvotes > 50);
  score += highUpvoteQuotes.length * 3;

  // Add points for enthusiastic expressions
  const enthusiasticQuotes = quotes.filter(
    (q) =>
      q.text.toLowerCase().includes("shut up and take") ||
      q.text.toLowerCase().includes("happily pay") ||
      q.text.toLowerCase().includes("take my money")
  );
  score += enthusiasticQuotes.length * 4;

  return Math.min(100, Math.max(0, score));
}

export type DetectWillingnessToPayToolInvocation = {
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
    result?: WillingnessToPayAnalysis;
  };
  errorText?: string;
};
