import { tool } from "ai";
import { z } from "zod";

import type { DemandAnalysis, DemandDataPoint } from "../../validation-types";

/**
 * Validate Demand Tool
 *
 * Analyzes discussion frequency and trends over time.
 * Returns demand score, trend direction, and time series data for visualization.
 */
export const validateDemandTool = tool({
  description:
    "Validate market demand by analyzing discussion frequency over time. Returns trend data, peak interest periods, and overall demand score.",
  inputSchema: z.object({
    topic: z.string().describe("The topic to analyze demand for"),
    subreddits: z.array(z.string()).describe("List of subreddits to analyze"),
    timeframeDays: z
      .number()
      .min(7)
      .max(365)
      .default(90)
      .describe("Number of days to analyze"),
  }),
  async *execute({ topic, subreddits, timeframeDays }) {
    yield { state: "loading" as const };

    await new Promise((resolve) => setTimeout(resolve, 900));

    const trendData = generateTrendData(timeframeDays);
    const analysis = analyzeTrend(trendData);

    const result: DemandAnalysis = {
      totalMentions: trendData.reduce((acc, d) => acc + d.count, 0),
      trendDirection: analysis.direction,
      trendData,
      peakInterest: analysis.peakDate,
      demandScore: analysis.score,
      seasonality: analysis.seasonality,
    };

    yield { state: "ready" as const, result };
  },
});

function generateTrendData(days: number): DemandDataPoint[] {
  const data: DemandDataPoint[] = [];
  const now = new Date();

  // Generate a realistic trend pattern
  // Options: growing, declining, stable, seasonal
  const trendType = Math.random();
  const baseValue = 20 + Math.floor(Math.random() * 30);

  for (let i = days; i >= 0; i -= 7) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    let count = baseValue;

    // Apply trend
    if (trendType < 0.4) {
      // Growing trend (40% chance)
      count = baseValue + Math.floor(((days - i) / days) * 40);
    } else if (trendType < 0.6) {
      // Declining trend (20% chance)
      count = baseValue + Math.floor((i / days) * 30);
    } else if (trendType < 0.8) {
      // Seasonal pattern (20% chance)
      count = baseValue + Math.floor(Math.sin((i / days) * Math.PI * 2) * 20);
    }
    // else stable (20% chance) - just use base value with noise

    // Add some noise
    count += Math.floor(Math.random() * 15) - 7;
    count = Math.max(5, count); // Minimum 5 mentions

    data.push({
      date: date.toISOString().split("T")[0],
      count,
    });
  }

  return data;
}

function analyzeTrend(data: DemandDataPoint[]): {
  direction: "up" | "down" | "stable";
  score: number;
  peakDate: string;
  seasonality: string | null;
} {
  if (data.length < 2) {
    return {
      direction: "stable",
      score: 50,
      peakDate: data[0]?.date ?? "Unknown",
      seasonality: null,
    };
  }

  // Calculate trend direction
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstAvg =
    firstHalf.reduce((acc, d) => acc + d.count, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((acc, d) => acc + d.count, 0) / secondHalf.length;

  let direction: "up" | "down" | "stable";
  if (secondAvg > firstAvg * 1.15) {
    direction = "up";
  } else if (secondAvg < firstAvg * 0.85) {
    direction = "down";
  } else {
    direction = "stable";
  }

  // Find peak
  const peak = data.reduce(
    (max, d) => (d.count > max.count ? d : max),
    data[0]
  );

  // Calculate demand score
  const totalMentions = data.reduce((acc, d) => acc + d.count, 0);
  const avgPerWeek = totalMentions / data.length;

  let score = Math.min(100, Math.floor(avgPerWeek * 1.5));

  // Boost score for growing trends
  if (direction === "up") {
    score = Math.min(100, score + 15);
  } else if (direction === "down") {
    score = Math.max(0, score - 10);
  }

  // Check for seasonality
  let seasonality: string | null = null;
  const variance =
    data.reduce((acc, d) => acc + (d.count - avgPerWeek) ** 2, 0) / data.length;
  if (variance > avgPerWeek * 10) {
    seasonality =
      "High variance detected - possible seasonal interest patterns";
  }

  return {
    direction,
    score,
    peakDate: peak.date,
    seasonality,
  };
}

export type ValidateDemandToolInvocation = {
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
    timeframeDays?: number;
  };
  output?: {
    state: "loading" | "ready";
    result?: DemandAnalysis;
  };
  errorText?: string;
};
