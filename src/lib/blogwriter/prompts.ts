/**
 * ตัวประกอบ prompt — ported verbatim from smart-bot-writer v2.2
 * content.js:115-228 (SERP Spy) และ 233-311 (Article) — do not simplify
 *
 * ปรับจากต้นฉบับเพียง 2 จุดเพื่อให้เข้ากับ CMS ของเว็บนี้ (ดูคอมเมนต์ในจุดนั้น):
 *   1. กติกา heading hierarchy ห้ามข้ามระดับ
 *   2. เปลี่ยน "ห้ามลิงก์ทุกชนิด" เป็นแทรกลิงก์ภายในจากรายการที่กำหนดเท่านั้น
 * นอกนั้นทุกถ้อยคำ ทุกตัวเลข คงตามต้นฉบับ
 */

import { TEMPLATE_RULES } from './templates';
import { resolveLangName } from './constants';

/** หน้าปลายทางที่อนุญาตให้ AI ลิงก์หาได้ */
export interface InternalLink {
  path: string;
  title: string;
}

export interface BuildPromptOptions {
  topics?: string[];
  clusterKeywords?: string;
  outline?: string;
  writerStyle?: string;
  customLanguage?: string;
  customTemplate?: string;
  /** รายการลิงก์ภายในที่อนุญาต — ส่วนที่เพิ่มจาก extension เพื่อ internal linking */
  internalLinks?: InternalLink[];
}

/* ============================================================
   SERP SPY PROMPT BUILDER — content.js:115-228 verbatim
============================================================ */
export function buildSerpSpyPrompt(keyword: string, langName: string): string {
  // Build a strong language-first instruction
  const langInstruction = `⚠️ CRITICAL LANGUAGE RULE: You MUST write ALL text values in ${langName} ONLY.
This includes: titles, domain descriptions, content_type, strength, rationale, must_have items,
gap opportunity & action text, PAA questions, related_searches, h_structure text,
serp_winner, top3 action & reason, and ALL FAQ question/answer text.
DO NOT use English if the language is not English. Write entirely in ${langName}.`;

  return `${langInstruction}

You are an elite SEO analyst with deep expertise in SERP analysis.

Analyze the top 3 ranking pages for keyword: "${keyword}" (search market: ${langName}).
Simulate a realistic SERP analysis based on your training knowledge.

Return ONLY valid JSON (no markdown, no explanation before or after) in this exact structure:
{
  "serp_cards": [
    {
      "rank": 1,
      "title": "[page title in ${langName}]",
      "domain": "[domain type in ${langName} e.g. บล็อก, อีคอมเมิร์ซ, สื่อข่าว]",
      "word_count": 2400,
      "has_faq": true,
      "has_table": false,
      "has_video": false,
      "headings_h2": 6,
      "headings_h3": 12,
      "content_type": "[content type in ${langName}]",
      "strength": "[strength description in ${langName}]"
    },
    { "rank": 2, "...": "all fields in ${langName}" },
    { "rank": 3, "...": "all fields in ${langName}" }
  ],
  "data_targets": {
    "word_count_target": 2500,
    "h2_count_target": 7,
    "h3_count_target": 14,
    "table_count_target": 2,
    "faq_count_target": 8,
    "internal_links_target": 5,
    "rationale": "[explanation in ${langName}]"
  },
  "must_have": [
    "[must-have item in ${langName}]",
    "[must-have item in ${langName}]",
    "[must-have item in ${langName}]",
    "[must-have item in ${langName}]",
    "[must-have item in ${langName}]"
  ],
  "gap_analysis": [
    {
      "opportunity": "[gap description in ${langName}]",
      "priority": 5,
      "effort": "[low/medium/high in ${langName}]",
      "impact": "[low/medium/high in ${langName}]",
      "action": "[specific action in ${langName}]"
    }
  ],
  "paa": [
    "[Question in ${langName}?]",
    "[Question in ${langName}?]",
    "[Question in ${langName}?]",
    "[Question in ${langName}?]",
    "[Question in ${langName}?]",
    "[Question in ${langName}?]",
    "[Question in ${langName}?]",
    "[Question in ${langName}?]"
  ],
  "related_searches": [
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]",
    "[related keyword in ${langName}]"
  ],
  "h_structure": [
    { "level": "H2", "text": "[heading in ${langName}]" },
    { "level": "H3", "text": "[sub-heading in ${langName}]" },
    { "level": "H3", "text": "[sub-heading in ${langName}]" },
    { "level": "H2", "text": "[heading in ${langName}]" },
    { "level": "H3", "text": "[sub-heading in ${langName}]" },
    { "level": "H2", "text": "[heading in ${langName}]" },
    { "level": "H2", "text": "[FAQ heading in ${langName}]" },
    { "level": "H2", "text": "[Conclusion heading in ${langName}]" }
  ],
  "serp_winner": "[1-2 sentence summary in ${langName} of who dominates this SERP and why]",
  "top3_actions": [
    { "rank": 1, "action": "[action in ${langName}]", "reason": "[reason in ${langName}]" },
    { "rank": 2, "action": "[action in ${langName}]", "reason": "[reason in ${langName}]" },
    { "rank": 3, "action": "[action in ${langName}]", "reason": "[reason in ${langName}]" }
  ],
  "faq_schema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "[Question in ${langName}?]",
        "acceptedAnswer": { "@type": "Answer", "text": "[Answer in ${langName}.]" }
      }
    ]
  }
}

REMINDER: Every single text value in the JSON MUST be written in ${langName}.
gap_analysis must have 4-6 items with priority scores 1-5.
faq_schema must have 6-8 Q&A pairs.`;
}

