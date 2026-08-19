/// <reference types="astro/client" />

import type { SessionPayload } from "@/lib/session";

declare global {
  namespace App {
    interface Locals {
      session?: SessionPayload;
    }
  }
}

interface ImportMetaEnv {
  readonly AUTH_SECRET: string;
  readonly DATABASE_URL: string;
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_GA4_MEASUREMENT_ID?: string;
  readonly SGTM_URL?: string;
  readonly TRACKING_ENDPOINT_URL?: string;
  readonly TRACKING_ENDPOINT_SECRET?: string;
  readonly GA4_MEASUREMENT_ID?: string;
  readonly GA4_API_SECRET?: string;
  readonly GOOGLE_SITE_VERIFICATION?: string;
  readonly UPSTASH_REDIS_REST_URL?: string;
  readonly UPSTASH_REDIS_REST_TOKEN?: string;
  readonly LINE_CHANNEL_ACCESS_TOKEN?: string;
  readonly LINE_ADMIN_USER_ID?: string;
  readonly RESEND_API_KEY?: string;
  readonly LEAD_NOTIFY_EMAIL?: string;
  readonly LEAD_NOTIFY_FROM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
