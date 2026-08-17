# Server-Side Tagging Reference

Contents: [Architecture](#architecture) · [Env vars](#environment-variables) · [Dedup](#deduplication) · [Hashing](#identifier-normalization-and-hashing) · [fbp/fbc](#fbp-and-fbc) · [sGTM container](#sgtm-container-configuration) · [Consent](#consent-mode-v2) · [Offline conversions](#offline-conversions) · [Debugging](#debugging-checklist)

## Architecture

```
Browser ──► GTM Web container (dataLayer)
              │
              ▼
        gtm.yourdomain.com   ← sGTM, first-party subdomain
              │
    ┌─────────┼──────────┬───────────────┐
    ▼         ▼          ▼               ▼
  GA4    Meta CAPI   Google Ads    TikTok Events API
              ▲
              │ POST /data
        Astro /api/lead.ts
```

Two entry points into sGTM: the **GA4 Client** receives browser hits, the **Data Client** receives server-to-server POSTs from the API route. Both must map `event_id` through to the outbound tags.

## Environment variables

Server-only (never `PUBLIC_`):

| Variable | Purpose |
|---|---|
| `SGTM_URL` | sGTM endpoint. When set, send everything through it instead of calling platforms directly. |
| `META_PIXEL_ID`, `META_CAPI_TOKEN` | Direct CAPI fallback when no sGTM exists yet. |
| `META_TEST_EVENT_CODE` | Testing only. Leaving this in production makes events invisible to optimization. |
| `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` | Measurement Protocol. |

Client-safe: `PUBLIC_GTM_ID`.

Never fire both sGTM and direct-platform calls for the same event. Branch on `SGTM_URL` being present.

## Deduplication

The single most common bug. Meta counts a conversion twice when the Pixel event and the CAPI event don't carry the same `event_id`.

```js
const eventId = crypto.randomUUID();

// browser
fbq('track', 'Lead', {}, { eventID: eventId });
// or via dataLayer: dataLayer.push({ event: 'generate_lead', event_id: eventId })

// server — same value, same event name, within ~48h
{ event_name: 'Lead', event_id: eventId, ... }
```

Both events must also use the same `event_name`. `Lead` on the browser and `generate_lead` on the server will not deduplicate.

Verify in Events Manager → the event → Deduplication tab. If it shows zero deduplicated events while both sources are sending, the IDs aren't matching.

## Identifier normalization and hashing

Hash with SHA-256, output lowercase hex. Normalize first — unnormalized input produces a valid-looking hash that matches nothing.

| Field | Normalization | Example |
|---|---|---|
| `em` | trim, lowercase | ` A@B.com ` → `a@b.com` |
| `ph` | digits only, E.164 without `+` | `081-234-5678` (TH) → `66812345678` |
| `fn`, `ln` | trim, lowercase, collapse whitespace | `  Somchai ` → `somchai` |
| `ct`, `st` | lowercase, strip spaces and punctuation | `Bangkok` → `bangkok` |
| `zp` | digits only | |
| `country` | ISO 3166-1 alpha-2, lowercase | `th` |

Thai phone numbers: local format drops the leading `0` and takes country code `66`. Sending `0812345678` unmodified is a silent match-rate killer.

Never hash `fbp`, `fbc`, `client_ip_address`, or `client_user_agent` — those are sent raw.

When sGTM is in the path, prefer sending raw identifiers to sGTM over first-party HTTPS and letting sGTM hash them. Fewer places holding hashing logic, and the raw values never leave the first-party boundary.

## fbp and fbc

`_fbp` is set by the Pixel. Read it from the request cookie header server-side.

`_fbc` only exists if the user arrived with `fbclid`. When the cookie is absent but the page URL has `fbclid`, construct it:

```
fb.1.<timestamp_ms>.<fbclid>
```

Missing `fbc` on paid traffic is the biggest single drag on Event Match Quality. Target 7+/10.

## sGTM container configuration

**Hosting:** Stape.io for speed of setup and its custom loader (mitigates ad blockers). Google Cloud Run for lower cost at scale — set minimum instances to 1, since cold starts drop events.

**First-party domain is mandatory.** `gtm.yourdomain.com` must be a subdomain of the site's own domain, via CNAME. Using the vendor's domain makes the cookies third-party, which Safari ITP caps at 7 days — attribution windows collapse.

**GTM Web container:** set `server_container_url` on the GA4 Configuration tag so browser hits route through sGTM rather than straight to Google.

**Events worth tracking beyond the conversion:** `form_start`, scroll depth 50/90%, phone and LINE click, outbound link, file download, blog read completion. `form_start` paired with `generate_lead` gives form abandonment rate, which is usually the highest-leverage number on a lead-gen site.

## Consent Mode v2

Set defaults to denied before GTM loads, then update on user choice:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
</script>
```

Pass the consent state to the API route and skip platform forwarding when marketing consent is denied. Thailand's PDPA is less prescriptive than GDPR, but transmitting hashed personal data to ad platforms without a lawful basis is still a real exposure — get consent.

## Offline conversions

Store with each lead: `eventId`, `client_id`, `session_id`, `_fbp`, `_fbc`, `gclid`, timestamp, and source URL.

When the lead converts to revenue:
- **Meta** — CAPI `Purchase` with a fresh `event_id` but the original `user_data`
- **Google Ads** — Offline Conversion Import keyed on `gclid`, or Enhanced Conversions for Leads with hashed email
- **GA4** — Measurement Protocol with the original `client_id`

This closes the loop from ad click to booked revenue and is the only way ROAS on a considered-purchase funnel becomes real rather than modeled.

## Debugging checklist

Run in this order:

1. Network tab — does `POST /api/lead` return 200?
2. Vercel function logs — did the tracking call throw?
3. sGTM Preview mode — did the request arrive at the Data Client?
4. sGTM Preview — did the outbound tags fire, and what payload did they send?
5. Meta Test Events — did both browser and server events land?
6. Events Manager Deduplication tab — are they being merged?
7. Event Match Quality — which identifiers are reported as missing?

Preview mode on sGTM requires the `X-Gtm-Server-Preview` header on server-to-server calls, otherwise those requests are invisible in the debugger.
