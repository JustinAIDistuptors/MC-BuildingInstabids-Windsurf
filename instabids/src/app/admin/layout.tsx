"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const navigationLinks = [
    {
      name: "Dashboard",
      href: "/admin",
      active: pathname === "/admin",
    },
    {
      name: "Homeowner Acquisition",
      href: "/admin/agent-integration/homeowner-acquisition",
      active: pathname.includes("/admin/agent-integration/homeowner-acquisition"),
    },
    {
      name: "Contractor Recruitment",
      href: "/admin/agent-integration/contractor-recruitment",
      active: pathname.includes("/admin/agent-integration/contractor-recruitment"),
    },
    {
      name: "Property Manager Acquisition",
      href: "/admin/agent-integration/property-manager-acquisition",
      active: pathname.includes("/admin/agent-integration/property-manager-acquisition"),
    },
    {
      name: "Labor Networking",
      href: "/admin/agent-integration/labor-networking",
      active: pathname.includes("/admin/agent-integration/labor-networking"),
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">InstaBids Admin</h1>
        </div>
        <nav className="space-y-1">
          {navigationLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`block px-3 py-2 rounded-md ${
                link.active
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
