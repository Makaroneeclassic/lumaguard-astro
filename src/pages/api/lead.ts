import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db';
import { z } from 'astro/zod';

// Force server rendering for this API route
export const prerender = false;

const leadValidation = z.object({
  eventId: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(9, 'Phone is required'),
  district: z.string().min(2, 'District is required'),
  propertyType: z.string().optional().default('Condo'),
  areaSize: z.union([z.number(), z.string()]).optional(),
  estimatedArea: z.union([z.number(), z.string()]).optional(),
  recommendedFilm: z.string().optional(),
  trafficSource: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  gclid: z.string().optional(),
  landingPage: z.string().optional(),
  website_url: z.string().optional() // Honeypot field
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // 1. Zod Validation
    const parsed = leadValidation.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, phone, and district are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = parsed.data;

    // 2. Honeypot check for spam bots
    if (data.website_url && data.website_url.trim() !== '') {
      console.warn(`[Spam Blocked] Honeypot field filled by bot: ${data.website_url}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Lead saved' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Persist Lead to Prisma DB
    let lead = null;
    try {
      lead = await prisma.lead.create({
        data: {
          name: data.name,
          phone: data.phone,
          district: data.district,
          propertyType: data.propertyType || 'Condo',
          areaSize: data.areaSize ? parseFloat(String(data.areaSize)) : null,
          status: 'new',
          estimatedArea: data.estimatedArea ? parseFloat(String(data.estimatedArea)) : null,
          recommendedFilm: data.recommendedFilm,
          trafficSource: data.trafficSource,
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
          gclid: data.gclid,
          landingPage: data.landingPage
        }
      });
      console.log('[DB SAVE SUCCESS] Created Lead:', lead.id);
    } catch (dbErr) {
      console.error('[DB SAVE WARNING] Could not insert to database, falling back:', dbErr);
    }

    // 4. Forward to sGTM (wrapped in Promise.allSettled)
    const sgtmUrl = import.meta.env.SGTM_URL;
    if (sgtmUrl) {
      const clientIp = request.headers.get('x-forwarded-for') || '';
      const userAgent = request.headers.get('user-agent') || '';
      const gtmPreviewHeader = request.headers.get('x-gtm-server-preview') || '';
      const eventId = data.eventId || (lead ? lead.id : `lead_${Date.now()}`);

      const sGtmPayload = {
        event_name: 'Lead',
        event_id: eventId,
        user_data: {
          phone: data.phone.trim().replace(/^0/, '66'),
          name: data.name.trim()
        },
        custom_data: {
          district: data.district,
          property_type: data.propertyType,
          recommended_film: data.recommendedFilm,
          gclid: data.gclid
        },
        client_ip_address: clientIp,
        client_user_agent: userAgent
      };

      Promise.allSettled([
        fetch(sgtmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(gtmPreviewHeader ? { 'x-gtm-server-preview': gtmPreviewHeader } : {})
          },
          body: JSON.stringify(sGtmPayload)
        })
      ]).then((results) => {
        results.forEach((res) => {
          if (res.status === 'rejected') {
            console.error('[sGTM Dispatch Failed]', res.reason);
          } else {
            console.log('[sGTM Dispatch Success]', res.value.status);
          }
        });
      });
    }

    return new Response(
      JSON.stringify({ success: true, lead }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating lead:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Failed to save inquiry details.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
