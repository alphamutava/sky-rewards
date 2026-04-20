"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatKES, formatNumber } from "@/lib/utils";
import {
  Wallet, TrendingUp, Eye, FileVideo, ArrowRight,
  Award, Star, Loader2,
} from "lucide-react";

async function fetchDashboard() {
  const [profileRes, walletRes] = await Promise.all([
    fetch("/api/users/me"),
    fetch("/api/wallet"),
  ]);
  const profile = profileRes.ok ? await profileRes.json() : null;
  const wallet = walletRes.ok ? await walletRes.json() : null;
  return { profile: profile?.data?.user, wallet: wallet?.data?.wallet };
}

export default function CreatorDashboard() {
  useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["creator-dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const profile = data?.profile;
  const wallet = data?.wallet;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">
          Welcome back{profile?.displayName ? `, ${profile.displayName}` : ""}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your content</p>
      </div>

      {/* Profile setup banner */}
      {!profile && (
        <Card className="bg-[#E63946]/5 border-[#E63946]/20">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold text-[#0D1B2A]">Complete your profile to start earning</p>
              <p className="text-sm text-gray-500">Set up your creator profile to join campaigns</p>
            </div>
            <Link href="/profile">
              <Button size="sm">Set Up Profile <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Wallet className="w-5 h-5 text-[#2D6A4F]" />
              <Badge variant="success" className="text-xs">Balance</Badge>
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatKES(Number(wallet?.balance || 0))}</div>
            <p className="text-xs text-gray-500 mt-1">Available to withdraw</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-[#E63946]" />
              <Badge variant="secondary" className="text-xs">Total</Badge>
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatKES(Number(profile?.totalEarned || 0))}</div>
            <p className="text-xs text-gray-500 mt-1">Total earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Eye className="w-5 h-5 text-blue-500" />
              <Badge variant="secondary" className="text-xs">Views</Badge>
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatNumber(Number(profile?.totalViews || 0))}</div>
            <p className="text-xs text-gray-500 mt-1">Total views generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <FileVideo className="w-5 h-5 text-purple-500" />
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <div className="text-2xl font-bold tabular-nums">{profile?.totalSubmissions || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Trust Score & Badges Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-[#E9C46A]" /> Trust Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-bold text-[#0D1B2A] tabular-nums">{Number(profile?.averageRating || 0).toFixed(1)}</span>
              <span className="text-gray-400 text-lg mb-1">/5.0</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#E63946] via-[#E9C46A] to-[#2D6A4F] h-3 rounded-full transition-all"
                style={{ width: `${(Number(profile?.averageRating || 0) / 5) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {Number(profile?.averageRating || 0) >= 4
                ? "Excellent! You're a top-rated creator."
                : "Complete more campaigns to build your rating."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-[#E63946]" /> Badges</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.isElite ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="py-1.5 px-3 border-amber-400 text-amber-700">Elite 100 Member</Badge>
                {profile.eliteRank && <Badge variant="outline" className="py-1.5 px-3">Rank #{profile.eliteRank}</Badge>}
                {(profile.totalApproved || 0) >= 10 && <Badge variant="outline" className="py-1.5 px-3">10+ Approved</Badge>}
                {(profile.totalApproved || 0) >= 50 && <Badge variant="outline" className="py-1.5 px-3">50+ Approved</Badge>}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keep creating great content to earn badges and join The 100!</p>
              </div>
            )}
            <Link href="/badges" className="inline-flex items-center gap-1 text-sm text-[#E63946] mt-4 hover:underline">
              View all badges <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/discover">
          <Card className="hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E63946]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileVideo className="w-6 h-6 text-[#E63946]" />
              </div>
              <div>
                <p className="font-semibold text-[#0D1B2A]">Find Campaigns</p>
                <p className="text-xs text-gray-500">Browse active campaigns</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/wallet">
          <Card className="hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2D6A4F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-[#2D6A4F]" />
              </div>
              <div>
                <p className="font-semibold text-[#0D1B2A]">Withdraw Funds</p>
                <p className="text-xs text-gray-500">Send to M-Pesa</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/submissions">
          <Card className="hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-[#0D1B2A]">My Submissions</p>
                <p className="text-xs text-gray-500">Track your content</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
