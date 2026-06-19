import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter that allows 10 requests per day per identifier
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(7, "1d"),
  analytics: true,
  prefix: "@upstash/ratelimit/eldergenix-reddit-product-validation",
});

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
  headers: {
    "X-RateLimit-Limit": string;
    "X-RateLimit-Remaining": string;
    "X-RateLimit-Reset": string;
  };
};

export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  try {
    const { success, limit, reset, remaining, pending } =
      await ratelimit.limit(identifier);

    return {
      success,
      limit,
      reset,
      remaining,
      pending,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    };
  } catch (_error) {
    // Return a default success response if rate limiting fails
    return {
      success: true,
      limit: 10,
      reset: Date.now() + 24 * 60 * 60 * 1000,
      remaining: 9,
      pending: Promise.resolve(),
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": "9",
        "X-RateLimit-Reset": (Date.now() + 24 * 60 * 60 * 1000).toString(),
      },
    };
  }
}

export function getClientIP(req: Request | Headers): string {
  const headers = req instanceof Headers ? req : req.headers;

  const forwarded = headers.get("x-forwarded-for");
  const real = headers.get("x-real-ip");
  const cfConnectingIP = headers.get("cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  if (real) {
    return real;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}
