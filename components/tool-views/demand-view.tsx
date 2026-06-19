"use client";

import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CalendarIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

import type { DemandAnalysis } from "../../lib/validation-types";

type DemandViewProps = {
  result: DemandAnalysis;
};

export function DemandView({ result }: DemandViewProps) {
  const getTrendIcon = () => {
    switch (result.trendDirection) {
      case "up":
        return <ArrowUpIcon className="h-4 w-4 text-emerald-500" />;
      case "down":
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRightIcon className="h-4 w-4 text-amber-500" />;
    }
  };

  const getTrendColor = (): string => {
    switch (result.trendDirection) {
      case "up":
        return "#10b981";
      case "down":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return "#10b981";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  // Format chart data
  const chartData = result.trendData.map((point) => ({
    date: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: point.count,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-purple-500/10">
            <TrendingUpIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h4 className="font-medium font-mono text-sm uppercase tracking-wide">
              Demand Analysis
            </h4>
            <p className="font-mono text-muted-foreground text-xs">
              {result.totalMentions.toLocaleString()} mentions analyzed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded border border-border/50 bg-muted/30 px-2 py-1">
          {getTrendIcon()}
          <span
            className="font-mono text-xs uppercase"
            style={{ color: getTrendColor() }}
          >
            {result.trendDirection === "up"
              ? "Growing"
              : result.trendDirection === "down"
                ? "Declining"
                : "Stable"}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Demand Score */}
        <div
          className="rounded border border-border/50 p-4"
          style={{ backgroundColor: `${getScoreColor(result.demandScore)}10` }}
        >
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            DEMAND SCORE
          </p>
          <div className="mt-1 flex items-end gap-1">
            <span
              className="font-bold font-mono text-3xl"
              style={{ color: getScoreColor(result.demandScore) }}
            >
              {result.demandScore}
            </span>
            <span className="mb-0.5 font-mono text-lg text-muted-foreground">
              /100
            </span>
          </div>
        </div>

        {/* Peak Interest */}
        <div className="rounded border border-border/50 bg-muted/30 p-4">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            PEAK INTEREST
          </p>
          <div className="mt-1 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium font-mono text-sm">
              {new Date(result.peakInterest).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Trend Direction */}
        <div className="rounded border border-border/50 bg-muted/30 p-4">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            TREND
          </p>
          <p
            className="mt-1 font-medium font-mono text-lg capitalize"
            style={{ color: getTrendColor() }}
          >
            {result.trendDirection}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full rounded border border-border/50 bg-muted/10 p-3">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="demandGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              axisLine={false}
              dataKey="date"
              fontFamily="monospace"
              fontSize={10}
              stroke="#6b7280"
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              fontFamily="monospace"
              fontSize={10}
              stroke="#6b7280"
              tickLine={false}
              width={30}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  return (
                    <div className="rounded border border-border/50 bg-background p-2 shadow-sm">
                      <p className="font-medium font-mono text-xs">
                        {payload[0].payload.date}
                      </p>
                      <p className="font-mono text-muted-foreground text-xs">
                        {payload[0].value} mentions
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              dataKey="count"
              fill="url(#demandGradient)"
              fillOpacity={1}
              stroke="#a855f7"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Seasonality Note */}
      {result.seasonality && (
        <div className="rounded border border-border/50 bg-muted/30 p-3">
          <p className="font-mono text-muted-foreground text-xs">
            <span className="font-medium text-foreground">Note:</span>{" "}
            {result.seasonality}
          </p>
        </div>
      )}
    </div>
  );
}
