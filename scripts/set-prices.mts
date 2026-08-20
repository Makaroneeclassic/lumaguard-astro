/**
 * ใส่ราคาจริงลงฐานข้อมูล
 *
 * ราคาที่แสดงบนเว็บทุกจุดดึงมาจากตาราง Product ที่เดียว ทั้งหน้าสินค้า
 * หน้าเปรียบเทียบสเปก และเครื่องประเมินราคา แก้ที่นี่ที่เดียวจึงเปลี่ยนทั้งเว็บ
 *
 * หน้า /admin ยังต่อ ProductManager ไม่ถึง และยังไม่มี API สำหรับสินค้า
 * สคริปต์นี้จึงเป็นทางเดียวที่แก้ราคาได้ตอนนี้โดยไม่ต้องแตะฐานข้อมูลตรง ๆ
 *
 * วิธีใช้
 *   1. แก้ตาราง PRICES ข้างล่างให้เป็นราคาจริง
 *   2. npm run prices            ← ดูว่าจะเปลี่ยนอะไรบ้าง ยังไม่เขียนจริง
 *   3. npm run prices -- --apply ← เขียนลงฐานข้อมูล
 *
 * ราคาเป็นบาทต่อตารางเมตร ใส่เป็นตัวเลขล้วนไม่ต้องมีจุลภาค
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/* ───────────────────────────────────────────────────────────────
   แก้ตรงนี้ — ราคาบาทต่อตารางเมตร

   ใส่ได้สองแบบ
     Element: 1100                              ราคาเดียวทั้งซีรีส์
     Guardian: { '5%': 1800, '15%': 1900 }      แยกราคาตามความเข้ม (VLT)

   ซีรีส์ไหนยังไม่รู้ราคา ให้ใส่ null ไว้ก่อน สคริปต์จะข้ามไม่แตะของเดิม
   ─────────────────────────────────────────────────────────────── */
const PRICES: Record<string, number | Record<string, number> | null> = {
  Element: null,
  Shield: null,
  Zenith: null,
  Nexus: null,
  Apex: null,
  Guardian: null,
};

/* ─────────────────────────────────────────────────────────────── */

const apply = process.argv.includes('--apply');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** ราคาใน DB เก็บเป็นข้อความมีจุลภาค เช่น "1,800" ให้ตรงกับที่หน้าเว็บอ่าน */
const format = (n: number) => n.toLocaleString('en-US');

function priceFor(series: string, vlt: string | null): number | null {
  const entry = PRICES[series];
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'number') return entry;
  if (!vlt) return null;
  return entry[vlt] ?? null;
}

async function main() {
  const products = await prisma.product.findMany({
    orderBy: [{ series: 'asc' }, { name: 'asc' }],
    select: { id: true, series: true, name: true, vlt: true, price: true },
  });

  if (products.length === 0) {
    console.log('ไม่พบสินค้าในฐานข้อมูล — รัน npm run db:seed ก่อน');
    return;
  }

  const unknown = Object.keys(PRICES).filter((s) => !products.some((p) => p.series === s));
  if (unknown.length) {
    console.log(`⚠ ซีรีส์ที่ไม่มีในฐานข้อมูล: ${unknown.join(', ')}\n`);
  }

  const changes: Array<{ id: string; label: string; from: string; to: string }> = [];
  const skipped: string[] = [];

  let current = '';
  for (const p of products) {
    if (p.series !== current) {
      current = p.series;
      console.log(`── ${current} ──`);
    }

    const label = `${p.name ?? ''} (VLT ${p.vlt ?? '-'})`;
    const next = priceFor(p.series, p.vlt);

    if (next === null) {
      skipped.push(label);
      console.log(`   ${label.padEnd(30)} ${String(p.price ?? '-').padStart(7)}   ยังไม่กำหนด — ข้าม`);
      continue;
    }

    const to = format(next);
    if (to === p.price) {
      console.log(`   ${label.padEnd(30)} ${to.padStart(7)}   เท่าเดิม`);
      continue;
    }

    changes.push({ id: p.id, label, from: String(p.price ?? '-'), to });
    console.log(`   ${label.padEnd(30)} ${String(p.price ?? '-').padStart(7)} → ${to.padStart(7)}   เปลี่ยน`);
  }

  console.log();
  if (skipped.length) console.log(`ยังไม่กำหนดราคา ${skipped.length} รายการ`);

  if (changes.length === 0) {
    console.log('ไม่มีอะไรต้องเปลี่ยน');
    return;
  }

  if (!apply) {
    console.log(`\nจะเปลี่ยน ${changes.length} รายการ — ยังไม่ได้เขียนลงฐานข้อมูล`);
    console.log('รัน  npm run prices -- --apply  เพื่อบันทึกจริง');
    return;
  }

  for (const c of changes) {
    await prisma.product.update({ where: { id: c.id }, data: { price: c.to } });
  }
  console.log(`✓ บันทึกแล้ว ${changes.length} รายการ`);
  console.log('\nราคาบนเว็บจะเปลี่ยนตามในการ deploy ครั้งถัดไป');
  console.log('เพราะหน้าสินค้าเป็นหน้า static ที่สร้างตอน build');
}

main()
  .catch((e) => {
    console.error('ผิดพลาด:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
