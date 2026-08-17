import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash Redis env is configured
const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let leadRatelimit: Ratelimit | null = null;
let adminRatelimit: Ratelimit | null = null;

if (hasUpstash) {
  try {
    const redis = Redis.fromEnv();
    leadRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "rl:lead",
    });
    adminRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "rl:admin",
    });
  } catch (e) {
    console.error("Failed to initialize Upstash Redis client:", e);
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

// In-memory fallback
const buckets = new Map<string, { count: number; reset: number }>();

export function memoryRatelimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, reset: bucket.reset };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, reset: bucket.reset };
}

export async function checkRateLimit(req: Request, type: "lead" | "admin"): Promise<{ success: boolean; remaining: number }> {
  const ip = getClientIp(req);
  const key = `${type}:${ip}`;

  if (hasUpstash) {
    const limiter = type === "lead" ? leadRatelimit : adminRatelimit;
    if (limiter) {
      try {
        const result = await limiter.limit(ip);
        return { success: result.success, remaining: result.remaining };
      } catch (e) {
        console.error("Upstash rate limit check failed, falling back to memory:", e);
      }
    }
  }

  // Fallback to in-memory rate limiting
  const limit = type === "lead" ? 5 : 30;
  const windowMs = type === "lead" ? 60 * 60 * 1000 : 60 * 1000; // 1 hour vs 1 min
  const result = memoryRatelimit(key, limit, windowMs);
  return { success: result.success, remaining: result.remaining };
}
