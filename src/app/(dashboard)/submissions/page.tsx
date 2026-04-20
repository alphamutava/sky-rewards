"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKES, formatNumber } from "@/lib/utils";
import { Loader2, Eye, FileVideo, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Submission {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: string;
  status: string;
  viewCount: number;
  uniqueViewers: number;
  totalEarned: number;
  creatorEarned: number;
  qualityScore: number | null;
  createdAt: string;
  campaign: { id: string; title: string; slug: string; rewardPerView: number };
}

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary" | "default"> = {
  PENDING: "warning",
  IN_REVIEW: "default",
  APPROVED: "success",
  REJECTED: "destructive",
  FLAGGED: "destructive",
  REVISION_REQUESTED: "warning",
};

export default function SubmissionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/submissions");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">My Submissions</h1>
        <p className="text-gray-500 mt-1">Track your content submissions and earnings</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : !data?.data?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileVideo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Submissions Yet</h3>
            <p className="text-gray-400 mb-4">Join a campaign and submit your first piece of content</p>
            <Link href="/discover" className="text-[#E63946] font-medium hover:underline">
              Browse Campaigns
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.data.map((sub: Submission) => (
            <Card key={sub.id} className="hover:shadow-sm transition">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusVariant[sub.status] || "secondary"} className="text-xs">
                        {sub.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{sub.mediaType}</Badge>
                    </div>
                    <h3 className="font-semibold text-[#0D1B2A] truncate">{sub.campaign.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{sub.title}</p>
                    <a href={sub.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1">
                      View Content <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Views</div>
                      <div className="font-semibold tabular-nums flex items-center gap-1">
                        <Eye className="w-4 h-4 text-gray-400" />
                        {formatNumber(sub.viewCount)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Earned</div>
                      <div className="font-semibold text-[#2D6A4F] tabular-nums">
                        {formatKES(Number(sub.creatorEarned || sub.totalEarned || 0))}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Quality</div>
                      <div className="font-semibold tabular-nums">
                        {sub.qualityScore !== null ? `${Number(sub.qualityScore).toFixed(1)}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-3">
                  Submitted {new Date(sub.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
