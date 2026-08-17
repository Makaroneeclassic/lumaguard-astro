import { auth } from "@/auth";

export async function proxy(request: Request) {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const url = new URL(request.url);
  const pathname = url.pathname;

  const isOnAdmin = pathname.startsWith("/admin");
  const isOnLogin = pathname === "/admin/login";

  if (isOnAdmin && !isOnLogin) {
    if (isLoggedIn) {
      return null;
    }
    return Response.redirect(new URL("/admin/login", request.url));
  } else if (isOnLogin && isLoggedIn) {
    return Response.redirect(new URL("/admin", request.url));
  }

  return null;
}

export const config = {
  matcher: ["/admin/:path*"],
};
