"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Bell, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        <div className="lg:hidden w-10" />
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative p-2 text-muted hover:text-white rounded-lg hover:bg-card transition-colors">
            <Bell className="w-5 h-5" />
          </Link>
          <Link href={session?.user?.role === "BRAND" ? "/brand/profile" : "/profile"} className="p-2 text-muted hover:text-white rounded-lg hover:bg-card transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-muted hover:text-white hover:bg-card transition-colors font-bold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
