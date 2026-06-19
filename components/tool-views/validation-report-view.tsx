"use client";

import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  LightbulbIcon,
  RocketIcon,
  ShieldAlertIcon,
  TargetIcon,
  TrendingUpIcon,
  XCircleIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { ValidationReport } from "../../lib/validation-types";

type ValidationReportViewProps = {
  result: ValidationReport;
};

export function ValidationReportView({ result }: ValidationReportViewProps) {
  const getVerdictConfig = () => {
    switch (result.verdict) {
      case "strong-go":
        return {
          icon: RocketIcon,
          label: "STRONG GO",
          color: "#10b981",
          description:
            "This idea shows strong validation signals. Consider moving forward.",
        };
      case "go":
        return {
          icon: TrendingUpIcon,
          label: "GO",
          color: "#22c55e",
          description:
            "Good validation signals. Worth pursuing with some additional research.",
        };
      case "conditional":
        return {
          icon: AlertTriangleIcon,
          label: "CONDITIONAL",
          color: "#f59e0b",
          description:
            "Mixed signals. Needs more validation before committing resources.",
        };
      case "no-go":
        return {
          icon: XCircleIcon,
          label: "NO GO",
          color: "#ef4444",
          description:
            "Weak validation signals. Consider pivoting or exploring alternatives.",
        };
      default:
        return {
          icon: AlertTriangleIcon,
          label: "UNKNOWN",
          color: "#6b7280",
          description: "Unable to determine validation status.",
        };
    }
  };

  const verdict = getVerdictConfig();
  const VerdictIcon = verdict.icon;

  const getScoreColor = (score: number): string => {
    if (score >= 70) return "#10b981";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />;
      case "weakness":
        return <XCircleIcon className="h-3.5 w-3.5 text-red-500" />;
      case "opportunity":
        return <LightbulbIcon className="h-3.5 w-3.5 text-amber-500" />;
      case "threat":
        return <ShieldAlertIcon className="h-3.5 w-3.5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Verdict Header */}
      <div
        className="relative overflow-hidden rounded border p-6"
        style={{
          borderColor: `${verdict.color}40`,
          backgroundColor: `${verdict.color}08`,
        }}
      >
        {/* Corner brackets */}
        <div
          className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2"
          style={{ borderColor: verdict.color }}
        />
        <div
          className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2"
          style={{ borderColor: verdict.color }}
        />
        <div
          className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2"
          style={{ borderColor: verdict.color }}
        />
        <div
          className="absolute right-0 bottom-0 h-4 w-4 border-r-2 border-b-2"
          style={{ borderColor: verdict.color }}
        />

        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${verdict.color}20` }}
          >
            <VerdictIcon className="h-7 w-7" style={{ color: verdict.color }} />
          </div>
          <div className="flex-1">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              VERDICT
            </p>
            <p
              className="font-bold font-mono text-2xl tracking-tight"
              style={{ color: verdict.color }}
            >
              {verdict.label}
            </p>
            <p className="text-muted-foreground text-sm">
              {verdict.description}
            </p>
          </div>
          <div className="text-right">
            <p
              className="font-bold font-mono text-4xl"
              style={{ color: getScoreColor(result.scores.overallScore) }}
            >
              {result.scores.overallScore}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">
              OVERALL SCORE
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {result.confidence}% confidence
            </p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TargetIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium font-mono text-[10px] uppercase tracking-widest">
            Score Breakdown
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Problem", score: result.scores.problemScore },
            { label: "Market Size", score: result.scores.marketSizeScore },
            { label: "Monetization", score: result.scores.monetizationScore },
            { label: "Competition", score: result.scores.competitionScore },
          ].map((item) => (
            <div
              className="rounded border border-border/50 bg-muted/30 p-3"
              key={item.label}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                  {item.label}
                </span>
                <span
                  className="font-bold font-mono text-lg"
                  style={{ color: getScoreColor(item.score) }}
                >
                  {item.score}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.score}%`,
                    backgroundColor: getScoreColor(item.score),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded border border-border/50 bg-muted/30 p-4">
        <p className="text-sm leading-relaxed">{result.summary}</p>
      </div>

      {/* Key Insights */}
      {result.keyInsights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <LightbulbIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium font-mono text-[10px] uppercase tracking-widest">
              Key Insights
            </span>
          </div>
          <div className="space-y-2">
            {result.keyInsights.map((insight, index) => (
              <div
                className="flex items-start gap-2 rounded border border-border/50 bg-card/50 p-3"
                key={index}
              >
                {getInsightIcon(insight.type)}
                <p className="text-sm">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {result.risks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlertIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium font-mono text-[10px] uppercase tracking-widest">
              Risks
            </span>
          </div>
          <div className="space-y-2">
            {result.risks.map((risk, index) => (
              <div
                className="rounded border border-border/50 bg-card/50 p-3"
                key={index}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{risk.risk}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase",
                      risk.severity === "high"
                        ? "bg-red-500/20 text-red-500"
                        : risk.severity === "medium"
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {risk.severity}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground text-xs">
                  <span className="font-medium">Mitigation:</span>{" "}
                  {risk.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {result.nextSteps.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium font-mono text-[10px] uppercase tracking-widest">
              Next Steps
            </span>
          </div>
          <div className="space-y-2">
            {result.nextSteps.map((step, index) => (
              <div
                className="flex items-center gap-3 rounded border border-border/50 bg-card/50 p-3"
                key={index}
              >
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase",
                    step.priority === "high"
                      ? "bg-orange-500/20 text-orange-500"
                      : step.priority === "medium"
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.priority}
                </span>
                <p className="flex-1 text-sm">{step.action}</p>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground uppercase">
                  {step.effort} effort
                </span>
                <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subreddits Analyzed */}
      <div className="flex flex-wrap items-center gap-2 border-border/50 border-t pt-4">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          ANALYZED:
        </span>
        {result.subredditsAnalyzed.map((sub) => (
          <span
            className="rounded border border-border/50 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            key={sub}
          >
            {sub}
          </span>
        ))}
      </div>
    </div>
  );
}
