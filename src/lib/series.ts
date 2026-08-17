/**
 * ข้อมูลซีรีส์ฟิล์ม 6 ซีรีส์ — ใช้สร้างหน้า /products/[series]
 *
 * `slug` คือ URL ส่วน `dbName` ใช้จับคู่กับฟิลด์ series ในตาราง Product
 * (ตัวพิมพ์ไม่ตรงกัน จึงต้องแยกสองฟิลด์)
 */
export interface SeriesDetail {
  slug: string;
  dbName: string;
  displayName: string;
  tag: string;
  subtitle: string;
  description: string;
  /** คลาส gradient ของแบนเนอร์ ต่อท้าย bg-gradient-to-br */
  bannerBg: string;
}

export const SERIES: SeriesDetail[] = [
  {
    slug: 'element',
    dbName: 'Element',
    displayName: 'Element Series',
    tag: 'STANDARD CERAMIC',
    subtitle: 'เทคโนโลยี Ceramic Film ระดับเริ่มต้น ดำเข้มสนิท สัญญาณผ่านสะดวก 100%',
    description:
      'ฟิล์มกรองแสงเซรามิคคุณภาพระดับมาตรฐาน ดำเข้มสนิทจากภายนอก ให้ความเป็นส่วนตัวสูง สัญญาณผ่านได้สะดวก เหมาะสำหรับผู้ที่ต้องการความคุ้มค่าและประสิทธิภาพการกรองแสงแดดที่เป็นเลิศ',
    bannerBg: 'from-slate-900 to-slate-800 text-slate-100',
  },
  {
    slug: 'shield',
    dbName: 'Shield',
    displayName: 'Shield Series',
    tag: 'NANO CERAMIC SHIELD',
    subtitle: 'เทคโนโลยี Nano Ceramic Film ระดับพรีเมียม ป้องกันรังสีอินฟราเรดสูง 90%',
    description:
      'ฟิล์มกรองแสงนาโนเซรามิคที่ออกแบบมาเพื่อสกัดรังสีความร้อนอินฟราเรด (IRR) สูงสุดถึง 90% ให้ความมืดเงียบสงบเป็นส่วนตัวและทัศนวิสัยส่องสว่างชัดเจนจากภายในตัวบ้านหรืออาคาร',
    bannerBg: 'from-emerald-950 to-teal-900 text-emerald-100',
  },
  {
    slug: 'zenith',
    dbName: 'Zenith',
    displayName: 'Zenith Series',
    tag: 'PREMIUM NANO CERAMIC',
    subtitle: 'เทคโนโลยี Premium Nano Ceramic Film บล็อกความร้อนหนาแน่นและทนทานพิเศษ',
    description:
      'สุดยอดฟิล์มกรองแสงเซรามิคเกรดสูงสุด ใช้อนุภาคนาโนเซรามิคหนาแน่นพิเศษสกัดกั้นพลังงานความร้อนอินฟราเรดสะสมได้ถึง 93% มอบเสถียรภาพสีกาวและประสิทธิภาพยาวนานเป็นพิเศษ',
    bannerBg: 'from-purple-950 to-indigo-900 text-indigo-100',
  },
  {
    slug: 'nexus',
    dbName: 'Nexus',
    displayName: 'Nexus Series',
    tag: 'SPUTTERED PERFORMANCE',
    subtitle: 'เทคโนโลยี Sputtering Film สะท้อนรังสีความร้อนโลหะหลายชั้น ประหยัดพลังงานดีเยี่ยม',
    description:
      'ฟิล์มกรองแสงสปัตเตอร์สุญญากาศ เคลือบอนุภาคโลหะหลายชั้นเพื่อทำหน้าที่สะท้อนพลังงานความร้อนแดดออกจากหน้าต่างทันทีก่อนพัดเข้าสู่ห้อง มอบการประหยัดพลังงานแอร์อย่างโดดเด่น',
    bannerBg: 'from-sky-950 to-slate-900 text-sky-100',
  },
  {
    slug: 'apex',
    dbName: 'Apex',
    displayName: 'Apex Series',
    tag: 'ULTIMATE NANO SPUTTERED',
    subtitle: 'เทคโนโลยี Nano Sputtering Film เคลือบทองคำและโลหะมีค่า สะท้อนความร้อนขีดสุด 80%',
    description:
      'ที่สุดแห่งนวัตกรรมฟิล์มสปัตเตอร์ระดับไฮเอนด์ เคลือบทองคำ เงิน และไทเทเนียมระดับนาโนเมตร สะท้อนความร้อนอินฟราเรดสูงสุดถึง 95% และลดความร้อนรวมได้สูงสุดถึง 80% ป้องกันแอร์ทำงานหนักได้อย่างเด็ดขาด',
    bannerBg: 'from-neutral-950 to-amber-950 text-amber-100',
  },
  {
    slug: 'guardian',
    dbName: 'Guardian',
    displayName: 'Guardian Series',
    tag: 'UHD CERAMIC SHIELD',
    subtitle: 'เทคโนโลยี UHD Ceramic เกรดพิเศษ สว่างเคลียร์ใส และป้องกัน UV 100%',
    description:
      'ฟิล์มกรองแสงเซรามิคเกรดพิเศษสุดคมชัด UHD Ceramic โดดเด่นด้วยประสิทธิภาพในการป้องกันรังสี UV ได้ 100% สกัดรังสีความร้อนได้ดีเยี่ยม ให้ความสว่างใสคมชัดสูงสุดและปกป้องผิวของทุกคนในครอบครัว',
    bannerBg: 'from-indigo-950 to-blue-900 text-blue-100',
  },
];

export const getSeries = (slug: string): SeriesDetail | undefined =>
  SERIES.find((s) => s.slug === slug.toLowerCase());
