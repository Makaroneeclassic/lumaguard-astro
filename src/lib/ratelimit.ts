import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * อ่านค่าได้ทั้งสองที่
 *
 * Vercel ใส่ไว้ใน process.env ส่วนตอนรัน astro dev ค่าจากไฟล์ .env จะไปอยู่
 * ใน import.meta.env เท่านั้น ถ้าอ่านที่เดียวจะได้พฤติกรรมต่างกันระหว่างเครื่อง
 * กับเซิร์ฟเวอร์ ซึ่งทำให้ทดสอบแล้วเชื่อผลไม่ได้
 */
const env = (key: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)[key] ?? process.env[key];

const upstashUrl = env("UPSTASH_REDIS_REST_URL");
const upstashToken = env("UPSTASH_REDIS_REST_TOKEN");

let leadRatelimit: Ratelimit | null = null;
let adminRatelimit: Ratelimit | null = null;

if (upstashUrl && upstashToken) {
  try {
    // สร้างเองแทน fromEnv เพราะ fromEnv อ่านจาก process.env อย่างเดียว
    const redis = new Redis({ url: upstashUrl, token: upstashToken });

    leadRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "rl:lead",
    });

    /**
     * หน้าเข้าสู่ระบบต้องเข้มกว่านี้มาก
     *
     * เดิมตั้งไว้สามสิบครั้งต่อนาที ซึ่งเปิดทางให้เดารหัสได้สี่หมื่นครั้งต่อวัน
     * คนจริงพิมพ์ผิดไม่เกินสองสามครั้ง สิบครั้งต่อสิบห้านาทีจึงเหลือเฟือสำหรับ
     * คนใช้งานจริง แต่ตัดโอกาสของโปรแกรมที่ไล่เดารหัสไปเกือบหมด
     */
    adminRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      prefix: "rl:admin",
    });

    console.log("[ratelimit] ใช้ Upstash — นับรวมทุก instance");
  } catch (e) {
    console.error("[ratelimit] ต่อ Upstash ไม่สำเร็จ ถอยไปใช้หน่วยความจำ:", e);
  }
} else {
  // เตือนไว้ให้เห็นใน log เพราะตัวสำรองกันได้ไม่ทั่วถึงบน Vercel
  console.warn(
    "[ratelimit] ยังไม่ได้ตั้ง Upstash — ใช้ตัวนับในหน่วยความจำซึ่งแต่ละ instance นับแยกกัน จึงกันการยิงรัวไม่ได้จริง",
  );
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

  {
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
  // ค่าเดียวกับฝั่ง Upstash เพื่อให้พฤติกรรมไม่ต่างกันตอนไม่มี Upstash
  const limit = type === "lead" ? 5 : 10;
  const windowMs = type === "lead" ? 60 * 60 * 1000 : 15 * 60 * 1000;
  const result = memoryRatelimit(key, limit, windowMs);
  return { success: result.success, remaining: result.remaining };
}
