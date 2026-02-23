"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard",        href: "/dashboard" },
  { label: "Product Categories", href: "/dashboard/product-categories" },
  { label: "Products",         href: "/dashboard/products" },
  { label: "Orders",           href: "/dashboard/orders" },
  { label: "Customers",        href: "/dashboard/customers" },
  { label: "Revenue Shares",   href: "/dashboard/revenue-shares" },
  { label: "Service Records",  href: "/dashboard/service-records" },
  { label: "Team",             href: "/dashboard/team" },
  { label: "Settings",         href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-indigo-950 flex flex-col">
      <div className="px-5 py-6 border-b border-indigo-900">
        <span className="text-white font-bold text-base">Store Admin</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-violet-600 text-white"
                  : "text-indigo-300 hover:bg-indigo-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
