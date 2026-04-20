"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, Star, TrendingUp, Eye, Wallet, Zap, Users, CheckCircle2, Crown } from "lucide-react";

const badgeInfo: Record<string, { label: string; desc: string; color: string; icon: React.ElementType }> = {
  NEWCOMER: { label: "Newcomer", desc: "Completed your first campaign", color: "bg-blue-50 text-blue-700", icon: Star },
  RISING_STAR: { label: "Rising Star", desc: "Completed 10+ campaigns", color: "bg-purple-50 text-purple-700", icon: TrendingUp },
  VERIFIED_CREATOR: { label: "Verified Creator", desc: "50+ campaigns, 80+ trust score", color: "bg-green-50 text-green-700", icon: CheckCircle2 },
  THE_100_MEMBER: { label: "The 100 Member", desc: "Member of Kenya's elite creator collective", color: "bg-yellow-50 text-yellow-700", icon: Crown },
  TOP_PERFORMER: { label: "Top Performer", desc: "Trust score above 90", color: "bg-red-50 text-red-700", icon: Award },
  VIRAL_MAKER: { label: "Viral Maker", desc: "Achieved a viral submission", color: "bg-pink-50 text-pink-700", icon: Zap },
  BRAND_FAVORITE: { label: "Brand Favorite", desc: "Completed 5+ campaigns", color: "bg-indigo-50 text-indigo-700", icon: Users },
  CONSISTENT: { label: "Consistent", desc: "Completed 3+ campaigns", color: "bg-teal-50 text-teal-700", icon: TrendingUp },
  MILLION_VIEWS: { label: "Million Views", desc: "1M+ total verified views", color: "bg-orange-50 text-orange-700", icon: Eye },
  FIRST_EARNING: { label: "First Earning", desc: "Earned your first KES on Sky Kenya", color: "bg-emerald-50 text-emerald-700", icon: Wallet },
  SPEED_DEMON: { label: "Speed Demon", desc: "Submitted within 24h of joining", color: "bg-cyan-50 text-cyan-700", icon: Zap },
};

export default function BadgesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await fetch("/api/creators/me");
      return res.ok ? res.json() : { profile: null };
    },
  });

  const earned = new Set((data?.profile?.badges || []).map((b: { type: string }) => b.type));
  const allBadges = Object.entries(badgeInfo);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Badges</h1>
        <p className="text-gray-500 mt-1">Earn badges by completing milestones on Sky Kenya</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allBadges.map(([type, info]) => {
          const isEarned = earned.has(type);
          const Icon = info.icon;
          return (
            <Card key={type} className={isEarned ? "" : "opacity-40 grayscale"}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${info.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-[#0D1B2A]">{info.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{info.desc}</p>
                  {isEarned && <Badge variant="success" className="mt-2 text-[10px]">Earned</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
