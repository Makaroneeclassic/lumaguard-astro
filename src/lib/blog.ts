import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * แหล่งข้อมูลบทความจุดเดียวของทั้งเว็บ
 *
 * การตรวจสอบอยู่ตรงนี้เพราะทุกหน้าบล็อก import ฟังก์ชันนี้ — ถ้าข้อมูลผิดกติกา
 * `astro build` จะ fail ทันที ไม่ต้องมีขั้นตอน lint แยกที่คนลืมรัน
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  assertUniquePrimaryKeywords(posts);

  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/**
 * บทความสองบทที่จับคำหลักเดียวกันทำให้ Google เลือกไม่ถูกว่าจะจัดอันดับอันไหน
 * ผลคืออันดับตกทั้งคู่ ปัญหานี้แก้ยากมากเมื่อสะสมถึงหลักร้อยบท
 * จึงกันตั้งแต่ตอน build
 */
function assertUniquePrimaryKeywords(posts: BlogPost[]): void {
  const seen = new Map<string, string>();
  const conflicts: string[] = [];

  for (const post of posts) {
    const keyword = post.data.primaryKeyword.trim().toLowerCase();
    const previous = seen.get(keyword);
    if (previous) {
      conflicts.push(`  "${keyword}"\n    ← ${previous}\n    ← ${post.id}`);
    } else {
      seen.set(keyword, post.id);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `พบ primaryKeyword ซ้ำ ${conflicts.length} รายการ (keyword cannibalization)\n\n` +
        conflicts.join('\n') +
        `\n\nแต่ละบทความต้องจับคำหลักของตัวเอง — แก้ primaryKeyword ` +
        `หรือรวมสองบทความเข้าด้วยกันแล้ว 301 redirect ตัวเก่า\n`,
    );
  }
}

/**
 * บทความที่เกี่ยวข้อง เรียงตาม cluster เดียวกันก่อน แล้วค่อยดูจำนวน tag ที่ซ้อนกัน
 * เลือกอัตโนมัติเพราะการเลือกมือไม่มีทางดูแลไหวเมื่อมีบทความหลักร้อยบท
 */
export function getRelatedPosts(current: BlogPost, all: BlogPost[], limit = 3): BlogPost[] {
  return all
    .filter((post) => post.id !== current.id)
    .map((post) => {
      const sharedTags = post.data.tags.filter((tag) => current.data.tags.includes(tag)).length;
      const sameCluster = post.data.cluster === current.data.cluster ? 10 : 0;
      return { post, score: sameCluster + sharedTags };
    })
    .sort((a, b) => b.score - a.score || b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime())
    .slice(0, limit)
    .map(({ post }) => post);
}
