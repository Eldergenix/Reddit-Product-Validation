"use client";

import { FlameIcon, MessageSquareQuoteIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PainPointsAnalysis } from "../../lib/validation-types";

type PainPointsViewProps = {
  result: PainPointsAnalysis;
};

export function PainPointsView({ result }: PainPointsViewProps) {
  const getIntensityColor = (sentiment: number): string => {
    if (sentiment >= 4) return "#ef4444";
    if (sentiment >= 3) return "#f59e0b";
    return "#6b7280";
  };

  const getFrequencyLabel = (frequency: string): string => {
    switch (frequency) {
      case "very-common":
        return "HIGH";
      case "common":
        return "MED";
      case "occasional":
        return "LOW";
      default:
        return "LOW";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-red-500/10">
            <FlameIcon className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h4 className="font-medium font-mono text-sm uppercase tracking-wide">
              Pain Points Analysis
            </h4>
            <p className="font-mono text-muted-foreground text-xs">
              {result.totalMentions.toLocaleString()} total mentions
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold font-mono text-2xl text-red-500">
            {result.painPoints.length}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground uppercase">
            FOUND
          </p>
        </div>
      </div>

      {/* Top Pain Points Summary */}
      {result.topPainPoints.length > 0 && (
        <div className="rounded border border-border/50 bg-muted/30 p-4">
          <p className="mb-2 font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            TOP PAIN POINTS
          </p>
          <ul className="space-y-2">
            {result.topPainPoints.map((point, i) => (
              <li className="flex items-start gap-2 text-sm" key={i}>
                <span className="font-mono text-red-500/60">{i + 1}.</span>
                <span>
                  {point.length > 80 ? `${point.slice(0, 80)}...` : point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pain Point Cards */}
      <div className="space-y-2">
        {result.painPoints.slice(0, 8).map((painPoint, index) => (
          <div
            className="group relative rounded border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card"
            key={index}
          >
            {/* Intensity bar */}
            <div
              className="absolute top-0 left-0 h-full w-1 rounded-l"
              style={{
                backgroundColor: getIntensityColor(painPoint.sentiment),
              }}
            />

            <div className="pl-3">
              {/* Meta row */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquareQuoteIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {painPoint.subreddit}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase"
                    style={{
                      backgroundColor: `${getIntensityColor(painPoint.sentiment)}20`,
                      color: getIntensityColor(painPoint.sentiment),
                    }}
                  >
                    {getFrequencyLabel(painPoint.frequency)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ↑{painPoint.upvotes}
                  </span>
                </div>
              </div>

              {/* Quote */}
              <p className="text-sm leading-relaxed">"{painPoint.text}"</p>

              {/* Intensity meter */}
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                  INTENSITY
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      className={cn(
                        "h-1.5 w-3 rounded-sm",
                        i < painPoint.sentiment ? "bg-red-500" : "bg-muted"
                      )}
                      key={i}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {result.painPoints.length > 8 && (
        <p className="text-center font-mono text-muted-foreground text-xs">
          +{result.painPoints.length - 8} more pain points
        </p>
      )}
    </div>
  );
}
