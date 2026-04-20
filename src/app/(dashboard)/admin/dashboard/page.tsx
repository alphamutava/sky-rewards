"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { formatKES, formatNumber } from "@/lib/utils";
import { Loader2, Users, FileVideo, Wallet, TrendingUp, DollarSign, ShieldCheck, Eye, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  const s = data?.stats;
  if (!s) return <p className="text-gray-500 py-8 text-center">Failed to load dashboard</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and key metrics</p>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Users</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <Users className="w-5 h-5 text-blue-500 mb-3" />
              <div className="text-2xl font-bold tabular-nums">{formatNumber(s.totalUsers || 0)}</div>
              <p className="text-xs text-gray-500">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Activity className="w-5 h-5 text-green-500 mb-3" />
              <div className="text-2xl font-bold tabular-nums">{formatNumber(s.totalCreators || 0)}</div>
              <p className="text-xs text-gray-500">Creators</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <ShieldCheck className="w-5 h-5 text-purple-500 mb-3" />
              <div className="text-2xl font-bold tabular-nums">{formatNumber(s.totalBrands || 0)}</div>
              <p className="text-xs text-gray-500">Brands</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Users className="w-5 h-5 text-[#E9C46A] mb-3" />
              <div className="text-2xl font-bold tabular-nums">{s.the100Members || 0}<span className="text-gray-400 text-sm">/100</span></div>
              <p className="text-xs text-gray-500">The 100 Members</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Campaign Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Campaigns</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <FileVideo className="w-5 h-5 text-[#E63946] mb-3" />
              <div className="text-2xl font-bold tabular-nums">{s.totalCampaigns || 0}</div>
              <p className="text-xs text-gray-500">Total Campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <FileVideo className="w-5 h-5 text-green-500 mb-3" />
              <div className="text-2xl font-bold tabular-nums">{s.activeCampaigns || 0}</div>
              <p className="text-xs text-gray-500">Active Campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <TrendingUp className="w-5 h-5 text-blue-500 mb-3" />
              <div className="text-2xl font-bold tabular-nums">{s.totalSubmissions || 0}</div>
              <p className="text-xs text-gray-500">Total Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Eye className="w-5 h-5 text-purple-500 mb-3" />
              <div className="text-2xl font-bold tabular-nums">{formatNumber(Number(s.totalViews || 0))}</div>
              <p className="text-xs text-gray-500">Total Views</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Financials</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gradient-primary text-white">
            <CardContent className="p-5">
              <Wallet className="w-5 h-5 text-gray-300 mb-3" />
              <div className="text-2xl font-bold tabular-nums">{formatKES(s.totalDeposits || 0)}</div>
              <p className="text-xs text-gray-300">Total Deposits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <DollarSign className="w-5 h-5 text-[#2D6A4F] mb-3" />
              <div className="text-2xl font-bold tabular-nums">{formatKES(s.totalCreatorEarnings || 0)}</div>
              <p className="text-xs text-gray-500">Creator Earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <TrendingUp className="w-5 h-5 text-[#E63946] mb-3" />
              <div className="text-2xl font-bold tabular-nums">{formatKES(s.totalCommissions || 0)}</div>
              <p className="text-xs text-gray-500">Platform Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Wallet className="w-5 h-5 text-orange-500 mb-3" />
              <div className="text-2xl font-bold tabular-nums">{formatKES(s.totalWithdrawals || 0)}</div>
              <p className="text-xs text-gray-500">Total Withdrawals</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
