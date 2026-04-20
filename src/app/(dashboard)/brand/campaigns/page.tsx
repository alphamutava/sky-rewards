"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatKES, formatNumber } from "@/lib/utils";
import { Plus, Loader2, FileVideo, Eye, Users } from "lucide-react";

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive" | "default"> = {
  DRAFT: "secondary", PENDING_APPROVAL: "warning", ACTIVE: "success",
  PAUSED: "warning", COMPLETED: "default", CANCELLED: "destructive", EXPIRED: "secondary",
};

export default function BrandCampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["brand-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns?mine=true");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">My Campaigns</h1>
          <p className="text-gray-500 mt-1">Manage your content campaigns</p>
        </div>
        <Link href="/brand/campaigns/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Campaign</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : !data?.data?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileVideo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Campaigns Yet</h3>
            <p className="text-gray-400 mb-4">Create your first campaign to reach Kenyan creators</p>
            <Link href="/brand/campaigns/new">
              <Button><Plus className="w-4 h-4 mr-2" /> Create Campaign</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.data.map((c: {
            id: string; title: string; status: string; type: string;
            totalBudget: number; remainingBudget: number;
            rewardPerView: number; totalSubmissions: number;
            totalViews: number; maxSubmissions: number;
            createdAt: string;
            _count?: { submissions: number };
          }) => (
            <Link key={c.id} href={`/brand/campaigns/${c.id}`}>
              <Card className="hover:shadow-sm transition">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusVariant[c.status] || "secondary"}>{c.status.replace("_", " ")}</Badge>
                      <Badge variant="outline" className="text-xs">{c.type}</Badge>
                    </div>
                    <h3 className="font-semibold text-[#0D1B2A]">{c.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">Created {new Date(c.createdAt).toLocaleDateString("en-KE")}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Budget</div>
                      <div className="font-semibold tabular-nums">{formatKES(Number(c.totalBudget))}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Submissions</div>
                      <div className="font-semibold flex items-center gap-1"><Users className="w-3 h-3" />{c._count?.submissions || c.totalSubmissions}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Views</div>
                      <div className="font-semibold flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(Number(c.totalViews))}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
