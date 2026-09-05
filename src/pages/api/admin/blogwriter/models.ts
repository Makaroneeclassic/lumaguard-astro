/**
 * เช็คว่าโมเดลไหนยังเปิดให้บริการบน OpenRouter
 *
 * ported from smart-bot-writer v2.2 background.js checkModels —
 * รายการโมเดลสาธารณะ ไม่ต้องใช้ API key แต่ต้อง proxy เพราะ CSP
 * จำกัดเบราว์เซอร์ไว้ที่ same-origin
 */
import type { APIRoute } from 'astro';
import { MODELS } from '@/lib/blogwriter/constants';
import { requireAdmin, json } from './_guard';

export const prerender = false;

/** cache ในหน่วยความจำของ instance — รายการโมเดลไม่เปลี่ยนบ่อย */
let cache: { ids: string[]; at: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export const GET: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return json({ activeModelIds: cache.ids }, 200);
  }

  try {
    const requested = new Set(MODELS.map((m) => m.value));
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return json({ error: `อ่านรายการโมเดลไม่สำเร็จ (HTTP ${response.status})` }, 502);
    }
    const payload = await response.json();
    const ids = ((payload.data ?? []) as Array<{ id: string; architecture?: { output_modalities?: string[] } }>)
      .filter((model) => requested.has(model.id) && model.architecture?.output_modalities?.includes('text'))
      .map((model) => model.id);

    cache = { ids, at: Date.now() };
    return json({ activeModelIds: ids }, 200);
  } catch (e) {
    console.error('[blogwriter] เช็คโมเดลไม่สำเร็จ:', e);
    return json({ error: 'เชื่อมต่อ OpenRouter ไม่สำเร็จ' }, 502);
  }
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'รองรับเฉพาะเมธอด GET' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'GET' },
  });
