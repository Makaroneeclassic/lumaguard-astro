/**
 * เตรียมรูปฝั่งเบราว์เซอร์ก่อนอัพโหลด — ย่อ + แปลงเป็น WebP
 *
 * ทำฝั่ง client เพราะ (1) Vercel จำกัด request body ~4.5MB รูปจากมือถือ
 * มักเกิน (2) ไม่ต้องพึ่ง sharp บนเซิร์ฟเวอร์ ซึ่งเป็น native dependency
 * ที่จัดการยากบน serverless — canvas ของเบราว์เซอร์ encode WebP ได้เอง
 */

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 0.85;

export interface PreparedImage {
  /** base64 ของไฟล์ WebP (ไม่มี data: prefix) */
  base64: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) {
    throw new Error('รองรับเฉพาะไฟล์รูป (jpg, png, webp, gif, avif)');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับการแปลงรูป');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
  );
  if (!blob) throw new Error('แปลงรูปเป็น WebP ไม่สำเร็จ');
  if (blob.size > 3.5 * 1024 * 1024) {
    throw new Error('รูปใหญ่เกินไปแม้ย่อแล้ว ลองรูปที่เล็กกว่านี้');
  }

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // แปลงเป็น base64 ทีละก้อน กัน call stack ล้นกับรูปใหญ่
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }

  return { base64: btoa(binary), width, height, sizeBytes: blob.size };
}

export interface UploadedImage {
  path: string;
  width: number;
  height: number;
}

/** อัพโหลดรูป (commit เข้า repo ผ่าน API) แล้วคืน path ที่ใช้ในเว็บ */
export async function uploadImage(
  file: File,
  slug: string,
  kind: 'hero' | 'body',
): Promise<UploadedImage> {
  const prepared = await prepareImage(file);
  const res = await fetch('/api/admin/blogwriter/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug,
      kind,
      base64: prepared.base64,
      width: prepared.width,
      height: prepared.height,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `อัพโหลดไม่สำเร็จ (HTTP ${res.status})`);
  }
  return { path: data.path, width: prepared.width, height: prepared.height };
}
