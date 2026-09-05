/**
 * กติกาโครงสร้างบทความต่อ template — ported verbatim from smart-bot-writer
 * v2.2 content.js:81-110 — do not simplify
 *
 * ทุกตัวเลข (500-800 คำต่อ H2, จำนวน FAQ ฯลฯ) คือความรู้ที่สะสมมา
 * ห้ามแก้โดยไม่มีเหตุผลด้าน SEO ชัดเจน
 */

export interface TemplateRule {
  name: string;
  minWords: number;
  maxWords: number;
  structure?: string;
  newsType?: string;
  evergreenType?: string;
}

export const TEMPLATE_RULES: Record<string, TemplateRule> = {
  'longform-seo-ai-overview': {
    name: 'Long-Form SEO + AI Overview Optimized',
    minWords: 1500, maxWords: 2500,
    structure: `Article Structure:\n\n1. Introduction (Important):\n   - Write a detailed intro paragraph of 500-800 words\n   - Explain overview, importance, and what readers will learn\n   - Do NOT add H2 before intro — write as plain paragraphs (<p>)\n   - Do NOT write "TL;DR:" or any heading before the intro\n\n2. Main Content:\n   - Use H2/H3 to organize content systematically\n   - Every H2 must have 500-800 words of content\n   - Every H3 must have 300-500 words\n   - Include Bullet Points and Checklists\n\n3. FAQ & Summary:\n   - At least 5 FAQ questions\n   - Include a summary section at the end\n\nGuideline: Write like an expert, natural human language, no keyword stuffing`,
  },
  'standard-longform': {
    name: 'Standard Long-Form Content',
    minWords: 1500, maxWords: 3000,
    structure: `Article Structure:\n\n1. Introduction (500-800 words):\n   - Write a detailed intro before the main content\n   - Use <p> tags, no heading before intro\n\n2. Content:\n   - Clear H2/H3 headings, each section 500-800 words\n   - 5 FAQs + Summary`,
  },
  'landing-page': {
    name: 'Landing Page (Conversion-Focused)',
    minWords: 1000, maxWords: 2000,
    structure: `Landing Page Structure:\n\n1. Hero Section:\n   - Powerful headline (H2) with main benefit\n   - Compelling subheadline (paragraph)\n   - Clear value proposition\n\n2. Problem & Solution:\n   - Pain points the reader faces\n   - How this product/service solves them\n\n3. Key Benefits (H2 + bullet points):\n   - 3-5 main benefits with clear explanations\n   - Focus on outcomes, not features\n\n4. Social Proof / Trust:\n   - Simulated testimonials or statistics section\n   - Authority signals\n\n5. FAQ (5 questions):\n   - Common objections addressed\n\n6. Call to Action:\n   - Strong closing CTA paragraph\n\nGuideline: Persuasive tone, benefit-focused, conversion-optimized. No generic filler text.`,
  },
  'news-sports': { name: 'Sports News', minWords: 1200, maxWords: 1800, newsType: 'Sports' },
  'news-entertainment': { name: 'Entertainment News', minWords: 1200, maxWords: 1800, newsType: 'Entertainment' },
  'news-tech': { name: 'Tech News', minWords: 1200, maxWords: 1800, newsType: 'Technology' },
  'news-health': { name: 'Health News', minWords: 1200, maxWords: 1800, newsType: 'Health' },
  'deep-review': {
    name: 'In-Depth Review',
    minWords: 1500, maxWords: 2500,
    structure: `Review Structure:\n- Open with pros/cons summary (do NOT write TL;DR:)\n- Overview and highlights\n- In-depth breakdown of each aspect (500-800 words each)\n- Pros / Cons\n- Comparison with competitors\n- 5 FAQs + Conclusion`,
  },
  'evergreen-howto': { name: 'Evergreen: How-to Guide', minWords: 1500, maxWords: 2500, evergreenType: 'How-to' },
  'evergreen-guide': { name: 'Evergreen: Comprehensive Guide', minWords: 1500, maxWords: 2500, evergreenType: 'Guide' },
  'evergreen-knowledge': { name: 'Evergreen: Knowledge Base', minWords: 1500, maxWords: 2500, evergreenType: 'Knowledge' },
  'evergreen-explainer': { name: 'Evergreen: Explainer', minWords: 1500, maxWords: 2500, evergreenType: 'Explainer' },
};
