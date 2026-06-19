"use client";

import { DollarSignIcon, QuoteIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { WillingnessToPayAnalysis } from "../../lib/validation-types";

type WillingnessToPayViewProps = {
  result: WillingnessToPayAnalysis;
};

export function WillingnessToPayView({ result }: WillingnessToPayViewProps) {
  const getIntentColor = (score: number): string => {
    if (score >= 70) return "#10b981";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getSensitivityLabel = (sensitivity: string): string => {
    switch (sensitivity) {
      case "low":
        return "Price tolerant";
      case "medium":
        return "Moderate";
      case "high":
        return "Price sensitive";
      default:
        return "Unknown";
    }
  };

  const intentColor = getIntentColor(result.paymentIntentScore);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-500/10">
            <DollarSignIcon className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-medium font-mono text-sm uppercase tracking-wide">
              Payment Intent
            </h4>
            <p className="font-mono text-muted-foreground text-xs">
              {result.totalSignals} signals detected
            </p>
          </div>
        </div>
      </div>

      {/* Score and Price Range */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Payment Intent Score */}
        <div
          className="rounded border border-border/50 p-4"
          style={{ backgroundColor: `${intentColor}10` }}
        >
          <p className="mb-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            PAYMENT INTENT SCORE
          </p>
          <div className="flex items-end gap-1">
            <span
              className="font-bold font-mono text-4xl"
              style={{ color: intentColor }}
            >
              {result.paymentIntentScore}
            </span>
            <span className="mb-1 font-mono text-lg text-muted-foreground">
              /100
            </span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            {result.paymentIntentScore >= 70
              ? "Strong monetization potential"
              : result.paymentIntentScore >= 40
                ? "Moderate interest in paid solutions"
                : "Limited payment signals found"}
          </p>
        </div>

        {/* Price Range */}
        <div className="rounded border border-border/50 bg-muted/30 p-4">
          <p className="mb-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            MENTIONED PRICE RANGE
          </p>
          {result.priceRange.min !== null && result.priceRange.max !== null ? (
            <>
              <p className="font-bold font-mono text-2xl">
                ${result.priceRange.min} - ${result.priceRange.max}
              </p>
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Median: ${result.priceRange.median} {result.priceRange.currency}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No specific prices mentioned
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              SENSITIVITY
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] uppercase",
                result.priceSensitivity === "low"
                  ? "bg-emerald-500/20 text-emerald-500"
                  : result.priceSensitivity === "medium"
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-red-500/20 text-red-500"
              )}
            >
              {result.priceSensitivity}
            </span>
          </div>
        </div>
      </div>

      {/* Quote Cards */}
      <div className="space-y-2">
        <p className="font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          PAYMENT SIGNALS
        </p>
        <div className="space-y-2">
          {result.quotes.slice(0, 6).map((quote, index) => (
            <div
              className="relative rounded border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card"
              key={index}
            >
              <QuoteIcon className="absolute top-3 right-3 h-4 w-4 text-muted/30" />

              <p className="pr-6 text-sm leading-relaxed">"{quote.text}"</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {quote.subreddit}
                </span>
                {quote.priceSignal && (
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-500">
                    {quote.priceSignal}
                  </span>
                )}
                <span className="font-mono text-[10px] text-muted-foreground">
                  ↑{quote.upvotes}
                </span>
              </div>

              {quote.context && (
                <p className="mt-2 font-mono text-[10px] text-muted-foreground italic">
                  Context: {quote.context}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {result.quotes.length > 6 && (
        <p className="text-center font-mono text-muted-foreground text-xs">
          +{result.quotes.length - 6} more signals
        </p>
      )}
    </div>
  );
}
