import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET must be set in production. Refusing to start with an insecure JWT signing key.",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const { success } = await checkRateLimit(request, "admin");
        if (!success) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: { id: true, email: true, name: true, password: true },
          });

          if (!user) {
            // Prevent user enumeration timing attack
            await bcrypt.compare("dummy", "$2a$12$abcdefghijklmnopqrstuv");
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );
          if (!isValid) return null;

          return { id: user.id, email: user.email, name: user.name };
        } catch (e) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Auth error:", e);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnLogin = nextUrl.pathname === "/admin/login";

      if (isOnAdmin && !isOnLogin) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL("/admin/login", nextUrl));
      } else if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }
      return true;
    },
  },
});
