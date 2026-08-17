export interface BreadcrumbItem {
  name: string;
  url: string;
}

const BASE_URL = "https://lumaguardthailand.com";

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

export function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm mb-6">
      <ol className="flex flex-wrap gap-2 text-on-surface-variant items-center">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.url} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-primary font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <a href={item.url} className="hover:text-primary">
                  {item.name}
                </a>
              )}
              {!isLast && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
