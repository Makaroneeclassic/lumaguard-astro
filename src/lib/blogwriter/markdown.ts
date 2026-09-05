/**
 * แปลง HTML → Markdown และทำตัวหนา cluster keywords
 * ported verbatim from smart-bot-writer v2.2 content.js:1344-1394 — do not simplify
 *
 * โดยเฉพาะ boldClusterKeywords: การ split ด้วย capture group แล้วเช็ค index
 * คู่/คี่ กับข้อยกเว้น word boundary ของภาษาไทย คือพฤติกรรมที่จูนมาแล้ว
 * ห้าม refactor โครงนี้
 */

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * ถอด HTML entity โดยไม่พึ่ง DOM — ใช้เมื่อรันบนเซิร์ฟเวอร์
 * ต้นฉบับใช้ <textarea> ซึ่งมีเฉพาะในเบราว์เซอร์
 */
function decodeEntities(value: string): string {
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function htmlToMarkdown(value: string): string {
  if (!/<[a-z][\s\S]*>/i.test(value)) return value;
  let markdown = value
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n')
    // เพิ่มจากต้นฉบับ: h5 เผื่อโมเดลใส่ระดับลึกมา จะได้ไม่หลุดเป็น tag ดิบ
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/?(?:ul|ol|div|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  markdown = decodeEntities(markdown);
  return markdown.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function boldClusterKeywords(markdown: string, clusterKeywords: string): string {
  const keywords = [...new Set(clusterKeywords.split(/[,\n]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  if (!keywords.length) return markdown;

  const alternatives = keywords.map(escapeRegExp).join('|');
  const pattern = new RegExp(`(${alternatives})`, 'giu');
  const wordCharacter = /[\p{L}\p{N}_]/u;
  const protectedParts = markdown.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|\*\*[\s\S]*?\*\*|!\[[^\]]*\]\([^)]+\)|\[[^\]]*\]\([^)]+\))/g);
  return protectedParts.map((part, index) => {
    if (index % 2 === 1) return part;
    return part.replace(pattern, (match, _captured, offset, source) => {
      // Thai is normally written without spaces, so exact Thai phrases may be
      // bolded inside a continuous run. Other scripts require word boundaries.
      if (!/\p{Script=Thai}/u.test(match)) {
        const before = Array.from(source.slice(0, offset)).pop() || '';
        const after = Array.from(source.slice(offset + match.length))[0] || '';
        if ((before && wordCharacter.test(before)) || (after && wordCharacter.test(after))) return match;
      }
      return `**${match}**`;
    });
  }).join('');
}
