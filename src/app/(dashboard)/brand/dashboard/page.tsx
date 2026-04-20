"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatKES, formatNumber } from "@/lib/utils";
import { FileVideo, Wallet, Eye, Users, Plus, Loader2, ArrowRight } from "lucide-react";

export default function BrandDashboard() {
  const { data: profileData, isLoading: pLoading } = useQuery({
    queryKey: ["brand-profile"],
    queryFn: async () => { const r = await fetch("/api/brands/me"); return r.ok ? r.json() : null; },
  });

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const r = await fetch("/api/wallet"); return r.ok ? r.json() : null; },
  });

  const profile = profileData?.profile;
  const wallet = walletData?.data?.wallet;

  if (pLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">
            {profile ? `Welcome, ${profile.displayName || profile.firstName || 'Brand'}` : "Brand Dashboard"}
          </h1>
          <p className="text-gray-500 mt-1">Manage your campaigns and reach Kenyan audiences</p>
        </div>
        <Link href="/brand/campaigns/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Campaign</Button>
        </Link>
      </div>

      {!profile && (
        <Card className="bg-[#0D1B2A]/5 border-[#0D1B2A]/20">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold text-[#0D1B2A]">Complete your brand profile</p>
              <p className="text-sm text-gray-500">Set up your profile before creating campaigns</p>
            </div>
            <Link href="/brand/profile"><Button size="sm">Set Up <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <Wallet className="w-5 h-5 text-[#2D6A4F] mb-3" />
            <div className="text-2xl font-bold tabular-nums">{formatKES(Number(wallet?.balance || 0))}</div>
            <p className="text-xs text-gray-500 mt-1">Wallet Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <FileVideo className="w-5 h-5 text-[#E63946] mb-3" />
            <div className="text-2xl font-bold tabular-nums">{0}</div>
            <p className="text-xs text-gray-500 mt-1">Total Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Eye className="w-5 h-5 text-blue-500 mb-3" />
            <div className="text-2xl font-bold tabular-nums">{formatNumber(Number(profile?.totalViews || 0))}</div>
            <p className="text-xs text-gray-500 mt-1">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Users className="w-5 h-5 text-purple-500 mb-3" />
            <div className="text-2xl font-bold tabular-nums">{formatKES(Number(wallet?.totalWithdrawn || 0))}</div>
            <p className="text-xs text-gray-500 mt-1">Total Spent</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/brand/campaigns/new">
          <Card className="hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E63946]/10 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#E63946]" />
              </div>
              <div>
                <p className="font-semibold text-[#0D1B2A]">Create Campaign</p>
                <p className="text-sm text-gray-500">Launch a new content campaign</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/brand/wallet">
          <Card className="hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2D6A4F]/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-[#2D6A4F]" />
              </div>
              <div>
                <p className="font-semibold text-[#0D1B2A]">Fund Wallet</p>
                <p className="text-sm text-gray-500">Deposit via M-Pesa to fund campaigns</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
