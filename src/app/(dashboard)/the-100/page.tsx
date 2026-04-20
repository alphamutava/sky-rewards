"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatKES, formatNumber, getInitials } from "@/lib/utils";
import { Loader2, Star, Users, TrendingUp, Trophy, Crown } from "lucide-react";

interface Member {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalEarningsKes: number;
  totalViews: string;
  trustScore: number;
  the100JoinedAt: string;
  badges: { type: string }[];
}

export default function The100Page() {
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
    <div className="space-y-8">
      {/* Hero */}
      <div className="gradient-primary rounded-2xl p-8 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-6 h-6 text-[#E9C46A]" />
          <h1 className="text-3xl font-bold">The 100</h1>
        </div>
        <p className="text-gray-300 text-lg max-w-2xl mb-6">
          Kenya&apos;s elite content creator collective. 100 creators. One goal: KES 100,000,000 in combined revenue.
        </p>
        <div className="bg-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-300">Progress to KES 100M</span>
            <span className="text-sm font-semibold text-[#E9C46A]">{data?.progressPercent || 0}%</span>
          </div>
          <Progress value={data?.progressPercent || 0} className="h-3 bg-white/20" />
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-gray-400">{formatKES(data?.totalEarningsKes || 0)} earned</span>
            <span className="text-gray-400">Target: {formatKES(data?.targetKes || 100000000)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
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
            <div className="text-2xl font-bold">{100 - (data?.memberCount || 0)}</div>
            <p className="text-xs text-gray-500">Spots Left</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-[#E9C46A]" /> Leaderboard</CardTitle></CardHeader>
        <CardContent>
          {!data?.members?.length ? (
            <p className="text-center text-gray-400 py-8">No members yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {data.members.map((m: Member, i: number) => (
                <div key={m.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? "bg-[#E9C46A] text-[#0D1B2A]" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-orange-800" : "bg-gray-100 text-gray-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#0D1B2A] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {getInitials(m.displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0D1B2A] truncate">{m.displayName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Trust: {m.trustScore}</span>
                      <span>&middot;</span>
                      <span>{formatNumber(Number(m.totalViews))} views</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#2D6A4F] tabular-nums">{formatKES(m.totalEarningsKes)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
