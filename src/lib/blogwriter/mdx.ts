/**
 * ประกอบไฟล์ .mdx ฉบับสมบูรณ์จาก frontmatter + เนื้อหา markdown
 *
 * แทนที่ buildMarkdownOutput ของ extension ซึ่ง emit frontmatter แค่
 * title/description/pubDate/tags/draft — ไม่ตรง schema ของเว็บนี้
 * รูปแบบ YAML และลำดับ field เลียนแบบ scripts/blog-sync.mts เป๊ะ
 * เพื่อให้ git diff ของบทความจากหน้า /admin/blog อ่านเหมือนบทที่มาจากชีต
 */

export interface BlogFrontmatter {
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  cluster: string;
  pillar?: string;
  relatedServiceUrl: string;
  /** YYYY-MM-DD */
  pubDate: string;
  /** YYYY-MM-DD */
  updatedDate?: string;
  heroImage?: string;
  heroAlt?: string;
  heroWidth?: number;
  heroHeight?: number;
  author?: string;
  tags: string[];
  draft: boolean;
  noindex: boolean;
  faq?: { q: string; a: string }[];
}

/** ใส่เครื่องหมายคำพูดให้ค่าที่จะไปอยู่ใน YAML อย่างปลอดภัย (จาก blog-sync.mts)
 *  เพิ่มการแทนขึ้นบรรทัดใหม่ด้วยช่องว่าง เพราะค่าจากฟอร์มอาจมี \n ติดมา */
const yamlStr = (v: string) =>
  `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ")}"`;

export function buildMdxFile(fm: BlogFrontmatter, markdownBody: string): string {
  const lines: string[] = [
    "---",
    `title: ${yamlStr(fm.title)}`,
    `description: ${yamlStr(fm.description)}`,
    `primaryKeyword: ${yamlStr(fm.primaryKeyword)}`,
  ];

  const secondary = fm.secondaryKeywords.slice(0, 5);
  if (secondary.length) lines.push(`secondaryKeywords: [${secondary.map(yamlStr).join(", ")}]`);

  lines.push(`cluster: ${yamlStr(fm.cluster)}`);
  if (fm.pillar?.trim()) lines.push(`pillar: ${yamlStr(fm.pillar.trim())}`);
  lines.push(`relatedServiceUrl: ${yamlStr(fm.relatedServiceUrl)}`);
  lines.push(`pubDate: ${fm.pubDate}`);
  if (fm.updatedDate?.trim()) lines.push(`updatedDate: ${fm.updatedDate.trim()}`);

  if (fm.heroImage) {
    lines.push(`heroImage: ${yamlStr(fm.heroImage)}`);
    lines.push(`heroAlt: ${yamlStr(fm.heroAlt ?? "")}`);
    if (fm.heroWidth && fm.heroHeight) {
      lines.push(`heroWidth: ${fm.heroWidth}`);
      lines.push(`heroHeight: ${fm.heroHeight}`);
    }
  }

  if (fm.author?.trim()) lines.push(`author: ${yamlStr(fm.author.trim())}`);

  const tags = fm.tags.slice(0, 4);
  if (tags.length) lines.push(`tags: [${tags.map(yamlStr).join(", ")}]`);

  lines.push(`draft: ${fm.draft}`);
  if (fm.noindex) lines.push("noindex: true");

  if (fm.faq?.length) {
    lines.push("faq:");
    for (const { q, a } of fm.faq) {
      if (!q.trim() || !a.trim()) continue;
      lines.push(`  - q: ${yamlStr(q.trim())}`);
      lines.push(`    a: ${yamlStr(a.trim())}`);
    }
  }

  lines.push("---", "");

  // ตัด H1 นำหน้าออกถ้าโมเดลเผลอใส่ (ตาม buildMarkdownOutput ของ extension)
  const body = markdownBody.replace(/^#\s+.*(?:\n+|$)/, "").trim();

  return lines.join("\n") + "\n" + body + "\n";
}
