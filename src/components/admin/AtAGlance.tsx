const Link = ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>;
import { Inbox, BookOpen, Package, FolderOpen, LayoutDashboard } from "lucide-react";

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
      href: "/admin",
      icon: Inbox,
      label: "รายการติดต่อ",
      value: stats.leadsTotal,
      highlight:
        stats.leadsNew > 0
          ? { text: `ใหม่ ${stats.leadsNew}`, className: "bg-tertiary text-on-tertiary" }
          : null,
    },
    {
      href: "/admin/blog",
      icon: BookOpen,
      label: "บทความ",
      value: stats.posts,
      highlight: null,
    },
    {
      href: "/admin/products",
      icon: Package,
      label: "สินค้า",
      value: stats.products,
      highlight: null,
    },
    {
      href: "/admin/portfolio",
      icon: FolderOpen,
      label: "ผลงาน",
      value: stats.portfolio,
      highlight: null,
    },
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
            <Link
              key={tile.href + tile.label}
              href={tile.href}
              className="group flex flex-col gap-2 p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                {tile.highlight && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tile.highlight.className}`}>
                    {tile.highlight.text}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface tabular-nums">
                  {tile.value.toLocaleString("th-TH")}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-light">{tile.label}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
