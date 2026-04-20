"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKES, formatNumber } from "@/lib/utils";
import { Loader2, Eye, Users, FileVideo, Wallet, BarChart3 } from "lucide-react";

export default function BrandAnalyticsPage() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["brand-profile"],
    queryFn: async () => { const r = await fetch("/api/brands/me"); return r.ok ? r.json() : null; },
  });

  const { data: campaignData } = useQuery({
    queryKey: ["brand-campaigns"],
    queryFn: async () => { const r = await fetch("/api/campaigns?mine=true"); return r.ok ? r.json() : null; },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  const profile = profileData?.profile;
  const campaigns = campaignData?.data || [];
  const totalViews = campaigns.reduce((sum: number, c: { totalViewsGenerated?: string }) => sum + Number(c.totalViewsGenerated || 0), 0);
  const totalCreators = campaigns.reduce((sum: number, c: { totalCreatorsJoined?: number }) => sum + (c.totalCreatorsJoined || 0), 0);
  const activeCampaigns = campaigns.filter((c: { status: string }) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A] flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Analytics</h1>
        <p className="text-gray-500 mt-1">Campaign performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-primary text-white">
          <CardContent className="p-5">
            <Wallet className="w-5 h-5 text-gray-300 mb-2" />
            <div className="text-2xl font-bold tabular-nums">{formatKES(profile?.totalSpentKes || 0)}</div>
            <p className="text-xs text-gray-300">Total Invested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Eye className="w-5 h-5 text-blue-500 mb-2" />
            <div className="text-2xl font-bold tabular-nums">{formatNumber(totalViews)}</div>
            <p className="text-xs text-gray-500">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Users className="w-5 h-5 text-purple-500 mb-2" />
            <div className="text-2xl font-bold tabular-nums">{totalCreators}</div>
            <p className="text-xs text-gray-500">Creators Engaged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <FileVideo className="w-5 h-5 text-[#E63946] mb-2" />
            <div className="text-2xl font-bold tabular-nums">{activeCampaigns}</div>
            <p className="text-xs text-gray-500">Active Campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Per View */}
      <Card>
        <CardHeader><CardTitle>Cost Efficiency</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Cost per 1K Views</p>
              <p className="text-3xl font-bold text-[#2D6A4F] tabular-nums">
                {totalViews > 0 ? formatKES(Math.round((profile?.totalSpentKes || 0) / totalViews * 1000)) : "—"}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Avg Views / Campaign</p>
              <p className="text-3xl font-bold text-blue-600 tabular-nums">
                {campaigns.length > 0 ? formatNumber(Math.round(totalViews / campaigns.length)) : "—"}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Avg Creators / Campaign</p>
              <p className="text-3xl font-bold text-purple-600 tabular-nums">
                {campaigns.length > 0 ? Math.round(totalCreators / campaigns.length) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader><CardTitle>Campaign Performance</CardTitle></CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No campaigns yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Campaign</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Budget</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Views</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Creators</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">CPM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((c: { id: string; title: string; totalBudgetKes: number; totalViewsGenerated: string; totalCreatorsJoined: number; remainingBudgetKes: number }) => {
                    const views = Number(c.totalViewsGenerated || 0);
                    const spent = c.totalBudgetKes - c.remainingBudgetKes;
                    const cpm = views > 0 ? Math.round(spent / views * 1000) : 0;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatKES(c.totalBudgetKes)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatNumber(views)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.totalCreatorsJoined}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#2D6A4F] font-medium">{cpm > 0 ? formatKES(cpm) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
