/**
 * Proxy เรียก OpenRouter จากหน้า /admin/blog
 *
 * ported from smart-bot-writer v2.2 background.js handleApiRequest —
 * เหตุที่ต้อง proxy: CSP ของเว็บจำกัด connect-src ไว้ที่ same-origin
 * เบราว์เซอร์จึงเรียก openrouter.ai ตรง ๆ ไม่ได้ (และไม่ควรอยู่แล้ว)
 *
 * API key เป็นของผู้ใช้เอง ส่งมากับ request ไม่เก็บบนเซิร์ฟเวอร์
 */
import type { APIRoute } from 'astro';
import { checkRateLimit } from '@/lib/ratelimit';
import { ALLOWED_MODEL_PREFIXES } from '@/lib/blogwriter/constants';
import { requireAdmin, json } from './_guard';

export const prerender = false;

/** เพดานเดียวกับ extension — บทความยาว 2,500 คำใช้ไม่ถึง */
const MAX_TOKENS_CAP = 8192;

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;

  const rate = await checkRateLimit(context.request, 'ai');
  if (!rate.success) {
    return json({ error: 'เรียกถี่เกินไป กรุณารอสักครู่' }, 429);
  }

  let body: {
    apiKey?: unknown;
    model?: unknown;
    messages?: unknown;
    maxTokens?: unknown;
    temperature?: unknown;
  };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
  }

  const { apiKey, model, messages } = body;

  // Basic API key validation (จาก background.js)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
    return json({ error: 'รูปแบบ API key ไม่ถูกต้อง' }, 400);
  }

  if (
    typeof model !== 'string' ||
    !ALLOWED_MODEL_PREFIXES.some((p) => model.startsWith(p))
  ) {
    return json({ error: 'ไม่รองรับโมเดลนี้' }, 400);
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    !messages.every(
      (m) =>
        m &&
        typeof m === 'object' &&
        typeof (m as { role?: unknown }).role === 'string' &&
        typeof (m as { content?: unknown }).content === 'string',
    )
  ) {
    return json({ error: 'รูปแบบ messages ไม่ถูกต้อง' }, 400);
  }

  const maxTokens = Math.min(
    typeof body.maxTokens === 'number' && body.maxTokens > 0 ? body.maxTokens : MAX_TOKENS_CAP,
    MAX_TOKENS_CAP,
  );
  const temperature = Math.min(
    Math.max(typeof body.temperature === 'number' ? body.temperature : 0.7, 0),
    1.5,
  );

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lumaguardthailand.com',
        'X-Title': 'LumaGuard Blog Writer',
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      // การเขียนบทความยาวใช้เวลาเป็นนาที เผื่อไว้ต่ำกว่า maxDuration ของ route
      signal: AbortSignal.timeout(280_000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}) as { error?: { message?: string } });
      // ต่างจาก extension ตรงที่บอกตรง ๆ ว่า key ผิด — key เป็นของผู้ใช้เอง
      // ไม่มีเหตุต้องอำพรางแบบระบบ white-label เดิม
      if (response.status === 401) return json({ error: 'API key ไม่ถูกต้อง ตรวจสอบใน OpenRouter อีกครั้ง' }, 401);
      if (response.status === 429) return json({ error: 'OpenRouter จำกัดการเรียก กรุณารอสักครู่' }, 429);
      if (response.status === 402) return json({ error: 'เครดิต OpenRouter ไม่พอ เติมเครดิตก่อนใช้งาน' }, 402);
      return json(
        { error: errorData.error?.message || `OpenRouter ตอบกลับผิดพลาด (HTTP ${response.status})` },
        502,
      );
    }

    const data = await response.json();
    return json({ success: true, data }, 200);
  } catch (e) {
    if ((e as Error).name === 'TimeoutError') {
      return json({ error: 'โมเดลใช้เวลานานเกินไป ลองโมเดลที่เร็วกว่าหรือกดใหม่' }, 504);
    }
    console.error('[blogwriter] เรียก OpenRouter ไม่สำเร็จ:', e);
    return json({ error: 'เชื่อมต่อ OpenRouter ไม่สำเร็จ' }, 502);
  }
};

/** ตอบให้ชัดว่าเมธอดอื่นไม่รองรับ ดีกว่าปล่อยให้ได้ 404 ซึ่งชวนเข้าใจผิดว่าไม่มี endpoint */
export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'รองรับเฉพาะเมธอด POST' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
