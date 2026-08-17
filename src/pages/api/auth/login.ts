import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { createSessionToken, sessionCookie } from "@/lib/session";

export const prerender = false;

// hash ปลอมที่ถูกต้องตามรูปแบบ ใช้เผา CPU ให้เท่ากันตอนไม่พบผู้ใช้
// เพื่อไม่ให้เวลาตอบสนองบอกได้ว่าอีเมลนี้มีอยู่จริงหรือไม่
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.qcrEXJKrLTvxaFyNyPCUqDwbdBSAdxu";

export const POST: APIRoute = async (context) => {
  try {
    return await handleLogin(context);
  } catch (error) {
    // ไม่ปล่อยให้ error หลุดออกไป มิฉะนั้นผู้ใช้จะเจอหน้าขาวเปล่า ๆ
    // โดยไม่รู้ว่าเกิดอะไรขึ้น กรณีที่พบบ่อยที่สุดคือยังไม่ได้ตั้ง AUTH_SECRET
    // บนเซิร์ฟเวอร์ ซึ่งทำให้การสร้าง session token ล้มทันที
    const message = error instanceof Error ? error.message : String(error);
    console.error("[auth] เข้าสู่ระบบล้มเหลว:", message);

    const code = message.includes("AUTH_SECRET") ? "config" : "server";
    return context.redirect(`/admin/login?error=${code}`, 303);
  }
};

const handleLogin: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return redirect("/admin/login?error=missing", 303);
  }

  const { success } = await checkRateLimit(request, "admin");
  if (!success) {
    return redirect("/admin/login?error=ratelimit", 303);
  }

  let user: { id: string; email: string; password: string } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });
  } catch (e) {
    console.error("[auth] database lookup failed");
    return redirect("/admin/login?error=server", 303);
  }

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return redirect("/admin/login?error=invalid", 303);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return redirect("/admin/login?error=invalid", 303);
  }

  const token = await createSessionToken({ id: user.id, email: user.email });
  cookies.set(sessionCookie.name, token, sessionCookie.options);

  return redirect("/admin", 303);
};
