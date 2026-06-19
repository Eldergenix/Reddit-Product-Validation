"use client";

import { AlertTriangleIcon, PackageIcon, TrendingUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ExistingSolutionsAnalysis } from "../../lib/validation-types";

type SolutionsViewProps = {
  result: ExistingSolutionsAnalysis;
};

export function SolutionsView({ result }: SolutionsViewProps) {
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case "positive":
        return "#10b981";
      case "negative":
        return "#ef4444";
      case "mixed":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const maxMentions = Math.max(...result.solutions.map((s) => s.mentionCount));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-500/10">
            <PackageIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-medium font-mono text-sm uppercase tracking-wide">
              Existing Solutions
            </h4>
            <p className="font-mono text-muted-foreground text-xs">
              {result.totalSolutionsMentioned.toLocaleString()} mentions
              analyzed
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold font-mono text-2xl text-blue-500">
            {result.solutions.length}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground uppercase">
            COMPETITORS
          </p>
        </div>
      </div>

      {/* Solution Bar Chart */}
      <div className="space-y-3">
        {result.solutions.map((solution, index) => {
          const barWidth = (solution.mentionCount / maxMentions) * 100;

          return (
            <div
              className="rounded border border-border/50 bg-card/50 p-3"
              key={index}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{solution.name}</span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase"
                    style={{
                      backgroundColor: `${getSentimentColor(solution.sentiment)}20`,
                      color: getSentimentColor(solution.sentiment),
                    }}
                  >
                    {solution.sentiment}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-muted-foreground text-xs">
                  <span>{solution.mentionCount} mentions</span>
                  <span className="text-foreground">
                    {solution.marketShare}%
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-5 w-full overflow-hidden rounded bg-muted/50">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-blue-500/60 transition-all"
                  style={{ width: `${barWidth}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="font-mono text-[10px] text-foreground/80">
                    {solution.marketShare}% market share
                  </span>
                </div>
              </div>

              {/* Sample Quote */}
              {solution.quotes[0] && (
                <p className="mt-2 font-mono text-muted-foreground text-xs italic">
                  "{solution.quotes[0].text}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Market Gaps */}
      {result.marketGaps.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
            <span className="font-medium font-mono text-[10px] uppercase tracking-widest">
              Market Gaps
            </span>
          </div>
          <div className="space-y-2">
            {result.marketGaps.map((gap, index) => (
              <div
                className="flex items-start justify-between gap-3 rounded border border-emerald-500/20 bg-emerald-500/5 p-3"
                key={index}
              >
                <p className="text-sm">{gap.description}</p>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase",
                    gap.opportunity === "high"
                      ? "bg-emerald-500/20 text-emerald-500"
                      : gap.opportunity === "medium"
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {gap.opportunity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Weaknesses */}
      {result.competitorWeaknesses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
            <span className="font-medium font-mono text-[10px] uppercase tracking-widest">
              Competitor Weaknesses
            </span>
          </div>
          <ul className="space-y-1 rounded border border-border/50 bg-muted/30 p-3">
            {result.competitorWeaknesses.slice(0, 4).map((weakness, index) => (
              <li
                className="flex items-start gap-2 text-muted-foreground text-sm"
                key={index}
              >
                <span className="font-mono text-amber-500/60">•</span>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
