/**
 * TypeScript types for the Eldergenix Reddit Product Validation workspace
 */

// ============================================================================
// PHASE 1: DISCOVERY TYPES
// ============================================================================

export type Subreddit = {
  name: string;
  subscribers: number;
  activeUsers: number;
  relevanceScore: number;
  topicMatch: string;
  samplePosts: string[];
  recommended: boolean;
};

export type SubredditDiscovery = {
  subreddits: Subreddit[];
  recommendedSubreddits: string[];
  reasoning: string;
};

// ============================================================================
// PHASE 2: ANALYSIS TYPES
// ============================================================================

// Pain Points
export type PainPoint = {
  text: string;
  upvotes: number;
  subreddit: string;
  url: string;
  sentiment: 1 | 2 | 3 | 4 | 5;
  frequency: "rare" | "occasional" | "common" | "very-common";
};

export type PainPointsAnalysis = {
  painPoints: PainPoint[];
  topPainPoints: string[];
  totalMentions: number;
};

// Existing Solutions
export type SolutionQuote = {
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  subreddit: string;
};

export type ExistingSolution = {
  name: string;
  mentionCount: number;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  quotes: SolutionQuote[];
  marketShare: number;
};

export type MarketGap = {
  description: string;
  frequency: number;
  opportunity: "low" | "medium" | "high";
};

export type ExistingSolutionsAnalysis = {
  solutions: ExistingSolution[];
  marketGaps: MarketGap[];
  competitorWeaknesses: string[];
  totalSolutionsMentioned: number;
};

// Willingness to Pay
export type WillingnessQuote = {
  text: string;
  priceSignal: string | null;
  subreddit: string;
  upvotes: number;
  context: string;
};

export type PriceRange = {
  min: number | null;
  max: number | null;
  median: number | null;
  currency: string;
};

export type WillingnessToPayAnalysis = {
  quotes: WillingnessQuote[];
  priceRange: PriceRange;
  paymentIntentScore: number;
  priceSensitivity: "low" | "medium" | "high";
  totalSignals: number;
};

// Demand Analysis
export type DemandDataPoint = {
  date: string;
  count: number;
};

export type DemandAnalysis = {
  totalMentions: number;
  trendDirection: "up" | "down" | "stable";
  trendData: DemandDataPoint[];
  peakInterest: string;
  demandScore: number;
  seasonality: string | null;
};

// Early Adopters
export type EarlyAdopterPost = {
  title: string;
  subreddit: string;
  url: string;
};

export type EarlyAdopter = {
  username: string;
  postCount: number;
  commentCount: number;
  engagementScore: number;
  interests: string[];
  samplePosts: EarlyAdopterPost[];
};

export type EarlyAdopterAnalysis = {
  users: EarlyAdopter[];
  activeSubreddits: string[];
  totalPotentialAdopters: number;
  reachStrategy: string;
};

// ============================================================================
// VALIDATION REPORT
// ============================================================================

export type ValidationVerdict = "strong-go" | "go" | "conditional" | "no-go";

export type ValidationScores = {
  problemScore: number;
  marketSizeScore: number;
  monetizationScore: number;
  competitionScore: number;
  overallScore: number;
};

export type ValidationInsight = {
  type: "strength" | "weakness" | "opportunity" | "threat";
  text: string;
};

export type ValidationRisk = {
  risk: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
};

export type NextStep = {
  action: string;
  priority: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
};

export type ValidationReport = {
  scores: ValidationScores;
  verdict: ValidationVerdict;
  confidence: number;
  keyInsights: ValidationInsight[];
  risks: ValidationRisk[];
  nextSteps: NextStep[];
  subredditsAnalyzed: string[];
  summary: string;
};

// ============================================================================
// AGENT TYPES
// ============================================================================

export type ValidationPhase = "discovery" | "analysis";

export type ValidationContext = {
  idea: string;
  selectedSubreddits?: string[];
  phase: ValidationPhase;
};

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type ValidationState =
  | "idle"
  | "discovering"
  | "selecting"
  | "analyzing"
  | "complete";

export type ValidationResults = {
  discovery?: SubredditDiscovery;
  painPoints?: PainPointsAnalysis;
  solutions?: ExistingSolutionsAnalysis;
  willingness?: WillingnessToPayAnalysis;
  demand?: DemandAnalysis;
  earlyAdopters?: EarlyAdopterAnalysis;
  report?: ValidationReport;
};
