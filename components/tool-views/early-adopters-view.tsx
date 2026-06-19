"use client";

import {
  ExternalLinkIcon,
  MessageCircleIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { EarlyAdopterAnalysis } from "../../lib/validation-types";

type EarlyAdoptersViewProps = {
  result: EarlyAdopterAnalysis;
};

export function EarlyAdoptersView({ result }: EarlyAdoptersViewProps) {
  const getEngagementColor = (score: number): string => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ec4899";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-pink-500/10">
            <UsersIcon className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <h4 className="font-medium font-mono text-sm uppercase tracking-wide">
              Early Adopters
            </h4>
            <p className="font-mono text-muted-foreground text-xs">
              ~{result.totalPotentialAdopters.toLocaleString()} potential users
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold font-mono text-2xl text-pink-500">
            {result.users.length}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground uppercase">
            PROFILED
          </p>
        </div>
      </div>

      {/* Active Subreddits */}
      <div className="flex flex-wrap items-center gap-2 rounded border border-border/50 bg-muted/30 p-3">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          ACTIVE IN:
        </span>
        {result.activeSubreddits.slice(0, 5).map((sub) => (
          <span
            className="rounded border border-pink-500/30 bg-pink-500/10 px-1.5 py-0.5 font-mono text-[10px] text-pink-500"
            key={sub}
          >
            {sub}
          </span>
        ))}
      </div>

      {/* User Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {result.users.map((user, index) => (
          <div
            className="rounded border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card"
            key={index}
          >
            {/* User Header */}
            <div className="flex items-start gap-3">
              {/* Avatar with score indicator */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold font-mono text-sm"
                style={{
                  backgroundColor: `${getEngagementColor(user.engagementScore)}20`,
                  color: getEngagementColor(user.engagementScore),
                }}
              >
                {user.engagementScore}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium font-mono text-sm">
                  u/{user.username}
                </p>
                <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <SparklesIcon className="h-3 w-3" />
                    {user.postCount} posts
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircleIcon className="h-3 w-3" />
                    {user.commentCount} comments
                  </span>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="mt-3 flex flex-wrap gap-1">
              {user.interests.map((interest) => (
                <span
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  key={interest}
                >
                  {interest}
                </span>
              ))}
            </div>

            {/* Sample Posts */}
            <div className="mt-3 space-y-1 border-border/50 border-t pt-3">
              {user.samplePosts.slice(0, 2).map((post, i) => (
                <a
                  className="group flex items-center gap-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-pink-500"
                  href={post.url}
                  key={i}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="truncate">{post.title}</span>
                  <ExternalLinkIcon className="h-2.5 w-2.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reach Strategy */}
      <div className="space-y-2">
        <p className="font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          REACH STRATEGY
        </p>
        <div className="rounded border border-border/50 bg-muted/30 p-4">
          <p className="text-sm leading-relaxed">{result.reachStrategy}</p>
        </div>
      </div>
    </div>
  );
}
