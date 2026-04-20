"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKES, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import {
  Loader2, Users, Eye, Wallet, Pause, Play, CheckCircle2,
  XCircle, ExternalLink, ArrowLeft, DollarSign,
} from "lucide-react";
import Link from "next/link";

const statusActions: Record<string, { label: string; next: string; icon: React.ElementType; color: string }[]> = {
  DRAFT: [{ label: "Fund & Activate", next: "ACTIVE", icon: DollarSign, color: "bg-[#2D6A4F]" }],
  ACTIVE: [
    { label: "Pause", next: "PAUSED", icon: Pause, color: "bg-yellow-500" },
    { label: "Complete", next: "COMPLETED", icon: CheckCircle2, color: "bg-blue-500" },
    { label: "Cancel", next: "CANCELLED", icon: XCircle, color: "bg-[#E63946]" },
  ],
  PAUSED: [{ label: "Resume", next: "ACTIVE", icon: Play, color: "bg-[#2D6A4F]" }],
};

export default function BrandCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [fundAmount, setFundAmount] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${id}`);
      return res.json();
    },
  });

  const fundMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/campaigns/${id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Failed");
      return d;
    },
    onSuccess: () => {
      toast.success("Campaign funded!");
      setFundAmount("");
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/campaigns/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Failed");
      return d;
    },
    onSuccess: () => {
      toast.success("Campaign status updated!");
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  const c = data?.campaign;
  if (!c) return <p className="text-gray-500 text-center py-16">Campaign not found</p>;

  const actions = statusActions[c.status] || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/brand/campaigns"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{c.status.replace("_", " ")}</Badge>
            <Badge variant="secondary">{c.type}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">{c.title}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="w-5 h-5 text-[#2D6A4F] mx-auto mb-2" />
            <div className="text-xl font-bold tabular-nums">{formatKES(Number(c.remainingBudget))}</div>
            <p className="text-xs text-gray-500">Remaining / {formatKES(Number(c.totalBudget))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold tabular-nums">{c._count?.submissions || c.totalSubmissions || 0}</div>
            <p className="text-xs text-gray-500">Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <div className="text-xl font-bold tabular-nums">{formatNumber(Number(c.totalViews || 0))}</div>
            <p className="text-xs text-gray-500">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 text-[#E63946] mx-auto mb-2" />
            <div className="text-xl font-bold tabular-nums">{formatKES(Number(c.rewardPerView))}</div>
            <p className="text-xs text-gray-500">per view</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle>Campaign Actions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {c.status === "DRAFT" && (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Fund this campaign with {formatKES(Number(c.totalBudget))} from your wallet to activate it.</p>
              </div>
              <Button onClick={() => fundMutation.mutate()} disabled={fundMutation.isPending} className="bg-[#2D6A4F] hover:bg-green-700">
                {fundMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                Fund & Activate
              </Button>
            </div>
          )}

          {actions.length > 0 && c.status !== "DRAFT" && (
            <div className="flex gap-3">
              {actions.map((a) => (
                <Button key={a.next} onClick={() => statusMutation.mutate(a.next)} disabled={statusMutation.isPending}
                  className={`${a.color} text-white hover:opacity-90`} variant="default">
                  <a.icon className="w-4 h-4 mr-2" /> {a.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card>
        <CardHeader><CardTitle>Submissions ({c._count?.submissions || 0})</CardTitle></CardHeader>
        <CardContent>
          {c.submissions?.length ? (
            <div className="space-y-3">
              {c.submissions.map((s: {
                id: string; mediaType: string; mediaUrl: string; status: string;
                viewCount: number; title: string; createdAt: string;
                creator: { displayName: string };
              }) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{s.creator?.displayName || 'Creator'}</p>
                    <p className="text-xs text-gray-500">{s.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{s.mediaType}</Badge>
                      <Badge variant={s.status === "APPROVED" ? "success" : s.status === "REJECTED" ? "destructive" : "warning"} className="text-[10px]">{s.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="tabular-nums text-gray-500">{formatNumber(s.viewCount)} views</span>
                    <a href={s.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No submissions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
