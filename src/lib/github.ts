/**
 * GitHub REST client แบบบางสำหรับ commit บทความจาก /admin/blog
 *
 * ทำไม commit เข้า git แทนเก็บ DB: บทความของเว็บนี้อยู่เป็นไฟล์ MDX ใน repo
 * โดยเจตนา (ดูคอมเมนต์ใน prisma/schema.prisma และ scripts/blog-sync.mts) —
 * push เข้า main แล้ว Vercel deploy ต่อเองเหมือนบทความจากชีตทุกอย่าง
 *
 * ใช้ fetch ตรง ๆ ไม่ลง octokit เพราะใช้แค่สอง endpoint
 */

const env = (key: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)[key] ?? process.env[key];

function config() {
  const token = env("GITHUB_TOKEN");
  if (!token) {
    throw new Error(
      "ยังไม่ได้ตั้ง GITHUB_TOKEN — สร้าง fine-grained PAT สิทธิ์ contents:write " +
        "เฉพาะ repo นี้ แล้วใส่ใน .env และ Vercel",
    );
  }
  return {
    token,
    owner: env("GITHUB_REPO_OWNER") ?? "Makaroneeclassic",
    repo: env("GITHUB_REPO_NAME") ?? "lumaguard-astro",
  };
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export interface GitHubFile {
  sha: string;
  /** เนื้อไฟล์ถอดจาก base64 แล้ว */
  content: string;
}

/** อ่านไฟล์จาก repo — คืน null เมื่อไม่มีไฟล์ (404) */
export async function getFile(path: string): Promise<GitHubFile | null> {
  const { token, owner, repo } = config();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=main`,
    { headers: headers(token) },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub อ่านไฟล์ไม่สำเร็จ (HTTP ${res.status})`);
  const data = await res.json();
  return {
    sha: data.sha,
    content: Buffer.from(data.content ?? "", "base64").toString("utf8"),
  };
}

export interface PutFileResult {
  commitUrl: string;
}

/**
 * เขียนไฟล์เข้า branch main — สร้างใหม่หรือทับของเดิม
 * ถ้าทับของเดิมต้องส่ง sha ของไฟล์ปัจจุบัน (GitHub ใช้กันเขียนชนกัน)
 */
export async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<PutFileResult> {
  const { token, owner, repo } = config();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch: "main",
        ...(sha ? { sha } : {}),
      }),
    },
  );
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub commit ไม่สำเร็จ (HTTP ${res.status})${detail.message ? `: ${detail.message}` : ""}`,
    );
  }
  const data = await res.json();
  return { commitUrl: data.commit?.html_url ?? "" };
}
