# Troubleshooting

## Tracking

| Symptom | Likely cause | Fix |
|---|---|---|
| Meta lead count roughly double the real number | `event_id` differs between Pixel and CAPI, or event names differ | Same UUID and same `event_name` on both paths |
| Event Match Quality below 5 | `fbc` missing, phone not in E.164, or IP/UA taken from the server not the visitor | Construct `fbc` from `fbclid`; normalize before hashing; forward `x-forwarded-for` |
| CAPI events invisible in Events Manager | `test_event_code` still set in production | Remove `META_TEST_EVENT_CODE` |
| GA4 sessions attributed to `(direct)` | sGTM on a domain that isn't a subdomain of the site | CNAME `gtm.` under the real domain |
| Attribution decays after a week on iOS | Third-party cookie capped by ITP | First-party sGTM domain |
| Server events arrive but tags don't fire | Trigger bound only to the GA4 Client | Add a trigger for the Data Client too |
| Nothing appears in sGTM Preview | `X-Gtm-Server-Preview` header missing on server-to-server calls | Forward the header from the API route |
| Events drop intermittently on Cloud Run | Cold starts | Minimum instances ≥ 1 |
| Conversions counted but no revenue in Ads | Offline import never wired up | Store `gclid` with the lead; import on close |

## Astro build and runtime

| Symptom | Likely cause | Fix |
|---|---|---|
| Every route becomes a Vercel function | `output: 'server'` set globally | Use `output: 'static'` and `prerender = false` per route |
| `import.meta.env.X` is undefined in production | Env var not added to the Vercel environment, or read in a prerendered page | Add to Vercel project settings; read only in server-rendered code |
| Secret visible in the client bundle | Name prefixed with `PUBLIC_` | Rename and read server-side only |
| `crypto.subtle` undefined | Old Node runtime | Node 22+ |
| Canonical URLs point to localhost | `site` unset in `astro.config.mjs` | Set the production domain |
| Sitemap missing pages | Pages are server-rendered, so the sitemap integration can't see them | Prerender content pages |
| Zod import errors after upgrading | Zod 4 moved | Import from `astro/zod` |
| `Astro.glob is not a function` | Removed in Astro 6+ | Use `getCollection()` or `import.meta.glob()` |

## Forms

| Symptom | Likely cause | Fix |
|---|---|---|
| Spam submissions | No honeypot or rate limit | Honeypot returning 200, plus per-IP rate limiting |
| Lead saved but no conversion recorded | Tracking call threw and took the handler with it | Wrap forwarding in `Promise.allSettled`, save first |
| Conversion recorded but lead lost | Tracking fired before persistence | Persist before forwarding |
| Duplicate submissions on double-click | Submit button not disabled | Disable during the request |
| Form works locally, 405 on Vercel | `prerender = false` missing on the API route | Add it |
