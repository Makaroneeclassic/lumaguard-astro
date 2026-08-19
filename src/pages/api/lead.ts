import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db';
import { z } from 'astro/zod';
import { checkRateLimit } from '@/lib/ratelimit';
import { notifyNewLead } from '@/lib/notify';
import { sendGa4Event, parseGaClientId, fallbackClientId } from '@/lib/ga4';
import { sendTrackingEvent } from '@/lib/tracking';

// Force server rendering for this API route
export const prerender = false;

/**
 * ฟิลด์ที่ไม่บังคับใช้ nullish ไม่ใช่ optional
 *
 * optional ของ Zod ยอมรับเฉพาะ undefined แต่ฟอร์มส่ง null มาเสมอเมื่อไม่มีค่า
 * เช่น sessionStorage.getItem คืน null และช่องพื้นที่ที่เว้นว่างก็ส่ง null
 * ผลคือ validation ตกทุกครั้งที่ผู้ใช้ไม่ได้ผ่านหน้าเลือกฟิล์มมาก่อน
 * ซึ่งเป็นเส้นทางปกติของคนที่เข้ามากรอกฟอร์มโดยตรง
 */
const leadValidation = z.object({
  eventId: z.string().nullish(),
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(9, 'Phone is required'),
  district: z.string().min(2, 'District is required'),
  propertyType: z.string().nullish().transform((v) => v ?? 'Condo'),
  areaSize: z.union([z.number(), z.string()]).nullish(),
  estimatedArea: z.union([z.number(), z.string()]).nullish(),
  recommendedFilm: z.string().nullish(),
  trafficSource: z.string().nullish(),
  utmSource: z.string().nullish(),
  utmMedium: z.string().nullish(),
  utmCampaign: z.string().nullish(),
  gclid: z.string().nullish(),
  gaClientId: z.string().nullish(),
  landingPage: z.string().nullish(),
  website_url: z.string().nullish() // Honeypot field
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // 0. Rate limit — honeypot กันได้แค่บอทที่กรอกทุกช่อง
    //    ตัวที่ยิงตรงมาที่ endpoint ต้องกันด้วย rate limit
    const { success: withinLimit } = await checkRateLimit(request, 'lead');
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: 'ส่งคำขอบ่อยเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    // 1. Zod Validation
    const parsed = leadValidation.safeParse(body);
    if (!parsed.success) {
      // เดิมตอบข้อความเดียวกันหมดไม่ว่าฟิลด์ไหนผิด ทำให้ผู้ใช้ไม่รู้ว่าต้องแก้ตรงไหน
      // และเราก็หาสาเหตุไม่ได้ ตอนที่ null ทำให้ตกก็ยังขึ้นว่าชื่อและเบอร์ขาด
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      console.warn('[lead] ข้อมูลไม่ผ่านการตรวจสอบ:', issues.join(' | '));

      const labels: Record<string, string> = {
        name: 'ชื่อ-นามสกุล',
        phone: 'เบอร์โทรศัพท์',
        district: 'เขต/อำเภอ',
      };
      const missing = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))]
        .map((f) => labels[f])
        .filter(Boolean);

      return new Response(
        JSON.stringify({
          error: missing.length
            ? `กรุณากรอก${missing.join(', ')}ให้ถูกต้อง`
            : 'ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
        }),
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

    // 4. ส่งต่อไปยัง sGTM และแจ้งเตือนทีมขาย
    //
    //    ต้อง await ให้เสร็จก่อนคืน response — บน serverless งานที่ยังค้างอยู่
    //    หลังส่ง response แล้วอาจถูกตัดกลางคัน ทำให้ทั้ง tracking และ
    //    การแจ้งเตือนหายไปเงียบ ๆ
    const sideEffects: Promise<unknown>[] = [];

    // ถ้ายังไม่มีเซิร์ฟเวอร์ sGTM ให้ยิงเข้า GA4 ตรงผ่าน Measurement Protocol
    // เพื่อไม่ให้เสียข้อมูล conversion ระหว่างที่ยังตั้ง sGTM ไม่เสร็จ
    const sgtmUrl = import.meta.env.SGTM_URL;
    if (!sgtmUrl) {
      const clientId =
        data.gaClientId ||
        parseGaClientId(
          request.headers.get('cookie')?.match(/_ga=([^;]+)/)?.[1],
        ) ||
        (lead ? lead.id : `srv.${Date.now()}`);

      sideEffects.push(
        sendGa4Event(
          clientId,
          [{
            name: 'generate_lead',
            params: {
              currency: 'THB',
              district: data.district,
              property_type: data.propertyType,
              recommended_film: data.recommendedFilm,
              source: data.utmSource,
              campaign: data.utmCampaign,
            },
          }],
          request.headers.get('user-agent') ?? undefined,
        ),
      );
    }

    if (sgtmUrl) {
      sideEffects.push(
        sendTrackingEvent({
          event_name: 'Lead',
          event_id: data.eventId || (lead ? lead.id : `lead_${Date.now()}`),
          event_time: Math.floor(Date.now() / 1000),
          user_data: {
            // ทำเบอร์ให้เป็นรูปแบบสากลก่อนส่ง ปลายทางจะได้ hash ได้ตรงกัน
            phone: data.phone.trim().replace(/^0/, '66'),
            name: data.name.trim(),
          },
          custom_data: {
            district: data.district,
            property_type: data.propertyType,
            recommended_film: data.recommendedFilm,
            area_size: data.areaSize ? Number(data.areaSize) : undefined,
            gclid: data.gclid,
            utm_source: data.utmSource,
            utm_medium: data.utmMedium,
            utm_campaign: data.utmCampaign,
          },
          client_ip_address: request.headers.get('x-forwarded-for') ?? undefined,
          client_user_agent: request.headers.get('user-agent') ?? undefined,
          source_url: data.landingPage,
        }),
      );
    }

    // แจ้งเตือนทำงานแม้บันทึก DB ไม่สำเร็จ — เดิมกรณีนั้นลีดจะหายไป
    // เหลือแค่ console.error โดยไม่มีใครรู้ว่ามีลูกค้าติดต่อเข้ามา
    sideEffects.push(
      notifyNewLead({
        name: data.name,
        phone: data.phone,
        district: data.district,
        propertyType: data.propertyType,
        areaSize: data.areaSize ? parseFloat(String(data.areaSize)) : null,
        recommendedFilm: data.recommendedFilm,
        utmSource: data.utmSource,
        utmCampaign: data.utmCampaign,
        gclid: data.gclid,
        landingPage: data.landingPage,
        savedToDatabase: lead !== null
      })
    );

    const settled = await Promise.allSettled(sideEffects);
    settled.forEach((res) => {
      if (res.status === 'rejected') console.error('[lead] side effect failed:', res.reason);
    });

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
