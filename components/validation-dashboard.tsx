"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  DollarSignIcon,
  FlameIcon,
  PackageIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import type {
  DemandAnalysis,
  EarlyAdopterAnalysis,
  ExistingSolutionsAnalysis,
  PainPointsAnalysis,
  ValidationReport,
  WillingnessToPayAnalysis,
} from "../lib/validation-types";
import { DemandView } from "./tool-views/demand-view";
import { EarlyAdoptersView } from "./tool-views/early-adopters-view";
import { PainPointsView } from "./tool-views/pain-points-view";
import { SolutionsView } from "./tool-views/solutions-view";
import { ValidationReportView } from "./tool-views/validation-report-view";
import { WillingnessToPayView } from "./tool-views/willingness-to-pay-view";

// ============================================================================
// TYPES
// ============================================================================

type ValidationDashboardProps = {
  idea: string;
  selectedSubreddits: string[];
  onReset: () => void;
};

type AnalysisResults = {
  painPoints: PainPointsAnalysis | null;
  solutions: ExistingSolutionsAnalysis | null;
  willingness: WillingnessToPayAnalysis | null;
  demand: DemandAnalysis | null;
  earlyAdopters: EarlyAdopterAnalysis | null;
  report: ValidationReport | null;
};

type ToolStatus = "pending" | "loading" | "complete";

