import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

/**
 * บนเซิร์ฟเวอร์จริง Vercel ใส่ค่าไว้ใน process.env แต่ตอนรัน astro dev
 * ค่าจากไฟล์ .env จะไปอยู่ใน import.meta.env เท่านั้น ไม่เข้า process.env
 *
 * เดิมอ่านแค่ process.env ทำให้ตอนพัฒนาในเครื่องต่อฐานข้อมูลไม่ได้เลย
 * ทุกหน้าจึงตกไปใช้ข้อมูลสำรองเงียบ ๆ และหน้าเข้าสู่ระบบก็ล็อกอินไม่ผ่าน
 * ต้องอ่านทั้งสองที่ ไม่งั้นพฤติกรรมในเครื่องกับบนเซิร์ฟเวอร์จะไม่ตรงกัน
 */
const connectionString = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
