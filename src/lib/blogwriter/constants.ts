/**
 * ค่าคงที่ของเครื่องมือเขียนบทความ — ported verbatim from smart-bot-writer
 * v2.2 content.js — do not simplify
 *
 * รายการโมเดลกับกติกาต่าง ๆ ผ่านการลองผิดลองถูกมาแล้วใน extension เดิม
 * การ "จัดระเบียบ" ใหม่เสี่ยงทำให้พฤติกรรมเพี้ยนโดยไม่รู้ตัว
 */

export const MAX_TEMPLATE_FILE_SIZE = 512 * 1024;
export const MAX_TOPICS = 5;

export interface LanguageOption {
  value: string;
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'th', label: '🇹🇭 Thai' },
  { value: 'de', label: '🇩🇪 German' },
  { value: 'fr', label: '🇫🇷 French' },
  { value: 'it', label: '🇮🇹 Italian' },
  { value: 'ru', label: '🇷🇺 Russian' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'tr', label: '🇹🇷 Turkish' },
  { value: 'zh', label: '🇨🇳 Mandarin Chinese' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'ko', label: '🇰🇷 Korean' },
  { value: 'ar', label: '🇸🇦 Arabic' },
  { value: 'hi', label: '🇮🇳 Hindi' },
  { value: 'pt', label: '🇧🇷 Portuguese' },
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'id', label: '🇮🇩 Indonesian' },
  { value: 'other', label: '✏️ Other (custom)' },
];

export interface TemplateOption {
  value: string;
  label: string;
  category: string;
}

export const TEMPLATES: TemplateOption[] = [
  { value: 'longform-seo-ai-overview', label: '📊 Long-Form SEO + AI Overview', category: 'Long / Core' },
  { value: 'standard-longform', label: '📝 Standard Long-Form', category: 'Long / Core' },
  { value: 'landing-page', label: '🚀 Landing Page', category: 'Long / Core' },
  { value: 'news-sports', label: '⚽ Sports News', category: 'News SEO' },
  { value: 'news-entertainment', label: '🎬 Entertainment News', category: 'News SEO' },
  { value: 'news-tech', label: '💻 Tech News', category: 'News SEO' },
  { value: 'news-health', label: '🏥 Health News', category: 'News SEO' },
  { value: 'deep-review', label: '🔍 In-Depth Review', category: 'Review' },
  { value: 'evergreen-howto', label: '📋 How-to Guide', category: 'Evergreen' },
  { value: 'evergreen-guide', label: '📖 Comprehensive Guide', category: 'Evergreen' },
  { value: 'evergreen-knowledge', label: '🧠 Knowledge Base', category: 'Evergreen' },
  { value: 'evergreen-explainer', label: '💡 Explainer Article', category: 'Evergreen' },
  { value: 'custom', label: '✏️ Custom Template', category: 'Custom' },
];

export interface ModelOption {
  value: string;
  label: string;
}

export const MODELS: ModelOption[] = [
  { value: 'openai/gpt-5.6-terra', label: '🚀 GPT-5.6 Terra (Latest)' },
  { value: 'openai/gpt-4.1-mini', label: '⭐ GPT-4.1 Mini (Recommended)' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'openai/gpt-4.1', label: 'GPT-4.1' },
  { value: 'openai/o4-mini', label: 'o4 Mini' },
  { value: 'anthropic/claude-opus-4', label: 'Claude Opus 4' },
  { value: 'anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
  { value: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
  { value: 'x-ai/grok-4.6', label: '🔥 Grok ++ (18+ Writing)' },
];

/** โมเดลเก่าที่เลิกให้บริการ → รุ่นแทนที่ ใช้ remap ค่าที่ค้างใน localStorage */
export const MODEL_MIGRATIONS: Record<string, string> = {
  'openai/gpt-4.5-preview': 'openai/gpt-5.6-terra',
  'anthropic/claude-3-5-sonnet': 'anthropic/claude-sonnet-4.6',
  'google/gemini-2.0-flash-001': 'google/gemini-2.5-flash',
  'google/gemini-2.5-pro-preview': 'google/gemini-2.5-pro',
};

/** prefix ของโมเดลที่ยอมให้เรียกผ่าน proxy (จาก background.js) */
export const ALLOWED_MODEL_PREFIXES = [
  'openai/',
  'anthropic/',
  'google/',
  'meta-llama/',
  'mistralai/',
  'deepseek/',
  'x-ai/',
];

/**
 * แปลงรหัสภาษาเป็นชื่อภาษาสำหรับใส่ใน prompt
 *
 * `label.replace(/\S+\s/, '')` ตัดอีโมจิธงหน้าชื่อออก — วิธีเดียวกับ extension
 * (content.js:237-240 และซ้ำที่ 1072-1075) รวมไว้ที่เดียว
 */
export function resolveLangName(language: string, customLanguage = ''): string {
  if (language === 'other' && customLanguage) return customLanguage;
  const langObj = LANGUAGES.find((l) => l.value === language);
  if (langObj && language !== 'other') return langObj.label.replace(/\S+\s/, '');
  return 'English';
}
