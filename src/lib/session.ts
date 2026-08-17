/**
 * Session ของ admin — คุกกี้ที่เซ็นด้วย HMAC-SHA256 ผ่าน Web Crypto
 *
 * เขียนเองแทนการใช้ next-auth เพราะ next-auth ผูกกับ Next.js runtime
 * (middleware matcher, route handler) ซึ่ง Astro ไม่มี ตัวเดิมที่ src/auth.ts
 * จึงไม่เคยทำงานเลยแม้แต่ครั้งเดียว
 *
 * ไม่มี state ฝั่ง server — token ตรวจสอบได้ด้วยตัวเอง อ่าน DB เฉพาะตอน login
 */

const COOKIE_NAME = "lg_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 ชั่วโมง

export interface SessionPayload {
  sub: string; // user id
  email: string;
  exp: number; // unix seconds
}

function getSecret(): string {
  const secret = import.meta.env.AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a random string of at least 32 characters. " +
        "Generate one with: openssl rand -base64 32",
    );
  }
  return secret;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(user: { id: string; email: string }): Promise<string> {
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** คืน payload ถ้าลายเซ็นถูกต้องและยังไม่หมดอายุ ไม่งั้นคืน null */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    // crypto.subtle.verify เปรียบเทียบแบบ constant-time อยู่แล้ว
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(signature),
      encoder.encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  },
};
