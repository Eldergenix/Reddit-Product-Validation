import { createAgentUIStreamResponse, type UIMessage } from "ai";

import { redditValidationAgent } from "../../../lib/ai/reddit-validation-agent";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { messages, ideaContext, selectedSubreddits, phase } = body as {
      messages: UIMessage[];
      ideaContext?: string;
      selectedSubreddits?: string[];
      phase?: "discovery" | "analysis";
    };

    // Create the agent stream response
    return createAgentUIStreamResponse({
      agent: redditValidationAgent,
      uiMessages: messages,
      options: {
        ideaContext: ideaContext ?? "",
        selectedSubreddits: selectedSubreddits ?? [],
        phase: phase ?? "discovery",
      },
    });
  } catch (error) {
    console.error("Eldergenix Reddit Product Validation error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
