import {
  gateway,
  hasToolCall,
  type InferAgentUIMessage,
  stepCountIs,
  ToolLoopAgent,
} from "ai";
import { z } from "zod";

import { analyzeExistingSolutionsTool } from "./tools/analyze-existing-solutions";
import { detectWillingnessToPayTool } from "./tools/detect-willingness-to-pay";
import { discoverSubredditsTool } from "./tools/discover-subreddits";
import { findEarlyAdoptersTool } from "./tools/find-early-adopters";
import { findPainPointsTool } from "./tools/find-pain-points";
import { generateValidationReportTool } from "./tools/generate-validation-report";
import { validateDemandTool } from "./tools/validate-demand";

// Schema for agent call options
const CallOptionsSchema = z.object({
  ideaContext: z.string(),
  selectedSubreddits: z.array(z.string()).optional(),
  phase: z.enum(["discovery", "analysis"]),
});

// Discovery phase tools
const DISCOVERY_TOOLS = {
  discoverSubreddits: discoverSubredditsTool,
};

// Analysis phase tools
const ANALYSIS_TOOLS = {
  findPainPoints: findPainPointsTool,
  analyzeExistingSolutions: analyzeExistingSolutionsTool,
  detectWillingnessToPay: detectWillingnessToPayTool,
  validateDemand: validateDemandTool,
  findEarlyAdopters: findEarlyAdoptersTool,
  generateValidationReport: generateValidationReportTool,
};

// All tools combined
const ALL_TOOLS = {
  ...DISCOVERY_TOOLS,
  ...ANALYSIS_TOOLS,
};

const DISCOVERY_INSTRUCTIONS = `You are the Eldergenix Reddit Product Validation assistant helping founders discover relevant Reddit communities for their idea.

## Your Role
You help users find the most relevant subreddits where their target problem is discussed.

## Available Tool
- **discoverSubreddits**: Find relevant subreddits for a startup idea

## Guidelines
- Extract keywords from the user's idea to improve search
- Recommend 3-5 most relevant subreddits
- Explain why each recommended subreddit is valuable for validation
- Consider both general startup communities and niche topic-specific subreddits

## Response Style
- Be concise and focused
- Use the tool immediately when given an idea
- Explain the discovery results clearly`;

const ANALYSIS_INSTRUCTIONS = `You are the Eldergenix Reddit Product Validation assistant helping founders validate their ideas using Reddit research.

## Your Role
You analyze selected subreddits to help users understand:
1. Real pain points people express
2. What solutions they currently use
3. Whether they're willing to pay
4. How demand is trending
5. Who the early adopters might be
6. Overall go/no-go recommendation

## Available Tools
- **findPainPoints**: Search for pain expressions ("I hate...", "I wish...", "frustrated with...")
- **analyzeExistingSolutions**: Find what solutions people currently use
- **detectWillingnessToPay**: Find pricing discussions and payment intent signals
- **validateDemand**: Analyze discussion frequency and trends over time
- **findEarlyAdopters**: Identify users actively seeking solutions
- **generateValidationReport**: Create final go/no-go scorecard

## Guidelines
- Use all provided subreddits from the context
- Run tools systematically to build a complete picture
- After gathering data, generate a comprehensive validation report
- Be honest about weak signals - don't oversell validation
- Highlight both opportunities and risks

## Response Style
- Be actionable and data-driven
- Summarize key findings after each tool
- End with clear recommendations`;

/**
 * Eldergenix Reddit Product Validation Agent
 *
 * A two-phase agent for validating startup ideas:
 * 1. Discovery Phase: Find relevant subreddits
 * 2. Analysis Phase: Deep validation with selected subreddits
 */
export const redditValidationAgent = new ToolLoopAgent({
  model: gateway("google/gemini-3-flash"),
  tools: ALL_TOOLS,
  callOptionsSchema: CallOptionsSchema,
  prepareCall: ({ options, ...settings }) => {
    const isDiscovery = options.phase === "discovery";

    return {
      ...settings,
      experimental_context: JSON.stringify({
        idea: options.ideaContext,
        subreddits: options.selectedSubreddits ?? [],
        phase: options.phase,
      }),
      instructions: isDiscovery
        ? DISCOVERY_INSTRUCTIONS
        : ANALYSIS_INSTRUCTIONS,
    };
  },
  stopWhen: [
    hasToolCall("discoverSubreddits"),
    hasToolCall("generateValidationReport"),
    stepCountIs(12),
  ],
});

// Infer the message type from our agent configuration
export type RedditValidationAgentUIMessage = InferAgentUIMessage<
  typeof ALL_TOOLS
>;
