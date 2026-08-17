import { defineMiddleware } from "astro:middleware";
import { verifySessionToken, sessionCookie } from "@/lib/session";

/**
 * Astro ใช้ไฟล์ชื่อ src/middleware.ts เท่านั้น ตัวเดิมเขียนไว้ที่ src/proxy.ts
 * ตามรูปแบบของ Next.js (export const config = { matcher }) ซึ่ง Astro
 * ไม่รู้จัก ทำให้ /admin เปิดสาธารณะโดยไม่มีการตรวจสอบสิทธิ์
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdminPage) return next();

  // หน้า login กับ endpoint ของ login ต้องเข้าถึงได้โดยไม่ต้องมี session
  if (pathname === "/admin/login") {
    const session = await verifySessionToken(context.cookies.get(sessionCookie.name)?.value);
    if (session) return context.redirect("/admin");
    return next();
  }

  const session = await verifySessionToken(context.cookies.get(sessionCookie.name)?.value);
  if (!session) {
    context.cookies.delete(sessionCookie.name, { path: "/" });
    return context.redirect("/admin/login");
  }

  context.locals.session = session;
  return next();
});
