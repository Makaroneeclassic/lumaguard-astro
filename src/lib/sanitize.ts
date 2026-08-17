// Helper functions ป้องกัน CSS/JS injection จาก user-controlled DB fields

export function sanitizeHexColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
}

export function sanitizeFontName(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return /^[a-zA-Z][a-zA-Z0-9 ]{0,50}$/.test(value) ? value : fallback;
}

export function sanitizeGAId(value: string | null | undefined): string {
  if (!value) return "";
  return /^(G-|UA-|GTM-)[A-Z0-9-]{4,20}$/.test(value) ? value : "";
}

export function sanitizeUrl(value: string | null | undefined, fallback = ""): string {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

export function sanitizePhone(value: string | null | undefined, fallback = ""): string {
  if (!value) return fallback;
  return /^\+?[\d\s\-()]{6,20}$/.test(value) ? value : fallback;
}
