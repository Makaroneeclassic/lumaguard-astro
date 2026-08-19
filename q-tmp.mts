import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
const prisma = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL })) });
const ps = await prisma.product.findMany({ orderBy: [{ series: 'asc' }, { createdAt: 'asc' }], select: { series: true, name: true, vlt: true, tser: true } });
const bySeries: Record<string, typeof ps> = {};
for (const p of ps) (bySeries[p.series] ??= []).push(p);
for (const [s, list] of Object.entries(bySeries)) {
  console.log(s.padEnd(10) + ' : ' + list.map(p => p.vlt).join('  '));
}
await prisma.$disconnect();
