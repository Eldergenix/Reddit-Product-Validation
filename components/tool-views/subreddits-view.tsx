"use client";

import { CheckCircle2Icon, CircleIcon, UsersIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SubredditDiscovery } from "../../lib/validation-types";
import { Reddit } from "../icons/reddit";

type SubredditsViewProps = {
  result: SubredditDiscovery;
  selectedSubreddits?: string[];
  onToggleSubreddit?: (name: string) => void;
  selectable?: boolean;
};

export function SubredditsView({
  result,
  selectedSubreddits = [],
  onToggleSubreddit,
  selectable = false,
}: SubredditsViewProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 85) return "#f97316";
    if (score >= 70) return "#f59e0b";
    return "#6b7280";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium font-mono text-sm uppercase tracking-wide">
            Discovered Subreddits
          </h4>
          <p className="font-mono text-muted-foreground text-xs">
            {result.recommendedSubreddits.length} recommended for validation
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold font-mono text-2xl text-orange-500">
            {result.subreddits.length}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground uppercase">
            FOUND
          </p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="rounded border border-border/50 bg-muted/30 p-3">
        <p className="font-mono text-muted-foreground text-xs">
          {result.reasoning}
        </p>
      </div>

      {/* Subreddit Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {result.subreddits.map((subreddit) => {
          const isSelected = selectedSubreddits.includes(subreddit.name);
          const isRecommended = subreddit.recommended;

          return (
            <button
              className={cn(
                "group relative flex flex-col rounded border p-4 text-left transition-colors",
                selectable && "cursor-pointer",
                isSelected
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-border/50 bg-card/50 hover:bg-card"
              )}
              disabled={!selectable}
              key={subreddit.name}
              onClick={() => selectable && onToggleSubreddit?.(subreddit.name)}
              type="button"
            >
              {/* Selection indicator */}
              {selectable && (
                <div className="absolute top-3 right-3">
                  {isSelected ? (
                    <CheckCircle2Icon className="h-5 w-5 text-orange-500" />
                  ) : (
                    <CircleIcon className="h-5 w-5 text-muted-foreground/30" />
                  )}
                </div>
              )}

              {/* Header */}
              <div className="flex items-start gap-3 pr-6">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#ff4500]/10">
                  <Reddit className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium font-mono text-sm">
                      {subreddit.name}
                    </span>
                    {isRecommended && (
                      <span className="shrink-0 rounded bg-orange-500/20 px-1.5 py-0.5 font-mono text-[10px] text-orange-500 uppercase">
                        REC
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      {formatNumber(subreddit.subscribers)}
                    </span>
                    <span>•</span>
                    <span>{formatNumber(subreddit.activeUsers)} online</span>
                  </div>
                </div>
              </div>

              {/* Relevance Score */}
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                  MATCH
                </span>
                <span
                  className="rounded px-1.5 py-0.5 font-bold font-mono text-xs"
                  style={{
                    backgroundColor: `${getRelevanceColor(subreddit.relevanceScore)}20`,
                    color: getRelevanceColor(subreddit.relevanceScore),
                  }}
                >
                  {subreddit.relevanceScore}%
                </span>
              </div>

              {/* Topic Match */}
              <p className="mt-2 line-clamp-2 text-muted-foreground text-xs">
                {subreddit.topicMatch}
              </p>

              {/* Sample Posts */}
              <div className="mt-3 space-y-1 border-border/50 border-t pt-3">
                <p className="font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  SAMPLE POSTS
                </p>
                {subreddit.samplePosts.slice(0, 2).map((post, i) => (
                  <p
                    className="truncate font-mono text-[10px] text-muted-foreground"
                    key={i}
                  >
                    • {post}
                  </p>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
