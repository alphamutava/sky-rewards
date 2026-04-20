"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKES, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, ArrowRight, Calendar } from "lucide-react";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/campaigns/${id}/join`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Failed to join");
      return d;
    },
    onSuccess: () => {
      toast.success("Campaign joined! Start creating content.");
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  const c = data?.campaign;
  if (!c) return <p className="text-center py-16 text-gray-500">Campaign not found</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">{c.type}</Badge>
            <Badge variant="outline">{c.status}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">{c.title}</h1>
          <p className="text-gray-500 mt-1">by {c.advertiser?.displayName || "Brand"}</p>
        </div>
        {session?.user?.role === "CREATOR" && c.status === "ACTIVE" && (
          <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} size="lg" className="bg-[#E63946] hover:bg-red-600">
            {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Join Campaign <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-[#2D6A4F] tabular-nums">{formatKES(Number(c.rewardPerView))}</div>
            <p className="text-xs text-gray-500">per view</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold tabular-nums">{formatKES(Number(c.creatorReward))}</div>
            <p className="text-xs text-gray-500">Creator Reward</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold tabular-nums">{formatKES(Number(c.totalBudget))}</div>
            <p className="text-xs text-gray-500">Total Budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold tabular-nums">{c._count?.submissions || 0}/{c.maxSubmissions}</div>
            <p className="text-xs text-gray-500">Submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-1">Description</h4>
            <p className="text-gray-800 whitespace-pre-wrap">{c.description}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-1">Brief</h4>
            <p className="text-gray-800 whitespace-pre-wrap">{c.brief}</p>
          </div>
          {c.guidelines && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-1">Guidelines</h4>
              <p className="text-gray-800 whitespace-pre-wrap">{c.guidelines}</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {c.tags?.length > 0 ? c.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                )) : <span className="text-sm text-gray-400">No tags</span>}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-1"><Calendar className="w-4 h-4" /> Key Dates</h4>
              <p className="text-sm text-gray-700">Start: {new Date(c.startDate).toLocaleDateString("en-KE")}</p>
              <p className="text-sm text-gray-700">End: {new Date(c.endDate).toLocaleDateString("en-KE")}</p>
            </div>
          </div>
          {c.targetCounty && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-1">Target Location</h4>
              <p className="text-sm text-gray-700">{c.targetCounty}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card>
        <CardHeader><CardTitle>Payout Structure</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-gray-600 mb-1">Reward per View</p>
              <p className="text-xl font-bold text-[#2D6A4F]">{formatKES(Number(c.rewardPerView))}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-600 mb-1">Creator Reward</p>
              <p className="text-xl font-bold text-blue-600">{formatKES(Number(c.creatorReward))}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 mb-1">Max Views/Submission</p>
              <p className="text-xl font-bold">{formatNumber(c.maxViewsPerSubmission)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Platform commission applies to campaign budgets.</p>
        </CardContent>
      </Card>
    </div>
  );
}
