/**
 * ตัวช่วยเรียก API ของเครื่องมือเขียนบทความ + ชนิดข้อมูลที่ใช้ร่วมกัน
 */
import type { InternalLink } from '@/lib/blogwriter/prompts';
import type { TopicalMapRow } from '@/lib/blogwriter/topicalMap';

export interface ArticleData {
  title: string;
  metaDescription: string;
  content: string;
}

/** โครงผลลัพธ์ SERP Spy — ตาม JSON schema ใน buildSerpSpyPrompt */
export interface SerpSpyData {
  serp_cards?: Array<{
    rank: number; title: string; domain: string; word_count: number;
    has_faq: boolean; has_table: boolean; has_video: boolean;
    headings_h2: number; headings_h3: number; content_type: string; strength: string;
  }>;
  data_targets?: {
    word_count_target: number; h2_count_target: number; h3_count_target: number;
    table_count_target: number; faq_count_target: number;
    internal_links_target: number; rationale: string;
  };
  must_have?: string[];
  gap_analysis?: Array<{ opportunity: string; priority: number; effort: string; impact: string; action: string }>;
  paa?: string[];
  related_searches?: string[];
  h_structure?: Array<{ level: string; text: string }>;
  serp_winner?: string;
  top3_actions?: Array<{ rank: number; action: string; reason: string }>;
  faq_schema?: {
    mainEntity?: Array<{ name: string; acceptedAnswer?: { text?: string } }>;
  };
}

async function parseJsonResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issues = (data as { issues?: Array<{ path: string; message: string }> }).issues;
    const detail = issues?.length
      ? `${(data as { error?: string }).error}: ${issues.map((i) => `${i.path} — ${i.message}`).join(', ')}`
      : (data as { error?: string }).error;
    const err = new Error(detail || `เกิดข้อผิดพลาด (HTTP ${res.status})`) as Error & {
      status?: number; reason?: string; badLinks?: string[];
    };
    err.status = res.status;
    err.reason = (data as { reason?: string }).reason;
    err.badLinks = (data as { badLinks?: string[] }).badLinks;
    throw err;
  }
  return data;
}

export async function callOpenRouter(params: {
  apiKey: string;
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  maxTokens?: number;
}): Promise<{ content: string; finishReason?: string }> {
  const res = await fetch('/api/admin/blogwriter/openrouter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseJsonResponse(res);
  const choice = data.data?.choices?.[0];
  const content = choice?.message?.content;
  if (!content) throw new Error('โมเดลไม่ตอบเนื้อหากลับมา ลองกดใหม่หรือเปลี่ยนโมเดล');
  return { content, finishReason: choice?.finish_reason };
}

export async function fetchActiveModels(): Promise<string[]> {
  const res = await fetch('/api/admin/blogwriter/models');
  const data = await parseJsonResponse(res);
  return data.activeModelIds ?? [];
}

export async function fetchTopicalMap(): Promise<TopicalMapRow[]> {
  const res = await fetch('/api/admin/blogwriter/topical-map');
  const data = await parseJsonResponse(res);
  return data.rows ?? [];
}

export async function fetchInternalLinks(): Promise<InternalLink[]> {
  const res = await fetch('/api/admin/blogwriter/internal-links');
  const data = await parseJsonResponse(res);
  return data.links ?? [];
}

export interface PublishRequest {
  slug: string;
  frontmatter: {
    title: string; description: string; primaryKeyword: string;
    secondaryKeywords: string[]; cluster: string; pillar?: string;
    relatedServiceUrl: string; pubDate: string; heroImage?: string;
    heroAlt?: string; author?: string; tags: string[];
    draft: boolean; noindex: boolean; faq?: { q: string; a: string }[];
  };
  markdownBody: string;
  overwrite?: boolean;
}

export interface PublishResult {
  success: boolean;
  path: string;
  commitUrl: string;
  blogUrl: string;
  updated: boolean;
}

export async function publishPost(payload: PublishRequest): Promise<PublishResult> {
  const res = await fetch('/api/admin/blogwriter/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await parseJsonResponse(res)) as PublishResult;
}

/**
 * แกะ JSON จากคำตอบของโมเดล — fallback ตาม extension เดิม (content.js:1483-1490):
 * จับก้อน {...} ก้อนแรก ถ้าแกะไม่ได้ใช้เนื้อหาดิบเป็นบทความ
 */
export function parseArticleResponse(content: string, keyword: string): ArticleData {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: String(parsed.title || keyword),
        metaDescription: String(parsed.metaDescription || ''),
        content: String(parsed.content || '').replace(/<h1[^>]*>.*?<\/h1>/gi, ''),
      };
    }
    throw new Error('Invalid JSON');
  } catch {
    return { title: keyword, metaDescription: `Article about ${keyword}`, content };
  }
}