/* ============================================================
   ARTICLE PROMPT BUILDER — content.js:233-311 verbatim
   (ยกเว้น 2 จุดปรับเข้า CMS — ระบุไว้ที่คอมเมนต์)
============================================================ */
export function buildPrompt(
  keyword: string,
  template: string,
  language: string,
  additionalContext = '',
  options: BuildPromptOptions = {},
): string {
  const rule = TEMPLATE_RULES[template] || null;
  const {
    topics = [], clusterKeywords = '', outline = '', writerStyle = '',
    customTemplate = '', internalLinks = [],
  } = options;

  const langName = resolveLangName(language, options.customLanguage);

  let prompt = `You are a professional SEO content writer.\n\n`;

  if (writerStyle && writerStyle.trim()) {
    prompt += `✍️ Writer Style/Persona: ${writerStyle.trim()}\n`;
    prompt += `   Write in the style defined above. Apply the expertise and tone of this persona throughout the article.\n\n`;
  }

  prompt += `📌 Focus Keyword: "${keyword}"\n`;
  prompt += `📌 Language: Write entirely in ${langName}\n`;

  if (rule) {
    prompt += `📌 Template: ${rule.name}\n`;
    prompt += `📌 Length: ${rule.minWords}–${rule.maxWords} words\n\n`;
  } else if (customTemplate && customTemplate.trim()) {
    prompt += `📌 Template: Custom\n\n`;
  }

  prompt += `🎯 Focus Keyword Rules (IMPORTANT):\n`;
  prompt += `- Use the keyword "${keyword}" in the content maximum 2 times only (density ≤ 2%)\n`;
  prompt += `- The 1st and 2nd occurrences should be wrapped as <strong>${keyword}</strong> (bold)\n`;
  prompt += `- After that, use synonyms and alternative phrasings instead\n`;
  prompt += `- Write naturally, do NOT keyword stuff\n\n`;

  if (clusterKeywords && clusterKeywords.trim()) {
    const kwList = clusterKeywords.split(/[,\n]+/).map((k) => k.trim()).filter(Boolean);
    prompt += `🔗 Cluster Keywords (distribute naturally in content):\n`;
    kwList.forEach((kw, i) => { prompt += `  ${i + 1}. ${kw}\n`; });
    prompt += `- Weave these terms naturally into the content, do not force them\n`;
    prompt += `- IMPORTANT: Wrap every natural occurrence of each cluster keyword/phrase in <strong> tags so it remains bold in HTML, rich text, and Markdown output\n\n`;
  }

  // Use outline if provided (from SERP Spy or manual)
  if (outline && outline.trim()) {
    prompt += `📐 Article Outline (MUST follow this H2/H3 structure exactly — do NOT skip or rename headings):\n`;
    prompt += outline.trim() + '\n';
    prompt += `⚠️ Rule: Every heading above MUST appear in the article in the exact order given\n\n`;
  } else if (topics.length > 0) {
    prompt += `📌 Required Article Headings (MUST use as <h2> tags in order — do NOT skip, remove, or rename):\n`;
    topics.forEach((t, i) => { prompt += `  ${i + 1}. ${t}\n`; });
    prompt += `⚠️ Rule: Every heading above MUST appear in the article as <h2> in the exact order given\n\n`;
  }

  if (additionalContext && additionalContext.trim()) {
    prompt += `📋 Additional Information for Writing:\n${additionalContext.trim()}\n\n`;
  }

  if (rule && rule.structure) prompt += rule.structure + '\n\n';

  if (customTemplate && customTemplate.trim()) {
    prompt += `📄 Persistent Template Instructions (IMPORTANT — follow these user requirements in addition to the selected base template):\n${customTemplate.trim()}\n\n`;
  }

  if (rule && rule.newsType) {
    prompt += `News Guidelines (${rule.newsType}):\n- Professional news tone, concise but information-dense\n- Open with 2-3 intro paragraphs (do NOT write TL;DR:)\n- Keep the title separate; use clear H2/H3 structure in content\n- Bullet points for highlights\n- Every H2/H3 must have 500-800 words\n- 5 FAQ questions at the end\n- Suitable for Google Discover\n\n`;
  }
  if (rule && rule.evergreenType) {
    prompt += `${rule.evergreenType} Guidelines:\n- Timeless content that remains relevant\n- Open with intro paragraph (do NOT write TL;DR:)\n- 3-6 H2 headings, 2-4 H3 sub-headings each\n- Each section 500-800 words\n- 5 FAQs + summary conclusion\n\n`;
  }

  /**
   * [ปรับเข้า CMS #2] ลิงก์ภายใน
   *
   * ต้นฉบับสั่ง "Do NOT include any URLs or links" เพราะปลายทางคือ Google Docs
   * แต่บนเว็บนี้ internal linking คือหัวใจของ topical map — จึงเปิดให้ลิงก์ได้
   * เฉพาะหน้าในรายการที่ส่งมา (บทความที่มีจริง + หน้าบริการ) ห้ามแต่ง URL เอง
   * ฝั่ง publish จะตรวจซ้ำอีกชั้นว่าทุกลิงก์อยู่ในรายการจริง
   */
  if (internalLinks.length > 0) {
    prompt += `🔗 Internal Links (use ONLY these — never invent URLs):\n`;
    internalLinks.forEach((l) => { prompt += `  - ${l.path} → "${l.title}"\n`; });
    prompt += `- Insert 2-4 internal links naturally in the content as <a href="/path">anchor text</a>\n`;
    prompt += `- Anchor text must be natural ${langName} phrases describing the destination\n`;
    prompt += `- Do NOT link to any URL outside this list. Do NOT use external links.\n\n`;
  }

  prompt += `❌ Strict Rules (never violate):\n`;
  if (internalLinks.length > 0) {
    // [ปรับเข้า CMS #2] ผ่อนกติกาห้ามลิงก์เฉพาะเมื่อมีรายการลิงก์ภายในให้ใช้
    prompt += `- Do NOT include any URLs or links EXCEPT the internal links listed above\n`;
  } else {
    prompt += `- Do NOT include any URLs or links\n`;
  }
  prompt += `- Do NOT mention AI, GPT, Claude, or automated systems\n`;
  prompt += `- Do NOT use Markdown syntax (no #, ##, *, - for lists)\n`;
  prompt += `- Do NOT write short or superficial content\n`;
  prompt += `- Do NOT write "TL;DR:" anywhere in the article\n`;
  prompt += `- ❗ Do NOT include <h1> in content — the Title is handled separately\n`;
  // [ปรับเข้า CMS #1] H1 มาจาก title frontmatter เว็บเรนเดอร์เอง เนื้อหาต้อง
  // เริ่มที่ H2 และห้ามข้ามระดับ ไม่งั้นโครงสร้าง prose บนหน้าเว็บจะรวน
  prompt += `- ❗ Heading hierarchy must start at <h2> and never skip levels (h2 → h3 → h4)\n\n`;
  prompt += `✅ Output: HTML only — use only <h2> <h3> <p> <ul> <ol> <li> <strong> <a> (NO <h1>)\n\n`;
  prompt += `⚠️ Return as JSON:\n{\n  "title": "[SEO title containing keyword — MUST be 50-60 characters total, or ~15-30 Thai words]",\n  "metaDescription": "[Meta description — MUST be 140-155 characters total, or ~70-80 Thai words. Compelling, includes keyword.]",\n  "content": "[HTML content — no <h1>, no TL;DR]"\n}\n\n❗ IMPORTANT SEO LENGTH RULES:\n- Title: EXACTLY 50-60 characters (count every letter, space, punctuation)\n- Meta Description: EXACTLY 140-155 characters (count every letter, space, punctuation)\n- If the language is Thai: Title = 15-30 Thai words, Meta = 70-80 Thai words\n- Do NOT write shorter or longer than these limits`;
  return prompt;
}
