import type { APIRoute } from "astro";
import { sessionCookie } from "@/lib/session";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(sessionCookie.name, { path: "/" });
  return redirect("/admin/login", 303);
};