type MessagePart = {
  type: string;
  text?: string;
  toolName?: string;
  output?: unknown;
  [key: string]: unknown;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const ANALYSIS_MODULES = [
  {
    id: "painPoints",
    tool: "findPainPoints",
    title: "PAIN POINTS",
    subtitle: "User frustrations",
    icon: FlameIcon,
    accentColor: "var(--module-pain)",
    glowColor: "rgba(239, 68, 68, 0.4)",
  },
  {
    id: "solutions",
    tool: "analyzeExistingSolutions",
    title: "SOLUTIONS",
    subtitle: "Market alternatives",
    icon: PackageIcon,
    accentColor: "var(--module-solutions)",
    glowColor: "rgba(59, 130, 246, 0.4)",
  },
  {
    id: "willingness",
    tool: "detectWillingnessToPay",
    title: "PAYMENT INTENT",
    subtitle: "Pricing signals",
    icon: DollarSignIcon,
    accentColor: "var(--module-payment)",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    id: "demand",
    tool: "validateDemand",
    title: "DEMAND",
    subtitle: "Market trends",
    icon: TrendingUpIcon,
    accentColor: "var(--module-demand)",
    glowColor: "rgba(168, 85, 247, 0.4)",
  },
  {
    id: "earlyAdopters",
    tool: "findEarlyAdopters",
    title: "EARLY ADOPTERS",
    subtitle: "Target users",
    icon: UsersIcon,
    accentColor: "var(--module-adopters)",
    glowColor: "rgba(236, 72, 153, 0.4)",
  },
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ValidationDashboard({
  idea,
  selectedSubreddits,
  onReset,
}: ValidationDashboardProps) {
  const [results, setResults] = useState<AnalysisResults>({
    painPoints: null,
    solutions: null,
    willingness: null,
    demand: null,
    earlyAdopters: null,
    report: null,
  });

  const [toolStatus, setToolStatus] = useState<Record<string, ToolStatus>>({
    findPainPoints: "pending",
    analyzeExistingSolutions: "pending",
    detectWillingnessToPay: "pending",
    validateDemand: "pending",
    findEarlyAdopters: "pending",
    generateValidationReport: "pending",
  });

  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/reddit-validation-agent",
      credentials: "include",
      body: {
        ideaContext: idea,
        selectedSubreddits,
        phase: "analysis",
      },
    }),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Extract tool results from messages
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts as MessagePart[]) {
        if (!part.type.startsWith("tool-")) continue;

        const toolName = part.type.replace("tool-", "");
        const output = part.output as
          | { state?: string; result?: unknown }
          | undefined;

        if (!output) continue;

        if (output.state === "loading") {
          setToolStatus((prev) => ({ ...prev, [toolName]: "loading" }));
        }

        if (output.state === "ready" && output.result) {
          setToolStatus((prev) => ({ ...prev, [toolName]: "complete" }));

          switch (toolName) {
            case "findPainPoints":
              setResults((prev) => ({
                ...prev,
                painPoints: output.result as PainPointsAnalysis,
              }));
              break;
            case "analyzeExistingSolutions":
              setResults((prev) => ({
                ...prev,
                solutions: output.result as ExistingSolutionsAnalysis,
              }));
              break;
            case "detectWillingnessToPay":
              setResults((prev) => ({
                ...prev,
                willingness: output.result as WillingnessToPayAnalysis,
              }));
              break;
            case "validateDemand":
              setResults((prev) => ({
                ...prev,
                demand: output.result as DemandAnalysis,
              }));
              break;
            case "findEarlyAdopters":
              setResults((prev) => ({
                ...prev,
                earlyAdopters: output.result as EarlyAdopterAnalysis,
              }));
              break;
            case "generateValidationReport":
              setResults((prev) => ({
                ...prev,
                report: output.result as ValidationReport,
              }));
              break;
            default:
              break;
          }
        }
      }
    }
  }, [messages]);

  // Auto-start analysis on mount
  useEffect(() => {
    if (messages.length === 0 && selectedSubreddits.length > 0) {
      sendMessage({
        text: `Validate this startup idea: "${idea}"\n\nAnalyze these subreddits: ${selectedSubreddits.join(", ")}\n\nRun a comprehensive analysis: find pain points, existing solutions, willingness to pay, demand trends, and early adopters. Then generate a validation report.`,
      });
    }
  }, []);

  // Calculate progress
  const completedCount = Object.values(toolStatus).filter(
    (s) => s === "complete"
  ).length;
  const totalTools = Object.keys(toolStatus).length;
  const progress = Math.round((completedCount / totalTools) * 100);
  const isComplete = completedCount === totalTools;
  const isAnalyzing = status === "streaming" || completedCount < totalTools;

  // Expanded module view
  if (expandedModule) {
    const result = results[expandedModule as keyof AnalysisResults];
    return (
      <div
        className="validation-dashboard min-h-[600px] p-6"
        style={
          {
            "--module-pain": "#ef4444",
            "--module-solutions": "#3b82f6",
            "--module-payment": "#10b981",
            "--module-demand": "#a855f7",
            "--module-adopters": "#ec4899",
          } as React.CSSProperties
        }
      >
        <button
          className="mb-4 flex items-center gap-2 font-mono text-muted-foreground text-xs uppercase tracking-widest transition-colors hover:text-foreground"
          onClick={() => setExpandedModule(null)}
          type="button"
        >
          <span className="text-primary">←</span> Back to Mission Control
        </button>
        {result && renderExpandedView(expandedModule, result as ModuleResult)}
      </div>
    );
  }

  return (
    <div
      className="validation-dashboard relative min-h-[600px] overflow-hidden"
      style={
        {
          "--module-pain": "#ef4444",
          "--module-solutions": "#3b82f6",
          "--module-payment": "#10b981",
          "--module-demand": "#a855f7",
          "--module-adopters": "#ec4899",
        } as React.CSSProperties
      }
    >
      {/* Background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-20 space-y-6 p-6">
        {/* Mission Status Header */}
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  isComplete
                    ? "bg-emerald-500"
                    : isAnalyzing
                      ? "animate-pulse bg-orange-500"
                      : "bg-muted"
                )}
              />
              <span className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
                {isComplete
                  ? "COMPLETE"
                  : isAnalyzing
                    ? "ANALYZING"
                    : "STANDBY"}
              </span>
            </div>

            {/* Mission title */}
            <h2 className="max-w-md font-semibold text-foreground text-lg leading-tight tracking-tight">
              {idea.length > 60 ? `${idea.slice(0, 60)}...` : idea}
            </h2>

            {/* Target subreddits */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                TARGETS:
              </span>
              {selectedSubreddits.map((sub) => (
                <span
                  className="rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] text-orange-500"
                  key={sub}
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Progress Circle */}
          <div className="relative flex flex-col items-center">
            <div className="relative h-20 w-20">
              <svg className="-rotate-90 h-20 w-20" viewBox="0 0 80 80">
                <circle
                  className="text-muted/30"
                  cx="40"
                  cy="40"
                  fill="none"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  className={cn(
                    "transition-all duration-500",
                    isComplete ? "text-emerald-500" : "text-orange-500"
                  )}
                  cx="40"
                  cy="40"
                  fill="none"
                  r="36"
                  stroke="currentColor"
                  strokeDasharray={`${progress * 2.26} 226`}
                  strokeLinecap="round"
                  strokeWidth="4"
                  style={{
                    filter: isComplete
                      ? "drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))"
                      : "drop-shadow(0 0 6px rgba(249, 115, 22, 0.5))",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "font-bold font-mono text-2xl tabular-nums",
                    isComplete ? "text-emerald-500" : "text-foreground"
                  )}
                >
                  {progress}
                </span>
                <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">
                  PERCENT
                </span>
              </div>
            </div>
            <span className="mt-1 font-mono text-[10px] text-muted-foreground">
              {completedCount}/{totalTools} MODULES
            </span>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 rounded border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangleIcon className="h-4 w-4 text-red-500" />
            <p className="font-mono text-red-400 text-sm">{error.message}</p>
          </div>
        )}

        {/* Validation Score Hero */}
        {results.report && <ValidationScoreHero report={results.report} />}

        {/* Analysis Modules Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ANALYSIS_MODULES.map((module, index) => (
            <ModuleCard
              index={index}
              key={module.id}
              module={module}
              onExpand={() => setExpandedModule(module.id)}
              result={results[module.id as ModuleId] as ModuleResult}
              status={toolStatus[module.tool]}
            />
          ))}
        </div>

        {/* Insights & Risks (from report) */}
        {results.report && <InsightsPanel report={results.report} />}

        {/* Reset */}
        {isComplete && (
          <div className="flex justify-center pt-2">
            <button
              className="group flex items-center gap-2 font-mono text-muted-foreground text-xs uppercase tracking-widest transition-colors hover:text-foreground"
              onClick={onReset}
              type="button"
            >
              <ZapIcon className="group-hover:-translate-x-0.5 h-3 w-3 transition-transform" />
              New Mission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VALIDATION SCORE HERO
// ============================================================================

function ValidationScoreHero({ report }: { report: ValidationReport }) {
  const getVerdictConfig = () => {
    switch (report.verdict) {
      case "strong-go":
        return {
          label: "STRONG GO",
          color: "#10b981",
          bgGlow: "rgba(16, 185, 129, 0.15)",
        };
      case "go":
        return {
          label: "GO",
          color: "#22c55e",
          bgGlow: "rgba(34, 197, 94, 0.15)",
        };
      case "conditional":
        return {
          label: "CONDITIONAL",
          color: "#f59e0b",
          bgGlow: "rgba(245, 158, 11, 0.15)",
        };
      case "no-go":
        return {
          label: "NO GO",
          color: "#ef4444",
          bgGlow: "rgba(239, 68, 68, 0.15)",
        };
      default:
        return {
          label: "UNKNOWN",
          color: "#6b7280",
          bgGlow: "rgba(107, 114, 128, 0.15)",
        };
    }
  };

  const verdict = getVerdictConfig();

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border/50 p-6"
      style={{ background: verdict.bgGlow }}
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

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        {/* Verdict */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: `${verdict.color}20`,
              boxShadow: `0 0 30px ${verdict.color}40`,
            }}
          >
            <TargetIcon className="h-8 w-8" style={{ color: verdict.color }} />
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              VERDICT
            </p>
            <p
              className="font-bold font-mono text-2xl tracking-tight"
              style={{ color: verdict.color }}
            >
              {verdict.label}
            </p>
            <p className="font-mono text-muted-foreground text-xs">
              {report.confidence}% confidence
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-6">
          <ScoreGauge label="OVERALL" score={report.scores.overallScore} />
          <div className="hidden gap-4 sm:flex">
            <MiniScore label="Problem" score={report.scores.problemScore} />
            <MiniScore label="Market" score={report.scores.marketSizeScore} />
            <MiniScore
              label="Revenue"
              score={report.scores.monetizationScore}
            />
            <MiniScore
              label="Competition"
              score={report.scores.competitionScore}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="mt-4 border-border/50 border-t pt-4 text-muted-foreground text-sm leading-relaxed">
        {report.summary}
      </p>
    </div>
  );
}

function ScoreGauge({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-16 w-16">
        <svg className="-rotate-90 h-16 w-16" viewBox="0 0 64 64">
          <circle
            className="text-muted/20"
            cx="32"
            cy="32"
            fill="none"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="32"
            fill="none"
            r="28"
            stroke={color}
            strokeDasharray={`${score * 1.76} 176`}
            strokeLinecap="round"
            strokeWidth="6"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold font-mono text-xl tabular-nums"
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

function MiniScore({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="font-mono font-semibold text-sm tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
      <span className="font-mono text-[8px] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// MODULE CARD
// ============================================================================

type ModuleResult =
  | PainPointsAnalysis
  | ExistingSolutionsAnalysis
  | WillingnessToPayAnalysis
  | DemandAnalysis
  | EarlyAdopterAnalysis
  | null;

type ModuleId =
  | "painPoints"
  | "solutions"
  | "willingness"
  | "demand"
  | "earlyAdopters";

type ModuleCardProps = {
  module: (typeof ANALYSIS_MODULES)[number];
  status: ToolStatus;
  result: ModuleResult;
  index: number;
  onExpand: () => void;
};

function ModuleCard({
  module,
  status,
  result,
  index,
  onExpand,
}: ModuleCardProps) {
  const Icon = module.icon;
  const isActive = status === "loading";
  const isComplete = status === "complete";

  return (
    <button
      className={cn(
        "group relative flex flex-col overflow-hidden rounded border border-border/50 bg-card/50 p-4 text-left transition-colors",
        isComplete && "cursor-pointer hover:border-border hover:bg-card",
        status === "pending" && "opacity-40"
      )}
      disabled={!isComplete}
      onClick={isComplete ? onExpand : undefined}
      type="button"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded"
          style={{ background: `${module.accentColor}20` }}
        >
          <Icon className="h-4 w-4" style={{ color: module.accentColor }} />
        </div>

        {/* Status light */}
        <div className="flex items-center gap-1.5">
          {isActive && (
            <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">
              SCAN
            </span>
          )}
          <div
            className={cn("h-1.5 w-1.5 rounded-full transition-colors", {
              "bg-muted": status === "pending",
              "animate-pulse bg-orange-500": isActive,
              "bg-emerald-500": isComplete,
            })}
          />
        </div>
      </div>

      {/* Title */}
      <div className="relative mt-3">
        <p
          className="font-medium font-mono text-xs tracking-wide"
          style={{ color: isComplete ? module.accentColor : undefined }}
        >
          {module.title}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {module.subtitle}
        </p>
      </div>

      {/* Quick stat when complete */}
      {isComplete && result && (
        <div className="relative mt-3 border-border/50 border-t pt-3">
          {renderQuickStat(module.id, result, module.accentColor)}
          <p className="mt-2 font-mono text-[8px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            CLICK TO EXPAND →
          </p>
        </div>
      )}
    </button>
  );
}

// ============================================================================
// INSIGHTS PANEL
// ============================================================================

function InsightsPanel({ report }: { report: ValidationReport }) {
  const strengths = report.keyInsights.filter((i) => i.type === "strength");
  const weaknesses = report.keyInsights.filter((i) => i.type === "weakness");
  const opportunities = report.keyInsights.filter(
    (i) => i.type === "opportunity"
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Strengths */}
      <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
          <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest">
            STRENGTHS
          </span>
        </div>
        <ul className="space-y-2">
          {strengths.slice(0, 3).map((insight, i) => (
            <li
              className="flex items-start gap-2 text-muted-foreground text-xs"
              key={i}
            >
              <CircleDotIcon className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500/50" />
              {insight.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses */}
      <div className="rounded border border-red-500/20 bg-red-500/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangleIcon className="h-4 w-4 text-red-500" />
          <span className="font-mono text-[10px] text-red-500 uppercase tracking-widest">
            RISKS
          </span>
        </div>
        <ul className="space-y-2">
          {(weaknesses.length > 0
            ? weaknesses
            : report.risks.map((r) => ({ text: r.risk }))
          )
            .slice(0, 3)
            .map((item, i) => (
              <li
                className="flex items-start gap-2 text-muted-foreground text-xs"
                key={i}
              >
                <CircleDotIcon className="mt-0.5 h-3 w-3 shrink-0 text-red-500/50" />
                {item.text}
              </li>
            ))}
        </ul>
      </div>

      {/* Opportunities */}
      <div className="rounded border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-amber-500" />
          <span className="font-mono text-[10px] text-amber-500 uppercase tracking-widest">
            OPPORTUNITIES
          </span>
        </div>
        <ul className="space-y-2">
          {opportunities.slice(0, 3).map((insight, i) => (
            <li
              className="flex items-start gap-2 text-muted-foreground text-xs"
              key={i}
            >
              <CircleDotIcon className="mt-0.5 h-3 w-3 shrink-0 text-amber-500/50" />
              {insight.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function renderQuickStat(
  moduleId: string,
  result: ModuleResult,
  accentColor: string
): React.ReactNode {
  switch (moduleId) {
    case "painPoints": {
      const data = result as PainPointsAnalysis;
      return (
        <div>
          <p
            className="font-bold font-mono text-xl"
            style={{ color: accentColor }}
          >
            {data.painPoints.length}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {data.totalMentions.toLocaleString()} mentions
          </p>
        </div>
      );
    }
    case "solutions": {
      const data = result as ExistingSolutionsAnalysis;
      return (
        <div>
          <p
            className="font-bold font-mono text-xl"
            style={{ color: accentColor }}
          >
            {data.solutions.length}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {data.marketGaps.length} gaps found
          </p>
        </div>
      );
    }
    case "willingness": {
      const data = result as WillingnessToPayAnalysis;
      return (
        <div>
          <p
            className="font-bold font-mono text-xl"
            style={{ color: accentColor }}
          >
            {data.paymentIntentScore}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            intent score
          </p>
        </div>
      );
    }
    case "demand": {
      const data = result as DemandAnalysis;
      return (
        <div>
          <p
            className="font-bold font-mono text-xl"
            style={{ color: accentColor }}
          >
            {data.demandScore}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            demand · {data.trendDirection}
          </p>
        </div>
      );
    }
    case "earlyAdopters": {
      const data = result as EarlyAdopterAnalysis;
      return (
        <div>
          <p
            className="font-bold font-mono text-xl"
            style={{ color: accentColor }}
          >
            ~{data.totalPotentialAdopters.toLocaleString()}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            potential users
          </p>
        </div>
      );
    }
    default:
      return null;
  }
}

function renderExpandedView(
  moduleId: string,
  result: ModuleResult
): React.ReactNode {
  switch (moduleId) {
    case "painPoints":
      return <PainPointsView result={result as PainPointsAnalysis} />;
    case "solutions":
      return <SolutionsView result={result as ExistingSolutionsAnalysis} />;
    case "willingness":
      return (
        <WillingnessToPayView result={result as WillingnessToPayAnalysis} />
      );
    case "demand":
      return <DemandView result={result as DemandAnalysis} />;
    case "earlyAdopters":
      return <EarlyAdoptersView result={result as EarlyAdopterAnalysis} />;
    default:
      return null;
  }
}
