"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKES, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2, ArrowRight, Calendar, Link2, Send, CheckCircle2,
  Eye, Users, Clock, ExternalLink, FileVideo, ImageIcon, FileText,
} from "lucide-react";

const mediaTypeOptions = [
  { value: "video", label: "Video", icon: FileVideo },
  { value: "image", label: "Photo", icon: ImageIcon },
  { value: "article", label: "Article", icon: FileText },
];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: "",
    mediaUrl: "",
    mediaType: "video" as "video" | "image" | "article",
    description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  // Check if creator already submitted
  const { data: mySubmissions } = useQuery({
    queryKey: ["my-submissions-for", id],
    queryFn: async () => {
      const res = await fetch(`/api/submissions?campaignId=${id}`);
      return res.json();
    },
    enabled: session?.user?.role === "CREATOR",
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!submitForm.mediaUrl.trim()) throw new Error("Please paste your content link");
      if (!submitForm.title.trim()) throw new Error("Please add a title for your submission");

      // Basic URL validation
      try { new URL(submitForm.mediaUrl); } catch { throw new Error("Please enter a valid URL"); }

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: id,
          title: submitForm.title,
          description: submitForm.description || undefined,
          mediaUrl: submitForm.mediaUrl,
          mediaType: submitForm.mediaType,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Failed to submit");
      return d;
    },
    onSuccess: () => {
      toast.success("Content submitted! Your submission is pending review.");
      setShowSubmitForm(false);
      setSubmitForm({ title: "", mediaUrl: "", mediaType: "video", description: "" });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions-for", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  const c = data?.campaign;
  if (!c) return <p className="text-center py-16 text-gray-500">Campaign not found</p>;

  const isCreator = session?.user?.role === "CREATOR";
  const hasSubmitted = mySubmissions?.data?.length > 0;
  const existingSubmission = mySubmissions?.data?.[0];
  const isFull = (c._count?.submissions || 0) >= c.maxSubmissions;
  const isActive = c.status === "ACTIVE";
  const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">{c.type}</Badge>
            <Badge variant={c.status === "ACTIVE" ? "success" : "outline"}>{c.status}</Badge>
            {isActive && daysLeft <= 7 && (
              <Badge variant="warning" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />{daysLeft}d left
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">{c.title}</h1>
          <p className="text-gray-500 mt-1">by {c.advertiser?.displayName || "Brand"}</p>
        </div>

        {/* Creator CTA */}
        {isCreator && isActive && !hasSubmitted && !isFull && !showSubmitForm && (
          <Button
            onClick={() => setShowSubmitForm(true)}
            size="lg"
            className="bg-[#E63946] hover:bg-red-600 shadow-lg"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Your Content
          </Button>
        )}
        {isCreator && hasSubmitted && (
          <Badge variant="success" className="px-4 py-2 text-sm">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Submitted — {existingSubmission?.status?.replace("_", " ")}
          </Badge>
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

      {/* Submit Content Form */}
      {showSubmitForm && isCreator && (
        <Card className="border-2 border-[#E63946] shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#E63946] to-red-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Submit Your Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Create your content based on the campaign brief below</li>
                <li>Post it on your platform (TikTok, YouTube, Instagram, etc.)</li>
                <li>Paste the link to your posted content here</li>
                <li>Get paid {formatKES(Number(c.rewardPerView))} for every view once approved!</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex gap-3">
                {mediaTypeOptions.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSubmitForm((p) => ({ ...p, mediaType: t.value as any }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border text-sm font-medium transition ${
                      submitForm.mediaType === t.value
                        ? "bg-[#0D1B2A] text-white border-[#0D1B2A]"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission-title">Title *</Label>
              <Input
                id="submission-title"
                value={submitForm.title}
                onChange={(e) => setSubmitForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="My awesome content for this campaign"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-url">Content Link * <span className="text-gray-400 font-normal">(paste your TikTok, YouTube, Instagram, X link)</span></Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="media-url"
                  className="pl-10"
                  value={submitForm.mediaUrl}
                  onChange={(e) => setSubmitForm((p) => ({ ...p, mediaUrl: e.target.value }))}
                  placeholder="https://www.tiktok.com/@yourhandle/video/..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission-desc">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
              <textarea
                id="submission-desc"
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] focus:ring-offset-2"
                value={submitForm.description}
                onChange={(e) => setSubmitForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Tell us about your content..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || !submitForm.mediaUrl || !submitForm.title}
                className="flex-1 bg-[#E63946] hover:bg-red-600"
                size="lg"
              >
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Content
              </Button>
              <Button variant="outline" size="lg" onClick={() => setShowSubmitForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already submitted banner */}
      {hasSubmitted && existingSubmission && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Your Submission
                </h3>
                <p className="text-sm text-green-700 mt-1">{existingSubmission.title}</p>
                <div className="flex items-center gap-3 mt-2 text-sm text-green-600">
                  <Badge variant={existingSubmission.status === "APPROVED" ? "success" : existingSubmission.status === "REJECTED" ? "destructive" : "warning"}>
                    {existingSubmission.status?.replace("_", " ")}
                  </Badge>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(existingSubmission.viewCount || 0)} views</span>
                </div>
              </div>
              <a href={existingSubmission.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}

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
