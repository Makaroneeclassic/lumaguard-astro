# Deploy (Dokploy บน Hostinger VPS)

- Build: `npm run build` → `dist/` (static ใน `dist/client`, เซิร์ฟเวอร์ใน `dist/server`)
- Start: `npm start` (ฟังที่ `0.0.0.0:$PORT`, ค่าเริ่มต้น 4321)
- Auto-deploy: Dokploy build ใหม่ทุกครั้งที่ push เข้า `main`
  (บทความจาก /admin/blog และ GitHub Actions blog-sync จึงขึ้นเว็บเองเหมือนตอนอยู่ Vercel)
- Security headers: ไม่ได้ตั้งในโค้ด — ใช้ Traefik middleware ตาม `traefik-security-headers.yml`
  วางไฟล์นี้ใน Dokploy → Traefik File System แล้วใส่ `lumaguard-security-headers@file`
  ในช่อง Middlewares ของโดเมน
- `scripts/add-security-headers.mjs` ใช้กับ Vercel เท่านั้น ไม่ได้ถูกเรียกใน build แล้ว
