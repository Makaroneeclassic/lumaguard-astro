import { Inbox, BookOpen, Package, FolderOpen, LayoutDashboard } from "lucide-react";

/**
 * แถบสรุปตัวเลขบนหน้าหลังบ้าน
 *
 * เดิมทั้งสี่การ์ดเป็นลิงก์ โดยสามอันชี้ไป /admin/blog, /admin/products
 * และ /admin/portfolio ซึ่งไม่เคยมีหน้าเหล่านั้นอยู่จริง กดแล้วเจอ 404 ทุกครั้ง
 *
 * บทความจัดการผ่าน Google Sheet แล้วซิงก์ลง git ส่วนสินค้ากับผลงานมีแผน
 * จะย้ายไปทางเดียวกัน จึงจะไม่มีหน้าจัดการในระบบหลังบ้าน ตัวเลขยังมีประโยชน์
 * ในการดูว่าข้อมูลเข้าระบบครบไหม จึงเก็บไว้แต่ไม่ทำเป็นลิงก์
 */
interface Props {
  stats: {
    leadsNew: number;
    leadsTotal: number;
    posts: number;
    products: number;
    portfolio: number;
  };
}

export default function AtAGlance({ stats }: Props) {
  const tiles = [
    {
      key: "leads",
      icon: Inbox,
      label: "รายการติดต่อ",
      value: stats.leadsTotal,
      badge: stats.leadsNew > 0 ? `ใหม่ ${stats.leadsNew}` : null,
    },
    { key: "posts", icon: BookOpen, label: "บทความ", value: stats.posts, badge: null },
    { key: "products", icon: Package, label: "สินค้า", value: stats.products, badge: null },
    { key: "portfolio", icon: FolderOpen, label: "ผลงาน", value: stats.portfolio, badge: null },
  ];

  return (
    <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <LayoutDashboard className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-on-surface">ภาพรวมระบบ</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.key}
              className="flex flex-col gap-2 p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-on-surface-variant" />
                {tile.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary text-on-tertiary">
                    {tile.badge}
                  </span>
                )}
              </div>
              <span className="text-2xl font-bold text-on-surface tabular-nums">
                {tile.value.toLocaleString("th-TH")}
              </span>
              <p className="text-xs text-on-surface-variant font-light">{tile.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
