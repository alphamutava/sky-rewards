"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatKES, formatNumber, getInitials } from "@/lib/utils";
import { Loader2, Crown, Users, TrendingUp, Trophy } from "lucide-react";

export default function AdminThe100Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["the-100-progress"],
    queryFn: async () => {
      const res = await fetch("/api/the-100/progress");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A] flex items-center gap-2"><Crown className="w-6 h-6 text-[#E9C46A]" /> The 100 Management</h1>
        <p className="text-gray-500 mt-1">Manage Kenya&apos;s elite creator collective</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <Users className="w-6 h-6 text-[#E63946] mx-auto mb-2" />
            <div className="text-2xl font-bold">{data?.memberCount || 0}<span className="text-gray-400 text-sm"> / 100</span></div>
            <p className="text-xs text-gray-500">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <TrendingUp className="w-6 h-6 text-[#2D6A4F] mx-auto mb-2" />
            <div className="text-2xl font-bold tabular-nums">{formatKES(data?.totalEarningsKes || 0)}</div>
            <p className="text-xs text-gray-500">Combined Earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <Trophy className="w-6 h-6 text-[#E9C46A] mx-auto mb-2" />
            <div className="text-2xl font-bold tabular-nums">{data?.progressPercent || 0}%</div>
            <p className="text-xs text-gray-500">Target Progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress to KES 100M</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={data?.progressPercent || 0} className="h-4" />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>{formatKES(data?.totalEarningsKes || 0)}</span>
            <span>{formatKES(100000000)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent>
          {!data?.members?.length ? (
            <p className="text-center text-gray-400 py-8">No members yet</p>
          ) : (
            <div className="space-y-3">
              {data.members.map((m: { id: string; displayName: string; totalEarningsKes: number; totalViews: string; trustScore: number; the100JoinedAt: string }, i: number) => (
                <div key={m.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{i + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-[#0D1B2A] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {getInitials(m.displayName)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#0D1B2A]">{m.displayName}</p>
                    <p className="text-xs text-gray-400">Trust: {m.trustScore} &middot; {formatNumber(Number(m.totalViews))} views &middot; Joined {new Date(m.the100JoinedAt).toLocaleDateString("en-KE")}</p>
                  </div>
                  <div className="font-semibold text-[#2D6A4F] tabular-nums">{formatKES(m.totalEarningsKes)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
