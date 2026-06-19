"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  LightbulbIcon,
  Loader2Icon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Reddit } from "../components/icons/reddit";
import { SubredditsView } from "../components/tool-views/subreddits-view";
import { ValidationDashboard } from "../components/validation-dashboard";
import type {
  Subreddit,
  SubredditDiscovery,
  ValidationState,
} from "../lib/validation-types";

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CornerDot({
  position,
  variant = "default",
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  variant?: "default" | "primary";
}) {
  const positionClasses = {
    "top-left": "-left-[3px] -top-[3px]",
    "top-right": "-right-[3px] -top-[3px]",
    "bottom-left": "-left-[3px] -bottom-[3px]",
    "bottom-right": "-right-[3px] -bottom-[3px]",
  };

  return (
    <div className={cn("absolute", positionClasses[position])}>
      <div
        className={cn(
          "relative z-10 h-[5px] w-[5px] rounded-full ring-2 ring-background",
          variant === "primary" ? "bg-primary" : "bg-border"
        )}
      />
    </div>
  );
}

function GridCell({
  children,
  className,
  showCornerDots = false,
  cornerDotVariant = "default",
}: {
  children?: React.ReactNode;
  className?: string;
  showCornerDots?: boolean;
  cornerDotVariant?: "default" | "primary";
}) {
  return (
    <div className={cn("relative", className)}>
      {showCornerDots ? (
        <>
          <CornerDot position="top-left" variant={cornerDotVariant} />
          <CornerDot position="top-right" variant={cornerDotVariant} />
          <CornerDot position="bottom-left" variant={cornerDotVariant} />
          <CornerDot position="bottom-right" variant={cornerDotVariant} />
        </>
      ) : null}
      {children}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RedditValidationPage() {
  const [validationState, setValidationState] =
    useState<ValidationState>("idle");
  const [idea, setIdea] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Discovery phase state
  const [discoveredSubreddits, setDiscoveredSubreddits] =
    useState<SubredditDiscovery | null>(null);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);

  // Discovery function - uses simulated data for demo
  // In production, this would call the actual Reddit API or agent
  const handleDiscover = async (submitIdea?: string) => {
    const targetIdea = submitIdea ?? idea;
    if (!targetIdea.trim()) return;

    setValidationState("discovering");
    setError(null);
    if (submitIdea) setIdea(submitIdea);

    try {
      // Simulate discovery delay (in production, this would be an API call)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const mockDiscovery: SubredditDiscovery =
        generateMockDiscovery(targetIdea);

      setDiscoveredSubreddits(mockDiscovery);
      setSelectedSubreddits(mockDiscovery.recommendedSubreddits);
      setValidationState("selecting");
      toast.success("Reddit communities discovered.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setValidationState("idle");
      toast.error("Discovery failed", { description: errorMessage });
    }
  };

  const handleToggleSubreddit = (name: string) => {
    setSelectedSubreddits((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleStartAnalysis = () => {
    if (selectedSubreddits.length === 0) {
      toast.error("Select at least one subreddit");
      return;
    }
    setValidationState("analyzing");
  };

  const handleReset = () => {
    setValidationState("idle");
    setIdea("");
    setDiscoveredSubreddits(null);
    setSelectedSubreddits([]);
    setError(null);
  };

  return (
    <div className="container min-h-screen bg-background">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-[1fr_minmax(0,72rem)_1fr]">
        {/* Top Row - decorative */}
        <div className="border-b border-dotted" />
        <div className="border-x border-b border-dotted py-1" />
        <div className="border-b border-dotted" />

        {/* Header Row */}
        <div className="border-b border-dotted" />
        <GridCell
          className="border-x border-b border-dotted px-6 py-4"
          cornerDotVariant="primary"
          showCornerDots
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff4500]/10 shadow-[0_0_15px_rgba(255,69,0,0.15)]">
                <Reddit className="h-6 w-6" />
              </div>

              {validationState === "idle" ? (
                <h1 className="font-semibold text-3xl tracking-tight">
                  Eldergenix Reddit Product Validation
                </h1>
              ) : (
                <h1 className="font-semibold text-md tracking-tight">
                  Validating: {idea.slice(0, 100)}
                  {idea.length > 100 ? "..." : ""}
                </h1>
              )}
            </div>
            {validationState === "idle" && (
              <p className="max-w-2xl text-muted-foreground">
                Turn Reddit community signals into a founder-ready validation
                report with pain points, alternatives, pricing intent, demand,
                and early-adopter opportunities.
              </p>
            )}
          </div>
        </GridCell>
        <div className="border-b border-dotted" />

        {/* Idea Input Row */}
        {validationState === "idle" && (
          <>
            <div className="border-b border-dotted" />
            <GridCell className="border-x border-b border-dotted px-6 py-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <LightbulbIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="h-12 border-2 border-border bg-card pl-10 transition-colors focus:border-primary"
                      onChange={(e) => setIdea(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
                      placeholder="Describe your startup idea or problem to validate..."
                      type="text"
                      value={idea}
                    />
                  </div>
                  <Button
                    className="h-12 min-w-[160px] bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:bg-orange-600"
                    disabled={!idea.trim()}
                    onClick={() => handleDiscover()}
                  >
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Find Communities
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-sm">Try:</span>
                  {[
                    {
                      name: "AI meal planning",
                      idea: "AI-powered meal planning app for busy professionals",
                    },
                    {
                      name: "Invoice automation",
                      idea: "Automated invoice processing for freelancers",
                    },
                    {
                      name: "Focus timer",
                      idea: "Pomodoro-style focus timer with team features",
                    },
                    {
                      name: "Code review tool",
                      idea: "AI code review assistant for solo developers",
                    },
                    {
                      name: "Habit tracker",
                      idea: "Habit tracking app with social accountability",
                    },
                  ].map((suggestion) => (
                    <button
                      className="rounded-full border border-border bg-card px-3 py-1 text-sm transition-colors hover:border-orange-500 hover:bg-orange-500/5"
                      data-testid="suggestion"
                      key={suggestion.name}
                      onClick={() => handleDiscover(suggestion.idea)}
                      type="button"
                    >
                      {suggestion.name}
                    </button>
                  ))}
                </div>
              </div>
            </GridCell>
            <div className="border-b border-dotted" />
          </>
        )}

        {/* Discovery Loading Row */}
        {validationState === "discovering" && (
          <>
            <div className="border-b border-dotted" />
            <GridCell
              className="border-x border-b border-dotted px-6 py-6"
              showCornerDots
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Loader2Icon className="h-4 w-4 animate-spin text-orange-500" />
                  </div>
                  <div>
                    <span className="font-medium">
                      Finding Reddit communities...
                    </span>
                    <p className="text-muted-foreground text-sm">
                      Finding communities that discuss this topic
                    </p>
                  </div>
                </div>
                <LoadingSkeleton />
              </div>
            </GridCell>
            <div className="border-b border-dotted" />
          </>
        )}

        {/* Error Row */}
        {error && validationState === "idle" && (
          <>
            <div className="border-b border-dotted" />
            <GridCell
              className="border-x border-b border-dotted px-6 py-6"
              showCornerDots
            >
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircleIcon className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            </GridCell>
            <div className="border-b border-dotted" />
          </>
        )}

        {/* Subreddit Selection Row */}
        {validationState === "selecting" && discoveredSubreddits && (
          <>
            <div className="border-b border-dotted" />
            <GridCell
              className="border-x border-b border-dotted px-6 py-6"
              cornerDotVariant="primary"
              showCornerDots
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      Choose Communities to Analyze
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {selectedSubreddits.length} selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReset} variant="outline">
                      Start Over
                    </Button>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={selectedSubreddits.length === 0}
                      onClick={handleStartAnalysis}
                    >
                      <CheckIcon className="mr-2 h-4 w-4" />
                      Build Report ({selectedSubreddits.length})
                    </Button>
                  </div>
                </div>

                <SubredditsView
                  onToggleSubreddit={handleToggleSubreddit}
                  result={discoveredSubreddits}
                  selectable
                  selectedSubreddits={selectedSubreddits}
                />
              </div>
            </GridCell>
            <div className="border-b border-dotted" />
          </>
        )}

        {/* Analysis Phase (Dashboard) */}
        {(validationState === "analyzing" ||
          validationState === "complete") && (
          <>
            <div className="border-b border-dotted" />
            <GridCell
              className="border-x border-b border-dotted"
              cornerDotVariant="primary"
              showCornerDots
            >
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
                <ValidationDashboard
                  idea={idea}
                  onReset={handleReset}
                  selectedSubreddits={selectedSubreddits}
                />
              </div>
            </GridCell>
            <div className="border-b border-dotted" />
          </>
        )}

        {/* Bottom spacer */}
        <div className="border-b border-dotted" />
        <div className="border-x border-b border-dotted py-1" />
        <div className="border-b border-dotted" />
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateMockDiscovery(idea: string): SubredditDiscovery {
  const ideaLower = idea.toLowerCase();

  const allSubreddits: Subreddit[] = [
    {
      name: "r/startups",
      subscribers: 1_200_000,
      activeUsers: 4500,
      relevanceScore: 92,
      topicMatch: "Startup founders discussing validation, MVPs, and growth",
      samplePosts: [
        "How I validated my SaaS idea in 2 weeks",
        "Looking for feedback on my startup concept",
      ],
      recommended: true,
    },
    {
      name: "r/Entrepreneur",
      subscribers: 2_100_000,
      activeUsers: 8200,
      relevanceScore: 88,
      topicMatch: "Entrepreneurs sharing ideas and seeking validation",
      samplePosts: [
        "Would you pay for this service?",
        "Idea validation: need honest feedback",
      ],
      recommended: true,
    },
    {
      name: "r/SideProject",
      subscribers: 180_000,
      activeUsers: 890,
      relevanceScore: 85,
      topicMatch: "Indie hackers building and validating projects",
      samplePosts: [
        "Launched my MVP, looking for beta testers",
        "How I found my first 100 users",
      ],
      recommended: true,
    },
    {
      name: "r/indiehackers",
      subscribers: 95_000,
      activeUsers: 620,
      relevanceScore: 90,
      topicMatch: "Indie hackers validating products",
      samplePosts: [
        "Revenue milestone: $1k MRR",
        "How I validated my B2B idea",
      ],
      recommended: true,
    },
  ];

  // Add domain-specific subreddits based on idea
  if (
    ideaLower.includes("meal") ||
    ideaLower.includes("food") ||
    ideaLower.includes("diet")
  ) {
    allSubreddits.push({
      name: "r/MealPrepSunday",
      subscribers: 3_200_000,
      activeUsers: 12_000,
      relevanceScore: 94,
      topicMatch: "Users discussing meal planning and prep tools",
      samplePosts: [
        "Apps for meal planning?",
        "Wish there was automation for this",
      ],
      recommended: true,
    });
  }

  if (ideaLower.includes("code") || ideaLower.includes("developer")) {
    allSubreddits.push({
      name: "r/webdev",
      subscribers: 2_100_000,
      activeUsers: 8500,
      relevanceScore: 91,
      topicMatch: "Developers discussing tools and workflows",
      samplePosts: ["Best code review tools?", "Frustrated with PR reviews"],
      recommended: true,
    });
  }

  if (ideaLower.includes("invoice") || ideaLower.includes("freelance")) {
    allSubreddits.push({
      name: "r/freelance",
      subscribers: 420_000,
      activeUsers: 1800,
      relevanceScore: 93,
      topicMatch: "Freelancers discussing business tools",
      samplePosts: ["Best invoicing software?", "Hate tracking billable hours"],
      recommended: true,
    });
  }

  const sorted = allSubreddits
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6);

  return {
    subreddits: sorted,
    recommendedSubreddits: sorted
      .filter((s) => s.recommended)
      .map((s) => s.name)
      .slice(0, 4),
    reasoning: `Based on "${idea}", I recommend these subreddits as primary research sources. They have active discussions about similar problems and users who share their pain points.`,
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="space-y-2 rounded-lg border p-3" key={i}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
