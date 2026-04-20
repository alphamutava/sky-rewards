"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Search, FileVideo, Wallet, TrendingUp, Award,
  Bell, User, Settings, Star, Building2, BarChart3, Users, Shield,
  Menu, X,
} from "lucide-react";
import { useState } from "react";

const creatorNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Discover", href: "/discover", icon: Search },
  { label: "My Campaigns", href: "/campaigns", icon: FileVideo },
  { label: "Submissions", href: "/submissions", icon: TrendingUp },
  { label: "Earnings", href: "/earnings", icon: Wallet },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Badges", href: "/badges", icon: Award },
  { label: "The 100", href: "/the-100", icon: Star },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

const brandNav = [
  { label: "Dashboard", href: "/brand/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", href: "/brand/campaigns", icon: FileVideo },
  { label: "Analytics", href: "/brand/analytics", icon: BarChart3 },
  { label: "Wallet", href: "/brand/wallet", icon: Wallet },
  { label: "Profile", href: "/brand/profile", icon: Building2 },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Shield },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Campaigns", href: "/admin/campaigns", icon: FileVideo },
  { label: "The 100", href: "/admin/the-100", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role;
  const nav = role === "ADMIN" ? adminNav : role === "BRAND" ? brandNav : creatorNav;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <Link href="/" className="text-xl font-bold text-[#0D1B2A]">
            Sky <span className="text-[#E63946]">Kenya</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {nav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#0D1B2A] text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0D1B2A] flex items-center justify-center text-white text-xs font-semibold">
              {session?.user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{role?.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
